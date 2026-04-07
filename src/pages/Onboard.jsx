import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const APPS = [
  { id: 'gmail',          label: 'Gmail',           required: true  },
  { id: 'googlecalendar', label: 'Google Calendar', required: true  },
  { id: 'notion',         label: 'Notion',          required: false },
  { id: 'slack',          label: 'Slack',           required: false },
  { id: 'linkedin',       label: 'LinkedIn',        required: false },
  { id: 'github',         label: 'GitHub',          required: false },
  { id: 'discord',        label: 'Discord',         required: false },
  { id: 'twitterv2',      label: 'Twitter / X',     required: false },
  { id: 'instagram',      label: 'Instagram',       required: false },
  { id: 'youtube',        label: 'YouTube',         required: false },
  { id: 'googledrive',    label: 'Google Drive',    required: false },
  { id: 'googlesheets',   label: 'Google Sheets',   required: false },
  { id: 'todoist',        label: 'Todoist',         required: false },
  { id: 'asana',          label: 'Asana',           required: false },
  { id: 'whatsapp',       label: 'WhatsApp',        required: false },
  { id: 'spotify',        label: 'Spotify',         required: false },
  { id: 'strava',         label: 'Strava',          required: false },
];

// ── Cursor-tracking light veil ────────────────────────────────────
function AmbientLight() {
  const ref = useRef(null);
  const pos = useRef({ x: 0.5, y: 0.4 });
  const cur = useRef({ x: 0.5, y: 0.4 });
  const raf = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(e) {
      pos.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }

    function animate() {
      cur.current.x += (pos.current.x - cur.current.x) * 0.05;
      cur.current.y += (pos.current.y - cur.current.y) * 0.05;
      const x  = (cur.current.x * 100).toFixed(1);
      const y  = (cur.current.y * 100).toFixed(1);
      const xi = (100 - cur.current.x * 100).toFixed(1);
      const yi = (100 - cur.current.y * 100).toFixed(1);
      el.style.background = `
        radial-gradient(ellipse 70% 55% at ${x}% ${y}%, rgba(120,60,255,0.30) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at ${xi}% ${yi}%, rgba(160,100,255,0.16) 0%, transparent 55%)
      `;
      raf.current = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        1,
      }}
    />
  );
}

