import { setCORSHeaders } from './_lib/validate.js';

const ARCHETYPE_CONTEXT = {
  engineer: 'CS/software engineering student. Priorities: active repos, recruiting emails, technical interviews, upcoming project deadlines.',
  business: 'Business student. Priorities: warm contacts, networking opportunities, career events, recruiting and internship emails.',
  premed:   'Pre-med student. Priorities: medical school applications, research opportunities, clinical experience emails, upcoming exams.',
  creative: 'Creative student (design/art/media). Priorities: active client work, feedback requests needing reply, portfolio projects, collaborations.',
};

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'AI not configured' });

  const { archetype, nodes } = req.body || {};
  if (!archetype || !Array.isArray(nodes) || !nodes.length)
    return res.status(400).json({ error: 'Missing archetype or nodes' });

  const today   = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const context = ARCHETYPE_CONTEXT[archetype] || archetype;

  const nodeLines = nodes.map(n => {
    const parts = [`id:${n.id}`, `type:${n.type}`, `label:"${n.label}"`];
    if (n.isUnread)    parts.push('UNREAD');
    if (n.isStale)     parts.push('STALE');
    if (n.subject)     parts.push(`subject:"${n.subject}"`);
    if (n.from)        parts.push(`from:"${n.from}"`);
    if (n.lastCommit)  parts.push(`lastCommit:${n.lastCommit}`);
    if (n.startRaw)    parts.push(`eventDate:${n.startRaw}`);
    if (n.followers != null) parts.push(`followers:${n.followers}`);
    if (n.emailCount)  parts.push(`emailCount:${n.emailCount}`);
    if (n.lastDate)    parts.push(`lastContact:${n.lastDate}`);
    if (n.lastEdited)  parts.push(`lastEdited:${n.lastEdited}`);
    return parts.join(' | ');
  }).join('\n');

  const prompt = `You are processing nodes for a student's personal intelligence graph.

Today: ${today}
Student: ${context}

For each node return TWO things:
1. score (0.0–1.0): how important/urgent this is RIGHT NOW
   0.9–1.0 = urgent (unread reply needed today, interview tomorrow, critical deadline)
   0.6–0.8 = important this week (active project, event soon, warm contact)
   0.3–0.5 = moderate (older activity, upcoming but not urgent)
   0.0–0.2 = low (stale, cold, informational only)

2. label (2–5 words): a specific, scannable name for this item
   Use the raw data fields (subject, from, eventDate, language, etc.) — not just the existing label
   Good labels: "Google SWE Interview", "AMCAS App Status", "Bio Lab Meeting", "Portfolio Redesign", "Sarah Johnson"
   Bad labels: "Email", "Research", "Meeting", "Unread", anything vague or incomplete

Nodes:
${nodeLines}

Reply with ONLY valid JSON, no explanation:
{"id1": {"score": 0.85, "label": "Google SWE Interview"}, "id2": {"score": 0.4, "label": "Bio Lab Meeting"}, ...}`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens:  1200,
      }),
    });

    const json  = await r.json();
    const raw   = json.choices?.[0]?.message?.content?.trim() || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};

    // parsed is { nodeId: { score, label } } — split into two maps for backwards compat
    const scores = {}, labels = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (typeof val === 'object' && val !== null) {
        if (val.score != null) scores[id] = val.score;
        if (val.label)         labels[id] = val.label;
      } else if (typeof val === 'number') {
        scores[id] = val; // handle old format gracefully
      }
    }

    return res.status(200).json({ scores, labels });
  } catch (err) {
    console.error('[score-nodes]', err);
    return res.status(200).json({ scores: {}, labels: {} });
  }
}
