/**
 * dungeon-layout — deterministic builder for the Projects dungeon map.
 *
 * Authors a hub-and-spoke set of themed rooms (one per project) around a
 * jittered, corner-notched ring, joined to the hub by variable-thickness
 * L-corridors plus extra shortcut corridors between `related` projects (so
 * the graph reads as loops, not a pure star). Derives walls as the ring
 * around floor, assigns a tile id to every cell. Built once at module load
 * (pure + deterministic) and consumed by dungeon-map.tsx.
 */

import { projects } from "@/data/projects";
import { FLOOR_PLAIN, WALL_BODY, mulberry32 } from "@/lib/dungeon-tiles";

export const COLS = 56;
export const ROWS = 40;
export const CELL = 32; // on-screen px per 16px tile (clean 2×)
const SEED = 0x1337c0de;

export const MAP_W = COLS * CELL;
export const MAP_H = ROWS * CELL;

type CellKind = 0 | 1 | 2; // void | floor | wall

export interface PlacedProp {
  id: number;
  x: number;
  y: number;
}
export interface ChestMarker {
  projectId: string;
  /** centre of the chest, in map px */
  x: number;
  y: number;
}
/** A dungeon "block" (room) outlined so its bounds read as a distinct cabin.
 *  `role` splits the central `hub` from the remaining `project` rooms. Rect
 *  is the room bounding box in map px. */
