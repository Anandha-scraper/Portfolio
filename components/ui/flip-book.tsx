import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "@/components/ui/flip-book.module.css";

/**
 * FlipBook — a generic, content-agnostic sprite-driven page-flip book.
 *
 * Ported from a CodePen demo ("CSS Sprite-Based Flip Carousel Using
 * Scroll-Timeline"): scrolling the carousel drives a background-sprite
 * animation (via scroll-timeline / animation-timeline: view()) that makes
 * the book sheet look like it's physically turning pages. Pure CSS/HTML —
 * no JS animation loop.
 *
 * Requires a very recent Chromium browser (scroll-timeline, ::scroll-button,
 * ::scroll-marker-group, @property, CSS mod()/round() math). There is no
 * fallback for other browsers.
 *
 * Content-agnostic: pass any number of two-page `slides`. The sprite's frame
 * math and the carousel's scroll-marker progress bar both derive from
 * `slides.length` automatically.
 */

export interface FlipBookSlide {
  left: ReactNode;
  right: ReactNode;
}

export interface FlipBookProps {
  slides: FlipBookSlide[];
  /** Page-flip sprite sheet (a `--slides` grid of pre-rendered flip frames). */
  spriteImage: string;
  /** Sprite sheet geometry — defaults match the original book.webp sheet. */
  spriteColumns?: number;
  spriteImageWidth?: number;
  spriteImageHeight?: number;
  /** Frames per single page-flip transition. */
  spriteFrames?: number;
  /** Sprite animation frame rate (frames per second). */
  frameRate?: number;
  className?: string;
}

