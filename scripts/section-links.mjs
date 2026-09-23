import fs from "node:fs";

/**
 * Put the section links on each of the seven hub pages.
 *
 *   node scripts/section-links.mjs
 *
 * A one-off. Each hub gets <SectionLinks section="…" /> straight after its
 * <h1>, so the pages the sidebar no longer lists are one click from the
 * section they belong to.
 */

const HUBS = [
  ["src/app/admin/schools/page.tsx", "schools"],
  ["src/app/admin/lessons/page.tsx", "material"],
  ["src/app/admin/orders/page.tsx", "money"],
  ["src/app/admin/users/page.tsx", "access"],
  ["src/app/admin/my-programs/page.tsx", "programs"],
];

for (const [path, section] of HUBS) {
  const raw = fs.readFileSync(path, "utf8");
  const crlf = raw.includes("\r\n");
  let s = crlf ? raw.split("\r\n").join("\n") : raw;

  if (s.includes("<SectionLinks")) {
    console.log(`already done ${path}`);
    continue;
  }

  // Straight after the page's title, whichever shape it takes.
  const closes = ["</h1>", "/>"];
  let at = -1;
  for (const c of closes) {
    const i = s.indexOf(c, s.indexOf("<h1"));
    if (i !== -1 && (at === -1 || i < at)) at = i + c.length;
  }
  if (at === -1) {
    console.log(`NO TITLE ${path}`);
    continue;
  }

  s = `${s.slice(0, at)}\n\n      <SectionLinks section="${section}" />${s.slice(at)}`;

  if (!s.includes('from "@/components/admin/SectionLinks"')) {
    const end = s.indexOf("\n", s.indexOf("import "));
    s = `${s.slice(0, end + 1)}import { SectionLinks } from "@/components/admin/SectionLinks";\n${s.slice(end + 1)}`;
  }

  fs.writeFileSync(path, crlf ? s.split("\n").join("\r\n") : s);
  console.log(`ok ${path} -> ${section}`);
}
