import { can, canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import { C } from "@/lib/joc-tokens";

/**
 * The navigation, by job rather than by database table.
 *
 * The console's sidebar had grown to twenty-odd links across five headings,
 * because every new page added one. That is a list of what the software can
 * do, not of what a person came to do — and a program coordinator, who can
 * open exactly one of them, had to read all twenty to find it.
 *
 * At most seven items, only ones the person can actually open, and everything
 * else reachable as a tab or a link inside those seven. A link to a page that
 * refuses you is worse than no link: it reads as broken rather than as not
 * yours.
 */

export type NavItem = {
  label: string;
  href: string;
  hint?: string;
  /** A program's own colour, for a coordinator's per-program items. */
  dot?: string;
  /** How many things need them there. */
  need?: number;
};

type U = Parameters<typeof can>[0];

/** What to call the person's role in the rail, in one word or two. */
export function roleLabel(user: U, opts: { leadsPrograms: number }): string {
  if (can(user, "users")) return "Super admin";
  if (can(user, "programming") && can(user, "schools")) return "Programming team";
  if (can(user, "lessons")) return "Educational team";
  if (opts.leadsPrograms > 0) return "Program coordinator";
  return "JOC staff";
}

/**
 * The JOC-side navigation.
 *
 * Built from capabilities, never from roles — a person with an unusual admin
 * type gets the items their permissions actually open, rather than whatever
 * the closest named role would have had.
 */
export function jocNav(
  user: U,
  opts: { programs?: { name: string; slug: string; heroColor: string; need: number }[] } = {},
): NavItem[] {
  const items: NavItem[] = [{ label: "Today", href: "/admin", hint: "What needs you" }];
  const programs = opts.programs ?? [];

  // A coordinator holds no capability at all. Their navigation is the
  // programs they run, one item each, and nothing else — because nothing else
  // in the console is theirs.
  const anyCapability =
    can(user, "schools") || can(user, "programs") || can(user, "lessons") ||
    can(user, "users") || can(user, "programming") || can(user, "forms") ||
    can(user, "coordinators") || can(user, "run_admin_agenda");

  if (!anyCapability && programs.length > 0) {
    for (const p of programs.slice(0, 5)) {
      items.push({
        label: p.name,
        href: `/admin/programs/${p.slug}`,
        dot: p.heroColor,
        need: p.need,
      });
    }
    items.push({ label: "My meeting items", href: "/admin/meetings", hint: "What you sent for a decision" });
    return items;
  }

  if (can(user, "schools")) items.push({ label: "Schools", href: "/admin/schools", hint: "Plans, seats, contacts, history" });
  if (can(user, "programs") || can(user, "coordinators") || programs.length > 0) {
    items.push({ label: "Programs", href: "/admin/my-programs", hint: "Each program's own console" });
  }
  if (can(user, "programming")) items.push({ label: "Calendar", href: "/admin/programming", hint: "What is running, and where" });
  if (can(user, "run_admin_agenda")) items.push({ label: "Admin meeting", href: "/admin/meetings", hint: "Schools sent for a decision" });
  if (can(user, "lessons")) items.push({ label: "Teaching material", href: "/admin/lessons", hint: "Lessons, resources and cycles" });
  if (can(user, "cycles") && !can(user, "lessons")) {
    items.push({ label: "Chesed Cycles", href: "/admin/cycles", hint: "The eight themes and their dates" });
  }
  if (can(user, "orders") || can(user, "pricing")) items.push({ label: "Money", href: "/admin/orders", hint: "Orders and pricing" });
  if (can(user, "users")) items.push({ label: "People & access", href: "/admin/users", hint: "Accounts, roles and passwords" });

  return items.slice(0, 7);
}

/** The school side. Two audiences, and the money is only one of them. */
export function schoolNav(user: Parameters<typeof canRunOwnSchool>[0]): NavItem[] {
  const items: NavItem[] = [{ label: "Today", href: "/school", hint: "Where each program is up to" }];

  if (canRunSchoolApp(user) || canRunOwnSchool(user)) {
    items.push({ label: "Our programs", href: "/school/programs" });
    items.push({ label: "Chesed activity", href: "/school/activity" });
    items.push({ label: "Ambassadors", href: "/school/ambassadors" });
  }

  // An app admin is a teacher looking after what students are doing. What the
  // school pays is none of their business.
  if (canRunOwnSchool(user)) {
    items.push({ label: "Teachers", href: "/school/teachers" });
    items.push({ label: "Plan & seats", href: "/school/plan" });
  }

  return items.slice(0, 7);
}

/** The two sides of the portal, which differ only in colour. */
export const SIDE = {
  joc: { rail: C.ink, railText: C.white, accent: C.orange, wordmark: "/brand/joc-wordmark-white.png" },
  school: { rail: C.panel, railText: C.ink, accent: C.orangeText, wordmark: "/brand/joc-wordmark.png" },
} as const;
