import { useEffect, useRef } from 'react';

// ── Deep-space constellation map ───────────────────────────────────
// Entities render as stars at polar positions (angle, dist).
// SCALE=2 → pixel-art upscale via imageRendering:pixelated.
const SCALE = 2;

const STAR_CFG = {
  'center':        { color:'#FFE040', glow:'#FF9000', baseR:5, rays:true  },
  'contact-warm':  { color:'#FFB830', glow:'#FF6000', baseR:3, rays:false },
  'contact-mid':   { color:'#FF7028', glow:'#BB3800', baseR:2, rays:false },
  'contact-cold':  { color:'#664430', glow:'#331800', baseR:1.5, rays:false },
  'event':         { color:'#FF4468', glow:'#AA1030', baseR:2.5, rays:false },
  'plan':          { color:'#5088FF', glow:'#1040CC', baseR:2, rays:false },
  'instagram':     { color:'#FF30A0', glow:'#AA0060', baseR:3, rays:false },
};
function cfg(type) { return STAR_CFG[type] || { color:'#888888', glow:'#444444', baseR:1.5, rays:false }; }

// Pre-seeded background star positions (golden-angle spiral)
const BG_STARS = Array.from({ length: 520 }, (_, i) => {
  const phi = i * 2.399963; // golden angle
  const r   = Math.sqrt(i / 520);
  return {
    fx:    (Math.cos(phi) * r * 0.5 + 0.5),
    fy:    (Math.sin(phi) * r * 0.5 + 0.5),
    size:  i % 7 === 0 ? 1.4 : 1,
    phase: (i * 0.618) % (Math.PI * 2),
  };
});

// Nebula blobs (fixed relative positions)
const NEBULAE = [
  { fx:0.18, fy:0.22, r:0.28, color:'rgba(80,20,140,', seed:0   },
  { fx:0.75, fy:0.35, r:0.22, color:'rgba(20,60,140,',  seed:1.5 },
  { fx:0.55, fy:0.78, r:0.25, color:'rgba(140,30,60,',  seed:3.0 },
];

