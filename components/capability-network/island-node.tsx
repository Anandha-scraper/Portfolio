"use client";

import { memo } from "react";
import { Icon } from "@/components/ui/icon";
import { ACCENTS } from "@/lib/accents";
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

  return (
    <button
      type="button"
      aria-label={`Set sail to ${category.label} — reveal its tech stack`}
      onClick={() => onSelect(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      className={cn(
        "group absolute -translate-x-1/2 -translate-y-1/2 select-none outline-none",
        active ? "z-30" : "z-20"
      )}
      style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%`, width }}
    >
      <span
        className={cn(
          "block animate-ship-bob will-change-transform motion-reduce:animate-none",
          "transition-[filter,transform] duration-300 group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
        )}
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
            `/sprites/islands/island_${index + 1}.png`
          }
          alt=""
          aria-hidden
          className={cn(
            "pixelated h-auto w-full origin-center transition-transform duration-500 ease-out",
            atShip && "scale-150"
          )}
          draggable={false}
        />
      </span>

      {/* Name caption — a bold banner under the island. Accent-bordered and
          text-shadowed for legibility over the dark ocean; scales up when the
          ship is docked / sailing here. */}
      <span
        className={cn(
          "font-pixel mx-auto mt-1.5 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border bg-black/70 px-2.5 py-1.5 text-[0.6rem] uppercase leading-none backdrop-blur-sm transition-transform duration-300 sm:text-[0.7rem]",
          active
            ? "scale-110 border-2 group-hover:scale-110"
            : "border group-hover:scale-105",
          accent.border,
          accent.text
        )}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)" }}
      >
        <Icon name={category.icon} size={13} />
        {category.label}
      </span>
    </button>
  );
}

export const IslandNode = memo(IslandNodeComponent);
