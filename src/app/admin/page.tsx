import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { canAccessConsole } from "@/lib/access";
import { leadsAnyProgram, listProgramsForAdmin } from "@/lib/program-admin";
import { getToday } from "@/lib/today";
import { getDesk } from "@/lib/desk";
import { Desk } from "@/components/desk/Desk";

/**
 * My desk.
 *
 * This was Today: the rows that need somebody, and nothing else. They are
 * still the top of it and still unchanged — but a console whose only page is
 * a list of problems is a console people open once a day and close.
 *
 * Now it is one page read top to bottom: what needs you, your own list and
 * diary, a rule saying the rest is not waiting on anybody, then the shared
 * things — the programs, the Buzz, the board.
 */

export const metadata = { title: "My desk — JOC Console" };
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

  const [today, desk] = await Promise.all([getToday(), getDesk()]);
  return <Desk today={today} desk={desk} />;
}
