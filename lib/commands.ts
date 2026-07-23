import type { SectionId } from "@/types";
import { profile } from "@/data/profile";
import { featuredProjects } from "@/data/projects";
import { socials } from "@/data/socials";

export interface CommandContext {
  scrollTo: (id: SectionId) => void;
  openUrl: (url: string) => void;
  print: (lines: string[]) => void;
  clear: () => void;
}

export interface TerminalCommand {
  name: string;
  aliases?: string[];
  description: string;
  hidden?: boolean;
  run: (ctx: CommandContext) => void;
}

const github = socials.find((s) => s.label === "GitHub")!.href;
const linkedin = socials.find((s) => s.label === "LinkedIn")!.href;

export function buildCommands(): TerminalCommand[] {
  const commands: TerminalCommand[] = [
    {
      name: "help",
      aliases: ["?"],
      description: "List every available command",
      run: (ctx) => {
        ctx.print([
          "Available commands:",
          ...commands
            .filter((c) => !c.hidden)
            .map((c) => `  ${c.name.padEnd(10)} ${c.description}`),
        ]);
      },
    },
    {
      name: "about",
      aliases: ["whoami"],
      description: "Who is Anandha?",
      run: (ctx) =>
        ctx.print([
          `${profile.name} — ${profile.title}`,
          "",
          profile.summary,
        ]),
    },
    {
      name: "projects",
      aliases: ["work"],
      description: "Jump to the project ecosystem",
      run: (ctx) => {
        ctx.print([
          "Featured modules:",
          ...featuredProjects.map((p) => `  • ${p.name} — ${p.tagline}`),
          "",
          "→ scrolling to ecosystem…",
        ]);
        ctx.scrollTo("ecosystem");
      },
    },
    {
      name: "skills",
      description: "Jump to the capability network",
      run: (ctx) => {
        ctx.print(["→ scrolling to capabilities…"]);
        ctx.scrollTo("capabilities");
      },
    },
    {
      name: "github",
      aliases: ["gh"],
      description: "Open GitHub profile",
      run: (ctx) => {
        ctx.print([`→ opening ${github}`]);
        ctx.openUrl(github);
      },
    },
    {
      name: "linkedin",
      aliases: ["li"],
      description: "Open LinkedIn profile",
      run: (ctx) => {
        ctx.print([`→ opening ${linkedin}`]);
        ctx.openUrl(linkedin);
      },
    },
    {
      name: "contact",
      aliases: ["email", "hire"],
      description: "Compose an email",
      run: (ctx) => {
        ctx.print([`→ opening mail to ${profile.email}`]);
        ctx.openUrl(`mailto:${profile.email}`);
      },
    },
    {
      name: "clear",
      aliases: ["cls"],
      description: "Clear the terminal",
      run: (ctx) => ctx.clear(),
    },
  ];
  return commands;
}

export function resolveCommand(
  input: string,
  commands: TerminalCommand[]
): TerminalCommand | null {
  const key = input.trim().toLowerCase().split(/\s+/)[0];
  return (
    commands.find(
      (c) => c.name === key || c.aliases?.includes(key)
    ) ?? null
  );
}
