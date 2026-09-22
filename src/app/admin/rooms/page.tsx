import { getCycles } from "@/lib/cycle-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { RoomsClient, type RoomRow } from "./RoomsClient";
import { RoomsGuard } from "@/components/admin/Guard";

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

async function Inner() {
  const rooms = await getRooms();
  const cycles = (await getCycles()).map((c) => ({ slug: c.slug, theme: c.theme, num: c.num }));
  return <RoomsClient rooms={rooms} cycles={cycles} disabled={!isDatabaseConfigured()} />;
}

export default async function AdminRoomsPage() {
  return <RoomsGuard>{await Inner()}</RoomsGuard>;
}
