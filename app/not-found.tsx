import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className={cn("not-found", "section-pad")}>
      <div className={cn("not-found__backdrop", "bg-blueprint")} />
      <p className={cn("not-found__eyebrow", "eyebrow")}>Error 404 · off the blueprint</p>
      <h1 className="not-found__code">
        <span className="text-gradient-blue">404</span>
      </h1>
      <p className="not-found__desc">
        This coordinate isn&apos;t on the plan. Let&apos;s get you back to the
        main blueprint.
      </p>
      <Link href="/" className="not-found__link">
        Return home
      </Link>
    </main>
  );
}
