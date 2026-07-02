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
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-faint">{index}</span>
        <span className="h-px w-8 bg-hairline" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-pretty text-base text-ink-muted sm:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
