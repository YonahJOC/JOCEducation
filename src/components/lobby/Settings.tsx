"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { sanitizeDoc } from '@/lib/lobby/config';
import { formatTime } from '@/lib/lobby/time';
import type { LobbyDoc, Settings as S } from '@/lib/lobby/types';
import { Button, Card, Field, Icon, Segmented, Stepper, useConfirm, useToast } from './ui';
import type { Mutate } from './useDoc';

type Editable = Pick<S, 'clock24' | 'slideSeconds' | 'daysAhead' | 'centerName'>;
const pick = (s: S): Editable => ({ clock24: s.clock24, slideSeconds: s.slideSeconds, daysAhead: s.daysAhead, centerName: s.centerName });

export function Settings({ doc, mutate, onDraft }: { doc: LobbyDoc; mutate: Mutate; onDraft: (s: Editable | null) => void }) {
  const saved = pick(doc.settings);
  const [v, setV] = useState(saved);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const ids = { center: useId(), slide: useId() };
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  const set = (patch: Partial<Editable>) => setV((x) => ({ ...x, ...patch }));

  useEffect(() => {
    if (!dirty) setV(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(saved)]);
  useEffect(() => onDraft(dirty ? v : null), [v, dirty, onDraft]);
  useEffect(() => () => onDraft(null), [onDraft]);

  async function save() {
    setSaving(true);
    const ok = await mutate((d) => ({ ...d, settings: { ...d.settings, ...v, centerName: v.centerName.trim() || 'JOC Center' } }));
    setSaving(false);
    toast(ok ? { kind: 'ok', text: 'Screen settings saved' } : { kind: 'error', text: 'Couldn’t save. Check the connection and try again.' });
  }

  function download() {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `joc-lobby-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function restore(file: File) {
    let next: LobbyDoc;
    try {
      next = sanitizeDoc(JSON.parse(await file.text()));
    } catch {
      toast({ kind: 'error', text: 'That file isn’t a lobby screen backup.' });
      return;
    }
    const answer = await confirm({
      title: 'Restore this backup?',
      body: `It replaces everything now on the screen with the backup's ${next.programs.length} programs, impact numbers and settings.`,
      confirm: 'Restore',
      danger: true,
    });
    if (answer !== 'confirm') return;
    const ok = await mutate(() => next);
    toast(ok ? { kind: 'ok', text: 'Backup restored' } : { kind: 'error', text: 'Couldn’t restore. Try again.' });
  }

  const screenUrl = location.origin + '/';
  const sample = new Date();
  sample.setHours(16, 30);

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Screen settings</h1>
          <p>How the lobby screen looks and moves.</p>
        </div>
      </header>

      <div className="a-cards">
        <Card title="Clock" icon="schedule">
          <div className="a-setting">
            <div>
              <b>Time format</b>
              <span>Used for the big clock and every program time.</span>
            </div>
            <Segmented
              label="Time format"
              value={v.clock24 ? '24' : '12'}
              onChange={(x) => set({ clock24: x === '24' })}
              options={[
                { value: '12', label: formatTime(sample, false) },
                { value: '24', label: formatTime(sample, true) },
              ]}
            />
          </div>
        </Card>

        <Card title="Today carousel" icon="view_carousel">
          <div className="a-setting a-setting-stack">
            <label htmlFor={ids.slide}>
              <b>Time on each program</b>
              <span>How long each of today’s programs stays up before the next slides in.</span>
            </label>
            <div className="a-range">
              <input
                id={ids.slide}
                type="range"
                min={3}
                max={30}
                value={v.slideSeconds}
                onChange={(e) => set({ slideSeconds: Number(e.target.value) })}
                style={{ '--p': `${((v.slideSeconds - 3) / 27) * 100}%` } as React.CSSProperties}
              />
              <output>{v.slideSeconds} sec</output>
            </div>
          </div>
        </Card>

        <Card title="Coming up" icon="event_upcoming">
          <div className="a-setting">
            <div>
              <b>Days to show</b>
              <span>The next days that have programs. Cards that don’t fit are left out.</span>
            </div>
            <Stepper value={v.daysAhead} min={2} max={7} onChange={(n) => set({ daysAhead: n })} label="Days to show" unit={(n) => (n === 1 ? 'day' : 'days')} />
          </div>
        </Card>

        <Card title="Our location" icon="home_pin">
          <Field label="Name for the center" htmlFor={ids.center} hint="Shown on programs held at the center.">
            <input id={ids.center} className="a-input" value={v.centerName} maxLength={60} onChange={(e) => set({ centerName: e.target.value })} />
          </Field>
        </Card>

        <Card title="The TVs" icon="tv">
          <div className="a-setting a-setting-stack">
            <div>
              <b>Screen address</b>
              <span>Open this on each lobby TV in Fully Kiosk Browser.</span>
            </div>
            <div className="a-copy">
              <code>{screenUrl}</code>
              <Button
                small
                icon="content_copy"
                onClick={() => navigator.clipboard?.writeText(screenUrl).then(() => toast({ kind: 'ok', text: 'Address copied' }))}
              >
                Copy
              </Button>
            </div>
            <span className="a-hint">
              Add <code>?debug=1</code> to the address to see connection details on a TV.
            </span>
          </div>
        </Card>

        <Card title="Backup" icon="backup">
          <div className="a-setting">
            <div>
              <b>Keep a copy</b>
              <span>Every program, number and setting, in one file.</span>
            </div>
            <div className="a-btn-row">
              <Button icon="download" onClick={download}>
                Download
              </Button>
              <Button icon="upload" onClick={() => fileRef.current?.click()}>
                Restore
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) restore(f);
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className={'a-savebar' + (dirty ? ' show' : '')} aria-hidden={!dirty}>
        <span>
          <Icon name="edit" size={20} />
          Unsaved changes to the screen settings
        </span>
        <Button kind="ghost" onClick={() => setV(saved)} tabIndex={dirty ? 0 : -1}>
          Discard
        </Button>
        <Button kind="primary" icon="check" onClick={save} disabled={saving} tabIndex={dirty ? 0 : -1}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
