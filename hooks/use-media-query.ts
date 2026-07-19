"use client";

import { useEffect, useState } from "react";

/**
 * useMediaQuery — SSR-safe reactive matchMedia. Starts `false` on the server
 * and first client render (static export hydrates without a window), then
 * tracks the query live.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
