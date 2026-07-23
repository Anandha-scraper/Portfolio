/**
 * Accent hex values. Only `.hex` is read anywhere in the codebase (each
 * accent-aware component pulls the raw color for its own styling), so this
 * stays a plain hex map rather than pre-enumerating Tailwind class names
 * nothing consumes.
 */
export type Accent = "blue" | "indigo" | "violet" | "coral" | "emerald";

interface AccentClasses {
  hex: string;
}

export const ACCENTS: Record<Accent, AccentClasses> = {
  blue: { hex: "#d9a441" },
  indigo: { hex: "#7d8c6a" },
  violet: { hex: "#c2703f" },
  coral: { hex: "#e25822" },
  emerald: { hex: "#a3b18a" },
};
