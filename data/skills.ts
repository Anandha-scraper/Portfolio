import type { SkillCategory } from "@/types";

/**
 * Honest proficiency mapping drawn from the resume. Levels are deliberately
 * truthful — "learning"/"partial" items are scored lower and annotated.
 */
export const skillCategories: SkillCategory[] = [
  {
    id: "frontend",
    label: "Frontend",
    icon: "LayoutTemplate",
    accent: "blue",
    blurb: "Performant, responsive interfaces with a product-design sensibility.",
    skills: [
      { name: "React.js", level: 90 },
      { name: "Tailwind CSS", level: 88 },
      { name: "HTML5 / CSS3", level: 92 },
      { name: "Responsive Design", level: 90 },
      { name: "Next.js", level: 70, note: "Actively leveling up" },
      { name: "TypeScript", level: 72, note: "Shipping in TS projects" },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "Server",
    accent: "indigo",
    blurb: "REST APIs, server-side logic, and resilient data pipelines.",
    skills: [
      { name: "Node.js", level: 85 },
      { name: "Express.js", level: 84 },
      { name: "Python (Flask)", level: 78 },
      { name: "RESTful API Design", level: 86 },
      { name: "Server-side Deployments", level: 80 },
    ],
  },
  {
    id: "databases",
    label: "Databases & BaaS",
    icon: "Database",
    accent: "emerald",
    blurb: "Relational and document stores, plus realtime backends-as-a-service.",
    skills: [
      { name: "MongoDB", level: 86 },
      { name: "PostgreSQL", level: 80 },
      { name: "MySQL", level: 78 },
      { name: "Firebase (Firestore / RTDB)", level: 84 },
    ],
  },
  {
    id: "devops",
    label: "DevOps & Cloud",
    icon: "Cloud",
    accent: "violet",
    blurb: "Deployments, hosting, and CI/CD that keep cloud costs lean.",
    skills: [
      { name: "Vercel", level: 86 },
      { name: "Render (Onrender)", level: 82 },
      { name: "Firebase Hosting / Functions", level: 80 },
      { name: "CI/CD Workflows", level: 66, note: "Expanding expertise" },
      { name: "Git / GitHub", level: 90 },
    ],
  },
  {
    id: "agentic-ai",
    label: "Agentic AI",
    icon: "Sparkles",
    accent: "violet",
    // NOTE: drafted defaults — edit levels/notes to match your real experience.
    blurb: "LLM-powered agents: tools, retrieval, and orchestration that actually ship.",
    skills: [
      { name: "Claude / Anthropic API", level: 78 },
      { name: "Tool use & MCP servers", level: 72, note: "Wiring agents to real tools" },
      { name: "RAG & vector search", level: 74 },
      { name: "Agent orchestration", level: 68, note: "Multi-step workflows" },
      { name: "Prompt & eval workflows", level: 70 },
    ],
  },
  {
    id: "system-design",
    label: "System Design & Architecture",
    icon: "Layers",
    accent: "indigo",
    blurb: "Turning messy requirements into maintainable systems that scale without drama.",
    skills: [
      { name: "API design", level: 80 },
      { name: "Architecture patterns", level: 72 },
      { name: "Scalability & performance", level: 64, note: "Designing for growth" },
      { name: "System trade-offs", level: 68 },
    ],
  },
  {
    id: "quality",
    label: "QA & Testing",
    icon: "ShieldCheck",
    accent: "emerald",
    blurb: "Automated coverage and testing discipline that keeps shipped code honest.",
    skills: [
      { name: "Unit testing", level: 70 },
      { name: "Debugging & profiling", level: 74 },
      { name: "E2E testing", level: 62, note: "Playwright / Cypress" },
      { name: "CI test gates", level: 58, note: "Still levelling up" },
    ],
  },
  {
    id: "web3",
    label: "Web3",
    icon: "Boxes",
    accent: "coral",
    blurb: "Smart contracts and decentralized storage for tamper-proof systems.",
    skills: [
      { name: "Ethereum Smart Contracts", level: 64, note: "Hackathon-built" },
      { name: "IPFS", level: 62 },
      { name: "Web3 Protocols", level: 58, note: "Driven by curiosity" },
    ],
  },
];
