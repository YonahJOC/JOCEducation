import Link from "next/link";
import { requireSchoolPanel } from "./account-only";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { STAGE_LABEL, STAGE_MEANING, STAGE_TONE, type Stage } from "@/lib/program-enrollment";
import { stepFor, STEPS, STEP_NEXT } from "@/lib/program-step";
import {
  C, R, rowCard, rowInner, rowBand, rowBody, rowAction,
  rowTitle, label, F, pageTitle, secondaryButton,
} from "@/lib/joc-tokens";

/**
 * Today, for a school.
 *
 * The school panel used to open on its teacher list, which is an admin chore
 * rather than the reason anybody signs in. This is where each program has got
 * to and what happens next — plus, for whoever runs the account, the two
 * things that go wrong quietly: teachers who never signed in, and a renewal
 * nobody is watching.
 */

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export default async function SchoolToday() {
  await requireSchoolPanel();

  const session = await safeAuth();
  const schoolId = session?.user?.schoolId ?? null;
  const runsAccount = openForReview || canRunOwnSchool(session?.user);

  if (!isDatabaseConfigured() || !schoolId) {
    return (
      <div>
        <h1 style={pageTitle}>Today</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.6, margin: 0 }}>
          Your account is not attached to a school yet, so there is nothing to show.
        </p>
      </div>
    );
  }

  const [enrollments, school, unread, invitations] = await Promise.all([
    prisma.programEnrollment.findMany({
      where: { schoolId },
      select: {
        stage: true, stageSince: true,
        program: { select: { name: true, slug: true, heroColor: true } },
      },
    }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true, unapprovedHours: true, unapprovedCheckedAt: true,
        appStats: { select: { unapprovedMinutes: true, syncedAt: true } },
        subscription: { select: { currentPeriodEnd: true, seats: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.eventReport.count({
      where: { ambassador: { schoolId }, seenBySupervisorAt: null },
    }),
    prisma.invitation.count({ where: { schoolId, status: "PENDING" } }),
  ]);

  // Furthest along first, so what is running reads before what is being set up.
  const rows = enrollments
    .map((e) => ({ ...e, step: stepFor(e.stage as Stage) }))
    .sort((a, b) => b.step - a.step || a.program.name.localeCompare(b.program.name));

  const hours = school?.appStats
    ? { minutes: school.appStats.unapprovedMinutes, at: school.appStats.syncedAt }
    : school?.unapprovedHours != null
    ? { minutes: school.unapprovedHours * 60, at: school.unapprovedCheckedAt }
    : null;

  return (
    <div>
      <h1 style={pageTitle}>Today</h1>
      <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: "0 0 22px", maxWidth: "62ch" }}>
        Where each of your programs has got to, and the one thing that happens next on each.
      </p>

      {/* What needs somebody at the school, before the programs. */}
      <div style={{ display: "grid", gap: "10px", marginBottom: "22px" }}>
        {hours && hours.minutes > 0 && (
          <Notice tone="warn">
            <strong>{(hours.minutes / 60).toFixed(1)} hours</strong> of chesed are waiting for a
            teacher to approve them.{" "}
            {hours.at
              ? `Read from the JOC App on ${day(hours.at)}.`
              : "Nobody has recorded when this was last checked."}
          </Notice>
        )}

        {unread > 0 && (
          <Notice tone="info">
            <strong>{unread} ambassador report{unread === 1 ? "" : "s"}</strong> nobody has read.{" "}
            <Link href="/school/ambassadors" style={{ color: C.blue, fontWeight: 700 }}>Read them</Link>
          </Notice>
        )}

        {runsAccount && invitations > 0 && (
          <Notice tone="warn">
            <strong>{invitations} teacher{invitations === 1 ? "" : "s"}</strong> were invited and
            have never signed in.{" "}
            <Link href="/school/teachers" style={{ color: C.blue, fontWeight: 700 }}>Open your teachers</Link>
          </Notice>
        )}

        {runsAccount && school?.subscription?.currentPeriodEnd && (
          <Notice tone={daysUntil(school.subscription.currentPeriodEnd) < 60 ? "warn" : "info"}>
            Your plan renews on <strong>{day(school.subscription.currentPeriodEnd)}</strong>
            {school.subscription.seats != null && `, with ${school._count.members} of ${school.subscription.seats} seats used`}.
          </Notice>
        )}
      </div>

      <h2 style={{ fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 12px" }}>
        Your programs
      </h2>

      {rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "28px 24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "58ch" }}>
            Your school is not down as running any JOC program yet. That fills in as JOC records
            them — there is nothing for you to do here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {rows.map((e) => {
            const stage = e.stage as Stage;
            const tone = STAGE_TONE[stage];
            return (
              <div key={e.program.slug} style={rowCard}>
                <div style={rowInner}>
                  <div style={{
                    ...rowBand,
                    backgroundColor: tone === "going" ? C.greenTint : tone === "setup" ? C.blueTint : C.panel,
                    color: tone === "going" ? C.greenText : tone === "setup" ? C.blue : C.muted,
                  }}>
                    <span style={{ ...label, color: "inherit" }}>Step 0{e.step} of 0{STEPS}</span>
                    <span style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, color: "inherit" }}>
                      {STAGE_LABEL[stage]}
                    </span>
                  </div>

                  <div style={rowBody}>
                    <p style={rowTitle}>{e.program.name}</p>
                    <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.55, margin: 0 }}>
                      {STAGE_MEANING[stage]} {STEP_NEXT[e.step]}
                    </p>
                  </div>

                  <div style={rowAction}>
                    <Link href={`/programs/${e.program.slug}`} style={{ ...secondaryButton, textDecoration: "none" }}>
                      Open the program
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function daysUntil(d: Date) {
  return Math.floor((d.getTime() - Date.now()) / 86_400_000);
}

function Notice({ tone, children }: { tone: "warn" | "info"; children: React.ReactNode }) {
  const warn = tone === "warn";
  return (
    <div style={{
      backgroundColor: warn ? C.orangeTint : C.panel,
      borderRadius: R.form, padding: "14px 17px",
    }}>
      <p style={{ fontFamily: F.read, fontSize: "17px", color: warn ? C.orangeText : C.ink, margin: 0, lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  );
}
