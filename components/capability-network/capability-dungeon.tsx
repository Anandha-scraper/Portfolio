"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName } from "@/components/ui/icon";
import { SkillChart } from "@/components/ui/skill-chart";
import TargetCursor from "@/components/ui/target-cursor";
import { ACCENTS } from "@/lib/accents";
import { techIconSrc } from "@/lib/tech-icons";
import { cn } from "@/lib/utils";
import type { Skill, SkillCategory } from "@/types";

/**
 * CapabilityDungeon — the right-side panel that pops out of the voyage wall when
 * the ship docks at an island. It's framed as a dungeon room: the same
 * nine-slice stone wall as the voyage stage (wall_9slice.png, `16 fill` — the
 * `fill` tiles the stone floor as the panel's inner background, matching
 * `components/ui/dungeon-frame.tsx`). The body holds:
 *   1. a SkillChart (the ported chart.txt bars) for the active skill, and
 *   2. a grid of the domain's tech-icon assets.
 * Hovering an icon triggers the scoped TargetCursor; clicking one morphs the
 * chart to that skill's completion. Skills with no pixel-art icon asset are
 * omitted from the grid (per design); the chart defaults to the domain's
 * strongest skill so it is never blank — even for icon-less domains (Web3 etc.).
 *
 * Layout is delegated to the parent: this card fills its container (`h-full
 * w-full`), so the parent decides desktop push-column vs. mobile overlay.
 */
export function CapabilityDungeon({
  category,
  takeFocus,
  onClose,
  className,
}: {
  category: SkillCategory;
  takeFocus: boolean;
  onClose: () => void;
  /** Positioning classes from the parent (desktop push-column vs mobile overlay). */
  className?: string;
}) {
  const reduce = useReducedMotion();
  const accent = ACCENTS[category.accent];
  const panelRef = useRef<HTMLDivElement>(null);

  // Skills that actually have a pixel-art icon asset.
  const iconSkills = useMemo(
    () => category.skills.filter((s) => techIconSrc(s.name)),
    [category]
  );
  // Strongest skill in the domain — the chart's default so it is never blank.
  const defaultSkill = useMemo(
    () => category.skills.reduce((best, s) => (s.level > best.level ? s : best), category.skills[0]),
    [category]
  );
  const [activeSkill, setActiveSkill] = useState<Skill>(defaultSkill);

  // New island docked → reset the chart to that domain's strongest skill.
  useEffect(() => setActiveSkill(defaultSkill), [defaultSkill]);

  useEffect(() => {
    if (takeFocus) panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, takeFocus]);

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label={`${category.label} capability dungeon`}
      tabIndex={-1}
      className={cn(
        "pixelated relative flex h-full w-full flex-col overflow-y-auto outline-none",
        className
      )}
      style={{
        // Dungeon-wall nine-slice — `16 fill` tiles the stone floor as the
        // panel's inner background (same pattern as components/ui/dungeon-frame).
        borderStyle: "solid",
        borderWidth: 22,
        borderImageSource: "url(/sprites/dungeon/wall_9slice.png)",
        borderImageSlice: "16 fill",
        borderImageRepeat: "repeat",
        borderImageWidth: "22px",
        imageRendering: "pixelated",
      }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 32 }}
      transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Scoped cursor — only the tech-icon buttons carry `.cursor-target`, and
          hideDefaultCursor is off so the global key-cursor still shows. */}
      <TargetCursor
        targetSelector=".cursor-target"
        hideDefaultCursor={false}
        cursorColor={accent.hex}
        spinDuration={3}
      />

      {/* Title row — light pixel label on the stone floor, with a hairline
          divider under it (no parchment banner). */}
      <div className="relative -mt-1 mb-3 flex shrink-0 items-center justify-between gap-2 border-b border-ops-line/70 px-1 pb-2">
        <span className="font-pixel flex items-center gap-2 text-[0.55rem] uppercase text-ops-sand">
          <Icon name={category.icon as IconName} size={12} />
          {category.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close capability dungeon"
          className="font-pixel text-[0.6rem] text-ops-sand-soft transition-transform hover:scale-125 hover:text-ops-sand"
        >
          ✕
        </button>
      </div>

      <p className="font-pixel-readable mb-2 px-1 text-center text-base leading-tight text-ops-sand-soft">
        {category.blurb}
      </p>

      {/* Chart for the active skill */}
      <SkillChart
        value={activeSkill.level}
        label={activeSkill.name}
        sublabel={activeSkill.note}
        accentHex={accent.hex}
        className="mb-3"
      />

      <div className="font-pixel mb-2 px-1 text-center text-[0.45rem] uppercase tracking-wider text-ops-sand-faint">
        {iconSkills.length > 0 ? "// select a tech" : "// no icon assets for this domain"}
      </div>

      {/* Tech-icon grid — each icon is a TargetCursor target that drives the chart. */}
      {iconSkills.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 px-1 pb-1">
          {iconSkills.map((skill) => {
            const src = techIconSrc(skill.name)!;
            const isActive = skill.name === activeSkill.name;
            return (
              <li key={skill.name} className="flex">
                <button
                  type="button"
                  onClick={() => setActiveSkill(skill)}
                  aria-label={`${skill.name} — ${skill.level}%`}
                  aria-pressed={isActive}
                  className={cn(
                    "cursor-target group flex w-full flex-col items-center gap-1 rounded-sm border p-1.5 transition-colors",
                    isActive ? accent.border : "border-transparent hover:border-white/20"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    aria-hidden
                    width={32}
                    height={32}
                    className={cn(
                      "pixelated h-8 w-8 transition-transform group-hover:-translate-y-0.5",
                      isActive ? "scale-110" : "opacity-80 group-hover:opacity-100"
                    )}
                    draggable={false}
                  />
                  <span
                    className={cn(
                      "font-pixel text-[0.4rem] leading-tight",
                      isActive ? accent.text : "text-ops-sand-faint"
                    )}
                  >
                    {skill.level}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
