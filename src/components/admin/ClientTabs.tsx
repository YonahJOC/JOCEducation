import Link from "next/link";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { C, F, R } from "@/lib/joc-tokens";

/**
 * Client relations: everyone JOC has a relationship with, one tab a kind.
 *
 * Schools first — that is most of it — and the Experiences department's
 * clients beside them. Donors, or whoever comes next, is one more entry
 * here. Each tab shows only to somebody who can open it, and with only one
 * there is nothing to choose between, so no tabs at all.
 */
export async function ClientTabs({ active }: { active: "schools" | "experiences" }) {
  const session = await safeAuth();
  const me = session?.user;
  const tabs = [
    { id: "schools", label: "Schools", href: "/admin/schools", icon: "school", show: openForReview || can(me, "schools") },
    { id: "experiences", label: "Experiences", href: "/admin/experiences", icon: "celebration", show: openForReview || can(me, "experiences") },
  ].filter((t) => t.show);
  if (tabs.length < 2) return null;

  return (
    <nav aria-label="Client relations" style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "0 0 22px" }}>
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
