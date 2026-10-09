# JOC: Claude Code handoff

Open Claude Code at the root of `YonahJOC/JOCEducation`. Copy `design/` into the repo's `design/` folder, then paste one prompt at a time.

## Prompts
1. **`1 - Lobby screen (build from scratch).md`**: the original lobby TV build. *Already done in the repo; kept here for reference.*
2. **`2 - Lobby screen JOC colours.md`**: switches the existing `/lobby` to JOC tokens, fonts and the white wordmark.
3. **`3 - My desk redesign - final.md`**: restyles My desk and the sidebar to the final design (8a / 8b), with states 7a–7k and a full checklist of existing features that must keep working.

4. **`4 - My desk match 8a - pass 2.md`**: run after prompt 3. Fixes the visual gaps between the live desk and artboard 8a (sidebar, blue band, card headers, green This week, scratchpad). Behaviour is frozen.

## design/
- `My Desk Redesign.dc.html`: open in a browser; artboards **8a / 8b** (final) and **7a–7k** (states) are the reference for prompt 3.
- `JOC Lobby Screen.dc.html`: the lobby reference (JOC colours) for prompt 2.
- `JOC Lobby Screen.html`: an older single-file export of the lobby, made before the colour switch; use the `.dc.html` instead.
- `JOC Portal Design System Repair.dc.html`: the token, type, radius, focus and hit-area spec all the prompts follow.
- `8a-target.png`: the 1440×900 target render for prompt 4.
- `current-build.png`: what the live desk looked like before prompt 4.
- `support.js`: needed for the `.dc.html` files to open.
- `public/brand/`: the logo files the designs load.
- `reference-google-calendar.png`: the calendar screenshot the lobby was built from.
