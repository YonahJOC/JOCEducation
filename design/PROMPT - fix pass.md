# JOC Education Portal: Claude Code handoff (one document)

Repo: `YonahJOC/JOCEducation` (main). The visual reference is `Portal Redesign (standalone).html`, which should be sent with this document; open it in a browser.

**This document has two parts. Do Part 1 first.**
- **Part 1, the fix pass.** The redesign has been built, but it doesn't match the reference. It lists the dozen specific problems and exactly how to fix each one.
- **Part 2, the full redesign spec.** This is what Part 1 is correcting towards. Use it for anything in Part 1 that isn't clear, and for any piece that hasn't been built yet.

Where the two parts disagree, **Part 1 wins**. It was written after reading the code that exists now.

---

# PART 1: Fix pass


The structure is right: one shell, Today pages, tabs, a slot for each program. It looks bad because of about a dozen specific styling decisions. They're listed below with the files they're in.

Keep `Portal Redesign (standalone).html` open next to the running app throughout, and compare against it: 2b is the program console, 3a–3g are the role homes.

**Before you start:** if you have a browser tool (Playwright or similar), screenshot each of these pages at 1280 and 375 before and after, and compare them with the reference:
- `/admin` as each role
- `/admin/my-programs`
- `/admin/programs/kindness-booth` on every tab
- `/admin/programs/joc-app`
- `/school`
- `/home`

Don't mark this done from reading the code alone.

---

## 1. Every row has lost its figure
`TodayRow.band` is one string ("Not paid · 3"), and `TodayPage` / `ProgramTodayPanel` render it as a single 11px mono label inside a coloured block that grows to 170px or more. The result is large coloured slabs with tiny text in them. In the design the band carries **a label and one big figure**.

- Split `band` into `bandLabel` ("NOT PAID") and `figure` ("3", "14 days", "28.5 h") in `lib/today.ts` and `lib/program-today.ts`.
- Render `figure` at 30/800 Outfit with −0.02em tracking (`bandFigure`), with the label above it.
- Make one shared `<BandRow>` component in `src/components/ui/BandRow.tsx`. Its props are `{ tone, label, figure, title, line, action, secondary, chips }`. Use it in `TodayPage`, `ProgramTodayPanel`, `ProgramSchools`, `ProgramLights` and the school Today page. Delete the hand-built copies.

## 2. Too much solid orange
In `TodayPage`, the `warn` tone is a solid `#FA912D` fill, and almost every row is `warn`, so the page reads as a wall of orange. Set up a tone ladder:

| Tone | Band fill | Band text | Use for |
|---|---|---|---|
| `urgent` | `#FA912D` | ink | at most **one** row per screen: the top-weighted one |
| `warn` | `#FFF0E0` | `#C96C00` | everything else that isn't right yet |
| `info` | `#E4E9F8` | `#2D46AF` | somebody asking us something |
| `good` | `#E3F4E8` | `#1D6B37` | a decision or answer came back |
| `system` | `#FBE6E3` | `#A3261A` | env and config problems only |

Programs keep their own `heroColor` for the console header only, never on rows.

## 3. Rows have no title, only a paragraph
The `TodayPage` body is one 17px Newsreader sentence, and some are three lines long: the env row joins every missing variable and its cost with ";".

- Each row gets a **title**: Outfit 19/700, the thing itself, e.g. "Torah Academy of Lakewood" or "3 features switched off".
- Under it goes **one line**: Newsreader 15/1.45 in muted, at most about 90 characters.
- Anything longer goes on the page the action opens, not in the row.

## 4. Buttons stretch into outlined boxes
`primaryButton` has `width: "100%"`, and `secondaryButton` spreads it, so every action is a full-width outlined slab. Every row also uses `secondaryButton`, so no row has a clear next step.

- Remove `width: "100%"` from the token and set it explicitly only where a full-width button is intended (mobile cards, forms).
- Each row gets **one filled primary button**, sized to its text, min-height 46. It may be followed by one blue underlined text link for the secondary action (`textButton`).
- Size the action column to its content with `flex: 0 0 auto`, and right-align it on desktop.

## 5. The interface is narrating its own code
Code comments leaked into the copy. Delete these sentences outright:
- `TodayPage`: "Everything below is true right now and is worked out from the state of things — nothing to mark as read."
- `ProgramTodayPanel`: "Worked out from where every school has got to. Nothing here is a notification — deal with it and it stops appearing on its own."
- `ProgramTodayPanel`: the whole "This program" card ("Everything on this console is … Other coordinators cannot see it…").
- `ProgramConsoleHeader` coordinator banner: shorten it to "Coordinator's view", with a "Back to your view" button.

