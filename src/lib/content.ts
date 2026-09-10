import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { LESSONS, type Lesson } from "@/lib/lessons";

/**
 * What the public site reads.
 *
 * The console writes lessons, resources and products to the database; these
 * are the reads that put them on the site. Without this the Education Team
 * publishes into a void — which is exactly where things stood.
 *
 * Every read falls back to the static starter content, so an unreachable
 * database degrades to what the site showed before rather than to nothing.
 */

export type PublicLesson = Lesson & { cycleSlug?: string | null };

export async function getPublishedLessons(): Promise<PublicLesson[]> {
  if (!isDatabaseConfigured()) return LESSONS;
  try {
    const rows = await prisma.lessonPlan.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { id: "asc" }],
      include: {
        objectives: { orderBy: { order: "asc" } },
        materials: { orderBy: { order: "asc" } },
        discussion: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
        files: { orderBy: { order: "asc" } },
      },
    });
    // Before anything is published, the starter set is better than a blank page.
    if (rows.length === 0) return LESSONS;

    return rows.map((l) => ({
      id: l.id,
      theme: l.theme,
      title: l.title,
      description: l.description,
      grade: l.grade as Lesson["grade"],
      time: l.timeMinutes as Lesson["time"],
      prep: l.prep as Lesson["prep"],
      files: l.files.map((f) => f.name),
      objectives: l.objectives.map((o) => o.text),
      materials: l.materials.map((m) => m.text),
      steps: l.steps.map((s) => ({
        duration: s.duration,
        title: s.title,
        description: s.description,
      })),
      discussion: l.discussion.map((d) => d.text),
      cycleSlug: l.cycleSlug,
    }));
  } catch {
    return LESSONS;
  }
}

export async function getPublishedLesson(id: number): Promise<PublicLesson | null> {
  const all = await getPublishedLessons();
  return all.find((l) => l.id === id) ?? null;
}

export type PublicResource = {
  id: number;
  tag: string;
  title: string;
  description: string;
  fileUrl: string | null;
  cycleSlug: string | null;
};

export async function getPublishedResources(): Promise<PublicResource[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.resource.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      tag: r.tag,
      title: r.title,
      description: r.description,
      fileUrl: r.fileUrl,
      cycleSlug: r.cycleSlug,
    }));
  } catch {
    return [];
  }
}

export type PublicProduct = {
  id: string;
  name: string;
  description: string;
  /** Whole dollars, for display. */
  price: number;
  unit: string;
  inStock: boolean;
};

export async function getPublishedProducts(): Promise<PublicProduct[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price / 100,
      unit: p.unit,
      inStock: p.inStock,
    }));
  } catch {
    return [];
  }
}

export type PublicBoardPost = {
  id: string;
  title: string;
  body: string;
  region: string;
  schoolName: string;
  grade: string;
  likes: number;
  createdAt: Date;
  author: string | null;
};

/** Only approved posts ever reach the public board. */
export async function getApprovedBoardPosts(): Promise<PublicBoardPost[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.boardPost.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    });
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      region: p.region,
      schoolName: p.schoolName,
      grade: p.grade as string,
      likes: p.likes,
      createdAt: p.createdAt,
      author: p.user?.name ?? p.user?.email ?? null,
    }));
  } catch {
    return [];
  }
}

/** Lessons and resources tagged to one Chesed Cycle. */
export async function getCycleContent(cycleSlug: string) {
  const [lessons, resources] = await Promise.all([
    getPublishedLessons(),
    getPublishedResources(),
  ]);
  return {
    lessons: lessons.filter((l) => l.cycleSlug === cycleSlug),
    resources: resources.filter((r) => r.cycleSlug === cycleSlug),
  };
}
