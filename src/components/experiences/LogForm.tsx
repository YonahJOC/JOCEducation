"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { logExperience, type LogExperienceResult } from "@/app/actions/experiences";
import {
  NEW_CLIENT, ACTIVITY_TYPES, TYPE_LABEL, summaryLine, takesGroupSize, todayIso,
  type ActivityType,
} from "@/lib/experiences";
import { C, R, F, field, fieldLabel, primaryButton, textButton, ROW_SHADOW } from "@/lib/joc-tokens";

/**
 * "Log an interaction" — the Experiences department's School Update Form.
 *
 * Compact, because it sits above the feed rather than on a page of its own:
 * the department writes something down several times a day from a desk, not
 * once a week from a car park. Same rules underneath — pick a client or type
 * a new one, say how, say when, say what.
 *
 * Summary is optional. "Call with the Cohens" says nothing that the type and
 * the client have not already said, so a blank one is filled in from those,
 * and the placeholder shows exactly what it will be.
 */
export function LogForm(props: {
  clients: { id: string; name: string }[];
  /** On a client's own card: the client is already chosen. */
  preset?: { id: string; name: string } | null;
  myName: string;
}) {
  // useActionState has no reset, so "Log another" remounts the form by key.
  const [round, setRound] = useState(0);
  return <Inner key={round} {...props} again={() => setRound((n) => n + 1)} />;
}

function Inner({
  clients, preset = null, myName, again,
}: {
  clients: { id: string; name: string }[];
  preset?: { id: string; name: string } | null;
  myName: string;
  again: () => void;
}) {
  const [result, action, pending] = useActionState<LogExperienceResult | null, FormData>(logExperience, null);
  const [type, setType] = useState<ActivityType>("CALL");
  const [clientId, setClientId] = useState(preset?.id ?? "");
  const [newName, setNewName] = useState("");
  const today = todayIso(new Date());

  const naming = clientId === NEW_CLIENT;
  const clientName = preset?.name ?? (naming ? newName : clients.find((c) => c.id === clientId)?.name ?? "");

  if (result?.ok) {
    return (
      <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px" }}>
        <p style={{ fontFamily: F.read, fontSize: "16px", color: C.ink, margin: 0, flex: "1 1 240px" }}>
          <span aria-hidden="true" style={{ color: C.greenText, fontWeight: 700 }}>✓ </span>
          Saved to{" "}
          {preset ? (
            <strong>{result.clientName}</strong>
          ) : (
            <Link href={`/admin/experiences/clients/${result.clientId}`} style={{ color: C.blue, fontWeight: 600 }}>
              {result.clientName}
            </Link>
          )}
          .{result.newClient ? " They’re new on the client list — add their details when you can." : ""}
        </p>
        <button type="button" onClick={again} style={{ ...primaryButton, cursor: "pointer" }}>
          Log another
        </button>
      </div>
    );
  }

  return (
    <form action={action} style={{ ...card, display: "grid", gap: "14px" }}>
      <input type="hidden" name="type" value={type} />

      {preset ? (
        <input type="hidden" name="clientId" value={preset.id} />
      ) : (
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label>
            <span style={fieldLabel}>Client</span>
            <select
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={field}
            >
              <option value="">Pick a client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value={NEW_CLIENT}>New client…</option>
            </select>
          </label>
          {naming && (
            <label>
              <span style={fieldLabel}>New client&rsquo;s name</span>
              <input
                name="newClientName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="The Cohen family"
                autoFocus
                style={field}
              />
            </label>
          )}
        </div>
      )}

      <div>
        <span style={fieldLabel}>What happened</span>
        <div role="group" aria-label="What happened" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {ACTIVITY_TYPES.map((t) => {
            const on = type === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setType(t)}
                style={{
                  fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                  color: on ? C.white : C.ink,
                  backgroundColor: on ? C.ink : C.white,
                  border: `1.5px solid ${on ? C.ink : C.hairline}`,
                  borderRadius: R.chip, padding: "0 14px", minHeight: "40px", cursor: "pointer",
                }}
              >
                {TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <label>
          <span style={fieldLabel}>Date</span>
          <input type="date" name="when" defaultValue={today} style={field} />
        </label>
        <label>
          <span style={fieldLabel}>Time (optional)</span>
          <input type="time" name="time" style={field} />
        </label>
        {takesGroupSize(type) && (
          <label>
            <span style={fieldLabel}>Group size</span>
            <input type="number" name="groupSize" min="1" inputMode="numeric" placeholder="Roughly" style={field} />
          </label>
        )}
      </div>

      <label>
        <span style={fieldLabel}>Summary</span>
        <input
          name="summary"
          maxLength={200}
          placeholder={summaryLine(type, clientName || "the client")}
          style={field}
        />
      </label>

      <label>
        <span style={fieldLabel}>Detail</span>
        <textarea
          name="detail"
          rows={3}
          style={{ ...field, resize: "vertical", fontFamily: F.read, fontSize: "16px", lineHeight: 1.5 }}
        />
      </label>

      {result && !result.ok && (
        <p role="alert" style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: 0 }}>
          {result.error}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending}
          style={{ ...primaryButton, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <span style={{ fontFamily: F.read, fontSize: "14px", color: C.muted }}>As {myName}</span>
        {!preset && (
          <Link href="/admin/experiences/clients" style={{ ...textButton, marginLeft: "auto", display: "inline-flex", alignItems: "center" }}>
            All clients
          </Link>
        )}
      </div>
    </form>
  );
}

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: R.row, padding: "18px 18px",
  boxShadow: ROW_SHADOW,
};
