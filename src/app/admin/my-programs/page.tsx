import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { listProgramsForAdmin } from "@/lib/program-admin";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Your programs.
 *
 * The one page in the console a program coordinator can open. It is not the
 * Programs page — that one edits the public write-up and belongs to the
 * education team. This one is the programs you were put down as running, and
 * the people who have signed up for them.
 *
 * No capability guard: being named as running a program is the permission.
 * listProgramsForAdmin already narrows the list to that person's own.
 */

export const metadata = { title: "Program consoles — JOC Console" };
export const dynamic = "force-dynamic";

export default async function MyProgramsPage() {
  const programs = await listProgramsForAdmin();
  // An admin sees every program here; a coordinator sees only theirs. The
  // wording follows, so the page never calls somebody else's programs "yours".
  const session = await safeAuth();
  const all =
    openForReview ||
    can(session?.user, "programs") ||
    can(session?.user, "forms") ||
    can(session?.user, "coordinators");

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: C.ink, margin: "0 0 6px" }}>
        {all ? "Program consoles" : "Your programs"}
      </h1>
      <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, margin: "0 0 24px", maxWidth: "62ch" }}>
        {all
          ? "Every program's own console — the same page its coordinator opens, with all of them here rather than just theirs. Open one for its sign-up form, its sign-ups and its dates."
          : "The programs you run. Open one to work on its sign-up form and see who has signed up."}
      </p>

      {programs.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px dashed rgba(16,35,63,.2)", borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6 }}>
            You are not down as running any program yet.
            <br />
            Whoever holds the Coordinators permission can add you on the program&rsquo;s own page.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
          {programs.map((p, i) => (
            <Link
              key={p.id}
              href={`/admin/programs/${p.slug}`}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "16px 18px", textDecoration: "none", minHeight: "44px",
                borderTop: i === 0 ? "none" : "1px solid rgba(16,35,63,.07)",
              }}
            >
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: "15.5px", fontWeight: 600, color: C.ink }}>
                  {p.name}
                  {!p.published && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#C96C00", backgroundColor: "rgba(250,145,45,.14)", borderRadius: "9999px", padding: "2px 8px", marginLeft: "8px" }}>
                      draft
                    </span>
                  )}
                </span>
                <span style={{ display: "block", fontSize: "12.5px", color: "#4A5A74", marginTop: "3px" }}>
                  {p.formTitle ?? "No form yet"}
                  {" · "}
                  {p.responseCount === 0
                    ? "no sign-ups yet"
                    : `${p.responseCount} sign-up${p.responseCount === 1 ? "" : "s"}`}
                </span>
              </span>
              <span style={{ fontSize: "13.5px", fontWeight: 600, color: C.blue, flexShrink: 0 }}>Open →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
