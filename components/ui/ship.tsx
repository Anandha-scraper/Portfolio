"use client";

import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { cn } from "@/lib/utils";

/**
 * Ship — a pirate ship "live" asset. Three angles survive in
 * public/sprites/ship/ (ship_3/4/5, sliced by feed/extract_islands.py's
 * predecessor); pick one with `frame` and it gently rises, falls and rolls as if
 * riding a swell (the `ship-bob` keyframe in app/globals.css). Honours
 * reduced-motion via Tailwind's `motion-reduce` variant.
 */
export function Ship({
  frame = 3,
  width,
  flip = false,
  className,
}: {
  /** Which angle to show. Only 3 (bow-on), 4 (three-quarter), 5 (broadside)
   *  exist; anything else falls back to the first available. */
  frame?: number;
  /** Rendered width in px. Defaults to the registry value. */
  width?: number;
  /** Mirror horizontally (face the other way). */
  flip?: boolean;
  className?: string;
}) {
  const { dir, frames, width: dwidth } = SPRITE_CONTROL.ship;
  const n = (frames as readonly number[]).includes(frame) ? frame : frames[0];
  return (
    <div
      className={cn(
        "animate-ship-bob will-change-transform motion-reduce:animate-none",
        className
      )}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${dir}/ship_${n}.png`}
        alt=""
        aria-hidden
        width={width ?? dwidth}
        className="pixelated h-auto select-none"
        draggable={false}
      />
    </div>
  );
}
