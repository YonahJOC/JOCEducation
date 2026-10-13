import { SchoolsGuard } from "@/components/admin/Guard";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { ClientTabs } from "@/components/admin/ClientTabs";
import { R, C } from "@/lib/joc-tokens";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { getSchools, STATUS_LABELS, STATUS_COLORS, usingSampleData, type SchoolStatus } from "@/lib/admin-data";
import { getSchoolStatus } from "@/lib/school-status";
import { NewSchoolForm } from "@/components/admin/NewSchoolForm";
import { PageIntro } from "@/components/admin/PageIntro";
import { StatusBoard } from "./status/StatusBoard";

/**
 * Client relations: the schools.
 *
 * One card a school — paid, coordinator, student list, live screen, hours
 * waiting, last spoken to, last visited, the store — with the search and
 * the status filters across the top. The cards used to live on a separate
 * Status board one link away from the list of names, which meant the list
 * said who and the board said how, and nobody wants to look in two places
 * to answer one question about a school.
 */

export const metadata = { title: "Client relations — JOC Console" };
export const dynamic = "force-dynamic";

type Search = Promise<{ status?: string; q?: string }>;

export default async function SchoolsPage({ searchParams }: { searchParams: Search }) {
  return <SchoolsGuard>{await Inner(searchParams)}</SchoolsGuard>;
}

async function Inner(searchParams: Search) {
  const { status, q } = await searchParams;
  const [all, cards, session] = await Promise.all([getSchools(), getSchoolStatus(), safeAuth()]);
  const canEdit = openForReview || can(session?.user, "schools");

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
  // The filters work on the list; the cards follow them, in the list's order.
  const order = new Map(rows.map((s, i) => [s.id, i]));
  const shown = cards
    .filter((c) => order.has(c.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const missing = {
    coordinator: shown.filter((s) => !s.coordinator).length,
    list: shown.filter((s) => !s.studentListAt).length,
    screen: shown.filter((s) => !s.liveScreenAt).length,
  };

  const statuses: (SchoolStatus | "all")[] = [
    "all", "PROSPECT", "DEMO_SCHEDULED", "TRIAL", "ACTIVE", "LAPSED", "CHURNED",
  ];

  return (
    <div>
      <ClientTabs active="schools" />
      <PageIntro
        title="Client relations"
        what="Every school, one card each: whether they've paid, who runs it there, the student list, the live screen, hours waiting, when we last spoke and visited, and the store. Click a school's name to open its plan, people and history."
        steps={[
          "Press “Add a school” to open an account. Give it a name and the email domain its staff use — anyone signing in on that domain then joins the school automatically.",
          "Tick the student list when the school sends it, the live screen when it goes up, and the store when it opens. Ticking records today's date; unticking clears it.",
          "Use “Log a visit or call” on a card the moment you notice it's overdue.",
          "Click a school's name for everything else: its plan, its seats, its people and its history.",
          "Search and the status filters narrow the cards once there are more than a screenful.",
        ]}
        note="Everything orange on a card is something missing, not something wrong. Changing a plan or status on a school's page takes effect straight away for its teachers, and nobody is emailed about it."
      >
        <NewSchoolForm disabled={usingSampleData} />

      <SectionLinks section="schools" />
      </PageIntro>

      {/* Filters */}
      <form style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, city or region"
          style={{
            flex: "1 1 220px", maxWidth: "320px", fontFamily: "var(--font-outfit)", fontSize: "14px",
            padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.hairline}`,
            backgroundColor: C.white, color: C.ink, minHeight: "40px",
          }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {statuses.map((s) => {
            const on = (status ?? "all") === s;
            const color = s === "all" ? C.blue : STATUS_COLORS[s as SchoolStatus];
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
                  backgroundColor: on ? `${color}14` : C.white,
                  color: on ? color : C.muted,
                  whiteSpace: "nowrap",
                }}
              >
                {s === "all" ? "All" : STATUS_LABELS[s as SchoolStatus]} <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </form>

      {shown.length > 0 ? (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          <Count n={shown.length} label={`school${shown.length === 1 ? "" : "s"}`} />
          {missing.coordinator > 0 && <Count n={missing.coordinator} label="with no coordinator" warn />}
          {missing.list > 0 && <Count n={missing.list} label="with no student list" warn />}
          {missing.screen > 0 && <Count n={missing.screen} label="with no live screen" warn />}
        </div>
      ) : null}

      {shown.length === 0 && (q || (status && status !== "all")) ? (
        <p style={{ fontSize: "15px", color: C.muted }}>No school matches that.</p>
      ) : (
        <StatusBoard schools={shown} canEdit={canEdit} />
      )}
    </div>
  );
}

function Count({ n, label, warn }: { n: number; label: string; warn?: boolean }) {
  return (
    <span
      style={{
        fontSize: "13px", fontWeight: 600,
        color: warn ? C.orangeText : C.muted,
        backgroundColor: warn ? C.orangeTint : C.white,
        border: `1px solid ${warn ? "rgba(154,84,5,.25)" : C.hairline}`,
        borderRadius: R.chip, padding: "6px 13px",
      }}
    >
      <strong style={{ fontWeight: 700 }}>{n}</strong> {label}
    </span>
  );
}