Rule going forward: **no sentence explains how the software works.** Headings say what the thing is, and rows say what's true. The only help text allowed is in empty states.

## 6. The shell is cramped on desktop
`PortalShell` `<main>` uses `padding: 18px 16px 60px` at every width, which is the phone value. `ProgramConsoleHeader` then bleeds with `margin: -18px -16px` into a 1080 column, so the program's colour band is a boxed rectangle floating in the page.

- In `<main>`, use padding `32px 40px 64px`, dropping to `18px 16px 48px` below 860px. That rule already exists in `globals.css`, so keep it there.
- Render the program header **outside** the 1080 content column. It should span the full main width, with its inner content capped at 1080 and centred, padding `28px 40px 0`, and a decorative orange circle like 2b.
- The page title and Today heading sit at 30/600 with 6px below.

## 7. The tabs are unreadable
The tabs use `label`: 11px mono uppercase at 0.8 opacity on the coloured band.

- Set tabs in Outfit 15/600, sentence case, full opacity, with padding `12px 16px`.
- The active tab is a paper tab with ink text. Inactive tabs are `fg` at 100% with a 2px transparent bottom border that turns white on hover.
- Put the count after the label in mono 12: "Today · 4".

## 8. Plex Mono is everywhere
The mono `label` is used on tabs, "Sign out", need badges and the figures strip, so the whole console looks like a log file.

**Mono is only for:**
- the band label
- dates
- counts
- codes
- step numbers
- the one-line status under a program name

**Never** use it for tabs, buttons, links, nav items or "Sign out".

## 9. The rail
- **"who":** the email is set in Newsreader, so a serif email sits in the rail. Set it in Outfit 13 muted.
- **"Sign out":** Outfit 14/600 at 70% white.
- **Active nav item:** keep the orange left border, and add 8px radius on the right.
- **Hover:** `rgba(255,255,255,.06)`.

## 10. Today tab is a stack of four panels
On `/admin/programs/joc-app` the Today tab renders Needs you, then the slot, then `AppActivityPanel`, then `ProgramReports`, all under each other.

- Today should hold **Needs you** (at most 5 rows, then "Show N more"), then **one** slot panel.
- For the JOC App the slot *is* `AppActivityPanel`; don't render both. `ProgramReports` is the slot for event programs.
- The right column is "Coming up" only.

## 11. Half the console wasn't migrated
`ProgramAdminClient` (the Setup, Calendar and Sign-ups tabs) still has the old styles:
- `fontSize: "10.5px", letterSpacing: "0.2em"` labels
- `rgba(16,35,63,.09)` borders
- a pill "Add them" button (`borderRadius: "9999px"`)
- a `Pill` made with `${color}1f` hex-alpha
- 13.5px body text
- a bordered `card` instead of `rowCard`

It also mounts `FormBuilder` and the calendar with `display: none` instead of rendering conditionally.

- Replace them with tokens: `sectionHeading`, `sectionIntro`, `rowCard`, `field`, `fieldLabel`, `primaryButton`, `plainChip`.
- Render each tab's content conditionally.
- Run this across **all** of `src/` and fix every hit outside `joc-tokens.ts`:
  ```
  grep -rnE '10\.5px|0\.2em|0\.14em|9999px|rgba\(16,35,63|\$\{[a-zA-Z.]+\}1f|#FAFBFD|13\.5px' src/
  ```
  `9999px` is allowed only in the `chip` token.

## 12. Figures strip
`figures` includes `{ label: "Cycle dates", value: "unverified" }`, a word shown as if it were a figure. Make it a `warn` row instead ("8 cycle dates unchecked"). The strip holds real counts only, in a single row of at most 4 cells, with no box around each cell: a mono label above a 24/800 number, as in 3a.

---

## Done when
- Each role's Today, the Kindness Booth console and the JOC App console match 3a–3g and 2b side by side at 1280 and 375: same row anatomy, one solid-orange band at most, buttons sized to their text, readable tabs.
- The grep in §11 returns nothing outside `joc-tokens.ts` and the `chip` token.
- `grep -rn "worked out from\|mark as read\|not a notification\|cannot see theirs" src/` returns nothing.
- No row's line runs past two lines at 1280.
- Attach the before and after screenshots to the commit or PR description.


