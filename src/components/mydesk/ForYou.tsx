"use client";

import Link from "next/link";
import { useTransition } from "react";
import { C, F } from "@/lib/joc-tokens";
import { Panel, Empty, Initial, fillBtn, linkBtn, quietBtn, QUIET, RULE } from "./parts";
import { clearFromTray, trayToTask, acceptTask, declineTask } from "@/app/actions/my-desk";
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
        <Empty line="Nobody's waiting on you. Mentions, messages and asks addressed to you land here." />
      ) : null}

      {tray.map((f) => (
        <div
          key={`${f.kind}${f.id}`}
          style={{
            display: "flex", gap: "12px", alignItems: "flex-start",
            padding: "12px 18px", borderBottom: `1px solid ${RULE}`,
          }}
        >
          <Initial letter={f.initial} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `500 14px/1.35 ${F.ui}`, color: C.ink }}>
              <strong style={{ fontWeight: 600 }}>{f.who}</strong>{" "}
              <span style={{ color: QUIET }}>{f.verb}</span>
            </div>
            <div style={{
              font: `400 15px/1.4 ${F.read}`, color: "#1F304D", marginTop: "3px",
              textWrap: "pretty",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {f.quote}
            </div>

            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              gap: "6px 14px", marginTop: "7px",
            }}>
              <span style={{
                font: `500 10px/1.3 ${F.data}`, letterSpacing: ".05em",
                color: QUIET, flex: "1 1 140px",
              }}>
                {f.source}
              </span>
              {/* A task somebody handed over is already a row on this desk,
                  waiting to be taken on. Everything else becomes a new one. */}
              <button
                type="button"
                disabled={pending}
                onClick={run(() =>
                  f.kind === "task"
                    ? acceptTask(f.id)
                    : trayToTask(f.kind, f.id, `${f.who}: ${f.quote.slice(0, 80)}`),
                )}
                style={fillBtn}
              >
                Add to my tasks
              </button>
              {f.canReply ? (
                <Link href="/admin/schools" style={{ ...linkBtn, textDecoration: "none" }}>
                  Reply
                </Link>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={run(() => (f.kind === "task" ? declineTask(f.id) : clearFromTray(f.kind, f.id)))}
                style={quietBtn}
              >
                {f.kind === "task" ? "Decline" : "Clear"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </Panel>
  );
}
