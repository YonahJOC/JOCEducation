# Prompt for Claude Code

Paste everything below into Claude Code from inside this folder.

---

Build a production lobby-screen web app for **Just One Chesed (JOC)** that shows visitors our programs on TVs at our center. The visual design is final. Match `design/JOC Lobby Screen.html` exactly: open it in a browser and use it as the pixel reference. `design/JOC Lobby Screen.dc.html` contains the same design as readable source, with all the layout, colors, sizes and data logic.

## Stack
- Vite + vanilla TypeScript (or React if you prefer), static build, no backend server.
- Deploy target: Netlify (or Cloudflare Pages). Add the config file and a short deploy section in README.
- Config via env vars: `VITE_GCAL_ID`, `VITE_GCAL_API_KEY`, `VITE_SHEET_ID` (optional), `VITE_REFRESH_MIN` (default 5), `VITE_SLIDE_SEC` (default 8).

## Screen
- Fixed 1920×1080 canvas, scaled to fit any screen (letterboxed, no scrollbars, cursor hidden).
- Font: Outfit (UI) and IBM Plex Mono (data), the JOC portal fonts. Icons: Material Symbols Rounded (filled).
- Colors: JOC tokens only (same as `src/lib/joc-tokens.ts`). Blue `#2D46AF`, ink `#10233F`, orange `#FA912D` (fill only), orangeText `#A85B00`, panel `#F4F7FD`, muted `#4A5A74`, onDarkBody `#C6CFF0`, onDarkLabel `#FFD8AE`, and the green/red/blue/orange tints.
- Layout (see the design file):
  1. **Header:** white JOC logo (`public/logo-white.png`; use the repo's `public/brand/joc-wordmark-white.png`), a date pill and a large clock pill.
  2. **Today panel (left):** an auto-sliding carousel of all of today's remaining programs (label "Happening now" / "Next up" / "Later today", program, group, time range, plus a colored location block with icon), progress dots, and below it the list of today's programs as cards, with the current slide's card highlighted in its location color.
  3. **Coming up (right):** a white card for each of the next N days that have programs (default 4), with a yellow date block and up to 2 programs each, every program showing a location icon.
  4. **Impact row (bottom):** 4 colored cards (acts of chesed, beds given out, challahs baked, pizzas made) whose numbers count up on load.
- Never show a partially cut-off row or card: if something doesn't fully fit, hide it.

## Data: Google Calendar
- Calendar API v3 `events.list` on a **public** calendar with an API key: `singleEvents=true`, `orderBy=startTime`, from today to 8 days out. Refresh every `VITE_REFRESH_MIN` minutes. If a fetch fails, keep showing the last good data and show a small "offline" note.
- **Filter out** titles that contain: out of office, away, OOO, private (configurable list).
- **Program / group parsing:** read titles in the form `Program - Group`, `Program – Group`, `Program | Group` or `Program with Group`. A `Group: X` line in the event description overrides the group. Expand abbreviations from a map (`BAB=Build A Bed`); for example "BAB Cohen Family" becomes program "Build A Bed", group "Cohen Family". If there's no group, show "Open to all visitors".
- **Location type**, read from the event's Location field (an empty Location means the JOC Center):
  - center (`home_pin`, `#2D46AF`): joc center, chesed center, efrat
  - shuk (`storefront`, `#A85B00`): shuk, machane yehuda, market
  - usa (`flag`, `#A3261A`): usa, ny, nj, ma, il, ca, fl, md, new york, chicago, teaneck, brooklyn
  - other (`location_on`, `#1D6B37`): anything else; show the first part of the location string.
- All-day events show as yellow banners on the current day and as "All day" items in Coming up, with no group or location line.
- All times are shown in Asia/Jerusalem.

## Data: impact counters
- Read from a Google Sheet (tab `Counters`, columns `key,value`, keys `acts,beds,challahs,pizzas`) using the Sheets API with the same key, refreshed hourly. If no sheet is configured, fall back to the values in `config.ts`.

## Kiosk behavior
- Reload the page every night at 3:00 so it picks up code updates and starts with a fresh browser state.
- Add a `?demo=1` mode that uses the built-in sample data (see `sample()` in the design source).
- Add a `?debug=1` overlay that shows the last fetch time and any errors.

## Deliverables
- The working app, README covering: Google Calendar setup (public calendar, API key restricted to the Calendar + Sheets APIs and the site's address), Sheet format, deploy steps, and how to set up a Fire TV / Chromecast with Fully Kiosk Browser.
- Unit tests for title parsing, location classification and filtering.
