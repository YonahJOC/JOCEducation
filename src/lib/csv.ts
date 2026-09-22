import type { ResponseRow } from "@/lib/forms";

/**
 * Form answers as a spreadsheet.
 *
 * Kept out of the route so it can be tested without a request, a session or a
 * database — the escaping is the part that has to be right, and it is exactly
 * the part that is awkward to check through HTTP.
 */

/**
 * Excel and Sheets treat a leading =, +, - or @ as the start of a formula, so
 * an answer typed by a stranger could run when a staff member opens the file.
 * A leading apostrophe makes it text again — it shows in the formula bar, not
 * in the cell.
 */
export function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function responsesToCsv(
  form: { fields: { label: string }[]; feeCents: number | null },
  rows: ResponseRow[],
): string {
  // Every label anybody has ever answered under, questions first in the order
  // the form asks them now. A question that was renamed or deleted keeps its
  // own column rather than dropping its answers on the floor.
  const columns = [
    ...form.fields.map((f) => f.label),
    ...rows.flatMap((r) => r.answers.map((a) => a.label)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const charges = form.feeCents != null;

  const header = ["Submitted", "Name", "Email", ...(charges ? ["Paid", "Amount"] : []), ...columns];

  const body = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.name ?? "",
      r.email ?? "",
      ...(charges
        ? [r.paid ? "paid" : "unpaid", r.amountCents != null ? (r.amountCents / 100).toFixed(2) : ""]
        : []),
      ...columns.map((c) => r.answers.find((a) => a.label === c)?.value ?? ""),
    ].map(cell).join(","),
  );

  // CRLF is what the CSV spec says and what Excel is happiest with; the BOM is
  // what stops Excel reading a UTF-8 name as mojibake.
  return `﻿${[header.map(cell).join(","), ...body].join("\r\n")}\r\n`;
}
