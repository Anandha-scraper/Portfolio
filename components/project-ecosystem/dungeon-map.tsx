"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { DungeonTilesCanvas } from "@/components/project-ecosystem/dungeon-tiles-canvas";
import { DungeonBlocks } from "@/components/project-ecosystem/dungeon-blocks";
import { DungeonTreasures } from "@/components/project-ecosystem/dungeon-treasures";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { MAP_W, MAP_H } from "@/lib/dungeon-layout";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";

// Code-split: FlipBook (and its CodePen-hotlinked font + images) only loads
// the first time a treasure marker is actually clicked, not as soon as the
// Projects section mounts.
const TreasureBookModal = dynamic(() =>
  import("@/components/project-ecosystem/treasure-book-modal").then(
    (m) => m.TreasureBookModal
  )
);

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

// ---- dev-only sector marking tool -------------------------------------------
// A throwaway aid: toggle edit mode, drag rectangles over the dungeon (map-px)
// to carve it into numbered sectors, then Copy JSON to grab the coords. Compiled
// out of production (process.env.NODE_ENV is inlined + tree-shaken by Next).
// Disabled now that sectors A-H are fully traced (see polygon.md). Flip back to
// `process.env.NODE_ENV !== "production"` if a future sector needs re-tracing.
const DEV = false;
const SECTOR_KEY = "dungeon-sectors";
type Sector = { id: number; x: number; y: number; w: number; h: number };

// A second dev-only aid, same idea: toggle polygon-edit mode, click to place
// vertices tracing the true outline of a combined region (rather than a plain
// rectangle), Finish to commit the shape, then Copy JSON to grab the points.
const POLY_KEY = "dungeon-sector-polygons";
type Point = { x: number; y: number };
type Polygon = { id: number; points: Point[] };

