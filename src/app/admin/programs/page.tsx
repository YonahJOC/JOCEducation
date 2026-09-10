import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { ProgramsClient, type ProgramRow } from "./ProgramsClient";

export const metadata = { title: "Programs — JOC Console" };

async function getPrograms(): Promise<ProgramRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.programPage.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      include: { steps: { orderBy: { order: "asc" } } },
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
      howItWorks: p.steps.map((s) => ({ step: s.step, title: s.title, description: s.description })),
      externalHref: p.externalHref,
      cta: p.cta,
      published: p.published,
      sort: p.sort,
    }));
  } catch {
    return [];
  }
}

export default async function AdminProgramsPage() {
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
