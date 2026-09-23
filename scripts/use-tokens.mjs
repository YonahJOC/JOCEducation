import fs from "node:fs";

/**
 * Point the console components at the shared shapes in src/lib/joc-tokens.ts.
 *
 *   node scripts/use-tokens.mjs src/components/admin/ProgramSchools.tsx …
 *
 * Every entry below is a style object that already existed, verbatim, in five
 * or six components. Replacing them changes nothing about what renders — which
 * is checked afterwards by diffing every style attribute in the rendered HTML,
 * not by trusting this file.
 *
 * Kept in the repo because the redesign coming back from Claude design will
 * want running again.
 */

/** Anchored to a whole line, so it can only ever match the token import. */
const TOKEN_IMPORT = /^import \{[^}]*\} from "@\/lib\/joc-tokens";$/m;

const SHAPES = [
  [`{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, overflow: "hidden" }`, "rowCard"],
  [`{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }`, "rowInner"],
  [`{ flex: "100 1 280px", minWidth: 0, padding: "16px 18px" }`, "rowBody"],
  [`{ flex: "1 1 200px", minWidth: 0, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }`, "rowAction"],
  [`{ borderTop: \`1px solid \${C.hairline}\`, backgroundColor: C.paper, padding: "18px" }`, "rowDetail"],
  [`{ fontFamily: "var(--font-outfit)", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 4px" }`, "rowTitle"],
  [`{ fontFamily: "var(--font-outfit)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "24px 0 2px" }`, "sectionHeading"],
  [`{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 14px", maxWidth: "64ch" }`, "sectionIntro"],
  [`{ fontFamily: "var(--font-outfit)", fontSize: "30px", fontWeight: 600, letterSpacing: "-0.03em", color: C.ink, margin: "0 0 6px" }`, "pageTitle"],
  [`{ ...chip, backgroundColor: C.panel, color: C.ink }`, "plainChip"],
  [`{ ...bandLabel, fontSize: "11px", color: C.muted, display: "block", marginBottom: "5px" }`, "fieldLabel"],
  [`{ fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "44px" }`, "quietButton"],
  [`{
          fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
          background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
          minHeight: "44px", padding: 0,
        }`, "textButton"],
  [`{
              fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
              background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
              minHeight: "44px", padding: 0,
            }`, "textButton"],
];

/** Everything joc-tokens exports, so the import can be rebuilt from usage. */
const EXPORTS = [
  "C", "R", "ROW_SHADOW", "CONTENT_MAX", "primaryButton", "secondaryButton", "chip",
  "bandLabel", "bandFigure", "rowCard", "rowInner", "rowBand", "rowBody", "rowAction",
  "rowDetail", "rowTitle", "sectionHeading", "sectionIntro", "pageTitle", "field",
  "fieldLabel", "fieldHint", "textButton", "quietButton", "filterChip", "plainChip",
  "note", "noteText",
];

/**
 * Strip comments before asking what a file uses.
 *
 * Without this, `field` and `note` count as used because the prose above them
 * happens to contain the words "field" and "note" — and the import ends up
 * carrying names nothing references.
 */
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^[ \t]*\/\/.*$/gm, " ");
}

/**
 * Is this identifier used, as a whole word, anywhere in the text?
 *
 * A dot before it disqualifies the match: `item.note` is a property on a
 * meeting item, not the `note` token, and counting it imports a name nothing
 * references.
 */
function uses(text, name) {
  const word = /[A-Za-z0-9_$]/;
  let i = text.indexOf(name);
  while (i !== -1) {
    const after = text[i + name.length] ?? "";
    const before = i === 0 ? "" : text[i - 1];

    // `item.note` is a property; `...bandLabel` is the token being spread.
    // Both start with a dot, and only the first one should disqualify.
    const propertyAccess = before === "." && text.slice(i - 3, i) !== "...";

    if (!word.test(before) && !propertyAccess && !word.test(after)) return true;
    i = text.indexOf(name, i + 1);
  }
  return false;
}

for (const path of process.argv.slice(2)) {
  let s = fs.readFileSync(path, "utf8");
  const original = s;

  let replaced = 0;
  for (const [from, to] of SHAPES) {
    const n = s.split(from).length - 1;
    if (n > 0) {
      s = s.split(from).join(to);
      replaced += n;
    }
  }

  if (!TOKEN_IMPORT.test(s)) throw new Error(`${path}: no joc-tokens import to rewrite`);

  // Rebuild the import list from what the file — minus its own import line —
  // actually mentions, so nothing is imported and left unused.
  const body = s.replace(TOKEN_IMPORT, "");
  const used = EXPORTS.filter((name) => uses(code(body), name));
  if (used.length === 0) throw new Error(`${path}: found no token usage, refusing to empty the import`);

  const lines = [];
  let line = "";
  for (const name of used) {
    if (line.length + name.length > 82) {
      lines.push(`  ${line.trim()}`);
      line = "";
    }
    line += `${name}, `;
  }
  if (line.trim()) lines.push(`  ${line.trim()}`);

  s = s.replace(TOKEN_IMPORT, `import {\n${lines.join("\n")}\n} from "@/lib/joc-tokens";`);
  fs.writeFileSync(path, s);
  console.log(`${path.replace("src/", "").padEnd(44)} ${String(replaced).padStart(2)} shapes · ${used.length} tokens`);
}
