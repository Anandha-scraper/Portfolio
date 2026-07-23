"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCommands, resolveCommand, type CommandContext } from "@/lib/commands";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";
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
      className={cn("terminal", "ops")}
      role="presentation"
      onClick={() => inputRef.current?.focus()}
    >
      {/* chrome */}
      <div className="terminal__chrome">
        <div className="terminal__dots">
          <span className="terminal__dot terminal__dot--rust" />
          <span className="terminal__dot terminal__dot--sand" />
          <span className="terminal__dot terminal__dot--olive" />
        </div>
        <span className={cn("terminal__chrome-title", "font-mono")}>anandha@portfolio: ~</span>
        <span className="terminal__chrome-spacer" />
      </div>

      {/* body */}
      <div ref={scrollRef} className={cn("terminal__body", "font-mono")}>
        {lines.map((line, i) => (
          <div key={i} className="terminal__line">
            {line.type === "input" ? (
              <span>
                <span className="terminal__prompt-glyph">➜</span>{" "}
                <span className="terminal__prompt-tilde">~</span>{" "}
                <span className="terminal__text">{line.text}</span>
              </span>
            ) : line.type === "system" ? (
              <span className="terminal__text--system">{line.text}</span>
            ) : (
              <span className="terminal__text">{line.text}</span>
            )}
          </div>
        ))}

        {/* prompt */}
        <div className="terminal__input-row">
          <span className="terminal__prompt-glyph">➜</span>
          <span className="terminal__input-tilde">~</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            className="terminal__input"
          />
        </div>
      </div>
    </div>
  );
}
