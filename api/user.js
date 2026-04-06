import { supabase } from './_lib/supabase.js';
import { entityIdFromEmail } from './_lib/composio.js';
import { validateEmail, validateString, setCORSHeaders, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/user — create or return existing user
  if (req.method === 'POST') {
    const { name, email } = req.body || {};

    const nameErr  = validateString(name,  'Name',  { maxLength: 100 });
    const emailErr = validateEmail(email?.trim?.());
    if (nameErr)  return res.status(400).json({ error: nameErr });
    if (emailErr) return res.status(400).json({ error: emailErr });

    const cleanEmail = email.trim().toLowerCase();
    const entityId   = entityIdFromEmail(cleanEmail);

    const { data, error } = await supabase
      .from('users')
      .upsert(
        { email: cleanEmail, name: name.trim(), entity_id: entityId },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id, name, email, entity_id, archetype')
      .single();

    if (error) return internalError(res, error, 'Failed to create user');
    return res.status(200).json(data);
  }

  // GET /api/user?email=xxx — fetch existing user
  if (req.method === 'GET') {
    const email = req.query.email;
    const emailErr = validateEmail(email?.trim?.());
    if (emailErr) return res.status(400).json({ error: emailErr });

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, entity_id, archetype')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
