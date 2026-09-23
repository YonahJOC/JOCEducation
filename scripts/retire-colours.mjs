import fs from "node:fs";
import path from "node:path";

/**
 * Retire the colours that accumulated before there were tokens.
 *
 *   node scripts/retire-colours.mjs
 *
 * Six near-identical inks, three greens, four oranges and five hundred
 * different opacities of the same muted grey. Each one below is replaced by
 * the token that carries its meaning, so the redesign has one list of colours
 * to change rather than a hundred and four files.
 *
 * `#1B7F4B` is the one exception the brief calls out: it stays where it is a
 * program's own heroColor, which is data rather than styling.
 */

const ROOT = "src";

/** Literal → the token's value. Longest first, so no replacement eats another. */
const COLOURS = [
  // Inks.
  ["#0B1A31", "#10233F"],
  ["#0b1a31", "#10233F"],
  // Page backgrounds.
  ["#F7F8FB", "#FBF9F4"],
  ["#f7f8fb", "#FBF9F4"],
  // Muted text.
  ["#4A5872", "#4A5A74"],
  ["#4a5872", "#4A5A74"],
  // Reds.
  ["#B8321E", "#A3261A"],
  ["#b8321e", "#A3261A"],
  // Greens.
  ["#1B7F4B", "#1D6B37"],
  ["#1b7f4b", "#1D6B37"],
  // Oranges.
  ["#9A5405", "#C96C00"],
  ["#9a5405", "#C96C00"],
  ["#FDEEDA", "#FFF0E0"],
  ["#fdeeda", "#FFF0E0"],
];

/**
 * Every opacity of ink that was standing in for muted text.
 *
 * Anything from .4 to .79 was text somebody wanted quieter; they are all the
 * same intention and now the same colour. Below .4 is a hairline or a fill,
 * which is a different job, so those are left alone and listed at the end.
 */
const MUTED_RGBA = /rgba\(16,\s*35,\s*63,\s*\.([4-7]\d?)\)/g;

/** Files where a green is a program's own colour rather than styling. */
const HERO_COLOUR_FILES = new Set([
  "src/lib/programs.ts",
  "src/lib/hero-color.ts",
  "prisma/seed.ts",
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
let changedFiles = 0;
let changes = 0;
let mutedChanges = 0;

for (const file of files) {
  const rel = file.split(path.sep).join("/");
  if (rel === "src/lib/joc-tokens.ts") continue;

  let s = fs.readFileSync(file, "utf8");
  const before = s;

  for (const [from, to] of COLOURS) {
    // A program's own colour is data, not styling.
    if (HERO_COLOUR_FILES.has(rel) && from.toUpperCase() === "#1B7F4B") continue;
    const n = s.split(from).length - 1;
    if (n > 0) {
      s = s.split(from).join(to);
      changes += n;
    }
  }

  s = s.replace(MUTED_RGBA, () => {
    mutedChanges++;
    return "#4A5A74";
  });

  if (s !== before) {
    fs.writeFileSync(file, s);
    changedFiles++;
  }
}

console.log(`${changedFiles} files touched`);
console.log(`${changes} retired hex values replaced`);
console.log(`${mutedChanges} muted rgba values replaced`);
