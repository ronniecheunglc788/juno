import { useState, useMemo } from 'react';
import BoardShell from '../BoardShell';
import ForceGraph from '../ForceGraph';
import NodeDetail from '../NodeDetail';

// ── Premed theme: cellular / microscope ──────────────────────────
const THEME = {
  bg:        '#EFFDF5',
  glow:      'rgba(5,150,105,0.06)',
  label:     'rgba(5,30,15,0.48)',
  nodeShape: 'circle',
  edgeStyle: 'organic',
  color: (type) => {
    switch (type) {
      case 'center': return '#059669';
      case 'app':    return '#DC2626';
      case 'res':    return '#2563EB';
      case 'acad':   return '#7C3AED';
      case 'other':  return '#94A3B8';
      case 'event':  return '#0891B2';
      case 'note':   return '#94A3B8';
      default:       return '#CBD5E1';
    }
  },
  drawBackground: (ctx, W, H) => {
    const cx = W / 2, cy = H / 2;
    const maxR = Math.sqrt(W * W + H * H) * 0.8;
    for (let r = 80; r < maxR; r += 90) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(5,150,105,${0.05 - (r/maxR)*0.04})`;
      ctx.lineWidth = 0.5; ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(5,150,105,0.04)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  },
};

const APP_KW  = ['application','amcas','mcat','interview','acceptance','waitlist','hospital','shadowing','clinical'];
const RES_KW  = ['lab','research','investigator','poster','abstract','protocol','irb','experiment'];
const ACAD_KW = ['professor','lecture','class','exam','grade','assignment','syllabus','office hours','course'];

function catOf(subject) {
  const s = (subject || '').toLowerCase();
  if (APP_KW.some(k  => s.includes(k))) return 'app';
  if (RES_KW.some(k  => s.includes(k))) return 'res';
  if (ACAD_KW.some(k => s.includes(k))) return 'acad';
  return 'other';
}

const CLUSTER_A = { app: -Math.PI/2, res: Math.PI/6, acad: Math.PI*5/6, other: Math.PI };
// Importance by category: app & res most important for premed
const CAT_IMP   = { app: 0.85, res: 0.7, acad: 0.5, other: 0.25 };

export default function PremedBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected, setSelected] = useState(null);

  const { nodes, edges } = useMemo(() => {
    const firstName = data?.user?.name?.split(' ')[0] || 'you';
    const emails    = data?.emails   || [];
    const events    = (data?.calendar || []).slice(0, 6);
    const notes     = (data?.notion  || []).slice(0, 4);

    const ns = [{ id: 'center', type: 'center', label: firstName, size: 20 }];

    const catCount = { app: 0, res: 0, acad: 0, other: 0 };
    emails.slice(0, 16).forEach((em, i) => {
      const cat = catOf(em.subject);
      const ci  = catCount[cat]++;
      const base = CLUSTER_A[cat];
      const angle = base + (ci - 2.5) * 0.22;
      const catLabel = { app: 'Application', res: 'Research', acad: 'Academic', other: 'Email' }[cat];
      const baseImp = CAT_IMP[cat];
      const imp = em.isUnread ? Math.min(1, baseImp + 0.15) : baseImp * 0.85;
      ns.push({
        id: `em-${i}`, type: cat,
        label: em.from?.split(' ').slice(0,2).join(' ') || 'Email',
        size: em.isUnread ? 10 : 7,
        angle, dist: 275 + ci * 34, phase: i * 0.5,
        importance: imp,
        statusLabel: em.isUnread ? `Unread · ${catLabel}` : catLabel,
        rawData: em,
      });
    });

    events.forEach((ev, i) => {
      const angle = -Math.PI/6 + (i - events.length/2) * 0.24;
      const imp   = Math.max(0, 1 - i / events.length) * 0.55;
      ns.push({
        id: `ev-${i}`, type: 'event', label: ev.title, size: 7,
        angle, dist: 340 + i*26, phase: i*1.1,
        importance: imp,
        rawData: ev,
      });
    });

    notes.forEach((n, i) => {
      const angle = Math.PI*3/4 + (i - notes.length/2) * 0.28;
      ns.push({
        id: `note-${i}`, type: 'note', label: n.title, size: 6,
        angle, dist: 350 + i*20, phase: i*0.9,
        importance: 0.2,
        rawData: n,
      });
    });

    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i+1,
      strong: n.type === 'app' || n.type === 'res',
      rest: Math.round(310 - (n.importance ?? 0.3) * 200),
      k: 0.007,
    }));

    return { nodes: ns, edges: es };
  }, [data]);

  return (
    <BoardShell themeKey="premed" data={data} loading={loading}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
        <NodeDetail node={selected} accent="#059669" onClose={() => setSelected(null)} />
      </div>
    </BoardShell>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#EFFDF5', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(5,150,105,0.5)', marginBottom:10 }}>breeze</div>
        <div style={{ fontSize:12, color:'rgba(0,0,0,0.28)', fontWeight:300, letterSpacing:'0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
