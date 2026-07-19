"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { skillCategories } from "@/data/skills";
import { projects } from "@/data/projects";
import { parseProjectDraft, buildClaudePrompt } from "@/lib/master/parse-project";
import { cn } from "@/lib/utils";
import type { Project, SkillCategory } from "@/types";

/**
 * MasterConsole — the client side of /master (see page.tsx). Three tabs:
 *
 *   Skills   — edit levels / notes / blurbs, add & remove skills
 *   Projects — full Project editor incl. previewImages paths
 *   Import   — paste freeform notes → heuristic-parsed draft, or copy a
 *              ready-made Claude Code prompt for the AI-assisted path
 *
 * Saving POSTs the whole array to the sidecar (scripts/master-server.mjs)
 * which rewrites the data file; `next dev` hot-reloads it back in.
 */

const SIDECAR = "http://127.0.0.1:4321";

const ACCENT_OPTIONS = ["blue", "indigo", "violet", "coral", "emerald"] as const;
const CATEGORY_OPTIONS = ["web3", "platform", "enterprise", "data"] as const;
const STATUS_OPTIONS = ["shipped", "finalist", "internal", "live"] as const;

const inputCls =
  "w-full rounded-sm border border-ops-line bg-black/40 px-2 py-1.5 text-sm text-ops-sand outline-none transition-colors focus:border-ops-rust/70";
const labelCls = "mb-1 block font-pixel text-[0.55rem] uppercase tracking-widest text-ops-sand-faint";
const btnCls =
  "rounded-sm border border-ops-line px-3 py-1.5 font-pixel text-[0.6rem] uppercase tracking-wider text-ops-sand-soft transition-colors hover:border-ops-rust/60 hover:text-ops-rust";

type Tab = "skills" | "projects" | "import";

