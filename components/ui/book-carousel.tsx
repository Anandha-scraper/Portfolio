'use client';

import { CSSProperties, ReactNode } from 'react';
import styles from '@/components/ui/book-carousel.module.css';

/**
 * One "spread" of the book: left page content + right page content.
 * Pass JSX here instead of raw HTML strings — that's the React-native
 * way to do what the original template did with hardcoded <p> tags.
 */
export interface BookCarouselPage {
  left: ReactNode;
  right: ReactNode;
}

export interface BookCarouselProps {
  /** Optional heading rendered above the book */
  title?: ReactNode;
  /** One entry per spread (left+right page pair) */
  pages: BookCarouselPage[];

  /** URL of the sprite sheet image used for the page-flip animation */
  spriteImageUrl: string;
  /** Number of columns in the sprite sheet grid */
  spriteColumns?: number;
  /** Full sprite sheet pixel height */
  spriteImageHeight: number;
  /** Full sprite sheet pixel width */
  spriteImageWidth: number;
  /** Number of animation frames in the sprite sheet */
  spriteFrameCount: number;
  /** Playback speed, frames per second */
  spriteFrameRate?: number;
}

/**
 * Scroll-driven, sprite-animated "book" carousel.
 *
 * Requires Chrome 134+ (scroll-timeline, animation-timeline: view(x),
 * ::scroll-button, ::scroll-marker, @property, round()/mod()).
 * Falls back gracefully to a plain scrollable list on browsers that
 * don't support these — no animation, but content stays readable.
 */
export default function BookCarousel({
  title,
  pages,
  spriteImageUrl,
  spriteColumns = 5,
  spriteImageHeight,
  spriteImageWidth,
  spriteFrameCount,
  spriteFrameRate = 12,
}: BookCarouselProps) {
  const cssVars = {
    '--slides': pages.length,
    '--sprite-image': `url(${spriteImageUrl})`,
    '--sprite-c': spriteColumns,
    '--sprite-h': spriteImageHeight,
    '--sprite-w': spriteImageWidth,
    '--sprite-f': spriteFrameCount,
    '--sprite-fr': spriteFrameRate,
    '--sprite-as': '.8s',
    '--sprite-ad': 'normal',
    '--sprite-af': 'none',
    '--sprite-ap': 'running',
    '--sprite-ai': 'infinite',
    '--sprite-at': 'linear',
  } as CSSProperties;

  return (
    <div className={styles.container} style={cssVars}>
      {title ? <h1 className={styles.title}>{title}</h1> : null}

      <div className={styles.spriteWrapper}>
        <div className={styles.book}>
          <div className={styles.sprite} aria-hidden="true" />

          <div className={styles.carousel}>
            {pages.map((page, index) => (
              <div className={styles.carouselItem} key={index}>
                <div className={styles.pageContainer}>
                  <div className={`${styles.page} ${styles.leftPage}`}>
                    <div>{page.left}</div>
                  </div>
                  <div className={`${styles.page} ${styles.rightPage}`}>
                    <div>{page.right}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
