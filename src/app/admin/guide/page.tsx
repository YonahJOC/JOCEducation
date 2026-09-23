import Link from "next/link";
import { C, pageTitle } from "@/lib/joc-tokens";
import { safeAuth } from "@/auth";
import { canManageAccounts } from "@/lib/access";

export const metadata = { title: "Start here — JOC Console" };

type Section = {
  href: string;
  title: string;
  what: string;
  steps: string[];
  note?: string;
};

/** What the education team does, in the order they are likely to need it. */
const CONTENT: Section[] = [
  {
    href: "/admin/lessons",
    title: "Lesson plans",
    what: "The lessons teachers open and teach. Each one has objectives, what the teacher needs in hand, timed steps, discussion points, and the printables that go with it.",
    steps: [
      "Press “+ New lesson”.",
      "Write the title, pick the Chesed Cycle it belongs to, the grade band, how long it runs and how much preparation it needs.",
      "Fill in the objectives, materials, steps and discussion points. The panel on the right tells you what is still missing.",
      "Under “Printables and handouts”, give each file a name a teacher will recognise, then upload the file itself.",
      "Tick “Published” and press Save. It is on the site immediately.",
    ],
    note: "Leave “Published” unticked to keep working on it. Nothing unpublished is visible to anyone outside this console.",
  },
  {
    href: "/admin/resources",
    title: "Resources",
    what: "Everything that is not a full lesson — worksheets, activities, posters, videos, source sheets.",
    steps: [
      "Press “+ New resource”.",
      "Give it a title, pick the category, and write one line saying when a teacher would reach for it.",
      "Tag it to a Chesed Cycle so it appears during those weeks.",
      "Upload the file, or paste a link if it lives somewhere else.",
      "Tick “Published” and Save.",
    ],
  },
  {
    href: "/admin/site",
    title: "Site content",
    what: "The actual words on the public pages. Edits become drafts — visitors see nothing until you press Publish.",
    steps: [
      "Pick a page on the left, then a section.",
      "Change the wording. It saves as a draft as you go.",
      "Press “Preview drafts on the site” to walk the real site as it would look.",
      "When you are happy, press Publish. Everything waiting goes live together.",
    ],
    note: "Every field keeps its history, so anything published can be rolled back.",
  },
  {
    href: "/admin/programming",
    title: "Calendar",
    what: "The calendar of what JOC is actually running, and where — the booths, the bake sales, the trips, the collections. Separate from the Chesed Cycles: the cycles say what every school is learning this month, this says what is happening.",
    steps: [
      "Press “+ New event”, name it, and give it a date.",
      "Pick the school, or leave it on “Every school” for something the whole network joins.",
      "Link it to one of JOC’s programs and the public page points at that program’s page.",
      "Set the status — Planned while it is pencilled in, Confirmed once the school has agreed.",
      "Tick Published when the school should see it on the Calendar.",
    ],
    note: "To call something off, use Cancel rather than Delete. A school that was told it was happening needs to see that it is not.",
  },
  {
    href: "/admin/cycles",
    title: "Chesed Cycles",
    what: "The eight themes the year is built around — the dates, the guiding question, and the week-by-week plan.",
    steps: [
      "Open a cycle to change its theme, dates, question or weekly plan.",
      "The cycles are one chain: change a cycle’s last day and every later cycle shifts to follow, keeping its own length. You never edit the others to make room.",
      "Everything published on the site for those weeks points at whichever cycle is running.",
    ],
    note: "The dates were generated and have never been checked against a luach. Check them before the year begins.",
  },
  {
    href: "/admin/coverage",
    title: "Cycle coverage",
    what: "A map: the eight cycles down the side, grade bands across. One glance shows which weeks of the year have nothing behind them.",
    steps: [
      "Look for the empty cells — those are the gaps.",
      "Click one to start writing the lesson that fills it.",
    ],
  },
  {
    href: "/admin/programs",
    title: "Programs",
    what: "What JOC runs for schools — Kindness Booth, Bake for Chesed, the Israel trips, and anything else.",
    steps: [
      "If the orange banner is showing, press “Import the six built-in programs” first.",
      "Press “+ New program” to add one.",
      "Fill in the name, what it is, what the school gets, and the steps of how it runs.",
      "Tick which plans include it, tick Published, and Save.",
    ],
    note: "Publishing your first program replaces the six written into the code — which is why the import comes first.",
  },
  {
    href: "/admin/board",
    title: "Teachers’ Board",
    what: "What teachers write up about something they ran. Nothing appears publicly until you approve it.",
    steps: [
      "New posts sit at the top, marked as waiting.",
      "Read it. Press Approve to put it on the board, or Remove if it should not be there.",
    ],
  },
  {
    href: "/admin/rooms",
    title: "Discussion rooms",
    what: "The staff room — topic rooms where teachers talk to each other. Unlike the board, nothing here waits for approval.",
    steps: [
      "Press “+ New room”, give it an icon, a name and one line saying what it is for.",
      "To retire a room, tick “Closed” — it stays readable but takes no new messages.",
      "In any room you can remove a single message that should not be there.",
    ],
  },
  {
    href: "/admin/files",
    title: "Files",
    what: "Everything that has been uploaded. You can attach files while editing a lesson or resource — this page is for seeing what exists and removing what should not.",
    steps: [
      "Press “Upload a file” to add one.",
      "“Copy link” gives you the address to paste anywhere that asks for one.",
      "Delete only what nothing is using — anything linking to it will stop working.",
    ],
  },
  {
    href: "/admin/products",
    title: "Products",
    what: "The shop catalogue. Attach a file to anything delivered as a download rather than posted.",
    steps: [
      "Press “+ New product”.",
      "Set the name, price, unit (“per copy”, “per pack”) and section.",
      "Add a photo, and the file itself if it is a download.",
      "Tick Published and Save.",
    ],
    note: "Publishing something at $0 is refused — a shop item with no price is a price nobody has set.",
  },
];

