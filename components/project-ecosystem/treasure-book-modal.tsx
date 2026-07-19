"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { ProjectPreviewPanel } from "@/components/project-ecosystem/project-preview-panel";
import { ACCENTS } from "@/lib/accents";
import { projects } from "@/data/projects";
import { SECTOR_PROJECT_MAP } from "@/lib/dungeon-sectors";
import { cn } from "@/lib/utils";

/**
 * TreasureBookModal — opens when a dungeon sector's treasure marker is
 * clicked (see dungeon-treasures.tsx / dungeon-map.tsx). `sector` resolves
 * to a real Project (SECTOR_PROJECT_MAP, lib/dungeon-sectors.ts), rendered
 * inside a DungeonFrame as two panes: the screenshot carousel
 * (ProjectPreviewPanel) beside a scrollable details pane. Stacks vertically
 * below `lg`.
 */

export function TreasureBookModal({ sector, onClose }: { sector: string | null; onClose: () => void }) {
  const project = useMemo(() => {
    if (!sector) return null;
    const id = SECTOR_PROJECT_MAP[sector];
    return projects.find((p) => p.id === id) ?? null;
  }, [sector]);

  useEffect(() => {
    if (!sector) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sector, onClose]);

  const accent = project ? ACCENTS[project.accent] : null;

  return (
    <AnimatePresence>
      {sector && project && accent && (
        <motion.div
          className="absolute inset-0 z-[90] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="relative w-full max-w-2xl lg:max-w-4xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-ops-line bg-ops-base text-ops-sand-soft transition-colors hover:text-ops-rust"
              aria-label="Close project details"
            >
              ✕
            </button>

            <DungeonFrame wall={22} className="w-full">
              <div className="flex max-h-[78vh] flex-col gap-4 overflow-y-auto p-3 sm:p-4 lg:max-h-[72vh] lg:flex-row lg:gap-6">
                {/* Screenshot pane */}
                <div className="lg:sticky lg:top-0 lg:self-start lg:pt-1">
                  <ProjectPreviewPanel project={project} />
                </div>

                {/* Details pane */}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
