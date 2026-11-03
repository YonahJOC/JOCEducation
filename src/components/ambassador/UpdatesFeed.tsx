import { C, F, R, T } from "@/lib/joc-tokens";
import type { Update } from "@/lib/school-screen/updates";

/**
 * What happened to the things a student sent in.
 *
 * It had a rail item and a page of its own, which made it look like a
 * second job. It is not a job at all — it is the answer to "did anything
 * happen to my flyer", which belongs on the page about the flyer.
 *
 * Nothing here was written to them. Every line is worked out from the
 * state of something they sent, which is why the footnote says so: a feed
 * that looks like an inbox but never replies is worse than no feed.
 */

const TONE: Record<Update["tone"], { bg: string; fg: string }> = {
  good: { bg: C.greenTint, fg: C.greenText },
  info: { bg: C.blueTint, fg: C.blue },
  quiet: { bg: C.panel, fg: C.muted },
};

function when(at: string): string {
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UpdatesFeed({ updates, teacherName }: {
  updates: Update[];
  teacherName: string | null;
}) {
  return (
    <>
      {updates.length === 0 ? (
        <div style={{
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row,
          padding: "26px 20px", textAlign: "center",
        }}>
          <p style={{ ...T.read, color: C.muted, margin: 0, maxWidth: "46ch", marginInline: "auto" }}>
            Nothing has moved yet. When something you sent in is passed on or goes up on the
            screen, it turns up here.
          </p>
        </div>
      ) : (
        <ul style={{
          listStyle: "none", margin: 0, padding: 0, overflow: "hidden",
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row,
        }}>
          {updates.map((u, i) => {
            const tone = TONE[u.tone];
            return (
              <li key={u.key} style={{
                display: "flex", gap: "14px", alignItems: "flex-start",
                padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.rule}`,
              }}>
                <span aria-hidden="true" className="material-symbols-rounded" style={{
                  width: "38px", height: "38px", flex: "none", borderRadius: R.sm,
                  background: tone.bg, color: tone.fg,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px",
                }}>
                  {u.icon}
                </span>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <p style={{ fontFamily: F.ui, fontSize: "16px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {u.headline}
                  </p>
                  <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "2px 0 0", lineHeight: 1.45 }}>
                    {u.line}
                  </p>
                </div>
                <span style={{ ...T.meta, flex: "none", paddingTop: "3px" }}>{when(u.at)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ ...T.small, fontWeight: 400, color: C.faint, margin: "12px 2px 0" }}>
        Nothing is sent from here, and JOC never messages students. To ask something, write to{" "}
        {teacherName ?? "your teacher"} in the message center.
      </p>
    </>
  );
}
