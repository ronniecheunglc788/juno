import { useState, useEffect, useRef } from 'react';

const APP_LABELS = {
  gmail: 'Gmail', googlecalendar: 'Calendar', googledrive: 'Drive',
  googlesheets: 'Sheets', github: 'GitHub', notion: 'Notion',
  slack: 'Slack', discord: 'Discord', linkedin: 'LinkedIn',
  instagram: 'Instagram', twitterv2: 'X', youtube: 'YouTube',
  spotify: 'Spotify', strava: 'Strava', todoist: 'Todoist',
  asana: 'Asana', whatsapp: 'WhatsApp',
};
const fmt = app => APP_LABELS[app?.toLowerCase()] || app;

const ACCENT = {
  engineer: '#2563EB',
  business: '#B45309',
  premed:   '#059669',
  creative: '#7C3AED',
};

const BG_TINT = {
  engineer: 'rgba(239,244,255,0.8)',
  business: 'rgba(255,251,240,0.8)',
  premed:   'rgba(239,253,245,0.8)',
  creative: 'rgba(245,240,255,0.8)',
};

const FONT  = "'DM Sans','Inter',system-ui,sans-serif";
const SERIF = "'Playfair Display',Georgia,serif";

const TYPE_ICON = { email: '✉', calendar: '◷', github: '⌥', general: '◈' };

// Process raw calendar events in the browser so times use the user's local timezone
function processCalendar(raw) {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return raw.map(e => {
    // Support both new format (startRaw) and old cached format (dateLabel/time already set)
    const startRaw = e.startRaw || e.date || '';
    if (!startRaw) return null;

    const d      = new Date(startRaw);
    const evDay  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const daysUntil = Math.round((evDay - todayStart) / 86400000);

    if (daysUntil < 0) return null; // skip past events

    const isAllDay  = e.isAllDay ?? !startRaw.includes('T');
    const isToday   = daysUntil === 0;
    const dateLabel = isToday   ? 'Today'
      : daysUntil === 1         ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const time = isAllDay
      ? 'All day'
      : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return { ...e, startRaw, isAllDay, isToday, dateLabel, daysUntil, time };
  }).filter(Boolean);
}

function sortByTime(evs) {
  return [...evs].sort((a, b) => {
    // Sort using real timestamps when available (most accurate)
    if (a.startRaw && b.startRaw) {
      return new Date(a.startRaw).getTime() - new Date(b.startRaw).getTime();
    }
    // Fallback: parse formatted time string
    const parse = t => {
      if (!t) return 9999;
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!m) return 9999;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const p = (m[3] || '').toUpperCase();
      if (p === 'PM' && h !== 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return h * 60 + min;
    };
    return parse(a.time) - parse(b.time);
  });
}

// Cursor-tracking ambient light for insights section
function AmbientLight({ accent }) {
  const ref = useRef(null);
  const pos = useRef({ x: 0.5, y: 0.5 });
  const cur = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e) {
      pos.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    }
    function animate() {
      cur.current.x += (pos.current.x - cur.current.x) * 0.05;
      cur.current.y += (pos.current.y - cur.current.y) * 0.05;
      const x  = (cur.current.x * 100).toFixed(1);
      const y  = (cur.current.y * 100).toFixed(1);
      const xi = (100 - cur.current.x * 100).toFixed(1);
      const yi = (100 - cur.current.y * 100).toFixed(1);
      el.style.background = `
        radial-gradient(ellipse 65% 55% at ${x}% ${y}%, ${accent}1a 0%, transparent 62%),
        radial-gradient(ellipse 55% 45% at ${xi}% ${yi}%, ${accent}0d 0%, transparent 55%)
      `;
      raf.current = requestAnimationFrame(animate);
    }
    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, [accent]);

  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

