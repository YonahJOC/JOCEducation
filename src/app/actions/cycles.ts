"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageContent } from "@/lib/access";
import { formatCycleRange, relinkCycles } from "@/lib/cycles";

/**
 * Editing the Chesed Cycles.
 *
 * These decide what the whole site shows each week, so rather than validating
 * hard and refusing, the shape of the year is kept correct by construction:
 * the cycles are a chain, each beginning the day after the one before it
 * ends, and every save pulls that chain back together. Overlaps and gaps
 * cannot be expressed, so they never have to be rejected.
 *
 * The length and the written-out date range are both derived from the two
 * dates, so neither can drift away from them.
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

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Pull the whole year back into one contiguous chain.
 *
 * Run after every save and every delete. Each cycle keeps the length it has;
 * only where it sits moves. The first cycle's start is the one fixed point —
 * everything else follows from it.
 *
 * Writes only the rows that actually changed, so editing the last cycle costs
 * one update rather than eight.
 */
async function relinkAll(): Promise<void> {
  const rows = await prisma.cycle.findMany({
    orderBy: { num: "asc" },
    select: { id: true, startDate: true, endDate: true, range: true, weeks: true },
  });

  const linked = relinkCycles(
    rows.map((r) => ({
      id: r.id,
      startDate: isoDay(r.startDate),
      endDate: isoDay(r.endDate),
      was: r,
    }))
  );

  const edits = linked.flatMap((c) => {
    const start = new Date(`${c.startDate}T00:00:00.000Z`);
    const end = new Date(`${c.endDate}T00:00:00.000Z`);
    const range = formatCycleRange(start, end);
    const weeks = weeksBetween(start, end);

    const same =
      isoDay(c.was.startDate) === c.startDate &&
      isoDay(c.was.endDate) === c.endDate &&
      c.was.range === range &&
      c.was.weeks === weeks;
    if (same) return [];

    return [
      prisma.cycle.update({
        where: { id: c.id },
        data: { startDate: start, endDate: end, range, weeks },
      }),
    ];
  });

  if (edits.length > 0) await prisma.$transaction(edits);
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
  // No `range` — it is derived from the dates below. See formatCycleRange.
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

    // No overlap check. Overlapping used to be refused, which pushed the work
    // of untangling the year onto whoever was editing it — see relinkCycles.
    // The cycles after this one are moved to fit instead.

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
      startDate: start,
      endDate: end,
      // Both derived, so neither can disagree with the dates. `range` is the
      // string every public page renders — it was typed by hand, so changing
      // the dates used to change nothing anybody could see.
      range: formatCycleRange(start, end),
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

    // Close the chain back up. Whatever this edit did to the shape of the
    // year, the cycles after it move to stay contiguous, each keeping its own
    // length. This is what makes a single date change a single action.
    await relinkAll();

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
    // A deleted cycle leaves a hole in the year; close it up.
    await relinkAll();
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
          range: formatCycleRange(c.startDate, c.endDate),
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
