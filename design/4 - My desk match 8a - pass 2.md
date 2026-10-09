# Prompt for Claude Code: My desk, make it match 8a (pass 2)

Paste everything below into Claude Code at the root of `YonahJOC/JOCEducation`.

---

The My desk restyle you did is structurally right: the greeting, the recap, the two columns, For you only when needed, and the sticky-note scratchpad. **Visually it doesn't match the target yet.** This pass is about getting the look right. **Don't change any behaviour.**

Look at these two images before you start:
- `design/8a-target.png`: **the target**, a 1440×900 render.
- `design/current-build.png`: **what's live now**.

Also open `design/My Desk Redesign.dc.html` in a browser and find artboard **8a**. For any value you're unsure of, read the inline style straight from that file; it's the source of truth. Don't approximate a value or "improve" on it.

## Ground rules
1. **Behaviour is frozen.** Don't touch any server action, type, route, prop, data field, `useState`/`useTransition` logic, or the handlers in `Tasks.tsx`, `YourDay.tsx`, `ForYou.tsx` or `Notebook.tsx`. Change only `style` objects, wrapper elements and markup order.
2. **The rail is shared with the school side.** Apply every sidebar change **only when `side === "joc"`**. The school portal's rail must look exactly as it does now.
3. **Keep everything the rail already does:** `jocNav()` items, badges (the counts and the blue/orange tones), program dots and coordinator program links, `aria-current`, the mobile horizontal nav from `globals.css` (`.joc-shell-nav` etc., with the orange underline on the active item), **Back to the site**, **Sign out**, and the "No database is connected" banner.
4. Use only the tokens in `src/lib/joc-tokens.ts`. Each hex below is given next to its token so you can check it.
5. When you're done, take a 1440×900 screenshot of `/admin` (signed in, with the seeded data) and compare it side by side with `design/8a-target.png`. Fix any differences, then list any you couldn't fix.

## The 7 differences to fix, with exact values

### 1. Sidebar: light, not navy (`PortalShell.tsx`, `ShellNav.tsx`, JOC side only)
| | Now | Target |
|---|---|---|
| Width | 236px | **216px** |
| Background | navy `C.ink` | **`C.onDarkBody` #C6CFF0**, no border |
| Padding | n/a | 24px 12px 16px |
| Logo | white wordmark | **colour** wordmark `/brand/joc-wordmark.png`, height 22px, `max-width: 100%` (it must not overflow the rail) |
| "SUPER ADMIN" under the logo | shown | **remove it here**; the role moves into the user card |
| Nav item | text plus a plain icon; active = paper tab joined to the page | see below |
| User card | avatar + name, then a dark "Back to the site" button | see below |

**Nav item:**
- Row: `display: flex`, `gap: 10px`, `min-height: 46px`, `padding: 0 8px`, `border-radius: 12px`, the full rail width.
- Icon tile: 32×32, radius 10px, centred Material Symbols Rounded icon at 21px.
- Label: Outfit 15px `C.ink`, `white-space: nowrap`.
- Section colours (icon colour / tile colour when active):

