"use client";

import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SceneItemView, useFitScale } from "@/components/capability-network/scene-stage";
import { capabilityScene } from "@/data/scene-capabilities";
import { useSidecar } from "@/lib/master/use-sidecar";
import { listSpritePaths, resolveSprite, SCENE_COMPONENT_NAMES, SCENE_COMPONENTS } from "@/lib/scene";
import { cn } from "@/lib/utils";
import type { Scene, SceneItem, SceneLayoutId } from "@/types";

/**
 * SceneEditor — the dev-only visual placement tool for the Capability Network
 * (see page.tsx for why it's safe that this ships).
 *
 * Drag a sprite out of the palette onto the stage, drag it around, set its
 * size and paint order, and save: the sidecar rewrites
 * data/scene-capabilities.ts and `next dev` hot-reloads the real scene. The
 * canvas renders items through the very same SceneItemView the live site
 * uses, so this is WYSIWYG rather than a preview that drifts from reality.
 *
 * Desktop and mobile are separate layouts, edited one at a time — mobile
 * exists to be a different arrangement (shorter belt, tighter cluster), not a
 * shrunken copy of desktop.
 */

const btnCls = cn("master-console__button", "font-pixel");
const inputCls = "master-console__input";
const labelCls = cn("master-console__label", "font-pixel");

const SNAP_OPTIONS = [1, 4, 8, 16];
const NUDGE_SMALL = 1;
const NUDGE_LARGE = 10;
/** A press has to travel this far (in world px) before it counts as a drag. */
const DRAG_THRESHOLD = 2;

const clone = (scene: Scene): Scene => JSON.parse(JSON.stringify(scene));

/** Unique id from a palette entry, e.g. "fac2" / "fac2-2" if taken. */
function uniqueId(base: string, taken: Set<string>) {
  const root = base.split(".").pop() ?? base;
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
}

