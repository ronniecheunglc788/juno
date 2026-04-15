import { useState, useMemo, useEffect, useRef } from 'react';
import DraftCompose from '../DraftCompose';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(raw) { return Math.floor((new Date(raw) - Date.now()) / 86400000); }
function dayLabel(d) {
  if (d === null) return 'UNREAD';
  if (d <  0) return 'OVERDUE';
  if (d === 0) return 'TODAY';
  if (d === 1) return 'TMRW';
  return `+${d}d`;
}
function urgency(d) {
  if (d === null) return 0.65;
  if (d <= 0)  return 1.00;
  if (d <= 1)  return 0.90;
  if (d <= 3)  return 0.74;
  if (d <= 7)  return 0.52;
  return 0.30;
}
const NOTE_MAP = [
  [/biochem lab report/i,            'Due 24h before Orgo Exam 4. No buffer.'],
  [/organic chem exam 4/i,           'Final exam. Lab report due night before.'],
  [/jhu.*interview|interview.*jhu/i, 'No prep block on calendar before this date.'],
  [/research poster/i,               'Faculty co-signature required by Apr 22.'],
  [/mcat exam$/i,                    'Check-in 06:30. Prometric #1204. Two IDs.'],
  [/shadowing|cardiology/i,          'Badge required. Ward desk. Procedure 08:30.'],
  [/academic advisor/i,              'Research abstract. Deadline Apr 20.'],
  [/research lab|chen lab/i,         'Sample prep Sat. Expanded cohort Mon.'],
  [/chen lab meeting/i,              '5-min cohort update requested by Dr. Chen.'],
  [/mcat.*practice/i,                'Full-length block. Keep adjacent clear.'],
  [/mcat study block/i,              'P/S is your weakest section. Protect this block.'],
  [/interview invitation/i,          'No prep block exists on calendar yet.'],
  [/amcas.*verified/i,               '14 schools reviewing. Hopkins confirmed.'],
  [/waitlist.*ucsf/i,                'Active waitlist. No action needed.'],
  [/research protocol/i,             'IRB approved. Expanded cohort Monday.'],
  [/exam.*grade/i,                   'Exam 4 is Apr 18. Extra office hours posted.'],
  [/orgo office hours/i,             'Prof. Martinez holding extra session today 3–5pm.'],
  [/biostatistics quiz/i,            'Open-book 45 min. Covers regression + survival.'],
  [/financial aid/i,                 'Tax documents due Apr 20. Scholarship at risk.'],
  [/solo interview practice/i,       'No practice partner. Consider mock with advisor.'],
  [/aamc.*school list/i,             'Advisor suggests Vanderbilt + Duke before deadline.'],
  [/rent due/i,                      'Auto-pay not enrolled. Manual payment required.'],
  [/office hours.*today/i,           'Chem 204. Reaction mechanisms for Exam 4.'],
];
function getNote(t) { for (const [r, n] of NOTE_MAP) if (r.test(t)) return n; return null; }

// ─── Data → orbs ──────────────────────────────────────────────────────────────
function deriveOrbs(data) {
  const emails = data?.emails   || [];
  const events = data?.calendar || [];
  const orbs   = [];

  events.forEach((ev, i) => {
    const d = daysUntil(ev.startRaw);
    orbs.push({
      id: `cal-${i}`, kind: 'cal',
      title: ev.title,
      label: ev.title.split(/\s+/).slice(0, 4).join(' '),
      days: d, urg: urgency(d),
      tag:  dayLabel(d),
      note: getNote(ev.title),
      rawData: ev,
      phase: i * 1.3,
    });
  });

  emails.slice(0, 14).forEach((em, i) => {
    const title = em.subject.replace(/^(Re:|Fwd:|RE:|Fw:)\s*/i, '').trim();
    const txt   = (em.subject + ' ' + (em.snippet || '')).toLowerCase();
    const hasUrgentKw = ['urgent','asap','action required','today','deadline','overdue','required'].some(k => txt.includes(k));
    const urg   = em.isUnread ? (hasUrgentKw ? 0.82 : 0.65) : (hasUrgentKw ? 0.48 : 0.32);
    orbs.push({
      id: `em-${i}`, kind: 'email',
      title: em.subject, label: title.split(/\s+/).slice(0, 4).join(' '),
      days: null, urg,
      tag: em.isUnread ? 'UNREAD' : 'READ',
      note: getNote(em.subject),
      rawData: em,
      phase: i * 0.9 + 4,
    });
  });

  // JUNO flagged
  const byDay = {};
  events.forEach(ev => {
    const d = daysUntil(ev.startRaw);
    if (d >= 0 && d <= 7) (byDay[d] = byDay[d] || []).push(ev.title);
  });
  Object.entries(byDay).forEach(([day, titles]) => {
    if (titles.length < 2) return;
    const n = +day;
    orbs.push({
      id: `flag-${day}`, kind: 'flag',
      title: `${titles.length} items converge ${dayLabel(n)}`,
      label: `${titles.length} converge ${dayLabel(n)}`,
      days: n, urg: n <= 1 ? 0.88 : 0.65,
      tag: dayLabel(n),
      note: titles.slice(0, 3).join(' · '),
      rawData: null, phase: +day * 2.1,
    });
  });
  if (events.some(e => /interview/i.test(e.title)) && !events.some(e => /prep|mock/i.test(e.title))) {
    orbs.push({
      id: 'flag-prep', kind: 'flag',
      title: 'Interview prep gap', label: 'Prep gap — JHU',
      days: 8, urg: 0.68, tag: '+8d',
      note: 'JHU Apr 22. Zero prep blocks on calendar before it.',
      rawData: null, phase: 7.2,
    });
  }
  if (events.some(e => /poster/i.test(e.title)) && !events.some(e => /chen|sign|review/i.test(e.title))) {
    orbs.push({
      id: 'flag-poster', kind: 'flag',
      title: 'Poster co-signature missing', label: 'Poster co-sig gap',
      days: 8, urg: 0.60, tag: '+8d',
      note: 'Dr. Chen review not calendared before Apr 22.',
      rawData: null, phase: 8.5,
    });
  }

  return orbs;
}

// ─── Orb prep — assign wave + baseX (no live x,y yet) ────────────────────────
function prepOrbs(orbs, W) {
  // Map urgency → wave index (0 = top/most urgent, 4 = bottom/least urgent)
  function waveFor(orb) {
    if (orb.urg >= 0.88) return 0;
    if (orb.urg >= 0.70) return 1;
    if (orb.urg >= 0.50) return 2;
    if (orb.urg >= 0.35) return 3;
    return 4;
  }

  // Pre-compute per-wave counts once (avoids O(n²) filter call inside map)
  const waveTotals = [0, 1, 2, 3, 4].map(wi => orbs.filter(o => waveFor(o) === wi).length);
  const countPerWave = [0, 0, 0, 0, 0];
  const sorted = [...orbs].sort((a, b) => b.urg - a.urg);

  return sorted.map(orb => {
    const wi    = waveFor(orb);
    const total = waveTotals[wi];
    const idx   = countPerWave[wi]++;
    // Single orb on a wave: center it. Multiple: spread 15%–82% of width + phase jitter.
    const frac   = total <= 1 ? 0.50 : 0.15 + (idx / (total - 1)) * 0.67;
    const baseX  = W * frac + Math.sin(orb.phase * 2.3) * W * 0.04;
    return { ...orb, baseX: Math.max(70, Math.min(W - 70, baseX)), waveIndex: wi };
  });
}