const ACCOUNTS: Section[] = [
  {
    href: "/admin/schools",
    title: "Schools",
    what: "Every school account: plan, seats, who has a login, who to call, and the whole history of the relationship.",
    steps: [
      "Open a school to change its plan, add a contact, or log a call.",
      "“Invite” creates a login for someone at that school.",
      "A scholarship or free access needs a reason — that record is what makes it answerable later.",
    ],
  },
  {
    href: "/admin/demos",
    title: "Demo requests & messages",
    what: "Bookings from the landing page, and everything sent through the contact form.",
    steps: [
      "Reply, then move the request along as it progresses.",
      "“Create school” turns a demo into a real account and carries the requester across as the first contact.",
    ],
  },
  {
    href: "/admin/orders",
    title: "Orders",
    what: "What schools have ordered from the shop. Nothing is charged on the site.",
    steps: [
      "Open an order, confirm the total and shipping, and write back what you told them.",
      "Move it along: Quoted, then Invoiced, then Fulfilled.",
    ],
  },
  {
    href: "/admin/users",
    title: "People",
    what: "Every account, what it can do, and which school it belongs to.",
    steps: [
      "Create an account directly, or change someone’s role.",
      "Resetting a password gives you a temporary one to pass on, and forces them to change it.",
    ],
  },
];

export default async function GuidePage() {
  const session = await safeAuth();
  const superAdmin = canManageAccounts(session?.user);
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];

  return (
    <div style={{ maxWidth: "860px" }}>
      <h1 style={pageTitle}>
        {firstName ? `Start here, ${firstName}.` : "Start here."}
      </h1>
      <p style={{ fontSize: "16px", color: "#4A5A74", lineHeight: 1.65, margin: "0 0 12px", maxWidth: "68ch" }}>
        This is where everything on the site gets written and changed. Nothing here can break the
        site: anything you have not published is invisible to teachers, and anything you have
        published can be changed back.
      </p>
      <p style={{ fontSize: "15px", color: "#4A5A74", lineHeight: 1.6, margin: "0 0 30px", maxWidth: "68ch" }}>
        Every page has a <strong style={{ color: C.ink }}>“How do I change this?”</strong> link under
        its title with the steps for that page. Below is the whole console, section by section.
      </p>

      <Group title="Your work" sections={CONTENT} />
      {superAdmin && <Group title="Accounts and money" sections={ACCOUNTS} />}

      <div style={{ backgroundColor: "#10233F", borderRadius: "18px", padding: "26px 28px", marginTop: "10px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#fff", margin: "0 0 10px" }}>
          Two things that are not working yet
        </h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <li style={{ fontSize: "14.5px", color: "rgba(255,255,255,.78)", lineHeight: 1.6 }}>
            <strong style={{ color: "#fff" }}>Email.</strong> Invitations, password resets and order
            confirmations are all written and waiting, but nothing is sent until JOC connects a mail
            service. Where that matters, the console tells you so rather than letting you assume.
          </li>
          <li style={{ fontSize: "14.5px", color: "rgba(255,255,255,.78)", lineHeight: 1.6 }}>
            <strong style={{ color: "#fff" }}>Card payment.</strong> A school can order, and the order
            reaches you — but it is invoiced by hand.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Group({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 14px" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sections.map((s) => (
          <div key={s.href} style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "22px" }}>
            <Link
              href={s.href}
              style={{ fontWeight: 700, fontSize: "17.5px", letterSpacing: "-0.02em", color: C.ink, textDecoration: "none" }}
            >
              {s.title} <span style={{ color: C.blue, fontSize: "15px" }}>→</span>
            </Link>
            <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: "6px 0 12px" }}>
              {s.what}
            </p>
            <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "7px" }}>
              {s.steps.map((step, i) => (
                <li key={i} style={{ fontSize: "14px", color: "rgba(16,35,63,.82)", lineHeight: 1.6 }}>{step}</li>
              ))}
            </ol>
            {s.note && (
              <p style={{ fontSize: "13.5px", color: "#C96C00", backgroundColor: "rgba(250,145,45,.12)", borderRadius: "10px", padding: "11px 14px", margin: "14px 0 0", lineHeight: 1.55 }}>
                {s.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
