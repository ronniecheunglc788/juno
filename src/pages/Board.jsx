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
      height:          48,
      flexShrink:      0,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 24px',
      borderBottom:    '1px solid rgba(255,255,255,0.05)',
      background:      'rgba(5,8,15,0.96)',
      backdropFilter:  'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex:          50,
      position:        'relative',
    }}>

      {/* Wordmark */}
      <div style={{
        fontSize:      13,
        fontWeight:    300,
        letterSpacing: '5px',
        color:         'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        fontFamily:    'system-ui,-apple-system,sans-serif',
        userSelect:    'none',
      }}>
        breeze
      </div>

      {/* User identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        {/* Archetype badge */}
        <div style={{
          fontSize:      10,
          fontWeight:    500,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color:         color,
          background:    `${color}14`,
          border:        `1px solid ${color}28`,
          borderRadius:  5,
          padding:       '3px 9px',
          fontFamily:    'system-ui,-apple-system,sans-serif',
        }}>
          {label}
        </div>

        {/* Name */}
        <div style={{
          fontSize:   13,
          color:      'rgba(255,255,255,0.55)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          fontWeight: 400,
        }}>
          {user?.name?.split(' ')[0] || ''}
        </div>

        {/* Avatar — click to open menu */}
        <div
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width:        30,
            height:       30,
            borderRadius: '50%',
            background:   `${color}22`,
            border:       `1px solid ${color}44`,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            fontSize:     11,
            fontWeight:   600,
            color:        color,
            fontFamily:   'system-ui,-apple-system,sans-serif',
            letterSpacing:'0.5px',
            userSelect:   'none',
            flexShrink:   0,
            cursor:       'pointer',
          }}
        >
          {initials}
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            {/* Backdrop to close */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div style={{
              position:     'absolute',
              top:          38,
              right:        0,
              width:        170,
              background:   'rgba(10,13,22,0.97)',
              border:       '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
              zIndex:       100,
              overflow:     'hidden',
              backdropFilter: 'blur(20px)',
            }}>
              <button
                onClick={() => { setMenuOpen(false); navigate('/join'); }}
                style={menuItemStyle}
              >
                Connect apps
              </button>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              <button
                onClick={() => { setMenuOpen(false); onLogout(); }}
                style={{ ...menuItemStyle, color: 'rgba(255,100,100,0.7)' }}
              >
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
