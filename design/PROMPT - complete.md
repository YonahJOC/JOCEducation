# JOC Education Portal: complete Claude Code prompt

**Repo:** `YonahJOC/JOCEducation` (main). Read `AGENTS.md` first.

**Visual reference:** `Portal Redesign (standalone).html`, sent with this document. Open it in a browser. Its sections are labelled:
- **1** the system and the program page
- **2** the program consoles
- **3** the role homes
- **4** schools before the full site, and money
- **5** the school's side of each program

Every name and number in it is a specimen, except the counts on 3a, which come from `AUDIT.md`. Ship none of them.

## Order of work
1. **Part 1:** make what's already built match the design.
2. **Part 2:** replace the category folders on the Schools tab with filters and one list.
3. **Part 3:** the access state (`FULL_SITE` / `PROGRAMS` / `PUBLIC`), the "not yours yet" page, and the `Payment` record plus the money screens. Build `Payment` before any money screen.
4. **Part 4:** the school's side of each program. It depends on Part 3's access state.
5. **Part 5** is the original full spec. Use it for anything the parts above don't cover.

Commit after each part. **If two parts disagree, the earlier part wins, except that Part 3's access state replaces anything in Part 5 about plans.**

## Rules that hold everywhere
- **Nothing reaches a school.** Don't touch the send gate in `src/lib/email.ts`. Every action records what a person did. The only thing a school can send is an inbound ask, and nothing is sent to them.
- **One school's data never appears in another school's view.** Money that can't be attributed to a school is shown to nobody.
- **Real or absent.** No "—", no empty cell, no 0 standing in for unknown. A grant is never $0, a refund is never netted off, and plan money is never split across programs. When something is missing, say so in words, in `#C96C00`.
- **Students are minors.** A student's name appears only to their supervising teacher. Participation figures are always labelled "their estimate".
- **Check capabilities, never roles.**
- **Hold at 375px.** Hit targets are at least 44px.
- **Screenshot every screen at 1280 and 375,** compare it side by side with the reference, and attach before and after images to each commit or PR. Don't mark anything done from reading the code alone.



---

# PART 1: Fix pass (do this first)

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

# PART 2: Schools tab fix

**Files:**
- `src/components/admin/ProgramSchools.tsx`
- `src/components/admin/ProgramLights.tsx`
- `src/components/ui/RowGroup.tsx`

**Reference:** `Portal Redesign (standalone).html`, sections 2b and 2c. Also the traffic-light spec: filter chips, then one list.

## What's wrong (from the screenshot)
Merging "Schools in" and "Not in yet" produced seven `RowGroup`s:
- Running
- Being set up
- Stopped
- Reach out
- Discuss first
- Hold off

