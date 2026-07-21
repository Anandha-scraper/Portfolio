"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ACCENTS, type Accent } from "@/lib/accents";
import { BookPage, type BookEntry } from "@/components/book/book-page";

interface BookTab {
  label: string;
  icon: string; // /sprites/book/icon_*.png
  accent: Accent;
  entries: BookEntry[];
}

// Placeholder content — generic and renameable. Real data (skills, projects,
// …) gets wired in later; this only demonstrates the shell works.
const TABS: BookTab[] = [
  {
    label: "Tab 1",
    icon: "/sprites/book/icon_home.png",
    accent: "blue",
    entries: [
      { name: "Entry A", description: "Placeholder description text — swap this for real content later." },
      { name: "Entry B", description: "A second placeholder entry, so the list has something to scroll." },
      { name: "Entry C", description: "A third placeholder entry, rounding out the demo list." },
    ],
  },
  {
    label: "Tab 2",
    icon: "/sprites/book/icon_gear.png",
    accent: "coral",
    entries: [
      { name: "Entry A", description: "Placeholder description text — swap this for real content later." },
      { name: "Entry B", description: "A second placeholder entry, so the list has something to scroll." },
    ],
  },
  {
    label: "Tab 3",
    icon: "/sprites/book/icon_tick.png",
    accent: "emerald",
    entries: [
      { name: "Entry A", description: "Placeholder description text — swap this for real content later." },
      { name: "Entry B", description: "A second placeholder entry, so the list has something to scroll." },
      { name: "Entry C", description: "A third placeholder entry, rounding out the demo list." },
    ],
  },
  {
    label: "Tab 4",
    icon: "/sprites/book/icon_cross.png",
    accent: "violet",
    entries: [
      { name: "Entry A", description: "Placeholder description text — swap this for real content later." },
    ],
  },
];

/**
 * BookPanel — codex/inventory-style book UI (see SPRITE_CONTROL.book): a
 * two-page spread with a right-edge tab column, page-turn transition on tab
 * switch (mirrors project-dungeon-panel.tsx's rotateY flip). Currently a
 * self-contained demo with placeholder content — see app/layout.tsx for the
 * temporary toggle that mounts it.
 */
export function BookPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const reduceMotion = useReducedMotion();
  const tab = TABS[activeTab];

  const pageTransition = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, rotateY: -8 },
        animate: { opacity: 1, rotateY: 0 },
        exit: { opacity: 0, rotateY: 8 },
      };

  return (
    <div
      className="relative mx-auto flex h-[420px] w-full max-w-2xl sm:h-[480px]"
      style={{ perspective: 1600 }}
    >
      {/* Page background */}
      <div className="absolute inset-0 flex overflow-hidden rounded-sm shadow-lg">
        <div
          className="flex-1"
          style={{
            backgroundImage: "url(/sprites/book/page_left.png)",
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
        />
        <div
          aria-hidden
          className="w-2 shrink-0 bg-gradient-to-r from-black/30 via-black/5 to-black/30"
        />
        <div
          className="flex-1"
          style={{
            backgroundImage: "url(/sprites/book/page_right.png)",
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* Foreground content */}
      <div className="relative flex min-h-0 flex-1 flex-col p-4 sm:p-6" style={{ transformStyle: "preserve-3d" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            {...pageTransition}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <BookPage title={tab.label} icon={tab.icon} accent={tab.accent} entries={tab.entries} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab column — bookmark tags along the right edge */}
      <div className="absolute right-0 top-8 z-10 flex translate-x-[60%] flex-col gap-2">
        {TABS.map((t, i) => {
          const accent = ACCENTS[t.accent];
          const isActive = i === activeTab;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setActiveTab(i)}
              aria-label={t.label}
              aria-pressed={isActive}
              title={t.label}
              className={cn(
                "relative flex h-10 w-8 shrink-0 items-center justify-center transition-transform",
                isActive ? "-translate-x-2" : "hover:-translate-x-1"
              )}
              style={{
                backgroundImage: "url(/sprites/book/tab.png)",
                backgroundSize: "100% 100%",
                imageRendering: "pixelated",
                filter: isActive ? `drop-shadow(0 0 6px ${accent.glow})` : undefined,
              }}
            >
              <span
                aria-hidden
                className={cn("h-3.5 w-3.5", accent.bgSolid, isActive ? "opacity-100" : "opacity-70")}
                style={{
                  WebkitMaskImage: `url(${t.icon})`,
                  maskImage: `url(${t.icon})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
