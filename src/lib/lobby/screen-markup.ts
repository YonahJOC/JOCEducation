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
  <div class="slide-label" style="background:${esc(v?.color || '#214ba5')}"><i></i>${esc(e.label || 'Today')}</div>
  <div class="slide-body">
    <div class="slide-program">${esc(e.program)}</div>
    ${e.groupLine ? `<div class="slide-group">${esc(e.groupLine)}</div>` : ''}
  </div>
  ${v ? `<div class="venue-pill" style="background:${esc(v.color)}">${ms(v.icon)}${esc(v.chip)}</div>` : ''}
  <div class="slide-time">${ms('schedule')}${esc(e.allDay ? 'All day' : e.timeRange || e.time)}</div>
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

/**
 * The shout-out card, with the cycle in it.
 *
 * A school's version takes its topic from the Cycle it is running and asks
 * everybody the same question — "Who made a difference to you this week?"
 * — which stops being read by about the third week.
 *
 * The lobby's carries the theme itself in the pill, Hebrew and all, and
 * asks whatever is set against that theme in the panel. The question is the
 * headline, because that is the thing somebody is meant to answer; the
 * theme is the context for it.
 */
export function lobbyShoutHTML(
  post: { text: string; from: string } | null,
  theme: { en: string; he: string; question: string },
): string {
  const pill = theme.en
    ? `<div class="ss-so-topic">${ms('menu_book')}${esc(theme.en)}${
        theme.he ? `<span class="so-topic-he" dir="rtl">${esc(theme.he)}</span>` : ''
      }</div>`
    : '';

  const head = `<div class="ss-so-head">
  <div class="ss-so-k">${ms('campaign')}Chesed shout-out</div>
  ${pill}
</div>`;

  if (post) {
    /**
     * The question stays up, under the heading, once somebody has answered.
     *
     * It used to be the card's headline and nothing else, so the first
     * approved shout-out took it off the wall — and with it the only thing
     * telling the next person what to send. A wall that stops asking stops
     * being answered. Small, because the shout-out is what people read;
     * present, because it is what makes them write one.
     */
    // A long one is set smaller rather than allowed to overrun the card.
    const size = post.text.length > 95 ? 34 : 40;
    return `${head}
${theme.question ? `<div class="ss-so-q">${esc(theme.question)}</div>` : ''}
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${size}px">“${esc(post.text)}”</div>
  ${post.from ? `<div class="ss-so-from">${esc(post.from)}</div>` : ''}
</div>`;
  }

  return `${head}
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">${esc(theme.question)}</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`;
}
