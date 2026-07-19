"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { Icon } from "@/components/ui/icon";
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
  /** Painted ship tiles — gentle buoyant bob (see Ship / ship-bob keyframe). */
  bob?: boolean;
};
type Asset = AnimatedAsset | StaticAsset;

type Group = { label: string; assets: Asset[] };

/** Build a directional fighter group (feed/s2|s3|s4): walk + bow + spear in all
 *  four directions + death, all 64px @ 0.75 scale. Frame counts are [down, up,
 *  left, right] per action (see the strips built by feed/build_strips.sh). */
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
      { kind: "sprite", name: "monster", src: "/sprites/boss/monster.png", frames: 11, frameSize: 45, frameW: 45, frameH: 51, scale: 1, frameMs: 140, bob: false },
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
    // Three surviving ship angles (3/4/5) — each gently bobs (Ship / ship-bob).
    label: "Ships",
    assets: [3, 4, 5].map((n) => ({
      kind: "image" as const,
      name: `ship ${n}`,
      src: `/sprites/ship/ship_${n}.png`,
      w: 56,
      bob: true,
    })),
  },
  {
    // Single-frame flames — kept alive with a CSS flicker rather than frames.
    label: "Fire",
    assets: [
      { kind: "image", name: "torch", src: "/sprites/fire/torch.png", w: 28, flicker: true },
      { kind: "image", name: "camp fire", src: "/sprites/fire/camp_fire.png", w: 44, flicker: true },
      { kind: "image", name: "fireball 1", src: "/sprites/fire/fireball_1.png", w: 48, flicker: true },
      { kind: "image", name: "fireball 2", src: "/sprites/fire/fireball_2.png", w: 56, flicker: true },
      { kind: "image", name: "fire blast", src: "/sprites/fire/fire_blast.png", w: 60, flicker: true },
      { kind: "image", name: "explosive", src: "/sprites/fire/explosive_fire.png", w: 56, flicker: true },
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
];

function Thumb({ asset }: { asset: Asset }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-16 w-full items-center justify-center rounded-sm border border-ops-line bg-ops-base/60 p-1">
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
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.src}
            alt={asset.name}
            width={asset.w}
            className={cn(
              "pixelated max-h-14 object-contain",
              asset.flicker && "animate-sprite-flicker motion-reduce:animate-none",
              asset.bob && "animate-ship-bob motion-reduce:animate-none"
            )}
          />
        )}
      </div>
      <span className="font-pixel-readable text-center text-base leading-none text-ops-sand-soft">
        {asset.name}
      </span>
    </div>
  );
}

export function AssetGallery() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="hidden md:block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Hide asset gallery" : "Show asset gallery"}
        aria-expanded={open}
        aria-controls={panelId}
        className="fixed right-4 top-4 z-[80] flex h-9 w-9 items-center justify-center rounded-md border border-ops-line bg-ops-surface/80 text-ops-sand backdrop-blur-md transition-colors hover:border-ops-rust/50 hover:text-ops-rust"
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
            className="fixed right-4 top-[3.75rem] z-[78] w-[320px]"
          >
            <DungeonFrame wall={24} className="font-pixel-readable text-ops-sand">
              <div className="max-h-[78vh] overflow-y-auto p-3">
                <p className="font-pixel mb-1 text-[0.5rem] uppercase tracking-widest text-ops-rust">
                  Asset registry
                </p>
                <p className="mb-3 text-base leading-snug text-ops-sand-soft">
                  Pixel-art assets running across this site.
                </p>

                {GROUPS.map((group) => (
                  <div key={group.label} className="mb-4 last:mb-0">
                    <p className="font-pixel mb-2 text-[0.45rem] uppercase tracking-widest text-ops-olive">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {group.assets.map((a) => (
                        <Thumb key={a.name} asset={a} />
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
