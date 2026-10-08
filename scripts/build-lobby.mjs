// Build the lobby TV screen into public/lobby/.
//
// The screen is deliberately not part of the Next bundle. It runs on a Fire TV
// stick in a kiosk browser, all day, every day, and the brief is eight
// kilobytes of vanilla JavaScript with none of the site's fonts, CSS or
// analytics anywhere near it. esbuild turns src/lobby-screen/main.ts and the
// shared library into one script and one stylesheet.
//
// The output is committed. Running this at deploy time would mean a bad
// esbuild install could take the whole site down to rebuild a file that
// changes a few times a year; `npm run build:lobby` regenerates it when the
// screen's source actually changes, and the diff shows what moved.
//
// On Windows under a sandboxed shell esbuild's launcher can fail to find its
// own binary. ESBUILD_BINARY_PATH=node_modules/@esbuild/win32-x64/esbuild.exe
// in front of this command fixes that; nothing else needs it.

import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "lobby");

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, "src", "lobby-screen", "main.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  // Fire TV sticks run an old Chromium. Nothing here needs anything newer.
  target: ["chrome90"],
  outfile: path.join(out, "screen.js"),
  // `import "./screen.css"` emits screen.css next to it.
  loader: { ".css": "css" },
  absWorkingDir: root,
  // The one path alias the shared library uses.
  alias: { "@": path.join(root, "src") },
  metafile: true,
  logLevel: "info",
});

const sizes = Object.entries(result.metafile.outputs)
  .map(([f, v]) => `${path.basename(f)} ${(v.bytes / 1024).toFixed(1)} KB`)
  .join(" · ");
console.log(`lobby screen built → public/lobby/  (${sizes})`);
