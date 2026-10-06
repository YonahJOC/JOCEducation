import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Whether a school can actually get in.
 *
 * Three states, derived rather than stored, because every one of them is
 * already true of rows elsewhere and a fourth copy would be the one that goes
 * stale:
 *
 *   **live** — somebody has signed in at least once.
 *   **invited** — an account or a pending invitation exists and nobody has
 *   used it. This is the state that matters: JOC made the account, nobody
 *   was told, and somebody has to pass the link on by hand.
 *   **none** — there is nothing to sign in to.
 *
 * The distinction is the whole reason the board has an Account column. A
 * school can be "Active" on the board and still have nobody able to open the
 * portal, and before this there was nowhere that said so.
 */

export type AccountState = "live" | "invited" | "none";

export type SchoolAccount = {
  state: AccountState;
  /** How many people hold a login. */
  logins: number;
  /** The most recent sign-in across them all. */
  lastSeenAt: Date | null;
  /** Invitations sent but never taken up. */
  pending: number;
};

const NONE: SchoolAccount = { state: "none", logins: 0, lastSeenAt: null, pending: 0 };

export async function schoolAccountState(schoolId: string): Promise<SchoolAccount> {
  if (!isDatabaseConfigured()) return NONE;

  try {
    const [admins, pending] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId, role: "SCHOOL_ADMIN" },
        select: { lastSeenAt: true },
      }),
      prisma.invitation.count({ where: { schoolId, status: "PENDING" } }),
    ]);

    if (admins.length === 0 && pending === 0) return NONE;

    const seen = admins
      .map((a) => a.lastSeenAt)
      .filter((d): d is Date => d != null)
      .sort((a, b) => b.getTime() - a.getTime());

    return {
      state: seen.length > 0 ? "live" : "invited",
      logins: admins.length,
      lastSeenAt: seen[0] ?? null,
      pending,
    };
  } catch {
    return NONE;
  }
}

/**
 * The same, for a whole board's worth of schools in two queries.
 *
 * The board draws forty rows; asking per row would be eighty round trips for
 * a column.
 */
export async function schoolAccountStates(
  schoolIds: string[],
): Promise<Map<string, SchoolAccount>> {
  const out = new Map<string, SchoolAccount>();
  if (!isDatabaseConfigured() || schoolIds.length === 0) return out;

  try {
    const [admins, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId: { in: schoolIds }, role: "SCHOOL_ADMIN" },
        select: { schoolId: true, lastSeenAt: true },
      }),
      prisma.invitation.groupBy({
        by: ["schoolId"],
        where: { schoolId: { in: schoolIds }, status: "PENDING" },
        _count: { _all: true },
      }),
    ]);

    const pendingBy = new Map(invitations.map((i) => [i.schoolId, i._count._all]));

    for (const id of schoolIds) {
      const mine = admins.filter((a) => a.schoolId === id);
      const pending = pendingBy.get(id) ?? 0;

      if (mine.length === 0 && pending === 0) {
        out.set(id, NONE);
        continue;
      }

      const seen = mine
        .map((a) => a.lastSeenAt)
        .filter((d): d is Date => d != null)
        .sort((a, b) => b.getTime() - a.getTime());

      out.set(id, {
        state: seen.length > 0 ? "live" : "invited",
        logins: mine.length,
        lastSeenAt: seen[0] ?? null,
        pending,
      });
    }

    return out;
  } catch {
    return out;
  }
}

/** What to call each state on a screen. */
export const ACCOUNT_LABEL: Record<AccountState, string> = {
  live: "Has an account",
  invited: "Invited, never signed in",
  none: "No account",
};
