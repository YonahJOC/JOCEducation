// @ts-nocheck — PrismaClient types are generated at `prisma generate` time
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding JOC Education database…");

  // ─── Lesson Plans ──────────────────────────────────────────────────────────
  const lessons = [
    {
      id: 1,
      slug: "seeing-the-person-in-front-of-you",
      theme: "Bein Adam LaChaveiro",
      title: "Seeing the Person in Front of You",
      description:
        "Students learn to give full attention when someone speaks to them — eye contact, body language, and what it means to truly listen.",
      grade: "es" as const,
      timeMinutes: 20,
      prep: "Minimal" as const,
      files: ["lesson-plan.pdf", "reflection-cards.pdf"],
      objectives: [
        "Define what it means to give someone \"full attention\"",
        "Practice active listening behaviors including eye contact and body language",
        "Identify one specific moment today when they will give someone their full attention",
      ],
      materials: [
        "Reflection cards — 1 per student (included in download)",
        "Optional: timer for role-play activity",
      ],
      steps: [
        { duration: "3 min", title: "Opening story", order: 0, description: "Share a brief story about someone who felt truly \"seen\" by another person — their face changed, they stopped rushing. Ask: what did that feel like for them? What did the other person do differently?" },
        { duration: "8 min", title: "The role-play", order: 1, description: "Split into pairs. Partner A shares something about their day while Partner B practices distracted listening (looking away, fidgeting). Switch — this time Partner B gives full attention: eye contact, body turned in, no interrupting. Brief debrief together after each round." },
        { duration: "7 min", title: "Class discussion", order: 2, description: "What felt different between the two rounds? What does it feel like to be truly listened to? When is it hardest to give our full attention? (Tired, thinking about something else, busy.)" },
        { duration: "2 min", title: "Reflection card", order: 3, description: "Each student writes or draws: one specific moment today — a name, a place, a situation — when they will give someone their full attention. Cards go home." },
      ],
      discussion: [
        "Why is it hard to give someone your full attention? What gets in the way?",
        "When has someone made you feel truly heard? What did they do that was different?",
        "Is giving attention a form of chesed? Why or why not?",
      ],
    },
    {
      id: 2,
      slug: "the-open-door-making-others-feel-welcome",
      theme: "Hachnasas Orchim",
      title: "The Open Door: Making Others Feel Welcome",
      description:
        "Through the lens of Avraham Avinu, students explore what genuine hospitality looks like in school and at home.",
      grade: "ms" as const,
      timeMinutes: 40,
      prep: "Minimal" as const,
      files: ["lesson-plan.pdf", "source-sheet.pdf"],
      objectives: [
        "Understand the mitzvah of hachnasas orchim through the example of Avraham Avinu",
        "Distinguish between formal hospitality and the chesed of making someone feel genuinely welcome",
        "Identify specific ways to make new students or visitors feel at home in their school",
      ],
      materials: [
        "Source sheet — 1 per chevrusa pair (included in download)",
        "Optional: whiteboard for class brainstorm",
      ],
      steps: [
        { duration: "10 min", title: "Source study", order: 0, description: "In chevrusos, students read the source sheet on Avraham welcoming the malachim (Bereishis 18)." },
        { duration: "10 min", title: "Class debrief on sources", order: 1, description: "Pairs share their observations. Teacher draws out: Avraham ran, didn't wait to be asked, exceeded expectations." },
        { duration: "10 min", title: "Modern application", order: 2, description: "What does hachnasas orchim look like in school today? Who are the 'guests'?" },
        { duration: "10 min", title: "Commitment and sharing", order: 3, description: "Each group shares one concrete idea. The class votes on one to implement in the next two weeks." },
      ],
      discussion: [
        "Avraham was 99 years old, recovering from his bris, when he ran to greet guests. What does that tell us about how he felt about hachnasas orchim?",
        "Is making someone feel welcome the same as being nice to them? What's the difference?",
        "Who in our school might feel like an outsider right now? What could we do about it — today, this week?",
      ],
    },
    {
      id: 3,
      slug: "more-than-money-what-tzedakah-really-means",
      theme: "Tzedakah",
      title: "More Than Money: What Tzedakah Really Means",
      description:
        "A deep look at the different forms of tzedakah — time, attention, expertise — beyond the pushke on the wall.",
      grade: "hs" as const,
      timeMinutes: 60,
      prep: "Moderate" as const,
      files: ["lesson-plan.pdf", "case-studies.pdf", "discussion-guide.pdf"],
      objectives: [
        "Understand tzedakah as a concept of justice and obligation, not just charitable donation",
        "Identify multiple forms of giving beyond monetary contribution",
        "Evaluate real-world dilemmas using the tzedakah framework studied in class",
      ],
      materials: [
        "Case studies sheet — 1 per pair (included in download)",
        "Teacher discussion guide (included in download)",
      ],
      steps: [
        { duration: "5 min", title: "Opening provocation", order: 0, description: "Ask: Is tzedakah about giving people what they need, or giving what we have? Read the Rambam on the eight levels of tzedakah." },
        { duration: "15 min", title: "Conceptual development", order: 1, description: "Teacher-led: the word tzedakah shares a root with tzedek — justice. What does that imply about obligation?" },
        { duration: "20 min", title: "Case study analysis", order: 2, description: "In pairs, students work through three case studies: giving time instead of money, giving professional expertise, and a harder case." },
        { duration: "15 min", title: "Class discussion", order: 3, description: "Pairs share conclusions. Teacher facilitates disagreements — there's no single right answer on some cases." },
        { duration: "5 min", title: "Personal reflection", order: 4, description: "Silent writing: what form of tzedakah is easiest for me to give? Hardest?" },
      ],
      discussion: [
        "Why does the Torah command tzedakah rather than just encourage it?",
        "Is there a difference between tzedakah you feel like giving and tzedakah you don't feel like giving?",
        "What would it look like if our school ran on tzedakah principles?",
      ],
    },
    {
      id: 4,
      slug: "visiting-the-sick-halacha-and-heart",
      theme: "Bikur Cholim",
      title: "Visiting the Sick: Halacha and Heart",
      description:
        "Students learn the mitzvah of bikur cholim through halacha and personal stories, then plan a real class visit.",
      grade: "ms" as const,
      timeMinutes: 40,
      prep: "Moderate" as const,
      files: ["lesson-plan.pdf", "halacha-sheet.pdf"],
      objectives: [
        "Learn the basic halachos of bikur cholim including timing, manner of visit, and what to say",
        "Understand why bikur cholim is considered an imitation of Hashem's ways (imitatio Dei)",
        "Plan and commit to a concrete bikur cholim action as a class",
      ],
      materials: [
        "Halacha sheet — 1 per student (included in download)",
        "Optional: whiteboard for class planning",
      ],
      steps: [
        { duration: "8 min", title: "Personal stories", order: 0, description: "Has anyone visited a sick person? What happened? Take 2-3 student stories." },
        { duration: "12 min", title: "Halacha study", order: 1, description: "Students read the halacha sheet in pairs. Key areas: when to visit, when not to, what to say." },
        { duration: "10 min", title: "Why Hashem does it", order: 2, description: "The Gemara says Hashem visited Avraham when he was ill. What do we learn about bikur cholim from this?" },
        { duration: "10 min", title: "Class planning", order: 3, description: "Identify someone in the school community who could use a visit. Plan together: who, when, what will we do?" },
      ],
      discussion: [
        "The halacha says not to visit in the first or last three hours of the day. What does this teach us about who the visit is really for?",
        "Is sending a text or a card the same as visiting in person? What is the mitzvah really about?",
        "The Gemara says that whoever visits the sick takes away 1/60th of their illness. What could that mean?",
      ],
    },
    {
      id: 5,
      slug: "who-do-you-thank",
      theme: "Hakaras Hatov",
      title: "Who Do You Thank?",
      description:
        "A gratitude practice that moves from abstract to personal — students map every person who helped them get to school that morning.",
      grade: "es" as const,
      timeMinutes: 20,
      prep: "Minimal" as const,
      files: ["lesson-plan.pdf", "gratitude-map.pdf"],
      objectives: [
        "Recognize the many people who contribute to their daily life in invisible ways",
        "Understand hakaras hatov as actively seeing and acknowledging what was done for you",
        "Complete a personal gratitude map and identify one specific person to thank today",
      ],
      materials: [
        "Gratitude map worksheet — 1 per student (included in download)",
        "Pencils or crayons",
      ],
      steps: [
        { duration: "3 min", title: "How did you get here?", order: 0, description: "Ask: how did you get to school this morning? Then push deeper: who made that possible?" },
        { duration: "8 min", title: "Gratitude map", order: 1, description: "Distribute the worksheet. Students write or draw the name of every person who helped them from waking up to sitting in their seat." },
        { duration: "6 min", title: "Sharing and reflection", order: 2, description: "Partners share their maps. Who's on both lists? Who surprised you?" },
        { duration: "3 min", title: "One person to thank", order: 3, description: "Each student identifies one specific person they will thank today." },
      ],
      discussion: [
        "Is it possible to fully thank someone for everything they've done for you? What does it mean to try?",
        "Are there people who helped you that you'll never be able to thank? What do you do with that feeling?",
        "What's the difference between taking something for granted and hakaras hatov?",
      ],
    },
    {
      id: 6,
      slug: "mekoros-on-chesed-a-source-sheet-lesson",
      theme: "Chesed in Halacha",
      title: "Mekoros on Chesed: A Source Sheet Lesson",
      description:
        "A structured chevrusa session exploring primary sources on chesed obligations — designed for a full 90-minute shiur.",
      grade: "hs" as const,
      timeMinutes: 90,
      prep: "Substantial" as const,
      files: ["lesson-plan.pdf", "source-sheet.pdf", "teacher-notes.pdf"],
      objectives: [
        "Navigate primary halachic sources on chesed from Torah, Gemara, and Rishonim",
        "Distinguish between chesed as a positive commandment and chesed as a character trait (midah)",
        "Apply halachic reasoning to contemporary questions about chesed obligation",
      ],
      materials: [
        "Source sheet — 1 per student (included in download)",
        "Teacher notes with analysis — for teacher use (included in download)",
        "Optional: dictionaries or reference materials for Rishonim",
      ],
      steps: [
        { duration: "10 min", title: "Introduction and framing", order: 0, description: "Teacher frames the shiur: chesed is often taught as a 'nice thing to do.' Today we're learning it as a serious halachic subject." },
        { duration: "35 min", title: "Chevrusa — round one", order: 1, description: "Students work through sources 1–4: the Torah commandments related to chesed." },
        { duration: "15 min", title: "Shiur — round one debrief", order: 2, description: "Teacher clarifies and develops the sources." },
        { duration: "25 min", title: "Chevrusa — round two", order: 3, description: "Students work through sources 5–7: Rishonim on the scope of the obligation." },
        { duration: "5 min", title: "Closing shiur", order: 4, description: "Teacher ties together the thread: chesed is simultaneously a Torah obligation, a midah, and a defining characteristic of the Jewish people." },
      ],
      discussion: [
        "The Gemara says gemilus chassadim has no shiur (measure). What does that mean in practice?",
        "Is there a difference between being obligated to do chesed and wanting to do chesed?",
        "If chesed is an obligation, what happens when I failed to help someone who needed me?",
      ],
    },
    {
      id: 7,
      slug: "one-klal-many-schools",
      theme: "Ahavas Yisrael",
      title: "One Klal, Many Schools",
      description:
        "Students reflect on what connects Jews across different communities and how everyday chesed builds achdus.",
      grade: "ms" as const,
      timeMinutes: 40,
      prep: "Minimal" as const,
      files: ["lesson-plan.pdf"],
      objectives: [
        "Articulate what Jews in different communities share despite surface differences",
        "Understand ahavas Yisrael as an active obligation, not just a warm feeling",
        "Identify one concrete act of chesed that connects them to a Jew they've never met",
      ],
      materials: [
        "Whiteboard or flip chart for class brainstorm",
        "Optional: photos of Jewish communities from different countries",
      ],
      steps: [
        { duration: "5 min", title: "Opening question", order: 0, description: "If a Jewish student from Israel, from Ethiopia, and from Brooklyn all sat in this room, what would they have in common?" },
        { duration: "12 min", title: "The concept of achdus", order: 1, description: "What is the difference between unity and uniformity? Source: kol Yisrael areivim zeh lazeh." },
        { duration: "15 min", title: "Chesed as connection", order: 2, description: "In pairs: if chesed is how we connect to each other, what forms of chesed build connections between people who are very different?" },
        { duration: "8 min", title: "One action", order: 3, description: "Each student writes down one specific action this week that connects them to a Jew they don't know." },
      ],
      discussion: [
        "Is it possible to love someone you've never met? What would that look like in practice?",
        "Are there Jews you find it harder to feel connected to? What does the mitzvah of ahavas Yisrael ask of us?",
        "How is ahavas Yisrael different from just being kind to the people immediately around you?",
      ],
    },
    {
      id: 8,
      slug: "small-acts-big-difference",
      theme: "Kindness in Action",
      title: "Small Acts, Big Difference",
      description:
        "Interactive stations where students practice micro-chesed: holding a door, asking someone's name, noticing who sits alone.",
      grade: "es" as const,
      timeMinutes: 60,
      prep: "Moderate" as const,
      files: ["lesson-plan.pdf", "station-cards.pdf"],
      objectives: [
        "Experience chesed as something done in small moments, not only big organized projects",
        "Practice three specific micro-chesed behaviors in a structured setting",
        "Connect small acts to their real impact on the person receiving them",
      ],
      materials: [
        "Station cards — 1 set per 3 stations (included in download, print and cut)",
        "Optional: small stickers or stamps for the reflection card at the end",
      ],
      steps: [
        { duration: "5 min", title: "Introduction", order: 0, description: "Ask: does chesed have to be a big thing? What is the smallest act of chesed you've ever seen?" },
        { duration: "40 min", title: "Station rotations (3 stations, ~13 min each)", order: 1, description: "Station 1 — Holding the door. Station 2 — Learning someone's name. Station 3 — Noticing who sits alone." },
        { duration: "10 min", title: "Whole-class debrief", order: 2, description: "What was easy? What was awkward? Why does it sometimes feel strange to do small chesed?" },
        { duration: "5 min", title: "Commitment card", order: 3, description: "Each student writes one small act of chesed they will do by the end of today." },
      ],
      discussion: [
        "Does the person doing the chesed feel it as much as the person receiving it? Why or why not?",
        "What is the difference between being polite and doing chesed?",
        "Why do you think some people find it hard to do small chesed, even when they mean well?",
      ],
    },
    {
      id: 9,
      slug: "middos-that-make-chesed-possible",
      theme: "Middos",
      title: "Middos That Make Chesed Possible",
      description:
        "Connecting character traits — patience, generosity, humility — to real chesed practice. Includes a personal middos goal-setting activity.",
      grade: "hs" as const,
      timeMinutes: 60,
      prep: "Minimal" as const,
      files: ["lesson-plan.pdf", "reflection-worksheet.pdf"],
      objectives: [
        "Identify the middos that underlie consistent chesed practice",
        "Analyze why chesed breaks down in specific situations — and which middah is missing",
        "Set a concrete middah goal tied to a specific chesed behavior they want to develop",
      ],
      materials: [
        "Reflection and goal-setting worksheet — 1 per student (included in download)",
      ],
      steps: [
        { duration: "8 min", title: "Opening exercise", order: 0, description: "Ask students to recall a time they wanted to help someone but didn't. What stopped them?" },
        { duration: "15 min", title: "Middos mapping", order: 1, description: "Teacher-led: take three common chesed situations. For each: what specific middah do you need to actually help?" },
        { duration: "20 min", title: "Personal middos assessment", order: 2, description: "Students complete the reflection worksheet: rating themselves on five key middos." },
        { duration: "12 min", title: "Goal setting", order: 3, description: "Each student chooses one middah to work on and one specific chesed context where they'll practice it." },
        { duration: "5 min", title: "Closing", order: 4, description: "The Ramchal says you can work on middos the same way you'd learn a skill — with practice, repetition, and awareness." },
      ],
      discussion: [
        "Is it possible to do chesed without the right middah behind it?",
        "Why do we sometimes find it easier to do chesed for strangers than for the people closest to us?",
        "The Ramchal says all middos can be developed with practice. Do you believe that?",
      ],
    },
  ];

  for (const lesson of lessons) {
    const { files, objectives, materials, steps, discussion, ...lessonData } = lesson;

    await prisma.lessonPlan.upsert({
      where: { id: lessonData.id },
      update: {},
      create: {
        ...lessonData,
        files: {
          create: files.map((name, i) => ({ name, url: `/downloads/lessons/${lessonData.slug}/${name}`, order: i })),
        },
        objectives: {
          create: objectives.map((text, i) => ({ text, order: i })),
        },
        materials: {
          create: materials.map((text, i) => ({ text, order: i })),
        },
        steps: {
          create: steps,
        },
        discussion: {
          create: discussion.map((text, i) => ({ text, order: i })),
        },
      },
    });
  }

  console.log(`✓ Seeded ${lessons.length} lesson plans`);

  // ─── Products ──────────────────────────────────────────────────────────────
  const products = [
    { id: "prod_chesed-journal", name: "JOC Chesed Student Journal", description: "A full-year student chesed journal — goal-setting, tracking, and reflection pages for 32 weeks. Bulk pricing available.", price: 2200, unit: "per copy" },
    { id: "prod_classroom-kit", name: "Chesed Classroom Starter Kit", description: "Everything to launch a year-long chesed culture in your classroom. Posters, tracker boards, lesson plan bundle, student journals (class set of 32), and a teacher guide.", price: 18900, unit: "one-time" },
    { id: "prod_app-enrollment", name: "JOC App — Annual School License", description: "Unlimited student enrollment in the JOC chesed-tracking app for one academic year. Students log acts of chesed; you see class-wide data.", price: 48000, unit: "per year" },
    { id: "prod_poster-pack", name: "Classroom Poster Pack", description: "12 high-resolution chesed-themed classroom posters. Supplied as print-ready PDFs at 300 dpi, any size up to 36×48\".", price: 2900, unit: "per pack" },
    { id: "prod_source-sheets", name: "Halacha of Chesed Source Sheet Bundle", description: "20 prepared source sheets on core chesed topics — hakaras hatov, gemilus chassadim, bikur cholim, and more. Formatted for chevrusa and frontal shiur.", price: 1800, unit: "per bundle" },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  console.log(`✓ Seeded ${products.length} products`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
