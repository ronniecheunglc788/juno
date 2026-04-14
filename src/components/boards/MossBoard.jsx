import { useState, useMemo } from 'react';
import BoardShell   from '../BoardShell';
import ForceGraph   from '../ForceGraph';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Moss theme: concentric rings, data-rich, contemplative ────────
// Curious about themselves. Will spend time in this graph for fun.
const THEME = {
  bg:        '#F0FDFA',
  glow:      'rgba(15,118,110,0.07)',
  label:     'rgba(5,35,30,0.50)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'circle',
  edgeStyle: 'organic',
  color: (type) => {
    switch (type) {
      case 'center':  return '#0F766E';
      case 'journal': return '#0D9488';
      case 'habit':   return '#059669';
      case 'data':    return '#2563EB';
      case 'insight': return '#7C3AED';
      case 'event':   return '#64748B';
      case 'code':    return '#1D4ED8';
      default:        return '#99F6E4';
    }
  },
  drawBackground: (ctx, W, H) => {
    const cx = W / 2, cy = H / 2;
    const maxR = Math.sqrt(W * W + H * H) * 0.72;
    // Concentric rings — pond ripple
    for (let r = 65; r < maxR; r += 88) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(15,118,110,${0.065 - (r / maxR) * 0.058})`;
      ctx.lineWidth = 0.55; ctx.stroke();
    }
    // Subtle cross-hatch
    ctx.strokeStyle = 'rgba(15,118,110,0.022)'; ctx.lineWidth = 0.45;
    for (let x = 60; x < W; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 60; y < H; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  },
};

const INSIGHT_KW = ['sleep','hrv','habit','streak','meditation','wellness','focus','cortisol','recovery',
  'tracking','data','pattern','reflection','review','well-being'];
const DATA_MIME  = ['text/csv','application/vnd.openxmlformats','application/octet-stream'];

function isInsightEmail(em) {
  const txt = ((em.subject || '') + (em.snippet || '')).toLowerCase();
  return INSIGHT_KW.some(k => txt.includes(k));
}
function cleanFilename(name) {
  return name.replace(/\.(csv|xlsx|docx|ipynb|pdf|json)$/i, '').replace(/_/g, ' ');
}
function journalOrHabit(title) {
  const t = (title || '').toLowerCase();
  return ['habit','streak','log','tracker','routine','review','journal','reflection','gratitude','sleep','intention',
    'weekly','quarterly','energy','mood','morning'].some(k => t.includes(k));
}
function dayHint(raw) {
  const d = Math.floor((new Date(raw) - Date.now()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return new Date(raw).toLocaleDateString('en-US', { weekday: 'short' });
}

export default function MossBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const name    = data?.user?.name?.split(' ')[0] || 'you';
    const pages   = (data?.notion  || []).slice(0, 10);
    const drive   = (data?.drive   || []).filter(f => DATA_MIME.some(m => (f.mimeType || '').startsWith(m))).slice(0, 5);
    const emails  = (data?.emails  || []).filter(isInsightEmail).slice(0, 10);
    const events  = (data?.calendar || []).slice(0, 8);
    const repos   = (data?.github  || []).slice(0, 2);

    const ns = [{ id: 'center', type: 'center', label: name, size: 20 }];

    // Notion pages — inner ring, primary data (journals & habits close, thesis further)
    pages.forEach((p, i) => {
      const isJH   = journalOrHabit(p.title);
      const angle  = (i / pages.length) * Math.PI * 2 - Math.PI * 0.6;
      const imp    = isJH ? 0.78 : 0.52;
      ns.push({
        id: `page-${i}`, type: isJH ? 'habit' : 'journal',
        label: p.title,
        size: isJH ? 8 : 7,
        angle, dist: isJH ? 255 + i * 18 : 295 + i * 18, phase: i * 0.6,
        importance: imp,
        statusLabel: 'Notion',
        rawData: p,
      });
    });

    // Drive data files — upper right
    drive.forEach((f, i) => {
      const angle = -Math.PI * 0.3 + (i - drive.length / 2) * 0.32;
      const imp   = Math.max(0.5, 0.8 - i * 0.06);
      ns.push({
        id: `data-${i}`, type: 'data', shape: 'star',
        label: cleanFilename(f.name).slice(0, 18),
        size: 8, angle, dist: 310 + i * 28, phase: i * 0.9,
        importance: imp,
        statusLabel: 'Drive',
        rawData: { ...f, source: 'Drive' },
      });
    });

    // Insight emails — lower arc (signals from the outside)
    emails.forEach((em, i) => {
      const angle = Math.PI * 0.35 + (i - emails.length / 2) * 0.24;
      const imp   = em.isUnread ? 0.72 : 0.48;
      ns.push({
        id: `em-${i}`, type: 'insight', shape: 'diamond',
        label: (em.subject || '').split(/\s+/).slice(0, 4).join(' '),
        size: em.isUnread ? 9 : 7,
        angle, dist: 320 + i * 24, phase: i * 0.8,
        importance: imp,
        statusLabel: em.isUnread ? 'Unread' : null,
        rawData: em,
      });
    });

    // Calendar — upper left, muted (routines & sessions)
    events.forEach((ev, i) => {
      const angle = -Math.PI * 0.75 + (i - events.length / 2) * 0.26;
      const imp   = Math.max(0.38, 0.62 - i * 0.05);
      ns.push({
        id: `ev-${i}`, type: 'event',
        label: `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${dayHint(ev.startRaw)}`,
        size: 6, angle, dist: 340 + i * 22, phase: i * 1.1,
        importance: imp,
        rawData: ev,
      });
    });

    // Code repos — far right, small but relevant
    repos.forEach((r, i) => {
      const angle = 0.3 + i * 0.35;
      ns.push({
        id: `repo-${i}`, type: 'code',
        label: r.name,
        size: 7, angle, dist: 360 + i * 20, phase: i * 0.7,
        importance: 0.55,
        statusLabel: r.language,
        rawData: r,
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
        ...(aiLabels[n.id]         ? { label:      aiLabels[n.id]  } : {}),
      }))
      .filter(n => n.type === 'center' || !hasAi || (n.importance ?? 0) >= 0.35);
    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i + 1,
      strong: n.type === 'habit' || n.type === 'data',
      rest: Math.round(300 - (n.importance ?? 0.3) * 185),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="moss" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#0F766E" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#0F766E" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(15,118,110,0.5)', marginBottom: 10 }}>breeze</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.28)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
