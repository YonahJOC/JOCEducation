"use client";

import { CrudShell, crudField, crudLabel } from "@/components/admin/SimpleCrud";
import { saveProduct, deleteProduct } from "@/app/actions/content";
import { FilePicker } from "@/components/admin/FilePicker";

const INK = "#10233F";

const CATEGORIES = ["Classroom", "Events", "Programs", "Books"];

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  priceDollars: number;
  unit: string;
  inStock: boolean;
  stripePriceId: string | null;
  category: string;
  imageUrl: string | null;
  fileUrl: string | null;
  published: boolean;
  sort: number;
};

const BLANK: ProductRow = {
  id: "", name: "", description: "", priceDollars: 0, unit: "item", inStock: true,
  stripePriceId: null, category: "Classroom", imageUrl: null, fileUrl: null,
  published: false, sort: 0,
};

export function ProductsClient({ products, disabled }: { products: ProductRow[]; disabled?: boolean }) {
  return (
    <CrudShell<ProductRow>
      title="Products"
      subtitle={
        `${products.length} in the catalogue. Card payment is not connected, so an order ` +
        `arrives under Orders for you to quote and invoice. Attach a file to something ` +
        `delivered as a download — a handbook, say — and no delivery address is asked for.`
      }
      steps={[
        "Press “+ New product”.",
        "Set the name, the price, and the unit — “per copy”, “per pack”, “per year”.",
        "Pick the section it belongs in, and add a photo for the shop card.",
        "If it is delivered as a download rather than posted, upload the file itself — a school ordering it is then not asked for a delivery address.",
        "Tick Published, then Save.",
      ]}
      note="Publishing something at $0 is refused. A shop item with no price is a price nobody has set."
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
          category: d.category,
          imageUrl: d.imageUrl,
          fileUrl: d.fileUrl,
          published: d.published,
          sort: d.sort,
        })
      }
      onDelete={(d) => deleteProduct(d.id)}
      renderForm={(d, set) => (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>Name</label>
            <input value={d.name} onChange={(e) => set({ name: e.target.value })} style={crudField} autoFocus />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "12px" }}>
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
            <div>
              <label style={crudLabel}>Section</label>
              <select value={d.category} onChange={(e) => set({ category: e.target.value })} style={crudField}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>Description</label>
            <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} rows={2} style={{ ...crudField, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <FilePicker
              label="Photo for the shop card"
              value={d.imageUrl}
              onChange={(url) => set({ imageUrl: url })}
              disabled={disabled}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <FilePicker
              label="The file itself, if this is a download"
              value={d.fileUrl}
              onChange={(url) => set({ fileUrl: url })}
              disabled={disabled}
            />
            <p style={{ fontSize: "12px", color: "#4A5A74", margin: "5px 0 0" }}>
              Leave empty for something printed and posted.
            </p>
          </div>

          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
              <input type="checkbox" checked={d.published} onChange={(e) => set({ published: e.target.checked })} style={{ width: "16px", height: "16px" }} />
              Published — visible in the shop
            </label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
              <input type="checkbox" checked={d.inStock} onChange={(e) => set({ inStock: e.target.checked })} style={{ width: "16px", height: "16px" }} />
              In stock
            </label>
          </div>
        </>
      )}
      renderRow={(p) => (
        <>
          <p style={{ fontWeight: 600, color: INK, margin: 0, fontSize: "14.5px" }}>{p.name}</p>
          <p style={{ fontSize: "12.5px", color: "#4A5A74", margin: "2px 0 0" }}>
            {p.priceDollars > 0 ? `$${p.priceDollars.toFixed(2)} ${p.unit}` : "no price set"}
            {` · ${p.category}`}
            {p.fileUrl ? " · download" : ""}
            {p.published ? "" : " · draft"}
            {p.inStock ? "" : " · out of stock"}
          </p>
        </>
      )}
    />
  );
}
