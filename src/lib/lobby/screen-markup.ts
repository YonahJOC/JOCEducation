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
 * One programme, filling the panel a school gives its flyers.
 *
 * Drawn as the school's PROGRAM flyer: a mark, the name huge, the details
 * on pills beneath. Both title lines are set nowrap there, which is fine
 * for a flyer somebody wrote to fit and not for "The Kindness Booth- Ben
 * Yehuda" off a calendar — so each line is given a size it fits at.
 */
export function programSlideHTML(e: LobbyEvent): string {
  const words = e.program.trim().split(/\s+/);
  const big = words.length > 1 ? words[words.length - 1] : e.program;
  const small = words.length > 1 ? words.slice(0, -1).join(' ') : '';

  // The panel is about 657px of usable width and Montserrat 800 runs near
  // 0.62em a character.
  const fit = (text: string, max: number) =>
    Math.max(26, Math.min(max, Math.round(657 / Math.max(1, text.length * 0.62))));

  const pills = [e.allDay ? 'All day' : e.timeRange || e.time, e.groupLine, e.venue?.chip]
    .filter((x): x is string => Boolean(x && x.trim()))
    .map((p) => `<div class="ss-pill">${ms('check')}${esc(p)}</div>`)
    .join('');

  return `<div class="ss-fl ss-fl-program ss-blue">
  <div class="ss-bubble"></div><div class="ss-bubble-2"></div>
  <div class="ss-sticker ss-sticker-sm">
    <div class="ss-st-k">${esc(e.label || 'Today')}</div>
    <div class="ss-st-big">${esc(e.allDay ? 'All day' : e.time)}</div>
  </div>
  <div class="ss-pg-icon">${ms(e.venue?.icon || 'volunteer_activism')}</div>
  <div class="ss-pg-title">${
    small ? `<div class="ss-pg-small" style="font-size:${fit(small, 56)}px">${esc(small)}</div>` : ''
  }<div class="ss-pg-big" style="font-size:${fit(big, 124)}px">${esc(big)}</div></div>
  <div class="ss-pg-meta">${pills}</div>
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
