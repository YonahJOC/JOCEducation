"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setStage, setEnrollmentContact, reconcileEnrollments } from "@/app/actions/program-enrollment";
import {
  STAGES, STAGE_LABEL, STAGE_MEANING, STAGE_TONE, countsAsIn, type Stage, type EnrolledRow, } from "@/lib/program-enrollment";
import { STUCK_DAYS } from "@/lib/program-today";
import {
  C, F, rowDetail, primaryButton, secondaryButton, chip, sectionHeading, sectionIntro, field, fieldLabel, quietButton, plainChip, textButton, type Tone } from "@/lib/joc-tokens";
import { TONE } from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";
import { RowGroup } from "@/components/ui/RowGroup";

/**
 * "Schools in <Program>" — who runs it, and how far along each one is.
 *
 * The console could say whether a school was a customer, and when the
 * Kindness Booth was at Bnos Chaya. It could not say which programs a school
 * runs and how far along each is, which is the question this whole panel
 * exists to answer — and the one a coordinator is asked most.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const daysSince = (d: Date | string) =>
  Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);

/** How far along maps onto the site's five tones. */
const TONE_OF: Record<"going" | "setup" | "stopped", Tone> = {
  going: "good",
  setup: "info",
  stopped: "quiet",
};

// Sitting at one stage this long is the thing a coordinator should notice.
// Defined with the Today tab, which counts the same rows this list shows.

export function ProgramSchools({
  programId, slug, programName, rows, canEdit,
}: {
  programId: number;
  slug: string;
  programName: string;
  rows: EnrolledRow[];
  canEdit: boolean;
}) {
  // Three categories, each with its own count, each opened or shut on its
  // own. It was one list behind four filter chips, so picking a category hid
  // every other school — and the schools not in the program at all were on a
  // different tab, which is a coordinator's whole list split in two.
  const group = (t: "going" | "setup" | "stopped") => rows.filter((r) => STAGE_TONE[r.stage] === t);
  const going = group("going");
  const setup = group("setup");
  const stopped = group("stopped");

  const rowsFor = (list: EnrolledRow[]) =>
    list.map((r) => <Row key={r.id} row={r} programId={programId} slug={slug} canEdit={canEdit} />);

  return (
    <div style={{ marginBottom: "16px" }} id="schools-in">
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Schools</h2>
      <p style={sectionIntro}>
        Every school on the system, whether or not it is in {programName} yet. Open a category to
        see who is in it.
      </p>

      {canEdit && (
        <p style={{ margin: "0 0 14px" }}>
          <Reconcile slug={slug} />
        </p>
      )}

      <RowGroup
        tone="good"
        title="Running"
        count={going.length}
        open
        line={
          going.length === 0
            ? `No school is running ${programName} yet.`
            : `In ${programName} and running it.`
        }
      >
        {rowsFor(going)}
      </RowGroup>

      <RowGroup
        tone="info"
        title="Being set up"
        count={setup.length}
        open
        line={
          setup.length === 0
            ? "Nobody is part-way through signing up."
            : "Introduced, registered or booked — not running yet."
        }
      >
        {rowsFor(setup)}
      </RowGroup>

      <RowGroup
        tone="quiet"
        title="Stopped"
        count={stopped.length}
        line={
          stopped.length === 0
            ? "No school has stopped."
            : `Was in ${programName} and is not any more.`
        }
      >
        {rowsFor(stopped)}
      </RowGroup>
    </div>
  );
}

