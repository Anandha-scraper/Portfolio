"use client";

import type { Point } from "./types";

/**
 * ChartMap — the generated nautical-chart backdrop for the Capabilities voyage.
 * A full-stage SVG (px coords, so nothing distorts) that draws — only when the
 * ship is sailing or an island is being hovered — a single route line
 * (`shipAt` → `target`) with marching-ants in the target accent. There are no
 * persistent route lines by default, and no grid of its own: the single global
 * boxed-line grid is the backdrop. Purely decorative (`aria-hidden`).
 */
export function ChartMap({
  size,
  shipAt,
  target,
  activeHex,
}: {
  size: { w: number; h: number };
  /** Where the ship currently is (px). */
  shipAt: Point;
  /** Where the route line points (px) — sailing target or hover preview, or
   *  null when idle (no line drawn). */
  target: Point | null;
  /** Accent hex for the active route. */
  activeHex: string;
}) {
  const { w, h } = size;
  if (w === 0 || h === 0) return null;

  return (
    <svg
      aria-hidden
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="pointer-events-none absolute inset-0 z-[1]"
    >
      {/* The only route line — drawn on hover (preview) or while sailing. */}
      {target && (
        <line
          x1={shipAt.x}
          y1={shipAt.y}
          x2={target.x}
          y2={target.y}
          stroke={activeHex}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="6 10"
          className="animate-route-march"
          opacity={0.9}
          style={{ filter: `drop-shadow(0 0 5px ${activeHex})` }}
        />
      )}
    </svg>
  );
}
