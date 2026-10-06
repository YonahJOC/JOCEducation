"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { setStudentList, setCheck } from "@/app/actions/app-board";
import { viewAsSchool } from "@/app/actions/view-as-school";
import { NETWORK_LABEL, TYPE_LABEL, type Board, type BoardRow } from "@/lib/board";
import { C, F, label, datum, primaryButton, secondaryButton } from "@/lib/joc-tokens";

/**
 * One school, opened from the board.
 *
 * Everything a coordinator would otherwise open four pages for: whether the
 * school can sign in, where their student list has got to, who to ring, and
 * what has been said. The full record is still a click away — this is what
 * you need without leaving the board.
 *
 * No student's name appears. The list is a count of files and a state; the
 * files open through /api/files/[id], which checks the Schools capability.
 */
export function SchoolDrawer({
  row, board, onClose,
}: {
  row: BoardRow;
  board: Board;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [stuckReason, setStuckReason] = useState("");
  const [askingStuck, setAskingStuck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = board.statuses.find((s) => s.id === row.statusId);
  const whatsapp = row.contact?.phone?.replace(/\D/g, "") ?? null;
  const firstName = row.contact?.name?.split(/\s+/)[0] ?? null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(16,35,63,.44)", zIndex: 90 }} />

      <aside role="dialog" aria-modal="true" aria-label={row.name} className="joc-drawer">
        <header style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...datum, color: C.muted, margin: "0 0 3px" }}>
              {status?.label.toUpperCase() ?? "NO STATUS"}
            </p>
            <h2 style={{
              fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em",
              color: C.ink, margin: 0, lineHeight: 1.2,
            }}>
              {row.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              fontFamily: F.data, fontSize: "13px", color: C.muted, background: "none",
              border: "none", cursor: "pointer", minHeight: "44px", minWidth: "44px",
            }}
          >
            CLOSE
          </button>
        </header>

        {/* 1. The account — the thing the board exists to surface. */}
        <Card title="Their account">
          {row.account.state === "none" ? (
            <>
              <p style={{ ...body, color: C.orangeText, margin: "0 0 12px" }}>
                Nobody at {row.name} can sign in. Nothing they are sent will be read until
                somebody there has a login.
              </p>
              <Link href={`/admin/schools/${row.schoolId}`} style={{ ...primaryButton, textDecoration: "none" }}>
                Set up their account
              </Link>
            </>
          ) : (
            <>
              <p style={{ ...body, margin: "0 0 12px" }}>
                {row.account.logins} login{row.account.logins === 1 ? "" : "s"} ·{" "}
                {row.account.state === "live"
                  ? `last in ${row.account.lastSeenAt?.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
                  : "nobody has signed in yet"}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Link href={`/admin/schools/${row.schoolId}`} style={{ ...secondaryButton, textDecoration: "none" }}>
                  Open their account
                </Link>
                <Link
                  href="/admin/messages"
                  style={{ ...secondaryButton, textDecoration: "none" }}
                >
                  Message them{row.unreadMessages > 0 ? ` · ${row.unreadMessages} new` : ""}
                </Link>
                <form action={viewAsSchool.bind(null, row.schoolId)}>
                  <button type="submit" style={{ ...secondaryButton, cursor: "pointer" }}>
                    See their portal
                  </button>
                </form>
              </div>
            </>
          )}
        </Card>

        {/* 2. The student list. */}
        <Card title="Student list">
          <p style={{ ...body, margin: "0 0 10px" }}>
            {row.listState === "UPLOADED" && (
              <span style={{ color: C.greenText, fontWeight: 600 }}>
                JOC has their list
                {row.listAt ? `, from ${row.listAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}` : ""}.
              </span>
            )}
            {row.listState === "STUCK" && (
              <span style={{ color: C.redText, fontWeight: 600 }}>
                Stuck — {row.listNote ?? "no reason was written down"}.
              </span>
            )}
            {row.listState === "NOT_SENT" && (
              <span style={{ color: C.orangeText, fontWeight: 600 }}>
                They have not sent one.
              </span>
            )}
          </p>

          <p style={{ ...body, fontSize: "14px", margin: "0 0 12px" }}>
            {row.listFiles > 0
              ? `${row.listFiles} version${row.listFiles === 1 ? "" : "s"} on file.`
              : "No file has been uploaded."}
          </p>

          {askingStuck ? (
            <div style={{ display: "grid", gap: "8px" }}>
              <input
                value={stuckReason}
                onChange={(e) => setStuckReason(e.target.value)}
                placeholder="What is wrong with it? e.g. Missing gender"
                style={{
                  fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
                  border: `1px solid ${C.hairline}`, borderRadius: "10px",
                  padding: "10px 12px", minHeight: "44px",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => {
                    const res = await setStudentList(row.schoolId, "STUCK", stuckReason);
                    if (!res.ok) setError(res.error);
                    else { setAskingStuck(false); setError(null); }
                  })}
                  style={{ ...primaryButton, cursor: "pointer" }}
                >
                  Mark it stuck
                </button>
                <button type="button" onClick={() => setAskingStuck(false)} style={{ ...secondaryButton, cursor: "pointer" }}>
                  Never mind
                </button>
              </div>
              <p style={{ ...body, fontSize: "13px", margin: 0 }}>
                The school sees this reason on their own Today page.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {row.listState !== "STUCK" ? (
                <button type="button" onClick={() => setAskingStuck(true)} style={{ ...secondaryButton, cursor: "pointer" }}>
                  Mark it stuck
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => {
                    const res = await setStudentList(row.schoolId, "UPLOADED");
                    if (!res.ok) setError(res.error);
                  })}
                  style={{ ...primaryButton, cursor: "pointer" }}
                >
                  Mark it usable
                </button>
              )}
            </div>
          )}

          <p style={{ ...body, fontSize: "13px", color: C.muted, margin: "12px 0 0" }}>
            These files hold students&rsquo; names. Only somebody with the Schools permission can
            open one, and they are never shown on a screen.
          </p>
        </Card>

        {/* 3. The facts. */}
        <Card title="The facts">
          <Fact name="Students" value={row.studentCount?.toLocaleString("en-US") ?? null} />
          <Fact name="Network" value={row.network ? NETWORK_LABEL[row.network] : null} />
          <Fact name="Type" value={row.type ? TYPE_LABEL[row.type] ?? row.type : null} />
          <Fact name="Owner" value={row.ownerName} missing="Nobody owns this school" />
          <Fact name="Main contact" value={row.contact?.name ?? null} missing="Nobody named" />
          <Fact name="Email" value={row.contact?.email ?? null} />

          {whatsapp && firstName && (
            <p style={{ margin: "10px 0 0" }}>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                style={{ ...secondaryButton, textDecoration: "none" }}
              >
                WhatsApp {firstName}
              </a>
            </p>
          )}

          {board.checks.map((c) => {
            const mark = row.checks[c.id];
            return (
              <p key={c.id} style={{ ...body, margin: "10px 0 0" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(mark)}
                    onChange={(e) => {
                      const on = e.target.checked;
                      start(async () => { await setCheck(c.id, row.schoolId, on); });
                    }}
                    style={{ width: "17px", height: "17px", accentColor: C.blue }}
                  />
                  {c.label}
                  <span style={{ color: C.muted, fontSize: "13px" }}>
                    {mark ? (mark.imported ? "· from Monday" : "· done") : "· not yet"}
                  </span>
                </label>
              </p>
            );
          })}
        </Card>

        {error && (
          <p style={{ ...body, color: C.orangeText, margin: "0 0 12px" }}>{error}</p>
        )}

        <p style={{ margin: 0 }}>
          <Link href={`/admin/schools/${row.schoolId}`} style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue }}>
            The whole school record →
          </Link>
        </p>
      </aside>
    </>
  );
}

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.muted,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      backgroundColor: C.white, border: `1px solid ${C.hairline}`,
      borderRadius: "14px", padding: "16px 18px", marginBottom: "12px",
    }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>{title}</p>
      {children}
    </section>
  );
}

function Fact({ name, value, missing }: { name: string; value: string | null; missing?: string }) {
  return (
    <p style={{ display: "flex", justifyContent: "space-between", gap: "12px", margin: "0 0 6px", ...body }}>
      <span style={{ color: C.muted }}>{name}</span>
      <span style={{ color: value ? C.ink : C.orangeText, fontWeight: value ? 600 : 400, textAlign: "right" }}>
        {value ?? missing ?? "Not recorded"}
      </span>
    </p>
  );
}
