import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SNAP_ANGLES = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];

function mk(geo, mat, cast = true, recv = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = recv;
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (rt, rb, h, s = 16) => new THREE.CylinderGeometry(rt, rb, h, s);
const S = (r, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs);

/* ─── Pastel textures ─────────────────────────────────────────────── */
function pinkWallTex() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const ctx = cv.getContext('2d');
  // Warm peachy-pink base
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#F2C5C5');
  grad.addColorStop(1, '#E8B0B8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  // Soft noise
  const d = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 6;
    d.data[i]     = Math.min(255, Math.max(0, d.data[i]     + n));
    d.data[i + 1] = Math.min(255, Math.max(0, d.data[i + 1] + n * 0.7));
    d.data[i + 2] = Math.min(255, Math.max(0, d.data[i + 2] + n * 0.8));
  }
  ctx.putImageData(d, 0, 0);
  // Subtle star dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
    const x = Math.random() * 512, y = Math.random() * 512;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
}

function warmWoodTex() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 512;
  const ctx = cv.getContext('2d');
  const PLANKS = ['#C4824A','#B87040','#CC8A50','#B87848','#C48048','#A86838'];
  const PW = 1024 / 6;
  for (let col = 0; col < 6; col++) {
    ctx.fillStyle = PLANKS[col];
    ctx.fillRect(col * PW, 0, PW - 2, 512);
    const g = ctx.createLinearGradient(col * PW, 0, col * PW + 5, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(col * PW, 0, PW, 512);
    for (let i = 0; i < 50; i++) {
      const x = col * PW + Math.random() * (PW - 2);
      ctx.strokeStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.04})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (Math.random()-0.5)*4, 170, x + (Math.random()-0.5)*4, 340, x + (Math.random()-0.5)*4, 512);
      ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2);
  return t;
}

function orangeSliceTex() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const ctx = cv.getContext('2d');
  const cx = 128, cy = 128, r = 115;
  // Outer rind
  ctx.fillStyle = '#F28030';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // White pith ring
  ctx.fillStyle = '#FFF3E0';
  ctx.beginPath(); ctx.arc(cx, cy, r - 10, 0, Math.PI * 2); ctx.fill();
  // Flesh segments
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 1) / segs) * Math.PI * 2;
    const am = (a1 + a2) / 2;
    ctx.fillStyle = i % 2 === 0 ? '#F5A040' : '#F8B055';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 14, a1, a2);
    ctx.closePath(); ctx.fill();
    // Segment divider
    ctx.strokeStyle = '#FFF3E0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(am) * (r - 14), cy + Math.sin(am) * (r - 14));
    ctx.stroke();
  }
  // Center
  ctx.fillStyle = '#F5A040';
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#FFF3E0'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke();
  const t = new THREE.CanvasTexture(cv);
  return t;
}

function tileFloorTex() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const ctx = cv.getContext('2d');
  const TILE_SIZE = 64;
  for (let row = 0; row < 512 / TILE_SIZE; row++) {
    for (let col = 0; col < 512 / TILE_SIZE; col++) {
      const light = (row + col) % 2 === 0;
      ctx.fillStyle = light ? '#F5ECD8' : '#EEE0C4';
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      // grout line
      ctx.fillStyle = '#D4C4A8';
      ctx.fillRect(col * TILE_SIZE + TILE_SIZE - 1, row * TILE_SIZE, 1, TILE_SIZE);
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE + TILE_SIZE - 1, TILE_SIZE, 1);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  return t;
}

