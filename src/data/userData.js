// Breeze user profiles — demo dataset
// Sources: Gmail, Google Calendar, Notion, Slack, GitHub, Health, LinkedIn, etc.
// Fetched: 2026-03-31

// ── Ronnie Cheung · USC Junior ────────────────────────────────────────────────
const ronnie = {
  name: "Ronnie Cheung",
  role: "USC Junior · LavaLab + Meridian Founder · Perplexity Campus Activator",
  age: 21,
  year: "Junior",
  weeks_on_breeze: 6,
  apps_connected: ["Google Calendar", "Gmail", "Notion", "Slack", "Google Drive", "LinkedIn", "Discord", "GitHub"],
  conversation_insights: [
    "Ronnie is building TWO products: LavaLab (with a full team) and Meridian (with Turat, Johnny, and Kaitlyn) — separately from each other",
    "Nuria Wolfe emailed him twice in March about his London internship search. He hasn't replied to either. She's actively trying to help.",
    "He has a tuition payment installment due April 3 — currently unread and not acted on",
    "He sent an outreach email to tigerconsulting@gmail.com about the Stock Pitch Competition — it bounced. He doesn't know.",
    "International student — was pursuing London internships. Pays tuition via Flywire. Uses MPOWER Financing.",
    "Perplexity shipped him 2 packages on March 26 via DHL — campus activator merch for events"
  ],
  entities: [
    {
      id: "e1",
      name: "LavaLab",
      label: "Startup · Week 6",
      type: "group",
      strength: 0.95,
      orbit_ring: 1,
      source: ["Notion", "Calendar"],
      detail: "USC's top startup incubator. 6 weeks in: pitch deck done, customer interviews complete, weekly traction reports, MVP in progress. Notion workspace has 30+ pages. Last edited 11:34pm last night.",
      conversationBadge: true
    },
    {
      id: "e2",
      name: "Meridian",
      label: "Turat · Johnny · Kaitlyn",
      type: "group",
      strength: 0.88,
      orbit_ring: 1,
      source: ["Gmail", "Calendar"],
      detail: "A SECOND product Ronnie is building — an app with location triggering, voice/photo toggle, and a scrollable timeline/feed of logs. Turat Zheksheev (USC '28) is sending MVP demos to Ronnie, Johnny, and Kaitlyn. Ronnie is the product lead directing features. Running in parallel with LavaLab.",
      conversationBadge: true
    },
    {
      id: "e3",
      name: "Alex Tsai",
      label: "Perplexity · Mentor",
      type: "person",
      strength: 0.89,
      orbit_ring: 1,
      source: ["Calendar", "Gmail"],
      detail: "alex.tsai@perplexity.ai. Met 3 times since December 2025. Sent Ronnie the updated outreach copy for the Stock Pitch Competition on March 20. The person who recruited Ronnie as a Campus Activator. Most valuable professional relationship in Ronnie's network.",
      conversationBadge: false
    },
    {
      id: "e4",
      name: "Perplexity",
      label: "Comet Activator · Dub affiliate",
      type: "routine",
      strength: 0.86,
      orbit_ring: 1,
      source: ["Calendar", "Gmail"],
      detail: "Official Perplexity Comet Campus Activator. Manager: Ashna Porbanderwala (Student Growth @Perplexity). She gave Ronnie access to university Slack channels to send announcements. 2 packages shipped March 26 via DHL. Also a Dub.co partner — getting paid for referral links.",
      conversationBadge: false
    },
    {
      id: "e5",
      name: "Nuria Wolfe",
      label: "Emailed twice — no reply",
      type: "person",
      strength: 0.29,
      orbit_ring: 3,
      source: ["Gmail"],
      detail: "nuria.wolfe@marshall.usc.edu — Marshall Career Advisor. Emailed March 4 and March 9 about London internship search. Both unread. She's actively trying to help him. He's not seeing these.",
      drifting: true,
      conversationBadge: false
    },
    {
      id: "e6",
      name: "Class stack",
      label: "POSC·BUAD·CSCI·ECON·TAC",
      type: "pattern",
      strength: 0.91,
      orbit_ring: 1,
      source: ["Calendar"],
      detail: "5 classes: POSC 130 (18x/mo), BUAD 313, CSCI 114, ECON 352, TAC 216. Stack on the same days creating 3-4 event blocks. POSC 130 professor emailed about a GRS course grade."
    },
    {
      id: "e7",
      name: "Inbox",
      label: "74% unread · things slipping",
      type: "pattern",
      strength: 0.93,
      orbit_ring: 1,
      source: ["Gmail"],
      detail: "74% of inbox unread. Currently missed: Nuria Wolfe's 2 follow-ups, tuition installment due April 3, bounced outreach to tigerconsulting@gmail.com. This isn't avoidance — it's the cost of running 5 things at once."
    },
    {
      id: "e8",
      name: "Tuition due April 3",
      label: "Payment plan · UNREAD",
      type: "pattern",
      strength: 0.97,
      orbit_ring: 1,
      source: ["Gmail"],
      detail: "Payment Plan Installment due 04/03/2026 — email from uscsfs@fs.usc.edu, currently unread. Ronnie pays via Flywire (international student). Also has MPOWER Financing. 3 days away.",
      drifting: false
    },
    {
      id: "e9",
      name: "London internship",
      label: "Stalled · international student",
      type: "routine",
      strength: 0.41,
      orbit_ring: 3,
      source: ["Gmail"],
      detail: "Was pursuing non-investment internships in London. Nuria Wolfe's emails reference this: 'tougher to apply as an international student.' No recent progress. Finance track pivoted domestic instead.",
      drifting: true
    },
    {
      id: "e10",
      name: "Finance track",
      label: "JPM · MS · Apple · BCG",
      type: "routine",
      strength: 0.74,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "Active on multiple finance/consulting recruiting tracks: JPMorgan, Morgan Stanley, BCG x USC Coffee Chat, Apple Internship Resume Book (due April 3). McKinsey x BTG Ideation Challenge invite. Deadline-reactive, not calendar-blocking."
    },
    {
      id: "e11",
      name: "Turat Zheksheev",
      label: "Meridian · USC '28",
      type: "person",
      strength: 0.79,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "zhekshee@usc.edu, USC Viterbi '28. Sending MVP demos for Meridian at 10-11pm nightly. Highly active co-founder.",
      conversationBadge: false
    },
    {
      id: "e12",
      name: "Bounced outreach",
      label: "tigerconsulting@gmail.com",
      type: "pattern",
      strength: 0.62,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "Ronnie emailed tigerconsulting@gmail.com about the Perplexity Stock Pitch Competition. It bounced: 'Returned mail: see transcript for details.' He has not re-sent. Tiger Consulting never received it."
    },
    {
      id: "e13",
      name: "Late-night mode",
      label: "11pm+ · both projects",
      type: "pattern",
      strength: 0.89,
      orbit_ring: 1,
      source: ["Notion", "Gmail"],
      detail: "Real work on both Meridian and LavaLab happens after midnight. Turat sends demos at 10-11pm. Ronnie's Notion is edited past 11pm. Morning classes (POSC 130 at 8am) are paying the price.",
      conversationBadge: false
    },
    {
      id: "e14",
      name: "Sumer Hir",
      label: "USC · close in fall · quiet now",
      type: "person",
      strength: 0.65,
      orbit_ring: 2,
      source: ["Calendar"],
      detail: "sumerhir@usc.edu. Coffee chat Sept 18, meetings Nov 11 and Nov 17. Highest recurring 1:1 contact in fall. No meetings visible in spring.",
      drifting: false
    },
    {
      id: "e15",
      name: "Johnny",
      label: "Meridian · AI engineer",
      type: "person",
      strength: 0.72,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "Handles the Claude API and AI logic for Meridian. Part of the nightly build loop with Turat and Kaitlyn.",
      conversationBadge: true
    },
    {
      id: "e16",
      name: "Kaitlyn",
      label: "Meridian · design lead",
      type: "person",
      strength: 0.70,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "Design lead on Meridian. Part of the nightly build loop. Design-to-engineering handoffs in late-night email threads.",
      conversationBadge: true
    },
    {
      id: "e17",
      name: "Ashna Porbanderwala",
      label: "Perplexity · Student Growth",
      type: "person",
      strength: 0.68,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "Student Growth at Perplexity. Day-to-day manager for the Comet Campus Activator program. Arranged the 2 DHL packages. Operationally important.",
      drifting: false
    },
    {
      id: "e18",
      name: "April 3 deadline cluster",
      label: "Tuition + Apple Resume Book",
      type: "pattern",
      strength: 0.97,
      orbit_ring: 1,
      source: ["Gmail"],
      detail: "Two high-stakes deadlines on the same day: tuition payment (unread, Flywire) AND Apple Internship Resume Book. Neither is calendared. Tuition email unread since March 24.",
      drifting: false
    }
  ],
  patterns: [
    { id: "p1", from_entity: "e6", to_entity: "e7", label: "Dense class days → inbox ignored", confidence: 0.91, occurrences: "9/13", action: "Flag urgent emails before heavy class days" },
    { id: "p2", from_entity: "e13", to_entity: "e6", label: "Late-night builds → rough 8am class mornings", confidence: 0.87, occurrences: "6/7", action: "Protect mornings after late build sessions" },
    { id: "p3", from_entity: "e7", to_entity: "e5", label: "Inbox blindness → Nuria ghosted twice", confidence: 0.99, occurrences: "2/2", action: "Surface Nuria's March 9 email — she's trying to help" },
    { id: "p4", from_entity: "e4", to_entity: "e3", label: "Perplexity role ← Alex Tsai relationship", confidence: 0.95, occurrences: "3/3", action: "Highest-value relationship — protect the meeting cadence" },
    { id: "p5", from_entity: "e1", to_entity: "e13", label: "LavaLab sprint weeks → midnight Notion sessions", confidence: 0.88, occurrences: "5/6", action: "Set a hard cutoff for LavaLab work on class-before mornings" },
    { id: "p6", from_entity: "e11", to_entity: "e13", label: "Turat's 11pm demos → Ronnie's late reply loop", confidence: 0.92, occurrences: "4/4", action: "Async Meridian reviews — don't let demos trigger same-night sessions" },
    { id: "p7", from_entity: "e7", to_entity: "e18", label: "Inbox blindness → April 3 deadlines at risk", confidence: 0.97, occurrences: "2/2", action: "Surface tuition email + Apple deadline now" },
    { id: "p8", from_entity: "e10", to_entity: "e5", label: "Finance recruiting active → Nuria still unread", confidence: 0.85, occurrences: "1/1", action: "Reply to Nuria — she's a direct path to London internship goals" }
  ],
  stats: { nudges_sent: 23, nudges_responded: 18, actions_proposed: 9, actions_confirmed: 7, profile_completeness: 0.74 },
  profile_summary: {
    routines: [
      "LavaLab — Week 6 sprint, Notion edited past 11pm this week",
      "Meridian — separate app with Turat, Johnny, Kaitlyn; MVP demos exchanged nightly",
      "Perplexity Activator — outreach, Ashna as manager, 2 packages inbound, Dub affiliate",
      "5 classes — POSC 130 most demanding, TAC 216 most relevant to his work"
    ],
    communication: [
      "74% inbox unread — 3 things actively slipping right now",
      "Nuria Wolfe emailed twice about London internships — both unread",
      "Bounced outreach to tigerconsulting@gmail.com — he doesn't know it failed",
      "Turat emails at 11pm, Ronnie responds; urgent items get immediate action"
    ],
    relationships: [
      "Alex Tsai (Perplexity) — most valuable professional contact, 3 meetings since Dec",
      "Turat Zheksheev — closest active collaborator, sending MVP demos nightly",
      "Nuria Wolfe — actively trying to help with London internship search, being ghosted",
      "Sumer Hir — close USC friend, 3 meetings in fall, quiet in spring"
    ],
    patterns: [
      "Dense Tues/Thu classes → inbox ignored → things slip silently (91%)",
      "Late-night build sessions → structural sleep debt (87%)",
      "Inbox blindness: 2 missed Nuria emails, 1 unknown bounce, tuition due April 3"
    ],
    decisions: [
      "Running 2 products, 5 classes, campus activator role, and finance recruiting simultaneously",
      "London internship dream stalled — pivoted to domestic track, never fully processed",
      "International student navigating US recruiting — harder path, less acknowledged"
    ]
  }
};


