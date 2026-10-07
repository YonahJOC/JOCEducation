import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can, isSuperAdminEmail } from "@/lib/access";
import { leadsAnyProgram } from "@/lib/program-admin";
import { UPDATE_TYPES } from "@/lib/school-update";

/**
 * The rows behind the Buzz, and who is looking at them.
 *
 * Both places that show the feed — the Buzz itself and the window on the
 * console home — read it through here, so an item behaves the same on both.
 * It was two different components with two different ideas of what an item
 * is, which is how one of them ended up without a comment box.
 */

export type BuzzRow = Awaited<ReturnType<typeof buzzRows>>[number];

export async function buzzRows(take: number) {
  if (!isDatabaseConfigured()) return [];
  return prisma.schoolActivity.findMany({
    // Removed items are hidden here and nowhere else: the row is still the
    // school's history, it is just off the feed.
    where: { type: { in: [...UPDATE_TYPES] }, removedAt: null, school: { isTest: false } },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true, type: true, detail: true, occurredAt: true, createdAt: true,
      author: { select: { name: true, email: true } },
      takenById: true,
      takenBy: { select: { name: true, email: true } },
      doneAt: true,
      doneBy: { select: { name: true, email: true } },
      // Closed for the whole office — a super admin decision, and separate
      // from any one person having finished with it.
      closedAt: true,
      closedBy: { select: { name: true, email: true } },
      program: { select: { name: true } },
      school: { select: { id: true, name: true } },
      notes: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, body: true, createdAt: true, authorId: true,
          author: { select: { name: true, email: true } },
        },
      },
      likes: { select: { userId: true } },
    },
  }).catch(() => []);
}

export type BuzzViewer = Awaited<ReturnType<typeof buzzViewer>>;

/**
 * Everything about the reader that an item needs to draw itself: what they
 * may do, who they could hand something to, and what they have already read.
 */
export async function buzzViewer() {
  const session = await safeAuth();
  const me = session?.user;

  const superAdmin = openForReview || isSuperAdminEmail(me?.email);

  // Anybody who runs a program can take an item; so can the schools team. A
  // coordinator holds no console capability, so the capability alone would
  // have shut out exactly the people this is for.
  const canPick = openForReview || can(me, "schools") || (await leadsAnyProgram(me?.id ?? null));

  // Who a super admin can hand an item to. Only fetched for them, so nobody
  // else's page carries a list of their colleagues.
  const taggable = superAdmin && isDatabaseConfigured()
    ? (await prisma.user.findMany({
        where: { schoolId: null, active: true },
        orderBy: [{ name: "asc" }, { email: "asc" }],
        select: { id: true, name: true, email: true },
      }).catch(() => [])).map((u) => ({ id: u.id, name: u.name ?? u.email ?? "somebody" }))
    : [];

  // When they last opened each thread.
  const seen = me?.id && isDatabaseConfigured()
    ? new Map(
        (await prisma.buzzSeen.findMany({
          where: { userId: me.id },
          select: { activityId: true, seenAt: true },
        }).catch(() => [])).map((s) => [s.activityId, s.seenAt]),
      )
    : new Map<string, Date>();

  /**
   * The schools this person's own programs run at.
   *
   * What "My schools" means on the Buzz filter. A coordinator who runs Boots
   * for Israel has no column anywhere saying which schools are theirs — it is
   * which schools are enrolled in the programs they lead, and that is the
   * only honest answer available.
   *
   * Empty for somebody who leads nothing: their filter has nothing to narrow
   * to, so the control is not shown.
   */
  const mySchools = me?.id && isDatabaseConfigured()
    ? new Set(
        (await prisma.programEnrollment.findMany({
          where: { program: { leads: { some: { id: me.id } } } },
          select: { schoolId: true },
          distinct: ["schoolId"],
        }).catch(() => [])).map((r) => r.schoolId),
      )
    : new Set<string>();

  /**
   * The two private states, per person.
   *
   * `onDesk` is the task this person made from a note — what they said they
   * would do, which is the line the card shows back to them. `doneForMe` is
   * them having finished with it while it stays open for everybody else.
   *
   * Both are read here rather than on the row, because a row is shared and
   * these two things are emphatically not.
   */
  const onDesk = me?.id && isDatabaseConfigured()
    ? new Map(
        (await prisma.deskTodo.findMany({
          where: { userId: me.id, activityId: { not: null } },
          select: { id: true, activityId: true, text: true, doneAt: true },
        }).catch(() => [])).map((t) => [t.activityId as string, t]),
      )
    : new Map<string, { id: string; activityId: string | null; text: string; doneAt: Date | null }>();

  const doneForMe = me?.id && isDatabaseConfigured()
    ? new Set(
        (await prisma.buzzDone.findMany({
          where: { userId: me.id },
          select: { activityId: true },
        }).catch(() => [])).map((d) => d.activityId),
      )
    : new Set<string>();

  return { me: me ?? null, superAdmin, canPick, taggable, seen, mySchools, onDesk, doneForMe };
}

/**
 * Comments on one item this person has not seen.
 *
 * Never counts their own: writing a comment is not a notification to
 * yourself, and a dot on something you just said is noise.
 */
export function unreadFor(row: BuzzRow, viewer: BuzzViewer): number {
  const id = viewer.me?.id;
  if (!id) return 0;
  const last = viewer.seen.get(row.id);
  return row.notes.filter((n) => n.authorId !== id && (!last || n.createdAt > last)).length;
}

/**
 * Where an item sits: when it entered the feed, lifted once by its first
 * comment. See the note in app/buzz/page.tsx for why it is not the date on
 * the row.
 */
export function standing(row: { createdAt: Date; notes: { createdAt: Date }[] }): number {
  return row.notes.length > 0
    ? Math.max(row.createdAt.getTime(), row.notes[0].createdAt.getTime())
    : row.createdAt.getTime();
}

/** First name only — this is a feed, not a directory. */
export function first(who: string | null | undefined): string {
  if (!who) return "somebody at JOC";
  return who.includes("@") ? who.split("@")[0] : who.split(/\s+/)[0];
}
