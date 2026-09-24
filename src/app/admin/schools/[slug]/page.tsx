import Link from "next/link";
import { secondaryButton, R, C, label, pageTitle } from "@/lib/joc-tokens";
import { notFound } from "next/navigation";
import {
  getSchool, STATUS_LABELS, STATUS_COLORS, PLAN_LABELS, ENROLLMENT_LABELS, usingSampleData,
} from "@/lib/admin-data";
import { PlanPanel } from "@/components/admin/PlanPanel";
import { ActivityComposer } from "@/components/admin/ActivityComposer";
import { AddStaffPanel } from "@/components/admin/AddStaffPanel";
import { AppAdminToggle } from "@/components/admin/AppAdminToggle";
import { SchoolDetailsPanel } from "@/components/admin/SchoolDetailsPanel";
import { PlanRequestsPanel } from "@/components/admin/PlanRequestsPanel";
import { PageIntro } from "@/components/admin/PageIntro";
import { viewAsSchool } from "@/app/actions/view-as-school";
import { ContactsPanel, type ContactRow } from "@/components/admin/ContactsPanel";
import { SchoolsGuard } from "@/components/admin/Guard";
import { safeAuth, openForReview } from "@/auth";
import { canManageAccounts } from "@/lib/access";

const CARD: React.CSSProperties = {
  backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "20px",
};

const ACTIVITY_ICON: Record<string, string> = {
  CALL: "CALL", EMAIL: "EMAIL", MEETING: "MEETING", DEMO: "DEMO", NOTE: "NOTE",
  PLAN_CHANGE: "PLAN", ACCESS_GRANTED: "ACCESS ON", ACCESS_REVOKED: "ACCESS OFF",
  STATUS_CHANGE: "STATUS", VISIT: "VISIT", ASK: "ASKED",
};

