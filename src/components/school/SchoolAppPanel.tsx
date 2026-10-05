import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { BandRow } from "@/components/ui/BandRow";
import { schoolPaymentFor, money } from "@/lib/money";
import { isPaymentConfigured } from "@/lib/payments";
import { C, F, label, datum, rowCard, primaryButton, secondaryButton } from "@/lib/joc-tokens";

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
 *
 * ── On opening the app itself ─────────────────────────────────────────────
 *
 * This links out rather than embedding app.justonechesed.org, and that is a
 * decision rather than an omission. The app does not send X-Frame-Options, so
 * a frame would technically load — but what the school would meet inside it
 * is a login form, and a login form served from somebody else's domain inside
 * a frame is the shape of a phishing page. Browsers are also steadily
 * refusing cookies to third-party frames, so the session would work for some
 * schools and silently not for others, and the day the app adds the header
 * the panel breaks with no warning. A link that opens their app in its own
 * tab has none of those problems.
 */

/** Past this, the numbers below are old enough to say so. Matches the console. */
const STALE_HOURS = 36;

/** Where a school signs in to the app. */
const APP_URL = "https://app.justonechesed.org";

const when = (d: Date) =>
  d.toLocaleString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });

const dateOnly = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export async function SchoolAppPanel({
  schoolId, programId, canSeeMoney,
}: {
  schoolId: string;
  /** The JOC App program, for the registration fee. */
  programId?: number | null;
  /** What the school pays is for whoever runs the account, not every teacher. */
  canSeeMoney?: boolean;
}) {
  if (!isDatabaseConfigured()) return null;

  const [school, payment] = await Promise.all([
    prisma.school
      .findUnique({
        where: { id: schoolId },
        select: { studentCount: true, storeOpenAt: true, liveScreenUrl: true, appStats: true },
      })
      .catch(() => null),
    canSeeMoney && programId ? schoolPaymentFor(schoolId, programId) : Promise.resolve(null),
  ]);

  const s = school?.appStats ?? null;

  return (
    <section style={{ marginTop: "24px" }}>
      {s ? (
        <>
          <p style={{
            ...label,
            color: Date.now() - s.syncedAt.getTime() > STALE_HOURS * 3_600_000 ? C.orangeText : C.muted,
            margin: "0 0 12px",
          }}>
            From the app · as of {when(s.syncedAt)}
            {Date.now() - s.syncedAt.getTime() > STALE_HOURS * 3_600_000 ? " · older than we'd like" : ""}
          </p>

          {/* Only what the app actually answered. A cell it cannot answer is
              not shown — a nought there reads as "nobody did anything". */}
          <div className="joc-figures" style={{ marginBottom: "16px" }}>
            {s.actsAllTime != null && (
              <Cell value={s.actsAllTime.toLocaleString("en-US")} name="Opportunities taken" />
            )}
            {s.hoursAllTime != null && (
              <Cell value={s.hoursAllTime.toLocaleString("en-US")} name="Hours logged" />
            )}
            {s.studentsOnApp != null && (
              <Cell value={s.studentsOnApp.toLocaleString("en-US")} name="Your students on the app" />
            )}

            {/* The figure a teacher most wants, and the one the app will not
                give us without a login. Named rather than shown as nought. */}
            {s.publicOnly ? (
              <Cell value="Not read" word name="Waiting for approval" note="Open the app to see this" />
            ) : (
              <Cell
                value={String(s.unapprovedEntries)}
                name="Waiting for approval"
                note={
                  s.unapprovedOldestAt
                    ? `Oldest since ${dateOnly(s.unapprovedOldestAt)}`
                    : null
                }
              />
            )}
          </div>

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
              line={`${s.unapprovedEntries} entr${s.unapprovedEntries === 1 ? "y" : "ies"} waiting. Teachers approve them in the app.`}
              action={{ label: "Open the app", href: APP_URL }}
            />
          )}
        </>
      ) : (
        <>
          <p style={{ ...label, color: C.orangeText, margin: "0 0 8px" }}>From the app</p>
          <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.orangeText, margin: "0 0 16px", maxWidth: "58ch" }}>
            The app has not reported your school yet, so there is nothing here to read. It fills in
            on its own once the two are joined up.
          </p>
        </>
      )}

      {/* ── Opening the app, and the screen in the building ─────────────── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
        <a
          href={APP_URL}
          target="_blank"
          rel="noreferrer"
          style={{ ...primaryButton, textDecoration: "none" }}
        >
          Open the JOC App ↗
        </a>

        {school?.liveScreenUrl ? (
          <a
            href={school.liveScreenUrl}
            target="_blank"
            rel="noreferrer"
            style={{ ...secondaryButton, textDecoration: "none" }}
          >
            Your live screen ↗
          </a>
        ) : (
          <span style={{ ...datum, color: C.orangeText }}>
            Your live screen link isn&rsquo;t set yet
          </span>
        )}
      </div>

      {/* ── Registration ─────────────────────────────────────────────────── */}
      {canSeeMoney && payment && <Registration payment={payment} />}
    </section>
  );
}

/**
 * Whether the school has paid to be on the app, and how to.
 *
 * The button is honest about the state of the world: until card payment is
 * switched on it says so, rather than opening a checkout that cannot charge.
 */
function Registration({ payment }: { payment: Awaited<ReturnType<typeof schoolPaymentFor>> }) {
  const paid =
    payment.state === "paid" || payment.state === "granted" || payment.state === "in-plan";

  return (
    <div style={{ ...rowCard, padding: "18px 20px", marginTop: "18px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 8px" }}>Your registration</p>

      {payment.state === "paid" && (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.greenText }}>Paid</strong> · {money(payment.amountCents)} on{" "}
          {dateOnly(payment.at)}.
        </p>
      )}
      {payment.state === "granted" && (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.greenText }}>Given to you</strong> · {payment.kind}, agreed{" "}
          {dateOnly(payment.at)}. Nothing to pay.
        </p>
      )}
      {payment.state === "in-plan" && (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.ink }}>In your plan</strong> · your {payment.plan} covers the
          app and {payment.programs - 1} other programs.
        </p>
      )}
      {payment.state === "refunded" && (
        <p style={{ ...body, margin: 0 }}>
          <strong style={{ color: C.redText }}>Refunded</strong> · {money(payment.amountCents)} on{" "}
          {dateOnly(payment.at)}.
        </p>
      )}
      {payment.state === "none" && (
        <p style={{ ...body, margin: 0, color: C.orangeText }}>
          Nothing is recorded against the app for your school yet.
        </p>
      )}

      {!paid && (
        <div style={{ marginTop: "14px" }}>
          {isPaymentConfigured ? (
            <a href="/school/plan" style={{ ...primaryButton, textDecoration: "none" }}>
              Pay for the app
            </a>
          ) : (
            <p style={{ ...datum, color: C.orangeText, margin: 0 }}>
              Card payment isn&rsquo;t switched on yet — JOC will be in touch about it
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.muted,
};

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
