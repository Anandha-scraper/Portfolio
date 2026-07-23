import { cn } from "@/lib/utils";

/**
 * CapabilityNetwork — the Capabilities section. Formerly "The Voyage" (a
 * ship sailing between skill islands); that entire interactive scene has
 * been removed. What remains is the bordered dungeon stage itself — the
 * dark-ocean backdrop (capabg) framed by the same nine-slice dungeon-wall
 * border used elsewhere on the site — left empty.
 */
export function CapabilityNetwork() {
  return (
    <section id="capabilities" className={cn("capability-network__section", "ops", "ops-scanlines")}>
      {/* Desert-ops legibility wash — kept light so the global boxed-line grid
          stays visible through it (no background image in this section). */}
      <div aria-hidden className="capability-network__wash" />
      <div aria-hidden className="capability-network__fade" />

      <h2 className="capability-network__heading">Capabilities</h2>

      <div className="capability-network__wrap">
        {/* Voyage stage — full width. The stage carries the dark-ocean backdrop
            (capabg) and its nine-slice dungeon-wall border, left empty. */}
        <div
          className={cn("capability-network__stage", "pixelated")}
          style={{
            backgroundColor: "#0e1622",
            backgroundImage: "url(/capabg.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderStyle: "solid",
            borderWidth: "clamp(16px, 2.4vw, 30px)",
            borderColor: "transparent",
            borderImageSource: "url(/sprites/dungeon/wall_9slice.png)",
            borderImageSlice: "16",
            borderImageRepeat: "repeat",
          }}
        />
      </div>
    </section>
  );
}
