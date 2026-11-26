import {planSurface,surfaceKinds as ground} from './surfaceTerrain.js';
import {rasterOutline} from './mapCollision.js';
import {decoZones,zonesHit} from './zones.js';
import {portalAnchor,isMapLink} from './wall2d.js';
import {linkWalkability} from './mapLinks2d.js';

export const kenneyOutlinePacks=[
  ['dungeon','stone',['tableRoundItemsChairs','barrel','stoneColumn','woodenCrate','chestClosed','tableShortChairs','barrelsStacked']],
  ['farm','planks',['hayBales','sacksCrate']],
  ['library','floorCarpet',['bookStand','candleStand','libraryChair']],
  ['bases','square_stone_flat',['base_stone_high','base_wood_flat']]
];

const steps=[[1,0],[-1,0],[0,1],[0,-1]];
const isMarker=e=>['start','goal','chest','npc','enemy','door'].includes(e.t)||isMapLink(e);
function surfaceUse(art){
  const name=[art.label,art.name,art.id,art.assetId,art.source].filter(Boolean).join(' ').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_./\\-]+/g,' ');
  if(/(boat|ship|vessel|barge|canoe|kayak|raft|sampan|thuyen|tau|ghe|xuong)(\b|$)/.test(name))return 'water';
  if(/(dock|pier|jetty|wharf|cau ben|ben tau|ben thuyen)(\b|$)/.test(name))return 'shore';
  return 'land';
}

