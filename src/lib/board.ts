import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { schoolAccountStates, type SchoolAccount } from "@/lib/school-account";

/**
 * The JOC App clients board.
 *
 * One query set for one screen. Everything the Monday board held, plus the
 * three things it could not: whether the school can actually sign in, how
 * many messages are waiting, and how old the last update is.
 *
 * No student's name is anywhere in here. The student list is a count of
 * files and a state; the files themselves only ever go through
 * /api/files/[id], which checks the Schools capability.
 */

export type BoardColumnValue = { fieldId: string; value: string };

export type BoardRow = {
  schoolId: string;
  name: string;
  slug: string;
  statusId: string | null;
  ownerId: string | null;
  ownerName: string | null;
  network: string | null;
  type: string | null;
  studentCount: number | null;
  account: SchoolAccount;
  unreadMessages: number;
  /** Keyed by BoardField id. */
  fields: Record<string, string>;
  /** BoardCheck ids that are ticked, and whether they came from Monday. */
  checks: Record<string, { at: Date; imported: boolean }>;
  contact: { name: string | null; email: string | null; phone: string | null } | null;
  listState: "NOT_SENT" | "UPLOADED" | "STUCK";
  listNote: string | null;
  listFiles: number;
  listAt: Date | null;
  updates: number;
  lastUpdateAt: Date | null;
  lastUpdateSummary: string | null;
};

export type Board = {
  rows: BoardRow[];
  statuses: { id: string; label: string; tone: string; sort: number; used: number }[];
  fields: { id: string; label: string; sort: number }[];
  checks: { id: string; label: string; sort: number }[];
  /** Counts for the figures across the top. */
  totals: {
    active: number;
    students: number;
    studentsUnknown: number;
    listsUploaded: number;
    listsNeeded: number;
    withAccount: number;
    unowned: number;
    schools: number;
  };
};

const EMPTY: Board = {
  rows: [], statuses: [], fields: [], checks: [],
  totals: {
    active: 0, students: 0, studentsUnknown: 0, listsUploaded: 0,
    listsNeeded: 0, withAccount: 0, unowned: 0, schools: 0,
  },
};

export async function getBoard(): Promise<Board> {
  if (!isDatabaseConfigured()) return EMPTY;

  try {
    const [schools, statuses, fields, checks] = await Promise.all([
      prisma.school.findMany({
        // The board is the JOC App clients, not every school in the portal.
        where: { onBoard: true },
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, slug: true, type: true, network: true,
          studentCount: true, boardStatusId: true,
          accountManagerId: true,
          accountManager: { select: { name: true, email: true } },
          studentListState: true, studentListNote: true, studentListAt: true,
          contacts: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            take: 1,
            select: { name: true, email: true, phone: true },
          },
          boardFieldValues: { select: { fieldId: true, value: true } },
          boardCheckMarks: { select: { checkId: true, at: true, imported: true } },
          _count: { select: { studentLists: true, activities: true } },
          activities: {
            orderBy: { occurredAt: "desc" },
            take: 1,
            select: { occurredAt: true, summary: true },
          },
        },
      }),
      prisma.boardStatus.findMany({ orderBy: { sort: "asc" } }),
      prisma.boardField.findMany({ orderBy: { sort: "asc" } }),
      prisma.boardCheck.findMany({ orderBy: { sort: "asc" } }),
    ]);

    const ids = schools.map((s) => s.id);
    const [accounts, unread] = await Promise.all([
      schoolAccountStates(ids),
      prisma.schoolMessage.groupBy({
        by: ["schoolId"],
        where: { schoolId: { in: ids }, inbound: true, seenAt: null },
        _count: { _all: true },
      }).catch(() => []),
    ]);

    const unreadBy = new Map(unread.map((u) => [u.schoolId, u._count._all]));

    const rows: BoardRow[] = schools.map((s) => ({
      schoolId: s.id,
      name: s.name,
      slug: s.slug,
      statusId: s.boardStatusId,
      ownerId: s.accountManagerId,
      ownerName: s.accountManager?.name ?? s.accountManager?.email ?? null,
      network: s.network,
      type: s.type,
      studentCount: s.studentCount,
      account: accounts.get(s.id) ?? { state: "none", logins: 0, lastSeenAt: null, pending: 0 },
      unreadMessages: unreadBy.get(s.id) ?? 0,
      fields: Object.fromEntries(s.boardFieldValues.map((v) => [v.fieldId, v.value])),
      checks: Object.fromEntries(
        s.boardCheckMarks.map((m) => [m.checkId, { at: m.at, imported: m.imported }]),
      ),
      contact: s.contacts[0] ?? null,
      listState: s.studentListState,
      listNote: s.studentListNote,
      listFiles: s._count.studentLists,
      listAt: s.studentListAt,
      updates: s._count.activities,
      lastUpdateAt: s.activities[0]?.occurredAt ?? null,
      lastUpdateSummary: s.activities[0]?.summary ?? null,
    }));

    const activeId = statuses.find((s) => s.label.toLowerCase() === "active")?.id ?? null;

    return {
      rows,
      statuses: statuses.map((s) => ({
        ...s,
        used: rows.filter((r) => r.statusId === s.id).length,
      })),
      fields,
      checks,
      totals: {
        schools: rows.length,
        active: activeId ? rows.filter((r) => r.statusId === activeId).length : 0,
        students: rows.reduce((n, r) => n + (r.studentCount ?? 0), 0),
        // Said separately rather than folded into the sum: a school with no
        // figure is not a school with none.
        studentsUnknown: rows.filter((r) => r.studentCount == null).length,
        listsUploaded: rows.filter((r) => r.listState === "UPLOADED").length,
        listsNeeded: rows.filter((r) => r.listState !== "UPLOADED").length,
        withAccount: rows.filter((r) => r.account.state !== "none").length,
        unowned: rows.filter((r) => !r.ownerId).length,
      },
    };
  } catch {
    return EMPTY;
  }
}

/** What each network is called on a screen. */
export const NETWORK_LABEL: Record<string, string> = {
  YESHIVA_LEAGUE: "Yeshiva League",
  ISRAEL: "Israel",
  CANADA: "Canada",
};

/** And each school type. */
export const TYPE_LABEL: Record<string, string> = {
  DAY_SCHOOL: "Day school",
  MIDDLE_SCHOOL: "Middle school",
  YESHIVA: "Yeshiva",
  SEMINARY: "Seminary",
  CHEDER: "Cheder",
  HIGH_SCHOOL: "High school",
  OTHER: "Other",
};

/** The board's tones, mapped to the site's colours. */
export const TONE: Record<string, { bg: string; fg: string }> = {
  green: { bg: "#E6F4EC", fg: "#1D6B37" },
  orange: { bg: "#FFF0E0", fg: "#C96C00" },
  red: { bg: "#FDEAE7", fg: "#A3261A" },
  blue: { bg: "#E4E9F8", fg: "#2D46AF" },
  ink: { bg: "#F4F7FD", fg: "#10233F" },
};
