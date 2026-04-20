import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ─── Snap angles ───────────────────────────────────────────────────── */
const SNAP_ANGLES = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];

/* ─── Geometry helpers ──────────────────────────────────────────────── */
function mk(geo, mat, castShadow = true, receiveShadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (rt, rb, h, s = 16) => new THREE.CylinderGeometry(rt, rb, h, s);
const S = (r, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs);

/* ─── Procedural textures ───────────────────────────────────────────── */
function woodTex(baseColor, w = 512, h = 512) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w;
    const alpha = 0.03 + Math.random() * 0.07;
    const lw = 0.4 + Math.random() * 1.2;
    ctx.strokeStyle = Math.random() > 0.5
      ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha * 0.4})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x + (Math.random() - 0.5) * 6, 0);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 8, h * 0.33,
      x + (Math.random() - 0.5) * 8, h * 0.66,
      x + (Math.random() - 0.5) * 6, h
    );
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(0,0,0,0.1)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * w, Math.random() * h,
      8 + Math.random() * 12, 4 + Math.random() * 6,
      Math.random() * Math.PI, 0, Math.PI * 2
    );
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function wallTex() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const ctx = cv.getContext('2d');
  // Base warm white
  ctx.fillStyle = '#D6D0C6';
  ctx.fillRect(0, 0, 512, 512);
  // Subtle noise for paint texture
  const imgData = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    imgData.data[i]     = Math.min(255, Math.max(0, imgData.data[i]     + n));
    imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n));
    imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 3);
  return t;
}