// ── Maya Chen · USC Sophomore ─────────────────────────────────────────────────
const maya = {
  name: "Maya Chen",
  role: "USC Sophomore · CS + Pre-med · Research Lab · ACM",
  age: 19,
  year: "Sophomore",
  weeks_on_breeze: 4,
  apps_connected: ["Google Calendar", "Gmail", "GitHub", "Notion", "Apple Health", "Apple Notes"],
  conversation_insights: [
    "Maya is running 19 units: CS major with full pre-med prerequisites (BIO, CHEM, MATH) simultaneously",
    "NSF REU application is due April 10 — she's completed 2 of 3 sections but hasn't touched it in 5 days",
    "Dr. Kim's email about the research presentation moving to April 15 has been unread for 6 days",
    "Academic advisor Dr. Flores has emailed twice about a GPA dip — Maya hasn't responded to either",
    "Jamie Torres has been texting at 1–2am every night for the past two weeks — something is wrong",
    "22 of her last 30 GitHub commits happened after midnight — her real work window is 11pm–3am"
  ],
  entities: [
    {
      id: "m1",
      name: "Research Lab",
      label: "Dr. Kim · Neuro-AI · Week 14",
      type: "group",
      strength: 0.92,
      orbit_ring: 1,
      source: ["Calendar", "Gmail", "GitHub"],
      detail: "Dr. Sarah Kim's computational neuroscience lab. Maya is a first-year research assistant studying AI-assisted fMRI interpretation. Lab meetings Mon/Wed/Fri, 3pm. Presentation date just moved up to April 15 — Maya hasn't seen the email. 14 weeks of data collection.",
      conversationBadge: true
    },
    {
      id: "m2",
      name: "Pre-med track",
      label: "BIO 120 · CHEM 105A · MATH 126",
      type: "routine",
      strength: 0.87,
      orbit_ring: 1,
      source: ["Calendar", "Notion"],
      detail: "Full pre-med prereqs: BIO 120 (3 hrs/week), CHEM 105A (4 hrs/week + lab Thursdays), MATH 126 (Calculus II). Anki flashcard deck has 1,847 cards. CHEM 105A midterm is April 12 — she has 3 unreviewed problem sets.",
      conversationBadge: false
    },
    {
      id: "m3",
      name: "ACM USC",
      label: "Research Lead · Demo Day April 18",
      type: "group",
      strength: 0.75,
      orbit_ring: 1,
      source: ["Calendar", "Gmail"],
      detail: "Association for Computing Machinery at USC. Maya leads the AI research subgroup. ACM Demo Day is April 18 — she's presenting her lab work. 12-person subgroup, weekly meetings Tuesdays 6pm. Last week's meeting had 5 attendees (usually 10+).",
      conversationBadge: false
    },
    {
      id: "m4",
      name: "Dr. Sarah Kim",
      label: "Research advisor · unread email",
      type: "person",
      strength: 0.84,
      orbit_ring: 1,
      source: ["Calendar", "Gmail"],
      detail: "kim@neuro.usc.edu — Maya's PI. Emailed March 25: 'Presentation moved to April 15 — you'll need your full model results by April 12.' Maya hasn't seen it. Dr. Kim also CC'd Maya on a grant update that requires a student acknowledgment form by April 7.",
      conversationBadge: true
    },
    {
      id: "m5",
      name: "NSF REU",
      label: "Section 3 missing · April 10",
      type: "pattern",
      strength: 0.95,
      orbit_ring: 1,
      source: ["Gmail", "Notion"],
      detail: "NSF Research Experience for Undergraduates — summer research fellowship at Stanford. Maya completed sections 1 (personal statement) and 2 (CV) in February. Section 3 (research proposal, 500 words) is blank. Application portal shows deadline April 10. She hasn't opened the draft in 5 days.",
      drifting: false
    },
    {
      id: "m6",
      name: "Jamie Torres",
      label: "Close friend · 1am texts · 14 nights",
      type: "person",
      strength: 0.72,
      orbit_ring: 2,
      source: ["Apple Notes", "Gmail"],
      detail: "Best friend from freshman dorms. Has been texting Maya at 1–2am every night for 14 consecutive nights. Tone has shifted from venting to withdrawal. Maya is responding but it's cutting into sleep. This is more serious than Jamie is letting on.",
      conversationBadge: true
    },
    {
      id: "m7",
      name: "CS courses",
      label: "CSCI 104 · CSCI 170 · 19 units",
      type: "pattern",
      strength: 0.88,
      orbit_ring: 1,
      source: ["Calendar", "GitHub"],
      detail: "CSCI 104 (Data Structures, 4 units) and CSCI 170 (Discrete Math, 3 units) plus full pre-med load. GitHub shows 3 programming assignments submitted within 2 hours of midnight deadline. CSCI 104 PA5 is due April 9 — she hasn't started.",
      conversationBadge: false
    },
    {
      id: "m8",
      name: "Dr. Flores",
      label: "Advisor · 2 emails · no reply",
      type: "person",
      strength: 0.30,
      orbit_ring: 3,
      source: ["Gmail"],
      detail: "flores@usc.edu — Academic Progress Advisor. Emailed March 8: 'Your GPA this semester is below the threshold for research course credit — let's talk.' Emailed again March 18: 'Following up on my previous note.' Maya has not replied to either. The situation may be resolvable.",
      drifting: true,
      conversationBadge: false
    },
    {
      id: "m9",
      name: "Late-night mode",
      label: "11pm–3am · GitHub + Anki",
      type: "pattern",
      strength: 0.87,
      orbit_ring: 1,
      source: ["GitHub", "Apple Health"],
      detail: "22 of last 30 GitHub commits between 11pm–3am. Apple Health shows average sleep: 5.4 hours. Anki review sessions peak at 11:30pm. BIO 120 lecture at 8am. Pattern: lab work until 8pm → dinner → respond to Jamie → code or study until 3am → 5 hours sleep.",
      conversationBadge: false
    },
    {
      id: "m10",
      name: "CSCI 104 TA",
      label: "Grade backlog · student complaint",
      type: "routine",
      strength: 0.66,
      orbit_ring: 2,
      source: ["Gmail", "Calendar"],
      detail: "Teaching assistant for CSCI 104. Office hours Wednesdays 3–5pm. Has a backlog of 14 ungraded submissions from PA3 (due 12 days ago). One student emailed the professor about the delay. Professor has not yet forwarded to Maya — but it's coming.",
      conversationBadge: false
    },
    {
      id: "m11",
      name: "Emma Patel",
      label: "Study group · going quiet",
      type: "person",
      strength: 0.58,
      orbit_ring: 3,
      source: ["Gmail", "Calendar"],
      detail: "emmap@usc.edu — was the anchor of Maya's CHEM 105A study group (4 people). Emma sent a message March 20: 'I think we need to regroup — everyone's going in different directions.' Study group hasn't met since March 14. CHEM midterm is April 12. Maya has not replied.",
      drifting: true,
      conversationBadge: false
    },
    {
      id: "m12",
      name: "Anki grind",
      label: "1,847 cards · 3 decks",
      type: "pattern",
      strength: 0.74,
      orbit_ring: 2,
      source: ["Apple Health", "Notion"],
      detail: "Active Anki decks: BIO 120 (812 cards), CHEM 105A (743 cards), Neuroscience (292 cards). Average 68 cards/day reviewed. Sessions at 11:15pm → 12:45am. High retention rate (89%) but she is not keeping up with new CHEM material from the past 3 lectures.",
      conversationBadge: false
    },
    {
      id: "m13",
      name: "GitHub activity",
      label: "Late commits · 3 PAs this semester",
      type: "pattern",
      strength: 0.83,
      orbit_ring: 1,
      source: ["GitHub"],
      detail: "3 of 4 programming assignments submitted within 1 hour of deadline. All after 11pm. Most productive coding period: 12am–2am. CSCI 104 PA5 (graph algorithms, 8 edge cases) due April 9 — no commits yet in the repo.",
      conversationBadge: false
    },
    {
      id: "m14",
      name: "April 7 grant form",
      label: "Dr. Kim CC'd · unread",
      type: "pattern",
      strength: 0.91,
      orbit_ring: 1,
      source: ["Gmail"],
      detail: "Dr. Kim CC'd Maya on a federal research grant renewal email. Student acknowledgment form required by April 7. If Maya doesn't sign, it could affect lab funding and her research credit for the semester. Maya has not opened this email.",
      drifting: false
    }
  ],
  patterns: [
    { id: "mp1", from_entity: "m9", to_entity: "m2", label: "3am coding → CHEM problem sets skipped", confidence: 0.89, occurrences: "7/9", action: "Block CHEM review into afternoons before lab shifts" },
    { id: "mp2", from_entity: "m6", to_entity: "m9", label: "Jamie's 1am texts → sleep cut to 5h", confidence: 0.84, occurrences: "14/14", action: "Check in on Jamie directly — this is a pattern, not a phase" },
    { id: "mp3", from_entity: "m5", to_entity: "m14", label: "NSF section 3 + grant form both unstarted → April window closing", confidence: 0.95, occurrences: "2/2", action: "Block 2 hours this weekend for NSF section 3" },
    { id: "mp4", from_entity: "m8", to_entity: "m2", label: "Dr. Flores unanswered → research credit at risk", confidence: 0.91, occurrences: "2/2", action: "Email Dr. Flores today — the GPA issue may be fixable" },
    { id: "mp5", from_entity: "m10", to_entity: "m4", label: "TA grading backlog → professor complaint incoming", confidence: 0.81, occurrences: "1/1", action: "Grade PA3 submissions before student escalates" },
    { id: "mp6", from_entity: "m3", to_entity: "m1", label: "ACM Demo Day + lab presentation same week", confidence: 0.88, occurrences: "1/1", action: "April 15 lab + April 18 ACM — both need model results by April 12" }
  ],
  stats: { nudges_sent: 17, nudges_responded: 13, actions_proposed: 7, actions_confirmed: 5, profile_completeness: 0.71 },
  profile_summary: {
    routines: [
      "Research lab — Mon/Wed/Fri, presentation moved to April 15 (unread)",
      "Pre-med prereqs — BIO 120, CHEM 105A, MATH 126 running in parallel with CS",
      "ACM USC Research Lead — Demo Day April 18",
      "CSCI 104 TA — office hours Wed, grading backlog building"
    ],
    communication: [
      "Dr. Kim's email (presentation date change) unread 6 days",
      "Dr. Flores (academic advisor) emailed twice about GPA — no reply",
      "Emma Patel (study group) sent a warning message March 20 — no reply",
      "Jamie Torres texting 1–2am nightly for 2 weeks — Maya is responding but at a cost"
    ],
    relationships: [
      "Dr. Sarah Kim — research mentor, most important academic relationship",
      "Jamie Torres — closest friend, something is wrong, Maya is the support",
      "Emma Patel — study group anchor, going quiet before CHEM midterm",
      "Dr. Flores — academic advisor trying to help, being unintentionally ignored"
    ],
    patterns: [
      "11pm–3am work window: GitHub commits + Anki — 5.4h average sleep (89%)",
      "19-unit load with research: no slack in the system when one thing slips",
      "Two unread emails (Dr. Kim + Dr. Flores) are quietly compounding risk"
    ],
    decisions: [
      "Committed to both CS and pre-med — hasn't told anyone she's questioning the pre-med track",
      "Supporting Jamie at the cost of her own sleep — hasn't set a boundary",
      "NSF REU section 3 is 90% there — the only thing stopping her is starting"
    ]
  }
};


