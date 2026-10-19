/**
 * Builds the offline demo: one HTML file, no server, no sign-in, no network.
 *
 * It is carried to meetings on a laptop, so everything it needs is inlined —
 * the logo as a data URI, the icons as SVG rather than an icon font, and the
 * fonts with a system fallback that keeps the layout intact when there is no
 * wifi. Open the file and it works; that is the whole requirement.
 *
 *   node demo/build.mjs   →   demo/JOC-demo.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SCHOOL, SCHOOL_PROGRAMS, SCHOOL_TEACHERS, LESSON, SCHOOL_SCREEN,
  DESK, OFFICE, BOARD, FORM,
} from "./data.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const CYCLES = JSON.parse(fs.readFileSync(path.join(root, "cycles.json"), "utf8"));
const logo = fs.readFileSync(path.join(root, "public/brand/joc-wordmark.png")).toString("base64");
const logoWhite = fs.readFileSync(path.join(root, "public/brand/joc-wordmark-white.png")).toString("base64");

/**
 * The school hallway screen, exactly as it ships.
 *
 * Not a rebuild of it — the real exported page, inlined as a data URI inside
 * an iframe, so the demo shows the thing itself rather than my impression of
 * it. It is designed at 1920×1080 and scaled to whatever width the scene has.
 */
const SCREEN_FILE = "school-screen.html";
const HAS_SCREEN = fs.existsSync(path.join(here, SCREEN_FILE));

