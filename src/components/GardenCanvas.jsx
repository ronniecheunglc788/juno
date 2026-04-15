import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Cyanne — 3D Morning Garden ────────────────────────────────────────
// A living garden world. Spotlight = sunflower. Events = blooms.
// Emails = butterflies. Bees visit flowers. Clouds drift. Sun warms.

const FLOWER_COLORS = {
  spotlight: { petals: 0xFFE033, center: 0xFF7700, stem: 0x2A7A30 },
  event:     { petals: 0xFF7BAC, center: 0xFFD040, stem: 0x2A7A30 },
  email:     { petals: 0xB0E0FF, center: 0xFFFFFF, stem: 0x2A7A30 },
  default:   { petals: 0xCCA0FF, center: 0xFFE8FF, stem: 0x2A7A30 },
};
function flowerCfg(t) { return FLOWER_COLORS[t] || FLOWER_COLORS.default; }

const BFLY_COLORS = [0x88CCFF, 0x99EEC0, 0xFFAACC, 0xCCAAFF, 0xFFDD88];

export default function GardenCanvas({ entities, onEntityClick, subtitle }) {
  const mountRef   = useRef(null);
  const onClickRef = useRef(onEntityClick);
  useEffect(() => { onClickRef.current = onEntityClick; });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Size from parent, exactly like the 2D canvas did (parent is already laid out)
    const parent = mount.parentElement;
    mount.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    let W = parent.offsetWidth  || window.innerWidth;
    let H = parent.offsetHeight || window.innerHeight;
    renderer.setSize(W, H);

    // ── Scene ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xA8D8F0);
    scene.fog = new THREE.FogExp2(0xC0E8F8, 0.014);

    // ── Camera ────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 300);
    camera.position.set(0, 9, 19);
    camera.lookAt(0, 1.5, 0);

    // ── Lights ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xFFF8E8, 0.5));
    scene.add(new THREE.HemisphereLight(0x88CCFF, 0x5A9C60, 0.75));
    const dirLight = new THREE.DirectionalLight(0xFFF0A0, 1.6);
    dirLight.position.set(12, 26, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    const sc = dirLight.shadow.camera;
    sc.near = 0.5; sc.far = 70;
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    // Sky is just the scene background color — no geometry needed

    // ── Ground ────────────────────────────────────────────────────────
    const geoGround = new THREE.PlaneGeometry(60, 60, 120, 120);
    const gPos = geoGround.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const x = gPos.getX(i), y = gPos.getY(i);
      gPos.setZ(i,
        Math.sin(x * 0.22) * 0.28 + Math.sin(y * 0.30) * 0.20 +
        Math.sin((x + y) * 0.18) * 0.14 + Math.cos(x * 0.5 + y * 0.3) * 0.08
      );
    }
    geoGround.computeVertexNormals();
    const meshGround = new THREE.Mesh(geoGround, new THREE.MeshLambertMaterial({ color: 0x52A858 }));
    meshGround.rotation.x = -Math.PI / 2;
    meshGround.receiveShadow = true;
    scene.add(meshGround);

    // ── Stone path ────────────────────────────────────────────────────
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xBBAA90 });
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const px = Math.sin(t * Math.PI * 1.1) * 1.8 + (Math.random() - 0.5) * 0.5;
      const pz = 10 - t * 22 + (Math.random() - 0.5) * 0.5;
      const r  = 0.28 + Math.random() * 0.16;
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r * 1.1, 0.07, 6 + Math.floor(Math.random() * 4)),
        stoneMat
      );
      stone.position.set(px, 0.035, pz);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      scene.add(stone);
    }

    // ── Pond ──────────────────────────────────────────────────────────
    const pondMat = new THREE.MeshPhongMaterial({
      color: 0x3A88CC, shininess: 120, transparent: true, opacity: 0.78,
      specular: new THREE.Color(0xAADDFF),
    });
    const pond = new THREE.Mesh(new THREE.CircleGeometry(2.8, 24), pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-6.5, 0.06, -3);
    scene.add(pond);

    // Lily pads
    const lilyMat = new THREE.MeshLambertMaterial({ color: 0x4A9A40 });
    [[-6.2, -2.4], [-7.1, -3.2], [-5.8, -3.8], [-6.8, -2.0]].forEach(([lx, lz]) => {
      const lily = new THREE.Mesh(new THREE.CircleGeometry(0.3 + Math.random() * 0.15, 10), lilyMat);
      lily.rotation.x = -Math.PI / 2;
      lily.position.set(lx, 0.07, lz);
      scene.add(lily);
      const flower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8),
        new THREE.MeshLambertMaterial({ color: 0xFFF0C8 })
      );
      flower.position.set(lx, 0.1, lz);
      scene.add(flower);
    });

    // ── Trees ─────────────────────────────────────────────────────────
    const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    const treeMeshes = [];
    [[-11, -7], [10, -9], [-9, 5], [11, 4], [0, -14], [-13, -1]].forEach(([tx, tz]) => {
      const trunkH = 3.5 + Math.random() * 2;
      const trunk  = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, trunkH, 8), treeTrunkMat);
      trunk.position.set(tx, trunkH / 2, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      const canopyColor = new THREE.Color(0x2A7030).lerp(new THREE.Color(0x3A9040), Math.random());
      const canopyMat   = new THREE.MeshLambertMaterial({ color: canopyColor });
      const canopyGroup = new THREE.Group();
      canopyGroup.position.set(tx, trunkH + 0.5, tz);
      [[0, 0.6, 0], [-0.9, 0, 0.3], [0.9, 0, -0.3], [0, 0, -1.0], [0, 0, 1.0]].forEach(([cx, cy, cz]) => {
        const cs = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 0.5, 9, 7), canopyMat);
        cs.position.set(cx, cy, cz);
        cs.castShadow = true;
        canopyGroup.add(cs);
      });
      scene.add(canopyGroup);
      treeMeshes.push({ group: canopyGroup, phase: Math.random() * Math.PI * 2 });
    });

    // ── Grass (instanced) ─────────────────────────────────────────────
    const GRASS_N = 2200;
    const geoGrass = new THREE.PlaneGeometry(0.055, 0.32);
    const gv = geoGrass.attributes.position;
    for (let i = 0; i < gv.count; i++) gv.setY(i, gv.getY(i) + 0.16);
    geoGrass.computeVertexNormals();
    const grassMesh = new THREE.InstancedMesh(
      geoGrass,
      new THREE.MeshBasicMaterial({ color: 0x50B050, side: THREE.DoubleSide }),
      GRASS_N
    );
    scene.add(grassMesh);
    const dummy     = new THREE.Object3D();
    const grassData = [];
    for (let i = 0; i < GRASS_N; i++) {
      let gx, gz, att = 0;
      do {
        gx = (Math.random() - 0.5) * 40;
        gz = (Math.random() - 0.5) * 40;
        att++;
      } while (att < 25 && Math.abs(gx) < 1.6 && gz > -12 && gz < 11);
      const ry = Math.random() * Math.PI * 2;
      const s  = 0.7 + Math.random() * 0.7;
      const ph = Math.random() * Math.PI * 2;
      const dk = Math.random() > 0.5;
      grassData.push({ gx, gz, ry, s, ph, dk });
      dummy.position.set(gx, 0, gz);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(1, s, 1);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(i, dummy.matrix);
      grassMesh.setColorAt(i, new THREE.Color(dk ? 0x388038 : 0x58B858));
    }
    grassMesh.instanceMatrix.needsUpdate = true;
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;

    // ── Hedge perimeter ───────────────────────────────────────────────
    const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x286828 });
    for (let i = 0; i < 32; i++) {
      const a  = (i / 32) * Math.PI * 2;
      const r  = 15 + Math.sin(a * 5) * 0.5;
      const sz = 0.55 + Math.random() * 0.5;
      const h  = new THREE.Mesh(new THREE.SphereGeometry(sz, 7, 6), hedgeMat);
      h.position.set(Math.cos(a) * r, sz * 0.35, Math.sin(a) * r);
      h.castShadow = true;
      scene.add(h);
    }

    // ── Background wild flowers (decorative) ──────────────────────────
    const wildCols = [0xFFFFAA, 0xFFCCDD, 0xDDFFDD, 0xCCEEFF, 0xFFDDAA, 0xFFAAFF, 0xFFEECC];
    for (let w = 0; w < 65; w++) {
      let wx, wz;
      do { wx = (Math.random() - 0.5) * 28; wz = (Math.random() - 0.5) * 26; }
      while (Math.abs(wx) < 2.8 && Math.abs(wz) < 10);

      const col   = wildCols[Math.floor(Math.random() * wildCols.length)];
      const stemH = 0.3 + Math.random() * 0.6;
      const sz    = 0.07 + Math.random() * 0.1;
      const wg    = new THREE.Group();
      wg.position.set(wx, 0, wz);

      const stemM = new THREE.MeshLambertMaterial({ color: 0x3A8840 });
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.022, stemH, 5), stemM);
      s.position.y = stemH / 2;
      wg.add(s);

      const pm = new THREE.MeshLambertMaterial({ color: col });
      const pg = new THREE.SphereGeometry(sz, 5, 3);
      const nP = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < nP; p++) {
        const a  = (p / nP) * Math.PI * 2;
        const wp = new THREE.Mesh(pg, pm);
        wp.scale.set(0.55, 0.3, 1.15);
        wp.position.set(Math.cos(a) * sz * 1.2, stemH, Math.sin(a) * sz * 1.2);
        wg.add(wp);
      }
      const center = new THREE.Mesh(
        new THREE.CylinderGeometry(sz * 0.5, sz * 0.5, 0.04, 8),
        new THREE.MeshLambertMaterial({ color: 0xFFE840 })
      );
      center.position.set(0, stemH, 0);
      wg.add(center);
      scene.add(wg);
    }

    // ── Useless decorative plants (purely vibes) ──────────────────────

    // Mushrooms
    const mushCap = new THREE.MeshLambertMaterial({ color: 0xCC3322 });
    const mushSpot = new THREE.MeshLambertMaterial({ color: 0xFFFFEE });
    const mushStem = new THREE.MeshLambertMaterial({ color: 0xEEDDCC });
    for (let m = 0; m < 18; m++) {
      let mx, mz;
      do { mx = (Math.random() - 0.5) * 26; mz = (Math.random() - 0.5) * 22; }
      while (Math.abs(mx) < 3 && Math.abs(mz) < 8);
      const mg   = new THREE.Group();
      const sh   = 0.18 + Math.random() * 0.22;
      const st   = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, sh, 8), mushStem);
      st.position.y = sh / 2;
      mg.add(st);
      const cr = 0.14 + Math.random() * 0.14;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), mushCap);
      cap.position.y = sh;
      mg.add(cap);
      for (let d = 0; d < 4; d++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), mushSpot);
        const da  = (d / 4) * Math.PI * 2;
        dot.position.set(Math.cos(da) * cr * 0.55, sh + cr * 0.35, Math.sin(da) * cr * 0.55);
        mg.add(dot);
      }
      mg.position.set(mx, 0, mz);
      mg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(mg);
    }

    // Fern fronds
    const fernMat = new THREE.MeshLambertMaterial({ color: 0x2D6E30, side: THREE.DoubleSide });
    for (let f = 0; f < 22; f++) {
      let fx, fz;
      do { fx = (Math.random() - 0.5) * 28; fz = (Math.random() - 0.5) * 24; }
      while (Math.abs(fx) < 2.5 && Math.abs(fz) < 9);
      const fg = new THREE.Group();
      const fronds = 5 + Math.floor(Math.random() * 4);
      for (let fr = 0; fr < fronds; fr++) {
        const fa     = (fr / fronds) * Math.PI * 2;
        const flen   = 0.35 + Math.random() * 0.4;
        const frond  = new THREE.Mesh(new THREE.PlaneGeometry(0.08, flen), fernMat);
        frond.position.set(Math.cos(fa) * flen * 0.4, flen * 0.4, Math.sin(fa) * flen * 0.4);
        frond.rotation.set(-Math.PI * 0.25, fa, 0.4);
        fg.add(frond);
      }
      fg.position.set(fx, 0, fz);
      fg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(fg);
    }

    // Tall reeds / cattails
    const reedMat  = new THREE.MeshLambertMaterial({ color: 0x7A6030 });
    const reedStem = new THREE.MeshLambertMaterial({ color: 0x5A8040 });
    for (let r = 0; r < 14; r++) {
      let rx, rz;
      do { rx = (Math.random() - 0.5) * 26; rz = (Math.random() - 0.5) * 22; }
      while (Math.abs(rx) < 2 && Math.abs(rz) < 8);
      const rg   = new THREE.Group();
      const rh   = 1.1 + Math.random() * 0.9;
      const rs   = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, rh, 6), reedStem);
      rs.position.y = rh / 2;
      rg.add(rs);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8), reedMat);
      head.position.y = rh + 0.1;
      rg.add(head);
      // Leaf blades
      for (let l = 0; l < 3; l++) {
        const la  = l * 2.1;
        const lm  = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.5 + Math.random() * 0.3),
          new THREE.MeshLambertMaterial({ color: 0x4A8840, side: THREE.DoubleSide }));
        lm.position.set(Math.cos(la) * 0.05, rh * 0.5, Math.sin(la) * 0.05);
        lm.rotation.set(0.3, la, 0.2);
        rg.add(lm);
      }
      rg.position.set(rx, 0, rz);
      rg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(rg);
    }

    // Tiny cacti (they have no business being in this garden)
    const cactusMat  = new THREE.MeshLambertMaterial({ color: 0x4A8840 });
    const cactusSpine = new THREE.MeshLambertMaterial({ color: 0xEEDDAA });
    for (let c = 0; c < 8; c++) {
      let cx, cz;
      do { cx = (Math.random() - 0.5) * 26; cz = (Math.random() - 0.5) * 22; }
      while (Math.abs(cx) < 2 && Math.abs(cz) < 8);
      const cg = new THREE.Group();
      const ch = 0.4 + Math.random() * 0.5;
      const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, ch, 8), cactusMat);
      cb.position.y = ch / 2;
      cg.add(cb);
      // Arms
      if (Math.random() > 0.4) {
        [-1, 1].forEach(side => {
          const ah  = ch * 0.35;
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.25, 7), cactusMat);
          arm.position.set(side * 0.13, ah, 0);
          arm.rotation.z = side * 1.3;
          cg.add(arm);
        });
      }
      // Spines
      for (let s = 0; s < 12; s++) {
        const sa  = (s / 12) * Math.PI * 2;
        const sy  = Math.random() * ch;
        const sp  = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.07, 3), cactusSpine);
        sp.position.set(Math.cos(sa) * 0.1, sy, Math.sin(sa) * 0.1);
        sp.rotation.z = Math.cos(sa) * Math.PI * 0.4;
        sp.rotation.x = Math.sin(sa) * Math.PI * 0.4;
        cg.add(sp);
      }
      cg.position.set(cx, 0, cz);
      cg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(cg);
    }

    // Mossy rocks
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x888870 });
    const mossMat = new THREE.MeshLambertMaterial({ color: 0x3A6830 });
    for (let k = 0; k < 16; k++) {
      let kx, kz;
      do { kx = (Math.random() - 0.5) * 28; kz = (Math.random() - 0.5) * 24; }
      while (Math.abs(kx) < 2 && Math.abs(kz) < 7);
      const kr  = 0.12 + Math.random() * 0.25;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(kr, 0), rockMat);
      rock.scale.set(1, 0.55 + Math.random() * 0.35, 0.9 + Math.random() * 0.4);
      rock.position.set(kx, kr * 0.35, kz);
      rock.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      rock.castShadow = true;
      scene.add(rock);
      // Moss patch on top
      const moss = new THREE.Mesh(new THREE.SphereGeometry(kr * 0.6, 6, 4), mossMat);
      moss.scale.set(1.1, 0.25, 1.0);
      moss.position.set(kx, kr * 0.7, kz);
      scene.add(moss);
    }

    // ── Data flowers ─────────────────────────────────────────────────
    const flowerMeshes = [];

    function createFlower(entity, x, z, stemH, petalCount, petalSize) {
      const cfg   = flowerCfg(entity.type);
      const group = new THREE.Group();

      // Segmented stem for natural curve
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x2A8030 });
      for (let seg = 0; seg < 3; seg++) {
        const segH = stemH / 3;
        const sm   = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025 - seg * 0.005, 0.04 - seg * 0.005, segH, 6),
          stemMat
        );
        sm.position.y = seg * segH + segH / 2;
        sm.rotation.z  = Math.sin(seg * 0.4) * 0.04;
        group.add(sm);
      }

      // Two leaves at different heights
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x3A9040 });
      [0.4, 0.65].forEach((frac, li) => {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14 * petalSize, 6, 4), leafMat);
        leaf.scale.set(2.6, 0.32, 1);
        leaf.position.set(li === 0 ? 0.22 : -0.18, stemH * frac, 0);
        leaf.rotation.z = li === 0 ? 0.35 : -0.35;
        group.add(leaf);
      });

      // Two petal layers for depth/realism
      const petalMat  = new THREE.MeshLambertMaterial({ color: cfg.petals });
      const petalMat2 = new THREE.MeshLambertMaterial({
        color: new THREE.Color(cfg.petals).multiplyScalar(0.75),
      });
      const petalGeo  = new THREE.SphereGeometry(petalSize * 0.55, 7, 4);
      for (let i = 0; i < petalCount; i++) {
        const a = (i / petalCount) * Math.PI * 2;
        const p1 = new THREE.Mesh(petalGeo, petalMat);
        p1.scale.set(0.5, 0.26, 1.35);
        p1.position.set(Math.cos(a) * petalSize * 0.9, stemH + 0.02, Math.sin(a) * petalSize * 0.9);
        p1.castShadow = true;
        group.add(p1);
        // Inner offset layer
        const a2 = a + Math.PI / petalCount;
        const p2 = new THREE.Mesh(petalGeo, petalMat2);
        p2.scale.set(0.38, 0.2, 1.0);
        p2.position.set(Math.cos(a2) * petalSize * 0.55, stemH - 0.04, Math.sin(a2) * petalSize * 0.55);
        group.add(p2);
      }

      // Center disc
      const center = new THREE.Mesh(
        new THREE.CylinderGeometry(petalSize * 0.44, petalSize * 0.44, 0.13, 12),
        new THREE.MeshLambertMaterial({ color: cfg.center })
      );
      center.position.y = stemH + 0.03;
      group.add(center);

      // Center dot ring
      const dotMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(cfg.center).multiplyScalar(0.65),
      });
      for (let d = 0; d < 6; d++) {
        const da  = (d / 6) * Math.PI * 2;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 3), dotMat);
        dot.position.set(Math.cos(da) * petalSize * 0.2, stemH + 0.1, Math.sin(da) * petalSize * 0.2);
        group.add(dot);
      }

      group.position.set(x, 0, z);
      group.userData = { entity };
      group.castShadow = true;
      scene.add(group);
      return { entity, group, stemHeight: stemH };
    }

    const flowerEnts = (entities || []).filter(e =>
      e.type !== 'center' && e.type !== 'email' && e.type !== 'butterfly'
    );
    flowerEnts.forEach((e, i) => {
      const isSpot = e.type === 'spotlight';
      const stemH  = isSpot ? 3.2 : 1.0 + (e.importance ?? 0.5) * 1.6;
      const nPetal = isSpot ? 16 : e.type === 'event' ? 8 : 6;
      const pSize  = isSpot ? 0.52 : 0.20 + (e.importance ?? 0.5) * 0.16;
      let px = 0, pz = isSpot ? -2 : 0;
      if (!isSpot) {
        const side = i % 2 === 0 ? 1 : -1;
        const row  = Math.floor(i / 2);
        px = side * (2.5 + row * 2.2);
        pz = -1.5 + row * 2.5;
      }
      flowerMeshes.push(createFlower(e, px, pz, stemH, nPetal, pSize));
    });

    // ── Butterflies ───────────────────────────────────────────────────
    const butterflyMeshes = [];
    (entities || [])
      .filter(e => e.type === 'email' || e.type === 'butterfly')
      .forEach((e, i) => {
        const col  = BFLY_COLORS[i % BFLY_COLORS.length];
        const grp  = new THREE.Group();
        const wMat = new THREE.MeshLambertMaterial({
          color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
        });
        const wings = [];
        [[0.28, 0, 0, 2.0, 0.44, 1.3], [-0.28, 0, 0, 2.0, 0.44, 1.3],
         [0.24, -0.2, 0, 1.5, 0.38, 1.0], [-0.24, -0.2, 0, 1.5, 0.38, 1.0]].forEach(([wx, wy, wz, sx, sy, sz]) => {
          const wm = new THREE.Mesh(new THREE.SphereGeometry(0.22, 9, 6), wMat.clone());
          wm.scale.set(sx, sy, sz);
          wm.position.set(wx, wy, wz);
          grp.add(wm);
          wings.push(wm);
        });
        // Wing spots
        const spotMat = new THREE.MeshLambertMaterial({
          color: new THREE.Color(col).multiplyScalar(0.48),
          side: THREE.DoubleSide, transparent: true, opacity: 0.5,
        });
        wings.slice(0, 2).forEach(w => {
          const spot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 4), spotMat);
          spot.scale.set(1.2, 0.7, 0.5);
          spot.position.set(0, 0, 0.12);
          w.add(spot);
        });
        // Body
        const bflyBody = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.048, 0.28, 4, 6),
          new THREE.MeshLambertMaterial({ color: 0x3A2010 })
        );
        bflyBody.rotation.z = Math.PI / 2;
        grp.add(bflyBody);
        // Antennae
        const antM = new THREE.MeshBasicMaterial({ color: 0x3A2010 });
        [-0.1, 0.1].forEach(offset => {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.4, 4), antM);
          ant.position.set(offset, 0.18, 0);
          ant.rotation.z = offset * 5.5;
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.024, 4, 4), antM);
          ball.position.y = 0.22;
          ant.add(ball);
          grp.add(ant);
        });

        grp.position.set((Math.random() - 0.5) * 12, 6.5 + Math.random() * 2.5, (Math.random() - 0.5) * 10);
        grp.userData = { entity: e, wings };
        scene.add(grp);
        butterflyMeshes.push({
          entity: e, group: grp, wings,
          vx: (Math.random() - 0.5) * 0.005,
          vy: (Math.random() - 0.5) * 0.003,
          vz: (Math.random() - 0.5) * 0.005,
          phase: Math.random() * Math.PI * 2,
          targetFlower: null, targetTimer: 0,
        });
      });

    // ── Bees ─────────────────────────────────────────────────────────
    const beeMeshes = [];
    for (let b = 0; b < 3; b++) {
      const bg   = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
      );
      body.scale.set(1, 0.7, 1.5);
      bg.add(body);
      for (let s = 0; s < 3; s++) {
        const stripe = new THREE.Mesh(
          new THREE.TorusGeometry(0.11, 0.025, 5, 10),
          new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        stripe.rotation.x = Math.PI / 2;
        stripe.position.z = -0.08 + s * 0.08;
        bg.add(stripe);
      }
      const bwMat = new THREE.MeshLambertMaterial({ color: 0xCCEEFF, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      [-0.13, 0.13].forEach(bwx => {
        const bw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), bwMat);
        bw.scale.set(1.7, 0.28, 1.4);
        bw.position.set(bwx, 0.1, 0);
        bg.add(bw);
      });
      const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 5), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      stinger.position.z = 0.22;
      stinger.rotation.x = Math.PI / 2;
      bg.add(stinger);

      const sf = flowerMeshes[b % Math.max(1, flowerMeshes.length)];
      bg.position.set(sf?.group.position.x ?? b * 2, sf?.stemHeight ?? 3, sf?.group.position.z ?? 0);
      scene.add(bg);
      beeMeshes.push({
        group: bg, orbitFlower: b % Math.max(1, flowerMeshes.length),
        orbitAngle: (b / 3) * Math.PI * 2,
        orbitR: 0.7 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ── Clouds ────────────────────────────────────────────────────────
    const cloudMeshes = [];
    for (let c = 0; c < 5; c++) {
      const cg  = new THREE.Group();
      const cm  = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.88 });
      const ns  = 4 + Math.floor(Math.random() * 4);
      for (let n = 0; n < ns; n++) {
        const cs = new THREE.Mesh(new THREE.SphereGeometry(2.2 + Math.random() * 1.5, 8, 6), cm);
        cs.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 3);
        cg.add(cs);
      }
      cg.position.set((Math.random() - 0.5) * 60, 22 + Math.random() * 8, (Math.random() - 0.5) * 60);
      scene.add(cg);
      cloudMeshes.push({ group: cg, speed: 0.008 + Math.random() * 0.012 });
    }

    // ── Sun ───────────────────────────────────────────────────────────
    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 18, 14),
      new THREE.MeshBasicMaterial({ color: 0xFFEE55 })
    );
    sunSphere.position.set(-14, 22, -20);
    const addHalo = (r, op) => {
      const h = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFF99, transparent: true, opacity: op, side: THREE.BackSide })
      );
      sunSphere.add(h);
    };
    addHalo(2.8, 0.14); addHalo(4.4, 0.06);
    scene.add(sunSphere);

    // ── Pollen particles ──────────────────────────────────────────────
    const POLLEN_N  = 320;
    const pPolPos   = new Float32Array(POLLEN_N * 3);
    const pPolPhase = new Float32Array(POLLEN_N);
    for (let i = 0; i < POLLEN_N; i++) {
      pPolPos[i*3]   = (Math.random() - 0.5) * 28;
      pPolPos[i*3+1] = Math.random() * 7;
      pPolPos[i*3+2] = (Math.random() - 0.5) * 24;
      pPolPhase[i]   = Math.random() * Math.PI * 2;
    }
    const pollenGeo = new THREE.BufferGeometry();
    pollenGeo.setAttribute('position', new THREE.BufferAttribute(pPolPos, 3));
    scene.add(new THREE.Points(pollenGeo, new THREE.PointsMaterial({
      color: 0xFFE840, size: 0.08, transparent: true, opacity: 0.7,
    })));

    // Ground sparkles (dewdrops)
    const DEWS_N   = 90;
    const dewPos   = new Float32Array(DEWS_N * 3);
    const dewPhase = new Float32Array(DEWS_N);
    for (let i = 0; i < DEWS_N; i++) {
      dewPos[i*3]   = (Math.random() - 0.5) * 22;
      dewPos[i*3+1] = 0.1 + Math.random() * 0.15;
      dewPos[i*3+2] = (Math.random() - 0.5) * 20;
      dewPhase[i]   = Math.random() * Math.PI * 2;
    }
    const dewGeo = new THREE.BufferGeometry();
    dewGeo.setAttribute('position', new THREE.BufferAttribute(dewPos, 3));
    const dewMesh = new THREE.Points(dewGeo, new THREE.PointsMaterial({
      color: 0xCCEEFF, size: 0.07, transparent: true, opacity: 0.6,
    }));
    scene.add(dewMesh);

    // ── Click burst ───────────────────────────────────────────────────
    const BURST_N   = 32;
    const burstPos  = new Float32Array(BURST_N * 3);
    const burstVel  = Array.from({ length: BURST_N }, () => new THREE.Vector3());
    const burstGeo  = new THREE.BufferGeometry();
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
    const burstMat  = new THREE.PointsMaterial({ color: 0xFFCC00, size: 0.12, transparent: true, opacity: 0 });
    const burstMesh = new THREE.Points(burstGeo, burstMat);
    scene.add(burstMesh);
    let burstActive = 0;

    function triggerBurst(pos, hexColor) {
      burstMat.color.setHex(hexColor || 0xFFCC00);
      for (let i = 0; i < BURST_N; i++) {
        burstPos[i*3] = pos.x; burstPos[i*3+1] = pos.y; burstPos[i*3+2] = pos.z;
        burstVel[i].set(
          (Math.random() - 0.5) * 0.14,
          Math.random() * 0.14 + 0.02,
          (Math.random() - 0.5) * 0.14
        );
      }
      burstGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = 1;
      burstActive = 60;
    }

    // ── Glow rings — hover affordance on flowers ─────────────────────
    const glowRings = [];
    flowerMeshes.forEach(fm => {
      const col     = flowerCfg(fm.entity.type).petals;
      const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
      const ring    = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.07, 8, 28), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(fm.group.position.x, 0.1, fm.group.position.z);
      scene.add(ring);
      glowRings.push({ ring, ringMat, entity: fm.entity });
    });

    // ── Interaction ───────────────────────────────────────────────────
    const clickables = [];
    flowerMeshes.forEach(fm => fm.group.traverse(ch => {
      if (ch.isMesh) clickables.push({ mesh: ch, entity: fm.entity });
    }));
    butterflyMeshes.forEach(bm => bm.group.traverse(ch => {
      if (ch.isMesh) clickables.push({ mesh: ch, entity: bm.entity });
    }));
    const clickMeshes = clickables.map(c => c.mesh);

    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();
    let selectedEntity = null;
    let hoveredEntity  = null;

    function getEntityFromHits(hits) {
      for (const hit of hits) {
        let obj = hit.object;
        while (obj) { if (obj.userData?.entity) return obj.userData.entity; obj = obj.parent; }
      }
      return null;
    }

    // ── Always-visible label overlay ──────────────────────────────────
    const overlayDiv = document.createElement('div');
    overlayDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    mount.appendChild(overlayDiv);

    const TYPE_ICON = { spotlight: '✦', event: '◷', email: '✉', default: '◈' };
    const TYPE_COLOR = { spotlight: '#92400E', event: '#1E40AF', email: '#065F46', default: '#4B5563' };
    const TYPE_BG    = { spotlight: 'rgba(255,248,220,0.97)', event: 'rgba(239,246,255,0.97)', email: 'rgba(236,253,245,0.97)', default: 'rgba(255,253,242,0.97)' };
    const TYPE_BORDER= { spotlight: 'rgba(245,158,11,0.5)', event: 'rgba(59,130,246,0.4)', email: 'rgba(16,185,129,0.4)', default: 'rgba(90,160,70,0.35)' };

    const entityLabels = new Map(); // id → { el, chipEl, subEl, fm, bm }

    function makeLabel(entity, fm, bm) {
      const t    = entity.type in TYPE_ICON ? entity.type : 'default';
      const icon = TYPE_ICON[t];
      const col  = TYPE_COLOR[t];
      const bg   = TYPE_BG[t];
      const bdr  = TYPE_BORDER[t];

      const wrap = document.createElement('div');
      wrap.style.cssText = `
        position:absolute;transform:translateX(-50%) translateY(-100%);
        pointer-events:none;text-align:center;
      `;

      const chip = document.createElement('div');
      chip.style.cssText = `
        display:inline-flex;align-items:center;gap:5px;
        background:${bg};border:1.5px solid ${bdr};border-radius:20px;
        padding:4px 11px 4px 9px;font-size:11px;font-weight:500;color:${col};
        font-family:'DM Sans','Inter',system-ui,sans-serif;white-space:nowrap;
        box-shadow:0 1px 8px rgba(0,0,0,0.1);transition:box-shadow 0.2s,border-color 0.2s,transform 0.15s;
      `;
      chip.innerHTML = `<span style="font-size:10px;opacity:0.8;">${icon}</span>${entity.label || ''}`;
      wrap.appendChild(chip);

      let subEl = null;
      if (entity.statusLabel) {
        subEl = document.createElement('div');
        subEl.style.cssText = `
          font-size:9px;color:rgba(60,100,60,0.8);margin-top:3px;
          font-family:'DM Sans','Inter',system-ui,sans-serif;white-space:nowrap;
        `;
        subEl.textContent = entity.statusLabel;
        wrap.appendChild(subEl);
      }

      overlayDiv.appendChild(wrap);
      entityLabels.set(entity.id, { el: wrap, chipEl: chip, subEl, fm, bm });
    }

    flowerMeshes.forEach(fm  => makeLabel(fm.entity,  fm,   null));
    butterflyMeshes.forEach(bm => makeLabel(bm.entity, null, bm));

    // ── Summary HUD ───────────────────────────────────────────────────
    const hudDiv = document.createElement('div');
    const evtCt  = flowerMeshes.filter(f => f.entity.type === 'event').length;
    const emlCt  = butterflyMeshes.length;
    const hasSpot = flowerMeshes.some(f => f.entity.type === 'spotlight');
    hudDiv.style.cssText = `
      position:absolute;top:16px;right:16px;pointer-events:none;
      font-family:'DM Sans','Inter',system-ui,sans-serif;font-size:11px;
      color:rgba(30,74,24,0.85);background:rgba(255,255,255,0.72);
      border-radius:12px;padding:9px 14px;line-height:1.85;
      box-shadow:0 1px 10px rgba(0,0,0,0.09);min-width:110px;
    `;
    hudDiv.innerHTML = [
      hasSpot ? `<div style="font-weight:600;color:#92400E;">✦ 1 spotlight</div>` : '',
      evtCt   ? `<div>◷ ${evtCt} upcoming</div>` : '',
      emlCt   ? `<div>✉ ${emlCt} email${emlCt > 1 ? 's' : ''}</div>` : '',
    ].filter(Boolean).join('') || '<div style="opacity:0.5">No data yet</div>';
    mount.appendChild(hudDiv);

    // ── Purpose 1-liner ───────────────────────────────────────────────
    const subtitleDiv = document.createElement('div');
    subtitleDiv.style.cssText = `
      position:absolute;bottom:18px;left:20px;pointer-events:none;
      font-family:'DM Sans','Inter',system-ui,sans-serif;font-size:10.5px;
      color:rgba(30,74,24,0.55);font-weight:400;letter-spacing:0.2px;
      font-style:italic;max-width:340px;line-height:1.5;
    `;
    subtitleDiv.textContent = subtitle || '';
    mount.appendChild(subtitleDiv);

    // ── Butterfly → flower connection threads ─────────────────────────
    const connectionLines = butterflyMeshes.map(() => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(), new THREE.Vector3(),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: 0xCCEEFF, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return { line, geo, mat };
    });

    const tmpVec = new THREE.Vector3();

    function updateAllLabels() {
      const cW = parent.offsetWidth, cH = parent.offsetHeight;
      entityLabels.forEach(({ el, chipEl, fm, bm }, id) => {
        if (fm) tmpVec.set(fm.group.position.x, fm.stemHeight + 0.55, fm.group.position.z);
        else if (bm) { tmpVec.copy(bm.group.position); tmpVec.y += 0.55; }

        const v = tmpVec.clone().project(camera);
        if (v.z > 1) { el.style.visibility = 'hidden'; return; }
        el.style.visibility = 'visible';

        const lx = (v.x *  0.5 + 0.5) * cW;
        const ly = (v.y * -0.5 + 0.5) * cH;
        el.style.left = lx + 'px';
        el.style.top  = ly + 'px';

        const isActive = selectedEntity?.id === id || hoveredEntity?.id === id;
        el.style.opacity = isActive ? '1' : '0.8';
        chipEl.style.transform     = isActive ? 'scale(1.07)' : 'scale(1)';
        chipEl.style.boxShadow     = isActive ? '0 3px 14px rgba(0,0,0,0.18)' : '0 1px 8px rgba(0,0,0,0.1)';
        chipEl.style.borderColor   = isActive ? chipEl.style.borderColor.replace('0.4', '0.85').replace('0.35', '0.85').replace('0.5', '1') : '';
      });
    }

    function onPointerDown(e) {
      if (e.button !== 0) return;
      const rect = mount.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / mount.offsetWidth) * 2 - 1,
        -((e.clientY - rect.top) / mount.offsetHeight) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const entity = getEntityFromHits(raycaster.intersectObjects(clickMeshes));
      selectedEntity = entity ? (selectedEntity?.id === entity.id ? null : entity) : null;
      onClickRef.current?.(selectedEntity);
      if (selectedEntity) {
        const fm = flowerMeshes.find(f => f.entity.id === selectedEntity.id);
        const bm = butterflyMeshes.find(b => b.entity.id === selectedEntity.id);
        if (fm) triggerBurst(new THREE.Vector3(fm.group.position.x, fm.stemHeight + 0.1, fm.group.position.z), flowerCfg(selectedEntity.type).petals);
        else if (bm) triggerBurst(bm.group.position.clone(), BFLY_COLORS[0]);
      }
    }
    function onPointerMove(e) {
      const rect = mount.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / mount.offsetWidth) * 2 - 1,
        -((e.clientY - rect.top) / mount.offsetHeight) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      hoveredEntity = getEntityFromHits(raycaster.intersectObjects(clickMeshes)) || null;
      renderer.domElement.style.cursor = hoveredEntity ? 'pointer' : 'default';
    }
    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('pointermove', onPointerMove);

    // ── Resize ────────────────────────────────────────────────────────
    function onResize() {
      W = parent.offsetWidth  || window.innerWidth;
      H = parent.offsetHeight || window.innerHeight;
      if (W === 0 || H === 0) return;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(parent);

    // ── Animation loop ────────────────────────────────────────────────
    let frame = 0, rafId;
    let windGust = 0;
    const scaleV = new THREE.Vector3();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = frame * 0.016;
      frame++;

      // Wind gust every ~6 seconds
      if (frame % 380 === 0) windGust = 65;
      if (windGust > 0) windGust--;
      const gust = windGust > 0 ? Math.sin((1 - windGust / 65) * Math.PI) * 0.13 : 0;

      // Camera float
      camera.position.x = Math.sin(t * 0.042) * 2.2;
      camera.position.z = 18.5 + Math.sin(t * 0.027) * 2.0;
      camera.position.y = 9.0 + Math.sin(t * 0.033) * 0.7;
      camera.lookAt(0, 1.5, 0);

      // Grass sway
      if (frame % 3 === 0) {
        for (let i = 0; i < GRASS_N; i++) {
          const g    = grassData[i];
          const sway = (Math.sin(t * 2.2 + g.ph) * 0.09 + gust * Math.sin(g.ph)) * g.s;
          dummy.position.set(g.gx, 0, g.gz);
          dummy.rotation.set(0, g.ry, sway);
          dummy.scale.set(1, g.s, 1);
          dummy.updateMatrix();
          grassMesh.setMatrixAt(i, dummy.matrix);
        }
        grassMesh.instanceMatrix.needsUpdate = true;
      }

      // Flower sway + hover scale
      flowerMeshes.forEach((fm, i) => {
        const sway = Math.sin(t * 1.4 + i * 0.7) * 0.034 + gust * 0.85;
        fm.group.rotation.z = sway;
        fm.group.rotation.x = sway * 0.2;
        const isActive = selectedEntity?.id === fm.entity.id || hoveredEntity?.id === fm.entity.id;
        const target   = isActive ? 1.1 : 1.0;
        fm.group.scale.lerp(scaleV.set(target, target, target), 0.12);
      });

      // Tree sway
      treeMeshes.forEach(tm => {
        tm.group.rotation.z = Math.sin(t * 0.7 + tm.phase) * 0.012 + gust * 0.25;
        tm.group.rotation.x = Math.sin(t * 0.55 + tm.phase + 1) * 0.008;
      });

      // Butterflies
      butterflyMeshes.forEach(bm => {
        bm.targetTimer--;
        if (bm.targetTimer <= 0 && flowerMeshes.length > 0) {
          bm.targetFlower = flowerMeshes[Math.floor(Math.random() * flowerMeshes.length)];
          bm.targetTimer  = 130 + Math.floor(Math.random() * 130);
        }
        const isActive = hoveredEntity?.id === bm.entity.id || selectedEntity?.id === bm.entity.id;
        const spd = isActive ? 1.6 : 1.0;

        // Drift lazily above the tallest flower, never swooping down into them
        if (bm.targetFlower) {
          const tx = bm.targetFlower.group.position.x + Math.sin(t * 0.4 + bm.phase) * 5.0;
          const ty = Math.max(6.0, bm.targetFlower.stemHeight + 3.2) + Math.sin(t * 0.7) * 0.4;
          const tz = bm.targetFlower.group.position.z + Math.cos(t * 0.4 + bm.phase) * 5.0;
          bm.vx += (tx - bm.group.position.x) * 0.0003;
          bm.vy += (ty - bm.group.position.y) * 0.0004;
          bm.vz += (tz - bm.group.position.z) * 0.0003;
        }

        // Gentle wander
        bm.vx += (Math.random() - 0.5) * 0.0008;
        bm.vy += (Math.random() - 0.5) * 0.0005;
        bm.vz += (Math.random() - 0.5) * 0.0008;

        // Separation — push away from every other butterfly
        butterflyMeshes.forEach(other => {
          if (other === bm) return;
          const dx = bm.group.position.x - other.group.position.x;
          const dy = bm.group.position.y - other.group.position.y;
          const dz = bm.group.position.z - other.group.position.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < 49 && d2 > 0.001) {          // 7-unit bubble
            const d   = Math.sqrt(d2);
            const str = (7 - d) / 7 * 0.022;
            bm.vx += (dx / d) * str;
            bm.vy += (dy / d) * str * 0.5;
            bm.vz += (dz / d) * str;
          }
        });

        // Clamp speed
        bm.vx  = Math.max(-0.016 * spd, Math.min(0.016 * spd, bm.vx));
        bm.vy  = Math.max(-0.010 * spd, Math.min(0.010 * spd, bm.vy));
        bm.vz  = Math.max(-0.016 * spd, Math.min(0.016 * spd, bm.vz));

        const p = bm.group.position;
        p.x += bm.vx; p.y += bm.vy; p.z += bm.vz;

        // Keep in the sky layer above flowers
        if (p.y < 5.5) bm.vy += 0.013;
        if (p.y > 9.5) bm.vy -= 0.011;
        if (p.x >  11) bm.vx -= 0.015; if (p.x < -11) bm.vx += 0.015;
        if (p.z >   9) bm.vz -= 0.015; if (p.z <  -9) bm.vz += 0.015;

        const flutter   = Math.abs(Math.sin(t * (isActive ? 11 : 7) + bm.phase));
        const wa = flutter * 0.78;
        bm.wings[0].rotation.z = wa + 0.06; bm.wings[1].rotation.z = -wa - 0.06;
        bm.wings[2].rotation.z = wa * 0.58; bm.wings[3].rotation.z = -wa * 0.58;
        if (Math.abs(bm.vx) > 0.01 || Math.abs(bm.vz) > 0.01) {
          bm.group.rotation.y = Math.atan2(bm.vx, bm.vz);
        }
      });

      // Butterfly → flower connection threads
      butterflyMeshes.forEach((bm, i) => {
        const cl = connectionLines[i];
        if (!cl || !bm.targetFlower) { if (cl) cl.mat.opacity = 0; return; }
        const bp  = bm.group.position;
        const fp  = bm.targetFlower.group.position;
        const dist = bp.distanceTo(fp);
        const targetOp = dist < 7 ? (1 - dist / 7) * 0.14 : 0;
        cl.mat.opacity += (targetOp - cl.mat.opacity) * 0.06;
        const pts = cl.geo.attributes.position;
        pts.setXYZ(0, bp.x, bp.y, bp.z);
        pts.setXYZ(1, fp.x, bm.targetFlower.stemHeight + 0.4, fp.z);
        pts.needsUpdate = true;
      });

      // Bees orbit flowers
      beeMeshes.forEach((bee, i) => {
        if (!flowerMeshes.length) return;
        const fm = flowerMeshes[bee.orbitFlower % flowerMeshes.length];
        bee.orbitAngle += 0.036 + i * 0.006;
        const beeY = fm.stemHeight + 0.5 + Math.sin(t * 4.5 + bee.phase) * 0.22;
        bee.group.position.set(
          fm.group.position.x + Math.cos(bee.orbitAngle) * bee.orbitR,
          beeY,
          fm.group.position.z + Math.sin(bee.orbitAngle) * bee.orbitR
        );
        bee.group.rotation.y = bee.orbitAngle + Math.PI / 2;
        if (frame % 290 === i * 95) bee.orbitFlower = (bee.orbitFlower + 1) % flowerMeshes.length;
        // Wing buzz via scale
        bee.group.children.slice(3).forEach(w => {
          w.scale.x = 1.6 + Math.sin(t * 44 + bee.phase) * 0.45;
        });
      });

      // Clouds drift
      cloudMeshes.forEach(cm => {
        cm.group.position.x += cm.speed;
        if (cm.group.position.x > 55) cm.group.position.x = -55;
      });

      // Pollen drift
      const pp = pollenGeo.attributes.position;
      for (let i = 0; i < POLLEN_N; i++) {
        let py = pp.getY(i) + 0.005 + Math.sin(t + pPolPhase[i]) * 0.003;
        if (py > 8) py = 0.1;
        pp.setY(i, py);
        pp.setX(i, pp.getX(i) + Math.sin(t * 0.45 + pPolPhase[i]) * 0.001 + gust * 0.004);
      }
      pp.needsUpdate = true;

      // Dewdrops twinkle
      const dp = dewGeo.attributes.position;
      dewMesh.material.opacity = 0.45 + Math.sin(t * 1.8) * 0.25;
      for (let i = 0; i < DEWS_N; i++) {
        dp.setY(i, 0.1 + Math.abs(Math.sin(t * 1.4 + dewPhase[i])) * 0.12);
      }
      dp.needsUpdate = true;

      // Burst
      if (burstActive > 0) {
        burstActive--;
        const life = burstActive / 60;
        burstMat.opacity = life * 0.9;
        burstMat.size    = 0.06 + (1 - life) * 0.16;
        const bp = burstGeo.attributes.position;
        for (let i = 0; i < BURST_N; i++) {
          bp.setX(i, bp.getX(i) + burstVel[i].x);
          bp.setY(i, bp.getY(i) + burstVel[i].y);
          bp.setZ(i, bp.getZ(i) + burstVel[i].z);
          burstVel[i].y -= 0.003;
        }
        bp.needsUpdate = true;
      } else {
        burstMat.opacity = 0;
      }

      // Pond shimmer
      pond.position.y = 0.06 + Math.sin(t * 1.9) * 0.008;
      pondMat.opacity = 0.72 + Math.sin(t * 1.3) * 0.06;

      // Sun pulse
      sunSphere.scale.setScalar(1 + Math.sin(t * 0.55) * 0.032);

      // Glow ring pulse + hover
      glowRings.forEach(gr => {
        const isActive = hoveredEntity?.id === gr.entity.id || selectedEntity?.id === gr.entity.id;
        const targetOp = isActive ? 0.85 : 0.28 + Math.sin(t * 2.2 + gr.ring.position.x) * 0.06;
        gr.ringMat.opacity += (targetOp - gr.ringMat.opacity) * 0.14;
        const rs = isActive ? 1.18 + Math.sin(t * 5) * 0.04 : 1.0;
        gr.ring.scale.setScalar(rs);
      });

      updateAllLabels();
      renderer.render(scene, camera);
    }

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('pointermove', onPointerMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(overlayDiv))          mount.removeChild(overlayDiv);
      if (mount.contains(hudDiv))              mount.removeChild(hudDiv);
      if (mount.contains(subtitleDiv))         mount.removeChild(subtitleDiv);
      connectionLines.forEach(cl => { cl.geo.dispose(); cl.mat.dispose(); });
      scene.traverse(obj => {
        obj.geometry?.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m.dispose());
        }
      });
      renderer.dispose();
    };
  }, [entities, subtitle]);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />;
}
