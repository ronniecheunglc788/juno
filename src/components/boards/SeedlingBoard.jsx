import { useState, useMemo } from 'react';
import GardenCanvas from '../GardenCanvas';
import NodeDetail   from '../NodeDetail';
import DraftCompose from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Seedling — First Light ────────────────────────────────────────
// Purpose: produce the one moment where Juno notices something real
// and useful that the Seedling didn't ask for. The tall flower IS that
// moment. Everything else exists to make the garden feel inhabited so
// the spotlight doesn't feel algorithmic.
//
// Events = flowers. Emails = butterflies. Spotlight = the aha moment.
// The garden is Juno's growing model of your life — sparse at first,
// richer as it learns more about you.

const SPOTLIGHT_KW = ['financial aid','disbursement','deadline','due','important',
  'action required','scholarship','grant','registration','enroll','confirm'];

const SPOTLIGHT_WHY = {
  'financial aid':  'your financial aid needs attention',
  'disbursement':   'a disbursement notice came in',
  'deadline':       "there's a deadline approaching",
  'due':            'something is due soon',
  'important':      'this was marked important',
  'action required':'this is asking you to do something',
  'scholarship':    'a scholarship update arrived',
  'grant':          'a grant notice came in',
  'registration':   'a registration window is open',
  'enroll':         'an enrollment window is open',
  'confirm':        'something needs your confirmation',
};

function dayHint(raw) {
  const d = Math.floor((new Date(raw) - Date.now()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

function findSpotlight(data) {
  for (const em of (data?.emails || [])) {
    const txt = ((em.subject||'') + (em.snippet||'')).toLowerCase();
    const hit = SPOTLIGHT_KW.find(k => txt.includes(k));
    if (hit)
      return {
        type: 'email',
        label: (em.subject||'').split(/\s+/).slice(0,5).join(' '),
        hint: `Juno noticed this · ${SPOTLIGHT_WHY[hit] || 'this looked important'}`,
        rawData: em,
      };
  }
  const upcoming = [...(data?.calendar||[])].sort((a,b)=>new Date(a.startRaw)-new Date(b.startRaw));
  if (upcoming.length)
    return {
      type: 'calendar',
      label: upcoming[0].title,
      hint: `coming up · ${dayHint(upcoming[0].startRaw)}`,
      rawData: upcoming[0],
    };
  return null;
}

export default function SeedlingBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseEntities = useMemo(() => {
    const name      = data?.user?.name?.split(' ')[0] || 'you';
    const events    = (data?.calendar || []).slice(0, 7);
    const emails    = (data?.emails   || []).slice(0, 6);
    const spotlight = findSpotlight(data);

    const ents = [{ id:'center', type:'center', label:name, angle:0, dist:0, phase:0, importance:1.0 }];

    if (spotlight) {
      ents.push({
        id:'spotlight', type:'spotlight',
        label: spotlight.label,
        angle: -Math.PI * 0.3,
        dist: 185, phase: 0,
        importance: 1.0,
        statusLabel: spotlight.hint,
        rawData: spotlight.rawData,
      });
    }

    events.forEach((ev, i) => {
      ents.push({
        id: `ev-${i}`, type: 'event',
        label: `${ev.title.split(/\s+/).slice(0,3).join(' ')} · ${dayHint(ev.startRaw)}`,
        angle: Math.PI * 0.35 + i * (Math.PI * 0.55),
        dist: 280 + i * 30, phase: i * 1.1,
        importance: 0.5,
        rawData: ev,
      });
    });

    emails.forEach((em, i) => {
      ents.push({
        id: `em-${i}`, type: 'email',
        label: (em.subject||'').split(/\s+/).slice(0,4).join(' '),
        angle: -Math.PI * 0.65 + i * 0.55,
        dist: 320 + i * 25, phase: i * 0.8,
        importance: 0.4,
        clothesIdx: i,
        rawData: em,
      });
    });

    return ents;
  }, [data]);

  const { scores: aiScores, labels: aiLabels } = useNodeScores(baseEntities, data?.user?.archetype);

  const subtitle = useMemo(() => {
    const spotlight = findSpotlight(data);
    if (spotlight) return `Juno noticed the tall flower · ${spotlight.hint.split(' · ')[1] || 'something that needs your attention'}`;
    const evCount = (data?.calendar||[]).length;
    const emCount = (data?.emails||[]).length;
    if (!evCount && !emCount) return 'connect your calendar or email and something will grow here';
    return 'the one thing that matters today · and everything orbiting it';
  }, [data]);

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

  function handleEntityClick(entity) {
    if (!entity || !entity.rawData) { setSelected(null); return; }
    const typeMap = { 'spotlight':'other', 'event':'event', 'email':'other' };
    setSelected({ ...entity, type: typeMap[entity.type] ?? 'other' });
  }

  return (
    <>
      <div style={{ position:'relative', width:'100%', height:'100%', background:'#F0F4EE', overflow:'hidden' }}>
        <GardenCanvas entities={entities} onEntityClick={handleEntityClick} subtitle={subtitle} />
        <NodeDetail
          node={selected}
          accent="#10B981"
          onClose={() => setSelected(null)}
          onDraftReply={setDraftEmail}
        />
      </div>
      {draftEmail && <DraftCompose email={draftEmail} accent="#10B981" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#F4FAF0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(16,185,129,0.45)', marginBottom:10 }}>juno</div>
        <div style={{ fontSize:12, color:'rgba(0,0,0,0.25)', fontWeight:300, letterSpacing:'0.3px' }}>just a moment…</div>
      </div>
    </div>
  );
}
