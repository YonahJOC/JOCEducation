import Link from "next/link";
import { C, F, T, HIT, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * The top of every page in the school and ambassador portal.
 *
 * One shape, used everywhere, because the pages differed in ways that said
 * nothing: a small uppercase label over some titles and not others, blue
 * hero banners with an orange circle on two of them, and a paragraph under
 * the heading that had been lifted out of a code comment and still read
 * like one. A person moving between four pages was learning four layouts
 * for the same thing.
 *
 * Title, one line under it, and whatever the page lets you do — on the
 * right where there is room, wrapped underneath on a phone.
 */
export function PageHeader({
  back,
  title,
  sub,
  actions,
}: {
  /** Where this page came from, when it is not a top-level one. */
  back?: { href: string; label: string };
  title: string;
  /** One line. If it needs two, the page is explaining too much up here. */
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header style={{ maxWidth: CONTENT_MAX, marginBottom: "22px" }}>
      {back ? (
        <Link
          href={back.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            minHeight: HIT,
            fontFamily: F.ui,
            fontSize: "14.5px",
            fontWeight: 600,
            color: C.muted,
            textDecoration: "none",
          }}
        >
          <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "19px" }}>
            arrow_back
          </span>
          {back.label}
        </Link>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h1 style={{ ...T.title, color: C.ink, margin: 0 }}>{title}</h1>
          {sub ? (
            <p
              style={{
                fontFamily: F.ui,
                fontSize: "15px",
                lineHeight: 1.5,
                color: C.muted,
                margin: "6px 0 0",
                // Long enough for a sentence, short enough that nobody
                // writes a paragraph here.
                maxWidth: "620px",
              }}
            >
              {sub}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
