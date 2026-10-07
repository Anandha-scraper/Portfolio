"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";
import { BOOK_ASPECT, BOOK_TEXT_METRICS, bookFontSize } from "@/components/book/magic-book";
import type { MagicBookLine, MagicBookPage } from "@/components/book/magic-book";
import { ProjectPlate } from "@/components/project-ecosystem/project-plate";
import { cn } from "@/lib/utils";
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
 * What this file does own beyond composition:
 *
 * - **Pagination.** Content is split across as many pages as it takes to fit
 *   without scrolling. The split is *measured*, not counted: `paginate()`
 *   renders every line into a hidden mirror at the real page width and font
 *   size and packs by actual height. It used to chunk the line array six at a
 *   time, which is blind to wrapping — one long sentence, the joined stack
 *   list, or a full URL can occupy ten visual rows while costing one slot, and
 *   since `.magic-book__text-box` is `overflow: hidden` the excess was silently
 *   invisible. On a phone that swallowed most of the overview.
 * - **Page-turn navigation** — Prev/Next when there's room for two columns,
 *   swipe otherwise.
 * - **Autoplay's clock.** While `playing`, the book turns a page every
 *   PAGE_INTERVAL_MS and calls `onFinished` once the last page has had its
 *   dwell, which is how the dungeon knows to move to the next project. The
 *   timer lives here because `page`/`pageCount` do.
 * - **The book canvas's backing-store resolution**, which has to be a number
 *   in JS because CSS can't set a <canvas>'s width/height attributes. That
 *   same number is published as `--book-h` for master.css, which needs the
 *   canvas height as a length to cancel the sprite's headroom (BOOK_HEADROOM).
 */

// ── Canvas resolution clamp — the book's drawn pixel size, not its layout ──
// The floor sits at 280px so the canvas never exceeds the panel's content
// box on a 320px viewport (panel padding + section padding eat ~40px), which
// would otherwise clip the page-turn art at the edges.
const BOOK_MIN_PX = 280;
const BOOK_MAX_PX = 1100;
/** Fraction of the book canvas that is transparent headroom above the drawn
 *  art (the cover swings into it while opening). master.css cancels it with a
 *  negative margin so the column's box matches what's actually painted — it
 *  reads the resolved px value from the `--book-headroom` property below. */
const BOOK_HEADROOM = 0.135;
const OPEN_DELAY_MS = 200;
const SWIPE_THRESHOLD_PX = 40;
/** Autoplay's page dwell. Each page gets this long; when the last one expires
 *  the dungeon advances to the next project. */
const PAGE_INTERVAL_MS = 3000;

