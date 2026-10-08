import type { Counters, LobbyDoc, ManualProgram, Settings, VenueChoice } from './types';

// These were Vite build-time defaults (VITE_GCAL_ID and friends). Nothing
// here is built by Vite any more and the settings they seeded are all edited
// in the admin panel, so the fallbacks below are the defaults now. The names
// stay so the Google seam reads the same when it is switched on.
const env: Record<string, string | undefined> = {};

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : fallback;
};

// Served from our own public/, so the screen works with the internet down
// and never shows a gap where the wordmark should be.
export const LOGO_URL = '/brand/joc-wordmark-white.png';

/** Fallback impact numbers when nothing is configured */
export const DEFAULT_COUNTERS: Counters['values'] = {
  acts: 250000,
  beds: 4200,
  challahs: 12000,
  pizzas: 18500,
};

export const ENV = {
  calendarId: (env.VITE_GCAL_ID || '').trim(),
  apiKey: (env.VITE_GCAL_API_KEY || '').trim(),
  sheetId: (env.VITE_SHEET_ID || '').trim(),
  refreshMinutes: num(env.VITE_REFRESH_MIN, 5),
  slideSeconds: num(env.VITE_SLIDE_SEC, 8),
};

export function defaultSettings(): Settings {
  return {
    source: ENV.calendarId && ENV.apiKey ? 'google' : 'manual',
    google: { calendarId: ENV.calendarId, apiKey: ENV.apiKey },
    excludeKeywords: ['out of office', 'away', 'OOO', 'private'],
    abbreviations: [{ short: 'BAB', full: 'Build A Bed' }],
    venueRules: {
      center: ['joc center', 'chesed center', 'efrat'],
      shuk: ['shuk', 'machane yehuda', 'mahane yehuda', 'market'],
      usa: ['usa', 'ny', 'nj', 'ma', 'il', 'ca', 'fl', 'md', 'new york', 'chicago', 'teaneck', 'brooklyn'],
    },
    centerName: 'JOC Center',
    slideSeconds: ENV.slideSeconds,
    daysAhead: 4,
    refreshMinutes: ENV.refreshMinutes,
    clock24: false,
    hiddenIds: [],
  };
}

export function defaultCounters(): Counters {
  return { source: ENV.sheetId ? 'sheet' : 'manual', sheetId: ENV.sheetId, values: { ...DEFAULT_COUNTERS } };
}

export function emptyDoc(): LobbyDoc {
  return { version: 0, updatedAt: '', settings: defaultSettings(), counters: defaultCounters(), programs: [] };
}

// ---- Sanitizing: whatever arrives (from storage, an import, or a request) leaves as a valid doc ----

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');
const strList = (v: unknown, max = 100) =>
  Array.isArray(v) ? v.map((x) => str(x, 120).trim()).filter(Boolean).slice(0, max) : null;
const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
};
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const VENUES: VenueChoice[] = ['auto', 'center', 'shuk', 'usa', 'other'];

export function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rules = (s.venueRules && typeof s.venueRules === 'object' ? s.venueRules : {}) as Record<string, unknown>;
  const google = (s.google && typeof s.google === 'object' ? s.google : {}) as Record<string, unknown>;
  return {
    source: s.source === 'google' || s.source === 'both' || s.source === 'manual' ? s.source : d.source,
    google: {
      // An empty stored value falls back to the build-time env, so env-only setups keep working
      calendarId: str(google.calendarId, 300).trim() || d.google.calendarId,
      apiKey: str(google.apiKey, 120).trim() || d.google.apiKey,
    },
    excludeKeywords: strList(s.excludeKeywords) ?? d.excludeKeywords,
    abbreviations: Array.isArray(s.abbreviations)
      ? s.abbreviations
          .map((a: unknown) => {
            const it = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>;
            return { short: str(it.short, 30).trim(), full: str(it.full, 120).trim() };
          })
          .filter((a: { short: string; full: string }) => a.short && a.full)
          .slice(0, 100)
      : d.abbreviations,
    venueRules: {
      center: strList(rules.center) ?? d.venueRules.center,
      shuk: strList(rules.shuk) ?? d.venueRules.shuk,
      usa: strList(rules.usa) ?? d.venueRules.usa,
    },
    centerName: str(s.centerName, 60).trim() || d.centerName,
    slideSeconds: clamp(s.slideSeconds, 3, 30, d.slideSeconds),
    daysAhead: clamp(s.daysAhead, 2, 7, d.daysAhead),
    refreshMinutes: clamp(s.refreshMinutes, 1, 60, d.refreshMinutes),
    clock24: typeof s.clock24 === 'boolean' ? s.clock24 : d.clock24,
    hiddenIds: strList(s.hiddenIds, 2000) ?? [],
  };
}

export function sanitizeCounters(raw: unknown): Counters {
  const d = defaultCounters();
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const v = (c.values && typeof c.values === 'object' ? c.values : {}) as Record<string, unknown>;
  const n = (x: unknown, f: number) => clamp(x, 0, 1e12, f);
  return {
    source: c.source === 'sheet' || c.source === 'manual' ? c.source : d.source,
    sheetId: str(c.sheetId, 200).trim() || d.sheetId,
    values: {
      acts: n(v.acts, d.values.acts),
      beds: n(v.beds, d.values.beds),
      challahs: n(v.challahs, d.values.challahs),
      pizzas: n(v.pizzas, d.values.pizzas),
    },
  };
}

export function sanitizeProgram(raw: unknown): ManualProgram | null {
  const p = (raw && typeof raw === 'object' ? raw : null) as Record<string, unknown> | null;
  if (!p) return null;
  const program = str(p.program, 120).trim();
  if (!program || !isDate(p.date)) return null;
  const allDay = !!p.allDay;
  const start = isTime(p.start) ? p.start : '10:00';
  let end = isTime(p.end) ? p.end : start;
  if (!allDay && end <= start) end = start;
  const now = new Date().toISOString();
  return {
    id: str(p.id, 60) || cryptoId(),
    seriesId: str(p.seriesId, 60) || undefined,
    program,
    group: str(p.group, 160).trim(),
    date: p.date,
    allDay,
    start,
    end,
    location: str(p.location, 200).trim(),
    venue: VENUES.includes(p.venue as VenueChoice) ? (p.venue as VenueChoice) : 'auto',
    notes: str(p.notes, 1000),
    createdAt: str(p.createdAt, 40) || now,
    updatedAt: str(p.updatedAt, 40) || now,
  };
}

export function sanitizeDoc(raw: unknown): LobbyDoc {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    version: clamp(r.version, 0, Number.MAX_SAFE_INTEGER, 0),
    updatedAt: str(r.updatedAt, 40),
    settings: sanitizeSettings(r.settings),
    counters: sanitizeCounters(r.counters),
    programs: Array.isArray(r.programs)
      ? (r.programs.map(sanitizeProgram).filter(Boolean) as ManualProgram[]).slice(0, 5000)
      : [],
  };
}

export function cryptoId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '').slice(0, 16);
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
