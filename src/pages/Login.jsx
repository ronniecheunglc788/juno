import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const S = {
  page:     { width: '100vw', height: '100vh', background: '#FAF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' },
  card:     { width: 440, background: '#fff', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 20, padding: '48px 44px', boxShadow: '0 4px 40px rgba(184,134,11,0.08)' },
  logo:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 },
  ball:     { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', boxShadow: '0 2px 12px rgba(184,134,11,0.3)' },
  txt:      { color: '#8B6914', fontWeight: 800, fontSize: 16, letterSpacing: '2px' },
  h1:       { color: '#1A1208', fontSize: 24, fontWeight: 700, margin: '0 0 8px' },
  sub:      { color: '#7A6A4A', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 },
  label:    { color: '#8B7A5A', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  input:    { width: '100%', background: '#FAF8F3', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 10, padding: '12px 16px', color: '#1A1208', fontSize: 15, marginBottom: 16, boxSizing: 'border-box', outline: 'none' },
  btn:      { width: '100%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', border: 'none', borderRadius: 10, padding: '14px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, letterSpacing: '0.3px' },
  err:      { color: '#C0392B', fontSize: 13, marginTop: 4, padding: '8px 12px', background: 'rgba(192,57,43,0.06)', borderRadius: 8 },
  foot:     { marginTop: 22, textAlign: 'center', fontSize: 13, color: '#B8A07A' },
  link:     { color: '#8B6914', textDecoration: 'none', fontWeight: 600 },
  divider:  { borderTop: '1px solid rgba(184,134,11,0.1)', margin: '28px 0' },
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim()) return setError('Email required');
    setLoading(true);
    setError('');
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
        <div style={S.logo}>
          <div style={S.ball}>B</div>
          <span style={S.txt}>BREEZE</span>
        </div>
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
            {loading ? 'Finding your board…' : 'Take me to my board →'}
          </button>
        </form>
        <div style={S.divider} />
        <div style={S.foot}>
          New here? <Link to="/join" style={S.link}>Set up your board</Link>
        </div>
      </div>
    </div>
  );
}
