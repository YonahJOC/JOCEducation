import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products — Admin" };

const PRODUCTS = [
  { name: "JOC Chesed Student Journal", price: 2200, inStock: true },
  { name: "Chesed Classroom Starter Kit", price: 18900, inStock: true },
  { name: "JOC App — Annual School License", price: 48000, inStock: true },
  { name: "Classroom Poster Pack", price: 2900, inStock: true },
  { name: "Halacha of Chesed Source Sheet Bundle", price: 1800, inStock: true },
];

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminProductsPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Products</h1>
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)" }}>Manage shop items and Stripe pricing</p>
        </div>
        <button style={{ backgroundColor: "#1E47B8", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 22px", border: "none", cursor: "pointer" }}>
          + Add product
        </button>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 80px", gap: "0", padding: "12px 24px", borderBottom: "1px solid rgba(16,35,63,.1)", backgroundColor: "#F8FAFE" }}>
          {["Product", "Price", "Status", ""].map((col) => (
            <div key={col} style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(16,35,63,.45)" }}>
              {col}
            </div>
          ))}
        </div>
        {PRODUCTS.map((p, i) => (
          <div key={p.name} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 80px", gap: "0", padding: "16px 24px", borderBottom: i < PRODUCTS.length - 1 ? "1px solid rgba(16,35,63,.07)" : "none", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "#10233F" }}>{p.name}</div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#10233F" }}>{fmt(p.price)}</div>
            <div>
              <span style={{ backgroundColor: "#E8F5EE", color: "#1B7F4B", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 10px" }}>
                {p.inStock ? "In stock" : "Out of stock"}
              </span>
            </div>
            <div>
              <button style={{ fontSize: "13px", color: "rgba(16,35,63,.5)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "#FDEEDA", borderRadius: "14px", padding: "16px 20px" }}>
        <p style={{ fontSize: "14px", color: "#7C4A00", lineHeight: 1.5, margin: 0 }}>
          <strong>Stripe not connected.</strong> Add <code style={{ backgroundColor: "rgba(0,0,0,.08)", borderRadius: "4px", padding: "1px 5px", fontSize: "12.5px" }}>STRIPE_SECRET_KEY</code> to .env.local to link products to Stripe price IDs and enable live checkout.
        </p>
      </div>
    </div>
  );
}
