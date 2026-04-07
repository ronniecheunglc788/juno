// Slide-in detail panel for a selected force-graph node

export default function NodeDetail({ node, accent, onClose }) {
  if (!node) return null;

  return (
    <div style={{
      position:   'absolute',
      bottom:     72,
      right:      24,
      width:      300,
      background: 'rgba(6,8,14,0.94)',
      backdropFilter:       'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border:     `1px solid ${accent}28`,
      borderRadius: 14,
      padding:    '20px 22px',
      boxShadow:  '0 24px 64px rgba(0,0,0,0.6)',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      zIndex:     100,
      animation:  'nodeFadeIn 0.18s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color:         accent,
          opacity:       0.7,
        }}>
          {labelForType(node.type)}
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.25)', fontSize: 16, padding: 0, lineHeight: 1,
        }}>
          ×
        </button>
      </div>

      <NodeContent node={node} accent={accent} />
    </div>
  );
}

function NodeContent({ node, accent }) {
  const d = node.rawData || {};

  // Title
  const title = d.name || d.subject || d.title || node.label || '—';

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4, marginBottom: 12 }}>
        {title}
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {getFields(node, d).map((f, i) => f && (
          <div key={i}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 2 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5 }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* Status pill */}
      {node.statusLabel && (
        <div style={{
          display: 'inline-block', marginTop: 14,
          fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
          padding: '4px 10px', borderRadius: 20,
          background: accent + '18', color: accent,
          border: `1px solid ${accent}30`,
        }}>
          {node.statusLabel}
        </div>
      )}
    </div>
  );
}

function getFields(node, d) {
  const type = node.type;

  // Repo
  if (type === 'repo' || type === 'repo-stale') return [
    d.language    && { label: 'Language',    value: d.language },
    d.lastCommit  && { label: 'Last commit', value: relativeDate(d.lastCommit) },
    d.description && { label: 'Description', value: d.description },
  ];

  // Recruiting / email-type
  if (type === 'recruit' || type === 'recruit-r' || type === 'app' || type === 'res' || type === 'acad' || type === 'other' || type === 'client') return [
    d.from    && { label: 'From',    value: d.from },
    d.date    && { label: 'Date',    value: relativeDate(d.date) },
    d.snippet && { label: 'Preview', value: d.snippet.slice(0, 120) },
  ];

  // Contact (business)
  if (type === 'contact-warm' || type === 'contact-mid' || type === 'contact-cold') return [
    d.email   && { label: 'Email',        value: d.email },
    d.date    && { label: 'Last contact', value: relativeDate(d.date) },
    d.subject && { label: 'Last email',   value: d.subject },
    d.count   && { label: 'Emails',       value: `${d.count} total` },
  ];

  // Opportunity
  if (type === 'opp') return [
    d.from    && { label: 'From',    value: d.from },
    d.date    && { label: 'Date',    value: relativeDate(d.date) },
    d.snippet && { label: 'Preview', value: d.snippet?.slice(0, 120) },
  ];

  // Event
  if (type === 'event') return [
    d.dateLabel && { label: 'Date', value: d.dateLabel },
    d.time      && { label: 'Time', value: d.time },
  ];

  // Notion note
  if (type === 'note') return [
    d.lastEdited && { label: 'Last edited', value: d.lastEdited },
  ];

  // Project (drive file)
  if (type === 'project') return [
    d.mimeType && { label: 'Type',   value: readableMime(d.mimeType) },
    d.source   && { label: 'Source', value: d.source },
  ];

  // Instagram
  if (type === 'instagram') return [
    d.followers != null && { label: 'Followers', value: d.followers.toLocaleString() },
    d.following != null && { label: 'Following', value: d.following.toLocaleString() },
    d.posts     != null && { label: 'Posts',     value: d.posts },
    d.bio       && { label: 'Bio', value: d.bio },
  ];

  return [];
}

function labelForType(type) {
  const map = {
    'repo': 'Repository', 'repo-stale': 'Repository (stale)',
    'recruit': 'Recruiting email', 'recruit-r': 'Email',
    'contact-warm': 'Active contact', 'contact-mid': 'Contact', 'contact-cold': 'Cold contact',
    'opp': 'Opportunity', 'event': 'Calendar event', 'note': 'Notion page',
    'app': 'Application', 'res': 'Research', 'acad': 'Academic', 'other': 'Email',
    'project': 'Project file', 'client': 'Client email', 'instagram': 'Instagram',
  };
  return map[type] || type;
}

function relativeDate(str) {
  if (!str) return '—';
  const days = Math.floor((Date.now() - new Date(str).getTime()) / 86400000);
  if (days < 0)  return 'Upcoming';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return `${Math.floor(days/30)}mo ago`;
}

function readableMime(mime) {
  if (mime.includes('spreadsheet') || mime.includes('xlsx')) return 'Spreadsheet';
  if (mime.includes('presentation') || mime.includes('pptx')) return 'Presentation';
  if (mime.includes('document') || mime.includes('docx'))    return 'Document';
  if (mime.includes('figma'))    return 'Figma file';
  if (mime.includes('pdf'))      return 'PDF';
  return 'File';
}
