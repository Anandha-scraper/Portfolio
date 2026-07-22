"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/data/profile";
import { Reveal } from "@/components/animations/reveal";
import { DungeonFrame } from "@/components/ui/dungeon-frame";
import { MorphingText } from "@/components/ui/morphing-text";
import { Particles } from "@/components/ui/particles";
import { NamePatrolSprite } from "@/components/mission-control/name-patrol-sprite";
import { cn } from "@/lib/utils";

// Rotating developer one-liners shown inside the "space" card.
const DEV_WORDS = [
  "I ship products",
  "I build systems",
  "I design UX",
  "I scale APIs",
  "I solve problems",
];

/**
 * ProfilePhotoReveal — shown first in the space card, on top of the already-
 * cycling MorphingText, then dissolves away after a short hold to reveal the
 * word rotation underneath. A one-time intro, not a repeating cycle.
 */
function ProfilePhotoReveal() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const holdMs = reduceMotion ? 1100 : 2200;
    const t = window.setTimeout(() => setVisible(false), holdMs);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="mission-control__photo-reveal"
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, scale: 1.04, filter: "blur(14px)" }
          }
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <Image
            src="/profile/anandha.png"
            alt={profile.name}
            fill
            unoptimized
            priority
            sizes="(min-width: 1024px) 880px, 100vw"
            className="mission-control__photo-image"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MissionControl() {
  return (
    <section id="mission-control" className={cn("mission-control__section", "ops", "ops-scanlines")}>
      {/* Legibility wash (the global boxed-line grid shows through; the island
          image below sits on top of it). */}
      <div aria-hidden className="mission-control__wash" />

      {/* Content sized to a single viewport: context top-left, card right.
          Top padding clears the fixed header; left padding is tightened on lg
          so the name column sits closer to the chest sidebar. */}
      <div className={cn("mission-control__grid", "section-pad")}>
        {/* Left — context, anchored toward the top-left */}
        <div className="mission-control__context" style={{ maxWidth: "min(600px, 100%)" }}>
          <Reveal delay={0.1}>
            <h1 className={cn("mission-control__name", "font-pixel")}>
              <span className="mission-control__name-row">
                <span className="mission-control__name-word">ANANDHA</span>
                <NamePatrolSprite
                  character="robot"
                  direction="rtl"
                  scale={1.5}
                  className="mission-control__patrol-track"
                />
              </span>
              <span className="mission-control__name-row">
                <NamePatrolSprite
                  character="skeleton"
                  direction="ltr"
                  scale={1.5}
                  className="mission-control__patrol-track"
                />
                <span className={cn("mission-control__name-word", "text-ops-gradient")}>KUMARAN M S</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <p className={cn("mission-control__tagline", "font-pixel-readable")}>
              <span className="mission-control__tagline-title">{profile.title}</span> —{" "}
              {profile.tagline}
            </p>
          </Reveal>
        </div>

        {/* Right — stone-walled "space" card with drifting particles + morphing text */}
        <Reveal delay={0.26}>
          <DungeonFrame
            wall={20}
            className="mission-control__space-card"
            style={{
              width: "min(880px, 100%)",
              height: "min(380px, 60vh)",
            }}
          >
            <div className="mission-control__space-inner">
              <Particles
                className="mission-control__particles"
                quantity={120}
                ease={80}
                color="#ffffff"
                refresh
              />
              <div className="mission-control__word-stage">
                <MorphingText
                  texts={DEV_WORDS}
                  className={cn("mission-control__word", "font-pixel-readable")}
                />
              </div>
              <ProfilePhotoReveal />
            </div>
          </DungeonFrame>
        </Reveal>
      </div>

      {/* Pixel-art scene — the hero content floats above this ground line.
          object-bottom keeps the ground in view and crops the dark sky as it
          shrinks. Full-bleed width. */}
      <div aria-hidden className="mission-control__scene" style={{ height: "min(560px, 70vh)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/island-bg.webp" alt="" className={cn("mission-control__scene-img", "pixelated")} />
        {/* Melt the scene's dark sky up into the section */}
        <div className="mission-control__scene-melt" />
      </div>

      {/* Fade into the light portfolio below */}
      <div aria-hidden className="mission-control__fade" />
    </section>
  );
}
