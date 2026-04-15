import { useState, useRef, useEffect } from 'react';

/* ── Theme ───────────────────────────────────────────────────────── */
const T = {
  canvas:        '#F3F1E8',
  surface:       '#FFFFFF',
  border:        'rgba(0,0,0,0.08)',
  borderSoft:    'rgba(0,0,0,0.06)',
  primary:       '#5375A7',
  primaryDeep:   '#4A6993',
  primaryBg:     'rgba(83,117,167,0.08)',
  primaryBorder: 'rgba(83,117,167,0.28)',
  navText:       '#8C9DAE',
  textPrimary:   '#1A1A2E',
  textSec:       '#444',
  textMuted:     '#777',
  textFaint:     '#aaa',
  textGhost:     '#ccc',
  selectedBg:    'rgba(83,117,167,0.06)',
  selectedBorder:'rgba(83,117,167,0.4)',
};

/* ── Icons ───────────────────────────────────────────────────────── */
const Ico = ({ d, size = 16, stroke = 'currentColor', sw = 1.5, fill = 'none', viewBox = '0 0 24 24' }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);
const icons = {
  cloud:    <><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>,
  mail:     <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
  heart:    <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  note:     <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  photo:    <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  check:    <><polyline points="20 6 9 17 4 12"/></>,
  copy:     <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  sparkle:  <><path d="M12 3L13.5 8.5H19L14.5 12L16 17.5L12 14L8 17.5L9.5 12L5 8.5H10.5Z"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  refresh:  <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  brain:    <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.16z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.16z"/></>,
  arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
};

/* ── Sources — friendly labels ───────────────────────────────────── */
const SOURCES = [
  { id: 'drive',    label: 'Your Files',    emoji: '📁', icon: 'cloud',    color: '#5375A7', desc: 'Docs, resumes, notes' },
  { id: 'gmail',    label: 'Your Emails',   emoji: '📧', icon: 'mail',     color: '#EA4335', desc: 'How you communicate'   },
  { id: 'health',   label: 'Your Health',   emoji: '❤️', icon: 'heart',    color: '#E05C7A', desc: 'Activity & sleep'      },
  { id: 'calendar', label: 'Your Schedule', emoji: '📅', icon: 'calendar', color: '#E8933A', desc: 'Commitments & patterns' },
  { id: 'notes',    label: 'Your Notes',    emoji: '📝', icon: 'note',     color: '#7A9E7E', desc: 'Journals & ideas'       },
  { id: 'photos',   label: 'Your Photos',   emoji: '📷', icon: 'photo',    color: '#6B9E6B', desc: 'Places & lifestyle'     },
  { id: 'upload',   label: 'Upload a File', emoji: '📤', icon: 'upload',   color: '#8C9DAE', desc: 'Add your own file'      },
];

