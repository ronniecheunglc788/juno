import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from './_lib/supabase.js';
import { validateEmail, validatePassword, setCORSHeaders, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, email, password } = req.body || {};

  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Invalid reset link' });

  const emailErr = validateEmail(email?.trim?.());
  const passErr  = validatePassword(password);
  if (emailErr) return res.status(400).json({ error: emailErr });
  if (passErr)  return res.status(400).json({ error: passErr });

  const cleanEmail = email.trim().toLowerCase();
  const tokenHash  = crypto.createHash('sha256').update(token).digest('hex');

  const { data: user, error } = await supabase
    .from('users')
    .select('id, reset_token, reset_token_expires')
    .eq('email', cleanEmail)
    .maybeSingle();

  const invalid = () => res.status(400).json({ error: 'Reset link is invalid or has expired' });

  if (error || !user)                               return invalid();
  if (user.reset_token !== tokenHash)               return invalid();
  if (new Date(user.reset_token_expires) < new Date()) return invalid();

  const password_hash = await bcrypt.hash(password, 12);

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password_hash, reset_token: null, reset_token_expires: null })
    .eq('id', user.id);

  if (updateErr) return internalError(res, updateErr, 'Failed to update password');

  return res.status(200).json({ message: 'Password updated. You can now sign in.' });
}
