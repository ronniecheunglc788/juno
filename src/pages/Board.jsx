import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PremedBoard   from '../components/boards/PremedBoard';
import EngineerBoard from '../components/boards/CSBoard';
import BusinessBoard from '../components/boards/BusinessBoard';
import CreativeBoard from '../components/boards/CreativeBoard';

const ARCHETYPES = [
  { key: 'engineer', label: 'Engineer', color: '#2563EB' },
  { key: 'business', label: 'Business', color: '#B45309' },
  { key: 'premed',   label: 'Pre-Med',  color: '#059669' },
  { key: 'creative', label: 'Creative', color: '#7C3AED' },
];

const ARCH_MAP = Object.fromEntries(ARCHETYPES.map(a => [a.key, a]));
ARCH_MAP['cs'] = ARCH_MAP['engineer'];

function UserNav({ user, onLogout, onArchetypeChange }) {
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [archOpen,      setArchOpen]      = useState(false);
  const [switching,     setSwitching]     = useState(false);
  const navigate = useNavigate();

  const initials = (user?.name || '?')
    .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const arch  = ARCH_MAP[user?.archetype] || ARCH_MAP['engineer'];
  const color = arch.color;
  const label = arch.label;

  async function handleArchetypeSelect(key) {
    if (key === user?.archetype || switching) return;
    setArchOpen(false);
    setSwitching(true);
    try {
      const r = await fetch('/api/user', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id, archetype: key }),
      });
      const updated = await r.json();
      if (r.ok && updated.id) {
        const newUser = { ...user, archetype: key };
        localStorage.setItem('breeze_user', JSON.stringify(newUser));
        onArchetypeChange(newUser);
      }
    } catch (e) {
      console.error('[archetype switch]', e);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div style={{
      height:          68,
      flexShrink:      0,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 32px',
      borderBottom:    '1px solid rgba(0,0,0,0.07)',
      background:      'rgba(255,255,255,0.98)',
      backdropFilter:  'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      zIndex:          50,
      position:        'relative',
      fontFamily:      "'DM Sans','Inter',system-ui,sans-serif",
    }}>

      {/* Wordmark */}
      <div style={{
        fontSize:      15,
        fontWeight:    300,
        letterSpacing: '7px',
        color:         'rgba(0,0,0,0.28)',
        textTransform: 'uppercase',
        userSelect:    'none',
      }}>
        breeze
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>

        {/* Archetype switcher pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setArchOpen(o => !o); setMenuOpen(false); }}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            7,
              fontSize:       12,
              fontWeight:     600,
              letterSpacing:  '1.2px',
              textTransform:  'uppercase',
              color:          color,
              padding:        '6px 14px',
              borderRadius:   24,
              background:     archOpen ? `${color}14` : `${color}0c`,
              border:         `1px solid ${color}${archOpen ? '35' : '20'}`,
              cursor:         switching ? 'wait' : 'pointer',
              transition:     'background 0.15s, border-color 0.15s',
              fontFamily:     "'DM Sans','Inter',system-ui,sans-serif",
              opacity:        switching ? 0.6 : 1,
            }}
          >
            {label}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.6, transform: archOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {archOpen && (
            <>
              <div onClick={() => setArchOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position:     'absolute',
                top:          44,
                right:        0,
                width:        176,
                background:   'rgba(255,255,255,0.99)',
                border:       '1px solid rgba(0,0,0,0.09)',
                borderRadius: 14,
                boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
                zIndex:       100,
                overflow:     'hidden',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding:      '6px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.28)', padding: '6px 10px 8px' }}>
                  Switch archetype
                </div>
                {ARCHETYPES.map(a => (
                  <button
                    key={a.key}
                    onClick={() => handleArchetypeSelect(a.key)}
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         10,
                      width:       '100%',
                      padding:     '9px 10px',
                      background:  a.key === user?.archetype ? `${a.color}0e` : 'transparent',
                      border:      'none',
                      borderRadius: 9,
                      cursor:      'pointer',
                      fontFamily:  "'DM Sans','Inter',system-ui,sans-serif",
                      textAlign:   'left',
                      transition:  'background 0.12s',
                    }}
                    onMouseEnter={e => { if (a.key !== user?.archetype) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = a.key === user?.archetype ? `${a.color}0e` : 'transparent'; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0, opacity: a.key === user?.archetype ? 1 : 0.45 }} />
                    <span style={{ fontSize: 14, fontWeight: a.key === user?.archetype ? 600 : 400, color: a.key === user?.archetype ? a.color : 'rgba(0,0,0,0.62)', letterSpacing: '0.1px' }}>
                      {a.label}
                    </span>
                    {a.key === user?.archetype && (
                      <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke={a.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)' }} />

        {/* Avatar + name button */}
        <div
          onClick={() => { setMenuOpen(o => !o); setArchOpen(false); }}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            10,
            padding:        '5px 14px 5px 6px',
            borderRadius:   28,
            cursor:         'pointer',
            background:     menuOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
            border:         menuOpen ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
            transition:     'background 0.15s, border-color 0.15s',
            userSelect:     'none',
          }}
        >
          <div style={{
            width:          36,
            height:         36,
            borderRadius:   '50%',
            background:     `${color}14`,
            border:         `1.5px solid ${color}35`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       13,
            fontWeight:     700,
            color:          color,
            letterSpacing:  '0.5px',
            flexShrink:     0,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.1px' }}>
            {user?.name?.split(' ')[0] || ''}
          </span>
        </div>

        {/* User dropdown */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{
              position:     'absolute',
              top:          58,
              right:        0,
              width:        176,
              background:   'rgba(255,255,255,0.99)',
              border:       '1px solid rgba(0,0,0,0.09)',
              borderRadius: 14,
              boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
              zIndex:       100,
              overflow:     'hidden',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}>
              <button onClick={() => { setMenuOpen(false); navigate('/join?manage=true'); }} style={menuItemStyle}>
                Connect apps
              </button>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />
              <button onClick={() => { setMenuOpen(false); onLogout(); }} style={{ ...menuItemStyle, color: 'rgba(200,40,40,0.7)' }}>
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const menuItemStyle = {
  display:    'block',
  width:      '100%',
  padding:    '13px 18px',
  background: 'transparent',
  border:     'none',
  color:      'rgba(0,0,0,0.62)',
  fontSize:   14,
  fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
  textAlign:  'left',
  cursor:     'pointer',
  letterSpacing: '0.1px',
};

export default function Board() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('breeze_user');
    if (!saved) { navigate('/join'); return; }
    let u;
    try { u = JSON.parse(saved); } catch { localStorage.removeItem('breeze_user'); navigate('/join'); return; }
    setUser(u);

    fetch(`/api/board-data?userId=${u.id}&entityId=${u.entity_id}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('breeze_user');
    navigate('/join');
  }

  function handleArchetypeChange(newUser) {
    setUser(newUser);
  }

  if (error) return <ErrorState error={error} />;
  if (!user)  return null;

  const arch  = user.archetype;
  const BoardComponent =
    arch === 'premed'   ? PremedBoard   :
    arch === 'business' ? BusinessBoard :
    arch === 'creative' ? CreativeBoard :
    EngineerBoard;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <UserNav user={user} onLogout={handleLogout} onArchetypeChange={handleArchetypeChange} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <BoardComponent data={data} loading={loading} />
      </div>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif", color: 'rgba(180,40,40,0.8)', fontSize: 13 }}>
      {error}
    </div>
  );
}
