import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const B = {
  canvas:  '#F3F1E8',
  primary: '#5375A7',
  brand:   '#4A6993',
  nav:     '#8C9DAE',
  text:    '#1A1A2E',
  muted:   '#777',
  border:  'rgba(0,0,0,0.07)',
};

/* ── Ambient cursor glow ─────────────────────────────────────────── */
function AmbientLight() {
  const ref = useRef(null);
  const pos = useRef({ x: 0.5, y: 0.4 });
  const cur = useRef({ x: 0.5, y: 0.4 });
  const raf = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = e => { pos.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }; };
    const tick = () => {
      cur.current.x += (pos.current.x - cur.current.x) * 0.04;
      cur.current.y += (pos.current.y - cur.current.y) * 0.04;
      const x = (cur.current.x * 100).toFixed(1), y = (cur.current.y * 100).toFixed(1);
      const xi = (100 - cur.current.x * 100).toFixed(1), yi = (100 - cur.current.y * 100).toFixed(1);
      el.style.background = `
        radial-gradient(ellipse 70% 55% at ${x}% ${y}%, rgba(83,117,167,0.13) 0%, transparent 60%),
        radial-gradient(ellipse 55% 45% at ${xi}% ${yi}%, rgba(74,105,147,0.08) 0%, transparent 55%)`;
      raf.current = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, []);
  return <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ── SVG card icons ──────────────────────────────────────────────── */
const Icons = {
  juno: c => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2 6-4 7.5V18a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.5C7 15 5 12.5 5 9a7 7 0 0 1 7-7z"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
      <line x1="12" y1="18" x2="12" y2="21"/>
    </svg>
  ),
  database: c => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  graph: c => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="2.5"/>
      <circle cx="19" cy="5" r="2.5"/>
      <circle cx="19" cy="19" r="2.5"/>
      <circle cx="12" cy="12" r="2.5"/>
      <line x1="7.2" y1="11.3" x2="9.8" y2="12"/>
      <line x1="14" y1="10.5" x2="17" y2="7"/>
      <line x1="14" y1="13.5" x2="17" y2="17"/>
    </svg>
  ),
  apps: c => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
};

/* ── Card ────────────────────────────────────────────────────────── */
function Card({ iconKey, label, sub, onClick, accent, visible, staggerDelay = 0 }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        '--delay':            `${staggerDelay}ms`,
        background:           hov ? '#fff' : 'rgba(255,255,255,0.7)',
        border:               `1.5px solid ${hov ? `${accent}55` : B.border}`,
        borderRadius:         16,
        padding:              '20px 22px',
        cursor:               'pointer',
        textAlign:            'left',
        width:                '100%',
        fontFamily:           "'DM Sans','Inter',system-ui,sans-serif",
        backdropFilter:       'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow:            hov ? `0 10px 32px rgba(83,117,167,0.18)` : '0 2px 8px rgba(0,0,0,0.06)',
        transform:            hov ? 'translateY(-3px) scale(1.01)' : 'none',
        transition:           'box-shadow 0.2s, background 0.18s, border-color 0.18s, transform 0.2s',
        /* entrance */
        opacity:              visible ? undefined : 0,
        animation:            visible ? `card-pop 0.7s cubic-bezier(0.22,1,0.36,1) var(--delay) both` : 'none',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        {Icons[iconKey]?.(hov ? accent : B.nav)}
      </div>
      <div style={{ color: hov ? accent : B.text, fontSize: 14, fontWeight: 600, marginBottom: 3, transition: 'color 0.18s' }}>{label}</div>
      <div style={{ color: B.muted, fontSize: 11, lineHeight: 1.55 }}>{sub}</div>
    </button>
  );
}

