/**
 * Static accent class maps. Tailwind can only see fully-spelled class names,
 * so every accent variant is enumerated here rather than built dynamically.
 */
export type Accent = "blue" | "indigo" | "violet" | "coral" | "emerald";

interface AccentClasses {
  text: string;
  bgSoft: string;
  bgSolid: string;
  border: string;
  ring: string;
  dot: string;
  gradient: string; // tailwind gradient stops
  glow: string; // rgba for spotlight
  hex: string;
}

export const ACCENTS: Record<Accent, AccentClasses> = {
  blue: {
    text: "text-blue",
    bgSoft: "bg-blue/10",
    bgSolid: "bg-blue",
    border: "border-blue/30",
    ring: "ring-blue/30",
    dot: "bg-blue",
    gradient: "from-blue to-indigo",
    glow: "rgba(217,164,65,0.16)",
    hex: "#d9a441",
  },
  indigo: {
    text: "text-indigo",
    bgSoft: "bg-indigo/10",
    bgSolid: "bg-indigo",
    border: "border-indigo/30",
    ring: "ring-indigo/30",
    dot: "bg-indigo",
    gradient: "from-indigo to-violet",
    glow: "rgba(125,140,106,0.16)",
    hex: "#7d8c6a",
  },
  violet: {
    text: "text-violet",
    bgSoft: "bg-violet/10",
    bgSolid: "bg-violet",
    border: "border-violet/30",
    ring: "ring-violet/30",
    dot: "bg-violet",
    gradient: "from-violet to-pink",
    glow: "rgba(194,112,63,0.16)",
    hex: "#c2703f",
  },
  coral: {
    text: "text-coral",
    bgSoft: "bg-coral/10",
    bgSolid: "bg-coral",
    border: "border-coral/30",
    ring: "ring-coral/30",
    dot: "bg-coral",
    gradient: "from-coral to-pink",
    glow: "rgba(226,88,34,0.16)",
    hex: "#e25822",
  },
  emerald: {
    text: "text-emerald",
    bgSoft: "bg-emerald/10",
    bgSolid: "bg-emerald",
    border: "border-emerald/30",
    ring: "ring-emerald/30",
    dot: "bg-emerald",
    gradient: "from-emerald to-blue",
    glow: "rgba(163,177,138,0.16)",
    hex: "#a3b18a",
  },
};
