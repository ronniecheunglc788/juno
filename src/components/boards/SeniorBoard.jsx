const P = {
  bg: '#fff', text: '#111', mid: '#555', dim: '#999',
  accent: '#111', border: 'rgba(0,0,0,0.08)',
};

function actionScore(em) {
  const s = (em.subject + ' ' + em.snippet).toLowerCase();
  let score = em.isUnread ? 4 : 0;
  if (['action required', 'response needed', 'please reply', 'follow up', 'deadline', 'asap', 'urgent'].some(k => s.includes(k))) score += 5;
  if (['offer', 'decision', 'accept', 'decline', 'grad school', 'interview', 'application'].some(k => s.includes(k))) score += 3;
  return score;
}

function getThreeThings(emails, calendar) {
  const things = [];

  // Top action email
  const topEmail = [...emails].sort((a, b) => actionScore(b) - actionScore(a))[0];
  if (topEmail) things.push({ type: 'email', label: topEmail.subject, meta: `from ${topEmail.from}` });

  // Most imminent calendar event
  const soonEvent = calendar.find(e => e.daysUntil <= 3);
  if (soonEvent) things.push({ type: 'event', label: soonEvent.title, meta: `${soonEvent.dateLabel} · ${soonEvent.time}` });

  // Second action email
  const emails2 = emails.filter(e => e !== topEmail);
  const secondEmail = [...emails2].sort((a, b) => actionScore(b) - actionScore(a))[0];
  if (secondEmail && things.length < 3) things.push({ type: 'email', label: secondEmail.subject, meta: `from ${secondEmail.from}` });

  // Fill with upcoming events if needed
  if (things.length < 3) {
    const nextEvents = calendar.filter(e => !soonEvent || e !== soonEvent).slice(0, 3 - things.length);
    nextEvents.forEach(e => things.push({ type: 'event', label: e.title, meta: `${e.dateLabel} · ${e.time}` }));
  }

  return things.slice(0, 3);
}

export default function SeniorBoard({ data, loading }) {
  if (loading) return <LoadingState />;
  const firstName = data?.user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const emails = data?.emails || [];
  const cal = data?.calendar || [];
  const three = getThreeThings(emails, cal);

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: 'system-ui, sans-serif', color: P.text }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 40px 60px' }}>

        {/* Date */}
        <div style={{ fontSize: 12, color: P.dim, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{today}</div>

        {/* Greeting */}
        <div style={{ fontSize: 32, fontWeight: 300, lineHeight: 1.3, marginBottom: 60, color: P.text }}>
          Good morning, {firstName}.
        </div>

        {/* Three things */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: P.dim, marginBottom: 24 }}>THREE THINGS THIS WEEK</div>
        {three.length === 0 && (
          <div style={{ fontSize: 15, color: P.dim, marginBottom: 60 }}>Connect Gmail and Calendar to populate your brief.</div>
        )}
        {three.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 24, marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${P.border}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: P.border, flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: P.mid }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: item.type === 'email' ? '#111' : P.dim, marginRight: 6, verticalAlign: 'middle' }} />
                {item.meta}
              </div>
            </div>
          </div>
        ))}

        {/* Upcoming */}
        {cal.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: P.dim, marginBottom: 20, marginTop: 48 }}>COMING UP</div>
            {cal.slice(0, 7).map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: ev.isToday ? P.text : P.dim, fontWeight: ev.isToday ? 700 : 400, minWidth: 80, flexShrink: 0 }}>{ev.dateLabel}</div>
                <div style={{ fontSize: 15, color: P.text }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: P.dim, marginLeft: 'auto', flexShrink: 0 }}>{ev.time}</div>
              </div>
            ))}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 80, paddingTop: 24, borderTop: `1px solid ${P.border}`, fontSize: 12, color: P.dim }}>
          Breeze · built from your {data?.connectedApps?.length || 0} connected apps
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: P.dim }}>
      Loading…
    </div>
  );
}
