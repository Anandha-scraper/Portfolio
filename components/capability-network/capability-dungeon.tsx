"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName } from "@/components/ui/icon";
import { TechRadialChart } from "./tech-radial-chart";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";

/**
 * CapabilityDungeon — the "tech dungeon" panel that docks beneath the chest
 * sidebar as the bottom half of the Capabilities left column. It always mirrors
 * the island the ship is docked at. Framed as a dungeon room (the same nine-slice
 * stone wall as the voyage stage; `16 fill` tiles the stone floor as the inner
 * background, matching components/ui/dungeon-frame.tsx).
 *
 * Body is a radial completion chart (TechRadialChart): one ring per skill, sweep =
 * completion out of 100; hovering a ring reveals its icon + name + %.
 */
export function CapabilityDungeon({
  category,
  className,
  navSlot,
}: {
  category: SkillCategory;
  /** Positioning classes from the parent (the fixed dock fills its container). */
  className?: string;
  /** Optional content rendered between the header and the chart body — used
   *  by the mobile stacked layout (capability-network.tsx) to slot in the
   *  nav list without duplicating this component's header/frame markup. */
  navSlot?: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      role="region"
      aria-label={`${category.label} capability dungeon`}
      className={cn(
        "pixelated relative flex min-h-0 w-full flex-col overflow-hidden outline-none",
        className
      )}
      style={{
        // Dungeon-wall nine-slice — `16 fill` tiles the stone floor as the
        // panel's inner background (same pattern as components/ui/dungeon-frame).
        borderStyle: "solid",
        borderWidth: "clamp(14px, 1.6vw, 22px)",
        borderImageSource: "url(/sprites/dungeon/wall_9slice.png)",
        borderImageSlice: "16 fill",
        borderImageRepeat: "repeat",
        imageRendering: "pixelated",
      }}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header — a bold, page-name-sized title (like the sidebar nav labels)
          over a one-line blurb, on a hairline divider. */}
      <div className="mb-2 flex shrink-0 flex-col gap-0.5 border-b border-ops-line/70 px-0.5 pb-1.5">
        <span className="font-pixel flex items-center gap-2 text-xl font-bold leading-none text-ops-sand">
          <Icon name={category.icon as IconName} size={18} className="shrink-0" />
          {category.label}
        </span>
        <span className="font-pixel-readable truncate text-[0.62rem] leading-tight text-ops-sand-faint">
          {category.blurb}
        </span>
      </div>

      {navSlot}

      {/* Body — radial completion chart; hover a ring for icon + name + %. */}
      <TechRadialChart category={category} className="min-h-0 w-full flex-1" />
    </motion.div>
  );
}
