"use client";

import { cn } from "@/lib/utils";

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
 * Each button is a stone-carved icon coin with a matching off/lit pair
 * (public/sprites/ui/, extracted by feed/extract_ui_assets.py) — the lit
 * image crossfades in on hover for decorative feedback, and stays lit
 * whenever the button reflects an active mode (playing, playground). The
 * play/pause button is the one exception: its "lit" image is a different
 * icon (pause, not a brighter play), so it's driven purely by playing
 * state, never by hover, to avoid implying the wrong action.
 */
export function DungeonSlideshowControls({
  playing,
  walking,
  onPrev,
  onTogglePlay,
  onNext,
  onPlayground,
}: {
  playing: boolean;
  walking: boolean;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPlayground: () => void;
}) {
  const showingPlay = walking || !playing;
  return (
    <div className="slideshow-controls__bar">
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
