import { useState, useMemo } from 'react';
import CityCanvas    from '../CityCanvas';
import NodeDetail    from '../NodeDetail';
import DraftCompose  from '../DraftCompose';

// ── Karissa — The City ────────────────────────────────────────────
// Each building = a GitHub repo (taller + more lit = more active).
// Walking people = email contacts (faster = recently active).
// Cars driving past = calendar deadlines (redder/faster = sooner).

// Building plots in the 15×11 grid (v-roads at cols 5,10; h-roads at rows 3,7)
// Parks at (1,1),(7,1),(13,1),(12,2),(6,5),(2,6),(13,6),(1,9),(8,9),(12,10)
// Ordered most-visible center-front first
const BUILDING_PLOTS = [
  // Center blocks — most visible
  [6,5],[7,5],[8,5],[9,5],[6,4],[7,4],[8,4],[9,4],
  [6,6],[7,6],[8,6],[9,6],
  // Left-center
  [1,4],[2,4],[3,4],[4,4],[1,5],[2,5],[3,5],[4,5],
  [1,6],[3,6],[4,6],
  // Right-center
  [11,4],[12,4],[13,4],[14,4],[11,5],[12,5],[13,5],[14,5],
  [11,6],[12,6],[14,6],
  // Upper strips rows 1-2
  [6,2],[7,2],[8,2],[9,2],[6,1],[8,1],[9,1],
  [0,4],[0,5],[0,6],[4,2],[3,2],[2,2],[0,2],[0,1],
  [11,2],[13,2],[14,2],[11,1],[12,1],[14,1],
  // Upper row 0
  [0,0],[1,0],[2,0],[3,0],[4,0],[6,0],[7,0],[8,0],[9,0],[11,0],[12,0],[13,0],[14,0],
  [2,1],[3,1],[4,1],
  // Lower strips rows 8-10
  [6,8],[7,8],[8,8],[9,8],[6,9],[7,9],[9,9],[6,10],[7,10],[8,10],[9,10],
  [0,8],[1,8],[2,8],[3,8],[4,8],[0,9],[2,9],[3,9],[4,9],[0,10],[1,10],[2,10],[3,10],[4,10],
  [11,8],[12,8],[13,8],[14,8],[11,9],[12,9],[13,9],[14,9],[11,10],[13,10],[14,10],
];

function staleDays(d) {
  return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 999;
}
function firstName(n) { return (n || '').split(' ')[0] || 'Contact'; }

// Floors based on recency — more recently active = taller building
function floorsFromDays(days) {
  if (days <= 1)  return 7;
  if (days <= 3)  return 6;
  if (days <= 7)  return 5;
  if (days <= 14) return 4;
  if (days <= 30) return 3;
  return 2;
}

const CAR_COLORS = {
  today:    '#FF4444',
  tomorrow: '#FF8844',
  week:     '#FFD700',
  soon:     '#44DDBB',
  far:      '#8899AA',
};

export default function TendrilBoard({ data, loading }) {
  const [selected,   setSelected]   = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  // GitHub repos → buildings
  const buildings = useMemo(() => {
    if (!data?.github) return [];
    return (data.github || [])
      .slice(0, BUILDING_PLOTS.length)
      .map((repo, i) => {
        const [gx, gy] = BUILDING_PLOTS[i];
        const days   = staleDays(repo.lastCommit);
        const floors = floorsFromDays(days);
        const active = days < 14;
        return {
          id:          repo.name || `repo-${i}`,
          gx, gy,
          floors,
          active,
          label:       repo.name || 'repo',
          // extra fields passed through for NodeDetail
          rawData:     repo,
          nodeType:    'repo',
          statusLabel: `GitHub repo · ${days < 1 ? 'committed today' : days === 1 ? 'committed yesterday' : `last commit ${days}d ago`}`,
          glowColor:   active ? '#44DDBB' : '#8899AA',
        };
      });
  }, [data]);

  // Email contacts → pedestrians (speed ∝ recency)
  const pedestrians = useMemo(() => {
    if (!data?.emails) return [];
    const emailMap = {};
    (data.emails || []).forEach(em => {
      const key = em.fromEmail || em.from;
      if (!key || key.toLowerCase().includes('noreply')) return;
      if (!emailMap[key]) emailMap[key] = { name: em.from, date: em.date, rawData: em };
      else if (em.date > emailMap[key].date) emailMap[key].date = em.date;
    });
    return Object.values(emailMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((c, i) => {
        const days  = staleDays(c.date);
        const speed = days < 3 ? 0.006 : days < 10 ? 0.004 : 0.002;
        return {
          id:          `ped-${i}`,
          label:       firstName(c.name),
          speed,
          rawData:     c.rawData,
          nodeType:    'other',
          statusLabel: `Email contact · ${days < 1 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`}`,
        };
      });
  }, [data]);

  // Calendar events → cars (urgency → color + speed)
  const cars = useMemo(() => {
    if (!data?.calendar) return [];
    return (data.calendar || []).map((ev, i) => {
      const d     = Math.floor((new Date(ev.startRaw || ev.start) - Date.now()) / 86400000);
      const color = d <= 0 ? CAR_COLORS.today
                  : d <= 1 ? CAR_COLORS.tomorrow
                  : d <= 3 ? CAR_COLORS.week
                  : d <= 7 ? CAR_COLORS.soon
                  : CAR_COLORS.far;
      const speed = d <= 0 ? 0.042 : d <= 2 ? 0.028 : d <= 7 ? 0.018 : 0.012;
      return {
        id:          `car-${i}`,
        label:       (ev.title || '').split(/\s+/).slice(0, 4).join(' '),
        color,
        speed,
        rawData:     ev,
        nodeType:    'event',
        statusLabel: `Calendar event · ${d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`,
      };
    });
  }, [data]);

  function handleEntityClick(entity) {
    if (!entity) { setSelected(null); return; }
    setSelected({
      ...entity,
      type:   entity.nodeType || 'other',
      accent: entity.glowColor || entity.color || '#FFD700',
    });
  }

  if (loading) return <Loading />;

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0C1018' }}>
        <CityCanvas
          buildings={buildings}
          pedestrians={pedestrians}
          cars={cars}
          onEntityClick={handleEntityClick}
        />
        <NodeDetail
          node={selected}
          accent={selected?.accent || '#FFD700'}
          onClose={() => setSelected(null)}
          onDraftReply={setDraftEmail}
        />
      </div>
      {draftEmail && (
        <DraftCompose email={draftEmail} accent="#FFD700" onClose={() => setDraftEmail(null)} />
      )}
    </>
  );
}

function Loading() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0C1018', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono','Courier New',monospace" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,200,100,0.35)', marginBottom: 10 }}>juno</div>
        <div style={{ fontSize: 11, color: 'rgba(255,180,80,0.28)', letterSpacing: '1px' }}>loading city…</div>
      </div>
    </div>
  );
}
