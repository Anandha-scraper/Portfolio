/**
 * master-serializers — turn the /master console's JSON payloads back into the
 * typed data files (data/skills.ts, data/projects.ts). JSON is valid TS, so
 * each file is a fixed header + `export const … = <formatted JSON>`.
 *
 * Trade-off (surfaced in the /master UI): inline per-entry comments in the
 * data files are lost on the first save through this path.
 */

const SKILLS_HEADER = `import type { SkillCategory } from "@/types";

/**
 * Honest proficiency mapping drawn from the resume. Levels are deliberately
 * truthful — "learning"/"partial" items are scored lower and annotated.
 *
 * Maintained via the dev-only /master console (npm run master) — edits are
 * serialized by scripts/master-serializers.mjs.
 */
`;

const PROJECTS_HEADER = `import type { Project } from "@/types";

/**
 * Project entries for the dungeon ecosystem. Screenshots live under
 * public/projects/<id>/ and are listed in each entry's \`previewImages\`.
 *
 * Maintained via the dev-only /master console (npm run master) — edits are
 * serialized by scripts/master-serializers.mjs.
 */
`;

const SCENE_HEADER = `import type { Scene } from "@/types";

/**
 * Capability Network scene placement. See the Scene* types in types/index.ts
 * for what the fields mean and why coordinates are world-space.
 *
 * Maintained via the dev-only /master/scene editor (npm run master) — edits
 * are serialized by scripts/master-serializers.mjs, which rewrites this whole
 * file, so comments added here will not survive a save.
 */
`;

export function serializeSkills(categories) {
  return (
    SKILLS_HEADER +
    `export const skillCategories: SkillCategory[] = ` +
    JSON.stringify(categories, null, 2) +
    `;\n`
  );
}

export function serializeProjects(projects) {
  return (
    PROJECTS_HEADER +
    `export const projects: Project[] = ` +
    JSON.stringify(projects, null, 2) +
    `;\n\n` +
    `export const featuredProjects = projects.filter((p) => p.featured);\n`
  );
}

export function serializeScene(scene) {
  return (
    SCENE_HEADER +
    `export const capabilityScene: Scene = ` +
    JSON.stringify(scene, null, 2) +
    `;\n`
  );
}

/**
 * Component names the scene data is allowed to reference. Mirrors
 * SCENE_COMPONENTS in lib/scene.ts — the sidecar can't import the TS module,
 * so this list has to be kept in step with it by hand. Anything not listed
 * here is rejected rather than written, so a typo surfaces as a red banner
 * instead of an item that silently vanishes from the scene.
 */
const SCENE_COMPONENT_NAMES = new Set([
  "TransporterBelt",
  "Turbine1Cycle",
  "Turbine2Cycle",
  "RamboCycle",
  "LightningBolt",
  "ReactorCycle",
  "BasicFurnaceCycle",
  "AdvancedFurnaceCycle",
]);

const LAYOUT_IDS = ["desktop", "mobile"];

export function validateScene(scene) {
  if (typeof scene !== "object" || scene === null) return "scene payload must be an object";
  for (const layoutId of LAYOUT_IDS) {
    const layout = scene[layoutId];
    if (typeof layout !== "object" || layout === null) return `scene: missing "${layoutId}" layout`;
    const world = layout.world;
    if (typeof world?.w !== "number" || typeof world?.h !== "number" || world.w <= 0 || world.h <= 0) {
      return `${layoutId}: world must have positive w + h`;
    }
    if (!Array.isArray(layout.items)) return `${layoutId}: items must be an array`;

    const ids = new Set();
    for (const item of layout.items) {
      if (typeof item?.id !== "string" || !item.id) return `${layoutId}: every item needs an id`;
      if (ids.has(item.id)) return `${layoutId}: duplicate item id: ${item.id}`;
      ids.add(item.id);
      for (const key of ["x", "y", "z"]) {
        if (!Number.isFinite(item[key])) return `${layoutId}/${item.id}: ${key} must be a finite number`;
      }
      if (!Number.isFinite(item.scale) || item.scale <= 0) {
        return `${layoutId}/${item.id}: scale must be a positive number`;
      }
      if (item.kind === "sprite") {
        if (typeof item.sprite !== "string" || !item.sprite) return `${layoutId}/${item.id}: needs a sprite path`;
      } else if (item.kind === "component") {
        if (!SCENE_COMPONENT_NAMES.has(item.component)) {
          return `${layoutId}/${item.id}: unknown component "${item.component}"`;
        }
      } else {
        return `${layoutId}/${item.id}: kind must be "sprite" or "component"`;
      }
    }
  }
  return null;
}

/** Minimal shape validation so a buggy client can't clobber a data file. */
export function validateSkills(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return "skills payload must be a non-empty array";
  for (const c of categories) {
    if (typeof c?.id !== "string" || typeof c?.label !== "string") return "every category needs id + label";
    if (!Array.isArray(c.skills)) return `category ${c.id}: skills must be an array`;
    for (const s of c.skills) {
      if (typeof s?.name !== "string") return `category ${c.id}: every skill needs a name`;
      if (typeof s?.level !== "number" || s.level < 0 || s.level > 100) return `skill ${s?.name}: level must be 0–100`;
    }
  }
  return null;
}

export function validateProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) return "projects payload must be a non-empty array";
  const ids = new Set();
  for (const p of projects) {
    if (typeof p?.id !== "string" || !p.id) return "every project needs an id";
    if (ids.has(p.id)) return `duplicate project id: ${p.id}`;
    ids.add(p.id);
    if (typeof p.name !== "string" || !p.name) return `project ${p.id}: needs a name`;
    for (const key of ["highlights", "stack", "metrics", "related"]) {
      if (!Array.isArray(p[key])) return `project ${p.id}: ${key} must be an array`;
    }
    if (typeof p.links !== "object" || p.links === null) return `project ${p.id}: links must be an object`;
    if (typeof p.featured !== "boolean") return `project ${p.id}: featured must be a boolean`;
  }
  return null;
}
