"use client";

import { useMemo, useState } from 'react';
import { cryptoId } from '@/lib/lobby/config';
import { manualToEvent } from '@/lib/lobby/events';
import { abbrMap, expandProgram, venueInfo } from '@/lib/lobby/parse';
import { addDays, dayKey, daysBetween, dayNumber, formatDayKey, formatHHMM } from '@/lib/lobby/time';
import type { LobbyDoc, ManualProgram } from '@/lib/lobby/types';
import { Button, Icon, IconButton, Segmented, useConfirm, useToast } from './ui';
import type { Mutate } from './useDoc';

export function relativeDay(key: string, today: string): string {
  const d = daysBetween(today, key);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1 && d < 7) return formatDayKey(key, { weekday: 'long' });
  return formatDayKey(key, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function Programs({
  doc,
  mutate,
  onAdd,
  onEdit,
}: {
  doc: LobbyDoc;
  mutate: Mutate;
  onAdd: (date?: string) => void;
  onEdit: (p: ManualProgram, asNew?: boolean) => void;
}) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [q, setQ] = useState('');
  const toast = useToast();
  const confirm = useConfirm();
  const now = new Date();
  const today = dayKey(now);
  const clock24 = doc.settings.clock24;
  const abbr = useMemo(() => abbrMap(doc.settings.abbreviations), [doc.settings.abbreviations]);

  const { groups, counts } = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = (p: ManualProgram) =>
      !query || [p.program, p.group, p.location, p.notes].some((s) => s.toLowerCase().includes(query));
    const upcoming = doc.programs.filter((p) => p.date >= today);
    const past = doc.programs.filter((p) => p.date < today);
    const list = (tab === 'upcoming' ? upcoming : past).filter(match);
    const sorted = [...list].sort((a, b) => {
      const byDate = tab === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      return byDate || Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start) || a.program.localeCompare(b.program);
    });
    const map = new Map<string, ManualProgram[]>();
    for (const p of sorted) map.set(p.date, [...(map.get(p.date) || []), p]);
    return { groups: [...map.entries()], counts: { upcoming: upcoming.length, past: past.length } };
  }, [doc.programs, tab, q, today]);

  async function remove(p: ManualProgram) {
    const series = p.seriesId ? doc.programs.filter((x) => x.seriesId === p.seriesId && x.date >= p.date) : [];
    const answer = await confirm({
      title: `Delete “${expandProgram(p.program, abbr)}”?`,
      body:
        series.length > 1
          ? `This one repeats weekly. You can delete just ${formatDayKey(p.date, { weekday: 'long', month: 'short', day: 'numeric' })}, or it and the ${series.length - 1} after it.`
          : 'It will come off the lobby screen right away.',
      confirm: series.length > 1 ? 'Delete this one' : 'Delete',
      alt: series.length > 1 ? `Delete all ${series.length}` : undefined,
      danger: true,
    });
    if (answer === 'cancel') return;
    const ids = new Set(answer === 'alt' ? series.map((x) => x.id) : [p.id]);
    const removed = doc.programs.filter((x) => ids.has(x.id));
    const ok = await mutate((d) => ({ ...d, programs: d.programs.filter((x) => !ids.has(x.id)) }));
    if (ok)
      toast({
        kind: 'ok',
        text: ids.size > 1 ? `Deleted ${ids.size} programs` : `Deleted “${expandProgram(p.program, abbr)}”`,
        action: {
          label: 'Undo',
          run: () => mutate((d) => ({ ...d, programs: [...d.programs, ...removed] })),
        },
      });
    else toast({ kind: 'error', text: 'Couldn’t delete. Check the connection and try again.' });
  }

  function duplicate(p: ManualProgram) {
    const copy: ManualProgram = { ...p, id: cryptoId(), seriesId: undefined, date: addDays(p.date, 7), createdAt: '', updatedAt: '' };
    onEdit(copy, true);
  }

  return (
    <div className="a-page">
      <header className="a-page-head">
        <div>
          <h1>Programs</h1>
          <p>Everything on the lobby screen. Changes reach the TVs within a minute.</p>
        </div>
        <Button kind="primary" icon="add" onClick={() => onAdd()}>
          Add program
        </Button>
      </header>

      <div className="a-toolbar">
        <Segmented
          label="Which programs"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: `Upcoming · ${counts.upcoming}` },
            { value: 'past', label: `Past · ${counts.past}` },
          ]}
        />
        <label className="a-search">
          <Icon name="search" fill={false} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search programs, groups, places" aria-label="Search programs" />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => setQ('')}>
              <Icon name="close" fill={false} size={18} />
            </button>
          )}
        </label>
      </div>

      {groups.length === 0 ? (
        <EmptyState tab={tab} searching={!!q.trim()} onAdd={() => onAdd()} />
      ) : (
        <div className="a-days">
          {groups.map(([date, items]) => (
            <section key={date} className={'a-day' + (date === today ? ' is-today' : '')} aria-label={relativeDay(date, today)}>
              <header className="a-day-head">
                <div className="a-daybadge">
                  <span>{formatDayKey(date, { weekday: 'short' })}</span>
                  <b>{dayNumber(date)}</b>
                  <span>{formatDayKey(date, { month: 'short' })}</span>
                </div>
                <div className="a-day-title">
                  <h3>{relativeDay(date, today)}</h3>
                  <span>
                    {daysBetween(today, date) > 1 && daysBetween(today, date) < 7 ? formatDayKey(date, { month: 'long', day: 'numeric' }) + ' · ' : ''}
                    {items.length} {items.length === 1 ? 'program' : 'programs'}
                  </span>
                </div>
                {tab === 'upcoming' && (
                  <Button kind="ghost" small icon="add" onClick={() => onAdd(date)} aria-label={`Add a program on ${relativeDay(date, today)}`}>
                    Add
                  </Button>
                )}
              </header>
              <ul className="a-list">
                {items.map((p) => {
                  const ev = manualToEvent(p);
                  const live = !p.allDay && ev.start <= now && ev.end > now;
                  const ended = ev.end <= now;
                  const v = venueInfo(p.location, p.venue, doc.settings);
                  return (
                    <li key={p.id} className={'a-item' + (ended ? ' is-ended' : '') + (live ? ' is-live' : '')}>
                      <button type="button" className="a-item-main" onClick={() => onEdit(p)} aria-label={`Edit ${p.program}`}>
                        {p.allDay ? (
                          <span className="a-time a-time-allday">
                            <Icon name="celebration" size={18} />
                            All day
                          </span>
                        ) : (
                          <span className="a-time">
                            <b>{formatHHMM(p.start, clock24)}</b>
                            <span>{formatHHMM(p.end, clock24)}</span>
                          </span>
                        )}
                        <span className="a-item-text">
                          <span className="a-item-title">
                            {expandProgram(p.program, abbr)}
                            {live && <span className="a-pill a-pill-live">On screen now</span>}
                            {ended && date === today && <span className="a-pill">Ended</span>}
                          </span>
                          <span className="a-item-sub">
                            {p.allDay ? 'Banner across the top of the day' : p.group || <i>Open to all visitors</i>}
                            {p.seriesId && (
                              <span className="a-meta" title="Repeats weekly">
                                <Icon name="repeat" size={16} fill={false} />
                                Weekly
                              </span>
                            )}
                            {p.notes && (
                              <span className="a-meta" title={p.notes}>
                                <Icon name="sticky_note_2" size={16} fill={false} />
                                Note
                              </span>
                            )}
                          </span>
                        </span>
                        {!p.allDay && (
                          <span className="a-chip" style={{ background: v.tint, color: v.color }}>
                            <Icon name={v.icon} size={20} />
                            {v.chip}
                          </span>
                        )}
                      </button>
                      <div className="a-item-actions">
                        <IconButton icon="content_copy" label="Duplicate to next week" onClick={() => duplicate(p)} />
                        <IconButton icon="delete" label="Delete" kind="danger" onClick={() => remove(p)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab, searching, onAdd }: { tab: string; searching: boolean; onAdd: () => void }) {
  if (searching)
    return (
      <div className="a-empty">
        <div className="a-empty-art">
          <Icon name="search" />
        </div>
        <h3>Nothing matches that search</h3>
        <p>Try the program name, the group, or a place.</p>
      </div>
    );
  if (tab === 'past')
    return (
      <div className="a-empty">
        <div className="a-empty-art">
          <Icon name="history" />
        </div>
        <h3>Past programs will collect here</h3>
        <p>Once a day is over, its programs move to this tab.</p>
      </div>
    );
  return (
    <div className="a-empty">
      <div className="a-empty-art">
        <Icon name="calendar_add_on" />
      </div>
      <h3>Put the first program on the screen</h3>
      <p>Add what’s happening at JOC. It shows on every lobby TV within a minute.</p>
      <Button kind="primary" icon="add" onClick={onAdd}>
        Add program
      </Button>
    </div>
  );
}
