"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * DungeonSlideshowControls — top-right pixel-styled transport cluster for the
 * Project Dungeon's default auto-advancing slideshow (dungeon-map.tsx).
 * Prev/Next always pause autoplay (the play/pause button flips to its
 * "paused" look) after settling on the resulting project. Styled to match
 * the existing ⚔ touch-action button (dungeon-touch-controls.tsx).
 */
export function DungeonSlideshowControls({
  playing,
  onPrev,
  onTogglePlay,
  onNext,
  onPlayground,
}: {
  playing: boolean;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPlayground: () => void;
}) {
  return (
    <div className="absolute right-3 top-3 z-50 flex items-center gap-1.5">
      <ControlButton label="Previous project" onClick={onPrev}>
        <Icon name="SkipBack" size={16} />
      </ControlButton>
      <ControlButton
        label={playing ? "Pause slideshow" : "Play slideshow"}
        onClick={onTogglePlay}
        lit={playing}
      >
        <Icon name={playing ? "Pause" : "Play"} size={16} />
      </ControlButton>
      <ControlButton label="Next project" onClick={onNext}>
        <Icon name="SkipForward" size={16} />
      </ControlButton>
      <ControlButton label="Playground — walk the dungeon yourself" onClick={onPlayground}>
        <Icon name="Gamepad2" size={16} />
      </ControlButton>
    </div>
  );
}

/** Replaces the whole cluster above while Playground mode is active. */
export function ExitPlaygroundControl({ onExit }: { onExit: () => void }) {
  return (
    <div className="absolute right-3 top-3 z-50">
      <ControlButton label="Exit Playground — back to slideshow" onClick={onExit} lit>
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
