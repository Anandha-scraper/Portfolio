"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ship } from "@/components/ui/ship";
import PixelTrail, { type TrailPosition } from "@/components/ui/pixel-trail";
import { ACCENTS } from "@/lib/accents";
import { skillCategories } from "@/data/skills";
import { scrollToSection } from "@/lib/scroll";
import { CapabilityDungeon } from "./capability-dungeon";
import { ChartMap } from "./chart-map";
import { IslandNode } from "./island-node";
import { ROUTE_SLOTS, SHIP_HOME, type Point } from "./types";
import { cn } from "@/lib/utils";

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

  // Mirror the project-ecosystem: yield room to the sidebar when it opens.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setSidebarOpen(true);
    const onClose = () => setSidebarOpen(false);
    window.addEventListener("chest-sidebar-open", onOpen);
    window.addEventListener("chest-sidebar-close", onClose);
    return () => {
      window.removeEventListener("chest-sidebar-open", onOpen);
      window.removeEventListener("chest-sidebar-close", onClose);
    };
  }, []);

  const [leg, setLegState] = useState<Leg | null>(null);
  // Island the ship currently rests at. It survives the whole voyage — it only
  // flips once the ship docks at the next island — so that island can render its
  // "docked" (sea) art and stay lit. Starts at is1 (index 0), matching
  // shipIndexRef.
  const [dockedIndex, setDockedIndex] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // Which island's capability-dungeon panel is open (null = closed). Opens
  // when the ship *arrives* at an island (never on initial mount); closes on
  // a new voyage or via the panel's own close / Escape.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // While the chest sidebar is open, it renders the capability-dungeon card
  // itself — stacked below a half-height nav (see ChestSidebar) — instead of
  // it popping out beside the voyage stage, so the two fixed-position panels
  // never overlap on mobile. This section stays the source of truth for which
  // island is open; it just hands the card off via the same window-event bus
  // the chest sidebar already uses to announce its own open/close.
  useEffect(() => {
    const onCloseFromSidebar = () => setOpenIndex(null);
    window.addEventListener("close-capability-card", onCloseFromSidebar);
    return () => window.removeEventListener("close-capability-card", onCloseFromSidebar);
  }, []);

  // Announce which island's card is open (if any) so the chest sidebar can
  // mirror it into its own stacked panel.
  useEffect(() => {
    if (openIndex !== null) {
      window.dispatchEvent(new CustomEvent("capability-card-open", { detail: { index: openIndex } }));
    } else {
      window.dispatchEvent(new Event("capability-card-close"));
    }
  }, [openIndex]);

  // Fixed voyage layout — islands sit in a deliberate route (image.png), one
  // anchor per skill category, so the ship, chart line, and invisible anchor
  // cards all read off the same positions.
  const slots = ROUTE_SLOTS;

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

  // Measure the stage so percentage slots become pixel points.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slotPoint = useCallback(
    (i: number): Point => ({ x: (slots[i].xPct / 100) * size.w, y: (slots[i].yPct / 100) * size.h }),
    [size, slots]
  );
  // Ship home port — the ship's initial berth (is1), used only for the motion
  // div's `initial` position. Its resting spot thereafter is derived from the
  // docked island's slot (see `restPoint`), so it tracks stage resizes.
  const home: Point = {
    x: (SHIP_HOME.xPct / 100) * size.w,
    y: (SHIP_HOME.yPct / 100) * size.h,
  };

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
      const N = ROUTE_SLOTS.length;
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
    [slotPoint, size]
  );

  // Settle the ship at island `index`.
  const dockAt = useCallback((index: number) => {
    shipIndexRef.current = index;
    queueRef.current = [];
    targetRef.current = null;
    trailPosRef.current = null;
    setLeg(null);
    setDockedIndex(index);
    // Arriving at an island pops its capability dungeon.
    setOpenIndex(index);
  }, []);

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
        // No sailing under reduced motion — just dock at the chosen island.
        shipIndexRef.current = i;
        setDockedIndex(i);
        setOpenIndex(i);
        return;
      }
      // Re-click the current destination while sailing → arrive immediately.
      if (legRef.current && targetRef.current === i) {
        dockAt(i);
        return;
      }
      // Already docked here → nothing to do.
      if (!legRef.current && shipIndexRef.current === i) return;
      // Chart a fresh course from the ship's current island slot (always fresh,
      // so it stays correct after a stage resize).
      const from = slotPoint(shipIndexRef.current);
      const legs = buildRoute(from, shipIndexRef.current, i);
      if (!legs.length) return;
      // Close any open dungeon while a new voyage is under way; it re-opens
      // on arrival (dockAt).
      setOpenIndex(null);
      targetRef.current = i;
      queueRef.current = legs.slice(1);
      setLeg(legs[0]);
    },
    [reduce, dockAt, buildRoute, slotPoint]
  );

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
  // The card only renders inline beside the stage when the chest sidebar
  // isn't open — otherwise it's stacked into the sidebar itself (see
  // ChestSidebar), so nothing here needs to shrink to make room for it.
  const cardInline = openIndex !== null && !sidebarOpen;

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

      <div
        className={cn(
          "relative z-5 w-full px-3 pt-2 pb-12 transition-[padding] duration-400 sm:px-5 sm:pb-16",
          sidebarOpen && "lg:pl-[290px]"
        )}
      >
        {/* HUD */}
        <div className="-mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center font-pixel text-[0.5rem] uppercase tracking-wider text-ops-sand-faint">
          <span>
            {reduce
              ? "// click an island to reveal its stack"
              : "// set sail to an island to chart its stack"}
          </span>
        </div>

        {/* Voyage stage + capability dungeon share a row; on lg the stage
            flex-shrinks when the panel opens so the islands compress beside it.
            The stage carries the dark-ocean backdrop (capa_2) behind the grid /
            islands / ship, plus its nine-slice dungeon-wall border. */}
        <div className="relative flex w-full gap-3">
        <div
          ref={stageRef}
          className="pixelated relative h-[87vh] max-h-[1000px] min-h-[560px] w-full min-w-0 flex-1 overflow-hidden"
          style={{
            backgroundColor: "#0e1622",
            backgroundImage: "url(/capa_2.jpeg)",
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
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${SHIP_HOME.xPct}%`, top: `${SHIP_HOME.yPct}%`, width: "clamp(130px, 20vw, 200px)", aspectRatio: "1" }}
            />
            {slots.map((slot, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%`, width: "clamp(130px, 20vw, 200px)", aspectRatio: "1" }}
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
              position while it sails between islands. */}
          {size.w > 0 && (
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
              width={cardInline ? "clamp(90px, 14vw, 150px)" : "clamp(130px, 20vw, 200px)"}
              active={(leg ? targetRef.current : dockedIndex) === i}
              atShip={!leg && dockedIndex === i}
              onHover={setHoverIndex}
              onSelect={select}
            />
          ))}

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
                  flight, so the ship reads as actually sailing the swell. */}
              <motion.div
                className="flex h-full w-full items-center justify-center"
                animate={!reduce && leg ? { y: [0, -9, 0, 7, 0], rotate: [-3, 3, -2, 2, -3] } : { y: 0, rotate: 0 }}
                transition={
                  !reduce && leg
                    ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.25 }
                }
              >
                <Ship
                  frame={shipFrameProps.frame}
                  flip={shipFrameProps.flip}
                  width={cardInline ? 84 : 108}
                  className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Capability dungeon — pops from the right on ship arrival. On lg it
            is a static flex column (pushing/shrinking the stage); below lg it
            overlays the right of the stage. While the chest sidebar is open,
            it renders this card itself (stacked below its nav) instead, so
            it's skipped here to avoid two copies / overlapping panels. */}
        <AnimatePresence>
          {openIndex !== null && !sidebarOpen && (
            <CapabilityDungeon
              key={skillCategories[openIndex].id}
              category={skillCategories[openIndex]}
              takeFocus
              onClose={() => setOpenIndex(null)}
              className="absolute inset-y-0 right-0 z-50 w-[86%] max-w-sm lg:static lg:inset-auto lg:z-auto lg:w-[clamp(320px,32%,460px)] lg:max-w-none lg:self-stretch"
            />
          )}
        </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
