import type { Metadata } from "next";
import { MasterConsole } from "./master-console";

/**
 * /master — dev-only content console. Edits skill levels and project entries
 * and saves them straight into data/skills.ts / data/projects.ts through the
 * local sidecar (scripts/master-server.mjs, `npm run master`). The page ships
 * in the static export too (every app/ route does), but it's unlisted,
 * noindexed, and every save fails closed into a "dev only" banner without the
 * sidecar — it can't do anything in production.
 */

export const metadata: Metadata = {
  title: "Master Console",
  robots: { index: false, follow: false },
};

export default function MasterPage() {
  return <MasterConsole />;
}
