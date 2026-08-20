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

export type ProjectStatus = "shipped" | "finalist" | "internal" | "live";

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
