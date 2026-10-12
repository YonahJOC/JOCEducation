import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { isScreenStaff } from "@/lib/school-screen/access";
import { C, F, R } from "@/lib/joc-tokens";

/**
 * Every TV JOC looks after, under one item in the rail: the lobby's, and each
 * school's hallway screen. The two are kept by different permissions, so
 * each tab shows only to somebody who can open it.
 */
export async function ScreensTabs({ active }: { active: "lobby" | "schools" }) {
  const session = await safeAuth();
  const me = session?.user;
  const tabs = [
    { id: "lobby", label: "Lobby TV", href: "/admin/lobby", icon: "tv", show: openForReview || can(me, "lobby") },
    { id: "schools", label: "School screens", href: "/admin/school-screens", icon: "school", show: isScreenStaff(me) },
  ].filter((t) => t.show);
  if (tabs.length < 2) return null;

  return (
    <nav aria-label="Live screens" style={{ display: "flex", gap: "8px", padding: "18px 28px 0", flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? "page" : undefined}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", padding: "0 18px",
              borderRadius: R.button, textDecoration: "none", fontFamily: F.ui, fontSize: "15px", fontWeight: 600,
              background: on ? C.blue : C.white, color: on ? C.white : C.ink,
              boxShadow: on ? "none" : "0 2px 0 #E3E6EF",
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "20px" }}>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
