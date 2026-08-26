"use client";

import { useEffect, useRef, useState } from "react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { TransporterBelt } from "@/components/ui/transporter-belt";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { cn } from "@/lib/utils";

const SMITH = SPRITE_CONTROL.forgeSmith;
const ANVIL = SPRITE_CONTROL.forgeAnvilHot;
const SPARKS = SPRITE_CONTROL.effects.circleExplosion;
const BUILDING1 = SPRITE_CONTROL.factory.building1Idle;
const BUILDING2 = SPRITE_CONTROL.factory.building2;
const BUILDING3 = SPRITE_CONTROL.factory.building3;

// SMITH.scale (14) and BUILDING1.scale (1) are tuned for their own
// full-quadrant/gallery contexts, not for sharing a compact 3-part scene
// with each other. Overridden here as real `scale` values (not a CSS
// `transform`) — transform is paint-only, so a *visually* shrunk-down group
// still contributes its full unscaled size to the flex layout; that
// mismatch is exactly what made the buildings row measure ~0 height and
// get crushed by flex-shrink the first time this was built. These are
// fixed across breakpoints deliberately: the scene's real risk is running
// out of *height* (viewport-dependent, not just width), and keeping the
// underlying boxes small at the source avoids reintroducing that bug rather
// than trying to claw it back with more transforms later.
const SMITH_SCALE = 5.4;
const ANVIL_SCALE = 0.075;
const BUILDINGS_SCALE = 0.65;

export function CapabilityNetwork() {
  const sectionRef = useRef<HTMLElement>(null);

  // The forge spans full width; it only yields room when the chest sidebar
  // is open — same wiring as ProjectEcosystem.
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
    <section
      ref={sectionRef}
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
        <div className="capability-network__scene">
          <div className="capability-network__forge">
            <div className="capability-network__smith-slot">
              <PixelSprite
                src={SMITH.src}
                frames={SMITH.frames}
                frameW={SMITH.frameW}
                frameH={SMITH.frameH}
                scale={SMITH_SCALE}
                frameMs={SMITH.frameMs}
                mode="loop"
                bob={false}
              />
            </div>
            <div className="capability-network__anvil-slot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ANVIL.src}
                alt="forge anvil"
                width={ANVIL.w * ANVIL_SCALE}
                height={ANVIL.h * ANVIL_SCALE}
                className="pixelated capability-network__anvil"
              />
              {/* "Hammer strike" sparks — a slow, independent loop, not
                  synced to the smith's own swing animation (there's no
                  shared clock between separate PixelSprite instances
                  anywhere on the site, same as the reactor/furnace/transporter
                  work). Scale/frameMs are overridden here rather than in
                  sprite-control.ts: the registry values (scale 0.3, 70ms)
                  are tuned for a standalone gallery thumbnail, not a small
                  accent next to a ~100px anvil. */}
              <PixelSprite
                src={SPARKS.src}
                frames={SPARKS.frames}
                frameW={SPARKS.frameW}
                frameH={SPARKS.frameH}
                scale={0.18}
                frameMs={120}
                mode="loop"
                bob={false}
                className="capability-network__sparks"
              />
            </div>
          </div>

          <div className="capability-network__belt">
            <TransporterBelt />
          </div>

          <div className="capability-network__buildings">
            <PixelSprite
              src={BUILDING1.src}
              frames={BUILDING1.frames}
              frameW={BUILDING1.frameW}
              frameH={BUILDING1.frameH}
              scale={BUILDING1.scale * BUILDINGS_SCALE}
              frameMs={BUILDING1.frameMs}
              mode="loop"
              bob={false}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BUILDING2.src}
              alt=""
              width={BUILDING2.w * BUILDINGS_SCALE}
              height={BUILDING2.h * BUILDINGS_SCALE}
              className="pixelated"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BUILDING3.src}
              alt=""
              width={BUILDING3.w * BUILDINGS_SCALE}
              height={BUILDING3.h * BUILDINGS_SCALE}
              className="pixelated"
            />
          </div>
        </div>
      </DungeonFrame>
    </section>
  );
}
