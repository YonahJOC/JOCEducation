"use client";

import { useActionState } from "react";
import { setProgramBookingUrl, type BookingResult } from "@/app/actions/booking";
import { C, R, F, label, primaryButton } from "@/lib/joc-tokens";

/**
 * Where a school books time about this program.
 *
 * Editable here rather than set in code, because a calendar link moves and
 * only the person whose calendar it is knows when. A stale one costs a school
 * an afternoon and tells them nobody is minding it.
 *
 * Empty means the school sees no booking button at all — better than a button
 * that opens somebody else's calendar.
 */
export function BookingLink({
  programId, programName, current, coordinatorName,
}: {
  programId: number;
  programName: string;
  current: string | null;
  coordinatorName: string | null;
}) {
  const bound = setProgramBookingUrl.bind(null, programId);
  const [state, action, pending] = useActionState<BookingResult | null, FormData>(bound, null);

  return (
    <form action={action} style={{ marginTop: "20px" }}>
      <h2 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
        Booking a time
      </h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 12px", maxWidth: "60ch" }}>
        A school sees a <strong>Book a time</strong> button on its {programName} conversation and
        opens this. Leave it empty and no button appears — better than one that opens the wrong
        calendar.
      </p>

      <input
        name="url"
        type="url"
        defaultValue={current ?? ""}
        placeholder="https://calendar.justonechesed.org/…"
        style={{
          width: "100%", maxWidth: "520px", boxSizing: "border-box",
          fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
          border: `1px solid ${C.hairline}`, borderRadius: R.form,
          padding: "10px 12px", minHeight: "44px", marginBottom: "10px",
        }}
      />

      {state && !state.ok && (
        <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "0 0 10px" }}>
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p style={{ fontFamily: F.read, fontSize: "14px", color: C.greenText, margin: "0 0 10px" }}>
          Saved. Schools on {programName} see it now.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          style={{ ...primaryButton, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Saving…" : "Save the link"}
        </button>
      </div>

      <p style={{ ...label, color: C.muted, margin: "10px 0 0" }}>
        {coordinatorName
          ? `Used for ${programName}, whoever runs it`
          : "Nobody is down as running this program, so whoever holds the school's account is named on it"}
      </p>
    </form>
  );
}
