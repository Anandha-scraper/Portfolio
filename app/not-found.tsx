import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section-pad flex min-h-dvh flex-col items-center justify-center text-center">
      <div className="bg-blueprint pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <p className="eyebrow mb-4">Error 404 · off the blueprint</p>
      <h1 className="text-[clamp(3rem,12vw,7rem)] font-semibold leading-none tracking-tight">
        <span className="text-gradient-blue">404</span>
      </h1>
      <p className="mt-4 max-w-md text-ink-muted">
        This coordinate isn&apos;t on the plan. Let&apos;s get you back to the
        main blueprint.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-ink-soft"
      >
        Return home
      </Link>
    </main>
  );
}
