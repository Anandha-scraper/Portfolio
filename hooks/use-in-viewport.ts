"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * useInViewport — cheap IntersectionObserver boolean for pausing offscreen
 * work (rAF loops, listeners). `rootMargin` pre-warms slightly outside the
 * viewport so animations are already running when the element scrolls in.
 *
 * SSR-safe: starts `false`, resolves after mount. Environments without
 * IntersectionObserver are treated as always-visible.
 */
export function useInViewport(
  ref: RefObject<Element | null>,
  rootMargin = "96px",
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
