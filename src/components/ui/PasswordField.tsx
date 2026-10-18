"use client";

import { useId, useState } from "react";
import { C, F, R, HIT } from "@/lib/joc-tokens";

/**
 * A password box you can look at.
 *
 * Typing a password you cannot see, into a field that demands ten characters
 * and then tells you it doesn't match, is how people end up locked out of
 * their own account — and how an administrator setting somebody else's
 * password sends them one with a typo in it.
 *
 * So: a Show / Hide button inside the field. It starts hidden, because
 * somebody may be at a school with a class behind them; revealing is always
 * the person's own choice, never the default.
 *
 * The button is a real button — it announces itself to a screen reader, it
 * taps at 44px, and it never submits the form it sits in.
 */
export function PasswordField({
  name,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  required,
  minLength,
  disabled,
  id,
  style,
}: {
  name?: string;
  /** Leave unset for an uncontrolled field inside a plain <form>. */
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  id?: string;
  /** The caller's own input styling, so this drops into any form. */
  style?: React.CSSProperties;
}) {
  const [shown, setShown] = useState(false);
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <div style={{ position: "relative", display: "block" }}>
      <input
        id={fieldId}
        name={name}
        type={shown ? "text" : "password"}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
        style={{
          ...style,
          // Room for the button, so a long password never runs under it.
          paddingRight: "76px",
          boxSizing: "border-box",
          width: "100%",
        }}
      />

      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-controls={fieldId}
        aria-label={shown ? "Hide password" : "Show password"}
        style={{
          position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)",
          minHeight: HIT, minWidth: "64px", padding: "0 10px",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: 0, borderRadius: R.sm,
          fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
          color: C.blue, cursor: "pointer",
        }}
      >
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}
