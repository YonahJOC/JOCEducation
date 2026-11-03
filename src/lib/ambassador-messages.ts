import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * A student ambassador and their teacher, in writing.
 *
 * Everything else on an ambassador's side runs one way: they send work up,
 * a teacher says yes or no, and the updates feed tells them what happened.
 * A fifteen-year-old who does not understand why their flyer was set aside
 * had nowhere to ask. This is the asking.
 *
 * It is their own supervising teacher and nobody else. A channel between
 * adults at JOC and somebody's child is a safeguarding decision rather
 * than a feature, so `audience` exists, "JOC" is a value it can hold, and
 * nothing in this file writes it.
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
export async function messagesFor(ambassadorId: string): Promise<AmbassadorMessage[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.ambassadorMessage.findMany({
    where: { ambassadorId, audience: "TEACHER" },
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
export async function markThreadSeen(ambassadorId: string, byStudent: boolean): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await prisma.ambassadorMessage.updateMany({
    where: { ambassadorId, fromStudent: !byStudent, seenAt: null },
    data: { seenAt: new Date() },
  }).catch(() => null);
}
