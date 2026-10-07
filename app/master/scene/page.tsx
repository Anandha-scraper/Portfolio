import type { Metadata } from "next";
import { SceneEditor } from "./scene-editor";

/**
 * /master/scene — the dev-only visual placement editor for the Capability
 * Network scene.
 *
 * Like /master, this page DOES ship in the static export (every app/ route
 * does), and like /master it's only safe because it fails closed: the save
 * sidecar is bound to 127.0.0.1 and simply isn't there in production, so the
 * page renders its "dev only" banner and can't write anything.
 */
export const metadata: Metadata = {
  title: "Scene editor",
  robots: { index: false, follow: false },
};

export default function SceneEditorPage() {
  return <SceneEditor />;
}
