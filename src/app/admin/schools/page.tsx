import { SchoolsGuard } from "@/components/admin/Guard";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { R, C } from "@/lib/joc-tokens";
import { getSchools, STATUS_LABELS, STATUS_COLORS, usingSampleData, type SchoolStatus } from "@/lib/admin-data";
import { NewSchoolForm } from "@/components/admin/NewSchoolForm";
import { SchoolTable } from "@/components/admin/SchoolTable";
import { PageIntro } from "@/components/admin/PageIntro";

export const metadata = { title: "Schools — JOC Console" };

type Search = Promise<{ status?: string; q?: string }>;

export default async function SchoolsPage({ searchParams }: { searchParams: Search }) {
  return <SchoolsGuard>{await Inner(searchParams)}</SchoolsGuard>;
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
      <PageIntro
        title="Schools"
        what="Every school with a JOC Education account. A school's plan is what decides whether its teachers can open the materials, so this page is the difference between a school having access and not."
        steps={[
          "Press “Add a school” to open an account. Give it a name and the email domain its staff use — anyone signing in on that domain then joins the school automatically.",
          "Click a school's name to open it. Everything about that school lives there: its plan, its seats, its people and its history.",
          "On the school's page, set the plan and the status. Trialing and Active both open the materials; Lapsed and Cancelled close them.",
          "Invite the school's teachers from the same page. Each one gets an email, and joins that school the first time they sign in.",
          "Use the search box and the status filters above to find a school once there are more than a screenful.",
        ]}
        note="Changing a plan or a status takes effect straight away for every teacher at that school. Nobody is emailed about it — tell them yourself."
      >
        <NewSchoolForm disabled={usingSampleData} />

      <SectionLinks section="schools" />
      </PageIntro>
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 20px" }}>
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
            padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.hairline}`,
            backgroundColor: "#fff", color: C.ink, outline: "none", minHeight: "40px",
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
                  fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
                  padding: "8px 13px", borderRadius: R.chip, cursor: "pointer", minHeight: "40px",
                  border: on ? `1.5px solid ${color}` : `1px solid ${C.hairline}`,
                  backgroundColor: on ? `${color}14` : "#fff",
                  color: on ? color : "#4A5A74",
                  whiteSpace: "nowrap",
                }}
              >
                {s === "all" ? "All" : STATUS_LABELS[s as SchoolStatus]} <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </form>

      <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
        <SchoolTable schools={rows} />
      </div>
    </div>
  );
}
