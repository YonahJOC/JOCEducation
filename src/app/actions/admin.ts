"use server";

import { revalidatePath } from "next/cache";
import { sendInvitation } from "@/lib/notify";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageAccounts, canManageRoles } from "@/lib/access";
import { hashPassword, passwordProblem, generateTempPassword } from "@/lib/password";
import { isAuthConfigured } from "@/auth";

/**
 * Mutations for the internal admin console.
 *
 * Every action re-checks authorization server-side — the console's route guard
 * is a convenience, not the security boundary.
 *
 * Everything in this file touches school accounts, plans, money or user
 * records, so it all requires SUPER_ADMIN. The educational team (ADMIN) works
 * on content, which lives in its own actions.
 */

type Result = { ok: true } | { ok: false; error: string };

async function requireAccountManager() {
  const session = await safeAuth();
  // Before auth is configured there is nobody to authorize, and the database
  // check below stops anything from actually being written.
  if (isAuthConfigured && !canManageAccounts(session?.user)) {
    throw new Error("Only a super admin can change accounts");
  }
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  return session?.user ?? null;
}

/** Log an entry on the school's relationship timeline. */
async function log(
  schoolId: string,
  type: string,
  summary: string,
  detail: string | null,
  authorId: string | null
) {
  await prisma.schoolActivity.create({
    data: { schoolId, type: type as never, summary, detail, authorId },
  });
}

