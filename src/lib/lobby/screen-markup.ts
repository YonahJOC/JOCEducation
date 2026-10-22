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
/**
 * A family, as opposed to a school group or a seminary.
 *
 * It is whatever somebody typed into the group box, so this reads the word
 * rather than a flag: "the Weidenfeld family", "Cohen Family" and "the Levy
 * family" all match, and "Machon Maayan" and "Birthright Volunteer" do not.
 */
const FAMILY = /\bfamil(y|ies)\b/i;

/**
 * "the Weidenfeld family" → "The Weidenfeld Family".
 *
 * Only the two things that are certainly wrong are touched: the opening
 * letter, and the word family itself. The surname is left exactly as it was
 * typed, because nothing here knows whether it is de Vries, Ben-Zion or
 * O'Brien, and a rule clever enough to guess is a rule that gets somebody's
 * name wrong on a wall in their own building.
 */
function familyName(group: string): string {
  const s = group.trim().replace(FAMILY, (m) => m[0].toUpperCase() + m.slice(1).toLowerCase());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function programSlideHTML(e: LobbyEvent): string {
  const v = e.venue;
  const time = esc(e.allDay ? 'All day' : e.timeRange || e.time);

  /**
   * A family who are here right now get greeted rather than listed.
   *
   * They are standing in front of this screen, in a building they have
   * probably never been in, and the card was telling them the name of the
   * activity they already know they came for. So the family takes the big
   * slot, the greeting sits above it, and what they are here for moves down
   * beside the time — where it is still read, but second.
   *
   * Only while it is happening: a family listed for Thursday is not in the
   * room, and a wall that welcomes an empty doorway means nothing by it.
   */
  if (/^happening now$/i.test(e.label) && FAMILY.test(e.groupLine)) {
    return `<div class="slide">
  <div class="slide-label" style="background:#ff8e00"><i></i>Welcome</div>
  <div class="slide-body">
    <div class="slide-hello">Welcome to Just One Chesed!</div>
    <div class="slide-program">${esc(familyName(e.groupLine))}</div>
  </div>
  ${v ? `<div class="venue-pill" style="background:${esc(v.color)}">${ms(v.icon)}${esc(v.chip)}</div>` : ''}
  <div class="slide-time">${ms('schedule')}${time}${e.program ? ` &middot; ${esc(e.program)}` : ''}</div>
</div>`;
  }

  return `<div class="slide">
  <div class="slide-label" style="background:${esc(v?.color || '#214ba5')}"><i></i>${esc(e.label || 'Today')}</div>
  <div class="slide-body">
    <div class="slide-program">${esc(e.program)}</div>
    ${e.groupLine ? `<div class="slide-group">${esc(e.groupLine)}</div>` : ''}
  </div>
  ${v ? `<div class="venue-pill" style="background:${esc(v.color)}">${ms(v.icon)}${esc(v.chip)}</div>` : ''}
  <div class="slide-time">${ms('schedule')}${time}</div>
</div>`;
}

/**
 * What the slide slot shows when the diary has run out.
 *
 * There are two fallbacks before this one — today's programmes, then the
 * rest of the week — and both are empty the moment nobody has typed
 * anything in for a while. That used to collapse the panel and hand its
 * space to the shout-out, which is a tidy way to fail and still leaves the
 * wall saying less than it could.
 *
 * So it asks the one question that is true on any day of the year, and the
 * wall keeps its shape. Nothing here reads from the diary, deliberately:
 * this is the card that cannot itself go stale.
 */
export function standingSlideHTML(): string {
  // The question leads; the mark and the name sign it underneath. A
  // programme slide puts its chip on top because the chip says when it is
  // on and you need that before the name — this one has nothing to say
  // first, so the question gets the top of the card.
  // The question is the only thing in the flow, so the card centres on the
  // question rather than on the question plus everything under it. The mark
  // and the name are lifted out and pinned to the foot: a signature should
  // not decide where the sentence sits.
  return `<div class="slide slide-stand">
  <div class="slide-body">
    <div class="slide-program">Did you do your just one chesed today?</div>
  </div>
  <div class="stand-sign">
    <div class="slide-standing">${ms('volunteer_activism')}</div>
    <div class="slide-label" style="background:#ff8e00"><i></i>Just One Chesed</div>
  </div>
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
