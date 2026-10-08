// Everything on the screen is shown in Jerusalem time, whatever the TV's own clock zone is.
export const TZ = 'Asia/Jerusalem';

const pad = (n: number) => String(n).padStart(2, '0');

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export interface ZonedParts {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

export function zonedParts(date: Date): ZonedParts {
  const o: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(date)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
}

/** YYYY-MM-DD of the Jerusalem calendar day this instant falls on */
export function dayKey(date: Date): string {
  const p = zonedParts(date);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** HH:MM Jerusalem wall-clock time of an instant */
export function timeKey(date: Date): string {
  const p = zonedParts(date);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

/** The instant at which the Jerusalem wall clock reads `date` `time`. */
export function zonedToInstant(date: string, time = '00:00'): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const want = Date.UTC(y, m - 1, d, h, mi);
  let guess = want;
  // Two passes settle the offset, including across DST changes
  for (let i = 0; i < 3; i++) {
    const p = zonedParts(new Date(guess));
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    const diff = seen - want;
    if (diff === 0) break;
    guess -= diff;
  }
  return new Date(guess);
}

/** A day key as a Date at UTC noon: safe to format with timeZone 'UTC' */
function keyDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatDayKey(key: string, opts: Intl.DateTimeFormatOptions): string {
  return keyDate(key).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

export function dayNumber(key: string): number {
  return Number(key.slice(8, 10));
}

/** "4:30pm", "10am", or "16:30" */
export function formatTime(date: Date, clock24 = false): string {
  if (clock24) {
    return date.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }
  return date
    .toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(':00', '')
    .replace(/\s?AM/, 'am')
    .replace(/\s?PM/, 'pm');
}

/** Same as formatTime but from an HH:MM string */
export function formatHHMM(hhmm: string, clock24 = false): string {
  return formatTime(zonedToInstant('2026-01-15', hhmm), clock24);
}

/** The big header clock: "4:30" (no am/pm), or "16:30" */
export function formatClock(date: Date, clock24 = false): string {
  if (clock24) return formatTime(date, true);
  return date
    .toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s?[AP]M/, '');
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' });
}

export function addMinutesHHMM(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const t = Math.min(23 * 60 + 59, Math.max(0, h * 60 + m + minutes));
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