export function dressOutline(map,materials,value,placementZones=[],arrivals=[],stages=null,preserve=new Set(),mixSelected=false){
  const stage=name=>stages?stages[name]||0:1;
  const choose=(items,name)=>items.length?items[(stage(name)-1)%items.length]:null;
  if(stage('props'))map.ents=map.ents.filter(e=>!e.outlineAutoProp);
  if(stages&&!preserve.has('house'))map.ents=map.ents.filter(e=>!e.outlineAutoHouse);
  const {w,h,ents,blk}=map,mask=rasterOutline(map.cfg.outline.loops,w,h),n=w*h;
  if(!stages&&!materials.some(m=>m.floors.length))throw Error('Các gói đã chọn thiếu mảnh sàn phù hợp với Đường Bao.');
  // Distance from the nearest wall distinguishes corridors from wide rooms.
  const surface=map.cfg.outline.surface?planSurface(w,h,map.cfg.outline.surface).tiles:null;
  const dry=i=>!surface||surface[i]===ground.plain||surface[i]===ground.meadow||surface[i]===ground.plaza;
  const distance=new Int16Array(n).fill(-1),queue=new Int32Array(n);
  let tail=0;
  const around=(i,fn)=>{
    const x=i%w,y=Math.floor(i/w);
    for(const [dx,dy] of steps){
      const a=x+dx,b=y+dy;if(a>=0&&a<w&&b>=0&&b<h)fn(b*w+a);
    }
  };
  for(let i=0;i<n;i++){
    if(!mask[i]){distance[i]=0;queue[tail++]=i;}
    else if(i%w===0||i%w===w-1||i<w||i>=n-w)distance[i]=1;
  }
  for(let i=0;i<n;i++)if(distance[i]===1)queue[tail++]=i;
  for(let head=0;head<tail;head++){
    const i=queue[head];
    around(i,j=>{if(distance[j]<0){distance[j]=distance[i]+1;queue[tail++]=j;}});
  }
  const floors=materials.flatMap(m=>m.floors),core=floors[0],coverage=new Set();
  const owners=new Int16Array(n).fill(-1);
  // Flood each broad pocket separately, leaving connecting passages in the first floor material.
  let room=-1;
  for(let i=0;i<n;i++){
    if(distance[i]<4||owners[i]!==-1)continue;
    const pockets=[i];owners[i]=room+1;
    for(let head=0;head<pockets.length;head++)around(pockets[head],j=>{
      if(distance[j]>=4&&owners[j]===-1){owners[j]=room+1;pockets.push(j);}
    });
    if(pockets.length<8)for(const j of pockets)owners[j]=-2;
    else room++;
  }
  let floorCell=0;
  const floorCells=mask.reduce((sum,cell)=>sum+cell,0);
  if(core&&stage('floor'))for(let i=0;i<n;i++){
    if(!dry(i))continue;
    let zone=owners[i];
    if(zone===-1&&distance[i]===3)around(i,j=>{if(owners[j]>=0)zone=owners[j];});
    if(!mask[i]){
      let fringe=false;around(i,j=>{if(mask[j])fringe=true;});
      if(!fringe)continue;
    }
    const tile=mixSelected?floors[Math.min(floors.length-1,Math.floor(floorCell*floors.length/Math.max(1,floorCells)))]:
      stages?choose(floors,'floor'):zone<0?core:floors[(zone+1)%floors.length];
    floorCell+=mask[i];
    if(!surface)map.layers[0][i]=value(tile.sid);
    coverage.add(tile.source);
  }
  const addedZones=[];
  let walk=linkWalkability(map,placementZones);
  const markers=ents.filter(isMarker).map(e=>isMapLink(e)?portalAnchor(e,walk.free):[e.x+.5,e.y+.5]).filter(Boolean).concat(arrivals);
  const protectedCells=new Uint8Array(n);
  const starts=markers.map(([x,y])=>Math.floor(y)*w+Math.floor(x)).filter(i=>i>=0&&i<n&&mask[i]);
  let houseCount=Number(preserve.has('house')&&ents.some(e=>e.outlineAutoHouse)),overlayCount=0;
  if(stages){
    const previousOverlays=map.cfg.outlineAutoOverlays||[];
    if(!preserve.has('overlay'))for(const [i,tile] of previousOverlays){
      if(map.layers[1][i]===tile)map.layers[1][i]=0;
    }
    const appliedOverlays=preserve.has('overlay')?previousOverlays:[];
    if(preserve.has('overlay'))overlayCount=appliedOverlays.filter(([i,tile])=>map.layers[1][i]===tile).length;
    const overlays=materials.flatMap(m=>m.overlays||[]);
    if(stage('overlay')&&overlays.length){
      const used=new Map(),perRoom=mixSelected?Math.max(1,Math.ceil(overlays.length/Math.max(1,room+1))):1;
      let placed=0;
      for(let i=0;i<n;i++){
        const x=i%w,y=Math.floor(i/w),roomId=owners[i];
        if(x>=w-1||y>=h-1||roomId<0||(used.get(roomId)||0)>=perRoom||(x+y+stage('overlay'))%3)continue;
        const cells=[i,i+1,i+w,i+w+1];
        if(cells.some(j=>!dry(j)||blk[j]||owners[j]!==roomId||map.layers[1][j]))continue;
        const overlay=mixSelected?overlays[placed%overlays.length]:choose(overlays,'overlay');
        for(const j of cells){
          const tile=value(overlay.sid);
          map.layers[1][j]=tile;appliedOverlays.push([j,tile]);overlayCount++;
        }
        used.set(roomId,(used.get(roomId)||0)+1);coverage.add(overlay.source);placed++;
      }
    }
    map.cfg.outlineAutoOverlays=appliedOverlays;
    const houseOptions=materials.flatMap(m=>m.houses||[]);
    const houses=mixSelected?houseOptions:houseOptions.length?[choose(houseOptions,'house')]:[];
    const spawn=ents.find(e=>e.t==='start');
    if(stage('house')&&spawn)for(const house of houses){
      const indices=walk.component(spawn).map(({x,y})=>y*w+x),reachable=new Set(indices);
      const required=starts.filter(i=>reachable.has(i));
      // Try rectangular lots with an apron that fits inside the floor.
      for(const i of stage('house')%2?indices:indices.reverse()){
        const x=i%w,y=Math.floor(i/w);
        if(x<1||y<1||x+house.w>=w||y+house.h>=h)continue;
        let fits=true;
        for(let b=-1;b<=house.h&&fits;b++)for(let a=-1;a<=house.w;a++){
          const px=x+a+.5,py=y+b+.5;
          if(!walk.free(px,py,.42)||markers.some(([mx,my])=>Math.hypot(px-mx,py-my)<1.5)){fits=false;break;}
        }
        if(!fits)continue;
        const parts=house.ents.map((e,j)=>({...e,id:'outline-house-'+houseCount+'-'+j,x:e.x+x,y:e.y+y,outlineAutoHouse:true}));
        ents.push(...parts);
        const candidate=linkWalkability(map,placementZones);
        const available=new Set(candidate.component(spawn).map(({x,y})=>y*w+x));
        if(required.every(j=>available.has(j))&&available.has((y+Math.floor(house.h/2))*w+x+house.w)){
          houseCount++;coverage.add(house.source);walk=candidate;break;
        }
        ents.splice(-parts.length);
      }
    }
  }
  // Reserve the complete routes found before placing any furniture.
  const parent=new Int32Array(n).fill(-2);
  for(const origin of starts){
    if(parent[origin]!==-2)continue;
    const search=[origin];parent[origin]=-1;
    for(let head=0;head<search.length;head++){
      const i=search[head],x=i%w+.5,y=Math.floor(i/w)+.5;
      around(i,j=>{
        const a=j%w+.5,b=Math.floor(j/w)+.5;
        if(parent[j]!==-2||!mask[j]||blk[j]||!walk.traverse(x,y,a,b))return;
        parent[j]=i;search.push(j);
      });
    }
  }
  for(const i of starts)for(let j=i;j>=0&&!protectedCells[j];j=parent[j])protectedCells[j]=1;
  const reservations=[];
  const placedProps=new Set();
  const props=stage('props')?materials.flatMap(m=>m.props):[];
  const offset=(stage('props')-1+props.length)%Math.max(1,props.length);
  const variants=props.slice(offset).concat(props.slice(0,offset));
  const candidates=[];
  if(variants.length)for(let i=0;i<n;i++){
    if(distance[i]!==2||blk[i])continue;
    let inRoom=false;
    around(i,j=>{if(distance[j]>=3)around(j,k=>{if(owners[k]>=0)inRoom=true;});});
    if(inRoom)candidates.push(i);
    else if(room<0){
      around(i,j=>{if(distance[j]>=3)inRoom=true;});
      if(inRoom)candidates.push(i);
    }
  }
  const budget=Math.min(52,Math.floor(mask.reduce((count,v)=>count+v,0)/42));
  for(const i of candidates){
    if(reservations.length>=budget)break;
    const x=i%w+.5,y=Math.floor(i/w)+.5,art=variants[reservations.length%variants.length],r=art.radius;
    const use=surface&&surfaceUse(art);
    if(use==='water')continue;
    if(use==='shore'){
      let besideWater=false;
      around(i,j=>{if([ground.sea,ground.river,ground.canal,ground.stream,ground.lake,ground.pond].includes(surface[j]))besideWater=true;});
      if(!besideWater)continue;
    }
    if(!walk.free(x,y,r+.35)||zonesHit(addedZones,x,y,r+.35))continue;
    if((stages&&((i*7)%13+stage('props'))%3===0)||markers.some(([a,b])=>Math.hypot(a-x,b-y)<2.5)||
      reservations.some(([a,b])=>Math.hypot(a-x,b-y)<3))continue;
    let inRoute=false;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(protectedCells[i+dy*w+dx])inRoute=true;
    }
    if(inRoute)continue;
    const entity=art.create(x,y,'outline-prop-'+i);
    ents.push(entity);addedZones.push(...decoZones([entity]));coverage.add(art.source);
    placedProps.add(art);
    reservations.push([x,y]);
  }
  if(surface&&variants.some(art=>surfaceUse(art)==='water')){
    const waterProps=variants.filter(art=>surfaceUse(art)==='water');
    const wet=new Set([ground.sea,ground.river,ground.canal,ground.stream,ground.lake,ground.pond]);
    let placed=0;
    const waterBudget=Math.min(8,Math.floor(mask.reduce((count,v)=>count+v,0)/450));
    for(let i=0;i<n&&placed<waterBudget;i++){
      if(!mask[i]||!wet.has(surface[i]))continue;
      const x=i%w+.5,y=Math.floor(i/w)+.5,art=waterProps[placed%waterProps.length],r=Math.min(.75,art.radius||.4);
      const edge=Math.ceil(r+.5);
      let fits=true;
      for(let dy=-edge;dy<=edge&&fits;dy++)for(let dx=-edge;dx<=edge;dx++){
        const px=Math.floor(y+dy)*w+Math.floor(x+dx);
        if(px<0||px>=n||!mask[px]||!wet.has(surface[px])){fits=false;break;}
      }
      if(!fits||markers.some(([a,b])=>Math.hypot(a-x,b-y)<2.5)||reservations.some(([a,b])=>Math.hypot(a-x,b-y)<3))continue;
      const entity=art.create(x,y,'outline-water-prop-'+i);
      entity.walk=false;entity.outlineAutoProp=true;entity.surfaceWaterProp=true;
      ents.push(entity);coverage.add(art.source);placedProps.add(art);reservations.push([x,y]);placed++;
    }
  }
  return {sources:[...coverage],rooms:room+1,props:reservations.length,propKinds:placedProps.size,overlays:overlayCount,houses:houseCount};
}
