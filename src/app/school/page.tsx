import Link from "next/link";
import { requireSchoolPanel } from "./account-only";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { STAGE_LABEL, STAGE_MEANING, STAGE_TONE, type Stage } from "@/lib/program-enrollment";
import { stepFor, STEPS, STEP_NEXT } from "@/lib/program-step";
import { C, rowCard, F, pageTitle, sectionHeading, type Tone } from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";
import { currentSchoolId } from "@/lib/school-scope";

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
  const schoolId = await currentSchoolId();
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

  // Each one is a real count. Nothing appears here with nothing behind it.
  const needs: {
    label: string; figure: string; word?: boolean; title: string;
    line?: string; tone: Tone; action?: { label: string; href: string };
  }[] = [];

  if (hours && hours.minutes > 0) {
    needs.push({
      label: "To approve",
      figure: `${(hours.minutes / 60).toFixed(1)} h`,
      tone: "warn",
      title: "Chesed hours waiting on a teacher",
      line: hours.at
        ? `Read from the JOC App on ${day(hours.at)}. Teachers approve them in the app.`
        : "Nobody has recorded when this was last checked.",
    });
  }

  if (unread > 0) {
    needs.push({
      label: "Unread",
      figure: String(unread),
      tone: "info",
      title: `Ambassador report${unread === 1 ? "" : "s"} nobody has read`,
      action: { label: "Read them", href: "/school/ambassadors" },
    });
  }

  if (runsAccount && invitations > 0) {
    needs.push({
      label: "Never signed in",
      figure: String(invitations),
      tone: "warn",
      title: `Teacher${invitations === 1 ? " was" : "s were"} invited and never signed in`,
      action: { label: "Open your teachers", href: "/school/teachers" },
    });
  }

  const renews = runsAccount ? school?.subscription?.currentPeriodEnd ?? null : null;
  if (renews) {
    needs.push({
      label: "Renews",
      figure: day(renews),
      word: true,
      tone: daysUntil(renews) < 60 ? "warn" : "quiet",
      title: "Your plan",
      line: school?.subscription?.seats != null
        ? `${school._count.members} of ${school.subscription.seats} seats used.`
        : "Nobody has recorded how many seats this plan carries.",
      action: { label: "Open your plan", href: "/school/plan" },
    });
  }

  return (
    <div>
      <h1 style={pageTitle}>Today</h1>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 20px", maxWidth: "62ch" }}>
        Where each of your programs has got to, and the one thing that happens next on each.
      </p>

      {/* What needs somebody at the school, before the programs. The same row
          as everywhere else: a figure to read first, then one thing to do. */}
      {needs.length > 0 && (
        <div style={{ display: "grid", gap: "10px", marginBottom: "26px" }}>
          {needs.map((n) => (
            <BandRow
              key={n.label}
              tone={n.tone}
              label={n.label}
              figure={n.figure}
              word={n.word}
              title={n.title}
              line={n.line}
              action={n.action}
            />
          ))}
        </div>
      )}

      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Your programs</h2>

      {rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.5, maxWidth: "58ch" }}>
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
              <BandRow
                key={e.program.slug}
                tone={tone === "going" ? "good" : tone === "setup" ? "info" : "quiet"}
                label={`Step 0${e.step} of 0${STEPS}`}
                figure={STAGE_LABEL[stage]}
                word
                title={e.program.name}
                line={`${STAGE_MEANING[stage]} ${STEP_NEXT[e.step]}`}
                action={{ label: "Open the program", href: `/programs/${e.program.slug}` }}
              />
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
