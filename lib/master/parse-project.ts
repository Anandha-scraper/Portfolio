import type { Project } from "@/types";

/**
 * parse-project — heuristic mapper from freeform pasted project notes to a
 * Project-shaped draft for the /master console's Paste-import tab. No LLM
 * call: URLs become links, "stack:"-style lines become the stack, bullet
 * lines become highlights, a 4-digit year is picked up, and the first
 * sentence seeds tagline/overview. Everything lands in the form for review
 * before saving — this only has to be roughly right.
 */

export type ProjectDraft = Partial<Project> & Pick<Project, "id" | "name">;

const KNOWN_CATEGORIES: Project["category"][] = ["web3", "platform", "enterprise", "data"];
const KNOWN_STATUSES: Project["status"][] = ["shipped", "finalist", "internal", "live"];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "new-project";

export function parseProjectDraft(text: string): ProjectDraft {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const draft: ProjectDraft = { id: "new-project", name: "New Project" };
  const highlights: string[] = [];
  const prose: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // links
    const urls = line.match(/https?:\/\/\S+/g);
    if (urls) {
      for (const url of urls) {
        draft.links = draft.links ?? {};
        if (/github\.com/i.test(url)) draft.links.github = url.replace(/[).,]+$/, "");
        else draft.links.live = draft.links.live ?? url.replace(/[).,]+$/, "");
      }
      if (/^https?:\/\/\S+$/.test(line)) continue; // pure-URL line consumed
    }

    // labelled fields ("stack: …", "tech: …", "name: …", …)
    const labelled = line.match(/^([a-z ]{2,16}):\s*(.+)$/i);
    if (labelled) {
      const key = labelled[1].trim().toLowerCase();
      const value = labelled[2].trim();
      if (["stack", "tech", "tech stack", "technologies", "built with"].includes(key)) {
        draft.stack = value.split(/[,/·|]+/).map((s) => s.trim()).filter(Boolean);
        continue;
      }
      if (["name", "title", "project"].includes(key)) {
        draft.name = value;
        draft.id = slugify(value);
        continue;
      }
      if (key === "year") {
        draft.year = value;
        continue;
      }
      if (key === "status" && KNOWN_STATUSES.includes(value.toLowerCase() as Project["status"])) {
        draft.status = value.toLowerCase() as Project["status"];
        continue;
      }
      if (key === "category" && KNOWN_CATEGORIES.includes(value.toLowerCase() as Project["category"])) {
        draft.category = value.toLowerCase() as Project["category"];
        continue;
      }
      if (["tagline", "subtitle"].includes(key)) {
        draft.tagline = value;
        continue;
      }
    }

    // bullets → highlights
    if (/^[-*•>]\s+/.test(line)) {
      highlights.push(line.replace(/^[-*•>]\s+/, ""));
      continue;
    }

    // loose keyword sniffing on prose lines
    if (!draft.year) {
      const year = lower.match(/\b(20[12]\d)\b/);
      if (year) draft.year = year[1];
    }
    if (!draft.status) {
      const status = KNOWN_STATUSES.find((s) => lower.includes(s));
      if (status) draft.status = status;
    }
    if (!draft.category) {
      if (/(blockchain|smart contract|ethereum|ipfs|web3)/.test(lower)) draft.category = "web3";
      else if (/(dashboard|analytics|dataset|visualiz)/.test(lower)) draft.category = "data";
      else if (/(enterprise|internal|crm|industrial)/.test(lower)) draft.category = "enterprise";
    }

    prose.push(line);
  }

  if (highlights.length) draft.highlights = highlights;

  // First prose line: name if still unset and it's short, else prose body.
  if (draft.name === "New Project" && prose.length && prose[0].length <= 48 && !/[.!?]$/.test(prose[0])) {
    draft.name = prose[0];
    draft.id = slugify(prose[0]);
    prose.shift();
  }

  const body = prose.join(" ");
  if (body) {
    draft.overview = body;
    if (!draft.tagline) {
      const firstSentence = body.match(/^[^.!?]{8,80}(?=[.!?])/);
      if (firstSentence) draft.tagline = firstSentence[0].trim();
    }
  }

  return draft;
}

/** Prompt template for the alternative path: paste the notes to Claude Code
 *  and let it edit data/projects.ts directly. */
export function buildClaudePrompt(rawNotes: string): string {
  return `Add a new project to data/projects.ts in my portfolio repo. The file exports \`projects: Project[]\` (interface in types/index.ts):

interface Project {
  id: string;            // kebab-case slug
  name: string;
  tagline: string;
  category: "web3" | "platform" | "enterprise" | "data";
  status: "shipped" | "finalist" | "internal" | "live";
  year: string;
  overview: string;      // 1–3 sentences
  highlights: string[];  // 3–4 bullets
  stack: string[];
  metrics: { label: string; value: number; suffix?: string; prefix?: string }[];
  accent: "blue" | "indigo" | "violet" | "coral" | "emerald";
  links: { github?: string; live?: string };
  related: string[];     // ids of related existing projects
  featured: boolean;
  previewImages?: string[]; // ["/projects/<id>/01.png", …]
}

Also create public/projects/<id>/ and remind me to drop screenshots there. Keep the dungeon sector count in mind: lib/dungeon-sectors.ts maps sectors A–H to project ids, so if this replaces or exceeds 8 projects, update SECTOR_PROJECT_MAP accordingly.

Here are the project details:

${rawNotes}`;
}
