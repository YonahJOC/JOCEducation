import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@/lib/lobby/config';
import { abbrMap, classifyVenue, expandProgram, isExcluded, parseTitle, venueInfo } from '@/lib/lobby/parse';

const s = defaultSettings();
const abbr = abbrMap(s.abbreviations);

describe('parseTitle', () => {
  it.each([
    ['Kindness Booth - Ramaz 11th Grade', 'Kindness Booth', 'Ramaz 11th Grade'],
    ['Kindness Booth – Gap Year Students', 'Kindness Booth', 'Gap Year Students'],
    ['Kindness Booth — Gap Year Students', 'Kindness Booth', 'Gap Year Students'],
    ['Pizza Making | Olim Efrat', 'Pizza Making', 'Olim Efrat'],
    ['Pizza Making with Olim Efrat', 'Pizza Making', 'Olim Efrat'],
    ['Pizza making WITH the Cohens', 'Pizza making', 'the Cohens'],
    ['Wellness Day', 'Wellness Day', ''],
  ])('%s', (title, program, group) => {
    expect(parseTitle(title, '', abbr)).toEqual({ program, group });
  });

  it('expands an abbreviation that leads the title with no separator', () => {
    expect(parseTitle('BAB Cohen Family', '', abbr)).toEqual({ program: 'Build A Bed', group: 'Cohen Family' });
  });

  it('expands abbreviations joined with a slash', () => {
    expect(parseTitle('BAB/Pizza Making - Grodzinski Family', '', abbr)).toEqual({
      program: 'Build A Bed + Pizza Making',
      group: 'Grodzinski Family',
    });
  });

  it('is case-insensitive for abbreviations', () => {
    expect(parseTitle('bab Lieberman', '', abbr).program).toBe('Build A Bed');
  });

  it('keeps a hyphenated word whole (needs spaces around the dash)', () => {
    expect(parseTitle('Follow-up Meeting', '', abbr)).toEqual({ program: 'Follow-up Meeting', group: '' });
  });

  it('lets a Group: line in the description override the title', () => {
    expect(parseTitle('Pizza Making - Someone', 'Bring aprons\nGroup: Ramaz 10th Grade\nThanks', abbr).group).toBe('Ramaz 10th Grade');
  });

  it('reads Group: out of an HTML description', () => {
    expect(parseTitle('Pizza Making', '<p>Notes</p><p>group: Maayanot</p>', abbr).group).toBe('Maayanot');
  });

  it('joins extra separators into the group', () => {
    expect(parseTitle('Chesed Packing - Maayanot - 9th Grade', '', abbr)).toEqual({
      program: 'Chesed Packing',
      group: 'Maayanot – 9th Grade',
    });
  });
});

describe('expandProgram', () => {
  it('leaves unknown words alone', () => {
    expect(expandProgram('Pizza Making', abbr)).toBe('Pizza Making');
  });
});

describe('classifyVenue', () => {
  const r = s.venueRules;
  it.each([
    ['', 'center'],
    ['JOC Center', 'center'],
    ['JOC Chesed Center, Efrat', 'center'],
    ['Efrat', 'center'],
    ['Machane Yehuda Shuk', 'shuk'],
    ['Mahane Yehuda Market, Jerusalem', 'shuk'],
    ['Ramaz, New York, NY', 'usa'],
    ['Maimonides School, Brookline, MA', 'usa'],
    ['Maayanot, Teaneck, NJ', 'usa'],
    ['Young Israel of Brooklyn', 'usa'],
    ['Shaare Zedek Hospital, Jerusalem', 'other'],
    ['Malha Mall', 'other'],
  ])('%s → %s', (loc, type) => {
    expect(classifyVenue(loc, r)).toBe(type);
  });

  it('matches short codes only as whole words', () => {
    // "ma" must not match "Maayanot", "il" must not match "Gilo"
    expect(classifyVenue('Maayanot', r)).toBe('other');
    expect(classifyVenue('Gilo', r)).toBe('other');
  });
});

describe('venueInfo', () => {
  it('shows the first part of an off-site location', () => {
    const v = venueInfo('Shaare Zedek Hospital, Jerusalem', 'auto', s);
    expect(v).toMatchObject({ type: 'other', short: 'Off-site', place: 'Shaare Zedek Hospital', chip: 'Shaare Zedek Hospital', icon: 'location_on', color: '#7a4fe0' });
  });
  it('uses the center name with no place line', () => {
    expect(venueInfo('', 'auto', s)).toMatchObject({ type: 'center', short: 'JOC Center', place: '', chip: 'JOC Center', icon: 'home_pin' });
  });
  it('honours a chosen type over the text', () => {
    expect(venueInfo('Ramaz', 'usa', s)).toMatchObject({ type: 'usa', short: 'USA', place: 'Ramaz', icon: 'flag' });
  });
});

describe('isExcluded', () => {
  const k = s.excludeKeywords;
  it.each([
    ['Tuvia Out of Office', true],
    ['Colleen out of office', true],
    ['Claire Away', true],
    ['OOO - dentist', true],
    ['Private: doctor', true],
    ['Pizza Making - Olim Efrat', false],
    ['BAB Cohen Family', false],
  ])('%s → %s', (title, out) => {
    expect(isExcluded(title, k)).toBe(out);
  });
  it('ignores blank keywords', () => {
    expect(isExcluded('Anything', ['', '  '])).toBe(false);
  });
});
