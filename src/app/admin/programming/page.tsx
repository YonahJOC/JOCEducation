import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAllEvents } from "@/lib/events";
import { CalendarGuard } from "@/components/admin/Guard";
import { ProgrammingClient, type EventRow } from "./ProgrammingClient";

export const metadata = { title: "Programming — JOC Console" };

export default async function AdminProgrammingPage() {
  return <CalendarGuard>{await Inner()}</CalendarGuard>;
}

async function Inner() {
  const connected = isDatabaseConfigured();

  const [events, schools, programs] = await Promise.all([
    getAllEvents(),
    connected
      ? prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([]),
    connected
      ? prisma.programPage.findMany({
          orderBy: { sort: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const rows: EventRow[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    programId: e.programId,
    schoolId: e.schoolId,
    startsAt: e.startsAt.toISOString().slice(0, 10),
    endsAt: e.endsAt ? e.endsAt.toISOString().slice(0, 10) : "",
    location: e.location ?? "",
    audience: e.audience ?? "",
    detail: e.detail,
    lead: e.lead ?? "",
    status: e.status,
    published: e.published,
    schoolName: e.schoolName,
    programName: e.programName,
  }));

  return <ProgrammingClient events={rows} schools={schools} programs={programs} disabled={!connected} />;
}
