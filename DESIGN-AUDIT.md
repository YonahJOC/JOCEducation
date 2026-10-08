# Design audit — JOC Education Portal

8 October 2026. Audited against the running app at 1440px and 375px, plus the
source. 77 pages, 103 components, 237 `.tsx` files.

Every number here was measured, not estimated. Where I could not verify
something I have said so.

---

## The verdict

The design system is real and mostly obeyed: 201 of 237 components import
`joc-tokens`, there are four box-shadows in the entire codebase (one of them
used nine times out of twelve), and the writing is unusually good — `Absent`,
the empty states, the console rail's seven-item rule. That is a higher
standard than most software this size reaches.

What it does not yet have is **enforcement**. Every rule in the system is a
convention that holds where somebody remembered it and breaks silently where
they didn't. The result is not ugliness; it is drift. Four undocumented greys,
38 font sizes, a second blue, half the touch targets under the stated minimum,
and a "hide the test data" flag applied to six files out of twenty-two.

The three things that actually cost you something today are **test records
showing to staff as if they were real schools**, **invisible keyboard focus
across the whole site**, and **273 places where a database failure renders as
an empty page**. Everything else is tidying.

---

## 1. Broken or wrong — fix these first

### 1.1 Test schools are shown to staff as real ones

`isTest` exists, 7 of 50 schools carry it, and it is honoured in **6 files**.
It is ignored in **16 others**, including every page where somebody actually
works through schools:

| Place | What it shows |
|---|---|
| `/admin/schools` | "50 accounts", "All 50" — 7 of them are test records |
| `/log` school dropdown | HA Test School, JOC Test School, B and C offered to staff filing a real update |
| `/admin/messages`, `/admin/users`, `/admin/programming`, `/admin/cycles` | unfiltered |
| `src/lib/board.ts`, `school-status.ts`, `school-data.ts`, `program-lights.ts`, `program-traffic.ts`, `app-activity.ts`, `app-sync.ts` | unfiltered |

Filters: `src/lib/today.ts`, `desk.ts`, `my-desk.ts`, `office.ts`,
`buzz-feed.ts`, `src/app/admin/interactions/page.tsx`. That is the list of
files somebody edited while fixing this complaint, and nothing else.

**Fix.** One exported constant — `export const LIVE = { isTest: false }` —
and `where: { school: LIVE }` or `where: LIVE` at every school query. A grep
for `prisma.school.` that does not mention `isTest` should return nothing.
Twenty-two call sites, an hour's work. Until then the headline figure on your
main schools page is wrong by seven.

### 1.2 Keyboard focus is invisible almost everywhere

- `outline: none` / `outline: 0` appears **59 times** in our own code.
- Our entire stylesheet contains **one** `:focus-visible` rule
  (`globals.css:277`, for links inside `.joc-program`).
- The lobby panel that arrived from outside **does** have a global focus ring
  (`admin.css:46`). The contractor's code is more accessible than ours.

Tab through any form in the console and you cannot see where you are. This
also affects anyone using voice control or a switch device, and it affects you
whenever you fill a form from the keyboard.

**Fix.** One rule in `globals.css`:

```css
:focus-visible {
  outline: 2px solid #2D46AF;
  outline-offset: 2px;
  border-radius: 4px;
}
```

Then delete the 59 `outline: none` declarations, or pair each with a
`:focus-visible` box-shadow as the lobby panel does. This is the single
highest-value hour in this document.

### 1.3 A failed query looks exactly like an empty page

| Pattern | Count |
|---|---|
| `.catch(() => [])` | 48 |
| `.catch(() => null)` | 37 |
| `.catch(() => 0)` | 3 |
| bare `catch {` | 185 |
| **`console.error` anywhere in the codebase** | **8** |

273 places where the database can fail and the user is shown "Nothing here
yet." The worst offenders are the newest files — `src/lib/my-desk.ts` (11),
`src/app/actions/my-desk.ts` (6), `office.ts` (5).

This is not theoretical. It bit this project twice: a stale Prisma client
made `/admin/buzz` and the whole desk render empty, and both times the cause
was invisible because the catch ate it. `src/lib/today.ts` already has the
right comment on it — *"A swallowed failure here empties the console and looks
like a quiet morning"* — and then 272 other places do it anyway.

**Fix.** Keep the fallback, but log first:

```ts
.catch((e) => { console.error("[my-desk] tasks:", e); return []; })
```

and give the panels a third state — "Couldn't load this" with a retry —
distinct from "nothing here".

### 1.4 `/log` opens as a blank page

`SchoolUpdateForm.tsx:43` starts at `kind = ""` and every field is behind
`{kind && …}`. On a phone that is a title, two outlined buttons, and roughly
600px of empty paper. Nothing says "pick one to start", and neither button
looks preferred.

This is the form staff fill in a school car park. It should not open looking
broken.

**Fix.** Either default to `INTERACTION` (the common case — most updates are
a conversation, not an event), or put one line under the heading: *"What
happened? Pick one to start."* Defaulting is better; one fewer tap.

