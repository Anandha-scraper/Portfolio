"use client";

import { profile } from "@/data/profile";
import { Reveal } from "@/components/animations/reveal";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { MorphingText } from "@/components/ui/morphing-text";
import { Particles } from "@/components/ui/particles";

// Rotating developer one-liners shown inside the "space" card.
const DEV_WORDS = [
  "I ship products",
  "I build systems",
  "I design UX",
  "I scale APIs",
  "I solve problems",
];

export function MissionControl() {
  return (
    <section
      id="mission-control"
      className="ops ops-scanlines relative w-full overflow-hidden"
    >
      {/* Legibility wash (the global boxed-line grid shows through; the island
          image below sits on top of it). */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(20,17,12,0.94),rgba(20,17,12,0.5)_42%,rgba(20,17,12,0.18)_70%,rgba(20,17,12,0.74))]"
      />

      {/* Content sized to a single viewport: context top-left, card right.
          Top padding clears the fixed header; left padding is tightened on lg
          so the name column sits closer to the chest sidebar. */}
      <div className="section-pad relative z-10 mx-auto grid min-h-dvh max-w-7xl grid-cols-1 items-start gap-12 pb-16 pt-20 md:pt-24 lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-16 lg:pl-8">
        {/* Left — context, anchored toward the top-left */}
        <div
          className="flex flex-col"
          style={{ maxWidth: "min(520px, 100%)" }}
        >
          <Reveal delay={0.1}>
            <h1 className="font-pixel mt-7 text-[clamp(1.3rem,5vw,2.9rem)] leading-[1.5] lg:-ml-4">
              <span className="block text-ops-sand">ANANDHA</span>
              <span className="text-ops-gradient block">KUMARAN</span>
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="font-pixel-readable mt-5 max-w-xl text-2xl leading-snug text-ops-sand">
              <span className="text-ops-rust">{profile.title}</span> —{" "}
              {profile.tagline}
            </p>
          </Reveal>
        </div>

        {/* Right — stone-walled "space" card with drifting particles + morphing text */}
        <Reveal delay={0.26}>
          <DungeonFrame
            wall={20}
            className="mx-auto lg:ml-auto"
            style={{
              width: "min(880px, 100%)",
              height: "min(380px, 60vh)",
            }}
          >
            <div className="relative h-full w-full overflow-hidden bg-black">
              <Particles
                className="absolute inset-0"
                quantity={120}
                ease={80}
                color="#ffffff"
                refresh
              />
              <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
                <MorphingText
                  texts={DEV_WORDS}
                  className="font-pixel-readable h-12 text-2xl font-normal text-ops-sand md:h-14 md:text-3xl lg:text-4xl"
                />
              </div>
            </div>
          </DungeonFrame>
        </Reveal>
      </div>

      {/* Pixel-art scene — the hero content floats above this ground line.
          object-bottom keeps the ground in view and crops the dark sky as it
          shrinks. Full-bleed width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] mx-auto select-none"
        style={{ height: "min(560px, 70vh)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/island-bg.jpeg"
          alt=""
          className="pixelated h-full w-full object-cover object-bottom"
        />
        {/* Melt the scene's dark sky up into the section */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(20,17,12,1),rgba(20,17,12,0.55)_45%,transparent)]" />
      </div>

      {/* Fade into the light portfolio below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-28 bg-gradient-to-b from-transparent to-canvas"
      />
    </section>
  );
}
