const P = {
  bg: '#FAFFFE', text: '#0A1A14', mid: '#4A7060', dim: '#8AADA0',
  green: '#16A34A', red: '#DC2626', amber: '#D97706', blue: '#2563EB',
  border: 'rgba(0,100,70,0.1)', card: '#fff',
};

const ACADEMIC_KW  = ['professor', 'lecture', 'class', 'exam', 'grade', 'assignment', 'syllabus', 'ta', 'office hours', 'course', 'academic'];
const RESEARCH_KW  = ['lab', 'research', 'pi ', 'principal investigator', 'poster', 'abstract', 'data', 'protocol', 'irb', 'experiment'];
const APP_KW       = ['application', 'amcas', 'mcat', 'program', 'interview', 'acceptance', 'waitlist', 'hospital', 'shadowing', 'clinical'];

function categorize(subject) {
  const s = subject.toLowerCase();
  if (APP_KW.some(k  => s.includes(k))) return 'Applications';
  if (RESEARCH_KW.some(k => s.includes(k))) return 'Research';
  if (ACADEMIC_KW.some(k => s.includes(k))) return 'Academic';
  return 'Other';
}

function groupEmails(emails) {
  const groups = { Applications: [], Research: [], Academic: [], Other: [] };
  emails.forEach(e => groups[categorize(e.subject)].push(e));
  return groups;
}

const catColor = { Applications: P.red, Research: P.blue, Academic: P.green, Other: P.mid };

export default function PremedBoard({ data, loading }) {
  if (loading) return <LoadingState />;
  const firstName = data?.user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const grouped = groupEmails(data?.emails || []);
  const cal = data?.calendar || [];
  const thisWeek = cal.filter(e => e.daysUntil <= 7);
  const notion = data?.notion || [];

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: 'system-ui, sans-serif', color: P.text }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${P.border}`, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: P.dim, marginBottom: 2 }}>BREEZE · PRE-MED</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Good morning, {firstName}.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: P.dim }}>{today}</div>
          <div style={{ fontSize: 12, color: P.dim, marginTop: 2 }}>{thisWeek.length} events this week</div>
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 220px', gap: 0, height: 'calc(100vh - 73px)' }}>

        {/* Col 1: Calendar */}
        <div style={{ borderRight: `1px solid ${P.border}`, padding: '24px 20px', overflowY: 'auto' }}>
          <div style={colHeader}>UPCOMING</div>
          {cal.length === 0 && <Empty>No upcoming events</Empty>}
          {cal.map((ev, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              {(i === 0 || cal[i - 1]?.dateLabel !== ev.dateLabel) && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: ev.isToday ? P.green : P.dim, textTransform: 'uppercase', margin: '12px 0 6px' }}>
                  {ev.dateLabel}
                </div>
              )}
              <div style={{ background: ev.isToday ? 'rgba(22,163,74,0.06)' : P.card, border: `1px solid ${ev.isToday ? 'rgba(22,163,74,0.2)' : P.border}`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: P.dim }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Col 2: Email threads */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          <div style={colHeader}>EMAIL THREADS</div>
          {Object.entries(grouped).filter(([, arr]) => arr.length > 0).map(([cat, emails]) => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor[cat] }} />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: catColor[cat] }}>{cat}</div>
                <div style={{ fontSize: 11, color: P.dim }}>({emails.length})</div>
              </div>
              {emails.slice(0, 4).map((em, i) => (
                <div key={i} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8, borderLeft: `3px solid ${em.isUnread ? catColor[cat] : 'transparent'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: em.isUnread ? 600 : 400 }}>{em.subject}</div>
                    <div style={{ fontSize: 11, color: P.dim, flexShrink: 0, marginLeft: 12 }}>{em.date}</div>
                  </div>
                  <div style={{ fontSize: 12, color: P.mid }}>{em.from}</div>
                  {em.snippet && <div style={{ fontSize: 12, color: P.dim, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{em.snippet}</div>}
                </div>
              ))}
            </div>
          ))}
          {data?.emails?.length === 0 && <Empty>No emails yet</Empty>}
        </div>

        {/* Col 3: Stats */}
        <div style={{ borderLeft: `1px solid ${P.border}`, padding: '24px 20px' }}>
          <div style={colHeader}>AT A GLANCE</div>
          <Stat label="Events this week" value={thisWeek.length} color={P.green} />
          <Stat label="Unread emails" value={data?.emails?.filter(e => e.isUnread).length || 0} color={P.amber} />
          <Stat label="Notion pages" value={notion.length} color={P.blue} />
          <Stat label="Apps tracked" value={data?.connectedApps?.length || 0} color={P.mid} />

          {notion.length > 0 && (
            <>
              <div style={{ ...colHeader, marginTop: 28 }}>NOTES</div>
              {notion.slice(0, 6).map((n, i) => (
                <div key={i} style={{ fontSize: 12, color: P.mid, padding: '6px 0', borderBottom: `1px solid ${P.border}` }}>
                  {n.title}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: P.dim, letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: 13, color: P.dim, padding: '16px 0' }}>{children}</div>;
}

const colHeader = { fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: P.dim, marginBottom: 16 };

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: P.dim }}>
      Loading your board…
    </div>
  );
}
