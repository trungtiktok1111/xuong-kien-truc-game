/* refmap.js — "Dựng từ ảnh mẫu": hộp thoại + nối bộ nhận dạng (vision.js) với thư viện tài nguyên của app */
import {readRef,autoCal,refineCal,analyze,probe,register} from './vision.js';

export async function buildLib(c,progress=()=>{}){
  const nl=await c.nenIndex(),vl=await c.vatIndex(),lib={ground:[],objs:[]};let n=0;const tot=nl.length+vl.length+1;
  for(const o of nl){progress(n++/tot,'nạp nền '+o.id);
    try{const pk=await c.nenPack(o.id);if(pk.iso===0)continue;await c.ensureNen(o.id);const sid=c.sheets.findIndex((s,i)=>i>=4&&s.name==='Nen-'+o.id),sh=c.sheets[sid];if(!sh||!sh.img)continue;
      const wat=new Set(sh.wat||[]),tiles=Object.entries(pk.idx).map(([name,i])=>({sid,idx:i,name,sx:(i%pk.cols)*pk.tw,sy:Math.floor(i/pk.cols)*pk.tw,wat:wat.has(i)}));
      lib.ground.push({img:sh.img,tw:pk.tw,cy:pk.cy||0,tiles});}catch(e){console.warn('nền',o.id,e);}}
  const add=(items)=>{for(const q of items){if(q.role==='Mái/cửa')continue;const sh=c.sheets[q.tile.sid];if(!sh||!sh.img)continue;
    const cvs=q.cv?c.sheets[q.cv.sid]:null;
    lib.objs.push({img:sh.img,tw:sh.tw,sx:(q.tile.idx%sh.cols)*(sh.tw+sh.margin),sy:Math.floor(q.tile.idx/sh.cols)*(sh.tw+sh.margin),name:q.name,role:q.role,sc:q.sc,fx:q.fx,fy:q.fy,q,
      cv:cvs&&cvs.img?{img:cvs.img,tw:cvs.tw,sx:(q.cv.idx%cvs.cols)*(cvs.tw+cvs.margin),sy:Math.floor(q.cv.idx/cvs.cols)*(cvs.tw+cvs.margin)}:null});}};
  for(const o of vl){progress(n++/tot,'nạp vật thể '+o.id);try{add(await c.ensureVat(o.id));}catch(e){console.warn('vật',o.id,e);}}
  try{add(await c.ensureVat('mine'));}catch(e){}
  return lib;}

/* kết quả phân tích → bản đồ (cùng dạng bản đồ tạo bối cảnh) */
export function toMap(R,lib,c,name){
  const {W,H}=R,layers=[0,1,2,3].map(()=>new Array(W*H).fill(0)),blk=new Array(W*H).fill(0),ents=[];let id=0;
  for(const cell of R.cells){const g=cell.g;if(!g||!g.t||(g.d>60&&!g.fill))continue;const i=cell.Y*W+cell.X;layers[0][i]=c.enc(g.t.sid,g.t.idx,0);if(g.t.wat)blk[i]=1;}
  const put=(f)=>{const q=f.it.q,e={id:'r'+(id++),t:'deco',x:f.x,y:f.y,f:1,fx:q.fx,fy:q.fy,sc:q.sc,ox:0,oy:0,flat:q.role==='Phủ nền',name:q.name,tile:q.tile,zb:q.zb};if(q.cv)e.cv=q.cv;if(q.role==='Phủ nền')e.walk=true;ents.push(e);};
  R.decal.forEach(put);R.found.forEach(put);
  /* điểm xuất phát: ô nền có nước/vật gần tâm nhất */
  let best=null;const cx=W/2,cy=H/2,occ=new Set(ents.filter(e=>!e.flat).map(e=>e.x+','+e.y));
  for(const cell of R.cells){const i=cell.Y*W+cell.X;if(!layers[0][i]||blk[i]||occ.has(cell.X+','+cell.Y))continue;const d=Math.hypot(cell.X-cx,cell.Y-cy);if(!best||d<best.d)best={d,x:cell.X,y:cell.Y};}
  ents.push({id:'s'+Date.now().toString(36),t:'start',x:best?best.x:Math.floor(W/2),y:best?best.y:Math.floor(H/2),name:'Xuất phát',tile:null});
  return {w:W,h:H,layers,blk,ents};}

const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Không đọc được ảnh'));i.src=src;});

