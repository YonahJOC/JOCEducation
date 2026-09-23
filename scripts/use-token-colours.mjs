import fs from "node:fs";
import path from "node:path";

/**
 * Delete the local colour constants and read the tokens instead.
 *
 *   node scripts/use-token-colours.mjs
 *
 * 256 of them, in 75 files — the same twelve colours declared over and over
 * at the top of every component. They already hold the right values after
 * scripts/retire-colours.mjs; this removes the copies, so there is one place
 * to change a colour rather than seventy-five.
 *
 * RULE is the interesting one: it existed at four different alphas (.12, .14,
 * .15 and .16) with nothing to tell them apart, and all four become the one
 * hairline. That is a visible change, and it is the point.
 *
 * Half this repo is checked out with CRLF endings, so every file is
 * normalised to LF in memory and written back the way it came. Matching on
 * line endings directly is how the first attempt at this mangled seventy-five
 * files at once.
 */

const MAP = {
  INK: "C.ink",
  BLUE: "C.blue",
  MUTED: "C.muted",
  PAPER: "C.paper",
  PANEL: "C.panel",
  ORANGE: "C.orange",
  ORANGE_TEXT: "C.orangeText",
  GREEN: "C.greenText",
  RED: "C.redText",
  RULE: "C.hairline",
  HAIRLINE: "C.hairline",
  WHITE: "C.white",
};

/** Longest first, so ORANGE_TEXT is never matched as ORANGE. */
const NAMES = Object.keys(MAP).sort((a, b) => b.length - a.length);

const WORD = /[A-Za-z0-9_$]/;

/** Replace whole-word uses of `name`, leaving property accesses alone. */
function replaceIdentifier(text, name, replacement) {
  let out = "";
  let i = 0;
  let count = 0;
  for (;;) {
    const at = text.indexOf(name, i);
    if (at === -1) {
      out += text.slice(i);
      break;
    }
    const before = at === 0 ? "" : text[at - 1];
    const after = text[at + name.length] ?? "";
    const whole = !WORD.test(before) && before !== "." && !WORD.test(after);
    out += text.slice(i, at) + (whole ? replacement : name);
    if (whole) count++;
    i = at + name.length;
  }
  return { text: out, count };
}

/** Drop the declaration line for `name`, working on LF-normalised lines. */
function dropDeclaration(lines, name) {
  const wanted = new RegExp(`^const ${name} = "[^"]*";$`);
  const at = lines.findIndex((line) => wanted.test(line));
  if (at === -1) return false;
  lines.splice(at, 1);
  return true;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

let touchedFiles = 0;
let removed = 0;
let rewritten = 0;

for (const file of walk("src")) {
  const rel = file.split(path.sep).join("/");
  // The tokens themselves, and the contrast maths that has its own literals.
  if (rel === "src/lib/joc-tokens.ts" || rel === "src/lib/hero-color.ts") continue;

  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let s = crlf ? raw.split("\r\n").join("\n") : raw;
  const before = s;

  let lines = s.split("\n");
  const declared = NAMES.filter((name) => dropDeclaration(lines, name));
  if (declared.length === 0) continue;
  removed += declared.length;

  s = lines.join("\n");
  for (const name of declared) {
    const r = replaceIdentifier(s, name, MAP[name]);
    s = r.text;
    rewritten += r.count;
  }

  // Tidy the gap the removed block leaves behind.
  s = s.split("\n\n\n\n").join("\n\n").split("\n\n\n").join("\n\n");

  if (!s.includes('from "@/lib/joc-tokens"')) {
    const end = s.indexOf("\n", s.indexOf("import "));
    s = `${s.slice(0, end + 1)}import { C } from "@/lib/joc-tokens";\n${s.slice(end + 1)}`;
  } else if (!/import \{[^}]*\bC\b[^}]*\} from "@\/lib\/joc-tokens";/.test(s)) {
    s = s.replace(/import \{([^}]*)\} from "@\/lib\/joc-tokens";/, (m, inner) =>
      `import { C,${inner} } from "@/lib/joc-tokens";`);
  }

  if (s !== before) {
    fs.writeFileSync(file, crlf ? s.split("\n").join("\r\n") : s);
    touchedFiles++;
  }
}

console.log(`${removed} constants removed from ${touchedFiles} files`);
console.log(`${rewritten} uses pointed at the tokens`);
