"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { DungeonTilesCanvas } from "@/components/project-ecosystem/dungeon-tiles-canvas";
import { DungeonTreasures } from "@/components/project-ecosystem/dungeon-treasures";
import {
  DungeonHero,
  HERO_PX,
  type HeroAction,
  type HeroFacing,
} from "@/components/project-ecosystem/dungeon-hero";
import { DungeonTouchControls } from "@/components/project-ecosystem/dungeon-touch-controls";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { MAP_W, MAP_H } from "@/lib/dungeon-layout";
import { moveWithCollision, heroSpawn, HERO_HALF_H } from "@/lib/dungeon-walk";
import { nearestTreasure } from "@/lib/dungeon-treasure-points";
import { useMediaQuery } from "@/hooks/use-media-query";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";

// Code-split: TreasureBookModal is mounted unconditionally by DungeonMap
// below (AnimatePresence needs it mounted at rest to animate its own exit),
// so this chunk starts fetching as soon as the Projects section itself
// mounts — about as early as it can be.
const TreasureBookModal = dynamic(() =>
  import("@/components/project-ecosystem/treasure-book-modal").then(
    (m) => m.TreasureBookModal
  )
);

/**
 * DungeonMap — the Projects section as a playable top-down mini-game. A hero
 * (SPRITE_CONTROL.vampire1, tuned by SPRITE_CONTROL.hero) walks the dungeon
 * with WASD/arrows (hold Shift to run) or the virtual joystick on touch;
 * walls collide (lib/dungeon-walk.ts); the camera follows the hero. Walking
 * up to a sector's treasure and pressing E / Enter (or the ⚔ button on
 * touch) plays an attack flourish and opens that project's modal. Treasures
 * also stay directly clickable/tappable.
 *
 * Rendering stays imperative where it's hot: hero + camera transforms are
 * written to the DOM inside one rAF game loop that only runs while there is
 * input or the camera is still settling; React state changes only on
 * action/facing/near-treasure transitions.
 */

const AIM = SPRITE_CONTROL.aim;
const AIM_PX = AIM.frameSize * AIM.scale; // ~39
const HERO_CTRL = SPRITE_CONTROL.hero;