function floorTex() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 512;
  const ctx = cv.getContext('2d');
  const PLANKS = ['#B8804A','#C08840','#A87840','#C49050','#B07848','#BC8845'];
  const PW = 1024 / 6;
  for (let col = 0; col < 6; col++) {
    ctx.fillStyle = PLANKS[col];
    ctx.fillRect(col * PW, 0, PW - 2, 512);
    // darker edge shadow
    const g = ctx.createLinearGradient(col * PW, 0, col * PW + 6, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(col * PW, 0, PW, 512);
    // grain
    for (let i = 0; i < 60; i++) {
      const x = col * PW + Math.random() * (PW - 2);
      const alpha = 0.025 + Math.random() * 0.055;
      ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
      ctx.lineWidth = 0.4 + Math.random() * 0.8;
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

function rugTex() {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#B89C72';
  ctx.fillRect(0, 0, 256, 256);
  // weave pattern
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      const v = ((x + y) % 8 < 4) ? 0.06 : -0.04;
      ctx.fillStyle = `rgba(0,0,0,${Math.abs(v)})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 4);
  return t;
}

/* ─── Component ─────────────────────────────────────────────────────── */
const BASE_FRUSTUM = 14;

export default function RoomCanvas({ targetAngleIndex = 0, zoom = 1.0 }) {
  const mountRef  = useRef(null);
  const targetRef = useRef(SNAP_ANGLES[targetAngleIndex]);
  const zoomRef   = useRef(zoom);

  useEffect(() => {
    targetRef.current = SNAP_ANGLES[targetAngleIndex % 4];
  }, [targetAngleIndex]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── Renderer ───────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0xB2AEA8);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';

    let W = mount.offsetWidth  || window.innerWidth;
    let H = mount.offsetHeight || window.innerHeight;
    renderer.setSize(W, H);

    /* ── Scene ──────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xB2AEA8);
    scene.fog = new THREE.Fog(0xB2AEA8, 22, 34);

    /* ── Camera ─────────────────────────────────────────────────── */
    const ISO_ELEV = Math.acos(1 / Math.sqrt(3));
    const DIST     = 18;
    const aspect   = W / H;
    let currentFrustum = BASE_FRUSTUM * zoomRef.current;
    const camera   = new THREE.OrthographicCamera(
      -currentFrustum * aspect / 2,  currentFrustum * aspect / 2,
       currentFrustum / 2,           -currentFrustum / 2,
      0.1, 120
    );
    let azimuth = targetRef.current;
    function setCam(az) {
      camera.position.set(DIST * Math.cos(az), DIST * Math.sin(ISO_ELEV), DIST * Math.sin(az));
      camera.lookAt(0, 1.2, 0);
    }
    setCam(azimuth);

    /* ── Lights ─────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xFFF8F0, 0.45));
    scene.add(new THREE.HemisphereLight(0xFFE8D0, 0x4A3020, 0.55));

    // Main soft directional (sky fill)
    const sun = new THREE.DirectionalLight(0xFFF5E0, 0.65);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.far = 40;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // Window golden light
    const winSpot = new THREE.SpotLight(0xFFCC55, 4.0, 10, Math.PI / 5.5, 0.5, 1.5);
    winSpot.position.set(3.5, 4.8, -0.8);
    winSpot.target.position.set(0, 0, 1.5);
    winSpot.castShadow = true;
    winSpot.shadow.mapSize.set(1024, 1024);
    winSpot.shadow.bias = -0.001;
    scene.add(winSpot); scene.add(winSpot.target);


    // Desk lamp warm fill
    const deskLamp = new THREE.PointLight(0xFFAA44, 1.6, 3.5, 2);
    deskLamp.position.set(-1.1, 2.1, -1.5);
    deskLamp.castShadow = false;
    scene.add(deskLamp);

    // Wardrobe interior glow
    const wardGlowLight = new THREE.PointLight(0xFFCC44, 0.9, 1.8);
    wardGlowLight.position.set(1.2, 1.3, -2.3);
    scene.add(wardGlowLight);

    /* ── Baked textures ─────────────────────────────────────────── */
    const TEX = {
      wood:  woodTex('#B8844A'),
      woodL: woodTex('#D4A060'),
      woodD: woodTex('#6A3C18'),
      wall:  wallTex(),
      floor: floorTex(),
      rug:   rugTex(),
    };
    Object.values(TEX).forEach(t => { if (t.repeat) {} /* already set */ });
    TEX.wood.repeat.set(3, 3); TEX.woodL.repeat.set(3, 3); TEX.woodD.repeat.set(2, 2);

    /* ── Materials ──────────────────────────────────────────────── */
    const M = {
      wall:    new THREE.MeshStandardMaterial({ map: TEX.wall,  roughness: 0.9,  side: THREE.FrontSide }),
      ceil:    new THREE.MeshStandardMaterial({ color: 0xEDEAE4, roughness: 0.98, side: THREE.FrontSide }),
      floor:   new THREE.MeshStandardMaterial({ map: TEX.floor, roughness: 0.72, metalness: 0.03 }),
      trim:    new THREE.MeshStandardMaterial({ color: 0xF2EFE8, roughness: 0.55 }),  // skirting/coving
      wood:    new THREE.MeshStandardMaterial({ map: TEX.wood,  roughness: 0.78 }),
      woodL:   new THREE.MeshStandardMaterial({ map: TEX.woodL, roughness: 0.70 }),
      woodD:   new THREE.MeshStandardMaterial({ map: TEX.woodD, roughness: 0.82 }),
      metal:   new THREE.MeshStandardMaterial({ color: 0xA8A8A8, roughness: 0.22, metalness: 0.88 }),
      brass:   new THREE.MeshStandardMaterial({ color: 0xC8A030, roughness: 0.28, metalness: 0.75 }),
      chrome:  new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.1,  metalness: 0.95 }),
      glass:   new THREE.MeshStandardMaterial({ color: 0xAADDFF, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0.08 }),
      winGlow: new THREE.MeshStandardMaterial({ color: 0xFFEE88, emissive: new THREE.Color(0xFFCC44), emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.04 }),
      wardGold:new THREE.MeshStandardMaterial({ color: 0xC09030, roughness: 0.42, metalness: 0.38 }),
      wardGlow:new THREE.MeshStandardMaterial({ color: 0xFFEE99, emissive: new THREE.Color(0xFFDD44), emissiveIntensity: 0.65, roughness: 0.05 }),
      bedFrame:new THREE.MeshStandardMaterial({ map: TEX.woodD, roughness: 0.78 }),
      bedBlue: new THREE.MeshStandardMaterial({ color: 0x4878B0, roughness: 0.92 }),
      bedDark: new THREE.MeshStandardMaterial({ color: 0x3868A0, roughness: 0.92 }),
      bedWhite:new THREE.MeshStandardMaterial({ color: 0xEEEAE0, roughness: 0.95 }),
      linen:   new THREE.MeshStandardMaterial({ color: 0xD8D0C0, roughness: 0.98 }),
      chairRed:new THREE.MeshStandardMaterial({ color: 0xB83828, roughness: 0.88 }),
      lapAlu:  new THREE.MeshStandardMaterial({ color: 0x969696, roughness: 0.28, metalness: 0.72 }),
      lapRed:  new THREE.MeshStandardMaterial({ color: 0xD85050, roughness: 0.45, metalness: 0.12 }),
      screen:  new THREE.MeshStandardMaterial({ color: 0x99CCFF, emissive: new THREE.Color(0x3377BB), emissiveIntensity: 0.55, roughness: 0.05 }),
      mug:     new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.5,  metalness: 0.04 }),
      paper:   new THREE.MeshStandardMaterial({ color: 0xF4EFE4, roughness: 0.98 }),
      jacket:  new THREE.MeshStandardMaterial({ color: 0xC02818, roughness: 0.95 }),
      guitar:  new THREE.MeshStandardMaterial({ color: 0xB87040, roughness: 0.75 }),
      gutarDk: new THREE.MeshStandardMaterial({ color: 0x3A1A04, roughness: 0.8  }),
      rug:     new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 1.0 }),
      curtain: new THREE.MeshStandardMaterial({ color: 0xC8B898, roughness: 0.98, side: THREE.DoubleSide }),
      lampShd: new THREE.MeshStandardMaterial({ color: 0xEEDDAA, roughness: 0.7,  side: THREE.DoubleSide }),
      bulb:    new THREE.MeshStandardMaterial({ color: 0xFFFFCC, emissive: new THREE.Color(0xFFDD88), emissiveIntensity: 1.2, roughness: 0.2 }),
      plant:   new THREE.MeshStandardMaterial({ color: 0x3A8830, roughness: 0.9  }),
      plantLt: new THREE.MeshStandardMaterial({ color: 0x4EA038, roughness: 0.9  }),
      pot:     new THREE.MeshStandardMaterial({ color: 0xCC8844, roughness: 0.82 }),
      bookColors: [0xC03020,0x204080,0x206820,0xA06020,0x702080,0x208080,0xD04040,0x2060A0,0x805020],
    };

    const ROOM = 5;

    /* ── Floor ──────────────────────────────────────────────────── */
    const floor = mk(new THREE.PlaneGeometry(ROOM*2, ROOM*2), M.floor, false, true);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    scene.add(floor);

    // Rug with woven texture
    const rug = mk(B(4.2, 0.028, 3.2), M.rug, false, true);
    rug.position.set(0.4, 0.014, 1.2);
    scene.add(rug);
    // Rug border (inset slightly from rug edge)
    const rugBorderMat = new THREE.MeshStandardMaterial({ color: 0x8A6030, roughness: 1.0 });
    [
      [4.2, 0.029, 0.16, 0.4, 0.015, -1.44], [4.2, 0.029, 0.16, 0.4, 0.015, 3.84],
      [0.16, 0.029, 2.88, -1.70, 0.015, 1.2], [0.16, 0.029, 2.88, 2.50, 0.015, 1.2],
    ].forEach(([w,h,d,x,y,z]) => {
      const rb = mk(B(w,h,d), rugBorderMat, false, false);
      rb.position.set(x,y,z); scene.add(rb);
    });

    /* ── Walls — PlaneGeometry, FrontSide, normals face inward ─── */
    // PlaneGeometry default normal = +Z. Rotations steer that inward.
    // At any camera angle only 2 walls face the camera → clean diorama.
    // No ceiling = open-top diorama (like the reference image).
    const wallGeo = new THREE.PlaneGeometry(ROOM * 2, 5);
    [
      { pos: [0, 2.5, -ROOM], ry: 0          },  // back  — normal +Z
      { pos: [ROOM, 2.5, 0],  ry: -Math.PI/2 },  // right — normal -X
      { pos: [0, 2.5,  ROOM], ry: Math.PI    },  // front — normal -Z
      { pos: [-ROOM, 2.5, 0], ry:  Math.PI/2 },  // left  — normal +X
    ].forEach(({ pos, ry }) => {
      const w = mk(wallGeo, M.wall, false, true);
      w.position.set(...pos); w.rotation.y = ry; scene.add(w);
    });


    /* ── Window (right wall) ────────────────────────────────────── */
    const WX = ROOM - 0.19;   // x position on right wall
    const WY = 2.8, WZ = -0.5;
    // Reveal box (inset)
    const reveal = mk(B(0.36, 1.62, 1.62), new THREE.MeshStandardMaterial({ color: 0xE8E4DC, roughness: 0.92 }), false, true);
    reveal.position.set(WX + 0.01, WY, WZ); scene.add(reveal);
    // Outer frame top/bottom/sides
    [[0.04,1.66,0.06, WX-0.05, WY, WZ-0.81],[0.04,1.66,0.06, WX-0.05, WY, WZ+0.81],
     [0.04,0.06,1.62, WX-0.05, WY+0.81, WZ],[0.04,0.06,1.62, WX-0.05, WY-0.81, WZ],
    ].forEach(([w,h,d,x,y,z]) => {
      const f = mk(B(w,h,d), M.trim, false, false);
      f.position.set(x,y,z); scene.add(f);
    });
    // Glass pane
    const glass = mk(new THREE.PlaneGeometry(1.52, 1.52), M.winGlow, false, false);
    glass.rotation.y = -Math.PI / 2;
    glass.position.set(WX - 0.08, WY, WZ); scene.add(glass);
    // Glazing bars
    [[0.03, 0.03, 1.56, WX-0.09, WY, WZ],[0.03,1.56,0.03, WX-0.09, WY, WZ]].forEach(([w,h,d,x,y,z]) => {
      const gb = mk(B(w,h,d), M.trim, false, false);
      gb.position.set(x,y,z); scene.add(gb);
    });
    // Sill
    const sill = mk(B(0.28, 0.06, 1.8), M.trim, false, true);
    sill.position.set(WX - 0.04, WY - 0.83, WZ); scene.add(sill);
    // Curtain rod
    const rod = mk(C(0.018, 0.018, 2.1, 8), M.brass, false, false);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(WX - 0.06, WY + 1.02, WZ); scene.add(rod);
    [WZ - 1.05, WZ + 1.05].forEach(ex => {
      const finial = mk(S(0.04, 8, 6), M.brass, false, false);
      finial.position.set(WX - 0.02, WY + 1.02, ex); scene.add(finial);
    });
    // Curtain panels
    [WZ - 0.86, WZ + 0.86].forEach((cz, ci) => {
      const panel = mk(B(0.06, 1.9, 0.44), M.curtain, true, false);
      panel.position.set(WX - 0.04, WY + 0.05, cz);
      panel.rotation.y = ci === 0 ? 0.15 : -0.15; scene.add(panel);
      // Curtain folds
      for (let f = 0; f < 3; f++) {
        const fold = mk(B(0.03, 1.85, 0.06), M.curtain, false, false);
        fold.position.set(WX - 0.01, WY + 0.04, cz + (ci === 0 ? -0.14 + f*0.14 : 0.14 - f*0.14));
        scene.add(fold);
      }
    });

    /* ── Door (front wall, left side) ───────────────────────────── */
    const DX = -2.2, DZ = ROOM - 0.06;
    [[-0.5,2.75],[0.5,2.75]].forEach(([ox,oy]) => {
      const jb = mk(B(0.08, 2.68, 0.08), M.trim, false, false);
      jb.position.set(DX + ox, oy/2, DZ); scene.add(jb);
    });
    const doorHead = mk(B(1.1, 0.08, 0.08), M.trim, false, false);
    doorHead.position.set(DX, 2.72, DZ); scene.add(doorHead);
    // Door slab
    const door = mk(B(0.94, 2.55, 0.06), M.woodL, true, true);
    door.position.set(DX + 0.04, 1.275, DZ - 0.01); scene.add(door);
    // Door panels
    [[0, 1.65],[0, 0.7]].forEach(([ox,oy]) => {
      const dp = mk(B(0.7, 0.55, 0.025), M.woodD, false, false);
      dp.position.set(DX + 0.04 + ox, oy, DZ - 0.045); scene.add(dp);
    });
    // Door handle
    const handlePlate = mk(B(0.04, 0.16, 0.025), M.brass, false, false);
    handlePlate.position.set(DX + 0.44, 1.05, DZ - 0.055); scene.add(handlePlate);
    const handleBar = mk(C(0.015, 0.015, 0.1, 8), M.brass, false, false);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(DX + 0.50, 1.06, DZ - 0.062); scene.add(handleBar);

    /* ── Back wall shelf + coat hooks ───────────────────────────── */
    // Coat hooks rail on back-left
    const hRail = mk(B(0.65, 0.045, 0.06), M.woodD, true, false);
    hRail.position.set(-3.5, 2.62, -ROOM + 0.07); scene.add(hRail);
    for (let i = 0; i < 4; i++) {
      const hook = mk(C(0.012, 0.012, 0.11, 8), M.brass, false, false);
      hook.rotation.x = Math.PI / 2;
      hook.position.set(-3.78 + i * 0.21, 2.52, -ROOM + 0.12); scene.add(hook);
      // hook tip bend (small sphere)
      const tip = mk(S(0.018, 6, 4), M.brass, false, false);
      tip.position.set(-3.78 + i * 0.21, 2.42, -ROOM + 0.17); scene.add(tip);
    }
    // Jacket
    const jBody = mk(B(0.34, 0.58, 0.07), M.jacket, true, false);
    jBody.position.set(-3.62, 2.18, -ROOM + 0.14); scene.add(jBody);
    [[-0.19, 0.28],[0.19, -0.28]].forEach(([oz, ry]) => {
      const sleeve = mk(B(0.12, 0.32, 0.06), M.jacket, true, false);
      sleeve.position.set(-3.62 + Math.sign(oz)*0.19, 2.05, -ROOM + 0.14);
      sleeve.rotation.z = oz * 0.5; scene.add(sleeve);
    });

    // Floating shelves
    [[0.22, 2.92], [0.22, 2.34]].forEach(([, sy], si) => {
      const shelf = mk(B(1.65, 0.055, 0.22), M.woodD, true, true);
      shelf.position.set(-1.5, sy, -ROOM + 0.135); scene.add(shelf);
      // Brackets
      [-0.68, 0.68].forEach(ox => {
        const br = mk(B(0.035, 0.16, 0.18), M.metal, false, false);
        br.position.set(-1.5 + ox, sy - 0.095, -ROOM + 0.135); scene.add(br);
      });
      // Books
      const BCOLS = [0xC03020,0x204080,0x206820,0xA06020,0x702080,0x208080,0xDD4444,0x44AA66];
      let bx = -2.26;
      for (let b = 0; b < 5 + si; b++) {
        const bw = 0.1 + Math.random() * 0.07;
        const bh = 0.2 + Math.random() * 0.11;
        const book = mk(B(bw, bh, 0.18),
          new THREE.MeshStandardMaterial({ color: BCOLS[(si*5+b) % BCOLS.length], roughness: 0.85 }), true, false);
        book.position.set(bx + bw/2, sy + 0.03 + bh/2, -ROOM + 0.135);
        bx += bw + 0.012; scene.add(book);
        // Spine label
        const spine = mk(B(bw - 0.02, bh * 0.4, 0.002),
          new THREE.MeshStandardMaterial({ color: 0xF5F0E0, roughness: 0.95 }), false, false);
        spine.position.set(bx - bw/2 - 0.006, sy + 0.03 + bh/2, -ROOM + 0.046); scene.add(spine);
      }
      // Bookend
      const be = mk(B(0.04, 0.22, 0.18), M.metal, true, false);
      be.position.set(bx + 0.02, sy + 0.06 + 0.11, -ROOM + 0.135); scene.add(be);
    });

    /* ── Desk + chair ────────────────────────────────────────────── */
    const DKX = -2.0, DKY = 0.78, DKZ = -1.8;
    // Desk top
    const deskTop = mk(B(2.05, 0.072, 1.0), M.woodL, true, true);
    deskTop.position.set(DKX, DKY, DKZ); scene.add(deskTop);
    // Desk top edge banding
    [[2.07,0.042,0.042, DKX, DKY-0.015, DKZ-0.479],[2.07,0.042,0.042, DKX, DKY-0.015, DKZ+0.479]].forEach(([w,h,d,x,y,z]) => {
      const e = mk(B(w,h,d), M.woodD, false, false); e.position.set(x,y,z); scene.add(e);
    });
    // Drawer unit
    const duBody = mk(B(0.62, 0.64, 0.93), M.woodL, true, true);
    duBody.position.set(DKX - 0.72, DKY - 0.32 - 0.04, DKZ); scene.add(duBody);
    [-0.14, 0.14].forEach(dy => {
      const dr = mk(B(0.58, 0.22, 0.038), M.woodD, false, false);
      dr.position.set(DKX - 0.72, DKY - 0.32 - 0.04 + dy, DKZ - 0.457); scene.add(dr);
      const drh = mk(B(0.16, 0.022, 0.022), M.brass, false, false);
      drh.position.set(DKX - 0.72, DKY - 0.32 - 0.04 + dy, DKZ - 0.468); scene.add(drh);
    });
    // Thin legs on right side
    [[DKX+0.72, DKZ-0.43],[DKX+0.72, DKZ+0.43]].forEach(([lx,lz]) => {
      const leg = mk(B(0.06, DKY - 0.036, 0.06), M.woodL, true, false);
      leg.position.set(lx, (DKY-0.036)/2, lz); scene.add(leg);
    });
    // Cable tray under desk
    const tray = mk(B(0.8, 0.04, 0.15), M.metal, false, false);
    tray.position.set(DKX + 0.4, 0.28, DKZ); scene.add(tray);

    // Laptop
    const lapB = mk(B(0.65, 0.038, 0.46), M.lapAlu, true, true);
    lapB.position.set(DKX + 0.18, DKY + 0.03, DKZ); scene.add(lapB);
    const lapS = mk(B(0.63, 0.42, 0.032), M.lapRed, true, false);
    lapS.position.set(DKX + 0.18, DKY + 0.25, DKZ - 0.24);
    lapS.rotation.x = 0.32; scene.add(lapS);
    const lapDisp = mk(new THREE.PlaneGeometry(0.58, 0.36), M.screen, false, false);
    lapDisp.position.set(DKX + 0.18, DKY + 0.25, DKZ - 0.222);
    lapDisp.rotation.x = 0.32; scene.add(lapDisp);

    // Desk lamp
    const dlBase = mk(C(0.095, 0.115, 0.055, 10), M.metal, true, false);
    dlBase.position.set(DKX - 0.55, DKY + 0.03, DKZ - 0.32); scene.add(dlBase);
    const dlPole = mk(C(0.022, 0.022, 0.52, 8), M.metal, true, false);
    dlPole.position.set(DKX - 0.55, DKY + 0.295, DKZ - 0.32); scene.add(dlPole);
    const dlArm  = mk(C(0.016, 0.016, 0.28, 8), M.metal, false, false);
    dlArm.rotation.z = 0.6; dlArm.position.set(DKX - 0.44, DKY + 0.63, DKZ - 0.32); scene.add(dlArm);
    const dlShade = mk(C(0.13, 0.075, 0.2, 10), M.lampShd, false, false);
    dlShade.position.set(DKX - 0.32, DKY + 0.78, DKZ - 0.32); scene.add(dlShade);
    const dlBulb = mk(S(0.04, 8, 6), M.bulb, false, false);
    dlBulb.position.set(DKX - 0.32, DKY + 0.76, DKZ - 0.32); scene.add(dlBulb);

    // Mug
    const mugB = mk(C(0.068, 0.058, 0.13, 12), M.mug, true, false);
    mugB.position.set(DKX + 0.68, DKY + 0.072, DKZ - 0.28); scene.add(mugB);
    const mugTop = mk(C(0.065, 0.065, 0.01, 12),
      new THREE.MeshStandardMaterial({ color: 0x8BBBD8, roughness: 0.5, emissive: new THREE.Color(0x334455), emissiveIntensity: 0.2 }), false, false);
    mugTop.position.set(DKX + 0.68, DKY + 0.138, DKZ - 0.28); scene.add(mugTop);
    const mugHandle = mk(new THREE.TorusGeometry(0.042, 0.011, 6, 12, Math.PI), M.mug, false, false);
    mugHandle.rotation.y = -Math.PI / 2; mugHandle.position.set(DKX + 0.745, DKY + 0.072, DKZ - 0.28); scene.add(mugHandle);

    // Papers / notebook
    [0,1,2].forEach(i => {
      const p = mk(B(0.28 + Math.random()*0.08, 0.006, 0.22), M.paper, false, true);
      p.position.set(DKX - 0.22 + i*0.05, DKY + 0.04 + i*0.007, DKZ + 0.22 + (Math.random()-0.5)*0.08);
      p.rotation.y = (Math.random()-0.5)*0.25; scene.add(p);
    });
    // Notebook (darker, with spiral)
    const nb = mk(B(0.22, 0.014, 0.28), new THREE.MeshStandardMaterial({ color: 0x224466, roughness: 0.85 }), false, true);
    nb.position.set(DKX - 0.2, DKY + 0.054, DKZ - 0.15); nb.rotation.y = 0.15; scene.add(nb);
    const nbSpiral = mk(C(0.012, 0.012, 0.22, 8), M.metal, false, false);
    nbSpiral.rotation.z = Math.PI/2; nbSpiral.position.set(DKX - 0.2, DKY + 0.065, DKZ - 0.15); scene.add(nbSpiral);

    // Mouse + mousepad
    const pad = mk(B(0.28, 0.004, 0.22), new THREE.MeshStandardMaterial({ color: 0x1A1A2A, roughness: 0.98 }), false, true);
    pad.position.set(DKX + 0.62, DKY + 0.038, DKZ + 0.22); scene.add(pad);
    const mouse = mk(B(0.07, 0.028, 0.11), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.1 }), false, false);
    mouse.position.set(DKX + 0.62, DKY + 0.055, DKZ + 0.19); scene.add(mouse);

    // Desk chair
    const seat = mk(B(0.64, 0.095, 0.62), M.chairRed, true, true);
    seat.position.set(DKX, 0.535, DKZ + 0.95); scene.add(seat);
    // Seat cushion slight bow
    const cushFront = mk(B(0.62, 0.04, 0.3), M.chairRed, true, false);
    cushFront.position.set(DKX, 0.572, DKZ + 1.12); scene.add(cushFront);
    const backrest = mk(B(0.62, 0.58, 0.07), M.chairRed, true, false);
    backrest.position.set(DKX, 0.87, DKZ + 1.28); scene.add(backrest);
    const brLumbar = mk(B(0.5, 0.14, 0.04), M.chairRed, false, false);
    brLumbar.position.set(DKX, 0.64, DKZ + 1.27); scene.add(brLumbar);
    // Arms
    [DKX-0.35, DKX+0.35].forEach(ax => {
      const arm = mk(B(0.055, 0.04, 0.36), M.chairRed, false, false);
      arm.position.set(ax, 0.69, DKZ + 0.98); scene.add(arm);
      const armPost = mk(B(0.045, 0.2, 0.045), M.metal, false, false);
      armPost.position.set(ax, 0.58, DKZ + 0.85); scene.add(armPost);
    });
    // Gas cylinder + star base
    const gas = mk(C(0.028, 0.028, 0.48, 8), M.chrome, true, false);
    gas.position.set(DKX, 0.24, DKZ + 0.95); scene.add(gas);
    const base5 = mk(C(0.32, 0.28, 0.048, 5), M.metal, true, false);
    base5.position.set(DKX, 0.024, DKZ + 0.95); scene.add(base5);
    for (let i = 0; i < 5; i++) {
      const a = (i/5) * Math.PI * 2;
      const caster = mk(S(0.035, 6, 4), M.metal, false, false);
      caster.position.set(DKX + Math.cos(a)*0.28, 0.035, DKZ + 0.95 + Math.sin(a)*0.28); scene.add(caster);
    }

    /* ── Wardrobe ────────────────────────────────────────────────── */
    const WDX = 1.3, WDZ = -4.68;
    const wBody = mk(B(1.65, 2.28, 0.56), M.wardGold, true, true);
    wBody.position.set(WDX, 1.14, WDZ); scene.add(wBody);
    // Top crown moulding
    const wTop = mk(B(1.75, 0.09, 0.62), M.woodD, true, false);
    wTop.position.set(WDX, 2.335, WDZ); scene.add(wTop);
    const wTopEdge = mk(B(1.73, 0.042, 0.042), M.woodD, false, false);
    wTopEdge.position.set(WDX, 2.31, WDZ - 0.289); scene.add(wTopEdge);
    // Feet
    [-0.7, 0.7].forEach(ox => {
      const foot = mk(B(0.12, 0.08, 0.12), M.woodD, true, false);
      foot.position.set(WDX + ox, 0.04, WDZ); scene.add(foot);
    });
    // Centre divider
    const div = mk(B(0.05, 2.18, 0.02), M.woodD, false, false);
    div.position.set(WDX, 1.14, WDZ - 0.265); scene.add(div);
    // Left door (mirror / glowing)
    const dL = mk(B(0.77, 1.98, 0.04), M.wardGlow, false, false);
    dL.position.set(WDX - 0.44, 1.14, WDZ - 0.265); scene.add(dL);
    // Left door frame
    const dLFrame = mk(B(0.79, 2.0, 0.02), M.woodD, false, false);
    dLFrame.position.set(WDX - 0.44, 1.14, WDZ - 0.272); scene.add(dLFrame);
    // Right door
    const dR = mk(B(0.77, 1.98, 0.04), M.wardGold, false, false);
    dR.position.set(WDX + 0.44, 1.14, WDZ - 0.265); scene.add(dR);
    const dRFrame = mk(B(0.79, 2.0, 0.02), M.woodD, false, false);
    dRFrame.position.set(WDX + 0.44, 1.14, WDZ - 0.272); scene.add(dRFrame);
    // Handles
    [WDX - 0.08, WDX + 0.08].forEach((hx, hi) => {
      const hPlate = mk(B(0.028, 0.12, 0.022), M.brass, false, false);
      hPlate.position.set(hx, 1.14, WDZ - 0.277); scene.add(hPlate);
    });

    /* ── Guitar (leaning) ───────────────────────────────────────── */
    const GX = 2.95, GZ = -4.76;
    [
      [B(0.37, 0.52, 0.1), M.guitar, GX, 0.76, GZ, 0.12],
      [B(0.25, 0.17, 0.09), M.guitar, GX + 0.03, 1.1, GZ, 0.12],
      [B(0.32, 0.38, 0.09), M.guitar, GX + 0.05, 1.4, GZ, 0.12],
      [B(0.068, 0.98, 0.052), M.gutarDk, GX + 0.09, 2.12, GZ, 0.12],
      [B(0.1, 0.22, 0.048), M.gutarDk, GX + 0.12, 2.7, GZ, 0.12],
    ].forEach(([geo, mat, x, y, z, rz]) => {
      const g = mk(geo, mat, true, false);
      g.position.set(x, y, z); g.rotation.z = rz; scene.add(g);
    });
    // Sound hole
    const sh = mk(C(0.075, 0.075, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x1A0800, roughness: 1 }), false, false);
    sh.rotation.x = Math.PI/2; sh.position.set(GX, 1.02, GZ - 0.04); scene.add(sh);
    // Strings (thin cylinders)
    for (let s = 0; s < 6; s++) {
      const str = mk(C(0.002, 0.002, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.15, metalness: 0.9 }), false, false);
      str.rotation.z = 0.12;
      str.position.set(GX + 0.09 + (s-2.5)*0.008, 1.9, GZ - 0.04); scene.add(str);
    }

    /* ── Picture frames (right wall) ────────────────────────────── */
    [[3.2, 3.1, 0.58, 0.48],[2.3, 2.92, 0.52, 0.52],[3.6, 2.55, 0.38, 0.38]].forEach(([fz, fy, fw, fh], i) => {
      const frameOuter = mk(B(0.055, fh + 0.08, fw + 0.08), M.woodD, false, false);
      frameOuter.position.set(ROOM - 0.055, fy, fz); scene.add(frameOuter);
      const PICOLS = [0x556688, 0x886644, 0x447766];
      const pic = mk(new THREE.PlaneGeometry(fw, fh),
        new THREE.MeshStandardMaterial({ color: PICOLS[i], roughness: 0.9 }), false, false);
      pic.rotation.y = -Math.PI/2;
      pic.position.set(ROOM - 0.03, fy, fz); scene.add(pic);
    });

    /* ── Bed ─────────────────────────────────────────────────────── */
    const BX = 3.0, BZ = 1.4;
    // Slats base
    const bedBase = mk(B(2.05, 0.18, 3.25), M.bedFrame, true, true);
    bedBase.position.set(BX, 0.09, BZ); scene.add(bedBase);
    // Slats detail
    for (let i = 0; i < 7; i++) {
      const slat = mk(B(1.9, 0.04, 0.1), M.woodL, false, false);
      slat.position.set(BX, 0.2, BZ - 1.4 + i * 0.45); scene.add(slat);
    }
    // Headboard
    const hb = mk(B(2.08, 0.95, 0.14), M.bedFrame, true, false);
    hb.position.set(BX, 0.62, BZ - 1.56); scene.add(hb);
    [[-0.56,0],[0.56,0]].forEach(([ox]) => {
      const panel = mk(B(0.8, 0.68, 0.03), new THREE.MeshStandardMaterial({ color: 0x7A4228, roughness: 0.72, map: TEX.woodD }), false, false);
      panel.position.set(BX + ox, 0.62, BZ - 1.498); scene.add(panel);
    });
    const hbTop = mk(B(2.1, 0.06, 0.16), M.bedFrame, false, false);
    hbTop.position.set(BX, 1.115, BZ - 1.56); scene.add(hbTop);
    // Footboard
    const fb = mk(B(2.08, 0.44, 0.1), M.bedFrame, true, false);
    fb.position.set(BX, 0.28, BZ + 1.68); scene.add(fb);
    // Mattress
    const matt = mk(B(1.88, 0.24, 3.0), new THREE.MeshStandardMaterial({ color: 0xECE6D8, roughness: 0.96 }), true, true);
    matt.position.set(BX, 0.3, BZ); scene.add(matt);
    // Duvet (blue, slightly bunched)
    const duvet = mk(B(1.82, 0.15, 2.3), M.bedBlue, true, true);
    duvet.position.set(BX, 0.45, BZ + 0.3); scene.add(duvet);
    // Duvet fold at top
    const duvetFold = mk(B(1.82, 0.06, 0.25), M.bedDark, false, false);
    duvetFold.position.set(BX, 0.49, BZ - 0.82); scene.add(duvetFold);
    // Pillows
    [BX - 0.48, BX + 0.48].forEach(px => {
      const pillow = mk(B(0.74, 0.13, 0.48), M.bedWhite, true, true);
      pillow.position.set(px, 0.41, BZ - 1.24); scene.add(pillow);
    });
    const bluePillow = mk(B(0.42, 0.11, 0.42), new THREE.MeshStandardMaterial({ color: 0x6890C4, roughness: 0.92 }), true, true);
    bluePillow.position.set(BX, 0.43, BZ - 1.08); scene.add(bluePillow);

    // Nightstand
    const ns = mk(B(0.55, 0.58, 0.45), M.woodL, true, true);
    ns.position.set(BX + 1.38, 0.29, BZ - 1.2); scene.add(ns);
    const nsTop = mk(B(0.57, 0.04, 0.47), M.woodD, false, false);
    nsTop.position.set(BX + 1.38, 0.6, BZ - 1.2); scene.add(nsTop);
    // Drawer
    const nsDr = mk(B(0.5, 0.2, 0.038), M.woodD, false, false);
    nsDr.position.set(BX + 1.38, 0.28, BZ - 0.975); scene.add(nsDr);
    const nsDrh = mk(B(0.1, 0.018, 0.018), M.brass, false, false);
    nsDrh.position.set(BX + 1.38, 0.28, BZ - 0.955); scene.add(nsDrh);
    // Table lamp on nightstand
    const tlBase = mk(C(0.07, 0.09, 0.045, 10), M.brass, false, false);
    tlBase.position.set(BX + 1.38, 0.645, BZ - 1.2); scene.add(tlBase);
    const tlPole = mk(C(0.018, 0.018, 0.32, 8), M.brass, false, false);
    tlPole.position.set(BX + 1.38, 0.81, BZ - 1.2); scene.add(tlPole);
    const tlShade = mk(C(0.16, 0.09, 0.2, 10), M.lampShd, false, false);
    tlShade.position.set(BX + 1.38, 0.99, BZ - 1.2); scene.add(tlShade);
    const tlBulb = mk(S(0.035, 8, 6), M.bulb, false, false);
    tlBulb.position.set(BX + 1.38, 0.99, BZ - 1.2); scene.add(tlBulb);
    const nightLight = new THREE.PointLight(0xFFBB55, 0.55, 2.0, 2);
    nightLight.position.set(BX + 1.38, 0.99, BZ - 1.2); scene.add(nightLight);

    /* ── Bookshelf (right-back area) ─────────────────────────────── */
    const SHX = 4.28, SHZ = -3.4;
    const shBack = mk(B(0.08, 2.85, 1.45), M.woodD, true, true);
    shBack.position.set(SHX - 0.02, 1.425, SHZ); scene.add(shBack);
    const shTop = mk(B(0.1, 0.06, 1.5), M.woodD, true, false);
    shTop.position.set(SHX - 0.01, 2.88, SHZ); scene.add(shTop);
    [0.15, 0.18].forEach(sz => {
      const ss = mk(B(0.06, sz === 0.15 ? 2.85 : 2.85, 0.06), M.woodD, true, false);
      ss.position.set(SHX - 0.01, 1.425, SHZ + (sz === 0.15 ? 0.72 : -0.72)); scene.add(ss);
    });
    [0.28, 1.04, 1.8, 2.56].forEach((sy, si) => {
      const shelf2 = mk(B(0.06, 0.05, 1.38), M.woodD, false, false);
      shelf2.position.set(SHX - 0.01, sy, SHZ); scene.add(shelf2);
      if (si < 3) {
        let bz2 = SHZ - 0.62;
        for (let b = 0; b < 4 + si; b++) {
          const bw2 = 0.1 + Math.random() * 0.07;
          const bh2 = 0.22 + Math.random() * 0.12;
          const book2 = mk(B(0.08, bh2, bw2),
            new THREE.MeshStandardMaterial({ color: M.bookColors[(si*4+b) % M.bookColors.length], roughness: 0.85 }), true, false);
          book2.position.set(SHX - 0.01, sy + 0.025 + bh2/2, bz2 + bw2/2);
          bz2 += bw2 + 0.01; scene.add(book2);
        }
      }
    });

    /* ── Plants ──────────────────────────────────────────────────── */
    function addPlant(px, pz, scale = 1) {
      const pot2 = mk(C(0.1*scale, 0.13*scale, 0.22*scale, 10), M.pot, true, true);
      pot2.position.set(px, 0.11*scale, pz); scene.add(pot2);
      // Soil
      const soil = mk(C(0.09*scale, 0.09*scale, 0.025, 10), new THREE.MeshStandardMaterial({ color: 0x2A1808, roughness: 1 }), false, false);
      soil.position.set(px, 0.225*scale, pz); scene.add(soil);
      // Main stem
      const stem2 = mk(C(0.022*scale, 0.028*scale, 0.38*scale, 8), new THREE.MeshStandardMaterial({ color: 0x2A5820, roughness: 0.9 }), true, false);
      stem2.position.set(px, 0.42*scale, pz); scene.add(stem2);
      // Foliage clusters
      [[0, 0.66*scale, 0, 0.24*scale],[0.1*scale, 0.58*scale, 0.06*scale, 0.16*scale],
       [-0.08*scale, 0.6*scale, -0.05*scale, 0.14*scale],[0.06*scale, 0.7*scale, -0.08*scale, 0.13*scale]
      ].forEach(([fx,fy,fz,fr]) => {
        const leaf = mk(S(fr, 10, 8), fr > 0.2 ? M.plant : M.plantLt, true, false);
        leaf.position.set(px+fx, fy, pz+fz); scene.add(leaf);
      });
    }
    addPlant(-4.4, -3.1, 1.5);
    addPlant(4.3, -3.4, 1.1);
    addPlant(-4.7, 1.6, 0.85);
    // Small pot on desk
    const smallPot = mk(C(0.055, 0.07, 0.1, 8), M.pot, true, false);
    smallPot.position.set(DKX - 0.88, DKY + 0.09, DKZ - 0.3); scene.add(smallPot);
    const smallLeaf = mk(S(0.1, 8, 6), M.plant, true, false);
    smallLeaf.position.set(DKX - 0.88, DKY + 0.23, DKZ - 0.3); scene.add(smallLeaf);

    /* ── Couch + coffee table ────────────────────────────────────── */
    const COX = 2.5, COZ = 1.8;
    const couchBase2 = mk(B(2.05, 0.44, 0.95), new THREE.MeshStandardMaterial({ color: 0x6A5A4A, roughness: 0.94 }), true, true);
    couchBase2.position.set(COX, 0.22, COZ); scene.add(couchBase2);
    const couchBack2 = mk(B(2.05, 0.58, 0.14), new THREE.MeshStandardMaterial({ color: 0x5E5040, roughness: 0.94 }), true, false);
    couchBack2.position.set(COX, 0.66, COZ + 0.41); scene.add(couchBack2);
    [COX - 1.08, COX + 1.08].forEach(ax => {
      const arm2 = mk(B(0.14, 0.56, 0.95), new THREE.MeshStandardMaterial({ color: 0x5E5040, roughness: 0.94 }), true, true);
      arm2.position.set(ax, 0.35, COZ); scene.add(arm2);
    });
    const cushion2 = mk(B(1.78, 0.15, 0.78), new THREE.MeshStandardMaterial({ color: 0x7A6A58, roughness: 0.95 }), true, true);
    cushion2.position.set(COX, 0.515, COZ - 0.06); scene.add(cushion2);
    // Throw pillow
    const tp = mk(B(0.38, 0.12, 0.38), new THREE.MeshStandardMaterial({ color: 0x8A7060, roughness: 0.96 }), true, true);
    tp.position.set(COX - 0.7, 0.61, COZ - 0.2); scene.add(tp);

    // Coffee table
    const ctT = mk(B(0.95, 0.055, 0.58), new THREE.MeshStandardMaterial({ map: TEX.woodL, roughness: 0.58 }), true, true);
    ctT.position.set(COX, 0.38, COZ - 0.72); scene.add(ctT);
    [[COX-0.4, COZ-0.5],[COX+0.4, COZ-0.5],[COX-0.4, COZ-0.94],[COX+0.4, COZ-0.94]].forEach(([lx,lz]) => {
      const ctLeg2 = mk(B(0.048, 0.38, 0.048), M.woodD, true, false);
      ctLeg2.position.set(lx, 0.19, lz); scene.add(ctLeg2);
    });
    // Items on coffee table
    const ctBook2 = mk(B(0.2, 0.028, 0.26), new THREE.MeshStandardMaterial({ color: 0x3A5A7A, roughness: 0.85 }), false, true);
    ctBook2.position.set(COX - 0.2, 0.408, COZ - 0.72); ctBook2.rotation.y = 0.22; scene.add(ctBook2);
    const ctCandle = mk(C(0.035, 0.035, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xF0ECD8, roughness: 0.8 }), true, false);
    ctCandle.position.set(COX + 0.28, 0.488, COZ - 0.72); scene.add(ctCandle);

    /* ── Dresser (left wall) ──────────────────────────────────────── */
    const DSX = -1.5, DSZ = 3.78;
    const dsBody2 = mk(B(1.25, 0.88, 0.52), M.woodL, true, true);
    dsBody2.position.set(DSX, 0.44, DSZ); scene.add(dsBody2);
    const dsTop2 = mk(B(1.3, 0.045, 0.56), M.woodD, false, false);
    dsTop2.position.set(DSX, 0.9, DSZ); scene.add(dsTop2);
    [[DSX - 0.32, 0.64],[DSX + 0.32, 0.64],[DSX - 0.32, 0.26],[DSX + 0.32, 0.26]].forEach(([dx,dy]) => {
      const dd = mk(B(0.56, 0.3, 0.036), M.woodD, false, false);
      dd.position.set(dx, dy, DSZ - 0.252); scene.add(dd);
      const ddh = mk(B(0.12, 0.018, 0.018), M.brass, false, false);
      ddh.position.set(dx, dy, DSZ - 0.262); scene.add(ddh);
    });
    // Mirror above dresser
    const mFrame = mk(B(0.055, 0.92, 0.74), M.woodD, false, false);
    mFrame.position.set(DSX, 1.68, DSZ + 0.02); scene.add(mFrame);
    const mGlass = mk(new THREE.PlaneGeometry(0.65, 0.82), M.glass, false, false);
    mGlass.rotation.y = Math.PI; mGlass.position.set(DSX, 1.68, DSZ + 0.01); scene.add(mGlass);
    // Plant on dresser
    addPlant(DSX - 0.4, DSZ, 0.62);

    /* ── Floor lamp (front wall) ─────────────────────────────────── */
    const FLX = -3.5, FLZ = 3.8;
    const flBase2 = mk(C(0.16, 0.2, 0.055, 12), M.metal, true, false);
    flBase2.position.set(FLX, 0.03, FLZ); scene.add(flBase2);
    const flPole2 = mk(C(0.022, 0.022, 1.72, 8), M.metal, true, false);
    flPole2.position.set(FLX, 0.9, FLZ); scene.add(flPole2);
    const flShade2 = mk(C(0.3, 0.16, 0.3, 12), M.lampShd, false, false);
    flShade2.position.set(FLX, 1.9, FLZ); scene.add(flShade2);
    const flBulb2 = mk(S(0.045, 8, 6), M.bulb, false, false);
    flBulb2.position.set(FLX, 1.88, FLZ); scene.add(flBulb2);
    const flLight2 = new THREE.PointLight(0xFFCC88, 0.9, 3.0, 2);
    flLight2.position.set(FLX, 1.75, FLZ); scene.add(flLight2);

    /* ── Resize ─────────────────────────────────────────────────── */
    function updateFrustum(fs) {
      const a = W / H;
      camera.left   = -fs * a / 2;
      camera.right  =  fs * a / 2;
      camera.top    =  fs / 2;
      camera.bottom = -fs / 2;
      camera.updateProjectionMatrix();
    }
    function onResize() {
      W = mount.offsetWidth  || window.innerWidth;
      H = mount.offsetHeight || window.innerHeight;
      updateFrustum(currentFrustum);
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    /* ── Animate ────────────────────────────────────────────────── */
    let frame;
    let t = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      t += 0.016;

      // Lerp azimuth
      let target = targetRef.current;
      let diff = target - azimuth;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      azimuth += diff * 0.055;
      setCam(azimuth);

      // Lerp frustum (zoom)
      const targetFrustum = BASE_FRUSTUM * zoomRef.current;
      if (Math.abs(targetFrustum - currentFrustum) > 0.001) {
        currentFrustum += (targetFrustum - currentFrustum) * 0.1;
        updateFrustum(currentFrustum);
      }

      // Subtle flame/bulb flicker
      const flk = 0.96 + Math.sin(t * 11.3) * 0.06 + Math.sin(t * 7.1) * 0.03;
      nightLight.intensity = 0.55 * flk;
      flLight2.intensity   = 0.9  * flk;
      deskLamp.intensity   = 1.6  * (0.97 + Math.sin(t * 4.2) * 0.03);

      renderer.render(scene, camera);
    }
    animate();

    /* ── Cleanup ────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
