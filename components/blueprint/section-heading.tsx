import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  index: string; // e.g. "02"
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/** Editorial section header: blueprint index marker + eyebrow + title. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn("section-heading", align === "center" && "section-heading--center", className)}
    >
      <div className="section-heading__meta">
        <span className={cn("section-heading__index", "font-mono")}>{index}</span>
        <span className="section-heading__rule" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h2 className="section-heading__title">{title}</h2>
      {description && (
        <p
          className={cn(
            "section-heading__description",
            align === "center" && "section-heading__description--center"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
