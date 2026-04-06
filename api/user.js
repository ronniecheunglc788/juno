import { supabase } from './_lib/supabase.js';
import { entityIdFromEmail } from './_lib/composio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/user — create or return existing user
  if (req.method === 'POST') {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    const entityId = entityIdFromEmail(email);

    // Upsert — if user already exists, just return them
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, name, entity_id: entityId }, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // GET /api/user?email=xxx — fetch existing user
  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return res.status(404).json({ error: 'user not found' });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'method not allowed' });
}
