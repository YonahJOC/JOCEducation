import { CYCLES } from "@/lib/cycles";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { ResourcesClient, type ResourceRow } from "./ResourcesClient";

export const metadata = { title: "Resources — JOC Console" };

async function getResources(): Promise<ResourceRow[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.resource.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    tag: r.tag,
    description: r.description,
    fileUrl: r.fileUrl,
    cycleSlug: r.cycleSlug,
    published: r.published,
  }));
}

export default async function AdminResourcesPage() {
  const resources = await getResources();
  const cycles = CYCLES.map((c) => ({ slug: c.slug, theme: c.theme, num: c.num }));
  return (
    <ResourcesClient
      resources={resources}
      cycles={cycles}
      disabled={!isDatabaseConfigured()}
    />
  );
}
