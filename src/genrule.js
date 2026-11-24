/* Dựng bối cảnh theo NGUYÊN TẮC (bố cục trước, tường suy ra từ bố cục, đồ đặt có luật, tự kiểm).
   Dùng bộ Kenney (nền + vật thể). Kết quả {w,h,layers,blk,ents,report,ok}. */
const mk=s=>{let a=s>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const DIRS=['-nam','-đông','-bắc','-tây'];
const K=(x,y)=>x+','+y;
const N4=[[1,0],[-1,0],[0,1],[0,-1]];

export const RULES={
  dungeon:{name:'⛓ Địa lao (phòng + hành lang)',type:'rooms',nen:'kenney-dia-lao',vats:['kenney-dia-lao'],
    floor:['stone'],floorRare:'stonetile-nam',walls:[['stoneWall',68],['stoneWallAged',16],['stoneWallBroken',6],['stoneWallWindow',6,1],['stoneWallWindowBars',4,1]],
    corner:'stoneWallCorner',arch:'stoneWallArchway',wallProps:['barrelsStacked','barrels','woodenCrate','woodenCrates','barrel','woodenPile'],
    centerProps:['tableRoundChairs','tableChairsBroken','chair'],column:'stoneColumn',dens:.08,chest:['kenney-dia-lao','chestClosed'],goal:['kenney-dia-lao','stairsSpiral']},
  library:{name:'📚 Thư viện (phòng + hành lang)',type:'rooms',nen:'kenney-dia-lao',vats:['kenney-thu-vien','kenney-dia-lao'],
    floor:['planks'],floorRare:'planksbroken-nam',walls:[['wallBooks',40],['bookcaseBooks',20],['bookcaseHalfBooks',10],['bookcaseEmpty',8],['bookcaseBooksLadder',10],['bookcaseGlass',12]],
    corner:null,arch:'wallDoorway',wallProps:['bookStand','candleStand','candleStandDouble','displayCase','displayCaseBooks','displayCaseSword'],
    centerProps:['longTableDecoratedChairs','longTableChairs','longTable','longTableDecoratedChairsBooks','libraryChair'],carpet:'floorCarpet',dens:.07,
    chest:['kenney-dia-lao','chestClosed'],goal:['kenney-dia-lao','stairsSpiral']},
  farm:{name:'🌾 Nông trại (sân + ruộng + nhà kho)',type:'yard',nens:['kenney-co','kenney-nong-trai'],vats:['kenney-nong-trai'],
    chest:['kenney-nong-trai','ladderStand'],goal:['kenney-nong-trai','ladderStand']},
};
export const RULE_TEXT=[
 '1. Bố cục trước, đồ sau: vẽ phòng/hành lang (hoặc sân + công trình) rồi mới suy ra tường và đặt đồ.',
 '2. Tường chỉ ở hai cạnh sau (bắc, tây) để không che nhân vật; tường suy ra tự động từ rìa sàn.',
 '3. Hành lang rộng 2 ô; chỗ nối phòng–hành lang có khung cửa, trước/sau cửa luôn trống.',
 '4. Đồ dựa tường hoặc đặt thưa giữa phòng, không chồng ô, cách mỗi cửa ≥1 ô; mật độ ≤15% phòng.',
 '5. Xuất phát và đích ở hai đầu xa nhất; rương ở nhánh phụ; luôn có đường đi rộng (chừa 1 ô quanh đồ).',
 '6. Ô ngoài sàn bị chặn; kho/nhà chỉ vào bằng cổng; tự kiểm rồi dựng lại tới khi đạt.'];

/* ---------- tra tài nguyên ---------- */
async function loadAll(ctx,prof){
  const L={nen:{},vat:{}};
  for(const id of (prof.nens||[prof.nen])){const r=await ctx.ensureNen(id);L.nen[id]={sid:r.sid,idx:r.pk.idx};}
  for(const id of prof.vats){await ctx.ensureVat(id);const pk=await ctx.vatPack(id);const sid=ctx.sheets().findIndex((s,i)=>i>=4&&s.name==='Vat-'+id);L.vat[id]={sid,items:pk.items};}
  return L;}
function item(L,pid,k,d){const v=L.vat[pid];if(!v)throw new Error('thiếu gói '+pid);let it=v.items.find(i=>i.k===k&&(!d||i.d===d))||v.items.find(i=>i.k===k);if(!it)throw new Error('thiếu mảnh '+k+' ('+pid+')');return [v.sid,it];}
function findItem(L,k,d){for(const pid of Object.keys(L.vat)){const v=L.vat[pid],it=v.items.find(i=>i.k===k&&(!d||i.d===d))||v.items.find(i=>i.k===k);if(it)return [pid,v.sid,it];}throw new Error('thiếu mảnh '+k);}

class Ctx{
  constructor(ctx,L,W,H,rnd){this.c=ctx;this.L=L;this.W=W;this.H=H;this.rnd=rnd;this.l0=new Array(W*H).fill(0);this.ents=[];this.n=0;this.fl=new Set();this.props=[];this.arches=[];this.zones={};this.chests=[];this.walk=null;}
  floor(pid,key,x,y){const n=this.L.nen[pid];this.l0[y*this.W+x]=this.c.enc(n.sid,n.idx[key]);}
  put(k,d,x,y,prop){const [pid,sid,it]=findItem(this.L,k,d);this.n++;
    this.ents.push(Object.assign({id:'g'+this.n,t:'deco',x,y,f:1,fx:it.fx,fy:it.fy,sc:it.sc,ox:0,oy:it.oy||0,flat:it.role==='Phủ nền',name:it.name,tile:{sid,idx:it.i},zb:it.zb},it.role==='Phủ nền'?{walk:true}:{}));
    if(prop)this.props.push([x,y,k]);}
  special(spec,kind,x,y,name,extra){const [pid,k]=spec;const [sid,it]=item(this.L,pid,k,'S');this.ents.push(Object.assign({id:kind[0]+x+'_'+y,t:kind,x,y,name,tile:{sid,idx:it.i}},extra||{}));}
}
const pickW=(rnd,list,end)=>{const L=list.filter(a=>!(end&&a[2]));let s=0;for(const a of L)s+=a[1];let r=rnd()*s;for(const a of L){r-=a[1];if(r<0)return a[0];}return L[0][0];};
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));

