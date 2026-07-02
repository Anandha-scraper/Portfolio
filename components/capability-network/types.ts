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
 * SHIP_HOME — the ship's starting berth: docked at the first island (is1). The
 * first navigation line is drawn from here until the user picks a course.
 */
export const SHIP_HOME: Slot = ROUTE_SLOTS[0];
