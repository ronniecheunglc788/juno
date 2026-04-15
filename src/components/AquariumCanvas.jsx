import { useEffect, useRef } from 'react';

// ── Color map ──────────────────────────────────────────────────────
const ANIMAL_COLOR = {
  'stingray':      '#CC1A44',
  'tropical-fish': '#FF8C20',
  'fish':          '#2288CC',
  'event-fish':    '#FFD700',
  'seahorse':      '#00C896',
  'crab':          '#AA7744',
  'turtle':        '#2A8855',
  'jellyfish':     '#C084FC',
  'user':          '#00D4FF',
  'habit-fish':    '#00FFB3',
  'data-fish':     '#7B61FF',
  'code-fish':     '#22D3EE',
};
function tColor(type) { return ANIMAL_COLOR[type] || '#44AACC'; }

// ── Kelp forest ───────────────────────────────────────────────────────
function genKelp(W, H) {
  const floor = H * 0.82;
  // Cluster in one area (left-center, feels like a "kelp forest zone")
  const zoneX = W * 0.62;
  return Array.from({ length: 7 }, (_, i) => {
    const h = H * (0.48 + Math.random() * 0.28); // tall — reaches 48-76% of scene height
    const frondCount = 5 + Math.floor(Math.random() * 4);
    return {
      x:     zoneX + (i - 3) * (28 + Math.random() * 18) + (Math.random() - 0.5) * 14,
      y:     floor,
      h,
      phase: Math.random() * Math.PI * 2,
      // Fronds at different heights along the stipe
      fronds: Array.from({ length: frondCount }, (_, k) => ({
        t:     0.18 + (k / frondCount) * 0.72, // position along stipe (0=base, 1=tip)
        side:  k % 2 === 0 ? 1 : -1,           // alternating sides
        len:   18 + Math.random() * 28,
        phase: Math.random() * Math.PI * 2,
        width: 6 + Math.random() * 8,
      })),
    };
  });
}

