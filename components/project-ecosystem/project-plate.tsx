"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { ACCENTS } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * ProjectPlate — the screenshot pane of the Project Dungeon panel: a stone
 * tablet holding one screenshot, with a carved name banner beneath it and, when
 * a project has more than one image, rune pagers plus a plate counter.
 *
 * Sizing is the whole trick here, and it is deliberate. Screenshots are
 * uploaded at whatever shape they were captured at (~2:1 desktop today, maybe
 * portrait mobile captures later), so rather than hardcoding a ratio the plate
 * reads each image's own `naturalWidth/naturalHeight` on load and hands it to
 * CSS as `--plate-ratio`. project-plate.css then sizes the screen box to that
 * ratio *and* caps its height, so an image can never letterbox (the box always
 * matches the picture) and never overflow the panel — see the width `min()`
 * in that file.
 *
 * A project with more than one screenshot cycles them on its own every
 * PREVIEW_INTERVAL_MS. The rotation holds while a pointer is over the plate,
 * so hovering (or resting a finger on) an interesting shot keeps it up; the
 * rune pagers still jump straight to a shot at any time.
 *
 * `--accent` comes from the project so the banner and the lit rune pick up the
 * project's colour, the same way project-dungeon-panel.tsx tints its card.
 *
 * Imported once from app/layout.tsx like every stylesheet here (the App Router
 * only allows global CSS from the root layout), so this file does NOT import
 * its own CSS.
 */

/** Seeded so the first paint already has the common desktop shape and doesn't
 *  jump once the real image reports its dimensions. */
const DEFAULT_RATIO = 2;

/** How long each screenshot holds before the plate advances itself. */
const PREVIEW_INTERVAL_MS = 3000;

export function ProjectPlate({ project }: { project: Project }) {
  const images = project.previewImages ?? [];
  const [active, setActive] = useState(0);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [held, setHeld] = useState(false);

  const count = images.length;
  const multiple = count > 1;

  // The dungeon reuses this component across projects, and the next project
  // may have fewer screenshots than the index we were left on.
  useEffect(() => setActive(0), [project.id]);

  useEffect(() => {
    if (!multiple || held) return;
    const timer = window.setInterval(
      () => setActive((i) => (i + 1) % count),
      PREVIEW_INTERVAL_MS
    );
    return () => window.clearInterval(timer);
  }, [multiple, held, count, project.id]);

  // Warm the next screenshot so a rotation swaps to a decoded image instead of
  // a blank frame. Each swap replaces the <img> element (it is keyed on src),
  // and a fresh element that only lives 3s never reliably finishes a lazy
  // load — so the plate fetches ahead rather than deferring.
  useEffect(() => {
    if (!multiple) return;
    const next = images[(active + 1) % count];
    if (next) new Image().src = next;
  }, [active, count, multiple, images]);

  const current = images[active];
  if (!current) return null;

  return (
    <figure
      className="project-plate"
      /* Pointer, not mouse, events: one handler pair covers hovering with a
         cursor and holding a finger on the plate. pointercancel matters on
         touch, where a scroll steals the pointer and no leave ever fires. */
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onPointerCancel={() => setHeld(false)}
      style={
        {
          "--accent": ACCENTS[project.accent].hex,
          "--plate-ratio": ratio,
        } as CSSProperties
      }
    >
      <DungeonFrame wall={16} className="project-plate__frame">
        <div className="project-plate__screen">
          {/* Raw <img>, not next/image: the static export sets
              images.unoptimized so next/image adds nothing, and this needs the
              natural dimensions off the load event anyway. */}
          <img
            key={current}
            src={current}
            alt={`${project.name} screenshot ${active + 1} of ${count}`}
            className="project-plate__img"
            decoding="async"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
          />
        </div>
      </DungeonFrame>

      <figcaption className="project-plate__placard">
        <span className="project-plate__name">{project.name}</span>

        {multiple && (
          <div className="project-plate__index">
            <div className="project-plate__runes" role="tablist" aria-label="Screenshots">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Screenshot ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={cn("project-plate__rune", i === active && "project-plate__rune--on")}
                />
              ))}
            </div>
            <span className="project-plate__count">
              {String(active + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}
            </span>
          </div>
        )}
      </figcaption>
    </figure>
  );
}
