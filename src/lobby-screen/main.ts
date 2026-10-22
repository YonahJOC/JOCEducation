import { hebrewDate } from '@/lib/hebrew-date';
import './screen.css';
import type { LobbyScreenData } from '@/lib/lobby/screen-data';
import { esc, marqueeHTML } from '@/lib/school-screen/markup';
import { lobbyShoutHTML, programSlideHTML, standingSlideHTML, tilesHTML } from '@/lib/lobby/screen-markup';
import { dayKey } from '@/lib/school-screen/rules';

/**
 * The JOC lobby screen: the TV in this building's entrance.
 *
 * A copy of the school live screen (src/school-screen/main.ts), rewired to
 * the lobby's own data. The wall here and the wall in a school are meant to
 * look like one organisation, so the shape is not reinvented — it is the
 * same canvas, the same classes and the same stylesheet, with three slots
 * filled differently: the slideshow shows the JOC diary rather than flyers,
 * and the grade tiles show hours, beds and pizzas. The shout-out card is a
 * school's, unchanged — anybody can send one to this wall too.
 *
 * Nothing under src/school-screen or src/lib/school-screen is touched by
 * any of it; thirty schools' screens read those.
 *
 * It runs unattended on a
 * stick behind a television for months, so it is a few kilobytes of vanilla
 * script with none of the site anywhere near it. It keeps the last good data
 * through a network drop (a small dot says so), reloads itself at 3am, and
 * works out its own scale from the window on every render.
 */

const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const DEBUG = params.has('debug');


const POLL_MS = 5 * 60_000;
const SLIDE_MS = 8_000;
const CACHE = 'joc-lobby-screen';
const loadedAt = Date.now();

const state = {
  data: null as LobbyScreenData | null,
  etag: '' as string,
  fetchedAt: null as Date | null,
  offline: false,
  error: '' as string,
  slide: 0,
  shout: 0,
  countFrom: 0,
};

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

document.getElementById('app')!.innerHTML = `
<div class="ss-stage">
  <div class="ss-canvas" id="canvas">
    <div class="ss-hdr">
      <div class="ss-logo" id="logo"></div>
      <div class="ss-name"><div class="ss-name-t" id="name"></div><div class="ss-name-s" id="stats"></div></div>
      <div class="ss-ded" id="ded"></div>
      <div class="ss-clock-box"><div class="ss-clock" id="clock"></div><div class="ss-date" id="date"></div><div class="ss-hdate" id="hdate"></div></div>
    </div>
    <div class="ss-mid" id="mid">
      <div class="ss-slides" id="slides"><div id="track"></div></div>
      <div class="ss-right">
        <div class="ss-so" id="so">
          <div class="ss-so-content" id="soContent"></div>
          <div class="ss-so-qr" id="soQr"><div class="ss-so-qr-l">Scan to share yours</div><div class="ss-so-qr-box" id="soQrBox"></div></div>
        </div>
        <div class="ss-gr" id="grades"></div>
      </div>
    </div>
    <div class="ss-band">
      <div class="ss-band-logo"><img src="/brand/joc-wordmark.png" alt="Just One Chesed" /></div>
      <div class="ss-around" id="around"><div class="ss-k" id="aroundK"></div><div class="ss-mq" id="mq"></div></div>
    </div>
  </div>
</div>
<div class="ss-offline ss-hide" id="offline"></div>
${DEBUG ? '<div class="ss-debug" id="debug"></div>' : ''}`;

/* ---------------------------------------------------------------- scale -- */

/**
 * The canvas is 1920×1080 and the window is whatever the TV says it is.
 *
 * Measured from the live window every time, and re-checked every second for
 * the first twelve: some sticks report a size of zero, or the wrong size,
 * until the browser has settled. A zero is never applied — the last good
 * scale stays — and nor is a guessed 1, which on a 4K panel draws a quarter
 * of a screen.
 */
let lastScale = 0;
function fit() {
  const de = document.documentElement;
  const w = de.clientWidth || window.innerWidth;
  const h = de.clientHeight || window.innerHeight;
  if (!w || !h) return;
  const s = Math.min(w / 1920, h / 1080);
  if (s > 0 && s !== lastScale) {
    lastScale = s;
    $('#canvas').style.transform = `scale(${s})`;
  }
}
window.addEventListener('resize', fit);
window.addEventListener('load', fit);
fit();
const boot = window.setInterval(fit, 1000);
window.setTimeout(() => window.clearInterval(boot), 12_000);

/* ------------------------------------------------------------ rendering -- */

