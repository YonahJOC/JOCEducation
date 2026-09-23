import fs from "node:fs";

/**
 * Turn /admin into Today, and move SchoolTable out to its own file.
 *
 * The overview was a board of every school — something to browse rather than
 * something to do — and it lived in the same file as the table the Schools
 * page imports, which is why that page imported a component from "../page".
 *
 * A one-off, kept only so the diff is explicable.
 */

const PAGE = "src/app/admin/page.tsx";
const raw = fs.readFileSync(PAGE, "utf8");
const crlf = raw.includes("\r\n");
const s = crlf ? raw.split("\r\n").join("\n") : raw;

const marker = "export function SchoolTable({ schools }: { schools: SchoolRow[] }) {";
const at = s.indexOf(marker);
if (at === -1) throw new Error("SchoolTable not found");

const head = s.slice(0, at);
const table = s.slice(at);

// Everything SchoolTable leans on, carried across with it.
const helpers = [];
const agoStart = head.indexOf("function ago(date: Date | null): string {");
if (agoStart !== -1) {
  const agoEnd = head.indexOf("\n}\n", agoStart) + 3;
  helpers.push(head.slice(agoStart, agoEnd));
}

const component = `import Link from "next/link";
import { C, label } from "@/lib/joc-tokens";
import { Absent } from "@/components/Absent";
import { STATUS_LABELS, STATUS_COLORS, PLAN_LABELS, type SchoolRow } from "@/lib/admin-data";

/**
 * Every school, as a table.
 *
 * It used to live inside src/app/admin/page.tsx, which meant the Schools page
 * imported a component from "../page" — and that page is now Today, which has
 * no table on it at all.
 */

${helpers.join("\n")}
${table}`;

fs.writeFileSync(
  "src/components/admin/SchoolTable.tsx",
  crlf ? component.split("\n").join("\r\n") : component,
);

// The Schools page imports it from its new home.
const schools = "src/app/admin/schools/page.tsx";
const sraw = fs.readFileSync(schools, "utf8");
const scrlf = sraw.includes("\r\n");
let ss = scrlf ? sraw.split("\r\n").join("\n") : sraw;
ss = ss.replace(
  `import { SchoolTable } from "../page";`,
  `import { SchoolTable } from "@/components/admin/SchoolTable";`,
);
fs.writeFileSync(schools, scrlf ? ss.split("\n").join("\r\n") : ss);

console.log("SchoolTable moved to its own file");
