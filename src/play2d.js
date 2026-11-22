import {createLogic} from './logic.js';
import {el} from './util.js';
import {zonesHit,zRaster,zPath} from './zones.js';
import {makeAnims} from './anim.js';
const HERO=88,FOES=[108,109,120,121,122,111,110],TD=2;
export function play2D(o){
  const M=o.M,W=M.w,H=M.h,sheets=o.sheets;const CF=Object.assign({hp:5,spd:4.2,dmg:1,rng:1.35,hero:{sid:TD,idx:HERO},win:'auto'},M.cfg||{});const EN=M.ents||[],legacy=!EN.length;const VW=CF.view||'rpg',SIDE=VW==='side',ISO=VW==='iso',DCL=EN.filter(e=>e.t==='deco');
  const ov=el('div',{style:'position:fixed;inset:0;z-index:100;background:#10161d;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden'});
  const cv=document.createElement('canvas');cv.style.cssText='width:100%;height:100%;display:block';ov.append(cv);const cx=cv.getContext('2d');
  const msg=el('div',{style:'position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#000a;color:#fff;font:700 26px system-ui;text-align:center'});
  const atk=el('div',{style:'position:absolute;right:22px;bottom:calc(env(safe-area-inset-bottom) + 26px);width:84px;height:84px;border-radius:50%;background:#c0392bcc;border:3px solid #fff8;color:#fff;font-size:38px;display:flex;align-items:center;justify-content:center'},'⚔');
  ov.append(msg,atk);
  if(SIDE){const jb=el('div',{style:'position:absolute;right:122px;bottom:calc(env(safe-area-inset-bottom) + 26px);width:84px;height:84px;border-radius:50%;background:#2e86c1cc;border:3px solid #fff8;color:#fff;font-size:34px;display:flex;align-items:center;justify-content:center'},'⤒');jb.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();keys.k=1;});const jr=()=>{keys.k=0;};jb.addEventListener('pointerup',jr);jb.addEventListener('pointercancel',jr);ov.append(jb);}
  const setZ=v=>{zm=Math.max(.4,Math.min(3.5,v));};
  const zb=(l,d,top)=>el('div',{style:'position:absolute;right:10px;top:calc(env(safe-area-inset-top) + '+top+'px);width:40px;height:40px;border-radius:50%;background:#263342cc;color:#fff;font:700 24px/40px system-ui;text-align:center;cursor:pointer',onclick:e=>{e.stopPropagation();setZ(zm*d);}},l);
  ov.append(zb('＋',1.25,58),zb('－',.8,104));
  cv.addEventListener('wheel',e=>{e.preventDefault();setZ(zm*Math.exp(-e.deltaY*.0015));},{passive:false});
  let pd=0;cv.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pd=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);stick=null;}},{passive:true});
  cv.addEventListener('touchmove',e=>{if(e.touches.length===2&&pd){const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);setZ(zm*d/pd);pd=d;}},{passive:true});
  cv.addEventListener('touchend',()=>{pd=0;});
  if(o.onExit)ov.append(el('div',{style:'position:absolute;right:10px;top:calc(env(safe-area-inset-top) + 10px);padding:8px 14px;border-radius:16px;background:#263342cc;color:#fff;font:600 14px system-ui',onclick:()=>stop()},'✕ Thoát'));
  document.body.append(ov);if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  const AN=makeAnims(CF,sheets);
  const ZS=(M.cfg&&M.cfg.zones)||[],ZR=zRaster(ZS,W,H);
  const blocked=(x,y)=>x<0||y<0||x>=W||y>=H||!!M.blk[y*W+x]||!!ZR[y*W+x];
  let CQ=16;for(const sh of sheets)if(sh&&sh.img&&sh.tw>CQ)CQ=Math.min(48,sh.tw);
  while(W*H*CQ*CQ>2.2e7&&CQ>16)CQ-=8;
  function mk(top){const c=document.createElement('canvas');c.width=W*CQ;c.height=H*CQ;const g=c.getContext('2d');g.imageSmoothingEnabled=CQ>16;g.imageSmoothingQuality='high';const h2=CQ/2;
    const ls=top===2?[0,1]:(top?[3]:[0,1,2]);for(const l of ls){const a=M.layers[l];for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const n=v-1,f=n&7,t=n>>3,sid=t>>12,idx=t&4095,sh=sheets[sid];if(!sh||!sh.img)continue;if(top===2&&sh.iso)continue;
      const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin),dx=(i%W)*CQ,dy=Math.floor(i/W)*CQ;
      if(!f)g.drawImage(sh.img,sx,sy,sh.tw,sh.tw,dx,dy,CQ,CQ);else{g.save();g.translate(dx+h2,dy+h2);if(f&4){g.rotate(Math.PI/2);g.scale(1,-1);}if(f&1)g.scale(-1,1);if(f&2)g.scale(1,-1);g.drawImage(sh.img,sx,sy,sh.tw,sh.tw,-h2,-h2,CQ,CQ);g.restore();}}}return c;}
  const base=ISO?null:mk(false),top=ISO?null:mk(true),gnd=ISO?mk(2):null;
  const SL=[];if(ISO){for(const l of [0,1])for(let i=0;i<W*H;i++){const v=M.layers[l][i];if(!v)continue;const t=(v-1)>>3,sid=t>>12,sh=sheets[sid];if(sh&&sh.img&&sh.iso)SL.push({x:i%W,y:(i/W)|0,sid,idx:t&4095,l});}SL.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.l-b.l);}
  const GR=[];if(ISO){const oc=new Uint8Array(W*H),lab=new Uint8Array(W*H);for(let i=0;i<W*H;i++)oc[i]=(M.layers[2][i]||M.layers[3][i])?1:0;
    for(let i=0;i<W*H;i++){if(!oc[i]||lab[i])continue;const st=[i],cells=[];lab[i]=1;let x0=W,y0=H,x1=-1,y1=-1;
      while(st.length){const c=st.pop();cells.push(c);const x=c%W,y=(c/W)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=W||ny>=H)continue;const q=ny*W+nx;if(oc[q]&&!lab[q]){lab[q]=1;st.push(q);}}}
      const bw=x1-x0+1,bh=y1-y0+1,c=document.createElement('canvas');c.width=bw*CQ;c.height=bh*CQ;const g=c.getContext('2d');g.imageSmoothingEnabled=CQ>16;
      for(const l of [2,3])for(const ci of cells){const v=M.layers[l][ci];if(!v)continue;const n=v-1,t=n>>3,sid=t>>12,idx=t&4095,sh=sheets[sid];if(!sh||!sh.img)continue;const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin);g.drawImage(sh.img,sx,sy,sh.tw,sh.tw,((ci%W)-x0)*CQ,(((ci/W)|0)-y0)*CQ,CQ,CQ);}
      GR.push({c,xc:(x0+x1+1)/2,yb:y1+1});}}
  function tile(sid,idx,x,y,s,flip){const sh=sheets[sid];if(!sh||!sh.img)return;const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin);
    if(flip){cx.save();cx.translate(x+s,y);cx.scale(-1,1);cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,0,0,s,s);cx.restore();}else cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,x,y,s,s);}
  // ---- trạng thái ----
  let dead=0,DR=[],ENTRY=o.spawn||null,zm=1,L,HID=new Map(),P,E,NP,CH,GL,items,score=0,said=null,winMode='kill',over,t=0,raf,keys={},stick=null,atkCD=0,slash=0,fx=0,fy=1,last=0;
  const arrOf=k=>k==='E'?E:k==='NP'?NP:CH;
  const host={say:(t,s)=>{said={n:{x:P.x,y:P.y,name:'',text:t},t:s||3};},heal:n=>{P.hp=Math.min(CF.hp,P.hp+n);},hurt:n=>{P.hitT=.4;P.hp-=n;if(P.hp<=0)end(false);},win:()=>end(true),lose:()=>end(false),
    setHidden:(id,h)=>{if(h){for(const k of ['E','NP','CH']){const a=arrOf(k),i=a.findIndex(o=>o.id===id);if(i>=0){HID.set(id,{k,obj:a.splice(i,1)[0]});return;}}if(GL&&GL.id===id){HID.set(id,{k:'GL',obj:GL});GL=null;}}
      else{const m=HID.get(id);if(!m)return;HID.delete(id);if(m.k==='GL')GL=m.obj;else arrOf(m.k).push(m.obj);}}};
  const hidEn=()=>[...HID.values()].some(m=>m.k==='E');
  function add(k,obj,e){obj.id=e.id;if(e.hid)HID.set(e.id,{k,obj});else if(k==='GL')GL=obj;else arrOf(k).push(obj);}
  function start(){
    let best=null,bd=1e9;const st=EN.find(e=>e.t==='start');
    if(st)best=[st.x,st.y];else for(let i=0;i<W*H;i++){if(M.blk[i])continue;const x=i%W,y=Math.floor(i/W),d=(x-W/2)**2+(y-H/2)**2;if(d<bd){bd=d;best=[x,y];}}
    if(!best){best=[0,0];}
    const sp=ENTRY;P={x:sp?sp.x:best[0]+.5,y:sp?sp.y:best[1]+.5,hp:CF.hp,inv:0,face:1,atkT:0,hitT:0};score=0;said=null;
    if(sp&&sp.hp!=null&&!sp.used){P.hp=Math.max(1,Math.min(CF.hp,sp.hp));score=sp.score||0;sp.used=1;}
    DR=EN.filter(e=>e.t==='door').map(e=>({x:e.x+.5,y:e.y+.5,to:e.to,tx:e.tx,ty:e.ty,armed:Math.hypot(e.x+.5-P.x,e.y+.5-P.y)>.9}));
    items=[];over=0;msg.style.display='none';E=[];NP=[];CH=[];GL=null;HID=new Map();ov.querySelectorAll('.dlgbox').forEach(x=>x.remove());if(L&&L.hud)L.hud.remove();L=createLogic(CF,EN,host,ov);
    if(legacy){
      const seen=new Uint8Array(W*H),q=[best[1]*W+best[0]],reach=[];seen[q[0]]=1;
      for(let h=0;h<q.length;h++){const c=q[h],x=c%W,y=Math.floor(c/W);reach.push(c);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(blocked(nx,ny)||seen[ny*W+nx])continue;seen[ny*W+nx]=1;q.push(ny*W+nx);}}
      const far=reach.filter(c=>Math.hypot(c%W-best[0],Math.floor(c/W)-best[1])>=7);const pool=far.length>5?far:reach;
      const n=Math.max(4,Math.min(24,Math.round(reach.length/110)));
      for(let i=0;i<n;i++){const c=pool[Math.floor(Math.random()*pool.length)];E.push({x:c%W+.5,y:Math.floor(c/W)+.5,hp:2,mhp:2,dmg:1,spd:1.7,ch:6,ai:'wander',tl:{sid:TD,idx:FOES[Math.floor(Math.random()*FOES.length)]},dx:0,dy:0,wt:0,fl:0});}
    }else{
      for(const e of EN){const cx0=e.x+.5,cy0=e.y+.5;
        if(e.t==='enemy')add('E',{x:cx0,y:cy0,hp:e.hp||2,mhp:e.hp||2,dmg:e.dmg==null?1:e.dmg,spd:e.spd||1.7,ch:e.chase||6,ai:e.ai||'wander',tl:e.tile||{sid:TD,idx:108},dx:0,dy:0,wt:0,fl:0,name:e.name,anim:e.anim},e);
        else if(e.t==='npc')add('NP',{x:cx0,y:cy0,tl:e.tile||{sid:TD,idx:96},name:e.name,text:e.text,dlg:e.dlg,anim:e.anim},e);
        else if(e.t==='chest')add('CH',{x:cx0,y:cy0,tl:e.tile,gives:e.gives,amt:e.amt||1,open:0},e);
        else if(e.t==='goal')add('GL',{x:cx0,y:cy0,tl:e.tile},e);}
    }
    const hasGoal=EN.some(e=>e.t==='goal'),hasEn=EN.some(e=>e.t==='enemy');
    winMode=CF.win==='auto'?(hasGoal?(hasEn&&!legacy?'both':'goal'):'kill'):CF.win;
    if(winMode!=='kill'&&!hasGoal)winMode='kill';
    L.fire('start');}
  function free(x,y,r){return !(ZS.length&&zonesHit(ZS,x,y,r))&&!(blocked(Math.floor(x-r),Math.floor(y-r))||blocked(Math.floor(x+r),Math.floor(y-r))||blocked(Math.floor(x-r),Math.floor(y+r))||blocked(Math.floor(x+r),Math.floor(y+r)));}
  function move(e,dx,dy,r){if(!free(e.x,e.y,r)){e.x+=dx;e.y+=dy;return;}if(free(e.x+dx,e.y,r))e.x+=dx;if(free(e.x,e.y+dy,r))e.y+=dy;}
  function end(win){over=1;msg.textContent='';msg.append(el('div',{},win?'🏆 Chiến thắng!':'💀 Thất bại'),el('div',{style:'padding:12px 22px;border-radius:20px;background:#e0b050;color:#2a1a08;font-size:18px',onclick:start},'Chơi lại'));msg.style.display='flex';}
  function attack(){if(over||atkCD>0||L.dlgOpen)return;for(const n of NP){if(Math.hypot(n.x-P.x,n.y-P.y)<1.3){atkCD=.3;if(!L.talk(n))said={n,t:4};L.fire('talk',n.id);return;}}slash=.18;{const as=CF.heroAnim&&AN.get(CF.heroAnim);let K=0;if(as)for(let i=1;i<=6;i++){const kk=i>1?'atk'+i:'atk';if(as.st[kk]&&as.st[kk].src&&as.st[kk].src.length)K=i;else break;}
      P.cs=(K>1&&P.cs>0&&P.atkT>-.5)?(P.cs>=K?1:P.cs+1):1;P.atkN=(P.atkN||0)+1;const dur=as&&K?AN.clipSec(as,P.cs>1?'atk'+P.cs:'atk'):0;P.atkT=Math.max(.3,Math.min(1.2,dur||.45));atkCD=Math.max(.3,P.atkT*.8);}for(const e of E){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<CF.rng&&(d<.3||(dx*fx+dy*fy)/d>-.2)){e.hp-=CF.dmg;e.fl=.3;const k=d||1;move(e,dx/k*.6,dy/k*.6,.3);if(e.hp<=0&&Math.random()<.3)items.push({x:e.x,y:e.y});}}const dead=E.filter(e=>e.hp<=0);E=E.filter(e=>e.hp>0);for(const k of dead)L.fire('kill',k.id);if(dead.length&&!E.length&&!hidEn())L.fire('allkill');checkWin();}
  function checkWin(){if(over)return;if(winMode==='kill'&&!E.length&&!hidEn()&&(legacy||EN.some(e=>e.t==='enemy')))end(true);}
  function solidPush(o){for(const n of [...NP,...CH]){const dx=o.x-n.x,dy=o.y-n.y,d=Math.hypot(dx,dy),r=.6;if(d<r&&d>0){const nx=n.x+dx/d*r,ny=n.y+dy/d*r;if(free(nx,o.y,.28))o.x=nx;if(free(o.x,ny,.28))o.y=ny;}}}
  function upd(dt){
    t+=dt;atkCD-=dt;slash-=dt;P.inv-=dt;P.atkT-=dt;P.hitT-=dt;if(over||L.dlgOpen)return;
    let ix=0,iy=0;if(keys.ArrowLeft||keys.a)ix--;if(keys.ArrowRight||keys.d)ix++;if(keys.ArrowUp||keys.w)iy--;if(keys.ArrowDown||keys.s)iy++;
    if(stick){ix=stick.x;iy=stick.y;}
    if(SIDE){P.vy=Math.min(18,(P.vy||0)+30*dt);if((keys.ArrowUp||keys.w||keys.k||(stick&&stick.y<-.55))&&P.on){P.vy=-11.5;P.on=0;}
      const mx=(Math.abs(ix)>.15?Math.sign(ix)*Math.min(1,Math.abs(ix)):0)*CF.spd*dt;if(mx&&free(P.x+mx,P.y,.28))P.x+=mx;if(Math.abs(ix)>.2){P.face=ix>0?1:-1;fx=ix>0?1:-1;fy=0;}
      const ny=P.y+P.vy*dt;if(free(P.x,ny,.28)){P.y=ny;P.on=0;}else{if(P.vy>0)P.on=1;P.vy=0;}}
    else{const m=Math.hypot(ix,iy);if(m>.15){ix/=Math.max(m,1);iy/=Math.max(m,1);const sxv=ix;if(ISO){const a2=(ix+iy)/1.4142,b2=(iy-ix)/1.4142;ix=a2;iy=b2;}move(P,ix*CF.spd*dt,iy*CF.spd*dt,.28);solidPush(P);const n=Math.hypot(ix,iy);fx=ix/n;fy=iy/n;if(Math.abs(sxv)>.2)P.face=sxv>0?1:-1;}}
    for(const e of E){e.fl-=dt;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);
      if(e.ai==='chase'||(e.ai!=='still'&&d<e.ch)){move(e,dx/d*e.spd*dt,dy/d*e.spd*dt,.28);}else if(e.ai!=='still'){e.wt-=dt;if(e.wt<=0){e.wt=1+Math.random()*1.5;const a=Math.random()*6.28;e.dx=Math.cos(a)*(Math.random()<.4?0:1);e.dy=Math.sin(a)*(e.dx?1:0);}move(e,e.dx*.8*dt,e.dy*.8*dt,.28);}
      solidPush(e);if(d<.6&&P.inv<=0){P.hp-=e.dmg;P.inv=1;P.hitT=.4;const k=d||1;move(P,-dx/k*.7,-dy/k*.7,.28);if(P.hp<=0){end(false);return;}}}
    for(const c of CH)if(!c.open&&Math.hypot(c.x-P.x,c.y-P.y)<.7){c.open=1;L.fire('chest',c.id);if(c.gives==='hp')P.hp=Math.min(CF.hp,P.hp+c.amt);else score+=c.amt;said={n:{x:c.x,y:c.y,name:'Rương',text:c.gives==='hp'?'+'+c.amt+' máu':'+'+c.amt+' điểm'},t:1.5};}
    for(const d of DR){const dd=Math.hypot(d.x-P.x,d.y-P.y);if(dd>=.9)d.armed=true;else if(d.armed&&dd<.6&&o.onDoor){d.armed=false;o.onDoor({to:d.to,tx:d.tx,ty:d.ty,hp:P.hp,score});return;}}
    if(o.onTick&&(t-(P.lastSave||-9))>1.5){P.lastSave=t;o.onTick({x:P.x,y:P.y,hp:P.hp,score});}
    if(said){said.t-=dt;if(said.t<=0)said=null;}
    if(GL&&Math.hypot(GL.x-P.x,GL.y-P.y)>=.6)GL.hit=0;
    if(GL&&Math.hypot(GL.x-P.x,GL.y-P.y)<.6){if(!GL.hit){GL.hit=1;L.fire('goal');if(over||!GL)return;}if(winMode==='goal'||(winMode==='both'&&!E.length&&!hidEn()))end(true);else if(winMode==='both'){said={n:{x:GL.x,y:GL.y,name:'Đích',text:'Còn quái chưa diệt!'},t:1.2};}}
    for(let i=items.length-1;i>=0;i--)if(Math.hypot(items[i].x-P.x,items[i].y-P.y)<.6){items.splice(i,1);P.hp=Math.min(CF.hp,P.hp+1);}
  }
  function draw(){
    const w=cv.clientWidth,h=cv.clientHeight,dp=Math.min(devicePixelRatio||1,2);if(cv.width!==Math.round(w*dp)||cv.height!==Math.round(h*dp)){cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);}
    cx.setTransform(dp,0,0,dp,0,0);cx.imageSmoothingEnabled=CQ>16;cx.fillStyle='#10161d';cx.fillRect(0,0,w,h);
    const k=Math.max(2,Math.round(Math.min(w,h)/160)),s=16*k*zm;let ox=w/2-P.x*s,oy=h/2-P.y*s;
    if(W*s<=w)ox=(w-W*s)/2;else ox=Math.min(0,Math.max(w-W*s,ox));if(H*s<=h)oy=(h-H*s)/2;else oy=Math.min(0,Math.max(h-H*s,oy));
    let pX=()=>0,pY=()=>0;
    if(ISO){const hw=s*.75,hh=s*.375,ox0=w/2-(P.x-P.y)*hw,oy0=h/2-(P.x+P.y)*hh;pX=(x,y)=>ox0+(x-y)*hw;pY=(x,y)=>oy0+(x+y)*hh;cx.fillStyle='#1b2a1f';cx.fillRect(0,0,w,h);
      cx.save();cx.transform(hw/CQ,hh/CQ,-hw/CQ,hh/CQ,ox0,oy0);cx.drawImage(gnd,0,0);cx.restore();
      for(const q of SL){const X=pX(q.x,q.y)-hw,Y=pY(q.x,q.y);if(X>w||X<-2*hw||Y>h||Y<-2*hw)continue;const sh=sheets[q.sid],sx=(q.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(q.idx/sh.cols)*(sh.tw+sh.margin);cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,X,Y,2*hw+.6,2*hw+.6);}}
    else{if(SIDE){const gr=cx.createLinearGradient(0,oy,0,oy+H*s);gr.addColorStop(0,'#5fa8dd');gr.addColorStop(1,'#d6edf8');cx.fillStyle=gr;cx.fillRect(ox,oy,W*s,H*s);}cx.drawImage(base,ox,oy,W*s,H*s);}
    cx.font=(s*.6)+'px serif';cx.textAlign='center';for(const it of items)cx.fillText('❤️',ISO?pX(it.x,it.y):ox+it.x*s,(ISO?pY(it.x,it.y):oy+it.y*s)+s*.2);
    const ents=[{y:P.y,x:P.x,p:1},...E.map(e=>({y:e.y,x:e.x,e})),...NP.map(n=>({y:n.y,x:n.x,n})),...CH.map(c=>({y:c.y,x:c.x,c})),...(GL?[{y:GL.y,x:GL.x,g:GL}]:[]),...(ISO?GR.map(g=>({y:g.yb,x:g.xc,grp:g})):[]),...DCL.map(d=>({y:d.flat?d.y-(d.f||1)+1:d.y,x:d.flat?d.x-(d.f||1)+1:d.x+1,dc:d}))].sort(ISO?((a,b)=>(a.x+a.y)-(b.x+b.y)):((a,b)=>a.y-b.y));
    const ox1=ox,oy1=oy;
    for(const n of ents){if(n.dc){const d=n.dc,ws=(d.sc||3)*s,sh=d.tile&&sheets[d.tile.sid];const X=ISO?pX(d.x+1,d.y+1):ox1+(d.x+.5)*s,Y=ISO?pY(d.x+1,d.y+1):oy1+(d.y+1)*s;if(sh&&sh.img){const sx=(d.tile.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(d.tile.idx/sh.cols)*(sh.tw+sh.margin);cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,X-ws/2+(d.ox||0)*ws,Y-ws+(d.oy||0)*ws,ws,ws);}continue;}if(n.grp){const g=n.grp,k2=s*.95/CQ,wp=g.c.width*k2,hp=g.c.height*k2;cx.drawImage(g.c,pX(g.xc,g.yb)-wp/2,pY(g.xc,g.yb)-hp,wp,hp);continue;}if(ISO){const q=n.p?P:(n.e||n.n||n.c||n.g);ox=pX(q.x,q.y)-q.x*s;oy=pY(q.x,q.y)-q.y*s;}if(n.c){const c=n.c;if(c.tl)tile(c.tl.sid,c.tl.idx,ox+(c.x-.5)*s,oy+(c.y-.5)*s,s,0);else{cx.font=(s*.7)+'px serif';cx.textAlign='center';cx.fillText(c.open?'✨':'🎁',ox+c.x*s,oy+(c.y+.25)*s);}continue;}if(n.g){const g=n.g;if(g.tl)tile(g.tl.sid,g.tl.idx,ox+(g.x-.5)*s,oy+(g.y-.5)*s,s,0);else{cx.font=(s*.8)+'px serif';cx.textAlign='center';cx.fillText('🏁',ox+g.x*s,oy+(g.y+.3)*s);}continue;}if(n.n){const q=n.n;cx.fillStyle='#0005';cx.beginPath();cx.ellipse(ox+q.x*s,oy+(q.y+.32)*s,s*.3,s*.12,0,0,6.3);cx.fill();if(!(q.anim&&AN.drawChar(cx,q,q.anim,ox+q.x*s,oy+q.y*s,s,t,{iso:ISO})))fbk(q,ox+(q.x-.5)*s,oy+(q.y-.7)*s,s,0);continue;}const q=n.p?P:n.e;cx.fillStyle='#0005';cx.beginPath();cx.ellipse(ox+q.x*s,oy+(q.y+.32)*s,s*.3,s*.12,0,0,6.3);cx.fill();
      if(n.p){if(P.inv>0&&Math.floor(t*14)%2)continue;if(!(CF.heroAnim&&AN.drawChar(cx,P,CF.heroAnim,ox+P.x*s,oy+P.y*s,s,t,{iso:ISO,atk:P.atkT>0?(P.cs||1):0,aid:P.atkN,chain:P.cs>1,hit:P.hitT>0}))){const hs=sheets[CF.hero.sid];if(hs&&/đã gỡ/.test(hs.name)){cx.fillStyle='#e0b050';cx.beginPath();cx.arc(ox+P.x*s,oy+(P.y-.3)*s,s*.3,0,6.3);cx.fill();}else tile(CF.hero.sid,CF.hero.idx,ox+(P.x-.5)*s,oy+(P.y-.7)*s,s,P.face<0);}}
      else{const e=n.e;cx.globalAlpha=e.fl>0?.5:1;if(!(e.anim&&AN.drawChar(cx,e,e.anim,ox+e.x*s,oy+e.y*s,s,t,{iso:ISO,hit:e.fl>0,atk:Math.hypot(P.x-e.x,P.y-e.y)<.8})))fbk(e,ox+(e.x-.5)*s,oy+(e.y-.7)*s,s,e.x<P.x);cx.globalAlpha=1;cx.fillStyle='#000a';cx.fillRect(ox+(e.x-.35)*s,oy+(e.y-.8)*s,s*.7,3);cx.fillStyle='#e74c3c';cx.fillRect(ox+(e.x-.35)*s,oy+(e.y-.8)*s,s*.7*Math.max(0,e.hp)/e.mhp,3);}}
    ox=ox1;oy=oy1;for(const d of DR){if(ISO){ox=pX(d.x,d.y)-d.x*s;oy=pY(d.x,d.y)-d.y*s;}cx.font=(s*.8)+'px serif';cx.textAlign='center';cx.fillText('🚪',ox+d.x*s,oy+(d.y+.3)*s);}
    if(!ISO)cx.drawImage(top,ox,oy,W*s,H*s);
    if(window.__dbg)window.__P=P;
    if(window.__dbg&&ZS.length){cx.save();cx.fillStyle='#00aaff55';cx.strokeStyle='#00ccff';const T=ISO?((x,y)=>[pX(x,y),pY(x,y)]):((x,y)=>[ox1+x*s,oy1+y*s]);for(const q of ZS){if(q.k==='line'){cx.lineWidth=(q.th||.6)*s;cx.lineJoin='round';zPath(cx,q,T);cx.stroke();}else{zPath(cx,q,T);cx.fill();cx.stroke();}}cx.restore();}
    if(ISO&&window.__dbg){cx.fillStyle='#ff000055';for(let i=0;i<W*H;i++)if(M.blk[i]){const x=i%W,y=(i/W)|0,hw=s*.75,hh=s*.375,X=pX(x,y),Y=pY(x,y);cx.beginPath();cx.moveTo(X,Y);cx.lineTo(X+hw,Y+hh);cx.lineTo(X,Y+2*hh);cx.lineTo(X-hw,Y+hh);cx.closePath();cx.fill();}}
    if(ISO){ox=pX(P.x,P.y)-P.x*s;oy=pY(P.x,P.y)-P.y*s;}
    if(slash>0){cx.strokeStyle='#fff';cx.lineWidth=4;cx.globalAlpha=slash/.18;const a=ISO?Math.atan2((fx+fy)*.5,fx-fy):Math.atan2(fy,fx);cx.beginPath();cx.arc(ox+P.x*s,oy+(P.y-.2)*s,s*1.05,a-1,a+1);cx.stroke();cx.globalAlpha=1;}
    if(ISO&&said){const q=said.n;ox=pX(q.x,q.y)-q.x*s;oy=pY(q.x,q.y)-q.y*s;}
    if(said){const q=said.n,tx=(q.name?q.name+': ':'')+q.text;cx.font='bold '+Math.max(13,s*.38)+'px system-ui';const wd=Math.min(w-20,cx.measureText(tx).width+24);const bx=Math.max(10,Math.min(w-wd-10,ox+q.x*s-wd/2)),by=oy+(q.y-1.35)*s;cx.fillStyle='#fffffff0';cx.fillRect(bx,by-22,wd,34);cx.fillStyle='#222';cx.textAlign='left';cx.fillText(tx,bx+12,by);}
    cx.font='bold '+(s*.5)+'px system-ui';cx.textAlign='left';cx.fillStyle='#fff';cx.fillText(CF.hp>10?'❤️×'+Math.max(0,P.hp):'❤️'.repeat(Math.max(0,P.hp)),12,calcTop()+22);cx.textAlign='center';cx.fillText('👾 '+E.length+(score?'  ⭐'+score:''),w/2,calcTop()+22);
    if(stick){cx.strokeStyle='#fff6';cx.lineWidth=3;cx.beginPath();cx.arc(stick.ox,stick.oy,44,0,6.3);cx.stroke();cx.fillStyle='#fff5';cx.beginPath();cx.arc(stick.ox+stick.x*34,stick.oy+stick.y*34,22,0,6.3);cx.fill();}
  }
  const calcTop=()=>10;
  function fbk(q,x,y,s,flip){if(q.anim){cx.fillStyle='#e0b050';cx.beginPath();cx.arc(x+s/2,y+s*.3,s*.28,0,6.3);cx.fill();cx.fillStyle='#222';cx.font='bold '+(s*.35)+'px system-ui';cx.textAlign='center';cx.fillText((q.name||'?')[0],x+s/2,y+s*.42);}else tile(q.tl.sid,q.tl.idx,x,y,s,flip);}
  function loop(ts){if(dead)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;upd(dt);if(dead)return;draw();raf=requestAnimationFrame(loop);}
  // ---- điều khiển ----
  const kd=e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=1;if(k==='+'||k==='='){setZ(zm*1.25);}if(k==='-'||k==='_'){setZ(zm*.8);}if(k===' '||k==='j'){attack();e.preventDefault();}if(k.startsWith('Arrow'))e.preventDefault();},ku=e=>{keys[e.key.length===1?e.key.toLowerCase():e.key]=0;};
  addEventListener('keydown',kd);addEventListener('keyup',ku);
  atk.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();attack();});
  cv.addEventListener('pointerdown',e=>{if(stick||e.clientX>innerWidth*.62)return;cv.setPointerCapture(e.pointerId);stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0};});
  cv.addEventListener('pointermove',e=>{if(!stick||e.pointerId!==stick.id)return;let dx=e.clientX-stick.ox,dy=e.clientY-stick.oy;const d=Math.hypot(dx,dy),mx=44;if(d>mx){dx*=mx/d;dy*=mx/d;}stick.x=dx/mx;stick.y=dy/mx;});
  const up=e=>{if(stick&&e.pointerId===stick.id)stick=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  function stop(silent){dead=1;cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);ov.remove();if(!silent&&o.onExit)o.onExit();}
  start();raf=requestAnimationFrame(loop);return {stop};
}

