import Link from "next/link";
import { redirect } from "next/navigation";
import { safeAuth, isAuthConfigured } from "@/auth";
import { canRunSchoolApp } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * A school's own sign-ups.
 *
 * This is the school-scoped half of the program pages in the JOC console. A
 * coordinator at JOC sees every school's registrations for one program; a
 * teacher here sees their own school's registrations for every program, and
 * nothing belonging to anybody else.
 *
 * The filter is a column on the response, not a guess from an email domain.
 * Anything that arrived before that column existed has no school on it and
 * is not shown to anybody — a registration we cannot attribute is not one to
 * hand to a school that might not own it.
 */

export const metadata = { title: "Your programs — JOC" };
export const dynamic = "force-dynamic";

const INK = "#10233F";
const BLUE = "#2D46AF";
const MUTED = "rgba(16,35,63,.6)";
const HAIRLINE = "rgba(16,35,63,.1)";

/**
 * One school's sign-ups, newest first.
 *
 * A function of its own so the row type comes from the query rather than from
 * an empty array in a catch.
 */
async function loadSignUps(schoolId: string) {
  try {
    return await prisma.formResponse.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        form: {
          select: {
            title: true,
            feeCents: true,
            // A form can in principle be attached to more than one program;
            // in practice it is one, and the first is the one to name.
            programs: { select: { name: true, slug: true }, take: 1 },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

type SignUp = Awaited<ReturnType<typeof loadSignUps>>[number];

export default async function SchoolProgramsPage() {
  const session = await safeAuth();
  if (isAuthConfigured && !canRunSchoolApp(session?.user)) redirect("/home");

  const schoolId = session?.user?.schoolId ?? null;
  if (!schoolId || !isDatabaseConfigured()) {
    return (
      <div>
        <h1 style={h1}>Your programs</h1>
        <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.6, maxWidth: "60ch" }}>
          Your account is not attached to a school yet, so there is nothing to show. Whoever at JOC
          set you up can attach you.
        </p>
      </div>
    );
  }

  const [school, responses] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }).catch(() => null),
    loadSignUps(schoolId),
  ]);

  // Grouped by program, because a school thinks in programs rather than forms.
  const groups = new Map<string, { name: string; slug: string | null; rows: SignUp[] }>();
  for (const r of responses) {
    const prog = r.form?.programs?.[0];
    const key = prog?.slug ?? r.form?.title ?? "other";
    const g = groups.get(key) ?? {
      name: prog?.name ?? r.form?.title ?? "Other sign-ups",
      slug: prog?.slug ?? null,
      rows: [] as SignUp[],
    };
    g.rows.push(r);
    groups.set(key, g);
  }

  return (
    <div>
      <h1 style={h1}>Your programs</h1>
      <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.6, margin: "0 0 26px", maxWidth: "62ch" }}>
        Everyone at {school?.name ?? "your school"} who has signed up for a JOC program. Only your
        school&rsquo;s — no other school&rsquo;s registrations appear here, and yours do not appear
        in theirs.
      </p>

      {groups.size > 0 && (
        <p style={{ margin: "0 0 18px" }}>
          {/* A plain link: the browser does the whole job, and the route takes
              no id, so there is nothing to point at another school. */}
          <a
            href="/api/school/sign-ups/export"
            download
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              fontSize: "13.5px", fontWeight: 600, color: BLUE,
              backgroundColor: "rgba(45,70,175,.08)", borderRadius: "9999px",
              padding: "10px 18px", minHeight: "44px", textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1.5v9m0 0L4.5 7M8 10.5 11.5 7M2 12.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download as a spreadsheet
          </a>
        </p>
      )}

      {groups.size === 0 ? (
        <div style={{ backgroundColor: "#fff", border: `1px dashed rgba(16,35,63,.2)`, borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: MUTED, margin: "0 0 6px" }}>Nobody has signed up yet.</p>
          <p style={{ fontSize: "13.5px", color: MUTED, margin: 0 }}>
            <Link href="/programs" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>
              See what JOC runs →
            </Link>
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {[...groups.values()].map((g) => (
            <div key={g.name} style={{ backgroundColor: "#fff", border: `1px solid ${HAIRLINE}`, borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "15px 18px", borderBottom: `1px solid ${HAIRLINE}`, display: "flex", gap: "10px", alignItems: "baseline", flexWrap: "wrap" }}>
                <p style={{ fontSize: "16px", fontWeight: 600, color: INK, margin: 0, flex: 1, minWidth: 0 }}>
                  {g.slug ? (
                    <Link href={`/programs/${g.slug}`} style={{ color: INK, textDecoration: "none" }}>
                      {g.name}
                    </Link>
                  ) : (
                    g.name
                  )}
                </p>
                <span style={{ fontSize: "13px", color: MUTED }}>
                  {g.rows.length} sign-up{g.rows.length === 1 ? "" : "s"}
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "520px" }}>
                  <thead>
                    <tr>
                      {["When", "Name", "Email", ...(g.rows[0]?.form?.feeCents ? ["Paid"] : [])].map((h) => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r) => (
                      <tr key={r.id}>
                        <td style={td}>
                          {r.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </td>
                        <td style={{ ...td, fontWeight: 600, color: INK }}>{r.name ?? "—"}</td>
                        <td style={{ ...td, wordBreak: "break-all" }}>{r.email ?? "—"}</td>
                        {r.form?.feeCents ? (
                          <td style={td}>
                            <span style={{ fontSize: "11.5px", fontWeight: 700, borderRadius: "9999px", padding: "2px 9px", color: r.paid ? "#1B7F4B" : "#C96C00", backgroundColor: r.paid ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)" }}>
                              {r.paid ? "paid" : "unpaid"}
                            </span>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Said plainly rather than shown as an empty panel: the hours and the
          approvals live in the JOC App, and this system cannot see them yet. */}
      <div style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "18px 20px", marginTop: "18px" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: INK, margin: "0 0 5px" }}>
          Chesed hours are not here yet
        </p>
        <p style={{ fontSize: "13.5px", color: MUTED, lineHeight: 1.6, margin: 0, maxWidth: "62ch" }}>
          Hours your students log, and anything waiting for you to approve, live in the JOC App.
          This portal cannot read them yet. When the two are joined up they will appear on this
          page, under your programs.
        </p>
      </div>
    </div>
  );
}

const h1: React.CSSProperties = {
  fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 6px",
};
const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 18px", fontSize: "10.5px", letterSpacing: "0.14em",
  textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)",
  borderBottom: `1px solid rgba(16,35,63,.08)`, backgroundColor: "#FAFBFD", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "11px 18px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)",
  verticalAlign: "top",
};
