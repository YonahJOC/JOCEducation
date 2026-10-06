import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview, isGoogleConfigured } from "@/auth";
import { isStaffEmail } from "@/lib/access";
import { signInWithGoogle, signOutAction } from "@/app/actions/auth";
import { LogVisitForm } from "@/components/LogVisitForm";
import { C, R, F, label, pageTitle } from "@/lib/joc-tokens";

/**
 * One link, for anybody at JOC who was at a school.
 *
 * Not in the console and not behind a capability: somebody who runs one
 * program three times a year should not have to learn a console to say they
 * ran it. A justonechesed.org sign-in is the whole permission.
 *
 * What they write becomes a SchoolActivity, which is the row the school's
 * history, the board and the school's own Today already read.
 */

export const metadata = {
  title: "Log a school visit — JOC",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function LogPage() {
  const session = await safeAuth();
  const me = session?.user;

  // Signed out, or signed in with something that is not a JOC address.
  //
  // This is the form's own page with the sign-in standing in front of it, not
  // a detour to the landing page: somebody who was handed this link came to
  // write down one visit, and a marketing page with a login box reads as the
  // wrong link. They should see what they are about to fill in.
  if (!openForReview && !isStaffEmail(me?.email)) {
    const wrongAccount = Boolean(me);
    return (
      <Shell>
        <h1 style={{ ...pageTitle, margin: "0 0 8px" }}>What did you do at a school?</h1>
        <p style={{ ...body, margin: "0 0 22px", maxWidth: "48ch" }}>
          Write it down while it&rsquo;s fresh. It goes on the school&rsquo;s record and the office
          picks it up — you don&rsquo;t need to tell anybody separately.
        </p>

        <LogVisitForm
          // Nobody has signed in, so nobody is shown the list of schools.
          schools={[]}
          programs={[]}
          myName=""
          locked
          signIn={
            wrongAccount ? (
              <>
                <p style={{ ...body, fontSize: "16px", margin: "0 0 16px" }}>
                  You&rsquo;re signed in as <strong style={{ color: C.ink }}>{me!.email}</strong>,
                  which isn&rsquo;t a justonechesed.org address.
                </p>
                <form action={signOutAction}>
                  <button type="submit" style={{ ...googleButton, cursor: "pointer" }}>
                    Sign out
                  </button>
                </form>
                <p style={{ ...hint, textAlign: "center" }}>
                  Then open this link again with your JOC address.
                </p>
              </>
            ) : isGoogleConfigured ? (
              <>
                <form action={signInWithGoogle}>
                  <input type="hidden" name="next" value="/log" />
                  <button type="submit" style={{ ...googleButton, cursor: "pointer" }}>
                    <GoogleMark />
                    Sign in to fill this in
                  </button>
                </form>
                <p style={{ ...hint, textAlign: "center" }}>
                  Your justonechesed.org address. Nothing is emailed to the school.
                </p>
              </>
            ) : (
              <p style={{ ...body, fontSize: "16px", color: C.orangeText, margin: 0 }}>
                Google sign-in isn&rsquo;t switched on yet, so the form can&rsquo;t open.
              </p>
            )
          }
        />
      </Shell>
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <Shell>
        <h1 style={{ ...pageTitle, margin: "0 0 10px" }}>Log a school visit</h1>
        <p style={{ ...body, color: C.orangeText, margin: 0 }}>
          The database isn&rsquo;t connected, so nothing can be saved right now.
        </p>
      </Shell>
    );
  }

  const [schools, programs, mine] = await Promise.all([
    prisma.school.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true, name: true,
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
          select: { id: true, name: true },
        },
      },
    }).catch(() => []),
    prisma.programPage.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }).catch(() => []),
    // Their own last few, so nobody logs the same visit twice.
    me?.id
      ? prisma.schoolActivity.findMany({
          where: { authorId: me.id, type: "VISIT" },
          orderBy: { occurredAt: "desc" },
          take: 5,
          select: {
            id: true, summary: true, occurredAt: true,
            school: { select: { name: true } },
          },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const myName = me?.name ?? me?.email ?? "JOC";

  return (
    <Shell>
      <h1 style={{ ...pageTitle, margin: "0 0 8px" }}>What did you do at a school?</h1>
      <p style={{ ...body, margin: "0 0 22px", maxWidth: "48ch" }}>
        Write it down while it&rsquo;s fresh. It goes on the school&rsquo;s record and the office
        picks it up — you don&rsquo;t need to tell anybody separately.
      </p>

      <LogVisitForm schools={schools} programs={programs} myName={myName} />

      {mine.length > 0 && (
        <section style={{ marginTop: "26px" }}>
          <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>What you&rsquo;ve logged</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "7px" }}>
            {mine.map((a) => (
              <li key={a.id} style={{ ...body, fontSize: "15px", margin: 0 }}>
                <strong style={{ color: C.ink }}>{a.school.name}</strong>
                {" · "}
                {a.occurredAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: "100vh", backgroundColor: C.paper,
      padding: "clamp(22px, 5vw, 54px) 18px 64px",
    }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>{children}</div>
    </main>
  );
}

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.muted,
};

const hint: React.CSSProperties = {
  fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.muted, margin: "10px 0 0",
};

const googleButton: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
  fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink,
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
