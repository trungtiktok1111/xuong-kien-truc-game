/* Tự tạo bối cảnh 2D từ tài nguyên đã gắn nhãn (Cây / Nhà / Nước / Đường / Đồ vật / Trang trí).
   Vật lớn (ô >= 48px) được cắt thành khối 64px để phủ nhiều ô bản đồ; phần dưới chặn đường, phần trên che nhân vật. */
const B=64;
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');
const KINDS={
  village:{name:'Làng',houses:[4,6],trees:[14,22],props:[14,22],pond:1,paths:2},
  forest:{name:'Rừng',houses:[0,1],trees:[70,110],props:[10,18],pond:1,paths:1},
  wild:{name:'Đồng hoang',houses:[0,2],trees:[8,14],props:[16,26],pond:0,paths:1}};
export const GEN_KINDS=Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.name]));

const MC=new WeakMap();
function meanCols(sh,em){let m=MC.get(sh.img);if(m)return m;const n=sh.cols*sh.rows;m=new Array(n);const c=document.createElement('canvas');c.width=sh.img.width;c.height=sh.img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sh.img,0,0);const D=g.getImageData(0,0,c.width,c.height).data,W=c.width,st=sh.tw+sh.margin,S=Math.max(1,Math.floor(sh.tw/8));
  for(let i=0;i<n;i++){if(em&&em[i]!==2)continue;const r0=Math.floor(i/sh.cols),c0=i%sh.cols;let R=0,G=0,Bb=0,k=0;for(let y=0;y<sh.tw;y+=S)for(let x=0;x<sh.tw;x+=S){const o=((r0*st+y)*W+c0*st+x)*4;R+=D[o];G+=D[o+1];Bb+=D[o+2];k++;}m[i]=[R/k,G/k,Bb/k];}
  MC.set(sh.img,m);return m;}
/* phân loại nền theo màu thật của ảnh: cỏ / đất / cát / đá / nước */
export function groundKind(c){const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  if(b>r+22&&b>=g-6)return 'nước';
  if(mx-mn<30)return 'đá';
  if(g>r+6&&g>=b+8)return 'cỏ';
  if(r>150&&g>130&&b<r-45&&mx>170)return 'cát';
  return 'đất';}
export function scanPools(ctx){
  const {sheets,eff,emptyMap,visSh}=ctx;
  const P={ground:[],water:[],'Cây':[],'Nhà':[],'Đồ vật':[],'Trang trí':[]};
  for(const sid of visSh()){const sh=sheets[sid];if(!sh||!sh.img||sid<4)continue;
    const em=sh.cols*sh.rows<=20000?emptyMap(sh):null,N=Math.min(sh.cols*sh.rows,4000),big=sh.tw>=48;let mc=null;
    for(let idx=0;idx<N;idx++){if(em&&em[idx]===1)continue;const e=eff(sid,idx),opaque=em&&em[idx]===2;
      if(opaque&&e.layer===0&&(!e.type||e.type==='Đường'||e.type==='Nước')){
        if(!mc)mc=meanCols(sh,em);const col=mc[idx];if(!col)continue;const kind=e.type==='Nước'?'nước':groundKind(col);
        if(kind==='nước')P.water.push({sid,idx,kind});else P.ground.push({sid,idx,kind});
        continue;}
      const t=e.type;if(!t||!P[t]||t==='Nước'||t==='Đường')continue;if(e.layer===1)continue;
      P[t].push({sid,idx,big,layer3:e.layer===3});}}
  return P;}

const pick=(a,r)=>a[Math.floor(r()*a.length)];
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));

