"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * SkillChart — a single reusable "barrel bars" chart ported from chart.txt.
 *
 * chart.txt shipped two clusters toggled across three states (yesterday / today /
 * tomorrow) via a KPop-themed button bar. Here we keep only ONE cluster
 * (`skill-info1`) and drive it parametrically off a 0–100 `value`: geometry is a
 * linear morph between the file's `yesterday` (≈empty) and `tomorrow` (≈full)
 * path states, and value changes are animated over time with chart.txt's
 * easeInOutSine easing (via rAF, matching the repo's direct-DOM animation idiom).
 * Restyled to the desert-ops theme (accent stroke/fill + pixel fonts); the neon
 * palette, avatars and toggle buttons from chart.txt are dropped.
 */

// The `skill-info1` cluster from chart.txt: each morphing path's near-empty
// (value 0) and full (value 100) `d`. `bottom` is the static base plate.
const BOTTOM_D = "M46.53 90.16H24.17l-4.76 8.66C9.28 97.93 2 94.31 2 90.16";

const MORPH_PATHS: { empty: string; full: string }[] = [
  // bar1
  { empty: "M2 84.76v5.4", full: "M2 39.26v50.9" },
  // bar2
  { empty: "M19.41 93.42v5.4", full: "M19.41 47.92v50.9" },
  // bar3
  { empty: "M24.17 84.76v5.4", full: "M24.17 39.26v50.9" },
  // bar4
  { empty: "M46.34 84.76v5.41", full: "M46.34 39.26v50.91" },
  // top cap (barrel lid)
  {
    empty:
      "M24.17 84.76h22.17c0-4.87-10-8.87-22.17-8.87S2 79.89 2 84.76c0 4.15 7.28 7.77 17.41 8.66z",
    full: "M24.17 39.26h22.17c0-4.86-10-8.87-22.17-8.87S2 34.4 2 39.26c0 4.15 7.28 7.74 17.41 8.66z",
  },
];

const DURATION = 360;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

type Token = { cmd: true; v: string } | { cmd: false; v: number };

const tokenize = (s: string): Token[] =>
  Array.from(s.matchAll(/([AaCcHhLlMmQqSsTtVvZz])|([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/g)).map((m) =>
    m[1] ? { cmd: true as const, v: m[1] } : { cmd: false as const, v: parseFloat(m[2]) }
  );

/**
 * Build a linear path interpolator between two structurally identical paths.
 * Returns `(t) => d`. If the two paths don't share structure it falls back to
 * snapping to `d1`.
 */
const makePathLerp = (d0: string, d1: string): ((t: number) => string) => {
  const a = tokenize(d0);
  const b = tokenize(d1);
  const compatible =
    a.length === b.length &&
    a.every((tok, i) => tok.cmd === b[i].cmd && (!tok.cmd || tok.v === (b[i] as { v: string }).v));

  if (!compatible) return () => d1;

  const plan = a.map((tok, i) =>
    tok.cmd ? tok.v : { from: tok.v, to: (b[i] as { cmd: false; v: number }).v }
  );

  return (t: number) => {
    let out = "";
    for (const item of plan) {
      if (typeof item === "string") {
        if (out && out[out.length - 1] !== " ") out += " ";
        out += item;
      } else {
        const v = item.from + (item.to - item.from) * t;
        out += (out ? " " : "") + v;
      }
    }
    return out;
  };
};

export interface SkillChartProps {
  /** 0–100 completion the bars morph toward. */
  value: number;
  /** Skill name shown under the chart. */
  label: string;
  /** Optional secondary line (e.g. a note). */
  sublabel?: string;
  /** Accent colour (hex) for stroke / fill. */
  accentHex: string;
  className?: string;
}

export function SkillChart({ value, label, sublabel, accentHex, className }: SkillChartProps) {
  const reduce = useReducedMotion();
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  // Currently-displayed morph position (0–1), animated toward value/100.
  const currentRef = useRef(0);

  const lerps = useMemo(() => MORPH_PATHS.map((p) => makePathLerp(p.empty, p.full)), []);

  const paint = (t: number) => {
    for (let i = 0; i < lerps.length; i++) {
      pathRefs.current[i]?.setAttribute("d", lerps[i](t));
    }
  };

  useEffect(() => {
    const target = Math.max(0, Math.min(1, value / 100));
    const from = currentRef.current;

    if (reduce || from === target) {
      currentRef.current = target;
      paint(target);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = easeInOutSine(p);
      const t = from + (target - from) * eased;
      currentRef.current = t;
      paint(t);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Re-run whenever the target value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        aria-hidden
        viewBox="-2 26 52 76"
        fill={accentHex}
        fillOpacity={0.14}
        stroke={accentHex}
        strokeWidth={0.6}
        strokeMiterlimit={10}
        className="h-28 w-auto drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]"
        style={{ filter: `drop-shadow(0 0 5px ${accentHex}55)` }}
      >
        <path d={BOTTOM_D} fill="none" />
        {MORPH_PATHS.map((p, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={p.empty}
          />
        ))}
      </svg>

      <div className="mt-2 flex flex-col items-center gap-0.5 text-center">
        <span className="font-pixel text-[0.55rem] uppercase tracking-wide" style={{ color: accentHex }}>
          {label}
        </span>
        <span className="font-pixel text-[0.7rem]" style={{ color: accentHex }}>
          {Math.round(value)}%
        </span>
        {sublabel && (
          <span className="font-pixel-readable text-[0.85rem] italic leading-none text-[#6a5638]">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default SkillChart;
