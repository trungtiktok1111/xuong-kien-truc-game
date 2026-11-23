/* Tự tạo bối cảnh 2D từ tài nguyên đã gắn nhãn (Cây / Nhà / Nước / Đường / Đồ vật / Trang trí).
   Vật lớn (ô >= 48px) được cắt thành khối 64px để phủ nhiều ô bản đồ; phần dưới chặn đường, phần trên che nhân vật. */
import {genTerrain} from './terrain.js';
const B=64;
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');
const KINDS={
  village:{name:'Làng',pack:'lang-nui-pho-kenh',houses:[4,6],trees:[14,22],props:[14,22],pond:1,paths:2},
  mtvillage:{name:'Làng núi',pack:'lang-nui',houses:[3,5],trees:[16,24],vat:[2,4],pond:1},
  town:{name:'Thành trấn',pack:'thanh-thi',houses:[9,13],trees:[3,6],vat:[4,7],bush:[2,5],pond:0},
  market:{name:'Phố chợ',pack:'pho-cho',houses:[7,10],trees:[2,5],vat:[5,8],bush:[0,3],pond:0},
  capital:{name:'Kinh đô',pack:'kinh-thanh',houses:[10,14],trees:[4,8],vat:[4,7],bush:[3,6],pond:1},
  palace:{name:'Cung điện',pack:'cung-dien',houses:[2,4],trees:[4,8],vat:[3,6],bush:[4,8],pond:0},
  imperial:{name:'Hoàng thành',pack:'hoang-thanh',houses:[3,5],trees:[3,6],vat:[3,6],bush:[2,5],pond:0},
  sect:{name:'Tông môn',pack:'son-mon',houses:[3,5],trees:[20,30],vat:[2,4],bush:[6,12],pond:0},
  immortal:{name:'Tiên môn',pack:'tien-cung',houses:[2,3],trees:[6,10],vat:[1,3],bush:[8,14],pond:0},
  cloud:{name:'Vân sơn (tuyết/mây)',pack:'van-son',houses:[1,3],trees:[10,18],vat:[2,4],bush:[2,5],pond:0},
  tunnel:{name:'Địa đạo',pack:'dia-dao',rooms:[2,3],houses:[0,1],trees:[0,0],vat:[10,18],bush:[0,0],pond:0},
  dungeon:{name:'Địa cung',pack:'dia-cung',rooms:[3,5],houses:[0,1],trees:[0,0],vat:[14,24],bush:[0,0],pond:0},
  crypt:{name:'Hầm mộ',pack:'ham-mo',rooms:[2,4],houses:[0,1],trees:[0,0],vat:[12,20],bush:[0,0],pond:0},
  tomb:{name:'Lăng tẩm',pack:'lang-tam',houses:[1,2],trees:[8,14],vat:[4,8],bush:[2,5],pond:0},
  battlefield:{name:'Chiến trường',pack:'thao-nguyen',houses:[0,0],trees:[2,5],vat:[18,30],bush:[0,2],pond:0},
  lava:{name:'Dung nham',pack:'dung-nham',houses:[0,1],trees:[0,2],vat:[10,16],bush:[0,0],pond:1},
  gem:{name:'Khe ngọc',pack:'khe-ngoc',houses:[1,2],trees:[0,3],vat:[6,12],bush:[0,2],pond:1},
  port:{name:'Bến sông',pack:'ben-song',houses:[3,6],trees:[4,8],vat:[6,10],bush:[2,5],pond:1},
  coast:{name:'Duyên hải',pack:'duyen-hai',houses:[2,4],trees:[5,10],vat:[3,6],bush:[2,5],pond:1},
  lotus:{name:'Đầm sen',pack:'dam-sen',houses:[1,3],trees:[8,14],vat:[2,4],bush:[6,10],pond:1},
  farm:{name:'Đồng quê',pack:'dong-que',houses:[2,4],trees:[8,14],vat:[3,6],bush:[4,8],pond:0},
  outpost:{name:'Trạm dịch',pack:'tram-dich',houses:[2,4],trees:[2,5],vat:[6,10],bush:[0,2],pond:0},
  forest:{name:'Rừng',pack:'rung-truc',houses:[0,1],trees:[70,110],vat:[2,4],bush:[8,14],pond:1},
  wild:{name:'Đồng hoang',pack:'thao-nguyen',houses:[0,2],trees:[8,14],vat:[4,8],bush:[3,8],pond:0}};
