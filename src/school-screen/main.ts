import { hebrewDate } from '@/lib/hebrew-date';
import './screen.css';
import type { ScreenData } from '@/lib/school-screen/types';
import {
  captionHTML, esc, flyerHTML, gradesHTML, marqueeHTML, photoSlideHTML, shoutEmptyHTML, shoutHTML,
} from '@/lib/school-screen/markup';
import { dayKey } from '@/lib/school-screen/rules';

/**
 * The school live screen: the TV in a school's hallway.
 *
 * Built like the lobby screen, for the same reason: it runs unattended on a
 * stick behind a television for months, so it is a few kilobytes of vanilla
 * script with none of the site anywhere near it. It keeps the last good data
 * through a network drop (a small dot says so), reloads itself at 3am, and
 * works out its own scale from the window on every render.
 */

const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const DEBUG = params.has('debug');
const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] ?? '');

const POLL_MS = 5 * 60_000;
const SLIDE_MS = 8_000;
const CACHE = `joc-school-screen:${slug}`;
const loadedAt = Date.now();

const state = {
  data: null as ScreenData | null,
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
      <div class="ss-slides" id="slides"><div id="track"></div><div class="ss-cap" id="cap"></div></div>
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
      <div class="ss-sect" id="themeSect">
        <div class="ss-sect-ic"><span class="ss-ms">menu_book</span></div>
        <div class="ss-sect-txt"><div class="ss-k" id="schoolsLearning"></div><div class="ss-theme" id="theme"></div><div class="ss-theme-he" dir="rtl" id="themeHe"></div></div>
      </div>
      <div class="ss-around" id="around"><div class="ss-k" id="aroundK"></div><div class="ss-mq" id="mq"></div></div>
      <div class="ss-world" id="world"><span class="ss-ms">public</span><div><div class="ss-world-n" id="worldN"></div><div class="ss-world-l">hours of chesed worldwide</div></div></div>
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

type Slide = { kind: 'photo' | 'flyer'; html: string; caption?: string };

function slides(d: ScreenData): Slide[] {
  const out: Slide[] = d.photos.map((p) => ({
    kind: 'photo' as const,
    html: photoSlideHTML(p),
    caption: p.caption || 'Chesed in action',
  }));
  let programs = 0;
  for (const f of d.flyers) {
    out.push({ kind: 'flyer', html: flyerHTML(f, d.school.short, f.template === 'PROGRAM' ? programs++ : 0) });
  }
  return out;
}

function renderClock() {
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  $('#date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  $('#hdate').textContent = hebrewDate(now, { year: true });
}

function renderNumbers(d: ScreenData) {
  const bits: string[] = [];
  if (d.stats.acts != null) bits.push(`${count(d.stats.acts)} acts of chesed`);
  if (d.stats.hours != null) bits.push(`${count(d.stats.hours)} hours this year`);
  $('#stats').textContent = bits.join(' · ');
  show('world', d.worldHours != null);
  if (d.worldHours != null) $('#worldN').textContent = count(d.worldHours);
}

function render() {
  const d = state.data;
  renderClock();
  if (!d) return;

  const short = d.school.short;
  setHTML('logo', d.school.logoUrl
    ? `<img src="${esc(d.school.logoUrl)}" alt="${esc(short)} logo" />`
    : `<div class="ss-logo-l">${esc(short.slice(0, 2).toUpperCase())}</div>`);
  setHTML('name', `${esc(short)} <span>Chesed</span>`);
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
  const photoCount = d.photos.length;
  const onPhoto = list[k]?.kind === 'photo';
  $('#cap').classList.toggle('on', onPhoto);
  if (onPhoto) setHTML('cap', captionHTML(short, list[k].caption ?? '', k, photoCount));

  // The shout-out: one at a time, moving on with every other slide.
  const topic = d.theme?.topic ?? null;
  if (d.shoutOuts.length) {
    setHTML('soContent', shoutHTML(d.shoutOuts[state.shout % d.shoutOuts.length], topic));
  } else {
    setHTML('soContent', shoutEmptyHTML(topic));
  }
  show('soQr', Boolean(d.shoutOutQrSvg));
  setHTML('soQrBox', d.shoutOutQrSvg ?? '');

  // Hours by grade: hidden, not zero, when the app has nothing to give.
  show('grades', Boolean(d.grades && d.grades.rows.length));
  if (d.grades && d.grades.rows.length) {
    const month = new Date().toLocaleDateString('en-US', { month: 'long' });
    setHTML('grades', gradesHTML(month, d.grades.goal, d.grades.rows));
  }

  // The band.
  show('themeSect', Boolean(d.theme));
  if (d.theme) {
    $('#schoolsLearning').textContent = d.networkSchools > 1 ? `${d.networkSchools} schools learning` : 'This cycle';
    $('#theme').textContent = d.theme.en;
    $('#themeHe').textContent = d.theme.he ?? '';
  }
  show('around', d.network.length > 0);
  if (d.network.length) {
    $('#aroundK').textContent = 'Around JOC schools · this year';
    setHTML('mq', marqueeHTML(d.network, Math.max(30, d.network.length * 7)));
  }

  renderDebug();
}

function renderDebug() {
  if (!DEBUG) return;
  const age = state.fetchedAt ? Math.round((Date.now() - state.fetchedAt.getTime()) / 1000) : null;
  $('#debug').textContent = [
    `school: ${slug}${DEMO ? ' (demo)' : ''}`,
    `data: ${age === null ? 'none yet' : `${age}s old`} · version ${state.data?.version ?? '-'}`,
    `scale: ${lastScale.toFixed(3)} · slide ${state.slide}`,
    state.error ? `last error: ${state.error}` : '',
  ].filter(Boolean).join('\n');
}

/* ----------------------------------------------------------------- data -- */

function readCache(): { data: ScreenData; etag: string } | null {
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
    const url = `/api/school-screen/${encodeURIComponent(slug)}${DEMO ? '?demo=1' : ''}`;
    const r = await fetch(url, {
      cache: 'no-store',
      headers: state.etag && state.data ? { 'if-none-match': state.etag } : {},
    });
    if (r.status === 304) {
      state.fetchedAt = new Date();
    } else if (r.ok) {
      const first = !state.data;
      state.data = (await r.json()) as ScreenData;
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
