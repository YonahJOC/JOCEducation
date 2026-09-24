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

## Pull these

### 1. The headline figures — one call

`GET /organisations/{id}/dashboard` returns, in one response, most of what the
console shows today:

| Field | Feeds |
|---|---|
| `hoursInSchoolYear` | hours this year |
| `totalSpendTime` | hours all time |
| `claimsCount` | **hours waiting on a teacher** — the console's headline flag |
| `volunteersTotal` | students on the app |
| `volunteersGroups` | how many classes |
| `opportunitiesUpcoming` | opportunities open |
| `opportunitiesPendingVolunteers` | places nobody has taken |
| `opportunitiesVacancies` | spare places on what is booked |
| `opportunitiesPast` / `opportunitiesTotal` | what has run |
| `countOpportunitiesInSchoolYear` | this year's activity |

It takes an `x-time-zone-offset` header, which matters — a day boundary
decides whether an hour counts as "this week".

### 2. What is waiting on a teacher

`POST /claims/searchClaims` with `isAccepted` set to the pending status.

**Pull the count and the oldest date. Do not pull the records.** See the
warning below.

That gives `unapprovedEntries`, `unapprovedStudents` (distinct `userId`) and
`unapprovedOldestAt`, and the three ageing buckets the console already draws.

### 3. Movement over time

`GET /statistics/organisation-statistics-general?fromDate&toDate` returns
`volunteers`, `opportunities` and `chesedHours` as comparable items, which is
exactly what the "STUDENTS DROPPING 62 → 27" row needs — two windows, not one
number.

`GET /statistics/organisation-statistics-users-logins` over a window answers
"has this school gone quiet", which is the `GONE QUIET` flag.

### 4. The prize store

`POST /store-items/searchByAdmin` and `POST /store-items/{id}/searchStoreCoupons`
give what has been redeemed and what is on offer, for the store chips. A
school with no published store items is "Prize store not open" rather than
zero.

### 5. Challenges

`POST /challenges/searchByAdmin` and `GET /challenges/getOpenChallenge` fill
`AppChallengeStat` — title, joined, finished, running.

### 6. Two things we do not hold yet, and should

**Yearly goals, per grade.** `GET /schools/{id}/getYearlyGoals` returns
`{ gradeId, hourYearlyGoal, actYearlyGoal }`. The portal has no concept of a
target, so every figure it shows is a bare number with nothing to measure
against. "28.5 h waiting" means one thing for a school aiming at 200 hours and
another for one aiming at 2,000. This is the single most valuable thing in the
API that we are not using.

**The school year.** `GET /schools/{id}` gives `startYearDate` and
`endYearDate`. We are about to store `Payment.schoolYear` as a string and
derive "this year" figures — both should come from the school's own year, not
from a guess about September.

Also there: `grades`, which would let the console and the school's own page
break figures down by grade rather than showing one school-wide total.

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
3. **Confirmation on the goals.** Pulling per-grade targets means adding them
   to our schema and showing progress against them — a real addition to the
   console rather than a swap of one number for another.
