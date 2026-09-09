import { AccountsGuard } from "@/components/admin/AccountsGuard";
import Link from "next/link";
import {
  getSchools, getPipeline, getRecentActivity, getDemoRequests,
  STATUS_LABELS, STATUS_COLORS, PLAN_LABELS, type SchoolRow,
} from "@/lib/admin-data";

const INK = "#10233F";
const CARD: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px",
};

function ago(date: Date | null): string {
  if (!date) return "—";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const ACTIVITY_ICON: Record<string, string> = {
  CALL: "☎", EMAIL: "✉", MEETING: "◷", DEMO: "▶", NOTE: "✎",
  PLAN_CHANGE: "⇅", ACCESS_GRANTED: "✓", ACCESS_REVOKED: "×", STATUS_CHANGE: "→",
};

export default async function AdminOverview() {
  return (<AccountsGuard>{await Inner()}</AccountsGuard>);
}
async function Inner() {
  const schools = await getSchools();
  const pipeline = await getPipeline(schools);
  const activity = await getRecentActivity(8);
  const demos = await getDemoRequests();

  const active = schools.filter((s) => s.status === "ACTIVE");
  const newDemos = demos.filter((d) => d.status === "NEW");
  const attention = schools.filter(
    (s) => s.status === "LAPSED" || s.planStatus === "PAST_DUE" ||
      (s.status === "TRIAL" && s.renewsOn && new Date(s.renewsOn) < new Date())
  );
  const students = active.reduce((n, s) => n + (s.studentCount ?? 0), 0);
  const seats = active.reduce((n, s) => n + (s.seats ?? 0), 0);

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Overview
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 24px" }}>
        Where every school stands, and what needs attention today.
      </p>

      {/* Headline numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <Metric label="Active schools" value={String(active.length)} sub={`${schools.length} accounts total`} />
        <Metric label="Students reached" value={students.toLocaleString()} sub="at active schools" />
        <Metric label="Seats sold" value={String(seats)} sub="across active plans" />
        <Metric label="New demo requests" value={String(newDemos.length)} sub="waiting for a reply" accent={newDemos.length > 0} />
      </div>

      {/* Needs attention */}
      {attention.length > 0 && (
        <div style={{ ...CARD, borderColor: "rgba(184,50,30,.28)", padding: "18px 20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#B8321E", margin: "0 0 12px" }}>
            Needs attention
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {attention.map((s) => (
              <Link key={s.id} href={`/admin/schools/${s.id}`} style={{ display: "flex", justifyContent: "space-between", gap: "14px", textDecoration: "none", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 600, color: INK }}>{s.name}</span>
                <span style={{ fontSize: "13px", color: "#B8321E" }}>
                  {s.planStatus === "PAST_DUE" ? "Payment overdue"
                    : s.status === "LAPSED" ? "Lapsed — no active plan"
                    : "Trial has run out"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {/* Pipeline */}
        <div style={{ ...CARD, padding: "20px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 16px" }}>
            Pipeline
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            {pipeline.map((p) => {
              const max = Math.max(...pipeline.map((x) => x.count), 1);
              return (
                <div key={p.status}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "13.5px", color: INK, fontWeight: 500 }}>{STATUS_LABELS[p.status]}</span>
                    <span style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", fontVariantNumeric: "tabular-nums" }}>
                      {p.count}{p.students > 0 ? ` · ${p.students.toLocaleString()} students` : ""}
                    </span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(p.count / max) * 100}%`, backgroundColor: STATUS_COLORS[p.status], borderRadius: "9999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ ...CARD, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
            <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
              Recent activity
            </p>
          </div>
          {activity.length === 0 ? (
            <p style={{ fontSize: "14px", color: "rgba(16,35,63,.5)" }}>Nothing logged yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {activity.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: "#F4F7FD", color: "#2D46AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>
                    {ACTIVITY_ICON[a.type] ?? "•"}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "14px", color: INK, margin: 0, lineHeight: 1.4 }}>{a.summary}</p>
                    <p style={{ fontSize: "12px", color: "rgba(16,35,63,.5)", margin: "2px 0 0" }}>
                      {a.schoolName ? `${a.schoolName} · ` : ""}{ago(a.occurredAt)}{a.author ? ` · ${a.author}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schools snapshot */}
      <div style={{ ...CARD, marginTop: "16px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid rgba(16,35,63,.08)" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
            Schools
          </p>
          <Link href="/admin/schools" style={{ fontSize: "13px", color: "#2D46AF", textDecoration: "none", fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        <SchoolTable schools={schools.slice(0, 6)} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{ ...CARD, padding: "16px 18px", borderColor: accent ? "rgba(250,145,45,.4)" : "rgba(16,35,63,.09)" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 8px" }}>
        {label}
      </p>
      <p style={{ fontWeight: 800, fontSize: "27px", letterSpacing: "-0.03em", color: accent ? "#C96C00" : INK, margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", margin: "6px 0 0" }}>{sub}</p>
    </div>
  );
}

export function SchoolTable({ schools }: { schools: SchoolRow[] }) {
  if (schools.length === 0) {
    return <p style={{ padding: "22px 20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>No schools yet.</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "720px" }}>
        <thead>
          <tr>
            {["School", "Status", "Plan", "Seats", "Staff", "Last contact"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr key={s.id}>
              <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                <Link href={`/admin/schools/${s.id}`} style={{ color: INK, fontWeight: 600, textDecoration: "none" }}>
                  {s.name}
                </Link>
                <span style={{ display: "block", fontSize: "12px", color: "rgba(16,35,63,.5)", marginTop: "2px" }}>
                  {s.city ?? s.region ?? "—"}{s.studentCount ? ` · ${s.studentCount} students` : ""}
                </span>
              </td>
              <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                <span style={{ display: "inline-block", fontSize: "11.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "9999px", color: STATUS_COLORS[s.status], backgroundColor: `${STATUS_COLORS[s.status]}1a`, whiteSpace: "nowrap" }}>
                  {STATUS_LABELS[s.status]}
                </span>
              </td>
              <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)", whiteSpace: "nowrap" }}>
                {s.plan ? PLAN_LABELS[s.plan] : "—"}
                {s.grantedManually && (
                  <span style={{ display: "block", fontSize: "11px", color: "#1B7F4B", fontWeight: 600 }}>granted</span>
                )}
              </td>
              <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)", fontVariantNumeric: "tabular-nums" }}>
                {s.seats ?? "—"}
              </td>
              <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)", fontVariantNumeric: "tabular-nums" }}>
                {s.memberCount}
              </td>
              <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.6)", whiteSpace: "nowrap" }}>
                {ago(s.lastActivityAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
