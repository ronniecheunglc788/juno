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

const FONT = "'DM Sans','Inter',system-ui,sans-serif";

export default function BoardShell({ children, data, themeKey }) {
  const accent    = ACCENT[themeKey] || '#58A6FF';
  const cal       = data?.calendar      || [];
  const emails    = data?.emails        || [];
  const connected = data?.connectedApps || [];

  const todayEvents    = cal.filter(e => e.isToday);
  const upcomingEvents = cal.filter(e => !e.isToday && e.daysUntil >= 0);
  const unread         = emails.filter(e => e.isUnread).slice(0, 6);

  const groups = upcomingEvents.slice(0, 28).reduce((acc, ev) => {
    const k = ev.dateLabel || 'Later';
    (acc[k] = acc[k] || []).push(ev);
    return acc;
  }, {});

  const empty = todayEvents.length === 0 && unread.length === 0 && Object.keys(groups).length === 0;

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', fontFamily: FONT }}>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <div style={{
        width:         224,
        flexShrink:    0,
        background:    'rgba(5,7,12,0.98)',
        borderRight:   '1px solid rgba(255,255,255,0.04)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 16px' }}>

          {empty ? (
            <div style={{ color: 'rgba(255,255,255,0.14)', fontSize: 13, lineHeight: 1.7, paddingTop: 4 }}>
              Connect Calendar &amp; Gmail to populate this panel.
            </div>
          ) : (
            <>
              {todayEvents.length > 0 && (
                <Section label="Today" accent={accent}>
                  {todayEvents.map((ev, i) => (
                    <EventRow key={i} title={ev.title} meta={ev.time} accent={accent} />
                  ))}
                </Section>
              )}

              {unread.length > 0 && (
                <Section label="Unread" accent={accent}>
                  {unread.map((em, i) => (
                    <EmailRow key={i} from={em.from} subject={em.subject} accent={accent} />
                  ))}
                </Section>
              )}

              {Object.entries(groups).map(([day, evs]) => (
                <Section key={day} label={day} accent={accent}>
                  {evs.map((ev, i) => (
                    <EventRow key={i} title={ev.title} meta={ev.time} accent={accent} />
                  ))}
                </Section>
              ))}
            </>
          )}
        </div>

        {/* Connected apps */}
        <div style={{ padding: '14px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{
            fontSize: 9, fontWeight: 500, letterSpacing: '1.4px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)',
            marginBottom: 10,
          }}>
            Connected
          </div>
          {connected.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)' }}>No apps connected</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {connected.map((app, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 400,
                  padding: '3px 8px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {fmt(app)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Graph ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

function Section({ label, accent, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{
        fontSize: 9, fontWeight: 500, letterSpacing: '1.4px',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)',
        marginBottom: 11,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function EventRow({ title, meta, accent }) {
  return (
    <div style={{ borderLeft: `1.5px solid ${accent}28`, paddingLeft: 11, marginBottom: 12 }}>
      <div style={{
        fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.78)',
        lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {title}
      </div>
      {meta && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', marginTop: 2 }}>{meta}</div>
      )}
    </div>
  );
}

function EmailRow({ from, subject, accent }) {
  return (
    <div style={{ borderLeft: `1.5px solid ${accent}28`, paddingLeft: 11, marginBottom: 12 }}>
      <div style={{
        fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.26)',
        marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        letterSpacing: '0.1px',
      }}>
        {from}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {subject}
      </div>
    </div>
  );
}
