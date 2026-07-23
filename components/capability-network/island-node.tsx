"use client";

import { memo } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { ACCENTS } from "@/lib/accents";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";
import type { Slot } from "./types";

/**
 * IslandNode — one capability area as a floating island on the chart. Absolutely
 * positioned at its ring `slot`, it bobs gently and shows a name caption beneath
 * the art. It's a real <button> so the scene is keyboard-operable: hovering or
 * focusing charts a preview route line (`onHover`); clicking / Enter sets sail
 * (`onSelect`). `active` (ship is docked / sailing here) lights it with the area accent.
 *
 * Memoized: the parent re-renders on every stage-resize tick (see the
 * ResizeObserver in capability-network.tsx), which would otherwise re-render
 * every island on each frame of the sidebar's open/close transition.
 */
function IslandNodeComponent({
  category,
  index,
  slot,
  width,
  active,
  atShip,
  onHover,
  onSelect,
}: {
  category: SkillCategory;
  index: number;
  slot: Slot;
  /** Container width — px number or any CSS length (e.g. a clamp() string). */
  width: number | string;
  active: boolean;
  /** Ship is currently docked here — show the island's `artActive` (sea) form. */
  atShip: boolean;
  /** Chart a preview route to this island (hover / focus), or clear it (null). */
  onHover: (index: number | null) => void;
  /** Set sail to this island (click / Enter). */
  onSelect: (index: number) => void;
}) {
  const accent = ACCENTS[category.accent];
  const avgLevel = Math.round(
    category.skills.reduce((sum, s) => sum + s.level, 0) /
      Math.max(1, category.skills.length),
  );

  return (
    <button
      type="button"
      aria-label={`Set sail to ${category.label} — reveal its tech stack`}
      onClick={() => onSelect(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      className={cn("island-node", active && "island-node--active")}
      style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%`, width }}
    >
      <span
        className={cn("island-node__art-wrap", "animate-ship-bob")}
        style={{
          filter: active
            ? `drop-shadow(0 0 12px ${accent.hex}) drop-shadow(0 10px 14px rgba(0,0,0,0.55))`
            : "drop-shadow(0 8px 14px rgba(0,0,0,0.5))",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            (atShip ? category.artActive : undefined) ??
            category.art ??
            `${SPRITE_CONTROL.islands.dir}/island_${index + 1}.png`
          }
          alt=""
          aria-hidden
          className={cn("island-node__art", "pixelated", atShip && "island-node__art--docked")}
          draggable={false}
        />
      </span>

      {/* Name caption — a bold banner under the island. Accent-bordered and
          text-shadowed for legibility over the dark ocean; scales up when the
          ship is docked / sailing here. A second line surfaces the category's
          depth (skill count + honest average proficiency) right on the map. */}
      <span
        className={cn("island-node__caption", "font-pixel", active && "island-node__caption--active")}
        style={{ "--accent": accent.hex } as CSSProperties}
      >
        <span className="island-node__caption-line">
          <Icon name={category.icon} size={13} />
          {category.label}
        </span>
        <span className="island-node__caption-meta">
          {category.skills.length} skills · avg {avgLevel}%
        </span>
      </span>
    </button>
  );
}

export const IslandNode = memo(IslandNodeComponent);
