"use client";

import { ChestSidebar } from "@/components/navigation/chest-sidebar";
import { ScrollProgress } from "@/components/navigation/scroll-progress";

export function Navigation() {
  return (
    <>
      <ScrollProgress />

      {/* Chest-toggled dungeon sidebar — primary navigation on every viewport
          (it replaces the old mobile bottom bar). */}
      <ChestSidebar />
    </>
  );
}
