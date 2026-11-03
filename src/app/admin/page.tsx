import { redirect } from "next/navigation";
import { safeAuth } from "@/auth";
import { jocNav } from "@/lib/nav";
import { getMyDesk } from "@/lib/my-desk";
import { markSeen } from "@/app/actions/my-desk";
import { todayAtJoc } from "@/lib/desk-today-at-joc";
import { MyDesk } from "@/components/mydesk/MyDesk";

/**
 * My desk.
 *
 * One person's own work and nothing else: their list, their week, what people
 * sent them, their scratchpad. Everything shared — the Buzz, the schools'
 * messages, the board, the console's health — is in The Office, one tab away,
 * because a desk that also carries the organisation's problems is a desk
 * nobody ever clears.
 */

export const metadata = { title: "My desk — JOC Console" };
export const dynamic = "force-dynamic";

export default async function AdminDesk() {
  /**
   * A scoped role has no desk.
   *
   * The desk is somebody's own work at JOC — their list, their diary, what
   * people have asked them to do. Somebody brought in to look after the
   * screens has none of that here, and this is the address the console
   * opens on, so without this they land on an empty page about a job they
   * do not have. Send them to the first thing their permissions actually
   * open.
   */
  const session = await safeAuth();
  if (session?.user?.scoped) {
    const first = jocNav(session.user)[0];
    redirect(first?.href ?? "/home");
  }

  // Opening the page is what "they've seen it" means on the sender's side.
  await markSeen();
  const desk = await getMyDesk();
  const joc = await todayAtJoc(desk.now);
  return <MyDesk desk={desk} joc={joc} />;
}
