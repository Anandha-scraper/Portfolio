"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { openChestSidebar } from "@/components/navigation/chest-sidebar";
import { cn } from "@/lib/utils";

/**
 * SkeletonCompanion — a pixel-art skeleton that lives over the whole portfolio
 * and reacts to the cursor. Sprite sheets / all tuning come from
 * lib/sprite-control.ts (the master control), sheets from /public/sprites.
 *
 * Three switchable follow behaviours (so the best one can be chosen by feel):
 *   • chase  — always walks toward the cursor, idles once it catches up.
 *   • rest   — idles in place; only walks to the cursor after it has been still
 *              for `idleDelayMs`, then idles again.
 *   • wander — drifts on its own; walks toward the cursor whenever you move the
 *              mouse, and resumes drifting after `idleDelayMs` of stillness.
 *
 * Idle takeover: in any mode, once the cursor has been still for
 * SPRITE_CONTROL.companion.idleToChestMs, the skeleton marches to the chest
 * (top-left), does a quick lunge "attack", and pops the dungeon sidebar open.
 * It re-arms the moment you move the mouse again.
 *
 * Everything runs in a single requestAnimationFrame loop that writes transforms
 * straight to the DOM (no per-frame React re-render). Honours reduced-motion and
 * is hidden on touch / no-hover devices.
 */

type Mode = "chase" | "rest" | "wander";

interface SkeletonCompanionProps {
  /** Follow behaviour. Default "chase". */
  mode?: Mode;
  /** Stillness (ms) before the skeleton settles / re-decides. Tune 1000–3000. */
  idleDelayMs?: number;
  /** Sprite scale override; defaults to SPRITE_CONTROL.companion.scale. */
  scale?: number;
  /** Show an on-screen panel to switch mode + delay live (dev tuning only). */
  debug?: boolean;
}

// --- master-control geometry / tuning -------------------------------------
const C = SPRITE_CONTROL.companion;
const FRAME = C.frameSize;
// Directional walk strips (down/up/left/right). Idle rests on a direction's
// frame 0 — `down` (front-facing) is the natural standing pose.
const WALK = C.actions.walk;
type Dir = keyof typeof WALK.dir;
const DEFAULT_DIR: Dir = "down";
const IDLE = WALK.dir[DEFAULT_DIR]; // resting / static pose (front-facing strip, frame 0)

const WALK_SPEED = C.walkSpeed;
const WANDER_SPEED = C.wanderSpeed;
const STANDOFF = C.standoff;
const MOVE_EPS = 120; // cursor "is moving" if it moved within this many ms
const FACE_EPS = 1.5; // min movement step before we re-pick the facing direction

const MODES: Mode[] = ["chase", "rest", "wander"];
const DELAYS = [1000, 2000, 3000];

