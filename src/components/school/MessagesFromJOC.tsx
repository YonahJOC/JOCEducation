"use client";

import { writeToJOC } from "@/app/actions/school-messages";
import { Conversation, type ThreadMessage } from "@/components/ui/Conversation";

/**
 * One program's conversation, embedded on that program's page.
 *
 * The same thread as /school/messages, without the list — somebody already
 * looking at Kindness Booth has chosen which conversation they want. The Ask
 * button on the page scrolls here and sets a topic.
 */
export function MessagesFromJOC({
  programId, programName, messages, readerName, starters,
}: {
  programId: number | null;
  programName: string;
  messages: ThreadMessage[];
  readerName: string;
  starters?: string[];
}) {
  const first = readerName.split(/\s+/)[0];

  return (
    <section id="messages" style={{ marginTop: "28px", display: "flex", flexDirection: "column", minHeight: "440px" }}>
      <Conversation
        mine="school"
        messages={messages}
        readerName={readerName}
        starters={messages.length === 0 ? starters : undefined}
        placeholder={`Write to ${first} about ${programName}`}
        noteAfter={`${first} sees it next time they open the JOC console.`}
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
