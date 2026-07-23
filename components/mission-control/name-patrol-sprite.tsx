"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { useInViewport } from "@/hooks/use-in-viewport";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { cn } from "@/lib/utils";

/**
 * NamePatrolSprite — a small pixel character pacing back and forth across a
 * bounded track beside a hero name row (mission-control.tsx). Modeled on
 * chest-sidebar.tsx's FloorRoamers, simplified from 2D wander to a
 * deterministic 1D edge-to-edge bounce: an rAF loop writes the sprite's x
 * position straight to a wrapper ref (no per-frame React state); PixelSprite's
 * own `flip` prop mirrors it to face its direction of travel — both
 * robot_walk.png and skeleton_walk.png face right by default, so flip means
 * travelling left.
 *
 * The robot gets a little "jump" hop (SPRITE_CONTROL.robot.jump) at each
 * turnaround before resuming its walk cycle; the skeleton just keeps
 * walking (only a walk cycle was asked for).
 */

const SPEED = 46; // px/sec

export function NamePatrolSprite({
  character,
  direction,
  scale,
  className,
}: {
  character: "robot" | "skeleton";
  /** "rtl" starts at the right edge heading left; "ltr" starts at the left edge heading right. */
  direction: "rtl" | "ltr";
  /** Overrides the registry's default on-screen scale — a smaller footprint
   *  fits more comfortably in a name row than the shared roaming default. */
  scale?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const inViewport = useInViewport(trackRef);
  const inViewportRef = useRef(inViewport);

  const [facing, setFacing] = useState<1 | -1>(direction === "rtl" ? -1 : 1);
  const [jumping, setJumping] = useState(false);
  const [jumpKey, setJumpKey] = useState(0);

  // Mirrored into a ref (rather than added to the tick effect's own deps)
  // so scrolling offscreen/onscreen pauses the walk without restarting the
  // effect and snapping the sprite back to its start edge.
  useEffect(() => {
    inViewportRef.current = inViewport;
  }, [inViewport]);

  const sprite = SPRITE_CONTROL[character];
  const spriteScale = scale ?? sprite.scale;
  const spriteW = sprite.frameSize * spriteScale;

  const handleJumpDone = useCallback(() => {
    jumpingRef.current = false;
    setJumping(false);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;

    let trackW = track.clientWidth;
    const ro = new ResizeObserver(([entry]) => {
      trackW = entry.contentRect.width;
    });
    ro.observe(track);

    const maxX = () => Math.max(0, trackW - spriteW);
    let x = direction === "rtl" ? maxX() : 0;
    let dir: 1 | -1 = direction === "rtl" ? -1 : 1;
    const setPos = () => {
      wrap.style.transform = `translate3d(${x}px, -50%, 0)`;
    };
    setPos();

    if (reduceMotion) {
      return () => ro.disconnect();
    }

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!inViewportRef.current) return; // paused while scrolled offscreen
      if (jumpingRef.current) return; // paused mid-hop

      x += dir * SPEED * dt;
      const max = maxX();
      if (x <= 0 || x >= max) {
        x = Math.max(0, Math.min(max, x));
        dir = dir === 1 ? -1 : 1;
        setFacing(dir);
        if (character === "robot") {
          jumpingRef.current = true;
          setJumping(true);
          setJumpKey((k) => k + 1);
        }
      }
      setPos();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [character, direction, reduceMotion, spriteW]);

  const showJump = character === "robot" && jumping;
  const frame = showJump ? SPRITE_CONTROL.robot.jump : sprite.walk;

  return (
    <div
      ref={trackRef}
      aria-hidden
      className={cn("name-patrol__track", className)}
    >
      <div ref={wrapRef} className="name-patrol__sprite-wrap">
        <PixelSprite
          src={frame.src}
          frames={frame.frames}
          frameSize={sprite.frameSize}
          scale={spriteScale}
          frameMs={frame.frameMs}
          flip={facing === -1}
          mode={showJump ? "once" : "loop"}
          playKey={jumpKey}
          playOnMount
          onDone={character === "robot" ? handleJumpDone : undefined}
        />
      </div>
    </div>
  );
}
