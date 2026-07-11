"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { Icon } from "@/components/ui/icon";
import { NAV_ITEMS, SECTION_IDS } from "@/lib/constants";
import { socials } from "@/data/socials";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { useActiveSection } from "@/hooks/use-active-section";
import { scrollToSection } from "@/lib/scroll";
import { DOCK } from "@/lib/capability-dock";
import { cn } from "@/lib/utils";

const DOCK_SOCIALS = socials.filter((s) => ["GitHub", "LinkedIn"].includes(s.label));

const OPEN_EVENT = "open-chest-sidebar";
const CLOSE_EVENT = "close-chest-sidebar";

// Drawer geometry for the normal (undocked) full-height nav. When the
// Capabilities tech dungeon docks beneath the drawer, the shared height/width come
// from `DOCK` (lib/capability-dock) so the nav and dungeon stay in lockstep.
const SIDEBAR = { width: 264, top: DOCK.top, bottom: DOCK.bottom };

/** Imperatively open the dungeon sidebar from anywhere (e.g. the idle companion). */
export function openChestSidebar() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Imperatively close the dungeon sidebar (e.g. the Capabilities idle timer). */
export function closeChestSidebar() {
  window.dispatchEvent(new Event(CLOSE_EVENT));
}

export function ChestSidebar() {
  const [open, setOpen] = useState(false);
  // The Capabilities tech dungeon docks beneath the drawer; while docked the nav
  // shrinks to the top portion and widens to the shared 1/3-viewport column.
  const [dungeonDocked, setDungeonDocked] = useState(false);
  const reduceMotion = useReducedMotion();
  const active = useActiveSection(SECTION_IDS);
  const panelId = useId();

  const chestRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Open/close imperatively (e.g. the idle companion opens; the Capabilities idle
  // timer closes).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener(CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener(CLOSE_EVENT, onClose);
    };
  }, []);

  // Track whether the Capabilities tech dungeon is docked beneath the drawer.
  useEffect(() => {
    const onDock = () => setDungeonDocked(true);
    const onUndock = () => setDungeonDocked(false);
    window.addEventListener("capability-dungeon-open", onDock);
    window.addEventListener("capability-dungeon-close", onUndock);
    return () => {
      window.removeEventListener("capability-dungeon-open", onDock);
      window.removeEventListener("capability-dungeon-close", onUndock);
    };
  }, []);

  // Broadcast open/close so other surfaces can react to the sidebar's state
  // (the idle companion suppresses its chest march; the Projects dungeon shifts).
  useEffect(() => {
    window.dispatchEvent(new Event(open ? "chest-sidebar-open" : "chest-sidebar-close"));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (chestRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: (typeof NAV_ITEMS)[number]["id"]) => {
    scrollToSection(id);
    // Navigating into Capabilities: leave the drawer open — the section's
    // active-section effect re-docks it (nav + tech dungeon) in one motion, so
    // force-closing here would only cause a close→open flicker.
    if (id !== "capabilities") setOpen(false);
  };

  const chest = SPRITE_CONTROL.chest;

  return (
    <div>
      {/* Chest — the toggle. Sits over the panel's top-left like a lid. */}
      <button
        ref={chestRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        className="fixed left-4 top-4 z-[80] flex items-center justify-center rounded-md border border-ops-line bg-ops-surface/80 p-1.5 backdrop-blur-md transition-colors hover:border-ops-rust/50"
      >
        <PixelSprite
          src={chest.src}
          frames={chest.frames}
          frameSize={chest.frameSize}
          scale={chest.scale}
          frameMs={chest.frameMs}
          mode="once"
          direction={open ? "forward" : "reverse"}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="navigation"
            aria-label="Primary"
            initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed left-4 z-[75] flex flex-col gap-3 transition-[width,height] duration-400 ease-out"
            style={{
              top: SIDEBAR.top,
              ...(dungeonDocked
                ? { height: DOCK.navHeight, width: DOCK.width }
                : { bottom: SIDEBAR.bottom, width: `min(${SIDEBAR.width}px, calc(100vw - 2rem))` }),
            }}
          >
            {/* Nav — fills the full drawer height (the Capabilities skill card
                now lives beside the voyage stage, not stacked in here). */}
            <DungeonFrame
              wall={26}
              className="flex min-h-0 flex-1 flex-col font-pixel-readable text-ops-sand"
            >
              <div className="relative flex h-full min-h-0 flex-col gap-1 p-3">
                <p className="font-pixel mb-2 text-[0.5rem] uppercase tracking-widest text-ops-sand-soft">
                  Navigate
                </p>

                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-sm px-2 py-1.5 text-left text-xl leading-none transition-colors",
                        isActive
                          ? "bg-ops-rust/15 text-ops-rust"
                          : "text-ops-sand hover:bg-ops-surface-2/60 hover:text-ops-olive-bright"
                      )}
                    >
                      <Icon name={item.icon} size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="my-2 h-px bg-ops-line-strong" />

                <div className="flex items-center gap-2 px-2">
                  {DOCK_SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ops-line text-ops-sand-soft transition-colors hover:border-ops-rust/50 hover:text-ops-sand"
                    >
                      <Icon name={s.icon} size={16} />
                    </a>
                  ))}
                </div>

                {/* Tall dungeon floor — ambient dwellers roam here. */}
                <div
                  aria-hidden
                  className="relative mt-auto min-h-0 flex-1 overflow-hidden"
                >
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ops-line-strong" />
                  <FloorRoamers reduceMotion={!!reduceMotion} />
                </div>
              </div>
            </DungeonFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- the dungeon dwellers roam the floor band in 2D, avoiding each other ----
