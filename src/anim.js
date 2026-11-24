import {spriteBottom} from './spriteFoot.js';
import {el,toast,packBytes,expandPacks} from './util.js';
import {unzipSync} from 'fflate';
/* Hoạt ảnh nhân vật 2D: bộ hoạt ảnh = các trạng thái (đứng/chạy/đánh/trúng đòn), mỗi trạng thái là 1 dải ảnh nhiều khung.
   Hướng: 1 ảnh nhiều hàng (mỗi hàng 1 hướng) HOẶC mỗi hướng 1 ảnh (tên có số, vd CHAR_0_Run … CHAR_7_Run). */
export const STATES=[['idle','Đứng yên'],['run','Chạy'],['atk','Đánh'],['hit','Trúng đòn']];
const LOOP={idle:1,run:1,atk:0,hit:0,pickup:0};
const ORD=[['cw','Vòng thuận: Nam→Tây→Bắc→Đông'],['ccw','Vòng ngược: Nam→Đông→Bắc→Tây'],['rpg4','4 hướng kiểu RPG: Nam,Tây,Đông,Bắc']];

/* tên trùng (vd 8 hướng cùng tên) → đánh số theo thứ tự: tên, tên#2, tên#3… */
export {findGrid};
export function uniqNames(sheets){const seen=new Map();for(const s of sheets.slice(4)){const base=s.name.replace(/#\d+$/,'');const k=(seen.get(base)||0)+1;seen.set(base,k);const nn=k===1?base:base+'#'+k;if(s.name!==nn)s.name=nn;}}
export function makeAnims(cfg,sheets){uniqNames(sheets);
  const byName=n=>sheets.find(s=>s.name===n&&s.img);
  const get=id=>(cfg.anims||[]).find(a=>a.id===id);
  function strip(set,stn,d){const st=set.st&&set.st[stn];if(!st||!st.src||!st.src.length)return null;
    const fwO=st.fw>0&&st.fh>0;let sh,row=0,rowH;
    if(st.src.length>1){sh=byName(st.src[Math.min(d,st.src.length-1)]);if(!sh)return null;rowH=fwO?st.fh:sh.img.height;}
    else{sh=byName(st.src[0]);if(!sh)return null;const dirs=Math.max(1,st.dirs||1);rowH=fwO?st.fh:Math.floor(sh.img.height/dirs);row=Math.min(d,dirs-1);}
    const I=sh.img;const n=st.n>0?st.n:Math.max(1,fwO?Math.floor(I.width/st.fw):Math.round(I.width/rowH));
    const fw=fwO?st.fw:Math.floor(I.width/n);return {I,n,fw,fh:rowH,sy:row*rowH,fps:st.fps||8,rows:st.src.length>1?1:Math.max(1,st.dirs||1),ax:st.ax!=null?st.ax:fw/2,ay:st.ay!=null?st.ay:rowH,dur:st.dur&&st.dur.length===n?st.dur:null};}
  const dirsOf=st=>!st||!st.src||!st.src.length?1:st.src.length>1?st.src.length:Math.max(1,st.dirs||1);
  function dirIdx(set,dirs,fx,fy,face){
    if(dirs<=1)return 0;if(dirs===2)return face<0?1:0;
    const th=Math.atan2(-fx,fy);let c=Math.round(th/(2*Math.PI/dirs));c=((c%dirs)+dirs)%dirs;
    if(set.map&&dirs===8&&set.map.length===8)return set.map[c];
    let sl=c;if(set.ord==='ccw')sl=(dirs-c)%dirs;else if(set.ord==='rpg4'&&dirs===4)sl=[0,1,3,2][c];
    return (sl+(set.off||0))%dirs;}
  function pickState(set,want){const ok=n=>!!(set.st&&set.st[n]&&set.st[n].src&&set.st[n].src.length);
    if(ok(want))return want;if(/^atk\d+$/.test(want)&&ok('atk'))return 'atk';if(want==='run'||/^atk/.test(want)||want==='hit')return ok('idle')?'idle':ok('run')?'run':null;return ok('run')?'run':null;}
  /* vẽ khung hình hiện tại. sx,sy = tâm ô trên màn hình, s = cỡ 1 ô. Trả về false nếu không có hoạt ảnh. */
  function clipSec(set,stn){const sp=strip(set,stn,0);if(!sp)return 0;return sp.dur?sp.dur.reduce((p,q)=>p+q,0)/1000:sp.n/sp.fps;}
  function frame(cx,set,stn,d,tt,sx,sy,s,flipL,grounded=false){
    const sp=strip(set,stn,d);if(!sp)return false;
    const base=stn.replace(/\d+$/,'');let f;
    if(sp.dur){const tot=sp.dur.reduce((p,q)=>p+q,0)/1000;let T=LOOP[base]?tt%tot:Math.min(tt,tot-.001);let acc=0;f=sp.n-1;for(let i=0;i<sp.n;i++){acc+=sp.dur[i]/1000;if(T<acc){f=i;break;}}}
    else{f=Math.floor(tt*sp.fps);f=LOOP[base]?f%sp.n:Math.min(sp.n-1,f);}
    const k=s/16*(set.sc||1),dw=sp.fw*k,dh=sp.fh*k;
    const dy=(set.oy||0)*s/16;
    const foot=grounded?spriteBottom(sp.I,f*sp.fw,sp.sy,sp.fw,sp.fh):sp.ay;
    const y=grounded?sy-Math.max(foot*k,sp.ay*k-dy):sy+s*.32-sp.ay*k+dy;
    const sm=cx.imageSmoothingEnabled;cx.imageSmoothingEnabled=sp.fh>=96;if(cx.imageSmoothingEnabled)cx.imageSmoothingQuality='high';
    if(flipL){cx.save();cx.translate(sx,0);cx.scale(-1,1);cx.drawImage(sp.I,f*sp.fw,sp.sy,sp.fw,sp.fh,-sp.ax*k,y,dw,dh);cx.restore();}
    else cx.drawImage(sp.I,f*sp.fw,sp.sy,sp.fw,sp.fh,sx-sp.ax*k,y,dw,dh);
    cx.imageSmoothingEnabled=sm;return true;}
  function drawChar(cx,q,id,sx,sy,s,t,hint){
    const set=get(id);if(!set)return false;
    if(q.lx!==undefined){let dx=q.x-q.lx,dy=q.y-q.ly;if(hint&&hint.iso&&!hint.ang){const a=dx-dy,b=(dx+dy)*.5;dx=a;dy=b;}if(Math.abs(dx)+Math.abs(dy)>.0004){q.mvt=t;const m=Math.hypot(dx,dy);q.afx=dx/m;q.afy=dy/m;if(Math.abs(dx)>.0002)q.aface=dx>0?1:-1;}}q.lx=q.x;q.ly=q.y;
    const want=hint&&hint.pk&&set.st&&set.st.pickup?'pickup':hint&&hint.hit?'hit':hint&&hint.atk?('atk'+(hint.atk>1?hint.atk:'')):(t-(q.mvt===undefined?-9:q.mvt)<.12?'run':'idle');
    const stn=pickState(set,want);if(!stn)return false;
    if(q.ast!==stn||(hint&&hint.atk&&hint.aid!==undefined&&q.aid!==hint.aid)){q.ast=stn;q.ast0=t;}if(hint&&hint.aid!==undefined)q.aid=hint.aid;
    const dirs=dirsOf(set.st[stn]);const d=dirIdx(set,dirs,q.afx||0,q.afy===undefined?1:q.afy,q.aface||1);
    const fl=dirs===1&&((q.aface||1)<0)!==!!set.fl;
    let tt=want==='idle'&&stn!=='idle'?0:t-q.ast0;const sk=set.st[stn];if(sk&&sk.skip1&&hint&&hint.chain){const sp0=strip(set,stn,d);if(sp0)tt+=sp0.dur?sp0.dur[0]/1000:1/sp0.fps;}
    return frame(cx,set,stn,d,tt,sx,sy,s,fl,hint?.grounded);}
  return {get,strip,frame,drawChar,dirsOf,dirIdx,clipSec,pickState};
}

/* ---------- tự gom ảnh thành bộ ---------- */
const KW=[[/^(run|walk|move)$/i,'run'],[/^(idle|stand|wait)$/i,'idle'],[/^(slash|attack|atk|hit1|strike)$/i,'atk'],[/^(hit|hurt|damage|dmg)$/i,'hit']];
const SKIP=/^(guard|block|die|death|dead|jump|cast|spell|bow|shoot)$/i;
function parseName(n){let dup=null;const m0=/#(\d+)$/.exec(n);if(m0){dup=+m0[1]-1;n=n.slice(0,m0.index);}
  let m=/^(.*?)[_-](\d)[_-]([A-Za-z]+)$/.exec(n);if(m)return {ch:m[1],st:m[3],d:dup==null?+m[2]:+m[2]*100+dup};
  m=/^(.*?)[_-]([A-Za-z]+)(?:[_-][A-Z]{1,2})?$/.exec(n);if(m&&(SKIP.test(m[2])||KW.some(k=>k[0].test(m[2]))))return {ch:m[1],st:m[2],d:dup};
  return {ch:n,st:'idle',d:dup};}
const stOf=w=>{for(const [r,k] of KW)if(r.test(w))return k;return null;};
function guessN(img){const sq=Math.max(1,Math.round(img.width/img.height));let d=null;try{d=findGrid(img);}catch(e){}return d&&!d.opaque?d.C:sq;}
function guessDirs(img){const w=img.width,h=img.height;if(w%h===0&&w/h>=2)return {dirs:1,n:w/h};
  for(const d of [4,8]){const rh=h/d;if(Number.isInteger(rh)&&rh>=24&&w%rh===0&&w/rh>=2)return {dirs:d,n:w/rh};}return {dirs:1,n:Math.max(1,Math.round(w/h))};}
export function autoGroups(custom){
  const G=new Map();
  for(const s of custom){if(!s.img)continue;const p=parseName(s.name);const k=stOf(p.st);const g=G.get(p.ch)||{name:p.ch,st:{},skip:[]};G.set(p.ch,g);
    if(!k){g.skip.push(s.name);continue;}const e=g.st[k]||(g.st[k]={files:[],s:s});e.files.push([p.d==null?0:p.d,s]);}
  const out=[];
  for(const g of G.values()){const st={};
    for(const [k,e] of Object.entries(g.st)){e.files.sort((a,b)=>a[0]-b[0]);const fps=k==='idle'?6:10;
      if(e.files.length>1){const gs=e.files.slice(0,8).map(x=>{try{return findGrid(x[1].img);}catch(er){return {C:1,R:1,opaque:true};}});
        const ok=gs.filter(x=>!x.opaque);const f=e.files[0][1].img;
        st[k]={src:e.files.map(x=>x[1].name),dirs:e.files.length,n:ok.length?consensus(ok.map(x=>x.C)):guessN(f),fps};}
      else{const im=e.files[0][1].img;let gd=null;try{gd=findGrid(im);}catch(er){}
        if(gd&&!gd.opaque)st[k]={src:[e.files[0][1].name],dirs:gd.R,n:gd.C,fps};
        else{const q=guessDirs(im);st[k]={src:[e.files[0][1].name],dirs:q.dirs,n:q.n,fps};}}}
    if(Object.keys(st).length)out.push({name:g.name,st,skip:g.skip});}
  return out;}
function bulkUI(cfg,sheets,done,AN){
  uniqNames(sheets);
  const groups=autoGroups(sheets.slice(4));
  const ov=el('div',{style:'position:fixed;inset:0;z-index:150;background:#0d141bf2;display:flex;flex-direction:column;padding:10px;gap:8px;color:#fff;font:14px system-ui'});
  const q=el('input',{placeholder:'Lọc tên nhân vật… ('+groups.length+' bộ tìm thấy)',style:'padding:10px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px'});
  const box=el('div',{style:'flex:1;overflow:auto;background:#16202b;border-radius:8px;padding:4px'});const picked=new Set(groups.map(g=>g.name));
  const names={idle:'Đứng',run:'Chạy',atk:'Đánh',hit:'Trúng'};
  const desc=g=>Object.entries(g.st).map(([k,s])=>names[k]+' '+(s.src.length>1?s.src.length+' hướng':(s.dirs>1?s.dirs+' hướng':'1 hướng'))+' ×'+s.n+' khung').join(' · ')+(g.skip.length?'  (bỏ qua: '+g.skip.length+' ảnh không nhận ra)':'');
  const cnt=el('span',{class:'lbl'},'');
  const vis=()=>groups.filter(g=>!q.value||g.name.toLowerCase().includes(q.value.toLowerCase()));
  function render(){box.textContent='';for(const g of vis()){const cb=el('input',{type:'checkbox',style:'width:22px;height:22px;flex:none'});cb.checked=picked.has(g.name);cb.onclick=()=>{cb.checked?picked.add(g.name):picked.delete(g.name);upd();};
    box.append(el('div',{style:'display:flex;gap:8px;align-items:flex-start;padding:8px 6px;border-bottom:1px solid #243342'},cb,el('div',{},el('b',{},g.name),el('div',{class:'hint',style:'margin:0'},desc(g)))));}upd();}
  const upd=()=>{cnt.textContent='Đã chọn '+picked.size+'/'+groups.length+' bộ';};
  q.oninput=render;
  const mkb=(l,f,c)=>el('button',{class:'btn',style:'padding:10px 14px;'+(c||''),onclick:f},l);
  ov.append(el('div',{style:'font-weight:700'},groups.length?'Tìm thấy '+groups.length+' nhân vật trong các ảnh đã tải. Chọn rồi bấm Tạo.':'Chưa có ảnh nào đã tải. Vào tab 💾 Tệp → 📂 TẢI TỆP LÊN trước.'),q,
    el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center'},mkb('☑ Chọn tất cả',()=>{vis().forEach(g=>picked.add(g.name));render();}),mkb('☐ Bỏ chọn',()=>{picked.clear();render();}),cnt),box,
    el('div',{style:'display:flex;gap:8px'},mkb('✔ Tạo các bộ đã chọn',()=>{cfg.anims=cfg.anims||[];let n=0,lastId=null;for(const g of groups){if(!picked.has(g.name))continue;
      const ex=cfg.anims.find(a=>a.name===g.name);const first=Object.values(g.st)[0],sh=sheets.find(s=>s.name===first.src[0]);const h=sh&&sh.img?sh.img.height/(first.src.length>1?1:Math.max(1,first.dirs)):32;
      const o={id:Date.now().toString(36)+n,name:g.name,sc:Math.round(Math.min(3,24/Math.max(8,h))*100)/100,scSet:1,oy:0,ord:'cw',off:0,fl:0,st:g.st};
      if(ex){Object.assign(ex,{st:g.st});if(!lastId)lastId=ex.id;}else{cfg.anims.push(o);if(!lastId)lastId=o.id;}n++;}
      if(lastId){AN.sel=lastId;if(!cfg.heroAnim)cfg.heroAnim=lastId;}
      ov.remove();toast('Đã tạo '+n+' bộ hoạt ảnh');done();},'background:#2e8b57;color:#fff'),mkb('Đóng',()=>ov.remove())));
  document.body.append(ov);render();}

/* ---------- sửa khung: chỉnh số cột (khung) × số hàng (hướng) với lưới xem trực tiếp ---------- */
function bands(arr,gap){const out=[];let s=-1,last=-1;for(let i=0;i<arr.length;i++){if(arr[i]>0){if(s<0)s=i;last=i;}else if(s>=0&&i-last>gap){out.push([s,last]);s=-1;}}if(s>=0)out.push([s,last]);return out;}
/* Tự nhận lưới khung: thử mọi cách chia (số cột C, số hàng R), chọn cách LỚN NHẤT mà mọi đường cắt rơi vào chỗ trong suốt.
   Chia đúng → đường cắt nằm giữa các nhân vật (trống). Chia sai (cắt đôi người) → đường cắt đâm xuyên người → bị loại. */
function findGrid(img){
  const sf=Math.min(1,2048/Math.max(img.width,img.height));const w=Math.max(1,Math.round(img.width*sf)),h=Math.max(1,Math.round(img.height*sf));
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);const d=g.getImageData(0,0,w,h).data;
  const col=new Float64Array(w),row=new Float64Array(h);let transp=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const al=d[(y*w+x)*4+3];if(al>100){col[x]++;row[y]++;}if(al<=16)transp++;}
  if(transp<w*h*.02)return {C:1,R:1,opaque:true};
  const clearAt=(arr,pos,win,tol)=>{let s=0,n=0;for(let k=-win;k<=win;k++){const i=Math.min(arr.length-1,Math.max(0,pos+k));s+=arr[i];n++;}return s<=tol*n;};
  const best=(arr,len,maxN,tol,minCell)=>{const win=Math.max(1,Math.round(len*.003));
    for(let n=maxN;n>=2;n--){const cell=len/n;if(cell<minCell)continue;let ok=0,cont=0;
      for(let i=1;i<n;i++)if(clearAt(arr,Math.round(i*cell),win,tol))ok++;
      for(let i=0;i<n;i++){let s=0;for(let x=Math.round(i*cell);x<Math.round((i+1)*cell);x++)s+=arr[x];if(s>0)cont++;}
      if(ok>=(n-1)*.9&&cont>=n*.9)return n;}return 1;};
  let C=best(col,w,64,h*.012,10),R=best(row,h,16,w*.012,10);
  if(C===1&&R===1&&img.width/img.height>=1.8)return {C:Math.round(img.width/img.height),R:1,guess:true};
  return {C,R};}
const consensus=arr=>{const m=new Map();for(const v of arr)m.set(v,(m.get(v)||0)+1);return [...m.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0][0];};
function frameEd(set,k,sheets,after,redo){
  const st=set.st[k];const sh=sheets.find(s=>s.name===st.src[0]);if(!sh||!sh.img){toast('Trạng thái này chưa có ảnh');return;}
  const I=sh.img,multi=st.src.length>1;
  const ov=el('div',{style:'position:fixed;inset:0;z-index:160;background:#0d141bf5;display:flex;flex-direction:column;padding:10px;gap:8px;color:#fff;font:14px system-ui;overflow:auto'});
  let C=st.n>0?st.n:Math.max(1,Math.round(I.width/(multi?I.height:Math.max(1,Math.floor(I.height/Math.max(1,st.dirs||1)))))),R=multi?1:Math.max(1,st.dirs||1);
  if(st.fw>0&&st.fh>0){C=Math.max(1,Math.round(I.width/st.fw));R=multi?1:Math.max(1,Math.round(I.height/st.fh));}
  const cv=el('canvas',{style:'width:100%;max-height:48vh;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#2a3a49 0 25%,#1c2832 0 50%) 0 0/16px 16px;border-radius:8px'});
  const pv=el('canvas',{style:'width:150px;height:150px;background:#1e2a36;border-radius:8px;image-rendering:pixelated;flex:none'});pv.width=pv.height=150;
  const info=el('div',{class:'hint',style:'margin:0'},'');const tx=el('div',{style:'font-weight:700'},'');
  const draw=()=>{cv.width=I.width;cv.height=I.height;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(I,0,0);g.strokeStyle='#ff3b3b';g.lineWidth=Math.max(2,I.width/400);
    const fw=I.width/C,fh=I.height/R;for(let r=0;r<R;r++)for(let c=0;c<C;c++)g.strokeRect(c*fw+1,r*fh+1,fw-2,fh-2);
    tx.textContent=C+' khung (cột) × '+R+' hàng'+(multi?' (mỗi ảnh = 1 hướng, chỉ có 1 hàng)':' (mỗi hàng = 1 hướng)');info.textContent='Mỗi khung '+Math.round(fw)+'×'+Math.round(fh)+' px. Ô đỏ phải ôm trọn từng người, không cắt vào người.';};
  const stp=(l,f)=>el('button',{class:'btn',style:'padding:12px 16px;font-size:18px;font-weight:700',onclick:()=>{f();draw();}},l);
  const t0=performance.now();(function loop(){if(!pv.isConnected)return;const g=pv.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,150,150);
    const fw=I.width/C,fh=I.height/R,f=Math.floor((performance.now()-t0)/1000*(st.fps||8))%C;const sc=Math.min(140/fw,140/fh);
    g.drawImage(I,f*fw,0,fw,fh,(150-fw*sc)/2,(150-fh*sc)/2,fw*sc,fh*sc);requestAnimationFrame(loop);})();
  const row=(l,minus,plus)=>el('div',{style:'display:flex;gap:8px;align-items:center'},el('span',{style:'min-width:150px'},l),minus,plus);
  ov.append(el('div',{style:'font-weight:700;font-size:16px'},'✂ Sửa khung — '+STATES.find(s=>s[0]===k)[1]+' ('+I.width+'×'+I.height+' px)'),
    el('div',{class:'hint',style:'margin:0'},'Đếm giúp: ảnh có mấy người nằm ngang (= số khung)? mấy hàng dọc (= số hướng)? Bấm +/− cho đến khi mỗi ô đỏ ôm đúng một người.'),
    cv,tx,info,
    el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;align-items:center'},el('div',{style:'display:flex;flex-direction:column;gap:8px'},
      row('Số khung (cột ngang)',stp('−',()=>{C=Math.max(1,C-1);}),stp('+',()=>{C=Math.min(64,C+1);})),
      multi?'':row('Số hàng (hướng dọc)',stp('−',()=>{R=Math.max(1,R-1);}),stp('+',()=>{R=Math.min(16,R+1);}))),pv),
    el('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},
      el('button',{class:'btn',style:'padding:12px 16px',onclick:()=>{const r=findGrid(I);if(!r||r.opaque){toast('Ảnh không có nền trong suốt nên không tự đoán được, hãy chỉnh bằng nút +/−');return;}C=r.C;if(!multi)R=r.R;draw();toast('Đoán: '+C+' khung × '+R+' hàng');}},'🎯 Tự đoán theo phần ảnh có hình'),
      el('button',{class:'btn',style:'padding:12px 16px;background:#2e8b57;color:#fff;font-weight:700',onclick:()=>{st.n=C;st.fw=0;st.fh=0;if(!multi)st.dirs=R;ov.remove();after();redo();toast('Đã lưu khung');}},'✔ Xong'),
      el('button',{class:'btn',style:'padding:12px 16px',onclick:()=>ov.remove()},'Huỷ')));
  document.body.append(ov);draw();}

