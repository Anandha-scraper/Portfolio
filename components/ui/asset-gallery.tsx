"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { Icon } from "@/components/ui/icon";
import { ReactorCycle } from "@/components/ui/reactor-cycle";
import { BasicFurnaceCycle, AdvancedFurnaceCycle } from "@/components/ui/furnace-cycle";
import { RamboCycle } from "@/components/ui/rambo-cycle";
import { Turbine1Cycle, Turbine2Cycle } from "@/components/ui/turbine-cycle";
import { TankColorPicker } from "@/components/ui/tank-color-picker";
import { TransporterBelt } from "@/components/ui/transporter-belt";
import { LightningBolt } from "@/components/ui/lightning-bolt";
import { useClickOutside } from "@/hooks/use-click-outside";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { cn } from "@/lib/utils";

/**
 * AssetGallery — a top-right info button that opens a catalogue of every
 * pixel-art asset used across the site, each with a live thumbnail and its
 * name (skeleton, wall, heart, banner, …). Extracted by feed/extract_*.py into
 * /public/sprites. Lets visitors see what's running under the hood.
 */

type AnimatedAsset = {
  kind: "sprite";
  name: string;
  src: string;
  frames: number;
  frameSize: number;
  /** Per-axis size for non-square frames (wide death strips). */
  frameW?: number;
  frameH?: number;
  scale: number;
  frameMs?: number;
  /** Idle hover. Default on; turn off for run/death cycles. */
  bob?: boolean;
};
type StaticAsset = {
  kind: "image";
  name: string;
  src: string;
  w: number;
  /** Single-frame art that should still feel alive — adds a CSS fire flicker. */
  flicker?: boolean;
};
/** Escape hatch for a thumbnail whose animation isn't a single PixelSprite
 *  strip (e.g. ReactorCycle, which swaps between three sprite sheets). */
type NodeAsset = {
  kind: "node";
  name: string;
  node: ReactNode;
};
type Asset = AnimatedAsset | StaticAsset | NodeAsset;

type Group = {
  label: string;
  assets: Asset[];
  /** Forge/Factory sprites render much bigger than the rest of the catalogue
   *  (smith at scale 3, factory art at native scale 1 with frames up to
   *  166×155) — the standard 4rem thumb box clips/crowds them, so these
   *  groups opt into a taller box and a 2-column grid instead of 3. */
  large?: boolean;
  /** For a group whose one asset is wide rather than tall (TransporterBelt:
   *  192×64) — a single full-width column instead of 2/3 narrow ones, so it
   *  isn't forced into a box too narrow for it. */
  wide?: boolean;
};

/** Builds a gallery row straight off a SPRITE_CONTROL leaf (src/frames/
 *  frameW/frameH/scale/frameMs) instead of spelling out all 7 fields inline
 *  — every Forge/Factory/Effects/Lightning entry has this exact shape.
 *  `scale` defaults to the leaf's own live-scene scale but can be overridden
 *  (forgeSmith renders at 14 in the actual Capability Forge but that's too
 *  big for a thumbnail, so its gallery row asks for 3 instead). Pre-existing
 *  hand-authored rows elsewhere in this file use literal values, not a
 *  SPRITE_CONTROL read, so they don't go through this. */
function fromSprite(
  name: string,
  s: { src: string; frames: number; frameW: number; frameH: number; scale: number; frameMs: number },
  opts: { scale?: number; bob?: boolean } = {}
): AnimatedAsset {
  return {
    kind: "sprite",
    name,
    src: s.src,
    frames: s.frames,
    frameSize: s.frameW,
    frameW: s.frameW,
    frameH: s.frameH,
    scale: opts.scale ?? s.scale,
    frameMs: s.frameMs,
    bob: opts.bob ?? false,
  };
}

/** Build a directional fighter group (feed/s2|s3|s4): walk + bow + spear in all
 *  four directions + death, all 64px @ 0.75 scale. Frame counts are [down, up,
 *  left, right] per action (see the strips built by feed/build_strips.sh). */
const { belt: BELT } = SPRITE_CONTROL;

