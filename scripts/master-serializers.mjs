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
