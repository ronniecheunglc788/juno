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
      height:          50,
      flexShrink:      0,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 26px',
      borderBottom:    '1px solid rgba(255,255,255,0.04)',
      background:      'rgba(3,5,10,0.99)',
      backdropFilter:  'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      zIndex:          50,
      position:        'relative',
      fontFamily:      "'DM Sans','Inter',system-ui,sans-serif",
    }}>

      {/* Wordmark */}
      <div style={{
        fontSize:      10,
        fontWeight:    400,
        letterSpacing: '5.5px',
        color:         'rgba(255,255,255,0.2)',
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
          fontWeight:    500,
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color:         `${color}70`,
          padding:       '3px 10px',
          borderRadius:  20,
          background:    `${color}0a`,
          border:        `1px solid ${color}16`,
        }}>
          {label}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.07)' }} />

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
            background:     menuOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
            border:         menuOpen ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
            transition:     'background 0.15s, border-color 0.15s',
            userSelect:     'none',
          }}
        >
          <div style={{
            width:          28,
            height:         28,
            borderRadius:   '50%',
            background:     `${color}14`,
            border:         `1px solid ${color}28`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       10,
            fontWeight:     600,
            color:          `${color}cc`,
            letterSpacing:  '0.5px',
            flexShrink:     0,
            boxShadow:      `0 0 10px ${color}14`,
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: 13,
            color:    'rgba(255,255,255,0.38)',
          }}>
            {user?.name?.split(' ')[0] || ''}
          </span>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{
              position:        'absolute',
              top:             48,
              right:           0,
              width:           168,
              background:      'rgba(6,9,16,0.97)',
              border:          '1px solid rgba(255,255,255,0.07)',
              borderRadius:    12,
              boxShadow:       '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
              zIndex:          100,
              overflow:        'hidden',
              backdropFilter:  'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}>
              <button onClick={() => { setMenuOpen(false); navigate('/join?manage=true'); }} style={menuItemStyle}>
                Connect apps
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 12px' }} />
              <button onClick={() => { setMenuOpen(false); onLogout(); }} style={{ ...menuItemStyle, color: 'rgba(255,80,80,0.55)' }}>
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
  color:      'rgba(255,255,255,0.58)',
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
    <div style={{ minHeight: '100vh', background: '#08080F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#E05555', fontSize: 14 }}>
      {error}
    </div>
  );
}