const DIRS = ["down", "up", "left", "right"] as const;
const ARROW = { down: "↓", up: "↑", left: "←", right: "→" } as const;
const ACTION_MS = { walk: 140, bow: 110, spear: 120 } as const;

function fighterGroup(
  label: string,
  set: string,
  counts: { walk: [number, number, number, number]; bow: [number, number, number, number]; spear: [number, number, number, number] }
): Group {
  const assets: Asset[] = [];
  (["walk", "bow", "spear"] as const).forEach((action) => {
    DIRS.forEach((d, i) => {
      assets.push({
        kind: "sprite",
        name: `${action} ${ARROW[d]}`,
        src: `/sprites/${set}/${action}_${d}.png`,
        frames: counts[action][i],
        frameSize: 64,
        scale: 0.75,
        frameMs: ACTION_MS[action],
        bob: action === "walk" ? undefined : false, // attacks shouldn't hover
      });
    });
  });
  assets.push({ kind: "sprite", name: "death", src: `/sprites/${set}/death.png`, frames: 6, frameSize: 64, scale: 0.75, frameMs: 190, bob: false });
  return { label, assets };
}

/** Build a directional group where every action (incl. death) has its own
 *  per-direction strip (feed/Vampires1 → /sprites/vampire1) — unlike
 *  `fighterGroup`, whose death is a single non-directional strip. */
const VAMPIRE_ACTIONS = ["idle", "walk", "run", "attack", "hurt", "death"] as const;
const VAMPIRE_ACTION_MS = { idle: 160, walk: 140, run: 110, attack: 110, hurt: 120, death: 160 } as const;

function directionalGroup(
  label: string,
  set: string,
  counts: Record<(typeof VAMPIRE_ACTIONS)[number], [number, number, number, number]>
): Group {
  const assets: Asset[] = [];
  VAMPIRE_ACTIONS.forEach((action) => {
    DIRS.forEach((d, i) => {
      assets.push({
        kind: "sprite",
        name: `${action} ${ARROW[d]}`,
        src: `/sprites/${set}/${action}_${d}.png`,
        frames: counts[action][i],
        frameSize: 64,
        scale: 0.75,
        frameMs: VAMPIRE_ACTION_MS[action],
        bob: action === "idle" || action === "walk" ? undefined : false, // attacks/hurt/death shouldn't hover
      });
    });
  });
  return { label, assets };
}

