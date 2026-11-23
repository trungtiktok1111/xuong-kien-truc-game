/* vision.js — nhận dạng ảnh mẫu isometric (thuần mã, không gọi Claude):
   hiệu chuẩn lưới ô 192x96 → khớp từng ô NỀN với ô nền đã nạp → khớp VẬT THỂ (kèm mái che) với bộ vật thể đã nạp
   → vùng còn lại không giải thích được = "thiếu tài nguyên" (kèm ảnh cắt, màu, cỡ).
   Giả định: ảnh mẫu dựng từ chính các tài nguyên của app (cùng nét vẽ, có thể phóng/thu), nên khớp bằng màu điểm ảnh. */
const SG=6;                       /* lưới lấy mẫu trong mỗi ô nền: SG x SG điểm */
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;};
let _yt=0;const ytick=()=>performance.now()-_yt>60?(_yt=performance.now(),new Promise(r=>setTimeout(r,0))):null;
const l1=(d,i,r,g,b)=>Math.abs(d[i]-r)+Math.abs(d[i+1]-g)+Math.abs(d[i+2]-b);
let BG=null;   /* màu nền ngoài bản đồ, lấy từ 4 góc ảnh nếu giống nhau */
const isBg=(d,i)=>d[i+3]<24||(BG?Math.abs(d[i]-BG[0])+Math.abs(d[i+1]-BG[1])+Math.abs(d[i+2]-BG[2])<=14:(d[i]+d[i+1]+d[i+2]<42));
const lo=(d,i,r,g,b)=>isBg(d,i)?999:Math.abs(d[i]-r)+Math.abs(d[i+1]-g)+Math.abs(d[i+2]-b);   /* trong suốt hoặc nền tối ngoài bản đồ */

