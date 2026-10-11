import type { ScreenFlyer, ScreenPhoto, ScreenShoutOut } from "./types";
import { eventTitleSize, gradeTiles, SCREEN_TZ } from "./rules";

/**
 * The school screen's HTML, as strings.
 *
 * One builder for the TV and for the editors' flyer preview, so what somebody
 * sees while making a flyer is exactly what goes on the wall. Every class is
 * prefixed ss- so the preview can sit inside the portal without the screen's
 * stylesheet touching anything else. The values come from
 * design/JOC School Screen v6.dc.html.
 */

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
}

const ms = (name: string, cls = "") => `<span class="ss-ms ${cls}">${esc(name)}</span>`;

/** Only our own image routes and https images reach a src attribute. */
function src(url: string | null | undefined): string {
  if (!url) return "";
  return /^(https:\/\/|\/api\/school-screen\/image\/)/.test(url) ? esc(url) : "";
}

/** The QR is SVG we drew ourselves on the server; it goes in as it is. */
function qr(svg: string | null | undefined): string {
  return svg && svg.trimStart().startsWith("<svg") ? svg : "";
}

function dateParts(iso: string | null): { dow: string; day: string; mon: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: SCREEN_TZ, ...o }).format(d);
  return { dow: f({ weekday: "short" }), day: f({ day: "numeric" }), mon: f({ month: "short" }) };
}

/** Split a title so the last word is the big one: JUST ONE / TUTOR. */
function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return ["", title.trim()];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}

const dots = `<div class="ss-dot ss-dot-a"></div><div class="ss-dot ss-dot-b"></div>`;

/* ------------------------------------------------------------- slides ---- */

export function photoSlideHTML(p: ScreenPhoto): string {
  return `<div class="ss-photo"><img src="${src(p.imageUrl)}" alt="" /></div>`;
}

export function eventFlyerHTML(f: ScreenFlyer, short: string): string {
  const d = dateParts(f.startsAt);
  const size = eventTitleSize(f.title);
  return `<div class="ss-fl ss-fl-event">
  <div class="ss-fl-img">${f.imageUrl ? `<img src="${src(f.imageUrl)}" alt="" />` : ""}</div>
  ${d ? `<div class="ss-sticker"><div class="ss-st-dow">${esc(d.dow)}</div><div class="ss-st-day">${esc(d.day)}</div><div class="ss-st-mon">${esc(d.mon)}</div></div>` : ""}
  ${f.ambassadors ? `<div class="ss-amb"><div class="ss-amb-ic">${ms("waving_hand")}</div><div><div class="ss-amb-k">Ask our ambassadors</div><div class="ss-amb-n">${esc(f.ambassadors)}</div></div></div>` : ""}
  <div class="ss-fl-panel">
    ${dots}
    <div class="ss-kicker">${ms("celebration")}${esc(f.line || `Coming up at ${short}`)}</div>
    <div class="ss-ev-title" style="font-size:${size}px">${esc(f.title)}</div>
    <div class="ss-bar"></div>
    <div class="ss-pills">
      ${f.time ? `<div class="ss-pill">${ms("schedule")}${esc(f.time)}</div>` : ""}
      ${f.place ? `<div class="ss-pill">${ms("location_on")}${esc(f.place)}</div>` : ""}
    </div>
    ${f.qrSvg ? `<div class="ss-ev-qr">${qr(f.qrSvg)}</div>` : ""}
  </div>
</div>`;
}

/**
 * Template B. Orange or blue, alternating, so two program flyers in a row
 * never look like one flyer that failed to change.
 */
export function programFlyerHTML(f: ScreenFlyer, blue: boolean): string {
  const [small, big] = splitTitle(f.title);
  const d = dateParts(f.startsAt);
  return `<div class="ss-fl ss-fl-program ${blue ? "ss-blue" : "ss-orange"}">
  <div class="ss-bubble"></div><div class="ss-bubble-2"></div>
  ${d ? `<div class="ss-sticker ss-sticker-sm"><div class="ss-st-k">${esc(f.line && f.line.length <= 10 ? f.line : "Starts")}</div><div class="ss-st-big">${esc(`${d.mon} ${d.day}`)}</div></div>` : ""}
  <div class="ss-pg-icon">${ms(f.icon || "volunteer_activism")}</div>
  <div class="ss-pg-title">${small ? `<div class="ss-pg-small">${esc(small)}</div>` : ""}<div class="ss-pg-big">${esc(big)}</div></div>
  ${f.line && !(d && f.line.length <= 10) ? `<div class="ss-pg-line">${esc(f.line)}</div>` : ""}
  ${f.qrSvg ? `<div class="ss-pg-qr"><div class="ss-pg-qr-l">${esc(f.qrLabel || "Scan to join")}</div><div class="ss-qrbox">${qr(f.qrSvg)}</div></div>` : ""}
</div>`;
}

