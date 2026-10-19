import './screen.css';
import { emptyDoc, LOGO_URL, sanitizeDoc } from '@/lib/lobby/config';
import { combineEvents, fetchGoogleEvents, fetchSheetCounters, sampleEvents } from '@/lib/lobby/events';
import { STATS } from '@/lib/lobby/markup';
import { bannerHTML, capHTML, slideHTML, tileHTML, upDayHTML } from '@/lib/lobby/screen-markup';
import { buildView, type ScreenView } from '@/lib/lobby/model';
import { formatClock, formatDateLong, formatHebrewDate, zonedParts } from '@/lib/lobby/time';
import type { CalEvent, CounterKey, LobbyDoc } from '@/lib/lobby/types';

/**
 * The JOC lobby screen.
 *
 * Drawn as a school's own live screen is drawn: a 1920×1080 canvas scaled to
 * whatever the television says it is, a programme filling the left, what is
 * coming up and the impact tiles down the right, and a band along the foot.
 * The wall in this building and the wall in a school should look like the
 * same organisation, and before this they did not.
 *
 * It reads the lobby's own document — the programmes somebody types into the
 * panel, plus Google Calendar where that is switched on — and the hours
 * figure the app reports. Nothing here touches src/school-screen.
 */

const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const DEBUG = params.has('debug');
/** Inside the admin panel: data arrives by postMessage instead of from the server */
const PREVIEW = params.has('preview');

const DOC_POLL_MS = 60_000;
const SHEET_POLL_MS = 60 * 60_000;
const CACHE_DOC = 'joc-lobby:doc';
const CACHE_GCAL = 'joc-lobby:gcal';

// ---------------- state ----------------

const state = {
  doc: emptyDoc() as LobbyDoc,
  docLoaded: false,
  docError: '' as string,
  docFetchedAt: null as Date | null,
  google: null as CalEvent[] | null,
  googleError: '' as string,
  googleFetchedAt: null as Date | null,
  sheet: null as Partial<Record<CounterKey, number>> | null,
  sheetError: '',
  /** Preview can pin the clock to any moment */
  nowOverride: null as Date | null,
  /** Preview can hold the carousel on one program */
  focusId: null as string | null,
  slide: 0,
  /** When the numbers started counting up, so they only do it once. */
  countFrom: 0,
};

const now = () => state.nowOverride ?? new Date();

const cache = {
  read<T>(key: string): T | null {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked: the screen still works, it just can't start offline */
    }
  },
};

// ---------------- DOM ----------------

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

document.getElementById('app')!.innerHTML = `
<div class="ss-stage">
  <div class="ss-canvas" id="canvas">
    <div class="ss-hdr">
      <div class="ss-logo"><img id="logo" alt="Just One Chesed" /></div>
      <div class="ss-name">
        <div class="ss-name-t">Just One <span>Chesed</span></div>
        <div class="ss-name-s" id="stats"></div>
      </div>
      <div></div>
      <div class="ss-clock-box">
        <div class="ss-clock" id="clock"></div>
        <div class="ss-date" id="date"></div>
        <div class="ss-hdate" id="hdate"></div>
      </div>
    </div>

    <div class="ss-mid">
      <div class="ss-slides" id="slides">
        <div id="track"></div>
        <div class="ss-cap on" id="cap"></div>
      </div>
      <div class="ss-right">
        <div class="ss-so" id="so">
          <div class="ss-so-head">
            <div class="ss-so-k"><span class="ss-ms">event_upcoming</span>Coming up</div>
            <div class="ss-so-topic" id="banners"></div>
          </div>
          <div class="ss-up" id="up"></div>
        </div>
        <div class="ss-gr">
          <div class="ss-gr-head">
            <div class="ss-gr-k"><span class="ss-ms">volunteer_activism</span>Our impact</div>
            <div class="ss-gr-total" id="updated"></div>
          </div>
          <div class="ss-gr-tiles ss-three" id="tiles"></div>
        </div>
      </div>
    </div>

    <div class="ss-band">
      <div class="ss-band-logo"><img src="/brand/joc-wordmark.png" alt="Just One Chesed" /></div>
      <div class="ss-sect">
        <div class="ss-sect-ic"><span class="ss-ms">menu_book</span></div>
        <div class="ss-sect-txt">
          <div class="ss-k">This cycle</div>
          <div class="ss-theme" id="themeEn"></div>
        </div>
        <div class="ss-theme-he" dir="rtl" id="themeHe"></div>
      </div>
      <div class="ss-ask">Did you do your just one chesed today?</div>
      <div></div>
    </div>
  </div>
</div>
${DEBUG ? '<div class="ss-debug" id="debug"></div>' : ''}`;

