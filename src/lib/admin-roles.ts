import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { CAPABILITIES, DEFAULT_CAPABILITIES, type Capability, type Role } from "@/lib/access";

/**
 * Admin types: named bundles of what somebody may do in the console.
 *
 * Four ship, matching what was previously hardcoded. JOC can add its own —
 * a shop manager, an Israel trips coordinator — without a developer.
 */

export type AdminRoleRow = {
  id: string;
  name: string;
  description: string | null;
  capabilities: Capability[];
  builtIn: boolean;
  isSuperAdmin: boolean;
  sort: number;
  memberCount: number;
};

/** Only keys the code actually understands survive a read. */
function clean(values: string[]): Capability[] {
  return values.filter((v): v is Capability => (CAPABILITIES as readonly string[]).includes(v));
}

/**
 * The four that ship, created on first read.
 *
 * Seeding here rather than in a migration keeps the wording in one place with
 * the defaults it mirrors, and means a fresh database is never left with no
 * roles at all.
 */
const BUILT_IN: {
  name: string;
  description: string;
  role: Role;
  isSuperAdmin?: boolean;
  sort: number;
}[] = [
  {
    name: "JOC staff",
    description: "Free access to everything on the site. Cannot change anything in the console.",
    role: "STAFF",
    sort: 0,
  },
  {
    name: "Programming team",
    description: "Runs the calendar and the school accounts behind it.",
    role: "PROGRAM_STAFF",
    sort: 1,
  },
  {
    name: "Educational team",
    description: "Writes and publishes the lessons, resources and everything a teacher reads.",
    role: "ADMIN",
    sort: 2,
  },
  {
    name: "Super admin",
    description: "Everything, including who else has access. Always holds every capability.",
    role: "SUPER_ADMIN",
    isSuperAdmin: true,
    sort: 3,
  },
];

export async function ensureAdminRoles(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const have = new Set((await prisma.adminRole.findMany({ select: { name: true } })).map((r) => r.name));
    const missing = BUILT_IN.filter((b) => !have.has(b.name));
    if (missing.length === 0) return;

    // skipDuplicates because two pages can call this at the same moment —
    // both read "missing", both insert, and one loses on the unique name.
    // Losing that race is not an error; the row exists either way.
    await prisma.adminRole.createMany({
      data: missing.map((b) => ({
        name: b.name,
        description: b.description,
        capabilities: DEFAULT_CAPABILITIES[b.role],
        builtIn: true,
        isSuperAdmin: Boolean(b.isSuperAdmin),
        sort: b.sort,
      })),
      skipDuplicates: true,
    });
  } catch {
    // The console still renders; it simply shows no roles to edit.
  }
}

export async function listAdminRoles(): Promise<AdminRoleRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.adminRole.findMany({
      orderBy: [{ sort: "asc" }, { name: "asc" }],
      include: { _count: { select: { members: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      capabilities: clean(r.capabilities),
      builtIn: r.builtIn,
      isSuperAdmin: r.isSuperAdmin,
      sort: r.sort,
      memberCount: r._count.members,
    }));
  } catch {
    return [];
  }
}

/**
 * What one person may do, for putting on their session.
 *
 * Returns null when they hold no admin role — the caller then falls back to
 * the built-in default for their role, which is what `can()` does.
 */
export async function capabilitiesForUser(userId: string): Promise<Capability[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { adminRole: { select: { capabilities: true, isSuperAdmin: true } } },
    });
    if (!u?.adminRole) return null;
    // The super admin role always holds everything, whatever the row says.
    if (u.adminRole.isSuperAdmin) return [...CAPABILITIES];
    return clean(u.adminRole.capabilities);
  } catch {
    return null;
  }
}
