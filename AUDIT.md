# JOC Education Portal — audit

Read of the whole repository at commit `f09bbc3`, 23 September 2026, against
the live database (`education.justonechesed.org`). Row counts in this document
were read from that database, not guessed.

---

## Before anything else: the brief describes an older build

The audit brief asks whether `/admin/*` is unprotected, whether auth stubs
return null, whether login "calls `setTimeout` and fakes success", whether
`/portal` shows a fictional teacher, whether the shop calls `alert()`, and
whether `/api/contact` only `console.log`s the message.

**Every one of those was true and every one of them has been fixed.** They are
listed below with the evidence, because a report that repeats a stale premise
is worse than no report. What is genuinely still missing is a much shorter
list, and it is at the end of each section under **Still open**.

The one thing the brief describes that does not exist at all is the **student
ambassador platform** (Side C). There is no model, no route, no role. Section 3
designs it.

---

# Section 1 — Security

## 1.1 Is `/admin/*` protected? Yes, in three layers.

**Layer 1 — the edge gate,** [src/proxy.ts](src/proxy.ts). Everything except a
short public list requires a session cookie. It switches itself on when
`AUTH_SECRET` and `DATABASE_URL` both exist ([proxy.ts:21](src/proxy.ts#L21)),
which they do in production, so the gate is live. It deliberately only checks
for the *presence* of a cookie, because Prisma cannot run on the edge — this is
stated in the file and the real check is server-side.

**Layer 2 — the console door,** [src/app/admin/layout.tsx:77](src/app/admin/layout.tsx#L77).
`canOpenConsole()` ([src/lib/program-admin.ts](src/lib/program-admin.ts))
refuses anyone who holds no console capability *and* runs no program. A
`STAFF` account — which is what any `@justonechesed.org` address gets
automatically — cannot open the console.

**Layer 3 — per-page capability guards.** Every one of the 25 admin pages
checks a capability of its own, either through a `*Guard` component
([src/components/admin/Guard.tsx:22](src/components/admin/Guard.tsx#L22)) or an
inline `can()`:

| Page | Guard |
|---|---|
| `/admin` | `SchoolsGuard` |
| `/admin/board` | `BoardGuard` |
| `/admin/coverage` | `LessonsGuard` |
| `/admin/cycles` | `CyclesGuard` |
| `/admin/demos` | `DemosGuard` |
| `/admin/files` | `ResourcesGuard` |
| `/admin/forms` | `FormsGuard` |
| `/admin/guide` | `canManageAccounts` |
| `/admin/lessons` | `LessonsGuard` |
| `/admin/meetings` | `can(user, "run_admin_agenda")` |
| `/admin/my-programs` | program lead **or** `programs`/`forms`/`coordinators` |
| `/admin/orders` | `OrdersGuard` |
| `/admin/pricing` | `PricingGuard` |
| `/admin/products` | `ShopGuard` |
| `/admin/programming` | `ProgrammingGuard` |
| `/admin/programs` | `ProgramsGuard` |
| `/admin/programs/[slug]` | `getProgramAdmin()` — lead or `programs`/`forms`/`coordinators`; app figures additionally behind `app_activity` |
| `/admin/resources` | `ResourcesGuard` |
| `/admin/roles` | `UsersGuard` |
| `/admin/rooms` | `RoomsGuard` |
| `/admin/schools` | `SchoolsGuard` |
| `/admin/schools/[slug]` | `SchoolsGuard` |
| `/admin/schools/status` | `SchoolsGuard` |
| `/admin/site` | `SiteGuard` |
| `/admin/users` | `UsersGuard` |

Server actions guard themselves independently — e.g.
[src/app/actions/school-status.ts:19](src/app/actions/school-status.ts#L19),
[src/app/actions/program-lights.ts:32](src/app/actions/program-lights.ts#L32).
Hiding a nav link is never the only protection.

**The escape hatch — found here, closed here.** Every guard used to read
`if (!isAuthConfigured || can(...))`, and the edge gate switched itself off
under the same condition. It exists so a fresh clone with no `.env` can be
read end to end, and in production `isAuthConfigured` is true, so it was
closed *in practice*. But it was **the single most load-bearing condition in
the codebase, and it was written down nowhere**: one missing `AUTH_SECRET` in
Vercel would have opened the gate *and* passed all 25 console guards at the
same moment, publishing thirty-seven schools' records with nobody able to sign
in and notice.

Closed in `327a244` (this audit):

- [src/auth.ts](src/auth.ts) exports `openForReview`, which is
  `!isAuthConfigured && NODE_ENV !== "production"`. All 42 guard sites read
  that instead — 15 of the form `!isAuthConfigured ||` and 27 of the form
  `isAuthConfigured &&`, which is the same hatch written the other way round.
- [src/proxy.ts](src/proxy.ts) now distinguishes a *decision* to open the gate
  (`GATE_DISABLED=true`, still honoured) from sign-in being *broken*. The
  second shuts the gate in production instead of opening it.
- [src/lib/boot.ts](src/lib/boot.ts) prints a banner in the logs saying which
  variable is missing. It deliberately does **not** throw: failing the build
  would mean the deploy that fixes the variable is the one that cannot run.

## 1.2 Secrets in the repo

- No `.env*` file is tracked (`git ls-files` returns nothing matching).
- No `sk_`, `pk_`, `ghp_`, `AIza` or literal `AUTH_SECRET=` in `src/`,
  `prisma/`, `scripts/` or any tracked markdown.
- All 23 environment variables are read through `process.env` and nowhere
  hardcoded.
- **Out of band:** a GitHub personal access token (`ghp_PH368…`) was pasted
  into a chat session during setup. It is not in the repository, but it should
  still be revoked at github.com/settings/tokens.

## 1.3 Routes that should be gated and are not

Reviewed all 60 pages and 10 API routes. Findings:

1. **`/school/plan` and `/school/teachers` imported their guard and never
   called it.** Both files begin
   `import { requireAccountHolder } from "../account-only";` and neither
   invoked it — ESLint had been reporting it as an unused import. The hole an
   earlier fix was written to close was still open. It was not a data leak,
   because `mySchool()` derives the school from the session and returns
   `null` for anyone else — but a school app admin typing the address got
   *"We could not load your school"*, which reads as a fault rather than a
   refusal. **Fixed in this audit;** both pages now `await requireAccountHolder()`.

2. **`/school/activity` and `/school/cycles`** —
   [src/app/school/activity/page.tsx](src/app/school/activity/page.tsx),
   [src/app/school/cycles/page.tsx](src/app/school/cycles/page.tsx) — have no
   guard in the page itself. They are **not** exposures: the shared layout
   ([src/app/school/layout.tsx:41](src/app/school/layout.tsx#L41)) refuses
   anyone who fails `canRunSchoolApp`, and every read they make goes through
   `mySchool()` / `myActivity()`, which derive the school id from the session
   and return `null` for anybody else
   ([src/lib/school-data.ts:50-56](src/lib/school-data.ts#L50)). They are worth
   a page-level guard anyway, for the same reason the admin pages have one: the
   layout is one edit away from being the only thing standing there.

3. **`/account` is in `PUBLIC_PREFIXES`** ([src/proxy.ts:47](src/proxy.ts#L47)).
   The page itself redirects an unauthenticated visitor
   ([src/app/account/page.tsx](src/app/account/page.tsx)), so this is not an
   exposure either, but the reason for the exemption (a user with an
   admin-issued password must reach it before the gate would let them) should
   be narrowed to `/account/password`.

4. **`/api/lights` was locked out, not open** — the opposite problem, fixed in
   `f09bbc3`. Vercel Cron sends no cookie, so the gate answered it 401 before
   the route's `CRON_SECRET` check ever ran. It is now listed in
   `PUBLIC_FILES` and still authorised by the secret.

Nothing else is reachable that should not be.

## 1.4 Does the auth system support roles?

Yes, and it has outgrown a simple role list. There are **two** axes:

**Axis 1 — `Role`**, six values, on `User.role`
([src/lib/access.ts:74](src/lib/access.ts#L74)): `TEACHER`, `SCHOOL_ADMIN`,
`STAFF`, `PROGRAM_STAFF`, `ADMIN`, `SUPER_ADMIN`. This is *not* a ladder —
`PROGRAM_STAFF` can do things `ADMIN` cannot and vice versa, which the file
says outright at line 28.

**Axis 2 — capabilities**, 19 of them, stored on `AdminRole.capabilities` and
carried on the JWT, refreshed every 5 minutes
([src/auth.ts:44](src/auth.ts#L44)). Every guard asks `can(user, "…")`, never a
role. The 19: `lessons`, `resources`, `programs`, `board`, `rooms`, `shop`,
`site`, `forms`, `app_activity`, `set_program_light`, `programming`, `cycles`,
`coordinators`, `schools`, `demos`, `orders`, `pricing`, `users`,
`run_admin_agenda`.

Plus two scoped flags that are neither: `User.schoolAppAdmin` (runs one
school's JOC App) and `ProgramPage.leads` (runs one JOC program).

**Against the four roles the brief asks for:**

| Brief | Exists as | Gap |
|---|---|---|
| `joc_staff` | `STAFF` + capability sets on `AdminRole` | none |
| `school_admin` | `SCHOOL_ADMIN` + `scopedSchoolId()` | none |
| `teacher` | `TEACHER` | none |
| `student_ambassador` | **nothing** | everything — Section 3 |

**What has to change for ambassadors** is *not* "add roles" — it is that every
existing role is scoped to at most a school, and an ambassador must be scoped
to *a program at a school*. That is a new join table, not a new enum value.
Adding `STUDENT_AMBASSADOR` to `Role` alone would create a student who can see
every program their school runs, which is the one thing Section 3 must
prevent.

---

# Section 2 — Educator platform: actual state

| Feature | Brief says | Actually |
|---|---|---|
| Login | fakes success | **Real.** NextAuth v5, Google + password credentials, [src/auth.ts](src/auth.ts). Password verified with scrypt, [src/lib/password.ts](src/lib/password.ts). |
| Signup | fakes success | **Partly real.** `/signup` writes a real account. But the landing card's *signup tab* still fakes it — see 2.1. |
| Forgot password | fakes success | **Real,** [src/app/actions/reset.ts](src/app/actions/reset.ts) → `/reset-password`. Delivery depends on `RESEND_API_KEY`; the page says so rather than claiming "check your inbox". |
| `/portal` | hardcoded fictional teacher | **Deleted.** [src/app/portal/page.tsx](src/app/portal/page.tsx) is now a 10-line redirect to `/home`. |
| Program CTAs | point nowhere | **Real.** Each `ProgramPage` carries a `formId`; the button opens `/forms/<slug>`. 9 forms exist, 2 published, 9 responses received. |
| Lesson downloads | files don't exist | **Real path, thin library.** `LessonFile` → `StoredFile` (bytes in Postgres, [prisma/schema.prisma:769](prisma/schema.prisma#L769)), served by [src/app/api/files/[id]/route.ts](src/app/api/files/%5Bid%5D/route.ts) behind `hasSiteAccess`. 12 files uploaded. 13 lesson plans, **4 published**. |
| Resources (460+) | none exist | **True, and the page says so.** `Resource` table: **0 rows**. [src/app/resources/page.tsx:56](src/app/resources/page.tsx#L56) renders "The library is being built." rather than a number. No invented count anywhere. |
| Shop "Add to cart" | calls `alert()` | **No `alert()` exists anywhere in `src/`.** The cart is real state and checkout writes an `Order` + `OrderItem` via [src/app/actions/orders.ts](src/app/actions/orders.ts), with prices re-read server-side. 6 products, 0 orders. |
| Pricing "Get started" | does nothing | **Points at `mailto:education@justonechesed.org`** ([src/app/pricing/page.tsx:71](src/app/pricing/page.tsx#L71)). Honest, but it is the one place a school decides to buy. See Still open. |
| Email / Resend | never wired | **Wired,** [src/lib/email.ts](src/lib/email.ts), Resend over `fetch`. Behind **one send gate**: until `EMAIL_LAUNCHED=true`, only `@justonechesed.org` addresses receive anything and everything else is logged and held ([email.ts:37-50](src/lib/email.ts#L37)). |
| `/api/contact` | `console.log`s | **Stores then sends.** [src/app/api/contact/route.ts](src/app/api/contact/route.ts) writes a `ContactMessage` first so nothing is lost if mail is off. 0 messages so far. |
| Teachers' Board | static | **Real.** `submitBoardPost` / `toggleBoardLike`, [src/app/actions/board.ts](src/app/actions/board.ts), with an approval queue at `/admin/board`. **0 posts** — built and unused. |
| Chesed Cycles 5787 | marked TODO | **Still TODO.** [src/lib/cycles.ts:3](src/lib/cycles.ts#L3): *"verify every start/end date against a 5787 luach before launch"*. 8 cycles are in the database and editable at `/admin/cycles`, but nobody has checked them against a luach. |

## 2.1 The one live stub: the landing page auth card

[src/components/landing/AuthCard.tsx:62-74](src/components/landing/AuthCard.tsx#L62)

```js
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);
  // Auth is not connected yet — see tech plan Phase 2.
  window.setTimeout(() => {
    setNotice(tab === "login"
      ? "Sign-in isn't switched on yet. Book a demo below…"
      : "Accounts aren't open yet. Book a demo below…");
  }, 700);
}
```

Line 174 routes only `passwordEnabled && tab === "login"` to the real server
action; **the signup tab still hits `handleSubmit`** and tells a visitor that
accounts are not open. Sign-in *is* switched on. The comment referencing
"tech plan Phase 2" is stale.

Either wire the signup tab to the real `/signup` flow, or replace the fake
delay with a plain link to it. As it stands the site's front door tells the
truth on one tab and an out-of-date story on the other.

## Still open (educator platform)

1. The landing signup tab (2.1) — **live, user-facing, wrong**.
2. `EMAIL_LAUNCHED` is off, so no school can ever be emailed. Deliberate, but
   it means password reset does not work for a teacher at a school.
3. 4 published lessons, 0 published resources, 0 board posts. The platform
   works; it has almost nothing in it.
4. Stripe: `STRIPE_SECRET_KEY` unset, so `isPaymentConfigured` is false, paid
   forms refuse to publish, and pricing is a mailto.
5. Cycle dates unverified against a 5787 luach.
6. `Test Form` is published publicly.

---

# Section 3 — Student Ambassador platform (does not exist)

## 3.1 What exists that could support one

Nothing scoped correctly. Reviewing each candidate:

- **`User.schoolId`** — ties a person to a school, not to a program. An
  ambassador with only this sees the whole school's view.
- **`ProgramPage.leads`** — an implicit many-to-many of *JOC staff* to
  programs. Wrong direction: it is JOC-side, has no school, and grants console
  access ([src/lib/program-admin.ts](src/lib/program-admin.ts)).
- **`ProgramEvent`** — school × program × date, the closest existing thing. It
  is the *calendar*, owned by the programming team, with no notion of a person
  at the school. It is what an ambassador's report should *attach to*, not what
  an ambassador *is*.
- **`SchoolActivity`** — JOC's own relationship log. An ambassador writing into
  it would put student-authored text in the account team's CRM timeline with no
  way to tell the two apart.
- **`FormResponse`** — could carry a report, but forms are built by hand per
  program, and the report needs to be queryable (participation counts, silence
  detection) rather than an opaque JSON blob.

**Verdict: everything is new.** There is no model that represents "a person at
a school, scoped to one program, for a bounded period".

## 3.2 The experience

1. **Invited by their supervising teacher**, not by JOC, and not by email.
   Email is blocked by the send gate and — more importantly — these are minors
   at a school JOC does not employ. The teacher generates a **join code** on
   their own portal page for one program; the ambassador enters it at
   `/ambassador/join`. The code carries school, program and expiry, so
   knowing it grants nothing beyond that one program at that one school.
2. **Two per program per school.** The join code is capped at two active
   redemptions; a third sees "This program already has its two ambassadors —
   ask your teacher."
3. **Scoped to exactly one program at one school.** Not their school's other
   programs, not another school, not billing, not the plan, not the teachers'
   board, not the console, not other ambassadors' reports.
4. **Submits a post-event report**: date, what happened, estimated
   participation, what went well, what they would change, optional photo.
5. **Sees their own report history** and nothing else.
6. **Tenure ends.** `endsAt` on the assignment; after it the account stays but
   the ambassador scope evaporates, the same way a manual traffic light expires.

## 3.3 Routes

```
/ambassador                 their one program, this term's reports, the button
/ambassador/join            enter a join code (the only route open to an
                            authenticated user with no assignment)
/ambassador/report          submit a report for one event or one date
/ambassador/report/[id]     read back one report they wrote
/ambassador/history         everything they have submitted
```

Teacher side, on the existing school portal:

```
/school/programs/[slug]/ambassadors    generate a code, see the two holders,
                                       end a tenure, read their reports
```

JOC side, on the existing console:

```
/admin/reports              aggregate rollup, by program and by school
```

`/ambassador/*` goes in `proxy.ts` behind the gate like everything else; the
scope check belongs in a `requireAmbassador()` helper beside
`requireAccountHolder()`.

## 3.4 Schema

```prisma
/// One student running one program at one school, for a bounded period.
/// Two per program per school; the cap is enforced on redemption.
model ProgramAmbassador {
  id        String @id @default(cuid())
  userId    String
  schoolId  String
  programId Int

  /// The teacher who invited them and who reads their reports.
  supervisorId String

  startsAt DateTime @default(now())
  /// Tenure end. Past this, the scope is gone.
  endsAt   DateTime?

  user       User        @relation("AmbassadorUser",  fields: [userId],       references: [id], onDelete: Cascade)
  school     School      @relation(fields: [schoolId],  references: [id], onDelete: Cascade)
  program    ProgramPage @relation(fields: [programId], references: [id], onDelete: Cascade)
  supervisor User        @relation("AmbassadorSupervisor", fields: [supervisorId], references: [id], onDelete: Restrict)

  reports EventReport[]

  @@unique([userId, schoolId, programId])
  @@index([schoolId, programId])
  @@index([supervisorId])
}

/// A code a teacher hands to a student. Scoped, capped, and expiring.
model AmbassadorInvite {
  id        String   @id @default(cuid())
  code      String   @unique
  schoolId  String
  programId Int
  createdById String
  expiresAt DateTime
  /// Redemptions so far. Refused at 2.
  usedCount Int      @default(0)
  revokedAt DateTime?
  ...
}

/// What happened when the program actually ran.
model EventReport {
  id            String @id @default(cuid())
  ambassadorId  String
  /// The calendar entry it reports on, where there is one. Null when the
  /// ambassador ran something the calendar never knew about — which is
  /// itself the most valuable thing this table records.
  eventId       Int?

  occurredOn    DateTime
  /// The student's own estimate. Never presented as a measured figure.
  participants  Int?
  whatHappened  String  @db.Text
  wentWell      String? @db.Text
  wouldChange   String? @db.Text
  photoId       String?

  submittedAt   DateTime @default(now())
  /// Set when the supervising teacher has read it.
  seenBySupervisorAt DateTime?

  ambassador ProgramAmbassador @relation(fields: [ambassadorId], references: [id], onDelete: Cascade)
  event      ProgramEvent?     @relation(fields: [eventId],      references: [id], onDelete: SetNull)
  photo      StoredFile?       @relation(fields: [photoId],      references: [id], onDelete: SetNull)

  @@index([ambassadorId, occurredOn])
  @@index([eventId])
}
```

Two new capabilities, matching the existing pattern:
`view_ambassador_reports` (Programs group — JOC staff reading the rollup) and
`manage_ambassadors` (School accounts group — ending a tenure JOC-side).
Ambassadors themselves hold **no** capability; the `ProgramAmbassador` row is
the permission, exactly as `ProgramPage.leads` is for a coordinator.

## 3.5 Rollup

```
EventReport
  → the supervising teacher, at /school/programs/<slug>/ambassadors
      full text, the student's name, the photo
  → the school's CRM record, at /admin/schools/<slug>
      "3 program events reported this cycle · 140 students · last 8 Sep"
      and the narrative, attributed to "an ambassador", not to a named student
  → the JOC aggregate, at /admin/reports
      by program: reports this month, schools reporting, schools silent
      by school: which programs are alive and which have gone quiet
```

The third of these is the one JOC does not have in any form today — see 4.4.

## 3.6 Privacy — ambassadors are minors

This is the part to get right first, because it cannot be retrofitted.

1. **Name visible to the supervising teacher only.** JOC staff see
   "an ambassador at Bnos Chaya", never the student's name, on every aggregate
   screen. The name lives on `User` and is joined only in the teacher's view.
2. **No student's name in narrative text.** The report form says so and the
   fields are the student's own account of an event, not a roster. This is the
   same rule the JOC App panel already follows
   ([src/components/admin/AppActivityPanel.tsx:14](src/components/admin/AppActivityPanel.tsx#L14)).
3. **Photos are the sharpest edge.** A photo of a school event contains other
   children. Photos should be (a) optional, (b) visible to the supervising
   teacher by default and to JOC only when the teacher marks one shareable,
   (c) never on a public page, and (d) served through the existing
   authenticated `/api/files/[id]` route, never a public URL.
4. **No email to a student, ever.** The existing send gate already blocks it;
   do not add an exemption. Everything reaches an ambassador inside the portal.
5. **Participation counts are estimates by a teenager.** Label them as such
   everywhere. A CRM figure that reads as measured, and is not, is worse than
   no figure — the same rule the rest of the console follows.
6. **Tenure end must actually remove access,** not just hide a link. Check
   `endsAt` in the scope helper, not in the UI.
7. **Deletion.** A school leaving JOC should be able to have its ambassador
   accounts and reports removed. `onDelete: Cascade` from `School` gives that
   for free; nothing should copy report text into a table that does not cascade
   — which rules out writing it into `SchoolActivity`.

---

# Section 4 — CRM: what exists vs. what is needed

## 4.1 Every admin route and its state

| Route | Model(s) | State |
|---|---|---|
| `/admin` | School, Subscription | Full read, filters, status pipeline |
| `/admin/schools` | School | Full CRUD, `NewSchoolForm` |
| `/admin/schools/[slug]` | School, SchoolContact, SchoolActivity, Subscription, Invitation, PlanChangeRequest | Full CRUD — the deepest page in the console |
| `/admin/schools/status` | School, AppSchoolStats | Full; dated milestones (`studentListAt`, `liveScreenAt`, `storeOpenAt`) |
| `/admin/demos` | DemoRequest, ContactMessage | Full CRUD |
| `/admin/orders` | Order, OrderItem | Read + status change |
| `/admin/pricing` | PricingPlan, ProgramPrice | Full CRUD |
| `/admin/users` | User, AdminRole | Full CRUD incl. passwords, coordinator assignment |
| `/admin/roles` | AdminRole | Full CRUD over the 19 capabilities |
| `/admin/programming` | ProgramEvent | Full CRUD |
| `/admin/cycles` | Cycle, CycleWeek | Full CRUD |
| `/admin/programs` | ProgramPage, ProgramStep | Full CRUD |
| `/admin/programs/[slug]` | ProgramPage, Form, FormResponse, ProgramEvent, SchoolProgramLight, AdminMeeting | Full — the program console |
| `/admin/meetings` | AdminMeeting, AdminMeetingItem | Full (new) |
| `/admin/my-programs` | ProgramPage | Index |
| `/admin/lessons` | LessonPlan + 5 child tables | Full CRUD |
| `/admin/coverage` | LessonPlan × Cycle | Read |
| `/admin/resources` | Resource | Full CRUD |
| `/admin/files` | StoredFile | Full CRUD |
| `/admin/board` | BoardPost, BoardLike | Approve/remove |
| `/admin/rooms` | Room, RoomMember, RoomMessage | Full CRUD |
| `/admin/products` | Product | Full CRUD |
| `/admin/forms` | Form, FormField, FormResponse | Full CRUD + CSV export |
| `/admin/site` | SiteField, SiteFieldHistory | Full CRUD with drafts |
| `/admin/guide` | — | Static help |

**Models with no admin UI at all:**

- **`Stat`** — defined at [prisma/schema.prisma:623](prisma/schema.prisma#L623)
  and referenced by nothing in `src/`. Dead. Delete it or wire it.
- **`SavedLesson`, `BoardLike`, `RoomMember`** — user-side join tables; no
  admin screen needed.
- **`AppChallengeStat`, `AppSchoolMessage`, `AppSyncRun`** — written by the
  sync, read by the JOC App console. No direct CRUD, correctly.
- **`Account`, `Session`, `VerificationToken`** — NextAuth internals.

## 4.2 CRM capability: implied by the schema, present in the UI

Against the brief's list, all six already exist:

- **School profiles** — `School`, 30+ fields, full page.
- **Program enrollment with stage tracking** — two half-answers, not one:
  `School.status` (`PROSPECT → DEMO_SCHEDULED → TRIAL → ACTIVE → LAPSED →
  CHURNED`) is the *account* pipeline, and `ProgramEvent.status`
  (`PLANNED → CONFIRMED → DONE → CANCELLED`) is the *calendar*. **There is no
  per-school-per-program enrollment stage** — see 4.3.
- **Coordinator contacts** — `SchoolContact` with `isPrimary`.
- **Renewal and billing** — `Subscription` with `grantedManually`, `grantKind`,
  `PlanChangeRequest`. `renewsAt` exists; no renewal *schedule* or reminder.
- **Communication log** — `SchoolActivity`, 39 rows, 10 types including
  system-generated audit entries.
- **Material delivery** — partly: `School.studentListAt`, `liveScreenAt`,
  `storeOpenAt`. No record of what was *sent to* a school.

## 4.3 The real gap: `ProgramEnrollment` — **built in `817c0f5`**

The console can answer "is this school a customer?" and "when is the Kindness
Booth at Bnos Chaya?" It cannot answer **"which programs is this school
running, and how far along is each one?"** — which is the question a growing
nonprofit asks most.

Today "in a program" is *inferred*, in two places, from two different things —
a non-cancelled `ProgramEvent`, or a `FormResponse` against the program's form
([src/lib/program-traffic.ts:103-120](src/lib/program-traffic.ts#L103),
[src/lib/program-lights.ts:164-178](src/lib/program-lights.ts#L164)). That
inference is duplicated, which means it will drift, and it has no stage.

```prisma
model ProgramEnrollment {
  id        String @id @default(cuid())
  schoolId  String
  programId Int
  stage     EnrollmentStage @default(INTRODUCED)
  stageSince DateTime @default(now())
  /// The teacher at the school who owns this program.
  coordinatorContactId String?
  startedAt DateTime?
  endedAt   DateTime?
  @@unique([schoolId, programId])
}

enum EnrollmentStage {
  INTRODUCED      // somebody reached out
  MEETING_BOOKED
  REGISTERED      // form in
  MATERIALS_SENT
  TRAINED
  LAUNCHED        // it has actually run
  RUNNING
  PAUSED
  ENDED
}
```

**Shipped.** [prisma/schema.prisma](prisma/schema.prisma) has the model and the
enum; [src/lib/program-enrollment.ts](src/lib/program-enrollment.ts) is the one
place the question is answered; both inferences now call it
([program-traffic.ts:112](src/lib/program-traffic.ts#L112),
[program-lights.ts:166](src/lib/program-lights.ts#L166)); and
[src/components/admin/ProgramSchools.tsx](src/components/admin/ProgramSchools.tsx)
puts "Schools in &lt;Program&gt;" above the traffic light on every console,
sorted furthest-along first and then by whoever has been stuck longest.

Two questions, kept apart on purpose:

- `schoolsInProgram()` — has this program *reached* this school at all? Any
  stage counts. It is what keeps a school off the "not in this yet" list, so a
  school never appears in both.
- `allEnrolledPairs()` — is this school *busy enough* with one program to be
  worth a word before another is introduced? Being told about a program is not
  being in it, so `INTRODUCED` does not count.

Backfilled from the calendar and the sign-ups on the live database: 8 pairs,
all `REGISTERED`. "Reconcile with the calendar" re-runs it and only ever
creates — a stage somebody set by hand is a decision.

## 4.4 Ambassador rollup in the CRM

**Nothing in the current admin supports it**, because there are no reports.
Once `EventReport` exists, three screens follow, and two of them already have
the right shape to copy:

1. **`/admin/reports`** — new. By program: reports this month, schools
   reporting, schools silent. By school: which programs are alive.
2. **On `/admin/schools/[slug]`** — a block beside the activity timeline:
   "Kindness Booth · 3 events reported this cycle · ~140 students · last 8 Sep".
3. **On the program console** — the mirror of the panel already there for the
   JOC App: schools whose ambassadors have gone quiet, worst first, exactly like
   [src/lib/app-flags.ts](src/lib/app-flags.ts) does for app activity. The flag
   rules (`quiet` = nothing for 14 days at an active school) transfer directly.

Silence detection is the whole point. A school that stops reporting is a school
about to churn, and JOC currently learns that at renewal.

## Still open (CRM)

1. `ProgramEnrollment` (4.3) — the biggest single schema gap.
2. `Stat` model is dead code.
3. No renewal schedule or reminder; `Subscription.renewsAt` is a date nobody
   is told about.
4. No record of materials sent to a school.
5. 36 of 37 schools have no `appSchoolId`, so the JOC App console shows one
   school.
6. 1 `SchoolContact` row across 37 schools — the CRM has almost no contacts in
   it.

---

# Section 5 — Duplicated data

The pattern here is deliberate and documented: a static array is the fallback
when the database is unreachable
([src/lib/content.ts:11](src/lib/content.ts#L11)). It is a reasonable choice.
It is also now **wrong in four places**, because the database has moved on and
the fallbacks have not.

| Dataset | Canonical | Duplicate | Disagreement |
|---|---|---|---|
| Programs | `ProgramPage` — **8 rows, 8 published** | `PROGRAMS` in [src/lib/programs.ts:26](src/lib/programs.ts#L26) — **6 entries** | **Yes.** Two programs would vanish if the fallback were ever used. Read at [content.ts:199,206,235](src/lib/content.ts#L199). A *third* copy: `FALLBACK_PROGRAMS` in [src/components/layout/Footer.tsx:23](src/components/layout/Footer.tsx#L23). |
| Lessons | `LessonPlan` — **13 rows, 4 published** | `LESSONS` in [src/lib/lessons.ts:17](src/lib/lessons.ts#L17) — **9 entries** | **Yes**, and worse: the static set has file *names* with no files behind them ([content.ts:26](src/lib/content.ts#L26)), so the fallback advertises downloads that 404. Also read directly by [src/app/admin/lessons/page.tsx:16](src/app/admin/lessons/page.tsx#L16). |
| Cycles | `Cycle` + `CycleWeek` — **8 rows** | `CYCLES` in [src/lib/cycles.ts:125](src/lib/cycles.ts#L125) — **8 entries** | Counts agree; **dates unverified in both** ([cycles.ts:3](src/lib/cycles.ts#L3)). Read at [cycle-data.ts:18,24,45](src/lib/cycle-data.ts#L18). |
| Pricing | `PricingPlan` + `ProgramPrice` | fallback figures in [src/lib/pricing.ts](src/lib/pricing.ts) | The file says it plainly: *"The fallbacks are almost certainly wrong. Nobody at JOC set them."* |
| Products | `Product` — **6 rows** | `prisma/seed.ts:343` | Seed-only; no runtime duplicate. Fine. |
| Board posts | `BoardPost` — **0 rows** | none | Single source. |
| Resources | `Resource` — **0 rows** | none | Single source; the page says the library is being built. |
| School / hours statistics | `SiteField` (56 rows), editable at `/admin/site` | none | **Already collapsed.** No invented figure survives in the codebase — see Section 8. |
| "Is this school in this program?" | `ProgramEnrollment` | ~~inferred twice~~ | **Collapsed in `817c0f5`.** Both readers call [src/lib/program-enrollment.ts](src/lib/program-enrollment.ts). |

**Recommendation.** Keep the fallback pattern; stop hand-maintaining the
fallbacks. Generate `programs.ts`, `lessons.ts` and `cycles.ts` from the
database with a script that runs before a release, or reduce each to a single
honest placeholder row plus "the library could not be reached". A fallback that
silently shows a school six programs when JOC runs eight is worse than a
fallback that says it failed.

---

# Section 6 — Code bugs

1. **`prisma/seed.ts` passing unknown fields** — checked. It touches only
   `lessonPlan.upsert` (line 307) and `product.upsert` (line 343). No unknown
   columns. `npx prisma db seed` would still fail in this environment because
   the seed runs through `tsx` and esbuild cannot spawn here; use
   `node --env-file=.env` against a compiled script instead. Noted in the
   scripts folder.

2. **`src/app/programs/page.tsx` slug mismatch** — not reproducible as
   described. The page reads `getPublishedPrograms()` and links by the slug it
   was given; there are no hardcoded `programs/<slug>` hrefs in it. The risk
   has moved to the *fallback*: `PROGRAMS` has 6 slugs and `ProgramPage` has 8,
   so a fallback render produces a page missing two programs rather than two
   broken links. See Section 5.

3. **`metadataBase`** — set, [src/app/layout.tsx:25](src/app/layout.tsx#L25).

4. **`CycleStripSection` hardcoded count** — the component is now
   `CycleRailSection` and takes `cycles` as a prop; every count is
   `CYCLES.length` derived from it (lines 214, 257, 274, 356, 398, 424). No
   hardcoded 8.

5. **Orphaned components** — exactly one:
   `src/components/admin/AccountsGuard.tsx`, imported nowhere. It was
   superseded by the `SchoolsGuard`/`UsersGuard`/etc. family in
   `src/components/admin/Guard.tsx`. **Deleted in this audit** — a second,
   older guard sitting in the tree is the kind of thing somebody imports by
   mistake.

6. **Seed script registration** — `package.json:36-38` (`"prisma": { "seed":
   "tsx prisma/seed.ts" }`). There is **no `prisma.config.ts`**. Prisma 6.19
   prints a deprecation notice about moving the seed there; harmless today,
   worth doing when the Prisma version next moves.

7. **`alert()` calls** — none in `src/`.

8. **`/api/lights` behind the gate** — found and fixed during this audit
   (`f09bbc3`). Vercel Cron carries no session cookie, so the edge gate
   answered the nightly traffic-light run with a 401 before its `CRON_SECRET`
   check ran. The only symptom would have been lights that quietly stopped
   updating.

9. **Two cron jobs is the Hobby ceiling.** `vercel.json` now holds exactly two.
   A third fails the *entire deployment* with no useful message — this has
   already cost four silent non-deploys once ([CRON.md](CRON.md)). Anything
   else needing a schedule must go inside one of the existing two until the
   move to a paid team.

10. **The landing signup tab** (2.1) — fixed in this audit.

11. **`Date.now()` during render.** The React purity rule flags four sites:
    `CyclesClient.tsx:142`, `ProgramAdminClient.tsx:248` and two in the new
    `AdminMeetingClient.tsx`. The meetings ones are fixed — which meeting is
    next, and whether one is overdue, are now decided once on the server and
    passed down, rather than answered differently by the server and the browser
    a moment apart. The other two are pre-existing and worth the same
    treatment.

---

# Section 7 — Database and environment

## 7.1 Models — 50, plus 24 enums

School, SchoolContact, SchoolActivity, Invitation, PlanChangeRequest,
DemoRequest, User, Account, Session, VerificationToken, Subscription,
LessonPlan, LessonFile, LessonObjective, LessonMaterial, LessonStep,
LessonDiscussion, SavedLesson, Resource, BoardPost, BoardLike, Product,
SiteField, SiteFieldHistory, Stat, StoredFile, ProgramPage, ProgramStep,
ContactMessage, Order, OrderItem, Room, RoomMember, RoomMessage, Cycle,
CycleWeek, PricingPlan, ProgramPrice, ProgramEvent, AdminRole, Form, FormField,
FormResponse, AppSchoolStats, AppChallengeStat, AppSchoolMessage, AppSyncRun,
SchoolProgramLight, AdminMeeting, AdminMeetingItem.

## 7.2 Has `prisma migrate` run?

Yes — **29 migrations**, `20260910112046_init` through
`20260926100000_program_traffic_light`, all applied to the live database.

A caveat for whoever works on this next: `npx prisma migrate` **does not run in
the current sandbox** — the schema engine fails with `ENOENT` because of
Windows Store path redirection. The workaround in use is to hand-write the SQL
and apply it with [scripts/apply-migration.mjs](scripts/apply-migration.mjs),
which also writes the `_prisma_migrations` row so the history stays honest.
`./node_modules/.bin/prisma validate` and `generate` both work.

## 7.3 Live row counts

```
School                 37      (1 with appSchoolId)
User                   14      (9 @justonechesed.org)
AdminRole               4
ProgramPage             8      (8 published)
LessonPlan             13      (4 published)
Resource                0
Product                 6
Form                    9      (2 published)
FormResponse            9
BoardPost               0
Room                    7
Cycle                   8
ProgramEvent            8
Subscription            1
Order                   0
SchoolActivity         39
SchoolContact           1
ContactMessage          0
DemoRequest             0
SiteField              56
StoredFile             12
AppSchoolStats          0
AppSyncRun              0
SchoolProgramLight    296      (288 green, 8 amber)
AdminMeeting            0
```

## 7.4 API routes: database vs. static

Every one of the 10 API routes reads or writes the database, or delegates to a
library that does. None returns a static array.

| Route | Database |
|---|---|
| `/api/auth/[...nextauth]` | yes (Prisma adapter) |
| `/api/contact` | writes `ContactMessage` |
| `/api/demo-request` | writes `DemoRequest` |
| `/api/files/[id]` | reads `StoredFile` |
| `/api/forms/[id]/export` | reads `FormResponse` |
| `/api/school/sign-ups/export` | reads `FormResponse`, school-scoped |
| `/api/stripe/webhook` | marks `FormResponse.paid` and `Order` paid |
| `/api/app-sync` | writes `AppSchoolStats` etc. |
| `/api/lights` | writes `SchoolProgramLight` |
| `/api/version` | no — build metadata only, correctly |

## 7.5 Environment variables

23 referenced. Status inferred from live behaviour:

**Set** — `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (the gate is live),
plus the `VERCEL_*` variables Vercel injects.

**Not set** —

| Variable | Consequence |
|---|---|
| **`CRON_SECRET`** | **Both scheduled jobs are dead.** `/api/app-sync` and `/api/lights` each answer **503** on the live site — they refuse to run rather than leave an unauthenticated endpoint that rewrites every school's figures. So the JOC App is never read and the traffic light is never recomputed overnight. One variable, any long random string, same value in Vercel. This is the cheapest fix on the list. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in is not offered; password only |
| `RESEND_API_KEY` / `EMAIL_FROM` | no mail sent at all; password reset dead-ends |
| `EMAIL_LAUNCHED` | correct — no school can be emailed |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | no checkout; paid forms refuse to publish |
| `JOC_APP_API_URL` / `JOC_APP_API_KEY` | JOC App never read; 0 `AppSyncRun` rows |
| `NEXT_PUBLIC_BASE_URL` | falls back to the production host; fine |
| `SUPER_ADMIN_EMAILS` / `PROGRAM_STAFF_EMAILS` | optional; both have safe defaults that *add to* rather than replace the built-in list |
| `GATE_DISABLED` | correct — unset means the gate is on |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are **not used and not needed**:
Supabase is reached as plain Postgres and files live in the database, not in
object storage ([prisma/schema.prisma:762](prisma/schema.prisma#L762)).

---

# Section 8 — Content integrity

**This has already been cleaned up, and thoroughly.**

- **Team members** — the invented staff list is gone.
  [src/app/about/page.tsx:12-17](src/app/about/page.tsx#L12) says so outright:
  *"invented people with invented biographies, and numbers nobody had counted.
  They are empty until someone enters something true, and each section hides
  itself while it has nothing to show."* Team, milestones and stats are now
  `SiteField` lists, editable at `/admin/site`, empty until filled.
- **Testimonials** — [src/lib/programs.ts:12](src/lib/programs.ts#L12):
  *"A real quote from a real school. Never a written one — the five that used
  to sit here were invented and attributed to named rebbeim."* The field is
  optional and currently unused.
- **Statistics** — no hardcoded school count, student count or chesed-hours
  figure survives anywhere in `src/app`. The resources page refuses to quote a
  number and says the library is being built
  ([resources/page.tsx:13](src/app/resources/page.tsx#L13)).
- **Pricing** — the fallback figures are the one remaining set of numbers
  nobody has verified, and the file says so
  ([src/lib/pricing.ts:11](src/lib/pricing.ts#L11)).

**Contradictions across files:** the only live ones are the fallback-vs-database
mismatches in Section 5 — 6 static programs against 8 real ones, 9 static
lessons against 13 real ones.

**Claims not sourceable from real data:** the pricing fallbacks, and the 5787
cycle dates.

---

# Section 9 — Restructuring roadmap

Ordered by what blocks what, not by effort.

## Stage 1 — before any real data can be collected

1. ~~**Close the auth escape hatch.**~~ **Done in this audit** — see 1.1.
   `openForReview`, the gate change, and the boot banner.
2. ~~**Fix the landing signup tab.**~~ **Done.** The fake 700ms wait is gone;
   the sign-in tab posts to the real action and the create-account tab links to
   `/signup` rather than half-duplicating its form.
3. ~~**Call `requireAccountHolder()` on `/school/plan` and
   `/school/teachers`.**~~ **Done** — see 1.3.
4. ~~**Delete `src/components/admin/AccountsGuard.tsx`.**~~ **Done.**
5. **Delete the `Stat` model** — still there, still unreferenced.
6. **Revoke the leaked GitHub token.** Needs the account owner.
7. Add page-level guards to `/school/activity` and `/school/cycles`; narrow the
   `/account` gate exemption to `/account/password`.

The four-role system the brief asks for **already exists** and is better than
four roles: six roles × 19 capabilities × two scoped assignments. Nothing is
blocked on it. The one thing missing is the ambassador scope, which is Stage 4.

## Stage 2 — before a school can sign up and pay

6. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel. The code is written
   and refuses to pretend without them.
7. `RESEND_API_KEY` + `EMAIL_FROM`, keeping `EMAIL_LAUNCHED` **off**. This gets
   password reset working for the JOC team without a single school hearing
   anything.
8. Replace the pricing `mailto:` with a real checkout once 6 lands.
9. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, so a teacher signs in with the
   Google account they already have.
10. Correct the pricing fallbacks, or delete them and let the page say the
    prices could not be loaded.

## Stage 3 — deliver on the educator promise

11. Publish lessons. 4 of 13 are live; the library is the product.
12. Put something in `Resource`. Zero rows, and the page honestly says so.
13. Verify the 5787 cycle dates against a luach. Everything on the site is
    organised around them.
14. Unpublish `Test Form`.
15. Seed the Teachers' Board — 0 posts is a board nobody will start using.

## Stage 4 — the ambassador platform, in order

16. ~~**`ProgramEnrollment`** (4.3) first.~~ **Done in `817c0f5`** — see 4.3.
    An ambassador now has something well-defined to be scoped to.
17. **`ProgramAmbassador` + `AmbassadorInvite`**, with the two-per-program cap
    and `endsAt`, plus a `requireAmbassador()` scope helper beside
    `requireAccountHolder()`.
18. **The join flow** — teacher generates a code on
    `/school/programs/[slug]/ambassadors`, student redeems at
    `/ambassador/join`. No email anywhere in it.
19. **`EventReport` + `/ambassador/report`**, with the privacy rules in 3.6
    written into the model and the queries, not into the UI.
20. **Teacher visibility** — the supervisor's read of their two ambassadors'
    reports. This is what makes the students keep submitting.
21. **JOC rollup** — `/admin/reports`, then the per-school block, then the
    silence flags on each program console, reusing the flag machinery in
    [src/lib/app-flags.ts](src/lib/app-flags.ts).

Do not build 21 before 20. A rollup nobody at the school ever sees produces
three reports and then silence.

## Stage 5 — the CRM at scale

22. Enrollment stage board per school × program, on the back of 16.
23. `RenewalSchedule` — or simply a flag on the existing overview when
    `Subscription.renewsAt` is inside 60 days. The date exists; nobody is told.
24. Material-delivery records: what was sent to a school and when.
25. Match the remaining 36 schools to the JOC App (`appSchoolId`), then set
    `JOC_APP_API_URL` / `JOC_APP_API_KEY`. Until then the App console shows one
    school.
26. Fill `SchoolContact` — 1 row across 37 schools means the traffic light's
    "Reach out" button has nobody to ring.

## Stage 6 — collapse the duplicates

27. Generate `programs.ts` / `lessons.ts` / `cycles.ts` from the database at
    release time, or cut each to one honest placeholder. Never hand-maintain a
    second copy of a list the console edits.
28. Delete `FALLBACK_PROGRAMS` in `Footer.tsx` — a third copy of the same list.
29. ~~Replace both copies of the "is this school in this program?" inference
    with a `ProgramEnrollment` read.~~ **Done in `817c0f5`.**

## Stage 7 — schema summary

**Add:** ~~`ProgramEnrollment` + `EnrollmentStage`~~ (done),
`ProgramAmbassador`, `AmbassadorInvite`, `EventReport`, optionally
`RenewalSchedule` and `MaterialDelivery`.

**Add capabilities:** `view_ambassador_reports` (Programs group),
`manage_ambassadors` (School accounts group).

**Remove:** `Stat`.

**Leave alone:** `School`, `SchoolContact`, `SchoolActivity`, `Subscription`,
`AdminRole` and the capability system. They are the parts of this schema that
are already right, and the ambassador and enrollment work should attach to them
rather than reinvent them.

---

---

# The portal redesign — all five phases, September 2026

Worked from `design/PROMPT - Portal redesign.md`, which arrived after this
report was written. Every acceptance check in that brief now returns zero.

| Phase | Commit | What changed |
|---|---|---|
| 1 | `3f7d534`, `da4e2a9` | One colour source, three fonts with one job each |
| 2 | `709aa2a` | The program page says each thing once |
| 3 | `da79bce` | A console per program, opening on what needs you |
| 4 | `8c59699` | One shell, and Today for whoever is looking |
| 5 | `d2cbb12` | Stale lists gone, one heading scale |

**Phase 1.** 685 colour values retired across 113 files, and the 256 local
`const INK / BLUE / RULE…` copies deleted from 75. `RULE` had existed at four
alphas with nothing to tell them apart; all four are one hairline. Outfit,
Newsreader and IBM Plex Mono each got one job. Six uppercase label variants
became one. All 31 `"—"` placeholders say what is missing, in words. All 18
emoji became Plex Mono chips.

**Phase 2.** The path appeared twice and the description twice. Each appears
once. The next-step card has three states, and a signed-in coordinator sees
their own school's step — which is what `ProgramEnrollment` was built for.

**Phase 3.** Every section of a program console is a tab with its own address,
and Today is the default; the form builder is no longer the first thing on the
page. `slug === "joc-app"` is replaced by a registry, so the seven programs
with no data source say in a sentence what is not recorded rather than showing
an empty chart.

**Phase 4.** One `PortalShell` for both sides. The sidebar went from twenty-odd
links across five headings to at most seven, built from capabilities.
`/admin` is Today rather than a board to browse.

**Phase 5.** The footer's third copy of the programs list is gone, the static
fallbacks no longer stand in for an unreachable database, `Stat` is deleted,
and twelve page titles at four sizes became one scale.

## What this changed about the report above

- **4.3 `ProgramEnrollment`** — built, and now drives the program page's
  next-step card and the school's own Today.
- **Section 3, the ambassador platform** — built. Three tables, three routes,
  and the rollup on each program console.
- **Section 5, duplicated data** — the footer's copy is gone and the stale
  fallbacks no longer serve. The static arrays remain as seeds for a fresh
  database, which is what they are for.
- **Section 6, the `Stat` model** — deleted.
- **Section 9, Stage 1** — every item is done except revoking the GitHub
  token, which needs the account owner.

## Still open, and still needing you

1. **`CRON_SECRET`** is not set, so nothing scheduled runs. This is now
   visible: it is the first row a super admin sees on `/admin`, with what it
   costs written out. It still needs setting in Vercel.
2. **The library.** 4 published lessons, 0 resources. The console now says so
   on Today rather than leaving it to be noticed.
3. **Revoke the GitHub token.**
4. **Seven of eight programs have nobody down as running them** — surfaced by
   the new program cards, in orange.
5. **Pricing is unverified.** The fallbacks remain the seed for
   `/admin/pricing`, and the file still says nobody at JOC set them.

---

## Two sentences, if that is all there is time for

The security and stub problems this audit was commissioned to find have already
been fixed; what remains is that the platform is **built and empty** — 0
resources, 4 published lessons, 0 board posts, 1 school contact, 1 school on the
app — and that two things are structurally missing: a `ProgramEnrollment` table
to say which school runs which program and how far along it is, and the entire
student-ambassador layer, which needs that table underneath it before anything
else in it can be scoped correctly.

---

## The fix pass, against the reference (28 Sep 2026)

`design/Portal Redesign (standalone).html` is the visual reference, and it was
in the repo the whole time without being opened. Everything below was measured
off it rather than inferred from the brief's prose.

**The row (2b).** Band `flex 1 1 140`, body `100 1 220` centred with a 4px gap,
action `1 1 170` — a column that grows with its button filling it. It had been
170/280/auto with the button shrink-wrapped and pushed right, so every row
ended on a ragged edge. `BandRow` is that row, and Today, Schools, the traffic
light, the school's Today and the teacher's home all use it.

**The program card (2a).** The kind sits on the name's line; then who runs it;
then the figure on one baseline with "need you today" beside it; then one mono
status line. Three across at 300px.

**Today (3a).** The date in mono above a heading that is the answer — "Three
things need you" — then the rows, then four figures with the number first.

**One label, one scale, one palette.** 134 hand-built uppercase labels became
the token; 18 headings became `pageTitle` 30/600 and `sectionHeading` 24/700;
1,377 hexes became `C.*`. `14.5px`, `13.5px` and `10.5px` are gone.

**Said once, not eight times.** `/admin/my-programs` repeated "nobody is down
as running it" on seven cards and "nothing needs you today" on eight. The
seven are one warn row with a count and an action; the eight are gone.

### The Kindness Booth's real content

Read off `justonechesed.org/education/kindness-booths-for-schools`. The portal's
copy had been written from the program's name: it said the booth goes to a
community event and students hand things to passersby, when it is a table
inside the school where students and faculty choose an act of kindness. Three
parts of the real page had no field, and now do:

| Content | Field |
|---|---|
| The four acts — write a note, take a candy, say a Tehillim, help someone | `ProgramActivity` |
| "A new act is added each month, often tied to a yom tov" | `ProgramPage.activitiesNote` |
| The heading over them | `ProgramPage.activitiesTitle` |
| Folding table, speaker, candies | `ProgramPage.schoolProvides` |

The kit (`whatsIncluded`) is the real eleven items, and `videoUrl` is the
booth's own film rather than a channel playlist.
`scripts/kindness-booth-content.mjs` writes it and can be re-run.

### Still open

- The school side (3e, 3f) is built on `BandRow` but has never been rendered
  with a school session in this environment, so it is type-checked and built
  rather than seen.
- The other seven programs' pages carry copy written the same way the Kindness
  Booth's was. Each needs reading off its own page on justonechesed.org.
