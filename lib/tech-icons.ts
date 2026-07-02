/**
 * tech-icons — maps a free-form stack string (e.g. "React 19", "Next.js 14",
 * "Tailwind CSS") to one of the pixel-art glyph PNGs extracted from
 * feed/techicon.png into /public/sprites/tech-icons (see feed/extract_tech_icons.py).
 *
 * Git, VS Code, Prettier and ESLint were intentionally excluded from the sheet,
 * so they (and anything else without art — Solidity, IPFS, Zod, …) resolve to
 * `null`, and the caller falls back to a plain text badge.
 */

/** Every slug that has a /sprites/tech-icons/<slug>.png file. */
export const TECH_ICON_SLUGS = [
  "javascript", "html", "css", "tailwind", "react", "mongodb", "express", "nodejs",
  "python", "firebase", "github", "vercel", "onrender", "docker", "kubernetes", "postgresql",
  "mysql", "redis", "supabase", "graphql", "typescript", "nextjs", "vite", "sass",
  "figma", "postman", "netlify", "cloudflare",
] as const;

export type TechIconSlug = (typeof TECH_ICON_SLUGS)[number];

const SLUG_SET = new Set<string>(TECH_ICON_SLUGS);

/** Normalised stack-string → slug for names that don't match after normalising. */
const ALIASES: Record<string, TechIconSlug> = {
  tailwindcss: "tailwind",
  node: "nodejs",
  nodejs: "nodejs",
  next: "nextjs",
  nextjs: "nextjs",
  postgres: "postgresql",
  postgre: "postgresql",
  psql: "postgresql",
  js: "javascript",
  ts: "typescript",
  githubactions: "github",
  scss: "sass",
};

/** Lowercase, strip non-alphanumerics, then drop a trailing version number
 *  ("React 19" → "react", "Next.js 14" → "nextjs", "Node.js" → "nodejs"). */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/\d+$/, "");
}

/** Public path to the glyph for a stack string, or `null` if none exists. */
export function techIconSrc(name: string): string | null {
  const key = normalize(name);
  const slug = SLUG_SET.has(key) ? (key as TechIconSlug) : ALIASES[key];
  return slug ? `/sprites/tech-icons/${slug}.png` : null;
}