export default function ConstellationCanvas({ entities, onEntityClick }) {
  const canvasRef   = useRef(null);
  const selectedRef = useRef(null);
  const hoveredRef  = useRef(null);
  const onClickRef  = useRef(onEntityClick);
  useEffect(() => { onClickRef.current = onEntityClick; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx    = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let W = parent.offsetWidth, H = parent.offsetHeight;
    let PW = 0, PH = 0;

    // Shooting star state
    let shoot = null;

    function computeStarPositions() {
      if (!entities) return [];
      const cx = PW / 2, cy = PH / 2;
      const distScale = Math.min(PW, PH) * 0.42 / 360;
      return entities.map(e => {
        const d   = (e.dist ?? 280) * distScale;
        const ang = e.angle ?? 0;
        return {
          ...e,
          px: Math.round(cx + Math.cos(ang) * d),
          py: Math.round(cy + Math.sin(ang) * d),
        };
      });
    }

    let stars = [];

    function computeLayout() {
      PW = Math.floor(W / SCALE);
      PH = Math.floor(H / SCALE);
      stars = computeStarPositions();
    }

    function resize() {
      W = parent.offsetWidth; H = parent.offsetHeight;
      canvas.width  = Math.floor(W / SCALE);
      canvas.height = Math.floor(H / SCALE);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      canvas.style.imageRendering = 'pixelated';
      ctx.imageSmoothingEnabled = false;
      computeLayout();
    }
    resize();

    let frame = 0, rafId;

    function drawStar(ctx, x, y, entity, r, isSelected, isHovered, frame) {
      const c = cfg(entity.type);
      const pulse = Math.sin(frame * 0.04 + (entity.phase ?? 0)) * 0.5 + 0.5;
      const cr = Math.max(1, r);

      // Glow
      if (isSelected || isHovered || entity.importance > 0.6) {
        const glowR = cr * (isSelected ? 5 : 3.5);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        const alpha = isSelected ? 0.28 + pulse*0.15 : 0.14 + pulse*0.08;
        gr.addColorStop(0, c.glow.replace('rgb','rgba').replace(')',`,${alpha})`) || `rgba(200,150,50,${alpha})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(Math.round(x - glowR), Math.round(y - glowR), Math.round(glowR*2), Math.round(glowR*2));
      }

      // Star body
      if (c.rays && cr >= 3) {
        // Sun-like rays for center star
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
          const a    = (i / rayCount) * Math.PI * 2 + frame * 0.008;
          const rayL = cr * (2.2 + pulse * 0.8);
          ctx.strokeStyle = c.color + (i % 2 === 0 ? 'AA' : '55');
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.round(x + Math.cos(a) * cr), Math.round(y + Math.sin(a) * cr));
          ctx.lineTo(Math.round(x + Math.cos(a) * rayL), Math.round(y + Math.sin(a) * rayL));
          ctx.stroke();
        }
      }

      // Core pixel rect (crisp)
      ctx.fillStyle = c.color;
      const cs = Math.round(cr);
      ctx.fillRect(x - cs, y - cs, cs*2, cs*2);
      // Inner bright pixel
      if (cr > 2) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }

      // Twinkle cross
      if (cr >= 2) {
        ctx.fillStyle = c.color + (isSelected ? 'CC' : '88');
        ctx.fillRect(x - Math.round(cr*1.8), y, Math.round(cr*1.8), 1);
        ctx.fillRect(x + 1, y, Math.round(cr*1.8), 1);
        ctx.fillRect(x, y - Math.round(cr*1.8), 1, Math.round(cr*1.8));
        ctx.fillRect(x, y + 1, 1, Math.round(cr*1.8));
      }
    }

    function render() {
      ctx.clearRect(0, 0, PW, PH);

      // ── Deep space background ────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, 0, PH);
      bg.addColorStop(0,   '#010208');
      bg.addColorStop(0.5, '#020310');
      bg.addColorStop(1,   '#030418');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, PW, PH);

      // Milky Way band
      const mw = ctx.createLinearGradient(0, PH*0.25, PW, PH*0.55);
      mw.addColorStop(0,   'rgba(0,0,0,0)');
      mw.addColorStop(0.35,'rgba(60,50,100,0.07)');
      mw.addColorStop(0.5, 'rgba(80,60,120,0.1)');
      mw.addColorStop(0.65,'rgba(60,50,100,0.07)');
      mw.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = mw; ctx.fillRect(0, 0, PW, PH);

      // ── Nebulae ──────────────────────────────────────────────────
      NEBULAE.forEach(nb => {
        const nx = Math.round(nb.fx * PW);
        const ny = Math.round(nb.fy * PH);
        const nr = Math.round(nb.r * Math.min(PW, PH));
        const pulse = Math.sin(frame * 0.007 + nb.seed) * 0.5 + 0.5;
        const gr = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        gr.addColorStop(0, nb.color + `${(0.04 + pulse*0.025).toFixed(3)})`);
        gr.addColorStop(0.5, nb.color + `${(0.02 + pulse*0.01).toFixed(3)})`);
        gr.addColorStop(1, nb.color + '0)');
        ctx.fillStyle = gr;
        ctx.fillRect(nx - nr, ny - nr, nr*2, nr*2);
      });

      // ── Background stars ─────────────────────────────────────────
      BG_STARS.forEach(s => {
        const bx = Math.round(s.fx * PW);
        const by = Math.round(s.fy * PH);
        const al = (Math.sin(frame * 0.014 + s.phase) * 0.5 + 0.5) * 0.35 + 0.12;
        ctx.fillStyle = `rgba(210,215,240,${al.toFixed(3)})`;
        ctx.fillRect(bx, by, s.size > 1 ? 2 : 1, 1);
      });

      // ── Constellation lines (spokes from center) ──────────────────
      const centerStar = stars.find(s => s.type === 'center');
      if (centerStar) {
        const cx2 = centerStar.px, cy2 = centerStar.py;
        stars.forEach(s => {
          if (s.id === centerStar.id) return;
          const sc = cfg(s.type);
          const imp = s.importance ?? 0.3;
          const al = Math.round((0.08 + imp * 0.12) * 255).toString(16).padStart(2,'0');
          ctx.strokeStyle = sc.color + al;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(cx2, cy2);
          ctx.lineTo(s.px, s.py);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // Cross-connections between close warm contacts
      const warmStars = stars.filter(s => s.type === 'contact-warm' || s.type === 'contact-mid');
      for (let i = 0; i < warmStars.length; i++) {
        for (let j = i+1; j < warmStars.length; j++) {
          const dx = warmStars[i].px - warmStars[j].px;
          const dy = warmStars[i].py - warmStars[j].py;
          if (Math.sqrt(dx*dx+dy*dy) < Math.min(PW,PH) * 0.22) {
            ctx.strokeStyle = 'rgba(255,180,40,0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([1, 5]);
            ctx.beginPath();
            ctx.moveTo(warmStars[i].px, warmStars[i].py);
            ctx.lineTo(warmStars[j].px, warmStars[j].py);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // ── Data stars ───────────────────────────────────────────────
      stars.forEach(s => {
        const c    = cfg(s.type);
        const imp  = s.importance ?? 0.5;
        const r    = Math.max(c.baseR, Math.round(c.baseR + imp * 3));
        const float = { // gentle oscillation
          x: Math.round(Math.cos((s.phase ?? 0) * 1.3) * 1.5),
          y: Math.round(Math.sin((s.phase ?? 0) * 1.1 + frame * 0.008) * 1.5),
        };
        drawStar(
          ctx, s.px + float.x, s.py + float.y, s, r,
          selectedRef.current?.id === s.id,
          hoveredRef.current?.id === s.id,
          frame
        );
        // Store current screen position for hit testing
        s._sx = s.px + float.x;
        s._sy = s.py + float.y;
      });

      // ── Shooting star ────────────────────────────────────────────
      if (!shoot && frame % 340 === 0) {
        shoot = {
          x: Math.random() * PW * 0.5,
          y: Math.random() * PH * 0.3,
          vx: 2.5 + Math.random() * 2,
          vy: 1.2 + Math.random() * 1,
          life: 0, maxLife: 28,
        };
      }
      if (shoot) {
        const t = shoot.life / shoot.maxLife;
        const al = t < 0.3 ? t/0.3 : t > 0.7 ? (1-t)/0.3 : 1;
        ctx.strokeStyle = `rgba(255,240,200,${(al*0.7).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(shoot.x), Math.round(shoot.y));
        ctx.lineTo(Math.round(shoot.x - shoot.vx * 7), Math.round(shoot.y - shoot.vy * 7));
        ctx.stroke();
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++;
        if (shoot.life > shoot.maxLife) shoot = null;
      }

      // ── Label ─────────────────────────────────────────────────────
      const target = selectedRef.current || hoveredRef.current;
      if (target) {
        const s2 = stars.find(s => s.id === target.id);
        if (s2) {
          const lx = s2._sx ?? s2.px, ly = (s2._sy ?? s2.py) - 10;
          ctx.font = `${Math.max(6, Math.round(Math.min(PW,PH) * 0.035))}px "Courier New",monospace`;
          const tw = Math.ceil(ctx.measureText(target.label).width);
          const pad = 4, ph = 10;
          ctx.fillStyle = 'rgba(4,2,14,0.9)';
          ctx.fillRect(lx - Math.round(tw/2) - pad, ly - ph - 2, tw + pad*2, ph);
          const c = cfg(target.type);
          ctx.strokeStyle = c.color + '55';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(lx - Math.round(tw/2) - pad, ly - ph - 2, tw + pad*2, ph);
          ctx.fillStyle = '#F8E8C0';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(target.label, lx, ly - ph*0.5 - 2);
          if (target.statusLabel) {
            ctx.font = `${Math.max(5, Math.round(Math.min(PW,PH)*0.028))}px "Courier New",monospace`;
            ctx.fillStyle = c.color + 'AA';
            ctx.fillText(target.statusLabel, lx, ly - ph - 6);
          }
          ctx.textBaseline = 'alphabetic';
        }
      }

      // ── Vignette ─────────────────────────────────────────────────
      const vg = ctx.createRadialGradient(PW/2, PH/2, PH*0.25, PW/2, PH/2, PH*0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,8,0.55)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, PW, PH);

      frame++;
    }

    function loop() { render(); rafId = requestAnimationFrame(loop); }
    rafId = requestAnimationFrame(loop);

    function toPixelXY(e) {
      const r = canvas.getBoundingClientRect();
      return [
        Math.round((e.clientX - r.left) / SCALE),
        Math.round((e.clientY - r.top)  / SCALE),
      ];
    }
    function hitStar(mx, my) {
      let best = null, bestD = 12;
      for (const s of stars) {
        const sx = s._sx ?? s.px, sy = s._sy ?? s.py;
        const d = Math.sqrt((sx-mx)**2 + (sy-my)**2);
        if (d < bestD) { bestD = d; best = s; }
      }
      return best;
    }
    function handleClick(e) {
      const [mx, my] = toPixelXY(e);
      const hit = hitStar(mx, my);
      if (hit) {
        const same = selectedRef.current?.id === hit.id;
        selectedRef.current = same ? null : hit;
      } else {
        selectedRef.current = null;
      }
      onClickRef.current?.(selectedRef.current);
    }
    function handleMouseMove(e) {
      const [mx, my] = toPixelXY(e);
      hoveredRef.current = hitStar(mx, my) || null;
      canvas.style.cursor = hoveredRef.current ? 'pointer' : 'default';
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

  return (
    <canvas
      ref={canvasRef}
      style={{ display:'block', width:'100%', height:'100%', imageRendering:'pixelated' }}
    />
  );
}