/* ================= PHÒNG + HÀNH LANG ================= */
function layoutRooms(rnd,size){
  const [cols,rows]={s:[3,2],m:[4,3],l:[5,3]}[size]||[4,3],cw=14,ch=12,W=cols*cw+4,H=rows*ch+4;
  const want=Math.max(3,Math.round(cols*rows*(size==='s'?.85:.7)));
  for(let att=0;att<800;att++){
    const cells=[],par=[];let first=[ri(rnd,0,cols-1),ri(rnd,0,rows-1)];cells.push(first);par.push(-1);
    while(cells.length<want){const i=ri(rnd,0,cells.length-1),[c,r]=cells[i],d=N4[ri(rnd,0,3)],n=[c+d[0],r+d[1]];
      if(n[0]<0||n[1]<0||n[0]>=cols||n[1]>=rows||cells.some(q=>q[0]===n[0]&&q[1]===n[1]))continue;cells.push(n);par.push(i);}
    const rooms=cells.map(([c,r])=>{const w=ri(rnd,6,10),h=ri(rnd,5,8),x0=2+c*cw+2+ri(rnd,0,cw-4-w),y0=2+r*ch+2+ri(rnd,0,ch-4-h);return{x0,y0,x1:x0+w-1,y1:y0+h-1,c,r};});
    const halls=[];let ok=true;
    for(let i=1;i<rooms.length&&ok;i++){const a=rooms[par[i]],b=rooms[i];
      if(a.c!==b.c){const L=a.c<b.c?a:b,R=a.c<b.c?b:a,lo=Math.max(L.y0,R.y0),hi=Math.min(L.y1,R.y1);if(hi-lo<1){ok=false;break;}const y=ri(rnd,lo,hi-1);halls.push({x0:L.x1+1,y0:y,x1:R.x0-1,y1:y+1,a:par[i],b:i});}
      else{const T=a.r<b.r?a:b,Bm=a.r<b.r?b:a,lo=Math.max(T.x0,Bm.x0),hi=Math.min(T.x1,Bm.x1);if(hi-lo<1){ok=false;break;}const x=ri(rnd,lo,hi-1);halls.push({x0:x,y0:T.y1+1,x1:x+1,y1:Bm.y0-1,a:par[i],b:i});}}
    if(ok)return{W,H,rooms,halls,par};}
  return null;}

