"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, isAuthConfigured } from "@/auth";
import { canManageContent } from "@/lib/access";
import { putFile, deleteFile, FILE_SIZE_LIMIT } from "@/lib/files";

/** Uploading is the education team's job — ADMIN and above. */
async function requireUploader() {
  const session = await safeAuth();
  if (isAuthConfigured && !canManageContent(session?.user)) {
    return null;
  }
  return session?.user ?? null;
}

export type UploadResult =
  | { ok: true; id: string; url: string; name: string }
  | { ok: false; error: string };

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  const user = await requireUploader();
  if (isAuthConfigured && !user) {
    return { ok: false, error: "You need educational team access to upload files." };
  }

  const entry = formData.get("file");
  if (!(entry instanceof File)) return { ok: false, error: "No file was attached." };
  if (entry.size > FILE_SIZE_LIMIT) {
    return { ok: false, error: `That file is larger than ${FILE_SIZE_LIMIT / 1024 / 1024} MB.` };
  }

  const bytes = new Uint8Array(await entry.arrayBuffer());
  const result = await putFile({
    name: entry.name,
    mimeType: entry.type || "application/octet-stream",
    bytes,
    uploadedById: user?.id ?? null,
  });
  if (!result.ok) return result;

  revalidatePath("/admin/files");
  return { ok: true, id: result.id, url: result.url, name: entry.name };
}

export async function removeFile(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUploader();
  if (isAuthConfigured && !user) {
    return { ok: false, error: "You need educational team access to remove files." };
  }
  const done = await deleteFile(id);
  if (!done) return { ok: false, error: "Could not remove that file." };

  revalidatePath("/admin/files");
  return { ok: true };
}
