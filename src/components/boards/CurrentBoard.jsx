import { useState, useMemo } from 'react';
import BoardShell   from '../BoardShell';
import ForceGraph   from '../ForceGraph';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Current theme: urgency triage, flowing water lines ───────────
// Said yes to everything. Juno's job: cut through the noise.
const THEME = {
  bg:        '#FFF5F5',
  glow:      'rgba(220,38,38,0.06)',
  label:     'rgba(40,5,5,0.50)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'circle',
  edgeStyle: 'straight',
  color: (type) => {
    switch (type) {
      case 'center':   return '#DC2626';
      case 'critical': return '#DC2626';
      case 'high':     return '#EA580C';
      case 'medium':   return '#D97706';
      case 'low':      return '#94A3B8';
      case 'stale':    return '#CBD5E1';
      default:         return '#FECACA';
    }
  },
  initBackground: (W, H) => {
    const lines = [];
    for (let y = 15; y < H; y += 26) {
      const pts = [];
      for (let x = 0; x <= W + 40; x += 45) {
        pts.push({ x, yBase: y + Math.sin(x * 0.025) * 5 + Math.sin(x * 0.065) * 2.5 });
      }
      lines.push(pts);
    }
    return { lines };
  },
  drawBackground: (ctx, W, H, frame, memo) => {
    if (!memo) return;
    ctx.lineWidth = 0.5;
    memo.lines.forEach((pts, li) => {
      const drift = Math.sin(frame * 0.011 + li * 0.45) * 2.8;
      ctx.strokeStyle = `rgba(220,38,38,${0.038 - (li % 4) * 0.006})`;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const y = p.yBase + drift;
        i === 0 ? ctx.moveTo(p.x, y) : ctx.lineTo(p.x, y);
      });
      ctx.stroke();
    });
  },
};

function emailUrgency(em) {
  let s = 0;
  if (em.isUnread) s += 3;
  const txt = ((em.subject || '') + (em.snippet || '')).toLowerCase();
  if (['urgent','asap','now','required','action','critical','emergency'].some(k => txt.includes(k))) s += 6;
  if (['today','deadline','due','overdue','missed'].some(k => txt.includes(k))) s += 4;
  if (['tomorrow','this week','soon','please','reminder'].some(k => txt.includes(k))) s += 2;
  return s;
}
function calUrgency(ev) {
  const d = Math.floor((new Date(ev.startRaw) - Date.now()) / 86400000);
  if (d <= 0) return 12;
  if (d <= 1) return 9;
  if (d <= 3) return 6;
  if (d <= 7) return 4;
  return 1;
}
function urgencyTier(score) {
  if (score >= 9)  return { type: 'critical', imp: 0.95 };
  if (score >= 6)  return { type: 'high',     imp: 0.78 };
  if (score >= 3)  return { type: 'medium',   imp: 0.58 };
  return                  { type: 'low',       imp: 0.38 };
}
function subjectWords(s, n = 4) {
  return (s || '').replace(/^(Re:|Fwd:|RE:|Fw:)\s*/i, '').trim().split(/\s+/).slice(0, n).join(' ') || 'Email';
}
function calLabel(ev) {
  const d = Math.floor((new Date(ev.startRaw) - Date.now()) / 86400000);
  const tag = d <= 0 ? 'TODAY' : d === 1 ? 'tmrw' : `${d}d`;
  return `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${tag}`;
}

export default function CurrentBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const name   = data?.user?.name?.split(' ')[0] || 'you';
    const emails = (data?.emails   || []).slice(0, 20);
    const events = (data?.calendar || []).slice(0, 14);
    const repos  = (data?.github   || []).filter(r => r.isStale).slice(0, 4);

    // Build urgency-scored items pool
    const items = [];
    emails.forEach(em => {
      const score = emailUrgency(em);
      const { type, imp } = urgencyTier(score);
      items.push({ _kind: 'email', _score: score, _type: type, _imp: imp, ...em });
    });
    events.forEach(ev => {
      const score = calUrgency(ev);
      const { type, imp } = urgencyTier(score);
      items.push({ _kind: 'cal', _score: score, _type: type, _imp: imp, ...ev });
    });
    // Sort by urgency desc
    items.sort((a, b) => b._score - a._score);

    const ns = [{ id: 'center', type: 'center', label: name, size: 20 }];

    // Place items in a spiral-out pattern from most urgent to least
    items.slice(0, 28).forEach((item, i) => {
      // Use a Sunflower/Fibonacci-like angular spread for dense even coverage
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
      const angle = i * goldenAngle;
      const dist  = 200 + Math.sqrt(i) * 55;

      if (item._kind === 'email') {
        ns.push({
          id: `item-${i}`, type: item._type,
          label: subjectWords(item.subject, 4),
          size: Math.round(5 + item._imp * 6),
          angle, dist, phase: i * 0.45,
          importance: item._imp,
          statusLabel: item.isUnread ? 'Unread' : null,
          rawData: item,
        });
      } else {
        ns.push({
          id: `item-${i}`, type: item._type, shape: 'diamond',
          label: calLabel(item),
          size: Math.round(5 + item._imp * 7),
          angle, dist, phase: i * 0.45,
          importance: item._imp,
          statusLabel: item._type === 'critical' ? 'TODAY' : null,
          rawData: item,
        });
      }
    });

    // Stale repos — very outer, quietest
    repos.forEach((r, i) => {
      const angle = Math.PI * 1.4 + i * 0.4;
      ns.push({
        id: `repo-${i}`, type: 'stale',
        label: r.name,
        size: 5, angle, dist: 380 + i * 18, phase: i * 0.8,
        importance: 0.22,
        statusLabel: 'Stale',
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
      // For overextended board, keep a lower threshold so the density is visible
      .filter(n => n.type === 'center' || !hasAi || (n.importance ?? 0) >= 0.25);
    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i + 1,
      strong: n.type === 'critical' || n.type === 'high',
      rest: Math.round(310 - (n.importance ?? 0.3) * 200),
      k: 0.006,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="current" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#DC2626" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#DC2626" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(220,38,38,0.45)', marginBottom: 10 }}>breeze</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.28)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
