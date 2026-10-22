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
  /**
   * Who a programme is for, when somebody has said. Empty otherwise, and
   * empty for all-day items.
   *
   * It used to fall back to "Open to all visitors" on anything with no
   * group typed in, which put a line of filler under most of the week on
   * both the wall and the sheet - and said nothing, because a programme
   * with nobody named against it is open by default. Nothing reads better
   * than a sentence that is true of everything.
   */
  groupLine: string;
  /** null for all-day items, which show no location */
  venue: VenueInfo | null;
  time: string;
  timeRange: string;
}

export interface Slide extends ShownEvent {
  /**
   * The chip above the name. Today's three — Happening now, Next up,
   * Later today — or, once today is over, the day it is actually on.
   */
  label: string;
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
  /**
   * The week ahead, for the panel to show once today is finished.
   *
   * The big panel used to empty itself at the end of the day and say
   * 'see what's coming up' over an acre of nothing, on a screen in a
   * lobby people walk past all evening. Same shape as `slides`, so the
   * panel renders it with the carousel it already has, labelled by day
   * rather than by how near it is.
   */
  ahead: Slide[];
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
    groupLine: e.allDay ? '' : parsed.group,
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
      labelInk: on ? '#ff8e00' : '#214ba5',
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

  // Everything still to come, for the panel to fall back to. Capped: it
  // is a carousel somebody watches for a few seconds, not a list.
  const ahead: Slide[] = [];
  for (let i = 1; i <= 7 && ahead.length < 8; i++) {
    const key = addDays(today, i);
    const day = i === 1 ? 'Tomorrow' : formatDayKey(key, { weekday: 'long' });
    for (const e of all.filter((x) => dayKey(x.start) === key).sort(byStart)) {
      if (ahead.length >= 8) break;
      ahead.push({ ...shapeEvent(e, settings), label: day, labelInk: '#214ba5' });
    }
  }

  return { banners, slides, ahead, week };
}
