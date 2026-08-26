"use client";

import { PixelSprite } from "@/components/ui/pixel-sprite";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

const { left, right } = SPRITE_CONTROL.transporter;

/**
 * TransporterBelt — the two "extract/" roller tiles (left/right, see
 * lib/sprite-control.ts) placed directly against each other: spinning
 * roller, spinning roller. There's no middle segment — a real conveyor's
 * top and bottom surfaces move in opposite directions, and a flat scrolling
 * middle tile can only move one way, so every version of it (continuous
 * scroll, stepped scroll) read as wrong rather than just imperfect. Two
 * rollers touching reads correctly with no motion to get wrong. The two are
 * independent PixelSprite loop instances — same as every other multi-sprite
 * scene on the site, nothing syncs their frame indices — but both mount at
 * frame 0 on the same tick and share the same frameMs, so in practice they
 * spin together closely enough to read as one mechanism.
 */
export function TransporterBelt() {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <PixelSprite
        src={left.src}
        frames={left.frames}
        frameSize={left.frameSize}
        scale={left.scale}
        frameMs={left.frameMs}
        mode="loop"
        bob={false}
      />
      <PixelSprite
        src={right.src}
        frames={right.frames}
        frameSize={right.frameSize}
        scale={right.scale}
        frameMs={right.frameMs}
        mode="loop"
        bob={false}
      />
    </div>
  );
}
