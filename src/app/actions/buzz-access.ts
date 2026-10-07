"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Who may read the Buzz, one person at a time.
 *
 * Kept apart from admin types on purpose: a type says what a job can do, and
 * this is a list of named people somebody chose. Mixing them means granting
 * the Buzz by changing what the whole programming team can do.
 *
 * Only somebody who can already manage people may change this list — the same
 * bar as handing out any other access.
 */

export type AccessResult = { ok: true } | { ok: false; error: string };

async function guard(): Promise<AccessResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "users")) {
    return { ok: false, error: "You can't change who has access." };
  }
  return { ok: true };
}

export async function setBuzzAccess(userId: string, on: boolean): Promise<AccessResult> {
  const allowed = await guard();
  if (!allowed.ok) return allowed;

  const who = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, schoolId: true },
  }).catch(() => null);

  if (!who) return { ok: false, error: "That person is no longer here." };

  // The Buzz is every school's history on one screen, so somebody tied to one
  // school is refused here as well as at the page itself — otherwise this
  // list would say they have something they cannot actually open.
  if (on && who.schoolId) {
    return { ok: false, error: "That account belongs to a school, so it can't see the Buzz." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { buzzAccess: on } });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/admin/buzz");
  revalidatePath("/buzz");
  return { ok: true };
}

/**
 * Give somebody the Buzz before they have an account.
 *
 * Somebody starts on Monday; the moment to decide they should see this is
 * then, not the first time they happen to sign in. If they already have an
 * account the switch is flipped instead, so one address cannot end up both
 * invited and listed.
 */
export async function inviteToBuzz(nameRaw: string, emailRaw: string): Promise<AccessResult> {
  const allowed = await guard();
  if (!allowed.ok) return allowed;

  const name = nameRaw.trim().slice(0, 120) || null;
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "An email address is how their account is matched — it needs one." };
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, schoolId: true, name: true },
  }).catch(() => null);

  if (existing?.schoolId) {
    return { ok: false, error: "That account belongs to a school, so it can't see the Buzz." };
  }

  try {
    if (existing) {
      // They are already here. No invite — switch them on, and give them a
      // name if the account has none.
      await prisma.user.update({
        where: { id: existing.id },
        data: { buzzAccess: true, ...(existing.name ? {} : name ? { name } : {}) },
      });
    } else {
      await prisma.buzzInvite.upsert({
        where: { email },
        create: { email, name, invitedById: (await safeAuth())?.user?.id ?? null },
        update: name ? { name } : {},
      });
    }
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/admin/buzz");
  return { ok: true };
}

/** Correct a name or an address on somebody who has not signed in yet. */
export async function editBuzzInvite(
  currentEmail: string,
  nameRaw: string,
  emailRaw: string,
): Promise<AccessResult> {
  const allowed = await guard();
  if (!allowed.ok) return allowed;

  const name = nameRaw.trim().slice(0, 120) || null;
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "An email address is how their account is matched — it needs one." };
  }

  // Changed to an address that already has an account: switch that account
  // on instead, and drop the invite. Otherwise the invite would sit there
  // forever waiting for a sign-in that has already happened.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, schoolId: true, name: true },
  }).catch(() => null);

  if (existing?.schoolId) {
    return { ok: false, error: "That account belongs to a school, so it can't see the Buzz." };
  }

  try {
    if (existing) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: existing.id },
          data: { buzzAccess: true, ...(existing.name ? {} : name ? { name } : {}) },
        }),
        prisma.buzzInvite.deleteMany({ where: { email: currentEmail.trim().toLowerCase() } }),
      ]);
    } else {
      await prisma.buzzInvite.update({
        where: { email: currentEmail.trim().toLowerCase() },
        data: { name, email },
      });
    }
  } catch {
    return { ok: false, error: "That didn't save — is the new address already on the list?" };
  }

  revalidatePath("/admin/buzz");
  return { ok: true };
}

/** Take back an invite nobody has used yet. */
export async function cancelBuzzInvite(email: string): Promise<AccessResult> {
  const allowed = await guard();
  if (!allowed.ok) return allowed;

  try {
    await prisma.buzzInvite.deleteMany({ where: { email: email.trim().toLowerCase() } });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/admin/buzz");
  return { ok: true };
}
