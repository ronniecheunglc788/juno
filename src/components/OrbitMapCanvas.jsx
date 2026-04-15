import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// ── Three.js scene palette (dark / space) ─────────────────────────────────────
const C = {
  gold:   0xC9A84C,
  purple: 0x9B8FF5,
  blue:   0x6BAED6,
  red:    0xF08060,
  center: 0xC9A84C,
};

// ── Juno UI palette (overlays, panels, pills) ─────────────────────────────────
const CSS = {
  // scene node colours (used in labels / tooltip)
  gold:   '#C9A84C',
  purple: '#9B8FF5',
  blue:   '#6BAED6',
  red:    '#F08060',
  // Juno brand
  primary: '#5375A7',
  brand:   '#4A6993',
  nav:     '#8C9DAE',
  bg:      '#F3F1E8',
  text:    '#2D3A4A',
  dim:     '#8C9DAE',
};

const RING_CONFIG = [
  null,
  { radius: 5.8,  tilt: 0.22,  speed: 0.00095, spread: 0.65 },
  { radius: 9.6,  tilt: -0.30, speed: 0.00052, spread: 0.48 },
  { radius: 13.6, tilt: 0.14,  speed: 0.00026, spread: 0.32 },
];

const FILTERS = [
  { id: null,       label: 'All',      dot: null        },
  { id: 'person',   label: 'People',   dot: CSS.purple  },
  { id: 'routine',  label: 'Routines', dot: CSS.blue    },
  { id: 'pattern',  label: 'Patterns', dot: CSS.gold    },
  { id: 'drifting', label: 'Drifting', dot: CSS.red     },
];

const N_ARC = 28;

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

