"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * DungeonSlideshowControls — top-right pixel-styled transport bar for the
 * Project Dungeon (dungeon-map.tsx). Fixed in the same spot across both
 * screens the dungeon swaps between: the default auto-advancing project
 * view, and the walkable map (Playground). Prev/Next always settle on the
 * resulting project and pause autoplay (the play/pause button flips to its
 * "paused" look). The Playground button is the same control both ways — it
 * opens the map to pick a project, and (once a treasure's project fills the
 * frame again) brings the map back so another can be picked. Styled to
 * match the existing ⚔ touch-action button (dungeon-touch-controls.tsx).
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
    <div className="absolute right-3 top-3 z-50 flex items-center gap-1.5">
      <ControlButton label="Previous project" onClick={onPrev}>
        <Icon name="SkipBack" size={16} />
      </ControlButton>
      <ControlButton
        label={showingPlay ? "Play slideshow" : "Pause slideshow"}
        onClick={onTogglePlay}
        lit={!showingPlay}
      >
        <Icon name={showingPlay ? "Play" : "Pause"} size={16} />
      </ControlButton>
      <ControlButton label="Next project" onClick={onNext}>
        <Icon name="SkipForward" size={16} />
      </ControlButton>
      <ControlButton
        label={walking ? "Back to the project" : "Playground — walk the dungeon yourself"}
        onClick={onPlayground}
        lit={walking}
      >
        <Icon name="Gamepad2" size={16} />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  lit,
  children,
}: {
  label: string;
  onClick: () => void;
  lit?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all",
        lit
          ? "border-ops-rust bg-ops-rust/25 text-ops-sand shadow-[0_0_14px_rgba(226,88,34,0.5)]"
          : "border-ops-line bg-ops-base/70 text-ops-sand-soft backdrop-blur-sm hover:border-ops-rust/50 hover:text-ops-sand"
      )}
    >
      {children}
    </button>
  );
}
