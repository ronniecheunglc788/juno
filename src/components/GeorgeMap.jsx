import { useEffect, useRef, useState, useCallback } from 'react';
import { researchData as userData } from '../data/researchData';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:     '#F5F8F7',
  cyan:   '#007A6A',
  green:  '#18925A',
  amber:  '#B86A08',
  red:    '#C42B48',
  purple: '#5B40D4',
  text:   '#0C1E1A',
  mid:    '#5A8A7A',
  dim:    '#A0BDB6',
  border: 'rgba(0,120,100,0.11)',
  scan:   'rgba(0,130,110,0.06)',
};

function nodeColor(entity) {
  if (entity.drifting) return P.red;
  if (entity.type === 'concept') return P.cyan;
  if (entity.type === 'method') return P.green;
  if (entity.type === 'tool') return P.amber;
  if (entity.type === 'paper') return P.purple;
  return P.mid;
}

const URGENT = [
  {
    id: 'u1', level: 'critical',
    title: 'Deep learning gap — PhD committees will ask',
    detail: 'MIT and Stanford interviews probe neural decoding with CNNs/RNNs. You\'ve read 2 papers but can\'t implement anything. This is the most time-sensitive gap.',
    entity: 'e14',
  },
  {
    id: 'u2', level: 'critical',
    title: 'PEDOT:PSS — Prof. Shen has mentioned it twice',
    detail: 'Conducting polymer coating, directly relevant to your electrode optimization work. Prof. Shen referenced it in the last 2 lab meetings. You can\'t speak to the electrochemistry.',
    entity: 'e15',
  },
  {
    id: 'u3', level: 'warning',
    title: 'Kilosort is a black box in your methods',
    detail: 'You use it daily but can\'t defend the statistical assumptions. This is a vulnerability in any paper review or thesis defense.',
    entity: 'e16',
  },
];

// ── Force simulation ──────────────────────────────────────────────────────────
function initNodes(entities, w, h) {
  const cx = w / 2, cy = h / 2;
  const ringR = [0, 170, 300, 440];
  const byRing = [[], [], [], []];
  entities.forEach(e => byRing[e.orbit_ring].push(e));
  return entities.map(e => {
    const peers = byRing[e.orbit_ring];
    const idx = peers.indexOf(e);
    const angle = (idx / peers.length) * Math.PI * 2 - Math.PI / 2 + e.orbit_ring * 0.55;
    const r = ringR[e.orbit_ring] + (Math.random() - 0.5) * 28;
    return { id: e.id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0, entity: e };
  });
}

function nodeRadius(entity) {
  return 10 + entity.strength * 12;
}

