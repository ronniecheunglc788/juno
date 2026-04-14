import { useState, useMemo } from 'react';
import BoardShell   from '../BoardShell';
import ForceGraph   from '../ForceGraph';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Firefly theme: warm amber glow, people-centric ────────────────
// Life organized around others. Contacts orbit at warmth-based distances.
const THEME = {
  bg:        '#FFFBEB',
  glow:      'rgba(217,119,6,0.07)',
  label:     'rgba(40,20,5,0.50)',
  labelFont: '10px "DM Sans","Inter",system-ui,sans-serif',
  nodeShape: 'circle',
  edgeStyle: 'bezier',
  color: (type) => {
    switch (type) {
      case 'center':        return '#D97706';
      case 'contact-warm':  return '#059669';
      case 'contact-mid':   return '#D97706';
      case 'contact-cold':  return '#CBD5E1';
      case 'event':         return '#7C3AED';
      case 'plan':          return '#0891B2';
      case 'instagram':     return '#EC4899';
      default:              return '#FDE68A';
    }
  },
  initBackground: (W, H) => ({
    flies: Array.from({ length: 65 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 2.4 + 0.7,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.022 + 0.008,
    })),
  }),
  drawBackground: (ctx, W, H, frame, memo) => {
    if (!memo) return;
    memo.flies.forEach(f => {
      const alpha = (Math.sin(frame * f.speed + f.phase) * 0.5 + 0.5) * 0.28 + 0.04;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,158,11,${alpha})`;
      ctx.fill();
    });
  },
};

function daysAgo(d) {
  if (!d) return 999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function dayHint(raw) {
  const d = Math.floor((new Date(raw) - Date.now()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return new Date(raw).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function buildContacts(emails) {
  const map = {};
  emails.forEach(em => {
    const key = em.fromEmail || em.from;
    if (!key) return;
    const lk = key.toLowerCase();
    if (lk.includes('noreply') || lk.includes('no-reply') || lk.includes('notification') || lk.includes('admin')) return;
    if (!map[key]) map[key] = { name: em.from, email: em.fromEmail, subject: em.subject, date: em.date, count: 0 };
    map[key].count++;
    // Keep most recent date
    if (!map[key].date || em.date > map[key].date) map[key].date = em.date;
  });
  return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 14);
}
function firstName(name) {
  return (name || '').split(' ')[0] || 'Contact';
}

export default function FireflyBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseNodes = useMemo(() => {
    const name     = data?.user?.name?.split(' ')[0] || 'you';
    const contacts = buildContacts(data?.emails || []);
    const events   = (data?.calendar || []).slice(0, 9);
    const plans    = (data?.notion   || []).slice(0, 4);
    const ig       = data?.instagram;

    const ns = [{ id: 'center', type: 'center', label: name, size: 20 }];

    // Contacts — full orbit, warmth-based distance
    contacts.forEach((c, i) => {
      const angle  = (i / contacts.length) * Math.PI * 2 - Math.PI / 2;
      const days   = daysAgo(c.date);
      const type   = days < 5 ? 'contact-warm' : days < 14 ? 'contact-mid' : 'contact-cold';
      const size   = days < 5 ? 11 : days < 14 ? 8 : 6;
      const imp    = days < 5 ? 0.9 : days < 14 ? 0.58 : 0.22;
      const warmth = days < 5 ? 'Active' : days < 14 ? `${days}d ago` : 'Dormant';
      ns.push({
        id: `c-${i}`, type, innerRing: true,
        label: firstName(c.name),
        size, angle,
        dist: days < 5 ? 230 : days < 14 ? 280 : 330,
        phase: i * 0.58,
        importance: imp,
        statusLabel: warmth,
        rawData: { ...c, subject: c.subject },
      });
    });

    // Events — lower sweep (social calendar)
    events.forEach((ev, i) => {
      const angle = Math.PI * 0.6 + (i - events.length / 2) * 0.28;
      const imp   = Math.max(0.4, 0.82 - i * 0.06);
      ns.push({
        id: `ev-${i}`, type: 'event', shape: 'diamond',
        label: `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${dayHint(ev.startRaw)}`,
        size: 8, angle, dist: 340 + i * 24, phase: i * 1.0,
        importance: imp,
        rawData: ev,
      });
    });

    // Plans — upper-right (event planning docs)
    plans.forEach((p, i) => {
      const angle = -Math.PI * 0.35 + (i - plans.length / 2) * 0.32;
      ns.push({
        id: `plan-${i}`, type: 'plan',
        label: p.title,
        size: 7, angle, dist: 355 + i * 20, phase: i * 1.2,
        importance: 0.42,
        statusLabel: 'Notion',
        rawData: p,
      });
    });

    // Instagram — left side if connected
    if (ig) {
      const imp = ig.followers > 5000 ? 0.82 : ig.followers > 1000 ? 0.62 : 0.45;
      ns.push({
        id: 'ig', type: 'instagram',
        label: `${(ig.followers / 1000).toFixed(1)}k followers`,
        size: 12, angle: Math.PI * 0.9, dist: 250, phase: 0.3,
        importance: imp,
        statusLabel: `${ig.posts} posts`,
        rawData: ig,
      });
    }

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
      strong: n.type === 'contact-warm',
      rest: Math.round(295 - (n.importance ?? 0.3) * 175),
      k: 0.007,
    }));
    return { nodes: ns, edges: es };
  }, [baseNodes, aiScores]);

  return (
    <>
      <BoardShell themeKey="firefly" data={data} loading={loading} onInboxEmailClick={setDraftEmail}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
          <NodeDetail node={selected} accent="#D97706" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
        </div>
      </BoardShell>
      {draftEmail && <DraftCompose email={draftEmail} accent="#D97706" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(217,119,6,0.5)', marginBottom: 10 }}>breeze</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.28)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
