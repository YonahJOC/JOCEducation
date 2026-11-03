import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * A student ambassador and their teacher, in writing.
 *
 * Everything else on an ambassador's side runs one way: they send work up,
 * a teacher says yes or no, and the updates feed tells them what happened.
 * A fifteen-year-old who does not understand why their flyer was set aside
 * had nowhere to ask. This is the asking.
 *
 * Two conversations, never more: their own supervising teacher, and JOC.
 *
 * JOC is one channel to the organisation rather than a private thread with
 * each member of staff. A student writes once and whoever is around
 * answers — which is also the safer shape, because nothing between an
 * adult here and somebody's child happens somewhere only those two can
 * see it. Replies carry the name of whoever wrote them, so an answer is
 * always somebody's.
 */

export type AmbassadorMessage = {
  id: string;
  body: string;
  fromStudent: boolean;
  authorName: string | null;
  sentAt: string;
  seen: boolean;
};

/** The whole conversation, oldest first — it is read as a thread. */
export type Audience = "TEACHER" | "JOC";

/** The whole conversation, oldest first — it is read as a thread. */
export async function messagesFor(
  ambassadorId: string,
  audience: Audience = "TEACHER",
): Promise<AmbassadorMessage[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.ambassadorMessage.findMany({
    where: { ambassadorId, audience },
    orderBy: { sentAt: "asc" },
    take: 200,
    select: {
      id: true, body: true, fromStudent: true, sentAt: true, seenAt: true,
      author: { select: { name: true, email: true } },
    },
  }).catch(() => []);

  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    fromStudent: m.fromStudent,
    // The full name, or the part of an address in front of the @ — never
    // the address itself, which is the most a thread should give away.
    authorName: m.author?.name?.trim() || m.author?.email?.split("@")[0] || null,
    sentAt: m.sentAt.toISOString(),
    seen: Boolean(m.seenAt),
  }));
}

/**
 * How many the student has not opened.
 *
 * Their teacher's, not their own: a badge counting your own sent messages
 * would never go down.
 */
export async function unreadForAmbassador(userId: string | null): Promise<number> {
  if (!isDatabaseConfigured() || !userId) return 0;
  return prisma.ambassadorMessage.count({
    where: {
      ambassador: { userId, endsAt: null },
      fromStudent: false,
      seenAt: null,
    },
  }).catch(() => 0);
}

/** How many a teacher has waiting from the students they supervise. */
export async function unreadFromAmbassadors(supervisorId: string | null): Promise<number> {
  if (!isDatabaseConfigured() || !supervisorId) return 0;
  return prisma.ambassadorMessage.count({
    where: {
      ambassador: { supervisorId, endsAt: null },
      // Their own thread only. What a student writes to JOC is not the
      // teacher's to be counted on, or to read.
      audience: "TEACHER",
      fromStudent: true,
      seenAt: null,
    },
  }).catch(() => 0);
}

/**
 * Mark the other side's messages read.
 *
 * Opening the page is what "they have seen it" means — there is no tick to
 * press, and asking somebody to press one is asking them to do the
 * software's bookkeeping.
 */
export async function markThreadSeen(
  ambassadorId: string,
  byStudent: boolean,
  audience: Audience = "TEACHER",
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await prisma.ambassadorMessage.updateMany({
    // Scoped to the one conversation being read: opening the teacher's
    // thread must not quietly mark JOC's as read too.
    where: { ambassadorId, audience, fromStudent: !byStudent, seenAt: null },
    data: { seenAt: new Date() },
  }).catch(() => null);
}

/** One student's conversation with JOC, as the console lists it. */
export type JocThread = {
  ambassadorId: string;
  studentName: string;
  schoolName: string;
  programName: string;
  /** False once their time running it has finished: readable, not writable. */
  current: boolean;
  messages: AmbassadorMessage[];
  unread: number;
  lastAt: string | null;
};

/**
 * Every student who has written to JOC, newest conversation first.
 *
 * Not scoped to one member of staff. A student writes to JOC, not to
 * Dalia or to Yonah, so everybody who reads this page sees every thread
 * and whoever is around answers.
 */
export async function jocThreads(): Promise<JocThread[]> {
  if (!isDatabaseConfigured()) return [];

  const rows = await prisma.ambassadorMessage.findMany({
    where: { audience: "JOC" },
    orderBy: { sentAt: "asc" },
    take: 2000,
    select: {
      id: true, body: true, fromStudent: true, sentAt: true, seenAt: true, ambassadorId: true,
      author: { select: { name: true, email: true } },
      ambassador: {
        select: {
          endsAt: true,
          user: { select: { name: true, email: true } },
          school: { select: { name: true } },
          program: { select: { name: true } },
        },
      },
    },
  }).catch(() => []);

  const byThread = new Map<string, JocThread>();
  for (const m of rows) {
    let t = byThread.get(m.ambassadorId);
    if (!t) {
      t = {
        ambassadorId: m.ambassadorId,
        studentName: m.ambassador.user.name?.trim() || m.ambassador.user.email.split("@")[0],
        schoolName: m.ambassador.school.name,
        programName: m.ambassador.program.name,
        current: !m.ambassador.endsAt || m.ambassador.endsAt > new Date(),
        messages: [],
        unread: 0,
        lastAt: null,
      };
      byThread.set(m.ambassadorId, t);
    }
    t.messages.push({
      id: m.id,
      body: m.body,
      fromStudent: m.fromStudent,
      authorName: m.author?.name?.trim() || m.author?.email?.split("@")[0] || null,
      sentAt: m.sentAt.toISOString(),
      seen: Boolean(m.seenAt),
    });
    if (m.fromStudent && !m.seenAt) t.unread += 1;
    t.lastAt = m.sentAt.toISOString();
  }

  // Waiting on us first, then by who wrote most recently.
  return [...byThread.values()].sort((a, b) => {
    if ((b.unread > 0 ? 1 : 0) !== (a.unread > 0 ? 1 : 0)) return (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0);
    return (b.lastAt ?? "").localeCompare(a.lastAt ?? "");
  });
}

/** How many students are waiting on an answer from JOC. */
export async function jocWaiting(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return prisma.ambassadorMessage.count({
    where: { audience: "JOC", fromStudent: true, seenAt: null },
  }).catch(() => 0);
}
