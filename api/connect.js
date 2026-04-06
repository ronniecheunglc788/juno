import { composio } from './_lib/composio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/connect?entityId=xxx&app=gmail
  const { entityId, app } = req.query;
  if (!entityId || !app) return res.status(400).json({ error: 'entityId and app required' });

  try {
    const entity = await composio.getEntity(entityId);
    const connection = await entity.initiateConnection({
      appName: app,
      redirectUrl: `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:5173'}/join?connected=${app}`,
    });

    return res.status(200).json({ redirectUrl: connection.redirectUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
