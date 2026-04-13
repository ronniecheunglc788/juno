import { useState, useMemo } from 'react';
import BoardShell from '../BoardShell';
import ForceGraph from '../ForceGraph';
import NodeDetail from '../NodeDetail';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Engineer theme: circuit board ────────────────────────────────
// Hexagon nodes, circuit-trace edges, grid background
const THEME = {
  bg:        '#EFF4FF',
  glow:      'rgba(37,99,235,0.06)',
  label:     'rgba(15,30,80,0.48)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'hex',
  edgeStyle: 'circuit',
  color: (type) => {
    switch (type) {
      case 'center':     return '#2563EB';
      case 'repo':       return '#16A34A';
      case 'repo-stale': return '#94A3B8';
      case 'recruit':    return '#D97706';
      case 'recruit-r':  return '#B8C4D8';
      case 'event':      return '#0891B2';
      case 'note':       return '#94A3B8';
      default:           return '#B8C4D8';
    }
  },
  initBackground: (W, H) => {
    const spacing = 42;
    const dots = [];
    for (let x = spacing / 2; x < W; x += spacing)
      for (let y = spacing / 2; y < H; y += spacing)
        dots.push({ x, y });
    return { spacing, dots };
  },
  drawBackground: (ctx, W, H, frame, memo) => {
    if (!memo) return;
    const { spacing, dots } = memo;
    ctx.strokeStyle = 'rgba(37,99,235,0.05)';
    ctx.lineWidth   = 0.5;
    for (let x = spacing / 2; x < W; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = spacing / 2; y < H; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(37,99,235,0.12)';
    dots.forEach(({ x, y }) => {
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
    });
  },
};

function staleDays(d) {
  if (!d) return 999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function isRecruit(em) {
  const s = ((em.subject||'')+(em.from||'')+(em.fromEmail||'')).toLowerCase();
  return ['google','meta','amazon','apple','microsoft','stripe','openai','anthropic','coinbase',
    'recruiter','recruiting','offer','internship','interview','new grad'].some(k => s.includes(k));
}

export default function CSBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected, setSelected] = useState(null);

  const baseNodes = useMemo(() => {
    const firstName = data?.user?.name?.split(' ')[0] || 'you';
    const repos     = (data?.github   || []).slice(0, 9);
    const recruits  = (data?.emails   || []).filter(isRecruit).slice(0, 8);
    const events    = (data?.calendar || []).slice(0, 5);
    const notes     = (data?.notion   || []).slice(0, 5);

    const ns = [{ id: 'center', type: 'center', label: firstName, size: 20 }];

    repos.forEach((r, i) => {
      const angle = -Math.PI/2.8 + (i / Math.max(repos.length-1,1)) * (Math.PI*0.8);
      const days  = staleDays(r.lastCommit);
      const stale = days > 30;
      const imp   = stale ? 0.15 : Math.max(0, 1 - days / 30);
      ns.push({
        id: `repo-${i}`, type: stale ? 'repo-stale' : 'repo',
        label: r.name, size: stale ? 6 : Math.round(8 + imp * 4),
        angle, dist: 300 + i*28, phase: i*0.65,
        importance: imp,
        statusLabel: stale ? 'Stale' : days < 3 ? 'Active' : null,
        rawData: r,
      });
    });

    recruits.forEach((em, i) => {
      const angle = Math.PI - Math.PI/3 + (i / Math.max(recruits.length-1,1)) * (Math.PI*0.66);
      const imp   = em.isUnread ? 0.85 : 0.4;
      ns.push({
        id: `recruit-${i}`, type: em.isUnread ? 'recruit' : 'recruit-r',
        label: em.from?.split(' ').slice(0,2).join(' '),
        size: em.isUnread ? 10 : 7,
        angle, dist: 290 + i*26, phase: i*0.9,
        importance: imp,
        statusLabel: em.isUnread ? 'Unread' : null,
        rawData: em,
      });
    });

    events.forEach((ev, i) => {
      const angle = Math.PI/2 + (i - events.length/2) * 0.28;
      const imp   = Math.max(0, 1 - i / events.length) * 0.6;
      ns.push({
        id: `ev-${i}`, type: 'event', label: ev.title, size: 7,
        angle, dist: 330 + i*24, phase: i*1.1,
        importance: imp,
        rawData: ev,
      });
    });

    notes.forEach((n, i) => {
      const angle = -Math.PI/2 + (i - notes.length/2) * 0.3;
      ns.push({
        id: `note-${i}`, type: 'note', label: n.title, size: 6,
        angle, dist: 340 + i*20, phase: i*1.3,
        importance: 0.2,
        rawData: n,
      });
    });

    return ns;
  }, [data]);

  const aiScores = useNodeScores(baseNodes, data?.user?.archetype);

  const { nodes, edges } = useMemo(() => {
    const ns = baseNodes.map(n =>
      aiScores[n.id] != null ? { ...n, importance: aiScores[n.id] } : n
    );
    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i+1,
      strong: n.type === 'repo' || n.type === 'recruit',
      rest: Math.round(310 - (n.importance ?? 0.3) * 200),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <BoardShell themeKey="engineer" data={data} loading={loading}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
        <NodeDetail node={selected} accent="#2563EB" onClose={() => setSelected(null)} />
      </div>
    </BoardShell>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#EFF4FF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(37,99,235,0.45)', marginBottom:10 }}>breeze</div>
        <div style={{ fontSize:12, color:'rgba(0,0,0,0.28)', fontWeight:300, letterSpacing:'0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
