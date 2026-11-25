import {crossing} from './settlementBridge.js';

// The plan is in world cells. Artwork is fitted only after access and occupancy are checked.
const DIRECTIONS=[[-1,0,'N'],[0,-1,'E'],[1,0,'S'],[0,1,'W']];
const key=(x,y)=>x+':'+y;
const point=k=>k.split(':').map(Number);
const isValidSize=n=>Number.isInteger(n)&&n>=18&&n<=64;

export function networkVariant(cells,x,y){
  return DIRECTIONS.filter(([dx,dy])=>cells.has(key(x+dx,y+dy))).map(([, ,d])=>d).sort().join('');
}

function line(cells,x,y,u,v){
  if(x!==u&&y!==v)throw Error('Tuyến cần các đoạn nối vuông góc.');
  const dx=Math.sign(u-x),dy=Math.sign(v-y);
  cells.add(key(x,y));
  while(x!==u||y!==v){x+=dx;y+=dy;cells.add(key(x,y));}
}

function river(h,style,center,upper,lower){
  const cells=new Set();
  if(style==='land')return cells;
  if(style==='river'){
    for(let x=center-1;x<=center+1;x++)line(cells,x,-1,x,h);
  }else{
    line(cells,center+1,-1,center+1,upper);
    line(cells,center+1,upper,center,upper);
    line(cells,center,upper,center,lower);
    line(cells,center,lower,center+1,lower);
    line(cells,center+1,lower,center+1,h);
  }
  return cells;
}

export const settlementProfiles={
  market:'Phố chợ · đường vòng',
  outpost:'Trạm ven đường · ngã rẽ',
  trail:'Đường xuyên rừng · nhiều khúc ngoặt'
};

const pickInt=(rng,min,max)=>min+Math.floor(rng()*(max-min+1));
const shuffled=(items,rng)=>items.map(item=>({item,order:rng()})).sort((a,b)=>a.order-b.order).map(({item})=>item);

function layRoads(w,h,bank,profile,rng){
  const roads=new Set();
  const main=pickInt(rng,Math.floor(h*.39),Math.floor(h*.61));
  const leftBank=bank-2;
  let start=[1,main],goal=[w-2,main];
  if(profile==='trail'){
    const sign=rng()<.5?-1:1;
    const first=pickInt(rng,3,Math.floor(leftBank*.43));
    const next=pickInt(rng,first+2,leftBank);
    const startY=main+sign*pickInt(rng,3,Math.floor(h*.27));
    const innerY=main-sign*pickInt(rng,3,Math.floor(h*.26));
    start=[1,startY];
    line(roads,...start,first,startY);
    line(roads,first,startY,first,innerY);
    line(roads,first,innerY,next,innerY);
    line(roads,next,innerY,next,main);
    line(roads,next,main,...goal);
  }else{
    line(roads,...start,...goal);
    const x=pickInt(rng,3,Math.max(3,Math.floor(leftBank*.42)));
    const side=rng()<.5?-1:1;
    const y=main+side*pickInt(rng,4,Math.floor(h/3));
    line(roads,x,main,x,y);
    if(profile==='market'){
      const end=pickInt(rng,Math.max(x+3,leftBank-4),leftBank);
      line(roads,x,y,end,y);
      line(roads,end,y,end,main);
    }else{
      const end=pickInt(rng,x+2,leftBank);
      line(roads,x,y,end,y);
      goal=[end,y];
    }
  }
  return {roads,start,goal,main};
}

