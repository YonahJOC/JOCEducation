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
  // Opening the page is what "they've seen it" means on the sender's side.
  await markSeen();
  const desk = await getMyDesk();
  const joc = await todayAtJoc(desk.now);
  return <MyDesk desk={desk} joc={joc} />;
}
