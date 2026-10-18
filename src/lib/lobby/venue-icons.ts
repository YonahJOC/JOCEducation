import type { VenueType } from './types';

/**
 * The venue marks, drawn rather than typed.
 *
 * The screen sets these as Material Symbols ligatures, which is right for a
 * web page and useless here: the share poster is turned into a PNG through a
 * canvas, and a canvas will not load a webfont. A poster built from
 * ligatures would preview correctly on the page and export with the word
 * "storefront" sitting where the icon should be.
 *
 * So each one is a path, in a 24×24 box, matching the icon the TV uses for
 * the same venue. Drawn with `fill-rule: evenodd` holes rather than strokes,
 * so they scale to any size without a line weight to re-tune.
 */
export const VENUE_ICON_PATHS: Record<VenueType, string> = {
  // home_pin — a pin with a house in it
  center:
    'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 3.6 4 3.1V13h-2.8v-2.6h-2.4V13H8V8.7l4-3.1Z',
  // storefront — an awning over a shop front
  shuk:
    'M4 4h16v2.2l1 3.3a2.6 2.6 0 0 1-2.5 3.3c-.6 0-1.2-.2-1.7-.6-.5.4-1.1.6-1.8.6s-1.3-.2-1.8-.6c-.5.4-1.1.6-1.8.6s-1.3-.2-1.8-.6c-.5.4-1.1.6-1.7.6A2.6 2.6 0 0 1 3 9.5l1-3.3V4Zm1.2 10.6c.4.1.8.2 1.2.2.6 0 1.2-.1 1.8-.4.6.3 1.2.4 1.8.4s1.2-.1 1.8-.4c.6.3 1.2.4 1.8.4s1.2-.1 1.8-.4c.6.3 1.2.4 1.8.4.4 0 .8-.1 1.2-.2V20H14v-5h-4v5H5.2v-5.4Z',
  // flag — a pole and a banner
  usa: 'M6 2h1.8v20H6V2Zm3.2 1.2h10L17 7.4l2.2 4.2h-10V3.2Z',
  // location_on — the plain pin
  other: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z',
};
