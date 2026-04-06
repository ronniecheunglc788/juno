import { composio } from './_lib/composio.js';
import { supabase } from './_lib/supabase.js';
import { validateUUID, validateString, setCORSHeaders, internalError } from './_lib/validate.js';

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

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { entityId, userId } = req.body || {};

  const userIdErr = validateUUID(userId, 'userId');
  const entityErr = validateString(entityId, 'entityId', { maxLength: 200 });
  if (userIdErr) return res.status(400).json({ error: userIdErr });
  if (entityErr) return res.status(400).json({ error: entityErr });

  try {
    // Check if we already have fresh cached data from a recent board load
    const { data: user } = await supabase
      .from('users')
      .select('emails_cache, calendar_cache, notion_cache, connected_apps, data_fetched_at')
      .eq('id', userId)
      .single();

    const hasFreshCache = user?.data_fetched_at &&
      Date.now() - new Date(user.data_fetched_at).getTime() < CACHE_TTL_MS;

    const signals = [];

    if (hasFreshCache) {
      // Use cached data — no Composio calls needed
      (user.connected_apps || []).forEach(app => signals.push(`__app:${app}`));
      (user.emails_cache   || []).forEach(e => { if (e.subject) signals.push(e.subject); });
      (user.calendar_cache || []).forEach(e => { if (e.title)   signals.push(e.title);   });
      (user.notion_cache   || []).forEach(p => { if (p.title)   signals.push(p.title);   });
    } else {
      // No cache — fetch from Composio
      const entity = await composio.getEntity(entityId);

      const connections = await entity.getConnections();
      connections.forEach(conn => signals.push(`__app:${conn.appName?.toLowerCase()}`));

      await Promise.allSettled([
        entity.execute({ actionName: 'GMAIL_FETCH_EMAILS', params: { max_results: 30 } })
          .then(r => {
            const emails = r?.data?.messages || [];
            emails.forEach(e => { if (e.subject) signals.push(e.subject); });
          }).catch(err => console.error('[detect] gmail error', err)),

        entity.execute({ actionName: 'GOOGLECALENDAR_EVENTS_LIST', params: { calendarId: 'primary', maxResults: 30 } })
          .then(r => {
            const events = r?.data?.items || [];
            events.forEach(e => { if (e.summary) signals.push(e.summary); });
          }).catch(err => console.error('[detect] calendar error', err)),

        entity.execute({ actionName: 'NOTION_SEARCH_NOTION_PAGE', params: { query: '' } })
          .then(r => {
            const pages = r?.data?.results || [];
            pages.forEach(p => {
              const title = p.properties?.title?.title?.[0]?.plain_text;
              if (title) signals.push(title);
            });
          }).catch(err => console.error('[detect] notion error', err)),
      ]);
    }

    const archetype = detectArchetype(signals);

    const { error: updateErr } = await supabase
      .from('users').update({ archetype }).eq('id', userId);
    if (updateErr) console.error('[detect] archetype save error', updateErr);

    return res.status(200).json({ archetype, signals_used: signals.length, fromCache: hasFreshCache });
  } catch (err) {
    return internalError(res, err, 'Failed to detect archetype');
  }
}
