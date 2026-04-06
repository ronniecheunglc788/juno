import { composio } from './_lib/composio.js';
import { supabase } from './_lib/supabase.js';

function parseFrom(fromStr = '') {
  const match = fromStr.match(/^(.*?)\s*<(.+)>$/);
  if (match) return { from: match[1].trim() || match[2], fromEmail: match[2] };
  return { from: fromStr, fromEmail: fromStr };
}

function calendarLabel(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((d - now) / 86400000);
  if (diff < 0)   return null;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { userId, entityId } = req.query;
  if (!userId || !entityId) return res.status(400).json({ error: 'userId and entityId required' });

  const { data: user, error: userErr } = await supabase
    .from('users').select('*').eq('id', userId).single();
  if (userErr) return res.status(404).json({ error: 'user not found' });

  const result = {
    user: { id: user.id, name: user.name, email: user.email, archetype: user.archetype },
    calendar: [], emails: [], notion: [], github: [],
    drive: [], instagram: null, connectedApps: [],
    youtubeHistory: user.youtube_history || null,
  };

  let entity;
  try {
    entity = await composio.getEntity(entityId);
    const connections = await entity.getConnections();
    result.connectedApps = connections
      .filter(c => c.status === 'ACTIVE')
      .map(c => c.appName?.toLowerCase());
  } catch (_) {
    return res.status(200).json(result);
  }

  // Gmail
  try {
    const r = await entity.execute({ actionName: 'GMAIL_FETCH_EMAILS', params: { max_results: 30 } });
    const msgs = r?.data?.messages || [];
    result.emails = msgs.map(m => ({
      subject:  m.subject || '(no subject)',
      ...parseFrom(m.sender || m.from || ''),
      date:     m.messageTimestamp || m.date || '',
      snippet:  (typeof m.preview === 'string' ? m.preview : m.preview?.body) || m.messageText?.slice(0, 120) || '',
      isUnread: m.labelIds?.includes('UNREAD') || false,
    }));
  } catch (_) {}

  // Google Calendar — correct action name
  try {
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 86400000);
    const r = await entity.execute({
      actionName: 'GOOGLECALENDAR_EVENTS_LIST',
      params: { calendarId: 'primary', maxResults: 40, timeMin: now.toISOString(), timeMax: twoWeeks.toISOString() },
    });
    const items = r?.data?.items || [];
    result.calendar = items
      .map(e => {
        const dateStr = e.start?.dateTime || e.start?.date || '';
        const label = calendarLabel(dateStr);
        if (!label) return null;
        const d = new Date(dateStr);
        return {
          title:     e.summary || 'Untitled',
          date:      dateStr,
          dateLabel: label,
          time:      dateStr.includes('T')
                     ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                     : 'All day',
          daysUntil: Math.floor((d - new Date()) / 86400000),
          isToday:   label === 'Today',
        };
      })
      .filter(Boolean)
      .slice(0, 30);
  } catch (_) {}

  // Notion — correct action name
  try {
    const r = await entity.execute({ actionName: 'NOTION_SEARCH_NOTION_PAGE', params: { query: '' } });
    const pages = r?.data?.results || r?.data?.response_data?.results || [];
    result.notion = pages.map(p => ({
      title:      p.properties?.title?.title?.[0]?.plain_text
               || p.properties?.Name?.title?.[0]?.plain_text
               || 'Untitled',
      lastEdited: p.last_edited_time
               ? new Date(p.last_edited_time).toLocaleDateString()
               : '',
    })).filter(p => p.title !== 'Untitled');
  } catch (_) {}

  // Google Drive
  try {
    const r = await entity.execute({ actionName: 'GOOGLEDRIVE_LIST_FILES', params: { pageSize: 20 } });
    result.drive = (r?.data?.files || []).map(f => ({
      name:     f.name,
      mimeType: f.mimeType || '',
      id:       f.id,
    }));
  } catch (_) {}

  // Instagram
  try {
    const [infoR, mediaR] = await Promise.all([
      entity.execute({ actionName: 'INSTAGRAM_GET_USER_INFO', params: {} }),
      entity.execute({ actionName: 'INSTAGRAM_GET_USER_MEDIA', params: { limit: 10 } }),
    ]);
    const info  = infoR?.data || {};
    const posts = mediaR?.data?.data || [];
    result.instagram = {
      followers: info.followers_count || 0,
      following: info.follows_count   || 0,
      posts:     info.media_count     || 0,
      bio:       info.biography       || '',
      recentPosts: posts.map(p => ({
        caption:   p.caption?.slice(0, 100) || '',
        likes:     p.like_count     || 0,
        comments:  p.comments_count || 0,
        type:      p.media_type     || '',
        url:       p.media_url      || '',
      })),
    };
  } catch (_) {}

  // GitHub
  try {
    const r = await entity.execute({ actionName: 'GITHUB_REPO_S_LIST_FOR_AUTHENTICATED_USER', params: { per_page: 20, sort: 'pushed' } });
    const repos = Array.isArray(r?.data) ? r.data : r?.data?.repositories || [];
    const now = Date.now();
    result.github = repos.map(repo => ({
      name:       repo.name,
      language:   repo.language || 'Unknown',
      lastCommit: repo.pushed_at || repo.updated_at || '',
      isStale:    repo.pushed_at
                  ? (now - new Date(repo.pushed_at).getTime()) > 14 * 86400000
                  : true,
    })).slice(0, 15);
  } catch (_) {}

  return res.status(200).json(result);
}
