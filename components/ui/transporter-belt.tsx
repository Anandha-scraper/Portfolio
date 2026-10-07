"use client";

import { PixelSprite } from "@/components/ui/pixel-sprite";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

const { left, right, mid } = SPRITE_CONTROL.transporter;
// mid has no scale of its own (see sprite-control.ts) — match the rollers'
// so the flat surface tiles sit flush against them at the same height.
const MID_SCALE = left.scale;

/**
 * TransporterBelt — the two "extract/" roller tiles (left/right, see
 * lib/sprite-control.ts) with `segments` static `mid` surface tiles
 * in between: spinning roller, flat belt run, spinning roller. The surface
 * itself deliberately doesn't scroll — a real conveyor's top and bottom
 * surfaces move in opposite directions, and a flat scrolling middle tile can
 * only move one way, so every attempt at animating it (continuous scroll,
 * stepped scroll) read as wrong rather than just imperfect. A static run
 * between two spinning rollers reads correctly at any length; `segments`
 * controls just how long that run is. The two rollers are independent
 * PixelSprite loop instances — same as every other multi-sprite scene on
 * the site, nothing syncs their frame indices — but both mount at frame 0
 * on the same tick and share the same frameMs, so in practice they spin
 * together closely enough to read as one mechanism.
 */
export function TransporterBelt({ segments = 0 }: { segments?: number }) {
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
      {Array.from({ length: segments }, (_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={mid.src}
          alt=""
          width={mid.w * MID_SCALE}
          height={mid.h * MID_SCALE}
          className="pixelated"
        />
      ))}
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
