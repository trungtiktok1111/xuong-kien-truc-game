import {miniatureHouseHeadroom} from './miniatureHouse.js';
import {mapCollision} from './mapCollision.js';
import {zonesHit} from './zones.js';
import {constructionContext,isRoof} from './constructionRules2d.js';
import {actorFootprint,actorHeights,fitsUnderRoof} from './headroom2d.js';
import {bridgeHeight,bridgeRails} from './settlementBridge.js';
import {isMapLink,portalAnchor} from './wall2d.js';

const radius=.28;
const steps=[[1,0],[-1,0],[0,1],[0,-1]];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cellKey=(x,y)=>x+':'+y;

export function linkWalkability(map,placementZones=map.placementZones||[]){
  const collision=mapCollision(map),bridge=map.cfg?.settlement?.plan?.bridge;
  const construction=constructionContext(map,placementZones);
  const zones=[...(map.cfg?.zones||[]),...construction.objects,...bridgeRails(bridge),...placementZones];
  const roofs=[...(map.ents.some(isRoof)?construction.headroom():[]),...miniatureHouseHeadroom(map.ents)];
  const {standing}=actorHeights(map.cfg);
  const free=(x,y,r=radius)=>collision.free(x,y,r)&&!zonesHit(zones,x,y,r)&&
    fitsUnderRoof(roofs,actorFootprint(x,y,r),standing+bridgeHeight(bridge,x,y));
  const traverse=(x,y,a,b)=>{
    for(let i=0;i<=16;i++){
      const t=i/16;
      if(!free(x+(a-x)*t,y+(b-y)*t))return false;
    }
    return true;
  };
  function component(origin){
    if(!origin||!free(origin.x+.5,origin.y+.5))return [];
    const queue=[{x:origin.x,y:origin.y}],seen=new Set([cellKey(origin.x,origin.y)]);
    for(let i=0;i<queue.length;i++){
      const {x,y}=queue[i];
      for(const [dx,dy] of steps){
        const a=x+dx,b=y+dy,key=cellKey(a,b);
        if(seen.has(key)||!traverse(x+.5,y+.5,a+.5,b+.5))continue;
        seen.add(key);queue.push({x:a,y:b});
      }
    }
    return queue;
  }
  return {free,traverse,component};
}

export const mapEntry=map=>map.ents.find(e=>e.t==='start')||{x:Math.floor(map.w/2),y:Math.floor(map.h/2)};
// A raster cell can be inside the outline even when it is too close to its edge.
export function safeMapEntry(map,walk=linkWalkability(map),preferred=mapEntry(map)){
  const canStep=({x,y})=>walk.free(x+.5,y+.5)&&steps.some(([dx,dy])=>
    walk.traverse(x+.5,y+.5,x+dx+.5,y+dy+.5));
  if(Number.isInteger(preferred.x)&&Number.isInteger(preferred.y)&&canStep(preferred))return preferred;
  const x0=Number.isFinite(preferred.x)?preferred.x:Math.floor(map.w/2);
  const y0=Number.isFinite(preferred.y)?preferred.y:Math.floor(map.h/2);
  let nearest=null,distance=Infinity;
  for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
    const d=(x-x0)**2+(y-y0)**2;
    if(d>=distance||!canStep({x,y}))continue;
    nearest={x,y};distance=d;
  }
  return nearest;
}

const label=(m,fallback)=>m.name||fallback;

export function planMapPair(source,target,from,to,id){
  if(from===to)throw Error('Hãy chọn hai màn khác nhau.');
  const src=linkWalkability(source),dst=linkWalkability(target);
  const entry=safeMapEntry(source,src),arrival=safeMapEntry(target,dst),goal=source.ents.find(e=>e.t==='goal');
  const reserved=(map,p,except)=>map.ents.some(e=>e!==except&&
    (isMapLink(e)?dist(p,e)<1.5:['start','goal','npc','chest','enemy'].includes(e.t)&&dist(p,e)<.9));
  function find(map,walk,origin,preferred,which,except){
    const reachable=walk.component(origin),available=reachable.filter(p=>!reserved(map,p,except));
    const byCell=new Map(available.map(p=>[cellKey(p.x,p.y),p]));
    available.sort((a,b)=>dist(a,preferred)-dist(b,preferred));
    for(const point of available){
      const landing=steps.map(([dx,dy])=>byCell.get(cellKey(point.x+dx,point.y+dy))).find(p=>
        p&&walk.traverse(point.x+.5,point.y+.5,p.x+.5,p.y+.5));
      if(landing)return {point,landing};
    }
    throw Error(which+' thiếu chỗ cho lối đi và ô xuất hiện an toàn nối với điểm xuất phát.');
  }
  const a=find(source,src,entry,goal||entry,label(source,'Màn hiện tại'),goal);
  const b=find(target,dst,arrival,arrival,label(target,'Màn đích'));
  const make=(name,point,dest,index,suffix)=>({
    id:id+'-'+suffix,t:'door',name,x:point.x,y:point.y,to:index,tx:dest.x,ty:dest.y,tile:null,pairId:id
  });
  return [{...make('Sang '+label(target,'màn đích'),a.point,b.landing,to,'a'),advanceGoal:goal?.id},
    make('Về '+label(source,'màn trước'),b.point,a.landing,from,'b'),
    {sourceEntry:entry,targetEntry:arrival}];
}

export function mapLinkLanding(maps,door){
  if(!Number.isInteger(door.to)||!maps[door.to])return null;
  const target=maps[door.to],entry=mapEntry(target);
  const {x,y}=door.tx==null&&door.ty==null?entry:{x:door.tx,y:door.ty};
  if(!Number.isInteger(x)||!Number.isInteger(y)||!linkWalkability(target).free(x+.5,y+.5))return null;
  return {x:x+.5,y:y+.5};
}

export function mapLinkReports(maps){
  const reports=[];
  maps.forEach((map,i)=>{
    const doors=map.ents.filter(isMapLink);
    if(!doors.length)return;
    const walk=linkWalkability(map);
    const arrivals=maps.flatMap(m=>m.ents.filter(isMapLink).filter(e=>e.to===i).map(e=>mapLinkLanding(maps,e))).filter(Boolean);
    const origins=[mapEntry(map),...arrivals.map(p=>({x:Math.floor(p.x),y:Math.floor(p.y)}))];
    const reachable=new Set(origins.flatMap(origin=>walk.component(origin)).map(p=>cellKey(p.x,p.y)));
    for(const door of doors){
      const name=label(map,'Màn '+(i+1))+' · '+(door.name||'Cửa');
      const p=portalAnchor(door,walk.free);
      if(!p||!walk.free(...p)||!reachable.has(cellKey(Math.floor(p[0]),Math.floor(p[1]))))
        reports.push(name+' không nối được với lối đi.');
      if(!mapLinkLanding(maps,door))reports.push(name+' có màn đích hoặc ô đến không hợp lệ.');
      if(door.pairId&&!maps[door.to]?.ents.some(e=>e.pairId===door.pairId&&e.to===i))
        reports.push(name+' thiếu cửa quay lại.');
    }
  });
  return reports;
}

export function campaignStart(maps,index){
  return Number.isInteger(index)&&maps[index]?index:0;
}
