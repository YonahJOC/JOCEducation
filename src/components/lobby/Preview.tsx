"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { manualToEvent } from '@/lib/lobby/events';
import { slideHTML } from '@/lib/lobby/markup';
import { shapeEvent, type Slide } from '@/lib/lobby/model';
import type { LobbyDoc, ManualProgram } from '@/lib/lobby/types';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** The real lobby screen in a frame, fed the admin's current (even unsaved) data */
export function ScreenPreview({ doc, now, focusId }: { doc: LobbyDoc; now: Date | null; focusId?: string | null }) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === location.origin && e.data?.type === 'joc-preview-ready') setReady(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage(
      { type: 'joc-preview', doc, now: now ? now.toISOString() : null, focusId: focusId ?? null },
      location.origin,
    );
  }, [ready, doc, now, focusId]);

  const scale = width / 1920;
  return (
    <div className="a-screen-frame" ref={wrap} style={{ height: width * (1080 / 1920) }}>
      {width > 0 && (
        <iframe
          ref={frame}
          src="/lobby?preview=1"
          title="Lobby screen preview"
          tabIndex={-1}
          style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}
        />
      )}
      {!ready && <div className="a-screen-loading" aria-hidden="true" />}
    </div>
  );
}

const SLIDE_WIDTH = 999; // the carousel card's width on the 1920 canvas

/** One carousel card exactly as the lobby draws it */
export function CardPreview({ program, doc }: { program: ManualProgram; doc: LobbyDoc }) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const shown = shapeEvent(manualToEvent({ ...program, program: program.program || 'Program name', allDay: false }), doc.settings);
  const slide: Slide = { ...shown, label: 'Happening now', labelInk: '#e8690a' };
  const html = slideHTML(slide);
  const scale = width / SLIDE_WIDTH;
  useLayoutEffect(() => {
    if (inner.current) setH(inner.current.offsetHeight * scale);
  }, [html, scale]);
  return (
    <div className="a-cardpreview" ref={wrap} style={{ height: h || undefined }}>
      <div ref={inner} className="a-cardpreview-inner" style={{ width: SLIDE_WIDTH, transform: `scale(${scale})` }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
