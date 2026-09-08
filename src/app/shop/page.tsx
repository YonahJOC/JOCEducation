"use client";

import Link from "next/link";
import { useState } from "react";

const PRODUCTS = [
  { id: "1", name: "Kindness Booth Kit", category: "Events", detail: "Complete setup for a JOC Kindness Booth event — branded tablecloth, signage, activity cards, and a facilitator guide.", price: 249, badge: "Most popular" },
  { id: "2", name: "Class Chesed Poster Pack", category: "Classroom", detail: "Set of 8 classroom-ready posters covering major chesed themes. 18×24\", lamination-ready.", price: 38, badge: null },
  { id: "3", name: "Grade Starter Bundle", category: "Programs", detail: "Everything you need to launch a Grade Chesed Challenge — facilitator guides, parent letters, student journals, and tracker sheets.", price: 420, badge: "Best value" },
  { id: "4", name: "Chesed Journals 30-pack", category: "Classroom", detail: "Student reflection journals, one class set. 64 pages each, with weekly chesed prompts and a gratitude section.", price: 95, badge: null },
  { id: "5", name: "Chesed Assembly Kit", category: "Events", detail: "Everything to run a school-wide chesed assembly — script, slides, props, and printable certificates for recognized students.", price: 185, badge: null },
  { id: "6", name: "Hakaras Hatov Card Set", category: "Classroom", detail: "150 thank-you card templates for student use, with prompts on the back. Makes the Thank-You lesson concrete.", price: 22, badge: null },
];

const CATEGORIES = ["All", "Classroom", "Events", "Programs"];

type Cart = Record<string, number>;

export default function ShopPage() {
  const [cart, setCart] = useState<Cart>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const displayed = activeCategory === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = PRODUCTS.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

  function addToCart(id: string) { setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })); }
  function removeFromCart(id: string) { setCart((c) => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; }); }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "36px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>SCHOOL SHOP</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "10px" }}>
            Physical materials for your school.
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "54ch" }}>
            Printed and shipped directly to your school. Need to pay by purchase order? <a href="mailto:education@justonechesed.org" style={{ color: "#1E47B8", fontWeight: 600 }}>Contact us</a>.
          </p>
        </div>

        {/* Cart button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: itemCount > 0 ? "#10233F" : "#F4F7FD", color: itemCount > 0 ? "#fff" : "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "13px 22px", border: "none", cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}
        >
          🛒 Cart
          {itemCount > 0 && (
            <span style={{ backgroundColor: "#F7941D", color: "#10233F", borderRadius: "9999px", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>{itemCount}</span>
          )}
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            style={{ fontWeight: 600, fontSize: "13.5px", padding: "10px 18px", borderRadius: "9999px", border: activeCategory === c ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: activeCategory === c ? "#10233F" : "#fff", color: activeCategory === c ? "#fff" : "#10233F", cursor: "pointer" }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
        {displayed.map((p) => (
          <div key={p.id} style={{ backgroundColor: "#fff", borderRadius: "22px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden", position: "relative" }}>
            {p.badge && (
              <span style={{ position: "absolute", top: "14px", right: "14px", zIndex: 1, backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 10px" }}>{p.badge}</span>
            )}
            {/* Image slot */}
            <div style={{ aspectRatio: "4/3", backgroundColor: "#F4F7FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "12px", color: "rgba(16,35,63,.3)", fontWeight: 500 }}>Photo coming soon</span>
            </div>
            <div style={{ padding: "20px" }}>
              <span style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#12306F", fontWeight: 600, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 10px", marginBottom: "10px" }}>{p.category}</span>
              <h2 style={{ fontWeight: 700, fontSize: "17.5px", color: "#10233F", lineHeight: 1.25, marginBottom: "6px" }}>{p.name}</h2>
              <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.62)", lineHeight: 1.55, marginBottom: "18px" }}>{p.detail}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: "#10233F" }}>${p.price}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {cart[p.id] > 0 && (
                    <>
                      <button onClick={() => removeFromCart(p.id)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(16,35,63,.2)", backgroundColor: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "16px", color: "#10233F" }}>−</button>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "#10233F", minWidth: "16px", textAlign: "center" }}>{cart[p.id]}</span>
                    </>
                  )}
                  <button
                    onClick={() => addToCart(p.id)}
                    style={{ fontWeight: 700, fontSize: "13.5px", padding: "9px 18px", borderRadius: "9999px", border: "none", cursor: "pointer", backgroundColor: cart[p.id] ? "#10233F" : "#F7941D", color: cart[p.id] ? "#fff" : "#10233F" }}
                  >
                    {cart[p.id] ? "Add more" : "Add to cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(16,35,63,.35)" }} onClick={() => setDrawerOpen(false)}>
          <div
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px, 90vw)", backgroundColor: "#FBF9F4", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(16,35,63,.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px", borderBottom: "1px solid rgba(16,35,63,.1)" }}>
              <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#10233F", margin: 0 }}>Your cart</h2>
              <button onClick={() => setDrawerOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "22px", color: "#10233F", lineHeight: 1 }}>×</button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {itemCount === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <p style={{ fontSize: "16px", color: "rgba(16,35,63,.5)", marginBottom: "16px" }}>Your cart is empty.</p>
                  <button onClick={() => setDrawerOpen(false)} style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "9999px", padding: "11px 22px", border: "none", cursor: "pointer" }}>Browse products</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {PRODUCTS.filter((p) => cart[p.id]).map((p) => (
                    <div key={p.id} style={{ display: "flex", gap: "14px", alignItems: "flex-start", backgroundColor: "#fff", borderRadius: "16px", padding: "16px", border: "1px solid rgba(16,35,63,.1)" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "10px", backgroundColor: "#F4F7FD", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "14.5px", color: "#10233F", marginBottom: "4px" }}>{p.name}</p>
                        <p style={{ fontSize: "13px", color: "rgba(16,35,63,.5)", marginBottom: "10px" }}>${p.price} each</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button onClick={() => removeFromCart(p.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(16,35,63,.18)", backgroundColor: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>−</button>
                          <span style={{ fontWeight: 700, fontSize: "15px", color: "#10233F", minWidth: "16px", textAlign: "center" }}>{cart[p.id]}</span>
                          <button onClick={() => addToCart(p.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(16,35,63,.18)", backgroundColor: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>+</button>
                        </div>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: "16px", color: "#10233F", flexShrink: 0 }}>${p.price * cart[p.id]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            {itemCount > 0 && (
              <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(16,35,63,.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "rgba(16,35,63,.55)" }}>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#10233F" }}>${subtotal}</span>
                </div>
                <p style={{ fontSize: "13px", color: "rgba(16,35,63,.45)", marginBottom: "16px" }}>Shipping calculated at checkout.</p>
                <button
                  onClick={() => alert("Checkout is coming soon! To pay by PO, contact education@justonechesed.org")}
                  style={{ width: "100%", backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "15px", border: "none", cursor: "pointer" }}
                >
                  Checkout — ${subtotal}
                </button>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.45)", textAlign: "center", marginTop: "10px" }}>
                  Pay by PO? <a href="mailto:education@justonechesed.org" style={{ color: "#1E47B8" }}>Contact us</a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