/* trả về {w,h,layers,blk,ents,newSheet:{canvas,tw}|null,info} — gọi bởi ed2d sau khi tạo sheet */
export function build(ctx,opt){
  const {sheets,enc}=ctx;const K=KINDS[opt.kind]||KINDS.village,r=Math.random,W=opt.w,H=opt.h;
  const P=scanPools(ctx);
  const layers=[0,1,2,3].map(()=>new Array(W*H).fill(0)),blk=new Array(W*H).fill(0),occ=new Uint8Array(W*H),ents=[];
  const info={ground:P.ground.length,water:P.water.length,tree:P['Cây'].length,house:P['Nhà'].length,prop:P['Đồ vật'].length+P['Trang trí'].length,placed:{house:0,tree:0,prop:0}};
  /* nền */
  if(!P.ground.length)return {error:'Chưa tìm thấy ô NỀN. App cần ảnh nền đặc kín (không trong suốt): cỏ, đất, cát, đá… Hãy nạp ảnh nền của bạn (ảnh vuông nhỏ, nền đặc) rồi tạo lại.'};
  const byK={};for(const g of P.ground)(byK[g.kind]=byK[g.kind]||[]).push(g);const kinds=Object.keys(byK);
  const prefB=['cỏ','đất','cát','đá'].filter(k=>byK[k]),bk=prefB.length?pick(prefB,r):kinds[0];
  const base=pick(byK[bk],r);
  const sameK=shuffle(byK[bk].filter(g=>!(g.sid===base.sid&&g.idx===base.idx)),r);
  const pk=['đất','cát','đá','cỏ'].filter(k=>byK[k]&&k!==bk);
  const pathT=pk.length?pick(byK[pk[0]],r):(sameK[0]||null);
  const alt=[pathT,sameK[0]||null];
  info.kinds=kinds.join('/');
  for(let i=0;i<W*H;i++){const g=(alt[1]&&r()<.07)?alt[1]:base;layers[0][i]=enc(g.sid,g.idx);}
  /* đường */
  const cy=Math.floor(H/2),A=Math.max(2,Math.floor(H/8)),ph=r()*6.28,fr=5+r()*4;let pathCells=[];
  if(pathT)for(let x=1;x<W-1;x++){const y=cy+Math.round(A*Math.sin(x/fr+ph));for(let d=0;d<2;d++){const yy=Math.max(1,Math.min(H-2,y+d)),i=yy*W+x;layers[0][i]=enc(pathT.sid,pathT.idx);occ[i]=2;pathCells.push([x,yy]);}}
  if(pathT&&K.paths>1){const bx=Math.floor(W*(.3+r()*.4)),y0=pathCells.find(p=>p[0]===bx);if(y0)for(let y=1;y<H-1;y++){const dir=y<y0[1]?-1:1;for(let d=0;d<2;d++){const xx=bx+d,i=y*W+xx;layers[0][i]=enc(pathT.sid,pathT.idx);if(!occ[i])occ[i]=2;}}}
  /* hồ */
  if(K.pond&&P.water.length){const wt=pick(P.water,r);
    for(let t=0;t<40;t++){const px=ri(r,6,W-7),py=ri(r,4,H-5),rx=ri(r,3,Math.max(3,Math.floor(W/9))),ry=ri(r,2,Math.max(2,Math.floor(H/8)));let bad=0,cells=[];
      for(let y=py-ry;y<=py+ry;y++)for(let x=px-rx;x<=px+rx;x++){if(x<1||y<1||x>=W-1||y>=H-1){bad=1;continue;}if(((x-px)/rx)**2+((y-py)/ry)**2<=1){if(occ[y*W+x]){bad=1;}cells.push(y*W+x);}}
      if(bad||cells.length<6)continue;for(const i of cells){layers[0][i]=enc(wt.sid,wt.idx);blk[i]=1;occ[i]=3;}break;}}
  /* chuẩn bị vật lớn → khối 64px */
  const objs=[],blocks=[];let nb=0;
  const prep=(it,nW,limH)=>{const sh=sheets[it.sid];const sx=(it.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(it.idx/sh.cols)*(sh.tw+sh.margin),tw=sh.tw;
    const c=document.createElement('canvas');c.width=c.height=tw;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sh.img,sx,sy,tw,tw,0,0,tw,tw);const d=g.getImageData(0,0,tw,tw).data;
    let x0=tw,y0=tw,x1=-1,y1=-1;for(let y=0;y<tw;y++)for(let x=0;x<tw;x++)if(d[(y*tw+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
    if(x1<0)return null;const cw=x1-x0+1,ch=y1-y0+1;let n=nW,k=(n*B*.96)/cw;let m=Math.ceil(ch*k/B);if(m>limH){m=limH;k=(m*B)/ch;n=Math.max(1,Math.min(nW,Math.ceil(cw*k/B)));k=Math.min(k,(n*B*.96)/cw);}
    const w=cw*k,h=ch*k,o={it,n,m,base:nb,c,x0,y0,cw,ch,w,h};nb+=n*m;objs.push(o);return o;};
  const sizeOf={'Nhà':[4,5],'Cây':[2,4],'Đồ vật':[1,2],'Trang trí':[1,2]};
  const take=(t,cnt)=>{const bigP=P[t].filter(i=>i.big);const out=[];for(const it of shuffle(bigP,r).slice(0,cnt)){const o=prep(it,sizeOf[t][0],sizeOf[t][1]);if(o){o.type=t;out.push(o);}}return out;};
  const Ho=take('Nhà',5),Tr=take('Cây',7),Pr=take('Đồ vật',5).concat(take('Trang trí',6));
  const smallTr=P['Cây'].filter(i=>!i.big),smallPr=P['Đồ vật'].concat(P['Trang trí']).filter(i=>!i.big);
  /* canvas khối */
  let newSheet=null;if(objs.length){const cols=16,rows=Math.ceil(nb/cols),cv=document.createElement('canvas');cv.width=cols*B;cv.height=rows*B;const g=cv.getContext('2d');g.imageSmoothingQuality='high';
    for(const o of objs){const off=document.createElement('canvas');off.width=o.n*B;off.height=o.m*B;const og=off.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(o.c,o.x0,o.y0,o.cw,o.ch,(o.n*B-o.w)/2,o.m*B-o.h,o.w,o.h);
      for(let rr=0;rr<o.m;rr++)for(let cc=0;cc<o.n;cc++){const idx=o.base+rr*o.n+cc;g.drawImage(off,cc*B,rr*B,B,B,(idx%cols)*B,Math.floor(idx/cols)*B,B,B);}}
    newSheet={canvas:cv,tw:B};}
  /* đặt vật */
  const free=(x,y,w,h,mg)=>{for(let yy=y-mg;yy<y+h+mg;yy++)for(let xx=x-mg;xx<x+w+mg;xx++){if(xx<0||yy<0||xx>=W||yy>=H)return false;if(occ[yy*W+xx]&&(xx>=x&&xx<x+w&&yy>=y&&yy<y+h||occ[yy*W+xx]!==1))return false;}return true;};
  const startX=2,startY=(pathCells[0]||[2,cy])[1];
  const place=(o,sidNew,fp,tries,nearPath)=>{for(let t=0;t<tries;t++){const x=ri(r,1,W-o.n-1),y=ri(r,1,H-o.m-1);if(Math.abs(x-startX)<5&&Math.abs(y-startY)<4)continue;
      if(nearPath){let ok=0;for(const p of pathCells)if(Math.abs(p[0]-(x+o.n/2))<7&&Math.abs(p[1]-(y+o.m))<6&&p[1]>y+o.m){ok=1;break;}if(!ok)continue;}
      if(!free(x,y,o.n,o.m,1))continue;
      for(let rr=0;rr<o.m;rr++)for(let cc=0;cc<o.n;cc++){const i=(y+rr)*W+x+cc,v=enc(sidNew,o.base+rr*o.n+cc);occ[i]=1;if(rr>=o.m-fp){layers[2][i]=v;blk[i]=1;}else layers[3][i]=v;}return true;}return false;};
  const sidNew=ctx.newSid;
  const nH=ri(r,K.houses[0],K.houses[1]),nT=ri(r,K.trees[0],K.trees[1]),nP=ri(r,K.props[0],K.props[1]);
  if(Ho.length)for(let i=0;i<nH;i++){const o=pick(Ho,r);if(place(o,sidNew,Math.min(2,o.m),300,true))info.placed.house++;}
  if(Tr.length)for(let i=0;i<nT;i++){const o=pick(Tr,r);if(place(o,sidNew,1,80,false))info.placed.tree++;}
  if(Pr.length)for(let i=0;i<nP;i++){const o=pick(Pr,r);if(place(o,sidNew,o.type==='Đồ vật'?1:0,60,false))info.placed.prop++;}
  /* ô nhỏ (1x1) khi không có vật lớn */
  const put1=(it,block)=>{for(let t=0;t<40;t++){const x=ri(r,1,W-2),y=ri(r,1,H-2),i=y*W+x;if(occ[i]||(Math.abs(x-startX)<4&&Math.abs(y-startY)<3))continue;occ[i]=1;layers[2][i]=enc(it.sid,it.idx);if(block)blk[i]=1;return true;}return false;};
  if(!Tr.length&&smallTr.length)for(let i=0;i<nT;i++)if(put1(pick(smallTr,r),1))info.placed.tree++;
  if(!Pr.length&&smallPr.length)for(let i=0;i<nP;i++)if(put1(pick(smallPr,r),0))info.placed.prop++;
  /* viền chặn */
  for(let x=0;x<W;x++){blk[x]=1;blk[(H-1)*W+x]=1;}for(let y=0;y<H;y++){blk[y*W]=1;blk[y*W+W-1]=1;}
  ents.push({id:'s'+Date.now().toString(36),t:'start',x:startX,y:startY,name:'Xuất phát',tile:null});
  if(opt.goal){const e=pathCells[pathCells.length-1]||[W-3,cy];ents.push({id:'g'+Date.now().toString(36),t:'goal',x:e[0],y:e[1],name:'Đích',tile:null});}
  return {w:W,h:H,layers,blk,ents,newSheet,info,needSid:!!newSheet};}
