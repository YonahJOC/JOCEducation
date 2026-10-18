import type { WeekSheet } from './week-sheet';

/**
 * The week, drawn as one picture.
 *
 * It is built as an SVG string rather than as React, for one reason: the
 * same string is what becomes the PNG. A poster assembled from components
 * would have to be re-measured and re-drawn for the export, and the preview
 * and the file would drift apart the first time anybody changed a margin.
 * Here there is one drawing, shown on the page and handed to the canvas
 * unchanged.
 *
 * Fonts are the system stack on purpose. A webfont does not load inside a
 * canvas, so a poster set in Outfit would preview correctly and export with
 * every line in Times — worse than never having used the brand font at all.
 */

const W = 1080;
const PAD = 60;
const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const INK = '#13295c';
const NAVY_TOP = '#1c47a0';
const NAVY_BOT = '#141f52';
const ORANGE = '#ff8e00';
const CARD = '#ffffff';
const MUTED = '#5a6782';

const NAME_SIZE = 34;
const META_SIZE = 23;
const DATE_COL = 132;

/** Escapes text going into SVG. Program names come from a calendar. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Break a line to fit a width.
 *
 * SVG text does not wrap, so this estimates from the glyph width of the
 * stack above — about 0.52em for mixed case. Erring narrow is the safe
 * direction: a line that breaks early looks considered, a line that overruns
 * the card looks broken.
 */
export function wrap(text: string, px: number, size: number, maxLines = 2): string[] {
  const perLine = Math.max(8, Math.floor(px / (size * 0.52)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  let used = 0;

  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (next.length <= perLine) {
      line = next;
      used++;
      continue;
    }
    if (line) lines.push(line);
    if (lines.length === maxLines) {
      line = '';
      break;
    }
    line = w;
    used++;
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Anything that did not fit is marked, rather than silently lost.
  if (lines.length === maxLines && used < words.length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:]$/, '') + '…';
  }
  return lines.length ? lines : [''];
}

type SheetEvent = WeekSheet['days'][number]['events'][number];

/**
 * One event's meta line: "1:30pm – 2:30pm · Hakotel · The Rova"
 *
 * The venue's `chip` is the one to print, and it is the field already built
 * for a line like this: the centre's name where it is the centre, and
 * otherwise the actual place.
 *
 * This used to join `short` and `place`, which put the screen's category
 * label in front of the address — "Off-site, The Rova", "The Shuk, Machane
 * Yehuda Shuk". On the TV that label earns its place, because it is a
 * coloured block doing the work of an icon. On a sheet somebody reads on a
 * phone it is a word in front of the only part they needed.
 */
function metaLine(e: SheetEvent): string {
  return [e.allDay ? 'All day' : e.timeRange || e.time, e.groupLine, e.venue?.chip]
    .filter((x): x is string => Boolean(x && x.trim()))
    .join('  ·  ');
}

/** How tall one event block is, once wrapped. */
function eventHeight(lines: number): number {
  return lines * (NAME_SIZE + 6) + META_SIZE + 18;
}

export interface PosterOptions {
  /** The wordmark as a data: URI. Omitted, the poster prints the name. */
  logoDataUrl?: string | null;
  /** Bottom right. */
  footer?: string;
}

