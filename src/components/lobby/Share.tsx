"use client";

import { useEffect, useMemo, useState } from 'react';
import { LOGO_URL } from '@/lib/lobby/config';
import { combineEvents } from '@/lib/lobby/events';
import { buildPosterSvg } from '@/lib/lobby/poster';
import { buildWeekSheet } from '@/lib/lobby/week-sheet';
import type { CalEvent, LobbyDoc } from '@/lib/lobby/types';
import { Button, Icon } from './ui';

/**
 * The week, as something you can send to people.
 *
 * Everything on this page already exists on the TV. What it did not have was
 * a way out of the building: a coordinator who wanted to tell the staff what
 * was on this week retyped it into WhatsApp, which is how the list on the
 * wall and the list in the group stopped matching.
 *
 * So: the same events, drawn once, and three ways to take it —
 *
 *   Download  a PNG, which is what WhatsApp wants. Sending a PDF to a
 *             group gets you a grey file nobody opens on a phone.
 *   Copy      straight to the clipboard, for pasting into WhatsApp Web
 *             or Teams without going via the Downloads folder.
 *   Print     its own window, so the console's furniture stays out of it.
 *
 * Nothing here writes anything. It is a read of what is already saved.
 */

const DAYS = [7, 14] as const;

export function Share({ doc, google }: { doc: LobbyDoc; google: CalEvent[] | null }) {
  const [days, setDays] = useState<number>(7);
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  // The wordmark has to travel inside the SVG as data, or it is simply
  // missing from the exported PNG — a canvas will not go and fetch it.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(LOGO_URL);
        const blob = await res.blob();
        const url: string = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
        if (alive) setLogo(url);
      } catch {
        // The poster falls back to setting the name as text.
      }
    })();
    return () => { alive = false; };
  }, []);

  const sheet = useMemo(
    () => buildWeekSheet(combineEvents(doc, google), doc.settings, new Date(), days),
    [doc, google, days],
  );

  const svg = useMemo(() => buildPosterSvg(sheet, { logoDataUrl: logo }), [sheet, logo]);

  const fileName = 'JOC-this-week-' + (sheet.days[0]?.key ?? 'week') + '.png';

  /** The SVG, rasterised at twice its size so it stays sharp on a phone. */
  async function toPngBlob(): Promise<Blob> {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const img = new Image();
      img.decoding = 'sync';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('The poster could not be drawn.'));
        img.src = url;
      });

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser cannot draw the poster.');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The poster could not be saved.'))), 'image/png');
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function flash(msg: string) {
    setSaid(msg);
    setTimeout(() => setSaid((s) => (s === msg ? null : s)), 2600);
  }

  async function download() {
    setBusy('download');
    try {
      const blob = await toPngBlob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      flash('Saved to your downloads.');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not save it.');
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    setBusy('copy');
    try {
      const blob = await toPngBlob();
      const Item = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
      if (!Item || !navigator.clipboard?.write) {
        flash('This browser cannot copy pictures. Download it instead.');
        return;
      }
      await navigator.clipboard.write([new Item({ 'image/png': blob })]);
      flash('Copied. Paste it into WhatsApp.');
    } catch {
      flash('Could not copy it. Download it instead.');
    } finally {
      setBusy(null);
    }
  }

  function print() {
    // Its own window: the console's rail, topbar and preview column have no
    // business on a sheet going up on a noticeboard.
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) {
      flash('Your browser blocked the print window.');
      return;
    }
    w.document.write(
      '<!doctype html><html><head><meta charset="utf-8"><title>This week at JOC</title>' +
        '<style>html,body{margin:0;padding:0;background:#fff}' +
        'svg{width:100%;height:auto;display:block}' +
        '@media print{@page{margin:10mm}}</style></head><body>' +
        svg +
        '</body></html>',
    );
    w.document.close();
    w.focus();
    // Give the image inside the SVG a moment before the dialog freezes it.
    setTimeout(() => w.print(), 350);
  }

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Share</h1>
          <p>The week as one picture, for the staff group.</p>
        </div>
      </header>

      <div className="a-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button kind="primary" icon="download" onClick={download} disabled={busy !== null}>
            {busy === 'download' ? 'Making it…' : 'Download picture'}
          </Button>
          <Button kind="ghost" icon="content_copy" onClick={copy} disabled={busy !== null}>
            {busy === 'copy' ? 'Copying…' : 'Copy'}
          </Button>
          <Button kind="ghost" icon="print" onClick={print} disabled={busy !== null}>
            Print
          </Button>

          <span style={{ flex: 1 }} />

          <div role="group" aria-label="How far ahead" style={{ display: 'flex', gap: 6 }}>
            {DAYS.map((d) => (
              <Button key={d} small kind={days === d ? 'primary' : 'ghost'} onClick={() => setDays(d)}>
                {d} days
              </Button>
            ))}
          </div>
        </div>

        <p role="status" style={{ margin: '12px 0 0', minHeight: 20, fontSize: 14, fontWeight: 600, color: '#5a6782' }}>
          {said ?? (sheet.programCount === 0
            ? 'Nothing on the calendar for this stretch.'
            : sheet.programCount + (sheet.programCount === 1 ? ' program' : ' programs') + ' across ' + sheet.days.length + (sheet.days.length === 1 ? ' day' : ' days') + '.')}
        </p>
      </div>

      <div className="a-card" style={{ padding: 18 }}>
        <div
          aria-label="The picture that will be shared"
          style={{ maxWidth: 540, margin: '0 auto' }}
          // The poster is built as a string so that the preview and the
          // exported file are the same drawing, never two of them.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <p style={{ margin: '14px 2px 0', fontSize: 14, color: '#5a6782', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="info" size={18} fill={false} />
        <span>It reads what is saved. Add a program and it appears here straight away.</span>
      </p>
    </div>
  );
}
