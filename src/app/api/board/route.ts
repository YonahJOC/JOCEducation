import { NextRequest, NextResponse } from "next/server";

const SEED_IDEAS = [
  { id: "1", title: "Chesed Buddy System for New Students", body: "Paired every new student with a 'chesed buddy' for the first month. The buddy introduced them around, sat with them at lunch, and showed them the ropes. End-of-year survey: new students felt settled within two weeks on average.", region: "Brooklyn", school: "Yeshiva Darchei Torah", ts: "3 days ago", likes: 24, grade: "hs" },
  { id: "2", title: "Bikur Cholim Letter Writing Campaign", body: "Had the whole grade write personal letters to hospital patients at Maimonides. Coordinated with a local volunteer group to deliver them. Students were moved when volunteers reported back on the reactions.", region: "Brooklyn", school: "Beis Yaakov of Brooklyn", ts: "1 week ago", likes: 18, grade: "ms" },
  { id: "3", title: "Pre-Shabbos Food Pantry Drive", body: "Every Friday morning, a rotating class collects non-perishables for the local food pantry. Simple, predictable, and the kids own it. Now in its third year.", region: "Lakewood", school: "Beth Medrash Govoha elementary", ts: "2 weeks ago", likes: 41, grade: "es" },
  { id: "4", title: "Visiting Day for Local Elderly", body: "Partnered with the local senior center for monthly class visits. Students prepare a short Torah vort and bring mishloach manos-style packages. The seniors and students both look forward to it.", region: "Chicago", school: "Yeshivas Tiferes Tzvi", ts: "3 weeks ago", likes: 33, grade: "ms" },
  { id: "5", title: "Kindness Shoutout Board", body: "Set up a board in the hallway where students can post anonymous notes about acts of chesed they observed. Changed the social dynamics in the school in a way I didn't expect.", region: "Los Angeles", school: "Valley Torah", ts: "1 month ago", likes: 57, grade: "hs" },
  { id: "6", title: "JOC App Chesed Hours Ceremony", body: "At the end of every month, we do a brief in-class ceremony for students who logged 10+ chesed hours on the JOC App. A certificate and a two-minute sharing. Motivation went up significantly.", region: "Israel", school: "Yeshivat Shaalvim", ts: "1 month ago", likes: 29, grade: "hs" },
  { id: "7", title: "Cross-Grade Chesed Mentorship", body: "Ninth graders mentor third graders on a monthly basis. They plan and run a chesed activity together. Both grades show up differently.", region: "Toronto", school: "Or Chaim Day School", ts: "6 weeks ago", likes: 22, grade: "ms" },
  { id: "8", title: "Chesed Goal Cards for Rosh Hashana", body: "Before Rosh Hashana, each student writes one concrete chesed goal for the coming year on an index card. We seal them in envelopes and return them before Pesach for a check-in. Simple and powerful.", region: "Miami", school: "Scheck Hillel Community School", ts: "2 months ago", likes: 38, grade: "es" },
  { id: "9", title: "Monthly Chesed Challenge Competition", body: "Three class teams compete in a monthly chesed challenge — anonymous judges score on creativity, scale, and documentation. Trophy passed between winning homerooms. The competition element was surprisingly powerful.", region: "Brooklyn", school: "Bnos Yaakov", ts: "2 months ago", likes: 31, grade: "ms" },
  { id: "10", title: "Gratitude Wall in the Cafeteria", body: "Students write one thing they're grateful for on a sticky note every Monday morning. By end of semester the entire wall is covered. We photograph it before taking it down.", region: "Los Angeles", school: "YULA Boys High School", ts: "3 months ago", likes: 44, grade: "hs" },
  { id: "11", title: "Chesed Reflection at Dismissal", body: "Before dismissal every Friday, each student says one act of chesed they did this week. Takes three minutes. After a month it changed what students noticed about their own behavior.", region: "Chicago", school: "Beis Midrash L'Torah", ts: "3 months ago", likes: 19, grade: "es" },
  { id: "12", title: "Peer Teaching for Struggling Students", body: "Identified students who were strong in a subject and paired them with classmates who needed help. Framed entirely as chesed — not tutoring for credit. Both groups performed better on assessments.", region: "Toronto", school: "Eitz Chaim Schools", ts: "4 months ago", likes: 27, grade: "ms" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const region = searchParams.get("region");
  const grade  = searchParams.get("grade");
  const sort   = searchParams.get("sort") ?? "recent";
  const page   = parseInt(searchParams.get("page") ?? "1", 10);
  const limit  = parseInt(searchParams.get("limit") ?? "8", 10);

  let results = [...SEED_IDEAS];

  if (region && region !== "All") results = results.filter((i) => i.region === region);
  if (grade  && grade  !== "all") results = results.filter((i) => i.grade  === grade);
  if (sort === "popular") results.sort((a, b) => b.likes - a.likes);

  const total = results.length;
  const items = results.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ ideas: items, total, page, limit, hasMore: page * limit < total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, body: postBody, region, grade, school } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Stub — persist to DB once connected
  const newPost = {
    id: String(Date.now()),
    title,
    body: postBody ?? "",
    region: region ?? "Other",
    grade: grade ?? "ms",
    school: school || "Anonymous",
    ts: "Just now",
    likes: 0,
  };

  return NextResponse.json(newPost, { status: 201 });
}
