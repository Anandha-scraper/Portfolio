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
        "section-shell",
        "section-pad",
        spacing === "default" ? "section-shell--default" : "section-shell--tight",
        className
      )}
    >
      <div className="section-shell__inner">{children}</div>
    </section>
  );
}
