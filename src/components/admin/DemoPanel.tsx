"use client";

import { useActionState } from "react";
import Link from "next/link";
import { setSchoolDemo, type DemoResult } from "@/app/actions/school-demo";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";

/**
 * The rollout switch.
 *
 * A school on the demo portal signs in to two pages: the screen in their
 * building, and the people who may work it. Everything else in the portal
 * refuses them on the server, so this is not a nav setting — it is what the
 * school's site *is*.
 *
 * One button, and it says what will happen rather than naming a field.
 * Nothing is sent to the school either way.
 */
export function DemoPanel({ slug, demoAt }: { slug: string; demoAt: Date | string | null }) {
  const [res, run, busy] = useActionState<DemoResult | null, FormData>(setSchoolDemo, null);

  // The server's answer wins once there is one; until then, what we loaded.
  const on = res?.ok === true ? res.demo : Boolean(demoAt);

  const since =
    demoAt && on
      ? new Date(demoAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null;

  return (
    <section
      style={{
        border: `1px solid ${on ? C.orange : C.rule}`,
        background: on ? C.orangeTint : C.white,
        borderRadius: R.form,
        padding: "16px 18px",
        margin: "0 0 18px",
      }}
    >
      <h2 style={{ ...T.name, color: C.ink, margin: "0 0 6px" }}>
        {on ? "On the demo portal" : "The demo portal"}
      </h2>

      <p style={{ ...T.read, color: C.muted, margin: "0 0 14px", maxWidth: "62ch" }}>
        {on ? (
          <>
            This school sees their live screen and their people, and nothing else.
            Every other page sends them back to the screen, whether they click it or
            type the address.{since ? ` On the demo since ${since}.` : ""}
          </>
        ) : (
          <>
            Put this school on the demo and their portal becomes two pages — their
            live screen, and who can sign in. Use it for a school being shown JOC for
            the first time. Nothing is sent to them either way; tell them yourself.
          </>
        )}
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <form action={run}>
          <input type="hidden" name="slug" value={slug} />
          {/* Absent means off, which is what the action reads. */}
          {!on && <input type="hidden" name="demo" value="on" />}
          <button
            type="submit"
            disabled={busy}
            style={{
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
              minHeight: HIT, padding: "0 18px",
              borderRadius: R.button, border: "none", cursor: busy ? "wait" : "pointer",
              background: on ? C.white : C.ink,
              color: on ? C.ink : C.white,
              boxShadow: on ? `inset 0 0 0 1px ${C.ink}` : "none",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Saving…" : on ? "Give them the full portal" : "Put them on the demo"}
          </button>
        </form>

        {on && (
          <Link
            href="/school/screen"
            style={{
              fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue,
              textDecoration: "none", minHeight: HIT, display: "inline-flex", alignItems: "center",
            }}
          >
            Open the screen they see →
          </Link>
        )}
      </div>

      {res?.ok === false && (
        <p role="alert" style={{ ...T.small, color: C.redText, margin: "10px 0 0" }}>
          {res.error}
        </p>
      )}
    </section>
  );
}
