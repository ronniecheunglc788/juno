import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const S = {
  page:  { width: '100vw', minHeight: '100vh', background: '#09090F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Inter',system-ui,sans-serif", padding: '40px 20px', boxSizing: 'border-box' },
  card:  { width: 420, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' },
  word:  { fontSize: 12, fontWeight: 400, letterSpacing: '6px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 36, userSelect: 'none' },
  h1:    { color: 'rgba(255,255,255,0.88)', fontSize: 22, fontWeight: 500, margin: '0 0 8px', letterSpacing: '-0.3px' },
  sub:   { color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.65 },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', marginBottom: 7, display: 'block', textTransform: 'uppercase' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 14, boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans','Inter',system-ui,sans-serif" },
  btn:   { width: '100%', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '13px', color: '#09090F', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 8, fontFamily: "'DM Sans','Inter',system-ui,sans-serif", transition: 'opacity 0.15s' },
  err:   { color: 'rgba(240,80,80,0.9)', fontSize: 13, marginTop: 8, padding: '9px 12px', background: 'rgba(240,80,80,0.07)', borderRadius: 6, border: '1px solid rgba(240,80,80,0.12)' },
  foot:  { marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.2)' },
  link:  { color: 'rgba(255,255,255,0.45)', textDecoration: 'none' },
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim()) return setError('Email required');
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json();
      if (!res.ok) throw new Error('No account found — try signing up instead');
      localStorage.setItem('breeze_user', JSON.stringify(data));
      navigate('/board');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.word}>breeze</div>
        <h1 style={S.h1}>Welcome back</h1>
        <p style={S.sub}>Enter your email to get back to your board.</p>
        <form onSubmit={handleLogin}>
          <label style={S.label}>Email</label>
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@school.edu"
            autoFocus
          />
          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Finding your board…' : 'Continue'}
          </button>
        </form>
        <div style={S.foot}>
          New here? <a href="/join" style={S.link}>Set up your board</a>
        </div>
      </div>
    </div>
  );
}
