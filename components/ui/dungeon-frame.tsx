import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * DungeonFrame — a stone-wall rectangle of *any* width/height, built from the
 * nine-slice tile sheet cut out of feed/demonstration.png
 * (public/sprites/dungeon/wall_9slice.png) by feed/extract_assets.py.
 *
 * It's a pure CSS `border-image` nine-slice: the 4 corners stay fixed, the 4
 * edges repeat along their sides, and `fill` tiles the floor tile across the
 * centre — so the same component scales to any container with no per-tile DOM.
 * `children` render in the content box, on top of the floor.
 */
export interface DungeonFrameProps {
  /** Wall thickness in px (the nine-slice border width). Default 28. */
  wall?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function DungeonFrame({
  wall = 28,
  className,
  style,
  children,
}: DungeonFrameProps) {
  return (
    <div
      className={cn("dungeon-frame", "pixelated", className)}
      style={{
        borderStyle: "solid",
        borderWidth: wall,
        borderImageSource: "url(/sprites/dungeon/wall_9slice.png)",
        borderImageSlice: "16 fill",
        borderImageRepeat: "repeat",
        borderImageWidth: `${wall}px`,
        imageRendering: "pixelated",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
