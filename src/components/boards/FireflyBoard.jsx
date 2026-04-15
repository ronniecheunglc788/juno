import { useState, useMemo, useEffect } from 'react';
import FireflyCanvas from '../FireflyCanvas';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

const FILTERS = [
  { id:'contacts', label:'Contacts', types:['contact-warm','contact-mid','contact-cold'], color:'#FFB934' },
  { id:'events',   label:'Events',   types:['event'],                                     color:'#FF3E62' },
  { id:'plans',    label:'Plans',    types:['plan'],                                      color:'#4882FF' },
  { id:'social',   label:'Social',   types:['instagram'],                                 color:'#FF2C9B' },
];

// ── Cindy — Social Constellation ─────────────────────────────────
// Deep space. Contacts = stars. Constellation lines connecting them.
// Inner ring = recently active. Shooting stars appear occasionally.

function daysAgo(d) {
  if (!d) return 999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function dayHint(raw) {
  const d = Math.floor((new Date(raw) - Date.now()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return new Date(raw).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
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
    if (!map[key].date || em.date > map[key].date) map[key].date = em.date;
  });
  return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 14);
}
function firstName(name) { return (name || '').split(' ')[0] || 'Contact'; }

export default function FireflyBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);
  const [activeFilters, setActiveFilters] = useState(() => new Set(FILTERS.map(f => f.id)));
  const [hoveredFilter, setHoveredFilter] = useState(null);

  function toggleFilter(id) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const baseEntities = useMemo(() => {
    const name     = data?.user?.name?.split(' ')[0] || 'you';
    const contacts = buildContacts(data?.emails || []);
    const events   = (data?.calendar || []).slice(0, 9);
    const plans    = (data?.notion   || []).slice(0, 4);
    const ig       = data?.instagram;

    const ents = [{ id:'center', type:'center', label:name, size:20, angle:0, dist:0, phase:0, importance:1.0 }];

    contacts.forEach((c, i) => {
      const angle  = (i / contacts.length) * Math.PI * 2 - Math.PI / 2;
      const days   = daysAgo(c.date);
      const type   = days < 5 ? 'contact-warm' : days < 14 ? 'contact-mid' : 'contact-cold';
      const warmth = days < 5 ? 'Active' : days < 14 ? `${days}d ago` : 'Dormant';
      ents.push({
        id: `c-${i}`, type,
        label: firstName(c.name),
        size: days < 5 ? 11 : days < 14 ? 8 : 6,
        angle, dist: days < 5 ? 200 : days < 14 ? 280 : 355,
        phase: i * 0.58,
        importance: days < 5 ? 0.9 : days < 14 ? 0.58 : 0.22,
        statusLabel: warmth,
        rawData: { ...c },
      });
    });

    events.forEach((ev, i) => {
      const angle = Math.PI * 0.6 + (i - events.length / 2) * 0.28;
      ents.push({
        id: `ev-${i}`, type: 'event',
        label: `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${dayHint(ev.startRaw)}`,
        size: 8, angle, dist: 340 + i * 24, phase: i * 1.0,
        importance: Math.max(0.4, 0.82 - i * 0.06),
        rawData: ev,
      });
    });

    plans.forEach((p, i) => {
      const angle = -Math.PI * 0.35 + (i - plans.length / 2) * 0.32;
      ents.push({
        id: `plan-${i}`, type: 'plan',
        label: p.title,
        size: 7, angle, dist: 355 + i * 20, phase: i * 1.2,
        importance: 0.42,
        statusLabel: 'Notion',
        rawData: p,
      });
    });

    if (ig) {
      ents.push({
        id: 'ig', type: 'instagram',
        label: `${(ig.followers / 1000).toFixed(1)}k followers`,
        size: 12, angle: Math.PI * 0.9, dist: 250, phase: 0.3,
        importance: ig.followers > 5000 ? 0.82 : 0.55,
        statusLabel: `${ig.posts} posts`,
        rawData: ig,
      });
    }

    return ents;
  }, [data]);

  const { scores: aiScores, labels: aiLabels } = useNodeScores(baseEntities, data?.user?.archetype);

  const entities = useMemo(() => {
    const hasAi = Object.keys(aiScores).length > 0;
    return baseEntities
      .map(e => ({
        ...e,
        ...(aiScores[e.id] != null ? { importance: aiScores[e.id] } : {}),
        ...(aiLabels[e.id]         ? { label:      aiLabels[e.id]  } : {}),
      }))
      .filter(e => e.type === 'center' || !hasAi || (e.importance ?? 0) >= 0.3);
  }, [baseEntities, aiScores, aiLabels]);

  // When a selected node gets dimmed, clear the selection
  useEffect(() => {
    if (!selected) return;
    const shown = FILTERS.some(f => activeFilters.has(f.id) && f.types.includes(selected.type));
    if (!shown) setSelected(null);
  }, [activeFilters, selected]);

  // Mark filtered-out nodes as dimmed (ghosted) rather than removing them
  const visibleEntities = useMemo(() => entities.map(e => {
    if (e.type === 'center') return e;
    const shown = FILTERS.some(f => activeFilters.has(f.id) && f.types.includes(e.type));
    return shown ? e : { ...e, dimmed: true };
  }), [entities, activeFilters]);

  // Count active nodes per filter category (for pill labels)
  const filterCounts = useMemo(() => {
    const counts = {};
    FILTERS.forEach(f => {
      counts[f.id] = entities.filter(e => f.types.includes(e.type)).length;
    });
    return counts;
  }, [entities]);

  function handleEntityClick(entity) {
    if (!entity || !entity.rawData) { setSelected(null); return; }
    // Map constellation types to NodeDetail-compatible types
    const typeMap = { 'contact-warm':'other', 'contact-mid':'other', 'contact-cold':'other', 'event':'event', 'plan':'note', 'instagram':'other' };
    setSelected({ ...entity, type: typeMap[entity.type] ?? 'other' });
  }

  // Hint: show drag hint first (3.2s), then keyboard hint (2s), then hide
  const [hintPhase, setHintPhase] = useState(0); // 0=drag hint, 1=kb hint, 2=hidden
  useEffect(() => {
    const t1 = setTimeout(() => setHintPhase(1), 3200);
    const t2 = setTimeout(() => setHintPhase(2), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <div style={{ position:'relative', width:'100%', height:'100%', background:'#07050f', overflow:'hidden' }}>
        <FireflyCanvas entities={visibleEntities} onEntityClick={handleEntityClick} />

        {/* Filter bar */}
        <div style={{
          position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
          display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center',
          zIndex:10, pointerEvents:'auto',
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)',
          WebkitBackdropFilter:'blur(6px)',
          padding:'5px 7px', borderRadius:24,
          border:'1px solid rgba(255,255,255,0.07)',
          maxWidth:'calc(100% - 32px)',
        }}>
          {/* All / None quick toggle */}
          {(() => {
            const allOn = FILTERS.every(f => activeFilters.has(f.id));
            return (
              <button
                onClick={() => setActiveFilters(allOn
                  ? new Set()
                  : new Set(FILTERS.map(f => f.id))
                )}
                onMouseEnter={() => setHoveredFilter('__all')}
                onMouseLeave={() => setHoveredFilter(null)}
                style={{
                  padding:'3px 9px',
                  background: hoveredFilter==='__all' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:16, cursor:'pointer',
                  fontFamily:"'DM Mono','Courier New',monospace",
                  fontSize:9, letterSpacing:'1.5px', textTransform:'uppercase',
                  color:'rgba(255,255,255,0.3)',
                  transition:'all 0.15s ease', userSelect:'none',
                  marginRight:2,
                }}
              >
                {allOn ? 'none' : 'all'}
              </button>
            );
          })()}
          <span style={{width:1,background:'rgba(255,255,255,0.1)',alignSelf:'stretch',margin:'2px 0'}} />
          {FILTERS.map(f => {
            const active  = activeFilters.has(f.id);
            const hovered = hoveredFilter === f.id;
            const count   = filterCounts[f.id] ?? 0;
            return (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                onMouseEnter={() => setHoveredFilter(f.id)}
                onMouseLeave={() => setHoveredFilter(null)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'3px 10px',
                  background: active
                    ? (hovered ? `${f.color}38` : `${f.color}22`)
                    : (hovered ? 'rgba(255,255,255,0.08)' : 'transparent'),
                  border: `1px solid ${active ? f.color+'66' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius:16, cursor:'pointer',
                  fontFamily:"'DM Mono','Courier New',monospace",
                  fontSize:9, letterSpacing:'1.5px', textTransform:'uppercase',
                  color: active ? f.color : (hovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)'),
                  transition:'all 0.15s ease',
                  userSelect:'none',
                  whiteSpace:'nowrap',
                }}
              >
                <span style={{
                  width:5, height:5, borderRadius:'50%', flexShrink:0,
                  background: active ? f.color : 'rgba(255,255,255,0.15)',
                  boxShadow: active ? `0 0 5px ${f.color}, 0 0 10px ${f.color}55` : 'none',
                  transition:'all 0.15s ease',
                }} />
                {f.label}
                {count > 0 && (
                  <span style={{
                    fontSize:8, opacity: active ? 0.7 : 0.3,
                    marginLeft:1, transition:'opacity 0.15s',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hint overlay — drag hint then keyboard hint */}
        <div style={{
          position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)',
          fontSize:10, letterSpacing:'2px', textTransform:'uppercase',
          color:'rgba(255,180,48,0.42)', fontFamily:"'DM Mono','Courier New',monospace",
          pointerEvents:'none', userSelect:'none', whiteSpace:'nowrap',
          opacity: hintPhase === 2 ? 0 : 1,
          transition:'opacity 1.2s ease',
        }}>
          {hintPhase === 0 ? 'drag to rotate · scroll to zoom' : 'tab to cycle · esc to dismiss'}
        </div>

        <NodeDetail
          node={selected}
          accent="#FFB800"
          onClose={() => setSelected(null)}
          onDraftReply={setDraftEmail}
        />
      </div>
      {draftEmail && <DraftCompose email={draftEmail} accent="#FFB800" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#010208', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'rgba(255,180,0,0.35)', marginBottom:10 }}>juno</div>
        <div style={{ fontSize:11, color:'rgba(255,160,0,0.28)', letterSpacing:'1px' }}>charting stars…</div>
      </div>
    </div>
  );
}