const logo = $<HTMLImageElement>('#logo');
logo.onerror = () => {
  logo.onerror = null;
  logo.src = LOGO_URL;
};
logo.src = '/brand/joc-icon.png';

/* ---------------------------------------------------------------- scale -- */

/**
 * The canvas is 1920×1080 and the window is whatever the TV says it is.
 *
 * Measured from the live window every time, and re-checked every second for
 * the first twelve: some sticks report a size of zero, or the wrong size,
 * until the browser has settled. A zero is never applied.
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

/**
 * Drives the count-up.
 *
 * render() otherwise runs on a fifteen-second timer, so the first frame
 * after the data lands is whatever fraction of the number had been
 * reached — and it then sat there. 248,743 showed as 1,118.
 */
function countUp() {
  const step = () => {
    renderTiles();
    if (Date.now() - state.countFrom < 2100) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Numbers count up over two seconds the first time the screen gets data. */
function count(n: number): string {
  const p = state.countFrom ? Math.min(1, (Date.now() - state.countFrom) / 2000) : 1;
  return Math.round(n * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
}

let view: ScreenView = { banners: [], slides: [], ahead: [], week: [] };

function events(): CalEvent[] {
  if (DEMO) return sampleEvents(now());
  return combineEvents(state.doc, state.google);
}

function render() {
  const t = now();
  const s = state.doc.settings;
  view = buildView(events(), s, t);

  $('#clock').textContent = formatClock(t, s.clock24);
  $('#date').textContent = formatDateLong(t);
  $('#hdate').textContent = formatHebrewDate(t);

  renderSlides(t);
  renderUp();
  renderTiles();
  renderTheme();
  renderStats();
  renderDebug();
}

/**
 * The big panel.
 *
 * Today's programmes while there are any left, and once the last one has
 * finished, the week ahead in their place — a wall people walk past all
 * evening must never be an empty box.
 */
function renderSlides(t: Date) {
  const done = view.slides.length === 0;
  const showing = done ? view.ahead : view.slides;
  const n = showing.length;

  if (!n) {
    setHTML('track', '');
    setHTML(
      'cap',
      capHTML('Today at JOC', 0, 0, 'Nothing on the calendar this week.'),
    );
    return;
  }

  if (state.focusId) {
    const i = showing.findIndex((x) => x.id === state.focusId);
    if (i >= 0) state.slide = i;
  }
  const active = state.slide % n;
  const on = showing[active];

  setHTML('track', showing.map((sl, i) => slideHTML(sl, i === active)).join(''));
  setHTML(
    'cap',
    capHTML(
      done ? 'Coming up this week at JOC' : 'Today at JOC',
      n,
      active,
      [on.groupLine, on.venue?.chip].filter(Boolean).join('  ·  ') || formatDateLong(t),
    ),
  );
}

/** The orange card: the days still to come. */
function renderUp() {
  setHTML(
    'banners',
    view.banners.length
      ? `<span class="ss-ms">celebration</span>${view.banners[0].program}`
      : '<span class="ss-ms">calendar_month</span>This week',
  );
  setHTML(
    'up',
    view.week.length
      ? view.week.slice(0, 3).map(upDayHTML).join('')
      : '<div class="ss-up-none">Nothing else on the calendar this week.</div>',
  );
}

/**
 * The three tiles.
 *
 * Hours comes from the app itself; the other two are typed into the panel.
 * A dash rather than a nought when the app has not answered — a nought is a
 * claim and a dash is not.
 */
function renderTiles() {
  const v = counterValues();
  const tiles = [
    {
      label: 'Hours',
      value: live?.hours != null ? count(live.hours) + '+' : '—',
      unit: 'of chesed',
      icon: 'schedule',
      on: true,
    },
    ...STATS.map((st) => ({
      label: st.label.split(' ')[0],
      value: count(v[st.key] ?? 0) + (st.plus ? '+' : ''),
      unit: st.label.split(' ').slice(1).join(' '),
      icon: st.icon,
    })),
  ];
  setHTML('tiles', tiles.map(tileHTML).join(''));
}

/** What the building is learning this cycle. */
function renderTheme() {
  const t = state.doc.settings.theme;
  $('#themeEn').textContent = t?.en ?? '';
  $('#themeHe').textContent = t?.he ?? '';
}

/** The line under the name, and when the figures were last read. */
function renderStats() {
  const parts: string[] = [];
  if (live?.hours != null) parts.push(`${live.hours.toLocaleString('en-US')} hours of chesed worldwide`);
  parts.push(state.doc.settings.source === 'manual' ? 'JOC schedule' : 'Live · JOC calendar');
  $('#stats').textContent = parts.join('  ·  ');

  const when = state.docFetchedAt;
  $('#updated').textContent = when
    ? 'Updated ' + when.toLocaleTimeString('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : '';
}

const shown: Record<CounterKey, number> = { acts: 0, beds: 0, challahs: 0, pizzas: 0 };

function counterValues(): Record<CounterKey, number> {
  const c = state.doc.counters;
  if (c.source === 'sheet' && state.sheet) return { ...c.values, ...state.sheet };
  return c.values;
}

function renderDebug() {
  if (!DEBUG) return;
  const fmt = (d: Date | null) => (d ? d.toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' }) : '—');
  const s = state.doc.settings;
  $('#debug').textContent = [
    `mode: ${DEMO ? 'demo' : PREVIEW ? 'preview' : 'live'} · source: ${s.source}`,
    `doc v${state.doc.version} · fetched ${fmt(state.docFetchedAt)}${state.docError ? ' · ERROR ' + state.docError : ''}`,
    s.source !== 'manual'
      ? `google: ${state.google?.length ?? 0} events · fetched ${fmt(state.googleFetchedAt)}${state.googleError ? ' · ERROR ' + state.googleError : ''}`
      : 'google: not used',
    `live hours: ${live?.hours ?? '—'} · read ${live?.readAt ?? '—'}`,
    `today: ${view.slides.length} · ahead: ${view.ahead.length} · coming-up days: ${view.week.length}`,
    `now (Jerusalem): ${fmt(now())} · scale ${(Math.min(innerWidth / 1920, innerHeight / 1080)).toFixed(3)}`,
  ].join('\n');
}

// ---------------- data ----------------

/**
 * What the app reports, as served beside the document.
 *
 * Null until the first fetch answers, and after any fetch that fails — the
 * tile then shows a dash rather than a nought.
 */
let live: { hours: number | null; readAt: string | null } | null = null;

let etag = '';
async function loadDoc() {
  if (DEMO || PREVIEW) return;
  try {
    const r = await fetch('/api/lobby/display', { headers: etag ? { 'if-none-match': etag } : {}, cache: 'no-store' });
    if (r.status === 304) {
      state.docError = '';
      state.docFetchedAt = new Date();
      return;
    }
    if (!r.ok) throw new Error('Schedule server answered ' + r.status);
    const json = await r.json();
    // Read before sanitising: sanitizeDoc guarantees the document's shape
    // by dropping everything else, and `live` is not part of it.
    live = json && typeof json === 'object' && json.live ? json.live : live;
    const doc = sanitizeDoc(json);
    etag = r.headers.get('etag') || '';
    const sourceChanged = doc.settings.source !== state.doc.settings.source;
    const googleChanged = JSON.stringify(doc.settings.google) !== JSON.stringify(state.doc.settings.google);
    state.doc = doc;
    state.docLoaded = true;
    state.docError = '';
    state.docFetchedAt = new Date();
    if (!state.countFrom) {
      state.countFrom = Date.now();
      countUp();
    }
    cache.write(CACHE_DOC, doc);
    if (sourceChanged || googleChanged) scheduleGoogle(true);
    restartSlider();
  } catch (err) {
    state.docError = (err as Error).message;
  } finally {
    render();
  }
}

async function loadGoogle() {
  const { source, google } = state.doc.settings;
  if (DEMO || source === 'manual' || !google.calendarId || !google.apiKey) return;
  try {
    state.google = await fetchGoogleEvents(google.calendarId, google.apiKey, now());
    state.googleError = '';
    state.googleFetchedAt = new Date();
    if (!PREVIEW) cache.write(CACHE_GCAL, state.google);
  } catch (err) {
    state.googleError = (err as Error).message;
  } finally {
    render();
  }
}

async function loadSheet() {
  const c = state.doc.counters;
  const key = state.doc.settings.google.apiKey;
  if (DEMO || c.source !== 'sheet' || !c.sheetId || !key) return;
  try {
    state.sheet = await fetchSheetCounters(c.sheetId, key);
    state.sheetError = '';
  } catch (err) {
    state.sheetError = (err as Error).message;
  } finally {
    render();
  }
}

// ---------------- timers ----------------

let googleTimer = 0;
function scheduleGoogle(immediately = false) {
  clearInterval(googleTimer);
  if (immediately) loadGoogle();
  googleTimer = window.setInterval(loadGoogle, state.doc.settings.refreshMinutes * 60_000);
}

let sliderTimer = 0;
let sliderSec = 0;
function restartSlider() {
  const sec = state.doc.settings.slideSeconds;
  if (sec === sliderSec) return;
  sliderSec = sec;
  clearInterval(sliderTimer);
  sliderTimer = window.setInterval(() => {
    if (state.focusId) return;
    state.slide++;
    render();
  }, sec * 1000);
}

const loadedAt = Date.now();
function nightlyReload() {
  // 3:00 Jerusalem time: pick up new code and start with a fresh browser
  const p = zonedParts(new Date());
  if (!PREVIEW && p.h === 3 && Date.now() - loadedAt > 60 * 60_000) location.reload();
}

function restoreCache() {
  const doc = cache.read<LobbyDoc>(CACHE_DOC);
  if (doc) {
    state.doc = sanitizeDoc(doc);
    state.docLoaded = true;
  }
  const g = cache.read<Array<Omit<CalEvent, 'start' | 'end'> & { start: string; end: string }>>(CACHE_GCAL);
  if (g) state.google = g.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
}

// Preview inside the admin panel: same page, data handed over by the parent window
if (PREVIEW) {
  window.addEventListener('message', (ev) => {
    if (ev.origin !== location.origin || ev.data?.type !== 'joc-preview') return;
    const prevGoogle = JSON.stringify(state.doc.settings.google) + state.doc.settings.source;
    state.doc = sanitizeDoc(ev.data.doc);
    state.docLoaded = true;
    state.nowOverride = ev.data.now ? new Date(ev.data.now) : null;
    state.focusId = ev.data.focusId || null;
    restartSlider();
    if (prevGoogle !== JSON.stringify(state.doc.settings.google) + state.doc.settings.source) loadGoogle();
    render();
  });
  window.parent.postMessage({ type: 'joc-preview-ready' }, location.origin);
}

if (!PREVIEW && !DEMO) restoreCache();
restartSlider();
render();
loadDoc().then(() => {
  scheduleGoogle(true);
  loadSheet();
});
if (!PREVIEW) {
  setInterval(loadDoc, DOC_POLL_MS);
  setInterval(loadSheet, SHEET_POLL_MS);
}
setInterval(render, 15_000);
setInterval(nightlyReload, 60_000);
// Measurements are only right once the fonts are in
document.fonts?.ready.then(() => {
  for (const k of Object.keys(last)) delete last[k];
  render();
});

void shown;
