import { createClient } from '@supabase/supabase-js';

// Service role key bypasses RLS — only used server-side in API routes, never sent to the browser
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
