import { composio }                              from './_lib/composio.js';
import { setCORSHeaders, validateString, internalError } from './_lib/validate.js';

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { entityId, to, subject, body, threadId } = req.body || {};

  const entityErr = validateString(entityId, 'entityId', { maxLength: 200 });
  if (entityErr) return res.status(400).json({ error: entityErr });
  if (!to)       return res.status(400).json({ error: 'Recipient (to) is required' });

  try {
    const entity = await composio.getEntity(entityId);
    const result = await entity.execute({
      actionName: 'GMAIL_CREATE_EMAIL_DRAFT',
      params: {
        to,
        subject:   subject   || '',
        body:      body      || '',
        ...(threadId ? { thread_id: threadId } : {}),
      },
    });

    // Extract the message ID so the client can deep-link straight to the draft
    const raw = result?.data || result || {};
    const messageId =
      raw.messageId ||
      raw.id        ||
      raw.message?.id ||
      raw.data?.messageId ||
      raw.data?.id ||
      raw.data?.message?.id ||
      null;

    return res.status(200).json({ success: true, messageId, data: raw });
  } catch (err) {
    return internalError(res, err, 'Failed to create Gmail draft');
  }
}