function makeRingCurve(radius, tilt, segments = 160) {
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

// Sprite texture for soft circular glow
function makeGlowTexture(hexColor, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   hexColor + 'cc');
  g.addColorStop(0.3, hexColor + '55');
  g.addColorStop(1,   hexColor + '00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OrbitMapCanvas({ entities = [], patterns = [], userName = '', userLabel = '', onDraftEmail }) {
  const mountRef       = useRef(null);
  const threeRef       = useRef({});
  const nodeDataRef    = useRef([]);
  const connLinesRef   = useRef([]);
  const animRef        = useRef(null);
  const sceneGroupRef  = useRef(null);
  const filterRef      = useRef(null);
  const hoveredRef     = useRef(null);
  const autoRotateRef  = useRef(true);
  const isDraggingRef  = useRef(false);
  const lastMouseRef   = useRef({ x: 0, y: 0 });
  const dragDistRef    = useRef(0);
  const rotVelocityRef = useRef({ x: 0, y: 0 });
  const resetViewRef   = useRef(false);

  const [selected,     setSelected]     = useState(null);
  const [autoRotate,   setAutoRotate]   = useState(true);
  const [tooltip,      setTooltip]      = useState(null);
  const [labelData,    setLabelData]    = useState([]);
  const [hinted,       setHinted]       = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => { filterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // ── Boot Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!entities.length) return;
    const mount = mountRef.current;
    if (!mount) return;

    // Clean up prior scene
    cancelAnimationFrame(animRef.current);
    if (threeRef.current.renderer) {
      threeRef.current.renderer.dispose();
      if (mount.contains(threeRef.current.renderer.domElement))
        mount.removeChild(threeRef.current.renderer.domElement);
    }

    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060E, 0.016);
    scene.background = new THREE.Color(0x06060E);

    const group = new THREE.Group();
    scene.add(group);
    sceneGroupRef.current = group;

    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 200);
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x06060E);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    threeRef.current = { scene, camera, renderer, clock: new THREE.Clock() };

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1A1030, 2.5));
    const sunLight = new THREE.PointLight(C.gold, 55, 26);
    sunLight.castShadow = true;
    group.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0x3C3489, 1.2);
    fillLight.position.set(-8, 10, -4);
    scene.add(fillLight);

    // ── Stars ─────────────────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const STAR_N = 2800;
    const starPos = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      const r  = 55 + Math.random() * 90;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      starPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i*3+2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, sizeAttenuation: true, transparent: true, opacity: 0.7 })
    ));

    // ── Ring paths (dashed look via segmented lines) ───────────────────────
    [1, 2, 3].forEach(r => {
      const { radius, tilt } = RING_CONFIG[r];
      // Main ring line
      const pts = makeRingCurve(radius, tilt);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo,
        new THREE.LineBasicMaterial({ color: 0x8C9DAE, transparent: true, opacity: 0.18 })
      ));
      // Outer glow ring (slightly larger, more transparent)
      const pts2 = makeRingCurve(radius + 0.08, tilt);
      const geo2 = new THREE.BufferGeometry().setFromPoints(pts2);
      group.add(new THREE.Line(geo2,
        new THREE.LineBasicMaterial({ color: 0x5375A7, transparent: true, opacity: 0.06 })
      ));
    });

    // ── Equatorial disc (translucent) ─────────────────────────────────────
    const discGeo = new THREE.RingGeometry(4.5, 15.8, 160);
    group.add(new THREE.Mesh(discGeo,
      new THREE.MeshBasicMaterial({ color: 0x5375A7, transparent: true, opacity: 0.035, side: THREE.DoubleSide })
    ));

    // Inner disc glow ring
    const innerDiscGeo = new THREE.RingGeometry(4.4, 5.0, 80);
    group.add(new THREE.Mesh(innerDiscGeo,
      new THREE.MeshBasicMaterial({ color: 0x5375A7, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
    ));

    // ── Center — icosahedron (more interesting than a sphere) ──────────────
    const coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 2),
      new THREE.MeshStandardMaterial({
        color:            0x5375A7,
        emissive:         0x3A5A8A,
        emissiveIntensity: 0.7,
        roughness:        0.15,
        metalness:        0.8,
        transparent:      true,
        opacity:          0.92,
      })
    );
    group.add(coreMesh);

    // Wire cage around center
    const wireGeo = new THREE.IcosahedronGeometry(1.22, 1);
    const wireMesh = new THREE.Mesh(wireGeo,
      new THREE.MeshBasicMaterial({ color: 0x8C9DAE, wireframe: true, transparent: true, opacity: 0.18 })
    );
    group.add(wireMesh);

    // Multi-layer center glow sprites
    const centerGlowTex = makeGlowTexture('#C9A84C');
    [
      { s: 5.5, op: 0.18 }, { s: 9,   op: 0.10 },
      { s: 14,  op: 0.06 }, { s: 20,  op: 0.03 },
    ].forEach(({ s, op }) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: centerGlowTex, transparent: true,
        blending: THREE.NormalBlending, opacity: op,
        depthWrite: false,
      }));
      sp.scale.set(s, s, 1);
      group.add(sp);
    });

    // ── Entity nodes ────────────────────────────────────────────────────────
    const nodeData = [];
    entities.forEach(entity => {
      const ringEnts = entities.filter(e => e.orbit_ring === entity.orbit_ring);
      const idx = ringEnts.indexOf(entity);
      const angle = (idx / ringEnts.length) * Math.PI * 2 + entity.orbit_ring * 1.1;

      const r = 0.22 + entity.strength * 0.32;
      const col = nodeColorHex(entity);
      const colCSS = '#' + col.toString(16).padStart(6, '0');

      // Node sphere — smooth, glossy
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshStandardMaterial({
          color:             col,
          emissive:          col,
          emissiveIntensity: entity.drifting ? 0.2 : 0.45,
          roughness:         0.12,
          metalness:         0.75,
          transparent:       true,
          opacity:           1.0,
        })
      );
      mesh.userData = { entity };
      mesh.castShadow = true;

      // Invisible hit sphere
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(r * 3.2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.userData = { isHit: true, entity };
      mesh.add(hit);

      // Drifting alert ring
      if (entity.drifting) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r * 2.0, 0.035, 8, 36),
          new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.55 })
        );
        ring.userData = { isAlertRing: true };
        mesh.add(ring);
      }

      // Node glow sprite
      const glowTex = makeGlowTexture(colCSS, 96);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true,
        blending: THREE.NormalBlending,
        opacity: 0.6, depthWrite: false,
      }));
      const gs = r * 4.5;
      sprite.scale.set(gs, gs, 1);
      mesh.add(sprite);

      group.add(mesh);
      nodeData.push({ mesh, entity, angle, ringIdx: idx, ringTotal: ringEnts.length });
    });
    nodeDataRef.current = nodeData;

    // ── Connection arcs ─────────────────────────────────────────────────────
    const connLines = patterns.map(p => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_ARC * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x8C9DAE, transparent: true, opacity: 0.28,
      }));
      line.userData = { from: p.from_entity, to: p.to_entity };
      group.add(line);
      return line;
    });
    connLinesRef.current = connLines;

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ─────────────────────────────────────────────────────────────
    const _arcA   = new THREE.Vector3();
    const _arcB   = new THREE.Vector3();
    const _arcMid = new THREE.Vector3();
    const _resetTarget = new THREE.Vector3(0, 12, 24);
    let frame = 0;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      frame++;
      const t = threeRef.current.clock.getElapsedTime();

      // ── Auto-rotate / momentum ──────────────────────────────────────────
      if (resetViewRef.current) {
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, 0.09);
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.09);
        camera.position.lerp(_resetTarget, 0.09);
        if (autoRotateRef.current) group.rotation.y += 0.0007;
        if (Math.abs(group.rotation.x) < 0.001 && camera.position.distanceTo(_resetTarget) < 0.05) {
          group.rotation.x = 0; group.rotation.z = 0;
          camera.position.copy(_resetTarget);
          resetViewRef.current = false;
        }
      } else if (!isDraggingRef.current) {
        if (autoRotateRef.current) group.rotation.y += 0.0007;
        group.rotation.y += rotVelocityRef.current.y;
        group.rotation.x += rotVelocityRef.current.x;
        group.rotation.x = Math.max(-1.1, Math.min(1.1, group.rotation.x));
        rotVelocityRef.current.x *= 0.92;
        rotVelocityRef.current.y *= 0.92;
      }

      // ── Center pulse ────────────────────────────────────────────────────
      const pulse = 0.6 + Math.sin(t * 1.2) * 0.14;
      coreMesh.material.emissiveIntensity = pulse;
      sunLight.intensity = 48 + Math.sin(t * 1.4) * 10;
      // Slowly rotate wire cage counter to the group
      wireMesh.rotation.y = -t * 0.18;
      wireMesh.rotation.x =  t * 0.09;

      // ── Orbiting nodes ──────────────────────────────────────────────────
      nodeData.forEach(nd => {
        nd.angle += RING_CONFIG[nd.entity.orbit_ring].speed;
        const { radius, tilt, spread } = RING_CONFIG[nd.entity.orbit_ring];
        const bandT = nd.ringTotal > 1 ? nd.ringIdx / (nd.ringTotal - 1) - 0.5 : 0;
        const r3d = radius + bandT * spread;
        const a = nd.angle;
        nd.mesh.position.set(
          r3d * Math.cos(a),
          Math.sin(a) * r3d * Math.sin(tilt),
          r3d * Math.sin(a),
        );

        const filter = filterRef.current;
        const matches = entityMatchesFilter(nd.entity, filter);
        const isHovered = hoveredRef.current === nd.entity.id;
        const targetScale = isHovered ? (matches ? 1.6 : 0.15) : (matches ? 1.0 : 0.07);
        nd.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
        nd.mesh.material.opacity = matches ? 1.0 : 0.07;

        // Emissive breathe
        if (!nd.entity.drifting) {
          nd.mesh.material.emissiveIntensity = 0.35 + Math.sin(t * 0.9 + nd.ringIdx * 0.7) * 0.12;
        }

        // Drifting pulse
        if (nd.entity.drifting) {
          nd.mesh.material.emissiveIntensity = 0.18 + Math.sin(t * 2.4 + nd.entity.orbit_ring) * 0.14;
          nd.mesh.children.forEach(c => {
            if (c.userData.isAlertRing) {
              c.material.opacity = 0.28 + Math.sin(t * 2.2) * 0.22;
              c.rotation.z += 0.013;
            }
          });
        }
      });

      // ── Connection arcs ─────────────────────────────────────────────────
      connLines.forEach(line => {
        const fNode = nodeData.find(n => n.entity.id === line.userData.from);
        const tNode = nodeData.find(n => n.entity.id === line.userData.to);
        if (!fNode || !tNode) return;
        _arcA.copy(fNode.mesh.position);
        _arcB.copy(tNode.mesh.position);
        _arcMid.addVectors(_arcA, _arcB).multiplyScalar(0.5);
        const dist = _arcMid.length();
        _arcMid.normalize().multiplyScalar(dist + 3.0 + dist * 0.20);
        const pos = line.geometry.attributes.position;
        for (let i = 0; i < N_ARC; i++) {
          const s = i / (N_ARC - 1), om = 1 - s;
          pos.setXYZ(i,
            om*om*_arcA.x + 2*om*s*_arcMid.x + s*s*_arcB.x,
            om*om*_arcA.y + 2*om*s*_arcMid.y + s*s*_arcB.y,
            om*om*_arcA.z + 2*om*s*_arcMid.z + s*s*_arcB.z,
          );
        }
        pos.needsUpdate = true;
        line.material.opacity = 0.15 + Math.sin(t * 0.8 + frame * 0.01) * 0.08;
      });

      // ── Label projection ────────────────────────────────────────────────
      if (frame % 2 === 0) {
        const W2 = mount.clientWidth, H2 = mount.clientHeight;
        setLabelData(nodeData.map(nd => {
          const wp = nd.mesh.position.clone().applyEuler(group.rotation);
          const sp = wp.clone().project(camera);
          return { id: nd.entity.id, x: (sp.x*0.5+0.5)*W2, y: (-sp.y*0.5+0.5)*H2, behind: sp.z > 1 };
        }));
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
  }, [entities, patterns]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-to-zoom ─────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const onWheel = ev => {
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
  const getHit = useCallback(ev => {
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
    const meshes = [];
    nodeDataRef.current.forEach(nd => {
      meshes.push(nd.mesh);
      nd.mesh.children.forEach(c => { if (c.userData.isHit) meshes.push(c); });
    });
    const hits = ray.intersectObjects(meshes);
    if (!hits.length) return null;
    const obj = hits[0].object;
    return obj.userData.isHit
      ? obj.userData.entity
      : obj.userData.entity || nodeDataRef.current.find(n => n.mesh === obj)?.entity;
  }, []);

  const handlePointerDown = useCallback(ev => {
    if (ev.button !== 0) return;
    isDraggingRef.current = true;
    dragDistRef.current = 0;
    lastMouseRef.current = { x: ev.clientX, y: ev.clientY };
    rotVelocityRef.current = { x: 0, y: 0 };
    ev.currentTarget.setPointerCapture(ev.pointerId);
    mountRef.current.style.cursor = 'grabbing';
  }, []);

  const handlePointerMove = useCallback(ev => {
    if (isDraggingRef.current) {
      const dx = ev.clientX - lastMouseRef.current.x;
      const dy = ev.clientY - lastMouseRef.current.y;
      dragDistRef.current += Math.sqrt(dx*dx + dy*dy);
      const g = sceneGroupRef.current;
      const sense = 0.006;
      g.rotation.y += dx * sense;
      g.rotation.x = Math.max(-1.1, Math.min(1.1, g.rotation.x + dy * sense));
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

  const handlePointerUp = useCallback(ev => {
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

  const handleClick = useCallback(ev => {
    if (dragDistRef.current > 6) { dragDistRef.current = 0; return; }
    const entity = getHit(ev);
    setTooltip(null);
    if (entity) {
      setSelected(prev => prev?.id === entity.id ? null : entity);
      setHinted(true);
    } else {
      setSelected(null);
    }
  }, [getHit]);

  const driftingCount = entities.filter(e => e.drifting).length;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#06060E', overflow: 'hidden', fontFamily: "'DM Sans','Inter',system-ui,sans-serif" }}>

      {/* Canvas mount */}
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />

      {/* ── Floating labels ──────────────────────────────────────────────── */}
      {labelData.map(lp => {
        if (lp.behind) return null;
        const entity = entities.find(e => e.id === lp.id);
        if (!entity) return null;
        const isSelected = selected?.id === lp.id;
        const matches = entityMatchesFilter(entity, activeFilter);
        const dimmed = (selected && !isSelected) || !matches;
        const color = nodeColorCSS(entity);
        return (
          <div key={lp.id} style={{
            position: 'absolute', left: lp.x, top: lp.y + 16,
            transform: 'translateX(-50%)', pointerEvents: 'none',
            opacity: dimmed ? 0.06 : 1, transition: 'opacity 0.25s',
          }}>
            <div style={{
              fontSize: isSelected ? 13 : 12,
              fontWeight: isSelected ? 700 : 600,
              color: isSelected ? '#fff' : '#d8d8d8',
              whiteSpace: 'nowrap', lineHeight: 1.3,
              textShadow: '0 1px 10px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,1)',
            }}>
              {entity.drifting && <span style={{ color: CSS.red, marginRight: 3 }}>●</span>}
              {entity.name}
            </div>
            {isSelected && (
              <div style={{
                fontSize: 11, color, marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap',
                textShadow: '0 1px 6px rgba(0,0,0,1)',
              }}>
                {entity.label}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Center label ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translateX(-50%) translateY(36px)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        {userName && (
          <div style={{
            color: '#fff', fontWeight: 800, fontSize: 17,
            textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            letterSpacing: '-0.3px',
          }}>
            {userName}
          </div>
        )}
        {userLabel && (
          <div style={{
            color: CSS.gold, fontSize: 11, marginTop: 4,
            fontWeight: 600, letterSpacing: '0.3px',
            textShadow: '0 1px 8px rgba(0,0,0,0.9)',
          }}>
            {userLabel}
          </div>
        )}
        <div style={{ color: '#555', fontSize: 10, marginTop: 3, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
          {entities.length} signals · {patterns.length} connections
        </div>
      </div>

      {/* ── Hover tooltip ────────────────────────────────────────────────── */}
      {tooltip && !selected && (
        <div style={{
          position: 'fixed',
          left: Math.min(tooltip.x + 16, window.innerWidth - 250),
          top: Math.max(tooltip.y - 14, 10),
          background: CSS.bg,
          border: `1px solid ${nodeColorCSS(tooltip.entity)}40`,
          borderRadius: 14, padding: '13px 16px',
          pointerEvents: 'none', zIndex: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          maxWidth: 250, backdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: nodeColorCSS(tooltip.entity),
              boxShadow: `0 0 6px ${nodeColorCSS(tooltip.entity)}88`,
            }} />
            <div style={{ color: CSS.text, fontWeight: 700, fontSize: 14 }}>{tooltip.entity.name}</div>
          </div>
          <div style={{ color: CSS.nav, fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{tooltip.entity.label}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ color: CSS.nav, fontSize: 11 }}>
              Strength <span style={{ color: CSS.primary, fontWeight: 700 }}>{Math.round(tooltip.entity.strength * 100)}%</span>
            </div>
            <div style={{ color: CSS.nav, fontSize: 11 }}>Ring {tooltip.entity.orbit_ring}</div>
          </div>
          <div style={{ color: CSS.nav, fontSize: 10, marginTop: 8, borderTop: `1px solid rgba(74,105,147,0.12)`, paddingTop: 7 }}>
            Click to open →
          </div>
        </div>
      )}

      {/* ── Filter pills ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 50,
      }}>
        {FILTERS.map(f => {
          const active = activeFilter === f.id;
          const count = f.id === null ? entities.length
            : f.id === 'drifting' ? entities.filter(e => e.drifting).length
            : entities.filter(e => e.type === f.id).length;
          return (
            <button
              key={String(f.id)}
              onClick={() => setActiveFilter(active ? null : f.id)}
              style={{
                background: active ? CSS.bg : 'rgba(243,241,232,0.15)',
                border: `1px solid ${active ? 'rgba(243,241,232,0.5)' : 'rgba(243,241,232,0.12)'}`,
                borderRadius: 20, padding: '5px 13px',
                cursor: 'pointer', transition: 'all 0.18s',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {f.dot && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: f.dot, display: 'inline-block',
                }} />
              )}
              <span style={{ color: active ? CSS.text : '#aaa', fontSize: 12, fontWeight: active ? 600 : 400 }}>
                {f.label}
              </span>
              <span style={{
                background: active ? 'rgba(45,58,74,0.1)' : 'rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '1px 6px',
                fontSize: 10, color: active ? CSS.text : '#666', fontWeight: 600,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Drifting badge ───────────────────────────────────────────────── */}
      {driftingCount > 0 && (
        <button
          onClick={() => setActiveFilter(f => f === 'drifting' ? null : 'drifting')}
          style={{
            position: 'absolute', top: 18, right: selected ? 384 : 20,
            background: 'rgba(184,92,92,0.08)',
            border: '1px solid rgba(184,92,92,0.25)',
            borderRadius: 20, padding: '6px 14px',
            cursor: 'pointer', zIndex: 50,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 1px 4px rgba(184,92,92,0.08)',
            transition: 'right 0.3s ease',
          }}
        >
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: CSS.red,
            animation: 'orbit-pulse-red 1.8s ease-in-out infinite',
          }} />
          <span style={{ color: CSS.red, fontSize: 11, fontWeight: 600 }}>
            {driftingCount} drifting
          </span>
        </button>
      )}

      {/* ── View controls ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 24, right: selected ? 384 : 20,
        display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end',
        zIndex: 50, transition: 'right 0.3s ease',
      }}>
        <button
          onClick={() => { resetViewRef.current = true; rotVelocityRef.current = { x: 0, y: 0 }; }}
          style={controlBtnStyle}
        >
          <span style={{ fontSize: 12, color: CSS.nav, fontWeight: 500 }}>↺ Reset view</span>
        </button>
        <button onClick={() => setAutoRotate(r => !r)} style={{
          ...controlBtnStyle,
          background: autoRotate ? CSS.bg : 'rgba(243,241,232,0.08)',
          border: `1px solid ${autoRotate ? 'rgba(74,105,147,0.35)' : 'rgba(243,241,232,0.15)'}`,
        }}>
          <span style={{ fontSize: 12, color: autoRotate ? CSS.brand : '#888', fontWeight: autoRotate ? 600 : 400 }}>
            {autoRotate ? '⟳ rotating' : '⏸ paused'}
          </span>
        </button>
      </div>

      {/* ── Onboarding hint ──────────────────────────────────────────────── */}
      {!hinted && (
        <div style={{
          position: 'absolute', bottom: 120, right: 20,
          background: CSS.bg, border: `1px solid rgba(74,105,147,0.25)`,
          borderRadius: 10, padding: '9px 18px', pointerEvents: 'none', zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <span style={{ color: CSS.brand, fontSize: 13, fontWeight: 600 }}>
            Drag to rotate · scroll to zoom · click to explore
          </span>
        </div>
      )}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 80, left: 20, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 50 }}>
        {[
          ['people',   CSS.primary],
          ['routines', CSS.brand],
          ['patterns', CSS.nav],
          ['drifting', CSS.red],
        ].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: '#777', fontSize: 12, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {selected && (
        <DetailPanel
          entity={selected}
          patterns={patterns}
          onClose={() => setSelected(null)}
          onDraftEmail={onDraftEmail}
        />
      )}

      <style>{`
        @keyframes orbit-pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

const controlBtnStyle = {
  background: CSS.bg,
  border: `1px solid rgba(74,105,147,0.25)`,
  borderRadius: 20, padding: '6px 14px',
  cursor: 'pointer', backdropFilter: 'blur(12px)',
  display: 'flex', alignItems: 'center', gap: 7,
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  transition: 'all 0.2s',
};

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ entity, patterns, onClose, onDraftEmail }) {
  const color = nodeColorCSS(entity);
  const related = patterns.filter(p =>
    p.from_entity === entity.id || p.to_entity === entity.id
  );
  const isEmail = entity.rawData && (entity.rawData.messageId || entity.rawData.threadId || entity.rawData.from);

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 360, height: '100%',
      background: 'rgba(250,249,244,0.98)',
      borderLeft: '1px solid rgba(140,157,174,0.18)',
      backdropFilter: 'blur(32px)',
      overflowY: 'auto', scrollbarWidth: 'none',
      padding: '32px 26px 36px',
      display: 'flex', flexDirection: 'column', gap: 22,
      zIndex: 300,
      boxShadow: '-4px 0 32px rgba(83,117,167,0.07)',
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color, marginBottom: 7, opacity: 0.85 }}>
            {entity.type}{entity.drifting ? ' · drifting' : ''}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: CSS.text, lineHeight: 1.2, letterSpacing: '-0.3px' }}>{entity.name}</div>
          <div style={{ fontSize: 12, color: CSS.dim, marginTop: 5, lineHeight: 1.4 }}>{entity.label}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(140,157,174,0.10)', border: '1px solid rgba(140,157,174,0.18)',
          borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
          color: CSS.dim, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>✕</button>
      </div>

      {/* Strength bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: CSS.dim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Signal strength</span>
          <span style={{ color, fontWeight: 700, fontSize: 11 }}>{Math.round(entity.strength * 100)}%</span>
        </div>
        <div style={{ height: 3, background: 'rgba(140,157,174,0.15)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: entity.drifting ? CSS.red : `linear-gradient(90deg, ${CSS.brand}, ${color})`,
            width: `${entity.strength * 100}%`,
          }} />
        </div>
      </div>

      {/* Source tags */}
      {entity.source?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {entity.source.map(s => (
            <span key={s} style={{
              background: 'rgba(83,117,167,0.07)', border: '1px solid rgba(83,117,167,0.15)',
              borderRadius: 6, padding: '3px 10px', fontSize: 11, color: CSS.primary, fontWeight: 500,
            }}>{s}</span>
          ))}
          <span style={{
            background: 'rgba(140,157,174,0.07)', border: '1px solid rgba(140,157,174,0.15)',
            borderRadius: 6, padding: '3px 10px', fontSize: 11, color: CSS.dim,
          }}>Ring {entity.orbit_ring}</span>
        </div>
      )}

      {/* Detail block */}
      <div style={{ background: 'rgba(83,117,167,0.04)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${color}18` }}>
        <div style={{ color: '#4A5A6A', fontSize: 13, lineHeight: 1.75 }}>{entity.detail || entity.label}</div>
      </div>

      {/* Connected patterns */}
      {related.length > 0 && (
        <div>
          <div style={{ color: CSS.dim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, fontWeight: 600 }}>
            Connected patterns
          </div>
          {related.map(p => (
            <div key={p.id} style={{
              background: 'rgba(196,169,107,0.06)', border: '1px solid rgba(196,169,107,0.18)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 8,
            }}>
              <div style={{ color: CSS.gold, fontSize: 12, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{p.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: CSS.dim, fontSize: 11 }}>{p.occurrences} occurrences</span>
                <span style={{ color: CSS.dim, fontSize: 11 }}>{Math.round(p.confidence * 100)}% conf.</span>
              </div>
              {p.action && <div style={{ color: CSS.primary, fontSize: 11, fontWeight: 500 }}>→ {p.action}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Email action */}
      {isEmail && onDraftEmail && (
        <button
          onClick={() => onDraftEmail(entity.rawData)}
          style={{
            background: 'rgba(83,117,167,0.07)', border: '1px solid rgba(83,117,167,0.2)',
            borderRadius: 10, padding: '11px 16px', cursor: 'pointer',
            color: CSS.primary, fontSize: 13, fontWeight: 600, textAlign: 'left',
            width: '100%', fontFamily: 'inherit',
          }}
        >
          ✉ Draft a reply →
        </button>
      )}

      {/* Orbit ring badge */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(140,157,174,0.12)' }}>
        <span style={{
          display: 'inline-block', background: 'rgba(83,117,167,0.06)',
          border: '1px solid rgba(83,117,167,0.14)', borderRadius: 7, padding: '5px 12px',
          fontSize: 11, color: CSS.dim, fontWeight: 500,
        }}>
          {entity.orbit_ring === 1 ? '⚡ Inner orbit — strong signal'
           : entity.orbit_ring === 2 ? '◎ Middle orbit — moderate'
           : '○ Outer orbit — fading'}
        </span>
      </div>
    </div>
  );
}
