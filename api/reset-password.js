import crypto from 'crypto';
import { Resend } from 'resend';
import { supabase } from './_lib/supabase.js';
import { validateEmail, setCORSHeaders, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  const emailErr = validateEmail(email?.trim?.());
  if (emailErr) return res.status(400).json({ error: emailErr });

  const cleanEmail = email.trim().toLowerCase();

  // Always respond the same way — don't leak whether the email exists
  const ok = { message: 'If an account exists for that email, a reset link has been sent.' };

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (!user) return res.status(200).json(ok);

  // Generate secure random token, store its SHA-256 hash
  const rawToken   = crypto.randomBytes(32).toString('hex');
  const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt  = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const { error: dbErr } = await supabase
    .from('users')
    .update({ reset_token: tokenHash, reset_token_expires: expiresAt })
    .eq('id', user.id);

  if (dbErr) return internalError(res, dbErr, 'Failed to generate reset token');

  // Build reset URL
  const protocol = req.headers.host?.startsWith('localhost') ? 'http' : 'https';
  const resetUrl = `${protocol}://${req.headers.host}/reset-confirm?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error('[breeze] RESEND_API_KEY not set — cannot send reset email');
    return internalError(res, 'no key', 'Email service not configured');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailErr2 } = await resend.emails.send({
    from:    'Breeze <onboarding@resend.dev>',
    to:      cleanEmail,
    subject: 'Reset your Breeze password',
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#111;">
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(0,0,0,0.3);margin-bottom:32px;">breeze</div>
        <h2 style="font-size:22px;font-weight:400;margin:0 0 12px;">Reset your password</h2>
        <p style="font-size:14px;color:rgba(0,0,0,0.55);line-height:1.6;margin:0 0 28px;">
          Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;background:rgba(10,10,10,0.88);color:#fff;text-decoration:none;border-radius:9px;font-size:14px;font-weight:500;">
          Reset password
        </a>
        <p style="font-size:12px;color:rgba(0,0,0,0.3);margin-top:32px;line-height:1.6;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
      </div>
    `,
  });

  if (emailErr2) return internalError(res, emailErr2, 'Failed to send reset email');

  return res.status(200).json(ok);
}
