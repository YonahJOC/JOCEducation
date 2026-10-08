// HTML for the screen's pieces. The admin panel uses the same functions for its previews,
// so what staff see while editing is exactly what the lobby shows.
import type { ShownEvent, Slide, WeekDay } from './model';
import type { CounterKey } from './types';

export const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const icon = (name: string, style = '') => `<span class="ms"${style ? ` style="${style}"` : ''}>${esc(name)}</span>`;

export function slideHTML(s: Slide): string {
  const v = s.venue!;
  return `<div class="slide">
  <div class="slide-body">
    <div class="slide-label" style="background:${s.labelInk}"><i></i>${esc(s.label)}</div>
    <div class="slide-program">${esc(s.program)}</div>
    <div class="slide-group">${esc(s.groupLine)}</div>
    <div class="slide-time">${icon('schedule')}${esc(s.timeRange)}</div>
  </div>
  <div class="venue-block" style="background:${v.color}">
    ${icon(v.icon)}
    <div class="venue-short">${esc(v.short)}</div>
    <div class="venue-place">${esc(v.place)}</div>
  </div>
</div>`;
}

export function rowHTML(e: ShownEvent, active: boolean): string {
  const v = e.venue!;
  return `<div class="row" style="border-color:${active ? v.color : 'transparent'}">
  <div class="row-time">${esc(e.time)}</div>
  <div class="row-text">
    <div class="row-program">${esc(e.program)}</div>
    <div class="row-group">${esc(e.groupLine)}</div>
  </div>
  <div class="chip" style="background:${v.tint}">${icon(v.icon, `color:${v.color}`)}<b style="color:${v.color}">${esc(v.chip)}</b></div>
</div>`;
}

export function bannerHTML(e: ShownEvent): string {
  return `<div class="banner">${icon('celebration')}${esc(e.program)}</div>`;
}

export function dayHTML(d: WeekDay): string {
  const evs = d.events
    .map((e) => {
      const iconCircle = e.venue
        ? `<div class="day-ev-icon" style="background:${e.venue.tint}">${icon(e.venue.icon, `color:${e.venue.color}`)}</div>`
        : `<div class="day-ev-icon"></div>`; // all-day items carry no location
      return `<div class="day-ev">
    <div class="day-ev-text">
      <div class="day-ev-time">${esc(e.time)}</div>
      <div class="day-ev-program">${esc(e.program)}</div>
      <div class="day-ev-group">${esc(e.groupLine)}</div>
    </div>
    ${iconCircle}
  </div>`;
    })
    .join('');
  return `<div class="day">
  <div class="day-date"><div class="day-dow">${esc(d.dowShort)}</div><div class="day-num">${d.num}</div><div class="day-mon">${esc(d.mon)}</div></div>
  <div class="day-events">${evs}</div>
</div>`;
}

export const STATS: Array<{ key: CounterKey; icon: string; color: string; ink: string; label: string }> = [
  { key: 'acts', icon: 'volunteer_activism', color: '#FFF0E0', ink: '#FA912D', label: 'Acts of chesed' },
  { key: 'beds', icon: 'bed', color: '#E4E9F8', ink: '#2D46AF', label: 'Beds given out' },
  { key: 'challahs', icon: 'bakery_dining', color: '#E3F4E8', ink: '#2FA457', label: 'Challahs baked' },
  { key: 'pizzas', icon: 'local_pizza', color: '#FBE6E3', ink: '#D8412F', label: 'Pizzas made' },
];

export function statHTML(s: (typeof STATS)[number], value: string): string {
  return `<div class="stat" style="background:${s.color}">
  <div class="stat-icon">${icon(s.icon, `color:${s.ink}`)}</div>
  <div class="stat-text"><div class="stat-value" data-stat="${s.key}">${esc(value)}</div><div class="stat-label">${esc(s.label)}</div></div>
</div>`;
}