// ─── Background particles (pre-seeded, stable) ────────────────────────────────
const PARTICLE_COLORS = ['80,150,225', '50,200,210', '120,140,230', '60,180,200', '100,120,215', '140,160,240', '70,190,185'];
const BG_PARTICLES = Array.from({ length: 110 }, (_, i) => {
  const phi = i * 2.399963;
  return {
    fx:    (Math.cos(phi) * 0.5 + 0.5),
    fy:    (Math.sin(phi * 3.7) * 0.5 + 0.5),
    r:     0.35 + (i % 5) * 0.30,
    spd:   0.00010 + (i % 9) * 0.000032,
    phase: (i * 0.618) % (Math.PI * 2),
    alpha: 0.04 + (i % 7) * 0.016,
    rgb:   PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  };
});

// ─── Wave config ──────────────────────────────────────────────────────────────
const WAVE_CFGS = [
  { yf: 0.20, amp: 40, freq: 0.0050, spd: 0.007, ph: 0.0, rgb: '80,140,255',  a: 0.28 },  // deep royal blue
  { yf: 0.36, amp: 34, freq: 0.0065, spd: 0.005, ph: 1.8, rgb: '20,190,210',  a: 0.22 },  // bright cyan
  { yf: 0.52, amp: 46, freq: 0.0042, spd: 0.009, ph: 3.5, rgb: '30,160,175',  a: 0.18 },  // mid teal
  { yf: 0.67, amp: 36, freq: 0.0058, spd: 0.006, ph: 5.1, rgb: '50,110,170',  a: 0.15 },  // slate blue
  { yf: 0.82, amp: 26, freq: 0.0075, spd: 0.004, ph: 0.9, rgb: '35,65,120',   a: 0.13 },  // deep navy
];

