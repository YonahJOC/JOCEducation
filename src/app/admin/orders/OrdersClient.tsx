"use client";

import { useState, useTransition } from "react";
import { R, C } from "@/lib/joc-tokens";
import { updateOrder } from "@/app/actions/orders";
import { PageIntro } from "@/components/admin/PageIntro";

const STATUSES = ["NEW", "QUOTED", "INVOICED", "FULFILLED", "CANCELLED"] as const;
const STATUS_LABEL: Record<string, string> = {
  NEW: "New", QUOTED: "Quoted", INVOICED: "Invoiced",
  FULFILLED: "Fulfilled", CANCELLED: "Cancelled",
};
const STATUS_COLOR: Record<string, string> = {
  NEW: "#FA912D", QUOTED: "#2C7AC9", INVOICED: "#2D46AF",
  FULFILLED: "#1D6B37", CANCELLED: "#7A8699",
};

export type OrderRow = {
  id: string;
  status: string;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  schoolName: string;
  address: string | null;
  poNumber: string | null;
  notes: string | null;
  response: string | null;
  subtotal: string;
  when: string;
  items: { name: string; unit: string; unitPrice: string; quantity: number }[];
};

export function OrdersClient({ orders, disabled }: { orders: OrderRow[]; disabled?: boolean }) {
  const waiting = orders.filter((o) => o.status === "NEW").length;

  return (
    <div>
      <PageIntro
        title="Orders"
        what={
          `Everything schools have ordered from the shop. ` +
          (waiting > 0 ? `${waiting} waiting to be quoted. ` : "Nothing waiting. ") +
          `Nothing is charged on the site — you confirm the total and invoice.`
        }
        steps={[
          "Open an order to see what they asked for and where it goes.",
          "Work out the real total including shipping, and write it in the box — that is what you told them.",
          "Press Quoted once you have told them, Invoiced when the invoice is out, Fulfilled when it has shipped or the download is released.",
          "“Reply by email” opens a message to whoever placed it.",
        ]}
        note="A school sees no charge and no payment screen. The order reaches you and then it is a conversation, which is how schools buy from JOC today."
      />

      {orders.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: `1px dashed ${C.hairline}`, borderRadius: "16px", padding: "44px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#4A5A74", margin: 0 }}>No orders yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, disabled }: { order: OrderRow; disabled?: boolean }) {
  const [open, setOpen] = useState(order.status === "NEW");
  const [status, setStatus] = useState(order.status);
  const [response, setResponse] = useState(order.response ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save(next?: string) {
    setMsg(null);
    const s = next ?? status;
    if (next) setStatus(next);
    start(async () => {
      const r = await updateOrder({ id: order.id, status: s, response });
      setMsg(r.ok ? "Saved." : r.error);
    });
  }

  return (
    <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "18px" }}>
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: R.chip,
            color: STATUS_COLOR[status], backgroundColor: `${STATUS_COLOR[status]}1a`,
            letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px",
          }}
        >
          {STATUS_LABEL[status]}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: C.ink, margin: 0 }}>
            {order.schoolName} — {order.subtotal}
          </p>
          <p style={{ fontSize: "13px", color: "#4A5A74", margin: "2px 0 0", wordBreak: "break-word" }}>
            {order.contactName} · {order.contactEmail}
            {order.phone ? ` · ${order.phone}` : ""}
            {order.poNumber ? ` · PO ${order.poNumber}` : ""} · {order.when}
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
        >
          {open ? "Hide" : "Open"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: "14px", borderTop: `1px solid ${C.hairline}`, paddingTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            {order.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px", color: C.ink }}>
                <span>{it.quantity} × {it.name}</span>
                <span style={{ color: "#4A5A74", whiteSpace: "nowrap" }}>{it.unitPrice} {it.unit}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.hairline}`, paddingTop: "6px", fontSize: "14px", fontWeight: 700, color: C.ink }}>
              <span>Subtotal</span>
              <span>{order.subtotal}</span>
            </div>
          </div>

          {order.address && (
            <Block label="Deliver to" text={order.address} />
          )}
          {order.notes && <Block label="Notes from the school" text={order.notes} />}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#4A5A74", marginBottom: "5px" }}>
              What you told them (shipping, final total, invoice number)
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={2}
              disabled={disabled}
              style={{ width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink, backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "10px", padding: "10px 12px", resize: "vertical", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => save(s)}
                disabled={disabled || pending}
                style={{
                  fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
                  padding: "8px 14px", minHeight: "40px", borderRadius: R.chip,
                  border: status === s ? `1.5px solid ${STATUS_COLOR[s]}` : `1px solid ${C.hairline}`,
                  backgroundColor: status === s ? `${STATUS_COLOR[s]}14` : "#fff",
                  color: status === s ? STATUS_COLOR[s] : "#4A5A74",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            <a
              href={`mailto:${order.contactEmail}?subject=${encodeURIComponent(`Your JOC order — ${order.schoolName}`)}`}
              style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 600, color: C.blue, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
            >
              Reply by email
            </a>
          </div>

          {msg && (
            <p style={{ fontSize: "13px", color: msg === "Saved." ? "#1D6B37" : C.redText, margin: "10px 0 0" }}>{msg}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "#4A5A74", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: "14px", color: C.ink, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap", backgroundColor: "#FBF9F4", borderRadius: "10px", padding: "10px 12px" }}>
        {text}
      </p>
    </div>
  );
}