---

# PART 2: Full redesign spec

Repo: `YonahJOC/JOCEducation` (main). Design reference: `Portal Redesign.dc.html` (open `Portal Redesign (standalone).html` in a browser). Its sections are labelled and referenced below:
- **1r–1s** review and system
- **1a–1b** program page
- **2a–2c** program consoles
- **3n–3g** role homes

Every name and number in the reference is a specimen, with one exception: the counts on 3a come from `AUDIT.md`. Ship no specimen data.

Work in the phases below, in order, and commit after each. Read `AGENTS.md` first: this Next.js differs from what you know.

---

## Rules that don't move
- **Nothing reaches a school.** Leave the send gate in `src/lib/email.ts` untouched. Every action records what a person did after they did it; add no new send path.
- **Real or absent.** No "—", no empty cell, and no 0 standing in for unknown. Say what's missing in words, in `#C96C00`. The current `—` in `SchoolTable`, `ago()`, `fmt()` and the sign-ups table all break this rule; fix them.
- **Students are minors.** A student's name appears only on the supervising teacher's page. Participation figures are always labelled "their estimate".
- **Check capabilities, never roles.** Keep `access.ts` exactly as it is; the redesign only changes which screens each capability reveals.
- **Hold at 375px.** Hit targets are at least 44px. Respect `prefers-reduced-motion`.

---

## Phase 1: one token source, one type system (1s)

**1. Collapse the tokens.** Make `src/lib/joc-tokens.ts` the only source.
- Mirror it into the `@theme` block in `globals.css` so Tailwind and inline styles agree.
- Delete every local `const INK / BLUE / MUTED / RULE / PAPER…` in components and import from tokens instead.
- Retire these values and replace each with the token that carries its meaning:

| Retire | Replace with |
|---|---|
| `#0B1A31` | ink `#10233F` |
| `#F7F8FB` | paper `#FBF9F4` |
| `#4A5872` and every `rgba(16,35,63,.4–.72)` text colour | muted `#4A5A74` |
| `#B8321E` | red `#D8412F` / redText `#A3261A` |
| `#1B7F4B` | green `#2FA457` / greenText `#1D6B37` |
| `#9A5405` and `#FDEEDA` | orangeText `#C96C00` / orangeTint `#FFF0E0` |

   Keep `#1B7F4B` only where it is a program's own `heroColor`.

**2. Load the fonts** in `src/app/layout.tsx` with `next/font/google`:
- **Outfit** 400–800
- **Newsreader** roman and italic, 400 and 500, with the optical-size axis
- **IBM Plex Mono** 400, 500, 600

   Expose them as `--font-outfit`, `--font-newsreader` and `--font-mono`.

**3. Give each font one job.**
- **Outfit:** names, headings, buttons, UI.
- **Newsreader:** anything a person *reads*: program descriptions, stage copy, reasons on rows, report text, help text.
- **Plex Mono:** labels, dates, counts, codes and step numbers.

**4. One label style** replaces the six uppercase variants (10.5/.2em, 11/.14em, 11.5/.22em, 12/.1em, 12/.08em, 13/.12em). Add it to the tokens:
```ts
export const label = { fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase" };
```

**5. One button, three weights, radius 12 everywhere.**
- **Primary:** filled blue with white text.
- **Secondary:** 2px blue border, blue text, white fill.
- **Text link:** blue and underlined.
- **Pills** stay for chips and filters only.
- **Orange fill** stays for one thing: the public "Bring JOC to your school" call to action.
- **No black or ink outlined buttons.** That includes the ink pill "Call" buttons on `/admin`.

**6. Replace emoji icons** (☎ ✉ ◷ 🔒 👁 ✎ ⇅) with Plex Mono type labels in a panel chip: CALL, EMAIL, MEETING, NOTE and so on. The lock screens become a plain heading with one sentence.

---

## Phase 2: the program page (1a, 1b)

Edit `src/app/programs/[slug]/page.tsx`, `components/programs/Stages.tsx` and `StepBar.tsx`.

- **Delete `StepBar`.** The stages must appear once, not twice.
- **Hero, two columns** (stacking below 960 container width, which reuses the existing container queries).
  - **Left:** Plex Mono label ("PROGRAM · EVENT"), the name at 84/700 with −0.04em tracking, the tagline in Newsreader italic 28, the description in Newsreader roman 19, then facts as Plex Mono pill chips: `meta` split on "·", plus the plan it's included in.
  - **Right:** a paper card, radius 20, showing *your next step*.
