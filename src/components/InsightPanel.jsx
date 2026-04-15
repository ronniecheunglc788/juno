import { useEffect, useState, useRef } from 'react';

const FONT = "'DM Sans','Inter',system-ui,sans-serif";

const TYPE_ICON = {
  email:    '✉',
  calendar: '◷',
  github:   '⌥',
  general:  '◈',
};

export default function InsightPanel({ data, accent }) {
  const [insights, setInsights] = useState(null); // null = loading, [] = empty/error
  const [open, setOpen]         = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!data || fetched.current) return;
    fetched.current = true;

    fetch('/api/insights', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data }),
    })
      .then(r => r.json())
      .then(d => setInsights(d.insights || []))
      .catch(() => setInsights([]));
  }, [data]);

  // Don't render at all if insights loaded but empty
  if (insights !== null && insights.length === 0) return null;

  return (
    <div style={{
      position:  'absolute',
      top:       24,
      right:     28,
      width:     290,
      zIndex:    10,
      fontFamily: FONT,
      animation: 'nodeFadeIn 0.25s ease',
    }}>

      {/* Header row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   open ? 10 : 0,
      }}>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
        }}>
          <div style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   accent,
            boxShadow:    `0 0 6px ${accent}80`,
          }} />
          <span style={{
            fontSize:      9,
            fontWeight:    600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color:         'rgba(0,0,0,0.35)',
          }}>
            Juno AI
          </span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background:  'rgba(0,0,0,0.05)',
            border:      '1px solid rgba(0,0,0,0.08)',
            borderRadius: 20,
            padding:     '2px 10px',
            fontSize:    10,
            fontWeight:  500,
            color:       'rgba(0,0,0,0.4)',
            cursor:      'pointer',
            fontFamily:  FONT,
          }}
        >
          {open ? 'Hide' : `${insights ? insights.length : '…'} insights`}
        </button>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights === null ? (
            // Loading skeletons
            [0, 1, 2].map(i => (
              <div key={i} style={cardBase}>
                <div style={{
                  height: 8, width: '40%', borderRadius: 4,
                  background: 'rgba(0,0,0,0.07)', marginBottom: 10,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <div style={{
                  height: 7, width: '90%', borderRadius: 4,
                  background: 'rgba(0,0,0,0.05)', marginBottom: 6,
                }} />
                <div style={{
                  height: 7, width: '70%', borderRadius: 4,
                  background: 'rgba(0,0,0,0.05)',
                }} />
              </div>
            ))
          ) : (
            insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} accent={accent} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight, accent }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const icon = TYPE_ICON[insight.type] || TYPE_ICON.general;

  return (
    <div style={{
      ...cardBase,
      animation: 'nodeFadeIn 0.2s ease',
    }}>
      <div style={{
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        marginBottom:   8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize:   12,
            color:      accent,
            opacity:    0.7,
            lineHeight: 1,
          }}>
            {icon}
          </span>
          <span style={{
            fontSize:      11,
            fontWeight:    600,
            color:         'rgba(0,0,0,0.75)',
            lineHeight:    1.3,
          }}>
            {insight.title}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background:  'none',
            border:      'none',
            color:       'rgba(0,0,0,0.25)',
            fontSize:    14,
            cursor:      'pointer',
            padding:     '0 0 0 6px',
            lineHeight:  1,
            flexShrink:  0,
          }}
        >
          ×
        </button>
      </div>
      <p style={{
        fontSize:   12,
        color:      'rgba(0,0,0,0.55)',
        lineHeight: 1.55,
        margin:     0,
      }}>
        {insight.body}
      </p>
    </div>
  );
}

const cardBase = {
  background:           'rgba(255,255,255,0.92)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(0,0,0,0.08)',
  borderRadius:         12,
  padding:              '13px 14px',
  boxShadow:            '0 4px 20px rgba(0,0,0,0.07)',
};
