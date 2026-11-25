import {placedPropBounds,placedPropFrame} from './proj.js';
import {mapCollision} from './mapCollision.js';
import {decoZones,zonesHit} from './zones.js';
import {constructionContext,isRoof} from './constructionRules2d.js';
import {actorFootprint,actorHeights,fitsUnderRoof} from './headroom2d.js';
import {bridgeRails,bridgeHeight} from './settlementBridge.js';

const projection=(x,y)=>[x-y,(x+y)/2];
export const artBounds=e=>placedPropBounds(placedPropFrame(e,projection,4/3,'iso'),e.spriteBounds||[0,0,1,1]);
const intersects=(a,b,pad=0)=>a[0]<b[2]+pad&&a[2]+pad>b[0]&&a[1]<b[3]+pad&&a[3]+pad>b[1];

export function protectedViews(cells,bridge){
  return cells.map(([x,y])=>{
    const [u,v]=projection(x+.5,y+.5);
    const at=v-bridgeHeight(bridge,x+.5,y+.5);
    return [u-.23,at-.13,u+.23,at+.13];
  });
}

export function canSeeRoad(e,views){
  const bounds=artBounds(e);
  return !views.some(v=>intersects(bounds,v));
}

export function canopyTouchesLot(e,lots){
  const [left,,right]=artBounds(e);
  const radius=Math.max(.25,(right-left)/(2*Math.SQRT2));
  const x=e.x+1,y=e.y+1;
  return lots.some(lot=>{
    const dx=Math.max(lot.x-x,0,x-lot.x-lot.w);
    const dy=Math.max(lot.y-y,0,y-lot.y-lot.h);
    return dx*dx+dy*dy<radius*radius;
  });
}

export function overlapsHouseArt(e,parts){
  const bounds=artBounds(e);
  return parts.some(b=>intersects(bounds,b,.08));
}

// A round player must fit along every segment, including between tile centres.
export function settlementIssues(map){
  const spec=map.cfg?.settlement?.plan;
  if(!spec)return [];
  const {route,water,accesses,bridge,lots=[]}=spec,{w,h,ents}=map;
  const issues=[], report=(rule,name,[x,y])=>issues.push({rule,name,x,y});
  const collision=mapCollision(map),rails=bridgeRails(bridge);
  const obstacles=[...(map.cfg.zones||[]),...decoZones(ents),...rails];
  const ceilings=ents.some(isRoof)?constructionContext(map).headroom():[];
  const {standing}=actorHeights(map.cfg),radius=.28;
  const free=(x,y)=>collision.free(x,y,radius)&&!zonesHit(obstacles,x,y,radius)&&
    fitsUnderRoof(ceilings,actorFootprint(x,y,radius),standing+bridgeHeight(bridge,x,y));
  const routeSet=new Set(route.map(([x,y])=>y*w+x));
  const flooded=new Set(water.map(([x,y])=>y*w+x));
  for(const [x,y] of water){
    const spans=bridge&&y===bridge.y&&x>=bridge.left&&x<bridge.right;
    if(!spans&&!collision.tileBlocked(y*w+x))report('NUOC','Lòng nước thiếu vùng chặn',[x,y]);
    if(routeSet.has(y*w+x)&&!spans)report('CAU','Tuyến đi qua nước thiếu mặt cầu',[x,y]);
  }
  if(bridge){
    const {left,right,y,rise}=bridge;
    if(rise<=0||left<2||right>=w-1||flooded.has(y*w+left-1)||flooded.has(y*w+right)||
      ![left-1,right].every(x=>routeSet.has(y*w+x))||right<=left||
      route.filter(([x,v])=>v===y&&x>=left&&x<right&&flooded.has(y*w+x)).length!==right-left)
      report('CAU','Cầu cần đủ nhịp và hai đầu khô nối đường',[left,y]);
  }
  const routes=new Set([...route,...accesses].map(([x,y])=>y*w+x));
  const start=ents.find(e=>e.t==='start'),goal=ents.find(e=>e.t==='goal');
  if(!start||!goal)report('LOI-DI','Thiếu điểm xuất phát hoặc đích',[0,0]);
  else{
    const queue=[[start.x,start.y]],seen=new Set([start.y*w+start.x]);
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const a=x+dx,b=y+dy,key=b*w+a;
        if(a<0||a>=w||b<0||b>=h||!routes.has(key)||seen.has(key))continue;
        const samples=15;
        if(!Array.from({length:samples+1},(_,j)=>j/samples).every(t=>free(x+.5+dx*t,y+.5+dy*t)))continue;
        seen.add(key);queue.push([a,b]);
      }
    }
    for(const [x,y] of [[start.x,start.y],[goal.x,goal.y],...route,...accesses])
      if(!seen.has(y*w+x)||!free(x+.5,y+.5))report('LOI-DI','Hành lang không đủ chỗ cho nhân vật',[x,y]);
  }
  if(lots.length<2)report('NHA','Cảnh cần ít nhất hai lô nhà hợp lệ',[0,0]);
  for(const lot of lots){
    const parts=ents.filter(e=>e.settlementRole==='building'&&e.id.startsWith(lot.id));
    if(parts.length!==lot.parts.length||lot.parts.some(([x,y,layer],i)=>{
      const piece=parts.find(e=>e.id===lot.id+i);
      return !piece||piece.x!==lot.x+x||piece.y!==lot.y+y||piece.tiledLayer!==layer;
    }))report('NHA','Cụm tường–mái thiếu mảnh hoặc lệch khỏi lô',[lot.x,lot.y]);
    for(let y=lot.y;y<lot.y+lot.h;y++)for(let x=lot.x;x<lot.x+lot.w;x++){
      const cell=y*w+x;
      if(flooded.has(cell)||routeSet.has(cell)||!collision.tileBlocked(cell))
        report('NHA','Dấu chân lô lấn đường, nước hoặc mất vùng chặn',[x,y]);
    }
  }
  const views=protectedViews(route,bridge);
  const houses=ents.filter(e=>e.settlementRole==='building').map(artBounds);
  for(const e of ents){
    if(!e.settlementRole)continue;
    const point=[e.x+1,e.y+1];
    if(!canSeeRoad(e,views))report('TAM-NHIN',e.name+' che tim đường',point);
    if(e.settlementRole==='tree'&&(overlapsHouseArt(e,houses)||canopyTouchesLot(e,lots)))report('TAN-CAY',e.name+' giao hình chiếu nhà',point);
  }
  return issues;
}