/* ── Files ───────────────────────────────────────────────────────── */
const FILES = {
  drive: [
    { id: 'd1', name: 'Resume 2026',         ext: 'pdf', size: '128 KB', modified: '3d ago', preview: 'Senior designer · 5 yrs experience · USC grad · Figma, Framer, SwiftUI', category: 'professional' },
    { id: 'd2', name: 'Portfolio v3',         ext: 'pdf', size: '4.2 MB', modified: '1w ago', preview: '14 case studies across product, brand & motion design', category: 'professional' },
    { id: 'd3', name: 'Goals 2026',           ext: 'md',  size: '6 KB',   modified: '2d ago', preview: 'Ship Icarus iOS app · Grow to 500 users · Learn 3D modeling', category: 'goals' },
    { id: 'd4', name: 'Bio (short)',           ext: 'txt', size: '2 KB',   modified: '5d ago', preview: '24 · Los Angeles · designer building tools for self-aware people', category: 'personal' },
    { id: 'd5', name: 'Skills Inventory',     ext: 'md',  size: '8 KB',   modified: '1w ago', preview: 'Expert: Figma, Prototyping · Proficient: SwiftUI, React, Framer', category: 'professional' },
    { id: 'd6', name: 'Reading List 2026',    ext: 'txt', size: '3 KB',   modified: '4d ago', preview: '18 books · themes: design systems, consciousness, startups', category: 'intellectual' },
    { id: 'd7', name: 'Values Manifesto',     ext: 'md',  size: '5 KB',   modified: '2w ago', preview: 'Craft over speed · Systems thinking · Aesthetic as function', category: 'personal' },
    { id: 'd8', name: 'Side Projects',        ext: 'md',  size: '4 KB',   modified: '1d ago', preview: 'Icarus, Meridian, personal brand, font collection WIP', category: 'professional' },
  ],
  gmail: [
    { id: 'g1', name: 'Communication Style',    ext: 'ai', size: 'analyzed', modified: '4m ago', preview: 'Avg response 47 min · most active 10am–1pm · direct & warm tone', category: 'social' },
    { id: 'g2', name: 'Top Contacts',           ext: 'ai', size: 'analyzed', modified: '4m ago', preview: 'Johnny Lee, Ronnie Cheung, Turat B. — weekly+ threads', category: 'social' },
    { id: 'g3', name: 'Newsletters You Read',   ext: 'ai', size: 'analyzed', modified: '4m ago', preview: "Dense Discovery, Cofolios, Sidebar, It's Nice That — design focused", category: 'intellectual' },
    { id: 'g4', name: 'Work Emails Summary',    ext: 'ai', size: 'analyzed', modified: '4m ago', preview: 'LavaLab collab, Meridian shipping, client feedback threads', category: 'professional' },
    { id: 'g5', name: 'Personal Emails',        ext: 'ai', size: 'analyzed', modified: '4m ago', preview: 'Family check-ins, friends, apartment hunting, travel plans', category: 'personal' },
    { id: 'g6', name: 'How You Write',          ext: 'ai', size: 'analyzed', modified: '4m ago', preview: 'Concise, friendly, uses "→" and lowercase, avoids corporate speak', category: 'personal' },
  ],
  health: [
    { id: 'h1', name: 'Activity Summary',  ext: 'csv', size: '14 KB',    modified: '1m ago', preview: 'Avg 8,400 steps · 4× weekly strength training · 2× yoga', category: 'health' },
    { id: 'h2', name: 'Sleep Patterns',    ext: 'csv', size: '9 KB',     modified: '1m ago', preview: 'Avg 7.2h · best nights: Sunday/Monday · consistent 11pm bedtime', category: 'health' },
    { id: 'h3', name: 'Mindfulness Log',   ext: 'csv', size: '6 KB',     modified: '1m ago', preview: '18 sessions last month · avg 12 min · mostly morning', category: 'health' },
    { id: 'h4', name: 'Energy Patterns',   ext: 'ai',  size: 'analyzed', modified: '1m ago', preview: 'Peak: 9–11am · slump: 2–3pm · creative flow: evenings', category: 'health' },
    { id: 'h5', name: 'Nutrition Notes',   ext: 'txt', size: '3 KB',     modified: '3d ago', preview: 'Mostly plant-based · intermittent fasting · matcha not coffee', category: 'health' },
  ],
  calendar: [
    { id: 'c1', name: 'Regular Commitments',   ext: 'ai', size: 'analyzed', modified: 'just now', preview: 'LavaLab Tue 6pm · Meridian standup MWF 10am · gym M/W/F/Sat', category: 'professional' },
    { id: 'c2', name: 'Upcoming Deadlines',    ext: 'ai', size: 'analyzed', modified: 'just now', preview: 'Apr 1 Convergence demo · Apr 3 pitch deck · Apr 18 brand pres.', category: 'goals' },
    { id: 'c3', name: 'How You Spend Time',    ext: 'ai', size: 'analyzed', modified: 'just now', preview: 'Design 38% · Meetings 22% · Learning 15% · Personal 25%', category: 'professional' },
    { id: 'c4', name: 'Social Plans',          ext: 'ai', size: 'analyzed', modified: 'just now', preview: '2× weekly friend dinners · bi-weekly family call · monthly events', category: 'social' },
    { id: 'c5', name: 'Focused Work Hours',    ext: 'ai', size: 'analyzed', modified: 'just now', preview: 'Mornings 9–12 protected · Figma sessions avg 2.5h · no meetings before 10', category: 'professional' },
    { id: 'c6', name: 'Travel History',        ext: 'ai', size: 'analyzed', modified: 'just now', preview: 'NYC (Jan), SF (Feb), Austin (Mar) · upcoming: Tokyo (Jun)', category: 'personal' },
    { id: 'c7', name: 'Meeting Preferences',   ext: 'ai', size: 'analyzed', modified: 'just now', preview: 'Prefers 30-min slots · back-to-back avoidance · video on default', category: 'social' },
  ],
  notes: [
    { id: 'n1', name: 'Daily Journal',         ext: 'txt', size: '28 KB', modified: 'today',  preview: 'Stream-of-consciousness · gratitude practice · 180 days running', category: 'personal' },
    { id: 'n2', name: 'Work Ideas',            ext: 'md',  size: '12 KB', modified: '2d ago', preview: '47 product ideas · feature concepts · redesign thoughts', category: 'professional' },
    { id: 'n3', name: 'Team Brainstorms',      ext: 'md',  size: '9 KB',  modified: '3d ago', preview: 'Whiteboard sessions with team · Icarus UX decisions · experiments', category: 'professional' },
    { id: 'n4', name: 'Personal Reflections',  ext: 'txt', size: '15 KB', modified: '1w ago', preview: 'Quarterly reviews · what worked · growth areas · identity notes', category: 'personal' },
    { id: 'n5', name: 'Quotes & Inspiration',  ext: 'txt', size: '5 KB',  modified: '5d ago', preview: '"Design is how it works." · 84 saved quotes, mostly design & philosophy', category: 'intellectual' },
    { id: 'n6', name: 'Learning Notes',        ext: 'md',  size: '18 KB', modified: '2d ago', preview: 'SwiftUI course · 3D modeling · design systems · book summaries', category: 'intellectual' },
    { id: 'n7', name: 'Relationship Notes',    ext: 'txt', size: '7 KB',  modified: '6d ago', preview: 'Notes on people I care about · how I can support them · shared memories', category: 'social' },
    { id: 'n8', name: 'Fears & Blockers',      ext: 'txt', size: '4 KB',  modified: '2w ago', preview: 'Shipping before ready · visibility · perfectionism patterns', category: 'personal' },
    { id: 'n9', name: 'Dream Log',             ext: 'txt', size: '6 KB',  modified: 'today',  preview: '3× weekly entries · recurring themes: building, travel, unknown spaces', category: 'personal' },
  ],
  photos: [
    { id: 'p1', name: 'Places You Visit',      ext: 'ai', size: 'analyzed', modified: '12m ago', preview: 'Most visited: USC campus, Silverlake coffee shops, Venice boardwalk', category: 'personal' },
    { id: 'p2', name: 'Activities You Do',     ext: 'ai', size: 'analyzed', modified: '12m ago', preview: 'Frequent: coffee shops, outdoor workouts, design events, travel', category: 'personal' },
    { id: 'p3', name: 'Social Patterns',       ext: 'ai', size: 'analyzed', modified: '12m ago', preview: 'Most photographed with: close friend group (4 people), solo travel shots', category: 'social' },
    { id: 'p4', name: 'Your Aesthetic',        ext: 'ai', size: 'analyzed', modified: '12m ago', preview: 'High contrast, architecture, minimal composition, golden hour bias', category: 'intellectual' },
  ],
  upload: [],
};

