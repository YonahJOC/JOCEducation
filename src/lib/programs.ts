export type Program = {
  slug: string;
  name: string;
  tag: "Event" | "Ongoing" | "Platform" | "One-time" | "Trip";
  tagline: string;
  description: string;
  heroColor: string;
  meta: string;
  available: string[];
  howItWorks: { step: string; title: string; description: string }[];
  whatsIncluded: string[];
  /** A real quote from a real school. Never a written one — the five that
   *  used to sit here were invented and attributed to named rebbeim. */
  testimonial?: { quote: string; attribution: string };
  cta: string;
  external?: boolean;
  externalHref?: string;
};

export const PROGRAMS: Program[] = [
  {
    slug: "kindness-booth",
    name: "Kindness Booth",
    tag: "Event",
    tagline: "Chesed students can run — and own.",
    description:
      "A JOC-branded station your school sets up at a community event. Students run it, giving out small acts of kindness — handwritten notes, baked goods, personal items — to passersby. JOC provides the full kit, training, and promotional materials.",
    heroColor: "#2D46AF",
    meta: "Half-day setup · All grade levels",
    available: ["JOC App + JOC Education", "Full JOC Partnership"],
    howItWorks: [
      { step: "01", title: "Register your event", description: "Log into the portal and select an upcoming community event in your area. JOC confirms placement within 48 hours." },
      { step: "02", title: "Receive the Kindness Booth kit", description: "A box arrives with the branded booth display, student training cards, activity prompts, and a facilitator guide." },
      { step: "03", title: "Train your students", description: "One 20-minute training session prepares students to run the booth — how to approach people, what to offer, and what to do if someone declines." },
      { step: "04", title: "Run the booth", description: "Students staff the booth during the event. A JOC coordinator is available by phone throughout. Students log their acts in the JOC App." },
    ],
    whatsIncluded: [
      "Branded Kindness Booth display stand and signage",
      "Student role cards and conversation starters",
      "Facilitator guide with setup and breakdown instructions",
      "20-minute student training module",
      "Post-event reflection activity",
      "JOC App integration for hour logging",
    ],
    cta: "Register your school",
  },
  {
    slug: "bake-for-chesed",
    name: "Bake for Chesed",
    tag: "Ongoing",
    tagline: "Monthly cycles. Real deliveries. Real chesed.",
    description:
      "Students bake and deliver goods to local families, hospitals, or shelters. JOC handles all placement partnerships — you just bake. The program runs in monthly cycles so the commitment is predictable and every class can participate.",
    heroColor: "#FA912D",
    meta: "Monthly cycles · Any scale",
    available: ["JOC Education", "JOC App + JOC Education", "Full JOC Partnership"],
    howItWorks: [
      { step: "01", title: "Choose your cycle", description: "Select a monthly cycle from the portal (e.g., November, January). JOC matches your school with a local recipient organization." },
      { step: "02", title: "Plan your bake", description: "The cycle guide includes suggested recipes, allergen notes, and packaging instructions. You decide scale — one class or the whole school." },
      { step: "03", title: "Bake and package", description: "Use the included packaging labels and thank-you note templates. A JOC volunteer coordinator will arrange pickup or delivery." },
      { step: "04", title: "Deliver and debrief", description: "Students (or a teacher representative) deliver the goods. A guided debrief helps students reflect on who they helped and what chesed means." },
    ],
    whatsIncluded: [
      "Monthly cycle packs with recipe suggestions and allergen notes",
      "Branded packaging labels and thank-you card templates",
      "Placement matching with vetted recipient organizations",
      "Delivery coordination support",
      "Guided classroom debrief activity",
      "JOC App integration for chesed hour logging",
    ],
    cta: "Register your school",
  },
  {
    slug: "just-one-tutor",
    name: "Just One Tutor",
    tag: "Ongoing",
    tagline: "Peer tutoring reframed as chesed.",
    description:
      "Older students tutor younger ones — with a full chesed framing, not an academic program. JOC provides matching, training guides, and tracking tools. Students experience giving their time and knowledge as a mitzvah, not a resume item.",
    heroColor: "#2C7AC9",
    meta: "In-school or cross-school",
    available: ["JOC App + JOC Education", "Full JOC Partnership"],
    howItWorks: [
      { step: "01", title: "Identify tutors and learners", description: "Use the portal to submit a list of older students available to tutor and younger students who could benefit. JOC suggests pairings based on subject, schedule, and grade level." },
      { step: "02", title: "Train your tutors", description: "A 45-minute training module teaches tutors how to explain rather than just give answers, how to be patient, and how to frame the relationship as chesed." },
      { step: "03", title: "Run weekly sessions", description: "Pairs meet once a week for 30–45 minutes. The portal tracks sessions, and students log hours in the JOC App." },
      { step: "04", title: "Monthly check-in", description: "A brief monthly form captures how pairs are progressing. JOC flags pairs that may need reassignment or a facilitator check-in." },
    ],
    whatsIncluded: [
      "Pairing algorithm via the JOC portal",
      "45-minute tutor training module (video + workbook)",
      "Weekly session log templates",
      "Monthly progress forms",
      "Certificates for tutors at semester end",
      "JOC App hour tracking integration",
    ],
    cta: "Register your school",
  },
  {
    slug: "chesed-match",
    name: "Chesed Match",
    tag: "Platform",
    tagline: "Real chesed opportunities, vetted and ready.",
    description:
      "Chesed Match connects your students to verified community chesed opportunities — elderly companion visits, hospital volunteer programs, food distribution, and more — through the chesedmatch.org platform. JOC handles the vetting; you handle the scheduling.",
    heroColor: "#10233F",
    meta: "Links to chesedmatch.org",
    available: ["JOC App + JOC Education", "Full JOC Partnership"],
    howItWorks: [
      { step: "01", title: "Browse opportunities", description: "Log into chesedmatch.org with your school account. Filter by location, age group, time commitment, and category." },
      { step: "02", title: "Submit a placement request", description: "Select an opportunity and submit a placement request with your school details and number of students. The host organization confirms within 72 hours." },
      { step: "03", title: "Coordinate and confirm", description: "Chesed Match handles scheduling logistics. You receive a confirmation with all details — time, location, what to bring, what to expect." },
      { step: "04", title: "Log and reflect", description: "Students log their hours through the JOC App. A reflection prompt in the app asks them to describe the experience. Hours count toward school chesed goals." },
    ],
    whatsIncluded: [
      "Full access to chesedmatch.org opportunity network",
      "Vetted partner organizations with background-checked contacts",
      "School dashboard for managing multiple placements",
      "JOC App hour-logging integration",
      "Risk management and supervision protocols",
      "Access to JOC community coordinator for complex placements",
    ],
    external: true,
    externalHref: "https://chesedmatch.org",
    cta: "Visit Chesed Match",
  },
  {
    slug: "assembly-event",
    name: "Assembly or Launch Event",
    tag: "One-time",
    tagline: "Start your year with momentum.",
    description:
      "A JOC presenter comes to your school for a full-school assembly, grade-level program launch, or teacher training day. Every event is customized to your school's grade level, culture, and goals for the year. Booked directly with the JOC team.",
    heroColor: "#1B7F4B",
    meta: "Scheduled with JOC team · All subscription levels",
    available: ["All subscriptions (per-event pricing)"],
    howItWorks: [
      { step: "01", title: "Submit a booking request", description: "Use the portal to describe your school's goals, grade levels, and preferred dates. A JOC program coordinator will reach out within 3 business days." },
      { step: "02", title: "Customize the program", description: "In a 30-minute planning call, your JOC coordinator tailors the session — content, length, student activities, and any school-specific themes." },
      { step: "03", title: "Confirm logistics", description: "JOC confirms AV requirements, room setup, and arrival time. Most assemblies run 45–90 minutes. Teacher training days run 3–4 hours." },
      { step: "04", title: "Host the event", description: "The JOC presenter runs the program. Follow-up materials — discussion guides, classroom follow-up activities — arrive by email within 24 hours." },
    ],
    whatsIncluded: [
      "One JOC presenter for the full event",
      "Custom content planning call",
      "Full-school or grade-level assembly program",
      "Student activity materials",
      "Teacher discussion and follow-up guide",
      "Post-event Q&A with school leadership (optional)",
    ],
    cta: "Request a booking",
  },
  {
    slug: "joc-center-trip",
    name: "JOC Center Trip (Israel)",
    tag: "Trip",
    tagline: "An experience that lasts past graduation.",
    description:
      "A guided trip to the JOC Center in Israel for high school groups. Students see JOC's community programs in action, meet the families and organizations JOC supports, and spend a day volunteering alongside Israeli youth. Full partnership schools receive one included trip per year.",
    heroColor: "#9B4DCA",
    meta: "High school · Annual · Full Partnership included",
    available: ["Full JOC Partnership"],
    howItWorks: [
      { step: "01", title: "Confirm your group", description: "Full partnership schools receive an annual trip allocation. Contact your JOC liaison to confirm dates and group size (typically 20–40 students)." },
      { step: "02", title: "Prepare your students", description: "A two-week preparation unit (included) introduces students to JOC's work in Israel, the communities they'll visit, and what to expect from a chesed immersion day." },
      { step: "03", title: "Travel and arrive", description: "JOC coordinates ground transportation from your arrival airport. Students stay at a partner facility near the JOC Center." },
      { step: "04", title: "The JOC Center day", description: "A full day at the JOC Center: facility tour, meeting program staff and beneficiaries, and a structured volunteer session alongside Israeli students." },
    ],
    whatsIncluded: [
      "Full-day JOC Center program and guided tour",
      "Volunteer session with Israeli youth",
      "Two-week pre-trip preparation unit",
      "Ground transportation from arrival airport",
      "Program coordinator on-site throughout",
      "Post-trip reflection and classroom debrief guide",
    ],
    cta: "Contact your JOC liaison",
  },
];

export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}
