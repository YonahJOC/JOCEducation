"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  setSchoolStatus, setSchoolNetwork,
  setFieldValue, renameField, setCheck,
} from "@/app/actions/app-board";
import { NETWORK_LABEL, TYPE_LABEL, TONE, type Board, type BoardRow } from "@/lib/board";
import { SchoolDrawer } from "@/components/admin/SchoolDrawer";
import { C, F, datum } from "@/lib/joc-tokens";

/**
 * The board, the way the Monday board worked.
 *
 * Horizontal scroll with a sticky header and a sticky school column, because
 * a board with fourteen columns cannot be read any other way and wrapping it
 * would turn a glance into a scroll.
 *
 * Inline edits are optimistic: the cell changes, then the server catches up,
 * and an error puts it back and says so under the row. Waiting on a round
 * trip to see a dropdown close is what made people keep a spreadsheet open
 * beside the tool.
 */

type Group = "none" | "status" | "account" | "network" | "list";

const LIST_LABEL: Record<string, string> = {
  UPLOADED: "Uploaded",
  STUCK: "Stuck",
  NOT_SENT: "Not sent",
};
const LIST_TONE: Record<string, string> = { UPLOADED: "green", STUCK: "red", NOT_SENT: "orange" };

const ago = (d: Date | null): string => {
  if (!d) return "Never";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export function ClientsBoard({ board }: { board: Board }) {
  const [group, setGroup] = useState<Group>("none");
  const [acc, setAcc] = useState("all");
  const [net, setNet] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<{ schoolId: string; text: string } | null>(null);
  const [, start] = useTransition();

  // Optimistic overlay: what the screen shows before the server agrees.
  const [edits, setEdits] = useState<Record<string, Partial<BoardRow>>>({});
  const rowsWithEdits = useMemo(
    () => board.rows.map((r) => ({ ...r, ...(edits[r.schoolId] ?? {}) })),
    [board.rows, edits],
  );

  const act = (schoolId: string, patch: Partial<BoardRow>, run: () => Promise<{ ok: boolean; error?: string }>) => {
    const before = board.rows.find((r) => r.schoolId === schoolId);
    setEdits((e) => ({ ...e, [schoolId]: { ...(e[schoolId] ?? {}), ...patch } }));
    setError(null);
    start(async () => {
      const res = await run();
      if (!res.ok) {
        // Put it back and say why, under that row.
        setEdits((e) => {
          const next = { ...e };
          delete next[schoolId];
          return next;
        });
        setError({ schoolId, text: res.error ?? "That didn't save." });
        void before;
      }
    });
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rowsWithEdits.filter((r) => {
      if (acc === "with" && r.account.state === "none") return false;
      if (acc === "without" && r.account.state !== "none") return false;
      if (net !== "all" && r.network !== net) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        (r.contact?.name ?? "").toLowerCase().includes(needle) ||
        (r.contact?.email ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rowsWithEdits, acc, net, q]);

  const groups = useMemo(() => groupRows(shown, group, board), [shown, group, board]);

  const networks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rowsWithEdits) if (r.network) counts.set(r.network, (counts.get(r.network) ?? 0) + 1);
    return [...counts.entries()];
  }, [rowsWithEdits]);

  const drawerRow = open ? rowsWithEdits.find((r) => r.schoolId === open) ?? null : null;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a school, contact or email"
          style={{
            flex: "1 1 240px", minWidth: 0, boxSizing: "border-box",
            fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
            border: `1px solid ${C.hairline}`, borderRadius: "12px",
            padding: "10px 12px", minHeight: "44px",
          }}
        />

        <Picker value={acc} onChange={setAcc} options={[
          ["all", "Any account"], ["with", "With an account"], ["without", "Without"],
        ]} />
        <Picker value={group} onChange={(v) => setGroup(v as Group)} options={[
          ["none", "No grouping"],
          ["status", "By status"], ["account", "By account"], ["network", "By network"],
          ["list", "By student list"],
        ]} />

        <Link href="/admin/schools/board/statuses" style={{ fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue }}>
          Edit statuses
        </Link>
      </div>

      {networks.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
          <Chip on={net === "all"} onClick={() => setNet("all")}>All networks</Chip>
          {networks.map(([key, n]) => (
            <Chip key={key} on={net === key} onClick={() => setNet(key)}>
              {NETWORK_LABEL[key] ?? key} · {n}
            </Chip>
          ))}
        </div>
      )}

      <div className="joc-board-scroll">
        <table className="joc-board">
          <thead>
            <tr>
              <th className="joc-board-sticky">School</th>
              <th>Account</th>
              <th>Status</th>
              <th>Network</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>Students</th>
              {board.fields.map((f) => (
                <th key={f.id}>
                  <input
                    defaultValue={f.label}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== f.label) start(async () => { await renameField(f.id, v); });
                    }}
                    style={{
                      width: "100%", minWidth: "90px", border: "none", background: "transparent",
                      font: "inherit", color: "inherit", padding: 0,
                    }}
                  />
                </th>
              ))}
              {board.checks.map((c) => <th key={c.id}>{c.label}</th>)}
              <th>Main contact</th>
              <th>Student list</th>
              <th>Last update</th>
              <th>Note</th>
            </tr>
          </thead>

          {groups.map((g) => {
            const shut = collapsed.has(g.key);
            if (g.key === "__all") {
              return (
                <tbody key={g.key}>
                  {g.rows.map((r) => (
                    <Row
                      key={r.schoolId}
                      r={r}
                      board={board}
                      onOpen={() => setOpen(r.schoolId)}
                      act={act}
                      error={error?.schoolId === r.schoolId ? error.text : null}
                    />
                  ))}
                </tbody>
              );
            }
            return (
              <tbody key={g.key}>
                <tr className="joc-board-group">
                  <td className="joc-board-sticky" colSpan={1}>
                    <button
                      type="button"
                      onClick={() => setCollapsed((s) => {
                        const n = new Set(s);
                        if (n.has(g.key)) n.delete(g.key); else n.add(g.key);
                        return n;
                      })}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.ink,
                        minHeight: "44px", padding: 0,
                      }}
                    >
                      <span aria-hidden="true" style={{
                        display: "inline-block", width: "3px", height: "20px",
                        borderRadius: "2px", backgroundColor: TONE[g.tone]?.fg ?? C.muted,
                      }} />
                      <span style={{ transform: shut ? "rotate(-90deg)" : "none", transition: "transform .15s" }}>▾</span>
                      {g.label}
                      <span style={{ ...datum, color: C.muted }}>{g.rows.length}</span>
                    </button>
                  </td>
                  <td colSpan={99} />
                </tr>

                {!shut && g.rows.map((r) => (
                  <Row
                    key={r.schoolId}
                    r={r}
                    board={board}
                    onOpen={() => setOpen(r.schoolId)}
                    act={act}
                    error={error?.schoolId === r.schoolId ? error.text : null}
                  />
                ))}

                {!shut && g.rows.length > 0 && <Footer rows={g.rows} board={board} />}
              </tbody>
            );
          })}
        </table>
      </div>

      {drawerRow && (
        <SchoolDrawer
          row={drawerRow}
          board={board}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function Row({
  r, board, onOpen, act, error,
}: {
  r: BoardRow;
  board: Board;
  onOpen: () => void;
  act: (schoolId: string, patch: Partial<BoardRow>, run: () => Promise<{ ok: boolean; error?: string }>) => void;
  error: string | null;
}) {
  const status = board.statuses.find((s) => s.id === r.statusId);
  const tone = TONE[status?.tone ?? "ink"];
  // Anything with its own control must not also open the drawer.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <tr onClick={onOpen} style={{ cursor: "pointer" }}>
        <td className="joc-board-sticky">
          <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink }}>
            {r.name}
          </span>
          {r.updates > 0 && (
            <span style={{
              marginLeft: "7px", backgroundColor: C.panel, color: C.muted,
              borderRadius: "999px", padding: "1px 7px", fontSize: "11px", fontWeight: 600,
            }}>
              {r.updates}
            </span>
          )}
        </td>

        <td onClick={stop}>
          {r.account.state === "none" ? (
            <button
              type="button"
              onClick={onOpen}
              style={{
                fontFamily: F.ui, fontSize: "13px", fontWeight: 600, color: C.blue,
                border: `2px solid ${C.blue}`, borderRadius: "10px", background: "transparent",
                padding: "0 10px", minHeight: "34px", cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Set up account
            </button>
          ) : (
            <span>
              <Link href={`/admin/schools/${r.schoolId}`} style={{ fontSize: "13px", color: C.blue, fontWeight: 600 }}>
                Open account
              </Link>
              <span style={{ display: "block", fontSize: "12px", color: C.muted }}>
                {r.account.logins} login{r.account.logins === 1 ? "" : "s"} ·{" "}
                {r.account.lastSeenAt ? ago(r.account.lastSeenAt) : "never in"}
              </span>
              {r.unreadMessages > 0 && (
                <span style={{ fontSize: "12px", color: C.orangeText, fontWeight: 700 }}>
                  {r.unreadMessages} new
                </span>
              )}
            </span>
          )}
        </td>

        <td onClick={stop}>
          <select
            value={r.statusId ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              act(r.schoolId, { statusId: v }, () => setSchoolStatus(r.schoolId, v));
            }}
            style={{
              fontFamily: F.ui, fontSize: "13px", fontWeight: 600,
              backgroundColor: tone.bg, color: tone.fg,
              border: "none", borderRadius: "999px", padding: "6px 10px",
              minHeight: "34px", cursor: "pointer", maxWidth: "160px",
            }}
          >
            <option value="">Not set</option>
            {board.statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </td>

        <td onClick={stop}>
          <select
            value={r.network ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              act(r.schoolId, { network: v }, () => setSchoolNetwork(r.schoolId, v));
            }}
            style={{
              font: "inherit", fontSize: "13px",
              color: r.network ? C.ink : C.orangeText,
              background: "transparent", border: "none", minHeight: "34px", cursor: "pointer",
            }}
          >
            <option value="">Not recorded</option>
            {Object.entries(NETWORK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </td>

        <td style={{ color: r.type ? C.ink : C.orangeText, fontSize: "13px" }}>
          {r.type ? TYPE_LABEL[r.type] ?? r.type : "Not recorded"}
        </td>

        <td style={{ textAlign: "right", color: r.studentCount == null ? C.orangeText : C.ink, fontSize: "13px" }}>
          {r.studentCount == null ? "Not recorded" : r.studentCount.toLocaleString("en-US")}
        </td>

        {board.fields.map((f) => (
          <td key={f.id} onClick={stop}>
            <input
              defaultValue={r.fields[f.id] ?? ""}
              onBlur={(e) => {
                const v = e.target.value;
                if (v !== (r.fields[f.id] ?? "")) start2(() => setFieldValue(f.id, r.schoolId, v));
              }}
              style={{
                width: "100%", minWidth: "80px", font: "inherit", fontSize: "13px",
                color: C.ink, background: "transparent",
                border: `1px solid transparent`, borderRadius: "8px", padding: "6px 7px",
              }}
              onFocus={(e) => { e.target.style.borderColor = C.hairline; }}
            />
          </td>
        ))}

        {board.checks.map((c) => {
          const mark = r.checks[c.id];
          return (
            <td key={c.id} onClick={stop}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", minHeight: "34px" }}>
                <input
                  type="checkbox"
                  checked={Boolean(mark)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    act(
                      r.schoolId,
                      { checks: on
                        ? { ...r.checks, [c.id]: { at: new Date(), imported: false } }
                        : Object.fromEntries(Object.entries(r.checks).filter(([k]) => k !== c.id)) },
                      () => setCheck(c.id, r.schoolId, on),
                    );
                  }}
                  style={{ width: "17px", height: "17px", accentColor: C.blue }}
                />
                <span style={{ fontSize: "12px", color: mark ? C.ink : C.muted }}>
                  {mark ? (mark.imported ? "From Monday" : "Printed") : "Not yet"}
                </span>
              </label>
            </td>
          );
        })}

        <td style={{ fontSize: "13px" }}>
          {r.contact?.name ? (
            <>
              <span style={{ color: C.ink, fontWeight: 600 }}>{r.contact.name}</span>
              <span style={{ display: "block", fontSize: "12px", color: C.muted }}>
                {[r.contact.email, r.contact.phone].filter(Boolean).join(" · ") || "No way to reach them"}
              </span>
            </>
          ) : (
            <span style={{ color: C.orangeText }}>Nobody named</span>
          )}
        </td>

        <td>
          <Pill tone={LIST_TONE[r.listState]}>{LIST_LABEL[r.listState]}</Pill>
          {r.listFiles > 0 && (
            <span style={{ display: "block", fontSize: "12px", color: C.muted, marginTop: "3px" }}>
              {r.listFiles} file{r.listFiles === 1 ? "" : "s"}
            </span>
          )}
        </td>

        <td style={{ fontSize: "13px", color: r.lastUpdateAt ? C.muted : C.orangeText }}>
          {ago(r.lastUpdateAt)}
        </td>

        <td style={{ fontSize: "13px", color: C.muted, maxWidth: "240px" }}>
          {r.listNote ?? r.lastUpdateSummary ?? ""}
        </td>
      </tr>

      {error && (
        <tr>
          <td className="joc-board-sticky" />
          <td colSpan={99} style={{ color: C.orangeText, fontSize: "13px", paddingTop: 0 }}>
            {error}
          </td>
        </tr>
      )}
    </>
  );
}

/** A transition that does not need the row's own state. */
function start2(run: () => Promise<unknown>) {
  void run();
}

function Footer({ rows, board }: { rows: BoardRow[]; board: Board }) {
  const students = rows.reduce((n, r) => n + (r.studentCount ?? 0), 0);
  const unknown = rows.filter((r) => r.studentCount == null).length;
  const withAccount = rows.filter((r) => r.account.state !== "none").length;
  const ticked = rows.reduce((n, r) => n + Object.keys(r.checks).length, 0);
  const possible = rows.length * Math.max(board.checks.length, 1);

  const mix = (key: (r: BoardRow) => string, tones: Record<string, string>) => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
    return [...counts.entries()].map(([k, n]) => ({
      k, n, tone: tones[k] ?? "ink", pct: (n / rows.length) * 100,
    }));
  };

  const statusTone = Object.fromEntries(board.statuses.map((s) => [s.id, s.tone]));

  return (
    <tr className="joc-board-footer">
      <td className="joc-board-sticky" style={{ ...datum, color: C.muted }}>
        {rows.length} school{rows.length === 1 ? "" : "s"}
      </td>
      <td style={{ fontSize: "12px", color: C.muted }}>{withAccount} with an account</td>
      <td colSpan={1}><Bar parts={mix((r) => r.statusId ?? "none", statusTone)} /></td>
      <td colSpan={3} />
      <td style={{ textAlign: "right", fontSize: "12px", color: C.muted }}>
        {students.toLocaleString("en-US")}
        {unknown > 0 && <span style={{ color: C.orangeText }}> · {unknown} not recorded</span>}
      </td>
      {board.fields.map((f) => <td key={f.id} />)}
      {board.checks.map((c) => (
        <td key={c.id} style={{ fontSize: "12px", color: C.muted }}>
          {ticked} of {possible}
        </td>
      ))}
      <td />
      <td><Bar parts={mix((r) => r.listState, LIST_TONE)} /></td>
      <td colSpan={2} />
    </tr>
  );
}