(Six groups are listed here; the seventh wasn't identified.) Each is a full `BandRow`-sized card with a band, a count, and a sentence.

1. **Zeros get full rows.** "STOPPED 0 · No school has stopped." appears three times on one screen, and each takes a 170px card to say nothing. An empty category is not an item.
2. **The groups look exactly like school rows.** Same card, same band, same big figure. A reader can't tell a folder from a school, and `BandRow` is supposed to mean *a school, a fact, an action*.
3. **The schools are hidden.** "Show 36" is the only way to see any school at all. The one list that matters is closed by default.
4. **The open group gets a 3px blue ring** that fights the whole page.
5. **The bands don't line up.** "DISCUSS FIRST" is wider than the other bands, so its sentence starts 30px to the right of the rest.
6. **The traffic-light housing is missing** from the group, although it's the feature's motif.

## The fix: filters above one list, not folders
Delete the `RowGroup` usage in both components. **Don't use `RowGroup` for categories anywhere.** Delete the component if nothing else imports it.

**1. One heading and one chip bar per list.**

```
Schools in Kindness Booth  ·  8
[ All 8 ] [ Running 5 ] [ Being set up 3 ]                    ← Stopped only appears if > 0

Not in Kindness Booth yet  ·  36
[ All 36 ] [ ● Reach out 36 ]                                 ← Discuss first / Hold off only appear if > 0
```

   - **Chip shape:** 44px tall, pill radius, Outfit 14/600. Count in mono 12 after the label.
   - **Selected:** ink fill (`C.ink`) with white text.
   - **Unselected:** white fill with a 1px `C.hairline` border and ink text.
   - **Light chips** carry a 10px dot in the light's colour before the label. No other colour on the chip.
   - **Selection** lives in the URL: `?in=running`, `?light=green`.
   - **A chip whose count is 0 is not rendered.** If every chip but "All" would be hidden, render no chip bar.

**2. Under the chips, the school rows themselves, open by default.** Each is the existing `Row` or `LightRow` `BandRow`, sorted as specified:
   - **"in":** furthest along, then stuck longest
   - **"not in":** green, orange, red, then by name

   Show 12, then a "Show all 36" `textButton` below the list, not inside a card.

**3. Empty lists get one line, not a card.** For example:
   - "No school is in Kindness Booth yet."
   - "Every school on the system is already in Kindness Booth."

   Set it in Newsreader 16, muted, 12px top margin. No band and no zero.

**4. The band has a fixed width.** In `BandRow`, set the band to `flex: 0 0 188px` (`100%` below 560px) with `box-sizing: border-box`. Labels may wrap to two lines. They must never widen the band. Every row's title starts at the same x.

**5. The light row's band** is the dark housing, then the word ("Reach out", 20/800 in the light's text colour), on the light's tint. That's already written in `LightRow`/`Housing`. It simply never shows while the groups are shut. Check it renders at 1280 and 375.

**6. No outline for "open".** Remove the `2px`/`3px` blue ring on expanded rows or groups everywhere. An open row is shown by its detail panel (paper background, hairline top border), nothing else.

**7. Remove the explainer sentences.** Delete these:
   - "Every school on the system, whether or not it is in {program} yet. Open a category to see who is in it."
   - the `LINE` strings
   - the `NONE` strings

   The chip counts say all of that.

## Order on the tab
1. The heading and chips for Schools in, then its rows
2. The heading and chips for Not in yet, then its rows
3. The next admin meeting ink card, only when it holds items for this program. Otherwise one orange line, "No admin meeting is booked", shown only if there are orange or red schools.
4. "Run the rules now" and "Reconcile with the calendar" as text links in a small footer row, for people with the capability.

## Done when
- The screenshot above can't happen: no card on the page displays a `0`.
- `grep -rn "RowGroup" src/` returns nothing, or only the component's own file if another page still uses it legitimately.
- At 1280 the Kindness Booth tab shows at least 6 real school rows without a click.
- Every band on the page has the same width, and the traffic-light housing is visible on every not-in row.
- Screenshot at 1280 and 375, compared side by side with 2b and 2c before you finish.


---

# PART 3: Schools before the full site, and the money record

**Reference:** `Portal Redesign (standalone).html`, section 4 (4a–4f). Every name and number in it is a specimen.

Two jobs. Build them in this order, because the money screens can't be drawn until the record in step 2.1 exists.

---

## Rules
- **Nothing reaches a school.** The ask is inbound only: it files an `Inquiry` against the school, like a demo request, and sends nothing to the school.
- **Check capabilities, never roles.**
- **Real or absent.** A grant is never $0. Plan money is never split across programs. A refund is never netted off a total. When a figure is unknown, say so in words, in `#C96C00`.
- **Hold at 375px.** Hit targets are at least 44px.

---

## 1. Schools on their programs, before the full site (4a–4d)

**Who this is for:** every school the full website hasn't been launched for yet. For now, that's **all of them**, including schools that already have a subscription, and schools with one program, several, or none yet. It is not a "single-program" mode: a school with five programs gets five heroes and five header items.

**1.1 A derived access state.** Add `School.fullSiteLaunchedAt DateTime?` (null for every school today). In `access.ts`, add `accessState(school)`, which returns one of three values:
- `FULL_SITE`: `fullSiteLaunchedAt` is set **and** the school has an active `Subscription`
- `PROGRAMS`: anything else where the school has at least one `ProgramEnrollment` at `REGISTERED` or later that isn't `ENDED`
- `PUBLIC`: signed in, with no live program and no full site

