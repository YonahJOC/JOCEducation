import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can, isSuperAdminEmail, JOC_STAFF_DOMAIN } from "@/lib/access";
import { FILTERS, type Filter } from "@/lib/experiences";

/**
 * Everything the Experiences pages read, in one place.
 *
 * Two pages show activity rows — the department's feed and a client's own
 * history — and the Buzz learned the hard way that two components with two
 * ideas of what a row is end up with one of them missing its comment box. So
 * the row is defined once, here.
 *
 * Every read is guarded and falls back to empty. The tables arrive with a
 * migration that may not have run yet on whichever database this is pointed
 * at, and a page that throws is worse than a page that says nothing is here.
 */

/** Who is looking, and what they may do. */
export async function experiencesViewer() {
  const session = await safeAuth();
  const me = session?.user ?? null;
  return {
    me,
    id: me?.id ?? null,
    allowed: openForReview || can(me, "experiences"),
    superAdmin: openForReview || isSuperAdminEmail(me?.email),
  };
}
export type ExperiencesViewer = Awaited<ReturnType<typeof experiencesViewer>>;

const ROW_SELECT = {
  id: true, type: true, summary: true, detail: true, occurredAt: true, createdAt: true,
  groupSize: true, authorId: true,
  author: { select: { name: true, email: true } },
  client: { select: { id: true, name: true, kind: true } },
  notes: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true, body: true, createdAt: true, authorId: true,
      author: { select: { name: true, email: true } },
    },
  },
} as const;

export type ExperienceRow = Awaited<ReturnType<typeof experienceRows>>[number];

/**
 * Activity rows, newest first.
 *
 * Removed rows are hidden everywhere: unlike a school update, nothing else
 * reads an experience row, so "off the feed" and "gone" are the same thing to
 * everybody but the database.
 */
export async function experienceRows(opts: {
  filter?: Filter;
  q?: string;
  clientId?: string;
  take?: number;
} = {}) {
  if (!isDatabaseConfigured()) return [];
  const q = (opts.q ?? "").trim();
  return prisma.experienceActivity.findMany({
    where: {
      removedAt: null,
      type: { in: [...FILTERS[opts.filter ?? "all"]] },
      ...(opts.clientId ? { clientId: opts.clientId } : {}),
      ...(q
        ? {
            OR: [
              { client: { name: { contains: q, mode: "insensitive" as const } } },
              { summary: { contains: q, mode: "insensitive" as const } },
              { detail: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    // Everything logged for "today" is stored at midnight, so the second term
    // is what puts the one just written above the four written this morning.
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: opts.take ?? 200,
    select: ROW_SELECT,
  }).catch(() => []);
}

/** The pick list on the log form: live clients, by name. */
export async function clientOptions() {
  if (!isDatabaseConfigured()) return [];
  return prisma.experienceClient.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
    take: 2000,
  }).catch(() => []);
}

/**
 * The client list, with what the list needs to say about each: how many
 * times anybody has written something, and when last.
 */
export async function clientList(opts: { archived?: boolean } = {}) {
  if (!isDatabaseConfigured()) return [];
  return prisma.experienceClient.findMany({
    where: { archivedAt: opts.archived ? { not: null } : null },
    orderBy: { name: "asc" },
    take: 2000,
    select: {
      id: true, name: true, kind: true, status: true, contactName: true,
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { activities: { where: { removedAt: null } } } },
      activities: {
        where: { removedAt: null },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { occurredAt: true, type: true },
      },
    },
  }).catch(() => []);
}

export async function archivedCount(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return prisma.experienceClient.count({ where: { archivedAt: { not: null } } }).catch(() => 0);
}

/** One client's card. */
export async function clientById(id: string) {
  if (!isDatabaseConfigured()) return null;
  return prisma.experienceClient.findUnique({
    where: { id },
    select: {
      id: true, name: true, kind: true, contactName: true, email: true, phone: true,
      notes: true, status: true, archivedAt: true, createdAt: true, ownerId: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  }).catch(() => null);
}

/**
 * Who a client can be given to: anybody at JOC with a live account.
 *
 * Not "anybody holding the experiences capability" — that lives on admin
 * types and the built-in defaults, and is not a question the database can
 * answer in one query. Three people use this list, and they know who they
 * are; a longer list costs them a scroll, a shorter one could cost them the
 * person they meant.
 */
export async function ownerOptions() {
  if (!isDatabaseConfigured()) return [];
  const people = await prisma.user.findMany({
    where: {
      schoolId: null,
      active: true,
      email: { endsWith: `@${JOC_STAFF_DOMAIN}`, mode: "insensitive" },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
    take: 500,
  }).catch(() => []);
  return people.map((p) => ({ id: p.id, name: p.name?.trim() || p.email }));
}