function fmt(d: Date | null | undefined) {
  if (!d) return "Not recorded";
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SchoolDetail({ params }: { params: Promise<{ slug: string }> }) {
  // A school record is account data — plan, contacts, who has a login. The
  // list page was guarded and this one was not, so the address of any school
  // opened it for the education team too.
  //
  // Checked before the query rather than around the markup, so a refusal
  // never reads the school in the first place.
  const session = await safeAuth();
  if (!openForReview && !canManageAccounts(session?.user)) {
    return <SchoolsGuard>{null}</SchoolsGuard>;
  }
  return Inner(await params);
}

async function Inner({ slug }: { slug: string }) {
  const data = await getSchool(slug);
  const lookIn = viewAsSchool.bind(null, slug);
  if (!data) notFound();

  const { school: s, members, contacts, activities, invitations } = data;
  const details = (data as { details?: {
    city: string | null; region: string | null; website: string | null;
    type: string; enrollment: string; studentCount: number | null; emailDomains: string[];
    appSchoolId: string | null;
  } }).details;
  const planRequests = (data as { planRequests?: {
    id: string; message: string; status: string; response: string | null;
    createdAt: Date; from: string;
  }[] }).planRequests ?? [];

  return (
    <div>
      <Link href="/admin/schools" style={{ fontSize: "13px", color: C.blue, textDecoration: "none", fontWeight: 600 }}>
        ← Schools
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", margin: "12px 0 22px" }}>
        <div>
          <h1 style={pageTitle}>
            {s.name}
          </h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", fontSize: "15px", color: C.muted }}>
            <span style={{ display: "inline-block", fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: R.chip, color: STATUS_COLORS[s.status], backgroundColor: `${STATUS_COLORS[s.status]}1a` }}>
              {STATUS_LABELS[s.status]}
            </span>
            <span>{s.city ?? s.region ?? "Location not set"}</span>
            <span>·</span>
            <span>{ENROLLMENT_LABELS[s.enrollment]} students{s.studentCount ? ` (${s.studentCount})` : ""}</span>
            {s.accountManager && (<><span>·</span><span>Managed by {s.accountManager}</span></>)}
          </div>
        </div>
      </div>

      {/* The only way to answer "what does this look like for them". It reads
          their panel; it changes nothing and tells them nothing. */}
      <form action={lookIn} style={{ margin: "0 0 18px" }}>
        <button type="submit" style={{ ...secondaryButton, cursor: "pointer" }}>
          See their school panel
        </button>
      </form>

      <PageIntro
        as="h2"
        title="Running this school"
        what="Everything about one school in one place — what they pay for, who is on the account, and what has happened between them and JOC."
        steps={[
          "The plan panel is the one that matters. What you set there is what decides whether this school's teachers can open the lesson plans at all.",
          "Set the status to match reality: Trial and Active both open the materials, Lapsed and Cancelled close them. Nobody is emailed about it, so tell the school yourself.",
          "To give a school free access — a pilot, a hardship case — use the grant control rather than pretending they are paying. Write down why, and set a date to look at it again.",
          "Add their teachers by name and email. Nothing is sent to them — no school hears from us until JOC launches — so tell them yourself when you are ready.",
          "Write down anything worth remembering — a call, a visit, a complaint — in the history at the bottom. It is the only record of this relationship.",
        ]}
        note="Seats are what you agreed to, not a hard limit. If a school goes over, the console shows it rather than locking anybody out mid-year."
      />

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
              <p style={{ ...label, color: C.muted, margin: 0 }}>
                Logins ({members.length}{s.seats ? ` of ${s.seats} seats` : ""})
              </p>
            </div>
            {members.length === 0 ? (
              <p style={{ fontSize: "14px", color: C.muted, margin: "0 0 14px" }}>
                Nobody at this school has signed in yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {members.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: C.ink, margin: 0 }}>{m.name ?? m.email}</p>
                      <p style={{ fontSize: "13px", color: C.muted, margin: "1px 0 0", wordBreak: "break-all" }}>{m.email}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ ...label, color: C.muted }}>
                        {String(m.role).replace("_", " ")}
                      </span>
                      {!m.active && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: C.redText, backgroundColor: "rgba(184,50,30,.1)", padding: "2px 8px", borderRadius: R.chip }}>
                          suspended
                        </span>
                      )}
                      <AppAdminToggle
                        userId={m.id}
                        initial={Boolean((m as { schoolAppAdmin?: boolean }).schoolAppAdmin)}
                        disabled={usingSampleData}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AddStaffPanel schoolId={s.id} disabled={usingSampleData} />
          </div>

          <ContactsPanel
            schoolId={s.id}
            contacts={contacts as ContactRow[]}
            disabled={usingSampleData}
          />
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
              appSchoolId={details.appSchoolId}
              disabled={usingSampleData}
            />
          )}

          <ActivityComposer schoolId={s.id} disabled={usingSampleData} />

          <div style={CARD}>
            <p style={{ ...label, color: C.muted, margin: "0 0 16px" }}>
              History
            </p>
            {activities.length === 0 ? (
              <p style={{ fontSize: "14px", color: C.muted, margin: 0 }}>
                Nothing logged yet. Every call, email and plan change will appear here.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activities.map((a) => (
                  <div key={a.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{
                      ...label, flexShrink: 0, width: "84px", textAlign: "center",
                      backgroundColor: C.panel, color: C.blue,
                      borderRadius: "6px", padding: "4px 6px", lineHeight: 1.5,
                    }}>
                        {ACTIVITY_ICON[a.type] ?? "OTHER"}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: "15px", color: C.ink, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{a.summary}</p>
                      {a.detail && (
                        <p style={{ fontSize: "15px", color: C.muted, margin: "4px 0 0", lineHeight: 1.55 }}>{a.detail}</p>
                      )}
                      {/* An ask is the school writing to us. Everything else
                          on this list is us recording what we did, so both the
                          direction and whether anybody has answered matter. */}
                      {a.inbound && (
                        <p style={{
                          fontSize: "13px", margin: "4px 0 0", lineHeight: 1.5, fontWeight: 600,
                          color: a.answeredAt ? C.greenText : C.orangeText,
                        }}>
                          {a.answeredAt
                            ? a.reply
                              ? `Answered — they were told: "${a.reply}"`
                              : "Answered, with nothing written back"
                            : "Waiting on us"}
                        </p>
                      )}
                      <p style={{ fontSize: "12px", color: C.muted, margin: "4px 0 0" }}>
                        {fmt(a.occurredAt)}
                        {a.inbound
                          ? " · from the school"
                          : a.author
                          ? ` · ${a.author}`
                          : " · system"}
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
