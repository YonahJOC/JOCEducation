import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { flagFor, compareRows, syncAge, type Flag } from "@/lib/app-flags";
import { lastSuccessfulSync, isAppConnected } from "@/lib/app-sync";

/**
 * Every school on the JOC App, worst first.
 *
 * Reads only local tables — what the sync left behind. The console never
 * waits on the app, so an app that is slow or down makes this page old and
 * says so, rather than making it fail.
 */

export type AppRow = {
  schoolId: string;
  name: string;
  status: string;
  /** Null until somebody sets it: the school is not matched to the app yet. */
  appSchoolId: string | null;

  flag: Flag | null;

  /** Everything below is null when the app has never reported it. */
  stats: {
    minutesThisWeek: number;
    minutesThisCycle: number;
    minutesThisYear: number;
    unapprovedMinutes: number;
    unapprovedEntries: number;
    unapprovedStudents: number;
    unapprovedOldestAt: Date | null;
    unapprovedThisWeek: number;
    unapprovedOneToTwo: number;
    unapprovedOverTwo: number;
    activeStudents: number;
    activeStudentsLast: number;
    opportunitiesOpen: number;
    opportunitiesThisWeek: number;
    opportunitiesThisCycle: number;
    lastActivityAt: Date | null;
    lastActivityText: string | null;
    storeRedeemedThisMonth: number | null;
    storeTopPrize: string | null;
    storeLastRedeemedAt: Date | null;
    /// True when only the app's public endpoints answered, so every count
    /// above is a default rather than a reading.
    publicOnly: boolean;
    actsAllTime: number | null;
    hoursAllTime: number | null;
    studentsOnApp: number | null;
    syncedAt: Date;
  } | null;

  /** The oldest unanswered message, where there is one. */
  message: { id: string; fromName: string | null; body: string; sentAt: Date } | null;

  /**
   * Who at the school has a login and runs the account.
   *
   * Staff, never students. These are the people a coordinator would ring or
   * write to, which is why a name and an email are allowed here and nowhere
   * near the figures above.
   */
  admins: { id: string; name: string | null; email: string; lastSeenAt: Date | null }[];

  /**
   * What the school paid, by school year, newest first.
   *
   * A grant is counted rather than valued and a refund is its own line — the
   * same rules the Money tab follows, because a school's history should not
   * read one way here and another way there.
   */
  paidByYear: {
    schoolYear: string;
    cents: number;
    granted: number;
    refundedCents: number;
  }[];

  /** The conversation with the school, oldest first. */
  thread: {
    id: string;
    body: string;
    inbound: boolean;
    author: string | null;
    sentAt: Date;
    seenAt: Date | null;
  }[];
  /** How many of theirs nobody here has read. */
  unreadFromSchool: number;

  challenges: { title: string; joined: number; finished: number; running: boolean }[];

  /** Enrolment, for "X of Y". Null when the school record does not say. */
  enrolment: number | null;

  /** Paid for the current school year, from the real subscription. */
  payment: { state: "paid" | "granted" | "unpaid" | "unknown"; label: string };

  /** Who to ring, from the school's own contacts. */
  contact: { name: string; phone: string | null } | null;

  /** The most recent call logged against this school. */
  lastCall: { at: Date; summary: string } | null;
};

export type AppActivity = {
  rows: AppRow[];
  /** How old everything is, and whether to say so loudly. */
  sync: { stale: boolean; text: string; lastOk: Date | null; connected: boolean };
  /** Schools with no appSchoolId. They are not listed here — see the traffic light. */
  unmatchedSchools: number;
  flagged: number;
};

/** Paid, granted, or neither — said in the words the board already uses. */
function payment(sub: {
  status: string;
  grantedManually: boolean;
  grantKind: string | null;
} | null): AppRow["payment"] {
  if (!sub) return { state: "unknown", label: "Payment not recorded" };
  if (sub.grantedManually) {
    const k = sub.grantKind;
    return {
      state: "granted",
      label: k === "SCHOLARSHIP" ? "Scholarship" : k === "PILOT" ? "Pilot" : k === "COMP" ? "Comped" : "Granted",
    };
  }
  if (sub.status === "ACTIVE") return { state: "paid", label: "Paid" };
  if (sub.status === "PAST_DUE") return { state: "unpaid", label: "Not paid" };
  if (sub.status === "TRIALING") return { state: "unknown", label: "On trial" };
  return { state: "unknown", label: "Payment not recorded" };
}

