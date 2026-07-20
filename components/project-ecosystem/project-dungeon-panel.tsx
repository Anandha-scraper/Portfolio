"use client";

import { AnimatePresence, motion } from "motion/react";
import { ProjectPreviewPanel } from "@/components/project-ecosystem/project-preview-panel";
import { ACCENTS } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * ProjectDungeonPanel — the project's full details, filling the Project
 * Dungeon frame itself (dungeon-map.tsx) rather than a side panel or popup.
 * It's what's shown whenever the dungeon isn't walking (Playground): by
 * default cycling through every project (the auto-advancing slideshow), or
 * pinned to whichever project the hero just opened by walking to its
 * treasure. One dungeon, one frame — this is one of its two screens, the
 * other being the map.
 */
export function ProjectDungeonPanel({ project }: { project: Project | null }) {
  const accent = project ? ACCENTS[project.accent] : null;

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-ops-base">
      <AnimatePresence mode="wait">
        {project && accent && (
          <motion.div
            key={project.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex min-h-full flex-col gap-4 p-3 pt-16 sm:p-5 sm:pt-16 lg:flex-row lg:gap-8 lg:p-6 lg:pt-16"
          >
            <div className="lg:sticky lg:top-16 lg:self-start">
              <ProjectPreviewPanel project={project} />
            </div>

            <div className="min-w-0 flex-1 text-ops-sand-soft">
              <header className="mb-3">
                <h3 className={cn("text-lg font-bold sm:text-xl", accent.text)}>
                  {project.name}
                </h3>
                <p className="mt-0.5 text-sm opacity-80">{project.tagline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-wider">
                  <span className={cn("rounded-sm border px-2 py-0.5", accent.border, accent.text)}>
                    {project.status}
                  </span>
                  <span className="rounded-sm border border-ops-line px-2 py-0.5 opacity-80">
                    {project.year}
                  </span>
                  <span className="rounded-sm border border-ops-line px-2 py-0.5 opacity-80">
                    {project.category}
                  </span>
                </div>
              </header>

              <p className="text-sm leading-relaxed opacity-90">{project.overview}</p>

              <h4 className="mb-1.5 mt-4 text-[0.7rem] font-semibold uppercase tracking-widest opacity-70">
                Highlights
              </h4>
              <ul className="space-y-1.5 text-sm">
                {project.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} />
                    <span className="opacity-90">{h}</span>
                  </li>
                ))}
              </ul>

              <h4 className="mb-1.5 mt-4 text-[0.7rem] font-semibold uppercase tracking-widest opacity-70">
                Tech Stack
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "rounded-sm border px-2 py-0.5 text-xs",
                      accent.border,
                      accent.bgSoft,
                      accent.text,
                    )}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {project.metrics.length > 0 && (
                <>
                  <h4 className="mb-1.5 mt-4 text-[0.7rem] font-semibold uppercase tracking-widest opacity-70">
                    Metrics
                  </h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {project.metrics.map((m) => (
                      <div key={m.label}>
                        <div className={cn("text-base font-bold", accent.text)}>
                          {m.prefix ?? ""}
                          {m.value}
                          {m.suffix ?? ""}
                        </div>
                        <div className="text-[0.65rem] uppercase tracking-wider opacity-70">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(project.links.github || project.links.live) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.links.github && (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-sm border border-ops-line bg-ops-base px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-ops-rust"
                    >
                      GitHub ↗
                    </a>
                  )}
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                        accent.border,
                        accent.bgSoft,
                        accent.text,
                      )}
                    >
                      Live Site ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
