import { useState, useMemo } from 'react';
import BoardShell   from '../BoardShell';
import ForceGraph   from '../ForceGraph';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Root theme: clinical precision, graph-paper grid ──────────────
// Every deadline visible. Nothing gets missed.
const THEME = {
  bg:        '#EFF6FF',
  glow:      'rgba(29,78,216,0.05)',
  label:     'rgba(10,20,60,0.50)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'hex',
  edgeStyle: 'circuit',
  color: (type) => {
    switch (type) {
      case 'center':   return '#1D4ED8';
      case 'deadline': return '#DC2626';
      case 'app':      return '#B91C1C';
      case 'research': return '#2563EB';
      case 'academic': return '#6D28D9';
      case 'note':     return '#94A3B8';
      case 'other':    return '#CBD5E1';
      default:         return '#BFDBFE';
    }
  },
  drawBackground: (ctx, W, H) => {
    // Fine graph-paper grid
    ctx.strokeStyle = 'rgba(29,78,216,0.04)'; ctx.lineWidth = 0.4;
    for (let x = 30; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 30; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // Major gridlines
    ctx.strokeStyle = 'rgba(29,78,216,0.08)'; ctx.lineWidth = 0.55;
    for (let x = 150; x < W; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 150; y < H; y += 150) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  },
};

const APP_KW  = ['amcas','mcat','interview','acceptance','waitlist','hospital','shadowing','clinical','application','medicine','medical school'];
const RES_KW  = ['lab','research','investigator','protocol','irb','experiment','poster','abstract'];
const ACAD_KW = ['professor','lecture','class','exam','grade','assignment','syllabus','office hours','course','biochem','organic'];

function catOf(subject) {
  const s = (subject || '').toLowerCase();
  if (APP_KW.some(k  => s.includes(k))) return 'app';
  if (RES_KW.some(k  => s.includes(k))) return 'research';
  if (ACAD_KW.some(k => s.includes(k))) return 'academic';
  return 'other';
}
function urgencyDays(startRaw) {
  return Math.floor((new Date(startRaw) - Date.now()) / 86400000);
}
function subjectWords(s, n = 4) {
  return (s || '').replace(/^(Re:|Fwd:|RE:|Fw:)\s*/i, '').trim().split(/\s+/).slice(0, n).join(' ') || 'Email';
}
function deadlineLabel(ev) {
  const d = urgencyDays(ev.startRaw);
  const tag = d === 0 ? 'today' : d === 1 ? 'tmrw' : `${d}d`;
  return `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${tag}`;
}

// Cluster angles: app=top, research=right, academic=bottom-left
const CLUSTER = { app: -Math.PI * 0.5, research: Math.PI * 0.15, academic: Math.PI * 0.75, other: Math.PI };
const CAT_IMP = { app: 0.88, research: 0.72, academic: 0.55, other: 0.25 };

export default function RootBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const name   = data?.user?.name?.split(' ')[0] || 'you';
    const emails = data?.emails   || [];
    const events = (data?.calendar || []).slice(0, 10);
    const notes  = (data?.notion  || []).slice(0, 7);

    const ns = [{ id: 'center', type: 'center', label: name, size: 20 }];

    // Emails categorized by clinical category
    const catCount = { app: 0, research: 0, academic: 0, other: 0 };
    emails.slice(0, 30).forEach((em, i) => {
      const cat = catOf(em.subject);
      const ci  = catCount[cat]++;
      const base  = CLUSTER[cat];
      const angle = base + (ci - 2) * 0.24;
      const imp   = em.isUnread ? Math.min(1, CAT_IMP[cat] + 0.12) : CAT_IMP[cat] * 0.82;
      const catLabel = { app: 'Application', research: 'Research', academic: 'Academic', other: 'Email' }[cat];
      ns.push({
        id: `em-${i}`, type: cat,
        label: subjectWords(em.subject, 4),
        size: em.isUnread ? 10 : 7,
        angle, dist: 265 + ci * 36, phase: i * 0.55,
        importance: imp,
        statusLabel: em.isUnread ? `Unread · ${catLabel}` : catLabel,
        rawData: em,
      });
    });

    // Calendar deadlines — sorted by urgency, positioned upper-right
    const sorted = [...events].sort((a, b) =>
      new Date(a.startRaw).getTime() - new Date(b.startRaw).getTime()
    );
    sorted.forEach((ev, i) => {
      const d   = urgencyDays(ev.startRaw);
      const imp = d <= 0 ? 1.0 : d <= 2 ? 0.9 : d <= 7 ? 0.72 : d <= 14 ? 0.52 : 0.35;
      const angle = -Math.PI * 0.2 + (i - sorted.length / 2) * 0.22;
      ns.push({
        id: `ev-${i}`, type: 'deadline', shape: 'diamond',
        label: deadlineLabel(ev),
        size: Math.round(6 + imp * 5),
        angle, dist: 290 + i * 22, phase: i * 1.2,
        importance: imp,
        statusLabel: d <= 0 ? 'TODAY' : d === 1 ? 'Tomorrow' : `${d} days`,
        rawData: ev,
      });
    });

    // Notion notes — lower-right, quieter
    notes.forEach((n, i) => {
      const angle = Math.PI * 0.45 + (i - notes.length / 2) * 0.25;
      ns.push({
        id: `note-${i}`, type: 'note',
        label: n.title,
        size: 6,
        angle, dist: 355 + i * 18, phase: i * 0.9,
        importance: 0.38,
        statusLabel: 'Notion',
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
        ...(aiLabels[n.id]         ? { label:      aiLabels[n.id]  } : {}),
      }))
      .filter(n => n.type === 'center' || !hasAi || (n.importance ?? 0) >= 0.35);
    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i + 1,
      strong: n.type === 'app' || n.type === 'deadline',
      rest: Math.round(295 - (n.importance ?? 0.3) * 185),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="root" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#1D4ED8" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#1D4ED8" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(29,78,216,0.45)', marginBottom: 10 }}>breeze</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.28)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
