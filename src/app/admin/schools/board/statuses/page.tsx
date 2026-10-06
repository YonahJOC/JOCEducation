import Link from "next/link";
import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { getBoard } from "@/lib/board";
import { StatusEditor } from "@/components/admin/StatusEditor";
import { C, F, pageTitle } from "@/lib/joc-tokens";

/**
 * What the board is made of: its statuses, its own columns, its ticks.
 *
 * Its own page rather than a dialog on the board. Renaming a status is a
 * decision about how the whole team talks about schools, and it deserves
 * more room than a popover over the thing it changes.
 */

export const metadata = { title: "Board settings — JOC Console" };
export const dynamic = "force-dynamic";

export default async function BoardStatusesPage() {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) redirect("/admin");

  const board = await getBoard();

  return (
    <div>
      <p style={{ margin: "0 0 10px" }}>
        <Link href="/admin/schools/board" style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue }}>
          ← Back to the board
        </Link>
      </p>

      <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>How the board is set up</h1>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 22px", maxWidth: "62ch" }}>
        Everything here is yours to change without asking a developer. That was the point of
        moving off Monday — a board you cannot rename a column on is a board somebody keeps a
        spreadsheet beside.
      </p>

      <StatusEditor statuses={board.statuses} fields={board.fields} checks={board.checks} />
    </div>
  );
}
