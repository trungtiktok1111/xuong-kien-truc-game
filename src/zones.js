// Vùng chặn hình học (không phụ thuộc ảnh). Toạ độ liên tục trong "ô" (ô i chiếm [i,i+1)).
// Zone: {id,k:'rect'|'ell'|'tri'|'poly'|'line', x,y,w,h,rot(độ) | pts:[[x,y]..], th, closed}
export const ZK={rect:['▭','Chữ nhật'],ell:['⬭','Elip / tròn'],tri:['△','Tam giác'],poly:['⬠','Đa giác (chấm điểm)'],line:['⟋','Đường gấp khúc (tường)']};
const D2R=Math.PI/180;
export const isBox=z=>z.k==='rect'||z.k==='ell'||z.k==='tri';
export const isPts=z=>z.k==='poly'||z.k==='line';
export const zid=()=>'z'+Math.random().toString(36).slice(2,8);
export function mkBox(k,x,y,w,h){return {id:zid(),k,x,y,w,h,rot:0};}
export function mkPts(k,pts){return {id:zid(),k,pts:pts.map(p=>[p[0],p[1]]),th:k==='line'?.6:0,closed:false};}
export const zc=z=>[z.x+z.w/2,z.y+z.h/2];
export function toLocal(z,px,py){const [cx,cy]=zc(z),a=-(z.rot||0)*D2R,dx=px-cx,dy=py-cy;return [dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a)];}
export function fromLocal(z,lx,ly){const [cx,cy]=zc(z),a=(z.rot||0)*D2R;return [cx+lx*Math.cos(a)-ly*Math.sin(a),cy+lx*Math.sin(a)+ly*Math.cos(a)];}
// đa giác thế giới (rect/tri/ell xấp xỉ/poly)
export function zPts(z,n=28){
  if(z.k==='rect'){const hx=z.w/2,hy=z.h/2;return [[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]].map(p=>fromLocal(z,p[0],p[1]));}
  if(z.k==='tri'){const hx=z.w/2,hy=z.h/2;return [[0,-hy],[hx,hy],[-hx,hy]].map(p=>fromLocal(z,p[0],p[1]));}
  if(z.k==='ell'){const a=[];for(let i=0;i<n;i++){const t=i/n*Math.PI*2;a.push(fromLocal(z,Math.cos(t)*z.w/2,Math.sin(t)*z.h/2));}return a;}
  return z.pts||[];}
function dseg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));const qx=ax+t*dx-px,qy=ay+t*dy-py;return Math.hypot(qx,qy);}
function inPoly(P,px,py){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>py)!==(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
// vòng tròn tâm (x,y) bán kính r có chạm vùng không
export function zHit(z,x,y,r=0){
  if(z.k==='rect'){const [lx,ly]=toLocal(z,x,y),qx=Math.max(Math.abs(lx)-z.w/2,0),qy=Math.max(Math.abs(ly)-z.h/2,0);return qx*qx+qy*qy<r*r||(qx===0&&qy===0);}
  if(z.k==='ell'){const [lx,ly]=toLocal(z,x,y),a=z.w/2+r,b=z.h/2+r;return (lx*lx)/(a*a)+(ly*ly)/(b*b)<1;}
  if(z.k==='tri'){const P=zPts(z);if(inPoly(P,x,y))return true;for(let i=0;i<3;i++){const a=P[i],b=P[(i+1)%3];if(dseg(x,y,a[0],a[1],b[0],b[1])<r)return true;}return false;}
  const P=z.pts||[];
  if(z.k==='poly'){if(P.length<3)return false;if(inPoly(P,x,y))return true;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];if(dseg(x,y,a[0],a[1],b[0],b[1])<r)return true;}return false;}
  if(z.k==='line'){if(P.length<2)return false;const R=(z.th||.6)/2+r,n=z.closed?P.length:P.length-1;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%P.length];if(dseg(x,y,a[0],a[1],b[0],b[1])<R)return true;}return false;}
  return false;}
export function zonesHit(zs,x,y,r=0){if(!zs)return false;for(let i=0;i<zs.length;i++)if(zHit(zs[i],x,y,r))return true;return false;}
// ô bị chặn do vùng (≥5/9 mẫu nằm trong vùng) -> dùng cho tìm đường / kiểm tra
export function zRaster(zs,W,H){const out=new Uint8Array(W*H);if(!zs||!zs.length)return out;
  for(const z of zs){const b=zBounds(z);const x0=Math.max(0,Math.floor(b[0]-1)),x1=Math.min(W-1,Math.ceil(b[2])),y0=Math.max(0,Math.floor(b[1]-1)),y1=Math.min(H-1,Math.ceil(b[3]));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let n=0;for(let j=0;j<3;j++)for(let i=0;i<3;i++)if(zHit(z,x+(i+.5)/3,y+(j+.5)/3,0))n++;if(n>=5)out[y*W+x]=1;}}
  return out;}
