"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function CapabilityNetwork() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="capabilities"
      className={cn("capability-network__section", "ops", "ops-scanlines")}
    >
    </section>
  );
}
