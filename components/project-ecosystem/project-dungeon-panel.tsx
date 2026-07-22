"use client";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Master } from "@/components/project-ecosystem/master";
import { ACCENTS } from "@/lib/accents";
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
 * Deliberately minimal: the outer frame directly contains only <Master />,
 * which owns rendering the book (carries every detail, name through
 * metrics, as its own page content) and the screenshot previewer, and is
 * the sole place their margin/gap/width/height are set — see
 * components/project-ecosystem/master.tsx. No separate identity header,
 * bordered panel, or spine — those all got folded into or removed in favor
 * of the book itself. The top transport bar (DungeonSlideshowControls) is a
 * sibling in dungeon-map.tsx, not part of this component, and is
 * unaffected by any of this.
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
    <div className="dungeon-panel__root">
      <AnimatePresence>
        {project && accent && (
          <motion.div
            key={project.id}
            {...pageTransition}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ perspective: 1600, transformStyle: "preserve-3d" }}
            className="dungeon-panel__page"
          >
            {project.updating ? (
              <div className="dungeon-panel__updating-wrap">
                <div
                  className="dungeon-panel__updating-card"
                  style={{ "--accent": accent.hex } as CSSProperties}
                >
                  <h3 className="dungeon-panel__updating-title">{project.name}</h3>
                  <span className="dungeon-panel__updating-badge">Ongoing</span>
                  <p className="dungeon-panel__updating-desc">
                    This treasure is being reworked. Check back soon.
                  </p>
                </div>
              </div>
            ) : (
              <Master project={project} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
