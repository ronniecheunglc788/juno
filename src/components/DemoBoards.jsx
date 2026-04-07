import { useState } from 'react';
import CSBoard       from './boards/CSBoard';
import BusinessBoard from './boards/BusinessBoard';
import PremedBoard   from './boards/PremedBoard';
import CreativeBoard from './boards/CreativeBoard';

// ── Mock data ─────────────────────────────────────────────────────
function dback(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function dlabel(n) {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function hr(h) { return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`; }

const ENGINEER = {
  user: { name: 'Alex Chen', id: 'demo' },
  connectedApps: ['github','gmail','googlecalendar','notion','discord'],
  calendar: [
    { title: 'System Design Interview — Google', time: hr(10), isToday: true,  daysUntil: 0, dateLabel: 'Today'    },
    { title: 'Sprint Planning',                  time: hr(14), isToday: true,  daysUntil: 0, dateLabel: 'Today'    },
    { title: 'Anthropic Coffee Chat',            time: hr(11), isToday: false, daysUntil: 1, dateLabel: dlabel(1)  },
    { title: 'LeetCode Weekly Contest',          time: hr(9),  isToday: false, daysUntil: 2, dateLabel: dlabel(2)  },
    { title: 'Intern Offer Deadline',            time: hr(17), isToday: false, daysUntil: 3, dateLabel: dlabel(3)  },
    { title: 'Hackathon Kickoff',                time: hr(18), isToday: false, daysUntil: 7, dateLabel: dlabel(7)  },
  ],
  emails: [
    { subject: 'Your application to Stripe Engineering',   from: 'Stripe Recruiting',  fromEmail: 'recruiting@stripe.com',  isUnread: true,  date: dback(0), snippet: 'We reviewed your application and would love to schedule a call' },
    { subject: 'Internship Offer — Meta SWE Summer 2025',  from: 'Meta University',    fromEmail: 'university@meta.com',    isUnread: true,  date: dback(1), snippet: 'Congratulations! We are pleased to extend an offer' },
    { subject: 'Re: Pull Request #247',                    from: 'Sarah Kim',          fromEmail: 'skim@co.com',            isUnread: true,  date: dback(0), snippet: 'Left some comments on the auth middleware' },
    { subject: 'SWE Intern at Databricks',                 from: 'LinkedIn Recruiter', fromEmail: 'recruit@linkedin.com',   isUnread: false, date: dback(2), snippet: "Hi Alex, I think you'd be a great fit" },
    { subject: 'Google L4 — next steps',                   from: 'Google Recruiting',  fromEmail: 'noreply@google.com',     isUnread: true,  date: dback(1), snippet: 'We would like to move forward with the next round' },
    { subject: 'Interview debrief — Citadel',              from: 'Citadel Recruiting', fromEmail: 'recruit@citadel.com',    isUnread: false, date: dback(4), snippet: 'Thank you for taking the time to interview with us' },
  ],
  github: [
    { name: 'distributed-kv-store', language: 'Go',         lastCommit: dback(1),  isStale: false },
    { name: 'ml-pipeline',          language: 'Python',     lastCommit: dback(3),  isStale: false },
    { name: 'breeze-api',           language: 'TypeScript', lastCommit: dback(0),  isStale: false },
    { name: 'leetcode-solutions',   language: 'Python',     lastCommit: dback(7),  isStale: false },
    { name: 'react-component-lib',  language: 'TypeScript', lastCommit: dback(14), isStale: false },
    { name: 'old-portfolio',        language: 'JavaScript', lastCommit: dback(45), isStale: true  },
    { name: 'system-design-notes',  language: 'Markdown',   lastCommit: dback(2),  isStale: false },
  ],
  notion: [
    { title: 'System Design Cheatsheet',    lastEdited: '2d ago' },
    { title: 'LC Patterns — DP & Graphs',   lastEdited: '1d ago' },
    { title: 'Internship Offer Comparison', lastEdited: '3d ago' },
  ],
};

const BUSINESS = {
  user: { name: 'Jordan Park', id: 'demo' },
  connectedApps: ['gmail','googlecalendar','linkedin','notion'],
  calendar: [
    { title: 'Coffee Chat — McKinsey',    time: hr(9),  isToday: true,  daysUntil: 0, dateLabel: 'Today'   },
    { title: 'Case Interview Prep',       time: hr(14), isToday: true,  daysUntil: 0, dateLabel: 'Today'   },
    { title: 'Goldman Sachs Superday',    time: hr(8),  isToday: false, daysUntil: 2, dateLabel: dlabel(2) },
    { title: 'Networking Event — Stern',  time: hr(18), isToday: false, daysUntil: 3, dateLabel: dlabel(3) },
    { title: 'BCG First Round',           time: hr(10), isToday: false, daysUntil: 5, dateLabel: dlabel(5) },
    { title: 'Offer Deadline — JPMorgan', time: hr(17), isToday: false, daysUntil: 7, dateLabel: dlabel(7) },
  ],
  emails: [
    { subject: 'Superday Invitation — Goldman Sachs IBD',  from: 'Marcus Webb',        fromEmail: 'm.webb@gs.com',           isUnread: true,  date: dback(0), snippet: 'We are pleased to invite you to our Superday' },
    { subject: 'Re: Coffee chat last Tuesday',             from: 'Priya Sharma',       fromEmail: 'psharma@mckinsey.com',    isUnread: true,  date: dback(1), snippet: 'Great meeting you. I wanted to share a few resources' },
    { subject: 'Your BCG application — update',            from: 'BCG Recruiting',     fromEmail: 'recruiting@bcg.com',      isUnread: true,  date: dback(0), snippet: 'We are happy to move forward to the next stage' },
    { subject: 'PE Analyst Role — KKR',                    from: 'LinkedIn Recruiter', fromEmail: 'recruit@linkedin.com',    isUnread: false, date: dback(2), snippet: 'Hi Jordan, I have an exciting opportunity for you' },
    { subject: 'Accepted: Wharton Finance Conference',     from: 'Wharton Events',     fromEmail: 'events@wharton.upenn.edu',isUnread: false, date: dback(4), snippet: 'Congratulations! Your registration is confirmed' },
    { subject: 'Internship decision — JPMorgan',           from: 'JPMorgan HR',        fromEmail: 'hr@jpmorgan.com',         isUnread: true,  date: dback(1), snippet: 'Please respond by end of week with your decision' },
    { subject: 'Networking follow-up — Bain',              from: 'Tyler Morris',       fromEmail: 'tmorris@bain.com',        isUnread: false, date: dback(5), snippet: 'It was great meeting you at the event' },
    { subject: 'HireVue invite — Citadel Securities',      from: 'Citadel HR',         fromEmail: 'hr@citadel.com',          isUnread: true,  date: dback(0), snippet: 'Please complete within 5 days' },
  ],
  notion: [], github: [], drive: [],
};

const PREMED = {
  user: { name: 'Maya Patel', id: 'demo' },
  connectedApps: ['gmail','googlecalendar','notion','strava'],
  calendar: [
    { title: 'Clinical Shadowing — Dr. Chen',  time: hr(8),  isToday: true,  daysUntil: 0, dateLabel: 'Today'   },
    { title: 'Orgo Lab',                        time: hr(13), isToday: true,  daysUntil: 0, dateLabel: 'Today'   },
    { title: 'MCAT Practice Exam',              time: hr(9),  isToday: false, daysUntil: 1, dateLabel: dlabel(1) },
    { title: 'Research Lab Meeting',            time: hr(14), isToday: false, daysUntil: 2, dateLabel: dlabel(2) },
    { title: 'AMCAS Application Deadline',      time: hr(23), isToday: false, daysUntil: 6, dateLabel: dlabel(6) },
    { title: 'Volunteer Shift — MGH',           time: hr(10), isToday: false, daysUntil: 7, dateLabel: dlabel(7) },
  ],
  emails: [
    { subject: 'Interview Invitation — Harvard Medical School', from: 'HMS Admissions', fromEmail: 'admissions@hms.harvard.edu', isUnread: true,  date: dback(0), snippet: 'We are pleased to invite you for an interview' },
    { subject: 'AMCAS verification complete',                   from: 'AMCAS',          fromEmail: 'amcas@aamc.org',            isUnread: true,  date: dback(1), snippet: 'Your application has been verified and transmitted' },
    { subject: 'Research abstract accepted — AHA Conference',   from: 'Dr. Sarah Liu',  fromEmail: 'sliu@hospital.org',         isUnread: false, date: dback(2), snippet: 'Your abstract was accepted for a poster session' },
    { subject: 'Waitlist update — Johns Hopkins',               from: 'JHU Admissions', fromEmail: 'admit@jhu.edu',             isUnread: true,  date: dback(0), snippet: 'We are writing to update you on your waitlist status' },
    { subject: 'Orgo Exam 3 — grades posted',                   from: 'Prof. Martinez', fromEmail: 'martinez@university.edu',   isUnread: false, date: dback(3), snippet: 'Grades have been posted on the course portal' },
    { subject: 'IRB approval — your protocol',                   from: 'IRB Committee',  fromEmail: 'irb@university.edu',        isUnread: false, date: dback(4), snippet: 'Your research protocol has been approved' },
    { subject: 'MCAT score report available',                   from: 'AAMC',           fromEmail: 'noreply@aamc.org',          isUnread: true,  date: dback(1), snippet: 'Your MCAT score report is now available' },
    { subject: 'Lab protocol update — cell culture',            from: 'Dr. Kim Lab',    fromEmail: 'kimlab@university.edu',     isUnread: false, date: dback(5), snippet: 'Please review the updated protocol' },
  ],
  notion: [
    { title: 'MCAT Content Review — Bio/Biochem', lastEdited: '1d ago' },
    { title: 'School List & Secondaries Tracker',  lastEdited: '2d ago' },
    { title: 'Research Journal — Cardiac Study',   lastEdited: '3d ago' },
  ],
  github: [], drive: [],
};

const CREATIVE = {
  user: { name: 'Zoe Martinez', id: 'demo' },
  connectedApps: ['instagram','gmail','googlecalendar','googledrive','notion'],
  calendar: [
    { title: 'Brand shoot — Luna Skincare', time: hr(10), isToday: true,  daysUntil: 0, dateLabel: 'Today'   },
    { title: 'Client review — Meridian UI', time: hr(15), isToday: true,  daysUntil: 0, dateLabel: 'Today'   },
    { title: 'Newsletter publish day',      time: hr(9),  isToday: false, daysUntil: 1, dateLabel: dlabel(1) },
    { title: 'Portfolio review — LavaLab', time: hr(14), isToday: false, daysUntil: 2, dateLabel: dlabel(2) },
    { title: 'Freelance client call',       time: hr(11), isToday: false, daysUntil: 3, dateLabel: dlabel(3) },
    { title: 'Content batch day',           time: hr(10), isToday: false, daysUntil: 5, dateLabel: dlabel(5) },
  ],
  emails: [
    { subject: 'Revision request — Luna Skincare brand kit',  from: 'Ava Torres',      fromEmail: 'ava@lunaskin.com',     isUnread: true,  date: dback(0), snippet: 'Love the direction! Can we tweak the typography' },
    { subject: 'Feedback needed ASAP — Meridian deck',        from: 'Meridian Team',   fromEmail: 'team@meridian.co',     isUnread: true,  date: dback(0), snippet: 'Presentation is tomorrow. Can you review slides 8–12' },
    { subject: 'Invoice #042 — payment received',             from: 'Stripe',          fromEmail: 'receipts@stripe.com',  isUnread: false, date: dback(1), snippet: 'Your payment of $2,400 has been received' },
    { subject: 'Collab opportunity — @wanderlust (280k)',     from: 'Creator Collabs', fromEmail: 'collabs@mgmt.com',     isUnread: false, date: dback(2), snippet: 'We think you two would be a great fit' },
    { subject: 'Your Figma Pro renewal',                      from: 'Figma',           fromEmail: 'noreply@figma.com',    isUnread: false, date: dback(3), snippet: 'Your annual subscription renews in 7 days' },
  ],
  drive: [
    { name: 'Luna_Skincare_Brand_Kit_v3.fig',    mimeType: 'application/figma' },
    { name: 'Meridian_Pitch_Deck_Final.pptx',    mimeType: 'application/vnd.ms-powerpoint' },
    { name: 'Portfolio_2025.pdf',                mimeType: 'application/pdf' },
    { name: 'Content_Calendar_Q1.xlsx',          mimeType: 'application/vnd.ms-excel' },
    { name: 'Brand_Guidelines_Template.docx',    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'Invoice_Template.docx',             mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  ],
  notion: [
    { title: 'Content Ideas — February', lastEdited: '1d ago' },
    { title: 'Client Tracker',           lastEdited: '2d ago' },
    { title: 'Brand Mood Boards',        lastEdited: '4d ago' },
  ],
  instagram: { followers: 14800, following: 612, posts: 187, bio: 'designer & creator. building @meridianapp' },
  github: [],
};

const DEMOS = [
  { id: 'engineer', label: 'Engineer',  Board: CSBoard,       data: ENGINEER },
  { id: 'business', label: 'Business',  Board: BusinessBoard, data: BUSINESS },
  { id: 'premed',   label: 'Pre-Med',   Board: PremedBoard,   data: PREMED   },
  { id: 'creative', label: 'Creative',  Board: CreativeBoard, data: CREATIVE },
];

export default function DemoBoards() {
  const [active, setActive] = useState('engineer');
  const demo = DEMOS.find(d => d.id === active);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      background: '#05080F',
    }}>

      {/* ── Top nav bar ────────────────────────────────────────── */}
      <div style={{
        height:        50,
        flexShrink:    0,
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        padding:       '0 28px',
        borderBottom:  '1px solid rgba(255,255,255,0.06)',
        background:    'rgba(5,8,15,0.95)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        zIndex:        50,
      }}>

        {/* Logo */}
        <div style={{
          fontSize:      13,
          fontWeight:    300,
          letterSpacing: '5px',
          color:         'rgba(255,255,255,0.82)',
          textTransform: 'uppercase',
          fontFamily:    'system-ui,-apple-system,sans-serif',
          userSelect:    'none',
        }}>
          breeze
        </div>

        {/* Archetype switcher — center */}
        <div style={{ display: 'flex', gap: 2 }}>
          {DEMOS.map(d => (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              style={{
                background:   active === d.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                border:       `1px solid ${active === d.id ? 'rgba(255,255,255,0.10)' : 'transparent'}`,
                borderRadius: 8,
                padding:      '6px 18px',
                cursor:       'pointer',
                transition:   'all 0.16s ease',
                fontFamily:   'system-ui,-apple-system,sans-serif',
              }}
            >
              <span style={{
                fontSize:   13,
                fontWeight: active === d.id ? 500 : 400,
                color:      active === d.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)',
                transition: 'color 0.16s',
                letterSpacing: '0.1px',
              }}>
                {d.label}
              </span>
            </button>
          ))}
        </div>

        {/* Right side — demo badge */}
        <div style={{
          fontSize:      11,
          color:         'rgba(255,255,255,0.18)',
          letterSpacing: '0.5px',
          fontFamily:    'system-ui,-apple-system,sans-serif',
        }}>
          demo
        </div>
      </div>

      {/* ── Board area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <demo.Board data={demo.data} loading={false} />
      </div>
    </div>
  );
}
