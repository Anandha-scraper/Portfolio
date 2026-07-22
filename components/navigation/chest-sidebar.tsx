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
import { cn } from "@/lib/utils";

const DOCK_SOCIALS = socials.filter((s) => ["GitHub", "LinkedIn"].includes(s.label));

const OPEN_EVENT = "open-chest-sidebar";
const CLOSE_EVENT = "close-chest-sidebar";

// Drawer geometry for the full-height nav.
const SIDEBAR = { width: 264, top: 88, bottom: 32 };

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
    setOpen(false);
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
        className="chest-sidebar__toggle"
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
            className="chest-sidebar__panel"
            style={{
              top: SIDEBAR.top,
              bottom: SIDEBAR.bottom,
              width: `min(${SIDEBAR.width}px, calc(100vw - 2rem))`,
            }}
          >
            {/* Nav — fills the full drawer height. */}
            <DungeonFrame wall={26} className={cn("chest-sidebar__frame", "font-pixel-readable")}>
              <div className="chest-sidebar__body">
                <p className={cn("chest-sidebar__label", "font-pixel")}>Navigate</p>

                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className={cn("chest-sidebar__nav-item", isActive && "chest-sidebar__nav-item--active")}
                    >
                      <Icon name={item.icon} size={18} className="chest-sidebar__nav-icon" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="chest-sidebar__divider" />

                <div className="chest-sidebar__socials">
                  {DOCK_SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="chest-sidebar__social-link"
                    >
                      <Icon name={s.icon} size={16} />
                    </a>
                  ))}
                </div>

                {/* Tall dungeon floor — ambient dwellers roam here. */}
                <div aria-hidden className="chest-sidebar__floor">
                  <div className="chest-sidebar__floor-line" />
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
          className="chest-sidebar__roamer"
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
