"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Accent } from "@/lib/accents";
import { ACCENTS } from "@/lib/accents";

export interface BookEntry {
  name: string;
  description: string;
}

interface BookPageProps {
  title: string;
  icon: string; // /sprites/book/icon_*.png, shown in every row's slot
  accent: Accent;
  entries: BookEntry[];
}

/**
 * BookPage — the list+description two-pane layout from the pack's "Items"
 * reference: a scrollable named-row list on the left (built from
 * /sprites/book/row_bg*.png + slot.png), a description panel on the right
 * (/sprites/book/panel_bg.png). Takes generic `entries` so real content
 * (skills, projects, …) can be dropped in later without touching this file.
 */
export function BookPage({ title, icon, accent, entries }: BookPageProps) {
  const [selected, setSelected] = useState(0);
  const active = entries[selected];
  const accentClasses = ACCENTS[accent];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-4">
      {/* Left page — entry list */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-pixel text-[0.55rem] uppercase tracking-widest text-ops-sand-soft">
            {title}
          </p>
          <p className="font-pixel-readable text-xs text-ops-sand-soft/70">
            {entries.length ? selected + 1 : 0}/{entries.length}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {entries.map((entry, i) => (
            <button
              key={entry.name}
              type="button"
              onClick={() => setSelected(i)}
              className="relative flex shrink-0 items-center gap-2 px-2 py-1.5 text-left"
              style={{
                backgroundImage: `url(${i === selected ? "/sprites/book/row_bg_active.png" : "/sprites/book/row_bg.png"})`,
                backgroundSize: "100% 100%",
                imageRendering: "pixelated",
              }}
            >
              <span
                className="relative flex h-7 w-7 shrink-0 items-center justify-center"
                style={{
                  backgroundImage: "url(/sprites/book/slot.png)",
                  backgroundSize: "100% 100%",
                  imageRendering: "pixelated",
                }}
              >
                <span
                  aria-hidden
                  className={cn("h-3 w-3", accentClasses.bgSolid)}
                  style={{
                    WebkitMaskImage: `url(${icon})`,
                    maskImage: `url(${icon})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
              </span>
              <span
                className={cn(
                  "font-pixel-readable truncate text-sm",
                  i === selected ? "text-ops-base" : "text-ops-sand"
                )}
              >
                {entry.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right page — description panel */}
      <div
        className="flex min-h-0 flex-1 flex-col p-4"
        style={{
          backgroundImage: "url(/sprites/book/panel_bg.png)",
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      >
        {active ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "font-pixel rounded-sm px-2 py-1 text-[0.5rem] uppercase tracking-widest text-ops-base",
                  accentClasses.bgSolid
                )}
              >
                Description
              </span>
              <span className="font-pixel-readable text-xs text-ops-base/60">
                {selected + 1}/{entries.length}
              </span>
            </div>
            <img
              src="/sprites/ui/pageline.png"
              alt=""
              aria-hidden
              className="pixelated mb-3 h-[2px] w-full object-cover opacity-60"
            />
            <h4 className="mb-1 text-base font-bold text-ops-base">{active.name}</h4>
            <p className="font-pixel-readable text-sm leading-relaxed text-ops-base/80">
              {active.description}
            </p>
          </>
        ) : (
          <p className="font-pixel-readable text-sm text-ops-base/60">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
