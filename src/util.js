export const $=(s,r=document)=>r.querySelector(s);
export function el(tag,attrs={},...kids){const e=document.createElement(tag);for(const k in attrs){if(k==='class')e.className=attrs[k];else if(k==='style')e.style.cssText=attrs[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),attrs[k]);else if(k==='html')e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}
  for(const c of kids.flat())if(c!=null)e.append(c.nodeType?c:document.createTextNode(c));return e;}
let tt;export function toast(m){let t=$('#toast');if(!t){t=el('div',{id:'toast'});document.body.append(t);}t.textContent=m;t.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>t.style.opacity=0,2200);}
function crc32(u){let c,t=crc32.t;if(!t){t=crc32.t=new Uint32Array(256);for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}}c=~0;for(let i=0;i<u.length;i++)c=t[(c^u[i])&255]^(c>>>8);return ~c>>>0;}
async function zip1(name,blob){const d=new Uint8Array(await blob.arrayBuffer()),n=new TextEncoder().encode(name),crc=crc32(d),L=d.length;
const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint32(14,crc,true);lh.setUint32(18,L,true);lh.setUint32(22,L,true);lh.setUint16(26,n.length,true);
const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint32(16,crc,true);ch.setUint32(20,L,true);ch.setUint32(24,L,true);ch.setUint16(28,n.length,true);
const off=30+n.length+L,cd=46+n.length;
const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,1,true);e.setUint16(10,1,true);e.setUint32(12,cd,true);e.setUint32(16,off,true);
return new Blob([lh,n,d,ch,n,e],{type:'application/zip'});}
export async function saveFile(name,blob){
  try{
    const dl=window.claude&&claude.use?await claude.use('downloads'):null;
    if(dl){let nm=name,b=blob;if(/\.glb$/i.test(nm)){b=await zip1(nm,blob);nm=nm.replace(/\.glb$/i,'.zip');}
      try{await dl.save({filename:nm,data:b});return 'saved';}catch(e){if(e&&e.code==='declined')return 'cancel';}}
  }catch(e){}
  try{const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return 'share';}}catch(e){if(e&&e.name==='AbortError')return 'cancel';}
  try{const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return 'dl';}catch(e){}
  window.open(URL.createObjectURL(blob),'_blank');return 'open';}