// Roam bounds as % of the floor band (leave room for each sprite's footprint),
// and the closest two dwellers may approach before they steer apart.
const ROAM = { maxX: 84, maxY: 78, minGap: 30 };

type Roamer = {
  pos: { x: number; y: number };
  target: { x: number; y: number };
  pauseUntil: number;
  facing: 1 | -1;
};

function randTarget() {
  return { x: Math.random() * ROAM.maxX, y: Math.random() * ROAM.maxY };
}

function FloorRoamers({ reduceMotion }: { reduceMotion: boolean }) {
  const { chars, scale, frameSize, wanderSpeed, pauseMsMin, pauseMsMax } =
    SPRITE_CONTROL.floorChars;
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const wraps = wrapRefs.current;
    if (wraps.length === 0) return;

    // Set initial positions (React won't touch these — not in JSX style)
    wraps.forEach((w, i) => {
      if (w) {
        w.style.left = `${6 + i * 22}%`;
        w.style.top = `${(i % 2) * 40 + 10}%`;
      }
    });

    // Spread starting spots diagonally so nobody begins stacked.
    const roamers: Roamer[] = chars.map((_, i) => ({
      pos: { x: 6 + i * 22, y: (i % 2) * 40 + 10 },
      target: randTarget(),
      pauseUntil: 0,
      facing: 1,
    }));

    const pickTarget = (r: Roamer, now: number) => {
      r.target = randTarget();
      r.pauseUntil = now + pauseMsMin + Math.random() * (pauseMsMax - pauseMsMin);
    };

    // Would `next` land within minGap of any other roamer's current pos?
    const collides = (self: number, next: { x: number; y: number }) =>
      roamers.some((o, j) => {
        if (j === self) return false;
        const dx = next.x - o.pos.x;
        const dy = next.y - o.pos.y;
        return dx * dx + dy * dy < ROAM.minGap * ROAM.minGap;
      });

    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const step = wanderSpeed * dt;

      roamers.forEach((r, i) => {
        if (now >= r.pauseUntil) {
          const dx = r.target.x - r.pos.x;
          const dy = r.target.y - r.pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1) {
            pickTarget(r, now); // arrived -> rest, then choose a new spot
          } else {
            const nx = r.pos.x + (dx / dist) * step;
            const ny = r.pos.y + (dy / dist) * step;
            if (collides(i, { x: nx, y: ny })) {
              pickTarget(r, now); // path blocked -> steer elsewhere
            } else {
              r.facing = dx < 0 ? -1 : 1;
              r.pos.x = Math.max(0, Math.min(ROAM.maxX, nx));
              r.pos.y = Math.max(0, Math.min(ROAM.maxY, ny));
            }
          }
        }

        const wrap = wraps[i];
        if (wrap) {
          wrap.style.left = `${r.pos.x}%`;
          wrap.style.top = `${r.pos.y}%`;
          wrap.style.transform = `scaleX(${r.facing})`;
        }
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, chars, wanderSpeed, pauseMsMin, pauseMsMax]);

  return (
    <>
      {chars.map((char, i) => (
        <div
          key={char.src}
          ref={(el) => {
            wrapRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
        >
          <PixelSprite
            src={char.src}
            frames={char.frames}
            frameSize={frameSize}
            scale={scale}
            frameMs={char.frameMs}
            bob
          />
        </div>
      ))}
    </>
  );
}
