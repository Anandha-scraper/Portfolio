/**
 * dungeon-treasure-points — one interaction point per dungeon sector: the
 * bounding-box midpoint of its traced polygon (PROJECT_SECTOR_GROUPS), in
 * map px. Shared by the treasure markers (dungeon-treasures.tsx) and the
 * hero's proximity check (dungeon-map.tsx) so both agree on where a
 * treasure "is".
 */

import { PROJECT_SECTOR_GROUPS } from "@/lib/dungeon-sectors";

export interface TreasurePoint {
  sector: string;
  /** treasure sprite number (public/sprites/treasure/treasure_0N.png) */
  treasure: number;
  x: number;
  y: number;
}

export const TREASURE_POINTS: TreasurePoint[] = PROJECT_SECTOR_GROUPS.map(
  (group, i) => {
    const xs = group.points.map((p) => p.x);
    const ys = group.points.map((p) => p.y);
    return {
      sector: group.label,
      treasure: i + 1,
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  },
);

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
