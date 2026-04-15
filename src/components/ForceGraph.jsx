import { useEffect, useRef } from 'react';

// ── Physics ───────────────────────────────────────────────────────
const PHY = {
  repulsion:  14000,
  springK:    0.004,
  springRest: 290,
  gravity:    0.0006,
  damping:    0.78,
  boundary:   60,
};

// ── Shape drawers ─────────────────────────────────────────────────
function pathCircle(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
}
function pathHex(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function pathDiamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x,        y - r);
  ctx.lineTo(x + r * 0.65, y);
  ctx.lineTo(x,        y + r);
  ctx.lineTo(x - r * 0.65, y);
  ctx.closePath();
}
function pathStar(ctx, x, y, r, pts = 5) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = (i * Math.PI) / pts - Math.PI / 2;
    const ri = i % 2 === 0 ? r : r * 0.42;
    const px = x + ri * Math.cos(a), py = y + ri * Math.sin(a);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function getShapePath(ctx, x, y, r, shape) {
  switch (shape) {
    case 'hex':     return pathHex(ctx, x, y, r);
    case 'diamond': return pathDiamond(ctx, x, y, r);
    case 'star':    return pathStar(ctx, x, y, r);
    default:        return pathCircle(ctx, x, y, r);
  }
}

// ── Edge drawers ──────────────────────────────────────────────────
function edgeStraight(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
}
function edgeCircuit(ctx, x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(mx, y1); ctx.lineTo(mx, y2); ctx.lineTo(x2, y2);
}
function edgeBezier(ctx, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(
    x1 + dx * 0.35 + dy * 0.18, y1 + dy * 0.35 - dx * 0.18,
    x2 - dx * 0.35 + dy * 0.18, y2 - dy * 0.35 - dx * 0.18,
    x2, y2
  );
}
function edgeOrganic(ctx, x1, y1, x2, y2, frame) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const d  = Math.sqrt((x2-x1)**2 + (y2-y1)**2) || 1;
  const ox = -(y2-y1) / d * Math.sin(frame * 0.018) * 14;
  const oy =  (x2-x1) / d * Math.sin(frame * 0.018) * 14;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx + ox, my + oy, x2, y2);
}

function drawEdge(ctx, x1, y1, x2, y2, style, frame) {
  switch (style) {
    case 'circuit': return edgeCircuit(ctx, x1, y1, x2, y2);
    case 'bezier':  return edgeBezier(ctx, x1, y1, x2, y2);
    case 'organic': return edgeOrganic(ctx, x1, y1, x2, y2, frame);
    default:        return edgeStraight(ctx, x1, y1, x2, y2);
  }
}

// ── Hit test ──────────────────────────────────────────────────────
function hitNode(nodes, mx, my) {
  let closest = null, minD = Infinity;
  nodes.forEach(n => {
    const d = Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2);
    if (d < (n.size + 10) && d < minD) { minD = d; closest = n; }
  });
  return closest;
}

