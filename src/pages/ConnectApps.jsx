import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Brand palette ─────────────────────────────────────────────────
const B = {
  canvas:  '#F3F1E8',
  primary: '#5375A7',
  brand:   '#4A6993',
  nav:     '#8C9DAE',
  text:    '#1A1A2E',
  textSec: '#444',
  muted:   '#777',
  border:  'rgba(0,0,0,0.07)',
  surface: '#FFFFFF',
};

// ── 18 apps, all mocked as connected ─────────────────────────────
const APPS = [
  { id: 'gmail',          label: 'Gmail',           color: '#EA4335', category: 'Communication', desc: 'Emails, threads & contacts'       },
  { id: 'googlecalendar', label: 'Google Calendar', color: '#4285F4', category: 'Time',          desc: 'Events, deadlines & patterns'     },
  { id: 'notion',         label: 'Notion',          color: '#6B6B6B', category: 'Notes',         desc: 'Pages, databases & notes'         },
  { id: 'googledrive',    label: 'Google Drive',    color: '#34A853', category: 'Files',         desc: 'Docs, spreadsheets & files'       },
  { id: 'github',         label: 'GitHub',          color: '#24292e', category: 'Code',          desc: 'Repos, commits & activity'        },
  { id: 'slack',          label: 'Slack',           color: '#4A154B', category: 'Communication', desc: 'Messages, channels & DMs'         },
  { id: 'spotify',        label: 'Spotify',         color: '#1DB954', category: 'Lifestyle',     desc: 'Music & listening habits'         },
  { id: 'strava',         label: 'Strava',          color: '#FC4C02', category: 'Health',        desc: 'Runs, rides & activity'           },
  { id: 'linkedin',       label: 'LinkedIn',        color: '#0077B5', category: 'Professional',  desc: 'Network & career activity'        },
  { id: 'discord',        label: 'Discord',         color: '#5865F2', category: 'Communication', desc: 'Servers, channels & DMs'          },
  { id: 'twitterv2',      label: 'X / Twitter',     color: '#14171A', category: 'Social',        desc: 'Posts, replies & timeline'        },
  { id: 'instagram',      label: 'Instagram',       color: '#E1306C', category: 'Social',        desc: 'Photos, stories & activity'       },
  { id: 'youtube',        label: 'YouTube',         color: '#FF0000', category: 'Media',         desc: 'Watch history & subscriptions'    },
  { id: 'googlesheets',   label: 'Google Sheets',   color: '#0F9D58', category: 'Files',         desc: 'Spreadsheets & data'              },
  { id: 'todoist',        label: 'Todoist',         color: '#DB4035', category: 'Tasks',         desc: 'Tasks, projects & habits'         },
  { id: 'asana',          label: 'Asana',           color: '#F06A6A', category: 'Tasks',         desc: 'Projects, tasks & goals'          },
  { id: 'whatsapp',       label: 'WhatsApp',        color: '#25D366', category: 'Communication', desc: 'Chats & group threads'            },
  { id: 'figma',          label: 'Figma',           color: '#A259FF', category: 'Design',        desc: 'Files, prototypes & comments'     },
];

const CATEGORIES = ['All', ...['Communication','Time','Notes','Files','Code','Health','Lifestyle','Professional','Social','Media','Tasks','Design']
  .filter(c => APPS.some(a => a.category === c))];

/* ── App icon (letter-based, no emoji) ───────────────────────────── */
function AppIcon({ app }) {
  return (
    <div style={{
      width:          38,
      height:         38,
      borderRadius:   10,
      background:     `${app.color}14`,
      border:         `1.5px solid ${app.color}28`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
      fontFamily:     "'DM Sans',system-ui,sans-serif",
      fontSize:       13,
      fontWeight:     700,
      color:          app.color,
      letterSpacing:  '-0.3px',
    }}>
      {app.label.slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ── App card ────────────────────────────────────────────────────── */
function AppCard({ app, i }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:     hov ? B.surface : 'rgba(255,255,255,0.7)',
        border:         `1.5px solid ${hov ? `${app.color}35` : B.border}`,
        borderRadius:   14,
        padding:        '16px',
        transition:     'all 0.18s',
        display:        'flex',
        flexDirection:  'column',
        gap:            10,
        boxShadow:      hov ? `0 6px 20px rgba(0,0,0,0.07)` : '0 1px 4px rgba(0,0,0,0.04)',
        transform:      hov ? 'translateY(-2px)' : 'none',
        animation:      'ca-fade 0.4s ease both',
        animationDelay: `${i * 35}ms`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AppIcon app={app} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: B.text, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {app.label}
          </div>
          <div style={{ fontSize: 10, color: B.nav, marginTop: 2, letterSpacing: '0.3px' }}>{app.category}</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: B.muted, lineHeight: 1.5 }}>{app.desc}</div>

      {/* Connected badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#3d9e6e' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Connected
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function ConnectApps({ embedded = false }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  const visible = APPS.filter(a => filter === 'All' || a.category === filter);

  return (
    <div style={{
      minHeight:  '100vh',
      background: B.canvas,
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
      color:      B.text,
    }}>

      <style>{`
        @keyframes ca-fade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/* Header — hidden when embedded in Vault tabs */}
      {!embedded && <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            12,
        padding:        '0 32px',
        height:         60,
        borderBottom:   `1px solid ${B.border}`,
        background:     'rgba(243,241,232,0.95)',
        position:       'sticky',
        top:            0,
        zIndex:         20,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button
          onClick={() => navigate('/vault')}
          style={{ background: 'transparent', border: 'none', color: B.nav, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = B.text}
          onMouseLeave={e => e.currentTarget.style.color = B.nav}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <img src="/juno_logo.png" alt="Juno" style={{ height: 20, opacity: 0.65 }} />

        <div style={{ marginLeft: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: B.text }}>Connected Apps</div>
          <div style={{ fontSize: 11, color: B.nav, marginTop: 1 }}>{APPS.length} of {APPS.length} connected</div>
        </div>

        {/* All connected pill */}
        <div style={{
          marginLeft:   'auto',
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          background:   'rgba(61,158,110,0.1)',
          border:       '1px solid rgba(61,158,110,0.25)',
          borderRadius: 20,
          padding:      '5px 12px',
          fontSize:     12,
          fontWeight:   600,
          color:        '#3d9e6e',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          All connected
        </div>
      </div>}

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding:      '5px 14px',
                borderRadius: 20,
                border:       filter === cat ? `1px solid ${B.primary}45` : `1px solid ${B.border}`,
                background:   filter === cat ? `${B.primary}10` : 'rgba(255,255,255,0.6)',
                color:        filter === cat ? B.primary : B.nav,
                fontSize:     12,
                fontWeight:   filter === cat ? 600 : 400,
                cursor:       'pointer',
                transition:   'all 0.15s',
                fontFamily:   "'DM Sans',system-ui,sans-serif",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
          {visible.map((app, i) => (
            <AppCard key={app.id} app={app} i={i} />
          ))}
        </div>

      </div>
    </div>
  );
}
