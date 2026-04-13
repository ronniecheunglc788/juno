import { waitUntil } from '@vercel/functions';
import { composio } from './_lib/composio.js';
import { supabase } from './_lib/supabase.js';
import { validateUUID, validateString, setCORSHeaders } from './_lib/validate.js';

// Per-source TTLs — slow-changing sources stay cached much longer
const TTL = {
  emails:    5  * 60 * 1000,  // 5 min
  calendar:  10 * 60 * 1000,  // 10 min
  notion:    30 * 60 * 1000,  // 30 min
  instagram: 30 * 60 * 1000,  // 30 min
  github:    60 * 60 * 1000,  // 60 min
  drive:     60 * 60 * 1000,  // 60 min
};

function parseFrom(fromStr = '') {
  const match = fromStr.match(/^(.*?)\s*<(.+)>$/);
  if (match) return { from: match[1].trim() || match[2], fromEmail: match[2] };
  return { from: fromStr, fromEmail: fromStr };
}

// Returns which source keys have gone past their TTL
function getStaleKeys(timestamps = {}) {
  const now = Date.now();
  return Object.keys(TTL).filter(key => {
    const t = timestamps[key];
    return !t || now - new Date(t).getTime() > TTL[key];
  });
}

function hasCachedData(user) {
  return !!(user.emails_cache || user.calendar_cache || user.notion_cache ||
            user.github_cache || user.drive_cache || user.instagram_cache);
}

function buildResponse(user, overrides = {}) {
  return {
    user:           { id: user.id, name: user.name, email: user.email, archetype: user.archetype },
    calendar:       overrides.calendar   ?? user.calendar_cache  ?? [],
    emails:         overrides.emails     ?? user.emails_cache    ?? [],
    notion:         overrides.notion     ?? user.notion_cache    ?? [],
    github:         overrides.github     ?? user.github_cache    ?? [],
    drive:          overrides.drive      ?? user.drive_cache     ?? [],
    instagram:      overrides.instagram  ?? user.instagram_cache ?? null,
    connectedApps:  overrides.connectedApps ?? user.connected_apps ?? [],
    youtubeHistory: user.youtube_history ?? null,
  };
}

