import Image from "next/image";
import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview, isGoogleConfigured } from "@/auth";
import { can, isSuperAdminEmail } from "@/lib/access";
import { signInWithGoogle, signOutAction } from "@/app/actions/auth";
import {
  UPDATE_TYPES, TAG, day, shortDay, clock, away, ago,
} from "@/lib/school-update";
import { C, R, F, label } from "@/lib/joc-tokens";

/**
 * The Buzz — what JOC is doing, for the people who are given it.
 *
 * Not the console. The board at /admin/interactions is for the people who
 * work the schools list and needs the schools capability and a console; this
 * needs neither, so somebody who runs one program three times a year can see
 * that two other people were at that school last month.
 *
 * Its own capability rather than "any justonechesed.org address", because
 * writing one line about your own visit and reading every school's history
 * are not the same permission. Ticked per person at /admin/roles.
 *
 * Read only. The way to add to it is the form.
 */

export const metadata = {
  title: "The JOC School Buzz",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const FEED = 40;

export default async function BuzzPage() {
  const session = await safeAuth();
  const me = session?.user;
  /**
   * Somebody attached to one school never sees this, whatever is ticked.
   *
   * This page is every school's history on one screen. The capability is a
   * list of JOC people, and a JOC person has no schoolId; a school account
   * does. Without this, one mis-ticked box on a principal's record hands
   * them thirty-eight other schools' notes — a mistake nobody would see.
   */
  const tiedToOneSchool = Boolean(me?.schoolId) && !isSuperAdminEmail(me?.email);
  const allowed = openForReview || (can(me, "buzz") && !tiedToOneSchool);

  if (!allowed) {
    return (
      <Shell>
        <Masthead />
        <Inside>
        <div style={card}>
          {me ? (
            <>
              {/* Signed in and simply not on the list. Said plainly, with who
                  to ask — a locked door with no handle is worse than a no. */}
              <p style={{ ...body, fontSize: "16px", margin: "0 0 6px", textAlign: "center" }}>
                <strong style={{ color: C.ink }}>You don&rsquo;t have the Buzz yet.</strong>
              </p>
              <p style={{ ...body, fontSize: "16px", margin: "0 0 16px", textAlign: "center" }}>
                Ask Yonah to switch it on for {me.email}.
              </p>
              <Link href="/log" style={{ ...googleButton, textDecoration: "none" }}>
                Add a school update instead
              </Link>
              <form action={signOutAction} style={{ marginTop: "8px" }}>
                <button type="submit" style={{ ...quietButton, cursor: "pointer" }}>
                  Sign out
                </button>
              </form>
            </>
          ) : isGoogleConfigured ? (
            <>
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value="/buzz" />
                <button type="submit" style={{ ...googleButton, cursor: "pointer" }}>
                  <GoogleMark />
                  Sign in to see it
                </button>
              </form>
              <p style={{ ...hint, textAlign: "center" }}>Your justonechesed.org address.</p>
            </>
          ) : (
            <p style={{ ...body, fontSize: "16px", color: C.orangeText, margin: 0 }}>
              Google sign-in isn&rsquo;t switched on yet.
            </p>
          )}
        </div>
        </Inside>
      </Shell>
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <Shell>
        <Masthead />
        <Inside>
          <p style={{ ...body, color: C.orangeText, margin: 0 }}>
            The database isn&rsquo;t connected, so there&rsquo;s nothing to show.
          </p>
        </Inside>
      </Shell>
    );
  }

  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const monthBack = new Date(midnight.getTime() - 30 * 86400000);

  const [rows, lastMonth, schoolsTouched] = await Promise.all([
    prisma.schoolActivity.findMany({
      where: { type: { in: [...UPDATE_TYPES] } },
      orderBy: { occurredAt: "desc" },
      take: 200,
      select: {
        id: true, type: true, detail: true, occurredAt: true,
        author: { select: { name: true, email: true } },
        program: { select: { name: true } },
        school: { select: { id: true, name: true } },
      },
    }).catch(() => []),
    prisma.schoolActivity.count({
      where: { type: { in: [...UPDATE_TYPES] }, occurredAt: { gte: monthBack, lte: midnight } },
    }).catch(() => 0),
    prisma.schoolActivity.findMany({
      where: { type: { in: [...UPDATE_TYPES] }, occurredAt: { gte: monthBack } },
      select: { schoolId: true },
      distinct: ["schoolId"],
    }).catch(() => []),
  ]);

  // Ahead of us, and behind us.
  const ahead = rows
    .filter((r) => r.type === "EVENT_PLANNED" && r.occurredAt >= midnight)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const aheadIds = new Set(ahead.map((a) => a.id));
  const behind = rows.filter((r) => !aheadIds.has(r.id)).slice(0, FEED);

  return (
    <Shell>
      {/* A masthead rather than four stacked lines of small caps. The dark
          ground is the brand's, carries the white wordmark, and separates
          the page's own furniture from the feed underneath it. */}
      <Masthead
        line={[
          `${lastMonth} ${lastMonth === 1 ? "update" : "updates"} in the last 30 days`,
          schoolsTouched.length > 0
            ? `${schoolsTouched.length} ${schoolsTouched.length === 1 ? "school" : "schools"}`
            : null,
          ahead.length > 0 ? `${ahead.length} in the diary` : null,
        ].filter(Boolean).join(" · ")}
      />

      <Inside>

      {/* ── Still ahead ───────────────────────────────────────────────── */}
      {ahead.length > 0 && (
        <section style={{ marginBottom: "30px" }}>
          <H2>Coming up</H2>
          <div style={{ display: "grid", gap: "10px" }}>
            {ahead.map((r) => (
              <div key={r.id} style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexWrap: "wrap" }}>
                <div style={{
                  flex: "0 0 128px", boxSizing: "border-box", minWidth: 0,
                  padding: "14px 16px", backgroundColor: C.greenTint, color: C.greenText,
                  display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px",
                }}>
                  <span style={{ ...label, color: C.greenText }}>{away(r.occurredAt, midnight)}</span>
                  <span style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, lineHeight: 1.2 }}>
                    {shortDay(r.occurredAt)}
                    {clock(r.occurredAt, r.type) ? `, ${clock(r.occurredAt, r.type)}` : ""}
                  </span>
                </div>
                <div style={{ flex: "100 1 200px", minWidth: 0, padding: "14px 16px" }}>
                  <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {r.school.name}
                  </p>
                  <p style={{ ...label, color: C.muted, margin: "4px 0 0" }}>
                    {r.program?.name ?? "No program"}
                    {" · "}
                    {first(r.author?.name ?? r.author?.email)}
                  </p>
                  {r.detail && <Detail text={r.detail} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Behind us ─────────────────────────────────────────────────── */}
      {/* A string, not JSX — an &rsquo; in here renders as the five letters. */}
      <H2>{ahead.length > 0 ? "Just in" : "What’s been happening"}</H2>

      {behind.length === 0 ? (
        <div style={{ ...card }}>
          <p style={{ ...body, fontSize: "16px", margin: 0 }}>
            Nothing yet. The first one can be yours — <Link href="/log" style={linkStyle}>add an update</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {behind.map((r) => (
            <article key={r.id} style={card}>
              <div style={{
                display: "flex", justifyContent: "space-between", gap: "10px",
                flexWrap: "wrap", alignItems: "baseline",
              }}>
                <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
                  {r.school.name}
                </p>
                <span style={{ ...label, color: C.muted }} title={day(r.occurredAt)}>
                  {ago(r.occurredAt, midnight).toUpperCase()}
                </span>
              </div>

              <p style={{ ...label, color: C.muted, margin: "4px 0 0" }}>
                <span style={{ color: C.ink }}>{TAG[r.type] ?? "UPDATE"}</span>
                {" · "}
                {r.program?.name ?? "No program"}
                {" · "}
                {first(r.author?.name ?? r.author?.email)}
              </p>

              {r.detail && <Detail text={r.detail} />}
            </article>
          ))}
        </div>
      )}

        <p style={{ ...hint, textAlign: "center", marginTop: "26px" }}>
          Anybody at JOC can add to this. Seeing it is switched on per person.
        </p>
      </Inside>
    </Shell>
  );
}

/**
 * The head of the sheet.
 *
 * One block: who it belongs to, who it is for, what it is called, one line of
 * numbers and the one thing to do. The figures used to be three columns under
 * a rule, which is more furniture than a feed needs above it.
 */
function Masthead({ line }: { line?: string }) {
  return (
    <header style={{ backgroundColor: C.ink, color: C.white, padding: "24px 20px 22px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "12px", flexWrap: "wrap",
      }}>
        <Image
          src="/brand/joc-wordmark-white.png"
          alt="JustOneChesed"
          width={170}
          height={21}
          priority
          style={{ height: "18px", width: "auto", display: "block" }}
        />
        <span style={{
          fontFamily: F.data, fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.orange, whiteSpace: "nowrap",
        }}>
          JOC staff view only
        </span>
      </div>

      <h1 style={{
        fontFamily: F.ui, fontSize: "clamp(26px, 6.5vw, 34px)", fontWeight: 700,
        letterSpacing: "-0.03em", lineHeight: 1.05, color: C.white,
        margin: "18px 0 0",
      }}>
        The JOC School Buzz
      </h1>

      {line && (
        <p style={{
          fontFamily: F.read, fontSize: "15px", lineHeight: 1.5,
          color: "rgba(255,255,255,.6)", margin: "8px 0 0",
        }}>
          {line}
        </p>
      )}

      <Link
        href="/log"
        style={{
          fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.white,
          backgroundColor: C.orange, borderRadius: "12px", padding: "0 20px",
          minHeight: "46px", display: "inline-flex", alignItems: "center",
          justifyContent: "center", textDecoration: "none", marginTop: "18px",
        }}
      >
        Add an update
      </Link>
    </header>
  );
}

/** First name only — this is a feed, not a directory. */
function first(who: string | null | undefined): string {
  if (!who) return "somebody at JOC";
  return who.includes("@") ? who.split("@")[0] : who.split(/\s+/)[0];
}

function Detail({ text }: { text: string }) {
  return (
    <p style={{
      fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
      margin: "8px 0 0", maxWidth: "62ch", whiteSpace: "pre-wrap",
    }}>
      {text}
    </p>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: F.ui, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em",
      color: C.ink, margin: "0 0 12px",
    }}>
      {children}
    </h2>
  );
}

