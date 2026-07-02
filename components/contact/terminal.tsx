"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCommands, resolveCommand, type CommandContext } from "@/lib/commands";
import { scrollToSection } from "@/lib/scroll";
import type { SectionId } from "@/types";

interface Line {
  type: "input" | "output" | "system";
  text: string;
}

const INTRO: Line[] = [
  { type: "system", text: "anandha-portfolio v1.0 — interactive shell" },
  { type: "system", text: "Type 'help' to list commands." },
];

export function Terminal() {
  const [lines, setLines] = useState<Line[]>(INTRO);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = useMemo(() => buildCommands(), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const ctx: CommandContext = {
    scrollTo: (id: SectionId) => scrollToSection(id),
    openUrl: (url) => {
      if (url.startsWith("mailto:")) window.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    },
    print: (out) =>
      setLines((prev) => [...prev, ...out.map((t) => ({ type: "output" as const, text: t }))]),
    clear: () => setLines([]),
  };

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    setLines((prev) => [...prev, { type: "input", text: trimmed }]);
    if (trimmed) {
      setHistory((h) => [trimmed, ...h]);
      const cmd = resolveCommand(trimmed, commands);
      if (cmd) cmd.run(ctx);
      else
        ctx.print([
          `command not found: ${trimmed.split(/\s+/)[0]}`,
          "Type 'help' for available commands.",
        ]);
    }
    setValue("");
    setHistIdx(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit(value);
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      if (history[next] !== undefined) {
        setHistIdx(next);
        setValue(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIdx - 1;
      if (next < 0) {
        setHistIdx(-1);
        setValue("");
      } else {
        setHistIdx(next);
        setValue(history[next]);
      }
    }
  };

  return (
    <div
      className="ops overflow-hidden rounded-card border border-ops-line bg-ops-base shadow-float"
      onClick={() => inputRef.current?.focus()}
    >
      {/* chrome */}
      <div className="flex items-center justify-between border-b border-ops-line bg-ops-surface/90 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ops-rust" />
          <span className="h-2.5 w-2.5 rounded-full bg-ops-sand-soft" />
          <span className="h-2.5 w-2.5 rounded-full bg-ops-olive" />
        </div>
        <span className="font-mono text-[0.7rem] text-ops-sand-soft">
          anandha@portfolio: ~
        </span>
        <span className="w-12" />
      </div>

      {/* body */}
      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed sm:text-sm"
      >
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line.type === "input" ? (
              <span>
                <span className="text-ops-rust">➜</span>{" "}
                <span className="text-ops-olive">~</span>{" "}
                <span className="text-ops-sand">{line.text}</span>
              </span>
            ) : line.type === "system" ? (
              <span className="text-ops-sand-faint">{line.text}</span>
            ) : (
              <span className="text-ops-sand">{line.text}</span>
            )}
          </div>
        ))}

        {/* prompt */}
        <div className="flex items-center">
          <span className="text-ops-rust">➜</span>
          <span className="ml-2 text-ops-olive">~</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            className="ml-2 flex-1 bg-transparent text-ops-sand caret-ops-rust outline-none"
          />
        </div>
      </div>
    </div>
  );
}
