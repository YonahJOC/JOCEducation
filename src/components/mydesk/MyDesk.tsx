import { C, F } from "@/lib/joc-tokens";
import { Tasks } from "./Tasks";
import { YourDay } from "./YourDay";
import { ForYou } from "./ForYou";
import { Notebook } from "./Notebook";
import { firstName, dateLine } from "@/lib/desk";
import type { getMyDesk } from "@/lib/my-desk";

/**
 * Four quarters, one screen.
 *
 * The grid is the height of the window and the page itself does not scroll —
 * each quarter scrolls inside its own frame. That is deliberate: a desk you
 * have to scroll is a desk where the fourth thing is never looked at, and
 * the fourth thing here is the notebook.
 *
 * Below 980px it becomes one column and the page scrolls like anything else.
 */
export function MyDesk({ desk }: { desk: Awaited<ReturnType<typeof getMyDesk>> }) {
  // Signed out — reviewing locally. "Your desk" rather than "your's desk".
  const who = desk.me?.name ?? desk.me?.email ?? null;
  const name = who ? firstName(who) : "Your";
  // Both calendars, the way the console has always shown the date. Writing
  // the Gregorian one by hand here is how the Hebrew one went missing.
  const date = dateLine(desk.now);

  return (
    <div className="joc-bleed joc-desk" style={{ padding: "22px 24px 20px" }}>
      <header style={{
        display: "flex", flexWrap: "wrap", alignItems: "baseline",
        gap: "6px 16px", marginBottom: "16px",
      }}>
        <h1 style={{
          margin: 0, font: `600 clamp(24px, 2.6cqw, 30px)/1.1 ${F.ui}`,
          letterSpacing: "-.02em", color: C.ink,
        }}>
          {who ? `${name}’s desk` : "Your desk"}
        </h1>
        <span style={{
          font: `500 11px/1 ${F.data}`, letterSpacing: ".1em", color: C.faint,
        }}>
          {date}
        </span>
      </header>

      <div className="joc-desk-grid">
        <Tasks tasks={desk.tasks} handed={desk.handed} staff={desk.staff} />
        <YourDay day={desk.day} />
        <ForYou tray={desk.tray} />
        {/* Keyed on the set of pages: adding or deleting one is the only
            moment the tabs should reset, and nothing else remounts it. */}
        <Notebook key={desk.pages.map((p) => p.id).join(",")} pages={desk.pages} />
      </div>
    </div>
  );
}