function stepForce(nodes, patterns, w, h, alpha) {
  const cx = w / 2, cy = h / 2;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + 1;
      const f = 7000 / d2;
      const d = Math.sqrt(d2);
      a.vx -= f * dx / d; a.vy -= f * dy / d;
      b.vx += f * dx / d; b.vy += f * dy / d;
    }
  }
  patterns.forEach(p => {
    const a = nodes.find(n => n.id === p.from_entity);
    const b = nodes.find(n => n.id === p.to_entity);
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = 0.016 * (d - 150);
    a.vx += f * dx / d; a.vy += f * dy / d;
    b.vx -= f * dx / d; b.vy -= f * dy / d;
  });
  nodes.forEach(n => {
    n.vx += (cx - n.x) * 0.01; n.vy += (cy - n.y) * 0.01;
    n.vx *= 0.80; n.vy *= 0.80;
    n.x += n.vx * alpha; n.y += n.vy * alpha;
    const r = nodeRadius(n.entity);
    n.x = Math.max(r + 16, Math.min(w - r - 16, n.x));
    n.y = Math.max(r + 16, Math.min(h - r - 16, n.y));
  });
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
function drawFrame(ctx, nodes, patterns, hovered, selected, w, h, t, particles) {
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, w, h);

  // Hex grid
  const S = 42;
  const HW = S * Math.sqrt(3);
  const HH = S * 2;
  ctx.strokeStyle = 'rgba(0,120,100,0.07)';
  ctx.lineWidth = 0.6;
  for (let col = -1; col < w / HW + 2; col++) {
    for (let row = -1; row < h / (HH * 0.75) + 2; row++) {
      const xOff = row % 2 === 0 ? 0 : HW / 2;
      const hcx = col * HW + xOff;
      const hcy = row * HH * 0.75;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = hcx + S * Math.cos(a), py = hcy + S * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Scan line
  const scanPeriod = 9;
  const scanFrac = (t % scanPeriod) / scanPeriod;
  const scanY = scanFrac * h;
  const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
  scanGrad.addColorStop(0, 'rgba(0,120,100,0)');
  scanGrad.addColorStop(0.5, 'rgba(0,120,100,0.05)');
  scanGrad.addColorStop(1, 'rgba(0,120,100,0)');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 60, w, 120);

  // Connections
  patterns.forEach(p => {
    const a = nodes.find(n => n.id === p.from_entity);
    const b = nodes.find(n => n.id === p.to_entity);
    if (!a || !b) return;
    const isActive = selected && (selected.id === a.id || selected.id === b.id);
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2 - 30;
    ctx.save();
    ctx.strokeStyle = isActive ? P.cyan : 'rgba(0,120,100,0.18)';
    ctx.lineWidth = isActive ? 1.4 : 0.8;
    ctx.globalAlpha = isActive ? 0.85 : 0.6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(midX, midY, b.x, b.y);
    ctx.stroke();
    ctx.restore();
  });

  // Pulse particles
  particles.forEach(p => {
    const a = nodes.find(n => n.id === p.from);
    const b = nodes.find(n => n.id === p.to);
    if (!a || !b) return;
    const s = p.progress;
    const om = 1 - s;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2 - 30;
    const px = om * om * a.x + 2 * om * s * midX + s * s * b.x;
    const py = om * om * a.y + 2 * om * s * midY + s * s * b.y;
    const col = nodeColor(a.entity);
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - Math.abs(s - 0.5) * 0.6);
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 5);
    grd.addColorStop(0, col);
    grd.addColorStop(1, col + '00');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Nodes
  nodes.forEach(nd => {
    const { entity: e, x, y } = nd;
    const col = nodeColor(e);
    const r = nodeRadius(e);
    const isHov = hovered === e.id;
    const isSel = selected?.id === e.id;
    const dimmed = !!(selected && !isSel && !isHov);
    const nearScan = Math.abs(y - scanY) < 55;

    ctx.save();
    ctx.globalAlpha = dimmed ? 0.18 : 1;

    // Soft shadow halo (scan-boosted)
    const glowR = r + 8 + (nearScan ? 5 : 0);
    const glowAlpha = (isSel ? 0.14 : isHov ? 0.09 : 0.04) + (nearScan ? 0.05 : 0);
    const grd = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR + 10);
    grd.addColorStop(0, col + Math.round(glowAlpha * 255).toString(16).padStart(2, '0'));
    grd.addColorStop(1, col + '00');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, glowR + 10, 0, Math.PI * 2);
    ctx.fill();

    // Drifting alert pulse ring
    if (e.drifting) {
      const pulse = 0.3 + Math.sin(t * 2.8 + e.orbit_ring) * 0.28;
      ctx.strokeStyle = P.red;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = dimmed ? 0.05 : pulse;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(x, y, r + 9 + Math.sin(t * 2.8) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = dimmed ? 0.18 : 1;
    }

    // Outer ring
    ctx.strokeStyle = col;
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.globalAlpha = dimmed ? 0.18 : (isSel ? 1 : isHov ? 0.85 : 0.55);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = dimmed ? 0.1 : 0.28;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    // Fill
    ctx.globalAlpha = dimmed ? 0.18 : 1;
    ctx.fillStyle = isSel ? col + '18' : isHov ? col + '10' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Center dot
    ctx.fillStyle = col;
    ctx.globalAlpha = dimmed ? 0.1 : (isSel ? 1 : isHov ? 0.9 : 0.55);
    ctx.beginPath();
    ctx.arc(x, y, isSel ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.globalAlpha = dimmed ? 0.12 : 1;
    ctx.font = `${isSel ? 600 : 500} 10px "Inter", "SF Pro", system-ui, sans-serif`;
    ctx.fillStyle = isSel ? P.text : isHov ? P.text : 'rgba(12,30,26,0.70)';
    ctx.textAlign = 'center';
    ctx.fillText(
      e.name.length > 16 ? e.name.slice(0, 15) + '…' : e.name,
      x, y + r + 14
    );

    // Type sublabel on selected
    if (isSel) {
      ctx.font = '400 9px "Inter", system-ui, sans-serif';
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.7;
      ctx.fillText(e.label.length > 22 ? e.label.slice(0, 21) + '…' : e.label, x, y + r + 26);
    }

    ctx.textAlign = 'left';
    ctx.restore();
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GeorgeMap() {
  const canvasRef    = useRef(null);
  const nodesRef     = useRef([]);
  const animRef      = useRef(null);
  const tRef         = useRef(0);
  const stableRef    = useRef(0);
  const particlesRef = useRef([]);

  const [hovered,    setHovered]    = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [dismissed,  setDismissed]  = useState(new Set());
  const [ready,      setReady]      = useState(false);

  const hovRef  = useRef(null);
  const selRef  = useRef(null);
  useEffect(() => { hovRef.current = hovered; }, [hovered]);
  useEffect(() => { selRef.current = selected; }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    nodesRef.current = initNodes(userData.entities, w, h);
    particlesRef.current = [];
    setReady(true);

    // Seed initial particles
    userData.patterns.forEach(p => {
      particlesRef.current.push({ from: p.from_entity, to: p.to_entity, progress: Math.random() });
    });

    const onResize = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      nodesRef.current = initNodes(userData.entities, w, h);
      stableRef.current = 0;
    };
    window.addEventListener('resize', onResize);

    let lastSpawn = 0;
    const SETTLE = 240;
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      tRef.current += 0.016;
      const alpha = stableRef.current < SETTLE ? Math.max(0.08, 1 - stableRef.current / SETTLE) : 0;
      if (alpha > 0) { stepForce(nodesRef.current, userData.patterns, w, h, alpha); stableRef.current++; }

      // Advance & recycle particles
      const SPEED = 0.0028;
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, progress: p.progress + SPEED }))
        .filter(p => p.progress < 1);

      // Spawn new particles periodically
      if (tRef.current - lastSpawn > 1.4) {
        lastSpawn = tRef.current;
        const count = particlesRef.current.filter(p => p.from === userData.patterns[0].from_entity).length;
        if (particlesRef.current.length < userData.patterns.length * 1.5) {
          const p = userData.patterns[Math.floor(Math.random() * userData.patterns.length)];
          particlesRef.current.push({ from: p.from_entity, to: p.to_entity, progress: 0 });
        }
      }

      drawFrame(ctx, nodesRef.current, userData.patterns, hovRef.current, selRef.current, w, h, tRef.current, particlesRef.current);
    };
    loop();

    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, []);

  const getNode = useCallback((ev) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    return nodesRef.current.find(nd => {
      const r = nodeRadius(nd.entity) + 6;
      const dx = nd.x - mx, dy = nd.y - my;
      return dx * dx + dy * dy <= r * r;
    }) || null;
  }, []);

  const handleMove = useCallback((ev) => {
    const nd = getNode(ev);
    const id = nd?.entity.id || null;
    if (id !== hovRef.current) {
      setHovered(id);
      canvasRef.current.style.cursor = id ? 'pointer' : 'default';
    }
  }, [getNode]);

  const handleClick = useCallback((ev) => {
    const nd = getNode(ev);
    if (nd) { setSelected(p => p?.id === nd.entity.id ? null : nd.entity); setUrgentOpen(false); }
    else setSelected(null);
  }, [getNode]);

  const openFromAlert = id => {
    const e = userData.entities.find(x => x.id === id);
    if (e) { setSelected(e); setUrgentOpen(false); }
  };

  const visible = URGENT.filter(u => !dismissed.has(u.id));

  return (
    <div style={{ width: '100%', height: '100%', background: P.bg, position: 'relative', overflow: 'hidden', fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMove}
        onClick={handleClick}
        onMouseLeave={() => setHovered(null)}
      />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        background: 'rgba(245,248,247,0.94)', borderBottom: `1px solid ${P.border}`,
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', padding: '0 28px',
        zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #007A6A, #18925A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
          }}>B</div>
          <span style={{ color: P.cyan, fontWeight: 700, fontSize: 13, letterSpacing: '2px' }}>BREEZE</span>
        </div>

        <div style={{ width: 1, height: 22, background: P.border, marginRight: 28 }} />

        <div>
          <div style={{ color: P.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.2px' }}>{userData.name}</div>
          <div style={{ color: P.mid, fontSize: 10, marginTop: 1, letterSpacing: '0.3px' }}>
            Boston University  ·  Biomedical Engineering  ·  Neural Interface Lab
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Research status chips */}
        <div style={{ display: 'flex', gap: 8, marginRight: 20 }}>
          {[
            ['Chronic Recording', P.cyan],
            ['Electrode Arrays', P.green],
            ['3 Knowledge Gaps', P.red],
          ].map(([label, col]) => (
            <div key={label} style={{
              background: col + '14', border: `1px solid ${col}44`,
              borderRadius: 20, padding: '4px 11px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
              <span style={{ color: col, fontSize: 10, fontWeight: 600, letterSpacing: '0.3px' }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: P.cyan, animation: 'geo-pulse 2.2s ease-in-out infinite' }} />
          <span style={{ color: P.mid, fontSize: 10, letterSpacing: '1px' }}>LIVE</span>
        </div>
      </div>

      {/* ── Floating stats overlay (top-left) ────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 68, left: 20,
        background: 'rgba(255,255,255,0.90)', border: `1px solid ${P.border}`,
        borderRadius: 10, padding: '14px 16px',
        backdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 100, minWidth: 170,
      }}>
        <div style={{ color: P.cyan, fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 2 }}>
          RESEARCH MAP
        </div>
        {[
          [String(userData.entities.length),                    'concepts mapped',     P.text],
          [String(userData.patterns.length),                    'knowledge links',     P.cyan],
          [String(userData.stats.actions_proposed),             'papers read',         P.text],
          [String(userData.stats.nudges_responded),             'methods proficient',  P.green],
          [String(userData.stats.actions_confirmed),            'open questions',      P.amber],
          ['3',                                                 'critical gaps',       P.red],
        ].map(([val, label, col]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
            <span style={{ color: P.dim, fontSize: 9, letterSpacing: '0.5px' }}>{label}</span>
            <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24,
        display: 'flex', flexDirection: 'column', gap: 6, zIndex: 50,
      }}>
        {[['concept / paper', P.cyan], ['method / tool', P.green], ['pattern / link', P.amber], ['knowledge gap', P.red]].map(([label, col]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${col}`, background: col + '22', flexShrink: 0 }} />
            <span style={{ color: P.mid, fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Hint ──────────────────────────────────────────────────────────── */}
      {ready && (
        <div style={{
          position: 'absolute', bottom: 24, right: (selected || urgentOpen) ? 390 : 24,
          transition: 'right 0.3s ease',
          background: 'rgba(0,120,100,0.05)', border: `1px solid ${P.cyan}30`,
          borderRadius: 8, padding: '7px 14px', pointerEvents: 'none', zIndex: 50,
        }}>
          <span style={{ color: P.cyan, fontSize: 10, opacity: 0.75 }}>click any concept to explore  ·  dashed = knowledge gap</span>
        </div>
      )}

      {/* ── Alert button ──────────────────────────────────────────────────── */}
      {visible.length > 0 && !urgentOpen && (
        <button
          onClick={() => { setUrgentOpen(true); setSelected(null); }}
          style={{
            position: 'absolute', top: 68, right: 20,
            background: 'rgba(196,43,72,0.07)',
            border: '1px solid rgba(196,43,72,0.25)',
            borderRadius: 8, padding: '9px 16px',
            cursor: 'pointer', zIndex: 150,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: P.red, animation: 'geo-pulse 1.5s ease-in-out infinite' }} />
          <span style={{ color: P.red, fontSize: 12, fontWeight: 700 }}>
            {visible.length} Knowledge Gaps
          </span>
        </button>
      )}

      {/* ── Alert panel ───────────────────────────────────────────────────── */}
      {urgentOpen && (
        <div style={{
          position: 'absolute', top: 52, right: 0, bottom: 0, width: 370,
          background: 'rgba(250,253,252,0.98)', borderLeft: `1px solid ${P.border}`,
          backdropFilter: 'blur(24px)',
          overflowY: 'auto', scrollbarWidth: 'none',
          padding: '26px 22px',
          display: 'flex', flexDirection: 'column', gap: 14,
          zIndex: 300,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ color: P.red, fontSize: 9, fontWeight: 700, letterSpacing: '2px', marginBottom: 5 }}>KNOWLEDGE GAPS</div>
              <div style={{ color: P.text, fontSize: 19, fontWeight: 700 }}>{visible.length} gap{visible.length !== 1 ? 's' : ''} to close</div>
            </div>
            <button onClick={() => setUrgentOpen(false)} style={{
              background: 'rgba(0,0,0,0.04)', border: `1px solid ${P.border}`,
              borderRadius: 6, width: 32, height: 32, cursor: 'pointer',
              color: P.mid, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          <div style={{ height: 1, background: P.border }} />

          {visible.map(item => (
            <div key={item.id} style={{
              background: item.level === 'critical' ? 'rgba(196,43,72,0.05)' : 'rgba(184,106,8,0.05)',
              border: `1px solid ${item.level === 'critical' ? 'rgba(196,43,72,0.18)' : 'rgba(184,106,8,0.16)'}`,
              borderRadius: 10, padding: '16px',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: item.level === 'critical' ? P.red : P.amber,
                  boxShadow: `0 0 7px ${item.level === 'critical' ? P.red : P.amber}`,
                }} />
                <div style={{ color: P.text, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{item.title}</div>
              </div>
              <div style={{ color: P.mid, fontSize: 12, lineHeight: 1.65, marginBottom: 13, paddingLeft: 18 }}>{item.detail}</div>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 18 }}>
                <button onClick={() => openFromAlert(item.entity)} style={{
                  background: 'rgba(0,120,100,0.07)', border: `1px solid ${P.border}`,
                  borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                  color: P.cyan, fontSize: 11, fontWeight: 600,
                }}>Explore concept →</button>
                <button onClick={() => setDismissed(s => new Set([...s, item.id]))} style={{
                  background: 'transparent', border: `1px solid ${P.dim}`,
                  borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                  color: P.mid, fontSize: 11,
                }}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail panel ──────────────────────────────────────────────────── */}
      {selected && !urgentOpen && (
        <DetailPanel entity={selected} onClose={() => setSelected(null)} />
      )}

      <style>{`
        @keyframes geo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
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
  const keywords = entity.name.toLowerCase().split(/[\s·,/]+/);
  const insights = userData.conversation_insights.filter(i =>
    keywords.some(k => k.length > 3 && i.toLowerCase().includes(k))
  );

  return (
    <div style={{
      position: 'absolute', top: 52, right: 0, bottom: 0, width: 375,
      background: 'rgba(250,253,252,0.98)', borderLeft: `1px solid ${P.border}`,
      backdropFilter: 'blur(28px)',
      overflowY: 'auto', scrollbarWidth: 'none',
      padding: '26px 24px 40px',
      display: 'flex', flexDirection: 'column', gap: 22,
      zIndex: 300,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}`, flexShrink: 0 }} />
            <span style={{ color: col, fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.85 }}>
              {entity.type}{entity.drifting ? '  ·  DRIFTING' : ''}
            </span>
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, color: P.text, lineHeight: 1.2, letterSpacing: '-0.3px' }}>{entity.name}</div>
          <div style={{ fontSize: 12, color: P.mid, marginTop: 6, lineHeight: 1.4 }}>{entity.label}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(0,0,0,0.04)', border: `1px solid ${P.border}`,
          borderRadius: 6, width: 32, height: 32, cursor: 'pointer',
          color: P.mid, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>✕</button>
      </div>

      {/* Signal strength */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: P.dim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Mastery Level</span>
          <span style={{ color: col, fontWeight: 700, fontSize: 12 }}>{Math.round(entity.strength * 100)}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(0,0,0,0.07)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: entity.drifting ? P.red : `linear-gradient(90deg, ${P.cyan}66, ${col})`,
            width: `${entity.strength * 100}%`,
            boxShadow: `0 0 8px ${col}55`,
          }} />
        </div>
      </div>

      {/* Sources + orbit */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(entity.source || []).map(s => (
          <span key={s} style={{
            background: 'rgba(0,120,100,0.05)', border: `1px solid ${P.border}`,
            borderRadius: 5, padding: '3px 10px', fontSize: 10, color: P.mid,
          }}>{s}</span>
        ))}
        <span style={{
          background: col + '14', border: `1px solid ${col}40`,
          borderRadius: 5, padding: '3px 10px', fontSize: 10, color: col, fontWeight: 600,
        }}>{entity.orbit_ring === 1 ? 'Inner' : entity.orbit_ring === 2 ? 'Mid' : 'Outer'} ring</span>
      </div>

      {/* Detail text */}
      <div style={{
        background: 'rgba(0,0,0,0.025)', borderRadius: 10,
        padding: '15px 16px', border: `1px solid ${col}20`,
      }}>
        <div style={{ color: '#2A5048', fontSize: 12, lineHeight: 1.8 }}>{entity.detail}</div>
      </div>

      {/* Connected patterns */}
      {related.length > 0 && (
        <div>
          <div style={{ color: P.dim, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 11 }}>
            Connected Knowledge Links
          </div>
          {related.map(p => (
            <div key={p.id} style={{
              background: 'rgba(184,106,8,0.05)', border: '1px solid rgba(184,106,8,0.14)',
              borderRadius: 9, padding: '12px 14px', marginBottom: 9,
            }}>
              <div style={{ color: P.amber, fontSize: 12, fontWeight: 600, marginBottom: 7, lineHeight: 1.35 }}>{p.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: P.dim, fontSize: 10 }}>{p.occurrences} occurrences</span>
                <span style={{ color: P.dim, fontSize: 10 }}>{Math.round(p.confidence * 100)}% confidence</span>
              </div>
              {p.action && <div style={{ color: P.cyan, fontSize: 11, fontWeight: 500 }}>→ {p.action}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Breeze knows */}
      {insights.length > 0 && (
        <div style={{ background: 'rgba(0,120,100,0.05)', border: `1px solid rgba(0,120,100,0.14)`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: P.cyan, marginBottom: 10, opacity: 0.85 }}>
            Research Context
          </div>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, marginBottom: i < insights.length - 1 ? 10 : 0 }}>
              <span style={{ color: P.cyan, fontSize: 10, marginTop: 2, flexShrink: 0, opacity: 0.7 }}>◆</span>
              <div style={{ color: '#2A5048', fontSize: 12, lineHeight: 1.7 }}>{ins}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
