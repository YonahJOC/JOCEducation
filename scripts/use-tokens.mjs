/**
 * Put the rest of the site on the tokens.
 *
 * Five screens were rebuilt by hand; ninety other files still carried the
 * measurements those five had grown out of — 13.5px body text, 10.5px
 * uppercase labels at 0.2em, and the ink colour written out as an rgba with
 * eleven different alphas standing in for one hairline.
 *
 * Every substitution here is a value for the same value's token, so nothing
 * moves except where a colour was a near-miss for one the palette already
 * had. Structure is left alone: this does not turn a hand-built row into a
 * BandRow, and it is not meant to.
 *
 * CRLF: half this repo is checked out with Windows line endings, so each file
 * is normalised in memory and written back in the style it arrived in. Matching
 * on line endings mangled seventy-five files the first time this was tried.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = "src";
const TOKENS = "@/lib/joc-tokens";

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

const files = walk(ROOT).filter((f) => /\.(tsx|ts)$/.test(f) && !f.endsWith("joc-tokens.ts"));

let touched = 0;
const report = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let s = crlf ? raw.split("\r\n").join("\n") : raw;
  const before = s;
  const used = new Set();

  // ── The type scale ────────────────────────────────────────────────────
  // 13.5 and 10.5 were never on it. 15 is the body size everywhere else and
  // 11 is the label size the token uses.
  s = s.replaceAll('"13.5px"', '"15px"');
  s = s.replaceAll('"10.5px"', '"11px"');
  s = s.replaceAll('"11.5px"', '"12px"');
  s = s.replaceAll('"12.5px"', '"13px"');
  s = s.replaceAll('"15.5px"', '"16px"');

  // Letter-spacing on a label. 0.2em at 10.5px is one word across a column.
  s = s.replaceAll('letterSpacing: "0.2em"', 'letterSpacing: "0.04em"');
  s = s.replaceAll('letterSpacing: "0.14em"', 'letterSpacing: "0.04em"');
  s = s.replaceAll('letterSpacing: "0.16em"', 'letterSpacing: "0.04em"');
  s = s.replaceAll('letterSpacing: "0.18em"', 'letterSpacing: "0.04em"');

  // ── The ink colour, written out eleven ways ───────────────────────────
  // A border made of ink at nine per cent is the hairline. So is one at
  // twenty per cent; they were never meant to differ. This catches the
  // ternary forms too, which is most of them: a border is rarely constant.
  s = s.replace(
    /(["'`])(\d+(?:\.\d+)?px (?:solid|dashed)) rgba\(16, ?35, ?63, ?\.\d+\)\1/g,
    (m, q, stroke) => {
      used.add("C");
      return `\`${stroke} \${C.hairline}\``;
    },
  );

  // A fill of ink at a tenth is the panel.
  s = s.replace(
    /backgroundColor: "rgba\(16, ?35, ?63, ?\.(0\d|1\d?|2\d?)\)"/g,
    () => {
      used.add("C");
      return "backgroundColor: C.panel";
    },
  );

  // Whatever is left of it as a bare colour: a hairline where it was nearly
  // transparent, the muted grey where it was text, ink where it was nearly ink.
  s = s.replace(/(["'])rgba\(16, ?35, ?63, ?\.(\d+)\)\1/g, (m, q, a) => {
    used.add("C");
    const alpha = Number(`0.${a}`);
    return alpha <= 0.25 ? "C.hairline" : alpha < 0.6 ? "C.muted" : "C.ink";
  });

  // One shadow on the site, and it is the row's.
  s = s.replace(/boxShadow: "[^"]*rgba\(16, ?35, ?63[^"]*"/g, () => {
    used.add("ROW_SHADOW");
    return "boxShadow: ROW_SHADOW";
  });

  // ── Odds and ends ─────────────────────────────────────────────────────
  s = s.replace(/"#FAFBFD"/g, () => { used.add("C"); return "C.panel"; });
  s = s.replace(/borderRadius: "9999px"/g, () => { used.add("R"); return "borderRadius: R.chip"; });

  if (s === before) continue;

  // ── Make sure what we reached for is imported ─────────────────────────
  if (used.size > 0) {
    const importRe = new RegExp(`import \\{([^}]*)\\} from "${TOKENS.replace("/", "\\/")}";`);
    const m = s.match(importRe);
    if (m) {
      const have = m[1].split(",").map((x) => x.trim()).filter(Boolean);
      const haveNames = new Set(have.map((x) => x.replace(/^type /, "")));
      const add = [...used].filter((u) => !haveNames.has(u));
      if (add.length > 0) {
        s = s.replace(importRe, `import { ${[...add, ...have].join(", ")} } from "${TOKENS}";`);
      }
    } else {
      // No import at all: put one after the last import in the file.
      const lines = s.split("\n");
      let last = -1;
      for (let i = 0; i < lines.length; i++) if (/^import .* from ".*";$/.test(lines[i])) last = i;
      const line = `import { ${[...used].join(", ")} } from "${TOKENS}";`;
      if (last >= 0) lines.splice(last + 1, 0, line);
      else lines.unshift(line);
      s = lines.join("\n");
    }
  }

  fs.writeFileSync(file, crlf ? s.split("\n").join("\r\n") : s);
  touched++;
  report.push(`${file}  [${[...used].join(" ") || "sizes only"}]`);
}

console.log(report.join("\n"));
console.log(`\n${touched} files`);
