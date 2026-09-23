"use client";

import { useState, useTransition } from "react";
import { C } from "@/lib/joc-tokens";
import { placeOrder } from "@/app/actions/orders";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14.5px", color: C.ink, backgroundColor: "#fff",
  border: "1px solid rgba(16,35,63,.18)", borderRadius: "10px",
  padding: "11px 13px", minHeight: "44px", outline: "none",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12.5px", fontWeight: 600,
  color: "#4A5A74", marginBottom: "5px",
};

/**
 * The order itself.
 *
 * Nothing is charged. The order is stored so JOC can see it, quote shipping
 * and invoice — which is how a school buys from JOC today. The button used to
 * open a mail client, which leaves no record and fails outright on a machine
 * with no mail client set up.
 */
export function OrderForm({
  items, subtotal, needsAddress, onPlaced,
}: {
  items: { productId: string; quantity: number }[];
  /** Whole dollars, for display only — the server reprices from the catalogue. */
  subtotal: number;
  needsAddress: boolean;
  onPlaced: () => void;
}) {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ emailed: boolean } | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await placeOrder({
        items, contactName, contactEmail, schoolName,
        phone, address, poNumber, notes,
      });
      if (r.ok) { setDone({ emailed: r.emailed }); onPlaced(); }
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(27,127,75,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "22px" }}>✓</div>
        <h3 style={{ fontWeight: 800, fontSize: "19px", color: C.ink, margin: "0 0 8px" }}>Order received</h3>
        <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: 0 }}>
          Nothing has been charged. JOC will confirm the total{needsAddress ? ", including shipping," : ""}{" "}
          and arrange the invoice.
          {done.emailed
            ? " A copy is in your inbox."
            : " (No confirmation email was sent — JOC has not switched on mail yet, but the order is safely recorded.)"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "#4A5A74", lineHeight: 1.55, margin: 0 }}>
        Card payment is not switched on yet. Send the order and JOC will confirm the total
        {needsAddress ? ", including shipping," : ""} and invoice your school.
      </p>

      <div>
        <label style={label}>Your name</label>
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} required style={field} />
      </div>
      <div>
        <label style={label}>Email</label>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required style={field} />
      </div>
      <div>
        <label style={label}>School</label>
        <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required style={field} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        <div>
          <label style={label}>Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={field} />
        </div>
        <div>
          <label style={label}>PO number (optional)</label>
          <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} style={field} />
        </div>
      </div>

      {needsAddress && (
        <div>
          <label style={label}>Delivery address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ ...field, resize: "vertical" }} />
        </div>
      )}

      <div>
        <label style={label}>Anything we should know? (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...field, resize: "vertical" }} />
      </div>

      {error && <p style={{ fontSize: "13.5px", color: C.redText, margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%", fontFamily: "var(--font-outfit)", backgroundColor: "#FA912D",
          color: C.ink, fontWeight: 700, fontSize: "15px", borderRadius: "12px",
          padding: "15px", minHeight: "50px", border: "none",
          cursor: pending ? "wait" : "pointer", opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Sending…" : `Send this order — $${subtotal}`}
      </button>
      <p style={{ fontSize: "12px", color: "#4A5A74", textAlign: "center", margin: 0 }}>
        Nothing is charged now.
      </p>
    </form>
  );
}