| Item | Icon | Icon colour | Active tile |
|---|---|---|---|
| My desk | home | `C.blue` #2D46AF | `C.blueTint` #E4E9F8 |
| The Office | apartment | `C.orangeText` #A85B00 | `C.orangeTint` #FFF0E0 |
| Schools | school | `C.greenText` #1D6B37 | `C.greenTint` #E3F4E8 |
| Programs | volunteer_activism | `C.redText` #A3261A | `C.redTint` #FBE6E3 |
| Admin meeting | groups | `C.blue` | `C.blueTint` |
| Teaching material | menu_book | `C.orangeText` | `C.orangeTint` |
| Money | payments | `C.greenText` | `C.greenTint` |

  For any other item `jocNav()` returns (for example a coordinator's programs), use the Programs colours.
- **Inactive:** row transparent; tile `#FFFFFF`; icon unfilled (`'FILL' 0`); label weight 500. Hover: row `rgba(255,255,255,.55)`.
- **Active:** row `#FFFFFF`; tile = its section tint; icon filled (`'FILL' 1`); label weight 700.
  - **Remove** the paper background, the `marginRight: -14px` and the square right corners. The active row is a normal rounded white row inside the rail.
- Badges: keep them at the right end of the row. On the light rail use a `C.blue` fill with white text for blue badges, and a `C.orange` fill with `C.ink` text for the others.

**User card** (pinned to the bottom with `margin-top: auto`):
- A `#FFFFFF` card, radius 16px, padding 10px 12px.
- Inside: the 40px `C.orange` avatar with its `C.ink` initial; the name (Outfit 16px/600 ink) above the role from `roleLabel()` (14px `C.muted`); and a `logout` icon button on the right, 44×44 in `C.muted`, that submits the **existing** `signOutAction` form.
- Under the card: **Back to the site** as a 44px-tall text link, 14px/600 `C.blue`, left-aligned.
- Remove the separate "Sign out" text button, because the icon now does that job. **If you keep both, that's fine. Don't drop the feature.**
- Mobile (≤ the existing breakpoint): keep the current horizontal layout. Only the colours change: the rail is `C.onDarkBody`, nav text is ink, and the active underline is `C.orange`.

### 2. Greeting: a blue band, not plain text (`MyDesk.tsx` header, `.joc-desk-head`)
- The whole header becomes one band:
  - `background: C.blue` (#2D46AF), `border-radius: R.hero` (20px), `padding: 24px 30px`, `color: #FFFFFF`.
  - `display: grid`, `grid-template-columns: minmax(0,1fr) 360px`, `gap: 32px`, `align-items: center`.
- Date line: `T.meta` at **12px**, colour **`C.onDarkLabel` #FFD8AE**.
- Greeting: Outfit **40px / 800**, `letter-spacing: -0.03em`, `line-height: 1.05`, white.
- Recap: Newsreader **19px / 1.5**, colour **`C.onDarkBody` #C6CFF0**.
- **Today at JOC** moves **inside** the band on the right:
  - `background: C.orangeTint` #FFF0E0, radius 16px, padding 18px 20px, no shadow.
  - Label "TODAY AT JOC" in `T.meta` colour `C.orangeText`.
  - Icon box: 48×48, radius 14px, `#FFFFFF`, holding the venue icon at 26px in its venue colour, filled.
  - Title: 17px/600 ink. Meta line: `T.meta` ink.
  - If `joc` is null, the band keeps its one-column layout (no empty right column).
- Space between the band and the grid below it: **28px**.

### 3. Card shell (`parts.tsx` → `Panel`)
- `border-radius: R.hero` (**20px**, up from 16), keeping `ROW_SHADOW`.
- **Remove the header's bottom border.** Header padding becomes **26px 26px 0** and the body starts 18px below it.
- **Title row:** a 40×40 icon tile (radius 12px) + the title in Outfit **24px / 700**, `letter-spacing: -0.02em`. Add an `icon` and an `iconTint` prop to `Panel`; it's purely presentational.
- The count (`T.meta`) moves to the **far right** of the header (`margin-left: auto`), not beside the title. If `tools` exist, tools sit at the far right and the count sits just before them.
- Gaps: **24px** between the two columns and between the cards in the right column.

### 4. Your list (`Tasks.tsx`): visual only
- Panel: icon `task_alt`, filled, `C.blue` on a `C.blueTint` tile.
- **Add row, on one line** at widths of 640px and up (it wraps below that):
  - Order: `+` icon (24px `C.blue`), input (flex 1, 18px, height 44px), **FOR** picker, the Today/Later segment, **Add** (filled `C.blue`, 46px, radius 12px, 16px/700).
  - Box: `background: C.panel` #F4F7FD, `border: 1.5px solid C.outline` #CBD3EE, radius 16px, padding 8px 8px 8px 18px.
  - Focused: border `C.blue` plus `box-shadow: 0 0 0 4px C.blueTint`.
  - Hide "ENTER ↵" while not handing off. Keep the hand-off hint line ("ENTER ↵ SENDS TO {NAME}") on its own line under the row when a person is picked.
  - Keep the people chips opening under the row.
- Group heads: `T.meta`, padding 12px 0 6px, written as "TODAY · 2" (the count joined with " · ").
- **Rows:**
  - Grid `52px minmax(0,1fr) auto`, `min-height: 64px`, a `C.rule` hairline on top. **Drop the 18px side padding;** the panel's 26px padding is the gutter now.
  - Tick: 30px circle, 2px `C.ringQuiet` border; done = `C.green` fill + a white check icon.
  - Title: 18px/500.
- Hand-off rows:
  - Initial at **34px**, `C.greenTint` circle, `C.greenText` letter.
  - **Nudge** becomes a pill: `min-height: 44px`, `padding: 0 16px`, radius 9999, `background: C.blueTint`, `color: C.blue`, 15px/600, with a `notifications_active` icon at 18px. Label: "Nudge {firstName}".
  - After nudging: `C.greenTint` / `C.greenText`, label "Nudged", with a `check` icon.
- **Today** on Later rows: the same pill style, with the icon `today`.

### 5. This week (`YourDay.tsx`): green card
- Panel `note` override: `background: C.greenTint` #E3F4E8, `box-shadow: 0 2px 0 #C9E6D2`.
- Icon tile: `#FFFFFF` with `calendar_month` filled in `C.greenText`. "+ Add" is in `C.greenText` (hover background white).
- **Rows sit directly on the green**, with no white row background and no hairlines:
  - Grid `56px minmax(0,1fr) auto`, gap 14px.
  - **Date block** (56px wide, radius 12px, padding 6px 0, centred):
    - Mono weekday at 11px/600, above the day number in Outfit 22px/700.
    - Today: `C.blue` fill with white text, labelled "TODAY". For today's items with a time, show the time in place of the number.
    - Other days: a `#FFFFFF` block with ink text.
  - Title: 17px/600 ink. Meta: `T.meta`.
  - Type icon (22px, filled): `call` for calls, `groups` for meetings, or the lobby venue icon and colour for school bookings.
  - × (44px) **only on `d.own`**, as now.
- Remove the "LATER" divider label; the date blocks do that job.
- The add form opens inline inside a `#FFFFFF` panel (radius 16px, padding 18px) at the top of the card. **Same fields, same labels, same logic.**

### 6. Scratchpad (`Notebook.tsx`): small fixes only
- Header: "Scratchpad" (20px/700) on the left; **"ONLY YOU SEE THIS"** (`T.meta`, `C.orangeText`) on the **right of the same row**. Move it there from the footer.
- Page tabs: on their own row **under** the header (40px tall, radius 10px; active `C.ink` / white, inactive `rgba(255,255,255,.7)` / ink). The dashed **+ Page** is pinned at the right of that row. With a single page, the tab row still shows (one tab plus "+ Page").
- Remove the hairlines above and below the body.
- Footer: SAVED / SAVING… on the left (`C.greenText` / `C.faint`). On the right: **Make it a task →** (15px/700 `C.orangeText`) and Delete (`C.destructive`, only when allowed, as now).
- Keep −0.8deg, `C.orangeTint`, the shadow `0 2px 0 #FFD8AE, 0 10px 24px rgba(168,91,0,.12)`, and Newsreader 19px / 1.6 for the body.

### 7. Page ground and spacing
- `.joc-desk` padding: **36px 44px**. The page ground stays `C.paper`.
- Below 980px everything stacks as it does now.

## Must keep (re-test after this pass)
- [ ] Every item in the "Must keep" checklist in `3 - My desk redesign - final.md` still passes. **This pass touches no logic, so any failure is a regression.**
- [ ] The school portal's rail looks exactly as before (screenshot `/school` before and after).
- [ ] The mobile rail is still the horizontal scroller with the active underline.
- [ ] Badges, program dots, **Back to the site** and **Sign out** all still work.
- [ ] Health (`Health.tsx`) still renders for super admins.
- [ ] Keyboard: Tab through the rail, the add row, the pills and ×: every one shows the focus ring.

## Done means
- A 1440×900 screenshot of `/admin` next to `design/8a-target.png` with no visible differences in the sidebar, band, card headers, This week or Scratchpad, plus a list of anything left over.
- `git diff --stat` touches only `src/components/shell/*` (JOC side only), `src/components/mydesk/*` and `globals.css` (desk and rail rules).