function splitOverview(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pack lines into pages by measured height. `heights` is parallel to `lines`
 *  and holds each line's rendered height in px at the page's real width and
 *  font size; `budget` is the usable height of one text box.
 *
 *  Greedy: keep adding until the next line would overflow, then start a page.
 *  A single line taller than the whole budget still gets its own page rather
 *  than looping forever — it will clip, but only that one line, and only in a
 *  case that has no better answer than shipping a smaller book. */
function packByHeight(
  lines: MagicBookLine[],
  heights: number[],
  budget: number,
  gap: number
): MagicBookLine[][] {
  if (!lines.length) return [[]];
  const pages: MagicBookLine[][] = [];
  let current: MagicBookLine[] = [];
  let used = 0;

  lines.forEach((line, i) => {
    const h = heights[i] ?? 0;
    const cost = current.length ? h + gap : h;
    if (current.length && used + cost > budget) {
      pages.push(current);
      current = [line];
      used = h;
      return;
    }
    current.push(line);
    used += cost;
  });

  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
}

/** The book's content as two flat streams, before any page splitting. */
function buildLines(project: Project): { left: MagicBookLine[]; right: MagicBookLine[] } {
  const links = [
    project.links.github ? `GitHub: ${project.links.github}` : null,
    project.links.live ? `Live: ${project.links.live}` : null,
  ].filter((line): line is string => Boolean(line));

  const line = (text: string, kind?: MagicBookLine["kind"]): MagicBookLine => ({ text, kind });

  const leftLines: MagicBookLine[] = [
    line(project.name, "title"),
    line(project.tagline, "meta"),
    line(`${project.status.replace("-", " ")} · ${project.year} · ${project.category}`, "meta"),
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

  return { left: leftLines, right: rightLines };
}

/** Zip two independently-packed column streams into pages. */
function zipPages(left: MagicBookLine[][], right: MagicBookLine[][]): MagicBookPage[] {
  const count = Math.max(left.length, right.length, 1);
  return Array.from({ length: count }, (_, i) => ({
    left: left[i] ?? [],
    right: right[i] ?? [],
  }));
}

export function Master({
  project,
  playing = false,
  onFinished,
}: {
  project: Project;
  playing?: boolean;
  onFinished?: () => void;
}) {
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const previewColRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [bookSize, setBookSize] = useState(BOOK_MIN_PX);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [held, setHeld] = useState(false);
  const [pages, setPages] = useState<MagicBookPage[]>([]);

  const lines = buildLines(project);
  const bookHeight = Math.round(bookSize * BOOK_ASPECT);
  const fontSize = bookFontSize(bookSize, bookHeight);
  const pageCount = Math.max(pages.length, 1);

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

  // ── Measure, then paginate ──────────────────────────────────────
  // The mirror below renders every line at the page's real width and font
  // size; this reads back each one's height and packs pages that actually
  // fit. Re-runs whenever the book resizes or the project changes.
  //
  // It waits on `document.fonts.ready` first: Pixelify arrives via next/font,
  // and measuring against the fallback face yields heights that are wrong by
  // enough to misplace a break.
  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      const el = measureRef.current;
      if (cancelled || !el) return;

      const M = BOOK_TEXT_METRICS;
      const gap = M.lineGapEm * fontSize;
      // Usable height inside one text box, less the .magic-book__lines padding
      // on both edges.
      const budget = bookHeight * M.height - M.paddingEm * fontSize * 2;

      const readColumn = (selector: string) =>
        Array.from(el.querySelectorAll<HTMLElement>(selector)).map(
          (node) => node.getBoundingClientRect().height
        );

      const nextPages = zipPages(
        packByHeight(lines.left, readColumn("[data-measure='left'] > *"), budget, gap),
        packByHeight(lines.right, readColumn("[data-measure='right'] > *"), budget, gap)
      );

      setPages(nextPages);
      setPage((p) => Math.min(p, nextPages.length - 1));
    };

    // rAF so the mirror has been laid out with the current font size before
    // anything is read back.
    const raf = requestAnimationFrame(() => {
      if (document.fonts?.ready) document.fonts.ready.then(measure);
      else measure();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // `lines` is rebuilt every render, so key off the project instead.
  }, [project.id, bookSize, bookHeight, fontSize]); // eslint-disable-line react-hooks/exhaustive-deps


  const goToPage = useCallback(
    (next: number) => {
      if (animating || next < 0 || next >= pageCount || next === page) return;
      setAnimating(true);
      setPage(next);
    },
    [animating, page, pageCount]
  );

  // ── Autoplay's clock ────────────────────────────────────────────
  // One page per tick; when the last page's tick lands, hand back to the
  // dungeon to open the next project. Gated on `isOpen` so page 1 gets a full
  // dwell rather than a partial one while the book is still swinging open,
  // and on `animating` so a tick can't stack on top of a turn in flight.
  useEffect(() => {
    if (!playing || held || !isOpen || animating) return;
    const id = window.setInterval(() => {
      if (page >= pageCount - 1) onFinished?.();
      else goToPage(page + 1);
    }, PAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, held, isOpen, animating, page, pageCount, goToPage, onFinished]);

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

  const pager = { page, pageCount, animating, goToPage };
  const M = BOOK_TEXT_METRICS;

  return (
    <div
      className="master__root"
      /* Autoplay pauses while a pointer rests anywhere on the panel — hover
         with a cursor, a finger held on a phone. Pointer events rather than
         mouse ones so both work from one handler pair; pointercancel matters
         on touch, where a scroll steals the pointer and no leave arrives.
         ProjectPlate keeps its own copy of this for its image rotation. */
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onPointerCancel={() => setHeld(false)}
    >
      {/* Off-screen measuring mirror. Not display:none — that has no layout and
          would measure zero. It carries the same classes and font size as the
          real pages so every line wraps identically, at the narrower
          `leftRest` width so a break that fits here fits on page 0 too. */}
      <div
        ref={measureRef}
        aria-hidden
        className="master__measure"
        style={{ fontSize: `${fontSize}px` } as CSSProperties}
      >
        <div
          data-measure="left"
          className="magic-book__lines"
          style={{ width: `${bookSize * M.leftRest.width}px` }}
        >
          {lines.left.map((line, i) => (
            <div key={`l${i}`} className={cn("magic-book__line", `magic-book__line--${line.kind ?? "body"}`, "magic-book__line--revealed")}>
              {line.text}
            </div>
          ))}
        </div>
        <div
          data-measure="right"
          className="magic-book__lines"
          style={{ width: `${bookSize * M.right.width}px` }}
        >
          {lines.right.map((line, i) => (
            <div key={`r${i}`} className={cn("magic-book__line", `magic-book__line--${line.kind ?? "body"}`, "magic-book__line--revealed")}>
              {line.text}
            </div>
          ))}
        </div>
      </div>

      <div
        className="master__book-col"
        style={{ "--book-headroom": `${Math.round(bookHeight * BOOK_HEADROOM)}px` } as CSSProperties}
      >
        <div
          ref={bookContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="master__book-wrap"
        >
          {/* Shrink-wraps the book's own box (MagicBook's root carries an
              explicit pixel width/height), so the page-turn hands can be
              positioned as percentages of the book art itself rather than of
              the column, which the wrap's negative margin has already moved
              them out of alignment with. */}
          <div className="master__book-stage">
            <MagicBook
              isOpen={isOpen}
              page={page}
              pages={pages}
              width={bookSize}
              height={bookHeight}
              lineDelayMs={140}
              onAnimationComplete={(event) => {
                if (event === "flipped") setAnimating(false);
              }}
            />

            <PageNav variant="hands" {...pager} />
          </div>
        </div>

        <PageNav variant="chevrons" {...pager} />
      </div>

      {/* The plate sizes itself from each screenshot's own aspect ratio
          (project-plate.css) — this column only decides how wide it may get. */}
      <div ref={previewColRef} className="master__preview-col">
        <ProjectPlate project={project} />
      </div>
    </div>
  );
}

/**
 * The book's page pager, in its two guises. Both render the same prev/count/next
 * controls over the same state and only one is ever visible — master.css swaps
 * them at the 64rem container step, where there is finally room for the big
 * sprite hands in the book's own headroom:
 *
 *   "hands"    — sprite-art hands overlaying the top of the book (>= 64rem)
 *   "chevrons" — a small icon row beneath the book (38rem - 64rem)
 *
 * Below 38rem neither shows and paging is swipe-only (see handleTouchEnd).
 * They live in one component so a paging change can't be applied to half of
 * them; the two DOM shapes stay distinct because their styling has nothing in
 * common.
 */
function PageNav({
  variant,
  page,
  pageCount,
  animating,
  goToPage,
}: {
  variant: "hands" | "chevrons";
  page: number;
  pageCount: number;
  animating: boolean;
  goToPage: (next: number) => void;
}) {
  if (pageCount <= 1) return null;

  const atStart = page <= 0 || animating;
  const atEnd = page >= pageCount - 1 || animating;
  const count = `${page + 1}/${pageCount}`;
  const hands = variant === "hands";

  return (
    <div className={hands ? "master__page-topbar" : "master__page-nav"}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={atStart}
        onClick={() => goToPage(page - 1)}
        className={hands ? "master__flip-btn master__flip-btn--prev" : "master__page-nav-btn"}
      >
        {hands ? null : <Icon name="ChevronLeft" size={14} />}
      </button>
      <span className={hands ? "master__page-topbar-count" : undefined}>{count}</span>
      <button
        type="button"
        aria-label="Next page"
        disabled={atEnd}
        onClick={() => goToPage(page + 1)}
        className={hands ? "master__flip-btn master__flip-btn--next" : "master__page-nav-btn"}
      >
        {hands ? null : <Icon name="ChevronRight" size={14} />}
      </button>
    </div>
  );
}

