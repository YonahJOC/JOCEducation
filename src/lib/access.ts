/**
 * Who gets in, and what they can do.
 *
 * Roles, lowest to highest:
 *
 *   TEACHER       A teacher at a partner school. Content access follows their
 *                 school's subscription.
 *   SCHOOL_ADMIN  Runs their own school: invites and removes its teachers,
 *                 sees its plan and seat usage. Scoped strictly to their own
 *                 school — never sees another school, and never the JOC
 *                 console.
 *   STAFF         Anyone at Just One Chesed. Free access to the whole site,
 *                 all materials and all programs — but cannot change anything
 *                 or see anyone else's account. This is what a
 *                 @justonechesed.org address gets automatically.
 *   PROGRAM_STAFF The JOC Programming Team. Runs the calendar — the events
 *                 at schools and the Chesed Cycle dates — and the school
 *                 accounts behind them. Deliberately cannot touch anything
 *                 educational: no lesson plans, no resources, no shop, no
 *                 Teachers' Board.
 *   ADMIN         The JOC Education Team. Everything STAFF has, plus the
 *                 content console: upload and edit lesson plans, resources,
 *                 products and the Teachers' Board.
 *   SUPER_ADMIN   Everything above, plus school accounts, plans, discounts
 *                 and free access, user records, and granting roles.
 *
 * Only SUPER_ADMIN can hand out ADMIN, PROGRAM_STAFF or SUPER_ADMIN — nobody
 * is promoted automatically by their email domain beyond STAFF.
 *
 * A note on how this is written. The first five roles used to be a single
 * ladder, and every check was "is your rank at least X". PROGRAM_STAFF does
 * not fit on that ladder: it can do things ADMIN cannot (school accounts)
 * and cannot do things ADMIN can (lessons). A ladder cannot express that, so
 * the capabilities below are now stated as explicit sets of roles. Rank
 * survives only where the question genuinely is "how senior" — sorting a
 * table, and deciding who counts as internal.
 */

export const JOC_STAFF_DOMAIN = "justonechesed.org";

/**
 * Anyone may sign in with any Google account — they become a regular user with
 * no school attached. Belonging to a school requires either an email on that
 * school's domain, or an invitation from the JOC team.
 */

/** Domain part of an email, lowercased. `null` if there isn't one. */
export function emailDomain(email?: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at === -1) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
}

/**
 * Free and generic providers never identify a school, so they never
 * auto-join one. An invitation is the only route in from these.
 */
const CONSUMER_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
  "yahoo.com", "ymail.com", "aol.com", "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "gmx.com", "mail.com", "msn.com", "verizon.net",
]);

export function isConsumerEmail(email?: string | null): boolean {
  const d = emailDomain(email);
  return d ? CONSUMER_DOMAINS.has(d) : true;
}

/** Could this address plausibly belong to an organisation? */
export function couldBeSchoolEmail(email?: string | null): boolean {
  return !isConsumerEmail(email) && !isStaffEmail(email);
}

export type Role =
  | "TEACHER"
  | "SCHOOL_ADMIN"
  | "STAFF"
  | "PROGRAM_STAFF"
  | "ADMIN"
  | "SUPER_ADMIN";

export type Plan =
  | "SINGLE_TEACHER"
  | "JOC_EDUCATION"
  | "APP_AND_EDUCATION"
  | "FULL_PARTNERSHIP";

export type AccessLevel = "none" | "subscriber" | "internal";

type U = {
  email?: string | null;
  role?: string | null;
  /**
   * What this person may do, resolved from the admin role they hold and
   * carried on the session. Absent means "fall back to the built-in default
   * for their role" — which is what every teacher and school admin does, and
   * what everyone does before any admin role has been assigned.
   */
  capabilities?: string[] | null;
} | null | undefined;

