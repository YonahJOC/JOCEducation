"use client";

import { useEffect, useId, useState } from 'react';
import { STATS } from '@/lib/lobby/markup';
import type { CounterKey, LobbyDoc } from '@/lib/lobby/types';
import { Button, Icon, useToast } from './ui';
import type { Mutate } from './useDoc';

const fmt = (n: number) => n.toLocaleString('en-US');
const parse = (s: string) => {
  const n = Number(s.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function Impact({ doc, mutate, onDraft }: { doc: LobbyDoc; mutate: Mutate; onDraft: (v: Record<CounterKey, number> | null) => void }) {
  const saved = doc.counters.values;
  const [vals, setVals] = useState(saved);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const dirty = STATS.some((s) => vals[s.key] !== saved[s.key]);

  // Someone else saved meanwhile and nothing is being edited here: show theirs
  useEffect(() => {
    if (!dirty) setVals(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);
  useEffect(() => onDraft(dirty ? vals : null), [vals, dirty, onDraft]);
  useEffect(() => () => onDraft(null), [onDraft]);

  async function save() {
    setSaving(true);
    const ok = await mutate((d) => ({ ...d, counters: { ...d.counters, source: 'manual', values: { ...vals } } }));
    setSaving(false);
    toast(ok ? { kind: 'ok', text: 'Impact numbers updated on the screen' } : { kind: 'error', text: 'Couldn’t save. Check the connection and try again.' });
  }

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Impact</h1>
          <p>The four numbers along the bottom of the screen. They count up each time the screen starts.</p>
        </div>
      </header>

      <div className="a-stats">
        {STATS.map((s) => (
          <StatEditor
            key={s.key}
            stat={s}
            value={vals[s.key]}
            savedValue={saved[s.key]}
            onChange={(n) => setVals((v) => ({ ...v, [s.key]: n }))}
          />
        ))}
      </div>

      <div className={'a-savebar' + (dirty ? ' show' : '')} aria-hidden={!dirty}>
        <span>
          <Icon name="edit" size={20} />
          Unsaved changes to the impact numbers
        </span>
        <Button kind="ghost" onClick={() => setVals(saved)} tabIndex={dirty ? 0 : -1}>
          Discard
        </Button>
        <Button kind="primary" icon="check" onClick={save} disabled={saving} tabIndex={dirty ? 0 : -1}>
          Save numbers
        </Button>
      </div>
    </div>
  );
}

function StatEditor({
  stat,
  value,
  savedValue,
  onChange,
}: {
  stat: (typeof STATS)[number];
  value: number;
  savedValue: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  const [text, setText] = useState(fmt(value));
  const [add, setAdd] = useState('');
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt(value));
  }, [value, focused]);
  const diff = value - savedValue;

  return (
    <div className="a-stat" style={{ '--sc': stat.color, '--si': stat.ink } as React.CSSProperties}>
      <div className="a-stat-top">
        <span className="a-stat-icon">
          <Icon name={stat.icon} />
        </span>
        <label htmlFor={id}>{stat.label}</label>
        {diff !== 0 && <span className="a-stat-diff">{diff > 0 ? '+' + fmt(diff) : '−' + fmt(-diff)}</span>}
      </div>
      <input
        id={id}
        className="a-stat-input"
        inputMode="numeric"
        value={text}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          setText(fmt(value));
        }}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parse(e.target.value));
        }}
      />
      <form
        className="a-stat-add"
        onSubmit={(e) => {
          e.preventDefault();
          const n = parse(add);
          if (n) onChange(value + n);
          setAdd('');
        }}
      >
        <input inputMode="numeric" value={add} onChange={(e) => setAdd(e.target.value)} placeholder="Add to total" aria-label={`Add to ${stat.label}`} />
        <button type="submit" disabled={!parse(add)} aria-label={`Add to ${stat.label}`}>
          <Icon name="add" />
        </button>
      </form>
    </div>
  );
}
