/* Nền mượt: hòa trộn mép giữa hai loại ô, xoay/lật ngẫu nhiên ô trong vùng đồng nhất, đốm sáng tối lớn.
   Dùng chung cho trình soạn và bản chơi. Chỉ tác động lên ô phẳng (không phải ô iso). */
const hash=n=>{n=Math.imul(n^(n>>>15),2246822519);n=Math.imul(n^(n>>>13),3266489917);return((n^(n>>>16))>>>0)/4294967296;};
const base=v=>(v-1)>>3;
/* a: mảng lớp nền; paint(g,v,dx,dy,s): vẽ 1 ô; ok(v): ô có vẽ vào ảnh nền không */
export function bakeLayer0(g,o){const {W,H,Q,a,paint,ok,smooth}=o;
  const D=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let i=0;i<a.length;i++){let v=a[i];if(!v||!ok(v))continue;const x=i%W,y=(i/W)|0;
    if(smooth&&!((v-1)&7)){let same=true;for(const [dx,dy] of D){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H||a[ny*W+nx]!==v){same=false;break;}}
      if(same)v+=(hash(i*7+3)*8)|0;}
    paint(g,v,x*Q,y*Q,Q);}
  if(!smooth)return;
  const tc=document.createElement('canvas');tc.width=tc.height=Q;const t=tc.getContext('2d');t.imageSmoothingEnabled=g.imageSmoothingEnabled;
  const F=.4,AV=new Map(),ac=document.createElement('canvas');ac.width=ac.height=6;const ax=ac.getContext('2d',{willReadFrequently:true});
  const avg=v=>{const k=base(v);let r=AV.get(k);if(r)return r;ax.clearRect(0,0,6,6);paint(ax,v,0,0,6);const d=ax.getImageData(1,1,4,4).data;let R=0,G=0,B=0,n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>128){R+=d[i];G+=d[i+1];B+=d[i+2];n++;}r=n?[R/n,G/n,B/n]:[0,0,0];AV.set(k,r);return r;};
  const far=(u,w)=>{const p=avg(u),q=avg(w);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])>38;};
  for(let i=0;i<a.length;i++){const v=a[i];if(!v||!ok(v))continue;const x=i%W,y=(i/W)|0;
    for(let k=0;k<4;k++){const nx=x+D[k][0],ny=y+D[k][1];if(nx<0||ny<0||nx>=W||ny>=H)continue;const nv=a[ny*W+nx];if(!nv||!ok(nv)||base(nv)===base(v)||!far(v,nv))continue;
      t.globalCompositeOperation='source-over';t.clearRect(0,0,Q,Q);paint(t,nv,0,0,Q);
      const w=Q*(F+(hash(i*13+k)-.5)*.14);let gr;
      if(k===0)gr=t.createLinearGradient(Q-w,0,Q,0);else if(k===1)gr=t.createLinearGradient(w,0,0,0);else if(k===2)gr=t.createLinearGradient(0,Q-w,0,Q);else gr=t.createLinearGradient(0,w,0,0);
      gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.6)');
      t.globalCompositeOperation='destination-in';t.fillStyle=gr;t.fillRect(0,0,Q,Q);
      g.drawImage(tc,x*Q,y*Q);}}}
/* đốm sáng/tối rất mềm trải trên toàn bản đồ, chỉ đè lên chỗ đã có nền */
export function noiseOverlay(g,W,H,Q){
  const lay=(cell,amp,seed)=>{const nw=Math.ceil(W/cell)+2,nh=Math.ceil(H/cell)+2,c=document.createElement('canvas');c.width=nw;c.height=nh;const n=c.getContext('2d'),im=n.createImageData(nw,nh);
    for(let j=0;j<nh;j++)for(let i=0;i<nw;i++){const r=hash(i*92821+j*68917+seed)*2-1,p=(j*nw+i)*4,l=r>0?255:0;im.data[p]=im.data[p+1]=im.data[p+2]=l;im.data[p+3]=Math.abs(r)*amp*255;}
    n.putImageData(im,0,0);
    g.save();g.globalCompositeOperation='source-atop';g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c,0,0,nw,nh,-cell*Q*.5,-cell*Q*.5,nw*cell*Q,nh*cell*Q);g.restore();};
  lay(6,.13,11);lay(2.2,.07,29);}

