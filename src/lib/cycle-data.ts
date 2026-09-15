import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { CYCLES, type Cycle } from "@/lib/cycles";

/**
 * Cycles, from the database when any are saved and from the static list until
 * then.
 *
 * The static array in lib/cycles.ts stays as the fallback, and its date
 * arithmetic helpers (getCycleState, getCurrentWeek) still do the work — they
 * take a Cycle, and a row from here is one.
 */

function iso(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export async function getCycles(): Promise<Cycle[]> {
  if (!isDatabaseConfigured()) return CYCLES;
  try {
    const rows = await prisma.cycle.findMany({
      orderBy: { num: "asc" },
      include: { weekPlan: { orderBy: { order: "asc" } } },
    });
    if (rows.length === 0) return CYCLES;

    return rows.map((c) => ({
      num: c.num,
      slug: c.slug,
      theme: c.theme,
      gloss: c.gloss,
      question: c.question,
      hebrew: c.hebrew,
      anchor: c.anchor,
      range: c.range,
      startDate: iso(c.startDate),
      endDate: iso(c.endDate),
      weeks: c.weeks,
      color: c.color,
      tags: c.tags,
      desc: c.desc,
      focus: c.focus,
      weekPlan: c.weekPlan.map((w) => ({ title: w.title, body: w.body })),
    }));
  } catch {
    return CYCLES;
  }
}

export async function getCycle(slug: string): Promise<Cycle | undefined> {
  return (await getCycles()).find((c) => c.slug === slug);
}

/** Whichever cycle today falls inside, or the first one if none does. */
export async function getRunningCycle(): Promise<Cycle> {
  const all = await getCycles();
  const now = Date.now();
  const running = all.find((c) => {
    const start = new Date(c.startDate).getTime();
    const end = new Date(c.endDate).setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  });
  return running ?? all[0];
}
