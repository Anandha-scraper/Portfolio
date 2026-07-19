/**
 * dungeon-walk — walkability lookups + swept AABB movement for the playable
 * dungeon hero. Collision data is the `walkable` grid derived in
 * lib/dungeon-layout.ts (1 = floor); everything here works in map px.
 *
 * `moveWithCollision` resolves each axis separately in small sub-steps so the
 * hero slides along walls instead of sticking, and can never tunnel through a
 * one-cell wall even on a slow frame (speeds ≤ ~300 px/s, sub-step ≤ 8 px,
 * hitbox smaller than a cell → corner checks are sufficient).
 */

import { CELL, COLS, ROWS, DUNGEON } from "@/lib/dungeon-layout";

/** Feet-anchored hitbox half-extents (map px): the hero occupies a box of
 *  ~0.6×0.4 cells around its position point, so doorways one cell wide pass. */
export const HERO_HALF_W = Math.round(0.3 * CELL); // 9
export const HERO_HALF_H = Math.round(0.2 * CELL); // 6

export function isWalkableCell(cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
  return DUNGEON.walkable[cy * COLS + cx] === 1;
}

/** True iff the whole hitbox centred at (x, y) rests on floor. */
export function boxOnFloor(x: number, y: number): boolean {
  const x0 = Math.floor((x - HERO_HALF_W) / CELL);
  const x1 = Math.floor((x + HERO_HALF_W) / CELL);
  const y0 = Math.floor((y - HERO_HALF_H) / CELL);
  const y1 = Math.floor((y + HERO_HALF_H) / CELL);
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      if (!isWalkableCell(cx, cy)) return false;
    }
  }
  return true;
}

const MAX_STEP = 8; // px per collision sub-step

function sweepAxis(x: number, y: number, delta: number, axis: "x" | "y"): number {
  if (delta === 0) return axis === "x" ? x : y;
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / MAX_STEP));
  const step = delta / steps;
  let pos = axis === "x" ? x : y;
  for (let i = 0; i < steps; i++) {
    const next = pos + step;
    const ok = axis === "x" ? boxOnFloor(next, y) : boxOnFloor(x, next);
    if (!ok) break;
    pos = next;
  }
  return pos;
}

/** Move the hitbox centre by (dx, dy), stopping each axis at the first solid
 *  cell — X first, then Y from the resolved X, which is what produces the
 *  wall-slide feel. Returns the resolved centre. */
export function moveWithCollision(
  x: number,
  y: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const nx = sweepAxis(x, y, dx, "x");
  const ny = sweepAxis(nx, y, dy, "y");
  return { x: nx, y: ny };
}

/** Hero spawn — centre of the hub interior (DUNGEON.walkBounds). */
export function heroSpawn(): { x: number; y: number } {
  const b = DUNGEON.walkBounds;
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}