const last: Record<string, string> = {};
/** Only touch the DOM when a part actually changed, so the crossfades run. */
function setHTML(id: string, html: string) {
  if (last[id] === html) return;
  last[id] = html;
  $(`#${id}`).innerHTML = html;
}

function show(id: string, on: boolean) {
  $(`#${id}`).classList.toggle('ss-hide', !on);
}

/** Numbers count up over two seconds when the screen first gets data. */
function count(n: number): string {
  const p = state.countFrom ? Math.min(1, (Date.now() - state.countFrom) / 2000) : 1;
  return Math.round(n * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
}

/**
 * What the big panel shows.
 *
 * Today's programmes while any are left, and once the last has finished,
 * the week ahead in their place. A wall people walk past all evening must
 * never be an empty box.
 */
function slides(d: LobbyScreenData): { html: string }[] {
  const list = d.lobby.today.length ? d.lobby.today : d.lobby.ahead;
  // Today, then the rest of the week, then the one question that is true on
  // any day of the year. The panel never goes away, so the wall never
  // changes shape because somebody fell behind on the diary.
  if (list.length === 0) return [{ html: standingSlideHTML() }];
  return list.map((e) => ({ html: programSlideHTML(e) }));
}

function renderClock() {
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  $('#date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  $('#hdate').textContent = hebrewDate(now, { year: true });
}

/**
 * The line under the name.
 *
 * Acts of chesed used to lead here and on the band. It is gone from both:
 * hours is the figure the app actually answers, and it has a tile of its
 * own now.
 */
/**
 * The line under the name, and the counter in the band.
 *
 * The same split a school's screen uses: what we have done up here, what
 * everybody has done down there. They are different figures — this one is
 * the schools JOC tracks, the band's is every organisation on the app.
 */
/**
 * The line under the logo.
 *
 * The hours are `spendTimeByAll` — one field, as the app returns it, every
 * hour logged by everybody on it. Nothing adds up to this and nothing can:
 * it counts organisations this portal has never heard of, which is why it
 * says total hours rather than naming the schools.
 *
 * The acts beside it are still the schools added together, because the app
 * publishes no all-app equivalent of opportunitiesCount. Every term in that
 * sum is a figure the app returned within the quarter hour.
 *
 * If the app does not answer, the hours are left off rather than filled in
 * from our own sum: that figure is the schools only, and putting it under
 * this label would say something untrue quietly.
 */
function renderNumbers(d: LobbyScreenData) {
  const bits: string[] = [];
  if (d.stats.acts != null) bits.push(`${count(d.stats.acts)} acts of chesed`);
  if (d.worldHours != null) bits.push(`${count(d.worldHours)} total hours`);
  $('#stats').textContent = bits.join(' · ');
}

function render() {
  const d = state.data;
  renderClock();
  if (!d) return;

  /**
   * The logo, rather than the name set in type next to a ring.
   *
   * A school's screen has a round crest and its name beside it, because a
   * school's name is just a name. Ours is a drawn thing — the ring is the O
   * in it — and setting "Just One Chesed" in Montserrat beside a loose ring
   * was a second-hand version of a logo we already own. The white lockup is
   * the one for this background, and the circle goes: it was showing the
   * same ring twice.
   */
  setHTML('logo', '');
  setHTML('name', '<img src="/brand/joc-wordmark-white.png" alt="Just One Chesed" />');
  renderNumbers(d);

  show('ded', Boolean(d.dedication));
  if (d.dedication) {
    setHTML('ded', `<div class="ss-ded-t">Today’s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${esc(d.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${esc(d.dedication.text || 'Sponsor a day · dedications@justonechesed.org')}</div>`);
  }

  // The slideshow. Built once per data change; the timer only moves "on".
  const list = slides(d);
  const key = list.map((s) => s.html).join('');
  if (last.track !== key) {
    last.track = key;
    $('#track').innerHTML = list.map((s, i) => `<div class="ss-slide" data-i="${i}">${s.html}</div>`).join('');
  }
  show('slides', list.length > 0);
  $('#mid').classList.toggle('ss-solo', list.length === 0);
  const k = list.length ? state.slide % list.length : 0;
  document.querySelectorAll<HTMLElement>('#track .ss-slide').forEach((el, i) => el.classList.toggle('on', i === k));


  // The shout-out card, carrying the cycle: the theme in the pill, and
  // the question set against it as the thing being asked.
  const post = d.shoutOuts.length ? d.shoutOuts[state.shout % d.shoutOuts.length] : null;
  setHTML('soContent', lobbyShoutHTML(post, d.lobby.theme));
  show('soQr', Boolean(d.shoutOutQrSvg));
  setHTML('soQrBox', d.shoutOutQrSvg ?? '');

  // Where a school shows hours by grade. Hours comes from the app; beds
  // and pizzas are typed into the panel. A dash, not a nought, when the
  // app has not answered — a nought is a claim and a dash is not.
  show('grades', true);
  setHTML('grades', tilesHTML([
    // A plus says "at least this many". That is honest about a figure
    // somebody rounded down, and wrong about one that has been counted:
    // hours comes from the app to the hour, and pizzas is now an exact
    // tally. Beds is still a round number typed in, so it keeps its plus.
    { label: 'Hours', value: d.lobby.hours != null ? count(d.lobby.hours) : '—', unit: 'of chesed', icon: 'schedule', on: true },
    { label: 'Beds', value: count(d.lobby.counters.beds) + '+', unit: 'given out', icon: 'bed' },
    { label: 'Pizzas', value: count(d.lobby.counters.pizzas), unit: 'made', icon: 'local_pizza' },
  ]));

  show('around', d.network.length > 0);
  if (d.network.length) {
    // All-time, which is what the app reports; a school's screen says
    // this year because that is the figure it is given.
    $('#aroundK').textContent = 'Around JOC schools · all time';
    setHTML('mq', marqueeHTML(d.network, Math.max(30, d.network.length * 7)));
  }

  renderDebug();
}

function renderDebug() {
  if (!DEBUG) return;
  const age = state.fetchedAt ? Math.round((Date.now() - state.fetchedAt.getTime()) / 1000) : null;
  $('#debug').textContent = [
    `lobby${DEMO ? ' (demo)' : ''}`,
    `data: ${age === null ? 'none yet' : `${age}s old`} · version ${state.data?.version ?? '-'}`,
    `scale: ${lastScale.toFixed(3)} · slide ${state.slide}`,
    state.error ? `last error: ${state.error}` : '',
  ].filter(Boolean).join('\n');
}

/* ----------------------------------------------------------------- data -- */

function readCache(): { data: LobbyScreenData; etag: string } | null {
  try {
    const v = localStorage.getItem(CACHE);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function writeCache() {
  try {
    localStorage.setItem(CACHE, JSON.stringify({ data: state.data, etag: state.etag }));
  } catch {
    /* storage blocked: the screen still works, it just can't start offline */
  }
}

async function load() {
  try {
    const url = '/api/lobby/screen';
    const r = await fetch(url, {
      cache: 'no-store',
      headers: state.etag && state.data ? { 'if-none-match': state.etag } : {},
    });
    if (r.status === 304) {
      state.fetchedAt = new Date();
    } else if (r.ok) {
      const first = !state.data;
      state.data = (await r.json()) as LobbyScreenData;
      state.etag = r.headers.get('etag') ?? '';
      state.fetchedAt = new Date();
      if (first) {
        state.countFrom = Date.now();
        requestAnimationFrame(tick);
      }
      if (!DEMO) writeCache();
    } else {
      throw new Error(`HTTP ${r.status}`);
    }
    state.offline = false;
    state.error = '';
  } catch (e) {
    // Keep showing the last good data. A blank hallway TV is worse than
    // yesterday's shout-out.
    state.offline = true;
    state.error = e instanceof Error ? e.message : String(e);
  }
  show('offline', state.offline);
  render();
}

/** 3:00 in the morning, Jerusalem: pick up new code and start fresh. */
let lastDay = dayKey(new Date());
function nightlyReload() {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  if (hour === 3 && Date.now() - loadedAt > 60 * 60_000) location.reload();
  // A new day can bring a new dedication and take an event flyer down.
  const today = dayKey(new Date());
  if (today !== lastDay) {
    lastDay = today;
    void load();
  }
}

/* ----------------------------------------------------------------- boot -- */

if (!DEMO) {
  const cached = readCache();
  if (cached?.data) {
    state.data = cached.data;
    state.etag = cached.etag;
  }
}
render();
void load();
window.setInterval(load, POLL_MS);
window.setInterval(() => {
  state.slide += 1;
  if (state.slide % 2 === 0) state.shout += 1;
  render();
}, SLIDE_MS);
window.setInterval(renderClock, 15_000);
window.setInterval(nightlyReload, 60_000);
/** The count-up: runs for two seconds after the first data arrives, then stops. */
function tick() {
  if (!state.data) return;
  renderNumbers(state.data);
  if (Date.now() - state.countFrom < 2100) requestAnimationFrame(tick);
}
// Measurements are only right once the fonts are in.
document.fonts?.ready.then(() => {
  for (const k of Object.keys(last)) delete last[k];
  render();
});
