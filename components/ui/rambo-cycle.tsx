"use client";

import { SpriteCycle, type CyclePhase } from "@/components/ui/sprite-cycle";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * RamboCycle — the Rambo character as one continuous loop instead of five
 * separate static thumbnails: idle → run → run (mirrored, i.e. "moving
 * left" — there's no separate left-facing art, PixelSprite's `flip` mirrors
 * the same run strip) → jump → fall → repeat. Each phase stays individually
 * addressable via SPRITE_CONTROL.rambo for whichever live scene ends up
 * classifying/triggering them on their own (walk input, jump input, etc.) —
 * this cycle is only a combined preview.
 */

const { idle, run, jump, fall } = SPRITE_CONTROL.rambo;

const PHASES: CyclePhase[] = [
  { mode: "hold", ...idle, holdMs: 900 },
  { mode: "hold", ...run, holdMs: 700 },
  { mode: "hold", ...run, holdMs: 700, flip: true },
  { mode: "hold", src: jump.src, frames: 1, frameW: jump.w, frameH: jump.h, scale: jump.scale, frameMs: 200, holdMs: 500 },
  { mode: "hold", src: fall.src, frames: 1, frameW: fall.w, frameH: fall.h, scale: fall.scale, frameMs: 200, holdMs: 500 },
];

export function RamboCycle() {
  return <SpriteCycle phases={PHASES} />;
}