export function DungeonMap() {
  const [aiming, setAiming] = useState(false);

  // sector division outline: hidden by default, revealed by hovering its
  // treasure marker, auto-hides after 3s (or immediately on mouse leave).
  const [revealedSector, setRevealedSector] = useState<string | null>(null);
  // treasure book modal: opened by clicking a sector's treasure marker.
  const [openSector, setOpenSector] = useState<string | null>(null);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTreasureEnter = (sector: string) => {
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    setRevealedSector(sector);
    revealTimeout.current = setTimeout(() => setRevealedSector(null), 3000);
  };
  const handleTreasureLeave = (sector: string) => {
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    setRevealedSector((current) => (current === sector ? null : current));
  };
  useEffect(() => () => {
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
  }, []);

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

  // sector editor state
  const [editing, setEditing] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(SECTOR_KEY) || "[]") as Sector[];
    } catch {
      return [];
    }
  });
  const editingRef = useRef(false);
  const drawing = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const commitRef = useRef<(r: Omit<Sector, "id">) => void>(() => {});

  editingRef.current = editing;
  commitRef.current = (r) =>
    setSectors((prev) => [...prev, { id: Date.now(), ...r }]);

  // persist marks so a reload keeps your in-progress split
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SECTOR_KEY, JSON.stringify(sectors));
    }
  }, [sectors]);

  // polygon editor state (traces a real outline, no bounding-box math)
  const [polyEditing, setPolyEditing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(POLY_KEY) || "[]") as Polygon[];
    } catch {
      return [];
    }
  });
  const polyEditingRef = useRef(false);
  const polyDown = useRef({ x: 0, y: 0 });

  polyEditingRef.current = polyEditing;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(POLY_KEY, JSON.stringify(polygons));
    }
  }, [polygons]);

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

    // ---- sector editor: screen point → map-px (accounts for camera + zoom) ----
    const toMap = (cx: number, cy: number) => {
      const r = view.getBoundingClientRect();
      return { x: (cx - r.left + cam.current.x) / zoom, y: (cy - r.top + cam.current.y) / zoom };
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
      if (fine.current && e.pointerType !== "touch" && !editingRef.current && !polyEditingRef.current) {
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

    // ---- draw a sector rectangle (map-px) ----
    const previewRect = (x: number, y: number, w: number, h: number, show: boolean) => {
      const pv = previewRef.current;
      if (!pv) return;
      pv.style.display = show ? "block" : "none";
      pv.style.left = `${x}px`;
      pv.style.top = `${y}px`;
      pv.style.width = `${w}px`;
      pv.style.height = `${h}px`;
    };

    // ---- drag to pan (or draw sectors / place polygon vertices while editing) ----
    const onPointerDown = (e: PointerEvent) => {
      // real clickable map objects (e.g. treasure markers) opt out of pan
      // capture entirely — setPointerCapture retargets the synthesized click
      // to `view`, so a button nested inside it would never see its own click.
      if (e.target instanceof Element && e.target.closest("[data-no-pan]")) return;
      if (editingRef.current) {
        drawing.current = true;
        drawStart.current = toMap(e.clientX, e.clientY);
        previewRect(drawStart.current.x, drawStart.current.y, 0, 0, true);
        if (e.pointerType !== "touch") view.setPointerCapture(e.pointerId);
        return;
      }
      if (polyEditingRef.current) {
        polyDown.current = { x: e.clientX, y: e.clientY };
        if (e.pointerType !== "touch") view.setPointerCapture(e.pointerId);
        return;
      }
      dragging.current = true;
      dragMoved.current = false;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      if (e.pointerType !== "touch") view.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (editingRef.current) {
        if (drawing.current) {
          const p = toMap(e.clientX, e.clientY);
          const s = drawStart.current;
          previewRect(Math.min(s.x, p.x), Math.min(s.y, p.y), Math.abs(p.x - s.x), Math.abs(p.y - s.y), true);
        }
        return;
      }
      if (polyEditingRef.current) return; // vertices are placed on click, not drag
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
      if (editingRef.current) {
        if (drawing.current) {
          drawing.current = false;
          const p = toMap(e.clientX, e.clientY);
          const s = drawStart.current;
          const x = Math.round(Math.min(s.x, p.x));
          const y = Math.round(Math.min(s.y, p.y));
          const w = Math.round(Math.abs(p.x - s.x));
          const h = Math.round(Math.abs(p.y - s.y));
          previewRect(0, 0, 0, 0, false);
          if (w > 10 && h > 10) commitRef.current?.({ x, y, w, h });
        }
        try {
          view.releasePointerCapture(e.pointerId);
        } catch {
          /* not captured */
        }
        return;
      }
      if (polyEditingRef.current) {
        const moved = Math.hypot(e.clientX - polyDown.current.x, e.clientY - polyDown.current.y);
        if (moved < 4) {
          const p = toMap(e.clientX, e.clientY);
          setCurrentPoints((pts) => [...pts, { x: Math.round(p.x), y: Math.round(p.y) }]);
        }
        try {
          view.releasePointerCapture(e.pointerId);
        } catch {
          /* not captured */
        }
        return;
      }
      dragging.current = false;
      try {
        view.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured (touch) */
      }
    };
    // a real drag shouldn't also open a chest, and neither should placing a vertex
    const onClickCapture = (e: MouseEvent) => {
      if (dragMoved.current || polyEditingRef.current) {
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
            aiming && "cursor-none",
            (editing || polyEditing) && "cursor-crosshair"
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
            {/* thin role-coded outline splitting each room block up — hidden
                until its treasure marker is hovered */}
            <DungeonBlocks visibleSector={revealedSector} />
            {/* one treasure asset pinned at the center of each sector */}
            <DungeonTreasures
              onSectorEnter={handleTreasureEnter}
              onSectorLeave={handleTreasureLeave}
              onSectorClick={setOpenSector}
            />

            {/* dev-only sector marks + live draw preview (map-px) */}
            {DEV && (
              <>
                {sectors.map((s, i) => (
                  <div
                    key={s.id}
                    className="pointer-events-none absolute"
                    style={{
                      left: s.x,
                      top: s.y,
                      width: s.w,
                      height: s.h,
                      border: "2px solid #38bdf8",
                      background: "rgba(56,189,248,0.10)",
                    }}
                  >
                    <span
                      className="absolute left-1 top-0.5 font-pixel"
                      style={{ fontSize: 12, color: "#7dd3fc" }}
                    >
                      {i + 1}
                    </span>
                  </div>
                ))}
                <div
                  ref={previewRef}
                  className="pointer-events-none absolute"
                  style={{
                    display: "none",
                    border: "2px dashed #38bdf8",
                    background: "rgba(56,189,248,0.14)",
                  }}
                />
              </>
            )}

            {/* dev-only polygon marks + live in-progress outline (map-px) */}
            {DEV && (polygons.length > 0 || currentPoints.length > 0) && (
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={MAP_W}
                height={MAP_H}
                style={{ overflow: "visible" }}
              >
                {polygons.map((p) => (
                  <polygon
                    key={p.id}
                    points={p.points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                    fill="rgba(251,191,36,0.10)"
                    stroke="#fbbf24"
                    strokeWidth={2}
                  />
                ))}
                {currentPoints.length > 0 && (
                  <polyline
                    points={currentPoints.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                )}
                {currentPoints.map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r={5} fill="#fbbf24" />
                ))}
              </svg>
            )}
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

      {/* mounted outside the panned/zoomed map layer so it isn't affected by
          the camera transform */}
      <TreasureBookModal sector={openSector} onClose={() => setOpenSector(null)} />

      {/* dev-only sector tool panel — fixed (outside the view) so its clicks
          never trip the map's pan/draw handlers. Compiled out of production. */}
      {DEV && (
        <div className="fixed bottom-4 right-4 z-[95] w-56 rounded-md border border-ops-line bg-ops-base/95 p-2 font-pixel-readable text-[11px] text-ops-sand shadow-lg backdrop-blur">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-pixel text-[9px] uppercase tracking-wider text-ops-sand-soft">
              Sector tool
            </span>
            <span className="text-ops-sand-faint">{sectors.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v);
              setPolyEditing(false);
            }}
            className={cn(
              "mb-1 w-full rounded-sm border px-2 py-1 text-left transition-colors",
              editing
                ? "border-sky-400 bg-sky-400/15 text-sky-300"
                : "border-ops-line hover:border-ops-rust/50"
            )}
          >
            {editing ? "● Editing — drag to mark" : "Edit sectors"}
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSectors((s) => s.slice(0, -1))}
              className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setSectors([])}
              className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const out = sectors.map((s, i) => ({ id: i + 1, x: s.x, y: s.y, w: s.w, h: s.h }));
                const json = JSON.stringify(out, null, 2);
                navigator.clipboard?.writeText(json);
                console.log(`[dungeon sectors]\n${json}`);
              }}
              className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
            >
              Copy
            </button>
          </div>
          {sectors.length > 0 && (
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-auto">
              {sectors.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between gap-1">
                  <span className="truncate text-ops-sand-soft">
                    {i + 1}. {s.w}×{s.h} @{s.x},{s.y}
                  </span>
                  <button
                    type="button"
                    aria-label={`delete sector ${i + 1}`}
                    onClick={() => setSectors((a) => a.filter((x) => x.id !== s.id))}
                    className="shrink-0 px-1 text-ops-sand-faint hover:text-ops-rust"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-1 mt-2 flex items-center justify-between border-t border-ops-line pt-2">
            <span className="font-pixel text-[9px] uppercase tracking-wider text-ops-sand-soft">
              Polygon tool
            </span>
            <span className="text-ops-sand-faint">{polygons.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPolyEditing((v) => !v);
              setEditing(false);
            }}
            className={cn(
              "mb-1 w-full rounded-sm border px-2 py-1 text-left transition-colors",
              polyEditing
                ? "border-amber-400 bg-amber-400/15 text-amber-300"
                : "border-ops-line hover:border-ops-rust/50"
            )}
          >
            {polyEditing ? `● Editing — click to place (${currentPoints.length})` : "Edit polygons"}
          </button>
          {polyEditing && (
            <div className="mb-1 flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentPoints((pts) => pts.slice(0, -1))}
                className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
              >
                Undo pt
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPoints((pts) => {
                    if (pts.length >= 3) {
                      setPolygons((prev) => [...prev, { id: Date.now(), points: pts }]);
                    }
                    return [];
                  })
                }
                className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
              >
                Finish
              </button>
            </div>
          )}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPolygons((p) => p.slice(0, -1))}
              className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => {
                setPolygons([]);
                setCurrentPoints([]);
              }}
              className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const out = polygons.map((p, i) => ({ id: i + 1, points: p.points }));
                const json = JSON.stringify(out, null, 2);
                navigator.clipboard?.writeText(json);
                console.log(`[dungeon sector polygons]\n${json}`);
              }}
              className="flex-1 rounded-sm border border-ops-line px-1 py-1 hover:border-ops-rust/50"
            >
              Copy
            </button>
          </div>
          {polygons.length > 0 && (
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-auto">
              {polygons.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-1">
                  <span className="truncate text-ops-sand-soft">
                    {i + 1}. {p.points.length} pts
                  </span>
                  <button
                    type="button"
                    aria-label={`delete polygon ${i + 1}`}
                    onClick={() => setPolygons((a) => a.filter((x) => x.id !== p.id))}
                    className="shrink-0 px-1 text-ops-sand-faint hover:text-ops-rust"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
