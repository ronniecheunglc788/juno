import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const S = {
  page:     { width: '100vw', height: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" },
  card:     { width: 420, background: '#fff', border: '1px solid #E8E2D9', borderRadius: 16, padding: '44px 40px', boxShadow: '0 2px 24px rgba(0,0,0,0.06)' },
  logo:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 },
  ball:     { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' },
  txt:      { color: '#8B6914', fontWeight: 700, fontSize: 14, letterSpacing: '2px' },
  h1:       { color: '#111', fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.3px' },
  sub:      { color: '#888', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 },
  label:    { color: '#555', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' },
  input:    { width: '100%', background: '#FAFAF9', border: '1px solid #E0DAD0', borderRadius: 8, padding: '11px 14px', color: '#111', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none', fontFamily: "'Inter', sans-serif" },
  btn:      { width: '100%', background: '#1A1208', border: 'none', borderRadius: 8, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8, fontFamily: "'Inter', sans-serif" },
  err:      { color: '#C0392B', fontSize: 13, marginTop: 4, padding: '8px 12px', background: 'rgba(192,57,43,0.05)', borderRadius: 6 },
  foot:     { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#aaa' },
  link:     { color: '#8B6914', textDecoration: 'none', fontWeight: 600 },
  divider:  { borderTop: '1px solid #F0EBE3', margin: '24px 0' },
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
