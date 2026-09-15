import { safeAuth, isAuthConfigured } from "@/auth";
import {
  canManageAccounts, canManageCalendar, canManageContent, canManageUsers,
} from "@/lib/access";

/**
 * Every console page says what it needs, and checks for itself.
 *
 * Hiding a link in the sidebar is not access control — the page is still one
 * typed address away. This matters more since the console stopped being a
 * single ladder: the programming team can reach the console, so "is signed in
 * to the console" no longer implies "may edit lesson plans". Each page has to
 * name its own capability.
 */
export type Capability = "content" | "calendar" | "accounts" | "users";

const CHECKS = {
  content: canManageContent,
  calendar: canManageCalendar,
  accounts: canManageAccounts,
  users: canManageUsers,
} as const;

const REFUSALS: Record<Capability, { title: string; body: string }> = {
  content: {
    title: "Educational team only",
    body: "Lesson plans, resources, the shop and the Teachers’ Board belong to the educational team. You can work on the calendar, the programming events and school accounts.",
  },
  calendar: {
    title: "You can’t change the calendar",
    body: "The Chesed Cycle dates and the programming calendar are edited by the programming and educational teams.",
  },
  accounts: {
    title: "You can’t open school accounts",
    body: "School accounts, plans and discounts are restricted. You can manage lesson plans, resources and the Teachers’ Board from the Content section.",
  },
  users: {
    title: "Super admin only",
    body: "Accounts, roles and passwords are restricted to super admins — granting access is deliberately kept apart from every other job.",
  },
};

export async function Guard({
  need, children,
}: {
  need: Capability;
  children: React.ReactNode;
}) {
  const session = await safeAuth();

  // Before sign-in is configured there is nobody to authorize; the console is
  // open so it can be reviewed, and the sample-data banner explains the state.
  if (!isAuthConfigured || CHECKS[need](session?.user)) return <>{children}</>;

  const { title, body } = REFUSALS[need];
  return (
    <div style={{ maxWidth: "460px", padding: "40px 0" }}>
      <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>
      <h1 style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "-0.03em", color: "#10233F", margin: "0 0 10px" }}>
        {title}
      </h1>
      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

/** The content pages. */
export function ContentGuard({ children }: { children: React.ReactNode }) {
  return <Guard need="content">{children}</Guard>;
}

/** The Chesed Cycles and the programming calendar. */
export function CalendarGuard({ children }: { children: React.ReactNode }) {
  return <Guard need="calendar">{children}</Guard>;
}

/** Accounts, roles and passwords — super admins only. */
export function UsersGuard({ children }: { children: React.ReactNode }) {
  return <Guard need="users">{children}</Guard>;
}