/** Template C: finished artwork shown whole, never covered by a sticker. */
export function bannerFlyerHTML(f: ScreenFlyer): string {
  const [small, big] = splitTitle(f.title);
  return `<div class="ss-fl ss-fl-banner">
  <div class="ss-bn-img">${f.imageUrl ? `<img src="${src(f.imageUrl)}" alt="" />` : ""}</div>
  <div class="ss-bn-panel">
    ${dots}
    <div class="ss-bn-grid">
      <div class="ss-bn-text">
        <div class="ss-kicker">${ms("celebration")}${esc(f.line || "Join the team")}</div>
        <div class="ss-bn-title">${small ? `<div class="ss-bn-small">${esc(small)}</div>` : ""}<div class="ss-bn-big">${esc(big)}</div></div>
      </div>
      ${f.qrSvg ? `<div class="ss-bn-qr"><div class="ss-qrbox ss-qrbox-w">${qr(f.qrSvg)}</div><div class="ss-bn-qr-l">${esc(f.qrLabel || "Scan to join")}</div></div>` : ""}
    </div>
    <div class="ss-pills">
      ${f.time ? `<div class="ss-pill">${ms("schedule")}${esc(f.time)}</div>` : ""}
      ${f.place ? `<div class="ss-pill">${ms("location_on")}${esc(f.place)}</div>` : ""}
    </div>
  </div>
</div>`;
}

export function flyerHTML(f: ScreenFlyer, short: string, programIndex = 0): string {
  if (f.template === "EVENT") return eventFlyerHTML(f, short);
  if (f.template === "BANNER") return bannerFlyerHTML(f);
  return programFlyerHTML(f, programIndex % 2 === 1);
}

/** The white plate over a photo: "{SHORT} students in action", dots, caption. */
export function captionHTML(short: string, caption: string, index: number, total: number): string {
  const d = Array.from({ length: total }, (_, i) => `<div class="ss-cdot${i === index ? " on" : ""}"></div>`).join("");
  return `<div class="ss-cap-head"><div class="ss-cap-k">${ms("photo_camera")}${esc(short)} students in action</div><div class="ss-cdots">${d}</div></div>
<div class="ss-cap-t">${esc(caption)}</div>`;
}

/* ------------------------------------------------------------ the cards -- */

export function shoutHTML(post: ScreenShoutOut, topic: string | null): string {
  const size = post.text.length > 95 ? 34 : 40;
  return `<div class="ss-so-head">
  <div class="ss-so-k">${ms("campaign")}Chesed shout-out</div>
  ${topic ? `<div class="ss-so-topic">${ms("today")}${esc(topic)}</div>` : ""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${size}px">“${esc(post.text)}”</div>
  ${post.from ? `<div class="ss-so-from">${esc(post.from)}</div>` : ""}
</div>`;
}

/** No shout-out approved yet: the card asks for the first one instead. */
export function shoutEmptyHTML(topic: string | null): string {
  return `<div class="ss-so-head">
  <div class="ss-so-k">${ms("campaign")}Chesed shout-out</div>
  ${topic ? `<div class="ss-so-topic">${ms("today")}${esc(topic)}</div>` : ""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">Who made a difference to you this week?</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`;
}

export function gradesHTML(month: string, goal: number, rows: { label: string; hours: number }[]): string {
  const tiles = gradeTiles(rows, goal);
  const total = tiles.reduce((a, t) => a + t.hours, 0);
  const n = (x: number) => x.toLocaleString("en-US");
  return `<div class="ss-gr-head">
  <div class="ss-gr-k">${ms("flag")}${esc(month)} goal: ${n(goal)} hours per grade</div>
  <div class="ss-gr-total"><div class="ss-gr-num">${n(total)}</div><div class="ss-gr-of">of ${n(goal * tiles.length)} hours</div></div>
</div>
<div class="ss-gr-tiles">${tiles.map((t) => `<div class="ss-tile${t.reached ? " on" : ""}">
  <div class="ss-tile-h"><div class="ss-tile-l">${esc(t.label)}</div>${t.reached ? ms("rocket_launch") : ""}</div>
  <div class="ss-tile-n">${n(t.hours)}</div>
  <div class="ss-tile-s">${t.reached ? `Bonus round · +${n(t.over)}` : "hours"}</div>
</div>`).join("")}</div>`;
}

export function marqueeHTML(network: { name: string; hours: number }[], seconds = 40): string {
  if (network.length === 0) return "";
  const card = (s: { name: string; hours: number }) =>
    `<div class="ss-mq-card"><div class="ss-mq-name">${esc(s.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${s.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;
  // Twice over, and the animation runs to -50%: the second copy is where the
  // first began, so the loop has no seam.
  return `<div class="ss-mq-track" style="animation-duration:${seconds}s">${[...network, ...network].map(card).join("")}</div>`;
}
