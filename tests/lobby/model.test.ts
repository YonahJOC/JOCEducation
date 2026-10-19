import { describe, expect, it } from 'vitest';
import { defaultSettings, emptyDoc, sanitizeDoc } from '@/lib/lobby/config';
import { combineEvents, googleItemToEvent, manualToEvent } from '@/lib/lobby/events';
import { buildView } from '@/lib/lobby/model';
import { addDays, dayKey, formatTime, zonedToInstant } from '@/lib/lobby/time';
import type { ManualProgram } from '@/lib/lobby/types';

const prog = (over: Partial<ManualProgram>): ManualProgram => ({
  id: Math.random().toString(36).slice(2),
  program: 'Pizza Making',
  group: '',
  date: '2026-10-08',
  allDay: false,
  start: '10:00',
  end: '11:30',
  location: '',
  venue: 'center',
  notes: '',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('Jerusalem time', () => {
  it('turns wall-clock time into the right instant (summer, UTC+3)', () => {
    expect(zonedToInstant('2026-07-01', '10:00').toISOString()).toBe('2026-07-01T07:00:00.000Z');
  });
  it('turns wall-clock time into the right instant (winter, UTC+2)', () => {
    expect(zonedToInstant('2026-12-01', '10:00').toISOString()).toBe('2026-12-01T08:00:00.000Z');
  });
  it('finds the Jerusalem day even when UTC is still on the day before', () => {
    expect(dayKey(new Date('2026-10-07T22:30:00Z'))).toBe('2026-10-08');
  });
  it('formats like the design', () => {
    expect(formatTime(zonedToInstant('2026-10-08', '16:30'))).toBe('4:30pm');
    expect(formatTime(zonedToInstant('2026-10-08', '10:00'))).toBe('10am');
    expect(formatTime(zonedToInstant('2026-10-08', '16:30'), true)).toBe('16:30');
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
  });
});

describe('buildView', () => {
  const settings = defaultSettings();
  const now = zonedToInstant('2026-10-08', '10:30');

  it('labels today’s programs and drops the finished ones', () => {
    const doc = { ...emptyDoc(), programs: [
      prog({ program: 'Early', start: '08:00', end: '09:00' }),
      prog({ program: 'Now', start: '10:00', end: '11:00' }),
      prog({ program: 'Next', start: '12:00', end: '13:00' }),
      prog({ program: 'Later', start: '15:00', end: '16:00' }),
    ] };
    const v = buildView(combineEvents(doc, null), settings, now);
    expect(v.slides.map((s) => [s.program, s.label])).toEqual([
      ['Now', 'Happening now'],
      ['Next', 'Next up'],
      ['Later', 'Later today'],
    ]);
    expect(v.slides[0].groupLine).toBe('Open to all visitors');
    expect(v.slides[0].timeRange).toBe('10am – 11am');
  });

  it('shows all-day programs as banners today and as “All day” in Coming up', () => {
    const doc = { ...emptyDoc(), programs: [
      prog({ program: 'Rosh Chodesh', allDay: true }),
      prog({ program: 'Election Day', allDay: true, date: '2026-10-10' }),
      prog({ program: 'Build A Bed', date: '2026-10-10', start: '16:00', end: '17:00' }),
    ] };
    const v = buildView(combineEvents(doc, null), settings, now);
    expect(v.banners.map((b) => b.program)).toEqual(['Rosh Chodesh']);
    expect(v.week[0].key).toBe('2026-10-10');
    expect(v.week[0].events.map((e) => [e.time, e.program, e.groupLine])).toEqual([
      ['All day', 'Election Day', ''],
      ['4pm', 'Build A Bed', 'Open to all visitors'],
    ]);
  });

  it('keeps at most 2 programs a day and the chosen number of days', () => {
    const programs = [];
    for (let d = 1; d <= 7; d++) for (let i = 0; i < 3; i++) programs.push(prog({ date: addDays('2026-10-08', d), start: `1${i}:00`, end: `1${i}:30` }));
    const v = buildView(combineEvents({ ...emptyDoc(), programs }, null), { ...settings, daysAhead: 4 }, now);
    expect(v.week).toHaveLength(4);
    expect(v.week.every((d) => d.events.length === 2)).toBe(true);
  });

  it('skips days with nothing on', () => {
    const doc = { ...emptyDoc(), programs: [prog({ date: '2026-10-12' })] };
    const v = buildView(combineEvents(doc, null), settings, now);
    expect(v.week.map((d) => [d.key, d.dowShort, d.num, d.mon])).toEqual([['2026-10-12', 'Mon', 12, 'Oct']]);
  });

  it('filters out-of-office entries and hidden calendar events', () => {
    const g = [
      googleItemToEvent({ id: 'a', summary: 'Tuvia Out of Office', start: { dateTime: '2026-10-08T09:00:00+03:00' }, end: { dateTime: '2026-10-08T18:00:00+03:00' } })!,
      googleItemToEvent({ id: 'b', summary: 'BAB Cohen Family', start: { dateTime: '2026-10-08T11:00:00+03:00' }, end: { dateTime: '2026-10-08T12:00:00+03:00' } })!,
      googleItemToEvent({ id: 'c', summary: 'Kindness Booth - Ramaz', location: 'Ramaz, New York, NY', start: { dateTime: '2026-10-08T12:00:00+03:00' }, end: { dateTime: '2026-10-08T13:00:00+03:00' } })!,
    ];
    const doc = sanitizeDoc({ ...emptyDoc(), settings: { ...settings, source: 'google', hiddenIds: ['g:c'] } });
    const v = buildView(combineEvents(doc, g), doc.settings, now);
    expect(v.slides.map((s) => [s.program, s.group, s.venue?.type])).toEqual([['Build A Bed', 'Cohen Family', 'center']]);
  });

  it('turns a Google all-day event into a Jerusalem day', () => {
    const e = googleItemToEvent({ id: 'x', summary: 'Election Day', start: { date: '2026-10-27' }, end: { date: '2026-10-28' } })!;
    expect(e.allDay).toBe(true);
    expect(dayKey(e.start)).toBe('2026-10-27');
    expect(+e.end - +e.start).toBe(86400000);
  });
});

describe('sources', () => {
  const manual = { ...emptyDoc(), programs: [prog({})] };
  const g = [googleItemToEvent({ id: 'g1', summary: 'Wellness Day', start: { dateTime: '2026-10-08T10:00:00+03:00' }, end: { dateTime: '2026-10-08T12:00:00+03:00' } })!];
  it('manual shows only programs entered in the admin panel', () => {
    expect(combineEvents(manual, g).map((e) => e.source)).toEqual(['manual']);
  });
  it('google shows only the calendar', () => {
    const doc = { ...manual, settings: { ...manual.settings, source: 'google' as const } };
    expect(combineEvents(doc, g).map((e) => e.source)).toEqual(['google']);
  });
  it('both merges them', () => {
    const doc = { ...manual, settings: { ...manual.settings, source: 'both' as const } };
    expect(combineEvents(doc, g).map((e) => e.source).sort()).toEqual(['google', 'manual']);
  });
  it('a manual program keeps its own program/group instead of being re-parsed', () => {
    const e = manualToEvent(prog({ program: 'Pizza Making - Special', group: 'Ramaz' }));
    expect([e.program, e.group]).toEqual(['Pizza Making - Special', 'Ramaz']);
  });
});

describe('sanitizeDoc', () => {
  it('fills in defaults and drops broken programs', () => {
    const d = sanitizeDoc({ programs: [{ program: '', date: '2026-10-08' }, { program: 'OK', date: 'nope' }, { program: 'Good', date: '2026-10-08', start: '25:00' }] });
    expect(d.programs).toHaveLength(1);
    expect(d.programs[0].start).toBe('10:00');
    expect(d.settings.daysAhead).toBe(4);
    expect(d.counters.values.beds).toBe(300);
  });
  it('clamps numbers into range', () => {
    const d = sanitizeDoc({ settings: { slideSeconds: 1, daysAhead: 99 } });
    expect([d.settings.slideSeconds, d.settings.daysAhead]).toEqual([3, 7]);
  });
});

describe('the panel when today is done', () => {
  const settings = defaultSettings();
  // A Sunday evening: everything today has finished.
  const now = zonedToInstant('2026-10-18', '21:00');

  const later = [
    manualToEvent(prog({ program: 'Kindness Booth', date: '2026-10-19', start: '13:30', end: '14:30' })),
    manualToEvent(prog({ program: 'Pizza Making', date: '2026-10-20', start: '10:15', end: '12:00' })),
  ];

  it('has nothing left for today', () => {
    expect(buildView(later, settings, now).slides).toHaveLength(0);
  });

  it('offers the week ahead in its place, so the panel is never blank', () => {
    const view = buildView(later, settings, now);
    expect(view.ahead).toHaveLength(2);
    expect(view.ahead.map((s) => s.program)).toEqual(['Kindness Booth', 'Pizza Making']);
  });

  it('labels them by day, and calls the next one Tomorrow', () => {
    const view = buildView(later, settings, now);
    expect(view.ahead[0].label).toBe('Tomorrow');
    expect(view.ahead[1].label).toBe('Tuesday');
  });

  it('is empty only when the week really is', () => {
    expect(buildView([], settings, now).ahead).toHaveLength(0);
  });

  it('does not repeat today in the week ahead', () => {
    const withToday = [
      manualToEvent(prog({ program: 'Earlier today', date: '2026-10-18', start: '09:00', end: '10:00' })),
      ...later,
    ];
    const view = buildView(withToday, settings, now);
    expect(view.ahead.map((s) => s.program)).not.toContain('Earlier today');
  });

  it('caps the carousel rather than running to a list', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      manualToEvent(prog({ program: 'P' + i, date: '2026-10-19', start: '09:00', end: '10:00' })),
    );
    expect(buildView(many, settings, now).ahead.length).toBeLessThanOrEqual(8);
  });
});