const C = {
  ink: "#10233F", paper: "#FBF9F4", white: "#FFFFFF", panel: "#F4F7FD",
  blue: "#2D46AF", blueTint: "#E4E9F8", orange: "#FA912D", orangeText: "#A85B00",
  orangeTint: "#FFF0E0", green: "#2FA457", greenText: "#1D6B37", greenTint: "#E3F4E8",
  red: "#D8412F", redText: "#A3261A", redTint: "#FBE6E3",
  muted: "#4A5A74", faint: "#5A6782", outline: "#CBD3EE", hairline: "#E3E6EF",
  rule: "#F0F2F7", segment: "#EEF0F5", onDarkBody: "#C6CFF0", onDarkLabel: "#FFD8AE",
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Inline SVG, so the icons survive with no network. */
const ICON = {
  home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  school: '<path d="M12 4 2 9l10 5 8-4v6h2V9z"/><path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5l-6 3z"/>',
  calendar: '<path d="M7 2v2M17 2v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18" stroke="#fff" stroke-width="1.6"/>',
  tv: '<rect x="2" y="4" width="20" height="13" rx="2.5"/><path d="M8 21h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  desk: '<rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M7 9h10M7 13h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
  feed: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h8M7 17h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
  board: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M9 9v11M15 9v11" stroke="#fff" stroke-width="1.5"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
  book: '<path d="M4 4h7v16H4zM13 4h7v16h-7z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
  call: '<path d="M6 3 9 8l-2 2a12 12 0 0 0 7 7l2-2 5 3-2 3C11 21 3 13 3 5z"/>',
  groups: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5zM17 13c2.4 0 4 1.5 4 3.5V19h-4z"/>',
  flag: '<path d="M6 3v18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M7 4h11l-2.5 4L18 12H7z"/>',
  check: '<path d="m5 13 4 4 10-11" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  store: '<path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 12v8h14v-8" stroke="currentColor" stroke-width="2" fill="none"/>',
  pin: '<path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.6" fill="#fff"/>',
};
const icon = (name, size = 22, color = "currentColor") =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" aria-hidden="true" style="flex:0 0 auto">${ICON[name] || ""}</svg>`;

const VENUE = {
  center: { ink: C.blue, tint: C.blueTint, icon: "pin" },
  shuk: { ink: C.orangeText, tint: C.orangeTint, icon: "store" },
  other: { ink: C.greenText, tint: C.greenTint, icon: "flag" },
};

/* ────────────────────────────── the scenes ───────────────────────────── */

const scene = (id, title, caption, body) => `
<section class="scene" id="${id}" hidden>
  <header class="scene-head">
    <h2>${esc(title)}</h2>
    <p>${esc(caption)}</p>
  </header>
  ${body}
</section>`;

function sceneStart() {
  return `
  <div class="start">
    <img src="data:image/png;base64,${logo}" alt="Just One Chesed" class="start-logo" />
    <h1>Every school, working on the same middah, at the same time.</h1>
    <p class="start-lede">Just One Chesed runs chesed programmes in Jewish day schools, organised around eight Chesed Cycles across the school year. This is the portal we built so a school can reach all of it through one door — and so we can run it without six different subscriptions.</p>
    <div class="start-grid">
      <div class="start-card"><strong>8</strong><span>Chesed Cycles, ${CYCLES.reduce((a, c) => a + (c.weekPlan?.length || 0), 0)} weeks planned</span></div>
      <div class="start-card"><strong>8</strong><span>programmes a school can book</span></div>
      <div class="start-card"><strong>1</strong><span>place a teacher has to look</span></div>
    </div>
    <p class="start-note"><strong>About this demo.</strong> It runs entirely on this laptop, with no internet. The eight Chesed Cycles are real — they are JOC's own. <strong>Beth Jacob Academy is invented</strong>, and so is every name, message and figure attached to it, so that nothing here depends on a real school's data.</p>
  </div>`;
}

function sceneCycles() {
  const current = 2; // Cycle 3 is running in the demo's November
  const cards = CYCLES.map((c, i) => `
    <article class="cycle ${i === current ? "is-now" : ""}" style="--c:${c.color}">
      <div class="cycle-n">CYCLE ${i + 1}${i === current ? " · RUNNING NOW" : ""}</div>
      <h3>${esc(c.theme)}</h3>
      <p class="cycle-gloss">${esc(c.gloss)}</p>
      <p class="cycle-range">${esc(c.range)} · ${c.weeks} weeks · ${esc(c.hebrew)}</p>
      <p class="cycle-q">&ldquo;${esc(c.question)}&rdquo;</p>
    </article>`).join("");

  const c = CYCLES[current];
  const weeks = (c.weekPlan || []).map((w, i) => `
    <li><span class="wk">WEEK ${w.week ?? i + 1}</span><div><strong>${esc(w.title ?? "")}</strong>${w.detail ? `<p>${esc(w.detail)}</p>` : ""}</div></li>`).join("");

  return `
  <div class="cycles">${cards}</div>
  <div class="panel detail">
    <h3>Inside ${esc(c.theme)}</h3>
    <p class="detail-desc">${esc(c.desc)}</p>
    ${weeks ? `<ol class="weeks">${weeks}</ol>` : ""}
    ${c.focus?.length ? `<div class="focus"><div class="meta">WHAT A SCHOOL ACTUALLY DOES</div><ul>${c.focus.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>` : ""}
  </div>`;
}

function sceneSchool() {
  const rows = SCHOOL_PROGRAMS.map((p) => {
    const tone = p.status === "Running" ? [C.greenText, C.greenTint]
      : p.status === "Booked" ? [C.blue, C.blueTint] : [C.orangeText, C.orangeTint];
    return `<tr>
      <td><strong>${esc(p.name)}</strong><span class="sub">${esc(p.group)}</span></td>
      <td>${esc(p.when)}<span class="sub">${esc(p.where)}</span></td>
      <td><span class="chip" style="color:${tone[0]};background:${tone[1]}">${esc(p.status)}</span></td>
    </tr>`;
  }).join("");

  return `
  <div class="two">
    <div class="panel">
      <div class="panel-head">${icon("school", 22, C.greenText)}<h3>${esc(SCHOOL.name)}</h3><span class="meta">${esc(SCHOOL.place.toUpperCase())}</span></div>
      <div class="facts">
        <div><span class="meta">PLAN</span><strong>${esc(SCHOOL.plan)}</strong></div>
        <div><span class="meta">SEATS</span><strong>${SCHOOL.seats}</strong></div>
        <div><span class="meta">STUDENTS</span><strong>${SCHOOL.students}</strong></div>
        <div><span class="meta">WITH JOC SINCE</span><strong>${esc(SCHOOL.since)}</strong></div>
      </div>
      <div class="cycle-now">
        <span class="meta">THE CYCLE THIS SCHOOL IS IN</span>
        <strong>${esc(CYCLES[2].theme)}</strong>
        <p>${esc(CYCLES[2].gloss)} · ${esc(CYCLES[2].range)}</p>
      </div>
      <table class="tbl"><thead><tr><th>Programme</th><th>When</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="panel">
      <div class="panel-head">${icon("groups", 22, C.blue)}<h3>Who teaches it</h3></div>
      <ul class="people">
        ${SCHOOL_TEACHERS.map((t) => `<li><span class="av">${t.initial}</span><div><strong>${esc(t.name)}</strong><span class="sub">${esc(t.role)}</span></div></li>`).join("")}
      </ul>
      <div class="note">Every teacher here opens the same portal and sees the lesson for the week their school is on. Nobody is emailed a PDF.</div>
    </div>
  </div>`;
}

function sceneLesson() {
  return `
  <div class="panel lesson">
    <span class="meta">${esc(LESSON.cycle)} · ${esc(LESSON.theme.toUpperCase())}</span>
    <h3 class="lesson-title">${esc(LESSON.title)}</h3>
    <div class="lesson-facts">
      <span>${esc(LESSON.grade)}</span><span>${LESSON.minutes} minutes</span><span>Prep: ${esc(LESSON.prep)}</span>
    </div>
    <p class="lesson-desc">${esc(LESSON.description)}</p>
    <div class="two-in">
      <div>
        <div class="meta">BY THE END, STUDENTS CAN</div>
        <ul class="ticks">${LESSON.objectives.map((o) => `<li>${icon("check", 16, C.greenText)}<span>${esc(o)}</span></li>`).join("")}</ul>
        <div class="meta">YOU WILL NEED</div>
        <ul class="plain">${LESSON.materials.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
      </div>
      <div>
        <div class="meta">THE LESSON</div>
        <ol class="steps">${LESSON.steps.map((s) => `<li><div class="step-h"><strong>${esc(s.title)}</strong><span>${s.minutes} min</span></div><p>${esc(s.detail)}</p></li>`).join("")}</ol>
        <div class="meta">TO TALK ABOUT</div>
        <ul class="plain">${LESSON.discussion.map((d) => `<li>&ldquo;${esc(d)}&rdquo;</li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
}

function screenFrame(inner, label) {
  return `<div class="tvwrap"><div class="tv">${inner}</div><p class="tvcap">${esc(label)}</p></div>`;
}

function sceneSchoolScreen() {
  if (!HAS_SCREEN) return '<div class="note">school-screen.html is missing from this folder.</div>';
  return `
  <div class="tvwrap">
    <div class="tvscale"><iframe class="tvframe" title="The school hallway screen"
      src="${SCREEN_FILE}" loading="eager"></iframe></div>
    <p class="tvcap">The real screen, running. It sits in the school's entrance hall on an ordinary TV and updates itself — the photo, the shout-out, the grade totals and the schools along the bottom all come from the portal.
      <a class="tvlink" href="${SCREEN_FILE}" target="_blank" rel="noopener">Open it full-size &rarr;</a></p>
  </div>`;
}

function sceneLobbyScreen() {
  return screenFrame(`
    <div class="tv-head"><img src="data:image/png;base64,${logoWhite}" alt="" /><span class="tv-school">JOC Center</span></div>
    <div class="tv-body">
      <div class="tv-main"><div class="tv-cardhead">TODAY AT JOC</div>
        <div class="tv-now">
          <div class="tv-now-l"><span class="tv-badge">HAPPENING NOW</span><h4>Kindness Booth</h4><p>Beth Jacob Academy · 11th Grade</p><p class="tv-time">2:00 PM – 4:00 PM</p></div>
          <div class="tv-venue" style="background:${C.orangeText}">${icon("store", 30, "#fff")}<span>The Shuk</span></div>
        </div>
      </div>
      <div class="tv-side"><div class="tv-cardhead">COMING UP</div><ul class="tv-list">
        <li><span class="tv-date"><em>SUN</em><b>15</b></span><div><strong>Build A Bed</strong><span>LIEBERMAN FAMILY · 9:30 AM</span></div>${icon("pin", 20, C.blue)}</li>
        <li><span class="tv-date"><em>MON</em><b>16</b></span><div><strong>JOC App Forum</strong><span>PARTNER SCHOOLS · 10:30 AM</span></div>${icon("groups", 20, C.blue)}</li>
        <li><span class="tv-date"><em>TUE</em><b>17</b></span><div><strong>Chesed Packing</strong><span>MAAYANOT · 7:00 PM</span></div>${icon("flag", 20, C.greenText)}</li>
      </ul></div>
    </div>
    <div class="tv-foot">
      <div><b>[FIGURE]</b><span>Acts of chesed</span></div>
      <div><b>[FIGURE]</b><span>Beds given out</span></div>
      <div><b>[FIGURE]</b><span>Challahs baked</span></div>
      <div><b>[FIGURE]</b><span>Meals packed</span></div>
    </div>
    <div class="tv-ded">The counters are left blank on purpose — see the note under this screen.</div>`,
    "The TV in the JOC Center lobby. The impact figures are blank here because we have not yet agreed a verified source for them.");
}

function sceneDesk() {
  const tasks = DESK.tasks.map((t) => `
    <li class="task"><span class="tick"></span><div><strong>${esc(t.text)}</strong><span class="meta">${esc(t.meta)}</span></div><span class="x">&times;</span></li>`).join("");
  const handed = DESK.handed.map((h) => `
    <li class="task"><span class="av av-g">${h.initial}</span><div><strong>${esc(h.text)}</strong><span class="meta">${esc(h.who.toUpperCase())} · ${esc(h.status)}</span></div><span class="pill">Nudge ${esc(h.who)}</span></li>`).join("");
  const week = DESK.week.map((w) => `
    <li class="wkrow"><span class="dateblk ${w.today ? "is-today" : ""}"><em>${w.day}</em><b>${w.date}</b></span>
      <div><strong>${esc(w.title)}</strong><span class="meta">${esc(w.meta)}</span></div>
      ${icon(w.kind === "call" ? "call" : w.kind === "meeting" ? "groups" : "flag", 20, w.kind === "event" ? C.redText : C.blue)}</li>`).join("");
  const forYou = DESK.forYou.map((f) => `
    <li><span class="av">${esc(f.who.charAt(0))}</span><div><strong>${esc(f.who)}</strong> <span class="sub">${esc(f.verb)}</span>
      <p class="quote">&ldquo;${esc(f.quote)}&rdquo;</p><span class="meta">${esc(f.source)}</span>
      <div class="btnrow"><span class="btn">Add to my tasks</span><span class="btnq">Reply</span><span class="btnq">Clear</span></div></div></li>`).join("");

  return `
  <div class="band">
    <div>
      <span class="band-date">${esc(DESK.date)}</span>
      <h3>${esc(DESK.greeting)}, ${esc(DESK.who)}</h3>
      <p>${esc(DESK.recap)}</p>
    </div>
    <aside class="band-card">
      <span class="meta" style="color:${C.orangeText}">TODAY AT JOC</span>
      <div class="band-card-row">${icon("store", 26, C.orangeText)}<div><strong>${esc(DESK.todayAtJoc.title)}</strong><span class="meta">${esc(DESK.todayAtJoc.meta)}</span></div></div>
    </aside>
  </div>
  <div class="two desk">
    <div class="panel">
      <div class="panel-head">${icon("check", 22, C.blue)}<h3>Your list</h3><span class="meta">2 TODAY · 3 OPEN</span></div>
      <div class="addrow">${icon("home", 0)}<span class="addplus">+</span><span class="addtext">What do you need to do?</span><span class="seg"><b>Today</b><i>Later</i></span><span class="btn">Add</span></div>
      <div class="meta grp">TODAY · 2</div><ul class="tasks">${tasks}</ul>
      <div class="meta grp">WAITING ON OTHERS · 1</div><ul class="tasks">${handed}</ul>
      <div class="meta grp">Later · ${DESK.later} thing parked for another day</div>
    </div>
    <div class="side">
      <div class="panel green">
        <div class="panel-head">${icon("calendar", 22, C.greenText)}<h3>This week</h3><span class="meta">1 THING TODAY</span></div>
        <ul class="wklist">${week}</ul>
      </div>
      <div class="panel">
        <div class="panel-head">${icon("feed", 22, C.orangeText)}<h3>For you</h3><span class="meta">1 NEW</span></div>
        <ul class="foryou">${forYou}</ul>
      </div>
      <div class="panel note-pad">
        <div class="panel-head"><h3>Scratchpad</h3><span class="meta" style="color:${C.orangeText};margin-left:auto">ONLY YOU SEE THIS</span></div>
        <pre>${esc(DESK.scratchpad)}</pre>
      </div>
    </div>
  </div>`;
}

function sceneOffice() {
  const items = OFFICE.map((o) => `
    <article class="buzz">
      <div class="buzz-h"><strong>${esc(o.school)}</strong><span class="meta">${esc(o.ago)} · ${esc(o.kind)} · ${esc(o.program.toUpperCase())}</span></div>
      <div class="sub">by ${esc(o.by)}</div>
      <p>${esc(o.body)}</p>
      <div class="buzz-f"><span class="btnq">Move to my desk</span><span class="btnq">&#128077; ${o.likes}</span><span class="btnq">Comments ${o.comments}</span><span class="btnq">&#10003; Done for me</span></div>
    </article>`).join("");
  return `<div class="panel"><div class="panel-head">${icon("feed", 22, C.blue)}<h3>The Office</h3><span class="meta">3 THIS WEEK</span></div>${items}</div>
  <div class="note">Anyone at JOC can see every school's story in one feed, comment on it, and take a job off it onto their own desk. Nothing lives in one person's inbox.</div>`;
}

function sceneBoard() {
  const rows = BOARD.map((b) => {
    const tone = b.status === "Active" ? [C.greenText, C.greenTint]
      : b.status === "Contacted" ? [C.blue, C.blueTint] : [C.muted, C.segment];
    return `<tr>
      <td><strong>${esc(b.school)}</strong><span class="sub">${esc(b.place)}</span></td>
      <td><span class="chip" style="color:${tone[0]};background:${tone[1]}">${esc(b.status)}</span></td>
      <td>${b.plan ? esc(b.plan) : '<span class="absent">No plan yet</span>'}</td>
      <td>${b.seats ?? '<span class="absent">—</span>'}</td>
      <td>${b.contact ? esc(b.contact) : '<span class="absent">Nobody named</span>'}</td>
      <td class="meta">${esc(b.last.toUpperCase())}</td>
    </tr>`;
  }).join("");
  return `<div class="panel"><div class="panel-head">${icon("board", 22, C.greenText)}<h3>Every school, on one board</h3><span class="meta">6 OF 43 SHOWN</span></div>
    <table class="tbl wide"><thead><tr><th>School</th><th>Status</th><th>Plan</th><th>Seats</th><th>Who we speak to</th><th>Last contact</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="note">This is the board that replaced Monday.com. The columns, the statuses and the weekly checks are ours to change, and it is the same data the school's own page reads.</div>`;
}

function sceneForm() {
  const fields = FORM.fields.map((f) => `
    <label class="fld"><span>${esc(f.label)}</span>${
      f.type === "textarea" ? `<textarea rows="2" readonly>${esc(f.value)}</textarea>`
      : `<input value="${esc(f.value)}" readonly />`}</label>`).join("");
  return `
  <div class="two">
    <div class="panel">
      <div class="panel-head">${icon("form", 22, C.blue)}<h3>${esc(FORM.program)}</h3></div>
      <p class="lesson-desc">${esc(FORM.blurb)}</p>
      <div class="formgrid">${fields}</div>
      <div class="formfoot"><span class="meta">${esc(FORM.fee.toUpperCase())}</span><span class="btn big">Book it</span></div>
    </div>
    <div class="panel phone-panel">
      <div class="panel-head">${icon("phone", 22, C.orangeText)}<h3>And from our side</h3></div>
      <p class="lesson-desc">After a visit, anyone at JOC fills this in from their phone in about thirty seconds. It becomes that school's permanent history — no one has to write it up later.</p>
      <div class="phone">
        <div class="ph-h">JOC School Update Form</div>
        <div class="ph-seg"><b>Interaction</b><i>Event</i></div>
        <label class="fld"><span>School</span><input value="Beth Jacob Academy" readonly /></label>
        <label class="fld"><span>Who you spoke to</span><input value="Mrs. Shira Feldman" readonly /></label>
        <label class="fld"><span>What was said</span><textarea rows="3" readonly>They want the booth twice this cycle. Asked about adding 10th grade.</textarea></label>
        <div class="ph-btn">Send it in</div>
      </div>
    </div>
  </div>`;
}

/* ───────────────────────────────── page ──────────────────────────────── */

const SCENES = [
  ["start", "Just One Chesed", "Start here.", sceneStart()],
  ["cycles", "The Chesed Cycle", "Eight themes across the school year. This is the idea the whole portal is built around.", sceneCycles()],
  ["school", "A school's own page", "What Beth Jacob Academy sees when they sign in.", sceneSchool()],
  ["lesson", "A lesson, as a teacher opens it", "Tied to the week the school is on. No PDF, no email.", sceneLesson()],
  ["form", "How a school says yes", "The sign-up form, and the phone form we fill in afterwards.", sceneForm()],
  ["screen", "The school's hallway screen", "A TV in the school's entrance, showing their own chesed.", sceneSchoolScreen()],
  ["lobby", "The JOC Center screen", "The same software, running in our own lobby.", sceneLobbyScreen()],
  ["desk", "A JOC staff desk", "What one of our coordinators opens every morning.", sceneDesk()],
  ["office", "The school-by-school feed", "Every school's story in one place, for the whole team.", sceneOffice()],
  ["board", "One board, not six subscriptions", "The system that replaced Monday, Jotform and a shared calendar.", sceneBoard()],
];

const nav = SCENES.map(([id, title], i) =>
  `<button class="navitem" data-go="${id}"><span class="navnum">${i === 0 ? "" : i}</span>${esc(title)}</button>`).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Just One Chesed — the Educators Portal</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Newsreader:ital,wght@0,400;1,400&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet" />
<style>
  :root{
    --ink:${C.ink};--paper:${C.paper};--white:${C.white};--panel:${C.panel};
    --blue:${C.blue};--blueTint:${C.blueTint};--orange:${C.orange};--orangeText:${C.orangeText};
    --orangeTint:${C.orangeTint};--green:${C.green};--greenText:${C.greenText};--greenTint:${C.greenTint};
    --redText:${C.redText};--redTint:${C.redTint};--muted:${C.muted};--faint:${C.faint};
    --outline:${C.outline};--hairline:${C.hairline};--rule:${C.rule};--segment:${C.segment};
    --ui:'Outfit',system-ui,-apple-system,'Segoe UI',sans-serif;
    --read:'Newsreader',Georgia,serif;
    --mono:'IBM Plex Mono',ui-monospace,Consolas,monospace;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--ui);-webkit-font-smoothing:antialiased}
  .app{display:flex;min-height:100vh}
  .rail{width:244px;flex:0 0 244px;background:${C.onDarkBody};padding:22px 12px;display:flex;flex-direction:column;gap:3px;position:sticky;top:0;height:100vh;overflow:auto}
  .rail img{height:22px;width:auto;max-width:100%;margin:0 8px 16px}
  .navitem{display:flex;align-items:center;gap:10px;min-height:46px;padding:0 12px;border:0;border-radius:12px;background:transparent;color:var(--ink);font:500 15px/1.25 var(--ui);text-align:left;cursor:pointer;width:100%}
  .navitem:hover{background:rgba(255,255,255,.55)}
  .navitem.on{background:#fff;font-weight:700}
  .navnum{font:600 11px/1 var(--mono);color:var(--faint);min-width:14px}
  .main{flex:1;min-width:0;padding:34px 40px 64px;max-width:1280px}
  .scene-head h2{font:700 30px/1.1 var(--ui);letter-spacing:-.02em;margin:0}
  .scene-head p{font:400 18px/1.5 var(--read);color:var(--muted);margin:6px 0 24px;max-width:70ch}
  .foot{display:flex;justify-content:space-between;gap:12px;margin-top:34px;padding-top:18px;border-top:1px solid var(--hairline)}
  .foot button{min-height:46px;padding:0 18px;border-radius:12px;border:1px solid var(--outline);background:#fff;color:var(--blue);font:600 15px var(--ui);cursor:pointer}
  .foot button.next{background:var(--blue);color:#fff;border-color:var(--blue)}
  .meta{font:500 11px/1.35 var(--mono);letter-spacing:.04em;color:var(--faint)}
  .sub{display:block;font:400 13px/1.3 var(--ui);color:var(--muted)}
  .panel{background:#fff;border-radius:20px;box-shadow:0 2px 0 var(--hairline),0 6px 18px rgba(16,35,63,.05);padding:24px;margin-bottom:20px}
  .panel.green{background:var(--greenTint);box-shadow:0 2px 0 #C9E6D2}
  .panel-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .panel-head h3{font:700 22px/1.2 var(--ui);letter-spacing:-.02em;margin:0}
  .panel-head .meta{margin-left:auto}
  .note{background:var(--blueTint);border-radius:14px;padding:14px 18px;font:400 17px/1.55 var(--read);color:var(--ink)}
  .two{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;align-items:start}
  .two-in{display:grid;grid-template-columns:1fr 1.2fr;gap:28px;margin-top:8px}
  /* start */
  .start{max-width:860px}
  .start-logo{height:34px;margin-bottom:28px}
  .start h1{font:800 46px/1.06 var(--ui);letter-spacing:-.03em;margin:0 0 16px}
  .start-lede{font:400 21px/1.55 var(--read);color:var(--muted);margin:0 0 28px}
  .start-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:26px}
  .start-card{background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 2px 0 var(--hairline)}
  .start-card strong{display:block;font:800 38px/1 var(--ui);color:var(--blue)}
  .start-card span{display:block;font:400 15px/1.4 var(--ui);color:var(--muted);margin-top:6px}
  .start-note{background:var(--orangeTint);border-radius:14px;padding:16px 20px;font:400 16px/1.6 var(--read);color:var(--ink)}
  /* cycles */
  .cycles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
  .cycle{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 0 var(--hairline);border-top:4px solid var(--c)}
  .cycle.is-now{box-shadow:0 0 0 2px var(--blue),0 6px 18px rgba(16,35,63,.08)}
  .cycle-n{font:600 10px/1 var(--mono);letter-spacing:.08em;color:var(--c)}
  .cycle h3{font:700 19px/1.2 var(--ui);margin:8px 0 2px;letter-spacing:-.02em}
  .cycle-gloss{font:400 15px/1.4 var(--read);color:var(--muted);margin:0 0 8px}
  .cycle-range{font:500 10.5px/1.3 var(--mono);color:var(--faint);margin:0 0 8px}
  .cycle-q{font:italic 400 15px/1.45 var(--read);color:var(--ink);margin:0}
  .detail h3{font:700 24px/1.2 var(--ui);margin:0 0 8px}
  .detail-desc{font:400 18px/1.6 var(--read);color:var(--muted);margin:0 0 18px;max-width:78ch}
  .weeks{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:10px}
  .weeks li{display:flex;gap:14px;align-items:flex-start;border-top:1px solid var(--rule);padding-top:10px}
  .wk{font:600 10.5px/1.6 var(--mono);color:var(--faint);flex:0 0 62px}
  .weeks strong{font:600 16px/1.35 var(--ui)}
  .weeks p{font:400 16px/1.5 var(--read);color:var(--muted);margin:3px 0 0}
  .focus ul{margin:8px 0 0;padding-left:20px}
  .focus li{font:400 16px/1.6 var(--read);color:var(--ink)}
  /* school */
  .facts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
  .facts strong{display:block;font:700 20px/1.2 var(--ui);margin-top:3px}
  .cycle-now{background:var(--blueTint);border-radius:14px;padding:14px 16px;margin-bottom:16px}
  .cycle-now strong{display:block;font:700 20px/1.2 var(--ui);margin-top:4px}
  .cycle-now p{font:400 16px/1.4 var(--read);color:var(--muted);margin:3px 0 0}
  .tbl{width:100%;border-collapse:collapse}
  .tbl th{text-align:left;font:500 11px/1.4 var(--mono);letter-spacing:.04em;color:var(--faint);padding:0 10px 8px 0;border-bottom:1px solid var(--hairline)}
  .tbl td{padding:12px 10px 12px 0;border-bottom:1px solid var(--rule);font:500 16px/1.35 var(--ui);vertical-align:top}
  .tbl.wide td,.tbl.wide th{padding-right:16px}
  .chip{display:inline-block;border-radius:9999px;padding:4px 11px;font:600 13px/1.3 var(--ui);white-space:nowrap}
  .absent{color:var(--faint);font-weight:400}
  .people{list-style:none;margin:0;padding:0;display:grid;gap:10px}
  .people li{display:flex;gap:12px;align-items:center}
  .av{width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:var(--blueTint);color:var(--blue);display:flex;align-items:center;justify-content:center;font:700 15px var(--ui)}
  .av-g{background:var(--greenTint);color:var(--greenText)}
  /* lesson */
  .lesson-title{font:700 30px/1.15 var(--ui);letter-spacing:-.02em;margin:6px 0 10px}
  .lesson-facts{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
  .lesson-facts span{background:var(--segment);border-radius:9999px;padding:5px 12px;font:600 13px var(--ui);color:var(--muted)}
  .lesson-desc{font:400 18px/1.6 var(--read);color:var(--muted);margin:0 0 18px;max-width:72ch}
  .ticks,.plain{list-style:none;margin:8px 0 20px;padding:0;display:grid;gap:8px}
  .ticks li{display:flex;gap:9px;align-items:flex-start;font:400 17px/1.5 var(--read)}
  .plain li{font:400 17px/1.5 var(--read);color:var(--ink);padding-left:16px;position:relative}
  .plain li:before{content:"";position:absolute;left:0;top:11px;width:5px;height:5px;border-radius:50%;background:var(--outline)}
  .steps{list-style:none;margin:8px 0 20px;padding:0;counter-reset:s;display:grid;gap:14px}
  .steps li{counter-increment:s;border-left:3px solid var(--blueTint);padding-left:14px}
  .step-h{display:flex;align-items:baseline;gap:10px}
  .step-h strong{font:700 17px/1.3 var(--ui)}
  .step-h span{font:500 11px var(--mono);color:var(--faint)}
  .steps p{font:400 16px/1.55 var(--read);color:var(--muted);margin:4px 0 0}
  /* TV */
  .tvwrap{max-width:1100px}
  .tvscale{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(16,35,63,.22);background:#0b2a6b}
  .tvframe{position:absolute;top:0;left:0;width:1920px;height:1080px;border:0;transform-origin:top left}
  .tv{aspect-ratio:16/9;background:${C.blue};border-radius:18px;padding:22px 26px;color:#fff;display:flex;flex-direction:column;gap:14px;box-shadow:0 18px 40px rgba(16,35,63,.22)}
  .tvcap{font:400 17px/1.5 var(--read);color:var(--muted);margin:14px 0 0}
  .tvlink{display:inline-block;margin-left:6px;font:600 15px var(--ui);color:var(--blue);text-decoration:none;min-height:44px;line-height:44px}
  .tv-head{display:flex;align-items:center;justify-content:space-between}
  .tv-head img{height:22px}
  .tv-school{font:700 17px var(--ui);color:${C.onDarkBody}}
  .tv-body{flex:1;display:grid;grid-template-columns:1.5fr 1fr;gap:14px;min-height:0}
  .tv-main,.tv-side{background:rgba(255,255,255,.96);border-radius:14px;padding:14px 16px;color:var(--ink);overflow:hidden}
  .tv-cardhead{font:600 11px/1 var(--mono);letter-spacing:.1em;color:var(--blue);margin-bottom:10px}
  .tv-now{display:flex;gap:14px;align-items:center}
  .tv-badge{display:inline-block;background:var(--orange);color:var(--ink);border-radius:9999px;padding:3px 10px;font:700 10px/1.4 var(--mono);letter-spacing:.06em}
  .tv-now h4{font:800 30px/1.08 var(--ui);letter-spacing:-.02em;margin:8px 0 2px}
  .tv-now p{font:600 16px/1.3 var(--ui);color:var(--blue);margin:0}
  .tv-time{font:500 14px var(--mono)!important;color:var(--muted)!important;margin-top:6px!important}
  .tv-venue{margin-left:auto;border-radius:12px;padding:14px;min-width:116px;display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff}
  .tv-venue span{font:700 12px/1.25 var(--ui);text-align:center}
  .tv-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .tv-list li{display:flex;gap:10px;align-items:center}
  .tv-date{flex:0 0 40px;background:var(--segment);border-radius:9px;padding:4px 0;text-align:center}
  .tv-date em{display:block;font:600 9px/1 var(--mono);color:var(--faint);font-style:normal}
  .tv-date b{display:block;font:800 17px/1.1 var(--ui)}
  .tv-list strong{display:block;font:700 14px/1.2 var(--ui)}
  .tv-list span{font:500 9.5px/1.3 var(--mono);color:var(--faint)}
  .tv-foot{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:10px}
  .tv-foot div{background:rgba(255,255,255,.96);border-radius:12px;padding:10px 12px;color:var(--ink)}
  .tv-foot b{display:block;font:800 24px/1 var(--ui);color:var(--blue)}
  .tv-foot span{font:500 10px var(--mono);color:var(--faint)}
  .tv-ded{font:400 12px/1.4 var(--read);color:${C.onDarkBody};text-align:center}
  /* desk */
  .band{background:var(--blue);border-radius:20px;color:#fff;padding:24px 28px;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:28px;align-items:center;margin-bottom:22px}
  .band-date{font:500 12px var(--mono);letter-spacing:.1em;color:${C.onDarkLabel}}
  .band h3{font:800 36px/1.05 var(--ui);letter-spacing:-.03em;margin:8px 0 0}
  .band p{font:400 18px/1.5 var(--read);color:${C.onDarkBody};margin:7px 0 0}
  .band-card{background:var(--orangeTint);border-radius:16px;padding:16px 18px;color:var(--ink)}
  .band-card-row{display:flex;gap:11px;align-items:center;margin-top:8px}
  .band-card-row strong{display:block;font:600 16px/1.3 var(--ui)}
  .desk .side{display:grid;gap:20px}
  .addrow{display:flex;align-items:center;gap:10px;background:var(--panel);border:1.5px solid var(--outline);border-radius:16px;padding:8px 8px 8px 16px;margin-bottom:6px}
  .addplus{font:400 24px/1 var(--ui);color:var(--blue)}
  .addtext{flex:1;font:500 17px var(--ui);color:var(--faint)}
  .seg{display:flex;background:var(--segment);border-radius:8px;padding:3px;gap:2px}
  .seg b{background:#fff;border-radius:6px;padding:7px 12px;font:600 14px var(--ui)}
  .seg i{padding:7px 12px;font:500 14px var(--ui);color:var(--faint);font-style:normal}
  .btn{background:var(--blue);color:#fff;border-radius:10px;padding:11px 18px;font:700 15px var(--ui);white-space:nowrap}
  .btn.big{padding:14px 26px;font-size:16px}
  .btnq{color:var(--blue);font:600 14px var(--ui);padding:8px 10px;white-space:nowrap}
  .grp{display:block;padding:14px 0 6px}
  .tasks{list-style:none;margin:0;padding:0}
  .task{display:flex;gap:12px;align-items:center;border-top:1px solid var(--rule);padding:12px 0;min-height:64px}
  .task strong{display:block;font:500 18px/1.35 var(--ui)}
  .tick{width:30px;height:30px;flex:0 0 30px;border-radius:50%;border:2px solid ${C.outline}}
  .x{color:var(--muted);font-size:20px;margin-left:auto;padding-left:10px}
  .pill{margin-left:auto;background:var(--blueTint);color:var(--blue);border-radius:9999px;padding:10px 16px;font:600 15px var(--ui);white-space:nowrap}
  .wklist{list-style:none;margin:0;padding:0;display:grid;gap:4px}
  .wkrow{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:14px;align-items:center;padding:7px 0}
  .dateblk{background:#fff;border-radius:12px;padding:6px 0;text-align:center}
  .dateblk.is-today{background:var(--blue);color:#fff}
  .dateblk em{display:block;font:600 10px/1 var(--mono);font-style:normal;color:var(--faint)}
  .dateblk.is-today em{color:#fff}
  .dateblk b{display:block;font:700 22px/1.1 var(--ui)}
  .wkrow strong{display:block;font:600 17px/1.3 var(--ui)}
  .foryou{list-style:none;margin:0;padding:0}
  .foryou li{display:flex;gap:12px}
  .quote{font:400 17px/1.45 var(--read);margin:4px 0 6px}
  .btnrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px}
  .note-pad{background:var(--orangeTint);transform:rotate(-.6deg);box-shadow:0 2px 0 #FFD8AE,0 10px 24px rgba(168,91,0,.12)}
  .note-pad pre{font:400 18px/1.6 var(--read);white-space:pre-wrap;margin:0;color:var(--ink)}
  /* office */
  .buzz{border-top:1px solid var(--rule);padding:16px 0}
  .buzz-h{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  .buzz-h strong{font:600 18px var(--ui)}
  .buzz p{font:400 17px/1.55 var(--read);margin:8px 0 10px;max-width:76ch}
  .buzz-f{display:flex;gap:6px;flex-wrap:wrap}
  /* forms */
  .formgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0 18px}
  .fld span{display:block;font:600 14px var(--ui);margin-bottom:5px}
  .fld input,.fld textarea{width:100%;font:500 16px var(--ui);color:var(--ink);background:#fff;border:1px solid var(--outline);border-radius:10px;padding:12px 13px;font-family:var(--ui)}
  .formfoot{display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid var(--rule);padding-top:16px}
  .phone{background:var(--paper);border:10px solid var(--ink);border-radius:28px;padding:16px 14px;max-width:320px;margin-top:14px}
  .ph-h{font:700 19px var(--ui);margin-bottom:12px}
  .ph-seg{display:flex;gap:6px;margin-bottom:12px}
  .ph-seg b{flex:1;text-align:center;background:var(--ink);color:#fff;border-radius:10px;padding:11px;font:600 14px var(--ui)}
  .ph-seg i{flex:1;text-align:center;background:#fff;border:1px solid var(--outline);border-radius:10px;padding:11px;font:500 14px var(--ui);font-style:normal}
  .phone .fld{margin-bottom:10px}
  .ph-btn{background:var(--blue);color:#fff;border-radius:12px;padding:14px;text-align:center;font:700 16px var(--ui);margin-top:4px}
  @media print{.rail,.foot{display:none}.main{max-width:none;padding:0}.scene{display:block!important;page-break-after:always}}
  @media (max-width:1100px){.two,.two-in,.formgrid,.band{grid-template-columns:1fr}.cycles{grid-template-columns:repeat(2,1fr)}.facts{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:860px){
    .app{flex-direction:column}
    .rail{width:auto;flex:none;height:auto;position:static;flex-direction:row;overflow-x:auto;gap:6px;padding:12px}
    .rail img{display:none}
    .navitem{width:auto;white-space:nowrap}
    .main{padding:20px 16px 48px}
    .start h1{font-size:32px}.start-grid{grid-template-columns:1fr}
    .cycles{grid-template-columns:1fr}
    .tv{aspect-ratio:auto}.tv-body{grid-template-columns:1fr}
    .band h3{font-size:28px}
    input,textarea,select{font-size:16px!important}
  }
</style>
</head>
<body>
<div class="app">
  <nav class="rail">
    <img src="data:image/png;base64,${logo}" alt="Just One Chesed" />
    ${nav}
  </nav>
  <main class="main">
    ${SCENES.map(([id, title, caption, body]) => scene(id, title, caption, body)).join("")}
    <div class="foot">
      <button id="prev">&larr; Back</button>
      <button id="next" class="next">Next &rarr;</button>
    </div>
  </main>
</div>
<script>
  var ids = ${JSON.stringify(SCENES.map((s) => s[0]))};
  var at = 0;
  function show(i) {
    at = Math.max(0, Math.min(ids.length - 1, i));
    ids.forEach(function (id, n) {
      document.getElementById(id).hidden = n !== at;
    });
    var btns = document.querySelectorAll(".navitem");
    btns.forEach(function (b, n) { b.classList.toggle("on", n === at); });
    document.getElementById("prev").style.visibility = at === 0 ? "hidden" : "visible";
    document.getElementById("next").style.visibility = at === ids.length - 1 ? "hidden" : "visible";
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".navitem").forEach(function (b) {
    b.addEventListener("click", function () { show(ids.indexOf(b.dataset.go)); });
  });
  document.getElementById("prev").addEventListener("click", function () { show(at - 1); });
  document.getElementById("next").addEventListener("click", function () { show(at + 1); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") show(at + 1);
    if (e.key === "ArrowLeft" || e.key === "PageUp") show(at - 1);
  });
  function fitScreens() {
    document.querySelectorAll(".tvscale").forEach(function (box) {
      var frame = box.querySelector(".tvframe");
      if (frame) frame.style.transform = "scale(" + box.clientWidth / 1920 + ")";
    });
  }
  window.addEventListener("resize", fitScreens);
  var _show = show;
  show = function (i) { _show(i); setTimeout(fitScreens, 0); };

  show(0);
  fitScreens();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(here, "JOC-demo.html"), html);
const kb = (fs.statSync(path.join(here, "JOC-demo.html")).size / 1024).toFixed(0);
console.log(`demo/JOC-demo.html written — ${kb} KB, ${SCENES.length} scenes, no network needed`);
