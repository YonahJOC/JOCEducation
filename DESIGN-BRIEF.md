# JOC portal — six screens that need designing

Everything below is **built and working**. None of it has a design reference.
The JOC App console does — `JOC App Console (standalone).html` — and it is now
matched. These six were built to the same tokens by eye, which is not the same
thing as being designed.

Please produce a standalone HTML reference for each, the same way the App
console one works: real markup, sample figures, no framework. Every number in
your file is a specimen; none of it ships.

---

## The tokens (already in the build — use these literally)

**Colour**
- Blue `#2D46AF`, hover `#223892`, tint `#E4E9F8`
- Orange `#FA912D` (a fill only), orange text `#C96C00`, tint `#FFF0E0`
- Green `#2FA457`, tint `#E3F4E8`, text `#1D6B37`
- Red `#D8412F`, tint `#FBE6E3`, text `#A3261A`
- Ink `#10233F` · Muted `#4A5A74` · Paper `#FBF9F4` · Panel `#F4F7FD` · Hairline `#E3E6EF`

**Type** — Outfit, 400/500/600/700/800.
Page title 30/600 · Section heading 24/700 · School name 19/700 · Body 15–16/400 ·
Band label 12/700 uppercase, letter-spacing .08em · Band figure 30/800, −0.02em.

**Radii** hero 20 · rows 16 · forms 12 · buttons 12 · chips pill.
**Row shadow** `0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)`. Rows sit on the
paper with 10px between them — not full-width white sheets.
**Buttons** primary = filled blue, white text, 46–48px. Secondary = 2px blue
border, blue text, white fill. Never a black outline.
**Content column** 1080px, centred, 20px side padding.
**Hit targets** 44px minimum. **Must hold at 375px.**

---

## The shape already established

You don't need the App console file to work from — this is its anatomy, and
five of the six screens below reuse it. Match it unless a screen says otherwise.

**The hero.** A blue `#2D46AF` block, radius 20, 34px × 32px padding, with two
decorative circles bleeding off the top right: `#FA912D` at 220px, and `#4760C9`
at 90px. Inside: a band label in `#FFD8AE`, then the headline at 44/800 white,
`-0.03em`, capped around 18 characters a line, then one line of supporting text
in `#C6CFF0` — or `#FFD8AE` when what it says is a problem.

**The row.** White, radius 16, on the paper, carrying the row shadow. Three
flexed parts that wrap at narrow widths:

| Part | Flex | Contents |
|---|---|---|
| Band | `1 1 170px` | A tinted or filled block, 14×18 padding: a 12/700 uppercase label and one big figure at 30/800 |
| Body | `100 1 280px` | The name at 19/700, a sentence of reason in muted, then pill chips at 12/700, 4×9 padding |
| Action | `1 1 200px` | One primary button, with a blue underlined text link beneath it |

The band is the whole trick: it is where the row says what kind of row it is,
in colour and in one figure, before anybody reads a word of it.

**Opening a row** reveals a panel on paper `#FBF9F4` beneath it, separated by a
hairline, holding white bordered cells in a `repeat(auto-fit, minmax(230px, 1fr))`
grid — each with an 11/700 uppercase label and a value.

**Absence is written out.** Where a figure is missing the cell says so in words,
in `#C96C00` — "Prize store not open", "Enrolment not recorded", "Nothing
logged yet". Never a dash, never a zero standing in for unknown.

---

## 1 — "Not in \<Program\> yet" (the traffic light)

On all eight program consoles, under the schools they already have.

Every school this program has not reached, with a light saying whether the
coordinator may approach it. Three lights, and these exact words everywhere:

| Light | Label | Meaning | The button |
|---|---|---|---|
| Green | **Reach out** | Fine to introduce the program | **Reach out** — filled |
| Orange | **Discuss first** | Talk it through before contacting | **Let's review** — outlined |
| Red | **Hold off** | Don't pitch this program now | **Send to review** — outlined |

**The row.** A small dark `#10233F` traffic-light housing with three 14px dots —
the active one lit, the other two `rgba(255,255,255,.18)` — then the label at
20/800 in the light's text colour, on the light's tint. Then the school name,
the reason in words, and a source line: either "From the rules · …" or
"Set by \<name\> on \<date\> · until \<date\>". Then the button, with a
"Change light" text link under it.

**After acting**, the button is replaced by a status line: "Reached out at
10:56 · call · notes saved to the school's activity log", or "On the agenda for
Mon 28 Sep".