export function readRef(src,maxSide=2200){
  const w0=src.naturalWidth||src.width,h0=src.naturalHeight||src.height,k=Math.min(1,maxSide/Math.max(w0,h0));
  const c=mk(w0*k,h0*k),g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;g.drawImage(src,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height,cs=[0,(W-1)*4,(H-1)*W*4,((H-1)*W+W-1)*4].map(p=>[d[p],d[p+1],d[p+2]]);
  BG=cs.every(q=>Math.abs(q[0]-cs[0][0])+Math.abs(q[1]-cs[0][1])+Math.abs(q[2]-cs[0][2])<=10)&&cs[0][0]+cs[0][1]+cs[0][2]<150?cs[0]:null;
  return {w:W,h:H,d,k,canvas:c};}

/* ---------- ô nền: mẫu màu theo tỉ lệ z ---------- */
/* lib.ground = [{img,tw,cy,tiles:[{sid,idx,sx,sy,wat,name}]}] ; z = chiều rộng ô trong ảnh / 192 */
const MIPC=new Map();   /* bộ nhớ đệm atlas thu nhỏ theo bậc (dùng khi dò lưới cho nhanh) */
function scaled(sh,z,exact){
  let s=Math.min(1,z);if(!exact){const lv=Math.max(0,Math.ceil(Math.log(1/z)/Math.log(Math.SQRT2)-1e-6));s=Math.pow(Math.SQRT1_2,Math.min(lv,10));if(s<Math.min(1,z))s=Math.min(1,z);}
  const key=Math.round(s*1000);let m=MIPC.get(sh.img);if(!m){m=new Map();MIPC.set(sh.img,m);}
  if(!m.has(key)){const c=mk(sh.img.width*s,sh.img.height*s),g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;g.drawImage(sh.img,0,0,c.width,c.height);m.set(key,{c,id:g.getImageData(0,0,c.width,c.height).data});if(exact&&m.size>6)m.delete(m.keys().next().value);}
  return m.get(key);}
function groundTpl(lib,z,exact){
  const out=[];const flips=[[0,0],[1,0],[0,1],[1,1]];
  for(const sh of lib.ground){
    if(!sh.img||!sh.img.width)continue;
    const S=scaled(sh,z,exact),c=S.c;
    const kx=c.width/sh.img.width,ky=c.height/sh.img.height,id=S.id,W=c.width;
    for(const t of sh.tiles){
      const vars=[];
      for(let f=0;f<(t.wat?4:1);f++){
        const [su,sv]=flips[f],s=new Uint8Array(SG*SG*3);let ok=true,m0=0,m1=0,m2=0;
        for(let i=0;i<SG;i++)for(let j=0;j<SG;j++){let a=(i+.5)/SG,b=(j+.5)/SG;if(su)a=1-a;if(sv)b=1-b;
          const x=Math.min(c.width-1,Math.max(0,Math.round((t.sx+sh.tw/2+(a-b)*96)*kx))),y=Math.min(c.height-1,Math.max(0,Math.round((t.sy+sh.cy+(a+b)*48)*ky))),p=(y*W+x)*4;
          if(id[p+3]<160){ok=false;break;}const q=(i*SG+j)*3;s[q]=id[p];s[q+1]=id[p+1];s[q+2]=id[p+2];m0+=id[p];m1+=id[p+1];m2+=id[p+2];}
        if(!ok){vars.push(null);continue;}const n=SG*SG;vars.push({s,m:[m0/n,m1/n,m2/n]});}
      if(vars[0])out.push({sid:t.sid,idx:t.idx,name:t.name,wat:!!t.wat,vars,sh});}}
  return out;}

/* ---------- lưới ---------- */
/* ô (x,y): đỉnh trên tại (ox+(x-y)D, oy+(x+y)D/2), D=96z ; neo vật thể = đỉnh dưới = đỉnh trên của ô (x+1,y+1) */
function cellList(ref,z,ox,oy,margin=0){
  const D=96*z,out=[];
  const smin=Math.floor((-oy-D*2)/(D/2)),smax=Math.ceil((ref.h-oy+D)/(D/2)),dmin=Math.floor((-ox-D*2)/D),dmax=Math.ceil((ref.w-ox+D*2)/D);
  for(let s=smin;s<=smax;s++)for(let d=dmin;d<=dmax;d++){if(((s^d)&1))continue;const x=(s+d)/2,y=(s-d)/2;
    const tx=ox+d*D,ty=oy+s*D/2,cx=tx,cy=ty+D/2;
    if(cx<-margin*D||cx>ref.w+margin*D||cy<-margin*D/2||cy>ref.h+margin*D/2)continue;
    out.push({x,y,tx,ty,cx,cy});}
  return out;}

function cellSamples(ref,c,D,claimed){
  const s=new Int16Array(SG*SG*3),v=new Uint8Array(SG*SG);let nv=0;
  for(let i=0;i<SG;i++)for(let j=0;j<SG;j++){const a=(i+.5)/SG,b=(j+.5)/SG,x=Math.round(c.tx+(a-b)*D),y=Math.round(c.ty+(a+b)*D/2),k=i*SG+j;
    if(x<0||y<0||x>=ref.w||y>=ref.h)continue;const p=(y*ref.w+x)*4;if(isBg(ref.d,p))continue;if(claimed&&claimed[y*ref.w+x])continue;
    s[k*3]=ref.d[p];s[k*3+1]=ref.d[p+1];s[k*3+2]=ref.d[p+2];v[k]=1;nv++;}
  return {s,v,nv};}

/* khoảng cách "cắt đuôi": trung bình 70% mẫu gần nhất (chịu được che khuất một phần) */
function trimmed(cs,tv,buf){
  let n=0;for(let k=0;k<SG*SG;k++){if(!cs.v[k])continue;const q=k*3;buf[n++]=Math.abs(cs.s[q]-tv.s[q])+Math.abs(cs.s[q+1]-tv.s[q+1])+Math.abs(cs.s[q+2]-tv.s[q+2]);}
  if(n<6)return 1e9;const a=buf.subarray(0,n);a.sort();const m=Math.max(4,Math.floor(n*.7));let t=0;for(let k=0;k<m;k++)t+=a[k];return t/m;}

function bestTile(cs,GT,parity,bias,topN=14){
  if(cs.nv<8)return null;let m0=0,m1=0,m2=0;for(let k=0;k<SG*SG;k++)if(cs.v[k]){m0+=cs.s[k*3];m1+=cs.s[k*3+1];m2+=cs.s[k*3+2];}m0/=cs.nv;m1/=cs.nv;m2/=cs.nv;
  const cand=[];for(let i=0;i<GT.length;i++){const t=GT[i],v=t.vars[t.wat?parity:0]||t.vars[0];if(!v)continue;cand.push([Math.abs(v.m[0]-m0)+Math.abs(v.m[1]-m1)+Math.abs(v.m[2]-m2),i,v]);}
  cand.sort((a,b)=>a[0]-b[0]);const buf=new Float32Array(SG*SG);let best=null;
  for(let q=0;q<Math.min(topN,cand.length);q++){const [,i,v]=cand[q];let d=trimmed(cs,v,buf);if(bias&&bias.has(GT[i].sh))d-=bias.get(GT[i].sh);if(!best||d<best.d)best={d,t:GT[i],v};}
  return best;}

/* ---------- chấm điểm lưới (tự dò) ---------- */
function gridScore(ref,GT,z,ox,oy,maxCells=30){
  const D=96*z,all=cellList(ref,z,ox,oy,-.6);if(all.length<6)return 1e9;
  const step=Math.max(1,Math.floor(all.length/maxCells));let tot=0,n=0;
  for(let i=0;i<all.length;i+=step){const cs=cellSamples(ref,all[i],D,null);const b=bestTile(cs,GT,0,null,8);if(b){tot+=Math.min(b.d,120);n++;}}
  return n<4?1e9:tot/n;}

export async function autoCal(ref,lib,opt={},progress=()=>{}){
  const res=[];const zs=[];const z0=opt.zmin||.08,z1=opt.zmax||2.5;for(let z=z0;z<=z1;z*=1.07)zs.push(z);
  for(let zi=0;zi<zs.length;zi++){{const y=ytick();if(y)await y;}const z=zs[zi],GT=groundTpl(lib,z),D=96*z;let best={s:1e9};
    for(let a=0;a<8;a++)for(let b=0;b<4;b++){const ox=a*D/4,oy=b*D/4,s=gridScore(ref,GT,z,ox,oy,18);if(s<best.s)best={s,z,ox,oy};}
    res.push(best);progress((zi+1)/zs.length*.7,'dò độ phóng '+z.toFixed(2));}
  res.sort((p,q)=>p.s-q.s);const top=[];for(const r of res){if(top.every(t=>Math.abs(Math.log(t.z/r.z))>.1))top.push(r);if(top.length>=4)break;}
  let fin=null;
  for(let ti=0;ti<top.length;ti++){const t=top[ti];progress(.7+ti/top.length*.3,'căn lưới theo vật thể (ứng viên '+(ti+1)+'/'+top.length+')');
    const r=await register(ref,lib,t,{K:260,wide:1});const sc=r.matches;if(!fin||sc>fin.matches)fin={...r.cal,matches:sc,s:t.s};}
  if(fin&&fin.matches>=3)return fin;
  return top[0]?{z:top[0].z,ox:top[0].ox,oy:top[0].oy,s:top[0].s,matches:0}:null;}

/* tinh chỉnh quanh lưới người dùng đã chỉnh tay */
export async function refineCal(ref,lib,cal){
  const r=await register(ref,lib,cal,{wide:1});if(r.matches>=3)return {...r.cal,s:0,matches:r.matches};
  let best={s:1e9,...cal};
  for(const zf of [.97,.985,1,1.015,1.03]){const z=cal.z*zf,GT=groundTpl(lib,z),D=96*z;
    for(let a=-6;a<=6;a++)for(let b=-6;b<=6;b++){const ox=cal.ox*zf+a*D/24,oy=cal.oy*zf+b*D/24,s=gridScore(ref,GT,z,ox,oy,40);if(s<best.s)best={s,z,ox,oy};}}
  return best;}

/* ảnh tích phân để lấy màu trung bình một khung trong O(1) — lọc nhanh các cặp (ô, mẫu) không thể khớp */
function integral(ref){if(ref.ii)return ref.ii;const w=ref.w,h=ref.h,I=new Float64Array((w+1)*(h+1)*3);
  for(let y=0;y<h;y++){let r=0,g=0,b=0;for(let x=0;x<w;x++){const p=(y*w+x)*4,o=((y+1)*(w+1)+x+1)*3,u=(y*(w+1)+x+1)*3;r+=ref.d[p];g+=ref.d[p+1];b+=ref.d[p+2];I[o]=I[u]+r;I[o+1]=I[u+1]+g;I[o+2]=I[u+2]+b;}}
  return ref.ii=I;}
function boxMean(I,W,x0,y0,x1,y1,c){return (I[(y1*W+x1)*3+c]-I[(y0*W+x1)*3+c]-I[(y1*W+x0)*3+c]+I[(y0*W+x0)*3+c])/((x1-x0)*(y1-y0));}
function gate(ref,t,ax,ay,lim){if(!t.inner)return true;const I=integral(ref),W=ref.w+1,i=t.inner;
  const cl=(x,w)=>Math.max(0,Math.min(w,x));
  if(i.quad){let s=0;const bx=[[i.x0,i.mx,0],[i.mx,i.x1,1],[i.x0,i.mx,2],[i.mx,i.x1,3]];
    for(let q=0;q<4;q++){const x0=cl(ax+(q&1?i.mx:i.x0),ref.w),x1=cl(ax+(q&1?i.x1:i.mx),ref.w),y0=cl(ay+(q&2?i.my:i.y0),ref.h),y1=cl(ay+(q&2?i.y1:i.my),ref.h);
      if(x1-x0<2||y1-y0<2)return false;for(let c=0;c<3;c++)s+=Math.abs(boxMean(I,W,x0,y0,x1,y1,c)-i.quad[q][c]);}
    return s/4<=lim;}
  const x0=cl(ax+i.x0,ref.w),x1=cl(ax+i.x1,ref.w),y0=cl(ay+i.y0,ref.h),y1=cl(ay+i.y1,ref.h);if(x1-x0<3||y1-y0<3)return false;
  let s=0;for(let c=0;c<3;c++)s+=Math.abs(boxMean(I,W,x0,y0,x1,y1,c)-i.m[c]);return s<=lim;}

/* ---------- mẫu vật thể ---------- */
/* lib.objs = [{img,tw,sx,sy,name,role,sc,fx,fy,cv:{img,tw,sx,sy}|null,ref:{...}}] */
function objTpl(lib,z,NS=260){
  const out=[];
  for(const it of lib.objs){
    const ws=Math.round(it.tw*z*(it.sc*128/it.tw)); /* ws = T*z (sc=T/128) */
    if(ws<6||ws>1400)continue;
    const c=mk(ws,ws),g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;
    g.drawImage(it.img,it.sx,it.sy,it.tw,it.tw,0,0,ws,ws);if(it.cv&&it.cv.img)g.drawImage(it.cv.img,it.cv.sx,it.cv.sy,it.cv.tw,it.cv.tw,0,0,ws,ws);
    const id=g.getImageData(0,0,ws,ws).data;let cnt=0;for(let i=3;i<id.length;i+=4)if(id[i]>200)cnt++;
    if(cnt<24)continue;
    const stride=Math.max(1,Math.floor(Math.sqrt(cnt/NS))),dx=[],dy=[],cr=[],cg=[],cb=[];
    for(let y=0;y<ws;y+=stride)for(let x=0;x<ws;x+=stride){const p=(y*ws+x)*4;if(id[p+3]<=200)continue;dx.push(x-ws/2);dy.push(y-ws);cr.push(id[p]);cg.push(id[p+1]);cb.push(id[p+2]);}
    const n=dx.length;if(n<12)continue;
    /* xáo trộn có định trước để 24 mẫu đầu đại diện cho cả hình */
    const ord=Array.from({length:n},(_,i)=>i).sort((a,b)=>((a*2654435761)>>>0)%9973-((b*2654435761)>>>0)%9973);
    const P=(arr)=>Int16Array.from(ord,i=>arr[i]);
    /* độ đa dạng màu (mẫu phẳng một màu dễ khớp nhầm) */
    let mr=0,mg=0,mb=0;for(let i=0;i<n;i++){mr+=cr[i];mg+=cg[i];mb+=cb[i];}mr/=n;mg/=n;mb/=n;let vr=0;for(let i=0;i<n;i++)vr+=Math.abs(cr[i]-mr)+Math.abs(cg[i]-mg)+Math.abs(cb[i]-mb);vr/=n;
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let i=0;i<n;i++){x0=Math.min(x0,dx[i]);x1=Math.max(x1,dx[i]);y0=Math.min(y0,dy[i]);y1=Math.max(y1,dy[i]);}
    const ix0=x0+(x1-x0)*.28,ix1=x1-(x1-x0)*.28,iy0=y0+(y1-y0)*.28,iy1=y1-(y1-y0)*.28;let ni=0,ir=0,ig=0,ib=0;
    for(let i=0;i<n;i++)if(dx[i]>=ix0&&dx[i]<=ix1&&dy[i]>=iy0&&dy[i]<=iy1){ni++;ir+=cr[i];ig+=cg[i];ib+=cb[i];}
    const mx=(ix0+ix1)/2,my=(iy0+iy1)/2,Q=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    for(let i=0;i<n;i++)if(dx[i]>=ix0&&dx[i]<=ix1&&dy[i]>=iy0&&dy[i]<=iy1){const q=(dx[i]>mx?1:0)+(dy[i]>my?2:0);Q[q][0]++;Q[q][1]+=cr[i];Q[q][2]+=cg[i];Q[q][3]+=cb[i];}
    const quad=Q.every(q=>q[0]>=3)?Q.map(q=>[q[1]/q[0],q[2]/q[0],q[3]/q[0]]):null;
    const inner=ni>=6?{x0:Math.round(ix0),x1:Math.round(ix1),y0:Math.round(iy0),y1:Math.round(iy1),mx:Math.round(mx),my:Math.round(my),m:[ir/ni,ig/ni,ib/ni],quad:null}:null;
    out.push({it,n,inner,w:stride*stride,tol:Math.max(14,Math.min(60,vr*.8)),dx:P(dx),dy:P(dy),r:P(cr),g:P(cg),b:P(cb),vr,area:cnt});}
  return out;}

