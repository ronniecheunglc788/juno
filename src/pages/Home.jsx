import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/* ── Ambient cursor glow ─────────────────────────────────────────── */
function AmbientLight() {
  const ref = useRef(null);
  const pos = useRef({ x: 0.5, y: 0.38 });
  const cur = useRef({ x: 0.5, y: 0.38 });
  const raf = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = e => {
      pos.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    const animate = () => {
      cur.current.x += (pos.current.x - cur.current.x) * 0.04;
      cur.current.y += (pos.current.y - cur.current.y) * 0.04;
      const x  = (cur.current.x * 100).toFixed(1);
      const y  = (cur.current.y * 100).toFixed(1);
      const xi = (100 - cur.current.x * 100).toFixed(1);
      const yi = (100 - cur.current.y * 100).toFixed(1);
      el.style.background = `
        radial-gradient(ellipse 65% 50% at ${x}% ${y}%, rgba(83,117,167,0.22) 0%, transparent 60%),
        radial-gradient(ellipse 55% 45% at ${xi}% ${yi}%, rgba(201,168,76,0.10) 0%, transparent 55%)
      `;
      raf.current = requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, []);

  return <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ── Time-based greeting ─────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Still up,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  if (h < 21) return 'Good evening,';
  return 'Good night,';
}

/* ── Nav card ────────────────────────────────────────────────────── */
function Card({ icon, label, sub, onClick, accent = '#5375A7', delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:    hov ? `rgba(255,255,255,0.07)` : 'rgba(255,255,255,0.035)',
        border:        `1px solid ${hov ? `${accent}50` : 'rgba(255,255,255,0.08)'}`,
        borderRadius:  18,
        padding:       '22px 24px',
        cursor:        'pointer',
        textAlign:     'left',
        transition:    'all 0.2s',
        boxShadow:     hov ? `0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px ${accent}22` : '0 2px 12px rgba(0,0,0,0.18)',
        transform:     hov ? 'translateY(-2px)' : 'none',
        animation:     `fadeslide 0.5s ease both`,
        animationDelay: `${delay}ms`,
        fontFamily:    "'DM Sans','Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4, letterSpacing: '0.1px' }}>{label}</div>
      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, lineHeight: 1.5 }}>{sub}</div>
    </button>
  );
}

/* ── Waving mascot ───────────────────────────────────────────────── */
function Mascot() {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Soft glow behind mascot */}
      <div style={{
        position:     'absolute',
        inset:        '-20%',
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(83,117,167,0.28) 0%, transparent 70%)',
        pointerEvents:'none',
        animation:    'pulse 3s ease-in-out infinite',
      }}/>
      <img
        src="/juno_mascot.png"
        alt="Juno"
        style={{
          width:           120,
          height:          120,
          borderRadius:    '50%',
          objectFit:       'cover',
          position:        'relative',
          zIndex:          1,
          animation:       'wave 2.4s ease-in-out 0.3s both',
          transformOrigin: 'bottom center',
          boxShadow:       '0 8px 40px rgba(83,117,167,0.35)',
          border:          '2px solid rgba(83,117,167,0.3)',
        }}
      />
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const mockKey = searchParams.get('user');

  // Resolve user name
  const saved = localStorage.getItem('juno_user');
  let firstName = 'Ronnie';
  if (saved) {
    try {
      const u = JSON.parse(saved);
      firstName = u.name?.split(' ')[0] || 'Ronnie';
    } catch {}
  }

  const boardPath = mockKey ? `/board?user=${mockKey}` : '/board';
  const vaultPath = mockKey ? `/vault?user=${mockKey}` : '/vault';

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#08080F',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      position:       'relative',
      overflow:       'hidden',
      fontFamily:     "'DM Sans','Inter',system-ui,sans-serif",
      padding:        '40px 24px',
    }}>

      <style>{`
        @keyframes wave {
          0%   { transform: rotate(0deg);   }
          10%  { transform: rotate(-10deg); }
          20%  { transform: rotate(12deg);  }
          30%  { transform: rotate(-8deg);  }
          40%  { transform: rotate(10deg);  }
          50%  { transform: rotate(-5deg);  }
          60%  { transform: rotate(8deg);   }
          70%  { transform: rotate(0deg);   }
          100% { transform: rotate(0deg);   }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes fadeslide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <AmbientLight />

      {/* Subtle star dots */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{
            position:   'absolute',
            width:       Math.random() > 0.8 ? 2 : 1,
            height:      Math.random() > 0.8 ? 2 : 1,
            borderRadius:'50%',
            background:  'rgba(255,255,255,0.35)',
            top:         `${Math.random() * 100}%`,
            left:        `${Math.random() * 100}%`,
            opacity:     0.2 + Math.random() * 0.5,
          }}/>
        ))}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Mascot */}
        <div style={{ marginBottom: 28, animation: 'fadeup 0.6s ease both' }}>
          <Mascot />
        </div>

        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeup 0.6s ease 0.1s both' }}>
          <div style={{
            fontSize:      13,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.25)',
            marginBottom:  10,
            fontWeight:    400,
          }}>
            {greeting()}
          </div>
          <div style={{
            fontSize:      42,
            fontWeight:    400,
            color:         '#fff',
            lineHeight:    1.1,
            letterSpacing: '-0.5px',
            marginBottom:  12,
            fontFamily:    "'PPMondwest', serif",
          }}>
            {firstName}
          </div>
          <div style={{
            fontSize:   15,
            color:      'rgba(255,255,255,0.38)',
            lineHeight: 1.6,
            maxWidth:   340,
            margin:     '0 auto',
          }}>
            Your intelligence layer is ready.
          </div>
        </div>

        {/* Nav cards */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 12,
          width:               '100%',
          marginBottom:        16,
        }}>
          <Card
            icon="🌐"
            label="Your Board"
            sub="Signals, insights & context"
            onClick={() => navigate(boardPath)}
            accent="#5375A7"
            delay={200}
          />
          <Card
            icon="🗄️"
            label="Vault"
            sub="Personal database & knowledge graph"
            onClick={() => navigate(vaultPath)}
            accent="#C9A84C"
            delay={280}
          />
          <Card
            icon="🎨"
            label="Canvas"
            sub="Visual scenes & environments"
            onClick={() => navigate('/canvas')}
            accent="#7A6E9E"
            delay={360}
          />
          <Card
            icon="🔗"
            label="Connect Apps"
            sub="Manage your integrations"
            onClick={() => navigate('/join?manage=true')}
            accent="#5A967A"
            delay={440}
          />
        </div>

        {/* Footer wordmark */}
        <div style={{
          marginTop:     8,
          display:       'flex',
          alignItems:    'center',
          gap:           8,
          animation:     'fadeup 0.6s ease 0.5s both',
          opacity:       0,
          animationFillMode: 'both',
        }}>
          <img src="/juno_logo.png" alt="Juno" style={{ height: 18, opacity: 0.3 }} />
          <span style={{ fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
            juno
          </span>
        </div>

      </div>
    </div>
  );
}
