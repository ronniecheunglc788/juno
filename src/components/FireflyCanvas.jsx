import { useEffect, useRef } from 'react';

// ── FireflyCanvas — usability-first 3D constellation ──────────────────────
// UX principles:
//   · Node names always visible (depth-faded, pill background for readability)
//   · Auto-rotation pauses the moment mouse enters canvas
//   · Dimmed (filtered) nodes render at 8% opacity — ghosted, not removed
//   · Tooltip is edge-clamped and shows status line inline
//   · 22 subtle ambient fireflies, no cursor gravity

const SPHERE_R = 190;
const FOV      = 520;

const NCFG = {
  'center':       { col:[255,222,60],  glo:[255,120,0],  sz:14, rays:true  },
  'contact-warm': { col:[255,185,52],  glo:[255,90,0],   sz:8              },
  'contact-mid':  { col:[255,112,44],  glo:[175,50,0],   sz:7              },
  'contact-cold': { col:[158,104,68],   glo:[88,42,18],   sz:4              },
  'event':        { col:[255,62,98],   glo:[155,14,44],  sz:7              },
  'plan':         { col:[72,138,255],  glo:[14,60,200],  sz:6              },
  'instagram':    { col:[255,44,155],  glo:[162,0,92],   sz:9              },
};
function nc(t) { return NCFG[t] || { col:[130,130,130], glo:[60,60,60], sz:5 }; }
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`; }

// Shooting stars — rare sparkle events
const SHOTS = [];

// 22 subtle ambient fireflies — background ambience only
const FF = Array.from({length:22}, () => {
  const t = Math.random()*Math.PI*2, p = Math.acos(2*Math.random()-1);
  const r = SPHERE_R*(.5 + Math.random()*1.3);
  return {
    x:Math.sin(p)*Math.cos(t)*r, y:Math.sin(p)*Math.sin(t)*r, z:Math.cos(p)*r,
    vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, vz:(Math.random()-.5)*.2,
    ph:Math.random()*Math.PI*2, phSpd:.014+Math.random()*.018,
    sz:1.2+Math.random()*3.5,
  };
});

// Background stars (two layers: near + far parallax)
const BG = Array.from({length:220}, () => ({
  fx:Math.random(), fy:Math.random(),
  sz:Math.random()>.92?1.5:1,
  ph:Math.random()*Math.PI*2,
  px:.05+Math.random()*.35,
}));

function rot3(x,y,z,rx,ry) {
  const x1=x*Math.cos(ry)+z*Math.sin(ry), z1=-x*Math.sin(ry)+z*Math.cos(ry);
  return [x1, y*Math.cos(rx)-z1*Math.sin(rx), y*Math.sin(rx)+z1*Math.cos(rx)];
}
function proj(x3,y3,z3,cx,cy,zoom) {
  const d=FOV/(FOV+z3*zoom); return [cx+x3*zoom*d, cy+y3*zoom*d, d];
}
function fibSphere(i,n,r) {
  const phi=Math.acos(1-2*(i+.5)/Math.max(1,n)), theta=Math.PI*(1+Math.sqrt(5))*i;
  return [Math.sin(phi)*Math.cos(theta)*r, Math.sin(phi)*Math.sin(theta)*r, Math.cos(phi)*r];
}

export default function FireflyCanvas({ entities, onEntityClick }) {
  const canvasRef  = useRef(null);
  const cbRef      = useRef(onEntityClick);
  // Persist per-node dim opacity across entity-prop changes so filter transitions animate smoothly
  const dimOpaRef  = useRef({});
  useEffect(() => { cbRef.current = onEntityClick; });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const par = canvas.parentElement, ctx = canvas.getContext('2d');
    let W=0, H=0, rafId;
    let cachedBg=null, cachedNeb1=null, cachedNeb2=null, cachedNeb3=null, cachedVg=null, cachedBgW=0, cachedBgH=0;
    let initialZoomSet=false;

    const S = {
      rotX:0, rotY:.5, zoom:1, targetZoom:1,
      velX:0, velY:0,
      drag:false, startX:0, startY:0, lastX:0, lastY:0,
      sel:null, hov:null,
      mouseOnCanvas:false,
      // Homing: smoothly rotate sphere to bring selected node to front
      homeX:null, homeY:null,
    };

    // Calculate target rotation to bring a world-space node to the front face
    function calcHomeAngles(wx,wy,wz) {
      const Rxz = Math.sqrt(wx*wx+wz*wz);
      const tY  = -Math.atan2(wx, wz);
      const tX  = Math.max(-1.1, Math.min(1.1, Math.atan2(wy, Rxz)));
      return [tX, tY];
    }

    // Build 3D node positions
    const ents   = entities||[];
    const center = ents.find(e=>e.type==='center');
    const others = ents.filter(e=>e.type!=='center');
    const nodePos = [];
    if (center) nodePos.push({...center,wx:0,wy:0,wz:0});
    others.forEach((e,i)=>{
      const [wx,wy,wz]=fibSphere(i,others.length,SPHERE_R);
      nodePos.push({...e,wx,wy,wz});
    });
    // Staggered entry: seed new nodes at negative offset so they fade in sequentially.
    // The lerp(cur → target, 0.07) naturally brings them through 0 → visible over ~N frames.
    // Warm contacts appear first (~0.15s), cold/plans last (~0.45s).
    const ENTRY_OFFSETS = {
      'center':0, 'contact-warm':-2, 'contact-mid':-3.5,
      'instagram':-5, 'event':-5.5, 'plan':-6, 'contact-cold':-7,
    };
    nodePos.forEach(n=>{
      if (dimOpaRef.current[n.id]===undefined)
        dimOpaRef.current[n.id] = ENTRY_OFFSETS[n.type] ?? -4;
    });
    // Clean up stale IDs (nodes removed from entities) to prevent memory growth
    const currentIds = new Set(nodePos.map(n=>n.id));
    Object.keys(dimOpaRef.current).forEach(id=>{ if(!currentIds.has(id)) delete dimOpaRef.current[id]; });

    // Click burst particles
    const bursts=[];
    function emitBurst(sx,sy,col) {
      for (let i=0;i<14;i++) {
        const ang=(i/14)*Math.PI*2+Math.random()*.5, spd=2+Math.random()*3;
        bursts.push({x:sx,y:sy,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
                     life:0,maxLife:26+Math.random()*14,col,sz:.9+Math.random()*1.8});
      }
    }

    // Hover ripple rings
    const ripples=[];
    function emitRipple(nodeId,col) { ripples.push({nodeId,col,life:0,maxLife:40}); }

    let projNodes=[], frame=0;

    function resize() {
      W=par.offsetWidth; H=par.offsetHeight;
      canvas.width=W; canvas.height=H;
      // Responsive initial zoom — maintain visual proportion across screen sizes
      if (!initialZoomSet) {
        const z=Math.min(1.75,Math.max(0.52,Math.min(W,H)/680));
        S.zoom=z; S.targetZoom=z; initialZoomSet=true;
      }
      cachedBg=null; cachedNeb1=null; cachedNeb2=null; cachedNeb3=null; cachedVg=null; // invalidate all cached gradients on resize
    }
    resize();

    // ── Helpers ───────────────────────────────────────────────────────────
    function drawGlow(x,y,col,innerR,outerR,alpha) {
      const gr=ctx.createRadialGradient(x,y,0,x,y,outerR);
      gr.addColorStop(0,rgba(col,alpha));
      gr.addColorStop(innerR/outerR,rgba(col,alpha*.45));
      gr.addColorStop(1,rgba(col,0));
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,outerR,0,Math.PI*2); ctx.fill();
    }
    function rrect(x,y,w,h,r) {
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
      ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
      ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    }
    function hitTest(mx,my) {
      let best=null, bd=Infinity;
      for (const n of projNodes) {
        if ((n._dimF??1) < 0.15) continue; // non-interactive while fading out
        const d=Math.hypot(n.sx-mx,n.sy-my);
        if (d<(n._hr??16)&&d<bd) { best=n; bd=d; }
      }
      return best;
    }

    // ── Render loop ───────────────────────────────────────────────────────
    function render() {
      // Auto-rotate only when mouse is off canvas
      if (!S.drag) {
        // Homing: smoothly rotate toward selected node's front-face position
        if (S.homeX!==null && S.homeY!==null) {
          let dY = S.homeY - S.rotY;
          while (dY>Math.PI)  dY-=Math.PI*2; // shortest arc
          while (dY<-Math.PI) dY+=Math.PI*2;
          S.rotX += (S.homeX - S.rotX) * 0.055;
          S.rotY += dY * 0.055;
          S.velX=0; S.velY=0;
          if (Math.abs(S.homeX-S.rotX)<0.008 && Math.abs(dY)<0.008) {
            S.homeX=S.homeY=null; // arrived
            // Arrival burst — celebrate the selected node reaching the front face
            const arrNode=projNodes.find(n=>n.id===S.sel?.id);
            if (arrNode) emitBurst(arrNode.sx,arrNode.sy,nc(arrNode.type).col);
          }
        } else {
          // Grace period: don't resume auto-rotate until 90 frames (~1.5s) after mouse leaves
          if (!S.mouseOnCanvas && !S.drag) S.idleFrames=(S.idleFrames||0)+1; else S.idleFrames=0;
          // Normal: auto-rotate when idle, eased in over 60 frames after grace period
          const spinEase=Math.min(1,Math.max(0,((S.idleFrames||0)-90)/60));
          const spin = (S.mouseOnCanvas || S.sel || (S.idleFrames||0)<90) ? 0 : spinEase*.0022;
          S.rotY += S.velY + spin; S.velY *= .92;
          S.rotX += S.velX;        S.velX *= .92;
        }
        S.rotX = Math.max(-1.1,Math.min(1.1,S.rotX));
        // Smooth zoom lerp toward target
        S.zoom += (S.targetZoom - S.zoom) * 0.12;
      }
      const cx=W*.5, cy=H*.5;

      projNodes = nodePos.map(n=>{
        // Animate dim opacity toward target (lerp speed 0.07 ≈ 20 frame transition)
        const target = n.dimmed ? 0.08 : 1.0;
        const cur = dimOpaRef.current[n.id] ?? target;
        const next = cur + (target - cur) * 0.07;
        dimOpaRef.current[n.id] = next;

        const dimFClamped = Math.max(0, next); // clamp: negative stagger offsets must not affect alpha
        if (n.type==='center') return {...n,sx:cx,sy:cy,pz:0,depth:1,pd:1,_dimF:1};
        const [rx,ry,rz]=rot3(n.wx,n.wy,n.wz,S.rotX,S.rotY);
        const [sx,sy,pd]=proj(rx,ry,rz,cx,cy,S.zoom);
        const depth=.30+.70*((rz+SPHERE_R)/(SPHERE_R*2));
        return {...n,sx,sy,pz:rz,depth,pd,_dimF:dimFClamped};
      }).sort((a,b)=>a.pz-b.pz);

      ctx.clearRect(0,0,W,H);

      // ── 1. Background gradient (cached — only rebuilt on resize) ─────
      if (!cachedBg || cachedBgW!==W || cachedBgH!==H) {
        cachedBg=ctx.createRadialGradient(cx,cy*.8,0,cx,cy,Math.max(W,H)*.8);
        cachedBg.addColorStop(0,'#0c0818'); cachedBg.addColorStop(.5,'#060412'); cachedBg.addColorStop(1,'#010108');
        cachedBgW=W; cachedBgH=H;
      }
      ctx.fillStyle=cachedBg; ctx.fillRect(0,0,W,H);

      // Nebula depth clouds — cached (static, only rebuilt on resize)
      if (!cachedNeb1) {
        cachedNeb1=ctx.createRadialGradient(cx*.55,cy*1.35,0,cx*.55,cy*1.35,Math.min(W,H)*.42);
        cachedNeb1.addColorStop(0,'rgba(80,22,140,0.055)'); cachedNeb1.addColorStop(1,'rgba(0,0,0,0)');
      }
      if (!cachedNeb2) {
        cachedNeb2=ctx.createRadialGradient(cx*1.4,cy*.45,0,cx*1.4,cy*.45,Math.min(W,H)*.38);
        cachedNeb2.addColorStop(0,'rgba(14,55,120,0.05)'); cachedNeb2.addColorStop(1,'rgba(0,0,0,0)');
      }
      if (!cachedNeb3) {
        cachedNeb3=ctx.createRadialGradient(cx*.85,cy*.5,0,cx*.85,cy*.5,Math.min(W,H)*.28);
        cachedNeb3.addColorStop(0,'rgba(40,12,80,0.048)'); cachedNeb3.addColorStop(1,'rgba(0,0,0,0)');
      }
      ctx.fillStyle=cachedNeb1; ctx.fillRect(0,0,W,H);
      ctx.fillStyle=cachedNeb2; ctx.fillRect(0,0,W,H);
      ctx.fillStyle=cachedNeb3; ctx.fillRect(0,0,W,H);

      // ── 2. Parallax star field ────────────────────────────────────────
      const pxS=-S.rotY*3, pyS=-S.rotX*2.5;
      BG.forEach(s=>{
        const bx=((s.fx*W+pxS*s.px*20+W*4))%W;
        const by=((s.fy*H+pyS*s.px*14+H*4))%H;
        if (s.sz>1.3) {
          // Larger foreground stars — more dramatic twinkle, cooler white
          const al=(Math.sin(frame*.013+s.ph)*.5+.5)*.48+.10;
          ctx.fillStyle=`rgba(240,238,255,${al.toFixed(3)})`;
          ctx.fillRect(bx,by,2,2);
        } else {
          // Small background stars — subtle, warmer tint
          const al=(Math.sin(frame*.013+s.ph)*.5+.5)*.20+.05;
          ctx.fillStyle=`rgba(195,205,235,${al.toFixed(3)})`;
          ctx.fillRect(bx,by,1,1);
        }
      });

      // ── 2b. Shooting stars — rare ambient streaks ────────────────────
      if (frame%280===0 && Math.random()<0.28) {
        SHOTS.push({
          x: Math.random()*(W+80)-40,
          y: Math.random()*H*.35,
          vx: (2.5+Math.random()*3.5)*(Math.random()<0.5?-1:1),
          vy: 1.2+Math.random()*2.2,
          life:0, maxLife:18+Math.random()*14,
        });
      }
      for (let si=SHOTS.length-1;si>=0;si--){
        const sh=SHOTS[si]; sh.x+=sh.vx; sh.y+=sh.vy; sh.life++;
        const t=sh.life/sh.maxLife;
        if (t>=1){SHOTS.splice(si,1);continue;}
        const al=(1-t)*0.55;
        ctx.save(); ctx.globalAlpha=al;
        ctx.beginPath();
        ctx.moveTo(sh.x-sh.vx*16,sh.y-sh.vy*16);
        ctx.lineTo(sh.x,sh.y);
        ctx.strokeStyle='rgba(240,235,200,0.45)'; ctx.lineWidth=0.9; ctx.stroke();
        ctx.beginPath(); ctx.arc(sh.x,sh.y,1.4,0,Math.PI*2);
        ctx.fillStyle='rgba(255,252,230,0.95)'; ctx.fill();
        ctx.restore();
      }

      // ── 3. Sphere wireframe ───────────────────────────────────────────
      // Equatorial ring — outer glow halo + crisp inner line
      const eqA=.18+Math.sin(frame*.038)*.04;
      const eqPts=[];
      for (let i=0;i<=64;i++){
        const th=(i/64)*Math.PI*2;
        const [rx,ry,rz]=rot3(SPHERE_R*Math.cos(th),0,SPHERE_R*Math.sin(th),S.rotX,S.rotY);
        const [sx,sy]=proj(rx,ry,rz,cx,cy,S.zoom);
        eqPts.push([sx,sy]);
      }
      // Outer glow pass
      ctx.beginPath();
      eqPts.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy));
      ctx.closePath();
      ctx.strokeStyle=`rgba(255,165,40,${(eqA*.45).toFixed(3)})`; ctx.lineWidth=4; ctx.stroke();
      // Crisp inner pass
      ctx.beginPath();
      eqPts.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy));
      ctx.closePath();
      ctx.strokeStyle=`rgba(255,185,55,${eqA.toFixed(3)})`; ctx.lineWidth=.65+Math.sin(frame*.038)*.3; ctx.stroke();

      // Meridians — depth-aware: front hemisphere bright, back very faint (two-pass, one stroke per pass)
      for (const [frontPass, lineA, lineW] of [[true,0.16,0.6],[false,0.03,0.35]]) {
        ctx.beginPath();
        for (let li=0;li<8;li++){
          const th=(li/8)*Math.PI*2; let prev=false;
          for (let i=0;i<=32;i++){
            const phi=(i/32)*Math.PI;
            const [rx,ry,rz]=rot3(Math.sin(phi)*Math.cos(th)*SPHERE_R,Math.cos(phi)*SPHERE_R,Math.sin(phi)*Math.sin(th)*SPHERE_R,S.rotX,S.rotY);
            if((rz>=0)!==frontPass){prev=false;continue;}
            const [sx,sy]=proj(rx,ry,rz,cx,cy,S.zoom);
            prev?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy); prev=true;
          }
        }
        ctx.strokeStyle=`rgba(130,80,210,${lineA})`; ctx.lineWidth=lineW; ctx.stroke();
      }

      // Latitude rings at ±45° — depth-aware front/back passes
      for (const [frontPass, lineA, lineW] of [[true,0.12,0.55],[false,0.025,0.3]]) {
        ctx.beginPath();
        for (const latSign of [-1,1]){
          const latY=SPHERE_R*Math.sin(Math.PI/4)*latSign, latR=SPHERE_R*Math.cos(Math.PI/4);
          let prev=false;
          for (let i=0;i<=48;i++){
            const th=(i/48)*Math.PI*2;
            const [rx,ry,rz]=rot3(latR*Math.cos(th),latY,latR*Math.sin(th),S.rotX,S.rotY);
            if((rz>=0)!==frontPass){prev=false;continue;}
            const [sx,sy]=proj(rx,ry,rz,cx,cy,S.zoom);
            prev?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy); prev=true;
          }
        }
        ctx.strokeStyle=`rgba(130,80,210,${lineA})`; ctx.lineWidth=lineW; ctx.stroke();
      }

      // Pole marks — small glowing dots at N and S poles, depth-faded
      for (const poleY of [SPHERE_R,-SPHERE_R]) {
        const [rx,ry,rz]=rot3(0,poleY,0,S.rotX,S.rotY);
        if (rz < -SPHERE_R*.55) continue; // skip when very far behind
        const [sx,sy]=proj(rx,ry,rz,cx,cy,S.zoom);
        const dpt=.20+.80*((rz+SPHERE_R)/(SPHERE_R*2));
        drawGlow(sx,sy,[165,105,230],2.5,11,dpt*.22);
        ctx.beginPath(); ctx.arc(sx,sy,2.2,0,Math.PI*2);
        ctx.fillStyle=`rgba(205,160,255,${(dpt*.52).toFixed(3)})`; ctx.fill();
      }

      // ── 3.5 Atmosphere halo ──────────────────────────────────────────
      // Faint limb-glow ring just outside the sphere's projected silhouette
      const atmR = SPHERE_R * S.zoom * 1.05;
      const atm = ctx.createRadialGradient(cx,cy,atmR*.78,cx,cy,atmR*1.32);
      atm.addColorStop(0,'rgba(0,0,0,0)');
      atm.addColorStop(.38,'rgba(95,48,195,0.042)');
      atm.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=atm; ctx.beginPath(); ctx.arc(cx,cy,atmR*1.32,0,Math.PI*2); ctx.fill();

      // ── 4. Ambient fireflies ──────────────────────────────────────────
      FF.forEach(f=>{
        f.vx+=-f.x*.00014; f.vy+=-f.y*.00014; f.vz+=-f.z*.00014;
        f.x+=f.vx; f.y+=f.vy; f.z+=f.vz;
        f.ph+=f.phSpd;
        const blink=Math.pow(Math.max(0,Math.sin(f.ph)),2.2);
        const dz=FOV/(FOV+f.z*S.zoom);
        const sx=cx+f.x*S.zoom*dz, sy=cy+f.y*S.zoom*dz;
        if (sx<-30||sx>W+30||sy<-30||sy>H+30) return;
        const depthA=.1+.4*((f.z+SPHERE_R*1.6)/(SPHERE_R*3.2));
        const a=blink*depthA*.45;
        if (a<.025) return;
        const r=Math.max(.5,f.sz*(.5+.65*dz));
        ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,${135+Math.round(Math.sin(f.ph)*38)},12,${a.toFixed(3)})`; ctx.fill();
        if (f.sz>2.8&&a>.1){
          const gg=ctx.createRadialGradient(sx,sy,0,sx,sy,r*4);
          gg.addColorStop(0,`rgba(255,95,0,${(a*.28).toFixed(3)})`); gg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(sx,sy,r*4,0,Math.PI*2); ctx.fill();
        }
      });

      // Ambient warm-contact pings — spontaneous ripple when idle, keeps sphere alive
      if (frame%145===0 && !S.sel && !S.hov) {
        const warm=projNodes.filter(n=>n.type==='contact-warm'&&(n._dimF??0)>0.5&&n.depth>0.5);
        if (warm.length>0) ripples.push({nodeId:warm[Math.floor(Math.random()*warm.length)].id,col:NCFG['contact-warm'].col,life:0,maxLife:58});
      }

      // ── 5. Constellation lines ────────────────────────────────────────
      const cntr=projNodes.find(n=>n.type==='center');
      if (cntr){
        projNodes.forEach(n=>{
          if (n.type==='center') return;
          const c=nc(n.type), isWarm=n.type==='contact-warm';
          const dimF=n._dimF??1;
          const isHov=S.hov?.id===n.id, isSel=S.sel?.id===n.id;
          const lit=isHov||isSel;
          // Highlighted: bright solid line; idle: depth²-faded dashed (back hemisphere disappears)
          const baseAl=n.depth*n.depth*(n.importance??.5)*(isWarm?.24:.12)*dimF;
          const al=lit ? Math.min(.88,n.depth*(isWarm?.62:.42)*dimF) : baseAl;
          if (al<.007) return;
          const lw=lit?(isWarm?1.6:1.0):(isWarm?.8:.55);
          ctx.beginPath(); ctx.moveTo(cntr.sx,cntr.sy); ctx.lineTo(n.sx,n.sy);
          if (lit) {
            // Gradient: warm gold at center fades to node's own color — shows relationship visually
            const lg=ctx.createLinearGradient(cntr.sx,cntr.sy,n.sx,n.sy);
            lg.addColorStop(0,`rgba(255,210,60,${al.toFixed(3)})`);
            lg.addColorStop(1,rgba(c.col,al));
            ctx.strokeStyle=lg;
          } else {
            ctx.strokeStyle=rgba(c.col,al);
          }
          ctx.lineWidth=lw;
          if (!isWarm&&!lit) ctx.setLineDash([2,7]); ctx.stroke(); ctx.setLineDash([]);
        });
        // Cross-links between warm/mid contacts — more visible, respect proximity
        const warm=projNodes.filter(n=>(n.type==='contact-warm'||n.type==='contact-mid')&&(n._dimF??1)>0.15);
        for (let i=0;i<warm.length;i++) for (let j=i+1;j<warm.length;j++){
          const dist=Math.hypot(warm[i].sx-warm[j].sx,warm[i].sy-warm[j].sy);
          if (dist<Math.min(W,H)*.25){
            const bf=(warm[i]._dimF??1)*(warm[j]._dimF??1);
            const al=(warm[i].depth*warm[i].depth+warm[j].depth*warm[j].depth)/2*(warm[i].type==='contact-warm'&&warm[j].type==='contact-warm'?.16:.09)*bf;
            const lw=warm[i].type==='contact-warm'&&warm[j].type==='contact-warm'?.8:.5;
            ctx.beginPath(); ctx.moveTo(warm[i].sx,warm[i].sy); ctx.lineTo(warm[j].sx,warm[j].sy);
            ctx.strokeStyle=`rgba(255,160,40,${al.toFixed(3)})`; ctx.lineWidth=lw;
            ctx.setLineDash([1,8]); ctx.stroke(); ctx.setLineDash([]);
          }
        }
      }

      // ── 6. Data nodes ─────────────────────────────────────────────────
      projNodes.forEach(n=>{
        const c=nc(n.type);
        const isCenter=n.type==='center', isSel=S.sel?.id===n.id, isHov=S.hov?.id===n.id;
        const imp=n.importance??.5;
        // Warm contacts: sharp cubic heartbeat; others: smooth sine; hovered: fast sine
        let pulse;
        if (n.type==='contact-warm' && !isHov) {
          const hb = Math.sin(frame*.052+(n.phase??0));
          pulse = Math.pow(Math.max(0,hb),3)*.85+.15; // cubic peak → sharp beats
        } else {
          const pulseRate = isHov ? .062 : .038;
          pulse = Math.sin(frame*pulseRate+(n.phase??0))*.5+.5;
        }
        const df=isCenter?1:n.depth;
        const dimF=n._dimF??1; // animated filter fade

        // depth factor drives size: front nodes larger, back nodes smaller (stronger 3D parallax)
        const depthScale = isCenter ? 1 : (0.68 + 0.32*df);
        let r=c.sz*(isCenter?1:(n.pd??1))*depthScale*(1+imp*.28+pulse*.08);
        if (isSel) r*=1.4; if (isHov) r*=1.2;
        r=Math.max(isCenter?9:3,r);

        // Glow — warm contacts get extra ambient glow for hierarchy clarity
        // warmBoost widens the glow radius; glowDepth shrinks it for back-hemisphere nodes
        const warmBoost  = n.type==='contact-warm' ? 1.55 : n.type==='contact-mid' ? 1.22 : 1;
        const glowDepth  = isCenter ? 1 : (0.52 + 0.48*df); // back nodes: smaller glow footprint
        const glowR=r*(isCenter?5:isSel?5.5:isHov?4.5:3+imp)*warmBoost*glowDepth;
        const glowAlpha=df*(isSel?.45:isHov?.32:.18+imp*.12)*dimF;
        if (glowAlpha>0.015) drawGlow(n.sx,n.sy,c.glo,r*.5,glowR,glowAlpha); // skip gradient alloc for invisible nodes
        // Selected: second cooler outer glow layer — distinct "selected" aura
        if (isSel && dimF>0.15) drawGlow(n.sx,n.sy,[100,72,240],r,glowR*1.85,0.09*df*dimF);

        // Center node: slow ambient breathing ring (expands and fades outward)
        if (isCenter) {
          const bT=(frame*.009)%(Math.PI*2);
          const bR=r*(2.2+Math.sin(bT)*.9);
          const bA=(Math.sin(bT)*.5+.5)*.10+.02;
          ctx.beginPath(); ctx.arc(n.sx,n.sy,bR,0,Math.PI*2);
          ctx.strokeStyle=rgba(c.col,bA); ctx.lineWidth=1.8-Math.sin(bT)*.9; ctx.stroke();
          // Second ring offset by half-period — creates double-pulse effect
          const bT2=(bT+Math.PI)%(Math.PI*2);
          const bR2=r*(2.2+Math.sin(bT2)*.9);
          const bA2=(Math.sin(bT2)*.5+.5)*.06+.01;
          ctx.beginPath(); ctx.arc(n.sx,n.sy,bR2,0,Math.PI*2);
          ctx.strokeStyle=rgba(c.glo,bA2); ctx.lineWidth=1.0-Math.sin(bT2)*.5; ctx.stroke();
        }

        // Center rays — slow rotation for a breathing, meditative feel
        if (isCenter) for (let i=0;i<8;i++){
          const ang=(i/8)*Math.PI*2+frame*.0032;
          ctx.beginPath();
          ctx.moveTo(n.sx+Math.cos(ang)*r*1.1,n.sy+Math.sin(ang)*r*1.1);
          ctx.lineTo(n.sx+Math.cos(ang)*r*(2+pulse*.5),n.sy+Math.sin(ang)*r*(2+pulse*.5));
          ctx.strokeStyle=rgba(c.col,(i%2===0?.52+pulse*.22:.18)*dimF); ctx.lineWidth=1.1; ctx.stroke();
        }

        // Sphere body — full 3D gradient for visible nodes, flat dot for dimmed ghosts
        if (dimF > 0.14) {
          const bg2=ctx.createRadialGradient(n.sx-r*.28,n.sy-r*.28,r*.04,n.sx,n.sy,r);
          bg2.addColorStop(0,rgba([255,255,255],df*.9*dimF));
          bg2.addColorStop(.28,rgba(c.col,df*(isSel||isHov?1:.74+imp*.2)*dimF));
          bg2.addColorStop(1,rgba(c.glo,df*.52*dimF));
          ctx.fillStyle=bg2;
        } else {
          ctx.fillStyle=rgba(c.col, dimF*df*0.35); // cheap flat fill for ghost nodes
        }
        ctx.beginPath(); ctx.arc(n.sx,n.sy,r,0,Math.PI*2); ctx.fill();

        // Type shape hints — small inner mark to differentiate node categories
        if (!isCenter && dimF>0.15 && r>4) {
          ctx.save();
          ctx.globalAlpha = df * 0.55 * dimF;
          ctx.translate(n.sx, n.sy);
          if (n.type==='event') {
            // Diamond dot
            const ds=Math.max(1.2,r*.28);
            ctx.rotate(Math.PI/4);
            ctx.strokeStyle='rgba(255,255,255,0.7)';
            ctx.lineWidth=0.7;
            ctx.strokeRect(-ds,-ds,ds*2,ds*2);
          } else if (n.type==='plan') {
            // Triangle up
            const ts=Math.max(1.2,r*.26);
            ctx.beginPath();
            ctx.moveTo(0,-ts); ctx.lineTo(ts*.86,ts*.5); ctx.lineTo(-ts*.86,ts*.5);
            ctx.closePath();
            ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=0.7; ctx.stroke();
          } else if (n.type==='instagram') {
            // Small circle ring
            const ir=Math.max(1.5,r*.3);
            ctx.beginPath(); ctx.arc(0,0,ir,0,Math.PI*2);
            ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=0.8; ctx.stroke();
          } else if (n.type==='contact-warm') {
            // Cross — "this is a person" marker, prominent on active contacts
            const cs=Math.max(1.4,r*.25);
            ctx.strokeStyle='rgba(255,255,255,0.65)'; ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.moveTo(-cs,0); ctx.lineTo(cs,0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,-cs); ctx.lineTo(0,cs); ctx.stroke();
          } else if (n.type==='contact-mid') {
            // Smaller cross — same visual language, lower prominence
            const cs=Math.max(1.1,r*.18);
            ctx.strokeStyle='rgba(255,255,255,0.42)'; ctx.lineWidth=0.65;
            ctx.beginPath(); ctx.moveTo(-cs,0); ctx.lineTo(cs,0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,-cs); ctx.lineTo(0,cs); ctx.stroke();
          }
          ctx.restore();
        }

        // Homing flash ring: pulsing dashed ring while sphere rotates to front-face selected node
        if (isSel && S.homeX!==null) {
          const flashA=(Math.sin(frame*.14)*.5+.5)*.32*dimF;
          ctx.beginPath(); ctx.arc(n.sx,n.sy,r*3.4,0,Math.PI*2);
          ctx.strokeStyle=rgba(c.col,flashA); ctx.lineWidth=1.2;
          ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);
        }

        // Corona orbit on selected node
        if (isSel){
          const cR=r*2.8, rot=frame*.025;
          ctx.beginPath(); ctx.arc(n.sx,n.sy,cR,0,Math.PI*2);
          ctx.strokeStyle=rgba(c.col,.14); ctx.lineWidth=.6; ctx.setLineDash([2,5]); ctx.stroke(); ctx.setLineDash([]);
          for (let i=0;i<12;i++){
            const ang=(i/12)*Math.PI*2+rot;
            ctx.beginPath(); ctx.arc(n.sx+Math.cos(ang)*cR,n.sy+Math.sin(ang)*cR,.85,0,Math.PI*2);
            ctx.fillStyle=rgba(c.col,df*(Math.sin(frame*.05+i*.52)*.25+.65)*.72); ctx.fill();
          }
        }

        n._hr=Math.max(14,r*3.2);
      });

      // ── 7. Always-visible node labels (pill bg + colored border + overlap guard) ──
      const labelFs=Math.max(9,Math.round(Math.min(W,H)*.019));
      ctx.font=`${labelFs}px "DM Mono","Courier New",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='top';
      const drawnLabelRects=[]; // overlap prevention — iterate front-to-back so front nodes claim space first
      [...projNodes].reverse().forEach(n=>{
        if (n.type==='center') return;
        if ((n._dimF??1)<0.12) return; // fully faded out
        const isSel=S.sel?.id===n.id, isHov=S.hov?.id===n.id;
        const labelA = isSel ? 0 : isHov ? 0 : n.depth*n.depth*(n.importance??.5)*.92*(n._dimF??1);
        if (labelA<.055) return;
        // Events get 2 words for context; others use first word only; clamp to 16 chars
        const words = n.label.split(/[\s·]+/);
        const raw = n.type==='event' ? words.slice(0,2).join(' ') : words[0];
        const shortLabel = raw.length>16 ? raw.slice(0,14)+'…' : raw;
        const ly=n.sy+(n._hr??14)*.38+2;
        const tw=ctx.measureText(shortLabel).width;
        const pX=5, pY=2;
        const rx=n.sx-tw/2-pX, ry=ly-pY, rw=tw+pX*2, rh=labelFs+pY*2;
        // Skip if this pill overlaps an already-drawn one
        const overlaps=drawnLabelRects.some(r2=>
          rx<r2.x+r2.w && rx+rw>r2.x && ry<r2.y+r2.h && ry+rh>r2.y
        );
        if (overlaps) return;
        drawnLabelRects.push({x:rx,y:ry,w:rw,h:rh});
        // Dark fill
        ctx.fillStyle=`rgba(2,1,14,${(labelA*.82).toFixed(3)})`;
        rrect(rx,ry,rw,rh,3); ctx.fill();
        // Colored border matching node type — reinforces filter color system
        const tc=nc(n.type).col;
        ctx.strokeStyle=`rgba(${tc[0]},${tc[1]},${tc[2]},${(labelA*.38).toFixed(3)})`;
        ctx.lineWidth=0.6; rrect(rx,ry,rw,rh,3); ctx.stroke();
        // Label text
        ctx.fillStyle=`rgba(220,195,155,${labelA.toFixed(3)})`;
        ctx.fillText(shortLabel,n.sx,ly);
      });
      ctx.textBaseline='alphabetic';

      // Center node name — always visible, gold pill below the center star
      const cnNode = projNodes.find(n=>n.type==='center');
      if (cnNode && cnNode.label) {
        const cFs = Math.max(10, Math.round(Math.min(W,H)*.02));
        ctx.font=`${cFs}px "DM Mono","Courier New",monospace`;
        ctx.textAlign='center'; ctx.textBaseline='top';
        const cTw = ctx.measureText(cnNode.label).width;
        const cLy = cnNode.sy + Math.max(20, (cnNode._hr||48)/3.2) + 7;
        const cPx=8, cPy=3;
        const cRx=cnNode.sx-cTw/2-cPx, cRy=cLy-cPy, cRw=cTw+cPx*2, cRh=cFs+cPy*2;
        ctx.fillStyle='rgba(3,1,16,0.78)';
        rrect(cRx,cRy,cRw,cRh,4); ctx.fill();
        ctx.strokeStyle='rgba(255,200,55,0.5)';
        ctx.lineWidth=0.8; rrect(cRx,cRy,cRw,cRh,4); ctx.stroke();
        ctx.fillStyle='rgba(255,230,120,0.90)';
        ctx.fillText(cnNode.label, cnNode.sx, cLy);
        // Stat line — contact count and event count, muted below the name
        const cCount=nodePos.filter(n=>n.type.startsWith('contact')).length;
        const eCount=nodePos.filter(n=>n.type==='event').length;
        const statParts=[];
        if (cCount>0) statParts.push(`${cCount} people`);
        if (eCount>0) statParts.push(`${eCount} events`);
        if (statParts.length>0) {
          const statStr=statParts.join(' · ');
          const statFs=Math.max(8,cFs-2);
          ctx.font=`${statFs}px "DM Mono","Courier New",monospace`;
          ctx.fillStyle='rgba(200,170,100,0.30)';
          ctx.fillText(statStr, cnNode.sx, cLy+cRh+3);
        }
        ctx.textBaseline='alphabetic';
      }

      // Empty state: all filters off → hint in sphere center
      const allDimmed = projNodes.every(n=>n.type==='center'||(n._dimF??1)<0.15);
      if (allDimmed) {
        ctx.font=`${Math.max(9,Math.round(Math.min(W,H)*.016))}px "DM Mono","Courier New",monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='rgba(200,180,150,0.28)';
        ctx.fillText('no filters active',cx,cy+SPHERE_R*.55);
        ctx.textBaseline='alphabetic';
      }

      // ── 8. Hover/select tooltip (edge-clamped, status inline) ─────────
      const tgt=S.sel||S.hov;
      if (tgt && (projNodes.find(n=>n.id===tgt.id)?._dimF??1)>0.15) {
        const nd=projNodes.find(n=>n.id===tgt.id);
        if (nd){
          const c=nc(nd.type);
          const fs=Math.max(10,Math.round(Math.min(W,H)*.022));
          const fs2=Math.max(8,fs-2);
          ctx.font=`${fs}px "DM Mono","Courier New",monospace`;
          const tw=ctx.measureText(nd.label).width;
          const hasStatus=!!nd.statusLabel;
          const dotOffset=24; // space for type dot on left side of tooltip
          let statusW=0;
          if (hasStatus){ ctx.font=`${fs2}px "DM Mono","Courier New",monospace`; statusW=ctx.measureText(nd.statusLabel||'').width; ctx.font=`${fs}px "DM Mono","Courier New",monospace`; }
          const bw=Math.max(tw+dotOffset+14, hasStatus ? statusW+dotOffset+14 : 0);
          const bh=hasStatus?fs+fs2+20:fs+14;
          // Clamp to canvas bounds
          const rawLx=nd.sx, rawLy=nd.sy-(nd._hr??14)-16;
          const lx=Math.max(bw/2+8,Math.min(W-bw/2-8,rawLx));
          let   ly=rawLy;
          if (ly-bh/2<8) ly=nd.sy+(nd._hr??14)+bh/2+8; // flip below node if too close to top
          ly=Math.max(bh/2+8,Math.min(H-bh/2-8,ly));
          // Background
          ctx.fillStyle='rgba(3,1,16,0.94)';
          rrect(lx-bw/2,ly-bh/2,bw,bh,5); ctx.fill();
          // Colored left accent bar
          ctx.fillStyle=rgba(c.col,.72);
          rrect(lx-bw/2,ly-bh/2,3,bh,2); ctx.fill();
          // Border stroke
          ctx.strokeStyle=rgba(c.col,.28); ctx.lineWidth=.8;
          rrect(lx-bw/2,ly-bh/2,bw,bh,5); ctx.stroke();
          // Type color dot — visual type indicator inside tooltip
          const dotR=3.5;
          ctx.beginPath(); ctx.arc(lx-bw/2+10+dotR,ly-bh/2+bh/2,dotR,0,Math.PI*2);
          drawGlow(lx-bw/2+10+dotR,ly-bh/2+bh/2,c.col,dotR,dotR*4,.6);
          ctx.fillStyle=rgba(c.col,.9); ctx.fill();
          // Main label — offset right to clear the dot
          ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.font=`${fs}px "DM Mono","Courier New",monospace`;
          const textY = hasStatus ? ly-bh/2+fs/2+8 : ly;
          ctx.fillStyle='#EDE0B0';
          ctx.fillText(nd.label,lx-bw/2+10+dotR*2+6,textY);
          // Status line
          if (hasStatus){
            ctx.font=`${fs2}px "DM Mono","Courier New",monospace`;
            ctx.fillStyle=rgba(c.col,.78);
            ctx.fillText(nd.statusLabel,lx-bw/2+10+dotR*2+6,ly+bh/2-fs2/2-6);
          }
          ctx.textBaseline='alphabetic'; ctx.textAlign='center';
        }
      }

      // ── 9. Burst + ripple particles ───────────────────────────────────
      for (let i=bursts.length-1;i>=0;i--){
        const b=bursts[i];
        b.x+=b.vx; b.y+=b.vy; b.vx*=.93; b.vy*=.93; b.life++;
        const t=b.life/b.maxLife, a=(1-t)*(1-t)*.75;
        if (a<.02||b.life>=b.maxLife){bursts.splice(i,1);continue;}
        ctx.beginPath(); ctx.arc(b.x,b.y,b.sz*(1-t*.4),0,Math.PI*2);
        ctx.fillStyle=rgba(b.col,a); ctx.fill();
      }
      for (let i=ripples.length-1;i>=0;i--){
        const rp=ripples[i]; rp.life++;
        const nd=projNodes.find(n=>n.id===rp.nodeId);
        if (!nd){ripples.splice(i,1);continue;}
        const t=rp.life/rp.maxLife, r=(nd._hr??14)*(1+t*2.2), al=(1-t)*.42;
        if (al<.02||rp.life>=rp.maxLife){ripples.splice(i,1);continue;}
        ctx.beginPath(); ctx.arc(nd.sx,nd.sy,r,0,Math.PI*2);
        ctx.strokeStyle=rgba(rp.col,al); ctx.lineWidth=1; ctx.stroke();
      }

      // ── 10. Vignette (cached) ─────────────────────────────────────────
      if (!cachedVg) {
        cachedVg=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.15,cx,cy,Math.max(W,H)*.8);
        cachedVg.addColorStop(0,'rgba(0,0,0,0)'); cachedVg.addColorStop(1,'rgba(0,0,8,0.6)');
      }
      ctx.fillStyle=cachedVg; ctx.fillRect(0,0,W,H);

      frame++;
    }

    // ── Input handlers ────────────────────────────────────────────────────
    function onMouseEnter()  { S.mouseOnCanvas=true;  }
    function onMouseLeave()  { S.mouseOnCanvas=false; S.hov=null; }
    function onMouseDown(e)  { S.drag=true; S.startX=S.lastX=e.clientX; S.startY=S.lastY=e.clientY; S.velX=S.velY=0; S.homeX=S.homeY=null; }
    function onMouseMove(e)  {
      const rect=canvas.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      if (S.drag){
        const dx=e.clientX-S.lastX, dy=e.clientY-S.lastY;
        S.rotY+=dx*.007; S.rotX+=dy*.007; S.velY=dx*.007; S.velX=dy*.007;
        S.lastX=e.clientX; S.lastY=e.clientY; canvas.style.cursor='grabbing';
      } else {
        const newHov=hitTest(mx,my);
        if (newHov&&newHov.id!==S.hov?.id) emitRipple(newHov.id,nc(newHov.type).col);
        S.hov=newHov; canvas.style.cursor=S.hov?'pointer':'grab';
      }
    }
    function selectNode(hit) {
      S.sel = hit && S.sel?.id===hit.id ? null : hit;
      if (S.sel) {
        const nd = projNodes.find(n=>n.id===S.sel.id);
        if (nd) emitBurst(nd.sx,nd.sy,nc(nd.type).col);
        // Trigger homing: rotate sphere to bring selected node to front
        const np = nodePos.find(n=>n.id===S.sel.id);
        if (np && np.type!=='center') {
          const [hX,hY] = calcHomeAngles(np.wx,np.wy,np.wz);
          S.homeX=hX; S.homeY=hY;
        }
      } else {
        S.homeX=S.homeY=null;
      }
      cbRef.current?.(S.sel);
    }
    function onMouseUp(e){
      if (S.drag&&Math.hypot(e.clientX-S.startX,e.clientY-S.startY)<5){
        const rect=canvas.getBoundingClientRect();
        selectNode(hitTest(e.clientX-rect.left,e.clientY-rect.top));
      }
      S.drag=false; canvas.style.cursor=S.mouseOnCanvas?'grab':'default';
    }
    function onWheel(e){e.preventDefault();S.targetZoom*=e.deltaY>0?.92:1.08;S.targetZoom=Math.max(.35,Math.min(2.5,S.targetZoom));}

    let tprev=null, pinchDist=null, pinchZoom=null;
    function onTouchStart(e){
      if(e.touches.length===2){
        // Two-finger pinch — snapshot distance and zoom for ratio scaling
        const dx=e.touches[0].clientX-e.touches[1].clientX;
        const dy=e.touches[0].clientY-e.touches[1].clientY;
        pinchDist=Math.hypot(dx,dy); pinchZoom=S.targetZoom;
        tprev=null; // cancel single-finger pan
      } else {
        tprev={x:e.touches[0].clientX,y:e.touches[0].clientY};
        pinchDist=null; S.velX=S.velY=0;
      }
    }
    function onTouchMove(e){
      if(e.touches.length===2&&pinchDist!==null){
        const dx=e.touches[0].clientX-e.touches[1].clientX;
        const dy=e.touches[0].clientY-e.touches[1].clientY;
        S.targetZoom=Math.max(.35,Math.min(2.5,pinchZoom*Math.hypot(dx,dy)/pinchDist));
        e.preventDefault(); return;
      }
      if(!tprev)return;
      const dx=e.touches[0].clientX-tprev.x, dy=e.touches[0].clientY-tprev.y;
      S.rotY+=dx*.01; S.rotX+=dy*.01; S.velY=dx*.008; S.velX=dy*.008;
      tprev={x:e.touches[0].clientX,y:e.touches[0].clientY}; e.preventDefault();
    }
    function onTouchEnd(e){
      if(e.touches.length<2) pinchDist=null;
      if(e.touches.length>0) return; // still touching
      const rect=canvas.getBoundingClientRect();
      const hit=hitTest(e.changedTouches[0].clientX-rect.left,e.changedTouches[0].clientY-rect.top);
      selectNode(hit);
      tprev=null;
    }

    // Keyboard: Escape deselects, Tab cycles active nodes with homing
    function onKeyDown(e){
      if(e.key==='Escape'&&S.sel){ S.sel=null; S.homeX=S.homeY=null; cbRef.current?.(null); return; }
      if(e.key==='Tab'){
        e.preventDefault();
        // Tab cycles in descending importance order — most relevant nodes first
        const active=projNodes
          .filter(n=>n.type!=='center'&&(n._dimF??1)>0.5)
          .sort((a,b)=>(b.importance??0.5)-(a.importance??0.5));
        if(!active.length) return;
        const ci=active.findIndex(n=>n.id===S.sel?.id);
        const ni=(ci+1)%active.length;
        selectNode(active[ni]);
      }
    }

    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseup',    onMouseUp);
    window.addEventListener('keydown',    onKeyDown);
    canvas.addEventListener('wheel',      onWheel, {passive:false});
    canvas.addEventListener('touchstart', onTouchStart, {passive:false});
    canvas.addEventListener('touchmove',  onTouchMove,  {passive:false});
    canvas.addEventListener('touchend',   onTouchEnd,   {passive:true});
    canvas.style.cursor='grab';

    const ro=new ResizeObserver(resize); ro.observe(par);
    function loop(){render();rafId=requestAnimationFrame(loop);}
    loop();

    return ()=>{
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
      window.removeEventListener('keydown',    onKeyDown);
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
      ro.disconnect();
    };
  },[entities]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Social constellation — contacts, events, and plans visualized in 3D. Drag to rotate, scroll to zoom, Tab to cycle nodes, Escape to dismiss."
      tabIndex={0}
      style={{display:'block',width:'100%',height:'100%',outline:'none'}}
    />
  );
}
