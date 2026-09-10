import Link from "next/link";
import { getApprovedBoardPosts } from "@/lib/content";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { BoardClient, type BoardIdea } from "./BoardClient";

export const metadata = { title: "Teachers' Board" };

/** "3 days ago" — close enough, and it never goes stale in a cache. */
function ago(d: Date) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
}

export default async function BoardPage() {
  const [posts, session] = await Promise.all([getApprovedBoardPosts(), safeAuth()]);
  const userId = session?.user?.id ?? null;

  // Which of these the reader has already marked useful.
  let liked = new Set<string>();
  if (userId && isDatabaseConfigured() && posts.length > 0) {
    try {
      const rows = await prisma.boardLike.findMany({
        where: { userId, postId: { in: posts.map((p) => p.id) } },
        select: { postId: true },
      });
      liked = new Set(rows.map((r) => r.postId));
    } catch {
      // Not knowing is harmless; the button just starts unfilled.
    }
  }

  const ideas: BoardIdea[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    region: p.region,
    school: p.schoolName,
    grade: p.grade,
    likes: p.likes,
    ts: ago(p.createdAt),
    liked: liked.has(p.id),
  }));

  // Signed-in teachers still get the real board so they can be the first to
  // post; a visitor gets the explanation instead of an empty grid.
  if (ideas.length === 0 && !session?.user) {
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "72px 26px 96px", textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>TEACHERS&rsquo; BOARD</p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "14px" }}>
          Nobody has posted yet.
        </h1>
        <p style={{ fontSize: "16.5px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, marginBottom: "26px" }}>
          This is where teachers describe what they actually ran in their classrooms — what worked,
          what didn&rsquo;t, what surprised them. Be the first.
        </p>
        <Link
          href="/login"
          style={{ display: "inline-block", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none" }}
        >
          Sign in to share an idea
        </Link>
      </div>
    );
  }

  return (
    <BoardClient
      ideas={ideas}
      signedIn={Boolean(session?.user)}
      defaultSchool=""
      defaultRegion=""
    />
  );
}
