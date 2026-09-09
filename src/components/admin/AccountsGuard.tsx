import { safeAuth, isAuthConfigured } from "@/auth";
import { canManageAccounts } from "@/lib/access";

/**
 * Wraps the account-management pages — schools, plans, demo pipeline, people.
 * Only super admins get in; the educational team works on content instead.
 *
 * Hiding the sidebar link is not enough on its own: these pages read account
 * and billing data, so they check for themselves.
 */
export async function AccountsGuard({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();

  // Before sign-in is configured there is nobody to authorize; the console is
  // open so it can be reviewed, and the sample-data banner explains the state.
  if (!isAuthConfigured || canManageAccounts(session?.user)) return <>{children}</>;

  return (
    <div style={{ maxWidth: "460px", padding: "40px 0" }}>
      <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>
      <h1 style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "-0.03em", color: "#10233F", margin: "0 0 10px" }}>
        Super admin only
      </h1>
      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: 0 }}>
        School accounts, plans, discounts and user records are restricted to super admins. You can
        manage lesson plans, resources and the Teachers&rsquo; Board from the Content section.
      </p>
    </div>
  );
}
