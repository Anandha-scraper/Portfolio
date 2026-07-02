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
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Layer 1 — radial gradient washes */}
      <div className="absolute inset-0">
        <div className="absolute -left-[10%] -top-[10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(226,88,34,0.10),transparent_70%)] blur-2xl" />
        <div className="absolute right-[-8%] top-[18%] h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(163,177,138,0.08),transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[-12%] left-[30%] h-[45vh] w-[45vh] rounded-full bg-[radial-gradient(circle,rgba(217,164,65,0.07),transparent_70%)] blur-2xl" />
      </div>

      {/* Layer 2 — global boxed-line grid (ref.txt #1), the one backdrop for every page */}
      <div className="bg-grid-global absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_95%)] opacity-80" />

      {/* Layer 3 — noise texture */}
      <div className="noise-overlay absolute inset-0 opacity-[0.025] mix-blend-multiply" />
    </div>
  );
}
