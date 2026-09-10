import { cookies } from "next/headers";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Editable site content.
 *
 * Public pages read every string, number, image and link through this module
 * rather than hardcoding it, so the Education Team can change the site from
 * /admin/site without a deploy.
 *
 * Two rules make this safe to adopt gradually:
 *   1. Every read takes a fallback — the value currently in the code. If the
 *      database is unreachable, or the field has never been edited, the page
 *      renders exactly as it does today.
 *   2. Drafts are only visible in preview. Normal visitors always get the
 *      published value.
 */

export const PREVIEW_COOKIE = "joc-preview-drafts";

export type FieldType =
  | "SHORT_TEXT" | "LONG_TEXT" | "URL" | "EMAIL" | "NUMBER" | "IMAGE" | "REPEATABLE";

/** One entry in a REPEATABLE field. */
export type RepeatItem = { title?: string; body?: string; value?: string };

export type Field = {
  page: string;
  section: string;
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  sort: number;
  published: string | null;
  draft: string | null;
  hasDraft: boolean;
  updatedAt: Date | null;
  updatedBy: string | null;
};

/** Is the current request previewing unpublished drafts? */
export async function isPreviewing(): Promise<boolean> {
  try {
    const store = await cookies();
    return store.get(PREVIEW_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}

/**
 * All content for one page, keyed "section.key".
 *
 * Returns an empty map when the database is not configured or the query
 * fails, which makes every `get` fall through to its hardcoded fallback.
 */
export async function loadPage(page: string): Promise<Map<string, Field>> {
  const map = new Map<string, Field>();
  if (!isDatabaseConfigured()) return map;

  try {
    const rows = await prisma.siteField.findMany({
      where: { page },
      orderBy: { sort: "asc" },
      include: { updatedBy: { select: { name: true, email: true } } },
    });
    for (const r of rows) {
      map.set(`${r.section}.${r.key}`, {
        page: r.page,
        section: r.section,
        key: r.key,
        label: r.label,
        type: r.type as FieldType,
        help: r.help ?? undefined,
        sort: r.sort,
        published: r.valuePublished,
        draft: r.valueDraft,
        hasDraft: r.valueDraft !== null,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy?.name ?? r.updatedBy?.email ?? null,
      });
    }
  } catch {
    // Content editing is an enhancement — never let it take a page down.
  }
  return map;
}

/**
 * Reader bound to one page's content and one preview mode.
 *
 * `text("hero.headline", "Educating Towards Chesed")` returns the edited value
 * when there is one, and the fallback otherwise.
 */
export function reader(fields: Map<string, Field>, preview: boolean) {
  function raw(path: string): string | null {
    const f = fields.get(path);
    if (!f) return null;
    const v = preview && f.hasDraft ? f.draft : f.published;
    return v === null || v === undefined || v === "" ? null : v;
  }

  return {
    /** Any single-value field. */
    text(path: string, fallback: string): string {
      return raw(path) ?? fallback;
    },
    number(path: string, fallback: number): number {
      const v = raw(path);
      if (v === null) return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    },
    /** Ordered array for a REPEATABLE field. */
    list<T extends RepeatItem>(path: string, fallback: T[]): T[] {
      const v = raw(path);
      if (!v) return fallback;
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback;
      } catch {
        return fallback;
      }
    },
    /** True when this page has unpublished edits — drives the preview banner. */
    hasDrafts(): boolean {
      for (const f of fields.values()) if (f.hasDraft) return true;
      return false;
    },
  };
}

export type SiteReader = ReturnType<typeof reader>;

/** Convenience: load a page and bind a reader in one call. */
export async function siteContent(page: string): Promise<SiteReader> {
  const [fields, preview] = await Promise.all([loadPage(page), isPreviewing()]);
  return reader(fields, preview);
}
