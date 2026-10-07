"use client";

import Link from "next/link";
import { useTransition } from "react";
import { C, F } from "@/lib/joc-tokens";
import { Panel, Empty, Initial, Meta, btn, SUB } from "./parts";
import { clearFromTray, trayToTask } from "@/app/actions/my-desk";
import type { TrayItem } from "@/lib/my-desk";

/**
 * For you — the things other people have put in front of this person.
 *
 * Every row ends in a decision: take it, answer it, or clear it. Nothing is
 * left to sit, because a tray that only fills up is a tray people stop
 * opening. Clearing is per person: the school's question stays open in the
 * office, it just stops being this desk's problem.
 */
export function ForYou({ tray }: { tray: TrayItem[] }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => () => start(() => { void fn(); });

  return (
    <Panel title="For you" count={tray.length ? `${tray.length} NEW` : ""}>
      {tray.length === 0 ? (
        <Empty
          head="Nobody's waiting on you."
          line="Mentions on the Buzz, messages from your schools and new questions land here."
        />
      ) : null}

      {tray.map((f) => (
        <div key={`${f.kind}${f.id}`} style={{ padding: "11px 2px", borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <Initial letter={f.initial} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: F.ui, fontSize: "14px", color: SUB, margin: 0 }}>
                <strong style={{ color: C.ink, fontWeight: 600 }}>{f.who}</strong> {f.verb}
              </p>
              <p
                style={{
                  fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.ink,
                  margin: "4px 0 0",
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}
              >
                {f.quote}
              </p>
              <Meta text={f.source} />

              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={run(() => trayToTask(f.kind, f.id, `${f.who}: ${f.quote.slice(0, 80)}`))}
                  style={{ ...btn.base, ...btn.primary }}
                >
                  Add to my tasks
                </button>
                {f.canReply ? (
                  <Link href="/admin/schools" style={{ ...btn.base, ...btn.quiet, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    Reply
                  </Link>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={run(() => clearFromTray(f.kind, f.id))}
                  style={{ ...btn.base, ...btn.bare }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </Panel>
  );
}
