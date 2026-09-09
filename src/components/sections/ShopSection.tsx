"use client";
import { useState } from "react";

const PRODUCTS = [
  { id: "1", name: "Kindness Booth Kit", detail: "Full setup for a JOC Kindness Booth event", price: 249 },
  { id: "2", name: "Class Chesed Poster Pack", detail: "Set of 8 classroom-ready posters", price: 38 },
  { id: "3", name: "Grade Starter Bundle", detail: "Everything for a Grade Chesed Challenge launch", price: 420 },
  { id: "4", name: "Chesed Journals 30pk", detail: "Student reflection journals, one class set", price: 95 },
];

export function ShopSection() {
  const [cart, setCart] = useState<Record<string, boolean>>({});

  return (
    <section style={{ padding: "66px 26px 20px", maxWidth: "1280px", margin: "0 auto" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>05 — SCHOOL SHOP</p>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "28px" }}>
        Physical materials for your school.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))", gap: "18px" }}>
        {PRODUCTS.map((p) => (
          <div key={p.id} style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden" }}>
            {/* Image slot */}
            <div style={{ aspectRatio: "1", backgroundColor: "#F4F7FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "12px", color: "rgba(16,35,63,.35)", fontWeight: 500 }}>Photo coming soon</span>
            </div>
            <div style={{ padding: "20px" }}>
              <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#10233F", marginBottom: "4px" }}>{p.name}</h3>
              <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.62)", marginBottom: "14px" }}>{p.detail}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "18px", color: "#10233F" }}>${p.price}</span>
                <button
                  onClick={() => setCart({ ...cart, [p.id]: true })}
                  style={{
                    fontWeight: 700, fontSize: "13.5px", padding: "9px 18px", borderRadius: "9999px", border: "none", cursor: cart[p.id] ? "default" : "pointer",
                    backgroundColor: cart[p.id] ? "#10233F" : "#FA912D",
                    color: cart[p.id] ? "#fff" : "#10233F",
                  }}
                >
                  {cart[p.id] ? "Added ✓" : "Add"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: "16px", fontSize: "13.5px", color: "rgba(16,35,63,.55)" }}>
        Need to pay by purchase order? <a href="mailto:education@justonechesed.org" style={{ color: "#2D46AF" }}>Contact us</a> and we'll send an invoice.
      </p>
    </section>
  );
}
