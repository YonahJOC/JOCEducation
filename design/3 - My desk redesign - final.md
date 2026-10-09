# Prompt for Claude Code: My desk redesign (final: artboards 8a / 8b)

Paste everything below into Claude Code at the root of `YonahJOC/JOCEducation`. First, copy this folder's `design/` into the repo's `design/` folder. Open `design/My Desk Redesign.dc.html` in a browser and use:
- **8a** (a normal day) and **8b** (a busy day): the final look.
- **7a–7k**: how each part looks when it's scrolled, empty, mid-action or full. Match these states.
- `design/JOC Portal Design System Repair.dc.html`: the tokens, type scale, radii, focus ring and hit-area rules.

---

Restyle the staff console's **My desk** (`src/components/mydesk/*`) and the console sidebar to match artboards **8a / 8b** in `design/My Desk Redesign.dc.html`.

**This is a visual and layout change only. Staff already use this page every day, so every existing feature, server action, data field and edge case must keep working exactly as it does now.** Don't rename or remove anything in `@/app/actions/my-desk`, `@/lib/my-desk` or `@/lib/desk`. Don't change the database or the shape of `getMyDesk()`. If something in the mock can't be done without breaking existing behaviour, keep the behaviour and tell me.

## Comfort rules (apply everywhere on the desk)
- Only **one saturated fill** per screen: the blue greeting band (`C.blue`). Everything else uses tints: blueTint, greenTint, orangeTint.
- The page ground is `C.paper` and the cards are `C.white`. Text is `C.ink`; never pure black.
- Prose is Newsreader at 16–19px. UI text is Outfit at 15px or more. Meta is IBM Plex Mono 11px in `C.faint`.
- Motion: only the 1.5s greenTint flash on a newly added row, and the cheer message after a tick. No looping animation. Respect `prefers-reduced-motion`.

