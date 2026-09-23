import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Reading the JOC App into this database.
 *
 * Option C, decided: a job runs every 15 minutes, pulls per-school aggregates
 * out of the app, and writes them into local tables. The console never calls
 * the app at request time — it reads what this left behind, so a slow or
 * absent app makes the page old rather than broken.
 *
 * ── The one seam ──────────────────────────────────────────────────────────
 * `fetchAppSnapshot` is the only function that talks to the app, and it is
 * the only thing the app team has to write. Everything either side of it —
 * matching schools, writing the tables, recording the run, deciding what is
 * stale — is done and tested here. Until JOC_APP_API_URL and JOC_APP_API_KEY
 * exist it reports that it is not connected, and every screen says so in
 * words rather than showing a zero.
 */

export const isAppConnected = Boolean(
  process.env.JOC_APP_API_URL && process.env.JOC_APP_API_KEY,
);

/** What the app is expected to return, per school, in one snapshot. */
export type AppSchoolSnapshot = {
  /** The school's id inside the app. The only thing we match on. */
  appSchoolId: string;

  minutesThisWeek: number;
  minutesThisCycle: number;
  minutesThisYear: number;

  unapprovedMinutes: number;
  unapprovedEntries: number;
  unapprovedStudents: number;
  unapprovedOldestAt: string | null;
  unapprovedThisWeek: number;
  unapprovedOneToTwo: number;
  unapprovedOverTwo: number;

  activeStudents: number;
  activeStudentsLast: number;

  opportunitiesOpen: number;
  opportunitiesThisWeek: number;
  opportunitiesThisCycle: number;

  lastActivityAt: string | null;
  /** Described without a name — "A student logged 1.5 hours". */
  lastActivityText: string | null;

  /** null means the app cannot answer this yet; 0 means none. */
  storeRedeemedThisMonth: number | null;
  storeTopPrize: string | null;
  storeLastRedeemedAt: string | null;

  challenges: {
    appChallengeId: string;
    title: string;
    cycleSlug: string | null;
    joined: number;
    finished: number;
    running: boolean;
  }[];

  messages: {
    appMessageId: string;
    fromName: string | null;
    body: string;
    sentAt: string;
    answered: boolean;
  }[];
};

export type AppSnapshot = { schools: AppSchoolSnapshot[] };

/**
 * THE SEAM. Replace the body of this with a real call to the JOC App.
 *
 * It must return one entry per school the app knows about, keyed by the
 * app's own school id. Anything it cannot answer comes back as null rather
 * than zero — the difference between "no redemptions" and "we cannot see
 * redemptions" is the difference between a fact and a guess, and the console
 * shows them differently.
 */
export async function fetchAppSnapshot(): Promise<AppSnapshot> {
  if (!isAppConnected) {
    throw new Error("The JOC App is not connected yet.");
  }

  const res = await fetch(`${process.env.JOC_APP_API_URL}/schools/summary`, {
    headers: { Authorization: `Bearer ${process.env.JOC_APP_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`The JOC App refused the request (${res.status}).`);
  }
  return (await res.json()) as AppSnapshot;
}

export type SyncResult = {
  ok: boolean;
  rows: number;
  /** App records whose school we could not match. Counted, never shown. */
  unmatched: number;
  error?: string;
};

const date = (v: string | null | undefined) => (v ? new Date(v) : null);

/**
 * One run: read the app, match the schools, write what matched.
 *
 * Every run is recorded whether it worked or not. A sync that fails silently
 * is worse than one that never ran, because the page goes on looking current.
 */
export async function runAppSync(): Promise<SyncResult> {
  if (!isDatabaseConfigured()) return { ok: false, rows: 0, unmatched: 0, error: "No database." };

  const run = await prisma.appSyncRun.create({ data: { status: "RUNNING" }, select: { id: true } });

  try {
    const snapshot = await fetchAppSnapshot();
    const syncedAt = new Date();

    // Matched by identifier, never by name. A school with no appSchoolId set
    // simply is not in this map, and its records are counted as unmatched.
    const schools = await prisma.school.findMany({
      where: { appSchoolId: { not: null } },
      select: { id: true, appSchoolId: true },
    });
    const byAppId = new Map(schools.map((s) => [s.appSchoolId as string, s.id]));

    let rows = 0;
    let unmatched = 0;

    for (const s of snapshot.schools) {
      const schoolId = byAppId.get(s.appSchoolId);
      if (!schoolId) {
        unmatched++;
        continue;
      }

      const stats = {
        minutesThisWeek: s.minutesThisWeek,
        minutesThisCycle: s.minutesThisCycle,
        minutesThisYear: s.minutesThisYear,
        unapprovedMinutes: s.unapprovedMinutes,
        unapprovedEntries: s.unapprovedEntries,
        unapprovedStudents: s.unapprovedStudents,
        unapprovedOldestAt: date(s.unapprovedOldestAt),
        unapprovedThisWeek: s.unapprovedThisWeek,
        unapprovedOneToTwo: s.unapprovedOneToTwo,
        unapprovedOverTwo: s.unapprovedOverTwo,
        activeStudents: s.activeStudents,
        activeStudentsLast: s.activeStudentsLast,
        opportunitiesOpen: s.opportunitiesOpen,
        opportunitiesThisWeek: s.opportunitiesThisWeek,
        opportunitiesThisCycle: s.opportunitiesThisCycle,
        lastActivityAt: date(s.lastActivityAt),
        lastActivityText: s.lastActivityText,
        storeRedeemedThisMonth: s.storeRedeemedThisMonth,
        storeTopPrize: s.storeTopPrize,
        storeLastRedeemedAt: date(s.storeLastRedeemedAt),
        syncedAt,
      };

      await prisma.appSchoolStats.upsert({
        where: { schoolId },
        create: { schoolId, ...stats },
        update: stats,
      });

      for (const c of s.challenges ?? []) {
        const row = {
          title: c.title,
          cycleSlug: c.cycleSlug,
          joined: c.joined,
          finished: c.finished,
          running: c.running,
          syncedAt,
        };
        await prisma.appChallengeStat.upsert({
          where: { schoolId_appChallengeId: { schoolId, appChallengeId: c.appChallengeId } },
          create: { schoolId, appChallengeId: c.appChallengeId, ...row },
          update: row,
        });
      }

      for (const m of s.messages ?? []) {
        const row = {
          fromName: m.fromName,
          body: m.body,
          sentAt: new Date(m.sentAt),
          answered: m.answered,
          syncedAt,
        };
        await prisma.appSchoolMessage.upsert({
          where: { appMessageId: m.appMessageId },
          create: { schoolId, appMessageId: m.appMessageId, ...row },
          update: row,
        });
      }

      rows++;
    }

    await prisma.appSyncRun.update({
      where: { id: run.id },
      data: { status: "OK", finishedAt: new Date(), rows, unmatched },
    });
    return { ok: true, rows, unmatched };
  } catch (e) {
    const error = e instanceof Error ? e.message : "The sync failed.";
    await prisma.appSyncRun
      .update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error } })
      .catch(() => null);
    return { ok: false, rows: 0, unmatched: 0, error };
  }
}

/** When the app was last read successfully. Drives the staleness banner. */
export async function lastSuccessfulSync(): Promise<Date | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const run = await prisma.appSyncRun.findFirst({
      where: { status: "OK" },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    });
    return run?.finishedAt ?? null;
  } catch {
    return null;
  }
}