const VAT={village:['lang-nui','cong-trinh','pho-cho'],mtvillage:['lang-nui'],town:['kinh-thanh','pho-cho','cong-trinh'],market:['pho-cho'],capital:['kinh-thanh','pho-cho'],palace:['kinh-thanh'],imperial:['kinh-thanh'],sect:['son-mon','van-son'],immortal:['van-son','son-mon'],cloud:['van-son','son-mon'],tunnel:['dia-cung'],dungeon:['dia-cung'],crypt:['dia-cung','khe-ngoc'],tomb:['khe-ngoc','dia-cung'],battlefield:['thao-nguyen'],lava:['dia-cung','khe-ngoc'],gem:['khe-ngoc'],port:['ben-song'],coast:['duyen-hai'],lotus:['dam-sen'],farm:['dong-que'],outpost:['tram-dich','thao-nguyen'],forest:['rung-truc'],wild:['thao-nguyen','rung-truc']};
export const GEN_KIND_VAT=VAT;
export const GEN_KIND_PACK=Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.pack]));
export const GEN_KINDS=Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.name]));


const MC=new WeakMap(),MI=new WeakMap();
function meanIso(sh){let m=MI.get(sh.img);if(m)return m;const n=sh.cols*sh.rows;m=new Array(n);const c=document.createElement('canvas');c.width=sh.img.width;c.height=sh.img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sh.img,0,0);const D=g.getImageData(0,0,c.width,c.height).data,W=c.width,st=sh.tw+sh.margin;
  for(let i=0;i<n;i++){const r0=Math.floor(i/sh.cols),c0=i%sh.cols;let R=0,G=0,Bb=0,k=0;for(let y=0;y<sh.tw;y+=2)for(let x=0;x<sh.tw;x+=2){const o=((r0*st+y)*W+c0*st+x)*4;if(D[o+3]>200){R+=D[o];G+=D[o+1];Bb+=D[o+2];k++;}}if(k>sh.tw*sh.tw/16)m[i]=[R/k,G/k,Bb/k];}
  MI.set(sh.img,m);return m;}
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
  const P={ground:[],water:[],isoG:[],isoW:[],'Cây':[],'Nhà':[],'Đồ vật':[],'Trang trí':[]};
  for(const sid of visSh()){const sh=sheets[sid];if(!sh||!sh.img||sid<4||/^Gen-/.test(sh.name))continue;
    if(sh.iso){const mcI=meanIso(sh);for(let idx=0;idx<sh.cols*sh.rows;idx++){const col=mcI[idx];if(!col)continue;const kind=groundKind(col);(kind==='nước'?P.isoW:P.isoG).push({sid,idx,kind});}continue;}
    const em=sh.cols*sh.rows<=20000?emptyMap(sh):null,N=Math.min(sh.cols*sh.rows,4000),big=sh.tw>=48;let mc=null;
    for(let idx=0;idx<N;idx++){if(em&&em[idx]===1)continue;const e=eff(sid,idx),opaque=em&&em[idx]===2;
      if(opaque&&e.layer===0&&(!e.type||e.type==='Đường'||e.type==='Nước')){
        if(!mc)mc=meanCols(sh,em);const col=mc[idx];if(!col)continue;const kind=e.type==='Nước'?'nước':groundKind(col);
        if(kind==='nước')P.water.push({sid,idx,kind});else P.ground.push({sid,idx,kind});
        continue;}
      const t=e.type;if(!t||!P[t]||t==='Nước'||t==='Đường')continue;if(e.layer===1)continue;
      P[t].push({sid,idx,big,layer3:e.layer===3});}}
  return P;}

export const GEN_VIEWS={rpg:'Từ trên xuống 3/4 (RPG)',top:'Từ trên xuống thẳng (top-down)',side:'Nhìn ngang (side-view, nhảy)',iso:'Chéo 2.5D (isometric)'};
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));


