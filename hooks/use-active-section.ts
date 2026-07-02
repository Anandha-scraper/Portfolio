"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/types";

/**
 * Tracks which section is currently centered in the viewport using
 * IntersectionObserver. Drives the dock's active state + scroll spy.
 */
export function useActiveSection(sectionIds: SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(sectionIds[0]);

  useEffect(() => {
    const visibility = new Map<SectionId, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(
            entry.target.id as SectionId,
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
        }
        let best: SectionId = sectionIds[0];
        let bestRatio = -1;
        visibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        if (bestRatio > 0) setActive(best);
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0, 0.15, 0.3, 0.5, 0.75, 1],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}
