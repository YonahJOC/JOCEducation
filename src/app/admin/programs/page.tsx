import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { ProgramsClient, type ProgramRow } from "./ProgramsClient";
import { ProgramsGuard } from "@/components/admin/Guard";

export const metadata = { title: "Programs — JOC Console" };

async function getPrograms(): Promise<ProgramRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.programPage.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      include: {
        steps: { orderBy: { order: "asc" } },
        // Surfaced on the row so coordinators are visible from the list rather
        // than only inside a page nobody knew to open.
        _count: { select: { leads: true } },
        form: { select: { _count: { select: { responses: true } } } },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      tag: p.tag,
      tagline: p.tagline,
      description: p.description,
      heroColor: p.heroColor,
      meta: p.meta,
      available: p.available,
      whatsIncluded: p.whatsIncluded,
      howItWorks: p.steps.map((s) => ({ step: s.step, title: s.title, description: s.description, linkLabel: s.linkLabel, linkUrl: s.linkUrl })),
      externalHref: p.externalHref,
      videoUrl: p.videoUrl,
      leadCount: p._count.leads,
      responseCount: p.form?._count.responses ?? 0,
      cta: p.cta,
      published: p.published,
    comingSoon: p.comingSoon,
      sort: p.sort,
    }));
  } catch {
    return [];
  }
}

async function Inner() {
  const programs = await getPrograms();
  // The public site only switches over once something here is published.
  const usingStatic = programs.filter((p) => p.published).length === 0;

  return (
    <ProgramsClient
      programs={programs}
      usingStatic={usingStatic}
      disabled={!isDatabaseConfigured()}
    />
  );
}

export default async function AdminProgramsPage() {
  return <ProgramsGuard>{await Inner()}</ProgramsGuard>;
}
