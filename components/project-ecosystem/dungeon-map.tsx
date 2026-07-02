"use client";

import { useEffect, useRef, useState } from "react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { DungeonTilesCanvas } from "@/components/project-ecosystem/dungeon-tiles-canvas";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { MAP_W, MAP_H } from "@/lib/dungeon-layout";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/**
 * DungeonMap — the Projects section as a large, static, explorable top-down
 * dungeon. It renders bare map structure only — floor sand + walls — baked into
 * one panned "map layer"; the camera offset is moved with the ARROW KEYS / WASD
 * (held to pan) and by dragging. While the pointer is inside, the cursor becomes
 * the animated aim reticle and the global SkeletonCompanion is suppressed
 * (dungeon-cursor-enter/leave events). Project info lives in the info gallery.
 */

const AIM = SPRITE_CONTROL.aim;
const AIM_PX = AIM.frameSize * AIM.scale; // ~39
const PAN_SPEED = 900; // px/s while a key is held

const KEYMAP: Record<string, "left" | "right" | "up" | "down"> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down",
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function DungeonMap() {
  const [aiming, setAiming] = useState(false);

  const viewRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const aimRef = useRef<HTMLDivElement>(null);

  const cam = useRef({ x: 0, y: 0 });
  const keys = useRef<Set<string>>(new Set());
  const hovered = useRef(false);
  const focused = useRef(false);
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });
  const aimingRef = useRef(false);
  const fine = useRef(false);
  const autoFocused = useRef(false);

  useEffect(() => {
    const view = viewRef.current;
    const map = mapRef.current;
    if (!view || !map) return;

    fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Zoom the map so the viewport only ever frames ~a quarter of it (roughly
    // half in each axis). The camera has fixed proportions, so on wide screens
    // the native map is barely larger than the view and the side arrows have
    // nowhere to pan; scaling up guarantees head-room in all four directions.
    // Camera coords live in this scaled (screen-px) space.
    let zoom = 1;
    const computeZoom = () =>
      Math.max(1, (1.5* view.clientWidth) / MAP_W, (1 * view.clientHeight) / MAP_H);
    const mapW = () => MAP_W * zoom;
    const mapH = () => MAP_H * zoom;

    const apply = () => {
      map.style.transform = `translate3d(${-cam.current.x}px, ${-cam.current.y}px, 0) scale(${zoom})`;
    };
    const clampCam = () => {
      cam.current.x = clamp(cam.current.x, 0, Math.max(0, mapW() - view.clientWidth));
      cam.current.y = clamp(cam.current.y, 0, Math.max(0, mapH() - view.clientHeight));
    };

    // start centred on the hub
    zoom = computeZoom();
    cam.current.x = mapW() / 2 - view.clientWidth / 2;
    cam.current.y = mapH() / 2 - view.clientHeight / 2;
    clampCam();
    apply();

    // ---- camera key loop (runs only while a direction is held) ----
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = keys.current;
      let vx = 0;
      let vy = 0;
      if (k.has("left")) vx -= PAN_SPEED;
      if (k.has("right")) vx += PAN_SPEED;
      if (k.has("up")) vy -= PAN_SPEED;
      if (k.has("down")) vy += PAN_SPEED;
      if (vx || vy) {
        cam.current.x += vx * dt;
        cam.current.y += vy * dt;
        clampCam();
        apply();
        raf = requestAnimationFrame(tick);
      } else raf = 0;
    };
    const startLoop = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const active = () => hovered.current || focused.current;

    const onKeyDown = (e: KeyboardEvent) => {
      const dir = KEYMAP[e.key];
      if (!dir) return;
      // True only for the first direction of a held pan gesture (not key-repeat).
      const gestureStart = keys.current.size === 0;
      // auto-activate when arrow keys are pressed and ecosystem is in viewport
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
      // Snap the whole section into view at the start of a pan gesture, even if
      // it's only half-scrolled — same as clicking "Projects" in the sidebar.
      if (gestureStart) scrollToSection("ecosystem");
      e.preventDefault(); // keep the page from scrolling while we pan
      keys.current.add(dir);
      startLoop();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEYMAP[e.key];
      if (dir) keys.current.delete(dir);
    };

    // ---- aim reticle ----
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
      window.dispatchEvent(new Event("dungeon-cursor-leave"));
      setAim(false);
    };
    const onFocus = () => {
      focused.current = true;
    };
    const onBlur = () => {
      focused.current = false;
      keys.current.clear();
    };

    // ---- drag to pan ----
    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      dragMoved.current = false;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      if (e.pointerType !== "touch") view.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (aimingRef.current) moveAim(e);
      if (!dragging.current) return;
      const dx = e.clientX - lastPtr.current.x;
      const dy = e.clientY - lastPtr.current.y;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      cam.current.x -= dx;
      cam.current.y -= dy;
      clampCam();
      apply();
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved.current = true;
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      try {
        view.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured (touch) */
      }
    };
    // a real drag shouldn't also open a chest
    const onClickCapture = (e: MouseEvent) => {
      if (dragMoved.current) {
        e.stopPropagation();
        e.preventDefault();
        dragMoved.current = false;
      }
    };

    view.addEventListener("pointerenter", onEnter);
    view.addEventListener("pointerleave", onLeave);
    view.addEventListener("focus", onFocus);
    view.addEventListener("blur", onBlur);
    view.addEventListener("pointerdown", onPointerDown);
    view.addEventListener("pointermove", onPointerMove);
    view.addEventListener("pointerup", onPointerUp);
    view.addEventListener("click", onClickCapture, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const onResize = () => {
      zoom = computeZoom();
      clampCam();
      apply();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      view.removeEventListener("pointerenter", onEnter);
      view.removeEventListener("pointerleave", onLeave);
      view.removeEventListener("focus", onFocus);
      view.removeEventListener("blur", onBlur);
      view.removeEventListener("pointerdown", onPointerDown);
      view.removeEventListener("pointermove", onPointerMove);
      view.removeEventListener("pointerup", onPointerUp);
      view.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.dispatchEvent(new Event("dungeon-cursor-leave"));
    };
  }, []);

  // auto-focus the dungeon when the ecosystem section scrolls into view
  // so arrow keys work immediately after clicking "Projects" in the sidebar
  useEffect(() => {
    const el = document.getElementById("ecosystem");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!autoFocused.current) {
            autoFocused.current = true;
            viewRef.current?.focus();
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

  return (
    <div>
      {/* HUD */}
      <div className="-mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center font-pixel text-[0.5rem] uppercase tracking-wider text-ops-sand-faint">
        <span className="text-ops-sand-soft">03 — Project Dungeon</span>
        <span className="text-ops-sand-faint">// arrow keys / drag to explore</span>
      </div>

      <DungeonFrame wall={24} className="font-pixel-readable">
        <div
          ref={viewRef}
          tabIndex={0}
          role="application"
          aria-label="Explorable project dungeon — pan with arrow keys, open a chest to view a project"
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
                "linear-gradient(rgba(20,17,12,.55), rgba(20,17,12,.55)), url(/dungeon_bg.png) center/cover no-repeat",
            }}
          >
            <DungeonTilesCanvas />
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
            Arrows / drag to explore
          </div>
        </div>
      </DungeonFrame>
    </div>
  );
}