export function lsGet(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
const idbOpen=()=>new Promise((res,rej)=>{try{const r=indexedDB.open('thk_store',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});
export async function idbSet(k,v){try{const db=await idbOpen();return await new Promise(res=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res(true);t.onerror=()=>res(false);t.onabort=()=>res(false);});}catch(e){return false;}}
export async function idbDel(k){try{const db=await idbOpen();return await new Promise(res=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=()=>res(true);t.onerror=()=>res(false);t.onabort=()=>res(false);});}catch(e){return false;}}
export async function idbGet(k){try{const db=await idbOpen();return await new Promise(res=>{const t=db.transaction('kv','readonly');const q=t.objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(undefined);});}catch(e){return undefined;}}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
/* Hộp thoại trong trang (prompt/confirm của trình duyệt bị chặn trong khung artifact nên thất bại im lặng) */
function dlg(msg,def,kind){return new Promise(res=>{const ov=el('div',{style:'position:fixed;inset:0;z-index:200;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px'});
  const box=el('div',{style:'background:#1b2733;border:1px solid #4a6178;border-radius:14px;padding:16px;max-width:520px;width:100%;color:#fff;font:15px system-ui;line-height:1.5'});
  box.append(el('div',{style:'margin-bottom:10px;white-space:pre-wrap'},msg));let inp=null;
  if(kind==='text'||kind==='area'){inp=el(kind==='area'?'textarea':'input',{style:'width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px;margin-bottom:12px',rows:kind==='area'?6:undefined});inp.value=def==null?'':def;box.append(inp);}
  const done=v=>{ov.remove();res(v);};
  const B=(l,f,c)=>el('button',{style:'padding:10px 18px;border-radius:10px;border:0;font-size:15px;font-weight:700;margin-right:8px;'+(c||'background:#34485a;color:#fff'),onclick:f},l);
  box.append(el('div',{},B(kind==='yes'?'Đồng ý':'OK',()=>done(inp?inp.value:true),'background:#e0b050;color:#2a1a08'),B('Huỷ',()=>done(inp?null:false))));
  ov.append(box);document.body.append(ov);if(inp){inp.focus();if(inp.select&&kind==='text')inp.select();inp.onkeydown=e=>{if(e.key==='Enter'&&kind==='text')done(inp.value);if(e.key==='Escape')done(null);};}});}
/* Đoán kích thước ô của ảnh ghép: so độ chênh pixel tại các đường biên ô với phần còn lại */
export function guessTile(url){return new Promise(res=>{const im=new Image();im.onload=()=>{try{
  const w=im.naturalWidth,h=im.naturalHeight;if(w*h>4e6){res(null);return;}const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,w,h).data;
  const cd=new Float64Array(w),rd=new Float64Array(h),ca=new Float64Array(w),ra=new Float64Array(h);
  for(let y=0;y<h;y++)for(let x=1;x<w;x++){const a=(y*w+x)*4,b=a-4;cd[x]+=Math.abs(d[a]-d[b])+Math.abs(d[a+1]-d[b+1])+Math.abs(d[a+2]-d[b+2])+Math.abs(d[a+3]-d[b+3]);if(d[a+3]>20&&d[b+3]>20)ca[x]++;}
  for(let y=1;y<h;y++)for(let x=0;x<w;x++){const a=(y*w+x)*4,b=a-w*4;rd[y]+=Math.abs(d[a]-d[b])+Math.abs(d[a+1]-d[b+1])+Math.abs(d[a+2]-d[b+2])+Math.abs(d[a+3]-d[b+3]);if(d[a+3]>20&&d[b+3]>20)ra[y]++;}
  const sc=(arr,n,s,m,inv)=>{const st=s+m;const isB=new Uint8Array(n);for(let k=1;k*st<n+m;k++){const x=k*st;if(x<n)isB[x]=1;if(m&&x-m>0&&x-m<n)isB[x-m]=1;}let bs=0,bn=0,os=0,on=0;for(let x=1;x<n;x++){if(isB[x]){bs+=arr[x];bn++;}else{os+=arr[x];on++;}}return bn&&on?(inv?(os/on+1)/(bs/bn+1):(bs/bn+1)/(os/on+1)):0;};
  let best=null;for(const m of [0,1,2])for(const s of [8,12,16,20,24,32,40,48,64,96,128]){const st=s+m;if((w+m)%st||(h+m)%st)continue;if(w<2*s&&h<2*s)continue;
    const r1=Math.min(w>=2*s?sc(cd,w,s,m):9,h>=2*s?sc(rd,h,s,m):9),r2=Math.min(w>=2*s?sc(ca,w,s,m,1):9,h>=2*s?sc(ra,h,s,m,1):9);const r=Math.max(r1,r2>1.5?r2/1.3:0)*(m?0.9:1);if(!best||r>best.r*1.02)best={tw:s,m,r,cols:(w+m)/st,rows:(h+m)/st};}
  res(best&&best.r>1.15?best:null);}catch(e){res(null);}};im.onerror=()=>res(null);im.src=url;});}