function Row({
  row, programId, slug, canEdit,
}: {
  row: EnrolledRow; programId: number; slug: string; canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const stuck = countsAsIn(row.stage) && STAGE_TONE[row.stage] === "setup" && daysSince(row.stageSince) > STUCK_DAYS;

  return (
    <BandRow
      tone={stuck ? "warn" : TONE_OF[STAGE_TONE[row.stage]]}
      label="Stage"
      figure={STAGE_LABEL[row.stage]}
      word
      title={
        <>
          <Link href={`/admin/schools/${row.schoolId}`} style={{ color: C.ink, textDecoration: "none" }}>
            {row.schoolName}
          </Link>
          {row.place && <span style={{ fontSize: "15px", fontWeight: 400, color: C.muted }}> · {row.place}</span>}
        </>
      }
      line={
        stuck
          ? `${STAGE_MEANING[row.stage]} ${daysSince(row.stageSince)} days at this stage, since ${day(row.stageSince)}.`
          : `${STAGE_MEANING[row.stage]} Since ${day(row.stageSince)}.`
      }
      chips={
        <>
          <span style={{ ...chip, backgroundColor: C.panel, color: row.contact ? C.ink : C.orangeText }}>
            {row.contact ? `Run by ${row.contact.name}` : "Nobody named at the school"}
          </span>
          <span style={{ ...chip, backgroundColor: C.panel, color: row.runs > 0 ? C.ink : C.orangeText }}>
            {row.runs === 0
              ? "Not on the calendar"
              : `${row.runs} on the calendar${row.nextRun ? ` · next ${day(row.nextRun)}` : ""}`}
          </span>
          {row.startedAt && <span style={plainChip}>First ran {day(row.startedAt)}</span>}
        </>
      }
      actionNode={
        <>
          {canEdit ? (
            <button type="button" onClick={() => setOpen(!open)} style={open ? secondaryButton : primaryButton}>
              {open ? "Close" : "Move it on"}
            </button>
          ) : (
            <Link href={`/admin/schools/${row.schoolId}`} style={{ ...primaryButton, textDecoration: "none" }}>
              Open school
            </Link>
          )}
          {row.contact?.phone && (
            <a href={`tel:${row.contact.phone.replace(/[^d+]/g, "")}`} style={{ ...textButton, display: "flex", alignItems: "center" }}>
              {row.contact.phone}
            </a>
          )}
        </>
      }
    >
      {open && canEdit && (
        <div style={rowDetail}>
          <MoveOn row={row} programId={programId} slug={slug} onDone={() => setOpen(false)} />
        </div>
      )}

      {row.note && (
        <p style={{
          borderTop: `1px solid ${C.hairline}`, backgroundColor: C.paper,
          fontFamily: F.read, fontSize: "15px", color: C.muted,
          margin: 0, padding: "11px 18px", lineHeight: 1.45,
        }}>
          {row.note}
        </p>
      )}
    </BandRow>
  );
}

function MoveOn({
  row, programId, slug, onDone,
}: {
  row: EnrolledRow; programId: number; slug: string; onDone: () => void;
}) {
  const [stage, setStageTo] = useState<Stage>(row.stage);
  const [note, setNote] = useState("");
  const [contactId, setContactId] = useState(row.contact?.id ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);


  return (
    <div style={{ display: "grid", gap: "12px", maxWidth: "58ch" }}>
      <div>
        <span style={fieldLabel}>Stage</span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {STAGES.map((s) => {
            const t = TONE[TONE_OF[STAGE_TONE[s]]];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStageTo(s)}
                style={{
                  ...chip, fontSize: "14px", padding: "9px 13px", minHeight: "44px",
                  cursor: "pointer", border: "none",
                  backgroundColor: stage === s ? C.ink : t.bg,
                  color: stage === s ? C.white : t.fg,
                }}
              >
                {STAGE_LABEL[s]}
              </button>
            );
          })}
        </div>
        <span style={{ display: "block", fontFamily: F.read, fontSize: "15px", color: C.muted, marginTop: "7px", lineHeight: 1.45 }}>
          {STAGE_MEANING[stage]}
        </span>
      </div>

      {row.contactChoices.length > 0 && (
        <div>
          <span style={fieldLabel}>Who runs it at the school</span>
          <select value={contactId} onChange={(e) => setContactId(e.target.value)} style={field}>
            <option value="">Nobody named yet</option>
            {row.contactChoices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.title ? ` · ${c.title}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span style={fieldLabel}>Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What changed, in a line"
          style={{ ...field, minHeight: "68px", resize: "vertical" }}
        />
      </div>

      <p style={{ fontFamily: F.read, fontSize: "14px", color: C.muted, margin: 0, lineHeight: 1.5 }}>
        This is written to the school&rsquo;s own activity log, where the account team reads it.
        Nothing reaches the school.
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await setStage(programId, slug, row.schoolId, stage, note);
              if (!r.ok) { setErr(r.error); return; }
              if ((contactId || null) !== (row.contact?.id ?? null)) {
                const c = await setEnrollmentContact(programId, slug, row.schoolId, contactId || null);
                if (!c.ok) { setErr(c.error); return; }
              }
              onDone();
            });
          }}
          style={{ ...primaryButton, width: "auto" }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={quietButton}
        >
          Cancel
        </button>
      </div>
      {err && <span style={{ fontSize: "14px", color: C.redText }}>{err}</span>}
    </div>
  );
}

function Reconcile({ slug }: { slug: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await reconcileEnrollments(slug);
            setMsg(r.ok ? r.message : r.error);
          });
        }}
        style={{ ...textButton, padding: "0 4px" }}
      >
        {pending ? "Reconciling…" : "Reconcile with the calendar"}
      </button>
      {msg && <span style={{ fontFamily: F.read, fontSize: "14px", color: C.muted, lineHeight: 1.45, maxWidth: "46ch" }}>{msg}</span>}
    </>
  );
}