export function zBounds(z){let P;if(isBox(z)){P=zPts(z);}else P=z.pts||[];if(!P.length)return [0,0,0,0];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}const t=z.k==='line'?(z.th||.6)/2:0;return [x0-t,y0-t,x1+t,y1+t];}
export function zCenter(z){if(isBox(z))return zc(z);const b=zBounds(z);return [(b[0]+b[2])/2,(b[1]+b[3])/2];}
export function zMove(z,dx,dy){if(isBox(z)){z.x+=dx;z.y+=dy;}else z.pts=z.pts.map(p=>[p[0]+dx,p[1]+dy]);}
export function zScale(z,k,cx,cy){
  if(cx==null){[cx,cy]=zCenter(z);}
  if(isBox(z)){const [ox,oy]=zc(z),nx=cx+(ox-cx)*k,ny=cy+(oy-cy)*k;z.w=Math.max(.25,z.w*k);z.h=Math.max(.25,z.h*k);z.x=nx-z.w/2;z.y=ny-z.h/2;}
  else{z.pts=z.pts.map(p=>[cx+(p[0]-cx)*k,cy+(p[1]-cy)*k]);if(z.k==='line')z.th=Math.max(.1,(z.th||.6)*k);}}
export function zRotate(z,deg){if(isBox(z)){z.rot=(((z.rot||0)+deg)%360+360)%360;}else{const [cx,cy]=zCenter(z),a=deg*D2R,c=Math.cos(a),s=Math.sin(a);z.pts=z.pts.map(p=>{const dx=p[0]-cx,dy=p[1]-cy;return [cx+dx*c-dy*s,cy+dx*s+dy*c];});}}
export const zClone=z=>JSON.parse(JSON.stringify(Object.assign({},z,{id:zid()})));
// tay nắm (8 + xoay) cho khối; đỉnh + điểm giữa cho đa giác/đường
export const HSX=[-1,0,1,-1,1,-1,0,1],HSY=[-1,-1,-1,0,0,1,1,1];
export function zHandles(z,rotOff=1){
  if(isBox(z)){const hx=z.w/2,hy=z.h/2,a=[];for(let i=0;i<8;i++){const p=fromLocal(z,HSX[i]*hx,HSY[i]*hy);a.push({t:'h',i,x:p[0],y:p[1]});}const r=fromLocal(z,0,-hy-rotOff);a.push({t:'rot',x:r[0],y:r[1]});return a;}
  const a=[],P=z.pts,n=z.k==='poly'||z.closed?P.length:P.length-1;P.forEach((p,i)=>a.push({t:'v',i,x:p[0],y:p[1]}));
  for(let i=0;i<n;i++){const q=P[(i+1)%P.length];a.push({t:'m',i,x:(P[i][0]+q[0])/2,y:(P[i][1]+q[1])/2});}return a;}
// kéo tay nắm khối i tới (px,py) (toạ độ thế giới), dựa trên bản gốc z0
export function zDragHandle(z,z0,i,px,py,keepAsp){
  const [lx,ly]=toLocal(z0,px,py),sx=HSX[i],sy=HSY[i],hx=z0.w/2,hy=z0.h/2;let w=z0.w,h=z0.h,ccx=0,ccy=0;
  if(sx!==0){const ax=-sx*hx;w=Math.max(.25,sx*(lx-ax));ccx=ax+sx*w/2;}
  if(sy!==0){const ay=-sy*hy;h=Math.max(.25,sy*(ly-ay));ccy=ay+sy*h/2;}
  if(keepAsp&&sx!==0&&sy!==0){const k=Math.max(w/z0.w,h/z0.h);w=z0.w*k;h=z0.h*k;ccx=-sx*hx+sx*w/2;ccy=-sy*hy+sy*h/2;}
  const [wx,wy]=fromLocal(z0,ccx,ccy);z.w=w;z.h=h;z.x=wx-w/2;z.y=wy-h/2;z.rot=z0.rot||0;}
// đưa zone về dạng "đa giác" để vẽ canvas
export function zPath(ctx,z,T){
  if(z.k==='ell'){const P=zPts(z,48);ctx.beginPath();P.forEach((p,i)=>{const q=T(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();return;}
  const P=zPts(z);ctx.beginPath();P.forEach((p,i)=>{const q=T(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});if(z.k!=='line'||z.closed)ctx.closePath();}

// vùng chặn tự suy ra từ chân (nền) của từng vật cảnh: e.zb=[dx,dy,w,h] so với góc trước (x+1,y+1)
export function decoZones(ents){const out=[];for(const e of ents||[]){if(e.t!=='deco'||!e.zb||e.walk)continue;if(e.zps&&e.zps.length){e.zps.forEach((P,i)=>out.push({id:'dz'+e.id+'_'+i,k:'poly',pts:P.map(q=>[e.x+1+q[0],e.y+1+q[1]]),th:0,closed:true,deco:e.id}));continue;}if(e.zp&&e.zp.length>2){out.push({id:'dz'+e.id,k:'poly',pts:e.zp.map(q=>[e.x+1+q[0],e.y+1+q[1]]),th:0,closed:true,deco:e.id});continue;}const X=e.x+1+e.zb[0],Y=e.y+1+e.zb[1];out.push({id:'dz'+e.id,k:'rect',x:X,y:Y,w:e.zb[2],h:e.zb[3],rot:0,deco:e.id});}return out;}
