import type { ShownEvent, Slide, WeekDay } from './model';

/**
 * The lobby wall's pieces, in the school screen's shape.
 *
 * The wall used to have a layout of its own. It is now the same drawing a
 * school's live screen uses — a 1920×1080 canvas, a big slide on the left, a
 * card and some tiles on the right, a band along the foot — so the two read
 * as one family. These are the lobby's own versions of those pieces, drawn
 * with the same `ss-` classes.
 *
 * Kept apart from `src/lib/school-screen/markup.ts` on purpose. That file
 * draws thirty schools' live screens, and the fastest way to break them all
 * would be to start bending it to suit this one wall.
 */

export const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const ms = (name: string, style = '') =>
  `<span class="ss-ms"${style ? ` style="${style}"` : ''}>${esc(name)}</span>`;

/**
 * One programme, filling the big panel.
 *
 * Built as the school screen's PROGRAM flyer: a mark, the name huge, a line
 * under it. A programme name is usually two words and a place, which is
 * exactly what that flyer was drawn for.
 */
export function slideHTML(s: Slide, on: boolean): string {
  const v = s.venue;
  // The last word big, anything before it smaller above — the same split the
  // school flyer uses, so "The Kindness Booth" does not have to shrink to fit.
  const words = s.program.trim().split(/\s+/);
  const big = words.length > 1 ? words.slice(-1)[0] : s.program;
  const small = words.length > 1 ? words.slice(0, -1).join(' ') : '';

  const meta = [
    s.allDay ? 'All day' : s.timeRange || s.time,
    s.groupLine,
    v?.chip,
  ].filter((x): x is string => Boolean(x && x.trim()));

  // Both lines are set nowrap, so a long name has to be given a size it
  // fits at rather than being cropped at both ends. The panel is about
  // 657px of usable width and Montserrat 800 runs near 0.62em a character —
  // a school's flyer never hit this because its names are two words, and
  // "The Kindness Booth- Ben Yehuda" is five.
  const fit = (text: string, max: number) =>
    Math.max(26, Math.min(max, Math.round(657 / Math.max(1, text.length * 0.62))));

  return `<div class="ss-slide${on ? ' on' : ''}">
  <div class="ss-fl ss-fl-program ss-blue">
    <div class="ss-bubble"></div><div class="ss-bubble-2"></div>
    <div class="ss-sticker ss-sticker-sm"><div class="ss-st-k">${esc(s.label)}</div><div class="ss-st-big">${esc(
      s.allDay ? 'Today' : s.time,
    )}</div></div>
    <div class="ss-pg-icon">${ms(v?.icon || 'volunteer_activism')}</div>
    <div class="ss-pg-title">${
      small ? `<div class="ss-pg-small" style="font-size:${fit(small, 56)}px">${esc(small)}</div>` : ''
    }<div class="ss-pg-big" style="font-size:${fit(big, 124)}px">${esc(big)}</div></div>
    <div class="ss-pg-meta">${meta
      .map((m) => `<div class="ss-pill">${ms('check')}${esc(m)}</div>`)
      .join('')}</div>
  </div>
</div>`;
}

/** The bar across the foot of the slide: what this list is, and where in it. */
export function capHTML(kicker: string, n: number, active: number, line: string): string {
  const dots =
    n > 1
      ? `<div class="ss-cdots">${Array.from({ length: n }, (_, i) => `<div class="ss-cdot${i === active ? ' on' : ''}"></div>`).join('')}</div>`
      : '';
  return `<div class="ss-cap-head">
  <div class="ss-cap-k">${ms('today')}${esc(kicker)}</div>
  ${dots}
</div>
<div class="ss-cap-t">${esc(line)}</div>`;
}

/** A day in the Coming up card. */
export function upDayHTML(d: WeekDay): string {
  const evs = d.events
    .map((e) => {
      const where = e.venue
        ? `<div class="ss-up-where">${ms(e.venue.icon)}${esc(e.venue.chip)}</div>`
        : '<div></div>';
      return `<div class="ss-up-ev">
      <div>
        <div class="ss-up-time">${esc(e.allDay ? 'All day' : e.time)}</div>
        <div class="ss-up-name">${esc(e.program)}</div>
        ${e.groupLine ? `<div class="ss-up-group">${esc(e.groupLine)}</div>` : ''}
      </div>
      ${where}
    </div>`;
    })
    .join('');

  return `<div class="ss-up-day">
  <div class="ss-up-date">
    <div class="ss-up-dow">${esc(d.dowShort)}</div>
    <div class="ss-up-num">${d.num}</div>
    <div class="ss-up-mon">${esc(d.mon)}</div>
  </div>
  <div class="ss-up-evs">${evs}</div>
</div>`;
}

/** An all-day item, as a pill above the Coming up list. */
export function bannerHTML(e: ShownEvent): string {
  return `<div class="ss-pill">${ms('celebration')}${esc(e.program)}</div>`;
}

/** One of the three tiles under the Coming up card. */
export function tileHTML(t: { label: string; value: string; unit: string; icon: string; on?: boolean }): string {
  // A six-figure number needs more room than a three-figure one, and the
  // tile is a third of a column — so the long ones step down a size rather
  // than running off the edge.
  const long = t.value.replace(/\D/g, '').length >= 5;
  return `<div class="ss-tile${t.on ? ' on' : ''}">
  <div class="ss-tile-h"><div class="ss-tile-l">${esc(t.label)}</div>${ms(t.icon)}</div>
  <div class="ss-tile-n${long ? ' ss-long' : ''}">${esc(t.value)}</div>
  <div class="ss-tile-s">${esc(t.unit)}</div>
</div>`;
}
