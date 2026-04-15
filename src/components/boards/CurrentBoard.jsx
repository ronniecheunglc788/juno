import { useState, useMemo } from 'react';
import AquariumCanvas from '../AquariumCanvas';
import NodeDetail     from '../NodeDetail';
import DraftCompose   from '../DraftCompose';
import { useNodeScores } from '../../hooks/useNodeScores';

// ── Urgency scoring ────────────────────────────────────────────────
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
  if (score >= 9) return { type: 'critical', imp: 0.95 };
  if (score >= 6) return { type: 'high',     imp: 0.78 };
  if (score >= 3) return { type: 'medium',   imp: 0.58 };
  return               { type: 'low',        imp: 0.38 };
}
function subjectWords(s, n = 4) {
  return (s || '').replace(/^(Re:|Fwd:|RE:|Fw:)\s*/i, '').trim().split(/\s+/).slice(0, n).join(' ') || 'Email';
}
function calLabel(ev) {
  const d = Math.floor((new Date(ev.startRaw) - Date.now()) / 86400000);
  const tag = d <= 0 ? 'TODAY' : d === 1 ? 'tmrw' : `${d}d`;
  return `${ev.title.split(/\s+/).slice(0, 3).join(' ')} · ${tag}`;
}

// ── Urgency type → animal type ─────────────────────────────────────
const URGENCY_TO_ANIMAL = {
  'critical': 'stingray',
  'high':     'tropical-fish',
  'medium':   'fish',
  'low':      'seahorse',
  'stale':    'crab',
};

export default function CurrentBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  const baseEntities = useMemo(() => {
    const name   = data?.user?.name?.split(' ')[0] || 'you';
    const emails = (data?.emails   || []).slice(0, 20);
    const events = (data?.calendar || []).slice(0, 14);
    const repos  = (data?.github   || []).filter(r => r.isStale).slice(0, 4);

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
    items.sort((a, b) => b._score - a._score);

    const result = [
      { id: 'center', type: 'user', label: name, importance: 1.0 },
    ];

    items.slice(0, 28).forEach((item, i) => {
      let animalType;

      if (item._kind === 'email') {
        // Unread email with urgency score < 3 → jellyfish
        if (item.isUnread && item._score < 3) {
          animalType = 'jellyfish';
        } else {
          animalType = URGENCY_TO_ANIMAL[item._type] || 'fish';
        }
        result.push({
          id:          `item-${i}`,
          type:        animalType,
          label:       subjectWords(item.subject, 4),
          importance:  item._imp,
          statusLabel: item.isUnread ? 'Unread' : null,
          rawData:     item,
        });
      } else {
        // Calendar event: score >= 9 AND importance > 0.8 → turtle
        if (item._score >= 9 && item._imp > 0.8) {
          animalType = 'turtle';
        } else {
          animalType = URGENCY_TO_ANIMAL[item._type] || 'fish';
        }
        result.push({
          id:          `item-${i}`,
          type:        animalType,
          label:       calLabel(item),
          importance:  item._imp,
          statusLabel: item._type === 'critical' ? 'TODAY' : null,
          rawData:     item,
        });
      }
    });

    repos.forEach((r, i) => {
      result.push({
        id:          `repo-${i}`,
        type:        'crab',
        label:       r.name,
        importance:  0.22,
        statusLabel: 'Stale',
        rawData:     r,
      });
    });

    return result;
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
      .filter(e => e.type === 'user' || !hasAi || (e.importance ?? 0) >= 0.25);
  }, [baseEntities, aiScores, aiLabels]);

  function handleEntityClick(entity) {
    if (!entity) { setSelected(null); return; }
    // Map to a NodeDetail-compatible object
    setSelected({
      ...entity,
      type:    'other',
      rawData: entity.rawData,
    });
  }

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#010C1C', overflow: 'hidden' }}>
        <AquariumCanvas entities={entities} onEntityClick={handleEntityClick} />
        <NodeDetail node={selected} accent="#00D4FF" onClose={() => setSelected(null)} onDraftReply={setDraftEmail} />
      </div>
      {draftEmail && <DraftCompose email={draftEmail} accent="#00D4FF" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#010C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(0,212,255,0.45)', marginBottom: 10 }}>juno</div>
        <div style={{ fontSize: 12, color: 'rgba(140,200,255,0.35)', fontWeight: 300, letterSpacing: '0.3px' }}>Loading your context…</div>
      </div>
    </div>
  );
}
