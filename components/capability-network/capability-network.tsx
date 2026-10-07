"use client";

import { useEffect, useState } from "react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { SceneStage } from "@/components/capability-network/scene-stage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { capabilityScene } from "@/data/scene-capabilities";
import { cn } from "@/lib/utils";

/**
 * CapabilityNetwork — the forge/factory production line, rendered entirely
 * from authored coordinates in data/scene-capabilities.ts.
 *
 * There is deliberately no layout logic here any more. Every position, size
 * and overlap lives in the data file and is authored visually at
 * /master/scene (dev-only); this component just picks the layout for the
 * form factor and hands it to SceneStage, which scales the whole composition
 * to fit. Adding or moving a sprite is a data edit, not a code edit — so
 * don't reintroduce margins or breakpoint scale steps here.
 */
export function CapabilityNetwork() {
  // The stage spans full width; it only yields room when the chest sidebar
  // is open — same wiring as ProjectEcosystem.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 48rem)");
  const layout = isMobile ? capabilityScene.mobile : capabilityScene.desktop;

  useEffect(() => {
    const onOpen = () => setSidebarOpen(true);
    const onClose = () => setSidebarOpen(false);
    window.addEventListener("chest-sidebar-open", onOpen);
    window.addEventListener("chest-sidebar-close", onClose);
    return () => {
      window.removeEventListener("chest-sidebar-open", onOpen);
      window.removeEventListener("chest-sidebar-close", onClose);
    };
  }, []);

  return (
    <section
      id="capabilities"
      className={cn("capability-network__section", "ops", "ops-scanlines")}
    >
      <DungeonFrame
        wall={24}
        fill={false}
        className={cn(
          "capability-network__stage",
          sidebarOpen && "capability-network__stage--sidebar-open"
        )}
      >
        <SceneStage layout={layout} />
      </DungeonFrame>
    </section>
  );
}
