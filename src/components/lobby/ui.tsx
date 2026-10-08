"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';

export function Icon({ name, fill = true, size, className = '' }: { name: string; fill?: boolean; size?: number; className?: string }) {
  return (
    <span
      className={'a-icon ' + className}
      aria-hidden="true"
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 600`, ...(size ? { fontSize: size } : {}) }}
    >
      {name}
    </span>
  );
}

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export function Button({
  kind = 'secondary',
  icon,
  children,
  small,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind; icon?: string; small?: boolean }) {
  return (
    <button type="button" className={`a-btn a-btn-${kind}${small ? ' a-btn-sm' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({ icon, label, kind = 'ghost', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; kind?: 'ghost' | 'danger' }) {
  return (
    <button type="button" className={`a-iconbtn a-iconbtn-${kind}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} fill={false} />
    </button>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className={'a-field' + (error ? ' has-error' : '')}>
      <label className="a-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <div className="a-field-error" role="alert">
          <Icon name="error" size={16} />
          {error}
        </div>
      ) : (
        hint && <div className="a-hint">{hint}</div>
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: string }>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="a-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={'a-seg-opt' + (value === o.value ? ' on' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={18} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button type="button" id={id} role="switch" aria-checked={checked} aria-label={label} className={'a-switch' + (checked ? ' on' : '')} onClick={() => onChange(!checked)}>
      <span className="a-switch-knob" />
    </button>
  );
}

export function Stepper({ value, min, max, onChange, label, unit }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string; unit?: (n: number) => string }) {
  return (
    <div className="a-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Fewer" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <Icon name="remove" />
      </button>
      <output aria-live="polite">
        <b>{value}</b>
        {unit && <span>{unit(value)}</span>}
      </output>
      <button type="button" aria-label="More" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Icon name="add" />
      </button>
    </div>
  );
}

export function Card({ title, icon, children, actions, className = '' }: { title?: string; icon?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={'a-card ' + className}>
      {(title || actions) && (
        <header className="a-card-head">
          {title && (
            <h2>
              {icon && <Icon name={icon} />}
              {title}
            </h2>
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

// ---- Toasts ----

interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error';
  action?: { label: string; run: () => void };
}
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = next.current++;
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.action ? 7000 : 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="a-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'a-toast a-toast-' + t.kind}>
            <Icon name={t.kind === 'ok' ? 'check_circle' : 'error'} />
            <span>{t.text}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.run();
                  setToasts((ts) => ts.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---- Confirm dialog ----

export interface ConfirmOpts {
  title: string;
  body?: ReactNode;
  confirm: string;
  danger?: boolean;
  /** Optional second choice, e.g. "Delete whole series" */
  alt?: string;
}
type ConfirmResult = 'confirm' | 'alt' | 'cancel';
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<ConfirmResult>>(async () => 'cancel');
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (r: ConfirmResult) => void }) | null>(null);
  const ask = useCallback((o: ConfirmOpts) => new Promise<ConfirmResult>((resolve) => setState({ ...o, resolve })), []);
  const close = (r: ConfirmResult) => {
    state?.resolve(r);
    setState(null);
  };
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!state) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close('cancel');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {state && (
        <div className="a-scrim a-scrim-center" onMouseDown={(e) => e.target === e.currentTarget && close('cancel')}>
          <div className="a-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
            <h2 id={titleId}>{state.title}</h2>
            {state.body && <div className="a-dialog-body">{state.body}</div>}
            <div className="a-dialog-actions">
              <Button kind="ghost" onClick={() => close('cancel')}>
                Cancel
              </Button>
              {state.alt && (
                <Button kind={state.danger ? 'danger-ghost' : 'secondary'} onClick={() => close('alt')}>
                  {state.alt}
                </Button>
              )}
              <button ref={confirmRef} type="button" className={'a-btn ' + (state.danger ? 'a-btn-danger' : 'a-btn-primary')} onClick={() => close('confirm')}>
                <span>{state.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useMedia(query: string): boolean {
  // No window on the server: assume the narrow layout and let the effect
  // widen it, which is the order that never flashes a desktop rail on a phone.
  const [match, setMatch] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}
