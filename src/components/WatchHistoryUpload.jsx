import { useState, useRef } from 'react';

const TOPIC_KEYWORDS = {
  'Tech & AI':       ['ai', 'gpt', 'machine learning', 'coding', 'programming', 'software', 'startup', 'tech', 'developer', 'javascript', 'python', 'llm', 'openai', 'claude', 'perplexity'],
  'Finance':         ['stock', 'investing', 'crypto', 'market', 'trading', 'portfolio', 'bitcoin', 'finance', 'money', 'hedge fund', 'vc', 'venture'],
  'Fitness':         ['workout', 'gym', 'fitness', 'exercise', 'training', 'muscle', 'weight', 'running'],
  'Gaming':          ['gaming', 'valorant', 'fortnite', 'minecraft', 'game', 'play', 'esports', 'twitch'],
  'Entertainment':   ['vlog', 'prank', 'challenge', 'reaction', 'sidemen', 'mrbeast', 'podcast', 'interview'],
  'Education':       ['lecture', 'tutorial', 'learn', 'how to', 'explained', 'course', 'university', 'study'],
  'Entrepreneurship':['startup', 'founder', 'y combinator', 'ycombinator', 'entrepreneur', 'business', 'pitch', 'product'],
};

function inferTopics(titles) {
  const counts = {};
  titles.forEach(title => {
    const t = title.toLowerCase();
    for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
      if (kws.some(k => t.includes(k))) {
        counts[topic] = (counts[topic] || 0) + 1;
      }
    }
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, c]) => ({ topic: t, count: c }));
}

function parseWatchHistory(raw) {
  // Filter to only YouTube watches (not searches/ads)
  const watches = raw.filter(e =>
    e.header === 'YouTube' &&
    e.titleUrl?.includes('youtube.com/watch') &&
    e.subtitles?.length > 0
  );

  // Channel frequency
  const channelMap = {};
  watches.forEach(e => {
    const ch = e.subtitles[0]?.name;
    if (ch) channelMap[ch] = (channelMap[ch] || 0) + 1;
  });
  const topChannels = Object.entries(channelMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  // Watch frequency by hour
  const byHour = Array(24).fill(0);
  watches.forEach(e => {
    if (e.time) byHour[new Date(e.time).getHours()]++;
  });

  // Watch frequency by day of week
  const byDay = Array(7).fill(0);
  watches.forEach(e => {
    if (e.time) byDay[new Date(e.time).getDay()]++;
  });

  // Recent 30 watches
  const recent = watches
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 30)
    .map(e => ({
      title:   e.title?.replace('Watched ', '') || '',
      channel: e.subtitles[0]?.name || '',
      time:    e.time,
    }));

  // Topics inferred from all titles
  const allTitles = watches.map(e => e.title || '');
  const topics = inferTopics(allTitles);

  return {
    totalWatches: watches.length,
    topChannels,
    recent,
    byHour,
    byDay,
    topics,
    uploadedAt: new Date().toISOString(),
  };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WatchHistoryUpload({ userId, onUploaded }) {
  const [state, setState] = useState('idle'); // idle | parsing | done | error
  const [progress, setProgress] = useState('');
  const [summary, setSummary] = useState(null);
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    setState('parsing');
    setProgress('Reading file…');

    try {
      const text = await file.text();
      setProgress('Parsing watch history…');
      const raw = JSON.parse(text);
      setProgress(`Processing ${raw.length.toLocaleString()} entries…`);
      const parsed = parseWatchHistory(raw);
      setProgress('Saving…');

      const res = await fetch('/api/upload-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, summary: parsed }),
      });
      if (!res.ok) throw new Error('Failed to save');

      setSummary(parsed);
      setState('done');
      if (onUploaded) onUploaded(parsed);
    } catch (e) {
      setState('error');
      setProgress(e.message);
    }
  }

  const S = {
    wrap:   { background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 24px', fontFamily: 'system-ui, sans-serif' },
    title:  { fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#999', marginBottom: 12 },
    zone:   { border: '2px dashed rgba(124,58,237,0.3)', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(124,58,237,0.03)' },
    hint:   { fontSize: 13, color: '#888', marginTop: 6, lineHeight: 1.5 },
    btn:    { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '8px 18px', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 12 },
    stat:   { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 },
    num:    { fontSize: 22, fontWeight: 800, color: '#1A1A1A' },
    lbl:    { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' },
    ch:     { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 13 },
    bar:    { height: 6, borderRadius: 3, background: 'rgba(124,58,237,0.15)', marginTop: 2 },
    filled: { height: '100%', borderRadius: 3, background: '#7C3AED' },
  };

  if (state === 'done' && summary) {
    const maxCh = summary.topChannels[0]?.count || 1;
    const maxHr = Math.max(...summary.byHour);
    const peakHour = summary.byHour.indexOf(maxHr);
    const peakDay  = summary.byDay.indexOf(Math.max(...summary.byDay));

    return (
      <div style={S.wrap}>
        <div style={S.title}>YOUTUBE WATCH HISTORY</div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          <div style={S.stat}><span style={S.num}>{summary.totalWatches.toLocaleString()}</span><span style={S.lbl}>videos watched</span></div>
          <div style={S.stat}><span style={S.num}>{peakHour % 12 || 12}{peakHour < 12 ? 'am' : 'pm'}</span><span style={S.lbl}>peak hour</span></div>
          <div style={S.stat}><span style={S.num}>{DAYS[peakDay]}</span><span style={S.lbl}>peak day</span></div>
        </div>

        {summary.topics.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>TOPICS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {summary.topics.map((t, i) => (
                <span key={i} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, color: '#7C3AED' }}>
                  {t.topic} · {t.count}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>TOP CHANNELS</div>
        {summary.topChannels.slice(0, 8).map((ch, i) => (
          <div key={i}>
            <div style={S.ch}>
              <span style={{ color: '#333' }}>{ch.name}</span>
              <span style={{ color: '#999' }}>{ch.count}</span>
            </div>
            <div style={S.bar}><div style={{ ...S.filled, width: `${(ch.count / maxCh) * 100}%` }} /></div>
          </div>
        ))}

        <div style={{ fontSize: 11, color: '#ccc', marginTop: 14 }}>
          Uploaded {new Date(summary.uploadedAt).toLocaleDateString()} ·
          <span style={{ color: '#7C3AED', cursor: 'pointer', marginLeft: 6 }} onClick={() => setState('idle')}>update →</span>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>YOUTUBE WATCH HISTORY</div>
      {state === 'parsing' ? (
        <div style={{ fontSize: 13, color: '#888', padding: '16px 0' }}>⏳ {progress}</div>
      ) : state === 'error' ? (
        <div style={{ fontSize: 13, color: '#C0392B', padding: '8px 0' }}>Error: {progress}</div>
      ) : (
        <>
          <div
            style={S.zone}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <div style={{ fontSize: 28 }}>▶</div>
            <div style={{ fontSize: 14, color: '#555', marginTop: 8 }}>Drop your <strong>watch-history.json</strong> here</div>
            <div style={S.hint}>
              From Google Takeout → YouTube → History → watch-history.json<br />
              <a href="https://takeout.google.com" target="_blank" rel="noreferrer" style={{ color: '#7C3AED' }}>Get it at takeout.google.com →</a>
            </div>
            <button style={S.btn} type="button">Choose file</button>
          </div>
          <input ref={inputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </>
      )}
    </div>
  );
}
