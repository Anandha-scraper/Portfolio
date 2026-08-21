"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * Sprite sheet map — measured from the CraftPix "Animated Magic Book" pack
 * (alpha-boundary detection, not eyeballed). Every sheet shares the same
 * 272×272 cell — that's what makes a single drawFrame() function usable for
 * all four animations. Grid/frame data lives in lib/sprite-control.ts
 * (SPRITE_CONTROL.book) so it stays the single source of truth.
 */
const SHEETS = SPRITE_CONTROL.book;

/**
 * Every book sheet cell (272×272) draws the book art lower/smaller than the
 * cell itself — headroom the source animation needs so the cover has room to
 * swing upright mid-open/close. At rest (the flat open-page state shown
 * ~95% of the time, and the settled ends of every turn animation) the art's
 * alpha bbox is a stable (13, 56)-(259, 267) rectangle (measured across all
 * four sheets/frames) — cropping to that instead of the full cell removes
 * the dead space above the book without needing per-frame crops. The
 * open/close swing's most extreme mid-frames dip a little above this box and
 * get clipped for a few animation frames — an acceptable trade for the
 * static/settled state (where the book actually sits almost all the time)
 * filling its box instead of floating in a third of empty canvas above it.
 */
const BOOK_CROP = { x: 13, y: 56, w: 246, h: 211 };
/** Aspect ratio (height / width) of the cropped book art, for sizing the
 *  canvas box without distorting the pixel art. */
export const BOOK_ASPECT = BOOK_CROP.h / BOOK_CROP.w;

/**
 * Where the two text columns sit on the drawn page, as fractions of the
 * cropped book box above. Exported because pagination has to know how much
 * room a page actually has — master.tsx measures real text against these to
 * decide where to break, rather than counting array entries and hoping.
 *
 * These are the single source of truth: the component publishes them as
 * custom properties on `.magic-book__root` and magic-book.css consumes those
 * vars, so the numbers exist once rather than being mirrored in a stylesheet
 * JS can't read. Re-derive them if BOOK_CROP changes.
 *
 * `leftRest` is narrower than `leftFirst` because the turned page sits further
 * into the gutter. Pagination measures against the narrow one for every page:
 * page 0 then has a little slack, which is the safe direction to be wrong in.
 */
export const BOOK_TEXT_METRICS = {
  top: 0.173,
  height: 0.709,
  leftFirst: { left: 0.063, width: 0.387 },
  leftRest: { left: 0.091, width: 0.354 },
  right: { right: 0.069, width: 0.387 },
  /** `gap` and `padding` on `.magic-book__lines`, in em of the resolved font
   *  size — needed to convert measured line heights into a page budget. */
  lineGapEm: 0.5,
  paddingEm: 0.4,
} as const;

/** The font-size the book uses at a given canvas size. Exported so the
 *  pagination pass can measure at exactly the size that will be painted. */
export function bookFontSize(width: number, height: number): number {
  return Math.min(40, Math.max(10, Math.min(width, height) * (16 / 544)));
}

/** Local shorthand — this object is referenced a dozen times in the style block. */
const M = BOOK_TEXT_METRICS;

type SheetKey = keyof typeof SHEETS;
type AnimEvent = "opened" | "closed" | "flipped";

export interface MagicBookLine {
  text: string;
  /** Visual role — styled distinctly so a page's topic labels (e.g.
   *  "Overview", "Highlights") read apart from their body content.
   *  Defaults to "body". */
  kind?: "title" | "meta" | "label" | "body" | "bullet";
}

export interface MagicBookPage {
  /** Lines revealed one at a time on the left page. */
  left?: MagicBookLine[];
  /** Lines revealed one at a time on the right page. */
  right?: MagicBookLine[];
}

export interface MagicBookProps {
  /** Controlled: true = book should be open. Parent owns this state. */
  isOpen: boolean;
  /** Controlled: current page index. Changing it plays the turn animation. */
  page: number;
  /** Content rendered on top of the canvas for the current page. */
  pages: MagicBookPage[];
  /** Rendered width in px. Independent of `height`. Defaults to 544 (272 * 2, pixel-perfect). */
  width?: number;
  /** Rendered height in px, independent of `width`. Defaults to `width`. */
  height?: number;
  /** Manual font size override in px. Omit to auto-scale with the book's rendered size. */
  fontSize?: number;
  /** Playback speed for the sprite animations. */
  fps?: number;
  /** Delay in ms between each line reveal on a page. */
  lineDelayMs?: number;
  /** Fires when an open/close/flip animation finishes. */
  onAnimationComplete?: (event: AnimEvent) => void;
  className?: string;
}

/**
 * Canvas-based, fully controlled magic book. Never decides open/close/page
 * state itself — it only reacts to prop changes and plays the matching
 * sprite animation, then settles on the correct static frame.
 */
