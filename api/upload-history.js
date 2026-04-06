import { supabase } from './_lib/supabase.js';
import { validateUUID, validateString, setCORSHeaders, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, summary } = req.body || {};

  const userIdErr  = validateUUID(userId, 'userId');
  const summaryErr = validateString(summary, 'summary', { maxLength: 50000 });
  if (userIdErr)  return res.status(400).json({ error: userIdErr });
  if (summaryErr) return res.status(400).json({ error: summaryErr });

  const { error } = await supabase
    .from('users')
    .update({ youtube_history: summary })
    .eq('id', userId);

  if (error) return internalError(res, error, 'Failed to save history');
  return res.status(200).json({ ok: true });
}
