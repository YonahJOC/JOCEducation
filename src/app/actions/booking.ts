"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Where a school books time with JOC.
 *
 * Kept by the people whose calendars they are rather than set in code: a
 * booking link moves, and a stale one costs a school an afternoon before
 * anybody at JOC finds out.
 */

export type BookingResult = { ok: true } | { ok: false; error: string };

/** Only http(s), and only a real address. A typo here sends a school nowhere. */
function clean(raw: string): string | null | undefined {
  const url = raw.trim();
  if (!url) return null; // Deliberately cleared.
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export async function setProgramBookingUrl(
  programId: number,
  _prev: BookingResult | null,
  form: FormData,
): Promise<BookingResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const session = await safeAuth();
  const me = session?.user;

  // Whoever runs the program, or whoever may edit programs at all.
  let allowed = openForReview || can(me, "programs") || can(me, "coordinators");
  if (!allowed && me?.id) {
    allowed =
      (await prisma.programPage.count({
        where: { id: programId, leads: { some: { id: me.id } } },
      })) > 0;
  }
  if (!allowed) return { ok: false, error: "That isn't yours to change." };

  const url = clean(String(form.get("url") ?? ""));
  if (url === undefined) {
    return { ok: false, error: "That doesn't look like a web address. It should start https://" };
  }

  try {
    await prisma.programPage.update({
      where: { id: programId },
      data: { bookingUrl: url },
    });
    revalidatePath("/admin/programs");
    revalidatePath("/school/messages");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/** A person's own calendar, used wherever they are the one reading. */
export async function setMyBookingUrl(
  _prev: BookingResult | null,
  form: FormData,
): Promise<BookingResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const session = await safeAuth();
  const id = session?.user?.id;
  if (!id) return { ok: false, error: "Sign in first." };

  const url = clean(String(form.get("url") ?? ""));
  if (url === undefined) {
    return { ok: false, error: "That doesn't look like a web address. It should start https://" };
  }

  try {
    await prisma.user.update({ where: { id }, data: { bookingUrl: url } });
    revalidatePath("/account");
    revalidatePath("/school/messages");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}