---

## 2. The design system has no teeth

### 2.1 Four greys that aren't in the system

`joc-tokens.ts` defines `muted: #4A5A74`. The code also uses, with no
definition anywhere:

| Colour | Uses | Where it came from |
|---|---|---|
| `#5A6782` | 10 | the v2/v5 handoffs |
| `#3B4A66` | 6 | the v5 handoff |
| `#1F304D` | 5 | the v5 handoff |
| `#2C3C5A` | 4 | the v2 handoff |

I introduced all four by transcribing handoff values rather than reconciling
them with the tokens, and then re-exported two of them from
`components/mydesk/parts.tsx` as `SUB` and `QUIET` — a second token file,
three directories away from the first.

**Fix.** Promote them into `joc-tokens.ts` with names and a stated job each
(`ink` → `sub` → `muted` → `faint` is a legible ramp), delete the duplicates
in `parts.tsx`, and keep one place where a grey is decided.

### 2.2 A second blue, used as if it were a token

`#2C7AC9` appears in five files as a status colour — `OrdersClient` (QUOTED),
`DemoTable` (CONTACTED), `PeopleTable` (SCHOOL_ADMIN), `ResourceLibrary`
(Activity), and the landing page's card rotation. It is never defined. It sits
beside `C.blue` (`#2D46AF`) in the same objects, so the file reads as though
one of the two is a mistake.

**Fix.** It is doing a real job — "in progress, not yet ours". Name it
(`C.blueSoft`) and define it, or drop it for `C.blue` and distinguish those
states some other way.

### 2.3 No type scale

**38 distinct font sizes** between 9px and 96px, including 12/12.5/13/13.5/
14/14.5/15/15.5/16/16.5/17/17.5/18/18.5/19/19.5/20. Nobody can tell 15px from
15.5px; what they can tell is that two cards that should match don't.

`joc-tokens.ts` exports `label`, `prose`, `pageTitle` and `figure` — good
starts that cover maybe a fifth of the text on screen. Everything else is set
inline, per component, from memory.

**Fix.** Six sizes, named, exported, and used: `display 30 / title 20 /
body 15 / small 13 / label 10.5 / mono 11`. Adopt in new work, convert on
touch. Don't do a big-bang rewrite — that is how working pages break.

### 2.4 Twenty corner radii

`0, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 999, 9999`.
`R` defines five of them. Note both `999px` and `9999px` in use for the same
pill shape.

**Fix.** Keep `R`'s five, map everything else to the nearest, standardise on
`9999px`.

### 2.5 `ItemTools.tsx` is the one file outside the system

50 hardcoded hex values and **no** `joc-tokens` import — the only file in the
codebase like it (`BuzzCard.tsx` is next at 5). I wrote it that way to match
the v2 handoff pixel for pixel, which was the right call that day and is a
liability now: the most interactive component you own is the one that will not
follow a token change.

**Fix.** Mechanical substitution against the token table. No visual change.

---

## 3. Accessibility

### 3.1 Four text colours fail contrast

Measured (WCAG 2.1, normal text needs 4.5:1):

| Token | on white | on paper | Verdict |
|---|---|---|---|
| `ink #10233F` | 15.74:1 | 14.96:1 | pass |
| `SUB #3B4A66` | 8.91:1 | 8.47:1 | pass |
| `blue #2D46AF` | 8.06:1 | 7.66:1 | pass |
| `muted #4A5A74` | 6.99:1 | 6.64:1 | pass |
| `greenText #1D6B37` | 6.54:1 | 6.22:1 | pass |
| `QUIET #5A6782` | 5.68:1 | 5.40:1 | pass |
| `orangeText #C96C00` | 3.73:1 | 3.55:1 | large text only |
| **`faint #8A97B3`** | **2.93:1** | **2.79:1** | **fail** |
| **`ringQuiet #9AA6C2`** | **2.44:1** | **2.32:1** | **fail** |
| **`SOFT #B4BCCE`** | **1.90:1** | **1.81:1** | **fail** |
| **`outline #CBD3EE`** | **1.49:1** | **1.42:1** | **fail** |

`faint` is used as a text colour **26 times** — and almost always on 10px
mono meta lines, which is the worst possible combination: the smallest text on
the page in the lowest-contrast colour.

`outline` is used as a text colour once, and it is a line that matters:
`Health.tsx:43` renders **"ONLY YOU SEE THIS" at 1.49:1** — a reassurance about
privacy that is, in practice, invisible.

**Fix.** `faint` darkens to about `#6B7793` (≈4.6:1) and stays the meta
colour. `SOFT` and `outline` stop being text colours entirely — they are
border colours and should be typed as such. `Health.tsx:43` becomes `QUIET`.

### 3.2 Touch targets

| Declared `minHeight` | Count |
|---|---|
| **under 44px** | **140** |
| 44px or more | 177 |

