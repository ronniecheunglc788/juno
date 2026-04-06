const P = {
  bg: '#0D1117', surface: '#161B22', border: 'rgba(48,54,61,1)',
  blue: '#58A6FF', green: '#3FB950', red: '#F85149', amber: '#E3B341',
  text: '#E6EDF3', mid: '#8B949E', dim: '#484F58',
};

const TECH_COMPANIES = ['google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix', 'stripe', 'airbnb',
  'uber', 'lyft', 'coinbase', 'databricks', 'openai', 'anthropic', 'palantir', 'jane street',
  'two sigma', 'citadel', 'de shaw', 'goldman', 'jpmorgan', 'bloomberg'];

function isRecruiting(email) {
  const s = (email.subject + ' ' + email.from + ' ' + email.fromEmail).toLowerCase();
  return TECH_COMPANIES.some(c => s.includes(c)) ||
    ['recruiter', 'recruiting', 'opportunity', 'application', 'interview', 'offer', 'internship', 'new grad'].some(k => s.includes(k));
}

function staleness(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function staleLabel(days) {
  if (days < 1)  return 'today';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Simple heatmap: bucket calendar events into 28 day-slots
function buildHeatmap(calendar) {
  const buckets = Array(28).fill(0);
  calendar.forEach(ev => {
    const slot = Math.min(ev.daysUntil, 27);
    if (slot >= 0) buckets[slot]++;
  });
  const max = Math.max(...buckets, 1);
  return buckets.map(v => v / max);
}

export default function CSBoard({ data, loading }) {
  if (loading) return <LoadingState />;
  const firstName = data?.user?.name?.split(' ')[0] || 'there';
  const repos = data?.github || [];
  const recruitingEmails = (data?.emails || []).filter(isRecruiting);
  const cal = data?.calendar || [];
  const heatmap = buildHeatmap(cal);
  const notion = data?.notion || [];

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: '"SF Mono", "Fira Code", monospace', color: P.text }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${P.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: P.green }}>
          <span style={{ color: P.mid }}>user@breeze</span>
          <span style={{ color: P.dim }}> ~/</span>
          <span style={{ color: P.blue }}>{firstName.toLowerCase()}</span>
          <span style={{ color: P.dim }}> $</span>
          <span style={{ color: P.text }}> breeze --board</span>
        </div>
        <div style={{ fontSize: 11, color: P.dim }}>{repos.length} repos · {recruitingEmails.length} recruiting threads</div>
      </div>

      {/* Heatmap strip */}
      <div style={{ borderBottom: `1px solid ${P.border}`, padding: '12px 32px' }}>
        <div style={{ fontSize: 10, color: P.dim, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>CALENDAR DENSITY — NEXT 28 DAYS</div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
          {heatmap.map((v, i) => (
            <div key={i} style={{
              width: 14, borderRadius: 2,
              height: Math.max(4, v * 28),
              background: v === 0 ? P.border : v < 0.4 ? '#1A3A1A' : v < 0.7 ? '#196127' : P.green,
              transition: 'height 0.3s',
            }} title={`Day ${i + 1}`} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: P.dim }}>today</span>
          <span style={{ fontSize: 10, color: P.dim }}>+28d</span>
        </div>
      </div>

      {/* 2-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 'calc(100vh - 125px)' }}>

        {/* Left: Repos + Notion */}
        <div style={{ borderRight: `1px solid ${P.border}`, padding: '24px 28px', overflowY: 'auto' }}>
          {repos.length > 0 && (
            <>
              <div style={sec}>REPOSITORIES</div>
              {repos.map((r, i) => {
                const days = staleness(r.lastCommit);
                const fresh = days < 7;
                return (
                  <div key={i} style={{ ...row, borderLeft: `2px solid ${fresh ? P.green : days < 30 ? P.amber : P.dim}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: P.blue }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: P.mid, marginTop: 2 }}>{r.language}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: fresh ? P.green : P.dim }}>{staleLabel(days)}</div>
                      {r.isStale && <div style={{ fontSize: 10, color: P.red, marginTop: 2 }}>stale</div>}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {notion.length > 0 && (
            <>
              <div style={{ ...sec, marginTop: 28 }}>NOTION</div>
              {notion.slice(0, 8).map((n, i) => (
                <div key={i} style={{ ...row, borderLeft: `2px solid ${P.dim}` }}>
                  <div style={{ fontSize: 13 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: P.dim }}>{n.lastEdited}</div>
                </div>
              ))}
            </>
          )}

          {repos.length === 0 && notion.length === 0 && (
            <div style={{ color: P.mid, fontSize: 13, paddingTop: 16 }}>
              Connect GitHub or Notion to see your projects.
            </div>
          )}
        </div>

        {/* Right: Recruiting + Upcoming */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          <div style={sec}>RECRUITING PIPELINE</div>
          {recruitingEmails.length === 0 && (
            <div style={{ color: P.mid, fontSize: 13, marginBottom: 28 }}>No recruiting emails detected yet.</div>
          )}
          {recruitingEmails.slice(0, 8).map((em, i) => (
            <div key={i} style={{ ...row, borderLeft: `2px solid ${em.isUnread ? P.amber : P.dim}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: em.isUnread ? P.text : P.mid, fontWeight: em.isUnread ? 600 : 400 }}>{em.subject}</div>
                <div style={{ fontSize: 11, color: P.dim, marginTop: 2 }}>{em.from}</div>
              </div>
              <div style={{ fontSize: 11, color: P.dim, flexShrink: 0, marginLeft: 12 }}>{em.date}</div>
            </div>
          ))}

          <div style={{ ...sec, marginTop: 28 }}>UPCOMING</div>
          {cal.length === 0 && <div style={{ color: P.mid, fontSize: 13 }}>No upcoming events.</div>}
          {cal.slice(0, 6).map((ev, i) => (
            <div key={i} style={{ ...row, borderLeft: `2px solid ${ev.isToday ? P.green : P.dim}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: ev.isToday ? P.green : P.text }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: P.dim, marginTop: 2 }}>{ev.time}</div>
              </div>
              <div style={{ fontSize: 11, color: ev.isToday ? P.green : P.dim }}>{ev.dateLabel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sec = { fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: P.dim, marginBottom: 12 };
const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', marginBottom: 6, background: P.surface, borderRadius: 6, paddingLeft: 12 };

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: P.mid }}>
      loading board...
    </div>
  );
}
