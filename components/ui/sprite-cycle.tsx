"use client";

import { useEffect, useState } from "react";
import { PixelSprite } from "@/components/ui/pixel-sprite";

/**
 * SpriteCycle — generic N-phase state machine, extracted from the reactor's
 * original 3-phase opening→idle→closing cycle (components/ui/reactor-cycle.tsx)
 * so the furnaces' 4-phase cycles don't re-implement the same thing.
 *
 * A `"once"` phase plays its strip through and advances on completion; a
 * `"hold"` phase loops and advances after `holdMs`. `index` wraps with
 * `% phases.length`, so the whole sequence repeats indefinitely. Each phase
 * is keyed by its index, forcing a remount on every transition — that's what
 * makes a `"once"` phase replay from frame 0 instead of resting on its last
 * frame the next time it comes around.
 */

export type CyclePhase =
  | {
      mode: "once";
      src: string;
      frames: number;
      frameW: number;
      frameH: number;
      frameMs: number;
      scale?: number;
    }
  | {
      mode: "hold";
      src: string;
      frames: number;
      frameW: number;
      frameH: number;
      frameMs: number;
      scale?: number;
      holdMs: number;
    };

export function SpriteCycle({ phases }: { phases: CyclePhase[] }) {
  const [index, setIndex] = useState(0);
  const phase = phases[index];
  const advance = () => setIndex((i) => (i + 1) % phases.length);

  if (phase.mode === "once") {
    return (
      <PixelSprite
        key={index}
        src={phase.src}
        frames={phase.frames}
        frameW={phase.frameW}
        frameH={phase.frameH}
        scale={phase.scale ?? 1}
        frameMs={phase.frameMs}
        mode="once"
        playOnMount
        onDone={advance}
      />
    );
  }

  return <HoldPhase key={index} phase={phase} onHoldDone={advance} />;
}

function HoldPhase({
  phase,
  onHoldDone,
}: {
  phase: Extract<CyclePhase, { mode: "hold" }>;
  onHoldDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onHoldDone, phase.holdMs);
    return () => clearTimeout(timer);
  }, [phase.holdMs, onHoldDone]);

  return (
    <PixelSprite
      src={phase.src}
      frames={phase.frames}
      frameW={phase.frameW}
      frameH={phase.frameH}
      scale={phase.scale ?? 1}
      frameMs={phase.frameMs}
      mode="loop"
      bob={false}
    />
  );
}
