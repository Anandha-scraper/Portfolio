"use client";

import { useEffect, type RefObject } from "react";

/**
 * useClickOutside — dismiss an open panel on an outside mousedown or Escape.
 * `refs` lists every element the click is allowed to land inside (the
 * trigger button plus the panel itself) without closing it.
 */
export function useClickOutside(
  open: boolean,
  refs: RefObject<HTMLElement | null>[],
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (refs.some((ref) => ref.current?.contains(t))) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
}
