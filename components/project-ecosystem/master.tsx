"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ProjectPreviewFrame } from "@/components/project-ecosystem/project-preview-frame";
import { Icon } from "@/components/ui/icon";
import type { MagicBookPage } from "@/components/book/magic-book";
import type { Project } from "@/types";

const MagicBook = dynamic(() => import("@/components/book/magic-book"), { ssr: false });

/**
 * master.tsx — the *only* place that sets margin, gap, width, and height
 * for the book (MagicBook) and the screenshot previewer (ProjectPreviewFrame)
 * inside the Project Dungeon panel. Nothing else does: project-dungeon-panel.tsx
 * mounts <Master /> with no layout classes of its own, and neither
 * magic-book.tsx nor project-preview-frame.tsx carry any margin/width/height —
 * they take whatever this file gives them. Tune the constants below and
 * nothing else needs to change.
 *
 * Also owns the book's page-turn navigation (Prev/Next at lg:+, swipe below
 * it) — content is chunked into as many pages as it takes to fit without
 * scrolling (see LINES_PER_PAGE), rather than one page with an internal
 * scrollbar.
 */

// ── Layout knobs — the only place these are set ──────────────────────
const ROW_BREAKPOINT_PX = 1024; // matches Tailwind's `lg:` — below this, stack
const BOOK_COLUMN_RATIO = 1 / 2;
const PREVIEW_COLUMN_RATIO = 1 / 2;
const COLUMN_GAP_PX = 12; // minimal space between book column and preview column
const BOOK_MIN_PX = 320;
const BOOK_MAX_PX = 800;
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

  const leftLines = [
    project.name,
    project.tagline,
    `${project.status} · ${project.year} · ${project.category}`,
    "",
    ...splitOverview(project.overview),
  ];
  const rightLines = [
    ...project.highlights.map((h) => `• ${h}`),
    `Stack: ${project.stack.join(", ")}`,
    ...project.metrics.map(
      (m) => `${m.prefix ?? ""}${m.value}${m.suffix ?? ""} — ${m.label}`
    ),
    ...(links.length ? ["", ...links] : []),
  ];

  const leftChunks = chunk(leftLines, LINES_PER_PAGE);
  const rightChunks = chunk(rightLines, LINES_PER_PAGE);
  const pageCount = Math.max(leftChunks.length, rightChunks.length);

  return Array.from({ length: pageCount }, (_, i) => ({
    left: leftChunks[i] ?? [],
    right: rightChunks[i] ?? [],
  }));
}

export function Master({ project }: { project: Project }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [isRow, setIsRow] = useState(false);
  const [bookSize, setBookSize] = useState(BOOK_MIN_PX);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);

  const pages = buildPages(project);
  const pageCount = pages.length;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setIsRow(width >= ROW_BREAKPOINT_PX);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = bookContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const limiting = rect ? Math.min(rect.width, rect.height) : BOOK_MIN_PX;
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
    <div
      ref={rootRef}
      style={{
        display: "flex",
        flexDirection: isRow ? "row" : "column",
        alignItems: isRow ? "stretch" : "center",
        gap: COLUMN_GAP_PX,
        width: "100%",
        height: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flex: isRow ? `0 0 ${BOOK_COLUMN_RATIO * 100}%` : "0 0 auto",
          width: isRow ? undefined : "100%",
          minWidth: 0,
        }}
      >
        <div
          ref={bookContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: isRow ? "100%" : undefined,
            minWidth: 0,
            touchAction: "pan-y",
          }}
        >
          <MagicBook
            isOpen={isOpen}
            page={page}
            pages={pages}
            width={bookSize}
            height={bookSize}
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

      <div
        style={{
          flex: isRow ? `0 0 ${PREVIEW_COLUMN_RATIO * 100}%` : "0 0 auto",
          width: "100%",
          minWidth: 0,
        }}
      >
        <ProjectPreviewFrame project={project} />
      </div>
    </div>
  );
}
