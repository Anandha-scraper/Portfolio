/** Shared geometry types for the Capabilities "Island Siege" scene. */
export interface Point {
  x: number;
  y: number;
}

/** A ring slot as a percentage of the stage box (0..100). */
export interface Slot {
  xPct: number;
  yPct: number;
}

/**
 * ROUTE_SLOTS — fixed island anchor positions laid out as a left→right zig-zag
 * (image.png), one slot per skill category in data/skills.ts (6), in category
 * order: frontend, backend, databases, devops, agentic-ai, web3. Odd indices sit
 * low, even indices sit high, so the chain reads as a continuous wave the ship
 * sails along (is1 left → is6 right, then off-screen and back to is1). Positions
 * are deterministic so the ship, islands, invisible anchor cards, and the chart's
 * navigation lines all read off the same layout. Tuned as % of the stage box.
 */
export const ROUTE_SLOTS: Slot[] = [
  { xPct: 12, yPct: 28 }, // is1 frontend   — top
  { xPct: 29, yPct: 70 }, // is2 backend    — bottom
  { xPct: 46, yPct: 28 }, // is3 databases  — top
  { xPct: 62, yPct: 70 }, // is4 devops     — bottom
  { xPct: 79, yPct: 28 }, // is5 agentic-ai — top
  { xPct: 92, yPct: 70 }, // is6 web3       — bottom (exits right)
];

/**
 * PORTRAIT_SLOTS — the same six islands re-arranged for portrait/phone stages
 * as a 2-column × 3-row serpentine (right, down, left, down, right), so the
 * chain still reads as one continuous route in the same category order and
 * `buildRoute`'s cyclic-hop + edge-wrap logic works unchanged (the is6 → is1
 * wrap still exits/enters horizontally).
 */
export const PORTRAIT_SLOTS: Slot[] = [
  { xPct: 26, yPct: 16 }, // is1 frontend   — row 1 left
  { xPct: 74, yPct: 16 }, // is2 backend    — row 1 right
  { xPct: 74, yPct: 50 }, // is3 databases  — row 2 right
  { xPct: 26, yPct: 50 }, // is4 devops     — row 2 left
  { xPct: 26, yPct: 84 }, // is5 agentic-ai — row 3 left
  { xPct: 74, yPct: 84 }, // is6 web3       — row 3 right (exits right)
];

/** Aspect ratio below which the stage switches to the portrait serpentine. */
const PORTRAIT_RATIO = 1.05;

/**
 * computeSlots — pick the island arrangement for a measured stage size.
 * Landscape keeps the classic left→right zig-zag; portrait (phones) uses the
 * 2×3 serpentine so islands never crowd or overlap at narrow widths.
 */
export function computeSlots(w: number, h: number): Slot[] {
  if (w <= 0 || h <= 0) return ROUTE_SLOTS;
  return w / h >= PORTRAIT_RATIO ? ROUTE_SLOTS : PORTRAIT_SLOTS;
}

/**
 * SHIP_HOME — the ship's starting berth: docked at the first island (is1). The
 * first navigation line is drawn from here until the user picks a course.
 * (Same slot in both arrangements' order — index 0.)
 */
export const SHIP_HOME: Slot = ROUTE_SLOTS[0];
