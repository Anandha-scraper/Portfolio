"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlipBook, type FlipBookSlide } from "@/components/ui/flip-book";
import { Icon } from "@/components/ui/icon";

/**
 * TreasureBookModal — opens the FlipBook (components/ui/flip-book.tsx) when
 * a dungeon sector's treasure marker is clicked (see dungeon-treasures.tsx /
 * dungeon-map.tsx). Content is placeholder for now (the original CodePen demo
 * copy) — every sector opens the same book until real per-project content is
 * wired in.
 */

// eslint-disable-next-line @next/next/no-img-element
const BrilliantGif = () => <img src="https://assets.codepen.io/36869/brilliant.gif" alt="" style={{ width: "100%" }} />;
// eslint-disable-next-line @next/next/no-img-element
const PixelCatImg = () => <img src="https://assets.codepen.io/36869/pixel-cat.jpg" alt="" style={{ width: "100%" }} />;

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis qui quibusdam suscipit unde velit veritatis vitae voluptas? Aliquid deleniti deserunt dolorem expedita id in iusto libero maiores minima molestiae natus non odio perferendis placeat provident quae quaerat qui quidem reiciendis, rem repellendus sit sunt tempore unde vero vitae voluptatum. Earum ipsum rem tempora voluptas? Debitis eaque, labore natus sit voluptatem voluptatum. Asperiores assumenda autem consequatur deleniti eligendi magnam natus nihil quidem repudiandae, soluta veniam voluptates. Eaque eveniet sed sunt voluptas.";

const DEMO_SLIDES: FlipBookSlide[] = [
  {
    left: (
      <div>
        <p style={{ margin: 0, textIndent: "1rem" }}>
          🧩 Overview This project is a pure CSS-based dynamic interactive book that simulates page-flipping
          animations using cutting-edge features available in modern Chrome (134–135+). It seamlessly combines
          several powerful CSS technologies to create a fully scrollable, sprite-driven animated experience
          resembling a book with turning pages.
        </p>
        <BrilliantGif />
      </div>
    ),
    right: (
      <div>
        <p style={{ margin: 0, textIndent: "1rem" }}>🚀 Core Features</p>
        <p style={{ margin: 0, textIndent: "1rem" }}>📚 Book-like Page Flipping</p>
        <p style={{ margin: 0, textIndent: "1rem" }}>
          Each &ldquo;slide&rdquo; or section of the book corresponds to a virtual page. The animation mimics a
          realistic flipping effect using sprite sheets and scroll-driven animations.
        </p>
        <br />
        <p style={{ margin: 0, textIndent: "1rem" }}>🔧 Technologies Used</p>
        <ul style={{ padding: 0, listStyle: "auto", listStylePosition: "inside", margin: 0 }}>
          <li>Scroll Snap</li>
          <li>View Timeline + Scroll Timeline</li>
          <li>Sprite Sheets (mod, round)</li>
          <li>Dynamic Sizing</li>
          <li>Dynamic Sprite Calculation</li>
        </ul>
        <br />
        <p style={{ margin: 0, textIndent: "1rem" }}>🧠 Dynamic Behavior</p>
        <p style={{ margin: 0, textIndent: "1rem" }}>
          All animations are automatically adjusted when changing the number of slides via the --slides variable.
          Frame
        </p>
      </div>
    ),
  },
  {
    left: (
      <div>
        <p style={{ margin: 0 }}>
          count, sprite layout, and total animation length adapt based on user-defined CSS variables. The animation
          is responsive to scroll progress using scroll-timeline and is scoped per element using timeline-scope.
        </p>
        <br />
        <p style={{ margin: 0, textIndent: "1rem" }}>🖼️ Visual Layers</p>
        <p style={{ margin: 0, textIndent: "1rem" }}>
          The book page uses a layered sprite system: One sprite sheet per page flip animation Positioned and
          animated via background-image The correct frame is selected based on scroll or button input
        </p>
        <br />
        <p style={{ margin: 0, textIndent: "1rem" }}>🧪 Browser Support</p>
        <p style={{ margin: 0, textIndent: "1rem" }}>
          Requires Chrome 134+ for experimental CSS features like scroll-timeline, animation-timeline,
          ::scroll-button, and ::scroll-marker Best viewed with flags enabled or origin trials if needed
        </p>
      </div>
    ),
    right: (
      <div>
        <p style={{ margin: 0, textIndent: "1rem" }}>📦 Use Cases</p>
        <p style={{ margin: 0 }}>
          Digital storytelling
          <br />
          Visual novels
          <br />
          Portfolio presentations
          <br />
          Interactive learning materials
        </p>
        <br />
        <PixelCatImg />
      </div>
    ),
  },
  { left: <div>{LOREM}</div>, right: <div>{LOREM}</div> },
  { left: <div>{LOREM}</div>, right: <div>{LOREM}</div> },
];

export function TreasureBookModal({ sector, onClose }: { sector: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!sector) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sector, onClose]);

  return (
    <AnimatePresence>
      {sector && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="relative w-full max-w-3xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-ops-line bg-ops-surface text-ops-sand transition-colors hover:border-ops-rust/50 hover:text-ops-rust"
            >
              <Icon name="X" size={16} />
            </button>
            <FlipBook slides={DEMO_SLIDES} spriteImage="https://assets.codepen.io/36869/book.webp" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
