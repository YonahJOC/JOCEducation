import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Conversations between a school and JOC.
 *
 * One per (school, program), plus one General per school. A conversation is
 * derived from those two columns — there is no Conversation table, because
 * there is nothing true of a conversation that the messages in it do not
 * already say.
 *
 * ── Who reads it ──────────────────────────────────────────────────────────
 *
 * The program's coordinator, and the school's account manager when the
 * program has none or the conversation is General. Six of the eight programs
 * have no coordinator today, so the fallback is the common path rather than
 * the edge case, and every screen names the person who will actually read it.
 *
 * Nothing here sends anything. A school reads a message because they opened
 * their portal; a coordinator reads one because they opened their console.
 */

export type Reader = {
  id: string | null;
  name: string;
  /** True when nobody runs the program and the account manager has it. */
  fallback: boolean;
  /** One line about who they are, written for the school. */
  line: string;
};

export type Conversation = {
  /** Null for General. */
  programId: number | null;
  programName: string;
  /** The program's own colour, or muted for General. */
  dot: string;
  slug: string | null;
  reader: Reader;
  messages: ThreadMessage[];
  /** From the other side, unread by whoever is looking. */
  unread: number;
  /** The last message is theirs and nobody has answered it. */
  waiting: boolean;
  lastAt: Date | null;
};

export type ThreadMessage = {
  id: string;
  body: string;
  topic: string | null;
  inbound: boolean;
  author: string | null;
  sentAt: Date;
  seenAt: Date | null;
};

const GENERAL_DOT = "#4A5A74";

/** The General conversation's standing description. */
const GENERAL_LINE =
  "Looks after your school's account. For logins, invoices and anything that isn't one program.";

function readerFor(
  lead: { id: string; name: string | null; email: string } | null,
  manager: { id: string; name: string | null; email: string } | null,
  programName: string | null,
): Reader {
  const who = (u: { name: string | null; email: string }) => u.name ?? u.email;

  if (!programName) {
    return manager
      ? { id: manager.id, name: who(manager), fallback: false, line: GENERAL_LINE }
      : { id: null, name: "JOC", fallback: true, line: GENERAL_LINE };
  }

  if (lead) {
    return {
      id: lead.id,
      name: who(lead),
      fallback: false,
      line: `Runs ${programName} at JOC. ${who(lead).split(/\s+/)[0]} reads this on the console.`,
    };
  }

  if (manager) {
    const first = who(manager).split(/\s+/)[0];
    return {
      id: manager.id,
      name: who(manager),
      fallback: true,
      line: `Nobody at JOC runs ${programName} yet, so ${first} reads this. ${first} looks after your school's account.`,
    };
  }

  return {
    id: null,
    name: "JOC",
    fallback: true,
    line: `Nobody at JOC is down as running ${programName} yet. What you write waits here until somebody is.`,
  };
}

/**
 * Every conversation a school has, whether or not anything has been said.
 *
 * A program with no messages still appears: the point of the list is to say
 * who you can write to, and a school that has never written needs that most.
 */
export async function conversationsForSchool(schoolId: string): Promise<Conversation[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const [school, enrollments, messages] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          accountManager: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.programEnrollment.findMany({
        where: { schoolId },
        select: {
          program: {
            select: {
              id: true, slug: true, name: true, heroColor: true,
              leads: { select: { id: true, name: true, email: true }, take: 1 },
            },
          },
        },
      }),
      prisma.schoolMessage.findMany({
        where: { schoolId },
        orderBy: { sentAt: "asc" },
        select: {
          id: true, body: true, topic: true, inbound: true, sentAt: true, seenAt: true,
          programId: true,
          author: { select: { name: true, email: true } },
        },
      }),
    ]);

    const manager = school?.accountManager ?? null;

    const byProgram = new Map<number | null, ThreadMessage[]>();
    for (const m of messages) {
      const key = m.programId ?? null;
      const list = byProgram.get(key) ?? [];
      list.push({
        id: m.id,
        body: m.body,
        topic: m.topic,
        inbound: m.inbound,
        author: m.author?.name ?? m.author?.email ?? null,
        sentAt: m.sentAt,
        seenAt: m.seenAt,
      });
      byProgram.set(key, list);
    }

    const out: Conversation[] = enrollments
      .map((e) => e.program)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => build(p.id, p.name, p.slug, p.heroColor, readerFor(p.leads[0] ?? null, manager, p.name), byProgram));

    // General last. It is the catch-all, and a catch-all at the top invites
    // everything into it.
    out.push(
      build(null, "General", null, GENERAL_DOT, readerFor(null, manager, null), byProgram),
    );

    return out;
  } catch {
    return [];
  }
}

function build(
  programId: number | null,
  programName: string,
  slug: string | null,
  dot: string,
  reader: Reader,
  byProgram: Map<number | null, ThreadMessage[]>,
): Conversation {
  const msgs = byProgram.get(programId) ?? [];
  const last = msgs[msgs.length - 1] ?? null;

  return {
    programId,
    programName,
    slug,
    dot,
    reader,
    messages: msgs,
    // Unread, to the school, means something JOC wrote that nobody has opened.
    unread: msgs.filter((m) => !m.inbound && m.seenAt == null).length,
    waiting: Boolean(last?.inbound),
    lastAt: last?.sentAt ?? null,
  };
}

/** What a school is owed, for the rail badge and the Today row. */
export async function unreadForSchool(schoolId: string): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    return await prisma.schoolMessage.count({
      where: { schoolId, inbound: false, seenAt: null },
    });
  } catch {
    return 0;
  }
}

/**
 * Mark one side's messages read.
 *
 * `side` is who is doing the reading, never who wrote. A console must not
 * clear a school's unread count on their behalf, and the reverse is just as
 * wrong.
 */
export async function markSeen(
  schoolId: string,
  programId: number | null,
  side: "joc" | "school",
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await prisma.schoolMessage.updateMany({
      where: {
        schoolId,
        programId: programId ?? null,
        inbound: side === "joc",
        seenAt: null,
      },
      data: { seenAt: new Date() },
    });
  } catch {
    // Seen-state is a convenience. Failing to record it changes nothing real.
  }
}
