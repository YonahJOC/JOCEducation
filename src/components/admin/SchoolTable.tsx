import Link from "next/link";
import { R, C, label } from "@/lib/joc-tokens";
import { Absent } from "@/components/Absent";
import { STATUS_LABELS, STATUS_COLORS, PLAN_LABELS, type SchoolRow } from "@/lib/admin-data";

/**
 * Every school, as a table.
 *
 * It used to live inside src/app/admin/page.tsx, which meant the Schools page
 * imported a component from "../page" — and that page is now Today, which has
 * no table on it at all.
 */

function ago(date: Date | null): string {
  if (!date) return "Not set";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function SchoolTable({ schools }: { schools: SchoolRow[] }) {
  if (schools.length === 0) {
    return <p style={{ padding: "22px 20px", fontSize: "14px", color: C.muted, margin: 0 }}>No schools yet.</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", minWidth: "720px" }}>
        <thead>
          <tr>
            {["School", "Status", "Plan", "Seats", "Staff", "Last contact"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 20px", ...label, color: C.muted, borderBottom: `1px solid ${C.hairline}`, backgroundColor: C.panel, whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr key={s.id}>
              <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}` }}>
                <Link href={`/admin/schools/${s.id}`} style={{ color: C.ink, fontWeight: 600, textDecoration: "none" }}>
                  {s.name}
                </Link>
                <span style={{ display: "block", fontSize: "12px", color: C.muted, marginTop: "2px" }}>
                  {s.city ?? s.region ?? "Place not recorded"}{s.studentCount ? ` · ${s.studentCount} students` : ""}
                </span>
              </td>
              <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}` }}>
                <span style={{ display: "inline-block", fontSize: "12px", fontWeight: 700, padding: "3px 9px", borderRadius: R.chip, color: STATUS_COLORS[s.status], backgroundColor: `${STATUS_COLORS[s.status]}1a`, whiteSpace: "nowrap" }}>
                  {STATUS_LABELS[s.status]}
                </span>
              </td>
              <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: C.muted, whiteSpace: "nowrap" }}>
                {s.plan ? PLAN_LABELS[s.plan] : <Absent>No plan</Absent>}
                {s.grantedManually && (
                  <span style={{ display: "block", fontSize: "11px", color: C.greenText, fontWeight: 600 }}>granted</span>
                )}
              </td>
              <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                {s.seats ?? <Absent>Not set</Absent>}
              </td>
              <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                {s.memberCount}
              </td>
              <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: C.muted, whiteSpace: "nowrap" }}>
                {ago(s.lastActivityAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
