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

// Faint bg tint that bleeds into the vignette
const BG_TINT = {
  engineer: 'rgba(239,244,255,0.8)',
  business: 'rgba(255,251,240,0.8)',
  premed:   'rgba(239,253,245,0.8)',
  creative: 'rgba(245,240,255,0.8)',
};

const FONT  = "'DM Sans','Inter',system-ui,sans-serif";
const SERIF = "'Playfair Display',Georgia,serif";

export default function BoardShell({ children, data, themeKey }) {
  const accent  = ACCENT[themeKey] || '#2563EB';
  const bgTint  = BG_TINT[themeKey] || BG_TINT.engineer;
  const cal     = data?.calendar      || [];
  const emails  = data?.emails        || [];
  const connected = data?.connectedApps || [];

  const todayEvents    = cal.filter(e => e.isToday);
  const upcomingEvents = cal.filter(e => !e.isToday && e.daysUntil >= 0);
  const unread         = emails.filter(e => e.isUnread).slice(0, 5);

  const groups = upcomingEvents.slice(0, 24).reduce((acc, ev) => {
    const k = ev.dateLabel || 'Later';
    (acc[k] = acc[k] || []).push(ev);
    return acc;
  }, {});

  const empty = todayEvents.length === 0 && unread.length === 0 && Object.keys(groups).length === 0;

  const now     = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', fontFamily: FONT }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div style={{
        width:         260,
        flexShrink:    0,
        background:    '#FFFFFF',
        borderRight:   '1px solid rgba(0,0,0,0.07)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        position:      'relative',
      }}>

        {/* Accent glow in corner */}
        <div style={{
          position:     'absolute',
          bottom:       -60,
          left:         -60,
          width:        240,
          height:       240,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${accent}08 0%, transparent 68%)`,
          pointerEvents:'none',
          zIndex:       0,
        }} />

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 22px 16px', position: 'relative', zIndex: 1 }}>

          {/* Date header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{
              fontSize:      9,
              fontWeight:    500,
              letterSpacing: '1.8px',
              textTransform: 'uppercase',
              color:         'rgba(0,0,0,0.28)',
              marginBottom:  8,
            }}>
              {weekday}
            </div>
            <div style={{
              fontSize:    22,
              fontWeight:  400,
              fontStyle:   'italic',
              color:       'rgba(0,0,0,0.55)',
              letterSpacing: '-0.3px',
              lineHeight:  1.1,
              fontFamily:  SERIF,
            }}>
              {dateStr}
            </div>
          </div>

          <div style={{
            height:     1,
            background: `linear-gradient(90deg, ${accent}20 0%, transparent 80%)`,
            marginBottom: 26,
          }} />

          {empty ? (
            <div style={{
              color:      'rgba(0,0,0,0.28)',
              fontSize:   13,
              lineHeight: 1.8,
              fontWeight: 300,
            }}>
              Connect Calendar &amp; Gmail<br />to populate this panel.
            </div>
          ) : (
            <>
              {todayEvents.length > 0 && (
                <Section label="Today" accent={accent}>
                  {todayEvents.map((ev, i) => (
                    <EventRow key={i} title={ev.title} time={ev.time} accent={accent} />
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
                    <EventRow key={i} title={ev.title} time={ev.time} accent={accent} />
                  ))}
                </Section>
              ))}
            </>
          )}
        </div>

        {/* Connected apps */}
        <div style={{
          padding:    '16px 22px 22px',
          borderTop:  '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0,
          position:   'relative',
          zIndex:     1,
        }}>
          <div style={{
            fontSize:      9,
            fontWeight:    500,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color:         'rgba(0,0,0,0.22)',
            marginBottom:  10,
          }}>
            Connected
          </div>
          {connected.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.22)', fontWeight: 300 }}>
              No apps connected
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {connected.map((app, i) => (
                <span key={i} style={{
                  fontSize:     10,
                  fontWeight:   500,
                  padding:      '3px 9px',
                  borderRadius: 20,
                  background:   `${accent}0c`,
                  color:        `${accent}cc`,
                  border:       `1px solid ${accent}22`,
                  letterSpacing:'0.1px',
                }}>
                  {fmt(app)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Graph canvas ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
        {/* Soft edge vignette tinted to board color */}
        <div style={{
          position:      'absolute',
          inset:         0,
          background:    `radial-gradient(ellipse 78% 78% at 50% 50%, transparent 40%, ${bgTint} 100%)`,
          pointerEvents: 'none',
          zIndex:        1,
        }} />
      </div>
    </div>
  );
}

function Section({ label, accent, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 12, height: 1, background: `${accent}50`, flexShrink: 0 }} />
        <div style={{
          fontSize:      9,
          fontWeight:    500,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          color:         'rgba(0,0,0,0.3)',
          whiteSpace:    'nowrap',
        }}>
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
      <div style={{
        marginTop:    5,
        width:        5,
        height:       5,
        borderRadius: '50%',
        background:   accent,
        flexShrink:   0,
        opacity:      0.55,
      }} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize:     13,
          fontWeight:   400,
          color:        'rgba(0,0,0,0.75)',
          lineHeight:   1.4,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {title}
        </div>
        {time && (
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.32)', marginTop: 2 }}>
            {time}
          </div>
        )}
      </div>
    </div>
  );
}

function EmailRow({ from, subject, accent }) {
  const initials = (from || '?')
    .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 13, alignItems: 'flex-start' }}>
      <div style={{
        width:          24,
        height:         24,
        borderRadius:   '50%',
        background:     `${accent}10`,
        border:         `1px solid ${accent}28`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       8,
        fontWeight:     700,
        color:          `${accent}cc`,
        letterSpacing:  '0.3px',
        flexShrink:     0,
        marginTop:      1,
      }}>
        {initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize:     10,
          fontWeight:   500,
          color:        'rgba(0,0,0,0.38)',
          marginBottom: 2,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {from}
        </div>
        <div style={{
          fontSize:     13,
          fontWeight:   400,
          color:        'rgba(0,0,0,0.72)',
          lineHeight:   1.35,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {subject}
        </div>
      </div>
    </div>
  );
}
