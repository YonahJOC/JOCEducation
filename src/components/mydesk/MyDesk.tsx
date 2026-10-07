import { C, F, label } from "@/lib/joc-tokens";
import { Tasks } from "./Tasks";
import { YourDay } from "./YourDay";
import { ForYou } from "./ForYou";
import { Notebook } from "./Notebook";
import { firstName } from "@/lib/desk";
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
  const date = desk.now
    .toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })
    .toUpperCase();

  return (
    <div className="joc-bleed joc-desk" style={{ padding: "22px 24px 20px" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <h1 style={{ fontFamily: F.ui, fontSize: "26px", fontWeight: 700, color: C.ink, margin: 0, letterSpacing: "-.01em" }}>
          {who ? `${name}’s desk` : "Your desk"}
        </h1>
        <span style={{ ...label, color: C.faint }}>{date}</span>
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
