import { CYCLES } from "@/lib/cycles";
import { LESSONS } from "@/lib/lessons";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { LessonsClient, type LessonRow } from "./LessonsClient";

export const metadata = { title: "Lesson plans — JOC Console" };

/**
 * Reads live lessons once the database is connected; until then it shows the
 * static starter set so the editor can be reviewed. Saving is disabled in that
 * state — the console banner explains why.
 */
async function getLessons(): Promise<LessonRow[]> {
  if (!isDatabaseConfigured()) {
    return LESSONS.map((l) => ({
      id: l.id,
      title: l.title,
      theme: l.theme,
      description: l.description,
      grade: l.grade,
      timeMinutes: Number(l.time) || 20,
      prep: l.prep,
      cycleSlug: null,
      published: true,
      featured: false,
      objectives: l.objectives,
      materials: l.materials,
      discussion: l.discussion,
      steps: l.steps.map((s) => ({ duration: s.duration, title: s.title, description: s.description })),
    }));
  }

  const rows = await prisma.lessonPlan.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      objectives: { orderBy: { order: "asc" } },
      materials: { orderBy: { order: "asc" } },
      discussion: { orderBy: { order: "asc" } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  return rows.map((l) => ({
    id: l.id,
    title: l.title,
    theme: l.theme,
    description: l.description,
    grade: l.grade as LessonRow["grade"],
    timeMinutes: l.timeMinutes,
    prep: l.prep as LessonRow["prep"],
    cycleSlug: l.cycleSlug,
    published: l.published,
    featured: l.featured,
    objectives: l.objectives.map((o) => o.text),
    materials: l.materials.map((m) => m.text),
    discussion: l.discussion.map((d) => d.text),
    steps: l.steps.map((s) => ({ duration: s.duration, title: s.title, description: s.description })),
  }));
}

export default async function AdminLessonsPage() {
  const lessons = await getLessons();
  const cycles = CYCLES.map((c) => ({
    slug: c.slug, theme: c.theme, num: c.num, question: c.question, color: c.color,
  }));

  return (
    <LessonsClient
      lessons={lessons}
      cycles={cycles}
      disabled={!isDatabaseConfigured()}
    />
  );
}
