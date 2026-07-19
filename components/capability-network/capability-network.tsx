"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ship } from "@/components/ui/ship";
import { Icon } from "@/components/ui/icon";
import { closeChestSidebar, openChestSidebar } from "@/components/navigation/chest-sidebar";
import type { TrailPosition } from "@/components/ui/pixel-trail";
import { ACCENTS } from "@/lib/accents";
import { skillCategories } from "@/data/skills";
import { socials } from "@/data/socials";
import { scrollToSection } from "@/lib/scroll";
import { DOCK } from "@/lib/capability-dock";
import { NAV_ITEMS, SECTION_IDS } from "@/lib/constants";
import { useActiveSection } from "@/hooks/use-active-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { CapabilityDungeon } from "./capability-dungeon";
import { ChartMap } from "./chart-map";
import { IslandNode } from "./island-node";
import { computeSlots, type Point } from "./types";

// Same GitHub/LinkedIn-only filter chest-sidebar.tsx uses for its compact
// socials row — duplicated here (not hoisted) since it's a one-line filter
// and the two call sites otherwise share no other code.
const MOBILE_NAV_SOCIALS = socials.filter((s) => ["GitHub", "LinkedIn"].includes(s.label));

// Code-split: PixelTrail pulls in three.js/@react-three/fiber/drei for a
// purely decorative wake effect — deferred off the initial JS payload since
// CapabilityNetwork itself isn't lazy-loaded (it's above the fold).
const PixelTrail = dynamic(() => import("@/components/ui/pixel-trail"), {
  ssr: false,
});

/**
 * CapabilityNetwork — "The Voyage". The skill categories from data/skills.ts are
 * islands ringed around a centre berth. The ship rests dead-centre (docked at no
 * island) until the user picks a course; there is no auto-tour. Hovering /
 * focusing an island charts a preview route line to it. Clicking sets sail there
 * — a slow voyage whose duration scales with the distance travelled, with a
 * cartoon up/down rocking motion — and the ship simply docks at that island on
 * arrival (no popup card). Clicking the in-flight target again makes the ship
 * arrive immediately. Reduced-motion users get no sailing: a click docks at once.
 */

// Voyage pace: slower the farther the island. Duration = distance / SAIL_SPEED,
// clamped so very short / very long legs still feel deliberate. Per-island legs
// are shorter (the ship hops island-to-island) than the old direct flights.
const SAIL_SPEED = 120; // px per second
const SAIL_MS_MIN = 700;
const SAIL_MS_MAX = 2600;
// How far off the stage edge the ship sails before wrapping is6 ↔ is1.
const EDGE_MARGIN = 160;

// The ship's wake reads as disturbed sea water, so it's painted in a fixed ocean
// teal rather than the active island's accent (the chart route line keeps the
// accent). The enlarged grid / trail / age / interpolate make the splash bigger
// and longer-lived for a more realistic churned-water wake.
const OCEAN_WAKE = "#3f8ea3";
const WAKE = { gridSize: 160, trailSize: 0.12, maxAge: 1500, interpolate: 8 } as const;
// Paint the wake this far AHEAD of the hull along the heading, so the churned
// water reads as breaking before the bow rather than only trailing behind.
const WAKE_LEAD_PX = 48;

const sailDuration = (from: Point, to: Point) => {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.min(SAIL_MS_MAX, Math.max(SAIL_MS_MIN, (dist / SAIL_SPEED) * 1000));
};

// A single animated hop. The ship works through a queue of these so a chosen
// course passes through every intermediate island (and wraps off-screen at the
// is6 ↔ is1 seam) rather than flying a straight diagonal.
interface Leg {
  fromPoint: Point;
  to: Point;
  ms: number;
  frame: number;
  flip: boolean;
  instant?: boolean; // teleport across the seam — no animation, no wake
  arriveIndex?: number; // ship is docked at this island once the hop ends
  openOnArrive?: boolean; // final hop of the course → dock the ship here
}

