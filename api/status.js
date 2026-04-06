import { composio } from './_lib/composio.js';
import { validateString, setCORSHeaders, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const entityId = req.query.entityId;
  const entityErr = validateString(entityId, 'entityId', { maxLength: 200 });
  if (entityErr) return res.status(400).json({ error: entityErr });

  try {
    const entity      = await composio.getEntity(entityId);
    const connections = await entity.getConnections();
    const connected   = connections.map(c => ({
      app:    c.appName?.toLowerCase(),
      status: c.status,
    }));
    return res.status(200).json({ connected });
  } catch (err) {
    return internalError(res, err, 'Failed to fetch connection status');
  }
}
