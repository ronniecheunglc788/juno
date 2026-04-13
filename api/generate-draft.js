import { setCORSHeaders, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { from, subject, snippet, archetype, userName } = req.body || {};

  if (!from && !subject) return res.status(400).json({ error: 'Missing email data' });

  const firstName = (userName || '').split(' ')[0] || 'me';

  const archetypeHint = {
    engineer: 'The student is a software engineer. Keep replies direct, technical when relevant.',
    business: 'The student is in business/finance. Keep replies professional and networking-oriented.',
    premed:   'The student is pre-med. Keep replies professional and focused on academic/research goals.',
    creative: 'The student is a creative professional. Keep replies warm and project-focused.',
  }[archetype] || '';

  const prompt = `You are a personal writing assistant for a college student named ${firstName}. Write a concise, professional email reply.

${archetypeHint}

Original email:
From: ${from || 'Unknown'}
Subject: ${subject || '(no subject)'}
Preview: ${snippet || '(no preview available)'}

Instructions:
- Write only the email body — no "Subject:", no "From:", no headers
- Keep it 3-5 sentences max
- Natural and professional, not overly formal
- End with a brief sign-off using just "${firstName}"
- Do not add placeholder text like "[Your Name]"

Reply:`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.65,
        max_tokens:  280,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    const body = data.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ body });
  } catch (err) {
    return internalError(res, err, 'Failed to generate draft');
  }
}
