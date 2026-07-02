"use client";

/**
 * ProjectFolders — terminal-style project dossier Tabs panel.
 */

import { useState } from "react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/icon";
import { featuredProjects } from "@/data/projects";
import type { Project } from "@/types";


function ProjectDetail({ p }: { p: Project }) {
  return (
    <div className="p-6 sm:p-8">
      <div className="font-pixel text-[0.5rem] uppercase tracking-wider text-ops-olive">
        {p.category} · {p.year} · {p.status}
      </div>
      <h3 className="font-pixel mt-3 text-sm text-ops-sand sm:text-base">
        {p.name}
      </h3>
      <p className="font-pixel-readable mt-1 text-xl text-ops-rust">{p.tagline}</p>
      <p className="font-pixel-readable mt-4 max-w-2xl text-lg leading-snug text-ops-sand-soft">
        {p.overview}
      </p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {p.highlights.map((h) => (
          <li
            key={h}
            className="font-pixel-readable flex items-start gap-2 text-base leading-snug text-ops-sand"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-ops-rust" />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        {p.stack.map((s) => (
          <span
            key={s}
            className="font-pixel-readable rounded border border-ops-line px-2 py-0.5 text-sm text-ops-sand-soft"
          >
            {s}
          </span>
        ))}
      </div>

      {(p.links.github || p.links.live) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {p.links.github && (
            <a
              href={p.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel inline-flex items-center gap-2 rounded-md border border-ops-line bg-ops-surface-2 px-3 py-2 text-[0.5rem] uppercase tracking-wider text-ops-sand transition-colors hover:border-ops-rust/60 hover:text-ops-rust"
            >
              <Icon name="Github" size={14} />
              Source
            </a>
          )}
          {p.links.live && (
            <a
              href={p.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel inline-flex items-center gap-2 rounded-md border border-ops-line bg-ops-surface-2 px-3 py-2 text-[0.5rem] uppercase tracking-wider text-ops-sand transition-colors hover:border-ops-rust/60 hover:text-ops-rust"
            >
              <Icon name="ExternalLink" size={14} />
              Live
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectFolders({
  items = featuredProjects,
}: {
  /** Projects to surface as dossier tabs. Defaults to featured projects. */
  items?: Project[];
}) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  const tabs: TabItem[] = items.map((p) => ({
    title: p.name,
    value: p.id,
    content: <ProjectDetail p={p} />,
  }));

  return (
    <div>
      <div className="font-pixel text-[0.5rem] uppercase tracking-wider text-ops-olive">
        02 — Project Dossiers
      </div>

      <div className="mt-6">
        <Tabs tabs={tabs} value={activeId} onValueChange={setActiveId} />
      </div>
    </div>
  );
}