/* ─── Starry night window texture ────────────────────────────────── */
function nightSkyTex() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1A2A5A');
  grad.addColorStop(0.5, '#2A4A88');
  grad.addColorStop(1, '#4A6AAA');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  // Stars
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256, y = Math.random() * 180;
    const r = 0.8 + Math.random() * 2;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // Sparkle cross
    if (Math.random() > 0.7) {
      ctx.strokeStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - r*3, y); ctx.lineTo(x + r*3, y);
      ctx.moveTo(x, y - r*3); ctx.lineTo(x, y + r*3);
      ctx.stroke();
    }
  }
  // Moon
  ctx.fillStyle = '#FFEEAA';
  ctx.beginPath(); ctx.arc(200, 50, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#F0D870';
  ctx.beginPath(); ctx.arc(200, 50, 15, 0, Math.PI * 2); ctx.fill();
  // Moon glow
  const moonGlow = ctx.createRadialGradient(200, 50, 15, 200, 50, 40);
  moonGlow.addColorStop(0, 'rgba(255,238,170,0.25)');
  moonGlow.addColorStop(1, 'rgba(255,238,170,0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath(); ctx.arc(200, 50, 40, 0, Math.PI * 2); ctx.fill();
  const t = new THREE.CanvasTexture(cv);
  return t;
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function CuteRoomCanvas({ targetAngleIndex = 0 }) {
  const mountRef  = useRef(null);
  const targetRef = useRef(SNAP_ANGLES[targetAngleIndex]);

  useEffect(() => {
    targetRef.current = SNAP_ANGLES[targetAngleIndex % 4];
  }, [targetAngleIndex]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── Renderer ─────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0xF5C8C8);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';

    let W = mount.offsetWidth  || window.innerWidth;
    let H = mount.offsetHeight || window.innerHeight;
    renderer.setSize(W, H);

    /* ── Scene ────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5C8C8);
    scene.fog = new THREE.Fog(0xF5C8C8, 24, 36);

    /* ── Camera (isometric) ───────────────────────────────────── */
    const ISO_ELEV    = Math.acos(1 / Math.sqrt(3));
    const DIST        = 18;
    const frustumSize = 13;
    const aspect      = W / H;
    const camera      = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,  frustumSize * aspect / 2,
       frustumSize / 2,           -frustumSize / 2,
      0.1, 120
    );
    let azimuth = targetRef.current;
    function setCam(az) {
      camera.position.set(DIST * Math.cos(az), DIST * Math.sin(ISO_ELEV), DIST * Math.sin(az));
      camera.lookAt(0, 1.0, 0);
    }
    setCam(azimuth);

    /* ── Lights ───────────────────────────────────────────────── */
    // Warm ambient fill
    scene.add(new THREE.AmbientLight(0xFFE0E8, 0.65));
    scene.add(new THREE.HemisphereLight(0xFFCCDD, 0x8844AA, 0.5));

    // Soft top light
    const sun = new THREE.DirectionalLight(0xFFEEDD, 0.7);
    sun.position.set(6, 14, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.far = 40;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // Window moonlight blue fill
    const moonLight = new THREE.SpotLight(0xAABBFF, 2.2, 10, Math.PI / 5, 0.6, 1.2);
    moonLight.position.set(3.2, 5.0, -0.6);
    moonLight.target.position.set(0, 0, 1.0);
    moonLight.castShadow = false;
    scene.add(moonLight); scene.add(moonLight.target);

    // Bathtub cosy glow
    const bathGlow = new THREE.PointLight(0xFFCC88, 1.2, 3.0, 2);
    bathGlow.position.set(0.5, 1.2, 0.5);
    scene.add(bathGlow);

    // Washing machine indicator glow
    const washerGlow = new THREE.PointLight(0x44CCFF, 0.6, 1.5, 2);
    washerGlow.position.set(-3.8, 0.8, -3.2);
    scene.add(washerGlow);

    /* ── Textures ─────────────────────────────────────────────── */
    const TEX = {
      pinkWall:  pinkWallTex(),
      wood:      warmWoodTex(),
      tile:      tileFloorTex(),
      orange:    orangeSliceTex(),
      nightSky:  nightSkyTex(),
    };

    /* ── Materials ────────────────────────────────────────────── */
    const M = {
      wall:      new THREE.MeshStandardMaterial({ map: TEX.pinkWall, roughness: 0.92, side: THREE.FrontSide }),
      floor:     new THREE.MeshStandardMaterial({ map: TEX.tile, roughness: 0.78 }),
      wood:      new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.75 }),
      // Teal / mint — bathtub, cabinet
      teal:      new THREE.MeshStandardMaterial({ color: 0x5DC8B8, roughness: 0.55, metalness: 0.08 }),
      tealDk:    new THREE.MeshStandardMaterial({ color: 0x3AADA0, roughness: 0.6 }),
      tealLt:    new THREE.MeshStandardMaterial({ color: 0x7EDDD0, roughness: 0.5 }),
      // Pastels
      pink:      new THREE.MeshStandardMaterial({ color: 0xF0A0B0, roughness: 0.88 }),
      pinkLt:    new THREE.MeshStandardMaterial({ color: 0xF5C0CC, roughness: 0.92 }),
      pinkDk:    new THREE.MeshStandardMaterial({ color: 0xD87888, roughness: 0.85 }),
      cream:     new THREE.MeshStandardMaterial({ color: 0xF8F0E0, roughness: 0.95 }),
      white:     new THREE.MeshStandardMaterial({ color: 0xF2F0EC, roughness: 0.88 }),
      whiteShiny:new THREE.MeshStandardMaterial({ color: 0xF8F8F8, roughness: 0.4, metalness: 0.05 }),
      peach:     new THREE.MeshStandardMaterial({ color: 0xF5A86A, roughness: 0.88 }),
      yellow:    new THREE.MeshStandardMaterial({ color: 0xF5D060, roughness: 0.85 }),
      yellowChk: new THREE.MeshStandardMaterial({ color: 0xF0C840, roughness: 0.88 }),
      orange:    new THREE.MeshStandardMaterial({ color: 0xF08040, roughness: 0.85 }),
      lemon:     new THREE.MeshStandardMaterial({ color: 0xEED840, roughness: 0.85 }),
      green:     new THREE.MeshStandardMaterial({ color: 0x3AAA50, roughness: 0.88 }),
      greenLt:   new THREE.MeshStandardMaterial({ color: 0x5ACC68, roughness: 0.88 }),
      greenDk:   new THREE.MeshStandardMaterial({ color: 0x228838, roughness: 0.88 }),
      pot:       new THREE.MeshStandardMaterial({ color: 0xD8A878, roughness: 0.82 }),
      potPink:   new THREE.MeshStandardMaterial({ color: 0xE8A0A0, roughness: 0.82 }),
      soil:      new THREE.MeshStandardMaterial({ color: 0x2A1808, roughness: 1.0 }),
      metal:     new THREE.MeshStandardMaterial({ color: 0xB0B8C0, roughness: 0.3, metalness: 0.75 }),
      chrome:    new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.1, metalness: 0.95 }),
      glass:     new THREE.MeshStandardMaterial({ color: 0x88BBFF, transparent: true, opacity: 0.25, roughness: 0.04 }),
      nightSky:  new THREE.MeshStandardMaterial({ map: TEX.nightSky, emissive: new THREE.Color(0x2244AA), emissiveIntensity: 0.3, roughness: 0.05 }),
      waterTeal: new THREE.MeshStandardMaterial({ color: 0x78D8D0, transparent: true, opacity: 0.85, roughness: 0.04, metalness: 0.05 }),
      catPink:   new THREE.MeshStandardMaterial({ color: 0xF0A888, roughness: 0.88 }),
      catWhite:  new THREE.MeshStandardMaterial({ color: 0xF8F4EE, roughness: 0.88 }),
      tangerine: new THREE.MeshStandardMaterial({ color: 0xF0882A, roughness: 0.85 }),
      char:      new THREE.MeshStandardMaterial({ color: 0xF5D080, roughness: 0.88 }),
      charDk:    new THREE.MeshStandardMaterial({ color: 0xD0A040, roughness: 0.88 }),
      bunny:     new THREE.MeshStandardMaterial({ color: 0xF8CCD8, roughness: 0.95 }),
      rope:      new THREE.MeshStandardMaterial({ color: 0xD0B898, roughness: 0.9 }),
      orangeRug: new THREE.MeshStandardMaterial({ map: TEX.orange, roughness: 0.85, side: THREE.FrontSide }),
    };

    const ROOM = 5;

    /* ── Floor (tile + wood mix) ──────────────────────────────── */
    // Tile area (bathroom side)
    const tileSide = mk(new THREE.PlaneGeometry(ROOM * 1.2, ROOM * 1.2), M.floor, false, true);
    tileSide.rotation.x = -Math.PI / 2;
    tileSide.position.set(1.0, 0.001, -0.5);
    scene.add(tileSide);
    // Wood floor (rest)
    const woodFloor = mk(new THREE.PlaneGeometry(ROOM * 2, ROOM * 2), M.wood, false, true);
    woodFloor.rotation.x = -Math.PI / 2;
    woodFloor.position.set(0, 0, 0);
    scene.add(woodFloor);

    // Orange slice rug (center)
    const rugBase = mk(B(1.8, 0.025, 1.8), M.orangeRug, false, true);
    rugBase.position.set(0.4, 0.013, 0.8);
    scene.add(rugBase);
    // Rug border ring
    const rugRing = mk(new THREE.TorusGeometry(0.9, 0.06, 6, 32), new THREE.MeshStandardMaterial({ color: 0xF28030, roughness: 0.85 }), false, false);
    rugRing.rotation.x = Math.PI / 2;
    rugRing.position.set(0.4, 0.026, 0.8);
    scene.add(rugRing);

    /* ── Walls ────────────────────────────────────────────────── */
    const wallGeo = new THREE.PlaneGeometry(ROOM * 2, 5.2);
    [
      { pos: [0, 2.6, -ROOM],    ry: 0 },
      { pos: [ROOM, 2.6, 0],     ry: -Math.PI / 2 },
      { pos: [0, 2.6,  ROOM],    ry: Math.PI },
      { pos: [-ROOM, 2.6, 0],    ry:  Math.PI / 2 },
    ].forEach(({ pos, ry }) => {
      const w = mk(wallGeo, M.wall, false, true);
      w.position.set(...pos); w.rotation.y = ry; scene.add(w);
    });

    // Wall trim / baseboard (pink-white)
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xF8E8EC, roughness: 0.7 });
    [
      [ROOM * 2, 0.1, 0.06,  0,       0.05, -ROOM + 0.04],
      [ROOM * 2, 0.1, 0.06,  0,       0.05,  ROOM - 0.04],
      [0.06, 0.1, ROOM * 2,  -ROOM + 0.04, 0.05, 0],
      [0.06, 0.1, ROOM * 2,   ROOM - 0.04, 0.05, 0],
    ].forEach(([w, h, d, x, y, z]) => {
      const trim = mk(B(w, h, d), trimMat, false, false);
      trim.position.set(x, y, z); scene.add(trim);
    });

    /* ── Arched Window (back wall, right section) ─────────────── */
    const WX = ROOM - 0.18, WY = 2.6, WZ = -0.4;
    const archW = 1.6, archH = 2.2;

    // Window frame — white arch shape (simplified: box + cylinder top)
    const wFrameBot = mk(B(0.1, archH * 0.65, archW + 0.14), new THREE.MeshStandardMaterial({ color: 0xF8F4EE, roughness: 0.6 }), false, false);
    wFrameBot.position.set(WX - 0.04, WY - archH * 0.1, WZ); scene.add(wFrameBot);
    const wFrameArch = mk(C(archW / 2 + 0.07, archW / 2 + 0.07, 0.1, 20, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xF8F4EE, roughness: 0.6 }), false, false);
    wFrameArch.rotation.z = Math.PI / 2;
    wFrameArch.position.set(WX - 0.04, WY + archH * 0.22, WZ); scene.add(wFrameArch);

    // Night sky glass (flat, inside frame)
    const wGlass = mk(B(0.05, archH * 0.68, archW), M.nightSky, false, false);
    wGlass.position.set(WX - 0.07, WY - archH * 0.08, WZ); scene.add(wGlass);
    // Arch top glass (half-cylinder)
    const wArchGlass = mk(C(archW / 2, archW / 2, 0.05, 20, 1, false, 0, Math.PI),
      M.nightSky, false, false);
    wArchGlass.rotation.z = Math.PI / 2;
    wArchGlass.position.set(WX - 0.07, WY + archH * 0.24, WZ); scene.add(wArchGlass);

    // Window glazing bars
    const barMat = new THREE.MeshStandardMaterial({ color: 0xF0EDE6, roughness: 0.55 });
    const wBar1 = mk(B(0.038, archH * 0.62, 0.038), barMat, false, false);
    wBar1.position.set(WX - 0.06, WY - archH * 0.08, WZ); scene.add(wBar1);
    const wBar2 = mk(B(0.038, 0.038, archW * 0.9), barMat, false, false);
    wBar2.position.set(WX - 0.06, WY + 0.05, WZ); scene.add(wBar2);

    // Window sill
    const wSill = mk(B(0.22, 0.07, archW + 0.2), new THREE.MeshStandardMaterial({ color: 0xF5EFDE, roughness: 0.7 }), false, true);
    wSill.position.set(WX - 0.02, WY - archH * 0.42, WZ); scene.add(wSill);

    // Small plant on windowsill
    const wsillPot = mk(C(0.08, 0.1, 0.15, 10), M.potPink, true, false);
    wsillPot.position.set(WX - 0.06, WY - archH * 0.42 + 0.12, WZ + 0.55); scene.add(wsillPot);
    const wsillLeaf = mk(S(0.14, 10, 8), M.greenLt, true, false);
    wsillLeaf.position.set(WX - 0.06, WY - archH * 0.42 + 0.34, WZ + 0.55); scene.add(wsillLeaf);
    const wsillLeaf2 = mk(S(0.09, 8, 6), M.green, false, false);
    wsillLeaf2.position.set(WX - 0.06, WY - archH * 0.42 + 0.44, WZ + 0.42); scene.add(wsillLeaf2);

    /* ── Hanging laundry line (back wall, diag left section) ───── */
    const ropeY = 4.0;
    const rope = mk(C(0.012, 0.012, 4.5, 6), M.rope, false, false);
    rope.rotation.z = 0.18;
    rope.position.set(-1.8, ropeY - 0.18, -ROOM + 0.12); scene.add(rope);
    // Hook nails
    [-3.8, 0.8].forEach(hx => {
      const nail = mk(S(0.03, 6, 4), M.metal, false, false);
      nail.position.set(hx, ropeY + 0.05, -ROOM + 0.08); scene.add(nail);
    });
    // Laundry items hanging
    [
      { x: -3.2, col: 0xF5D060, w: 0.38, h: 0.32, rz: -0.12 },   // yellow small shirt
      { x: -2.3, col: 0xF0A0B8, w: 0.28, h: 0.24, rz: 0.06 },   // pink cloth
      { x: -1.5, col: 0xF5C060, w: 0.3,  h: 0.22, rz: -0.08 },   // orange bandana
      { x: -0.6, col: 0xAADDCC, w: 0.26, h: 0.2,  rz: 0.1  },   // mint sock
    ].forEach(({ x, col, w, h, rz }) => {
      const clothMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.92, side: THREE.DoubleSide });
      const cloth = mk(B(w, h, 0.03), clothMat, false, false);
      const hangY = ropeY - h / 2 - 0.04 + x * Math.tan(0.18) * 0.18;
      cloth.position.set(x, hangY, -ROOM + 0.14);
      cloth.rotation.z = rz; scene.add(cloth);
      // Clothes pin
      const pin = mk(B(0.04, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0xE8C090, roughness: 0.8 }), false, false);
      pin.position.set(x, ropeY - 0.01, -ROOM + 0.13); scene.add(pin);
    });

    /* ── Teal Cabinet / Bookshelf (back-left) ─────────────────── */
    const CBX = -3.2, CBZ = -4.65;
    const cabBody = mk(B(1.4, 2.0, 0.55), M.teal, true, true);
    cabBody.position.set(CBX, 1.0, CBZ); scene.add(cabBody);
    // Cabinet top crown
    const cabTop = mk(B(1.5, 0.08, 0.62), M.tealDk, false, false);
    cabTop.position.set(CBX, 2.04, CBZ); scene.add(cabTop);
    // Shelves
    [0.55, 1.15, 1.72].forEach(sy => {
      const shelf = mk(B(1.32, 0.06, 0.5), M.tealLt, false, false);
      shelf.position.set(CBX, sy, CBZ - 0.01); scene.add(shelf);
    });
    // Cabinet door fronts (rounded feel)
    [-0.33, 0.33].forEach(ox => {
      const door = mk(B(0.62, 1.82, 0.04), M.tealLt, false, false);
      door.position.set(CBX + ox, 1.0, CBZ - 0.265); scene.add(door);
      // Small round handle
      const handle = mk(S(0.048, 8, 6), new THREE.MeshStandardMaterial({ color: 0xFFD080, roughness: 0.45, metalness: 0.4 }), false, false);
      handle.position.set(CBX + ox * (ox > 0 ? -0.5 : 0.5) * 0.8, 1.0, CBZ - 0.287); scene.add(handle);
    });
    // Small items on cabinet shelves
    // Shelf 1: tiny pastel boxes
    [{ x: CBX - 0.3, col: 0xF0C0D0 }, { x: CBX, col: 0xC0D8F0 }, { x: CBX + 0.28, col: 0xD0F0C0 }].forEach(({ x, col }) => {
      const box = mk(B(0.18, 0.22, 0.17), new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 }), true, false);
      box.position.set(x, 0.72, CBZ - 0.08); scene.add(box);
    });
    // Shelf 2: small books
    let bx = CBX - 0.55;
    [0xE05050, 0x5080E0, 0xE0A030, 0x60C060].forEach(col => {
      const bw = 0.12 + Math.random() * 0.05;
      const bh = 0.25 + Math.random() * 0.1;
      const book = mk(B(bw, bh, 0.14), new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 }), true, false);
      book.position.set(bx + bw / 2, 1.15 + bh / 2, CBZ - 0.08);
      bx += bw + 0.01; scene.add(book);
    });

    // Plants on top of cabinet
    function addCutePlant(px, py, pz, scale = 1, potColor = M.pot) {
      const pot = mk(C(0.1 * scale, 0.13 * scale, 0.22 * scale, 12), potColor, true, false);
      pot.position.set(px, py + 0.11 * scale, pz); scene.add(pot);
      const soil = mk(C(0.09 * scale, 0.09 * scale, 0.03, 12), M.soil, false, false);
      soil.position.set(px, py + 0.23 * scale, pz); scene.add(soil);
      const stem = mk(C(0.025 * scale, 0.03 * scale, 0.35 * scale, 8), new THREE.MeshStandardMaterial({ color: 0x2A6030, roughness: 0.9 }), true, false);
      stem.position.set(px, py + 0.44 * scale, pz); scene.add(stem);
      [[0, 0.68 * scale, 0, 0.26 * scale],
       [0.12 * scale, 0.60 * scale, 0.08 * scale, 0.18 * scale],
       [-0.10 * scale, 0.62 * scale, -0.06 * scale, 0.16 * scale],
       [0.07 * scale, 0.72 * scale, -0.10 * scale, 0.14 * scale],
      ].forEach(([fx, fy, fz, fr]) => {
        const leaf = mk(S(fr, 10, 8), fr > 0.22 ? M.green : M.greenLt, true, false);
        leaf.position.set(px + fx, py + fy, pz + fz); scene.add(leaf);
      });
    }
    addCutePlant(CBX - 0.36, 2.08, CBZ + 0.05, 0.85, M.potPink);
    addCutePlant(CBX + 0.36, 2.08, CBZ - 0.02, 0.75, M.pot);
    // Trailing vine plant
    addCutePlant(CBX, 2.08, CBZ + 0.08, 0.95, M.potPink);

    /* ── Washing Machine (left-back corner) ──────────────────── */
    const WMX = -4.0, WMZ = -3.0;
    const wmBody = mk(B(0.88, 0.92, 0.78), M.whiteShiny, true, true);
    wmBody.position.set(WMX, 0.46, WMZ); scene.add(wmBody);
    const wmTop = mk(B(0.9, 0.06, 0.8), new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.6 }), false, false);
    wmTop.position.set(WMX, 0.93, WMZ); scene.add(wmTop);
    // Front panel
    const wmPanel = mk(B(0.78, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.55 }), false, false);
    wmPanel.position.set(WMX, 0.46, WMZ - 0.365); scene.add(wmPanel);
    // Drum door (circle)
    const wmDrum = mk(C(0.26, 0.26, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0x88AACC, transparent: true, opacity: 0.8, roughness: 0.08, metalness: 0.1 }), false, false);
    wmDrum.rotation.x = Math.PI / 2;
    wmDrum.position.set(WMX, 0.52, WMZ - 0.388); scene.add(wmDrum);
    const wmDrumRing = mk(new THREE.TorusGeometry(0.26, 0.025, 8, 24), new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.3, metalness: 0.5 }), false, false);
    wmDrumRing.rotation.x = Math.PI / 2;
    wmDrumRing.position.set(WMX, 0.52, WMZ - 0.385); scene.add(wmDrumRing);
    // Indicator light (glowing blue)
    const wmLight = mk(S(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0x44BBFF, emissive: new THREE.Color(0x2299FF), emissiveIntensity: 1.0, roughness: 0.2 }), false, false);
    wmLight.position.set(WMX - 0.25, 0.76, WMZ - 0.393); scene.add(wmLight);
    // Dial knob
    const wmDial = mk(C(0.05, 0.05, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.4, metalness: 0.2 }), false, false);
    wmDial.rotation.x = Math.PI / 2;
    wmDial.position.set(WMX + 0.22, 0.76, WMZ - 0.392); scene.add(wmDial);
    // Feet
    [-0.3, 0.3].forEach(ox => {
      [-0.28, 0.28].forEach(oz => {
        const foot = mk(C(0.04, 0.04, 0.04, 8), M.metal, false, false);
        foot.position.set(WMX + ox, 0.02, WMZ + oz); scene.add(foot);
      });
    });

    /* ── Bathtub (center) ─────────────────────────────────────── */
    const BTX = 0.5, BTZ = 0.4;
    // Outer tub body
    const tubOuter = mk(B(1.85, 0.68, 0.92), M.teal, true, true);
    tubOuter.position.set(BTX, 0.34, BTZ); scene.add(tubOuter);
    // Inner hollow (slightly smaller, cream-colored)
    const tubInner = mk(B(1.65, 0.52, 0.72), M.tealLt, false, false);
    tubInner.position.set(BTX, 0.42, BTZ); scene.add(tubInner);
    // Water surface
    const tubWater = mk(B(1.6, 0.01, 0.68), M.waterTeal, false, false);
    tubWater.position.set(BTX, 0.62, BTZ); scene.add(tubWater);
    // Tub rim
    const tubRim = mk(B(1.9, 0.06, 0.98), M.tealDk, false, false);
    tubRim.position.set(BTX, 0.67, BTZ); scene.add(tubRim);
    // Faucet side
    const faucetPipe = mk(C(0.028, 0.028, 0.22, 8), M.chrome, false, false);
    faucetPipe.rotation.z = Math.PI / 2;
    faucetPipe.position.set(BTX + 1.02, 0.74, BTZ - 0.22); scene.add(faucetPipe);
    const faucetHead = mk(C(0.04, 0.06, 0.06, 12), M.chrome, false, false);
    faucetHead.rotation.x = Math.PI / 2;
    faucetHead.position.set(BTX + 1.13, 0.74, BTZ - 0.22); scene.add(faucetHead);
    // Tap knobs
    [-0.08, 0.08].forEach(oz => {
      const knob = mk(S(0.038, 8, 6), new THREE.MeshStandardMaterial({ color: oz < 0 ? 0xFF8888 : 0x88AAFF, roughness: 0.5 }), false, false);
      knob.position.set(BTX + 0.98, 0.74, BTZ - 0.22 + oz); scene.add(knob);
    });
    // Tub legs
    [BTX - 0.75, BTX + 0.75].forEach(lx => {
      [-0.34, 0.34].forEach(lz => {
        const leg = mk(C(0.04, 0.055, 0.28, 8), M.chrome, true, false);
        leg.position.set(lx, 0.14, BTZ + lz); scene.add(leg);
        const foot = mk(S(0.055, 8, 6), M.chrome, false, false);
        foot.position.set(lx, 0.05, BTZ + lz); scene.add(foot);
      });
    });

    /* ── Cute sleeping character in bathtub (gudetama-esque) ─── */
    const charX = BTX - 0.15, charY = 0.72, charZ = BTZ;
    // Body (round yellow blob)
    const charBody = mk(S(0.32, 14, 10), M.char, true, false);
    charBody.scale.set(1.4, 0.7, 1.0);
    charBody.position.set(charX, charY, charZ); scene.add(charBody);
    // Eyes (closed/sleeping — curved)
    [-0.1, 0.1].forEach(oz => {
      const eye = mk(S(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2A1808, roughness: 1 }), false, false);
      eye.position.set(charX + 0.22, charY + 0.06, charZ + oz); scene.add(eye);
    });
    // Blush
    [-0.08, 0.08].forEach(oz => {
      const blush = mk(S(0.055, 8, 6), new THREE.MeshStandardMaterial({ color: 0xF09898, roughness: 0.9, transparent: true, opacity: 0.7 }), false, false);
      blush.position.set(charX + 0.25, charY, charZ + oz * 1.5); scene.add(blush);
    });
    // Tiny arm flopped out
    const charArm = mk(S(0.09, 8, 6), M.char, true, false);
    charArm.scale.set(1.8, 0.6, 0.6);
    charArm.position.set(charX + 0.38, charY - 0.04, charZ + 0.2); scene.add(charArm);

    /* ── Small cat character (right side, near tub) ───────────── */
    const catX = BTX + 1.35, catZ = BTZ + 0.55;
    // Cat body
    const catBody = mk(B(0.22, 0.26, 0.18), M.catPink, true, false);
    catBody.position.set(catX, 0.13, catZ); scene.add(catBody);
    // Cat head
    const catHead = mk(S(0.18, 12, 8), M.catPink, true, false);
    catHead.position.set(catX, 0.44, catZ); scene.add(catHead);
    // Ears
    [-0.08, 0.08].forEach(ox => {
      const ear = mk(B(0.06, 0.08, 0.05), M.catPink, false, false);
      ear.position.set(catX + ox, 0.60, catZ); scene.add(ear);
      const earInner = mk(B(0.035, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0xF8C8C8, roughness: 0.9 }), false, false);
      earInner.position.set(catX + ox, 0.61, catZ - 0.01); scene.add(earInner);
    });
    // Eyes
    [-0.06, 0.06].forEach(ox => {
      const catEye = mk(S(0.03, 6, 4), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 }), false, false);
      catEye.position.set(catX + ox, 0.46, catZ - 0.16); scene.add(catEye);
    });
    // Blush dots
    [-0.08, 0.08].forEach(ox => {
      const cb = mk(S(0.03, 6, 4), new THREE.MeshStandardMaterial({ color: 0xF09898, roughness: 0.9, transparent: true, opacity: 0.6 }), false, false);
      cb.position.set(catX + ox, 0.435, catZ - 0.155); scene.add(cb);
    });
    // Tail
    const catTail = mk(C(0.025, 0.04, 0.28, 8), M.catPink, false, false);
    catTail.rotation.z = 1.1;
    catTail.position.set(catX - 0.16, 0.22, catZ + 0.04); scene.add(catTail);
    // Cat is holding a small sign/book
    const catBook = mk(B(0.14, 0.1, 0.02), new THREE.MeshStandardMaterial({ color: 0xF8F0E0, roughness: 0.9 }), false, false);
    catBook.position.set(catX + 0.18, 0.28, catZ - 0.08); scene.add(catBook);

    /* ── Tangerine character on washing machine ───────────────── */
    const tmX = WMX + 0.1, tmY = 0.99, tmZ = WMZ;
    const tmBody = mk(S(0.2, 12, 10), M.tangerine, true, false);
    tmBody.scale.set(1.0, 0.9, 1.0);
    tmBody.position.set(tmX, tmY + 0.2, tmZ); scene.add(tmBody);
    // Leaf nub on top
    const tmLeaf = mk(S(0.055, 8, 6), M.greenDk, false, false);
    tmLeaf.scale.set(0.6, 1.4, 0.6);
    tmLeaf.position.set(tmX, tmY + 0.42, tmZ); scene.add(tmLeaf);
    // Eyes
    [-0.07, 0.07].forEach(ox => {
      const te = mk(S(0.028, 6, 4), new THREE.MeshStandardMaterial({ color: 0x1A0800, roughness: 1 }), false, false);
      te.position.set(tmX + ox, tmY + 0.24, tmZ - 0.18); scene.add(te);
    });
    // Smile
    const tmSmile = mk(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1A0800, roughness: 1 }), false, false);
    tmSmile.rotation.x = -0.2; tmSmile.rotation.z = Math.PI;
    tmSmile.position.set(tmX, tmY + 0.16, tmZ - 0.18); scene.add(tmSmile);

    /* ── Bunny slippers on floor ─────────────────────────────── */
    [{ x: -1.2, z: 3.8, ry: 0.4 }, { x: -0.75, z: 3.95, ry: 0.2 }].forEach(({ x, z, ry }) => {
      const slipBody = mk(B(0.22, 0.1, 0.38), M.bunny, true, false);
      slipBody.position.set(x, 0.05, z);
      slipBody.rotation.y = ry; scene.add(slipBody);
      // Bunny ears
      [-0.06, 0.06].forEach(ox => {
        const ear = mk(B(0.045, 0.15, 0.04), M.bunny, false, false);
        ear.position.set(x + ox * Math.cos(ry), 0.17, z - 0.08);
        ear.rotation.y = ry; scene.add(ear);
        const earIn = mk(B(0.025, 0.1, 0.022), new THREE.MeshStandardMaterial({ color: 0xF8C8D0, roughness: 0.9 }), false, false);
        earIn.position.set(x + ox * Math.cos(ry), 0.18, z - 0.079);
        earIn.rotation.y = ry; scene.add(earIn);
      });
      // Eyes
      const sEye = mk(S(0.02, 6, 4), new THREE.MeshStandardMaterial({ color: 0x221122, roughness: 1 }), false, false);
      sEye.position.set(x + 0.04, 0.1, z - 0.17); scene.add(sEye);
      const sEye2 = mk(S(0.02, 6, 4), new THREE.MeshStandardMaterial({ color: 0x221122, roughness: 1 }), false, false);
      sEye2.position.set(x - 0.04, 0.1, z - 0.17); scene.add(sEye2);
    });

    /* ── Corner plants ────────────────────────────────────────── */
    addCutePlant(-4.3, 0, -3.6, 1.55, M.potPink);
    addCutePlant(4.1, 0, -3.8, 1.1, M.pot);
    addCutePlant(4.4, 0, 3.5, 0.8, M.potPink);

    /* ── Small side table next to tub ────────────────────────── */
    const stX = BTX - 1.25, stZ = BTZ - 0.55;
    const stTop = mk(C(0.24, 0.24, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0xF8DCC0, roughness: 0.75 }), true, true);
    stTop.position.set(stX, 0.52, stZ); scene.add(stTop);
    const stLeg = mk(C(0.04, 0.04, 0.52, 8), M.metal, true, false);
    stLeg.position.set(stX, 0.26, stZ); scene.add(stLeg);
    const stBase = mk(C(0.18, 0.14, 0.03, 12), M.metal, false, false);
    stBase.position.set(stX, 0.015, stZ); scene.add(stBase);
    // Items on table: small candle + rubber duck
    const candle = mk(C(0.04, 0.04, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xF8E0C0, roughness: 0.85 }), false, false);
    candle.position.set(stX + 0.08, 0.59, stZ - 0.05); scene.add(candle);
    const flame = mk(S(0.025, 6, 4), new THREE.MeshStandardMaterial({ color: 0xFFCC44, emissive: new THREE.Color(0xFF8800), emissiveIntensity: 1.5, roughness: 0.2 }), false, false);
    flame.position.set(stX + 0.08, 0.66, stZ - 0.05); scene.add(flame);
    const candleLight = new THREE.PointLight(0xFFAA44, 0.7, 1.4, 2);
    candleLight.position.set(stX + 0.08, 0.7, stZ - 0.05); scene.add(candleLight);
    // Rubber duck
    const duckBody = mk(S(0.09, 10, 8), M.yellow, true, false);
    duckBody.scale.set(1.2, 0.9, 1.0);
    duckBody.position.set(stX - 0.07, 0.58, stZ + 0.08); scene.add(duckBody);
    const duckHead = mk(S(0.065, 8, 6), M.yellow, true, false);
    duckHead.position.set(stX - 0.07 + 0.1, 0.65, stZ + 0.08); scene.add(duckHead);
    const duckBeak = mk(B(0.04, 0.025, 0.025), M.orange, false, false);
    duckBeak.position.set(stX - 0.07 + 0.165, 0.65, stZ + 0.08); scene.add(duckBeak);

    /* ── Towel rack on wall ─────────────────────────────────────── */
    const trX = ROOM - 0.12, trY = 1.6, trZ = 2.0;
    const trRod = mk(C(0.018, 0.018, 1.0, 8), M.chrome, false, false);
    trRod.rotation.z = Math.PI / 2;
    trRod.position.set(trX - 0.06, trY, trZ); scene.add(trRod);
    [-0.3, 0.3].forEach(zb => {
      const bracket = mk(B(0.1, 0.06, 0.06), M.chrome, false, false);
      bracket.position.set(trX - 0.1, trY, trZ + zb); scene.add(bracket);
    });
    // Hanging towel (pink)
    const towel = mk(B(0.04, 0.55, 0.82), new THREE.MeshStandardMaterial({ color: 0xF0AAB8, roughness: 0.96, side: THREE.DoubleSide }), true, false);
    towel.position.set(trX - 0.08, trY - 0.15, trZ); scene.add(towel);
    // Towel stripe
    const stripe = mk(B(0.04, 0.06, 0.8), new THREE.MeshStandardMaterial({ color: 0xE88898, roughness: 0.96 }), false, false);
    stripe.position.set(trX - 0.07, trY + 0.04, trZ); scene.add(stripe);

    /* ── Soap dish + soap on tub edge ─────────────────────────── */
    const soapDish = mk(B(0.14, 0.04, 0.1), new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.5 }), false, false);
    soapDish.position.set(BTX + 0.8, 0.7, BTZ + 0.3); scene.add(soapDish);
    const soap = mk(B(0.1, 0.06, 0.07), new THREE.MeshStandardMaterial({ color: 0xFFE0F0, roughness: 0.75 }), false, false);
    soap.position.set(BTX + 0.8, 0.75, BTZ + 0.3); scene.add(soap);

    /* ── Resize ───────────────────────────────────────────────── */
    function onResize() {
      W = mount.offsetWidth  || window.innerWidth;
      H = mount.offsetHeight || window.innerHeight;
      const a = W / H;
      camera.left   = -frustumSize * a / 2;
      camera.right  =  frustumSize * a / 2;
      camera.top    =  frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    /* ── Animate ──────────────────────────────────────────────── */
    let frame;
    let t = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      t += 0.016;

      // Lerp azimuth to target
      let target = targetRef.current;
      let diff = target - azimuth;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      azimuth += diff * 0.055;
      setCam(azimuth);

      // Candle + bath glow flicker
      const flk = 0.95 + Math.sin(t * 8.7) * 0.07 + Math.sin(t * 5.3) * 0.04;
      candleLight.intensity = 0.7 * flk;
      bathGlow.intensity    = 1.2 * (0.97 + Math.sin(t * 3.1) * 0.04);

      // Subtle washer indicator pulse
      washerGlow.intensity = 0.6 + Math.sin(t * 1.4) * 0.25;

      renderer.render(scene, camera);
    }
    animate();

    /* ── Cleanup ──────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
