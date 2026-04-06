import WatchHistoryUpload from '../WatchHistoryUpload';

const P = {
  bg: '#F9F7F4', text: '#1A1A1A', mid: '#666', dim: '#AAA',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.08)',
  border: 'rgba(0,0,0,0.07)', card: '#fff',
};

const CREATIVE_KW = ['design', 'creative', 'brand', 'content', 'post', 'shoot', 'edit', 'video', 'photo',
  'portfolio', 'client', 'freelance', 'project', 'brief', 'feedback', 'revision', 'draft', 'publish',
  'launch', 'instagram', 'tiktok', 'youtube', 'newsletter', 'figma', 'pitch', 'deck', 'presentation',
  'icarus', 'breeze', 'insight', 'outreach', 'moats', 'mirror'];

const DRIVE_IGNORE = ['application/vnd.google-apps.folder'];

function driveIcon(mimeType) {
  if (mimeType.includes('spreadsheet') || mimeType.includes('xlsx')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('docx'))    return '📄';
  if (mimeType.includes('presentation') || mimeType.includes('pptx')) return '📋';
  if (mimeType.includes('json') || mimeType.includes('python') || mimeType.includes('script')) return '💻';
  return '📁';
}

function isRelevant(text) {
  return CREATIVE_KW.some(k => text.toLowerCase().includes(k));
}

function urgencyScore(em) {
  const s = (em.subject + ' ' + em.snippet).toLowerCase();
  let score = em.isUnread ? 3 : 0;
  if (['urgent', 'asap', 'deadline', 'today', 'immediately'].some(k => s.includes(k))) score += 5;
  if (['feedback', 'revision', 'review', 'approve'].some(k => s.includes(k))) score += 2;
  return score;
}

