# Claude Design: what each program brought in, and what each school paid

## The situation

Stripe is about to be connected. Once it is, two people need an answer that
nobody can get today.

**A program coordinator** wants to know what their program brought in — this
month, this year, all time — and which schools that came from. Only their own
program. A coordinator holds no capability at all; being named on a program is
their entire permission, and it must stay that way.

**A super admin** wants it both ways round: what each school has paid JOC
across everything, and what each program has brought in across all schools —
and to be able to cross the two.

## Read this before designing anything

**There is no record in the database that ties money to a program.** This is
the crux, and a design that assumes otherwise cannot be built.

What exists today:

| Model | What it holds | Program? |
|---|---|---|
| `Subscription` | one per school, a plan, an interval, Stripe customer and sub ids, seats, and the grant fields | no |
| `Order` | shop orders — products, a subtotal in cents, a status | no |
| `Form.feeCents` + `FormResponse.paid` | a fee on a program's sign-up form, and a **boolean** | the form belongs to a program, but no amount and no date are stored |
| `ProgramPrice` | the pricing *table* — what things cost | it is a price list, not a record of payment |

So "the Kindness Booth brought in $4,200 this year" cannot be computed. Not
approximately — at all.

Before any of this is designed, there has to be **one table that records a
payment**: how much, when, which school, which program (nullable — a
subscription is not for one program), what kind of thing was paid for, and the
Stripe ids that prove it. Every figure below is a view over that table.

Please say in your response what that record needs to carry for the screens
you design, because that is the thing that gets built first.

## The screens

### 1. The coordinator's, on their own program console

A **Money** tab beside Today, Schools, Calendar, Sign-ups, Setup — shown only
to somebody who may see it.

It answers: what has this program brought in, and from whom. Three figures
(this month, this year, all time) and a list of schools with what each paid and
when.

Open questions for you:
- Is "this month" the useful frame for a program that runs once a year? What
  does an Event program's Money tab want to say that an Ongoing one does not?
- A program with no payments yet: what does the tab say? Not a zero and not an
  empty chart.

### 2. The super admin's

Money is already a rail item (`/admin/orders`). It needs to answer three
questions without becoming a reporting suite:

- **Per school.** What has this school paid JOC, across everything, and what
  are they on now.
- **Per program.** What has each program brought in, so the eight can be
  compared.
- **Crossed.** Which schools pay for which programs.

The third is a grid and grids get unreadable fast. If a grid is right, say how
it holds at 375px. If it is not, say what replaces it.

## Things that will look like edge cases and are not

- **Grants.** JOC gives schools scholarships, pilots and comps —
  `grantedManually`, `grantKind` and `grantNote` already exist. A granted
  school has paid nothing and that is not missing data, it is a decision
  somebody made and wrote down. It must read as a grant with its reason, never
  as a zero or a gap.
- **Refunds and failed payments.** Must be visible as themselves. A refund
  quietly netted off a total is how a number stops being trusted.
- **A subscription is not for one program.** When a school pays for a plan that
  includes four programs, that money cannot be honestly attributed to any one
  of them. Decide what a coordinator sees in that case and say so plainly on
  the screen — an invented share is worse than "included in their plan".
- **Money is the one thing people check on a phone.** These screens have to
  work at 375px, not degrade to a scrollable table.

## Rules that do not move

- **Nothing reaches a school.** No new send path. No invoice emails, no
  reminders, nothing.
- **Real or absent.** No "—", no empty cell, no 0 standing in for unknown. Say
  what is missing in words, in `#C96C00`. A figure nobody has recorded is not
  zero.
- **Check capabilities, never roles.** A coordinator sees their own program's
  money because they are named on it, not because of a role.
- **Hold at 375px.** 44px hit targets, `prefers-reduced-motion`.
- The system is `src/lib/joc-tokens.ts`; the reference is
  `design/Portal Redesign (standalone).html`. Figures are mono labels over
  Outfit numbers at 24–30/800; rows are `BandRow`.

## What I need from you

The two screens, at 1280 and 375, plus the list of fields a payment record has
to carry for them to be real.