- **The next-step card has three states:**
  - **Signed out:** "START HERE · STEP 01 OF 04", then "Book a 20-minute meeting", a primary button, then "Already started? Sign in and this card shows your school's step."
  - **Signed in, and the user's school has a `ProgramEnrollment` for this program:** a mini progress rail, "STEP 0N OF 04 · <SHORT>", the stage title, one Newsreader line of what's next, and one primary action. Map enrollment stage to step as follows:

    | Enrollment stage | Step |
    |---|---|
    | `INTRODUCED`, `MEETING_BOOKED` | 1 |
    | `REGISTERED` | 2 |
    | `MATERIALS_SENT` | 3 |
    | `TRAINED`, `LAUNCHED` and after | 4 |

  - **`comingSoon`:** keep today's copy about registration not being open.
- **The path:** the four stages as a horizontal track at ≥720 container width and a vertical rail below that.
  - Nodes are Plex Mono numbers in 58px circles; the rail is the program colour.
  - The **current** station gets a filled node, an orange ring and an orange top border on its card.
  - **Done** stations show "DONE · <date>" in greenText.
  - **Locked** stations keep the dashed style and read "OPENS AFTER <previous>". They must never be a dead link.
- **Mobile, signed in (1b):** the next-step card sits over the bottom of the hero. "YOUR PATH" follows as a compact vertical list. The description collapses under "What is <Program>?".
- **Below the path:** the video beside "In the box", a numbered list with Plex Mono numbers and Newsreader lines, drawn from `whatsIncluded`.

---

## Phase 3: a console for every program (2a–2c)

Edit `src/app/admin/programs/[slug]/*` and `src/app/admin/my-programs/page.tsx`.

**1. `/admin/my-programs`** becomes a grid of program cards.
- Each card has an 8px top strip in the program's `heroColor`, then the name, the kind (tag) in Plex Mono, and who runs it.
  - If no lead is set, say "Nobody is down as running it" in orange.
- A big "N need you today" count sits in orange, or green when it is 0.
- One Plex Mono status line follows, e.g. "8 IN · 23 NOT YET · NEXT RUN SUN 27 SEP".
- Sort by need. A coordinator sees only their own cards.

**2. The console template.** It is the same page for all eight programs.
- **Header band** in `heroColor`, with its foreground from `heroFg()`. It shows "PROGRAM CONSOLE · <TAG> · RUN BY <lead>", the name, and a Plex Mono counts line.
- **Tabs** under the header, as URL search params:
  - **Today** (default)
  - **Schools in:** the existing `ProgramSchools`
  - **Not in yet:** the existing `ProgramLights`
  - **Calendar:** the "Where it is running" list
  - **Sign-ups:** the table, with no "—" in it
  - **Setup:** `FormBuilder`, form swap, coordinators; shown only when `canEditForm || canSetCoordinators`
- **The form builder must no longer be the first thing on the page.**

**3. The Today tab.** A "Needs you" list of band rows, worst first, with a right-hand column holding the program's slot and "Coming up". Compute the rows server-side in a new `src/lib/program-today.ts`:

| Row | Condition |
|---|---|
| **STUCK · N days** | a setup-stage enrollment older than 45 days (reuse `STUCK_DAYS` logic) |
| **NEW SIGN-UP · N days** | a `FormResponse` whose school is still `INTRODUCED` or has no enrollment |
| **NO WRITE-UP · N days** | a past `ProgramEvent` with no `EventReport` after 5 days; only once the ambassador tables exist, and hidden until then |
| **DECIDED · date** | an `AdminMeetingItem` with an outcome since the coordinator last looked |
| **Unannounced run** | an upcoming run within 14 days that isn't published |

**4. The program slot.** Replace the `slug === "joc-app"` special case with a registry keyed by program `tag` or slug:

| Program | Slot | Data |
|---|---|---|
| JOC App | `AppActivityPanel` | exists |
| Event (Kindness Booth) | "From the booth" | needs `EventReport` |
| Ongoing (Bake for Chesed) | "This month's cycle" | needs data |
| Just One Tutor | "Pairs this week" | needs data |
| One-time (Assembly) | "Bookings" | exists (`ProgramEvent`) |
| Trip | "The group" | needs data |
| Chesed Match | "Placements" | needs data |

   A slot with no data source yet renders one sentence in orange saying what isn't recorded yet. It never shows an empty chart.

