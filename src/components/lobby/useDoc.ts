"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyDoc } from '@/lib/lobby/config';
import type { LobbyDoc } from '@/lib/lobby/types';
import { api, ApiError } from './api';

export type SaveState = 'saved' | 'saving' | 'error';
export type Mutate = (op: (d: LobbyDoc) => LobbyDoc) => Promise<boolean>;

/**
 * The admin's copy of the document. Edits show at once and save in the background, one at a time.
 * Each edit is a function, so if someone else saved first it is simply re-applied to their newer copy.
 */
/**
 * No passcode and no sign-out: the console signed this person in, and the
 * server checks the `lobby` permission on every call. Losing it mid-session
 * shows the same "can't reach the schedule" panel as any other refusal,
 * which is the honest description of what has happened.
 */
export function useDoc() {
  const [doc, setDoc] = useState<LobbyDoc>(emptyDoc);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const server = useRef<LobbyDoc>(emptyDoc());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  const refresh = useCallback(async () => {
    if (pending.current) return; // never overwrite an edit that's on its way
    try {
      const d = await api.getDoc();
      server.current = d;
      if (!pending.current) setDoc(d);
      setLoaded(true);
      setLoadError(null);
    } catch (err) {
      setLoadError(err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const mutate: Mutate = useCallback(
    (op) => {
      setDoc((d) => op(d));
      pending.current++;
      setSaveState('saving');
      const run = async (): Promise<boolean> => {
        try {
          let base = server.current;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const saved = await api.putDoc(base.version, op(base));
              server.current = saved;
              return true;
            } catch (err) {
              if (err instanceof ApiError && err.status === 409 && err.doc) {
                base = err.doc;
                server.current = err.doc;
                continue;
              }
              throw err;
            }
          }
          throw new ApiError('conflict', 409);
        } catch {
          return false;
        }
      };
      const p = queue.current.then(run);
      queue.current = p;
      return p.then((ok) => {
        pending.current--;
        if (!pending.current) {
          setDoc(server.current); // settle on exactly what the server holds
          setSaveState(ok ? 'saved' : 'error');
        } else if (!ok) setSaveState('error');
        return ok;
      });
    },
    [],
  );

  return { doc, loaded, loadError, saveState, mutate, refresh };
}