export default function CreativeBoard({ data, loading }) {
  if (loading) return <LoadingState />;

  const [ytHistory, setYtHistory] = useState(data?.youtubeHistory || null);
  const firstName = data?.user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const emails     = data?.emails || [];
  const drive      = (data?.drive || []).filter(f => !DRIVE_IGNORE.includes(f.mimeType));
  const notion     = data?.notion || [];
  const cal        = data?.calendar || [];
  const instagram  = data?.instagram;

  // Surface most relevant emails first
  const topEmails  = [...emails]
    .sort((a, b) => urgencyScore(b) - urgencyScore(a))
    .slice(0, 4);

  // Drive files — relevant ones first
  const relevantDrive = [
    ...drive.filter(f => isRelevant(f.name)),
    ...drive.filter(f => !isRelevant(f.name)),
  ].slice(0, 8);

  // Idea cards: relevant drive + notion pages
  const ideas = [
    ...relevantDrive.slice(0, 5).map(f => ({ label: f.name, tag: driveIcon(f.mimeType), source: 'drive' })),
    ...notion.slice(0, 3).map(n => ({ label: n.title, tag: '📝', source: 'notion', date: n.lastEdited })),
  ];

  const hero = topEmails[0];

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: '"Georgia", serif', color: P.text }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${P.border}`, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: P.accent, marginBottom: 4 }}>BREEZE · CREATIVE</div>
          <div style={{ fontSize: 22, fontWeight: 400, fontStyle: 'italic' }}>Good to see you, {firstName}.</div>
        </div>
        <div style={{ fontSize: 12, fontFamily: 'system-ui', color: P.dim }}>{today}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 73px)' }}>

        {/* Left: main content */}
        <div style={{ padding: '36px 40px', borderRight: `1px solid ${P.border}`, overflowY: 'auto' }}>

          {/* Instagram stat strip */}
          {instagram && (
            <div style={{ display: 'flex', gap: 24, marginBottom: 36, padding: '16px 20px', background: P.card, border: `1px solid ${P.border}`, borderRadius: 12 }}>
              <Stat label="Followers" value={instagram.followers.toLocaleString()} />
              <Stat label="Following" value={instagram.following.toLocaleString()} />
              <Stat label="Posts" value={instagram.posts} />
              {instagram.bio && <div style={{ fontSize: 13, fontFamily: 'system-ui', color: P.mid, alignSelf: 'center', marginLeft: 8, fontStyle: 'italic' }}>"{instagram.bio}"</div>}
            </div>
          )}

          {/* Instagram recent posts */}
          {instagram?.recentPosts?.length > 0 && (
            <>
              <div style={secHeader}>RECENT POSTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 36 }}>
                {instagram.recentPosts.map((p, i) => (
                  <div key={i} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    {p.url && <img src={p.url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
                    <div style={{ padding: '10px 12px' }}>
                      {p.caption && <div style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.4 }}>{p.caption}</div>}
                      <div style={{ fontSize: 11, fontFamily: 'system-ui', color: P.dim }}>♥ {p.likes} · 💬 {p.comments}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Top email needing attention */}
          {hero && (
            <>
              <div style={secHeader}>NEEDS ATTENTION</div>
              <div style={{ background: P.accentLight, border: `1px solid rgba(124,58,237,0.2)`, borderLeft: `4px solid ${P.accent}`, borderRadius: 12, padding: '20px 24px', marginBottom: 36 }}>
                <div style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>{hero.subject}</div>
                <div style={{ fontSize: 13, fontFamily: 'system-ui', color: P.mid }}>{hero.from}</div>
                {hero.snippet && <div style={{ fontSize: 13, color: P.mid, marginTop: 8, lineHeight: 1.6, fontStyle: 'italic' }}>"{hero.snippet.slice(0, 160)}"</div>}
              </div>
            </>
          )}

          {/* Drive + Notion ideas */}
          {ideas.length > 0 && (
            <>
              <div style={secHeader}>YOUR FILES & NOTES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ideas.map((item, i) => (
                  <div key={i} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{item.tag}</div>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: 'system-ui', lineHeight: 1.4 }}>{item.label}</div>
                      <div style={{ fontSize: 11, fontFamily: 'system-ui', color: P.dim, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!hero && ideas.length === 0 && !instagram && (
            <div style={{ fontSize: 15, color: P.mid, fontStyle: 'italic', paddingTop: 20 }}>
              Connect Instagram, Google Drive, or Gmail to populate your board.
            </div>
          )}
        </div>

        {/* Right: inbox + calendar */}
        <div style={{ padding: '36px 28px', overflowY: 'auto' }}>

          {/* Inbox */}
          {topEmails.length > 0 && (
            <>
              <div style={secHeader}>INBOX</div>
              {topEmails.map((em, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${em.isUnread ? P.accent : P.border}`, paddingLeft: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontFamily: 'system-ui', fontWeight: em.isUnread ? 600 : 400, lineHeight: 1.3, marginBottom: 4 }}>{em.subject}</div>
                  <div style={{ fontSize: 11, fontFamily: 'system-ui', color: P.dim }}>{em.from}</div>
                </div>
              ))}
            </>
          )}

          {/* Calendar */}
          <div style={{ ...secHeader, marginTop: topEmails.length ? 28 : 0 }}>COMING UP</div>
          {cal.length === 0 && <div style={{ fontSize: 13, fontFamily: 'system-ui', color: P.dim }}>No upcoming events.</div>}
          {cal.slice(0, 8).map((ev, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              {(i === 0 || cal[i - 1]?.dateLabel !== ev.dateLabel) && (
                <div style={{ fontSize: 10, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '1px', color: ev.isToday ? P.accent : P.dim, textTransform: 'uppercase', margin: '14px 0 6px' }}>
                  {ev.dateLabel}
                </div>
              )}
              <div style={{ borderLeft: `2px solid ${ev.isToday ? P.accent : P.border}`, paddingLeft: 12 }}>
                <div style={{ fontSize: 14 }}>{ev.title}</div>
                <div style={{ fontSize: 11, fontFamily: 'system-ui', color: P.dim, marginTop: 2 }}>{ev.time}</div>
              </div>
            </div>
          ))}
          {/* YouTube watch history */}
          <div style={{ marginTop: 28 }}>
            <WatchHistoryUpload
              userId={data?.user?.id}
              initialData={ytHistory}
              onUploaded={setYtHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'system-ui', color: P.text }}>{value}</div>
      <div style={{ fontSize: 11, fontFamily: 'system-ui', color: P.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

const secHeader = { fontSize: 10, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: P.dim, marginBottom: 16 };

function LoadingState() {
  return <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: P.dim, fontStyle: 'italic' }}>Loading your board…</div>;
}
