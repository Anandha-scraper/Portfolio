"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";

/**
 * ImageLightbox — a full-viewport, fit-to-screen view for a single image.
 * Portaled to `document.body` so it always sits above section-local stacking
 * contexts (DungeonFrame, the dungeon panel's own container query, etc.)
 * rather than needing every caller to reason about z-index locally.
 *
 * Rendered only while `open` — no hidden/invisible DOM sitting around, since
 * callers gate this behind a mobile-only tap (see project-plate.tsx).
 */
export function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  // Body scroll would otherwise keep scrolling the page behind the overlay
  // on touch, since the overlay itself has nothing tall enough to capture it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className="image-lightbox__close"
        onClick={onClose}
        aria-label="Close"
      >
        <Icon name="X" size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="image-lightbox__img" draggable={false} />
    </div>,
    document.body
  );
}
