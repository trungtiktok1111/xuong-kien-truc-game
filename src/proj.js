/* Phép chiếu thứ hai "Angle" (xiên mặt trước): ô sàn hiện gần chữ nhật 256 × 181 (tỉ lệ sin45°) thay vì hình thoi.
   Bộ ảnh Angle nằm file riêng `<vat|nen>/<id>.angle.json`, cùng chỉ số mảnh với bản Isometric nên cảnh đổi chiếu được ngay. */
export const ANG_R=181/256;
const AC={};
export async function angleOf(sheetName){
  const m=/^(Vat|Nen)-(.+)$/.exec(sheetName||'');if(!m)return null;const kind=m[1]==='Vat'?'vat':'nen',id=m[2],k=kind+'/'+id;
  if(k in AC)return AC[k];
  try{const r=await fetch(k+'.angle.json?v=1');if(!r.ok){AC[k]=null;return null;}const j=await r.json();
    const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=j.atlas;});
    delete j.atlas;j.img=img;AC[k]=j;return j;}catch(e){AC[k]=null;return null;}}
/* nạp bộ Angle cho mọi sheet (không đưa vào dữ liệu lưu: thuộc tính không liệt kê) */
export async function ensureAngle(sheets){let miss=[];
  for(let i=0;i<sheets.length;i++){const s=sheets[i];if(!s||s.A!==undefined)continue;const a=await angleOf(s.name);Object.defineProperty(s,'A',{value:a,writable:true,enumerable:false,configurable:true});if(!a&&/^(Vat|Nen)-/.test(s.name))miss.push(s.name);}
  return miss;}
/* vật thể: thông số vẽ trong Angle (ảnh, cỡ ô, tỉ lệ, độ lệch đứng) quy đổi từ thông số isometric của thực thể */
export function sprOf(e,sh,ang){
  if(!sh)return null;
  if(!ang)return {img:sh.img,tw:sh.tw,cols:sh.cols,margin:sh.margin||0,sc:e.sc,oy:e.oy||0};
  const A=sh.A;if(!A)return sh.img&&!sh.iso?{img:sh.img,tw:sh.tw,cols:sh.cols,margin:sh.margin||0,sc:e.sc,oy:e.oy||0}:null;
  return {img:A.img,tw:A.tw,cols:A.cols,margin:0,sc:A.sc,oy:((e.oy||0)*sh.tw+A.dA-A.dI)/A.tw};}
/* ô sàn Angle: (X,Y) = góc trái-trên của mặt trên ô; cw = bề rộng ô trên màn hình */
export function tileAng(cx,A,idx,X,Y,cw){if(!A||!A.img)return;const k=cw/A.tw,sx=(idx%A.cols)*A.tw,sy=Math.floor(idx/A.cols)*A.th;
  cx.drawImage(A.img,sx,sy,A.tw,A.th,X,Y-A.cy*k,A.tw*k,A.th*k);}
/* độ sâu vẽ của vật thể trong Angle: mép trước của khung chân (xa camera = nhỏ) */
export const depthAng=d=>{const z=d.zb;return d.y+1+(z&&(z[2]||z[3])?z[1]+z[3]:0);};
