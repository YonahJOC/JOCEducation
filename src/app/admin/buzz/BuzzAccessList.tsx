"use client";

import { useMemo, useState, useTransition } from "react";
import { setBuzzAccess, inviteToBuzz, cancelBuzzInvite, editBuzzInvite } from "@/app/actions/buzz-access";
import { C, R, F, label, datum } from "@/lib/joc-tokens";

/**
 * The list, with a switch against each name.
 *
 * Everybody at JOC is shown rather than only the people who already have it,
 * because the question being asked at this screen is "give it to Yakir", and
 * a list you have to add somebody to before you can find them answers a
 * different question.
 */

export type Row = {
  id: string;
  name: string | null;
  email: string;
  /** Switched on by name, on this page. */
  added: boolean;
  /** The name of their admin type, when that is what carries it. */
  viaType: string | null;
  superAdmin: boolean;
};

export type Invite = { email: string; name: string | null };

export function BuzzAccessList({ rows, invites }: { rows: Row[]; invites: Invite[] }) {
  const [q, setQ] = useState("");
  const [waiting, setWaiting] = useState<Invite[]>(invites);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<{ id: string; text: string } | null>(null);
  const [, start] = useTransition();

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const withEdits = rows.map((r) => ({ ...r, added: edits[r.id] ?? r.added }));
    // Everybody who has it, at the top, then the rest alphabetically.
    withEdits.sort((a, b) => {
      const ap = a.added || a.viaType || a.superAdmin ? 0 : 1;
      const bp = b.added || b.viaType || b.superAdmin ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    });
    if (!needle) return withEdits;
    return withEdits.filter(
      (r) => (r.name ?? "").toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle),
    );
  }, [rows, edits, q]);

  const toggle = (r: Row, on: boolean) => {
    setEdits((e) => ({ ...e, [r.id]: on }));
    setError(null);
    start(async () => {
      const res = await setBuzzAccess(r.id, on);
      if (!res.ok) {
        // Put the switch back and say why, under that row.
        setEdits((e) => {
          const next = { ...e };
          delete next[r.id];
          return next;
        });
        setError({ id: r.id, text: res.error });
      }
    });
  };

  return (
    <div>
      {/* Somebody who has never signed in has no row to switch, so the way
          to give them it is their address. */}
      <form
        action={() => {
          const value = email.trim();
          if (!value) return;
          setAddError(null);
          start(async () => {
            const res = await inviteToBuzz(name, value);
            if (!res.ok) {
              setAddError(res.error);
              return;
            }
            const known = rows.find((r) => r.email.toLowerCase() === value.toLowerCase());
            if (known) setEdits((e) => ({ ...e, [known.id]: true }));
            else setWaiting((w) =>
              w.some((x) => x.email === value.toLowerCase())
                ? w
                : [...w, { email: value.toLowerCase(), name: name.trim() || null }],
            );
            setEmail("");
            setName("");
          });
        }}
        style={{
          display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Their name"
          style={{
            flex: "1 1 160px", maxWidth: "220px", boxSizing: "border-box",
            fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
            border: `1px solid ${C.hairline}`, borderRadius: "12px",
            padding: "11px 14px", minHeight: "46px",
          }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="someone@justonechesed.org"
          style={{
            flex: "1 1 240px", maxWidth: "320px", boxSizing: "border-box",
            fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
            border: `1px solid ${C.hairline}`, borderRadius: "12px",
            padding: "11px 14px", minHeight: "46px",
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: F.ui, fontSize: "15px", fontWeight: 700, color: C.white,
            backgroundColor: C.ink, border: "none", borderRadius: "12px",
            padding: "0 18px", minHeight: "46px", cursor: "pointer",
          }}
        >
          Give them the Buzz
        </button>
        {addError && (
          <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "12px 0 0" }}>
            {addError}
          </p>
        )}
      </form>

      {waiting.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ ...label, color: C.muted, margin: "0 0 8px" }}>
            Waiting for their first sign-in
          </p>
          <div style={{ display: "grid", gap: "6px" }}>
            {waiting.map((w) => (
              <WaitingRow
                key={w.email}
                invite={w}
                onSaved={(next) =>
                  setWaiting((list) =>
                    list.map((x) => (x.email === w.email ? next : x)),
                  )
                }
                onGone={() => setWaiting((list) => list.filter((x) => x.email !== w.email))}
                onRestore={() => setWaiting((list) => [...list, w])}
              />
            ))}
          </div>
          <p style={{
            fontFamily: F.read, fontSize: "14px", lineHeight: 1.55, color: C.muted,
            margin: "8px 0 0", maxWidth: "62ch",
          }}>
            They get it the first time they sign in, and move into the list below.
            Nothing is emailed to them — tell them the link yourself.
          </p>
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a name or email"
        style={{
          width: "100%", boxSizing: "border-box", maxWidth: "420px",
          fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
          border: `1px solid ${C.hairline}`, borderRadius: "12px",
          padding: "11px 14px", minHeight: "46px", marginBottom: "14px",
        }}
      />

      {shown.length === 0 ? (
        <p style={{ fontFamily: F.read, fontSize: "16px", color: C.muted, margin: 0 }}>
          Nobody matches that.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {shown.map((r) => {
            const has = r.added || Boolean(r.viaType) || r.superAdmin;
            const locked = r.superAdmin || Boolean(r.viaType);
            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: C.white, borderRadius: "14px",
                  border: `1px solid ${has ? C.hairline : "transparent"}`,
                  boxShadow: "0 1px 0 #E3E6EF",
                  padding: "13px 16px",
                  display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "100 1 200px", minWidth: 0 }}>
                  <p style={{
                    fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink,
                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.name ?? r.email}
                  </p>
                  <p style={{
                    ...datum, color: C.muted, margin: "2px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.name ? r.email : ""}
                    {r.superAdmin && (r.name ? " · SUPER ADMIN" : "SUPER ADMIN")}
                    {r.viaType && !r.superAdmin && ` · VIA ${r.viaType.toUpperCase()}`}
                  </p>
                  {error?.id === r.id && (
                    <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "6px 0 0" }}>
                      {error.text}
                    </p>
                  )}
                </div>

                {locked ? (
                  <span style={{
                    ...label, color: C.greenText, backgroundColor: C.greenTint,
                    borderRadius: R.chip, padding: "6px 10px", whiteSpace: "nowrap",
                  }}>
                    Has it
                  </span>
                ) : (
                  <Switch on={r.added} onChange={(on) => toggle(r, on)} name={r.name ?? r.email} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{
        fontFamily: F.read, fontSize: "14px", lineHeight: 1.6, color: C.muted,
        margin: "18px 0 0", maxWidth: "62ch",
      }}>
        Somebody whose admin type already carries the Buzz shows as{" "}
        <strong style={{ color: C.ink }}>Has it</strong> and cannot be switched off here — change
        it on their type, or change their type. School accounts are not listed: the Buzz is every
        school at once, so it is never theirs to see.
      </p>
    </div>
  );
}

/**
 * Somebody invited who has not signed in yet.
 *
 * Editable, because the only thing on file is what whoever added them typed,
 * and a typo in an address means an invite that is never redeemed by anybody.
 */
function WaitingRow({
  invite, onSaved, onGone, onRestore,
}: {
  invite: Invite;
  onSaved: (next: Invite) => void;
  onGone: () => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(invite.name ?? "");
  const [email, setEmail] = useState(invite.email);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  if (open) {
    return (
      <div style={{ backgroundColor: C.panel, borderRadius: "12px", padding: "12px 14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Their name"
            style={{ ...field, flex: "1 1 150px", maxWidth: "210px" }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="someone@justonechesed.org"
            style={{ ...field, flex: "1 1 220px", maxWidth: "300px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              fontFamily: F.ui, fontSize: "14px", fontWeight: 700, color: C.white,
              backgroundColor: C.ink, border: "none", borderRadius: R.chip,
              padding: "8px 14px", minHeight: "38px", cursor: "pointer",
            }}
            onClick={() => {
              setError(null);
              start(async () => {
                const res = await editBuzzInvite(invite.email, name, email);
                if (!res.ok) { setError(res.error); return; }
                // An address that already had an account is switched on and
                // the invite is spent, so it leaves this list either way.
                setOpen(false);
                onSaved({ name: name.trim() || null, email: email.trim().toLowerCase() });
              });
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setName(invite.name ?? ""); setEmail(invite.email); setOpen(false); setError(null); }}
            style={quietSmall}
          >
            Cancel
          </button>
          {error && <span style={{ ...label, color: C.orangeText }}>{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: C.panel, borderRadius: "12px", padding: "10px 14px",
      display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
    }}>
      <div style={{ flex: "100 1 200px", minWidth: 0 }}>
        <p style={{
          fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink, margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {invite.name ?? invite.email}
        </p>
        {invite.name && (
          <p style={{ ...label, color: C.muted, margin: "2px 0 0" }}>{invite.email}</p>
        )}
      </div>
      <button type="button" onClick={() => setOpen(true)} style={quietSmall}>Edit</button>
      <button
        type="button"
        onClick={() => {
          onGone();
          start(async () => {
            const res = await cancelBuzzInvite(invite.email);
            if (!res.ok) onRestore();
          });
        }}
        style={quietSmall}
      >
        Take it back
      </button>
    </div>
  );
}

const field: React.CSSProperties = {
  boxSizing: "border-box",
  fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px",
};

const quietSmall: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.muted,
  background: "none", border: "none", cursor: "pointer", minHeight: "32px",
};

/** A switch, because the answer is yes or no and there are forty of them. */
function Switch({
  on, onChange, name,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  name: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`The Buzz for ${name}`}
      onClick={() => onChange(!on)}
      style={{
        flex: "0 0 auto",
        display: "inline-flex", alignItems: "center", gap: "9px",
        fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
        color: on ? C.ink : C.muted,
        background: "none", border: "none", cursor: "pointer",
        padding: "6px 2px", minHeight: "40px",
      }}
    >
      <span style={{
        width: "42px", height: "24px", borderRadius: "999px", flex: "0 0 auto",
        backgroundColor: on ? C.blue : "#D7DBE6",
        position: "relative", transition: "background-color .15s",
      }}>
        <span style={{
          position: "absolute", top: "3px", left: on ? "21px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%",
          backgroundColor: C.white, transition: "left .15s",
          boxShadow: "0 1px 2px rgba(16,35,63,.3)",
        }} />
      </span>
      {on ? "Can see it" : "No"}
    </button>
  );
}
