"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * ScrollProgress — pixel-art reading-progress bar pinned to the top of the
 * viewport. The track is `barframe_9slice.png` rendered via CSS `border-image`
 * so the pixel corners/edges stay crisp and only the interior stretches (even
 * end-to-end, no blown-up end caps). `barfill_gold.png` — the solid gold fill
 * slice — scales left→right in proportion to how far down the document you've
 * scrolled (full page length).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden
      style={{
        borderImageSource: "url('/sprites/ui/barframe_9slice.png')",
        borderImageSlice: "2 fill",
        imageRendering: "pixelated",
      }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-3 border-[3px] border-solid border-transparent"
    >
      {/* Solid gold fill, scaled from the left edge so the gold tracks scroll
          progress exactly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/sprites/ui/barfill_gold.png"
        alt=""
        style={{ scaleX }}
        className="pixelated h-full w-full origin-left object-fill"
      />
    </div>
  );
}
