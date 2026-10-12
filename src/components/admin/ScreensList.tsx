"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { C, F, T, HIT } from "@/lib/joc-tokens";
import { setScreenUp } from "@/app/actions/school-screen";

export type ScreenRow = { id: string; slug: string; name: string; up: boolean; waiting: number };

/**
 * The left of the Live screens console: the lobby TV, then every school.
 *
 * Each school's switch says whether its hallway has a screen up, right
 * beside its name, and the whole row opens it. A search box, because forty
 * schools is a list nobody scrolls; and the ones with something waiting
 * carry an orange count, because those are the ones going stale.
 */
export function ScreensList({ rows, lobby }: { rows: ScreenRow[]; lobby: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  // The switch answers at once; the server catches up behind it.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? rows.filter((r) => r.name.toLowerCase().includes(n)) : rows;
  }, [q, rows]);
  const upCount = rows.filter((r) => optimistic[r.id] ?? r.up).length;

  function toggle(r: ScreenRow, next: boolean) {
    setError(null);
    setBusy(r.id);
    setOptimistic((o) => ({ ...o, [r.id]: next }));
    start(async () => {
      const res = await setScreenUp(r.id, next);
      if (!res.ok) {
        setError(res.error);
        setOptimistic((o) => ({ ...o, [r.id]: !next }));
      }
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <aside className="joc-screens-side" aria-label="Live screens">
      <div style={{ ...T.meta, padding: "0 10px 10px" }}>LIVE SCREENS</div>

      {lobby ? (
        <Link href="/admin/lobby" aria-current={pathname.startsWith("/admin/lobby") ? "page" : undefined} className="joc-screens-row">
          <span aria-hidden="true" className="material-symbols-rounded joc-screens-ic">tv</span>
          <span className="joc-screens-name">Lobby TV</span>
        </Link>
      ) : null}

      <Link href="/admin/school-screens" aria-current={pathname === "/admin/school-screens" ? "page" : undefined} className="joc-screens-row">
        <span aria-hidden="true" className="material-symbols-rounded joc-screens-ic">dashboard</span>
        <span className="joc-screens-name">All school screens</span>
        <span style={{ ...T.meta, fontSize: "11px" }}>{upCount}/{rows.length}</span>
      </Link>

      <div style={{ padding: "12px 4px 8px" }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a school"
          aria-label="Find a school"
          style={{
            width: "100%", boxSizing: "border-box", minHeight: "40px", padding: "8px 12px",
            border: `1px solid ${C.hairline}`, borderRadius: "10px", fontFamily: F.ui, fontSize: "14.5px", color: C.ink, background: C.white,
          }}
        />
      </div>
      {error ? <div role="alert" style={{ ...T.small, color: C.destructive, padding: "0 10px 8px" }}>{error}</div> : null}

      <div className="joc-screens-scroll">
        {shown.map((r) => {
          const up = optimistic[r.id] ?? r.up;
          const href = `/admin/school-screens/${r.slug}`;
          const on = pathname === href;
          return (
            <div key={r.id} className="joc-screens-school" data-on={on || undefined}>
              <button
                type="button"
                role="switch"
                aria-checked={up}
                aria-label={`${r.name}: screen ${up ? "up" : "not up"}`}
                disabled={busy === r.id}
                onClick={() => toggle(r, !up)}
                className="joc-switch"
                data-up={up || undefined}
              >
                <span />
              </button>
              <Link href={href} aria-current={on ? "page" : undefined} className="joc-screens-link">
                <span className="joc-screens-name">{r.name}</span>
                {r.waiting ? <span className="joc-screens-wait">{r.waiting}</span> : null}
              </Link>
            </div>
          );
        })}
        {shown.length === 0 ? <div style={{ ...T.small, color: C.muted, padding: "8px 10px" }}>No school called that.</div> : null}
      </div>

      <style>{`
        .joc-screens { display: grid; grid-template-columns: 290px minmax(0, 1fr); align-items: start; min-height: calc(100vh - 1px); }
        .joc-screens-side { position: sticky; top: 0; max-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box;
          background: ${C.white}; border-right: 1px solid ${C.hairline}; padding: 22px 12px 12px; }
        .joc-screens-main { min-width: 0; }
        .joc-screens-row { display: flex; align-items: center; gap: 10px; min-height: ${HIT}; padding: 0 10px; border-radius: 10px;
          text-decoration: none; color: ${C.ink}; font-family: ${F.ui}; font-size: 15px; font-weight: 600; }
        .joc-screens-row:hover { background: ${C.panel}; }
        .joc-screens-row[aria-current="page"] { background: ${C.blueTint}; color: ${C.blue}; }
        .joc-screens-ic { font-size: 21px; color: ${C.blue}; }
        .joc-screens-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .joc-screens-scroll { flex: 1; min-height: 0; overflow-y: auto; margin: 0 -4px; padding: 0 4px; }
        .joc-screens-school { display: flex; align-items: center; gap: 8px; padding: 0 0 0 6px; border-radius: 10px; }
        .joc-screens-school:hover { background: ${C.panel}; }
        .joc-screens-school[data-on] { background: ${C.blueTint}; }
        .joc-screens-link { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; min-height: ${HIT}; padding-right: 10px;
          text-decoration: none; color: ${C.ink}; font-family: ${F.ui}; font-size: 14.5px; font-weight: 500; }
        .joc-screens-link[aria-current="page"] { color: ${C.blue}; font-weight: 700; }
        .joc-screens-wait { flex: none; min-width: 22px; height: 22px; border-radius: 11px; padding: 0 6px; box-sizing: border-box;
          background: ${C.orangeTint}; color: ${C.orangeText}; font-family: ${F.data}; font-size: 11.5px; font-weight: 700;
          display: inline-flex; align-items: center; justify-content: center; }
        .joc-switch { flex: none; width: 38px; height: 22px; border-radius: 11px; border: 0; padding: 2px; cursor: pointer;
          background: ${C.outline}; transition: background .15s; display: inline-flex; }
        .joc-switch span { width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(16,35,63,.25);
          transition: transform .15s; }
        .joc-switch[data-up] { background: ${C.green}; }
        .joc-switch[data-up] span { transform: translateX(16px); }
        .joc-switch:disabled { opacity: .6; cursor: default; }
        .joc-switch:focus-visible { outline: 2px solid ${C.blue}; outline-offset: 2px; }
        @media (max-width: 900px) {
          .joc-screens { grid-template-columns: minmax(0, 1fr); }
          .joc-screens-side { position: static; max-height: 360px; border-right: 0; border-bottom: 1px solid ${C.hairline}; }
        }
      `}</style>
    </aside>
  );
}
