const FONT = "'DM Sans','Inter',system-ui,sans-serif";

export default function NodeDetail({ node, accent, onClose }) {
  if (!node) return null;

  return (
    <div style={{
      position:             'absolute',
      bottom:               28,
      right:                24,
      width:                292,
      background:           'rgba(5,7,12,0.96)',
      backdropFilter:       'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      border:               `1px solid rgba(255,255,255,0.07)`,
      borderTop:            `2px solid ${accent}55`,
      borderRadius:         14,
      padding:              '22px 22px 20px',
      boxShadow:            '0 32px 80px rgba(0,0,0,0.7)',
      fontFamily:           FONT,
      zIndex:               100,
      animation:            'nodeFadeIn 0.2s ease',
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          fontSize: 9, fontWeight: 500, letterSpacing: '1.4px',
          textTransform: 'uppercase', color: `${accent}99`,
        }}>
          {labelForType(node.type)}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)', border: 'none',
            borderRadius: '50%', width: 22, height: 22,
            cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <NodeContent node={node} accent={accent} />
    </div>
  );
}

function NodeContent({ node, accent }) {
  const d     = node.rawData || {};
  const title = d.name || d.subject || d.title || node.label || '—';
  const fields = getFields(node, d).filter(Boolean);

  return (
    <div>
      <div style={{
        fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.88)',
        lineHeight: 1.4, marginBottom: fields.length ? 16 : 0,
        fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
      }}>
        {title}
      </div>

      {fields.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map((f, i) => (
            <div key={i}>
              <div style={{
                fontSize: 9, fontWeight: 500, letterSpacing: '1.2px',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
                marginBottom: 3,
              }}>
                {f.label}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {node.statusLabel && (
        <div style={{
          display: 'inline-block', marginTop: 16,
          fontSize: 10, fontWeight: 500, letterSpacing: '0.4px',
          padding: '4px 11px', borderRadius: 20,
          background: `${accent}12`, color: `${accent}cc`,
          border: `1px solid ${accent}28`,
        }}>
          {node.statusLabel}
        </div>
      )}
    </div>
  );
}

function getFields(node, d) {
  const type = node.type;
  if (type === 'repo' || type === 'repo-stale') return [
    d.language    && { label: 'Language',    value: d.language },
    d.lastCommit  && { label: 'Last commit', value: relativeDate(d.lastCommit) },
    d.description && { label: 'Description', value: d.description },
  ];
  if (['recruit','recruit-r','app','res','acad','other','client'].includes(type)) return [
    d.from    && { label: 'From',    value: d.from },
    d.date    && { label: 'Date',    value: relativeDate(d.date) },
    d.snippet && { label: 'Preview', value: d.snippet.slice(0, 120) },
  ];
  if (['contact-warm','contact-mid','contact-cold'].includes(type)) return [
    d.email   && { label: 'Email',        value: d.email },
    d.date    && { label: 'Last contact', value: relativeDate(d.date) },
    d.subject && { label: 'Last email',   value: d.subject },
    d.count   && { label: 'Emails',       value: `${d.count} total` },
  ];
  if (type === 'opp') return [
    d.from    && { label: 'From',    value: d.from },
    d.date    && { label: 'Date',    value: relativeDate(d.date) },
    d.snippet && { label: 'Preview', value: d.snippet?.slice(0, 120) },
  ];
  if (type === 'event') return [
    d.dateLabel && { label: 'Date', value: d.dateLabel },
    d.time      && { label: 'Time', value: d.time },
  ];
  if (type === 'note') return [
    d.lastEdited && { label: 'Last edited', value: d.lastEdited },
  ];
  if (type === 'project') return [
    d.mimeType && { label: 'Type',   value: readableMime(d.mimeType) },
    d.source   && { label: 'Source', value: d.source },
  ];
  if (type === 'instagram') return [
    d.followers != null && { label: 'Followers', value: d.followers.toLocaleString() },
    d.following != null && { label: 'Following', value: d.following.toLocaleString() },
    d.posts     != null && { label: 'Posts',     value: d.posts },
    d.bio       && { label: 'Bio',       value: d.bio },
  ];
  return [];
}

function labelForType(type) {
  const map = {
    'repo': 'Repository', 'repo-stale': 'Repository',
    'recruit': 'Recruiting', 'recruit-r': 'Email',
    'contact-warm': 'Active contact', 'contact-mid': 'Contact', 'contact-cold': 'Cold contact',
    'opp': 'Opportunity', 'event': 'Event', 'note': 'Note',
    'app': 'Application', 'res': 'Research', 'acad': 'Academic', 'other': 'Email',
    'project': 'Project file', 'client': 'Client', 'instagram': 'Instagram',
  };
  return map[type] || type;
}

function relativeDate(str) {
  if (!str) return '—';
  const days = Math.floor((Date.now() - new Date(str).getTime()) / 86400000);
  if (days < 0)  return 'Upcoming';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return `${Math.floor(days/30)}mo ago`;
}

function readableMime(mime) {
  if (mime.includes('spreadsheet') || mime.includes('xlsx')) return 'Spreadsheet';
  if (mime.includes('presentation') || mime.includes('pptx')) return 'Presentation';
  if (mime.includes('document') || mime.includes('docx'))    return 'Document';
  if (mime.includes('figma'))  return 'Figma file';
  if (mime.includes('pdf'))    return 'PDF';
  return 'File';
}
