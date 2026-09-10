"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageAccounts, canManageRoles } from "@/lib/access";
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
  grantNote?: string;
  currentPeriodEnd?: string | null;
}): Promise<Result> {
  try {
    const me = await requireAccountManager();
    const { schoolId, plan, seats, interval, grantedManually, grantNote, currentPeriodEnd } = input;

    const existing = await prisma.subscription.findUnique({ where: { schoolId } });
    const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;

    await prisma.subscription.upsert({
      where: { schoolId },
      create: {
        schoolId,
        plan: plan as never,
        seats,
        interval: interval as never,
        grantedManually,
        grantNote: grantNote || null,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: plan as never,
        seats,
        interval: interval as never,
        grantedManually,
        grantNote: grantNote || null,
        currentPeriodEnd: periodEnd,
      },
    });

    await log(
      schoolId,
      existing ? "PLAN_CHANGE" : "ACCESS_GRANTED",
      existing ? `Plan changed from ${existing.plan} to ${plan}` : `Access granted on ${plan}`,
      grantedManually ? `Granted manually. ${grantNote ?? ""}`.trim() : null,
      me?.id ?? null
    );

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
    // TODO: send the invitation email once Resend is configured (tech plan Phase 5).
    revalidatePath(`/admin/schools/${input.schoolId}`);
    return { ok: true };
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
