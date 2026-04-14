import { useState, useMemo } from 'react';
import BoardShell   from '../BoardShell';
import ForceGraph   from '../ForceGraph';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Seedling theme: minimal, welcoming, one spotlight moment ──────
// First-time user. One thing Juno noticed. That's enough.
const THEME = {
  bg:        '#FAF8FF',
  glow:      'rgba(124,58,237,0.05)',
  label:     'rgba(20,10,40,0.48)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'circle',
  edgeStyle: 'bezier',
  color: (type) => {
    switch (type) {
      case 'center':    return '#7C3AED';
      case 'spotlight': return '#059669';  // bright green — the "wow" moment
      case 'event':     return '#A78BFA';  // soft purple
      case 'email':     return '#C4B5FD';  // very muted
      default:          return '#DDD6FE';
    }
  },
  initBackground: (W, H) => ({
    dots: Array.from({ length: 28 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.8 + 0.4,
      phase: Math.random() * Math.PI * 2,
    })),
  }),
  drawBackground: (ctx, W, H, frame, memo) => {
    if (!memo) return;
    memo.dots.forEach(d => {
      const alpha = (Math.sin(frame * 0.014 + d.phase) * 0.5 + 0.5) * 0.13 + 0.02;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,58,237,${alpha})`;
      ctx.fill();
    });
  },
};

function dayHint(raw) {
  const d = Math.floor((new Date(raw) - Date.now()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

// Find the single most surprising / useful thing to spotlight
function findSpotlight(data) {
  const emails  = data?.emails   || [];
  const events  = data?.calendar || [];

  // Prioritize: financial deadlines, important notices
  const SPOTLIGHT_KW = ['financial aid','disbursement','deadline','due','important','action required',
    'scholarship','grant','registration','enroll','confirm'];

  for (const em of emails) {
    const txt = ((em.subject || '') + (em.snippet || '')).toLowerCase();
    if (SPOTLIGHT_KW.some(k => txt.includes(k))) {
      return {
        type:    'email',
        label:   (em.subject || '').split(/\s+/).slice(0, 5).join(' '),
        subject: em.subject,
        hint:    'Juno noticed this',
        rawData: em,
      };
    }
  }

  // Fallback: nearest upcoming deadline
  const upcoming = [...events].sort((a, b) => new Date(a.startRaw) - new Date(b.startRaw));
  if (upcoming.length) {
    const ev = upcoming[0];
    return {
      type:    'calendar',
      label:   ev.title,
      hint:    `coming up · ${dayHint(ev.startRaw)}`,
      rawData: ev,
    };
  }

  return null;
}

export default function SeedlingBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const name     = data?.user?.name?.split(' ')[0] || 'you';
    const events   = (data?.calendar || []).slice(0, 3);
    const emails   = (data?.emails   || []).slice(0, 2);
    const spotlight = findSpotlight(data);

    const ns = [{ id: 'center', type: 'center', label: name, size: 20 }];

    // The spotlight node — closest to center, most prominent
    if (spotlight) {
      ns.push({
        id: 'spotlight', type: 'spotlight',
        label: spotlight.label,
        size: 13,
        angle: -Math.PI * 0.3,
        dist: 190,
        phase: 0,
        importance: 1.0,
        statusLabel: spotlight.hint,
        rawData: spotlight.rawData,
      });
    }

    // Calendar events — spaced around, muted
    events.forEach((ev, i) => {
      const angle = Math.PI * 0.3 + i * (Math.PI * 0.55);
      ns.push({
        id: `ev-${i}`, type: 'event',
        label: `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${dayHint(ev.startRaw)}`,
        size: 7, angle, dist: 280 + i * 30, phase: i * 1.1,
        importance: 0.5,
        rawData: ev,
      });
    });

    // Emails — outer, very quiet
    emails.forEach((em, i) => {
      const angle = -Math.PI * 0.65 + i * 0.55;
      ns.push({
        id: `em-${i}`, type: 'email',
        label: (em.subject || '').split(/\s+/).slice(0, 4).join(' '),
        size: 6, angle, dist: 320 + i * 25, phase: i * 0.8,
        importance: 0.4,
        rawData: em,
      });
    });

    return ns;
  }, [data]);

  // No AI scoring for seedling — keep it simple and fast
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
      strong: n.type === 'spotlight',
      rest: Math.round(280 - (n.importance ?? 0.4) * 120),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="seedling" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#7C3AED" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#7C3AED" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#FAF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(124,58,237,0.45)', marginBottom: 10 }}>breeze</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.28)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
