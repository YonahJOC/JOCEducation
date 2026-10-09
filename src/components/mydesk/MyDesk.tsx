import { C, F, T, R } from "@/lib/joc-tokens";
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
    <div className="joc-bleed joc-desk" style={{ padding: "36px 44px" }}>
      {/* One saturated fill on the page, and this is it: the band that says
          good morning and what today looks like. Everything else is a tint. */}
      <header
        className="joc-desk-head"
        style={{
          background: C.blue, borderRadius: R.hero, color: C.white,
          padding: "24px 30px",
          display: "grid",
          gridTemplateColumns: joc ? "minmax(0,1fr) 360px" : "minmax(0,1fr)",
          gap: "32px", alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Both calendars, the way the console has always shown the date. */}
          <div style={{ ...T.meta, fontSize: "12px", color: C.onDarkLabel }}>
            {dateLine(desk.now)}
          </div>
          <h1 style={{
            fontFamily: F.ui, fontSize: "40px", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1.05,
            color: C.white, margin: "10px 0 0",
          }}>
            {name ? `${greeting(desk.now)}, ${name}` : "Your desk"}
          </h1>
          <p style={{
            fontFamily: F.read, fontSize: "19px", lineHeight: 1.5,
            color: C.onDarkBody, margin: "8px 0 0", maxWidth: "52ch",
          }}>
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
      background: C.orangeTint, borderRadius: "16px", padding: "18px 20px",
    }}>
      <div style={{ ...T.meta, color: C.orangeText, marginBottom: "10px" }}>TODAY AT JOC</div>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <span
          aria-hidden="true"
          className="material-symbols-rounded"
          style={{
            flex: "0 0 48px", height: "48px", borderRadius: "14px",
            background: C.white, color: joc.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px",
            fontVariationSettings: '"FILL" 1, "wght" 600, "GRAD" 0, "opsz" 24',
          }}
        >
          {joc.icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
            {joc.title}
            {joc.group ? ` · ${joc.group}` : ""}
          </div>
          <div style={{ ...T.meta, color: C.ink, marginTop: "4px" }}>{joc.meta}</div>
        </div>
      </div>
    </aside>
  );
}
