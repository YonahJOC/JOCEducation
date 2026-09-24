# Claude Design: the school that has one program and nothing else

## The situation

JOC is going live to schools it already works with, one program at a time —
Kindness Booth first, then the JOC App. These are not subscribers. They run
one JOC program and that is the whole relationship.

For those schools:

- The **school account already exists** in the portal.
- The **program enrolment already exists** — the school is down as running
  Kindness Booth, at some stage.
- The **educator is given nothing else**. Not lesson plans, not the resource
  library, not the Chesed Cycles, not the Teachers' Board, not the other seven
  programs.
- Day to day, they **run the program in its own standalone portal** — the JOC
  App lives at app.justonechesed.org; the Kindness Booth has its own materials
  and flow. The education portal is not where the work happens.

So the education portal, for this person, is a front door to one program and a
window onto everything they have not got yet.

The thing to get right is the tone of that window. This is not a locked door
and it is not a paywall. These are schools JOC already has a relationship
with. Every page they cannot open is a page we want them to ask for. The
worst outcome is an educator signing in, finding five dead ends, and deciding
the portal is broken or that JOC is charging them for something.

## What has to exist

### 1. A third state

Today a school is one of two things: it has a subscription and its teachers
get the materials, or it has not and they see the public site. We need a
third: **one program, no plan**.

It should be derived from what is already true, not from a new switch somebody
has to remember to set — a school with at least one `ProgramEnrollment` and no
active `Subscription` is a one-program school. JOC also needs to be able to say
otherwise for a particular school, and `Subscription.grantedManually` with
`grantKind` already exists for exactly that.

It must be a **capability or scope check, never a role check**. That is a rule
the codebase holds throughout and this must not be the exception.

### 2. The educator's home becomes their program

`/home` today opens on the running Chesed Cycle and this week's lesson. For
this educator the Cycle is not theirs and there is no lesson. Their home is
their program: where it has got to, what happens next, and the way into the
standalone portal where they actually run it.

### 3. One "not yours yet" state, used everywhere

`/lesson-plans`, `/resources`, `/cycles`, `/board`, `/rooms`, and the other
programs' pages all need the same treatment, and it needs to be one component,
not six variations. A heading, one sentence, one action.

The action is an ask, and it is **inbound only** — the school tells us they are
interested, the same way a demo request works today. **Nothing in this portal
sends anything to a school.** That rule does not move.

### 4. The navigation must not advertise what it will not open

If the header offers Lesson Plans and every click lands on "not yet", the
header is lying. Whatever the signed-in header shows this person has to match
what they can actually do.

### 5. Somewhere to put the standalone portal

Each program needs a field for "where this is actually run" — a URL and a
label. `ProgramPage.externalHref` exists but it means something else (a program
whose *public page* lives on another JOC site, like Chesed Match). This is a
different thing: the place the school's educator goes to do the work.

## What I need from you

1. **The educator's home** for a one-program school. What is on it, in what
   order, and what the one obvious action is. Consider: are they mid-setup
   (step 2 of 4) or running it? Those are different screens.

2. **The "not yours yet" page.** One design, used on six or more pages. It has
   to read as an invitation and it has to be honest — some of these things are
   genuinely not built yet, and some are built and not theirs. Should those
   read differently?

3. **What the signed-in header becomes** for this person.

4. **The ask.** What does an educator press, what do they fill in, and what do
   they see afterwards, given we send them nothing?

5. **The school admin's view**, if their principal signs in. They can see
   `/school` today — their programs, their teachers, their plan and seats. With
   no plan, what is on that page?

## Rules that do not move

- **Nothing reaches a school.** No new send path, anywhere. Every action
  records what a person did after they did it.
- **Real or absent.** No "—", no empty cell, no 0 standing in for unknown. Say
  what is missing in words, in `#C96C00`.
- **Students are minors.** A student's name appears only on the supervising
  teacher's page.
- **Check capabilities, never roles.**
- **Hold at 375px.** 44px hit targets, and respect `prefers-reduced-motion`.
- The system is in `src/lib/joc-tokens.ts` and the reference is
  `design/Portal Redesign (standalone).html`. Rows are `BandRow`: a mono label
  over one big figure, a name at 19/700, one line of Newsreader, one filled
  button sized to its column.
