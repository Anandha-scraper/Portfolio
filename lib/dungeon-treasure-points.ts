/**
 * dungeon-treasure-points — one interaction point per dungeon sector: the
 * safe floor point inside its generated project room, in map px. Shared by
 * the treasure markers (dungeon-treasures.tsx) and the hero's proximity
 * check (dungeon-map.tsx) so both agree on where a treasure "is".
 */

import { CELL, COLS, ROWS, DUNGEON } from "@/lib/dungeon-layout";
import { SECTOR_PROJECT_MAP, SECTOR_ORDER } from "@/lib/dungeon-sectors";

export interface TreasurePoint {
  sector: string;
  /** treasure sprite number (public/sprites/treasure/treasure_0N.png) */
  treasure: number;
  x: number;
  y: number;
}

const MARKER_RADIUS = 30;

function isFloorCell(cx: number, cy: number): boolean {
  return cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS && DUNGEON.walkable[cy * COLS + cx] === 1;
}

/** A marker is 60px wide, so choose a point whose full footprint is floor.
 * This prevents its artwork from spilling over a nearby wall even when a room
 * has a notched corner or a thin corridor attached to it. */
function isMarkerSafe(x: number, y: number): boolean {
  const x0 = Math.floor((x - MARKER_RADIUS) / CELL);
  const x1 = Math.floor((x + MARKER_RADIUS) / CELL);
  const y0 = Math.floor((y - MARKER_RADIUS) / CELL);
  const y1 = Math.floor((y + MARKER_RADIUS) / CELL);

  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      if (!isFloorCell(cx, cy)) return false;
    }
  }
  return true;
}

function pointForProject(projectId: string): { x: number; y: number } {
  const room = DUNGEON.blocks.find((block) => block.id === projectId);
  if (!room) throw new Error(`Missing dungeon room for project: ${projectId}`);

  const candidates: { x: number; y: number; distance: number }[] = [];
  const centerX = room.x + room.w / 2;
  const centerY = room.y + room.h / 2;

  for (let cy = room.y / CELL; cy < (room.y + room.h) / CELL; cy++) {
    for (let cx = room.x / CELL; cx < (room.x + room.w) / CELL; cx++) {
      if (!isFloorCell(cx, cy)) continue;
      const x = (cx + 0.5) * CELL;
      const y = (cy + 0.5) * CELL;
      candidates.push({ x, y, distance: (x - centerX) ** 2 + (y - centerY) ** 2 });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const safe = candidates.find((candidate) => isMarkerSafe(candidate.x, candidate.y));
  const fallback = candidates[0];
  if (!safe && !fallback) throw new Error(`No walkable floor in project room: ${projectId}`);

  return safe ?? fallback;
}

export const TREASURE_POINTS: TreasurePoint[] = SECTOR_ORDER.map((sector, i) => {
  const point = pointForProject(SECTOR_PROJECT_MAP[sector]);
  return { sector, treasure: i + 1, ...point };
});

/** Nearest treasure within `radius` map-px of (x, y), or null. */
export function nearestTreasure(
  x: number,
  y: number,
  radius: number,
): TreasurePoint | null {
  let best: TreasurePoint | null = null;
  let bestD = radius * radius;
  for (const t of TREASURE_POINTS) {
    const dx = t.x - x;
    const dy = t.y - y;
    const d = dx * dx + dy * dy;
    if (d <= bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}
