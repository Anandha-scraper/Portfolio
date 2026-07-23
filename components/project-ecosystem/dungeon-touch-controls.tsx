"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { cn } from "@/lib/utils";

/**
 * DungeonTouchControls — virtual joystick + action button overlay for the
 * playable dungeon on coarse-pointer devices. The joystick writes a
 * normalised {x, y} vector straight into `inputRef` (read by the game loop
 * in dungeon-map.tsx — no React state per move) and calls `onWake` so the
 * loop starts; the ⚔ button triggers the same interact path as the E key.
 *
 * Rendered only when (pointer: coarse) — see dungeon-map.tsx. Both controls
 * set `touch-action: none` on themselves so dragging the stick never scrolls
 * the page, while the map viewport keeps `pan-y` for normal page scrolling.
 */

const PAD = 112; // joystick base diameter px
const KNOB = 48; // knob diameter px
const RANGE = (PAD - KNOB) / 2; // max knob travel from centre

export function DungeonTouchControls({
  inputRef,
  onWake,
  onInteract,
  interactReady,
}: {
  inputRef: MutableRefObject<{ x: number; y: number }>;
  onWake: () => void;
  onInteract: () => void;
  /** a treasure is in range — light the button up */
  interactReady: boolean;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;

    let pointerId: number | null = null;

    const setVector = (clientX: number, clientY: number) => {
      const r = base.getBoundingClientRect();
      let dx = clientX - (r.left + r.width / 2);
      let dy = clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > RANGE) {
        dx = (dx / len) * RANGE;
        dy = (dy / len) * RANGE;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      // dead-zone so a resting thumb doesn't creep
      const nx = Math.abs(dx) < 6 ? 0 : dx / RANGE;
      const ny = Math.abs(dy) < 6 ? 0 : dy / RANGE;
      inputRef.current.x = nx;
      inputRef.current.y = ny;
      if (nx || ny) onWake();
    };

    const reset = () => {
      pointerId = null;
      knob.style.transform = "translate(0px, 0px)";
      inputRef.current.x = 0;
      inputRef.current.y = 0;
    };

    const onDown = (e: PointerEvent) => {
      pointerId = e.pointerId;
      base.setPointerCapture(e.pointerId);
      setVector(e.clientX, e.clientY);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      setVector(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      try {
        base.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
      reset();
    };

    base.addEventListener("pointerdown", onDown);
    base.addEventListener("pointermove", onMove);
    base.addEventListener("pointerup", onUp);
    base.addEventListener("pointercancel", onUp);
    return () => {
      base.removeEventListener("pointerdown", onDown);
      base.removeEventListener("pointermove", onMove);
      base.removeEventListener("pointerup", onUp);
      base.removeEventListener("pointercancel", onUp);
      reset();
    };
  }, [inputRef, onWake]);

  return (
    <>
      {/* joystick */}
      <div
        ref={baseRef}
        role="presentation"
        className="touch-controls__base"
        style={{ width: PAD, height: PAD, touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sprites/ui/joystick_outer_off.png"
          alt=""
          draggable={false}
          className={cn("touch-controls__base-img", "pixelated")}
        />
        <div ref={knobRef} className="touch-controls__knob" style={{ width: KNOB, height: KNOB }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sprites/ui/joystick_inner_off.png"
            alt=""
            draggable={false}
            className={cn("touch-controls__knob-img", "pixelated")}
          />
        </div>
      </div>

      {/* action button */}
      <button
        type="button"
        aria-label="Open nearby treasure"
        onClick={onInteract}
        className={cn("touch-controls__action", interactReady && "touch-controls__action--ready")}
        style={{ touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sprites/ui/attack_off.png" alt="" draggable={false} className={cn("touch-controls__action-img", "pixelated")} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sprites/ui/attack_lit.png"
          alt=""
          draggable={false}
          className={cn("touch-controls__action-img", "touch-controls__action-img--lit", "pixelated")}
        />
      </button>
    </>
  );
}
