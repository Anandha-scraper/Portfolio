import { cn } from "@/lib/utils";

/**
 * BackgroundEnvironment — the shared "living" atmosphere mounted once
 * behind all content. Four layers, all pointer-events:none, all pure CSS
 * (no JS) so it costs nothing on the main thread and respects reduced-motion.
 *
 *   Layer 1 — soft radial gradient washes (blue / violet / coral)
 *   Layer 2 — global boxed-line grid (ref.txt #1), masked to fade at edges
 *   Layer 3 — subtle fractal noise texture
 */
export function BackgroundEnvironment() {
  return (
    <div aria-hidden="true" className="background-environment">
      {/* Layer 1 — radial gradient washes */}
      <div className="background-environment__washes">
        <div className="background-environment__wash background-environment__wash--coral" />
        <div className="background-environment__wash background-environment__wash--olive" />
        <div className="background-environment__wash background-environment__wash--amber" />
      </div>

      {/* Layer 2 — global boxed-line grid (ref.txt #1), the one backdrop for every page */}
      <div className={cn("background-environment__grid", "bg-grid-global")} />

      {/* Layer 3 — noise texture */}
      <div className={cn("background-environment__noise", "noise-overlay")} />
    </div>
  );
}
