import { useEffect, useRef } from 'react';

const SCALE = 2;
const COLS  = 15;
const ROWS  = 11;

// 15×11 grid — v-roads at cols 5,10  h-roads at rows 3,7
// 1=building, 2=h-road, 3=v-road, 4=intersection, 5=park, 6=pond
const GRID = [
  [5,5,1,1,5,3,5,5,5,5,3,1,5,1,1],  // 0  clusters: (2,3) (13,14)
  [1,5,5,5,1,3,5,5,5,5,3,5,1,5,5],  // 1  fountains (1,1)(7,1)  benches (13,1)
  [1,1,5,5,5,3,5,5,5,1,3,5,1,1,5],  // 2  clusters: (0,1) (12,13)
  [2,2,2,2,2,4,2,2,2,2,4,2,2,2,2],  // 3  h-road
  [1,5,5,1,1,3,5,5,5,5,3,5,5,5,1],  // 4  cluster: (3,4)
  [5,5,1,5,5,3,5,5,5,5,3,1,1,5,5],  // 5  fountain (6,5)  cluster: (11,12)
  [1,5,5,5,5,3,5,5,1,1,3,5,5,5,1],  // 6  benches (2,6)  cluster: (8,9)
  [2,2,2,2,2,4,2,2,2,2,4,2,2,2,2],  // 7  h-road
  [5,1,1,5,5,3,1,5,5,5,3,5,1,1,5],  // 8  clusters: (1,2) (12,13)
  [5,5,1,5,5,3,5,5,5,1,3,1,1,5,5],  // 9  fountain (8,9)  cluster: (11,12)
  [1,1,5,5,5,3,5,1,5,5,3,5,5,5,1],  // 10 benches (12,10)  cluster: (0,1)
];

const ROAD_H = [3, 7];
const ROAD_V = [5, 10];

// ── 6 warm-dusk zone palettes ─────────────────────────────────────
const ZONES_LIST = [
  { // 0 office tower — rich blue, bright ice windows
    plot:'#252868', top:'#6070C8', left:'#5060B4', right:'#3A4898',
    win:'#F0F5FF', accent:'#90B4FF', awning:['#303880','#4858A8'], sign:'OFFICE',
  },
  { // 1 diner — medium purple-blue, bright lavender glow
    plot:'#222060', top:'#7874B8', left:'#6464A4', right:'#505090',
    win:'#EAE0FF', accent:'#C0B0F0', awning:['#2E2A70','#524E90'], sign:'DINER',
  },
  { // 2 retail — vivid indigo, bright sky-blue
    plot:'#202270', top:'#5868C4', left:'#4858B0', right:'#38489C',
    win:'#C0E8FF', accent:'#70B8FF', awning:['#282E80','#3E50A8'], sign:'SHOP',
  },
  { // 3 market — bright lavender, pale lilac windows
    plot:'#282660', top:'#9490C8', left:'#8080B8', right:'#6C6CA4',
    win:'#F4F0FF', accent:'#D0C8FF', awning:['#302E78','#605E9C'], sign:'MARKET',
  },
  { // 4 club — vivid violet, hot purple neon
    plot:'#1E1A58', top:'#7868B8', left:'#6458A8', right:'#504898',
    win:'#E090FF', accent:'#A860FF', awning:['#2A2068','#584890'], sign:'CLUB',
  },
  { // 5 hotel — slate blue, bright cool-white windows
    plot:'#222458', top:'#6870B8', left:'#5860A8', right:'#485098',
    win:'#DCE4FF', accent:'#90A0E0', awning:['#2A2C70','#485098'], sign:'HOTEL',
  },
];

// Zone layout: col-block × row-block → zone index
const ZONE_MAP = [0,1,2, 3,4,5, 2,0,1];

function zoneOf(gx, gy) {
  const cb = gx < ROAD_V[0] ? 0 : gx < ROAD_V[1] ? 1 : 2;
  const rb = gy < ROAD_H[0] ? 0 : gy < ROAD_H[1] ? 1 : 2;
  return ZONES_LIST[ZONE_MAP[cb*3+rb]];
}

function iso(gx, gy, gz, tw, th, fh, ox, oy) {
  return {
    x: Math.round(ox + (gx - gy) * tw * 0.5),
    y: Math.round(oy + (gx + gy) * th * 0.5 - gz * fh),
  };
}
function fillPoly(ctx, pts, c) {
  ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
  ctx.closePath(); ctx.fill();
}
function strokePoly(ctx, pts, c, lw=1) {
  ctx.strokeStyle=c; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
  ctx.closePath(); ctx.stroke();
}

