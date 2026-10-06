"use client";

import { writeToJOC } from "@/app/actions/school-messages";
import { Conversation, type Message } from "@/components/ui/Conversation";
import { C, F, label } from "@/lib/joc-tokens";

/**
 * The school's half of the conversation with JOC.
 *
 * The same thread the coordinator sees on their console, from the other end.
 * Nothing was emailed to get here — the school is reading it because they
 * opened their own portal, which is the only way anything reaches them
 * before JOC launches.
 */
export function MessagesFromJOC({
  programId, messages, coordinator,
}: {
  programId: number | null;
  /** Who it reaches, which is the only thing a school wants to know. */
  coordinator?: string | null;
  messages: Message[];
}) {
  const who = coordinator ?? "JOC";

  return (
    <section style={{ marginTop: "24px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>
        {coordinator ? `Messages with ${coordinator}` : "Messages with JOC"}
      </p>

      <Conversation
        mine="school"
        messages={messages}
        placeholder={`Write to ${who}`}
        note={`${who} reads it on their console. Nothing is emailed either way.`}
        send={async (body) => {
          const form = new FormData();
          form.set("body", body);
          const res = await writeToJOC(programId, null, form);
          return res.ok ? null : res.error;
        }}
      />
    </section>
  );
}

void F;
