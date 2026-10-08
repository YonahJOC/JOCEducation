import './screen.css';
import { emptyDoc, LOGO_URL, sanitizeDoc } from '@/lib/lobby/config';
import { combineEvents, fetchGoogleEvents, fetchSheetCounters, sampleEvents } from '@/lib/lobby/events';
import { bannerHTML, dayHTML, rowHTML, slideHTML, statHTML, STATS } from '@/lib/lobby/markup';
import { buildView, type ScreenView } from '@/lib/lobby/model';
import { formatClock, formatDateLong, formatTime, zonedParts } from '@/lib/lobby/time';
import type { CalEvent, CounterKey, LobbyDoc } from '@/lib/lobby/types';

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
<div class="stage">
  <div class="canvas" id="canvas">
    <div class="hdr">
      <img class="hdr-logo" id="logo" alt="Just One Chesed" />
      <div class="hdr-right"><div class="hdr-date" id="date"></div><div class="hdr-clock" id="clock"></div></div>
    </div>
    <div class="main">
      <div class="today">
        <div class="today-head">
          <div class="panel-title"><span class="ms">today</span>Today at JOC</div>
          <div class="dots" id="dots"></div>
        </div>
        <div class="banners" id="banners"></div>
        <div class="carousel" id="carousel"><div class="track" id="track"></div></div>
        <div class="rows" id="rows"></div>
        <div class="empty-today" id="emptyToday">No more programs today — see what’s coming up.</div>
      </div>
      <div class="coming">
        <div class="panel-title"><span class="ms">event_upcoming</span>Coming up</div>
        <div class="week" id="week"></div>
        <div class="status"><div id="source"></div><div id="updated"></div></div>
      </div>
    </div>
    <div class="impact" id="impact"></div>
  </div>
