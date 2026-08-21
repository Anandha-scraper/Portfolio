"use client";
import { useEffect, type CSSProperties } from "react";
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
 * which composes the book (carries every detail, name through metrics, as
 * its own page content) and the screenshot previewer — see
 * components/project-ecosystem/master.tsx. Note that .dungeon-panel__page is
 * the query container those two are laid out against (master.css reads
 * `@container dungeon-panel`), so its width, not the viewport's, decides
 * whether they sit side by side. No separate identity header,
 * bordered panel, or spine — those all got folded into or removed in favor
 * of the book itself. The top transport bar (DungeonSlideshowControls) is a
 * sibling in dungeon-map.tsx, not part of this component, and is
 * unaffected by any of this.
 *
 * `playing`/`onFinished` pass straight through to Master, which drives
 * autoplay by turning the book's pages and reports back when the last one has
 * had its dwell. The one thing this component adds is the placeholder guard
 * below: an `updating` project never mounts Master, so without it autoplay
 * would reach a "being reworked" card and stop forever.
 */

/** How long a placeholder card holds before autoplay moves on. Roughly the
 *  time a one-page book would take, so the rhythm doesn't visibly break. */
const PLACEHOLDER_DWELL_MS = 3000;

export function ProjectDungeonPanel({
  project,
  playing = false,
  onFinished,
}: {
  project: Project | null;
  playing?: boolean;
  onFinished?: () => void;
}) {
  const accent = project ? ACCENTS[project.accent] : null;
  const reduceMotion = useReducedMotion();
  const updating = Boolean(project?.updating);

  // Placeholder dwell. dungeon-map's advanceProject skips `updating` projects,
  // so this is only reachable when someone opens one directly and then hits
  // play — but without it that would be a dead end rather than a pause.
  useEffect(() => {
    if (!playing || !updating || !onFinished) return;
    const id = window.setTimeout(onFinished, PLACEHOLDER_DWELL_MS);
    return () => window.clearTimeout(id);
  }, [playing, updating, onFinished, project?.id]);

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
              <Master project={project} playing={playing} onFinished={onFinished} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
