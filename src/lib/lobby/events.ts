import { addDays, dayKey, zonedToInstant } from './time';
import type { CalEvent, CounterKey, LobbyDoc, ManualProgram, Settings } from './types';

export function manualToEvent(p: ManualProgram): CalEvent {
  const start = zonedToInstant(p.date, p.allDay ? '00:00' : p.start);
  const end = p.allDay ? zonedToInstant(addDays(p.date, 1)) : zonedToInstant(p.date, p.end);
  return {
    id: 'm:' + p.id,
    source: 'manual',
    title: p.group ? `${p.program} - ${p.group}` : p.program,
    description: '',
    location: p.location,
    start,
    end,
    allDay: p.allDay,
    program: p.program,
    group: p.group,
    venue: p.venue,
  };
}

export class FetchError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

interface GoogleItem {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

export function googleItemToEvent(it: GoogleItem): CalEvent | null {
  if (it.status === 'cancelled' || !it.start) return null;
  const allDay = !!it.start.date;
  const start = allDay ? zonedToInstant(it.start.date!) : new Date(it.start.dateTime!);
  const end = allDay
    ? zonedToInstant(it.end?.date || addDays(it.start.date!, 1))
    : new Date(it.end?.dateTime || it.start.dateTime!);
  if (isNaN(+start) || isNaN(+end)) return null;
  return {
    id: 'g:' + it.id,
    source: 'google',
    title: it.summary || '',
    description: it.description || '',
    location: it.location || '',
    start,
    end,
    allDay,
  };
}

/** Today (Jerusalem) through 8 days out, from a public calendar */
export async function fetchGoogleEvents(calendarId: string, apiKey: string, now = new Date()): Promise<CalEvent[]> {
  const from = zonedToInstant(dayKey(now));
  const to = zonedToInstant(addDays(dayKey(now), 9));
  const params = new URLSearchParams({
    key: apiKey,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
    timeZone: 'Asia/Jerusalem',
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new FetchError('No connection to Google');
  }
  if (!r.ok) {
    let msg = `Google Calendar answered ${r.status}`;
    try {
      const j = await r.json();
      if (j?.error?.message) msg += ': ' + j.error.message;
    } catch {
      /* body was not JSON */
    }
    throw new FetchError(msg, r.status);
  }
  const j = (await r.json()) as { items?: GoogleItem[] };
  return (j.items || []).map(googleItemToEvent).filter(Boolean) as CalEvent[];
}

/** Sheet tab "Counters", columns key,value */
export async function fetchSheetCounters(sheetId: string, apiKey: string): Promise<Partial<Record<CounterKey, number>>> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent('Counters!A:B')}?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url);
  if (!r.ok) throw new FetchError(`Google Sheets answered ${r.status}`, r.status);
  const j = (await r.json()) as { values?: string[][] };
  const out: Partial<Record<CounterKey, number>> = {};
  for (const row of j.values || []) {
    const k = (row[0] || '').trim().toLowerCase() as CounterKey;
    const v = Number(String(row[1] || '').replace(/[,\s]/g, ''));
    if (['acts', 'beds', 'challahs', 'pizzas'].includes(k) && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** Which events reach the screen, given the chosen source */
export function combineEvents(doc: LobbyDoc, google: CalEvent[] | null): CalEvent[] {
  const s: Settings = doc.settings;
  const manual = s.source === 'google' ? [] : doc.programs.map(manualToEvent);
  const fromGoogle = s.source === 'manual' ? [] : google || [];
  return [...manual, ...fromGoogle];
}

/** The design's sample week, relative to `now`, in Jerusalem time */
export function sampleEvents(now = new Date()): CalEvent[] {
  const today = dayKey(now);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hourCycle: 'h23' }).format(now)) % 24;
  let n = 0;
  const d = (off: number, h: number, m: number, dur: number, title: string, location: string, allDay = false): CalEvent => {
    const key = addDays(today, off);
    const pad = (x: number) => String(x).padStart(2, '0');
    const start = allDay ? zonedToInstant(key) : zonedToInstant(key, `${pad(h)}:${pad(m)}`);
    const end = allDay ? zonedToInstant(addDays(key, 1)) : new Date(+start + dur * 60000);
    return { id: 's:' + n++, source: 'google', title, description: '', location, start, end, allDay };
  };
  return [
    d(0, Math.max(8, hour - 1), 0, 120, 'Kindness Booth - Ramaz 11th Grade', 'Ramaz, New York, NY'),
    d(0, Math.min(hour + 1, 21), 30, 90, 'Pizza Making - Olim Efrat', 'JOC Center'),
    d(0, Math.min(hour + 2, 22), 0, 60, 'Kindness Booth - Gap Year Students', 'Machane Yehuda Shuk'),
    d(0, 9, 0, 30, 'Tuvia Out of Office', ''),
    d(3, 16, 30, 90, 'BAB Lieberman Family', ''),
    d(4, 10, 30, 60, 'JOC App Forum - Partner Schools', 'Maimonides School, Brookline, MA'),
    d(4, 19, 0, 60, 'Chesed Packing - Maayanot', 'Maayanot, Teaneck, NJ'),
    d(6, 10, 0, 90, 'Pizza Making - Gush Etzion Seniors', 'JOC Center'),
    d(7, 10, 0, 240, 'Wellness Day - Reservist Families', 'JOC Center'),
    d(7, 16, 0, 90, 'BAB/Pizza Making - Grodzinski Family', ''),
    d(5, 0, 0, 0, 'Election Day', '', true),
  ];
}
