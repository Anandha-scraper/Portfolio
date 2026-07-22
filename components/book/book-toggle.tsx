"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { Icon } from "@/components/ui/icon";
import { BookPanel } from "@/components/book/book-panel";

/**
 * BookToggle — placeholder demo mount for the new codex/book UI
 * (components/book/), pending a real placement decision (e.g. skinning
 * project-dungeon-panel.tsx, or a dedicated section). Architecture mirrors
 * AssetGallery exactly: a fixed toggle button + DungeonFrame popover with
 * outside-click/Escape-to-close. Remove or relocate once the book has a
 * permanent home and real content.
 */
export function BookToggle() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="hidden md:block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Hide book demo" : "Show book demo"}
        aria-expanded={open}
        aria-controls={panelId}
        className="fixed left-4 top-4 z-[80] flex h-9 w-9 items-center justify-center rounded-md border border-ops-line bg-ops-surface/80 text-ops-sand backdrop-blur-md transition-colors hover:border-ops-rust/50 hover:text-ops-rust"
      >
        <Icon name="Newspaper" size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="fixed left-4 top-[3.75rem] z-[78] w-[min(92vw,640px)]"
          >
            <DungeonFrame wall={24} className="font-pixel-readable text-ops-sand">
              <div className="p-2 pr-9">
                <p className="font-pixel mb-2 text-[0.5rem] uppercase tracking-widest text-ops-rust">
                  Book demo — placeholder content
                </p>
                <BookPanel />
              </div>
            </DungeonFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