export default function MagicBook({
  isOpen,
  page,
  pages = [],
  width = 544,
  height,
  fontSize,
  fps = 14,
  lineDelayMs = 350,
  onAnimationComplete,
  className,
}: MagicBookProps) {
  const resolvedHeight = height ?? Math.round(width * BOOK_ASPECT);

  const resolvedFontSize = fontSize ?? bookFontSize(width, resolvedHeight);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Partial<Record<SheetKey, HTMLImageElement>>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  const prevOpenRef = useRef(isOpen);
  const prevPageRef = useRef(page);
  const hasMountedRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const revealTimerRef = useRef<number | undefined>(undefined);
  const lastFrameRef = useRef<{ sheet: SheetKey; frame: number } | null>(null);

  // ── Preload all four sheets once ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const keys = Object.keys(SHEETS) as SheetKey[];
    let loaded = 0;

    keys.forEach((key) => {
      const img = new window.Image();
      img.src = SHEETS[key].src;
      img.onload = () => {
        loaded++;
        if (loaded === keys.length && !cancelled) setImagesLoaded(true);
      };
      imagesRef.current[key] = img;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Draw a single frame from a given sheet ────────────────────
  const drawFrame = useCallback((sheetKey: SheetKey, frameIndex: number) => {
    const canvas = canvasRef.current;
    const sheet = SHEETS[sheetKey];
    const img = imagesRef.current[sheetKey];
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const col = frameIndex % sheet.cols;
    const row = Math.floor(frameIndex / sheet.cols);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      col * sheet.cellW + BOOK_CROP.x, row * sheet.cellH + BOOK_CROP.y, BOOK_CROP.w, BOOK_CROP.h,
      0, 0, canvas.width, canvas.height
    );
    lastFrameRef.current = { sheet: sheetKey, frame: frameIndex };
  }, []);

  // ── Play a sheet start-to-finish at `fps`, then call onDone ───
  const playAnimation = useCallback(
    (sheetKey: SheetKey, onDone: () => void) => {
      const sheet = SHEETS[sheetKey];
      const frameDuration = 1000 / fps;
      let frame = 0;
      let lastTime = performance.now();

      const step = (time: number) => {
        if (time - lastTime >= frameDuration) {
          drawFrame(sheetKey, frame);
          frame++;
          lastTime = time;
          if (frame >= sheet.frameCount) {
            onDone();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [drawFrame, fps]
  );

  const cancelActiveAnimation = () => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  };

  const clearRevealTimer = () => {
    if (revealTimerRef.current !== undefined) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = undefined;
    }
  };

  // ── Reveal the lines of a given page, one at a time ────────────
  const startReveal = useCallback(
    (pageIndex: number) => {
      clearRevealTimer();
      const target = pages?.[pageIndex];
      const totalLines = Math.max(target?.left?.length ?? 0, target?.right?.length ?? 0);

      if (totalLines === 0) {
        setRevealedCount(0);
        return;
      }

      let count = 1;
      setRevealedCount(1);
      if (count >= totalLines) return;

      revealTimerRef.current = window.setInterval(() => {
        count++;
        setRevealedCount(count);
        if (count >= totalLines) clearRevealTimer();
      }, lineDelayMs);
    },
    [pages, lineDelayMs]
  );

  // ── React to isOpen / page changes ─────────────────────────────
  useEffect(() => {
    if (!imagesLoaded) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevOpenRef.current = isOpen;
      prevPageRef.current = page;
      drawFrame(
        isOpen ? "open" : "close",
        isOpen ? SHEETS.open.frameCount - 1 : SHEETS.close.frameCount - 1
      );
      if (isOpen) {
        startReveal(page);
      }
      return;
    }

    const openChanged = isOpen !== prevOpenRef.current;
    const pageChanged = page !== prevPageRef.current;

    if (openChanged) {
      cancelActiveAnimation();
      clearRevealTimer();
      setRevealedCount(0);
      prevOpenRef.current = isOpen;
      prevPageRef.current = page;
      playAnimation(isOpen ? "open" : "close", () => {
        onAnimationComplete?.(isOpen ? "opened" : "closed");
        if (isOpen) startReveal(page);
      });
      return;
    }

    if (pageChanged && isOpen) {
      cancelActiveAnimation();
      clearRevealTimer();
      setRevealedCount(0);
      const direction: SheetKey = page > prevPageRef.current ? "turnLeft" : "turnRight";
      prevPageRef.current = page;
      playAnimation(direction, () => {
        onAnimationComplete?.("flipped");
        startReveal(page);
      });
    }
  }, [isOpen, page, imagesLoaded, drawFrame, playAnimation, onAnimationComplete, startReveal]);

  // ── Repaint after the tab was backgrounded/idle ─────────────────
  // Browsers reclaim a hidden/inactive tab's canvas backing pixels to save
  // memory, and nothing here re-triggers a draw on its own once settled
  // (the effect above only fires on isOpen/page changes) — so the sprite
  // silently goes blank until something forces a redraw. Repaint whatever
  // was last drawn whenever the tab regains visibility/focus, unless an
  // animation is actively mid-flight (rafRef set), which will keep painting.
  useEffect(() => {
    const repaintLastFrame = () => {
      if (document.visibilityState !== "visible") return;
      if (rafRef.current !== undefined) return;
      if (lastFrameRef.current) {
        drawFrame(lastFrameRef.current.sheet, lastFrameRef.current.frame);
      }
    };
    document.addEventListener("visibilitychange", repaintLastFrame);
    window.addEventListener("focus", repaintLastFrame);
    window.addEventListener("pageshow", repaintLastFrame);
    return () => {
      document.removeEventListener("visibilitychange", repaintLastFrame);
      window.removeEventListener("focus", repaintLastFrame);
      window.removeEventListener("pageshow", repaintLastFrame);
    };
  }, [drawFrame]);

  // ── Repaint after a resize ───────────────────────────────────────
  // Setting a <canvas>'s width/height *attributes* (not just its CSS size)
  // always clears its bitmap — a browser-level behavior, not a bug here.
  // width/resolvedHeight come from the parent's ResizeObserver, so anything
  // that changes the viewport (dragging the window, rotating, opening or
  // closing the DevTools panel) resizes the canvas and blanks it. Repaint
  // whatever was last drawn once the new size lands.
  //
  // This has to be a *layout* effect, not a passive one. A passive effect runs
  // after the browser has already painted, so every resize showed one frame of
  // cleared canvas — invisible when dragging a window slowly, but the chest
  // sidebar animates the panel's width over 0.4s, firing the parent's
  // ResizeObserver on essentially every frame, which turned those blank frames
  // into a continuous flicker. useLayoutEffect redraws between the attribute
  // change and the paint, so the bitmap is never shown empty.
  useLayoutEffect(() => {
    if (lastFrameRef.current) {
      drawFrame(lastFrameRef.current.sheet, lastFrameRef.current.frame);
    }
  }, [width, resolvedHeight, drawFrame]);

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(
    () => () => {
      cancelActiveAnimation();
      clearRevealTimer();
    },
    []
  );

  const currentPage = pages?.[page];
  const leftLines = currentPage?.left ?? [];
  const rightLines = currentPage?.right ?? [];

  // View-only: lines are rendered as plain text, never contentEditable —
  // the reveal effect resets/rewrites the DOM on every page turn, which
  // would fight a contentEditable caret.
  const renderLines = (lines: MagicBookLine[]) => (
    <div className="magic-book__lines" style={{ fontSize: resolvedFontSize }}>
      {lines.map((line, i) => {
        const revealed = i < revealedCount;
        const kind = line.kind ?? "body";
        return (
          <div
            key={i}
            className={cn(
              "magic-book__line",
              `magic-book__line--${kind}`,
              revealed && "magic-book__line--revealed"
            )}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className={cn("magic-book__root", className)}
      style={
        {
          width,
          height: resolvedHeight,
          // Published so magic-book.css positions the text boxes from the same
          // numbers pagination measures against (BOOK_TEXT_METRICS).
          "--book-text-top": `${M.top * 100}%`,
          "--book-text-height": `${M.height * 100}%`,
          "--book-text-left-first": `${M.leftFirst.left * 100}%`,
          "--book-text-left-first-w": `${M.leftFirst.width * 100}%`,
          "--book-text-left-rest": `${M.leftRest.left * 100}%`,
          "--book-text-left-rest-w": `${M.leftRest.width * 100}%`,
          "--book-text-right": `${M.right.right * 100}%`,
          "--book-text-right-w": `${M.right.width * 100}%`,
          "--book-line-gap": `${M.lineGapEm}em`,
          "--book-line-pad": `${M.paddingEm}em`,
        } as CSSProperties
      }
    >
      {/* The width/height *attributes* set both the backing store and, at 1:1,
          the CSS box — no inline style needed. The text boxes below position
          against .magic-book__root directly; they used to sit in an extra
          inset-0 overlay div that resolved to the exact same box. */}
      <canvas
        ref={canvasRef}
        width={width}
        height={resolvedHeight}
        className="magic-book__canvas"
      />
      {isOpen && currentPage && (
        <>
          <div
            className={cn(
              "magic-book__text-box",
              page === 0 ? "magic-book__text-box--left-first" : "magic-book__text-box--left-rest"
            )}
          >
            {renderLines(leftLines)}
          </div>
          <div className="magic-book__text-box magic-book__text-box--right">
            {renderLines(rightLines)}
          </div>
        </>
      )}
    </div>
  );
}
