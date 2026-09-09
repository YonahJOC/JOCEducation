/**
 * Who gets in, and how much.
 *
 * Two independent things decide access:
 *   1. JOC staff — anyone signing in with a @justonechesed.org address is
 *      internal. They get everything, free, forever, with no subscription.
 *   2. Everyone else — access follows their school's subscription.
 */

export const JOC_STAFF_DOMAIN = "justonechesed.org";

export type Plan =
  | "SINGLE_TEACHER"
  | "JOC_EDUCATION"
  | "APP_AND_EDUCATION"
  | "FULL_PARTNERSHIP";

export type AccessLevel = "none" | "subscriber" | "staff";

/** True for any @justonechesed.org address (case- and whitespace-insensitive). */
export function isStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${JOC_STAFF_DOMAIN}`);
}

/**
 * Emails listed in SUPER_ADMIN_EMAILS get SUPER_ADMIN on first sign-in.
 * Everyone else on the JOC domain gets ADMIN.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/** The role a brand-new user should be created with, based on their email. */
export function initialRoleFor(email?: string | null): "TEACHER" | "ADMIN" | "SUPER_ADMIN" {
  if (isSuperAdminEmail(email)) return "SUPER_ADMIN";
  if (isStaffEmail(email)) return "ADMIN";
  return "TEACHER";
}

export function isJocStaffRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Can this person reach the internal admin console? */
export function canUseAdminConsole(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user) return false;
  return isJocStaffRole(user.role) || isStaffEmail(user.email);
}

/** Only SUPER_ADMIN can change other people's roles or delete accounts. */
export function canManageAdmins(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user) return false;
  return user.role === "SUPER_ADMIN" || isSuperAdminEmail(user.email);
}

type AccessInput = {
  email?: string | null;
  role?: string | null;
  subscription?: { status?: string | null; plan?: string | null } | null;
};

/**
 * What this person can see. JOC staff always get full access regardless of
 * subscription; everyone else needs their school to be in good standing.
 */
export function accessLevelFor(user?: AccessInput | null): AccessLevel {
  if (!user) return "none";
  if (isJocStaffRole(user.role) || isStaffEmail(user.email)) return "staff";

  const status = user.subscription?.status;
  if (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE") {
    return "subscriber";
  }
  return "none";
}

/** Signed in and entitled to the gated site. */
export function hasSiteAccess(user?: AccessInput | null): boolean {
  return accessLevelFor(user) !== "none";
}

const PLAN_RANK: Record<Plan, number> = {
  SINGLE_TEACHER: 1,
  JOC_EDUCATION: 2,
  APP_AND_EDUCATION: 3,
  FULL_PARTNERSHIP: 4,
};

/** Staff clear every tier. Otherwise compare the school's plan against the requirement. */
export function meetsPlan(user: AccessInput | null | undefined, required: Plan): boolean {
  const level = accessLevelFor(user);
  if (level === "staff") return true;
  if (level === "none") return false;
  const plan = user?.subscription?.plan as Plan | undefined;
  if (!plan) return false;
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

export const PLAN_LABELS: Record<Plan, string> = {
  SINGLE_TEACHER: "Single Teacher Use",
  JOC_EDUCATION: "JOC Education",
  APP_AND_EDUCATION: "JOC App + JOC Education",
  FULL_PARTNERSHIP: "Full JOC Partnership",
};
