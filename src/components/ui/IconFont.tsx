/**
 * The icon font, for a layout that draws icons.
 *
 * Every icon in the console and the school panel is a ligature: the element
 * contains the word `pending_actions`, and the font turns it into a picture.
 * Without the font the word is what you see, in full, sitting across
 * whatever is beside it.
 *
 * That is exactly what happened to /school/screen. The link was pasted into
 * /admin, into the lobby screen's own page and into a school's TV, and was
 * missed here — so the first page a demo school ever opens had the word
 * "pending_actions" printed over its first heading. Four copies of a line of
 * markup, and the fifth place to need it did not get one.
 *
 * So it is a component now, and adding it is one import. React hoists the
 * link into the head and de-duplicates it, so a page nested inside another
 * layout that already has it costs nothing.
 *
 * `display=block` matters: it keeps the glyph invisible while the font is
 * still coming down the wire, rather than flashing the name and then
 * swapping. The names are never the right answer, so never showing them is.
 *
 * The two screens served as raw HTML — src/app/lobby/route.ts and
 * src/app/school-screen/[slug]/route.ts — write their own <head> and cannot
 * use this; they carry the same href by hand.
 */
export function IconFont() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24..48,600,1,0&display=block"
    />
  );
}
