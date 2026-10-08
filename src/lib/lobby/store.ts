import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { emptyDoc, sanitizeDoc } from "@/lib/lobby/config";
import type { LobbyDoc } from "@/lib/lobby/types";

/**
 * Where the lobby document lives.
 *
 * One row, id "singleton". The handoff kept this behind a two-method
 * `DocStore` so the backend could be swapped without touching the rest; this
 * is that swap, from Netlify Blobs to our database.
 *
 * Everything in and out goes through `sanitizeDoc`, so a document written by
 * an older version of the admin panel — or by hand — still comes back with
 * every field the screen expects.
 */

export const DOC_ID = "singleton";

export async function readDoc(): Promise<LobbyDoc> {
  if (!isDatabaseConfigured()) return emptyDoc();
  try {
    const row = await prisma.lobbyDoc.findUnique({
      where: { id: DOC_ID },
      select: { version: true, data: true },
    });
    if (!row) return emptyDoc();
    const doc = sanitizeDoc(row.data);
    // The column is the truth about the version, not whatever the JSON says:
    // the 409 check is only as good as the number it compares.
    doc.version = row.version;
    return doc;
  } catch {
    return emptyDoc();
  }
}

/**
 * Save, if nobody else has saved since this editor loaded.
 *
 * Returns the stored document on success, or `null` when the version has
 * moved on — the caller answers 409 and hands back the newer copy, which the
 * admin panel re-applies its own change to.
 */
export async function writeDoc(
  baseVersion: number, incoming: unknown, byUserId: string | null,
): Promise<LobbyDoc | null> {
  const current = await readDoc();
  if (baseVersion !== current.version) return null;

  const next = sanitizeDoc(incoming);
  next.version = current.version + 1;
  next.updatedAt = new Date().toISOString();

  await prisma.lobbyDoc.upsert({
    where: { id: DOC_ID },
    create: {
      id: DOC_ID, version: next.version,
      data: next as unknown as object, updatedById: byUserId,
    },
    update: {
      version: next.version, data: next as unknown as object,
      updatedAt: new Date(), updatedById: byUserId,
    },
  });
  return next;
}
