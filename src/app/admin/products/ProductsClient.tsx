"use client";

import { CrudShell, crudField, crudLabel } from "@/components/admin/SimpleCrud";
import { saveProduct, deleteProduct } from "@/app/actions/content";

const INK = "#10233F";

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  priceDollars: number;
  unit: string;
  inStock: boolean;
  stripePriceId: string | null;
};

const BLANK: ProductRow = {
  id: "", name: "", description: "", priceDollars: 0, unit: "item", inStock: true, stripePriceId: null,
};

export function ProductsClient({ products, disabled }: { products: ProductRow[]; disabled?: boolean }) {
  return (
    <CrudShell<ProductRow>
      title="Products"
      subtitle={`${products.length} in the shop. Prices are set here; Stripe is not connected yet, so nothing can be bought.`}
      addLabel="+ New product"
      items={products}
      blank={BLANK}
      disabled={disabled}
      onSave={(d) =>
        saveProduct({
          id: d.id || undefined,
          name: d.name,
          description: d.description,
          priceDollars: d.priceDollars,
          unit: d.unit,
          inStock: d.inStock,
        })
      }
      onDelete={(d) => deleteProduct(d.id)}
      renderForm={(d, set) => (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>Name</label>
            <input value={d.name} onChange={(e) => set({ name: e.target.value })} style={crudField} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={crudLabel}>Price (USD)</label>
              <input
                type="number" min={0} step="0.01"
                value={d.priceDollars}
                onChange={(e) => set({ priceDollars: Number(e.target.value) })}
                style={crudField}
              />
            </div>
            <div>
              <label style={crudLabel}>Unit</label>
              <input value={d.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="per copy, per pack…" style={crudField} />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>Description</label>
            <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} rows={2} style={{ ...crudField, resize: "vertical" }} />
          </div>
          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
            <input type="checkbox" checked={d.inStock} onChange={(e) => set({ inStock: e.target.checked })} style={{ width: "16px", height: "16px" }} />
            In stock
          </label>
        </>
      )}
      renderRow={(p) => (
        <>
          <p style={{ fontWeight: 600, color: INK, margin: 0, fontSize: "14.5px" }}>{p.name}</p>
          <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0" }}>
            ${p.priceDollars.toFixed(2)} {p.unit}
            {p.inStock ? "" : " · out of stock"}
            {p.stripePriceId ? "" : " · not in Stripe"}
          </p>
        </>
      )}
    />
  );
}
