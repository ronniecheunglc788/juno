import { useEffect, useRef } from 'react';

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

const FONT  = "'DM Sans','Inter',system-ui,sans-serif";
const SERIF = "'Playfair Display',Georgia,serif";

function useNow() {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return { weekday, dateStr };
}

export default function BoardShell({ children, data, themeKey }) {
  const accent    = ACCENT[themeKey] || '#58A6FF';
  const cal       = data?.calendar      || [];
  const emails    = data?.emails        || [];
  const connected = data?.connectedApps || [];
  const { weekday, dateStr } = useNow();

  const todayEvents    = cal.filter(e => e.isToday);
  const upcomingEvents = cal.filter(e => !e.isToday && e.daysUntil >= 0);
  const unread         = emails.filter(e => e.isUnread).slice(0, 5);

  const groups = upcomingEvents.slice(0, 24).reduce((acc, ev) => {
    const k = ev.dateLabel || 'Later';
    (acc[k] = acc[k] || []).push(ev);
    return acc;
  }, {});

  const empty = todayEvents.length === 0 && unread.length === 0 && Object.keys(groups).length === 0;

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', fontFamily: FONT }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div style={{
        width:         260,
        flexShrink:    0,
        background:    'rgba(3,5,10,1)',
        borderRight:   '1px solid rgba(255,255,255,0.035)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        position:      'relative',
      }}>

        {/* Ambient corner glow */}
        <div style={{
          position:     'absolute',
          bottom:       -60,
          left:         -60,
          width:        260,
          height:       260,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${accent}0a 0%, transparent 68%)`,
          pointerEvents:'none',
          zIndex:       0,
        }} />

        {/* Scrollable panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 22px 16px', position: 'relative', zIndex: 1 }}>

          {/* Date header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{
              fontSize:      9,
              fontWeight:    500,
              letterSpacing: '1.8px',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.14)',
              marginBottom:  8,
              fontFamily:    FONT,
            }}>
              {weekday}
            </div>
            <div style={{
              fontSize:    22,
              fontWeight:  400,
              fontStyle:   'italic',
              color:       'rgba(255,255,255,0.48)',
              letterSpacing: '-0.3px',
              lineHeight:  1.1,
              fontFamily:  SERIF,
            }}>
              {dateStr}
            </div>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 80%)', marginBottom: 26 }} />

          {empty ? (
            <div style={{
              color:      'rgba(255,255,255,0.12)',
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

        {/* Connected apps footer */}
        <div style={{
          padding:    '16px 22px 22px',
          borderTop:  '1px solid rgba(255,255,255,0.035)',
          flexShrink: 0,
          position:   'relative',
          zIndex:     1,
        }}>
          <div style={{
            fontSize:      9,
            fontWeight:    500,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.12)',
            marginBottom:  10,
          }}>
            Connected
          </div>
          {connected.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)', fontWeight: 300 }}>
              No apps connected
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {connected.map((app, i) => (
                <span key={i} style={{
                  fontSize:   10,
                  fontWeight: 400,
                  padding:    '3px 9px',
                  borderRadius: 20,
                  background: `${accent}08`,
                  color:      `${accent}60`,
                  border:     `1px solid ${accent}14`,
                  letterSpacing: '0.1px',
                }}>
                  {fmt(app)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Graph canvas ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}

        {/* Edge vignette for depth */}
        <div style={{
          position:      'absolute',
          inset:         0,
          background:    'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 38%, rgba(3,5,10,0.45) 100%)',
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
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        marginBottom:   12,
      }}>
        <div style={{
          width:      14,
          height:     1,
          background: `${accent}40`,
          flexShrink: 0,
        }} />
        <div style={{
          fontSize:      9,
          fontWeight:    500,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.18)',
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
    <div style={{ display: 'flex', gap: 12, marginBottom: 13, alignItems: 'flex-start' }}>
      <div style={{
        marginTop:    5,
        width:        5,
        height:       5,
        borderRadius: '50%',
        background:   `${accent}50`,
        flexShrink:   0,
        boxShadow:    `0 0 5px ${accent}40`,
      }} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize:     13,
          fontWeight:   400,
          color:        'rgba(255,255,255,0.72)',
          lineHeight:   1.4,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {title}
        </div>
        {time && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
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
        border:         `1px solid ${accent}20`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       8,
        fontWeight:     600,
        color:          `${accent}80`,
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
          color:        'rgba(255,255,255,0.28)',
          marginBottom: 2,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          letterSpacing:'0.1px',
        }}>
          {from}
        </div>
        <div style={{
          fontSize:     13,
          fontWeight:   400,
          color:        'rgba(255,255,255,0.68)',
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
