"use client";

import { SpriteCycle, type CyclePhase } from "@/components/ui/sprite-cycle";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * ReactorCycle — plays the "factory v.2" reactor as one continuous loop
 * instead of three separate static thumbnails: opening (once) → idle (held
 * for reactorCycleHoldMs) → closing (once) → repeat. See SpriteCycle for the
 * phase state machine itself.
 */

const { reactorOpening, reactorClosing, reactorIdle, reactorCycleHoldMs } =
  SPRITE_CONTROL.factory;

const PHASES: CyclePhase[] = [
  { mode: "once", ...reactorOpening },
  { mode: "hold", ...reactorIdle, holdMs: reactorCycleHoldMs },
  { mode: "once", ...reactorClosing },
];

export function ReactorCycle() {
  return <SpriteCycle phases={PHASES} />;
}
