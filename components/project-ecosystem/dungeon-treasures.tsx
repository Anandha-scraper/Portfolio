import { PROJECT_SECTOR_GROUPS } from "@/lib/dungeon-sectors";

/**
 * DungeonTreasures — pins one treasure asset (catalogued in the Asset
 * Gallery, feed/treasure/ → /sprites/treasure) at the center of sectors
 * A–G, using the same bounding-box-midpoint formula DungeonBlocks uses
 * for its sector labels. Map-space overlay (map-px coords), so it pans/zooms
 * with the camera. Each marker is a real button: hover reports in/out so
 * dungeon-map.tsx can reveal that sector's division outline, and clicking it
 * opens that sector's TreasureBookModal.
 */

const PLACEMENTS = [
  { sector: "A", treasure: 1 },
  { sector: "B", treasure: 2 },
  { sector: "C", treasure: 3 },
  { sector: "D", treasure: 4 },
  { sector: "E", treasure: 5 },
  { sector: "F", treasure: 6 },
  { sector: "G", treasure: 7 },
] as const;

const SIZE = 60;

export function DungeonTreasures({
  onSectorEnter,
  onSectorLeave,
  onSectorClick,
}: {
  onSectorEnter: (sector: string) => void;
  onSectorLeave: (sector: string) => void;
  onSectorClick: (sector: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {PLACEMENTS.map(({ sector, treasure }) => {
        const group = PROJECT_SECTOR_GROUPS.find((g) => g.label === sector);
        if (!group) return null;
        const xs = group.points.map((p) => p.x);
        const ys = group.points.map((p) => p.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        return (
          <button
            key={sector}
            type="button"
            data-no-pan
            aria-label={`Open sector ${sector} treasure`}
            className="pointer-events-auto absolute cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-110"
            style={{ left: cx - SIZE / 2, top: cy - SIZE / 2, width: SIZE, height: SIZE }}
            onMouseEnter={() => onSectorEnter(sector)}
            onMouseLeave={() => onSectorLeave(sector)}
            onClick={() => onSectorClick(sector)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/sprites/treasure/treasure_${String(treasure).padStart(2, "0")}.png`}
              alt=""
              width={SIZE}
              className="pixelated"
            />
          </button>
        );
      })}
    </div>
  );
}
