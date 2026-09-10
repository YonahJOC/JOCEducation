"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, isAuthConfigured } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageContent } from "@/lib/access";

/**
 * Content management for the JOC educational team (ADMIN and above).
 *
 * Separate from actions/admin.ts, which handles school accounts and money and
 * requires SUPER_ADMIN. The education team can publish and edit material
 * without being able to touch anyone's account.
 */

type Result = { ok: true; id?: string | number } | { ok: false; error: string };

async function requireContentEditor() {
  const session = await safeAuth();
  if (isAuthConfigured && !canManageContent(session?.user)) {
    throw new Error("You need educational team access to change content");
  }
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  return session?.user ?? null;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

// ─── Lesson plans ────────────────────────────────────────────────────────────

export async function saveLesson(input: {
  id?: number;
  title: string;
  theme: string;
  description: string;
  grade: "es" | "ms" | "hs";
  timeMinutes: number;
  prep: "Minimal" | "Moderate" | "Substantial";
  cycleSlug?: string | null;
  published: boolean;
  featured: boolean;
  objectives: string[];
  materials: string[];
  discussion: string[];
  steps: { duration: string; title: string; description: string }[];
  files: { name: string; url: string }[];
}): Promise<Result> {
  try {
    await requireContentEditor();
    const title = input.title.trim();
    if (!title) return { ok: false, error: "A title is required" };

    const data = {
      title,
      theme: input.theme.trim(),
      description: input.description.trim(),
      grade: input.grade as never,
      timeMinutes: Number(input.timeMinutes) || 20,
      prep: input.prep as never,
      cycleSlug: input.cycleSlug || null,
      published: input.published,
      featured: input.featured,
    };

    const children = {
      objectives: {
        create: input.objectives.filter((t) => t.trim()).map((text, order) => ({ text: text.trim(), order })),
      },
      materials: {
        create: input.materials.filter((t) => t.trim()).map((text, order) => ({ text: text.trim(), order })),
      },
      discussion: {
        create: input.discussion.filter((t) => t.trim()).map((text, order) => ({ text: text.trim(), order })),
      },
      steps: {
        create: input.steps
          .filter((s) => s.title.trim())
          .map((s, order) => ({
            duration: s.duration.trim() || "5 min",
            title: s.title.trim(),
            description: s.description.trim(),
            order,
          })),
      },
      files: {
        create: input.files
          .filter((f) => f.name.trim() && f.url.trim())
          .map((f, order) => ({ name: f.name.trim(), url: f.url.trim(), order })),
      },
    };

    let id: number;
    if (input.id) {
      // Replace the child rows wholesale — simpler and safer than diffing.
      await prisma.$transaction([
        prisma.lessonObjective.deleteMany({ where: { lessonId: input.id } }),
        prisma.lessonMaterial.deleteMany({ where: { lessonId: input.id } }),
        prisma.lessonDiscussion.deleteMany({ where: { lessonId: input.id } }),
        prisma.lessonStep.deleteMany({ where: { lessonId: input.id } }),
        prisma.lessonFile.deleteMany({ where: { lessonId: input.id } }),
        prisma.lessonPlan.update({ where: { id: input.id }, data: { ...data, ...children } }),
      ]);
      id = input.id;
    } else {
      let slug = slugify(title);
      let n = 1;
      while (await prisma.lessonPlan.findUnique({ where: { slug } })) slug = `${slugify(title)}-${++n}`;
      const created = await prisma.lessonPlan.create({ data: { ...data, slug, ...children } });
      id = created.id;
    }

    revalidatePath("/admin/lessons");
    revalidatePath("/lesson-plans");
    revalidatePath(`/lesson-plans/${id}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setLessonPublished(id: number, published: boolean): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.lessonPlan.update({ where: { id }, data: { published } });
    revalidatePath("/admin/lessons");
    revalidatePath("/lesson-plans");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteLesson(id: number): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.lessonPlan.delete({ where: { id } });
    revalidatePath("/admin/lessons");
    revalidatePath("/lesson-plans");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─── Resources ───────────────────────────────────────────────────────────────

export async function saveResource(input: {
  id?: number;
  title: string;
  tag: string;
  description: string;
  fileUrl?: string | null;
  cycleSlug?: string | null;
  published: boolean;
}): Promise<Result> {
  try {
    await requireContentEditor();
    const title = input.title.trim();
    if (!title) return { ok: false, error: "A title is required" };

    const data = {
      title,
      tag: input.tag.trim() || "Resource",
      description: input.description.trim(),
      fileUrl: input.fileUrl?.trim() || null,
      cycleSlug: input.cycleSlug || null,
      published: input.published,
    };

    const row = input.id
      ? await prisma.resource.update({ where: { id: input.id }, data })
      : await prisma.resource.create({ data });

    revalidatePath("/admin/resources");
    revalidatePath("/resources");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteResource(id: number): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.resource.delete({ where: { id } });
    revalidatePath("/admin/resources");
    revalidatePath("/resources");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function saveProduct(input: {
  id?: string;
  name: string;
  description: string;
  /** Whole dollars from the form; stored as cents. */
  priceDollars: number;
  unit: string;
  inStock: boolean;
}): Promise<Result> {
  try {
    await requireContentEditor();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "A name is required" };

    const data = {
      name,
      description: input.description.trim(),
      price: Math.round((Number(input.priceDollars) || 0) * 100),
      unit: input.unit.trim() || "item",
      inStock: input.inStock,
    };

    const row = input.id
      ? await prisma.product.update({ where: { id: input.id }, data })
      : await prisma.product.create({ data });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteProduct(id: string): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─── Teachers' Board moderation ──────────────────────────────────────────────

export async function setBoardPostApproved(id: string, approved: boolean): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.boardPost.update({ where: { id }, data: { approved } });
    revalidatePath("/admin/board");
    revalidatePath("/board");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteBoardPost(id: string): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.boardPost.delete({ where: { id } });
    revalidatePath("/admin/board");
    revalidatePath("/board");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─── Programs ────────────────────────────────────────────────────────────────

export async function saveProgram(input: {
  id?: number;
  slug: string;
  name: string;
  tag: string;
  tagline: string;
  description: string;
  heroColor: string;
  meta: string;
  available: string[];
  whatsIncluded: string[];
  howItWorks: { step: string; title: string; description: string }[];
  externalHref?: string | null;
  cta: string;
  published: boolean;
  sort: number;
}): Promise<Result> {
  try {
    await requireContentEditor();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "A name is required" };

    const slug = (input.slug.trim() || slugify(name)).toLowerCase();
    const clash = await prisma.programPage.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== input.id) {
      return { ok: false, error: `Another program already uses the address /programs/${slug}` };
    }

    const data = {
      slug,
      name,
      tag: input.tag.trim() || "Ongoing",
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      heroColor: input.heroColor.trim() || "#2D46AF",
      meta: input.meta.trim(),
      available: input.available.map((a) => a.trim()).filter(Boolean),
      whatsIncluded: input.whatsIncluded.map((a) => a.trim()).filter(Boolean),
      externalHref: input.externalHref?.trim() || null,
      cta: input.cta.trim() || "Register your school",
      published: input.published,
      sort: Number(input.sort) || 0,
    };

    const steps = {
      create: input.howItWorks
        .filter((s) => s.title.trim())
        .map((s, order) => ({
          step: s.step.trim() || String(order + 1).padStart(2, "0"),
          title: s.title.trim(),
          description: s.description.trim(),
          order,
        })),
    };

    let id: number;
    if (input.id) {
      await prisma.$transaction([
        prisma.programStep.deleteMany({ where: { programId: input.id } }),
        prisma.programPage.update({ where: { id: input.id }, data: { ...data, steps } }),
      ]);
      id = input.id;
    } else {
      const created = await prisma.programPage.create({ data: { ...data, steps } });
      id = created.id;
    }

    revalidatePath("/admin/programs");
    revalidatePath("/programs");
    revalidatePath(`/programs/${slug}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that program" };
  }
}

export async function deleteProgram(id: number): Promise<Result> {
  try {
    await requireContentEditor();
    await prisma.programPage.delete({ where: { id } });
    revalidatePath("/admin/programs");
    revalidatePath("/programs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete that program" };
  }
}

/**
 * Copies the six programs in lib/programs.ts into the database as drafts, so
 * the team edits real text rather than starting from an empty form. Only ever
 * adds what is missing.
 */
export async function seedProgramsFromStatic(): Promise<Result> {
  try {
    await requireContentEditor();
    const { PROGRAMS } = await import("@/lib/programs");
    const existing = await prisma.programPage.findMany({ select: { slug: true } });
    const have = new Set(existing.map((e) => e.slug));

    let added = 0;
    for (const [i, p] of PROGRAMS.entries()) {
      if (have.has(p.slug)) continue;
      await prisma.programPage.create({
        data: {
          slug: p.slug,
          name: p.name,
          tag: p.tag,
          tagline: p.tagline,
          description: p.description,
          heroColor: p.heroColor,
          meta: p.meta,
          available: p.available,
          whatsIncluded: p.whatsIncluded,
          externalHref: p.externalHref ?? null,
          cta: p.cta,
          published: true,
          sort: i,
          steps: {
            create: p.howItWorks.map((s, order) => ({
              step: s.step, title: s.title, description: s.description, order,
            })),
          },
        },
      });
      added++;
    }

    revalidatePath("/admin/programs");
    revalidatePath("/programs");
    return added > 0 ? { ok: true } : { ok: false, error: "All six are already here." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not import the programs" };
  }
}