Launch is one date per school, set by a super admin. Everything else is derived, so no role or flag needs remembering.

- A paid school without a launch date is still `PROGRAMS`. The subscription is recorded (section 2); it just doesn't open the site yet.
- A `PUBLIC` school sees the 4d header with only "What else JOC does". Add a capability `program.access(slug)` so screens check what the person can open, never which role they have.

**1.2 A standalone portal link per program.** Add `Program.portalHref String?`. Don't reuse `externalHref`, which already means a public page hosted elsewhere, such as Chesed Match.

**1.3 `/home` for `PROGRAMS`**, for any number of programs (4a at 1280, 4b at 375):
- **Hero** in the program's `heroColor`:
  - label "YOUR PROGRAM · <SCHOOL>"
  - the name at 44/800
  - one Newsreader line, e.g. "Running since 8 Sep. Next booth: Sunday 27 Sep."
  - a white primary button, "Open the <Program> portal ↗", linking to `portalHref`. If `portalHref` is null, say "The <Program> portal link isn't set yet" in orange.
- **"Where it has got to":** the four-stage progress, green bars with "DONE · date" and the current stage in the program colour. It comes from the existing enrollment stage → step mapping.
- **"Also from JOC":** three quiet panel cards (`#F4F7FD`) for Chesed Cycle lessons, the JOC App and "N more programs", each with a "Tell me more" text link to that thing's not-yours-yet page. No prices.
- **Multiple programs:** one hero per program, stacked, with the program furthest along first. At three or more, the first gets the full hero and the rest become compact rows with the same button.
- **Don't show** the Chesed Cycle card, this week's lesson or saved lessons.

**1.4 One `NotYoursYet` component** (4c). Build it once in `src/components/ui/NotYoursYet.tsx` and use it for lessons, resources, cycles, the Board, rooms and every other program's page.
- **Props:** `{ label, thing, sentence, askKind }`
- **Layout:** a white card, radius 20. Mono label in blue ("PART OF JOC EDUCATION" or "A JOC PROGRAM"), a 26/700 title ("<Thing> isn't part of what you run with us yet"), a Newsreader paragraph naming the school and the program it runs, a primary button "I'd like <thing>", and a text link "Back to <Program>".
- **After asking:** the label changes to "YOU ASKED ON <date>" in greenText, the title to "We've got your message", and the button to a secondary "Back to <Program>". One open Inquiry per school per thing, so asking twice doesn't file twice.
- **Forbidden:** lock icons, grey-outs, blurred previews, prices and "upgrade" wording.
- Delete every other locked or paywall variant.

**1.5 The header only offers what opens** (4d).
- `FULL_SITE`: the full header, unchanged.
- `PROGRAMS`: one nav item per program the school has (any number; at five or more, overflow into a "Your programs" menu), with its colour dot, plus **"What else JOC does"**. That is a single page listing the other programs and the plan, each using the `NotYoursYet` ask.
- Never show Lessons, Staff Room or the Board in the header when they won't open.

---

## 2. Money (4e, 4f)

**2.1 First, the `Payment` model.** One row per movement of money. Every figure on every screen is a query over it.

```prisma
model Payment {
  id                    String   @id @default(cuid())
  schoolId              String                 // required — unattributable money is shown to nobody
  programId             String?                // set ONLY for money that was for one program
  subscriptionId        String?                // set for plan payments
  kind                  PaymentKind            // PROGRAM_FEE | PLAN | SHOP | REFUND | GRANT
  amountCents           Int                    // refunds negative; grants 0
  currency              String   @default("usd")
  paidAt                DateTime
  schoolYear            String                 // "2026-27", stored, not derived from paidAt
  refundOfId            String?                // a refund points at what it refunds
  grantKind             GrantKind?             // SCHOLARSHIP | PILOT | COMP
  reason                String?                // required when kind = GRANT or REFUND
  decidedById           String?                // who agreed the grant / refund
  stripePaymentIntentId String?  @unique
  stripeInvoiceId       String?  @unique
  stripeChargeId        String?  @unique
  formResponseId        String?                // links a program fee to its sign-up
  orderId               String?                // links a shop payment to its order
  recordedById          String?                // null when written by the Stripe webhook
  createdAt             DateTime @default(now())
}
```