/* ---------- nạp gói hoạt ảnh (.zip) có kèm animation.json ---------- */
const DIRN={'chính diện':'S','quay lưng':'N','ngang phải':'E','ngang trái':'W','chéo phải trước':'SE','chéo trái trước':'SW','chéo phải sau':'NE','chéo trái sau':'NW'};
const CANON=['S','SW','W','NW','N','NE','E','SE'];
function mapFromNames(names){const m=new Array(8).fill(null);(names||[]).forEach((n,i)=>{const k=DIRN[String(n).toLowerCase().normalize('NFC')];if(k)m[CANON.indexOf(k)]=i;});return m.every(x=>x!=null)?m:null;}
const toURL=u8=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(new Blob([u8],{type:'image/png'}));});
const loadImg=s=>new Promise(r=>{const i=new Image();i.onload=()=>{s.img=i;s.cols=Math.max(1,Math.floor((i.width+s.margin)/(s.tw+s.margin)));s.rows=Math.max(1,Math.floor((i.height+s.margin)/(s.tw+s.margin)));r();};i.onerror=r;i.src=s.url;});
async function readPacks(files){
  const packs=[];
  for(const f of files){let data;try{data=await packBytes(f);}catch(e){toast('Không đọc được '+f.name);continue;}
    const entries=[];try{unzipSync(data,{filter:e=>{entries.push({n:e.name,s:e.originalSize});return false;}});}catch(e){toast('Không đọc được '+f.name);continue;}
    const jsonE=entries.filter(e=>/(^|\/)animation\.json$/i.test(e.n));let metas=[];
    for(const je of jsonE){try{const u=unzipSync(data,{filter:e=>e.name===je.n})[je.n];metas.push({path:je.n,j:JSON.parse(new TextDecoder().decode(u))});}catch(e){}}
    packs.push({file:f,data,entries,metas,base:f.name.replace(/\.(zip|rar)$/i,'')});}
  return packs;}