/* ô nền iso 2 (kim cương tw×tw/2, đỉnh ở y=cy0 trong ô atlas) → ô vuông Q×Q của ảnh nền; f&1/f&2 = lật theo u/v */
export function paintSlab(g,img,sx,sy,tw,cy0,dx,dy,Q,f){
  const a=Q/tw,c=2*Q/tw,b=-Q/tw,d=2*Q/tw,ox=sx+tw/2,oy=sy+cy0;
  let A=a,B=b,C=c,D=d,E=-(a*ox+c*oy),F=-(b*ox+d*oy);
  if(f&1){A=-A;C=-C;E=Q-E;}if(f&2){B=-B;D=-D;F=Q-F;}
  const k=(Q+2)/Q;g.save();g.beginPath();g.rect(dx-1,dy-1,Q+2,Q+2);g.clip();g.translate(dx+Q/2,dy+Q/2);g.scale(k,k);g.translate(-Q/2,-Q/2);g.transform(A,B,C,D,E,F);g.drawImage(img,sx,sy,tw,tw,sx,sy,tw,tw);g.restore();}

/* sương: mây mờ liền mạch trôi chậm, vẽ phủ lên tất cả (tiền cảnh) */
let FOGC=null;
function fogTex(){if(FOGC)return FOGC;const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),im=g.createImageData(N,N);
  const oct=(n,seed)=>{const G=[];for(let j=0;j<n;j++){G.push([]);for(let i=0;i<n;i++)G[j].push(hash(i*374761+j*668265+seed+n*7));}
    return (x,y)=>{const fx=x/N*n,fy=y/N*n,i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),a=G[j%n][i%n],b=G[j%n][(i+1)%n],c2=G[(j+1)%n][i%n],d=G[(j+1)%n][(i+1)%n];return a+(b-a)*sx+(c2-a)*sy+(a-b-c2+d)*sx*sy;};};
  const o1=oct(4,1),o2=oct(8,2),o3=oct(16,3);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=o1(x,y)*.55+o2(x,y)*.3+o3(x,y)*.15,a=Math.max(0,Math.min(1,(v-.38)*2.2)),p=(y*N+x)*4;im.data[p]=226;im.data[p+1]=234;im.data[p+2]=238;im.data[p+3]=a*255;}
  g.putImageData(im,0,0);return FOGC=c;}
/* lv 1..3; (cxp,cyp) vị trí camera để tạo thị sai; t giây */
export function drawFog(cx,w,h,lv,t,cxp,cyp){if(!lv)return;const T=fogTex(),A=[0,.3,.48,.68][lv]||.3,sz=Math.max(w,h)*.9;
  cx.save();cx.imageSmoothingEnabled=true;
  const pass=(sc,sp,par,al)=>{const s=Math.round(sz*sc),ox=Math.round((((t*sp+cxp*par)%s)+s)%s),oy=Math.round((((t*sp*.4+cyp*par)%s)+s)%s);cx.globalAlpha=A*al;
    for(let y=-s+oy;y<h;y+=s)for(let x=-s+ox;x<w;x+=s)cx.drawImage(T,x,y,s,s);};
  pass(1.0,14,.35,1);pass(.62,-9,.6,.7);
  const gr=cx.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.75);gr.addColorStop(0,'rgba(220,230,235,0)');gr.addColorStop(1,'rgba(220,230,235,'+(A*.35)+')');cx.globalAlpha=1;cx.fillStyle=gr;cx.fillRect(0,0,w,h);
  cx.restore();}
