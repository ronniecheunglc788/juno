import { useState, useEffect, useRef } from 'react';

// Strips rawData down to just the signals the AI needs — keeps the payload small
function summarize(n) {
  const d   = n.rawData || {};
  const base = { id: n.id, type: n.type, label: n.label };
  switch (n.type) {
    case 'repo':
    case 'repo-stale':
      return { ...base, lastCommit: d.lastCommit, language: d.language, isStale: d.isStale };
    case 'recruit':
    case 'recruit-r':
    case 'opp':
    case 'client':
    case 'app':
    case 'res':
    case 'acad':
    case 'other':
      return { ...base, subject: d.subject, from: d.from, isUnread: d.isUnread, date: d.date };
    case 'contact-warm':
    case 'contact-mid':
    case 'contact-cold':
      return { ...base, emailCount: d.count, lastDate: d.date };
    case 'event':
      return { ...base, startRaw: d.startRaw, isAllDay: d.isAllDay };
    case 'instagram':
      return { ...base, followers: d.followers, posts: d.posts };
    case 'note':
      return { ...base, lastEdited: d.lastEdited };
    default:
      return base;
  }
}

// Fetches AI importance scores for a set of nodes.
// Returns a map of { nodeId: score (0–1) }.
// Falls back to empty object on error — heuristic importance values stay in effect.
export function useNodeScores(nodes, archetype) {
  const [scores, setScores]   = useState({});
  const lastKeyRef            = useRef(null);

  useEffect(() => {
    const scorable = (nodes || []).filter(n => n.type !== 'center');
    if (!scorable.length || !archetype) return;

    // Only re-score if the set of node IDs actually changed
    const key = scorable.map(n => n.id).sort().join(',');
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    const ctrl = new AbortController();

    fetch('/api/score-nodes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ archetype, nodes: scorable.map(summarize) }),
      signal:  ctrl.signal,
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ scores }) => { if (scores) setScores(scores); })
      .catch(() => {}); // silent — heuristic scores stay if AI fails

    return () => ctrl.abort();
  }, [nodes, archetype]);

  return scores;
}
