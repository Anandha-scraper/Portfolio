"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";
import { BOOK_ASPECT } from "@/components/book/magic-book";
import type { MagicBookLine, MagicBookPage } from "@/components/book/magic-book";
import { ProjectPlate } from "@/components/project-ecosystem/project-plate";
import type { Project } from "@/types";
const MagicBook = dynamic(() => import("@/components/book/magic-book"), { ssr: false });

/**
 * master.tsx — arranges the book (MagicBook) and the screenshot plate
 * (ProjectPlate) inside the Project Dungeon panel. How the two columns
 * sit next to each other lives in master.css, including the row/column switch
 * (a `@container dungeon-panel` query, not a media query — see that file);
 * each child owns its own internals in its own stylesheet. Nothing here sets
 * layout in JS.
 *
 * What this file does own beyond composition: the book's page-turn navigation
 * (Prev/Next when there's room for two columns, swipe otherwise) — content is
 * chunked into as many pages as it takes to fit without scrolling (see
 * LINES_PER_PAGE) rather than one page with an internal scrollbar — and the
 * book canvas's backing-store resolution, which has to be a number in JS
 * because CSS can't set a <canvas>'s width/height attributes.
 */

// ── Canvas resolution clamp — the book's drawn pixel size, not its layout ──
// The floor sits at 280px so the canvas never exceeds the panel's content
// box on a 320px viewport (panel padding + section padding eat ~40px), which
// would otherwise clip the page-turn art at the edges.
const BOOK_MIN_PX = 280;
const BOOK_MAX_PX = 1100;
const OPEN_DELAY_MS = 200;
const SWIPE_THRESHOLD_PX = 40;
const LINES_PER_PAGE = 6;

function splitOverview(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function chunk<T>(items: T[], size: number): T[][] {
  if (!items.length) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function buildPages(project: Project): MagicBookPage[] {
  const links = [
    project.links.github ? `GitHub: ${project.links.github}` : null,
    project.links.live ? `Live: ${project.links.live}` : null,
  ].filter((line): line is string => Boolean(line));

  const line = (text: string, kind?: MagicBookLine["kind"]): MagicBookLine => ({ text, kind });

  const leftLines: MagicBookLine[] = [
    line(project.name, "title"),
    line(project.tagline, "meta"),
    line(`${project.status} · ${project.year} · ${project.category}`, "meta"),
    line(""),
    line("Overview", "label"),
    ...splitOverview(project.overview).map((s) => line(s, "body")),
  ];

  const rightLines: MagicBookLine[] = [];
  if (project.highlights.length) {
    rightLines.push(line("Highlights", "label"), ...project.highlights.map((h) => line(`• ${h}`, "bullet")));
  }
  if (project.stack.length) {
    if (rightLines.length) rightLines.push(line(""));
    rightLines.push(line("Stack", "label"), line(project.stack.join(", "), "body"));
  }
  if (project.metrics.length) {
    if (rightLines.length) rightLines.push(line(""));
    rightLines.push(
      line("Metrics", "label"),
      ...project.metrics.map((m) => line(`${m.prefix ?? ""}${m.value}${m.suffix ?? ""} — ${m.label}`, "bullet"))
    );
  }
  if (links.length) {
    if (rightLines.length) rightLines.push(line(""));
    rightLines.push(line("Links", "label"), ...links.map((l) => line(l, "bullet")));
  }

  const leftChunks = chunk(leftLines, LINES_PER_PAGE);
  const rightChunks = chunk(rightLines, LINES_PER_PAGE);
  const pageCount = Math.max(leftChunks.length, rightChunks.length);

  return Array.from({ length: pageCount }, (_, i) => ({
    left: leftChunks[i] ?? [],
    right: rightChunks[i] ?? [],
  }));
}

export function Master({ project }: { project: Project }) {
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const previewColRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [bookSize, setBookSize] = useState(BOOK_MIN_PX);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);

  const pages = buildPages(project);
  const pageCount = pages.length;

  useEffect(() => {
    const el = previewColRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const limiting = rect ? Math.min(rect.width, rect.height / BOOK_ASPECT) : BOOK_MIN_PX;
      setBookSize(Math.min(BOOK_MAX_PX, Math.max(BOOK_MIN_PX, Math.round(limiting))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const goToPage = useCallback(
    (next: number) => {
      if (animating || next < 0 || next >= pageCount || next === page) return;
      setAnimating(true);
      setPage(next);
    },
    [animating, page, pageCount]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goToPage(page + 1);
    else goToPage(page - 1);
  };

  return (
    <div className="master__root">
      <div className="master__book-col">
        {pageCount > 1 && (
          <div className="master__page-topbar">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 0 || animating}
              onClick={() => goToPage(page - 1)}
              className="master__flip-btn master__flip-btn--prev"
            />
            <span className="master__page-topbar-count">
              {page + 1}/{pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount - 1 || animating}
              onClick={() => goToPage(page + 1)}
              className="master__flip-btn master__flip-btn--next"
            />
          </div>
        )}

        <div
          ref={bookContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="master__book-wrap"
        >
          <MagicBook
            isOpen={isOpen}
            page={page}
            pages={pages}
            width={bookSize}
            height={Math.round(bookSize * BOOK_ASPECT)}
            lineDelayMs={140}
            onAnimationComplete={(event) => {
              if (event === "flipped") setAnimating(false);
            }}
          />
        </div>

        {pageCount > 1 && (
          <div className="master__page-nav">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 0 || animating}
              onClick={() => goToPage(page - 1)}
              className="master__page-nav-btn"
            >
              <Icon name="ChevronLeft" size={14} />
            </button>
            <span>
              {page + 1}/{pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount - 1 || animating}
              onClick={() => goToPage(page + 1)}
              className="master__page-nav-btn"
            >
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        )}
      </div>

      {/* The plate sizes itself from each screenshot's own aspect ratio
          (project-plate.css) — this column only decides how wide it may get. */}
      <div ref={previewColRef} className="master__preview-col">
        <ProjectPlate project={project} />
      </div>
    </div>
  );
}


