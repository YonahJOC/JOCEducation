import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Data for the internal admin console.
 *
 * Every query falls back to a small set of clearly-labelled sample rows when
 * DATABASE_URL is not set, so the console can be reviewed before Supabase is
 * connected. `usingSampleData` drives the banner that says so.
 */

export const usingSampleData = !isDatabaseConfigured();

export type SchoolStatus = "PROSPECT" | "DEMO_SCHEDULED" | "TRIAL" | "ACTIVE" | "LAPSED" | "CHURNED";
export type PlanKey = "SINGLE_TEACHER" | "JOC_EDUCATION" | "APP_AND_EDUCATION" | "FULL_PARTNERSHIP";

export type SchoolRow = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  city: string | null;
  status: SchoolStatus;
  enrollment: "SMALL" | "MEDIUM" | "LARGE";
  studentCount: number | null;
  memberCount: number;
  plan: PlanKey | null;
  planStatus: string | null;
  seats: number | null;
  grantedManually: boolean;
  grantKind?: string | null;
  grantNote?: string | null;
  grantReviewOn?: Date | null;
  grantedBy?: string | null;
  renewsOn: Date | null;
  accountManager: string | null;
  lastActivityAt: Date | null;
};

export const STATUS_LABELS: Record<SchoolStatus, string> = {
  PROSPECT: "Prospect",
  DEMO_SCHEDULED: "Demo scheduled",
  TRIAL: "Trial",
  ACTIVE: "Active",
  LAPSED: "Lapsed",
  CHURNED: "Churned",
};

export const STATUS_COLORS: Record<SchoolStatus, string> = {
  PROSPECT: "#7A8699",
  DEMO_SCHEDULED: "#2C7AC9",
  TRIAL: "#FA912D",
  ACTIVE: "#1B7F4B",
  LAPSED: "#C96C00",
  CHURNED: "#B8321E",
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  SINGLE_TEACHER: "Single Teacher",
  JOC_EDUCATION: "JOC Education",
  APP_AND_EDUCATION: "App + Education",
  FULL_PARTNERSHIP: "Full Partnership",
};

export const ENROLLMENT_LABELS = {
  SMALL: "Under 150",
  MEDIUM: "150–400",
  LARGE: "400+",
} as const;

// ─── Sample data (shown only when the database is not connected) ─────────────

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

const SAMPLE_SCHOOLS: SchoolRow[] = [
  { id: "s1", name: "Yeshiva Darchei Torah", slug: "darchei-torah", region: "Far Rockaway", city: "Far Rockaway, NY", status: "ACTIVE", enrollment: "LARGE", studentCount: 620, memberCount: 34, plan: "FULL_PARTNERSHIP", planStatus: "ACTIVE", seats: 40, grantedManually: false, renewsOn: d(-210), accountManager: "Sample Manager", lastActivityAt: d(3) },
  { id: "s2", name: "Beis Yaakov of Brooklyn", slug: "beis-yaakov-brooklyn", region: "Brooklyn", city: "Brooklyn, NY", status: "ACTIVE", enrollment: "LARGE", studentCount: 480, memberCount: 22, plan: "APP_AND_EDUCATION", planStatus: "ACTIVE", seats: 25, grantedManually: false, renewsOn: d(-120), accountManager: "Sample Manager", lastActivityAt: d(9) },
  { id: "s3", name: "Or Chaim Day School", slug: "or-chaim", region: "Toronto", city: "Toronto, ON", status: "TRIAL", enrollment: "MEDIUM", studentCount: 240, memberCount: 6, plan: "JOC_EDUCATION", planStatus: "TRIALING", seats: 10, grantedManually: false, renewsOn: d(-16), accountManager: null, lastActivityAt: d(2) },
  { id: "s4", name: "Valley Torah High School", slug: "valley-torah", region: "Los Angeles", city: "Valley Village, CA", status: "DEMO_SCHEDULED", enrollment: "MEDIUM", studentCount: 190, memberCount: 0, plan: null, planStatus: null, seats: null, grantedManually: false, renewsOn: null, accountManager: "Sample Manager", lastActivityAt: d(1) },
  { id: "s5", name: "Yeshivas Tiferes Tzvi", slug: "tiferes-tzvi", region: "Chicago", city: "Chicago, IL", status: "PROSPECT", enrollment: "SMALL", studentCount: 110, memberCount: 0, plan: null, planStatus: null, seats: null, grantedManually: false, renewsOn: null, accountManager: null, lastActivityAt: d(21) },
  { id: "s6", name: "Scheck Hillel Community School", slug: "scheck-hillel", region: "Miami", city: "North Miami Beach, FL", status: "LAPSED", enrollment: "LARGE", studentCount: 700, memberCount: 18, plan: "JOC_EDUCATION", planStatus: "PAST_DUE", seats: 20, grantedManually: false, renewsOn: d(12), accountManager: "Sample Manager", lastActivityAt: d(45) },
  { id: "s7", name: "Sha'arei Torah Seminary", slug: "shaarei-torah", region: "Lakewood", city: "Lakewood, NJ", status: "ACTIVE", enrollment: "SMALL", studentCount: 95, memberCount: 8, plan: "JOC_EDUCATION", planStatus: "ACTIVE", seats: 10, grantedManually: true, renewsOn: d(-60), accountManager: "Sample Manager", lastActivityAt: d(6) },
];