**Filter chips** across the top: All · Reach out · Discuss first · Hold off,
each with its count. The selected one is ink-filled.

**Sort** green, then orange, then red, then by name.

**Please design:** the housing (this is the motif of the whole feature), the
row at 1280 and 375, the three button treatments side by side, a row in each of
its two done states, and the empty state.

---

## 2 — The admin meeting · `/admin/meetings`

Where an orange or red school goes when a coordinator cannot decide alone.
Grouped by program, because that is how the meeting runs — one coordinator at a
time.

A dark `#10233F` header per meeting: "Next meeting" / "Overdue" / "Closed",
the date at 22/800 white, and "6 schools · 2 decided". Underneath, per program:
the program name, a link to its console, then one card per school with a
coloured dot, the school, what was asked (Wants a steer / Sent for review /
Appeal suggested), the note, and who added it.

Each card ends in a decision: keep the light, change the light (with a reason),
or close it with no change. A decided card shows the outcome on green tint.

**Please design:** the meeting header, a program block, an undecided card next
to a decided one, and the "no meeting booked" state — which is important,
because with no meeting booked the coordinator's button is blocked and has to
say why.

---

## 3 — "Schools in \<Program\>" (enrollment stages)

Above the traffic light on each console. Nine stages a school travels through:

Introduced → Meeting booked → Registered → Materials sent → Trained →
Launched → Running → Paused → Ended.

Green tone for Launched/Running, blue for the setup stages, grey for
Paused/Ended.

**The row.** A band with "STAGE" and the stage name at 22/800 on its tone's
tint. Then the school name and place, the stage's meaning in a sentence, and
"Since 8 Sep" — going orange when a school has sat at one stage more than 45
days, which is the row worth looking at. Then chips: who runs it at the school,
how many times it is on the calendar, when it first ran.

Sorted furthest-along first, then whoever has been stuck longest.

**Please design:** the stage band, the nine stages as a set (is there a better
device than a band — a rail, a stepper?), the stuck state, and the row at 375.

---

## 4 — The ambassador's page · `/ambassador`

**This one is for a teenager on a phone between classes.** Two students per
program per school run it on the ground and write up what happened each time.
They see one program and nothing else.

A blue hero: "You run" / **Kindness Booth** at 40/800 white / "At Bnos Chaya ·
since 8 Sep". Then one primary button: "Write up what happened".

Under it, their own history — date, whether their teacher has read it, roughly
how many students, and what they wrote.

**Please design:** the hero, the history card, and the whole thing at 375 first
— desktop is the afterthought here, not the other way round.

---

## 5 — The report form

The thing the platform exists to collect. One question at a time:

- When was it? (date)
- Was it one of these? (the calendar dates, or "something we ran ourselves")
- Roughly how many students took part? — *"A guess is fine. Everyone who reads
  it knows it is a guess."*
- Tell us what happened (long) — *"Please don't put other students' names in."*
- What went well? (optional)
- What would you change? (optional)

Then: **"Send it to my teacher"**.

**Please design:** this form for a phone. Large targets, generous line height,
the hints as part of the design rather than grey afterthoughts. It should not
feel like a form a teacher made them fill in.

Also: **the join screen** — one input, six characters, `ABC123`, typed off a
whiteboard. Currently 34/800 with 0.22em tracking on a panel fill. It is the
first thing a student ever sees of JOC. Make it good.

---

## 6 — "Your ambassadors" (the teacher's side) · `/school/ambassadors`

Where a teacher hands out a place, reads what the students wrote, and decides
whether a photo goes further than that page.

The code-making block: pick a program, press "Make a code", and the code
appears at 40/800 with 0.14em tracking, to be read out loud. Then codes waiting
to be used, then each ambassador with their reports underneath — unread ones
outlined in blue.

**Please design:** the code display (it is read aloud across a classroom), an
unread report against a read one, and the photo-sharing control, which carries
this sentence and must not look like a throwaway checkbox:

> Let JOC see the photo. Off by default — a photo of your event has other
> people's children in it, and that is your call, not theirs.

---

## Rules that hold across all six

- **Real or absent.** No "—", no empty cell, no 0 standing in for unknown.
  When a figure is missing, say so in words, in `#C96C00`.
- **Ambassadors are children.** No student's name ever appears on a JOC screen.
  The teacher's page is the only place one is shown. Participation figures are
  the students' own estimates and are labelled as estimates everywhere.
- **Nothing reaches a school.** Every action here records what a person did
  after they did it. There is no send button anywhere in this brief.
- **375px.**
