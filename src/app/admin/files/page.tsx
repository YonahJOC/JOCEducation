import { isDatabaseConfigured } from "@/lib/prisma";
import { listFiles, humanSize, fileUrl } from "@/lib/files";
import { FilesClient, type FileRow } from "./FilesClient";

export const metadata = { title: "Files — JOC Console" };

function when(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminFilesPage() {
  const rows = await listFiles();
  const files: FileRow[] = rows.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: humanSize(f.size),
    when: when(f.createdAt),
    uploadedBy: f.uploadedBy,
    url: fileUrl(f.id),
  }));

  return <FilesClient files={files} disabled={!isDatabaseConfigured()} />;
}
