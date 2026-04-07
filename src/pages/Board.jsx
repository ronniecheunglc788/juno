import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PremedBoard   from '../components/boards/PremedBoard';
import EngineerBoard from '../components/boards/CSBoard';
import BusinessBoard from '../components/boards/BusinessBoard';
import CreativeBoard from '../components/boards/CreativeBoard';

const ARCH_LABEL = {
  engineer: 'Engineer',
  cs:       'Engineer',
  business: 'Business',
  premed:   'Pre-Med',
  creative: 'Creative',
};

const ARCH_COLOR = {
  engineer: '#2563EB',
  cs:       '#2563EB',
  business: '#B45309',
  premed:   '#059669',
  creative: '#7C3AED',
};

function UserNav({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const initials = (user?.name || '?')
    .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const arch  = user?.archetype || 'engineer';
  const color = ARCH_COLOR[arch] || '#58A6FF';
  const label = ARCH_LABEL[arch] || arch;

  return (
    <div style={{
      height:          50,
      flexShrink:      0,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 26px',
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
        fontSize:      10,
        fontWeight:    400,
        letterSpacing: '5.5px',
        color:         'rgba(0,0,0,0.22)',
        textTransform: 'uppercase',
        userSelect:    'none',
      }}>
        breeze
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        {/* Archetype pill */}
        <div style={{
          fontSize:      9,
          fontWeight:    600,
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color:         color,
          opacity:       0.75,
          padding:       '3px 10px',
          borderRadius:  20,
          background:    `${color}0c`,
          border:        `1px solid ${color}20`,
        }}>
          {label}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.08)' }} />

        {/* Avatar button */}
        <div
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            8,
            padding:        '4px 10px 4px 4px',
            borderRadius:   22,
            cursor:         'pointer',
            background:     menuOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
            border:         menuOpen ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
            transition:     'background 0.15s, border-color 0.15s',
            userSelect:     'none',
          }}
        >
          <div style={{
            width:          28,
            height:         28,
            borderRadius:   '50%',
            background:     `${color}14`,
            border:         `1.5px solid ${color}35`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       10,
            fontWeight:     700,
            color:          color,
            letterSpacing:  '0.5px',
            flexShrink:     0,
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: 13,
            color:    'rgba(0,0,0,0.45)',
          }}>
            {user?.name?.split(' ')[0] || ''}
          </span>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{
              position:     'absolute',
              top:          48,
              right:        0,
              width:        168,
              background:   'rgba(255,255,255,0.98)',
              border:       '1px solid rgba(0,0,0,0.09)',
              borderRadius: 12,
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
  padding:    '12px 16px',
  background: 'transparent',
  border:     'none',
  color:      'rgba(0,0,0,0.62)',
  fontSize:   13,
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
      <UserNav user={user} onLogout={handleLogout} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
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
