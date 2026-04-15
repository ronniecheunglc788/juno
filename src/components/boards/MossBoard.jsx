import { useState, useMemo } from 'react';
import OrbitMapCanvas  from '../OrbitMapCanvas';
import DraftCompose    from '../DraftCompose';

// ── Moss — The Orbit Map ──────────────────────────────────────────────────────
// Juno data rendered as an orbital system.
// Ring 1 (inner) = urgent/today. Ring 2 = this week/active. Ring 3 = fading/stale.
// Types: person (email senders), routine (habits + calendar), pattern (data + repos)

const INSIGHT_KW = ['sleep','hrv','habit','streak','meditation','wellness','focus',
  'cortisol','recovery','tracking','data','pattern','reflection','review','well-being'];

function isInsightEmail(em) {
  return INSIGHT_KW.some(k => ((em.subject || '') + (em.snippet || '')).toLowerCase().includes(k));
}
function cleanName(str) {
  return str.replace(/\.(csv|xlsx|docx|ipynb|pdf|json)$/i, '').replace(/_/g, ' ').slice(0, 20);
}
function isHabit(title) {
  return ['habit','streak','log','tracker','routine','review','journal','reflection',
    'gratitude','sleep','intention','weekly','quarterly','energy','mood','morning']
    .some(k => (title || '').toLowerCase().includes(k));
}

export default function MossBoard({ data, loading }) {
  if (loading) return <Loading />;
  const [draftEmail, setDraftEmail] = useState(null);

  const { entities, patterns } = useMemo(() => {
    const ents = [];

    // ── Calendar events ──────────────────────────────────────────────────
    const events = (data?.calendar || []).slice(0, 10);
    events.forEach((ev, i) => {
      const daysUntil = Math.floor((new Date(ev.startRaw) - Date.now()) / 86400000);
      const isToday   = daysUntil <= 0 && daysUntil > -2;
      const isPast    = daysUntil <= -2;
      ents.push({
        id:          `ev-${i}`,
        name:        ev.title.split(/\s+/).slice(0, 4).join(' '),
        label:       ev.startFormatted || ev.start || '',
        type:        'routine',
        drifting:    isPast,
        orbit_ring:  isToday ? 1 : daysUntil <= 7 ? 2 : 3,
        strength:    isToday ? 0.92 : daysUntil <= 3 ? 0.72 : daysUntil <= 7 ? 0.55 : 0.38,
        source:      ['Calendar'],
        detail:      ev.title,
        rawData:     ev,
      });
    });

    // ── Insight emails ────────────────────────────────────────────────────
    const emails = (data?.emails || []).filter(isInsightEmail).slice(0, 8);
    emails.forEach((em, i) => {
      const senderName = (em.from || '').replace(/<.*>/, '').trim() || em.subject || 'Unknown';
      ents.push({
        id:          `em-${i}`,
        name:        senderName.slice(0, 20),
        label:       (em.subject || '').slice(0, 40),
        type:        'person',
        drifting:    em.isUnread && !!(em.daysOld > 5),
        orbit_ring:  em.isUnread ? 1 : 2,
        strength:    em.isUnread ? 0.82 : 0.50,
        source:      ['Gmail'],
        detail:      em.snippet || em.subject || '',
        rawData:     em,
      });
    });

    // ── Notion habit pages ────────────────────────────────────────────────
    const notionHabits = (data?.notion || []).filter(p => isHabit(p.title)).slice(0, 6);
    notionHabits.forEach((p, i) => {
      ents.push({
        id:          `habit-${i}`,
        name:        cleanName(p.title),
        label:       'Notion',
        type:        'routine',
        drifting:    false,
        orbit_ring:  2,
        strength:    0.75,
        source:      ['Notion'],
        detail:      p.title,
        rawData:     p,
      });
    });

    // ── Notion data / reference pages ────────────────────────────────────
    const notionData = (data?.notion || []).filter(p => !isHabit(p.title)).slice(0, 5);
    notionData.forEach((p, i) => {
      ents.push({
        id:          `page-${i}`,
        name:        cleanName(p.title),
        label:       'Notion',
        type:        'pattern',
        drifting:    false,
        orbit_ring:  3,
        strength:    0.48,
        source:      ['Notion'],
        detail:      p.title,
        rawData:     p,
      });
    });

    // ── Drive data files ──────────────────────────────────────────────────
    const DATA_MIME = ['text/csv','application/vnd.openxmlformats','application/octet-stream'];
    const drive = (data?.drive || []).filter(f => DATA_MIME.some(m => (f.mimeType||'').startsWith(m))).slice(0, 4);
    drive.forEach((f, i) => {
      ents.push({
        id:          `drive-${i}`,
        name:        cleanName(f.name),
        label:       'Drive',
        type:        'pattern',
        drifting:    false,
        orbit_ring:  2,
        strength:    Math.max(0.42, 0.78 - i * 0.08),
        source:      ['Drive'],
        detail:      f.name,
        rawData:     f,
      });
    });

    // ── GitHub repos ──────────────────────────────────────────────────────
    const repos = (data?.github || []).slice(0, 4);
    repos.forEach((r, i) => {
      ents.push({
        id:          `repo-${i}`,
        name:        r.name.slice(0, 20),
        label:       r.language || 'GitHub',
        type:        'pattern',
        drifting:    !!r.isStale,
        orbit_ring:  r.isStale ? 3 : 2,
        strength:    r.isStale ? 0.28 : 0.62,
        source:      ['GitHub'],
        detail:      r.description || r.name,
        rawData:     r,
      });
    });

    // ── Patterns: connect emails to calendar events by keyword ────────────
    const pats = [];
    emails.forEach((em, ei) => {
      const emWords = new Set(
        ((em.subject || '') + ' ' + (em.snippet || '')).toLowerCase()
          .split(/\W+/).filter(w => w.length > 4)
      );
      events.forEach((ev, evi) => {
        const evWords = ev.title.toLowerCase().split(/\W+/).filter(w => w.length > 4);
        const overlap = evWords.filter(w => emWords.has(w));
        if (overlap.length >= 1) {
          pats.push({
            id:           `pat-em${ei}-ev${evi}`,
            from_entity:  `em-${ei}`,
            to_entity:    `ev-${evi}`,
            label:        `"${overlap[0]}" link`,
            occurrences:  1,
            confidence:   0.6,
          });
        }
      });
    });

    return { entities: ents, patterns: pats };
  }, [data]);

  const userName  = data?.user?.name?.split(' ')[0] || '';
  const userLabel = data?.user?.name ? `${data.user.name}'s signals` : '';

  return (
    <>
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <OrbitMapCanvas
          entities={entities}
          patterns={patterns}
          userName={userName}
          userLabel={userLabel}
          onDraftEmail={setDraftEmail}
        />
      </div>
      {draftEmail && (
        <DraftCompose email={draftEmail} accent="#C9A84C" onClose={() => setDraftEmail(null)} />
      )}
    </>
  );
}

function Loading() {
  return (
    <div style={{
      width:'100vw', height:'100vh', background:'#06060E',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Mono','Courier New',monospace",
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'rgba(201,168,76,0.35)', marginBottom:10 }}>juno</div>
        <div style={{ fontSize:11, color:'rgba(201,168,76,0.28)', letterSpacing:'1px' }}>mapping orbit…</div>
      </div>
    </div>
  );
}
