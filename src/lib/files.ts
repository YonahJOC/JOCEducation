import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Where uploaded teaching materials live.
 *
 * They are stored in Postgres. That is a deliberate trade rather than an
 * oversight: object storage would mean a second set of credentials before
 * anyone could upload anything, and the education team needs to work now.
 * A worksheet is a few hundred kilobytes; the cap below keeps this honest.
 *
 * Moving to Supabase Storage or S3 later means changing `putFile` and
 * `readFile` and nothing else — every caller goes through `fileUrl(id)`.
 */

/** 20 MB. Comfortably above any worksheet, well below anything alarming. */
export const FILE_SIZE_LIMIT = 20 * 1024 * 1024;

/**
 * What the education team uploads. Deliberately narrow — no archives, no
 * executables, nothing that runs in a browser.
 */
export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "text/csv": "csv",
};

export function typeProblem(mimeType: string): string | null {
  if (ALLOWED_TYPES[mimeType]) return null;
  return "That file type is not accepted. Use PDF, Word, PowerPoint, Excel, a plain image, or text.";
}

export function sizeProblem(size: number): string | null {
  if (size <= 0) return "That file is empty.";
  if (size > FILE_SIZE_LIMIT) {
    return `That file is ${(size / 1024 / 1024).toFixed(1)} MB. The limit is ${FILE_SIZE_LIMIT / 1024 / 1024} MB.`;
  }
  return null;
}

/** Strip anything path-like; keep it recognisable to whoever downloads it. */
export function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^\w. ()-]/g, "_").slice(0, 120) || "file";
}

export type StoredFileInfo = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  uploadedBy: string | null;
};

export async function putFile(input: {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  uploadedById?: string | null;
}): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  if (!isDatabaseConfigured()) return { ok: false, error: "The database is not connected." };

  const problem = typeProblem(input.mimeType) ?? sizeProblem(input.bytes.byteLength);
  if (problem) return { ok: false, error: problem };

  try {
    const row = await prisma.storedFile.create({
      data: {
        name: cleanName(input.name),
        mimeType: input.mimeType,
        size: input.bytes.byteLength,
        data: new Uint8Array(input.bytes),
        uploadedById: input.uploadedById ?? null,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id, url: fileUrl(row.id) };
  } catch {
    return { ok: false, error: "Could not save that file." };
  }
}

/** The address a page links to. The route behind it checks access. */
export function fileUrl(id: string): string {
  return `/api/files/${id}`;
}

/** Is this one of ours, rather than a link someone pasted? */
export function fileIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /^\/api\/files\/([a-z0-9]+)$/i.exec(url.trim());
  return m ? m[1] : null;
}

export async function readFile(id: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    return await prisma.storedFile.findUnique({
      where: { id },
      select: { name: true, mimeType: true, size: true, data: true },
    });
  } catch {
    return null;
  }
}

export async function listFiles(take = 200): Promise<StoredFileInfo[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.storedFile.findMany({
      orderBy: { createdAt: "desc" },
      take,
      // Never select `data` here — this list is for the console, and the bytes
      // would be megabytes of payload nobody looks at.
      select: {
        id: true, name: true, mimeType: true, size: true, createdAt: true,
        uploadedBy: { select: { name: true, email: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      mimeType: r.mimeType,
      size: r.size,
      createdAt: r.createdAt,
      uploadedBy: r.uploadedBy?.name ?? r.uploadedBy?.email ?? null,
    }));
  } catch {
    return [];
  }
}

export async function deleteFile(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    await prisma.storedFile.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
