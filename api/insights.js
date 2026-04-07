import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCORSHeaders, internalError } from './_lib/validate.js';

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

  const unreadEmails = (data.emails || [])
    .filter(e => e.isUnread)
    .slice(0, 10)
    .map(e => `- From: ${e.from} | Subject: ${e.subject}`);

  const allEmails = (data.emails || [])
    .slice(0, 6)
    .map(e => `- From: ${e.from} | Subject: ${e.subject} | Read: ${!e.isUnread}`);

  const events = (data.calendar || [])
    .slice(0, 8)
    .map(e => `- ${e.title} | ${e.dateLabel || 'Today'} ${e.time || ''}`);

  const repos = (data.github || [])
    .slice(0, 6)
    .map(r => `- ${r.name} (${r.language || 'unknown'}) | Last commit: ${r.lastCommit || 'never'}`);

  const notionPages = (data.notion || [])
    .slice(0, 5)
    .map(n => `- ${n.title}`);

  const archetypeContext = {
    engineer: 'Focus on GitHub activity, recruiting emails, and deadlines.',
    business: 'Focus on networking emails, opportunities, and upcoming meetings.',
    premed:   'Focus on application emails, research, academic deadlines, and study load.',
    creative: 'Focus on client emails, project files, deadlines, and creative work.',
  }[archetype] || '';

  const prompt = `You are Breeze, a personal AI assistant for college students. Analyze this student's real connected data and generate exactly 3 specific, useful, actionable insights. Mention real names, subjects, and dates from the data. Never be generic. If data is limited, still find something specific to say.

${archetypeContext}

Return ONLY a raw JSON array, no markdown, no explanation:
[{"type":"email|calendar|github|general","title":"short title under 8 words","body":"1-2 sentences, specific and useful"}]

STUDENT: ${name} (${archetype})

UNREAD EMAILS (${unreadEmails.length}):
${unreadEmails.join('\n') || '- none'}

RECENT EMAILS:
${allEmails.join('\n') || '- none'}

UPCOMING CALENDAR:
${events.join('\n') || '- no events'}

GITHUB REPOS:
${repos.join('\n') || '- none'}

NOTION PAGES:
${notionPages.join('\n') || '- none'}`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const insights = JSON.parse(clean);

    if (!Array.isArray(insights)) throw new Error('Bad response shape');

    return res.status(200).json({ insights: insights.slice(0, 3) });
  } catch (err) {
    return internalError(res, err, 'Failed to generate insights');
  }
}