// ── Ground ────────────────────────────────────────────────────────
function drawGround(ctx, gx, gy, type, tw, th, fh, ox, oy, frame) {
  const a=iso(gx,  gy,  0,tw,th,fh,ox,oy), b=iso(gx+1,gy,  0,tw,th,fh,ox,oy);
  const c=iso(gx+1,gy+1,0,tw,th,fh,ox,oy), d=iso(gx,  gy+1,0,tw,th,fh,ox,oy);
  if (type===0) {
    // off-grid filler — plain dark ground to cover canvas corners
    fillPoly(ctx,[a,b,c,d],'#181860');
    strokePoly(ctx,[a,b,c,d],'rgba(0,0,0,0.2)',0.5);
    return;
  }
  if (type===1) {
    fillPoly(ctx,[a,b,c,d],zoneOf(gx,gy).plot);
  } else if (type===5) {
    fillPoly(ctx,[a,b,c,d],'#181C48');
    const mx=Math.round((a.x+c.x)/2), my=Math.round((a.y+c.y)/2);
    ctx.fillStyle='#222860';
    ctx.fillRect(mx-3,my,3,1); ctx.fillRect(mx+2,my+1,3,1); ctx.fillRect(mx-5,my+2,3,1);
    ctx.fillStyle='#2A3270';
    ctx.fillRect(mx-1,Math.round(a.y+(c.y-a.y)*0.25),2,Math.round((c.y-a.y)*0.5));
  } else if (type===6) {
    // Pond — deep teal water with animated shimmer
    fillPoly(ctx,[a,b,c,d],'#183848');
    const mid={x:Math.round((a.x+c.x)/2),y:Math.round((a.y+c.y)/2)};
    const rp=Math.sin(frame*0.04+gx*0.9+gy*1.3)*0.5+0.5;
    const wg=ctx.createRadialGradient(mid.x,mid.y,0,mid.x,mid.y,tw*0.65);
    wg.addColorStop(0,`rgba(60,170,200,${(0.18+rp*0.10).toFixed(3)})`);
    wg.addColorStop(0.55,`rgba(30,110,150,${(0.10+rp*0.05).toFixed(3)})`);
    wg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=wg;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
    // shimmer lines
    const sl=Math.sin(frame*0.06+gx*1.4+gy*0.7)*0.5+0.5;
    ctx.strokeStyle=`rgba(140,220,235,${(0.07+sl*0.07).toFixed(3)})`;ctx.lineWidth=0.5;
    const lx0=Math.round(a.x+(b.x-a.x)*0.25),ly0=Math.round(a.y+(b.y-a.y)*0.25);
    const lx1=Math.round(a.x+(b.x-a.x)*0.72),ly1=Math.round(a.y+(b.y-a.y)*0.72);
    ctx.beginPath();ctx.moveTo(lx0,ly0);ctx.lineTo(lx1,ly1);ctx.stroke();
    const lx2=Math.round(d.x+(c.x-d.x)*0.35),ly2=Math.round(d.y+(c.y-d.y)*0.35);
    const lx3=Math.round(d.x+(c.x-d.x)*0.65),ly3=Math.round(d.y+(c.y-d.y)*0.65);
    ctx.strokeStyle=`rgba(140,220,235,${(0.04+sl*0.04).toFixed(3)})`;
    ctx.beginPath();ctx.moveTo(lx2,ly2);ctx.lineTo(lx3,ly3);ctx.stroke();
    // soft edge
    strokePoly(ctx,[a,b,c,d],'rgba(80,160,180,0.35)',0.8);
  } else if (type===4) {
    fillPoly(ctx,[a,b,c,d],'#252868');
    ctx.strokeStyle='rgba(193,197,208,0.35)'; ctx.lineWidth=1; ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.moveTo(Math.round((a.x+d.x)/2),Math.round((a.y+d.y)/2));
    ctx.lineTo(Math.round((b.x+c.x)/2),Math.round((b.y+c.y)/2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.round((a.x+b.x)/2),Math.round((a.y+b.y)/2));
    ctx.lineTo(Math.round((d.x+c.x)/2),Math.round((d.y+c.y)/2)); ctx.stroke();
    ctx.setLineDash([]);
  } else {
    fillPoly(ctx,[a,b,c,d],'#222460');
    ctx.strokeStyle='rgba(193,197,208,0.30)'; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath();
    if (type===2) { ctx.moveTo(Math.round((a.x+d.x)/2),Math.round((a.y+d.y)/2)); ctx.lineTo(Math.round((b.x+c.x)/2),Math.round((b.y+c.y)/2)); }
    else          { ctx.moveTo(Math.round((a.x+b.x)/2),Math.round((a.y+b.y)/2)); ctx.lineTo(Math.round((d.x+c.x)/2),Math.round((d.y+c.y)/2)); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  strokePoly(ctx,[a,b,c,d],'rgba(0,0,0,0.25)',0.5);
  // puddle — cool blue palette reflection
  const al=(Math.sin(frame*0.03+gx*1.7+gy*2.3)*0.5+0.5)*0.07;
  if (al>0.01) {
    const mid={x:Math.round((a.x+c.x)/2),y:Math.round((a.y+c.y)/2)};
    const gr=ctx.createRadialGradient(mid.x,mid.y,0,mid.x,mid.y,tw*0.3);
    gr.addColorStop(0,`rgba(71,88,158,${(al*2).toFixed(3)})`); gr.addColorStop(1,'rgba(71,88,158,0)');
    ctx.fillStyle=gr; ctx.beginPath();
    ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.lineTo(d.x,d.y);
    ctx.closePath(); ctx.fill();
  }
}

// ── Building ──────────────────────────────────────────────────────
function drawBuilding(ctx, gx, gy, floors, zone, winMap, active, tw, th, fh, ox, oy, frame, isSel, label) {
  const m=0.30; // inset margin — makes buildings thinner inside their tile
  const tl=iso(gx+m,  gy+m,  floors,tw,th,fh,ox,oy), tr=iso(gx+1-m,gy+m,  floors,tw,th,fh,ox,oy);
  const br=iso(gx+1-m,gy+1-m,floors,tw,th,fh,ox,oy), bl=iso(gx+m,  gy+1-m,floors,tw,th,fh,ox,oy);
  const gtr=iso(gx+1-m,gy+m,  0,tw,th,fh,ox,oy), gbr=iso(gx+1-m,gy+1-m,0,tw,th,fh,ox,oy), gbl=iso(gx+m,gy+1-m,0,tw,th,fh,ox,oy);
  if (isSel){ctx.shadowColor=zone.accent;ctx.shadowBlur=18;}
  fillPoly(ctx,[bl,br,gbr,gbl],zone.right);
  fillPoly(ctx,[tr,br,gbr,gtr],zone.left);
  fillPoly(ctx,[tl,tr,br,bl],zone.top);
  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(8,4,0,0.45)'; ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(bl.x,bl.y);ctx.lineTo(gbl.x,gbl.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(tr.x,tr.y);ctx.lineTo(gtr.x,gtr.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(tr.x,tr.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(br.x,br.y);ctx.lineTo(gbr.x,gbr.y);ctx.stroke();
  strokePoly(ctx,[tl,tr,br,bl],'rgba(20,12,8,0.6)',0.8);
  // ── Windows (isometric parallelograms, projected onto each wall) ──
  const bw  = 1 - 2*m;                                   // building face width in grid units = 0.40
  const wL  = Math.min(4, Math.max(1, Math.round(bw / 0.14)));  // cols on left face  (~3)
  const wR  = Math.min(4, Math.max(1, Math.round(bw / 0.14)));  // cols on right face (~3)
  const wdx = bw / (wL * 2.6);   // window half-width in grid units
  const wdz = 0.26;               // window half-height in floor units

  // Left face — y is fixed at gy+1-m, x and z vary
  const faceY = gy + 1 - m;
  for (let r = 0; r < floors; r++) {
    const zc = r + 0.5;
    for (let c = 0; c < wL; c++) {
      const xc = gx + m + (c + 0.5) / wL * bw;
      const f0=iso(xc-wdx, faceY, zc+wdz, tw,th,fh,ox,oy);
      const f1=iso(xc+wdx, faceY, zc+wdz, tw,th,fh,ox,oy);
      const f2=iso(xc+wdx, faceY, zc-wdz, tw,th,fh,ox,oy);
      const f3=iso(xc-wdx, faceY, zc-wdz, tw,th,fh,ox,oy);
      fillPoly(ctx,[f0,f1,f2,f3],'rgba(0,0,0,0.65)');
      if (winMap[`L${r}_${c}`]) {
        ctx.shadowColor=zone.win; ctx.shadowBlur=6; ctx.globalAlpha=.92;
        const i0=iso(xc-wdx+0.007, faceY, zc+wdz-0.04, tw,th,fh,ox,oy);
        const i1=iso(xc+wdx-0.007, faceY, zc+wdz-0.04, tw,th,fh,ox,oy);
        const i2=iso(xc+wdx-0.007, faceY, zc-wdz+0.04, tw,th,fh,ox,oy);
        const i3=iso(xc-wdx+0.007, faceY, zc-wdz+0.04, tw,th,fh,ox,oy);
        fillPoly(ctx,[i0,i1,i2,i3],zone.win);
        ctx.shadowBlur=0; ctx.globalAlpha=1;
      }
    }
  }

  // Right face — x is fixed at gx+1-m, y and z vary
  const faceX = gx + 1 - m;
  for (let r = 0; r < floors; r++) {
    const zc = r + 0.5;
    for (let c = 0; c < wR; c++) {
      const yc = gy + m + (c + 0.5) / wR * bw;
      const f0=iso(faceX, yc-wdx, zc+wdz, tw,th,fh,ox,oy);
      const f1=iso(faceX, yc+wdx, zc+wdz, tw,th,fh,ox,oy);
      const f2=iso(faceX, yc+wdx, zc-wdz, tw,th,fh,ox,oy);
      const f3=iso(faceX, yc-wdx, zc-wdz, tw,th,fh,ox,oy);
      fillPoly(ctx,[f0,f1,f2,f3],'rgba(0,0,0,0.55)');
      if (winMap[`R${r}_${c}`]) {
        ctx.shadowColor=zone.win; ctx.shadowBlur=4; ctx.globalAlpha=.52;
        const i0=iso(faceX, yc-wdx+0.007, zc+wdz-0.04, tw,th,fh,ox,oy);
        const i1=iso(faceX, yc+wdx-0.007, zc+wdz-0.04, tw,th,fh,ox,oy);
        const i2=iso(faceX, yc+wdx-0.007, zc-wdz+0.04, tw,th,fh,ox,oy);
        const i3=iso(faceX, yc-wdx+0.007, zc-wdz+0.04, tw,th,fh,ox,oy);
        fillPoly(ctx,[i0,i1,i2,i3],zone.win);
        ctx.shadowBlur=0; ctx.globalAlpha=1;
      }
    }
  }

  // Lobby glow — warm light spilling from ground floor
  {
    const lx=Math.round((bl.x+br.x)/2), ly=Math.round((gbl.y+gbr.y)/2);
    const lp=Math.sin(frame*0.025+gx*1.3+gy*0.9)*0.5+0.5;
    const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,Math.round(tw*0.55));
    lg.addColorStop(0,zone.win+(Math.round((0.10+lp*0.06)*255)).toString(16).padStart(2,'0'));
    lg.addColorStop(1,zone.win+'00');
    ctx.fillStyle=lg;
    ctx.beginPath();ctx.moveTo(bl.x,bl.y);ctx.lineTo(br.x,br.y);ctx.lineTo(gbr.x,gbr.y);ctx.lineTo(gbl.x,gbl.y);ctx.closePath();ctx.fill();
  }

  // Rooftop blink on tall buildings
  if (floors>=4){
    const bp=Math.sin(frame*0.048+gx*0.7+gy*1.1)*0.5+0.5;
    if (bp>0.5){
      const rx=Math.round((tl.x+tr.x)/2), ry=Math.round((tl.y+tr.y)/2)-1;
      ctx.shadowColor=zone.accent; ctx.shadowBlur=5+bp*5;
      ctx.fillStyle=zone.accent; ctx.globalAlpha=bp*0.9;
      ctx.fillRect(rx-1,ry-1,2,2);
      ctx.shadowBlur=0; ctx.globalAlpha=1;
    }
  }
  // awning
  if (floors>=1){
    const a0l=iso(gx+m,  gy+1-m,1,   tw,th,fh,ox,oy),a0r=iso(gx+1-m,gy+1-m,1,   tw,th,fh,ox,oy);
    const a1l=iso(gx+m,  gy+1-m,0.6, tw,th,fh,ox,oy),a1r=iso(gx+1-m,gy+1-m,0.6, tw,th,fh,ox,oy);
    const aw=Math.abs(a0r.x-a0l.x), ns=Math.max(3,Math.round(aw/Math.max(2,Math.round(aw/6))));
    const [c1,c2]=zone.awning;
    for (let s=0;s<ns;s++){
      const t0=s/ns,t1=(s+1)/ns;
      const p0t={x:Math.round(a0l.x+t0*(a0r.x-a0l.x)),y:Math.round(a0l.y+t0*(a0r.y-a0l.y))};
      const p1t={x:Math.round(a0l.x+t1*(a0r.x-a0l.x)),y:Math.round(a0l.y+t1*(a0r.y-a0l.y))};
      const p0b={x:Math.round(a1l.x+t0*(a1r.x-a1l.x)),y:Math.round(a1l.y+t0*(a1r.y-a1l.y))};
      const p1b={x:Math.round(a1l.x+t1*(a1r.x-a1l.x)),y:Math.round(a1l.y+t1*(a1r.y-a1l.y))};
      fillPoly(ctx,[p0t,p1t,p1b,p0b],s%2===0?c1:c2);
    }
    ctx.strokeStyle='rgba(20,12,8,0.5)';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(a1l.x,a1l.y);ctx.lineTo(a1r.x,a1r.y);ctx.stroke();
  }
  if (isSel){ctx.shadowColor=zone.accent;ctx.shadowBlur=14;strokePoly(ctx,[tl,tr,br,bl],zone.accent+'CC',1.8);ctx.shadowBlur=0;}
}

// ── Streetlight ───────────────────────────────────────────────────
function drawStreetlight(ctx, gx, gy, tw, th, fh, ox, oy, frame) {
  const base=iso(gx+.12,gy+.12,0,  tw,th,fh,ox,oy);
  const mid =iso(gx+.12,gy+.12,2.6,tw,th,fh,ox,oy);
  const top =iso(gx+.04,gy+.12,2.9,tw,th,fh,ox,oy);
  ctx.strokeStyle='#5058A8';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(mid.x,mid.y);ctx.stroke();
  ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mid.x,mid.y);ctx.lineTo(top.x,top.y);ctx.stroke();
  const p=Math.sin(frame*.022)*.5+.5;
  ctx.shadowColor='#C1C5D0';ctx.shadowBlur=12+p*6;
  ctx.fillStyle=`rgba(193,197,208,${.85+p*.12})`;ctx.fillRect(top.x-2,top.y-1,4,2);ctx.shadowBlur=0;
  const gl=ctx.createRadialGradient(base.x,base.y,0,base.x,base.y,tw*.6);
  gl.addColorStop(0,`rgba(151,138,191,${.10+p*.06})`);gl.addColorStop(1,'rgba(151,138,191,0)');
  ctx.fillStyle=gl;ctx.fillRect(base.x-tw*.6,base.y-th*.6,tw*1.2,th*1.2);
}

// ── Tree ─────────────────────────────────────────────────────────
function drawTree(ctx, fx, fy, tw, th, fh, ox, oy, frame) {
  const base=iso(fx,fy,0,  tw,th,fh,ox,oy);
  const mid =iso(fx,fy,1.1,tw,th,fh,ox,oy);
  const top =iso(fx,fy,2.0,tw,th,fh,ox,oy);
  ctx.strokeStyle='#383890';ctx.lineWidth=Math.max(1,Math.round(tw*.04));
  ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(mid.x,mid.y);ctx.stroke();
  ctx.fillStyle='rgba(0,0,0,.12)';
  ctx.beginPath();ctx.ellipse(base.x,base.y+1,Math.round(tw*.12),Math.round(th*.1),0,0,Math.PI*2);ctx.fill();
  const sw=Math.round(Math.sin(frame*.011+fx*1.8+fy*2.1)*1.5);
  const r=Math.max(4,Math.round(tw*.19));
  ctx.fillStyle='#303090';ctx.beginPath();ctx.arc(top.x+sw,top.y,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4040A8';ctx.beginPath();ctx.arc(top.x+sw-Math.round(r*.45),top.y-Math.round(r*.3),Math.round(r*.72),0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#5050C0';ctx.beginPath();ctx.arc(top.x+sw+Math.round(r*.28),top.y-Math.round(r*.45),Math.round(r*.58),0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(140,135,200,.35)';ctx.beginPath();ctx.arc(top.x+sw-Math.round(r*.15),top.y-Math.round(r*.58),Math.round(r*.28),0,Math.PI*2);ctx.fill();
}

// ── Fountain ─────────────────────────────────────────────────────
function drawFountain(ctx, gx, gy, tw, th, fh, ox, oy, frame) {
  const b=iso(gx+.5,gy+.5,0,  tw,th,fh,ox,oy);
  const j=iso(gx+.5,gy+.5,1.5,tw,th,fh,ox,oy);
  const rw=Math.max(4,Math.round(tw*.34)),rh=Math.max(2,Math.round(th*.44));
  ctx.fillStyle='#2A4460';ctx.beginPath();ctx.ellipse(b.x,b.y,rw,rh,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3A7AAF';ctx.beginPath();ctx.ellipse(b.x,b.y,rw-2,rh-1,0,0,Math.PI*2);ctx.fill();
  const sh=(Math.sin(frame*.06)*.5+.5)*.35;
  ctx.fillStyle=`rgba(100,200,255,${sh.toFixed(2)})`;ctx.beginPath();ctx.ellipse(b.x-1,b.y-1,rw-4,rh-2,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#6090AA';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.x,b.y-rh/2);ctx.lineTo(j.x,j.y);ctx.stroke();
  const sp=Math.sin(frame*.09)*.5+.5;
  for (let i=0;i<7;i++){
    const ang=(i/7)*Math.PI*2+frame*.025;
    const ex=j.x+Math.round(Math.cos(ang)*rw*(.5+sp*.3));
    const ey=j.y+Math.round(Math.sin(ang)*rh*.5)+Math.round(sp*3);
    ctx.strokeStyle=`rgba(100,200,255,${.5+sp*.35})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(j.x,j.y);
    ctx.quadraticCurveTo(j.x+Math.round(Math.cos(ang)*rw*.3),j.y-Math.round(sp*5),ex,ey);ctx.stroke();
  }
  ctx.strokeStyle='rgba(150,210,255,.55)';ctx.lineWidth=.5;ctx.beginPath();ctx.ellipse(b.x,b.y,rw,rh,0,0,Math.PI*2);ctx.stroke();
}

// ── Grand Fountain (top-right plaza) ─────────────────────────────
function drawGrandFountain(ctx, gx, gy, tw, th, fh, ox, oy, frame) {
  const cx = gx + 0.5, cy = gy + 0.5;

  // ── Outer basin ─────────────────────────────────────────────────
  // Draw the basin as a raised ring: outer ellipse at z=0.38, inner at z=0.28
  const bz   = 0.38;
  const rOW  = Math.max(5, Math.round(tw * 0.46));
  const rOH  = Math.max(3, Math.round(th * 0.52));
  const rim  = iso(cx, cy, bz, tw, th, fh, ox, oy);
  const base = iso(cx, cy, 0,  tw, th, fh, ox, oy);

  // Stone base shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(base.x, base.y + 2, rOW + 2, rOH + 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer stone wall — left (south) face
  const wallH = rim.y - base.y;
  const wallGrad = ctx.createLinearGradient(rim.x - rOW, rim.y, rim.x - rOW, base.y);
  wallGrad.addColorStop(0, '#3C3E80');
  wallGrad.addColorStop(1, '#252660');
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.ellipse(rim.x, rim.y, rOW, rOH, 0, Math.PI * 0, Math.PI * 1);
  ctx.lineTo(base.x - rOW, base.y);
  ctx.ellipse(base.x, base.y, rOW, rOH, 0, Math.PI * 1, Math.PI * 0, true);
  ctx.closePath();
  ctx.fill();

  // Rim top surface — stone ring
  ctx.fillStyle = '#4A4C90';
  ctx.beginPath();
  ctx.ellipse(rim.x, rim.y, rOW, rOH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner water surface (sunken)
  const rIW = Math.max(3, Math.round(rOW * 0.72));
  const rIH = Math.max(2, Math.round(rOH * 0.72));
  const wz  = bz - 0.08;
  const wc  = iso(cx, cy, wz, tw, th, fh, ox, oy);

  // Water base
  ctx.fillStyle = '#1A3C5E';
  ctx.beginPath();
  ctx.ellipse(wc.x, wc.y, rIW, rIH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated water shimmer
  const sh = Math.sin(frame * 0.07) * 0.5 + 0.5;
  const wg = ctx.createRadialGradient(wc.x - Math.round(rIW * 0.2), wc.y - Math.round(rIH * 0.2), 0, wc.x, wc.y, rIW);
  wg.addColorStop(0,   `rgba(80,180,240,${(0.40 + sh * 0.15).toFixed(2)})`);
  wg.addColorStop(0.5, `rgba(40,120,190,${(0.22 + sh * 0.08).toFixed(2)})`);
  wg.addColorStop(1,   'rgba(20,60,120,0)');
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.ellipse(wc.x, wc.y, rIW, rIH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water ripple rings
  const ripA = (Math.sin(frame * 0.05) * 0.5 + 0.5) * 0.5;
  const ripR = Math.sin(frame * 0.05) * 0.5 + 0.5;
  ctx.strokeStyle = `rgba(120,210,255,${(ripA * 0.45).toFixed(2)})`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(wc.x, wc.y, Math.round(rIW * (0.4 + ripR * 0.3)), Math.round(rIH * (0.4 + ripR * 0.3)), 0, 0, Math.PI * 2);
  ctx.stroke();

  // Rim inner edge highlight
  ctx.strokeStyle = 'rgba(120,130,200,0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(wc.x, wc.y, rIW, rIH, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,90,170,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(rim.x, rim.y, rOW, rOH, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── Central pedestal ────────────────────────────────────────────
  const pr = Math.max(2, Math.round(tw * 0.07));
  const pBase = iso(cx, cy, bz,  tw, th, fh, ox, oy);
  const pTop  = iso(cx, cy, bz + 0.85, tw, th, fh, ox, oy);
  // Column side
  ctx.fillStyle = '#3C3E84';
  ctx.fillRect(pBase.x - pr, pTop.y, pr * 2, pBase.y - pTop.y);
  // Column cap
  ctx.fillStyle = '#5558A0';
  ctx.beginPath();
  ctx.ellipse(pTop.x, pTop.y, pr + 2, Math.round((pr + 2) * 0.5), 0, 0, Math.PI * 2);
  ctx.fill();
  // Column base cap
  ctx.fillStyle = '#484A98';
  ctx.beginPath();
  ctx.ellipse(pBase.x, pBase.y, pr + 3, Math.round((pr + 3) * 0.5), 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Animated water jets ─────────────────────────────────────────
  const spoutTop = iso(cx, cy, bz + 1.25, tw, th, fh, ox, oy);
  const sp  = Math.sin(frame * 0.08) * 0.5 + 0.5;
  const sp2 = Math.cos(frame * 0.06) * 0.5 + 0.5;
  const JET_COUNT = 8;

  for (let i = 0; i < JET_COUNT; i++) {
    const ang = (i / JET_COUNT) * Math.PI * 2 + frame * 0.018;
    const spread = 0.28 + sp2 * 0.08;
    // Arc: start at spoutTop, control point up+out, land in basin
    const landX = wc.x + Math.round(Math.cos(ang) * rIW * spread * 2.2);
    const landY = wc.y + Math.round(Math.sin(ang) * rIH * spread * 2.0);
    const ctrlX = spoutTop.x + Math.round(Math.cos(ang) * rIW * spread * 1.2);
    const ctrlY = spoutTop.y - Math.round(7 + sp * 5);
    const alpha = 0.55 + sp * 0.25;
    ctx.strokeStyle = `rgba(100,200,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = Math.max(0.7, 1.2 - i * 0.04);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(spoutTop.x, spoutTop.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, landX, landY);
    ctx.stroke();
  }

  // Central vertical jet — straight up with glow
  ctx.shadowColor = 'rgba(80,200,255,0.8)';
  ctx.shadowBlur  = 6 + sp * 6;
  ctx.strokeStyle = `rgba(180,230,255,${(0.75 + sp * 0.2).toFixed(2)})`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(spoutTop.x, spoutTop.y - Math.round(4 + sp * 4));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineCap    = 'butt';

  // Top droplet glow
  ctx.fillStyle  = `rgba(200,240,255,${(0.7 + sp * 0.25).toFixed(2)})`;
  ctx.shadowColor = 'rgba(100,220,255,0.9)';
  ctx.shadowBlur  = 5 + sp * 5;
  ctx.beginPath();
  ctx.arc(spoutTop.x, spoutTop.y - Math.round(4 + sp * 4), Math.max(1, Math.round(tw * 0.04)), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Bench ────────────────────────────────────────────────────────
function drawBench(ctx, fx, fy, tw, th, fh, ox, oy) {
  const p=iso(fx,fy,.15,tw,th,fh,ox,oy),s=Math.max(2,Math.round(tw*.07));
  ctx.fillStyle='#4848A0';ctx.fillRect(p.x-s*2,p.y,s*4,s);
  ctx.fillStyle='#383890';ctx.fillRect(p.x-s*2,p.y-s*2,s*4,s);
  ctx.fillStyle='#282878';ctx.fillRect(p.x-Math.round(s*1.5),p.y+s,1,s);ctx.fillRect(p.x+Math.round(s*.5),p.y+s,1,s);
}

// ── Market stall ─────────────────────────────────────────────────
function drawMarketStall(ctx, gx, gy, tw, th, fh, ox, oy, zone) {
  const b=iso(gx+.45,gy+.88,0,  tw,th,fh,ox,oy);
  const t=iso(gx+.45,gy+.88,1.3,tw,th,fh,ox,oy);
  const s=Math.max(3,Math.round(tw*.13));
  ctx.strokeStyle='#383898';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(b.x-s,b.y);ctx.lineTo(t.x-s,t.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(b.x+s,b.y);ctx.lineTo(t.x+s,t.y);ctx.stroke();
  ctx.fillStyle=zone.awning[0];
  ctx.beginPath();ctx.moveTo(t.x-s-2,t.y);ctx.lineTo(t.x+s+2,t.y);
  ctx.lineTo(t.x+s,t.y+Math.round(th*.38));ctx.lineTo(t.x-s,t.y+Math.round(th*.38));
  ctx.closePath();ctx.fill();
  ctx.fillStyle='#5858A8';ctx.fillRect(b.x-s,b.y-2,s*2,2);
  ['#FF5522','#33EE88','#FFDD22','#FF44AA'].forEach((col,i)=>{ctx.fillStyle=col;ctx.fillRect(b.x-s+Math.round(i*s*.55),b.y-5,2,2);});
}

// ── Bus stop ─────────────────────────────────────────────────────
function drawBusStop(ctx, fx, fy, tw, th, fh, ox, oy, frame) {
  const b=iso(fx,fy,0,  tw,th,fh,ox,oy),t=iso(fx,fy,1.9,tw,th,fh,ox,oy);
  const s=Math.max(2,Math.round(tw*.06));
  ctx.strokeStyle='#446070';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(t.x,t.y);ctx.stroke();
  ctx.fillStyle='#336688';ctx.fillRect(t.x-s*2,t.y-1,s*4,2);
  ctx.strokeStyle='rgba(100,200,220,.45)';ctx.lineWidth=.5;ctx.strokeRect(t.x-s*2,t.y,s*4,Math.round(th*.42));
  const p=Math.sin(frame*.018)*.5+.5;
  ctx.fillStyle=`rgba(60,200,240,${.35+p*.25})`;ctx.fillRect(t.x-2,t.y,4,3);
}

// ── Outdoor table ────────────────────────────────────────────────
function drawTableChair(ctx, gx, gy, tw, th, fh, ox, oy, zone) {
  const p=iso(gx+.5,gy+.92,.2,tw,th,fh,ox,oy),s=Math.max(3,Math.round(tw*.08));
  ctx.fillStyle='#505098';ctx.fillRect(p.x-s,p.y-s/2,s*2,s);
  ctx.fillStyle='#404088';ctx.fillRect(p.x-s+1,p.y+s/2,1,s);ctx.fillRect(p.x+s-2,p.y+s/2,1,s);
  ctx.fillStyle=zone.win;ctx.fillRect(p.x-1,p.y-s/2,2,2);
}

// ── Pedestrian ───────────────────────────────────────────────────
const PED_CLOTHES=['#FF6B6B','#4FC3F7','#81C784','#FFB74D','#CE93D8','#F06292','#4DD0E1','#FFF176','#A5D6A7','#90CAF9'];
const PED_SKIN   =['#FDBCB4','#F1C27D','#E0AC69','#C68642','#8D5524'];
const PED_HAIR   =['#1A1230','#2C1810','#5C3317','#0D0D0D','#3B1F0A'];

function drawPedestrian(ctx, sx, sy, sz, frame, phase, isSel, ci, hi, hasUmb) {
  const s   = Math.max(4, Math.round(sz * 0.88));
  const bob = Math.sin(frame * 0.20 + phase) * 1.1;
  const sw  = Math.sin(frame * 0.20 + phase) * s * 0.22;  // leg/arm swing
  const cx  = Math.round(sx), cy = Math.round(sy + bob);

  // Ground shadow
  ctx.fillStyle='rgba(0,0,40,0.20)';
  ctx.beginPath();
  ctx.ellipse(cx, Math.round(sy+s*.14), Math.round(s*.40), Math.round(s*.12), 0, 0, Math.PI*2);
  ctx.fill();

  if (isSel){ctx.shadowColor='#C8DCFF';ctx.shadowBlur=10;}

  // Legs
  const lw=Math.max(1,Math.round(s*.18)), legTop=Math.round(cy-s*.06), legBot=Math.round(cy+s*.38);
  ctx.strokeStyle='#1E1A50'; ctx.lineWidth=lw; ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(Math.round(cx-s*.12),legTop);ctx.lineTo(Math.round(cx-s*.12+sw),legBot);ctx.stroke();
  ctx.beginPath();ctx.moveTo(Math.round(cx+s*.12),legTop);ctx.lineTo(Math.round(cx+s*.12-sw),legBot);ctx.stroke();

  // Body
  const bw=Math.round(s*.54), bh=Math.round(s*.50), bx=Math.round(cx-bw/2), by=Math.round(cy-s*.58);
  ctx.fillStyle=PED_CLOTHES[ci%PED_CLOTHES.length];
  ctx.fillRect(bx,by,bw,bh);

  // Arms
  ctx.strokeStyle=PED_CLOTHES[ci%PED_CLOTHES.length]; ctx.lineWidth=Math.max(1,Math.round(s*.15));
  ctx.beginPath();ctx.moveTo(bx,Math.round(cy-s*.46));ctx.lineTo(Math.round(bx-sw*.5),Math.round(cy-s*.18));ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+bw,Math.round(cy-s*.46));ctx.lineTo(Math.round(bx+bw+sw*.5),Math.round(cy-s*.18));ctx.stroke();

  // Head
  const hr=Math.max(2,Math.round(s*.27)), hy=Math.round(cy-s*1.06);
  ctx.fillStyle=PED_SKIN[hi%PED_SKIN.length];
  ctx.beginPath();ctx.arc(cx,hy,hr,0,Math.PI*2);ctx.fill();

  // Hair
  ctx.fillStyle=PED_HAIR[hi%PED_HAIR.length];
  ctx.beginPath();ctx.arc(cx,hy,hr,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillRect(cx-hr,hy-1,hr*2,2);

  ctx.shadowBlur=0; ctx.lineCap='butt';
}

// ── Car ──────────────────────────────────────────────────────────
function shadeHex(hex, amt) {
  const c = hex.replace('#','');
  let r=parseInt(c.slice(0,2),16), g=parseInt(c.slice(2,4),16), b=parseInt(c.slice(4,6),16);
  r=Math.min(255,Math.max(0,r+amt));
  g=Math.min(255,Math.max(0,g+amt));
  b=Math.min(255,Math.max(0,b+amt));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function drawCar(ctx, sx, sy, road, color, tw, th) {
  const angle = road === 'h' ? Math.atan2(th, tw * 2) : Math.atan2(-th, tw * 2);
  // Proportions: cw = length along road, ch = width across road
  const cw = Math.max(7,  Math.round(tw * 0.26));
  const ch = Math.max(4,  Math.round(th * 0.32));
  const r  = Math.max(1,  Math.round(ch * 0.32)); // hull corner radius

  ctx.save();
  ctx.translate(Math.round(sx), Math.round(sy));
  ctx.rotate(angle);

  // ── Ground glow / soft road shadow ──────────────────────────────
  ctx.shadowColor   = 'rgba(0,0,0,0.60)';
  ctx.shadowBlur    = Math.max(4, Math.round(cw * 0.45));
  ctx.shadowOffsetY = Math.round(ch * 0.40);

  // ── Hull — gradient side-to-side to give a rounded 3-D look ────
  const hullGrad = ctx.createLinearGradient(-cw/2, -ch/2, -cw/2, ch/2);
  hullGrad.addColorStop(0,   shadeHex(color,  36));
  hullGrad.addColorStop(0.4, color);
  hullGrad.addColorStop(1,   shadeHex(color, -40));
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.roundRect(-cw/2, -ch/2, cw, ch, r);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // ── Thin body outline ───────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.roundRect(-cw/2, -ch/2, cw, ch, r);
  ctx.stroke();

  // ── Hood crease line (front half) ───────────────────────────────
  ctx.strokeStyle = shadeHex(color, -55);
  ctx.lineWidth   = Math.max(0.5, ch * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(Math.round(cw * 0.12), -ch/2 + 1);
  ctx.lineTo(Math.round(cw * 0.42), -ch/2 + 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(Math.round(cw * 0.12),  ch/2 - 1);
  ctx.lineTo(Math.round(cw * 0.42),  ch/2 - 1);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // ── Roof / cabin ────────────────────────────────────────────────
  const rW  = Math.round(cw * 0.50);
  const rH  = Math.round(ch * 0.54);
  const rX  = -Math.round(cw * 0.08);            // slightly rearward of center
  const rY  = -(ch / 2) - rH + Math.round(ch * 0.14);
  const roofGrad = ctx.createLinearGradient(0, rY, 0, rY + rH);
  roofGrad.addColorStop(0, shadeHex(color,  14));
  roofGrad.addColorStop(1, shadeHex(color, -50));
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.roundRect(rX - rW/2, rY, rW, rH, Math.max(1, r - 1));
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.roundRect(rX - rW/2, rY, rW, rH, Math.max(1, r - 1));
  ctx.stroke();

  // ── Windshields ─────────────────────────────────────────────────
  const wndH = Math.round(rH * 0.64);
  const wndY = rY + Math.round(rH * 0.18);
  // Front
  const fwW = Math.round(rW * 0.68);
  const fwX = rX + rW/2 - fwW - Math.round(rW * 0.04);
  ctx.fillStyle = 'rgba(160,215,255,0.62)';
  ctx.beginPath();
  ctx.roundRect(fwX, wndY, fwW, wndH, 1);
  ctx.fill();
  // Glass sheen
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(fwX + 1, wndY + 1, Math.round(fwW * 0.3), Math.round(wndH * 0.45));
  // Rear
  const rwW = Math.round(rW * 0.56);
  const rwX = rX - rW/2 + Math.round(rW * 0.04);
  ctx.fillStyle = 'rgba(110,170,230,0.45)';
  ctx.beginPath();
  ctx.roundRect(rwX, wndY + Math.round(wndH * 0.08), rwW, Math.round(wndH * 0.84), 1);
  ctx.fill();

  // ── Side window strip ───────────────────────────────────────────
  const swY = rY + Math.round(rH * 0.20);
  const swH = Math.round(rH * 0.60);
  ctx.fillStyle = 'rgba(130,190,240,0.28)';
  ctx.fillRect(rX - rW/2, swY, rW, swH);

  // ── Wheels — dark rubber rings with chrome hub ───────────────────
  const wrad  = Math.max(2, Math.round(ch * 0.22));
  const wHub  = Math.max(1, Math.round(wrad * 0.42));
  const wposX = Math.round(cw * 0.28);
  const wposYt = -(ch / 2);
  const wposYb =  (ch / 2);
  for (const [wx, wy] of [
    [ wposX, wposYt],[ wposX, wposYb],
    [-wposX, wposYt],[-wposX, wposYb],
  ]) {
    // Tyre
    ctx.fillStyle = '#111122';
    ctx.beginPath();
    ctx.ellipse(wx, wy, wrad, Math.round(wrad * 0.52), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,80,120,0.7)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(wx, wy, wrad, Math.round(wrad * 0.52), 0, 0, Math.PI * 2);
    ctx.stroke();
    // Hub cap
    ctx.fillStyle = 'rgba(200,210,230,0.75)';
    ctx.beginPath();
    ctx.ellipse(wx, wy, wHub, Math.round(wHub * 0.52), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Headlights — warm white + bright cone glow ──────────────────
  const hlH = Math.max(2, Math.round(ch * 0.20));
  const hlW = Math.max(1, Math.round(cw * 0.055));
  const hlY1 = -Math.round(ch * 0.24);
  const hlY2 =  Math.round(ch * 0.08);
  // Lens glow projected forward
  ctx.shadowColor = 'rgba(255,245,180,0.85)';
  ctx.shadowBlur  = Math.max(5, Math.round(cw * 0.55));
  ctx.fillStyle   = 'rgba(255,252,210,0.98)';
  ctx.fillRect(cw/2 - hlW - 1, hlY1, hlW + 1, hlH);
  ctx.fillRect(cw/2 - hlW - 1, hlY2, hlW + 1, hlH);
  ctx.shadowBlur = 0;
  // Lens housing
  ctx.fillStyle = 'rgba(255,255,240,1)';
  ctx.fillRect(cw/2 - hlW, hlY1, hlW, hlH);
  ctx.fillRect(cw/2 - hlW, hlY2, hlW, hlH);

  // ── Tail lights — red lens pair ──────────────────────────────────
  ctx.shadowColor = 'rgba(255,30,30,0.75)';
  ctx.shadowBlur  = Math.max(4, Math.round(cw * 0.38));
  ctx.fillStyle   = 'rgba(255,55,55,0.95)';
  ctx.fillRect(-cw/2, hlY1, hlW + 1, hlH);
  ctx.fillRect(-cw/2, hlY2, hlW + 1, hlH);
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(200,20,20,1)';
  ctx.fillRect(-cw/2, hlY1, hlW, hlH);
  ctx.fillRect(-cw/2, hlY2, hlW, hlH);

  ctx.restore();
}

// ── Hit test ─────────────────────────────────────────────────────
function hitBuilding(buildings, mx, my, tw, th, fh, ox, oy) {
  for (let i=buildings.length-1;i>=0;i--){
    const b=buildings[i];
    const tl=iso(b.gx,  b.gy,  b.floors,tw,th,fh,ox,oy);
    const tr=iso(b.gx+1,b.gy,  b.floors,tw,th,fh,ox,oy);
    const gbl=iso(b.gx,  b.gy+1,0,tw,th,fh,ox,oy);
    const gbr=iso(b.gx+1,b.gy+1,0,tw,th,fh,ox,oy);
    const gtr=iso(b.gx+1,b.gy,  0,tw,th,fh,ox,oy);
    if (mx>=Math.min(tl.x,gbl.x)&&mx<=Math.max(tr.x,gtr.x)&&my>=tl.y-4&&my<=Math.max(gbr.y,gbl.y)+4) return b;
  }
  return null;
}
function hitPed(peds, mx, my) {
  for (const p of peds){ if (p.sx&&Math.sqrt((p.sx-mx)**2+(p.sy-my)**2)<10) return p; }
  return null;
}
function updatePeds(peds) {
  peds.forEach(p=>{
    p.offset+=p.speed*p.dir;
    const max=p.road==='h'?COLS+.2:ROWS+.2;
    if (p.offset>max||p.offset<-.2) p.dir*=-1;
  });
}
function updateCars(cars) {
  cars.forEach(c=>{
    c.offset+=c.speed*c.dir;
    const max=c.road==='h'?COLS+.7:ROWS+.7;
    if (c.offset>max) c.offset=-.7;
    if (c.offset<-.7) c.offset=max;
  });
}

// ── Ambient peds + cars (always present) ─────────────────────────
const AMBIENT_PED_COUNT = 28;
const AMBIENT_CAR_COUNT = 12;
const AMB_CAR_COLORS = ['#4499FF','#FF4499','#44FFAA','#FFAA44','#AA44FF','#FF6644','#44DDFF','#FF4444','#88FF44','#FF8844','#4444FF','#FFFF44'];

function makeAmbientPeds() {
  const roads=['h3','v5','h7','v10','h3','v10','h7','v5','h3','v5','h7','v10','h3','v10'];
  return Array.from({length:AMBIENT_PED_COUNT},(_,i)=>{
    const r=roads[i%roads.length];
    return {
      id:`amb-p-${i}`, road:r[0], roadPos:parseInt(r.slice(1)),
      lane:0.06, offset:((i/AMBIENT_PED_COUNT)*(COLS+2)-.5+Math.sin(i*1.618)*1.5),
      dir:i%2===0?1:-1, phase:((i*0.618)%1)*Math.PI*2,
      speed:.0008+((i*7)%9)*.0002,
      clothesIdx:i%PED_CLOTHES.length, hairIdx:(i*3)%PED_HAIR.length,
      hasUmbrella:i%3===0, sx:0, sy:0, label:null,
    };
  });
}
function makeAmbientCars() {
  const roads=['h3','v5','h7','v10','h3','v10','h7','v5','h3','v5','h7','v10'];
  return Array.from({length:AMBIENT_CAR_COUNT},(_,i)=>{
    const r=roads[i%roads.length];
    return {
      id:`amb-c-${i}`, road:r[0], roadPos:parseInt(r.slice(1)),
      offset:((i/AMBIENT_CAR_COUNT)*(COLS+1)), dir:i%2===0?1:-1,
      speed:.0015+((i*5)%7)*.0005, color:AMB_CAR_COLORS[i%AMB_CAR_COLORS.length],
    };
  });
}

// ── Component ─────────────────────────────────────────────────────
export default function CityCanvas({ buildings, pedestrians, cars, onEntityClick }) {
  const canvasRef  =useRef(null);
  const stateRef   =useRef(null);
  const selectedRef=useRef(null);
  const hoveredRef =useRef(null);
  const onClickRef =useRef(onEntityClick);
  useEffect(()=>{ onClickRef.current=onEntityClick; });

  useEffect(()=>{
    const canvas=canvasRef.current; if (!canvas) return;
    const parent=canvas.parentElement;
    const ctx   =canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;

    let W=parent.offsetWidth,H=parent.offsetHeight;
    let PW=0,PH=0,tw=60,th=25,fh=18,ox=0,oy=0;

    // Window maps for data buildings
    const winMaps={};
    (buildings||[]).forEach(b=>{
      const m={};
      for (let r=0;r<b.floors;r++) for (let c=0;c<4;c++){
        m[`L${r}_${c}`]=Math.random()>(b.active?.12:.35);
        m[`R${r}_${c}`]=Math.random()>(b.active?.15:.38);
      }
      winMaps[b.id]=m;
    });

    // Deterministic window maps + metadata for filler buildings
    const FILLER_NAMES=['The Corner','Atelier','Workshop','The Block','Loft Co.','Annexe','Quarters','Studio','The Unit','Depot','Passage','Courtyard','The Row','Terrace','Arcade','The Yard','Dwelling','Junction','The Keep','Outpost','Alcove','Pavilion','The Nook','Enclave','Mews'];
    const fillerWinMaps={};
    const fillerBldMap={};
    const bldSet=new Set((buildings||[]).map(b=>`${b.gx},${b.gy}`));
    for (let gy2=0;gy2<ROWS;gy2++) for (let gx2=0;gx2<COLS;gx2++){
      if ((GRID[gy2]?.[gx2]??0)===1 && !bldSet.has(`${gx2},${gy2}`)){
        const m={};
        for (let r=0;r<6;r++) for (let c=0;c<4;c++){
          m[`L${r}_${c}`]=(gx2*17+gy2*31+r*7+c*13)%10>2;
          m[`R${r}_${c}`]=(gx2*23+gy2*37+r*11+c*7)%10>3;
        }
        fillerWinMaps[`${gx2},${gy2}`]=m;
        const nameIdx=(gx2*13+gy2*7)%FILLER_NAMES.length;
        const ff=((gx2*7+gy2*13)%4)+2;
        // No label — filler buildings are decorative, no tooltip shown
        fillerBldMap[`${gx2},${gy2}`]={id:`filler-${gx2}-${gy2}`,gx:gx2,gy:gy2,floors:ff,label:FILLER_NAMES[nameIdx]};
      }
    }

    // Combine data peds + ambient
    const roadAssign=['h3','v5','h7','v10','h3','v10','h7','v5','h3','v5'];
    const dataPeds=(pedestrians||[]).map((p,i)=>{
      const r=roadAssign[i%roadAssign.length];
      return {...p,road:r[0],roadPos:parseInt(r.slice(1)),lane:0.06,
        offset:Math.random()*(COLS-.5),dir:Math.random()>.5?1:-1,phase:Math.random()*Math.PI*2,
        speed:p.speed??(.001+Math.random()*.0008),
        clothesIdx:Math.floor(Math.random()*PED_CLOTHES.length),
        hairIdx:Math.floor(Math.random()*PED_HAIR.length),
        hasUmbrella:Math.random()>.45,sx:0,sy:0};
    });
    const allPeds=[...dataPeds,...makeAmbientPeds()];

    // Combine data cars + ambient
    const carRoads=['h3','v5','h7','v10','h3','v10','h7','v5','h3','v5'];
    const dataCars=(cars||[]).map((c,i)=>{
      const r=carRoads[i%carRoads.length];
      return {...c,road:r[0],roadPos:parseInt(r.slice(1)),offset:Math.random()*(COLS-.5),
        dir:Math.random()>.5?1:-1,speed:c.speed??.002};
    });
    const allCars=[...dataCars,...makeAmbientCars()];

    stateRef.current={peds:allPeds,cars:allCars};

    const rain=Array.from({length:200},()=>({x:Math.random(),y:Math.random(),speed:1.5+Math.random()*1.4}));

    // Trees — sparse, deterministic so layout is stable
    const trees=[];
    for (let gy2=0;gy2<ROWS;gy2++) for (let gx2=0;gx2<COLS;gx2++){
      const type=GRID[gy2]?.[gx2]??0;
      if (type===5){
        const h=(gx2*17+gy2*31)%10;
        if (h<3)      trees.push({fx:gx2+.45,fy:gy2+.45});                                       // ~30% get one central tree
        else if (h<5) trees.push({fx:gx2+.18,fy:gy2+.22},{fx:gx2+.75,fy:gy2+.70});              // ~20% get two corner trees
        // remaining ~50% stay open — plaza / lawn
      } else if (type===1){
        const h=(gx2*7+gy2*13)%23;
        if (h<2) trees.push({fx:gx2+.08,fy:gy2+.08});
      }
    }

    const busStops=[
      {fx:4.78,fy:2.82},{fx:5.18,fy:2.82},
      {fx:9.78,fy:2.82},{fx:10.18,fy:2.82},
      {fx:4.78,fy:6.82},{fx:5.18,fy:6.82},
      {fx:9.78,fy:6.82},{fx:10.18,fy:6.82},
    ];

    function computeLayout(){
      PW=Math.floor(W/SCALE); PH=Math.floor(H/SCALE);
      // Size tiles so the diamond OVERFLOWS the canvas on all sides — no background visible
      // Base: fill width. Then scale up until the diamond also overflows height.
      const twBase=Math.ceil(2*PW/(COLS+ROWS));
      const twNeedH=Math.ceil(PH/((COLS+ROWS)*0.21)); // ensures bottom vertex past PH
      tw=Math.max(twBase,twNeedH,20);
      // Add extra overflow margin so corners are always covered
      tw=Math.round(tw*1.5);
      th=Math.round(tw*.42); fh=Math.round(tw*.30);
      // Center the grid on screen so overflow is even on all sides
      ox=Math.round(PW*0.5-(COLS-ROWS)*tw*0.25);
      oy=Math.round(PH*0.5-(COLS+ROWS)*th*0.25+fh*2);
    }

    function resize(){
      W=parent.offsetWidth;H=parent.offsetHeight;
      canvas.width=Math.floor(W/SCALE);canvas.height=Math.floor(H/SCALE);
      canvas.style.width=W+'px';canvas.style.height=H+'px';
      canvas.style.imageRendering='pixelated';
      ctx.imageSmoothingEnabled=false;
      computeLayout();
    }
    resize();

    let frame=0,rafId;

    function render(){
      const {peds,cars}=stateRef.current;
      updatePeds(peds);updateCars(cars);
      ctx.clearRect(0,0,PW,PH);

      // Background — midnight navy
      ctx.fillStyle='#141450';ctx.fillRect(0,0,PW,PH);

      // ── Moon — top-right corner ──────────────────────────────────
      {
        const mr  = Math.round(Math.min(PW, PH) * 0.038); // moon radius
        const mx  = PW - mr * 2.6;
        const my  = mr * 2.2;
        // Soft outer glow
        const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.6);
        moonGlow.addColorStop(0,   'rgba(220,215,180,0.18)');
        moonGlow.addColorStop(0.5, 'rgba(200,195,160,0.07)');
        moonGlow.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 2.6, 0, Math.PI * 2);
        ctx.fill();
        // Moon disc
        const moonDisc = ctx.createRadialGradient(mx - mr*0.18, my - mr*0.18, mr*0.1, mx, my, mr);
        moonDisc.addColorStop(0,   '#F5F0D8');
        moonDisc.addColorStop(0.6, '#E8E0C0');
        moonDisc.addColorStop(1,   '#C8BFA0');
        ctx.fillStyle = moonDisc;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
        // Crescent shadow — offset circle punched out with destination-out
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.arc(mx + mr * 0.42, my - mr * 0.12, mr * 0.82, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // Subtle craters
        ctx.fillStyle = 'rgba(180,170,140,0.30)';
        ctx.beginPath(); ctx.arc(mx - mr*0.28, my + mr*0.18, mr*0.13, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx - mr*0.52, my - mr*0.12, mr*0.08, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx - mr*0.18, my + mr*0.42, mr*0.07, 0, Math.PI*2); ctx.fill();
      }

      // Depth-sorted tile pass — extend beyond grid to fill canvas corners
      const order=[];
      const buf=Math.ceil(Math.max(COLS,ROWS)*1.5)+4;
      for(let gy2=-buf;gy2<ROWS+buf;gy2++) for(let gx2=-buf;gx2<COLS+buf;gx2++){
        const sx=Math.round(ox+(gx2-gy2)*tw*0.5);
        const sy=Math.round(oy+(gx2+gy2)*th*0.5);
        if(sx>-tw*2&&sx<PW+tw*2&&sy>-fh*10&&sy<PH+th*2)
          order.push({gx:gx2,gy:gy2,d:gx2+gy2});
      }
      // Insert peds and cars into the depth-sorted order by their actual grid position
      peds.forEach(p=>{
        const px=p.road==='h'?p.offset:p.roadPos+p.lane;
        const py=p.road==='h'?p.roadPos+p.lane:p.offset;
        // Bias depth back by 0.5 — ensures peds always sort behind buildings
        // at the same grid row, preventing overlap when lane puts them near a building edge
        order.push({kind:'ped',ped:p,px,py,d:px+py-0.5});
      });
      allCars.forEach(c=>{
        const cx=c.road==='h'?c.offset:c.roadPos+(c.dir>0?.27:.63);
        const cy=c.road==='h'?c.roadPos+(c.dir>0?.27:.63):c.offset;
        order.push({kind:'car',car:c,cx,cy,d:cx+cy-0.5});
      });

      order.sort((a,b)=>a.d-b.d);

      const bldMap={};(buildings||[]).forEach(b=>{bldMap[`${b.gx},${b.gy}`]=b;});

      order.forEach(item=>{
        // ── Pedestrian ──
        if(item.kind==='ped'){
          const p=item.ped;
          const pos=iso(item.px,item.py,.1,tw,th,fh,ox,oy);
          p.sx=pos.x;p.sy=pos.y;
          drawPedestrian(ctx,pos.x,pos.y,Math.max(5,Math.round(tw*.16)),frame,p.phase,selectedRef.current?.id===p.id,p.clothesIdx,p.hairIdx,p.hasUmbrella);
          return;
        }
        // ── Car ──
        if(item.kind==='car'){
          const c=item.car;
          const pos=iso(item.cx,item.cy,.22,tw,th,fh,ox,oy);
          drawCar(ctx,pos.x,pos.y,c.road,c.color,tw,th);
          return;
        }

        // ── Tile ──
        const {gx,gy}=item;
        const type=GRID[gy]?.[gx]??0;
        const zone=zoneOf(gx,gy);
        drawGround(ctx,gx,gy,type,tw,th,fh,ox,oy,frame);
        if (type===4) drawStreetlight(ctx,gx,gy,tw,th,fh,ox,oy,frame);

        if (type===5){
          const key=`${gx},${gy}`;
          if (key==='1,1'||key==='6,5'||key==='8,9') drawFountain(ctx,gx,gy,tw,th,fh,ox,oy,frame);
          if (key==='14,9') drawGrandFountain(ctx,gx,gy,tw,th,fh,ox,oy,frame);
          if (key==='7,1'||key==='2,6'){ drawBench(ctx,gx+.3,gy+.55,tw,th,fh,ox,oy); drawBench(ctx,gx+.65,gy+.72,tw,th,fh,ox,oy); }
          if (key==='13,1'||key==='12,10') drawBench(ctx,gx+.72,gy+.62,tw,th,fh,ox,oy);
        }

        const bld=bldMap[`${gx},${gy}`];
        if (type===1 && !bld){
          const fb=fillerBldMap[`${gx},${gy}`];
          const ff=((gx*7+gy*13)%4)+2;
          const fHov=fb&&(selectedRef.current?.id===fb.id||hoveredRef.current?.id===fb.id);
          drawBuilding(ctx,gx,gy,ff,zone,fillerWinMaps[`${gx},${gy}`]||{},false,tw,th,fh,ox,oy,frame,fHov,fb?.label||null);
        }
        if (bld?.active&&(zone===ZONES_LIST[1]||zone===ZONES_LIST[5])) drawTableChair(ctx,gx,gy,tw,th,fh,ox,oy,zone);
        if (bld?.active&&(zone===ZONES_LIST[3])&&bld.floors>=3)       drawMarketStall(ctx,gx,gy,tw,th,fh,ox,oy,zone);
        if (bld&&bld.floors>0) drawBuilding(ctx,gx,gy,bld.floors,zone,winMaps[bld.id]||{},bld.active,tw,th,fh,ox,oy,frame,selectedRef.current?.id===bld.id||hoveredRef.current?.id===bld.id,bld.label);

        trees.filter(t=>Math.floor(t.fx)===gx&&Math.floor(t.fy)===gy)
             .forEach(t=>drawTree(ctx,t.fx,t.fy,tw,th,fh,ox,oy,frame));
        busStops.filter(b=>Math.floor(b.fx)===gx&&Math.floor(b.fy)===gy)
                .forEach(b=>drawBusStop(ctx,b.fx,b.fy,tw,th,fh,ox,oy,frame));
      });

      // Rain
      ctx.strokeStyle='rgba(180,165,140,.25)';ctx.lineWidth=1;
      rain.forEach(r=>{
        r.y+=r.speed/PH;r.x+=r.speed*.18/PW;
        if (r.y>1){r.y-=1;r.x=Math.random();}if (r.x>1) r.x-=1;
        const rx=Math.round(r.x*PW),ry=Math.round(r.y*PH);
        ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx+1,ry+3);ctx.stroke();
      });

      // Hover tooltip
      const tgt=selectedRef.current||hoveredRef.current;
      if (tgt?.label){
        const lx=Math.round(tgt.labelX??PW/2), ly=Math.round(tgt.labelY??PH*.25);
        const nameFs=Math.max(5,Math.round(th*.20));   // name
        const ctxFs =Math.max(4,Math.round(th*.14));   // context — smaller
        const accent=tgt.glowColor||'#7898D8';
        const pad=9, gap=3;
        const hasStatus=!!tgt.statusLabel;

        // Measure both lines
        ctx.font=`${ctxFs}px "DM Sans","Inter",system-ui,sans-serif`;
        const w1=hasStatus?Math.ceil(ctx.measureText(tgt.statusLabel).width):0;
        ctx.font=`600 ${nameFs}px "DM Sans","Inter",system-ui,sans-serif`;
        const w2=Math.ceil(ctx.measureText(tgt.label).width);
        const boxW=Math.max(w1,w2)+pad*2;
        const boxH=(hasStatus?ctxFs+gap:0)+nameFs+pad*1.6;
        const bx=lx-Math.round(boxW/2), by=ly-Math.round(boxH)-8;

        // Background
        ctx.fillStyle='rgba(11,11,55,0.95)';
        ctx.beginPath();
        const r4=5;
        ctx.moveTo(bx+r4,by);ctx.lineTo(bx+boxW-r4,by);ctx.quadraticCurveTo(bx+boxW,by,bx+boxW,by+r4);
        ctx.lineTo(bx+boxW,by+boxH-r4);ctx.quadraticCurveTo(bx+boxW,by+boxH,bx+boxW-r4,by+boxH);
        ctx.lineTo(bx+r4,by+boxH);ctx.quadraticCurveTo(bx,by+boxH,bx,by+boxH-r4);
        ctx.lineTo(bx,by+r4);ctx.quadraticCurveTo(bx,by,bx+r4,by);
        ctx.closePath();ctx.fill();

        // Accent left border
        ctx.fillStyle=accent+'AA';
        ctx.fillRect(bx,by+r4,2,boxH-r4*2);

        ctx.textAlign='center';ctx.textBaseline='top';
        let ty=by+pad*.8;

        // Context line — small, muted (e.g. "GitHub repo · last commit 3d ago")
        if (hasStatus){
          ctx.font=`${ctxFs}px "DM Sans","Inter",system-ui,sans-serif`;
          ctx.fillStyle=accent+'AA';
          ctx.fillText(tgt.statusLabel,lx,ty);
          ty+=ctxFs+gap;
        }

        // Name — big, bright (e.g. "my-project")
        ctx.font=`600 ${nameFs}px "DM Sans","Inter",system-ui,sans-serif`;
        ctx.fillStyle='#EEF2FF';
        ctx.fillText(tgt.label,lx,ty);

        ctx.textBaseline='alphabetic';ctx.textAlign='left';
      }

      // Vignette
      const vg=ctx.createRadialGradient(PW/2,PH*.55,PH*.08,PW/2,PH*.55,PH*.74);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(14,14,60,.50)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,PW,PH);

      frame++;
    }

    function loop(){render();rafId=requestAnimationFrame(loop);}
    rafId=requestAnimationFrame(loop);

    function toXY(e){const r=canvas.getBoundingClientRect();return[Math.round((e.clientX-r.left)/SCALE),Math.round((e.clientY-r.top)/SCALE)];}
    function hitAny(mx,my){
      // Only data buildings (with real user data) show tooltips; filler buildings are decorative
      return hitBuilding(buildings||[],mx,my,tw,th,fh,ox,oy)
          || hitPed(stateRef.current?.peds||[],mx,my);
    }
    function handleClick(e){
      const[mx,my]=toXY(e);
      const hit=hitAny(mx,my);
      selectedRef.current=hit?(selectedRef.current?.id===hit.id?null:{...hit,labelX:mx,labelY:my-16}):null;
      onClickRef.current?.(selectedRef.current);
    }
    function handleMouseMove(e){
      const[mx,my]=toXY(e);
      const hit=hitAny(mx,my);
      hoveredRef.current=hit?{...hit,labelX:mx,labelY:my-16}:null;
      canvas.style.cursor=hit?'pointer':'default';
    }

    canvas.addEventListener('click',handleClick);
    canvas.addEventListener('mousemove',handleMouseMove);
    const ro=new ResizeObserver(resize);ro.observe(parent);
    return()=>{cancelAnimationFrame(rafId);canvas.removeEventListener('click',handleClick);canvas.removeEventListener('mousemove',handleMouseMove);ro.disconnect();};
  },[buildings,pedestrians,cars]);

  return <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%',imageRendering:'pixelated'}}/>;
}
