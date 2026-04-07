import { useState, useMemo } from 'react';
import BoardShell from '../BoardShell';
import ForceGraph from '../ForceGraph';
import NodeDetail from '../NodeDetail';

// ── Business theme: network graph, bezier, radial spokes ─────────
const THEME = {
  bg:        '#05080F',
  glow:      'rgba(201,168,76,0.05)',
  label:     'rgba(255,245,215,0.38)',
  nodeShape: 'circle',
  edgeStyle: 'bezier',
  color: (type) => {
    switch (type) {
      case 'center':       return '#C9A84C';
      case 'contact-warm': return '#22C55E';
      case 'contact-mid':  return '#C9A84C';
      case 'contact-cold': return '#EF4444';
      case 'opp':          return '#D4A847';
      case 'event':        return '#93C5FD';
      default:             return '#2A3040';
    }
  },
  drawBackground: (ctx, W, H) => {
    const cx = W / 2, cy = H / 2;
    const maxR = Math.sqrt(W * W + H * H);
    ctx.strokeStyle = 'rgba(201,168,76,0.025)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(201,168,76,0.02)';
    for (let r = 120; r < maxR; r += 120) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
  },
};

function daysAgoN(d) {
  if (!d) return 999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function buildContacts(emails) {
  const map = {};
  emails.forEach(em => {
    const key = em.fromEmail || em.from;
    if (!key) return;
    const lk = key.toLowerCase();
    if (lk.includes('noreply') || lk.includes('no-reply') || lk.includes('notification')) return;
    if (!map[key]) map[key] = { name: em.from, email: em.fromEmail, subject: em.subject, date: em.date, count: 0 };
    map[key].count++;
  });
  return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 14);
}

const OPP_KW = ['opportunity','internship','role','position','offer','interview','recruiting','career','job','hiring'];
function isOpp(em) {
  return OPP_KW.some(k => ((em.subject||'')+(em.snippet||'')).toLowerCase().includes(k));
}

export default function BusinessBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected, setSelected] = useState(null);

  const { nodes, edges } = useMemo(() => {
    const firstName = data?.user?.name?.split(' ')[0] || 'you';
    const contacts  = buildContacts(data?.emails || []);
    const opps      = (data?.emails || []).filter(isOpp).slice(0, 7);
    const events    = (data?.calendar || []).slice(0, 5);

    const ns = [{ id: 'center', type: 'center', label: firstName, size: 20 }];

    // Contacts — spread all around, importance by recency
    contacts.forEach((c, i) => {
      const angle = (i / contacts.length) * Math.PI * 2 - Math.PI / 2;
      const days  = daysAgoN(c.date);
      const type  = days < 5 ? 'contact-warm' : days < 14 ? 'contact-mid' : 'contact-cold';
      const size  = days < 5 ? 11 : days < 14 ? 8 : 6;
      const warmth= days < 5 ? 'Active' : days < 14 ? `${days}d ago` : 'Cold';
      const imp   = days < 5 ? 0.9 : days < 14 ? 0.55 : 0.2;
      ns.push({
        id: `c-${i}`, type, label: c.name?.split(' ')[0] || c.name,
        size, angle, dist: 270 + (i % 4) * 60, phase: i * 0.55,
        innerRing: true,
        importance: imp,
        statusLabel: warmth,
        rawData: c,
      });
    });

    // Opportunities — top cluster (diamonds), unread = higher importance
    opps.forEach((op, i) => {
      const angle = -Math.PI / 2 + (i - opps.length/2) * 0.26;
      const imp   = op.isUnread ? 0.85 : 0.5;
      ns.push({
        id: `opp-${i}`, type: 'opp', shape: 'diamond',
        label: op.from?.split(' ').slice(0,2).join(' '),
        size: 9, angle, dist: 370 + i*24, phase: i*1.1,
        importance: imp,
        statusLabel: op.isUnread ? 'Unread' : null,
        rawData: op,
      });
    });

    // Events — lower-right, soonest = most important
    events.forEach((ev, i) => {
      const angle = Math.PI / 3 + (i - events.length/2) * 0.24;
      const imp   = Math.max(0, 1 - i / events.length) * 0.5;
      ns.push({
        id: `ev-${i}`, type: 'event', label: ev.title, size: 7,
        angle, dist: 340 + i*20, phase: i*0.9,
        importance: imp,
        rawData: ev,
      });
    });

    const es = ns.slice(1).map((n, i) => ({
      source: 0, target: i+1,
      strong: n.type === 'contact-warm' || n.type === 'opp',
      rest: Math.round(310 - (n.importance ?? 0.3) * 200),
      k: 0.007,
    }));

    return { nodes: ns, edges: es };
  }, [data]);

  return (
    <BoardShell themeKey="business" data={data} loading={loading}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ForceGraph nodes={nodes} edges={edges} theme={THEME} onNodeClick={setSelected} />
        <NodeDetail node={selected} accent="#C9A84C" onClose={() => setSelected(null)} />
      </div>
    </BoardShell>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#05080F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(201,168,76,0.3)', marginBottom:10 }}>breeze</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.14)', fontWeight:300, letterSpacing:'0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
