import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
  page:     { width: '100vw', minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '40px 20px', boxSizing: 'border-box' },
  card:     { width: 460, background: '#fff', border: '1px solid #E8E2D9', borderRadius: 16, padding: '44px 40px', boxShadow: '0 2px 24px rgba(0,0,0,0.06)' },
  logo:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 },
  logoBall: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' },
  logoText: { color: '#8B6914', fontWeight: 700, fontSize: 14, letterSpacing: '2px' },
  h1:       { color: '#111', fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.3px' },
  sub:      { color: '#888', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 },
  label:    { color: '#555', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' },
  input:    { width: '100%', background: '#FAFAF9', border: '1px solid #E0DAD0', borderRadius: 8, padding: '11px 14px', color: '#111', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none', fontFamily: "'Inter', sans-serif" },
  btn:      { width: '100%', background: '#1A1208', border: 'none', borderRadius: 8, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8, fontFamily: "'Inter', sans-serif" },
  btnGhost: { width: '100%', background: 'transparent', border: '1px solid #E0DAD0', borderRadius: 8, padding: '12px', color: '#888', fontWeight: 500, fontSize: 14, cursor: 'pointer', marginTop: 8, fontFamily: "'Inter', sans-serif" },
  divider:  { borderTop: '1px solid #F0EBE3', margin: '20px 0' },
  appScroll:{ maxHeight: 280, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' },
  appRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F5F0EB' },
  appLabel: { color: '#222', fontSize: 14, fontWeight: 500 },
  appReq:   { color: '#bbb', fontSize: 11, marginTop: 2 },
  connBtn:  { background: '#FAFAF9', border: '1px solid #E0DAD0', borderRadius: 6, padding: '4px 12px', color: '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  connDone: { background: 'transparent', border: '1px solid #C6E8C8', borderRadius: 6, padding: '4px 12px', color: '#2D7F33', fontSize: 12, fontWeight: 600, cursor: 'default', flexShrink: 0 },
  error:    { color: '#C0392B', fontSize: 13, marginTop: 4, padding: '8px 12px', background: 'rgba(192,57,43,0.05)', borderRadius: 6 },
  foot:     { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#aaa' },
  link:     { color: '#8B6914', textDecoration: 'none', fontWeight: 600 },
};

export default function Onboard() {
  const navigate = useNavigate();
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
        if (u.archetype) navigate('/board');
      } catch { localStorage.removeItem('breeze_user'); }
    }
  }, [navigate]);

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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('breeze_user', JSON.stringify(data));
      setUser(data);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(appId) {
    // Open window synchronously (on the user gesture) to avoid popup blockers,
    // then navigate it once we have the redirect URL.
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`/api/connect?entityId=${user.entity_id}&app=${appId}`);
      const data = await res.json();
      if (data.redirectUrl) {
        win.location.href = data.redirectUrl;
      } else {
        win.close();
        setError(data.error || 'Could not get connection URL');
      }
    } catch (err) {
      win.close();
      setError('Could not start connection: ' + err.message);
    }
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
    } catch (err) {
      setError(err.message);
      setStep(2);
    }
  }

  const requiredConnected = APPS.filter(a => a.required).every(a => connected[a.id]);
  const connectedCount = Object.keys(connected).length;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoBall}>B</div>
          <span style={S.logoText}>BREEZE</span>
        </div>

        {/* Step 1 — Signup */}
        {step === 1 && (
          <>
            <h1 style={S.h1}>Set up your board</h1>
            <p style={S.sub}>Connect your apps and Breeze builds a personalized view of your life — no prompting required.</p>
            <form onSubmit={handleSignup}>
              <label style={S.label}>Your name</label>
              <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="First name" autoFocus />
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" />
              {error && <div style={S.error}>{error}</div>}
              <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Setting up…' : 'Continue →'}</button>
            </form>
            <div style={S.foot}>
              Already set up? <Link to="/login" style={S.link}>Log in</Link>
            </div>
          </>
        )}

        {/* Step 2 — Connect apps */}
        {step === 2 && (
          <>
            <h1 style={S.h1}>Connect your apps</h1>
            <p style={S.sub}>Breeze reads your data to figure out who you are and what you need. Nothing is stored — it just informs your board.</p>

            {connectedCount > 0 && (
              <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginBottom: 12 }}>
                {connectedCount} app{connectedCount !== 1 ? 's' : ''} connected
              </div>
            )}

            <div style={S.divider} />

            {/* Scrollable app list */}
            <div style={S.appScroll}>
              {APPS.map(app => (
                <div key={app.id} style={S.appRow}>
                  <div>
                    <div style={S.appLabel}>{app.label}</div>
                    <div style={S.appReq}>{app.required ? 'Required' : 'Optional'}</div>
                  </div>
                  {connected[app.id]
                    ? <div style={S.connDone}>✓ Connected</div>
                    : <button style={S.connBtn} onClick={() => handleConnect(app.id)}>Connect</button>
                  }
                </div>
              ))}
            </div>

            <div style={S.divider} />
            {error && <div style={{ ...S.error, marginBottom: 12 }}>{error}</div>}
            <button
              style={{ ...S.btn, opacity: requiredConnected ? 1 : 0.5 }}
              onClick={handleDetect}
              disabled={!requiredConnected}
            >
              Build my board →
            </button>
            <button style={S.btnGhost} onClick={handleDetect}>
              Skip — use what's connected
            </button>
          </>
        )}

        {/* Step 3 — Detecting */}
        {step === 3 && (
          <>
            <h1 style={S.h1}>Building your board…</h1>
            <p style={S.sub}>Breeze is scanning your apps to figure out the right board for you. Takes about 10 seconds.</p>
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, color: '#8B6914', fontSize: 14 }}>
              {error
                ? <span style={{ color: '#C0392B' }}>{error}</span>
                : <><span style={{ fontSize: 18 }}>◌</span> Analyzing your connected apps…</>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
