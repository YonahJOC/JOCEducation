import { safeAuth, isAuthConfigured } from "@/auth";
import { can, CAPABILITY_LABELS, type Capability } from "@/lib/access";

/**
 * Every console page names the one permission it needs, and checks for itself.
 *
 * Hiding a link in the sidebar is not access control — the page is still one
 * typed address away. There are fourteen permissions, one per thing somebody
 * can actually do, so an admin type can be as narrow as "runs the shop"
 * without also handing over the lesson plans.
 */
export async function Guard({
  need, children,
}: {
  need: Capability;
  children: React.ReactNode;
}) {
  const session = await safeAuth();

  // Before sign-in is configured there is nobody to authorize; the console is
  // open so it can be reviewed, and the sample-data banner explains the state.
  if (!isAuthConfigured || can(session?.user, need)) return <>{children}</>;
  return (
    <div style={{ maxWidth: "460px", padding: "40px 0" }}>
      <p style={{ fontSize: "30px", marginBottom: "12px" }}>🔒</p>
      <h1 style={{ fontWeight: 800, fontSize: "22px", letterSpacing: "-0.03em", color: "#10233F", margin: "0 0 10px" }}>
        Not part of your admin type
      </h1>
      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: 0 }}>
        This page needs <strong style={{ color: "#10233F" }}>{CAPABILITY_LABELS[need]}</strong>, which
        your admin type does not include. A super admin can change that under Admin types.
      </p>
    </div>
  );
}

/** One wrapper per permission, so a page reads as what it needs. */
export const LessonsGuard = guardFor("lessons");
export const ResourcesGuard = guardFor("resources");
export const ProgramsGuard = guardFor("programs");
export const BoardGuard = guardFor("board");
export const RoomsGuard = guardFor("rooms");
export const ShopGuard = guardFor("shop");
export const SiteGuard = guardFor("site");
export const FormsGuard = guardFor("forms");
export const ProgrammingGuard = guardFor("programming");
export const CyclesGuard = guardFor("cycles");
export const SchoolsGuard = guardFor("schools");
export const DemosGuard = guardFor("demos");
export const OrdersGuard = guardFor("orders");
export const PricingGuard = guardFor("pricing");
export const UsersGuard = guardFor("users");

function guardFor(need: Capability) {
  return function Wrapped({ children }: { children: React.ReactNode }) {
    return <Guard need={need}>{children}</Guard>;
  };
}