/* Nhiều màn: nối các bản đồ bằng cửa, lưu tiến độ trong trình duyệt */
export function playGame(o){const D=o.M;if(!D.maps||D.maps.length<2)return play2D(o);
  const key='thk_save_'+(D.gid||'g'),maps=D.maps;let cur=null,idx=0,stopped=false;
  const startOf=m=>{const st=(m.ents||[]).find(e=>e.t==='start');return st?{x:st.x+.5,y:st.y+.5}:{x:m.w/2,y:m.h/2};};
  const run=(i,sp)=>{idx=i;const m=Object.assign({},maps[i]);
    cur=play2D({M:m,sheets:o.sheets,spawn:sp,onExit:()=>{stopped=true;o.onExit&&o.onExit();},
      onTick:q=>{try{localStorage.setItem(key,JSON.stringify({i,x:q.x,y:q.y,hp:q.hp,score:q.score}));}catch(e){}},
      onDoor:d=>{const ti=maps[d.to]?d.to:0,tm=maps[ti],dp=(d.tx!=null&&d.ty!=null)?{x:d.tx+.5,y:d.ty+.5}:startOf(tm);
        try{localStorage.setItem(key,JSON.stringify({i:ti,x:dp.x,y:dp.y,hp:d.hp,score:d.score}));}catch(e){}
        const c=cur;setTimeout(()=>{c.stop(true);if(!stopped)run(ti,{x:dp.x,y:dp.y,hp:d.hp,score:d.score});},0);}});};
  let sv=null;try{sv=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
  if(sv&&maps[sv.i]){
    const ov=el('div',{style:'position:fixed;inset:0;z-index:300;background:#10161d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font:700 22px system-ui'});
    const b=(t,f,c)=>el('div',{style:'padding:12px 26px;border-radius:20px;color:#2a1a08;font-size:18px;background:'+c,onclick:()=>{ov.remove();f();}},t);
    ov.append(el('div',{},'Có tiến độ đã lưu'),el('div',{style:'font-size:15px;font-weight:400;opacity:.8'},(maps[sv.i].name||'Màn '+(sv.i+1))+' · ❤️'+sv.hp+(sv.score?' · ⭐'+sv.score:'')),
      b('▶ Tiếp tục',()=>run(sv.i,{x:sv.x,y:sv.y,hp:sv.hp,score:sv.score}),'#e0b050'),
      b('↺ Chơi mới',()=>{try{localStorage.removeItem(key);}catch(e){}run(0,null);},'#cfd8e3'));
    document.body.append(ov);
  }else run(0,null);
  return {stop(){stopped=true;cur&&cur.stop();}};}
