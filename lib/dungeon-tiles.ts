/**
 * dungeon-tiles — tile-id pools for the Projects dungeon map, plus a small
 * deterministic PRNG. Every id here exists as
 * /public/sprites/dungeon-tiles/tile_<id>.png.
 *
 * The map is rendered as bare structure only — wall + floor sand. Decoration
 * props, torches, chests and NPCs were removed, so the tile set is just those
 * structural tiles, renumbered orderly from 1.
 *
 * The map builder (lib/dungeon-layout.ts) reads these pools; the canvas renderer
 * (components/project-ecosystem/dungeon-tiles-canvas.tsx) paints them.
 */

export const tileSrc = (id: number) => `/sprites/dungeon-tiles/tile_${id}.png`;

/** Inner map walls — a single brick tile for every wall cell. */
export const WALL_BODY = [1] as const;

/** Land surface — a random mix of these four floor-sand tiles fills every floor cell. */
export const FLOOR_PLAIN = [2, 3, 4, 5] as const;

/** Every tile id the renderer may need to preload. */
export const ALL_USED_TILES: number[] = Array.from(
  new Set<number>([...WALL_BODY, ...FLOOR_PLAIN])
);

/** mulberry32 — tiny deterministic PRNG so the map/scatter is stable per seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