export default function BoardShell({ children, data, themeKey }) {
  const [tab,      setTab]      = useState('schedule');
  const [insights,     setInsights]     = useState(null);  // null=loading
  const [insightError, setInsightError] = useState('');
  const fetched = useRef(false);

  const accent  = ACCENT[themeKey] || '#2563EB';
  const bgTint  = BG_TINT[themeKey] || BG_TINT.engineer;
  const cal     = processCalendar(data?.calendar || []);
  const emails  = data?.emails        || [];
  const connected = data?.connectedApps || [];

  const todayEvents    = sortByTime(cal.filter(e => e.isToday));
  const upcomingEvents = cal.filter(e => !e.isToday);
  const unread         = emails.filter(e => e.isUnread).slice(0, 20);

  const groups = upcomingEvents.slice(0, 40).reduce((acc, ev) => {
    const k = ev.dateLabel || 'Later';
    (acc[k] = acc[k] || []).push(ev);
    return acc;
  }, {});
  Object.keys(groups).forEach(k => { groups[k] = sortByTime(groups[k]); });

  const noSchedule = todayEvents.length === 0 && Object.keys(groups).length === 0;

  const now     = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Fetch insights once data is ready
  useEffect(() => {
    if (!data || fetched.current) return;
    fetched.current = true;
    fetch('/api/insights', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setInsightError(d.error); setInsights([]); return; }
        setInsights(d.insights || []);
      })
      .catch(err => { setInsightError(err.message); setInsights([]); });
  }, [data]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', fontFamily: FONT }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div style={{
        width: 260, flexShrink: 0, background: '#FFFFFF',
        borderRight: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}08 0%, transparent 68%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Date + tabs header */}
        <div style={{ padding: '24px 22px 0', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.28)', marginBottom: 6 }}>
            {weekday}
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, fontStyle: 'italic', color: 'rgba(0,0,0,0.55)', letterSpacing: '-0.3px', lineHeight: 1.1, fontFamily: SERIF, marginBottom: 18 }}>
            {dateStr}
          </div>
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            {['schedule', 'inbox'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '7px 0 9px', background: 'none', border: 'none',
                borderBottom: tab === t ? `2px solid ${accent}` : '2px solid transparent',
                marginBottom: -1,
                fontSize: 11, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? accent : 'rgba(0,0,0,0.35)',
                cursor: 'pointer', fontFamily: FONT, letterSpacing: '0.3px',
                transition: 'color 0.15s', textTransform: 'capitalize',
              }}>
                {t === 'inbox' && unread.length > 0 ? `Inbox · ${unread.length}` : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 16px', position: 'relative', zIndex: 1 }}>
          {tab === 'schedule' && (
            noSchedule ? (
              <div style={{ color: 'rgba(0,0,0,0.28)', fontSize: 13, lineHeight: 1.8, fontWeight: 300 }}>
                Connect Google Calendar to see your schedule here.
              </div>
            ) : (
              <>
                {todayEvents.length > 0 && (
                  <Section label="Today" accent={accent}>
                    {todayEvents.map((ev, i) => <EventRow key={i} title={ev.title} time={ev.time} accent={accent} />)}
                  </Section>
                )}
                {Object.entries(groups).map(([day, evs]) => (
                  <Section key={day} label={day} accent={accent}>
                    {evs.map((ev, i) => <EventRow key={i} title={ev.title} time={ev.time} accent={accent} />)}
                  </Section>
                ))}
              </>
            )
          )}
          {tab === 'inbox' && (
            unread.length === 0 ? (
              <div style={{ color: 'rgba(0,0,0,0.28)', fontSize: 13, lineHeight: 1.8, fontWeight: 300 }}>No unread emails right now.</div>
            ) : (
              unread.map((em, i) => <EmailRow key={i} from={em.from} subject={em.subject} accent={accent} />)
            )
          )}
        </div>

        {/* Connected apps */}
        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.22)', marginBottom: 10 }}>
            Connected
          </div>
          {connected.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.22)', fontWeight: 300 }}>No apps connected</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {connected.map((app, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
                  background: `${accent}0c`, color: `${accent}cc`, border: `1px solid ${accent}22`,
                }}>
                  {fmt(app)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: graph + insights (scrollable) ────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Graph section — fills the visible area */}
        <div style={{ position: 'relative', flexShrink: 0, height: 'calc(100vh - 50px)' }}>
          {children}

          {/* Edge vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 78% 78% at 50% 50%, transparent 40%, ${bgTint} 100%)`,
            pointerEvents: 'none', zIndex: 1,
          }} />

          {/* Scroll hint — only show once insights are ready */}
          {insights && insights.length > 0 && (
            <div style={{
              position:      'absolute',
              bottom:        20,
              left:          '50%',
              transform:     'translateX(-50%)',
              fontSize:      9,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color:         'rgba(0,0,0,0.22)',
              pointerEvents: 'none',
              zIndex:        2,
              animation:     'float-up 2s ease-in-out infinite alternate',
            }}>
              scroll for insights ↓
            </div>
          )}
        </div>

        {/* ── Insights section — landing page style ──────────────── */}
        <div style={{
          position:   'relative',
          background: '#F9F8F6',
          padding:    '80px 72px 100px',
          flexShrink: 0,
          overflow:   'hidden',
          minHeight:  'calc(100vh - 50px)',
        }}>
          {/* Noise texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            opacity: 0.5,
          }} />

          {/* Ambient cursor light in accent color */}
          <AmbientLight accent={accent} />

          {/* Section header */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 52 }}>
            <div style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '2.5px',
              textTransform: 'uppercase', color: 'rgba(0,0,0,0.28)', marginBottom: 14,
            }}>
              Breeze AI
            </div>
            <p style={{
              fontFamily:    SERIF,
              fontStyle:     'italic',
              fontSize:      'clamp(28px, 3vw, 44px)',
              fontWeight:    400,
              color:         'rgba(10,10,10,0.85)',
              margin:        0,
              lineHeight:    1.2,
              letterSpacing: '-0.3px',
            }}>
              What Breeze sees.
            </p>
          </div>

          {/* Cards */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
            {insights === null ? (
              // Skeletons while loading
              [0, 1, 2].map(i => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 16, padding: '28px 32px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ height: 10, width: '35%', borderRadius: 5, background: 'rgba(0,0,0,0.07)', marginBottom: 14 }} />
                  <div style={{ height: 8, width: '90%', borderRadius: 4, background: 'rgba(0,0,0,0.05)', marginBottom: 8 }} />
                  <div style={{ height: 8, width: '65%', borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
                </div>
              ))
            ) : insightError ? (
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', fontWeight: 300, lineHeight: 1.7 }}>
                {insightError === 'AI not configured'
                  ? 'Add your GEMINI_API_KEY to Vercel environment variables and redeploy.'
                  : `Could not load insights: ${insightError}`}
              </div>
            ) : insights.length === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)', fontWeight: 300 }}>
                No insights generated. Try connecting more apps.
              </div>
            ) : (
              insights.map((ins, i) => (
                <InsightCard key={i} insight={ins} accent={accent} index={i} />
              ))
            )}
          </div>

          {/* Bottom wordmark */}
          <div style={{
            position: 'relative', zIndex: 1,
            marginTop: 64,
            fontSize: 10, fontWeight: 400, letterSpacing: '5px',
            textTransform: 'uppercase', color: 'rgba(0,0,0,0.14)',
            userSelect: 'none',
          }}>
            breeze
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight, accent, index }) {
  const icon = TYPE_ICON[insight.type] || TYPE_ICON.general;
  return (
    <div style={{
      background:           'rgba(255,255,255,0.75)',
      backdropFilter:       'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border:               '1px solid rgba(0,0,0,0.07)',
      borderLeft:           `3px solid ${accent}`,
      borderRadius:         16,
      padding:              '28px 32px',
      boxShadow:            '0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
      animation:            `nodeFadeIn 0.3s ease ${index * 0.08}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: accent, opacity: 0.7 }}>{icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: accent,
          letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.9,
        }}>
          {insight.title}
        </span>
      </div>
      <p style={{
        fontSize: 15, color: 'rgba(0,0,0,0.62)',
        lineHeight: 1.65, margin: 0, fontWeight: 300,
      }}>
        {insight.body}
      </p>
    </div>
  );
}

function Section({ label, accent, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 12, height: 1, background: `${accent}50`, flexShrink: 0 }} />
        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

function EventRow({ title, time, accent }) {
  return (
    <div style={{ display: 'flex', gap: 11, marginBottom: 13, alignItems: 'flex-start' }}>
      <div style={{ marginTop: 5, width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0, opacity: 0.55 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(0,0,0,0.75)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        {time && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.32)', marginTop: 2 }}>{time}</div>}
      </div>
    </div>
  );
}

function EmailRow({ from, subject, accent }) {
  const initials = (from || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: `${accent}10`,
        border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 9, fontWeight: 700, color: `${accent}cc`,
        flexShrink: 0, marginTop: 1,
      }}>
        {initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(0,0,0,0.4)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {from}
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(0,0,0,0.72)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subject}
        </div>
      </div>
    </div>
  );
}
