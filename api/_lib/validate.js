// Shared input validation helpers

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateEmail(email) {
  if (typeof email !== 'string') return 'Email must be a string';
  if (email.length > 254)        return 'Email too long';
  if (!EMAIL_RE.test(email))     return 'Invalid email format';
  return null;
}

export function validateUUID(id, fieldName = 'id') {
  if (typeof id !== 'string') return `${fieldName} must be a string`;
  if (!UUID_RE.test(id))      return `${fieldName} is invalid`;
  return null;
}

export function validateString(value, fieldName, { maxLength = 500 } = {}) {
  if (typeof value !== 'string') return `${fieldName} must be a string`;
  if (value.length === 0)        return `${fieldName} is required`;
  if (value.length > maxLength)  return `${fieldName} too long`;
  return null;
}

// Restrict CORS to same Vercel deployment or localhost in dev
export function setCORSHeaders(req, res) {
  const origin = req.headers.origin || '';
  const allowed = process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`, 'http://localhost:5173']
    : ['http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Return a generic error message to client, log real error server-side
export function internalError(res, err, fallback = 'Something went wrong') {
  console.error('[breeze error]', err);
  return res.status(500).json({ error: fallback });
}