/**
 * One framed sheet on the paper, with the masthead flush at its head.
 *
 * The frame is what holds the page together without a site header: the dark
 * block was floating on the background, and a rule down each side says where
 * the page is as plainly as a nav bar would have.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: "100vh", backgroundColor: C.paper,
      padding: "clamp(16px, 4vw, 44px) 14px 56px",
    }}>
      <div style={{
        maxWidth: "640px", margin: "0 auto",
        backgroundColor: C.paper,
        border: `1px solid ${C.hairline}`,
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "0 1px 0 #E3E6EF, 0 10px 34px rgba(16,35,63,.06)",
      }}>
        {children}
      </div>
    </main>
  );
}

/** Everything inside the frame that is not the masthead. */
function Inside({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "22px 18px 28px" }}>{children}</div>;
}

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted,
};

const hint: React.CSSProperties = {
  fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.muted, margin: "10px 0 0",
};

const linkStyle: React.CSSProperties = {
  color: C.blue, fontWeight: 600, textDecoration: "none",
};

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: "16px", padding: "16px 18px",
  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
};

const quietButton: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.muted,
  backgroundColor: "transparent", border: "none",
  padding: "0 18px", minHeight: "44px",
};

const googleButton: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
  fontFamily: F.ui, fontSize: "17px", fontWeight: 600, color: C.ink,
  backgroundColor: C.white, border: `1.5px solid ${C.hairline}`,
  borderRadius: R.form, padding: "0 18px", minHeight: "52px",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
