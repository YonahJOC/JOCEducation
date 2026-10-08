"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cryptoId, LOGO_URL } from '@/lib/lobby/config';
import { abbrMap, expandProgram } from '@/lib/lobby/parse';
import { addDays, dayKey, formatDateLong, formatTime, timeKey, zonedToInstant } from '@/lib/lobby/time';
import type { CounterKey, LobbyDoc, ManualProgram, Settings as S } from '@/lib/lobby/types';
import { api, errorText } from './api';
import { Impact } from './Impact';
import { ScreenPreview } from './Preview';
import { ProgramEditor, type EditorResult } from './ProgramEditor';
import { Programs, relativeDay } from './Programs';
import { Settings } from './Settings';
import { Button, Icon, useConfirm, useMedia, useToast } from './ui';
import { useDoc, type SaveState } from './useDoc';

/**
 * The lobby screen's admin panel.
 *
 * Lifted from the standalone project with its own CSS and its own layout
 * intact. What changed is the way in: it had a shared team passcode and its
 * own sign-in screen, and now it sits inside the console behind the `lobby`
 * permission, so there is no second secret for anybody to remember.
 */
export function App() {
  return <Shell />;
}

// ---------------- Main layout ----------------

type Page = 'programs' | 'impact' | 'settings' | 'preview';
const NAV: Array<{ id: Page; label: string; icon: string; mobileOnly?: boolean }> = [
  { id: 'programs', label: 'Programs', icon: 'event' },
  { id: 'impact', label: 'Impact', icon: 'volunteer_activism' },
  { id: 'settings', label: 'Screen', icon: 'tune' },
  { id: 'preview', label: 'Preview', icon: 'tv', mobileOnly: true },
];

const pageFromHash = (): Page => {
  // Rendered on the server first, where there is no location. The
  // hashchange effect below puts the real page in on arrival.
  if (typeof location === 'undefined') return 'programs';
  const h = location.hash.replace('#', '') as Page;
  return NAV.some((n) => n.id === h) ? h : 'programs';
};

interface EditorState {
  program: ManualProgram | null;
  isNew: boolean;
  date: string;
}

