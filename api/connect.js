import { composio } from './_lib/composio.js';
import { validateString, setCORSHeaders, internalError } from './_lib/validate.js';

const ALLOWED_APPS = new Set([
  'gmail', 'googlecalendar', 'notion', 'slack', 'linkedin', 'github',
  'discord', 'twitterv2', 'instagram', 'youtube', 'googledrive',
  'googlesheets', 'todoist', 'asana', 'whatsapp', 'spotify', 'strava',
]);

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const entityId = req.query.entityId;
  const app      = req.query.app;

  const entityErr = validateString(entityId, 'entityId', { maxLength: 200 });
  if (entityErr) return res.status(400).json({ error: entityErr });

  if (!app || !ALLOWED_APPS.has(app)) {
    return res.status(400).json({ error: 'Invalid or unsupported app' });
  }

  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173';

  try {
    const entity     = await composio.getEntity(entityId);
    const connection = await entity.initiateConnection({
      appName:     app,
      redirectUrl: `${base}/join?connected=${app}`,
    });
    return res.status(200).json({ redirectUrl: connection.redirectUrl });
  } catch (err) {
    return internalError(res, err, 'Failed to initiate connection');
  }
}
