"use client";

import { useState, useMemo } from "react";
import { OrderForm } from "./OrderForm";
import { sectionHeading, label, C, ROW_SHADOW, R } from "@/lib/joc-tokens";

export type ShopProduct = {
  id: string;
  name: string;
  category: string;
  detail: string;
  /** Whole dollars. */
  price: number;
  badge: string | null;
  /** Delivered as a download, so no shipping address is needed. */
  isDownload: boolean;
  imageUrl: string | null;
};

type Cart = Record<string, number>;

/** The cart lives in the browser only — nothing is charged until Stripe is wired. */
export function ShopClient({
  products: PRODUCTS, headline, standfirst,
}: {
  products: ShopProduct[];
  headline: string;
  standfirst: string;
}) {
  const CATEGORIES = useMemo(
    () => ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category))).sort()],
    [PRODUCTS]
  );
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
          <p style={{ ...label, color: C.orangeText, marginBottom: "10px" }}>SCHOOL SHOP</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: C.ink, marginBottom: "10px" }}>
            {headline}
          </h1>
          <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, maxWidth: "54ch" }}>
            {standfirst}
          </p>
        </div>

        {/* Cart button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: itemCount > 0 ? C.ink : C.panel, color: itemCount > 0 ? C.white : C.ink, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "13px 22px", border: "none", cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}
        >
          🛒 Cart
          {itemCount > 0 && (
            <span style={{ backgroundColor: C.orange, color: C.ink, borderRadius: R.chip, width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>{itemCount}</span>
          )}
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            style={{ fontWeight: 600, fontSize: "15px", padding: "10px 18px", borderRadius: R.chip, border: activeCategory === c ? "1.5px solid #10233F" : `1px solid ${C.hairline}`, backgroundColor: activeCategory === c ? C.ink : C.white, color: activeCategory === c ? C.white : C.ink, cursor: "pointer" }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
        {displayed.map((p) => (
          <div key={p.id} style={{ backgroundColor: C.white, borderRadius: "22px", border: `1px solid ${C.hairline}`, overflow: "hidden", position: "relative" }}>
            {p.badge && (
              <span style={{ position: "absolute", top: "14px", right: "14px", zIndex: 1, backgroundColor: C.orange, color: C.ink, ...label, borderRadius: R.chip, padding: "4px 10px" }}>{p.badge}</span>
            )}
            {/* Photo, when there is one */}
            <div style={{ aspectRatio: "4/3", backgroundColor: C.panel, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {p.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "12px", color: C.muted, fontWeight: 500 }}>
                  {p.isDownload ? "Download" : "Photo coming soon"}
                </span>
              )}
            </div>
            <div style={{ padding: "20px" }}>
              <span style={{ display: "inline-block", backgroundColor: C.panel, color: C.blue, ...label, borderRadius: R.chip, padding: "4px 10px", marginBottom: "10px" }}>{p.category}</span>
              <h2 style={{ fontWeight: 700, fontSize: "17.5px", color: C.ink, lineHeight: 1.25, marginBottom: "6px" }}>{p.name}</h2>
              <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.55, marginBottom: "18px" }}>{p.detail}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em", color: C.ink }}>${p.price}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {cart[p.id] > 0 && (
                    <>
                      <button onClick={() => removeFromCart(p.id)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: `1px solid ${C.hairline}`, backgroundColor: C.white, cursor: "pointer", fontWeight: 700, fontSize: "16px", color: C.ink }}>−</button>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: C.ink, minWidth: "16px", textAlign: "center" }}>{cart[p.id]}</span>
                    </>
                  )}
                  <button
                    onClick={() => addToCart(p.id)}
                    style={{ fontWeight: 700, fontSize: "15px", padding: "9px 18px", borderRadius: R.chip, border: "none", cursor: "pointer", backgroundColor: cart[p.id] ? C.ink : C.orange, color: cart[p.id] ? C.white : C.ink }}
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
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: C.muted }} onClick={() => setDrawerOpen(false)}>
          <div
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px, 90vw)", backgroundColor: C.paper, display: "flex", flexDirection: "column", boxShadow: ROW_SHADOW }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px", borderBottom: `1px solid ${C.hairline}` }}>
              <h2 style={{ ...sectionHeading, color: C.ink, margin: 0 }}>Your cart</h2>
              <button onClick={() => setDrawerOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "22px", color: C.ink, lineHeight: 1 }}>×</button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {itemCount === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <p style={{ fontSize: "16px", color: C.muted, marginBottom: "16px" }}>Your cart is empty.</p>
                  <button onClick={() => setDrawerOpen(false)} style={{ backgroundColor: C.panel, color: C.ink, fontWeight: 600, fontSize: "14px", borderRadius: R.chip, padding: "11px 22px", border: "none", cursor: "pointer" }}>Browse products</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {PRODUCTS.filter((p) => cart[p.id]).map((p) => (
                    <div key={p.id} style={{ display: "flex", gap: "14px", alignItems: "flex-start", backgroundColor: C.white, borderRadius: "16px", padding: "16px", border: `1px solid ${C.hairline}` }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "10px", backgroundColor: C.panel, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "15px", color: C.ink, marginBottom: "4px" }}>{p.name}</p>
                        <p style={{ fontSize: "13px", color: C.muted, marginBottom: "10px" }}>${p.price} each</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button onClick={() => removeFromCart(p.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${C.hairline}`, backgroundColor: C.white, cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>−</button>
                          <span style={{ fontWeight: 700, fontSize: "15px", color: C.ink, minWidth: "16px", textAlign: "center" }}>{cart[p.id]}</span>
                          <button onClick={() => addToCart(p.id)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: `1px solid ${C.hairline}`, backgroundColor: C.white, cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>+</button>
                        </div>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: "16px", color: C.ink, flexShrink: 0 }}>${p.price * cart[p.id]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            {itemCount > 0 && (
              <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.hairline}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: C.muted }}>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: C.ink }}>${subtotal}</span>
                </div>
                <OrderForm
                  items={Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }))}
                  subtotal={subtotal}
                  needsAddress={PRODUCTS.some((p) => cart[p.id] && !p.isDownload)}
                  onPlaced={() => setCart({})}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
