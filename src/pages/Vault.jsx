import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ContextBuilder from '../components/ContextBuilder';
import MossBoard      from '../components/boards/MossBoard';
import HomeContent    from '../components/HomeContent';
import { MOCK_PROFILES, PEOPLE } from '../data/mockProfiles';

const TABS = [
  { id: 'home',     label: 'Home'             },
  { id: 'moss',     label: 'Knowledge Graph'   },
  { id: 'database', label: 'Personal Database' },
];

// Tabs that use a dark background
const DARK_TABS = new Set(['moss']);

export default function Vault() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab,    setActiveTab]    = useState('home');
  const [mossUnlocked, setMossUnlocked] = useState(false);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockKey = searchParams.get('user');
    const profile = PEOPLE[mockKey] ?? MOCK_PROFILES[mockKey];
    if (mockKey && profile) {
      setData(profile);
      setLoading(false);
      return;
    }

    const saved = localStorage.getItem('juno_user');
    if (!saved) { navigate('/join'); return; }
    let u;
    try { u = JSON.parse(saved); } catch { localStorage.removeItem('juno_user'); navigate('/join'); return; }

    fetch(`/api/board-data?userId=${u.id}&entityId=${u.entity_id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate, searchParams]);

  const isDark = DARK_TABS.has(activeTab);

  function switchTab(id) {
    setActiveTab(id);
    if (id === 'moss') setMossUnlocked(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Tab bar */}
      <div style={{
        flexShrink:   0,
        display:      'flex',
        alignItems:   'center',
        gap:          4,
        padding:      '0 24px',
        height:       52,
        background:   isDark ? '#08080F' : '#F3F1E8',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
        transition:   'background 0.3s, border-color 0.3s',
        zIndex:       10,
        position:     'relative',
      }}>

        {/* Juno logo */}
        <img
          src="/juno_logo.png"
          alt="Juno"
          style={{ height: 22, width: 'auto', marginRight: 8, opacity: isDark ? 0.55 : 0.7 }}
        />

        {TABS.map(tab => {
          const active = activeTab === tab.id;
          // each tab has its own accent
          const accent =
            tab.id === 'home'        ? '#5375A7' :
            tab.id === 'database'    ? '#5375A7' :
            tab.id === 'connections' ? '#5A967A' :
            '#C9A84C';

          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                padding:       '6px 16px',
                borderRadius:  20,
                border:        active
                  ? `1px solid ${accent}${isDark ? '50' : '45'}`
                  : '1px solid transparent',
                background:    active
                  ? `${accent}${isDark ? '18' : '10'}`
                  : 'transparent',
                color:         active
                  ? (isDark ? `${accent}` : accent)
                  : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.38)'),
                fontSize:      13,
                fontWeight:    active ? 600 : 400,
                letterSpacing: '0.2px',
                cursor:        'pointer',
                fontFamily:    "'DM Sans','Inter',system-ui,sans-serif",
                transition:    'all 0.18s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content panels */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Home */}
        <div style={{ display: activeTab === 'home' ? 'block' : 'none', width: '100%', height: '100%', overflow: 'auto' }}>
          <HomeContent onNavigate={switchTab} />
        </div>

        {/* Personal Database */}
        <div style={{ display: activeTab === 'database' ? 'block' : 'none', width: '100%', height: '100%', background: '#F3F1E8' }}>
          <ContextBuilder />
        </div>

        {/* Knowledge Graph */}
        {mossUnlocked && (
          <div style={{ display: activeTab === 'moss' ? 'block' : 'none', width: '100%', height: '100%' }}>
            <MossBoard data={data} loading={loading} />
          </div>
        )}

      </div>
    </div>
  );
}
