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

  const prompt = `Score nodes for a student's personal intelligence graph. Higher score = closer to center = more important RIGHT NOW.

Today: ${today}
Student: ${context}

Scoring guide:
0.9–1.0 = urgent (unread reply needed today, interview/deadline tomorrow, critical application update)
0.6–0.8 = important this week (active project, event soon, warm contact, recent recruiting email)
0.3–0.5 = moderate (older activity, general contacts, upcoming but not urgent)
0.0–0.2 = low (stale, cold, informational only)

Nodes:
${nodeLines}

Reply with ONLY valid JSON mapping each id to its score, nothing else:
{"id1": 0.85, "id2": 0.4, ...}`;

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
        temperature: 0.2,
        max_tokens:  600,
      }),
    });

    const json  = await r.json();
    const raw   = json.choices?.[0]?.message?.content?.trim() || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    const scores = match ? JSON.parse(match[0]) : {};

    return res.status(200).json({ scores });
  } catch (err) {
    console.error('[score-nodes]', err);
    return res.status(200).json({ scores: {} }); // fail silently — heuristic scores stay
  }
}
