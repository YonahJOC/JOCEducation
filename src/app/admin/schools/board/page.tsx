import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { getBoard } from "@/lib/board";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { ClientsBoard } from "@/components/admin/ClientsBoard";
import { C, F, datum, label, pageTitle } from "@/lib/joc-tokens";

/**
 * The JOC App clients board.
 *
 * What the Monday board of the same name held, in the portal, plus the three
 * things Monday could not know: whether a school can actually sign in, how
 * many of their messages are waiting, and how long since anybody touched the
 * relationship.
 *
 * Only schools marked onBoard appear. The portal holds thirty-nine schools
 * and the app board is its own list — showing all of them would be a
 * different board nobody asked for.
 */

export const metadata = { title: "JOC App board — JOC Console" };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) redirect("/admin");

  const board = await getBoard();
  const t = board.totals;

  return (
    <div>
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>JOC App board</h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {t.schools} SCHOOL{t.schools === 1 ? "" : "S"} ON THE APP
          </p>
        </div>
        <SectionLinks section="schools" />
      </div>

      {t.schools === 0 ? (
        <div style={{
          backgroundColor: C.white, borderRadius: "16px", padding: "28px",
          boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
        }}>
          <p style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            Nothing is on the board yet
          </p>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: "0 0 18px", maxWidth: "58ch" }}>
            The board holds JOC App clients. Bring the Monday export across and they land here
            with their status, contacts and student lists.
          </p>
          <a
            href="/admin/schools/board/import"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.white,
              backgroundColor: C.blue, borderRadius: "12px", padding: "0 20px",
              minHeight: "47px", textDecoration: "none",
            }}
          >
            Bring in the Monday board
          </a>
        </div>
      ) : (
        <>
          {/* Real counts only. A figure nobody recorded is said in words. */}
          <div className="joc-figures" style={{ marginBottom: "20px" }}>
            <Figure value={String(t.active)} name="Active schools" />
            <Figure
              value={t.students.toLocaleString("en-US")}
              name="Students"
              note={t.studentsUnknown > 0 ? `${t.studentsUnknown} schools not counted` : null}
            />
            <Figure value={`${t.listsUploaded} of ${t.schools}`} name="Student lists uploaded" />
            <Figure
              value={String(t.listsNeeded)}
              name="Lists stuck or not sent"
              tone={t.listsNeeded > 0 ? C.orangeText : undefined}
            />
            <Figure value={`${t.withAccount} of ${t.schools}`} name="Have an account" />
          </div>

          <ClientsBoard board={board} />
        </>
      )}
    </div>
  );
}

function Figure({
  value, name, note, tone,
}: {
  value: string; name: string; note?: string | null; tone?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span style={{
        fontFamily: F.ui, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em",
        color: tone ?? C.ink, lineHeight: 1.15,
      }}>
        {value}
      </span>
      <span style={{ ...label, fontSize: "10px", color: C.muted }}>{name}</span>
      {note && (
        <span style={{ fontFamily: F.read, fontSize: "13px", color: C.orangeText, marginTop: "3px" }}>
          · {note}
        </span>
      )}
    </div>
  );
}