const GROUPS: Group[] = [
  {
    label: "Characters",
    assets: [
      { kind: "sprite", name: "skeleton ↓", src: "/sprites/skeleton/walk_down.png", frames: 8, frameSize: 64, scale: 0.75, frameMs: 135 },
      { kind: "sprite", name: "skeleton ↑", src: "/sprites/skeleton/walk_up.png", frames: 8, frameSize: 64, scale: 0.75, frameMs: 135 },
      { kind: "sprite", name: "skeleton ←", src: "/sprites/skeleton/walk_left.png", frames: 6, frameSize: 64, scale: 0.75, frameMs: 135 },
      { kind: "sprite", name: "skeleton →", src: "/sprites/skeleton/walk_right.png", frames: 6, frameSize: 64, scale: 0.75, frameMs: 135 },
      { kind: "sprite", name: "skeleton death", src: "/sprites/skeleton/death.png", frames: 6, frameSize: 64, scale: 0.75, frameMs: 195, bob: false },
      // The original cursor-follower (32px side-view), kept here for reference.
      { kind: "sprite", name: "skeleton idle (legacy follower)", src: "/sprites/skeleton_idle.png", frames: 6, frameSize: 32, scale: 1.5, frameMs: 225 },
      { kind: "sprite", name: "skeleton walk (legacy follower)", src: "/sprites/skeleton_walk.png", frames: 10, frameSize: 32, scale: 1.5, frameMs: 105 },
      { kind: "sprite", name: "robot walk", src: "/sprites/robot_walk.png", frames: 6, frameSize: 32, scale: 1.5, frameMs: 110 },
      { kind: "sprite", name: "robot jump", src: "/sprites/robot_jump.png", frames: 8, frameSize: 32, scale: 1.5, frameMs: 90 },
      { kind: "sprite", name: "vampire", src: "/sprites/vampire.png", frames: 4, frameSize: 16, scale: 3, frameMs: 240 },
      { kind: "sprite", name: "knight", src: "/sprites/dungeon/char_knight.png", frames: 3, frameSize: 16, scale: 3, frameMs: 220 },
      { kind: "sprite", name: "skeleton2", src: "/sprites/dungeon/char_skeleton2.png", frames: 3, frameSize: 16, scale: 3, frameMs: 200 },
      { kind: "sprite", name: "gentleman", src: "/sprites/dungeon/char_gentleman.png", frames: 2, frameSize: 16, scale: 3, frameMs: 300 },
      { kind: "sprite", name: "chest", src: "/sprites/dungeon/chest.png", frames: 3, frameSize: 16, scale: 3, frameMs: 320 },
    ],
  },
  fighterGroup("Hero (s2)", "s2", { walk: [9, 10, 9, 8], bow: [13, 13, 13, 13], spear: [9, 8, 8, 8] }),
  fighterGroup("Ranger (s3)", "s3", { walk: [10, 10, 9, 9], bow: [13, 13, 13, 13], spear: [8, 8, 9, 8] }),
  fighterGroup("Monk (s4)", "s4", { walk: [10, 10, 9, 9], bow: [13, 13, 13, 13], spear: [8, 8, 8, 8] }),
  directionalGroup("Vampire 1", "vampire1", {
    idle: [4, 4, 4, 4],
    walk: [6, 6, 6, 6],
    run: [8, 8, 8, 8],
    attack: [12, 12, 12, 12],
    hurt: [4, 4, 4, 4],
    death: [11, 11, 11, 11],
  }),
  directionalGroup("Vampire 2", "vampire2", {
    idle: [4, 4, 4, 4],
    walk: [6, 6, 6, 6],
    run: [8, 8, 8, 8],
    attack: [12, 12, 12, 12],
    hurt: [4, 4, 4, 4],
    death: [11, 11, 11, 11],
  }),
  directionalGroup("Vampire 3", "vampire3", {
    idle: [4, 4, 4, 4],
    walk: [6, 6, 6, 6],
    run: [8, 8, 8, 8],
    attack: [12, 12, 12, 12],
    hurt: [4, 4, 4, 4],
    death: [11, 11, 11, 11],
  }),
  {
    // Boss-class sprites flattened from feed/{devil,monster,shadow}.png. Devil &
    // monster play idle→collapse (they have no attack, only a hurt/death cycle);
    // the shadow evolves up from a slit in the ground to a full reaching shade.
    label: "Bosses",
    assets: [
      { kind: "sprite", name: "devil", src: "/sprites/boss/devil.png", frames: 17, frameSize: 120, frameW: 120, frameH: 100, scale: 0.5, frameMs: 140, bob: false },
      // Reads from SPRITE_CONTROL.boss.monster — the boot loader renders the
      // same sprite, so the numbers live in one place. Shown at scale 1 here
      // because the gallery thumbnails are uniform; the loader scales it up.
      { kind: "sprite", name: "monster", src: SPRITE_CONTROL.boss.monster.src, frames: SPRITE_CONTROL.boss.monster.frames, frameSize: SPRITE_CONTROL.boss.monster.frameW, frameW: SPRITE_CONTROL.boss.monster.frameW, frameH: SPRITE_CONTROL.boss.monster.frameH, scale: 1, frameMs: SPRITE_CONTROL.boss.monster.frameMs, bob: false },
      { kind: "sprite", name: "shadow", src: "/sprites/boss/shadow.png", frames: 18, frameSize: 80, frameW: 80, frameH: 70, scale: 0.7, frameMs: 120, bob: false },
    ],
  },
  {
    label: "Food (meat)",
    // Renamed consecutively from 01–10.
    assets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
      kind: "image" as const,
      name: `meat ${String(i).padStart(2, "0")}`,
      src: `/sprites/items/meat_${String(i).padStart(2, "0")}.png`,
      w: 40,
    })),
  },
  {
    label: "Items",
    assets: [
      { kind: "sprite", name: "key (spin)", src: "/sprites/key.png", frames: 4, frameSize: 16, scale: 3, frameMs: 130 },
      { kind: "image", name: "key (idle)", src: "/sprites/key_idle.png", w: 40 },
      { kind: "image", name: "key cursor", src: "/cursor-key.png", w: 32 },
    ],
  },
  {
    // Catalogue-only — extracted from feed/treasure/ by feed/extract_treasure.py.
    // Not wired into any live scene.
    label: "Treasure",
    assets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => ({
      kind: "image" as const,
      name: `Treasure ${i}`,
      src: `/sprites/treasure/treasure_${String(i).padStart(2, "0")}.png`,
      w: 40,
    })),
  },
  {
    // Dynamic aim reticle (feed/cursor.png) — 5-frame expand from a wide
    // crosshair to a locked target.
    label: "Aim",
    assets: [
      { kind: "sprite", name: "aim", src: "/sprites/ui/aim.png", frames: 5, frameSize: 13, scale: 3, frameMs: 120 },
    ],
  },
  {
    // Capability Network forge smith (user-uploaded Smith_Tile pack, source
    // kept outside the repo). One row (hammer strike + sparks) cropped out
    // of the smith's action sheet.
    label: "Forge",
    large: true,
    assets: [
      fromSprite("forge smith (strike)", SPRITE_CONTROL.forgeSmith, { scale: 3 }),
      { kind: "image", name: "forge anvil (hot)", src: SPRITE_CONTROL.forgeAnvilHot.src, w: SPRITE_CONTROL.forgeAnvilHot.w * SPRITE_CONTROL.forgeAnvilHot.scale },
      { kind: "image", name: "forge anvil (cold)", src: SPRITE_CONTROL.forgeAnvilCold.src, w: SPRITE_CONTROL.forgeAnvilCold.w * SPRITE_CONTROL.forgeAnvilCold.scale },
    ],
  },
  {
    // "factory v.2" pack (user-uploaded, source kept outside the repo).
    // Registered only — see lib/sprite-control.ts's `factory` block.
    label: "Factory",
    large: true,
    assets: [
      fromSprite("fac 1", SPRITE_CONTROL.factory.fac1),
      // tank.png bakes in a 10-colour legend + a "current colour" gauge dot
      // — TankColorPicker makes clicking a swatch actually set the gauge.
      { kind: "node", name: "liquid tank", node: <TankColorPicker /> },
      // One combined thumbnail instead of four static ones per furnace —
      // cycles opening → on → working/idle → off → repeat, 3s per phase.
      { kind: "node", name: "basic furnace", node: <BasicFurnaceCycle /> },
      { kind: "node", name: "advanced furnace", node: <AdvancedFurnaceCycle /> },
      // One combined thumbnail instead of three static ones — cycles
      // opening → idle → closing → repeat, 3s per phase (ReactorCycle).
      { kind: "node", name: "reactor", node: <ReactorCycle /> },
    ],
  },
  {
    // "extract/" transporter pack (user-uploaded, source kept outside the
    // repo). Left/right rollers + repeated middle tile composed into one
    // continuous belt — see lib/sprite-control.ts's `transporter` block.
    label: "Transporter",
    large: true,
    wide: true,
    assets: [{ kind: "node", name: "conveyor belt", node: <TransporterBelt /> }],
  },
  {
    // "extract/" effects pack (user-uploaded, source kept outside the
    // repo), replacing the old torch/campfire Fire group — see
    // lib/sprite-control.ts's `effects` block for the conversion story.
    label: "Effects",
    large: true,
    assets: [
      fromSprite("circle explosion", SPRITE_CONTROL.effects.circleExplosion),
      fromSprite("explosion", SPRITE_CONTROL.effects.explosion),
      fromSprite("explosion (blue circle)", SPRITE_CONTROL.effects.explosionBlueCircle),
      fromSprite("explosion (blue oval)", SPRITE_CONTROL.effects.explosionBlueOval),
      fromSprite("explosion (gas)", SPRITE_CONTROL.effects.explosionGas),
      fromSprite("explosion (gas circle)", SPRITE_CONTROL.effects.explosionGasCircle),
      fromSprite("explosion (two colors)", SPRITE_CONTROL.effects.explosionTwoColors),
      fromSprite("nuclear explosion", SPRITE_CONTROL.effects.nuclearExplosion),
      fromSprite("fire", SPRITE_CONTROL.effects.fire),
      fromSprite("smoke", SPRITE_CONTROL.effects.smoke),
    ],
  },
  {
    // Lightning bolt (beginning → cycle → end, LightningBolt) plus the
    // independent ground-impact glow loop — both from the same "extract/"
    // effects pack as the Effects group above.
    label: "Lightning",
    large: true,
    assets: [
      { kind: "node", name: "bolt", node: <LightningBolt /> },
      fromSprite("impact spot", SPRITE_CONTROL.effects.lightningSpot),
    ],
  },
  {
    label: "Walls",
    assets: [
      { kind: "image", name: "wall (dungeon)", src: "/sprites/dungeon/wall_9slice.png", w: 48 },

    ],
  },
  {
    label: "Health",
    assets: [
      { kind: "image", name: "heart1 (full)", src: "/sprites/ui/heart_full.png", w: 39 },
      { kind: "image", name: "heart2 (half)", src: "/sprites/ui/heart_half.png", w: 39 },
      { kind: "image", name: "heart3 (empty)", src: "/sprites/ui/heart_empty.png", w: 39 },
    ],
  },
  {
    label: "UI panels",
    assets: [
      { kind: "image", name: "banner", src: "/sprites/ui/banner.png", w: 96 },
      { kind: "image", name: "header", src: "/sprites/ui/header.png", w: 80 },
      { kind: "image", name: "textfield", src: "/sprites/ui/textfield.png", w: 80 },
      { kind: "image", name: "pageline", src: "/sprites/ui/pageline.png", w: 80 },
      { kind: "image", name: "barframe", src: "/sprites/ui/barframe.png", w: 80 },
      { kind: "image", name: "barfill", src: "/sprites/ui/barfill.png", w: 80 },
    ],
  },
  {
    // Transport bar, joystick, and attack-button coins (feed/extract_ui_assets.py,
    // from feed/ui-source), wired into DungeonSlideshowControls and
    // DungeonTouchControls. The transport/attack-button coins are each an
    // off/lit pair; the joystick is off-only.
    label: "Dungeon Controls",
    assets: [
      { kind: "image", name: "prev (off)", src: "/sprites/ui/btn_prev_off.png", w: 56 },
      { kind: "image", name: "prev (lit)", src: "/sprites/ui/btn_prev_lit.png", w: 56 },
      { kind: "image", name: "play (off)", src: "/sprites/ui/btn_play_off.png", w: 56 },
      { kind: "image", name: "pause (lit)", src: "/sprites/ui/btn_pause_lit.png", w: 56 },
      { kind: "image", name: "next (off)", src: "/sprites/ui/btn_next_off.png", w: 56 },
      { kind: "image", name: "next (lit)", src: "/sprites/ui/btn_next_lit.png", w: 56 },
      { kind: "image", name: "playground (off)", src: "/sprites/ui/btn_playground_off.png", w: 56 },
      { kind: "image", name: "playground (lit)", src: "/sprites/ui/btn_playground_lit.png", w: 56 },
      { kind: "image", name: "joystick outer", src: "/sprites/ui/joystick_outer_off.png", w: 64 },
      { kind: "image", name: "joystick inner", src: "/sprites/ui/joystick_inner_off.png", w: 44 },
      { kind: "image", name: "attack (off)", src: "/sprites/ui/attack_off.png", w: 56 },
      { kind: "image", name: "attack (lit)", src: "/sprites/ui/attack_lit.png", w: 56 },
      // The two carved link signs that lead the transport bar. Wide rather
      // than coin-shaped because the art carries its own lettering.
      { kind: "image", name: "github sign", src: "/sprites/ui/sign_github.webp", w: 128 },
      { kind: "image", name: "live sign", src: "/sprites/ui/sign_live.webp", w: 128 },
    ],
  },
  {
    // Dungeon tileset — the structural tiles the Projects dungeon actually uses:
    // the inner wall (tile_1) and four floor-sand variants (tile_2–5). The rest
    // of the Kenney catalogue was removed.
    label: "Dungeon Tiles",
    assets: [1, 2, 3, 4, 5].map((id) => ({
      kind: "image" as const,
      name: `tile ${id}`,
      src: `/sprites/dungeon-tiles/tile_${id}.png`,
      w: 44,
    })),
  },
  // Hand-made maps (feed/Map) — catalogue-only, not wired into any live scene.
  // Each map ships in three forms: parchment, transparent w/ sea, transparent land.
  // Thumbnails are 512px web copies; the full-res originals stay in feed/Map.
  ...[1, 2, 3, 4, 5].map((n): Group => ({
    label: `Map ${n}`,
    assets: [
      { kind: "image" as const, name: "sea", src: `/sprites/maps/map_${n}_sea.png`, w: 96 },
      { kind: "image" as const, name: "land", src: `/sprites/maps/map_${n}_land.png`, w: 96 },
    ],
  })),
  {
    // Animated magic book (see SPRITE_CONTROL.book) — CraftPix's free
    // "Animated Magic Book" pixel-art pack. Drives
    // components/book/magic-book.tsx, mounted in the Project Dungeon panel.
    label: "Book",
    assets: [
      { kind: "image", name: "open", src: "/sprites/book/open_book.png", w: 96 },
      { kind: "image", name: "close", src: "/sprites/book/close_book.png", w: 96 },
      { kind: "image", name: "turn left", src: "/sprites/book/turning_pages_left.png", w: 96 },
      { kind: "image", name: "turn right", src: "/sprites/book/turning_pages_right.png", w: 96 },
    ],
  },
  {
    // "Rambo" character pack (see SPRITE_CONTROL.rambo) — one combined cycle
    // instead of five separate thumbnails: idle → run → run (mirrored, i.e.
    // "moving left") → jump → fall → repeat. RamboCycle is the single place
    // that sequences them; each phase still comes straight from
    // SPRITE_CONTROL.rambo, so a live scene can trigger idle/run/jump/fall
    // independently later without touching this preview.
    label: "Rambo",
    large: true,
    assets: [{ kind: "node", name: "idle → run → left → jump → fall", node: <RamboCycle /> }],
  },
  {
    // Modular isometric conveyor kit (see SPRITE_CONTROL.belt) — four
    // directions x start/mid/end/single, plus the larger corner and
    // junction pieces. Catalogued only; the live scene still uses the
    // older two-roller Transporter above.
    label: "Belt",
    large: true,
    assets: [
      fromSprite("ne start", BELT.neStart),
      fromSprite("ne mid", BELT.neMid),
      fromSprite("ne end", BELT.neEnd),
      fromSprite("ne single", BELT.neSingle),
      fromSprite("nw start", BELT.nwStart),
      fromSprite("nw mid", BELT.nwMid),
      fromSprite("nw end", BELT.nwEnd),
      fromSprite("nw single", BELT.nwSingle),
      fromSprite("se start", BELT.seStart),
      fromSprite("se mid", BELT.seMid),
      fromSprite("se end", BELT.seEnd),
      fromSprite("se single", BELT.seSingle),
      fromSprite("sw start", BELT.swStart),
      fromSprite("sw mid", BELT.swMid),
      fromSprite("sw end", BELT.swEnd),
      fromSprite("sw single", BELT.swSingle),
      fromSprite("curve 1", BELT.curve1, { scale: 0.55 }),
      fromSprite("curve 2", BELT.curve2, { scale: 0.55 }),
      fromSprite("curve 3", BELT.curve3, { scale: 0.55 }),
      fromSprite("curve 4", BELT.curve4, { scale: 0.55 }),
      { kind: "image", name: "splitter / merger", src: BELT.splitterMerger.src, w: 96 },
    ],
  },
  {
    // Turbine (see SPRITE_CONTROL.turbine) — the pack's eight loose pieces
    // shown as the two machines they compose into rather than eight
    // unlabelled index rows: turbine 1 runs base -> anim 1-4, turbine 2
    // runs anim 5-7, 2s a phase (components/ui/turbine-cycle.tsx).
    label: "Turbine",
    large: true,
    assets: [
      { kind: "node", name: "turbine 1", node: <Turbine1Cycle /> },
      { kind: "node", name: "turbine 2", node: <Turbine2Cycle /> },
    ],
  },
  {
    // Steam generator (see SPRITE_CONTROL.steamGenerator) — running and
    // shutting-down states.
    label: "Steam Generator",
    large: true,
    assets: [
      fromSprite("running", SPRITE_CONTROL.steamGenerator.running, { scale: 0.7 }),
      fromSprite("turn off", SPRITE_CONTROL.steamGenerator.turnOff, { scale: 0.7 }),
    ],
  },
  {
    // Assembler (see SPRITE_CONTROL.assembler) — one 10-frame working loop.
    label: "Assembler",
    large: true,
    assets: [fromSprite("fac 2", SPRITE_CONTROL.assembler.fac2, { scale: 0.8 })],
  },
  {
    // "Starry Night" parallax pack (Falling_Star + Layers_*, source kept
    // outside the repo). Eight static layers, farthest to nearest, plus an
    // animated falling-star overlay (a real GIF — animates natively, no
    // PixelSprite needed). Shown at the smallest (640-wide) resolution set;
    // 1920/2560 variants also live under /sprites/starry-night for
    // whichever component ends up rendering this at full size. Catalogue-only
    // — not wired into any live scene yet.
    label: "Starry Night",
    assets: [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        kind: "image" as const,
        name: `layer ${i}`,
        src: `/sprites/starry-night/layer-${i}-640.png`,
        w: 96,
      })),
      { kind: "image", name: "falling star", src: "/sprites/starry-night/falling-star-640.gif", w: 62 },
    ],
  },
];

