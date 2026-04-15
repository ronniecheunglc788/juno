import { useState, useMemo } from 'react';
import BoardShell    from '../BoardShell';
import ForceGraph    from '../ForceGraph';
import NodeDetail    from '../NodeDetail';
import DraftCompose  from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Julie — Neon City ─────────────────────────────────────────────
// Dark navy sky. Procedural neon-lit skyline at bottom.
// Falling rain with mouse-parallax wind tilt.
// Wet street reflection via snapshot canvas.
// Nodes float like glowing signs above the city.

// Neon palette
const NP = [
  [255, 40, 130],   // hot pink
  [0,   240, 255],  // cyan
  [255, 184, 0],    // amber
  [157, 0,   255],  // purple
  [0,   255, 136],  // green
];
function nRgb(i) { return NP[i % NP.length]; }
function nRgba(i, a) { const [r,g,b] = nRgb(i); return `rgba(${r},${g},${b},${a})`; }
function nHex(i) { const [r,g,b] = nRgb(i); return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`; }

// ── Skyline generator ─────────────────────────────────────────────
function genSkyline(W, H) {
  const buildings = [];
  let bx = -8;
  while (bx < W + 20) {
    const bw = 24 + Math.floor(Math.random() * 68);
    const bh = 45 + Math.floor(Math.random() * Math.round(H * 0.31));
    const niIdx = Math.floor(Math.random() * NP.length);
    const hasOutline = Math.random() > 0.42;
    const outlinePhase = Math.random() * Math.PI * 2;
    const hasTower  = Math.random() > 0.72;  // antenna on top

    // Windows — positions relative to building top-left
    const windows = [];
    const wCols = Math.max(1, Math.floor((bw - 7) / 12));
    const wRows = Math.max(1, Math.floor((bh - 10) / 14));
    for (let wr = 0; wr < wRows; wr++) {
      for (let wc = 0; wc < wCols; wc++) {
        if (Math.random() > 0.28) {
          windows.push({
            rx: 4 + wc * 12,
            ry: 7 + wr * 14,
            w: 7, h: 9,
            niIdx: Math.floor(Math.random() * NP.length),
            lit: Math.random() > 0.22,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    buildings.push({ x: bx, w: bw, h: bh, niIdx, hasOutline, outlinePhase, hasTower, windows });
    bx += bw + 1 + Math.floor(Math.random() * 9);
  }
  return buildings;
}

const THEME = {
  bg:            '#080612',
  glow:          'rgba(255,40,130,0.06)',
  label:         'rgba(255,200,255,0.75)',
  labelFont:     '9px "DM Mono","Courier New",monospace',
  nodeShape:     'circle',
  nodeStyle:     'sphere',
  edgeStyle:     'bezier',
  edgeAlpha:     ['99', '55'],
  nodeShadowBlur: 24,
  color: (type) => {
    switch (type) {
      case 'center':    return '#FF2882';
      case 'project':   return '#00F0FF';
      case 'client':    return '#FFB800';
      case 'instagram': return '#FF2882';
      case 'event':     return '#9D00FF';
      case 'note':      return '#2A1040';
      default:          return '#1A0830';
    }
  },

  initBackground: (W, H) => {
    const buildings = genSkyline(W, H);

    // Rain drops
    const rain = Array.from({ length: 160 }, () => ({
      x:     Math.random() * (W + 60) - 30,
      y:     Math.random() * H,
      len:   5 + Math.random() * 14,
      speed: 3 + Math.random() * 5,
      alpha: 0.05 + Math.random() * 0.22,
    }));

    // Neon light puddles on street — static positions, dynamic glow
    const puddles = Array.from({ length: 6 }, (_, i) => ({
      x:     (i + 0.6) * W / 6 + (Math.random() - 0.5) * 60,
      niIdx: i % NP.length,
      phase: Math.random() * Math.PI * 2,
    }));

    return { buildings, rain, puddles };
  },

  drawBackground: (ctx, W, H, frame, memo, mouse) => {
    if (!memo) return;
    const streetY = H * 0.70;

    // Atmospheric fog gradient — heavier near the street
    const fog = ctx.createLinearGradient(0, 0, 0, streetY);
    fog.addColorStop(0,   'rgba(8,6,18,0)');
    fog.addColorStop(0.65,'rgba(16,8,28,0.10)');
    fog.addColorStop(1,   'rgba(24,10,38,0.22)');
    ctx.fillStyle = fog; ctx.fillRect(0, 0, W, streetY);

    // ── Buildings ──────────────────────────────────────────────────
    memo.buildings.forEach(b => {
      const by = streetY - b.h;

      // Building body — very dark, slightly varied
      ctx.fillStyle = `rgb(${6 + (b.x % 7)},${3 + (b.w % 5)},${15 + (b.h % 10)})`;
      ctx.fillRect(b.x, by, b.w, b.h);

      // Neon outline glow
      if (b.hasOutline) {
        const fl = 0.5 + Math.sin(frame * 0.038 + b.outlinePhase) * 0.5;
        const [r,g,bl] = nRgb(b.niIdx);
        ctx.shadowColor = nHex(b.niIdx);
        ctx.shadowBlur  = 10;
        ctx.strokeStyle = `rgba(${r},${g},${bl},${0.45 + fl * 0.45})`;
        ctx.lineWidth   = 1.0;
        ctx.globalAlpha = 0.65 + fl * 0.25;
        ctx.strokeRect(b.x + 0.5, by + 0.5, b.w - 1, b.h - 1);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }

      // Antenna
      if (b.hasTower) {
        const tx = b.x + b.w / 2;
        ctx.beginPath(); ctx.moveTo(tx, by); ctx.lineTo(tx, by - 12);
        ctx.strokeStyle = `rgba(160,120,200,0.35)`; ctx.lineWidth = 0.7; ctx.stroke();
        // Blinking red light
        const blink = Math.sin(frame * 0.045 + b.outlinePhase) > 0.6 ? 0.9 : 0.15;
        ctx.beginPath(); ctx.arc(tx, by - 13, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,60,60,${blink})`; ctx.fill();
      }

      // Lit windows
      b.windows.forEach(win => {
        if (!win.lit) return;
        const wby = by + win.ry;
        // Occasional flicker
        const fl = Math.sin(frame * 0.028 + win.phase);
        const alpha = fl > 0.94 ? 0.12 : 0.55 + fl * 0.22;
        const [r,g,bl] = nRgb(win.niIdx);
        ctx.fillStyle = `rgba(${r},${g},${bl},${alpha * 0.65})`;
        ctx.fillRect(b.x + win.rx, wby, win.w, win.h);
      });
    });

    // Street — dark solid band
    ctx.fillStyle = '#03010A';
    ctx.fillRect(0, streetY, W, H - streetY);

    // ── Rain ───────────────────────────────────────────────────────
    const windX = mouse ? (mouse.x / W - 0.5) * 2.2 : 0;
    memo.rain.forEach(drop => {
      drop.y += drop.speed;
      if (drop.y - drop.len > H) {
        drop.y = -drop.len;
        drop.x = Math.random() * (W + 80) - 40;
      }
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + windX, drop.y - drop.len);
      ctx.strokeStyle = `rgba(130,150,255,${drop.alpha})`;
      ctx.lineWidth = 0.45; ctx.stroke();
    });

    // Neon horizon line at street level
    const hline = ctx.createLinearGradient(0, streetY - 1, 0, streetY + 2);
    hline.addColorStop(0, 'rgba(255,40,130,0.0)');
    hline.addColorStop(0.5,'rgba(255,40,130,0.18)');
    hline.addColorStop(1, 'rgba(0,240,255,0.10)');
    ctx.fillStyle = hline; ctx.fillRect(0, streetY - 1, W, 3);
  },

  // Runs AFTER nodes — receives snapshot canvas for true reflection
  drawForeground: (ctx, W, H, frame, memo, mouse, snap) => {
    const streetY = H * 0.70;

    // ── Wet street reflection ──────────────────────────────────────
    // Use the snapshot (contains background + nodes) flipped below street
    if (snap) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, streetY, W, H - streetY);
      ctx.clip();
      // Flip snapshot around streetY
      ctx.globalAlpha = 0.22;
      ctx.translate(0, streetY * 2);
      ctx.scale(1, -1);
      // Draw only the top portion (0..streetY) of the snapshot, flipped to appear below
      ctx.drawImage(snap, 0, 0, snap.width, snap.height * 0.70,
                         0, 0, W, streetY);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ── Ripple distortion lines across pavement ────────────────────
    const rippleCount = 18;
    for (let i = 0; i < rippleCount; i++) {
      const ry    = streetY + (i / rippleCount) * (H - streetY) * 0.85;
      const wave  = Math.sin(frame * 0.032 + i * 0.95) * 2.5;
      const alpha = Math.max(0, 0.05 - i * 0.0022);
      ctx.beginPath();
      ctx.moveTo(0, ry + wave);
      ctx.lineTo(W, ry + wave);
      ctx.strokeStyle = `rgba(80,60,200,${alpha})`;
      ctx.lineWidth = 0.65; ctx.stroke();
    }

    // ── Neon puddle glows on wet surface ──────────────────────────
    if (memo?.puddles) {
      memo.puddles.forEach(p => {
        const pulse = Math.sin(frame * 0.022 + p.phase) * 0.5 + 0.5;
        const r = 55 + pulse * 30;
        const [nr,ng,nb] = nRgb(p.niIdx);
        const g = ctx.createRadialGradient(p.x, streetY + 10, 0, p.x, streetY + 10, r);
        g.addColorStop(0, `rgba(${nr},${ng},${nb},${0.10 + pulse * 0.07})`);
        g.addColorStop(1, `rgba(${nr},${ng},${nb},0)`);
        ctx.fillStyle = g; ctx.fillRect(p.x - r, streetY, r * 2, H - streetY);
      });
    }

    // Mouse-position neon smear — follows cursor on the street
    if (mouse) {
      const mx = mouse.x;
      const [mr,mg,mb] = NP[0]; // pink
      const sg = ctx.createRadialGradient(mx, streetY + 8, 0, mx, streetY + 8, 90);
      sg.addColorStop(0, `rgba(${mr},${mg},${mb},0.07)`);
      sg.addColorStop(1, `rgba(${mr},${mg},${mb},0)`);
      ctx.fillStyle = sg; ctx.fillRect(mx - 90, streetY, 180, H - streetY);
    }

    // ── Street fade ────────────────────────────────────────────────
    const fade = ctx.createLinearGradient(0, streetY, 0, H);
    fade.addColorStop(0,   'rgba(3,1,10,0.05)');
    fade.addColorStop(0.38,'rgba(3,1,10,0.52)');
    fade.addColorStop(1,   'rgba(3,1,10,0.92)');
    ctx.fillStyle = fade; ctx.fillRect(0, streetY, W, H - streetY);
  },
};

