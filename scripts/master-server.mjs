/**
 * master-server — dev-only sidecar for the /master console (app/master/).
 *
 * The site is a static export with no backend, so the console can't save
 * through a Next API route. Instead this tiny dependency-free server runs
 * beside `next dev` (`npm run master`) and writes ONLY the two whitelisted
 * data files. Bound to 127.0.0.1 — never expose it.
 *
 *   GET  /health → { ok: true }
 *   POST /save   → body { file: "skills" | "projects", content: <array> }
 *
 * The deployed site still renders /master, but every fetch to this server
 * fails there, so the page just shows its "dev only" banner.
 */

import http from "node:http";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  serializeSkills,
  serializeProjects,
  validateSkills,
  validateProjects,
} from "./master-serializers.mjs";

const PORT = 4321;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = {
  skills: {
    path: path.join(ROOT, "data", "skills.ts"),
    validate: validateSkills,
    serialize: serializeSkills,
  },
  projects: {
    path: path.join(ROOT, "data", "projects.ts"),
    validate: validateProjects,
    serialize: serializeProjects,
  },
};

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  cors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/save") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) req.destroy(); // sanity cap
    });
    req.on("end", async () => {
      try {
        const { file, content } = JSON.parse(raw);
        const target = FILES[file];
        if (!target) {
          json(res, 400, { ok: false, error: `unknown file "${file}"` });
          return;
        }
        const invalid = target.validate(content);
        if (invalid) {
          json(res, 422, { ok: false, error: invalid });
          return;
        }
        await writeFile(target.path, target.serialize(content), "utf8");
        console.log(`[master] wrote data/${file}.ts`);
        json(res, 200, { ok: true });
      } catch (err) {
        json(res, 500, { ok: false, error: String(err) });
      }
    });
    return;
  }

  json(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[master] sidecar listening on http://127.0.0.1:${PORT}`);
  console.log(`[master] open http://localhost:3000/master (with \`npm run dev\` running)`);
});
