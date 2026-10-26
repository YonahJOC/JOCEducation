import Link from "next/link";
import Image from "next/image";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";
import { uploadProgress, type QueueItem } from "@/lib/school-screen/queue";
import { FlyerPreview } from "@/components/school-screen/FlyerPreview";

/**
 * The few things a student has sent in, and how far each has got.
 *
 * Three pips rather than a word, because "ENDORSED" answers a question
 * nobody asked. What a fifteen-year-old wants to know is whether anything
 * has happened to their flyer since Tuesday, and two filled pips out of
 * three says so at a glance.
 */
export function UploadsPeek({ items, short, seeAll }: {
  items: QueueItem[];
  short: string;
  seeAll: string;
}) {
  return (
    <section style={{
      background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row, overflow: "hidden",
    }}>
      <header style={{
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
        padding: "14px 16px", borderBottom: `1px solid ${C.rule}`,
      }}>
        <h2 style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
          Your uploads
        </h2>
        <span style={{ flex: 1 }} />
        <Link href={seeAll} style={{
          display: "inline-flex", alignItems: "center", minHeight: HIT,
          fontFamily: F.ui, fontSize: "14.5px", fontWeight: 600, color: C.blue, textDecoration: "none",
        }}>
          See all
        </Link>
      </header>

      {items.length === 0 ? (
        <p style={{ ...T.read, color: C.muted, margin: 0, padding: "18px 16px" }}>
          Nothing yet. A flyer for what you run, or a photo of it happening, both go on the screen.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((item, i) => {
            const step = uploadProgress(item.status);
            return (
              <li key={`${item.kind}-${item.id}`} style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.rule}`,
              }}>
                {item.flyer ? (
                  <div style={{ flex: "none", borderRadius: R.sm, overflow: "hidden" }}>
                    <FlyerPreview width={48} short={short} flyer={{ ...item.flyer, hasQr: Boolean(item.flyer.qrUrl) }} />
                  </div>
                ) : item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" width={48} height={48}
                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: R.sm, flex: "none" }} />
                ) : null}

                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <p style={{ fontFamily: F.ui, fontSize: "15.5px", fontWeight: 700, color: C.ink, margin: 0 }}>
                    {item.title}
                  </p>
                  <p style={{ ...T.small, fontWeight: 400, color: step.stopped ? C.muted : C.ink, margin: "2px 0 7px" }}>
                    {step.label}
                  </p>
                  <div aria-hidden="true" style={{ display: "flex", gap: "4px", maxWidth: "200px" }}>
                    {[1, 2, 3].map((n) => (
                      <span key={n} style={{
                        flex: 1, height: "4px", borderRadius: "999px",
                        background: step.stopped
                          ? (n <= step.done ? C.muted : C.rule)
                          : n <= step.done
                            ? (step.done === 3 ? C.orange : C.blue)
                            : C.rule,
                      }} />
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
