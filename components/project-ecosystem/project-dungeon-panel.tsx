"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
 *
 * Rendered as an open book: left page for the write-up, right page for the
 * screenshot carousel (ProjectPreviewPanel, untouched — its own prev/next
 * and dots keep working), with a spine divider between them at `lg:`. The
 * project swap does a gentle page-turn (rotateY) instead of a plain fade,
 * skipped for prefers-reduced-motion. The top transport bar
 * (DungeonSlideshowControls) is a sibling in dungeon-map.tsx, not part of
 * this component, and is unaffected by any of this.
 */
export function ProjectDungeonPanel({ project }: { project: Project | null }) {
  const accent = project ? ACCENTS[project.accent] : null;
  const reduceMotion = useReducedMotion();

  const pageTransition = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, rotateY: -6 },
        animate: { opacity: 1, rotateY: 0 },
        exit: { opacity: 0, rotateY: 6 },
      };

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-ops-base">
      <AnimatePresence>
        {project && accent && (
          <motion.div
            key={project.id}
            {...pageTransition}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ perspective: 1600, transformStyle: "preserve-3d" }}
            className="flex min-h-full flex-col p-3 pt-16 sm:p-5 sm:pt-16 lg:p-6 lg:pt-16"
          >
            <div
              className={cn(
                // overflow stays hidden on mobile (stacked pages, no sticky) so the
                // rounded corners clip cleanly; released at lg: so the right page's
                // lg:sticky preview isn't trapped inside a non-scrolling clip box.
                "relative flex min-h-full flex-1 flex-col overflow-hidden rounded-md border bg-gradient-to-b from-ops-surface to-ops-base shadow-lg lg:flex-row lg:overflow-visible",
                accent.border,
              )}
            >
              {project.updating ? (
                <div className="flex min-h-[16rem] flex-1 items-center justify-center p-6">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-md border bg-ops-base px-6 py-5 text-center text-ops-sand-soft shadow-lg",
                      accent.border,
                    )}
                  >
                    <h3 className={cn("text-base font-bold", accent.text)}>{project.name}</h3>
                    <span
                      className={cn(
                        "rounded-sm border px-2.5 py-0.5 text-[0.6rem] uppercase tracking-widest",
                        accent.border,
                        accent.text,
                      )}
                    >
                      Ongoing
                    </span>
                    <p className="max-w-[16rem] text-xs opacity-60">
                      This treasure is being reworked. Check back soon.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Left page — the write-up */}
                  <div className="min-w-0 flex-1 bg-ops-base/40 p-4 text-ops-sand-soft sm:p-5 lg:p-6">
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

                  {/* Spine — the book's fold, desktop only */}
                  <div
                    aria-hidden
                    className={cn(
                      "hidden w-3 shrink-0 lg:block",
                      "bg-gradient-to-r from-black/35 via-black/10 to-black/35",
                    )}
                    style={{ boxShadow: `0 0 16px 2px ${accent.glow}` }}
                  />

                  {/* Right page — the screenshot preview */}
                  <div className="flex justify-center bg-ops-base/40 p-4 sm:p-5 lg:sticky lg:top-16 lg:justify-start lg:self-start lg:p-6">
                    <ProjectPreviewPanel project={project} />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
