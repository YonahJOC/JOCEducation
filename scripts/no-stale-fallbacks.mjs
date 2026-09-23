import fs from "node:fs";

/**
 * Stop serving a stale list when the database cannot be read.
 *
 *   node scripts/no-stale-fallbacks.mjs
 *
 * The static arrays in programs.ts, lessons.ts and cycles.ts were the
 * fallback for an unreachable database. They had drifted: six programs
 * against eight real ones, nine lessons against thirteen, and lesson files
 * that do not exist. A school seeing six programs would have no way to know
 * it was looking at last year's list.
 *
 * An empty result is honest — the pages already say what to do when there is
 * nothing. The arrays stay in the repo as the seed for a fresh database.
 */

const EDITS = [
  [
    "src/lib/content.ts",
    `function staticLessons(): PublicLesson[] {
  return LESSONS.map((l) => ({ ...l, files: l.files.map((name) => ({ name, url: null })) }));
}`,
    `/**
 * Nothing, rather than the starter set.
 *
 * The static lessons carry file *names* with no files behind them, so serving
 * them advertises downloads that 404. The library page already says the
 * library is being built; that is the truth when the database cannot be read
 * as well as when it is empty.
 */
function staticLessons(): PublicLesson[] {
  return [];
}`,
  ],
  [
    "src/lib/content.ts",
    `  if (!isDatabaseConfigured()) return PROGRAMS;`,
    `  // No stale list. PROGRAMS drifted to six against eight real ones, and a
  // school has no way to tell which it is looking at.
  if (!isDatabaseConfigured()) return [];`,
  ],
  [
    "src/lib/content.ts",
    `    if (rows.length === 0) return PROGRAMS;`,
    `    if (rows.length === 0) return [];`,
  ],
  [
    "src/lib/content.ts",
    `    return PROGRAMS;
  }`,
    `    return [];
  }`,
  ],
];

for (const [path, from, to] of EDITS) {
  const raw = fs.readFileSync(path, "utf8");
  const crlf = raw.includes("\r\n");
  let s = crlf ? raw.split("\r\n").join("\n") : raw;
  const n = s.split(from).length - 1;
  if (n !== 1) {
    console.log(`MISS (${n}) ${path}: ${from.slice(0, 50)}`);
    continue;
  }
  s = s.replace(from, to);
  fs.writeFileSync(path, crlf ? s.split("\n").join("\r\n") : s);
  console.log(`ok ${path}`);
}

console.log("\nCycles are left alone on purpose: eight static cycles match the");
console.log("eight in the database, and a site organised around cycles with no");
console.log("cycles at all would have nothing to show rather than something stale.");