export const ask=(msg,def)=>dlg(msg,def,'text');
export const askText=(msg)=>dlg(msg,'','area');
export const yes=msg=>dlg(msg,null,'yes');
export function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
export function pickFile(accept,cb,asText=true){const i=document.createElement('input');i.type='file';i.accept=accept;i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>cb(r.result,f);asText?r.readAsText(f):r.readAsDataURL(f);};i.click();}
import {unzipSync,zipSync} from 'fflate';
import {createExtractorFromData} from 'node-unrar-js';
import unrarWasm from 'node-unrar-js/esm/js/unrar.wasm';
/* .rar: giải nén (chỉ lấy zip/png/json/glb/…); mỗi .zip bên trong thành 1 gói riêng, tệp lẻ gộp thành 1 gói. Hàm trả danh sách "tệp ảo" dùng như File */
const isRar=u8=>u8.length>7&&u8[0]===0x52&&u8[1]===0x61&&u8[2]===0x72&&u8[3]===0x21;
const vf=(name,data)=>({name,size:data.length,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)});
export async function expandPacks(files){const out=[];
  for(const f of files){const u8=new Uint8Array(await f.arrayBuffer());
    if(!isRar(u8)){out.push(f);continue;}
    toast('Đang giải nén '+f.name+' (RAR)…');
    try{const ex=await createExtractorFromData({wasmBinary:unrarWasm.buffer.slice(unrarWasm.byteOffset,unrarWasm.byteOffset+unrarWasm.byteLength),data:u8});
      const r=ex.extract({files:h=>!h.flags.directory&&/\.(zip|png|json|glb|gltf|jpe?g|webp|bin)$/i.test(h.name)&&!/(^|\/)(__MACOSX|\._)/.test(h.name)});
      const loose={};let nz=0;
      for(const e of r.files){if(!e.extraction)continue;const nm=e.fileHeader.name.replace(/\\/g,'/');
        if(/\.zip$/i.test(nm)){out.push(vf(nm.split('/').pop(),e.extraction));nz++;}else loose[nm]=e.extraction;}
      if(Object.keys(loose).length)out.push(vf(f.name.replace(/\.rar$/i,'')+'.zip',zipSync(loose,{level:0})));
    }catch(er){console.error('RARERR',er&&er.message||er);toast('Không giải nén được '+f.name+' (RAR lỗi hoặc có mật khẩu)');}}
  return out;}
export async function packBytes(f){return new Uint8Array(await f.arrayBuffer());}
const MIME={png:'image/png',webp:'image/webp',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif'};
const blobURL=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);});
/* Chọn nhiều ảnh cùng lúc → cb([{url,name,file}]) */
export function pickFiles(accept,cb,asText=false){const i=document.createElement('input');i.type='file';i.accept=accept;i.multiple=true;
  i.onchange=async()=>{const fs=[...i.files];if(!fs.length)return;const out=[];for(const f of fs)out.push(await new Promise(r=>{const rd=new FileReader();rd.onload=()=>r({url:rd.result,file:f,name:f.name});asText?rd.readAsText(f):rd.readAsDataURL(f);}));cb(out);};i.click();}
/* Chọn một hoặc nhiều gói .zip → duyệt ảnh bên trong (xem trước 1 ảnh, hoặc tích chọn nhiều/tất cả)
   onPick(dataURL, tênFile) cho 1 ảnh; onMany([{url,name}]) cho nhiều ảnh (nếu có) */