function buildRooms(ctx,prof,opt,seed){
  const rnd=mk(seed),lay=layoutRooms(rnd,opt.size);if(!lay)return null;
  const {W,H,rooms,halls,par}=lay,B=new Ctx(ctx,ctx._L,W,H,rnd);
  const region=new Map();
  rooms.forEach((r,i)=>{for(let y=r.y0;y<=r.y1;y++)for(let x=r.x0;x<=r.x1;x++){B.fl.add(K(x,y));region.set(K(x,y),i);}});
  halls.forEach(h=>{for(let y=h.y0;y<=h.y1;y++)for(let x=h.x0;x<=h.x1;x++){B.fl.add(K(x,y));region.set(K(x,y),'h');}});
  const has=(x,y)=>B.fl.has(K(x,y));
  for(const key of B.fl){const [x,y]=key.split(',').map(Number),v=prof.floorRare&&rnd()>.97?prof.floorRare:prof.floor[0]+DIRS[ri(rnd,0,3)];B.floor(prof.nen,v,x,y);}
  /* khung cửa: mọi cạnh giữa hai vùng khác nhau */
  const arch=new Set();
  for(const key of B.fl){const [x,y]=key.split(',').map(Number);
    if(has(x,y-1)&&region.get(K(x,y-1))!==region.get(key))arch.add(x+','+y+',S');
    if(has(x-1,y)&&region.get(K(x-1,y))!==region.get(key))arch.add(x+','+y+',E');}
  /* tường: chỉ cạnh bắc (S) và cạnh tây (E) suy ra từ rìa sàn */
  const isEnd=(x,y,d)=>d==='S'?(has(x-1,y-1)||has(x+1,y-1)||!has(x-1,y)||!has(x+1,y)):(has(x-1,y-1)||has(x-1,y+1)||!has(x,y-1)||!has(x,y+1));
  const sorted=[...B.fl].map(s=>s.split(',').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  for(const [x,y] of sorted){const nv=!has(x,y-1),wv=!has(x-1,y);
    if(nv&&wv&&prof.corner){B.put(prof.corner,'S',x,y);continue;}
    if(nv&&!arch.has(x+','+y+',S'))B.put(pickW(rnd,prof.walls,isEnd(x,y,'S')||(nv&&wv)),'S',x,y);
    if(wv&&!arch.has(x+','+y+',E'))B.put(pickW(rnd,prof.walls,isEnd(x,y,'E')||(nv&&wv)),'E',x,y);}
  for(const a of arch){const [x,y,d]=a.split(',');B.put(prof.arch,d,+x,+y);B.arches.push([d,+x,+y]);}
  /* xuất phát/đích ở hai đầu xa nhất của cây phòng */
  const adj=rooms.map(()=>[]);par.forEach((p,i)=>{if(p>=0){adj[p].push(i);adj[i].push(p);}});
  const bfs=s=>{const d=rooms.map(()=>-1);d[s]=0;const q=[s];while(q.length){const c=q.shift();for(const n of adj[c])if(d[n]<0){d[n]=d[c]+1;q.push(n);}}return d;};
  let d0=bfs(0),a=d0.indexOf(Math.max(...d0)),da=bfs(a),b=da.indexOf(Math.max(...da));
  const startRoom=a,goalRoom=b,leaves=rooms.map((_,i)=>i).filter(i=>adj[i].length===1&&i!==a&&i!==b);
  let chestRooms=leaves.slice(0,2);if(!chestRooms.length)chestRooms=rooms.map((_,i)=>i).filter(i=>i!==a&&i!==b).slice(0,1);if(!chestRooms.length)chestRooms=[b];
  /* ô cách cửa 2 ô (cửa + sau cửa + trong phòng) bị cấm đồ */
  const forbid=new Set();
  for(const [d,x,y] of B.arches){const bh=d==='E'?[x-1,y]:[x,y-1],c2=d==='E'?[x+1,y]:[x,y+1];[[x,y],bh,c2].forEach(c=>forbid.add(K(c[0],c[1])));
    const side=d==='E'?[[x,y-1],[x,y+1]]:[[x-1,y],[x+1,y]];}
  const pick=(r,avoid)=>{const cs=[];for(let y=r.y0+1;y<=r.y1-1;y++)for(let x=r.x0+1;x<=r.x1-1;x++)if(!forbid.has(K(x,y))&&!avoid.has(K(x,y)))cs.push([x,y]);return cs.length?cs[ri(rnd,0,cs.length-1)]:[(r.x0+r.x1)>>1,(r.y0+r.y1)>>1];};
  const sp=new Set(),R=rooms,cx=r=>[(r.x0+r.x1)>>1,(r.y0+r.y1)>>1];
  let sCell=[R[startRoom].x0+1,R[startRoom].y1-1];if(forbid.has(K(...sCell)))sCell=pick(R[startRoom],sp);sp.add(K(...sCell));
  let gCell=cx(R[goalRoom]);if(forbid.has(K(...gCell)))gCell=pick(R[goalRoom],sp);sp.add(K(...gCell));
  const cCells=chestRooms.map(i=>{const r=R[i];let c=[r.x1-1,r.y0+1];if(forbid.has(K(...c))||sp.has(K(...c)))c=pick(r,sp);sp.add(K(...c));return c;});
  B.start=sCell;B.goal=gCell;
  /* đồ: cột đối xứng (phòng lớn) + đồ dựa tường + đồ thưa giữa phòng */
  const taken=new Set(sp);
  const free=(x,y)=>has(x,y)&&region.get(K(x,y))!=='h'&&!forbid.has(K(x,y))&&!taken.has(K(x,y));
  const placeProps=()=>{
    for(const k of B.props)taken.delete(K(k[0],k[1]));B.props=[];B.ents=B.ents.filter(e=>!e._p);const mark=B.ents.length;
    R.forEach((r,i)=>{const w=r.x1-r.x0+1,h=r.y1-r.y0+1,area=w*h;let n=Math.round(area*prof.dens*(.7+rnd()*.6));if(i===startRoom)n=Math.max(2,n-2);
      const add=(k,d,x,y)=>{B.put(k,d,x,y,true);B.ents[B.ents.length-1]._p=1;taken.add(K(x,y));n--;};
      if(prof.column&&w>=9&&h>=7){for(const [x,y] of [[r.x0+2,r.y0+2],[r.x1-2,r.y0+2],[r.x0+2,r.y1-2],[r.x1-2,r.y1-2]])if(free(x,y))add(prof.column,'S',x,y);}
      let guard=0;
      while(n>0&&guard++<60){const wallish=rnd()<.6,list=wallish?prof.wallProps:prof.centerProps,k=list[ri(rnd,0,list.length-1)];let x,y,d='S';
        if(wallish){if(rnd()<.5){x=ri(rnd,r.x0,r.x1);y=r.y0;}else{x=r.x0;y=ri(rnd,r.y0,r.y1);d='E';}}else{x=ri(rnd,r.x0+2,Math.max(r.x0+2,r.x1-2));y=ri(rnd,r.y0+2,Math.max(r.y0+2,r.y1-2));}
        if(!free(x,y))continue;
        let near=false;for(let yy=y-1;yy<=y+1&&!near;yy++)for(let xx=x-1;xx<=x+1;xx++)if(taken.has(K(xx,yy))&&!sp.has(K(xx,yy))){near=true;break;}
        if(near&&!wallish)continue;add(k,d,x,y);}
      if(prof.carpet&&w>=7&&h>=6&&i!==startRoom&&rnd()<.8){const cy=ri(rnd,r.y0+2,r.y1-3),x0=r.x0+2;for(let xx=x0;xx<=r.x1-2;xx++)for(let yy=cy;yy<=cy+1;yy++)if(!taken.has(K(xx,yy))&&!forbid.has(K(xx,yy)))B.put(prof.carpet,null,xx,yy,false);}});
  };
  placeProps();
  B.chests=cCells;B.zones={};R.forEach((r,i)=>{B.zones['Phòng '+(i+1)]=[r.x0,r.y0,r.x1,r.y1,.15];});
  B.blk=new Array(W*H).fill(1);for(const key of B.fl){const [x,y]=key.split(',').map(Number);B.blk[y*W+x]=0;}
  B.walk=new Set(B.fl);B.openings=B.arches.map(a=>[a[1],a[2],a[0]]);
  finishSpecials(B,prof);
  /* tự gỡ đồ chắn đường cho tới khi đạt phép thông tuyến rộng */
  let rep=check(B);
  while(!rep.ok&&B.props.length){const i=ri(rnd,0,B.props.length-1),p=B.props.splice(i,1)[0];const j=B.ents.findIndex(e=>e._p&&e.x===p[0]&&e.y===p[1]);if(j>=0)B.ents.splice(j,1);rep=check(B);}
  return Object.assign(B,{rep,rooms:R.length});
}

function finishSpecials(B,prof){
  const mkp=B.props;B._pk=(e,p)=>true;
  B.chests.forEach(([x,y])=>B.special(prof.chest,'chest',x,y,'Rương',{gives:'hp',amt:2}));
  B.special(prof.goal,'goal',B.goal[0],B.goal[1],'Đích');
  B.ents.push({id:'s0',t:'start',x:B.start[0],y:B.start[1],name:'Xuất phát',tile:null});
}

/* ================= SÂN + RUỘNG + NHÀ KHO ================= */
function buildYard(ctx,prof,opt,seed){
  const rnd=mk(seed),[W,H]={s:[32,24],m:[40,30],l:[52,38]}[opt.size]||[40,30],B=new Ctx(ctx,ctx._L,W,H,rnd),G='kenney-co',F='kenney-nong-trai';
  const X0=2,Y0=2,X1=W-3,Y1=H-3;
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){B.fl.add(K(x,y));B.floor(G,'grass'+DIRS[ri(rnd,0,3)],x,y);}
  const bw=ri(rnd,8,10),bh=ri(rnd,6,8),bx1=X1-2-ri(rnd,0,2),bx0=bx1-bw+1,by0=4+ri(rnd,0,2),by1=by0+bh-1;
  const dy=by0+ri(rnd,2,bh-4),sx=4,sy=Y1-3,px=bx0-5;
  const path=new Set(),addP=(x,y)=>{if(x>=X0&&x<=X1&&y>=Y0&&y<=Y1)path.add(K(x,y));};
  for(let y=sy-1;y<=sy+1;y++)for(let x=sx-1;x<=sx+2;x++)addP(x,y);
  for(const y of [sy,sy-1])for(let x=sx;x<=px+1;x++)addP(x,y);
  for(let y=dy;y<=sy;y++){addP(px,y);addP(px+1,y);}
  for(const y of [dy,dy+1])for(let x=px;x<bx0;x++)addP(x,y);
  for(const k of path){const [x,y]=k.split(',').map(Number);B.floor(F,'dirt'+DIRS[ri(rnd,0,3)],x,y);}
  /* ruộng */
  const fw=Math.min(8,px-3-8+1),fh=6,fy0=ri(rnd,Math.max(by0+3,8),Math.max(Math.max(by0+3,8),sy-3-fh)),fx0=8;
  const field=[];if(fw>=4)for(let y=fy0;y<fy0+fh;y++)for(let x=fx0;x<fx0+fw;x++)field.push([x,y]);
  const chestField=field.length?[fx0+(fw>>1),fy0+(fh>>1)]:null;
  const noProp=new Set([...path]);
  for(const [x,y] of field){B.floor(F,'dirtfarmland-nam',x,y);noProp.add(K(x,y));}
  for(const [x,y] of field)if((x+y)%2===0&&!(chestField&&x===chestField[0]&&y===chestField[1]))B.put(['corn','cornYoung','cornDouble','corn'][ri(rnd,0,3)],null,x,y,false);
  if(field.length){for(let x=fx0;x<fx0+fw;x++)B.put('fenceLow','S',x,fy0);const gap=fy0+(fh>>1)-1;for(let y=fy0;y<fy0+fh;y++)if(y!==gap&&y!==gap+1)B.put('fenceLow','E',fx0,y);}
  /* rào biên khu: cạnh bắc + tây */
  for(let x=X0;x<=X1;x++)B.put(x===X0?'fenceHigh':(rnd()>.12?'fenceLow':'fenceLowBroken'),'S',x,Y0);
  for(let y=Y0+1;y<=Y1;y++)B.put(rnd()>.12?'fenceLow':'fenceLowBroken','E',X0,y);
  /* nhà kho: tường S + E (cổng ở cạnh tây) */
  const inK=(x,y)=>x>=bx0&&x<=bx1&&y>=by0&&y<=by1;
  for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++)B.floor(F,'planks-nam',x,y);
  B.put('woodWallCorner','S',bx0,by0);
  const seq=['woodWall','woodWallWindow','woodWall','woodWall','woodWallWindowGlass','woodWall','woodWall'];
  for(let i=1;i<bw;i++)B.put(seq[(i-1)%seq.length],'S',bx0+i,by0);
  B.arches=[];for(let y=by0+1;y<=by1;y++){if(y===dy||y===dy+1){B.put('woodWallGateOpen','E',bx0,y);B.arches.push(['E',bx0,y]);}else B.put(['woodWall','woodWall','woodWallWindow'][y%3],'E',bx0,y);}
  for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++)noProp.add(K(x,y));
  B.put('chimneyBase',null,bx1,by0+1,true);
  const gx=bx0+ri(rnd,4,bw-3),gy=by0+2,cx2=bx1-1,cy2=by1-1;
  B.start=[sx+1,sy];B.goal=[gx,gy];B.chests=[chestField||[X0+3,Y0+5],[cx2,cy2]];
  const sp=new Set([K(...B.start),K(...B.goal),...B.chests.map(c=>K(...c))]);
  /* đồ trong kho (thưa) và ngoài sân (rất thưa) */
  const inner=[];for(let y=by0+1;y<=by1;y++)for(let x=bx0+2;x<=bx1;x++)if(!sp.has(K(x,y))&&!(x===bx1&&y===by0+1)&&Math.abs(x-gx)+Math.abs(y-gy)>1&&!(x<=bx0+2&&(y===dy||y===dy+1)))inner.push([x,y]);
  const KP=['hayBalesStacked','hayBales','sack','hay','sacksCrate'];
  for(let i=0;i<5&&inner.length;i++){const j=ri(rnd,0,inner.length-1),[x,y]=inner.splice(j,1)[0];if(B.props.some(p=>Math.abs(p[0]-x)<=1&&Math.abs(p[1]-y)<=1))continue;B.put(KP[ri(rnd,0,4)],null,x,y,true);}
  const YP=['hay','hayBales','sacksCrate','hayBalesStacked','sack'];
  for(let i=0,n=Math.round(W*H/70);i<n;i++)for(let t=0;t<30;t++){const x=ri(rnd,X0+2,X1-2),y=ri(rnd,Y0+3,Y1-2);if(noProp.has(K(x,y))||sp.has(K(x,y)))continue;let bad=false;
    for(let yy=y-1;yy<=y+1&&!bad;yy++)for(let xx=x-1;xx<=x+1;xx++)if(noProp.has(K(xx,yy))||(B.props.some(p=>p[0]===xx&&p[1]===yy)))bad=true;
    if(bad||inK(x,y)||(x===bx1+1)||(y===by1+1))continue;B.put(YP[ri(rnd,0,4)],null,x,y,true);break;}
  B.blk=new Array(W*H).fill(1);for(const key of B.fl){const [x,y]=key.split(',').map(Number);B.blk[y*W+x]=0;}
  for(let x=bx0;x<=bx1;x++)B.blk[(by1+1)*W+x]=1;for(let y=by0;y<=by1+1;y++)B.blk[y*W+bx1+1]=1;
  B.walk=new Set([...B.fl].filter(k=>{const [x,y]=k.split(',').map(Number);return !B.blk[y*W+x];}));
  B.openings=B.arches.map(a=>[a[1],a[2],a[0]]);
  B.zones={'Nhà kho':[bx0,by0,bx1,by1,.15],'Sân':[X0,Y0,X1,Y1,.10]};if(field.length)B.zones['Ruộng']=[fx0,fy0,fx0+fw-1,fy0+fh-1,.10];
  finishSpecials(B,prof);
  B.rep=check(B);return Object.assign(B,{rooms:1});
}

