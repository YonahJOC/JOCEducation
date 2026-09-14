import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { CyclesClient, type CycleRow } from "./CyclesClient";

export const metadata = { title: "Chesed Cycles — JOC Console" };

const iso = (d: Date) => new Date(d).toISOString().slice(0, 10);

async function getCycles(): Promise<CycleRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const [rows, lessonCounts] = await Promise.all([
      prisma.cycle.findMany({
        orderBy: { num: "asc" },
        include: { weekPlan: { orderBy: { order: "asc" } } },
      }),
      prisma.lessonPlan.groupBy({
        by: ["cycleSlug"],
        where: { published: true },
        _count: { _all: true },
      }),
    ]);

    const counts = new Map(
      lessonCounts
        .filter((c) => c.cycleSlug)
        .map((c) => [c.cycleSlug as string, c._count._all])
    );

    return rows.map((c) => ({
      id: c.id,
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
      israel: c.israel,
      desc: c.desc,
      focus: c.focus.length > 0 ? c.focus : [""],
      weekPlan: c.weekPlan.length > 0
        ? c.weekPlan.map((w) => ({ title: w.title, body: w.body }))
        : [{ title: "", body: "" }],
      lessonCount: counts.get(c.slug) ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function AdminCyclesPage() {
  const cycles = await getCycles();
  return (
    <CyclesClient
      cycles={cycles}
      usingStatic={cycles.length === 0}
      disabled={!isDatabaseConfigured()}
    />
  );
}