/** True for any @justonechesed.org address. */
export function isStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${JOC_STAFF_DOMAIN}`);
}

/**
 * Bootstrap list. These addresses are SUPER_ADMIN from their first sign-in,
 * so there is somebody who can promote everyone else.
 *
 * SUPER_ADMIN_EMAILS (comma-separated, in Vercel) *adds* to this list rather
 * than replacing it. It used to replace it, which meant one stale environment
 * variable could quietly lock the founders out of their own console — and
 * nobody would notice until somebody needed it.
 *
 * Knowing an address grants nothing on its own: access still requires signing
 * in as that Google account.
 */
const DEFAULT_SUPER_ADMINS = [
  "yonah@justonechesed.org",
  "jerry@justonechesed.org",
  "avir@justonechesed.org",
];

/**
 * The programming team, by address. Same idea as the founders list above:
 * these people get PROGRAM_STAFF on their first Google sign-in, so nobody has
 * to be sitting at the console waiting to promote them.
 *
 * PROGRAM_STAFF_EMAILS in Vercel adds to this list; it never replaces it.
 */
const DEFAULT_PROGRAM_STAFF = [
  "dalia@justonechesed.org",
];

export function isProgramStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  const configured = (process.env.PROGRAM_STAFF_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const list = new Set([...DEFAULT_PROGRAM_STAFF, ...configured]);
  return list.has(email.trim().toLowerCase());
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const configured = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const list = new Set([...DEFAULT_SUPER_ADMINS, ...configured]);
  return list.has(email.trim().toLowerCase());
}

/**
 * Role for a brand-new account. A JOC address gets STAFF — full access to
 * everything, no ability to alter anyone else. ADMIN is granted by hand.
 */
export function initialRoleFor(email?: string | null): Role {
  if (isSuperAdminEmail(email)) return "SUPER_ADMIN";
  if (isProgramStaffEmail(email)) return "PROGRAM_STAFF";
  if (isStaffEmail(email)) return "STAFF";
  return "TEACHER";
}

const RANK: Record<Role, number> = {
  TEACHER: 0,
  SCHOOL_ADMIN: 1,
  STAFF: 2,
  PROGRAM_STAFF: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

function rankOf(role?: string | null): number {
  return RANK[(role as Role) ?? "TEACHER"] ?? 0;
}

/** Anyone on the JOC side: STAFF, ADMIN or SUPER_ADMIN. */
export function isInternal(user: U): boolean {
  if (!user) return false;
  return rankOf(user.role) >= RANK.STAFF || isStaffEmail(user.email);
}

// ─── Capabilities ────────────────────────────────────────────────────────────

/**
 * The things somebody can be allowed to do in the console.
 *
 * This list is the contract: an admin role stores these keys, every console
 * page names one in its guard, and anything stored that is not in here is
 * ignored rather than trusted. Adding a new one means adding it here, giving
 * it a guard, and it appears in the console for JOC to assign.
 */
export const CAPABILITIES = [
  // Educational material
  "lessons", "resources", "programs", "board", "rooms", "shop", "site", "forms",
  // The calendar
  "programming", "cycles", "coordinators",
  // School accounts
  "schools", "demos", "orders", "pricing",
  // Access
  "users",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/**
 * The four headings the console is organised under. A permission belongs to
 * exactly one, so fourteen tickboxes read as four short lists rather than a
 * wall — and the sidebar can show a section when somebody can do anything
 * inside it.
 */
export const CAPABILITY_GROUPS: { label: string; capabilities: Capability[] }[] = [
  {
    label: "Educational material",
    capabilities: ["lessons", "resources", "programs", "board", "rooms", "shop", "site", "forms"],
  },
  { label: "The calendar", capabilities: ["programming", "cycles", "coordinators"] },
  { label: "School accounts", capabilities: ["schools", "demos", "orders", "pricing"] },
  { label: "Access", capabilities: ["users"] },
];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  lessons: "Lesson plans",
  resources: "Resources and files",
  programs: "Programs",
  board: "Teachers' Board",
  rooms: "Discussion rooms",
  shop: "The shop catalogue",
  site: "Words on the public pages",
  forms: "Forms and their answers",
  programming: "Programming calendar",
  cycles: "Chesed Cycle dates",
  coordinators: "Program coordinators",
  schools: "Schools and plans",
  demos: "Demo requests",
  orders: "Orders",
  pricing: "Pricing",
  users: "People and access",
};

export const CAPABILITY_DESCRIPTIONS: Record<Capability, string> = {
  lessons: "Write, edit and publish lesson plans, and see which cycles have material.",
  resources: "Worksheets, videos and source sheets, and everything uploaded.",
  programs: "What JOC runs for schools — the catalogue a school reads before booking.",
  board: "Approve or remove what teachers post to the Teachers' Board.",
  rooms: "The topic rooms in the staff room.",
  shop: "The products a school can order.",
  site: "The wording on the public pages, with drafts and history.",
  forms: "Build forms — registrations, sign-ups, feedback — and read what comes back.",
  programming: "What is running and where — the events at each school.",
  cycles: "The eight Chesed Cycles, their dates and their weekly plan.",
  coordinators: "Say who runs each program. A coordinator then sees that one program's sign-ups — and nothing else in the console.",
  schools: "School accounts, plans, seats, discounts, contacts and history.",
  demos: "Bookings from the landing page and contact-form messages.",
  orders: "What schools have ordered from the shop.",
  pricing: "What a plan or a program costs.",
  users: "Who has an account, what they can do, and passwords. The keys to everything else.",
};

/**
 * What each built-in role can do when nobody has said otherwise.
 *
 * These are the fallback, not the rule: once somebody holds an admin type,
 * that type's permissions are what count. Keeping them here means the console
 * still works correctly before any type has been assigned, and if the
 * AdminRole table were ever emptied nobody would be locked out.
 */
const CONTENT: Capability[] = ["lessons", "resources", "programs", "board", "rooms", "shop", "site", "forms"];
const CALENDAR: Capability[] = ["programming", "cycles", "coordinators"];
const ACCOUNTS: Capability[] = ["schools", "demos", "orders", "pricing"];

export const DEFAULT_CAPABILITIES: Record<Role, Capability[]> = {
  TEACHER: [],
  SCHOOL_ADMIN: [],
  STAFF: [],
  PROGRAM_STAFF: [...CALENDAR, ...ACCOUNTS],
  ADMIN: [...CONTENT, ...CALENDAR],
  SUPER_ADMIN: [...CAPABILITIES],
};

/** Everything under one heading — used for the sidebar and the old helpers. */
function anyOf(user: U, caps: Capability[]): boolean {
  return caps.some((c) => can(user, c));
}

function isCapability(v: string): v is Capability {
  return (CAPABILITIES as readonly string[]).includes(v);
}

/**
 * Does this person hold this capability?
 *
 * Their admin role decides it where they have one; otherwise the built-in
 * default for their role does. A founding super admin address always holds
 * everything, so there is always somebody who can undo a mistake here.
 */
export function can(user: U, capability: Capability): boolean {
  if (!user) return false;
  if (isSuperAdminEmail(user.email)) return true;

  // An empty list means "nothing", not "fall back" — otherwise a role with
  // no capabilities would silently inherit the defaults for its rank.
  const assigned = user.capabilities;
  if (Array.isArray(assigned)) {
    return assigned.filter(isCapability).includes(capability);
  }

  const role = (user.role as Role | undefined) ?? "TEACHER";
  return (DEFAULT_CAPABILITIES[role] ?? []).includes(capability);
}

/**
 * Educational material: lesson plans, resources, the shop, the Teachers'
 * Board, the discussion rooms, the words on the public pages.
 *
 * PROGRAM_STAFF is excluded from this on purpose — it is the whole point of
 * the role.
 */
export function canManageContent(user: U): boolean {
  return anyOf(user, CONTENT);
}

/**
 * The calendar: what runs when. The programming events, and the Chesed Cycle
 * dates that the whole site is organised around.
 *
 * The education team keeps this too — they write lessons against the cycles,
 * so they need to see and adjust when those cycles fall.
 */
export function canManageCalendar(user: U): boolean {
  return anyOf(user, CALENDAR);
}

/** School accounts, plans, seats, discounts, free access, demo pipeline. */
export function canManageAccounts(user: U): boolean {
  return anyOf(user, ACCOUNTS);
}

/**
 * Edit user records and suspend logins.
 *
 * Not the programming team. Managing a school's plan is their job; deciding
 * who can sign in to JOC is not, and the two are worth keeping apart.
 */
export function canManageUsers(user: U): boolean {
  return can(user, "users");
}

/** Grant or remove any role. Super admins only — this is how roles stay honest. */
export function canManageRoles(user: U): boolean {
  return canManageUsers(user);
}

/**
 * Reach the admin console at all — that is, there is at least one thing in
 * there this person is allowed to do. STAFF cannot; they just use the site.
 */
export function canAccessConsole(user: U): boolean {
  return canManageContent(user) || canManageCalendar(user) || canManageAccounts(user);
}

// ─── School-scoped ───────────────────────────────────────────────────────────

type SchoolUser = { role?: string | null; schoolId?: string | null; email?: string | null };

/** Reach the school panel at /school — runs their own school's people and plan. */
export function canRunOwnSchool(user: SchoolUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "SCHOOL_ADMIN" && Boolean(user.schoolId);
}

/**
 * The single most important check in the app.
 *
 * A school admin may only ever touch their own school. This is enforced by
 * deriving the school id from the signed-in user rather than accepting one
 * from the request — no endpoint for this role takes an arbitrary school id.
 * Super admins are exempt because managing every school is their job.
 *
 * Returns the school id the caller is allowed to act on, or null.
 */
export function scopedSchoolId(
  user: SchoolUser | null | undefined,
  requested?: string | null
): string | null {
  if (!user) return null;
  if (canManageAccounts(user)) return requested ?? user.schoolId ?? null;
  if (!canRunOwnSchool(user)) return null;
  // Ignore anything the request asked for; only their own school exists.
  if (requested && requested !== user.schoolId) return null;
  return user.schoolId ?? null;
}

/** Roles a super admin is allowed to assign. */
export const ASSIGNABLE_ROLES: Role[] = [
  "TEACHER",
  "SCHOOL_ADMIN",
  "STAFF",
  "PROGRAM_STAFF",
  "ADMIN",
  "SUPER_ADMIN",
];

export const ROLE_LABELS: Record<Role, string> = {
  TEACHER: "Teacher",
  SCHOOL_ADMIN: "School admin",
  STAFF: "JOC staff",
  PROGRAM_STAFF: "Programming team",
  ADMIN: "Educational team",
  SUPER_ADMIN: "Super admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  TEACHER: "Access follows their school's plan.",
  SCHOOL_ADMIN: "Main contact for their school. Access follows the school's plan.",
  STAFF: "Free access to everything on the site. Cannot change anything.",
  PROGRAM_STAFF:
    "Programming team — the calendar of events, the cycle dates, and school accounts. Cannot change lessons, resources or the shop.",
  ADMIN: "Educational team — uploads and edits lessons, resources and content.",
  SUPER_ADMIN: "Full control: accounts, plans, discounts, users and roles.",
};

// ─── Content access ──────────────────────────────────────────────────────────

type AccessInput = {
  email?: string | null;
  role?: string | null;
  subscription?: { status?: string | null; plan?: string | null } | null;
};

/**
 * Everyone at JOC reads everything for free. Everyone else needs their school
 * to be in good standing.
 */
export function accessLevelFor(user?: AccessInput | null): AccessLevel {
  if (!user) return "none";
  if (isInternal(user)) return "internal";

  const status = user.subscription?.status;
  if (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE") {
    return "subscriber";
  }
  return "none";
}

export function hasSiteAccess(user?: AccessInput | null): boolean {
  return accessLevelFor(user) !== "none";
}

const PLAN_RANK: Record<Plan, number> = {
  SINGLE_TEACHER: 1,
  JOC_EDUCATION: 2,
  APP_AND_EDUCATION: 3,
  FULL_PARTNERSHIP: 4,
};

/** JOC people clear every tier. Everyone else is measured against their plan. */
export function meetsPlan(user: AccessInput | null | undefined, required: Plan): boolean {
  const level = accessLevelFor(user);
  if (level === "internal") return true;
  if (level === "none") return false;
  const plan = user?.subscription?.plan as Plan | undefined;
  return plan ? PLAN_RANK[plan] >= PLAN_RANK[required] : false;
}

export const PLAN_LABELS: Record<Plan, string> = {
  SINGLE_TEACHER: "Single Teacher Use",
  JOC_EDUCATION: "JOC Education",
  APP_AND_EDUCATION: "JOC App + JOC Education",
  FULL_PARTNERSHIP: "Full JOC Partnership",
};
