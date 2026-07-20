"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import styles from "@/components/ui/carousel.module.css";

/**
 * Carousel — adapted from the "React Bits" Carousel (motion drag + 3D
 * rotateY tilt, loop-clone-at-edges, indicator dots, autoplay/pauseOnHover)
 * for a screenshot gallery instead of icon+title+description cards, and
 * replacing its fixed `baseWidth` prop with a self-measured width
 * (ResizeObserver on the outer container, same pattern as the stage
 * measurement in components/capability-network/capability-network.tsx) since
 * this renders inside a fluid column, not a fixed-px box.
 *
 * Renders nothing for 0 images (caller keeps its own placeholder card), a
 * static frame for exactly 1 image (no drag/dots/autoplay chrome needed),
 * and the full drag carousel for 2+.
 */

export interface CarouselImageItem {
  id: number;
  src: string;
  alt: string;
}

export interface CarouselProps {
  items: CarouselImageItem[];
  /** Active project's accent hex (lib/accents.ts ACCENTS[project.accent].hex) —
   *  themes the active indicator dot. */
  accentHex: string;
  loop?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  className?: string;
}

const GAP = 16;
const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 } as const;
const TILT_DEG = 40;
// CarouselTrack renders its own .container bezel (padding + border) around the
// .viewport it measures against — must match .container's --p-distance/border
// in carousel.module.css, since the ResizeObserver below measures the outer,
// unpadded wrapper rather than the bezel-inset viewport itself.
const BEZEL_INSET = 2 * (10 + 1);
// Matches the panel's actual rendered width (project-preview-panel.tsx:
// full-width below lg, a fixed 380px dock at lg:+) so the browser fetches an
// appropriately-sized image instead of guessing the full viewport always.
const IMAGE_SIZES = "(min-width: 1024px) 380px, 100vw";

export function Carousel({
  items,
  accentHex,
  loop = true,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = true,
  className,
}: CarouselProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(w));
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div ref={containerRef} className={cn(styles.container, className)}>
        <div className={cn(styles.viewport, styles.single)}>
          <Image
            src={items[0].src}
            alt={items[0].alt}
            fill
            unoptimized
            priority
            sizes={IMAGE_SIZES}
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {width > 0 ? (
        <CarouselTrack
          items={items}
          itemWidth={Math.max(0, width - BEZEL_INSET)}
          accentHex={accentHex}
          loop={loop}
          autoplay={autoplay && !reduce}
          autoplayDelay={autoplayDelay}
          pauseOnHover={pauseOnHover}
          reduce={!!reduce}
        />
      ) : (
        <div className={styles.container}>
          <div className={styles.viewport}>
            <Image
              src={items[0].src}
              alt={items[0].alt}
              fill
              unoptimized
              priority
              sizes={IMAGE_SIZES}
              className="object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CarouselTrack({
  items,
  itemWidth,
  accentHex,
  loop,
  autoplay,
  autoplayDelay,
  pauseOnHover,
  reduce,
}: {
  items: CarouselImageItem[];
  itemWidth: number;
  accentHex: string;
  loop: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  pauseOnHover: boolean;
  reduce: boolean;
}) {
  const trackItemOffset = itemWidth + GAP;

  const itemsForRender = useMemo(
    () => (loop ? [items[items.length - 1], ...items, items[0]] : items),
    [items, loop]
  );

  const [position, setPosition] = useState(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;
    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  const effectiveTransition = isJumping || reduce ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationStart = () => setIsAnimating(true);

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;
    if (position === lastCloneIndex) {
      setIsJumping(true);
      setPosition(1);
      x.set(-1 * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }
    if (position === 0) {
      setIsJumping(true);
      setPosition(items.length);
      x.set(-items.length * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }
    setIsAnimating(false);
  };

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;
    if (direction === 0) return;
    setPosition((prev) => {
      const next = prev + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  /** Prev/Next arrow buttons — same clamp handleDragEnd uses. */
  const stepPosition = (delta: number) => {
    setPosition((prev) => {
      const next = prev + delta;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      };

  const activeIndex = loop ? (position - 1 + items.length) % items.length : Math.min(position, items.length - 1);

  const rootStyle = { "--carousel-accent": accentHex } as CSSProperties;

  return (
    <div
      className={styles.container}
      style={rootStyle}
      onMouseEnter={() => pauseOnHover && setIsHovered(true)}
      onMouseLeave={() => pauseOnHover && setIsHovered(false)}
    >
      <div className={styles.viewport}>
        <motion.div
          className={styles.track}
          drag={isAnimating ? false : "x"}
          {...dragProps}
          style={{
            gap: GAP,
            perspective: 1000,
            perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
            x,
          }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(position * trackItemOffset) }}
          transition={effectiveTransition}
          onAnimationStart={handleAnimationStart}
          onAnimationComplete={handleAnimationComplete}
        >
          {itemsForRender.map((item, index) => (
            <CarouselItem
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              itemWidth={itemWidth}
              trackItemOffset={trackItemOffset}
              x={x}
              transition={effectiveTransition}
              priority={index === position}
            />
          ))}
        </motion.div>

        <button
          type="button"
          onClick={() => stepPosition(-1)}
          aria-label="Previous screenshot"
          className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ops-line bg-ops-base/70 text-ops-sand-soft backdrop-blur-sm transition-colors hover:border-ops-rust/50 hover:text-ops-sand"
        >
          <Icon name="ChevronLeft" size={16} />
        </button>
        <button
          type="button"
          onClick={() => stepPosition(1)}
          aria-label="Next screenshot"
          className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ops-line bg-ops-base/70 text-ops-sand-soft backdrop-blur-sm transition-colors hover:border-ops-rust/50 hover:text-ops-sand"
        >
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>

      <div className={styles.indicators}>
        {items.map((_, index) => (
          <motion.button
            type="button"
            key={index}
            className={styles.dot}
            data-active={activeIndex === index || undefined}
            aria-label={`Show screenshot ${index + 1}`}
            aria-current={activeIndex === index}
            animate={{ scale: activeIndex === index ? 1.2 : 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => setPosition(loop ? index + 1 : index)}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselItem({
  item,
  index,
  itemWidth,
  trackItemOffset,
  x,
  transition,
  priority,
}: {
  item: CarouselImageItem;
  index: number;
  itemWidth: number;
  trackItemOffset: number;
  x: ReturnType<typeof useMotionValue<number>>;
  transition: object;
  /** the currently-centered slide — eager-loaded, everything else stays lazy. */
  priority: boolean;
}) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const rotateY = useTransform(x, range, [TILT_DEG, 0, -TILT_DEG], { clamp: false });

  return (
    <motion.div className={styles.item} style={{ width: itemWidth, rotateY }} transition={transition}>
      <Image
        src={item.src}
        alt={item.alt}
        fill
        unoptimized
        priority={priority}
        draggable={false}
        sizes={IMAGE_SIZES}
        className="object-cover"
      />
    </motion.div>
  );
}