export async function getAppActivity(): Promise<AppActivity> {
  const lastOk = await lastSuccessfulSync();
  const age = syncAge(lastOk);
  const sync = { stale: age.stale, text: age.text, lastOk, connected: isAppConnected };

  if (!isDatabaseConfigured()) {
    return { rows: [], sync, unmatchedSchools: 0, flagged: 0 };
  }

  try {
    const schools = await prisma.school.findMany({
      // On the app, and only on the app.
      where: { appSchoolId: { not: null } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        appSchoolId: true,
        studentCount: true,
        appStats: true,
        subscription: { select: { status: true, grantedManually: true, grantKind: true } },
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          take: 1,
          select: { name: true, phone: true },
        },
        appMessages: {
          where: { answered: false },
          orderBy: { sentAt: "asc" },
          take: 1,
          select: { id: true, fromName: true, body: true, sentAt: true },
        },
        appChallenges: {
          where: { running: true },
          orderBy: { title: "asc" },
          select: { title: true, joined: true, finished: true, running: true },
        },
        activities: {
          where: { type: "CALL" },
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true, summary: true },
        },
        members: {
          where: { role: "SCHOOL_ADMIN" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true, lastSeenAt: true },
        },
        payments: {
          orderBy: { paidAt: "desc" },
          select: { schoolYear: true, kind: true, amountCents: true },
        },
        messages: {
          orderBy: { sentAt: "asc" },
          take: 50,
          select: {
            id: true, body: true, inbound: true, sentAt: true, seenAt: true,
            author: { select: { name: true, email: true } },
          },
        },
      },
    });

    const rows: AppRow[] = schools.map((s) => {
      const st = s.appStats;
      const msg = s.appMessages[0] ?? null;

      // No figures at all means the app has never reported this school —
      // it cannot be flagged for being quiet when nobody has asked it.
      const flag = st
        ? flagFor({
            status: s.status,
            unansweredSince: msg?.sentAt ?? null,
            unapprovedMinutes: st.unapprovedMinutes,
            unapprovedOldestAt: st.unapprovedOldestAt,
            activeStudents: st.activeStudents,
            activeStudentsLast: st.activeStudentsLast,
            lastActivityAt: st.lastActivityAt,
          })
        : null;

      return {
        schoolId: s.id,
        name: s.name,
        status: s.status,
        appSchoolId: s.appSchoolId,
        flag,
        stats: st,
        admins: s.members,
        paidByYear: byYear(s.payments),
        thread: s.messages.map((m) => ({
          id: m.id,
          body: m.body,
          inbound: m.inbound,
          author: m.author?.name ?? m.author?.email ?? null,
          sentAt: m.sentAt,
          seenAt: m.seenAt,
        })),
        unreadFromSchool: s.messages.filter((m) => m.inbound && m.seenAt == null).length,
        message: msg,
        challenges: s.appChallenges,
        enrolment: s.studentCount,
        payment: payment(s.subscription),
        contact: s.contacts[0] ? { name: s.contacts[0].name, phone: s.contacts[0].phone } : null,
        lastCall: s.activities[0]
          ? { at: s.activities[0].occurredAt, summary: s.activities[0].summary }
          : null,
      };
    });

    rows.sort(compareRows);

    // Counted so the panel can say how many schools are still waiting to be
    // matched, without giving any of them a row that has nothing in it.
    const unmatchedSchools = await prisma.school.count({ where: { appSchoolId: null } });

    return {
      rows,
      sync,
      unmatchedSchools,
      flagged: rows.filter((r) => r.flag).length,
    };
  } catch {
    return { rows: [], sync, unmatchedSchools: 0, flagged: 0 };
  }
}

/**
 * A school's payments, gathered by school year.
 *
 * Fees and plan money add together — both are money that came in for that
 * year. A grant is counted, never valued, because a grant is a decision and
 * not nought dollars. A refund keeps its own figure rather than being netted
 * off, so a year that took a thousand and gave two hundred back says both.
 */
function byYear(
  payments: { schoolYear: string; kind: string; amountCents: number }[],
): { schoolYear: string; cents: number; granted: number; refundedCents: number }[] {
  const years = new Map<string, { cents: number; granted: number; refundedCents: number }>();

  for (const p of payments) {
    const y = years.get(p.schoolYear) ?? { cents: 0, granted: 0, refundedCents: 0 };
    if (p.kind === "GRANT") y.granted++;
    else if (p.kind === "REFUND") y.refundedCents += Math.abs(p.amountCents);
    else y.cents += p.amountCents;
    years.set(p.schoolYear, y);
  }

  return [...years.entries()]
    .map(([schoolYear, v]) => ({ schoolYear, ...v }))
    .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
}