## Sidebar (the console nav, wherever it's rendered)
- Width **216px**. Background `C.onDarkBody` (#C6CFF0; ink on it is 10.18:1), no right border. The colour wordmark `/brand/joc-wordmark.png` at the top.
- Each item:
  - Minimum height 46px (the hit area is the full 216px row), radius 12px.
  - A 32px icon tile with radius 10px, holding a Material Symbols Rounded icon in its section colour.
    - Desk and Admin meeting: `C.blue`
    - Office and Teaching material: `C.orangeText`
    - Schools and Money: `C.greenText`
    - Programs: `C.redText`
  - Label in Outfit 15px ink, no wrapping.
  - Icons: home, apartment, school, volunteer_activism, groups, menu_book, payments.
- Inactive item: the tile is white and the row is transparent. Hover: `rgba(255,255,255,.55)`.
- Active item: the row is white, the tile is that section's tint, the icon is filled and the label is 700.
- The user card is pinned to the bottom: a white card with the orange `C.orange` avatar, the name, the role and a logout icon. Keep **Back to the site** and **Sign out**.
- Don't change any routes or permissions.

## Desk layout (`MyDesk.tsx` + `globals.css`)
1. **Greeting band**
   - `C.blue`, R.hero, padding 24px 30px.
   - Left side:
     - The `dateLine(desk.now)` mono line in `C.onDarkLabel` (keep **both** the Gregorian and Hebrew dates).
     - The greeting at 40px/800 white: "Good morning / Good afternoon / Good evening, {firstName}", based on `desk.now` in the viewer's timezone. Signed out, it reads "Your desk".
     - A one-sentence recap in Newsreader 18–19px `C.onDarkBody`, generated from the data, e.g. "Six things for today, three waiting on others."
     - If the tray is non-empty, append the names in `C.onDarkLabel`: "Gilad, Rivka and Maimonides need you."
     - With nothing at all, it reads "Nobody's waiting on you."
   - Right side: a **Today at JOC** tile.
     - `C.orangeTint` background, with a white 44px icon box holding the venue icon.
     - The next public program from the lobby calendar (`src/lib/lobby/*`; reuse its parsing and venue logic).
     - Plus "+N MORE".
     - If nothing is on, hide the tile.
2. **Grid:** two columns, `1.5fr / 1fr`.
   - Left: **Your list** (Tasks).
   - Right: **For you** (only when the tray isn't empty), then **This week**, then **Scratchpad**.
   - The page doesn't scroll; each card scrolls inside itself, as now.
   - Below 980px: one column with the page scrolling, in this order: For you, Your list, This week, Scratchpad.
   - Keep the `joc-desk` / `joc-desk-grid` classes.
3. **When the right column runs out of room** (8b): For you shows its first item plus "N more · show all". This week scrolls internally with a greenTint fade. The Scratchpad folds to a 64px orangeTint bar ("Scratchpad · N PAGES") that expands when tapped. Space priority: For you, then This week, then Scratchpad.

## Cards
- **Your list** (`Tasks.tsx`; artboards 7a–7g)
  - Header: a 40px blueTint icon tile with `task_alt`, the title "Your list" at T.section, and the existing `N TODAY · N OPEN` count. **No progress bar.**
  - Add row: `C.panel` background with an outline border, a `+` icon, an 18px input, the **FOR** button, Today/Later, and a filled blue **Add** (it becomes **Send** when handing off).
    - Focused: a 1.5px blue border plus a 4px blueTint ring (7c).
    - Handing off: the row turns white, FOR fills ink, colleague chips (40px) open underneath, and a hint line shows "ENTER ↵ SENDS TO {NAME}" (7d).
  - The header and add row are pinned; only the rows scroll. Group heads (Today / Later / Waiting on others) are `position: sticky` with a soft shadow while content passes under them (7b). A white fade at the bottom shows there's more, and hides at the end (7a). The scrollbar is thin, in `C.outline`.
  - Rows are at least 64px:
    - A 30px tick inside a 44px hit area. Done is a `C.green` fill with a white check.
    - Text is 18px.
    - Pills: **Today** (Later rows) and **Nudge** / **Nudged ✓** (hand-offs), 44px tall, blueTint / orangeTint.
    - The × is 44px.
  - A new row flashes greenTint for 1.5s (7c). After a tick, show the session-only cheer: "Nice, that's one off your plate" / "All done for today. Yasher koach!" (7f).
  - Hand-off status colours (7e): NOT OPENED `C.faint` · SEEN / ON THEIR LIST `C.blue` · NUDGED `C.orangeText` · DECLINED `C.destructive` · DONE `C.greenText`.
  - Empty state (7g): a greenTint `wb_sunny` tile plus the existing copy.
- **For you** (`ForYou.tsx`; 7h)
  - White card with a 2px `C.orange` edge, and an orangeTint `inbox` tile with the "N NEW" count. Hidden when empty.
  - All existing actions and rules stay (checklist below). Buttons are 44px: Add to my tasks (filled blue), Reply (blue text), Decline (destructive) / Clear (muted).
- **This week** (`YourDay.tsx`; 7i, 7j)
  - greenTint card with a white `calendar_month` tile.
  - The date block is 56px: today's items show their **time** on a blue fill; later days show weekday plus day number on white.
  - Each row has an icon by type (call, groups, or the venue icon for school bookings).
  - "+ Add" (44px) in the header opens **the same form** inline, inside a white panel.
- **Scratchpad** (`Notebook.tsx`; 7k)
  - orangeTint, rotated −0.8deg, with the shadow `0 2px 0 #FFD8AE, 0 10px 24px rgba(168,91,0,.12)`.
  - "ONLY YOU SEE THIS" in `C.orangeText`. Newsreader 18–19px body.
  - Page tabs are 40px (active: ink fill). When there are many, they scroll sideways under a pinned dashed **+ Page**.
  - SAVING… / SAVED (SAVED in `C.greenText`), plus Delete and Make it a task.

Use only the tokens in `src/lib/joc-tokens.ts` (see the design-system sheet for the corrected `faint` #5A6782 and `orangeText` #A85B00). Every control is at least 44px. Every `:focus-visible` gets a ring: 3px ink outline, 2px offset, and a 2px white halo.

## Must keep: functionality checklist (test each one)

**Tasks**
- [ ] Add a task with Enter **and** with the Add button. An empty draft or a pending save does nothing.
- [ ] The **FOR** picker lists "Me" plus every `staff` member as chips under the row. Picking a person makes the add `handOff(text, id)`.
- [ ] While handing off, the placeholder says "What should {name} do?", the Later option reads **"This week"**, and the hint reads "ENTER ↵ SENDS TO {NAME}".
- [ ] Today / Later → `addTask(text, later)`.
- [ ] Groups appear only when they have items: **Today**, **Later**, **Handed off · waiting on others**.
- [ ] The **"N done"** toggle shows and hides finished tasks, mine and handed-off ones together.
- [ ] Tick and untick → `tickTask(id, !done)`. A done task is struck through and faint.
- [ ] Handed-off rows show the other person's Initial, never a tick.
- [ ] Handed-off meta shows `NAME · STATUS` in the right colour for each of the six statuses.
- [ ] **Today** on Later rows → `moveTask(id, false)`.
- [ ] **Nudge** on open hand-offs → `nudge(id)`.
- [ ] × → `dropTask(id)` on every row.
- [ ] The empty state shows when there are no tasks at all.
- [ ] `t.meta` still renders.

**For you**
- [ ] The "N NEW" count. Each item shows Initial, who plus verb, the quote clamped to 3 lines, and the source meta.
- [ ] **Add to my tasks** → `acceptTask(id)` for kind "task", otherwise `trayToTask(kind, id, "who: quote…80")`.
- [ ] **Reply** appears only when `canReply`, and goes to `/admin/schools`.
- [ ] **Decline** (`declineTask`) for tasks, **Clear** (`clearFromTray`) for everything else.
- [ ] Buttons are disabled while pending.

**This week (Your day)**
- [ ] The "N THING(S) TODAY" count.
- [ ] The form keeps its labelled fields: What is it? / When (Today, Tomorrow + a date input) / Time ("leave empty for all day") / Who with, or where (optional).
- [ ] Enter submits from the title and the note fields.
- [ ] Empty title → **the note becomes the name**. Both empty → "Write what it is first."
- [ ] Server errors from `addDeskEvent` show in place. On success the form resets and closes. Cancel closes it.
- [ ] Today's items show a time or ALL DAY; later items show weekday plus date. `d.meta` renders.
- [ ] × only on `d.own` → `dropDeskEvent`.
- [ ] Dates use the viewer's own timezone (`ymd()`).
- [ ] The empty state "Nothing booked this week…".

**Scratchpad (Notebook)**
- [ ] Opens writable. The first keystroke creates the page through `savePageOrCreate`, and the returned id is reused.
- [ ] Autosaves 400ms after typing; SAVING… / SAVED.
- [ ] Tabs, the "Untitled" fallback, and **+ Page** → `newPage("")`.
- [ ] Editable title plus body.
- [ ] **Make it a task** → `pageToTask(title || first line)`.
- [ ] **Delete** → `dropPage`, only with more than one page and a saved page.
- [ ] Still keyed on the set of page ids. The timer is cleared on unmount.

**Page-level**
- [ ] Signed out, it shows "Your desk".
- [ ] **Health** (`Health.tsx`) still renders where it does today, collapsed by default. Fix its "ONLY YOU SEE THIS" colour to `C.faint`.
- [ ] Works at 375px: one column, 44px controls, no horizontal scroll.

## Done means
- Every box above has been checked by hand, with seeded data covering: no tasks; all three groups plus done tasks; a tray with 1 item and with 4 items (one task-kind, one replyable); your own and school events, today and later; 1 page and 5 pages; and a 900px-tall window where the right column has to fold (8b).
- Add tests for the recap sentence (0 / 1 / many; with and without hand-offs and tray names) and for the greeting's time-of-day switch.
- No server action, type or route has been renamed. `git diff --stat` touches only `src/components/mydesk/*`, the sidebar component, `globals.css` (the desk grid and the focus rule) and tests.
- Write a short summary of anything you couldn't match to the mock and why.