**5. Keep `?as=coordinator`** working, restyled as an ink banner with a secondary button.

---

## Phase 4: one shell, and Today for every role (3n–3g)

**1. One shell component**, `src/components/shell/PortalShell.tsx`, used by both `/admin/layout.tsx` and `/school/layout.tsx`.
- It has the same structure on both sides: rail, header and content, with a 1080 content max.
- **JOC side:** ink `#10233F` rail and the white wordmark, with the role in Plex Mono orange.
- **School side:** panel `#F4F7FD` rail and the ink wordmark, with the school name in Plex Mono orange.
- **Main area:** paper on both sides.
- The rail becomes a top bar with scrolling nav below 860px, as it does today.

**2. Navigation by job, built from capabilities.** Show at most 7 items, and only items the person can open.

| Role | Nav |
|---|---|
| Super admin | Today · Schools · Programs · Admin meeting · Teaching material · Money · People & access |
| Educational team (ADMIN) | Today · Lessons · Resources · Chesed Cycles · Programs · Words on the site · Teachers' Board |
| Programming team | Today · Calendar · Programs · Schools · Admin meeting · Chesed Cycles |
| Program coordinator (lead, no capability) | one item per program they run, with its colour dot and its need count · My meeting items · Back to the site |
| School admin | Today · Our programs · Teachers · Ambassadors · Plan & seats |
| School app admin | Today · Our programs · Chesed activity · Ambassadors |

   Put secondary pages (files, rooms, products, forms, coverage, demos, orders, pricing, roles, site) as tabs or links *inside* those sections. They must not be sidebar items.

   Teachers and JOC staff keep the public header; staff get no console link (unchanged).

**3. `/admin` becomes Today for everyone who can open the console.** It is a role-aware list of band rows built in `src/lib/today.ts`. Each row has a type label, a figure (how long, how many), one Newsreader line and one action.
- **Super admin:**
  - **system health:** missing env vars that switch features off, especially `CRON_SECRET`; read from `boot.ts`
  - overdue payments
  - `LAPSED` schools
  - new demo requests
  - the next admin meeting with item and decided counts
  - a Plex Mono figures strip underneath, with real counts only
- **Educational team:**
  - cycle and grade-band cells with no published lesson in the next cycle (from coverage)
  - lessons unpublished for more than 14 days
  - unverified cycle dates
  - board posts waiting
  - a coverage mini-grid
- **Programming team:**
  - runs this week that aren't announced
  - schools on Discuss first waiting for review
  - unchecked cycle dates
  - a 7-day strip
- **Coordinator:** redirect to their program's Today tab. With more than one program, show the 2a cards.
- **Delete `/admin/guide` as a landing page.** Move each section's "what this is" text into that page's empty state, and keep `PageIntro` collapsed.

**4. `/school` gets a Today page.**
- **School admin:**
  - each program's current step, with its one action, from `ProgramEnrollment`
  - invited teachers who haven't signed in
  - renewal date and seats used
- **App admin:**
  - hours to approve, from `AppSchoolStats`, with its as-of time
  - unread ambassador reports, once those exist
  - no plan or money anywhere

**5. `/home` for teachers.** A blue cycle card carries the cycle number and week in Plex Mono, the theme in Outfit and the guiding question in Newsreader italic. It is followed by one band row for this week's lesson for their grade, then chips for saved lessons and anything new.

---

## Phase 5: clean-up that the design depends on
- Remove `FALLBACK_PROGRAMS` in `Footer.tsx`. Make the static fallbacks in `programs.ts` and `lessons.ts` say they couldn't load rather than showing a stale list.
- Delete the `Stat` model.
- Every page title uses one scale: page 30/600, section 24/700, row name 19/700.

## Done when
- `grep -rn "#0B1A31\|#F7F8FB\|#4A5872\|#B8321E\|rgba(16,35,63,\.[4-7]" src/` returns nothing outside `joc-tokens.ts`.
- `grep -rn '"—"' src/` returns nothing.
- Each of the six role accounts lands on a Today page that matches 3a–3g side by side at 1280 and 375.
- All eight program consoles open on Today with a slot that is either live or says in words what isn't recorded yet.
- The program page shows the stages once, and a signed-in coordinator sees their school's step without scrolling.

Update `AUDIT.md` with what changed.
