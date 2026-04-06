import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { userId, summary } = req.body;
  if (!userId || !summary) return res.status(400).json({ error: 'userId and summary required' });

  const { error } = await supabase
    .from('users')
    .update({ youtube_history: summary })
    .eq('id', userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
