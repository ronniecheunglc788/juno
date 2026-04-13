import { useState, useEffect } from 'react';

const FONT = "'DM Sans','Inter',system-ui,sans-serif";

function getUser() {
  try { return JSON.parse(localStorage.getItem('breeze_user') || '{}'); } catch { return {}; }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DraftCompose({ email, accent = '#2563EB', onClose }) {
  const [expanded,   setExpanded]   = useState(false);
  const [minimized,  setMinimized]  = useState(false);
  const [subject,    setSubject]    = useState(`Re: ${email?.subject || ''}`);
  const [body,       setBody]       = useState('');
  const [generating, setGenerating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const user = getUser();

  // Generate draft immediately on mount
  useEffect(() => {
    if (!email) { setGenerating(false); return; }
    fetch('/api/generate-draft', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:      email.from,
        subject:   email.subject,
        snippet:   email.snippet,
        archetype: user.archetype,
        userName:  user.name,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.body) setBody(d.body);
        else        setError('Could not generate draft.');
      })
      .catch(() => setError('Could not generate draft.'))
      .finally(() => setGenerating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/create-draft', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: user.entity_id,
          to:       email?.fromEmail || email?.from || '',
          subject,
          body,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create draft');
      const gmailUrl = d.messageId
        ? `https://mail.google.com/mail/u/0/#drafts/${d.messageId}`
        : 'https://mail.google.com/mail/u/0/#drafts';
      window.open(gmailUrl, '_blank');
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // ── Minimized strip ───────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div
        style={{
          position: 'fixed', bottom: 0, right: 24, zIndex: 9999,
          width: 296,
          background: 'rgba(12,12,14,0.94)',
          borderRadius: '10px 10px 0 0',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.2)',
          fontFamily: FONT,
          animation: 'compose-in 0.18s ease',
        }}
        onClick={() => setMinimized(false)}
      >
        <span style={{
          fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.82)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          Draft — {email?.from || 'Email'}
        </span>
        <HeaderBtn onClick={e => { e.stopPropagation(); setMinimized(false); }}>
          <ExpandIcon />
        </HeaderBtn>
        <HeaderBtn onClick={e => { e.stopPropagation(); onClose(); }}>×</HeaderBtn>
      </div>
    );
  }

  // ── Expanded (full-width centered) vs compact (bottom-right) ─────────────
  const panelStyle = expanded ? {
    position:     'fixed',
    top:          68,
    left:         '50%',
    transform:    'translateX(-50%)',
    width:        'min(860px, calc(100vw - 48px))',
    bottom:       0,
    borderRadius: '14px 14px 0 0',
    boxShadow:    '0 -4px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.07)',
    zIndex:       9999,
    display:      'flex',
    flexDirection:'column',
    fontFamily:   FONT,
    overflow:     'hidden',
    animation:    'compose-in 0.2s ease',
  } : {
    position:     'fixed',
    bottom:       0,
    right:        24,
    width:        484,
    height:       548,
    borderRadius: '14px 14px 0 0',
    boxShadow:    '0 8px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.07)',
    zIndex:       9999,
    display:      'flex',
    flexDirection:'column',
    fontFamily:   FONT,
    overflow:     'hidden',
    animation:    'compose-in 0.2s ease',
  };

  const isDisabled = generating || submitting || !body.trim();

  return (
    <div style={panelStyle}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div
        style={{
          background:    'rgba(12,12,14,0.94)',
          padding:       '10px 14px',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          flexShrink:    0,
          userSelect:    'none',
          backdropFilter:'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onDoubleClick={() => setMinimized(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: accent, opacity: 0.8, flexShrink: 0,
          }} />
          <span style={{
            color: 'rgba(255,255,255,0.82)', fontSize: 13,
            fontWeight: 500, letterSpacing: '0.05px',
          }}>
            Draft Reply
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <HeaderBtn onClick={() => setMinimized(true)} title="Minimize">—</HeaderBtn>
          <HeaderBtn onClick={() => setExpanded(e => !e)} title={expanded ? 'Compact' : 'Expand'}>
            {expanded ? <CompressIcon /> : <ExpandIcon />}
          </HeaderBtn>
          <HeaderBtn onClick={onClose} title="Close">×</HeaderBtn>
        </div>
      </div>

      {/* ── Address fields ────────────────────────────────────────── */}
      <div style={{
        background:    '#FFFFFF',
        borderBottom:  '1px solid rgba(0,0,0,0.07)',
        flexShrink:    0,
      }}>
        <FieldRow label="To">
          <span style={{
            fontSize: 13.5, color: 'rgba(0,0,0,0.62)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {email?.fromEmail || email?.from || '—'}
          </span>
        </FieldRow>
        <FieldRow label="Subject" noBorder>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13.5, color: 'rgba(0,0,0,0.75)',
              fontFamily: FONT, background: 'transparent',
              minWidth: 0,
            }}
          />
        </FieldRow>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        {generating ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 16,
          }}>
            <div style={{
              width: 28, height: 28,
              border: `2.5px solid ${accent}18`,
              borderTop: `2.5px solid ${accent}`,
              borderRadius: '50%',
              animation: 'spin 0.75s linear infinite',
            }} />
            <span style={{
              fontSize: 12, color: 'rgba(0,0,0,0.3)',
              letterSpacing: '0.4px', fontWeight: 400,
            }}>
              Drafting your reply…
            </span>
          </div>
        ) : (
          <textarea
            autoFocus
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Your reply…"
            style={{
              width: '100%', height: '100%',
              border: 'none', outline: 'none', resize: 'none',
              padding: '22px 26px',
              fontFamily: FONT, fontSize: 14,
              color: 'rgba(0,0,0,0.72)', lineHeight: 1.72,
              boxSizing: 'border-box', background: 'transparent',
            }}
          />
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div style={{
        background:    '#FFFFFF',
        borderTop:     '1px solid rgba(0,0,0,0.07)',
        padding:       '12px 20px',
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        flexShrink:    0,
      }}>
        <span style={{
          flex: 1, fontSize: 12,
          color: error ? 'rgba(200,40,40,0.75)' : 'rgba(0,0,0,0.28)',
          lineHeight: 1.4, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {error || (generating ? 'Generating with AI…' : 'Review and edit before sending.')}
        </span>

        <button
          onClick={onClose}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', fontSize: 13,
            color: 'rgba(0,0,0,0.42)', cursor: 'pointer',
            fontFamily: FONT, fontWeight: 500, flexShrink: 0,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          Discard
        </button>

        <button
          onClick={handleCreate}
          disabled={isDisabled}
          style={{
            padding: '8px 22px', borderRadius: 8,
            border: 'none',
            background: isDisabled ? 'rgba(0,0,0,0.06)' : accent,
            color:      isDisabled ? 'rgba(0,0,0,0.25)' : '#FFFFFF',
            fontSize: 13, fontWeight: 600,
            cursor:  isDisabled ? 'not-allowed' : 'pointer',
            fontFamily: FONT, letterSpacing: '0.1px',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
        >
          {submitting ? 'Creating…' : 'Open in Gmail →'}
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldRow({ label, children, noBorder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '9px 20px',
      borderBottom: noBorder ? 'none' : '1px solid rgba(0,0,0,0.055)',
      minHeight: 42,
    }}>
      <span style={{
        fontSize: 12, color: 'rgba(0,0,0,0.3)',
        fontWeight: 500, width: 58, flexShrink: 0,
        letterSpacing: '0.1px',
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function HeaderBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.45)',
        fontSize: 16, cursor: 'pointer',
        padding: '3px 7px', borderRadius: 5,
        lineHeight: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.1s, background 0.1s',
        fontFamily: FONT,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color      = 'rgba(255,255,255,0.92)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color      = 'rgba(255,255,255,0.45)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
      <path d="M1 1h4M1 1v4M11 11H7M11 11V7M11 1H7M11 1V5M1 11h4M1 11V7"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
      <path d="M5 1v4H1M7 1v4h4M5 11V7H1M7 11V7h4"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