// ── Node helpers ──────────────────────────────────────────────────
const DRIVE_IGNORE = ['application/vnd.google-apps.folder'];

function urgencyScore(em) {
  const s = ((em.subject||'')+(em.snippet||'')).toLowerCase();
  let sc = em.isUnread ? 2 : 0;
  if (['urgent','asap','deadline','today'].some(k => s.includes(k))) sc += 4;
  if (['feedback','revision','review'].some(k => s.includes(k))) sc += 2;
  return sc;
}
function cleanFilename(name) {
  return name.replace(/\.(fig|pdf|pptx|docx|xlsx|json|png|jpg)$/i, '').replace(/_/g, ' ');
}
function subjectWords(subject, maxWords = 4) {
  const clean = (subject || '').replace(/^(Re:|Fwd:|FWD:|RE:|Fw:)\s*/i, '').trim();
  return clean.split(/\s+/).slice(0, maxWords).join(' ') || 'Email';
}
function dayHint(startRaw) {
  const diff = Math.floor((new Date(startRaw) - Date.now()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return new Date(startRaw).toLocaleDateString('en-US', { weekday: 'long' });
}
function clientLabel(em) { return subjectWords(em.subject, 4); }
function eventLabel(ev)  {
  return `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${dayHint(ev.startRaw)}`;
}

export default function CreativeBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const firstName = data?.user?.name?.split(' ')[0] || 'you';
    const emails    = [...(data?.emails || [])].sort((a, b) => urgencyScore(b) - urgencyScore(a));
    const drive     = (data?.drive || []).filter(f => !DRIVE_IGNORE.includes(f.mimeType)).slice(0, 10);
    const notion    = (data?.notion || []).slice(0, 4);
    const events    = (data?.calendar || []).slice(0, 6);
    const ig        = data?.instagram;

    const ns = [{ id: 'center', type: 'center', label: firstName, size: 20 }];

    drive.forEach((f, i) => {
      const angle = -Math.PI / 3.5 + (i / Math.max(drive.length-1, 1)) * (Math.PI * 0.7);
      const imp   = Math.max(0, 1 - i / drive.length) * 0.75 + 0.1;
      ns.push({
        id: `file-${i}`, type: 'project', shape: 'star',
        label: cleanFilename(f.name).slice(0, 18),
        size: Math.round(8 + imp * 3), angle, dist: 280 + i*30, phase: i*0.65,
        importance: imp,
        statusLabel: 'Drive',
        rawData: { ...f, source: 'Drive' },
      });
    });

    emails.slice(0, 15).forEach((em, i) => {
      const angle  = Math.PI + Math.PI/3 - (i / Math.max(emails.length-1, 1)) * (Math.PI * 0.6);
      const uScore = urgencyScore(em);
      const imp    = Math.min(1, 0.3 + uScore * 0.12);
      ns.push({
        id: `em-${i}`, type: 'client', shape: 'diamond',
        label: clientLabel(em),
        size: em.isUnread ? 10 : 7,
        angle, dist: 275 + i*25, phase: i*0.8,
        importance: imp,
        statusLabel: em.isUnread ? 'Needs reply' : null,
        rawData: em,
      });
    });

    if (ig) {
      const imp = ig.followers > 5000 ? 0.8 : ig.followers > 1000 ? 0.6 : 0.4;
      ns.push({
        id: 'ig', type: 'instagram', shape: 'circle',
        label: `${(ig.followers / 1000).toFixed(1)}k followers`,
        size: 14, angle: -Math.PI + Math.PI/8, dist: 220, phase: 0.4,
        importance: imp,
        statusLabel: `${ig.posts} posts`,
        rawData: ig,
      });
    }

    events.forEach((ev, i) => {
      const angle = Math.PI / 2.5 + (i - events.length/2) * 0.25;
      const imp   = Math.max(0.3, 1 - i / events.length) * 0.5;
      ns.push({
        id: `ev-${i}`, type: 'event', label: eventLabel(ev), size: 7,
        angle, dist: 310 + i*22, phase: i*1.1,
        importance: imp,
        rawData: ev,
      });
    });

    notion.forEach((n, i) => {
      const angle = -Math.PI * 0.6 + (i - notion.length/2) * 0.28;
      ns.push({
        id: `note-${i}`, type: 'note', label: n.title, size: 6,
        angle, dist: 330 + i*18, phase: i*0.9,
        importance: 0.2,
        rawData: n,
      });
    });

    return ns;
  }, [data]);

  const { scores: aiScores, labels: aiLabels } = useNodeScores(baseNodes, data?.user?.archetype);

  const { nodes, edges } = useMemo(() => {
    const hasAi = Object.keys(aiScores).length > 0;
    const ns = baseNodes
      .map(n => ({
        ...n,
        ...(aiScores[n.id] != null ? { importance: aiScores[n.id] } : {}),
        ...(aiLabels[n.id]          ? { label:      aiLabels[n.id]  } : {}),
      }))
      .filter(n => n.type === 'center' || !hasAi || (n.importance ?? 0) >= 0.35);
    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i+1,
      strong: n.type === 'project' || n.type === 'client',
      rest: Math.round(290 - (n.importance ?? 0.3) * 190),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="creative" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#FF2882" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#FF2882" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#080612', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,40,130,0.38)', marginBottom: 10 }}>juno</div>
        <div style={{ fontSize: 11, color: 'rgba(0,240,255,0.28)', letterSpacing: '1px' }}>loading…</div>
      </div>
    </div>
  );
}
