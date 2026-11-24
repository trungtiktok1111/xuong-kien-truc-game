import {openRefMap} from './refmap.js';
import {bakeLayer0,noiseOverlay,paintSlab,drawFog} from './groundfx.js';
import {logicTab,entExtra} from './logic.js';
import {animTab,animPick,uniqNames,makeAnims} from './anim.js';
import {unzipSync} from 'fflate';
import {initMau} from './mau2d.js';
import {$,el,toast,saveFile,lsGet,lsSet,pickFile,pickFiles,idbSet,idbGet,idbDel,guessTile,ask,askText,yes,zipBrowser,slotsUI,exportGame,fetchBin} from './util.js';
const CELL=16,LAYN=['Nền','Phủ nền','Vật thể','Mái / cửa'];
const enc=(sid,idx,f=0)=>((sid*4096+idx)*8+f)+1;
const dec=v=>{const n=v-1;const f=n&7,t=n>>3;return {sid:t>>12,idx:t&4095,f};};
import {ANG_R,ensureAngle,sprOf,tileAng,depthAng} from './proj.js';
import {genRule,RULES,RULE_TEXT,SHAPES,SB_KIEU,loadProfiles} from './genrule.js';
import {build,GEN_KINDS,GEN_KIND_PACK,GEN_KIND_VAT,GEN_VIEWS} from './gen2d.js';
import {slab,shore,tile192,mirF,derim} from './isoslab.js';
import {nenIndex,nenPack,nenTag,vatIndex,vatPack,registerPack,unregisterPack,customPackIds} from './nen.js';
import {readZip,buildPack,ROLES,FAMILIES,exportPackZip} from './pack.js';
import {decoZones,ZK,isBox,isPts,mkBox,mkPts,zHit,zPts,zBounds,zCenter,zMove,zScale,zRotate,zClone,zHandles,zDragHandle,zPath,toLocal} from './zones.js';
export function init2D(root,A){
  const sheets=A.sheets.map(s=>Object.assign({},s));let curSheet=0,shZ='fit',shQ='';let HID=new Set([0,1,2,3,...lsGet('thk_hide2d',[])]);const visSh=()=>sheets.map((s,i)=>i).filter(i=>!HID.has(i));
  const loadSheet=s=>new Promise(r=>{const i=new Image();i.onload=()=>{s.img=i;s.cols=Math.floor((i.width+s.margin)/(s.tw+s.margin));s.rows=Math.floor((i.height+s.margin)/(s.tw+s.margin));r();};i.onerror=r;i.src=s.url;});
  let simple=(()=>{try{return localStorage.getItem('thk_simple')!=='0';}catch(e){return true;}})();
  let fillArm=false;
  let colMode=0,selId=null,objType='enemy',M=null,vis=[1,1,1,1,0],act=2,tool='draw',stamp={w:1,h:1,multi:false,tiles:[0]},sel=null,undo=[],redo=[],view={x:10,y:10,z:3},grid=true,hov=null,dirty=true,lib=lsGet('thk_stamps',[]);
  const mc=document.createElement('canvas'),mx=mc.getContext('2d');let clip=null,inclEnt=true,inclBlk=true;
  const cv=$('#cv2'),cx=cv.getContext('2d');
  {const H2={draw:'<b>Vẽ</b>: chạm/kéo = tô ô đang cầm · Kéo 2 ngón = phóng/thu và di chuyển · Chuột giữa hoặc Space+kéo = di chuyển bản đồ',erase:'<b>Xóa</b>: kéo = xóa ô ở lớp đang vẽ',fill:'<b>Đổ</b>: bấm = đổ đầy vùng cùng loại',rect:'<b>Hình CN</b>: kéo = tô cả hình chữ nhật',pick:'<b>Hút</b>: bấm ô trên bản đồ để lấy làm cọ',select:'<b>Chọn vùng</b>: kéo khung → Sao chép / Cắt / Lấy làm stamp',paste:'<b>Dán</b>: bấm để dán vùng đã sao chép',zone:'<b>Vùng chặn</b>: kéo vẽ vùng nhân vật không đi qua được',obj:'<b>Đối tượng/Vật thể</b>: chọn vật thể ở danh sách, bấm lên bản đồ để đặt · bấm vật đã đặt để sửa/xóa · kéo để di chuyển',pan:'<b>Kéo</b>: kéo để di chuyển bản đồ'};
  const hb=document.createElement('div');hb.style.cssText='position:absolute;left:10px;top:10px;z-index:5;pointer-events:none;background:rgba(15,22,30,.78);color:#cfe;font:12px/1.5 system-ui;padding:6px 10px;border-radius:8px;max-width:430px';
  const host=document.getElementById('v2d');host.style.position='relative';host.append(hb);let lt='';
  setInterval(()=>{const t=H2[tool]||'';const x=t+' · Lớp đang vẽ: '+(['Nền','Phủ nền','Vật thể','Mái/cửa','Vùng chặn'][act]||'');if(x!==lt){lt=x;hb.innerHTML=x;}},300);}

  // ===== dữ liệu =====
  const defCfg=()=>({hp:5,spd:4.2,dmg:1,rng:1.35,hero:{sid:2,idx:88},win:'auto'});
  const newMap=(w,h)=>({w,h,layers:[0,1,2,3].map(()=>new Array(w*h).fill(0)),blk:new Array(w*h).fill(0),ents:[],cfg:defCfg()});
  const clone=m=>({name:m.name,w:m.w,h:m.h,layers:m.layers.map(l=>l.slice()),blk:m.blk.slice(),ents:JSON.parse(JSON.stringify(m.ents||[])),cfg:Object.assign(defCfg(),JSON.parse(JSON.stringify(m.cfg||{})))});
  function pushUndo(){undo.push(clone(M));if(undo.length>40)undo.shift();redo=[];}
  function doUndo(){if(!undo.length)return;redo.push(clone(M));M=undo.pop();after();}
  function doRedo(){if(!redo.length)return;undo.push(clone(M));M=redo.pop();after();}
  let saveT;function after(){dirty=true;clearTimeout(saveT);saveT=setTimeout(save,700);}
  let warned=0,saveInfo='';
  async function save(){const custom=sheets.slice(4).map(s=>({name:s.name,url:s.url,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null}));syncCur();const base={w:M.w,h:M.h,layers:M.layers,blk:M.blk,ents:M.ents,cfg:M.cfg,name:M.name,maps:MAPS,cur:curMap};
    const okI=custom.length?await idbSet('thk_sheets2d',custom):await idbSet('thk_sheets2d',[]);
    const okL=lsSet('thk_proj2d',Object.assign({},base,{custom:okI?[]:custom}));
    saveInfo=(custom.length?(okI?'✔ ảnh đã tải được lưu bền (IndexedDB)':'✖ ảnh đã tải CHƯA lưu được'):'')+(okL?'':' · ✖ bản đồ chưa lưu tự động được');
    if((!okI&&custom.length||!okL)&&!warned){warned=1;toast('⚠ Trình duyệt không cho lưu tự động ảnh/bản đồ — hãy bấm 💾 Tệp → Xuất .json để giữ bản sao');}}
  // ===== vẽ ô =====
  function drawTile(c,v,dx,dy,s){if(!v)return;const d=dec(v),sh=sheets[d.sid];if(!sh||!sh.img)return;const col=d.idx%sh.cols,row=Math.floor(d.idx/sh.cols);
    const sx=col*(sh.tw+sh.margin),sy=row*(sh.tw+sh.margin);
    if(!d.f){c.drawImage(sh.img,sx,sy,sh.tw,sh.tw,dx,dy,s,s);return;}
    c.save();c.translate(dx+s/2,dy+s/2);if(d.f&4){c.rotate(Math.PI/2);c.scale(1,-1);}if(d.f&1)c.scale(-1,1);if(d.f&2)c.scale(1,-1);c.drawImage(sh.img,sx,sy,sh.tw,sh.tw,-s/2,-s/2,s,s);c.restore();}
  function rebuild(){mc.width=M.w*CELL;mc.height=M.h*CELL;mx.imageSmoothingEnabled=false;mx.clearRect(0,0,mc.width,mc.height);
    for(let l=0;l<4;l++){if(!vis[l])continue;const a=M.layers[l];for(let i=0;i<a.length;i++)if(a[i])drawTile(mx,a[i],(i%M.w)*CELL,Math.floor(i/M.w)*CELL,CELL);}}

  // ===== đối tượng =====
  const OT={start:['🚩','Xuất phát','#3ddc84'],enemy:['👾','Quái','#ff5a5a'],npc:['🧑','NPC','#4fa8ff'],chest:['🎁','Rương','#ffd24a'],goal:['🏁','Đích','#c77dff'],door:['🚪','Cửa chuyển màn','#ffa94d'],deco:['🏠','Vật cảnh','#d9a066']};
  const AIL=[['wander','Đi lang thang + đuổi'],['chase','Luôn đuổi theo'],['still','Đứng yên']];
  const selEnt=()=>M&&M.ents.find(e=>e.id===selId);
  const entAt=(x,y)=>{for(let i=M.ents.length-1;i>=0;i--){const e=M.ents[i];if(e.x===x&&e.y===y)return e;}return null;};
  function newEnt(t,x,y){const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    const b={id,t,x,y,name:OT[t][1]};
    if(t==='start'){b.tile=null;}
    if(t==='enemy'){Object.assign(b,{tile:{sid:2,idx:108},hp:2,dmg:1,spd:1.7,chase:6,ai:'wander'});}
    if(t==='npc'){Object.assign(b,{tile:{sid:2,idx:96},name:'Dân làng',text:'Chào kiếm sĩ! Cẩn thận quái vật quanh đây.'});}
    if(t==='chest'){Object.assign(b,{tile:null,gives:'hp',amt:2});}
    if(t==='goal'){b.tile=null;}
    if(t==='door'){Object.assign(b,{name:'Cửa',tile:null,to:Math.min(MAPS.length-1,curMap+1)===curMap?0:curMap+1,tx:null,ty:null});}
    return b;}
  function drawEnts(z){for(const e of M.ents){const X=view.x+e.x*CELL*z,Y=view.y+e.y*CELL*z,S=CELL*z,col=OT[e.t][2];
      if(e.tile&&e.t!=='deco'){drawTile(cx,enc(e.tile.sid,e.tile.idx),X,Y,S);}else{cx.fillStyle='#0008';cx.fillRect(X+1,Y+1,S-2,S-2);if(S>=14){cx.font='bold '+Math.max(8,S*.32)+'px system-ui';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle='#fff';cx.fillText((e.name||OT[e.t][1]).slice(0,4),X+S/2,Y+S/2+1);}}
      cx.strokeStyle=col;cx.lineWidth=e.id===selId?3:1.5;cx.strokeRect(X+1,Y+1,S-2,S-2);
      if(z>=2.2){cx.font='bold '+Math.max(9,S*.3)+'px system-ui';cx.textAlign='center';cx.textBaseline='alphabetic';cx.fillStyle=col;cx.fillText(OT[e.t][0],X+S*.2,Y+S*.3);}}
    cx.textBaseline='alphabetic';}
  function objDown(c){if(!inb(c.x,c.y))return;const ex=(ISOQ()&&lastPt?entAtScreen(lastPt.x,lastPt.y):null)||entAt(c.x,c.y);pushUndo();
    if(ex){selId=ex.id;drag={ent:true,dx:c.x-ex.x,dy:c.y-ex.y};}
    else if(objType==='start'&&M.ents.some(e=>e.t==='start')){const s=M.ents.find(e=>e.t==='start');s.x=c.x;s.y=c.y;selId=s.id;drag={ent:true};}
    else if(objType==='deco'){if(!vatSel){toast('Chọn một vật thể trong danh sách bên dưới trước');return;}const it=vatSel,n={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:'deco',x:c.x,y:c.y,f:it.f,fx:it.fx,fy:it.fy,sc:it.sc,ox:it.ox,oy:it.oy,flat:it.role==='Phủ nền',name:it.name,tile:it.tile,zb:it.zb};if(it.zps)n.zps=JSON.parse(JSON.stringify(it.zps));if(it.col)n.col=JSON.parse(JSON.stringify(it.col));if(it.cal!=null)n.cal=it.cal;if(it.role==='Phủ nền')n.walk=true;if(it.cv)n.cv=it.cv;M.ents.push(n);selId=n.id;drag={ent:true};}
    else{const n=newEnt(objType,c.x,c.y);M.ents.push(n);selId=n.id;drag={ent:true};}
    after();ui.obj();}
  // ===== chế độ iso (nhìn giống lúc chơi) =====
  let lastPt=null,isoC=null,isoK='',isoHB=[];
  function fogLv(){return (M&&M.cfg&&M.cfg.fog)|0;}
  function smoothOn(){return !(M&&M.cfg&&M.cfg.smooth===false);}
  function ISOQ(){return !!(M&&M.cfg&&M.cfg.view==='iso');}
  const ANGQ=()=>ISOQ()&&M.cfg.proj==='angle';let angN=-1;
  function g2s(gx,gy){const S=CELL*view.z;if(ANGQ())return [view.x+gx*2*S,view.y+gy*2*S*ANG_R];return ISOQ()?[view.x+(gx-gy)*S,view.y+(gx+gy)*S*.5]:[view.x+gx*S,view.y+gy*S];}
  function s2g(px,py){const S=CELL*view.z;if(ANGQ())return {x:(px-view.x)/(2*S),y:(py-view.y)/(2*S*ANG_R)};if(ISOQ()){const u=(px-view.x)/S,v=(py-view.y)/(S*.5);return {x:(u+v)/2,y:(v-u)/2};}return {x:(px-view.x)/S,y:(py-view.y)/S};}
  function pathQ(x,y,w,h){const a=g2s(x,y),b=g2s(x+w,y),c=g2s(x+w,y+h),d=g2s(x,y+h);cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.lineTo(c[0],c[1]);cx.lineTo(d[0],d[1]);cx.closePath();}
  function tileG(v,gx,gy){if(!v)return;const S=CELL*view.z,p=g2s(gx,gy);
    if(!ISOQ()){drawTile(cx,v,p[0],p[1],S);return;}
    const d=dec(v),sh=sheets[d.sid];if(!sh||!sh.img)return;
    if(ANGQ()){if(sh.iso&&sh.A)tileAng(cx,sh.A,d.idx,p[0],p[1],2*S);else if(!sh.iso){cx.save();cx.transform(2*S,0,0,2*S*ANG_R,p[0],p[1]);drawTile(cx,v,0,0,1);cx.restore();}return;}
    if(sh.iso){const sx=(d.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(d.idx/sh.cols)*(sh.tw+sh.margin);if(sh.iso===2)tile192(cx,sh.img,sx,sy,sh.tw,sh.cy||0,p[0],p[1],S,sh.wat&&sh.wat.includes(d.idx)?mirF(gx,gy):0);else slab(cx,sh.img,sx,sy,sh.tw,p[0],p[1],S,d.f||0);return;}
    cx.save();cx.transform(S,S/2,-S,S/2,p[0],p[1]);drawTile(cx,v,0,0,1);cx.restore();}
  function isoBuild(){const W=M.w,H=M.h,nl=sheets.filter(s=>s&&s.img).length;let h=0;
    for(let l=0;l<4;l++){const a=M.layers[l];for(let i=0;i<a.length;i++)h=(h*31+a[i]+i)|0;}
    const want=CELL*view.z*(window.devicePixelRatio||1)*(smoothOn()?1.6:1.1);let CQ=[32,48,64,96,128].find(t=>t>=want)||128;while(W*H*CQ*CQ>3e7&&CQ>8)CQ-=8;
    const key=W+'x'+H+'|'+vis.slice(0,4).join('')+'|'+nl+'|'+h+'|'+CQ+'|'+(smoothOn()?1:0)+'|'+(ANGQ()?'A'+sheets.filter(q=>q&&q.A).length:'I');if(isoC&&isoK===key)return isoC;
    const gnd=document.createElement('canvas');gnd.width=W*CQ;gnd.height=H*CQ;const g=gnd.getContext('2d');g.imageSmoothingEnabled=true;
    const SL=[];
    const SM=smoothOn()&&!ANGQ();
    for(const l of [0,1]){if(!vis[l])continue;const a=M.layers[l];
      if(l===0&&SM){const okB=v=>{const d=dec(v),sh=sheets[d.sid];return !!(sh&&sh.img&&(!sh.iso||(sh.iso===2?!(sh.wat&&sh.wat.includes(d.idx)):!(d.f&4))));};
        for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const sh=sheets[dec(v).sid];if(sh&&sh.img&&sh.iso&&!okB(v))SL.push({x:i%W,y:(i/W)|0,v,l});}
        const paintB=(g2,v,dx,dy,s)=>{const d=dec(v),sh=sheets[d.sid];if(sh.iso){const sx=(d.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(d.idx/sh.cols)*(sh.tw+sh.margin);paintSlab(g2,sh.img,sx,sy,sh.tw,sh.iso===2?(sh.cy||0):0,dx,dy,s,d.f&3);}else drawTile(g2,v,dx,dy,s);};
        bakeLayer0(g,{W,H,Q:CQ,a,paint:paintB,smooth:true,ok:okB});continue;}
      for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const d=dec(v),sh=sheets[d.sid];if(!sh||!sh.img)continue;
      if(sh.iso){SL.push({x:i%W,y:(i/W)|0,v,l});continue;}drawTile(g,v,(i%W)*CQ,((i/W)|0)*CQ,CQ);}}
    if(SM)noiseOverlay(g,W,H,CQ);
    SL.sort(ANGQ()?((a,b)=>(a.y-b.y)||(a.x-b.x)||a.l-b.l):((a,b)=>(a.x+a.y)-(b.x+b.y)||a.l-b.l));
    const mkG=Ls=>{const out=[],oc=new Uint8Array(W*H),lab=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++)oc[i]=Ls.some(l=>vis[l]&&M.layers[l][i])?1:0;
    for(let i=0;i<W*H;i++){if(!oc[i]||lab[i])continue;const st=[i],cells=[];lab[i]=1;let x0=W,y0=H,x1=-1,y1=-1;
      while(st.length){const c=st.pop();cells.push(c);const x=c%W,y=(c/W)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=W||ny>=H)continue;const q=ny*W+nx;if(oc[q]&&!lab[q]){lab[q]=1;st.push(q);}}}
      const bw=x1-x0+1,bh=y1-y0+1,c=document.createElement('canvas');c.width=bw*CQ;c.height=bh*CQ;const g2=c.getContext('2d');g2.imageSmoothingEnabled=true;
      for(const l of Ls){if(!vis[l])continue;for(const ci of cells){const v=M.layers[l][ci];if(v)drawTile(g2,v,((ci%W)-x0)*CQ,(((ci/W)|0)-y0)*CQ,CQ);}}
      out.push({c,xc:(x0+x1+1)/2,yb:y1+1});}return out;};
    const GR=mkG([2]),OV=mkG([3]);
    isoK=key;return isoC={gnd,CQ,SL,GR,OV};}
  function drawIso(){const AG=ANGQ();if(AG&&angN!==sheets.length){angN=sheets.length;ensureAngle(sheets).then(m=>{isoK='';dirty=true;if(m&&m.length)toast('Chưa có bộ Angle cho: '+m.join(', ')+' — phần đó sẽ không hiện ở chiếu Angle');});}
    const B=isoBuild(),S=CELL*view.z,w=cv.clientWidth,h=cv.clientHeight,O=g2s(0,0),sc=S/.75;
    cx.save();cx.imageSmoothingEnabled=true;if(AG)cx.transform(2*S/B.CQ,0,0,2*S*ANG_R/B.CQ,O[0],O[1]);else cx.transform(S/B.CQ,S/(2*B.CQ),-S/B.CQ,S/(2*B.CQ),O[0],O[1]);cx.drawImage(B.gnd,0,0);cx.restore();cx.imageSmoothingEnabled=false;
    for(const q of B.SL){const p=g2s(q.x,q.y);if(p[0]>w+S||p[0]<-2*S||p[1]>h||p[1]<-2*S)continue;tileG(q.v,q.x,q.y);}
    if(!AG){const wc=B.SL.filter(q=>(dec(q.v).f&4));if(wc.length)shore(cx,wc,(x,y)=>g2s(x,y),S);}
    const items=[];for(const g of B.GR)items.push({k:AG?g.yb:g.yb+g.xc,g});
    for(const e of M.ents){items.push({k:AG?(e.t==='deco'?(e.flat?-1e4+e.y:depthAng(e)):e.y+.5):(e.t==='deco'?(e.flat?-1e4+e.x+e.y:e.x+e.y+1):e.x+e.y+1),e});}
    items.sort((a,b)=>a.k-b.k);isoHB=[];const COV=[];const cur=tool==='obj'||tool==='zone';
    for(const it of items){
      if(it.g){const g=it.g,k2=sc*.95/B.CQ,wp=AG?g.c.width*2*S/B.CQ:g.c.width*k2,hp=AG?g.c.height*2*S*ANG_R/B.CQ:g.c.height*k2,p=g2s(g.xc,g.yb);cx.imageSmoothingEnabled=true;cx.drawImage(g.c,p[0]-wp/2,p[1]-hp,wp,hp);cx.imageSmoothingEnabled=false;continue;}
      const e=it.e,sel=e.id===selId;
      if(e.t==='deco'&&e.flat&&!vis[1])continue;
      if(e.t==='deco'){const sh0=e.tile&&sheets[e.tile.sid],sp=sprOf(e,sh0,AG),ws=((sp?sp.sc:e.sc)||3)*sc,p=AG?g2s(e.x+.5,e.y+1):g2s(e.x+1,e.y+1);
        const rx=p[0]-ws/2+(e.ox||0)*ws,ry=p[1]-ws+((sp?sp.oy:e.oy)||0)*ws;
        if(sp&&sp.img){const sx=(e.tile.idx%sp.cols)*(sp.tw+sp.margin),sy=Math.floor(e.tile.idx/sp.cols)*(sp.tw+sp.margin);cx.imageSmoothingEnabled=true;cx.drawImage(sp.img,sx,sy,sp.tw,sp.tw,rx,ry,ws,ws);cx.imageSmoothingEnabled=false;}
        if(e.cv&&vis[3])COV.push({cv:e.cv,rx,ry,ws});
        const zb=e.zb||[-(e.fx||1),-(e.fy||1),e.fx||1,e.fy||1],fx=-zb[0],fy=-zb[1];
        if(sel||(cur&&view.z>=.8)){cx.lineWidth=sel?2.5:1;cx.strokeStyle=sel?'#ffd24a':'rgba(217,160,102,.7)';if(e.zp&&e.zp.length>2){const dz=decoZones([e])[0];zPath(cx,dz,g2s);}else pathQ(e.x+1+zb[0],e.y+1+zb[1],zb[2],zb[3]);cx.stroke();if(sel){cx.setLineDash([5,3]);cx.strokeRect(rx+ws*.2,ry+ws*.15,ws*.6,ws*.85);cx.setLineDash([]);}}
        isoHB.push({e,r:[rx+ws*.25,ry+ws*.3,rx+ws*.75,ry+ws],f:[e.x+1+zb[0],e.y+1+zb[1],e.x+1+zb[0]+zb[2],e.y+1+zb[1]+zb[3]]});continue;}
      const p=g2s(e.x+.5,e.y+.5),col=OT[e.t][2],sz=S*1.5;
      cx.lineWidth=sel?3:1.5;cx.strokeStyle=col;pathQ(e.x,e.y,1,1);cx.stroke();
      if(e.tile){tileG0(enc(e.tile.sid,e.tile.idx),p[0]-sz/2,p[1]-sz*.85,sz);}
      else{let ok=false;if(e.anim){try{const A=isoAN();if(A){A.drawChar(cx,{x:0,y:0,dir:0,vx:0,vy:0},e.anim,p[0],p[1]+S*.1,sc,0,{iso:true});ok=true;}}catch(_){}}
        if(!ok){cx.fillStyle=col+'55';pathQ(e.x,e.y,1,1);cx.fill();}
        if(view.z>=.9){cx.font='bold '+Math.max(9,S*.5)+'px system-ui';cx.textAlign='center';cx.textBaseline='alphabetic';const t=e.name||OT[e.t][1],w=cx.measureText(t).width+6;cx.fillStyle='#000b';cx.fillRect(p[0]-w/2,p[1]-sz*.95-2,w,Math.max(11,S*.5)+4);cx.fillStyle=col;cx.fillText(t,p[0],p[1]-sz*.95+Math.max(9,S*.5)-1);}}
      isoHB.push({e,r:[p[0]-sz/2,p[1]-sz*.85,p[0]+sz/2,p[1]+S*.1],f:[e.x,e.y,e.x+1,e.y+1]});}
    for(const g of B.OV){const k2=sc*.95/B.CQ,wp=AG?g.c.width*2*S/B.CQ:g.c.width*k2,hp=AG?g.c.height*2*S*ANG_R/B.CQ:g.c.height*k2,p=g2s(g.xc,g.yb);cx.imageSmoothingEnabled=true;cx.drawImage(g.c,p[0]-wp/2,p[1]-hp,wp,hp);cx.imageSmoothingEnabled=false;}
    for(const c of COV){const sh=sheets[c.cv.sid];if(!sh||!sh.img)continue;const sx=(c.cv.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(c.cv.idx/sh.cols)*(sh.tw+sh.margin);cx.imageSmoothingEnabled=true;cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,c.rx,c.ry,c.ws,c.ws);cx.imageSmoothingEnabled=false;}
    drawFog(cx,w,h,fogLv(),0,-view.x,-view.y);}
  let anC=null,anK='';function isoAN(){const k=((M.cfg.anims||[]).length)+'|'+sheets.filter(q=>q&&q.img).length;if(anC&&anK===k)return anC;anK=k;return anC=makeAnims(M.cfg,sheets);}
  function tileG0(v,x,y,s){drawTile(cx,v,x,y,s);}
  function entAtScreen(px,py){const g=s2g(px,py);for(let i=isoHB.length-1;i>=0;i--){const b=isoHB[i],r=b.r;if(px>=r[0]&&px<=r[2]&&py>=r[1]&&py<=r[3])return b.e;}
    for(let i=isoHB.length-1;i>=0;i--){const f=isoHB[i].f;if(g.x>=f[0]&&g.x<f[2]&&g.y>=f[1]&&g.y<f[3])return isoHB[i].e;}return null;}
  // ===== render =====
  function render(){if(!M)return;const w=cv.clientWidth,h=cv.clientHeight,dp=Math.min(devicePixelRatio||1,2);
    if(cv.width!==Math.round(w*dp)||cv.height!==Math.round(h*dp)){cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);dirty=true;}
    if(!dirty)return;dirty=false;
    cx.setTransform(dp,0,0,dp,0,0);cx.fillStyle='#10161d';cx.fillRect(0,0,w,h);cx.imageSmoothingEnabled=false;
    const z=view.z,IS=ISOQ();
    if(IS){drawIso();cx.strokeStyle='#ffffff55';cx.lineWidth=1;pathQ(0,0,M.w,M.h);cx.stroke();}else{rebuild();cx.drawImage(mc,view.x,view.y,M.w*CELL*z,M.h*CELL*z);cx.strokeStyle='#ffffff55';cx.lineWidth=1;cx.strokeRect(view.x-.5,view.y-.5,M.w*CELL*z+1,M.h*CELL*z+1);}
    if(vis[4]||colMode){const walk=colMode===2;for(let i=0;i<M.blk.length;i++){const b=M.blk[i];if(!b&&!walk)continue;cx.fillStyle=b?'rgba(255,40,40,.45)':'rgba(40,220,90,.14)';if(IS){pathQ(i%M.w,Math.floor(i/M.w),1,1);cx.fill();}else cx.fillRect(view.x+(i%M.w)*CELL*z,view.y+Math.floor(i/M.w)*CELL*z,CELL*z,CELL*z);}}
    if(vis[4]||colMode){cx.fillStyle='rgba(255,40,40,.5)';cx.strokeStyle='rgba(255,120,120,.9)';cx.lineWidth=1;for(const q of decoZones(M.ents)){zPath(cx,q,g2s);cx.fill();cx.stroke();}}
    drawZ();
    if(grid&&z>=(IS?1.1:2.5)){cx.strokeStyle='rgba(255,255,255,.13)';cx.beginPath();if(IS){for(let x=0;x<=M.w;x++){const a=g2s(x,0),b=g2s(x,M.h);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}for(let y=0;y<=M.h;y++){const a=g2s(0,y),b=g2s(M.w,y);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}}else{for(let x=0;x<=M.w;x++){const X=Math.round(view.x+x*CELL*z)+.5;cx.moveTo(X,view.y);cx.lineTo(X,view.y+M.h*CELL*z);}for(let y=0;y<=M.h;y++){const Y=Math.round(view.y+y*CELL*z)+.5;cx.moveTo(view.x,Y);cx.lineTo(view.x+M.w*CELL*z,Y);}}cx.stroke();}
    if(hov&&(tool==='draw'||tool==='rect'||tool==='fill')&&act<4){cx.globalAlpha=.65;for(let j=0;j<stamp.h;j++)for(let i=0;i<stamp.w;i++){const v=stamp.multi?(stamp.layers.find(l=>l&&l[j*stamp.w+i])||[])[j*stamp.w+i]||0:stamp.tiles[j*stamp.w+i];const vv=tool==='draw'?v:stamp.tiles[0]||v;if(IS)tileG(vv,hov.x+i,hov.y+j);else drawTile(cx,vv,view.x+(hov.x+i)*CELL*z,view.y+(hov.y+j)*CELL*z,CELL*z);if(tool!=='draw')break;}cx.globalAlpha=1;}
    if(!IS)drawEnts(z);
    if(tool==='paste'&&clip&&hov){const o=pOrg();cx.globalAlpha=.7;for(let j=0;j<clip.h;j++)for(let i=0;i<clip.w;i++){for(let l=0;l<4;l++){const v=clip.layers[l][j*clip.w+i];if(v)tileG(v,o.x+i,o.y+j);}if(clip.blk&&clip.blk[j*clip.w+i]){cx.fillStyle='rgba(255,40,40,.4)';pathQ(o.x+i,o.y+j,1,1);cx.fill();}}
      for(const e of clip.ents){if(e.tile)tileG(enc(e.tile.sid,e.tile.idx),o.x+e.dx,o.y+e.dy);cx.strokeStyle=OT[e.t]?OT[e.t][2]:'#fff';cx.lineWidth=2;pathQ(o.x+e.dx,o.y+e.dy,1,1);cx.stroke();}
      cx.globalAlpha=1;cx.strokeStyle='#3ddc84';cx.lineWidth=2;cx.setLineDash([5,3]);pathQ(o.x,o.y,clip.w,clip.h);cx.stroke();cx.setLineDash([]);}
    if(hov&&tool!=='paste'){cx.strokeStyle='#ffd24a';cx.lineWidth=2;const ww=(tool==='draw'?stamp.w:1),hh=(tool==='draw'?stamp.h:1);pathQ(hov.x,hov.y,ww,hh);cx.stroke();}
    if(sel||drag&&drag.rect){const r=sel||drag.rect;const x0=Math.min(r.x0,r.x1),y0=Math.min(r.y0,r.y1),x1=Math.max(r.x0,r.x1),y1=Math.max(r.y0,r.y1);cx.setLineDash([6,4]);cx.strokeStyle='#4fd1ff';cx.lineWidth=2;pathQ(x0,y0,x1-x0+1,y1-y0+1);cx.stroke();cx.setLineDash([]);}
  }
  (function loop(){render();requestAnimationFrame(loop);})();
  // ===== thao tác =====
  const inb=(x,y)=>x>=0&&y>=0&&x<M.w&&y<M.h;
  function put(x,y,v,l=act){if(!inb(x,y))return;(l===4?M.blk:M.layers[l])[y*M.w+x]=v;}
  function get(x,y,l=act){return inb(x,y)?(l===4?M.blk:M.layers[l])[y*M.w+x]:0;}
  function paste(x,y){if(act===4){put(x,y,1);return;}if(!stamp.multi&&stamp.tiles&&stamp.tiles.length===1)noteRecent(stamp.tiles[0]);
    for(let j=0;j<stamp.h;j++)for(let i=0;i<stamp.w;i++){if(stamp.multi){for(let l=0;l<4;l++){const v=stamp.layers[l]&&stamp.layers[l][j*stamp.w+i];if(v)put(x+i,y+j,v,l);}}else{const v=stamp.tiles[j*stamp.w+i];if(v)put(x+i,y+j,v);}}}
  function erase(x,y){put(x,y,0);}
  function fill(x,y){const t=get(x,y);const nv=act===4?1:(stamp.multi?0:stamp.tiles[0]);if(act!==4&&!nv&&!stamp.multi)return;const rep=act===4?1:nv;if(t===rep&&!stamp.multi)return;
    const st=[[x,y]],seen=new Set();let n=0;while(st.length&&n<6000){const [a,b]=st.pop();const k=a+','+b;if(!inb(a,b)||seen.has(k)||get(a,b)!==t)continue;seen.add(k);put(a,b,rep);n++;st.push([a+1,b],[a-1,b],[a,b+1],[a,b-1]);}}
  function rectFill(r){const x0=Math.min(r.x0,r.x1),y0=Math.min(r.y0,r.y1),x1=Math.max(r.x0,r.x1),y1=Math.max(r.y0,r.y1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(act===4){put(x,y,1);continue;}if(stamp.multi)continue;const v=stamp.tiles[((y-y0)%stamp.h)*stamp.w+((x-x0)%stamp.w)];put(x,y,v);}}
  function pick(x,y){let l=act,v=get(x,y,l);if(l<4&&!v){for(let k=3;k>=0;k--){if(get(x,y,k)){l=k;v=get(x,y,k);break;}}if(v){act=l;ui.layers&&ui.layers();toast('Hút từ lớp '+LAYN[l]);}}
    if(v&&l<4){stamp={w:1,h:1,multi:false,tiles:[v]};ui.stamp();}}
  function copySel(cut){if(!sel)return;const x0=Math.min(sel.x0,sel.x1),y0=Math.min(sel.y0,sel.y1),x1=Math.max(sel.x0,sel.x1),y1=Math.max(sel.y0,sel.y1);const w=x1-x0+1,h=y1-y0+1;
    const layers=[0,1,2,3].map(l=>{const a=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)a.push(get(x0+i,y0+j,l));return a;});
    stamp={w,h,multi:true,layers,tiles:layers[0]};if(cut){pushUndo();for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(let l=0;l<4;l++)put(x0+i,y0+j,0,l);after();}
    tool='draw';ui.tools();ui.stamp();toast('Đã lấy '+w+'×'+h+' ô làm stamp — chạm bản đồ để dán');}
  function selRect(){if(!sel||!M)return null;const x0=Math.max(0,Math.min(sel.x0,sel.x1)),y0=Math.max(0,Math.min(sel.y0,sel.y1)),x1=Math.min(M.w-1,Math.max(sel.x0,sel.x1)),y1=Math.min(M.h-1,Math.max(sel.y0,sel.y1));return {x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1};}
  const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  function copyArea(cut){const r=selRect();if(!r){toast('Chưa chọn vùng — kéo trên bản đồ');return;}
    const grab=l=>{const a=[];for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)a.push(get(r.x0+i,r.y0+j,l));return a;};
    const layers=[0,1,2,3].map(grab),blk=grab(4);
    const ents=inclEnt?M.ents.filter(e=>e.t!=='start'&&e.x>=r.x0&&e.x<=r.x1&&e.y>=r.y0&&e.y<=r.y1).map(e=>{const c=JSON.parse(JSON.stringify(e));c.dx=e.x-r.x0;c.dy=e.y-r.y0;return c;}):[];
    clip={w:r.w,h:r.h,layers:layers.map(a=>a.slice()),blk:inclBlk?blk:null,ents};
    stamp={w:r.w,h:r.h,multi:true,layers,tiles:layers[0]};
    if(cut){pushUndo();for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++){for(let l=0;l<4;l++)put(r.x0+i,r.y0+j,0,l);if(inclBlk)put(r.x0+i,r.y0+j,0,4);}
      if(inclEnt)M.ents=M.ents.filter(e=>e.t==='start'||e.x<r.x0||e.x>r.x1||e.y<r.y0||e.y>r.y1);selId=null;after();}
    toast((cut?'Đã cắt ':'Đã sao chép ')+r.w+'×'+r.h+' ô'+(ents.length?' + '+ents.length+' đối tượng':'')+' — bấm 📥 Dán');ui.tools();ui.stamp();dirty=true;if(simple){tool='paste';draw();toast('Đã '+(cut?'cắt':'sao chép')+' — bấm lên bản đồ để dán');}}
  function startPaste(){if(!clip){toast('Chưa sao chép gì — chọn vùng rồi bấm Sao chép');return;}tool='paste';draw();toast('Chạm/kéo trên bản đồ để dán');}
  const pOrg=()=>hov&&clip?{x:hov.x-Math.floor(clip.w/2),y:hov.y-Math.floor(clip.h/2)}:null;
  function pasteClip(x0,y0){if(!clip)return 0;let n=0;
    for(let j=0;j<clip.h;j++)for(let i=0;i<clip.w;i++){for(let l=0;l<4;l++){const v=clip.layers[l][j*clip.w+i];if(v)put(x0+i,y0+j,v,l);}if(clip.blk&&clip.blk[j*clip.w+i])put(x0+i,y0+j,1,4);}
    for(const e of clip.ents){const nx=x0+e.dx,ny=y0+e.dy;if(!inb(nx,ny))continue;const c=JSON.parse(JSON.stringify(e));delete c.dx;delete c.dy;c.id=newId();c.x=nx;c.y=ny;M.ents.push(c);n++;}
    return n;}
  function clearSel(all){if(!sel)return;pushUndo();const x0=Math.min(sel.x0,sel.x1),y0=Math.min(sel.y0,sel.y1),x1=Math.max(sel.x0,sel.x1),y1=Math.max(sel.y0,sel.y1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(all)for(let l=0;l<5;l++)put(x,y,0,l);else put(x,y,0);}
    if(all||act===2){M.ents=M.ents.filter(e=>e.t==='start'||e.x<x0||e.x>x1+1||e.y<y0||e.y>y1+1);selId=null;}after();}
  // ===== thao tác nhanh trên vùng đang chọn (như bên 3D) =====
  function grabR(r){const g=l=>{const a=[];for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)a.push(get(r.x0+i,r.y0+j,l));return a;};return {L:[0,1,2,3,4].map(g),E:M.ents.filter(e=>e.t!=='start'&&e.x>=r.x0&&e.x<=r.x1&&e.y>=r.y0&&e.y<=r.y1)};}
  function clearR(r){for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)for(let l=0;l<5;l++)put(r.x0+i,r.y0+j,0,l);}
  function putR(g,r,nx,ny,onlySet){for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)for(let l=0;l<5;l++){const v=g.L[l][j*r.w+i];if(!onlySet||v)put(nx+i,ny+j,v,l);}}
  function selMove(dx,dy){const r=selRect();if(!r)return;const nx=r.x0+dx,ny=r.y0+dy;if(nx<0||ny<0||nx+r.w>M.w||ny+r.h>M.h){toast('Chạm mép bản đồ');return;}
    pushUndo();const g=grabR(r);clearR(r);putR(g,r,nx,ny);for(const e of g.E){e.x+=dx;e.y+=dy;}sel={x0:nx,y0:ny,x1:nx+r.w-1,y1:ny+r.h-1};after();ui.sel&&ui.sel();}
  function selDup(){const r=selRect();if(!r)return;let nx=r.x0+r.w,ny=r.y0;if(nx+r.w>M.w){nx=r.x0;ny=r.y0+r.h;}if(ny+r.h>M.h){toast('Không còn chỗ để nhân bản');return;}
    pushUndo();const g=grabR(r);putR(g,r,nx,ny,true);for(const e of g.E){const c=JSON.parse(JSON.stringify(e));c.id=newId();c.x=nx+(e.x-r.x0);c.y=ny+(e.y-r.y0);M.ents.push(c);}
    sel={x0:nx,y0:ny,x1:nx+r.w-1,y1:ny+r.h-1};after();ui.sel&&ui.sel();toast('Đã nhân bản — bản sao đang được chọn');}
  function selFlip(){const r=selRect();if(!r)return;pushUndo();const g=grabR(r);
    for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)for(let l=0;l<5;l++){let v=g.L[l][j*r.w+(r.w-1-i)];if(v&&l<4){const d=dec(v);v=enc(d.sid,d.idx,d.f^1);}put(r.x0+i,r.y0+j,v,l);}
    for(const e of g.E)e.x=r.x0+(r.x1-e.x);after();toast('Đã lật ngang vùng chọn');}
  function selCluster(c0){if(!c0||!inb(c0.x,c0.y))return;const has=(x,y)=>inb(x,y)&&(M.layers[1][y*M.w+x]||M.layers[2][y*M.w+x]||M.layers[3][y*M.w+x]||M.blk[y*M.w+x]||M.ents.some(e=>e.x===x&&e.y===y));
    if(!has(c0.x,c0.y)){toast('Ô này trống — trỏ vào công trình rồi nhấn Enter');return;}
    const seen=new Set([c0.x+','+c0.y]),st=[[c0.x,c0.y]];let x0=c0.x,x1=c0.x,y0=c0.y,y1=c0.y;
    while(st.length&&seen.size<5000){const [a,b]=st.pop();for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=a+dx,y=b+dy,k=x+','+y;if(seen.has(k)||!has(x,y))continue;seen.add(k);st.push([x,y]);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
    sel={x0,y0,x1,y1};tool='select';ui.tools&&ui.tools();ui.sel&&ui.sel();dirty=true;toast('Đã chọn cả cụm '+(x1-x0+1)+'×'+(y1-y0+1)+' ô');}
  function selFocus(){const r=selRect();if(!r)return;const W=cv.clientWidth,H=cv.clientHeight;if(ISOQ()){const n=r.w+r.h+4;view.z=Math.max(.01,Math.min(16,Math.min(W/(n*CELL),H/(n*CELL*.5))));const q=g2s(r.x0+r.w/2,r.y0+r.h/2),S0=g2s(0,0);view.x+=W/2-q[0];view.y+=H/2-q[1];dirty=true;return;}
    view.z=Math.max(.01,Math.min(16,Math.min(W/(r.w*CELL+4*CELL),H/(r.h*CELL+4*CELL))));view.x=W/2-(r.x0+r.w/2)*CELL*view.z;view.y=H/2-(r.y0+r.h/2)*CELL*view.z;dirty=true;}
  // ===== con trỏ =====
  const P=new Map();let drag=null,gest=null;
  const cellAt=(px,py)=>{const g=s2g(px,py);return {x:Math.floor(g.x),y:Math.floor(g.y)};};
  const pos=e=>{const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const p=pos(e);P.set(e.pointerId,p);
    if(P.size===2){drag=null;const [a,b]=[...P.values()];gest={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return;}
    if(e.button===1||e.button===2||tool==='pan'||e.buttons===4){drag={pan:true,x:p.x,y:p.y,vx:view.x,vy:view.y};return;}
    const c=cellAt(p.x,p.y);hov=c;lastPt=p;
    if(fillArm&&sel&&tool==='draw'){const r=selRect();if(r&&c.x>=r.x0&&c.x<=r.x1&&c.y>=r.y0&&c.y<=r.y1){pushUndo();rectFill(r);after();toast('Đã đổ vào vùng chọn '+r.w+'×'+r.h+' — bấm ↶ nếu muốn hủy');dirty=true;return;}fillArm=false;}
    if(tool==='zone'){zDown(p,e);dirty=true;return;}
    if(tool==='obj'){objDown(c);dirty=true;return;}
    if(tool==='draw'||tool==='erase'||tool==='fill'||tool==='pick'){pushUndo();
      if(tool==='draw'){paste(c.x,c.y);drag={sx:c.x,sy:c.y,last:c};}else if(tool==='erase'){erase(c.x,c.y);drag={last:c};}else if(tool==='fill'){fill(c.x,c.y);drag=null;}else{pick(c.x,c.y);undo.pop();drag=null;}after();}
    else if(tool==='paste'){if(!clip){toast('Chưa có gì để dán — dùng Chọn vùng → Sao chép');return;}drag={paste:true};}
    else if(tool==='rect'||tool==='select'){drag={rect:{x0:c.x,y0:c.y,x1:c.x,y1:c.y}};if(tool==='select'){sel=null;ui.sel();}}
    dirty=true;});
  cv.addEventListener('pointermove',e=>{const p=pos(e);if(P.has(e.pointerId))P.set(e.pointerId,p);
    if(P.size===2&&gest){const [a,b]=[...P.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),ccx=(a.x+b.x)/2,ccy=(a.y+b.y)/2;const nz=Math.max(.01,Math.min(16,view.z*d/gest.d));const k=nz/view.z;
      view.x=ccx-(gest.cx-view.x)*k;view.y=ccy-(gest.cy-view.y)*k;view.z=nz;gest={d,cx:ccx,cy:ccy};dirty=true;return;}
    const c=cellAt(p.x,p.y);if(!hov||hov.x!==c.x||hov.y!==c.y){hov=c;dirty=true;}
    if(tool==='zone'&&!(drag&&drag.pan)){zMoveE(p,e);return;}
    if(!drag)return;
    if(drag.pan){view.x=drag.vx+p.x-drag.x;view.y=drag.vy+p.y-drag.y;dirty=true;return;}
    if(drag.rect){drag.rect.x1=c.x;drag.rect.y1=c.y;dirty=true;return;}
    if(drag.ent){const q=selEnt(),nx=c.x-(drag.dx||0),ny=c.y-(drag.dy||0);if(q&&inb(nx,ny)&&(q.x!==nx||q.y!==ny)){q.x=nx;q.y=ny;dirty=true;}return;}
    if(e.shiftKey&&tool==='draw'&&drag.sx!=null&&(drag.last.x!==c.x||drag.last.y!==c.y)){drag.last=c;const dx=c.x-drag.sx,dy=c.y-drag.sy,hz=Math.abs(dx)>=Math.abs(dy),sw=Math.max(1,stamp.w),sh=Math.max(1,stamp.h);const n=hz?Math.floor(Math.abs(dx)/sw):Math.floor(Math.abs(dy)/sh);for(let q=0;q<=n;q++)paste(drag.sx+(hz?Math.sign(dx||1)*q*sw:0),drag.sy+(hz?0:Math.sign(dy||1)*q*sh));after();return;}
    if(drag.last&&(drag.last.x!==c.x||drag.last.y!==c.y)){drag.last=c;if(tool==='draw'){if(stamp.w===1&&stamp.h===1||((c.x-drag.sx)%stamp.w===0&&(c.y-drag.sy)%stamp.h===0))paste(c.x,c.y);}else if(tool==='erase')erase(c.x,c.y);after();}});
  const end=e=>{P.delete(e.pointerId);if(P.size<2)gest=null;if(zd){zUp();dirty=true;return;}if(!drag)return;
    if(drag.paste){const o=pOrg();if(o&&e.type!=='pointercancel'){pushUndo();const n=pasteClip(o.x,o.y);after();toast('Đã dán'+(n?' + '+n+' đối tượng':''));}drag=null;dirty=true;return;}
    if(drag.ent){after();ui.obj();}
    if(drag.rect){if(tool==='rect'){pushUndo();rectFill(drag.rect);after();}else{sel=drag.rect;ui.sel();}}drag=null;dirty=true;};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hov=null;dirty=true;}});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);const nz=Math.max(.01,Math.min(16,view.z*(e.deltaY<0?1.15:1/1.15)));const k=nz/view.z;view.x=p.x-(p.x-view.x)*k;view.y=p.y-(p.y-view.y)*k;view.z=nz;dirty=true;},{passive:false});
  // ===== VÙNG CHẶN (hình học) =====
  let zsel=null,zk='rect',zmode='edit',zsnap=.5,zpend=null,zd=null,zu=false,zw=null;
  const ZL=()=>M&&(M.cfg.zones||(M.cfg.zones=[]));
  const zget=id=>M&&M.cfg.zones&&M.cfg.zones.find(q=>q.id===id);
  const W2=p=>s2g(p.x,p.y);
  const sn=v=>zsnap?Math.round(v/zsnap)*zsnap:v;
  const snp=w=>({x:sn(w.x),y:sn(w.y)});
  const zpu=()=>{if(!zu){pushUndo();zu=true;}};
  function zFinish(){if(!zpend)return;zpend.pts=zpend.pts.filter((q,i,A)=>!i||Math.hypot(q[0]-A[i-1][0],q[1]-A[i-1][1])>.05);const n=zpend.k==='poly'?3:2;if(zpend.pts.length<n){toast('Cần ít nhất '+n+' điểm');return;}pushUndo();const q=mkPts(zpend.k,zpend.pts);ZL().push(q);zsel=q.id;zpend=null;zmode='edit';after();ui.tools();toast('Đã tạo vùng chặn');}
  function zDown(p,e){zu=false;const w=W2(p),q=snp(w),S=CELL*view.z,tol=11/S;
    if(zpend){const now=performance.now(),last=zpend.pts[zpend.pts.length-1];
      if(zpend.pts.length>=1&&now-zpend.t<380&&Math.hypot(q.x-last[0],q.y-last[1])<tol*1.5){zFinish();return;}
      if(zpend.k==='poly'&&zpend.pts.length>=3&&Math.hypot(q.x-zpend.pts[0][0],q.y-zpend.pts[0][1])<tol*1.4){zFinish();return;}
      zpend.pts.push([q.x,q.y]);zpend.t=now;dirty=true;return;}
    if(zmode==='draw'){
      if(isBox({k:zk})){zd={m:'new',p0:q,moved:false};return;}
      zpend={k:zk,pts:[[q.x,q.y]],t:performance.now()};dirty=true;ui.tools();return;}
    const sz=zsel&&zget(zsel);
    if(sz){const hs=zHandles(sz,1.2);let best=null,bd=tol;for(const h of hs){const d=Math.hypot(h.x-w.x,h.y-w.y);if(d<bd){bd=d;best=h;}}
      if(best){
        if(best.t==='v'&&(e.shiftKey||e.altKey||e.button===2)){const mn=sz.k==='poly'?3:2;if(sz.pts.length>mn){pushUndo();sz.pts.splice(best.i,1);after();ui.tools();}return;}
        if(best.t==='m'){zpu();sz.pts.splice(best.i+1,0,[best.x,best.y]);zd={m:'vtx',i:best.i+1,z0:null};dirty=true;return;}
        zd={m:best.t==='h'?'hdl':best.t==='rot'?'rot':'vtx',i:best.i,z0:JSON.parse(JSON.stringify(sz))};return;}}
    for(let i=ZL().length-1;i>=0;i--){const t=ZL()[i];if(zHit(t,w.x,w.y,t.k==='line'?tol*.6:0)){zsel=t.id;zd={m:'move',z0:JSON.parse(JSON.stringify(t)),st:w};ui.tools();dirty=true;return;}}
    zsel=null;ui.tools();dirty=true;}
  function zMoveE(p,e){zw=W2(p);const w=zw,q=snp(w);dirty=true;if(!zd)return;const sz=zsel&&zget(zsel);
    if(zd.m==='new'){const a=zd.p0;if(!zd.moved&&Math.hypot(q.x-a.x,q.y-a.y)<.2)return;zd.moved=true;zpu();let z=zd.z;if(!z){z=zd.z=mkBox(zk,a.x,a.y,1,1);ZL().push(z);zsel=z.id;}
      z.x=Math.min(a.x,q.x);z.y=Math.min(a.y,q.y);z.w=Math.max(.25,Math.abs(q.x-a.x));z.h=Math.max(.25,Math.abs(q.y-a.y));if(e.shiftKey){const m=Math.max(z.w,z.h);z.w=z.h=m;if(q.x<a.x)z.x=a.x-m;if(q.y<a.y)z.y=a.y-m;}return;}
    if(!sz)return;
    if(zd.m==='move'){zpu();const dx=sn(w.x-zd.st.x),dy=sn(w.y-zd.st.y);const z0=JSON.parse(JSON.stringify(zd.z0));zMove(z0,dx,dy);Object.assign(sz,z0);return;}
    if(zd.m==='hdl'){zpu();const z0=zd.z0;zDragHandle(sz,z0,zd.i,q.x,q.y,e.shiftKey);return;}
    if(zd.m==='rot'){zpu();const [cx,cy]=zCenter(sz);let a=Math.atan2(w.y-cy,w.x-cx)*180/Math.PI+90;if(e.shiftKey||zsnap)a=Math.round(a/15)*15;sz.rot=((a%360)+360)%360;return;}
    if(zd.m==='vtx'){zpu();sz.pts[zd.i]=[q.x,q.y];return;}}
  function zUp(){if(zd&&zd.m==='new'&&!zd.moved){pushUndo();const a=zd.p0,z=mkBox(zk,a.x-1,a.y-1,2,2);ZL().push(z);zsel=z.id;zmode='edit';ui.tools();}
    else if(zd&&zd.m==='new'&&zd.z){zmode='edit';ui.tools();}
    zd=null;after();}
  function drawZ(){const zs=M.cfg.zones||[];if(!zs.length&&!zpend)return;const S=CELL*view.z,T=g2s,act=tool==='zone',fa=act?1:.55;cx.save();
    for(const q of zs){const on=act&&q.id===zsel;
      if(q.k==='line'){cx.lineJoin='round';cx.lineCap='round';cx.strokeStyle=on?`rgba(255,190,60,${.5*fa})`:`rgba(255,40,40,${.42*fa})`;if(ISOQ()){cx.save();cx.transform(S,S/2,-S,S/2,view.x,view.y);cx.lineWidth=q.th||.6;zPath(cx,q,(x,y)=>[x,y]);cx.stroke();cx.restore();}else{cx.lineWidth=(q.th||.6)*S;zPath(cx,q,T);cx.stroke();}zPath(cx,q,T);cx.lineWidth=1.5;cx.strokeStyle=on?'#ffd24a':`rgba(255,106,106,${fa})`;cx.stroke();}
      else{zPath(cx,q,T);cx.fillStyle=on?`rgba(255,190,60,${.35*fa})`:`rgba(255,40,40,${.38*fa})`;cx.fill();cx.lineWidth=on?2:1.5;cx.strokeStyle=on?'#ffd24a':`rgba(255,106,106,${fa})`;cx.stroke();}}
    if(zpend){const P=zpend.pts.map(a=>T(a[0],a[1]));cx.lineWidth=2;cx.strokeStyle='#ffd24a';cx.beginPath();P.forEach((a,i)=>i?cx.lineTo(a[0],a[1]):cx.moveTo(a[0],a[1]));if(zw){const h=T(sn(zw.x),sn(zw.y));cx.lineTo(h[0],h[1]);}cx.stroke();cx.fillStyle='#ffd24a';for(const a of P){cx.beginPath();cx.arc(a[0],a[1],4,0,6.3);cx.fill();}}
    const sz=act&&zsel&&zget(zsel);
    if(sz){const hs=zHandles(sz,1.2);cx.lineWidth=1.5;if(isBox(sz)){const t=hs.find(h=>h.t==='rot'),c=T(...zCenter(sz)),top=T(...(()=>{const l=zHandles(sz,0).find(h=>h.t==='rot');return [l.x,l.y];})()),tr=T(t.x,t.y);cx.strokeStyle='#ffd24a';cx.beginPath();cx.moveTo(top[0],top[1]);cx.lineTo(tr[0],tr[1]);cx.stroke();}
      for(const h of hs){const a=T(h.x,h.y);cx.fillStyle=h.t==='rot'?'#4ad6ff':h.t==='m'?'#fff8':'#fff';cx.strokeStyle='#222';cx.beginPath();if(h.t==='h'||h.t==='v'){cx.rect(a[0]-5,a[1]-5,10,10);}else cx.arc(a[0],a[1],h.t==='m'?3.5:6,0,6.3);cx.fill();cx.stroke();}}
    cx.restore();}
  function zoneUI(){const box=el('div',{style:'border:1px solid #c0503a;border-radius:10px;padding:8px;margin:6px 0'});
    box.append(el('div',{class:'row'},el('b',{},'🚧 Vùng chặn hình học (không cần ảnh)')));
    box.append(el('div',{class:'row'},Object.keys(ZK).map(k=>btn(ZK[k][0]+' '+ZK[k][1],()=>{zk=k;zmode='draw';zpend=null;draw();},(zmode==='draw'&&zk===k)?'on':'')),btn('✋ Chọn / sửa',()=>{zmode='edit';zpend=null;draw();dirty=true;},zmode==='edit'?'on':'')));
    const sl=el('select',{class:'num',style:'min-width:130px',onchange:e=>{zsnap=+e.target.value;}},[[1,'Bám lưới: 1 ô'],[.5,'Bám: ½ ô'],[.25,'Bám: ¼ ô'],[0,'Tự do']].map(([v,n])=>el('option',{value:v},n)));sl.value=String(zsnap);
    box.append(el('div',{class:'row'},sl,el('span',{class:'lbl'},ZL().length+' vùng')));
    if(zpend)box.append(el('div',{class:'row'},el('span',{class:'lbl'},'Đang vẽ '+zpend.pts.length+' điểm: '),btn('✔ Xong',zFinish,'on'),btn('↶ Bỏ điểm cuối',()=>{zpend.pts.pop();if(!zpend.pts.length)zpend=null;draw();dirty=true;}),btn('✕ Hủy',()=>{zpend=null;draw();dirty=true;})));
    const sz=zsel&&zget(zsel);
    if(sz){const row=el('div',{class:'row'});
      row.append(el('span',{class:'lbl'},ZK[sz.k][0]+' '+ZK[sz.k][1]+': '),
        btn('＋ Phóng to',()=>{pushUndo();zScale(sz,1.15);after();draw();}),btn('－ Thu nhỏ',()=>{pushUndo();zScale(sz,1/1.15);after();draw();}),
        btn('⟲ 15°',()=>{pushUndo();zRotate(sz,-15);after();draw();}),btn('⟳ 15°',()=>{pushUndo();zRotate(sz,15);after();draw();}),
        btn('⧉ Nhân bản',()=>{pushUndo();const c=zClone(sz);zMove(c,1,1);ZL().push(c);zsel=c.id;after();draw();}),
        btn('🗑 Xóa',()=>{pushUndo();M.cfg.zones=ZL().filter(q=>q!==sz);zsel=null;after();draw();}));box.append(row);
      const num=(lab,get,set,min,step)=>{const i=el('input',{type:'number',class:'num',step:step||.25,style:'width:70px'});i.value=Math.round(get()*100)/100;i.addEventListener('change',()=>{const v=parseFloat(i.value);if(isNaN(v))return;pushUndo();set(Math.max(min,v));after();dirty=true;});return el('label',{class:'lbl'},lab+' ',i,' ');};
      const r2=el('div',{class:'row'});
      if(isBox(sz)){r2.append(num('Rộng',()=>sz.w,v=>{const c=[sz.x+sz.w/2,sz.y+sz.h/2];sz.w=v;sz.x=c[0]-v/2;},.25),num('Cao',()=>sz.h,v=>{const c=[sz.x+sz.w/2,sz.y+sz.h/2];sz.h=v;sz.y=c[1]-v/2;},.25),num('Xoay°',()=>sz.rot||0,v=>{sz.rot=v%360;},0,5),num('X',()=>sz.x,v=>{sz.x=v;},-999),num('Y',()=>sz.y,v=>{sz.y=v;},-999));}
      else{if(sz.k==='line')r2.append(num('Dày',()=>sz.th||.6,v=>{sz.th=v;},.1,.1),el('label',{class:'lbl'},(()=>{const c=el('input',{type:'checkbox',onchange:e=>{pushUndo();sz.closed=e.target.checked;after();dirty=true;}});c.checked=!!sz.closed;return c;})(),' Khép kín'));r2.append(el('span',{class:'lbl'},sz.pts.length+' đỉnh'));}
      box.append(r2);}
    box.append(el('div',{class:'hint'},'VẼ: chọn hình rồi kéo trên bản đồ (hình CN/elip/tam giác; giữ Shift = vuông/tròn đều). Đa giác & Đường gấp khúc: bấm từng điểm, bấm đúp hoặc ✔ Xong để kết thúc (đa giác: bấm lại điểm đầu cũng được). SỬA: chạm vùng để chọn, kéo thân = di chuyển, kéo ô vuông = kéo dãn, chấm xanh = xoay, chấm nhỏ giữa cạnh = thêm đỉnh, Shift+bấm đỉnh = xóa đỉnh. Phím: Delete xóa · Enter xong · Esc hủy · ←↑↓→ dịch.'));
    return box;}
  function zoomBy(f){const w=cv.clientWidth/2,h=cv.clientHeight/2;const nz=Math.max(.01,Math.min(16,view.z*f)),k=nz/view.z;view.x=w-(w-view.x)*k;view.y=h-(h-view.y)*k;view.z=nz;dirty=true;}
  function fit(){if(!M)return;const w=cv.clientWidth,h=cv.clientHeight;if(ANGQ()){view.z=Math.max(.01,Math.min(8,Math.min(w/(M.w*2*CELL),h/((M.h*2*ANG_R+3)*CELL))));const S=CELL*view.z;view.x=(w-M.w*2*S)/2;view.y=(h-M.h*2*ANG_R*S)/2;dirty=true;return;}
    if(ISOQ()){const n=M.w+M.h;view.z=Math.max(.01,Math.min(8,Math.min(w/(n*CELL),h/(n*CELL*.5+CELL*4))));const S=CELL*view.z;view.x=w/2-(M.w-M.h)*S/2;view.y=(h-n*S/2)/2;dirty=true;return;}
    view.z=Math.max(.01,Math.min(8,Math.min(w/(M.w*CELL),h/(M.h*CELL))));view.x=(w-M.w*CELL*view.z)/2;view.y=(h-M.h*CELL*view.z)/2;dirty=true;}
  if(window.__kb2d)document.removeEventListener('keydown',window.__kb2d);
  window.__kb2d=e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;if(!M||!cv.offsetParent)return;
    const k=(e.key||'').toLowerCase(),m=e.ctrlKey||e.metaKey;
    if(tool==='zone'&&!m){const sz=zsel&&zget(zsel);
      if(k==='enter'&&zpend){zFinish();e.preventDefault();return;}
      if(k==='escape'){if(zpend){zpend=null;draw();dirty=true;}else if(zsel){zsel=null;draw();dirty=true;}return;}
      if(k==='backspace'&&zpend){zpend.pts.pop();if(!zpend.pts.length)zpend=null;draw();dirty=true;e.preventDefault();return;}
      if((k==='delete'||k==='backspace')&&sz){pushUndo();M.cfg.zones=ZL().filter(q=>q!==sz);zsel=null;after();draw();e.preventDefault();return;}
      if(sz&&k.startsWith('arrow')){pushUndo();const n=(e.shiftKey?5:1)*(zsnap||.25);zMove(sz,k==='arrowleft'?-n:k==='arrowright'?n:0,k==='arrowup'?-n:k==='arrowdown'?n:0);after();dirty=true;e.preventDefault();return;}}
    if(m&&k==='z'){(e.shiftKey?doRedo:doUndo)();toast(e.shiftKey?'Làm lại':'Hoàn tác');e.preventDefault();}
    else if(m&&k==='y'){doRedo();e.preventDefault();}
    else if(sel&&m&&k==='d'){selDup();e.preventDefault();}
    else if(sel&&!m&&k.startsWith('arrow')){const n=e.shiftKey?5:1;selMove(k==='arrowleft'?-n:k==='arrowright'?n:0,k==='arrowup'?-n:k==='arrowdown'?n:0);e.preventDefault();}
    else if(sel&&!m&&k==='h'){selFlip();e.preventDefault();}
    else if(sel&&!m&&k==='f'){selFocus();e.preventDefault();}
    else if(!m&&k==='enter'){selCluster(hov||(sel&&{x:sel.x0,y:sel.y0}));e.preventDefault();}
    else if(m&&k==='c'&&sel){copyArea(false);e.preventDefault();}
    else if(m&&k==='x'&&sel){copyArea(true);e.preventDefault();}
    else if(m&&k==='v'&&clip){tool='paste';draw();e.preventDefault();}
    else if(m&&k==='a'){sel={x0:0,y0:0,x1:M.w-1,y1:M.h-1};tool='select';draw();dirty=true;e.preventDefault();}
    else if((k==='delete'||k==='backspace')&&sel&&tool==='select'){clearSel(!simple);e.preventDefault();}
    else if(k==='escape'){if(tool==='paste'){tool='select';draw();}else if(sel){sel=null;dirty=true;draw();}}};
  document.addEventListener('keydown',window.__kb2d);
  // ===== giao diện =====
  const ANS={};const pn=$('#pn2'),ui={};const body=el('div',{class:'pbody'});const tabs=el('div',{class:'ptabs'});pn.append(tabs,body);
  const TABS=[['tools','🛠 Công cụ'],['sheet','🧩 Tileset'],['res','🔎 Tài nguyên'],['mau','🏠 Mẫu 2D'],['maps','🗺 Màn & cửa'],['lib','📚 Thư viện'],['logic','⚙ Logic'],['anim','🎞 Hoạt ảnh'],['layers','🗂 Lớp'],['file','💾 Tệp']];let tab='tools';
  const SIMPLE_TABS=['tools','res','mau','file'];
  function renderTabs(){tabs.textContent='';TABS.filter(([k])=>!simple||SIMPLE_TABS.includes(k)).forEach(([k,n])=>tabs.append(el('button',{class:'ptab','data-t':k,onclick:()=>{tab=k;if(k==='obj')tool='obj';draw();}},n)));
    tabs.append(el('button',{class:'ptab',style:'margin-left:auto;background:#2b3b2e',onclick:()=>{simple=!simple;try{localStorage.setItem('thk_simple',simple?'1':'0');}catch(e){}if(simple&&!SIMPLE_TABS.includes(tab)&&tab!=='obj'&&tab!=='maps')tab='tools';renderTabs();draw();}},simple?'⚙ Hiện đủ công cụ':'✨ Chế độ đơn giản'));}
  renderTabs();
  const placeOnCanvas=(el_,hostEl)=>{const a=cv.getBoundingClientRect(),h=hostEl.getBoundingClientRect();el_.style.left=(a.left-h.left+a.width/2)+'px';el_.style.maxWidth=Math.max(200,a.width-24)+'px';};
  // thanh nút nổi trên bản đồ: chọn vùng / sao chép / dán
  {const host=document.getElementById('v2d');const ft=document.createElement('div');
   ft.style.cssText='position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;display:none;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;background:rgba(15,22,30,.92);border:1px solid #3d6a4c;border-radius:12px;padding:6px 10px;color:#dff;font:13px system-ui;max-width:92%';
   host.append(ft);let lk='';
   const fb=(t,f,c)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='border:0;border-radius:9px;padding:8px 12px;font-size:14px;font-weight:600;color:#fff;background:'+(c||'#2f4156');b.onclick=e=>{e.stopPropagation();f();};return b;};
   setInterval(()=>{placeOnCanvas(ft,host);
     const r=sel&&selRect();let k='';
     if(tool==='select')k=r?'sel:'+r.w+'x'+r.h:'pick';else if(tool==='draw'&&fillArm&&r)k='fill:'+r.w+'x'+r.h;else if(tool==='paste')k='paste:'+(clip?clip.w+'x'+clip.h:'none');
     k+=(simple?'S':'F')+act;
     if(k===lk)return;lk=k;ft.textContent='';
     if(!k.startsWith('sel')&&!k.startsWith('pick')&&!k.startsWith('paste')&&!k.startsWith('fill')){ft.style.display='none';return;}
     ft.style.display='flex';
     const lab=t=>{const d=document.createElement('span');d.textContent=t;d.style.fontWeight='600';ft.append(d);};
     if(k.startsWith('fill')){lab('👆 Bấm vào vùng đã chọn ('+r.w+'×'+r.h+' ô) để đổ ô vừa chọn');ft.append(fb('✖ Thôi',()=>{fillArm=false;lk='';},'#7a3434'));}
     else if(k.startsWith('pick'))lab('⬚ Kéo trên bản đồ để chọn một vùng');
     else if(k.startsWith('sel')){lab('Đã chọn '+r.w+'×'+r.h+' ô');
       ft.append(fb('📋 Sao chép',()=>copyArea(false),'#2f6b46'),fb('✂ Cắt',()=>copyArea(true)),fb('🗑 Xóa lớp '+(['Nền','Phủ nền','Vật thể','Mái/cửa','Vùng chặn'][act]||''),()=>clearSel(false),'#7a3434'),fb('✖ Bỏ chọn',()=>{sel=null;dirty=true;lk='';draw();}));}
     else if(k.startsWith('paste')){lab(clip?'Bấm lên bản đồ để dán ('+clip.w+'×'+clip.h+' ô)':'Chưa có gì để dán — hãy Chọn vùng rồi Sao chép');
       ft.append(fb('✔ Xong',()=>{tool='select';draw();dirty=true;},'#2f6b46'));}
   },150);}
  // thanh nút tắt ở đáy bản đồ: công cụ + lớp + hoàn tác
  {const host=document.getElementById('v2d');const dk=document.createElement('div');
   dk.style.cssText='position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:6;display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:center;background:rgba(15,22,30,.92);border:1px solid #34485a;border-radius:14px;padding:6px 8px;max-width:96%';
   host.append(dk);let dkey='';
   const mk=(t,f,on,col)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='border:0;border-radius:9px;padding:8px 11px;font-size:13.5px;font-weight:600;color:#fff;background:'+(on?'#3a78d6':(col||'#2a3a4c'))+';cursor:pointer';b.onclick=e=>{e.stopPropagation();f();};return b;};
   const sep=()=>{const d=document.createElement('span');d.style.cssText='width:1px;height:22px;background:#3a4a5c;margin:0 3px';return d;};
   setInterval(()=>{placeOnCanvas(dk,host);const k=tool+'|'+act+'|'+(tab==='tools'?1:0)+'|'+(smoothOn()?1:0)+(ISOQ()?1:0)+fogLv();if(k===dkey)return;dkey=k;dk.textContent='';
     [['draw','✏ Vẽ','Tô ô đang cầm lên bản đồ: bấm hoặc kéo chuột'],['erase','🧽 Xóa','Xóa ô ở lớp đang chọn: bấm hoặc kéo chuột'],['select','⬚ Chọn vùng','Kéo khung để chọn một vùng, rồi Sao chép / Xóa / Đổ nền'],['paste','📥 Dán','Dán vùng đã sao chép: bấm lên bản đồ'],['pan','✋ Kéo','Kéo để di chuyển bản đồ']].forEach(([t,n,tp])=>{const bb=mk(n,()=>{tool=t;tab='tools';draw();dirty=true;},tool===t);bb.title=tp;dk.append(bb);});
     dk.append(sep());
     ['Nền','Phủ nền','Vật thể','Mái/cửa'].forEach((n,i)=>dk.append(mk(n,()=>{act=i;if(tool==='select'||tool==='paste'||tool==='pan')tool='draw';tab='tools';draw();dirty=true;},act===i,'#35453a')));
     dk.append(sep(),mk('↶',doUndo),mk('↷',doRedo),mk('⤢',fit));
     if(ISOQ()){dk.append(sep());const pb=mk(ANGQ()?'📐 Chiếu: Angle':'📐 Chiếu: Isometric',async()=>{pushUndo();const to=ANGQ()?'iso':'angle';if(to==='angle'){const m=await ensureAngle(sheets);if(m.length)toast('Chưa có bộ Angle cho: '+m.join(', '));}M.cfg.proj=to;isoK='';angN=-1;after();dkey='';fit();dirty=true;toast(to==='angle'?'Chiếu Angle (xiên mặt trước): ô sàn gần chữ nhật':'Chiếu Isometric');},ANGQ());pb.title='Đổi phép chiếu của cả cảnh: Isometric (hình thoi) hoặc Angle (xiên mặt trước). Dữ liệu cảnh giữ nguyên.';dk.append(pb);const sb=mk('🌿 Nền mượt',()=>{pushUndo();M.cfg.smooth=smoothOn()?false:true;after();toast(smoothOn()?'Nền mượt: BẬT (hòa trộn mép, xoay lật ô, đốm sáng tối)':'Nền mượt: TẮT');dkey='';dirty=true;},smoothOn());sb.title='Bật: nền hòa trộn ở mép giữa hai loại ô, hết cảm giác ô vuông';dk.append(sb);const fb=mk(['🌫 Sương: tắt','🌫 Sương: nhẹ','🌫 Sương: vừa','🌫 Sương: dày'][fogLv()],()=>{pushUndo();M.cfg.fog=(fogLv()+1)%4;after();dkey='';dirty=true;},fogLv()>0);fb.title='Sương mờ phủ lên trên cùng (tiền cảnh). Bản chơi thì sương trôi chậm.';dk.append(fb);}
   },150);}
  const sc=el('canvas',{class:'stampc'});
  ui.stamp=()=>{const c=$('.stampc',pn);if(!c)return;const z=Math.max(1,Math.min(5,Math.floor(120/Math.max(stamp.w,stamp.h)/CELL*3)));c.width=stamp.w*CELL*z/1;c.height=stamp.h*CELL*z/1;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);
    for(let j=0;j<stamp.h;j++)for(let i=0;i<stamp.w;i++){if(stamp.multi){for(let l=0;l<4;l++){const v=stamp.layers[l]&&stamp.layers[l][j*stamp.w+i];if(v)drawTile(g,v,i*CELL*z,j*CELL*z,CELL*z);}}else drawTile(g,stamp.tiles[j*stamp.w+i],i*CELL*z,j*CELL*z,CELL*z);}};
  ui.obj=()=>{if(tab==='obj'||tab==='maps')draw();};ui.tools=()=>{if(tab==='tools')draw();};ui.layers=()=>{if(tab==='layers'||tab==='tools')draw();};ui.sel=()=>{if(tab==='tools')draw();};
  function btn(label,fn,cls=''){return el('button',{class:'b '+cls,onclick:fn},label);}
  function draw(){[...tabs.children].forEach(b=>b.classList.toggle('on',b.dataset.t===tab));body.innerHTML='';
    if(tab==='tools'){
      const TL=simple?[['draw','✏ Vẽ'],['erase','🧽 Xóa'],['select','⬚ Chọn vùng'],['paste','📥 Dán'],['pan','✋ Kéo']]:[['draw','✏ Vẽ'],['erase','🧽 Xóa'],['fill','🪣 Đổ'],['rect','▭ Hình CN'],['pick','💧 Hút'],['select','⬚ Chọn vùng'],['paste','📥 Dán'],['zone','🚧 Vùng chặn'],['pan','✋ Kéo']];
      body.append(el('div',{class:'row'},TL.map(([k,n])=>btn(n,()=>{tool=k;if(k!=='zone')zpend=null;if(k==='obj')tab='obj';draw();dirty=true;},tool===k?'on':''))));
      if(tool==='zone')body.append(zoneUI());
      if(simple)body.append(el('div',{class:'row'},btn('↶ Hoàn tác',doUndo),btn('↷ Làm lại',doRedo),btn('＋',()=>zoomBy(1.4)),btn('－',()=>zoomBy(1/1.4)),btn('⤢ Vừa khung',fit)));else body.append(el('div',{class:'row'},btn('↶ Hoàn tác',doUndo),btn('↷ Làm lại',doRedo),btn('＋',()=>zoomBy(1.4)),btn('－',()=>zoomBy(1/1.4)),btn('⤢ Vừa khung',fit),btn(grid?'▦ Lưới: bật':'▦ Lưới: tắt',()=>{grid=!grid;dirty=true;draw();}),btn(['🚧 Va chạm: ẩn','🚧 Hiện vùng CHẶN (đỏ)','🚧 Chặn (đỏ) + Đi được (xanh)'][colMode],()=>{colMode=(colMode+1)%3;dirty=true;draw();ui.tools&&ui.tools();})));
      body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Lớp đang vẽ: '),LAYN.concat(['Vùng chặn']).map((n,i)=>btn(n,()=>{act=i;draw();},act===i?'on':''))));
      if(!simple&&(tool==='select'||tool==='paste'||sel||clip)){
        const box=el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'});
        if(tool==='select'||sel){const r=sel&&selRect();
          box.append(el('div',{class:'lbl'},r?('⬚ Vùng đang chọn: '+r.w+'×'+r.h+' ô'):'⬚ Kéo trên bản đồ để chọn một vùng (hoặc bấm Chọn tất cả)'));
          box.append(el('div',{class:'row'},btn('📋 Sao chép',()=>copyArea(false)),btn('✂ Cắt',()=>copyArea(true)),btn('📥 Dán',startPaste),btn('⬚ Chọn tất cả',()=>{sel={x0:0,y0:0,x1:M.w-1,y1:M.h-1};dirty=true;draw();})));
          box.append(el('div',{class:'row'},btn('🗑 Xóa lớp này',()=>clearSel(false)),btn('🗑 Xóa mọi lớp',()=>clearSel(true)),btn('✖ Bỏ chọn',()=>{sel=null;dirty=true;draw();})));
          const c1=el('input',{type:'checkbox',onchange:e=>{inclEnt=e.target.checked;}}),c2=el('input',{type:'checkbox',onchange:e=>{inclBlk=e.target.checked;}});c1.checked=inclEnt;c2.checked=inclBlk;
          box.append(el('div',{class:'row'},el('label',{style:'font-size:13px'},c1,' Kèm quái/NPC/rương'),el('label',{style:'font-size:13px'},c2,' Kèm vùng chặn')));}
        if(clip)box.append(el('div',{class:'row'},el('span',{class:'lbl'},'📌 Đang giữ: '+clip.w+'×'+clip.h+' ô'+(clip.ents.length?' + '+clip.ents.length+' đối tượng':'')+' · '),tool==='paste'?btn('✔ Xong dán',()=>{tool='select';draw();},'on'):btn('📥 Dán',startPaste),btn('🖌 Vẽ bằng nó',()=>{tool='draw';draw();})));
        if(tool==='paste')box.append(el('div',{class:'hint'},clip?'Chạm/kéo để đặt (tâm vùng dán theo ngón tay), nhả ra là dán. Dán được nhiều lần. Esc hoặc "Xong dán" để thoát.':'Chưa có gì để dán — dùng "Chọn vùng" rồi "Sao chép" trước.'));
        if(tool==='select')box.append(el('div',{class:'hint'},'Phím tắt: ←↑↓→ di chuyển (Shift = 5 ô) · Ctrl+D nhân bản · H lật ngang · F phóng tới vùng · Enter chọn cả cụm công trình (trỏ chuột vào nó) · Ctrl+C/X/V · Ctrl+A · Delete · Esc · Ctrl+Z hoàn tác. Chế độ Vẽ: giữ Shift + kéo để đặt thành hàng.'));
        body.append(box);}
      if(simple){body.append(quickPick());body.append(el('div',{class:'guide',style:'margin-top:8px;padding:10px;border-radius:10px;background:#16261d;border:1px solid #3d6a4c;font-size:13.5px;line-height:1.7'},
        el('div',{style:'font-weight:700;color:#9fe0b0;margin-bottom:4px'},'Cách dùng nhanh'),
        el('div',{},'1. Muốn đặt nhà/cây: vào tab 🏠 Mẫu 2D hoặc 🔎 Tài nguyên, bấm một ô, rồi bấm lên bản đồ.'),
        el('div',{},'2. Muốn chép một khu: bấm ⬚ Chọn vùng → kéo trên bản đồ → bấm 📋 Sao chép (nút nổi trên bản đồ) → bấm chỗ cần dán.'),
        el('div',{},'3. Sai thì bấm ↶ Hoàn tác. Xong thì vào tab 💾 Tệp để lưu.')));}else{const row=el('div',{class:'row'},el('span',{class:'lbl'},'Cọ đang cầm: '),el('canvas',{class:'stampc'}),btn('↔ Lật ngang',flipStamp),btn(act===4?'(Vùng chặn: vẽ = chặn, xóa = mở)':'',()=>{},'ghost'));body.append(row,el('div',{class:'hint'},'Ô bên trên là cái sẽ được vẽ ra khi chạm bản đồ (gọi là "cọ" hay stamp). Muốn đổi: vào tab 🧩 Tileset chọn ô khác, hoặc dùng 💧 Hút để lấy ô có sẵn trên bản đồ. Muốn dùng cả khối nhiều ô: Chọn vùng → Sao chép.'));ui.stamp();
      body.append(el('div',{class:'hint'},'Mẹo: chọn ô trong tab Tileset (kéo để chọn nhiều ô liền nhau thành một stamp). Kéo 2 ngón để phóng/thu và di chuyển bản đồ. Dùng "Chọn vùng" → "Lấy làm stamp" để sao chép cả ngôi nhà.'));}}
    else if(tab==='sheet'){
      {const nsel=el('select',{class:'num',style:'width:100%;max-width:100%'},el('option',{value:''},'… đang tải danh sách bộ nền …')),nd=el('div',{class:'hint'},'');
      nenIndex().then(L=>{nsel.innerHTML='';nsel.append(el('option',{value:''},'— chọn bộ nền để vẽ ('+L.length+' bộ) —'));const cn=sheets[curSheet]&&/^Nen-/.test(sheets[curSheet].name)?sheets[curSheet].name.slice(4):'';for(const o of L){const op=el('option',{value:o.id},o.name+' ('+o.n+' ô)');if(o.id===cn){op.selected=true;nd.textContent=o.desc;}nsel.append(op);}nsel._L=L;});
      nsel.onchange=async()=>{const id=nsel.value;if(!id)return;nd.textContent='Đang nạp…';try{const r=await ensureNen(id);curSheet=r.sid;HID.delete(r.sid);draw();toast('Đã chọn bộ nền — bấm một ô rồi vẽ lên bản đồ (cọ, tô, hình chữ nhật đều dùng được)');}catch(e){nd.textContent='Lỗi nạp bộ nền: '+(e&&e.message||e);}};
      body.append(el('div',{class:'lbl'},'🧱 Nền mặc định theo khu (dùng cho mọi công cụ)'),nsel,nd);}
      {const vs=visSh();if(HID.has(curSheet))curSheet=vs.length?vs[0]:0;
      if(vs.length>10){const fq=el('input',{placeholder:'🔎 Lọc tên tileset…',class:'num',style:'width:100%;box-sizing:border-box;margin:2px 0'});fq.value=shQ;fq.addEventListener('input',()=>{shQ=fq.value;clearTimeout(fq._t);fq._t=setTimeout(()=>{draw();const n=body.querySelector('input[placeholder^="🔎 Lọc tên"]');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length);}},300);});
        const f=shQ.trim().toLowerCase();const lst=vs.filter(i=>!f||sheets[i].name.toLowerCase().includes(f)||i===curSheet);const pos=lst.indexOf(curSheet);
        const sl=el('select',{class:'num',style:'width:100%;max-width:100%',onchange:e=>{curSheet=+e.target.value;draw();}},lst.map(i=>el('option',{value:i},(i+1)+'. '+sheets[i].name)));sl.value=String(curSheet);
        body.append(fq,sl,el('div',{class:'row'},btn('◀ Trước',()=>{const k=lst.indexOf(curSheet);if(k>0){curSheet=lst[k-1];draw();}}),btn('Sau ▶',()=>{const k=lst.indexOf(curSheet);if(k<lst.length-1){curSheet=lst[k+1];draw();}}),el('span',{class:'lbl'},(pos+1)+' / '+lst.length+' (tổng '+vs.length+')')));}
      else body.append(el('div',{class:'row'},vs.map(i=>btn(sheets[i].name,()=>{curSheet=i;draw();},curSheet===i?'on':''))));
      if(!vs.length){body.append(el('div',{class:'hint'},'Chưa có tileset nào. Bấm "➕ Thêm tileset từ ảnh…" hoặc vào "🗑 Quản lý / xóa tileset" → "Hiện lại tileset gốc".'),el('div',{class:'row'},btn('➕ Thêm tileset từ ảnh…',addSheet),btn('📦 Nạp gói .zip…',addZip),btn('🗑 Quản lý / xóa tileset',manageSheets)));return;}}
      if(sheets.length>4){const mb=sheets.slice(4).reduce((a,x)=>a+x.url.length,0)*.75/1048576;body.append(el('div',{class:'hint',style:'border:1px solid #34485a;border-radius:8px;padding:6px'},'🖼 Ảnh đã tải lên: '+(sheets.length-4)+' (≈'+mb.toFixed(1)+' MB) — nằm ở các nút từ "'+sheets[4].name+'" trở đi ở trên. '+(saveInfo||'')));}
      const s=sheets[curSheet];const fitZ=Math.max(.02,Math.min(3,((pn.clientWidth||360)-34)/s.img.width));const z=shZ==='fit'?fitZ:shZ;
      body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Ảnh '+s.img.width+'×'+s.img.height+' px · phóng '+Math.round(z*100)+'%'),btn('▣ Vừa khung',()=>{shZ='fit';draw();},shZ==='fit'?'on':''),btn('－',()=>{shZ=Math.max(.02,z/1.4);draw();}),btn('＋',()=>{shZ=Math.min(8,z*1.4);draw();}),btn('1:1',()=>{shZ=1;draw();})));
      const wrap=el('div',{class:'sheetwrap',style:'max-height:min(60vh,520px)'});const c=el('canvas');c.width=Math.max(1,Math.round(s.img.width*z));c.height=Math.max(1,Math.round(s.img.height*z));if(z<1)c.style.imageRendering='auto';wrap.append(c);body.append(wrap);
      const g=c.getContext('2d');g.imageSmoothingEnabled=z<1;g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);g.drawImage(s.img,0,0,c.width,c.height);
      let ss=null;const step=(s.tw+s.margin)*z;
      const redraw=()=>{g.imageSmoothingEnabled=z<1;g.clearRect(0,0,c.width,c.height);g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);g.drawImage(s.img,0,0,c.width,c.height);
        const cur=stampSheetRect(curSheet);if(cur){g.strokeStyle='#ffd24a';g.lineWidth=2;g.strokeRect(cur.c0*step,cur.r0*step,(cur.c1-cur.c0+1)*step-z*s.margin,(cur.r1-cur.r0+1)*step-z*s.margin);}
        if(ss){g.strokeStyle='#4fd1ff';g.strokeRect(Math.min(ss.c0,ss.c1)*step,Math.min(ss.r0,ss.r1)*step,(Math.abs(ss.c1-ss.c0)+1)*step-z*s.margin,(Math.abs(ss.r1-ss.r0)+1)*step-z*s.margin);}};
      const cr=e=>{const r=c.getBoundingClientRect();const x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;return {c:Math.max(0,Math.min(s.cols-1,Math.floor(x/step))),r:Math.max(0,Math.min(s.rows-1,Math.floor(y/step)))};};
      c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);const p=cr(e);ss={c0:p.c,r0:p.r,c1:p.c,r1:p.r};redraw();});
      c.addEventListener('pointermove',e=>{if(!ss)return;const p=cr(e);ss.c1=p.c;ss.r1=p.r;redraw();});
      c.addEventListener('pointerup',e=>{if(!ss)return;const c0=Math.min(ss.c0,ss.c1),c1=Math.max(ss.c0,ss.c1),r0=Math.min(ss.r0,ss.r1),r1=Math.max(ss.r0,ss.r1);ss=null;
        const w=c1-c0+1,h=r1-r0+1,tiles=[];for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++)tiles.push(enc(curSheet,j*s.cols+i));
        stamp={w,h,multi:false,tiles,sheet:{sid:curSheet,c0,r0,c1,r1}};if(tool!=='rect'&&tool!=='fill')tool='draw';redraw();toast('Đã chọn '+w+'×'+h+' ô — sang tab Công cụ để vẽ');});
      redraw();
      body.append(el('div',{class:'row'},btn('➕ Thêm tileset từ ảnh…',addSheet),btn('📦 Nạp gói .zip…',addZip),btn('🗑 Quản lý / xóa tileset',manageSheets)),el('div',{class:'hint'},'Chọn ô: chạm 1 ô, hoặc kéo để chọn khối nhiều ô (ví dụ cả mái nhà). Sau đó quay lại tab Công cụ và chạm lên bản đồ.'));}
    else if(tab==='res'){resTab();}
    else if(tab==='maps'){mapsTab();}
    else if(tab==='mau'){mauTab();}
    else if(tab==='lib'){
      body.append(el('div',{class:'row'},btn('💾 Lưu stamp hiện tại vào thư viện',async()=>{const n=await ask('Tên công trình/stamp:','Công trình '+(lib.length+1));if(!n)return;lib.push({name:n,w:stamp.w,h:stamp.h,multi:!!stamp.multi,layers:stamp.multi?stamp.layers:null,tiles:stamp.tiles});lsSet('thk_stamps',lib);draw();toast('Đã lưu "'+n+'"');})));
      if(!lib.length)body.append(el('div',{class:'hint'},'Thư viện trống. Dùng "Chọn vùng" → "Lấy làm stamp" để copy một công trình trên bản đồ, rồi lưu vào đây để dùng lại hoặc ghép vào bản đồ khác.'));
      const grid=el('div',{class:'libgrid'});lib.forEach((s,i)=>{const c=el('canvas');const z=Math.max(1,Math.min(4,Math.floor(96/Math.max(s.w,s.h)/CELL*3)));c.width=s.w*CELL*z;c.height=s.h*CELL*z;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);
        for(let j=0;j<s.h;j++)for(let k=0;k<s.w;k++){if(s.multi){for(let l=0;l<4;l++){const v=s.layers[l]&&s.layers[l][j*s.w+k];if(v)drawTile(g,v,k*CELL*z,j*CELL*z,CELL*z);}}else drawTile(g,s.tiles[j*s.w+k],k*CELL*z,j*CELL*z,CELL*z);}
        grid.append(el('div',{class:'libitem'},c,el('div',{},s.name+' ('+s.w+'×'+s.h+')'),el('div',{class:'row'},btn('Dùng',()=>{stamp={w:s.w,h:s.h,multi:s.multi,layers:s.layers,tiles:s.multi?s.layers[0]:s.tiles};tool='draw';tab='tools';draw();toast('Đã chọn stamp "'+s.name+'"');}),btn('🗑',async()=>{if(await yes('Xóa "'+s.name+'"?')){lib.splice(i,1);lsSet('thk_stamps',lib);draw();}}))));});body.append(grid);}
    else if(tab==='obj'){
      body.append(el('div',{class:'row'},Object.keys(OT).filter(k=>k!=='deco').map(k=>btn(OT[k][0]+' '+OT[k][1],()=>{objType=k;tool='obj';draw();},objType===k?'on':''))));
      body.append(el('div',{class:'hint'},'Chọn loại rồi chạm bản đồ để đặt. Chạm đối tượng để chọn, kéo để di chuyển. Có '+M.ents.length+' đối tượng.'));
      const e=selEnt();
      const th=(sid,idx,fn,on)=>{const c=el('canvas',{style:'width:34px;height:34px;image-rendering:pixelated;background:#2a3340;border-radius:4px;border:2px solid '+(on?'#ffd24a':'transparent')+';flex:none',onclick:fn});c.width=c.height=CELL*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;drawTile(g,enc(sid,idx),0,0,CELL*2);return c;};
      const picker=(get,set)=>{const cur=get();const vs=visSh();const wrapAll=el('div',{});if(!vs.length){wrapAll.append(el('div',{class:'hint'},'Chưa có tileset nào hiển thị — nạp tileset nhân vật của bạn ở tab 🧩 Tileset.'));return wrapAll;}
        const ps=window.__psid!=null&&vs.includes(window.__psid)?window.__psid:(cur&&vs.includes(cur.sid)?cur.sid:vs[0]);
        const sh=sheets[ps],n=ps===2?[84,132]:[0,Math.min(300,(sh.cols||0)*(sh.rows||Math.floor((sh.img?sh.img.height:0)/(sh.tw+(sh.margin||0)))||0))];
        const sel=el('select',{class:'num',style:'max-width:100%',onchange:e=>{window.__psid=+e.target.value;draw();}},...vs.map(k=>{const o=el('option',{value:k},(k+1)+'. '+sheets[k].name);if(k===ps)o.selected=true;return o;}));
        const wrap=el('div',{style:'display:flex;flex-wrap:wrap;gap:3px;margin:4px 0;max-height:118px;overflow:auto'});for(let i=n[0];i<n[1];i++)wrap.append(th(ps,i,()=>{set({sid:ps,idx:i});after();draw();},cur&&cur.sid===ps&&cur.idx===i));wrapAll.append(sel,wrap);return wrapAll;};
      const fld=(l,o,k,type,extra)=>{const i=el('input',{type:type||'text',value:o[k],class:'num',style:'width:'+(type==='number'?'72px':'100%')+';box-sizing:border-box',min:extra&&extra.min,max:extra&&extra.max,step:extra&&extra.step});i.oninput=()=>{o[k]=type==='number'?+i.value:i.value;after();};return el('div',{class:'row'},el('span',{class:'lbl'},l),i);};
      if(e){
        body.append(el('div',{style:'border:1px solid '+OT[e.t][2]+';border-radius:10px;padding:8px;margin:6px 0'},
          el('div',{class:'lbl',style:'margin-bottom:4px'},OT[e.t][0]+' '+OT[e.t][1]+' — ô ('+e.x+','+e.y+')'),
          e.t!=='start'&&e.t!=='goal'?fld('Tên',e,'name'):'',
          ...(e.t==='enemy'?[fld('Máu',e,'hp','number',{min:1,max:99}),fld('Sát thương',e,'dmg','number',{min:0,max:9}),fld('Tốc độ (ô/s)',e,'spd','number',{min:0,max:8,step:.1}),fld('Tầm phát hiện',e,'chase','number',{min:1,max:20}),
            el('div',{class:'row'},el('span',{class:'lbl'},'Hành vi'),(()=>{const s=el('select',{class:'num'},AIL.map(([v,n])=>el('option',{value:v},n)));s.value=e.ai;s.onchange=()=>{e.ai=s.value;after();};return s;})())]:[]),
          ...(e.t==='deco'&&e.door?[el('div',{class:'row'},el('span',{class:'lbl'},'Trạng thái cửa'),(()=>{const sl=el('select',{class:'num'},el('option',{value:'dong'},'Đóng (chặn lối)'),el('option',{value:'mo'},'Mở (đi qua được)'));sl.value=e.door.st;sl.onchange=()=>{const v=e.door.v[sl.value];e.door.st=sl.value;e.tile=v.tile;if(v.col&&v.col.length)e.col=v.col;else delete e.col;after();draw();};return sl;})()),el('div',{class:'row'},el('label',{style:'font-size:13px'},(()=>{const c=el('input',{type:'checkbox'});c.checked=!!e.door.auto;c.onchange=()=>{e.door.auto=c.checked?1:0;after();};return c;})(),' Tự đóng lại khi nhân vật đi xa')),el('div',{class:'hint'},'Khi chơi: cửa tự mở khi lại gần, phím E đóng/mở. Vùng chặn riêng từng trạng thái.')]:[]),
          ...(e.t==='npc'?[el('div',{class:'lbl'},'Lời thoại'),(()=>{const t=el('textarea',{rows:3,style:'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:15px'});t.value=e.text;t.oninput=()=>{e.text=t.value;after();};return t;})()]:[]),
          ...(e.t==='chest'?[el('div',{class:'row'},el('span',{class:'lbl'},'Bên trong'),(()=>{const s=el('select',{class:'num'},el('option',{value:'hp'},'Hồi máu'),el('option',{value:'coin'},'Điểm/tiền'));s.value=e.gives;s.onchange=()=>{e.gives=s.value;after();};return s;})()),fld('Số lượng',e,'amt','number',{min:1,max:99})]:[]),
          ...(e.tile!==undefined&&(e.t==='enemy'||e.t==='npc')?[el('div',{class:'lbl'},'Hình nhân vật:'),picker(()=>e.tile,t=>{e.tile=t;}),btn('🎨 Dùng ô tileset đang chọn làm hình',()=>{const d=stamp.tiles&&stamp.tiles[0];if(!d){toast('Chọn 1 ô trong tab Tileset trước');return;}const q=dec(d);e.tile={sid:q.sid,idx:q.idx};after();draw();})]:[]),
          ...(e.t==='enemy'||e.t==='npc'?[animPick(e,'anim',M.cfg,after)]:[]),
          ...entExtra(e,after,draw),
          el('div',{class:'row'},btn('⧉ Nhân bản',()=>{pushUndo();const c=JSON.parse(JSON.stringify(e));c.id=Date.now().toString(36);c.x=Math.min(M.w-1,e.x+1);if(e.t==='start')return toast('Chỉ có 1 điểm xuất phát');M.ents.push(c);selId=c.id;after();draw();}),btn('🗑 Xoá',()=>{pushUndo();M.ents=M.ents.filter(q=>q.id!==e.id);selId=null;after();draw();}))));
      }
      body.append(el('div',{class:'row'},btn('🗑 Xoá hết đối tượng',async()=>{if(await yes('Xoá toàn bộ đối tượng?')){pushUndo();M.ents=[];selId=null;after();draw();}})));
      const C=M.cfg;
      body.append(el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'},el('div',{class:'lbl'},'⚙ Thiết lập game'),
        fld('Máu người chơi',C,'hp','number',{min:1,max:99}),fld('Tốc độ đi (ô/s)',C,'spd','number',{min:1,max:10,step:.1}),fld('Sát thương đòn đánh',C,'dmg','number',{min:1,max:99}),fld('Tầm đánh (ô)',C,'rng','number',{min:.5,max:4,step:.05}),
        el('div',{class:'row'},el('span',{class:'lbl'},'Điều kiện thắng'),(()=>{const s=el('select',{class:'num'},el('option',{value:'auto'},'Tự động'),el('option',{value:'kill'},'Diệt hết quái'),el('option',{value:'goal'},'Chạm đích'),el('option',{value:'both'},'Diệt hết quái + chạm đích'));s.value=C.win;s.onchange=()=>{C.win=s.value;after();};return s;})()),
        el('div',{class:'lbl'},'Hình nhân vật chính:'),picker(()=>C.hero,t=>{C.hero=t;}),animPick(C,'heroAnim',M.cfg,after,'Hoạt ảnh nhân vật chính')));
      body.append(el('div',{class:'hint'},'Nếu bản đồ chưa có đối tượng nào, game chạy kiểu cũ (rải quái ngẫu nhiên). Đặt ít nhất 1 điểm 🚩 Xuất phát để chọn chỗ bắt đầu.'));}
    else if(tab==='logic'){logicTab(body,M.cfg,M.ents,after,draw);}
    else if(tab==='anim'){animTab(body,M.cfg,sheets,after,draw,ANS);}
    else if(tab==='layers'){
      body.append(el('div',{class:'hint'},'Bật/tắt hiển thị từng lớp. Lớp "Vùng chặn" là chỗ nhân vật không đi qua được (xuất kèm trong tệp dữ liệu để dùng trong game).'));
      LAYN.concat(['Vùng chặn']).forEach((n,i)=>body.append(el('div',{class:'row'},btn(vis[i]?'👁 Hiện':'🚫 Ẩn',()=>{vis[i]=vis[i]?0:1;dirty=true;draw();},vis[i]?'':'off'),btn(n,()=>{act=i;draw();},act===i?'on':''))));}
    else if(tab==='file'){
      body.append(el('div',{style:'border:1px solid #4a7a5a;border-radius:10px;padding:8px;margin-bottom:10px;background:#16261d'},el('div',{class:'lbl',style:'color:#9fe0b0;margin-bottom:6px'},'📂 TẢI TỆP LÊN'),el('div',{class:'row'},btn('🧍 Nhân vật Male (Kenney)',()=>addCharSet('anim/kenney-male.json')),btn('🖼 Ảnh tileset (.png)…',addSheet),btn('📦 Gói tài nguyên .zip…',addZip),btn('📦 Gói xuong-pack (.zip, có pack.json)…',addPackZip,'background:#2b6f4a;color:#fff'),btn('📚 Gói 2D có sẵn (SBS, mẫu miễn phí)…',builtinPacks,'background:#2b6f4a;color:#fff'),btn('⬆ Dự án .json…',()=>pickFile('.json,application/json',t=>importJSON(t))),btn('⛓ Cảnh mẫu: Địa lao',()=>openKScene('dia-lao')),btn('⛓ Địa lao 2 (3 phòng + đích)',()=>openKScene('dia-lao-2')),btn('🌾 Cảnh mẫu: Nông trại',()=>openKScene('nong-trai')),btn('🌾 Nông trại 2 (ruộng + kho)',()=>openKScene('nong-trai-2')),btn('📚 Cảnh mẫu: Thư viện',()=>openKScene('thu-vien')),btn('📚 Thư viện 2 (4 phòng + đích)',()=>openKScene('thu-vien-2')),btn('🏯 Sân chùa chính',()=>genPreset('san-bac',{sb:'chinh'})),btn('🏯 Sân hẹp sâu',()=>genPreset('san-bac',{sb:'hep'})),btn('🏯 Sân hai cổng',()=>genPreset('san-bac',{sb:'hai_cong'})),btn('🏯 Sân tam quan',()=>genPreset('san-bac',{sb:'tam_quan'})),btn('🏯 Sân phẳng kín',()=>genPreset('san-bac',{sb:'phang'})),btn('🏯 Sân nhiều tầng',()=>genPreset('san-bac',{sb:'nhieu_tang'})),),el('div',{class:'hint'},'Ảnh/zip sẽ thành tileset mới trong tab 🧩 Tileset. Gói zip: chọn ảnh bên trong rồi nhập kích thước ô.'),packReport()));body.append(ruleBox());
      body.append(slotsUI('2d',()=>clone(M),o=>{pushUndo();M=clone(o);selId=null;after();fit();},'Làng của tôi'));
      const wi=el('input',{type:'number',value:M.w,min:4,max:600,class:'num'}),hi=el('input',{type:'number',value:M.h,min:4,max:600,class:'num'});
      body.append(el('div',{class:'row'},btn('🏘 Mở lại làng Thanh Hồ',async()=>{if(await yes('Thay bản đồ hiện tại bằng làng Thanh Hồ gốc?')){pushUndo();M=fromVillage();after();fit();}}),btn('🆕 Bản đồ trống',async()=>{if(await yes('Tạo bản đồ trống '+wi.value+'×'+hi.value+'? (có thể hoàn tác)')){pushUndo();M=newMap(+wi.value,+hi.value);after();fit();}})));
      body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Cỡ (ô): '),wi,'×',hi,btn('Đổi cỡ giữ nội dung',()=>{pushUndo();resize(+wi.value,+hi.value);after();fit();})));
      body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Cỡ nhanh: '),[[48,36],[64,48],[96,72],[128,96],[200,150],[300,225],[400,300]].map(([a,b])=>btn(a+'×'+b,()=>{wi.value=a;hi.value=b;})),el('span',{class:'lbl'},'Tối đa 600×600. Bản càng lớn càng nặng máy.')));
      const sc=el('select',{class:'num'},el('option',{value:1},'Ảnh 1×'),el('option',{value:2,selected:true},'Ảnh 2×'),el('option',{value:4},'Ảnh 4×'));
      body.append(el('div',{class:'row'},sc,btn('🖼 Xuất ảnh PNG',()=>exportPNG(+sc.value)),btn('⬇ Xuất dữ liệu .json',exportJSON),btn('📋 Sao chép JSON',copyJSON)));
      body.append(el('div',{class:'row'},btn('⬆ Nhập .json',()=>pickFile('.json,application/json',t=>importJSON(t))),btn('📝 Dán JSON…',async()=>{const t=await askText('Dán nội dung JSON:');if(t)importJSON(t);})));
      body.append(el('div',{class:'row'},btn('🎮 Xuất GAME 2D (file HTML)',()=>exportGame(gameData(),'Game 2D của tôi'))));
      body.append(el('div',{class:'hint'},'App tự lưu trên trình duyệt này. Muốn đưa vào game: xuất .json (gồm 4 lớp ô, lớp vùng chặn và thông tin tileset) rồi gửi lại cho Claude để gắn vào game.'));}
  }
  function stampSheetRect(sid){return stamp.sheet&&stamp.sheet.sid===sid?stamp.sheet:null;}
  function flipStamp(){const w=stamp.w,h=stamp.h;const f=a=>{const o=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++){const v=a[j*w+(w-1-i)];if(!v){o.push(0);continue;}const d=dec(v);o.push(enc(d.sid,d.idx,d.f^1));}return o;};
    if(stamp.multi){stamp.layers=stamp.layers.map(a=>a&&f(a));stamp.tiles=stamp.layers[0];}else{stamp.tiles=f(stamp.tiles);}delete stamp.sheet;ui.stamp();}
  function resize(w,h){const m=newMap(w,h);for(let y=0;y<Math.min(h,M.h);y++)for(let x=0;x<Math.min(w,M.w);x++){for(let l=0;l<4;l++)m.layers[l][y*w+x]=M.layers[l][y*M.w+x];m.blk[y*w+x]=M.blk[y*M.w+x];}m.ents=M.ents.filter(e=>e.x<w&&e.y<h);m.cfg=M.cfg;M=m;}
  function fromVillage(){const v=A.village;return clone({w:v.w,h:v.h,layers:v.layers,blk:v.blk});}
  async function addSheetUrl(url,nm){const g=null;const tw=+(await ask(g?'App tự đoán: ô '+g.tw+' px, khe '+g.m+' px ('+g.cols+'×'+g.rows+' ô). Sai thì sửa số.\n\nKích thước mỗi ô (px)?':'Không đoán được. Kích thước mỗi ô (px)?',g?String(g.tw):'16'));if(!tw)return;const m=+(await ask('Khoảng cách giữa các ô (px)?',g?String(g.m):'0'))||0;const s={name:nm.slice(0,24),url,tw,margin:m};loadSheet(s).then(()=>{sheets.push(s);uniqNames(sheets);curSheet=sheets.length-1;after();draw();toast('Đã thêm tileset');});}
  function sheetUse(){const u=new Array(sheets.length).fill(0);for(const a of M.layers)for(const v of a)if(v){const d=dec(v);if(u[d.sid]!=null)u[d.sid]++;}
    for(const e of M.ents)if(e.tile&&u[e.tile.sid]!=null)u[e.tile.sid]++;const h=M.cfg&&M.cfg.hero;if(h&&u[h.sid]!=null)u[h.sid]++;return u;}
  function deleteSheets(D){TG.hashes=[];const map=[];let k=0;for(let i=0;i<sheets.length;i++)map.push(D.has(i)?-1:k++);const seen=new WeakSet();
    const fix=v=>{if(!v)return 0;const d=dec(v),n=map[d.sid];if(n==null)return v;return n<0?0:enc(n,d.idx,d.f);};
    const fixA=a=>{if(!a||seen.has(a))return;seen.add(a);for(let i=0;i<a.length;i++)a[i]=fix(a[i]);};
    const fixT=(e,t)=>{if(!e.tile)return;const n=map[e.tile.sid];if(n==null)return;if(n<0)e.tile=e.t==='enemy'?{sid:2,idx:108}:e.t==='npc'?{sid:2,idx:96}:null;else e.tile={sid:n,idx:e.tile.idx};};
    M.layers.forEach(fixA);M.ents.forEach(fixT);const h=M.cfg&&M.cfg.hero;if(h){const n=map[h.sid];if(n<0)M.cfg.hero={sid:2,idx:88};else if(n!=null)h.sid=n;}
    const fixS=o=>{if(!o)return;if(o.multi&&o.layers){o.layers.forEach(fixA);o.tiles=o.layers[0];}else fixA(o.tiles);if(o.sheet){const n=map[o.sheet.sid];if(n<0)delete o.sheet;else if(n!=null)o.sheet.sid=n;}};
    fixS(stamp);if(clip){clip.layers.forEach(fixA);clip.ents.forEach(fixT);}lib.forEach(fixS);lsSet('thk_stamps',lib);
    undo=[];redo=[];[...D].sort((a,b)=>b-a).forEach(i=>sheets.splice(i,1));curSheet=0;if(!stamp.tiles||!stamp.tiles.length)stamp={w:1,h:1,multi:false,tiles:[enc(0,5)]};
    after();}
  async function wipeAll(){if(!await yes('XOÁ TẤT CẢ tài nguyên?\n\nGồm mọi tileset (kể cả 4 tileset gốc), nhãn, và xoá sạch hình đã vẽ trên bản đồ.\nĐối tượng và bộ hoạt ảnh dùng các hình này sẽ mất hình.\nKhông hoàn tác được.'))return;pushUndo();for(const a of M.layers)a.fill(0);const D=new Set();for(let i=4;i<sheets.length;i++)D.add(i);if(D.size)deleteSheets(D);for(let i=0;i<4;i++)HID.add(i);lsSet('thk_hide2d',[...HID]);TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[],hashes:[]});tgSave();curSheet=0;after&&after();draw();toast('Đã xoá tất cả tài nguyên. Bạn có thể tải lại.');}
  function manageSheets(){const custom=sheets.map((s,i)=>i).filter(i=>!HID.has(i));if(!custom.length&&!HID.size){toast('Không có tileset nào');return;}
    const ov=el('div',{style:'position:fixed;inset:0;z-index:200;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px'});
    const box=el('div',{style:'background:#1b2733;border:1px solid #4a6178;border-radius:14px;padding:14px;max-width:640px;width:100%;max-height:92vh;display:flex;flex-direction:column;color:#fff;font:14px system-ui'});
    const flt=el('input',{placeholder:'Lọc theo tên…',style:'width:100%;box-sizing:border-box;padding:9px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:15px;margin:8px 0'});
    const list=el('div',{style:'overflow:auto;flex:1;min-height:120px;border:1px solid #2b3a4b;border-radius:8px'});const info=el('div',{style:'margin:8px 0;font-weight:700'});
    const chk=new Set();let uses=sheetUse();
    const redraw=()=>{list.innerHTML='';const q=flt.value.trim().toLowerCase();let shown=0;
      for(const i of custom){const s=sheets[i];if(!s)continue;if(q&&!s.name.toLowerCase().includes(q))continue;shown++;
        const cb=el('input',{type:'checkbox',onchange:e=>{e.target.checked?chk.add(i):chk.delete(i);upd();}});cb.checked=chk.has(i);
        const th=el('canvas',{width:40,height:40,style:'width:40px;height:40px;image-rendering:pixelated;background:#2a3340;border-radius:4px'});if(s.img){const g=th.getContext('2d');g.imageSmoothingEnabled=false;const k=Math.min(40/s.img.width,40/s.img.height);g.drawImage(s.img,0,0,s.img.width*k,s.img.height*k);}
        const row=el('label',{style:'display:flex;align-items:center;gap:10px;padding:6px 8px;border-bottom:1px solid #243242'},cb,th,el('div',{style:'flex:1;min-width:0'},el('div',{style:'overflow:hidden;text-overflow:ellipsis;white-space:nowrap'},s.name),el('div',{style:'font-size:12px;color:#9fb0c2'},(i<4?'GỐC của app · ':'')+(s.img?s.img.width+'×'+s.img.height+' px · ':'')+(uses[i]?'đang dùng '+uses[i]+' ô/đối tượng':'chưa dùng'))));list.append(row);}
      if(!shown)list.append(el('div',{style:'padding:14px;color:#9fb0c2'},'Không có tileset nào khớp.'));upd();};
    const upd=()=>{info.textContent='Đã chọn '+chk.size+' / '+custom.filter(i=>sheets[i]).length+' tileset';};
    const B=(l,f,c)=>el('button',{class:'b',style:c||'',onclick:f},l);
    const visible=()=>custom.filter(i=>sheets[i]&&(!flt.value.trim()||sheets[i].name.toLowerCase().includes(flt.value.trim().toLowerCase())));
    flt.addEventListener('input',redraw);
    const done=()=>{ov.remove();draw();};
    const del=async()=>{if(!chk.size){toast('Chưa chọn tileset nào');return;}const D=new Set(chk);const D0=new Set([...D].filter(i=>i<4));const D1=new Set([...D].filter(i=>i>=4));let used=0,names=[];for(const i of D){used+=uses[i]||0;names.push(sheets[i].name);}
      const an=JSON.stringify((M.cfg&&M.cfg.anims)||[]);const anUse=names.filter(n=>an.includes(JSON.stringify(n))).length;
      const ok=await yes('Xóa '+D.size+' tileset?'+(D0.size?'\n(Tileset gốc: được gỡ khỏi danh sách và gỡ hết ô đang vẽ bằng chúng trên bản đồ.)':'')+''+(used?'\n⚠ '+used+' ô/đối tượng đang dùng sẽ bị gỡ khỏi bản đồ (có thể hỏng hình).':'')+(anUse?'\n⚠ '+anUse+' tileset đang được bộ hoạt ảnh dùng — hoạt ảnh đó sẽ mất hình.':'')+'\nKhông hoàn tác được.');if(!ok)return;
      if(D0.size){for(const a of M.layers)for(let k=0;k<a.length;k++){const v=a[k];if(v&&D0.has(dec(v).sid))a[k]=0;}D0.forEach(i=>HID.add(i));lsSet('thk_hide2d',[...HID]);}
      if(D1.size)deleteSheets(D1);after&&after();toast('Đã xóa '+D.size+' tileset');ov.remove();draw();};
    box.append(el('div',{style:'font-size:16px;font-weight:800'},'🗑 Quản lý / xóa tileset (kể cả 4 tileset gốc)'),flt,
      el('div',{class:'row',style:'margin-bottom:6px'},B('☑ Chọn tất cả (đang lọc)',()=>{visible().forEach(i=>chk.add(i));redraw();}),B('☑ Chọn tất cả chưa dùng',()=>{custom.forEach(i=>{if(sheets[i]&&!uses[i])chk.add(i);});redraw();}),B('☐ Bỏ chọn hết',()=>{chk.clear();redraw();}),B('☑ Chọn TOÀN BỘ',()=>{custom.forEach(i=>{if(sheets[i])chk.add(i);});redraw();}),HID.size?B('↩ Hiện lại tileset gốc',()=>{toast('Tileset gốc của app đã được gỡ');}):null),
      list,info,el('div',{class:'row'},B('🗑 Xóa các mục đã chọn',del,'background:#b3402f;color:#fff'),B('Đóng',done)));
    ov.append(box);document.body.append(ov);redraw();}
  // ===== Thư viện tài nguyên (nhãn) =====
  const RL=['Nền','Phủ nền','Vật thể','Mái / cửa'],RT=['Cây','Nhà','Nước','Đường','Tường/hàng rào','Đồ vật','Nhân vật','Quái','Trang trí','Khác'],RF=['Đi được','Chặn đường','Tương tác','Chỉ trang trí'];
  let TG=lsGet('thk_tags2d',null)||{};TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[]},TG);let tgT;const tgSave=()=>lsSet('thk_tags2d',TG);
  const KW=[[/\b(char|hero|nhan vat|player|npc|human|cai-bang|vo-dang)/,'Nhân vật'],[/\b(enemy|monster|quai|boss|slime|skeleton)/,'Quái'],[/\b(tree|forest|bush|plant|flower|cay|hoa)\b/,'Cây'],[/\b(house|build|home|roof|nha|mai)\b/,'Nhà'],[/\b(water|lake|river|sea|nuoc|song)\b/,'Nước'],[/\b(road|path|street|grass|dirt|floor|ground|duong|nen)\b/,'Đường'],[/\b(wall|fence|gate|rao|tuong|cong)\b/,'Tường/hàng rào'],[/\b(item|prop|chest|tool|weapon|food|do vat)\b/,'Đồ vật'],[/\b(dungeon|deco|ham nguc|trang tri)\b/,'Trang trí']];
  const GT=new Map();
  function guessType(sid){const sh=sheets[sid];if(GT.has(sh.name))return GT.get(sh.name);let ty=null;const BI={1:'Nhà',2:'Trang trí',3:'Nhân vật'};if(sid<4)ty=BI[sid]||null;if(!ty){const nm=sh.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');for(const [re,y] of KW)if(re.test(nm)){ty=y;break;}}GT.set(sh.name,ty);return ty;}
  function eff(sid,idx){const sh=sheets[sid],base={};const m=sh.img?emptyMap(sh):null;if(m&&m[idx]===2){base.layer=0;base.fn='Đi được';}else{base.layer=2;base.fn='Chặn đường';}const ty=guessType(sid);if(ty)base.type=ty;return Object.assign(base,TG.sheets[sh.name],TG.tiles[sh.name+'#'+idx]);}
  const RS={q:'',L:null,T:null,F:null,src:'all',sh:-1,multi:false,pick:new Map(),lim:300,focus:false,cur:null};
  const EMP=new WeakMap();
  function emptyMap(sh){let m=EMP.get(sh.img);if(m)return m;const n=sh.cols*sh.rows;m=new Uint8Array(n);if(n>20000){EMP.set(sh.img,m);return m;}
    const c=document.createElement('canvas');c.width=sh.img.width;c.height=sh.img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sh.img,0,0);const D=g.getImageData(0,0,c.width,c.height).data,W=c.width,st=sh.tw+sh.margin;
    for(let r=0;r<sh.rows;r++)for(let cc=0;cc<sh.cols;cc++){let any=0,op=0;for(let y=0;y<sh.tw;y++)for(let x=0;x<sh.tw;x++){const a=D[((r*st+y)*W+cc*st+x)*4+3];if(a>10)any=1;if(a>200)op++;}m[r*sh.cols+cc]=!any?1:(op>=sh.tw*sh.tw*.96?2:0);}
    EMP.set(sh.img,m);return m;}
  function noteRecent(v){if(!v)return;const d=dec(v);if(!sheets[d.sid])return;const key=sheets[d.sid].name+'#'+d.idx;if(TG.recent[0]===key)return;TG.recent=[key].concat(TG.recent.filter(k=>k!==key)).slice(0,60);clearTimeout(tgT);tgT=setTimeout(tgSave,1500);}
  function autoTag(){let ns=0,nt=0;
    const cnt={};M.layers.forEach((a,l)=>{for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const d=dec(v),k=d.sid+':'+d.idx;const o=cnt[k]||(cnt[k]={sid:d.sid,idx:d.idx,l:[0,0,0,0],b:0,n:0});o.l[l]++;o.n++;if(M.blk[i])o.b++;}});
    for(const k in cnt){const o=cnt[k],sh=sheets[o.sid];if(!sh)continue;const key=sh.name+'#'+o.idx,t=TG.tiles[key]||{},base=TG.sheets[sh.name]||{};let ch=0;
      if(t.layer==null&&base.layer==null){t.layer=o.l.indexOf(Math.max(...o.l));ch=1;}
      if(!t.fn&&!base.fn){t.fn=t.layer===3?'Chỉ trang trí':(o.b>o.n/2?'Chặn đường':'Đi được');ch=1;}
      if(ch){TG.tiles[key]=t;nt++;}}
    for(const e of M.ents){if(!e.tile||!sheets[e.tile.sid])continue;const key=sheets[e.tile.sid].name+'#'+e.tile.idx,t=TG.tiles[key]||{};if(!t.type&&!(TG.sheets[sheets[e.tile.sid].name]||{}).type){t.type=e.t==='enemy'?'Quái':e.t==='npc'?'Nhân vật':'Đồ vật';TG.tiles[key]=t;nt++;}}
    tgSave();toast('Đã tinh chỉnh nhãn theo bản đồ của bạn: '+nt+' ô');}
  function keepScroll(f){const a=pn.scrollTop,b=body.scrollTop;f();pn.scrollTop=a;body.scrollTop=b;}
  const QS={sh:-1,lim:90};
  function quickPick(){const wrap=el('div',{style:'margin-top:8px;padding:8px;border:1px solid #34485a;border-radius:10px'});
    if(act>=4){wrap.append(el('div',{class:'hint'},'Lớp Vùng chặn: chọn ✏ Vẽ rồi kéo trên bản đồ để chặn đường, 🧽 Xóa để mở lại.'));return wrap;}
    if(!TG.auto){TG.auto=1;autoTag();}
    const hd=el('div',{class:'row'},el('span',{class:'lbl',style:'font-weight:700'},'Đồ của lớp '+RL[act]+' · đang cầm:'),el('canvas',{class:'stampc',style:'height:38px;width:auto'}));wrap.append(hd);
    const sl=el('select',{class:'num',style:'max-width:100%',onchange:e=>{QS.sh=+e.target.value;QS.lim=90;draw();}},el('option',{value:-1},'Tất cả bộ'),visSh().map(i=>el('option',{value:i},sheets[i].name)));if(HID.has(QS.sh))QS.sh=-1;sl.value=QS.sh;
    wrap.append(el('div',{class:'row'},sl,act===2?btn('🏠 Mẫu 2D (nhà, cây lớn)',()=>{tab='mau';draw();}):btn('🔎 Xem thêm bộ lọc',()=>{RS.L=act;tab='res';draw();})));
    const out=[];let total=0;
    sheets.forEach((sh,sid)=>{if(HID.has(sid))return;if(QS.sh>=0&&QS.sh!==sid)return;if(!sh.img||!sh.cols)return;const em=emptyMap(sh);
      for(let idx=0;idx<sh.cols*sh.rows;idx++){if(em[idx]===1)continue;const e=eff(sid,idx);if(e.layer!==act)continue;total++;if(out.length<QS.lim)out.push({sid,idx,e});}});
    const cur=stamp.tiles&&!stamp.multi&&stamp.tiles.length===1?stamp.tiles[0]:0;
    const grid=el('div',{style:'display:flex;flex-wrap:wrap;gap:3px;margin:6px 0'});
    for(const o of out){const v=enc(o.sid,o.idx);
      const c=el('canvas',{width:32,height:32,title:sheets[o.sid].name+' #'+o.idx,style:'width:44px;height:44px;image-rendering:pixelated;background:#2a3340;border-radius:4px;cursor:pointer;border:2px solid '+(v===cur?'#3ddc84':'transparent')+';box-sizing:border-box'});
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;drawTile(g,v,0,0,32);
      c.addEventListener('click',()=>{stamp={w:1,h:1,multi:false,tiles:[v]};tool='draw';noteRecent(v);fillArm=!!sel;[...grid.children].forEach(x=>x.style.borderColor='transparent');c.style.borderColor='#3ddc84';ui.stamp&&ui.stamp();dirty=true;toast(sel?'Đã chọn — bấm vào vùng đã chọn để đổ cả vùng':'Đã chọn — bấm hoặc kéo trên bản đồ để vẽ');});
      grid.append(c);}
    wrap.append(grid);
    if(!total)wrap.append(el('div',{class:'hint'},'Chưa có đồ nào gắn cho lớp này. Nạp tài nguyên ở tab 💾 Tệp, hoặc bấm "Xem thêm bộ lọc".'));
    if(total>out.length)wrap.append(el('div',{class:'row'},btn('Hiện thêm…',()=>{QS.lim+=90;keepScroll(draw);}),el('span',{class:'lbl'},out.length+' / '+total)));
    setTimeout(()=>ui.stamp&&ui.stamp(),0);return wrap;}
  function resTab(){const S=RS;if(!TG.auto){TG.auto=1;autoTag();}const used=new Set();M.layers.forEach(a=>a.forEach(v=>{if(v){const d=dec(v);used.add(d.sid+':'+d.idx);}}));
    const reset=()=>{S.lim=300;draw();};
    const q=el('input',{placeholder:'🔎 Tìm: tên tileset, loại, tác dụng…',style:'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:14px;margin-bottom:6px'});q.value=S.q;
    q.addEventListener('input',()=>{S.q=q.value;S.focus=true;clearTimeout(S.t);S.t=setTimeout(reset,250);});body.append(el('div',{class:'row',style:'margin-bottom:6px'},btn('🗑 XOÁ TẤT CẢ tài nguyên',wipeAll,'background:#b3402f;color:#fff'),btn('🗑 Chọn xoá từng cái…',manageSheets),btn('➕ Thêm ảnh…',addSheet),btn('📦 Nạp .zip/.rar…',addZip),btn('▦ Ảnh tileset ô lưới (nhập cỡ ô)…',addGridSheet)),q);
    const chipRow=(lbl,arr,key,idxMode)=>el('div',{class:'row'},el('span',{class:'lbl'},lbl),btn('Tất cả',()=>{S[key]=null;reset();},S[key]==null?'on':''),arr.map((n,i)=>{const v=idxMode?i:n;return btn(n,()=>{S[key]=S[key]===v?null:v;reset();},S[key]===v?'on':'');}));
    body.append(chipRow('Lớp: ',RL,'L',true),chipRow('Loại: ',RT,'T',false),chipRow('Tác dụng: ',RF,'F',false));
    const SRC=[['all','Tất cả'],['fav','⭐ Yêu thích'],['recent','🕘 Mới dùng'],['unused','🆕 Chưa dùng'],['untag','❔ Chưa gắn nhãn']];
    body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Nguồn: '),SRC.map(([k,n])=>btn(n,()=>{S.src=k;reset();},S.src===k?'on':''))));
    const sel=el('select',{class:'num',style:'max-width:100%',onchange:e=>{S.sh=+e.target.value;S.pick.clear();reset();}},el('option',{value:-1},'Tất cả tileset'),visSh().map(i=>el('option',{value:i},sheets[i].name)));if(HID.has(S.sh))S.sh=-1;sel.value=S.sh;
    body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Tileset: '),sel,btn('🪄 Tinh chỉnh theo bản đồ',()=>{autoTag();draw();})));
    const qq=S.q.trim().toLowerCase().split(/\s+/).filter(Boolean);const out=[];let total=0;
    sheets.forEach((sh,sid)=>{if(HID.has(sid))return;if(S.sh>=0&&S.sh!==sid)return;if(!sh.img||!sh.cols)return;const em=emptyMap(sh);
      for(let idx=0;idx<sh.cols*sh.rows;idx++){if(em[idx]===1)continue;const key=sh.name+'#'+idx,e=eff(sid,idx);
        if(S.L!=null&&e.layer!==S.L)continue;if(S.T&&e.type!==S.T)continue;if(S.F&&e.fn!==S.F)continue;
        if(S.src==='fav'&&!TG.fav.includes(key))continue;if(S.src==='recent'&&!TG.recent.includes(key))continue;if(S.src==='unused'&&used.has(sid+':'+idx))continue;if(S.src==='untag'&&(e.layer!=null||e.type||e.fn))continue;
        if(qq.length){const hay=(sh.name+' '+(e.type||'')+' '+(e.fn||'')+(e.layer!=null?' '+RL[e.layer]:'')).toLowerCase();if(!qq.every(w=>hay.includes(w)))continue;}
        total++;if(S.src==='recent'||out.length<S.lim)out.push({sid,idx,key,e});}});
    if(S.src==='recent')out.sort((a,b)=>TG.recent.indexOf(a.key)-TG.recent.indexOf(b.key));
    const shown=out.slice(0,S.lim);
    body.append(el('div',{class:'row'},btn(S.multi?'☑ Đang chọn nhiều (bấm để tắt)':'☐ Chọn nhiều để gắn nhãn',()=>{S.multi=!S.multi;S.pick.clear();keepScroll(draw);},S.multi?'on':''),el('span',{class:'lbl'},'Tìm thấy '+total+' ô')));
    const cur=stamp.tiles&&!stamp.multi&&stamp.tiles.length===1?stamp.tiles[0]:0;
    const grid=el('div',{style:'display:flex;flex-wrap:wrap;gap:3px;margin:6px 0'});
    for(const o of shown){const v=enc(o.sid,o.idx);const ttl=sheets[o.sid].name+' #'+o.idx+'\n'+[o.e.layer!=null?RL[o.e.layer]:null,o.e.type,o.e.fn].filter(Boolean).join(' · ');
      const bc=S.pick.has(o.key)?'#4fd1ff':TG.fav.includes(o.key)?'#ffd24a':v===cur?'#3ddc84':'transparent';
      const c=el('canvas',{width:32,height:32,title:ttl,style:'width:38px;height:38px;image-rendering:pixelated;background:#2a3340;border-radius:4px;cursor:pointer;border:2px solid '+bc+';box-sizing:border-box'});
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;drawTile(g,v,0,0,32);
      c.addEventListener('click',()=>{if(S.multi){S.pick.has(o.key)?S.pick.delete(o.key):S.pick.set(o.key,o);keepScroll(draw);return;}
        stamp={w:1,h:1,multi:false,tiles:[v]};if(!['draw','rect','fill'].includes(tool))tool='draw';if(o.e.layer!=null)act=o.e.layer;noteRecent(v);
        [...grid.children].forEach(x=>{if(x.style.borderColor==='rgb(61, 220, 132)')x.style.borderColor='transparent';});c.style.borderColor='#3ddc84';
        toast('Đã chọn ô — chạm bản đồ để vẽ'+(o.e.layer!=null?' (lớp '+RL[o.e.layer]+')':''));ui.stamp&&ui.stamp();dirty=true;});
      grid.append(c);}
    body.append(grid);if(!total)body.append(el('div',{class:'hint'},'Không có ô nào khớp bộ lọc. Thử bấm "Tất cả" ở từng nhóm lọc.'));
    if(total>shown.length)body.append(el('div',{class:'row'},btn('Hiện thêm '+Math.min(300,total-shown.length)+' ô…',()=>{S.lim+=300;keepScroll(draw);}),el('span',{class:'lbl'},shown.length+' / '+total)));
    const setTag=(store,field,val)=>{for(const o of store){const t=o.t,cv=t[field];if(cv===val)delete t[field];else t[field]=val;}tgSave();keepScroll(draw);};
    const chips=(store)=>[el('div',{class:'row'},el('span',{class:'lbl'},'Lớp: '),RL.map((n,i)=>btn(n,()=>setTag(store(),'layer',i)))),el('div',{class:'row'},el('span',{class:'lbl'},'Loại: '),RT.map(n=>btn(n,()=>setTag(store(),'type',n)))),el('div',{class:'row'},el('span',{class:'lbl'},'Tác dụng: '),RF.map(n=>btn(n,()=>setTag(store(),'fn',n))))];
    if(S.multi){const box=el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'});
      box.append(el('div',{class:'lbl'},'🏷 Gắn nhãn cho '+S.pick.size+' ô đã chọn (bấm lại nhãn đó để bỏ)'));
      box.append(el('div',{class:'row'},btn('☑ Chọn hết ô đang hiện',()=>{shown.forEach(o=>S.pick.set(o.key,o));keepScroll(draw);}),btn('☐ Bỏ chọn',()=>{S.pick.clear();keepScroll(draw);}),
        btn('⭐ Yêu thích',()=>{for(const k of S.pick.keys()){TG.fav.includes(k)?TG.fav=TG.fav.filter(x=>x!==k):TG.fav.push(k);}tgSave();keepScroll(draw);}),
        btn('✖ Xóa nhãn',()=>{for(const k of S.pick.keys())delete TG.tiles[k];tgSave();keepScroll(draw);}),
        btn('🖌 Dùng làm stamp',()=>{const a=[...S.pick.values()];if(!a.length)return toast('Chưa chọn ô nào');if(a.some(o=>o.sid!==a[0].sid))return toast('Chỉ ghép stamp từ ô cùng một tileset');const sh=sheets[a[0].sid];
          const cs=a.map(o=>o.idx%sh.cols),rs=a.map(o=>Math.floor(o.idx/sh.cols));const c0=Math.min(...cs),c1=Math.max(...cs),r0=Math.min(...rs),r1=Math.max(...rs);if((c1-c0+1)>24||(r1-r0+1)>24)return toast('Vùng quá lớn (tối đa 24×24 ô)');
          const tiles=[];for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++)tiles.push(enc(a[0].sid,j*sh.cols+i));stamp={w:c1-c0+1,h:r1-r0+1,multi:false,tiles,sheet:{sid:a[0].sid,c0,r0,c1,r1}};tool='draw';S.multi=false;S.pick.clear();tab='tools';draw();toast('Đã lấy làm stamp '+stamp.w+'×'+stamp.h);})));
      chips(()=>[...S.pick.keys()].map(k=>({t:TG.tiles[k]||(TG.tiles[k]={})}))).forEach(x=>box.append(x));
      if(S.sh>=0){const nm=sheets[S.sh].name;box.append(el('div',{class:'lbl',style:'margin-top:6px'},'📦 Gắn nhãn CẢ tileset "'+nm+'" (ô nào cần riêng thì gắn đè ở trên):'));chips(()=>[{t:TG.sheets[nm]||(TG.sheets[nm]={})}]).forEach(x=>box.append(x));
        box.append(el('div',{class:'row'},btn('✖ Xóa nhãn tileset này',()=>{delete TG.sheets[nm];tgSave();keepScroll(draw);})));}
      body.append(box);}
    else body.append(el('div',{class:'hint'},'Nhãn đã được app tự đoán (ô đặc kín → Nền, còn lại → Vật thể; loại theo tên tileset; nút 🪄 tinh chỉnh theo cách bạn đã vẽ). Bấm 1 ô để chọn vẽ ngay (nếu ô có nhãn lớp, app tự chuyển sang lớp đó). Muốn gắn nhãn: bật "Chọn nhiều", chọn các ô rồi bấm nhãn. Nhãn mặc định có thể gắn cho cả tileset khi đang lọc 1 tileset.'));
    if(S.focus){S.focus=false;q.focus();q.setSelectionRange(q.value.length,q.value.length);}}
  /* NẠP NGUYÊN HÌNH: không hỏi cỡ ô. Mỗi vật (mảng ảnh liền nhau) thành 1 ô 128×128, thu nhỏ vừa khung nếu to hơn, không bao giờ cắt */
  const normP=t=>(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  function guessObj(path){const p='/'+normP(path).replace(/[_\s]+/g,'-')+'/',w=re=>re.test(p);let type=null,layer=2,fn='Chặn đường';
    if(w(/[\/-](bong|shadow)[\/.-]/)){return {type:'Trang trí',layer:1,fn:'Chỉ trang trí'};}
    if(w(/[\/-](nhan-vat|char|hero|npc|nhan-vat)[\/.-]/))type='Nhân vật';
    else if(w(/[\/-](quai|monster|enemy|boss)[\/.-]/))type='Quái';
    else if(w(/[\/-](cay|tree|bui|co|hoa|tre|truc|lieu|trung|rung|la-)/))type='Cây';
    else if(w(/[\/-](nha|tram|chua|dinh|lau|tuu|mon|dien|mai|thap|kho|ren|leu|quan|tent|house|building|kien-truc|nha-cua)/))type='Nhà';
    else if(w(/[\/-](nuoc|song|suoi|thac|ao|water)/))type='Nước';
    else if(w(/[\/-](rao|tuong|cot|lan-can|fence|wall)/))type='Tường/hàng rào';
    else if(w(/[\/-](ban|ghe|thung|hop|ruong|binh|vat|den|bia|do-vat|chest|prop|cho)/))type='Đồ vật';
    else if(w(/[\/-](da|nui|thach|doi|deco|trang-tri|canh-quan|sen)/))type='Trang trí';
    if(w(/[\/-](che|lop-che|mai-che|overlay)[\/.-]/)){layer=3;fn='Chỉ trang trí';}
    if(type==='Trang trí'&&layer===2)fn='Đi được';
    return type?{type,layer,fn}:null;}
  /* nhận diện ô nền ISOMETRIC thật: phiến hình thoi (đỉnh nhọn trên + đáy nhọn dưới) có độ dày */
  function isoSlab(dd,w,h){if(w<48||h<24)return null;const wd=new Int32Array(h);let tot=0,mx=0;
    for(let y=0;y<h;y++){let a=-1,b=-1;for(let x=0;x<w;x++)if(dd[(y*w+x)*4+3]>40){if(a<0)a=x;b=x;tot++;}wd[y]=a<0?0:b-a+1;if(wd[y]>mx)mx=wd[y];}
    const rt=w/h,fill=tot/(w*h);if(mx<w*.9||rt<1.25||rt>3||fill<.4||fill>.9)return null;
    const t=wd[Math.floor(h*.06)],bt=wd[h-1-Math.floor(h*.06)];if(t>mx*.45||bt>mx*.45)return null;
    let sm=0,n=0;for(let y=0;y<h;y++)if(wd[y]>=mx*.97){sm+=y;n++;}if(!n)return null;const Ht=2*sm/n;if(Ht<w*.3||Ht>w*.85)return null;return {Ht};}
  /* ===== TỰ PHÂN LOẠI file nạp vào: theo tên/thư mục + đặc điểm hình ===== */
  function autoClass(path,f){const p='/'+normP(path||'').replace(/[_\s]+/g,'-')+'/',w=re=>re.test(p),B=(s)=>new RegExp('[\\/-]('+s+')([\\/.-]|$)');let type=null,layer=2,fn='Chặn đường',role=null;
    if(w(B('bong|shadow'))){return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};}
    if(w(B('lop-che|mai-che|overlay|roof|mai-nha|canopy|tan-che|lop-phu')))return {type:'Nhà',layer:3,fn:'Chỉ trang trí',role:'Mái/cửa'};
    if(w(B('decal|hoa-tiet|nen-lat|vet|suong|fog|hieu-ung|effect|puddle|stain|crack|o-sen|la-sen|cum-sen|luong-rau|ruong|dat-co|dat-nen|mat-nuoc|co-kho|rong-lat-san')))return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};
    if(w(B('nhan-vat|char|hero|npc|player')))return {type:'Nhân vật',layer:2,fn:'Chặn đường',role:'Nhân vật'};
    if(w(B('quai|monster|enemy|boss|slime|skeleton')))return {type:'Quái',layer:2,fn:'Chặn đường',role:'Quái'};
    if(w(B('cau|bridge|bac|bac-da|bac-thang|stairs|stair|ben-go|ben|dock|road|path|loi-van|lan-ranh|ramp|slope')))return {type:'Đường',layer:2,fn:'Đi được',role:'Hạ tầng'};
    if(w(B('quan-tai|coffin|bia|mo-bia|grave|tomb')))type='Đồ vật';
    else if(w(B('cay|tree|thong|bui|cum|trung|truc|lieu|dao-|palm|pine|bush|plant|flower|hoa|cactus|co-thu|oc-dao|rang')))type='Cây';
    else if(w(B('nha|tram|chua|dinh|lau|tuu|mieu|dien|thap|kho|ren|leu|quan|phu-de|hoang-cung|tent|house|building|hut|barn|shop|castle|temple|tower|kien-truc|nha-cua|cong-thanh|cong-')))type='Nhà';
    else if(w(B('nuoc|song|suoi|thac|ao|water|lake|river')))type='Nước';
    else if(w(B('rao|tuong|cot|lan-can|fence|wall|column|pillar|door|gate')))type='Tường/hàng rào';
    else if(w(B('ban|ghe|thung|hop|binh|chum|vat|den|bia|chest|barrel|crate|table|chair|prop|do-vat|coffin|quan-tai|grave|mo-bia|statue|tuong-da|lu|ruong-go|gia|de|khay|tu')))type='Đồ vật';
    else if(w(B('da|nui|thach|doi|deco|trang-tri|canh-quan|rock|stone')))type='Trang trí';
    if(!type&&f){const r=f.h/f.w;if(r<.28&&f.mean<.9){return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};}if(f.mean<.55)return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};type='Đồ vật';}
    if(type==='Trang trí')fn='Đi được';
    if(type==='Nước')fn='Chặn đường';
    const out={type:type||'Đồ vật',layer,fn,role:role||(type==='Cây'?'Cây':type==='Nhà'?'Nhà':'Vật')};
    if(f){const n=Math.max(1,Math.min(4,Math.round(f.w/220)));if(f.w>=100){out.fx=n;out.fy=n;}else{out.fx=1;out.fy=1;}}
    return out;}
  function featOf(g,b){const bw=b[2]-b[0],bh=b[3]-b[1];try{const d=g.getImageData(b[0],b[1],bw,bh).data,np=bw*bh;let op=0,sa=0;for(let q=0;q<np;q++){const a=d[q*4+3];if(a>24){op++;sa+=a;}}return {w:bw,h:bh,fill:op/np,mean:op?sa/op/255:0};}catch(x){return {w:bw,h:bh,fill:1,mean:1};}}
  async function addWhole(items){if(!items.length)return;const T=128,CAP=256,COLS=16;const HS=new Set(TG.hashes||[]);let dupI=0,dupO=0,dupW=0,dupX=0;const GR=[],ISOL=[];const fnv=(d,n)=>{let h=2166136261>>>0;for(let i=0;i<n;i++){h^=d[i];h=Math.imul(h,16777619)>>>0;}return h.toString(36);};const fnvS=t=>{let h=2166136261>>>0;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(36)+t.length.toString(36);};
    let pend=[];let sheetsMade=0,objs=0,cur=null,cnt=0,base=(items.length===1?items[0].name.replace(/\.\w+$/,''):'Hinh').slice(0,16);
    const flush=async()=>{if(!cur||!cnt)return;const s={name:(base+'-'+(++sheetsMade)).slice(0,24),url:cur.c.toDataURL('image/png'),tw:cur.T,margin:0};await loadSheet(s);sheets.push(s);uniqNames(sheets);for(const q of pend)TG.tiles[s.name+'#'+q.idx]={type:q.type,layer:q.layer,fn:q.fn,role:q.role,fx:q.fx,fy:q.fy,sc:q.sc};pend=[];cur=null;cnt=0;};
    const put=(src,sx,sy,sw,sh,tg)=>{const need=Math.max(128,Math.min(768,Math.ceil((Math.max(sw,sh)+4)/64)*64)),CO=need>256?6:16,CP=need>256?24:256;
      if(!cur||cnt>=cur.CP||cur.T!==need){return flush().then(()=>{const c=document.createElement('canvas');c.width=CO*need;c.height=Math.ceil(CP/CO)*need;cur={c,g:c.getContext('2d'),T:need,CO,CP};cur.g.imageSmoothingQuality='high';return put(src,sx,sy,sw,sh,tg);});}
      const T=cur.T,COLS=cur.CO;if(tg)pend.push({idx:cnt,type:tg.type,layer:tg.layer,fn:tg.fn,role:tg.role,fx:tg.fx==null?0:tg.fx,fy:tg.fy==null?0:tg.fy,sc:T/128});
      const k=Math.min(1,(T-4)/sw,(T-4)/sh),w=Math.max(1,Math.round(sw*k)),h=Math.max(1,Math.round(sh*k)),ox=(cnt%COLS)*T+Math.floor((T-w)/2),oy=Math.floor(cnt/COLS)*T+T-2-h;cur.g.drawImage(src,sx,sy,sw,sh,ox,oy,w,h);cnt++;objs++;};
    let i=0;for(const it of items){i++;if(i%10===1)toast('Đang xử lý ảnh '+i+'/'+items.length+'…');
      const ih='i'+fnvS(it.url);if(HS.has(ih)){dupI++;continue;}HS.add(ih);let bm;try{const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=it.url;});bm=im;}catch(e){continue;}
      const W=bm.naturalWidth,H=bm.naturalHeight;let boxes=[[0,0,W,H]];const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(bm,0,0);
      if(W>=16&&H>=16){try{const dd=g.getImageData(0,0,W,H).data,np=W*H;let op=0,wt=0;for(let q=0;q<np;q++){if(dd[q*4+3]>=250){op++;if(dd[q*4]>=240&&dd[q*4+1]>=240&&dd[q*4+2]>=240)wt++;}}
        if(op>=np*0.97){if(wt>np*0.9){dupW++;continue;}if(W>256||H>256){dupX++;continue;}const gh='o'+fnv(dd,dd.length)+'-'+W+'x'+H;if(HS.has(gh)){dupO++;continue;}HS.add(gh);GR.push(bm);continue;}}catch(e){}}
      if(W>T||H>T){try{const B=4,gw=Math.ceil(W/B),gh=Math.ceil(H/B);const d=g.getImageData(0,0,W,H).data;
        const occ=new Uint8Array(gw*gh);let tr=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=d[(y*W+x)*4+3];if(a<250)tr++;const o4=(y*W+x)*4;if(a>16&&!(a>=250&&d[o4]>=245&&d[o4+1]>=245&&d[o4+2]>=245))occ[Math.floor(y/B)*gw+Math.floor(x/B)]=1;}
        if(tr>W*H*0.02){const G=2,dil=new Uint8Array(gw*gh);for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(occ[y*gw+x])for(let yy=Math.max(0,y-G);yy<=Math.min(gh-1,y+G);yy++)for(let xx=Math.max(0,x-G);xx<=Math.min(gw-1,x+G);xx++)dil[yy*gw+xx]=1;
          const lab=new Int32Array(gw*gh),bb=[];let L=0;for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){if(!dil[y*gw+x]||lab[y*gw+x])continue;L++;const st=[[x,y]];lab[y*gw+x]=L;let x0=1e9,y0=1e9,x1=-1,y1=-1;
            while(st.length){const [cx,cy]=st.pop();if(occ[cy*gw+cx]){x0=Math.min(x0,cx);x1=Math.max(x1,cx);y0=Math.min(y0,cy);y1=Math.max(y1,cy);}
              for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=gw||ny>=gh)continue;const q=ny*gw+nx;if(dil[q]&&!lab[q]){lab[q]=L;st.push([nx,ny]);}}}
            if(x1>=0)bb.push([x0*B,y0*B,Math.min(W,(x1+1)*B),Math.min(H,(y1+1)*B)]);}
          let ch=true;while(ch){ch=false;for(let a=0;a<bb.length&&!ch;a++)for(let b=a+1;b<bb.length;b++){const p=bb[a],q=bb[b];if(p[0]<q[2]&&q[0]<p[2]&&p[1]<q[3]&&q[1]<p[3]){bb[a]=[Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[2],q[2]),Math.max(p[3],q[3])];bb.splice(b,1);ch=true;break;}}}
          const ok=bb.filter(b=>(b[2]-b[0])>=8&&(b[3]-b[1])>=8);if(ok.length&&ok.length<=80)boxes=ok.sort((p,q)=>(p[1]-q[1])||(p[0]-q[0]));}}catch(e){}}
      for(const b of boxes){const bw=b[2]-b[0],bh=b[3]-b[1];let oh='',isoHit=false;try{const dd=g.getImageData(b[0],b[1],bw,bh).data;{let wt=0,tt=0;const np=bw*bh;for(let q=0;q<np;q++){const a=dd[q*4+3];if(a<250)tt++;else if(dd[q*4]>=240&&dd[q*4+1]>=240&&dd[q*4+2]>=240)wt++;}if(wt>np*0.35&&tt<np*0.1){dupW++;continue;}}oh='o'+fnv(dd,dd.length)+'-'+bw+'x'+bh;if(!HS.has(oh)){const iso=isoSlab(dd,bw,bh);if(iso){HS.add(oh);ISOL.push({bm,b,iso});isoHit=true;}}}catch(e){}if(isoHit)continue;if(oh&&HS.has(oh)){dupO++;continue;}if(oh)HS.add(oh);await put(bm,b[0],b[1],bw,bh,autoClass(it.path||it.name,featOf(g,b)));}}
    await flush();
    if(GR.length){const GT2=32,GC=16,cv=document.createElement('canvas');cv.width=GC*GT2;cv.height=Math.ceil(GR.length/GC)*GT2;const cg=cv.getContext('2d');cg.imageSmoothingQuality='high';GR.forEach((im,k)=>cg.drawImage(im,(k%GC)*GT2,Math.floor(k/GC)*GT2,GT2,GT2));
      const gs={name:('Nen-'+Date.now().toString(36).slice(-4)),url:cv.toDataURL('image/png'),tw:GT2,margin:0};await loadSheet(gs);sheets.push(gs);uniqNames(sheets);GR.forEach((_,k)=>{TG.tiles[gs.name+'#'+k]={type:'Đường',layer:0,fn:'Đi được'};});sheetsMade++;}
    if(ISOL.length){const T2=128,GC=16,cv=document.createElement('canvas');cv.width=GC*T2;cv.height=Math.ceil(ISOL.length/GC)*T2;const cg=cv.getContext('2d');cg.imageSmoothingQuality='high';
      ISOL.forEach((q,k)=>{const bw=q.b[2]-q.b[0],bh=q.b[3]-q.b[1];const kx=T2/bw;let ky=(T2/2)/q.iso.Ht;if(bh*ky>T2)ky=T2/bh;cg.drawImage(q.bm,q.b[0],q.b[1],bw,bh,(k%GC)*T2,Math.floor(k/GC)*T2,T2,bh*ky);});
      const is={name:('Iso-'+Date.now().toString(36).slice(-4)),url:cv.toDataURL('image/png'),tw:T2,margin:0,iso:1};await loadSheet(is);sheets.push(is);uniqNames(sheets);ISOL.forEach((_,k)=>{TG.tiles[is.name+'#'+k]={type:'Đường',layer:0,fn:'Đi được'};});sheetsMade++;}
    TG.hashes=[...HS].slice(-60000);tgSave();after();draw();curSheet=sheets.length-1;toast('Đã nạp '+objs+' vật mới'+(GR.length?' + '+GR.length+' ô NỀN':'')+(ISOL.length?' + '+ISOL.length+' ô ISO (phiến hình thoi)':'')+' ('+sheetsMade+' tileset). Bỏ '+dupI+' ảnh trùng + '+dupO+' vật trùng'+(dupW?', loại '+dupW+' ảnh NỀN TRẮNG (lỗi, không dùng được)':'')+(dupX?', loại '+dupX+' ảnh CHỤP MÀN HÌNH/ẢNH NỀN LỚN (không phải sprite)':'')+'.');}
  async function addMany(items){if(!items.length)return;if(items.length>40&&!(await yes('Thêm '+items.length+' ảnh làm tileset? Nhiều ảnh có thể làm đầy bộ nhớ tự lưu của trình duyệt.')))return;
    const g=await guessTile(items[0].url);const tw=+(await ask((g?'Ảnh đầu tiên: app đoán ô '+g.tw+' px, khe '+g.m+' px. ':'')+'Kích thước mỗi ô (px) — áp dụng cho cả '+items.length+' ảnh?',g?String(g.tw):'16'));if(!tw)return;const m=+(await ask('Khoảng cách giữa các ô (px)?',g?String(g.m):'0'))||0;let first=-1,n=0;
    for(const it of items){const s={name:it.name.replace(/\.\w+$/,'').slice(0,24),url:it.url,tw,margin:m};await loadSheet(s);sheets.push(s);uniqNames(sheets);if(first<0)first=sheets.length-1;n++;}
    curSheet=first;after();draw();toast('Đã thêm '+n+' tileset');}
  function addSheet(){pickFiles('image/*',items=>addWhole(items),false);}
  function addGridSheet(){pickFiles('image/*',items=>items.length===1?addSheetUrl(items[0].url,items[0].name):addMany(items),false);}
  /* Nạp nhiều gói zip một lần, tự phân loại: Tiles/ → 1 tileset ghép lưới; Atlas/ → tileset; còn lại (Sprites, lớp phủ…) bỏ qua để nhẹ máy */
  async function bulkPacks(){const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept='.zip,.rar,application/zip,application/x-zip-compressed';
    inp.onchange=async()=>{const fs=[...inp.files];if(!fs.length)return;let nt=0,na=0,skip=0;const seen=new Set();
      for(const f of fs){toast('Đang đọc '+f.name+'…');let u8;try{u8=new Uint8Array(await f.arrayBuffer());}catch(e){continue;}
        const key=f.name.replace(/^[0-9a-f]{8}-/,'')+'|'+f.size;if(seen.has(key)){skip++;continue;}seen.add(key);
        const pk=f.name.replace(/^[0-9a-f]{8}-/,'').replace(/\.zip$/i,'').slice(0,18);let files;
        try{files=unzipSync(u8,{filter:e=>/\.(png|json)$/i.test(e.name)&&!/(^|\/)(__MACOSX|\._)/.test(e.name)&&/(^|\/)(Tiles|Atlas)\//i.test(e.name)});}catch(e){continue;}
        const tiles=Object.keys(files).filter(n=>/(^|\/)Tiles\/[^\/]+\.png$/i.test(n)).sort(),atl=Object.keys(files).filter(n=>/(^|\/)Atlas\/[^\/]+\.png$/i.test(n)).sort();
        const toUrl=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b);});
        if(tiles.length){const T=64,cols=Math.min(16,tiles.length),rows=Math.ceil(tiles.length/cols),c=document.createElement('canvas');c.width=cols*T;c.height=rows*T;const g=c.getContext('2d');g.imageSmoothingQuality='high';
          for(let i=0;i<tiles.length;i++){try{const bm=await createImageBitmap(new Blob([files[tiles[i]]],{type:'image/png'}));g.drawImage(bm,(i%cols)*T,Math.floor(i/cols)*T,T,T);}catch(e){}}
          const s={name:(pk+'-Tiles').slice(0,24),url:c.toDataURL('image/png'),tw:T,margin:0};await loadSheet(s);sheets.push(s);nt++;}
        for(const n of atl){const jn=n.replace(/\.png$/i,'.json');let fr=null;try{fr=Object.values(JSON.parse(new TextDecoder().decode(files[jn])).frames||{});}catch(e){}
          const nm=(pk+'-'+n.split('/').pop().replace(/\.png$/i,'')).slice(0,24);let bmA;try{bmA=await createImageBitmap(new Blob([files[n]],{type:'image/png'}));}catch(e){continue;}
          if(!fr||!fr.length){skip++;continue;}
          /* mỗi vật trong atlas → 1 ô 128×128 (thu nhỏ vừa khung, đặt chân ở đáy) để không bị cắt vỡ */
          const T=128,cols=Math.min(8,fr.length),rows=Math.ceil(fr.length/cols),c=document.createElement('canvas');c.width=cols*T;c.height=rows*T;const g=c.getContext('2d');g.imageSmoothingQuality='high';
          fr.forEach((q,i)=>{const f=q.frame;if(!f)return;const k=Math.min((T-4)/f.w,(T-4)/f.h);const w=f.w*k,h=f.h*k;g.drawImage(bmA,f.x,f.y,f.w,f.h,(i%cols)*T+(T-w)/2,Math.floor(i/cols)*T+T-2-h,w,h);});
          const sh={name:nm,url:c.toDataURL('image/png'),tw:T,margin:0};await loadSheet(sh);sheets.push(sh);na++;}}
      uniqNames(sheets);if(nt+na)curSheet=sheets.length-1;after();draw();
      toast('Đã nạp '+nt+' tileset ô nền + '+na+' atlas'+(skip?' (bỏ '+skip+' gói trùng)':'')+'. Sprites/lớp phủ bỏ qua để nhẹ.');};
    inp.click();}
  /* ---- Gói xuong-pack (.zip): app tự đọc pack.json, sinh bộ nền + bộ vật, báo vai trò/họ bố cục ---- */
  let packRep=null;
  let VIDX=[];async function refreshProfiles(){VIDX=await vatIndex();loadProfiles(VIDX);}
  async function savePacks(){const out=[];for(const id of customPackIds()){const v=await vatPack(id),n=await nenPack(id).catch(()=>null);out.push({id,vat:v,nen:n&&n.id===id?n:null});}await idbSet('xuong_packs',out);}
  function packReport(){const R=packRep;if(!R)return el('div');const d=el('div',{style:'margin-top:8px;border:1px solid '+(R.ok?'#4a7a5a':'#a5532f')+';border-radius:10px;padding:8px;background:#141a17'});
    d.append(el('div',{class:'lbl',style:'color:'+(R.ok?'#9fe0b0':'#ff9b8a')},(R.ok?'✅ Đã nạp gói: ':'⚠ Chưa nạp được gói: ')+R.name));
    for(const e of R.errors)d.append(el('div',{class:'hint',style:'color:#ff9b8a'},'✘ '+e));
    if(R.ok){d.append(el('div',{class:'hint'},R.nItems+' mảnh · '+R.nGround+' ô nền · vai trò: '+R.roles.map(r=>(ROLES[r]||r)).join(', ')));
      for(const f of R.families)d.append(el('div',{class:'hint',style:'color:'+(f.ok?'#9fe0b0':'#e8c08a')},(f.ok?'✔ Dựng được: ':'✘ Chưa dựng được: ')+f.name+(f.ok?'':' — thiếu vai trò '+f.miss.join(', '))));
      const w=R.warns.slice(0,12);for(const x of w)d.append(el('div',{class:'hint',style:'color:#e8c08a'},'⚠ '+x));if(R.warns.length>12)d.append(el('div',{class:'hint',style:'color:#e8c08a'},'⚠ …và '+(R.warns.length-12)+' cảnh báo nữa'));}
    return d;}
  /* nhân vật dựng sẵn (Kenney Male): dải ảnh theo hướng + hành động, tạo bộ hoạt ảnh và đặt làm nhân vật chính */
  async function addCharSet(url){let j;try{j=await (await fetch(url+'?v=1')).json();}catch(e){toast('Không tải được nhân vật');return;}
    toast('Đang thêm nhân vật…');const st={};
    for(const [k,v] of Object.entries(j.st)){const names=[];for(let d=0;d<v.strips.length;d++){const nm=j.id+'_'+k+'_'+d;if(!sheets.find(q=>q.name===nm)){const sh={name:nm,url:v.strips[d],tw:j.fw,margin:0};await loadSheet(sh);sheets.push(sh);}names.push(nm);}
      st[k]={src:names,dirs:names.length,n:v.n,fw:j.fw,fh:j.fh,fps:v.fps,ax:j.ax,ay:j.ay};}
    pushUndo();const C=M.cfg;C.anims=(C.anims||[]).filter(a=>a.id!==j.id);C.anims.push({id:j.id,name:j.name,sc:j.sc,oy:j.oy,map:j.map,st});C.heroAnim=j.id;after();draw();toast('Đã thêm '+j.name+' và đặt làm nhân vật chính');}
  async function addPackZip(){pickFiles('.zip,application/zip',async files=>{const f=files[0]&&files[0].file;if(!f)return;toast('Đang đọc gói…');
      try{const u8=new Uint8Array(await f.arrayBuffer());const rz=await readZip(u8,f.name);
        if(rz.error){packRep={ok:false,name:f.name,errors:[rz.error],warns:[]};draw();return;}
        const ck=rz.check;if(!ck.ok){packRep={ok:false,name:rz.man.name||f.name,errors:ck.errors,warns:ck.warns};draw();return;}
        const b=await buildPack(rz.man,rz.files,t=>toast(t));registerPack(b);await savePacks();await refreshProfiles();
        window.__lastPack={id:rz.man.id,man:rz.man};
        packRep={ok:true,name:rz.man.name+' ('+rz.man.id+')',errors:[],warns:ck.warns,nItems:b.nItems,nGround:b.nGround,roles:b.roles,families:b.families};
        try{const r=await ensureNen(rz.man.id);curSheet=r.sid;}catch(e){}
        draw();toast('Đã nạp gói '+rz.man.name);}catch(e){console.error(e);packRep={ok:false,name:f.name,errors:['Lỗi đọc gói: '+(e&&e.message||e)],warns:[]};draw();}},false);}
  /* danh sách gói 2D dựng sẵn (packs/*.zip + packs/index.json, mỗi gói có pack.json riêng) — nạp từng gói theo nhu cầu */
  async function builtinPacks(){let ix;try{ix=await (await fetch('packs/index.json?v=1')).json();}catch(e){toast('Không tải được danh sách gói 2D có sẵn');return;}
    let have=new Set();try{for(const p of (await idbGet('xuong_packs'))||[])if(p.vat)have.add(p.vat.id);}catch(e){}
    const ov=el('div',{style:'position:fixed;inset:0;background:#000b;z-index:99999;display:flex;align-items:center;justify-content:center'}),
      box=el('div',{style:'background:#1b2a22;border:1px solid #4a7a5a;border-radius:12px;padding:12px;width:min(760px,94vw);max-height:88vh;overflow:auto;color:#e6efe8'});
    ov.append(box);box.append(el('div',{class:'row',style:'justify-content:space-between;align-items:center'},el('div',{class:'lbl',style:'color:#9fe0b0'},'📚 GÓI 2D CÓ SẴN — mỗi gói là một zip có pack.json riêng'),btn('✕ Đóng',()=>ov.remove())));
    box.append(el('div',{class:'hint'},'Bấm "Nạp" để thêm gói vào app (lưu trong trình duyệt). Gói nạp xong hiện ở tab 🧩 Vật thể / nền.'));
    for(const e of ix){if(e.skipped){box.append(el('div',{class:'hint',style:'border-top:1px solid #2e4a3a;padding:6px 0'},'⊘ Không nạp — '+e.name+': '+e.reason));continue;}const st=el('span',{class:'hint',style:'margin-left:8px'},have.has(e.id)?'✔ đã nạp':'');
      const b=btn(have.has(e.id)?'Nạp lại':'Nạp',async()=>{b.disabled=true;st.textContent='đang nạp…';
        try{const u8=await fetchBin('packs/'+e.file);const rz=await readZip(u8,e.file);
          if(rz.error||!rz.check.ok){st.textContent='✘ '+(rz.error||rz.check.errors[0]);b.disabled=false;return;}
          const bd=await buildPack(rz.man,rz.files,t=>{st.textContent=t;});registerPack(bd);await savePacks();await refreshProfiles();
          packRep={ok:true,name:rz.man.name+' ('+rz.man.id+')',errors:[],warns:rz.check.warns,nItems:bd.nItems,nGround:bd.nGround,roles:bd.roles,families:bd.families};
          st.textContent='✔ đã nạp '+bd.nItems+' mảnh';b.disabled=false;b.textContent='Nạp lại';draw();}
        catch(err){console.error(err);st.textContent='✘ lỗi: '+(err&&err.message||err);b.disabled=false;}});
      box.append(el('div',{style:'border-top:1px solid #2e4a3a;padding:6px 0'},el('div',{class:'row',style:'align-items:center'},el('b',{},e.name),el('span',{class:'hint',style:'margin-left:8px'},e.assets+' mục · '+(e.bytes/1e6).toFixed(1)+' MB · ô '+e.tile.join('×')),b,st),
        el('div',{class:'hint'},'Giấy phép: '+e.license),e.note?el('div',{class:'hint'},e.note):''));}
    document.body.append(ov);}
  window.__exportRoundTrip=async(u8,nm)=>{const rz=await readZip(u8,nm);const z=exportPackZip(rz.man,rz.files);return z;};
  window.__vatIndexEntry=async id=>(await vatIndex()).find(o=>o.id===id);
  window.__vatPack=vatPack;window.__nenPack=nenPack;
  window.__addPackU8=async(u8,nm)=>{const rz=await readZip(u8,nm);if(rz.error||!rz.check.ok)return {err:rz.error||rz.check.errors};const b=await buildPack(rz.man,rz.files);registerPack(b);return {id:rz.man.id,roles:b.roles,families:b.families,nItems:b.nItems,warns:rz.check.warns};};
  function addZip(){zipBrowser((u,n)=>addWhole([{url:u,name:n}]),addWhole);}
  function addGridZip(){zipBrowser(addSheetUrl,addMany);}
  function exportPNG(k){const c=document.createElement('canvas');c.width=M.w*CELL*k;c.height=M.h*CELL*k;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const sv=vis.slice();rebuild();g.drawImage(mc,0,0,c.width,c.height);c.toBlob(b=>saveFile('ban_do_2d.png',b));}
  function proj(){return {tags:TG,format:'thk-map-1',cell:CELL,w:M.w,h:M.h,layerNames:LAYN,layers:M.layers,collision:M.blk,ents:M.ents,cfg:M.cfg,sheets:sheets.map(s=>({name:s.name,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null,cols:s.cols,rows:s.rows,url:s.url})),note:'Giá trị ô v>0: n=v-1; flip=n&7 (1=ngang,2=dọc,4=chéo); t=n>>3; sheet=t>>12; tile=t&4095; tile (col,row)=(tile%cols, floor(tile/cols)); nguồn ảnh: sx=col*(tw+margin), sy=row*(tw+margin)'};}
  window.__TG=()=>TG;window.__guess=p=>guessObj(p);window.__proj=()=>proj();window.__view=()=>view;window.__redraw=()=>draw();window.__loadProj=t=>importJSON(t);
  async function openKScene(id){if(!(await yes('Mở cảnh mẫu Kenney? Bản đồ đang làm sẽ bị thay (có thể hoàn tác).')))return;toast('Đang nạp cảnh…');
    try{const r=await fetch('scene/'+id+'.json?v=1');if(!r.ok)throw 0;const o=await r.json();
      for(let i=4;i<o.sheets.length;i++){const [k,pid]=o.sheets[i].pack.split(':');if(k==='nen'){const {pk}=await ensureNen(pid);o.sheets[i]={name:'Nen-'+pid,url:pk.atlas,tw:pk.tw,margin:0,iso:2,cy:pk.cy||0,wat:[]};}else{await ensureVat(pid);const pk=await vatPack(pid);o.sheets[i]={name:'Vat-'+pid,url:pk.atlas,tw:pk.T,margin:0};}}
      await importJSON(JSON.stringify(o));}catch(e){console.error(e);toast('Không nạp được cảnh mẫu');}}
  async function openLevel1(){if(!(await yes('Mở Màn 1? Bản đồ đang làm sẽ bị thay (có thể hoàn tác). App sẽ nạp luôn nhân vật và tileset của màn.')))return;toast('Đang tải Màn 1 (~12 MB)…');
    try{const r=await fetch('man1.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;const t=await r.text();await importJSON(t);}catch(e){toast('Không tải được Màn 1 — thử tải lại trang');}}
  function exportJSON(){saveFile('ban_do_2d.json',new Blob([JSON.stringify(proj())],{type:'application/json'}));}
  function copyJSON(){navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(proj())).then(()=>toast('Đã sao chép JSON'),()=>toast('Không sao chép được'));}
  async function importJSON(t){try{const o=JSON.parse(t);if(o.format!=='thk-map-1')throw 0;if(o.tags){TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[]},o.tags);tgSave();}const smap=[0,1,2,3],ren={};for(let i=4;i<o.sheets.length;i++){const s=o.sheets[i];if(!s||!s.url){smap[i]=i<sheets.length?i:0;continue;}const ex=sheets.findIndex((q,k)=>k>=4&&q.name===s.name&&q.url===s.url);if(ex>=0){smap[i]=ex;continue;}let nm=s.name;if(sheets.some((q,k)=>k>=4&&q.name===nm)){let c=2;while(sheets.some((q,k)=>k>=4&&q.name===nm+'~'+c))c++;nm=nm+'~'+c;ren[s.name]=nm;}const ns={name:nm,url:s.url,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null};await loadSheet(ns);sheets.push(ns);smap[i]=sheets.length-1;}
      const rm=v=>{if(!v)return 0;const d=dec(v),n=smap[d.sid];return n==null||n===d.sid?v:enc(n,d.idx,d.f);};
      const lay=o.layers.map(a=>a.map(rm));const en=(o.ents||[]).map(e=>{if(e.tile&&smap[e.tile.sid]!=null)e.tile={sid:smap[e.tile.sid],idx:e.tile.idx};return e;});const cf=o.cfg||{};if(cf.hero&&smap[cf.hero.sid]!=null)cf.hero={sid:smap[cf.hero.sid],idx:cf.hero.idx};if(cf.catalog){const q=cf.catalog;if(q.ground&&smap[q.ground.sid]!=null)q.ground.sid=smap[q.ground.sid];for(const it of q.items||[])if(it.tile&&smap[it.tile.sid]!=null)it.tile={sid:smap[it.tile.sid],idx:it.tile.idx};}
      if(Object.keys(ren).length&&cf.anims)for(const a of cf.anims)for(const st of Object.values(a.st||{}))if(st.src)st.src=st.src.map(n=>ren[n]||n);
      pushUndo();M=clone({w:o.w,h:o.h,layers:lay,blk:o.collision,ents:en,cfg:cf});selId=null;after();fit();toast('Đã nhập bản đồ');}catch(e){toast('Tệp không đúng định dạng');}}
  // khởi động
  (async()=>{await Promise.all(sheets.map(loadSheet));const sv=lsGet('thk_proj2d',null);const idbC=await idbGet('thk_sheets2d');
    if(sv&&sv.layers){for(const s of ((idbC&&idbC.length)?idbC:(sv.custom||[]))){const ns=Object.assign({},s);await loadSheet(ns);sheets.push(ns);}MAPS=Array.isArray(sv.maps)&&sv.maps.length?sv.maps:[];curMap=Math.min(sv.cur||0,Math.max(0,MAPS.length-1));M=clone(MAPS.length?MAPS[curMap]:sv);if(!MAPS.length){M.name=M.name||'Màn 1';MAPS=[clone(M)];}}else{M=fromVillage();M.name='Màn 1';MAPS=[clone(M)];}
    try{const pk=await idbGet('xuong_packs');if(Array.isArray(pk))for(const p of pk)registerPack({nen:p.nen,vat:p.vat,nGround:p.nen?Object.keys(p.nen.idx).length:0,thumb:''});}catch(e){}
    try{await refreshProfiles();draw();}catch(e){}
    if(window.__gn==null)window.__gn='kenney-dia-lao';try{const r=await ensureNen(window.__gn);curSheet=r.sid;}catch(e){}
    (async()=>{try{const L=await nenIndex();let k=0;toast('Đang nạp '+L.length+' bộ nền…');for(const o of L){try{await ensureNen(o.id);k++;}catch(e){}}tgSave();after();draw();toast('Đã nạp đủ '+k+'/'+L.length+' bộ nền (xem ở tab Tileset và Tài nguyên).');}catch(e){}})();
    stamp={w:1,h:1,multi:false,tiles:[enc(0,5)]};draw();setTimeout(fit,50);})();
  async function ensureNen(id){const pk=await nenPack(id),name='Nen-'+id;let sid=sheets.findIndex((s,i)=>i>=4&&s.name===name);
    const wat=Object.entries(pk.idx).filter(([n])=>/^(nuoc|vuc|bo-00|mep-vuc-00|phien-nuoc|phien-ho)/.test(n)).map(e=>e[1]);
    if(sid>=0)sheets[sid].wat=wat;
    if(sid<0){const s={name,url:pk.atlas,tw:pk.tw,margin:0,iso:pk.iso===0?0:2,cy:pk.cy||0,wat};await loadSheet(s);sheets.push(s);sid=sheets.length-1;for(const [n,i] of Object.entries(pk.idx))TG.tiles[name+'#'+i]=nenTag(n);tgSave();}
    return {pk,sid};}
  let vatSel=null;const VROLE={'Nhà':'Nhà','Cây':'Cây','Vật':'Đồ vật','Hạ tầng':'Khác','Phủ nền':'Trang trí','Mái/cửa':'Nhà'};
  function mineItems(){const out=[];for(const [k,t] of Object.entries(TG.tiles)){if(!t||t.fx==null||t.layer<1)continue;const h=k.lastIndexOf('#'),nm=k.slice(0,h),idx=+k.slice(h+1),sid=sheets.findIndex((s,i)=>i>=4&&s.name===nm);if(sid<0||/^(Nen|Vat|Mau)-/.test(nm))continue;
      out.push({role:t.role||'Vật',name:nm+' · '+(idx+1),tile:{sid,idx},f:1,fx:t.fx,fy:t.fy,sc:t.sc||sheets[sid].tw/128,ox:0,oy:0,zb:[-t.fx,-t.fy,t.fx,t.fy]});}return out;}
  async function ensureVat(id){if(id==='mine')return mineItems();const pk=await vatPack(id),name='Vat-'+id;let sid=sheets.findIndex((s,i)=>i>=4&&s.name===name);
    if(sid<0){const s={name,url:pk.atlas,tw:pk.T,margin:0};await loadSheet(s);sheets.push(s);sid=sheets.length-1;pk.items.forEach(it=>{TG.tiles[name+'#'+it.i]={type:VROLE[it.role]||'Khác',layer:it.role==='Mái/cửa'?3:2,fn:it.role==='Mái/cửa'?'Chỉ trang trí':'Chặn đường'};});tgSave();}
    return pk.items.map(it=>({role:it.role,name:it.name,cv:it.cv?{sid,idx:it.cv}:null,tile:{sid,idx:it.i},f:1,fx:it.fx,fy:it.fy,sc:it.sc,ox:0,oy:it.oy||0,zb:it.zb||[-it.fx,-it.fy,it.fx,it.fy],zps:it.zps||null,col:it.col||null,cal:it.cal==null?null:it.cal}));}

  const M2=initMau({el,btn,toast,yes,askText,pickFiles,pickFile,zipBrowser,saveFile,idbGet,idbSet,idbDel,
    body:()=>body,isTab:()=>tab==='mau',redraw:()=>draw(),sheets:()=>sheets,loadSheet,TG:()=>TG,tgSave,
    select:it=>{vatSel=it;objType='deco';tool='obj';draw();},curSel:()=>vatSel,
    progress:t=>{let d=document.getElementById('mau-prog');if(!t){d&&d.remove();return;}if(!d){d=document.createElement('div');d.id='mau-prog';d.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:99;background:#1b2430;color:#ffd24a;border:1px solid #d9a066;border-radius:10px;padding:8px 14px;font:13px system-ui';document.body.append(d);}d.textContent=t;}});
  const mauTab=()=>M2.tab();
  function ruleBox(){const GR=window.__gr||(window.__gr={k:'dungeon',z:'m',s:'auto',l:false,y:'single'}),out=el('div',{style:'margin-top:6px'});
      const selR=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.k=e.target.value;}},Object.entries(RULES).map(([k,v])=>{const o=el('option',{value:k},v.name);if(k===GR.k)o.selected=true;return o;}));
      const selRZ=el('select',{class:'num',onchange:e=>{GR.z=e.target.value;}},[['s','Nhỏ'],['m','Vừa'],['l','Lớn']].map(([k,n])=>{const o=el('option',{value:k},n);if(k===GR.z)o.selected=true;return o;}));
      const selSh=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.s=e.target.value;}},Object.entries(SHAPES).map(([k,n])=>{const o=el('option',{value:k},n);if(k===GR.s)o.selected=true;return o;}));
      const selSB=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.sb=e.target.value;}},Object.entries(SB_KIEU).map(([k,n])=>{const o=el('option',{value:k},n);if(k===(GR.sb||'auto'))o.selected=true;return o;}));
      const mixOpts=[['','— không trộn —'],...VIDX.filter(e=>e.profiles||e.id.startsWith('kenney')).map(e=>[e.id,e.name.slice(0,48)])];
      const selMix=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.mix=e.target.value?[e.target.value]:[];}},mixOpts.map(([k,n])=>{const o=el('option',{value:k},n);if(k===((GR.mix||[])[0]||''))o.selected=true;return o;}));
      const cbL=el('input',{type:'checkbox',onchange:e=>{GR.l=e.target.checked;}});cbL.checked=!!GR.l;
      const selY=el('select',{class:'num',onchange:e=>{GR.y=e.target.value;}},[['single','Một nhà kho'],['twin','Nhà kho + nhà phụ']].map(([k,n])=>{const o=el('option',{value:k},n);if(k===GR.y)o.selected=true;return o;}));
      const showRep=R=>{out.textContent='';out.append(el('div',{class:'lbl',style:'color:'+(R.ok?'#9fe0b0':'#ff9b8a')},(R.ok?'✅ ĐẠT':'⚠ CHƯA ĐẠT')+' toàn bộ phép kiểm · hình '+(R.shape||'sân')+' · seed '+R.seed+' · thử '+R.tries+' lần'));for(const r of R.report)out.append(el('div',{class:'hint',style:'color:'+(r[1]?'#9fe0b0':'#ff9b8a')},(r[1]?'✔ ':'✘ ')+r[0]));};
      return el('div',{style:'border:1px solid #d9a066;border-radius:10px;padding:8px;margin-top:10px;background:#26201a'},
        el('div',{class:'lbl',style:'color:#e8c08a'},'🏗 DỰNG THEO NGUYÊN TẮC (theo vai trò + luật khai báo trong gói) — bố cục trước, tường suy ra, đồ đặt có luật, tự kiểm'),
        el('div',{class:'hint',style:'white-space:pre-line'},RULE_TEXT.join('\n')),
        el('div',{class:'row'},el('span',{class:'lbl'},'Kiểu'),selR,el('span',{class:'lbl'},'Cỡ'),selRZ),
        el('div',{class:'row'},el('span',{class:'lbl'},'Hình dạng (phòng)'),selSh),
        el('div',{class:'row'},el('span',{class:'lbl'},'Kiểu sân bậc'),selSB),
        el('div',{class:'row'},el('span',{class:'lbl'},'Trộn thêm đồ từ gói (sân bậc)'),selMix),
        el('div',{class:'row'},el('label',{style:'font-size:13px'},cbL,' Có phòng chữ L'),el('span',{class:'lbl'},'Sân'),selY),
        el('div',{class:'row'},btn('🏗 Dựng theo nguyên tắc',async()=>{if(!await yes('Dựng cảnh mới thay cho màn đang mở? (Ctrl+Z hoàn tác bản đồ)'))return;const R=await doGen(GR);if(R)showRep(R);},'background:#b9772b;color:#fff')),out);}
  /* dựng theo hồ sơ của gói (dùng cho nút Dựng và các nút cảnh mẫu) */
  async function doGen(GR){toast('Đang dựng…');await new Promise(r=>setTimeout(r,30));
    let R;try{R=await genRule({ensureNen,ensureVat,vatPack,sheets:()=>sheets,enc},GR.k,{size:GR.z,shape:GR.s,lshape:GR.l,yard:GR.y,sb:GR.sb,mix:GR.mix||[],seed:GR.seed});}catch(e){console.error(e);toast('Lỗi: '+(e&&e.message||e));return null;}
    if(R.error){toast(R.error);return null;}window.__lastRep=R;
    pushUndo();M={name:(RULES[GR.k].name.replace(/^\S+\s/,'').replace(/ \(.*/,'').replace(/ — .*/,'')),w:R.w,h:R.h,layers:R.layers,blk:R.blk,ents:R.ents,cfg:Object.assign({hp:6,spd:4.2,dmg:1,rng:1.5,hero:{sid:2,idx:0}},M.cfg,{view:'iso',win:'auto',zones:[]})};selId=null;after();fit();draw();toast(R.ok?'Đã dựng — đạt mọi phép kiểm':'Đã dựng — còn phép kiểm chưa đạt');return R;}
  async function genPreset(k,o){if(!(await yes('Dựng cảnh mẫu? Bản đồ đang làm sẽ bị thay (có thể hoàn tác).')))return;await doGen(Object.assign({k,z:'m',s:'auto',l:false,y:'single'},o));}
  async function genRun(){const k=window.__gk||'village',z={s:[32,24],m:[48,36],l:[64,48]}[window.__gz||'m'];
    if(!await yes('Tạo bối cảnh mới thay cho màn "'+(M.name||'')+'"?\n(Ctrl+Z hoàn tác được bản đồ; tileset mới tạo sẽ còn lại.)'))return;
    toast('Đang tạo bối cảnh…');await new Promise(r=>setTimeout(r,30));
    let vat=[];try{for(const id of (window.__gvat?[window.__gvat]:(GEN_KIND_VAT[k]||[])))vat=vat.concat(await ensureVat(id));}catch(x){console.error(x);}
    let nen=null;if(window.__gn){try{nen=await ensureNen(window.__gn);}catch(e){toast('Lỗi nạp bộ nền: '+(e&&e.message||e));return;}}
    let R;try{R=build({sheets,eff,emptyMap,visSh,enc,nen,vat,newSid:sheets.length,catalog:(M.cfg&&M.cfg.catalog)||null},{kind:k,w:z[0],h:z[1],goal:!!window.__gg,view:window.__gv||'rpg'});}catch(e){console.error(e);toast('Lỗi khi tạo: '+(e&&e.message||e));return;}
    if(R.error){toast(R.error);return;}
    pushUndo();
    if(R.newSheet){const s={name:'Gen-'+Date.now().toString(36).slice(-4),url:R.newSheet.canvas.toDataURL('image/png'),tw:64,margin:0};await loadSheet(s);sheets.push(s);uniqNames(sheets);}
    M={name:M.name,w:R.w,h:R.h,layers:R.layers,blk:R.blk,ents:R.ents,cfg:Object.assign({},M.cfg,{view:R.view||'rpg'},R.iso?{zones:R.zones||[]}:{})};selId=null;after();fit();draw();
    const i=R.info;toast('Đã tạo: '+i.placed.house+' nhà, '+i.placed.tree+' cây, '+i.placed.prop+' đồ'+((!i.house&&!i.tree)?' — chưa thấy tài nguyên gắn nhãn Cây/Nhà (xem tab 🔎 Tài nguyên)':''));}
  /* ===== NHIỀU MÀN ===== */
  let MAPS=[],curMap=0;
  const syncCur=()=>{M.name=M.name||('Màn '+(curMap+1));MAPS[curMap]=clone(M);};
  function switchMap(i){if(i===curMap||!MAPS[i])return;syncCur();curMap=i;M=clone(MAPS[i]);undo=[];redo=[];selId=null;after();fit();draw();}
  function mkMap(w,h,name,cfg){const m=newMap(w,h);m.name=name;m.cfg=cfg;const sx=Math.floor(w/2),sy=Math.floor(h/2);m.ents.push({id:'s'+Date.now().toString(36),t:'start',x:sx,y:sy,name:'Xuất phát',tile:null});return m;}
  const mapName=i=>(i===curMap?M.name:(MAPS[i]&&MAPS[i].name))||('Màn '+(i+1));
  function mapsTab(){
    if(!MAPS.length)syncCur();
    body.append(el('div',{class:'lbl'},'🗺 CÁC MÀN CỦA GAME'),el('div',{class:'hint'},'Mỗi màn là một bản đồ riêng. Đặt 🚪 cửa trên màn này để đi sang màn khác. Nhân vật và hoạt ảnh lấy theo Màn 1.'));
    const lst=el('div',{class:'row'});MAPS.forEach((m,i)=>lst.append(btn((i+1)+'. '+mapName(i),()=>switchMap(i),i===curMap?'on':'')));body.append(lst);
    body.append(el('div',{class:'row'},
      btn('➕ Thêm màn mới (trống)',()=>{syncCur();const c=MAPS[0].cfg;MAPS.push(mkMap(M.w,M.h,'Màn '+(MAPS.length+1),{hp:c.hp,spd:c.spd,dmg:c.dmg,rng:c.rng,win:'auto'}));switchMap(MAPS.length-1);toast('Đã thêm màn '+MAPS.length);}),
      btn('⧉ Nhân bản màn này',()=>{syncCur();const m=clone(M);m.name=M.name+' (bản sao)';MAPS.push(m);switchMap(MAPS.length-1);}),
      btn('✏ Đổi tên',async()=>{const n=await askText('Tên màn này?',M.name);if(n){M.name=n.slice(0,30);syncCur();draw();}}),
      btn('🗑 Xoá màn này',async()=>{if(MAPS.length<2){toast('Phải còn ít nhất 1 màn');return;}if(!await yes('Xoá "'+M.name+'"? Cửa trỏ tới màn này sẽ bị bỏ.\nKhông hoàn tác được.'))return;const d=curMap;MAPS.splice(d,1);for(const m of MAPS)m.ents=(m.ents||[]).filter(e=>!(e.t==='door'&&e.to===d)).map(e=>(e.t==='door'&&e.to>d)?Object.assign(e,{to:e.to-1}):e);curMap=Math.min(d,MAPS.length-1);M=clone(MAPS[curMap]);undo=[];redo=[];selId=null;after();fit();draw();})));
    body.append(el('div',{class:'lbl',style:'margin-top:8px'},'ĐẶT LÊN BẢN ĐỒ (chạm ô để đặt, chạm lại để chọn/kéo)'),
      el('div',{class:'row'},['start','door','goal'].map(k=>btn(OT[k][0]+' '+OT[k][1],()=>{objType=k;tool='obj';draw();},(tool==='obj'&&objType===k)?'on':''))));
    {const vbox=el('div',{style:'border:1px solid #d9a066;border-radius:10px;padding:8px;margin-top:8px;background:#26201a'}),vl=el('div',{style:'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px'}),rc=el('div',{style:'display:flex;gap:4px;margin-top:6px'}),sv=el('select',{class:'num',style:'max-width:100%',onchange:async e=>{vl.textContent='Đang nạp…';try{const it=await ensureVat(e.target.value);vl.textContent='';window.__gvs=e.target.value;vl._it=it;vl._r();}catch(x){vl.textContent='Lỗi nạp: '+x.message;}}},el('option',{value:''},'— chọn bộ vật thể —'));
      vatIndex().then(L=>{sv.append(el('option',{value:'mine'},'📁 Của tôi (ảnh đã nạp, tự phân loại)'));for(const o of L){const op=el('option',{value:o.id},o.name+' ('+o.n+')');if(o.id===window.__gvs)op.selected=true;sv.append(op);}if(window.__gvs)sv.onchange({target:{value:window.__gvs}});});
      window.__vr=window.__vr||'obj';vl._r=()=>{vl.textContent='';const pn=window.__vr==='pn';(vl._it||[]).filter(q=>pn?q.role==='Phủ nền':(q.role!=='Mái/cửa'&&q.role!=='Phủ nền')).forEach(q=>vl.append(btn(q.name+(q.role==='Hạ tầng'?' ⛓':''),()=>{vatSel=q;objType='deco';tool='obj';draw();},(vatSel&&vatSel.name===q.name&&vatSel.tile.sid===q.tile.sid)?'on':'')));if(!vl.childNodes.length)vl.textContent=pn?'Bộ này chưa có phủ nền — tải ảnh họa tiết/hiệu ứng nền lên, app tự xếp vào đây.':'Bộ này không có vật thể.';};
      [['obj','🏛 Vật thể'],['pn','🍂 Phủ nền']].forEach(([k,n])=>rc.append(btn(n,()=>{window.__vr=k;[...rc.children].forEach((c,i)=>c.classList.toggle('on',(i===0)===(k==='obj')));vl._r();},window.__vr===k?'on':'')));
      vbox.append(el('div',{class:'lbl',style:'color:#e8c08a'},'🏛 VẬT THỂ / 🍂 PHỦ NỀN — chọn rồi chạm bản đồ để đặt (phủ nền nằm sát đất, không chặn)'),sv,rc,vl);body.append(vbox);}
    {const rb=el('div',{style:'border:1px solid #6aa8ff;border-radius:10px;padding:8px;margin-top:8px;background:#1b2430'});
      rb.append(el('div',{class:'lbl',style:'color:#9cc4ff'},'🖼 DỰNG TỪ ẢNH MẪU — app tự nhận dạng ảnh, chọn đúng tài nguyên và báo thiếu'),
        btn('Mở ảnh mẫu…',()=>openRefMap({el,btn,toast,yes,get sheets(){return sheets;},nenIndex,nenPack,vatIndex,ensureNen,ensureVat,enc,apply(R){pushUndo();M={name:M.name,w:R.w,h:R.h,layers:R.layers,blk:R.blk,ents:R.ents,cfg:Object.assign({},M.cfg,{view:'iso',zones:[]})};selId=null;after();fit();draw();}}),'on'));body.append(rb);}

    body.append(ruleBox());
    const doors=M.ents.filter(e=>e.t==='door');
    body.append(el('div',{class:'lbl',style:'margin-top:8px'},'🚪 CỬA TRÊN MÀN NÀY ('+doors.length+')'));
    if(!doors.length)body.append(el('div',{class:'hint'},'Chưa có cửa. Bấm "🚪 Cửa chuyển màn" rồi chạm bản đồ.'));
    for(const e of doors){
      const sel=el('select',{class:'num'},MAPS.map((m,i)=>el('option',{value:i},(i+1)+'. '+mapName(i))));sel.value=e.to;sel.onchange=()=>{e.to=+sel.value;after();};
      const num=(k)=>{const i=el('input',{type:'number',class:'num',style:'width:60px',placeholder:'tự động',value:e[k]==null?'':e[k]});i.oninput=()=>{e[k]=i.value===''?null:+i.value;after();};return i;};
      body.append(el('div',{style:'border:1px solid #ffa94d;border-radius:10px;padding:8px;margin:6px 0'+(e.id===selId?';background:#2a2418':'')},
        el('div',{class:'lbl'},'🚪 ô ('+e.x+','+e.y+')'),
        el('div',{class:'row'},el('span',{class:'lbl'},'Đi tới'),sel),
        el('div',{class:'row'},el('span',{class:'lbl'},'Đến ô x,y'),num('tx'),num('ty'),el('span',{class:'hint'},'để trống = điểm 🚩 xuất phát của màn đó')),
        el('div',{class:'row'},btn('📍 Chọn',()=>{selId=e.id;draw();}),btn('↩ Tạo cửa quay lại bên kia',()=>{const t=e.to;if(t===curMap)return;syncCur();const d=MAPS[t],id='d'+Date.now().toString(36);const bx=e.tx!=null?e.tx:null;d.ents.push({id,t:'door',x:Math.max(0,Math.min(d.w-1,(e.tx!=null?e.tx:Math.floor(d.w/2))+1)),y:(e.ty!=null?e.ty:Math.floor(d.h/2)),name:'Cửa',tile:null,to:curMap,tx:e.x,ty:e.y+1>=M.h?e.y:e.y+1});toast('Đã tạo cửa quay lại ở '+mapName(t)+' (có thể kéo đi chỗ khác)');}),
          btn('🗑',()=>{pushUndo();M.ents=M.ents.filter(q=>q.id!==e.id);selId=null;after();draw();}))));}
  }
  const gameData=()=>{syncCur();const G=MAPS[0].cfg||{};const mapsOut=MAPS.map((m,i)=>{const c=Object.assign({},m.cfg);if(i>0){c.anims=G.anims;c.heroAnim=G.heroAnim;c.hero=G.hero;}return {name:m.name||('Màn '+(i+1)),w:m.w,h:m.h,layers:m.layers.map(l=>l.slice()),blk:m.blk.slice(),ents:JSON.parse(JSON.stringify(m.ents)),cfg:c};});return Object.assign(gameData1(),{maps:mapsOut.length>1?mapsOut:undefined,gid:(lsGet('thk_gid',null)||(()=>{const g='g'+Date.now().toString(36);lsSet('thk_gid',g);return g;})())});};
  const gameData1=()=>({kind:'2d',w:M.w,h:M.h,layers:M.layers.map(l=>l.slice()),blk:M.blk.slice(),ents:JSON.parse(JSON.stringify(M.ents)),cfg:M.cfg,custom:sheets.slice(4).map(s=>({name:s.name,url:s.url,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null}))});
  return {fit,show(){dirty=true;setTimeout(fit,30);},gameData,sheets:()=>sheets,map:()=>M,hasClip:()=>!!clip};
}