function Bar({ parts }: { parts: { k: string; n: number; tone: string; pct: number }[] }) {
  return (
    <span style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", minWidth: "80px" }}>
      {parts.map((p) => (
        <span
          key={p.k}
          title={`${p.n}`}
          style={{ width: `${p.pct}%`, backgroundColor: TONE[p.tone]?.fg ?? C.hairline }}
        />
      ))}
    </span>
  );
}

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  const t = TONE[tone] ?? TONE.ink;
  return (
    <span style={{
      display: "inline-block", backgroundColor: t.bg, color: t.fg,
      borderRadius: "999px", padding: "3px 9px",
      fontFamily: F.ui, fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        fontFamily: F.ui, fontSize: "13px", fontWeight: 600,
        color: on ? C.white : C.ink,
        backgroundColor: on ? C.ink : C.white,
        border: on ? "none" : `1px solid ${C.hairline}`,
        borderRadius: "999px", padding: "7px 13px", minHeight: "36px", cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Picker({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.ink,
        backgroundColor: C.white, border: `1px solid ${C.hairline}`,
        borderRadius: "12px", padding: "0 12px", minHeight: "44px", cursor: "pointer",
      }}
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

/** Rows into groups, in the order the board's own settings say. */
function groupRows(
  rows: BoardRow[],
  group: Group,
  board: Board,
): { key: string; label: string; tone: string; rows: BoardRow[] }[] {
  if (group === "none") {
    return [{ key: "__all", label: "", tone: "ink", rows }];
  }

  if (group === "status") {
    // An empty status is worth seeing once somebody is using statuses at all.
    // Before that it is five headers and no schools, so they stay hidden
    // until at least one school has been given one.
    const anyUsed = rows.some((r) => r.statusId);
    const out = board.statuses
      .filter((s) => anyUsed || rows.some((r) => r.statusId === s.id))
      .map((s) => ({
      key: s.id,
      label: s.label,
      tone: s.tone,
      rows: rows.filter((r) => r.statusId === s.id),
    }));
    const none = rows.filter((r) => !r.statusId);
    if (none.length > 0) out.push({ key: "none", label: "No status", tone: "orange", rows: none });
    return out;
  }

  const by = (fn: (r: BoardRow) => { key: string; label: string; tone: string }) => {
    const map = new Map<string, { key: string; label: string; tone: string; rows: BoardRow[] }>();
    for (const r of rows) {
      const g = fn(r);
      const got = map.get(g.key) ?? { ...g, rows: [] };
      got.rows.push(r);
      map.set(g.key, got);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  };

  if (group === "account") {
    return by((r) => ({
      key: r.account.state,
      label: r.account.state === "live" ? "Has an account"
        : r.account.state === "invited" ? "Invited, never signed in" : "No account",
      tone: r.account.state === "live" ? "green" : r.account.state === "invited" ? "blue" : "orange",
    }));
  }
  if (group === "network") {
    return by((r) => ({
      key: r.network ?? "none",
      label: r.network ? NETWORK_LABEL[r.network] ?? r.network : "Not recorded",
      tone: r.network ? "ink" : "orange",
    }));
  }
  return by((r) => ({
    key: r.listState,
    label: LIST_LABEL[r.listState],
    tone: LIST_TONE[r.listState],
  }));
}
