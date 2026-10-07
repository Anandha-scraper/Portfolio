"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useSidecar — the shared client for the dev-only save sidecar
 * (scripts/master-server.mjs), used by both /master and /master/scene.
 *
 * The site is a static export with no backend, so saving goes to a local
 * Node process instead of an API route. That process only exists in dev, so
 * every consumer needs the same two things: a health signal to drive the
 * "dev only" banner, and a save call that fails loudly rather than silently.
 *
 * `sidecarUp` starts as null rather than false on purpose — the banner must
 * not flash during the first health round-trip, so callers render it only on
 * an explicit `false`.
 */

const SIDECAR = "http://127.0.0.1:4321";
const HEALTH_INTERVAL_MS = 8000;

/** The files the sidecar is willing to write (see FILES in master-server.mjs). */
export type SidecarFile = "skills" | "projects" | "scene";

export interface SidecarMessage {
  kind: "ok" | "err";
  text: string;
}

export function useSidecar() {
  const [sidecarUp, setSidecarUp] = useState<boolean | null>(null);
  const [message, setMessage] = useState<SidecarMessage | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch(`${SIDECAR}/health`)
        .then((r) => alive && setSidecarUp(r.ok))
        .catch(() => alive && setSidecarUp(false));
    check();
    const t = window.setInterval(check, HEALTH_INTERVAL_MS);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const save = useCallback(async (file: SidecarFile, content: unknown, label?: string) => {
    setMessage(null);
    try {
      const r = await fetch(`${SIDECAR}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, content }),
      });
      const body = await r.json();
      if (body.ok) {
        setMessage({ kind: "ok", text: `Saved ${label ?? `data/${file}.ts`} — dev server reloads it now.` });
        return true;
      }
      setMessage({ kind: "err", text: `Save rejected: ${body.error}` });
      return false;
    } catch {
      // A failed save is itself evidence the sidecar is down; flip the banner
      // now rather than waiting out the health interval.
      setSidecarUp(false);
      setMessage({ kind: "err", text: "Sidecar unreachable — run `npm run master` beside `npm run dev`." });
      return false;
    }
  }, []);

  return { sidecarUp, message, setMessage, save };
}
