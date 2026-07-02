"use client";

/**
 * Tabs — Aceternity-style tabs (ref.txt 1d provided only the demo, so the
 * core component is authored here). Horizontal tab buttons with a shared
 * `layoutId` active pill, and a stacked-card content area with a crossfade.
 *
 * Works uncontrolled (internal state) or controlled (`value` + `onValueChange`)
 * so a parent — e.g. the project Folders — can drive the active tab.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem {
  title: string;
  value: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  className,
  listClassName,
  tabClassName,
  activeTabClassName,
  contentClassName,
}: TabsProps) {
  const [internal, setInternal] = useState(tabs[0]?.value);
  const activeValue = value ?? internal;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.value === activeValue)
  );
  const active = tabs[activeIndex] ?? tabs[0];

  const setActive = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Tab buttons */}
      <div
        className={cn(
          "flex w-full flex-wrap items-center gap-2",
          listClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.value === active?.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActive(tab.value)}
              className={cn(
                "font-pixel relative rounded-md px-3 py-2 text-[0.5rem] uppercase tracking-wider transition-colors",
                isActive ? "text-ops-base" : "text-ops-sand-soft hover:text-ops-sand",
                tabClassName
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="ops-tab-pill"
                  className={cn(
                    "absolute inset-0 rounded-md bg-ops-olive",
                    activeTabClassName
                  )}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative z-10">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Stacked content area */}
      <div className={cn("relative mt-4", contentClassName)}>
        {/* decorative peek layers for depth */}
        <div
          aria-hidden
          className="absolute inset-x-3 -top-2 h-full rounded-2xl border border-ops-line bg-ops-surface/40"
        />
        <div
          aria-hidden
          className="absolute inset-x-6 -top-4 h-full rounded-2xl border border-ops-line bg-ops-surface/20"
        />
        <div className="relative overflow-hidden rounded-2xl border border-ops-line bg-ops-surface">
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {active?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
