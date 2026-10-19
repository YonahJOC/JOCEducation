import type { LobbyEvent } from './screen-data';

/**
 * The three pieces the lobby wall has that a school's wall does not.
 *
 * The screen is a school's live screen — same canvas, same classes, same
 * stylesheet copied across — and these fill the slots where a school shows
 * a flyer, a shout-out and its grade tiles. A school's own markup module is
 * left alone: thirty screens read it.
 */

export const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const ms = (name: string, style = '') =>
  `<span class="ss-ms"${style ? ` style="${style}"` : ''}>${esc(name)}</span>`;

/**
 * One programme, in the shape the lobby wall has always drawn.
 *
 * Not the school's flyer. A flyer is a poster somebody composed, with a
 * name short enough to set at 124px; a programme off a diary is a name,
 * who is coming and when, and "The Kindness Booth- Ben Yehuda" has to wrap
 * rather than be cropped or shrunk to nothing. So: the label, the name,
 * the group, the time, and the venue in its own colour beside them.
 *
 * The markup is the original's, down to the class names — the stylesheet
 * carries the rules it came with.
 */
export function programSlideHTML(e: LobbyEvent): string {
  const v = e.venue;
  return `<div class="slide">
  <div class="slide-body">
    <div class="slide-label" style="background:${esc(v?.color || '#214ba5')}"><i></i>${esc(e.label || 'Today')}</div>
    <div class="slide-program">${esc(e.program)}</div>
    <div class="slide-group">${esc(e.groupLine)}</div>
    <div class="slide-time">${ms('schedule')}${esc(e.allDay ? 'All day' : e.timeRange || e.time)}</div>
  </div>
  ${
    v
      ? `<div class="venue-block" style="background:${esc(v.color)}">
    ${ms(v.icon)}
    <div class="venue-short">${esc(v.chip)}</div>
  </div>`
      : ''
  }
</div>`;
}

/** The three tiles, where a school shows hours by grade. */
export function tilesHTML(
  tiles: { label: string; value: string; unit: string; icon: string; on?: boolean }[],
): string {
  const body = tiles
    .map((t) => {
      // Six figures need more room than three, and a tile is a third of the
      // card — the long ones step down rather than running off the edge.
      const long = t.value.replace(/\D/g, '').length >= 5;
      return `<div class="ss-tile${t.on ? ' on' : ''}">
    <div class="ss-tile-h"><div class="ss-tile-l">${esc(t.label)}</div>${ms(t.icon)}</div>
    <div class="ss-tile-n${long ? ' ss-long' : ''}">${esc(t.value)}</div>
    <div class="ss-tile-s">${esc(t.unit)}</div>
  </div>`;
    })
    .join('');

  return `<div class="ss-gr-head">
  <div class="ss-gr-k">${ms('volunteer_activism')}Our impact</div>
</div>
<div class="ss-gr-tiles ss-three">${body}</div>`;
}
