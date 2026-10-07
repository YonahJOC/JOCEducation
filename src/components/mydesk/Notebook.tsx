"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { C, F, R, label } from "@/lib/joc-tokens";
import { Panel, btn, SUB } from "./parts";
import { savePage, newPage, dropPage, pageToTask } from "@/app/actions/my-desk";
import type { Page } from "@/lib/my-desk";

/**
 * The notebook — the one part of the console nobody else can read.
 *
 * It saves as you type because the alternative is a Save button, and a Save
 * button on a scratch pad is a thing people forget during the call they are
 * taking notes about. 400ms after the last keystroke, quietly.
 */
export function Notebook({ pages }: { pages: Page[] }) {
  const [list, setList] = useState(pages);
  const [current, setCurrent] = useState(pages[0]?.id ?? null);
  const [saved, setSaved] = useState(true);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page = list.find((p) => p.id === current) ?? null;

  function edit(patch: Partial<Page>) {
    if (!page) return;
    const next = { ...page, ...patch };
    setList((l) => l.map((p) => (p.id === page.id ? next : p)));
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void savePage(next.id, next.title, next.body).then(() => setSaved(true));
    }, 400);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Panel
      title="Notebook"
      tools={
        <>
          <div style={{ display: "flex", gap: "4px", overflow: "auto", maxWidth: "260px" }}>
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrent(p.id)}
                style={{
                  ...btn.base, padding: "4px 10px", minHeight: "26px", fontSize: "12.5px",
                  borderRadius: "9px", whiteSpace: "nowrap",
                  backgroundColor: p.id === current ? C.ink : "#F4F1E9",
                  color: p.id === current ? C.white : SUB,
                }}
              >
                {p.title || "Untitled"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => start(() => { void newPage(""); })}
            style={{ ...btn.base, ...btn.bare, color: C.blue, whiteSpace: "nowrap" }}
          >
            + Page
          </button>
        </>
      }
      pad={false}
    >
      {!page ? (
        <div style={{ padding: "18px 16px" }}>
          <p style={{ fontFamily: F.read, fontSize: "15.5px", lineHeight: 1.55, color: C.muted, margin: "0 0 12px" }}>
            Agendas, call notes, half-ideas. Nobody else sees this.
          </p>
          <button
            type="button"
            onClick={() => start(() => { void newPage("Notes"); })}
            style={{ ...btn.base, ...btn.primary }}
          >
            Start a page
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "260px" }}>
          <input
            value={page.title}
            onChange={(e) => edit({ title: e.target.value })}
            placeholder="Untitled"
            aria-label="Page title"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontFamily: F.ui, fontSize: "20px", fontWeight: 600, color: C.ink,
              padding: "12px 16px 4px",
            }}
          />
          <textarea
            value={page.body}
            onChange={(e) => edit({ body: e.target.value })}
            placeholder="This page is yours. Agendas, call notes, half-ideas. Nobody else sees it."
            aria-label="Page"
            style={{
              flex: 1, minHeight: "120px", resize: "none",
              border: "none", outline: "none", background: "transparent",
              fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.ink,
              padding: "6px 16px 10px",
            }}
          />
          <footer
            style={{
              display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
              padding: "9px 16px", borderTop: `1px solid ${C.hairline}`, backgroundColor: "#FCFCFD",
              borderBottomLeftRadius: R.hero, borderBottomRightRadius: R.hero,
            }}
          >
            <span style={{ ...label, color: saved ? C.faint : C.blue }}>
              {saved ? "SAVED" : "SAVING…"}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => start(() => { void pageToTask(page.title || page.body.split("\n")[0] || ""); })}
                style={{ ...btn.base, ...btn.bare, color: C.blue }}
              >
                Make this a task
              </button>
              {list.length > 1 ? (
                <button
                  type="button"
                  onClick={() => start(() => { void dropPage(page.id); })}
                  style={{ ...btn.base, ...btn.bare, color: C.destructive }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </footer>
        </div>
      )}
    </Panel>
  );
}
