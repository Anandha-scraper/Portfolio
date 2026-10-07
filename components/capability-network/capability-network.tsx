"use client";

import { useEffect, useState } from "react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { cn } from "@/lib/utils";

/**
 * Intentionally empty until the next public Capabilities direction is ready.
 */
export function CapabilityNetwork() {
  // The sidebar is a viewport overlay. Match the Projects section by yielding
  // its desktop footprint whenever the drawer is open.
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <section id="capabilities" className={cn("capability-network__section", "ops", "ops-scanlines")}>
      <DungeonFrame
        wall={24}
        fill={false}
        className={cn("capability-network__stage", sidebarOpen && "capability-network__stage--sidebar-open")}
      />
    </section>
  );
}
