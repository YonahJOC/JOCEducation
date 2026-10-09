# Prompt for Claude Code — lobby screen: switch to JOC colours

Paste everything below into Claude Code at the root of `YonahJOC/JOCEducation`.

---

The lobby screen (`/lobby`) is built and working. Change only its colours, fonts and logo so that it uses the JOC tokens in `src/lib/joc-tokens.ts`. Don't change the layout, sizes, spacing, data, parsing or timing. The updated design reference is `design/JOC Lobby Screen.dc.html`; I'll overwrite it with the new version I'm attaching.

## Files to change
- `src/lobby-screen/screen.css` (the source) and `public/lobby/screen.css` (its built or served copy). They must end up identical, or regenerate the second from the first, whichever is how this repo already works.
- `src/lobby-screen/main.ts` and `src/lib/lobby/markup.ts`: wherever the venue palette, stat colours or label colours are defined in JS.
- `public/lobby/screen.js`, if it carries the same palette (it's the served build; rebuild it rather than hand-editing it, if there's a build step).
- `src/lib/lobby/config.ts`: `LOGO_URL`.
- `src/components/lobby/admin.css`: the `--focus` variable only.

## Colour map (old → new token)
| Old | New | Token |
|---|---|---|
| `#1450d2` | `#2D46AF` | `C.blue` (canvas background, clock text, titles, times, active dot) |
| `#0a2a7a` | `#10233F` | `C.ink` (stage letterbox) |
| `#0b1d3f` | `#10233F` | `C.ink` (all dark text) |
| `#edf3fd` | `#F4F7FD` | `C.panel` (Today panel) |
| `#e3ecfd` | `#E4E9F8` | `C.blueTint` (row time chip, center venue tint) |
| `#4a5d7e` | `#4A5A74` | `C.muted` |
| `#c3cfe0` | `#CBD3EE` | `C.outline` (inactive carousel dot) |
| `#b9cdf5`, `#dbe6ff` | `#C6CFF0` | `C.onDarkBody` (text on blue) |
| `#ffd166` as a **fill** (banner, day-date block) | `#FA912D` with `#10233F` text | `C.orange` (6.86:1) |
| `#ffd166` as **text or icon on blue** (Coming up icon, `.status .warn`) | `#FFD8AE` | `C.onDarkLabel` |
| `rgba(11,29,63,.92)` (debug overlay) | `rgba(16,35,63,.92)` | `C.ink` at .92 |

## Venue palette `[strong, onDark, tint]`
- center: `#2D46AF`, `#C6CFF0`, `#E4E9F8`
- shuk: `#A85B00`, `#FFD8AE`, `#FFF0E0` (orangeText: passes as text and as a fill under white text)
- usa: `#A3261A`, `#FBE6E3`, `#FBE6E3`
- other: `#1D6B37`, `#E3F4E8`, `#E3F4E8` (replaces the purple `#7a4fe0`, which isn't a JOC colour)
- The slide label pill: "Happening now" `#A85B00`, other slides `#2D46AF`.

## Impact cards `{ background, icon }`
- acts: `#FFF0E0`, `#FA912D`
- beds: `#E4E9F8`, `#2D46AF`
- challahs: `#E3F4E8`, `#2FA457`
- pizzas: `#FBE6E3`, `#D8412F`

Text on every card stays `#10233F`.

## Fonts
- Replace Figtree with **Outfit** (already loaded by `src/app/layout.tsx` as `--font-outfit`; if `/lobby` is served outside the Next layout, load Outfit 400–800 from Google Fonts in its HTML).
- Replace JetBrains Mono with **IBM Plex Mono** (`--font-mono`).
- Outfit has no 900 weight: change every `font-weight: 900` to `800`.

## Logo
- `LOGO_URL` = `/brand/joc-wordmark-white.png` (already in `public/brand/`). Then the screen no longer depends on justonechesed.org and the logo works offline.

## Admin focus
- In `admin.css`, set `--focus: 0 0 0 3px rgba(45, 70, 175, 0.28)` (that's C.blue). Nothing else in the admin changes.

## Check
- Search the lobby files afterwards for `#1450d2`, `#0a2a7a`, `#0b1d3f`, `#ffd166`, `#7a4fe0`, `#e8690a`, `#e2334a`, `Figtree` and `JetBrains`: none should remain.
- Every remaining hex should be in `C` in `joc-tokens.ts`, or `#fff`.
- Run `vitest`: the lobby tests cover parsing and the model, not colour, so they must still pass unchanged.
- Open `/lobby?demo=1` and compare it side by side with `design/JOC Lobby Screen.dc.html`.
