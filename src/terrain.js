/* Tự ghép nền isometric 192x96 theo NHÓM khu (mỗi khu một bộ ô riêng, không trộn bộ này sang bộ khác):
   - đường: 4 bit cạnh (N=v-1,E=u+1,S=v+1,W=u-1) -> ô duong-NN / loi-dat-NN / duong-mon-NN / kenh-NN / muong-NN
   - bờ nước: 4 bit góc đất (NW,NE,SE,SW của ô) tính trên LƯỚI ĐỈNH -> ô bo-NN / mep-vuc-NN (ao/sông liền mạch, có bờ)
   - ruộng: 4 bit bờ ruộng (cạnh giáp ô không cùng loại) -> lua-non/lua-chin/sau-gat-NN
   - dải địa hình: chỉ ghép các cặp vật liệu có ô chuyển tiếp (tiep-A-B-hướng) theo đúng thứ tự chuỗi: tuyết–cỏ–đất–(cát | đá–nước)
   Vùng chặn: ô nước đầy -> chặn ô; ô bờ/kênh/mương/ruộng -> đa giác đo từ walk_grid của chính ô. */
import {mkPts} from './zones.js';
const p2=n=>String(n).padStart(2,'0');

export function nenCaps(pk){const h=n=>pk.idx[n]!=null;
  const c={base:h('nen')?'nen':h('co')?'co':null,plaza:h('san')?'san':h('da')?'da':null,
    path:h('duong-01')?'duong':h('duong-mon-01')?'duong-mon':null,dirt:h('loi-dat-01')?'loi-dat':null,
    shore:h('bo-00')?'bo':h('mep-vuc-00')?'mep-vuc':null,canal:h('kenh-01')?'kenh':null,ditch:h('muong-01')?'muong':null,
    fields:['lua-non','lua-chin','sau-gat'].filter(f=>h(f+'-00'))};
  c.kind=c.fields.length?'farm':(c.canal&&!c.shore)?'common':'std';
  c.trans=[];for(const n of Object.keys(pk.idx)){const m=/^tiep-(\w+?)-(\w+?)-(north|east|south|west)$/.exec(n);if(m&&!c.trans.some(t=>t[0]===m[1]&&t[1]===m[2]))c.trans.push([m[1],m[2]]);}
  return c;}

const CHAINS=[['co','dat'],['co','tuyet'],['co','dat','cat'],['co','dat','da'],['co','dat','da','nuoc']];
const DIR={S:'south',N:'north',E:'east',W:'west'};