const KEYMAP: Record<string, "left" | "right" | "up" | "down"> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down",
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function DungeonMap() {
  const [aiming, setAiming] = useState(false);

  // treasure book modal: opened via the hero interact or a direct click.
  const [openSector, setOpenSector] = useState<string | null>(null);

  // hero render state — changes a few times a second at most.
  const [heroAction, setHeroAction] = useState<HeroAction>("idle");
  const [heroFacing, setHeroFacing] = useState<HeroFacing>("down");
  const [attackKey, setAttackKey] = useState(0);
  const [nearSector, setNearSector] = useState<string | null>(null);

  const coarsePointer = useMediaQuery("(pointer: coarse)");

  const viewRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const aimRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const cam = useRef({ x: 0, y: 0 });
  const heroPos = useRef(heroSpawn());
  const keys = useRef<Set<string>>(new Set());
  const joy = useRef({ x: 0, y: 0 });
  const running = useRef(false); // Shift held
  const hovered = useRef(false);
  const focused = useRef(false);
  const aimingRef = useRef(false);
  const fine = useRef(false);
  const autoFocused = useRef(false);

  // mirrors so the rAF loop / handlers read fresh values without re-binding
  const openSectorRef = useRef<string | null>(null);
  const attackingRef = useRef(false);
  const nearSectorRef = useRef<string | null>(null);
  const actionRef = useRef<HeroAction>("idle");
  const facingRef = useRef<HeroFacing>("down");
  const startLoopRef = useRef<() => void>(() => {});
  openSectorRef.current = openSector;

  /** attack flourish + open the nearby treasure's project modal. */
  const interact = useCallback(() => {
    const near = nearSectorRef.current;
    if (!near || openSectorRef.current || attackingRef.current) return;
    attackingRef.current = true;
    actionRef.current = "attack";
    setHeroAction("attack");
    setAttackKey((k) => k + 1);
    window.setTimeout(() => setOpenSector(near), 450);
  }, []);

  const onAttackDone = useCallback(() => {
    attackingRef.current = false;
    if (actionRef.current === "attack") {
      actionRef.current = "idle";
      setHeroAction("idle");
    }
  }, []);

  /** touch joystick pokes this to make sure the game loop is running. */
  const wake = useCallback(() => startLoopRef.current(), []);

  useEffect(() => {
    const view = viewRef.current;
    const map = mapRef.current;
    const hero = heroRef.current;
    if (!view || !map || !hero) return;

    fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Zoom the map so the viewport only ever frames ~a quarter of it (roughly
    // half in each axis) — guarantees the follow-camera always has head-room.
    // Camera coords live in this scaled (screen-px) space.
    let zoom = 1;
    const computeZoom = () =>
      Math.max(1, (1.5 * view.clientWidth) / MAP_W, (1 * view.clientHeight) / MAP_H);
    const mapW = () => MAP_W * zoom;
    const mapH = () => MAP_H * zoom;

    const applyCam = () => {
      map.style.transform = `translate3d(${-cam.current.x}px, ${-cam.current.y}px, 0) scale(${zoom})`;
    };
    const applyHero = () => {
      const p = heroPos.current;
      // feet anchor: sprite bottom sits a hair under the hitbox bottom
      hero.style.transform = `translate3d(${p.x - HERO_PX / 2}px, ${p.y + HERO_HALF_H - HERO_PX + 2}px, 0)`;
    };
    const camTarget = () => ({
      x: clamp(heroPos.current.x * zoom - view.clientWidth / 2, 0, Math.max(0, mapW() - view.clientWidth)),
      y: clamp(heroPos.current.y * zoom - view.clientHeight / 2, 0, Math.max(0, mapH() - view.clientHeight)),
    });

    // start centred on the hero at its hub spawn
    zoom = computeZoom();
    cam.current = camTarget();
    applyCam();
    applyHero();

    const refreshNear = () => {
      const p = heroPos.current;
      const t = nearestTreasure(p.x, p.y, HERO_CTRL.interactRadius);
      const s = t?.sector ?? null;
      if (s !== nearSectorRef.current) {
        nearSectorRef.current = s;
        setNearSector(s);
      }
    };
    refreshNear();

    const setAction = (a: HeroAction) => {
      if (actionRef.current !== a) {
        actionRef.current = a;
        setHeroAction(a);
      }
    };
    const setFacing = (f: HeroFacing) => {
      if (facingRef.current !== f) {
        facingRef.current = f;
        setHeroFacing(f);
      }
    };

    // ---- game loop (runs only while there's input or the camera settles) ----
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // gather input (keys + joystick), zeroed while the modal or attack owns the hero
      let ix = 0;
      let iy = 0;
      if (!openSectorRef.current && !attackingRef.current) {
        const k = keys.current;
        if (k.has("left")) ix -= 1;
        if (k.has("right")) ix += 1;
        if (k.has("up")) iy -= 1;
        if (k.has("down")) iy += 1;
        ix += joy.current.x;
        iy += joy.current.y;
      }
      const len = Math.hypot(ix, iy);
      const moving = len > 0.01;

      if (moving) {
        const scale = Math.min(1, len) / (len || 1);
        const speed = running.current ? HERO_CTRL.runSpeed : HERO_CTRL.walkSpeed;
        const p = heroPos.current;
        heroPos.current = moveWithCollision(
          p.x,
          p.y,
          ix * scale * speed * dt,
          iy * scale * speed * dt,
        );
        applyHero();
        refreshNear();
        setFacing(
          Math.abs(ix) > Math.abs(iy)
            ? ix < 0 ? "left" : "right"
            : iy < 0 ? "up" : "down",
        );
        if (!attackingRef.current) setAction(running.current ? "run" : "walk");
      } else if (!attackingRef.current) {
        setAction("idle");
      }

      // follow camera with a light lerp
      const t = camTarget();
      const k = Math.min(1, dt * 9);
      cam.current.x += (t.x - cam.current.x) * k;
      cam.current.y += (t.y - cam.current.y) * k;
      const settled =
        Math.abs(t.x - cam.current.x) < 0.5 && Math.abs(t.y - cam.current.y) < 0.5;
      if (settled) cam.current = t;
      applyCam();

      if (moving || !settled) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const startLoop = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    startLoopRef.current = startLoop;

    const active = () => hovered.current || focused.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        running.current = true;
        return;
      }
      if ((e.key === "e" || e.key === "E" || e.key === "Enter") && active()) {
        if (nearSectorRef.current && !openSectorRef.current) {
          e.preventDefault();
          interact();
        }
        return;
      }
      const dir = KEYMAP[e.key];
      if (!dir) return;
      // True only for the first direction of a held gesture (not key-repeat).
      const gestureStart = keys.current.size === 0;
      // auto-activate when movement keys are pressed and ecosystem is in viewport
      if (!active()) {
        const eco = document.getElementById("ecosystem");
        if (eco) {
          const r = eco.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            focused.current = true;
            viewRef.current?.focus({ preventScroll: true });
          }
        }
        if (!active()) return;
      }
      // Snap the whole section into view at the start of a walk gesture, even if
      // it's only half-scrolled — same as clicking "Projects" in the sidebar.
      if (gestureStart) scrollToSection("ecosystem");
      e.preventDefault(); // keep the page from scrolling while we walk
      keys.current.add(dir);
      startLoop();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        running.current = false;
        return;
      }
      const dir = KEYMAP[e.key];
      if (dir) keys.current.delete(dir);
    };

    // ---- aim reticle (fine pointers only — cosmetic) ----
    const moveAim = (e: PointerEvent) => {
      const a = aimRef.current;
      if (!a) return;
      const r = view.getBoundingClientRect();
      a.style.transform = `translate3d(${e.clientX - r.left - AIM_PX / 2}px, ${e.clientY - r.top - AIM_PX / 2}px, 0)`;
    };
    const setAim = (on: boolean) => {
      aimingRef.current = on;
      setAiming(on);
    };

    // ---- hover / focus (gate keyboard + drive aim + suppress companion) ----
    const onEnter = (e: PointerEvent) => {
      hovered.current = true;
      window.dispatchEvent(new Event("dungeon-cursor-enter"));
      if (fine.current && e.pointerType !== "touch") {
        setAim(true);
        moveAim(e);
      }
    };
    const onLeave = () => {
      hovered.current = false;
      keys.current.clear();
      running.current = false;
      window.dispatchEvent(new Event("dungeon-cursor-leave"));
      setAim(false);
    };
    const onFocus = () => {
      focused.current = true;
    };
    const onBlur = () => {
      focused.current = false;
      keys.current.clear();
      running.current = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (aimingRef.current) moveAim(e);
    };

    view.addEventListener("pointerenter", onEnter);
    view.addEventListener("pointerleave", onLeave);
    view.addEventListener("focus", onFocus);
    view.addEventListener("blur", onBlur);
    view.addEventListener("pointermove", onPointerMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const onResize = () => {
      zoom = computeZoom();
      cam.current = camTarget();
      applyCam();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      startLoopRef.current = () => {};
      view.removeEventListener("pointerenter", onEnter);
      view.removeEventListener("pointerleave", onLeave);
      view.removeEventListener("focus", onFocus);
      view.removeEventListener("blur", onBlur);
      view.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.dispatchEvent(new Event("dungeon-cursor-leave"));
    };
  }, [interact]);

  // auto-focus the dungeon when the ecosystem section scrolls into view
  // so movement keys work immediately after clicking "Projects" in the sidebar
  useEffect(() => {
    const el = document.getElementById("ecosystem");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!autoFocused.current) {
            autoFocused.current = true;
            // preventScroll: a bare focus() re-scrolls the page to centre the
            // viewport mid-section — jarring, and on phones it yanks the page
            // past the section entirely.
            viewRef.current?.focus({ preventScroll: true });
          }
        } else {
          autoFocused.current = false;
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const closeModal = useCallback(() => {
    setOpenSector(null);
    viewRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div>
      {/* HUD */}
      <div className="-mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center font-pixel text-[0.5rem] uppercase tracking-wider text-ops-sand-faint">
        <span className="text-ops-sand-soft">03 — Project Dungeon</span>
        <span className="text-ops-sand-faint">
          {coarsePointer
            ? "// stick to walk · ⚔ to open treasure"
            : "// wasd to walk · shift to run · E to open treasure"}
        </span>
      </div>

      <DungeonFrame wall={24} className="font-pixel-readable">
        <div
          ref={viewRef}
          tabIndex={0}
          role="application"
          aria-label="Playable project dungeon — walk with WASD or arrow keys, press E near a treasure to view a project"
          className={cn(
            "relative h-[clamp(520px,82vh,1000px)] w-full overflow-hidden bg-ops-base outline-none",
            aiming && "cursor-none"
          )}
          style={{ touchAction: "pan-y" }}
        >
          {/* the panned map layer (camera transform written imperatively).
              The void — anywhere DungeonTilesCanvas leaves transparent —
              shows this backdrop; floor/wall tiles paint over it opaquely. */}
          <div
            ref={mapRef}
            className="pixelated absolute left-0 top-0 will-change-transform"
            style={{
              width: MAP_W,
              height: MAP_H,
              transformOrigin: "0 0",
              background:
                "linear-gradient(rgba(20,17,12,.55), rgba(20,17,12,.55)), url(/dungeon_bg.webp) center/cover no-repeat",
            }}
          >
            <DungeonTilesCanvas />
            {/* one treasure asset pinned at the center of each sector */}
            <DungeonTreasures onSectorClick={setOpenSector} nearSector={nearSector} />
            {/* the playable hero (positioned imperatively by the game loop) */}
            <DungeonHero
              ref={heroRef}
              action={heroAction}
              facing={heroFacing}
              attackKey={attackKey}
              onAttackDone={onAttackDone}
            />
          </div>

          {/* aim reticle — screen space, follows the real pointer */}
          <div
            ref={aimRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-50 will-change-transform transition-opacity",
              aiming ? "opacity-100" : "opacity-0"
            )}
          >
            <PixelSprite
              src={AIM.src}
              frames={AIM.frames}
              frameSize={AIM.frameSize}
              scale={AIM.scale}
              frameMs={AIM.frameMs}
            />
          </div>

          {/* edge vignettes */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-40 w-16 bg-gradient-to-r from-ops-base/70 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-40 w-16 bg-gradient-to-l from-ops-base/70 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-40 h-12 bg-gradient-to-b from-ops-base/70 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-12 bg-gradient-to-t from-ops-base/70 to-transparent" />

          {/* hint */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-sm border border-ops-line bg-ops-base/80 px-3 py-1 font-pixel text-[0.5rem] uppercase tracking-wide text-ops-sand-soft">
            {nearSector
              ? coarsePointer
                ? "Treasure nearby — tap ⚔"
                : "Press E to open the treasure"
              : coarsePointer
                ? "Use the stick to explore"
                : "WASD to explore · Shift to run"}
          </div>

          {/* touch controls (coarse pointers only) */}
          {coarsePointer && (
            <DungeonTouchControls
              inputRef={joy}
              onWake={wake}
              onInteract={interact}
              interactReady={!!nearSector}
            />
          )}
        </div>

        {/* sibling of viewRef, still inside DungeonFrame's own box: covers
            exactly the framed viewport (not the HUD line above it), isn't
            clipped by viewRef's overflow-hidden, and isn't affected by
            mapRef's camera transform. */}
        <TreasureBookModal sector={openSector} onClose={closeModal} />
      </DungeonFrame>
    </div>
  );
}
