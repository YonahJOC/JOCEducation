import { CYCLES } from "@/lib/cycles";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { RoomsClient, type RoomRow } from "./RoomsClient";

export const metadata = { title: "Discussion rooms — JOC Console" };

async function getRooms(): Promise<RoomRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.room.findMany({
      orderBy: [{ sort: "asc" }, { name: "asc" }],
      include: { _count: { select: { messages: true, members: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      icon: r.icon,
      cycleSlug: r.cycleSlug,
      archived: r.archived,
      sort: r.sort,
      messageCount: r._count.messages,
      memberCount: r._count.members,
    }));
  } catch {
    return [];
  }
}

export default async function AdminRoomsPage() {
  const rooms = await getRooms();
  const cycles = CYCLES.map((c) => ({ slug: c.slug, theme: c.theme, num: c.num }));
  return <RoomsClient rooms={rooms} cycles={cycles} disabled={!isDatabaseConfigured()} />;
}