/* ================= KIỂM TỰ ĐỘNG ================= */
export function check(b){
  const rep=[];let ok=true;const add=(n,c,d)=>{rep.push([n,!!c,d||'']);ok=ok&&!!c;};
  const pc=new Set(b.props.map(p=>K(p[0],p[1]))),cnt={};b.props.forEach(p=>{const k=K(p[0],p[1]);cnt[k]=(cnt[k]||0)+1;});
  add('Không đồ chồng ô',Object.values(cnt).every(v=>v===1));
  add('Đồ nằm trong vùng đi được',[...pc].every(c=>b.fl.has(c)));
  const sp=[...b.chests.map(c=>K(...c)),K(...b.goal),K(...b.start)];
  add('Rương/đích/xuất phát không đè đồ',!sp.some(c=>pc.has(c)));
  const bfs=(src,blocked)=>{const vis=new Set([K(...src)]),q=[src];while(q.length){const c=q.pop();for(const [dx,dy] of N4){const n=[c[0]+dx,c[1]+dy],k=K(...n);if(b.walk.has(k)&&!blocked.has(k)&&!vis.has(k)){vis.add(k);q.push(n);}}}return vis;};
  const vis=bfs(b.start,pc),wide=new Set(pc);for(const c of pc){const [x,y]=c.split(',').map(Number);for(const [dx,dy] of N4)wide.add(K(x+dx,y+dy));}wide.delete(K(...b.start));
  const visw=bfs(b.start,wide);
  add('Thông tuyến xuất phát → đích',vis.has(K(...b.goal)));
  add('Thông tuyến rộng (chừa 1 ô quanh đồ)',visw.has(K(...b.goal)));
  for(const c of b.chests)add('Rương ('+c+') tới được',vis.has(K(...c)));
  const bad=[];for(const [x,y,d] of b.openings){const bh=d==='E'?[x-1,y]:[x,y-1],c2=d==='E'?[x+1,y]:[x,y+1];for(const c of [[x,y],bh,c2])if(pc.has(K(...c)))bad.push(c);}
  add('Trước/sau cửa không có đồ',!bad.length);
  for(const [n,z] of Object.entries(b.zones)){const area=(z[2]-z[0]+1)*(z[3]-z[1]+1);let c=0;for(const k of pc){const [x,y]=k.split(',').map(Number);if(x>=z[0]&&x<=z[2]&&y>=z[1]&&y<=z[3])c++;}
    add('Mật độ '+n+': '+c+'/'+area+' = '+Math.round(100*c/area)+'% (≤'+Math.round(z[4]*100)+'%)',c/area<=z[4]);}
  return {ok,rep};
}

