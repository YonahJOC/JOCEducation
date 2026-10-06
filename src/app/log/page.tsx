import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { isStaffEmail } from "@/lib/access";
import { LogVisitForm } from "@/components/LogVisitForm";
import { C, F, label, pageTitle } from "@/lib/joc-tokens";

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
  if (!openForReview && !isStaffEmail(me?.email)) {
    return (
      <Shell>
        <h1 style={{ ...pageTitle, margin: "0 0 10px" }}>Log a school visit</h1>
        <p style={{ ...body, margin: "0 0 20px" }}>
          {me
            ? `You're signed in as ${me.email}, which isn't a justonechesed.org address. This form is for JOC staff.`
            : "Sign in with your justonechesed.org address and the form opens. There's nothing else to set up."}
        </p>
        <Link
          href="/?next=%2Flog"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.white,
            backgroundColor: C.blue, borderRadius: "12px", padding: "0 24px",
            minHeight: "52px", textDecoration: "none",
          }}
        >
          Sign in with Google
        </Link>
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