export function genTerrain({pk,sid,enc,W,H,r,opt}){
  const C=nenCaps(pk),L0=new Array(W*H).fill(0),blk=new Array(W*H).fill(0),occ=new Uint8Array(W*H),zones=[],info={kind:C.kind,bands:''};
  const rn=(a,b)=>a+Math.floor(r()*(b-a+1)),I=(x,y)=>y*W+x,inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  const T=(n,f=0)=>enc(sid,pk.idx[n],f);
  const fullSq=P=>P.length===4&&P.every(q=>(q[0]===0||q[0]===1)&&(q[1]===0||q[1]===1));
  function polys(name,x,y){const L=pk.bz&&pk.bz[name];if(!L)return;for(const P of L){if(fullSq(P)){blk[I(x,y)]=1;return;}zones.push(mkPts('poly',P.map(q=>[x+q[0],y+q[1]])));}}
  for(let i=0;i<W*H;i++)L0[i]=T(C.base);
  /* ---- dải địa hình (chỉ bộ có ô chuyển tiếp) ---- */
  let box={x0:0,y0:0,x1:W-1,y1:H-1};
  if(C.kind==='common'&&C.trans.length&&r()<.75){
    const ok=CHAINS.filter(ch=>ch.every((m,i)=>i===0||C.trans.some(t=>t[0]===ch[i-1]&&t[1]===m)&&pk.idx[m]!=null));
    if(ok.length){const ch=ok[Math.floor(r()*ok.length)],side=['S','N','E','W'][Math.floor(r()*4)],ver=side==='S'||side==='N',len=ver?H:W;
      const seq=[];for(let k=1;k<ch.length;k++){seq.push({t:true,a:ch[k-1],b:ch[k]});const w=ch[k]==='nuoc'?3:rn(3,4);for(let j=0;j<w;j++)seq.push({t:false,m:ch[k]});}
      const D=seq.length;
      if(D<len*.4){
        for(let k=0;k<D;k++){const d=(side==='S'||side==='E')?(len-D+k):(D-1-k),s=seq[k];
          for(let q=0;q<(ver?W:H);q++){const x=ver?q:d,y=ver?d:q,i=I(x,y);
            if(s.t){L0[i]=T('tiep-'+s.a+'-'+s.b+'-'+DIR[side]);if(s.b==='nuoc'&&s.a==='da')blk[i]=1;}
            else{L0[i]=T(s.m);if(s.m==='nuoc')blk[i]=1;}
            occ[i]=4;}}
        if(side==='S')box.y1=H-D-1;else if(side==='N')box.y0=D;else if(side==='E')box.x1=W-D-1;else box.x0=D;
        info.bands=ch.join('→')+' ('+side+')';}}}
  const bw=box.x1-box.x0+1,bh=box.y1-box.y0+1;
  const roadSet=new Set(),plazaSet=new Set();
  const inBox=(x,y)=>x>=box.x0&&x<=box.x1&&y>=box.y0&&y<=box.y1;
  /* ---- đường: 1 ô, nối 4 hướng, uốn lượn ---- */
  const pfam=C.dirt||C.path;const cy=Math.floor((box.y0+box.y1)/2),A=Math.max(0,Math.min(Math.floor(H/10),Math.floor(bh/2)-4)),ph=r()*6.28,fr=5+r()*4,pathCells=[];
  let py=null;
  for(let x=box.x0;x<=box.x1;x++){const y=cy+Math.round(A*Math.sin(x/fr+ph));if(py!=null){const a=Math.min(py,y),b=Math.max(py,y);for(let t=a;t<=b;t++)if(t!==y)roadSet.add(I(x,t));}roadSet.add(I(x,y));pathCells.push([x,y]);py=y;}
  const bx=box.x0+Math.floor(bw*(.4+r()*.2));for(let y=box.y0;y<=box.y1;y++)roadSet.add(I(bx,y));
  const pw=Math.max(3,Math.min(6,Math.floor(bw/6))),ph2=Math.max(3,Math.min(5,Math.floor(bh/6)));
  if(C.plaza&&C.kind!=='farm')for(let y=cy-Math.floor(ph2/2);y<cy-Math.floor(ph2/2)+ph2;y++)for(let x=bx-Math.floor(pw/2);x<bx-Math.floor(pw/2)+pw;x++){if(!inBox(x,y))continue;plazaSet.add(I(x,y));roadSet.delete(I(x,y));}
  const isRoad=(x,y)=>roadSet.has(I(x,y)),isOpen=(x,y)=>!inb(x,y)||(inBox(x,y)?(roadSet.has(I(x,y))||plazaSet.has(I(x,y))):false);
  const openEdge=(x,y)=>{/* ra ngoài bản đồ thì mở; ra ngoài khung dải địa hình thì đóng */return !inb(x,y)||isOpen(x,y);};
  const autoSet=(set,fam,open)=>{for(const i of set){const x=i%W,y=(i/W)|0;const m=(open(x,y-1)?1:0)|(open(x+1,y)?2:0)|(open(x,y+1)?4:0)|(open(x-1,y)?8:0);if(!m)continue;L0[i]=T(fam+'-'+p2(m));occ[i]=2;}};
  const plazaDraw=()=>{for(const i of plazaSet){L0[i]=T(C.plaza);occ[i]=2;}};
  /* ---- kênh / mương / suối: đường 1 ô từ một đầu cụt ra mép bản đồ, nằm gọn trong một góc, không cắt đường ---- */
  const chanSet=new Set();
  function channel(fam,stopAtRoad){
    for(let t=0;t<40;t++){const qx=r()<.5?0:1,qy=r()<.5?0:1,x0=qx?bx+4:box.x0+2,x1=qx?box.x1-3:bx-4,y0=qy?cy+A+4:box.y0+2,y1=qy?box.y1-3:cy-A-4;
      if(x1-x0<6||y1-y0<5)continue;
      const sx=rn(x0+2,x1-2),sy=rn(y0+1,y1-1),dirY=qy?1:-1,amp=2+r()*2,fr2=3+r()*2,ph3=r()*6.28,set=new Set();let px=sx,bad=false;
      for(let y=sy;qy?y<=box.y1:y>=box.y0;y+=dirY){if(!inb(px,y))break;const tt=Math.abs(y-sy);let nx=Math.round(sx+Math.sin(tt/fr2+ph3)*amp*Math.min(1,tt/3));nx=Math.max(x0,Math.min(x1,nx));
        const a=Math.min(px,nx),b=Math.max(px,nx);for(let x=a;x<=b;x++)set.add(I(x,y));px=nx;
        if((qy&&y>=box.y1)||(!qy&&y<=box.y0))break;}
      for(const i of set){const x=i%W,y=(i/W)|0;for(let yy=y-2;yy<=y+2&&!bad;yy++)for(let xx=x-2;xx<=x+2;xx++)if(inb(xx,yy)&&(roadSet.has(I(xx,yy))||plazaSet.has(I(xx,yy)))){bad=true;break;}if(bad)break;}
      if(bad||set.size<8)continue;
      for(const i of set)chanSet.add(i);
      const open=(x,y)=>!inb(x,y)||chanSet.has(I(x,y));
      for(const i of set){const x=i%W,y=(i/W)|0;const m=(open(x,y-1)?1:0)|(open(x+1,y)?2:0)|(open(x,y+1)?4:0)|(open(x-1,y)?8:0);if(!m)continue;const nm=fam+'-'+p2(m);L0[i]=T(nm);occ[i]=3;polys(nm,x,y);}
      return true;}
    return false;}
  /* ---- ao / sông liền mạch bằng lưới đỉnh (bo-NN / mep-vuc-NN) ---- */
  function pond(){
    const VW=W+1,Lw=new Uint8Array(VW*(H+1)).fill(1);
    for(let t=0;t<50;t++){Lw.fill(1);const qx=r()<.5?0:1,qy=r()<.5?0:1,x0=qx?bx+4:box.x0+3,x1=qx?box.x1-3:bx-4,y0=qy?cy+A+4:box.y0+3,y1=qy?box.y1-3:cy-A-4;
      if(x1-x0<8||y1-y0<7)continue;
      const pcx=Math.round(x0+(x1-x0)*(.35+r()*.3)),pcy=Math.round(y0+(y1-y0)*(.35+r()*.3));
      const rx=Math.max(3,Math.min(6,Math.floor((x1-x0)/3))),ry=Math.max(2.5,Math.min(4,Math.floor((y1-y0)/3))),p1=r()*6.28,p2_=r()*6.28,p3=r()*6.28,wv=[];
      for(let vy=pcy-Math.ceil(ry)-2;vy<=pcy+Math.ceil(ry)+2;vy++)for(let vx=pcx-rx-2;vx<=pcx+rx+2;vx++){const th=Math.atan2((vy-pcy)/ry,(vx-pcx)/rx),rr=1+.2*Math.sin(3*th+p1)+.12*Math.sin(5*th+p2_)+.07*Math.sin(2*th+p3);
        if(((vx-pcx)/rx)**2+((vy-pcy)/ry)**2<=rr*rr*.85)wv.push([vx,vy]);}
      const dirY=qy?1:-1,amp=2+r()*2,fr2=3+r()*2,ph3=r()*6.28;
      for(let vy=pcy;qy?vy<=H:vy>=0;vy+=dirY){const tt=Math.abs(vy-pcy),cxr=Math.round(pcx+Math.sin(tt/fr2+ph3)*amp*Math.min(1,tt/3));for(let dx=-1;dx<=1;dx++){const vx=Math.max(x0,Math.min(x1,cxr))+dx;wv.push([vx,vy]);}}
      let bad=false;for(const [vx,vy] of wv){if(vx<0||vy<0||vx>W||vy>H){continue;}
        for(let yy=vy-3;yy<=vy+2&&!bad;yy++)for(let xx=vx-3;xx<=vx+2;xx++)if(inb(xx,yy)&&(roadSet.has(I(xx,yy))||plazaSet.has(I(xx,yy))||occ[I(xx,yy)]===4)){bad=true;break;}if(bad)break;}
      if(bad||wv.length<14)continue;
      for(const [vx,vy] of wv)if(vx>=0&&vy>=0&&vx<=W&&vy<=H)Lw[vy*VW+vx]=0;
      let n=0;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const m=(Lw[y*VW+x]?1:0)|(Lw[y*VW+x+1]?2:0)|(Lw[(y+1)*VW+x+1]?4:0)|(Lw[(y+1)*VW+x]?8:0);if(m===15)continue;
        const nm=C.shore+'-'+p2(m);L0[I(x,y)]=T(nm);occ[I(x,y)]=3;n++;if(m===0)blk[I(x,y)]=1;else polys(nm,x,y);}
      return n;}
    return 0;}
  /* ---- ruộng bậc thang / đồng quê ---- */
  const fieldCell=new Map();
  function farm(){
    const regs=[[box.x0+2,box.y0+2,bx-2,cy-A-2],[bx+2,box.y0+2,box.x1-2,cy-A-2],[box.x0+2,cy+A+2,bx-2,box.y1-2],[bx+2,cy+A+2,box.x1-2,box.y1-2]];
    let nb=0;
    for(const [x0,y0,x1,y1] of regs){if(x1-x0<5||y1-y0<4)continue;
      for(let t=0;t<14;t++){const w=rn(4,Math.min(8,x1-x0+1)),h=rn(3,Math.min(5,y1-y0+1)),x=rn(x0,x1-w+1),y=rn(y0,y1-h+1);let bad=false;
        for(let yy=y-1;yy<=y+h&&!bad;yy++)for(let xx=x-1;xx<=x+w;xx++)if(inb(xx,yy)&&(fieldCell.has(I(xx,yy))||roadSet.has(I(xx,yy))||chanSet.has(I(xx,yy)))){bad=true;break;}
        if(bad)continue;const ty=C.fields[Math.floor(r()*C.fields.length)];
        for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)fieldCell.set(I(xx,yy),ty);nb++;}}
    for(const [i,ty] of fieldCell){const x=i%W,y=(i/W)|0,same=(a,b)=>fieldCell.get(I(a,b))===ty;
      const m=(same(x,y-1)?0:1)|(same(x+1,y)?0:2)|(same(x,y+1)?0:4)|(same(x-1,y)?0:8);const nm=ty+'-'+p2(m);L0[i]=T(nm);occ[i]=3;polys(nm,x,y);}
    return nb;}
  /* ---- ghép theo thứ tự: kênh/mương -> ruộng -> đường -> sàn ---- */
  if(C.kind==='common'&&C.canal&&opt.pond!==0)channel('kenh');
  if(C.kind==='farm'){if(C.ditch)channel('muong');farm();}
  if(pfam)autoSet(roadSet,pfam,openEdge);
  if(C.plaza&&C.kind!=='farm')plazaDraw();
  if(C.kind==='std'&&C.shore&&opt.pond!==0)info.water=pond();
  /* viền bản đồ chặn */
  for(let x=0;x<W;x++){blk[x]=1;blk[(H-1)*W+x]=1;}for(let y=0;y<H;y++){blk[y*W]=1;blk[y*W+W-1]=1;}
  info.caps=C;
  return {L0,blk,occ,zones,pathCells,bx,cy,info,box};}
