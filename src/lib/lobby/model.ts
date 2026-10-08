import { abbrMap, expandProgram, isExcluded, parseTitle, venueInfo, type VenueInfo } from './parse';
import { addDays, dayKey, dayNumber, formatDayKey, formatTime } from './time';
import type { CalEvent, Settings } from './types';

export interface ShownEvent {
  id: string;
  source: CalEvent['source'];
  start: Date;
  end: Date;
  allDay: boolean;
  program: string;
  group: string;
  /** Group, or "Open to all visitors"; empty for all-day items */
  groupLine: string;
  /** null for all-day items, which show no location */
  venue: VenueInfo | null;
  time: string;
  timeRange: string;
}

export interface Slide extends ShownEvent {
  label: 'Happening now' | 'Next up' | 'Later today';
  labelInk: string;
}

export interface WeekDay {
  key: string;
  dowShort: string;
  num: number;
  mon: string;
  events: ShownEvent[];
}

export interface ScreenView {
  banners: ShownEvent[];
  /** Today's timed programs that haven't ended, in order */
  slides: Slide[];
  week: WeekDay[];
}

/** Turns a raw event into what the screen prints */
export function shapeEvent(e: CalEvent, settings: Settings): ShownEvent {
  const abbr = abbrMap(settings.abbreviations);
  const parsed =
    e.program !== undefined
      ? { program: expandProgram(e.program, abbr), group: (e.group || '').trim() }
      : parseTitle(e.title, e.description, abbr);
  const time = e.allDay ? 'All day' : formatTime(e.start, settings.clock24);
  return {
    id: e.id,
    source: e.source,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    program: parsed.program,
    group: parsed.group,
    groupLine: e.allDay ? '' : parsed.group || 'Open to all visitors',
    venue: e.allDay ? null : venueInfo(e.location, e.venue, settings),
    time,
    timeRange: e.allDay ? 'All day' : `${time} – ${formatTime(e.end, settings.clock24)}`,
  };
}

/** Removes "Out of office" style entries and anything hidden in the admin panel */
export function visibleEvents(events: CalEvent[], settings: Settings): CalEvent[] {
  const hidden = new Set(settings.hiddenIds);
  return events.filter((e) => !hidden.has(e.id) && !isExcluded(e.title, settings.excludeKeywords));
}

export function buildView(events: CalEvent[], settings: Settings, now: Date): ScreenView {
  const all = visibleEvents(events, settings);
  const today = dayKey(now);
  const byStart = (a: CalEvent, b: CalEvent) => +a.start - +b.start || a.title.localeCompare(b.title);

  const todayTimed = all
    .filter((e) => !e.allDay && dayKey(e.start) === today && e.end > now)
    .sort(byStart)
    .map((e) => shapeEvent(e, settings));

  const firstUpcoming = todayTimed.find((e) => e.start > now);
  const slides: Slide[] = todayTimed.map((e) => {
    const on = e.start <= now;
    return {
      ...e,
      label: on ? 'Happening now' : e === firstUpcoming ? 'Next up' : 'Later today',
      labelInk: on ? '#A85B00' : '#2D46AF',
    };
  });

  const banners = all
    .filter((e) => e.allDay && e.start <= now && e.end > now)
    .sort(byStart)
    .map((e) => shapeEvent(e, settings));

  const week: WeekDay[] = [];
  for (let i = 1; i <= 7 && week.length < settings.daysAhead; i++) {
    const key = addDays(today, i);
    const evs = all
      .filter((e) => dayKey(e.start) === key)
      .sort((a, b) => Number(b.allDay) - Number(a.allDay) || byStart(a, b))
      .slice(0, 2)
      .map((e) => shapeEvent(e, settings));
    if (evs.length) {
      week.push({
        key,
        dowShort: formatDayKey(key, { weekday: 'short' }),
        num: dayNumber(key),
        mon: formatDayKey(key, { month: 'short' }),
        events: evs,
      });
    }
  }

  return { banners, slides, week };
}
