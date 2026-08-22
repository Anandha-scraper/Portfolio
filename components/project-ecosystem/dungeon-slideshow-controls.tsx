"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * DungeonSlideshowControls — top-right pixel-styled transport bar for the
 * Project Dungeon (dungeon-map.tsx). Fixed in the same spot across both
 * screens the dungeon swaps between: the default auto-advancing project
 * view, and the walkable map (Playground). Prev/Next always settle on the
 * resulting project and pause autoplay (the play/pause button flips to its
 * "paused" look). The Playground button is the same control both ways — it
 * opens the map to pick a project, and (once a treasure's project fills the
 * frame again) brings the map back so another can be picked.
 *
 * Each transport button is a stone-carved icon coin with a matching off/lit
 * pair (public/sprites/ui/, extracted by feed/extract_ui_assets.py) — the lit
 * image crossfades in on hover for decorative feedback, and stays lit
 * whenever the button reflects an active mode (playing, playground). The
 * play/pause button is the one exception: its "lit" image is a different
 * icon (pause, not a brighter play), so it's driven purely by playing
 * state, never by hover, to avoid implying the wrong action.
 *
 * GitHub and Live Site lead the bar as carved wooden signs rather than coins —
 * they are destinations, not transport, and the wider art carries its own
 * label. Both are always present: a project with no live URL still shows the
 * sign, dimmed and inert, so the bar keeps a constant width instead of
 * reflowing every time the slideshow advances.
 *
 * The bar publishes its own measured height to its parent as `--controls-h`.
 * It overlaps the detail panel, which has to pad itself clear of it, and that
 * clearance used to be a hardcoded 3.875rem guess that any change to the bar's
 * contents (these signs, for one) would silently invalidate.
 */
export function DungeonSlideshowControls({
  project,
  playing,
  walking,
  onPrev,
  onTogglePlay,
  onNext,
  onPlayground,
}: {
  project?: Project | null;
  playing: boolean;
  walking: boolean;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPlayground: () => void;
}) {
  const showingPlay = walking || !playing;
  const { github, live } = project?.links ?? {};
  const barRef = useRef<HTMLDivElement>(null);

  // Hand the measured bar height to the parent (.dungeon-map__viewport) so the
  // detail panel underneath can pad itself clear of it. A ResizeObserver
  // rather than a constant because the bar is a full-width row on phones and a
  // small floating cluster on laptops, and its contents can change size.
  useEffect(() => {
    const el = barRef.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      host.style.setProperty("--controls-h", `${Math.round(height)}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      host.style.removeProperty("--controls-h");
    };
  }, []);

  return (
    <div ref={barRef} className="slideshow-controls__bar">
      <LinkBanner
        href={github}
        label={`View ${project?.name ?? "this project"} on GitHub`}
        emptyLabel="No public repository for this project"
        src="/sprites/ui/sign_github.webp"
        onClick={() =>
          trackEvent("project_link_click", {
            url: github,
            type: "github",
            project: project?.id,
          })
        }
      />
      <LinkBanner
        href={live}
        label={`Open the live site for ${project?.name ?? "this project"}`}
        emptyLabel="No live site for this project yet"
        src="/sprites/ui/sign_live.webp"
        onClick={() =>
          trackEvent("project_link_click", {
            url: live,
            type: "live",
            project: project?.id,
          })
        }
      />
      <ControlButton
        label="Previous project"
        onClick={onPrev}
        off="/sprites/ui/btn_prev_off.png"
        lit="/sprites/ui/btn_prev_lit.png"
        hoverLit
      />
      <ControlButton
        label={showingPlay ? "Play slideshow" : "Pause slideshow"}
        onClick={onTogglePlay}
        off="/sprites/ui/btn_play_off.png"
        lit="/sprites/ui/btn_pause_lit.png"
        active={!showingPlay}
      />
      <ControlButton
        label="Next project"
        onClick={onNext}
        off="/sprites/ui/btn_next_off.png"
        lit="/sprites/ui/btn_next_lit.png"
        hoverLit
      />
      <ControlButton
        label={walking ? "Back to the project" : "Playground — walk the dungeon yourself"}
        onClick={onPlayground}
        off="/sprites/ui/btn_playground_off.png"
        lit="/sprites/ui/btn_playground_lit.png"
        active={walking}
        hoverLit
      />
    </div>
  );
}

/** GitHub / Live Site — a carved wooden sign, wider than the transport coins
 *  because the art carries its own label. Rendered whether or not the project
 *  has the link: without one it degrades to a dimmed <span>, never an <a>
 *  with no href, so nothing focusable promises a navigation it can't do. */
function LinkBanner({
  href,
  label,
  emptyLabel,
  src,
  onClick,
}: {
  href?: string;
  label: string;
  emptyLabel: string;
  src: string;
  onClick?: () => void;
}) {
  // Deliberately no `pixelated` class, unlike every other sprite here — these
  // two downscale smoothly instead. The class alone wouldn't settle it either
  // way; see the `image-rendering` reset in dungeon-slideshow-controls.css.
  const art = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="slideshow-controls__banner-img" />
  );

  if (!href) {
    return (
      <span
        aria-label={emptyLabel}
        title={emptyLabel}
        className={cn("slideshow-controls__banner", "slideshow-controls__banner--disabled")}
      >
        {art}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="slideshow-controls__banner"
      onClick={onClick}
    >
      {art}
    </a>
  );
}

function ControlButton({
  label,
  onClick,
  off,
  lit,
  active,
  hoverLit,
}: {
  label: string;
  onClick: () => void;
  off: string;
  lit: string;
  /** Stay lit regardless of hover — this button reflects an active mode. */
  active?: boolean;
  /** Crossfade to the lit image on hover (skip for play/pause — its lit
   *  image is a different icon, not a hover highlight). */
  hoverLit?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "slideshow-controls__btn",
        active && "slideshow-controls__btn--active",
        hoverLit && "slideshow-controls__btn--hover-lit"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={off} alt="" className={cn("slideshow-controls__btn-img", "pixelated")} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lit}
        alt=""
        className={cn("slideshow-controls__btn-img", "slideshow-controls__btn-img--lit", "pixelated")}
      />
    </button>
  );
}
