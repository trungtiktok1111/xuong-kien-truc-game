import * as THREE from 'three';
import {createLogic} from './logic.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GEO,MATS,mkTex,BASE_N} from './ed3d.js';
import {el} from './util.js';
import {entModel,defCfg3} from './ents3d.js';
import {parseGLB,unb64} from './models3d.js';
const SOLID={cube:1,slab:1,wedge:1,stairs:1,curve:1,pillar:1,panel:1,window:1,rail:1};
export function play3D(o){
  const CF=Object.assign(defCfg3(),o.cfg||{}),EN=o.ents||[],legacy=!EN.length;
  const V=new Map();for(const [k,s,m,r] of o.voxels)V.set(k,{s,m,r});
  const ov=el('div',{style:'position:fixed;inset:0;z-index:100;background:#9fd3f0;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden'});
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.domElement.style.cssText='width:100%;height:100%;display:block';ov.append(renderer.domElement);
  const jump=el('div',{style:'position:absolute;right:22px;bottom:calc(env(safe-area-inset-bottom) + 26px);width:84px;height:84px;border-radius:50%;background:#2c7be5cc;border:3px solid #fff8;color:#fff;font-size:34px;display:flex;align-items:center;justify-content:center'},'⤒');
  const hint=el('div',{style:'position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 40px);text-align:center;color:#fff;font:600 13px system-ui;text-shadow:0 1px 3px #000'},'Trái: đi · Phải: xoay camera · ⤒ nhảy');
  const atk=el('div',{style:'position:absolute;right:122px;bottom:calc(env(safe-area-inset-bottom) + 34px);width:70px;height:70px;border-radius:50%;background:#c0392bcc;border:3px solid #fff8;color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center'},'⚔');
  const hud=el('div',{style:'position:absolute;left:12px;top:calc(env(safe-area-inset-top) + 8px);color:#fff;font:700 18px system-ui;text-shadow:0 1px 3px #000'});
  const say=el('div',{style:'position:absolute;left:50%;top:22%;transform:translateX(-50%);max-width:80%;padding:10px 14px;border-radius:12px;background:#fffffff0;color:#222;font:600 15px system-ui;display:none;text-align:center'});
  const endm=el('div',{style:'position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#000a;color:#fff;font:700 28px system-ui;text-align:center'});
  ov.append(jump,hint);if(!legacy)ov.append(atk,hud,say,endm);if(o.onExit)ov.append(el('div',{style:'position:absolute;right:10px;top:calc(env(safe-area-inset-top) + 34px);padding:8px 14px;border-radius:16px;background:#263342cc;color:#fff;font:600 14px system-ui',onclick:()=>stop()},'✕ Thoát'));
  document.body.append(ov);if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fd3f0);scene.fog=new THREE.Fog(0x9fd3f0,40,110);
  scene.add(new THREE.AmbientLight(0xffffff,.85));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(10,18,8);scene.add(dl);
  const cam=new THREE.PerspectiveCamera(60,1,.1,200);
  const floorM=new THREE.Mesh(new THREE.PlaneGeometry(240,240).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x6aa84a}));{const g=o.grid||[48,24,48];floorM.position.set(g[0]/2,-.01,g[2]/2);}scene.add(floorM);
  // vật liệu
  const mats=[];for(let i=0;i<BASE_N;i++){const d=MATS[i],t=mkTex(d);mats.push(new THREE.MeshLambertMaterial({map:t.tex,transparent:!!d.t,side:d.t?THREE.DoubleSide:THREE.FrontSide}));}
  const loads=(o.cmats||[]).map(c=>new Promise(res=>{const im=new Image();im.onload=()=>{const t=new THREE.Texture(im);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;mats.push(new THREE.MeshLambertMaterial({map:t,transparent:true,alphaTest:.5,side:THREE.DoubleSide}));res();};im.onerror=()=>{mats.push(new THREE.MeshLambertMaterial({color:0x888888}));res();};im.src=c.url;}));
  const SH=['cube','slab','wedge','pillar','panel','stairs','arch','window','rail','curve'];
  let raf,stopped=false,ready=false;
  const PB=[];
  async function loadProps(){const cache={};for(const p of (o.props||[])){const pm=(o.pmodels||{})[p.m];if(!pm)continue;try{let obj=cache[p.m];if(!obj)obj=cache[p.m]=await parseGLB(unb64(pm.glb),(o.ptex||{})[pm.pack]||{});const g=obj.clone(true);g.position.set(p.x,p.y,p.z);g.rotation.y=p.ry||0;g.scale.setScalar(p.s||1);scene.add(g);
      if(p.solid){g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);PB.push({x0:b.min.x,x1:b.max.x,z0:b.min.z,z1:b.max.z,y0:b.min.y,y1:b.max.y});}}catch(e){}}}
  Promise.all(loads).then(async()=>{
    const groups=new Map(),tmp=new THREE.Object3D();
    for(const [k,v] of V){const [x,y,z]=k.split(',').map(Number);const base=GEO[v.s];if(!base)continue;const g=base.index?base.toNonIndexed():base.clone();tmp.position.set(x+.5,y+.5,z+.5);tmp.rotation.set(0,v.r*Math.PI/2,0);tmp.updateMatrix();g.applyMatrix4(tmp.matrix);
      if(!g.attributes.normal)g.computeVertexNormals();if(!groups.has(v.m))groups.set(v.m,[]);groups.get(v.m).push(g);}
    for(const [m,arr] of groups){const mg=mergeGeometries(arr);if(mg)scene.add(new THREE.Mesh(mg,mats[m]||mats[0]));}
    await loadProps();ready=true;});
  // người chơi
  const av=new THREE.Group();const cm=new THREE.MeshLambertMaterial({color:0x2d5fa8}),sk=new THREE.MeshLambertMaterial({color:0xf0c8a0}),dk=new THREE.MeshLambertMaterial({color:0x222733});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.75,.3),cm);body.position.y=.95;const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),sk);head.position.y=1.55;const hat=new THREE.Mesh(new THREE.ConeGeometry(.3,.28,14),dk);hat.position.y=1.85;
  const legL=new THREE.Mesh(new THREE.BoxGeometry(.18,.55,.2),dk),legR=legL.clone();legL.position.set(-.13,.3,0);legR.position.set(.13,.3,0);av.add(body,head,hat,legL,legR);scene.add(av);
  // vật lý
  const vox=(x,y,z)=>V.get(x+','+y+','+z);
  function topAt(v,fx,fz){const s=v.s;if(s==='arch')return -1;if(s==='slab')return .5;if(s==='wedge'||s==='stairs'||s==='curve'){const th=v.r*Math.PI/2,lx=fx-.5,lz=fz-.5,c=Math.cos(th),sn=Math.sin(th);const lz2=lx*sn+lz*c;const t=Math.min(1,Math.max(0,.5-lz2));return s==='wedge'?t:s==='curve'?t*t:Math.min(1,Math.floor(t*4)/4+.25);}return SOLID[s]?1:-1;}
  function ground(x,z,y,step){const cx=Math.floor(x),cz=Math.floor(z);for(let cy=Math.min(((o.grid&&o.grid[1])||24)-1,Math.floor(y+step));cy>=0;cy--){const v=vox(cx,cy,cz);if(!v)continue;const h=topAt(v,x-cx,z-cz);if(h>=0)return cy+h;}return 0;}
  function okAt(x,z,y){const R=.25;for(const b of PB)if(x>b.x0-R&&x<b.x1+R&&z>b.z0-R&&z<b.z1+R&&y<b.y1-.2&&y+1.6>b.y0)return false;for(const [a,b] of [[-R,-R],[R,-R],[-R,R],[R,R],[0,0]]){const px=x+a,pz=z+b,g=ground(px,pz,y,.55);if(g>y+.56)return false;const y0=Math.max(g,y),cx=Math.floor(px),cz=Math.floor(pz);
      for(let cy=Math.floor(y0+.05);cy<=Math.floor(y0+1.7)&&cy<((o.grid&&o.grid[1])||24);cy++){const v=vox(cx,cy,cz);if(!v)continue;const h=topAt(v,px-cx,pz-cz);if(h>=0&&cy+h>y0+.05)return false;}}return true;}
  const P={x:12.5,y:0,z:23.5,vy:0,gr:true,face:0,hp:CF.hp,inv:0};P.y=ground(P.x,P.z,5,.55);const st0=EN.find(e=>e.t==='start');if(st0){P.x=st0.x+.5;P.z=st0.z+.5;P.y=Math.max(st0.y,ground(P.x,P.z,st0.y+.6,.55));}
  let yaw=0,pitch=.35,dist=6.5,keys={},stick=null,look=null,last=0,walk=0;
  function resize(){const w=ov.clientWidth,h=ov.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}

  // ---- gameplay (nhiệm vụ cơ bản) ----
  let L,HID=new Map(),E3=[],NP3=[],CH3=[],GL3=null,score=0,over=false,said=0,winMode='kill',atkCD=0;
  function msg(t,sec){say.textContent=t;say.style.display='block';said=sec;}
  function clearEnts(){for(const a of [E3,NP3,CH3])for(const x of a)scene.remove(x.g);if(GL3)scene.remove(GL3.g);E3=[];NP3=[];CH3=[];GL3=null;}
  const arr3=k=>k==='E'?E3:k==='NP'?NP3:CH3;
  const host3={say:(t,s)=>msg(t,s||3),heal:n=>{P.hp=Math.min(CF.hp,P.hp+n);},hurt:n=>{P.hp-=n;if(P.hp<=0)fin(false);},win:()=>fin(true),lose:()=>fin(false),
    setHidden:(id,h)=>{if(h){for(const k of ['E','NP','CH']){const a=arr3(k),i=a.findIndex(o=>o.id===id);if(i>=0){const b=a.splice(i,1)[0];scene.remove(b.g);HID.set(id,{k,b});return;}}if(GL3&&GL3.id===id){scene.remove(GL3.g);HID.set(id,{k:'GL',b:GL3});GL3=null;}}
      else{const m=HID.get(id);if(!m)return;HID.delete(id);scene.add(m.b.g);if(m.k==='GL')GL3=m.b;else arr3(m.k).push(m.b);}}};
  const hidEn3=()=>[...HID.values()].some(m=>m.k==='E');
  function add3(k,b){if(b.e.hid){HID.set(b.id,{k,b});return;}scene.add(b.g);if(k==='GL')GL3=b;else arr3(k).push(b);}
  function setup(){clearEnts();HID=new Map();ov.querySelectorAll('.dlgbox').forEach(x=>x.remove());if(L&&L.hud)L.hud.remove();L=createLogic(CF,EN,host3,ov);score=0;over=false;endm.style.display='none';say.style.display='none';
    const s=EN.find(e=>e.t==='start');if(s){P.x=s.x+.5;P.z=s.z+.5;P.y=Math.max(s.y,ground(P.x,P.z,s.y+.6,.55));}P.hp=CF.hp;P.inv=0;P.vy=0;P.gr=true;
    for(const e of EN){if(e.t==='start')continue;const g=entModel(e);g.position.set(e.x+.5,e.y,e.z+.5);const b={id:e.id,e,g,x:e.x+.5,y:e.y,z:e.z+.5};
      if(e.t==='enemy')add3('E',Object.assign(b,{hp:e.hp||2,mhp:e.hp||2,dmg:e.dmg==null?1:e.dmg,spd:e.spd||1.8,ch:e.chase||7,ai:e.ai||'wander',dx:0,dz:0,wt:0,fl:0}));
      else if(e.t==='npc')add3('NP',b);else if(e.t==='chest')add3('CH',Object.assign(b,{open:0}));else if(e.t==='goal')add3('GL',b);}
    const hasGoal=EN.some(e=>e.t==='goal'),hasEn=EN.some(e=>e.t==='enemy');winMode=CF.win==='auto'?(hasGoal?(hasEn?'both':'goal'):'kill'):CF.win;if(winMode!=='kill'&&!hasGoal)winMode='kill';L.fire('start');}
  function fin(win){over=true;endm.textContent='';endm.append(el('div',{},win?'🏆 Chiến thắng!':'💀 Thất bại'),el('div',{style:'padding:12px 22px;border-radius:20px;background:#e0b050;color:#2a1a08;font-size:18px',onclick:setup},'Chơi lại'));endm.style.display='flex';}
  function attack(){if(over||atkCD>0||L.dlgOpen)return;for(const n of NP3){if(Math.hypot(n.x-P.x,n.z-P.z)<2.2){atkCD=.3;if(!L.talk({name:n.e.name,dlg:n.e.dlg}))msg((n.e.name||'')+': '+(n.e.text||'...'),4);L.fire('talk',n.id);return;}}
    atkCD=.4;const fx=Math.sin(P.face),fz=Math.cos(P.face);
    for(const e of E3){const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d<CF.rng&&Math.abs(e.y-P.y)<2&&(d<.5||(dx*fx+dz*fz)/d>-.2)){e.hp-=CF.dmg;e.fl=.2;const k=d||1;const nx=e.x+dx/k*.8,nz=e.z+dz/k*.8;if(okAt(nx,nz,e.y)){e.x=nx;e.z=nz;}}}
    const dead=E3.filter(e=>e.hp<=0);for(const e of dead)scene.remove(e.g);E3=E3.filter(e=>e.hp>0);for(const k of dead)L.fire('kill',k.id);if(dead.length&&!E3.length&&!hidEn3())L.fire('allkill');
    if(!over&&winMode==='kill'&&!E3.length&&!hidEn3()&&EN.some(e=>e.t==='enemy'))fin(true);}
  function gp(dt){if(legacy||over)return;atkCD-=dt;P.inv-=dt;av.visible=!(P.inv>0&&Math.floor(P.inv*14)%2);
    if(said>0){said-=dt;if(said<=0)say.style.display='none';}
    for(const e of E3){e.fl-=dt;const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz);let mx=0,mz=0;
      if(e.ai==='chase'||(e.ai!=='still'&&d<e.ch&&Math.abs(P.y-e.y)<4)){mx=dx/d*e.spd*dt;mz=dz/d*e.spd*dt;e.g.rotation.y=Math.atan2(dx,dz);}
      else if(e.ai!=='still'){e.wt-=dt;if(e.wt<=0){e.wt=1+Math.random()*1.5;const a=Math.random()*6.28;e.dx=Math.random()<.4?0:Math.cos(a);e.dz=e.dx?Math.sin(a):0;}mx=e.dx*e.spd*.5*dt;mz=e.dz*e.spd*.5*dt;}
      if(mx&&okAt(e.x+mx,e.z,e.y))e.x+=mx;if(mz&&okAt(e.x,e.z+mz,e.y))e.z+=mz;
      const g=ground(e.x,e.z,e.y,.55);if(g<=e.y+.6)e.y=g;e.g.position.set(e.x,e.y,e.z);e.g.scale.setScalar(e.fl>0?1.18:1);
      if(d<.85&&Math.abs(P.y-e.y)<1.5&&P.inv<=0){P.hp-=e.dmg;P.inv=1;P.vy=Math.max(P.vy,4);P.gr=false;const k=d||1;const nx=P.x-dx/k*.8,nz=P.z-dz/k*.8;if(okAt(nx,nz,P.y)){P.x=nx;P.z=nz;}if(P.hp<=0){fin(false);return;}}}
    for(const c of CH3)if(!c.open&&Math.hypot(c.x-P.x,c.z-P.z)<1.1&&Math.abs(c.y-P.y)<1.6){c.open=1;L.fire('chest',c.id);if(c.g.userData.lid)c.g.userData.lid.rotation.x=-1;if(c.e.gives==='hp')P.hp=Math.min(CF.hp,P.hp+(c.e.amt||1));else score+=c.e.amt||1;msg('Rương: '+(c.e.gives==='hp'?'+':'+')+(c.e.amt||1)+(c.e.gives==='hp'?' máu':' điểm'),2);}
    if(GL3){GL3.g.rotation.y+=dt*2;const nr=Math.hypot(GL3.x-P.x,GL3.z-P.z)<1&&Math.abs(GL3.y-P.y)<1.8;if(!nr)GL3.hit=0;if(nr){if(!GL3.hit){GL3.hit=1;L.fire('goal');if(over||!GL3)return;}if(winMode==='goal'||(winMode==='both'&&!E3.length&&!hidEn3()))fin(true);else if(winMode==='both')msg('Còn quái chưa diệt!',1.2);}}
    hud.textContent=(CF.hp>10?'❤️×'+Math.max(0,P.hp):'❤️'.repeat(Math.max(0,P.hp)))+'   👾 '+E3.length+(score?'   ⭐'+score:'');}
  atk.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();attack();});
  if(!legacy)setup();
  function upd(dt){
    let ix=0,iy=0;if(keys.a||keys.ArrowLeft)ix--;if(keys.d||keys.ArrowRight)ix++;if(keys.w||keys.ArrowUp)iy--;if(keys.s||keys.ArrowDown)iy++;if(stick){ix=stick.x;iy=stick.y;}
    const m=Math.hypot(ix,iy);let mv=0;
    if(m>.12){ix/=Math.max(m,1);iy/=Math.max(m,1);const sp=CF.spd,fwx=-Math.sin(yaw),fwz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
      const dx=(rx*ix-fwx*iy)*sp*dt,dz=(rz*ix-fwz*iy)*sp*dt;if(okAt(P.x+dx,P.z,P.y))P.x+=dx;if(okAt(P.x,P.z+dz,P.y))P.z+=dz;P.face=Math.atan2(dx,dz);mv=1;}
    P.x=Math.max(-10,Math.min(34,P.x));P.z=Math.max(-10,Math.min(34,P.z));
    const g=ground(P.x,P.z,P.y,.55);
    if(P.gr){if(g>=P.y-.4)P.y=g;else P.gr=false;}
    if(!P.gr){P.vy-=22*dt;P.y+=P.vy*dt;if(P.y<=g&&P.vy<=0){P.y=g;P.vy=0;P.gr=true;}}
    gp(dt);
    walk+=mv*dt*9;legL.rotation.x=Math.sin(walk)*.7*mv;legR.rotation.x=-Math.sin(walk)*.7*mv;
    av.position.set(P.x,P.y,P.z);let d=P.face-av.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));av.rotation.y+=d*Math.min(1,dt*12);
    const tx=P.x,ty=P.y+1.3,tz=P.z;cam.position.set(tx+Math.sin(yaw)*Math.cos(pitch)*dist,ty+Math.sin(pitch)*dist,tz+Math.cos(yaw)*Math.cos(pitch)*dist);cam.lookAt(tx,ty,tz);
  }
  function doJump(){if(P.gr){P.vy=CF.jump;P.gr=false;}}
  function loop(ts){if(stopped)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;if(ready&&!(L&&L.dlgOpen))upd(dt);renderer.render(scene,cam);raf=requestAnimationFrame(loop);}
  const kd=e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=1;if(k===' '){doJump();e.preventDefault();}if(k==='f'||k==='j'||k==='Enter'){attack();e.preventDefault();}if(k.startsWith('Arrow'))e.preventDefault();},ku=e=>{keys[e.key.length===1?e.key.toLowerCase():e.key]=0;};
  addEventListener('keydown',kd);addEventListener('keyup',ku);addEventListener('resize',resize);
  jump.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();doJump();});
  const cvs=renderer.domElement;
  cvs.addEventListener('pointerdown',e=>{cvs.setPointerCapture(e.pointerId);if(e.clientX<innerWidth*.5&&e.pointerType!=='mouse'&&!stick)stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0};else if(!look)look={id:e.pointerId,x:e.clientX,y:e.clientY};});
  cvs.addEventListener('pointermove',e=>{if(stick&&e.pointerId===stick.id){let dx=e.clientX-stick.ox,dy=e.clientY-stick.oy;const d=Math.hypot(dx,dy),mx=44;if(d>mx){dx*=mx/d;dy*=mx/d;}stick.x=dx/mx;stick.y=dy/mx;}
    else if(look&&e.pointerId===look.id){yaw-=(e.clientX-look.x)*.006;pitch=Math.max(-.2,Math.min(1.2,pitch+(e.clientY-look.y)*.005));look.x=e.clientX;look.y=e.clientY;}});
  const up=e=>{if(stick&&e.pointerId===stick.id)stick=null;if(look&&e.pointerId===look.id)look=null;};cvs.addEventListener('pointerup',up);cvs.addEventListener('pointercancel',up);
  cvs.addEventListener('wheel',e=>{dist=Math.max(3,Math.min(14,dist+e.deltaY*.01));e.preventDefault();},{passive:false});
  function stop(){stopped=true;cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('resize',resize);renderer.dispose();ov.remove();o.onExit&&o.onExit();}
  resize();raf=requestAnimationFrame(loop);return {stop};
}
