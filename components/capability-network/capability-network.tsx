"use client";

import { DungeonFrame } from "@/components/ui/dungeon-frame";

/**
 * Capabilities stays intentionally empty while the next scene is being
 * designed. Keep the public section dependency-free so dev-only scene-editor
 * code never becomes part of the live portfolio bundle.
 */
export function CapabilityNetwork() {
  return (
    <section id="capabilities" className="capability-network__section ops ops-scanlines">
      <DungeonFrame wall={24} fill={false} className="capability-network__stage" />
    </section>
  );
}
