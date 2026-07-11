/**
 * capability-dock — shared geometry for the Capabilities left-column pair: the
 * chest sidebar (nav) on top and the tech dungeon docked directly beneath it.
 *
 * Both panels are `position: fixed` but live in different components
 * (`components/navigation/chest-sidebar.tsx` and
 * `components/capability-network/capability-network.tsx`). Keeping their insets in
 * one place is what stops them drifting out of sync / overlapping.
 *
 * The column spans from `TOP`px down to `BOTTOM`px, split so the nav is 3× the
 * dungeon's height (dungeon ≈ 1/3 of the nav), with a `GAP` between them:
 *
 *   navHeight   = 0.75 * (100vh - TOP - BOTTOM - GAP)
 *   dungeonTop  = TOP + navHeight + GAP
 *   dungeon     = { top: dungeonTop, bottom: BOTTOM }  → height ≈ 0.25 * column
 */

const TOP = 88; // px — top inset of the nav sidebar
const BOTTOM = 32; // px — bottom inset of the dungeon
const GAP = 12; // px — gap between nav bottom and dungeon top

// Available column height once the fixed insets + gap are removed.
const COLUMN = `(100vh - ${TOP + BOTTOM + GAP}px)`;

// Shared width for the whole docked column — the nav and the tech dungeon are the
// SAME width (no T-shape), sized wide enough that the dungeon's radial chart reads
// clearly. NAV_SPLIT is the nav's share of the column height; the rest goes to the
// tech dungeon (50/50).
const WIDTH = 396; // px
const NAV_SPLIT = 0.36; // nav gets 36% of the column, tech dungeon gets the remaining 64%

export const DOCK = {
  top: TOP,
  bottom: BOTTOM,
  /** Shared column width for both the nav and the tech dungeon. */
  width: `min(${WIDTH}px, calc(100vw - 2rem))`,
  /** Tech dungeon width — same as the nav. */
  dungeonWidth: `min(${WIDTH}px, calc(100vw - 2rem))`,
  /** Left padding the voyage stage yields to clear the fixed dock column. */
  stagePad: WIDTH + 24, // width + left inset + gap
  /** Nav height while docked — the nav's share of the split column. */
  navHeight: `calc(${COLUMN} * ${NAV_SPLIT})`,
  /** Dungeon's top edge — sits one GAP below the nav's bottom. */
  dungeonTop: `calc(${TOP + GAP}px + ${COLUMN} * ${NAV_SPLIT})`,
} as const;
