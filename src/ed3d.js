import {WALL_MIN_THICKNESS,WALL_MAX_THICKNESS} from './wall2d.js';
import {validOutline} from './outlineEditor.js';
import {outlineMesh3D,disposeOutlineMesh,fitGate3D,outlineMarkers} from './outline3d.js';
import {guideFor} from './editorHelp.js';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {logicTab,entExtra} from './logic.js';
import {parseGLB,scanZip,b64} from './models3d.js';
import {OT3,COLS,defCfg3,newEnt3,entModel} from './ents3d.js';
import {expandPacks,packBytes,idbDel,$,el,toast,saveFile,lsGet,lsSet,pickFile,pickFiles,idbSet,idbGet,ask,askText,yes,zipBrowser,slotsUI,exportGame,fetchBin} from './util.js';
let GX=48,GZ=48,GY=24;
import {makeTpl} from './tpl3d.js';
import {ZK,isBox,isPts,mkBox as zMkBox,mkPts,zHit,zPts,zCenter,zBounds,zMove,zScale,zRotate,zClone,zHandles,zDragHandle} from './zones.js';
const SHAPES=[['cube','Khối'],['slab','Tấm nửa'],['wedge','Mái dốc'],['pillar','Cột'],['panel','Vách mỏng'],['stairs','Cầu thang'],['arch','Cổng vòm'],['window','Khung cửa sổ'],['rail','Lan can'],['curve','Mái cong']];
// ===== vật liệu =====
function rng(s){let a=s;return()=>{a=(a*1664525+1013904223)%4294967296;return a/4294967296;};}
export function mkTex(def){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');const r=rng(def.seed||7);
  g.fillStyle=def.c;g.fillRect(0,0,32,32);const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  const sh=(hex,k)=>{const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return 'rgb('+f(n>>16)+','+f((n>>8)&255)+','+f(n&255)+')';};
  if(def.p==='plank'){for(let y=0;y<32;y+=8){px(0,y,32,1,sh(def.c,.7));for(let i=0;i<5;i++)px(Math.floor(r()*30),y+1+Math.floor(r()*6),2+Math.floor(r()*4),1,sh(def.c,.85));}}
  else if(def.p==='brick'){for(let y=0;y<32;y+=8){px(0,y,32,1,sh(def.c,.62));const o=(y/8)%2?8:0;for(let x=o;x<32;x+=16)px(x,y,1,8,sh(def.c,.62));}for(let i=0;i<40;i++)px(Math.floor(r()*32),Math.floor(r()*32),1,1,sh(def.c,.85+r()*.3));}
  else if(def.p==='roof'){for(let y=0;y<32;y+=8){for(let x=0;x<32;x+=8){px(x,y+6,8,2,sh(def.c,.62));px(x+((y/8)%2?4:0)%8,y,1,8,sh(def.c,.7));}px(0,y,32,1,sh(def.c,1.15));}}
  else if(def.p==='noise'){for(let i=0;i<120;i++)px(Math.floor(r()*32),Math.floor(r()*32),1+Math.floor(r()*2),1,sh(def.c,.8+r()*.4));}
  else if(def.p==='stone'){for(let i=0;i<30;i++)px(Math.floor(r()*28),Math.floor(r()*28),3+Math.floor(r()*4),3+Math.floor(r()*4),sh(def.c,.85+r()*.3));px(0,0,32,1,sh(def.c,.7));px(0,0,1,32,sh(def.c,.7));}
  else if(def.p==='lacquer'){for(let x=0;x<32;x+=2)px(x,0,1,32,sh(def.c,.9+((x/2)%3)*.05));px(0,0,32,2,sh(def.c,.7));px(0,30,32,2,sh(def.c,.7));}
  else if(def.p==='paper'){g.clearRect(0,0,32,32);g.fillStyle='rgba(247,238,205,.92)';g.fillRect(0,0,32,32);g.fillStyle='#6b4a2a';for(let i=0;i<=32;i+=8){g.fillRect(i===32?30:i,0,2,32);g.fillRect(0,i===32?30:i,32,2);}}
  else if(def.p==='glass'){g.clearRect(0,0,32,32);g.fillStyle='rgba(190,230,245,.45)';g.fillRect(0,0,32,32);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(3,3,8,2);g.fillRect(3,3,2,8);}
  else if(def.p==='water'){g.clearRect(0,0,32,32);g.fillStyle='rgba(58,143,208,.65)';g.fillRect(0,0,32,32);g.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<6;i++)g.fillRect(Math.floor(r()*26),Math.floor(r()*30),6,1);}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;return {tex:t,url:c.toDataURL()};}
export const MATS=[
 {n:'Gỗ',c:'#a06f3c',p:'plank'},{n:'Sơn mài đỏ',c:'#a8281c',p:'lacquer'},{n:'Đá xám',c:'#8d8f96',p:'stone'},{n:'Gạch xanh',c:'#6f8087',p:'brick'},
 {n:'Ngói xám',c:'#4b5158',p:'roof'},{n:'Ngói đỏ',c:'#b04a2e',p:'roof'},{n:'Gỗ tối',c:'#5a3a22',p:'plank'},{n:'Tường trắng',c:'#ece5d2',p:'noise'},
 {n:'Giấy cửa',c:'#f5eccf',p:'paper',t:1},{n:'Cỏ',c:'#5fa03a',p:'noise'},{n:'Đất',c:'#7b5733',p:'noise'},{n:'Cát',c:'#d9c58b',p:'noise'},
 {n:'Nước',c:'#3a8fd0',p:'water',t:1},{n:'Kính',c:'#bfe3f2',p:'glass',t:1},{n:'Mái vàng',c:'#d4a62a',p:'roof'},{n:'Đen',c:'#25262b',p:'noise'}
].map((d,i)=>Object.assign(d,{seed:11+i*7}));
export const BASE_N=MATS.length;
// ===== hình học =====
function wedgeGeo(){const A=[-.5,-.5,-.5],B=[.5,-.5,-.5],C=[-.5,.5,-.5],D=[.5,.5,-.5],E=[-.5,-.5,.5],F=[.5,-.5,.5];
  const quad=(a,b,c,d,uv)=>[[a,b,c],[a,c,d]];const pos=[],uvs=[];
  const tri=(a,b,c,ua,ub,uc)=>{pos.push(...a,...b,...c);uvs.push(...ua,...ub,...uc);};
  tri(A,C,D,[0,0],[0,1],[1,1]);tri(A,D,B,[0,0],[1,1],[1,0]);               // lưng (z=-.5)
  tri(C,E,F,[0,1],[0,0],[1,0]);tri(C,F,D,[0,1],[1,0],[1,1]);               // mặt dốc
  tri(A,B,F,[0,0],[1,0],[1,1]);tri(A,F,E,[0,0],[1,1],[0,1]);               // đáy
  tri(A,E,C,[0,0],[1,0],[0,1]);                                            // trái
  tri(B,D,F,[1,0],[1,1],[0,0]);                                            // phải
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g;}