export function MasterConsole() {
  const [tab, setTab] = useState<Tab>("skills");
  const [sidecarUp, setSidecarUp] = useState<boolean | null>(null);
  const [skills, setSkills] = useState<SkillCategory[]>(() =>
    JSON.parse(JSON.stringify(skillCategories)),
  );
  const [projs, setProjs] = useState<Project[]>(() =>
    JSON.parse(JSON.stringify(projects)),
  );
  const [editingId, setEditingId] = useState<string | null>(projects[0]?.id ?? null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [importText, setImportText] = useState("");

  // sidecar health — drives the dev-only banner
  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch(`${SIDECAR}/health`)
        .then((r) => alive && setSidecarUp(r.ok))
        .catch(() => alive && setSidecarUp(false));
    check();
    const t = window.setInterval(check, 8000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const save = useCallback(async (file: "skills" | "projects", content: unknown) => {
    setMessage(null);
    try {
      const r = await fetch(`${SIDECAR}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, content }),
      });
      const body = await r.json();
      if (body.ok) setMessage({ kind: "ok", text: `Saved data/${file}.ts — dev server reloads it now.` });
      else setMessage({ kind: "err", text: `Save rejected: ${body.error}` });
    } catch {
      setSidecarUp(false);
      setMessage({ kind: "err", text: "Sidecar unreachable — run `npm run master` beside `npm run dev`." });
    }
  }, []);

  const editingProject = useMemo(
    () => projs.find((p) => p.id === editingId) ?? null,
    [projs, editingId],
  );

  const patchProject = useCallback(
    (id: string, patch: Partial<Project>) =>
      setProjs((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [],
  );

  const addProjectDraft = useCallback(
    (draft: Partial<Project>) => {
      const base: Project = {
        id: "new-project",
        name: "New Project",
        tagline: "",
        category: "platform",
        status: "shipped",
        year: String(new Date().getFullYear()),
        overview: "",
        highlights: [],
        stack: [],
        metrics: [],
        accent: "blue",
        links: {},
        related: [],
        featured: false,
        previewImages: [],
        ...draft,
      };
      let id = base.id;
      let n = 2;
      while (projs.some((p) => p.id === id)) id = `${base.id}-${n++}`;
      setProjs((ps) => [...ps, { ...base, id }]);
      setEditingId(id);
      setTab("projects");
    },
    [projs],
  );

  return (
    <main className="ops min-h-screen bg-ops-base px-4 py-8 font-pixel-readable text-ops-sand sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="font-pixel text-lg uppercase tracking-widest text-ops-rust">
            Master Console
          </h1>
          <p className="mt-1 text-sm text-ops-sand-soft">
            Edits write straight into <code>data/skills.ts</code> / <code>data/projects.ts</code> on
            disk (local dev only). Inline comments in those files are replaced by generated headers
            on first save. Review with <code>git diff</code>, then commit yourself.
          </p>
        </header>

        {sidecarUp === false && (
          <div className="mb-4 rounded-sm border border-ops-rust/60 bg-ops-rust/10 p-3 text-sm">
            <strong className="font-pixel text-[0.6rem] uppercase tracking-wider text-ops-rust">
              Dev only
            </strong>{" "}
            — the save sidecar isn&apos;t reachable. Run{" "}
            <code className="text-ops-rust">npm run master</code> next to{" "}
            <code className="text-ops-rust">npm run dev</code>, then reload. On the deployed site
            this console is read-only by design.
          </div>
        )}

        {/* tabs */}
        <div className="mb-5 flex gap-1 border-b border-ops-line">
          {(["skills", "projects", "import"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-t-sm px-4 py-2 font-pixel text-[0.6rem] uppercase tracking-wider transition-colors",
                tab === t
                  ? "border border-b-0 border-ops-line bg-ops-rust/10 text-ops-rust"
                  : "text-ops-sand-faint hover:text-ops-sand",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {message && (
          <div
            className={cn(
              "mb-4 rounded-sm border p-2 text-sm",
              message.kind === "ok"
                ? "border-emerald/50 bg-emerald/10 text-emerald"
                : "border-ops-rust/60 bg-ops-rust/10 text-ops-rust",
            )}
          >
            {message.text}
          </div>
        )}

        {/* ---- Skills tab ---- */}
        {tab === "skills" && (
          <div className="space-y-5">
            {skills.map((cat, ci) => (
              <section key={cat.id} className="rounded-sm border border-ops-line bg-black/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-pixel text-[0.7rem] uppercase tracking-widest text-ops-sand">
                    {cat.label}
                  </h2>
                  <span className="text-xs text-ops-sand-faint">{cat.skills.length} skills</span>
                </div>
                <label className={labelCls}>Blurb</label>
                <textarea
                  value={cat.blurb}
                  rows={2}
                  onChange={(e) =>
                    setSkills((s) => s.map((c, i) => (i === ci ? { ...c, blurb: e.target.value } : c)))
                  }
                  className={cn(inputCls, "resize-y")}
                />
                <div className="mt-3 space-y-2">
                  {cat.skills.map((skill, si) => (
                    <div key={si} className="flex flex-wrap items-center gap-2">
                      <input
                        value={skill.name}
                        placeholder="Skill name"
                        onChange={(e) =>
                          setSkills((s) =>
                            s.map((c, i) =>
                              i === ci
                                ? { ...c, skills: c.skills.map((k, j) => (j === si ? { ...k, name: e.target.value } : k)) }
                                : c,
                            ),
                          )
                        }
                        className={cn(inputCls, "w-auto min-w-40 flex-1")}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={skill.level}
                        onChange={(e) =>
                          setSkills((s) =>
                            s.map((c, i) =>
                              i === ci
                                ? {
                                    ...c,
                                    skills: c.skills.map((k, j) =>
                                      j === si ? { ...k, level: Math.max(0, Math.min(100, Number(e.target.value))) } : k,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                        className={cn(inputCls, "w-20")}
                      />
                      <input
                        value={skill.note ?? ""}
                        placeholder="note (optional)"
                        onChange={(e) =>
                          setSkills((s) =>
                            s.map((c, i) =>
                              i === ci
                                ? {
                                    ...c,
                                    skills: c.skills.map((k, j) =>
                                      j === si ? { ...k, note: e.target.value || undefined } : k,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                        className={cn(inputCls, "w-auto min-w-32 flex-1")}
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${skill.name}`}
                        onClick={() =>
                          setSkills((s) =>
                            s.map((c, i) => (i === ci ? { ...c, skills: c.skills.filter((_, j) => j !== si) } : c)),
                          )
                        }
                        className="px-1 text-ops-sand-faint hover:text-ops-rust"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSkills((s) =>
                      s.map((c, i) => (i === ci ? { ...c, skills: [...c.skills, { name: "", level: 50 }] } : c)),
                    )
                  }
                  className={cn(btnCls, "mt-3")}
                >
                  + Add skill
                </button>
              </section>
            ))}
            <button type="button" onClick={() => save("skills", skills)} className={cn(btnCls, "border-ops-rust/60 text-ops-rust")}>
              Save → data/skills.ts
            </button>
          </div>
        )}

        {/* ---- Projects tab ---- */}
        {tab === "projects" && (
          <div className="flex flex-col gap-5 md:flex-row">
            <aside className="shrink-0 md:w-48">
              <ul className="space-y-1">
                {projs.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setEditingId(p.id)}
                      className={cn(
                        "w-full rounded-sm border px-2 py-1.5 text-left text-sm transition-colors",
                        editingId === p.id
                          ? "border-ops-rust/60 bg-ops-rust/10 text-ops-rust"
                          : "border-ops-line text-ops-sand-soft hover:text-ops-sand",
                      )}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => addProjectDraft({})} className={cn(btnCls, "mt-3 w-full")}>
                + New project
              </button>
            </aside>

            {editingProject ? (
              <ProjectForm
                key={editingProject.id}
                project={editingProject}
                allIds={projs.map((p) => p.id)}
                onChange={(patch) => patchProject(editingProject.id, patch)}
                onDelete={() => {
                  setProjs((ps) => ps.filter((p) => p.id !== editingProject.id));
                  setEditingId(projs.find((p) => p.id !== editingProject.id)?.id ?? null);
                }}
              />
            ) : (
              <p className="text-sm text-ops-sand-faint">Select a project to edit.</p>
            )}

            <div className="md:hidden" />
          </div>
        )}
        {tab === "projects" && (
          <button
            type="button"
            onClick={() => save("projects", projs)}
            className={cn(btnCls, "mt-5 border-ops-rust/60 text-ops-rust")}
          >
            Save → data/projects.ts
          </button>
        )}

        {/* ---- Import tab ---- */}
        {tab === "import" && (
          <div className="space-y-4">
            <p className="text-sm text-ops-sand-soft">
              Paste freeform project notes (a README intro, a description, bullet points, links…).
              &ldquo;Parse&rdquo; heuristically maps them into a project draft you can review in the
              Projects tab — or copy a ready-made prompt and hand the notes to Claude Code instead.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={12}
              placeholder={"Skyloom — weather analytics dashboard\nstack: Next.js, TypeScript, PostgreSQL\nhttps://github.com/me/skyloom\n- NASA POWER data with graceful fallbacks\n- Trend detection and custom ranges\nShipped 2024."}
              className={cn(inputCls, "resize-y font-mono text-xs")}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!importText.trim()}
                onClick={() => addProjectDraft(parseProjectDraft(importText))}
                className={cn(btnCls, "disabled:opacity-40")}
              >
                Parse → project draft
              </button>
              <button
                type="button"
                disabled={!importText.trim()}
                onClick={() => {
                  navigator.clipboard?.writeText(buildClaudePrompt(importText));
                  setMessage({ kind: "ok", text: "Claude Code prompt copied to clipboard." });
                }}
                className={cn(btnCls, "disabled:opacity-40")}
              >
                Copy Claude Code prompt
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

function ProjectForm({
  project,
  allIds,
  onChange,
  onDelete,
}: {
  project: Project;
  allIds: string[];
  onChange: (patch: Partial<Project>) => void;
  onDelete: () => void;
}) {
  const lines = (arr: string[] | undefined) => (arr ?? []).join("\n");
  const fromLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Id (slug)</label>
          <input value={project.id} readOnly className={cn(inputCls, "opacity-60")} />
        </div>
        <div>
          <label className={labelCls}>Name</label>
          <input value={project.name} onChange={(e) => onChange({ name: e.target.value })} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Tagline</label>
          <input value={project.tagline} onChange={(e) => onChange({ tagline: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select
            value={project.category}
            onChange={(e) => onChange({ category: e.target.value as Project["category"] })}
            className={inputCls}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={project.status}
            onChange={(e) => onChange({ status: e.target.value as Project["status"] })}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Year</label>
          <input value={project.year} onChange={(e) => onChange({ year: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Accent</label>
          <select
            value={project.accent}
            onChange={(e) => onChange({ accent: e.target.value as Project["accent"] })}
            className={inputCls}
          >
            {ACCENT_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Overview</label>
        <textarea
          value={project.overview}
          rows={3}
          onChange={(e) => onChange({ overview: e.target.value })}
          className={cn(inputCls, "resize-y")}
        />
      </div>
      <div>
        <label className={labelCls}>Highlights (one per line)</label>
        <textarea
          value={lines(project.highlights)}
          rows={4}
          onChange={(e) => onChange({ highlights: fromLines(e.target.value) })}
          className={cn(inputCls, "resize-y")}
        />
      </div>
      <div>
        <label className={labelCls}>Stack (comma-separated)</label>
        <input
          value={project.stack.join(", ")}
          onChange={(e) => onChange({ stack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Metrics</label>
        <div className="space-y-2">
          {project.metrics.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                value={m.label}
                placeholder="label"
                onChange={(e) =>
                  onChange({ metrics: project.metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                }
                className={cn(inputCls, "w-auto min-w-36 flex-1")}
              />
              <input
                type="number"
                value={m.value}
                onChange={(e) =>
                  onChange({ metrics: project.metrics.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)) })
                }
                className={cn(inputCls, "w-24")}
              />
              <input
                value={m.prefix ?? ""}
                placeholder="prefix"
                onChange={(e) =>
                  onChange({
                    metrics: project.metrics.map((x, j) => (j === i ? { ...x, prefix: e.target.value || undefined } : x)),
                  })
                }
                className={cn(inputCls, "w-24")}
              />
              <input
                value={m.suffix ?? ""}
                placeholder="suffix"
                onChange={(e) =>
                  onChange({
                    metrics: project.metrics.map((x, j) => (j === i ? { ...x, suffix: e.target.value || undefined } : x)),
                  })
                }
                className={cn(inputCls, "w-24")}
              />
              <button
                type="button"
                aria-label="Remove metric"
                onClick={() => onChange({ metrics: project.metrics.filter((_, j) => j !== i) })}
                className="px-1 text-ops-sand-faint hover:text-ops-rust"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ metrics: [...project.metrics, { label: "", value: 0 }] })}
          className={cn(btnCls, "mt-2")}
        >
          + Add metric
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>GitHub link</label>
          <input
            value={project.links.github ?? ""}
            onChange={(e) => onChange({ links: { ...project.links, github: e.target.value || undefined } })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Live link</label>
          <input
            value={project.links.live ?? ""}
            onChange={(e) => onChange({ links: { ...project.links, live: e.target.value || undefined } })}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Related project ids (comma-separated: {allIds.join(", ")})</label>
        <input
          value={project.related.join(", ")}
          onChange={(e) => onChange({ related: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>
          Preview images (one path per line — drop files in public/projects/{project.id}/)
        </label>
        <textarea
          value={lines(project.previewImages)}
          rows={3}
          placeholder={`/projects/${project.id}/01.png`}
          onChange={(e) => onChange({ previewImages: fromLines(e.target.value) })}
          className={cn(inputCls, "resize-y font-mono text-xs")}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={project.featured}
            onChange={(e) => onChange({ featured: e.target.checked })}
          />
          Featured
        </label>
        <button type="button" onClick={onDelete} className={cn(btnCls, "hover:border-ops-rust hover:text-ops-rust")}>
          Delete project
        </button>
      </div>
    </div>
  );
}
