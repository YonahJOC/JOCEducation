import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { canAccessConsole } from "@/lib/access";
import { leadsAnyProgram, listProgramsForAdmin } from "@/lib/program-admin";
import { getToday } from "@/lib/today";
import { TodayPage } from "@/components/admin/TodayPage";

/**
 * Today.
 *
 * This was an overview: a board of every school, their statuses and a
 * pipeline. That is something to browse, and nobody opens a console to
 * browse — they open it because something needs them, and the page could not
 * say what.
 *
 * It is now the same shape for every role, built from capabilities: rows that
 * are true right now, each with a figure, a sentence and one action. The
 * board it replaced is still there, under Schools, where somebody looking for
 * a board would look.
 */

export const metadata = { title: "Today — JOC Console" };
export const dynamic = "force-dynamic";

export default async function AdminToday() {
  const session = await safeAuth();

  // A coordinator holds no capability at all. One program and they land on
  // its console; more than one and they get the cards, which is the only
  // page in here that is theirs.
  if (!openForReview && !canAccessConsole(session?.user)) {
    if (await leadsAnyProgram(session?.user?.id ?? null)) {
      const mine = await listProgramsForAdmin();
      redirect(mine.length === 1 ? `/admin/programs/${mine[0].slug}` : "/admin/my-programs");
    }
  }

  return <TodayPage data={await getToday()} />;
}
