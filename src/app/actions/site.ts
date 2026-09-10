"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { safeAuth, isAuthConfigured } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canManageContent } from "@/lib/access";
import { SITE_FIELDS } from "@/lib/site-fields";
import { PREVIEW_COOKIE } from "@/lib/site-content";

/**
 * Editing the public site.
 *
 * Edits write `valueDraft` and nothing public changes. Publishing copies
 * draft → published and writes a history row per field, which is what makes
 * every change reversible.
 *
 * Requires ADMIN (the JOC Education Team) or above.
 */

type Result = { ok: true } | { ok: false; error: string };

async function requireEditor() {
  const session = await safeAuth();
  if (isAuthConfigured && !canManageContent(session?.user)) {
    throw new Error("You need JOC Education Team access to edit the site");
  }
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  return session?.user ?? null;
}

/**
 * Create any registry field that does not exist yet, using the value
 * currently hardcoded in the component as its published value. Safe to run
 * repeatedly — it only ever inserts what is missing, never overwrites.
 */
export async function syncSiteFields(): Promise<Result & { added?: number }> {
  try {
    await requireEditor();
    const existing = await prisma.siteField.findMany({
      select: { page: true, section: true, key: true },
    });
    const have = new Set(existing.map((e) => `${e.page}|${e.section}|${e.key}`));

    const missing = SITE_FIELDS.filter((f) => !have.has(`${f.page}|${f.section}|${f.key}`));
    if (missing.length > 0) {
      await prisma.siteField.createMany({
        data: missing.map((f, i) => ({
          page: f.page,
          section: f.section,
          key: f.key,
          label: f.label,
          type: f.type as never,
          help: f.help ?? null,
          valuePublished: f.value,
          sort: i,
        })),
      });
    }
    revalidatePath("/admin/site");
    return { ok: true, added: missing.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Save an edit as a draft. Passing the published value clears the draft. */
export async function saveDraft(input: {
  page: string; section: string; key: string; value: string;
}): Promise<Result> {
  try {
    const me = await requireEditor();
    const field = await prisma.siteField.findUnique({
      where: { page_section_key: { page: input.page, section: input.section, key: input.key } },
    });
    if (!field) return { ok: false, error: "That field does not exist" };

    // Editing back to the live value is the same as discarding the draft.
    const draft = input.value === (field.valuePublished ?? "") ? null : input.value;

    await prisma.siteField.update({
      where: { id: field.id },
      data: { valueDraft: draft, updatedById: me?.id ?? null },
    });
    revalidatePath("/admin/site");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Throw away one pending draft. */
export async function discardDraft(fieldId: string): Promise<Result> {
  try {
    await requireEditor();
    await prisma.siteField.update({ where: { id: fieldId }, data: { valueDraft: null } });
    revalidatePath("/admin/site");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Publish every pending draft, or just one page's. Each published field gets
 * a history row so it can be rolled back individually.
 */
export async function publishDrafts(page?: string): Promise<Result & { published?: number }> {
  try {
    const me = await requireEditor();
    const pending = await prisma.siteField.findMany({
      where: { valueDraft: { not: null }, ...(page ? { page } : {}) },
    });
    if (pending.length === 0) return { ok: true, published: 0 };

    await prisma.$transaction([
      ...pending.map((f) =>
        prisma.siteField.update({
          where: { id: f.id },
          data: { valuePublished: f.valueDraft, valueDraft: null, updatedById: me?.id ?? null },
        })
      ),
      prisma.siteFieldHistory.createMany({
        data: pending.map((f) => ({
          fieldId: f.id,
          value: f.valueDraft,
          publishedById: me?.id ?? null,
        })),
      }),
    ]);

    // The public pages are what actually changed.
    revalidatePath("/", "layout");
    revalidatePath("/admin/site");
    return { ok: true, published: pending.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Put an earlier value back, as a draft so it still goes through publish. */
export async function rollbackField(historyId: string): Promise<Result> {
  try {
    await requireEditor();
    const entry = await prisma.siteFieldHistory.findUnique({ where: { id: historyId } });
    if (!entry) return { ok: false, error: "That version no longer exists" };
    await prisma.siteField.update({
      where: { id: entry.fieldId },
      data: { valueDraft: entry.value },
    });
    revalidatePath("/admin/site");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Turn draft preview on or off for this browser. */
export async function setPreview(on: boolean): Promise<Result> {
  try {
    await requireEditor();
    const store = await cookies();
    if (on) {
      store.set(PREVIEW_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4 });
    } else {
      store.delete(PREVIEW_COOKIE);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
