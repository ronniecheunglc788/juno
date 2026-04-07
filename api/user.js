import bcrypt from 'bcryptjs';
import { supabase } from './_lib/supabase.js';
import { entityIdFromEmail } from './_lib/composio.js';
import {
  validateEmail, validatePassword, validateString,
  setCORSHeaders, internalError,
} from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── POST /api/user — register ────────────────────────────────────
  if (req.method === 'POST') {
    const { name, email, password } = req.body || {};

    const nameErr  = validateString(name,  'Name',  { maxLength: 100 });
    const emailErr = validateEmail(email?.trim?.());
    const passErr  = validatePassword(password);
    if (nameErr)  return res.status(400).json({ error: nameErr });
    if (emailErr) return res.status(400).json({ error: emailErr });
    if (passErr)  return res.status(400).json({ error: passErr });

    const cleanEmail = email.trim().toLowerCase();

    // Reject if email already registered
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });

    const password_hash = await bcrypt.hash(password, 12);
    const entityId      = entityIdFromEmail(cleanEmail);

    const { data, error } = await supabase
      .from('users')
      .insert({ email: cleanEmail, name: name.trim(), entity_id: entityId, password_hash })
      .select('id, name, email, entity_id, archetype')
      .single();

    if (error) return internalError(res, error, 'Failed to create account');
    return res.status(200).json(data);
  }

  // ── GET /api/user?email=&password= — login ───────────────────────
  if (req.method === 'GET') {
    const email    = req.query.email?.trim?.()?.toLowerCase?.();
    const password = req.query.password;

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    if (!password) return res.status(400).json({ error: 'Password required' });

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, entity_id, archetype, password_hash')
      .eq('email', email)
      .single();

    if (error || !data) return res.status(401).json({ error: 'No account found with that email' });

    // Account exists but was created before passwords were added
    if (!data.password_hash) {
      return res.status(401).json({ error: 'Please reset your password using "Forgot password?" to continue' });
    }

    const match = await bcrypt.compare(password, data.password_hash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    // Return user without the hash
    const { password_hash: _, ...user } = data;
    return res.status(200).json(user);
  }

  // ── PATCH /api/user — update archetype ──────────────────────────
  if (req.method === 'PATCH') {
    const { userId, archetype } = req.body || {};
    const valid = ['engineer', 'business', 'premed', 'creative'];
    if (!userId || !valid.includes(archetype)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    const { data, error } = await supabase
      .from('users')
      .update({ archetype })
      .eq('id', userId)
      .select('id, name, email, entity_id, archetype')
      .single();
    if (error) return internalError(res, error, 'Failed to update archetype');
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
