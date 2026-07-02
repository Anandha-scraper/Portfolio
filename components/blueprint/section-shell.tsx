import { cn } from "@/lib/utils";
import type { SectionId } from "@/types";

interface SectionShellProps {
  id: SectionId;
  children: React.ReactNode;
  className?: string;
  /** vertical rhythm */
  spacing?: "default" | "tight";
}

/** Standard section wrapper: anchor id, scroll-margin for the dock, padding. */
export function SectionShell({
  id,
  children,
  className,
  spacing = "default",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "section-pad relative scroll-mt-24 overflow-hidden",
        spacing === "default" ? "py-20 sm:py-28 lg:py-36" : "py-14 sm:py-20",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}
