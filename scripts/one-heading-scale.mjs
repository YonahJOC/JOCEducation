import fs from "node:fs";
import path from "node:path";

/**
 * One heading scale across the portal.
 *
 *   node scripts/one-heading-scale.mjs
 *
 * Twelve page titles at four different sizes — 22, 24, 26 and 28 — with
 * nothing to distinguish them but which week they were written. They all
 * become `pageTitle`: 30/600, the one scale.
 */

const TITLE = /<h1 style=\{\{ fontWeight: \d+, fontSize: "\d+px",[^}]*\}\}>/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

let files = 0;
let headings = 0;

for (const file of [...walk("src/app/admin"), ...walk("src/app/school")]) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let s = crlf ? raw.split("\r\n").join("\n") : raw;

  const found = s.match(TITLE);
  if (!found) continue;

  s = s.replace(TITLE, "<h1 style={pageTitle}>");
  headings += found.length;

  // Make sure the token is imported.
  if (!/import \{[^}]*\bpageTitle\b[^}]*\} from "@\/lib\/joc-tokens";/.test(s)) {
    if (/from "@\/lib\/joc-tokens";/.test(s)) {
      s = s.replace(/import \{([^}]*)\} from "@\/lib\/joc-tokens";/, (m, inner) =>
        `import {${inner.replace(/\s*$/, "")}, pageTitle } from "@/lib/joc-tokens";`);
    } else {
      const end = s.indexOf("\n", s.indexOf("import "));
      s = `${s.slice(0, end + 1)}import { pageTitle } from "@/lib/joc-tokens";\n${s.slice(end + 1)}`;
    }
  }

  fs.writeFileSync(file, crlf ? s.split("\n").join("\r\n") : s);
  files++;
}

console.log(`${headings} page titles in ${files} files now use the one scale`);
