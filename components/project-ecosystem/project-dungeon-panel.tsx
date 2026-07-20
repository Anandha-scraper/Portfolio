"use client";

import { AnimatePresence, motion } from "motion/react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { ProjectPreviewPanel } from "@/components/project-ecosystem/project-preview-panel";
import { Icon } from "@/components/ui/icon";
import { ACCENTS } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * ProjectDungeonPanel — the project's details, docked beside the dungeon
 * viewport instead of opening as a popup (see dungeon-map.tsx). In slideshow
 * mode a project is always showing, driven by the slideshow index — there's
 * no close affordance. In Playground mode it only appears once the hero
 * opens a treasure, with a close button so exploring can continue.
 */
export function ProjectDungeonPanel({
  project,
  onClose,
}: {
  project: Project | null;
  onClose?: () => void;
}) {
  const accent = project ? ACCENTS[project.accent] : null;

  return (
    <div className="w-full lg:w-[380px] lg:shrink-0">
      <AnimatePresence mode="wait">
        {project && accent && (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative"
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-ops-line bg-ops-base text-ops-sand-soft transition-colors hover:text-ops-rust"
                aria-label="Close project details"
              >
                <Icon name="X" size={14} />
              </button>
            )}

            <DungeonFrame wall={22} className="w-full">
              <div className="flex max-h-[78vh] flex-col gap-4 overflow-y-auto p-3 sm:p-4 lg:max-h-[clamp(520px,82vh,1000px)]">
                <ProjectPreviewPanel project={project} />

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
              </div>
            </DungeonFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
