/**
 * dungeon-sectors — hand-traced region outlines for the Projects dungeon map.
 */

/** A named region of the Projects dungeon, hand-traced with the dev polygon
 *  tool (so the outline hugs real floor only — no bounding-box overreach
 *  into void/wall gaps). `ids` records which project rooms this region
 *  covers, for reference when adding further groups. */
export interface SectorGroup {
  label: string;
  ids: number[];
  points: { x: number; y: number }[];
}

// Traced with the dev polygon tool that used to live in dungeon-map.tsx
// The outlines are kept as authored scene geometry for the four active rooms.
export const PROJECT_SECTOR_GROUPS: SectorGroup[] = [
  {
    label: "A",
    ids: [],
    points: [
      { x: 96, y: 160 },
      { x: 384, y: 160 },
      { x: 384, y: 287 },
      { x: 704, y: 288 },
      { x: 704, y: 160 },
      { x: 1088, y: 161 },
      { x: 1088, y: 383 },
      { x: 960, y: 384 },
      { x: 960, y: 480 },
      { x: 896, y: 480 },
      { x: 896, y: 385 },
      { x: 96, y: 384 },
      { x: 96, y: 161 },
    ],
  },
  {
    label: "B",
    ids: [],
    points: [
      { x: 127, y: 480 },
      { x: 477, y: 481 },
      { x: 478, y: 607 },
      { x: 670, y: 610 },
      { x: 669, y: 767 },
      { x: 351, y: 766 },
      { x: 350, y: 858 },
      { x: 255, y: 857 },
      { x: 256, y: 735 },
      { x: 128, y: 735 },
      { x: 129, y: 672 },
      { x: 63, y: 672 },
      { x: 63, y: 544 },
      { x: 128, y: 544 },
      { x: 127, y: 480 },
    ],
  },
  {
    label: "C",
    ids: [],
    points: [
      { x: 735, y: 481 },
      { x: 1055, y: 481 },
      { x: 1055, y: 544 },
      { x: 1119, y: 544 },
      { x: 1117, y: 770 },
      { x: 1056, y: 767 },
      { x: 1056, y: 801 },
      { x: 1023, y: 799 },
      { x: 1021, y: 907 },
      { x: 926, y: 909 },
      { x: 928, y: 799 },
      { x: 735, y: 797 },
      { x: 738, y: 765 },
      { x: 671, y: 767 },
      { x: 672, y: 544 },
      { x: 735, y: 543 },
      { x: 734, y: 480 },
    ],
  },
  {
    label: "D",
    ids: [],
    points: [
      { x: 1120, y: 608 },
      { x: 1118, y: 769 },
      { x: 1344, y: 768 },
      { x: 1345, y: 800 },
      { x: 1632, y: 800 },
      { x: 1631, y: 704 },
      { x: 1664, y: 704 },
      { x: 1663, y: 441 },
      { x: 1568, y: 441 },
      { x: 1568, y: 512 },
      { x: 1344, y: 512 },
      { x: 1344, y: 608 },
      { x: 1120, y: 609 },
    ],
  },
];

/** Which project (data/projects.ts id) each sector's treasure opens. */
export const SECTOR_PROJECT_MAP: Record<string, string> = {
  A: "spot",
  B: "magizh",
  C: "crm3i",
  D: "syntax",
};

/** Canonical sector order — the slideshow steps through this list. */
export const SECTOR_ORDER = Object.keys(SECTOR_PROJECT_MAP);
