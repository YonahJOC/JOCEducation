"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";
import { Panel, linkBtn } from "./parts";
import { savePageOrCreate, newPage, dropPage, pageToTask } from "@/app/actions/my-desk";
import type { Page } from "@/lib/my-desk";

/**
 * The notebook — the one part of the console nobody else can read.
 *
 * It opens writable. There is no "start a page" step, because a scratch pad
 * you have to create before you can write on it is a scratch pad people use
 * once: the row appears in the database on the first keystroke instead, and
 * the id comes back for the next save.
 *
 * It saves as you type because the alternative is a Save button, and a Save
 * button on a pad is a thing people forget during the call they are taking
 * notes about. 400ms after the last keystroke, quietly.
 */
/** The paper itself: everything inside the card sits on this. */
const NOTE: React.CSSProperties = {
  background: C.orangeTint,
  transform: "rotate(-0.8deg)",
  boxShadow: "0 2px 0 #FFD8AE, 0 10px 24px rgba(168,91,0,.12)",
};

export function Notebook({ pages }: { pages: Page[] }) {
  const blank: Page = { id: "", title: "", body: "" };
  const [list, setList] = useState<Page[]>(pages.length ? pages : [blank]);
  const [current, setCurrent] = useState(list[0].id);
  const [saved, setSaved] = useState(true);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The id of a page created by typing, so the next save edits it.
  const madeId = useRef<string | null>(null);

  const page = list.find((p) => p.id === current) ?? list[0];

  function edit(patch: Partial<Page>) {
    const next = { ...page, ...patch };
    setList((l) => l.map((p) => (p.id === page.id ? next : p)));
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const id = next.id || madeId.current;
      void savePageOrCreate(id || null, next.title, next.body).then((r) => {
        if (r.ok && r.id && !next.id) madeId.current = r.id;
        setSaved(r.ok);
      });
    }, 400);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Panel
      title="Scratchpad"
      flush
      rail
      note={NOTE}
      tools={
        <>
          {list.map((p) => {
            const on = p.id === page.id;
            return (
              <button
                key={p.id || "new"}
                type="button"
                onClick={() => setCurrent(p.id)}
                style={{
                  flex: "0 0 auto", maxWidth: on ? "170px" : "150px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  background: on ? C.ink : "rgba(255,255,255,.65)", color: on ? C.white : C.ink,
                  border: 0, borderRadius: "8px", padding: "6px 10px",
                  font: `${on ? 600 : 500} 12.5px/1 ${F.ui}`, cursor: "pointer",
                }}
              >
                {p.title || "Untitled"}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => start(() => { void newPage(""); })}
            style={{
              flex: "0 0 auto", background: "transparent",
              border: `1px dashed ${C.orangeText}`, color: C.orangeText,
              borderRadius: R.sm, padding: "0 10px", minHeight: HIT,
              ...T.small, cursor: "pointer", marginLeft: "auto",
            }}
          >
            + Page
          </button>
        </>
      }
    >
      <input
        value={page.title}
        onChange={(e) => edit({ title: e.target.value })}
        placeholder="Untitled"
        aria-label="Page title"
        style={{
          flex: "0 0 auto", border: 0, background: "transparent",
          font: `600 20px/1.2 ${F.ui}`, letterSpacing: "-.01em", color: C.ink,
          padding: "12px 20px 4px",
        }}
      />
      <textarea
        value={page.body}
        onChange={(e) => edit({ body: e.target.value })}
        placeholder="This page is yours. Agendas, call notes, half-ideas. Nobody else sees it."
        aria-label="Page"
        style={{
          flex: 1, minHeight: 0, border: 0, resize: "none",
          padding: "4px 20px 14px", font: `400 16px/1.55 ${F.read}`,
          color: C.ink, background: "transparent",
        }}
      />
      <div style={{
        flex: "0 0 auto", display: "flex", flexWrap: "wrap", alignItems: "center",
        gap: "6px 16px", padding: "9px 18px", borderTop: `1px solid ${C.hairline}`,
      }}>
        <span style={{ ...T.meta, color: C.orangeText, flex: 1 }}>
          ONLY YOU SEE THIS
        </span>
        <span style={{ ...T.meta, color: saved ? C.greenText : C.faint }}>
          {saved ? "SAVED" : "SAVING…"}
        </span>
        <button
          type="button"
          onClick={() => start(() => { void pageToTask(page.title || page.body.split("\n")[0] || ""); })}
          style={{ ...linkBtn, font: `600 13px/1 ${F.ui}` }}
        >
          Make this a task
        </button>
        {list.length > 1 && page.id ? (
          <button
            type="button"
            onClick={() => start(() => { void dropPage(page.id); })}
            style={{ ...linkBtn, color: C.destructive, font: `600 13px/1 ${F.ui}` }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
