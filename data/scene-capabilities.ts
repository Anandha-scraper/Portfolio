import type { Scene } from "@/types";

/**
 * Capability Network scene placement. See the Scene* types in types/index.ts
 * for what the fields mean and why coordinates are world-space.
 *
 * Maintained via the dev-only /master/scene editor (npm run master) — edits
 * are serialized by scripts/master-serializers.mjs, which rewrites this whole
 * file, so comments added here will not survive a save.
 */
export const capabilityScene: Scene = {
  "desktop": {
    "world": {
      "w": 1600,
      "h": 700
    },
    "items": []
  },
  "mobile": {
    "world": {
      "w": 720,
      "h": 250
    },
    "items": []
  }
};
