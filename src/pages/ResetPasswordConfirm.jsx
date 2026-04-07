import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function AmbientLight() {
  const ref = useRef(null);
  const pos = useRef({ x: 0.5, y: 0.4 });
  const cur = useRef({ x: 0.5, y: 0.4 });
  const raf = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e) {
      pos.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    }
    function animate() {
      cur.current.x += (pos.current.x - cur.current.x) * 0.05;
      cur.current.y += (pos.current.y - cur.current.y) * 0.05;
      const x  = (cur.current.x * 100).toFixed(1);
      const y  = (cur.current.y * 100).toFixed(1);
      const xi = (100 - cur.current.x * 100).toFixed(1);
      const yi = (100 - cur.current.y * 100).toFixed(1);
      el.style.background = `
        radial-gradient(ellipse 70% 55% at ${x}% ${y}%, rgba(220,60,60,0.26) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at ${xi}% ${yi}%, rgba(255,100,60,0.13) 0%, transparent 55%)
      `;
      raf.current = requestAnimationFrame(animate);
    }
    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, []);
  return <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
}

export default function ResetPasswordConfirm() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') || '';
  const email      = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  if (!token || !email) {
    return (
      <div style={pageStyle}>
        <AmbientLight />
        <div style={{ position: 'relative', zIndex: 2, ...cardStyle }}>
          <div style={wordmarkStyle}>breeze</div>
          <p style={{ fontSize: 14, color: 'rgba(180,40,40,0.8)' }}>Invalid or expired reset link.</p>
          <a href="/reset" style={linkStyle}>Request a new one</a>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/reset-password-confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={pageStyle}>
      <AmbientLight />
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 400 }}>
        <div style={{
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(10,10,10,0.07)',
          borderRadius: 18, padding: '40px 36px', boxShadow: '0 4px 40px rgba(10,10,10,0.07)',
        }}>
          <div style={wordmarkStyle}>breeze</div>

          {done ? (
            <>
              <h2 style={headingStyle}>Password updated.</h2>
              <p style={subStyle}>You'll be redirected to sign in shortly.</p>
            </>
          ) : (
            <>
              <h2 style={headingStyle}>Set a new password.</h2>
              <p style={subStyle}>Choose something strong — at least 8 characters.</p>
              <form onSubmit={handleSubmit}>
                <label style={labelStyle}>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoFocus
                  style={inputStyle}
                />
                <label style={labelStyle}>Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  style={inputStyle}
                />

                {error && <div style={errStyle}>{error}</div>}

                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh', background: '#F9F8F6', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: "'DM Sans', system-ui, sans-serif", padding: '40px 24px', position: 'relative',
};
const cardStyle = { width: '100%', maxWidth: 400, textAlign: 'center', padding: 40 };
const wordmarkStyle = {
  fontSize: 11, fontWeight: 400, letterSpacing: '5px',
  color: 'rgba(10,10,10,0.25)', textTransform: 'uppercase', marginBottom: 32, userSelect: 'none',
};
const headingStyle = {
  fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
  fontSize: 22, fontWeight: 400, color: 'rgba(10,10,10,0.85)', margin: '0 0 6px', letterSpacing: '-0.2px',
};
const subStyle = { fontSize: 13, color: 'rgba(10,10,10,0.38)', margin: '0 0 28px', lineHeight: 1.6 };
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.6px',
  textTransform: 'uppercase', color: 'rgba(10,10,10,0.38)', marginBottom: 7,
};
const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(10,10,10,0.03)',
  border: '1px solid rgba(10,10,10,0.09)', borderRadius: 9, padding: '11px 14px',
  fontSize: 15, color: 'rgba(10,10,10,0.85)', fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: 'none', marginBottom: 14,
};
const errStyle = {
  fontSize: 12, color: 'rgba(180,40,40,0.85)', background: 'rgba(180,40,40,0.05)',
  border: '1px solid rgba(180,40,40,0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 14,
};
const btnStyle = (loading) => ({
  width: '100%', padding: '13px', background: 'rgba(10,10,10,0.88)', border: 'none',
  borderRadius: 9, color: '#F9F8F6', fontSize: 15, fontWeight: 500,
  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
  fontFamily: "'DM Sans', system-ui, sans-serif",
});
const linkStyle = { display: 'block', marginTop: 20, fontSize: 13, color: 'rgba(10,10,10,0.45)', textDecoration: 'none' };