export function zipBrowser(onPick,onMany){
  const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept='.zip,.rar,application/zip,application/x-zip-compressed';
  inp.onchange=async()=>{let fs=[...inp.files];if(!fs.length)return;fs=await expandPacks(fs);if(!fs.length)return;toast('Đang đọc '+fs.length+' gói…');
    const datas=[],list=[];
    for(let z=0;z<fs.length;z++){try{const data=await packBytes(fs[z]);datas.push(data);const pre=fs.length>1?fs[z].name.replace(/\.(zip|rar)$/i,'')+'/':'';
      unzipSync(data,{filter:e=>{if(/\.(png|webp|jpe?g|gif)$/i.test(e.name)&&!/(^|\/)(__MACOSX|\._)/.test(e.name))list.push({n:pre+e.name,e:e.name,z,s:e.originalSize});return false;}});}
      catch(er){datas.push(null);toast('Không đọc được '+fs[z].name);}}
    if(!list.length){toast('Không có ảnh png/webp/jpg trong zip');return;}
    list.sort((a,b)=>a.n.localeCompare(b.n));
    const ov=el('div',{style:'position:fixed;inset:0;z-index:50;background:#0d141bf2;display:flex;flex-direction:column;padding:10px;gap:8px'});
    const q=el('input',{placeholder:'Lọc tên ảnh… ('+list.length+' ảnh)',style:'padding:10px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px'});
    const box=el('div',{style:'flex:1;overflow:auto;background:#16202b;border-radius:8px;padding:4px'});
    const pv=el('img',{style:'max-height:26vh;max-width:100%;image-rendering:pixelated;background:repeating-conic-gradient(#2a3a49 0 25%,#1c2832 0 50%) 0 0/16px 16px;display:none;margin:auto'});
    const info=el('div',{class:'hint'},'Chạm tên ảnh để xem trước. Tích ☑ để chọn nhiều ảnh (hoặc "Chọn tất cả").');
    let sel=null,url=null;const picked=new Set();
    const get=async e=>{const u8=unzipSync(datas[e.z],{filter:x=>x.name===e.e})[e.e];const ext=e.e.split('.').pop().toLowerCase();return blobURL(new Blob([u8],{type:MIME[ext]||'image/png'}));};
    let minKB=0,big=false;const kb=e=>Math.round(e.s/1024);
    const filtered=()=>{const k=q.value.toLowerCase();const r=list.filter(e=>(!k||e.n.toLowerCase().includes(k))&&e.s>=minKB*1024);return big?r.slice().sort((a,b)=>b.s-a.s):r;};
    const cnt=el('span',{class:'lbl'},'');
    const upd=()=>{cnt.textContent='Đã chọn '+picked.size+'/'+list.length+' ảnh';};
    const btnCss='padding:10px 12px';
    const use=onPick?el('button',{class:'btn',style:btnCss,onclick:()=>{if(url){ov.remove();onPick(url,sel.split('/').pop());}}},'✔ Dùng ảnh đang xem'):'';
    const many=onMany?el('button',{class:'btn',style:btnCss+';background:#2e8b57;color:#fff',onclick:async()=>{if(!picked.size){toast('Chưa tích chọn ảnh nào');return;}
      const es=list.filter(e=>picked.has(e.n));ov.remove();toast('Đang giải nén '+es.length+' ảnh…');const out=[];for(const e of es){try{out.push({url:await get(e),name:e.n.split('/').pop(),path:e.n});}catch(er){}}onMany(out);}},'✔ Dùng các ảnh đã chọn'):'';
    const cancel=el('button',{class:'btn',style:btnCss,onclick:()=>ov.remove()},'Đóng');
    function render(){box.textContent='';let n=0;for(const e of filtered()){if(++n>400){box.append(el('div',{class:'hint'},'… còn nữa, gõ thêm để lọc ("Chọn tất cả" vẫn chọn đủ mọi ảnh đang lọc)'));break;}
      const cb=el('input',{type:'checkbox',style:'width:22px;height:22px;flex:none'});cb.checked=picked.has(e.n);cb.onclick=ev=>{ev.stopPropagation();cb.checked?picked.add(e.n):picked.delete(e.n);upd();};
      box.append(el('div',{style:'display:flex;gap:8px;align-items:center;padding:8px 6px;border-bottom:1px solid #243342;font-size:13px;word-break:break-all;'+(sel===e.n?'background:#3b5b2a':''),onclick:async()=>{sel=e.n;url=null;render();
        try{url=await get(e);pv.src=url;pv.style.display='block';pv.onload=()=>{info.textContent=e.n+' — '+pv.naturalWidth+'×'+pv.naturalHeight+' px';};}catch(er){toast('Lỗi giải nén ảnh');}}},cb,el('span',{style:'flex:1'},e.n),el('span',{class:'hint',style:'margin:0;flex:none'},kb(e)+' KB')));}}
    q.oninput=render;render();upd();
    const fb=(l,f)=>el('button',{class:'btn',style:btnCss,onclick:()=>{f();render();upd();}},l);
    const bar0=el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center'},el('span',{class:'lbl'},'Lọc theo dung lượng:'),fb('Tất cả',()=>{minKB=0;}),fb('≥ 20 KB',()=>{minKB=20;}),fb('≥ 100 KB',()=>{minKB=100;}),fb('≥ 300 KB',()=>{minKB=300;}),fb('⇅ Lớn nhất trước',()=>{big=!big;}));
    const bar=onMany?el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center'},el('button',{class:'btn',style:btnCss,onclick:()=>{filtered().forEach(e=>picked.add(e.n));render();upd();}},'☑ Chọn tất cả'+'(đang lọc)'),el('button',{class:'btn',style:btnCss,onclick:()=>{picked.clear();render();upd();}},'☐ Bỏ chọn'),el('button',{class:'btn',style:btnCss,onclick:()=>{for(const e of filtered())if(/(^|\/)layers\/|-cover\.|-base\./i.test(e.n))picked.delete(e.n);render();upd();}},'✂ Bỏ ảnh tách lớp (layers/cover)'),cnt):'';
    ov.append(q,bar0,bar,box,pv,info,el('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},many,use,cancel));document.body.append(ov);};
  inp.click();}

/* Dự án đặt tên (lưu nhiều bản trong trình duyệt) */
export function slotsUI(kind,getData,setData,defName){
  const K='thk_slots_'+kind;const wrap=el('div',{class:'slots',style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'});
  const inp=el('input',{value:defName,style:'flex:1;min-width:0;padding:9px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px'});
  const list=el('div',{});
  const rd=()=>lsGet(K,{});
  function paint(){list.textContent='';const o=rd(),ks=Object.keys(o).sort((a,b)=>o[b].t-o[a].t);
    if(!ks.length)list.append(el('div',{class:'hint'},'Chưa có dự án nào được lưu.'));
    for(const k of ks){list.append(el('div',{style:'display:flex;gap:6px;align-items:center;padding:6px 0;border-top:1px solid #243342'},
      el('div',{style:'flex:1;min-width:0;word-break:break-all'},k,el('div',{class:'hint',style:'margin:0'},new Date(o[k].t).toLocaleString('vi-VN'))),
      el('button',{class:'btn',onclick:async()=>{if(await yes('Mở "'+k+'"? Bản đang làm sẽ bị thay (có thể hoàn tác).')){setData(o[k].d);toast('Đã mở '+k);}}},'Mở'),
      el('button',{class:'btn',onclick:async()=>{if(await yes('Xóa "'+k+'"?')){const x=rd();delete x[k];lsSet(K,x);paint();}}},'🗑')));}}
  const save=el('button',{class:'btn',onclick:async()=>{const n=inp.value.trim().slice(0,40);if(!n)return toast('Nhập tên dự án');const x=rd();if(x[n]&&!(await yes('Đã có "'+n+'". Ghi đè?')))return;x[n]={t:Date.now(),d:getData()};
    if(!lsSet(K,x)){toast('Bộ nhớ trình duyệt đầy — hãy xóa bớt hoặc xuất file .json');return;}toast('Đã lưu '+n);paint();}},'💾 Lưu');
  wrap.append(el('div',{class:'lbl',style:'margin-bottom:4px'},'📁 Dự án đã lưu'),el('div',{style:'display:flex;gap:6px'},inp,save),list);paint();return wrap;}

export const SELF={css:'',skel:'',js:''};
export function gameHTML(data,title,x){x=x||{};
  const j=JSON.stringify(data).replace(/</g,'\\u003c'),t=String(title).replace(/[<>&"]/g,'');
  return '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><title>'+t+'</title>'+(x.head||'')+'<style>'+SELF.css+'</style><script>window.__GAME='+j+';</script></head><body>'+SELF.skel+'<script>'+SELF.js+'</script>'+(x.tail||'')+'</body></html>';}
export function exportGame(data,title){
  if(!SELF.js)return toast('Không xuất được game từ môi trường này');
  return saveFile('game_'+(data.kind||'x')+'.html',new Blob([gameHTML(data,title)],{type:'text/html'}));}
