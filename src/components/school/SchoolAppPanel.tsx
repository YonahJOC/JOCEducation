import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { BandRow } from "@/components/ui/BandRow";
import { C, F, label, datum } from "@/lib/joc-tokens";

/**
 * The JOC App, as the school sees it (5d).
 *
 * Totals only. No leaderboard and no student names — a student's name
 * appears on their supervising teacher's page and nowhere else, and a
 * leaderboard of children is not something a portal should put on a screen
 * anybody at the school can open.
 *
 * Every figure here was read out of the app at a particular moment, so the
 * header says when. Once that moment is old enough to matter the whole label
 * turns orange, because a stale figure presented as current is worse than no
 * figure at all.
 */

/** Past this, the numbers below are old enough to say so. Matches the console. */
const STALE_HOURS = 36;

const when = (d: Date) =>
  d.toLocaleString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });

const dateOnly = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export async function SchoolAppPanel({ schoolId }: { schoolId: string }) {
  if (!isDatabaseConfigured()) return null;

  const school = await prisma.school
    .findUnique({
      where: { id: schoolId },
      select: {
        studentCount: true,
        storeOpenAt: true,
        appStats: true,
      },
    })
    .catch(() => null);

  const s = school?.appStats ?? null;

  if (!s) {
    return (
      <section style={{ marginTop: "24px" }}>
        <p style={{ ...label, color: C.orangeText, margin: "0 0 8px" }}>From the app</p>
        <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.orangeText, margin: 0, maxWidth: "58ch" }}>
          The app has not reported your school yet, so there is nothing here to read. It fills in
          on its own once the two are joined up.
        </p>
      </section>
    );
  }

  const stale = Date.now() - s.syncedAt.getTime() > STALE_HOURS * 3_600_000;

  return (
    <section style={{ marginTop: "24px" }}>
      <p style={{ ...label, color: stale ? C.orangeText : C.muted, margin: "0 0 12px" }}>
        From the app · as of {when(s.syncedAt)}
        {stale ? " · older than we'd like" : ""}
      </p>

      {/* Only what the app actually answered. A cell it cannot answer is
          not shown — a nought there reads as "nobody did anything", which on
          a school with three thousand acts to its name is simply false. */}
      <div className="joc-figures" style={{ marginBottom: "16px" }}>
        {s.actsAllTime != null && (
          <Cell
            value={s.actsAllTime.toLocaleString("en-US")}
            name="Acts logged since you joined"
          />
        )}

        {s.hoursAllTime != null && (
          <Cell
            value={s.hoursAllTime.toLocaleString("en-US")}
            name="Hours logged since you joined"
          />
        )}

        {s.studentsOnApp != null && (
          <Cell
            value={s.studentsOnApp.toLocaleString("en-US")}
            name="Your students on the app"
          />
        )}

        {!s.publicOnly && (
          <>
            <Cell
              value={String(s.activeStudents)}
              unit={school?.studentCount ? `of ${school.studentCount}` : null}
              name="Active this month"
              note={school?.studentCount ? null : "Nobody has recorded your enrolment"}
            />

            <Cell value={String(s.opportunitiesOpen)} name="Opportunities open" />

            {school?.storeOpenAt == null ? (
              <Cell value="Not open" word name="Prize store" note="Not open at your school yet" />
            ) : s.storeRedeemedThisMonth == null ? (
              <Cell value="Not read" word name="Prize store" note="The app hasn&rsquo;t reported it yet" />
            ) : (
              <Cell
                value={String(s.storeRedeemedThisMonth)}
                name="Prizes claimed this month"
                note={s.storeTopPrize ? `Most claimed: ${s.storeTopPrize}` : null}
              />
            )}
          </>
        )}
      </div>

      {/* The last thing anybody there did, and never who did it. */}
      {s.lastActivityText && (
        <p style={{
          fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.muted,
          margin: "0 0 16px", maxWidth: "58ch",
        }}>
          The most recent one was &ldquo;{s.lastActivityText}&rdquo;.
        </p>
      )}

      {!s.publicOnly && s.unapprovedMinutes > 0 && (
        <BandRow
          tone="warn"
          label="To approve"
          figure={`${(s.unapprovedMinutes / 60).toFixed(1)} h`}
          title="Chesed hours waiting on a teacher"
          line={
            s.unapprovedOldestAt
              ? `${s.unapprovedEntries} entr${s.unapprovedEntries === 1 ? "y" : "ies"}, the oldest waiting since ${dateOnly(s.unapprovedOldestAt)}.`
              : `${s.unapprovedEntries} entr${s.unapprovedEntries === 1 ? "y" : "ies"} waiting. Teachers approve them in the app.`
          }
          action={{ label: "Open the app", href: "/school/activity" }}
        />
      )}
    </section>
  );
}

function Cell({
  value, unit, name, note, word,
}: {
  value: string; unit?: string | null; name: string; note?: string | null; word?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span style={{ display: "flex", alignItems: "baseline", gap: "6px", minWidth: 0 }}>
        <span style={{
          fontFamily: F.ui, fontSize: word ? "20px" : "28px", fontWeight: 800,
          letterSpacing: "-0.02em", color: note && word ? C.orangeText : C.ink, lineHeight: 1.15,
        }}>
          {value}
        </span>
        {unit && <span style={{ ...datum, color: C.muted }}>{unit}</span>}
      </span>

      <span style={{ ...label, fontSize: "10px", color: C.muted, marginTop: "2px" }}>{name}</span>

      {note && (
        <span style={{
          fontFamily: F.read, fontSize: "13px", lineHeight: 1.4,
          color: word ? C.orangeText : C.muted, marginTop: "4px",
        }}>
          {note}
        </span>
      )}
    </div>
  );
}
