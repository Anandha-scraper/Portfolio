"use client";

import { profile } from "@/data/profile";
import { SectionShell } from "@/components/blueprint/section-shell";
import { SectionHeading } from "@/components/blueprint/section-heading";
import { Reveal } from "@/components/animations/reveal";
import { Terminal } from "@/components/contact/terminal";

export function ContactStudio() {
  return (
    <SectionShell id="contact" className="contact-studio__shell">
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

      <Reveal className="contact-studio__terminal-wrap">
        <Terminal />
      </Reveal>

      <footer className="contact-studio__footer">
        <p className="contact-studio__footer-text">
          Designed & engineered by {profile.name} — built as a living blueprint.
        </p>
      </footer>
    </SectionShell>
  );
}