// Fetches only the requested source keys and persists results to DB
async function fetchAndPersist(entityId, userId, keys, existingTimestamps = {}) {
  let entity;
  try {
    entity = await composio.getEntity(entityId);
  } catch (err) {
    console.error('[board-data] composio entity error', err);
    return {};
  }

  const fresh = {};

  await Promise.allSettled([

    keys.includes('emails') &&
      entity.execute({ actionName: 'GMAIL_FETCH_EMAILS', params: { max_results: 30 } })
        .then(r => {
          fresh.emails = (r?.data?.messages || []).map(m => ({
            subject:  m.subject || '(no subject)',
            ...parseFrom(m.sender || m.from || ''),
            date:     m.messageTimestamp || m.date || '',
            snippet:  (typeof m.preview === 'string' ? m.preview : m.preview?.body) || m.messageText?.slice(0, 120) || '',
            isUnread: m.labelIds?.includes('UNREAD') || false,
          }));
        }).catch(err => console.error('[board-data] gmail error', err)),

    keys.includes('calendar') &&
      (async () => {
        const now      = new Date();
        const twoWeeks = new Date(now.getTime() + 14 * 86400000);
        const r = await entity.execute({
          actionName: 'GOOGLECALENDAR_EVENTS_LIST',
          params: { calendarId: 'primary', maxResults: 40, timeMin: now.toISOString(), timeMax: twoWeeks.toISOString(), singleEvents: true, orderBy: 'startTime' },
        });
        const items = r?.data?.items || r?.data?.response_data?.items || [];
        fresh.calendar = items.map(e => {
          const startRaw = e.start?.dateTime || e.start?.date || '';
          if (!startRaw) return null;
          return { title: e.summary || 'Untitled', startRaw, isAllDay: !e.start?.dateTime };
        }).filter(Boolean).slice(0, 40);
      })().catch(err => console.error('[board-data] calendar error', err)),

    keys.includes('notion') &&
      entity.execute({ actionName: 'NOTION_SEARCH_NOTION_PAGE', params: { query: '' } })
        .then(r => {
          const pages = r?.data?.results || r?.data?.response_data?.results || [];
          fresh.notion = pages.map(p => ({
            title:      p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text || 'Untitled',
            lastEdited: p.last_edited_time ? new Date(p.last_edited_time).toLocaleDateString() : '',
          })).filter(p => p.title !== 'Untitled');
        }).catch(err => console.error('[board-data] notion error', err)),

    keys.includes('drive') &&
      entity.execute({ actionName: 'GOOGLEDRIVE_LIST_FILES', params: { pageSize: 20 } })
        .then(r => {
          fresh.drive = (r?.data?.files || []).map(f => ({ name: f.name, mimeType: f.mimeType || '', id: f.id }));
        }).catch(err => console.error('[board-data] drive error', err)),

    keys.includes('instagram') &&
      Promise.all([
        entity.execute({ actionName: 'INSTAGRAM_GET_USER_INFO',  params: {} }),
        entity.execute({ actionName: 'INSTAGRAM_GET_USER_MEDIA', params: { limit: 10 } }),
      ]).then(([infoR, mediaR]) => {
        const info  = infoR?.data || {};
        const posts = mediaR?.data?.data || [];
        fresh.instagram = {
          followers:   info.followers_count || 0,
          following:   info.follows_count   || 0,
          posts:       info.media_count     || 0,
          bio:         info.biography       || '',
          recentPosts: posts.map(p => ({
            caption:  p.caption?.slice(0, 100) || '',
            likes:    p.like_count     || 0,
            comments: p.comments_count || 0,
            type:     p.media_type     || '',
            url:      p.media_url      || '',
          })),
        };
      }).catch(err => console.error('[board-data] instagram error', err)),

    keys.includes('github') &&
      entity.execute({ actionName: 'GITHUB_REPOS_LIST_FOR_AUTHENTICATED_USER', params: { per_page: 20, sort: 'pushed' } })
        .then(r => {
          const repos  = Array.isArray(r?.data) ? r.data : r?.data?.repositories || [];
          const nowMs  = Date.now();
          fresh.github = repos.map(repo => ({
            name:       repo.name,
            language:   repo.language || 'Unknown',
            lastCommit: repo.pushed_at || repo.updated_at || '',
            isStale:    repo.pushed_at ? (nowMs - new Date(repo.pushed_at).getTime()) > 14 * 86400000 : true,
          })).slice(0, 15);
        }).catch(err => console.error('[board-data] github error', err)),

  ].filter(Boolean));

  // Also refresh connected apps list alongside any fetch
  let connectedApps;
  try {
    const connections = await entity.getConnections();
    connectedApps = connections.filter(c => c.status === 'ACTIVE').map(c => c.appName?.toLowerCase());
  } catch (err) {
    console.error('[board-data] connections error', err);
  }

  // Build updated timestamps — only mark sources that actually returned data
  const now = new Date().toISOString();
  const updatedTimestamps = { ...existingTimestamps };
  for (const key of keys) {
    if (fresh[key] !== undefined) updatedTimestamps[key] = now;
  }

  const dbUpdate = { cache_timestamps: updatedTimestamps, data_fetched_at: now };
  if (fresh.emails    !== undefined) dbUpdate.emails_cache    = fresh.emails;
  if (fresh.calendar  !== undefined) dbUpdate.calendar_cache  = fresh.calendar;
  if (fresh.notion    !== undefined) dbUpdate.notion_cache    = fresh.notion;
  if (fresh.drive     !== undefined) dbUpdate.drive_cache     = fresh.drive;
  if (fresh.instagram !== undefined) dbUpdate.instagram_cache = fresh.instagram;
  if (fresh.github    !== undefined) dbUpdate.github_cache    = fresh.github;
  if (connectedApps   !== undefined) dbUpdate.connected_apps  = connectedApps;

  const { error } = await supabase.from('users').update(dbUpdate).eq('id', userId);
  if (error) console.error('[board-data] cache write error', error);

  if (connectedApps !== undefined) fresh.connectedApps = connectedApps;
  return fresh;
}

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, entityId } = req.query;
  const userIdErr = validateUUID(userId, 'userId');
  const entityErr = validateString(entityId, 'entityId', { maxLength: 200 });
  if (userIdErr) return res.status(400).json({ error: userIdErr });
  if (entityErr) return res.status(400).json({ error: entityErr });

  const { data: user, error: userErr } = await supabase
    .from('users').select('*').eq('id', userId).single();
  if (userErr) return res.status(404).json({ error: 'User not found' });

  const timestamps = user.cache_timestamps || {};
  const stale      = getStaleKeys(timestamps);

  // Case 1: everything is fresh — serve cache instantly
  if (stale.length === 0) {
    return res.status(200).json({ ...buildResponse(user), fromCache: true });
  }

  // Case 2: have some cache, some sources are stale — serve cache NOW, refresh in background
  if (hasCachedData(user)) {
    waitUntil(fetchAndPersist(entityId, userId, stale, timestamps));
    return res.status(200).json({ ...buildResponse(user), fromCache: true });
  }

  // Case 3: no cache at all (first load) — must wait for fresh data
  const fresh = await fetchAndPersist(entityId, userId, Object.keys(TTL), timestamps);
  return res.status(200).json({ ...buildResponse(user, fresh), fromCache: false });
}