// ── Step 1: Landing / register ────────────────────────────────────
function LandingStep({ onSubmit, loading, error }) {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');

  return (
    <div style={{
      minHeight:     '100vh',
      background:    '#F9F8F6',
      display:       'flex',
      flexDirection: 'column',
      position:      'relative',
      overflow:      'hidden',
      fontFamily:    "'DM Sans', system-ui, sans-serif",
    }}>
      <AmbientLight />

      {/* Noise texture */}
      <div style={{
        position:   'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Nav */}
      <div style={{
        position:   'relative', zIndex: 10,
        padding:    '28px 48px',
        display:    'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 400, letterSpacing: '5px',
          color: 'rgba(10,10,10,0.35)', textTransform: 'uppercase', userSelect: 'none',
        }}>
          breeze
        </div>
        <a href="/login" style={{
          fontSize: 13, color: 'rgba(10,10,10,0.4)', textDecoration: 'none',
          fontWeight: 400, letterSpacing: '0.2px',
        }}>
          Sign in
        </a>
      </div>

      {/* Main layout */}
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '40px 48px 80px',
        position:       'relative', zIndex: 10,
        gap:            96,
      }}>

        {/* ── Hero text ── */}
        <div style={{ flex: '0 0 auto', maxWidth: 520 }}>
          <p style={{
            fontFamily:    "'DM Sans', system-ui, sans-serif",
            fontSize:      'clamp(28px, 3.5vw, 46px)',
            fontWeight:    300,
            lineHeight:    1.22,
            letterSpacing: '-0.5px',
            color:         'rgba(10,10,10,0.82)',
            margin:        0,
          }}>
            Businesses drive success<br />
            from data&#8209;driven decisions.
          </p>

          <p style={{
            fontFamily:    "'DM Sans', system-ui, sans-serif",
            fontSize:      'clamp(28px, 3.5vw, 46px)',
            fontWeight:    300,
            lineHeight:    1.22,
            letterSpacing: '-0.5px',
            color:         'rgba(10,10,10,0.42)',
            margin:        '14px 0 28px',
          }}>
            What's stopping you?
          </p>

          <p style={{
            fontFamily:    "'Major Mono Display', monospace",
            fontSize:      'clamp(28px, 3.6vw, 54px)',
            fontWeight:    400,
            fontStyle:     'normal',
            lineHeight:    1.28,
            letterSpacing: '-0.5px',
            color:         'rgba(10,10,10,0.85)',
            margin:        0,
          }}>
            Build your own<br />context now.
          </p>

          {/* Decorative line */}
          <div style={{
            width: 40, height: 1,
            background: 'rgba(10,10,10,0.15)',
            marginTop: 44,
          }} />
        </div>

        {/* ── Form ── */}
        <div style={{
          flex:          '0 0 340px',
          background:    'rgba(255,255,255,0.72)',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border:        '1px solid rgba(10,10,10,0.07)',
          borderRadius:  16,
          padding:       '36px 32px',
          boxShadow:     '0 4px 40px rgba(10,10,10,0.06), 0 1px 3px rgba(10,10,10,0.04)',
        }}>
          <h2 style={{
            fontFamily:    "'DM Sans', system-ui, sans-serif",
            fontSize:      17,
            fontWeight:    500,
            color:         'rgba(10,10,10,0.85)',
            margin:        '0 0 6px',
            letterSpacing: '-0.2px',
          }}>
            Set up your board
          </h2>
          <p style={{
            fontSize:   13,
            color:      'rgba(10,10,10,0.38)',
            margin:     '0 0 28px',
            lineHeight: 1.6,
          }}>
            Connect your apps. Breeze builds a personalized view of your world.
          </p>

          <form onSubmit={e => { e.preventDefault(); onSubmit(name, email); }}>
            <Field label="Name">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="First name"
                autoFocus
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu"
              />
            </Field>

            {error && (
              <div style={{
                fontSize: 12, color: 'rgba(180,40,40,0.85)',
                background: 'rgba(180,40,40,0.05)',
                border: '1px solid rgba(180,40,40,0.1)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <PrimaryBtn disabled={loading}>
              {loading ? 'Setting up…' : 'Continue'}
            </PrimaryBtn>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Connect apps ──────────────────────────────────────────
function ConnectStep({ user, isManage, onDetect, loading, error }) {
  const [connected, setConnected] = useState({});
  const [connErr, setConnErr]     = useState('');

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res  = await fetch(`/api/status?entityId=${user.entity_id}`);
        const data = await res.json();
        if (data.connected) {
          const map = {};
          data.connected.forEach(c => { if (c.status === 'ACTIVE') map[c.app] = true; });
          setConnected(map);
        }
      } catch (_) {}
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, [user]);

  async function handleConnect(appId) {
    const win = window.open('', '_blank');
    try {
      const res  = await fetch(`/api/connect?entityId=${user.entity_id}&app=${appId}`);
      const data = await res.json();
      if (data.redirectUrl) { win.location.href = data.redirectUrl; }
      else { win.close(); setConnErr(data.error || 'Could not get connection URL'); }
    } catch (err) { win.close(); setConnErr('Could not start connection: ' + err.message); }
  }

  const missingRequired = APPS.filter(a => a.required && !connected[a.id]);
  const requiredConnected = missingRequired.length === 0;
  const connectedCount    = Object.keys(connected).length;

  return (
    <div style={{
      minHeight:     '100vh',
      background:    '#F9F8F6',
      display:       'flex',
      alignItems:    'center',
      justifyContent:'center',
      fontFamily:    "'DM Sans', system-ui, sans-serif",
      padding:       '40px 24px',
      position:      'relative',
    }}>
      <AmbientLight />

      <div style={{
        position:      'relative', zIndex: 10,
        width:         '100%', maxWidth: 460,
        background:    'rgba(255,255,255,0.8)',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border:        '1px solid rgba(10,10,10,0.07)',
        borderRadius:  18,
        padding:       '40px 36px',
        boxShadow:     '0 4px 40px rgba(10,10,10,0.07)',
      }}>
        {/* Wordmark */}
        <div style={{
          fontSize: 11, fontWeight: 400, letterSpacing: '5px',
          color: 'rgba(10,10,10,0.25)', textTransform: 'uppercase',
          marginBottom: 32, userSelect: 'none',
        }}>
          breeze
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 500, color: 'rgba(10,10,10,0.85)',
          margin: '0 0 6px', letterSpacing: '-0.2px',
        }}>
          {isManage ? 'Manage connections' : 'Connect your apps'}
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(10,10,10,0.38)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Breeze reads your data to understand what you need. Connect more apps for a richer board.
        </p>

        {connectedCount > 0 && (
          <div style={{ fontSize: 12, color: 'rgba(30,140,60,0.8)', marginBottom: 16, fontWeight: 500 }}>
            {connectedCount} app{connectedCount !== 1 ? 's' : ''} connected
          </div>
        )}

        {/* App list */}
        <div style={{ maxHeight: 280, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
          {APPS.map(app => (
            <div key={app.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0',
              borderBottom: '1px solid rgba(10,10,10,0.05)',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 400, color: 'rgba(10,10,10,0.78)' }}>
                  {app.label}
                  {app.required && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(160,120,0,0.7)', fontWeight: 500 }}>required</span>
                  )}
                </div>
              </div>
              {connected[app.id]
                ? (
                  <div style={{
                    fontSize: 12, fontWeight: 500, color: 'rgba(30,140,60,0.8)',
                    background: 'rgba(30,140,60,0.06)', border: '1px solid rgba(30,140,60,0.15)',
                    borderRadius: 6, padding: '4px 11px',
                  }}>✓ Connected</div>
                ) : (
                  <button
                    onClick={() => handleConnect(app.id)}
                    style={{
                      fontSize: 12, fontWeight: 500, color: 'rgba(10,10,10,0.5)',
                      background: 'rgba(10,10,10,0.04)', border: '1px solid rgba(10,10,10,0.09)',
                      borderRadius: 6, padding: '4px 11px', cursor: 'pointer',
                    }}
                  >
                    Connect
                  </button>
                )
              }
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(10,10,10,0.06)', margin: '20px 0' }} />

        {!requiredConnected && (
          <div style={{
            fontSize: 12, color: 'rgba(140,100,0,0.8)',
            background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.15)',
            borderRadius: 8, padding: '9px 12px', marginBottom: 14, lineHeight: 1.55,
          }}>
            Connect <strong>{missingRequired.map(a => a.label).join(' + ')}</strong> to build your board.
          </div>
        )}

        {(error || connErr) && (
          <div style={{
            fontSize: 12, color: 'rgba(180,40,40,0.85)',
            background: 'rgba(180,40,40,0.05)', border: '1px solid rgba(180,40,40,0.1)',
            borderRadius: 8, padding: '9px 12px', marginBottom: 14,
          }}>
            {error || connErr}
          </div>
        )}

        <DarkBtn
          disabled={!requiredConnected}
          onClick={requiredConnected ? onDetect : undefined}
          style={{ opacity: requiredConnected ? 1 : 0.3, cursor: requiredConnected ? 'pointer' : 'not-allowed' }}
        >
          {isManage ? 'Done' : 'Build my board'}
        </DarkBtn>

        {!isManage && (
          <button
            onClick={onDetect}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              padding: '12px', fontSize: 13, color: 'rgba(10,10,10,0.32)',
              cursor: 'pointer', marginTop: 6, fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            Skip — use what's connected
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Building ──────────────────────────────────────────────
function BuildingStep({ error }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#F9F8F6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative',
    }}>
      <AmbientLight />
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 11, fontWeight: 400, letterSpacing: '5px', color: 'rgba(10,10,10,0.25)', textTransform: 'uppercase', marginBottom: 40 }}>
          breeze
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: 'rgba(10,10,10,0.8)', margin: '0 0 12px', letterSpacing: '-0.3px', fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}>
          Building your board…
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(10,10,10,0.38)', lineHeight: 1.6, margin: 0 }}>
          {error
            ? <span style={{ color: 'rgba(180,40,40,0.8)' }}>{error}</span>
            : 'Scanning your connected apps to find the right board for you.'
          }
        </p>
      </div>
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 500,
        letterSpacing: '0.6px', textTransform: 'uppercase',
        color: 'rgba(10,10,10,0.38)', marginBottom: 7,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(10,10,10,0.03)',
        border: '1px solid rgba(10,10,10,0.09)',
        borderRadius: 9, padding: '11px 14px',
        fontSize: 15, color: 'rgba(10,10,10,0.85)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        outline: 'none',
        transition: 'border-color 0.15s',
      }}
    />
  );
}