function analyze(packs){packs=packs.slice().sort((x,y)=>(y.metas.some(m=>m.j.frameCountPerDirection)?1:0)-(x.metas.some(m=>m.j.frameCountPerDirection)?1:0));
  const chars=new Map();const C=n=>{if(!chars.has(n))chars.set(n,{name:n,run:null,clips:[],bytes:0,files:[]});return chars.get(n);};
  for(const p of packs){
    for(const m of p.metas){const j=m.j,dir=m.path.includes('/')?m.path.replace(/[^/]+$/,''):'';
      if(j.clips&&j.clips.length){ // gói chiêu thức: 1 hướng, nhiều clip
        let nm=p.base.replace(/^[0-9a-f]{8}-/i,'').replace(/[-_ ]?Combo.*$/i,'')||p.base;const known=[...chars.keys()].find(k=>nm.includes(k)||p.base.includes(k));if(known)nm=known;const c=C(nm);
        for(const cl of j.clips){const path=dir+cl.sheet;const e=p.entries.find(x=>x.n===path);if(!e)continue;c.clips.push({id:cl.id,path,pack:p,n:cl.frameCount,dur:cl.durationMs,fw:j.width,fh:j.height,ax:j.anchor&&j.anchor[0],ay:j.anchor&&j.anchor[1],skip1:!!cl.sharesFirstPoseWithPrevious,facing:j.direction});c.bytes+=e.s;}}
      else if(j.frameCountPerDirection){ // gói chạy nhiều hướng: Nhân-vật/Huong-N/Tên_Run.png
        for(const e of p.entries){const mm=/^(?:.*\/)?([^/]+)\/Huong-(\d+)\/([^/]+)\.png$/i.exec(e.n);if(!mm||/\/PNG\//i.test(e.n))continue;
          const c=C(mm[1]);const stt=(/_([A-Za-z]+)$/.exec(mm[3])||[])[1]||'Run';c.run=c.run||{meta:j,dirs:new Map(),pack:p,state:stt};c.run.dirs.set(+mm[2],e.n);c.bytes+=e.s;}}}
  }
  return [...chars.values()].filter(c=>c.run||c.clips.length);}
function describe(c){const t=[];if(c.run)t.push('Chạy '+c.run.dirs.size+' hướng × '+c.run.meta.frameCountPerDirection+' khung ('+c.run.meta.frameWidth+'×'+c.run.meta.frameHeight+')');if(c.clips.length)t.push('Đánh '+c.clips.length+' đòn liên hoàn: '+c.clips.map(x=>x.id+' ('+x.n+' khung)').join(' → '));return t.join(' · ');}
export function packUI(cfg,sheets,after,draw,AN){
  const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept='.zip,.rar,application/zip,application/x-zip-compressed';
  inp.onchange=async()=>{let fs=[...inp.files];if(!fs.length)return;fs=await expandPacks(fs);if(!fs.length)return;toast('Đang đọc '+fs.length+' gói…');const packs=await readPacks(fs);const chars=analyze(packs);
    if(!chars.length){toast('Không thấy animation.json hợp lệ trong zip. Hãy dùng nút ⚡ Tự tạo từ ảnh đã tải.');return;}
    const total=chars.reduce((s,c)=>s+c.bytes,0);const picked=new Set(total<=45e6?chars.map(c=>c.name):[]);
    const ov=el('div',{style:'position:fixed;inset:0;z-index:150;background:#0d141bf2;display:flex;flex-direction:column;padding:10px;gap:8px;color:#fff;font:14px system-ui'});
    const box=el('div',{style:'flex:1;overflow:auto;background:#16202b;border-radius:8px;padding:4px'});const cnt=el('span',{class:'lbl'},'');
    const upd=()=>{const b=chars.filter(c=>picked.has(c.name)).reduce((s,c)=>s+c.bytes,0);cnt.textContent='Đã chọn '+picked.size+'/'+chars.length+' nhân vật · khoảng '+(b/1e6).toFixed(1)+' MB';};
    for(const c of chars){const cb=el('input',{type:'checkbox',style:'width:22px;height:22px;flex:none'});cb.checked=picked.has(c.name);cb.onclick=()=>{cb.checked?picked.add(c.name):picked.delete(c.name);upd();};
      box.append(el('div',{style:'display:flex;gap:8px;align-items:flex-start;padding:8px 6px;border-bottom:1px solid #243342'},cb,el('div',{},el('b',{},c.name),el('div',{class:'hint',style:'margin:0'},describe(c)+'  — '+(c.bytes/1e6).toFixed(1)+' MB'))));}
    const mkb=(l,f,c)=>el('button',{class:'btn',style:'padding:10px 14px;'+(c||''),onclick:f},l);
    ov.append(el('div',{style:'font-weight:700'},'Tìm thấy '+chars.length+' nhân vật. App đã đọc animation.json: số khung, tốc độ, điểm đặt chân và tên hướng. Tick nhân vật cần dùng (mỗi nhân vật vài MB'+(total>45e6?'; gói lớn nên chưa tick sẵn':'')+').'),
      el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center'},mkb('☑ Chọn tất cả',()=>{chars.forEach(c=>picked.add(c.name));ov.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=true);upd();}),mkb('☐ Bỏ chọn',()=>{picked.clear();ov.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=false);upd();}),cnt),box,
      el('div',{style:'display:flex;gap:8px'},mkb('✔ Nạp các nhân vật đã chọn',async()=>{if(!picked.size){toast('Chưa tick nhân vật nào');return;}ov.remove();await build(chars.filter(c=>picked.has(c.name)));},'background:#2e8b57;color:#fff'),mkb('Đóng',()=>ov.remove())));
    document.body.append(ov);upd();};
  inp.click();
  async function addSheet(name,u8,fw){const ex=sheets.slice(4).find(s=>s.name===name);if(ex)return ex.name;const s={name,url:await toURL(u8),tw:fw,margin:0};await loadImg(s);sheets.push(s);return name;}
  async function build(list){cfg.anims=cfg.anims||[];toast('Đang nạp '+list.length+' nhân vật…');let first=null;
    for(const c of list){let set=cfg.anims.find(a=>a.name===c.name);if(!set){set={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:c.name,sc:1,oy:0,ord:'cw',off:0,fl:0,st:{}};cfg.anims.push(set);}first=first||set.id;
      if(c.run){const m=c.run.meta,names=[],keys=[...c.run.dirs.keys()].sort((x,y)=>x-y);const stt=c.run.state.toLowerCase()==='run'?'run':'run';
        for(const d of keys){const path=c.run.dirs.get(d);const u8=unzipSync(c.run.pack.data,{filter:e=>e.name===path})[path];names.push(await addSheet(c.name+'_Run_'+d,u8,m.frameWidth));}
        set.st.run={src:names,dirs:names.length,n:m.frameCountPerDirection,fw:m.frameWidth,fh:m.frameHeight,fps:Math.round(1000/(m.frameMs||70)*10)/10,ax:m.origin&&m.origin[0],ay:m.origin&&m.origin[1]};
        const mp=mapFromNames(m.directionNames);if(mp&&names.length===8)set.map=mp;
        set.sc=Math.round(Math.min(3,24/Math.max(16,m.origin?m.origin[1]:m.frameHeight))*1000)/1000;set.scSet=1;}
      let ci=0;for(const cl of c.clips){ci++;const u8=unzipSync(cl.pack.data,{filter:e=>e.name===cl.path})[cl.path];const nm=await addSheet(c.name+'_'+cl.id,u8,cl.fw);
        set.st['atk'+(ci>1?ci:'')]={src:[nm],dirs:1,n:cl.n,fw:cl.fw,fh:cl.fh,fps:10,dur:cl.dur,ax:cl.ax,ay:cl.ay,skip1:cl.skip1};}
      if(!set.scSet&&c.clips.length){set.sc=Math.round(Math.min(3,24/Math.max(16,c.clips[0].ay||c.clips[0].fh))*1000)/1000;set.scSet=1;}
      set.fl=0;}
    if(first){AN.sel=first;if(!cfg.heroAnim)cfg.heroAnim=first;}
    toast('Đã nạp '+list.length+' nhân vật');after();draw();}
}
/* ---------- giao diện tab "Hoạt ảnh" ---------- */
const bt=(l,f,c)=>el('button',{class:'btn'+(c?' '+c:''),onclick:f},l);
function group(name,sheets){ // tìm các ảnh cùng bộ khác nhau ở chữ số hướng: PREFIX_<d>_SUFFIX
  const m=/^(.*)_(\d)_(.*)$/.exec(name);if(!m)return [name];
  const out=[];for(const s of sheets){const q=/^(.*)_(\d)_(.*)$/.exec(s.name);if(q&&q[1]===m[1]&&q[3]===m[3])out.push([+q[2],s.name]);}
  out.sort((a,b)=>a[0]-b[0]);return out.length>1?out.map(o=>o[1]):[name];}
export function animTab(body,cfg,sheets,after,draw,AN){
  uniqNames(sheets);cfg.anims=cfg.anims||[];const custom=sheets.slice(4);
  const sel=AN.sel&&cfg.anims.find(a=>a.id===AN.sel)?AN.sel:(cfg.anims[0]&&cfg.anims[0].id)||null;AN.sel=sel;
  body.append(el('div',{class:'hint'},'Chỉ cần 3 bước: ① nạp ảnh ở tab 💾 Tệp ② bấm nút xanh bên dưới → Tạo ③ bấm 🎮 Chơi. App tự nhận hướng chạy, đánh, trúng đòn và tự đặt làm nhân vật chính.'));
  const row=el('div',{class:'row'});for(const a of cfg.anims)row.append(bt(a.name,()=>{AN.sel=a.id;draw();},a.id===sel?'on':''));
  const big=bt('⚡ TẠO TỰ ĐỘNG TỪ TẤT CẢ ẢNH ĐÃ TẢI',()=>bulkUI(cfg,sheets,()=>{after();draw();},AN),'on');big.style.cssText='width:100%;padding:14px;font-size:16px;font-weight:700;background:#2e8b57;color:#fff;margin:6px 0';body.append(big);
  const pk=bt('📦 NẠP GÓI HOẠT ẢNH (.zip) — tự đọc animation.json',()=>packUI(cfg,sheets,after,draw,AN),'on');pk.style.cssText='width:100%;padding:14px;font-size:16px;font-weight:700;background:#c0762b;color:#fff;margin:6px 0';body.insertBefore(pk,big);
  if(cfg.anims.length)body.append(bt('🗑 Xoá hết các bộ để làm lại',()=>{cfg.anims=[];delete cfg.heroAnim;AN.sel=null;after();draw();}));
  row.append(bt('➕ Bộ mới',()=>{const a={id:Date.now().toString(36),name:'Nhân vật '+(cfg.anims.length+1),sc:1,oy:0,ord:'cw',off:0,fl:0,st:{}};cfg.anims.push(a);AN.sel=a.id;after();draw();}));body.append(row);
  const set=cfg.anims.find(a=>a.id===sel);if(!set){body.append(el('div',{class:'hint'},custom.length?'Chưa có bộ nào. Bấm ➕ Bộ mới.':'Chưa có ảnh nào được tải lên. Vào tab 💾 Tệp → 📂 TẢI TỆP LÊN trước.'));return;}
  const A=makeAnims(cfg,sheets);
  const adv=el('details',{style:'margin:10px 0;border:1px dashed #4a6178;border-radius:10px;padding:6px'},el('summary',{style:'padding:8px;font-weight:700;cursor:pointer'},'🔧 Chỉnh tay từng trạng thái (nâng cao, thường không cần)'));
  const fld=(l,k,type,ex)=>{const i=el('input',{type,value:set[k]==null?'':set[k],class:'num',style:'width:80px',min:ex&&ex.min,max:ex&&ex.max,step:ex&&ex.step});i.oninput=()=>{set[k]=type==='number'?+i.value:i.value;after();};return el('div',{class:'row'},el('span',{class:'lbl'},l),i);};
  const box=el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'});
  box.append(fld('Tên bộ','name','text'),fld('Cỡ nhân vật (×)','sc','number',{min:.1,max:6,step:.05}),fld('Nâng (+) / hạ (−) px','oy','number',{min:-64,max:64,step:1}));
  const cb=el('input',{type:'checkbox'});cb.checked=!!set.fl;cb.onchange=()=>{set.fl=cb.checked?1:0;after();};box.append(el('div',{class:'row'},cb,el('span',{class:'lbl'},'Ảnh gốc quay sang trái (chỉ dùng cho ảnh 1 hướng)')));
  const os=el('select',{class:'num'},ORD.map(([v,n])=>el('option',{value:v},n)));os.value=set.ord||'cw';os.onchange=()=>{set.ord=os.value;after();};
  const of=el('select',{class:'num'},[0,1,2,3,4,5,6,7].map(i=>el('option',{value:i},'lệch '+i)));of.value=set.off||0;of.onchange=()=>{set.off=+of.value;after();};
  box.append(el('div',{class:'row'},el('span',{class:'lbl'},'Thứ tự hướng'),os,of),el('div',{class:'hint'},'Nếu nhân vật quay sai hướng khi chạy: đổi "thứ tự" hoặc "lệch" cho tới khi xem trước khớp.'));adv.append(box);
  // xem trước
  const pv=el('canvas',{style:'width:100%;height:150px;background:#1e2a36;border-radius:8px;image-rendering:pixelated'});pv.width=300;pv.height=150;
  const P={st:(STATES.find(([k])=>set.st[k]&&set.st[k].src&&set.st[k].src.length)||['idle'])[0],d:0};const sp=el('div',{class:'row'}),dr=el('div',{class:'row'});
  const info=el('div',{class:'hint'},'');
  for(const [k,n] of STATES)sp.append(bt(n,()=>{P.st=k;P.t0=performance.now();},''));
  for(let i=0;i<8;i++)dr.append(bt(['↓','↙','←','↖','↑','↗','→','↘'][i],()=>{P.fd=i;},''));
  body.append(bt(cfg.heroAnim===set.id?'✅ Bộ này đang là nhân vật chính':'🧑 Dùng bộ này làm nhân vật chính',()=>{cfg.heroAnim=set.id;after();draw();toast('Đã đặt làm nhân vật chính');},cfg.heroAnim===set.id?'on':''));
  const fixb=bt('✂ Hình bị cắt / thiếu? Bấm để sửa khung',()=>frameEd(set,P.st,sheets,after,draw),'on');fixb.style.cssText='width:100%;padding:12px;margin:4px 0;font-weight:700;background:#c0762b;color:#fff';
  body.append(el('div',{class:'lbl'},'Xem trước'),pv,sp,fixb,el('div',{class:'row'},el('span',{class:'lbl'},'Hướng:'),dr),info);
  const dirv=[[0,1],[-.7,.7],[-1,0],[-.7,-.7],[0,-1],[.7,-.7],[1,0],[.7,.7]];P.fd=0;P.t0=performance.now();
  (function loop(){if(!pv.isConnected)return;const g=pv.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,300,150);
    const st=set.st[P.st];const dirs=A.dirsOf(st);const v=dirv[P.fd];const d=A.dirIdx(set,dirs,v[0],v[1],v[0]<0?-1:1);
    const fl=dirs===1?(v[0]<0)!==!!set.fl:false;const spx=A.strip(set,P.st,d);const ps=spx?Math.min(200,1760/(spx.fh*(set.sc||1))):72;const ok=A.frame(g,set,P.st,d,(performance.now()-P.t0)/1000,150,138-ps*.32,ps,fl);
    if(!ok){g.fillStyle='#8aa';g.font='13px system-ui';g.textAlign='center';const miss=st&&st.src&&st.src.length&&!sheets.find(q=>q.name===st.src[0]);g.fillText(!st||!st.src||!st.src.length?'Bộ này chưa có trạng thái này — bấm trạng thái khác':miss?'Ảnh đã bị xóa khỏi tileset — nạp lại gói zip':'Trạng thái này chưa có ảnh',150,miss?70:75);if(miss){g.font='11px system-ui';g.fillText('(thiếu: '+st.src[0].slice(0,32)+')',150,92);}}
    const sp2=A.strip(set,P.st,d);info.textContent=sp2?'Hướng dùng: #'+d+' · '+sp2.n+' khung · mỗi khung '+sp2.fw+'×'+sp2.fh+' px':'';
    requestAnimationFrame(loop);})();
  body.append(adv);
  // từng trạng thái
  for(const [k,n] of STATES){
    const st=set.st[k]||(set.st[k]={src:[],dirs:1,n:0,fps:8});
    const q=el('input',{placeholder:'lọc tên ảnh…',style:'width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:1px solid #34485a;background:#16202b;color:#fff;margin:4px 0'});
    const s=el('select',{class:'num',style:'width:100%',multiple:true,size:6});
    const fill=()=>{const f=q.value.toLowerCase();s.textContent='';for(const c of custom)if(!f||c.name.toLowerCase().includes(f)){const o=el('option',{value:c.name},c.name);o.selected=st.src.includes(c.name);s.append(o);}};
    s.onchange=()=>{const sel=[...s.selectedOptions].map(o=>o.value);const fromAll=custom.map(c=>c.name);if(!sel.length)return;st.src=sel.length>1?sel.slice().sort((x,y)=>fromAll.indexOf(x)-fromAll.indexOf(y)):group(sel[0],custom);
      if(st.src.length>1)st.dirs=st.src.length;st.n=0;
      const sh=custom.find(c=>c.name===st.src[0]);if(sh&&sh.img){const rows=st.src.length>1?1:Math.max(1,st.dirs||1);const h=sh.img.height/rows;st.n=Math.max(1,Math.round(sh.img.width/h));
        if(!set.scSet){set.sc=Math.round(Math.min(3,24/Math.max(8,h))*100)/100;set.scSet=1;}}
      if(st.src.length>1)toast('Đã ghép '+st.src.length+' ảnh thành '+st.src.length+' hướng');after();draw();};
    q.oninput=fill;fill();
    const nI=el('input',{type:'number',value:st.n||'',class:'num',style:'width:64px',min:0,max:99});nI.oninput=()=>{st.n=+nI.value||0;after();};
    const fI=el('input',{type:'number',value:st.fps||8,class:'num',style:'width:64px',min:1,max:60});fI.oninput=()=>{st.fps=+fI.value||8;after();};
    const dI=el('select',{class:'num'},[1,2,4,8].map(v=>el('option',{value:v},v+' hướng')));dI.value=st.src.length>1?st.src.length:(st.dirs||1);dI.disabled=st.src.length>1;dI.onchange=()=>{st.dirs=+dI.value;st.n=0;after();draw();};
    const mkNum=(k,w)=>{const i=el('input',{type:'number',value:st[k]||'',class:'num',style:'width:'+w+'px',min:0,max:2048});i.oninput=()=>{st[k]=+i.value||0;after();redraw();};return i;};
    const th=el('canvas',{style:'width:100%;max-height:220px;object-fit:contain;image-rendering:pixelated;background:#1e2a36;border-radius:6px;margin-top:4px'});
    const tinfo=el('div',{class:'hint'},'');
    const redraw=()=>{const sp=A.strip(set,k,0);if(!sp){th.style.display='none';tinfo.textContent=st.src.length?'Không đọc được ảnh':'';return;}th.style.display='block';
      const I=sp.I;th.width=I.width;th.height=I.height;const g=th.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,th.width,th.height);g.drawImage(I,0,0);
      g.strokeStyle='#ff3b3b';g.lineWidth=Math.max(1,I.width/300);const R=st.src.length>1?1:sp.rows;
      for(let r=0;r<R;r++)for(let c=0;c<sp.n;c++)g.strokeRect(c*sp.fw+.5,r*sp.fh+.5,sp.fw-1,sp.fh-1);
      tinfo.textContent='Ảnh '+I.width+'×'+I.height+' px → '+sp.n+' khung × '+R+' hàng, mỗi khung '+sp.fw+'×'+sp.fh+' px. Ô đỏ = từng khung; nếu ô đỏ cắt vào người thì sai, hãy sửa số.';};
    setTimeout(redraw,0);nI.addEventListener('input',redraw);dI.addEventListener('change',()=>setTimeout(redraw,0));
    adv.append(el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'},el('div',{class:'lbl'},n+(st.src.length?' — '+st.src.length+' ảnh':'')),q,s,bt('✖ Bỏ ảnh của trạng thái này',()=>{st.src=[];after();draw();}),
      el('div',{class:'row'},dI,el('span',{class:'lbl'},'Số khung'),nI,el('span',{class:'lbl'},'khung/giây'),fI),el('div',{class:'row'},el('span',{class:'lbl'},'Rộng khung'),mkNum('fw',70),el('span',{class:'lbl'},'Cao khung'),mkNum('fh',70),el('span',{class:'hint',style:'margin:0'},'px (0 = tự đoán)')),th,tinfo,el('div',{class:'hint'},'Giữ Ctrl/Shift (hoặc chạm nhiều mục) để chọn nhiều ảnh = nhiều hướng, theo thứ tự trong danh sách. Số khung để 0 hoặc trống = tự đoán từ tỉ lệ ảnh. Ảnh 1 tấm nhiều hướng: mỗi hàng là 1 hướng.')));}
  adv.append(bt('🗑 Xoá bộ này',()=>{cfg.anims=cfg.anims.filter(a=>a.id!==set.id);AN.sel=null;after();draw();}));
}
/* chọn bộ hoạt ảnh gắn cho 1 đối tượng */
export function animPick(obj,key,cfg,after,label){
  const s=el('select',{class:'num'},el('option',{value:''},'— dùng ô tileset —'),...(cfg.anims||[]).map(a=>el('option',{value:a.id},a.name)));
  s.value=obj[key]||'';s.onchange=()=>{if(s.value)obj[key]=s.value;else delete obj[key];after();};
  return el('div',{class:'row'},el('span',{class:'lbl'},label||'Hoạt ảnh'),s);}
