"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * PixelSprite — a single animated pixel-art sprite, generalised from the
 * frame-stepping math in components/companion/skeleton-companion.tsx.
 *
 * A sprite sheet is one horizontal strip of equal-width frames; we show one
 * frame by clipping a `frameSize`-wide window and scrolling the background
 * left by `frame * size` (see feed/feed.md). Two modes:
 *
 *   • "loop"  — cycles 0..frames-1 forever (ambient idle). Optional `bob` adds
 *               a gentle vertical hover so even 1–2 frame sprites feel alive.
 *   • "once"  — plays through once in `direction`, fires `onDone`, then rests on
 *               the end frame. Re-runs whenever `direction`/`playKey` change, so
 *               it drives reversible one-shots like a chest opening/closing.
 *               The first mount snaps to the resting frame without animating.
 *
 * Honours reduced-motion: loops show frame 0 static; one-shots jump to the end
 * frame instantly and still call onDone.
 */

interface PixelSpriteProps {
  src: string;
  /** Number of frames in the strip. */
  frames: number;
  /** ms per frame. Default 160. */
  frameMs?: number;
  /** Source frame size in px (square). Default 16. */
  frameSize?: number;
  /** Per-axis frame size for non-square frames (e.g. wide death strips).
   *  Falls back to `frameSize` when omitted. */
  frameW?: number;
  frameH?: number;
  /** On-screen scale; 4 → a 16px frame renders at 64px. Default 1. */
  scale?: number;
  /** Mirror horizontally. */
  flip?: boolean;
  className?: string;
  mode?: "loop" | "once";
  /** "once" only: play forwards (0→end) or backwards (end→0). Default forward. */
  direction?: "forward" | "reverse";
  /** Bump to replay a "once" animation in the same direction. */
  playKey?: number;
  /** "once" only: fired when the play-through finishes. */
  onDone?: () => void;
  /** "loop" only: add a subtle vertical idle bob. */
  bob?: boolean;
}

export function PixelSprite({
  src,
  frames,
  frameMs = 160,
  frameSize = 16,
  frameW,
  frameH,
  scale = 1,
  flip = false,
  className,
  mode = "loop",
  direction = "forward",
  playKey = 0,
  onDone,
  bob = false,
}: PixelSpriteProps) {
  const reduceMotion = useReducedMotion();
  const spriteRef = useRef<HTMLDivElement>(null);
  const firstRunRef = useRef(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Frames may be non-square (wide death strips): width drives the horizontal
  // scroll step; height is independent.
  const w = Math.round((frameW ?? frameSize) * scale);
  const h = Math.round((frameH ?? frameSize) * scale);

  useEffect(() => {
    const el = spriteRef.current;
    if (!el) return;

    const setFrame = (f: number) => {
      el.style.backgroundPositionX = `-${f * w}px`;
    };

    // --- one-shot --------------------------------------------------------
    if (mode === "once") {
      const restFrame = direction === "forward" ? frames - 1 : 0;
      // Don't animate on the initial mount, or when motion is reduced — snap.
      if (firstRunRef.current || reduceMotion) {
        firstRunRef.current = false;
        setFrame(restFrame);
        if (reduceMotion) onDoneRef.current?.();
        return;
      }
      const start = direction === "forward" ? 0 : frames - 1;
      const step = direction === "forward" ? 1 : -1;
      let frame = start;
      let acc = 0;
      let last = performance.now();
      let raf = 0;
      setFrame(frame);
      const tick = (now: number) => {
        acc += now - last;
        last = now;
        if (acc >= frameMs) {
          acc = 0;
          frame += step;
          if (frame === restFrame) {
            setFrame(restFrame);
            onDoneRef.current?.();
            return;
          }
          setFrame(frame);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    // --- loop ------------------------------------------------------------
    if (reduceMotion || frames <= 1) {
      setFrame(0);
      return;
    }
    let frame = 0;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    setFrame(0);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      acc += now - last;
      last = now;
      if (acc >= frameMs) {
        acc %= frameMs;
        frame = (frame + 1) % frames;
        setFrame(frame);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, direction, playKey, frames, frameMs, w, reduceMotion]);

  // flip lives on the wrapper and bob on the sprite, so the two transforms
  // compose instead of overwriting each other.
  return (
    <div
      aria-hidden
      className={cn(className)}
      style={{
        width: w,
        height: h,
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <div
        ref={spriteRef}
        className="pixelated"
        style={{
          width: w,
          height: h,
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${frames * w}px ${h}px`,
          animation:
            bob && mode === "loop" && !reduceMotion
              ? "sprite-bob 1.6s ease-in-out infinite"
              : undefined,
        }}
      />
    </div>
  );
}
