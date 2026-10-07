import Link from "next/link";
import { BandRow } from "@/components/ui/BandRow";
import { YourList } from "@/components/desk/YourList";
import { YourDiary } from "@/components/desk/YourDiary";
import { TheBoard } from "@/components/desk/TheBoard";
import { NoticeStrip } from "@/components/desk/NoticeStrip";
import { ChipRow } from "@/components/desk/ChipRow";
import { BuzzStrip } from "@/components/admin/BuzzStrip";
import { greeting, firstName, dateLine, type getDesk } from "@/lib/desk";
import type { Today } from "@/lib/today";
import { C, F } from "@/lib/joc-tokens";

/**
 * My desk.
 *
 * One page, read top to bottom: what needs you, then your own work, then a
 * rule that says the rest is not waiting on anybody, then the shared things.
 *
 * The rule is the whole design. Everything above it is addressed to the
 * person reading; everything below is the office. Without it the page is a
 * wall of boxes and the only honest way to use it is to read all of them.
 */

export function Desk({
  today, desk,
}: {
  today: Today;
  desk: Awaited<ReturnType<typeof getDesk>>;
}) {
  const { me, superAdmin, now, todos, diary, patch, notices, fresh } = desk;
  const open = todos.filter((t) => !t.done).length;

  // One sentence, from the data. Not a welcome — a summary.
  const summary = [
    today.rows.length === 0
      ? "Nothing needs you"
      : `${today.rows.length} ${today.rows.length === 1 ? "thing needs" : "things need"} you`,
    open > 0 ? `${open} on your list` : null,
    diary.length > 0 ? `${diary.length} in the diary` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <header style={{ marginBottom: "30px", maxWidth: "720px" }}>
        <p style={{
          fontFamily: F.data, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em",
          color: C.muted, margin: 0,
        }}>
          {dateLine(now)}
        </p>
        <h1 style={{
          fontFamily: F.ui, fontSize: "clamp(30px, 4.6vw, 46px)", fontWeight: 600,
          letterSpacing: "-0.025em", lineHeight: 1.05, color: C.ink, margin: "12px 0 10px",
        }}>
          {today.rows.length === 0
            ? "Nothing needs you."
            : `${greeting(now)}, ${firstName(me?.name ?? me?.email)}.`}
        </h1>
        <p style={{
          fontFamily: F.read, fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.45,
          color: "#2C3C5A", margin: 0,
        }}>
          {summary}.
        </p>
      </header>

      {fresh && <NoticeStrip notice={fresh} />}

      <ChipRow chips={[
        { label: "Needs you", count: today.rows.length, to: "needs" },
        { label: "Your list", count: open, to: "week" },
        { label: "Diary", count: diary.length, to: "week" },
        { label: "Programs", count: patch.length, to: "programs" },
        { label: "Buzz", count: null, to: "buzz" },
        { label: "Board", count: notices.filter((n) => !n.read).length, to: "buzz" },
      ]} />

      {/* ── Needs you ───────────────────────────────────────────────── */}
      <section id="needs" style={{ marginBottom: "44px", scrollMarginTop: "64px" }}>
        <SectionHead title="Needs you" count={today.rows.length ? `${today.rows.length}` : undefined} />

        {today.rows.length === 0 ? (
          <BandRow
            tone="good"
            label="All clear"
            figure="0"
            title="Nothing is waiting on you"
            line="No school is overdue, nothing is waiting on a decision, and every run this week is announced."
          />
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {today.rows.map((r) => (
              <BandRow
                key={r.id}
                tone={r.tone}
                label={r.label}
                figure={r.figure}
                title={r.title}
                line={r.line}
                action={r.action ?? undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Your week ───────────────────────────────────────────────── */}
      <section id="week" style={{ marginBottom: "44px", scrollMarginTop: "64px" }}>
        <SectionHead title="Your week" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          <YourList todos={todos} />
          <YourDiary items={diary} now={now} />
        </div>
      </section>

      {/* ── The line ────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "14px", margin: "0 0 32px",
      }}>
        <span style={{ flex: 1, height: "1px", backgroundColor: C.hairline }} />
        <span style={{
          fontFamily: F.data, fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap",
        }}>
          Nothing below is waiting on you
        </span>
        <span style={{ flex: 1, height: "1px", backgroundColor: C.hairline }} />
      </div>

      {/* ── Your programs ───────────────────────────────────────────── */}
      {patch.length > 0 && (
        <section id="programs" style={{ marginBottom: "44px", scrollMarginTop: "64px" }}>
          <SectionHead title={superAdmin ? "Every program" : "Your programs"} />
          <div style={{
            display: "grid", gap: "10px",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          }}>
            {patch.map((p) => (
              <Link key={p.id} href={p.href} style={{
                textDecoration: "none", backgroundColor: C.white, borderRadius: "14px",
                padding: "14px 16px", boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
                display: "block",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
                  <span aria-hidden="true" style={{
                    width: "8px", height: "8px", borderRadius: "50%", flex: "0 0 auto",
                    backgroundColor: p.tone === "good" ? "#4FAE6E" : C.faint,
                  }} />
                  <span style={{
                    fontFamily: F.data, fontSize: "10.5px", fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted,
                  }}>
                    {p.status}
                  </span>
                </div>
                <p style={{
                  fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink,
                  margin: "0 0 8px", lineHeight: 1.25,
                }}>
                  {p.name}
                </p>
                {p.facts.map((f) => (
                  <p key={f.key} style={{ margin: "0 0 3px", display: "flex", gap: "8px" }}>
                    <span style={{
                      fontFamily: F.data, fontSize: "10px", fontWeight: 500,
                      letterSpacing: "0.08em", color: C.faint, flex: "0 0 68px",
                    }}>
                      {f.key}
                    </span>
                    <span style={{
                      fontFamily: F.read, fontSize: "14px", color: C.muted, minWidth: 0,
                    }}>
                      {f.value}
                    </span>
                  </p>
                ))}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── The Buzz, and the board ─────────────────────────────────── */}
      <div id="buzz" style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start", scrollMarginTop: "64px" }}>
        <div style={{ flex: "1 1 520px", minWidth: 0 }}>
          <BuzzStrip />
        </div>
        <TheBoard notices={notices} canPin={superAdmin} />
      </div>
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
      <h2 style={{
        fontFamily: F.ui, fontSize: "19px", fontWeight: 600, letterSpacing: "-0.01em",
        color: C.ink, margin: 0,
      }}>
        {title}
      </h2>
      {count && (
        <span style={{
          fontFamily: F.data, fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em",
          color: C.muted,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}