// ── Component ─────────────────────────────────────────────────────
export default function ForceGraph({ nodes: nodeDefs, edges: edgeDefs, theme, onNodeClick }) {
  const canvasRef    = useRef(null);
  const nodesRef     = useRef([]);
  const selectedRef  = useRef(null);
  const mouseRef     = useRef({ x: 0, y: 0 });
  // Stable ref for callback — never causes useEffect to re-run
  const onClickRef   = useRef(onNodeClick);
  useEffect(() => { onClickRef.current = onNodeClick; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodeDefs?.length) return;
    const parent = canvas.parentElement;
    const dpr    = window.devicePixelRatio || 1;
    let W = parent.offsetWidth;
    let H = parent.offsetHeight;
    selectedRef.current = null;

    const ctx  = canvas.getContext('2d');
    const snap = document.createElement('canvas');
    const snapCtx = snap.getContext('2d');

    function resize() {
      W = parent.offsetWidth; H = parent.offsetHeight;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      snap.width = W * dpr; snap.height = H * dpr;
      if (nodesRef.current[0]?.type === 'center') {
        nodesRef.current[0].x = W / 2; nodesRef.current[0].y = H / 2;
      }
    }

    resize();

    // Init nodes
    nodesRef.current = nodeDefs.map(n => {
      if (n.type === 'center') return { ...n, x: W/2, y: H/2, vx: 0, vy: 0, pinned: true };
      const angle = n.angle ?? (Math.random() * Math.PI * 2);
      const dist  = n.dist  ?? (300 + Math.random() * 240);
      return { ...n, x: W/2 + Math.cos(angle)*dist, y: H/2 + Math.sin(angle)*dist, vx: 0, vy: 0 };
    });

    const edges = (edgeDefs || []).map(e => ({
      ...e,
      si: typeof e.source === 'number' ? e.source : nodesRef.current.findIndex(n => n.id === e.source),
      ti: typeof e.target === 'number' ? e.target : nodesRef.current.findIndex(n => n.id === e.target),
    })).filter(e => e.si >= 0 && e.ti >= 0);

    // Pre-compute background elements for theme
    const bgMemo = theme.initBackground ? theme.initBackground(W, H) : null;

    mouseRef.current = { x: W / 2, y: H / 2 };

    let frame = 0, rafId;

    // ── Simulate ────────────────────────────────────────────────────
    function simulate() {
      const ns = nodesRef.current, len = ns.length;
      for (let i = 0; i < len; i++) {
        if (ns[i].pinned) continue;
        for (let j = i+1; j < len; j++) {
          const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y;
          const d2 = dx*dx + dy*dy || 0.01, d = Math.sqrt(d2);
          const f  = PHY.repulsion / d2;
          const fx = dx/d*f, fy = dy/d*f;
          if (!ns[i].pinned) { ns[i].vx -= fx; ns[i].vy -= fy; }
          if (!ns[j].pinned) { ns[j].vx += fx; ns[j].vy += fy; }
        }
      }
      edges.forEach(({ si, ti, rest = PHY.springRest, k = PHY.springK }) => {
        const a = ns[si], b = ns[ti];
        const dx = b.x-a.x, dy = b.y-a.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
        const f  = (d - rest) * k, fx = dx/d*f, fy = dy/d*f;
        if (!a.pinned) { a.vx += fx; a.vy += fy; }
        if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
      });
      ns.forEach(n => {
        if (n.pinned) { n.x = W/2; n.y = H/2; return; }
        n.vx += (W/2 - n.x) * PHY.gravity;
        n.vy += (H/2 - n.y) * PHY.gravity;
        // Jitter — makes high-urgency nodes visibly vibrate
        if (n.jitter) { n.vx += (Math.random() - 0.5) * n.jitter * 2.2; n.vy += (Math.random() - 0.5) * n.jitter * 2.2; }
        n.vx *= PHY.damping; n.vy *= PHY.damping;
        n.x  += n.vx; n.y += n.vy;
        const p = PHY.boundary;
        if (n.x < p)     n.vx += 0.2*(p-n.x);
        if (n.x > W-p)   n.vx += 0.2*(W-p-n.x);
        if (n.y < p)     n.vy += 0.2*(p-n.y);
        if (n.y > H-p)   n.vy += 0.2*(H-p-n.y);
      });
    }

    // ── Render ──────────────────────────────────────────────────────
    function render() {
      const ns = nodesRef.current, t = frame / 60;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, W, H);

      // Center radial glow
      if (theme.glow) {
        const rg = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2, Math.min(W,H)*0.62);
        rg.addColorStop(0, theme.glow); rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      }

      // Per-theme background
      if (theme.drawBackground) theme.drawBackground(ctx, W, H, frame, bgMemo, mouseRef.current);

      // Edges
      const ea = theme.edgeAlpha ?? ['35', '12'];
      edges.forEach(({ si, ti, strong, edgeStyle }) => {
        const a = ns[si], b = ns[ti];
        const ca = theme.color(a.type), cb = theme.color(b.type);
        const style = edgeStyle ?? theme.edgeStyle ?? 'straight';
        const lg = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        lg.addColorStop(0, ca + ea[0]); lg.addColorStop(1, cb + ea[1]);
        ctx.strokeStyle = lg;
        ctx.lineWidth   = strong ? 1.4 : 0.7;
        drawEdge(ctx, a.x, a.y, b.x, b.y, style, frame);
        ctx.stroke();
      });

      const sel = selectedRef.current;

      // Nodes
      ns.forEach(n => {
        const r     = n.size ?? 7;
        const color = theme.color(n.type);
        const phi   = n.phase ?? 0;
        const shape = n.shape ?? theme.nodeShape ?? 'circle';
        const isSel = sel && sel.id === n.id;

        if (n.type === 'center') {
          const pulse = Math.sin(t * Math.PI * 0.9 + phi) * 0.5 + 0.5;
          [[r+36,0.04,0.02],[r+20,0.12,0.06],[r+10,0.28,0.10]].forEach(([ro,base,amp]) => {
            ctx.beginPath(); ctx.arc(n.x, n.y, ro + pulse*5, 0, Math.PI*2);
            ctx.strokeStyle = color; ctx.lineWidth = 1.2;
            ctx.globalAlpha = base + amp*pulse; ctx.stroke();
          });
          ctx.globalAlpha = 1;
          ctx.shadowColor = color; ctx.shadowBlur = 40;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2);
          ctx.fillStyle = color; ctx.fill(); ctx.shadowBlur = 0;
          ctx.font = '500 14px "DM Sans",system-ui,-apple-system,sans-serif';
          ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.92;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(n.label || '', n.x, n.y);
          ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
          return;
        }

        const pulse = Math.sin(t * 1.5 + phi) * 0.09 + 0.91;
        const rr    = r * pulse;

        // Selection ring
        if (isSel) {
          ctx.beginPath(); ctx.arc(n.x, n.y, rr + 7, 0, Math.PI*2);
          ctx.strokeStyle = color; ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
        }

        const shadowBlur = isSel ? (theme.nodeShadowBlur ?? 20) * 1.6 : (theme.nodeShadowBlur ?? 10);
        ctx.shadowColor = color; ctx.shadowBlur = shadowBlur;
        getShapePath(ctx, n.x, n.y, rr, shape);
        ctx.fillStyle = color; ctx.globalAlpha = isSel ? 1 : 0.82;
        ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;

        // 3-D sphere highlight — soft white radial sheen on top-left
        if (theme.nodeStyle === 'sphere' && shape === 'circle') {
          const hg = ctx.createRadialGradient(
            n.x - rr * 0.32, n.y - rr * 0.36, rr * 0.02,
            n.x + rr * 0.1,  n.y + rr * 0.1,  rr * 1.05
          );
          hg.addColorStop(0,   'rgba(255,255,255,0.52)');
          hg.addColorStop(0.38,'rgba(255,255,255,0.12)');
          hg.addColorStop(1,   'rgba(0,0,0,0.18)');
          ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
          ctx.fillStyle = hg; ctx.globalAlpha = 0.75; ctx.fill(); ctx.globalAlpha = 1;
        }

        // Inner ring for certain types (business warmth)
        if (n.innerRing) {
          ctx.beginPath(); ctx.arc(n.x, n.y, rr * 0.55, 0, Math.PI*2);
          ctx.strokeStyle = color + '60'; ctx.lineWidth = 1; ctx.stroke();
        }

        if (n.label) {
          const maxCh = 24;
          const lbl   = n.label.length > maxCh ? n.label.slice(0, maxCh-1) + '…' : n.label;
          ctx.font      = theme.labelFont ?? '13px "DM Sans",system-ui,-apple-system,sans-serif';
          ctx.fillStyle = theme.label ?? 'rgba(255,255,255,0.4)';
          ctx.globalAlpha = isSel ? 0.9 : 0.55;
          ctx.textAlign = 'center';
          ctx.fillText(lbl, n.x, n.y + rr + 15);
          ctx.globalAlpha = 1;
        }
      });

      // Per-theme foreground (drawn AFTER nodes — enables true canvas reflection)
      if (theme.drawForeground) {
        // Snapshot current canvas into offscreen buffer, then pass it for reflection
        if (snap.width !== W * dpr || snap.height !== H * dpr) {
          snap.width = W * dpr; snap.height = H * dpr;
        }
        snapCtx.clearRect(0, 0, snap.width, snap.height);
        snapCtx.drawImage(canvas, 0, 0);
        theme.drawForeground(ctx, W, H, frame, bgMemo, mouseRef.current, snap);
      }

      frame++;
    }

    function loop() { simulate(); render(); rafId = requestAnimationFrame(loop); }
    rafId = requestAnimationFrame(loop);

    // ── Events ──────────────────────────────────────────────────────
    function getXY(e) {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function handleClick(e) {
      const [mx, my] = getXY(e);
      const hit = hitNode(nodesRef.current, mx, my);
      if (hit && hit.type !== 'center') {
        selectedRef.current = selectedRef.current?.id === hit.id ? null : hit;
        onClickRef.current?.(selectedRef.current);
      } else if (!hit) {
        selectedRef.current = null;
        onClickRef.current?.(null);
      }
    }

    function handleMouseMove(e) {
      const [mx, my] = getXY(e);
      mouseRef.current = { x: mx, y: my };
      const hit = hitNode(nodesRef.current, mx, my);
      canvas.style.cursor = (hit && hit.type !== 'center') ? 'pointer' : 'default';
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
  }, [nodeDefs, edgeDefs, theme]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