function Thumb({ asset, large }: { asset: Asset; large?: boolean }) {
  return (
    <div className="asset-gallery__thumb">
      <div className={cn("asset-gallery__thumb-frame", large && "asset-gallery__thumb-frame--lg")}>
        {asset.kind === "sprite" ? (
          <PixelSprite
            src={asset.src}
            frames={asset.frames}
            frameSize={asset.frameSize}
            frameW={asset.frameW}
            frameH={asset.frameH}
            scale={asset.scale}
            frameMs={asset.frameMs}
            bob={asset.bob ?? true}
          />
        ) : asset.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.src}
            alt={asset.name}
            width={asset.w}
            className={cn(
              "asset-gallery__thumb-img",
              large && "asset-gallery__thumb-img--lg",
              "pixelated",
              asset.flicker && "animate-sprite-flicker"
            )}
          />
        ) : (
          asset.node
        )}
      </div>
      <span className={cn("asset-gallery__thumb-label", "font-pixel-readable")}>{asset.name}</span>
    </div>
  );
}

export function AssetGallery() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(open, [btnRef, panelRef], () => setOpen(false));

  return (
    <div className="asset-gallery__root">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Hide asset gallery" : "Show asset gallery"}
        aria-expanded={open}
        aria-controls={panelId}
        className="asset-gallery__toggle"
      >
        <Icon name="Info" size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="asset-gallery__panel"
          >
            <DungeonFrame wall={24} className={cn("asset-gallery__frame", "font-pixel-readable")}>
              <div className="asset-gallery__panel-scroll">
                <p className={cn("asset-gallery__panel-title", "font-pixel")}>Asset registry</p>
                <p className="asset-gallery__panel-intro">Pixel-art assets running across this site.</p>

                {GROUPS.map((group) => (
                  <div key={group.label} className="asset-gallery__group">
                    <p className={cn("asset-gallery__group-title", "font-pixel")}>{group.label}</p>
                    <div
                      className={cn(
                        "asset-gallery__group-grid",
                        group.large && "asset-gallery__group-grid--lg",
                        group.wide && "asset-gallery__group-grid--wide"
                      )}
                    >
                      {group.assets.map((a) => (
                        <Thumb key={a.name} asset={a} large={group.large} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DungeonFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
