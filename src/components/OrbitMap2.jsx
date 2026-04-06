import { useEffect, useRef, useState, useCallback } from 'react';
import { userData2 as userData } from '../data/userData2';

// ── Palette (light) ───────────────────────────────────────────────────────────
const P = {
  bg:     '#F2F5FB',
  panel:  'rgba(248,250,255,0.98)',
  amber:  '#C47A08',
  teal:   '#00806A',
  purple: '#5B40D4',
  red:    '#D42B2B',
  blue:   '#1A6BD4',
  text:   '#1C2540',
  dim:    '#8A9BBE',
  faint:  'rgba(0,0,0,0.04)',
  border: 'rgba(0,0,0,0.09)',
};

function nodeColor(entity) {
  if (entity.drifting) return P.red;
  if (entity.type === 'person' || entity.type === 'group') return P.purple;
  if (entity.type === 'routine') return P.teal;
  if (entity.type === 'pattern') return P.amber;
  return '#999';
}

const URGENT = [
  {
    id: 'u1', level: 'critical',
    title: 'Bloomberg exam April 3 — Module 4 not started',
    detail: 'Financial Statements module is 0% done (~4 hrs). FIN 3210 midterm same day.',
    entity: 'e4',
  },
  {
    id: 'u2', level: 'critical',
    title: 'Goldman portal closes April 5',
    detail: 'Victoria Chen reached out personally March 22. You opened it. No reply. 5 days left.',
    entity: 'e2',
  },
  {
    id: 'u3', level: 'warning',
    title: 'Dr. Marchetti — missed office hours twice',
    detail: 'March 11 and March 25, no-show, no email. Scholar of Finance tracks mentorship engagement.',
    entity: 'e5',
  },
];

// ── Force simulation ──────────────────────────────────────────────────────────
function initNodes(entities, w, h) {
  const cx = w / 2, cy = h / 2;
  const ringR = [0, 160, 290, 420];
  const byRing = [[], [], [], []];
  entities.forEach(e => byRing[e.orbit_ring].push(e));

  return entities.map(e => {
    const ring = e.orbit_ring;
    const peers = byRing[ring];
    const idx = peers.indexOf(e);
    const angle = (idx / peers.length) * Math.PI * 2 - Math.PI / 2 + ring * 0.6;
    const r = ringR[ring] + (Math.random() - 0.5) * 30;
    return {
      id: e.id,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      vx: 0, vy: 0,
      entity: e,
      w: 108, h: 38,
    };
  });
}

function stepForce(nodes, patterns, w, h, alpha) {
  const cx = w / 2, cy = h / 2;
  const repK = 6000, springK = 0.018, restLen = 140, gravK = 0.012, damp = 0.82;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + 1;
      const f = repK / d2;
      const d = Math.sqrt(d2);
      a.vx -= (f * dx) / d; a.vy -= (f * dy) / d;
      b.vx += (f * dx) / d; b.vy += (f * dy) / d;
    }
  }

  patterns.forEach(p => {
    const a = nodes.find(n => n.id === p.from_entity);
    const b = nodes.find(n => n.id === p.to_entity);
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = springK * (d - restLen);
    a.vx += f * dx / d; a.vy += f * dy / d;
    b.vx -= f * dx / d; b.vy -= f * dy / d;
  });

  nodes.forEach(n => {
    n.vx += (cx - n.x) * gravK; n.vy += (cy - n.y) * gravK;
    n.vx *= damp; n.vy *= damp;
    n.x += n.vx * alpha; n.y += n.vy * alpha;
    n.x = Math.max(n.w / 2 + 20, Math.min(w - n.w / 2 - 20, n.x));
    n.y = Math.max(n.h / 2 + 20, Math.min(h - n.h / 2 - 20, n.y));
  });
}