function boxUV(g){const p=g.attributes.position,n=g.attributes.normal,uv=[];for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;if(az>=ax&&az>=ay){u=p.getX(i);v=p.getY(i);}else if(ax>=ay){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getZ(i);}uv.push(u+.5,v+.5);}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;}
function extr(shape,depth){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:10});g.translate(0,0,-depth/2);return boxUV(g);}
function stairsGeo(){const a=[];for(let i=0;i<4;i++){const h=(i+1)/4;a.push(new THREE.BoxGeometry(1,h,.25).translate(0,-.5+h/2,.375-i*.25));}return mergeGeometries(a);}
function archGeo(){const s=new THREE.Shape();s.moveTo(-.5,-.5);s.lineTo(-.3,-.5);s.lineTo(-.3,.1);s.absarc(0,.1,.3,Math.PI,0,true);s.lineTo(.3,-.5);s.lineTo(.5,-.5);s.lineTo(.5,.5);s.lineTo(-.5,.5);s.closePath();return extr(s,.3);}
function windowGeo(){const s=new THREE.Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(.5,.5);s.lineTo(-.5,.5);s.closePath();const h=new THREE.Path();h.moveTo(-.25,-.2);h.lineTo(-.25,.3);h.lineTo(.25,.3);h.lineTo(.25,-.2);h.closePath();s.holes.push(h);return extr(s,.2);}
function railGeo(){const a=[new THREE.BoxGeometry(.1,.7,.1).translate(-.45,-.15,0),new THREE.BoxGeometry(.1,.7,.1).translate(.45,-.15,0),new THREE.BoxGeometry(1,.08,.1).translate(0,.15,0),new THREE.BoxGeometry(1,.06,.06).translate(0,-.15,0)];return mergeGeometries(a);}
function curveGeo(){const s=new THREE.Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);for(let i=10;i>=0;i--){const t=i/10;s.lineTo(t-.5,-.5+t*t);}s.closePath();const g=extr(s,1);g.rotateY(Math.PI/2);return g;}
export const GEO={cube:new THREE.BoxGeometry(1,1,1),slab:new THREE.BoxGeometry(1,.5,1).translate(0,-.25,0),wedge:wedgeGeo(),pillar:new THREE.BoxGeometry(.4,1,.4),panel:new THREE.BoxGeometry(1,1,.2).translate(0,0,.4),stairs:stairsGeo(),arch:archGeo(),window:windowGeo(),rail:railGeo(),curve:curveGeo()};
export function init3D(root){
  const cv=$('#cv3');const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setClearColor(0x16202b,1);
  const scene=new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff,.85));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(10,18,8);scene.add(dl);
  const mats=MATS.map(d=>{const t=mkTex(d);d.url=t.url;return new THREE.MeshLambertMaterial({map:t.tex,transparent:!!d.t,side:(d.t?THREE.DoubleSide:THREE.FrontSide)});});
  const wmats=mats; // dùng chung
  const dsMats=MATS.map((d,i)=>{const m=mats[i].clone();m.side=THREE.DoubleSide;return m;});
  const nBase=MATS.length;
  function addCustomMat(name,url,quiet){return new Promise(res=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,64,64);const u=c.toDataURL();const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;
    const d={n:name,url:u,custom:1,t:1};MATS.push(d);const m=new THREE.MeshLambertMaterial({map:t,transparent:true,alphaTest:.5,side:THREE.FrontSide});mats.push(m);const ds=m.clone();ds.side=THREE.DoubleSide;dsMats.push(ds);
    if(!quiet){const cl=MATS.slice(nBase).map(x=>({n:x.n,url:x.url}));lsSet('thk_cmats',cl);idbSet('thk_cmats3d',cl);}res(MATS.length-1);};im.onerror=()=>res(-1);im.src=url;});}
  async function addManyMats(items){if(!items.length)return;if(items.length>60&&!(await yes('Thêm '+items.length+' ảnh làm chất liệu?')))return;let n=0,last=-1;
    for(const it of items){const i=await addCustomMat(it.name.replace(/\.\w+$/,'').slice(0,14),it.url,true);if(i>=0){n++;last=i;}}
    {const cl=MATS.slice(BASE_N).map(x=>({n:x.n,url:x.url}));lsSet('thk_cmats',cl);idbSet('thk_cmats3d',cl);}if(last>=0){matI=last;mode='build';draw();}toast('Đã thêm '+n+' chất liệu (mỗi ảnh = 1 chất liệu, thu về 64×64)');}
  const upImgs=()=>pickFiles('image/*',items=>items.length===1?cellPicker(items[0].url,items[0].name):addManyMats(items),false);
  const upZip=()=>zipBrowser((u,n)=>cellPicker(u,n),addManyMats);
  function cellPicker(url,name){const im=new Image();im.onload=()=>{const ov=el('div',{style:'position:fixed;inset:0;z-index:50;background:#0d141bf2;display:flex;flex-direction:column;padding:10px;gap:8px'});
    const tw=el('input',{type:'number',value:'0',min:'0',style:'width:80px;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px'});
    const cv=document.createElement('canvas');const sc=Math.min(1,Math.min(innerWidth-20,700)/im.width);const k=Math.max(1,sc>=1?Math.floor(Math.min(innerWidth-20,700)/im.width):sc);
    let sel=null;const W=im.width*k,H=im.height*k;cv.width=W;cv.height=H;cv.style.cssText='max-width:100%;image-rendering:pixelated;background:#222;touch-action:manipulation';
    const wrap=el('div',{style:'flex:1;overflow:auto;background:#16202b;border-radius:8px;padding:4px'},cv);const info=el('div',{class:'hint'},'Ô = 0: dùng cả ảnh. Hoặc nhập kích thước ô (vd 16) rồi chạm 1 ô trên ảnh.');
    function rd(){const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,W,H);g.drawImage(im,0,0,W,H);const t=+tw.value;if(t>0){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1;for(let x=0;x<=im.width;x+=t){g.beginPath();g.moveTo(x*k+.5,0);g.lineTo(x*k+.5,H);g.stroke();}for(let y=0;y<=im.height;y+=t){g.beginPath();g.moveTo(0,y*k+.5);g.lineTo(W,y*k+.5);g.stroke();}if(sel){g.strokeStyle='#ffd24a';g.lineWidth=3;g.strokeRect(sel[0]*t*k+1,sel[1]*t*k+1,t*k-2,t*k-2);}}}
    tw.oninput=()=>{sel=null;rd();};
    cv.onclick=e=>{const t=+tw.value;if(t<=0)return;const r=cv.getBoundingClientRect();const x=(e.clientX-r.left)*W/r.width/k,y=(e.clientY-r.top)*H/r.height/k;sel=[Math.floor(x/t),Math.floor(y/t)];rd();};
    const ok=el('button',{class:'btn',style:'padding:12px',onclick:async()=>{const t=+tw.value;let src=url;if(t>0){if(!sel){toast('Chạm chọn 1 ô');return;}const c=document.createElement('canvas');c.width=c.height=t;c.getContext('2d').drawImage(im,sel[0]*t,sel[1]*t,t,t,0,0,t,t);src=c.toDataURL();}
      ov.remove();const i=await addCustomMat(name.replace(/\.\w+$/,'').slice(0,14),src);if(i>=0){matI=i;mode='build';draw();toast('Đã thêm chất liệu');}else toast('Ảnh lỗi');}},'✔ Thêm làm chất liệu');
    ov.append(el('div',{style:'display:flex;gap:8px;align-items:center'},el('span',{class:'lbl'},'Kích thước ô (px):'),tw),wrap,info,el('div',{style:'display:flex;gap:8px'},ok,el('button',{class:'btn',style:'padding:12px',onclick:()=>ov.remove()},'Đóng')));document.body.append(ov);rd();};im.src=url;}
  function gridGeo(){const pos=[],col=[],a=new THREE.Color(0x34485a),c=new THREE.Color(0x43596b);
    for(let x=0;x<=GX;x++){const cc=(x%8===0)?c:a;pos.push(x,0,0,x,0,GZ);col.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);}
    for(let z=0;z<=GZ;z++){const cc=(z%8===0)?c:a;pos.push(0,0,z,GX,0,z);col.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;}
  const grid=new THREE.LineSegments(gridGeo(),new THREE.LineBasicMaterial({vertexColors:true}));scene.add(grid);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(GX,GZ).rotateX(-Math.PI/2).translate(GX/2,0,GZ/2),new THREE.MeshBasicMaterial({color:0x223040,transparent:true,opacity:.0,visible:false}));scene.add(floor);
  const lvlPlane=new THREE.Mesh(new THREE.PlaneGeometry(GX,GZ).rotateX(-Math.PI/2).translate(GX/2,0,GZ/2),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.13,depthWrite:false}));scene.add(lvlPlane);
  function fitAll(){cam.tx=GX/2;cam.ty=2;cam.tz=GZ/2;cam.az=.785;cam.dist=Math.max(GX,GZ)*1.75;cam.el=1.0;}
  function gridExt(){let x=0,y=0,z=0;for(const k of V.keys()){const [a,b,c]=k.split(',').map(Number);if(a>x)x=a;if(b>y)y=b;if(c>z)z=c;}for(const p of props||[]){x=Math.max(x,Math.ceil(p.x));z=Math.max(z,Math.ceil(p.z));y=Math.max(y,Math.ceil(p.y||0));}for(const e of ents||[]){x=Math.max(x,e.x);z=Math.max(z,e.z);y=Math.max(y,e.y||0);}for(const q of cfg.zones||[]){const [, ,right,bottom]=zBounds(q);x=Math.max(x,Math.ceil(right)-1);z=Math.max(z,Math.ceil(bottom)-1);}return [x+1,y+1,z+1];}
  function setGrid(gx,gy,gz,force){const ext=force?[0,0,0]:gridExt();
    if(!force)for(const loop of cfg.outline?.loops||[])for(const [x,z] of loop){ext[0]=Math.max(ext[0],Math.ceil(x));ext[2]=Math.max(ext[2],Math.ceil(z));}
    gx=Math.max(ext[0],16,Math.min(320,Math.round(gx)||48));gz=Math.max(ext[2],16,Math.min(320,Math.round(gz)||48));gy=Math.max(ext[1],8,Math.min(128,Math.round(gy)||24));
    if(gx===GX&&gy===GY&&gz===GZ)return false;GX=gx;GY=gy;GZ=gz;grid.geometry.dispose();grid.geometry=gridGeo();
    for(const m of [floor,lvlPlane]){m.geometry.dispose();m.geometry=new THREE.PlaneGeometry(GX,GZ).rotateX(-Math.PI/2).translate(GX/2,0,GZ/2);}
    if(level>GY-1)level=GY-1;return true;}
  const ghost=new THREE.Mesh(GEO.cube,new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.45,depthWrite:false}));ghost.visible=false;scene.add(ghost);
  // camera
  const cam={az:.8,el:.62,dist:26,tx:GX/2,ty:3,tz:GZ/2,ortho:false};
  const pc=new THREE.PerspectiveCamera(45,1,.1,1500),oc=new THREE.OrthographicCamera(-10,10,10,-10,-1500,1500);let camera=pc;
  function updCam(){const w=cv.clientWidth,h=cv.clientHeight;pc.aspect=w/h;pc.updateProjectionMatrix();
    const d=cam.dist,ex=cam.tx+d*Math.cos(cam.el)*Math.sin(cam.az),ey=cam.ty+d*Math.sin(cam.el),ez=cam.tz+d*Math.cos(cam.el)*Math.cos(cam.az);
    camera=cam.ortho?oc:pc;camera.position.set(ex,ey,ez);camera.lookAt(cam.tx,cam.ty,cam.tz);
    if(cam.ortho){const hh=d*.45,ww=hh*w/h;oc.left=-ww;oc.right=ww;oc.top=hh;oc.bottom=-hh;oc.updateProjectionMatrix();}}
  // dữ liệu
  const V=new Map();const meshes=new Map();let shape='wedge',matI=5,rot=0,mode='sel',level=0,hideUp=false,undo=[],redo=[],tab='build';let ents=[],cfg=defCfg3(),selId=null,objType='enemy',ring=null;const eMesh=new Map();
  const key=(x,y,z)=>x+','+y+','+z;
  function matUse(){const c={};for(const v of V.values())c[v.m]=(c[v.m]||0)+1;return c;}
  async function deleteMats(set){const del=[...set].filter(i=>i>=BASE_N&&i<MATS.length);if(!del.length)return;const ds=new Set(del);const use=matUse();const hit=del.reduce((a,i)=>a+(use[i]||0),0);
    const old=[...V.entries()].map(([k,v])=>[k,v.s,v.m,v.r]);const mp=[];let n=0;for(let i=0;i<MATS.length;i++){if(ds.has(i))mp.push(-1);else mp.push(n++);}
    clearAll();for(const i of del.sort((a,b)=>b-a)){try{mats[i].map&&mats[i].map.dispose();}catch(e){}MATS.splice(i,1);mats.splice(i,1);dsMats.splice(i,1);}
    for(const [k,s,m,r] of old){const [x,y,z]=k.split(',').map(Number);const nm=mp[m]>=0?mp[m]:Math.min(5,MATS.length-1);setV(x,y,z,s,nm,r,true);}
    matI=mp[matI]>=0?mp[matI]:Math.min(5,MATS.length-1);undo=[];redo=[];refreshVis();
    const cl=MATS.slice(BASE_N).map(x=>({n:x.n,url:x.url}));lsSet('thk_cmats',cl);idbSet('thk_cmats3d',cl);changed();draw();toast('Đã xóa '+del.length+' chất liệu'+(hit?' ('+hit+' khối đang dùng được đổi sang chất liệu mặc định)':''));}
  function matMgr(){const sel=new Set();const ov=el('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:200;display:flex;align-items:center;justify-content:center'});
    const box=el('div',{style:'background:#17212b;border:1px solid #34485a;border-radius:12px;padding:12px;width:min(560px,94vw);max-height:88vh;display:flex;flex-direction:column;gap:8px;color:#cfd8e3'});
    const info=el('div',{class:'lbl'}),grid=el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px;overflow:auto;flex:1;min-height:120px'});
    const q=el('input',{class:'num',placeholder:'🔎 Lọc theo tên…',style:'width:100%'});
    const draw2=()=>{grid.textContent='';const f=q.value.trim().toLowerCase();const use=matUse();let nShow=0;for(let i=BASE_N;i<MATS.length;i++){const m=MATS[i];if(f&&!m.n.toLowerCase().includes(f))continue;nShow++;
      grid.append(el('button',{style:'background:#202c38;border:2px solid '+(sel.has(i)?'#ff6b6b':'transparent')+';border-radius:8px;padding:3px;color:#cfd8e3;font-size:10px;cursor:pointer;overflow:hidden',onclick:()=>{sel.has(i)?sel.delete(i):sel.add(i);draw2();}},el('img',{src:m.url,style:'width:100%;height:48px;object-fit:contain;display:block'}),el('div',{style:'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'},m.n+(use[i]?' •':''))));}
      info.textContent='Chất liệu nhập thêm: '+(MATS.length-BASE_N)+' · hiện '+nShow+' · đã chọn '+sel.size+' (• = đang dùng trong công trình)';};
    q.oninput=draw2;
    const shown=()=>{const f=q.value.trim().toLowerCase();const r=[];for(let i=BASE_N;i<MATS.length;i++)if(!f||MATS[i].n.toLowerCase().includes(f))r.push(i);return r;};
    box.append(el('div',{class:'lbl',style:'font-size:14px;color:#ffd24a'},'🗑 Quản lý chất liệu nhập thêm'),q,info,grid,
      el('div',{class:'row'},btn('Chọn tất cả (đang hiện)',()=>{shown().forEach(i=>sel.add(i));draw2();}),btn('Chọn tên Preview/Sample',()=>{for(let i=BASE_N;i<MATS.length;i++)if(/^(preview|sample)/i.test(MATS[i].n))sel.add(i);draw2();}),btn('Bỏ chọn',()=>{sel.clear();draw2();})),
      el('div',{class:'row'},btn('🗑 Xóa đã chọn',async()=>{if(!sel.size){toast('Chưa chọn chất liệu nào');return;}if(!(await yes('Xóa '+sel.size+' chất liệu đã chọn?')))return;await deleteMats(sel);sel.clear();draw2();},'on'),btn('Đóng',()=>ov.remove())));
    ov.append(box);document.body.append(ov);draw2();}
  const inb=(x,y,z)=>x>=0&&y>=0&&z>=0&&x<GX&&y<GY&&z<GZ;
  function snapV(){return [...V.entries()].map(([k,v])=>[k,v.s,v.m,v.r]);}
  function snap(){return {v:snapV(),ents:JSON.parse(JSON.stringify(ents)),cfg:Object.assign({},cfg),props:JSON.parse(JSON.stringify(props||[])),grid:[GX,GY,GZ]};}
  function load(a){if(!Array.isArray(a)&&a.grid)setGrid(a.grid[0],a.grid[1],a.grid[2],true);clearAll();const arr=Array.isArray(a)?a:(a.v||[]);if(Array.isArray(a)){ents=[];props=[];}else{ents=JSON.parse(JSON.stringify(a.ents||[]));cfg=Object.assign(defCfg3(),a.cfg||{});props=JSON.parse(JSON.stringify(a.props||[]));}selP=null;for(const [k,s,m,r] of arr){const [x,y,z]=k.split(',').map(Number);setV(x,y,z,s,m,r,true);}refreshVis();syncEnts();syncProps();}
  function pushUndo(){undo.push(snap());if(undo.length>60)undo.shift();redo=[];}
  const SCENE_KEY='thk_outline_scenes3d';
  let sceneId='original',sceneName='Cảnh 3D',otherScenes=[],readyToSave=false,outlineGroup=null,renderedOutline;
  let saveT;
  function changed(){clearTimeout(saveT);if(readyToSave)saveT=setTimeout(async()=>{
    const data=snap();
    if(!await idbSet(SCENE_KEY,{id:sceneId,name:sceneName,data,others:otherScenes})){
      lsSet('thk_proj3d',data);
      toast('Không lưu được danh sách màn 3D. Hãy xuất dự án để giữ bản dựng.');
    }
  },600);$('#cnt3')&&($('#cnt3').textContent=V.size+' khối');}
  function setV(x,y,z,s,m,r,quiet){if(!inb(x,y,z))return;const k=key(x,y,z);delV(x,y,z,true);V.set(k,{s,m,r});
    const me=new THREE.Mesh(GEO[s],MATS[m].t?dsMats[m]:mats[m]);me.position.set(x+.5,y+.5,z+.5);me.rotation.y=r*Math.PI/2;me.userData={x,y,z};scene.add(me);meshes.set(k,me);if(!quiet)changed();}
  function delV(x,y,z,quiet){const k=key(x,y,z);const me=meshes.get(k);if(me){scene.remove(me);meshes.delete(k);}V.delete(k);if(!quiet)changed();}
  function clearAll(){for(const me of meshes.values())scene.remove(me);meshes.clear();V.clear();}
  function syncOutline(){
    if(renderedOutline===cfg.outline)return;
    renderedOutline=cfg.outline;
    if(outlineGroup){scene.remove(outlineGroup);disposeOutlineMesh(outlineGroup);}
    outlineGroup=cfg.outline?.loops?.length?outlineMesh3D(cfg.outline):null;
    if(outlineGroup)scene.add(outlineGroup);
  }
  function refreshVis(){syncOutline();for(const [k,me] of meshes)me.visible=!hideUp||me.userData.y<=level;lvlPlane.position.y=level;lvlPlane.visible=true;changed();}
  function doUndo(){if(!undo.length)return;redo.push(snap());load(undo.pop());draw();}
  function doRedo(){if(!redo.length)return;undo.push(snap());load(redo.pop());draw();}
  function syncEnts(){for(const m of eMesh.values())scene.remove(m);eMesh.clear();for(const e of ents){const g=entModel(e);g.position.set(e.x+.5,e.y,e.z+.5);g.userData.entId=e.id;scene.add(g);eMesh.set(e.id,g);}
    if(!ring){ring=new THREE.Mesh(new THREE.TorusGeometry(.65,.06,8,24).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd24a,depthTest:false}));ring.renderOrder=5;scene.add(ring);}
    const q=ents.find(e=>e.id===selId);ring.visible=!!q;if(q)ring.position.set(q.x+.5,q.y+.05,q.z+.5);}
  const selEnt=()=>ents.find(e=>e.id===selId);
  function objAct(px,py){const r=cv.getBoundingClientRect();mv.set(((px-r.left)/r.width)*2-1,-((py-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);
    const hit=ray.intersectObjects([...eMesh.values()],true)[0];
    if(hit){let o=hit.object;while(o&&!o.userData.entId)o=o.parent;if(o){selId=o.userData.entId;syncEnts();draw();return;}}
    const t=pickAt(px,py);if(!t)return;const [x,y,z]=t.cell;if(!inb(x,y,z))return;pushUndo();
    if(objType==='start'&&ents.some(e=>e.t==='start')){const q=ents.find(e=>e.t==='start');q.x=x;q.y=y;q.z=z;selId=q.id;}
    else{const n=newEnt3(objType,x,y,z);ents.push(n);selId=n.id;}
    changed();syncEnts();draw();}
  function topY(x,z){let y=GY-1;while(y>=0&&!V.has(key(x,y,z)))y--;return y+1;}
  // chọn mục tiêu
  const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
  function pickAt(px,py){const r=cv.getBoundingClientRect();mv.set(((px-r.left)/r.width)*2-1,-((py-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);
    const list=[...meshes.values()].filter(m=>m.visible);const hit=ray.intersectObjects(list,false)[0];
    if(hit){const u=hit.object.userData;const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);let dx=0,dy=0,dz=0;if(ay>=ax&&ay>=az)dy=Math.sign(n.y);else if(ax>=az)dx=Math.sign(n.x);else dz=Math.sign(n.z);
      return {vox:u,cell:[u.x+dx,u.y+dy,u.z+dz]};}
    const pl=new THREE.Plane(new THREE.Vector3(0,1,0),-level);const p=new THREE.Vector3();if(ray.ray.intersectPlane(pl,p)){const x=Math.floor(p.x),z=Math.floor(p.z);if(inb(x,level,z))return {vox:null,cell:[x,level,z]};}
    return null;}
  function act(px,py){if(mode==='obj'){objAct(px,py);return;}
    if(mode==='area'){arClick(px,py);return;}
    if(mode==='stamp'){const t=pickAt(px,py);if(t&&clip3){pasteAt(t.cell);pasteGhost(t.cell);}return;}
    if(mode==='sel'){const id=propHit(px,py);if(id){selV.clear();updSelV();selP=id;updSelBox();draw();return;}
      selP=null;updSelBox();const t=pickAt(px,py);if(t&&t.vox){const k=key(t.vox.x,t.vox.y,t.vox.z);const now=Date.now();if(lastSel.k===k&&now-lastSel.t<450&&!shH){selCluster(k);lastSel={k:'',t:0};updSelV();draw();return;}lastSel={k,t:now};if(shH){if(selV.has(k))selV.delete(k);else selV.add(k);}else{selV.clear();selV.add(k);}}else if(!shH)selV.clear();updSelV();draw();return;}
    if(mode==='prop'){if(pmode==='sel'){selP=propHit(px,py);updSelBox();draw();}else{const t=pickAt(px,py);if(t&&inb(...t.cell))placeProp(t.cell);}return;}const t=pickAt(px,py);if(!t)return;
    if(mode==='build'){const [x,y,z]=t.cell;if(!inb(x,y,z))return;pushUndo();setV(x,y,z,shape,matI,rot);if(hideUp&&y>level){level=y;syncLevel();}refreshVis();}
    else if(mode==='erase'&&t.vox){pushUndo();delV(t.vox.x,t.vox.y,t.vox.z);refreshVis();}
    else if(mode==='paint'&&t.vox){const v=V.get(key(t.vox.x,t.vox.y,t.vox.z));if(v){pushUndo();setV(t.vox.x,t.vox.y,t.vox.z,v.s,matI,v.r);refreshVis();}}
    else if(mode==='pick'&&t.vox){const v=V.get(key(t.vox.x,t.vox.y,t.vox.z));if(v){shape=v.s;matI=v.m;rot=v.r;mode='build';draw();toast('Đã hút khối');}}}
  // ===== nét vẽ liên tục / chuột phải xoá =====
  let brushH=1,space=false,stroke=null;
  const prevInst=new THREE.InstancedMesh(new THREE.BoxGeometry(1.02,1.02,1.02),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.4,depthWrite:false}),800);prevInst.count=0;prevInst.visible=false;prevInst.frustumCulled=false;scene.add(prevInst);
  const _m4=new THREE.Matrix4();function showCells(cells){const n=Math.min(cells.length,800);for(let i=0;i<n;i++){_m4.makeTranslation(cells[i][0]+.5,cells[i][1]+.5,cells[i][2]+.5);prevInst.setMatrixAt(i,_m4);}prevInst.count=n;prevInst.instanceMatrix.needsUpdate=true;prevInst.visible=true;}
  const paintable=()=>mode==='build'||mode==='erase'||mode==='paint';
  const prevBox=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.35,depthWrite:false}));prevBox.visible=false;scene.add(prevBox);
  function planeCell(px,py,y){const r=cv.getBoundingClientRect();mv.set(((px-r.left)/r.width)*2-1,-((py-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);const pl=new THREE.Plane(new THREE.Vector3(0,1,0),-(y+.5));const p=new THREE.Vector3();if(!ray.ray.intersectPlane(pl,p))return null;const x=Math.floor(p.x),z=Math.floor(p.z);return (x>=0&&z>=0&&x<GX&&z<GZ)?[x,y,z]:null;}
  function strokeCell(px,py,first){
    if(first||(!stroke.line&&!stroke.box&&!stroke.dirv&&mode!=='build')){const t=pickAt(px,py);if(!t)return null;if(mode==='build')return t.cell;return t.vox?[t.vox.x,t.vox.y,t.vox.z]:null;}
    return planeCell(px,py,stroke.y);}
  function regionCells(a,b){const out=[];
    if(stroke.diag){const dx=b[0]-a[0],dz=b[2]-a[2],sx=dx<0?-1:1,sz=dz<0?-1:1,n=Math.round((Math.abs(dx)+Math.abs(dz))/2);for(let k=0;k<=n;k++)for(let h=0;h<brushH;h++)out.push([a[0]+k*sx,a[1]+h,a[2]+k*sz]);return out;}let x0=a[0],x1=b[0],z0=a[2],z1=b[2];
    if(stroke.line){if(Math.abs(b[0]-a[0])>=Math.abs(b[2]-a[2])){z1=z0;}else{x1=x0;}}
    else if(!stroke.box){x0=x1=b[0];z0=z1=b[2];}
    for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++)for(let h=0;h<brushH;h++)out.push([x,a[1]+h,z]);return out;}
  function bigGate(cells){let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const c of cells)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],c[i]);hi[i]=Math.max(hi[i],c[i]);}
    const wx=hi[0]-lo[0]+1,wz=hi[2]-lo[2]+1,h=hi[1]-lo[1]+1,ax=wx>=wz?0:2,w=ax===0?wx:wz;if(w<3||h<3)return false;
    const pw=w-2,R=pw/2,top=[];for(let i=0;i<pw;i++){const dx=i+.5-R;const rise=Math.sqrt(Math.max(0,R*R-dx*dx));top.push(Math.max(1,Math.min(h-1,Math.round((h-1-R)+rise))));}
    let n=0;for(let a=0;a<w;a++)for(let t=0;t<(ax===0?wz:wx);t++)for(let y=0;y<h;y++){const x=ax===0?lo[0]+a:lo[0]+t,z=ax===0?lo[2]+t:lo[2]+a,yy=lo[1]+y;if(!inb(x,yy,z))continue;
      const open=a>=1&&a<=w-2&&y<top[a-1];if(open){if(V.has(key(x,yy,z)))delV(x,yy,z,true);}else{setV(x,yy,z,'cube',matI,0,true);n++;}}
    toast('Đã dựng 1 cổng vòm lớn '+w+'×'+h+' (lối đi rộng '+pw+')');return true;}
  function applyCells(cells){if(mode==='build'&&shape==='arch'&&stroke&&(stroke.box||stroke.line)&&cells.length>2&&bigGate(cells))return;for(const [x,y,z] of cells){if(!inb(x,y,z))continue;
      if(mode==='build'){setV(x,y,z,shape,matI,rot,true);if(hideUp&&y>level){level=y;syncLevel();}}
      else if(mode==='erase'){if(V.has(key(x,y,z)))delV(x,y,z,true);}
      else if(mode==='paint'){const v=V.get(key(x,y,z));if(v)setV(x,y,z,v.s,matI,v.r,true);}}}
  function strokeStep(p,first){if(stroke.auto){autoStep(p,first);if(!stroke.dirv)return;}const c=strokeCell(p.cx,p.cy,first);if(!c)return;
    if(first){stroke.start=c;stroke.y=c[1];stroke.last=null;}
    if(stroke.dirv){const d=stroke.dirv,s0=stroke.start;let n=0;
      if(d.up){const a=new THREE.Vector3(s0[0]+.5,s0[1]+.5,s0[2]+.5).project(camera),b=new THREE.Vector3(s0[0]+.5,s0[1]+1.5,s0[2]+.5).project(camera);const ppu=Math.abs(b.y-a.y)*cv.clientHeight/2||30;const r=cv.getBoundingClientRect();const sy=(1-a.y)/2*r.height+r.top;n=Math.max(0,Math.round((sy-p.cy)/ppu));}
      else{const pc=planeCell(p.cx,p.cy,stroke.y)||s0;n=Math.max(0,Math.round(((pc[0]-s0[0])*d.x+(pc[2]-s0[2])*d.z)/(d.x*d.x+d.z*d.z)));}
      const cells=[];for(let k=0;k<=n;k++){if(d.up)cells.push([s0[0],s0[1]+k,s0[2]]);else for(let h=0;h<brushH;h++)cells.push([s0[0]+k*d.x,s0[1]+h,s0[2]+k*d.z]);}
      showCells(cells);stroke.cells=cells;return;}
    if(stroke.line||stroke.box){const cells=regionCells(stroke.start,c);const xs=cells.map(q=>q[0]),ys=cells.map(q=>q[1]),zs=cells.map(q=>q[2]);const mn=[Math.min(...xs),Math.min(...ys),Math.min(...zs)],mx=[Math.max(...xs),Math.max(...ys),Math.max(...zs)];
      prevBox.scale.set(mx[0]-mn[0]+1.02,mx[1]-mn[1]+1.02,mx[2]-mn[2]+1.02);prevBox.position.set((mn[0]+mx[0]+1)/2,(mn[1]+mx[1]+1)/2,(mn[2]+mx[2]+1)/2);prevBox.visible=true;stroke.end=c;return;}
    const kk=c.join(',')+'|'+brushH;if(stroke.last===kk)return;stroke.last=kk;
    if(!stroke.pushed){pushUndo();stroke.pushed=true;}
    {const pv=stroke.prev;let pts=[c];if(pv&&pv[1]===c[1]){pts=[];const n=Math.max(Math.abs(c[0]-pv[0]),Math.abs(c[2]-pv[2]));for(let i=1;i<=n;i++)pts.push([Math.round(pv[0]+(c[0]-pv[0])*i/n),c[1],Math.round(pv[2]+(c[2]-pv[2])*i/n)]);if(!pts.length)pts=[c];}
      for(const q of pts)applyCells(regionCells(q,q));stroke.prev=c;}stroke.n++;refreshVis();}
  function strokeEnd(){const s=stroke;stroke=null;prevBox.visible=false;prevInst.visible=false;if(!s)return;if(tHeld&&lastMP)hoverArrows(lastMP);else hideArrows();
    if(s.auto&&!s.dirv&&s.start){stroke=s;pushUndo();applyCells(regionCells(s.start,s.start));stroke=null;refreshVis();draw();return;}
    if(s.dirv){if(s.cells){pushUndo();applyCells(s.cells);refreshVis();}draw();return;}
    if((s.line||s.box)&&s.end){pushUndo();stroke=s;applyCells(regionCells(s.start,s.end));stroke=null;refreshVis();}
    else if(!s.line&&!s.box&&!s.pushed&&s.start)return;draw();}
  function rightErase(px,py){if(!(paintable()||mode==='pick'))return;const t=pickAt(px,py);if(t&&t.vox){pushUndo();delV(t.vox.x,t.vox.y,t.vox.z);refreshVis();}}
  // ===== la bàn hướng vẽ =====
  let lockDir=null,compOpen=false,compLast='';
  const DIRS=[{x:1,z:0,n:'→ +X'},{x:1,z:1},{x:0,z:1},{x:-1,z:1},{x:-1,z:0},{x:-1,z:-1},{x:0,z:-1},{x:1,z:-1}];
  const comp=document.createElement('div');comp.style.cssText='display:none;position:absolute;left:10px;bottom:76px;z-index:5;flex-direction:column;gap:6px;align-items:flex-start';
  const compBtn=document.createElement('button');compBtn.style.cssText='background:#18222d;border:2px solid #394a5c;border-radius:8px;color:#fff;font:600 12px system-ui;padding:6px 10px;cursor:pointer';
  const ringEl=document.createElement('div');ringEl.style.cssText='position:relative;width:150px;height:150px;background:rgba(15,22,30,.82);border-radius:50%;display:none';
  const dBtns=DIRS.map((d,i)=>{const b=document.createElement('button');b.style.cssText='position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid #394a5c;background:#22303f;color:#fff;font:700 16px system-ui;cursor:pointer;padding:0';b.textContent='➤';b.onclick=()=>setLock(i);ringEl.append(b);return b;});
  const upB=document.createElement('button');upB.style.cssText='position:absolute;left:75px;top:75px;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2px solid #394a5c;background:#22303f;color:#fff;font:700 18px system-ui;cursor:pointer;padding:0';upB.textContent='⬆';upB.title='Vẽ thẳng lên trên';upB.onclick=()=>setLock(8);ringEl.append(upB);
  comp.append(compBtn,ringEl);
  function setLock(i){const same=(i===8?lockDir&&lockDir.up:lockDir&&!lockDir.up&&lockDir.i===i);lockDir=same?null:(i===8?{up:true,i:8}:{x:DIRS[i].x,z:DIRS[i].z,i});toast(lockDir?(lockDir.up?'Vẽ thẳng lên: kéo chuột lên trên':'Khoá hướng vẽ — kéo chuột theo hướng mũi tên'):'Tắt khoá hướng (vẽ tự do)');updComp(true);}
  function toggleComp(){compOpen=!compOpen;if(!compOpen)lockDir=null;updComp(true);}
  function updComp(force){compBtn.textContent=(compOpen?'🧭 Khoá hướng: BẬT':'🧭 Khoá hướng');compBtn.style.borderColor=compOpen?'#ffd24a':'#394a5c';ringEl.style.display=compOpen?'block':'none';
    if(!compOpen)return;const key2=[cam.az.toFixed(2),cam.el.toFixed(2),lockDir&&lockDir.i].join();if(!force&&key2===compLast)return;compLast=key2;
    const c0=new THREE.Vector3(cam.tx,cam.ty,cam.tz).project(camera);
    DIRS.forEach((d,i)=>{const q=new THREE.Vector3(cam.tx+d.x,cam.ty,cam.tz+d.z).project(camera);let ax=(q.x-c0.x)*cv.clientWidth,ay=-(q.y-c0.y)*cv.clientHeight;const L=Math.hypot(ax,ay)||1;ax/=L;ay/=L;const b=dBtns[i];b.style.left=(75+ax*58)+'px';b.style.top=(75+ay*58)+'px';b.style.transform='rotate('+Math.atan2(ay,ax)+'rad)';b.style.borderColor=(lockDir&&!lockDir.up&&lockDir.i===i)?'#ffd24a':'#394a5c';b.style.background=(lockDir&&!lockDir.up&&lockDir.i===i)?'#6b5a1a':'#22303f';});
    upB.style.borderColor=lockDir&&lockDir.up?'#ffd24a':'#394a5c';upB.style.background=lockDir&&lockDir.up?'#6b5a1a':'#22303f';}
  compBtn.onclick=toggleComp;$('#v3d').append(comp);updComp(true);
  // ===== giữ T + kéo: tự nhận hướng, mũi tên hiện quanh ô =====
  let tHeld=false,lastMP=null;
  const ARW=[...DIRS.map(d=>({x:d.x,z:d.z})),{up:true}].map(d=>{const e=document.createElement('div');e.style.cssText='position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(20,30,40,.85);border:2px solid #ffd24a;color:#ffd24a;font:700 14px/22px system-ui;text-align:center;pointer-events:none;z-index:6;display:none';e.textContent=d.up?'⬆':'➤';$('#v3d').append(e);return e;});
  const ARD=[...DIRS.map(d=>({x:d.x,z:d.z})),{up:true}];
  function dirScreen(cell,d){const c=new THREE.Vector3(cell[0]+.5,cell[1]+.5,cell[2]+.5),q=d.up?c.clone().add(new THREE.Vector3(0,1,0)):c.clone().add(new THREE.Vector3(d.x,0,d.z));const a=c.clone().project(camera),b=q.project(camera);return [(b.x-a.x)*cv.clientWidth,-(b.y-a.y)*cv.clientHeight];}
  function hideArrows(){ARW.forEach(e=>e.style.display='none');}
  function showArrows(cell,chosen){if(!cell){hideArrows();return;}const r=cv.getBoundingClientRect(),rp=$('#v3d').getBoundingClientRect();
    ARD.forEach((d,i)=>{const c=new THREE.Vector3(cell[0]+.5,cell[1]+.5,cell[2]+.5);const q=d.up?c.clone().add(new THREE.Vector3(0,1.25,0)):c.clone().add(new THREE.Vector3(d.x*1.25,-.4,d.z*1.25));const pr=q.project(camera);
      const e=ARW[i];e.style.display='block';e.style.left=((pr.x+1)/2*r.width+r.left-rp.left)+'px';e.style.top=((1-pr.y)/2*r.height+r.top-rp.top)+'px';
      if(!d.up){const [ax,ay]=dirScreen(cell,d);e.style.transform='rotate('+Math.atan2(ay,ax)+'rad)';}
      const on=i===chosen;e.style.background=on?'#ffd24a':'rgba(20,30,40,.85)';e.style.color=on?'#222':'#ffd24a';e.style.opacity=chosen<0||on?'1':'.45';});}
  function hoverArrows(p){if(!tHeld||!paintable()){hideArrows();return;}const t=pickAt(p.cx,p.cy);if(!t){hideArrows();return;}const c=mode==='build'?t.cell:(t.vox?[t.vox.x,t.vox.y,t.vox.z]:null);showArrows(c,-1);}
  function autoStep(p,first){if(first){stroke.start=stroke.start||null;const t=pickAt(p.cx,p.cy);const c=t?(mode==='build'?t.cell:(t.vox?[t.vox.x,t.vox.y,t.vox.z]:null)):null;if(!c){stroke.auto=false;return;}stroke.start=c;stroke.y=c[1];stroke.sp={x:p.cx,y:p.cy};showArrows(c,-1);return;}
    if(stroke.locked||!stroke.start)return;const dx=p.cx-stroke.sp.x,dy=p.cy-stroke.sp.y,dist=Math.hypot(dx,dy);if(dist<14)return;
    const ang=Math.atan2(dy,dx);let best=-1,bd=9;ARD.forEach((d,i)=>{const [ax,ay]=dirScreen(stroke.start,d);if(Math.hypot(ax,ay)<1e-3)return;let df=Math.abs(Math.atan2(Math.sin(ang-Math.atan2(ay,ax)),Math.cos(ang-Math.atan2(ay,ax))));if(d.x&&d.z)df+=.32;if(df<bd){bd=df;best=i;}});
    if(best<0)return;const d=ARD[best];stroke.dirv=d.up?{up:true,i:8}:{x:d.x,z:d.z,i:best};if(dist>40)stroke.locked=true;showArrows(stroke.start,best);}
  let cHeld=false;addEventListener('keydown',e=>{if(e.code==='KeyC'&&!e.ctrlKey&&!e.metaKey&&$('#v3d').style.display!=='none'&&!(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))){cHeld=true;}});addEventListener('keyup',e=>{if(e.code==='KeyC')cHeld=false;});addEventListener('blur',()=>{cHeld=false;});
  addEventListener('keydown',e=>{if(false&&e.code==='KeyT'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&$('#v3d').style.display!=='none'&&!(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))){tHeld=true;if(lastMP)hoverArrows(lastMP);if(!lastMP||!paintable())toast('Giữ T rồi kéo chuột: tự chạy thẳng theo hướng kéo');}});
  addEventListener('keyup',e=>{if(e.code==='KeyT'){tHeld=false;if(!stroke)hideArrows();}});addEventListener('blur',()=>{tHeld=false;hideArrows();});
  // ===== thanh chọn nhanh 1-9 =====
  const hbDef=[['wedge',5],['cube',0],['cube',2],['cube',3],['pillar',1],['slab',0],['cube',7],['cube',9],['cube',12]];
  let hb=lsGet('thk_hb3',null);if(!Array.isArray(hb)||hb.length!==9)hb=hbDef.map(a=>a.slice());
  {const pn=document.getElementById('pn3');const tg=document.createElement('button');let small=false;tg.textContent='⇕ Thu/mở bảng';tg.style.cssText='position:absolute;right:8px;top:8px;z-index:6;padding:8px 12px;border-radius:10px;border:1px solid #394a5c;background:#18222dcc;color:#dce6ef;font-size:14px';
    tg.onclick=()=>{small=!small;if(pn)pn.style.height=small?'16%':'';};cv.parentElement.append(tg);}
  const hbBar=document.createElement('div');hbBar.style.cssText='position:absolute;left:10px;bottom:10px;display:flex;gap:4px;align-items:flex-end;z-index:5;pointer-events:none';
  const hbHint=document.createElement('div');hbHint.style.cssText='position:absolute;left:10px;top:10px;z-index:5;pointer-events:none;background:rgba(15,22,30,.78);color:#cfe;font:12px/1.5 system-ui;padding:6px 10px;border-radius:8px;max-width:430px';
  function hbDraw(){hbBar.innerHTML='';hbBar.style.display=tab==='build'?'flex':'none';hb.forEach((q,i)=>{const [s,m]=q;const on=mode==='build'&&shape===s&&matI===m;const b=document.createElement('button');b.style.cssText='pointer-events:auto;width:50px;height:56px;border-radius:8px;border:2px solid '+(on?'#ffd24a':'#394a5c')+';background:#18222d;color:#fff;font:11px system-ui;cursor:pointer;padding:2px;position:relative';
      const ic=shapeIcon(s,on);ic.style.cssText='width:34px;height:34px;border-radius:4px;border-bottom:4px solid '+((MATS[m]||MATS[0]).c);b.append(ic,document.createTextNode(i+1));b.title='Phím '+(i+1)+' chọn · Shift+'+(i+1)+' lưu lựa chọn hiện tại vào ô này · bấm chuột phải để lưu';
      b.onclick=()=>hbPick(i);b.oncontextmenu=ev=>{ev.preventDefault();hbSave(i);};hbBar.append(b);});
    const bh=document.createElement('div');bh.style.cssText='pointer-events:auto;margin-left:8px;background:#18222d;border:2px solid #394a5c;border-radius:8px;color:#fff;font:12px system-ui;padding:4px 8px;display:flex;align-items:center;gap:6px';
    const mk=(t,f)=>{const x=document.createElement('button');x.textContent=t;x.style.cssText='width:24px;height:24px;border-radius:6px;border:0;background:#2e3e50;color:#fff;cursor:pointer';x.onclick=f;return x;};
    bh.append(document.createTextNode('Cao'),mk('−',()=>setBH(brushH-1)),document.createTextNode(brushH),mk('+',()=>setBH(brushH+1)));bh.title='Số khối xếp chồng lên mỗi lần đặt (phím + / −)';hbBar.append(bh);
    hbHint.innerHTML=hintTxt();}
  function hintTxt(){if(mode==='build')return '<b>Đặt khối</b>: kéo chuột trái = đặt liên tục · <b>chuột phải</b> = xoá · Shift+kéo = đường ngang/dọc · <b>giữ C + kéo = đường chéo</b> · Ctrl+kéo = cả vùng (hình <b>Cổng vòm</b> + Ctrl+kéo = 1 cổng lớn vừa khít vùng) · R xoay · Tab đổi hình · 1–9 chọn nhanh · Q/E hạ/nâng tầng · +/− chiều cao';
    if(mode==='erase')return '<b>Xoá</b>: kéo trái = xoá liên tục · Shift+kéo = xoá đường · C+kéo = xoá chéo · <b>Ctrl+kéo = xoá cả vùng</b> (ô Cao = số tầng xoá) · hoặc M chọn vùng rồi Delete';
    if(mode==='paint')return '<b>Tô màu</b>: kéo = tô liên tục · Shift/Ctrl+kéo = tô đường/vùng';
    if(mode==='stamp')return '<b>Đặt mẫu</b>: di chuột để chọn vị trí (khung vàng) · bấm = đặt 1 bản · <b>Shift+kéo = đặt thành hàng thẳng</b> · <b>Ctrl+kéo = đặt thành lưới</b> · Ctrl+Z hoàn tác · Esc = thoát';
    if(mode==='sel')return '<b>Chọn</b>: bấm vào khối/mô hình để sửa (Shift+bấm = thêm · Ctrl+kéo = quét khung) · Delete xóa · R xoay · mũi tên dời · kéo trái xoay · Space+kéo = di chuyển · số 1–9 hoặc B để đặt khối';return '';}
  function hbPick(i){const [s,m]=hb[i];shape=s;matI=Math.min(m,MATS.length-1);mode='build';tab='build';draw();toast('Ô '+(i+1)+': '+(SHAPES.find(x=>x[0]===s)||[0,s])[1]+' · '+MATS[matI].n);}
  function hbSave(i){hb[i]=[shape,matI];lsSet('thk_hb3',hb);hbDraw();toast('Đã lưu vào ô '+(i+1));}
  function setBH(n){brushH=Math.max(1,Math.min(12,n));hbDraw();toast('Chiều cao nét: '+brushH);}
  $('#v3d').style.position='relative';$('#v3d').append(hbBar,hbHint);
  addEventListener('keydown',e=>{if(e.code==='Space'&&$('#v3d').style.display!=='none'&&!(e.target&&/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))){space=true;e.preventDefault();}});
  addEventListener('keyup',e=>{if(e.code==='Space')space=false;});
  // con trỏ
  const P=new Map();let g1=null,g2=null;
  const pos=e=>{const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,cx:e.clientX,cy:e.clientY};};
  cv.addEventListener('pointerdown',e=>{e.preventDefault();{const ae=document.activeElement;if(ae&&ae!==document.body&&ae.blur)ae.blur();}cv.setPointerCapture(e.pointerId);const p=pos(e);P.set(e.pointerId,p);
    if(mode==='zone'&&P.size===2){zd=null;}
    if(mode==='zone'&&P.size===1&&e.button===0&&!space&&!(e.altKey&&!zsel)){if(zDown(p,e))return;}
    if(P.size===1&&e.pointerType==='mouse'&&e.button===0&&paintable()&&!space&&!e.altKey){stroke={auto:false,diag:cHeld,dirv:lockDir,line:!lockDir&&(cHeld||(e.shiftKey&&!(e.ctrlKey||e.metaKey))),box:!lockDir&&(e.ctrlKey||e.metaKey),start:null,last:null,y:0,pushed:false,n:0};strokeStep(p,true);return;}
    if(P.size===1&&mode==='stamp'&&clip3&&e.pointerType==='mouse'&&e.button===0&&(e.shiftKey||e.ctrlKey||e.metaKey)&&!space){const t=pickAt(p.cx,p.cy);if(t){stampD={start:t.cell.slice(),cur:t.cell.slice(),kind:(e.ctrlKey||e.metaKey)?'box':'line'};stampPreview();}return;}
    if(P.size===1&&mode==='sel'&&e.pointerType==='mouse'&&e.button===0&&(e.ctrlKey||e.metaKey)&&!space){marqStart(p.cx,p.cy,e.shiftKey);return;}
    if(P.size===1)g1={x:p.cx,y:p.cy,t:performance.now(),moved:false,pan:e.button===1||space||(e.button===0&&e.shiftKey),rc:e.button===2,lx:p.cx,ly:p.cy,ax:cam.az,ae:cam.el};
    if(P.size===2){g1=null;const [a,b]=[...P.values()];g2={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,dist:cam.dist};}});
  cv.addEventListener('pointermove',e=>{const p=pos(e);if(P.has(e.pointerId))P.set(e.pointerId,p);
    lastMP=p;if(mode==='zone'&&P.size<2&&(zd||zpend)){zMoveE(p,e);if(zd)return;}
    if(stampD){const t=pickAt(p.cx,p.cy);if(t){stampD.cur=[t.cell[0],stampD.start[1],t.cell[2]];stampPreview();}return;}if(marq){marq.x1=p.cx;marq.y1=p.cy;marqUpd();return;}if(!stroke)hoverArrows(p);
    if(stroke&&P.size===1){strokeStep(p,false);return;}
    if(P.size===2&&g2){const [a,b]=[...P.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),ccx=(a.x+b.x)/2,ccy=(a.y+b.y)/2;cam.dist=Math.max(1.2,Math.min(600,g2.dist*g2.d/d));
      const k=cam.dist*.0016;const rx=Math.cos(cam.az),rz=-Math.sin(cam.az);const dx=(ccx-g2.cx),dy=(ccy-g2.cy);cam.tx-=rx*dx*k;cam.tz-=rz*dx*k;cam.ty+=dy*k;g2.cx=ccx;g2.cy=ccy;return;}
    if(g1&&P.size===1){const dx=p.cx-g1.x,dy=p.cy-g1.y;if(Math.hypot(dx,dy)>7)g1.moved=true;
      if(g1.moved){if(g1.pan){const k=cam.dist*.0016,ddx=p.cx-g1.lx,ddy=p.cy-g1.ly;panBy(ddx*k,ddy*k);}
        else{cam.az=g1.ax-dx*.008;cam.el=Math.max(.05,Math.min(1.5,g1.ae+dy*.006));}g1.lx=p.cx;g1.ly=p.cy;}}
    if(e.pointerType==='mouse'&&clip3&&(mode==='area'||mode==='stamp')&&!(g1&&g1.moved)){const t=pickAt(p.cx,p.cy);if(t){lastCell=t.cell.slice();pasteGhost(lastCell);}else pasteGhost(null);}
    if(e.pointerType==='mouse'&&(mode==='build'||(mode==='prop'&&pmode==='place'))&&!(g1&&g1.moved)){const t=pickAt(p.cx,p.cy);if(t&&inb(...t.cell)){ghost.geometry=mode==='prop'?GEO.cube:GEO[shape];ghost.position.set(t.cell[0]+.5,t.cell[1]+.5,t.cell[2]+.5);ghost.rotation.y=mode==='prop'?0:rot*Math.PI/2;ghost.visible=true;}else ghost.visible=false;}});
  const up=e=>{const p=P.get(e.pointerId);P.delete(e.pointerId);if(zd){zUp();return;}if(stampD){stampEnd();return;}if(marq){marqEnd();return;}if(stroke){strokeEnd();}if(P.size===0&&g1){if(!g1.moved&&performance.now()-g1.t<500){if(g1.rc)rightErase(g1.x,g1.y);else if(!g1.pan)act(g1.x,g1.y);}g1=null;}if(P.size<2)g2=null;ghost.visible=false;};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('contextmenu',e=>e.preventDefault());
  const panBy=(dx,dy)=>{const rx=Math.cos(cam.az),rz=-Math.sin(cam.az),fx=-Math.sin(cam.az),fz=-Math.cos(cam.az);cam.tx+=-rx*dx+fx*dy;cam.tz+=-rz*dx+fz*dy;};
  function panKey(K,k){const st=Math.max(.3,cam.dist*.06);if(K==='w'||k==='ArrowUp')panBy(0,-st/.0016*.0016);if(K==='s'||k==='ArrowDown')panBy(0,st);if(K==='a'||k==='ArrowLeft')panBy(st,0);if(K==='d'||k==='ArrowRight')panBy(-st,0);if(k==='PageUp')cam.ty+=st;if(k==='PageDown')cam.ty-=st;}
  function focusSel(){const g=pMesh.get(selP);if(g){const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3());cam.tx=c.x;cam.ty=c.y;cam.tz=c.z;cam.dist=Math.max(2,Math.max(sz.x,sz.y,sz.z)*3);toast('Đã zoom vào món đang chọn');}else{cam.tx=GX/2;cam.ty=3;cam.tz=GZ/2;cam.dist=26;toast('Về giữa cảnh');}}
  cv.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY>0?1.12:.89,nd=Math.max(1.2,Math.min(600,cam.dist*f));
    const r=cv.getBoundingClientRect();mv.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);
    const hit=ray.intersectObjects([...meshes.values(),...pMesh.values()],true)[0];const P0=new THREE.Vector3();let ok=false;if(hit){P0.copy(hit.point);ok=true;}else{ok=!!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-cam.ty),P0);}
    if(ok&&!cam.ortho){const k=1-nd/cam.dist;cam.tx+=(P0.x-cam.tx)*k;cam.ty+=(P0.y-cam.ty)*k;cam.tz+=(P0.z-cam.tz)*k;}cam.dist=nd;},{passive:false});
  let pClip=null,pClipN=0;
  const setTool=k=>{mode=k;tab='build';draw();toast({sel:'Chọn',area:'Chọn vùng',build:'Đặt khối',erase:'Xóa khối',paint:'Tô',pick:'Hút'}[k]);};
  addEventListener('keydown',e=>{if($('#v3d').style.display==='none'||document.querySelector('.outline-overlay'))return;const t=e.target;if(t&&((t.tagName==='INPUT'&&!/^(range|checkbox|radio|button)$/.test(t.type))||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;if(document.querySelector('div[style*="z-index:200"]'))return;
    const k=e.key,K=k.length===1?k.toLowerCase():k,ctrl=e.ctrlKey||e.metaKey,p=selProp();
    if(mode==='sel'&&!p&&selV.size&&!(e.altKey)){
      if(ctrl&&(K==='c'||K==='x')){selToClip(K==='x');e.preventDefault();return;}
      if(ctrl&&K==='d'){selDup();e.preventDefault();return;}
      if(!ctrl){
        if(k.startsWith('Arrow')){const rx=Math.cos(cam.az),rz=-Math.sin(cam.az),fx=-Math.sin(cam.az),fz=-Math.cos(cam.az);const ax=(a,b)=>Math.abs(a)>=Math.abs(b)?[Math.sign(a),0,0]:[0,0,Math.sign(b)];
          let d=k==='ArrowRight'?ax(rx,rz):k==='ArrowLeft'?ax(-rx,-rz):k==='ArrowUp'?ax(fx,fz):ax(-fx,-fz);selMove(d);e.preventDefault();return;}
        if(k==='PageUp'||k==='PageDown'){selMove([0,k==='PageUp'?1:-1,0]);e.preventDefault();return;}
        if(K==='r'){selRotG(e.shiftKey?-1:1);e.preventDefault();return;}
        if(k==='Enter'){selCluster([...selV][0]);updSelV();draw();e.preventDefault();return;}
        if(K==='f'){selFocus();e.preventDefault();return;}
        if(K==='x'&&false){}
      }}
    if(mode==='sel'&&ctrl&&K==='a'){selV=new Set([...V.keys()]);updSelV();draw();toast('Chọn tất cả '+selV.size+' khối');e.preventDefault();return;}
    if(ctrl){
      if(K==='z'&&!e.shiftKey){doUndo();e.preventDefault();return;}
      if(K==='y'||(K==='z'&&e.shiftKey)){doRedo();e.preventDefault();return;}
      if(K==='c'||K==='x'){if(arDone()&&(lastClip!=='prop'||!p)){copyArea(K==='x');e.preventDefault();return;}if(p){pClipN=0;lastClip='prop';pClip=JSON.parse(JSON.stringify(p));pClipN=0;if(K==='x')delP();toast(K==='x'?'Đã cắt mô hình':'Đã sao chép mô hình');e.preventDefault();}return;}
      if(K==='v'){if(clip3&&lastClip==='area'){pasteAt(lastCell||[Math.floor(cam.tx),level,Math.floor(cam.tz)]);e.preventDefault();return;}if(pClip){pClipN++;const q=Object.assign({},pClip,{id:uid(),x:Math.min(GX-.5,pClip.x+pClipN),z:Math.min(GZ-.5,pClip.z+pClipN)});pushUndo();props.push(q);selP=q.id;syncProps();changed();draw();toast('Đã dán mô hình');}else toast('Chưa có mô hình nào được sao chép (chọn món đã đặt rồi bấm Ctrl+C)');e.preventDefault();return;}
      if(K==='d'){if(p)dupP();e.preventDefault();return;}
      if(K==='a'){e.preventDefault();return;}
      return;}
    if(/^Digit[1-9]$/.test(e.code)){const i=+e.code[5]-1;if(e.shiftKey)hbSave(i);else hbPick(i);e.preventDefault();return;}
    if(K==='t')return;
    if(k==='Home'||K==='h'){fitAll();toast('Xem toàn khung');e.preventDefault();return;}
    if(k==='Tab'){const i=SHAPES.findIndex(x=>x[0]===shape),n=(i+(e.shiftKey?-1:1)+SHAPES.length)%SHAPES.length;shape=SHAPES[n][0];mode='build';tab='build';draw();toast('Hình: '+SHAPES[n][1]);e.preventDefault();return;}
    if(!p&&(k==='+'||k==='=')){setBH(brushH+1);return;}if(!p&&(k==='-'||k==='_')){setBH(brushH-1);return;}
    if(K==='q'||K==='e'){level=Math.max(0,Math.min(GY-1,level+(K==='e'?1:-1)));refreshVis();if(syncLevel)syncLevel();toast('Tầng '+level);return;}
    if(k==='Delete'||k==='Backspace'){if(selV.size&&mode==='sel'){selDel();e.preventDefault();return;}if(p){delP();e.preventDefault();}else if(arDone()){delArea();e.preventDefault();}return;}
    if(k==='Escape'){selV.clear();updSelV();if(ar){ar=null;arStep=0;updAr();}if(pgH)pgH.visible=false;clip3=clip3;selP=null;updSelBox();if(mode!=='obj'&&mode!=='prop')mode='sel';draw();return;}
    if(p&&k.startsWith('Arrow')){const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];editP(q=>{q.x+=d[0]*pStep;q.z+=d[1]*pStep;});e.preventDefault();return;}
    if(p&&(k==='PageUp'||k==='PageDown')){editP(q=>q.y+=(k==='PageUp'?1:-1)*pStep);e.preventDefault();return;}
    if(p&&(k==='+'||k==='=')){editP(q=>q.s=(q.s||1)*1.1);return;}
    if(p&&(k==='-'||k==='_')){editP(q=>q.s=(q.s||1)/1.1);return;}
    if(K==='r'){if(p)editP(q=>q.ry=(q.ry||0)+Math.PI/2);else if(mode==='prop'){pRot=(pRot+1)%4;if(tab==='mdl')draw();}else rot=(rot+1)%4;return;}
    if(K==='v'){setTool('sel');return;}if(K==='m'){setTool('area');return;}if(K==='f'){focusSel();return;}if(!p&&(K==='w'||K==='a'||K==='s'||K==='d'||k.startsWith('Arrow')||k==='PageUp'||k==='PageDown')){panKey(K,k);e.preventDefault();return;}if(K==='b'){setTool('build');return;}if(K==='x'){setTool('erase');return;}if(K==='g'){setTool('paint');return;}if(K==='i'){setTool('pick');return;}
    if(k==='['||k===']'){level=Math.max(0,Math.min(GY-1,level+(k===']'?1:-1)));refreshVis();if(syncLevel)syncLevel();toast('Tầng '+level);return;}
  });
  // vòng lặp
  function resize(){const w=cv.clientWidth,h=cv.clientHeight,dp=Math.min(devicePixelRatio||1,2);if(cv.width!==Math.round(w*dp)||cv.height!==Math.round(h*dp)){renderer.setPixelRatio(dp);renderer.setSize(w,h,false);}}
  let run=false;function loop(){if(!run)return;try{if(![cam.az,cam.el,cam.dist,cam.tx,cam.ty,cam.tz].every(Number.isFinite)){Object.assign(cam,{az:.6,el:.7,dist:30,tx:GX/2,ty:3,tz:GZ/2});toast('Camera bị lỗi, đã đặt lại');}resize();updCam();if(typeof updComp==='function'&&compOpen)updComp(false);renderer.render(scene,camera);}catch(err){if(!loop.err){loop.err=1;toast('Lỗi vẽ: '+(err&&err.message));}}requestAnimationFrame(loop);}
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('Card đồ hoạ vừa ngắt — đợi vài giây, hoặc bấm F5 nếu vẫn đen');});
  // ===== mẫu =====
  function fillBox(x0,y0,z0,x1,y1,z1,s,m,r=0){for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)setV(x,y,z,s,m,r,true);}
  function hollow(x0,y0,z0,x1,y1,z1,m){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)if(x===x0||x===x1||z===z0||z===z1)setV(x,y,z,'cube',m,0,true);}
  function roofRing(x0,z0,x1,z1,y,m){ // vòng mái dốc, mép dốc hướng ra ngoài
    for(let x=x0;x<=x1;x++){setV(x,y,z1,'wedge',m,0,true);setV(x,y,z0,'wedge',m,2,true);}
    for(let z=z0;z<=z1;z++){setV(x1,y,z,'wedge',m,1,true);setV(x0,y,z,'wedge',m,3,true);}
    setV(x0,y,z0,'cube',m,0,true);setV(x1,y,z0,'cube',m,0,true);setV(x0,y,z1,'cube',m,0,true);setV(x1,y,z1,'cube',m,0,true);}
  const TPL={
    'Nhà gỗ nhỏ':()=>{fillBox(6,0,6,14,0,12,'slab',2);hollow(7,1,7,13,3,11,0);fillBox(10,1,11,10,2,11,'cube',6);setV(10,3,11,'cube',6,0,true);for(let y=1;y<=3;y++)for(let x=7;x<=13;x+=6)setV(x,y,7,'pillar',1,0,true);
      for(let x=7;x<=13;x++)for(let z=7;z<=11;z++)setV(x,4,z,'slab',6,0,true);roofRing(6,6,14,12,4,5);roofRing(7,7,13,11,5,5);fillBox(8,6,8,12,6,10,'cube',5);
      for(const [x,z] of [[8,7],[12,7]])setV(x,2,z,'panel',8,2,true);},
    'Đình tứ trụ (võ hiệp)':()=>{fillBox(4,0,4,16,0,16,'cube',2);fillBox(5,1,5,15,1,15,'slab',3);for(const [x,z] of [[6,6],[14,6],[6,14],[14,14],[10,6],[10,14],[6,10],[14,10]])fillBox(x,1,z,x,4,z,'pillar',1);
      for(let x=6;x<=14;x++){setV(x,5,6,'cube',6,0,true);setV(x,5,14,'cube',6,0,true);}for(let z=6;z<=14;z++){setV(6,5,z,'cube',6,0,true);setV(14,5,z,'cube',6,0,true);}
      roofRing(4,4,16,16,6,4);roofRing(5,5,15,15,7,4);roofRing(6,6,14,14,8,4);roofRing(7,7,13,13,9,4);fillBox(8,10,8,12,10,12,'cube',4);setV(10,11,10,'pillar',14,0,true);},
    'Tháp 3 tầng':()=>{fillBox(5,0,5,15,0,15,'slab',2);let y=1;for(let f=0;f<3;f++){const s=f;const a=7+s,b=13-s;hollow(a,y,a,b,y+2,b,f===0?3:7);for(const [x,z] of [[a,a],[b,a],[a,b],[b,b]])fillBox(x,y,z,x,y+2,z,'pillar',1);
        for(let x=a+1;x<=b-1;x+=2)setV(x,y+1,a,'panel',8,2,true);roofRing(a-1,a-1,b+1,b+1,y+3,4);y+=4;}roofRing(9,9,11,11,y-1,4);fillBox(10,y,10,10,y+2,10,'pillar',14);},
  };
  Object.assign(TPL,makeTpl({setV,delV,fillBox,hollow,roofRing}));
  // ===== xuất =====
  function boundsInfo(){const b=new THREE.Box3();for(const me of meshes.values())b.expandByObject(me);for(const g of pMesh.values())b.expandByObject(g);if(outlineGroup)b.expandByObject(outlineGroup);return b;}
  function expGLB(){if(!V.size&&!props.length&&!outlineGroup)return toast('Chưa có công trình 3D');const groups=new Map();const root=new THREE.Group();
    for(const me of meshes.values()){const g=me.geometry.clone();me.updateMatrix();g.applyMatrix4(me.matrix);const m=V.get(key(me.userData.x,me.userData.y,me.userData.z)).m;const gg=g.index?g.toNonIndexed():g;gg.deleteAttribute('normal');gg.computeVertexNormals();if(!groups.has(m))groups.set(m,[]);groups.get(m).push(gg);}
    for(const [m,arr] of groups){const mg=mergeGeometries(arr);const mm=mats[m].clone();mm.side=THREE.DoubleSide;const mesh=new THREE.Mesh(mg,mm);mesh.name=MATS[m].n;root.add(mesh);}
    for(const g of pMesh.values())root.add(g.clone(true));if(outlineGroup)root.add(outlineGroup.clone(true));
    new GLTFExporter().parse(root,res=>{saveFile('cong_trinh_3d.glb',new Blob([res],{type:'model/gltf-binary'}));},err=>toast('Lỗi xuất GLB'),{binary:true});}
  function shot(views,size,name){if(!V.size&&!props.length&&!outlineGroup)return toast('Chưa có công trình 3D');const sbv=selBox&&selBox.visible;if(selBox)selBox.visible=false;const b=boundsInfo();const c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3());const rad=Math.max(sz.x,sz.y,sz.z)*.9+1.5;
    const save={...cam},sv=[ghost.visible,grid.visible,lvlPlane.visible];ghost.visible=false;grid.visible=false;lvlPlane.visible=false;renderer.setClearColor(0x000000,0);renderer.setPixelRatio(1);renderer.setSize(size,size,false);
    const out=document.createElement('canvas');out.width=size*views.length;out.height=size;const og=out.getContext('2d');
    views.forEach((az,i)=>{cam.az=az;cam.el=.5236;cam.ortho=true;cam.tx=c.x;cam.ty=c.y;cam.tz=c.z;cam.dist=rad*2.2;oc.left=-rad;oc.right=rad;oc.top=rad;oc.bottom=-rad;oc.updateProjectionMatrix();
      const d=cam.dist;oc.position.set(c.x+d*Math.cos(cam.el)*Math.sin(az),c.y+d*Math.sin(cam.el),c.z+d*Math.cos(cam.el)*Math.cos(az));oc.lookAt(c);renderer.render(scene,oc);og.drawImage(cv,i*size,0,size,size);});
    Object.assign(cam,save);ghost.visible=sv[0];grid.visible=sv[1];lvlPlane.visible=sv[2];renderer.setClearColor(0x16202b,1);resize();if(selBox)selBox.visible=!!sbv;
    out.toBlob(bl=>saveFile(name,bl));}
  function projJSON(){return {format:'thk-voxel-1',ents,cfg,props,grid:[GX,GY,GZ],shapes:SHAPES.map(s=>s[0]),materials:MATS.map(m=>m.n),voxels:[...V.entries()].map(([k,v])=>[...k.split(',').map(Number),SHAPES.findIndex(s=>s[0]===v.s),v.m,v.r]),note:'voxels: [x,y,z,shapeIndex,materialIndex,rot(0..3 quay quanh trục Y)]'};}
  function importJSON(t){try{const o=JSON.parse(t);if(o.format!=='thk-voxel-1')throw 0;pushUndo();{let mx=0,my=0,mz=0;for(const q of o.voxels){mx=Math.max(mx,q[0]);my=Math.max(my,q[1]);mz=Math.max(mz,q[2]);}const g=o.grid||[48,24,48];if(setGrid(Math.max(g[0],mx+1),Math.max(g[1],my+1),Math.max(g[2],mz+1),true)){fitAll();}}clearAll();for(const [x,y,z,s,m,r] of o.voxels)setV(x,y,z,SHAPES[s][0],m,r,true);ents=JSON.parse(JSON.stringify(o.ents||[]));cfg=Object.assign(defCfg3(),o.cfg||{});props=JSON.parse(JSON.stringify(o.props||[]));selP=null;refreshVis();syncEnts();syncProps();toast('Đã nhập công trình');}catch(e){toast('Tệp không đúng định dạng');}}
  // ===== Mô hình 3D (GLB) =====
  let props=[],selP=null,pmode='place',curM=null,pRot=0,pStep=.5,LIB=[],MFAV=lsGet('thk_m3d_fav',[]),selBox=null,pTok=0;const DIMS=new Map();let pFit={m:'',v:1},pSz={m:'h',v:1};const pMesh=new Map(),BYTES=new Map(),PTEX=new Map(),OBJC=new Map(),mq={q:'',pack:'',cat:'',fav:false,lim:120};
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const PREC=new Map();
  async function mBytes(id){let b=BYTES.get(id);if(b)return b;const m=LIB.find(x=>x.id===id);if(!m)return null;let pr=PREC.get(m.pack);if(!pr){pr=idbGet('m3dp:'+m.pack);PREC.set(m.pack,pr);}const rec=await pr;const u8=rec&&rec.glbs&&rec.glbs[m.name];if(!u8)return null;b={u8,tex:rec.tex||{},pack:m.pack};BYTES.set(id,b);return b;}
  function mObj(id){let p=OBJC.get(id);if(!p){p=(async()=>{const b=await mBytes(id);if(!b)return null;const o=await parseGLB(b.u8,b.tex);o.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(o),sz=bb.getSize(new THREE.Vector3());DIMS.set(id,[sz.x,sz.y,sz.z]);return o;})().catch(()=>null).then(o=>{if(!o)OBJC.delete(id);return o;});OBJC.set(id,p);}return p;}
  const applyP=(g,p)=>{g.position.set(p.x,p.y,p.z);g.rotation.y=p.ry||0;g.scale.setScalar(p.s||1);};
  function updSelBox(){const g=pMesh.get(selP);if(g){if(!selBox){selBox=new THREE.BoxHelper(g,0xffd24a);scene.add(selBox);}else selBox.setFromObject(g);selBox.visible=true;}else if(selBox)selBox.visible=false;}
  async function syncProps(){const tok=++pTok;for(const g of pMesh.values())scene.remove(g);pMesh.clear();let miss=0;
    for(const p of props){const o=await mObj(p.m);if(tok!==pTok)return;if(!o){miss++;continue;}const g=o.clone(true);g.userData.propId=p.id;applyP(g,p);scene.add(g);pMesh.set(p.id,g);}
    updSelBox();if(miss)toast(miss+' mô hình chưa có trong thư viện — hãy nhập lại gói mô hình');}
  let TR=null;const thPend=new Set(),thTried=new Set();let thRun=false;
  function thumbR(){if(!TR){const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(96,96);r.setPixelRatio(1);const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x667788,1.7));const dl=new THREE.DirectionalLight(0xffffff,1.5);dl.position.set(2,4,3);sc.add(dl);TR={r,sc,cam:new THREE.PerspectiveCamera(35,1,.01,100)};}return TR;}
  async function thumbFor(id){const o=await mObj(id);if(!o)return '';const {r,sc,cam}=thumbR();const g=o.clone(true);sc.add(g);const bb=new THREE.Box3().setFromObject(g),c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());const R=Math.max(sz.x,sz.y,sz.z)||1;cam.position.set(c.x+R*1.4,c.y+R*1.1,c.z+R*1.8);cam.lookAt(c);cam.near=R/50;cam.far=R*30;cam.updateProjectionMatrix();r.render(sc,cam);const u=r.domElement.toDataURL('image/webp',.85);sc.remove(g);return u;}
  async function genThumbs(list){for(const m of list)if(!m.thumb&&!thTried.has(m.id))thPend.add(m.id);if(thRun||!thPend.size)return;thRun=true;let n=0;
    while(thPend.size){const id=thPend.values().next().value;thPend.delete(id);thTried.add(id);const m=LIB.find(x=>x.id===id);if(!m||m.thumb)continue;let u='';try{u=await thumbFor(id);}catch(e){}
      if(u){m.thumb=u;n++;const ph=body.querySelector('[data-mid="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"] .ph');if(ph)ph.replaceWith(el('img',{src:u,style:'width:100%;height:60px;object-fit:contain;display:block'}));}
      if(n%10===0)await new Promise(r=>setTimeout(r));}
    thRun=false;if(n)idbSet('m3d_index',LIB);}
  const dimTxt=(d,s)=>d.map(x=>(x*s).toFixed(2).replace('.',',')).join(' × ')+' ô (rộng × cao × sâu)';
  function fitRow(F,lab,after){const sel=el('select',{class:'num',onchange:e=>{F.m=e.target.value;if(!F.m)F.v=1;}},[['','Giữ cỡ gốc'],['w','Cạnh ngang lớn nhất ='],['h','Chiều cao =']].map(([v,n])=>el('option',{value:v},n)));sel.value=F.m;const inp=el('input',{class:'num',type:'number',step:'0.25',min:'0.1',style:'width:64px',value:F.v,oninput:e=>{F.v=+e.target.value;}});return el('div',{class:'row'},el('span',{class:'lbl'},lab),sel,inp,el('span',{class:'lbl'},'ô'),after||null);}
  const selProp=()=>props.find(p=>p.id===selP);
  function fitScale(id,mode,v){const d=DIMS.get(id);if(!mode||!d||!(v>0))return 1;const ref=mode==='h'?d[1]:mode==='w'?Math.max(d[0],d[2]):0;return ref>1e-6?v/ref:1;}
  async function placeProp(cell){if(!curM){toast('Chọn một mô hình trong thư viện trước');return;}const o=await mObj(curM);if(!o){toast('Không đọc được mô hình này');return;}pushUndo();const m=LIB.find(x=>x.id===curM);
    const p={id:uid(),m:curM,x:cell[0]+.5,y:cell[1],z:cell[2]+.5,ry:pRot*Math.PI/2,s:fitScale(curM,pFit.m,pFit.v),solid:1,name:m?m.name:''};props.push(p);const g=o.clone(true);g.userData.propId=p.id;applyP(g,p);scene.add(g);pMesh.set(p.id,g);selP=p.id;updSelBox();changed();{const bb=new THREE.Box3().setFromObject(g),z=bb.getSize(new THREE.Vector3());if(cam.dist>Math.max(z.x,z.y,z.z)*7)focusSel();}draw();}
  function propHit(px,py){const r=cv.getBoundingClientRect();mv.set(((px-r.left)/r.width)*2-1,-((py-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);const h=ray.intersectObjects([...pMesh.values()],true)[0];if(!h)return null;let o=h.object;while(o&&!o.userData.propId)o=o.parent;return o?o.userData.propId:null;}
  function editP(f,noUndo){const p=selProp();if(!p)return;if(!noUndo)pushUndo();f(p);const g=pMesh.get(p.id);if(g)applyP(g,p);updSelBox();changed();draw();}
  function delP(){const p=selProp();if(!p)return;pushUndo();props=props.filter(q=>q.id!==p.id);const g=pMesh.get(p.id);if(g)scene.remove(g);pMesh.delete(p.id);selP=null;updSelBox();changed();draw();}
  async function dupP(){const p=selProp();if(!p)return;const o=await mObj(p.m);if(!o)return;pushUndo();const q=Object.assign({},p,{id:uid(),x:Math.min(GX-.5,p.x+1)});props.push(q);const g=o.clone(true);g.userData.propId=q.id;applyP(g,q);scene.add(g);pMesh.set(q.id,g);selP=q.id;updSelBox();changed();draw();}
  async function importPacks(files){try{await importPacks0(files);}catch(e){console.error(e);toast('Lỗi khi nhập gói: '+(e&&e.message||e));}}
  async function importPacks0(files0){const files=await expandPacks(files0);let np=0,nm=0,bad=0;toast('Đang đọc gói mô hình…');const reads=files.map(f=>packBytes(f));
    for(const f of files){
      const u8z=await reads[files.indexOf(f)];const packs=await scanZip(u8z,f.name);
      for(const pk of packs){const old=LIB.filter(m=>m.pack===pk.pack);for(const m of old){BYTES.delete(m.id);OBJC.delete(m.id);}LIB=LIB.filter(m=>m.pack!==pk.pack);PREC.delete(pk.pack);const glbs={};for(const m of pk.models)glbs[m.name]=m.glb;
        if(!(await idbSet('m3dp:'+pk.pack,{tex:pk.tex,glbs})))bad++;PTEX.set(pk.pack,pk.tex);
        for(const m of pk.models){LIB.push({id:pk.pack+'/'+m.name,pack:pk.pack,name:m.name,cat:m.cat,thumb:m.thumb});nm++;}np++;}}
    await idbSet('m3d_index',LIB);toast(np?('Đã nhập '+np+' gói, '+nm+' mô hình'+(bad?' — ⚠ '+bad+' mục chưa lưu được (đầy bộ nhớ)':'')):'Không thấy file .glb trong gói (cần thư mục Models/GLB format)');draw();}
  async function importBuiltin(ids,quiet){try{const ix=await (await fetch('m3d/index.json?v=1')).json();const fs=[];for(const m of ix){if(ids&&!ids.includes(m.id))continue;try{fs.push(new File([await fetchBin('m3d/'+m.file)],m.file));}catch(e){}}
    if(!fs.length){if(!quiet)toast('Không tải được gói 3D có sẵn');return;}await importPacks0(fs);}catch(e){console.error(e);if(!quiet)toast('Lỗi nạp gói 3D có sẵn: '+(e&&e.message||e));}}
  async function autoBuiltin(){try{const done=(await idbGet('m3d_builtin'))||[];const ix=await (await fetch('m3d/index.json?v=1')).json();const need=ix.filter(m=>!done.includes(m.id)).map(m=>m.id);if(!need.length)return;await importBuiltin(need,true);await idbSet('m3d_builtin',ix.map(m=>m.id));}catch(e){}}
  function pickZips(){const i=document.createElement('input');i.type='file';i.accept='.zip,.rar';i.multiple=true;i.onchange=()=>{const a=[...i.files];if(a.length)importPacks(a);};i.click();}
  // ===== quản lý / xóa mô hình đã nhập =====
  async function deleteModels(ids){const ds=new Set(ids);if(!ds.size)return;const byPack={};for(const m of LIB)if(ds.has(m.id))(byPack[m.pack]=byPack[m.pack]||[]).push(m.name);
    const rm=props.filter(q=>ds.has(q.m));for(const q of rm){const g=pMesh.get(q.id);if(g)scene.remove(g);pMesh.delete(q.id);}props=props.filter(q=>!ds.has(q.m));selP=null;updSelBox();
    for(const [pk,names] of Object.entries(byPack)){const left=LIB.filter(m=>m.pack===pk&&!ds.has(m.id));
      if(!left.length){await idbDel('m3dp:'+pk);PTEX.delete(pk);}else{const rec=await idbGet('m3dp:'+pk);if(rec&&rec.glbs){for(const n of names)delete rec.glbs[n];await idbSet('m3dp:'+pk,rec);}}PREC.delete(pk);}
    for(const id of ds){BYTES.delete(id);OBJC.delete(id);DIMS.delete(id);}
    LIB=LIB.filter(m=>!ds.has(m.id));MFAV=MFAV.filter(id=>!ds.has(id));lsSet('thk_m3d_fav',MFAV);if(ds.has(curM))curM=null;undo=[];redo=[];
    await idbSet('m3d_index',LIB);changed();draw();toast('Đã xóa '+ds.size+' mô hình'+(rm.length?' (và '+rm.length+' món đang đặt trong cảnh)':''));}
  function mdlMgr(){const sel=new Set();const ov=el('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:200;display:flex;align-items:center;justify-content:center'});
    const box=el('div',{style:'background:#17212b;border:1px solid #34485a;border-radius:12px;padding:12px;width:min(560px,94vw);max-height:88vh;display:flex;flex-direction:column;gap:8px;color:#cfd8e3'});
    const info=el('div',{class:'lbl'}),grid=el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px;overflow:auto;flex:1;min-height:120px'});
    const q=el('input',{class:'num',placeholder:'🔎 Lọc theo tên…',style:'width:100%'});const ps=el('select',{class:'num'},el('option',{value:''},'Tất cả gói'),[...new Set(LIB.map(m=>m.pack))].sort().map(p=>el('option',{value:p},p)));
    const shown=()=>{const f=q.value.trim().toLowerCase();return LIB.filter(m=>(!ps.value||m.pack===ps.value)&&(!f||(m.name+' '+m.pack).toLowerCase().includes(f)));};
    const draw2=()=>{grid.textContent='';const L=shown();const use={};for(const p of props)use[p.m]=(use[p.m]||0)+1;
      for(const m of L.slice(0,300))grid.append(el('button',{style:'background:#202c38;border:2px solid '+(sel.has(m.id)?'#ff6b6b':'transparent')+';border-radius:8px;padding:3px;color:#cfd8e3;font-size:10px;cursor:pointer;overflow:hidden',onclick:()=>{sel.has(m.id)?sel.delete(m.id):sel.add(m.id);draw2();}},
        m.thumb?el('img',{src:m.thumb,style:'width:100%;height:50px;object-fit:contain;display:block'}):el('div',{style:'height:50px;font-size:20px;display:flex;align-items:center;justify-content:center'},'🗿'),el('div',{style:'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'},(use[m.id]?'• ':'')+m.name)));
      info.textContent='Tổng '+LIB.length+' mô hình · hiện '+L.length+(L.length>300?' (300 đầu)':'')+' · đã chọn '+sel.size+' (• = đang đặt trong cảnh)';};
    q.oninput=draw2;ps.onchange=draw2;
    box.append(el('div',{class:'lbl',style:'font-size:14px;color:#ffd24a'},'🗑 Quản lý / xóa mô hình đã nhập'),el('div',{class:'row'},ps),q,info,grid,
      el('div',{class:'row'},btn('Chọn tất cả (đang hiện)',()=>{shown().forEach(m=>sel.add(m.id));draw2();}),btn('Bỏ chọn',()=>{sel.clear();draw2();})),
      el('div',{class:'row'},btn('🗑 Xóa đã chọn',async()=>{if(!sel.size){toast('Chưa chọn mô hình nào');return;}const n=props.filter(p=>sel.has(p.m)).length;if(!(await yes('Xóa '+sel.size+' mô hình đã chọn?'+(n?'\n'+n+' món đang đặt trong cảnh cũng sẽ bị xóa.':''))))return;await deleteModels(sel);sel.clear();if(!LIB.length)ov.remove();else draw2();},'on'),
        btn('⚠ Xóa TẤT CẢ',async()=>{if(!LIB.length)return;if(!(await yes('Xóa TOÀN BỘ '+LIB.length+' mô hình đã nhập (và các món đã đặt trong cảnh)?')))return;await deleteModels(LIB.map(m=>m.id));ov.remove();}),btn('Đóng',()=>ov.remove())));
    ov.append(box);document.body.append(ov);draw2();}
  function mdlTab(){const S=mq;
    body.append(el('div',{class:'row'},btn('📦 Nhập gói mô hình .zip…',pickZips),btn('📚 Gói 3D có sẵn (Kenney Urban/Medieval, Cây)',()=>importBuiltin()),LIB.length?btn('🗑 Quản lý / xóa',mdlMgr):null,el('span',{class:'lbl'},LIB.length+' mô hình / '+new Set(LIB.map(m=>m.pack)).size+' gói')));
    if(!LIB.length){body.append(el('div',{class:'hint'},'Chưa có mô hình. Bấm "Nhập gói mô hình" và chọn file .zip mô hình của bạn (bên trong phải có thư mục "Models/GLB format"). Chọn được nhiều file một lúc. File .rar cần giải nén ra .zip trước.'));
      body.append(el('div',{class:'hint'},'Sau khi nhập: bấm một món trong thư viện, rồi chạm lên cảnh để đặt. Chạm "✋ Chọn" để chọn lại món đã đặt và xoay/phóng/dời.'));}
    else{
    const q=el('input',{placeholder:'🔎 Tìm mô hình…',style:'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:14px;margin:4px 0'});q.value=S.q;q.addEventListener('input',()=>{S.q=q.value;S.lim=120;S.focus=true;clearTimeout(S.t);S.t=setTimeout(draw,250);});body.append(q);
    const packs=[...new Set(LIB.map(m=>m.pack))].sort();const ps=el('select',{class:'num',style:'max-width:100%',onchange:e=>{S.pack=e.target.value;S.cat='';S.lim=120;draw();}},el('option',{value:''},'Tất cả gói'),packs.map(p=>el('option',{value:p},p)));ps.value=S.pack;
    body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Gói: '),ps,btn(S.fav?'⭐ Yêu thích: bật':'☆ Yêu thích',()=>{S.fav=!S.fav;S.lim=120;draw();},S.fav?'on':'')));
    const qq=S.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const base=LIB.filter(m=>(!S.pack||m.pack===S.pack)&&(!S.fav||MFAV.includes(m.id))&&qq.every(w=>(m.name+' '+m.cat+' '+m.pack).toLowerCase().includes(w)));
    const cc={};base.forEach(m=>{cc[m.cat]=(cc[m.cat]||0)+1;});const cats=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,30);
    body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Loại: '),btn('Tất cả ('+base.length+')',()=>{S.cat='';S.lim=120;draw();},S.cat?'':'on'),cats.map(([c,n])=>btn(c+' '+n,()=>{S.cat=S.cat===c?'':c;S.lim=120;draw();},S.cat===c?'on':''))));
    const list=base.filter(m=>!S.cat||m.cat===S.cat);const shown=list.slice(0,S.lim);
    const grid=el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:4px;margin:6px 0'});
    for(const m of shown){const fav=MFAV.includes(m.id);const b=el('button',{'data-mid':m.id,title:m.pack+' / '+m.name,style:'background:#202c38;border:2px solid '+(curM===m.id?'#3ddc84':fav?'#ffd24a':'transparent')+';border-radius:8px;padding:3px;color:#cfd8e3;font-size:10px;cursor:pointer;overflow:hidden',onclick:()=>{curM=m.id;pmode='place';mode='prop';draw();toast('Đã chọn "'+m.name+'" — chạm lên cảnh để đặt');},oncontextmenu:e=>{e.preventDefault();MFAV=fav?MFAV.filter(x=>x!==m.id):MFAV.concat(m.id);lsSet('thk_m3d_fav',MFAV);draw();}},
        m.thumb?el('img',{src:m.thumb,style:'width:100%;height:60px;object-fit:contain;image-rendering:auto;display:block'}):el('div',{class:'ph',style:'height:60px;display:flex;align-items:center;justify-content:center;font-size:20px'},'🗿'),el('div',{style:'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'},m.name));grid.append(b);}
    body.append(grid);genThumbs(shown);if(list.length>shown.length)body.append(el('div',{class:'row'},btn('Hiện thêm…',()=>{S.lim+=120;draw();}),el('span',{class:'lbl'},shown.length+' / '+list.length)));
    body.append(el('div',{class:'hint'},'Bấm = chọn món để đặt. Bấm chuột phải (hoặc giữ lâu) lên món = ⭐ yêu thích.'));
    if(S.pack)body.append(el('div',{class:'row'},btn('🗑 Xóa gói "'+S.pack+'" khỏi thư viện',async()=>{if(!(await yes('Xóa gói "'+S.pack+'" khỏi thư viện? Các món đã đặt trong cảnh sẽ không hiện nữa.')))return;const gone=LIB.filter(m=>m.pack===S.pack);for(const m of gone){BYTES.delete(m.id);OBJC.delete(m.id);}PREC.delete(S.pack);await idbSet('m3dp:'+S.pack,null);LIB=LIB.filter(m=>m.pack!==S.pack);await idbSet('m3d_index',LIB);if(curM&&!LIB.some(m=>m.id===curM))curM=null;S.pack='';syncProps();draw();toast('Đã xóa gói');})));}
    const cm=LIB.find(m=>m.id===curM);
    body.append(el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'},
      el('div',{class:'row'},el('span',{class:'lbl'},'Đang chọn: '+(cm?cm.name:'(chưa chọn)')),btn('➕ Đặt',()=>{pmode='place';draw();},pmode==='place'?'on':''),btn('✋ Chọn món đã đặt',()=>{pmode='sel';draw();},pmode==='sel'?'on':''),btn('⟳ Hướng đặt '+pRot*90+'°',()=>{pRot=(pRot+1)%4;draw();})),
      fitRow(pFit,'Cỡ khi đặt:'),cm&&DIMS.get(cm.id)?el('div',{class:'hint'},'Cỡ gốc: '+dimTxt(DIMS.get(cm.id),1)):null));
    if(cm&&!DIMS.has(cm.id))mObj(cm.id).then(()=>{if(tab==='mdl')draw();});
    const p=selProp();
    if(p){const st=el('select',{class:'num',onchange:e=>{pStep=+e.target.value;}},[['.25','0,25'],['.5','0,5'],['1','1']].map(([v,n])=>el('option',{value:v},n)));st.value=String(pStep);
      body.append(el('div',{style:'border:1px solid #ffd24a;border-radius:10px;padding:8px;margin:6px 0'},
        el('div',{class:'lbl'},'🗿 '+p.name+' — ('+p.x.toFixed(2)+', '+p.y.toFixed(2)+', '+p.z.toFixed(2)+') · cỡ ×'+(p.s||1).toFixed(2)+' · '+Math.round(((p.ry||0)*180/Math.PI%360+360)%360)+'°'),
        el('div',{class:'row'},btn('🔍 Zoom vào món này',()=>{focusSel();}),btn('🔎＋ Gần hơn',()=>{cam.dist=Math.max(1.2,cam.dist*.6);}),btn('🔎－ Xa hơn',()=>{cam.dist=Math.min(600,cam.dist*1.6);})),
        el('div',{class:'row'},el('span',{class:'lbl'},'Bước dời:'),st,btn('◀ X',()=>editP(q=>q.x-=pStep)),btn('X ▶',()=>editP(q=>q.x+=pStep)),btn('▲ Z',()=>editP(q=>q.z-=pStep)),btn('Z ▼',()=>editP(q=>q.z+=pStep)),btn('⬆ Cao',()=>editP(q=>q.y+=pStep)),btn('⬇ Thấp',()=>editP(q=>q.y-=pStep)),btn('⤓ Thả xuống',()=>editP(q=>{q.y=topY(Math.floor(q.x),Math.floor(q.z));}))),
        (DIMS.get(p.m)?el('div',{class:'lbl'},'📐 Kích thước hiện tại: '+dimTxt(DIMS.get(p.m),p.s||1)):null),
        fitRow(pSz,'Đổi kích thước:',el('span',{},btn('Áp dụng',()=>{const k=fitScale(p.m,pSz.m,pSz.v);if(pSz.m)editP(q=>q.s=k);else toast('Chọn cạnh/chiều cao cần chỉnh');}),btn('Áp cho cùng loại ('+props.filter(q=>q.m===p.m).length+')',()=>{if(!pSz.m){toast('Chọn cạnh/chiều cao cần chỉnh');return;}const k=fitScale(p.m,pSz.m,pSz.v);pushUndo();props.forEach(q=>{if(q.m===p.m){q.s=k;const g=pMesh.get(q.id);if(g)applyP(g,q);}});updSelBox();changed();draw();}))),
        el('div',{class:'row'},el('span',{class:'lbl'},'Xoay:'),btn('⟲ 90°',()=>editP(q=>q.ry=(q.ry||0)-Math.PI/2)),btn('⟳ 90°',()=>editP(q=>q.ry=(q.ry||0)+Math.PI/2)),btn('⟲ 15°',()=>editP(q=>q.ry=(q.ry||0)-Math.PI/12)),btn('⟳ 15°',()=>editP(q=>q.ry=(q.ry||0)+Math.PI/12)),
          el('span',{class:'lbl'},'Cỡ:'),btn('＋10%',()=>editP(q=>q.s=(q.s||1)*1.1)),btn('－10%',()=>editP(q=>q.s=(q.s||1)/1.1)),btn('1:1',()=>editP(q=>q.s=1))),
        el('div',{class:'row'},btn(p.solid?'🧱 Chặn đường: bật':'🚶 Chặn đường: tắt',()=>editP(q=>q.solid=q.solid?0:1),p.solid?'on':''),btn('⧉ Nhân bản',dupP),btn('🗑 Xóa',delP))));}
    body.append(el('div',{class:'row'},el('span',{class:'lbl'},props.length+' mô hình trong cảnh'),btn('🗑 Xóa hết mô hình đã đặt',async()=>{if(!props.length)return;if(await yes('Xóa toàn bộ '+props.length+' mô hình đã đặt?')){pushUndo();props=[];selP=null;syncProps();changed();draw();}})));
    if(S.focus){S.focus=false;const i=$('input',body);if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}}}
  // ===== chọn vùng / sao chép / dán khối =====
  let ar=null,arStep=0,clip3=null,lastClip='',lastCell=null,arH=null,pgH=null;
  const arNorm=(a,b)=>({lo:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2])],hi:[Math.max(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2])]});
  function mkBox(col){const h=new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(),new THREE.Vector3(1,1,1)),col);h.visible=false;scene.add(h);return h;}
  function setBox(h,lo,sz){h.box.min.set(lo[0],lo[1],lo[2]);h.box.max.set(lo[0]+sz[0],lo[1]+sz[1],lo[2]+sz[2]);h.visible=true;}
  function updAr(){if(!arH)arH=mkBox(0x35e0ff);if(ar){setBox(arH,ar.lo,[ar.hi[0]-ar.lo[0]+1,ar.hi[1]-ar.lo[1]+1,ar.hi[2]-ar.lo[2]+1]);}else arH.visible=false;}
  const arDone=()=>ar&&arStep===0;
  function inAr(x,y,z){return x>=ar.lo[0]&&x<=ar.hi[0]&&y>=ar.lo[1]&&y<=ar.hi[1]&&z>=ar.lo[2]&&z<=ar.hi[2];}
  function arProps(){return props.filter(q=>inAr(Math.floor(q.x),Math.floor(q.y+1e-6),Math.floor(q.z)));}
  function arClick(px,py){const t=pickAt(px,py);if(!t)return;let c=t.vox?[t.vox.x,t.vox.y,t.vox.z]:t.cell;c=[Math.max(0,Math.min(GX-1,c[0])),Math.max(0,Math.min(GY-1,c[1])),Math.max(0,Math.min(GZ-1,c[2]))];
    if(arStep===0){ar={lo:c.slice(),hi:c.slice(),a:c};arStep=1;toast('Đã chọn góc 1 — chạm góc đối diện');}else{const n=arNorm(ar.a,c);ar={lo:n.lo,hi:n.hi,a:ar.a};arStep=0;toast('Đã chọn vùng '+(n.hi[0]-n.lo[0]+1)+'×'+(n.hi[1]-n.lo[1]+1)+'×'+(n.hi[2]-n.lo[2]+1)+' — Ctrl+C để sao chép');}
    updAr();draw();}
  function copyArea(cut){if(!arDone()){toast('Chưa chọn vùng (dùng công cụ ▭ Vùng, chạm 2 góc)');return;}const vs=[];for(const [k,v] of V){const [x,y,z]=k.split(',').map(Number);if(inAr(x,y,z))vs.push([x-ar.lo[0],y-ar.lo[1],z-ar.lo[2],v.s,v.m,v.r]);}
    const ps=arProps().map(q=>({...JSON.parse(JSON.stringify(q)),x:q.x-ar.lo[0],y:q.y-ar.lo[1],z:q.z-ar.lo[2]}));
    clip3={v:vs,p:ps,size:[ar.hi[0]-ar.lo[0]+1,ar.hi[1]-ar.lo[1]+1,ar.hi[2]-ar.lo[2]+1]};lastClip='area';
    if(cut){pushUndo();for(const [dx,dy,dz] of vs)delV(ar.lo[0]+dx,ar.lo[1]+dy,ar.lo[2]+dz,true);const ids=new Set(arProps().map(q=>q.id));props=props.filter(q=>!ids.has(q.id));syncProps();refreshVis();changed();}
    toast((cut?'Đã cắt ':'Đã sao chép ')+vs.length+' khối'+(ps.length?' + '+ps.length+' mô hình':''));draw();}
  function delArea(){if(!arDone())return;pushUndo();let n=0;for(const k of [...V.keys()]){const [x,y,z]=k.split(',').map(Number);if(inAr(x,y,z)){delV(x,y,z,true);n++;}}const ids=new Set(arProps().map(q=>q.id));props=props.filter(q=>!ids.has(q.id));selP=null;syncProps();refreshVis();changed();draw();toast('Đã xóa '+n+' khối');}
  function pasteAt(c,quiet){if(!clip3){toast('Chưa có vùng nào được sao chép');return 0;}c=[Math.max(0,Math.min(GX-1,c[0])),Math.max(0,c[1]),Math.max(0,Math.min(GZ-1,c[2]))];if(!quiet)pushUndo();let n=0;
    for(const [dx,dy,dz,sh,m,r] of clip3.v){const x=c[0]+dx,y=c[1]+dy,z=c[2]+dz;if(inb(x,y,z)){setV(x,y,z,sh,Math.min(m,MATS.length-1),r,true);n++;}}
    for(const q of clip3.p){props.push({...JSON.parse(JSON.stringify(q)),id:uid(),x:c[0]+q.x,y:c[1]+q.y,z:c[2]+q.z});}
    if(quiet)return n;syncProps();refreshVis();changed();draw();toast('Đã dán '+n+' khối'+(clip3.p.length?' + '+clip3.p.length+' mô hình':''));return n;}
  let tplRep=false;
  function makeStamp(n){const sn=snap();const ids=new Set((props||[]).map(q=>q.id));let ok=false;
    try{clearAll();TPL[n]();const vs=[];let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const [k,v] of V){const c=k.split(',').map(Number);for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],c[i]);hi[i]=Math.max(hi[i],c[i]);}vs.push([c,v]);}
      const np=(props||[]).filter(q=>!ids.has(q.id));
      if(vs.length){clip3={v:vs.map(([c,v])=>[c[0]-lo[0],c[1]-lo[1],c[2]-lo[2],v.s,v.m,v.r]),p:np.map(q=>({...JSON.parse(JSON.stringify(q)),x:q.x-lo[0],y:q.y-lo[1],z:q.z-lo[2]})),size:[hi[0]-lo[0]+1,hi[1]-lo[1]+1,hi[2]-lo[2]+1]};lastClip='stamp';ok=true;}}
    catch(err){console.error(err);}
    props=(props||[]).filter(q=>ids.has(q.id));load(sn);refreshVis();syncProps();return ok;}
  // đặt mẫu thành hàng / lưới: Shift+kéo = hàng thẳng, Ctrl+kéo = lưới
  let stampD=null;const stBoxes=[];
  function stampPlan(){const d=stampD;if(!d||!clip3)return [];const sz=clip3.size,dx=d.cur[0]-d.start[0],dz=d.cur[2]-d.start[2];const out=[];const sx=Math.sign(dx)||1,sz2=Math.sign(dz)||1;
    if(d.kind==='line'){if(Math.abs(dx)>=Math.abs(dz)){const n=Math.floor(Math.abs(dx)/sz[0])+1;for(let i=0;i<n;i++)out.push([d.start[0]+i*sx*sz[0],d.start[1],d.start[2]]);}else{const n=Math.floor(Math.abs(dz)/sz[2])+1;for(let i=0;i<n;i++)out.push([d.start[0],d.start[1],d.start[2]+i*sz2*sz[2]]);}}
    else{const nx=Math.floor(Math.abs(dx)/sz[0])+1,nz=Math.floor(Math.abs(dz)/sz[2])+1;for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)out.push([d.start[0]+i*sx*sz[0],d.start[1],d.start[2]+j*sz2*sz[2]]);}
    return out.slice(0,400);}
  function stampPreview(){const pl=stampPlan();for(let i=0;i<Math.max(pl.length,stBoxes.length);i++){if(i<pl.length){if(!stBoxes[i])stBoxes[i]=mkBox(0xffd24a);setBox(stBoxes[i],pl[i],clip3.size);}else if(stBoxes[i])stBoxes[i].visible=false;}if(pgH)pgH.visible=false;toast('Sẽ đặt '+pl.length+' bản — thả chuột để đặt');}
  function stampEnd(){const d=stampD;stampD=null;const pl=[];if(d){d.cur=d.cur||d.start;stampD=d;pl.push(...stampPlan());stampD=null;}for(const b of stBoxes)b.visible=false;if(!pl.length)return;
    pushUndo();let n=0;for(const c of pl)n+=pasteAt(c,true);syncProps();refreshVis();changed();draw();toast('Đã đặt '+pl.length+' bản ('+n+' khối)');}
  function pasteGhost(c){if(!clip3||!c){if(pgH)pgH.visible=false;return;}if(!pgH)pgH=mkBox(0xffd24a);setBox(pgH,c,clip3.size);}
  // ===== chọn & sửa khối đã xây =====
  let selV=new Set(),selVH=null,shH=false,lastSel={k:'',t:0},selStep=1;const GROUND=new Set([9,10,11,12]);
  addEventListener('keydown',e=>{if(e.key==='Shift')shH=true;});addEventListener('keyup',e=>{if(e.key==='Shift')shH=false;});addEventListener('blur',()=>{shH=false;});
  function updSelV(){if(!trimming)selBase=null;if(!selVH)selVH=mkBox(0xffd24a);if(!selV.size){selVH.visible=false;return;}let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const k of selV){const c=k.split(',').map(Number);for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],c[i]);hi[i]=Math.max(hi[i],c[i]);}}setBox(selVH,lo,[hi[0]-lo[0]+1,hi[1]-lo[1]+1,hi[2]-lo[2]+1]);}
  const selList=()=>[...selV].map(k=>{const c=k.split(',').map(Number);const v=V.get(k);return v?{c,v}:null;}).filter(Boolean);
  function selEdit(fn){const L=selList();if(!L.length)return;pushUndo();for(const o of L)fn(o);refreshVis();changed();updSelV();draw();}
  function selDel(){const L=selList();if(!L.length)return;pushUndo();for(const o of L)delV(o.c[0],o.c[1],o.c[2],true);selV.clear();updSelV();refreshVis();changed();draw();toast('Đã xóa '+L.length+' khối');}
  function selCluster(k0){const v0=V.get(k0);if(!v0)return;const ground=GROUND.has(v0.m);const seen=new Set([k0]),q=[k0];
    while(q.length){const k=q.pop();const [x,y,z]=k.split(',').map(Number);const RR=ground?1:2;for(let dx=-RR;dx<=RR;dx++)for(let dy=-RR;dy<=RR;dy++)for(let dz=-RR;dz<=RR;dz++){if(!dx&&!dy&&!dz)continue;const n=key(x+dx,y+dy,z+dz);if(seen.has(n))continue;const v=V.get(n);if(!v)continue;if(!ground&&GROUND.has(v.m))continue;seen.add(n);q.push(n);}}
    selV=seen;toast('Đã chọn cả cụm: '+seen.size+' khối (bấm đúp vào khối bất kỳ của công trình)');}
  function selBounds(L){let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const o of L)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],o.c[i]);hi[i]=Math.max(hi[i],o.c[i]);}return {lo,hi};}
  function selRotG(dir){dir=dir||1;const L=selList();if(!L.length)return;
    if(L.length<2){selEdit(o=>setV(o.c[0],o.c[1],o.c[2],o.v.s,o.v.m,(o.v.r+dir+4)%4,true));return;}
    const {lo,hi}=selBounds(L);const cx=(lo[0]+hi[0])/2,cz=(lo[2]+hi[2])/2;
    const R=L.map(o=>{const dx=o.c[0]-cx,dz=o.c[2]-cz;return {x:dir>0?dz:-dz,y:o.c[1],z:dir>0?-dx:dx,v:o.v};});
    let mnx=1e9,mnz=1e9;for(const o of R){mnx=Math.min(mnx,o.x);mnz=Math.min(mnz,o.z);}
    const w=hi[2]-lo[2],d=hi[0]-lo[0];const nlx=Math.round(cx-w/2),nlz=Math.round(cz-d/2);
    const N=R.map(o=>({c:[Math.round(o.x-mnx)+nlx,o.y,Math.round(o.z-mnz)+nlz],v:o.v}));
    for(const o of N)if(!inb(o.c[0],o.c[1],o.c[2])){toast('Xoay sẽ vượt biên khung dựng — hãy dời công trình vào giữa trước');return;}
    pushUndo();for(const o of L)delV(o.c[0],o.c[1],o.c[2],true);selV=new Set();for(const o of N){setV(o.c[0],o.c[1],o.c[2],o.v.s,o.v.m,(o.v.r+dir+4)%4,true);selV.add(key(o.c[0],o.c[1],o.c[2]));}
    refreshVis();changed();updSelV();draw();toast('Đã xoay '+(dir>0?'+':'−')+'90°');}
  function selFlip(axis){const L=selList();if(!L.length)return;const {lo,hi}=selBounds(L);const sw=axis===0?{1:3,3:1}:{0:2,2:0};
    pushUndo();for(const o of L)delV(o.c[0],o.c[1],o.c[2],true);selV=new Set();for(const o of L){const c=o.c.slice();c[axis]=lo[axis]+hi[axis]-c[axis];const r=sw[o.v.r]!==undefined?sw[o.v.r]:o.v.r;setV(c[0],c[1],c[2],o.v.s,o.v.m,r,true);selV.add(key(c[0],c[1],c[2]));}
    refreshVis();changed();updSelV();draw();toast('Đã lật '+(axis===0?'trái↔phải (X)':'trước↔sau (Z)'));}
  function selToClip(cut){const L=selList();if(!L.length)return;const {lo,hi}=selBounds(L);
    clip3={v:L.map(o=>[o.c[0]-lo[0],o.c[1]-lo[1],o.c[2]-lo[2],o.v.s,o.v.m,o.v.r]),p:[],size:[hi[0]-lo[0]+1,hi[1]-lo[1]+1,hi[2]-lo[2]+1]};lastClip='stamp';
    if(cut){pushUndo();for(const o of L)delV(o.c[0],o.c[1],o.c[2],true);refreshVis();changed();}
    selV.clear();updSelV();mode='stamp';draw();toast((cut?'Đã cắt ':'Đã sao chép ')+L.length+' khối — di chuột chọn chỗ, bấm để đặt, Esc để thoát');}
  function selFocus(){const L=selList();if(!L.length)return;const {lo,hi}=selBounds(L);cam.tx=(lo[0]+hi[0]+1)/2;cam.ty=(lo[1]+hi[1]+1)/2;cam.tz=(lo[2]+hi[2]+1)/2;cam.dist=Math.max(8,Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])*2.2);}
  // chọn bằng khung kéo (Ctrl+kéo)
  let marq=null,marqEl=null;
  function marqStart(x,y,add){marq={x0:x,y0:y,x1:x,y1:y,add};if(!marqEl){marqEl=document.createElement('div');marqEl.style.cssText='position:fixed;border:1px dashed #ffd24a;background:#ffd24a22;pointer-events:none;z-index:50;display:none';document.body.append(marqEl);}marqEl.style.display='block';marqUpd();}
  function marqUpd(){const l=Math.min(marq.x0,marq.x1),t=Math.min(marq.y0,marq.y1);Object.assign(marqEl.style,{left:l+'px',top:t+'px',width:Math.abs(marq.x1-marq.x0)+'px',height:Math.abs(marq.y1-marq.y0)+'px'});}
  function marqEnd(){marqEl.style.display='none';const m=marq;marq=null;if(Math.abs(m.x1-m.x0)<6&&Math.abs(m.y1-m.y0)<6)return;
    const r=cv.getBoundingClientRect(),l=Math.min(m.x0,m.x1),t=Math.min(m.y0,m.y1),rr=Math.max(m.x0,m.x1),b=Math.max(m.y0,m.y1);const v=new THREE.Vector3();const out=m.add?new Set(selV):new Set();
    camera.updateMatrixWorld();for(const [k] of V){const me=meshes.get(k);if(me&&!me.visible)continue;const c=k.split(',').map(Number);v.set(c[0]+.5,c[1]+.5,c[2]+.5).project(camera);if(v.z>1)continue;const sx=r.left+(v.x+1)/2*r.width,sy=r.top+(1-v.y)/2*r.height;if(sx>=l&&sx<=rr&&sy>=t&&sy<=b)out.add(k);}
    selP=null;updSelBox();selV=out;updSelV();draw();toast('Đã chọn '+out.size+' khối bằng khung');}
  // cắt bớt vùng chọn theo trục
  let selBase=null,trimming=false;
  function trimPanel(){const d=el('div',{style:'margin-top:6px;border-top:1px dashed #556;padding-top:6px'});if(!selBase)selBase=[...selV];
    const bs=selBounds(selBase.map(k=>({c:k.split(',').map(Number)})));const names=['X (trái–phải)','Y (độ cao)','Z (trước–sau)'];
    d.append(el('div',{class:'lbl'},'✂ Tách bớt (thu hẹp vùng chọn theo từng trục):'));const rng=[[bs.lo[0],bs.hi[0]],[bs.lo[1],bs.hi[1]],[bs.lo[2],bs.hi[2]]];const cntL=el('div',{class:'hint'},'');
    const apply=()=>{trimming=true;selV=new Set(selBase.filter(k=>{const c=k.split(',').map(Number);return c[0]>=rng[0][0]&&c[0]<=rng[0][1]&&c[1]>=rng[1][0]&&c[1]<=rng[1][1]&&c[2]>=rng[2][0]&&c[2]<=rng[2][1];}));updSelV();trimming=false;cntL.textContent='Còn '+selV.size+' khối được chọn';};
    [0,2,1].forEach(i=>{if(bs.hi[i]===bs.lo[i])return;const a=el('input',{type:'range',min:bs.lo[i],max:bs.hi[i],value:bs.lo[i],class:'sl'}),b=el('input',{type:'range',min:bs.lo[i],max:bs.hi[i],value:bs.hi[i],class:'sl'});const t=el('span',{class:'lbl'},names[i]+': '+bs.lo[i]+'–'+bs.hi[i]);
      const f=()=>{let x=+a.value,y=+b.value;if(x>y){if(document.activeElement===a){x=y;a.value=x;}else{y=x;b.value=y;}}rng[i]=[x,y];t.textContent=names[i]+': '+x+'–'+y;apply();};a.oninput=f;b.oninput=f;d.append(el('div',{class:'row'},t),el('div',{class:'row'},a,b));});
    d.append(cntL);return d;}
  function selMove(d){d=d.map(a=>a*selStep);const L=selList();if(!L.length)return;for(const o of L){const x=o.c[0]+d[0],y=o.c[1]+d[1],z=o.c[2]+d[2];if(!inb(x,y,z)){toast('Chạm biên khung dựng');return;}}
    pushUndo();for(const o of L)delV(o.c[0],o.c[1],o.c[2],true);selV.clear();for(const o of L){const x=o.c[0]+d[0],y=o.c[1]+d[1],z=o.c[2]+d[2];setV(x,y,z,o.v.s,o.v.m,o.v.r,true);selV.add(key(x,y,z));}refreshVis();changed();updSelV();draw();}
  function selDup(){const L=selList();if(!L.length)return;let d=[1,0,0];for(const o of L)if(!inb(o.c[0]+1,o.c[1],o.c[2])){d=[0,0,1];break;}pushUndo();selV.clear();for(const o of L){const x=o.c[0]+d[0],y=o.c[1],z=o.c[2]+d[2];if(inb(x,y,z)){setV(x,y,z,o.v.s,o.v.m,o.v.r,true);selV.add(key(x,y,z));}}refreshVis();changed();updSelV();draw();toast('Đã nhân đôi (bản sao đang được chọn, dùng mũi tên để dời)');}
  function selPanel(){const d=el('div',{style:'border:1px solid #ffd24a;border-radius:10px;padding:8px;margin:6px 0'});
    if(!selV.size){d.append(el('div',{class:'lbl'},'👆 Bấm vào khối đã xây để sửa nó.'),el('div',{class:'hint'},'Bấm đúp vào khối = chọn cả căn nhà/công trình · Ctrl+kéo = quét khung chọn nhiều khối · giữ Shift + bấm = chọn thêm khối · bấm chỗ trống hoặc Esc = bỏ chọn · bấm mô hình (cây, nhà…) để sửa mô hình.'));return d;}
    const L=selList();const f=L[0];const one=L.length===1;
    d.append(el('div',{class:'lbl'},one?'Đang chọn 1 khối: '+(SHAPES.find(a=>a[0]===f.v.s)||[0,f.v.s])[1]+' · '+(MATS[f.v.m]?MATS[f.v.m].n:'?')+' · vị trí '+f.c.join(','):'Đang chọn '+L.length+' khối'));
    d.append(el('div',{class:'row'},el('span',{class:'lbl'},'Hình:'),SHAPES.map(([k,n])=>el('button',{class:'shp'+(one&&f.v.s===k?' on':''),onclick:()=>selEdit(o=>setV(o.c[0],o.c[1],o.c[2],k,o.v.m,o.v.r,true))},shapeIcon(k,one&&f.v.s===k),el('div',{},n)))));
    const mg=el('div',{class:'matgrid'});MATS.forEach((m,i)=>mg.append(el('button',{class:'mat'+(one&&f.v.m===i?' on':''),onclick:()=>selEdit(o=>setV(o.c[0],o.c[1],o.c[2],o.v.s,i,o.v.r,true))},el('img',{src:m.url,class:'matimg'}),el('div',{},m.n))));d.append(mg);
    d.append(el('div',{class:'row'},btn('🏠 Chọn cả cụm',()=>{const k=[...selV][0];selCluster(k);updSelV();draw();}),btn('⟳ Xoay +90° (R)',()=>selRotG(1)),btn('⟲ Xoay −90° (Shift+R)',()=>selRotG(-1)),btn('↔ Lật X',()=>selFlip(0)),btn('↕ Lật Z',()=>selFlip(2)),btn('📋 Sao chép (Ctrl+C)',()=>selToClip(false)),btn('🎯 Zoom (F)',selFocus),btn('⧉ Nhân đôi (Ctrl+D)',selDup),btn('🗑 Xóa (Delete)',selDel),btn('✖ Bỏ chọn',()=>{selV.clear();updSelV();draw();})));
    d.append(el('div',{class:'row'},el('span',{class:'lbl'},'Bước dời:'),[1,2,4,8].map(n=>btn(n+' ô',()=>{selStep=n;draw();},selStep===n?'on':''))));
    d.append(el('div',{class:'row'},el('span',{class:'lbl'},'Dời:'),btn('◀ X−',()=>selMove([-1,0,0])),btn('X+ ▶',()=>selMove([1,0,0])),btn('▼ Xuống',()=>selMove([0,-1,0])),btn('▲ Lên',()=>selMove([0,1,0])),btn('Z− ↑',()=>selMove([0,0,-1])),btn('Z+ ↓',()=>selMove([0,0,1]))));
    d.append(trimPanel());
    d.append(el('div',{class:'hint',style:'line-height:1.6'},'<b>Phím tắt khi đang chọn:</b>'.replace(/<\/?b>/g,'')+' Mũi tên = dời ngang (theo hướng nhìn) · PageUp/PageDown = lên/xuống · R / Shift+R = xoay · Ctrl+D = nhân đôi · Ctrl+C / Ctrl+X = sao chép / cắt rồi bấm để đặt · Enter = chọn cả cụm · F = zoom · Delete = xóa · Esc = bỏ chọn · Ctrl+A = chọn tất cả · <b>Ctrl+kéo chuột = quét khung chọn</b> (Shift+Ctrl+kéo = chọn thêm)'.replace(/<\/?b>/g,'')));return d;}
  function areaPanel(){const d=el('div',{style:'border:1px solid #35e0ff;border-radius:10px;padding:8px;margin:6px 0'});
    d.append(el('div',{class:'lbl'},ar?(arStep?'Đang chọn… chạm góc đối diện':'Vùng đang chọn: '+(ar.hi[0]-ar.lo[0]+1)+'×'+(ar.hi[1]-ar.lo[1]+1)+'×'+(ar.hi[2]-ar.lo[2]+1)+' ô ('+arCount()+' khối)'):'Chạm 2 góc đối diện để chọn vùng (mặt sàn hoặc khối). Chọn xong chỉnh độ cao bằng nút bên dưới.'));
    if(arDone()){const ch=(i,sgn,k)=>()=>{const v=ar[k][i]+sgn;if(v<0||v>=[GX,GY,GZ][i])return;ar[k][i]=v;if(ar.lo[i]>ar.hi[i]){ar[k][i]=v-sgn;return;}updAr();draw();};
      d.append(el('div',{class:'row'},el('span',{class:'lbl'},'Tầng trên:'),btn('▲',ch(1,1,'hi')),btn('▼',ch(1,-1,'hi')),el('span',{class:'lbl'},'Tầng dưới:'),btn('▲',ch(1,1,'lo')),btn('▼',ch(1,-1,'lo'))));
      d.append(el('div',{class:'row'},el('span',{class:'lbl'},'Mở/thu X:'),btn('＋',ch(0,1,'hi')),btn('－',ch(0,-1,'hi')),el('span',{class:'lbl'},'Z:'),btn('＋',ch(2,1,'hi')),btn('－',ch(2,-1,'hi'))));
      d.append(el('div',{class:'row'},btn('📋 Sao chép (Ctrl+C)',()=>copyArea(false)),btn('✂ Cắt (Ctrl+X)',()=>copyArea(true)),btn('🗑 Xóa vùng (Delete)',delArea),btn('✖ Bỏ chọn',()=>{ar=null;arStep=0;updAr();draw();})));}
    d.append(el('div',{class:'row'},btn('📥 Dán (Ctrl+V)'+(clip3?' — '+clip3.v.length+' khối':''),()=>{if(lastCell)pasteAt(lastCell);else toast('Rê chuột lên cảnh để chọn chỗ dán');}),el('span',{class:'hint'},'Dán vào chỗ con trỏ đang chỉ (góc dưới-trái của vùng).')));return d;}
  function arCount(){let n=0;for(const k of V.keys()){const [x,y,z]=k.split(',').map(Number);if(inAr(x,y,z))n++;}return n;}
  // ===== giao diện =====
  const pn=$('#pn3'),body=el('div',{class:'pbody'}),tabs=el('div',{class:'ptabs'});pn.append(tabs,body);
  [['build','🧱 Xây'],['obj','🎯 Đối tượng'],['mdl','🗿 Mô hình'],['logic','⚙ Logic'],['view','🎥 Góc nhìn'],['tpl','🏯 Mẫu'],['file','💾 Tệp']].forEach(([k,n])=>tabs.append(el('button',{class:'ptab','data-t':k,onclick:()=>{tab=k;if(k==='obj')mode='obj';else if(k==='mdl')mode='prop';else if(mode==='obj'||mode==='prop')mode='sel';draw();}},n)));
  const btn=(l,f,c='')=>el('button',{class:'b '+c,onclick:f},l);
  let syncLevel=()=>{};
  function shapeIcon(s,on){const c=document.createElement('canvas');c.width=c.height=44;const g=c.getContext('2d');g.fillStyle='#2a3340';g.fillRect(0,0,44,44);g.fillStyle=on?'#ffd24a':'#aab';
    if(s==='cube')g.fillRect(8,8,28,28);else if(s==='slab')g.fillRect(8,22,28,14);else if(s==='wedge'){g.beginPath();g.moveTo(8,36);g.lineTo(36,36);g.lineTo(36,8);g.closePath();g.fill();}else if(s==='pillar')g.fillRect(17,6,10,32);else if(s==='stairs'){for(let i=0;i<4;i++)g.fillRect(8+i*7,36-(i+1)*7,7,(i+1)*7);}else if(s==='arch'){g.fillRect(6,6,32,32);g.fillStyle='#2a3340';g.fillRect(15,22,14,16);g.beginPath();g.arc(22,22,7,Math.PI,0);g.fill();}else if(s==='window'){g.fillRect(6,6,32,32);g.fillStyle='#2a3340';g.fillRect(14,14,16,16);}else if(s==='rail'){g.fillRect(8,14,4,22);g.fillRect(32,14,4,22);g.fillRect(8,14,28,4);g.fillRect(8,26,28,2);}else if(s==='curve'){g.beginPath();g.moveTo(6,36);g.lineTo(38,36);for(let i=10;i>=0;i--){const q=i/10;g.lineTo(6+q*32,36-q*q*30);}g.fill();}else g.fillRect(8,8,28,6);return c;}
  // ===== VÙNG CHẶN 3D (hình học, có chiều cao y0..y1) =====
  let zsel=null,zk='rect',zmode='edit',zsnap=.5,zpend=null,zd=null,zu=false,zw=null,zUn=[],zRe=[];
  const zg=new THREE.Group();scene.add(zg);const zh=new THREE.Group();scene.add(zh);
  const ZL=()=>(cfg.zones||(cfg.zones=[]));const zget=id=>cfg.zones&&cfg.zones.find(q=>q.id===id);
  const sn=v=>zsnap?Math.round(v/zsnap)*zsnap:v;
  const zy0=q=>q?(q.y0||0):level;
  function zPlane(px,py,y){const r=cv.getBoundingClientRect();mv.set(((px-r.left)/r.width)*2-1,-((py-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);const pl=new THREE.Plane(new THREE.Vector3(0,1,0),-y);const q=new THREE.Vector3();if(!ray.ray.intersectPlane(pl,q))return null;return {x:q.x,y:q.z};}
  const zpush=()=>{zUn.push(JSON.stringify(ZL()));if(zUn.length>60)zUn.shift();zRe=[];};
  const zpu=()=>{if(!zu){zpush();zu=true;}};
  function zUndo(){if(!zUn.length)return;zRe.push(JSON.stringify(ZL()));cfg.zones=JSON.parse(zUn.pop());if(zsel&&!zget(zsel))zsel=null;zRebuild();changed();draw();}
  function zRedo(){if(!zRe.length)return;zUn.push(JSON.stringify(ZL()));cfg.zones=JSON.parse(zRe.pop());zRebuild();changed();draw();}
  const matZ=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide});
  function zMesh(q,on){const y0=q.y0||0,y1=Math.max(y0+.1,Math.min(q.y1==null?GY:q.y1,GY+8)),h=y1-y0,col=on?0xffc83a:0xff3a3a,g=new THREE.Group();
    if(q.k==='line'){const P=q.pts,n=q.closed?P.length:P.length-1;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1e-6)continue;const m=new THREE.Mesh(new THREE.BoxGeometry(L+(q.th||.6),h,q.th||.6),matZ(col,on?.5:(mode==='zone'?.38:.16)));m.position.set((a[0]+b[0])/2,y0+h/2,(a[1]+b[1])/2);m.rotation.y=-Math.atan2(dz,dx);g.add(m);const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:on?0xffe08a:0xff9a9a}));e.position.copy(m.position);e.rotation.copy(m.rotation);g.add(e);}return g;}
    const P=zPts(q,40);if(P.length<3)return g;const sh=new THREE.Shape();P.forEach((a,i)=>i?sh.lineTo(a[0],-a[1]):sh.moveTo(a[0],-a[1]));const geo=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,y0,0);
    const m=new THREE.Mesh(geo,matZ(col,on?.5:(mode==='zone'?.38:.16)));g.add(m);g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),new THREE.LineBasicMaterial({color:on?0xffe08a:0xff9a9a})));return g;}
  const hmat=new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}),rmat=new THREE.MeshBasicMaterial({color:0x4ad6ff,depthTest:false}),mmat=new THREE.MeshBasicMaterial({color:0xcccccc,depthTest:false});
  function zRebuild(){for(const c of [...zg.children]){zg.remove(c);c.traverse(o=>{if(o.geometry)o.geometry.dispose();});}for(const c of [...zh.children])zh.remove(c);
    const act=mode==='zone';for(const q of (cfg.zones||[])){const g=zMesh(q,act&&q.id===zsel);g.userData.zid=q.id;zg.add(g);}
    if(zpend){const pts=zpend.pts.map(a=>new THREE.Vector3(a[0],level+.05,a[1]));if(zw)pts.push(new THREE.Vector3(sn(zw.x),level+.05,sn(zw.y)));if(pts.length>1){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffd24a,depthTest:false}));l.renderOrder=9;zh.add(l);}for(const v of pts.slice(0,zpend.pts.length)){const d=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),hmat);d.position.copy(v);d.renderOrder=10;zh.add(d);}}
    const sz=act&&zsel&&zget(zsel);if(sz){const y=(sz.y0||0)+.08;for(const h of zHandles(sz,1.2)){const m=new THREE.Mesh(h.t==='h'||h.t==='v'?new THREE.BoxGeometry(.32,.32,.32):new THREE.SphereGeometry(h.t==='m'?.14:.22,10,8),h.t==='rot'?rmat:h.t==='m'?mmat:hmat);m.position.set(h.x,y,h.y);m.renderOrder=10;zh.add(m);}}}
  const zScr=(x,y,z)=>{const v=new THREE.Vector3(x,y,z).project(camera),r=cv.getBoundingClientRect();return {x:(v.x+1)/2*r.width+r.left,y:(1-v.y)/2*r.height+r.top};};
  function zFinish(){if(!zpend)return;zpend.pts=zpend.pts.filter((q,i,A)=>!i||Math.hypot(q[0]-A[i-1][0],q[1]-A[i-1][1])>.05);const n=zpend.k==='poly'?3:2;if(zpend.pts.length<n){toast('Cần ít nhất '+n+' điểm');return;}zpush();const q=mkPts(zpend.k,zpend.pts);q.y0=level;q.y1=Math.min(GY,level+6);ZL().push(q);zsel=q.id;zpend=null;zmode='edit';zRebuild();changed();draw();toast('Đã tạo vùng chặn');}
  function zDown(p,e){zu=false;const q0=zPlane(p.cx,p.cy,zy0(zsel&&zget(zsel)));if(!q0)return false;const w=q0,q={x:sn(w.x),y:sn(w.y)};const tol=.55*Math.max(1,cam.dist/22);
    if(zpend){const now=performance.now(),last=zpend.pts[zpend.pts.length-1];const wq=zPlane(p.cx,p.cy,level)||w,qq={x:sn(wq.x),y:sn(wq.y)};
      if(now-zpend.t<380&&Math.hypot(qq.x-last[0],qq.y-last[1])<tol){zFinish();return true;}
      if(zpend.k==='poly'&&zpend.pts.length>=3&&Math.hypot(qq.x-zpend.pts[0][0],qq.y-zpend.pts[0][1])<tol){zFinish();return true;}
      zpend.pts.push([qq.x,qq.y]);zpend.t=now;zRebuild();return true;}
    if(zmode==='draw'){const wq=zPlane(p.cx,p.cy,level);if(!wq)return false;const qq={x:sn(wq.x),y:sn(wq.y)};
      if(isBox({k:zk})){zd={m:'new',p0:qq,moved:false};return true;}
      zpend={k:zk,pts:[[qq.x,qq.y]],t:performance.now()};zRebuild();draw();return true;}
    const sz=zsel&&zget(zsel);
    if(sz){const hs=zHandles(sz,1.2),y=(sz.y0||0)+.08;let best=null,bd=16;for(const h of hs){const sc=zScr(h.x,y,h.y),d=Math.hypot(sc.x-p.cx,sc.y-p.cy);if(d<bd){bd=d;best=h;}}
      if(best){
        if(best.t==='v'&&(e.shiftKey||e.altKey)){const mn=sz.k==='poly'?3:2;if(sz.pts.length>mn){zpush();sz.pts.splice(best.i,1);zRebuild();changed();draw();}return true;}
        if(best.t==='m'){zpu();sz.pts.splice(best.i+1,0,[best.x,best.y]);zd={m:'vtx',i:best.i+1};zRebuild();return true;}
        zd={m:best.t==='h'?'hdl':best.t==='rot'?'rot':'vtx',i:best.i,z0:JSON.parse(JSON.stringify(sz))};return true;}}
    // chọn theo tia: mesh vùng chặn trúng đầu tiên
    const r=cv.getBoundingClientRect();mv.set(((p.cx-r.left)/r.width)*2-1,-((p.cy-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);const hit=ray.intersectObjects(zg.children,true)[0];
    if(hit){let o=hit.object;while(o&&!o.userData.zid)o=o.parent;if(o){zsel=o.userData.zid;const t=zget(zsel),wp=zPlane(p.cx,p.cy,t.y0||0)||w;zd={m:'move',z0:JSON.parse(JSON.stringify(t)),st:wp};zRebuild();draw();return true;}}
    if(zsel){zsel=null;zRebuild();draw();}return false;}
  function zMoveE(p,e){const sz=zsel&&zget(zsel);const wq=zPlane(p.cx,p.cy,zd&&zd.m==='new'?level:zy0(sz));if(!wq)return;zw=wq;const q={x:sn(wq.x),y:sn(wq.y)};
    if(!zd){if(zpend)zRebuild();return;}
    if(zd.m==='new'){const a=zd.p0;if(!zd.moved&&Math.hypot(q.x-a.x,q.y-a.y)<.2)return;zd.moved=true;zpu();let z=zd.z;if(!z){z=zd.z=zMkBox(zk,a.x,a.y,1,1);z.y0=level;z.y1=Math.min(GY,level+6);ZL().push(z);zsel=z.id;}
      z.x=Math.min(a.x,q.x);z.y=Math.min(a.y,q.y);z.w=Math.max(.25,Math.abs(q.x-a.x));z.h=Math.max(.25,Math.abs(q.y-a.y));if(e.shiftKey){const m=Math.max(z.w,z.h);z.w=z.h=m;if(q.x<a.x)z.x=a.x-m;if(q.y<a.y)z.y=a.y-m;}zRebuild();return;}
    if(!sz)return;
    if(zd.m==='move'){zpu();const dx=sn(wq.x-zd.st.x),dy=sn(wq.y-zd.st.y),z0=JSON.parse(JSON.stringify(zd.z0));zMove(z0,dx,dy);Object.assign(sz,z0);}
    else if(zd.m==='hdl'){zpu();zDragHandle(sz,zd.z0,zd.i,q.x,q.y,e.shiftKey);}
    else if(zd.m==='rot'){zpu();const [cx,cz]=zCenter(sz);let a=Math.atan2(wq.y-cz,wq.x-cx)*180/Math.PI+90;if(e.shiftKey||zsnap)a=Math.round(a/15)*15;sz.rot=((a%360)+360)%360;}
    else if(zd.m==='vtx'){zpu();sz.pts[zd.i]=[q.x,q.y];}
    zRebuild();}
  function zUp(){if(zd&&zd.m==='new'&&!zd.moved){zpush();const a=zd.p0,z=zMkBox(zk,a.x-1,a.y-1,2,2);z.y0=level;z.y1=Math.min(GY,level+6);ZL().push(z);zsel=z.id;zmode='edit';}else if(zd&&zd.m==='new'&&zd.z)zmode='edit';zd=null;zRebuild();changed();draw();}
  function zoneUI(){const box=el('div',{style:'border:1px solid #c0503a;border-radius:10px;padding:8px;margin:6px 0'});
    box.append(el('div',{class:'row'},el('b',{},'🚧 Vùng chặn 3D (hình học, có chiều cao)')));
    box.append(el('div',{class:'row'},Object.keys(ZK).map(k=>btn(ZK[k][0]+' '+ZK[k][1],()=>{zk=k;zmode='draw';zpend=null;zRebuild();draw();},(zmode==='draw'&&zk===k)?'on':'')),btn('✋ Chọn / sửa',()=>{zmode='edit';zpend=null;zRebuild();draw();},zmode==='edit'?'on':'')));
    const sl=el('select',{class:'num',style:'min-width:130px',onchange:e=>{zsnap=+e.target.value;}},[[1,'Bám lưới: 1 khối'],[.5,'Bám: ½'],[.25,'Bám: ¼'],[0,'Tự do']].map(([v,n])=>el('option',{value:v},n)));sl.value=String(zsnap);
    box.append(el('div',{class:'row'},sl,el('span',{class:'lbl'},ZL().length+' vùng · vẽ trên mặt phẳng tầng '+level)));
    if(zpend)box.append(el('div',{class:'row'},el('span',{class:'lbl'},'Đang vẽ '+zpend.pts.length+' điểm: '),btn('✔ Xong',zFinish,'on'),btn('↶ Bỏ điểm cuối',()=>{zpend.pts.pop();if(!zpend.pts.length)zpend=null;zRebuild();draw();}),btn('✕ Hủy',()=>{zpend=null;zRebuild();draw();})));
    const sz=zsel&&zget(zsel);
    if(sz){const ch=(f)=>{zpush();f();zRebuild();changed();draw();};
      box.append(el('div',{class:'row'},el('span',{class:'lbl'},ZK[sz.k][0]+' '+ZK[sz.k][1]+': '),btn('＋ Phóng to',()=>ch(()=>zScale(sz,1.15))),btn('－ Thu nhỏ',()=>ch(()=>zScale(sz,1/1.15))),btn('⟲ 15°',()=>ch(()=>zRotate(sz,-15))),btn('⟳ 15°',()=>ch(()=>zRotate(sz,15))),btn('⧉ Nhân bản',()=>ch(()=>{const c=zClone(sz);zMove(c,1,1);ZL().push(c);zsel=c.id;})),btn('🗑 Xóa',()=>ch(()=>{cfg.zones=ZL().filter(q=>q!==sz);zsel=null;}))));
      const num=(lab,get,set,min,step)=>{const i=el('input',{type:'number',class:'num',step:step||.25,style:'width:70px'});i.value=Math.round(get()*100)/100;i.addEventListener('change',()=>{const v=parseFloat(i.value);if(isNaN(v))return;zpush();set(Math.max(min,v));zRebuild();changed();});return el('label',{class:'lbl'},lab+' ',i,' ');};
      const r2=el('div',{class:'row'});
      if(isBox(sz))r2.append(num('Rộng',()=>sz.w,v=>{const c=sz.x+sz.w/2;sz.w=v;sz.x=c-v/2;},.25),num('Sâu',()=>sz.h,v=>{const c=sz.y+sz.h/2;sz.h=v;sz.y=c-v/2;},.25),num('Xoay°',()=>sz.rot||0,v=>{sz.rot=v%360;},0,5));
      else{if(sz.k==='line'){r2.append(num('Dày',()=>sz.th||.6,v=>{sz.th=v;},.1,.1));const c=el('input',{type:'checkbox',onchange:e=>ch(()=>{sz.closed=e.target.checked;})});c.checked=!!sz.closed;r2.append(el('label',{class:'lbl'},c,' Khép kín'));}r2.append(el('span',{class:'lbl'},sz.pts.length+' đỉnh'));}
      r2.append(num('Từ tầng',()=>sz.y0||0,v=>{sz.y0=v;},0,1),num('Đến tầng',()=>sz.y1==null?GY:sz.y1,v=>{sz.y1=v;},1,1));box.append(r2);}
    box.append(el('div',{class:'hint'},'VẼ: chọn hình rồi kéo trên mặt phẳng tầng hiện tại (đổi tầng bằng thanh tầng ở trên). Đa giác/Đường gấp khúc: bấm từng điểm, bấm đúp hoặc ✔ Xong để kết thúc. SỬA: bấm vào khối đỏ để chọn; kéo thân = di chuyển; ô vuông trắng = kéo dãn; chấm xanh = xoay; chấm xám giữa cạnh = thêm đỉnh; Alt/Shift+bấm đỉnh = xóa đỉnh. "Từ tầng / Đến tầng" quy định chiều cao vùng chặn (mặc định cao 6 khối từ tầng vẽ). Delete xóa · Enter xong · Esc hủy · Ctrl+Z hoàn tác.'));
    return box;}
  addEventListener('keydown',e=>{if(mode!=='zone'||document.querySelector('.outline-overlay'))return;const v=$('#v3d');if(!v||v.style.display==='none')return;const t=e.target;if(t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))return;const k=(e.key||'').toLowerCase(),m=e.ctrlKey||e.metaKey,sz=zsel&&zget(zsel);let h=true;
    if(m&&k==='z'){e.shiftKey?zRedo():zUndo();}else if(m&&k==='y'){zRedo();}
    else if(k==='enter'&&zpend)zFinish();
    else if(k==='escape'){if(zpend){zpend=null;zRebuild();draw();}else if(zsel){zsel=null;zRebuild();draw();}else h=false;}
    else if(k==='backspace'&&zpend){zpend.pts.pop();if(!zpend.pts.length)zpend=null;zRebuild();draw();}
    else if((k==='delete'||k==='backspace')&&sz){zpush();cfg.zones=ZL().filter(q=>q!==sz);zsel=null;zRebuild();changed();draw();}
    else if(sz&&k.startsWith('arrow')&&!m){zpush();const n=(e.shiftKey?5:1)*(zsnap||.25);zMove(sz,k==='arrowleft'?-n:k==='arrowright'?n:0,k==='arrowup'?-n:k==='arrowdown'?n:0);zRebuild();changed();}
    else h=false;if(h){e.preventDefault();e.stopImmediatePropagation();}},true);
  function draw(){zRebuild();if(mode!=='sel'&&selV.size){selV.clear();updSelV();}if(mode!=='area'&&ar){ar=null;arStep=0;updAr();}if(mode!=='area'&&mode!=='stamp'&&pgH)pgH.visible=false;if(typeof hbDraw==='function')hbDraw();[...tabs.children].forEach(b=>b.classList.toggle('on',b.dataset.t===tab));body.innerHTML='';
    const scenes=sceneChoices();
    if(scenes.length)body.append(el('select',{ 'aria-label':'Cảnh 3D đang dựng',onchange:e=>switchScene(e.target.value)},
      el('option',{value:sceneId},sceneName),...scenes.map(m=>el('option',{value:m.id},m.name))));
    const guide=guideFor('3d',tab==='build'?mode:tab);if(guide)body.append(guide);
    if(tab==='build'){
      body.append(el('div',{class:'row'},[['sel','✋ Chọn'],['area','▭ Vùng'],['build','🧱 Đặt'],['erase','🧽 Xóa'],['paint','🎨 Tô'],['pick','💧 Hút'],['zone','🚧 Chặn']].map(([k,n])=>btn(n,()=>{mode=k;draw();},mode===k?'on':'')),btn('↶',doUndo),btn('↷',doRedo),el('span',{id:'cnt3',class:'lbl'},V.size+' khối')));
      if(mode==='zone')body.append(zoneUI());
      if(mode==='area')body.append(areaPanel());
      if(mode==='sel')body.append(selPanel());
      if(mode!=='sel'&&mode!=='zone')body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Hình khối:'),SHAPES.map(([k,n])=>el('button',{class:'shp'+(mode==='build'&&shape===k?' on':''),onclick:()=>{shape=k;mode='build';draw();}},shapeIcon(k,mode==='build'&&shape===k),el('div',{},n))),btn('⟳ Xoay ('+rot*90+'°)',()=>{rot=(rot+1)%4;draw();})));
      const mg=el('div',{class:'matgrid'});MATS.forEach((m,i)=>mg.append(el('button',{class:'mat'+(mode!=='sel'&&matI===i?' on':''),onclick:()=>{matI=i;if(mode==='sel')mode='build';draw();}},el('img',{src:m.url,class:'matimg'}),el('div',{},m.n))));if(mode!=='sel'&&mode!=='zone')body.append(mg);body.append(el('div',{class:'row'},btn('➕ Chất liệu từ ảnh…',upImgs),btn('📦 Từ gói .zip…',upZip),btn('🗑 Quản lý / xóa chất liệu',matMgr)));
      const sl=el('input',{type:'range',min:0,max:GY-1,value:level,class:'sl'});sl.oninput=()=>{level=+sl.value;lbl.textContent='Độ cao đặt: tầng '+level;refreshVis();};syncLevel=()=>{sl.value=level;lbl.textContent='Độ cao đặt: tầng '+level;};
      const lbl=el('span',{class:'lbl'},'Độ cao đặt: tầng '+level);body.append(el('div',{class:'row'},lbl,sl,btn(hideUp?'Ẩn tầng trên: bật':'Ẩn tầng trên: tắt',()=>{hideUp=!hideUp;refreshVis();draw();})));
      {const mk=(v,lo,hi)=>el('input',{type:'number',value:v,min:lo,max:hi,class:'num',style:'width:60px'});const ix=mk(GX,16,320),iz=mk(GZ,16,320),iy=mk(GY,8,128);
        const go=(x,y,z)=>{const old=[GX,GY,GZ].join();const ch=setGrid(x,y,z,false);if(!ch&&[GX,GY,GZ].join()===old&&(x!==GX||z!==GZ||y!==GY))toast('Không thu nhỏ hơn phần đã dựng ('+gridExt().join('×')+')');else if(ch){fitAll();refreshVis();toast('Khung dựng: '+GX+'×'+GZ+', cao '+GY);}draw();};
        body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Khung dựng:'),el('span',{class:'lbl'},'Rộng'),ix,el('span',{class:'lbl'},'Sâu'),iz,el('span',{class:'lbl'},'Cao'),iy,btn('Áp dụng',()=>go(+ix.value,+iy.value,+iz.value))));
        body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Cỡ nhanh:'),[[48,24],[64,32],[96,32],[128,40],[160,48],[240,64],[320,96]].map(([n,h])=>btn(n+'×'+n,()=>go(n,h,n))),el('span',{class:'lbl'},'Tối đa 320×320×128. Khung càng lớn càng nặng máy.')));}
      body.append(el('div',{class:'hint'},'Thao tác nhanh: chọn ô 1–9 (hoặc bấm vật liệu) rồi KÉO chuột trái để đặt liên tục; chuột phải xoá; Shift+kéo = đường ngang/dọc; giữ C+kéo = đường chéo; Ctrl+kéo = cả vùng (xoá vùng: công cụ Xóa X + Ctrl+kéo, hoặc M chọn vùng rồi Delete); +/− = chiều cao; R xoay; Tab đổi hình; Q/E hạ nâng tầng. Camera: kéo phải hoặc Alt+kéo = xoay; Space+kéo hoặc chuột giữa = di chuyển; lăn chuột = zoom về phía con trỏ; W/A/S/D = di chuyển. Home hoặc H = xem toàn khung. Phím tắt công cụ: V chọn, B đặt, X xoá, G tô, I hút, M chọn vùng.'));}
    else if(tab==='obj'){
      body.append(el('div',{class:'row'},Object.keys(OT3).map(k=>btn(OT3[k][0]+' '+OT3[k][1],()=>{objType=k;mode='obj';draw();},objType===k?'on':''))));
      body.append(el('div',{class:'hint'},'Chọn loại rồi chạm lên mặt khối (hoặc nền) để đặt. Chạm đối tượng để chọn. Có '+ents.length+' đối tượng.'));
      const fld=(l,o,k,type,x)=>{const i=el('input',{type:type||'text',value:o[k],class:'num',style:'width:'+(type==='number'?'72px':'100%')+';box-sizing:border-box',min:x&&x.min,max:x&&x.max,step:x&&x.step});i.oninput=()=>{o[k]=type==='number'?+i.value:i.value;changed();};return el('div',{class:'row'},el('span',{class:'lbl'},l),i);};
      const e=selEnt();
      if(e){const mv3=(k,d)=>{pushUndo();e[k]=Math.max(0,Math.min(k==='y'?GY-1:(k==='x'?GX-1:GZ-1),e[k]+d));changed();syncEnts();draw();};
        body.append(el('div',{style:'border:1px solid '+OT3[e.t][2]+';border-radius:10px;padding:8px;margin:6px 0'},
          el('div',{class:'lbl',style:'margin-bottom:4px'},OT3[e.t][0]+' '+OT3[e.t][1]+' — ô ('+e.x+','+e.y+','+e.z+')'),
          el('div',{class:'row'},el('span',{class:'lbl'},'Dời:'),btn('◀ X',()=>mv3('x',-1)),btn('X ▶',()=>mv3('x',1)),btn('▲ Z',()=>mv3('z',-1)),btn('Z ▼',()=>mv3('z',1)),btn('⬆ Cao',()=>mv3('y',1)),btn('⬇ Thấp',()=>mv3('y',-1))),
          e.t==='enemy'||e.t==='npc'||e.t==='chest'?fld('Tên',e,'name'):'',
          ...(e.t==='enemy'?[fld('Máu',e,'hp','number',{min:1,max:99}),fld('Sát thương',e,'dmg','number',{min:0,max:9}),fld('Tốc độ (khối/s)',e,'spd','number',{min:0,max:8,step:.1}),fld('Tầm phát hiện',e,'chase','number',{min:1,max:30}),
            el('div',{class:'row'},el('span',{class:'lbl'},'Hành vi'),(()=>{const s=el('select',{class:'num'},[['wander','Đi lang thang + đuổi'],['chase','Luôn đuổi theo'],['still','Đứng yên']].map(([v,n])=>el('option',{value:v},n)));s.value=e.ai;s.onchange=()=>{e.ai=s.value;changed();};return s;})())]:[]),
          ...(e.t==='npc'?[el('div',{class:'lbl'},'Lời thoại'),(()=>{const t=el('textarea',{rows:3,style:'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:15px'});t.value=e.text;t.oninput=()=>{e.text=t.value;changed();};return t;})()]:[]),
          ...(e.t==='chest'?[el('div',{class:'row'},el('span',{class:'lbl'},'Bên trong'),(()=>{const s=el('select',{class:'num'},el('option',{value:'hp'},'Hồi máu'),el('option',{value:'coin'},'Điểm/tiền'));s.value=e.gives;s.onchange=()=>{e.gives=s.value;changed();};return s;})()),fld('Số lượng',e,'amt','number',{min:1,max:99})]:[]),
          ...(e.t==='enemy'||e.t==='npc'?[el('div',{class:'row'},el('span',{class:'lbl'},'Màu áo'),COLS.map(c=>el('button',{style:'width:30px;height:30px;border-radius:50%;border:3px solid '+(e.col===c?'#ffd24a':'#fff3')+';background:'+c,onclick:()=>{e.col=c;changed();syncEnts();draw();}})))]:[]),
          ...entExtra(e,changed,draw),
          el('div',{class:'row'},btn('⧉ Nhân bản',()=>{if(e.t==='start')return toast('Chỉ có 1 điểm xuất phát');pushUndo();const c=JSON.parse(JSON.stringify(e));c.id=Date.now().toString(36);c.x=Math.min(GX-1,e.x+1);ents.push(c);selId=c.id;changed();syncEnts();draw();}),btn('🗑 Xoá',()=>{pushUndo();ents=ents.filter(q=>q.id!==e.id);selId=null;changed();syncEnts();draw();}))));}
      body.append(el('div',{class:'row'},btn('🎲 Rải 8 quái ngẫu nhiên',()=>{pushUndo();let n=0,t=0;while(n<8&&t<3000){t++;const x=Math.floor(Math.random()*GX),z=Math.floor(Math.random()*GZ),y=topY(x,z);if(y>GY-3||ents.some(q=>q.x===x&&q.z===z))continue;const q=newEnt3('enemy',x,y,z);q.col=COLS[n%5];ents.push(q);n++;}changed();syncEnts();draw();toast('Đã rải '+n+' quái');}),btn('🗑 Xoá hết đối tượng',async()=>{if(await yes('Xoá toàn bộ đối tượng?')){pushUndo();ents=[];selId=null;changed();syncEnts();draw();}})));
      body.append(el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'},el('div',{class:'lbl'},'⚙ Thiết lập game 3D'),
        fld('Máu người chơi',cfg,'hp','number',{min:1,max:99}),fld('Tốc độ đi (khối/s)',cfg,'spd','number',{min:1,max:12,step:.1}),fld('Lực nhảy',cfg,'jump','number',{min:3,max:14,step:.5}),fld('Sát thương đòn đánh',cfg,'dmg','number',{min:1,max:99}),fld('Tầm đánh (khối)',cfg,'rng','number',{min:1,max:6,step:.1}),
        el('div',{class:'row'},el('span',{class:'lbl'},'Điều kiện thắng'),(()=>{const s=el('select',{class:'num'},el('option',{value:'auto'},'Tự động'),el('option',{value:'kill'},'Diệt hết quái'),el('option',{value:'goal'},'Chạm đích'),el('option',{value:'both'},'Diệt hết quái + chạm đích'));s.value=cfg.win;s.onchange=()=>{cfg.win=s.value;changed();};return s;})())));
      body.append(el('div',{class:'hint'},'Chưa có đối tượng nào thì 🎮 Chơi chạy kiểu tham quan (đi bộ, nhảy). Đặt 🚩 Xuất phát để chọn chỗ bắt đầu.'));}
    else if(tab==='mdl'){mdlTab();}
    else if(tab==='logic'){logicTab(body,cfg,ents,changed,draw);}
    else if(tab==='view'){
      body.append(el('div',{class:'row'},btn(cam.ortho?'Chiếu song song: bật':'Chiếu song song: tắt',()=>{cam.ortho=!cam.ortho;draw();}),btn('⌂ Góc isometric',()=>{cam.az=Math.PI/4;cam.el=.5236;cam.ortho=true;draw();}),btn('Phía trước',()=>{cam.az=0;cam.el=.1;}),btn('Từ trên',()=>{cam.el=1.5;}),btn('🗺 Xem toàn khung (Home)',()=>{fitAll();}),btn('Nhìn lại cả công trình',()=>{const b=boundsInfo();if(V.size){const c=b.getCenter(new THREE.Vector3());cam.tx=c.x;cam.ty=c.y;cam.tz=c.z;cam.dist=Math.max(10,b.getSize(new THREE.Vector3()).length()*1.4);}})));
      body.append(el('div',{class:'row'},btn(grid.visible?'Lưới: bật':'Lưới: tắt',()=>{grid.visible=!grid.visible;draw();})));}
    else if(tab==='tpl'){
      body.append(el('div',{class:'row'},btn((tplRep?'○':'●')+' Đặt tại vị trí tôi chọn',()=>{tplRep=false;draw();}),btn((tplRep?'●':'○')+' Thay thế toàn bộ',()=>{tplRep=true;draw();})));
      body.append(el('div',{class:'hint'},tplRep?'Bấm mẫu = xóa công trình hiện tại và thay bằng mẫu (có thể hoàn tác).':'Bấm mẫu → di chuột trên khung dựng, khung vàng cho biết chỗ đặt → bấm để đặt 1 bản, Shift+kéo = hàng thẳng, Ctrl+kéo = lưới nhiều bản. Esc để thoát.'));
      body.append(el('div',{class:'row'},Object.keys(TPL).map(n=>btn(n,()=>{if(tplRep){pushUndo();clearAll();TPL[n]();refreshVis();tab='build';draw();toast('Đã tạo "'+n+'"');}else{if(!makeStamp(n))return;mode='stamp';pasteGhost(null);draw();toast('Di chuột chọn chỗ, bấm để đặt "'+n+'"');}}))));
      body.append(el('div',{class:'row'},btn('🗑 Xóa hết',async()=>{if(await yes('Xóa toàn bộ công trình?')){pushUndo();clearAll();props=[];selP=null;syncProps();refreshVis();}})));}
    else if(tab==='file'){
      body.append(el('div',{style:'border:1px solid #4a7a5a;border-radius:10px;padding:8px;margin-bottom:10px;background:#16261d'},el('div',{class:'lbl',style:'color:#9fe0b0;margin-bottom:6px'},'📂 TẢI TỆP LÊN'),el('div',{class:'row'},btn('🖼 Chất liệu từ ảnh…',upImgs),btn('📦 Gói tài nguyên .zip…',upZip),btn('⬆ Công trình .json…',()=>pickFile('.json,application/json',t=>importJSON(t))),btn('🗑 Quản lý / xóa chất liệu',matMgr)),el('div',{class:'hint'},'Ảnh/zip thành chất liệu mới trong tab 🧱 Xây (cuối bảng chất liệu).')));
      body.append(slotsUI('3d',()=>snap(),a=>{pushUndo();load(a);changed();},'Công trình của tôi'));
      body.append(el('div',{class:'row'},btn('📦 Xuất GLB (dùng cho game 3D)',expGLB),btn('⬇ Xuất .json',()=>saveFile('cong_trinh_3d.json',new Blob([JSON.stringify(projJSON())],{type:'application/json'}))),btn('📋 Sao chép JSON',()=>navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(projJSON())).then(()=>toast('Đã sao chép')))));
      body.append(el('div',{class:'row'},btn('🖼 Ảnh isometric (nền trong suốt)',()=>shot([Math.PI/4],512,'cong_trinh_iso.png')),btn('🖼 Ảnh 4 hướng (cho game 2D)',()=>shot([Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4],256,'cong_trinh_4_huong.png'))));
      body.append(el('div',{class:'row'},btn('⬆ Nhập .json',()=>pickFile('.json,application/json',t=>importJSON(t))),btn('📝 Dán JSON…',async()=>{const t=await askText('Dán nội dung JSON:');if(t)importJSON(t);})));
      body.append(el('div',{class:'row'},btn('🎮 Xuất GAME 3D (file HTML)',()=>exportGame(api.gameData(),'Game 3D của tôi'))));
      body.append(el('div',{class:'hint'},'GLB mở được trong Godot, Unity, Blender, three.js. Ảnh isometric/4 hướng là PNG nền trong suốt để dán vào game 2D. App tự lưu trên trình duyệt này.'));}
  }
  function sceneChoices(){return otherScenes.map(({id,name})=>({id,name}));}
  function switchScene(id,fresh){
    const target=fresh||otherScenes.find(m=>m.id===id);
    if(!target)return;
    otherScenes=[...otherScenes.filter(m=>m.id!==target.id),{id:sceneId,name:sceneName,data:snap()}];
    sceneId=target.id;sceneName=target.name;undo=[];redo=[];
    load(target.data);fitAll();draw();
  }
  function outlineGridBounds(level){
    const [x,,z]=gridExt(),keepOrigin=!level&&!!(V.size||props.length||ents.length||cfg.zones?.length);
    return {bounds:keepOrigin?[0,0,x,z]:null,keepOrigin};
  }
  function outlineSize(w,h,keep){
    if(![w,h].every(n=>Number.isInteger(n)&&n>=16&&n<=320))throw Error('Lưới 3D cần từ 16 đến 320 ô mỗi chiều.');
    const [x,,z]=gridExt();
    if(keep&&(w<x||h<z))throw Error('Khung mới cắt qua phần đã dựng.');
  }
  function planScene(outline,w,h,level,origin,keep,collision=true){
    outlineSize(w,h,keep);
    if(!outline.loops.length||!validOutline(outline.loops,w,h)||
       ![outline.front,outline.rear].every(n=>Number.isFinite(n)&&n>=0&&n<=4)||
       !Number.isFinite(outline.thickness)||outline.thickness<WALL_MIN_THICKNESS||outline.thickness>WALL_MAX_THICKNESS)
      throw Error('Kiểm tra lại mặt bằng, chiều cao và độ dày tường.');
    const gates=[];
    for(const g of outline.gates||[]){
      const fitted=fitGate3D(outline,[g.x,g.z],g.width,.14);
      if(!fitted)throw Error('Có cổng mất đoạn tường đỡ. Hãy gỡ rồi lắp lại cổng.');
      gates.push({...g,...fitted});
    }
    const data=keep?snap():{v:[],props:[],ents:[],cfg:defCfg3()};
    const plan={...outline,gates,floorCollision:collision};
    const shift=p=>p?.map((v,i)=>v-origin[i]);
    const markers=outlineMarkers(plan,w,h,{start:shift(level?.start),goal:shift(level?.goal)});
    data.grid=[w,GY,h];
    data.cfg={...data.cfg,outline:plan,outlineTemplate:level?.id||(keep?cfg.outlineTemplate:undefined)};
    if(!data.ents.some(e=>e.t==='start'))data.ents.push(newEnt3('start',markers.start[0],0,markers.start[1]));
    if(!keep&&!markers.goal)throw Error('Cần hai điểm đứng nối được với nhau để tạo màn chơi.');
    if(!keep&&markers.goal){
      data.ents.push(newEnt3('goal',markers.goal[0],0,markers.goal[1]));data.cfg.win='goal';
    }
    for(const p of level?.chests||[]){const q=shift(p);if(markers.includes(q)&&![markers.start,markers.goal].some(a=>a?.[0]===q[0]&&a[1]===q[1]))data.ents.push(newEnt3('chest',q[0],0,q[1]));}
    return data;
  }
  function applyPlan(data){pushUndo();load(data);fitAll();draw();}
  function runtimeScene(data){return {grid:data.grid,voxels:data.v,ents:data.ents,cfg:data.cfg,props:data.props};}
  function gameData(data=snap()){
    const pm={},pt={};
    for(const id of new Set([data,...otherScenes.map(m=>m.data)].flatMap(m=>m.props.map(p=>p.m)))){
      const b=BYTES.get(id);if(b){pm[id]={glb:b64(b.u8),pack:b.pack};pt[b.pack]=b.tex;}
    }
    return {kind:'3d',...runtimeScene(data),sceneId,sceneName,scenes:otherScenes.map(m=>({id:m.id,name:m.name,...runtimeScene(m.data)})),
      cmats:MATS.slice(BASE_N).map(m=>({n:m.n,url:m.url})),pmodels:pm,ptex:pt};
  }
  const ready=(async()=>{
    LIB=(await idbGet('m3d_index'))||[];autoBuiltin();
    for(const c of ((await idbGet('thk_cmats3d'))||lsGet('thk_cmats',[])))await addCustomMat(c.n,c.url,true);
    const saved=await idbGet(SCENE_KEY);
    if(saved?.data){sceneId=saved.id;sceneName=saved.name;otherScenes=saved.others||[];load(saved.data);}
    else{
      const sv=lsGet('thk_proj3d',null);
      if(sv)load(sv);else{TPL['Đình tứ trụ (võ hiệp)']();refreshVis();}
    }
    if(Math.max(GX,GZ)>48)fitAll();syncEnts();syncProps();draw();
    const used=new Set([snap(),...otherScenes.map(m=>m.data)].flatMap(m=>m.props.map(p=>p.m)));
    await Promise.allSettled([...used].map(mBytes));
    readyToSave=true;changed();
  })();
  const api={kind:'3d',ready,cam,show(){if(!run){run=true;loop();}},hide(){run=false;},gameData,sceneChoices,
    map:()=>({w:GX,h:GZ,cfg,name:sceneName}),sheets:()=>[],builtinOutlineSample:()=>null,outlineGridBounds,
    applyOutline:(o,c,w,h,stamps,origin)=>applyPlan(planScene(o,w,h,null,origin,true,c)),
    replaceWithOutlineMap:(o,w,h,level,stamps,origin)=>applyPlan(planScene(o,w,h,level,origin,false,o.floorCollision)),
    newOutlineMap:(o,w,h,level,stamps,origin)=>switchScene(null,{id:crypto.randomUUID(),name:level?.name||'Mặt bằng 3D '+(otherScenes.length+2),data:planScene(o,w,h,level,origin,false,o.floorCollision)}),
    previewOutlineMap:(o,w,h,level,stamps,origin)=>gameData(planScene(o,w,h,level,origin,!level,o.floorCollision)),
    resizeOutlineGrid(w,h){outlineSize(w,h,true);pushUndo();setGrid(w,GY,h);fitAll();refreshVis();draw();},
    clearOutline(){pushUndo();const {outline,outlineTemplate,...rest}=cfg;cfg=rest;refreshVis();draw();},
    _t:{setV,clearAll,refreshVis,exp:expGLB}};
  return api;
}
