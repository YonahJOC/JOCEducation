import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isPreviewing } from "@/lib/site-content";
import { SITE_FIELDS, sitePages } from "@/lib/site-fields";
import { SiteEditor, type EditorField, type EditorPage } from "./SiteEditor";

export const metadata = { title: "Site content — JOC Console" };

/**
 * Ensures every field in the registry exists as a row, using the value
 * currently hardcoded in the component. Runs on load so newly registered
 * fields appear without a manual step. Only ever inserts what is missing.
 */
async function ensureFields() {
  if (!isDatabaseConfigured()) return;
  try {
    const existing = await prisma.siteField.findMany({
      select: { page: true, section: true, key: true },
    });
    const have = new Set(existing.map((e) => `${e.page}|${e.section}|${e.key}`));
    const missing = SITE_FIELDS.filter((f) => !have.has(`${f.page}|${f.section}|${f.key}`));
    if (missing.length === 0) return;

    await prisma.siteField.createMany({
      data: missing.map((f) => ({
        page: f.page,
        section: f.section,
        key: f.key,
        label: f.label,
        type: f.type as never,
        help: f.help ?? null,
        valuePublished: f.value,
        sort: SITE_FIELDS.indexOf(f),
      })),
      skipDuplicates: true,
    });
  } catch {
    // The editor still renders; it will simply show nothing to edit.
  }
}

export default async function SiteContentPage() {
  await ensureFields();

  const previewing = await isPreviewing();
  const registryPages = sitePages();

  if (!isDatabaseConfigured()) {
    return (
      <div style={{ maxWidth: "560px" }}>
        <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: "#10233F", margin: "0 0 10px" }}>
          Site content
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.65, color: "rgba(16,35,63,.7)" }}>
          Editing the public site needs the database. Once <code>DATABASE_URL</code> is set, every
          field listed in the registry appears here with the wording the site currently uses.
        </p>
      </div>
    );
  }

  const rows = await prisma.siteField.findMany({
    orderBy: [{ page: "asc" }, { sort: "asc" }],
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  const sectionLabel = (page: string, section: string) =>
    SITE_FIELDS.find((f) => f.page === page && f.section === section)?.sectionLabel ?? section;

  const fields: EditorField[] = rows.map((r) => ({
    id: r.id,
    page: r.page,
    section: r.section,
    sectionLabel: sectionLabel(r.page, r.section),
    key: r.key,
    label: r.label,
    type: r.type,
    help: r.help,
    published: r.valuePublished,
    draft: r.valueDraft,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    updatedBy: r.updatedBy?.name ?? r.updatedBy?.email ?? null,
  }));

  const pages: EditorPage[] = registryPages.map((p) => ({
    page: p.page,
    label: p.label,
    fields: fields.filter((f) => f.page === p.page).length,
    drafts: fields.filter((f) => f.page === p.page && f.draft !== null).length,
  }));

  return <SiteEditor pages={pages} fields={fields} previewing={previewing} />;
}
