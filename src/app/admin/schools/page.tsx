import { AccountsGuard } from "@/components/admin/AccountsGuard";
import { getSchools, STATUS_LABELS, STATUS_COLORS, type SchoolStatus } from "@/lib/admin-data";
import { SchoolTable } from "../page";

const INK = "#10233F";

export const metadata = { title: "Schools — JOC Console" };

type Search = Promise<{ status?: string; q?: string }>;

export default async function SchoolsPage({ searchParams }: { searchParams: Search }) {
  return <AccountsGuard>{await Inner(searchParams)}</AccountsGuard>;
}

async function Inner(searchParams: Search) {
  const { status, q } = await searchParams;
  const all = await getSchools();

  let rows = all;
  if (status && status !== "all") rows = rows.filter((s) => s.status === status);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        (s.region ?? "").toLowerCase().includes(needle) ||
        (s.city ?? "").toLowerCase().includes(needle)
    );
  }

  const statuses: (SchoolStatus | "all")[] = [
    "all", "PROSPECT", "DEMO_SCHEDULED", "TRIAL", "ACTIVE", "LAPSED", "CHURNED",
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "6px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: 0 }}>
          Schools
        </h1>
      </div>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>
        {all.length} accounts. Click a school to manage its plan, people and history.
      </p>

      {/* Filters */}
      <form style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, city or region"
          style={{
            flex: "1 1 220px", maxWidth: "320px", fontFamily: "var(--font-outfit)", fontSize: "14px",
            padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(16,35,63,.15)",
            backgroundColor: "#fff", color: INK, outline: "none", minHeight: "40px",
          }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {statuses.map((s) => {
            const on = (status ?? "all") === s;
            const color = s === "all" ? "#2D46AF" : STATUS_COLORS[s as SchoolStatus];
            const count = s === "all" ? all.length : all.filter((x) => x.status === s).length;
            return (
              <button
                key={s}
                name="status"
                value={s}
                type="submit"
                style={{
                  fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600,
                  padding: "8px 13px", borderRadius: "9999px", cursor: "pointer", minHeight: "40px",
                  border: on ? `1.5px solid ${color}` : "1px solid rgba(16,35,63,.14)",
                  backgroundColor: on ? `${color}14` : "#fff",
                  color: on ? color : "rgba(16,35,63,.7)",
                  whiteSpace: "nowrap",
                }}
              >
                {s === "all" ? "All" : STATUS_LABELS[s as SchoolStatus]} <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </form>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
        <SchoolTable schools={rows} />
      </div>
    </div>
  );
}
