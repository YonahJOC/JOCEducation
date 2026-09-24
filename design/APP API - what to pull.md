# The JOC App API: what the school's App Console should pull

Read from `https://api.justonechesed.org/api-json` — 275 endpoints across 31
groups. Bearer JWT.

## The one thing to understand first

**The App does not have schools and students. It has organisations and
volunteers.** A school is an `organisation`; a student is a `volunteer`; a
chesed act is an `opportunity`; an hour waiting for a teacher is a `claim`.

There is a small `schools` group (4 endpoints) but it holds only settings —
the school year, the grade list and the yearly goals. Everything that moves is
under `organisations`, `opportunities`, `claims` and `statistics`.

This matters because `School.appSchoolId` in our database is matched against
the App by hand, and it is the organisation id that everything below is keyed
on.

---

## What the console is for

**Triage, not detail.** The console answers one question about each school —
does this need somebody today — and then hands over. A school's own figures,
its students, its opportunities and its store belong in the App's admin panel,
which the school opens itself.

So the rule for everything below: if a number changes what JOC does next, pull
it. If it is something a school would look up about itself, link to the App
instead of copying it here. Copying it means two places to keep right, and the
App is the one that is actually right.

---

## Pull these

### 1. The headline figures — one call per school

`GET /organisations/{id}/dashboard`, which carries nearly everything the
console draws:

| Field | Feeds |
|---|---|
| `claimsCount` | **hours waiting on a teacher** — the console's loudest flag |
| `hoursInSchoolYear` | hours this year |
| `volunteersTotal` | students on the app |
| `opportunitiesUpcoming` | is anything coming up |
| `opportunitiesPendingVolunteers` | places nobody has taken |

It takes an `x-time-zone-offset` header, which decides whether an hour counts
as "this week".

### 2. The oldest thing waiting

`POST /claims/searchClaims` filtered to pending — for **the count and the
oldest date only**. That is what makes a row say "oldest since 8 Sep" and what
fills the three ageing buckets. See the warning below about what else that
response carries.

### 3. Whether a school is going quiet

`GET /statistics/organisation-statistics-general?fromDate&toDate` over two
windows gives the movement behind "STUDENTS DROPPING 62 → 27", and
`organisation-statistics-users-logins` answers "nothing logged since 2 Sep".
Both are triage: they are the reason somebody picks up the phone.

### 4. The school's own year

`GET /schools/{id}` gives `startYearDate` and `endYearDate`. Worth pulling
because we are about to store `Payment.schoolYear` and compute "this year"
from a guess about September, when the App knows each school's real year.

### Not for the console

These are real and useful, and they belong in the App's admin panel rather
than here: store items and coupons, challenge detail, per-grade breakdowns,
opportunity lists, volunteer records, group membership. Every one of them is
something a school looks up about itself.

**Per-grade yearly goals** (`/schools/{id}/getYearlyGoals`) sit on the line. A
target is what makes a figure mean anything — 28.5 hours waiting reads
differently at a school aiming for 200 than at one aiming for 2,000 — but the
per-grade breakdown is detail. If it is wanted, it should be one number per
school on the console and the breakdown left in the App.

---

## Do not pull

**`POST /claims/searchClaims` returns `UserClaimResponse`, and that carries
`firstName`, `lastName`, `email`, `phoneNumber`, `birthDate`, `address`,
`imagePath` and `studentId`.** These are children.

The rule in this portal is that a student's name appears only to their
supervising teacher. So:

- The JOC-side console pulls **counts and dates only**. It never stores a
  claim record and never shows a name.
- If the school's own side ever needs names, it fetches them at request time
  for that teacher, scoped to that teacher's own school, and stores nothing.
- Nothing from `/statistics/top-volunteers`, `/volunteer/leaderBoard`,
  `/statistics/adminTopVolunteers` or `/volunteer/search` belongs in this
  portal at all. They are leaderboards of named minors.

**Nothing that sends.** `/chat/broadcastMessage`,
`/general/broadcastPushNotifications` and `/general/sendInTouchEmail` all
reach schools and students. The rule holds: this portal records, it does not
send. These are not to be called.

---

## How it should run

The sync we have is a nightly cron writing `AppSchoolStats`, and the console
already says "AS OF <time>" and turns orange when it goes stale. That shape is
right. What changes:

1. One `GET /organisations/{id}/dashboard` per matched school, plus the claims
   count and the two statistics windows.
2. Write the same `AppSchoolStats` row we write today, plus the goals.
3. `syncedAt` is what the console's "as of" already reads.

**A school we cannot match is not a school with zero hours.** `appSchoolId` is
null for most schools, and the console already distinguishes "never reported"
from "reported nothing" — that distinction has to survive.

---

## What I need before building it

1. **A token, and which account it belongs to.** Everything is bearer JWT. It
   should be a service account for the portal, not a person's login.
2. **Whether `appSchoolId` holds the organisation id** for the schools already
   matched. Three schools are matched today and I have not seen a real id.
3. **The link out.** Every row should end at the school's own page in the App's
   admin panel, which is where the detail lives. I need the URL pattern — is
   it `app.justonechesed.org/organisation/{id}`, or something else?
4. **Whether you want the yearly goal** as a single school-wide figure on the
   console, or not at all.
