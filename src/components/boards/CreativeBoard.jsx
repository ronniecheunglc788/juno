import { useState, useMemo } from 'react';
import BoardShell from '../BoardShell';
import ForceGraph from '../ForceGraph';
import NodeDetail from '../NodeDetail';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Creative theme: stars, organic curves, particle field ─────────
const THEME = {
  bg:        '#F5F0FF',
  glow:      'rgba(124,58,237,0.06)',
  label:     'rgba(30,10,50,0.48)',
  nodeShape: 'circle',
  edgeStyle: 'bezier',
  color: (type) => {
    switch (type) {
      case 'center':    return '#7C3AED';
      case 'project':   return '#4F46E5';
      case 'client':    return '#BE185D';
      case 'instagram': return '#D97706';
      case 'event':     return '#0891B2';
      case 'note':      return '#94A3B8';
      default:          return '#C4B5FD';
    }
  },
  initBackground: (W, H) => ({
    dots: Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 0.6,
      a: Math.random() * 0.4 + 0.05,
    })),
  }),
  drawBackground: (ctx, W, H, frame, memo) => {
    if (!memo) return;
    memo.dots.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,58,237,${s.a})`;
      ctx.fill();
    });
  },
};

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
function clientLabel(em) {
  const subj = (em.subject || '').replace(/^(Re:|Fwd:|RE:|FWD:)\s*/i, '').trim();
  return subj.slice(0, 17) || em.from?.split(' ')[0] || 'Client';
}
function eventLabel(ev) {
  const d    = new Date(ev.startRaw);
  const diff = Math.floor((d - Date.now()) / 86400000);
  const when = diff === 0 ? 'today' : diff === 1 ? 'tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${ev.title.slice(0, 10)} · ${when}`;
}

export default function CreativeBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected, setSelected] = useState(null);

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
        size: Math.round(8 + imp * 3), angle, dist: 300 + i*32, phase: i*0.65,
        importance: imp,
        statusLabel: 'Drive',
        rawData: { ...f, source: 'Drive' },
      });
    });

    emails.slice(0, 15).forEach((em, i) => {
      const angle = Math.PI + Math.PI/3 - (i / Math.max(emails.length-1, 1)) * (Math.PI * 0.6);
      const uScore = urgencyScore(em);
      const imp   = Math.min(1, 0.3 + uScore * 0.12);
      ns.push({
        id: `em-${i}`, type: 'client', shape: 'diamond',
        label: clientLabel(em),
        size: em.isUnread ? 10 : 7,
        angle, dist: 295 + i*26, phase: i*0.8,
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
        size: 14, angle: -Math.PI + Math.PI/8, dist: 240, phase: 0.4,
        importance: imp,
        statusLabel: `${ig.posts} posts`,
        rawData: ig,
      });
    }

    events.forEach((ev, i) => {
      const angle = Math.PI / 2.5 + (i - events.length/2) * 0.25;
      const imp   = Math.max(0, 1 - i / events.length) * 0.5;
      ns.push({
        id: `ev-${i}`, type: 'event', label: eventLabel(ev), size: 7,
        angle, dist: 335 + i*24, phase: i*1.1,
        importance: imp,
        rawData: ev,
      });
    });

    notion.forEach((n, i) => {
      const angle = -Math.PI * 0.6 + (i - notion.length/2) * 0.28;
      ns.push({
        id: `note-${i}`, type: 'note', label: n.title, size: 6,
        angle, dist: 350 + i*20, phase: i*0.9,
        importance: 0.2,
        rawData: n,
      });
    });

    return ns;
  }, [data]);

  const aiScores = useNodeScores(baseNodes, data?.user?.archetype);

  const { nodes, edges } = useMemo(() => {
    const hasAi = Object.keys(aiScores).length > 0;
    const ns = baseNodes
      .map(n => aiScores[n.id] != null ? { ...n, importance: aiScores[n.id] } : n)
      .filter(n => n.type === 'center' || !hasAi || (n.importance ?? 0) >= 0.35);
    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i+1,
      strong: n.type === 'project' || n.type === 'client',
      rest: Math.round(310 - (n.importance ?? 0.3) * 200),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <BoardShell themeKey="creative" data={data} loading={loading}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
        <NodeDetail node={selected} accent="#7C3AED" onClose={() => setSelected(null)} />
      </div>
    </BoardShell>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#F5F0FF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(124,58,237,0.5)', marginBottom:10 }}>breeze</div>
        <div style={{ fontSize:12, color:'rgba(0,0,0,0.28)', fontWeight:300, letterSpacing:'0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
