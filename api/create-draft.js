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

    // If the cache didn't include threadId, resolve it now via a quick Gmail search
    let resolvedThreadId = threadId || '';
    if (!resolvedThreadId && subject) {
      try {
        const bare = subject.replace(/^(Re:|Fwd?:|FWD:|RE:)\s*/i, '').trim();
        const sr = await entity.execute({
          actionName: 'GMAIL_FETCH_EMAILS',
          params: { max_results: 1, query: `subject:"${bare}"` },
        });
        const msg = sr?.data?.messages?.[0];
        resolvedThreadId = msg?.threadId || msg?.thread_id || '';
      } catch {
        // non-fatal — create draft without threadId if lookup fails
      }
    }

    const result = await entity.execute({
      actionName: 'GMAIL_CREATE_EMAIL_DRAFT',
      params: {
        to,
        subject:   subject   || '',
        body:      body      || '',
        ...(resolvedThreadId ? { thread_id: resolvedThreadId } : {}),
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
