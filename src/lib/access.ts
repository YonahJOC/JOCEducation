/**
 * Who gets in, and what they can do.
 *
 * Roles, lowest to highest:
 *
 *   TEACHER       A teacher at a partner school. Content access follows their
 *                 school's subscription.
 *   SCHOOL_ADMIN  As above, plus they are the contact for their own school.
 *   STAFF         Anyone at Just One Chesed. Free access to the whole site,
 *                 all materials and all programs — but cannot change anything
 *                 or see anyone else's account. This is what a
 *                 @justonechesed.org address gets automatically.
 *   ADMIN         The JOC educational team. Everything STAFF has, plus the
 *                 content console: upload and edit lesson plans, resources,
 *                 products and the Teachers' Board.
 *   SUPER_ADMIN   Everything. School accounts, plans, discounts and free
 *                 access, user records, and granting roles to others.
 *
 * Only SUPER_ADMIN can hand out ADMIN or SUPER_ADMIN — nobody is promoted
 * automatically by their email domain beyond STAFF.
 */

export const JOC_STAFF_DOMAIN = "justonechesed.org";

export type Role = "TEACHER" | "SCHOOL_ADMIN" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

export type Plan =
  | "SINGLE_TEACHER"
  | "JOC_EDUCATION"
  | "APP_AND_EDUCATION"
  | "FULL_PARTNERSHIP";

export type AccessLevel = "none" | "subscriber" | "internal";

type U = { email?: string | null; role?: string | null } | null | undefined;

/** True for any @justonechesed.org address. */
export function isStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${JOC_STAFF_DOMAIN}`);
}

/**
 * Bootstrap list. These addresses are SUPER_ADMIN from their first sign-in,
 * so there is somebody who can promote everyone else.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/**
 * Role for a brand-new account. A JOC address gets STAFF — full access to
 * everything, no ability to alter anyone else. ADMIN is granted by hand.
 */
export function initialRoleFor(email?: string | null): Role {
  if (isSuperAdminEmail(email)) return "SUPER_ADMIN";
  if (isStaffEmail(email)) return "STAFF";
  return "TEACHER";
}

const RANK: Record<Role, number> = {
  TEACHER: 0,
  SCHOOL_ADMIN: 1,
  STAFF: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
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

/** Reach the admin console at all. STAFF cannot — they just use the site. */
export function canAccessConsole(user: U): boolean {
  return rankOf(user?.role) >= RANK.ADMIN;
}

/** Upload and edit lesson plans, resources, products, Teachers' Board. */
export function canManageContent(user: U): boolean {
  return rankOf(user?.role) >= RANK.ADMIN;
}

/** School accounts, plans, seats, discounts, free access, demo pipeline. */
export function canManageAccounts(user: U): boolean {
  return rankOf(user?.role) >= RANK.SUPER_ADMIN || isSuperAdminEmail(user?.email);
}

/** Edit user records, suspend logins, make people members. */
export function canManageUsers(user: U): boolean {
  return canManageAccounts(user);
}

/** Grant or remove ADMIN / SUPER_ADMIN. */
export function canManageRoles(user: U): boolean {
  return canManageAccounts(user);
}

/** Roles a super admin is allowed to assign. */
export const ASSIGNABLE_ROLES: Role[] = [
  "TEACHER",
  "SCHOOL_ADMIN",
  "STAFF",
  "ADMIN",
  "SUPER_ADMIN",
];

export const ROLE_LABELS: Record<Role, string> = {
  TEACHER: "Teacher",
  SCHOOL_ADMIN: "School admin",
  STAFF: "JOC staff",
  ADMIN: "Educational team",
  SUPER_ADMIN: "Super admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  TEACHER: "Access follows their school's plan.",
  SCHOOL_ADMIN: "Main contact for their school. Access follows the school's plan.",
  STAFF: "Free access to everything on the site. Cannot change anything.",
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