/* ---------- căn lưới theo vật thể ----------
   khớp vài mẫu vật thể lớn với dịch chuyển nhỏ quanh ô dự đoán, rồi bình phương tối thiểu (ox, oy, D) trên vị trí đo được;
   mở rộng dần từ tâm ảnh để chịu được sai số độ phóng vài % */
export async function register(ref,lib,cal,opt={},progress=()=>{}){
  opt.t0=performance.now();let c={z:cal.z,ox:cal.ox,oy:cal.oy},total=0,last=0,tc=null,act=null;const sched=opt.sched||[.06,.025,.012,.006];
  for(let it=0;it<sched.length;it++){
    const z=c.z,D=96*z,Rs=opt.wide?Math.max(8,Math.round(.5*D)):Math.max(6,Math.round(.3*D)),stp=Math.max(1,Math.round(Rs/4));
    if(opt.debug)(opt.log2=opt.log2||[]).push(['tpl0',Math.round(performance.now()-opt.t0)]);
    if(!tc||Math.abs(z/tc.z-1)>.015)tc={z,T:objTpl(lib,z,150).filter(t=>t.vr>25&&t.it.role!=='Phủ nền'&&t.n>=60).sort((a,b)=>b.area-a.area).slice(0,opt.K||600)};const T=act?tc.T.filter((t,i)=>act.has(t)||i<150):tc.T;
    if(!T.length)break;
    const cx0=ref.w/2,cy0=ref.h/2,allc=cellList(ref,z,c.ox,c.oy,.2).filter(q=>cellSamples(ref,q,D,null).nv>=6);let best=new Map(),rr=0;const doneC=new Set();
    for(const grow of [1,2.5,6,60]){rr=Math.min(1e9,Rs/sched[it]*grow);const cells=allc.filter(q=>!doneC.has(q.x+','+q.y)&&Math.hypot(q.tx-cx0,q.ty+D-cy0)<=rr);for(const q of cells)doneC.add(q.x+','+q.y);
    for(const t of T){{const y=ytick();if(y)await y;}for(const q of cells){const bx=Math.round(q.tx),by=Math.round(q.ty+D);if(!gate(ref,t,bx,by,38))continue;let bh=-1,bdx=0,bdy=0;
      for(let dy=-Rs;dy<=Rs;dy+=stp)for(let dx=-Rs;dx<=Rs;dx+=stp){let ins=0,hit=0;const pre=Math.min(20,t.n);
        for(let k=0;k<pre;k++){const x=bx+dx+t.dx[k],y=by+dy+t.dy[k];if(x<0||y<0||x>=ref.w||y>=ref.h)continue;ins++;if(lo(ref.d,(y*ref.w+x)*4,t.r[k],t.g[k],t.b[k])<=t.tol*1.3)hit++;}
        if(ins<pre*.7)continue;if(hit>bh){bh=hit;bdx=dx;bdy=dy;}}
      if(bh<9)continue;
      /* tinh chỉnh 1px quanh điểm tốt nhất rồi chấm đủ mẫu */
      let top=null;for(let dy=-stp;dy<=stp;dy++)for(let dx=-stp;dx<=stp;dx++){const ax=bx+bdx+dx,ay=by+bdy+dy;let ins=0,hit=0;
        for(let k=0;k<t.n;k++){const x=ax+t.dx[k],y=ay+t.dy[k];if(x<0||y<0||x>=ref.w||y>=ref.h)continue;ins++;if(lo(ref.d,(y*ref.w+x)*4,t.r[k],t.g[k],t.b[k])<=t.tol)hit++;}
        const f=hit/Math.max(1,ins);if(ins>=t.n*.7&&(!top||f>top.f))top={f,ax,ay,hit};}
      if(!top||top.f<.62)continue;const sc=top.f*top.f*top.hit*t.w,key=q.x+','+q.y,o=best.get(key);if(!o||sc>o.sc)best.set(key,{x:q.x,y:q.y,ax:top.ax,ay:top.ay,sc,t});}
      progress((it+T.indexOf(t)/T.length*.9)/sched.length,'căn lưới theo vật thể');}
    if(best.size>=3)break;}
    if(opt.debug)(opt.log=opt.log||[]).push([it,allc.length,T.length,best.size,Rs,stp,Math.round(rr),Math.round(performance.now()-opt.t0)]);
    if(best.size>=3&&it<sched.length-1){const s=new Set();for(const m of best.values())s.add(m.t);act=s;}
    let M=[...best.values()];
    if(M.length<3){if(it===0)break;else continue;}
    let sol=null;
    for(let rep=0;rep<4;rep++){let A=[[0,0,0],[0,0,0],[0,0,0]],B=[0,0,0];
      const add=(r,y)=>{for(let i=0;i<3;i++){B[i]+=r[i]*y;for(let j=0;j<3;j++)A[i][j]+=r[i]*r[j];}};
      for(const m of M){add([1,0,m.x-m.y],m.ax);add([0,1,(m.x+m.y+2)/2],m.ay);}
      const ms=M.map(m=>m.x-m.y),ns=M.map(m=>m.x+m.y);const spread=Math.max(Math.max(...ms)-Math.min(...ms),Math.max(...ns)-Math.min(...ns));
      if(spread<10){const D0=96*c.z;let sx=0,sy=0;for(const m of M){sx+=m.ax-(m.x-m.y)*D0;sy+=m.ay-(m.x+m.y+2)*D0/2;}sol=[sx/M.length,sy/M.length,D0];}else sol=solve3(A,B);
      if(!sol)break;const [ox,oy,Dn]=sol;
      const res=M.map(m=>Math.hypot(m.ax-(ox+(m.x-m.y)*Dn),m.ay-(oy+(m.x+m.y+2)*Dn/2)));const lim=Math.max(2.5,Rs/3);
      const keep=M.filter((m,i)=>res[i]<=lim);if(keep.length===M.length||keep.length<3)break;M=keep;}
    if(opt.debug&&sol)(opt.log2=opt.log2||[]).push(['fit',it,M.length,sol.map(q=>+q.toFixed(2)),M.slice(0,6).map(m=>[m.x,m.y,m.t.it.name,Math.round(m.ax),Math.round(m.ay)])]);
    if(!sol||!(sol[2]>0))continue;const nc={z:sol[2]/96,ox:sol[0],oy:sol[1]};const conv=it>=1&&Math.abs(nc.z/c.z-1)<.002&&Math.hypot(nc.ox-c.ox,nc.oy-c.oy)<.8*((sol[2])/22);c=nc;total=M.length;last=it;if(conv&&best.size>=6)break;}
  return {cal:c,matches:total,log:opt.log,log2:opt.log2};}