And seven components contain `<button>` with no minimum height at all —
including **all four quarters of My desk** (`Tasks`, `YourDay`, `ForYou`,
`Health`) plus `buzz/AdminToggle`, `desk/NoticeStrip`, `desk/YourList`.

My desk is the page people will open most often, frequently on a phone, and
its remove (`×`), Today, Nudge and Decline controls are 26–32px with no
minimum. Those are the controls where a mis-tap does something you didn't
want.

**Fix.** 44px minimum on anything tappable. Where the design needs a small
visual target, keep the glyph small and pad the hit area — `padding: 11px;
margin: -11px;` costs nothing visually.

### 3.3 Ported code sets the better example

Worth saying plainly: the lobby panel arrived with a global focus ring, a
documented CSS variable scale, and `aria-label` on every icon button. It is
the most accessible part of the portal and we didn't write it.

---

## 4. Consistency and judgement

### 4.1 Orange has stopped meaning anything on `/admin/schools`

`Absent` (`components/Absent.tsx`) colours every missing value
`C.orangeText` + 600 weight. The intent is excellent and the comment defending
it is right. But on the schools table, **Plan** and **Seats** are empty for
roughly 43 of 50 rows, so two full columns are orange from top to bottom.

A colour that marks the majority state is not emphasis, it is wallpaper — and
it trains people to ignore the colour on the rows where it does matter.

**Fix.** Keep `Absent` for single values in a detail panel. In a table where
absence is the norm, invert it: set values in `ink`, missing ones in `faint`,
and let the *filter chips* carry the counts ("No plan 43").

### 4.2 Eight unlabelled links above the schools table

`/admin/schools` puts JOC App board · School updates · The Buzz · Buzz access ·
My Buzz items · Messages · Status board · Demo requests in a single row at the
same weight, directly beside the page title. It is more navigation than the
page itself, and the rail already went to real trouble to be at most seven
items.

**Fix.** Group them under a heading, or move them to the bottom of the page as
a "related" block. They are not what somebody came here to do.

### 4.3 The previous console home is still in the tree

`components/desk/Desk.tsx` (236 lines) is imported by nothing. It is the only
importer of `YourList`, `YourDiary`, `NoticeStrip` and `ChipRow`. With
`ShowMore` (imported by nothing) that is **~680 lines of dead code** modelling
a console home that no longer exists. Only `TheBoard` is still live, used by
The Office.

**Fix.** Delete `Desk.tsx`, `ShowMore.tsx`, `YourList.tsx`, `YourDiary.tsx`,
`NoticeStrip.tsx`, `ChipRow.tsx`. Keep `TheBoard.tsx`. Check `lib/desk.ts` —
`getDesk()` is now only called by The Office and may have shrunk to a notices
query wearing a desk's name.

### 4.4 Data tables on a phone

The schools table renders 720px wide inside a 375px viewport, in a horizontal
scroller. The page itself does not overflow, so this is not a bug — but on a
phone you see School and Status and must scroll sideways for the other four
columns, with no indication that they exist.

**Fix.** Below 700px, drop the table for stacked cards: name, status pill, and
the one figure that matters. You already do exactly this well in the Buzz.

---

## What I'd do, in order

| | Work | Why |
|---|---|---|
| 1 | One `:focus-visible` rule; delete the 59 `outline:none` | One hour. Biggest single gain in the document. |
| 2 | `LIVE` constant on all 22 school queries | Staff are being shown fake schools in a live form. |
| 3 | `console.error` in every swallowed catch | You cannot fix what you cannot see, and this has already cost two debugging sessions. |
| 4 | Default `/log` to Interaction | One tap, and the page stops looking broken. |
| 5 | Darken `faint`; stop using `SOFT`/`outline` as text | Readability, and `Health.tsx:43` is currently invisible. |
| 6 | 44px minimum on My desk's controls | It is the most-used page and the most-tapped controls. |
| 7 | Promote the four greys and the second blue into tokens | Stops the drift getting worse. |
| 8 | Delete the dead `desk/` components | ~680 lines; removes a second answer to "how is a console home built". |
| 9 | Six-size type scale, adopted on touch | The long game. Don't rewrite; converge. |
| 10 | `ItemTools.tsx` onto tokens; stacked cards for tables on phones | Tidying. |

Items 1–4 are a day. They are also the only ones a user would notice.

---

## What's good, and should not be touched

- **The writing.** `Absent`, the empty states, the rail's hints, the commit
  history. This portal explains itself better than most commercial software.
- **Four box-shadows.** Twelve uses, nine identical. Genuinely disciplined.
- **Token adoption.** 201 of 237 files. The system is real; it just needs
  defending.
- **The console rail's seven-item rule**, and the care in `nav.ts` about which
  item gives way. That is a designer's decision, written down and enforced.
- **The Buzz card and My desk's four quarters.** These match their handoffs
  closely and read well. The problems above are in the plumbing, not the
  drawing.
- **The lobby screen.** Pixel-matched to its design and correctly kept out of
  the site's bundle.
