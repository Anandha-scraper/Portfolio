"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { PixelSprite } from "@/components/ui/pixel-sprite";
import { resolveSprite, SCENE_COMPONENTS } from "@/lib/scene";
import { cn } from "@/lib/utils";
import type { SceneItem, SceneLayout } from "@/types";

/**
 * SceneStage — renders a SceneLayout (data/scene-capabilities.ts) as a
 * world-sized box of absolutely positioned items, scaled uniformly to fit
 * whatever space it's given.
 *
 * The whole point is that authored coordinates are the only layout input:
 * there is no flex order, no negative-margin overlap arithmetic and no
 * per-breakpoint scale steps to keep in sync. An item's `z` is its paint
 * order, so overlapping is just a number.
 *
 * The editor at /master/scene renders `SceneItemView` and `useFitScale`
 * directly rather than this component, so what it shows is the same code
 * path as the live scene rather than an approximation of it.
 */

/**
 * Fit a world box into a host element, uniformly. Width usually binds, but
 * height is clamped too so a short viewport can't crop the composition.
 *
 * The returned scale pairs with `transform-origin: 0 0` on the world box
 * (scene-stage.css), which is what keeps screen → world conversion a plain
 * divide — the editor's drag handling depends on that.
 */
export function useFitScale(world: { w: number; h: number }): [RefObject<HTMLDivElement | null>, number] {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      setFit(Math.min(width / world.w, height / world.h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [world.w, world.h]);

  return [hostRef, fit];
}

export function SceneStage({ layout, className }: { layout: SceneLayout; className?: string }) {
  const [hostRef, fit] = useFitScale(layout.world);

  return (
    <div ref={hostRef} className={cn("scene-stage", className)}>
      <div
        className="scene-stage__world"
        style={{ width: layout.world.w, height: layout.world.h, transform: `scale(${fit})` }}
      >
        {layout.items.map((item) =>
          item.hidden ? null : <SceneItemView key={item.id} item={item} />,
        )}
      </div>
    </div>
  );
}

/**
 * One placed item. `positioned: false` renders it at the origin instead of at
 * its own x/y — the editor wraps each item in its own positioned box so a
 * drag can move that box directly without re-rendering the sprite.
 */
export function SceneItemView({
  item,
  positioned = true,
}: {
  item: SceneItem;
  positioned?: boolean;
}) {
  const style: CSSProperties = positioned
    ? { position: "absolute", left: item.x, top: item.y, zIndex: item.z }
    : { position: "relative" };

  if (item.kind === "component") {
    const entry = SCENE_COMPONENTS[item.component];
    if (!entry) return null;
    const Component = entry.component;
    const props: Record<string, unknown> = { ...item.props };
    if (entry.scalable) props.scale = item.scale;
    return (
      <div style={{ ...style, transform: item.flip ? "scaleX(-1)" : undefined }}>
        {/* Props come from a whitelisted component's own signature; the cast
            is the seam between string-keyed scene data and typed props. */}
        <Component {...(props as Record<string, never>)} />
      </div>
    );
  }

  const leaf = resolveSprite(item.sprite);
  if (!leaf) return null;

  if (leaf.animated) {
    return (
      <div style={style}>
        <PixelSprite
          src={leaf.src}
          frames={leaf.frames}
          frameW={leaf.frameW}
          frameH={leaf.frameH}
          scale={item.scale}
          frameMs={item.frameMs ?? leaf.frameMs}
          flip={item.flip}
          mode="loop"
          bob={item.bob ?? false}
        />
      </div>
    );
  }

  return (
    <div style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={leaf.src}
        alt=""
        width={leaf.w * item.scale}
        height={leaf.h * item.scale}
        draggable={false}
        className="pixelated"
        style={{ transform: item.flip ? "scaleX(-1)" : undefined }}
      />
    </div>
  );
}
