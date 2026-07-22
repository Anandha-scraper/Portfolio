/**
 * DungeonTreasures — pins one treasure asset (catalogued in the Asset
 * Gallery, feed/treasure/ → /sprites/treasure) at the interaction point of
 * each sector A–H (TREASURE_POINTS, lib/dungeon-treasure-points.ts — the
 * same points the hero's proximity check uses). Map-space overlay (map-px
 * coords), so it pans/zooms with the camera. Each marker is a real button
 * that opens that sector's project on click; whichever sector should
 * currently glow (`highlightSector` — hero proximity in Playground mode, or
 * the active slide in slideshow mode) invites the E / ⚔ interact / view.
 */

import { TREASURE_POINTS } from "@/lib/dungeon-treasure-points";
import { cn } from "@/lib/utils";

const SIZE = 60;

export function DungeonTreasures({
  onSectorClick,
  highlightSector,
}: {
  onSectorClick: (sector: string) => void;
  highlightSector?: string | null;
}) {
  return (
    <div className="dungeon-treasures__layer">
      {TREASURE_POINTS.map(({ sector, treasure, x, y }) => {
        const near = highlightSector === sector;
        return (
          <button
            key={sector}
            type="button"
            aria-label={`Open sector ${sector} treasure`}
            className={cn("dungeon-treasures__marker", "cursor-pointer", near && "dungeon-treasures__marker--near")}
            style={{ left: x - SIZE / 2, top: y - SIZE / 2, width: SIZE, height: SIZE }}
            onClick={() => onSectorClick(sector)}
          >
            {/* proximity glow ring */}
            <span
              aria-hidden
              className={cn("dungeon-treasures__glow", near && "dungeon-treasures__glow--near")}
              style={{ boxShadow: near ? "0 0 18px rgba(226,88,34,0.45)" : undefined }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/sprites/treasure/treasure_${String(treasure).padStart(2, "0")}.png`}
              alt=""
              width={SIZE}
              className={cn("dungeon-treasures__icon", "pixelated")}
            />
          </button>
        );
      })}
    </div>
  );
}
