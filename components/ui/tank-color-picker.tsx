"use client";

import { useState } from "react";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * TankColorPicker — tank.png (public/sprites/factory/tank.png) is one flat
 * image with no layers/frames to swap (confirmed via Aseprite chunk
 * parsing: a single "Layer 1", no tags) — it bakes in both the tank body
 * *and* a legend of 10 selectable colour capsules next to it (4 cols × 3
 * rows, last column has only 1), plus a tiny 5×5 gauge dot near the top of
 * the tank that's the "current colour" indicator, hardcoded orange to match
 * swatch 0.
 *
 * There's also a taller twisted viewing tube running down the middle of the
 * tank body (the "semi curvic" strip between the dome and the legs) that's
 * meant to show the current liquid too — a flat colour swap there would
 * flatten its twist shading into a dead block, so its overlay (and the
 * gauge's, for the same reason) uses `mix-blend-mode: color`: it takes the
 * overlay's hue/saturation but keeps the tube's own luminance, so the
 * highlight/shadow bands stay visible under whichever colour is picked.
 * `isolation: isolate` on the wrapper keeps that blending scoped to this
 * component instead of reaching the page behind it.
 *
 * Selection is done by overlaying absolutely-positioned elements at the
 * exact pixel coordinates of the gauge, the tube, and each swatch (from
 * manual pixel analysis, converted to % of the 70×76 source so it stays
 * correct at any scale): the gauge/tube overlays show the current pick, and
 * 10 transparent buttons over the swatches set it.
 */

const TANK = SPRITE_CONTROL.factory.tank;

const TANK_COLORS = [
  { hex: "#d45101", box: [40, 46, 1, 25] as const },
  { hex: "#c5c5c5", box: [40, 46, 26, 50] as const },
  { hex: "#76429e", box: [40, 46, 51, 75] as const },
  { hex: "#0cd008", box: [48, 54, 1, 25] as const },
  { hex: "#853300", box: [48, 54, 26, 50] as const },
  { hex: "#429e8c", box: [48, 54, 51, 75] as const },
  { hex: "#a94a51", box: [56, 62, 1, 25] as const },
  { hex: "#5baa4b", box: [56, 62, 26, 50] as const },
  { hex: "#d79955", box: [56, 62, 51, 75] as const },
  { hex: "#426e9e", box: [64, 70, 1, 25] as const },
];

// Expanded 1px past the strictly-detected (17,21,6,10) bbox to fully cover
// the baked dot's anti-aliased edge pixels.
const GAUGE_BOX = [16, 23, 5, 12] as const;

// The twisted viewing tube: bounded top and bottom by the tank's two ring
// seams (solid black rows at y=25 and y=50) — below y=50 the similar-looking
// blue-grey banding is just the body's own shading across its *full* width,
// not the tube, so the box stops there rather than running into the legs.
const TUBE_BOX = [17, 23, 26, 50] as const;

function boxStyle([x0, x1, y0, y1]: readonly [number, number, number, number]) {
  return {
    left: `${(x0 / TANK.w) * 100}%`,
    top: `${(y0 / TANK.h) * 100}%`,
    width: `${((x1 - x0) / TANK.w) * 100}%`,
    height: `${((y1 - y0) / TANK.h) * 100}%`,
  };
}

export function TankColorPicker() {
  const [selected, setSelected] = useState(0);

  return (
    <div style={{ position: "relative", width: TANK.w, height: TANK.h, isolation: "isolate" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TANK.src}
        alt="liquid tank"
        width={TANK.w}
        height={TANK.h}
        className="pixelated"
        style={{ position: "absolute", inset: 0 }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          ...boxStyle(TUBE_BOX),
          backgroundColor: TANK_COLORS[selected].hex,
          mixBlendMode: "color",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          ...boxStyle(GAUGE_BOX),
          backgroundColor: TANK_COLORS[selected].hex,
          mixBlendMode: "color",
        }}
      />
      {TANK_COLORS.map((c, i) => (
        <button
          key={c.hex}
          type="button"
          aria-label={`Set tank liquid colour ${i + 1}`}
          aria-pressed={i === selected}
          onClick={() => setSelected(i)}
          style={{
            position: "absolute",
            ...boxStyle(c.box),
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            outline: i === selected ? "2px solid var(--color-ops-sand)" : "none",
            outlineOffset: 1,
          }}
        />
      ))}
    </div>
  );
}