describe('the cycle theme on the lobby wall', () => {
  it('defaults to Cheshbon Hanefesh for a document saved before it existed', () => {
    // The live document has no `theme` key. It must not render an empty strip.
    const d = sanitizeDoc({ settings: { centerName: 'JOC Center' } });
    expect(d.settings.theme.en).toBe('Cheshbon Hanefesh');
    expect(d.settings.theme.he).toBe('חשבון הנפש');
  });

  it('keeps what somebody typed', () => {
    const d = sanitizeDoc({ settings: { theme: { en: 'Hachnasat Orchim', he: 'הכנסת אורחים' } } });
    expect(d.settings.theme).toEqual({ en: 'Hachnasat Orchim', he: 'הכנסת אורחים' });
  });

  it('lets the Hebrew be dropped without the English falling back', () => {
    const d = sanitizeDoc({ settings: { theme: { en: 'Bikur Cholim', he: '' } } });
    expect(d.settings.theme.en).toBe('Bikur Cholim');
    expect(d.settings.theme.he).toBe('');
  });

  it('never loses the counters a document already had', () => {
    // Acts came off the screen; it must not come out of the document.
    const d = sanitizeDoc({ counters: { source: 'manual', sheetId: '', values: { acts: 250000, beds: 300, challahs: 0, pizzas: 7000 } } });
    expect(d.counters.values.acts).toBe(250000);
    expect(d.counters.values.pizzas).toBe(7000);
  });
});