</div>
${DEBUG ? '<div class="debug" id="debug"></div>' : ''}`;

// Local copy of the logo if one was added to /public, otherwise the website's
const logo = $<HTMLImageElement>('#logo');
logo.onerror = () => {
  logo.onerror = null;
  logo.src = LOGO_URL;
};
logo.src = '/logo-white.png';

$('#impact').innerHTML = STATS.map((s) => statHTML(s, '0')).join('');

function fit() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  $('#canvas').style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fit);
fit();

// ---------------- rendering ----------------

const last: Record<string, string> = {};
/** Only touch the DOM when a section actually changed, so transitions run smoothly */
function setHTML(id: string, html: string): boolean {
  if (last[id] === html) return false;
  last[id] = html;
  document.getElementById(id)!.innerHTML = html;
  return true;
}

let view: ScreenView = { banners: [], slides: [], week: [] };

function events(): CalEvent[] {
  if (DEMO) return sampleEvents(now());
  return combineEvents(state.doc, state.google);
}

function render() {
  const t = now();
  const s = state.doc.settings;
  view = buildView(events(), s, t);

  $('#date').textContent = formatDateLong(t);
  $('#clock').textContent = formatClock(t, s.clock24);

  const n = view.slides.length;
  if (state.focusId) {
    const i = view.slides.findIndex((x) => x.id === state.focusId);
    if (i >= 0) state.slide = i;
  }
  const active = n ? state.slide % n : 0;

  setHTML('dots', n > 1 ? view.slides.map((_, i) => `<div class="dot${i === active ? ' on' : ''}"></div>`).join('') : '');
  setHTML('banners', view.banners.map(bannerHTML).join(''));

  $('#carousel').style.display = n ? '' : 'none';
  setHTML('track', view.slides.map(slideHTML).join(''));
  $('#track').style.transform = `translateX(${-active * 100}%)`;

  setHTML('rows', view.slides.map((e, i) => rowHTML(e, i === active)).join(''));
  $('#rows').style.display = n ? '' : 'none';
  $('#emptyToday').style.display = n ? 'none' : '';
  fitRows(active);

  setHTML('week', view.week.length ? view.week.map(dayHTML).join('') : '<div class="week-empty">Nothing else on the calendar this week.</div>');
  clipOverflow($('#week'));

  renderStatus();
  renderStats();
  renderDebug();
}

/** Keeps the highlighted row in view and hides any row that would be cut off */
function fitRows(active: number) {
  const box = $('#rows');
  const rows = [...box.children] as HTMLElement[];
  rows.forEach((r) => (r.style.visibility = ''));
  if (!rows.length) return;
  const a = rows[active];
  let top = 0;
  if (a && a.offsetTop - box.offsetTop + a.offsetHeight > box.clientHeight) top = a.offsetTop - box.offsetTop;
  box.scrollTop = top;
  rows.forEach((r) => {
    const y = r.offsetTop - box.offsetTop - top;
    if (y < 0 || y + r.offsetHeight > box.clientHeight + 1) r.style.visibility = 'hidden';
  });
}

function clipOverflow(box: HTMLElement) {
  const kids = [...box.children] as HTMLElement[];
  kids.forEach((c) => (c.style.visibility = ''));
  kids.forEach((c) => {
    if (c.offsetTop - box.offsetTop + c.offsetHeight > box.clientHeight + 1) c.style.visibility = 'hidden';
  });
}

function renderStatus() {
  const s = state.doc.settings;
  const usesGoogle = s.source !== 'manual';
  let label: string;
  let warn = false;
  if (DEMO) label = 'Sample data · demo mode';
  else if (PREVIEW) label = 'Preview';
  else if (state.docError && !state.docLoaded) {
    label = 'Offline · waiting for schedule';
    warn = true;
  } else if (state.docError || (usesGoogle && state.googleError)) {
    label = 'Offline · showing last data';
    warn = true;
  } else label = usesGoogle ? 'Live · Google Calendar' : 'Live · JOC schedule';

  const fetched = usesGoogle && state.googleFetchedAt ? state.googleFetchedAt : state.docFetchedAt;
  const src = $('#source');
  src.textContent = label;
  src.className = warn ? 'warn' : '';
  $('#updated').textContent = fetched && !PREVIEW && !DEMO ? 'Updated ' + formatTime(fetched, s.clock24) : '';
}

// Count-up: from the last shown number to the new one over 2 seconds
const shown: Record<CounterKey, number> = { acts: 0, beds: 0, challahs: 0, pizzas: 0 };
const target: Record<CounterKey, number> = { acts: 0, beds: 0, challahs: 0, pizzas: 0 };
let anim: { from: Record<CounterKey, number>; t0: number } | null = null;

function counterValues(): Record<CounterKey, number> {
  const c = state.doc.counters;
  if (c.source === 'sheet' && state.sheet) return { ...c.values, ...state.sheet };
  return c.values;
}

function renderStats() {
  const v = counterValues();
  const changed = STATS.some((s) => target[s.key] !== v[s.key]);
  if (!changed) return;
  Object.assign(target, v);
  anim = { from: { ...shown }, t0: performance.now() };
  requestAnimationFrame(stepStats);
}

function stepStats(ts: number) {
  if (!anim) return;
  const p = Math.min(1, (ts - anim.t0) / 2000);
  const eased = 1 - Math.pow(1 - p, 3);
  for (const s of STATS) {
    shown[s.key] = Math.round(anim.from[s.key] + (target[s.key] - anim.from[s.key]) * eased);
    const el = document.querySelector(`[data-stat="${s.key}"]`);
    if (el) el.textContent = shown[s.key].toLocaleString('en-US');
  }
  if (p < 1) requestAnimationFrame(stepStats);
  else anim = null;
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
    state.doc.counters.source === 'sheet' ? `sheet: ${state.sheetError || 'ok'}` : 'counters: manual',
    `today: ${view.slides.length} · banners: ${view.banners.length} · coming-up days: ${view.week.length}`,
    `now (Jerusalem): ${fmt(now())} · scale ${(Math.min(innerWidth / 1920, innerHeight / 1080)).toFixed(3)}`,
  ].join('\n');
}

// ---------------- data ----------------

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
    const doc = sanitizeDoc(await r.json());
    etag = r.headers.get('etag') || '';
    const sourceChanged = doc.settings.source !== state.doc.settings.source;
    const googleChanged = JSON.stringify(doc.settings.google) !== JSON.stringify(state.doc.settings.google);
    state.doc = doc;
    state.docLoaded = true;
    state.docError = '';
    state.docFetchedAt = new Date();
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
