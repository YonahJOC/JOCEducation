import { getMyDesk } from "@/lib/my-desk";
import { markSeen } from "@/app/actions/my-desk";
import { MyDesk } from "@/components/mydesk/MyDesk";

/**
 * My desk.
 *
 * One person's own work and nothing else: their tasks, their day, what people
 * sent them, their notebook. Everything shared — the Buzz, the schools'
 * messages, the board, the console's health — moved to The Office, one tab
 * away, because a desk that also carries the organisation's problems is a
 * desk nobody ever clears.
 */

export const metadata = { title: "My desk — JOC Console" };
export const dynamic = "force-dynamic";

export default async function AdminDesk() {
  // Opening the page is what "they've seen it" means on the sender's side.
  await markSeen();
  const desk = await getMyDesk();
  return <MyDesk desk={desk} />;
}
