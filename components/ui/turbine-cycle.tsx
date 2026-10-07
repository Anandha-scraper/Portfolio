"use client";

import { SpriteCycle, type CyclePhase } from "@/components/ui/sprite-cycle";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * Turbine1Cycle / Turbine2Cycle — the turbine pack's eight loose pieces
 * composed into two readable machines instead of eight unlabelled index
 * rows: turbine 1 is base -> anim 1 -> 2 -> 3 -> 4, turbine 2 is
 * anim 5 -> 6 -> 7, every phase holding PHASE_MS before advancing. Same
 * SpriteCycle phase machinery as the reactor/furnaces (see
 * components/ui/furnace-cycle.tsx).
 *
 * `base` is the pack's one static frame, so it's declared as a 1-frame
 * "strip" here — a hold phase with frames: 1 just parks on it (PixelSprite
 * skips its rAF entirely at frames <= 1), which is how the Rambo cycle
 * carries its jump/fall poses too.
 */

const T = SPRITE_CONTROL.turbine;

/** Every phase dwells this long before advancing. */
const PHASE_MS = 2000;

const TURBINE_1: CyclePhase[] = [
  { mode: "hold", src: T.base.src, frames: 1, frameW: T.base.w, frameH: T.base.h, scale: 1, frameMs: 120, holdMs: PHASE_MS },
  { mode: "hold", ...T.anim1, holdMs: PHASE_MS },
  { mode: "hold", ...T.anim2, holdMs: PHASE_MS },
  { mode: "hold", ...T.anim3, holdMs: PHASE_MS },
  { mode: "hold", ...T.anim4, holdMs: PHASE_MS },
];

const TURBINE_2: CyclePhase[] = [
  { mode: "hold", ...T.anim5, holdMs: PHASE_MS },
  { mode: "hold", ...T.anim6, holdMs: PHASE_MS },
  { mode: "hold", ...T.anim7, holdMs: PHASE_MS },
];

/** Re-scale every phase together. The gallery wants native size; a scene
 *  placing the turbine next to other machines needs to size it against them. */
const scaled = (phases: CyclePhase[], scale: number): CyclePhase[] =>
  scale === 1 ? phases : phases.map((p) => ({ ...p, scale: (p.scale ?? 1) * scale }));

export function Turbine1Cycle({ scale = 1 }: { scale?: number }) {
  return <SpriteCycle phases={scaled(TURBINE_1, scale)} />;
}

export function Turbine2Cycle({ scale = 1 }: { scale?: number }) {
  return <SpriteCycle phases={scaled(TURBINE_2, scale)} />;
}