/* ===== Tự sinh isometric theo DANH MỤC tài nguyên (cfg.catalog): chỉ dùng ô nền đã gắn vai trò, vật cảnh có sẵn vùng chặn đo từ nền hình ===== */
function buildIso(ctx,opt,cat){
  cat=cat||{items:[]};if(ctx.vat&&ctx.vat.length)cat={...cat,items:ctx.vat};const NEN=ctx.nen,{enc}=ctx,r=Math.random,W=opt.w,H=opt.h,K=KINDS[opt.kind]||KINDS.village,G=cat.ground,IT=cat.items||[];let zonesOut=[];
  const layers=[0,1,2,3].map(()=>new Array(W*H).fill(0)),blk=new Array(W*H).fill(0),occ=new Uint8Array(W*H),ents=[];
  const by=ro=>IT.filter(i=>i.role===ro);
  const info={ground:G?G.grass.length:1,water:1,tree:by('Cây').length,house:by('Nhà').length,prop:by('Vật').length+by('Bụi').length,placed:{house:0,tree:0,prop:0}};
  if(!NEN&&!by('Nhà').length&&!by('Cây').length)return {error:'Danh mục tài nguyên trống. Hãy mở "Màn 1 có sẵn" trước (nó nạp bộ tài nguyên + danh mục) rồi tạo lại.'};
  let cy=Math.floor(H/2),A=Math.max(1,Math.floor(H/10)),ph=r()*6.28,fr=5+r()*4;const pathCells=[];
  if(NEN){if(K.pond===0)opt={...opt,pond:0};const TT=genTerrain({pk:NEN.pk,sid:NEN.sid,enc,W,H,r,opt});for(let i=0;i<W*H;i++){layers[0][i]=TT.L0[i];blk[i]=TT.blk[i];occ[i]=TT.occ[i];}TT.pathCells.forEach(q=>pathCells.push(q));cy=TT.cy;zonesOut=TT.zones;info.terrain=TT.info;}
  else{
  for(let i=0;i<W*H;i++)layers[0][i]=enc(G.sid,r()<.13?G.grass[1]:G.grass[0]);
  const road=(x,y)=>{if(x<1||y<1||x>=W-1||y>=H-1)return;const i=y*W+x;layers[0][i]=enc(G.sid,G.path);occ[i]=2;};
  for(let x=1;x<W-1;x++){const y=cy+Math.round(A*Math.sin(x/fr+ph));for(let d=0;d<2;d++){road(x,y+d);pathCells.push([x,y+d]);}}
  const bx=Math.floor(W*(.4+r()*.2));for(let y=1;y<H-1;y++)for(let d=0;d<2;d++)road(bx+d,y);
  const pw=Math.min(8,Math.floor(W/4));for(let y=cy-Math.floor(pw/2);y<cy+Math.ceil(pw/2);y++)for(let x=bx-Math.floor(pw/2);x<bx+Math.ceil(pw/2);x++)road(x,y);
  /* mặt nước: ao hình tự nhiên (bờ lượn) + suối chảy vào ao, nằm gọn trong 1 góc giữa các đường (không cắt đường) */
  if(K.pond&&G.water!=null){const wat=(x,y)=>{if(x<2||y<2||x>=W-2||y>=H-2)return;const i=y*W+x;if(occ[i]===2)return;layers[0][i]=enc(G.sid,G.water,4|(x&1)|((y&1)<<1));blk[i]=1;occ[i]=3;};
    const qx=r()<.5?0:1,qy=r()<.5?0:1,x0=qx?bx+4:3,x1=qx?W-4:bx-3,y0=qy?cy+A+4:3,y1=qy?H-4:cy-A-3;
    if(x1-x0>=8&&y1-y0>=7){const pcx=Math.round(x0+(x1-x0)*(.35+r()*.3)),pcy=Math.round(y0+(y1-y0)*(.35+r()*.3));
      const rx=Math.max(3,Math.min(6,Math.floor((x1-x0)/3))),ry=Math.max(2,Math.min(4,Math.floor((y1-y0)/3))),p1=r()*6.28,p2=r()*6.28,p3=r()*6.28;
      for(let y=pcy-ry-2;y<=pcy+ry+2;y++)for(let x=pcx-rx-2;x<=pcx+rx+2;x++){const th=Math.atan2((y-pcy)/ry,(x-pcx)/rx),rr=1+.22*Math.sin(3*th+p1)+.14*Math.sin(5*th+p2)+.08*Math.sin(2*th+p3);
        if(((x-pcx)/rx)**2+((y-pcy)/ry)**2<=rr*rr*.9)wat(x,y);}
      const ye=qy?H-2:1,dir=qy?1:-1,xr=qx?x1:x0,amp=2+r()*2,fr2=3+r()*2,ph2=r()*6.28;
      for(let y=pcy;qy?y<=ye:y>=ye;y+=dir){const t=Math.abs(y-pcy),cxr=Math.round(pcx+(Math.sin(t/fr2+ph2)*amp)*Math.min(1,t/3));for(let dx=-1;dx<=1;dx++)wat(cxr+dx,y);}}}
  }
  const sp=pathCells[NEN?3:2]||[3,cy],sx=NEN?sp[0]:3,sy=sp[1];
  const bb=(it,x,y)=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;const P=(it.zp&&it.zp.length>2)?it.zp:[[it.zb[0],it.zb[1]],[it.zb[0]+it.zb[2],it.zb[1]+it.zb[3]]];
    for(const q of P){const X=x+1+q[0],Y=y+1+q[1];a=Math.min(a,X);c=Math.max(c,X);b=Math.min(b,Y);d=Math.max(d,Y);}
    const out=[];for(let yy=Math.floor(b+.001);yy<Math.ceil(d-.001);yy++)for(let xx=Math.floor(a+.001);xx<Math.ceil(c-.001);xx++)out.push([xx,yy]);return out;};
  const ok=(cells,mg)=>{for(const [x,y] of cells){if(x<2||y<2||x>=W-2||y>=H-2||occ[y*W+x])return false;if(Math.abs(x-sx)<4&&Math.abs(y-sy)<3)return false;
      for(let yy=y-mg;yy<=y+mg;yy++)for(let xx=x-mg;xx<=x+mg;xx++){const o=occ[yy*W+xx];if(o===1||o===3)return false;}}return true;};
  let nid=0;
  const put=(it,x,y,cells,name)=>{for(const [cx,cy2] of cells)occ[cy2*W+cx]=1;const e={id:'d'+(nid++),t:'deco',x,y,f:it.f,fx:it.fx,fy:it.fy,sc:it.sc,ox:it.ox,oy:it.oy,flat:it.role==='Phủ nền',name:name||it.name,tile:it.tile,zb:it.zb};if(it.role==='Phủ nền')e.walk=true;if(it.zp)e.zp=it.zp;if(it.cv)e.cv=it.cv;ents.push(e);};
  const near=(cells,rad)=>cells.some(([x,y])=>pathCells.some(p=>Math.abs(p[0]-x)<rad&&Math.abs(p[1]-y)<rad));
  const place=(list,n,tries,mg,nearPath,name,key)=>{if(!list.length)return;for(let i=0;i<n;i++){const it=list[Math.floor(r()*list.length)];
      for(let t=0;t<tries;t++){const x=2+Math.floor(r()*(W-4)),y=2+Math.floor(r()*(H-4)),cells=bb(it,x,y);if(!cells.length||!ok(cells,mg))continue;if(nearPath&&!near(cells,7))continue;put(it,x,y,cells,name);info.placed[key]++;break;}}};
  const rn=(a,b)=>a+Math.floor(r()*(b-a+1));
  /* phòng + hành lang: tường dựng thành khung chữ nhật có cửa (kiểu địa cung / địa đạo / hầm mộ) */
  if(K.rooms){const wl=nm=>IT.find(i=>i.name===nm),WS=wl('Stone wall (S)'),WE=wl('Stone wall (E)'),DS=wl('Stone wall door (S)')||WS,DE=wl('Stone wall door (E)')||WE,CO=IT.find(i=>/^Stone wall corner/.test(i.name));
    if(WS&&WE){const nr=rn(K.rooms[0],K.rooms[1]),rects=[];
      for(let t=0;t<60&&rects.length<nr;t++){const w=rn(8,13),h=rn(6,9),x=rn(3,W-w-4),y=rn(3,H-h-4);if(rects.some(q=>x<q[0]+q[2]+3&&q[0]<x+w+3&&y<q[1]+q[3]+3&&q[1]<y+h+3))continue;if(Math.abs(x+w/2-sx)<w/2+3&&Math.abs(y+h/2-sy)<h/2+3)continue;rects.push([x,y,w,h]);}
      const wall=(it,x,y)=>{if(x<2||y<2||x>=W-2||y>=H-2)return;const cells=bb(it,x,y);if(cells.some(([a,b])=>occ[b*W+a]))return;put(it,x,y,cells,it.name.replace(/ \([SENW]\)/,''));info.placed.prop++;};
      for(const [x,y,w,h] of rects){const gx=[x+rn(2,w-3),x+rn(2,w-3)],gy=[y+rn(2,h-3),y+rn(2,h-3)];
        for(let i=0;i<=w;i++){for(const yy of [y,y+h]){const door=gx.includes(i)||gx.includes(i-1);if(!door)wall(WS,x+i,yy);}}
        for(let j=0;j<=h;j++){for(const xx of [x,x+w]){const door=gy.includes(j)||gy.includes(j-1);if(!door)wall(WE,xx,y+j);}}}}}
  place(by('Nhà'),rn(K.houses[0],K.houses[1])||0,300,1,true,null,'house');
  place(by('Vật'),rn(...(K.vat||[2,4])),160,1,false,null,'prop');
  place(by('Cây'),rn(K.trees[0],Math.min(K.trees[1],30)),100,0,false,'Cây','tree');
  place(by('Bụi'),rn(...(K.bush||[6,12])),100,0,false,'Bụi hoa','prop');
  {const DK=/lá|cánh|hoa|cỏ|rêu|dương xỉ|dược thảo|sen|vệt|vết|bóng|decal|leaf|moss|crack|stain|puddle|blood|hiệu ứng|sỏi|rubble|debris|bone/i,L=by('Phủ nền').filter(i=>(DK.test(i.name)&&!/mặt sau|Base|Planks|Floor|Steps/i.test(i.name))||/ · \d+$/.test(i.name));
    if(L.length){const n=rn(...(K.cover||[10,22]));info.placed.cover=0;for(let i=0;i<n;i++){const it=L[Math.floor(r()*L.length)];for(let t=0;t<40;t++){const x=2+Math.floor(r()*(W-4)),y=2+Math.floor(r()*(H-4)),cells=bb(it,x,y);if(!cells.length||cells.some(([a,b])=>occ[b*W+a]))continue;put(it,x,y,[],it.name);info.placed.cover++;break;}}}}
  for(let x=0;x<W;x++){blk[x]=1;blk[(H-1)*W+x]=1;}for(let y=0;y<H;y++){blk[y*W]=1;blk[y*W+W-1]=1;}
  ents.push({id:'s'+Date.now().toString(36),t:'start',x:sx,y:sy,name:'Xuất phát',tile:null});
  if(opt.goal){const e=pathCells[pathCells.length-3]||[W-3,cy];ents.push({id:'g'+Date.now().toString(36),t:'goal',x:e[0],y:e[1],name:'Đích',tile:null});}
  return {w:W,h:H,layers,blk,ents,newSheet:null,info,needSid:false,view:'iso',iso:true,zones:zonesOut};}

