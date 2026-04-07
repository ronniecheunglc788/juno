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
  engineer: '#58A6FF',
  business: '#C9A84C',
  premed:   '#34D399',
  creative: '#C084FC',
};

export default function BoardShell({ children, data, themeKey }) {
  const accent    = ACCENT[themeKey] || '#58A6FF';
  const cal       = data?.calendar      || [];
  const emails    = data?.emails        || [];
  const connected = data?.connectedApps || [];

  const todayEvents    = cal.filter(e => e.isToday);
  const upcomingEvents = cal.filter(e => !e.isToday && e.daysUntil >= 0);
  const unread         = emails.filter(e => e.isUnread).slice(0, 6);

  // Group upcoming by date label
  const groups = upcomingEvents.slice(0, 28).reduce((acc, ev) => {
    const k = ev.dateLabel || 'Later';
    (acc[k] = acc[k] || []).push(ev);
    return acc;
  }, {});

  return (
    <div style={{
      display:  'flex',
      height:   '100%',
      width:    '100%',
      overflow: 'hidden',
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>

      {/* ── Left sidebar ─────────────────────────────────────────── */}
      <div style={{
        width:         224,
        flexShrink:    0,
        background:    '#070B12',
        borderRight:   '1px solid rgba(255,255,255,0.06)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}>

        {/* Scrollable content — today + upcoming in one flow */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

          {/* TODAY */}
          {(todayEvents.length > 0 || unread.length > 0) ? (
            <>
              {todayEvents.length > 0 && (
                <Group label="Today" accent={accent}>
                  {todayEvents.map((ev, i) => (
                    <SideEvent key={i} accent={accent} title={ev.title} meta={ev.time} />
                  ))}
                </Group>
              )}

              {unread.length > 0 && (
                <Group label="Unread" accent={accent}>
                  {unread.map((em, i) => (
                    <SideEmail key={i} accent={accent} from={em.from} subject={em.subject} />
                  ))}
                </Group>
              )}
            </>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.16)', fontSize: 12, paddingTop: 8, lineHeight: 1.7 }}>
              Nothing on for today.
            </div>
          )}

          {/* UPCOMING — flows directly below today */}
          {Object.keys(groups).length > 0 && (
            <div style={{ marginTop: 4 }}>
              {Object.entries(groups).map(([day, evs]) => (
                <Group key={day} label={day} accent={accent}>
                  {evs.map((ev, i) => (
                    <SideEvent key={i} accent={accent} title={ev.title} meta={ev.time} />
                  ))}
                </Group>
              ))}
            </div>
          )}

          {todayEvents.length === 0 && unread.length === 0 && Object.keys(groups).length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.16)', fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>
              Connect Calendar and Gmail to populate this panel.
            </div>
          )}
        </div>

        {/* Connected apps — pinned bottom */}
        <div style={{
          padding:    '12px 18px 16px',
          borderTop:  '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: 9 }}>
            Connected
          </div>
          {connected.length === 0 ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.16)' }}>No apps connected</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {connected.map((app, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 500,
                  padding: '3px 9px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.32)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {fmt(app)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Center: graph ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

function Group({ label, accent, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 9 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SideEvent({ accent, title, meta }) {
  return (
    <div style={{ borderLeft: `2px solid ${accent}30`, paddingLeft: 10, marginBottom: 9, overflow: 'hidden' }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.78)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.26)', marginTop: 1 }}>{meta}</div>
    </div>
  );
}

function SideEmail({ accent, from, subject }) {
  return (
    <div style={{ borderLeft: `2px solid ${accent}30`, paddingLeft: 10, marginBottom: 9, overflow: 'hidden' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.2px' }}>
        {from}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.74)', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {subject}
      </div>
    </div>
  );
}