/* ── Insights per file ───────────────────────────────────────────── */
const INSIGHTS = {
  d1: ['Senior designer with 5 yrs exp', 'USC grad', 'Expert in Figma & SwiftUI'],
  d2: ['14 published case studies', 'Strong portfolio across product & brand'],
  d3: ['Shipping Icarus iOS this year', 'Target: 500 users', 'Learning 3D modeling'],
  d4: ['24 years old · based in LA', 'Builds tools for self-aware people'],
  d5: ['Expert: Figma, Prototyping', 'Proficient: SwiftUI, React, Framer'],
  d6: ['Reading 18 books this year', 'Focus: design, consciousness, startups'],
  d7: ['Values craft over speed', 'Believes aesthetic = function'],
  d8: ['Active on 4 side projects', 'Building Icarus + Meridian'],
  g1: ['Responds in ~47 min avg', 'Most active 10am–1pm'],
  g2: ['Closest contacts: Johnny, Ronnie, Turat', 'Weekly communication cadence'],
  g3: ['Subscribes to design-focused newsletters', 'Dense Discovery, Cofolios, Sidebar'],
  g4: ['Active in LavaLab collab', 'Currently shipping Meridian'],
  g5: ['Regular family communication', 'Navigating apartment search'],
  g6: ['Writes concise & warm', 'Lowercase, uses "→", hates corporate speak'],
  h1: ['8,400 steps daily avg', 'Strength trains 4× per week'],
  h2: ['Sleeps 7.2h avg', 'Consistent 11pm bedtime'],
  h3: ['18 mindfulness sessions last month', 'Morning practice, avg 12 min'],
  h4: ['Peak energy: 9–11am', 'Afternoon slump: 2–3pm', 'Creative flow: evenings'],
  h5: ['Mostly plant-based diet', 'Intermittent fasting', 'Matcha over coffee'],
  c1: ['LavaLab every Tuesday 6pm', 'Meridian standup MWF 10am'],
  c2: ['Demo deadline: Apr 1', 'Pitch deck due: Apr 3'],
  c3: ['38% of time in design work', 'Only 22% in meetings'],
  c4: ['Friend dinners 2× weekly', 'Bi-weekly family calls'],
  c5: ['Mornings 9–12 are protected', 'Deep work sessions avg 2.5h'],
  c6: ['Recent travel: NYC, SF, Austin', 'Tokyo trip planned for June'],
  c7: ['Prefers 30-min meetings', 'No back-to-backs', 'Video on by default'],
  n1: ['Journals daily for 180+ days', 'Gratitude practice embedded'],
  n2: ['47 product ideas documented', 'Active ideation practice'],
  n3: ['Collaborative whiteboard sessions', 'Icarus UX decisions tracked'],
  n4: ['Does quarterly self-reviews', 'Growth-oriented mindset'],
  n5: ['84 saved quotes', 'Philosophy & design focused'],
  n6: ['Actively learning SwiftUI & 3D', 'Books summarized in notes'],
  n7: ['Maintains relationship notes', 'Intentional about supporting others'],
  n8: ['Aware of perfectionism patterns', 'Working on shipping earlier'],
  n9: ['Dreams 3× weekly logged', 'Themes: building, travel, exploration'],
  p1: ['Frequents Silverlake & Venice', 'USC campus presence'],
  p2: ['Regulars: coffee shops, workouts, design events'],
  p3: ['Tight friend group of 4', 'Solo travel photographer'],
  p4: ['High-contrast aesthetic eye', 'Architectural composition style'],
};

