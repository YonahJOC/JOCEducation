import { shapeEvent, visibleEvents, type ShownEvent } from './model';
import { addDays, dayKey, dayNumber, formatDayKey, TZ } from './time';
import type { CalEvent, Settings } from './types';

/**
 * The week, as something you can hand to a person.
 *
 * `buildView` already makes a week, but for a television: it skips today,
 * keeps two items a day and stops at `daysAhead`, because a strip along the
 * bottom of a screen has room for a glance and no more.
 *
 * A sheet going to staff on WhatsApp is the opposite. It starts today,
 * because "this week" that leaves out this morning is wrong, and it shows
 * every program on every day, because the one left off is the one somebody
 * needed. Same events, same parsing, same abbreviations — different shape.
 */

export interface SheetDay {
  key: string;
  /** "Sunday" */
  weekday: string;
  /** "Sun" */
  weekdayShort: string;
  num: number;
  /** "Oct" */
  mon: string;
  isToday: boolean;
  events: ShownEvent[];
}

export interface WeekSheet {
  days: SheetDay[];
  /** "18–24 October 2026", or spanning two months where it does */
  range: string;
  /** The Hebrew range, or '' where the calendar is unavailable */
  hebrewRange: string;
  /** Days with nothing on are kept out, so this is not days.length */
  programCount: number;
}

/** "18" and "24 October 2026" → "18–24 October 2026" */
function rangeLabel(fromKey: string, toKey: string): string {
  const fromMon = formatDayKey(fromKey, { month: 'long' });
  const toMon = formatDayKey(toKey, { month: 'long' });
  const year = formatDayKey(toKey, { year: 'numeric' });
  const a = dayNumber(fromKey);
  const b = dayNumber(toKey);
  return fromMon === toMon
    ? `${a}–${b} ${toMon} ${year}`
    : `${a} ${fromMon} – ${b} ${toMon} ${year}`;
}

/** "7 Heshvan – 13 Heshvan", or '' where Intl has no Hebrew calendar. */
function hebrewRangeLabel(from: Date, to: Date): string {
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: TZ, day: 'numeric', month: 'long' });
    const a = f.format(from);
    const b = f.format(to);
    if (a === b) return a;
    const [, aMon] = a.split(' ');
    const [, bMon] = b.split(' ');
    // Inside one Hebrew month the month name is said once.
    return aMon === bMon ? `${a.split(' ')[0]}–${b}` : `${a} – ${b}`;
  } catch {
    return '';
  }
}

/**
 * Every program from today for `days` days.
 *
 * Days with nothing on them are dropped rather than printed empty — a sheet
 * of blank Tuesdays reads as a broken export, not as a quiet week.
 */
export function buildWeekSheet(
  events: CalEvent[],
  settings: Settings,
  now: Date,
  days = 7,
): WeekSheet {
  const all = visibleEvents(events, settings);
  const today = dayKey(now);
  const byStart = (a: CalEvent, b: CalEvent) =>
    Number(b.allDay) - Number(a.allDay) || +a.start - +b.start || a.title.localeCompare(b.title);

  const out: SheetDay[] = [];
  let count = 0;

  for (let i = 0; i < days; i++) {
    const key = addDays(today, i);
    const evs = all.filter((e) => dayKey(e.start) === key).sort(byStart);
    if (!evs.length) continue;
    count += evs.length;
    out.push({
      key,
      weekday: formatDayKey(key, { weekday: 'long' }),
      weekdayShort: formatDayKey(key, { weekday: 'short' }),
      num: dayNumber(key),
      mon: formatDayKey(key, { month: 'short' }),
      isToday: i === 0,
      events: evs.map((e) => shapeEvent(e, settings)),
    });
  }

  const lastKey = addDays(today, days - 1);
  return {
    days: out,
    range: rangeLabel(today, lastKey),
    hebrewRange: hebrewRangeLabel(now, new Date(+now + (days - 1) * 86_400_000)),
    programCount: count,
  };
}