// ─── Canvas ───────────────────────────────────────────────────────────────────
function WaveCanvas({ orbs, selectedId, onOrbClick, userName }) {
  const canvasRef = useRef(null);
  const posRef    = useRef([]);
  const hovRef    = useRef(null);
  const selRef    = useRef(selectedId);
  const clickRef  = useRef(onOrbClick);
  const mouseRef  = useRef({ x: 0.5, y: 0.5 });  // normalized 0–1
  const surgeRef  = useRef(-9999);                 // frame when last surge started
  const bloomsRef = useRef([]);                    // [{id,startFrame,x,y,r,rgb}]
  const frameRef  = useRef(0);                     // readable outside effect
  const introRef  = useRef(0);                     // intro frames — persists across filter changes
  useEffect(() => { selRef.current   = selectedId; });
  useEffect(() => { clickRef.current = onOrbClick; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx    = canvas.getContext('2d');
    let W = 0, H = 0, rafId, frame = 0;
    let bgDepth = null, bgBloom = null, bgVignette = null, bgMoon = null;
    let bgFrameGlow = null, bgFrameGlowH = null;  // cached edge glows
    let junoAlpha = 0, junoContent = null;         // JUNO card fade state

    // prepped holds baseX + waveIndex; live x,y computed each frame
    let prepped = [];

    function resize() {
      W = parent.offsetWidth; H = parent.offsetHeight;
      canvas.width = W; canvas.height = H;
      prepped = prepOrbs(orbs, W);
      // Rebuild cached background gradients
      bgDepth = ctx.createLinearGradient(0, 0, 0, H);
      bgDepth.addColorStop(0,    'rgba(0,0,0,0.55)');
      bgDepth.addColorStop(0.25, 'rgba(8,20,48,0.30)');
      bgDepth.addColorStop(0.55, 'rgba(10,25,55,0.10)');
      bgDepth.addColorStop(0.80, 'rgba(4,12,30,0.35)');
      bgDepth.addColorStop(1,    'rgba(0,0,0,0.65)');
      bgBloom = ctx.createRadialGradient(W * 0.28, H * 0.42, 0, W * 0.28, H * 0.42, Math.max(W, H) * 0.65);
      bgBloom.addColorStop(0, 'rgba(20,60,140,0.22)');
      bgBloom.addColorStop(1, 'rgba(0,0,0,0)');
      bgVignette = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
      bgVignette.addColorStop(0, 'rgba(0,0,0,0)');
      bgVignette.addColorStop(1, 'rgba(0,0,0,0.45)');
      // Moonlight source — top-center focal bloom behind the waves
      bgMoon = ctx.createRadialGradient(W * 0.5, H * -0.08, 0, W * 0.5, H * -0.08, H * 0.88);
      bgMoon.addColorStop(0,    'rgba(60,120,200,0.18)');
      bgMoon.addColorStop(0.3,  'rgba(30,80,160,0.10)');
      bgMoon.addColorStop(0.65, 'rgba(10,30,80,0.04)');
      bgMoon.addColorStop(1,    'rgba(0,0,0,0)');
      // Edge frame glows — static (W/H only), cache to avoid per-frame recreation
      bgFrameGlow = ctx.createLinearGradient(0, 0, 0, H);
      bgFrameGlow.addColorStop(0,    'rgba(80,140,220,0.08)');
      bgFrameGlow.addColorStop(0.05, 'rgba(80,140,220,0)');
      bgFrameGlow.addColorStop(0.95, 'rgba(80,140,220,0)');
      bgFrameGlow.addColorStop(1,    'rgba(80,140,220,0.06)');
      bgFrameGlowH = ctx.createLinearGradient(0, 0, W, 0);
      bgFrameGlowH.addColorStop(0,    'rgba(80,140,220,0.06)');
      bgFrameGlowH.addColorStop(0.04, 'rgba(80,140,220,0)');
      bgFrameGlowH.addColorStop(0.96, 'rgba(80,140,220,0)');
      bgFrameGlowH.addColorStop(1,    'rgba(80,140,220,0.06)');
    }

    // Compute live (x, y) for an orb given current frame + canvas dimensions
    function livePos(orb, fr) {
      const cfg = WAVE_CFGS[orb.waveIndex];
      const mx  = mouseRef.current;
      // Parallax X: closer waves (higher waveIndex) move less with the mouse
      const PARALLAX_X = [13, 10, 7, 4, 2];
      const pxOff = (mx.x - 0.5) * -(PARALLAX_X[orb.waveIndex] || 7);
      const PARALLAX_Y = [9, 7, 5, 3, 1.5];
      const pyOff = (mx.y - 0.5) * (PARALLAX_Y[orb.waveIndex] || 5);
      // Very slow horizontal drift: full cycle ≈ 25 s at 60fps
      const x  = orb.baseX + Math.sin(fr * 0.0025 + orb.phase) * 28 + pxOff;
      const cx = Math.max(60, Math.min(W - 60, x));
      const y  = H * cfg.yf + pyOff
        + cfg.amp * Math.sin(cx * cfg.freq + fr * cfg.spd + cfg.ph)
        + cfg.amp * 0.25 * Math.sin(cx * cfg.freq * 2.1 + fr * cfg.spd * 1.6 + cfg.ph);
      return { x: cx, y };
    }
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(parent);

    function orbColor(orb) {
      if (orb.urg >= 0.85)     return { rgb: '255,90,40',   hex: '#FF5A28' };  // critical: red-orange
      if (orb.kind === 'flag')  return { rgb: '220,190,100', hex: '#DCBE64' };  // flag: gold
      if (orb.kind === 'email') return { rgb: '80,165,255',  hex: '#50A5FF' };  // email: always blue
      if (orb.urg >= 0.65)     return { rgb: '255,155,45',  hex: '#FF9B2D' };  // urgent cal: amber
      if (orb.urg >= 0.45)     return { rgb: '40,210,175',  hex: '#28D2AF' };  // mid cal: teal
      return                          { rgb: '75,135,195',   hex: '#4B87C3' };  // low: steel blue
    }

    function drawWave(cfg, waveIdx, fr, surgeMult = 1) {
      // Parallax: waves higher up (lower yf) are "further away" → more vertical shift
      const PARALLAX_DEPTH = [9, 7, 5, 3, 1.5];
      const py  = (mouseRef.current.y - 0.5) * (PARALLAX_DEPTH[waveIdx] || 5);
      const cy  = H * cfg.yf + py;
      const amp = cfg.amp * surgeMult;
      const th  = amp * 0.55; // ribbon thickness

      ctx.beginPath();
      for (let x = 0; x <= W + 4; x += 4) {
        const y = cy + amp * Math.sin(x * cfg.freq + fr * cfg.spd + cfg.ph)
                + amp * 0.25 * Math.sin(x * cfg.freq * 2.1 + fr * cfg.spd * 1.6 + cfg.ph);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      for (let x = W + 4; x >= 0; x -= 4) {
        const y = cy + amp * Math.sin(x * cfg.freq + fr * cfg.spd + cfg.ph)
                + amp * 0.25 * Math.sin(x * cfg.freq * 2.1 + fr * cfg.spd * 1.6 + cfg.ph)
                + th;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, cy - amp, 0, cy + amp + th);
      grad.addColorStop(0,    `rgba(${cfg.rgb},0)`);
      grad.addColorStop(0.25, `rgba(${cfg.rgb},${cfg.a})`);
      grad.addColorStop(0.75, `rgba(${cfg.rgb},${cfg.a * 0.65})`);
      grad.addColorStop(1,    `rgba(${cfg.rgb},0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright crest line
      ctx.beginPath();
      for (let x = 0; x <= W + 4; x += 4) {
        const y = cy + amp * Math.sin(x * cfg.freq + fr * cfg.spd + cfg.ph)
                + amp * 0.25 * Math.sin(x * cfg.freq * 2.1 + fr * cfg.spd * 1.6 + cfg.ph);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${cfg.rgb},${cfg.a * 1.6})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    function drawOrb(p, fr, staggerMap = {}, introFrame = 75) {
      const { x, y, urg, phase } = p;  // x,y already computed via livePos into pos[]
      const col   = orbColor(p);
      const pulse = Math.sin(fr * 0.04 + phase) * 0.5 + 0.5;
      const isSel = selRef.current === p.id;
      const isHov = hovRef.current === p.id;
      const r     = 7 + urg * 6 + (isSel || isHov ? 3 : 0);

      // Compute intro progress from introFrame (avoid using draw()-scoped `intro`)
      const tI    = Math.min(introFrame, 75) / 75;
      const intro = tI < 0.5 ? 4*tI*tI*tI : 1 - Math.pow(-2*tI+2, 3)/2;

      // Filtered out: draw ghost and skip interactions
      if (p._filtered) {
        ctx.globalAlpha = 0.07 * intro;
        const gh = ctx.createRadialGradient(x, y, 0, x, y, r + 4);
        gh.addColorStop(0, `rgba(${col.rgb},0.5)`); gh.addColorStop(1, `rgba(${col.rgb},0)`);
        ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = gh; ctx.fill();
        ctx.globalAlpha = 1;
        return;
      }
      // Intro fade-in: stagger each orb's entrance by wave index
      const orbIntro = Math.min(1, Math.max(0, (introFrame - p.waveIndex * 8) / 48));
      if (orbIntro <= 0) return;
      // Do NOT set globalAlpha here — individual draws bake orbIntro in where needed

      // Caustic light shadow under orb
      drawCaustic(x, y, p, fr);

      // Expanding pulse rings for urgent orbs
      drawPulseRings(x, y, r, p, fr);

      const oi = orbIntro;  // shorthand

      // Outer atmospheric glow
      const atmR = r + 28 + pulse * 10 + (isSel ? 16 : 0);
      const atm  = ctx.createRadialGradient(x, y, 0, x, y, atmR);
      atm.addColorStop(0,   `rgba(${col.rgb},${(0.28 + urg * 0.22 + (isSel ? 0.15 : 0)) * oi})`);
      atm.addColorStop(0.4, `rgba(${col.rgb},${(0.08 + urg * 0.06) * oi})`);
      atm.addColorStop(1,   `rgba(${col.rgb},0)`);
      ctx.beginPath(); ctx.arc(x, y, atmR, 0, Math.PI * 2);
      ctx.fillStyle = atm; ctx.fill();

      // Inner halo
      const halo = ctx.createRadialGradient(x, y, r * 0.3, x, y, r + 10);
      halo.addColorStop(0, `rgba(${col.rgb},${0.55 * oi})`);
      halo.addColorStop(1, `rgba(${col.rgb},0)`);
      ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2);
      ctx.fillStyle = halo; ctx.fill();

      // Core orb
      const core = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x, y, r);
      core.addColorStop(0,   `rgba(255,255,255,${0.85 * oi})`);
      core.addColorStop(0.4, col.hex + Math.round(255 * oi).toString(16).padStart(2,'0'));
      core.addColorStop(1,   col.hex + Math.round(170 * oi).toString(16).padStart(2,'0'));
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = core; ctx.fill();

      // Urgency progress arc
      drawUrgencyArc(x, y, r, p);

      // Kind symbol inside orb
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      const symSize = Math.max(8, Math.round(r * 0.78));
      ctx.font      = `${symSize}px system-ui,sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${0.70 * oi})`;
      const sym = p.kind === 'email' ? '✉' : p.kind === 'flag' ? '⚑' : '◈';
      ctx.fillText(sym, x, y);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();

      // Selection ring — double ring with inner pulse
      if (isSel) {
        const selPulse = Math.sin(fr * 0.08) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = col.hex;
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 0.75 * oi; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r + 12 + selPulse * 4, 0, Math.PI * 2);
        ctx.lineWidth   = 1;
        ctx.globalAlpha = (0.30 + selPulse * 0.15) * oi; ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Label + tag with pill background for readability
      const fontSize = urg >= 0.85 ? 11 : urg >= 0.65 ? 10 : 9;
      ctx.font       = `${isSel ? 600 : 400} ${fontSize}px "DM Sans","Inter",system-ui`;
      ctx.textAlign  = 'center';
      const lbl      = p.label.length > 24 ? p.label.slice(0, 23) + '…' : p.label;
      const lblW     = ctx.measureText(lbl).width;
      const tagFont  = `bold ${urg >= 0.80 ? 8 : 7}px "DM Mono","Courier New",monospace`;
      ctx.font       = tagFont;
      const tagW     = ctx.measureText(p.tag).width;
      const pillW    = Math.max(lblW, tagW) + 14;
      const stagger  = (staggerMap[p.id] || 0) * 14;
      const pillH    = 24, pillX = x - pillW / 2, pillY = y + r + 6 + stagger;
      // Pill background
      ctx.fillStyle  = `rgba(5,10,22,${0.68 * oi})`;
      ctx.beginPath();
      ctx.roundRect?.(pillX, pillY, pillW, pillH, 4) || ctx.rect(pillX, pillY, pillW, pillH);
      ctx.fill();
      // Label text
      ctx.font       = `${isSel ? 600 : 400} ${fontSize}px "DM Sans","Inter",system-ui`;
      ctx.fillStyle  = `rgba(${col.rgb},${(0.80 + urg * 0.18) * oi})`;
      ctx.fillText(lbl, x, pillY + 11);
      // Tag text
      ctx.font       = tagFont;
      ctx.fillStyle  = col.hex;
      ctx.globalAlpha = 0.85 * oi;
      ctx.fillText(p.tag, x, pillY + 22);
      ctx.globalAlpha = 1;  // always reset
    }

    // ── Floating background particles ────────────────────────────────
    function drawParticles(fr) {
      BG_PARTICLES.forEach(p => {
        const px = ((p.fx + fr * p.spd) % 1) * W;
        const py = p.fy * H + Math.sin(fr * 0.007 + p.phase) * 18;
        const twinkle = 0.75 + Math.sin(fr * 0.03 + p.phase * 3) * 0.25;
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.rgb},${p.alpha * twinkle})`; ctx.fill();
      });
    }

    // ── Sparkles on wave crests (parallax-corrected) ─────────────────
    function drawSparkles(cfg, waveIdx, fr) {
      const PARALLAX_DEPTH = [9, 7, 5, 3, 1.5];
      const pyOff = (mouseRef.current.y - 0.5) * (PARALLAX_DEPTH[waveIdx] || 5);
      for (let i = 0; i < 24; i++) {
        const sx    = ((i / 24 + fr * 0.00022) % 1) * W;
        const wv    = Math.sin(sx * cfg.freq + fr * cfg.spd + cfg.ph)
                    + 0.25 * Math.sin(sx * cfg.freq * 2.1 + fr * cfg.spd * 1.6 + cfg.ph);
        if (wv < 0.68) continue;
        const sy      = H * cfg.yf + pyOff + cfg.amp * wv;
        const strength = (wv - 0.68) / 0.57;
        const twinkle  = Math.sin(fr * 0.18 + i * 1.7) * 0.5 + 0.5;
        const a        = strength * twinkle * 0.65;
        ctx.beginPath(); ctx.arc(sx, sy, 1 + twinkle * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,235,255,${a})`; ctx.fill();
      }
    }

    // ── Caustic light patch below each orb on the wave ───────────────
    function drawCaustic(x, y, orb, fr) {
      const col = orbColor(orb);
      const r   = (7 + orb.urg * 6) * 2.2;
      ctx.save();
      ctx.translate(x, y + (7 + orb.urg * 6) + 6);
      ctx.scale(1, 0.28);
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0, `rgba(${col.rgb},0.20)`);
      grd.addColorStop(1, `rgba(${col.rgb},0)`);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.restore();
    }

    // ── Expanding pulse rings for urgent orbs ────────────────────────
    function drawPulseRings(x, y, r, orb, fr) {
      if (orb.urg < 0.72) return;
      const col    = orbColor(orb);
      const period = 75 + (1 - orb.urg) * 55;
      for (let ring = 0; ring < 2; ring++) {
        const phase    = (fr + ring * (period * 0.5)) % period;
        const progress = phase / period;
        const ringR    = r + 6 + progress * 58;
        const alpha    = (1 - progress) * 0.38 * orb.urg;
        ctx.beginPath(); ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${col.rgb},${alpha})`;
        ctx.lineWidth   = 1.4; ctx.stroke();
      }
    }

    // ── Urgency arc around each orb ──────────────────────────────────
    function drawUrgencyArc(x, y, r, orb) {
      if (orb.urg < 0.28) return;
      const col        = orbColor(orb);
      const base       = ctx.globalAlpha;  // respect caller's alpha
      const start      = -Math.PI / 2;
      const end        = start + orb.urg * Math.PI * 2;
      ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle  = `rgba(${col.rgb},0.10)`;
      ctx.lineWidth    = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r + 6, start, end);
      ctx.strokeStyle  = col.hex;
      ctx.lineWidth    = 1.8;
      ctx.globalAlpha  = base * 0.52; ctx.stroke();
      ctx.globalAlpha  = base;         // restore caller's alpha
    }

    // ── Constellation lines between same-wave active orbs ────────────
    function drawConstellations(pos) {
      const active = pos.filter(p => !p._filtered);
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i], b = active[j];
          if (a.waveIndex !== b.waveIndex) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > 240) continue;
          const proximity  = 1 - dist / 240;
          const depthAlpha = 0.08 + a.waveIndex * 0.015;
          // Glow pass: wide, dim line for bloom effect
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(80,160,220,${proximity * depthAlpha * 0.6})`;
          ctx.lineWidth   = 3.5;
          ctx.stroke();
          // Core pass: thin bright line on top
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(140,200,255,${proximity * depthAlpha * 1.4})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }

    // ── Bloom ring burst on click ────────────────────────────────────
    function drawBloom(bloom, fr) {
      const age      = fr - bloom.startFrame;
      const progress = age / 58;
      for (let ring = 0; ring < 3; ring++) {
        const rp     = Math.max(0, progress - ring * 0.10);
        const ringR  = bloom.r + 6 + rp * 72;
        const alpha  = (1 - rp) * (0.55 - ring * 0.13);
        if (alpha <= 0) continue;
        ctx.beginPath(); ctx.arc(bloom.x, bloom.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${bloom.rgb},${alpha})`;
        ctx.lineWidth   = 2.2 - ring * 0.6; ctx.stroke();
      }
    }

    // ── Word-wrap helper (effect scope, not recreated per frame) ────
    function wrapText(text, font, maxW) {
      ctx.font = font;
      const words = text.split(' ');
      const wrapped = [];
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW) { if (line) wrapped.push(line); line = w; }
        else line = test;
      }
      if (line) wrapped.push(line);
      return wrapped;
    }

    // ── Live countdown top-right ─────────────────────────────────────
    function drawCountdown(fr, intro) {
      const soonest = [...prepped]
        .filter(o => o.days !== null && o.days >= 0 && o.rawData?.startRaw && !o._filtered)
        .sort((a, b) => a.days - b.days)[0];
      if (!soonest) return;
      const col    = orbColor(soonest);
      const msLeft = new Date(soonest.rawData.startRaw) - Date.now();
      if (msLeft <= 0) return;
      const dd     = Math.floor(msLeft / 86400000);
      const hh     = Math.floor((msLeft % 86400000) / 3600000);
      const mm     = Math.floor((msLeft % 3600000) / 60000);
      const ss     = Math.floor((msLeft % 60000) / 1000);
      const timeStr = dd > 0 ? `${dd}d ${hh}h ${mm}m` : `${hh}h ${mm}m ${ss}s`;
      const pulse  = Math.sin(fr * 0.05) * 0.5 + 0.5;

      ctx.globalAlpha = intro;
      ctx.textAlign = 'right';
      ctx.font      = `7px "DM Mono","Courier New",monospace`;
      ctx.fillStyle = `rgba(${col.rgb},0.38)`;
      const shortLabel = soonest.label.length > 24 ? soonest.label.slice(0, 23) + '…' : soonest.label;
      ctx.fillText(shortLabel.toUpperCase(), W - 22, 74);

      ctx.font      = `bold 20px "DM Mono","Courier New",monospace`;
      ctx.fillStyle = `rgba(${col.rgb},${0.55 + pulse * 0.32})`;
      ctx.fillText(timeStr, W - 22, 98);
      ctx.globalAlpha = 1;
    }

    // ── Selected-orb wave bloom (glow on the wave under selected orb) ─
    function drawSelectedBloom(pos, fr) {
      const sel = pos.find(p => p.id === selRef.current && !p._filtered);
      if (!sel) return;
      const col  = orbColor(sel);
      const pulse = 0.7 + Math.sin(fr * 0.06) * 0.3;
      const r    = 70 + sel.urg * 40;
      const g    = ctx.createRadialGradient(sel.x, sel.y, 0, sel.x, sel.y, r);
      g.addColorStop(0, `rgba(${col.rgb},${0.22 * pulse})`);
      g.addColorStop(0.5, `rgba(${col.rgb},${0.06 * pulse})`);
      g.addColorStop(1, `rgba(${col.rgb},0)`);
      ctx.beginPath(); ctx.arc(sel.x, sel.y, r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    }

    // ── JUNO synthesis card bottom-left ──────────────────────────────
    function drawJunoCard(fr) {
      let insight = null, cardLabel = null, cardRgb = '80,160,220';
      if (hovRef.current) {
        const hov = prepped.find(o => o.id === hovRef.current && !o._filtered);
        if (hov?.note) { insight = hov.note; cardLabel = hov.label; cardRgb = orbColor(hov).rgb; }
      }
      if (!insight) {
        const topFlag = prepped.find(o => o.kind === 'flag' && o.note && !o._filtered);
        if (topFlag) { insight = topFlag.note; cardLabel = topFlag.label; cardRgb = orbColor(topFlag).rgb; }
      }
      // Smooth fade: cache last content, lerp alpha toward 1 or 0
      if (insight) {
        junoContent = { insight, cardLabel, cardRgb };
      }
      const target = insight ? 1 : 0;
      junoAlpha += (target - junoAlpha) * 0.07;
      if (junoAlpha < 0.012 || !junoContent) return;
      // Use cached content during fade-out so card doesn't go blank before fading
      insight   = junoContent.insight;
      cardLabel = junoContent.cardLabel;
      cardRgb   = junoContent.cardRgb;

      const cPad = 18, cW = 290, cH = 72, cX = cPad, cY = H - 58 - cH;
      ctx.globalAlpha = junoAlpha;
      ctx.fillStyle = 'rgba(5,9,20,0.90)';
      ctx.beginPath();
      ctx.roundRect?.(cX, cY, cW, cH, 4) || ctx.rect(cX, cY, cW, cH);
      ctx.fill();
      // Accent bar
      ctx.fillStyle = `rgba(${cardRgb},0.45)`;
      ctx.fillRect(cX, cY, 2, cH);
      // Header row
      ctx.textAlign = 'left';
      ctx.font      = `bold 7px "DM Mono","Courier New",monospace`;
      ctx.fillStyle = `rgba(${cardRgb},0.55)`;
      ctx.fillText('JUNO', cX + 13, cY + 18);
      ctx.font      = `9px "DM Sans",system-ui`;
      ctx.fillStyle = `rgba(200,215,235,0.45)`;
      const lbl = cardLabel ? (cardLabel.length > 28 ? cardLabel.slice(0, 27) + '…' : cardLabel) : '';
      ctx.fillText(lbl, cX + 48, cY + 18);
      // Insight text (up to 2 lines)
      ctx.font      = `10.5px "DM Sans",system-ui`;
      ctx.fillStyle = `rgba(160,205,245,0.80)`;
      const words = insight.split(' ');
      let line = '', lineY = cY + 37, lineCount = 0;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > cW - 28) {
          if (lineCount < 2) { ctx.fillText(line, cX + 13, lineY); lineY += 17; lineCount++; }
          line = word;
        } else { line = test; }
      }
      if (line && lineCount < 2) ctx.fillText(line, cX + 13, lineY);
      ctx.globalAlpha = 1;  // restore after juno card fade
    }

    // ── Bottom urgency strip ─────────────────────────────────────────
    function drawUrgencyStrip(pos, fr, intro) {
      const urgent = [...pos].filter(p => p.urg >= 0.50 && !p._filtered).sort((a, b) => b.urg - a.urg).slice(0, 5);
      if (!urgent.length) return;
      const stripH = 42, pad = 18;
      // Strip background (fade with intro)
      ctx.globalAlpha = intro;
      const sg = ctx.createLinearGradient(0, H - stripH, 0, H);
      sg.addColorStop(0, 'rgba(6,10,20,0)');
      sg.addColorStop(0.4, 'rgba(6,10,20,0.82)');
      sg.addColorStop(1, 'rgba(6,10,20,0.95)');
      ctx.fillStyle = sg; ctx.fillRect(0, H - stripH, W, stripH);
      ctx.globalAlpha = 1;

      let cx2 = pad;
      urgent.forEach((p, i) => {
        const col   = orbColor(p);
        const pulse = Math.sin(fr * 0.055 + i) * 0.5 + 0.5;
        const sym   = p.kind === 'email' ? '✉' : p.kind === 'flag' ? '⚑' : '◈';
        const lbl   = (p.label.length > 22 ? p.label.slice(0, 21) + '…' : p.label);
        // Measure label width with the correct font FIRST
        ctx.font    = '9px "DM Sans",system-ui';
        const lblW  = ctx.measureText(lbl).width;
        const itemW = lblW + 42;  // icon + gap + label + right pad
        // Overflow guard: stop rendering items that would clip past the safe right edge
        if (cx2 + itemW > W - 40) return;

        // Kind symbol (multiply pulse * intro)
        ctx.textAlign = 'left';
        ctx.font      = '9px system-ui,sans-serif';
        ctx.fillStyle = col.hex;
        ctx.globalAlpha = (0.6 + pulse * 0.25) * intro;
        ctx.fillText(sym, cx2, H - stripH / 2 + 3);
        ctx.globalAlpha = 1;
        // Label
        ctx.font      = '9px "DM Sans",system-ui';
        ctx.fillStyle = `rgba(${col.rgb},${0.80 * intro})`;
        ctx.fillText(lbl, cx2 + 14, H - stripH / 2 - 3);
        // Tag
        ctx.font      = `bold 7px "DM Mono","Courier New",monospace`;
        ctx.fillStyle = col.hex;
        ctx.globalAlpha = 0.60 * intro;
        ctx.fillText(p.tag, cx2 + 14, H - stripH / 2 + 9);
        ctx.globalAlpha = 1;
        // Separator
        if (i < urgent.length - 1) {
          ctx.fillStyle = 'rgba(80,140,200,0.15)';
          ctx.fillRect(cx2 + itemW + 2, H - stripH + 10, 1, stripH - 20);
        }
        cx2 += itemW + 14;
      });

      // Right-edge fade so strip content doesn't hard-clip at canvas edge
      const edgeFade = ctx.createLinearGradient(W - 60, 0, W, 0);
      edgeFade.addColorStop(0, 'rgba(6,10,20,0)');
      edgeFade.addColorStop(1, 'rgba(6,10,20,0.95)');
      ctx.globalAlpha = intro;
      ctx.fillStyle = edgeFade; ctx.fillRect(W - 60, H - stripH, 60, stripH);
      ctx.globalAlpha = 1;
    }

    function draw() {
      rafId = requestAnimationFrame(draw);
      frame++;
      frameRef.current = frame;
      if (!W || !H) return;

      // Intro easing: 0→1 over 75 frames using smooth cubic (persists across filter changes)
      if (introRef.current < 75) introRef.current++;
      const introFrame = introRef.current;
      const t          = introFrame / 75;
      const intro      = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Surge multiplier — peaks at click, decays over 90 frames
      const surgeAge  = frame - surgeRef.current;
      const surgeMult = surgeAge < 90
        ? 1 + Math.sin((surgeAge / 90) * Math.PI) * 1.3
        : 1;

      // Background
      ctx.fillStyle = '#060B18';
      ctx.fillRect(0, 0, W, H);

      // Cached background layers (rebuilt only on resize)
      if (bgDepth)   { ctx.fillStyle = bgDepth;   ctx.fillRect(0, 0, W, H); }
      if (bgMoon)    { ctx.fillStyle = bgMoon;    ctx.fillRect(0, 0, W, H); }
      if (bgBloom)   { ctx.fillStyle = bgBloom;   ctx.fillRect(0, 0, W, H); }
      if (bgVignette){ ctx.fillStyle = bgVignette; ctx.fillRect(0, 0, W, H); }

      // Drifting background particles
      drawParticles(frame);

      // Waves (back to front) — with surge amp + mouse parallax Y + intro scale
      WAVE_CFGS.forEach((cfg, wi) => drawWave(cfg, wi, frame, surgeMult * intro));

      // Wave shimmer highlight pass
      ctx.globalAlpha = 0.038 * intro;
      WAVE_CFGS.forEach((cfg, wi) => drawWave({ ...cfg, a: 1, rgb: '180,220,255' }, wi, frame + 40, surgeMult * intro));
      ctx.globalAlpha = 1;

      // Sparkle glints on wave crests (parallax-corrected)
      WAVE_CFGS.forEach((cfg, wi) => drawSparkles(cfg, wi, frame));

      // Orbs
      // Compute live positions this frame and cache for hit detection
      const pos = prepped.map(p => ({ ...p, ...livePos(p, frame) }));
      posRef.current = pos;

      // Label stagger: for each orb, check if a neighbor on same wave is within 80px X
      // and assign a -1/+1 stagger direction to avoid label overlap
      const staggerMap = {};
      const byWave = [[], [], [], [], []];
      pos.filter(p => !p._filtered).forEach(p => byWave[p.waveIndex].push(p));
      byWave.forEach(wave => {
        const sorted = [...wave].sort((a, b) => a.x - b.x);
        sorted.forEach((p, i) => {
          const hasL = i > 0 && Math.abs(p.x - sorted[i-1].x) < 100;
          const hasR = i < sorted.length - 1 && Math.abs(p.x - sorted[i+1].x) < 100;
          staggerMap[p.id] = (hasL || hasR) ? (i % 2 === 0 ? 1 : -1) : 0;
        });
      });

      // Constellation lines between nearby same-wave orbs
      drawConstellations(pos);

      // Selected-orb wave bloom (drawn before orbs so it's underneath)
      drawSelectedBloom(pos, frame);

      // Draw lower urgency first so critical orbs render on top
      [...pos].sort((a, b) => a.urg - b.urg).forEach(p => drawOrb(p, frame, staggerMap, introFrame));

      // Bottom urgency strip
      drawUrgencyStrip(pos, frame, intro);

      // Bloom ring bursts
      bloomsRef.current = bloomsRef.current.filter(b => frame - b.startFrame < 58);
      bloomsRef.current.forEach(b => drawBloom(b, frame));

      // Live countdown top-right
      drawCountdown(frame, intro);

      // JUNO synthesis card bottom-left
      drawJunoCard(frame);

      // Hover tooltip with text wrapping
      if (hovRef.current) {
        const p = pos.find(o => o.id === hovRef.current && !o._filtered);
        if (p) {
          const col    = orbColor(p);
          const TIP_W  = 230;
          const LPAD   = 13;
          const titleLines = wrapText(p.title, '500 11px "DM Sans",system-ui', TIP_W - LPAD * 2);
          const noteLines  = p.note ? wrapText(p.note, '10px "DM Sans",system-ui', TIP_W - LPAD * 2) : [];
          const totalLines = titleLines.length + noteLines.length;
          const boxH = totalLines * 16 + (noteLines.length ? 10 : 0) + 18;
          let tx = p.x - TIP_W / 2;
          let ty = p.y - (7 + p.urg * 6) - boxH - 14;
          tx = Math.max(8, Math.min(W - TIP_W - 8, tx));
          ty = Math.max(8, ty);

          ctx.fillStyle = 'rgba(4,8,20,0.94)';
          ctx.beginPath();
          ctx.roundRect?.(tx, ty, TIP_W, boxH, 6) || ctx.rect(tx, ty, TIP_W, boxH);
          ctx.fill();
          ctx.strokeStyle = `rgba(${col.rgb},0.28)`;
          ctx.lineWidth = 0.8; ctx.stroke();
          // Left accent
          ctx.fillStyle = `rgba(${col.rgb},0.5)`;
          ctx.fillRect(tx, ty + 5, 2, boxH - 10);

          let lineY = ty + 15;
          titleLines.forEach(line => {
            ctx.font = '500 11px "DM Sans",system-ui';
            ctx.textAlign = 'left';
            ctx.fillStyle = `rgba(${col.rgb},0.95)`;
            ctx.fillText(line, tx + LPAD, lineY);
            lineY += 16;
          });
          if (noteLines.length) {
            lineY += 4;
            noteLines.forEach(line => {
              ctx.font = '10px "DM Sans",system-ui';
              ctx.fillStyle = 'rgba(160,185,215,0.68)';
              ctx.fillText(line, tx + LPAD, lineY);
              lineY += 16;
            });
          }
        }
      }

      // Corner brackets (fade with intro)
      const bS = 20, bP = 18;
      ctx.globalAlpha = intro;
      [[bP,bP,1,1],[W-bP,bP,-1,1],[bP,H-bP,1,-1],[W-bP,H-bP,-1,-1]].forEach(([bx,by,sx,sy]) => {
        ctx.strokeStyle = 'rgba(80,140,200,0.18)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+sx*bS,by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx,by+sy*bS); ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // User identity header (top-left, fade with intro)
      const displayName = (userName || 'JAMES PARK').toUpperCase();
      ctx.globalAlpha = intro;
      ctx.textAlign   = 'left';
      ctx.font        = `bold 8px "DM Mono","Courier New",monospace`;
      ctx.fillStyle   = 'rgba(80,140,200,0.30)';
      ctx.fillText(displayName, bP + bS + 8, bP + 2);
      ctx.font        = `7px "DM Mono","Courier New",monospace`;
      ctx.fillStyle   = 'rgba(80,140,200,0.16)';
      ctx.fillText('PRE-MED · JUNO ROOT', bP + bS + 8, bP + 13);
      ctx.globalAlpha = 1;

      // Subtle inner canvas frame glow (cached in resize, no per-frame recreation)
      if (bgFrameGlow)  { ctx.fillStyle = bgFrameGlow;  ctx.fillRect(0, 0, W, H); }
      if (bgFrameGlowH) { ctx.fillStyle = bgFrameGlowH; ctx.fillRect(0, 0, W, H); }

      // Active orb count (bottom-right, above strip — avoids overlap with strip items)
      const activeN = prepped.filter(o => !o._filtered).length;
      ctx.globalAlpha = intro * 0.75;
      ctx.font        = '7px "DM Mono","Courier New",monospace';
      ctx.textAlign   = 'right';
      ctx.fillStyle   = 'rgba(80,140,200,0.28)';
      ctx.fillText(`${activeN} NODES`, W - 26, H - 52);
      ctx.globalAlpha = 1;
    }

    rafId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafId); obs.disconnect(); };
  }, [orbs]);

  function getHit(ex, ey) {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = ex - rect.left, my = ey - rect.top;
    let best = null, bd = 32;
    for (const p of posRef.current) {
      if (p._filtered) continue;
      const r = 7 + p.urg * 6 + 12;
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < r && d < bd) { best = p; bd = d; }
    }
    return best;
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={e => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top)  / rect.height,
        };
        const h = getHit(e.clientX, e.clientY);
        hovRef.current = h?.id || null;
        if (canvasRef.current) canvasRef.current.style.cursor = h ? 'pointer' : 'default';
      }}
      onMouseLeave={() => { mouseRef.current = { x: 0.5, y: 0.5 }; hovRef.current = null; if (canvasRef.current) canvasRef.current.style.cursor = 'default'; }}
      onClick={e => {
        const h = getHit(e.clientX, e.clientY);
        clickRef.current?.(h || null);
        if (h) {
          surgeRef.current = frameRef.current;
          const rgb = h.kind === 'flag'  ? '220,200,140'
                    : h.urg  >= 0.85     ? '255,100,40'
                    : h.urg  >= 0.65     ? '255,160,50'
                    : h.kind === 'email' ? '80,160,255'
                    : h.urg  >= 0.45     ? '60,200,180'
                    :                      '80,140,200';
          bloomsRef.current = [
            ...bloomsRef.current.filter(b => frameRef.current - b.startFrame < 58),
            { id: h.id, startFrame: frameRef.current, x: h.x, y: h.y, r: 7 + h.urg * 6, rgb },
          ];
        }
      }}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function OrbPanel({ orb, closing, onClose, onDraftReply }) {
  if (!orb) return null;
  const col = orb.urg >= 0.85 ? { rgb:'255,100,40', hex:'#FF6428' }
            : orb.kind==='flag'? { rgb:'220,200,140',hex:'#DCC88C' }
            : orb.kind==='email'? { rgb:'80,160,255', hex:'#50A0FF' }
            : orb.urg >= 0.45  ? { rgb:'60,200,180', hex:'#3CC8B4' }
            :                    { rgb:'80,140,200',  hex:'#508CC8' };
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 320, height: '100%',
      background: 'rgba(6,10,20,0.96)',
      borderLeft: `1px solid rgba(${col.rgb},0.18)`,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      animation: closing ? 'orbPanelOut 0.22s ease forwards' : 'orbPanelIn 0.2s ease',
      zIndex: 10,
    }}>
      <style>{`
        @keyframes orbPanelIn  { from { opacity:0; transform:translateX(12px) } to { opacity:1; transform:none } }
        @keyframes orbPanelOut { from { opacity:1; transform:none } to { opacity:0; transform:translateX(12px) } }
      `}</style>

      <div style={{ padding: '20px 20px 15px', borderBottom: `1px solid rgba(${col.rgb},0.12)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 3,
              background: `rgba(${col.rgb},0.12)`,
              border: `1px solid rgba(${col.rgb},0.20)`,
              fontSize: 7, fontFamily: "'DM Mono','Courier New',monospace",
              letterSpacing: '2px', color: `rgba(${col.rgb},0.70)`,
              textTransform: 'uppercase',
            }}>
              {orb.kind === 'email' ? '✉ EMAIL' : orb.kind === 'flag' ? '⚑ JUNO FLAG' : '◈ CALENDAR'}
            </div>
            <div style={{ fontSize: 7.5, fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '2px', color: `rgba(${col.rgb},0.40)` }}>
              {orb.tag}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:`rgba(${col.rgb},0.35)`,fontSize:20,padding:0,lineHeight:1,flexShrink:0,marginTop:-2 }}>×</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: `rgba(${col.rgb},0.95)` }}>
          {orb.title}
        </div>
      </div>

      {orb.note && (
        <div style={{ padding: '15px 20px', borderBottom: `1px solid rgba(${col.rgb},0.08)` }}>
          <div style={{ fontSize: 7.5, fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '2px', color: `rgba(${col.rgb},0.38)`, marginBottom: 8 }}>JUNO</div>
          <div style={{ fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.55, color: `rgba(${col.rgb},0.68)` }}>{orb.note}</div>
        </div>
      )}

      {orb.kind === 'cal' && orb.rawData?.startRaw && (() => {
        const dt = new Date(orb.rawData.startRaw);
        const dateStr = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return (
          <div style={{ padding: '13px 20px', borderBottom: `1px solid rgba(${col.rgb},0.08)`, display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 7.5, fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '2px', color: `rgba(${col.rgb},0.35)`, marginBottom: 5 }}>DATE</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: `rgba(${col.rgb},0.80)` }}>{dateStr}</div>
            </div>
            <div>
              <div style={{ fontSize: 7.5, fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '2px', color: `rgba(${col.rgb},0.35)`, marginBottom: 5 }}>TIME</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: `rgba(${col.rgb},0.80)` }}>{timeStr}</div>
            </div>
          </div>
        );
      })()}

      {orb.rawData?.snippet && (
        <div style={{ padding: '15px 20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 7.5, fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '2px', color: `rgba(${col.rgb},0.32)`, marginBottom: 8 }}>EXCERPT</div>
          <div style={{ fontSize: 12, lineHeight: 1.65, color: `rgba(${col.rgb},0.40)` }}>{orb.rawData.snippet}</div>
        </div>
      )}

      {orb.rawData?.from && (
        <div style={{ padding: '11px 20px', borderTop: `1px solid rgba(${col.rgb},0.08)` }}>
          <div style={{ fontSize: 7.5, fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '2px', color: `rgba(${col.rgb},0.32)`, marginBottom: 5 }}>FROM</div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono','Courier New',monospace", color: `rgba(${col.rgb},0.55)` }}>{orb.rawData.from}</div>
        </div>
      )}

      {orb.kind === 'email' && orb.rawData && (
        <div style={{ padding: '14px 20px', borderTop: `1px solid rgba(${col.rgb},0.10)` }}>
          <button
            onClick={() => { onDraftReply(orb.rawData); onClose(); }}
            style={{ width:'100%',padding:'10px 0',background:`rgba(${col.rgb},0.10)`,border:`1px solid rgba(${col.rgb},0.25)`,borderRadius:3,color:`rgba(${col.rgb},0.82)`,fontFamily:"'DM Mono','Courier New',monospace",fontSize:9,letterSpacing:'2.5px',cursor:'pointer' }}
          >DRAFT REPLY</button>
        </div>
      )}
    </div>
  );
}

// ─── Filter config ────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',      label: 'All',      match: () => true },
  { key: 'urgent',   label: 'Urgent',   match: o => o.urg >= 0.72 },
  { key: 'today',    label: 'Today',    match: o => o.days === 0 },
  { key: 'email',    label: 'Email',    match: o => o.kind === 'email' },
  { key: 'calendar', label: 'Calendar', match: o => o.kind === 'cal' },
  { key: 'flags',    label: 'Flags',    match: o => o.kind === 'flag' },
];

// ─── Filter pill bar ──────────────────────────────────────────────────────────
function FilterBar({ active, onChange, counts }) {
  return (
    <div style={{
      position:   'absolute', top: 64, left: '50%',
      transform:  'translateX(-50%)',
      display:    'flex', gap: 4,
      zIndex:     25,
      background: 'rgba(4,8,20,0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border:     '1px solid rgba(80,140,200,0.14)',
      borderRadius: 28,
      padding:    '5px 8px',
      boxShadow:  '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {FILTERS.map(f => {
        const isActive = active === f.key;
        const count    = counts?.[f.key];
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              display:      'flex', alignItems: 'center', gap: 5,
              padding:      '4px 12px',
              borderRadius: 20,
              border:       'none',
              background:   isActive ? 'rgba(80,160,220,0.20)' : 'transparent',
              color:        isActive ? 'rgba(150,215,255,0.95)' : 'rgba(100,150,200,0.45)',
              fontFamily:   "'DM Mono','Courier New',monospace",
              fontSize:     9,
              letterSpacing: '1.6px',
              cursor:       'pointer',
              textTransform:'uppercase',
              transition:   'all 0.12s',
              outline:      isActive ? '1px solid rgba(80,160,220,0.28)' : 'none',
              fontWeight:   isActive ? 600 : 400,
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(140,200,255,0.65)'; e.currentTarget.style.background = 'rgba(80,140,200,0.08)'; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(100,150,200,0.45)'; e.currentTarget.style.background = 'transparent'; }}}
          >
            {f.label}
            {count != null && f.key !== 'all' && (
              <span style={{
                fontSize: 8, fontWeight: 700,
                color: isActive ? 'rgba(150,215,255,0.65)' : 'rgba(100,150,200,0.30)',
                letterSpacing: 0,
              }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── RootBoard ────────────────────────────────────────────────────────────────
export default function RootBoard({ data, loading }) {
  const [selected,     setSelected]     = useState(null);
  const [closingOrb,   setClosingOrb]   = useState(null);  // holds orb during fade-out
  const [draftEmail,   setDraftEmail]   = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  function closePanel() {
    if (!selected) return;
    setClosingOrb(selected);
    setSelected(null);
    setTimeout(() => setClosingOrb(null), 220);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') closePanel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);
  const allOrbs = useMemo(() => deriveOrbs(data), [data]);

  const filterFn = FILTERS.find(f => f.key === activeFilter)?.match ?? (() => true);
  const orbs = useMemo(
    () => allOrbs.map(o => ({ ...o, _filtered: !filterFn(o) })),
    [allOrbs, activeFilter],
  );
  const filterCounts = useMemo(() => {
    const c = {};
    FILTERS.forEach(f => { c[f.key] = allOrbs.filter(f.match).length; });
    return c;
  }, [allOrbs]);

  if (loading) return <Loading />;

  return (
    <>
      <div style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:20,background:'#080D18',overflow:'hidden' }}>
        <WaveCanvas orbs={orbs} selectedId={selected?.id} onOrbClick={o => setSelected(o)} userName={data?.user?.name} />
        <FilterBar active={activeFilter} onChange={k => { setActiveFilter(k); closePanel(); }} counts={filterCounts} />
        <OrbPanel orb={selected || closingOrb} closing={!selected && !!closingOrb} onClose={closePanel} onDraftReply={setDraftEmail} />
      </div>
      {draftEmail && <DraftCompose email={draftEmail} accent="#3CC8B4" onClose={() => setDraftEmail(null)} />}
    </>
  );
}

function Loading() {
  return (
    <div style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:20,background:'#080D18',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono','Courier New',monospace" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:9,letterSpacing:'4px',color:'rgba(80,140,200,0.4)',marginBottom:12,textTransform:'uppercase' }}>Root</div>
        <div style={{ fontSize:10,color:'rgba(60,200,180,0.3)',letterSpacing:'2px' }}>LOADING…</div>
      </div>
    </div>
  );
}
