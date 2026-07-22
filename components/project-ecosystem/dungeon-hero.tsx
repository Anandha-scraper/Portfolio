"use client";

import { forwardRef } from "react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * DungeonHero — the playable character in the Projects dungeon. Pure sprite
 * shell: the wrapper div lives in map space and is POSITIONED IMPERATIVELY
 * (style.transform) by the game loop in dungeon-map.tsx, so React only
 * re-renders when the action/facing pair changes (a few times a second at
 * most), never per movement frame.
 *
 * Art is SPRITE_CONTROL.vampire1 (fully directional); live-actor tuning
 * (speeds, interact radius, scale) is SPRITE_CONTROL.hero.
 */

export type HeroFacing = "down" | "up" | "left" | "right";
export type HeroAction = "idle" | "walk" | "run" | "attack";

const ART = SPRITE_CONTROL.vampire1;
const HERO = SPRITE_CONTROL.hero;

/** Rendered sprite size in map px (before camera zoom). */
export const HERO_PX = Math.round(ART.frameSize * HERO.scale); // 48

export interface DungeonHeroProps {
  action: HeroAction;
  facing: HeroFacing;
  /** bump to replay the attack one-shot */
  attackKey: number;
  onAttackDone: () => void;
}

export const DungeonHero = forwardRef<HTMLDivElement, DungeonHeroProps>(
  function DungeonHero({ action, facing, attackKey, onAttackDone }, ref) {
    const conf = ART.actions[action];
    const strip = conf.dir[facing];

    return (
      <div
        ref={ref}
        aria-hidden
        className="dungeon-hero__root"
        style={{ width: HERO_PX, height: HERO_PX }}
      >
        {action === "attack" ? (
          <PixelSprite
            key={`attack-${facing}`}
            src={strip.src}
            frames={strip.frames}
            frameSize={ART.frameSize}
            scale={HERO.scale}
            frameMs={conf.frameMs}
            mode="once"
            playKey={attackKey}
            playOnMount
            onDone={onAttackDone}
          />
        ) : (
          <PixelSprite
            key={`${action}-${facing}`}
            src={strip.src}
            frames={strip.frames}
            frameSize={ART.frameSize}
            scale={HERO.scale}
            frameMs={conf.frameMs}
          />
        )}
      </div>
    );
  },
);
