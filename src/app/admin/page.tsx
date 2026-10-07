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
  /**
   * Everybody lands here now.
   *
   * A coordinator used to be bounced straight past this to their program's
   * console, because this page was only the things that were wrong and a
   * coordinator could do nothing about most of them. It is their desk now —
   * their list, their diary, their schools' notes — so sending them through
   * it to somewhere else is sending them past the page built for them.
   *
   * Their programs are still one row down, under Your programs.
   */
  const [today, desk] = await Promise.all([getToday(), getDesk()]);
  return <Desk today={today} desk={desk} />;
}