export function SkeletonCompanion({
  mode = "chase",
  idleDelayMs = 3000,
  scale = C.scale,
  debug = false,
}: SkeletonCompanionProps) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true); // false on touch / no-hover

  // Live config, mutable by the debug panel without restarting the rAF loop.
  const [cfg, setCfg] = useState({ mode, idleDelayMs });
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const wrapRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);

  const size = Math.round(FRAME * scale);

  // Detect device suitability after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    setMounted(true);
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(hover.matches);
    update();
    hover.addEventListener("change", update);
    return () => hover.removeEventListener("change", update);
  }, []);

  // The animation loop. Runs once, reads live config from cfgRef.
  useEffect(() => {
    if (!mounted || !enabled || reduceMotion) return;
    const wrap = wrapRef.current;
    const sprite = spriteRef.current;
    if (!wrap || !sprite) return;

    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;

    // Mutable runtime state (kept out of React for perf).
    const pos = { x: vw() / 2, y: vh() / 2 };
    const goal = { x: pos.x, y: pos.y };
    const cursor = { x: pos.x, y: pos.y };
    let goalIsCursor = false;
    let dir: Dir = DEFAULT_DIR; // facing — picked from the dominant movement axis
    let lastMoveAt = -Infinity; // when the cursor last moved
    let nextWanderAt = 0; // next time we may pick a drift target (wander)

    // Idle-to-chest takeover state.
    let chestVisited = false; // opened the sidebar this idle period
    let lungeStart = 0; // performance.now() when the attack lunge began

    // Hide the companion while the cursor is inside the Projects dungeon — that
    // region shows its own aim reticle instead (dungeon-map.tsx dispatches these).
    let suppressed = false;
    const onDungeonEnter = () => (suppressed = true);
    const onDungeonLeave = () => (suppressed = false);
    window.addEventListener("dungeon-cursor-enter", onDungeonEnter);
    window.addEventListener("dungeon-cursor-leave", onDungeonLeave);

    // Track the sidebar so the idle chest-march is suppressed while it's open.
    let sidebarOpen = false;
    const onSidebarOpen = () => (sidebarOpen = true);
    const onSidebarClose = () => (sidebarOpen = false);
    window.addEventListener("chest-sidebar-open", onSidebarOpen);
    window.addEventListener("chest-sidebar-close", onSidebarClose);

    let curDir: Dir | null = null; // which strip is currently bound to the sprite
    let frame = 0;
    let frameAcc = 0;
    let last = performance.now();
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      lastMoveAt = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const clampX = (x: number) => Math.max(size / 2, Math.min(vw() - size / 2, x));
    const clampY = (y: number) => Math.max(size / 2, Math.min(vh() - size / 2, y));

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); // clamp big gaps
      last = now;

      // Skip all position/DOM work while the tab is backgrounded — this is a
      // fixed whole-page overlay, not a scroll-bound element, so there's no
      // "offscreen" to gate on the way there is for scroll-bound sprites.
      if (document.hidden) return;

      const { mode: m, idleDelayMs: delay } = cfgRef.current;
      const stillFor = now - lastMoveAt;

      // Re-arm the chest visit as soon as the cursor moves again.
      if (stillFor < MOVE_EPS) chestVisited = false;

      // 0) Idle takeover: after a longer stillness, abandon the cursor and march
      //    to the chest, then lunge + open the sidebar once.
      // Skip the chest march entirely when the sidebar is already open.
      const goingToChest = stillFor >= C.idleToChestMs && !sidebarOpen;

      if (goingToChest) {
        goal.x = C.chestTarget.x;
        goal.y = C.chestTarget.y;
        goalIsCursor = false;
      } else if (m === "chase") {
        goal.x = cursor.x;
        goal.y = cursor.y;
        goalIsCursor = true;
      } else if (m === "rest") {
        // Ignore movement; only commit to the cursor once it's been still.
        if (stillFor >= delay) {
          goal.x = cursor.x;
          goal.y = cursor.y;
          goalIsCursor = true;
        }
      } else {
        // wander: chase while the mouse moves, drift once it's idle a while.
        if (stillFor < MOVE_EPS) {
          goal.x = cursor.x;
          goal.y = cursor.y;
          goalIsCursor = true;
          nextWanderAt = now + 600;
        } else if (stillFor >= delay) {
          const arrived = Math.hypot(goal.x - pos.x, goal.y - pos.y) < 4;
          if (now >= nextWanderAt && (goalIsCursor || arrived)) {
            const ang = Math.random() * Math.PI * 2;
            const r = 70 + Math.random() * 180;
            goal.x = clampX(pos.x + Math.cos(ang) * r);
            goal.y = clampY(pos.y + Math.sin(ang) * r);
            goalIsCursor = false;
            nextWanderAt = now + 1400 + Math.random() * 1800;
          }
        }
      }

      // 2) Step toward the goal.
      const dx = goal.x - pos.x;
      const dy = goal.y - pos.y;
      const dist = Math.hypot(dx, dy);
      const stopDist = goalIsCursor ? STANDOFF : 2;
      let translating = false;
      if (dist > stopDist + 0.5) {
        const speed = goalIsCursor ? WALK_SPEED : WANDER_SPEED;
        const step = Math.min(speed * dt, dist - stopDist);
        pos.x = clampX(pos.x + (dx / dist) * step);
        pos.y = clampY(pos.y + (dy / dist) * step);
        translating = step > 0.05;
        // Face along the dominant movement axis (true 4-way, no mirroring).
        if (Math.max(Math.abs(dx), Math.abs(dy)) > FACE_EPS) {
          dir =
            Math.abs(dx) >= Math.abs(dy)
              ? dx < 0 ? "left" : "right"
              : dy < 0 ? "up" : "down";
        }
      }

      // 2b) Reached the chest while idle → fire the lunge + open the sidebar once.
      if (goingToChest && !translating && !chestVisited) {
        chestVisited = true;
        lungeStart = now;
        openChestSidebar();
      }

      // 3) Bind the strip for the current facing; swap when the direction changes.
      const sheet = WALK.dir[dir];
      if (dir !== curDir) {
        curDir = dir;
        sprite.style.backgroundImage = `url(${sheet.src})`;
        sprite.style.backgroundSize = `${sheet.frames * size}px ${size}px`;
        frame = 0;
        frameAcc = 0;
      }

      // 4) Advance frames while walking; rest on frame 0 when idle.
      if (translating) {
        frameAcc += dt * 1000;
        if (frameAcc >= WALK.frameMs) {
          frameAcc %= WALK.frameMs;
          frame = (frame + 1) % sheet.frames;
        }
      } else {
        frame = 0;
        frameAcc = 0;
      }

      // 5) Write to the DOM. The lunge scales the sprite up then back down.
      const lungeT = (now - lungeStart) / C.attack.lungeMs;
      const lunge =
        lungeStart && lungeT < 1
          ? 1 + Math.sin(lungeT * Math.PI) * (C.attack.lungeScale - 1)
          : 1;
      wrap.style.transform = `translate3d(${pos.x - size / 2}px, ${pos.y - size / 2}px, 0)`;
      sprite.style.backgroundPositionX = `-${frame * size}px`;
      // No horizontal mirror — left/right have native art. Lunge is the
      // placeholder "attack" flourish until real attack sheets land.
      sprite.style.transform = `scale(${lunge})`;
      // Fade in (CSS transition handles the first 0→1), and hide over the dungeon.
      wrap.style.opacity = suppressed ? "0" : "1";
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("dungeon-cursor-enter", onDungeonEnter);
      window.removeEventListener("dungeon-cursor-leave", onDungeonLeave);
      window.removeEventListener("chest-sidebar-open", onSidebarOpen);
      window.removeEventListener("chest-sidebar-close", onSidebarClose);
    };
  }, [mounted, enabled, reduceMotion, size]);

  if (!mounted || !enabled) return null;

  // Reduced motion: a static idle skeleton parked in the corner, no chasing.
  if (reduceMotion) {
    return (
      <div aria-hidden className="skeleton-companion--reduced">
        <div
          className="pixelated"
          style={{
            width: size,
            height: size,
            backgroundImage: `url(${IDLE.src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${IDLE.frames * size}px ${size}px`,
            backgroundPositionX: 0,
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div aria-hidden className="skeleton-companion__layer">
        <div
          ref={wrapRef}
          className="skeleton-companion__wrap"
          style={{
            opacity: 0,
            transition: "opacity 450ms ease-out",
            filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.35))",
          }}
        >
          <div
            ref={spriteRef}
            className="pixelated"
            style={{
              width: size,
              height: size,
              backgroundRepeat: "no-repeat",
              backgroundImage: `url(${IDLE.src})`,
              backgroundSize: `${IDLE.frames * size}px ${size}px`,
            }}
          />
        </div>
      </div>

      {debug && (
        <DebugPanel cfg={cfg} onChange={setCfg} />
      )}
    </>
  );
}

// --- dev-only live tuning panel -------------------------------------------
function DebugPanel({
  cfg,
  onChange,
}: {
  cfg: { mode: Mode; idleDelayMs: number };
  onChange: (c: { mode: Mode; idleDelayMs: number }) => void;
}) {
  return (
    <div className="skeleton-companion__debug">
      <div className="skeleton-companion__debug-label">Skeleton · mode</div>
      <div className="skeleton-companion__debug-row">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ ...cfg, mode: m })}
            className={cn(
              "skeleton-companion__chip",
              cfg.mode === m ? "skeleton-companion__chip--active" : "skeleton-companion__chip--idle"
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="skeleton-companion__debug-label">Idle delay</div>
      <div className="skeleton-companion__debug-row">
        {DELAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange({ ...cfg, idleDelayMs: d })}
            className={cn(
              "skeleton-companion__chip",
              cfg.idleDelayMs === d ? "skeleton-companion__chip--active" : "skeleton-companion__chip--idle"
            )}
          >
            {d / 1000}s
          </button>
        ))}
      </div>
    </div>
  );
}
