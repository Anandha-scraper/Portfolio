"use client";

import { useEffect, useRef } from "react";
import { DUNGEON, MAP_W, MAP_H } from "@/lib/dungeon-layout";
import { ALL_USED_TILES, tileSrc } from "@/lib/dungeon-tiles";

/**
 * DungeonTilesCanvas — bakes the whole floor + wall grid into ONE <canvas>,
 * drawn once at native resolution with nearest-neighbour scaling (crisp pixels).
 * Far cheaper than ~1700 DOM cells. It's the bottom child of the panned map
 * layer (its parent handles the camera transform), so panning never repaints
 * this canvas.
 */
export function DungeonTilesCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    const { cols, rows, cell, cellTiles } = DUNGEON;
    const imgs = new Map<number, HTMLImageElement>();
    let cancelled = false;

    const draw = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, MAP_W, MAP_H);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const id = cellTiles[cy * cols + cx];
          if (id < 0) continue;
          const im = imgs.get(id);
          if (im) ctx.drawImage(im, cx * cell, cy * cell, cell, cell);
        }
      }
    };

    // Load every used tile; redraw as each arrives so there's no hard flash.
    ALL_USED_TILES.forEach((id) => {
      const im = new Image();
      im.onload = () => {
        imgs.set(id, im);
        draw();
      };
      im.src = tileSrc(id);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      width={MAP_W}
      height={MAP_H}
      aria-hidden
      className="pixelated absolute left-0 top-0"
    />
  );
}