export function SceneEditor() {
  const { sidecarUp, message, setMessage, save } = useSidecar();
  const [scene, setScene] = useState<Scene>(() => clone(capabilityScene));
  const [layoutId, setLayoutId] = useState<SceneLayoutId>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snap, setSnap] = useState(1);

  const layout = scene[layoutId];
  const selected = layout.items.find((i) => i.id === selectedId) ?? null;

  const [hostRef, fit] = useFitScale(layout.world);
  const worldRef = useRef<HTMLDivElement>(null);

  // --- mutation helpers -------------------------------------------------
  const patchLayout = useCallback(
    (fn: (items: SceneItem[]) => SceneItem[]) =>
      setScene((s) => ({ ...s, [layoutId]: { ...s[layoutId], items: fn(s[layoutId].items) } })),
    [layoutId],
  );

  const patchItem = useCallback(
    (id: string, patch: Partial<SceneItem>) =>
      patchLayout((items) =>
        items.map((i) => (i.id === id ? ({ ...i, ...patch } as SceneItem) : i)),
      ),
    [patchLayout],
  );

  const addItem = useCallback(
    (item: SceneItem) => {
      patchLayout((items) => [...items, item]);
      setSelectedId(item.id);
    },
    [patchLayout],
  );

  const removeItem = useCallback(
    (id: string) => {
      patchLayout((items) => items.filter((i) => i.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [patchLayout],
  );

  const duplicateItem = useCallback(
    (id: string) => {
      const src = layout.items.find((i) => i.id === id);
      if (!src) return;
      const taken = new Set(layout.items.map((i) => i.id));
      addItem({ ...src, id: uniqueId(src.id, taken), x: src.x + 16, y: src.y + 16 });
    },
    [layout.items, addItem],
  );

  /** Build a fresh item from a palette entry, dropped at world (x, y). */
  const makeItem = useCallback(
    (payload: string, x: number, y: number): SceneItem => {
      const taken = new Set(layout.items.map((i) => i.id));
      const topZ = layout.items.reduce((m, i) => Math.max(m, i.z), 0);
      const base = { x: Math.round(x), y: Math.round(y), z: topZ + 10, scale: 1 };
      if (payload.startsWith("component:")) {
        const component = payload.slice("component:".length);
        return { ...base, id: uniqueId(component, taken), label: component, kind: "component", component };
      }
      const sprite = payload;
      const leaf = resolveSprite(sprite);
      return {
        ...base,
        id: uniqueId(sprite, taken),
        label: sprite,
        kind: "sprite",
        sprite,
        // Start at the registry's own scale so a dropped sprite looks like it
        // does in the asset gallery rather than at an arbitrary size.
        scale: leaf && "scale" in leaf ? (leaf.scale ?? 1) : 1,
      };
    },
    [layout.items],
  );

  // --- screen -> world --------------------------------------------------
  // The world box is scaled with transform-origin 0 0, so its client rect is
  // the scaled box and a plain divide by `fit` recovers world units.
  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = worldRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left) / fit, y: (clientY - rect.top) / fit };
    },
    [fit],
  );

  const snapTo = useCallback((v: number) => (snap > 1 ? Math.round(v / snap) * snap : Math.round(v)), [snap]);

  // --- drag -------------------------------------------------------------
  // Modelled on components/project-ecosystem/dungeon-touch-controls.tsx: the
  // pointer id lives in a ref rather than state, capture is taken on the
  // world container (not the sprite, so the pointer can outrun it), and each
  // move writes straight to the dragged element's style. React state is
  // touched once, on release — never per move.
  const drag = useRef<{
    pointerId: number;
    id: string;
    grabX: number;
    grabY: number;
    el: HTMLElement;
    moved: boolean;
    x: number;
    y: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-scene-id]");
      if (!target) return;
      const id = target.dataset.sceneId;
      const item = layout.items.find((i) => i.id === id);
      if (!id || !item) return;

      setSelectedId(id);
      const p = toWorld(e.clientX, e.clientY);
      drag.current = {
        pointerId: e.pointerId,
        id,
        grabX: p.x - item.x,
        grabY: p.y - item.y,
        el: target,
        moved: false,
        x: item.x,
        y: item.y,
      };
      worldRef.current?.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [layout.items, toWorld],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const p = toWorld(e.clientX, e.clientY);
      const nx = snapTo(p.x - d.grabX);
      const ny = snapTo(p.y - d.grabY);
      if (!d.moved && Math.hypot(nx - d.x, ny - d.y) < DRAG_THRESHOLD) return;
      d.moved = true;
      d.x = nx;
      d.y = ny;
      d.el.style.left = `${nx}px`;
      d.el.style.top = `${ny}px`;
    },
    [toWorld, snapTo],
  );

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      drag.current = null;
      try {
        worldRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* capture already lost */
      }
      if (d.moved) patchItem(d.id, { x: d.x, y: d.y });
    },
    [patchItem],
  );

  // --- keyboard ---------------------------------------------------------
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selected) return;
      const step = e.shiftKey ? NUDGE_LARGE : NUDGE_SMALL;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (moves[e.key]) {
        e.preventDefault();
        const [dx, dy] = moves[e.key];
        patchItem(selected.id, { x: selected.x + dx, y: selected.y + dy });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeItem(selected.id);
      }
    },
    [selected, patchItem, removeItem],
  );

  // --- palette ----------------------------------------------------------
  const spriteGroups = useMemo(() => listSpritePaths(), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const payload = e.dataTransfer.getData("text/scene-item");
      if (!payload) return;
      const p = toWorld(e.clientX, e.clientY);
      addItem(makeItem(payload, snapTo(p.x), snapTo(p.y)));
    },
    [toWorld, addItem, makeItem, snapTo],
  );

  const sortedByZ = useMemo(() => [...layout.items].sort((a, b) => b.z - a.z), [layout.items]);

  const shift = useCallback(
    (id: string, dir: 1 | -1) => {
      const ordered = [...layout.items].sort((a, b) => a.z - b.z);
      const idx = ordered.findIndex((i) => i.id === id);
      const swap = ordered[idx + dir];
      if (!swap) return;
      const me = ordered[idx];
      patchLayout((items) =>
        items.map((i) => (i.id === me.id ? { ...i, z: swap.z } : i.id === swap.id ? { ...i, z: me.z } : i)),
      );
    },
    [layout.items, patchLayout],
  );

  return (
    <main className={cn("scene-editor", "ops", "font-pixel-readable")}>
      <header className="scene-editor__header">
        <div>
          <h1 className={cn("scene-editor__title", "font-pixel")}>Scene editor</h1>
          <p className="scene-editor__subtitle">
            Capability Network — drag from the palette, drop on the stage, save to
            data/scene-capabilities.ts
          </p>
        </div>
        <div className="scene-editor__toolbar">
          {(["desktop", "mobile"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLayoutId(id)}
              className={cn(btnCls, layoutId === id && "master-console__button--active")}
            >
              {id}
            </button>
          ))}
          <label className={labelCls}>
            snap
            <select
              className={inputCls}
              value={snap}
              onChange={(e) => setSnap(Number(e.target.value))}
            >
              {SNAP_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
          </label>
          <button type="button" className={btnCls} onClick={() => save("scene", scene, "data/scene-capabilities.ts")}>
            Save
          </button>
          <button
            type="button"
            className={btnCls}
            onClick={() => {
              navigator.clipboard?.writeText(JSON.stringify(scene, null, 2));
              setMessage({ kind: "ok", text: "Scene JSON copied to clipboard." });
            }}
          >
            Copy JSON
          </button>
        </div>
      </header>

      {sidecarUp === false && (
        <div className={cn("master-console__banner", "master-console__banner--warn")}>
          Dev only — the save sidecar isn’t reachable. Run <code>npm run master</code> beside{" "}
          <code>npm run dev</code>. You can still arrange the scene and use “Copy JSON”.
        </div>
      )}
      {message && (
        <div
          className={cn(
            "master-console__banner",
            message.kind === "ok" ? "master-console__banner--ok" : "master-console__banner--err",
          )}
        >
          {message.text}
        </div>
      )}

      <div className="scene-editor__layout">
        {/* palette */}
        <aside className="scene-editor__panel scene-editor__palette">
          <p className={cn("scene-editor__panel-title", "font-pixel")}>Palette</p>
          <p className="scene-editor__hint">Drag onto the stage.</p>

          <p className={cn("scene-editor__group-title", "font-pixel")}>Components</p>
          <div className="scene-editor__palette-grid">
            {SCENE_COMPONENT_NAMES.map((name) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/scene-item", `component:${name}`)}
                className="scene-editor__palette-item"
                title={name}
              >
                {name}
              </div>
            ))}
          </div>

          {spriteGroups.map(({ group, paths }) => (
            <div key={group}>
              <p className={cn("scene-editor__group-title", "font-pixel")}>{group}</p>
              <div className="scene-editor__palette-grid">
                {paths.map((path) => (
                  <div
                    key={path}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/scene-item", path)}
                    className="scene-editor__palette-item"
                    title={path}
                  >
                    {path.split(".").pop()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* stage */}
        <section className="scene-editor__stage-wrap">
          <div className="scene-editor__world-size">
            <label className={labelCls}>
              world w
              <input
                type="number"
                className={inputCls}
                value={layout.world.w}
                onChange={(e) =>
                  setScene((s) => ({
                    ...s,
                    [layoutId]: { ...s[layoutId], world: { ...s[layoutId].world, w: Number(e.target.value) || 1 } },
                  }))
                }
              />
            </label>
            <label className={labelCls}>
              world h
              <input
                type="number"
                className={inputCls}
                value={layout.world.h}
                onChange={(e) =>
                  setScene((s) => ({
                    ...s,
                    [layoutId]: { ...s[layoutId], world: { ...s[layoutId].world, h: Number(e.target.value) || 1 } },
                  }))
                }
              />
            </label>
            <span className="scene-editor__hint">fit {(fit * 100).toFixed(0)}%</span>
          </div>

          <div
            ref={hostRef}
            className="scene-editor__stage"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onKeyDown={onKeyDown}
            tabIndex={0}
          >
            <div
              ref={worldRef}
              className="scene-editor__world"
              style={{ width: layout.world.w, height: layout.world.h, transform: `scale(${fit})` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {layout.items.map((item) => (
                <div
                  key={item.id}
                  data-scene-id={item.id}
                  className={cn(
                    "scene-editor__item",
                    item.id === selectedId && "scene-editor__item--selected",
                    item.hidden && "scene-editor__item--hidden",
                  )}
                  style={{ left: item.x, top: item.y, zIndex: item.z }}
                >
                  <SceneItemView item={item} positioned={false} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* properties + layers */}
        <aside className="scene-editor__panel">
          <p className={cn("scene-editor__panel-title", "font-pixel")}>
            {selected ? selected.label ?? selected.id : "Nothing selected"}
          </p>

          {selected && (
            <ItemForm
              key={`${layoutId}:${selected.id}`}
              item={selected}
              onChange={(patch) => patchItem(selected.id, patch)}
              onDuplicate={() => duplicateItem(selected.id)}
              onRemove={() => removeItem(selected.id)}
            />
          )}

          <p className={cn("scene-editor__group-title", "font-pixel")}>Layers (top first)</p>
          <ul className="scene-editor__layers">
            {sortedByZ.map((item) => (
              <li key={item.id} className="scene-editor__layer">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "scene-editor__layer-name",
                    item.id === selectedId && "scene-editor__layer-name--active",
                  )}
                >
                  {item.label ?? item.id}
                  {item.hidden ? " (hidden)" : ""}
                </button>
                <button type="button" className="scene-editor__layer-btn" onClick={() => shift(item.id, 1)} title="Bring forward">
                  ▲
                </button>
                <button type="button" className="scene-editor__layer-btn" onClick={() => shift(item.id, -1)} title="Send back">
                  ▼
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}

/** Property fields for the selected item. Keyed by id upstream, so switching
 *  selection remounts these rather than carrying stale input state over. */
function ItemForm({
  item,
  onChange,
  onDuplicate,
  onRemove,
}: {
  item: SceneItem;
  onChange: (patch: Partial<SceneItem>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const num = (v: string) => (v === "" ? 0 : Number(v));
  const scalable = item.kind === "component" ? SCENE_COMPONENTS[item.component]?.scalable : true;

  return (
    <div className="scene-editor__form">
      <label className={labelCls}>
        label
        <input
          className={inputCls}
          value={item.label ?? ""}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </label>

      <div className="scene-editor__row">
        <label className={labelCls}>
          x
          <input type="number" className={inputCls} value={item.x} onChange={(e) => onChange({ x: num(e.target.value) })} />
        </label>
        <label className={labelCls}>
          y
          <input type="number" className={inputCls} value={item.y} onChange={(e) => onChange({ y: num(e.target.value) })} />
        </label>
      </div>

      <div className="scene-editor__row">
        <label className={labelCls}>
          scale
          <input
            type="number"
            step="0.05"
            min="0.01"
            className={inputCls}
            value={item.scale}
            onChange={(e) => onChange({ scale: num(e.target.value) || 0.01 })}
            disabled={!scalable}
            title={scalable ? undefined : "This component sizes itself from its own sprites"}
          />
        </label>
        <label className={labelCls}>
          z
          <input type="number" className={inputCls} value={item.z} onChange={(e) => onChange({ z: num(e.target.value) })} />
        </label>
      </div>

      <div className="scene-editor__row">
        <label className={cn(labelCls, "scene-editor__check")}>
          <input type="checkbox" checked={item.flip ?? false} onChange={(e) => onChange({ flip: e.target.checked })} />
          flip
        </label>
        <label className={cn(labelCls, "scene-editor__check")}>
          <input type="checkbox" checked={item.hidden ?? false} onChange={(e) => onChange({ hidden: e.target.checked })} />
          hidden
        </label>
      </div>

      {item.kind === "sprite" && (
        <div className="scene-editor__row">
          <label className={labelCls}>
            frameMs
            <input
              type="number"
              className={inputCls}
              value={item.frameMs ?? ""}
              placeholder="registry"
              onChange={(e) => onChange({ frameMs: e.target.value === "" ? undefined : num(e.target.value) })}
            />
          </label>
          <label className={cn(labelCls, "scene-editor__check")}>
            <input type="checkbox" checked={item.bob ?? false} onChange={(e) => onChange({ bob: e.target.checked })} />
            bob
          </label>
        </div>
      )}

      {item.kind === "component" && item.component === "TransporterBelt" && (
        <label className={labelCls}>
          segments
          <input
            type="number"
            min="0"
            className={inputCls}
            value={Number(item.props?.segments ?? 0)}
            onChange={(e) => onChange({ props: { ...item.props, segments: num(e.target.value) } })}
          />
        </label>
      )}

      <p className="scene-editor__hint">
        {item.kind === "sprite" ? item.sprite : item.component}
      </p>

      <div className="scene-editor__row">
        <button type="button" className={btnCls} onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className={cn(btnCls, "master-console__remove")} onClick={onRemove}>
          Delete
        </button>
      </div>
    </div>
  );
}