// ── Jordan Rivera · USC Junior ────────────────────────────────────────────────
const jordan = {
  name: "Jordan Rivera",
  role: "USC Cinematic Arts Junior · A24 Intern · Filmmaker",
  age: 21,
  year: "Junior",
  weeks_on_breeze: 3,
  apps_connected: ["Google Calendar", "Gmail", "iCloud Drive", "Frame.io", "YouTube Studio", "Venmo"],
  conversation_insights: [
    "Jordan is interning at A24 three days a week while producing his senior thesis short film 'Undercurrent'",
    "Equipment rental fees of $340 are overdue at the USC Cinema equipment office — a hold has been placed on his account",
    "An Epidemic Sound sponsorship email has been unread for 9 days — the deal expires April 5",
    "Marcus Webb at Sony Pictures hasn't heard from Jordan in 11 weeks — the warmest industry contact he has",
    "Sofia Navarro (DP) sends cut notes at 11pm — Jordan edits until 3am, then misses his 9am screenplay workshop",
    "YouTube channel has been dormant for 8 weeks — 104k subscribers, brand partnership pending"
  ],
  entities: [
    {
      id: "j1",
      name: "A24 Internship",
      label: "3 days/week · Development",
      type: "routine",
      strength: 0.91,
      orbit_ring: 1,
      source: ["Calendar", "Gmail"],
      detail: "Development intern at A24, Mon/Wed/Fri. Reading scripts, sitting in on acquisitions calls, writing coverage. Supervisor: Dana Reyes. Jordan's best professional experience — Dana wrote him a strong mid-term review. But 3 days/week is consuming the time he needs for thesis and class.",
      conversationBadge: true
    },
    {
      id: "j2",
      name: "Undercurrent",
      label: "Thesis short · production week April 14",
      type: "group",
      strength: 0.86,
      orbit_ring: 1,
      source: ["Calendar", "iCloud Drive", "Frame.io"],
      detail: "Jordan's senior thesis short film, 18 minutes. Genre: psychological drama. Production week is April 14–18. Pre-production is 60% complete: locations locked, cast confirmed, crew partially assembled. Shot list not finalized. Equipment account hold is blocking camera reservation.",
      conversationBadge: true
    },
    {
      id: "j3",
      name: "Sofia Navarro",
      label: "DP · midnight cuts · 11 nights straight",
      type: "person",
      strength: 0.79,
      orbit_ring: 1,
      source: ["Frame.io", "Gmail"],
      detail: "Director of photography and closest collaborator on Undercurrent. Sends Frame.io cut notes between 11pm–12:30am nightly — has done this 11 nights in a row. Jordan reviews them same-night, which pushes his schedule past 3am. Sofia has excellent instincts and Jordan trusts her completely.",
      conversationBadge: true
    },
    {
      id: "j4",
      name: "YouTube channel",
      label: "104k subs · dormant 8 weeks",
      type: "routine",
      strength: 0.50,
      orbit_ring: 2,
      source: ["YouTube Studio", "Gmail"],
      detail: "Jordan's filmmaking YouTube channel — 104,000 subscribers, content about cinematography and indie filmmaking. Last upload: 8 weeks ago. Average monthly views down 41%. YouTube Studio analytics show subscriber churn accelerating. An Epidemic Sound partnership email has been sitting unread for 9 days.",
      drifting: true,
      conversationBadge: false
    },
    {
      id: "j5",
      name: "Marcus Webb",
      label: "Sony Pictures · 11 weeks silent",
      type: "person",
      strength: 0.25,
      orbit_ring: 3,
      source: ["Gmail"],
      detail: "marcus.webb@sonypictures.com — Director of Development at Sony Pictures. Met Jordan at a USC alumni mixer in January. Emailed February 3: 'Great meeting you — let's stay in touch. Happy to look at your thesis cut when it's ready.' Jordan has not replied in 11 weeks. This is the warmest industry contact he has.",
      drifting: true,
      conversationBadge: false
    },
    {
      id: "j6",
      name: "Equipment hold",
      label: "$340 overdue · camera reservation blocked",
      type: "pattern",
      strength: 0.96,
      orbit_ring: 1,
      source: ["Gmail"],
      detail: "USC School of Cinematic Arts equipment office placed a hold on Jordan's account: $340 in overdue rental fees (C-stands and a grip package from February). Hold blocks all future equipment reservations. Jordan needs an ARRI ALEXA Mini LF for production week April 14 — currently cannot reserve it.",
      drifting: false
    },
    {
      id: "j7",
      name: "Late cut loop",
      label: "Sofia 11pm → Jordan 3am",
      type: "pattern",
      strength: 0.88,
      orbit_ring: 1,
      source: ["Frame.io", "Calendar"],
      detail: "Pattern: Sofia posts Frame.io notes at 11pm → Jordan reviews and responds until 2–3am → misses 9am CTPR 371 Screenplay Workshop. Happened 7 of last 11 mornings. Professor Nakamura has noticed. The late collaboration is productive but the timing is unsustainable before production week.",
      conversationBadge: false
    },
    {
      id: "j8",
      name: "Class backlog",
      label: "CTPR 371 · CTPR 480 · 2 missing",
      type: "pattern",
      strength: 0.72,
      orbit_ring: 2,
      source: ["Gmail", "Calendar"],
      detail: "Two missing submissions: CTPR 371 (Screenplay Workshop) — Scene 7 revision due March 22, unsubmitted. CTPR 480 (Directing Workshop) — shot analysis paper due March 28, unsubmitted. Professor Nakamura gave Jordan a 1-week extension on both. Extension expires April 7.",
      conversationBadge: false
    },
    {
      id: "j9",
      name: "Epidemic Sound deal",
      label: "$1,200 · expires April 5 · unread",
      type: "pattern",
      strength: 0.94,
      orbit_ring: 1,
      source: ["Gmail", "YouTube Studio"],
      detail: "Epidemic Sound partnership email received March 23 — $1,200 for an integration video + 6-month royalty deal. Response required by April 5. Jordan has not opened it. This would be his first brand sponsorship and would directly fund thesis post-production costs.",
      drifting: false
    },
    {
      id: "j10",
      name: "Kyle Nakamura",
      label: "Professor · extension expiring April 7",
      type: "person",
      strength: 0.64,
      orbit_ring: 2,
      source: ["Gmail", "Calendar"],
      detail: "nakamura@cinema.usc.edu — CTPR 371 and CTPR 480 professor. Has already given Jordan a 1-week extension on 2 missing submissions. Sent a follow-up March 29: 'Jordan — checking in on the extension work. April 7 is firm.' Jordan has not replied.",
      conversationBadge: false
    },
    {
      id: "j11",
      name: "Thesis crew",
      label: "6 people · 1 dropped",
      type: "group",
      strength: 0.68,
      orbit_ring: 2,
      source: ["Gmail", "Calendar"],
      detail: "Production crew: DP (Sofia), sound designer (Miguel), gaffer, AC, PA, and a 2nd AD who dropped out last week. Jordan hasn't found a replacement 2nd AD. Production week is April 14 — 2 weeks away. Shot list isn't finalized so the 2nd AD can't be properly onboarded.",
      conversationBadge: false
    },
    {
      id: "j12",
      name: "Isabel Diaz",
      label: "Screenwriting partner · 3 weeks quiet",
      type: "person",
      strength: 0.59,
      orbit_ring: 3,
      source: ["Gmail"],
      detail: "Isabel and Jordan have been co-writing a feature script since November. Last exchange was March 6. Jordan missed two scheduled co-writing sessions. Isabel sent a message March 24: 'I feel like I'm losing you on this project — are we still doing this?' Jordan has not replied.",
      drifting: true,
      conversationBadge: false
    }
  ],
  patterns: [
    { id: "jp1", from_entity: "j1", to_entity: "j8", label: "A24 Mon/Wed/Fri → class assignments skipped", confidence: 0.90, occurrences: "8/9", action: "Block Tue/Thu afternoons for class work before thesis consumes them" },
    { id: "jp2", from_entity: "j7", to_entity: "j8", label: "Sofia midnight notes → 3am edits → 9am workshop missed", confidence: 0.85, occurrences: "7/11", action: "Set a hard async cut-review rule: respond by 10am next day" },
    { id: "jp3", from_entity: "j4", to_entity: "j9", label: "YouTube dormant → Epidemic Sound deal expiring April 5", confidence: 0.93, occurrences: "1/1", action: "Reply to Epidemic Sound today — this $1,200 funds your thesis post-production" },
    { id: "jp4", from_entity: "j6", to_entity: "j2", label: "Equipment hold → ALEXA Mini reservation blocked for April 14", confidence: 0.97, occurrences: "1/1", action: "Pay $340 today — production week depends on this" },
    { id: "jp5", from_entity: "j5", to_entity: "j2", label: "Marcus Webb 11 weeks silent → Sony door closing", confidence: 0.76, occurrences: "1/1", action: "One email to Marcus now — show him the Undercurrent teaser" },
    { id: "jp6", from_entity: "j8", to_entity: "j10", label: "2 missing submissions + Nakamura extension expiring", confidence: 0.88, occurrences: "2/2", action: "Submit Scene 7 revision first — it's the shorter of the two" }
  ],
  stats: { nudges_sent: 11, nudges_responded: 9, actions_proposed: 6, actions_confirmed: 4, profile_completeness: 0.67 },
  profile_summary: {
    routines: [
      "A24 internship — Mon/Wed/Fri, Development, supervisor Dana Reyes",
      "Undercurrent thesis film — production week April 14, pre-production 60% done",
      "Sofia Navarro collaboration — Frame.io notes nightly, cutting until 3am",
      "YouTube channel — 104k subscribers, dormant, brand deal expiring"
    ],
    communication: [
      "Equipment office hold email ignored — $340 blocking thesis camera reservation",
      "Epidemic Sound sponsorship unread 9 days — expires April 5",
      "Marcus Webb (Sony) hasn't heard from Jordan in 11 weeks",
      "Isabel Diaz co-writing partner sent a 'are we still doing this?' message — no reply"
    ],
    relationships: [
      "Sofia Navarro — closest collaborator, excellent DP, late-night loop is unsustainable",
      "Marcus Webb — Sony Pictures, warmest industry contact, going cold",
      "Dana Reyes (A24) — strong mid-term review, doesn't know about Jordan's thesis crunch",
      "Kyle Nakamura — professor who gave an extension, extension expires April 7"
    ],
    patterns: [
      "A24 3 days/week → no time for class → 2 missing submissions + extension expiring (90%)",
      "Midnight cut loop with Sofia → 3am nights → 9am workshop missed 7 of last 11 days (85%)",
      "Equipment hold blocking camera reservation for production week — April 14 is at risk (97%)"
    ],
    decisions: [
      "Chose to fully commit to thesis and A24 — class is the casualty",
      "Letting YouTube go dormant is a calculated risk — but the Epidemic Sound deal is real money",
      "Sofia's late-night collaboration is creatively great — he hasn't wanted to change it"
    ]
  }
};


