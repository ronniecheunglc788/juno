import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { userData as defaultUserData } from '../data/userData';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  gold:   0xC9A84C,
  purple: 0x9B8FF5,
  blue:   0x6BAED6,
  red:    0xF08060,
};
const CSS = {
  gold:   '#C9A84C',
  purple: '#9B8FF5',
  blue:   '#6BAED6',
  red:    '#F08060',
  bg:     '#06060E',
};

const RING_CONFIG = [
  null,
  { radius: 5.6,  tilt: 0.18,  speed: 0.00090, spread: 0.7  },
  { radius: 9.2,  tilt: -0.28, speed: 0.00050, spread: 0.45 },
  { radius: 13.0, tilt: 0.12,  speed: 0.00025, spread: 0.3  },
];

const FILTERS = [
  { id: null,       label: 'All',      dot: null       },
  { id: 'person',   label: 'People',   dot: '#9B8FF5'  },
  { id: 'routine',  label: 'Routines', dot: '#6BAED6'  },
  { id: 'pattern',  label: 'Patterns', dot: '#C9A84C'  },
  { id: 'drifting', label: 'Drifting', dot: '#F08060'  },
];

const N_ARC = 22; // segments for curved connection arcs

const URGENT = [
  {
    id: 'u1',
    level: 'critical',
    title: 'Tuition due April 3',
    detail: 'Payment plan email from USC — unread. 3 days away. You pay via Flywire.',
    entity: 'e8',
  },
  {
    id: 'u2',
    level: 'critical',
    title: 'Tiger Consulting never got your email',
    detail: 'Your Stock Pitch Competition outreach bounced. They don\'t know you tried.',
    entity: 'e12',
  },
  {
    id: 'u3',
    level: 'warning',
    title: 'Nuria Wolfe is still waiting',
    detail: 'Emailed March 4 and March 9 about London internships. Both unread. No reply.',
    entity: 'e5',
  },
];

function nodeColorHex(entity) {
  if (entity.drifting) return C.red;
  if (entity.type === 'person' || entity.type === 'group') return C.purple;
  if (entity.type === 'routine') return C.blue;
  if (entity.type === 'pattern') return C.gold;
  return 0xaaaaaa;
}
function nodeColorCSS(entity) {
  if (entity.drifting) return CSS.red;
  if (entity.type === 'person' || entity.type === 'group') return CSS.purple;
  if (entity.type === 'routine') return CSS.blue;
  if (entity.type === 'pattern') return CSS.gold;
  return '#aaa';
}
function entityMatchesFilter(entity, filter) {
  if (!filter) return true;
  if (filter === 'drifting') return !!entity.drifting;
  return entity.type === filter;
}

