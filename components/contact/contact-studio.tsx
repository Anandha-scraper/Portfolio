"use client";

import { profile } from "@/data/profile";
import { SectionShell } from "@/components/blueprint/section-shell";
import { SectionHeading } from "@/components/blueprint/section-heading";
import { Reveal } from "@/components/animations/reveal";
import { Terminal } from "@/components/contact/terminal";

export function ContactStudio() {
  return (
    <SectionShell id="contact" className="min-h-screen scroll-mt-0 pb-10 sm:pb-14 lg:pb-16">
      <SectionHeading
        index="07"
        eyebrow="Contact Studio"
        title={
          <>
            Let&apos;s build something{" "}
            <span className="text-gradient-blue">worth shipping</span>.
          </>
        }
        description="Talk to the terminal — type 'help' to list commands. However you reach out, I read everything."
      />

      <Reveal className="mx-auto mt-12 w-full max-w-2xl">
        <Terminal />
      </Reveal>

      <footer className="mt-8 flex flex-col items-center gap-1.5 border-t border-hairline pt-4 text-center">
        <p className="text-xs text-ink-muted">
          Designed & engineered by {profile.name} — built as a living blueprint.
        </p>
      </footer>
    </SectionShell>
  );
}