export function CapabilityNetwork() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The wake's three.js canvas only earns its keep on desktop pointers and
  // only while a voyage is in flight — everywhere else it would just burn GPU.
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const isMobileLayout = useMediaQuery("(max-width: 1023.5px)");

  // The tech dungeon docks under the chest sidebar as a single left-column unit.
  // It is visible IFF the Capabilities section is active AND the chest sidebar is
  // open AND the ship is at rest — a single reconcile() (below) is the only code
  // path that flips it, so the nav + tech dungeon can never desync or orphan.
  const [dungeonOpen, setDungeonOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dungeonOpenRef = useRef(false);
  const sidebarOpenRef = useRef(false);

  const active = useActiveSection(SECTION_IDS);
  const activeRef = useRef(active);
  activeRef.current = active;

  const [leg, setLegState] = useState<Leg | null>(null);
  // Island the ship currently rests at. It survives the whole voyage — it only
  // flips once the ship docks at the next island — so that island can render its
  // "docked" (sea) art and stay lit. Starts at is1 (index 0), matching
  // shipIndexRef.
  const [dockedIndex, setDockedIndex] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // Arrival "salvo" — a short fire burst at the island the ship just docked at.
  const [salvo, setSalvo] = useState<{ index: number; key: number } | null>(null);
  const salvoTimer = useRef<number | null>(null);

  // Voyage layout — one anchor per skill category. Landscape keeps the classic
  // zig-zag; portrait stages switch to a 2×3 serpentine so islands never
  // crowd at phone widths (computeSlots, ./types.ts).
  const slots = computeSlots(size.w, size.h);

  // Refs mirror state so the animation callbacks stay current.
  const legRef = useRef<Leg | null>(null);
  const setLeg = (l: Leg | null) => {
    legRef.current = l;
    setLegState(l);
  };
  const shipIndexRef = useRef<number>(0); // ship starts docked at is1
  // Remaining hops of the current course, and its ultimate destination island.
  const queueRef = useRef<Leg[]>([]);
  const targetRef = useRef<number | null>(null);
  // Ship's live normalised position, read each frame by the PixelTrail wake.
  const trailPosRef = useRef<TrailPosition | null>(null);
  // Below lg the dungeon renders as an in-flow block under the stage — after
  // an explicit dock (voyage end / reduced-motion click) bring it into view.
  const mobileDockRef = useRef<HTMLDivElement>(null);
  const scrollDockPending = useRef(false);

  // The one rule: the tech dungeon shows only in Capabilities, while the sidebar
  // is open and the ship is at rest. Dispatch the shared events so the sidebar
  // shrinks its height (docks) in lockstep.
  const reconcile = useCallback(() => {
    const show =
      activeRef.current === "capabilities" && sidebarOpenRef.current && !legRef.current;
    dungeonOpenRef.current = show;
    setDungeonOpen(show);
    window.dispatchEvent(new Event(show ? "capability-dungeon-open" : "capability-dungeon-close"));
  }, []);

  // Ask the chest sidebar to open/close, then reconcile the tech dungeon to it.
  const requestSidebar = useCallback(
    (open: boolean) => {
      sidebarOpenRef.current = open;
      if (open) openChestSidebar();
      else closeChestSidebar();
      reconcile();
    },
    [reconcile]
  );
  // Open the dock for island `i` (selects its dungeon content); close the dock.
  const openDock = useCallback(
    (i: number) => {
      setSelectedIndex(i);
      requestSidebar(true);
    },
    [requestSidebar]
  );
  const closeDock = useCallback(() => requestSidebar(false), [requestSidebar]);

  // Mirror external chest toggles (chest button / outside-click / Esc) into the
  // tech dungeon, so nav + dungeon always move together as one unit.
  useEffect(() => {
    const onOpen = () => {
      sidebarOpenRef.current = true;
      reconcile();
    };
    const onClose = () => {
      sidebarOpenRef.current = false;
      reconcile();
    };
    window.addEventListener("chest-sidebar-open", onOpen);
    window.addEventListener("chest-sidebar-close", onClose);
    return () => {
      window.removeEventListener("chest-sidebar-open", onOpen);
      window.removeEventListener("chest-sidebar-close", onClose);
    };
  }, [reconcile]);

  // Measure the stage so percentage slots become pixel points. Coalesced to at
  // most once per animation frame — the stage width is actively easing during
  // the sidebar open/close transition (transition-[padding]), and calling
  // setSize on every raw ResizeObserver callback would re-render the whole
  // scene on every tick of that 400ms transition.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize({ w: width, h: height }));
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const slotPoint = useCallback(
    (i: number): Point => ({ x: (slots[i].xPct / 100) * size.w, y: (slots[i].yPct / 100) * size.h }),
    [size, slots]
  );
  // Ship home port — the ship's initial berth (is1), used only for the motion
  // div's `initial` position. Its resting spot thereafter is derived from the
  // docked island's slot (see `restPoint`), so it tracks stage resizes.
  const home: Point = {
    x: (slots[0].xPct / 100) * size.w,
    y: (slots[0].yPct / 100) * size.h,
  };

  // Island / ship footprint in px, from the measured stage — never lets six
  // islands overlap at narrow widths (the old `18vw` clamp tracked the
  // viewport, not the stage, and ignored height entirely).
  const islandW = Math.round(
    Math.max(92, Math.min(size.w * 0.2, size.h * 0.24, 210)),
  );
  const shipW = Math.round(Math.max(56, Math.min(islandW * 0.55, 90)));

  const headingFrame = (from: Point, to: Point) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx > ady * 1.6) return { frame: 5, flip: dx < 0 }; // broadside
    if (ady > adx * 1.6) return { frame: 3, flip: false }; // bow-on
    return { frame: 4, flip: dx < 0 }; // three-quarter
  };

  // Build the queue of hops from the ship's current island to `target`, taking
  // the shorter way around the cyclic chain (forward, or backward through the
  // intermediate islands). Forward past is6 — and backward past is1 — wraps off
  // the stage edge and re-enters from the other side.
  const buildRoute = useCallback(
    (from: Point, cur: number, target: number): Leg[] => {
      const N = slots.length;
      const fwd = (target - cur + N) % N;
      const bwd = (cur - target + N) % N;
      const dir = fwd <= bwd ? 1 : -1;

      const legs: Leg[] = [];
      let f = from;
      let idx = cur;
      while (idx !== target) {
        const next = (idx + dir + N) % N;
        const wrap = (dir > 0 && idx === N - 1) || (dir < 0 && idx === 0);
        const nextPt = slotPoint(next);
        if (wrap) {
          // Sail off the exit edge, teleport to the opposite edge, sail in.
          const exitPt: Point = dir > 0 ? { x: size.w + EDGE_MARGIN, y: f.y } : { x: -EDGE_MARGIN, y: f.y };
          const entryPt: Point = dir > 0 ? { x: -EDGE_MARGIN, y: nextPt.y } : { x: size.w + EDGE_MARGIN, y: nextPt.y };
          legs.push({ fromPoint: f, to: exitPt, ms: sailDuration(f, exitPt), ...headingFrame(f, exitPt) });
          legs.push({ fromPoint: exitPt, to: entryPt, ms: 0, instant: true, ...headingFrame(entryPt, nextPt) });
          legs.push({ fromPoint: entryPt, to: nextPt, ms: sailDuration(entryPt, nextPt), ...headingFrame(entryPt, nextPt), arriveIndex: next });
        } else {
          legs.push({ fromPoint: f, to: nextPt, ms: sailDuration(f, nextPt), ...headingFrame(f, nextPt), arriveIndex: next });
        }
        f = nextPt;
        idx = next;
      }
      if (legs.length) legs[legs.length - 1].openOnArrive = true;
      return legs;
    },
    [slotPoint, size, slots]
  );

  // Settle the ship at island `index`.
  const dockAt = useCallback(
    (index: number) => {
      shipIndexRef.current = index;
      queueRef.current = [];
      targetRef.current = null;
      trailPosRef.current = null;
      setLeg(null);
      // The tech dungeon drawer mirrors the docked island (falls back to it when
      // no island has been explicitly selected yet).
      setDockedIndex(index);
      // Voyage complete → reopen the nav + dungeon for the newly-docked island.
      scrollDockPending.current = true;
      openDock(index);
      // Arrival salvo — a short burst at the dock point (skipped under
      // reduced motion; cleared after the burst plays out).
      if (!reduce) {
        setSalvo((s) => ({ index, key: (s?.key ?? 0) + 1 }));
        if (salvoTimer.current) window.clearTimeout(salvoTimer.current);
        salvoTimer.current = window.setTimeout(() => setSalvo(null), 750);
      }
    },
    [openDock, reduce]
  );

  useEffect(
    () => () => {
      if (salvoTimer.current) window.clearTimeout(salvoTimer.current);
    },
    []
  );

  // A hop finished: advance the ship one island, then either run the next hop or
  // dock at the destination.
  const onArrive = useCallback(() => {
    const l = legRef.current;
    if (!l) return;
    if (l.arriveIndex !== undefined) shipIndexRef.current = l.arriveIndex;
    if (l.openOnArrive) {
      dockAt(shipIndexRef.current);
      return;
    }
    const next = queueRef.current.shift();
    if (next) setLeg(next);
    else setLeg(null);
  }, [dockAt]);

  // Click / Enter: set a course to island `i`. The ship hops there through every
  // intermediate island. Re-clicking the destination mid-voyage arrives now.
  const select = useCallback(
    (i: number) => {
      // Snap the whole section into view, even if it's only half-scrolled.
      scrollToSection("capabilities");
      if (reduce) {
        // No sailing under reduced motion — dock at once and show its dungeon.
        shipIndexRef.current = i;
        setDockedIndex(i);
        scrollDockPending.current = true;
        openDock(i);
        return;
      }
      // Re-click the current destination while sailing → arrive immediately
      // (dockAt reopens the dungeon for it).
      if (legRef.current && targetRef.current === i) {
        dockAt(i);
        return;
      }
      // Already docked here → just (re)open its dungeon.
      if (!legRef.current && shipIndexRef.current === i) {
        openDock(i);
        return;
      }
      // Different island → collapse the whole dock (nav + dungeon) so the ship
      // sails across the full width unobstructed; it reopens on arrival.
      closeDock();
      // Chart a fresh course from the ship's current island slot (always fresh,
      // so it stays correct after a stage resize).
      const from = slotPoint(shipIndexRef.current);
      const legs = buildRoute(from, shipIndexRef.current, i);
      if (!legs.length) return;
      targetRef.current = i;
      queueRef.current = legs.slice(1);
      setLeg(legs[0]);
    },
    [reduce, dockAt, buildRoute, slotPoint, openDock, closeDock]
  );

  // Hovering an island only charts a preview route line.
  const onIslandHover = useCallback((i: number | null) => setHoverIndex(i), []);

  // After an explicit dock on the mobile layout, bring the stacked dungeon
  // block into view (it renders below the stage, off-screen otherwise).
  useEffect(() => {
    if (!scrollDockPending.current) return;
    if (!dungeonOpen) return;
    scrollDockPending.current = false;
    if (!isMobileLayout) return;
    mobileDockRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, [dungeonOpen, dockedIndex, selectedIndex, isMobileLayout, reduce]);

  // Entering Capabilities auto-opens the dock (default = Frontend, the ship's
  // berth); leaving collapses it. While the ship is sailing the dock stays closed
  // (it reopens on arrival via dockAt).
  const wasCapabilitiesRef = useRef(false);
  useEffect(() => {
    const isCapabilities = active === "capabilities";
    if (isCapabilities) {
      if (!legRef.current) openDock(shipIndexRef.current);
    } else if (wasCapabilitiesRef.current) {
      closeDock();
    }
    wasCapabilitiesRef.current = isCapabilities;
  }, [active, openDock, closeDock]);

  // Derived visuals. While sailing, the active island is the course's ultimate
  // destination (targetRef), not the intermediate hop.
  const lineIndex = leg ? targetRef.current : hoverIndex;
  const activeHex =
    lineIndex !== null ? ACCENTS[skillCategories[lineIndex].accent].hex : "#ddd0b0";
  // The route line shows only while sailing (the active leg) or while hovering a
  // different island (a preview from the ship's current position) — never by
  // default.
  const previewTarget =
    !leg && hoverIndex !== null && hoverIndex !== shipIndexRef.current
      ? slotPoint(hoverIndex)
      : null;
  // The ship's resting berth is its docked island's slot — derived from `size`
  // every render, so it tracks stage resizes (e.g. the panel shrinking the
  // stage). Before the first measure this is (0,0); the ship only renders once
  // size.w > 0, and the motion div's `initial` seeds it at the home port.
  const restPoint = slotPoint(dockedIndex);
  const shipTarget = leg ? leg.to : restPoint;
  const shipFrameProps = leg ? { frame: leg.frame, flip: leg.flip } : { frame: 3, flip: false };

  return (
    <section id="capabilities" className="ops ops-scanlines relative w-full overflow-hidden scroll-mt-24">
      {/* Desert-ops legibility wash — kept light so the global boxed-line grid
          stays visible through it (no background image in this section). */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(20,17,12,0.5),rgba(20,17,12,0.16)_42%,rgba(20,17,12,0.06)_70%,rgba(20,17,12,0)_100%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-28 bg-gradient-to-b from-canvas to-transparent" />

      <h2 className="sr-only">Capabilities</h2>

      <div className="relative z-5 w-full px-3 pt-2 pb-12 sm:px-5 sm:pb-16">
        {/* HUD */}
        <div className="relative z-10 mb-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center font-pixel text-[0.5rem] uppercase tracking-wider text-ops-sand-faint">
          <span>
            {reduce
              ? "// click an island to reveal its stack"
              : "// set sail to an island to chart its stack"}
          </span>
        </div>

        {/* Voyage stage — full width. The tech dungeon no longer sits inline; it
            docks under the chest sidebar as the bottom of the left 1/3-viewport
            column (rendered below, opened on island select). The stage carries
            the dark-ocean backdrop (capabg) behind the grid / islands / ship,
            plus its nine-slice dungeon-wall border. */}
        <div
          ref={stageRef}
          className={cn(
            "pixelated relative h-[87vh] max-h-[1000px] min-h-[560px] w-full min-w-0 overflow-hidden transition-[margin] duration-400",
            // Yield to the fixed nav + dungeon column while it's open so the
            // is1 berth (and the ship docked there) is never hidden behind it;
            // the ResizeObserver re-derives slots for the narrower stage.
            // Keep in sync with DOCK.stagePad (lib/capability-dock.ts).
            dungeonOpen && "lg:ml-[420px] lg:w-auto"
          )}
          style={{
            backgroundColor: "#0e1622",
            backgroundImage: "url(/capabg.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderStyle: "solid",
            borderWidth: "clamp(16px, 2.4vw, 30px)",
            borderColor: "transparent",
            borderImageSource: "url(/sprites/dungeon/wall_9slice.png)",
            borderImageSlice: "16",
            borderImageRepeat: "repeat",
          }}
        >
          {/* Invisible anchor cards — a structural layer pinning the ship home
              and every island slot, so the arrangement reads as a deliberate
              composition. Purely positional: no visible border / background. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            {slots.map((slot, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%`, width: islandW * 1.35, aspectRatio: "1" }}
              />
            ))}
          </div>

          {/* Nautical chart — grid + the single active / preview route line. */}
          <ChartMap
            size={size}
            shipAt={leg ? leg.fromPoint : restPoint}
            target={leg ? leg.to : previewTarget}
            activeHex={activeHex}
          />

          {/* Pixel wake (ref.txt #2) — a gooey trail painted at the ship's
              position while it sails between islands. Mounted only while a
              voyage is in flight, on fine pointers, with motion allowed — so
              the three.js render loop never runs idle or on mobile. */}
          {size.w > 0 && leg && finePointer && !reduce && (
            <PixelTrail
              positionRef={trailPosRef}
              color={OCEAN_WAKE}
              gridSize={WAKE.gridSize}
              trailSize={WAKE.trailSize}
              maxAge={WAKE.maxAge}
              interpolate={WAKE.interpolate}
              className="pointer-events-none z-[45]"
            />
          )}

          {/* Islands */}
          {skillCategories.map((category, i) => (
            <IslandNode
              key={category.id}
              category={category}
              index={i}
              slot={slots[i]}
              width={islandW}
              active={(leg ? targetRef.current : dockedIndex) === i}
              atShip={!leg && dockedIndex === i}
              onHover={onIslandHover}
              onSelect={select}
            />
          ))}

          {/* Arrival salvo — accent-lit fire burst at the freshly docked
              island (SPRITE_CONTROL.fire art, single-frame, scaled + faded
              by motion). Skipped under reduced motion (never set then). */}
          <AnimatePresence>
            {salvo && size.w > 0 && (
              <motion.div
                key={salvo.key}
                aria-hidden
                className="pointer-events-none absolute z-[46]"
                style={{ left: slotPoint(salvo.index).x, top: slotPoint(salvo.index).y }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.45] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sprites/fire/explosive_fire.png"
                  alt=""
                  width={Math.round(islandW * 0.55)}
                  className="pixelated -translate-x-1/2 -translate-y-1/2"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* The ship */}
          {size.w > 0 && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute z-40"
              style={{ left: 0, top: 0, width: 120, height: 96, marginLeft: -60, marginTop: -48 }}
              initial={{ x: home.x, y: home.y }}
              animate={{ x: shipTarget.x, y: shipTarget.y }}
              transition={{ duration: (leg ? leg.ms : 0) / 1000, ease: "easeInOut" }}
              onUpdate={(latest) => {
                const l = legRef.current;
                if (!l || l.instant || size.w === 0) {
                  trailPosRef.current = null;
                  return;
                }
                // Lead the wake ahead of the hull along the heading, so the
                // foam breaks before the bow instead of only trailing behind.
                const hx = l.to.x - l.fromPoint.x;
                const hy = l.to.y - l.fromPoint.y;
                const hlen = Math.hypot(hx, hy) || 1;
                const px = (latest.x as number) + (hx / hlen) * WAKE_LEAD_PX;
                const py = (latest.y as number) + (hy / hlen) * WAKE_LEAD_PX;
                const u = px / size.w;
                const v = py / size.h;
                // Only leave a wake while on-stage (suppresses the seam teleport).
                trailPosRef.current = u < 0 || u > 1 || v < 0 || v > 1 ? null : { u, v };
              }}
              onAnimationComplete={() => {
                if (legRef.current) onArrive();
              }}
            >
              {/* Cartoon rocking — exaggerated up/down + roll while a leg is in
                  flight, so the ship reads as actually sailing the swell; one
                  celebratory bounce right after docking (salvo). */}
              <motion.div
                className="flex h-full w-full items-center justify-center"
                animate={
                  !reduce && leg
                    ? { y: [0, -9, 0, 7, 0], rotate: [-3, 3, -2, 2, -3] }
                    : !reduce && salvo
                      ? { y: [0, -8, 0], rotate: 0, scale: [1, 1.14, 1] }
                      : { y: 0, rotate: 0, scale: 1 }
                }
                transition={
                  !reduce && leg
                    ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                    : !reduce && salvo
                      ? { duration: 0.5, ease: "easeOut" }
                      : { duration: 0.25 }
                }
              >
                <Ship
                  frame={shipFrameProps.frame}
                  flip={shipFrameProps.flip}
                  width={shipW}
                  className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Tech dungeon — docks under the chest sidebar as the bottom of the
            left 1/3-viewport column. Opens on island select (content follows the
            selected island immediately), auto-dismisses with the sidebar on idle.
            Fixed overlay only at lg:+ — below that the stacked block just below
            takes over so nothing overlaps the map. */}
        <AnimatePresence>
          {dungeonOpen && (
            <motion.div
              key="capability-dungeon-drawer"
              className="fixed left-4 z-[75] hidden lg:block"
              style={{
                top: DOCK.dungeonTop,
                bottom: DOCK.bottom,
                width: DOCK.dungeonWidth,
              }}
              initial={reduce ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <CapabilityDungeon
                category={skillCategories[selectedIndex ?? dockedIndex]}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile stacked dock — below lg the fixed nav+dungeon overlay above is
            hidden; instead render dungeon header (top ~1/3) → nav → chart as one
            in-flow block, scoped to this section only. chest-sidebar.tsx hides its
            own fixed drawer while docked on mobile so this is the only nav shown. */}
        {dungeonOpen && (
          <div ref={mobileDockRef} className="mt-4 w-full scroll-mt-20 lg:hidden">
            <CapabilityDungeon
              category={skillCategories[selectedIndex ?? dockedIndex]}
              navSlot={<MobileCapabilityNav active={active} />}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/** Compact nav list for the mobile stacked capability dock (see above) — reuses
 *  the same nav items / socials chest-sidebar.tsx renders in its fixed drawer,
 *  without that drawer's DungeonFrame/floor-roamer chrome (too tall for a
 *  block that also has to fit a header and a chart in the page's normal flow). */
function MobileCapabilityNav({ active }: { active: string | null }) {
  return (
    <div className="mb-2 flex shrink-0 flex-col gap-1 border-b border-ops-line/70 pb-2 font-pixel-readable text-ops-sand">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={cn(
              "flex items-center gap-2 rounded-sm px-1.5 py-1 text-left text-sm leading-none transition-colors",
              isActive
                ? "bg-ops-rust/15 text-ops-rust"
                : "text-ops-sand hover:bg-ops-surface-2/60 hover:text-ops-olive-bright"
            )}
          >
            <Icon name={item.icon} size={14} className="shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
      <div className="mt-1 flex items-center gap-2 px-1.5">
        {MOBILE_NAV_SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-ops-line text-ops-sand-soft transition-colors hover:border-ops-rust/50 hover:text-ops-sand"
          >
            <Icon name={s.icon} size={14} />
          </a>
        ))}
      </div>
    </div>
  );
}