function makeRingCurve(radius, tilt, segments = 128) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(
      radius * Math.cos(a),
      Math.sin(a) * radius * Math.sin(tilt),
      radius * Math.sin(a),
    ));
  }
  return pts;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OrbitMap({ user: userProp }) {
  const userData = userProp || defaultUserData;
  const mountRef      = useRef(null);
  const threeRef      = useRef({});
  const nodeDataRef   = useRef([]);
  const connLinesRef  = useRef([]);
  const animRef       = useRef(null);
  const sceneGroupRef = useRef(null);
  const filterRef      = useRef(null);           // synced from activeFilter state
  const hoveredRef     = useRef(null);           // entity id currently hovered
  const autoRotateRef  = useRef(true);           // synced from autoRotate state
  const isDraggingRef  = useRef(false);
  const lastMouseRef   = useRef({ x: 0, y: 0 });
  const dragDistRef    = useRef(0);
  const rotVelocityRef = useRef({ x: 0, y: 0 });
  const resetViewRef   = useRef(false);

  const [selected,      setSelected]      = useState(null);
  const [autoRotate,    setAutoRotate]    = useState(true);
  const [tooltip,       setTooltip]       = useState(null);
  const [labelData,     setLabelData]     = useState([]);
  const [hinted,        setHinted]        = useState(false);
  const [activeFilter,  setActiveFilter]  = useState(null);
  const [urgentOpen,    setUrgentOpen]    = useState(false);
  const [dismissedIDs,  setDismissedIDs]  = useState(new Set());

  // keep refs in sync so animate loop can read without closure staleness
  useEffect(() => { filterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // ── Boot Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060E, 0.016);

    const group = new THREE.Group();
    scene.add(group);
    sceneGroupRef.current = group;

    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
    camera.position.set(0, 11, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x06060E);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    threeRef.current = { scene, camera, renderer, clock: new THREE.Clock() };

    // Lights
    scene.add(new THREE.AmbientLight(0x1A1030, 2.5));
    const sun = new THREE.PointLight(C.gold, 55, 26);
    group.add(sun);
    const dirLight = new THREE.DirectionalLight(0x3C3489, 1.2);
    dirLight.position.set(-8, 10, -4);
    scene.add(dirLight);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const N = 2800;
    const sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 55 + Math.random() * 90;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      sp[i*3]   = r * Math.sin(ph) * Math.cos(th);
      sp[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      sp[i*3+2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, sizeAttenuation: true, transparent: true, opacity: 0.7 })
    ));

    // Ring paths
    [1, 2, 3].forEach(r => {
      const pts = makeRingCurve(RING_CONFIG[r].radius, RING_CONFIG[r].tilt);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.09 })
      ));
    });

    // Equatorial reference disc
    const discGeo = new THREE.RingGeometry(4.2, 15.5, 128);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x9B8FF5, transparent: true, opacity: 0.025,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // Center sun
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 32),
      new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.9 })
    );
    group.add(sunMesh);

    // Multi-shell corona glow
    [
      { r: 1.7,  opacity: 0.07 },
      { r: 2.4,  opacity: 0.04 },
      { r: 3.4,  opacity: 0.025 },
      { r: 4.8,  opacity: 0.012 },
      { r: 6.5,  opacity: 0.006 },
    ].forEach(({ r, opacity }) => {
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 24),
        new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity, side: THREE.BackSide })
      ));
    });

    // Entity nodes
    const nodeData = [];
    userData.entities.forEach(entity => {
      const ringEnts = userData.entities.filter(e => e.orbit_ring === entity.orbit_ring);
      const idx = ringEnts.indexOf(entity);
      const angle = (idx / ringEnts.length) * Math.PI * 2 + entity.orbit_ring * 1.1;

      const r = 0.24 + entity.strength * 0.34;
      const col = nodeColorHex(entity);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 28, 28),
        new THREE.MeshStandardMaterial({
          color: col, emissive: col,
          emissiveIntensity: entity.drifting ? 0.25 : 0.55,
          roughness: 0.3, metalness: 0.7,
          transparent: true, opacity: 1.0,
        })
      );
      mesh.userData = { entity };

      // Invisible hit sphere
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(r * 3.0, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.userData = { isHit: true, entity };
      mesh.add(hit);

      // Alert ring for drifting nodes
      if (entity.drifting) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r * 1.9, 0.04, 8, 32),
          new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.5 })
        );
        ring.userData = { isAlertRing: true };
        mesh.add(ring);
      }

      // Glow halo
      const hc = document.createElement('canvas');
      hc.width = hc.height = 64;
      const hctx = hc.getContext('2d');
      const hexStr = '#' + col.toString(16).padStart(6, '0');
      const grad = hctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, hexStr + '66');
      grad.addColorStop(1, hexStr + '00');
      hctx.fillStyle = grad;
      hctx.fillRect(0, 0, 64, 64);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(hc), transparent: true, blending: THREE.AdditiveBlending,
      }));
      const gs = r * 2.8;
      sprite.scale.set(gs, gs, 1);
      mesh.add(sprite);

      group.add(mesh);
      nodeData.push({ mesh, entity, angle, ringIdx: idx, ringTotal: ringEnts.length });
    });
    nodeDataRef.current = nodeData;

    // Connection arcs (Bezier curves)
    const connLines = userData.patterns.map(p => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_ARC * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: C.gold, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending,
      }));
      line.userData = { from: p.from_entity, to: p.to_entity };
      group.add(line);
      return line;
    });
    connLinesRef.current = connLines;

    // Resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ────────────────────────────────────────────────────────────
    const _arcA          = new THREE.Vector3();
    const _arcB          = new THREE.Vector3();
    const _arcMid        = new THREE.Vector3();
    const _resetCamTarget = new THREE.Vector3(0, 11, 22);
    let frame = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      frame++;
      const t = threeRef.current.clock.getElapsedTime();

      if (resetViewRef.current) {
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, 0.09);
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.09);
        camera.position.lerp(_resetCamTarget, 0.09);
        if (autoRotateRef.current) group.rotation.y += 0.0008;
        const done = Math.abs(group.rotation.x) < 0.001 && camera.position.distanceTo(_resetCamTarget) < 0.05;
        if (done) { group.rotation.x = 0; group.rotation.z = 0; camera.position.copy(_resetCamTarget); resetViewRef.current = false; }
      } else if (!isDraggingRef.current) {
        if (autoRotateRef.current) group.rotation.y += 0.0008;
        // Apply momentum with decay
        group.rotation.y += rotVelocityRef.current.y;
        group.rotation.x += rotVelocityRef.current.x;
        group.rotation.x = Math.max(-1.15, Math.min(1.15, group.rotation.x));
        rotVelocityRef.current.x *= 0.91;
        rotVelocityRef.current.y *= 0.91;
      }

      sunMesh.material.emissiveIntensity = 0.8 + Math.sin(t * 1.4) * 0.15;
      sun.intensity = 48 + Math.sin(t * 1.4) * 10;

      nodeData.forEach(nd => {
        nd.angle += RING_CONFIG[nd.entity.orbit_ring].speed;
        const { radius, tilt, spread } = RING_CONFIG[nd.entity.orbit_ring];
        // Spread nodes across a band within the ring so no two share the same orbit radius
        const bandT = nd.ringTotal > 1 ? nd.ringIdx / (nd.ringTotal - 1) - 0.5 : 0;
        const r3d = radius + bandT * spread;
        const a = nd.angle;
        nd.mesh.position.set(
          r3d * Math.cos(a),
          Math.sin(a) * r3d * Math.sin(tilt),
          r3d * Math.sin(a),
        );

        // Filter-aware scale & opacity
        const filter = filterRef.current;
        const matches = entityMatchesFilter(nd.entity, filter);
        const isHovered = hoveredRef.current === nd.entity.id;
        const targetScale = isHovered ? (matches ? 1.5 : 0.2) : (matches ? 1.0 : 0.08);
        nd.mesh.scale.setScalar(targetScale);
        nd.mesh.material.opacity = matches ? 1.0 : 0.08;

        // Drifting pulse
        if (nd.entity.drifting) {
          nd.mesh.material.emissiveIntensity = 0.2 + Math.sin(t * 2.2 + nd.entity.orbit_ring) * 0.15;
          nd.mesh.children.forEach(c => {
            if (c.userData.isAlertRing) {
              c.material.opacity = 0.3 + Math.sin(t * 2.2) * 0.25;
              c.rotation.z += 0.012;
            }
          });
        }
      });

      connLines.forEach(line => {
        const fNode = nodeData.find(n => n.entity.id === line.userData.from);
        const tNode = nodeData.find(n => n.entity.id === line.userData.to);
        if (!fNode || !tNode) return;
        _arcA.copy(fNode.mesh.position);
        _arcB.copy(tNode.mesh.position);
        // Bezier control point: midpoint lifted toward +Y
        _arcMid.addVectors(_arcA, _arcB).multiplyScalar(0.5);
        const dist = _arcMid.length();
        _arcMid.normalize().multiplyScalar(dist + 2.5 + dist * 0.22);
        const pos = line.geometry.attributes.position;
        for (let i = 0; i < N_ARC; i++) {
          const s = i / (N_ARC - 1);
          const om = (1 - s);
          const x = om * om * _arcA.x + 2 * om * s * _arcMid.x + s * s * _arcB.x;
          const y = om * om * _arcA.y + 2 * om * s * _arcMid.y + s * s * _arcB.y;
          const z = om * om * _arcA.z + 2 * om * s * _arcMid.z + s * s * _arcB.z;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
        line.material.opacity = 0.13 + Math.sin(t * 1.1) * 0.07;
      });

      // Project labels every 2 frames
      if (frame % 2 === 0) {
        const W = mount.clientWidth, H = mount.clientHeight;
        const labels = nodeData.map(nd => {
          const wp = nd.mesh.position.clone().applyEuler(group.rotation);
          const sp = wp.clone().project(camera);
          return {
            id: nd.entity.id,
            x: (sp.x * 0.5 + 0.5) * W,
            y: (-sp.y * 0.5 + 0.5) * H,
            behind: sp.z > 1,
          };
        });
        setLabelData(labels);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ── Scroll-to-zoom (non-passive so we can preventDefault) ─────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const onWheel = (ev) => {
      ev.preventDefault();
      const { camera } = threeRef.current;
      if (!camera) return;
      const factor = 1 + ev.deltaY * 0.0012;
      const newLen = camera.position.length() * factor;
      if (newLen > 9 && newLen < 60) camera.position.multiplyScalar(factor);
    };
    mount.addEventListener('wheel', onWheel, { passive: false });
    return () => mount.removeEventListener('wheel', onWheel);
  }, []);

  // ── Raycasting ─────────────────────────────────────────────────────────────
  const getHit = useCallback((ev) => {
    const mount = mountRef.current;
    const { camera } = threeRef.current;
    if (!camera) return null;
    const rect = mount.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const allMeshes = [];
    nodeDataRef.current.forEach(nd => {
      allMeshes.push(nd.mesh);
      nd.mesh.children.forEach(c => { if (c.userData.isHit) allMeshes.push(c); });
    });
    const hits = ray.intersectObjects(allMeshes);
    if (!hits.length) return null;
    const obj = hits[0].object;
    return obj.userData.isHit
      ? obj.userData.entity
      : obj.userData.entity || nodeDataRef.current.find(n => n.mesh === obj)?.entity;
  }, []);

  const handlePointerDown = useCallback((ev) => {
    if (ev.button !== 0) return;
    isDraggingRef.current = true;
    dragDistRef.current = 0;
    lastMouseRef.current = { x: ev.clientX, y: ev.clientY };
    rotVelocityRef.current = { x: 0, y: 0 };
    ev.currentTarget.setPointerCapture(ev.pointerId);
    mountRef.current.style.cursor = 'grabbing';
  }, []);

  const handlePointerMove = useCallback((ev) => {
    if (isDraggingRef.current) {
      const dx = ev.clientX - lastMouseRef.current.x;
      const dy = ev.clientY - lastMouseRef.current.y;
      dragDistRef.current += Math.sqrt(dx * dx + dy * dy);
      const group = sceneGroupRef.current;
      const sense = 0.006;
      group.rotation.y += dx * sense;
      group.rotation.x = Math.max(-1.15, Math.min(1.15, group.rotation.x + dy * sense));
      rotVelocityRef.current = { x: dy * sense * 0.35, y: dx * sense * 0.35 };
      lastMouseRef.current = { x: ev.clientX, y: ev.clientY };
      setTooltip(null);
      return;
    }
    const entity = getHit(ev);
    hoveredRef.current = entity?.id || null;
    if (entity) {
      mountRef.current.style.cursor = 'pointer';
      setTooltip({ x: ev.clientX, y: ev.clientY, entity });
    } else {
      mountRef.current.style.cursor = 'grab';
      setTooltip(null);
    }
  }, [getHit]);

  const handlePointerUp = useCallback((ev) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    ev.currentTarget?.releasePointerCapture?.(ev.pointerId);
    mountRef.current.style.cursor = 'grab';
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (isDraggingRef.current) return;
    hoveredRef.current = null;
    setTooltip(null);
    mountRef.current.style.cursor = 'default';
  }, []);

  const handleClick = useCallback((ev) => {
    if (dragDistRef.current > 6) { dragDistRef.current = 0; return; }
    const entity = getHit(ev);
    setTooltip(null);
    if (entity) {
      setSelected(prev => prev?.id === entity.id ? null : entity);
      setHinted(true);
      setUrgentOpen(false);
    } else {
      setSelected(null);
    }
  }, [getHit]);

  const openEntityFromAlert = (entityId) => {
    const entity = userData.entities.find(e => e.id === entityId);
    if (entity) { setSelected(entity); setUrgentOpen(false); setHinted(true); }
  };

  const visibleUrgent = URGENT.filter(u => !dismissedIDs.has(u.id));

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: CSS.bg, overflow: 'hidden' }}>

      {/* Canvas */}
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />

      {/* ── Floating labels ─────────────────────────────────────────────── */}
      {labelData.map(lp => {
        if (lp.behind) return null;
        const entity = userData.entities.find(e => e.id === lp.id);
        if (!entity) return null;
        const isSelected = selected?.id === lp.id;
        const matches = entityMatchesFilter(entity, activeFilter);
        const dimmed = (selected && !isSelected) || !matches;
        const color = nodeColorCSS(entity);
        return (
          <div key={lp.id} style={{
            position: 'absolute', left: lp.x, top: lp.y + 18,
            transform: 'translateX(-50%)', pointerEvents: 'none',
            opacity: dimmed ? 0.08 : 1, transition: 'opacity 0.3s',
          }}>
            <div style={{
              fontSize: isSelected ? 13 : 12, fontWeight: isSelected ? 700 : 600,
              color: isSelected ? '#fff' : '#d8d8d8',
              textShadow: '0 1px 10px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,1)',
              whiteSpace: 'nowrap', lineHeight: 1.3,
            }}>
              {entity.drifting && <span style={{ color: CSS.red, marginRight: 4 }}>●</span>}
              {entity.name}
            </div>
            {isSelected && (
              <div style={{ fontSize: 11, color, textShadow: '0 1px 6px rgba(0,0,0,1)', whiteSpace: 'nowrap', marginTop: 2, fontWeight: 500 }}>
                {entity.label}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Center label ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translateX(-50%) translateY(34px)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, textShadow: '0 2px 12px rgba(0,0,0,0.9)', letterSpacing: '-0.3px' }}>
          {userData.name}
        </div>
        <div style={{ color: CSS.gold, fontSize: 11, textShadow: '0 1px 8px rgba(0,0,0,0.9)', marginTop: 4, fontWeight: 600, letterSpacing: '0.3px' }}>
          USC '25 · LavaLab + Meridian · Perplexity
        </div>
        <div style={{ color: '#555', fontSize: 10, marginTop: 3, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
          {userData.weeks_on_breeze} weeks of context · {userData.apps_connected.length} apps
        </div>
      </div>

      {/* ── Hover tooltip ───────────────────────────────────────────────── */}
      {tooltip && !selected && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          left: Math.min(tooltip.x + 18, window.innerWidth - 260),
          top: Math.max(tooltip.y - 16, 10),
          background: 'rgba(8,8,18,0.97)',
          border: `1px solid ${nodeColorCSS(tooltip.entity)}40`,
          borderRadius: 14, padding: '13px 16px',
          pointerEvents: 'none', zIndex: 200,
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          maxWidth: 250, backdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              background: nodeColorCSS(tooltip.entity),
              boxShadow: `0 0 8px ${nodeColorCSS(tooltip.entity)}`,
            }} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{tooltip.entity.name}</div>
          </div>
          <div style={{ color: '#999', fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{tooltip.entity.label}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ color: '#666', fontSize: 11 }}>
              Strength <span style={{ color: CSS.gold, fontWeight: 700 }}>{Math.round(tooltip.entity.strength * 100)}%</span>
            </div>
            <div style={{ color: '#666', fontSize: 11 }}>Ring {tooltip.entity.orbit_ring}</div>
          </div>
          <div style={{ color: '#444', fontSize: 10, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 7 }}>
            Click to open full profile →
          </div>
        </div>
      )}

      {/* ── Filter pills ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 50,
      }}>
        {FILTERS.map(f => {
          const active = activeFilter === f.id;
          const countMap = { null: userData.entities.length, drifting: userData.entities.filter(e => e.drifting).length };
          const count = f.id === null ? userData.entities.length
            : f.id === 'drifting' ? userData.entities.filter(e => e.drifting).length
            : userData.entities.filter(e => e.type === f.id).length;
          return (
            <button
              key={String(f.id)}
              onClick={() => setActiveFilter(active ? null : f.id)}
              style={{
                background: active ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.55)',
                border: `1px solid ${active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 20, padding: '5px 13px',
                cursor: 'pointer', transition: 'all 0.18s',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {f.dot && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: f.dot,
                  display: 'inline-block',
                }} />
              )}
              <span style={{ color: active ? '#e8e8e8' : '#777', fontSize: 12, fontWeight: active ? 600 : 400 }}>{f.label}</span>
              <span style={{
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '1px 5px',
                fontSize: 10, color: active ? '#bbb' : '#444', fontWeight: 600,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Urgent alert button ─────────────────────────────────────────── */}
      {visibleUrgent.length > 0 && !urgentOpen && (
        <button
          onClick={() => { setUrgentOpen(true); setSelected(null); }}
          style={{
            position: 'absolute', top: 62, right: 26,
            background: 'rgba(240,128,96,0.12)',
            border: '1px solid rgba(240,128,96,0.35)',
            borderRadius: 22, padding: '8px 16px',
            cursor: 'pointer', zIndex: 50,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 0 20px rgba(240,128,96,0.12)',
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: CSS.red,
            boxShadow: `0 0 8px ${CSS.red}`,
            animation: 'pulse-red 1.8s ease-in-out infinite',
          }} />
          <span style={{ color: CSS.red, fontSize: 13, fontWeight: 700 }}>
            {visibleUrgent.length} need attention
          </span>
        </button>
      )}

      {/* ── Urgent panel ────────────────────────────────────────────────── */}
      {urgentOpen && (
        <div className="animate-slide-right" style={{
          position: 'absolute', top: 0, right: 0,
          width: 340, height: '100%',
          background: 'rgba(5,5,14,0.97)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(32px)',
          overflowY: 'auto', scrollbarWidth: 'none',
          padding: '36px 26px',
          display: 'flex', flexDirection: 'column', gap: 16,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ color: CSS.red, fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', marginBottom: 6 }}>
                Needs attention
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>
                {visibleUrgent.length} open item{visibleUrgent.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={() => setUrgentOpen(false)} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
              color: '#888', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {visibleUrgent.map(item => (
            <div key={item.id} style={{
              background: item.level === 'critical' ? 'rgba(240,128,96,0.06)' : 'rgba(201,168,76,0.06)',
              border: `1px solid ${item.level === 'critical' ? 'rgba(240,128,96,0.18)' : 'rgba(201,168,76,0.15)'}`,
              borderRadius: 14, padding: '16px 16px 14px',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                  background: item.level === 'critical' ? CSS.red : CSS.gold,
                  boxShadow: `0 0 8px ${item.level === 'critical' ? CSS.red : CSS.gold}`,
                }} />
                <div style={{ color: '#e8e8e8', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{item.title}</div>
              </div>
              <div style={{ color: '#888', fontSize: 13, lineHeight: 1.6, marginBottom: 14, paddingLeft: 18 }}>{item.detail}</div>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 18 }}>
                <button
                  onClick={() => openEntityFromAlert(item.entity)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    color: '#ccc', fontSize: 12, fontWeight: 600,
                  }}
                >View in orbit →</button>
                <button
                  onClick={() => setDismissedIDs(s => new Set([...s, item.id]))}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    color: '#555', fontSize: 12,
                  }}
                >Dismiss</button>
              </div>
            </div>
          ))}

          {visibleUrgent.length === 0 && (
            <div style={{ color: '#444', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              All clear.
            </div>
          )}
        </div>
      )}

      {/* ── View controls ───────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 86, right: 26,
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
        zIndex: 50,
      }}>
        {/* Reset View */}
        <button
          onClick={() => {
            resetViewRef.current = true;
            rotVelocityRef.current = { x: 0, y: 0 };
          }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 20, padding: '6px 14px',
            cursor: 'pointer', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Reset view</span>
        </button>

        {/* Auto-rotate toggle */}
        <button
          onClick={() => setAutoRotate(r => !r)}
          style={{
            background: autoRotate ? 'rgba(201,168,76,0.1)' : 'rgba(0,0,0,0.55)',
            border: `1px solid ${autoRotate ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 20, padding: '6px 14px',
            cursor: 'pointer', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 12, color: autoRotate ? CSS.gold : '#888', fontWeight: autoRotate ? 600 : 400 }}>
            {autoRotate ? 'Rotating' : 'Paused'}
          </span>
        </button>
      </div>

      {/* ── Onboarding hint ─────────────────────────────────────────────── */}
      {!hinted && (
        <div style={{
          position: 'absolute', bottom: 100, right: 32,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '8px 16px', pointerEvents: 'none',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ color: '#888', fontSize: 12 }}>Drag to rotate · scroll to zoom · click to explore</div>
        </div>
      )}

      {/* ── User label ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 62,
        right: (selected || urgentOpen) ? 372 : 28,
        textAlign: 'right', transition: 'right 0.35s ease', pointerEvents: 'none',
      }}>
        <div style={{ color: '#d0d0d0', fontWeight: 600, fontSize: 14 }}>{userData.name}</div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>hover to preview · click for detail</div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 32, padding: '10px 32px', display: 'flex', gap: 32,
        backdropFilter: 'blur(24px)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        {[
          ['2', 'products'],
          ['5', 'classes'],
          ['74%', 'unread'],
          [String(userData.stats.nudges_sent), 'nudges sent'],
          ['3', 'urgent'],
        ].map(([val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              color: label === 'unread' || label === 'urgent' ? CSS.red : CSS.gold,
              fontWeight: 800, fontSize: 19,
            }}>{val}</div>
            <div style={{ color: '#666', fontSize: 11, letterSpacing: '0.3px', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 100, left: 26, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          ['person / group', CSS.purple],
          ['routine',        CSS.blue],
          ['pattern',        CSS.gold],
          ['drifting',       CSS.red],
        ].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: '#777', fontSize: 12, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {selected && !urgentOpen && (
        <DetailPanel entity={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ entity, onClose }) {
  const color = nodeColorCSS(entity);
  const related = userData.patterns.filter(p =>
    p.from_entity === entity.id || p.to_entity === entity.id
  );

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 360, height: '100%',
      background: 'rgba(5,5,14,0.97)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(32px)',
      overflowY: 'auto', scrollbarWidth: 'none',
      padding: '80px 28px 36px',
      display: 'flex', flexDirection: 'column', gap: 24,
      animation: 'slide-in-right 0.3s cubic-bezier(0.22,1,0.36,1)',
      zIndex: 300,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color, marginBottom: 8, opacity: 0.9 }}>
            {entity.type}{entity.drifting ? ' · drifting' : ''}{entity.conversationBadge ? ' · told Breeze' : ''}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.4px' }}>{entity.name}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6, lineHeight: 1.4 }}>{entity.label}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
          color: '#888', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>✕</button>
      </div>

      {/* Strength */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Signal strength</span>
          <span style={{ color, fontWeight: 700, fontSize: 13 }}>{Math.round(entity.strength * 100)}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: entity.drifting ? CSS.red : `linear-gradient(90deg, #3C3489, ${color})`,
            width: `${entity.strength * 100}%`,
            boxShadow: `0 0 10px ${color}55`,
          }} />
        </div>
      </div>

      {/* Sources */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {(entity.source || []).map(s => (
          <span key={s} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 7, padding: '4px 11px', fontSize: 12, color: '#999', fontWeight: 500,
          }}>{s}</span>
        ))}
      </div>

      {/* Insight */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 18px', border: `1px solid ${color}20` }}>
        <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.75 }}>{entity.detail}</div>
      </div>

      {/* Patterns */}
      {related.length > 0 && (
        <div>
          <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>
            Connected patterns
          </div>
          {related.map(p => (
            <div key={p.id} style={{
              background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ color: CSS.gold, fontSize: 13, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{p.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666', fontSize: 12 }}>{p.occurrences} occurrences</span>
                <span style={{ color: '#666', fontSize: 12 }}>{Math.round(p.confidence * 100)}% confidence</span>
              </div>
              {p.action && <div style={{ color: CSS.blue, fontSize: 12, fontWeight: 500 }}>→ {p.action}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Breeze knows — surfaces conversation_insights tied to this entity */}
      {(() => {
        const keywords = entity.name.toLowerCase().split(/[\s·,]+/);
        const relevant = userData.conversation_insights.filter(insight =>
          keywords.some(k => k.length > 3 && insight.toLowerCase().includes(k))
        );
        if (!relevant.length) return null;
        return (
          <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: CSS.gold, marginBottom: 10 }}>
              Breeze already knows
            </div>
            {relevant.map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, marginBottom: i < relevant.length - 1 ? 10 : 0 }}>
                <span style={{ color: CSS.gold, fontSize: 11, marginTop: 2, flexShrink: 0 }}>✦</span>
                <div style={{ color: '#bbb', fontSize: 13, lineHeight: 1.65 }}>{insight}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Orbit ring */}
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{
          display: 'inline-block', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 12px',
          fontSize: 12, color: '#666', fontWeight: 500,
        }}>
          {entity.orbit_ring === 1 ? 'Inner orbit — strong signal'
           : entity.orbit_ring === 2 ? 'Middle orbit — moderate'
           : 'Outer orbit — fading'}
        </span>
      </div>
    </div>
  );
}
