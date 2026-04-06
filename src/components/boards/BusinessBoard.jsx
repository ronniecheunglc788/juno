const P = {
  bg: '#FAFAFA', text: '#1A1A2E', mid: '#4A5568', dim: '#A0AEC0',
  navy: '#1A1A2E', gold: '#C9A84C', green: '#38A169', red: '#E53E3E',
  border: 'rgba(0,0,0,0.07)', card: '#fff',
};

function warmthColor(daysAgo) {
  if (daysAgo < 3)  return '#38A169'; // very warm
  if (daysAgo < 7)  return '#C9A84C'; // warm
  if (daysAgo < 14) return '#ED8936'; // cooling
  return '#E53E3E';                    // cold
}

function warmthLabel(daysAgo) {
  if (daysAgo < 1)  return 'Today';
  if (daysAgo < 7)  return `${daysAgo}d ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}w ago`;
  return `${Math.floor(daysAgo / 30)}mo ago`;
}

function buildPeople(emails) {
  const map = {};
  emails.forEach(em => {
    const key = em.fromEmail || em.from;
    if (!key || key.toLowerCase().includes('noreply') || key.toLowerCase().includes('no-reply')) return;
    if (!map[key]) {
      map[key] = { name: em.from, email: em.fromEmail, lastSubject: em.subject, date: em.date, count: 0 };
    }
    map[key].count++;
  });
  return Object.values(map)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);
}

const OPP_KW = ['opportunity', 'internship', 'role', 'position', 'offer', 'interview', 'recruiting', 'career', 'job', 'hiring'];
function isOpportunity(email) {
  return OPP_KW.some(k => (email.subject + ' ' + email.snippet).toLowerCase().includes(k));
}

export default function BusinessBoard({ data, loading }) {
  if (loading) return <LoadingState />;
  const firstName = data?.user?.name?.split(' ')[0] || 'there';
  const people = buildPeople(data?.emails || []);
  const opportunities = (data?.emails || []).filter(isOpportunity).slice(0, 6);
  const cal = data?.calendar || [];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: 'system-ui, sans-serif', color: P.text }}>
      {/* Header */}
      <div style={{ background: P.navy, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: 4 }}>BREEZE · BUSINESS</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Hey {firstName} —</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{today}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{cal.length} upcoming · {people.length} contacts</div>
        </div>
      </div>

      {/* Calendar strip */}
      {cal.length > 0 && (
        <div style={{ background: '#fff', borderBottom: `1px solid ${P.border}`, padding: '14px 40px', display: 'flex', gap: 12, overflowX: 'auto' }}>
          {cal.slice(0, 6).map((ev, i) => (
            <div key={i} style={{ flexShrink: 0, background: ev.isToday ? P.navy : P.bg, borderRadius: 10, padding: '10px 16px', border: `1px solid ${ev.isToday ? P.navy : P.border}`, minWidth: 160 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: ev.isToday ? P.gold : P.dim, textTransform: 'uppercase', marginBottom: 4 }}>{ev.dateLabel}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: ev.isToday ? '#fff' : P.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
              <div style={{ fontSize: 11, color: ev.isToday ? 'rgba(255,255,255,0.5)' : P.dim, marginTop: 2 }}>{ev.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '32px 40px' }}>
        {/* People section */}
        <div style={secHeader}>PEOPLE</div>
        {people.length === 0 && <Empty>Connect Gmail to see your contacts.</Empty>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 36 }}>
          {people.map((p, i) => {
            const daysAgo = p.date ? Math.floor((Date.now() - new Date(p.date).getTime()) / 86400000) : 999;
            const color = warmthColor(daysAgo);
            return (
              <div key={i} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color }}>
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ fontSize: 11, color, fontWeight: 600 }}>{warmthLabel(daysAgo)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: P.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{p.email}</div>
                <div style={{ fontSize: 12, color: P.mid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.lastSubject}</div>
                <div style={{ fontSize: 11, color: P.dim, marginTop: 4 }}>{p.count} email{p.count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <>
            <div style={secHeader}>OPPORTUNITIES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {opportunities.map((op, i) => (
                <div key={i} style={{ background: P.card, border: `1px solid ${P.border}`, borderLeft: `3px solid ${P.gold}`, borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{op.subject}</div>
                  <div style={{ fontSize: 12, color: P.mid }}>{op.from}</div>
                  {op.snippet && <div style={{ fontSize: 12, color: P.dim, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.snippet}</div>}
                  <div style={{ fontSize: 11, color: P.dim, marginTop: 6 }}>{op.date}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const secHeader = { fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: P.dim, marginBottom: 14 };
function Empty({ children }) { return <div style={{ fontSize: 13, color: P.dim, marginBottom: 28 }}>{children}</div>; }
function LoadingState() {
  return <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: P.dim }}>Loading…</div>;
}
