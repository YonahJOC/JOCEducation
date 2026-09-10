"use client";

import { CrudShell, crudField, crudLabel } from "@/components/admin/SimpleCrud";
import { saveResource, deleteResource } from "@/app/actions/content";
import { FilePicker } from "@/components/admin/FilePicker";

const INK = "#10233F";

export type ResourceRow = {
  id: number;
  title: string;
  tag: string;
  description: string;
  fileUrl: string | null;
  cycleSlug: string | null;
  published: boolean;
};

const BLANK: ResourceRow = {
  id: 0, title: "", tag: "Source sheet", description: "", fileUrl: "", cycleSlug: null, published: false,
};

const TAGS = ["Source sheet", "Activity", "Design", "Video", "Worksheet"];

export function ResourcesClient({
  resources, cycles, disabled,
}: {
  resources: ResourceRow[];
  cycles: { slug: string; theme: string; num: number }[];
  disabled?: boolean;
}) {
  return (
    <CrudShell<ResourceRow>
      title="Resources"
      subtitle={`${resources.length} in the library. Tag each to a Chesed Cycle so it surfaces during those weeks.`}
      addLabel="+ New resource"
      items={resources}
      blank={BLANK}
      disabled={disabled}
      onSave={(d) =>
        saveResource({
          id: d.id || undefined,
          title: d.title,
          tag: d.tag,
          description: d.description,
          fileUrl: d.fileUrl,
          cycleSlug: d.cycleSlug,
          published: d.published,
        })
      }
      onDelete={(d) => deleteResource(d.id)}
      renderForm={(d, set) => (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>Title</label>
            <input value={d.title} onChange={(e) => set({ title: e.target.value })} style={crudField} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={crudLabel}>Category</label>
              <select value={d.tag} onChange={(e) => set({ tag: e.target.value })} style={crudField}>
                {TAGS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={crudLabel}>Chesed Cycle</label>
              <select value={d.cycleSlug ?? ""} onChange={(e) => set({ cycleSlug: e.target.value || null })} style={crudField}>
                <option value="">Not tied to a cycle</option>
                {cycles.map((c) => <option key={c.slug} value={c.slug}>Cycle {c.num} — {c.theme}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={crudLabel}>Description</label>
            <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} rows={2} placeholder="When a teacher would reach for this" style={{ ...crudField, resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <FilePicker
              value={d.fileUrl}
              onChange={(url) => set({ fileUrl: url })}
              disabled={disabled}
            />
          </div>
          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK }}>
            <input type="checkbox" checked={d.published} onChange={(e) => set({ published: e.target.checked })} style={{ width: "16px", height: "16px" }} />
            Published
          </label>
        </>
      )}
      renderRow={(r) => {
        const cycle = cycles.find((c) => c.slug === r.cycleSlug);
        return (
          <>
            <p style={{ fontWeight: 600, color: INK, margin: 0, fontSize: "14.5px" }}>{r.title}</p>
            <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0" }}>
              {r.tag}
              {cycle ? ` · Cycle ${cycle.num}` : ""}
              {r.fileUrl ? "" : " · no file attached"}
              {r.published ? "" : " · draft"}
            </p>
          </>
        );
      }}
    />
  );
}