/* ── Categories ──────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'professional', label: 'Work & Career',  color: '#5375A7' },
  { id: 'personal',     label: 'Personal',        color: '#7A6E9E' },
  { id: 'health',       label: 'Health',          color: '#E05C7A' },
  { id: 'social',       label: 'Relationships',   color: '#5A967A' },
  { id: 'intellectual', label: 'Interests',       color: '#A07850' },
  { id: 'goals',        label: 'Goals',           color: '#7B9E5A' },
];

const EXT_COLORS = { pdf: '#E07050', md: '#6B82B8', txt: '#5375A7', csv: '#5A967A', ai: '#4A6993' };

/* ── Default selected files ──────────────────────────────────────── */
const DEFAULT_SELECTED = new Set(['d1','d3','d4','g1','g6','h4','c1','c5','n1']);

/* ── Compile output ──────────────────────────────────────────────── */
function compileProfile(selectedIds, userCategories) {
  const allFiles = Object.values(FILES).flat();
  const selected = allFiles.filter(f => selectedIds.has(f.id));
  if (!selected.length) return '';
  const grouped = {};
  CATEGORIES.forEach(c => { grouped[c.id] = []; });
  selected.forEach(f => {
    const cat = userCategories[f.id] || f.category || 'personal';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  });
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let out = `# About Me — Juno Profile\nCreated: ${date}\n\n`;
  out += `Hi! Here's some context about me so you can give more relevant and personal responses.\n\n---\n\n`;
  CATEGORIES.forEach(cat => {
    const files = grouped[cat.id];
    if (!files.length) return;
    out += `## ${cat.label}\n\n`;
    files.forEach(f => { out += `**${f.name}**\n${f.preview}\n\n`; });
  });
  return out.trim();
}