/* ── Scroll hint ─────────────────────────────────────────────────── */
function ScrollHint() {
  return (
    <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, animation: 'hc-bob 2s ease-in-out infinite', opacity: 0.3, pointerEvents: 'none' }}>
      <span style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: B.nav, fontFamily: "'DM Sans',system-ui,sans-serif" }}>scroll</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.nav} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function HomeContent({ onNavigate }) {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const mockKey        = searchParams.get('user');
  const cardsRef       = useRef(null);
  const mascotRef      = useRef(null);
  const [cardsVisible, setCardsVisible] = useState(false);

  function triggerJump() {
    const el = mascotRef.current;
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'hc-jump 0.9s ease-in-out 0s 3';
  }

  const saved = localStorage.getItem('juno_user');
  let firstName = 'Ronnie';
  if (saved) { try { firstName = JSON.parse(saved).name?.split(' ')[0] || 'Ronnie'; } catch {} }

  const boardPath = mockKey ? `/board?user=${mockKey}` : '/board';

  // Trigger card animation when scrolled into view
  useEffect(() => {
    const el = cardsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCardsVisible(true); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cards = [
    { iconKey: 'juno',     label: 'Talk to Juno',      sub: 'Your signals, insights & context',  onClick: () => navigate(boardPath),        accent: B.primary  },
    { iconKey: 'graph',    label: 'Knowledge Graph',    sub: 'Your orbit map & signals',          onClick: () => onNavigate?.('moss'),       accent: '#7A6E9E'  },
    { iconKey: 'database', label: 'Personal Database',  sub: 'Files, emails, health & notes',     onClick: () => onNavigate?.('database'),   accent: '#A07850'  },
    { iconKey: 'apps',     label: 'Connect Apps',       sub: 'Manage your integrations',          onClick: () => navigate('/apps'),          accent: '#5A967A'  },
  ];

  return (
    <div style={{ background: B.canvas, fontFamily: "'DM Sans','Inter',system-ui,sans-serif", position: 'relative' }}>

      <style>{`
        @keyframes hc-jump {
          0%   { transform: translateY(0)     scaleX(1)    scaleY(1);   }
          30%  { transform: translateY(-80px) scaleX(1)    scaleY(1);   }
          60%  { transform: translateY(-80px) scaleX(1)    scaleY(1);   }
          82%  { transform: translateY(0)     scaleX(1.28) scaleY(0.72);}
          92%  { transform: translateY(0)     scaleX(1)    scaleY(1);   }
          100% { transform: translateY(0)     scaleX(1)    scaleY(1);   }
        }
        @keyframes hc-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes hc-blink {
          0%, 94%, 100% { transform: scaleY(0); }
          96%            { transform: scaleY(1); }
          98%            { transform: scaleY(0); }
        }
        @keyframes hc-bob {
          0%, 100% { transform: translateX(-50%) translateY(0);   }
          50%       { transform: translateX(-50%) translateY(7px); }
        }
        @keyframes card-pop {
          0%   { opacity: 0; transform: translateY(52px) scale(0.86); filter: blur(6px);  }
          55%  { opacity: 1; transform: translateY(-9px) scale(1.03); filter: blur(0px);  }
          72%  {             transform: translateY(4px)  scale(0.985);                    }
          84%  {             transform: translateY(-3px) scale(1.008);                    }
          100% {             transform: translateY(0)    scale(1);                        }
        }
      `}</style>

      <AmbientLight />

      {/* ── SECTION 1: Mascot + greeting, full screen ────────────── */}
      <div style={{
        height:         '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        position:       'relative',
        overflow:       'hidden',
        gap:            28,
        padding:        '0 32px 80px',
        textAlign:      'center',
      }}>
        {/* Paper texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`, opacity: 0.5 }}/>

        {/* Mascot */}
        <div
          ref={mascotRef}
          style={{ position: 'relative', zIndex: 1, animation: 'hc-up 0.55s ease both, hc-jump 0.9s ease-in-out 0.4s 3', transformOrigin: 'bottom center' }}
        >
          <img
            src="/juno_mascot.png"
            alt="Juno"
            style={{ width: 260, height: 260, display: 'block' }}
          />
          {/* Left eye blink cover */}
          <div style={{
            position:        'absolute',
            left:            '32%',
            top:             '43%',
            width:           '22%',
            height:          '22%',
            background:      '#415A8C',
            borderRadius:    '50%',
            transformOrigin: 'center top',
            transform:       'scaleY(0)',
            animation:       'hc-blink 3s ease-in-out 1.5s infinite',
            pointerEvents:   'none',
          }}/>
          {/* Right eye blink cover */}
          <div style={{
            position:        'absolute',
            left:            '56%',
            top:             '38%',
            width:           '17%',
            height:          '17%',
            background:      '#415A8C',
            borderRadius:    '50%',
            transformOrigin: 'center top',
            transform:       'scaleY(0)',
            animation:       'hc-blink 3s ease-in-out 1.5s infinite',
            pointerEvents:   'none',
          }}/>
        </div>

        {/* Greeting */}
        <div style={{ position: 'relative', zIndex: 1, animation: 'hc-up 0.55s ease 0.15s both', opacity: 0, animationFillMode: 'forwards' }}>
          <div style={{
            fontSize: 'clamp(42px, 8vw, 76px)',
            fontWeight: 400, color: B.primary,
            lineHeight: 1.05, letterSpacing: '-1px',
            marginBottom: 8,
            fontFamily: "'PPMondwest', serif",
          }}>
            Hi {firstName}!!!
          </div>
          <div style={{
            fontSize: 'clamp(26px, 5vw, 48px)',
            fontWeight: 400, color: B.brand,
            lineHeight: 1.1, letterSpacing: '-0.5px',
            fontFamily: "'PPMondwest', serif",
          }}>
            Welcome back!!!
          </div>
        </div>

        {/* Hi Juno! button — bottom left */}
        <button
          onClick={triggerJump}
          style={{
            position:   'absolute',
            bottom:     96,
            right:      28,
            padding:    '9px 18px',
            borderRadius: 24,
            border:     `1.5px solid ${B.primary}35`,
            background: 'rgba(255,255,255,0.7)',
            color:      B.primary,
            fontSize:   13,
            fontWeight: 600,
            cursor:     'pointer',
            fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow:  '0 2px 10px rgba(83,117,167,0.1)',
            transition: 'all 0.18s',
            animation:  'hc-up 0.5s ease 0.6s both',
            zIndex:     10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(83,117,167,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(83,117,167,0.1)'; e.currentTarget.style.transform = 'none'; }}
        >
          Hi Juno!
        </button>

        <ScrollHint />
      </div>

      {/* ── SECTION 2: Cards fly in on scroll ────────────────────── */}
      <div
        ref={cardsRef}
        style={{
          minHeight:      '100vh',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '60px 32px 80px',
          position:       'relative',
        }}
      >
        <div style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>
          {/* Label fades in above cards */}
          <div style={{
            fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase',
            color: B.nav, marginBottom: 20, textAlign: 'center',
            opacity: cardsVisible ? 1 : 0,
            transform: cardsVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
          }}>
            Where would you like to go?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {cards.map((card, i) => (
              <Card
                key={card.label}
                {...card}
                visible={cardsVisible}
                staggerDelay={i * 110}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
