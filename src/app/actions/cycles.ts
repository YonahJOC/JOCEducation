"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageContent } from "@/lib/access";

/**
 * Editing the Chesed Cycles.
 *
 * These decide what the whole site shows each week, so the guards are a
 * little tighter than elsewhere: a cycle cannot end before it starts, two
 * cycles cannot claim the same weeks, and the number of weeks has to match
 * the dates rather than be asserted separately.
 */

type Result = { ok: true } | { ok: false; error: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Whole weeks between two dates, rounded up, at least one. */
function weeksBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (7 * 86_400_000)));
}

export async function saveCycle(input: {
  id?: number;
  num: number;
  slug?: string;
  theme: string;
  gloss: string;
  question: string;
  hebrew: string;
  anchor: string;
  range: string;
  startDate: string;
  endDate: string;
  color: string;
  israel: boolean;
  desc: string;
  focus: string[];
  weekPlan: { title: string; body: string }[];
}): Promise<Result> {
  const session = await safeAuth();
  if (!canManageContent(session?.user)) {
    return { ok: false, error: "You need educational team access to change the cycles." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  const theme = input.theme.trim();
  if (!theme) return { ok: false, error: "A cycle needs a theme." };

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: "Those dates are not readable." };
  }
  if (end <= start) return { ok: false, error: "A cycle cannot end before it begins." };

  try {
    const slug = (input.slug?.trim() || slugify(theme)).toLowerCase();

    // Two cycles running the same weeks would make "what is running now"
    // ambiguous for the entire site.
    const overlapping = await prisma.cycle.findFirst({
      where: {
        id: input.id ? { not: input.id } : undefined,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { num: true, theme: true },
    });
    if (overlapping) {
      return {
        ok: false,
        error: `Those dates overlap Cycle ${overlapping.num} (${overlapping.theme}). Two cycles cannot run at once.`,
      };
    }

    const clashSlug = await prisma.cycle.findUnique({ where: { slug }, select: { id: true } });
    if (clashSlug && clashSlug.id !== input.id) {
      return { ok: false, error: "Another cycle already uses that web address." };
    }
    const clashNum = await prisma.cycle.findUnique({ where: { num: input.num }, select: { id: true } });
    if (clashNum && clashNum.id !== input.id) {
      return { ok: false, error: `Cycle ${input.num} already exists.` };
    }

    const data = {
      slug,
      num: Number(input.num),
      theme,
      gloss: input.gloss.trim(),
      question: input.question.trim(),
      hebrew: input.hebrew.trim(),
      anchor: input.anchor.trim(),
      range: input.range.trim(),
      startDate: start,
      endDate: end,
      // Derived, so it can never disagree with the dates.
      weeks: weeksBetween(start, end),
      color: input.color.trim() || "#2D46AF",
      israel: input.israel,
      desc: input.desc.trim(),
      focus: input.focus.map((f) => f.trim()).filter(Boolean),
    };

    const weekPlan = {
      create: input.weekPlan
        .filter((w) => w.title.trim())
        .map((w, order) => ({ title: w.title.trim(), body: w.body.trim(), order })),
    };

    if (input.id) {
      await prisma.$transaction([
        prisma.cycleWeek.deleteMany({ where: { cycleId: input.id } }),
        prisma.cycle.update({ where: { id: input.id }, data: { ...data, weekPlan } }),
      ]);
    } else {
      await prisma.cycle.create({ data: { ...data, weekPlan } });
    }

    revalidatePath("/cycles");
    revalidatePath(`/cycles/${slug}`);
    revalidatePath("/home");
    revalidatePath("/admin/cycles");
    revalidatePath("/admin/coverage");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save that cycle." };
  }
}

export async function deleteCycle(id: number): Promise<Result> {
  const session = await safeAuth();
  if (!canManageContent(session?.user)) {
    return { ok: false, error: "You need educational team access to remove a cycle." };
  }
  try {
    await prisma.cycle.delete({ where: { id } });
    revalidatePath("/cycles");
    revalidatePath("/admin/cycles");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove that cycle." };
  }
}

/**
 * Copies the eight cycles out of the code into the database so they can be
 * edited. Only ever adds what is missing.
 */
export async function importStaticCycles(): Promise<Result> {
  const session = await safeAuth();
  if (!canManageContent(session?.user)) {
    return { ok: false, error: "You need educational team access to do that." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  try {
    const { CYCLES } = await import("@/lib/cycles");
    const existing = await prisma.cycle.findMany({ select: { slug: true } });
    const have = new Set(existing.map((e) => e.slug));

    let added = 0;
    for (const c of CYCLES) {
      if (have.has(c.slug)) continue;
      await prisma.cycle.create({
        data: {
          slug: c.slug,
          num: c.num,
          theme: c.theme,
          gloss: c.gloss,
          question: c.question,
          hebrew: c.hebrew,
          anchor: c.anchor,
          range: c.range,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          weeks: c.weeks,
          color: c.color,
          israel: Boolean(c.israel),
          desc: c.desc,
          focus: c.focus,
          weekPlan: {
            create: c.weekPlan.map((w, order) => ({ title: w.title, body: w.body, order })),
          },
        },
      });
      added++;
    }

    revalidatePath("/cycles");
    revalidatePath("/admin/cycles");
    return added > 0 ? { ok: true } : { ok: false, error: "All eight are already here." };
  } catch {
    return { ok: false, error: "Could not import the cycles." };
  }
}
