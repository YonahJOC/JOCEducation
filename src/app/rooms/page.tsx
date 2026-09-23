import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { redirect } from "next/navigation";
import { safeAuth } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { RoomList, type RoomCard } from "./RoomList";

export const metadata = {
  title: "Staff room",
  robots: { index: false, follow: false },
};

/**
 * Topic rooms. The Teachers' Board is where a school writes up something it
 * ran; this is the conversation before and after — a question on a Tuesday,
 * four answers by Thursday.
 */
export default async function RoomsPage() {
  const session = await safeAuth();
  if (!session?.user) redirect("/login?next=%2Frooms");
  if (!hasSiteAccess(session.user)) redirect("/no-access");

  const userId = session.user.id;
  let rooms: RoomCard[] = [];

  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.room.findMany({
        orderBy: [{ archived: "asc" }, { sort: "asc" }, { name: "asc" }],
        include: {
          members: { where: { userId }, select: { lastReadAt: true } },
          _count: { select: { messages: true, members: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              createdAt: true,
              body: true,
              removed: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      });

      // How much each room has that this person has not seen.
      const unread = new Map<string, number>();
      await Promise.all(
        rows.map(async (r) => {
          const since = r.members[0]?.lastReadAt;
          if (!since) return;
          const n = await prisma.roomMessage.count({
            where: { roomId: r.id, createdAt: { gt: since }, userId: { not: userId }, removed: false },
          });
          if (n > 0) unread.set(r.id, n);
        })
      );

      rooms = rows.map((r) => {
        const last = r.messages[0];
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          description: r.description,
          icon: r.icon,
          archived: r.archived,
          joined: r.members.length > 0,
          messageCount: r._count.messages,
          memberCount: r._count.members,
          unread: unread.get(r.id) ?? 0,
          lastAt: last ? last.createdAt.toISOString() : null,
          lastBy: last ? (last.user?.name ?? last.user?.email ?? null) : null,
          lastBody: last && !last.removed ? last.body.slice(0, 140) : null,
        };
      });
    } catch {
      rooms = [];
    }
  }

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", padding: "48px 26px 72px" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>
        STAFF ROOM
      </p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: C.ink, marginBottom: "12px" }}>
        Rooms for the things worth talking through.
      </h1>
      <p style={{ fontSize: "16.5px", color: "#4A5A74", lineHeight: 1.6, maxWidth: "60ch", marginBottom: "34px" }}>
        Pick the topics you care about. Ask the question you would ask in the staffroom, and
        answer the ones you know. Everything here is between educators — no school sees another
        school&rsquo;s account, and nothing is published to the public site.
      </p>

      {rooms.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "22px", padding: "48px 30px", textAlign: "center" }}>
          <h2 style={{ fontWeight: 700, fontSize: "20px", color: C.ink, margin: "0 0 10px" }}>
            No rooms yet.
          </h2>
          <p style={{ fontSize: "15.5px", color: "#4A5A74", lineHeight: 1.6, maxWidth: "50ch", margin: "0 auto 20px" }}>
            The JOC education team opens the rooms. Tell them what you would want to talk about and
            they can start one.
          </p>
          <Link href="/contact" style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none" }}>
            Suggest a room
          </Link>
        </div>
      ) : (
        <RoomList rooms={rooms} />
      )}
    </div>
  );
}
