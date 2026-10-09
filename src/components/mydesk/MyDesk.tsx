import { C, T, R, ROW_SHADOW } from "@/lib/joc-tokens";
import { Tasks } from "./Tasks";
import { YourDay } from "./YourDay";
import { ForYou } from "./ForYou";
import { Notebook } from "./Notebook";
import { firstName, dateLine, greeting } from "@/lib/desk";
import { recap } from "@/lib/desk-recap";
import type { TodayAtJoc } from "@/lib/desk-today-at-joc";
import type { getMyDesk } from "@/lib/my-desk";

/**
 * Home base: the page greets you, then puts you to work.
 *
 * It used to be four equal quarters, each announcing its own emptiness at the
 * same volume — four bold "nothing here" headlines in four corners, which is
 * what a new person's desk looked like. Now one sentence says where you
 * stand, the list you actually work from takes the wide column, and the
 * panels that have nothing in them shrink or disappear rather than shouting.
 *
 * The page still doesn't scroll and each card still scrolls inside itself.
 * Below 980px it is one column and the page scrolls like anything else.
 */
export function MyDesk({ desk, joc }: {
  desk: Awaited<ReturnType<typeof getMyDesk>>;
  joc: TodayAtJoc | null;
}) {
  // Signed out — reviewing locally. "Your desk" rather than "your's desk".
  const who = desk.me?.name ?? desk.me?.email ?? null;
  const name = who ? firstName(who) : null;

  return (
    <div className="joc-bleed joc-desk" style={{ padding: "22px 24px 20px" }}>
      <header className="joc-desk-head">
        <div style={{ minWidth: 0 }}>
          {/* Both calendars, the way the console has always shown the date. */}
          <div style={{ ...T.meta, letterSpacing: ".1em", marginBottom: "6px" }}>
            {dateLine(desk.now)}
          </div>
          <h1 style={{ ...T.title, margin: 0, color: C.ink }}>
            {name ? `${greeting(desk.now)}, ${name}` : "Your desk"}
          </h1>
          <p style={{ ...T.read, color: C.muted, margin: "6px 0 0", maxWidth: "52ch" }}>
            {recap(desk)}
          </p>
        </div>

        {joc ? <TodayAtJocCard joc={joc} /> : null}
      </header>

      <div className="joc-desk-grid">
        <Tasks tasks={desk.tasks} handed={desk.handed} staff={desk.staff} />

        <div className="joc-desk-side">
          {/* For you has no permanent quarter: an empty tray is a sentence in
              the recap above, not a panel saying it has nothing in it. */}
          {desk.tray.length > 0 ? <ForYou tray={desk.tray} /> : null}
          <YourDay day={desk.day} />
          {/* Keyed on the set of pages: adding or deleting one is the only
              moment the tabs should reset, and nothing else remounts it. */}
          <Notebook key={desk.pages.map((p) => p.id).join(",")} pages={desk.pages} />
        </div>
      </div>
    </div>
  );
}

/**
 * What JOC is running today, read from the same document the lobby TV shows.
 *
 * It is the one thing on this page that is not about you — and it earns its
 * corner, because "is the Booth on this afternoon?" is a question people
 * currently answer by walking to the lobby.
 */
function TodayAtJocCard({ joc }: { joc: TodayAtJoc }) {
  return (
    <aside style={{
      flex: "0 0 auto", maxWidth: "340px",
      background: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW,
      padding: "12px 14px",
    }}>
      <div style={{ ...T.meta, marginBottom: "8px" }}>TODAY AT JOC</div>
      <div style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
        <span
          aria-hidden="true"
          className="material-symbols-rounded"
          style={{
            flex: "0 0 38px", height: "38px", borderRadius: R.sm,
            background: joc.tint, color: joc.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "21px",
          }}
        >
          {joc.icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...T.body, fontWeight: 700, color: C.ink }}>
            {joc.title}
            {joc.group ? <span style={{ color: C.muted, fontWeight: 500 }}> · {joc.group}</span> : null}
          </div>
          <div style={{ ...T.meta, marginTop: "3px" }}>{joc.meta}</div>
        </div>
      </div>
    </aside>
  );
}
