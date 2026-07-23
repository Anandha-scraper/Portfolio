"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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
  const resolvedHeight = height ?? width;

  const resolvedFontSize =
    fontSize ?? Math.min(40, Math.max(10, Math.min(width, resolvedHeight) * (16 / 544)));

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
      col * sheet.cellW, row * sheet.cellH, sheet.cellW, sheet.cellH,
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
  useEffect(() => {
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
    <div className={cn("magic-book__root", className)} style={{ width, height: resolvedHeight }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={resolvedHeight}
        className="magic-book__canvas"
        style={{ width, height: resolvedHeight }}
      />
      {isOpen && currentPage && (
        <div className="magic-book__overlay">
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
        </div>
      )}
    </div>
  );
}
