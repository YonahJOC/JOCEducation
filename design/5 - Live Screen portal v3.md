# Prompt for Claude Code — Live Screen portal redesign (v3)

Paste everything below the line into Claude Code, run from the root of `YonahJOC/JOCEducation`. Also put `Live Screen Portal v3.dc.html` into the repo (e.g. `design/Live Screen Portal v3.dc.html`) so Claude Code can open it as the visual reference.

---

You're redesigning the school Live Screen portal in this repo — the pages a **teacher** and a **student ambassador** use to feed their school's hallway TV. The visual target is `design/Live Screen Portal v3.dc.html`. Open it in a browser and use the floating "Prototype" bar to switch between Ambassador/Teacher, Phone/Desktop, and the three data states. Copy its layout, hierarchy, spacing and copy. Build it from the components and tokens that already exist; don't copy the prototype's code.

## Hard rules — do not change behaviour
- **Two approvals stay exactly as they are**: `src/lib/school-screen/stages.ts` (`canApprove`, `canEndorse`, `decisionFor`) and the server actions in `src/app/actions/school-screen.ts`. Only APPROVED reaches the TV. Nothing in the UI may suggest an ambassador can publish.
- **Do not touch the TV**: `src/school-screen/*`, `public/school-screen/*`, `src/lib/school-screen/markup.ts`. Flyer previews must keep using `FlyerPreview` (the TV's own markup at 745×752).
- **Leave these behaviours alone**:
  - `shoutOutFrom` decides how a shout-out's name or grade is shown.
  - Photos can't be uploaded without the media-consent tick.
  - `flyerWarnings` stays warnings only and never blocks a save.
  - Ambassadors join with a code, two places per program.
  - JOC never emails or messages a student.
- Use `src/lib/joc-tokens.ts` (`C`, `R`, `T`, `F`, `HIT`) for every colour, radius and type size. Don't add new literals; if something is missing, add a token.
- Every tap target is at least 44px (`HIT`). Orange text on paper uses `C.orangeText`. The "On the screen" status chip uses `C.greenText`, not `C.green` (that pairing fails contrast). Fix this in `ui.tsx` `STATUS`.

## 1. One shell for both roles
- **Problem:** `/school/*` uses `PortalShell`, but `/ambassador/*` has its own small header in `src/app/ambassador/layout.tsx`.
- **Fix:** give both the same shell.
  - **Top bar (60px, white, hairline bottom):** JOC wordmark | school name | a "LIVE · {n} SLIDES" pill linking to Live Screen | avatar, name and role line ("Teacher · final say" / "Ambassador · {program}").
  - **Left nav (desktop, 256px, white):** Home, Live Screen, Uploads & approvals, Message center. Material Symbols icons: `home`, `slideshow`, `inventory`, `forum`.
    - Badges only on Uploads (number waiting for this person) and Message center (unread from JOC; hidden for ambassadors).
    - "Open the TV ↗" pinned at the bottom.
    - Labels never wrap. The active item gets a blueTint fill and blue text.
  - **Phone (below `BP.cards`):** the same four items as bottom tabs (icon over an 11px label; ambassadors see "Updates" in place of "Messages"). The top bar shrinks to wordmark + avatar.
- **Routes:**
  - Teacher: `/school` (home), `/school/screen`, `/school/uploads`, `/school/messages`, `/school/ambassadors` (reached from Home, not in the nav).
  - Ambassador: `/ambassador`, `/ambassador/screen`, `/ambassador/uploads`, `/ambassador/updates`.
  - Update `src/lib/nav.ts`. The ambassador nav must still show nothing about plans, money or other schools.
  - `/ambassador/join` keeps no nav.

## 2. One page header, used everywhere
Make a `PageHeader` component (`src/components/ui/`) and use it at the top of every page in this area:
- `{ back?, title, sub, actions }`.
- Title is `T.title` (30px Outfit 600). Sub is 15px muted with a max of about 620px.
- Actions sit on the right and wrap below on a phone.
- No small uppercase label above the title. Content max width is `CONTENT_MAX`.
- **Remove** the blue hero banners with the orange circle, and the paragraphs copied from code comments. Keep one short line under each title.

## 3. Surfaces
- **Cards:** every card is white, `1px solid C.hairline`, 16px radius, no shadow. Lists inside cards are rows separated by `C.rule`.
- **Ink is for the TV only:** `C.ink` is used only for panels that show the TV (the live preview, the "How it looks on the TV" preview, the go-live moment). This is deliberate; it's how a user learns that dark navy means "on the screen".
- **Tints:** only on chips, status labels and small icon tiles, never on whole cards.
- **Fonts:**
  - Outfit for the interface.
  - Newsreader only for what a person wrote (shout-out text, reports, messages).
  - Plex Mono only for small data: slide index, "3 OF 12", codes, the TV's "ON THE SCREEN NOW" label.

## 4. Home
**Teacher (`/school`)**
- **Left (2/3) — "Needs you":** one card listing each item with an icon tile, a title, a one-line sub and a chevron. Each row links somewhere. In order, only when they apply:
  - "{n} passed on by your ambassadors" → Uploads
  - "{n} nobody has looked at yet" → Uploads
  - "{n} set aside by an ambassador" → Uploads, Set aside tab
  - "{n} new messages from JOC" (sub: reader · program) → Message center
  - "{n} ambassador reports to read" → Ambassadors
  - "No dedication set for today" → Live Screen, Dedication tab
  - Empty state: "You're all caught up."
- **Left, below:** an "Your ambassadors" row with stacked avatars, "{n} running {m} programs", and a Manage button.
- **Right (1/3):**
  - An ink card "ON THE SCREEN NOW" with the rotating `FlyerPreview` (about 8s), the slide index, the title and a Manage link.
  - Below it, a white "Today's dedication" card (Hebrew name in Frank Ruhl Libre, plus Change).
- **First run** (no approved slides showing): the left card becomes "Get your screen going" with four steps — give a student a code; put up your first flyer; set today's dedication (inline form); set your school email domain (inline input). The right card shows a dashed placeholder: "JOC's Chesed Minute — until your first flyer goes up".

**Ambassador (`/ambassador`)**
- The heading is "Hi, {first}" with the sub "You run {program}, and you get first look at the hallway screen."
- **When a flyer of theirs just went up:** a quiet "It's up" row (thumbnail, title, "Passed on by X · put up by Mrs. Y").
- **First-look card:** icon tile, "{n} waiting for your first look", and a "Start first look" button.
- **"Your uploads" card:** the 4 newest, each with a thumbnail, a status in words and a thin 3-part progress bar (Sent in → Passed on → On the screen; blue while moving, orange when up). Plus "See all".
- **Right:** the same ink "on the screen now" card, with "{n} of {m} slides are up because you passed them on."
- **First run:** a "How it works" card with three numbered steps and the buttons "Make the first flyer" and "Upload a photo".
- The existing report-writing (`AmbassadorHome` → `ReportForm`) stays, reached from a secondary action. Don't remove it.

## 5. Live Screen (`ScreenEditor.tsx` → split into tabs)
- **Header:** the title "Live Screen" with the actions "Open the TV" (secondary) and "New flyer" (primary).
- **Tabs (underline style):**
  - Teachers: Slideshow · Photos · Shout-outs · Dedication · Settings.
  - Ambassadors: Slideshow · Photos only, view-only.
- **Slideshow:**
  - Filter chips: On the screen · Coming up · Came down.
  - A list card of rows: position number, a 52px `FlyerPreview` thumbnail, the title, a meta line ("Flyer · Event · Oct 22 → Oct 29"), a status chip, up/down reorder buttons, edit and delete.
  - Reordering writes the flyer's existing `sort` field, so no schema change is needed.
  - An ink preview card is pinned on the right.
  - Footnote: "About eight seconds a slide, in this order. An event comes down the day after it happens."
- **Photos:** a grid with a status chip and delete. "Upload a photo" is in the section.
- **Shout-outs:** rows with the quote in Newsreader, "On the screen: — Dovid Klein, 11th grade", a status chip, and "Take down" / "Approve after all".
- **Dedication:** the existing form (Day · Name in Hebrew, RTL · Line under it) inline, then rows of upcoming dedications.
- **Settings:** the existing four fields. The "no school email domain" warning moves into this tab.

## 6. Uploads & approvals (new page, built from `ApprovalQueue.tsx`)
- **Header:** title, one line, and a single "Upload" primary action, which opens the flyer/photo form.
- **Tabs:**
  - Teachers: "Waiting for you {n}" · "Set aside {n}".
  - Ambassadors: "Waiting for you {n}" · "Your uploads {n}".
- **Waiting, desktop — a list view by default:**
  - Each row has a checkbox, thumbnail, title, and "Kind · Sent in by X · Passed on by Y". A PENDING item seen by a teacher reads "Passed on by nobody yet — you're first".
  - Inline buttons per row: "Not this one / Put it up" for teachers, "Set aside / Pass it on" for ambassadors.
  - **Select many:** a blueTint bar appears — "{n} selected · Clear · {no} · {yes}". Bulk calls the existing `decideFlyer` / `decidePhoto` / `decideShoutOut` once per item; no new action is needed.
  - A List / "One by one" toggle sits on the right of the tab bar.
- **Waiting, phone (and "One by one"):**
  - One card at a time with a stack hint behind it, "1 of {n}", the kind chip, the `FlyerPreview` on an ink panel (or the shout-out quote plus "on the screen it will say …"), the title, and "Sent in by / Passed on by".
  - Two 60px buttons: no on the left, yes on the right. Yes is orange with ink text for teachers and blue for ambassadors.
- **Set aside (teacher):** rows with "Set aside by X · sent in by Y", "Agree, leave it" and "Put it up anyway". This replaces the collapsible section under the queue.
- **Your uploads (ambassador):** the full list with progress bars, and Edit while it's still PENDING.
- **Empty state:** a check icon, "Nothing waiting — nice work", and one line.
- **Ambassadors' own uploads must not appear in their own Waiting tab** (filter `createdById !== userId` in `editor-data.ts` for the endorse queue). This is a product decision — confirm with Yonah before merging.

## 7. Add / edit flyer (`FlyerForm.tsx`)
- **Breadcrumb:** "← Uploads & approvals" (or "← Live Screen" when a teacher edits from there).
- **Form card:** split into sections with dividers — Template (3 cards) · What it says · Picture and QR code · When it's on the screen.
- **Footer bar:** a note on the left ("A teacher looks at it before it goes on the screen." / "Goes live in the hallway within a minute."), then Cancel and the primary button on the right.
- **Right column (sticky):** an ink "HOW IT LOOKS ON THE TV" card with the `FlyerPreview`, then the guideline warnings (orangeTint) and any error.
- **Photo upload:** the same layout — slot, caption, the consent row (must be ticked) and the footer.

## 8. The go-live moment (new)
When a teacher's yes (single, bulk, or "Put it up anyway") makes something APPROVED and showing:
- **Layout:** a full-screen ink overlay with confetti, "LIVE NOW · MAIN HALLWAY" in mono, the `FlyerPreview` in an ink-bordered frame, and "It's on the screen." (Outfit 700, about 52px).
- **Copy:** "Everyone who walks down {school}'s main hallway will see it in the next {n} minutes." Credits as chips: "Sent in by X" · "Passed on by Y" · "Put up by you". Bulk adds "And {n} more went up with it."
- **Buttons:** "See the screen" and "Next one · {n} left" / "Back to the screen".
- **Motion:** respect `prefers-reduced-motion` (no confetti).
- **Toasts:** every other decision gets a toast with Undo (an ink pill, bottom). Undo calls the decide action again with the previous state.

## 9. Message center
- **Teacher:** keep `SchoolMessages.tsx`, restyled. The left list (300px) shows the reader's initials with the program-colour dot, the program, the reader (orange when it's the fallback "no coordinator yet"), and the last line or "Read by X · no reply yet". The thread header is one line ("Tova Lerner · Chesed Squad") with the reader's line under it. Bubbles are at most 520px wide; the message box is pinned to the bottom with "X sees it next time they open the JOC console."
- **Ambassador "Updates" (new, read-only):** a list derived from their own items' statuses and from reports their teacher has read (`seenBySupervisorAt`). Nothing is sent. Footnote: "JOC never messages students."