function Shell() {
  const { doc, loaded, loadError, saveState, mutate, refresh } = useDoc();
  const [page, setPage] = useState<Page>(pageFromHash);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draft, setDraft] = useState<ManualProgram | null>(null);
  const [counterDraft, setCounterDraft] = useState<Record<CounterKey, number> | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<Partial<S> | null>(null);
  const [previewAt, setPreviewAt] = useState<string>(''); // '' = live
  const wide = useMedia('(min-width: 1320px)');
  const toast = useToast();
  const confirm = useConfirm();

  const go = (p: Page) => {
    location.hash = p;
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const on = () => setPage(pageFromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    if (page === 'preview' && wide) go('programs');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, page]);

  // What the preview shows: saved data plus anything being edited right now
  const previewDoc: LobbyDoc = useMemo(() => {
    let d = doc;
    if (draft && editor) {
      const others = d.programs.filter((p) => p.id !== draft.id);
      d = { ...d, programs: draft.program.trim() || !editor.isNew ? [...others, draft] : others };
    }
    if (counterDraft) d = { ...d, counters: { ...d.counters, source: 'manual', values: counterDraft } };
    if (settingsDraft) d = { ...d, settings: { ...d.settings, ...settingsDraft } };
    return d;
  }, [doc, draft, editor, counterDraft, settingsDraft]);

  // While editing, the preview jumps to that program's day and time
  const previewNow = useMemo(() => {
    if (draft && editor) return zonedToInstant(draft.date, draft.allDay ? '09:00' : draft.start);
    if (previewAt) return zonedToInstant(previewAt.slice(0, 10), previewAt.slice(11, 16));
    return null;
  }, [draft, editor, previewAt]);
  const focusId = draft && editor && !draft.allDay ? 'm:' + draft.id : null;

  const openNew = (date?: string) => setEditor({ program: null, isNew: true, date: date || dayKey(new Date()) });
  const openEdit = (p: ManualProgram, asNew = false) => setEditor({ program: p, isNew: asNew, date: p.date });
  const closeEditor = useCallback(() => {
    setEditor(null);
    setDraft(null);
  }, []);

  async function saveProgram({ programs, weeks }: EditorResult): Promise<boolean> {
    const stamp = new Date().toISOString();
    const base = programs[0];
    const name = expandProgram(base.program, abbrMap(doc.settings.abbreviations));
    let list: ManualProgram[];
    if (editor?.isNew) {
      const seriesId = weeks > 1 ? cryptoId() : undefined;
      list = Array.from({ length: weeks }, (_, i) => ({
        ...base,
        id: i === 0 ? base.id : cryptoId(),
        seriesId,
        date: addDays(base.date, i * 7),
        createdAt: stamp,
        updatedAt: stamp,
      }));
    } else list = [{ ...base, updatedAt: stamp }];
    const ids = new Set(list.map((p) => p.id));
    const ok = await mutate((d) => ({ ...d, programs: [...d.programs.filter((p) => !ids.has(p.id)), ...list] }));
    if (ok) {
      const when = relativeDay(base.date, dayKey(new Date()));
      toast({
        kind: 'ok',
        text: editor?.isNew
          ? weeks > 1
            ? `Added “${name}” for ${weeks} weeks`
            : `Added “${name}” · ${when}`
          : `Saved “${name}”`,
      });
    } else toast({ kind: 'error', text: 'Couldn’t save. Check the connection and try again.' });
    return ok;
  }

  async function deleteFromEditor(p: ManualProgram) {
    const name = expandProgram(p.program, abbrMap(doc.settings.abbreviations));
    const answer = await confirm({ title: `Delete “${name}”?`, body: 'It will come off the lobby screen right away.', confirm: 'Delete', danger: true });
    if (answer !== 'confirm') return;
    const original = doc.programs.find((x) => x.id === p.id);
    const ok = await mutate((d) => ({ ...d, programs: d.programs.filter((x) => x.id !== p.id) }));
    if (ok) {
      closeEditor();
      toast({
        kind: 'ok',
        text: `Deleted “${name}”`,
        action: original ? { label: 'Undo', run: () => mutate((d) => ({ ...d, programs: [...d.programs, original] })) } : undefined,
      });
    } else toast({ kind: 'error', text: 'Couldn’t delete. Check the connection and try again.' });
  }

  if (!loaded) {
    return (
      <div className="a-boot">
        {loadError ? (
          <div className="a-boot-card">
            <Icon name="cloud_off" size={40} />
            <h2>Can’t reach the schedule</h2>
            <p>{errorText(loadError)}</p>
            <div className="a-btn-row">
              <Button kind="primary" icon="refresh" onClick={refresh}>
                Try again
              </Button>
              <Button kind="ghost" onClick={() => { location.href = "/admin"; }}>
                Back to the console
              </Button>
            </div>
          </div>
        ) : (
          <div className="a-spinner" role="status" aria-label="Loading" />
        )}
      </div>
    );
  }

  const preview = (
    <PreviewPanel
      doc={previewDoc}
      now={previewNow}
      focusId={focusId}
      editing={!!(draft && editor)}
      unsaved={!!(counterDraft || settingsDraft)}
      at={previewAt}
      setAt={setPreviewAt}
      clock24={previewDoc.settings.clock24}
    />
  );

  return (
    <div className={'a-app' + (wide ? ' is-wide' : '')}>
      <nav className="a-side" aria-label="Main">
        <div className="a-side-brand">
          <img src={LOGO_URL} alt="Just One Chesed" />
          <span>Lobby screen</span>
        </div>
        <ul>
          {NAV.filter((n) => !n.mobileOnly || !wide).map((n) => (
            <li key={n.id} className={n.mobileOnly ? 'a-only-narrow' : ''}>
              <a
                href={'#' + n.id}
                aria-current={page === n.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.id);
                }}
              >
                <Icon name={n.icon} fill={page === n.id} />
                <span>{n.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="a-side-foot">
          <a className="a-side-link" href="/lobby" target="_blank" rel="noopener">
            <Icon name="open_in_new" fill={false} />
            <span>Open the screen</span>
          </a>
          <a className="a-side-link" href="/admin">
            <Icon name="arrow_back" fill={false} />
            <span>Back to the console</span>
          </a>
        </div>
      </nav>

      <div className="a-topbar">
        <img src={LOGO_URL} alt="Just One Chesed" />
        <SaveBadge state={saveState} />
        <a className="a-iconbtn a-iconbtn-light" href="/admin" aria-label="Back to the console">
          <Icon name="arrow_back" fill={false} />
        </a>
      </div>

      <main className="a-main">
        <div className="a-main-status">
          <SaveBadge state={saveState} />
        </div>
        {page === 'programs' && <Programs doc={doc} mutate={mutate} onAdd={openNew} onEdit={openEdit} />}
        {page === 'impact' && <Impact doc={doc} mutate={mutate} onDraft={setCounterDraft} />}
        {page === 'settings' && <Settings doc={doc} mutate={mutate} onDraft={setSettingsDraft} />}
        {page === 'preview' && !wide && (
          <div className="a-page">
            <header className="a-page-head">
              <div>
                <h1>Preview</h1>
                <p>The lobby screen, live.</p>
              </div>
            </header>
            {preview}
          </div>
        )}
      </main>

      {wide && <aside className="a-preview-col">{preview}</aside>}

      {page === 'programs' && !editor && (
        <button type="button" className="a-fab" onClick={() => openNew()} aria-label="Add program">
          <Icon name="add" />
        </button>
      )}

      {editor && (
        <ProgramEditor
          key={(editor.program?.id || 'new') + editor.isNew}
          doc={doc}
          initial={editor.program}
          isNew={editor.isNew}
          defaultDate={editor.date}
          onDraft={setDraft}
          onSave={saveProgram}
          onDelete={deleteFromEditor}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map = {
    saved: { icon: 'cloud_done', text: 'All changes saved' },
    saving: { icon: 'progress_activity', text: 'Saving…' },
    error: { icon: 'cloud_off', text: 'Not saved' },
  }[state];
  return (
    <span className={'a-savestate a-savestate-' + state} role="status">
      <Icon name={map.icon} size={18} fill={false} />
      <span>{map.text}</span>
    </span>
  );
}

function PreviewPanel({
  doc,
  now,
  focusId,
  editing,
  unsaved,
  at,
  setAt,
  clock24,
}: {
  doc: LobbyDoc;
  now: Date | null;
  focusId: string | null;
  editing: boolean;
  unsaved: boolean;
  at: string;
  setAt: (v: string) => void;
  clock24: boolean;
}) {
  // Re-render each minute so "live" keeps up with the clock
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const shownAt = now ?? new Date();
  const pickerValue = at || dayKey(new Date()) + 'T' + timeKey(new Date());

  return (
    <section className="a-preview" aria-label="Screen preview">
      <header className="a-preview-head">
        <div>
          <h2>
            <span className={'a-live-dot' + (now || unsaved ? ' is-paused' : '')} aria-hidden="true" />
            {editing ? 'Previewing your program' : unsaved ? 'Previewing your changes' : now ? 'Preview at another time' : 'Live on the screen'}
          </h2>
          <p>
            {formatDateLong(shownAt)} · {formatTime(shownAt, clock24)}
          </p>
        </div>
        <a className="a-iconbtn a-iconbtn-ghost" href="/" target="_blank" rel="noopener" aria-label="Open the screen in a new tab" title="Open the screen">
          <Icon name="open_in_new" fill={false} />
        </a>
      </header>
      <ScreenPreview doc={doc} now={now} focusId={focusId} />
      {!editing && (
        <div className="a-preview-time">
          <label>
            <Icon name="history_toggle_off" fill={false} size={20} />
            <span>See it at</span>
            <input type="datetime-local" value={pickerValue} onChange={(e) => setAt(e.target.value)} aria-label="Preview date and time" />
          </label>
          {at && (
            <Button small kind="ghost" icon="restart_alt" onClick={() => setAt('')}>
              Back to now
            </Button>
          )}
        </div>
      )}
      {(editing || unsaved) && <p className="a-preview-note">Not live yet. Save to put it on the TVs.</p>}
    </section>
  );
}

