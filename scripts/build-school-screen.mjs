// Build the school live screen into public/school-screen/.
//
// The same arrangement as the lobby screen (see build-lobby.mjs): a hallway
// TV runs this unattended for months, so it is one small script and one
// stylesheet with none of the site in them. The output is committed; run
// `npm run build:school-screen` when src/school-screen or
// src/lib/school-screen changes.
//
// On Windows under a sandboxed shell, put
// ESBUILD_BINARY_PATH=node_modules/@esbuild/win32-x64/esbuild.exe in front.

import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "school-screen");

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, "src", "school-screen", "main.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  // TV sticks run an old Chromium.
  target: ["chrome90"],
  outfile: path.join(out, "screen.js"),
  loader: { ".css": "css" },
  absWorkingDir: root,
  alias: { "@": path.join(root, "src") },
  metafile: true,
  logLevel: "info",
});

const sizes = Object.entries(result.metafile.outputs)
  .map(([f, v]) => `${path.basename(f)} ${(v.bytes / 1024).toFixed(1)} KB`)
  .join(" · ");
console.log(`school screen built -> public/school-screen/  (${sizes})`);
