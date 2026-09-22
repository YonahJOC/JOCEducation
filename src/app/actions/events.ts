"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can } from "@/lib/access";

/**
 * The programming calendar — what is actually being run, and when.
 *
 * Distinct from the Chesed Cycles, which say what the whole network is
 * *learning* this month. This says what is *happening*: a Kindness Booth at
 * one school on the 14th, a Bake for Chesed across every school in Adar.
 *
 * Owned by the programming team. Its own permission, deliberately separate
 * from the cycle dates and from anything educational — running events and
 * writing lessons are different jobs.
 */

type Result = { ok: true; id?: number } | { ok: false; error: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

/** A plain day at UTC midnight, so an event never drifts across a timezone. */
function plainDay(value: string): Date | null {
  const d = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function saveEvent(input: {
  id?: number;
  kind: string;
  title: string;
  programId?: number | null;
  schoolId?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string;
  audience?: string;
  detail?: string;
  lead?: string;
  status: string;
  published: boolean;
}): Promise<Result> {
  const session = await safeAuth();
  if (!can(session?.user, "programming")) {
    return { ok: false, error: "You need calendar access to change the programming." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "An event needs a name." };

  const startsAt = plainDay(input.startsAt);
  if (!startsAt) return { ok: false, error: "That start date is not readable." };

  const endsAt = input.endsAt ? plainDay(input.endsAt) : null;
  if (input.endsAt && !endsAt) return { ok: false, error: "That end date is not readable." };
  if (endsAt && endsAt < startsAt) {
    return { ok: false, error: "An event cannot finish before it starts." };
  }

  // A school program that names no school is not a school program. The two
  // kinds are shown as separate lists, so this is the line between them.
  if (input.kind === "SCHOOL_PROGRAM" && !input.schoolId) {
    return { ok: false, error: "Choose which school this is running at, or make it a JOC program." };
  }

  // Published means a school will read it, so it has to say something.
  if (input.published && !input.detail?.trim()) {
    return { ok: false, error: "Write a line about what this is before publishing it." };
  }

  try {
    // Keep the address stable once an event is live; only a new one is slugged.
    let slug = input.id ? undefined : slugify(title);
    if (slug) {
      const taken = await prisma.programEvent.findUnique({ where: { slug }, select: { id: true } });
      if (taken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const data = {
      kind: input.kind as never,
      title,
      programId: input.programId ?? null,
      schoolId: input.schoolId || null,
      startsAt,
      endsAt,
      location: input.location?.trim() || null,
      audience: input.audience?.trim() || null,
      detail: input.detail?.trim() ?? "",
      lead: input.lead?.trim() || null,
      status: input.status as never,
      published: input.published,
    };

    const saved = input.id
      ? await prisma.programEvent.update({ where: { id: input.id }, data, select: { id: true } })
      : await prisma.programEvent.create({ data: { ...data, slug: slug! }, select: { id: true } });

    revalidatePath("/programming");
    revalidatePath("/admin/programming");
    revalidatePath("/home");
    return { ok: true, id: saved.id };
  } catch {
    return { ok: false, error: "Could not save that event." };
  }
}

export async function deleteEvent(id: number): Promise<Result> {
  const session = await safeAuth();
  if (!can(session?.user, "programming")) {
    return { ok: false, error: "You need calendar access to remove an event." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  try {
    await prisma.programEvent.delete({ where: { id } });
    revalidatePath("/programming");
    revalidatePath("/admin/programming");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove that event." };
  }
}

/**
 * Cancelling rather than deleting. An event a school was told about and then
 * called off is part of the record — quietly removing it makes the history
 * dishonest, and leaves the school wondering whether they imagined it.
 */
export async function cancelEvent(id: number): Promise<Result> {
  const session = await safeAuth();
  if (!can(session?.user, "programming")) {
    return { ok: false, error: "You need calendar access to cancel an event." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  try {
    await prisma.programEvent.update({ where: { id }, data: { status: "CANCELLED" } });
    revalidatePath("/programming");
    revalidatePath("/admin/programming");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not cancel that event." };
  }
}