- **Refunds** are new rows. Never edit or delete the original.
- **Existing grants** (scholarships, pilots, comps) are backfilled as `GRANT` rows with their reason and who decided them.
- **`FormResponse.paid`** becomes a computed view: is there a `PROGRAM_FEE` payment for this response, minus refunds? Keep the column until every reader has moved over, then drop it.
- **The Stripe webhook** writes `Payment` rows, deduplicated on the Stripe ids.
- **Hand-recorded rows** show "Recorded by hand by <name>".
- Add capability `money.view` and `money.record`.

**2.2 Money on each program console** (4f). This is a Money tab, visible only with `money.view`.
- **Four figures, never summed into one "total":**
  - Program fees paid ($ and number of schools)
  - Refunded ($, in redText, "shown, not netted")
  - Granted (**number of schools, not dollars**)
  - In a plan (number of schools, "not attributed")
- **Then one `BandRow` per enrolled school:**

| State | Band | Line |
|---|---|---|
| Paid | green tint, "PAID · <date>", amount | "Program fee · Stripe · receipt <id>" or "Recorded by hand by <name>" |
| Granted | green tint, "GRANTED", the grant kind | "Agreed by <name>, <date>: <reason>" |
| In a plan | blue tint, "IN A PLAN", "<n> programs" | "Paid for <plan>, which covers this and <n−1> other programs. We don't split it." |
| Refunded | red tint, "REFUNDED · <date>", "−$<amount>" | "Paid <date>, refunded by <name> <date>." |
| Nothing recorded | orange tint, "NOT RECORDED", "Unknown" | "Running since <date>, with no payment and no grant on record." Primary button: **Record it** (`money.record` only) |

   Sort: not recorded first, then refunded, paid, granted, in a plan.

**2.3 The super admin's Money page** shows plan money per plan and per school year, and shop money per order. Program fees roll up from 2.2. There is never a per-program share of a plan.

---

## Done when
- Every school today (no `fullSiteLaunchedAt`) is `PROGRAMS` or `PUBLIC`, including paid ones. A school with Kindness Booth lands on 4a, and its header shows only "Kindness Booth" and "What else JOC does".
- `grep -rn "Upgrade\|🔒\|locked" src/` returns nothing, and every gated page renders `NotYoursYet`.
- "I'd like lessons" creates one `Inquiry` and sends no email outside justonechesed.org.
- The Kindness Booth Money tab matches 4f. A granted school never shows `$0`, a refund appears as its own row, and a plan school never shows a dollar figure on a program console.
- Screenshots at 1280 and 375, compared side by side with 4a–4f.

- A school with Kindness Booth **and** JOC App shows both in the header and two heroes on /home.
- Setting `fullSiteLaunchedAt` on a paid school switches it to the full site with no other change.


---

# PART 4: The school side of each program

**Reference:** `Portal Redesign (standalone).html`, section 5 (5a–5e). Every name and number in it is a specimen.

**Assumes** the access state from `PROMPT - Schools before full site and money.md` (`FULL_SITE` / `PROGRAMS` / `PUBLIC`). Everything here is for schools in `PROGRAMS`, which is every school today.

The console (section 2) is JOC's view of a program. This is **the school's view of the same program**: the same enrollment, dates, write-ups and app figures, read from the same tables and never copied.

## Rules
- **Nothing reaches a school**, and nothing leaves it except inbound asks. "Ask <coordinator> something" writes a `SchoolActivity` of type `NOTE` with `direction: INBOUND` and shows as a row on the console's Today tab. No email, no push.
- **One school's data only.** Every query is scoped by the signed-in user's `schoolId`, including the app sync figures.
- **Student names** appear only to that ambassador's supervising teacher (the People tab, `ambassadors.manage`). A school admin sees counts.
- **Participation figures** are always labelled "their estimate". App figures always carry their "as of" time.
- **Money** shows only with `school.billing` (school admin), never for app admins or teachers.
- **Real or absent, in words, in `#C96C00`.** Hold at 375px, with hit targets of at least 44px.