export function FlipBook({
  slides,
  spriteImage,
  spriteColumns = 5,
  spriteImageWidth = 9600,
  spriteImageHeight = 3000,
  spriteFrames = 7,
  frameRate = 12,
  className,
}: FlipBookProps) {
  const rootStyle = {
    "--sprite-image": `url(${spriteImage})`,
    "--sprite-c": spriteColumns,
    "--sprite-w": spriteImageWidth,
    "--sprite-h": spriteImageHeight,
    "--sprite-f": spriteFrames,
    "--sprite-fr": frameRate,
  } as CSSProperties;

  const carouselStyle = { "--slides": slides.length } as CSSProperties;

  return (
    <div className={cn(styles.flipBook, className)} style={rootStyle}>
      {/* ::scroll-button(*)/::scroll-marker(-group) rules, raw and
          unprocessed by the bundler's CSS pipeline — Turbopack's CSS parser
          doesn't recognize these pseudo-elements yet and fails the whole
          flip-book.module.css on them, even though target browsers support
          them fine. A plain <style> tag is never parsed/validated at build
          time, so it sidesteps that entirely. Keeps `progress` (its only
          consumer) alongside its @keyframes so the two stay in sync — if
          `progress` stayed in the CSS module instead, its name would get
          hashed/scoped there while this literal reference wouldn't match. */}
      <style>{`
        .${styles.carousel}::scroll-button(*) {
          inline-size: 64px;
          aspect-ratio: 1;
          border-radius: 0;
          border: 0;
          background-color: transparent;
          cursor: pointer;
        }
        .${styles.carousel}::scroll-button(*):disabled {
          filter: invert(1);
          opacity: 0.5;
        }
        .${styles.carousel}::scroll-button(*):not(:disabled):is(:hover, :active) {
          filter: drop-shadow(2px 4px 6px black);
        }
        .${styles.carousel}::scroll-button(*):not(:disabled):active {
          scale: 90%;
        }
        .${styles.carousel}::scroll-button(left) {
          content: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMjMyLjAwMDAwMCAyNTYuMDAwMDAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdHJhbnNmb3JtPSJtYXRyaXgoLTEsMCwwLDEsMCwwKSI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwyNTYuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIiBmaWxsPSIjZmZmIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNMTE4MCAyMTEwIGwwIC0xODAgLTU0MCAwIC01NDAgMCAwIC03MjUgMCAtNzI1IDU0MCAwIDU0MCAwIDAgLTE4MCAwIC0xODAgMTIwIDAgMTIwIDAgMCA2MCAwIDYwIDYwIDAgNjAgMCAwIDYwIDAgNjAgNjAgMCA2MCAwIDAgNjAgMCA2MCA2MCAwIDYwIDAgMCA2MCAwIDYwIDYwIDAgNjAgMCAwIDYwIDAgNjAgNjAgMCA2MCAwIDAgNjAgMCA2MCA2MCAwIDYwIDAgMCA1MyBjMCAyOSA1IDU4IDEyIDY1IDcgNyAzNCAxMiA2MCAxMiBsNDggMCAwIDIzNSAwIDIzNSAtNjAgMCAtNjAgMCAwIDY1IDAgNjUgLTQ3IDAgYy02OCAwIC03NSAtNyAtNzEgLTcxIGwzIC01NCA1OCAtMyA1NyAtMyAwIC0xMTkgMCAtMTIwIC01NSAwIC01NCAwIC0zIC01NyAtMyAtNTggLTYwIC01IC02MCAtNSAtMyAtNTcgLTMgLTU3IC01NyAtMyAtNTcgLTMgLTMgLTU3IC0zIC01NyAtNTcgLTMgLTU3IC0zIC0zIC01NyAtMyAtNTcgLTU3IC0zIC01NyAtMyAtMyAtNTcgLTMgLTU3IC01NyAtMyAtNTcgLTMgLTMgLTU4IC0zIC01OCAtNTcgMyAtNTcgMyAtMyAxNzggLTIgMTc3IC01NDAgMCAtNTQwIDAgMiA0ODMgMyA0ODIgNTM3IDMgNTM2IDIgNyAzMiBjNCAxNyA2IDk3IDQgMTc3IGwtNCAxNDYgNTggMyA1NyAzIDAgLTYxIDAgLTYwIDYwIDAgNjAgMCAwIC02MCAwIC02MCA2MCAwIDYwIDAgMCAtNjAgMCAtNjAgNjAgMCA2MCAwIDAgLTYwIDAgLTYwIDYwIDAgNjAgMCAwIC02MCAwIC02MCA2MCAwIDYwIDAgMCA2MCAwIDYwIC02MCAwIC02MCAwIDAgNjAgMCA2MCAtNjAgMCAtNjAgMCAwIDYwIDAgNjAgLTYwIDAgLTYwIDAgMCA2MCAwIDYwIC02MCAwIC02MCAwIDAgNjAgMCA2MCAtNjAgMCAtNjAgMCAwIDYwIDAgNjAgLTEyMCAwIC0xMjAgMCAwIC0xODB6Ij48L3BhdGg+CjwvZz4KPC9zdmc+") / "Scroll Left";
          grid-area: left;
        }
        .${styles.carousel}::scroll-button(right) {
          content: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMjMyLjAwMDAwMCAyNTYuMDAwMDAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Ij4KCjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDI1Ni4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiIGZpbGw9IiNmZmYiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0xMTgwIDIxMTAgbDAgLTE4MCAtNTQwIDAgLTU0MCAwIDAgLTcyNSAwIC03MjUgNTQwIDAgNTQwIDAgMCAtMTgwIDAgLTE4MCAxMjAgMCAxMjAgMCAwIDYwIDAgNjAgNjAgMCA2MCAwIDAgNjAgMCA2MCA2MCAwIDYwIDAgMCA2MCAwIDYwIDYwIDAgNjAgMCAwIDYwIDAgNjAgNjAgMCA2MCAwIDAgNjAgMCA2MCA2MCAwIDYwIDAgMCA2MCAwIDYwIDYwIDAgNjAgMCAwIDUzIGMwIDI5IDUgNTggMTIgNjUgNyA3IDM0IDEyIDYwIDEyIGw0OCAwIDAgMjM1IDAgMjM1IC02MCAwIC02MCAwIDAgNjUgMCA2NSAtNDcgMCBjLTY4IDAgLTc1IC03IC03MSAtNzEgbDMgLTU0IDU4IC0zIDU3IC0zIDAgLTExOSAwIC0xMjAgLTU1IDAgLTU0IDAgLTMgLTU3IC0zIC01OCAtNjAgLTUgLTYwIC01IC0zIC01NyAtMyAtNTcgLTU3IC0zIC01NyAtMyAtMyAtNTcgLTMgLTU3IC01NyAtMyAtNTcgLTMgLTMgLTU3IC0zIC01NyAtNTcgLTMgLTU3IC0zIC0zIC01NyAtMyAtNTcgLTU3IC0zIC01NyAtMyAtMyAtNTggLTMgLTU4IC01NyAzIC01NyAzIC0zIDE3OCAtMiAxNzcgLTU0MCAwIC01NDAgMCAyIDQ4MyAzIDQ4MiA1MzcgMyA1MzYgMiA3IDMyIGM0IDE3IDYgOTcgNCAxNzcgbC00IDE0NiA1OCAzIDU3IDMgMCAtNjEgMCAtNjAgNjAgMCA2MCAwIDAgLTYwIDAgLTYwIDYwIDAgNjAgMCAwIC02MCAwIC02MCA2MCAwIDYwIDAgMCAtNjAgMCAtNjAgNjAgMCA2MCAwIDAgLTYwIDAgLTYwIDYwIDAgNjAgMCAwIDYwIDAgNjAgLTYwIDAgLTYwIDAgMCA2MCAwIDYwIC02MCAwIC02MCAwIDAgNjAgMCA2MCAtNjAgMCAtNjAgMCAwIDYwIDAgNjAgLTYwIDAgLTYwIDAgMCA2MCAwIDYwIC02MCAwIC02MCAwIDAgNjAgMCA2MCAtMTIwIDAgLTEyMCAwIDAgLTE4MHoiLz4KPC9nPgo8L3N2Zz4=") / "Scroll Right";
          grid-area: right;
          justify-self: flex-end;
        }
        .${styles.carousel}::scroll-marker-group {
          content: "";
          width: 100%;
          height: 8px;
          padding: 2px 0;
          display: grid;
          position: absolute;
          grid-area: markers;
          grid-auto-flow: column;
          place-self: center;
          overflow: hidden;
          border: 1px solid #000;
          background: linear-gradient(90deg, #f1e2b2 0%) no-repeat left center;
          --_progress: calc(calc(100 / var(--slides)) * 1%);
          background-size: var(--_progress, 20%) 100%;
          animation: progress linear both;
          animation-timeline: --carousel-timeline;
        }
        .${styles.carousel} > .${styles.carouselItem}::scroll-marker {
          content: '';
          position: relative;
          left: -1px;
          width: 100%;
          height: 100%;
          display: block;
          box-sizing: border-box;
          box-shadow: 2px 0 0 #000;
        }
        .${styles.carousel} > .${styles.carouselItem}:last-of-type::scroll-marker {
          box-shadow: none;
        }
        @keyframes progress {
          100% {
            --_progress: 100%;
          }
        }
      `}</style>
      <div className={styles.book}>
        <div className={styles.carousel} style={carouselStyle}>
          <div className={styles.sprite} />
          {slides.map((slide, i) => (
            <div className={styles.carouselItem} key={i}>
              <div className={styles.pageContainer}>
                <div className={cn(styles.page, styles.leftPage)}>
                  <div>{slide.left}</div>
                </div>
                <div className={cn(styles.page, styles.rightPage)}>
                  <div>{slide.right}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