/* trả về {w,h,layers,blk,ents,newSheet:{canvas,tw}|null,info} — gọi bởi ed2d sau khi tạo sheet */
export function build(ctx,opt){
  if(ctx.nen)return buildIso(ctx,opt,ctx.catalog||null);
  if(ctx.catalog&&ctx.catalog.items&&(opt.view==='iso'||opt.view==='rpg'||!opt.view))return buildIso(ctx,opt,ctx.catalog);
  if(opt.view==='iso')return {error:'Chưa có danh mục tài nguyên isometric. Hãy mở "Màn 1 có sẵn" trước rồi tạo lại (bộ tự sinh không đoán nền theo màu nữa).'};
  const {sheets,enc}=ctx;const K=KINDS[opt.kind]||KINDS.village,r=Math.random,W=opt.w,H=opt.h;
  const P=scanPools(ctx);const VW=opt.view||'rpg',SIDE=VW==='side',TOP=VW==='top',ISOV=VW==='iso'&&P.isoG.length>0;
  if(ISOV){P.ground=P.isoG;P.water=P.isoW;}
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
  if(!SIDE)for(let i=0;i<W*H;i++){const g=(alt[1]&&r()<.07)?alt[1]:base;layers[0][i]=enc(g.sid,g.idx);}
  /* đường */
  const cy=Math.floor(H/2),A=Math.max(2,Math.floor(H/8)),ph=r()*6.28,fr=5+r()*4;let pathCells=[];
  if(pathT&&!SIDE)for(let x=1;x<W-1;x++){const y=cy+Math.round(A*Math.sin(x/fr+ph));for(let d=0;d<2;d++){const yy=Math.max(1,Math.min(H-2,y+d)),i=yy*W+x;layers[0][i]=enc(pathT.sid,pathT.idx);occ[i]=2;pathCells.push([x,yy]);}}
  if(pathT&&!SIDE&&K.paths>1){const bx=Math.floor(W*(.3+r()*.4)),y0=pathCells.find(p=>p[0]===bx);if(y0)for(let y=1;y<H-1;y++){const dir=y<y0[1]?-1:1;for(let d=0;d<2;d++){const xx=bx+d,i=y*W+xx;layers[0][i]=enc(pathT.sid,pathT.idx);if(!occ[i])occ[i]=2;}}}
  /* hồ */
  if(K.pond&&P.water.length&&!SIDE){const wt=pick(P.water,r);
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
  if(SIDE){
    const topT=pick(byK['cỏ']||byK[bk],r),subT=pick(byK['đất']||byK['đá']||byK[bk],r),ph=r()*6.28,gy=H-5;
    const sy=new Array(W);for(let x=0;x<W;x++)sy[x]=gy-Math.max(0,Math.round(1.2+1.2*Math.sin(x/6+ph)))+1;
    for(let x=2;x<7;x++)sy[x]=gy+1;
    const wlen=P.water.length?ri(r,5,8):0,wx=wlen?ri(r,Math.floor(W*.35),Math.floor(W*.6)):0,wt=wlen?pick(P.water,r):null;
    if(wlen)for(let x=wx;x<wx+wlen&&x<W-2;x++)sy[x]=gy+2;
    for(let x=0;x<W;x++){for(let y=sy[x];y<H;y++){const i=y*W+x;const isW=wlen&&x>=wx&&x<wx+wlen&&y===sy[x]&&wt;layers[0][i]=isW?enc(wt.sid,wt.idx):enc((y===sy[x]?topT:subT).sid,(y===sy[x]?topT:subT).idx);blk[i]=isW?0:1;}}
    const np=Math.max(2,Math.floor(W/14));for(let k=0;k<np;k++){const pw=ri(r,3,5),px=ri(r,4,W-pw-3),py=gy-ri(r,3,5);for(let x=px;x<px+pw;x++){const i=py*W+x;layers[0][i]=enc(topT.sid,topT.idx);blk[i]=1;}}
    const used=new Array(W).fill(0);const stand=(o,ex)=>{for(let t=0;t<60;t++){const x=ri(r,3,W-o.n-3);let ok=1,base0=sy[x];for(let xx=x-ex;xx<x+o.n+ex;xx++){if(xx<0||xx>=W||used[xx]||Math.abs(sy[xx]-base0)>0||(wlen&&xx>=wx-1&&xx<=wx+wlen)){ok=0;break;}}
        if(!ok)continue;for(let xx=x;xx<x+o.n;xx++)used[xx]=1;for(let rr=0;rr<o.m;rr++)for(let cc=0;cc<o.n;cc++){const yy=base0-o.m+rr;if(yy<1)continue;layers[2][yy*W+x+cc]=enc(ctx.newSid,o.base+rr*o.n+cc);}return true;}return false;};
    const nH2=ri(r,K.houses[0],K.houses[1]),nT2=ri(r,K.trees[0],K.trees[1]),nP2=ri(r,K.props[0],K.props[1]);
    if(Ho.length)for(let i=0;i<Math.min(nH2,Math.floor(W/14));i++)if(stand(pick(Ho,r),1))info.placed.house++;
    if(Tr.length)for(let i=0;i<nT2;i++)if(stand(pick(Tr,r),0))info.placed.tree++;
    if(Pr.length)for(let i=0;i<nP2;i++)if(stand(pick(Pr,r),0))info.placed.prop++;
    for(let x=0;x<W;x++)blk[x]=1;for(let y=0;y<H;y++){blk[y*W]=1;blk[y*W+W-1]=1;}
    ents.push({id:'s'+Date.now().toString(36),t:'start',x:3,y:sy[3]-1,name:'Xuất phát',tile:null});
    if(opt.goal)ents.push({id:'g'+Date.now().toString(36),t:'goal',x:W-4,y:sy[W-4]-1,name:'Đích',tile:null});
    return {w:W,h:H,layers,blk,ents,newSheet,info,needSid:!!newSheet,view:VW};}
  /* đặt vật */
  const free=(x,y,w,h,mg)=>{for(let yy=y-mg;yy<y+h+mg;yy++)for(let xx=x-mg;xx<x+w+mg;xx++){if(xx<0||yy<0||xx>=W||yy>=H)return false;if(occ[yy*W+xx]&&(xx>=x&&xx<x+w&&yy>=y&&yy<y+h||occ[yy*W+xx]!==1))return false;}return true;};
  const startX=2,startY=(pathCells[0]||[2,cy])[1];
  const place=(o,sidNew,fp,tries,nearPath)=>{for(let t=0;t<tries;t++){const x=ri(r,1,W-o.n-1),y=ri(r,1,H-o.m-1);if(Math.abs(x-startX)<5&&Math.abs(y-startY)<4)continue;
      if(nearPath){let ok=0;for(const p of pathCells)if(Math.abs(p[0]-(x+o.n/2))<7&&Math.abs(p[1]-(y+o.m))<6&&p[1]>y+o.m){ok=1;break;}if(!ok)continue;}
      if(!free(x,y,o.n,o.m,1))continue;
      for(let rr=0;rr<o.m;rr++)for(let cc=0;cc<o.n;cc++){const i=(y+rr)*W+x+cc,v=enc(sidNew,o.base+rr*o.n+cc);occ[i]=1;if(rr>=o.m-fp){layers[2][i]=v;blk[i]=1;}else layers[3][i]=v;}return true;}return false;};
  const sidNew=ctx.newSid;
  const nH=ri(r,K.houses[0],K.houses[1]),nT=ri(r,K.trees[0],K.trees[1]),nP=ri(r,K.props[0],K.props[1]);
  if(Ho.length)for(let i=0;i<nH;i++){const o=pick(Ho,r);if(place(o,sidNew,TOP?o.m:Math.min(2,o.m),300,true))info.placed.house++;}
  if(Tr.length)for(let i=0;i<nT;i++){const o=pick(Tr,r);if(place(o,sidNew,TOP?o.m:1,80,false))info.placed.tree++;}
  if(Pr.length)for(let i=0;i<nP;i++){const o=pick(Pr,r);if(place(o,sidNew,o.type==='Đồ vật'?1:0,60,false))info.placed.prop++;}
  /* ô nhỏ (1x1) khi không có vật lớn */
  const put1=(it,block)=>{for(let t=0;t<40;t++){const x=ri(r,1,W-2),y=ri(r,1,H-2),i=y*W+x;if(occ[i]||(Math.abs(x-startX)<4&&Math.abs(y-startY)<3))continue;occ[i]=1;layers[2][i]=enc(it.sid,it.idx);if(block)blk[i]=1;return true;}return false;};
  if(!Tr.length&&smallTr.length)for(let i=0;i<nT;i++)if(put1(pick(smallTr,r),1))info.placed.tree++;
  if(!Pr.length&&smallPr.length)for(let i=0;i<nP;i++)if(put1(pick(smallPr,r),0))info.placed.prop++;
  /* viền chặn */
  for(let x=0;x<W;x++){blk[x]=1;blk[(H-1)*W+x]=1;}for(let y=0;y<H;y++){blk[y*W]=1;blk[y*W+W-1]=1;}
  ents.push({id:'s'+Date.now().toString(36),t:'start',x:startX,y:startY,name:'Xuất phát',tile:null});
  if(opt.goal){const e=pathCells[pathCells.length-1]||[W-3,cy];ents.push({id:'g'+Date.now().toString(36),t:'goal',x:e[0],y:e[1],name:'Đích',tile:null});}
  return {w:W,h:H,layers,blk,ents,newSheet,info,needSid:!!newSheet,view:VW};}
