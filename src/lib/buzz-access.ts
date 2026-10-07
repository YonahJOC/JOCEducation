import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { openForReview } from "@/auth";
import { can, isSuperAdminEmail } from "@/lib/access";
import { leadsAnyProgram } from "@/lib/program-admin";

/**
 * Who may read the Buzz.
 *
 * One function, because the answer is asked in four places now — the page,
 * the strip on the console home, the comment action and the pickup — and
 * four copies of a permission rule is three chances to disagree about who
 * can see thirty-nine schools' notes.
 *
 * Four ways in:
 *   super admin    holds everything
 *   named          switched on by hand at /admin/buzz
 *   admin type     their type carries the buzz capability
 *   runs a program a coordinator is here to pick these up
 *
 * And one way out that beats all of them: anybody tied to a single school.
 * This is every school at once, so it is never theirs, whatever is ticked.
 */

type U = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  capabilities?: string[] | null;
  schoolId?: string | null;
} | null | undefined;

export async function canReadBuzz(user: U): Promise<boolean> {
  if (openForReview) return true;
  if (!user?.id) return false;
  if (isSuperAdminEmail(user.email)) return true;
  if (!isDatabaseConfigured()) return false;

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { buzzAccess: true, schoolId: true },
  }).catch(() => null);

  if (!row || row.schoolId) return false;
  if (row.buzzAccess) return true;

  // Invited before they ever signed in. Spend the invite now: the flag moves
  // onto the account, so from here they are an ordinary name on the list
  // rather than a special case anybody has to remember.
  const email = user.email?.trim().toLowerCase();
  if (email) {
    const invite = await prisma.buzzInvite.findUnique({
      where: { email }, select: { id: true },
    }).catch(() => null);

    if (invite) {
      try {
        await prisma.$transaction([
          prisma.user.update({ where: { id: user.id }, data: { buzzAccess: true } }),
          prisma.buzzInvite.delete({ where: { id: invite.id } }),
        ]);
      } catch {
        // Worst case the invite is spent next time; they can read it now.
      }
      return true;
    }
  }

  if (can(user, "buzz")) return true;
  return leadsAnyProgram(user.id);
}
