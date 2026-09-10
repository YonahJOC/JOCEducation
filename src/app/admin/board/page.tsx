import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { BoardClient, type BoardRow } from "./BoardClient";

export const metadata = { title: "Teachers' Board — JOC Console" };

async function getPosts(): Promise<BoardRow[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.boardPost.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    author: p.user?.name ?? p.user?.email ?? null,
    schoolName: p.schoolName,
    region: p.region,
    approved: p.approved,
    createdAt: p.createdAt,
  }));
}

export default async function AdminBoardPage() {
  const posts = await getPosts();
  return <BoardClient posts={posts} disabled={!isDatabaseConfigured()} />;
}