## 10. Ambassadors (`AmbassadorsPanel.tsx`)
- A breadcrumb "← Home".
- **"Give a student a place":** program chips, "Make a code", and "{n} places left on this one". The made code is shown at 40px with Copy.
- **"Codes waiting to be used":** rows with "Cancel it".
- **The roster:** one card of rows — avatar, name, "{program} · since {date} · {n} passed on · {n} reports", an unread chip, "Read reports" (expands Newsreader report cards and marks them seen), and "Finished", which opens an inline confirm: "Has Rivka finished running Chesed Squad? Everything Rivka passed on stays up…" → "Not yet" / "They've finished".
- "Finished" ambassadors are listed as one line underneath.

## Done when
- Both roles share the shell, and every page uses `PageHeader`.
- There are no hero banners with blobs, and no whole-card tints.
- At 390px wide nothing scrolls sideways, the nav labels don't wrap, and every control is at least 44px.
- The teacher's queue on desktop opens as a list and bulk approve works. Phone opens one card at a time.
- Approving shows the go-live overlay; every other decision shows a toast with Undo.
- The slideshow order can be changed and is what the TV plays (`sort`).
- Existing tests pass (`tests/school-screen/*`). Add tests for any new pure helpers, such as the "needs you" list builder and the ambassador updates feed.
- Update `design/README.md` to point at v3 as the reference.
