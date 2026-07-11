"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/animations/reveal";
import { DungeonMap } from "@/components/project-ecosystem/dungeon-map";
import { cn } from "@/lib/utils";

/**
 * ProjectEcosystem — the Projects section.
 *
 * Rendered as a large, static, explorable top-down dungeon: floor/wall tiles,
 * themed decoration, and an aim-reticle cursor. Pan with the arrow keys or by
 * dragging — see DungeonMap.
 */
export function ProjectEcosystem() {
  // The dungeon spans full width; it only yields room when the left dock is open.
  // Two widths: the plain nav sidebar (~290px), and the wider Capabilities tech
  // dungeon (~420px), which can overlap the top of this section during the scroll
  // transition — so we yield its full width while it's docked.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dungeonDocked, setDungeonDocked] = useState(false);
  useEffect(() => {
    const onOpen = () => setSidebarOpen(true);
    const onClose = () => setSidebarOpen(false);
    const onDock = () => setDungeonDocked(true);
    const onUndock = () => setDungeonDocked(false);
    window.addEventListener("chest-sidebar-open", onOpen);
    window.addEventListener("chest-sidebar-close", onClose);
    window.addEventListener("capability-dungeon-open", onDock);
    window.addEventListener("capability-dungeon-close", onUndock);
    return () => {
      window.removeEventListener("chest-sidebar-open", onOpen);
      window.removeEventListener("chest-sidebar-close", onClose);
      window.removeEventListener("capability-dungeon-open", onDock);
      window.removeEventListener("capability-dungeon-close", onUndock);
    };
  }, []);

  return (
    <section
      id="ecosystem"
      className="ops ops-scanlines relative w-full scroll-mt-24 overflow-hidden"
    >
      {/* Legibility wash — light, and transparent at both edges so the global
          boxed-line grid runs seamlessly into the sections above and below (no
          dark band at the boundaries). */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(20,17,12,0)_0%,rgba(20,17,12,0.18)_45%,rgba(20,17,12,0)_100%)]"
      />

      <div
        className={cn(
          "relative z-10 w-full px-2 py-1 transition-[padding] duration-400 sm:px-3 sm:py-1",
          // Yield the wider tech-dungeon column when it's docked, else the plain
          // sidebar width. Keep in sync with DOCK.stagePad (420) / the sidebar (290).
          dungeonDocked ? "lg:pl-[420px]" : sidebarOpen && "lg:pl-[290px]"
        )}
      >
        <Reveal delay={0.1}>
          <DungeonMap />
        </Reveal>
      </div>

    </section>
  );
}
