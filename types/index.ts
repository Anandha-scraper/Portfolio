export type SectionId =
  | "mission-control"
  | "capabilities"
  | "ecosystem"
  | "contact";

export interface NavItem {
  id: SectionId;
  label: string;
  icon: string; // lucide icon name
}

export interface Profile {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  summary: string;
}

export type SkillCategoryId =
  | "frontend"
  | "backend"
  | "databases"
  | "devops"
  | "agentic-ai"
  | "web3"
  | "system-design"
  | "quality";

export interface Skill {
  name: string;
  level: number; // 0-100, honest proficiency
  note?: string;
}

export interface SkillCategory {
  id: SkillCategoryId;
  label: string;
  icon: string; // lucide icon name
  accent: "blue" | "indigo" | "violet" | "coral" | "emerald";
  blurb: string;
  skills: Skill[];
}

export type ProjectStatus = "shipped" | "finalist" | "internal" | "live" | "in-progress";

export interface ProjectMetric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  category: "web3" | "platform" | "enterprise" | "data";
  status: ProjectStatus;
  year: string;
  overview: string;
  highlights: string[];
  stack: string[];
  metrics: ProjectMetric[];
  accent: "blue" | "indigo" | "violet" | "coral" | "emerald";
  links: {
    github?: string;
    live?: string;
  };
  // ids of related projects (drives ecosystem connector lines)
  related: string[];
  featured: boolean;
  // True while this project is being rebuilt/replaced. The dungeon room,
  // treasure, and map connections stay exactly as generated (lib/dungeon-layout.ts
  // derives the map from the full `projects` array regardless of this flag) —
  // only ProjectDungeonPanel swaps in a generic "being updated" card instead
  // of the full detail view when this is set.
  updating?: boolean;
  // Screenshots for this project, shown on the stone plate in the dungeon
  // panel (components/project-ecosystem/project-plate.tsx). Drop files under
  // public/projects/<id>/ and reference them here — any number, in any shape:
  // the plate takes each image's own aspect ratio, and only draws its rune
  // pager once there is more than one. A project with none renders no plate.
  previewImages?: string[];
}

export interface Social {
  label: string;
  handle: string;
  href: string;
  icon: string;
}

/**
 * Scene placement — the data behind components/capability-network/scene-stage.tsx
 * and the dev-only visual editor at /master/scene.
 *
 * Coordinates are plain top-left offsets in the layout's own "world" (a fixed
 * design-space box). SceneStage renders that box at world size and scales it
 * uniformly to fit whatever the stage is, so one authored composition stays
 * pixel-identical at every viewport in its band — which is what lets the
 * editor be WYSIWYG. Author against the world, never against the viewport.
 *
 * Notes on the fields that aren't obvious:
 *   • `scale` is ABSOLUTE, not a multiplier on the sprite's registry scale —
 *     it goes straight to PixelSprite's `scale` prop (and multiplies `w`/`h`
 *     for a static image). "5.4" in the editor is 5.4 on screen, which is the
 *     only version that stays intuitive while dragging.
 *   • `z` is the paint order, i.e. the overlap control.
 *   • `hidden` drops an item from one layout only (mobile runs a shorter belt
 *     than desktop, for instance) without deleting it from the other.
 *
 * Because this file is machine-written by the /master/scene save path, keep
 * durable commentary here rather than in data/scene-capabilities.ts — a save
 * rewrites that file as `header + JSON.stringify` and any comments in it die.
 */
export interface SceneItemBase {
  /** Stable key: React key in the renderer, row identity in the editor. */
  id: string;
  /** Editor-only display name; falls back to the sprite/component name. */
  label?: string;
  x: number;
  y: number;
  /** Absolute on-screen scale (see note above). */
  scale: number;
  /** Paint order — higher sits on top. */
  z: number;
  /** Mirror horizontally (PixelSprite's own `flip`). */
  flip?: boolean;
  /** Present but not rendered in this layout. */
  hidden?: boolean;
}

/** A leaf of SPRITE_CONTROL, addressed by dotted path ("assembler.fac2"). */
export interface SceneSpriteItem extends SceneItemBase {
  kind: "sprite";
  sprite: string;
  /** Override the registry's own frame timing. */
  frameMs?: number;
  bob?: boolean;
}

/**
 * A composed component (TransporterBelt, Turbine1Cycle, …) rather than a bare
 * strip — these carry their own internal animation/phase logic and can't be
 * expressed as a single sprite. `component` must name an entry in the
 * whitelist in lib/scene.ts; this data must never be able to reach an
 * arbitrary component.
 */
export interface SceneComponentItem extends SceneItemBase {
  kind: "component";
  component: string;
  props?: Record<string, number | boolean>;
}

export type SceneItem = SceneSpriteItem | SceneComponentItem;

export interface SceneLayout {
  /** Design-space box the coordinates were authored against. */
  world: { w: number; h: number };
  items: SceneItem[];
}

/** Which form factor a layout is authored for. */
export type SceneLayoutId = "desktop" | "mobile";

export type Scene = Record<SceneLayoutId, SceneLayout>;