function solve3(A,B){const M=A.map((r,i)=>[...r,B[i]]);for(let i=0;i<3;i++){let p=i;for(let r=i+1;r<3;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;if(Math.abs(M[p][i])<1e-9)return null;[M[i],M[p]]=[M[p],M[i]];for(let r=0;r<3;r++){if(r===i)continue;const f=M[r][i]/M[i][i];for(let k=i;k<4;k++)M[r][k]-=f*M[i][k];}}return [M[0][3]/M[0][0],M[1][3]/M[1][1],M[2][3]/M[2][2]];}

/* ---------- phân tích chính ---------- */
export async function analyze(ref,lib,cal,opt={},progress=()=>{}){
  const z=cal.z,D=96*z,tol=opt.tol||52,minHit=opt.minHit||.62,margin=3;
  const cells=cellList(ref,z,cal.ox,cal.oy,.5);
  if(!cells.length)return {error:'Lưới không phủ lên ảnh'};
  { const keep=cells.filter(c=>cellSamples(ref,c,D,null).nv>=6);cells.length=0;cells.push(...keep); }
  if(!cells.length)return {error:'Lưới không trúng vùng bản đồ nào trong ảnh'};
  let xmin=1e9,ymin=1e9,xmax=-1e9,ymax=-1e9;for(const c of cells){xmin=Math.min(xmin,c.x);ymin=Math.min(ymin,c.y);xmax=Math.max(xmax,c.x);ymax=Math.max(ymax,c.y);}
  const W=xmax-xmin+1+margin*2,H=ymax-ymin+1+margin*2;for(const c of cells){c.X=c.x-xmin+margin;c.Y=c.y-ymin+margin;}
  const claimed=new Uint8Array(ref.w*ref.h);
  /* 1) vật thể */
  progress(.05,'dựng mẫu vật thể');
  const OT=objTpl(lib,z);
  const cand=[];const bw=ref.w,bh=ref.h,d=ref.d;
  for(let ti=0;ti<OT.length;ti++){const t=OT[ti];if(t.it.role==='Phủ nền'&&t.vr<25)continue;
    for(const c of cells){const ax=Math.round(c.tx),ay=Math.round(c.ty+D);   /* đỉnh dưới của ô (x,y) */
      if(!gate(ref,t,ax,ay,40))continue;
      let ins=0,hit=0,miss=0;const maxMiss=Math.floor(t.n*(1-minHit)),pre=Math.min(24,t.n);
      for(let k=0;k<pre;k++){const x=ax+t.dx[k],y=ay+t.dy[k];if(x<0||y<0||x>=bw||y>=bh)continue;ins++;const p=(y*bw+x)*4;if(lo(d,p,t.r[k],t.g[k],t.b[k])<=t.tol)hit++;}
      if(ins<pre*.6||hit<ins*.45)continue;
      ins=0;hit=0;miss=0;let out=0;
      for(let k=0;k<t.n;k++){const x=ax+t.dx[k],y=ay+t.dy[k];if(x<0||y<0||x>=bw||y>=bh){out++;continue;}ins++;const p=(y*bw+x)*4;if(lo(d,p,t.r[k],t.g[k],t.b[k])<=t.tol)hit++;else{miss++;if(miss>maxMiss)break;}}
      if(miss>maxMiss||ins<t.n*.7)continue;const frac=hit/ins;if(frac<minHit)continue;
      cand.push({ti,c,ax,ay,frac,hit,area:hit*t.w,sc:frac*frac*hit*t.w*(t.vr<10?.5:1)});}
    if(ti%25===0){progress(.05+.5*ti/OT.length,'khớp vật thể '+ti+'/'+OT.length);const y=ytick();if(y)await y;}}
  cand.sort((a,b)=>b.sc-a.sc);
  const found=[];
  for(const q of cand){const t=OT[q.ti];let un=0,tot=0,uarea=0;
    for(let k=0;k<t.n;k++){const x=q.ax+t.dx[k],y=q.ay+t.dy[k];if(x<0||y<0||x>=bw||y>=bh)continue;const p=(y*bw+x)*4;if(lo(d,p,t.r[k],t.g[k],t.b[k])> t.tol)continue;tot++;if(!claimed[y*bw+x]){un++;}}
    uarea=un*t.w;if(tot===0||un<tot*.55||uarea<(opt.minArea||120))continue;
    for(let k=0;k<t.n;k++){const x=q.ax+t.dx[k],y=q.ay+t.dy[k];if(x<0||y<0||x>=bw||y>=bh)continue;const p=(y*bw+x)*4;if(lo(d,p,t.r[k],t.g[k],t.b[k])> t.tol)continue;
      const r=Math.ceil(Math.sqrt(t.w)/2);for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){const X=x+xx,Y=y+yy;if(X>=0&&Y>=0&&X<bw&&Y<bh)claimed[Y*bw+X]=1;}}
    found.push({it:t.it,x:q.c.X,y:q.c.Y,frac:q.frac,area:uarea});}
  /* 2) nền (bỏ các điểm đã thuộc vật thể) */
  progress(.6,'khớp ô nền');
  const GT=groundTpl(lib,z,true);
  const grid=new Array(W*H).fill(null);const byCell=new Map();for(const c of cells)byCell.set(c.X+','+c.Y,c);
  let bias=null;
  for(let pass=0;pass<2;pass++){const votes=new Map();
    for(const c of cells){const cs=cellSamples(ref,c,D,claimed),b=bestTile(cs,GT,(c.X&1)|((c.Y&1)<<1),pass?bias:null);
      c.g=b;if(b&&b.d<36)votes.set(b.t.sh,(votes.get(b.t.sh)||0)+1);}
    const top=[...votes.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2);bias=new Map();top.forEach(([sh,n],i)=>bias.set(sh,i?3:5));}
  /* ô bị vật che hết: lấy ô nền xuất hiện nhiều nhất quanh nó */
  const GOOD=44;
  for(const c of cells){if(c.g&&c.g.d<=GOOD)continue;const cnt=new Map();
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const n=byCell.get((c.X+dx)+','+(c.Y+dy));if(n&&n.g&&n.g.d<=GOOD&&n!==c){const k=n.g.t;cnt.set(k,(cnt.get(k)||0)+1);}}
    const cs=cellSamples(ref,c,D,claimed);
    if(cs.nv<8&&cnt.size){const t=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0][0];c.g={d:0,t,v:t.vars[t.wat?(c.X&1)|((c.Y&1)<<1):0]||t.vars[0],fill:1};}}
  for(const c of cells){if(c.g&&c.g.d<=Math.max(GOOD,60)||c.g&&c.g.fill)grid[c.Y*W+c.X]=c.g;}
  /* 3) phủ nền (mảng dẹt) ở những ô nền khớp kém */
  progress(.75,'tìm phủ nền');
  const decal=[];const DT=OT.filter(t=>t.it.role==='Phủ nền'&&t.vr>=8&&t.vr<25);
  for(const c of cells){if(c.g&&c.g.d<=GOOD)continue;const cs=cellSamples(ref,c,D,claimed);if(cs.nv<10)continue;
    const ax=Math.round(c.tx),ay=Math.round(c.ty+D);let bestD=null;
    for(const t of DT){let ins=0,hit=0;for(let k=0;k<t.n;k++){const x=ax+t.dx[k],y=ay+t.dy[k];if(x<0||y<0||x>=bw||y>=bh)continue;ins++;const p=(y*bw+x)*4;if(l1(d,p,t.r[k],t.g[k],t.b[k])<=tol)hit++;}
      if(ins>t.n*.7&&hit/ins>=.88&&(!bestD||hit*t.w>bestD.a))bestD={t,a:hit*t.w,f:hit/ins};}
    if(bestD){decal.push({it:bestD.t.it,x:c.X,y:c.Y,frac:bestD.f,area:bestD.a});
      for(let k=0;k<bestD.t.n;k++){const x=ax+bestD.t.dx[k],y=ay+bestD.t.dy[k];if(x>=0&&y>=0&&x<bw&&y<bh)claimed[y*bw+x]=1;}}}
  /* 4) phần chưa giải thích được → thiếu tài nguyên */
  progress(.85,'tìm phần còn thiếu');
  const bs=Math.max(4,Math.round(D/14)),bwN=Math.ceil(ref.w/bs),bhN=Math.ceil(ref.h/bs),un=new Uint8Array(bwN*bhN);
  const tilePx=(c,gx,gy)=>{const g=c.g;if(!g||!g.v)return null;const a=gx-Math.floor(gx),b=gy-Math.floor(gy);const i=Math.min(SG-1,Math.floor(a*SG)),j=Math.min(SG-1,Math.floor(b*SG));return g.v.s.subarray((i*SG+j)*3,(i*SG+j)*3+3);};
  for(let by=0;by<bhN;by++)for(let bx=0;bx<bwN;bx++){const px=Math.min(ref.w-1,bx*bs+bs/2|0),py=Math.min(ref.h-1,by*bs+bs/2|0),p=(py*ref.w+px)*4;
    if(isBg(d,p)||claimed[py*ref.w+px])continue;
    const X=(px-cal.ox)/D,Yv=(py-cal.oy)/(D/2),gx=(X+Yv)/2,gy=(Yv-X)/2,cx0=Math.floor(gx)-xmin+margin,cy0=Math.floor(gy)-ymin+margin,c=byCell.get(cx0+','+cy0);
    if(c&&c.g&&c.g.d<=Math.max(GOOD,60)){const t=tilePx(c,gx,gy);if(t&&l1(d,p,t[0],t[1],t[2])<=tol*1.6)continue;}
    un[by*bwN+bx]=1;}
  const lab=new Int32Array(bwN*bhN),miss=[];let L=0;
  for(let i=0;i<un.length;i++){if(!un[i]||lab[i])continue;L++;const st=[i];lab[i]=L;let x0=1e9,y0=1e9,x1=-1,y1=-1,n=0,sr=0,sg=0,sb=0;
    while(st.length){const k=st.pop(),bx=k%bwN,by=(k/bwN)|0;n++;x0=Math.min(x0,bx);x1=Math.max(x1,bx);y0=Math.min(y0,by);y1=Math.max(y1,by);
      const p=(Math.min(ref.h-1,by*bs+bs/2|0)*ref.w+Math.min(ref.w-1,bx*bs+bs/2|0))*4;sr+=d[p];sg+=d[p+1];sb+=d[p+2];
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=bx+dx,Y=by+dy;if(X<0||Y<0||X>=bwN||Y>=bhN)continue;const j=Y*bwN+X;if(un[j]&&!lab[j]){lab[j]=L;st.push(j);}}}
    if(n<(opt.minMiss||5))continue;miss.push({x:x0*bs,y:y0*bs,w:(x1-x0+1)*bs,h:(y1-y0+1)*bs,blocks:n,area:n*bs*bs,color:[Math.round(sr/n),Math.round(sg/n),Math.round(sb/n)],cellsW:(x1-x0+1)*bs/D,cellsH:(y1-y0+1)*bs/(D/2)});}
  miss.sort((a,b)=>b.area-a.area);
  for(const m of miss.slice(0,30)){const sc=Math.min(1,110/Math.max(m.w,m.h)),c=mk(Math.max(1,m.w*sc),Math.max(1,m.h*sc));c.getContext('2d').drawImage(ref.canvas,m.x,m.y,m.w,m.h,0,0,c.width,c.height);m.thumb=c.toDataURL('image/png');}
  /* ô nền không có tile phù hợp */
  const badCells=cells.filter(c=>!c.g||c.g.d>Math.max(GOOD,60)).length;
  progress(1,'xong');
  return {W,H,cells,found,decal,miss,grid,xmin,ymin,margin,badCells,stats:{cells:cells.length,objects:found.length,decals:decal.length,missing:miss.length,unexplained:miss.reduce((s,m)=>s+m.area,0)/(ref.w*ref.h)}};}

/* kiểm thử: độ khớp của một vật thể tại ô (x,y) theo toạ độ lưới của ảnh */
export function probe(ref,lib,cal,obj,x,y){
  const z=cal.z,D=96*z,sub={ground:[],objs:[obj]},T=objTpl(sub,z)[0];if(!T)return null;
  const ax=Math.round(cal.ox+(x-y)*D),ay=Math.round(cal.oy+(x+y)*D/2+D);let hit=0,ins=0;const dif=[];
  for(let k=0;k<T.n;k++){const X=ax+T.dx[k],Y=ay+T.dy[k];if(X<0||Y<0||X>=ref.w||Y>=ref.h)continue;ins++;const p=(Y*ref.w+X)*4,df=l1(ref.d,p,T.r[k],T.g[k],T.b[k]);dif.push(df);if(df<=T.tol)hit++;}
  dif.sort((a,b)=>a-b);return {frac:hit/Math.max(1,ins),n:T.n,tol:T.tol,vr:T.vr,med:dif[dif.length>>1],ins};}
