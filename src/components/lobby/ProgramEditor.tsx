"use client";

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cryptoId } from '@/lib/lobby/config';
import { VENUE_ICONS, VENUE_PALETTE, venueNames } from '@/lib/lobby/parse';
import { addDays, addMinutesHHMM, dayKey, formatDayKey, formatHHMM } from '@/lib/lobby/time';
import type { LobbyDoc, ManualProgram, VenueType } from '@/lib/lobby/types';
import { CardPreview } from './Preview';
import { Button, Field, Icon, Stepper, Switch, useConfirm } from './ui';

export interface EditorResult {
  programs: ManualProgram[];
  /** For a new program set to repeat: how many weeks */
  weeks: number;
}

const blank = (date: string): ManualProgram => ({
  id: cryptoId(),
  program: '',
  group: '',
  date,
  allDay: false,
  start: '10:00',
  end: '11:30',
  location: '',
  venue: 'center',
  notes: '',
  createdAt: '',
  updatedAt: '',
});

const DURATIONS = [60, 90, 120, 180];
const durLabel = (m: number) => (m % 60 ? `${Math.floor(m / 60)}½ hr` : `${m / 60} hr`);
const minutesBetween = (a: string, b: string) => {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return bh * 60 + bm - (ah * 60 + am);
};

export function ProgramEditor({
  doc,
  initial,
  isNew,
  defaultDate,
  onDraft,
  onSave,
  onDelete,
  onClose,
}: {
  doc: LobbyDoc;
  initial: ManualProgram | null;
  isNew: boolean;
  defaultDate: string;
  onDraft: (p: ManualProgram) => void;
  onSave: (r: EditorResult) => Promise<boolean>;
  onDelete: (p: ManualProgram) => void;
  onClose: () => void;
}) {
  const start = useMemo(() => initial ?? blank(defaultDate), [initial, defaultDate]);
  const [p, setP] = useState<ManualProgram>(start);
  const [repeat, setRepeat] = useState(false);
  const [weeks, setWeeks] = useState(4);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const firstField = useRef<HTMLInputElement>(null);
  const ids = { program: useId(), group: useId(), date: useId(), start: useId(), end: useId(), place: useId(), notes: useId(), allDay: useId() };

  const set = (patch: Partial<ManualProgram>) => setP((x) => ({ ...x, ...patch }));
  useEffect(() => onDraft(p), [p, onDraft]);
  useEffect(() => {
    firstField.current?.focus({ preventScroll: true });
  }, []);

  const dirty = JSON.stringify(p) !== JSON.stringify(start) || repeat;
  const today = dayKey(new Date());

  const errors = {
    program: !p.program.trim() ? 'Give the program a name.' : '',
    time: !p.allDay && p.end <= p.start ? 'The end time needs to be after the start time.' : '',
    place: p.venue !== 'center' && !p.location.trim() && p.venue === 'other' ? 'Where is it? A short place name is enough.' : '',
  };
  const valid = !errors.program && !errors.time && !errors.place;

  // Suggestions from what's been entered before
  const known = useMemo(() => {
    const programs = new Set<string>();
    const groups = new Set<string>();
    const places = new Map<string, VenueType>();
    for (const x of doc.programs) {
      programs.add(x.program);
      if (x.group) groups.add(x.group);
      if (x.location && x.venue !== 'auto' && x.venue !== 'center') places.set(x.location, x.venue);
    }
    for (const a of doc.settings.abbreviations) programs.add(a.full);
    return { programs: [...programs].sort(), groups: [...groups].sort(), places: [...places.entries()].slice(-6) };
  }, [doc]);

  async function close() {
    if (dirty && (await confirm({ title: 'Discard changes?', body: 'What you typed for this program won’t be saved.', confirm: 'Discard', danger: true })) !== 'confirm') return;
    onClose();
  }

  async function save() {
    setTried(true);
    if (!valid || saving) return;
    setSaving(true);
    const clean: ManualProgram = {
      ...p,
      program: p.program.trim(),
      group: p.group.trim(),
      location: p.venue === 'center' ? '' : p.location.trim(),
    };
    const ok = await onSave({ programs: [clean], weeks: isNew && repeat ? weeks : 1 });
    setSaving(false);
    if (ok) onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.a-dialog')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const names = venueNames(doc.settings.centerName);
  const venue = p.venue === 'auto' ? 'other' : p.venue;
  const duration = minutesBetween(p.start, p.end);
  const placeholder: Record<VenueType, string> = {
    center: '',
    shuk: 'e.g. Machane Yehuda',
    usa: 'e.g. Ramaz, New York',
    other: 'e.g. Shaare Zedek Hospital',
  };

  return (
    <div className="a-scrim" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="a-sheet" role="dialog" aria-modal="true" aria-label={isNew ? 'Add program' : 'Edit program'}>
        <header className="a-sheet-head">
          <div>
            <h2>{isNew ? 'Add a program' : 'Edit program'}</h2>
            <p>{p.allDay ? 'Shows as a yellow banner across the top of that day.' : 'This is how it will look on the lobby screen.'}</p>
          </div>
          <button type="button" className="a-iconbtn a-iconbtn-ghost" onClick={close} aria-label="Close">
            <Icon name="close" fill={false} />
          </button>
        </header>

        <div className="a-sheet-body">
          {p.allDay ? (
            <div className="a-banner-preview">
              <span className="ms">celebration</span>
              {p.program.trim() || 'Banner text'}
            </div>
          ) : (
            <CardPreview program={p} doc={doc} />
          )}

          <Field label={p.allDay ? 'Banner text' : 'Program'} htmlFor={ids.program} error={tried ? errors.program : ''}>
            <input
              ref={firstField}
              id={ids.program}
              className="a-input a-input-lg"
              value={p.program}
              onChange={(e) => set({ program: e.target.value })}
              placeholder={p.allDay ? 'e.g. Rosh Chodesh' : 'e.g. Pizza Making'}
              list={ids.program + '-list'}
              autoComplete="off"
              maxLength={120}
            />
            <datalist id={ids.program + '-list'}>
              {known.programs.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>

          {!p.allDay && (
            <Field label="Who it’s for" htmlFor={ids.group} hint="Leave empty to show “Open to all visitors”.">
              <input
                id={ids.group}
                className="a-input"
                value={p.group}
                onChange={(e) => set({ group: e.target.value })}
                placeholder="e.g. Ramaz 11th Grade"
                list={ids.group + '-list'}
                autoComplete="off"
                maxLength={160}
              />
              <datalist id={ids.group + '-list'}>
                {known.groups.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
          )}

          <div className="a-fieldset">
            <Field label="Date" htmlFor={ids.date}>
              <div className="a-date-row">
                <input id={ids.date} type="date" className="a-input" value={p.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
                <div className="a-quick">
                  <button type="button" className={p.date === today ? 'on' : ''} onClick={() => set({ date: today })}>
                    Today
                  </button>
                  <button type="button" className={p.date === addDays(today, 1) ? 'on' : ''} onClick={() => set({ date: addDays(today, 1) })}>
                    Tomorrow
                  </button>
                </div>
              </div>
              <div className="a-hint">{formatDayKey(p.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </Field>

            <div className="a-toggle-row">
              <label htmlFor={ids.allDay}>
                <b>All day</b>
                <span>A notice for the whole day, like a holiday or special event.</span>
              </label>
              <Switch id={ids.allDay} checked={p.allDay} onChange={(v) => set({ allDay: v })} label="All day" />
            </div>

            {!p.allDay && (
              <>
                <div className="a-time-row">
                  <Field label="Starts" htmlFor={ids.start}>
                    <input
                      id={ids.start}
                      type="time"
                      className="a-input"
                      value={p.start}
                      step={300}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        // Keep the same length when the start moves
                        set({ start: v, end: addMinutesHHMM(v, duration > 0 ? duration : 90) });
                      }}
                    />
                  </Field>
                  <Icon name="arrow_forward" className="a-time-arrow" fill={false} />
                  <Field label="Ends" htmlFor={ids.end}>
                    <input id={ids.end} type="time" className="a-input" value={p.end} step={300} onChange={(e) => e.target.value && set({ end: e.target.value })} />
                  </Field>
                </div>
                <div className="a-quick a-quick-wide" aria-label="Length">
                  {DURATIONS.map((m) => (
                    <button key={m} type="button" className={duration === m ? 'on' : ''} onClick={() => set({ end: addMinutesHHMM(p.start, m) })}>
                      {durLabel(m)}
                    </button>
                  ))}
                </div>
                {tried && errors.time ? (
                  <div className="a-field-error" role="alert">
                    <Icon name="error" size={16} />
                    {errors.time}
                  </div>
                ) : (
                  <div className="a-hint">
                    On screen: {formatHHMM(p.start, doc.settings.clock24)} – {formatHHMM(p.end, doc.settings.clock24)}
                  </div>
                )}
              </>
            )}
          </div>

          {!p.allDay && (
            <div className="a-field">
              <div className="a-label">Where</div>
              <div className="a-venues" role="radiogroup" aria-label="Where">
                {(['center', 'shuk', 'usa', 'other'] as VenueType[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={venue === v}
                    className={'a-venue' + (venue === v ? ' on' : '')}
                    style={{ '--vc': VENUE_PALETTE[v].color, '--vt': VENUE_PALETTE[v].tint } as React.CSSProperties}
                    onClick={() => set({ venue: v })}
                  >
                    <span className="a-venue-icon">
                      <Icon name={VENUE_ICONS[v]} />
                    </span>
                    <b>{names[v]}</b>
                  </button>
                ))}
              </div>
              {venue !== 'center' && (
                <div className="a-place">
                  <label className="a-label a-label-sub" htmlFor={ids.place}>
                    Place name <span>{venue === 'other' ? '' : '(optional)'}</span>
                  </label>
                  <input
                    id={ids.place}
                    className="a-input"
                    value={p.location}
                    onChange={(e) => set({ location: e.target.value })}
                    placeholder={placeholder[venue]}
                    maxLength={200}
                  />
                  {tried && errors.place ? (
                    <div className="a-field-error" role="alert">
                      <Icon name="error" size={16} />
                      {errors.place}
                    </div>
                  ) : (
                    <div className="a-hint">Only the part before the first comma is shown.</div>
                  )}
                  {known.places.filter(([, t]) => t === venue).length > 0 && (
                    <div className="a-quick">
                      {known.places
                        .filter(([, t]) => t === venue)
                        .map(([name]) => (
                          <button key={name} type="button" className={p.location === name ? 'on' : ''} onClick={() => set({ location: name })}>
                            {name.split(',')[0]}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isNew && (
            <div className="a-fieldset">
              <div className="a-toggle-row">
                <label>
                  <b>Repeat every week</b>
                  <span>Adds a copy on the same weekday, at the same time.</span>
                </label>
                <Switch checked={repeat} onChange={setRepeat} label="Repeat every week" />
              </div>
              {repeat && (
                <div className="a-repeat">
                  <Stepper value={weeks} min={2} max={26} onChange={setWeeks} label="Number of weeks" unit={() => 'weeks'} />
                  <span className="a-hint">
                    Last one: {formatDayKey(addDays(p.date, (weeks - 1) * 7), { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          )}

          <Field label="Notes for the team" htmlFor={ids.notes} hint="Only seen here. Never shown on the screen.">
            <textarea id={ids.notes} className="a-input a-textarea" value={p.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} maxLength={1000} placeholder="Contact person, what to prepare…" />
          </Field>
        </div>

        <footer className="a-sheet-foot">
          {!isNew && <Button kind="danger-ghost" icon="delete" onClick={() => onDelete(p)}>Delete</Button>}
          <span className="a-spacer" />
          <Button kind="ghost" onClick={close}>
            Cancel
          </Button>
          <Button kind="primary" icon={saving ? 'progress_activity' : 'check'} className={saving ? 'is-busy' : ''} onClick={save} disabled={saving}>
            {isNew ? (repeat ? `Add ${weeks} programs` : 'Add program') : 'Save changes'}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
