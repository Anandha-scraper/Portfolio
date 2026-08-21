"use client";

import { useEffect, useState } from "react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { SPRITE_CONTROL } from "@/lib/sprite-control";
import { cn } from "@/lib/utils";

/**
 * BootLoader — the monster that guards the door while the site downloads.
 *
 * This exists because there was no loader at all. `app/loading.tsx` looks like
 * one but can never render: the site is a static export (`output: "export"`),
 * so the first document is fully prerendered and nothing suspends for the App
 * Router's loading boundary to catch. On a fast cached visit that was fine; on
 * a slow device, or in incognito where every sprite is a cold fetch, the page
 * assembled itself in front of the visitor.
 *
 * How it covers the whole first paint: the overlay markup ships *in the static
 * HTML* (this component renders open by default) and `<body>` carries
 * `root-body--booting` from the server, so the blur is applied by CSS before a
 * single line of JS has run. The client's only job is taking them away again.
 *
 * Dismissal is deliberately belt-and-braces, because a loader that can't be
 * dismissed is far worse than no loader:
 *
 *   - `window.load` — the honest "everything is in" signal, including images.
 *   - MIN_VISIBLE_MS floor, so a warm cache doesn't produce a jarring flash.
 *   - MAX_VISIBLE_MS cap, so one stalled or 404ing request can never trap
 *     anyone behind a monster.
 *   - a `<noscript>` rule in boot-loader.css, so a JS failure doesn't leave the
 *     site permanently blurred and unclickable.
 */

const MONSTER = SPRITE_CONTROL.boss.monster;

/** Don't blink the loader in and out on a warm cache. */
const MIN_VISIBLE_MS = 600;
/** Hard ceiling. Past this the page is revealed whatever is still in flight. */
const MAX_VISIBLE_MS = 8000;
/** Matches the fade in boot-loader.css; the overlay unmounts after it. */
const FADE_MS = 420;

export function BootLoader() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const startedAt = performance.now();
    let fadeTimer: number | undefined;

    const dismiss = () => {
      // Unblur immediately so the page is interactive during the fade rather
      // than after it.
      document.body.classList.remove("root-body--booting");
      setLeaving(true);
      fadeTimer = window.setTimeout(() => setGone(true), FADE_MS);
    };

    const dismissWhenSettled = () => {
      const waited = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - waited);
      window.setTimeout(dismiss, remaining);
    };

    // `load` has already fired if hydration was slower than the page.
    if (document.readyState === "complete") dismissWhenSettled();
    else window.addEventListener("load", dismissWhenSettled, { once: true });

    const cap = window.setTimeout(dismiss, MAX_VISIBLE_MS);

    return () => {
      window.removeEventListener("load", dismissWhenSettled);
      window.clearTimeout(cap);
      if (fadeTimer) window.clearTimeout(fadeTimer);
      document.body.classList.remove("root-body--booting");
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={cn("boot-loader", leaving && "boot-loader--leaving")}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="boot-loader__stage">
        <PixelSprite
          src={MONSTER.src}
          frames={MONSTER.frames}
          frameW={MONSTER.frameW}
          frameH={MONSTER.frameH}
          frameMs={MONSTER.frameMs}
          scale={MONSTER.scale}
          className="boot-loader__monster"
        />
        <span className={cn("boot-loader__label", "font-pixel")}>Waking the dungeon…</span>
      </div>
    </div>
  );
}
