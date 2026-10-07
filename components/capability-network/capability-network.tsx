import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { cn } from "@/lib/utils";

/**
 * Intentionally empty until the next public Capabilities direction is ready.
 */
export function CapabilityNetwork() {
  return (
    <section id="capabilities" className={cn("capability-network__section", "ops", "ops-scanlines")}>
      <DungeonFrame wall={24} fill={false} className="capability-network__stage" />
    </section>
  );
}
