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

export interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

export interface Profile {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  currentFocus: string;
  availability: "open" | "selective" | "closed";
  availabilityLabel: string;
  summary: string;
  stats: Stat[];
}

export type SkillCategoryId =
  | "frontend"
  | "backend"
  | "databases"
  | "devops"
  | "web3"
  | "agentic-ai";

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
  /** Override island art (e.g. a map asset). Defaults to the island sprite. */
  art?: string;
  /** Art shown only while the ship is docked here (e.g. the map's sea form). */
  artActive?: string;
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
  // Screenshots for the treasure-book preview panel
  // (components/project-ecosystem/project-preview-panel.tsx). Drop files under
  // public/projects/<id>/ and reference them here — renders a placeholder
  // card until populated.
  previewImages?: string[];
}

export interface Social {
  label: string;
  handle: string;
  href: string;
  icon: string;
}