// ── Priya Mehta · USC Sophomore ───────────────────────────────────────────────
const priya = {
  name: "Priya Mehta",
  role: "USC Marshall Sophomore · Student Government VP · Pre-consulting",
  age: 20,
  year: "Sophomore",
  weeks_on_breeze: 5,
  apps_connected: ["Google Calendar", "Gmail", "Notion", "Google Drive", "LinkedIn", "Slack"],
  conversation_insights: [
    "Priya has 4+ StuGov meetings per week — it has consumed every free slot where consulting prep used to live",
    "McKinsey application has 2 unsubmitted components (recommendation waiver + impact essay) due April 8",
    "Professor Walsh emailed twice about 2 missing BUAD 302 problem sets — Priya has not replied",
    "Net Impact case competition team has gone quiet 3 weeks before nationals — 2 teammates not responding",
    "BCG first-round interview is April 11 — she's done 3 case practices total in the past 4 weeks",
    "Her OPT authorization for a summer internship hasn't been started — international student, needs 90 days processing"
  ],
  entities: [
    {
      id: "pr1",
      name: "Student Government",
      label: "VP External Affairs · 4 meetings/week",
      type: "group",
      strength: 0.93,
      orbit_ring: 1,
      source: ["Calendar", "Gmail", "Slack"],
      detail: "VP of External Affairs for USC Student Government. Responsible for external partnerships, community outreach, and 3 active collaborations with LA nonprofits. 4 StuGov meetings per week (Mon, Wed, Thu, and an all-hands Fri). Last month: organized 2 campus events, sent 14 external partner emails. It's her identity — and it's eating everything else.",
      conversationBadge: true
    },
    {
      id: "pr2",
      name: "BCG application",
      label: "First round April 11 · 3 cases practiced",
      type: "routine",
      strength: 0.88,
      orbit_ring: 1,
      source: ["Calendar", "Notion"],
      detail: "Boston Consulting Group sophomore diversity program. First-round case interview April 11. Priya has done 3 case practices in the past 4 weeks — target for this stage is 12–15. Case prep Notion has 18 pages of frameworks but only 3 mock cases logged. The calendar shows StuGov meetings in every slot where she had planned to prep.",
      conversationBadge: false
    },
    {
      id: "pr3",
      name: "Professor Greenwald",
      label: "BUAD 301 mentor · strong relationship",
      type: "person",
      strength: 0.85,
      orbit_ring: 1,
      source: ["Gmail", "Calendar"],
      detail: "greenwald@marshall.usc.edu — BUAD 301 Business Strategy professor. Wrote Priya a recommendation for her BCG application in February. Has a standing weekly office hour that Priya attends. Professor Greenwald has connections at McKinsey and BCG LA — he's offered to make introductions but Priya hasn't asked.",
      conversationBadge: true
    },
    {
      id: "pr4",
      name: "Net Impact USC",
      label: "Case team · nationals April 19 · 2 silent",
      type: "group",
      strength: 0.77,
      orbit_ring: 2,
      source: ["Gmail", "Slack", "Calendar"],
      detail: "Net Impact USC's national case competition team. Nationals in Washington D.C., April 19. Team of 4: Priya (lead), Aditya, Zoe, and Marcus. Aditya and Zoe have not responded to Slack messages in 8 days. The deck is 40% complete. Priya has not escalated or sent a direct email.",
      conversationBadge: false
    },
    {
      id: "pr5",
      name: "McKinsey deadline",
      label: "2 components missing · April 8",
      type: "pattern",
      strength: 0.95,
      orbit_ring: 1,
      source: ["Gmail", "Notion"],
      detail: "McKinsey Sophomore Leaders Program — application due April 8. Completed: resume (submitted), academic transcript (submitted), video response (submitted). Missing: recommendation waiver form (5 minutes to complete) and impact essay (250 words, not started). McKinsey portal shows application as 'incomplete — 2 items pending.'",
      drifting: false
    },
    {
      id: "pr6",
      name: "Vikram Mehta",
      label: "Brother · USC Marshall alum · Deloitte",
      type: "person",
      strength: 0.72,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "Priya's older brother, USC Marshall '23, now at Deloitte Strategy & Operations in SF. Has gone through BCG and McKinsey recruiting. Texted Priya Feb 28: 'How's the case prep going? Happy to do mocks with you.' Priya hasn't taken him up on it. Last exchange was 3 weeks ago.",
      conversationBadge: true
    },
    {
      id: "pr7",
      name: "Prof. Walsh",
      label: "BUAD 302 · 2 problem sets · no reply",
      type: "person",
      strength: 0.33,
      orbit_ring: 3,
      source: ["Gmail"],
      detail: "walsh@marshall.usc.edu — BUAD 302 Operations Management professor. Emailed March 15: 'I noticed two problem sets haven't been submitted — sets 4 and 5, both overdue.' Emailed again March 24: 'Priya — these are now significantly late. Please respond.' Priya has read both emails but not replied.",
      drifting: true,
      conversationBadge: false
    },
    {
      id: "pr8",
      name: "StuGov calendar load",
      label: "Tue/Thu/Fri blocked · no prep slots",
      type: "pattern",
      strength: 0.91,
      orbit_ring: 1,
      source: ["Calendar"],
      detail: "StuGov has claimed: Monday (External Affairs committee), Wednesday (executive team), Thursday (full council), Friday (partner sync). Priya originally blocked Tue/Thu 3–5pm for consulting prep. Those blocks are now overwritten with StuGov ad-hoc meetings 3 of every 4 weeks. BCG prep hasn't happened in 11 days.",
      conversationBadge: false
    },
    {
      id: "pr9",
      name: "Consulting prep",
      label: "3 cases in 4 weeks · target is 15",
      type: "routine",
      strength: 0.71,
      orbit_ring: 2,
      source: ["Notion", "Calendar"],
      detail: "Victor Cheng case method. Notion has 18 pages of frameworks (market sizing, profitability, M&A). Only 3 mock cases logged since March 1. Partners: Aditya (now unavailable) and a friend at Dartmouth she hasn't contacted in 2 weeks. BCG first round in 12 days.",
      conversationBadge: false
    },
    {
      id: "pr10",
      name: "OPT authorization",
      label: "90-day processing · not started",
      type: "pattern",
      strength: 0.65,
      orbit_ring: 2,
      source: ["Gmail"],
      detail: "International student on F-1 visa. Summer internship (BCG or McKinsey) requires OPT authorization. USCIS processing time: 90 days. Application must be submitted to USC International Services by April 14 to clear by internship start. Priya received the OPT guidance email from USC International Services in February — it is unread.",
      drifting: false
    },
    {
      id: "pr11",
      name: "Simran Kaur",
      label: "Close friend · weekly dinners",
      type: "person",
      strength: 0.68,
      orbit_ring: 2,
      source: ["Calendar"],
      detail: "Close friend from India, also at USC (Dornsife '28). They have a standing Sunday dinner — the one consistent low-pressure routine in Priya's week. Simran is also applying to consulting but a year behind. Priya confides in her more than anyone at USC.",
      conversationBadge: false
    },
    {
      id: "pr12",
      name: "LinkedIn outreach",
      label: "14 unanswered messages",
      type: "pattern",
      strength: 0.56,
      orbit_ring: 3,
      source: ["LinkedIn"],
      detail: "14 LinkedIn connection messages and 3 cold outreach notes from consulting and finance recruiters sitting unread. Among them: a BCG LA recruiter who messaged March 17 about the diversity program. Also a message from a McKinsey analyst at USC who offered to do a mock case — unread for 11 days.",
      drifting: true,
      conversationBadge: false
    }
  ],
  patterns: [
    { id: "pp1", from_entity: "pr8", to_entity: "pr2", label: "StuGov calendar overflow → BCG prep skipped 11 days", confidence: 0.88, occurrences: "3/4 weeks", action: "Lock Tue 3–5pm as uncancellable prep — even from StuGov" },
    { id: "pp2", from_entity: "pr4", to_entity: "pr2", label: "Net Impact team silent → nationals + BCG interview same week", confidence: 0.82, occurrences: "1/1", action: "Email Aditya and Zoe directly today — the deck needs to be done by April 14" },
    { id: "pp3", from_entity: "pr5", to_entity: "pr10", label: "McKinsey incomplete + OPT not started — both due April 8 window", confidence: 0.95, occurrences: "2/2", action: "Recommendation waiver takes 5 minutes — do it now" },
    { id: "pp4", from_entity: "pr7", to_entity: "pr2", label: "BUAD 302 missing sets → professor escalation risk", confidence: 0.91, occurrences: "2/2", action: "Email Prof. Walsh today — late is better than ghosted" },
    { id: "pp5", from_entity: "pr3", to_entity: "pr2", label: "Greenwald has BCG/McKinsey connections — not activated", confidence: 0.84, occurrences: "1/1", action: "Ask Greenwald for an intro to BCG LA this week — he's already offered" },
    { id: "pp6", from_entity: "pr6", to_entity: "pr9", label: "Vikram offered mock cases 3 weeks ago — not taken up", confidence: 0.79, occurrences: "1/1", action: "Text Vikram today — a mock with him is worth 3 solo practices" }
  ],
  stats: { nudges_sent: 19, nudges_responded: 15, actions_proposed: 8, actions_confirmed: 6, profile_completeness: 0.76 },
  profile_summary: {
    routines: [
      "Student Government VP — 4 meetings/week, running external partnerships and campus events",
      "BCG application — first round April 11, dangerously under-prepared",
      "Net Impact case team — nationals April 19, team communication breakdown",
      "BUAD 302 — 2 missing problem sets, professor escalating"
    ],
    communication: [
      "Prof. Walsh emailed twice about missing BUAD 302 sets — read but not replied",
      "McKinsey portal shows 2 items incomplete — 5 minutes away from being complete",
      "BCG LA recruiter messaged on LinkedIn March 17 — unread",
      "Vikram offered mock cases 3 weeks ago — Priya hasn't taken him up on it"
    ],
    relationships: [
      "Prof. Greenwald — mentor with direct BCG/McKinsey connections, not yet activated",
      "Vikram Mehta — brother who's done this exact recruiting, offering help she isn't taking",
      "Simran Kaur — closest friend, Sunday dinners, the only consistent outlet",
      "Net Impact teammates — going silent before the biggest competition of the year"
    ],
    patterns: [
      "StuGov has overwritten every consulting prep block for 3 of 4 weeks (88%)",
      "BCG April 11 + Net Impact nationals April 19 + McKinsey April 8 — all in the same window",
      "OPT processing needs to start by April 14 — she doesn't know this yet"
    ],
    decisions: [
      "StuGov is her identity — she hasn't acknowledged it's directly competing with her consulting goals",
      "Has two people (Greenwald and Vikram) who can meaningfully help — not asking either",
      "The McKinsey application is 95% done — the remaining 5% is a 5-minute form"
    ]
  }
};


// ── Exports ───────────────────────────────────────────────────────────────────
export const userData = ronnie;   // default export for backward compat

export const allUsers = [ronnie, maya, jordan, priya];
