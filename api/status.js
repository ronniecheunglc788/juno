import { composio } from './_lib/composio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/status?entityId=xxx
  // Returns which apps are currently connected for this entity
  const { entityId } = req.query;
  if (!entityId) return res.status(400).json({ error: 'entityId required' });

  try {
    const entity = await composio.getEntity(entityId);
    const connections = await entity.getConnections();

    const connected = connections.map(c => ({
      app: c.appName?.toLowerCase(),
      status: c.status,
    }));

    return res.status(200).json({ connected });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