export type DemoRow = {
  id: string;
  name: string;
  email: string;
  schoolName: string | null;
  requestedFor: Date | null;
  status: "NEW" | "CONTACTED" | "SCHEDULED" | "COMPLETED" | "CONVERTED" | "LOST";
  createdAt: Date;
};

const SAMPLE_DEMOS: DemoRow[] = [
  { id: "d1", name: "Rabbi M. Weiss", email: "mweiss@example.org", schoolName: "Mesivta of Long Beach", requestedFor: d(-2), status: "NEW", createdAt: d(0) },
  { id: "d2", name: "Mrs. S. Rosenberg", email: "srosenberg@example.org", schoolName: "Bnos Chaya Academy", requestedFor: d(-4), status: "CONTACTED", createdAt: d(2) },
  { id: "d3", name: "Rabbi Y. Klein", email: "yklein@example.org", schoolName: "Yeshiva Ketana of Passaic", requestedFor: d(-1), status: "SCHEDULED", createdAt: d(4) },
];

export type ActivityRow = {
  id: string;
  type: string;
  summary: string;
  detail: string | null;
  occurredAt: Date;
  author: string | null;
  schoolName?: string;
};

const SAMPLE_ACTIVITY: ActivityRow[] = [
  { id: "a1", type: "CALL", summary: "Renewal conversation with the menahel", detail: "Wants to add the JOC App for the high school next year. Revisit in Adar.", occurredAt: d(3), author: "Sample Manager", schoolName: "Yeshiva Darchei Torah" },
  { id: "a2", type: "DEMO", summary: "Ran a demo for the chesed coordinator", detail: "Walked through Cycle 1 and the lesson library. Positive; sending pricing.", occurredAt: d(2), author: "Sample Manager", schoolName: "Or Chaim Day School" },
  { id: "a3", type: "PLAN_CHANGE", summary: "Plan changed to Full Partnership", detail: null, occurredAt: d(8), author: null, schoolName: "Yeshiva Darchei Torah" },
  { id: "a4", type: "EMAIL", summary: "Sent invoice reminder — 30 days overdue", detail: null, occurredAt: d(11), author: "Sample Manager", schoolName: "Scheck Hillel Community School" },
  { id: "a5", type: "ACCESS_GRANTED", summary: "Scholarship access granted for the year", detail: "Approved by leadership; small seminary, no budget.", occurredAt: d(60), author: "Sample Manager", schoolName: "Sha'arei Torah Seminary" },
];

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getSchools(): Promise<SchoolRow[]> {
  if (usingSampleData) return SAMPLE_SCHOOLS;

  const rows = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      subscription: true,
      accountManager: { select: { name: true, email: true } },
      _count: { select: { members: true } },
      activities: { orderBy: { occurredAt: "desc" }, take: 1, select: { occurredAt: true } },
    },
  });

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    region: s.region,
    city: s.city,
    status: s.status as SchoolStatus,
    enrollment: s.enrollment as SchoolRow["enrollment"],
    studentCount: s.studentCount,
    memberCount: s._count.members,
    plan: (s.subscription?.plan as PlanKey) ?? null,
    planStatus: s.subscription?.status ?? null,
    seats: s.subscription?.seats ?? null,
    grantedManually: s.subscription?.grantedManually ?? false,
    renewsOn: s.subscription?.currentPeriodEnd ?? null,
    accountManager: s.accountManager?.name ?? s.accountManager?.email ?? null,
    lastActivityAt: s.activities[0]?.occurredAt ?? null,
  }));
}