export async function setSchoolStatus(schoolId: string, status: string): Promise<Result> {
  try {
    const me = await requireAccountManager();
    const before = await prisma.school.findUnique({ where: { id: schoolId }, select: { status: true } });
    await prisma.school.update({ where: { id: schoolId }, data: { status: status as never } });
    await log(schoolId, "STATUS_CHANGE", `Status changed from ${before?.status ?? "—"} to ${status}`, null, me?.id ?? null);
    revalidatePath(`/admin/schools/${schoolId}`);
    revalidatePath("/admin/schools");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Set or change a school's plan. `grantedManually` covers scholarships, pilots
 * and comped accounts — access without a Stripe subscription.
 */
export async function setSchoolPlan(input: {
  schoolId: string;
  plan: string;
  seats: number;
  interval: "MONTHLY" | "ANNUAL";
  grantedManually: boolean;
  /** SCHOLARSHIP | PILOT | COMP — required when granting. */
  grantKind?: string | null;
  grantNote?: string;
  grantReviewOn?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<Result> {
  try {
    const me = await requireAccountManager();
    const {
      schoolId, plan, seats, interval,
      grantedManually, grantKind, grantNote, grantReviewOn, currentPeriodEnd,
    } = input;

    // A grant with no stated reason is not answerable later, so refuse it.
    if (grantedManually) {
      if (!grantKind) return { ok: false, error: "Choose scholarship, pilot or comp" };
      if (!grantNote?.trim()) return { ok: false, error: "Say why this access is being granted" };
    }

    const existing = await prisma.subscription.findUnique({ where: { schoolId } });
    const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
    const reviewOn = grantReviewOn ? new Date(grantReviewOn) : null;

    const grantFields = grantedManually
      ? {
          grantedManually: true,
          grantKind: grantKind as never,
          grantNote: grantNote!.trim(),
          grantedById: me?.id ?? null,
          grantedAt: existing?.grantedAt ?? new Date(),
          grantReviewOn: reviewOn,
        }
      : {
          grantedManually: false,
          grantKind: null,
          grantNote: null,
          grantedById: null,
          grantedAt: null,
          grantReviewOn: null,
        };

    await prisma.subscription.upsert({
      where: { schoolId },
      create: {
        schoolId,
        plan: plan as never,
        seats,
        interval: interval as never,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
        ...grantFields,
      },
      update: {
        plan: plan as never,
        seats,
        interval: interval as never,
        currentPeriodEnd: periodEnd,
        ...grantFields,
      },
    });

    // The record of generosity: what, why, and who approved it.
    if (grantedManually) {
      const kindLabel = String(grantKind).toLowerCase();
      await log(
        schoolId,
        "ACCESS_GRANTED",
        `${kindLabel.charAt(0).toUpperCase()}${kindLabel.slice(1)} granted on ${plan.replace(/_/g, " ").toLowerCase()}`,
        [grantNote!.trim(), reviewOn ? `Review on ${reviewOn.toDateString()}.` : null]
          .filter(Boolean)
          .join(" "),
        me?.id ?? null
      );
    } else if (existing) {
      await log(schoolId, "PLAN_CHANGE", `Plan changed from ${existing.plan} to ${plan}`, null, me?.id ?? null);
    } else {
      await log(schoolId, "PLAN_CHANGE", `Plan set to ${plan}`, null, me?.id ?? null);
    }

    revalidatePath(`/admin/schools/${schoolId}`);
    revalidatePath("/admin/schools");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function revokeSchoolAccess(schoolId: string, reason: string): Promise<Result> {
  try {
    const me = await requireAccountManager();
    await prisma.subscription.updateMany({ where: { schoolId }, data: { status: "CANCELED" } });
    await prisma.school.update({ where: { id: schoolId }, data: { status: "CHURNED" } });
    await log(schoolId, "ACCESS_REVOKED", "Access revoked", reason || null, me?.id ?? null);
    revalidatePath(`/admin/schools/${schoolId}`);
    revalidatePath("/admin/schools");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function addSchoolNote(input: {
  schoolId: string;
  type: string;
  summary: string;
  detail?: string;
  occurredAt?: string;
}): Promise<Result> {
  try {
    const me = await requireAccountManager();
    if (!input.summary.trim()) return { ok: false, error: "A summary is required" };
    await prisma.schoolActivity.create({
      data: {
        schoolId: input.schoolId,
        type: input.type as never,
        summary: input.summary.trim(),
        detail: input.detail?.trim() || null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
        authorId: me?.id ?? null,
      },
    });
    revalidatePath(`/admin/schools/${input.schoolId}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Invite someone at a school to create a login. */
export async function inviteToSchool(input: {
  schoolId: string;
  email: string;
  role: string;
}): Promise<Result> {
  try {
    const me = await requireAccountManager();
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) return { ok: false, error: "Enter a valid email" };

    const expiresAt = new Date(Date.now() + 30 * 86400000);
    await prisma.invitation.create({
      data: { schoolId: input.schoolId, email, role: input.role as never, expiresAt, invitedById: me?.id ?? null },
    });
    await log(input.schoolId, "ACCESS_GRANTED", `Invited ${email} as ${input.role}`, null, me?.id ?? null);

    const school = await prisma.school.findUnique({
      where: { id: input.schoolId },
      select: { name: true },
    });
    const emailed = await sendInvitation({
      to: email,
      schoolName: school?.name ?? "your school",
      invitedBy: me?.name ?? me?.email ?? null,
      role: input.role,
    });

    revalidatePath(`/admin/schools/${input.schoolId}`);
    // The invitation is real either way; whoever invited them needs to know
    // whether to pass the link on themselves.
    return emailed
      ? { ok: true }
      : { ok: false, error: `Invitation created, but no email was sent — mail is not switched on yet. Send ${email} the sign-up link yourself.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function revokeInvitation(invitationId: string, schoolId: string): Promise<Result> {
  try {
    await requireAccountManager();
    await prisma.invitation.update({ where: { id: invitationId }, data: { status: "REVOKED" } });
    revalidatePath(`/admin/schools/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createSchool(input: {
  name: string;
  region?: string;
  city?: string;
  enrollment?: string;
  type?: string;
}): Promise<Result & { id?: string }> {
  try {
    const me = await requireAccountManager();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "A school name is required" };

    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    let slug = base;
    let n = 1;
    while (await prisma.school.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        region: input.region?.trim() || null,
        city: input.city?.trim() || null,
        enrollment: (input.enrollment ?? "MEDIUM") as never,
        type: (input.type ?? "DAY_SCHOOL") as never,
        accountManagerId: me?.id ?? null,
      },
    });
    await log(school.id, "NOTE", "School added to the console", null, me?.id ?? null);
    revalidatePath("/admin/schools");
    return { ok: true, id: school.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Edit a school's own details.
 *
 * `emailDomains` is the important one: a teacher signing in with an address
 * on one of these joins the school automatically, which is what makes
 * onboarding a school something other than inviting people one at a time.
 */
export async function updateSchoolDetails(input: {
  schoolId: string;
  name: string;
  city?: string;
  region?: string;
  website?: string;
  type: string;
  enrollment: string;
  studentCount?: number | null;
  /** Comma or space separated; stored lowercased with any @ stripped. */
  emailDomains: string;
}): Promise<Result> {
  try {
    const me = await requireAccountManager();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "A school name is required" };

    const domains = input.emailDomains
      .split(/[\s,]+/)
      .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
      .filter((d) => d.includes("."));

    // A domain may only belong to one school, or sign-in becomes ambiguous.
    if (domains.length > 0) {
      const clash = await prisma.school.findFirst({
        where: { id: { not: input.schoolId }, emailDomains: { hasSome: domains } },
        select: { name: true, emailDomains: true },
      });
      if (clash) {
        const overlap = domains.filter((d) => clash.emailDomains.includes(d));
        return { ok: false, error: `${overlap.join(", ")} already belongs to ${clash.name}` };
      }
    }

    const before = await prisma.school.findUnique({
      where: { id: input.schoolId },
      select: { emailDomains: true },
    });

    await prisma.school.update({
      where: { id: input.schoolId },
      data: {
        name,
        city: input.city?.trim() || null,
        region: input.region?.trim() || null,
        website: input.website?.trim() || null,
        type: input.type as never,
        enrollment: input.enrollment as never,
        studentCount: input.studentCount ?? null,
        emailDomains: domains,
      },
    });

    const added = domains.filter((d) => !(before?.emailDomains ?? []).includes(d));
    if (added.length > 0) {
      await log(
        input.schoolId,
        "NOTE",
        `Email domain${added.length === 1 ? "" : "s"} added: ${added.join(", ")}`,
        "Anyone signing in with an address on these joins this school automatically.",
        me?.id ?? null
      );
    }

    revalidatePath(`/admin/schools/${input.schoolId}`);
    revalidatePath("/admin/schools");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Add or update a contact at a school. */
export async function saveSchoolContact(input: {
  id?: string;
  schoolId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}): Promise<Result> {
  try {
    await requireAccountManager();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "A name is required" };

    // Only one primary contact per school.
    if (input.isPrimary) {
      await prisma.schoolContact.updateMany({
        where: { schoolId: input.schoolId, ...(input.id ? { id: { not: input.id } } : {}) },
        data: { isPrimary: false },
      });
    }

    const data = {
      schoolId: input.schoolId,
      name,
      title: input.title?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      isPrimary: input.isPrimary,
    };

    if (input.id) await prisma.schoolContact.update({ where: { id: input.id }, data });
    else await prisma.schoolContact.create({ data });

    revalidatePath(`/admin/schools/${input.schoolId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteSchoolContact(id: string, schoolId: string): Promise<Result> {
  try {
    await requireAccountManager();
    await prisma.schoolContact.delete({ where: { id } });
    revalidatePath(`/admin/schools/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Answer a school's plan change request. Without this the school admin sends
 * a message into nowhere, which is worse than not offering the button.
 */
export async function respondToPlanRequest(input: {
  requestId: string;
  response: string;
  status: "ANSWERED" | "ACTIONED" | "DECLINED";
}): Promise<Result> {
  try {
    const me = await requireAccountManager();
    const response = input.response.trim();
    if (!response) return { ok: false, error: "Write a reply first" };

    const req = await prisma.planChangeRequest.update({
      where: { id: input.requestId },
      data: {
        response,
        status: input.status as never,
        respondedById: me?.id ?? null,
        respondedAt: new Date(),
      },
      select: { schoolId: true },
    });

    await log(
      req.schoolId,
      "NOTE",
      `Replied to the school's plan request (${input.status.toLowerCase()})`,
      response,
      me?.id ?? null
    );

    revalidatePath(`/admin/schools/${req.schoolId}`);
    revalidatePath("/school/plan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Attach a user to a school, and optionally make them its administrator. */
export async function assignUserToSchool(
  userId: string,
  schoolId: string | null,
  makeSchoolAdmin = false
): Promise<Result> {
  try {
    const me = await requireAccountManager();
    await prisma.user.update({
      where: { id: userId },
      data: {
        schoolId,
        ...(makeSchoolAdmin && schoolId ? { role: "SCHOOL_ADMIN" as never } : {}),
      },
    });
    if (schoolId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      await log(
        schoolId,
        "ACCESS_GRANTED",
        makeSchoolAdmin
          ? `${u?.email ?? "A user"} made school administrator`
          : `${u?.email ?? "A user"} added to the school`,
        null,
        me?.id ?? null
      );
    }
    revalidatePath("/admin/users");
    if (schoolId) revalidatePath(`/admin/schools/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Create an account directly, with a password, and hand the password over.
 *
 * This is how people get in before Google sign-in exists. The password is
 * returned once so it can be given to the person; it is never stored in
 * readable form and cannot be retrieved again.
 */
export async function createUserAccount(input: {
  email: string;
  name?: string;
  role: string;
  schoolId?: string | null;
  /** Leave empty to have one generated. */
  password?: string;
}): Promise<Result & { password?: string; id?: string }> {
  try {
    const me = await requireAccountManager();
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) return { ok: false, error: "Enter a valid email address" };

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { ok: false, error: "An account with that email already exists" };

    const password = input.password?.trim() || generateTempPassword();
    const problem = input.password?.trim() ? passwordProblem(password) : null;
    if (problem) return { ok: false, error: problem };

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name?.trim() || null,
        role: input.role as never,
        schoolId: input.schoolId || null,
        passwordHash: await hashPassword(password),
        // They should choose their own once they are in.
        mustChangePassword: true,
        active: true,
      },
    });

    if (input.schoolId) {
      await log(
        input.schoolId,
        "ACCESS_GRANTED",
        `Account created for ${email}`,
        `Role: ${input.role.replace(/_/g, " ").toLowerCase()}.`,
        me?.id ?? null
      );
    }

    revalidatePath("/admin/users");
    if (input.schoolId) revalidatePath(`/admin/schools/${input.schoolId}`);
    // Returned once, so it can be handed over.
    return { ok: true, password, id: user.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Issue a new password for someone who cannot get in. Shown once. */
export async function resetUserPassword(userId: string): Promise<Result & { password?: string }> {
  try {
    await requireAccountManager();
    const password = generateTempPassword();
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password), mustChangePassword: true },
    });
    revalidatePath("/admin/users");
    return { ok: true, password };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Suspend or restore a single login without deleting the account. */
export async function setUserActive(userId: string, active: boolean): Promise<Result> {
  try {
    await requireAccountManager();
    await prisma.user.update({ where: { id: userId }, data: { active } });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Only SUPER_ADMIN can change roles — this is how staff access is granted. */
export async function setUserRole(userId: string, role: string): Promise<Result> {
  try {
    const session = await safeAuth();
    if (isAuthConfigured && !canManageRoles(session?.user)) {
      return { ok: false, error: "Only a super admin can change roles" };
    }
    if (!isDatabaseConfigured()) return { ok: false, error: "Database not connected" };
    await prisma.user.update({ where: { id: userId }, data: { role: role as never } });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setDemoStatus(id: string, status: string): Promise<Result> {
  try {
    await requireAccountManager();
    await prisma.demoRequest.update({ where: { id }, data: { status: status as never } });
    revalidatePath("/admin/demos");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Turn a demo request into a real school account, carrying the requester
 * across as the first contact and logging where the account came from.
 */
export async function convertDemoToSchool(demoId: string): Promise<Result & { id?: string }> {
  try {
    const me = await requireAccountManager();
    const demo = await prisma.demoRequest.findUnique({ where: { id: demoId } });
    if (!demo) return { ok: false, error: "Demo request not found" };
    if (demo.schoolId) return { ok: false, error: "Already converted" };

    const name = (demo.schoolName || demo.name).trim();
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    let slug = base || "school";
    let n = 1;
    while (await prisma.school.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        status: "DEMO_SCHEDULED",
        accountManagerId: me?.id ?? null,
        contacts: {
          create: {
            name: demo.name,
            email: demo.email,
            phone: demo.phone,
            isPrimary: true,
          },
        },
      },
    });

    await prisma.demoRequest.update({
      where: { id: demoId },
      data: { status: "CONVERTED", schoolId: school.id },
    });

    await log(
      school.id,
      "DEMO",
      `Created from a demo request by ${demo.name}`,
      demo.message,
      me?.id ?? null
    );

    revalidatePath("/admin/demos");
    revalidatePath("/admin/schools");
    return { ok: true, id: school.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Mark a contact-form message dealt with, or put it back. */
export async function setMessageHandled(id: string, handled: boolean): Promise<Result> {
  try {
    await requireAccountManager();
    await prisma.contactMessage.update({ where: { id }, data: { handled } });
    revalidatePath("/admin/demos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