/* ── File card ───────────────────────────────────────────────────── */
function FileCard({ file, selected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? T.selectedBg : hovered ? '#F5F4EE' : T.surface,
        border: `1.5px solid ${selected ? T.selectedBorder : hovered ? 'rgba(83,117,167,0.2)' : T.border}`,
        borderRadius: 12, padding: '14px 14px', cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? '0 2px 12px rgba(83,117,167,0.12)' : hovered ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: selected ? T.textPrimary : T.textSec, fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
          <div style={{ color: T.textMuted, fontSize: 11, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{file.preview}</div>
        </div>
        {/* Checkbox */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
          background: selected ? T.primary : T.surface,
          border: `2px solid ${selected ? T.primary : T.textGhost}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
        }}>
          {selected && (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      </div>
      {hovered && !selected && (
        <div style={{ marginTop: 8, fontSize: 10, color: T.primary, fontWeight: 600 }}>+ Add to my profile</div>
      )}
      {selected && (
        <div style={{ marginTop: 8, fontSize: 10, color: T.primary, fontWeight: 600 }}>✓ Added to your profile</div>
      )}
    </div>
  );
}

/* ── Done / profile ready view ───────────────────────────────────── */
function ProfileReadyView({ output, selectedCount, onBack }) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };
  const download = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'my_juno_profile.md'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.canvas }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, background: T.surface, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', color: T.navText, fontSize: 12, cursor: 'pointer' }}>← Back</button>
        <span style={{ color: T.textPrimary, fontSize: 14, fontWeight: 600 }}>Your Juno Profile</span>
      </div>

      {/* Success card */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: 24 }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          {/* Party card */}
          <div style={{ background: T.surface, borderRadius: 16, padding: '32px', textAlign: 'center', border: `1.5px solid ${T.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ color: T.textPrimary, fontSize: 22, fontWeight: 400, marginBottom: 8, fontFamily: "'PPMondwest', serif" }}>Your profile is ready!</div>
            <div style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              You've included <strong style={{ color: T.primary }}>{selectedCount} pieces of information</strong> about yourself.<br/>
              Now paste this into any AI chat and it'll instantly know who you are.
            </div>
            <button
              onClick={copy}
              style={{
                width: '100%', padding: '14px',
                background: copied ? '#5A967A' : T.primary,
                border: 'none', borderRadius: 12, cursor: 'pointer',
                color: '#fff', fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: `0 4px 16px rgba(83,117,167,0.35)`,
              }}
            >
              {copied
                ? <><span>✓</span> Copied to clipboard!</>
                : <><Ico d={icons.copy} size={16} stroke="#fff"/> Copy my profile</>
              }
            </button>
          </div>

          {/* How to use steps */}
          <div style={{ background: T.surface, borderRadius: 14, padding: '20px 24px', border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <div style={{ color: T.navText, fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>How to use it</div>
            {[
              { n: '1', text: 'Click "Copy my profile" above' },
              { n: '2', text: 'Open ChatGPT, Claude, or any AI chat' },
              { n: '3', text: 'Paste it at the start of your conversation' },
              { n: '4', text: 'The AI will instantly know who you are — no more explaining yourself' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.primaryBg, border: `1px solid ${T.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: T.primary, fontSize: 11, fontWeight: 700 }}>{step.n}</span>
                </div>
                <span style={{ color: T.textSec, fontSize: 13, lineHeight: 1.5, paddingTop: 3 }}>{step.text}</span>
              </div>
            ))}
          </div>

          {/* Secondary actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={download} style={{ flex: 1, padding: '10px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', color: T.navText, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ico d={icons.download} size={13} stroke="currentColor"/> Save as file
            </button>
            <button onClick={() => setShowRaw(v => !v)} style={{ flex: 1, padding: '10px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', color: T.navText, fontSize: 12, fontWeight: 500 }}>
              {showRaw ? 'Hide preview' : 'Preview text'}
            </button>
          </div>

          {/* Raw preview — collapsed by default */}
          {showRaw && (
            <div style={{ marginTop: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', fontFamily: '"SF Mono", monospace', fontSize: 11, lineHeight: 1.8, color: T.textMuted, maxHeight: 300, overflowY: 'auto' }}>
              {output.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <div key={i} style={{ color: T.primary, fontWeight: 700, marginTop: 12 }}>{line.slice(3)}</div>;
                if (line.startsWith('# ')) return <div key={i} style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{line.slice(2)}</div>;
                if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ color: T.textSec, fontWeight: 600, marginTop: 8 }}>{line.replace(/\*\*/g, '')}</div>;
                if (line === '---') return <div key={i} style={{ borderTop: `1px solid ${T.border}`, margin: '10px 0' }}/>;
                if (line === '') return <div key={i} style={{ height: 4 }}/>;
                return <div key={i}>{line}</div>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Right panel — profile preview ──────────────────────────────── */
function ProfilePanel({ selectedIds, userCategories, onCompile }) {
  const allFiles = Object.values(FILES).flat();

  const insights = [];
  [...selectedIds].forEach(id => {
    const f = allFiles.find(x => x.id === id);
    if (!f) return;
    (INSIGHTS[id] || []).forEach(text => insights.push(text));
  });

  const isEmpty = selectedIds.size === 0;

  return (
    <div style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', background: T.surface }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textPrimary, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Your profile so far</div>
        <div style={{ color: T.navText, fontSize: 11 }}>
          {isEmpty
            ? 'Nothing added yet — check some files on the left'
            : `Juno knows ${insights.length} thing${insights.length === 1 ? '' : 's'} about you`
          }
        </div>
      </div>

      {/* Preview list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isEmpty ? 0 : '14px 20px', scrollbarWidth: 'thin' }}>
        {isEmpty ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👈</div>
            <div style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.65 }}>
              Check files on the left to add them to your profile.
            </div>
            <div style={{ color: T.navText, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
              Start with the ones that best describe who you are.
            </div>
          </div>
        ) : (
          insights.map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.primary, flexShrink: 0, marginTop: 6 }}/>
              <span style={{ color: T.textSec, fontSize: 12, lineHeight: 1.55 }}>{text}</span>
            </div>
          ))
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '16px 18px 20px', borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={onCompile}
          disabled={isEmpty}
          style={{
            width: '100%', padding: '13px',
            background: isEmpty ? T.canvas : T.primary,
            border: isEmpty ? `1px solid ${T.border}` : 'none',
            borderRadius: 12, cursor: isEmpty ? 'not-allowed' : 'pointer',
            color: isEmpty ? T.textGhost : '#fff',
            fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
            boxShadow: isEmpty ? 'none' : `0 4px 16px rgba(83,117,167,0.3)`,
          }}
        >
          <Ico d={icons.sparkle} size={14} stroke={isEmpty ? T.textGhost : '#fff'} fill={isEmpty ? 'none' : '#fff'}/>
          Build my profile
        </button>
        {!isEmpty && (
          <div style={{ textAlign: 'center', marginTop: 8, color: T.navText, fontSize: 11, lineHeight: 1.5 }}>
            Get a snippet to paste into ChatGPT, Claude, or any AI
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Pulsing dot ─────────────────────────────────────────────────── */
function LiveDot({ color = '#5A967A' }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setInterval(() => setOn(v => !v), 2000); return () => clearInterval(t); }, []);
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: on ? color : `${color}50`, boxShadow: on ? `0 0 5px ${color}` : 'none', transition: 'all 0.8s', flexShrink: 0 }}/>;
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function ContextBuilder() {
  const [activeSource,   setActiveSource]   = useState('drive');
  const [selectedIds,    setSelectedIds]    = useState(DEFAULT_SELECTED);
  const [userCategories, setUserCategories] = useState({});
  const [showCompiled,   setShowCompiled]   = useState(false);
  const [compiledOutput, setCompiledOutput] = useState('');
  const [search,         setSearch]         = useState('');
  const [dismissed,      setDismissed]      = useState(false);
  const fileInputRef = useRef(null);

  const sourceFiles = (FILES[activeSource] || []).filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.preview.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const compile = () => {
    setCompiledOutput(compileProfile(selectedIds, userCategories));
    setShowCompiled(true);
  };

  if (showCompiled && compiledOutput) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <ProfileReadyView output={compiledOutput} selectedCount={selectedIds.size} onBack={() => setShowCompiled(false)}/>
      </div>
    );
  }

  const activeSrc = SOURCES.find(s => s.id === activeSource);

  return (
    <div style={{ width: '100%', height: '100%', background: T.canvas, display: 'flex', flexDirection: 'column', fontFamily: "'Satoshi', system-ui, sans-serif", color: T.textPrimary, overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ height: 54, borderBottom: `1px solid ${T.border}`, background: T.surface, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/juno_mascot.png" alt="Juno" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}/>
          <div>
            <div style={{ color: T.primaryDeep, fontWeight: 400, fontSize: 15, lineHeight: 1.2, fontFamily: "'PPMondwest', serif" }}>Juno Vault</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <LiveDot/>
          <span style={{ color: T.navText, fontSize: 11 }}>Connected</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left sidebar — sources ── */}
        <div style={{ width: 210, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ padding: '20px 14px 12px' }}>
            <div style={{ color: T.navText, fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '0 4px 12px' }}>Where to look</div>
            {SOURCES.map(src => {
              const active = activeSource === src.id;
              const selCount = (FILES[src.id] || []).filter(f => selectedIds.has(f.id)).length;
              return (
                <button
                  key={src.id}
                  onClick={() => { setActiveSource(src.id); setSearch(''); }}
                  style={{
                    width: '100%',
                    background: active ? T.primaryBg : 'transparent',
                    border: `1.5px solid ${active ? T.primaryBorder : 'transparent'}`,
                    borderRadius: 10, padding: '10px 10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{src.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: active ? T.textPrimary : T.textSec, fontSize: 12, fontWeight: active ? 600 : 400 }}>{src.label}</div>
                    <div style={{ color: T.navText, fontSize: 10, marginTop: 1 }}>{src.desc}</div>
                  </div>
                  {selCount > 0 && (
                    <span style={{ background: T.primaryBg, color: T.primary, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>{selCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── File grid ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* How-it-works banner (dismissable) */}
          {!dismissed && (
            <div style={{ background: T.primaryBg, borderBottom: `1px solid ${T.primaryBorder}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ color: T.primaryDeep, fontSize: 12, lineHeight: 1.5, flex: 1 }}>
                <strong>How this works:</strong> Check the files below that you want Juno to know about. When you're done, click <strong>"Build my profile"</strong> on the right.
              </span>
              <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: 'none', color: T.navText, fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
            </div>
          )}

          {/* Source header + search */}
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, background: T.surface, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {activeSrc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{activeSrc.emoji}</span>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{activeSrc.label}</div>
                  <div style={{ color: T.navText, fontSize: 11 }}>{activeSrc.desc}</div>
                </div>
              </div>
            )}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ marginLeft: 'auto', background: T.canvas, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', color: T.textSec, fontSize: 11, outline: 'none', width: 150 }}
            />
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', scrollbarWidth: 'thin' }}>
            {activeSource === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${T.border}`, borderRadius: 16, padding: '64px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: T.surface }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.primaryBorder; e.currentTarget.style.background = T.primaryBg; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
              >
                <div style={{ fontSize: 40, marginBottom: 14 }}>📤</div>
                <div style={{ color: T.textSec, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop a file here, or click to browse</div>
                <div style={{ color: T.navText, fontSize: 12 }}>PDF, Word doc, text file — anything that describes you</div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.csv,.json,.doc,.docx" style={{ display: 'none' }}/>
              </div>
            ) : sourceFiles.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: T.navText, fontSize: 13 }}>No files match your search</div>
            ) : (
              <>
                {/* Instruction line above cards */}
                <div style={{ color: T.navText, fontSize: 11, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Check the ones you want Juno to know about</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelectedIds(prev => { const n = new Set(prev); sourceFiles.forEach(f => n.add(f.id)); return n; })}
                      style={{ background: 'transparent', border: 'none', color: T.primary, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >Add all</button>
                    <span style={{ color: T.textGhost }}>·</span>
                    <button
                      onClick={() => setSelectedIds(prev => { const n = new Set(prev); sourceFiles.forEach(f => n.delete(f.id)); return n; })}
                      style={{ background: 'transparent', border: 'none', color: T.navText, fontSize: 11, cursor: 'pointer', padding: 0 }}
                    >Remove all</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 9 }}>
                  {sourceFiles.map(f => (
                    <FileCard key={f.id} file={f} selected={selectedIds.has(f.id)} onToggle={() => toggle(f.id)} assignedCategory={userCategories[f.id]} onCategoryChange={() => {}}/>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <ProfilePanel selectedIds={selectedIds} userCategories={userCategories} onCompile={compile}/>
      </div>
    </div>
  );
}
