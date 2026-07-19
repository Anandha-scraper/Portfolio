"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { PolarArea } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

interface TechRadialChartProps {
  category: SkillCategory;
  className?: string;
}

// Distinct vivid palette — one colour per wedge slot.
const RING_PALETTE = [
  "#61dafb", "#38bdf8", "#a78bfa", "#34d399",
  "#fb923c", "#f472b6", "#facc15", "#4ade80",
  "#f87171", "#818cf8",
];

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// ── Main component ────────────────────────────────────────────────────────────
export function TechRadialChart({ category, className }: TechRadialChartProps) {
  const skills = [...category.skills].sort((a, b) => b.level - a.level);
  const colors = skills.map((_, i) => RING_PALETTE[i % RING_PALETTE.length]);

  const data = {
    labels: skills.map((s) => s.name),
    datasets: [
      {
        data: skills.map((s) => s.level),
        backgroundColor: colors.map((c) => alpha(c, 0.45)),
        borderColor: colors,
        borderWidth: 1.5,
      },
    ],
  };

  return (
    <div
      className={cn("flex flex-col items-center", className)}
      // ─── KEY FIX: stop mousedown here so it never reaches document's
      // outside-click handler in chest-sidebar.tsx (which fires on mousedown,
      // not click — so e.stopPropagation on onClick alone does nothing).
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative min-h-[220px] max-h-[320px] w-full flex-1">
        <PolarArea
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
              r: {
                pointLabels: {
                  display: true,
                  centerPointLabels: true,
                  color: "#ddd0b0",
                  font: {
                    family: "var(--font-pixel-readable, monospace)",
                    size: 9,
                  },
                },
                ticks: { display: false, backdropColor: "transparent" },
                grid: { color: "rgba(163, 177, 138, 0.18)" },
                angleLines: { color: "rgba(163, 177, 138, 0.18)" },
                suggestedMin: 0,
                suggestedMax: 100,
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#1a1610f0",
                titleColor: "#ddd0b0",
                bodyColor: "#a99f82",
                borderWidth: 1,
                borderColor: "rgba(163, 177, 138, 0.32)",
                titleFont: { family: "var(--font-pixel-readable, monospace)" },
                bodyFont: { family: "var(--font-pixel-readable, monospace)" },
                callbacks: {
                  label: (item: TooltipItem<"polarArea">) => {
                    const skill = skills[item.dataIndex];
                    const lines = [`${skill.level}% proficiency`];
                    if (skill.note) lines.push(skill.note);
                    return lines;
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
