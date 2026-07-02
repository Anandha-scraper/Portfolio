export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-hairline" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue" />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-muted">
          Drawing blueprint…
        </span>
      </div>
    </div>
  );
}