export function openRefMap(c){
  const {el,btn,toast}=c;let lib=null,ref=null,cal=null,R=null,busy=false;
  const ov=el('div',{style:'position:fixed;inset:0;z-index:150;background:#000c;overflow:auto;padding:12px'});
  const box=el('div',{style:'background:#1b2733;border:1px solid #4a6178;border-radius:14px;padding:14px;max-width:980px;margin:0 auto;color:#fff;font:14px/1.5 system-ui'});
  const st=el('div',{style:'color:#e8c08a;margin:8px 0;min-height:20px'},'Chọn ảnh mẫu (ảnh dựng từ chính tài nguyên của bạn càng giống thì càng chính xác).');
  const cv=el('canvas',{style:'max-width:100%;border:1px solid #4a6178;border-radius:8px;background:#0b1218;touch-action:none'});
  const ctl=el('div',{style:'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0'}),out=el('div');
  const mkS=(lab,min,max,step,get,set)=>{const i=el('input',{type:'range',min,max,step,value:get(),style:'width:170px',oninput:e=>{set(+e.target.value);draw();}});const w=el('label',{style:'display:flex;gap:6px;align-items:center;font-size:12px'},lab,i);w.i=i;return w;};
  let sz,sox,soy;
  const draw=()=>{if(!ref)return;const g=cv.getContext('2d'),K=Math.min(1,900/ref.w);cv.width=ref.w*K;cv.height=ref.h*K;g.drawImage(ref.canvas,0,0,cv.width,cv.height);
    if(!cal)return;const D=96*cal.z*K,ox=cal.ox*K,oy=cal.oy*K;g.strokeStyle='rgba(255,210,74,.7)';g.lineWidth=1;g.beginPath();
    const span=Math.ceil(Math.max(cv.width,cv.height)/D)+6;
    for(let k=-span*2;k<=span*2;k++){/* đường x-y=k và x+y=k */g.moveTo(ox+k*D-span*D,oy-span*D/2);g.lineTo(ox+k*D+span*D,oy+span*D/2);g.moveTo(ox+k*D+span*D,oy-span*D/2);g.lineTo(ox+k*D-span*D,oy+span*D/2);}
    g.stroke();g.fillStyle='#ff4040';g.beginPath();g.arc(ox,oy,5,0,6.3);g.fill();};
  const sync=()=>{sz.i.value=Math.log(cal.z);sox.i.value=cal.ox;soy.i.value=cal.oy;draw();};
  sz=mkS('Độ phóng',Math.log(.2),Math.log(3),.002,()=>cal?Math.log(cal.z):0,v=>{if(cal)cal.z=Math.exp(v);});
  sox=mkS('Lệch ngang',-600,600,1,()=>cal?cal.ox:0,v=>{if(cal)cal.ox=v;});
  soy=mkS('Lệch dọc',-600,600,1,()=>cal?cal.oy:0,v=>{if(cal)cal.oy=v;});
  const wait=async(msg)=>{st.textContent=msg;await new Promise(r=>setTimeout(r,40));};
  const ensureLib=async()=>{if(lib)return;lib=await buildLib(c,(p,m)=>{st.textContent='Nạp thư viện tài nguyên… '+m;});};
  const file=el('input',{type:'file',accept:'image/*',onchange:async e=>{const f=e.target.files[0];if(!f)return;const im=await loadImg(URL.createObjectURL(f));ref=readRef(im);cal={z:.5,ox:ref.w/2,oy:ref.h/3};R=null;out.textContent='';sync();st.textContent='Đã nạp ảnh '+ref.w+'×'+ref.h+'. Bấm "Tự dò lưới", hoặc chỉnh tay cho các đường vàng khớp với ô nền rồi bấm "Phân tích".';}});
  const run=async(fn)=>{if(busy)return;busy=true;try{await fn();}catch(e){console.error(e);st.textContent='Lỗi: '+(e&&e.message||e);}busy=false;};
  const bAuto=btn('🔍 Tự dò lưới',()=>run(async()=>{if(!ref)return toast('Chọn ảnh trước');await ensureLib();await wait('Đang dò lưới… (vài giây)');const r=await autoCal(ref,lib,{},(p,m)=>{st.textContent='Đang dò lưới… '+Math.round(p*100)+'% '+m;});if(r&&r.s<1e8){cal={z:r.z,ox:r.ox,oy:r.oy};sync();st.textContent='Dò được: phóng '+r.z.toFixed(2)+', sai số nền '+r.s.toFixed(1)+(r.s>40?' (cao — nên chỉnh tay cho khớp rồi "Tinh chỉnh")':'');}else st.textContent='Không dò được lưới (nền quá trơn?). Hãy chỉnh tay cho các đường vàng khớp ô nền.';}));
  const bRef=btn('🎯 Tinh chỉnh',()=>run(async()=>{if(!ref)return toast('Chọn ảnh trước');await ensureLib();await wait('Đang tinh chỉnh…');const r=await refineCal(ref,lib,cal);cal={z:r.z,ox:r.ox,oy:r.oy};sync();st.textContent='Đã tinh chỉnh (sai số nền '+r.s.toFixed(1)+')';}));
  const bGo=btn('🧠 Phân tích & dựng',()=>run(async()=>{if(!ref)return toast('Chọn ảnh trước');await ensureLib();await wait('Đang nhận dạng ảnh…');
    R=await analyze(ref,lib,cal,{},(p,m)=>{st.textContent='Đang nhận dạng… '+Math.round(p*100)+'% '+m;});if(R.error){st.textContent=R.error;return;}show();}),'on');
  ctl.append(file,bAuto,bRef,bGo);
  const show=()=>{const s=R.stats;out.textContent='';
    out.append(el('div',{style:'margin:8px 0'},'✅ Nhận ra '+s.objects+' vật thể, '+s.decals+' phủ nền, '+(R.cells.length-R.badCells)+'/'+R.cells.length+' ô nền khớp tài nguyên. ⚠ '+s.missing+' vùng chưa có tài nguyên ('+Math.round(s.unexplained*100)+'% ảnh).'));
    const names={};for(const f of R.found)names[f.it.name]=(names[f.it.name]||0)+1;out.append(el('div',{style:'font-size:12px;color:#9fb4c8;margin-bottom:6px'},Object.entries(names).map(([n,k])=>n+' ×'+k).join(' · ')||'(chưa nhận ra vật thể nào)'));
    if(R.badCells)out.append(el('div',{style:'color:#ffb060;margin:4px 0'},'⚠ '+R.badCells+' ô nền không có tile nào giống — thiếu ô nền cho các chỗ đó (xem các vùng bên dưới).'));
    if(R.miss.length){out.append(el('div',{class:'lbl',style:'color:#e8c08a;margin-top:6px'},'THIẾU TÀI NGUYÊN — hãy tải thêm rồi phân tích lại:'));
      const row=el('div',{style:'display:flex;flex-wrap:wrap;gap:8px'});for(const m of R.miss.slice(0,30)){const kind=m.h>m.w*1.15?'vật đứng/cao (cây, nhà, cột…)':(m.w>m.h*1.6?'mảng dẹt (nền/phủ nền/nước)':'vật nhỏ');
        row.append(el('div',{style:'background:#26201a;border:1px solid #6b4a2a;border-radius:8px;padding:6px;width:150px;font-size:11px'},el('img',{src:m.thumb,style:'max-width:100%;max-height:100px;display:block;margin:0 auto 4px;background:#0b1218'}),'≈ '+m.cellsW.toFixed(1)+'×'+m.cellsH.toFixed(1)+' ô · '+kind,el('div',{style:'display:flex;align-items:center;gap:4px'},el('span',{style:'display:inline-block;width:12px;height:12px;border-radius:3px;background:rgb('+m.color+')'}),'màu chủ đạo')));}
      out.append(row);}
    out.append(el('div',{style:'margin-top:10px'},btn('➡ Áp dụng vào màn hiện tại',async()=>{if(!await c.yes('Thay bản đồ màn hiện tại bằng bản dựng từ ảnh mẫu?\n(Ctrl+Z hoàn tác được.)'))return;c.apply(toMap(R,lib,c));ov.remove();toast('Đã dựng '+R.found.length+' vật thể, '+R.decal.length+' phủ nền');},'on')));
    st.textContent='Xong. Xem kết quả bên dưới.';};
  box.append(el('div',{style:'display:flex;justify-content:space-between;align-items:center'},el('b',{style:'font-size:16px'},'🖼 Dựng bản đồ từ ảnh mẫu'),btn('Đóng',()=>ov.remove())),st,ctl,el('div',{style:'display:flex;flex-wrap:wrap;gap:12px'},sz,sox,soy),cv,out);
  ov.append(box);document.body.append(ov);
  /* kéo chuột trên ảnh để dời lưới */
  let drag=null;cv.onpointerdown=e=>{if(!cal)return;drag={x:e.clientX,y:e.clientY,ox:cal.ox,oy:cal.oy};cv.setPointerCapture(e.pointerId);};
  cv.onpointermove=e=>{if(!drag)return;const K=Math.min(1,900/ref.w)*(cv.clientWidth/cv.width||1);cal.ox=drag.ox+(e.clientX-drag.x)/K;cal.oy=drag.oy+(e.clientY-drag.y)/K;sync();};
  cv.onpointerup=()=>{drag=null;};
  /* móc kiểm thử */
  window.__refmap={async run(url,calIn,refine){await ensureLib();const im=await loadImg(url);ref=readRef(im);let cl=calIn;if(!cl){const t0=performance.now();cl=await autoCal(ref,lib);cl.ms=performance.now()-t0;}if(refine){const t2=performance.now();const rr=await register(ref,lib,cl,{debug:1,wide:1});console.log('REG',JSON.stringify(rr.log));cl={...rr.cal,matches:rr.matches,log:[rr.log,rr.log2],ms:performance.now()-t2};}cal=cl;const t1=performance.now();R=await analyze(ref,lib,cal,{});R.ms=performance.now()-t1;show();return {cal,stats:R.stats,found:R.found.map(f=>[f.it.name,f.x,f.y,+f.frac.toFixed(2),f.it.q.tile.sid,f.it.q.tile.idx]),ms:R.ms,bad:R.badCells,miss:R.miss.length};},get R(){return R;},probe(items,off){return items.map(([sid,idx,x,y])=>{const o=lib.objs.find(q=>q.q.tile.sid===sid&&q.q.tile.idx===idx);return o?[o.name,probe(ref,lib,cal,o,x+off,y+off)]:[null,null];});},toMap:()=>toMap(R,lib,c)};
  return ov;}
