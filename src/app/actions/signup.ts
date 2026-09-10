"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword, passwordProblem } from "@/lib/password";
import { initialRoleFor, emailDomain, isConsumerEmail, JOC_STAFF_DOMAIN } from "@/lib/access";

/**
 * Creating an account.
 *
 * The page used to wait a second and say "Account created!" while creating
 * nothing — so an invited teacher believed they had a login and did not.
 *
 * A regular address gets a regular account. A school address is matched to
 * its school by domain, and a pending invitation for that address decides the
 * role. Nothing here can hand out console access: `initialRoleFor` never
 * returns more than STAFF, and only a super admin can raise it.
 */

export type SignupResult =
  | { ok: true; schoolName: string | null }
  | { ok: false; error: string };

export async function createAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolName: string;
  role: string;
}): Promise<SignupResult> {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName) return { ok: false, error: "Please enter your first name." };
  if (!email.includes("@")) return { ok: false, error: "Please enter a valid email address." };

  const problem = passwordProblem(input.password);
  if (problem) return { ok: false, error: problem };

  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Accounts are not switched on yet. Please try again later." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return { ok: false, error: "There is already an account with that address. Try signing in." };
    }

    // A school address is matched to its school; a personal one is not.
    let schoolId: string | null = null;
    let schoolName: string | null = null;
    const domain = emailDomain(email);
    if (domain && domain !== JOC_STAFF_DOMAIN && !isConsumerEmail(email)) {
      const school = await prisma.school.findFirst({
        where: { emailDomains: { has: domain } },
        select: { id: true, name: true },
      });
      if (school) { schoolId = school.id; schoolName = school.name; }
    }

    // An invitation is the stronger signal: it names the school and the role
    // whatever address they used.
    const invitation = await prisma.invitation.findFirst({
      where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { school: { select: { id: true, name: true } } },
    });
    if (invitation) {
      schoolId = invitation.school.id;
      schoolName = invitation.school.name;
    }

    const role = invitation ? invitation.role : initialRoleFor(email);
    const name = [firstName, lastName].filter(Boolean).join(" ");
    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name, passwordHash, role, schoolId, mustChangePassword: false },
        select: { id: true },
      });

      if (invitation) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });
        await tx.schoolActivity.create({
          data: {
            schoolId: invitation.school.id,
            type: "ACCESS_GRANTED",
            summary: `${name || email} accepted their invitation`,
            authorId: user.id,
          },
        });
      }
    });

    return { ok: true, schoolName };
  } catch {
    return { ok: false, error: "Could not create that account. Please try again." };
  }
}
