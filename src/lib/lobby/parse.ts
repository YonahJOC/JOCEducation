import type { Abbreviation, Settings, VenueChoice, VenueType } from './types';

export const VENUE_PALETTE: Record<VenueType, { color: string; light: string; tint: string }> = {
  center: { color: '#1450d2', light: '#7cc4ff', tint: '#e3ecfd' },
  shuk: { color: '#e8690a', light: '#ffb066', tint: '#fff0e2' },
  usa: { color: '#e2334a', light: '#ff8fa3', tint: '#fde6ea' },
  other: { color: '#7a4fe0', light: '#c9b6ff', tint: '#efe8ff' },
};

export const VENUE_ICONS: Record<VenueType, string> = {
  center: 'home_pin',
  shuk: 'storefront',
  usa: 'flag',
  other: 'location_on',
};

export function venueNames(centerName: string): Record<VenueType, string> {
  return { center: centerName || 'JOC Center', shuk: 'The Shuk', usa: 'USA', other: 'Off-site' };
}

// ---- Filtering ----

export function isExcluded(title: string, keywords: string[]): boolean {
  const t = title.toLowerCase();
  return keywords.some((k) => {
    const w = k.trim().toLowerCase();
    return w !== '' && t.includes(w);
  });
}

// ---- Program / group ----

export function abbrMap(list: Abbreviation[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const a of list) if (a.short.trim() && a.full.trim()) m[a.short.trim().toUpperCase()] = a.full.trim();
  return m;
}

/** "BAB/Pizza Making" -> "Build A Bed + Pizza Making" */
export function expandProgram(program: string, abbr: Record<string, string>): string {
  return program
    .split('/')
    .map((w) => abbr[w.trim().toUpperCase()] || w.trim())
    .filter(Boolean)
    .join(' + ');
}

/**
 * Reads "Program - Group", "Program – Group", "Program | Group", "Program with Group",
 * or "ABBR Group". A "Group: X" line in the description wins over the title.
 */
export function parseTitle(
  title: string,
  description: string,
  abbr: Record<string, string>,
): { program: string; group: string } {
  const t = title.trim().replace(/\s+/g, ' ');
  let program = t;
  let group = '';
  const parts = t.split(/\s+[-–—|]\s+/);
  if (parts.length > 1) {
    program = parts[0];
    group = parts.slice(1).join(' – ');
  } else if (/\s+with\s+/i.test(t)) {
    const i = t.search(/\s+with\s+/i);
    program = t.slice(0, i);
    group = t.slice(i).replace(/^\s+with\s+/i, '');
  } else {
    const first = t.split(' ')[0];
    if (abbr[first.split('/')[0].toUpperCase()]) {
      program = first;
      group = t.slice(first.length).trim();
    }
  }
  const fromDesc = stripHtml(description).match(/(?:^|\n)\s*group\s*:\s*([^\n]+)/i);
  if (fromDesc) group = fromDesc[1].trim();
  return { program: expandProgram(program, abbr), group: group.trim() };
}

function stripHtml(s: string): string {
  return (s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

// ---- Location ----

export function classifyVenue(location: string, rules: Settings['venueRules']): VenueType {
  const loc = (location || '').trim().toLowerCase();
  if (!loc) return 'center';
  const tokens = loc.split(/[\s,.;/()]+/).filter(Boolean);
  const order: Array<[VenueType, string[]]> = [
    ['center', rules.center],
    ['shuk', rules.shuk],
    ['usa', rules.usa],
  ];
  for (const [type, words] of order) {
    const hit = words.some((raw) => {
      const w = raw.trim().toLowerCase();
      if (!w) return false;
      // Multi-word phrases match anywhere; single words must be a whole token ("ma" ≠ "maayanot")
      return w.includes(' ') ? loc.includes(w) : tokens.includes(w);
    });
    if (hit) return type;
  }
  return 'other';
}

export interface VenueInfo {
  type: VenueType;
  icon: string;
  color: string;
  tint: string;
  /** Big block label: "JOC Center", "The Shuk", "USA", "Off-site" */
  short: string;
  /** Sub-label under it: first part of the location, empty for the center */
  place: string;
  /** For the small list chip: center name, or the place */
  chip: string;
}

export function venueInfo(location: string, choice: VenueChoice | undefined, settings: Settings): VenueInfo {
  const type: VenueType = choice && choice !== 'auto' ? choice : classifyVenue(location, settings.venueRules);
  const names = venueNames(settings.centerName);
  const place = type === 'center' ? '' : (location || '').split(',')[0].trim();
  return {
    type,
    icon: VENUE_ICONS[type],
    color: VENUE_PALETTE[type].color,
    tint: VENUE_PALETTE[type].tint,
    short: names[type],
    place,
    chip: type === 'center' ? names.center : place || names[type],
  };
}
