"use client";

import { SpriteCycle, type CyclePhase } from "@/components/ui/sprite-cycle";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * LightningBolt — the "extract/" lightning strips as one cycle: charging up
 * (once) → flickering (held for lightningCycleHoldMs) → fading out (once) →
 * repeat. Same SpriteCycle machinery as ReactorCycle/BasicFurnaceCycle
 * before it. `lightningSpot` (the ground impact glow) isn't part of this —
 * it's a separate, independent ambient loop, registered as its own
 * thumbnail in the Asset Gallery rather than a phase here.
 */

const {
  lightningBeginning,
  lightningCycle,
  lightningEnd,
  lightningCycleHoldMs,
} = SPRITE_CONTROL.effects;

const PHASES: CyclePhase[] = [
  { mode: "once", ...lightningBeginning },
  { mode: "hold", ...lightningCycle, holdMs: lightningCycleHoldMs },
  { mode: "once", ...lightningEnd },
];

export function LightningBolt() {
  return <SpriteCycle phases={PHASES} />;
}
