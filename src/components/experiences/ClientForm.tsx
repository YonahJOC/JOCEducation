"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveClient, type SaveClientResult } from "@/app/actions/experiences";
import { CLIENT_KINDS, CLIENT_STATUSES, STATUS_LABEL } from "@/lib/experiences";
import { C, F, field, fieldLabel, primaryButton, textButton } from "@/lib/joc-tokens";

/**
 * Add a client, or change one.
 *
 * One form for both, because they are the same fields and a second form is a
 * second place for them to drift apart. An id means change; no id means add.
 * Archiving is a tickbox on the change form only — a client nobody has added
 * yet has nothing to archive.
 */

export type ClientValues = {
  id: string;
  name: string;
  kind: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  ownerId: string | null;
  archived: boolean;
};

export function ClientForm(props: {
  client?: ClientValues | null;
  owners: { id: string; name: string }[];
  /** Who a new client belongs to unless somebody says otherwise. */
  defaultOwnerId?: string | null;
}) {
  // useActionState has no reset, so "Add another" remounts the form by key.
  const [round, setRound] = useState(0);
  return <Inner key={round} {...props} again={() => setRound((n) => n + 1)} />;
}

function Inner({
  client = null, owners, defaultOwnerId = null, again,
}: {
  client?: ClientValues | null;
  owners: { id: string; name: string }[];
  defaultOwnerId?: string | null;
  again: () => void;
}) {
  const [result, action, pending] = useActionState<SaveClientResult | null, FormData>(saveClient, null);

  if (result?.ok && result.created) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px" }}>
        <p style={{ fontFamily: F.read, fontSize: "16px", color: C.ink, margin: 0 }}>
          <span aria-hidden="true" style={{ color: C.greenText, fontWeight: 700 }}>✓ </span>
          <Link href={`/admin/experiences/clients/${result.id}`} style={{ color: C.blue, fontWeight: 600 }}>
            {result.name}
          </Link>{" "}
          is on the list.
        </p>
        <button type="button" onClick={again} style={{ ...textButton }}>Add another</button>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "grid", gap: "12px" }}>
      {client && <input type="hidden" name="id" value={client.id} />}

      <div style={grid}>
        <label>
          <span style={fieldLabel}>Name</span>
          <input name="name" required maxLength={120} defaultValue={client?.name ?? ""} style={field} />
        </label>
        <label>
          <span style={fieldLabel}>Kind of group</span>
          {/* Suggestions, not a list: a group that fits none of them is still a group. */}
          <input
            name="kind"
            list="experience-kinds"
            maxLength={60}
            defaultValue={client?.kind ?? ""}
            placeholder="Family, tour group…"
            style={field}
          />
          <datalist id="experience-kinds">
            {CLIENT_KINDS.map((k) => <option key={k} value={k} />)}
          </datalist>
        </label>
        <label>
          <span style={fieldLabel}>Status</span>
          <select name="status" defaultValue={client?.status ?? "LEAD"} style={field}>
            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label>
          <span style={fieldLabel}>Looked after by</span>
          <select name="ownerId" defaultValue={client ? (client.ownerId ?? "") : (defaultOwnerId ?? "")} style={field}>
            <option value="">Nobody yet</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
      </div>

      <div style={grid}>
        <label>
          <span style={fieldLabel}>Contact person</span>
          <input name="contactName" maxLength={120} defaultValue={client?.contactName ?? ""} style={field} />
        </label>
        <label>
          <span style={fieldLabel}>Email</span>
          <input name="email" type="email" maxLength={160} defaultValue={client?.email ?? ""} style={field} />
        </label>
        <label>
          <span style={fieldLabel}>Phone</span>
          <input name="phone" type="tel" maxLength={40} defaultValue={client?.phone ?? ""} style={field} />
        </label>
      </div>

      <label>
        <span style={fieldLabel}>Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ""}
          style={{ ...field, resize: "vertical", fontFamily: F.read, fontSize: "16px", lineHeight: 1.5 }}
        />
      </label>

      {client && (
        <label style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" name="archived" defaultChecked={client.archived} style={{ width: "18px", height: "18px" }} />
          <span style={{ fontFamily: F.ui, fontSize: "15px", color: C.ink }}>
            Archived — off the client list and the log form, history kept
          </span>
        </label>
      )}

      {result && !result.ok && (
        <p role="alert" style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: 0 }}>
          {result.error}
        </p>
      )}
      {result?.ok && !result.created && (
        <p role="status" style={{ fontFamily: F.read, fontSize: "15px", color: C.greenText, margin: 0 }}>
          Saved.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          style={{ ...primaryButton, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Saving…" : client ? "Save changes" : "Add client"}
        </button>
      </div>
    </form>
  );
}

const grid: React.CSSProperties = {
  display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
};
