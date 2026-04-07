import { useState, useEffect } from 'react';
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

const S = {
  page:     { width: '100vw', minHeight: '100vh', background: '#09090F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,-apple-system,sans-serif', padding: '40px 20px', boxSizing: 'border-box' },
  card:     { width: 420, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' },
  wordmark: { fontSize: 12, fontWeight: 400, letterSpacing: '6px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 36, userSelect: 'none' },
  h1:       { color: 'rgba(255,255,255,0.88)', fontSize: 20, fontWeight: 500, margin: '0 0 8px', letterSpacing: '-0.3px' },
  sub:      { color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 28px', lineHeight: 1.65 },
  label:    { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', marginBottom: 7, display: 'block', textTransform: 'uppercase' },
  input:    { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '11px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'system-ui,-apple-system,sans-serif' },
  btn:      { width: '100%', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '12px', color: '#09090F', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8, fontFamily: 'system-ui,-apple-system,sans-serif', transition: 'opacity 0.15s' },
  btnGhost: { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 400, fontSize: 13, cursor: 'pointer', marginTop: 8, fontFamily: 'system-ui,-apple-system,sans-serif' },
  divider:  { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' },
  appScroll:{ maxHeight: 300, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' },
  appRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  appLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 400 },
  appReq:   { color: 'rgba(255,255,255,0.22)', fontSize: 11, marginTop: 2 },
  connBtn:  { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 12px', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 },
  connDone: { background: 'transparent', border: '1px solid rgba(80,200,100,0.3)', borderRadius: 6, padding: '4px 12px', color: 'rgba(80,200,100,0.8)', fontSize: 12, fontWeight: 500, cursor: 'default', flexShrink: 0 },
  error:    { color: 'rgba(240,80,80,0.9)', fontSize: 12, marginTop: 8, padding: '8px 12px', background: 'rgba(240,80,80,0.07)', borderRadius: 6, border: '1px solid rgba(240,80,80,0.12)' },
  foot:     { marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' },
  link:     { color: 'rgba(255,255,255,0.45)', textDecoration: 'none' },
  hint:     { fontSize: 12, color: 'rgba(255,200,80,0.7)', background: 'rgba(255,200,80,0.06)', border: '1px solid rgba(255,200,80,0.12)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, lineHeight: 1.5 },
};

export default function Onboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isManage = searchParams.get('manage') === 'true';

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('breeze_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        // If managing connections, go straight to step 2
        if (isManage) { setUser(u); setStep(2); return; }
        if (u.archetype) navigate('/board');
      } catch { localStorage.removeItem('breeze_user'); }
    }
  }, [navigate, isManage]);

  useEffect(() => {
    if (step !== 2 || !user) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/status?entityId=${user.entity_id}`);
        const data = await res.json();
        if (data.connected) {
          const map = {};
          data.connected.forEach(c => { if (c.status === 'ACTIVE') map[c.app] = true; });
          setConnected(map);
        }
      } catch (_) {}
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [step, user]);

  async function handleSignup(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return setError('Both fields required');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('breeze_user', JSON.stringify(data));
      setUser(data); setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleConnect(appId) {
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`/api/connect?entityId=${user.entity_id}&app=${appId}`);
      const data = await res.json();
      if (data.redirectUrl) { win.location.href = data.redirectUrl; }
      else { win.close(); setError(data.error || 'Could not get connection URL'); }
    } catch (err) { win.close(); setError('Could not start connection: ' + err.message); }
  }

  async function handleDetect() {
    if (loading) return;
    setStep(3);
    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: user.entity_id, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = { ...user, archetype: data.archetype };
      localStorage.setItem('breeze_user', JSON.stringify(updated));
      navigate('/board');
    } catch (err) { setError(err.message); setStep(2); }
  }

  const requiredApps = APPS.filter(a => a.required);
  const missingRequired = requiredApps.filter(a => !connected[a.id]);
  const requiredConnected = missingRequired.length === 0;
  const connectedCount = Object.keys(connected).length;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.wordmark}>breeze</div>

        {/* Step 1 — Signup */}
        {step === 1 && (
          <>
            <h1 style={S.h1}>Set up your board</h1>
            <p style={S.sub}>Connect your apps and Breeze builds a personalized view of your life — no prompting required.</p>
            <form onSubmit={handleSignup}>
              <label style={S.label}>Name</label>
              <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="First name" autoFocus />
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" />
              {error && <div style={S.error}>{error}</div>}
              <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Setting up…' : 'Continue'}</button>
            </form>
            <div style={S.foot}>
              Already set up? <a href="/login" style={S.link}>Log in</a>
            </div>
          </>
        )}

        {/* Step 2 — Connect apps */}
        {step === 2 && (
          <>
            <h1 style={S.h1}>{isManage ? 'Manage connections' : 'Connect your apps'}</h1>
            <p style={S.sub}>Breeze reads your data to understand what you need. Connect more apps for a richer board.</p>

            {connectedCount > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(80,200,100,0.7)', marginBottom: 14 }}>
                {connectedCount} app{connectedCount !== 1 ? 's' : ''} connected
              </div>
            )}

            <div style={S.appScroll}>
              {APPS.map(app => (
                <div key={app.id} style={S.appRow}>
                  <div>
                    <div style={S.appLabel}>
                      {app.label}
                      {app.required && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(255,200,80,0.6)', fontWeight: 500 }}>required</span>
                      )}
                    </div>
                  </div>
                  {connected[app.id]
                    ? <div style={S.connDone}>✓ Connected</div>
                    : <button style={S.connBtn} onClick={() => handleConnect(app.id)}>Connect</button>
                  }
                </div>
              ))}
            </div>

            <div style={S.divider} />

            {!requiredConnected && (
              <div style={S.hint}>
                Connect <strong style={{ color: 'rgba(255,200,80,0.9)' }}>{missingRequired.map(a => a.label).join(' + ')}</strong> to build your board — they're used to detect your archetype.
              </div>
            )}

            {error && <div style={{ ...S.error, marginBottom: 12 }}>{error}</div>}

            <button
              style={{ ...S.btn, opacity: requiredConnected ? 1 : 0.35, cursor: requiredConnected ? 'pointer' : 'not-allowed' }}
              onClick={requiredConnected ? handleDetect : undefined}
            >
              {isManage ? 'Done' : 'Build my board'}
            </button>
            {!isManage && (
              <button style={S.btnGhost} onClick={handleDetect}>
                Skip — use what's connected
              </button>
            )}
          </>
        )}

        {/* Step 3 — Detecting */}
        {step === 3 && (
          <>
            <h1 style={S.h1}>Building your board…</h1>
            <p style={S.sub}>Scanning your connected apps to find the right board for you.</p>
            <div style={{ marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              {error
                ? <span style={{ color: 'rgba(240,80,80,0.9)' }}>{error}</span>
                : 'Analyzing your apps…'
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