function drawKelp(ctx, k, frame, daylight) {
  const { x, y, h, phase, fronds } = k;
  const nightGlow = Math.max(0, 1 - daylight * 1.8);
  // Primary stipe sway (slower and bigger than seaweed)
  const mainSway = Math.sin(frame * 0.012 + phase) * h * 0.035;

  ctx.save();

  // Stipe — thick tapered trunk
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Use bezier so stipe curves organically with the sway
  const tipX = x + mainSway;
  const tipY = y - h;
  ctx.bezierCurveTo(
    x + mainSway * 0.25, y - h * 0.35,
    tipX - mainSway * 0.1, tipY + h * 0.25,
    tipX, tipY
  );
  const stipeGrad = ctx.createLinearGradient(x, y, x, y - h);
  stipeGrad.addColorStop(0,   `hsl(130,38%,${nightGlow > 0.1 ? 28 : 18}%)`);
  stipeGrad.addColorStop(0.5, `hsl(135,42%,${nightGlow > 0.1 ? 22 : 14}%)`);
  stipeGrad.addColorStop(1,   `hsl(140,45%,${nightGlow > 0.1 ? 18 : 12}%)`);
  ctx.strokeStyle = stipeGrad;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Fronds — blade-shaped leaves branching off stipe
  fronds.forEach(fr => {
    // Position along the stipe curve
    const t  = fr.t;
    const sx = x + mainSway * t;
    const sy = y - h * t;
    const frSway = Math.sin(frame * 0.018 + phase + fr.phase + t * 2.2) * fr.len * 0.28;

    // Frond base direction (horizontal with the side + sway influence)
    const bx = sx + fr.side * (fr.len * 0.55 + frSway);
    const by = sy - fr.len * 0.22;
    // Tip position with a downward droop (buoyancy isn't enough at tip)
    const tx2 = sx + fr.side * (fr.len + frSway * 1.3);
    const ty2 = sy + fr.len * 0.12;

    // Frond shape as filled path (blade ellipse approximated by bezier)
    ctx.beginPath();
    ctx.moveTo(sx + fr.side * 3, sy);
    ctx.bezierCurveTo(
      bx, by - fr.width * 0.5,
      tx2 - fr.side * fr.len * 0.2, ty2 - fr.width * 0.3,
      tx2, ty2
    );
    ctx.bezierCurveTo(
      tx2 - fr.side * fr.len * 0.2, ty2 + fr.width * 0.4,
      bx, by + fr.width * 0.6,
      sx + fr.side * 3, sy
    );
    const frondAlpha = 0.72 + nightGlow * 0.15;
    ctx.fillStyle = `hsla(140,${40 + nightGlow * 15}%,${nightGlow > 0.1 ? 26 : 16}%,${frondAlpha})`;
    ctx.fill();

    // Mid-rib
    ctx.beginPath();
    ctx.moveTo(sx + fr.side * 2, sy);
    ctx.quadraticCurveTo(bx * 0.7 + tx2 * 0.3, (by + ty2) * 0.5, tx2, ty2);
    ctx.strokeStyle = `hsla(140,35%,${nightGlow > 0.05 ? 35 : 22}%,0.5)`;
    ctx.lineWidth = 0.8; ctx.stroke();

    // Night glow on frond tips
    if (nightGlow > 0.06) {
      ctx.beginPath(); ctx.arc(tx2, ty2, 1.8 + nightGlow, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(155,70%,55%,${nightGlow * 0.38})`; ctx.fill();
    }
  });

  // Kelp tip — pneumatocyst float ball
  const tipX2 = x + mainSway;
  const tipY2 = y - h;
  ctx.beginPath(); ctx.arc(tipX2, tipY2, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(145,50%,${nightGlow > 0.1 ? 40 : 25}%,0.85)`; ctx.fill();

  ctx.restore();
}

// ── Scene generation ───────────────────────────────────────────────
function genCoral(W, H) {
  const floor = H * 0.82;
  const palette = ['#FF6B8A','#FF8C42','#7B61FF','#00D4AA','#FF4466','#44DDBB','#FF9055'];
  return Array.from({ length: 18 }, (_, i) => ({
    x:     (i / 18) * W * 1.06 - W * 0.03 + (Math.random() - 0.5) * 44,
    y:     floor,
    h:     22 + Math.random() * 58,
    type:  Math.floor(Math.random() * 4),
    color: palette[Math.floor(Math.random() * palette.length)],
    phase: Math.random() * Math.PI * 2,
  }));
}

function genSeaweed(W, H) {
  const floor = H * 0.82;
  return Array.from({ length: 24 }, () => ({
    x:     Math.random() * W,
    y:     floor,
    h:     30 + Math.random() * 88,
    segs:  5 + Math.floor(Math.random() * 5),
    phase: Math.random() * Math.PI * 2,
    hue:   140 + Math.random() * 55,
    width: 1.8 + Math.random() * 2.8,
  }));
}

function genRays(W) {
  return Array.from({ length: 12 }, (_, i) => ({  // increased from 9 → 12 rays
    x:     (i / 12) * W * 1.14 - W * 0.07 + (Math.random() - 0.5) * 55,
    width: 28 + Math.random() * 100,
    phase: Math.random() * Math.PI * 2,
  }));
}

function genBubbles(W, H) {
  return Array.from({ length: 55 }, () => ({
    x:     Math.random() * W,
    y:     H * 0.68 + Math.random() * H * 0.22,
    r:     1.0 + Math.random() * 3.2,
    speed: 0.28 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    drift: (Math.random() - 0.5) * 0.28,
  }));
}

function genAnemones(W, H) {
  const floor = H * 0.82;
  return Array.from({ length: 8 }, (_, i) => ({
    x:          W * 0.08 + (i / 7) * W * 0.84 + (Math.random() - 0.5) * 30,
    y:          floor,
    tentacles:  6 + Math.floor(Math.random() * 4),
    height:     18 + Math.random() * 22,
    spread:     14 + Math.random() * 12,
    phase:      Math.random() * Math.PI * 2,
    hue:        280 + Math.random() * 80,
  }));
}

// ── Clownfish ──────────────────────────────────────────────────────────
function genClownfish(anemones) {
  // One clownfish per anemone — they live inside and occasionally dart out
  return anemones.map(a => ({
    ax: a.x, ay: a.y,             // host anemone position
    x:  a.x, y:  a.y - a.height * 0.5,
    vx: 0, vy: 0,
    phase: Math.random() * Math.PI * 2,
    dir: Math.random() < 0.5 ? 1 : -1,
    state: 'hiding',              // 'hiding' | 'exploring' | 'returning'
    timer: Math.floor(Math.random() * 200),
    targetX: a.x, targetY: a.y - a.height * 0.5,
    homeX:   a.x, homeY:   a.y - a.height * 0.5,
    stripePhase: Math.random() * Math.PI * 2,
  }));
}

function updateClownfish(clowns, W, H, frame) {
  clowns.forEach(c => {
    c.timer = Math.max(0, c.timer - 1);

    if (c.state === 'hiding') {
      // Gently bob near home position
      c.x += (c.homeX - c.x) * 0.12;
      c.y += (c.homeY + Math.sin(frame * 0.06 + c.phase) * 3 - c.y) * 0.12;
      if (c.timer === 0 && Math.random() < 0.012) {
        // Dart out to explore
        const angle = (Math.random() - 0.5) * Math.PI * 0.8;
        const dist  = 18 + Math.random() * 22;
        c.targetX = c.homeX + Math.cos(angle) * dist;
        c.targetY = c.homeY - Math.abs(Math.sin(angle)) * dist * 0.5;
        c.targetY = Math.max(H * 0.12, Math.min(c.homeY - 4, c.targetY));
        c.state = 'exploring';
        c.timer = 80 + Math.floor(Math.random() * 120);
      }
    } else if (c.state === 'exploring') {
      // Swim toward target
      c.x += (c.targetX - c.x) * 0.08;
      c.y += (c.targetY + Math.sin(frame * 0.09 + c.phase) * 2 - c.y) * 0.08;
      const dx = c.x - c.targetX, dy = c.y - c.targetY;
      if (c.timer === 0 || Math.sqrt(dx * dx + dy * dy) < 3) {
        c.state = 'returning';
      }
      // Face direction of travel
      const mvx = c.targetX - c.x;
      if (Math.abs(mvx) > 0.3) c.dir = mvx > 0 ? 1 : -1;
    } else {
      // Return to anemone
      c.x += (c.homeX - c.x) * 0.10;
      c.y += (c.homeY - c.y) * 0.10;
      if (Math.abs(c.x - c.homeX) < 2 && Math.abs(c.y - c.homeY) < 2) {
        c.state = 'hiding';
        c.timer = 60 + Math.floor(Math.random() * 180);
      }
      const mvx = c.homeX - c.x;
      if (Math.abs(mvx) > 0.3) c.dir = mvx > 0 ? 1 : -1;
    }
  });
}

function drawClownfish(ctx, c, frame) {
  const sz = 4.5;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.dir, 1); // face direction
  ctx.rotate(Math.sin(frame * 0.08 + c.phase) * 0.12); // slight waggle

  // Body — orange ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, sz * 1.4, sz * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#FF6B20'; ctx.fill();

  // White stripe across middle
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, sz * 0.32, sz * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fill();
  // White head stripe
  ctx.beginPath();
  ctx.ellipse(sz * 0.88, 0, sz * 0.28, sz * 0.60, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fill();
  ctx.restore();

  // Black outline (thin)
  ctx.beginPath();
  ctx.ellipse(0, 0, sz * 1.4, sz * 0.72, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(30,15,5,0.55)'; ctx.lineWidth = 0.5; ctx.stroke();

  // Tail fin
  ctx.beginPath();
  ctx.moveTo(-sz * 1.2, 0);
  ctx.lineTo(-sz * 1.85, -sz * 0.65);
  ctx.lineTo(-sz * 1.85,  sz * 0.65);
  ctx.closePath();
  ctx.fillStyle = '#FF6B20'; ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-sz * 0.4, -sz * 0.68);
  ctx.lineTo(sz * 0.2,  -sz * 1.05);
  ctx.lineTo(sz * 0.8,  -sz * 0.68);
  ctx.fillStyle = '#FF6B20'; ctx.fill();

  // Eye
  ctx.beginPath(); ctx.arc(sz * 0.78, -sz * 0.12, sz * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#050505'; ctx.fill();
  ctx.beginPath(); ctx.arc(sz * 0.84, -sz * 0.18, sz * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();

  ctx.restore();
}

function genRocks(W, H) {
  const floor = H * 0.82;
  return Array.from({ length: 7 }, () => ({
    x:  Math.random() * W,
    y:  floor + 4 + Math.random() * 8,
    rx: 18 + Math.random() * 38,
    ry: 10 + Math.random() * 18,
  }));
}

function genUrchin(W, H) {
  const floor = H * 0.82;
  const spineCount = 18;
  return Array.from({ length: 14 }, (_, i) => {
    const hue = 260 + Math.random() * 60; // purple-blue
    return {
      x:     (i / 13) * W * 1.05 - W * 0.025 + (Math.random() - 0.5) * 55,
      y:     floor + 2 + Math.random() * 6,
      r:     5 + Math.random() * 9,       // body radius
      spineLen: 8 + Math.random() * 12,   // spine length
      spineCount,
      hue,
      phase: Math.random() * Math.PI * 2,
      // Per-spine tip pulse offsets
      spinePhases: Array.from({ length: spineCount }, () => Math.random() * Math.PI * 2),
    };
  });
}

function drawUrchin(ctx, u, frame, daylight) {
  const { x, y, r, spineLen, spineCount, hue, phase, spinePhases } = u;
  const nightGlow = Math.max(0, 1 - daylight * 1.8); // 0 at day, peaks at night

  ctx.save();
  ctx.translate(x, y);

  // Ground ambient glow at night
  if (nightGlow > 0.05) {
    const poolR = (r + spineLen) * 1.5;
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, poolR);
    pool.addColorStop(0,   `hsla(${hue},75%,55%,${nightGlow * 0.18})`);
    pool.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, poolR, 0, Math.PI * 2);
    ctx.fillStyle = pool; ctx.fill();
  }

  // Spines
  for (let s = 0; s < spineCount; s++) {
    const angle   = (s / spineCount) * Math.PI * 2 + frame * 0.004;
    const tipPulse = 0.5 + 0.5 * Math.sin(frame * 0.06 + spinePhases[s]);
    const len     = spineLen * (0.88 + tipPulse * 0.12);

    const tx = Math.cos(angle) * len;
    const ty = Math.sin(angle) * len;

    // Spine shaft — tapered gradient from base to tip
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = `hsla(${hue},40%,${daylight > 0.5 ? 22 : 28}%,0.85)`;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Bioluminescent tip bead at night
    if (nightGlow > 0.02) {
      const tipAlpha = nightGlow * (0.4 + tipPulse * 0.55);
      ctx.beginPath();
      ctx.arc(tx, ty, 1.4 + tipPulse * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue + 20},85%,72%,${tipAlpha})`;
      ctx.shadowColor = `hsla(${hue + 10},90%,70%,${nightGlow * 0.7})`;
      ctx.shadowBlur  = 5;
      ctx.fill();
      ctx.shadowBlur  = 0;
    }
  }

  // Body dome
  const bodyG = ctx.createRadialGradient(-r * 0.28, -r * 0.28, 0, 0, 0, r * 1.1);
  bodyG.addColorStop(0,   `hsla(${hue + 10},45%,${nightGlow > 0.1 ? 38 : 22}%,0.92)`);
  bodyG.addColorStop(0.6, `hsla(${hue},38%,${nightGlow > 0.1 ? 28 : 15}%,0.90)`);
  bodyG.addColorStop(1,   `hsla(${hue - 10},30%,10%,0.75)`);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyG; ctx.fill();

  // Specular highlight
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.08 + nightGlow * 0.04})`; ctx.fill();

  ctx.restore();
}

function genSandDetails(W, H) {
  const floor = H * 0.83;
  const starfish = Array.from({ length: 4 }, () => ({
    x: Math.random() * W,
    y: floor + Math.random() * (H * 0.12),
    r: 6 + Math.random() * 8,
    rot: Math.random() * Math.PI * 2,
  }));
  const shells = Array.from({ length: 6 }, () => ({
    x:   Math.random() * W,
    y:   floor + Math.random() * (H * 0.12),
    r:   4 + Math.random() * 6,
    rot: Math.random() * Math.PI * 2,
  }));
  const dollars = Array.from({ length: 3 }, () => ({
    x:   Math.random() * W,
    y:   floor + Math.random() * (H * 0.12),
    r:   5 + Math.random() * 6,
  }));
  return { starfish, shells, dollars };
}

function genCaustics(W, H) {
  // Animated light patches on the floor simulating sunlight refracted through water
  const floor = H * 0.80;
  return Array.from({ length: 32 }, () => ({
    x:      Math.random() * W,
    y:      floor + Math.random() * H * 0.18,
    rx:     8 + Math.random() * 38,
    ry:     3 + Math.random() * 10,
    rot:    Math.random() * Math.PI,
    phase:  Math.random() * Math.PI * 2,
    speed:  0.007 + Math.random() * 0.012,
    drift:  (Math.random() - 0.5) * 0.18,
  }));
}

// ── Mid-water caustic cells ────────────────────────────────────────────
// These simulate sunlight refracted through the surface wave, projected
// through the water column as shimmering bright polygonal rings.
function genCausticCells(W, H) {
  const VERTS = 6; // polygon vertex count per cell
  return Array.from({ length: 28 }, () => {
    const cx = Math.random() * W;
    const cy = H * 0.04 + Math.random() * H * 0.72;
    const r  = 14 + Math.random() * 55;
    // Pre-generate random amplitude and phase per vertex for deformation
    const verts = Array.from({ length: VERTS }, (_, v) => ({
      baseAngle: (v / VERTS) * Math.PI * 2,
      amp:  r * (0.18 + Math.random() * 0.38),
      freq: 0.025 + Math.random() * 0.045,
      phase: Math.random() * Math.PI * 2,
    }));
    return { cx, cy, r, verts,
      driftX:  (Math.random() - 0.5) * 0.12,
      driftY:  (Math.random() - 0.5) * 0.04,
      phase:   Math.random() * Math.PI * 2,
      speed:   0.028 + Math.random() * 0.042,
      depth:   0.1 + Math.random() * 0.9, // lower = farther away = dimmer
    };
  });
}

function drawCausticCells(ctx, cells, frame, daylight = 1) {
  if (daylight < 0.05) return; // not visible at deep night
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  cells.forEach(c => {
    // Drift cell position gently
    const cx = c.cx + Math.sin(frame * c.speed * 0.7 + c.phase) * 18 + c.driftX * frame * 0.5;
    const cy = c.cy + Math.cos(frame * c.speed * 0.55 + c.phase * 1.3) * 8;

    // Build deforming polygon path
    ctx.beginPath();
    c.verts.forEach((v, i) => {
      const r  = c.r + Math.sin(frame * v.freq + v.phase) * v.amp;
      const px = cx + Math.cos(v.baseAngle + frame * c.speed * 0.18) * r;
      const py = cy + Math.sin(v.baseAngle + frame * c.speed * 0.18) * r * 0.42; // flatten vertically
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();

    // Brightness: fades with depth (far cells dimmer), scales with daylight
    const pulse = 0.5 + 0.5 * Math.sin(frame * c.speed * 2.2 + c.phase);
    const alpha = (0.018 + pulse * 0.022) * daylight * (0.35 + c.depth * 0.65);

    // Soft radial gradient fill — bright center, transparent edge
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.r * 1.4);
    grd.addColorStop(0,    `rgba(130,215,255,${alpha * 1.6})`);
    grd.addColorStop(0.45, `rgba(80,180,240,${alpha})`);
    grd.addColorStop(1,    'rgba(0,60,120,0)');
    ctx.fillStyle = grd;
    ctx.fill();

    // Bright edge ring — the characteristic caustic outline shimmer
    ctx.strokeStyle = `rgba(160,230,255,${alpha * 1.2})`;
    ctx.lineWidth = 0.7 + pulse * 0.6;
    ctx.stroke();
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── Tidal current ─────────────────────────────────────────────────────
function genTidalCurrent() {
  return {
    active:    false,
    angle:     0,       // direction of flow (radians)
    strength:  0,       // 0–1 envelope
    timer:     0,       // frames since sweep started
    duration:  480,     // frames per sweep (~8s at 60fps)
    cooldown:  0,       // frames until next potential sweep
    // Derived helpers (set when activated)
    cosA: 1, sinA: 0,
  };
}

function updateTidalCurrent(cs, frame) {
  if (cs.active) {
    cs.timer++;
    // Sine envelope: ramps up over first 20%, peaks, ramps down over last 20%
    const t = cs.timer / cs.duration;
    cs.strength = Math.sin(t * Math.PI); // 0 → 1 → 0
    if (cs.timer >= cs.duration) {
      cs.active    = false;
      cs.strength  = 0;
      cs.cooldown  = 2200 + Math.floor(Math.random() * 1800); // 37–67s gap
    }
  } else {
    cs.cooldown = Math.max(0, cs.cooldown - 1);
    if (cs.cooldown === 0 && Math.random() < 0.0014) {
      cs.active   = true;
      cs.timer    = 0;
      // Horizontal sweep (left or right), slight vertical tilt
      cs.angle    = Math.random() < 0.5 ? 0 : Math.PI;
      cs.angle   += (Math.random() - 0.5) * 0.4;
      cs.cosA     = Math.cos(cs.angle);
      cs.sinA     = Math.sin(cs.angle);
      cs.cooldown = 0;
    }
  }
}

function drawTidalCurrent(ctx, cs, W, H, frame) {
  if (!cs.active || cs.strength < 0.04) return;
  // Directional shimmer — horizontal streaks of light moving in current direction
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = cs.strength * 0.055;

  const streakCount = 14;
  for (let i = 0; i < streakCount; i++) {
    // Each streak drifts in current direction, loops across screen
    const t    = ((i / streakCount) + frame * 0.004 * Math.sign(cs.cosA || 1)) % 1;
    const sx   = t * W * 1.2 - W * 0.1;
    const sy   = H * (0.08 + (i / streakCount) * 0.80) + Math.sin(frame * 0.02 + i * 2.1) * 12;
    const len  = 30 + Math.sin(i * 3.7 + frame * 0.03) * 18;
    const alpha = (0.3 + 0.7 * Math.sin(i * 1.9 + frame * 0.025)) * cs.strength;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + cs.cosA * len, sy + cs.sinA * len * 0.3);
    ctx.strokeStyle = `rgba(80,185,255,${alpha * 0.6})`;
    ctx.lineWidth   = 0.6 + Math.abs(Math.sin(i * 2.3)) * 0.8;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function genCurrentParticles(W, H) {
  // Tiny motes that flow through a curl-noise field — makes water feel alive
  return Array.from({ length: 140 }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H * 0.90,
    size:  0.55 + Math.random() * 1.5,
    speed: 0.14 + Math.random() * 0.42,
    phase: Math.random() * Math.PI * 2,
    hue:   172 + Math.random() * 48,
    depth: 0.15 + Math.random() * 0.85,
  }));
}

function drawCurrentParticles(ctx, particles, W, H, frame) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const t = frame * 0.007;
  particles.forEach(p => {
    // Curl-noise-like flow: layered sines give organic swirling motion
    const fx = Math.sin(p.y * 0.013 + t * 0.65 + p.phase)       * 0.52
             + Math.cos(p.y * 0.007 + t * 0.28 + p.phase * 0.6) * 0.22;
    const fy = Math.cos(p.x * 0.010 + t * 0.48 + p.phase * 1.4) * 0.20
             + Math.sin(p.x * 0.005 + t * 0.35)                  * 0.10;
    p.x += (fx + 0.10) * p.speed;   // gentle rightward bias = base current
    p.y += fy * p.speed;
    // Wrap edges seamlessly
    if (p.x >  W + 8)    p.x = -8;
    if (p.x < -8)        p.x =  W + 8;
    if (p.y > H * 0.90)  p.y = 0;
    if (p.y < 0)         p.y = H * 0.90;

    const pulse = Math.sin(frame * 0.030 + p.phase) * 0.5 + 0.5;
    const alpha = (0.05 + pulse * 0.09) * p.depth;
    const r     = p.size * (0.75 + pulse * 0.25);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},78%,72%,${alpha})`;
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── Plankton clouds ──────────────────────────────────────────────────
function genPlankton(W, H) {
  // 5 slowly-drifting clouds of tiny bioluminescent motes in the mid water
  return Array.from({ length: 5 }, (_, i) => {
    const cx = W * (0.12 + i * 0.19) + (Math.random() - 0.5) * W * 0.08;
    const cy = H * (0.18 + Math.random() * 0.52);
    const hue = [175, 200, 260, 140, 220][i]; // teal, blue, violet, green, sky
    return {
      cx, cy,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.06,
      hue,
      motes: Array.from({ length: 38 }, () => ({
        dx:    (Math.random() - 0.5) * 80,
        dy:    (Math.random() - 0.5) * 44,
        phase: Math.random() * Math.PI * 2,
        size:  0.55 + Math.random() * 0.95,
        speed: 0.008 + Math.random() * 0.012,
      })),
    };
  });
}

function updateDrawPlankton(ctx, plankton, W, H, frame, daylight = 1, flashMult = 1) {
  // Plankton glow inversely with daylight — brilliant at night, amplified during flash
  const nightBoost = (0.55 + (1 - daylight) * 1.8) * flashMult;
  plankton.forEach(cloud => {
    cloud.cx += cloud.vx;
    cloud.cy += cloud.vy + Math.sin(frame * 0.003 + cloud.hue) * 0.04;
    if (cloud.cx < -80)  cloud.cx = W + 60;
    if (cloud.cx > W + 80) cloud.cx = -60;
    if (cloud.cy < H * 0.06) cloud.vy =  Math.abs(cloud.vy);
    if (cloud.cy > H * 0.78) cloud.vy = -Math.abs(cloud.vy);

    ctx.save();
    cloud.motes.forEach(m => {
      m.phase += m.speed;
      const wx = cloud.cx + m.dx + Math.sin(m.phase * 1.1) * 6;
      const wy = cloud.cy + m.dy + Math.cos(m.phase * 0.9) * 4;
      const pulse = 0.45 + 0.55 * Math.sin(m.phase * 2.3);
      const alpha = Math.min(pulse * 0.38 * nightBoost, 0.85);
      ctx.beginPath();
      ctx.arc(wx, wy, m.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${cloud.hue},90%,75%,${alpha})`;
      ctx.fill();
      if (m.size > 1.1) {
        ctx.beginPath();
        ctx.arc(wx, wy, m.size * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${cloud.hue},90%,75%,${alpha * 0.22})`;
        ctx.fill();
      }
    });
    ctx.restore();
  });
}

// ── Moray eels ───────────────────────────────────────────────────────
const EEL_SEGS = 20; // number of body segments

function genEels(W, H) {
  return Array.from({ length: 3 }, (_, i) => {
    const hx = W * (0.18 + i * 0.32) + (Math.random() - 0.5) * 60;
    const hy = H * (0.66 + Math.random() * 0.10);
    return {
      // Head
      hx, hy,
      dir:    Math.random() * Math.PI * 2,
      speed:  0.22 + Math.random() * 0.18,
      phase:  Math.random() * Math.PI * 2,
      hue:    [200, 270, 160][i], // blue-grey, purple, green
      // Body: array of segment positions, all start at head
      segs:   Array.from({ length: EEL_SEGS }, () => ({ x: hx, y: hy })),
      targetDir: Math.random() * Math.PI * 2,
    };
  });
}

function updateEels(eels, W, H, frame) {
  const floorY = H * 0.80, topY = H * 0.48;
  const segDist = 5.5; // distance between consecutive segment centers

  eels.forEach(eel => {
    // Head steering — gentle wandering near the bottom
    const m = 80;
    if      (eel.hx < m)       eel.targetDir = (Math.random() - 0.5) * 0.4;
    else if (eel.hx > W - m)   eel.targetDir = Math.PI + (Math.random() - 0.5) * 0.4;
    else if (eel.hy < topY)    eel.targetDir = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    else if (eel.hy > floorY)  eel.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    else if (Math.random() < 0.006) eel.targetDir += (Math.random() - 0.5) * 0.9;

    let diff = eel.targetDir - eel.dir;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    eel.dir += diff * 0.024;

    eel.hx += Math.cos(eel.dir) * eel.speed;
    eel.hy += Math.sin(eel.dir) * eel.speed;
    eel.hx = Math.max(30, Math.min(W - 30, eel.hx));
    eel.hy = Math.max(topY, Math.min(floorY, eel.hy));

    // Segments follow head in a chain (inverse kinematics style)
    eel.segs[0].x = eel.hx;
    eel.segs[0].y = eel.hy;
    for (let s = 1; s < eel.segs.length; s++) {
      const prev = eel.segs[s - 1], cur = eel.segs[s];
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 0.001;
      // Pull cur toward prev, maintaining segDist
      cur.x = prev.x + (dx / d) * segDist;
      cur.y = prev.y + (dy / d) * segDist;
    }
  });
}

function drawEel(ctx, eel, frame) {
  const { segs, hue, phase } = eel;
  if (segs.length < 2) return;

  ctx.save();
  // Draw body as a tapered ribbon — thick at head, thin at tail
  for (let s = 0; s < segs.length - 1; s++) {
    const t    = s / (segs.length - 1);
    const a    = segs[s], b = segs[s + 1];
    const w    = (1 - t) * 5.5 + 0.8; // taper from 5.5px to 0.8px

    // Lateral sine wave adds undulation perpendicular to segment direction
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const wave  = Math.sin(frame * 0.08 + phase - s * 0.38) * 2.5 * (1 - t * 0.5);

    const perpX = -Math.sin(angle) * wave;
    const perpY =  Math.cos(angle) * wave;

    const alpha = 0.72 - t * 0.28;
    // Iridescent shimmer shifts hue along body
    const segHue = hue + Math.sin(frame * 0.04 + s * 0.3) * 22;

    ctx.beginPath();
    ctx.moveTo(a.x + perpX, a.y + perpY);
    ctx.lineTo(b.x + perpX * 0.7, b.y + perpY * 0.7);
    ctx.strokeStyle = `hsla(${segHue},55%,38%,${alpha})`;
    ctx.lineWidth = w;
    ctx.lineCap  = 'round';
    ctx.stroke();

    // Bright dorsal stripe
    if (s < segs.length - 2) {
      const stripeAlpha = (0.35 - t * 0.28) * (0.6 + 0.4 * Math.sin(frame * 0.06 + s * 0.4));
      ctx.beginPath();
      ctx.moveTo(a.x + perpX, a.y + perpY);
      ctx.lineTo(b.x + perpX * 0.7, b.y + perpY * 0.7);
      ctx.strokeStyle = `hsla(${segHue + 30},80%,72%,${stripeAlpha})`;
      ctx.lineWidth = w * 0.28;
      ctx.stroke();
    }
  }

  // Head — ellipse with eye
  const head = segs[0], neck = segs[1];
  const hdir = Math.atan2(head.y - neck.y, head.x - neck.x);
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(hdir);
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue},45%,28%)`; ctx.fill();
  // Eye
  ctx.beginPath(); ctx.arc(4, -1.5, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0A12'; ctx.fill();
  ctx.beginPath(); ctx.arc(4.5, -2, 0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
  // Jaw hint
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(5, 2.5);
  ctx.strokeStyle = `hsla(${hue},45%,22%,0.6)`; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Anglerfish ────────────────────────────────────────────────────────
// Rises from below during night phase, dangles a glowing lure, then sinks
const ANGLER_LURE_SEGS = 8;

function genAnglerState(W, H) {
  return {
    active:  false,
    phase:   'hidden',  // hidden | rising | peek | sinking
    x:       W * 0.5,
    y:       H + 120,   // starts off-screen below
    targetY: H * 0.68,
    size:    28 + Math.random() * 14,
    hue:     190 + Math.random() * 40,
    timer:   0,
    // Lure: verlet chain dangling from head
    lure: Array.from({ length: ANGLER_LURE_SEGS }, (_, n) => ({
      x: W * 0.5, y: H + 120 - n * 7,
      px: W * 0.5, py: H + 120 - n * 7,
    })),
    cooldown: 0, // frames until next potential appearance
  };
}

function updateAngler(angler, W, H, frame, daylight) {
  // Only active when dark enough
  if (!angler.active) {
    angler.cooldown = Math.max(0, angler.cooldown - 1);
    if (angler.cooldown === 0 && daylight < 0.48 && Math.random() < 0.001) {
      angler.active  = true;
      angler.phase   = 'rising';
      angler.x       = W * (0.18 + Math.random() * 0.64);
      angler.y       = H + 130;
      angler.targetY = H * (0.55 + Math.random() * 0.18);
      angler.timer   = 0;
      // Reset lure to body position
      angler.lure.forEach((n, i) => { n.x = angler.x; n.y = angler.y - i * 7; n.px = n.x; n.py = n.y; });
    }
    return;
  }

  angler.timer++;

  if (angler.phase === 'rising') {
    angler.y += (angler.targetY - angler.y) * 0.018;
    if (Math.abs(angler.y - angler.targetY) < 4) {
      angler.phase = 'peek';
      angler.timer = 0;
    }
  } else if (angler.phase === 'peek') {
    // Gentle bob
    angler.y = angler.targetY + Math.sin(frame * 0.02) * 4;
    if (angler.timer > 380 || daylight > 0.52) { // sink if dawn breaks
      angler.phase = 'sinking';
    }
  } else if (angler.phase === 'sinking') {
    angler.y += (H + 140 - angler.y) * 0.02;
    if (angler.y > H + 128) {
      angler.active   = false;
      angler.cooldown = 2400 + Math.floor(Math.random() * 3000);
    }
  }

  // Lure verlet — anchor at top of head dorsal fin
  const lureAnchorX = angler.x - angler.size * 0.22;
  const lureAnchorY = angler.y - angler.size * 0.72;
  angler.lure[0].x = lureAnchorX; angler.lure[0].y = lureAnchorY;
  const SEG = 7;
  for (let n = 1; n < angler.lure.length; n++) {
    const nd = angler.lure[n];
    const vx = (nd.x - nd.px) * 0.76;
    const vy = (nd.y - nd.py) * 0.76;
    nd.px = nd.x; nd.py = nd.y;
    nd.x += vx + Math.sin(frame * 0.055 + n * 0.4) * 0.5;
    nd.y += vy + 0.14;
  }
  for (let p = 0; p < 2; p++) {
    for (let n = 1; n < angler.lure.length; n++) {
      const a = angler.lure[n - 1], b = angler.lure[n];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const c = (d - SEG) / d * 0.5;
      b.x -= dx * c; b.y -= dy * c;
    }
  }
}

function drawAngler(ctx, angler, frame) {
  if (!angler.active) return;
  const { x, y, size, hue, lure, phase } = angler;

  // Fade alpha based on phase
  const baseAlpha = phase === 'rising'  ? Math.min((angler.timer / 120), 1)
                  : phase === 'sinking' ? Math.max(1 - angler.timer / 90, 0)
                  : 1.0;
  if (baseAlpha < 0.01) return;

  ctx.save();
  ctx.globalAlpha = baseAlpha * 0.90;
  ctx.translate(x, y);

  // Deep-water ambient glow
  const aura = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 2.8);
  aura.addColorStop(0, `hsla(${hue},70%,30%,0.18)`);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(0, 0, size * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = aura; ctx.fill();

  // Body — fat rounded silhouette
  const bg = ctx.createRadialGradient(-size * 0.12, -size * 0.08, 0, 0, 0, size * 1.1);
  bg.addColorStop(0,   `hsla(${hue},40%,18%,0.95)`);
  bg.addColorStop(0.6, `hsla(${hue},30%,10%,0.92)`);
  bg.addColorStop(1,   `hsla(${hue},25%,5%,0.7)`);
  ctx.beginPath(); ctx.ellipse(0, 0, size * 1.0, size * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();

  // Huge jaw — extends forward and downward
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, size * 0.15);
  ctx.bezierCurveTo(size * 0.2, size * 0.25, size * 0.7, size * 0.05, size * 0.72, -size * 0.08);
  ctx.bezierCurveTo(size * 0.5, -size * 0.04, size * 0.1, -size * 0.1, -size * 0.5, size * 0.15);
  ctx.fillStyle = `hsla(${hue},35%,12%,0.88)`; ctx.fill();

  // Teeth (upper & lower row)
  ctx.fillStyle = 'rgba(200,220,210,0.7)';
  for (let t = 0; t < 8; t++) {
    const tx = -size * 0.38 + (t / 7) * size * 1.0;
    // Upper teeth
    ctx.beginPath(); ctx.moveTo(tx, size * 0.14);
    ctx.lineTo(tx + size * 0.03, size * 0.30);
    ctx.lineTo(tx + size * 0.06, size * 0.14); ctx.fill();
    // Lower teeth (shorter)
    if (t < 6) {
      const lx = tx + size * 0.04;
      ctx.beginPath(); ctx.moveTo(lx, size * 0.20);
      ctx.lineTo(lx + size * 0.025, size * 0.08);
      ctx.lineTo(lx + size * 0.05, size * 0.20); ctx.fill();
    }
  }

  // Pectoral fin
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, size * 0.1);
  ctx.bezierCurveTo(-size * 0.45, size * 0.42, -size * 0.5, size * 0.62, -size * 0.3, size * 0.55);
  ctx.bezierCurveTo(-size * 0.15, size * 0.48, -size * 0.06, size * 0.28, -size * 0.2, size * 0.1);
  ctx.fillStyle = `hsla(${hue},30%,14%,0.75)`; ctx.fill();

  // Eye — huge, deep-set
  const eyeX = size * 0.28, eyeY = -size * 0.10;
  ctx.beginPath(); ctx.arc(eyeX, eyeY, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(4,6,12,0.96)'; ctx.fill();
  const eyeGlow = ctx.createRadialGradient(eyeX - size * 0.06, eyeY - size * 0.06, 0, eyeX, eyeY, size * 0.22);
  eyeGlow.addColorStop(0, `hsla(${hue + 20},80%,65%,0.35)`);
  eyeGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(eyeX, eyeY, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = eyeGlow; ctx.fill();
  ctx.beginPath(); ctx.arc(eyeX + size * 0.06, eyeY - size * 0.06, size * 0.055, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();

  ctx.restore();

  // Lure filament + glowing bead
  if (lure.length > 1) {
    ctx.save();
    ctx.globalAlpha = baseAlpha * 0.75;
    ctx.beginPath();
    ctx.moveTo(lure[0].x, lure[0].y);
    for (let n = 1; n < lure.length; n++) ctx.lineTo(lure[n].x, lure[n].y);
    ctx.strokeStyle = `hsla(${hue + 10},55%,35%,0.65)`;
    ctx.lineWidth = 0.9; ctx.lineCap = 'round'; ctx.stroke();
    // Bioluminescent bead at tip
    const tip = lure[lure.length - 1];
    const lurePulse = 0.55 + 0.45 * Math.sin(frame * 0.08);
    const lr = 4.5 + lurePulse * 2.5;
    const lg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, lr * 3);
    lg.addColorStop(0,   `hsla(${hue + 40},90%,90%,${0.9 * lurePulse})`);
    lg.addColorStop(0.35,`hsla(${hue + 20},85%,65%,${0.55 * lurePulse})`);
    lg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(tip.x, tip.y, lr * 3, 0, Math.PI * 2);
    ctx.fillStyle = lg; ctx.fill();
    ctx.beginPath(); ctx.arc(tip.x, tip.y, lr, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + 40},90%,88%,${0.92 * lurePulse})`;
    ctx.shadowColor = `hsla(${hue + 30},90%,70%,0.9)`; ctx.shadowBlur = 12;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ── Background whale ──────────────────────────────────────────────────
function genWhaleState() {
  return {
    active: false,
    x: 0, y: 0,
    dir: 1,
    speed: 0,
    size: 0,
    alpha: 0,
    phase: 0,
    timer: 1200,
    rings: [],        // whale song ring pulses
    _ringTimer: 0,    // frames until next ring emission
  };
}

function updateWhale(whale, W, H, frame) {
  if (whale.active) {
    whale.x += whale.dir * whale.speed;
    const progress = (whale.x - (-whale.size)) / (W + whale.size * 2);
    const ease = Math.sin(Math.max(0, Math.min(progress, 1)) * Math.PI);
    whale.alpha = ease * 0.20;

    // Emit whale song rings periodically while visible
    whale._ringTimer = Math.max(0, whale._ringTimer - 1);
    if (whale._ringTimer === 0 && whale.alpha > 0.04) {
      whale.rings.push({
        x: whale.x, y: whale.y,
        r: 0, maxR: 340 + Math.random() * 100,
        life: 1.0,
        hue: 195 + Math.random() * 25, // blue-teal
      });
      whale._ringTimer = 200 + Math.floor(Math.random() * 120); // ~3.5–5s
    }

    if ((whale.dir > 0 && whale.x > W + whale.size + 40) ||
        (whale.dir < 0 && whale.x < -whale.size - 40)) {
      whale.active = false;
      whale.timer = 1800 + Math.floor(Math.random() * 2200);
    }
  } else {
    whale.timer--;
    if (whale.timer <= 0) {
      whale.dir    = Math.random() < 0.5 ? 1 : -1;
      whale.x      = whale.dir > 0 ? -300 : W + 300;
      whale.y      = H * (0.10 + Math.random() * 0.38);
      whale.speed  = 0.28 + Math.random() * 0.22;
      whale.size   = 160 + Math.random() * 90;
      whale.phase  = Math.random() * Math.PI * 2;
      whale.alpha  = 0;
      whale.active = true;
      whale._ringTimer = 150; // first ring soon after appearing
    }
  }

  // Update existing rings
  for (let i = whale.rings.length - 1; i >= 0; i--) {
    const ring = whale.rings[i];
    ring.r    += 1.4;           // expand ~1.4px/frame
    ring.life -= 0.004;         // fade over ~250 frames
    if (ring.life <= 0 || ring.r > ring.maxR) {
      whale.rings.splice(i, 1);
    }
  }
}

function drawWhale(ctx, whale, frame) {
  // Draw whale song rings first (in world space, behind whale body)
  if (whale.rings.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    whale.rings.forEach(ring => {
      // Rings are elliptical (wider than tall — underwater sound travels horizontally)
      const rW = ring.r, rH = ring.r * 0.42;
      const alpha = ring.life * 0.13;
      // Outer soft haze
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, rW * 1.08, rH * 1.08, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${ring.hue},75%,60%,${alpha * 0.4})`;
      ctx.lineWidth = 6; ctx.stroke();
      // Sharp inner ring
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, rW, rH, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${ring.hue},85%,75%,${alpha})`;
      ctx.lineWidth = 1.2; ctx.stroke();
    });
    ctx.restore();
  }

  if (!whale.active || whale.alpha < 0.005) return;
  const { x, y, dir, size, alpha, phase } = whale;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(dir, 1); // flip for direction

  // Flukes flap slowly
  const fluke = Math.sin(frame * 0.022 + phase) * 0.15;

  // Body — elongated ellipse
  const bodyW = size, bodyH = size * 0.28;
  const bg = ctx.createRadialGradient(-bodyW * 0.1, 0, bodyH * 0.1, 0, 0, bodyW * 1.1);
  bg.addColorStop(0,   'rgba(8,20,38,0.92)');
  bg.addColorStop(0.55,'rgba(6,15,30,0.85)');
  bg.addColorStop(1,   'rgba(4,10,22,0)');
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();

  // Head bump
  ctx.beginPath();
  ctx.ellipse(bodyW * 0.55, -bodyH * 0.08, bodyW * 0.2, bodyH * 0.65, 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(6,16,30,0.7)'; ctx.fill();

  // Pectoral fin (one side)
  ctx.beginPath();
  ctx.moveTo(bodyW * 0.15, bodyH * 0.15);
  ctx.bezierCurveTo(bodyW * 0.0, bodyH * 0.6, -bodyW * 0.12, bodyH * 0.75, -bodyW * 0.22, bodyH * 0.55);
  ctx.bezierCurveTo(-bodyW * 0.10, bodyH * 0.35, bodyW * 0.08, bodyH * 0.22, bodyW * 0.15, bodyH * 0.15);
  ctx.fillStyle = 'rgba(6,16,30,0.65)'; ctx.fill();

  // Tail flukes
  ctx.save();
  ctx.translate(-bodyW * 0.88, 0);
  ctx.rotate(fluke);
  // Upper fluke
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(bodyW * 0.06, -bodyH * 0.55, bodyW * 0.22, -bodyH * 0.80, bodyW * 0.28, -bodyH * 0.68);
  ctx.bezierCurveTo(bodyW * 0.20, -bodyH * 0.38, bodyW * 0.04, -bodyH * 0.18, 0, 0);
  ctx.fillStyle = 'rgba(8,18,34,0.72)'; ctx.fill();
  // Lower fluke
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(bodyW * 0.06, bodyH * 0.55, bodyW * 0.22, bodyH * 0.80, bodyW * 0.28, bodyH * 0.68);
  ctx.bezierCurveTo(bodyW * 0.20, bodyH * 0.38, bodyW * 0.04, bodyH * 0.18, 0, 0);
  ctx.fillStyle = 'rgba(8,18,34,0.72)'; ctx.fill();
  ctx.restore();

  // Eye
  ctx.beginPath(); ctx.arc(bodyW * 0.44, -bodyH * 0.05, bodyH * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5,12,24,0.85)'; ctx.fill();
  ctx.beginPath(); ctx.arc(bodyW * 0.448, -bodyH * 0.068, bodyH * 0.028, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();

  // Depth blur/haze overlay — makes it look deep and far away
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyW * 1.25, bodyH * 1.55, 0, 0, Math.PI * 2);
  const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, bodyW * 1.25);
  haze.addColorStop(0.4,'rgba(2,15,38,0)');
  haze.addColorStop(1,  'rgba(2,12,30,0.55)');
  ctx.fillStyle = haze; ctx.fill();

  ctx.restore();
}

// ── Creature turbulence wakes ──────────────────────────────────────────
function spawnTurbulence(pool, x, y, speed, dir) {
  // Emit a vortex mote from the creature's tail
  const perpAngle = dir + Math.PI * 0.5 * (Math.random() < 0.5 ? 1 : -1);
  const spread = speed * (0.4 + Math.random() * 0.6);
  pool.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    vx: Math.cos(perpAngle) * spread * 0.35 + Math.cos(dir + Math.PI) * spread * 0.3,
    vy: Math.sin(perpAngle) * spread * 0.35 + Math.sin(dir + Math.PI) * spread * 0.3,
    r:  3 + Math.random() * 5,
    maxR: 14 + Math.random() * 18,
    life: 1.0,
    decay: 0.012 + Math.random() * 0.008,
    spin:  (Math.random() - 0.5) * 0.12,
    angle: Math.random() * Math.PI * 2,
  });
}

function updateDrawTurbulence(ctx, pool) {
  if (pool.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.x    += p.vx; p.y += p.vy;
    p.vx   *= 0.92; p.vy *= 0.92;
    p.r     = Math.min(p.r + 0.55, p.maxR); // expand
    p.life -= p.decay;
    p.angle += p.spin;
    if (p.life <= 0) { pool.splice(i, 1); continue; }

    const alpha = p.life * 0.14;
    // Swirling ellipse — rotate to give sense of vortex
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
    g.addColorStop(0,   `rgba(120,195,240,${alpha * 0.9})`);
    g.addColorStop(0.45,`rgba(80,160,215,${alpha * 0.5})`);
    g.addColorStop(1,   'rgba(40,110,180,0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * 1.35, p.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── Shark ─────────────────────────────────────────────────────────────
function genShark(W, H) {
  const dir = Math.random() < 0.5 ? 0 : Math.PI;
  return {
    x:     dir === 0 ? -120 : W + 120,
    y:     H * (0.22 + Math.random() * 0.38),
    vx:    0, vy: 0,
    dir,  targetDir: dir,
    speed: 0.42 + Math.random() * 0.18,
    phase: Math.random() * Math.PI * 2,
    size:  72 + Math.random() * 22,
    active: false,   // starts off-screen
    timer: 900 + Math.floor(Math.random() * 1800), // first appearance ~15-45s
    cooldown: 0,
    _bankAngle: 0,
    // Tail: verlet chain
    tail: Array.from({ length: 10 }, () => ({ x: W * 0.5, y: H * 0.3, px: W * 0.5, py: H * 0.3 })),
  };
}

function updateShark(shark, W, H, fish, stingrays, inkClouds) {
  const minY = H * 0.14, maxY = H * 0.70;

  if (!shark.active) {
    shark.timer = Math.max(0, shark.timer - 1);
    if (shark.timer === 0) {
      // Spawn — enter from a random side
      shark.dir       = Math.random() < 0.5 ? 0 : Math.PI;
      shark.x         = shark.dir === 0 ? -130 : W + 130;
      shark.y         = H * (0.18 + Math.random() * 0.46);
      shark.targetDir = shark.dir;
      shark.vx        = 0; shark.vy = 0;
      shark.active    = true;
      shark.tail.forEach(n => { n.x = shark.x; n.y = shark.y; n.px = shark.x; n.py = shark.y; });
    }
    return;
  }

  // Deactivate if far off-screen
  if (shark.x < -160 || shark.x > W + 160) {
    shark.active = false;
    shark.timer  = 3000 + Math.floor(Math.random() * 2400); // 50–90s gap
    return;
  }

  const prevDir = shark.dir;
  const m = 140;
  if      (shark.y < minY + m) shark.targetDir = Math.PI * 0.5 + (Math.random() - 0.5) * 0.3;
  else if (shark.y > maxY - m) shark.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.3;
  else if (Math.random() < 0.002) shark.targetDir += (Math.random() - 0.5) * 0.5;

  let diff = shark.targetDir - shark.dir;
  while (diff >  Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  shark.dir += diff * 0.010;

  let turnRate = shark.dir - prevDir;
  while (turnRate >  Math.PI) turnRate -= Math.PI * 2;
  while (turnRate < -Math.PI) turnRate += Math.PI * 2;
  shark._bankAngle = (shark._bankAngle || 0) * 0.94 + turnRate * 10;
  shark._bankAngle = Math.max(-0.30, Math.min(0.30, shark._bankAngle));

  shark.vx = shark.vx * 0.92 + Math.cos(shark.dir) * shark.speed * 0.08;
  shark.vy = shark.vy * 0.92 + Math.sin(shark.dir) * shark.speed * 0.08;
  shark.x += shark.vx; shark.y += shark.vy;
  shark.y = Math.max(minY, Math.min(maxY, shark.y));

  // Cause ALL nearby fish and stingrays to scatter explosively
  const PANIC_RADIUS = 320;
  [...fish, ...stingrays].forEach(f => {
    if (f.type === 'user') return;
    const dx = f.x - shark.x, dy = f.y - shark.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < PANIC_RADIUS) {
      const threat = (1 - d / PANIC_RADIUS);
      f.vx += (dx / Math.max(d, 1)) * threat * 2.2;
      f.vy += (dy / Math.max(d, 1)) * threat * 2.2;
      f._panic = Math.max(f._panic || 0, Math.floor(threat * 55));
      if (d < 130) scatterSchool(fish, shark.x, shark.y, 200);
    }
  });

  // Tail verlet
  shark.tail[0].x = shark.x - Math.cos(shark.dir) * shark.size * 0.65;
  shark.tail[0].y = shark.y - Math.sin(shark.dir) * shark.size * 0.65;
  const TAIL_SEG = shark.size * 0.14;
  for (let n = 1; n < shark.tail.length; n++) {
    const nd = shark.tail[n];
    const vx = (nd.x - nd.px) * 0.78, vy = (nd.y - nd.py) * 0.78;
    nd.px = nd.x; nd.py = nd.y;
    nd.x += vx; nd.y += vy + 0.008;
  }
  for (let p = 0; p < 2; p++) {
    for (let n = 1; n < shark.tail.length; n++) {
      const a = shark.tail[n - 1], b = shark.tail[n];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const c = (d - TAIL_SEG) / d * 0.5;
      b.x -= dx * c; b.y -= dy * c;
    }
  }
}

function drawShark(ctx, shark, frame) {
  if (!shark.active) return;
  const { x, y, dir, size, phase, tail, _bankAngle: bank } = shark;

  // Fade in/out at scene edges
  const edgeDist = Math.min(x, ctx.canvas.width - x, 80);
  const fadeAlpha = Math.min(1, Math.max(0, edgeDist / 80));
  if (fadeAlpha < 0.01) return;

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(x, y);
  ctx.rotate(dir);

  // Counter-shading gradient: dark blue-grey dorsal, lighter ventral
  const bodyLen = size, bodyH = size * 0.22;
  const bg = ctx.createLinearGradient(0, -bodyH, 0, bodyH);
  bg.addColorStop(0,    'rgba(30,45,65,0.95)');
  bg.addColorStop(0.4,  'rgba(52,72,95,0.92)');
  bg.addColorStop(0.75, 'rgba(90,115,140,0.90)');
  bg.addColorStop(1,    'rgba(160,180,195,0.85)');

  // Main body — tapering from snout to tail
  ctx.beginPath();
  ctx.moveTo(bodyLen * 0.52, 0);
  ctx.bezierCurveTo(bodyLen * 0.38, -bodyH, -bodyLen * 0.22, -bodyH * 0.92, -bodyLen * 0.42, 0);
  ctx.bezierCurveTo(-bodyLen * 0.22, bodyH * 0.92, bodyLen * 0.38, bodyH, bodyLen * 0.52, 0);
  ctx.fillStyle = bg; ctx.fill();

  // Dorsal fin — iconic triangular shape
  ctx.beginPath();
  ctx.moveTo(bodyLen * 0.04, -bodyH * 0.92);
  ctx.bezierCurveTo(bodyLen * 0.10, -bodyH * 1.85, bodyLen * 0.24, -bodyH * 2.05, bodyLen * 0.28, -bodyH * 1.0);
  ctx.bezierCurveTo(bodyLen * 0.18, -bodyH * 0.95, bodyLen * 0.08, -bodyH * 0.88, bodyLen * 0.04, -bodyH * 0.92);
  ctx.fillStyle = 'rgba(28,42,60,0.92)'; ctx.fill();

  // Pectoral fins (large, swept back)
  [-1, 1].forEach(side => {
    ctx.save();
    ctx.scale(1, side);
    ctx.beginPath();
    ctx.moveTo(bodyLen * 0.18, bodyH * 0.82);
    ctx.bezierCurveTo(bodyLen * 0.05, bodyH * 1.55, -bodyLen * 0.18, bodyH * 1.75, -bodyLen * 0.22, bodyH * 1.35);
    ctx.bezierCurveTo(-bodyLen * 0.08, bodyH * 1.10, bodyLen * 0.10, bodyH * 0.90, bodyLen * 0.18, bodyH * 0.82);
    ctx.fillStyle = 'rgba(35,50,70,0.85)'; ctx.fill();
    ctx.restore();
  });

  // Tail caudal fin (asymmetric — upper lobe larger)
  const tailSweep = Math.sin(frame * 0.06 + phase) * 0.22;
  ctx.save();
  ctx.translate(-bodyLen * 0.42, 0);
  ctx.rotate(tailSweep);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-bodyLen * 0.08, -bodyH * 0.75, -bodyLen * 0.22, -bodyH * 1.05, -bodyLen * 0.28, -bodyH * 0.85);
  ctx.bezierCurveTo(-bodyLen * 0.14, -bodyH * 0.45, -bodyLen * 0.04, -bodyH * 0.15, 0, 0);
  ctx.fillStyle = 'rgba(28,42,60,0.88)'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-bodyLen * 0.06, bodyH * 0.55, -bodyLen * 0.16, bodyH * 0.72, -bodyLen * 0.20, bodyH * 0.55);
  ctx.bezierCurveTo(-bodyLen * 0.10, bodyH * 0.35, -bodyLen * 0.03, bodyH * 0.12, 0, 0);
  ctx.fillStyle = 'rgba(32,48,66,0.85)'; ctx.fill();
  ctx.restore();

  // Gill slits (3)
  ctx.strokeStyle = 'rgba(22,35,52,0.55)'; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
  for (let g = 0; g < 3; g++) {
    const gx = bodyLen * (0.24 - g * 0.06);
    ctx.beginPath(); ctx.moveTo(gx, -bodyH * 0.45); ctx.lineTo(gx, bodyH * 0.45); ctx.stroke();
  }

  // Eye
  ctx.beginPath(); ctx.arc(bodyLen * 0.32, -bodyH * 0.18, bodyH * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#080C14'; ctx.fill();
  ctx.beginPath(); ctx.arc(bodyLen * 0.34, -bodyH * 0.24, bodyH * 0.065, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();

  // Specular sheen on dorsal surface
  const spec = ctx.createLinearGradient(0, -bodyH, 0, 0);
  spec.addColorStop(0, 'rgba(100,140,180,0.18)');
  spec.addColorStop(1, 'rgba(100,140,180,0)');
  ctx.beginPath();
  ctx.moveTo(bodyLen * 0.52, 0);
  ctx.bezierCurveTo(bodyLen * 0.38, -bodyH, -bodyLen * 0.22, -bodyH * 0.92, -bodyLen * 0.42, 0);
  ctx.fillStyle = spec; ctx.fill();

  ctx.restore();
}

// ── Manta ray ────────────────────────────────────────────────────────
function genManta(W, H) {
  const dir = Math.random() * Math.PI * 2;
  // Tail: 12-node verlet chain trailing the body
  const tx = W * 0.5, ty = H * 0.22;
  return {
    x: tx, y: ty,
    vx: Math.cos(dir) * 0.45, vy: Math.sin(dir) * 0.45,
    dir, targetDir: dir,
    speed: 0.40 + Math.random() * 0.18,
    phase: Math.random() * Math.PI * 2,
    size:  62 + Math.random() * 22, // wingspan half-width
    tail:  Array.from({ length: 14 }, () => ({ x: tx, y: ty, px: tx, py: ty })),
    _bankAngle: 0,
  };
}

function updateManta(manta, W, H) {
  const minY = H * 0.08, maxY = H * 0.48;
  const m = 120;
  const prevDir = manta.dir;

  if      (manta.x < m)       manta.targetDir = (Math.random() - 0.5) * 0.3;
  else if (manta.x > W - m)   manta.targetDir = Math.PI + (Math.random() - 0.5) * 0.3;
  else if (manta.y < minY + m) manta.targetDir = Math.PI * 0.5 + (Math.random() - 0.5) * 0.3;
  else if (manta.y > maxY - m) manta.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.3;
  else if (Math.random() < 0.003) manta.targetDir += (Math.random() - 0.5) * 0.6;

  let diff = manta.targetDir - manta.dir;
  while (diff >  Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  manta.dir += diff * 0.012;

  // Banking
  let turnRate = manta.dir - prevDir;
  while (turnRate >  Math.PI) turnRate -= Math.PI * 2;
  while (turnRate < -Math.PI) turnRate += Math.PI * 2;
  manta._bankAngle = manta._bankAngle * 0.92 + turnRate * 14;
  manta._bankAngle = Math.max(-0.45, Math.min(0.45, manta._bankAngle));

  manta.vx = manta.vx * 0.92 + Math.cos(manta.dir) * manta.speed * 0.08;
  manta.vy = manta.vy * 0.92 + Math.sin(manta.dir) * manta.speed * 0.08;
  manta.x += manta.vx; manta.y += manta.vy;
  manta.x = Math.max(60, Math.min(W - 60, manta.x));
  manta.y = Math.max(minY, Math.min(maxY, manta.y));

  // Verlet tail
  manta.tail[0].x = manta.x - Math.cos(manta.dir) * 18;
  manta.tail[0].y = manta.y - Math.sin(manta.dir) * 18;
  const TAIL_SEG = 9;
  for (let n = 1; n < manta.tail.length; n++) {
    const nd = manta.tail[n];
    const vx = (nd.x - nd.px) * 0.80;
    const vy = (nd.y - nd.py) * 0.80;
    nd.px = nd.x; nd.py = nd.y;
    nd.x += vx; nd.y += vy + 0.012;
  }
  for (let p = 0; p < 2; p++) {
    for (let n = 1; n < manta.tail.length; n++) {
      const a = manta.tail[n - 1], b = manta.tail[n];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const corr = (d - TAIL_SEG) / d * 0.5;
      b.x -= dx * corr; b.y -= dy * corr;
    }
  }
}

function drawManta(ctx, manta, frame) {
  const { x, y, dir, size, phase, tail, _bankAngle } = manta;
  const flap = Math.sin(frame * 0.038 + phase) * size * 0.28; // wing elevation
  const bank = _bankAngle;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);

  // Subtle shadow/glow beneath manta
  const shadow = ctx.createRadialGradient(0, size * 0.4, 0, 0, size * 0.4, size * 1.4);
  shadow.addColorStop(0, 'rgba(0,20,50,0.22)');
  shadow.addColorStop(1, 'rgba(0,20,50,0)');
  ctx.beginPath(); ctx.ellipse(0, size * 0.4, size * 1.1, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadow; ctx.fill();

  // ── Wings (two symmetric bezier paths) ──────────────────────────
  const bankScaleL = 1 - bank * 0.55, bankScaleR = 1 + bank * 0.55;
  const flapL = flap * bankScaleL, flapR = flap * bankScaleR;

  // Left wing
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size * 0.35, -flapL * 0.4, -size * 0.75, -flapL * 0.8, -size, flapL * 0.15);
  ctx.bezierCurveTo(-size * 0.6,  flapL * 0.9,  -size * 0.25, flapL * 0.45, 0, size * 0.18);
  const wg = ctx.createLinearGradient(-size, 0, 0, 0);
  wg.addColorStop(0,   'rgba(12,18,28,0.82)');
  wg.addColorStop(0.6, 'rgba(22,32,48,0.88)');
  wg.addColorStop(1,   'rgba(35,50,70,0.9)');
  ctx.fillStyle = wg; ctx.fill();
  // Wing underside highlight
  ctx.beginPath();
  ctx.moveTo(-size * 0.05, 0);
  ctx.bezierCurveTo(-size * 0.3, flapL * 0.25, -size * 0.55, flapL * 0.7, -size * 0.82, flapL * 0.22);
  ctx.bezierCurveTo(-size * 0.5, flapL * 0.85, -size * 0.2, flapL * 0.45, 0, size * 0.12);
  ctx.fillStyle = 'rgba(38,65,100,0.35)'; ctx.fill();

  // Right wing (mirror)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.35, -flapR * 0.4,  size * 0.75, -flapR * 0.8, size, flapR * 0.15);
  ctx.bezierCurveTo(size * 0.6,   flapR * 0.9,   size * 0.25, flapR * 0.45, 0, size * 0.18);
  ctx.fillStyle = wg; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.05, 0);
  ctx.bezierCurveTo(size * 0.3, flapR * 0.25, size * 0.55, flapR * 0.7, size * 0.82, flapR * 0.22);
  ctx.bezierCurveTo(size * 0.5, flapR * 0.85, size * 0.2, flapR * 0.45, 0, size * 0.12);
  ctx.fillStyle = 'rgba(38,65,100,0.35)'; ctx.fill();

  // ── Central body disc ────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(0, size * 0.06, size * 0.18, size * 0.14, 0, 0, Math.PI * 2);
  const bodyG = ctx.createRadialGradient(-size * 0.04, -size * 0.02, 0, 0, size * 0.06, size * 0.2);
  bodyG.addColorStop(0,  'rgba(45,65,90,0.95)');
  bodyG.addColorStop(0.6,'rgba(22,35,55,0.95)');
  bodyG.addColorStop(1,  'rgba(10,18,30,0.9)');
  ctx.fillStyle = bodyG; ctx.fill();

  // Cephalic fins (two horns projecting forward)
  [-1, 1].forEach(side => {
    ctx.beginPath();
    ctx.moveTo(side * size * 0.06, -size * 0.02);
    ctx.bezierCurveTo(side * size * 0.14, -size * 0.18, side * size * 0.10, -size * 0.30, side * size * 0.08, -size * 0.32);
    ctx.strokeStyle = 'rgba(22,35,55,0.9)'; ctx.lineWidth = size * 0.045; ctx.lineCap = 'round'; ctx.stroke();
  });

  // Eye
  ctx.beginPath(); ctx.arc(-size * 0.07, size * 0.04, size * 0.028, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5,8,15,0.95)'; ctx.fill();
  ctx.beginPath(); ctx.arc(-size * 0.062, size * 0.032, size * 0.01, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();

  // Dorsal specular
  const spec = ctx.createRadialGradient(-size * 0.05, -size * 0.04, 0, 0, 0, size * 0.22);
  spec.addColorStop(0,   `rgba(70,110,160,${0.30 + Math.abs(Math.sin(frame * 0.038 + phase)) * 0.12})`);
  spec.addColorStop(1,   'rgba(70,110,160,0)');
  ctx.beginPath(); ctx.ellipse(0, size * 0.06, size * 0.18, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = spec; ctx.fill();

  ctx.restore();

  // ── Whip tail ────────────────────────────────────────────────────
  if (tail.length > 1) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tail[0].x, tail[0].y);
    for (let n = 1; n < tail.length; n++) ctx.lineTo(tail[n].x, tail[n].y);
    const t = tail[tail.length - 1];
    const tailAlpha = 0.55;
    ctx.strokeStyle = `rgba(14,22,38,${tailAlpha})`;
    ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    // Thin bright edge
    ctx.strokeStyle = 'rgba(50,80,120,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

// ── Octopus ──────────────────────────────────────────────────────────
const OCT_SEGS = 7; // nodes per tentacle

function genOctopuses(W, H) {
  return Array.from({ length: 2 }, (_, i) => {
    const ox = W * (0.25 + i * 0.5) + (Math.random() - 0.5) * 80;
    const oy = H * (0.72 + Math.random() * 0.06);
    // 8 tentacles, each a verlet chain hanging from body base
    const tentacles = Array.from({ length: 8 }, (_, t) => ({
      angle: (t / 8) * Math.PI * 2,
      nodes: Array.from({ length: OCT_SEGS }, (__, n) => ({
        x:  ox + Math.cos((t / 8) * Math.PI * 2) * (n * 5),
        y:  oy + Math.sin((t / 8) * Math.PI * 2) * (n * 5),
        px: ox, py: oy,
      })),
    }));
    return {
      x: ox, y: oy,
      vx: 0, vy: 0,
      targetX: ox, targetY: oy,
      hue: 20 + Math.random() * 30,     // warm orange-red base
      camouHue: 20 + Math.random() * 30, // current displayed hue (shifts slowly)
      size: 14 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      tentacles,
      _jetting: 0,     // frames of jet boost remaining
      _jetCooldown: 0,
      _wanderTimer: 0,
    };
  });
}

function updateOctopuses(octs, W, H, frame, fish, inkClouds) {
  const floorY = H * 0.79, topY = H * 0.50;
  const SEG_LEN = 8;

  octs.forEach(o => {
    // ── Camouflage — hue drifts toward target, occasionally shifts ──
    if (Math.random() < 0.004) o.hue = 10 + Math.random() * 60;
    o.camouHue += (o.hue - o.camouHue) * 0.012;

    // ── Wander / flee ──────────────────────────────────────────────
    o._jetCooldown = Math.max(0, o._jetCooldown - 1);
    o._wanderTimer = Math.max(0, o._wanderTimer - 1);

    if (o._jetting > 0) {
      o._jetting--;
    } else {
      // Check if any fish is very close — triggers jet escape
      let threat = null;
      fish.forEach(f => {
        if (f.type === 'user') return;
        const dx = f.x - o.x, dy = f.y - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < 70 && o._jetCooldown === 0) threat = f;
      });

      if (threat && o._jetCooldown === 0) {
        // Jet away from threat
        const dx = o.x - threat.x, dy = o.y - threat.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        o.vx += (dx / d) * 5.5;
        o.vy += (dy / d) * 5.5 - 1.2; // upward burst
        o._jetting = 22;
        o._jetCooldown = 280;
        spawnInkBurst(inkClouds, o.x, o.y);
      } else if (o._wanderTimer === 0) {
        // Pick a new target near the floor
        o.targetX = W * 0.1 + Math.random() * W * 0.8;
        o.targetY = H * 0.70 + Math.random() * H * 0.08;
        o._wanderTimer = 180 + Math.floor(Math.random() * 200);
      }
    }

    // Steer toward target when not jetting
    if (o._jetting === 0) {
      const dx = o.targetX - o.x, dy = o.targetY - o.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > 12) { o.vx += (dx / d) * 0.06; o.vy += (dy / d) * 0.06; }
    }

    o.vx *= 0.88; o.vy *= 0.88;
    o.x += o.vx; o.y += o.vy;
    o.x = Math.max(30, Math.min(W - 30, o.x));
    o.y = Math.max(topY, Math.min(floorY, o.y));

    // ── Tentacle verlet ────────────────────────────────────────────
    o.tentacles.forEach((tent, ti) => {
      const baseAngle = (ti / 8) * Math.PI * 2;
      // Anchor node 0 to body perimeter
      tent.nodes[0].x = o.x + Math.cos(baseAngle) * o.size * 0.55;
      tent.nodes[0].y = o.y + Math.sin(baseAngle) * o.size * 0.55;

      for (let n = 1; n < tent.nodes.length; n++) {
        const nd = tent.nodes[n];
        const vx = (nd.x - nd.px) * 0.78;
        const vy = (nd.y - nd.py) * 0.78;
        nd.px = nd.x; nd.py = nd.y;
        nd.x += vx + Math.sin(frame * 0.04 + ti * 0.9 + n * 0.5) * 0.25;
        nd.y += vy + 0.08;
      }
      // Constrain segment lengths (2 passes)
      for (let p = 0; p < 2; p++) {
        for (let n = 1; n < tent.nodes.length; n++) {
          const a = tent.nodes[n - 1], b = tent.nodes[n];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const corr = (dist - SEG_LEN) / dist * 0.5;
          b.x -= dx * corr; b.y -= dy * corr;
        }
      }
    });
  });
}

function drawOctopus(ctx, o, frame) {
  const { x, y, size, camouHue, phase, tentacles, _jetting } = o;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.055 + phase);
  const mW = size * (1.0 + pulse * 0.12);
  const mH = size * (0.72 - pulse * 0.08);

  // Jet propulsion visual — squash mantle
  const jetSquash = _jetting > 0 ? Math.max(0, _jetting / 22) : 0;

  ctx.save();
  ctx.translate(x, y);

  // Mantle glow aura
  const aura = ctx.createRadialGradient(0, 0, mW * 0.2, 0, 0, mW * 2.2);
  aura.addColorStop(0,   `hsla(${camouHue},65%,40%,0.14)`);
  aura.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(0, 0, mW * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = aura; ctx.fill();

  // 8 tentacles
  tentacles.forEach((tent, ti) => {
    if (tent.nodes.length < 2) return;
    const w0 = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(tent.nodes[0].x - x, tent.nodes[0].y - y);
    for (let n = 1; n < tent.nodes.length; n++) {
      ctx.lineTo(tent.nodes[n].x - x, tent.nodes[n].y - y);
    }
    const t = ti / 8;
    ctx.strokeStyle = `hsla(${camouHue + t * 20},55%,30%,0.75)`;
    ctx.lineWidth = w0 * (1 - ti / tent.nodes.length * 0.5);
    ctx.lineCap  = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();

    // Sucker dots along tentacle
    for (let n = 1; n < tent.nodes.length - 1; n += 2) {
      ctx.beginPath();
      ctx.arc(tent.nodes[n].x - x, tent.nodes[n].y - y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${camouHue},40%,65%,0.5)`; ctx.fill();
    }
  });

  // Mantle body
  const mg = ctx.createRadialGradient(-mW * 0.22, -mH * 0.32, 0, 0, 0, mW * 1.1);
  mg.addColorStop(0,   `hsla(${camouHue + 15},70%,58%,0.92)`);
  mg.addColorStop(0.5, `hsla(${camouHue},60%,40%,0.85)`);
  mg.addColorStop(1,   `hsla(${camouHue - 10},50%,22%,0.7)`);
  ctx.beginPath();
  ctx.ellipse(0, -mH * 0.1, mW * (1 - jetSquash * 0.4), mH * (1 + jetSquash * 0.6), 0, 0, Math.PI * 2);
  ctx.fillStyle = mg;
  ctx.shadowColor = `hsla(${camouHue},70%,45%,0.5)`; ctx.shadowBlur = 8;
  ctx.fill(); ctx.shadowBlur = 0;

  // Specular highlight
  const spec = ctx.createRadialGradient(-mW * 0.28, -mH * 0.55, 0, -mW * 0.1, -mH * 0.3, mW * 0.6);
  spec.addColorStop(0,   `rgba(255,255,255,${0.35 + pulse * 0.15})`);
  spec.addColorStop(0.4, `rgba(255,255,255,0.08)`);
  spec.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.ellipse(0, -mH * 0.1, mW, mH, 0, 0, Math.PI * 2);
  ctx.fillStyle = spec; ctx.fill();

  // Eyes (two)
  [-1, 1].forEach(side => {
    const ex = side * mW * 0.38, ey = -mH * 0.18;
    ctx.beginPath(); ctx.arc(ex, ey, mW * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#05080F'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + mW * 0.04, ey - mW * 0.04, mW * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    // Iris ring
    ctx.beginPath(); ctx.arc(ex, ey, mW * 0.15, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${camouHue + 30},60%,55%,0.5)`; ctx.lineWidth = 0.8; ctx.stroke();
  });

  ctx.restore();
}

// ── Coral spawning ───────────────────────────────────────────────────
// Real coral spawning: colonies simultaneously release egg-sperm bundles
// that rise in clouds to the surface. Happens every 60-120 seconds.
function genCoralSpawnState() {
  return {
    particles: [],
    cooldown: 800 + Math.floor(Math.random() * 1200), // first event
  };
}

function updateCoralSpawn(state, coral, W, H, frame) {
  state.cooldown = Math.max(0, state.cooldown - 1);

  // Trigger a spawning burst
  if (state.cooldown === 0) {
    // Pick 1-3 corals to spawn simultaneously (mimics mass spawning)
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...coral].sort(() => Math.random() - 0.5).slice(0, count);
    shuffled.forEach(c => {
      const bundles = 35 + Math.floor(Math.random() * 25);
      for (let i = 0; i < bundles; i++) {
        state.particles.push({
          x:     c.x + (Math.random() - 0.5) * c.h * 0.6,
          y:     c.y - c.h * (0.5 + Math.random() * 0.5),
          vx:    (Math.random() - 0.5) * 0.28,
          vy:    -(0.18 + Math.random() * 0.22),
          r:     1.2 + Math.random() * 1.5,
          life:  1.0,
          decay: 0.0018 + Math.random() * 0.0012,
          hue:   330 + Math.random() * 40, // pink-coral range
          phase: Math.random() * Math.PI * 2,
        });
      }
    });
    state.cooldown = 3600 + Math.floor(Math.random() * 2400); // 60-100s until next
  }

  // Update existing particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x   += p.vx + Math.sin(frame * 0.028 + p.phase) * 0.18;
    p.y   += p.vy;
    p.vy  *= 0.996; // slight drag
    p.life -= p.decay;
    if (p.life <= 0 || p.y < 0) { state.particles.splice(i, 1); }
  }
}

function drawCoralSpawn(ctx, state, frame, daylight) {
  if (state.particles.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const nightBoost = 0.7 + (1 - daylight) * 1.2;

  state.particles.forEach(p => {
    const pulse = 0.6 + 0.4 * Math.sin(frame * 0.12 + p.phase);
    const alpha = p.life * 0.62 * pulse * nightBoost;
    const r     = p.r * (0.85 + pulse * 0.15);

    // Soft glow halo
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
    grd.addColorStop(0,   `hsla(${p.hue},85%,75%,${alpha * 0.55})`);
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();

    // Bright bead center
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},90%,82%,${alpha})`;
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function genBubbleChains(coral, rocks) {
  // Emission points on coral tips and rock tops — each emits a trickle of small bubbles
  const points = [];
  coral.forEach(c => {
    if (Math.random() < 0.65) {
      points.push({
        x:        c.x + (Math.random() - 0.5) * 10,
        y:        c.y - c.h * 0.88,
        timer:    Math.floor(Math.random() * 100),
        interval: 38 + Math.floor(Math.random() * 75),
        bubbles:  [],
      });
    }
  });
  rocks.forEach(r => {
    if (Math.random() < 0.45) {
      points.push({
        x:        r.x + (Math.random() - 0.5) * r.rx * 0.55,
        y:        r.y - r.ry * 0.85,
        timer:    Math.floor(Math.random() * 80),
        interval: 90 + Math.floor(Math.random() * 110),
        bubbles:  [],
      });
    }
  });
  return points;
}

function updateDrawBubbleChains(ctx, chains, frame) {
  chains.forEach(chain => {
    // Spawn
    chain.timer++;
    if (chain.timer >= chain.interval) {
      chain.timer = 0;
      chain.bubbles.push({
        x:     chain.x + (Math.random() - 0.5) * 2.5,
        y:     chain.y,
        r:     0.7 + Math.random() * 1.9,
        phase: Math.random() * Math.PI * 2,
        speed: 0.32 + Math.random() * 0.42,
        life:  1.0,
      });
    }
    // Update & draw
    for (let i = chain.bubbles.length - 1; i >= 0; i--) {
      const b = chain.bubbles[i];
      b.y -= b.speed;
      b.x += Math.sin(frame * 0.042 + b.phase) * 0.28;
      b.life -= 0.0045;
      if (b.y < 0 || b.life <= 0) { chain.bubbles.splice(i, 1); continue; }

      const alpha = b.life * 0.55;
      // Bubble ring
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140,205,255,${alpha * 0.7})`; ctx.lineWidth = 0.45; ctx.stroke();
      // Specular glint
      ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.32, b.r * 0.30, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,242,255,${alpha * 0.55})`; ctx.fill();
    }
  });
}

function genDustParticles(W, H) {
  // Sediment motes that become visible only inside light shafts — volumetric god rays
  return Array.from({ length: 90 }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H * 0.82,
    size:  0.4 + Math.random() * 1.3,
    vx:    (Math.random() - 0.5) * 0.035,
    vy:    -(0.032 + Math.random() * 0.055),   // slow upward drift
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawDustInRays(ctx, dust, rays, W, H, frame, mouse) {
  const px = (mouse.x / W - 0.5) * 12;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  dust.forEach(p => {
    // Physics — gentle drift with oscillation
    p.x += p.vx + Math.sin(frame * 0.009 + p.phase) * 0.07;
    p.y += p.vy;
    if (p.y < -6)      p.y = H * 0.82;
    if (p.x <  0)      p.x = W;
    if (p.x >  W)      p.x = 0;

    // Check illumination from every ray — rays widen toward the bottom (diverging shafts)
    let maxIllum = 0;
    rays.forEach(ray => {
      const rayX  = ray.x + px * 1.5;
      const half  = ray.width * 0.5 * (0.35 + (p.y / H) * 0.75);
      const dist  = Math.abs(p.x - rayX);
      if (dist < half) maxIllum = Math.max(maxIllum, 1 - dist / half);
    });

    if (maxIllum > 0.03) {
      const pulse = Math.sin(frame * 0.038 + p.phase) * 0.5 + 0.5;
      const alpha = maxIllum * maxIllum * (0.30 + pulse * 0.18);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.7 + pulse * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,235,255,${alpha})`;
      ctx.fill();
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function genSurfaceMesh(W) {
  // Grid of points for the animated water surface caustic mesh at top of screen
  const cols = Math.ceil(W / 38) + 1;
  return Array.from({ length: cols }, (_, i) => ({
    x:     i * 38,
    phase: Math.random() * Math.PI * 2,
    speed: 0.018 + Math.random() * 0.012,
    amp:   2.5 + Math.random() * 3.5,
  }));
}

function genClickParticles() { return []; }
function genBioEvents()     { return []; }

// ── Entity physics init ────────────────────────────────────────────
function initEntities(entities, W, H) {
  const fish      = [];
  const jellies   = [];
  const stingrays = [];
  const seahorses = [];
  const crabs     = [];
  const turtles   = [];

  entities.forEach(e => {
    const imp = e.importance ?? 0.5;

    const depth = e.type === 'user' ? 1.0 : 0.42 + Math.random() * 0.58; // depth: 0=back, 1=front

    if (e.type === 'jellyfish') {
      const jx   = W * 0.12 + Math.random() * W * 0.76;
      const jy   = H * 0.08 + Math.random() * H * 0.52;
      const jSz  = (13 + imp * 20) * (0.62 + depth * 0.38);
      // Build 8 verlet tentacles, each 6 nodes long, hanging from bell underside
      const TCOUNT = 8, NODES = 6, SEG = jSz * 0.55;
      const tentacles = Array.from({ length: TCOUNT }, (_, t) => {
        const ox = ((t / (TCOUNT - 1)) - 0.5) * jSz * 1.6;
        return Array.from({ length: NODES }, (_, n) => ({
          x: jx + ox, y: jy + n * SEG,
          px: jx + ox, py: jy + n * SEG, // previous position for verlet
        }));
      });
      jellies.push({
        ...e, depth,
        x: jx, y: jy,
        vy:    -(0.048 + Math.random() * 0.044),
        phase: Math.random() * Math.PI * 2,
        size:  jSz,
        tentacles,
        _segLen: SEG,
      });
    } else if (e.type === 'stingray') {
      const speed = 0.62 + Math.random() * 0.32;
      const dir   = Math.random() * Math.PI * 2;
      stingrays.push({
        ...e, depth,
        x:         W * 0.1 + Math.random() * W * 0.8,
        y:         H * 0.35 + Math.random() * H * 0.37,
        vx:        Math.cos(dir) * speed,
        vy:        Math.sin(dir) * speed,
        dir,
        targetDir: dir,
        speed,
        phase:     Math.random() * Math.PI * 2,
        size:      (16 + imp * 18) * (0.62 + depth * 0.38),
        trail:     [],  // recent position history for motion trail
      });
    } else if (e.type === 'seahorse') {
      seahorses.push({
        ...e, depth,
        x:     W * 0.1 + Math.random() * W * 0.8,
        y:     H * 0.2 + Math.random() * H * 0.5,
        vx:    (Math.random() - 0.5) * 0.17,
        phase: Math.random() * Math.PI * 2,
        size:  (10 + imp * 12) * (0.62 + depth * 0.38),
      });
    } else if (e.type === 'crab') {
      crabs.push({
        ...e, depth,
        x:        W * 0.05 + Math.random() * W * 0.9,
        y:        H * 0.78,
        vx:       (Math.random() > 0.5 ? 1 : -1) * (0.13 + Math.random() * 0.18),
        phase:    Math.random() * Math.PI * 2,
        pauseFor: 0,
        size:     (10 + imp * 10) * (0.62 + depth * 0.38),
      });
    } else if (e.type === 'turtle') {
      const speed = 0.08 + Math.random() * 0.08;
      const dir   = Math.random() * Math.PI * 2;
      turtles.push({
        ...e, depth,
        x:         W * 0.1 + Math.random() * W * 0.8,
        y:         H * 0.12 + Math.random() * H * 0.62,
        vx:        Math.cos(dir) * speed,
        vy:        Math.sin(dir) * speed,
        dir,
        targetDir: dir,
        speed,
        phase:     Math.random() * Math.PI * 2,
        size:      (18 + imp * 16) * (0.62 + depth * 0.38),
      });
    } else {
      // fish, habit-fish, data-fish, code-fish, event-fish, tropical-fish, user
      const baseSpeed = e.type === 'event-fish' ? 0.52 : e.type === 'user' ? 0.19 : 0.26;
      const speed = baseSpeed + Math.random() * 0.16;
      const dir   = Math.random() * Math.PI * 2;
      fish.push({
        ...e, depth,
        x:          W * 0.12 + Math.random() * W * 0.76,
        y:          H * 0.1  + Math.random() * H * 0.64,
        vx:         Math.cos(dir) * speed,
        vy:         Math.sin(dir) * speed,
        dir,
        targetDir:  dir,
        speed,
        wiggle:     Math.random() * Math.PI * 2,
        wiggleSpd:  0.055 + Math.random() * 0.048,
        size:       e.type === 'user' ? 24 : (9 + imp * 16) * (0.62 + depth * 0.38),
      });
    }
  });

  return { fish, jellies, stingrays, seahorses, crabs, turtles };
}

// ── Physics updates ────────────────────────────────────────────────
// Boid neighbor radii
const BOID_SEP  = 28;  // separation: repel within this radius
const BOID_ALI  = 80;  // alignment: match velocity within this radius
const BOID_COH  = 160; // cohesion: attract toward neighbors within this radius

function updateFish(fish, W, H, mouse, predators = []) {
  const floorY = H * 0.79;

  // Pre-build per-type fish lists for efficient neighbor lookup
  const byType = {};
  fish.forEach(f => {
    if (f.type === 'user') return;
    if (!byType[f.type]) byType[f.type] = [];
    byType[f.type].push(f);
  });

  fish.forEach(f => {
    const m = f.type === 'event-fish' ? 60 : 80;
    if      (f.x < m)               f.targetDir = (Math.random() - 0.5) * 0.6;
    else if (f.x > W - m)           f.targetDir = Math.PI + (Math.random() - 0.5) * 0.6;
    else if (f.y < m)               f.targetDir = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    else if (f.y > floorY - m)      f.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    else if (Math.random() < 0.006)  f.targetDir += (Math.random() - 0.5) * 1.1;

    // User entity: gravitate gently toward screen center so it stays visible
    if (f.type === 'user') {
      const homeX = W * 0.5, homeY = H * 0.40;
      const hx = homeX - f.x, hy = homeY - f.y;
      const hd = Math.sqrt(hx * hx + hy * hy);
      if (hd > 35) {
        f.targetDir = Math.atan2(hy, hx);
        f.speed = 0.10 + Math.min(hd / W, 0.18) * 0.14;
      } else {
        f.targetDir += (Math.random() - 0.5) * 0.18;
        f.speed = 0.07;
      }
    }

    // Scatter state — suppresses schooling while fish are fleeing explosion
    if (f._scatter > 0) { f._scatter--; }

    // ── Full 3-rule boid schooling (local neighbor based) ──────────────
    if (f.type !== 'user' && !f._scatter) {
      const sameType = byType[f.type] || [];
      let sepX = 0, sepY = 0, sepN = 0;
      let aliVX = 0, aliVY = 0, aliN = 0;
      let cohX = 0, cohY = 0, cohN = 0;

      for (let j = 0; j < sameType.length; j++) {
        const n = sameType[j];
        if (n === f) continue;
        const dx = f.x - n.x, dy = f.y - n.y;
        const d2 = dx * dx + dy * dy;
        const d  = Math.sqrt(d2);

        if (d < BOID_SEP && d > 0.01) {
          // Separation — steer away, weighted by closeness
          const w = (BOID_SEP - d) / BOID_SEP;
          sepX += (dx / d) * w; sepY += (dy / d) * w; sepN++;
        }
        if (d < BOID_ALI) {
          // Alignment — match velocity direction of neighbors
          aliVX += n.vx; aliVY += n.vy; aliN++;
        }
        if (d < BOID_COH) {
          // Cohesion — attract toward average neighbor position
          cohX += n.x; cohY += n.y; cohN++;
        }
      }

      // Apply separation (strong) — push away from overcrowded neighbors
      if (sepN > 0) {
        const sepDir = Math.atan2(sepY / sepN, sepX / sepN);
        let sd = sepDir - f.targetDir;
        while (sd >  Math.PI) sd -= Math.PI * 2;
        while (sd < -Math.PI) sd += Math.PI * 2;
        f.targetDir += sd * 0.12;
      }

      // Apply alignment (moderate) — match neighbor headings
      if (aliN > 0) {
        const aliDir = Math.atan2(aliVY / aliN, aliVX / aliN);
        let ad = aliDir - f.targetDir;
        while (ad >  Math.PI) ad -= Math.PI * 2;
        while (ad < -Math.PI) ad += Math.PI * 2;
        f.targetDir += ad * 0.028;
      }

      // Apply cohesion (weak) — drift toward average neighbor position
      if (cohN > 0) {
        const avgX = cohX / cohN, avgY = cohY / cohN;
        const cdx = avgX - f.x, cdy = avgY - f.y;
        const cd  = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cd > 25) {
          const cohDir = Math.atan2(cdy, cdx);
          let cod = cohDir - f.targetDir;
          while (cod >  Math.PI) cod -= Math.PI * 2;
          while (cod < -Math.PI) cod += Math.PI * 2;
          f.targetDir += cod * 0.018;
        }
      }
    }

    // Mouse avoidance — sharper panic within 60px
    if (mouse && f.type !== 'user') {
      const dx = f.x - mouse.x, dy = f.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 60) {
        f.targetDir = Math.atan2(dy, dx);
        const panicBoost = 1 - d / 60;
        f.vx += (dx / Math.max(d, 1)) * panicBoost * 0.55;
        f.vy += (dy / Math.max(d, 1)) * panicBoost * 0.55;
      } else if (d < 110) {
        f.targetDir = Math.atan2(dy, dx);
      }
    }

    // Predator avoidance — stingrays cause panic scatter (stronger than mouse)
    if (f.type !== 'user') {
      predators.forEach(sr => {
        const dx = f.x - sr.x, dy = f.y - sr.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) {
          f.targetDir = Math.atan2(dy, dx);
          const threat = 1 - d / 160;
          f.vx += (dx / Math.max(d, 1)) * threat * 1.1;
          f.vy += (dy / Math.max(d, 1)) * threat * 1.1;
          f._panic = Math.max(f._panic || 0, Math.floor(threat * 35));
        }
      });
    }
    if (f._panic > 0) f._panic--;

    let diff = f.targetDir - f.dir;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turnRate = f._scatter > 0 ? 0.14 : (f.type === 'event-fish' ? 0.07 : 0.025);
    f.dir += diff * turnRate;

    // Damping is weaker during scatter — fish coast longer on their burst velocity
    const damping = f._scatter > 0 ? 0.92 : 0.86;
    f.vx = f.vx * damping + Math.cos(f.dir) * f.speed * (1 - damping);
    f.vy = f.vy * damping + Math.sin(f.dir) * f.speed * (1 - damping);
    f.x += f.vx; f.y += f.vy;
    f.x = Math.max(28, Math.min(W - 28, f.x));
    f.y = Math.max(28, Math.min(floorY - 16, f.y));
    f.wiggle += f.wiggleSpd;
    // Trail
    if (!f.trail) f.trail = [];
    if (!f._trailTick) f._trailTick = 0;
    if (++f._trailTick % 3 === 0) {
      f.trail.push({ x: f.x, y: f.y });
      if (f.trail.length > 14) f.trail.shift();
    }
  });
}

function updateJellies(jellies, W, H) {
  const t = Date.now() * 0.001;
  jellies.forEach(j => {
    const prevX = j.x, prevY = j.y;

    // Pulse-driven propulsion — accelerate upward on contract, coast on expand
    const pulse = Math.sin(t * (0.55 + j.phase * 0.08) + j.phase);
    j.vy += pulse > 0 ? -0.006 : 0.003;
    j.vy  = Math.max(-0.12, Math.min(0.055, j.vy));

    j.x += Math.sin(t * 0.22 + j.phase * 1.7) * 0.18
         + Math.cos(t * 0.13 + j.phase * 0.9) * 0.09;
    j.y += j.vy;
    if (j.y < H * 0.04) { j.vy =  Math.abs(j.vy) * 0.6; }
    if (j.y > H * 0.70) { j.vy = -Math.abs(j.vy) * 0.6; }
    j.x = Math.max(35, Math.min(W - 35, j.x));

    // ── Verlet tentacle physics ──────────────────────────────────────
    if (j.tentacles) {
      const bellH = j.size * 0.62; // approximate bell half-height
      const TCOUNT = j.tentacles.length;
      j.tentacles.forEach((chain, ti) => {
        const ox = ((ti / (TCOUNT - 1)) - 0.5) * j.size * 1.6;
        // Anchor node 0 to bell underside, following jellyfish position
        chain[0].px = chain[0].x;
        chain[0].py = chain[0].y;
        chain[0].x  = j.x + ox;
        chain[0].y  = j.y + bellH * 0.42;

        const segLen = j._segLen ?? (j.size * 0.55);

        // Verlet integrate nodes 1..N
        for (let n = 1; n < chain.length; n++) {
          const nd = chain[n];
          const vx = (nd.x - nd.px) * 0.82; // damping
          const vy = (nd.y - nd.py) * 0.82;
          nd.px = nd.x;
          nd.py = nd.y;
          nd.x += vx + (Math.random() - 0.5) * 0.12; // micro turbulence
          nd.y += vy + 0.055; // gravity
        }

        // Constraint: enforce segment lengths (2 passes)
        for (let pass = 0; pass < 2; pass++) {
          for (let n = 1; n < chain.length; n++) {
            const a = chain[n - 1], b = chain[n];
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
            const corr = (dist - segLen) / dist * 0.5;
            // Node 0 is pinned, so only move b
            b.x -= dx * corr;
            b.y -= dy * corr;
          }
        }
      });
    }

    // Trail
    if (!j.trail) j.trail = [];
    if (!j._trailTick) j._trailTick = 0;
    if (++j._trailTick % 5 === 0) {
      j.trail.push({ x: j.x, y: j.y });
      if (j.trail.length > 10) j.trail.shift();
    }
  });
}

// School explosion — called at strike point; nearby fish blast radially outward
function scatterSchool(fish, epicX, epicY, radius) {
  fish.forEach(f => {
    if (f.type === 'user') return;
    const dx = f.x - epicX, dy = f.y - epicY;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < radius) {
      const strength = (1 - d / radius) * 5.5 + 1.2;
      const angle    = Math.atan2(dy, dx); // radially away from epicenter
      // Add a random angular spread so they don't all fly the same direction
      const spread   = (Math.random() - 0.5) * 1.1;
      f.vx += Math.cos(angle + spread) * strength;
      f.vy += Math.sin(angle + spread) * strength;
      f._panic = Math.max(f._panic || 0, 55 + Math.floor((1 - d / radius) * 25));
      f._scatter = 90; // suppress schooling for 90 frames while scattered
    }
  });
}

function updateStingrays(rays, W, H, fish = [], inkClouds = []) {
  const minY = H * 0.22, maxY = H * 0.72;
  rays.forEach(r => {
    // ── Hunt state machine ──────────────────────────────────────────
    if (!r._huntCooldown) r._huntCooldown = 0;
    r._huntCooldown = Math.max(0, r._huntCooldown - 1);

    // Enter hunt mode: pick a prey once every ~8 seconds (480 frames) when cooldown=0
    if (!r._prey && r._huntCooldown === 0 && Math.random() < 0.003 && fish.length > 0) {
      // Find nearest non-user fish
      let best = null, bestDist = Infinity;
      fish.forEach(f => {
        if (f.type === 'user') return;
        const dx = f.x - r.x, dy = f.y - r.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) { bestDist = d; best = f; }
      });
      if (best && bestDist < W * 0.55) {
        r._prey      = best;
        r._huntTimer = 220; // chase for up to ~4 seconds
        r._hunting   = true;
      }
    }

    const prevDir = r.dir;
    const m = 90;

    if (r._hunting && r._prey) {
      r._huntTimer--;
      // Check prey still alive in array
      if (r._huntTimer <= 0 || !fish.includes(r._prey)) {
        r._prey = null; r._hunting = false; r._huntCooldown = 360;
      } else {
        const dx = r._prey.x - r.x, dy = r._prey.y - r.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        r.targetDir = Math.atan2(dy, dx);

        // Strike! — when close enough, scatter the prey hard
        if (d < 55) {
          const strikeX = r._prey.x, strikeY = r._prey.y;
          r._prey._panic = 60;
          r._prey.vx += (dx / Math.max(d, 1)) * 3.5;
          r._prey.vy += (dy / Math.max(d, 1)) * 3.5;
          spawnInkBurst(inkClouds, strikeX, strikeY);
          // School explosion: blast all nearby fish radially outward from strike point
          scatterSchool(fish, strikeX, strikeY, 240);
          r._prey = null; r._hunting = false; r._huntCooldown = 420;
          r._strikeFlash = 8; // brief bright flash on the stingray
        }
      }
    } else {
      // Normal idle wander
      if      (r.x < m)         r.targetDir = (Math.random() - 0.5) * 0.4;
      else if (r.x > W - m)     r.targetDir = Math.PI + (Math.random() - 0.5) * 0.4;
      else if (r.y < minY + m)  r.targetDir = Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      else if (r.y > maxY - m)  r.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      else if (Math.random() < 0.004) r.targetDir += (Math.random() - 0.5) * 0.9;
    }

    const turnRate_raw = r._hunting ? 0.028 : 0.018; // sharper turns while hunting
    let diff = r.targetDir - r.dir;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    r.dir += diff * turnRate_raw;

    // Banking — tilt into the turn
    let turnRate = r.dir - prevDir;
    while (turnRate >  Math.PI) turnRate -= Math.PI * 2;
    while (turnRate < -Math.PI) turnRate += Math.PI * 2;
    r.bankAngle = (r.bankAngle || 0) * 0.90 + turnRate * 12;
    r.bankAngle = Math.max(-0.38, Math.min(0.38, r.bankAngle));

    // Speed up while hunting
    const activeSpeed = r._hunting ? r.speed * 2.1 : r.speed;
    r.vx = r.vx * 0.90 + Math.cos(r.dir) * activeSpeed * 0.10;
    r.vy = r.vy * 0.90 + Math.sin(r.dir) * activeSpeed * 0.10;
    r.x += r.vx; r.y += r.vy;
    r.x = Math.max(40, Math.min(W - 40, r.x));
    r.y = Math.max(minY, Math.min(maxY, r.y));

    if (r._strikeFlash > 0) r._strikeFlash--;

    // Trail
    if (!r._trailTick) r._trailTick = 0;
    if (++r._trailTick % 3 === 0) {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 8) r.trail.shift();
    }
  });
}

function updateSeahorses(horses, W, H) {
  const t = Date.now() / 1000;
  horses.forEach(h => {
    h.x += h.vx;
    h.y = h.y + Math.sin(t * 0.9 + h.phase) * 0.25;
    if (h.x < 30) { h.vx =  Math.abs(h.vx); }
    if (h.x > W - 30) { h.vx = -Math.abs(h.vx); }
    h.y = Math.max(H * 0.12, Math.min(H * 0.76, h.y));
  });
}

function updateCrabs(crabs, W, H) {
  const floorY = H * 0.78;
  crabs.forEach(c => {
    if (c.pauseFor > 0) {
      c.pauseFor--;
      return;
    }
    c.x += c.vx;
    c.y  = floorY;
    if (c.x < 20)      { c.vx =  Math.abs(c.vx); }
    if (c.x > W - 20)  { c.vx = -Math.abs(c.vx); }
    if (Math.random() < 0.008) {
      c.pauseFor = 30 + Math.floor(Math.random() * 60);
      c.vx = -c.vx;
    }
  });
}

function updateTurtles(turtles, W, H, bubbles) {
  const floorY = H * 0.82;
  turtles.forEach(t => {
    // ── Surfacing state machine ────────────────────────────────────────
    if (!t._surfaceTimer) t._surfaceTimer = 1800 + Math.floor(Math.random() * 2400);
    if (!t._surfacePhase) t._surfacePhase = 'normal';

    if (t._surfacePhase === 'normal') {
      t._surfaceTimer = Math.max(0, t._surfaceTimer - 1);
      if (t._surfaceTimer === 0) {
        t._surfacePhase = 'rising';
        t._surfaceTimer  = 0;
      }
    } else if (t._surfacePhase === 'rising') {
      // Steer sharply upward toward surface
      t.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.2;
      if (t.y < H * 0.06) {
        t._surfacePhase = 'breathing';
        t._surfaceTimer  = 90 + Math.floor(Math.random() * 60); // 1.5-2.5s at surface
        // Exhale: push a burst of bubbles upward
        if (bubbles) {
          for (let b = 0; b < 12; b++) {
            bubbles.push({
              x:     t.x + (Math.random() - 0.5) * 14,
              y:     t.y + 6,
              r:     1.2 + Math.random() * 2.2,
              speed: 0.55 + Math.random() * 0.65,
              phase: Math.random() * Math.PI * 2,
              drift: (Math.random() - 0.5) * 0.3,
            });
          }
        }
      }
    } else if (t._surfacePhase === 'breathing') {
      // Bob gently at surface
      t.targetDir = (Math.random() - 0.5) * 0.3;
      t.vy = Math.min(t.vy, 0.05);
      t._surfaceTimer = Math.max(0, t._surfaceTimer - 1);
      if (t._surfaceTimer === 0) {
        t._surfacePhase = 'descending';
      }
    } else { // descending
      t.targetDir = Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      if (t.y > H * 0.25) {
        t._surfacePhase = 'normal';
        t._surfaceTimer  = 1800 + Math.floor(Math.random() * 2400); // 30-70s until next surface
      }
    }

    // ── Normal steering (when not locked into surface maneuver) ────────
    const m = 70;
    if (t._surfacePhase === 'normal') {
      if      (t.x < m)           t.targetDir = (Math.random() - 0.5) * 0.5;
      else if (t.x > W - m)       t.targetDir = Math.PI + (Math.random() - 0.5) * 0.5;
      else if (t.y > floorY - m)  t.targetDir = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      else if (Math.random() < 0.003) t.targetDir += (Math.random() - 0.5) * 0.7;
    }

    const turnRate = (t._surfacePhase === 'rising' || t._surfacePhase === 'descending') ? 0.025 : 0.01;
    let diff = t.targetDir - t.dir;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    t.dir += diff * turnRate;

    const activeSpeed = (t._surfacePhase === 'rising') ? t.speed * 1.8 : t.speed;
    t.vx = t.vx * 0.96 + Math.cos(t.dir) * activeSpeed * 0.04;
    t.vy = t.vy * 0.96 + Math.sin(t.dir) * activeSpeed * 0.04;
    t.x += t.vx; t.y += t.vy;
    t.x = Math.max(30, Math.min(W - 30, t.x));
    // Allow turtles to reach the very top during surfacing
    const minY = t._surfacePhase === 'breathing' ? 4 : 30;
    t.y = Math.max(minY, Math.min(floorY - 20, t.y));

    // Trail
    if (!t.trail) t.trail = [];
    if (!t._trailTick) t._trailTick = 0;
    if (++t._trailTick % 4 === 0) {
      t.trail.push({ x: t.x, y: t.y });
      if (t.trail.length > 12) t.trail.shift();
    }
  });
}

// ── Deep reef silhouette ─────────────────────────────────────────────
// Generates deterministic reef shape data from seed values (no stored state needed)
function drawReefSilhouette(ctx, W, H, frame, mouse, daylight) {
  const px = (mouse.x / W - 0.5) * 12;
  const py = (mouse.y / H - 0.5) * 6;

  ctx.save();
  // Very slow parallax — furthest layer in the scene
  ctx.translate(px * 0.35, py * 0.15);

  // 5 reef formation groups at varying x positions and floor heights
  const formations = [
    { cx: W * 0.08,  baseY: H * 0.78, w: W * 0.14, h: H * 0.22, seed: 11.3 },
    { cx: W * 0.28,  baseY: H * 0.82, w: W * 0.18, h: H * 0.16, seed: 27.7 },
    { cx: W * 0.52,  baseY: H * 0.76, w: W * 0.22, h: H * 0.26, seed: 43.1 },
    { cx: W * 0.73,  baseY: H * 0.80, w: W * 0.16, h: H * 0.20, seed: 59.9 },
    { cx: W * 0.92,  baseY: H * 0.74, w: W * 0.14, h: H * 0.28, seed: 71.5 },
  ];

  // Night-adjusted haze: slightly brighter at night from bioluminescence scatter
  const hazeBlue = Math.round(8 + (1 - daylight) * 12);
  const silAlpha = 0.55 + (1 - daylight) * 0.15;

  formations.forEach(f => {
    const { cx, baseY, w, h, seed } = f;

    // Build a jagged ridge silhouette using deterministic pseudo-random peaks
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.6, H + 10); // bottom-left anchor below canvas

    const steps = 14;
    for (let s = 0; s <= steps; s++) {
      const t   = s / steps;
      const nx  = (cx - w * 0.6) + t * w * 1.2;
      // Height variation using sines with the seed for determinism
      const peakH = h * (
        0.3 + 0.35 * Math.abs(Math.sin(seed + t * 5.1)) +
        0.25 * Math.abs(Math.sin(seed * 1.7 + t * 8.3)) +
        0.10 * Math.abs(Math.sin(seed * 3.1 + t * 14.9))
      );
      // Extra spire at certain positions
      const spire = (s === 4 || s === 9) ? h * 0.18 * Math.abs(Math.sin(seed * 4.2 + s)) : 0;
      ctx.lineTo(nx, baseY - peakH - spire);
    }

    ctx.lineTo(cx + w * 0.6, H + 10); // bottom-right anchor
    ctx.closePath();

    // Fill with a vertical gradient: near-black at top, slightly lighter at base
    const grad = ctx.createLinearGradient(cx, baseY - h, cx, H);
    grad.addColorStop(0,   `rgba(${hazeBlue},${hazeBlue + 10},${hazeBlue + 22},${silAlpha})`);
    grad.addColorStop(0.4, `rgba(${hazeBlue - 2},${hazeBlue + 6},${hazeBlue + 16},${silAlpha * 0.85})`);
    grad.addColorStop(1,   `rgba(2,6,14,${silAlpha * 0.6})`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Slight blue-haze rim at the top edge (depth scattering)
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.6, baseY);
    const rimSteps = 8;
    for (let s = 0; s <= rimSteps; s++) {
      const t   = s / rimSteps;
      const nx  = (cx - w * 0.6) + t * w * 1.2;
      const ph  = h * (0.3 + 0.35 * Math.abs(Math.sin(seed + t * 5.1)) + 0.25 * Math.abs(Math.sin(seed * 1.7 + t * 8.3)));
      ctx.lineTo(nx, baseY - ph);
    }
    ctx.strokeStyle = `rgba(30,65,110,${0.18 + (1 - daylight) * 0.08})`;
    ctx.lineWidth = 1.5; ctx.stroke();
  });

  ctx.restore();
}

// ── Seafloor texture ─────────────────────────────────────────────────
// Multi-scale animated sand ripples give the floor organic texture.
function drawSeafloorTexture(ctx, W, H, frame, daylight, tidalCurrent) {
  const floorY = H * 0.81;
  const zoneH  = H - floorY; // floor zone height

  // Tidal current shifts ripple phase direction and speed
  const tidalShift = tidalCurrent && tidalCurrent.active
    ? tidalCurrent.cosA * tidalCurrent.strength * 0.022 : 0;

  ctx.save();

  // Large-scale primary ripples (slow, widely spaced)
  const primaryRipples = 12;
  for (let r = 0; r < primaryRipples; r++) {
    const t   = r / primaryRipples;
    const ry  = floorY + t * zoneH * 0.85;
    const amp = 3.5 - t * 2.0;  // amplitude decreases deeper
    const spd = 0.004 + t * 0.002;
    const freq = 0.025 + t * 0.008;
    const nightBrightness = 0.025 + (1 - daylight) * 0.018;
    const alpha = (nightBrightness + (1 - t) * 0.018) * (0.6 + 0.4 * (1 - t));

    ctx.beginPath();
    ctx.moveTo(0, ry);
    for (let sx = 0; sx <= W; sx += 5) {
      const wave = Math.sin(sx * freq + frame * (spd + tidalShift) + r * 1.3) * amp
                 + Math.sin(sx * freq * 2.1 + frame * spd * 1.6 + r * 0.8) * amp * 0.3;
      ctx.lineTo(sx, ry + wave);
    }
    ctx.strokeStyle = `rgba(60,130,180,${alpha})`;
    ctx.lineWidth = 0.55 + (1 - t) * 0.35;
    ctx.stroke();
  }

  // Small-scale secondary ripples (faster, tighter — sand grain motion)
  const microRipples = 8;
  for (let r = 0; r < microRipples; r++) {
    const t   = r / microRipples;
    const ry  = floorY + zoneH * 0.05 + t * zoneH * 0.70;
    const amp = 1.2 - t * 0.7;
    const freq = 0.065 + r * 0.009;
    const alpha = 0.018 + (1 - daylight) * 0.012;

    ctx.beginPath();
    ctx.moveTo(0, ry);
    for (let sx = 0; sx <= W; sx += 4) {
      const wave = Math.sin(sx * freq + frame * (0.009 + tidalShift * 1.8) + r * 2.1) * amp;
      ctx.lineTo(sx, ry + wave);
    }
    ctx.strokeStyle = `rgba(70,145,195,${alpha})`;
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }

  // Occasional bright sediment glints at night (bioluminescent micro-organisms)
  if (daylight < 0.55) {
    const glintCount = 18;
    const nightIntensity = (1 - daylight) * 0.55;
    for (let g = 0; g < glintCount; g++) {
      const gx = ((g * 173.4 + frame * 0.04) % W);
      const gy = floorY + 4 + ((g * 97.1 + frame * 0.018) % (zoneH * 0.6));
      const gp = Math.sin(frame * 0.065 + g * 2.1) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(gx, gy, 0.7 + gp * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(185,75%,65%,${gp * nightIntensity * 0.5})`;
      ctx.fill();
    }
  }

  ctx.restore();
}

// ── Drawing ────────────────────────────────────────────────────────
function drawBackground(ctx, W, H, frame, rays, mouse, daylight = 1) {
  // Daylight=1 is day (current look), daylight=0 is deep night
  const d = daylight; // shorthand

  // Background gradient shifts darker at night
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    `rgb(${Math.round(1+d*0)},${Math.round(d*16)},${Math.round(d*32)})`);
  bg.addColorStop(0.12, `rgb(${Math.round(d*2)},${Math.round(d*32)},${Math.round(d*56)})`);
  bg.addColorStop(0.32, `rgb(${Math.round(d*3)},${Math.round(d*28)},${Math.round(d*52)})`);
  bg.addColorStop(0.55, `rgb(${Math.round(d*2)},${Math.round(d*26)},${Math.round(d*44)})`);
  bg.addColorStop(0.78, `rgb(${Math.round(d*1)},${Math.round(d*16)},${Math.round(d*30)})`);
  bg.addColorStop(1,    '#000408');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const px = (mouse.x / W - 0.5) * 12;
  const py = (mouse.y / H - 0.5) *  6;

  ctx.save(); ctx.translate(px * 1.5, py * 0.5);
  ctx.globalCompositeOperation = 'screen';

  // Primary wide rays — 2× brighter than before
  rays.forEach(ray => {
    const pulse = Math.sin(frame * 0.012 + ray.phase) * 0.5 + 0.5;
    const alpha = (0.048 + pulse * 0.068) * daylight;  // was 0.024+0.036
    const gr = ctx.createLinearGradient(ray.x, 0, ray.x, H * 0.88);
    gr.addColorStop(0,    `rgba(130,210,255,${alpha})`);
    gr.addColorStop(0.22, `rgba(90,175,245,${alpha * 0.82})`);
    gr.addColorStop(0.55, `rgba(60,140,220,${alpha * 0.45})`);
    gr.addColorStop(1,    'rgba(0,40,90,0)');
    ctx.beginPath();
    ctx.moveTo(ray.x - ray.width * 0.5, 0);
    ctx.lineTo(ray.x + ray.width * 0.5, 0);
    ctx.lineTo(ray.x + ray.width * 0.62 + px * 0.4, H * 0.88);
    ctx.lineTo(ray.x - ray.width * 0.30 + px * 0.4, H * 0.88);
    ctx.closePath();
    ctx.fillStyle = gr; ctx.fill();
  });

  // Bright narrow central shafts — every ray gets one now
  rays.forEach(ray => {
    const pulse2 = Math.sin(frame * 0.016 + ray.phase + 1.2) * 0.5 + 0.5;
    const alpha2 = (0.072 + pulse2 * 0.095) * daylight;  // was 0.035+0.055, every-other
    const w2 = ray.width * 0.14;
    const gr2 = ctx.createLinearGradient(ray.x, 0, ray.x, H * 0.62);
    gr2.addColorStop(0,    `rgba(200,238,255,${alpha2})`);
    gr2.addColorStop(0.18, `rgba(160,215,255,${alpha2 * 0.70})`);
    gr2.addColorStop(0.55, `rgba(90,170,240,${alpha2 * 0.28})`);
    gr2.addColorStop(1,    'rgba(50,120,200,0)');
    ctx.beginPath();
    ctx.moveTo(ray.x - w2 * 0.5, 0);
    ctx.lineTo(ray.x + w2 * 0.5, 0);
    ctx.lineTo(ray.x + w2 * 0.75 + px * 0.2, H * 0.62);
    ctx.lineTo(ray.x - w2 * 0.32 + px * 0.2, H * 0.62);
    ctx.closePath();
    ctx.fillStyle = gr2; ctx.fill();
  });

  // Surface-entry caustic crown — bright star burst where each ray enters the water
  rays.forEach(ray => {
    const pulse3 = Math.sin(frame * 0.024 + ray.phase * 1.5) * 0.5 + 0.5;
    const crownAlpha = (0.12 + pulse3 * 0.16) * daylight;
    const crownW = ray.width * 0.7;
    const cg = ctx.createRadialGradient(ray.x, 0, 0, ray.x, 2, crownW * 1.1);
    cg.addColorStop(0,   `rgba(220,245,255,${crownAlpha})`);
    cg.addColorStop(0.35,`rgba(160,220,255,${crownAlpha * 0.5})`);
    cg.addColorStop(1,   'rgba(80,160,220,0)');
    ctx.beginPath(); ctx.ellipse(ray.x, 1, crownW * 0.5, 4 + pulse3 * 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = cg; ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  for (let sx = 0; sx < W; sx += 22) {
    const sh = Math.sin(frame * 0.042 + sx * 0.09) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(sx + Math.sin(frame * 0.018 + sx) * 5, 4 + sh * 3, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,180,255,${sh * 0.16})`; ctx.fill();
  }

  // Deep scatter — faint distant bioluminescent specks, suggests infinite depth
  for (let i = 0; i < 22; i++) {
    const scx  = ((i * 179.4 + frame * 0.032) % W);
    const scy  = H * 0.08 + ((i * 113.7 + frame * 0.014) % (H * 0.68));
    const spal = Math.sin(frame * 0.008 + i * 2.2) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(scx, scy, 0.45, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60,160,210,${spal * 0.10})`; ctx.fill();
  }

  // Bioluminescent plankton — slowly drifting, individually pulsing
  for (let i = 0; i < 38; i++) {
    const drift = Math.sin(frame * 0.007 + i * 2.4) * 3.2;
    const ppx   = ((i * 137.508 + frame * 0.085 + drift) % (W + 40)) - 20;
    const ppy   = ((i * 83.127  + frame * (0.04 + (i % 5) * 0.006)) % (H * 0.78));
    const pulse = Math.sin(frame * (0.025 + (i % 7) * 0.003) + i * 1.618) * 0.5 + 0.5;
    const hue   = 155 + (i * 31) % 80;  // cyan → green range
    const r     = 0.7 + pulse * 1.1;
    const al    = (pulse * 0.22 + 0.04) * (0.4 + (1 - daylight) * 1.6); // brighter at night
    ctx.beginPath(); ctx.arc(ppx, ppy, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue},85%,70%,${Math.min(al, 0.75)})`; ctx.fill();
    // Occasional larger "jellyfish egg" particle
    if (i % 6 === 0) {
      const gx = ((i * 211.3 + frame * 0.06) % W);
      const gy = ((i * 157.7 + frame * 0.028) % (H * 0.72));
      const gp = Math.sin(frame * 0.018 + i * 2.7) * 0.5 + 0.5;
      ctx.beginPath(); ctx.arc(gx, gy, 1.5 + gp * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80,200,255,${gp * 0.14})`; ctx.fill();
    }
  }
}

function drawThermocline(ctx, W, H, frame) {
  // Optical boundary between warm surface water and cold deep water.
  // Renders as a shimmering, wavy translucent band with a bright shimmer edge.
  const baseY = H * 0.33;
  const bandH = 24;

  // Wavy top edge — two sine layers for organic look
  function waveY(x) {
    return baseY
      + Math.sin(x * 0.021 + frame * 0.013)       * 5.5
      + Math.sin(x * 0.044 + frame * 0.009 + 1.6) * 2.8
      + Math.sin(x * 0.012 + frame * 0.017 + 3.1) * 1.8;
  }

  ctx.save();

  // Translucent body of the thermocline band
  ctx.beginPath();
  ctx.moveTo(0, waveY(0));
  for (let x = 2; x <= W; x += 2) ctx.lineTo(x, waveY(x));
  ctx.lineTo(W, waveY(W) + bandH);
  for (let x = W; x >= 0; x -= 2) ctx.lineTo(x, waveY(x) + bandH);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, baseY, 0, baseY + bandH);
  bg.addColorStop(0,    'rgba(60,150,230,0.03)');
  bg.addColorStop(0.35, 'rgba(100,210,255,0.13)');
  bg.addColorStop(0.5,  'rgba(120,220,255,0.17)');
  bg.addColorStop(0.65, 'rgba(100,210,255,0.13)');
  bg.addColorStop(1,    'rgba(60,150,230,0.03)');
  ctx.fillStyle = bg; ctx.fill();

  // Bright shimmer edge — pulses slowly
  const pulse = Math.sin(frame * 0.019) * 0.5 + 0.5;
  ctx.beginPath();
  ctx.moveTo(0, waveY(0));
  for (let x = 2; x <= W; x += 2) ctx.lineTo(x, waveY(x));
  ctx.strokeStyle = `rgba(160,240,255,${0.07 + pulse * 0.13})`;
  ctx.lineWidth = 1.1; ctx.stroke();

  // Second fainter shimmer line offset slightly below — gives depth to the band
  ctx.beginPath();
  ctx.moveTo(0, waveY(0) + bandH * 0.55);
  for (let x = 2; x <= W; x += 2) ctx.lineTo(x, waveY(x) + bandH * 0.55);
  ctx.strokeStyle = `rgba(100,200,240,${0.03 + pulse * 0.06})`;
  ctx.lineWidth = 0.6; ctx.stroke();

  ctx.restore();
}

function drawDepthFog(ctx, W, H, frame) {
  // Horizontal haze bands that drift very slowly — creates depth illusion
  const bands = [
    { y: H * 0.10, h: H * 0.09, hue: 200, alpha: 0.055 },
    { y: H * 0.32, h: H * 0.08, hue: 208, alpha: 0.042 },
    { y: H * 0.54, h: H * 0.09, hue: 213, alpha: 0.052 },
    { y: H * 0.72, h: H * 0.06, hue: 218, alpha: 0.035 },
  ];
  ctx.save();
  bands.forEach((b, bi) => {
    const dy = Math.sin(frame * 0.005 + bi * 1.4) * 5;
    const gr = ctx.createLinearGradient(0, b.y + dy, 0, b.y + dy + b.h);
    gr.addColorStop(0,   `hsla(${b.hue},70%,45%,0)`);
    gr.addColorStop(0.4, `hsla(${b.hue},70%,45%,${b.alpha})`);
    gr.addColorStop(0.6, `hsla(${b.hue},70%,45%,${b.alpha})`);
    gr.addColorStop(1,   `hsla(${b.hue},70%,45%,0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, b.y + dy, W, b.h);
  });
  ctx.restore();
}

function drawWaterSurface(ctx, W, surfaceMesh, frame) {
  // Animated light-net at the very top — caustic refraction pattern
  const rows = 5;
  const cellH = 18;
  ctx.save();
  ctx.globalAlpha = 1;

  for (let row = 0; row < rows; row++) {
    const y0  = row * cellH;
    const alpha = (1 - row / rows) * 0.11;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let i = 0; i < surfaceMesh.length; i++) {
      const m = surfaceMesh[i];
      const wave = Math.sin(frame * m.speed + m.phase + row * 0.8) * m.amp * (1 - row * 0.14);
      ctx.lineTo(m.x, y0 + wave);
    }
    ctx.lineTo(W, y0); ctx.lineTo(0, y0); ctx.closePath();
    const gr = ctx.createLinearGradient(0, y0, 0, y0 + cellH);
    gr.addColorStop(0, `rgba(100,200,255,${alpha})`);
    gr.addColorStop(1, `rgba(60,150,220,0)`);
    ctx.fillStyle = gr;
    ctx.fill();
  }

  // Horizontal shimmer lines
  for (let i = 0; i < surfaceMesh.length - 1; i++) {
    const m  = surfaceMesh[i];
    const m2 = surfaceMesh[i + 1];
    const y1 = Math.sin(frame * m.speed  + m.phase)  * m.amp;
    const y2 = Math.sin(frame * m2.speed + m2.phase) * m2.amp;
    const brightness = (Math.sin(frame * 0.04 + i * 0.7) * 0.5 + 0.5) * 0.14;
    ctx.beginPath();
    ctx.moveTo(m.x, y1); ctx.lineTo(m2.x, y2);
    ctx.strokeStyle = `rgba(160,230,255,${brightness})`;
    ctx.lineWidth = 0.7; ctx.stroke();
  }

  ctx.restore();
}

function drawCaustics(ctx, caustics, frame) {
  // Shimmering light patches on the ocean floor
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  caustics.forEach(c => {
    // Each caustic patch breathes at its own speed and phase
    const t      = frame * c.speed + c.phase;
    const alpha  = (Math.sin(t) * 0.5 + 0.5) * 0.055 + 0.012;
    const scaleX = 0.75 + Math.sin(t * 1.3 + 0.5) * 0.28;
    const scaleY = 0.75 + Math.cos(t * 0.9 + 1.1) * 0.28;

    ctx.save();
    ctx.translate(c.x + Math.sin(t * 0.4) * 8, c.y + Math.cos(t * 0.3) * 4);
    ctx.rotate(c.rot + t * 0.008);
    ctx.beginPath();
    ctx.ellipse(0, 0, c.rx * scaleX, c.ry * scaleY, 0, 0, Math.PI * 2);
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, c.rx * scaleX);
    cg.addColorStop(0,   `rgba(80,200,255,${alpha * 1.6})`);
    cg.addColorStop(0.45,`rgba(40,140,220,${alpha})`);
    cg.addColorStop(1,   `rgba(0,60,140,0)`);
    ctx.fillStyle = cg; ctx.fill();
    ctx.restore();
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawSandFloor(ctx, W, H, frame, details) {
  const floorTop = H * 0.81;
  const floorGrad = ctx.createLinearGradient(0, floorTop, 0, H);
  floorGrad.addColorStop(0,   '#102030');
  floorGrad.addColorStop(0.3, '#0C1A26');
  floorGrad.addColorStop(0.7, '#08141C');
  floorGrad.addColorStop(1,   '#050E14');
  ctx.fillStyle = floorGrad; ctx.fillRect(0, floorTop, W, H - floorTop);

  // Perspective grid lines converging to vanishing point at horizon
  ctx.save();
  const vpx = W * 0.50;  // vanishing point x (center)
  const vpy = floorTop;  // vanishing point y (floor horizon)
  const gridCols = 10;
  ctx.globalAlpha = 0.06;
  for (let i = 0; i <= gridCols; i++) {
    const bx = W * (i / gridCols);
    ctx.beginPath();
    ctx.moveTo(vpx + (bx - vpx) * 0.04, vpy);
    ctx.lineTo(bx, H);
    ctx.strokeStyle = 'rgba(80,150,220,1)';
    ctx.lineWidth = 0.8; ctx.stroke();
  }
  // Horizontal perspective rows — spaced closer near horizon (foreshortening)
  for (let r = 0; r < 7; r++) {
    const t   = r / 6;
    const ry  = floorTop + (H - floorTop) * (t * t);  // quadratic spacing = perspective
    const wid = W * (0.08 + t * 0.92);
    const ox  = (W - wid) * 0.5;
    ctx.beginPath();
    ctx.moveTo(ox, ry); ctx.lineTo(ox + wid, ry);
    ctx.strokeStyle = 'rgba(80,150,220,1)';
    ctx.lineWidth = 0.6; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Sand ripple lines
  ctx.save();
  for (let r = 0; r < 5; r++) {
    const ry = floorTop + 8 + r * 9;
    ctx.beginPath();
    ctx.moveTo(0, ry);
    for (let sx = 0; sx <= W; sx += 6) {
      const wave = Math.sin(sx * 0.045 + frame * 0.008 + r * 1.1) * 2.5;
      ctx.lineTo(sx, ry + wave);
    }
    ctx.strokeStyle = `rgba(80,140,180,${0.04 + r * 0.012})`;
    ctx.lineWidth = 0.7; ctx.stroke();
  }
  ctx.restore();

  if (!details) return;

  // Starfish
  details.starfish.forEach(sf => {
    ctx.save(); ctx.translate(sf.x, sf.y); ctx.rotate(sf.rot);
    ctx.shadowColor = '#FF9966'; ctx.shadowBlur = 7;
    for (let arm = 0; arm < 5; arm++) {
      const a = (arm / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * sf.r * 0.55, Math.sin(a) * sf.r * 0.55,
        sf.r * 0.55, sf.r * 0.2,
        a, 0, Math.PI * 2
      );
      ctx.fillStyle = '#E07755'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, sf.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#C05535'; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // Shells
  details.shells.forEach(sh => {
    ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot);
    ctx.shadowColor = '#E0C090'; ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, sh.r, sh.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E8BC85'; ctx.fill();
    for (let ridge = 1; ridge <= 4; ridge++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, sh.r * (ridge / 4), sh.r * 0.6 * (ridge / 4), 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,120,60,0.45)`; ctx.lineWidth = 0.5; ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // Sand dollars
  details.dollars.forEach(sd => {
    ctx.save(); ctx.translate(sd.x, sd.y);
    ctx.beginPath(); ctx.arc(0, 0, sd.r, 0, Math.PI * 2);
    ctx.fillStyle = '#C8B89A'; ctx.fill();
    ctx.strokeStyle = 'rgba(140,110,80,0.4)'; ctx.lineWidth = 0.6; ctx.stroke();
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, sd.r * 0.62, a - 0.28, a + 0.28);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(120,90,60,0.35)'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    ctx.restore();
  });
}

function drawRocks(ctx, rocks) {
  rocks.forEach(rock => {
    ctx.save();
    ctx.translate(rock.x, rock.y);

    // Cast shadow on the floor — offset down and right, stretched flat
    ctx.beginPath();
    ctx.ellipse(rock.rx * 0.18, rock.ry * 0.6, rock.rx * 0.88, rock.ry * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,4,12,0.28)'; ctx.fill();

    // Rock body with directional gradient (top-left lit)
    const rg = ctx.createRadialGradient(-rock.rx * 0.32, -rock.ry * 0.42, rock.ry * 0.08, 0, 0, rock.rx);
    rg.addColorStop(0,   '#2A3E50');
    rg.addColorStop(0.55,'#0F1E2C');
    rg.addColorStop(1,   '#040C14');
    ctx.beginPath();
    ctx.ellipse(0, 0, rock.rx, rock.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = 'rgba(60,100,140,0.20)'; ctx.lineWidth = 0.8; ctx.stroke();

    // Specular highlight — small bright patch on upper-left
    const hl = ctx.createRadialGradient(-rock.rx * 0.3, -rock.ry * 0.45, 0, -rock.rx * 0.2, -rock.ry * 0.3, rock.rx * 0.5);
    hl.addColorStop(0,   'rgba(100,160,220,0.28)');
    hl.addColorStop(0.5, 'rgba(60,120,180,0.08)');
    hl.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, rock.rx, rock.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = hl; ctx.fill();

    ctx.restore();
  });
}

function drawAnemone(ctx, a, frame, nearFish) {
  ctx.save();
  ctx.translate(a.x, a.y);

  // Base oval
  ctx.beginPath();
  ctx.ellipse(0, 0, a.spread * 0.55, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${a.hue},55%,22%)`;
  ctx.shadowColor = `hsl(${a.hue},80%,55%)`;
  ctx.shadowBlur = 8;
  ctx.fill();

  // If a fish is nearby, compute a reach direction toward it
  const hasFish = nearFish && nearFish.dist < 110;
  const reachX  = hasFish ? (nearFish.x - a.x) / nearFish.dist : 0;
  const reachY  = hasFish ? (nearFish.y - a.y) / nearFish.dist : 0;
  const reachStr= hasFish ? Math.max(0, 1 - nearFish.dist / 110) * 9 : 0;

  // Tentacles
  for (let t = 0; t < a.tentacles; t++) {
    const tx    = ((t / (a.tentacles - 1)) - 0.5) * a.spread * 2;
    const sway  = Math.sin(frame * 0.022 + a.phase + t * 0.7) * 7 + reachX * reachStr;
    const sway2 = Math.sin(frame * 0.015 + a.phase + t * 0.4) * 5 + reachX * reachStr * 0.7;
    const h     = a.height + reachStr * 0.4;
    const tipY  = -h + reachY * reachStr * 0.5;

    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.quadraticCurveTo(tx + sway, -h * 0.55, tx + sway2, tipY);
    ctx.strokeStyle = `hsla(${a.hue},70%,${hasFish ? 62 : 55}%,${hasFish ? 0.85 : 0.7})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Bulb tip — glows brighter when reaching
    ctx.beginPath();
    ctx.arc(tx + sway2, tipY, 2.5 + reachStr * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${a.hue + 20},85%,${hasFish ? 78 : 70}%)`;
    ctx.shadowBlur = hasFish ? 9 : 5;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSeaweed(ctx, s, frame, tidalCurrent = null, daylight = 1) {
  const { x, y, h, segs, phase, hue, width } = s;
  const segH = h / segs;
  const tidalBias = tidalCurrent && tidalCurrent.active
    ? tidalCurrent.cosA * tidalCurrent.strength * 18 : 0;
  const nightGlow = Math.max(0, 1 - daylight * 1.8);

  // Build segment positions for drawing and tip glow
  const pts = [{ x, y }];
  for (let i = 1; i <= segs; i++) {
    const sway = Math.sin(frame * 0.018 + phase + i * 0.58) * (5 + i * 1.7)
               + tidalBias * (i / segs);
    pts.push({ x: x + sway, y: y - i * segH });
  }

  // Stem — brighter green at night
  const stemL = nightGlow > 0.05 ? 30 + nightGlow * 18 : 24;
  ctx.strokeStyle = `hsl(${hue},${55 + nightGlow * 20}%,${stemL}%)`;
  ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Night-glow tip bead
  if (nightGlow > 0.05) {
    const tip = pts[pts.length - 1];
    const tipPulse = 0.5 + 0.5 * Math.sin(frame * 0.05 + phase * 3.1);
    const glowR    = 3.5 + tipPulse * 2.0;
    const glowAlpha = nightGlow * (0.45 + tipPulse * 0.45);

    // Halo
    const grd = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, glowR * 2.5);
    grd.addColorStop(0,   `hsla(${hue + 15},80%,68%,${glowAlpha * 0.55})`);
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(tip.x, tip.y, glowR * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();

    // Bright bead
    ctx.beginPath(); ctx.arc(tip.x, tip.y, glowR * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + 20},88%,75%,${glowAlpha})`;
    ctx.shadowColor = `hsla(${hue + 10},85%,60%,${nightGlow})`; ctx.shadowBlur = 7;
    ctx.fill(); ctx.shadowBlur = 0;

    // Mid-stalk accent glows on upper half segments
    for (let i = Math.floor(segs * 0.55); i < segs; i++) {
      const mp = pts[i];
      const mPulse = 0.4 + 0.6 * Math.sin(frame * 0.04 + phase + i * 0.9);
      const mAlpha = nightGlow * mPulse * 0.28;
      ctx.beginPath(); ctx.arc(mp.x, mp.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue + 10},75%,65%,${mAlpha})`; ctx.fill();
    }
  }
}

function drawCoral(ctx, c, frame, daylight = 1) {
  const { x, y, h, type, color, phase } = c;
  const sway = Math.sin(frame * 0.016 + phase) * 1.4;
  const nightGlow = Math.max(0, 1 - daylight * 1.8);
  // Night: glow shadow brightens dramatically
  ctx.shadowColor = color; ctx.shadowBlur = 5 + nightGlow * 18;
  ctx.strokeStyle = color; ctx.fillStyle = color;

  if (type === 0) {
    // Branching coral
    function branch(bx, by, bh, angle, depth) {
      if (depth > 3 || bh < 5) return;
      const ex = bx + Math.sin(angle + sway * 0.05 * depth) * bh;
      const ey = by - bh * 0.92;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
      ctx.lineWidth = Math.max(0.6, 2.8 - depth * 0.8); ctx.stroke();
      if (depth < 2) {
        branch(ex, ey, bh * 0.62, angle - 0.55, depth + 1);
        branch(ex, ey, bh * 0.62, angle + 0.55, depth + 1);
      } else {
        branch(ex, ey, bh * 0.72, angle, depth + 1);
      }
    }
    branch(x, y, h, sway * 0.03, 0);
  } else if (type === 1) {
    // Fan coral
    const fanW = h * 0.75;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 13; i++) {
      const a = (i / 12) * Math.PI + sway * 0.025;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(a) * fanW, y - Math.cos(a) * h);
      ctx.lineWidth = 0.65; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (type === 2) {
    // Tube cluster
    for (let t = 0; t < 5; t++) {
      const tx = x + (t - 2) * 6.5 + Math.sin(phase + t) * 3.5;
      const th = h * (0.48 + (t % 3) * 0.18);
      ctx.beginPath();
      ctx.moveTo(tx - 2.8, y);
      ctx.lineTo(tx - 2.8, y - th + 4);
      ctx.arc(tx, y - th + 4, 3.2, Math.PI, 0);
      ctx.lineTo(tx + 2.8, y);
      ctx.lineWidth = 0.9; ctx.globalAlpha = 0.60;
      ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    // Brain/dome coral
    const domeR = h * 0.45;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(x, y - domeR, domeR * 1.15, domeR, 0, Math.PI, 0);
    ctx.closePath();
    ctx.lineWidth = 1.2; ctx.fill();
    // Ridge ellipses on surface
    for (let r = 0; r < 4; r++) {
      const ridgeX = x + (r - 1.5) * domeR * 0.38;
      ctx.beginPath();
      ctx.ellipse(ridgeX, y - domeR * 0.9, domeR * 0.08, domeR * 0.72, Math.sin(r) * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = color + 'AA'; ctx.lineWidth = 0.7; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.shadowBlur = 0;

  // ── Polyp clusters — tiny bioluminescent flowers along the coral ──
  // Use the coral's phase as a deterministic seed so each coral has
  // consistent polyp positions without stored state.
  const polyCount = 4 + Math.floor((phase * 1000 % 3)); // 4–6
  for (let p = 0; p < polyCount; p++) {
    // Spread polyps along the coral height using a pseudo-random offset
    const seed  = Math.sin(phase * 37.4 + p * 9.1);
    const seed2 = Math.sin(phase * 11.7 + p * 3.3);
    const px    = x + seed  * h * 0.35;
    const py    = y - h * (0.18 + (p / polyCount) * 0.72);
    const open  = 0.5 + 0.5 * Math.sin(frame * 0.018 + phase + p * 1.4);
    const petalR = (1.6 + Math.abs(seed2) * 1.4) * open * (1 + nightGlow * 0.5);
    const petals = 5;
    const hue    = parseInt(color.slice(1, 3), 16); // rough hue proxy
    const alpha  = Math.min(0.45 + open * 0.45 + nightGlow * 0.38, 0.95);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur  = open * 6 + nightGlow * 14; // much stronger glow at night

    for (let k = 0; k < petals; k++) {
      const a = (k / petals) * Math.PI * 2;
      const ex = px + Math.cos(a) * petalR;
      const ey = py + Math.sin(a) * petalR;
      ctx.beginPath();
      ctx.ellipse(ex, ey, petalR * 0.55, petalR * 0.38, a, 0, Math.PI * 2);
      ctx.fillStyle = color + Math.round((0.55 + open * 0.35) * 255).toString(16).padStart(2,'0');
      ctx.fill();
    }
    // Center dot
    ctx.beginPath();
    ctx.arc(px, py, petalR * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,230,${0.6 + open * 0.35})`;
    ctx.fill();
    ctx.restore();
  }
}

// ── Deep background fish layers ──────────────────────────────────────
// Two additional parallax layers of distant schooling silhouettes add
// a strong sense of depth. Fish are simple velocity-boid dots — no complex draw.
function genDeepLayers(W, H) {
  const layers = [];
  const configs = [
    // Far: tiny, very faint, very slow — looks like they're 200m away
    { count: 55, sizeRange: [0.55, 1.1], speedRange: [0.06, 0.14], y: H * 0.18, spread: 120,
      alpha: 0.10, depthZ: 0.0 },
    // Mid-far: slightly larger, moderately faint
    { count: 38, sizeRange: [0.9, 1.6], speedRange: [0.10, 0.22], y: H * 0.38, spread: 90,
      alpha: 0.16, depthZ: 0.2 },
  ];
  configs.forEach(cfg => {
    const fish = Array.from({ length: cfg.count }, (_, i) => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      return {
        x: Math.random() * W,
        y: cfg.y + (Math.random() - 0.5) * cfg.spread,
        vx: dir * (cfg.speedRange[0] + Math.random() * (cfg.speedRange[1] - cfg.speedRange[0])),
        vy: (Math.random() - 0.5) * 0.04,
        size: cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]),
        phase: Math.random() * Math.PI * 2,
      };
    });
    layers.push({ fish, alpha: cfg.alpha, depthZ: cfg.depthZ });
  });
  return layers;
}

function updateDrawDeepLayers(ctx, layers, W, H, frame, daylight, px, py) {
  layers.forEach((layer, li) => {
    // Very slight parallax — further layers move less with mouse
    const lx = px * (0.12 + li * 0.06), ly = py * (0.06 + li * 0.03);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.globalAlpha = layer.alpha * (0.55 + daylight * 0.45); // dimmer at night
    ctx.globalCompositeOperation = 'source-over';

    // Compute school centroid for loose cohesion
    const cx = layer.fish.reduce((s, f) => s + f.x, 0) / layer.fish.length;
    const cy = layer.fish.reduce((s, f) => s + f.y, 0) / layer.fish.length;

    layer.fish.forEach(f => {
      // Cohesion + wander
      f.vx += (cx - f.x) * 0.00045 + Math.sin(frame * 0.008 + f.phase) * 0.002;
      f.vy += (cy - f.y) * 0.00055 + Math.cos(frame * 0.006 + f.phase * 1.4) * 0.0015;
      // Gentle edge bounce
      if (f.x < 20)    f.vx += 0.018;
      if (f.x > W - 20) f.vx -= 0.018;
      if (f.y < H * 0.05) f.vy += 0.01;
      if (f.y > H * 0.78) f.vy -= 0.01;
      // Cap speed
      const spd = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      if (spd > 0.28) { f.vx = f.vx / spd * 0.28; f.vy = f.vy / spd * 0.28; }
      f.x += f.vx; f.y += f.vy;
      f.x = (f.x + W) % W; // wrap horizontally

      // Draw as tiny tapered ellipse
      const dir = Math.atan2(f.vy, f.vx);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(dir);
      ctx.beginPath();
      ctx.ellipse(0, 0, f.size * 1.6, f.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(55,90,120,1)`; // deep blue-grey silhouette
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  });
}

function genBaitSchool(W, H) {
  const cx = W * 0.35, cy = H * 0.28;
  // Each fish also gets an orbit index for murmuration
  return Object.assign(
    Array.from({ length: 42 }, (_, i) => ({
      x:       cx + (Math.random() - 0.5) * 80,
      y:       cy + (Math.random() - 0.5) * 45,
      vx:      (Math.random() - 0.5) * 0.2,
      vy:      (Math.random() - 0.5) * 0.1,
      phase:   Math.random() * Math.PI * 2,
      size:    1.5 + Math.random() * 1.4,
      orbitIdx: i,  // position in murmuration ring
    })),
    {
      // School-level murmuration state
      _murTimer: 600 + Math.floor(Math.random() * 900), // frames until first murmuration
      _murActive: false,
      _murAngle: 0,   // current rotation angle of the vortex
      _murCX: cx, _murCY: cy,
      _murRadius: 55,
      _murDuration: 0,
    }
  );
}

function updateBaitSchool(school, W, H, frame) {
  // Murmuration state machine
  school._murTimer = Math.max(0, school._murTimer - 1);
  if (!school._murActive && school._murTimer === 0) {
    // Start murmuration — pick a center in the mid-water
    school._murCX = W * 0.18 + Math.random() * W * 0.64;
    school._murCY = H * 0.15 + Math.random() * H * 0.45;
    school._murRadius = 48 + Math.random() * 35;
    school._murAngle = 0;
    school._murDuration = 350 + Math.floor(Math.random() * 250); // ~5-10s
    school._murActive = true;
    school._murTimer = 0;
  }
  if (school._murActive) {
    school._murDuration--;
    school._murAngle += 0.016; // rotation speed
    if (school._murDuration <= 0) {
      school._murActive = false;
      school._murTimer = 800 + Math.floor(Math.random() * 1200); // gap until next
    }
  }

  const cx = school.reduce((s, b) => s + b.x, 0) / school.length;
  const cy = school.reduce((s, b) => s + b.y, 0) / school.length;
  const murBlend = school._murActive
    ? Math.min(1, (school._murDuration > 280 ? (350 - school._murDuration) / 70 : school._murDuration / 70))
    : 0;

  school.forEach(b => {
    if (school._murActive && murBlend > 0.01) {
      // Orbit target: fish orbit vortex center at their assigned radius with angular offset
      const layers = 3;
      const layer = Math.floor(b.orbitIdx / (school.length / layers));
      const layerR = school._murRadius * (0.6 + layer * 0.4);
      const layerSpeed = school._murAngle * (1 + layer * 0.3);
      const baseAngle = (b.orbitIdx / (school.length / layers)) * Math.PI * 2;
      const orbitX = school._murCX + Math.cos(baseAngle + layerSpeed) * layerR;
      const orbitY = school._murCY + Math.sin(baseAngle + layerSpeed) * layerR * 0.55; // flatten to ellipse
      // Blend orbit target with centroid cohesion
      const targetX = orbitX * murBlend + cx * (1 - murBlend);
      const targetY = orbitY * murBlend + cy * (1 - murBlend);
      b.vx += (targetX - b.x) * 0.028 * murBlend;
      b.vy += (targetY - b.y) * 0.028 * murBlend;
    } else {
      // Normal schooling
      b.vx += (cx - b.x) * 0.0006;
      b.vy += (cy - b.y) * 0.0006;
      b.vx += Math.sin(frame * 0.012 + b.phase) * 0.004;
      b.vy += Math.cos(frame * 0.009 + b.phase * 1.3) * 0.003;
    }

    // Edge avoidance
    if (b.x < 40)       b.vx += 0.012;
    if (b.x > W - 40)   b.vx -= 0.012;
    if (b.y < 25)       b.vy += 0.012;
    if (b.y > H * 0.75) b.vy -= 0.012;

    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const maxSpd = school._murActive ? 1.1 : 0.65;
    if (spd > maxSpd) { b.vx = b.vx / spd * maxSpd; b.vy = b.vy / spd * maxSpd; }
    b.x += b.vx; b.y += b.vy;
  });
}

function drawBaitSchool(ctx, school, frame) {
  school.forEach(b => {
    const dir   = Math.atan2(b.vy, b.vx);
    const alpha = 0.12 + Math.sin(frame * 0.022 + b.phase) * 0.05;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(dir);
    // Tiny fish silhouette
    ctx.beginPath();
    ctx.ellipse(0, 0, b.size * 1.8, b.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100,180,220,${alpha})`;
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-b.size * 1.8, 0);
    ctx.lineTo(-b.size * 2.8, -b.size * 0.7);
    ctx.lineTo(-b.size * 2.8,  b.size * 0.7);
    ctx.closePath();
    ctx.fillStyle = `rgba(80,160,200,${alpha * 0.7})`;
    ctx.fill();
    ctx.restore();
  });
}

function drawBubbles(ctx, bubbles, frame, H) {
  bubbles.forEach(b => {
    b.y -= b.speed;
    b.x += b.drift + Math.sin(frame * 0.038 + b.phase) * 0.22;
    if (b.y < 0) { b.y = H * 0.84; b.x = Math.random() * (ctx.canvas.width / (window.devicePixelRatio || 1)); }
    const fadeIn = Math.min(1, (H * 0.84 - b.y) / (H * 0.45));
    const alpha  = fadeIn * 0.28;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120,190,255,${alpha})`; ctx.lineWidth = 0.55; ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(210,235,255,${alpha * 0.75})`; ctx.fill();
  });
}

function drawEntityTrails(ctx, fish, jellies, stingrays, seahorses, turtles, daylight = 1, flashMult = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Night boost: trails become 3× brighter in the dark; flashMult amplifies during bio-flash
  const nightBoost = (1 + (1 - daylight) * 2.8) * flashMult;

  const groups = [
    { arr: fish,       sizeScale: 0.28 },
    { arr: jellies,    sizeScale: 0.32 },
    { arr: stingrays,  sizeScale: 0.30 },
    { arr: turtles,    sizeScale: 0.26 },
  ];
  groups.forEach(({ arr, sizeScale }) => {
    arr.forEach(e => {
      if (!e.trail || e.trail.length < 2) return;
      const color = tColor(e.type);
      const len   = e.trail.length;
      const isGlowing = e._panic > 0; // panicked fish trail brighter
      for (let i = 0; i < len; i++) {
        const t     = (i + 1) / len;
        const alpha = Math.min(t * t * 0.20 * nightBoost * (isGlowing ? 1.8 : 1.0), 0.82);
        const r     = (e.size || 8) * sizeScale * t * (isGlowing ? 1.3 : 1.0);
        ctx.beginPath();
        ctx.arc(e.trail[i].x, e.trail[i].y, Math.max(0.4, r), 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      // Extra outer halo at night for large/key entities (stingrays, turtles)
      if (daylight < 0.55 && (e.type === 'stingray' || e.type === 'turtle') && e.trail.length > 3) {
        const tip = e.trail[e.trail.length - 1];
        const haloR = (e.size || 20) * 0.55 * (1 - daylight);
        const haloAlpha = (1 - daylight) * 0.12;
        ctx.beginPath(); ctx.arc(tip.x, tip.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = tColor(e.type) + Math.round(haloAlpha * 255).toString(16).padStart(2,'0');
        ctx.fill();
      }
    });
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawFloorShadow(ctx, entity, floorY) {
  // Cast a soft shadow ellipse on the floor, proportional to distance
  const dist   = floorY - entity.y;
  if (dist > floorY * 0.55 || dist < 0) return;
  const spread  = Math.max(0.1, 1 - dist / (floorY * 0.55));
  const shadowW = entity.size * 1.8 * (0.4 + spread * 0.6);
  const shadowH = entity.size * 0.35 * spread;
  const alpha   = spread * 0.20;
  ctx.save();
  ctx.translate(entity.x + dist * 0.04, floorY - 4);
  ctx.beginPath();
  ctx.ellipse(0, 0, shadowW, Math.max(2, shadowH), 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,5,15,${alpha})`;
  ctx.fill();
  ctx.restore();
}

function drawFish(ctx, f, isSelected, isHovered, illum = 0) {
  const { x, y, dir, wiggle, size } = f;
  const color  = tColor(f.type);
  const tw     = Math.sin(wiggle) * size * 0.30;
  // Organic body bob — slight vertical oscillation as fish swims
  const bob    = Math.sin(wiggle * 0.48) * size * 0.055;
  const isUser = f.type === 'user';

  const isTropical  = f.type === 'tropical-fish';
  const isEventFish = f.type === 'event-fish';
  // Tropical fish: disc-shaped (taller). Event fish: round goldfish body
  const bodyH = isTropical ? size * 0.68 : isEventFish ? size * 0.58 : size * 0.42;
  const bodyW = isTropical ? size * 0.88 : isEventFish ? size * 0.90 : size;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(dir);

  ctx.shadowColor = color;
  ctx.shadowBlur  = isSelected ? 32 : isUser ? 22 : isHovered ? 18 : 8;

  // Tail
  if (isEventFish) {
    // Goldfish flowing double-split tail
    const fanSpread = size * 0.72 + Math.abs(tw) * 0.6;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.65, tw * 0.3);
      ctx.bezierCurveTo(
        -size * 1.1, tw * 0.3 + side * fanSpread * 0.4,
        -size * 1.4, tw * 0.4 + side * fanSpread * 0.75,
        -size * 1.55, side * fanSpread + tw * 0.5
      );
      ctx.bezierCurveTo(-size * 1.25, side * fanSpread * 0.6 + tw * 0.4, -bodyW * 0.78, tw * 0.55, -bodyW * 0.65, tw * 0.3);
      ctx.closePath();
      ctx.fillStyle = color + '88'; ctx.fill();
    }
  } else {
    // Regular fork tail
    const tailBack = isTropical ? size * 0.60 : size * 0.70;
    const tailFan  = isTropical ? size * 0.55 : size * 0.44;
    ctx.beginPath();
    ctx.moveTo(-tailBack, tw * 0.4);
    ctx.lineTo(-size * 1.45, -tailFan + tw);
    ctx.lineTo(-size * 0.85, tw * 0.65);
    ctx.closePath();
    ctx.fillStyle = color + 'AA'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-tailBack, tw * 0.4);
    ctx.lineTo(-size * 1.45,  tailFan + tw);
    ctx.lineTo(-size * 0.85, tw * 0.65);
    ctx.closePath();
    ctx.fill();
  }

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.shadowBlur = 0;

  // Belly sheen
  const belly = ctx.createLinearGradient(0, -bodyH, 0, bodyH);
  belly.addColorStop(0,   'rgba(255,255,255,0.30)');
  belly.addColorStop(0.35,'rgba(255,255,255,0.07)');
  belly.addColorStop(1,   'rgba(0,0,0,0.14)');
  ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = belly; ctx.fill();

  // Specular highlight — top-lit oval glint, makes body look 3D
  const spec = ctx.createRadialGradient(
    bodyW * 0.12, -bodyH * 0.52, 0,
    bodyW * 0.06, -bodyH * 0.18, bodyW * 0.72
  );
  // illum: brightens specular when fish is inside a god ray shaft
  const specBase = 0.46 + illum * 0.38;
  spec.addColorStop(0,    `rgba(255,255,255,${specBase})`);
  spec.addColorStop(0.30, `rgba(255,255,255,${0.10 + illum * 0.12})`);
  spec.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = spec; ctx.fill();

  // Rim light — thin bright edge on the underside (ambient bounce from floor)
  const rim = ctx.createLinearGradient(0, bodyH * 0.25, 0, bodyH);
  rim.addColorStop(0,   'rgba(255,255,255,0)');
  rim.addColorStop(0.65,'rgba(255,255,255,0)');
  rim.addColorStop(1,   'rgba(255,255,255,0.16)');
  ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = rim; ctx.fill();

  // Iridescence — scale shimmer: hue rotates with swim direction + time
  // Creates the oil-slick rainbow effect of real fish scales catching light
  if (!isUser) {
    const iriHue = ((dir * 180 / Math.PI) * 2.5 + wiggle * 28) % 360;
    const iri = ctx.createLinearGradient(-bodyW * 0.7, -bodyH, bodyW * 0.7, bodyH);
    iri.addColorStop(0,    `hsla(${(iriHue)       % 360},88%,72%,0.11)`);
    iri.addColorStop(0.25, `hsla(${(iriHue + 72)  % 360},88%,72%,0.06)`);
    iri.addColorStop(0.5,  `hsla(${(iriHue + 144) % 360},88%,72%,0.04)`);
    iri.addColorStop(0.75, `hsla(${(iriHue + 216) % 360},88%,72%,0.06)`);
    iri.addColorStop(1,    `hsla(${(iriHue + 288) % 360},88%,72%,0.11)`);
    ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fillStyle = iri; ctx.fill();
  }

  // Tropical fish: vertical white stripe bands
  if (isTropical) {
    ctx.save();
    ctx.clip(); // clip stripes to body ellipse
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(-bodyW * 0.12, 0, bodyW * 0.07, bodyH * 0.88, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( bodyW * 0.20, 0, bodyW * 0.07, bodyH * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( bodyW * 0.52, 0, bodyW * 0.06, bodyH * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Dorsal fin — taller on tropical fish
  const dorsalH = isTropical ? bodyH * 1.35 : bodyH * 1.85;
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.22, -bodyH * 0.92);
  ctx.quadraticCurveTo(bodyW * 0.08, -dorsalH, bodyW * 0.42, -bodyH * 0.92);
  ctx.closePath();
  ctx.fillStyle = color + '88'; ctx.fill();

  // Pectoral fin
  ctx.beginPath();
  ctx.ellipse(-bodyW * 0.08, bodyH * 0.42, bodyW * 0.22, bodyH * 0.18, -0.28, 0, Math.PI * 2);
  ctx.fillStyle = color + '55'; ctx.fill();

  // Panic flush — reddish-white overlay when fleeing a predator
  if (f._panic > 0) {
    const panicT = Math.min(1, f._panic / 20);
    ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,180,${panicT * 0.30})`; ctx.fill();
    // Panic speed lines — short streaks behind the body
    const streaks = 4;
    for (let s = 0; s < streaks; s++) {
      const sa   = Math.PI + (s / streaks - 0.5) * 0.7;
      const sLen = bodyW * (0.4 + panicT * 0.5);
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * bodyW * 0.7, Math.sin(sa) * bodyH * 0.7);
      ctx.lineTo(Math.cos(sa) * (bodyW * 0.7 + sLen), Math.sin(sa) * (bodyH * 0.7 + sLen * 0.3));
      ctx.strokeStyle = `rgba(255,255,255,${panicT * 0.22})`; ctx.lineWidth = 0.6; ctx.stroke();
    }
  }

  // Eye
  const eyeX = bodyW * 0.52;
  ctx.beginPath();
  ctx.arc(eyeX, -bodyH * 0.15, size * 0.115, 0, Math.PI * 2);
  ctx.fillStyle = isUser ? '#001A2A' : '#0A0A1A'; ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX + size * 0.02, -bodyH * 0.18, size * 0.048, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();

  if (isUser) {
    // Aura rings — 3 pulsing layers
    const t = Date.now() * 0.001;
    for (let ring = 0; ring < 3; ring++) {
      const ringPulse = Math.sin(t * 0.9 + ring * 0.9) * 0.5 + 0.5;
      const ringR = size * (1.35 + ring * 0.42 + ringPulse * 0.12);
      const ringA = (0.28 - ring * 0.08) * (0.65 + ringPulse * 0.35);
      ctx.beginPath(); ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = color + Math.round(ringA * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.2 - ring * 0.3;
      ctx.stroke();
    }
    // Central glow overlay
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.0);
    glow.addColorStop(0,   color + '22');
    glow.addColorStop(0.5, color + '0C');
    glow.addColorStop(1,   color + '00');
    ctx.beginPath(); ctx.arc(0, 0, size * 2.0, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
  }

  ctx.restore();
}

function drawStingray(ctx, r, frame, isSelected, isHovered) {
  const { x, y, dir, size, phase } = r;
  const color = tColor('stingray');
  const flap  = Math.sin(frame * 0.06 + phase) * size * 0.22;
  const bank  = r.bankAngle || 0;

  // Hunt-mode: pulsing red threat aura when actively chasing prey
  if (r._hunting) {
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.22);
    const auraR = size * 2.2 + pulse * size * 0.5;
    const ag = ctx.createRadialGradient(x, y, size * 0.3, x, y, auraR);
    ag.addColorStop(0, `rgba(255,30,60,${0.14 + pulse * 0.10})`);
    ag.addColorStop(1, 'rgba(255,30,60,0)');
    ctx.beginPath(); ctx.arc(x, y, auraR, 0, Math.PI * 2);
    ctx.fillStyle = ag; ctx.fill();
  }
  // Strike flash — brief white burst when the stingray connects
  if (r._strikeFlash > 0) {
    const sf = r._strikeFlash / 8;
    ctx.beginPath(); ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,200,${sf * 0.45})`; ctx.fill();
  }

  // Draw motion trail before translating to stingray frame
  if (r.trail && r.trail.length > 1) {
    ctx.save();
    for (let ti = 1; ti < r.trail.length; ti++) {
      const tAlpha = (ti / r.trail.length) * 0.18;
      const tR = size * 0.22 * (ti / r.trail.length);
      ctx.beginPath();
      ctx.arc(r.trail[ti].x, r.trail[ti].y, tR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,40,70,${tAlpha})`;
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  // Banking perspective squish: tilt = scale Y by cos(bank), shift top of wings
  if (Math.abs(bank) > 0.01) {
    ctx.transform(1, 0, 0, Math.cos(Math.abs(bank)) * 0.88 + 0.12, 0, 0);
  }

  ctx.shadowColor = color;
  ctx.shadowBlur  = isSelected ? 30 : isHovered ? 20 : 10;

  // Wing body — kite/diamond shape with flapping
  const bw = size * 1.6;
  const bh = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(size * 0.7, 0);                               // nose
  ctx.bezierCurveTo(size * 0.3, -bw * 0.6 - flap, -size * 0.6, -bw * 0.9 - flap * 0.8, -size * 0.85, 0);
  ctx.bezierCurveTo(-size * 0.6,  bw * 0.9 + flap * 0.8,  size * 0.3,  bw * 0.6 + flap, size * 0.7, 0);
  ctx.closePath();

  const rg = ctx.createRadialGradient(-size * 0.1, 0, 0, -size * 0.1, 0, size * 1.2);
  rg.addColorStop(0, '#E83060');
  rg.addColorStop(0.5, color);
  rg.addColorStop(1, '#6A0020');
  ctx.fillStyle = rg; ctx.fill();

  // Belly lighter underside stripe
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.55, bh * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,80,100,0.25)'; ctx.fill();

  // Specular highlight — top-lit oval glint gives the disc real volume
  const srSpec = ctx.createRadialGradient(size * 0.05, -size * 0.18, 0, 0, -size * 0.05, size * 1.1);
  srSpec.addColorStop(0,    'rgba(255,200,210,0.38)');
  srSpec.addColorStop(0.35, 'rgba(255,180,200,0.10)');
  srSpec.addColorStop(1,    'rgba(255,180,200,0)');
  ctx.beginPath();
  ctx.moveTo(size * 0.7, 0);
  ctx.bezierCurveTo(size * 0.3, -bw * 0.6 - flap, -size * 0.6, -bw * 0.9 - flap * 0.8, -size * 0.85, 0);
  ctx.bezierCurveTo(-size * 0.6, bw * 0.9 + flap * 0.8, size * 0.3, bw * 0.6 + flap, size * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = srSpec; ctx.fill();

  // Rim light — faint bright edge on trailing wing tips
  const srRim = ctx.createLinearGradient(-size * 0.85, 0, size * 0.5, 0);
  srRim.addColorStop(0,   'rgba(255,120,160,0.22)');
  srRim.addColorStop(0.4, 'rgba(255,120,160,0)');
  srRim.addColorStop(1,   'rgba(255,120,160,0)');
  ctx.beginPath();
  ctx.moveTo(size * 0.7, 0);
  ctx.bezierCurveTo(size * 0.3, -bw * 0.6 - flap, -size * 0.6, -bw * 0.9 - flap * 0.8, -size * 0.85, 0);
  ctx.bezierCurveTo(-size * 0.6, bw * 0.9 + flap * 0.8, size * 0.3, bw * 0.6 + flap, size * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = srRim; ctx.fill();

  ctx.shadowBlur = 0;

  // Spot pattern on dorsal surface
  const spotPositions = [
    [0, -size * 0.1], [-size * 0.35, -size * 0.05], [size * 0.25, -size * 0.05],
    [-size * 0.15,  size * 0.06], [size * 0.12, size * 0.07],
  ];
  spotPositions.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.ellipse(sx, sy, size * 0.065, size * 0.055, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,0,10,0.35)'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx - size * 0.01, sy - size * 0.01, size * 0.025, size * 0.020, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,60,90,0.3)'; ctx.fill();
  });

  // Long whip tail
  const tailLen = size * 3.2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, 0);
  ctx.bezierCurveTo(
    -size * 1.4, size * 0.3,
    -size * 2.2, Math.sin(frame * 0.06 + phase) * size * 0.55,
    -size * 0.85 - tailLen, Math.sin(frame * 0.06 + phase) * size * 0.4
  );
  ctx.strokeStyle = color + 'BB'; ctx.lineWidth = size * 0.055; ctx.stroke();

  // Eye dots
  ctx.fillStyle = '#1A0006';
  ctx.beginPath(); ctx.arc(size * 0.38, -size * 0.12, size * 0.065, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(size * 0.38,  size * 0.12, size * 0.065, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,200,0.6)';
  ctx.beginPath(); ctx.arc(size * 0.40, -size * 0.13, size * 0.025, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(size * 0.40,  size * 0.11, size * 0.025, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawSeahorse(ctx, s, frame, isSelected, isHovered) {
  const { x, y, size, phase } = s;
  const color = tColor('seahorse');
  const t = Date.now() / 1000;

  ctx.save();
  ctx.translate(x, y);
  // No rotation — seahorse always upright

  ctx.shadowColor = color;
  ctx.shadowBlur  = isSelected ? 28 : isHovered ? 16 : 7;

  const sc = size / 14;

  // Curved body as thick bezier stroke
  ctx.lineWidth = sc * 6;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -sc * 10);                                  // neck
  ctx.bezierCurveTo(sc * 8, -sc * 4, sc * 8, sc * 6, sc * 2, sc * 12);   // belly curve
  ctx.bezierCurveTo(-sc * 4, sc * 16, -sc * 8, sc * 14, -sc * 6, sc * 10); // coiled tail tip
  ctx.stroke();

  // Darker back edge
  ctx.lineWidth = sc * 2.5;
  ctx.strokeStyle = color + '66';
  ctx.beginPath();
  ctx.moveTo(sc * 1.5, -sc * 10);
  ctx.bezierCurveTo(sc * 9, -sc * 4, sc * 9, sc * 6, sc * 3, sc * 12);
  ctx.stroke();

  // Specular highlight stroke along lit side of body
  ctx.lineWidth = sc * 1.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-sc * 1, -sc * 9);
  ctx.bezierCurveTo(sc * 5, -sc * 4, sc * 5, sc * 4, sc * 1, sc * 10);
  ctx.stroke();

  // Bony segment rings
  ctx.strokeStyle = color + '99';
  ctx.lineWidth = sc * 1.2;
  for (let seg = 0; seg < 5; seg++) {
    const ty = -sc * 6 + seg * sc * 4;
    const tx = Math.sin(seg * 0.7) * sc * 3;
    ctx.beginPath();
    ctx.moveTo(tx - sc * 3.5, ty);
    ctx.lineTo(tx + sc * 3.5, ty);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // Head
  ctx.beginPath();
  ctx.arc(0, -sc * 12, sc * 4, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();

  // Snout
  ctx.beginPath();
  ctx.moveTo(sc * 2, -sc * 12.5);
  ctx.lineTo(sc * 8, -sc * 13.5);
  ctx.strokeStyle = color; ctx.lineWidth = sc * 2.5; ctx.stroke();

  // Dorsal fin — flutter
  const flutter = Math.sin(t * 8 + phase) * sc * 1.5;
  ctx.beginPath();
  ctx.moveTo(-sc * 1, -sc * 9);
  ctx.bezierCurveTo(-sc * 5 + flutter, -sc * 6, -sc * 5 - flutter, -sc * 2, -sc * 1, sc * 0);
  ctx.strokeStyle = color + '77'; ctx.lineWidth = sc * 1.2; ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(sc * 1.2, -sc * 13.2, sc * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#051410'; ctx.fill();
  ctx.beginPath();
  ctx.arc(sc * 1.5, -sc * 13.5, sc * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();

  ctx.restore();
}

function drawCrab(ctx, c, frame, isSelected, isHovered) {
  const { x, y, size, phase, vx, pauseFor } = c;
  const color = tColor('crab');
  const walk  = pauseFor > 0 ? 0 : Math.sin(frame * 0.18 + phase) * 0.4;
  const facing = vx >= 0 ? 1 : -1;

  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = color;
  ctx.shadowBlur  = isSelected ? 22 : isHovered ? 14 : 5;

  const sc = size / 12;

  // 4 legs per side
  for (let side = -1; side <= 1; side += 2) {
    for (let leg = 0; leg < 4; leg++) {
      const legPhase = walk * (leg % 2 === 0 ? 1 : -1);
      const lx = side * sc * (3 + leg * 2.5);
      const baseAngle = side * (Math.PI * 0.35 + leg * 0.2) + legPhase;
      ctx.beginPath();
      ctx.moveTo(side * sc * 2.5, sc * (leg - 1.5) * 1.5);
      ctx.lineTo(
        side * sc * 2.5 + Math.cos(baseAngle) * sc * 7,
        sc * (leg - 1.5) * 1.5 + Math.sin(Math.abs(baseAngle)) * sc * 5
      );
      ctx.strokeStyle = color + 'CC'; ctx.lineWidth = sc * 1.1; ctx.stroke();
    }
  }

  // Claws
  const clawOpen = Math.sin(frame * 0.12 + phase) * 0.18 + 0.22;
  for (let side = -1; side <= 1; side += 2) {
    const cx2 = side * sc * 9;
    const cy2 = -sc * 5;
    ctx.beginPath(); ctx.arc(cx2, cy2, sc * 3.2, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    // Pincer gap
    ctx.beginPath();
    ctx.moveTo(cx2 + side * sc * 2.5, cy2);
    ctx.arc(cx2, cy2, sc * 2.8, side > 0 ? -clawOpen : Math.PI - clawOpen, side > 0 ? clawOpen : Math.PI + clawOpen);
    ctx.strokeStyle = '#070400'; ctx.lineWidth = sc * 1.5; ctx.stroke();
  }

  // Shell body — directional gradient for depth
  ctx.beginPath();
  ctx.ellipse(0, 0, sc * 8.5, sc * 5.5, 0, 0, Math.PI * 2);
  const cg = ctx.createRadialGradient(-sc * 2, -sc * 2, 0, 0, 0, sc * 9);
  cg.addColorStop(0,   '#CC8844');
  cg.addColorStop(0.5, color);
  cg.addColorStop(1,   '#4A2208');
  ctx.fillStyle = cg; ctx.fill();
  ctx.shadowBlur = 0;

  // Carapace dome specular — top-lit glint
  const cSpec = ctx.createRadialGradient(-sc * 2.5, -sc * 2.5, 0, -sc * 1, -sc * 1, sc * 7);
  cSpec.addColorStop(0,    'rgba(255,220,160,0.40)');
  cSpec.addColorStop(0.35, 'rgba(255,200,120,0.10)');
  cSpec.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.ellipse(0, 0, sc * 8.5, sc * 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = cSpec; ctx.fill();

  // Shell ridges
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, sc * 8.5 * (r / 3.5), sc * 5.5 * (r / 3.5), 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#7A5020'; ctx.lineWidth = 0.6; ctx.stroke();
  }

  // Eye stalks
  for (let side = -1; side <= 1; side += 2) {
    const ex = side * sc * 5;
    ctx.beginPath();
    ctx.moveTo(ex, -sc * 4.5);
    ctx.lineTo(ex + side * sc * 1.5, -sc * 8);
    ctx.strokeStyle = color; ctx.lineWidth = sc * 1.2; ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex + side * sc * 1.5, -sc * 8.5, sc * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0500'; ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + side * sc * 1.8, -sc * 9, sc * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,150,0.6)'; ctx.fill();
  }

  ctx.restore();
}

function drawTurtle(ctx, t, frame, isSelected, isHovered) {
  const { x, y, dir, size, phase } = t;
  const color = tColor('turtle');

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);

  ctx.shadowColor = color;
  ctx.shadowBlur  = isSelected ? 28 : isHovered ? 16 : 8;

  const sc = size / 18;

  // Alternating butterfly stroke — left/right front flippers offset by π so they alternate
  for (let side = -1; side <= 1; side += 2) {
    const phOff = side > 0 ? 0 : Math.PI;  // opposite phase = alternating stroke
    const fa    = Math.sin(frame * 0.038 + phase + phOff) * 0.38;
    ctx.save();
    ctx.rotate(side * fa);
    ctx.beginPath();
    ctx.ellipse(side * sc * 11, -sc * 4, sc * 9, sc * 3.5, side * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color + 'CC'; ctx.fill();
    ctx.restore();
  }

  // Rear flippers — smaller, lag 90° behind
  for (let side = -1; side <= 1; side += 2) {
    const phOff = side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    const fa    = Math.sin(frame * 0.038 + phase + phOff) * 0.22;
    ctx.save();
    ctx.rotate(-side * fa);
    ctx.beginPath();
    ctx.ellipse(side * sc * 9, sc * 8, sc * 6, sc * 2.5, side * (-0.6), 0, Math.PI * 2);
    ctx.fillStyle = color + 'AA'; ctx.fill();
    ctx.restore();
  }

  // Shell
  ctx.beginPath();
  ctx.ellipse(0, 0, sc * 13, sc * 10, 0, 0, Math.PI * 2);
  const sg = ctx.createRadialGradient(-sc * 2, -sc * 3, sc * 0.5, 0, 0, sc * 13);
  sg.addColorStop(0,   '#4EC87A');
  sg.addColorStop(0.45, color);
  sg.addColorStop(1,   '#0C2018');
  ctx.fillStyle = sg; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#1A5530'; ctx.lineWidth = 0.8; ctx.stroke();

  // Dome specular — makes the shell look convex and 3D
  const tSpec = ctx.createRadialGradient(-sc * 3, -sc * 4, 0, -sc * 1, -sc * 2, sc * 10);
  tSpec.addColorStop(0,    'rgba(180,255,210,0.36)');
  tSpec.addColorStop(0.30, 'rgba(100,200,140,0.10)');
  tSpec.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.ellipse(0, 0, sc * 13, sc * 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = tSpec; ctx.fill();

  // Rim light on shell edge
  const tRim = ctx.createRadialGradient(sc * 5, sc * 6, sc * 8, sc * 2, sc * 3, sc * 14);
  tRim.addColorStop(0,   'rgba(80,200,120,0)');
  tRim.addColorStop(0.7, 'rgba(80,200,120,0)');
  tRim.addColorStop(1,   'rgba(80,220,140,0.20)');
  ctx.beginPath();
  ctx.ellipse(0, 0, sc * 13, sc * 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = tRim; ctx.fill();

  // Scute patches on shell
  const scutes = [
    [0, 0, sc * 5, sc * 4],
    [-sc * 5.5, -sc * 4, sc * 3.5, sc * 2.8],
    [ sc * 5.5, -sc * 4, sc * 3.5, sc * 2.8],
    [-sc * 5.5,  sc * 4, sc * 3.5, sc * 2.8],
    [ sc * 5.5,  sc * 4, sc * 3.5, sc * 2.8],
  ];
  scutes.forEach(([sx, sy, srx, sry]) => {
    ctx.beginPath();
    ctx.ellipse(sx, sy, srx, sry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#1A5530'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = 'rgba(20,60,30,0.25)'; ctx.fill();
  });

  // Head
  ctx.beginPath();
  ctx.arc(sc * 14, 0, sc * 5, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = '#1A5530'; ctx.lineWidth = 0.6; ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(sc * 16.5, -sc * 1.5, sc * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0A1A0A'; ctx.fill();
  ctx.beginPath();
  ctx.arc(sc * 17, -sc * 2, sc * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();

  ctx.restore();
}

function drawJellyfish(ctx, j, frame, isSelected, isHovered) {
  const { x, y, size, phase } = j;
  const color = tColor('jellyfish');
  const pulse = Math.sin(frame * 0.036 + phase) * 0.5 + 0.5;
  const bellW = size * (0.92 + pulse * 0.14);
  const bellH = size * (0.60 - pulse * 0.16);

  ctx.save();
  ctx.translate(x, y);

  const glowR = bellW * 2.6;
  const gl = ctx.createRadialGradient(0, 0, bellW * 0.3, 0, 0, glowR);
  gl.addColorStop(0, color + (isSelected ? '55' : '22'));
  gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fillStyle = gl; ctx.fill();

  // Physics-based verlet tentacles
  if (j.tentacles && j.tentacles.length > 0) {
    j.tentacles.forEach((chain, ti) => {
      if (chain.length < 2) return;
      const alpha = (0.22 + pulse * 0.12) * (ti % 2 === 0 ? 1.0 : 0.6);
      const w     = 0.5 + pulse * 0.35 + (ti % 3 === 0 ? 0.2 : 0);
      ctx.beginPath();
      // Draw in world coords (undo the ctx.translate(x,y) done above)
      ctx.moveTo(chain[0].x - x, chain[0].y - y);
      for (let n = 1; n < chain.length; n++) {
        ctx.lineTo(chain[n].x - x, chain[n].y - y);
      }
      ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2,'0');
      ctx.lineWidth   = w;
      ctx.lineCap     = 'round';
      ctx.stroke();
      // Glowing tip bead on alternate tentacles
      if (ti % 2 === 0) {
        const tip = chain[chain.length - 1];
        ctx.beginPath();
        ctx.arc(tip.x - x, tip.y - y, 1.2 + pulse * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(280,85%,80%,${0.35 + pulse * 0.25})`;
        ctx.fill();
      }
    });
  }

  for (let t = 0; t < 6; t++) {
    const tx = ((t / 5) - 0.5) * bellW * 1.05;
    ctx.beginPath();
    ctx.moveTo(tx, -bellH * 0.05);
    ctx.lineTo(tx + Math.sin(frame * 0.028 + t) * 3.5, bellH * 0.55);
    ctx.strokeStyle = color + '28'; ctx.lineWidth = 0.65; ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-bellW, 0);
  ctx.bezierCurveTo(-bellW, -bellH * 1.45, bellW, -bellH * 1.45, bellW, 0);
  ctx.bezierCurveTo( bellW * 0.68, bellH * 0.42, -bellW * 0.68, bellH * 0.42, -bellW, 0);
  ctx.closePath();
  const bg = ctx.createRadialGradient(0, -bellH * 0.42, 0, 0, -bellH * 0.25, bellW * 1.15);
  bg.addColorStop(0, color + 'DD');
  bg.addColorStop(0.5, color + '66');
  bg.addColorStop(1,   color + '1A');
  ctx.fillStyle = bg; ctx.fill();
  ctx.shadowColor = color; ctx.shadowBlur = isSelected ? 28 : 14;
  ctx.strokeStyle = color + 'AA'; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.shadowBlur = 0;

  // Radial ribs inside the bell
  ctx.save();
  ctx.globalAlpha = 0.18 + pulse * 0.10;
  for (let rib = 0; rib < 8; rib++) {
    const ra = (rib / 8) * Math.PI * 2;
    const rLen = bellH * 0.55;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ra) * bellW * 0.08, Math.sin(ra) * rLen * 0.08 - bellH * 0.25);
    ctx.lineTo(Math.cos(ra) * bellW * 0.68, Math.sin(ra) * rLen * 0.38 - bellH * 0.05);
    ctx.strokeStyle = color + 'CC'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  ctx.restore();

  // Manubrium — hanging central oral arm cluster
  const mLen = bellH * (0.65 + pulse * 0.20);
  ctx.save();
  ctx.globalAlpha = 0.45 + pulse * 0.20;
  for (let arm = 0; arm < 4; arm++) {
    const aOff = (arm / 4) * Math.PI * 2 + pulse * 0.4;
    const mx1  = Math.cos(aOff) * bellW * 0.10;
    const mx2  = Math.cos(aOff + Math.sin(frame * 0.025 + arm) * 0.5) * bellW * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, bellH * 0.12);
    ctx.bezierCurveTo(mx1, bellH * 0.35, mx2, bellH * 0.70, mx2 * 0.7, mLen);
    ctx.strokeStyle = `hsla(${280 + arm * 15},70%,75%,0.7)`;
    ctx.lineWidth = 0.8 + pulse * 0.35;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();

  // Cap specular — strong top-lit dome glint makes bell look 3D
  const jSpec = ctx.createRadialGradient(-bellW * 0.18, -bellH * 0.75, 0, 0, -bellH * 0.45, bellW * 0.9);
  jSpec.addColorStop(0,    `rgba(255,255,255,${0.55 + pulse * 0.20})`);
  jSpec.addColorStop(0.28, `rgba(255,255,255,${0.12 + pulse * 0.08})`);
  jSpec.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.moveTo(-bellW, 0);
  ctx.bezierCurveTo(-bellW, -bellH * 1.45, bellW, -bellH * 1.45, bellW, 0);
  ctx.bezierCurveTo( bellW * 0.68, bellH * 0.42, -bellW * 0.68, bellH * 0.42, -bellW, 0);
  ctx.closePath();
  ctx.fillStyle = jSpec; ctx.fill();

  // Rim light on the bell underside (bioluminescent bounce)
  const jRim = ctx.createLinearGradient(0, -bellH * 0.1, 0, bellH * 0.45);
  jRim.addColorStop(0,   'rgba(255,255,255,0)');
  jRim.addColorStop(0.6, 'rgba(255,255,255,0)');
  jRim.addColorStop(1,   `rgba(220,180,255,${0.18 + pulse * 0.12})`);
  ctx.beginPath();
  ctx.moveTo(-bellW, 0);
  ctx.bezierCurveTo(-bellW, -bellH * 1.45, bellW, -bellH * 1.45, bellW, 0);
  ctx.bezierCurveTo( bellW * 0.68, bellH * 0.42, -bellW * 0.68, bellH * 0.42, -bellW, 0);
  ctx.closePath();
  ctx.fillStyle = jRim; ctx.fill();

  ctx.restore();
}

function drawClickParticles(ctx, particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.06;   // slight gravity
    p.vx   *= 0.96;
    p.life -= 1;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    const alpha = (p.life / p.maxLife) * 0.9;
    const r     = p.r * (p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2,'0');
    ctx.fill();
  }
}

// ── Ink clouds ────────────────────────────────────────────────────────
function spawnInkBurst(inkClouds, x, y) {
  // 18 particles in a radial burst — dark, murky, expanding blobs
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 1.8;
    inkClouds.push({
      x, y,
      vx:      Math.cos(angle) * speed,
      vy:      Math.sin(angle) * speed - 0.3,
      r:       4 + Math.random() * 8,
      maxR:    18 + Math.random() * 22,
      life:    1.0,
      decay:   0.008 + Math.random() * 0.006,
      hue:     210 + Math.random() * 40, // deep blue-black
    });
  }
}

function updateDrawInkClouds(ctx, inkClouds) {
  ctx.save();
  for (let i = inkClouds.length - 1; i >= 0; i--) {
    const c = inkClouds[i];
    c.x  += c.vx;
    c.y  += c.vy;
    c.vx *= 0.94;
    c.vy *= 0.94;
    c.r   = Math.min(c.r + 0.55, c.maxR); // blob expands
    c.life -= c.decay;
    if (c.life <= 0) { inkClouds.splice(i, 1); continue; }

    const alpha = c.life * 0.30;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0,   `hsla(${c.hue},30%,8%,${alpha})`);
    g.addColorStop(0.5, `hsla(${c.hue},35%,12%,${alpha * 0.65})`);
    g.addColorStop(1,   `hsla(${c.hue},40%,18%,0)`);
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
}

function drawLabel(ctx, entity, isSelected, isHovered, yOverride) {
  const alpha  = isSelected ? 1.0 : isHovered ? 0.92 : 0.52;
  const lx     = entity.x;
  // Offset label so it floats above the animal — scale by size
  const radius = (entity.size || 14) * (entity.type === 'stingray' ? 1.0 : entity.type === 'turtle' ? 0.9 : 0.7);
  const ly     = yOverride !== undefined ? yOverride : entity.y - radius - 10;
  const color  = tColor(entity.type);
  const lbl    = (entity.label || '').slice(0, 28);

  const fontSize = isHovered || isSelected ? 11 : 9.5;
  ctx.font = `${fontSize}px "DM Sans","Inter",system-ui,sans-serif`;
  const tw  = ctx.measureText(lbl).width;
  const pad = 8, ph = isHovered || isSelected ? 20 : 17;
  const rr2 = 6;
  const rx  = lx - tw / 2 - pad;
  const ry  = ly - ph;
  const rw  = tw + pad * 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Hover/select glow around the pill
  if (isHovered || isSelected) {
    ctx.shadowColor = color;
    ctx.shadowBlur  = isSelected ? 14 : 8;
  }

  // Pill background
  ctx.beginPath();
  ctx.moveTo(rx + rr2, ry);
  ctx.lineTo(rx + rw - rr2, ry);      ctx.arcTo(rx + rw, ry,      rx + rw, ry + rr2,      rr2);
  ctx.lineTo(rx + rw, ry + ph - rr2); ctx.arcTo(rx + rw, ry + ph, rx + rw - rr2, ry + ph, rr2);
  ctx.lineTo(rx + rr2, ry + ph);      ctx.arcTo(rx,      ry + ph, rx,      ry + ph - rr2, rr2);
  ctx.lineTo(rx, ry + rr2);           ctx.arcTo(rx,      ry,      rx + rr2, ry,            rr2);
  ctx.closePath();
  ctx.fillStyle = isSelected
    ? `rgba(0,20,45,0.94)`
    : isHovered
      ? `rgba(0,15,35,0.88)`
      : `rgba(0,10,25,0.72)`;
  ctx.fill();
  ctx.strokeStyle = isSelected ? color + 'AA' : color + (isHovered ? '66' : '30');
  ctx.lineWidth = isSelected ? 1.0 : 0.6;
  ctx.stroke();

  // Type color dot on the left of pill
  const dotR = 3.0;
  ctx.beginPath();
  ctx.arc(rx + 9, ry + ph / 2, dotR, 0, Math.PI * 2);
  ctx.fillStyle = color + (isSelected ? 'FF' : isHovered ? 'CC' : '88');
  ctx.fill();

  // Label text (shifted right to make room for dot)
  ctx.fillStyle = isSelected
    ? `rgba(220,245,255,1.0)`
    : isHovered
      ? `rgba(200,238,255,0.96)`
      : `rgba(160,210,240,0.88)`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(lbl, lx + 5, ry + ph / 2);
  ctx.textBaseline = 'alphabetic';

  // Status chip below label
  if (entity.statusLabel && (isHovered || isSelected)) {
    ctx.font = `8px "DM Sans","Inter",system-ui,sans-serif`;
    const sw = ctx.measureText(entity.statusLabel).width + 10;
    const sx = lx - sw / 2;
    const sy = ry - 4;
    ctx.beginPath();
    ctx.roundRect(sx, sy - 13, sw, 13, 3);
    ctx.fillStyle = color + '28';
    ctx.fill();
    ctx.strokeStyle = color + '55'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(entity.statusLabel, lx, sy - 6.5);
  } else if (entity.statusLabel) {
    // Always show tiny status dot
    ctx.font = `7.5px "DM Sans","Inter",system-ui,sans-serif`;
    ctx.fillStyle = color + 'BB';
    ctx.textAlign = 'center';
    ctx.fillText(entity.statusLabel, lx, ry - 4);
  }

  // Connector line from pill bottom-center to the animal
  const pillBottom = ry + ph;
  const animalTop  = entity.y - (entity.size || 14) * 0.55;
  if (animalTop > pillBottom + 3) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(lx, pillBottom);
    ctx.lineTo(entity.x, animalTop);
    ctx.strokeStyle = color + '88';
    ctx.lineWidth = 0.75;
    ctx.stroke();
    ctx.setLineDash([]);
    // Dot at the animal end
    ctx.beginPath();
    ctx.arc(entity.x, animalTop, 2.0, 0, Math.PI * 2);
    ctx.fillStyle = color + 'BB';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ── Hit test ───────────────────────────────────────────────────────
function hitEntity(fish, jellies, stingrays, seahorses, crabs, turtles, mx, my) {
  const all = [...turtles, ...stingrays, ...seahorses, ...crabs, ...fish, ...jellies];
  for (const e of all) {
    if (e.type === 'user') continue;
    const d = Math.sqrt((e.x - mx) ** 2 + (e.y - my) ** 2);
    if (d < (e.size || 14) + 8) return e;
  }
  return null;
}

// ── Component ──────────────────────────────────────────────────────
export default function AquariumCanvas({ entities, onEntityClick }) {
  const canvasRef   = useRef(null);
  const stateRef    = useRef(null);
  const selectedRef = useRef(null);
  const hoveredRef  = useRef(null);
  const mouseRef    = useRef({ x: 0, y: 0 });
  const onClickRef  = useRef(onEntityClick);
  useEffect(() => { onClickRef.current = onEntityClick; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !entities?.length) return;
    const parent = canvas.parentElement;
    const dpr    = window.devicePixelRatio || 1;
    let W = parent.offsetWidth, H = parent.offsetHeight;
    const ctx = canvas.getContext('2d');

    function resize() {
      W = parent.offsetWidth; H = parent.offsetHeight;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const { fish, jellies, stingrays, seahorses, crabs, turtles } = initEntities(entities, W, H);
    const coral       = genCoral(W, H);
    const seaweed     = genSeaweed(W, H);
    const kelp        = genKelp(W, H);
    const rays        = genRays(W);
    const bubbles     = genBubbles(W, H);
    const anemones    = genAnemones(W, H);
    const rocks       = genRocks(W, H);
    const ripples          = [];
    const clickParticles   = [];
    const bioEvents        = genBioEvents();
    const surfaceMesh      = genSurfaceMesh(W);
    const baitSchool       = genBaitSchool(W, H);
    const deepLayers       = genDeepLayers(W, H);
    const currentParticles = genCurrentParticles(W, H);
    const dustParticles    = genDustParticles(W, H);
    const bubbleChains     = genBubbleChains(coral, rocks);
    const plankton         = genPlankton(W, H);
    const eels             = genEels(W, H);
    const inkClouds        = [];
    const octopuses        = genOctopuses(W, H);
    const manta            = genManta(W, H);
    const causticCells     = genCausticCells(W, H);
    const whale            = genWhaleState();
    const angler           = genAnglerState(W, H);
    const urchins          = genUrchin(W, H);
    const clownfish        = genClownfish(anemones);
    const tidalCurrent     = genTidalCurrent();
    const coralSpawn       = genCoralSpawnState();
    const shark            = genShark(W, H);
    const turbulence       = []; // shared pool for shark + stingray wakes
    // bioFlash: rare mass bioluminescent pulse event
    const bioFlash = { strength: 0, cooldown: 1800 + Math.floor(Math.random() * 2400) };
    stateRef.current  = { fish, jellies, stingrays, seahorses, crabs, turtles, coral, seaweed, kelp, rays, bubbles, anemones, rocks, ripples, clickParticles, bioEvents, surfaceMesh, baitSchool, deepLayers, currentParticles, dustParticles, bubbleChains, plankton, eels, inkClouds, octopuses, manta, causticCells, whale, angler, urchins, clownfish, tidalCurrent, coralSpawn, shark, turbulence, bioFlash };
    mouseRef.current  = { x: W / 2, y: H / 2 };

    let frame = 0, rafId, lastTime = 0;

    function render() {
      const { fish, jellies, stingrays, seahorses, crabs, turtles, coral, seaweed, kelp, rays, bubbles, anemones, rocks, ripples, clickParticles, bioEvents, surfaceMesh, baitSchool, deepLayers, currentParticles, dustParticles, bubbleChains, plankton, eels, inkClouds, octopuses, manta, causticCells, whale, angler, urchins, clownfish, tidalCurrent, coralSpawn, shark, turbulence, bioFlash } = stateRef.current;
      const mouse = mouseRef.current;
      const sel   = selectedRef.current;
      const hov   = hoveredRef.current;
      const px    = (mouse.x / W - 0.5) * 12;
      const py    = (mouse.y / H - 0.5) *  6;
      const all   = [...turtles, ...stingrays, ...seahorses, ...crabs, ...fish, ...jellies];

      ctx.clearRect(0, 0, W, H);

      // Day/night cycle: full period ~50 seconds at 60fps; starts at "day"
      const daylight = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.002));

      // ── Bioluminescent mass flash ────────────────────────────────────
      // Rare ocean-wide event: all creatures pulse simultaneously
      bioFlash.cooldown = Math.max(0, bioFlash.cooldown - 1);
      if (bioFlash.cooldown === 0 && daylight < 0.46 && Math.random() < 0.004) {
        bioFlash.strength = 1.0;
        bioFlash.cooldown = 3000 + Math.floor(Math.random() * 3600); // 50-110s until next
      }
      if (bioFlash.strength > 0) {
        bioFlash.strength = Math.max(0, bioFlash.strength - 0.008); // ~125 frame fade
      }
      // flashMult: amplifier for bioluminescent elements (1 at rest, up to 3.5 during flash)
      const flashMult = 1 + bioFlash.strength * 2.5;

      // Flash overlay — brief screen-wide blue-green pulse at peak
      if (bioFlash.strength > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = bioFlash.strength * 0.14;
        ctx.fillStyle = 'rgba(30,200,180,1)';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // 1. Background (gradient + rays + shimmer + plankton)
      drawBackground(ctx, W, H, frame, rays, mouse, daylight);

      // 1a-night. Night vignette — deepens as daylight drops
      const nightAlpha = (1 - daylight) * 0.42;
      if (nightAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = nightAlpha;
        ctx.fillStyle = '#000408';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // 1a2. Deep reef silhouette — permanent geological backdrop
      drawReefSilhouette(ctx, W, H, frame, mouse, daylight);

      // 1a3. Distant whale — massive silhouette gliding through the deep background
      updateWhale(whale, W, H, frame);
      drawWhale(ctx, whale, frame);

      // 1b. Volumetric dust — particles lit by light shafts
      drawDustInRays(ctx, dustParticles, rays, W, H, frame, mouse);

      // 1c. Animated water surface caustic mesh
      drawWaterSurface(ctx, W, surfaceMesh, frame);

      // 1c2. Mid-water caustic cell projections — sunlight refracted through surface waves
      drawCausticCells(ctx, causticCells, frame, daylight);

      // 1d. Thermocline boundary — shimmering optical layer at mid-depth
      drawThermocline(ctx, W, H, frame);

      // 1e. Seafloor sand ripple texture
      drawSeafloorTexture(ctx, W, H, frame, daylight, tidalCurrent);

      // 2. Seaweed with parallax (foreground layer — moves most relative to camera)
      ctx.save(); ctx.translate(px * 2.4, py * 1.2);
      seaweed.forEach(s => drawSeaweed(ctx, s, frame, tidalCurrent, daylight));
      ctx.restore();

      // 2b. Kelp forest — tall swaying columns with blade fronds (mid parallax)
      ctx.save(); ctx.translate(px * 1.8, py * 0.9);
      kelp.forEach(k => drawKelp(ctx, k, frame, daylight));
      ctx.restore();

      // 3. Rocks (midground — moderate parallax)
      ctx.save(); ctx.translate(px * 1.0, py * 0.5);
      drawRocks(ctx, rocks);
      // Sea urchins among the rocks
      urchins.forEach(u => drawUrchin(ctx, u, frame, daylight));
      ctx.restore();

      // 4. Coral with parallax (midground — slightly less than seaweed)
      ctx.save(); ctx.translate(px * 1.6, py * 0.8);
      coral.forEach(c => drawCoral(ctx, c, frame, daylight));
      ctx.restore();

      // 5. Anemones — pass nearest fish so tentacles can reach
      anemones.forEach(a => {
        let nearest = null;
        fish.forEach(f => {
          const dx = f.x - a.x, dy = f.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (!nearest || dist < nearest.dist) nearest = { x: f.x, y: f.y, dist };
        });
        drawAnemone(ctx, a, frame, nearest);
      });

      // 5b. Clownfish — dart in/out of their host anemones
      updateClownfish(clownfish, W, H, frame);
      clownfish.forEach(c => drawClownfish(ctx, c, frame));

      // 5c. Coral spawning — rising clouds of luminous egg bundles
      updateCoralSpawn(coralSpawn, coral, W, H, frame);
      drawCoralSpawn(ctx, coralSpawn, frame, daylight);

      // 6b. Plankton clouds — bioluminescent mote clusters drifting mid-water
      updateDrawPlankton(ctx, plankton, W, H, frame, daylight, flashMult);

      // 7. Ocean current particle field
      drawCurrentParticles(ctx, currentParticles, W, H, frame);

      // 7b. Bubbles
      drawBubbles(ctx, bubbles, frame, H);

      // 7c. Bubble chains rising from coral tips and rocks
      updateDrawBubbleChains(ctx, bubbleChains, frame);

      // 7a-deep. Deep background fish layers — faint distant silhouette schools
      updateDrawDeepLayers(ctx, deepLayers, W, H, frame, daylight, px, py);

      // 7b. Bait fish school (ambient, non-interactive, behind main entities)
      updateBaitSchool(baitSchool, W, H, frame);
      drawBaitSchool(ctx, baitSchool, frame);

      // 7d. Moray eels — sinusoidal ribbon creatures near the bottom
      updateEels(eels, W, H, frame);
      eels.forEach(eel => drawEel(ctx, eel, frame));

      // 7e. Octopuses — color-changing, tentacled, jet-propulsion escape
      updateOctopuses(octopuses, W, H, frame, fish, inkClouds);
      octopuses.forEach(o => drawOctopus(ctx, o, frame));

      // 7f. Manta ray — soaring in the upper water column
      updateManta(manta, W, H);
      drawManta(ctx, manta, frame);

      // 7g. Anglerfish — rises from the deep during night phase
      updateAngler(angler, W, H, frame, daylight);
      drawAngler(ctx, angler, frame);

      // 7h. Shark — apex predator that passes through periodically
      updateShark(shark, W, H, fish, stingrays, inkClouds);
      drawShark(ctx, shark, frame);
      // Shark wake turbulence — emit from tail tip while active
      if (shark.active && shark.tail.length > 0) {
        const tail = shark.tail[shark.tail.length - 1];
        const sharkSpeed = Math.sqrt(shark.vx * shark.vx + shark.vy * shark.vy);
        if (sharkSpeed > 0.18 && frame % 2 === 0) {
          spawnTurbulence(turbulence, tail.x, tail.y, sharkSpeed * 4.5, shark.dir);
        }
      }
      // Hunting stingray turbulence — emit when chasing prey
      stingrays.forEach(r => {
        if (r._hunting && frame % 3 === 0) {
          const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
          spawnTurbulence(turbulence, r.x - Math.cos(r.dir) * (r.size || 20) * 0.8,
                          r.y - Math.sin(r.dir) * (r.size || 20) * 0.8, speed * 3.5, r.dir);
        }
      });
      // Draw and update turbulence pool
      updateDrawTurbulence(ctx, turbulence);

      // 7h. Tidal current — periodic directional sweep
      updateTidalCurrent(tidalCurrent, frame);
      drawTidalCurrent(ctx, tidalCurrent, W, H, frame);

      // Tidal force on fish: gently steer all fish in current direction
      if (tidalCurrent.active && tidalCurrent.strength > 0.05) {
        const force = tidalCurrent.strength * 0.32;
        fish.forEach(f => {
          if (f.type === 'user') return;
          f.vx += tidalCurrent.cosA * force * 0.04;
          f.vy += tidalCurrent.sinA * force * 0.04;
          // Bias targetDir toward current direction
          let td = tidalCurrent.angle - f.targetDir;
          while (td >  Math.PI) td -= Math.PI * 2;
          while (td < -Math.PI) td += Math.PI * 2;
          f.targetDir += td * 0.012 * tidalCurrent.strength;
        });
      }

      // 8. Physics updates
      updateFish(fish, W, H, mouse, stingrays);
      updateJellies(jellies, W, H);
      updateStingrays(stingrays, W, H, fish, inkClouds);
      updateSeahorses(seahorses, W, H);
      updateCrabs(crabs, W, H);
      updateTurtles(turtles, W, H, bubbles);

      // 8b. Depth fog haze bands
      drawDepthFog(ctx, W, H, frame);

      // 8c. Bioluminescent entity trails — brighter at night + during flash
      drawEntityTrails(ctx, fish, jellies, stingrays, seahorses, turtles, daylight, flashMult);

      // Pre-compute ray illumination level for each entity position
      // (reuse the same zone test as drawDustInRays — entity in shaft = lit up)
      function getRayIllum(ex, ey) {
        if (daylight < 0.12) return 0; // no rays at deep night
        let maxI = 0;
        rays.forEach(ray => {
          const rayX = ray.x + px * 1.5;
          const half  = ray.width * 0.5 * (0.25 + (ey / H) * 0.80);
          const dist  = Math.abs(ex - rayX);
          if (dist < half) maxI = Math.max(maxI, (1 - dist / half) * daylight);
        });
        return maxI;
      }

      // Sort all animals back-to-front by depth before drawing (painter's algorithm)
      const depthSorted = [
        ...turtles.map(t  => ({ ...t,  _draw: (isSel, isHov, illum) => drawTurtle(ctx, t, frame, isSel, isHov) })),
        ...stingrays.map(r => ({ ...r,  _draw: (isSel, isHov, illum) => drawStingray(ctx, r, frame, isSel, isHov) })),
        ...seahorses.map(s => ({ ...s,  _draw: (isSel, isHov, illum) => drawSeahorse(ctx, s, frame, isSel, isHov) })),
        ...crabs.map(c     => ({ ...c,  _draw: (isSel, isHov, illum) => drawCrab(ctx, c, frame, isSel, isHov) })),
        ...fish.map(f      => ({ ...f,  _draw: (isSel, isHov, illum) => drawFish(ctx, f, isSel, isHov, illum) })),
        ...jellies.map(j   => ({ ...j,  _draw: (isSel, isHov, illum) => drawJellyfish(ctx, j, frame, isSel, isHov, illum) })),
      ].sort((a, b) => (a.depth ?? 1) - (b.depth ?? 1));

      // 9–14. Draw creatures back-to-front with depth alpha + focus dimming when selected
      depthSorted.forEach(e => {
        const isSel = sel?.id === e.id;
        const isHov = hov?.id === e.id;
        const depthAlpha  = isSel || isHov ? 1.0 : 0.50 + (e.depth ?? 1) * 0.50;
        const focusDim    = sel && !isSel && !isHov ? 0.42 : 1.0;
        const finalAlpha  = depthAlpha * focusDim;

        // Depth-based perspective scale: near (depth=1) stays full-size,
        // far (depth=0) shrinks an extra 14% beyond the already-baked size difference
        const perspScale = isSel ? 1.08 : 0.86 + (e.depth ?? 1) * 0.14;

        // Depth-of-field: far entities (low depth) get a softening blur
        const dof = isSel || isHov ? 0 : Math.max(0, (0.42 - (e.depth ?? 1)) * 4.5);
        const blurPx = dof > 0.1 ? Math.min(dof, 2.8).toFixed(1) : 0;

        // Compute ray illumination for this entity's position
        const illum = isSel || isHov ? 0 : getRayIllum(e.x, e.y);

        ctx.save();
        ctx.globalAlpha = finalAlpha;
        if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`;
        ctx.translate(e.x, e.y);
        ctx.scale(perspScale, perspScale);
        ctx.translate(-e.x, -e.y);
        e._draw(isSel, isHov, illum);
        ctx.restore();

        // Illumination overlay — bright shaft of light on creature when in a ray
        if (illum > 0.08 && !isSel) {
          const iR = (e.size || 14) * 1.6;
          const ig = ctx.createRadialGradient(e.x, e.y - (e.size || 14) * 0.3, 0, e.x, e.y, iR);
          ig.addColorStop(0,   `rgba(220,240,255,${illum * 0.22 * finalAlpha})`);
          ig.addColorStop(0.5, `rgba(160,210,255,${illum * 0.09 * finalAlpha})`);
          ig.addColorStop(1,   'rgba(100,170,230,0)');
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.beginPath(); ctx.arc(e.x, e.y, iR, 0, Math.PI * 2);
          ctx.fillStyle = ig; ctx.fill();
          ctx.restore();
        }

        // Blue water-absorption tint for distant entities
        if (!isSel && !isHov) {
          const tint = (1 - (e.depth ?? 1)) * 0.20 * focusDim;
          if (tint > 0.01) {
            const tR = (e.size || 14) * 2.0;
            const tg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, tR);
            tg.addColorStop(0, `rgba(8,50,130,${tint})`);
            tg.addColorStop(1, `rgba(8,50,130,0)`);
            ctx.save();
            ctx.beginPath(); ctx.arc(e.x, e.y, tR, 0, Math.PI * 2);
            ctx.fillStyle = tg; ctx.fill();
            ctx.restore();
          }
        }
      });

      // 15. Selected entity — pulsing halo ring
      if (sel) {
        const ent = all.find(e => e.id === sel.id);
        if (ent) {
          const pulse = Math.sin(frame * 0.07) * 0.5 + 0.5;
          const r     = (ent.size || 14) * 1.65 + pulse * 6;
          const color = tColor(ent.type);
          ctx.beginPath();
          ctx.arc(ent.x, ent.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = color + Math.round((0.55 + pulse * 0.30) * 255).toString(16).padStart(2,'0');
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ent.x, ent.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = color + Math.round((0.18 + pulse * 0.14) * 255).toString(16).padStart(2,'0');
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }

      // 16. Click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r    += 2.2;
        rp.alpha -= 0.022;
        if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,212,255,${rp.alpha * 0.8})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100,230,255,${rp.alpha * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 16a. User entity periodic pulse ripple
      if (frame % 200 === 0) {
        const userEnt = fish.find(f => f.type === 'user');
        if (userEnt) {
          ripples.push({ x: userEnt.x, y: userEnt.y, r: userEnt.size * 1.4, alpha: 0.50 });
          ripples.push({ x: userEnt.x, y: userEnt.y, r: userEnt.size * 0.8, alpha: 0.35 });
        }
      }

      // 16b. Click particle bursts
      drawClickParticles(ctx, clickParticles);

      // 16c-ink. Ink clouds from stingray strikes
      updateDrawInkClouds(ctx, inkClouds);

      // 16c. Bioluminescent ambient pulses — spawn occasionally, draw + age
      if (frame % 180 === 0 && bioEvents.length < 6) {
        bioEvents.push({
          x:    W * 0.08 + Math.random() * W * 0.84,
          y:    H * 0.10 + Math.random() * H * 0.65,
          r:    0,
          maxR: 35 + Math.random() * 55,
          hue:  155 + Math.random() * 70,
          life: 90,
          maxLife: 90,
        });
      }
      for (let i = bioEvents.length - 1; i >= 0; i--) {
        const ev = bioEvents[i];
        ev.r    = ev.maxR * (1 - ev.life / ev.maxLife);
        ev.life -= 1;
        if (ev.life <= 0) { bioEvents.splice(i, 1); continue; }
        const t   = 1 - ev.life / ev.maxLife;  // 0→1
        const al  = t < 0.3 ? t / 0.3 : (1 - t) / 0.7; // fade in then out
        const glr = ctx.createRadialGradient(ev.x, ev.y, 0, ev.x, ev.y, ev.r);
        glr.addColorStop(0,   `hsla(${ev.hue},90%,65%,${al * 0.22})`);
        glr.addColorStop(0.5, `hsla(${ev.hue},80%,55%,${al * 0.10})`);
        glr.addColorStop(1,   `hsla(${ev.hue},70%,45%,0)`);
        ctx.beginPath(); ctx.arc(ev.x, ev.y, ev.r, 0, Math.PI * 2);
        ctx.fillStyle = glr; ctx.fill();
      }

      // 17. Always-visible labels with collision avoidance
      const labelEntities = all.filter(e => e.type !== 'user');
      // Compute de-overlapped Y positions (relaxation, Y-axis only)
      const labelLayout = {};
      {
        const items = labelEntities.map(e => {
          const r = (e.size || 14) * (e.type === 'stingray' ? 1.0 : e.type === 'turtle' ? 0.9 : 0.7);
          return { id: e.id, x: e.x, y: e.y - r - 10 };
        });
        const MIN_GAP = 23;
        for (let pass = 0; pass < 5; pass++) {
          items.sort((a, b) => a.y - b.y);
          for (let i = 1; i < items.length; i++) {
            const a = items[i - 1], b = items[i];
            if (Math.abs(a.x - b.x) < 96) {
              const gap = b.y - a.y;
              if (gap < MIN_GAP) {
                const push = (MIN_GAP - gap) * 0.5;
                a.y -= push; b.y += push;
              }
            }
          }
        }
        items.forEach(it => { labelLayout[it.id] = it.y; });
      }
      labelEntities.forEach(e => {
        const isSel = sel?.id === e.id;
        const isHov = hov?.id === e.id;
        drawLabel(ctx, e, isSel, isHov, labelLayout[e.id]);
      });

      // 18. Depth vignette + selection overlay
      if (sel) {
        // When selected: darken everything slightly for focus effect
        ctx.fillStyle = 'rgba(0,4,12,0.22)';
        ctx.fillRect(0, 0, W, H);
      }
      const vig = ctx.createRadialGradient(W/2, H*0.46, Math.min(W,H)*0.18, W/2, H*0.5, Math.sqrt(W*W+H*H)*0.62);
      vig.addColorStop(0,   'rgba(0,0,0,0)');
      vig.addColorStop(0.55,'rgba(0,4,16,0.04)');
      vig.addColorStop(0.80,'rgba(0,4,16,0.22)');
      vig.addColorStop(1,   'rgba(0,3,12,0.58)');
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
      // Hard edge darkening at canvas borders
      const edgeT = ctx.createLinearGradient(0, 0, 0, H * 0.06);
      edgeT.addColorStop(0, 'rgba(0,5,18,0.38)'); edgeT.addColorStop(1, 'rgba(0,5,18,0)');
      ctx.fillStyle = edgeT; ctx.fillRect(0, 0, W, H * 0.06);
      const edgeB = ctx.createLinearGradient(0, H, 0, H * 0.92);
      edgeB.addColorStop(0, 'rgba(0,3,10,0.52)'); edgeB.addColorStop(1, 'rgba(0,3,10,0)');
      ctx.fillStyle = edgeB; ctx.fillRect(0, H * 0.92, W, H * 0.08);

      // 18b. Water light absorption — red & green absorbed with depth, leaving blue-cold water
      // Upper zone (surface): slight warm/yellow tint from sunlight penetration
      // Deep zone: progressive blue dominance as red/green are absorbed
      {
        const absorbStrength = 0.85 * daylight; // weaker at night (bioluminescence compensates)

        // Sunlit warm zone (top 18%)
        const warmZone = ctx.createLinearGradient(0, 0, 0, H * 0.18);
        warmZone.addColorStop(0,   `rgba(255,200,100,${0.038 * absorbStrength})`);
        warmZone.addColorStop(0.5, `rgba(220,170, 80,${0.018 * absorbStrength})`);
        warmZone.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = warmZone; ctx.fillRect(0, 0, W, H * 0.18);

        // Depth absorption — full height gradient, strongest at bottom
        const depthAbsorb = ctx.createLinearGradient(0, H * 0.10, 0, H);
        depthAbsorb.addColorStop(0,    'rgba(0,20,60,0)');
        depthAbsorb.addColorStop(0.30, `rgba(0,28,75,${0.04 * absorbStrength})`);
        depthAbsorb.addColorStop(0.60, `rgba(0,18,60,${0.10 * absorbStrength})`);
        depthAbsorb.addColorStop(0.85, `rgba(0,12,45,${0.18 * absorbStrength})`);
        depthAbsorb.addColorStop(1,    `rgba(0, 8,35,${0.26 * absorbStrength})`);
        ctx.fillStyle = depthAbsorb; ctx.fillRect(0, 0, W, H);

        // Mid-water cyan scatter — the characteristic "blue water" color in the 30-70% zone
        const scatter = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.72);
        scatter.addColorStop(0,   'rgba(0,40,80,0)');
        scatter.addColorStop(0.5, `rgba(0,55,100,${0.055 * absorbStrength})`);
        scatter.addColorStop(1,   'rgba(0,40,80,0)');
        ctx.fillStyle = scatter; ctx.fillRect(0, H * 0.28, W, H * 0.44);
      }

      // 19. Global fade-in on canvas init (first 80 frames)
      if (frame < 80) {
        const fadeAlpha = 1 - frame / 80;
        ctx.fillStyle = `rgba(1,12,28,${fadeAlpha * fadeAlpha})`; // ease-out
        ctx.fillRect(0, 0, W, H);
      }
    }

    function loop(ts) {
      rafId = requestAnimationFrame(loop);
      const dt = ts - lastTime;
      if (dt < 14) return;   // cap at ~60 fps so physics is speed-consistent on high-refresh displays
      lastTime = ts;
      render();
      frame++;
    }
    rafId = requestAnimationFrame(loop);

    function getXY(e) {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    function handleClick(e) {
      const [mx, my] = getXY(e);
      const { fish, jellies, stingrays, seahorses, crabs, turtles, ripples, clickParticles } = stateRef.current;
      const hit = hitEntity(fish, jellies, stingrays, seahorses, crabs, turtles, mx, my);
      selectedRef.current = hit && selectedRef.current?.id !== hit.id ? hit : null;
      // Ripple burst at click point
      ripples.push({ x: mx, y: my, r: 4, alpha: 0.75 });
      if (hit) {
        ripples.push({ x: hit.x, y: hit.y, r: 2, alpha: 0.9 });
        // Colored particle burst from the animal
        const color = tColor(hit.type);
        const count = 14 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
          const speed = 1.2 + Math.random() * 2.8;
          clickParticles.push({
            x: hit.x, y: hit.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.8,
            r:  1.5 + Math.random() * 2.5,
            life: 28 + Math.floor(Math.random() * 18),
            maxLife: 46,
            color,
          });
        }
      }
      onClickRef.current?.(selectedRef.current);
    }
    function handleMouseMove(e) {
      const [mx, my] = getXY(e);
      mouseRef.current = { x: mx, y: my };
      const { fish, jellies, stingrays, seahorses, crabs, turtles } = stateRef.current;
      const hit = hitEntity(fish, jellies, stingrays, seahorses, crabs, turtles, mx, my);
      hoveredRef.current = hit || null;
      canvas.style.cursor = hit ? 'pointer' : 'default';
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      ro.disconnect();
    };
  }, [entities]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