function PrimaryBtn({ children, disabled, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        width: '100%', padding: '13px',
        background: 'rgba(10,10,10,0.88)',
        border: 'none', borderRadius: 9,
        color: '#F9F8F6', fontSize: 15, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        letterSpacing: '-0.1px',
        marginTop: 8,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function DarkBtn({ children, disabled, style = {}, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        width: '100%', padding: '13px',
        background: 'rgba(10,10,10,0.85)',
        border: 'none', borderRadius: 9,
        color: '#F9F8F6', fontSize: 15, fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        letterSpacing: '-0.1px',
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function Onboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isManage = searchParams.get('manage') === 'true';

  const [step, setStep]       = useState(1);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('breeze_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (isManage) { setUser(u); setStep(2); return; }
        if (u.archetype) navigate('/board');
      } catch { localStorage.removeItem('breeze_user'); }
    }
  }, [navigate, isManage]);

  async function handleSignup(name, email) {
    if (!name.trim() || !email.trim()) return setError('Both fields required');
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('breeze_user', JSON.stringify(data));
      setUser(data); setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDetect() {
    if (loading) return;
    setStep(3);
    try {
      const u = user || JSON.parse(localStorage.getItem('breeze_user') || '{}');
      const res = await fetch('/api/detect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: u.entity_id, userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = { ...u, archetype: data.archetype };
      localStorage.setItem('breeze_user', JSON.stringify(updated));
      navigate('/board');
    } catch (err) { setError(err.message); setStep(2); }
  }

  if (step === 1) return <LandingStep onSubmit={handleSignup} loading={loading} error={error} />;
  if (step === 2) return <ConnectStep user={user} isManage={isManage} onDetect={handleDetect} loading={loading} error={error} />;
  return <BuildingStep error={error} />;
}
