import { MAP_H, MAP_W } from "@/lib/dungeon-layout";
import { PROJECT_SECTOR_GROUPS } from "@/lib/dungeon-sectors";

/**
 * DungeonBlocks — plots each PROJECT_SECTOR_GROUPS entry as one hand-traced
 * polygon (the real floor outline, not a bounding box) labeled with its
 * group letter. Hidden by default; only `visibleSector` fades in (see
 * dungeon-map.tsx, which reveals it on hovering the sector's treasure marker).
 *
 * A pure map-space overlay (map-px coords), so it pans/zooms with the camera.
 */

const COLORS = [
  "rgba(224,122,63,0.7)", // rust
  "rgba(150,178,96,0.7)", // olive
  "rgba(214,193,142,0.75)", // sand
  "rgba(122,164,204,0.7)", // steel blue
];

export function DungeonBlocks({ visibleSector }: { visibleSector: string | null }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg
        className="absolute left-0 top-0 overflow-visible"
        width={MAP_W}
        height={MAP_H}
      >
        {PROJECT_SECTOR_GROUPS.map((g, i) => {
          const color = COLORS[i % COLORS.length];
          const xs = g.points.map((p) => p.x);
          const ys = g.points.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const fontSize = Math.round(Math.min(maxX - minX, maxY - minY) * 0.3);
          return (
            <g
              key={g.label}
              className="transition-opacity duration-300 ease-out"
              style={{ opacity: g.label === visibleSector ? 1 : 0 }}
            >
              <polygon
                points={g.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill={`color-mix(in srgb, ${color} 7%, transparent)`}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-pixel"
                fill={color}
                fontSize={fontSize}
              >
                {g.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
