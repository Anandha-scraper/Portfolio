/**
 * dungeon-sectors — stable sector labels for the four active project rooms.
 *
 * Room geometry is generated in dungeon-layout.ts. Treasure positions derive
 * from those rooms in dungeon-treasure-points.ts, so labels remain stable
 * without carrying a second, stale set of map coordinates.
 */

/** Which project (data/projects.ts id) each sector's treasure opens. */
export const SECTOR_PROJECT_MAP: Record<string, string> = {
  A: "spot",
  B: "magizh",
  C: "crm3i",
  D: "syntax",
};

/** Canonical sector order — the slideshow steps through this list. */
export const SECTOR_ORDER = Object.keys(SECTOR_PROJECT_MAP);