/** The whole poster, as one SVG string. */
export function buildPosterSvg(sheet: WeekSheet, opts: PosterOptions = {}): string {
  const inner = W - PAD * 2;
  const textW = inner - DATE_COL - 40 - 36;

  // Measure first, so the canvas is exactly as tall as the content.
  type Block = { day: WeekSheet['days'][number]; rows: { lines: string[]; meta: string }[]; h: number };
  const blocks: Block[] = sheet.days.map((day) => {
    const rows = day.events.map((e) => ({
      lines: wrap(e.program, textW, NAME_SIZE),
      meta: metaLine(e),
    }));
    const body = rows.reduce((n, r) => n + eventHeight(r.lines.length), 0);
    return { day, rows, h: Math.max(126, body + 34) };
  });

  const headH = 250;
  const footH = 92;
  const gap = 18;
  const bodyH = blocks.length ? blocks.reduce((n, b) => n + b.h + gap, 0) : 144;
  const H = headH + bodyH + footH;

  const parts: string[] = [];

  parts.push(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '" font-family="' + FONT + '">',
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">' +
      '<stop offset="0" stop-color="' + NAVY_TOP + '"/>' +
      '<stop offset="1" stop-color="' + NAVY_BOT + '"/></linearGradient></defs>',
    '<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>',
  );

  // Header
  if (opts.logoDataUrl) {
    parts.push(
      '<image href="' + opts.logoDataUrl + '" x="' + PAD +
        '" y="48" width="250" height="31" preserveAspectRatio="xMinYMid meet"/>',
    );
  } else {
    parts.push('<text x="' + PAD + '" y="74" font-size="30" font-weight="700" fill="#fff">JustOneChesed</text>');
  }

  parts.push(
    '<text x="' + PAD + '" y="160" font-size="56" font-weight="800" fill="#fff" letter-spacing="-1.2">This week at JOC</text>',
    '<text x="' + PAD + '" y="204" font-size="30" font-weight="700" fill="' + ORANGE + '">' + esc(sheet.range) + '</text>',
  );
  if (sheet.hebrewRange) {
    parts.push(
      '<text x="' + (W - PAD) + '" y="204" font-size="26" font-weight="600" fill="#ffffff" ' +
        'fill-opacity="0.72" text-anchor="end">' + esc(sheet.hebrewRange) + '</text>',
    );
  }

  // Nothing on
  if (!blocks.length) {
    parts.push(
      '<rect x="' + PAD + '" y="' + headH + '" width="' + inner + '" height="126" rx="22" fill="' + CARD + '"/>',
      '<text x="' + W / 2 + '" y="' + (headH + 74) + '" font-size="30" font-weight="600" fill="' + MUTED +
        '" text-anchor="middle">Nothing on the calendar this week.</text>',
    );
  }

  // A card per day
  let y = headH;
  for (const b of blocks) {
    const day = b.day;
    parts.push('<rect x="' + PAD + '" y="' + y + '" width="' + inner + '" height="' + b.h + '" rx="22" fill="' + CARD + '"/>');

    const cx = PAD + DATE_COL / 2 + 8;
    parts.push(
      '<text x="' + cx + '" y="' + (y + 46) + '" font-size="22" font-weight="800" fill="' +
        (day.isToday ? ORANGE : MUTED) + '" text-anchor="middle" letter-spacing="1.6">' +
        esc(day.weekdayShort.toUpperCase()) + '</text>',
      '<text x="' + cx + '" y="' + (y + 92) + '" font-size="46" font-weight="800" fill="' + INK +
        '" text-anchor="middle">' + day.num + '</text>',
      '<text x="' + cx + '" y="' + (y + 116) + '" font-size="19" font-weight="700" fill="' + MUTED +
        '" text-anchor="middle" letter-spacing="1.1">' + esc(day.mon.toUpperCase()) + '</text>',
      '<line x1="' + (PAD + DATE_COL + 16) + '" y1="' + (y + 22) + '" x2="' + (PAD + DATE_COL + 16) +
        '" y2="' + (y + b.h - 22) + '" stroke="#e6eaf2" stroke-width="2"/>',
    );

    if (day.isToday) {
      parts.push('<rect x="' + (PAD + 14) + '" y="' + (y + 14) + '" width="8" height="' + (b.h - 28) + '" rx="4" fill="' + ORANGE + '"/>');
    }

    let ey = y + 30;
    const ex = PAD + DATE_COL + 40;
    for (const row of b.rows) {
      for (const line of row.lines) {
        ey += NAME_SIZE;
        parts.push('<text x="' + ex + '" y="' + ey + '" font-size="' + NAME_SIZE + '" font-weight="700" fill="' + INK + '">' + esc(line) + '</text>');
        ey += 6;
      }
      ey += META_SIZE;
      parts.push('<text x="' + ex + '" y="' + ey + '" font-size="' + META_SIZE + '" font-weight="600" fill="' + MUTED + '">' + esc(row.meta) + '</text>');
      ey += 18;
    }

    y += b.h + gap;
  }

  // Footer
  const fy = H - footH + 46;
  const count = sheet.programCount === 1 ? '1 program' : sheet.programCount + ' programs';
  parts.push(
    '<text x="' + PAD + '" y="' + fy + '" font-size="24" font-weight="700" fill="#ffffff" fill-opacity="0.82">' + esc(count) + '</text>',
    '<text x="' + (W - PAD) + '" y="' + fy + '" font-size="24" font-weight="600" fill="#ffffff" fill-opacity="0.6" text-anchor="end">' +
      esc(opts.footer ?? 'justonechesed.org') + '</text>',
  );

  parts.push('</svg>');
  return parts.join('');
}
