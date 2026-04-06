import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const APPS = [
  { id: 'gmail',          label: 'Gmail',             required: true,  icon: '✉' },
  { id: 'googlecalendar', label: 'Google Calendar',   required: true,  icon: '📅' },
  { id: 'notion',         label: 'Notion',             required: false, icon: '📝' },
  { id: 'slack',          label: 'Slack',              required: false, icon: '💬' },
  { id: 'linkedin',       label: 'LinkedIn',           required: false, icon: '🔗' },
  { id: 'github',         label: 'GitHub',             required: false, icon: '⚡' },
  { id: 'discord',        label: 'Discord',            required: false, icon: '🎮' },
  { id: 'twitterv2',      label: 'Twitter / X',        required: false, icon: '𝕏' },
  { id: 'instagram',      label: 'Instagram',          required: false, icon: '📸' },
  { id: 'youtube',        label: 'YouTube',            required: false, icon: '▶' },
  { id: 'googledrive',    label: 'Google Drive',       required: false, icon: '📁' },
  { id: 'googlesheets',   label: 'Google Sheets',      required: false, icon: '📊' },
  { id: 'todoist',        label: 'Todoist',            required: false, icon: '✅' },
  { id: 'asana',          label: 'Asana',              required: false, icon: '🗂' },
  { id: 'whatsapp',       label: 'WhatsApp',           required: false, icon: '📱' },
  { id: 'spotify',        label: 'Spotify',            required: false, icon: '🎵' },
  { id: 'strava',         label: 'Strava',             required: false, icon: '🏃' },
];

const S = {
  page:     { width: '100vw', minHeight: '100vh', background: '#FAF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '40px 20px', boxSizing: 'border-box' },
  card:     { width: 500, background: '#fff', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 20, padding: '48px 44px', boxShadow: '0 4px 40px rgba(184,134,11,0.08)' },
  logo:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 },
  logoBall: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', boxShadow: '0 2px 12px rgba(184,134,11,0.3)' },
  logoText: { color: '#8B6914', fontWeight: 800, fontSize: 16, letterSpacing: '2px' },
  h1:       { color: '#1A1208', fontSize: 24, fontWeight: 700, margin: '0 0 8px' },
  sub:      { color: '#7A6A4A', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 },
  label:    { color: '#8B7A5A', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  input:    { width: '100%', background: '#FAF8F3', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 10, padding: '12px 16px', color: '#1A1208', fontSize: 15, marginBottom: 16, boxSizing: 'border-box', outline: 'none' },
  btn:      { width: '100%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', border: 'none', borderRadius: 10, padding: '14px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, letterSpacing: '0.3px' },
  btnGhost: { width: '100%', background: 'transparent', border: '1px solid rgba(184,134,11,0.25)', borderRadius: 10, padding: '13px', color: '#8B6914', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8 },
  divider:  { borderTop: '1px solid rgba(184,134,11,0.1)', margin: '20px 0' },
  appScroll:{ maxHeight: 300, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' },
  appRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(184,134,11,0.07)' },
  appLabel: { color: '#2A1E08', fontSize: 14, fontWeight: 500 },
  appReq:   { color: '#B8A07A', fontSize: 11, marginTop: 2 },
  connBtn:  { background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.25)', borderRadius: 8, padding: '5px 14px', color: '#8B6914', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  connDone: { background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 8, padding: '5px 14px', color: '#16A34A', fontSize: 13, fontWeight: 600, cursor: 'default', flexShrink: 0 },
  error:    { color: '#C0392B', fontSize: 13, marginTop: 4, padding: '8px 12px', background: 'rgba(192,57,43,0.06)', borderRadius: 8 },
  foot:     { marginTop: 22, textAlign: 'center', fontSize: 13, color: '#B8A07A' },
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
      const u = JSON.parse(saved);
      if (u.archetype) navigate('/board');
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
    try {
      const res = await fetch(`/api/connect?entityId=${user.entity_id}&app=${appId}`);
      const data = await res.json();
      if (data.redirectUrl) window.open(data.redirectUrl, '_blank');
    } catch (err) {
      setError('Could not start connection: ' + err.message);
    }
  }

  async function handleDetect() {
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
                    <div style={S.appLabel}>{app.icon}  {app.label}</div>
                    <div style={S.appReq}>{app.required ? 'required' : 'optional'}</div>
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
