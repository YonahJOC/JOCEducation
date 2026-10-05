import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { C, F, label, datum, rowCard, sectionHeading } from "@/lib/joc-tokens";

/**
 * What a program hands every school on it: what's new, the questions schools
 * keep asking, and the things to open or download.
 *
 * All three are the same table with a different kind, because they are the
 * same act — JOC writing once for everybody, rather than a coordinator
 * answering the same question for the twelfth time in a thread.
 *
 * Nothing renders when a program has published nothing, rather than three
 * empty headings. An empty section is a promise the program has not kept
 * yet, and saying nothing is better than framing the gap.
 */

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export async function ProgramPosts({ programId }: { programId: number }) {
  if (!isDatabaseConfigured()) return null;

  const posts = await prisma.programPost
    .findMany({
      where: { programId, published: true },
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
      select: {
        id: true, kind: true, title: true, body: true, url: true, publishedAt: true,
      },
    })
    .catch(() => []);

  if (posts.length === 0) return null;

  const updates = posts.filter((p) => p.kind === "UPDATE");
  const questions = posts.filter((p) => p.kind === "QA");
  const resources = posts.filter((p) => p.kind === "RESOURCE");

  return (
    <>
      {resources.length > 0 && (
        <section style={{ marginTop: "28px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Yours to use</h2>
          <div className="joc-also">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                style={{ ...rowCard, display: "block", padding: "18px 20px", textDecoration: "none" }}
              >
                <span style={{
                  display: "block", fontFamily: F.ui, fontSize: "17px", fontWeight: 700,
                  color: C.ink, marginBottom: "4px",
                }}>
                  {r.title} ↗
                </span>
                <span style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted }}>
                  {r.body}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {updates.length > 0 && (
        <section style={{ marginTop: "28px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>What&rsquo;s new</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {updates.map((u) => (
              <article key={u.id} style={{ ...rowCard, padding: "18px 20px" }}>
                {u.publishedAt && (
                  <p style={{ ...datum, margin: "0 0 6px" }}>{day(u.publishedAt).toUpperCase()}</p>
                )}
                <p style={{
                  fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink,
                  margin: "0 0 6px", lineHeight: 1.3,
                }}>
                  {u.title}
                </p>
                <p style={{
                  fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
                  margin: 0, maxWidth: "62ch",
                }}>
                  {u.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section style={{ marginTop: "28px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Questions and answers</h2>
          <p style={{ ...label, color: C.muted, margin: "0 0 12px" }}>
            What schools ask most
          </p>

          <div style={{ display: "grid", gap: "8px" }}>
            {questions.map((q) => (
              <details key={q.id} style={{ ...rowCard, padding: "0" }}>
                <summary style={{
                  fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink,
                  cursor: "pointer", padding: "14px 18px", minHeight: "44px",
                  display: "flex", alignItems: "center", lineHeight: 1.35,
                }}>
                  {q.title}
                </summary>
                <p style={{
                  fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
                  margin: 0, padding: "0 18px 16px", maxWidth: "62ch",
                  borderTop: `1px solid ${C.hairline}`, paddingTop: "14px",
                }}>
                  {q.body}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
