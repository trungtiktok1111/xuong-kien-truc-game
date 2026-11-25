import {rasterOutline} from './mapCollision.js';
import {decoZones,zonesHit} from './zones.js';
import {portalAnchor,isMapLink} from './wall2d.js';
import {linkWalkability} from './mapLinks2d.js';

export const kenneyOutlinePacks=[
  ['dungeon','stone',['barrel','stoneColumn','woodenCrate']],
  ['farm','planks',['hayBales','sacksCrate']],
  ['library','floorCarpet',['bookStand','candleStand','libraryChair']],
  ['bases','square_stone_flat',['base_stone_high','base_wood_flat']]
];

const steps=[[1,0],[-1,0],[0,1],[0,-1]];
const isMarker=e=>['start','goal','chest','npc','enemy','door'].includes(e.t)||isMapLink(e);

export function dressOutline(map,materials,value,placementZones=[]){
  map.ents=map.ents.filter(e=>!e.outlineAutoProp);
  const {w,h,ents,blk}=map,mask=rasterOutline(map.cfg.outline.loops,w,h),n=w*h;
  if(!materials.some(m=>m.floors.length))throw Error('Các gói đã chọn thiếu mảnh sàn phù hợp với Đường Bao.');
  // Distance from the nearest wall distinguishes corridors from wide rooms.
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
  for(let i=0;i<n;i++){
    let zone=owners[i];
    if(zone===-1&&distance[i]===3)around(i,j=>{if(owners[j]>=0)zone=owners[j];});
    if(!mask[i]){
      let fringe=false;around(i,j=>{if(mask[j])fringe=true;});
      if(!fringe)continue;
    }
    const tile=zone<0?core:floors[(zone+1)%floors.length];
    map.layers[0][i]=value(tile.sid);coverage.add(tile.source);
  }
  const addedZones=[];
  const walk=linkWalkability(map,placementZones);
  const markers=ents.filter(isMarker).map(e=>isMapLink(e)?portalAnchor(e,walk.free):[e.x+.5,e.y+.5]).filter(Boolean);
  const protectedCells=new Uint8Array(n);
  const starts=markers.map(([x,y])=>Math.floor(y)*w+Math.floor(x)).filter(i=>i>=0&&i<n&&mask[i]);
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
  const variants=materials.flatMap(m=>m.props);
  const candidates=[];
  if(variants.length)for(let i=0;i<n;i++){
    if(distance[i]!==2||blk[i])continue;
    let inRoom=false;
    around(i,j=>{if(distance[j]>=3)around(j,k=>{if(owners[k]>=0)inRoom=true;});});
    if(inRoom)candidates.push(i);
  }
  const budget=Math.min(52,Math.floor(mask.reduce((count,v)=>count+v,0)/42));
  for(const i of candidates){
    if(reservations.length>=budget)break;
    const x=i%w+.5,y=Math.floor(i/w)+.5,art=variants[reservations.length%variants.length],r=art.radius;
    if(!walk.free(x,y,r+.35)||zonesHit(addedZones,x,y,r+.35))continue;
    if(markers.some(([a,b])=>Math.hypot(a-x,b-y)<2.5)||
      reservations.some(([a,b])=>Math.hypot(a-x,b-y)<3))continue;
    let inRoute=false;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(protectedCells[i+dy*w+dx])inRoute=true;
    }
    if(inRoute)continue;
    const entity=art.create(x,y,'outline-prop-'+i);
    ents.push(entity);addedZones.push(...decoZones([entity]));coverage.add(art.source);
    reservations.push([x,y]);
  }
  return {sources:[...coverage],rooms:room+1,props:reservations.length};
}
