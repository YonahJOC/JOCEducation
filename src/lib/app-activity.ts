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
    syncedAt: Date;
  } | null;

  /** The oldest unanswered message, where there is one. */
  message: { id: string; fromName: string | null; body: string; sentAt: Date } | null;

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
