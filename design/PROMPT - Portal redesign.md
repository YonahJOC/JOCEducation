# Claude Code prompt: redesign the JOC Education Portal ("Paper & Ink")

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
