"use server";

import { randomBytes, createHash } from "node:crypto";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword, passwordProblem } from "@/lib/password";
import { isStaffEmail, isConsumerEmail, emailDomain } from "@/lib/access";
import { sendEmail, emailShell, siteUrl, isEmailConfigured } from "@/lib/email";

/**
 * Creating an account.
 *
 * Signing up proves you can type an address, and nothing else. So it grants
 * nothing: every self-made account starts as a plain TEACHER with no school
 * and no access, whatever address was typed.
 *
 * Anything that follows from the address — JOC staff access for an
 * @justonechesed.org email, joining a school by its domain, or a pending
 * invitation — waits until the address is verified. Otherwise a stranger
 * types someone@justonechesed.org and lets themselves in, or types a
 * teacher's address at a subscribing school and inherits that school's
 * subscription.
 *
 * Google sign-in is unaffected: Google has already verified the address, so
 * events.createUser in auth.ts applies those grants immediately.
 */

const VERIFY_TTL_HOURS = 48;
const SCOPE = "signup-verify:";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SignupResult =
  | { ok: true; verificationSent: boolean; willGetAccess: boolean }
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

    const name = [firstName, lastName].filter(Boolean).join(" ");
    const passwordHash = await hashPassword(input.password);

    // Deliberately plain. Nothing here reads the address to decide a role.
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "TEACHER",
        schoolId: null,
        mustChangePassword: false,
      },
      select: { id: true },
    });

    // Would verifying this address actually get them anything? Used only to
    // word the confirmation honestly.
    const domain = emailDomain(email);
    const wouldMatchSchool =
      Boolean(domain) && !isConsumerEmail(email) && !isStaffEmail(email)
        ? Boolean(
            await prisma.school.findFirst({
              where: { emailDomains: { has: domain! } },
              select: { id: true },
            })
          )
        : false;
    const pendingInvite = Boolean(
      await prisma.invitation.findFirst({
        where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
        select: { id: true },
      })
    );
    const willGetAccess = isStaffEmail(email) || wouldMatchSchool || pendingInvite;

    let verificationSent = false;
    if (isEmailConfigured && willGetAccess) {
      const token = randomBytes(32).toString("hex");
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier: SCOPE + email } }),
        prisma.verificationToken.create({
          data: {
            identifier: SCOPE + email,
            token: hashToken(token),
            expires: new Date(Date.now() + VERIFY_TTL_HOURS * 3_600_000),
          },
        }),
      ]);

      const link = `${siteUrl()}/verify?token=${token}&email=${encodeURIComponent(email)}`;
      const r = await sendEmail({
        to: email,
        subject: "Confirm your email — JOC Education",
        text:
          `Hello ${firstName},\n\nConfirm this address to finish setting up your JOC Education ` +
          `account:\n\n${link}\n\nThe link works for ${VERIFY_TTL_HOURS} hours.\n`,
        html: emailShell({
          heading: "Confirm your email",
          body: [
            `Hello ${firstName},`,
            `Confirm this address to finish setting up your JOC Education account. The link works for ${VERIFY_TTL_HOURS} hours.`,
          ],
          action: { label: "Confirm my email", href: link },
          footnote: "If you did not create this account, you can ignore this message.",
        }),
      });
      verificationSent = r.ok;
    }

    void user;
    return { ok: true, verificationSent, willGetAccess };
  } catch {
    return { ok: false, error: "Could not create that account. Please try again." };
  }
}

export type VerifyResult =
  | { ok: true; schoolName: string | null; staff: boolean }
  | { ok: false; error: string };

/**
 * Confirming an address, and only now applying what it entitles them to.
 */
export async function verifyEmail(email: string, token: string): Promise<VerifyResult> {
  const address = email.trim().toLowerCase();
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  try {
    const row = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: SCOPE + address, token: hashToken(token) } },
    });
    if (!row || row.expires < new Date()) {
      return { ok: false, error: "That link has expired. Ask JOC to send another." };
    }

    const user = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true, role: true },
    });
    if (!user) return { ok: false, error: "That link is no longer valid." };

    // An invitation is the strongest claim: a super admin created it against
    // this exact address.
    const invite = await prisma.invitation.findFirst({
      where: { email: address, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { school: { select: { id: true, name: true } } },
    });

    let schoolId: string | null = invite?.school.id ?? null;
    let schoolName: string | null = invite?.school.name ?? null;
    let role: string = invite ? invite.role : "TEACHER";

    // JOC staff access follows the domain, once the domain is proven.
    const staff = isStaffEmail(address);
    if (staff && role === "TEACHER") role = "STAFF";

    if (!schoolId && !staff) {
      const domain = emailDomain(address);
      if (domain && !isConsumerEmail(address)) {
        const school = await prisma.school.findFirst({
          where: { emailDomains: { has: domain } },
          select: { id: true, name: true },
        });
        if (school) { schoolId = school.id; schoolName = school.name; }
      }
    }

    // Never demote someone an administrator has already promoted.
    const keepRole = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          ...(keepRole ? {} : { role: role as never }),
          ...(schoolId ? { schoolId } : {}),
        },
      }),
      prisma.verificationToken.deleteMany({ where: { identifier: SCOPE + address } }),
      ...(invite
        ? [
            prisma.invitation.update({
              where: { id: invite.id },
              data: { status: "ACCEPTED", acceptedAt: new Date() },
            }),
            prisma.schoolActivity.create({
              data: {
                schoolId: invite.school.id,
                type: "ACCESS_GRANTED",
                summary: `${address} confirmed their email and joined`,
                authorId: user.id,
              },
            }),
          ]
        : []),
    ]);

    return { ok: true, schoolName, staff };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
