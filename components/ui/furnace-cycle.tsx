"use client";

import { SpriteCycle, type CyclePhase } from "@/components/ui/sprite-cycle";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * BasicFurnaceCycle / AdvancedFurnaceCycle — each furnace as one continuous
 * loop instead of four separate static thumbnails: opening (once) → on
 * (once) → working/idle (held for furnace*CycleHoldMs) → off (once) →
 * repeat. See SpriteCycle for the phase state machine itself; ReactorCycle
 * is the 3-phase sibling of this.
 */

const {
  furnaceBasicOpening,
  furnaceBasicTurningOn,
  furnaceBasicWorking,
  furnaceBasicTurningOff,
  furnaceBasicCycleHoldMs,
  furnaceAdvancedOpening,
  furnaceAdvancedOn,
  furnaceAdvancedIdle,
  furnaceAdvancedOff,
  furnaceAdvancedCycleHoldMs,
} = SPRITE_CONTROL.factory;

const BASIC_PHASES: CyclePhase[] = [
  { mode: "once", ...furnaceBasicOpening },
  { mode: "once", ...furnaceBasicTurningOn },
  { mode: "hold", ...furnaceBasicWorking, holdMs: furnaceBasicCycleHoldMs },
  { mode: "once", ...furnaceBasicTurningOff },
];

const ADVANCED_PHASES: CyclePhase[] = [
  { mode: "once", ...furnaceAdvancedOpening },
  { mode: "once", ...furnaceAdvancedOn },
  { mode: "hold", ...furnaceAdvancedIdle, holdMs: furnaceAdvancedCycleHoldMs },
  { mode: "once", ...furnaceAdvancedOff },
];

export function BasicFurnaceCycle() {
  return <SpriteCycle phases={BASIC_PHASES} />;
}

export function AdvancedFurnaceCycle() {
  return <SpriteCycle phases={ADVANCED_PHASES} />;
}
