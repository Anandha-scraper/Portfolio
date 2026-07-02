/* eslint-disable react/no-unknown-property */
"use client";

import { useMemo, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial, useTrailTexture } from "@react-three/drei";
import * as THREE from "three";

import "./pixel-trail.css";

/**
 * PixelTrail (ref.txt #2) — a gooey pixel wake. Forked from the React Bits
 * source, but instead of following the pointer it runs in "follow mode": the
 * parent feeds the ship's normalised stage position through `positionRef`
 * ({ u, v } in 0..1, or null when idle) and a per-frame loop paints the trail
 * there. Used as the ship's wake while it sails between islands.
 */

export interface TrailPosition {
  u: number;
  v: number;
}

const GooeyFilter = ({ id = "goo-filter", strength = 10 }: { id?: string; strength?: number }) => (
  <svg className="goo-filter-container">
    <defs>
      <filter id={id}>
        <feGaussianBlur in="SourceGraphic" stdDeviation={strength} result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 100,
    pixelColor: new THREE.Color("#ffffff"),
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec2 resolution;
    uniform sampler2D mouseTrail;
    uniform float gridSize;
    uniform vec3 pixelColor;

    vec2 coverUv(vec2 uv) {
      vec2 s = resolution.xy / max(resolution.x, resolution.y);
      vec2 newUv = (uv - 0.5) * s + 0.5;
      return clamp(newUv, 0.0, 1.0);
    }

    void main() {
      vec2 screenUv = gl_FragCoord.xy / resolution;
      vec2 uv = coverUv(screenUv);

      vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;
      float trail = texture2D(mouseTrail, gridUvCenter).r;

      gl_FragColor = vec4(pixelColor, trail);
    }
  `,
);

interface SceneProps {
  gridSize: number;
  trailSize: number;
  maxAge: number;
  interpolate: number;
  pixelColor: string;
  positionRef: RefObject<TrailPosition | null>;
}

function Scene({ gridSize, trailSize, maxAge, interpolate, pixelColor, positionRef }: SceneProps) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);

  const dotMaterial = useMemo(() => new DotMaterial(), []);

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: trailSize,
    maxAge,
    interpolate: interpolate || 0.1,
    ease: (x: number) => x,
  });

  if (trail) {
    trail.minFilter = THREE.NearestFilter;
    trail.magFilter = THREE.NearestFilter;
    trail.wrapS = THREE.ClampToEdgeWrapping;
    trail.wrapT = THREE.ClampToEdgeWrapping;
  }

  // Keep the shader uniforms current, and (follow mode) paint the trail at the
  // ship's stage position — matching the shader's coverUv() mapping and flipping
  // y (DOM top-down → uv bottom-up).
  useFrame(() => {
    const u = dotMaterial.uniforms;
    u.gridSize.value = gridSize;
    u.pixelColor.value.set(pixelColor);
    u.resolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    u.mouseTrail.value = trail;

    const p = positionRef.current;
    if (!p) return;
    const m = Math.max(size.width, size.height);
    const sx = size.width / m;
    const sy = size.height / m;
    const tu = (p.u - 0.5) * sx + 0.5;
    const tv = (1 - p.v - 0.5) * sy + 0.5;
    onMove({ uv: new THREE.Vector2(tu, tv) } as never);
  });

  const scale = Math.max(viewport.width, viewport.height) / 2;

  return (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive object={dotMaterial} attach="material" />
    </mesh>
  );
}

export interface PixelTrailProps {
  positionRef: RefObject<TrailPosition | null>;
  gridSize?: number;
  trailSize?: number;
  maxAge?: number;
  interpolate?: number;
  color?: string;
  gooeyFilter?: { id: string; strength: number };
  className?: string;
}

export default function PixelTrail({
  positionRef,
  gridSize = 100,
  trailSize = 0.05,
  maxAge = 450,
  interpolate = 5.5,
  color = "#e8d9b0",
  gooeyFilter = { id: "ship-goo-filter", strength: 2 },
  className = "",
}: PixelTrailProps) {
  return (
    <>
      {gooeyFilter && <GooeyFilter id={gooeyFilter.id} strength={gooeyFilter.strength} />}
      <Canvas
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        className={`pixel-canvas ${className}`}
        style={gooeyFilter ? { filter: `url(#${gooeyFilter.id})` } : undefined}
      >
        <Scene
          gridSize={gridSize}
          trailSize={trailSize}
          maxAge={maxAge}
          interpolate={interpolate}
          pixelColor={color}
          positionRef={positionRef}
        />
      </Canvas>
    </>
  );
}