/* ================= CỔNG VÀO ================= */
export async function genRule(ctx,kind,opt){
  const prof=RULES[kind];if(!prof)return{error:'Kiểu không có'};
  const L=await loadAll(ctx,prof);ctx._L=L;
  const base=(opt.seed!=null?opt.seed:Math.floor(Math.random()*1e9));let best=null,tries=0;
  for(let s=0;s<60;s++){tries++;let b=null;try{b=prof.type==='rooms'?buildRooms(ctx,prof,opt,base+s*7919):buildYard(ctx,prof,opt,base+s*7919);}catch(e){console.error(e);return{error:'Lỗi dựng: '+(e&&e.message||e)};}
    if(!b)continue;if(!best||b.rep.ok&&!best.rep.ok)best=b;if(b.rep.ok){best=b;break;}}
  if(!best)return{error:'Không dựng được bố cục, thử lại.'};
  const b=best,N=b.W*b.H;
  const layers=[b.l0,new Array(N).fill(0),new Array(N).fill(0),new Array(N).fill(0)];
  return{w:b.W,h:b.H,layers,blk:b.blk,ents:b.ents.map(e=>{const o=Object.assign({},e);delete o._p;return o;}),report:b.rep.rep,ok:b.rep.ok,tries,rooms:b.rooms,seed:base};
}
