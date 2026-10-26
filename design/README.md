# JOC: Claude Code handoff

Open Claude Code at the root of `YonahJOC/JOCEducation`. Copy `design/` into the repo's `design/` folder, then paste one prompt at a time.

## Prompts
1. **`1 - Lobby screen (build from scratch).md`**: the original lobby TV build. *Already done in the repo; kept here for reference.*
2. **`2 - Lobby screen JOC colours.md`**: switches the existing `/lobby` to JOC tokens, fonts and the white wordmark.
3. **`3 - My desk redesign - final.md`**: restyles My desk and the sidebar to the final design (8a / 8b), with states 7a–7k and a full checklist of existing features that must keep working.

4. **`4 - My desk match 8a - pass 2.md`**: run after prompt 3. Fixes the visual gaps between the live desk and artboard 8a (sidebar, blue band, card headers, green This week, scratchpad). Behaviour is frozen.

5. **`5 - Live Screen portal v3.md`**: the Live Screen portal — the pages a teacher and a student ambassador use to feed the hallway TV. **This is the current reference for anything in `/school/screen`, `/school/uploads`, `/ambassador/*` or `src/components/school-screen/`.**

   It names `design/Live Screen Portal v3.dc.html` as its visual target. **That file is not in this folder.** Sections 1, 2 and 4–10 were built from the prose alone, so the structure and the copy follow the prompt and the spacing, hierarchy and the look of the go-live moment are the implementation's own. If the `.dc.html` turns up, reconcile against it rather than assuming the build matches.

   Three things in the built version deliberately differ from the prompt, each for a reason written into the commit that made it:
   - **The toast is not an "Undo".** The decide actions take a yes or a no, so there is no way back to `ENDORSED`. It offers the opposite action under an honest label instead.
   - **The demo portal is three pages, not two.** Approving moved off the Live Screen page, so a demo school sealed out of `/school/uploads` could not put anything on its own screen.
   - **The teacher's rail was not cut to four items.** `/school` is the whole school portal, not only the screen, and Plan & seats and the rest still have to be reachable. The screen's own items were added to the existing rail instead.

## design/
- `My Desk Redesign.dc.html`: open in a browser; artboards **8a / 8b** (final) and **7a–7k** (states) are the reference for prompt 3.
- `JOC Lobby Screen.dc.html`: the lobby reference (JOC colours) for prompt 2.
- `JOC Lobby Screen.html`: an older single-file export of the lobby, made before the colour switch; use the `.dc.html` instead.
- `JOC Portal Design System Repair.dc.html`: the token, type, radius, focus and hit-area spec all the prompts follow.
- `JOC School Screen v6.dc.html`: the hallway TV itself — what the flyers, photos and shout-outs look like once they are up there. The portal feeds this; it does not change it.
- `Screen Flyer Guidelines.dc.html`: what makes a flyer readable from down a corridor. `flyerWarnings` in `src/lib/school-screen/rules.ts` is this, as code.
- `8a-target.png`: the 1440×900 target render for prompt 4.
- `current-build.png`: what the live desk looked like before prompt 4.
- `support.js`: needed for the `.dc.html` files to open.
- `public/brand/`: the logo files the designs load.
- `reference-google-calendar.png`: the calendar screenshot the lobby was built from.