export function planSettlement(w,h,lots,style,rng,profile='market',terrainRules){
  if(!isValidSize(w)||!isValidSize(h))throw Error('Chiều rộng và chiều cao cần từ 18 đến 64 ô.');
  if(!Object.hasOwn(settlementProfiles,profile))throw Error('Kiểu màn không hợp lệ.');
  const riverX=pickInt(rng,Math.floor(w*.61),Math.floor(w*.71));
  const {roads,start,goal,main}=layRoads(w,h,riverX,profile,rng);
  const water=river(h,style,riverX,pickInt(rng,2,main-2),pickInt(rng,main+2,h-3));
  const route=[...roads].map(point);
  const bridge=crossing(route.filter(([x,y])=>water.has(key(x,y))));
  const acceptsLot=terrainRules?.lots(route,bridge);
  const occupied=new Set(),houseFootprints=new Set(),accesses=[],buildings=[],groves=[],yards=[];
  const onMap=(x,y)=>x>0&&x<w-1&&y>0&&y<h-1;
  const open=(x,y)=>onMap(x,y)&&![roads,water,occupied].some(set=>set.has(key(x,y)));
  const touchesWater=(x,y)=>DIRECTIONS.some(([dx,dy])=>water.has(key(x+dx,y+dy)));
  const frontages=shuffled([...roads].filter(k=>!water.has(k)&&k!==key(...start)&&k!==key(...goal)).flatMap(k=>{
    const [x,y]=point(k);
    return DIRECTIONS.map(([dx,dy])=>({x,y,dx,dy}));
  }),rng);
  const limit={market:10,outpost:7,trail:5}[profile];
  // Each frontage reserves an approach from a connected road before receiving a plot.
  for(const lot of lots){
    if(buildings.length>=limit)break;
    for(const {x,y,dx,dy} of frontages){
      const front=[x+dx,y+dy];
      if(!open(...front)||touchesWater(...front))continue;
      const left=dx<0?x-1-lot.w:dx>0?x+2:x-Math.floor(lot.w/2);
      const top=dy<0?y-1-lot.h:dy>0?y+2:y-Math.floor(lot.h/2);
      if(left<2||top<2)continue;
      const plot=[];
      for(let v=top;v<top+lot.h;v++)for(let u=left;u<left+lot.w;u++)plot.push([u,v]);
      if(!plot.every(([u,v])=>open(u,v)&&!DIRECTIONS.some(([du,dv])=>houseFootprints.has(key(u+du,v+dv))))||acceptsLot&&!acceptsLot(lot,left,top))continue;
      roads.add(key(...front));
      for(const [u,v] of plot){occupied.add(key(u,v));houseFootprints.add(key(u,v));}
      accesses.push(front);
      buildings.push({x:left,y:top,lot,front});
      break;
    }
  }

  for(const {x,y,dx,dy} of frontages){
    if(yards.length>=2)break;
    const front=[x+dx,y+dy],u=x+2*dx,v=y+2*dy;
    const cells=[[u,v],[u+dx,v+dy],[u-dy,v+dx],[u+dy,v-dx]];
    if(!open(...front)||touchesWater(...front)||!cells.every(([a,b])=>open(a,b)))continue;
    roads.add(key(...front));
    accesses.push(front);
    cells.forEach(([a,b])=>occupied.add(key(a,b)));
    yards.push(cells);
  }

  const preferOpenLand=profile==='trail'?7:4;
  for(let attempt=0;attempt<60&&groves.length<preferOpenLand;attempt++){
    const cx=pickInt(rng,3,w-4),cy=pickInt(rng,3,h-4);
    if(!open(cx,cy))continue;
    const cells=[];
    for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++){
      if(Math.abs(x-cx)+Math.abs(y-cy)>2||!open(x,y)||rng()<.15)continue;
      if(DIRECTIONS.some(([dx,dy])=>roads.has(key(x+dx,y+dy))))continue;
      cells.push([x,y]);
    }
    if(cells.length<4)continue;
    cells.forEach(([x,y])=>occupied.add(key(x,y)));
    groves.push(cells);
  }
  const blocked=new Array(w*h).fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=key(x,y);
    blocked[y*w+x]=Number(!onMap(x,y)||water.has(k)&&!roads.has(k)||houseFootprints.has(k));
  }
  const queue=[start],seen=new Set([key(...start)]);
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    for(const [dx,dy] of DIRECTIONS){
      const u=x+dx,v=y+dy,k=key(u,v);
      if(!onMap(u,v)||blocked[v*w+u]||!roads.has(k)||seen.has(k))continue;
      seen.add(k);queue.push([u,v]);
    }
  }
  if([goal,...accesses].some(p=>!seen.has(key(...p))))
    throw Error('Lối vào công trình hoặc điểm đích bị tách khỏi đường chính.');
  const bridges=[...roads].filter(k=>water.has(k)).map(point);
  return {roads,route,bridge,water,riverX,blocked,start,goal,bridges,accesses,buildings,groves,yards};
}

export function settlementTile(plan,x,y,style,{raised=false}={}){
  const cell=key(x,y);
  const flooded=plan.water.has(cell);
  if(plan.roads.has(cell)&&!flooded){
    const variant=networkVariant(plan.roads,x,y);
    if(variant.length===4)return 'crossroad';
    if(variant.length===3)return 'crossroad'+({ENS:'NES',ENW:'NEW'}[variant]||variant);
    if(variant.length===2)return 'road'+(variant==='EN'?'NE':variant);
    return 'end'+variant;
  }
  if(plan.roads.has(cell)&&flooded&&!raised)return 'bridgeNS';
  if(!plan.water.has(cell))return null;
  if(style==='river'){
    if(x===plan.riverX-1)return 'waterN';
    if(x===plan.riverX+1)return 'waterS';
    return 'water';
  }
  const variant=networkVariant(plan.water,x,y);
  return 'river'+(variant==='EN'?'NE':variant);
}
