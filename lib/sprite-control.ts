/**
 * sprite-control.ts — MASTER CONTROL for every animated pixel-art asset.
 *
 * One place to tune speed / walk / jump / attack / idle timing for all sprites
 * on the site. Components read from here instead of hard-coding magic numbers,
 * so behaviour can be retuned without touching component logic.
 *
 * Sources are produced by feed/extract_ui.py (and the older feed/extract_assets.py)
 * into /public/sprites. `frameSize` is the source frame size in px; `scale` is the
 * on-screen multiplier; `frameMs` is ms-per-frame; speeds are px/second.
 */

export const SPRITE_CONTROL = {
  /** Cursor-following SkeletonCompanion (components/companion).
   *
   * Directional, action-extensible sprite set (sliced from feed/s1 into
   * /sprites/skeleton). Every action shares the same 4-key `dir` map
   * (down/up/left/right), so adding a new attack strategy later (e.g. bow,
   * spear) is a pure data change: drop a per-direction strip into
   * /sprites/skeleton and add an `actions.bow` / `actions.spear` block with the
   * same shape — no component rework. `walk` is the default action. */
  companion: {
    frameSize: 64,
    scale: 0.75, // ~48px on screen — matches the previous companion footprint
    actions: {
      walk: {
        frameMs: 135, // ~1.5× slower stroll than the original 90
        dir: {
          down:  { src: "/sprites/skeleton/walk_down.png",  frames: 8 },
          up:    { src: "/sprites/skeleton/walk_up.png",    frames: 8 },
          left:  { src: "/sprites/skeleton/walk_left.png",  frames: 6 },
          right: { src: "/sprites/skeleton/walk_right.png", frames: 6 },
        },
      },
    },
    /** Collapse sequence — reusable, surfaced in the Asset Gallery (info). */
    death: { src: "/sprites/skeleton/death.png", frames: 6, frameMs: 195 },
    walkSpeed: 130, // px/s heading to the cursor / chest (deliberately slow march)
    wanderSpeed: 63, // px/s drifting on its own (~1.5× slower than 95)
    standoff: 26, // stop this far from the cursor
    /** Cursor stillness (ms) before the companion marches to the chest. */
    idleToChestMs: 3000,
    /** Chest screen position (chest is fixed at left-4/top-4, sprite scale 3 ≈ 48px). */
    chestTarget: { x: 40, y: 56 },
    /** Faked "attack": a quick scale lunge on arrival (no attack sprite exists). */
    attack: { lungeMs: 240, lungeScale: 1.3 },
  },

  /** Hero / Ranger / Monk directional fighters (feed/s2|s3|s4 → /sprites/sN).
   *
   * Same directional, action-extensible shape as `companion`, but each now ships
   * the full attack roster: walk + bow + spear in all four directions, plus a
   * death collapse. Catalogue-only for now (surfaced in the Asset Gallery info);
   * any of them can later drive a live actor by reading `actions.<x>.dir[facing]`
   * exactly like the companion does. frameMs run ~1.5× slower for a calm feel. */
  s2: {
    frameSize: 64,
    scale: 0.75,
    actions: {
      walk:  { frameMs: 140, dir: {
        down:  { src: "/sprites/s2/walk_down.png",  frames: 9 },
        up:    { src: "/sprites/s2/walk_up.png",    frames: 10 },
        left:  { src: "/sprites/s2/walk_left.png",  frames: 9 },
        right: { src: "/sprites/s2/walk_right.png", frames: 8 },
      } },
      bow:   { frameMs: 110, dir: {
        down:  { src: "/sprites/s2/bow_down.png",  frames: 13 },
        up:    { src: "/sprites/s2/bow_up.png",    frames: 13 },
        left:  { src: "/sprites/s2/bow_left.png",  frames: 13 },
        right: { src: "/sprites/s2/bow_right.png", frames: 13 },
      } },
      spear: { frameMs: 120, dir: {
        down:  { src: "/sprites/s2/spear_down.png",  frames: 9 },
        up:    { src: "/sprites/s2/spear_up.png",    frames: 8 },
        left:  { src: "/sprites/s2/spear_left.png",  frames: 8 },
        right: { src: "/sprites/s2/spear_right.png", frames: 8 },
      } },
    },
    death: { src: "/sprites/s2/death.png", frames: 6, frameMs: 190 },
  },

  s3: {
    frameSize: 64,
    scale: 0.75,
    actions: {
      walk:  { frameMs: 140, dir: {
        down:  { src: "/sprites/s3/walk_down.png",  frames: 10 },
        up:    { src: "/sprites/s3/walk_up.png",    frames: 10 },
        left:  { src: "/sprites/s3/walk_left.png",  frames: 9 },
        right: { src: "/sprites/s3/walk_right.png", frames: 9 },
      } },
      bow:   { frameMs: 110, dir: {
        down:  { src: "/sprites/s3/bow_down.png",  frames: 13 },
        up:    { src: "/sprites/s3/bow_up.png",    frames: 13 },
        left:  { src: "/sprites/s3/bow_left.png",  frames: 13 },
        right: { src: "/sprites/s3/bow_right.png", frames: 13 },
      } },
      spear: { frameMs: 120, dir: {
        down:  { src: "/sprites/s3/spear_down.png",  frames: 8 },
        up:    { src: "/sprites/s3/spear_up.png",    frames: 8 },
        left:  { src: "/sprites/s3/spear_left.png",  frames: 9 },
        right: { src: "/sprites/s3/spear_right.png", frames: 8 },
      } },
    },
    death: { src: "/sprites/s3/death.png", frames: 6, frameMs: 190 },
  },

  s4: {
    frameSize: 64,
    scale: 0.75,
    actions: {
      walk:  { frameMs: 140, dir: {
        down:  { src: "/sprites/s4/walk_down.png",  frames: 10 },
        up:    { src: "/sprites/s4/walk_up.png",    frames: 10 },
        left:  { src: "/sprites/s4/walk_left.png",  frames: 9 },
        right: { src: "/sprites/s4/walk_right.png", frames: 9 },
      } },
      bow:   { frameMs: 110, dir: {
        down:  { src: "/sprites/s4/bow_down.png",  frames: 13 },
        up:    { src: "/sprites/s4/bow_up.png",    frames: 13 },
        left:  { src: "/sprites/s4/bow_left.png",  frames: 13 },
        right: { src: "/sprites/s4/bow_right.png", frames: 13 },
      } },
      spear: { frameMs: 120, dir: {
        down:  { src: "/sprites/s4/spear_down.png",  frames: 8 },
        up:    { src: "/sprites/s4/spear_up.png",    frames: 8 },
        left:  { src: "/sprites/s4/spear_left.png",  frames: 8 },
        right: { src: "/sprites/s4/spear_right.png", frames: 8 },
      } },
    },
    death: { src: "/sprites/s4/death.png", frames: 6, frameMs: 190 },
  },

  /** Vampire fighter (feed/Vampires1 → /sprites/vampire1). Fully directional
   *  across all six actions, including death (unlike s2/s3/s4, whose death
   *  is a single non-directional strip). Catalogue-only for now (surfaced in
   *  the Asset Gallery info); can later drive a live actor exactly like the
   *  companion. */
  vampire1: {
    frameSize: 64,
    scale: 0.75,
    actions: {
      idle:   { frameMs: 160, dir: {
        down:  { src: "/sprites/vampire1/idle_down.png",  frames: 4 },
        up:    { src: "/sprites/vampire1/idle_up.png",    frames: 4 },
        left:  { src: "/sprites/vampire1/idle_left.png",  frames: 4 },
        right: { src: "/sprites/vampire1/idle_right.png", frames: 4 },
      } },
      walk:   { frameMs: 140, dir: {
        down:  { src: "/sprites/vampire1/walk_down.png",  frames: 6 },
        up:    { src: "/sprites/vampire1/walk_up.png",    frames: 6 },
        left:  { src: "/sprites/vampire1/walk_left.png",  frames: 6 },
        right: { src: "/sprites/vampire1/walk_right.png", frames: 6 },
      } },
      run:    { frameMs: 110, dir: {
        down:  { src: "/sprites/vampire1/run_down.png",  frames: 8 },
        up:    { src: "/sprites/vampire1/run_up.png",    frames: 8 },
        left:  { src: "/sprites/vampire1/run_left.png",  frames: 8 },
        right: { src: "/sprites/vampire1/run_right.png", frames: 8 },
      } },
      attack: { frameMs: 110, dir: {
        down:  { src: "/sprites/vampire1/attack_down.png",  frames: 12 },
        up:    { src: "/sprites/vampire1/attack_up.png",    frames: 12 },
        left:  { src: "/sprites/vampire1/attack_left.png",  frames: 12 },
        right: { src: "/sprites/vampire1/attack_right.png", frames: 12 },
      } },
      hurt:   { frameMs: 120, dir: {
        down:  { src: "/sprites/vampire1/hurt_down.png",  frames: 4 },
        up:    { src: "/sprites/vampire1/hurt_up.png",    frames: 4 },
        left:  { src: "/sprites/vampire1/hurt_left.png",  frames: 4 },
        right: { src: "/sprites/vampire1/hurt_right.png", frames: 4 },
      } },
      death:  { frameMs: 160, dir: {
        down:  { src: "/sprites/vampire1/death_down.png",  frames: 11 },
        up:    { src: "/sprites/vampire1/death_up.png",    frames: 11 },
        left:  { src: "/sprites/vampire1/death_left.png",  frames: 11 },
        right: { src: "/sprites/vampire1/death_right.png", frames: 11 },
      } },
    },
  },

  /** Second vampire fighter (feed/Vampires2 → /sprites/vampire2). Same shape
   *  as `vampire1`, different art. Catalogue-only for now. */
  vampire2: {
    frameSize: 64,
    scale: 0.75,
    actions: {
      idle:   { frameMs: 160, dir: {
        down:  { src: "/sprites/vampire2/idle_down.png",  frames: 4 },
        up:    { src: "/sprites/vampire2/idle_up.png",    frames: 4 },
        left:  { src: "/sprites/vampire2/idle_left.png",  frames: 4 },
        right: { src: "/sprites/vampire2/idle_right.png", frames: 4 },
      } },
      walk:   { frameMs: 140, dir: {
        down:  { src: "/sprites/vampire2/walk_down.png",  frames: 6 },
        up:    { src: "/sprites/vampire2/walk_up.png",    frames: 6 },
        left:  { src: "/sprites/vampire2/walk_left.png",  frames: 6 },
        right: { src: "/sprites/vampire2/walk_right.png", frames: 6 },
      } },
      run:    { frameMs: 110, dir: {
        down:  { src: "/sprites/vampire2/run_down.png",  frames: 8 },
        up:    { src: "/sprites/vampire2/run_up.png",    frames: 8 },
        left:  { src: "/sprites/vampire2/run_left.png",  frames: 8 },
        right: { src: "/sprites/vampire2/run_right.png", frames: 8 },
      } },
      attack: { frameMs: 110, dir: {
        down:  { src: "/sprites/vampire2/attack_down.png",  frames: 12 },
        up:    { src: "/sprites/vampire2/attack_up.png",    frames: 12 },
        left:  { src: "/sprites/vampire2/attack_left.png",  frames: 12 },
        right: { src: "/sprites/vampire2/attack_right.png", frames: 12 },
      } },
      hurt:   { frameMs: 120, dir: {
        down:  { src: "/sprites/vampire2/hurt_down.png",  frames: 4 },
        up:    { src: "/sprites/vampire2/hurt_up.png",    frames: 4 },
        left:  { src: "/sprites/vampire2/hurt_left.png",  frames: 4 },
        right: { src: "/sprites/vampire2/hurt_right.png", frames: 4 },
      } },
      death:  { frameMs: 160, dir: {
        down:  { src: "/sprites/vampire2/death_down.png",  frames: 11 },
        up:    { src: "/sprites/vampire2/death_up.png",    frames: 11 },
        left:  { src: "/sprites/vampire2/death_left.png",  frames: 11 },
        right: { src: "/sprites/vampire2/death_right.png", frames: 11 },
      } },
    },
  },

  /** Third vampire fighter (feed/Vampires3 → /sprites/vampire3). Same shape
   *  as `vampire1`, different art. Catalogue-only for now. */
  vampire3: {
    frameSize: 64,
    scale: 0.75,
    actions: {
      idle:   { frameMs: 160, dir: {
        down:  { src: "/sprites/vampire3/idle_down.png",  frames: 4 },
        up:    { src: "/sprites/vampire3/idle_up.png",    frames: 4 },
        left:  { src: "/sprites/vampire3/idle_left.png",  frames: 4 },
        right: { src: "/sprites/vampire3/idle_right.png", frames: 4 },
      } },
      walk:   { frameMs: 140, dir: {
        down:  { src: "/sprites/vampire3/walk_down.png",  frames: 6 },
        up:    { src: "/sprites/vampire3/walk_up.png",    frames: 6 },
        left:  { src: "/sprites/vampire3/walk_left.png",  frames: 6 },
        right: { src: "/sprites/vampire3/walk_right.png", frames: 6 },
      } },
      run:    { frameMs: 110, dir: {
        down:  { src: "/sprites/vampire3/run_down.png",  frames: 8 },
        up:    { src: "/sprites/vampire3/run_up.png",    frames: 8 },
        left:  { src: "/sprites/vampire3/run_left.png",  frames: 8 },
        right: { src: "/sprites/vampire3/run_right.png", frames: 8 },
      } },
      attack: { frameMs: 110, dir: {
        down:  { src: "/sprites/vampire3/attack_down.png",  frames: 12 },
        up:    { src: "/sprites/vampire3/attack_up.png",    frames: 12 },
        left:  { src: "/sprites/vampire3/attack_left.png",  frames: 12 },
        right: { src: "/sprites/vampire3/attack_right.png", frames: 12 },
      } },
      hurt:   { frameMs: 120, dir: {
        down:  { src: "/sprites/vampire3/hurt_down.png",  frames: 4 },
        up:    { src: "/sprites/vampire3/hurt_up.png",    frames: 4 },
        left:  { src: "/sprites/vampire3/hurt_left.png",  frames: 4 },
        right: { src: "/sprites/vampire3/hurt_right.png", frames: 4 },
      } },
      death:  { frameMs: 160, dir: {
        down:  { src: "/sprites/vampire3/death_down.png",  frames: 11 },
        up:    { src: "/sprites/vampire3/death_up.png",    frames: 11 },
        left:  { src: "/sprites/vampire3/death_left.png",  frames: 11 },
        right: { src: "/sprites/vampire3/death_right.png", frames: 11 },
      } },
    },
  },

  /** Ambient dungeon characters that roam the sidebar floor (chest-sidebar). */
  floorChars: {
    frameSize: 16,
    scale: 3.5,
    wanderSpeed: 14, // % of floor width per second
    pauseMsMin: 700,
    pauseMsMax: 2800,
    chars: [
      { src: "/sprites/dungeon/char_knight.png", frames: 3, frameMs: 220 },
      { src: "/sprites/dungeon/char_skeleton2.png", frames: 3, frameMs: 200 },
      { src: "/sprites/dungeon/char_zombie.png", frames: 2, frameMs: 320 },
      { src: "/sprites/dungeon/char_gentleman.png", frames: 2, frameMs: 300 },
    ],
  },

  /** Chest lid toggle on the sidebar. */
  chest: {
    src: "/sprites/dungeon/chest.png",
    frames: 3,
    frameSize: 16,
    scale: 3,
    frameMs: 90,
  },

  /** Anime-robot (walk + jump). Available for roaming / gallery use. */
  robot: {
    frameSize: 32,
    scale: 2,
    walk: { src: "/sprites/robot_walk.png", frames: 6, frameMs: 110 },
    jump: { src: "/sprites/robot_jump.png", frames: 8, frameMs: 90 },
  },

  /** Vampire idle (gentle breathing via the sprite bob). */
  vampire: {
    src: "/sprites/vampire.png",
    frames: 4,
    frameSize: 16,
    scale: 3,
    frameMs: 240,
  },

  /** Golden key — a 4-frame spin (rotating) + a static idle frame. Also the
   *  pre-scaled /cursor-key.png drives the site-wide custom cursor. */
  key: {
    src: "/sprites/key.png", // rotating strip
    idleSrc: "/sprites/key_idle.png", // single static frame
    cursorSrc: "/cursor-key.png", // 32px cursor image
    frames: 4,
    frameSize: 16,
    scale: 3,
    frameMs: 130,
  },

  /** Food pickups — a curated subset auto-sliced from feed/Meat.png into
   *  /sprites/items/meat_NN.png, plus a uniform horizontal strip. Survivors keep
   *  their original index (gaps are intentional — culled items were removed). */
  meat: {
    strip: "/sprites/items/meat_strip.png",
    dir: "/sprites/items",
    /** Consecutive 1–10 after renaming. */
    keep: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    frameW: 23,
    frameH: 15,
    scale: 3,
  },

  /** Treasure chests — only 1 & 2 survive (3–5 were retired). CLOSED tile plus
   *  an OPEN counterpart per chest (treasure_N_open.png). Static painted tiles. */
  treasures: {
    dir: "/sprites/dungeon",
    keep: [1, 2],
    scale: 0.5,
    open: { suffix: "_open", w: 48 },
  },

  /** Pirate ship — only three angles survive (the rest were culled): 3 is the
   *  bow-on / top-down hull used as the centre turret in the Capabilities scene,
   *  4 is a three-quarter, 5 a left→right broadside. Static painted tiles brought
   *  to life with the `ship-bob` float (see components/ui/ship.tsx). */
  ship: {
    dir: "/sprites/ship",
    frames: [3, 4, 5] as const,
    width: 150,
  },

  /** Eight painted islands from feed/island.png + feed/island2.png, sliced by
   *  feed/extract_islands.py — the targets in the Capabilities "Island Siege". */
  islands: {
    dir: "/sprites/islands",
    count: 8,
  },

  /** One chain arrangement ([drape]--chain--[skull]--chain--[drape]); kept for
   *  use as a flow-diagram connector tile (registry only for now). */
  chain: {
    src: "/sprites/dungeon/chain.png",
    scale: 0.5,
  },

  /** Animated flames — single-frame art (asset.png has no frame pairs), brought
   *  to life on-site with a CSS flicker rather than frame-stepping. */
  fire: {
    dir: "/sprites/fire",
    scale: 0.6,
    list: ["torch", "camp_fire", "fireball_1", "fireball_2", "fire_blast", "explosive_fire"],
  },

  /** Dynamic aim reticle — a 5-frame strip (feed/cursor.png) that expands from a
   *  wide crosshair to a locked target. Catalogued in the Asset Gallery. */
  aim: {
    src: "/sprites/ui/aim.png",
    frames: 5,
    frameSize: 13,
    scale: 3,
    frameMs: 120,
  },

} as const;
