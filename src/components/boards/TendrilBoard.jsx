import { useState, useMemo } from 'react';
import BoardShell   from '../BoardShell';
import ForceGraph   from '../ForceGraph';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Tendril theme: organic growth, spiral arms, builder energy ─────
const THEME = {
  bg:        '#F0FDF4',
  glow:      'rgba(5,150,105,0.07)',
  label:     'rgba(5,40,15,0.50)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'circle',
  edgeStyle: 'bezier',
  color: (type) => {
    switch (type) {
      case 'center':        return '#059669';
      case 'project':       return '#10B981';
      case 'project-stale': return '#86EFAC';
      case 'idea':          return '#6EE7B7';
      case 'collab':        return '#F59E0B';
      case 'event':         return '#0EA5E9';
      default:              return '#A7F3D0';
    }
  },
  initBackground: (W, H) => {
    const spirals = [];
    for (let arm = 0; arm < 3; arm++) {
      const pts = [];
      for (let t = 0.2; t < Math.PI * 5.5; t += 0.12) {
        const r = t * 22;
        const a = t + arm * (Math.PI * 2 / 3);
        pts.push({ x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r });
      }
      spirals.push(pts);
    }
    return { spirals };
  },
  drawBackground: (ctx, W, H, _frame, memo) => {
    if (!memo) return;
    ctx.lineWidth = 0.9;
    memo.spirals.forEach((pts, ai) => {
      ctx.strokeStyle = `rgba(5,150,105,${0.055 - ai * 0.012})`;
      ctx.beginPath();
      pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    });
  },
};

function staleDays(d) {
  if (!d) return 999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function isCollab(em) {
  const s = ((em.subject || '') + (em.from || '') + (em.fromEmail || '')).toLowerCase();
  return ['figma','linear','notion','vercel','github','stripe','openai','anthropic',
    'recruiter','recruiting','internship','offer','interview','opportunity'].some(k => s.includes(k));
}
function subjectWords(s, n = 4) {
  return (s || '').replace(/^(Re:|Fwd:|RE:|Fw:)\s*/i, '').trim().split(/\s+/).slice(0, n).join(' ') || 'Email';
}
function dayHint(raw) {
  const d = Math.floor((new Date(raw) - Date.now()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return new Date(raw).toLocaleDateString('en-US', { weekday: 'short' });
}

export default function TendrilBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const name    = data?.user?.name?.split(' ')[0] || 'you';
    const repos   = (data?.github  || []).slice(0, 9);
    const ideas   = (data?.notion  || []).slice(0, 5);
    const collabs = (data?.emails  || []).filter(isCollab).slice(0, 12);
    const events  = (data?.calendar || []).slice(0, 7);

    const ns = [{ id: 'center', type: 'center', label: name, size: 20 }];

    // Repos — upper-left arc (builder's workspace)
    repos.forEach((r, i) => {
      const angle = -Math.PI * 0.85 + (i / Math.max(repos.length - 1, 1)) * (Math.PI * 0.58);
      const days  = staleDays(r.lastCommit);
      const stale = days > 30;
      const imp   = stale ? 0.18 : Math.max(0.4, 1 - days / 30);
      ns.push({
        id: `repo-${i}`, type: stale ? 'project-stale' : 'project',
        label: r.name,
        size: stale ? 6 : Math.round(7 + imp * 4),
        angle, dist: 280 + i * 26, phase: i * 0.65,
        importance: imp,
        statusLabel: stale ? 'Stale' : days < 3 ? 'Active' : `${days}d ago`,
        rawData: r,
      });
    });

    // Collab emails — right arc (opportunities)
    collabs.forEach((em, i) => {
      const angle = 0.1 + (i / Math.max(collabs.length - 1, 1)) * (Math.PI * 0.55);
      const imp   = em.isUnread ? 0.82 : 0.45;
      ns.push({
        id: `collab-${i}`, type: 'collab', shape: 'diamond',
        label: subjectWords(em.subject, 4),
        size: em.isUnread ? 10 : 7,
        angle, dist: 295 + i * 28, phase: i * 0.9,
        importance: imp,
        statusLabel: em.isUnread ? 'Unread' : null,
        rawData: em,
      });
    });

    // Notion ideas — lower arc (the idea bank)
    ideas.forEach((n, i) => {
      const angle = Math.PI * 0.35 + (i / Math.max(ideas.length - 1, 1)) * (Math.PI * 0.55);
      const imp   = Math.max(0.4, 0.7 - i * 0.06);
      ns.push({
        id: `idea-${i}`, type: 'idea',
        label: n.title,
        size: 7,
        angle, dist: 315 + i * 22, phase: i * 1.1,
        importance: imp,
        statusLabel: 'Notion',
        rawData: n,
      });
    });

    // Calendar events — upper-right (sessions, demos, meetings)
    events.forEach((ev, i) => {
      const angle = -Math.PI * 0.2 + (i - events.length / 2) * 0.28;
      const imp   = Math.max(0.38, 0.75 - i * 0.07);
      ns.push({
        id: `ev-${i}`, type: 'event',
        label: `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${dayHint(ev.startRaw)}`,
        size: 7,
        angle, dist: 330 + i * 24, phase: i * 1.3,
        importance: imp,
        rawData: ev,
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
      strong: n.type === 'project' || n.type === 'collab',
      rest: Math.round(300 - (n.importance ?? 0.3) * 190),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="tendril" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#059669" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#059669" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(5,150,105,0.45)', marginBottom: 10 }}>breeze</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.28)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
