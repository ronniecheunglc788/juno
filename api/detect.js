import { composio } from './_lib/composio.js';
import { supabase } from './_lib/supabase.js';

// ── Keyword sets for each archetype ──────────────────────────────────────────
const SIGNALS = {
  premed: [
    'mcat', 'shadowing', 'clinical', 'hospital', 'patient', 'pre-med', 'premed',
    'orgo', 'biochem', 'amcas', 'mcas', 'medical school', 'volunteer hours',
    'research hours', 'physician', 'attending', 'rotation',
  ],
  cs: [
    'github', 'leetcode', 'pull request', 'commit', 'deploy', 'bug', 'sprint',
    'hackathon', 'internship', 'swe', 'software engineer', 'cs', 'coding',
    'repo', 'stack overflow', 'docker', 'api', 'backend', 'frontend',
  ],
  business: [
    'networking', 'coffee chat', 'linkedin', 'recruiter', 'consulting',
    'case interview', 'investment banking', 'private equity', 'venture',
    'pitch', 'startup', 'entrepreneur', 'business', 'finance', 'excel',
  ],
  creative: [
    'instagram', 'tiktok', 'youtube', 'figma', 'portfolio', 'design',
    'brand', 'content', 'post', 'shoot', 'edit', 'creative brief',
    'client', 'freelance', 'aesthetic', 'newsletter', 'substack',
  ],
  senior: [
    'graduation', 'senior thesis', 'job offer', 'grad school', 'gap year',
    'apartment', 'post-grad', 'offer letter', 'moving', 'last semester',
    'final semester', 'commencement', 'alumni',
  ],
};

function scoreText(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

function detectArchetype(signals) {
  // signals: array of strings (email subjects, calendar titles, notion pages)
  const combined = signals.join(' ').toLowerCase();
  const scores = {};
  for (const [archetype, keywords] of Object.entries(SIGNALS)) {
    scores[archetype] = scoreText(combined, keywords);
  }

  // Bonus: connected apps are strong signals
  if (signals.includes('__app:github'))    scores.cs       += 8;
  if (signals.includes('__app:discord'))   scores.cs       += 5;
  if (signals.includes('__app:linkedin'))  scores.business += 6;
  if (signals.includes('__app:asana'))     scores.business += 3;
  if (signals.includes('__app:instagram')) scores.creative += 7;
  if (signals.includes('__app:twitterv2')) scores.creative += 5;
  if (signals.includes('__app:youtube'))   scores.creative += 6;
  if (signals.includes('__app:spotify'))   scores.creative += 2;
  if (signals.includes('__app:strava'))    scores.premed   += 3;
  if (signals.includes('__app:todoist'))   scores.cs       += 2;

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  // If nothing matched at all, default to senior (most generic)
  return winner[1] > 0 ? winner[0] : 'senior';
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { entityId, userId } = req.body;
  if (!entityId || !userId) return res.status(400).json({ error: 'entityId and userId required' });

  try {
    const entity = await composio.getEntity(entityId);

    // Collect text signals from connected apps
    const signals = [];

    // Which apps are connected — add as explicit signals
    const connections = await entity.getConnections();
    for (const conn of connections) {
      signals.push(`__app:${conn.appName?.toLowerCase()}`);
    }

    // Fetch Gmail subjects (last 30 emails)
    try {
      const gmailResult = await entity.execute({
        actionName: 'GMAIL_FETCH_EMAILS',
        params: { max_results: 30 },
      });
      const emails = gmailResult?.data?.messages || gmailResult?.response_data?.messages || [];
      emails.forEach(e => { if (e.subject) signals.push(e.subject); });
    } catch (_) {}

    // Fetch Calendar event titles (next 30 events)
    try {
      const calResult = await entity.execute({
        actionName: 'GOOGLECALENDAR_LIST_EVENTS',
        params: { max_results: 30 },
      });
      const events = calResult?.data?.items || calResult?.response_data?.items || [];
      events.forEach(e => { if (e.summary) signals.push(e.summary); });
    } catch (_) {}

    // Fetch Notion page titles
    try {
      const notionResult = await entity.execute({
        actionName: 'NOTION_SEARCH_PAGES',
        params: { query: '' },
      });
      const pages = notionResult?.data?.results || notionResult?.response_data?.results || [];
      pages.forEach(p => {
        const title = p.properties?.title?.title?.[0]?.plain_text;
        if (title) signals.push(title);
      });
    } catch (_) {}

    const archetype = detectArchetype(signals);

    // Save archetype to Supabase
    await supabase.from('users').update({ archetype }).eq('id', userId);

    return res.status(200).json({ archetype, signals_used: signals.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
