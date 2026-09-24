import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { notFound, redirect } from "next/navigation";
import { safeAuth } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { markRoomRead } from "@/app/actions/rooms";
import { Conversation, type Msg } from "./Conversation";

function when(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) return { title: "Staff room" };
  try {
    const room = await prisma.room.findUnique({ where: { slug }, select: { name: true } });
    return { title: room ? `${room.name} — Staff room` : "Staff room", robots: { index: false } };
  } catch {
    return { title: "Staff room" };
  }
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await safeAuth();
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(`/rooms/${slug}`)}`);
  if (!hasSiteAccess(session.user)) redirect("/no-access");
  if (!isDatabaseConfigured()) notFound();

  const userId = session.user.id;

  const room = await prisma.room.findUnique({
    where: { slug },
    include: {
      messages: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, name: true, email: true, school: { select: { name: true } } } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, email: true, school: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!room) notFound();

  // Opening a room is reading it.
  await markRoomRead(room.id);

  type Row = (typeof room.messages)[number] | (typeof room.messages)[number]["replies"][number];
  const shape = (m: Row, replies: Msg[] = []): Msg => {
    const name = m.user?.name ?? m.user?.email ?? "Someone";
    return {
      id: m.id,
      body: m.body,
      author: name,
      authorSchool: "school" in (m.user ?? {}) ? (m.user?.school?.name ?? null) : null,
      initial: name.trim().charAt(0).toUpperCase() || "?",
      when: when(m.createdAt),
      mine: m.user?.id === userId,
      removed: m.removed,
      removedBy: m.removedBy,
      replies,
    };
  };

  const messages: Msg[] = room.messages.map((m) =>
    shape(m, m.replies.map((r) => shape(r)))
  );

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "40px 26px 72px" }}>
      <Link href="/rooms" style={{ fontSize: "15px", color: C.blue, textDecoration: "none", fontWeight: 600 }}>
        ← Staff room
      </Link>

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", margin: "16px 0 10px" }}>
        <span style={{ fontSize: "34px", lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{room.icon}</span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 36px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: C.ink, margin: 0 }}>
            {room.name}
          </h1>
          <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "6px 0 0" }}>
            {room.description}
          </p>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.hairline}`, margin: "24px 0 26px" }} />

      <Conversation
        roomId={room.id}
        messages={messages}
        canPost
        closed={room.archived}
      />
    </div>
  );
}
