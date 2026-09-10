import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSchool, STATUS_LABELS, STATUS_COLORS, PLAN_LABELS, ENROLLMENT_LABELS, usingSampleData,
} from "@/lib/admin-data";
import { PlanPanel } from "@/components/admin/PlanPanel";
import { ActivityComposer } from "@/components/admin/ActivityComposer";
import { InvitePanel } from "@/components/admin/InvitePanel";
import { SchoolDetailsPanel } from "@/components/admin/SchoolDetailsPanel";
import { PlanRequestsPanel } from "@/components/admin/PlanRequestsPanel";

const INK = "#10233F";
const CARD: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px",
};

const ACTIVITY_ICON: Record<string, string> = {
  CALL: "☎", EMAIL: "✉", MEETING: "◷", DEMO: "▶", NOTE: "✎",
  PLAN_CHANGE: "⇅", ACCESS_GRANTED: "✓", ACCESS_REVOKED: "×", STATUS_CHANGE: "→",
};

function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SchoolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSchool(slug);
  if (!data) notFound();

  const { school: s, members, contacts, activities, invitations } = data;
  const details = (data as { details?: {
    city: string | null; region: string | null; website: string | null;
    type: string; enrollment: string; studentCount: number | null; emailDomains: string[];
  } }).details;
  const planRequests = (data as { planRequests?: {
    id: string; message: string; status: string; response: string | null;
    createdAt: Date; from: string;
  }[] }).planRequests ?? [];

  return (
    <div>
      <Link href="/admin/schools" style={{ fontSize: "13px", color: "#2D46AF", textDecoration: "none", fontWeight: 600 }}>
        ← Schools
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", margin: "12px 0 22px" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.035em", color: INK, margin: "0 0 6px" }}>
            {s.name}
          </h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", fontSize: "13.5px", color: "rgba(16,35,63,.6)" }}>
            <span style={{ display: "inline-block", fontSize: "11.5px", fontWeight: 700, padding: "3px 10px", borderRadius: "9999px", color: STATUS_COLORS[s.status], backgroundColor: `${STATUS_COLORS[s.status]}1a` }}>
              {STATUS_LABELS[s.status]}
            </span>
            <span>{s.city ?? s.region ?? "Location not set"}</span>
            <span>·</span>
            <span>{ENROLLMENT_LABELS[s.enrollment]} students{s.studentCount ? ` (${s.studentCount})` : ""}</span>
            {s.accountManager && (<><span>·</span><span>Managed by {s.accountManager}</span></>)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "16px", alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PlanPanel
            schoolId={s.id}
            plan={s.plan}
            planStatus={s.planStatus}
            seats={s.seats}
            grantedManually={s.grantedManually}
            grantKind={s.grantKind ?? null}
            grantNote={s.grantNote ?? null}
            grantReviewOn={s.grantReviewOn ? new Date(s.grantReviewOn).toISOString().slice(0, 10) : null}
            grantedBy={s.grantedBy ?? null}
            renewsOn={s.renewsOn ? new Date(s.renewsOn).toISOString().slice(0, 10) : null}
            status={s.status}
            disabled={usingSampleData}
          />

          {/* People with logins */}
          <div style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
              <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
                Logins ({members.length}{s.seats ? ` of ${s.seats} seats` : ""})
              </p>
            </div>
            {members.length === 0 ? (
              <p style={{ fontSize: "14px", color: "rgba(16,35,63,.5)", margin: "0 0 14px" }}>
                Nobody at this school has signed in yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {members.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: INK, margin: 0 }}>{m.name ?? m.email}</p>
                      <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", margin: "1px 0 0", wordBreak: "break-all" }}>{m.email}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(16,35,63,.55)", textTransform: "uppercase" }}>
                        {String(m.role).replace("_", " ")}
                      </span>
                      {!m.active && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#B8321E", backgroundColor: "rgba(184,50,30,.1)", padding: "2px 8px", borderRadius: "9999px" }}>
                          suspended
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <InvitePanel schoolId={s.id} invitations={invitations} disabled={usingSampleData} />
          </div>

          {/* Contacts */}
          <div style={CARD}>
            <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
              Contacts
            </p>
            {contacts.length === 0 ? (
              <p style={{ fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>No contacts recorded.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {contacts.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: INK, margin: 0 }}>
                      {c.name}
                      {c.isPrimary && (
                        <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#2D46AF", backgroundColor: "#F4F7FD", padding: "2px 7px", borderRadius: "9999px", marginLeft: "8px", letterSpacing: "0.06em" }}>
                          PRIMARY
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0" }}>
                      {[c.title, c.email, c.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — the relationship */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PlanRequestsPanel requests={planRequests} disabled={usingSampleData} />

          {details && (
            <SchoolDetailsPanel
              schoolId={s.id}
              name={s.name}
              city={details.city}
              region={details.region}
              website={details.website}
              type={details.type}
              enrollment={details.enrollment}
              studentCount={details.studentCount}
              emailDomains={details.emailDomains}
              disabled={usingSampleData}
            />
          )}

          <ActivityComposer schoolId={s.id} disabled={usingSampleData} />

          <div style={CARD}>
            <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 16px" }}>
              History
            </p>
            {activities.length === 0 ? (
              <p style={{ fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>
                Nothing logged yet. Every call, email and plan change will appear here.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activities.map((a) => (
                  <div key={a.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "8px", backgroundColor: "#F4F7FD", color: "#2D46AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>
                      {ACTIVITY_ICON[a.type] ?? "•"}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: "14.5px", color: INK, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{a.summary}</p>
                      {a.detail && (
                        <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.65)", margin: "4px 0 0", lineHeight: 1.55 }}>{a.detail}</p>
                      )}
                      <p style={{ fontSize: "12px", color: "rgba(16,35,63,.45)", margin: "4px 0 0" }}>
                        {fmt(a.occurredAt)}{a.author ? ` · ${a.author}` : " · system"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