export async function getSchool(id: string) {
  if (usingSampleData) {
    const s = SAMPLE_SCHOOLS.find((x) => x.id === id) ?? SAMPLE_SCHOOLS[0];
    return {
      school: s,
      members: [
        { id: "u1", name: "Sample Teacher", email: "teacher@example.org", role: "TEACHER", active: true, lastSeenAt: d(1) },
        { id: "u2", name: "Sample Coordinator", email: "coordinator@example.org", role: "SCHOOL_ADMIN", active: true, lastSeenAt: d(5) },
      ],
      contacts: [
        { id: "c1", name: "Sample Menahel", title: "Menahel", email: "office@example.org", phone: "(718) 555-0100", isPrimary: true },
      ],
      activities: SAMPLE_ACTIVITY.filter((a) => a.schoolName === s.name),
      invitations: [
        { id: "i1", email: "newstaff@example.org", role: "TEACHER", status: "PENDING", expiresAt: d(-5) },
      ],
    };
  }

  const s = await prisma.school.findUnique({
    where: { id },
    include: {
      subscription: { include: { grantedBy: { select: { name: true, email: true } } } },
      accountManager: { select: { name: true, email: true } },
      contacts: { orderBy: { isPrimary: "desc" } },
      members: {
        select: { id: true, name: true, email: true, role: true, active: true, lastSeenAt: true },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 50,
        include: { author: { select: { name: true, email: true } } },
      },
      invitations: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" } },
      _count: { select: { members: true } },
    },
  });
  if (!s) return null;

  return {
    school: {
      id: s.id,
      name: s.name,
      slug: s.slug,
      region: s.region,
      city: s.city,
      status: s.status as SchoolStatus,
      enrollment: s.enrollment as SchoolRow["enrollment"],
      studentCount: s.studentCount,
      memberCount: s._count.members,
      plan: (s.subscription?.plan as PlanKey) ?? null,
      planStatus: s.subscription?.status ?? null,
      seats: s.subscription?.seats ?? null,
      grantedManually: s.subscription?.grantedManually ?? false,
      grantKind: s.subscription?.grantKind ?? null,
      grantNote: s.subscription?.grantNote ?? null,
      grantReviewOn: s.subscription?.grantReviewOn ?? null,
      grantedBy: s.subscription?.grantedBy?.name ?? s.subscription?.grantedBy?.email ?? null,
      renewsOn: s.subscription?.currentPeriodEnd ?? null,
      accountManager: s.accountManager?.name ?? s.accountManager?.email ?? null,
      lastActivityAt: s.activities[0]?.occurredAt ?? null,
    } satisfies SchoolRow,
    members: s.members,
    contacts: s.contacts,
    activities: s.activities.map((a) => ({
      id: a.id,
      type: a.type,
      summary: a.summary,
      detail: a.detail,
      occurredAt: a.occurredAt,
      author: a.author?.name ?? a.author?.email ?? null,
    })),
    invitations: s.invitations,
  };
}

export async function getDemoRequests(): Promise<DemoRow[]> {
  if (usingSampleData) return SAMPLE_DEMOS;
  const rows = await prisma.demoRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    schoolName: r.schoolName,
    requestedFor: r.requestedFor,
    status: r.status as DemoRow["status"],
    createdAt: r.createdAt,
  }));
}

export async function getRecentActivity(limit = 12): Promise<ActivityRow[]> {
  if (usingSampleData) return SAMPLE_ACTIVITY.slice(0, limit);
  const rows = await prisma.schoolActivity.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      author: { select: { name: true, email: true } },
      school: { select: { name: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    type: a.type,
    summary: a.summary,
    detail: a.detail,
    occurredAt: a.occurredAt,
    author: a.author?.name ?? a.author?.email ?? null,
    schoolName: a.school.name,
  }));
}

export type Pipeline = { status: SchoolStatus; count: number; students: number };

export async function getPipeline(schools: SchoolRow[]): Promise<Pipeline[]> {
  const order: SchoolStatus[] = ["PROSPECT", "DEMO_SCHEDULED", "TRIAL", "ACTIVE", "LAPSED", "CHURNED"];
  return order.map((status) => {
    const rows = schools.filter((s) => s.status === status);
    return {
      status,
      count: rows.length,
      students: rows.reduce((n, s) => n + (s.studentCount ?? 0), 0),
    };
  });
}

export async function getStaffUsers() {
  if (usingSampleData) {
    return [
      { id: "j1", name: "Sample Staff", email: "sample@justonechesed.org", role: "ADMIN", active: true, lastSeenAt: d(0), schoolName: null },
    ];
  }
  const rows = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true, lastSeenAt: true },
  });
  return rows.map((u) => ({ ...u, schoolName: null }));
}

export async function getAllUsers() {
  if (usingSampleData) {
    return [
      { id: "u1", name: "Sample Teacher", email: "teacher@example.org", role: "TEACHER", active: true, lastSeenAt: d(1), schoolName: "Yeshiva Darchei Torah" },
      { id: "u2", name: "Sample Coordinator", email: "coordinator@example.org", role: "SCHOOL_ADMIN", active: true, lastSeenAt: d(5), schoolName: "Beis Yaakov of Brooklyn" },
      { id: "j1", name: "Sample Staff", email: "sample@justonechesed.org", role: "ADMIN", active: true, lastSeenAt: d(0), schoolName: null },
    ];
  }
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true, name: true, email: true, role: true, active: true, lastSeenAt: true,
      school: { select: { name: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    active: u.active, lastSeenAt: u.lastSeenAt,
    schoolName: u.school?.name ?? null,
  }));
}
