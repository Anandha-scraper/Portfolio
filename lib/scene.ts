import type { ComponentType } from "react";
import { TransporterBelt } from "@/components/ui/transporter-belt";
import { Turbine1Cycle, Turbine2Cycle } from "@/components/ui/turbine-cycle";
import { RamboCycle } from "@/components/ui/rambo-cycle";
import { LightningBolt } from "@/components/ui/lightning-bolt";
import { ReactorCycle } from "@/components/ui/reactor-cycle";
import { BasicFurnaceCycle, AdvancedFurnaceCycle } from "@/components/ui/furnace-cycle";
import { SPRITE_CONTROL } from "@/lib/sprite-control";

/**
 * Scene plumbing shared by the renderer (components/capability-network/
 * scene-stage.tsx) and the dev-only editor (app/master/scene/).
 *
 * Two kinds of thing can be placed in a scene, and they resolve differently:
 * a *sprite* is a leaf of SPRITE_CONTROL addressed by dotted path, while a
 * *component* is one of the composed animations below, which own their own
 * phase/cycle logic and can't be reduced to a single strip.
 */

/** A SPRITE_CONTROL leaf that PixelSprite can animate. */
export interface AnimatedLeaf {
  src: string;
  frames: number;
  frameW: number;
  frameH: number;
  scale: number;
  frameMs: number;
}

/** A SPRITE_CONTROL leaf that is just a still image. */
export interface StaticLeaf {
  src: string;
  w: number;
  h: number;
  scale?: number;
}

export type SpriteLeaf =
  | ({ animated: true } & AnimatedLeaf)
  | ({ animated: false } & StaticLeaf);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/**
 * Walk a dotted path ("effects.explosion", "forgeSmith") into SPRITE_CONTROL
 * and classify the leaf. Returns null for a path that doesn't resolve or
 * doesn't land on something renderable — callers (and the sidecar validator)
 * treat null as "reject", so a stale path in the data file degrades to a
 * missing item rather than a crash.
 */
export function resolveSprite(path: string): SpriteLeaf | null {
  let node: unknown = SPRITE_CONTROL;
  for (const key of path.split(".")) {
    if (!isRecord(node) || !(key in node)) return null;
    node = node[key];
  }
  if (!isRecord(node) || typeof node.src !== "string") return null;

  if (typeof node.frames === "number") {
    return {
      animated: true,
      src: node.src,
      frames: node.frames,
      frameW: Number(node.frameW ?? node.frameSize ?? 0),
      frameH: Number(node.frameH ?? node.frameSize ?? 0),
      scale: Number(node.scale ?? 1),
      frameMs: Number(node.frameMs ?? 160),
    };
  }
  if (typeof node.w === "number" && typeof node.h === "number") {
    return {
      animated: false,
      src: node.src,
      w: node.w,
      h: node.h,
      scale: typeof node.scale === "number" ? node.scale : 1,
    };
  }
  return null;
}

/**
 * Every composed component a scene is allowed to place. This is a whitelist
 * on purpose: data/scene-capabilities.ts is machine-written data, and naming
 * a component by string must never be able to reach anything not listed here.
 * `scalable` records which ones accept a `scale` prop — the rest are sized by
 * their own sprites and ignore the item's scale.
 */
export const SCENE_COMPONENTS: Record<
  string,
  { component: ComponentType<Record<string, never>>; scalable: boolean }
> = {
  TransporterBelt: { component: TransporterBelt as ComponentType<Record<string, never>>, scalable: false },
  Turbine1Cycle: { component: Turbine1Cycle as ComponentType<Record<string, never>>, scalable: true },
  Turbine2Cycle: { component: Turbine2Cycle as ComponentType<Record<string, never>>, scalable: true },
  RamboCycle: { component: RamboCycle as ComponentType<Record<string, never>>, scalable: false },
  LightningBolt: { component: LightningBolt as ComponentType<Record<string, never>>, scalable: false },
  ReactorCycle: { component: ReactorCycle as ComponentType<Record<string, never>>, scalable: false },
  BasicFurnaceCycle: { component: BasicFurnaceCycle as ComponentType<Record<string, never>>, scalable: false },
  AdvancedFurnaceCycle: { component: AdvancedFurnaceCycle as ComponentType<Record<string, never>>, scalable: false },
};

export const SCENE_COMPONENT_NAMES = Object.keys(SCENE_COMPONENTS);

/**
 * Every placeable sprite path, grouped for the editor's palette. Walks
 * SPRITE_CONTROL rather than hard-coding a list, so a newly registered pack
 * shows up in the editor without touching this file. Nested groups become
 * "group.leaf" paths; top-level leaves (forgeSmith, forgeAnvilHot, …) are
 * collected under "forge".
 */
export function listSpritePaths(): { group: string; paths: string[] }[] {
  const groups: { group: string; paths: string[] }[] = [];
  const loose: string[] = [];

  for (const [key, value] of Object.entries(SPRITE_CONTROL)) {
    if (!isRecord(value)) continue;
    if (resolveSprite(key)) {
      loose.push(key);
      continue;
    }
    const paths: string[] = [];
    for (const childKey of Object.keys(value)) {
      const path = `${key}.${childKey}`;
      if (resolveSprite(path)) paths.push(path);
    }
    if (paths.length) groups.push({ group: key, paths });
  }

  if (loose.length) groups.unshift({ group: "forge", paths: loose });
  return groups;
}
