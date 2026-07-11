"use client";

import Image from "next/image";
import {
  RadialBar,
  RadialBarChart,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";

interface TechRadialChartProps {
  category: SkillCategory;
  className?: string;
}

interface SkillEntry {
  name: string;
  level: number;
  note?: string;
  fill: string;
  icon?: string;
}

// Map skill names → icon file in /sprites/tech-icons/
const ICON_MAP: Record<string, string> = {
  "React.js":                      "/sprites/tech-icons/react.png",
  "Tailwind CSS":                   "/sprites/tech-icons/tailwind.png",
  "HTML5 / CSS3":                   "/sprites/tech-icons/html.png",
  "Next.js":                        "/sprites/tech-icons/nextjs.png",
  TypeScript:                       "/sprites/tech-icons/typescript.png",
  "Responsive Design":              "/sprites/tech-icons/css.png",
  "Node.js":                        "/sprites/tech-icons/nodejs.png",
  "Express.js":                     "/sprites/tech-icons/express.png",
  "Python (Flask)":                 "/sprites/tech-icons/python.png",
  "RESTful API Design":             "/sprites/tech-icons/postman.png",
  "Server-side Deployments":        "/sprites/tech-icons/onrender.png",
  MongoDB:                          "/sprites/tech-icons/mongodb.png",
  PostgreSQL:                       "/sprites/tech-icons/postgresql.png",
  MySQL:                            "/sprites/tech-icons/mysql.png",
  "Firebase (Firestore / RTDB)":    "/sprites/tech-icons/firebase.png",
  Vercel:                           "/sprites/tech-icons/vercel.png",
  "Render (Onrender)":              "/sprites/tech-icons/onrender.png",
  "Firebase Hosting / Functions":   "/sprites/tech-icons/firebase.png",
  "CI/CD Workflows":                "/sprites/tech-icons/github.png",
  "Git / GitHub":                   "/sprites/tech-icons/github.png",
};

// Distinct vivid palette — one colour per ring slot.
const RING_PALETTE = [
  "#61dafb", "#38bdf8", "#a78bfa", "#34d399",
  "#fb923c", "#f472b6", "#facc15", "#4ade80",
  "#f87171", "#818cf8",
];

// ── Floating tooltip (shadcn-style) shown on ring hover ──────────────────────
function SkillTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SkillEntry }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="pointer-events-none flex items-center gap-2 rounded border px-2.5 py-1.5 shadow-xl backdrop-blur-md"
      style={{
        borderColor: `${d.fill}88`,
        backgroundColor: `#1a1610f0`,
        boxShadow: `0 0 16px ${d.fill}33`,
      }}
    >
      {d.icon && (
        <Image
          src={d.icon}
          alt={d.name}
          width={20}
          height={20}
          style={{ imageRendering: "pixelated", width: "auto" }}
        />
      )}
      <div className="flex flex-col gap-0.5">
        <span
          className="font-pixel-readable text-[0.68rem] font-bold leading-none"
          style={{ color: d.fill }}
        >
          {d.name}
        </span>
        <span className="font-pixel text-[0.58rem] text-ops-sand-faint">
          {d.level}% proficiency
        </span>
        {d.note && (
          <span className="font-pixel-readable text-[0.52rem] italic text-ops-sand-faint">
            {d.note}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TechRadialChart({ category, className }: TechRadialChartProps) {
  const chartData: SkillEntry[] = [...category.skills]
    .sort((a, b) => b.level - a.level)
    .map((skill, i) => ({
      name: skill.name,
      level: skill.level,
      note: skill.note,
      fill: RING_PALETTE[i % RING_PALETTE.length],
      icon: ICON_MAP[skill.name],
    }));

  const count = chartData.length;
  const outerRadius = 130;
  const innerRadius = Math.max(22, outerRadius - count * 19);

  const iconsToShow = chartData.filter((d) => d.icon);

  return (
    <div
      className={cn("flex flex-col items-center", className)}
      // ─── KEY FIX: stop mousedown here so it never reaches document's
      // outside-click handler in chest-sidebar.tsx (which fires on mousedown,
      // not click — so e.stopPropagation on onClick alone does nothing).
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Radial chart ───────────────────────────────────────────────────── */}
      <ResponsiveContainer
        width="100%"
        style={{ flex: "1 1 0", minHeight: 220, maxHeight: 320 }}
      >
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={-270}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          barSize={15}
          cx="50%"
          cy="50%"
        >
          {/* Floating tooltip — shadcn-style near-cursor popup */}
          <Tooltip
            cursor={false}
            content={<SkillTooltip />}
            wrapperStyle={{ zIndex: 200 }}
          />

          <RadialBar
            dataKey="level"
            background={{ fill: "rgba(255,255,255,0.04)" }}
            // Disable animation so LabelList never hides on island switch.
            isAnimationActive={false}
          >
            {/* Bold black label always inside each ring arc */}
            <LabelList
              dataKey="name"
              position="insideStart"
              style={{
                fill: "#000000",
                fontWeight: "800",
                fontSize: "clamp(6px, 0.95vw, 9px)",
                fontFamily: "var(--font-pixel-readable, monospace)",
                letterSpacing: "0.03em",
                pointerEvents: "none",
              }}
            />
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>

      {/* ── Tech icon gallery — static display, no interactions ─────────── */}
      {iconsToShow.length > 0 && (
        <div className="w-full pb-6 pt-1">
          <div className="flex flex-wrap items-center justify-center gap-2 px-2">
            {iconsToShow.map((d) => (
              <div
                key={d.name}
                className="pointer-events-none flex flex-col items-center gap-0.5"
                aria-label={d.name}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded"
                  style={{
                    backgroundColor: `${d.fill}18`,
                    border: `1px solid ${d.fill}55`,
                    boxShadow: `0 0 4px ${d.fill}22`,
                  }}
                >
                  <Image
                    src={d.icon!}
                    alt={d.name}
                    width={24}
                    height={24}
                    style={{ imageRendering: "pixelated", width: "auto" }}
                  />
                </div>
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: d.fill }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
