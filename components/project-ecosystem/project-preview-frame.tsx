"use client";

import { useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * ProjectPreviewFrame — the screenshot pane of ProjectDungeonPanel. A plain
 * rounded card (not the old /project-preview.png pixel-art window — that
 * made the actual screenshot hard to read) showing one previewImage at a
 * time, with a small dot/arrow switcher when a project has more than one.
 * No internal scrolling — index toggling instead.
 *
 * Deliberately carries no margin/gap/width/height of its own — those are
 * set exclusively by components/project-ecosystem/master.tsx (via `style`),
 * the single place that owns this and the book's layout. Everything else
 * is styled from project-preview-frame.css (imported once in app/layout.tsx).
 */
export function ProjectPreviewFrame({ project, style }: { project: Project; style?: CSSProperties }) {
  const images = project.previewImages ?? [];
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="preview-frame__card" style={style}>
      {current ? (
        <Image
          key={current}
          src={current}
          alt={`${project.name} screenshot ${active + 1}`}
          fill
          unoptimized
          priority={active === 0}
          className="preview-frame__image"
        />
      ) : (
        <div className="preview-frame__empty">No preview yet</div>
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous screenshot"
            onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
            className="preview-frame__nav-btn preview-frame__nav-btn--prev"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button
            type="button"
            aria-label="Next screenshot"
            onClick={() => setActive((i) => (i + 1) % images.length)}
            className="preview-frame__nav-btn preview-frame__nav-btn--next"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
          <div className="preview-frame__dots">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Screenshot ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn("preview-frame__dot", i === active && "preview-frame__dot--active")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
