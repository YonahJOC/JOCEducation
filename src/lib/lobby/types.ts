export type VenueType = 'center' | 'shuk' | 'usa' | 'other';
export type VenueChoice = 'auto' | VenueType;
export type DataSource = 'manual' | 'google' | 'both';

/** A program entered by hand in the admin panel. Dates and times are Jerusalem wall-clock. */
export interface ManualProgram {
  id: string;
  /** Shared by every copy made with "repeat weekly" */
  seriesId?: string;
  program: string;
  group: string;
  /** YYYY-MM-DD */
  date: string;
  allDay: boolean;
  /** HH:MM, 24h */
  start: string;
  end: string;
  location: string;
  venue: VenueChoice;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Abbreviation {
  short: string;
  full: string;
}

export interface Settings {
  source: DataSource;
  google: { calendarId: string; apiKey: string };
  excludeKeywords: string[];
  abbreviations: Abbreviation[];
  venueRules: { center: string[]; shuk: string[]; usa: string[] };
  centerName: string;
  slideSeconds: number;
  daysAhead: number;
  refreshMinutes: number;
  clock24: boolean;
  /** Google Calendar event ids hidden from the screen by an admin */
  hiddenIds: string[];
}

export type CounterKey = 'acts' | 'beds' | 'challahs' | 'pizzas';

export interface Counters {
  source: 'manual' | 'sheet';
  sheetId: string;
  values: Record<CounterKey, number>;
}

/** Everything the admin panel edits. Stored as one JSON document. */
export interface LobbyDoc {
  version: number;
  updatedAt: string;
  settings: Settings;
  counters: Counters;
  programs: ManualProgram[];
}

/** One event, from either source, before display formatting. */
export interface CalEvent {
  id: string;
  source: 'manual' | 'google';
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  allDay: boolean;
  /** Manual programs carry these directly instead of a parsed title */
  program?: string;
  group?: string;
  venue?: VenueChoice;
}
