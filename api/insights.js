import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCORSHeaders } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI not configured' });
  }

  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: 'No data provided' });

  const name      = data.user?.name?.split(' ')[0] || 'Student';
  const archetype = data.user?.archetype || 'engineer';

  // Format calendar — handle both new (startRaw) and old (dateLabel/time) formats
  const events = (data.calendar || []).slice(0, 8).map(e => {
    let when = e.dateLabel || '';
    let time = e.time || '';
    if (!when && e.startRaw) {
      const d = new Date(e.startRaw);
      when = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      time = e.isAllDay ? 'All day' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return `- ${e.title} | ${when} ${time}`.trim();
  });

  const unreadEmails = (data.emails || [])
    .filter(e => e.isUnread).slice(0, 10)
    .map(e => `- From: ${e.from} | Subject: ${e.subject}`);

  const allEmails = (data.emails || []).slice(0, 6)
    .map(e => `- From: ${e.from} | Subject: ${e.subject}`);

  const repos = (data.github || []).slice(0, 6)
    .map(r => `- ${r.name} (${r.language || '?'}) | Last commit: ${r.lastCommit || 'never'}`);

  const notionPages = (data.notion || []).slice(0, 5).map(n => `- ${n.title}`);

  const archetypeContext = {
    engineer: 'Focus on GitHub activity, recruiting emails, and deadlines.',
    business: 'Focus on networking emails, opportunities, and upcoming meetings.',
    premed:   'Focus on application emails, research, and academic deadlines.',
    creative: 'Focus on client emails, project files, and deadlines.',
  }[archetype] || '';

  const prompt = `You are Breeze, a personal AI assistant for college students. Analyze this student's real connected data and generate exactly 3 specific, useful, actionable insights. Mention real names, subjects, and dates from the data. Never be generic.

${archetypeContext}

Return ONLY a valid JSON array with exactly 3 objects, nothing else:
[{"type":"email","title":"short title","body":"1-2 sentences"},{"type":"calendar","title":"...","body":"..."},{"type":"general","title":"...","body":"..."}]

Valid types: email, calendar, github, general

STUDENT: ${name} (${archetype})

UNREAD EMAILS (${unreadEmails.length}):
${unreadEmails.join('\n') || '- none'}

ALL RECENT EMAILS:
${allEmails.join('\n') || '- none'}

UPCOMING CALENDAR:
${events.join('\n') || '- no events'}

GITHUB REPOS:
${repos.join('\n') || '- none'}

NOTION PAGES:
${notionPages.join('\n') || '- none'}`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    // Strip markdown fences if Gemini wraps it anyway
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract JSON array even if there's extra text around it
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`No JSON array in response: ${clean.slice(0, 200)}`);

    const insights = JSON.parse(match[0]);
    if (!Array.isArray(insights)) throw new Error('Response is not an array');

    return res.status(200).json({ insights: insights.slice(0, 3) });
  } catch (err) {
    console.error('[insights error]', err);
    // Return the real error message so we can debug from the UI
    return res.status(500).json({ error: err.message || 'Failed to generate insights' });
  }
}
