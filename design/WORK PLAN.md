# What's left, and the order I'd do it

Parts 1, 2 and 5 of the complete prompt are done. Part 3's schema is migrated
and none of its screens exist. Part 4 hasn't started.

---

## Every prompt, and what was still in it

Read on 24 Sep, after being asked whether I had.

| Prompt | Outcome |
|---|---|
| `PROMPT - Console fix pass.md` | Identical to Part 1. Nothing missed. |
| `design/PROMPT - Portal redesign.md` | Identical to Part 5 apart from the title. Nothing missed. |
| `design/JOC App Console (standalone).html` | **Never opened until now.** A second reference, 507KB, beside the Portal one. The console was built to it — Replay, the payment chips, the prize-store and hours chips, the five flag labels all match. One gap: `AppActivityPanel` still builds rows by hand, so it is the only screen whose rows do not line up now the band is a fixed 188px. Added as step 0.2. |
| `Prompt for Code - Admin Panels.md` | All built: `/admin/site` with drafts and history, the school panel scoped in the query layer, plan changes as requests, cycle progress against a network median, tiered grants with reason and approver, the lesson editor's "45 of 45 minutes accounted for", the dashed coverage grid, bulk import. Its design system is deliberately superseded by Part 5 Phase 1. |
| `Educator Landing Page - Design Brief.md` | Built — notice bar, sticky header, split hero with the auth card, Cycle band, What's inside, book a demo, footer. |
| Everything else in that folder | Another account and another project. Identified by its first line and left unopened. |

**One open question, from the Admin Panels brief and never answered:** it
specifies eight Chesed Cycles, while the Chesed Cycles work in the design
project landed on ten, Elul through Av. The database holds eight. The coverage
grid, the cycle tag on every lesson and the school-facing progress view all
depend on it. Worth settling before the cycle work goes further.

---

## Step 0 — a way to see the school side (half a day)

**Everything below is mostly school-facing, and I cannot currently look at any
of it.** `/school` and `/home` are built, type-checked and have never been
rendered, because review mode gives me a console session and no school.

That is exactly the hole that produced "you ruined it": I shipped a redesign
off build passes and greps without looking at the page.

So before anything else: extend `openForReview` — which already opens the
console when no auth is configured outside production — so the school panel
resolves to **JOC Test School**. Same flag, same gate, no new door.

Without this, Parts 3 and 4 get built blind and you review them for me. With
it, I check my own work.

**0.2 — `AppActivityPanel` onto `BandRow`.** It was not in Part 1's list of
five, so it kept its hand-built rows. Every other row on the site now has a
188px band; this one does not, so the JOC App console is the one page whose
rows do not line up. An hour.

---

## Part 3 — schools before the full site (2–3 days)

The schema is in: `School.fullSiteLaunchedAt`, `ProgramPage.portalHref`,
`Inquiry`, `Payment` and their enums.

### 3.1 The access state (half a day)
`accessState(school)` in `access.ts` returning `FULL_SITE` / `PROGRAMS` /
`PUBLIC`, derived from the launch date and live enrolments. A
`program.access(slug)` capability so screens ask what a person can open, never
which role they hold. A check script printing the state of every school, like
`check-nav.mjs` — because this decides what a real school sees on day one and
I don't want to be guessing about it later.

### 3.2 `NotYoursYet` (half a day)
One component for lessons, resources, cycles, the Board, rooms and the other
programs. The ask files one `Inquiry` per school per thing and sends nothing.
Then delete every other locked or paywall variant — there are 23 mentions of
"upgrade", "locked" or a padlock across 4 files today, and they all go.

### 3.3 `/home` for `PROGRAMS` (a day)
4a at 1280 and 4b at 375. One hero per program in its own colour, the
four-stage progress, the three quiet "Also from JOC" cards. Any number of
programs: one hero each, furthest along first, compact rows from the third.

### 3.4 The header (half a day)
One item per program plus "What else JOC does". Never offer Lessons, the Staff
Room or the Board when they won't open.

### 3.5 Money (a day)
`money.view` and `money.record`. The Money tab on each console (4f): four
figures never summed into one, then a row per school — paid, granted, in a
plan, refunded, nothing recorded. Then the super admin's page (4e).

**This is the part I'd push back on slightly.** Stripe isn't connected, so
every figure will be zero and every row will read "nothing recorded" until it
is. The screens will be correct and empty. Worth building now so the webhook
has somewhere to write, but don't expect to learn anything from looking at
them until Stripe is live.

---

## Part 4 — the school's side of each program (2–3 days)

Depends on 3.1 and reads the same tables as the console, never a copy.

- **4.1** `/school` Today (5a) and `lib/school-today.ts` — half a day
- **4.2** `/school/programs/[slug]`, one template, running and setup states
  (5b, 5c) — a day
- **4.3** The JOC App on the school side (5d): totals only, no names, the "as
  of" time going orange when stale — half a day
- **4.4** "Ask <coordinator> something" (5e): writes an inbound
  `SchoolActivity`, appears on that program's console Today tab, sends nothing
  — half a day

---

## Then

- **Chesed Cycles as its own console.** Not in the complete prompt, so it sits
  outside this plan until you say where. My read: it is effectively a program,
  Shoshana runs it, and it should open on "what needs you" like the eight do.
  Roughly a day.
- **The other seven programs' real content.** Same shape as the Kindness
  Booth. The fields and the editor exist; somebody has to write the words.
  Not mine to invent.

---

## Two things I can't do, and one I'd change

**Screenshots on commits.** Parts 1 and 2 both require before and after images
attached to every commit, and I have attached none. My browser tool hands me
images in the conversation; it cannot write them to disk, so I cannot commit
them. By the brief's own wording that criterion is unmet on everything
finished so far. What I can do instead is what I have been doing — measure the
rendered page and quote the numbers — and show you the screenshot in chat. If
you want them in the repo, someone with a normal browser has to take them.

**`/school` and `/home` are unverified.** See step 0. Until that lands, treat
both as built rather than working.

**Yours, and blocking:**
- `&connection_limit=1` on the pooled `DATABASE_URL`, in Vercel and `.env` —
  without it a build can bake an empty footer into every static page
- `CRON_SECRET` in Vercel — nothing scheduled runs
- Revoke the GitHub token `ghp_PH368…`
- The library is 0 resources and 4 published lessons

---

## Order, and why

1. **Step 0**, because everything after it is school-facing and I would
   otherwise be working blind.
2. **3.1 and 3.2**, because the access state and `NotYoursYet` are what every
   other screen in Part 3 and all of Part 4 branch on.
3. **3.3 and 3.4** — the thing a real educator sees on day one of the rollout.
   This is the actual launch blocker.
4. **Part 4**, which is the same relationship seen from the school's side.
5. **3.5**, money, last of Part 3 — it is the only piece that cannot be
   judged until Stripe is connected.

Commit after each numbered step, push at each one.
