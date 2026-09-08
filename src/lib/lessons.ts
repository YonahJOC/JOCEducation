export type Lesson = {
  id: number;
  theme: string;
  title: string;
  description: string;
  grade: "es" | "ms" | "hs";
  time: number;
  prep: "Minimal" | "Moderate" | "Substantial";
  files: string[];
  objectives: string[];
  materials: string[];
  steps: { duration: string; title: string; description: string }[];
  discussion: string[];
  extension?: string;
};

export const LESSONS: Lesson[] = [
  {
    id: 1,
    theme: "Bein Adam LaChaveiro",
    title: "Seeing the Person in Front of You",
    description: "Students learn to give full attention when someone speaks to them — eye contact, body language, and what it means to truly listen.",
    grade: "es",
    time: 20,
    prep: "Minimal",
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
      { duration: "3 min", title: "Opening story", description: "Share a brief story about someone who felt truly \"seen\" by another person — their face changed, they stopped rushing. Ask: what did that feel like for them? What did the other person do differently?" },
      { duration: "8 min", title: "The role-play", description: "Split into pairs. Partner A shares something about their day while Partner B practices distracted listening (looking away, fidgeting). Switch — this time Partner B gives full attention: eye contact, body turned in, no interrupting. Brief debrief together after each round." },
      { duration: "7 min", title: "Class discussion", description: "What felt different between the two rounds? What does it feel like to be truly listened to? When is it hardest to give our full attention? (Tired, thinking about something else, busy.)" },
      { duration: "2 min", title: "Reflection card", description: "Each student writes or draws: one specific moment today — a name, a place, a situation — when they will give someone their full attention. Cards go home." },
    ],
    discussion: [
      "Why is it hard to give someone your full attention? What gets in the way?",
      "When has someone made you feel truly heard? What did they do that was different?",
      "Is giving attention a form of chesed? Why or why not?",
    ],
    extension: "Ask students to report back the next morning: did they find their moment? What happened? What did the other person do or say?",
  },
  {
    id: 2,
    theme: "Hachnasas Orchim",
    title: "The Open Door: Making Others Feel Welcome",
    description: "Through the lens of Avraham Avinu, students explore what genuine hospitality looks like in school and at home.",
    grade: "ms",
    time: 40,
    prep: "Minimal",
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
      { duration: "10 min", title: "Source study", description: "In chevrusos, students read the source sheet on Avraham welcoming the malachim (Bereishis 18). Focus questions: What specific things did Avraham do? What do we learn from each detail? Why did he run?" },
      { duration: "10 min", title: "Class debrief on sources", description: "Pairs share their observations. Teacher draws out: Avraham ran, didn't wait to be asked, exceeded expectations. What was his mindset — not just his actions? He saw guests as an opportunity, not an interruption." },
      { duration: "10 min", title: "Modern application", description: "What does hachnasas orchim look like in school today? Who are the 'guests' — new students, substitutes, parents visiting? In small groups, brainstorm three specific things their class could do. Concrete and immediate." },
      { duration: "10 min", title: "Commitment and sharing", description: "Each group shares one concrete idea. The class votes on one to implement in the next two weeks. Teacher records the commitment and follows up." },
    ],
    discussion: [
      "Avraham was 99 years old, recovering from his bris, when he ran to greet guests. What does that tell us about how he felt about hachnasas orchim?",
      "Is making someone feel welcome the same as being nice to them? What's the difference?",
      "Who in our school might feel like an outsider right now? What could we do about it — today, this week?",
    ],
    extension: "Students interview a parent or grandparent about a time they felt truly welcomed somewhere. Share at the start of next class — what specific thing did someone do?",
  },
  {
    id: 3,
    theme: "Tzedakah",
    title: "More Than Money: What Tzedakah Really Means",
    description: "A deep look at the different forms of tzedakah — time, attention, expertise — beyond the pushke on the wall.",
    grade: "hs",
    time: 60,
    prep: "Moderate",
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
      { duration: "5 min", title: "Opening provocation", description: "Ask: Is tzedakah about giving people what they need, or giving what we have? Read the Rambam on the eight levels of tzedakah — which is highest, and why does that surprise us?" },
      { duration: "15 min", title: "Conceptual development", description: "Teacher-led: the word tzedakah shares a root with tzedek — justice. What does that imply about obligation? This isn't generosity; it's giving what isn't fully yours to withhold. Who is entitled to receive, and why?" },
      { duration: "20 min", title: "Case study analysis", description: "In pairs, students work through three case studies: giving time instead of money, giving professional expertise, and a harder case (giving to someone you don't like). Each pair answers: What form of tzedakah is being asked? What's the right response? Does the recipient's attitude matter?" },
      { duration: "15 min", title: "Class discussion", description: "Pairs share conclusions. Teacher facilitates disagreements — there's no single right answer on some cases. Draw out: what principles are students applying? Where do they differ, and why?" },
      { duration: "5 min", title: "Personal reflection", description: "Silent writing: what form of tzedakah is easiest for me to give? Hardest? One concrete thing I could give this week that isn't money." },
    ],
    discussion: [
      "Why does the Torah command tzedakah rather than just encourage it? What does that say about the relationship between giver and receiver?",
      "Is there a difference between tzedakah you feel like giving and tzedakah you don't feel like giving? Does the feeling matter?",
      "What would it look like if our school ran on tzedakah principles — students contributing their skills and time to each other?",
    ],
    extension: "Students design a 'tzedakah bank' for the classroom — a system where students offer non-monetary resources (tutoring time, help with a project, a skill) that others can request.",
  },
  {
    id: 4,
    theme: "Bikur Cholim",
    title: "Visiting the Sick: Halacha and Heart",
    description: "Students learn the mitzvah of bikur cholim through halacha and personal stories, then plan a real class visit.",
    grade: "ms",
    time: 40,
    prep: "Moderate",
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
      { duration: "8 min", title: "Personal stories", description: "Has anyone visited a sick person? What happened? What did you say — or not know what to say? Take 2-3 student stories. Then share a brief story of a meaningful visit." },
      { duration: "12 min", title: "Halacha study", description: "Students read the halacha sheet in pairs. Key areas: when to visit, when not to, what to say, what to do during the visit. Central insight: the purpose of the visit is the comfort of the sick person, not the comfort of the visitor." },
      { duration: "10 min", title: "Why Hashem does it", description: "The Gemara says Hashem visited Avraham when he was ill. What do we learn about bikur cholim from this? Is this a chesed or an obligation? What happens to the sick person's illness when they receive a visit?" },
      { duration: "10 min", title: "Class planning", description: "Identify someone in the school community or neighborhood who could use a visit or a letter. Plan together: who, when, what will we do or bring? Assign roles. Teacher follows up in two days." },
    ],
    discussion: [
      "The halacha says not to visit in the first or last three hours of the day. What does this teach us about who the visit is really for?",
      "Is sending a text or a card the same as visiting in person? What is the mitzvah really about?",
      "The Gemara says that whoever visits the sick takes away 1/60th of their illness. What could that mean — literally or figuratively?",
    ],
    extension: "Students write a letter or card to someone who is ill, using the principles from class: focusing on the sick person's comfort, not on the visitor's feelings. The class sends them together.",
  },
  {
    id: 5,
    theme: "Hakaras Hatov",
    title: "Who Do You Thank?",
    description: "A gratitude practice that moves from abstract to personal — students map every person who helped them get to school that morning.",
    grade: "es",
    time: 20,
    prep: "Minimal",
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
      { duration: "3 min", title: "How did you get here?", description: "Ask: how did you get to school this morning? Take a few answers (walked, car, bus). Then push deeper: who made that possible? Who woke you up? Who made your breakfast? Who drove you or walked with you?" },
      { duration: "8 min", title: "Gratitude map", description: "Distribute the worksheet. Students write or draw the name of every person who helped them from waking up to sitting in their seat. Encourage going further: who made the food in your lunch? Who built the road? Who drove the bus driver's own children to school so that driver could be here?" },
      { duration: "6 min", title: "Sharing and reflection", description: "Partners share their maps. Who's on both lists? Who surprised you? Class discussion: what is hakaras hatov — a feeling, an action, or both? What does it feel like when someone acknowledges what you did for them?" },
      { duration: "3 min", title: "One person to thank", description: "Each student identifies one specific person they will thank today — in person, with a note, or with a phone call. Teacher asks at the end of the day: did you do it? What happened when you did?" },
    ],
    discussion: [
      "Is it possible to fully thank someone for everything they've done for you? What does it mean to try?",
      "Are there people who helped you that you'll never be able to thank? What do you do with that feeling?",
      "What's the difference between taking something for granted and hakaras hatov?",
    ],
    extension: "Students write a letter of thanks to someone who rarely gets thanked — a crossing guard, school custodian, cafeteria worker. The class can send them together.",
  },
  {
    id: 6,
    theme: "Chesed in Halacha",
    title: "Mekoros on Chesed: A Source Sheet Lesson",
    description: "A structured chevrusa session exploring primary sources on chesed obligations — designed for a full 90-minute shiur.",
    grade: "hs",
    time: 90,
    prep: "Substantial",
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
      { duration: "10 min", title: "Introduction and framing", description: "Teacher frames the shiur: chesed is often taught as a 'nice thing to do.' Today we're learning it as a serious halachic subject. Preview the sources. What question are we trying to answer: is chesed obligatory, and what does that mean?" },
      { duration: "35 min", title: "Chevrusa — round one", description: "Students work through sources 1–4: the Torah commandments related to chesed (v'ahavta l're'acha, lo ta'amod al dam re'acha), the Gemara on gemilus chassadim, and the Rambam's formulation. Teacher circulates, listening in and giving hints when pairs are stuck." },
      { duration: "15 min", title: "Shiur — round one debrief", description: "Teacher clarifies and develops the sources. Key tensions: Is chesed obligatory or supererogatory? How does it relate to tzedakah? What counts as gemilus chassadim? Does intention matter?" },
      { duration: "25 min", title: "Chevrusa — round two", description: "Students work through sources 5–7: Rishonim on the scope of the obligation, responsa literature on specific cases. Each chevrusa prepares one question or difficulty to bring to the class." },
      { duration: "5 min", title: "Closing shiur", description: "Teacher ties together the thread: chesed is simultaneously a Torah obligation, a midah, and a defining characteristic of the Jewish people. What does that mean for how we actually live — not in theory, but today?" },
    ],
    discussion: [
      "The Gemara says gemilus chassadim has no shiur (measure). What does that mean in practice? Does it mean there's no limit to what we must give?",
      "Is there a difference between being obligated to do chesed and wanting to do chesed? Which is higher? Does the Torah want both?",
      "If chesed is an obligation, what happens when I failed to help someone who needed me?",
    ],
    extension: "Students choose one of the halachic questions raised in the shiur and write a one-page teshuvah arguing for a ruling, citing the sources studied. Pairs read each other's teshuvos.",
  },
  {
    id: 7,
    theme: "Ahavas Yisrael",
    title: "One Klal, Many Schools",
    description: "Students reflect on what connects Jews across different communities and how everyday chesed builds achdus.",
    grade: "ms",
    time: 40,
    prep: "Minimal",
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
      { duration: "5 min", title: "Opening question", description: "If a Jewish student from Israel, from Ethiopia, and from Brooklyn all sat in this room, what would they have in common? Take student answers — push past 'we're all Jewish.' What does that actually mean, concretely?" },
      { duration: "12 min", title: "The concept of achdus", description: "What is the difference between unity and uniformity? Jews are not the same — different minhagim, languages, appearances. But what makes us one nation? Discussion and source: kol Yisrael areivim zeh lazeh — every Jew is responsible for every other Jew." },
      { duration: "15 min", title: "Chesed as connection", description: "In pairs: if chesed is how we connect to each other, what forms of chesed build connections between people who are very different? Brainstorm and share. Teacher draws out: caring for a Jew you've never met — tzedakah to a distant community, bikur cholim for a stranger — is itself an act of ahavas Yisrael." },
      { duration: "8 min", title: "One action", description: "Each student writes down one specific action this week that connects them to a Jew they don't know — in their city, in Israel, anywhere. Not abstract; a name, a place, or a specific act." },
    ],
    discussion: [
      "Is it possible to love someone you've never met? What would that look like in practice — not as a feeling but as an action?",
      "Are there Jews you find it harder to feel connected to? What does the mitzvah of ahavas Yisrael ask of us in those situations?",
      "How is ahavas Yisrael different from just being kind to the people immediately around you?",
    ],
    extension: "Class participates in a chesed project benefiting a Jewish community they have no direct connection to — collecting supplies, writing letters, raising funds. Debrief: how did it feel?",
  },
  {
    id: 8,
    theme: "Kindness in Action",
    title: "Small Acts, Big Difference",
    description: "Interactive stations where students practice micro-chesed: holding a door, asking someone's name, noticing who sits alone.",
    grade: "es",
    time: 60,
    prep: "Moderate",
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
      { duration: "5 min", title: "Introduction", description: "Ask: does chesed have to be a big thing? What is the smallest act of chesed you've ever seen? Take a few answers. Frame: today we practice small. Small is where chesed actually lives, most of the time." },
      { duration: "40 min", title: "Station rotations (3 stations, ~13 min each)", description: "Station 1 — Holding the door: students practice noticing someone behind them and holding the door, then reflect: did you notice the other person's face? Station 2 — Learning someone's name: students practice asking a classmate's name they didn't know and using it in a sentence. Station 3 — Noticing who sits alone: students study a seating arrangement and plan what they'd do if they saw someone eating alone at lunch." },
      { duration: "10 min", title: "Whole-class debrief", description: "What was easy? What was awkward? Why does it sometimes feel strange to do small chesed? What makes someone feel noticed vs. invisible? Did any station surprise you?" },
      { duration: "5 min", title: "Commitment card", description: "Each student writes one small act of chesed they will do by the end of today. Cards collected and redistributed randomly — students try to find out if 'their' act was completed by whoever got their card." },
    ],
    discussion: [
      "Does the person doing the chesed feel it as much as the person receiving it? Why or why not?",
      "What is the difference between being polite and doing chesed? Is there a difference?",
      "Why do you think some people find it hard to do small chesed, even when they mean well and want to?",
    ],
    extension: "The 'chesed spy' challenge: each student is secretly assigned to notice and record one act of chesed they see someone else do, every day for a week. Share discoveries at the end of the week.",
  },
  {
    id: 9,
    theme: "Middos",
    title: "Middos That Make Chesed Possible",
    description: "Connecting character traits — patience, generosity, humility — to real chesed practice. Includes a personal middos goal-setting activity.",
    grade: "hs",
    time: 60,
    prep: "Minimal",
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
      { duration: "8 min", title: "Opening exercise", description: "Ask students to recall a time they wanted to help someone but didn't. What stopped them? Take answers without judgment. List the underlying reasons on the board: too tired, didn't know what to say, worried about how it would look, felt it wasn't their place." },
      { duration: "15 min", title: "Middos mapping", description: "Teacher-led: take three common chesed situations — a classmate is visibly upset, someone drops something in a crowded hallway, a friend asks a favor you don't feel like doing. For each: what specific middah do you need to actually help? Map situation → required middah → what it looks and feels like in practice." },
      { duration: "20 min", title: "Personal middos assessment", description: "Students complete the reflection worksheet: rating themselves on five key middos (patience, generosity, humility, noticing others, follow-through). Not a grade — a starting point. Partners share: where do they agree? Where would they rate each other differently, and why?" },
      { duration: "12 min", title: "Goal setting", description: "Each student chooses one middah to work on and one specific chesed context where they'll practice it. They write a concrete, specific commitment: 'This week, when [situation], I will [behavior].' General goals don't count. Specific is the rule." },
      { duration: "5 min", title: "Closing", description: "The Ramchal says you can work on middos the same way you'd learn a skill — with practice, repetition, and awareness. The worksheet goes home. Students report back in one week: what happened, what they noticed." },
    ],
    discussion: [
      "Is it possible to do chesed without the right middah behind it? Can an act be considered chesed if the person doing it resents it?",
      "Why do we sometimes find it easier to do chesed for strangers than for the people closest to us?",
      "The Ramchal says all middos can be developed with practice. Do you believe that? What does 'practicing' humility actually look like day to day?",
    ],
    extension: "Students keep a one-week middah journal: each day, note one time they noticed the middah they're working on — when it went well and when it didn't. Pure observation, no judgment. Share selectively at the end of the week.",
  },
];

export const GRADE_LABELS: Record<string, string> = {
  all: "All grades",
  es: "Elementary",
  ms: "Middle",
  hs: "High school",
};

export const TIME_LABELS: Record<string, string> = {
  all: "Any length",
  "20": "20 min",
  "40": "40 min",
  "60": "60 min",
  "90": "90 min+",
};

export const STRIPE_COLORS = ["#1E47B8", "#F7941D", "#2C7AC9", "#10233F"];