## 1. School Today (5a)
Route: `/school`, in the paper-rail `PortalShell`.
- **Rail:** Today, then **one item per program** with its colour dot, then Teachers, then "What else JOC does" in muted text.
- **Heading:** "<N> things for you this week", or "Nothing needs you this week" when the list is empty.
- **Band rows**, built in `lib/school-today.ts`, worst first. There is at most one solid-orange band:

| Row | Condition |
|---|---|
| **TO APPROVE · n** | App entries waiting on a teacher (`AppSchoolStats`), with the oldest date. Primary: *Open the app* |
| **Next run · date** | The next `ProgramEvent` within 14 days. Secondary: *See the plan* |
| **YOUR NEXT STEP** | Any program in a setup stage, with that stage's one action |
| **NEW WRITE-UP · n** | Unread `EventReport`s, for teachers with `ambassadors.manage` only |
| **REPLY FROM JOC** | Only when a coordinator marks an ask answered, and only with the words they chose to share |

- **"Your programs":** a card per program with an 8px `heroColor` strip, the name, "STEP 0N / 04 · <stage> SINCE <date>" in mono, and one Newsreader line of the program's headline figure.

## 2. The school's program page (5b, 5c)
Route: `/school/programs/[slug]`, one template for all eight programs.
- **Header band** in `heroColor`, full main width:
  - label "YOUR PROGRAM · STEP 0N / 04 · <STAGE>"
  - the name at 40/800
  - a white button "Open the <Program> portal ↗" (`portalHref`). If it isn't set, say so in words.
- **Tabs,** Outfit 15/600: Overview · Dates (count) · Write-ups (new count, event programs only) · People.
- **Overview while running** (5b):
  - **Main column:** "Coming up", the next run as a band row, then "Latest write-up" with a blue ring if unread, date, "about N students, their estimate" and a Newsreader excerpt. The writer's name appears only on People.
  - **Side column, three small cards:**
    - **At your school:** who runs it, and the ambassador count
    - **At JOC:** the coordinator, plus a secondary *Ask <name> something*
    - **This year, admins only:** the payment state from the `Payment` view (Paid · date / Granted · kind / In your plan / Not recorded, in orange)
- **Overview while being set up** (5c, shown at 375):
  - A "YOUR NEXT STEP" card with a 4px orange top border, the stage title at 22/700, one Newsreader sentence and one primary action. The stage → action table lives in `lib/program-steps.ts` and is shared with the public program page.
  - Then the 4-stage list: done in green with the date, current with an orange ring and "NOW", locked dashed with "AFTER <previous>". Locked stages are never links.
  - Empty sections say why: "No bake is on the calendar yet. It's set after training."
- **The program slot:** the same registry as the console. The JOC App slot on the school side is 5d; the others show their headline figure or say what isn't recorded yet.

## 3. JOC App on the school side (5d)
- Header label "FROM THE APP · AS OF <time>". It turns orange once the sync is older than the console's stale threshold.
- **Cells:**
  - Active this month (n of enrolment)
  - Opportunities open
  - Prize store: the figure, or "Not open at your school yet" in orange
- **Band row:** TO APPROVE, with its oldest date and *Open the app*.
- **Totals only.** No leaderboard and no student names.

## 4. "Ask <coordinator> something" (5e)
- A modal or sheet with three topic chips (A date · The kit · Something else), one textarea and one primary button, *Leave it for <name>*.
- Below the button: "<Name> sees it on her console the next time she opens it."
- It writes an inbound `SchoolActivity` and appears as an **ASKED · <topic>** `info` row on that program's console Today tab until the coordinator marks it answered.
- **Nothing is sent to the school.** The reply happens outside the portal.

## Done when
- A school admin at a two-program school sees 5a, with one rail item per program.
- `/school/programs/kindness-booth` matches 5b at 1280, and a setup-stage program matches 5c at 375.
- The payment card is hidden for an app admin and a teacher.
- An ask from 5e appears on the coordinator's console within one page load, and no mail leaves the system.
- Screenshots at 1280 and 375, compared side by side with 5a–5e.


---

# PART 5: Full redesign spec (reference for anything not covered above)

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
