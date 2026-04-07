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
  engineer: '#58A6FF',
  cs:       '#58A6FF',
  business: '#C9A84C',
  premed:   '#34D399',
  creative: '#C084FC',
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
      height:          44,
      flexShrink:      0,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 22px',
      borderBottom:    '1px solid rgba(255,255,255,0.04)',
      background:      'rgba(4,6,12,0.99)',
      backdropFilter:  'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      zIndex:          50,
      position:        'relative',
      fontFamily:      "'DM Sans','Inter',system-ui,sans-serif",
    }}>

      {/* Wordmark */}
      <div style={{
        fontSize:      11,
        fontWeight:    400,
        letterSpacing: '5px',
        color:         'rgba(255,255,255,0.22)',
        textTransform: 'uppercase',
        fontFamily:    'system-ui,-apple-system,sans-serif',
        userSelect:    'none',
      }}>
        breeze
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        {/* Archetype pill */}
        <div style={{
          fontSize:      10,
          fontWeight:    500,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          color:         `${color}cc`,
          padding:       '2px 8px',
          fontFamily:    'system-ui,-apple-system,sans-serif',
        }}>
          {label}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />

        {/* Avatar button */}
        <div
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            7,
            padding:        '4px 8px 4px 4px',
            borderRadius:   20,
            cursor:         'pointer',
            background:     menuOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
            transition:     'background 0.15s',
            userSelect:     'none',
          }}
        >
          <div style={{
            width:          26,
            height:         26,
            borderRadius:   '50%',
            background:     `${color}18`,
            border:         `1px solid ${color}30`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       10,
            fontWeight:     600,
            color:          `${color}cc`,
            letterSpacing:  '0.5px',
            flexShrink:     0,
          }}>
            {initials}
          </div>
          <span style={{
            fontSize:   12,
            color:      'rgba(255,255,255,0.4)',
            fontFamily: 'system-ui,-apple-system,sans-serif',
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
              top:          42,
              right:        0,
              width:        160,
              background:   'rgba(8,10,18,0.98)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              boxShadow:    '0 12px 40px rgba(0,0,0,0.6)',
              zIndex:       100,
              overflow:     'hidden',
              backdropFilter: 'blur(24px)',
            }}>
              <button onClick={() => { setMenuOpen(false); navigate('/join?manage=true'); }} style={menuItemStyle}>
                Connect apps
              </button>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              <button onClick={() => { setMenuOpen(false); onLogout(); }} style={{ ...menuItemStyle, color: 'rgba(255,80,80,0.6)' }}>
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
  padding:    '11px 16px',
  background: 'transparent',
  border:     'none',
  color:      'rgba(255,255,255,0.65)',
  fontSize:   13,
  fontFamily: 'system-ui,-apple-system,sans-serif',
  textAlign:  'left',
  cursor:     'pointer',
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
    <div style={{ minHeight: '100vh', background: '#08080F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#E05555', fontSize: 14 }}>
      {error}
    </div>
  );
}