// ── Canvas renderer ───────────────────────────────────────────────────────────
function drawFrame(ctx, nodes, patterns, hovered, selected, w, h, t) {
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, w, h);

  // Dot grid
  ctx.fillStyle = 'rgba(0,0,0,0.055)';
  const gsp = 36;
  for (let x = gsp; x < w; x += gsp)
    for (let y = gsp; y < h; y += gsp) {
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

  // Connection lines
  patterns.forEach(p => {
    const a = nodes.find(n => n.id === p.from_entity);
    const b = nodes.find(n => n.id === p.to_entity);
    if (!a || !b) return;
    const isActive = selected && (selected.id === a.id || selected.id === b.id);
    ctx.save();
    ctx.strokeStyle = isActive ? P.amber : 'rgba(100,120,180,0.18)';
    ctx.lineWidth = isActive ? 1.8 : 1;
    ctx.setLineDash([4, 7]);
    ctx.lineDashOffset = -t * 12;
    ctx.globalAlpha = isActive ? 1 : 0.7;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  });

  // Nodes
  nodes.forEach(nd => {
    const { entity: e, x, y, w: nw, h: nh } = nd;
    const col = nodeColor(e);
    const isHov = hovered === e.id;
    const isSel = selected?.id === e.id;
    const rx = 7;

    ctx.save();
    ctx.globalAlpha = (!selected || isSel || isHov) ? 1 : 0.25;

    const bx = x - nw / 2, by = y - nh / 2;

    // Drop shadow
    if (isSel || isHov) {
      ctx.shadowColor = col;
      ctx.shadowBlur = isSel ? 14 : 8;
    }

    // Node box
    ctx.beginPath();
    ctx.roundRect(bx, by, nw, nh, rx);
    ctx.fillStyle = isSel ? col + '15' : isHov ? col + '0D' : '#FFFFFF';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = isSel ? col : isHov ? col + 'CC' : col + '55';
    ctx.lineWidth = isSel ? 1.8 : 1.2;
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = col;
    ctx.globalAlpha = ((!selected || isSel || isHov) ? 1 : 0.25) * (isSel ? 1 : isHov ? 0.85 : 0.65);
    ctx.beginPath();
    ctx.roundRect(bx, by + 7, 3, nh - 14, 2);
    ctx.fill();
    ctx.globalAlpha = (!selected || isSel || isHov) ? 1 : 0.25;

    // Drifting pulse ring
    if (e.drifting) {
      const pulse = 0.35 + Math.sin(t * 3 + e.orbit_ring) * 0.3;
      ctx.strokeStyle = P.red;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = pulse * ((!selected || isSel) ? 0.65 : 0.1);
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.roundRect(bx - 5, by - 5, nw + 10, nh + 10, rx + 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = (!selected || isSel || isHov) ? 1 : 0.25;

    // Name
    ctx.fillStyle = isSel ? P.text : isHov ? P.text : '#2A3555';
    ctx.font = `${isSel ? 650 : 500} 11px "SF Mono", "Fira Code", monospace`;
    ctx.fillText(
      e.name.length > 14 ? e.name.slice(0, 13) + '…' : e.name,
      bx + 11, by + nh / 2 + 4
    );

    // Strength badge
    const pct = Math.round(e.strength * 100) + '%';
    ctx.font = '500 9px "SF Mono", "Fira Code", monospace';
    ctx.fillStyle = col;
    ctx.globalAlpha = ((!selected || isSel || isHov) ? 1 : 0.25) * 0.8;
    ctx.textAlign = 'right';
    ctx.fillText(pct, bx + nw - 7, by + nh / 2 + 4);
    ctx.textAlign = 'left';

    ctx.restore();
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrbitMap2() {
  const canvasRef  = useRef(null);
  const nodesRef   = useRef([]);
  const animRef    = useRef(null);
  const tRef       = useRef(0);
  const stableRef  = useRef(0);

  const [hovered,    setHovered]    = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [dismissed,  setDismissed]  = useState(new Set());
  const [ready,      setReady]      = useState(false);

  const hoveredRef  = useRef(null);
  const selectedRef = useRef(null);
  useEffect(() => { hoveredRef.current  = hovered;  }, [hovered]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    nodesRef.current = initNodes(userData.entities, w, h);
    setReady(true);

    const onResize = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      nodesRef.current = initNodes(userData.entities, w, h);
      stableRef.current = 0;
    };
    window.addEventListener('resize', onResize);

    const SETTLE = 220;
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      tRef.current += 0.016;
      const alpha = stableRef.current < SETTLE ? Math.max(0.1, 1 - stableRef.current / SETTLE) : 0;
      if (alpha > 0) { stepForce(nodesRef.current, userData.patterns, w, h, alpha); stableRef.current++; }
      drawFrame(ctx, nodesRef.current, userData.patterns, hoveredRef.current, selectedRef.current, w, h, tRef.current);
    };
    loop();

    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, []);

  const getNode = useCallback((ev) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    return nodesRef.current.find(nd =>
      mx >= nd.x - nd.w / 2 && mx <= nd.x + nd.w / 2 &&
      my >= nd.y - nd.h / 2 && my <= nd.y + nd.h / 2
    ) || null;
  }, []);

  const handleMove = useCallback((ev) => {
    const nd = getNode(ev);
    const id = nd?.entity.id || null;
    if (id !== hoveredRef.current) {
      setHovered(id);
      canvasRef.current.style.cursor = id ? 'pointer' : 'default';
    }
  }, [getNode]);

  const handleClick = useCallback((ev) => {
    const nd = getNode(ev);
    if (nd) { setSelected(prev => prev?.id === nd.entity.id ? null : nd.entity); setUrgentOpen(false); }
    else setSelected(null);
  }, [getNode]);

  const openFromAlert = (entityId) => {
    const e = userData.entities.find(x => x.id === entityId);
    if (e) { setSelected(e); setUrgentOpen(false); }
  };

  const visible = URGENT.filter(u => !dismissed.has(u.id));

  return (
    <div style={{ width: '100%', height: '100%', background: P.bg, position: 'relative', overflow: 'hidden', fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace' }}>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMove}
        onClick={handleClick}
        onMouseLeave={() => setHovered(null)}
      />

      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 46, background: 'rgba(255,255,255,0.92)',
        borderBottom: `1px solid ${P.border}`,
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 24 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C, #3C3489)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff',
          }}>B</div>
          <span style={{ color: P.amber, fontWeight: 700, fontSize: 13, letterSpacing: '2px' }}>BREEZE</span>
        </div>

        <div style={{ width: 1, height: 20, background: P.border, marginRight: 24 }} />

        <span style={{ color: P.text, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', marginRight: 8 }}>
          {userData.name.toUpperCase()}
        </span>
        <span style={{ color: P.dim, fontSize: 11, marginRight: 16 }}>·</span>
        <span style={{ color: P.teal, fontSize: 11, letterSpacing: '0.3px', fontWeight: 600 }}>BABSON '27  ·  SCHOLAR OF FINANCE</span>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: P.teal, animation: 'breeze-pulse 2s ease-in-out infinite' }} />
          <span style={{ color: P.dim, fontSize: 10, letterSpacing: '1px' }}>LIVE</span>
        </div>
      </div>

      {/* ── Left profile strip ────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 46, left: 0, bottom: 0,
        width: 230,
        background: 'rgba(255,255,255,0.88)',
        borderRight: `1px solid ${P.border}`,
        backdropFilter: 'blur(12px)',
        overflowY: 'auto', scrollbarWidth: 'none',
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 18,
        zIndex: 100, fontSize: 11,
      }}>
        <div>
          <div style={{ color: P.amber, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
            SIGNAL STATS
          </div>
          {[
            ['TRACK',  'Scholar of Finance',                             P.teal],
            ['YEAR',   "Sophomore · Class '27",                         P.text],
            ['NODES',  String(userData.entities.length),                P.amber],
            ['LINKS',  String(userData.patterns.length),                P.amber],
            ['UNREAD', '61% inbox',                                     P.red],
            ['NUDGES', String(userData.stats.nudges_sent) + ' sent',    P.text],
            ['APPS',   String(userData.apps_connected.length) + ' connected', P.text],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ color: P.dim, fontSize: 9, letterSpacing: '0.8px' }}>{k}</span>
              <span style={{ color: c, fontSize: 10, fontWeight: 600, textAlign: 'right', maxWidth: 140 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: P.border }} />

        <div>
          <div style={{ color: P.amber, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
            ACTIVE SIGNALS
          </div>
          {userData.profile_summary.patterns.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 9, alignItems: 'flex-start' }}>
              <span style={{ color: P.amber, fontSize: 9, marginTop: 2, flexShrink: 0 }}>▸</span>
              <span style={{ color: '#4A5A7A', fontSize: 10, lineHeight: 1.55 }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: P.border }} />

        <div>
          <div style={{ color: P.amber, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
            CONNECTED
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {userData.apps_connected.map(app => (
              <span key={app} style={{
                background: P.faint, border: `1px solid ${P.border}`,
                borderRadius: 4, padding: '3px 7px',
                color: '#5A6A8A', fontSize: 9, letterSpacing: '0.3px',
              }}>{app}</span>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: P.border }} />

        <div>
          <div style={{ color: P.amber, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
            OPEN QUESTIONS
          </div>
          {userData.profile_summary.decisions.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 9, alignItems: 'flex-start' }}>
              <span style={{ color: P.dim, fontSize: 9, marginTop: 2, flexShrink: 0 }}>?</span>
              <span style={{ color: '#4A5A7A', fontSize: 10, lineHeight: 1.55 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 54, left: 246,
        display: 'flex', gap: 14, alignItems: 'center', zIndex: 50,
      }}>
        {[['person / group', P.purple], ['routine', P.teal], ['pattern', P.amber], ['drifting', P.red]].map(([label, col]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 1, background: col }} />
            <span style={{ color: P.dim, fontSize: 9, letterSpacing: '0.5px' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Hint ──────────────────────────────────────────────────────────── */}
      {ready && (
        <div style={{
          position: 'absolute', bottom: 54, right: (selected || urgentOpen) ? 390 : 24,
          transition: 'right 0.3s ease',
          background: 'rgba(196,122,8,0.08)', border: `1px solid ${P.amber}44`,
          borderRadius: 6, padding: '6px 14px', pointerEvents: 'none', zIndex: 50,
        }}>
          <span style={{ color: P.amber, fontSize: 10, letterSpacing: '0.5px' }}>click node to inspect</span>
        </div>
      )}

      {/* ── Alert button ──────────────────────────────────────────────────── */}
      {visible.length > 0 && !urgentOpen && (
        <button
          onClick={() => { setUrgentOpen(true); setSelected(null); }}
          style={{
            position: 'absolute', top: 60, right: 20,
            background: 'rgba(212,43,43,0.07)',
            border: `1px solid rgba(212,43,43,0.28)`,
            borderRadius: 6, padding: '7px 14px',
            cursor: 'pointer', zIndex: 150,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: P.red, animation: 'breeze-pulse 1.6s ease-in-out infinite' }} />
          <span style={{ color: P.red, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>
            {visible.length} ALERTS
          </span>
        </button>
      )}

      {/* ── Alert panel ───────────────────────────────────────────────────── */}
      {urgentOpen && (
        <div style={{
          position: 'absolute', top: 46, right: 0, bottom: 0,
          width: 360, background: 'rgba(255,255,255,0.98)',
          borderLeft: `1px solid ${P.border}`,
          backdropFilter: 'blur(24px)',
          overflowY: 'auto', scrollbarWidth: 'none',
          padding: '24px 22px',
          display: 'flex', flexDirection: 'column', gap: 14,
          zIndex: 300,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ color: P.red, fontSize: 9, fontWeight: 700, letterSpacing: '2px', marginBottom: 5 }}>ALERTS</div>
              <div style={{ color: P.text, fontSize: 18, fontWeight: 700 }}>{visible.length} open item{visible.length !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => setUrgentOpen(false)} style={{
              background: P.faint, border: `1px solid ${P.border}`,
              borderRadius: 5, width: 30, height: 30, cursor: 'pointer',
              color: P.dim, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          <div style={{ height: 1, background: P.border }} />

          {visible.map(item => (
            <div key={item.id} style={{
              background: item.level === 'critical' ? 'rgba(212,43,43,0.05)' : 'rgba(196,122,8,0.05)',
              border: `1px solid ${item.level === 'critical' ? 'rgba(212,43,43,0.18)' : 'rgba(196,122,8,0.18)'}`,
              borderRadius: 8, padding: '14px',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: item.level === 'critical' ? P.red : P.amber,
                }} />
                <div style={{ color: P.text, fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>{item.title}</div>
              </div>
              <div style={{ color: '#5A6A8A', fontSize: 11, lineHeight: 1.6, marginBottom: 12, paddingLeft: 15 }}>{item.detail}</div>
              <div style={{ display: 'flex', gap: 7, paddingLeft: 15 }}>
                <button onClick={() => openFromAlert(item.entity)} style={{
                  background: P.faint, border: `1px solid ${P.border}`,
                  borderRadius: 5, padding: '5px 11px', cursor: 'pointer',
                  color: P.text, fontSize: 10, letterSpacing: '0.3px', fontFamily: 'inherit',
                }}>VIEW NODE →</button>
                <button onClick={() => setDismissed(s => new Set([...s, item.id]))} style={{
                  background: 'transparent', border: `1px solid ${P.border}`,
                  borderRadius: 5, padding: '5px 11px', cursor: 'pointer',
                  color: P.dim, fontSize: 10, fontFamily: 'inherit',
                }}>DISMISS</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail panel ──────────────────────────────────────────────────── */}
      {selected && !urgentOpen && (
        <DetailPanel entity={selected} onClose={() => setSelected(null)} />
      )}

      {/* ── Bottom stats bar ──────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 230, right: 0,
        height: 44, background: 'rgba(255,255,255,0.92)',
        borderTop: `1px solid ${P.border}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 32,
        zIndex: 100,
      }}>
        {[
          ['TRACK',     'Scholar of Finance',           P.teal],
          ['UNREAD',    '61%',                          P.red],
          ['DEADLINES', '3 in 5 days',                  P.red],
          ['NUDGES',    String(userData.stats.nudges_sent), P.amber],
          ['CONTEXT',   `${userData.weeks_on_breeze} wks`,  P.text],
        ].map(([label, val, col]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{ color: P.dim, fontSize: 9, letterSpacing: '1px' }}>{label}</span>
            <span style={{ color: col, fontSize: 12, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes breeze-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ entity, onClose }) {
  const col = nodeColor(entity);
  const related = userData.patterns.filter(p =>
    p.from_entity === entity.id || p.to_entity === entity.id
  );
  const keywords = entity.name.toLowerCase().split(/[\s·,]+/);
  const insights = userData.conversation_insights.filter(i =>
    keywords.some(k => k.length > 3 && i.toLowerCase().includes(k))
  );

  return (
    <div style={{
      position: 'absolute', top: 46, right: 0, bottom: 0,
      width: 370,
      background: 'rgba(255,255,255,0.98)',
      borderLeft: `1px solid ${P.border}`,
      backdropFilter: 'blur(24px)',
      overflowY: 'auto', scrollbarWidth: 'none',
      padding: '24px 22px 36px',
      display: 'flex', flexDirection: 'column', gap: 20,
      zIndex: 300,
      fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: col, marginBottom: 7 }}>
            {entity.type}{entity.drifting ? '  ·  DRIFTING' : ''}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: P.text, lineHeight: 1.2, letterSpacing: '-0.3px' }}>{entity.name}</div>
          <div style={{ fontSize: 11, color: P.dim, marginTop: 5, lineHeight: 1.4 }}>{entity.label}</div>
        </div>
        <button onClick={onClose} style={{
          background: P.faint, border: `1px solid ${P.border}`,
          borderRadius: 5, width: 30, height: 30, cursor: 'pointer',
          color: P.dim, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontFamily: 'inherit',
        }}>✕</button>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ color: P.dim, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px' }}>SIGNAL STRENGTH</span>
          <span style={{ color: col, fontWeight: 700, fontSize: 11 }}>{Math.round(entity.strength * 100)}%</span>
        </div>
        <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: entity.drifting ? P.red : `linear-gradient(90deg, ${P.purple}88, ${col})`,
            width: `${entity.strength * 100}%`,
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {(entity.source || []).map(s => (
          <span key={s} style={{
            background: P.faint, border: `1px solid ${P.border}`,
            borderRadius: 4, padding: '3px 9px', fontSize: 10, color: '#5A6A8A',
          }}>{s}</span>
        ))}
        <span style={{
          background: col + '12', border: `1px solid ${col}44`,
          borderRadius: 4, padding: '3px 9px', fontSize: 10, color: col, fontWeight: 600,
        }}>Ring {entity.orbit_ring}</span>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.025)', borderRadius: 8,
        padding: '14px 15px', border: `1px solid ${col}20`,
      }}>
        <div style={{ color: '#3A4A6A', fontSize: 11, lineHeight: 1.75 }}>{entity.detail}</div>
      </div>

      {related.length > 0 && (
        <div>
          <div style={{ color: P.dim, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
            CONNECTED PATTERNS
          </div>
          {related.map(p => (
            <div key={p.id} style={{
              background: 'rgba(196,122,8,0.05)', border: '1px solid rgba(196,122,8,0.15)',
              borderRadius: 7, padding: '11px 13px', marginBottom: 8,
            }}>
              <div style={{ color: P.amber, fontSize: 11, fontWeight: 600, marginBottom: 6, lineHeight: 1.35 }}>{p.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: P.dim, fontSize: 10 }}>{p.occurrences} occurrences</span>
                <span style={{ color: P.dim, fontSize: 10 }}>{Math.round(p.confidence * 100)}% conf.</span>
              </div>
              {p.action && <div style={{ color: P.teal, fontSize: 10, fontWeight: 600 }}>→ {p.action}</div>}
            </div>
          ))}
        </div>
      )}

      {insights.length > 0 && (
        <div style={{ background: 'rgba(196,122,8,0.06)', border: `1px solid rgba(196,122,8,0.18)`, borderRadius: 8, padding: '13px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: P.amber, marginBottom: 9 }}>
            BREEZE ALREADY KNOWS
          </div>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < insights.length - 1 ? 9 : 0 }}>
              <span style={{ color: P.amber, fontSize: 9, marginTop: 2, flexShrink: 0 }}>✦</span>
              <div style={{ color: '#3A4A6A', fontSize: 11, lineHeight: 1.65 }}>{ins}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