export type BlockRole = "hub" | "project";
export interface RoomBlock {
  id: string;
  role: BlockRole;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
}
export interface DungeonMap {
  cols: number;
  rows: number;
  cell: number;
  /** length cols*rows; tile id per cell, or -1 for void. */
  cellTiles: number[];
  staticProps: PlacedProp[];
  torches: { x: number; y: number }[];
  chests: ChestMarker[];
  /** central map-px rectangle the wandering NPCs stay inside. */
  walkBounds: { x: number; y: number; w: number; h: number };
  /** every room outlined + tagged by role, to split the blocks up visually. */
  blocks: RoomBlock[];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Room extends Rect {
  projectId?: string;
  /** [topLeft, topRight, bottomLeft, bottomRight] corner cut-outs. */
  notches?: [boolean, boolean, boolean, boolean];
}

const HUB = { cx: COLS / 2, cy: ROWS / 2 };

// Eight room anchors in a loose 3×3 ring around the central hub.
const SLOTS: { cx: number; cy: number }[] = [
  { cx: 10, cy: 8 },
  { cx: 28, cy: 6 },
  { cx: 46, cy: 8 },
  { cx: 9, cy: 20 },
  { cx: 47, cy: 20 },
  { cx: 10, cy: 32 },
  { cx: 28, cy: 34 },
  { cx: 46, cy: 32 },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pick = <T,>(rng: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)];

/** L-shape corridor between two room centres, with randomized thickness and leg order. */
function connect(a: Rect, b: Rect, rng: () => number): Rect[] {
  const T = 1 + Math.floor(rng() * 3); // 1–3 cells thick
  const acx = Math.round(a.x + a.w / 2);
  const acy = Math.round(a.y + a.h / 2);
  const bcx = Math.round(b.x + b.w / 2);
  const bcy = Math.round(b.y + b.h / 2);
  const horizontalFirst = rng() < 0.5;
  const legH: Rect = { x: Math.min(acx, bcx), y: acy, w: Math.abs(bcx - acx) + T, h: T };
  const legV: Rect = { x: bcx, y: Math.min(acy, bcy), w: T, h: Math.abs(bcy - acy) + T };
  const altLegV: Rect = { x: acx, y: Math.min(acy, bcy), w: T, h: Math.abs(bcy - acy) + T };
  const altLegH: Rect = { x: Math.min(acx, bcx), y: bcy, w: Math.abs(bcx - acx) + T, h: T };
  return horizontalFirst ? [legH, legV] : [altLegV, altLegH];
}

function build(): DungeonMap {
  const rng = mulberry32(SEED);
  const idx = (cx: number, cy: number) => cy * COLS + cx;
  const JITTER = 3;

  // 1) author rooms (one per project, anchored to a jittered slot so the
  // ring reads as hand-placed rather than a drawn 3×3 grid) + the hub.
  const rooms: Room[] = [];
  projects.slice(0, SLOTS.length).forEach((p, i) => {
    const slot = SLOTS[i];
    const w = 8 + Math.floor(rng() * 6); // 8–13
    const h = 6 + Math.floor(rng() * 4); // 6–9
    const jx = Math.round((rng() - 0.5) * 2 * JITTER);
    const jy = Math.round((rng() - 0.5) * 2 * JITTER);
    const x = clamp(Math.round(slot.cx + jx - w / 2), 2, COLS - w - 2);
    const y = clamp(Math.round(slot.cy + jy - h / 2), 2, ROWS - h - 2);
    const notches: [boolean, boolean, boolean, boolean] = [
      rng() < 0.35,
      rng() < 0.35,
      rng() < 0.35,
      rng() < 0.35,
    ];
    rooms.push({ x, y, w, h, projectId: p.id, notches });
  });
  const hub: Room = {
    x: Math.round(HUB.cx - 7),
    y: Math.round(HUB.cy - 5),
    w: 14,
    h: 10,
    notches: [true, true, true, true], // octagonal landmark, not a plain box
  };
  rooms.push(hub);

  // 2) corridors: every room to the hub (variable thickness/leg order), plus
  // shortcut corridors between `related` projects so the graph gets loops
  // instead of reading as a pure star.
  const corridors: Rect[] = [];
  for (const r of rooms) {
    if (r === hub) continue;
    corridors.push(...connect(r, hub, rng));
  }
  const roomByProject = new Map(
    rooms.filter((r): r is Room & { projectId: string } => !!r.projectId).map((r) => [r.projectId, r])
  );
  const linked = new Set<string>();
  for (const p of projects.slice(0, SLOTS.length)) {
    const a = roomByProject.get(p.id);
    if (!a) continue;
    for (const relId of p.related ?? []) {
      const b = roomByProject.get(relId);
      if (!b || b === a) continue;
      const key = [p.id, relId].sort().join("|");
      if (linked.has(key)) continue;
      linked.add(key);
      corridors.push(...connect(a, b, rng));
    }
  }

  // 3) stamp floor — rooms carve their notched corners out; corridors are plain rects.
  const kind = new Int8Array(COLS * ROWS) as unknown as CellKind[];
  const inBounds = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS;
  const stamp = (r: Rect) => {
    for (let yy = r.y; yy < r.y + r.h; yy++) {
      for (let xx = r.x; xx < r.x + r.w; xx++) {
        if (inBounds(xx, yy)) kind[idx(xx, yy)] = 1;
      }
    }
  };
  const stampRoom = (r: Room) => {
    const notchSize = Math.min(2, Math.floor(Math.min(r.w, r.h) / 4));
    for (let yy = r.y; yy < r.y + r.h; yy++) {
      for (let xx = r.x; xx < r.x + r.w; xx++) {
        if (!inBounds(xx, yy)) continue;
        if (notchSize > 0 && r.notches) {
          const dx = xx - r.x;
          const dy = yy - r.y;
          const nearLeft = dx < notchSize;
          const nearRight = dx >= r.w - notchSize;
          const nearTop = dy < notchSize;
          const nearBottom = dy >= r.h - notchSize;
          if (
            (r.notches[0] && nearLeft && nearTop) ||
            (r.notches[1] && nearRight && nearTop) ||
            (r.notches[2] && nearLeft && nearBottom) ||
            (r.notches[3] && nearRight && nearBottom)
          ) {
            continue;
          }
        }
        kind[idx(xx, yy)] = 1;
      }
    }
  };
  rooms.forEach(stampRoom);
  corridors.forEach(stamp);

  // 4) wall pass — any void 8-adjacent to floor becomes wall.
  const isFloor = (cx: number, cy: number) =>
    cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS && kind[idx(cx, cy)] === 1;
  const walls: number[] = [];
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (kind[idx(cx, cy)] !== 0) continue;
      let adj = false;
      for (let dy = -1; dy <= 1 && !adj; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && isFloor(cx + dx, cy + dy)) {
            adj = true;
            break;
          }
        }
      if (adj) walls.push(idx(cx, cy));
    }
  }
  walls.forEach((i) => (kind[i] = 2));

  // 5) tile id per cell: floor → random land mix; wall → the single brick tile.
  const cellTiles: number[] = new Array(COLS * ROWS).fill(-1);
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const k = kind[idx(cx, cy)];
      if (k === 1) cellTiles[idx(cx, cy)] = pick(rng, FLOOR_PLAIN);
      else if (k === 2) cellTiles[idx(cx, cy)] = pick(rng, WALL_BODY);
    }
  }

  // 6) bare map structure only — no decoration props, torches, chests or NPCs.
  const staticProps: PlacedProp[] = [];
  const torches: { x: number; y: number }[] = [];
  const chests: ChestMarker[] = [];
  const px = (c: number) => c * CELL;

  // 7) NPC roam area — the hub interior, inset by a cell, in px.
  const walkBounds = {
    x: px(hub.x + 1),
    y: px(hub.y + 1),
    w: (hub.w - 2) * CELL,
    h: (hub.h - 2) * CELL,
  };

  // 8) role-tagged block outlines — hub / plain project rooms.
  const blocks: RoomBlock[] = rooms.map((r) => ({
    id: r.projectId ?? "hub",
    role: r === hub ? "hub" : "project",
    x: px(r.x),
    y: px(r.y),
    w: r.w * CELL,
    h: r.h * CELL,
    cols: r.w,
    rows: r.h,
  }));

  return { cols: COLS, rows: ROWS, cell: CELL, cellTiles, staticProps, torches, chests, walkBounds, blocks };
}

/** Built once — deterministic, so it's safe at module scope. */
export const DUNGEON: DungeonMap = build();
