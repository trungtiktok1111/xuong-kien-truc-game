import {mapCollision} from './mapCollision.js';
import {decoZones,zBounds,zPts} from './zones.js';
import {corridorLoop} from './outlineShapes.js';
import clipping from 'polygon-clipping';

export function canArrangeProp(entity){
 return entity.t==='deco'&&entity.tile&&entity.id!=null&&!entity.wallId&&!entity.wallLine&&
  !entity.gateAssembly&&!entity.surfaceWaterProp;
}

export function arrangementLayer(entity){
 if(entity.outlineAutoHouse||entity.housePlacement||entity.housePart||/(?:^outline-house-|^surface-house-)/.test(String(entity.id)))return 'house';
 return ({0:'floor',1:'overlay',3:'roof'})[entity.sceneLayer]||'prop';
}

export function propGroupId(entity){
 return entity.arrangementGroup||String(entity.id).match(/^(outline-house-\d+|surface-house-\d+-\d+)-\d+$/)?.[1];
}

export function propGroup(entities,entity){
 const group=propGroupId(entity);
 return group?entities.filter(part=>propGroupId(part)===group):[entity];
}

export function transformPropGroup(parts,source,target,mirror=false){
 const swap=([x,y])=>[y,x];
 const sides={E:'S',S:'E',W:'N',N:'W'};
 return parts.map(part=>{
  let dx=part.x-source.x,dy=part.y-source.y;
  if(mirror)[dx,dy]=[dy,dx];
  const result={...part,x:target.x+dx,y:target.y+dy};
  if(!mirror)return result;
  result.placedProp=true;
 result.spriteFlip=(part.spriteFlip||0)^1;
  result.ox=-(part.ox||0);
  if(part.artBase)result.artBase=part.artBase.map(([u,v])=>[1-u,v]);
 if(part.roofDirection)result.roofDirection=sides[part.roofDirection];
  if(part.zb){const [x,y,w,h]=part.zb;result.zb=[y,x,h,w];}
  if(part.zp)result.zp=part.zp.map(swap);
  if(part.zps)result.zps=part.zps.map(points=>points.map(swap));
  if(part.col)result.col=part.col.map(zone=>{
   if(zone.k==='poly')return {...zone,pts:zone.pts.map(swap)};
   if(zone.k==='seg')return {...zone,a:swap(zone.a),b:swap(zone.b)};
   if(zone.k==='rect')return {...zone,x:zone.y,y:zone.x,w:zone.h,h:zone.w};
   return {...zone,x:zone.y,y:zone.x};
  });
  return result;
 });
}

export function propFootprint(entity){
 const zones=decoZones([entity]);
 if(zones.length)return zones;
 return [{k:'ell',x:entity.x+.85,y:entity.y+.85,w:.3,h:.3}];
}

function zoneRings(zone){
 if(zone.k!=='line')return [zPts(zone)];
 const points=zone.pts||[];
 return points.slice(0,zone.closed?points.length:-1).map((point,i)=>
  corridorLoop(point,points[(i+1)%points.length],(zone.th||.6)/2));
}

export function footprintsOverlap(a,b){
 const [l,t,r,d]=zBounds(a),[x,y,w,h]=zBounds(b);
 if(r<=x+1e-8||w<=l+1e-8||d<=y+1e-8||h<=t+1e-8)return false;
 return zoneRings(a).some(left=>left.length>=3&&zoneRings(b).some(right=>
  right.length>=3&&clipping.intersection([left],[right]).some(poly=>{
   const ring=poly[0];
   return Math.abs(ring.slice(1).reduce((sum,[x,y],i)=>sum+ring[i][0]*y-ring[i][1]*x,0))>1e-8;
  })));
}

export function propPlacement(view,entity,ignore){
 const {M:map,placementZones}=view;
 const outline=map.cfg.outline;
 const ground=mapCollision({...map,placementZones,cfg:{...map.cfg,outline:{...outline,floorCollision:true}}});
 const ignored=ignore instanceof Set?ignore:new Set([ignore]);
 const blockers=decoZones(map.ents.filter(other=>!ignored.has(other.id)));
 for(const other of map.ents){
  if((other.t==='deco'&&other.tile&&!other.wallLine&&!other.gateAssembly&&!other.housePart&&
       !other.outlineAutoHouse&&!other.roofDirection)||['start','goal','door','chest','npc','enemy'].includes(other.t)){
   if(!ignored.has(other.id)&&!blockers.some(zone=>zone.deco===other.id)){
    const x=other.x+(other.t==='deco'?1:.5),y=other.y+(other.t==='deco'?1:.5);
    blockers.push({k:'ell',x:x-.18,y:y-.18,w:.36,h:.36});
   }
  }
 }
 for(const zone of propFootprint(entity)){
  const [left,top,right,bottom]=zBounds(zone);
  const x=(left+right)/2,y=(top+bottom)/2;
  const radius=zone.k==='ell'&&zone.w===zone.h?zone.w/2:Math.hypot(right-left,bottom-top)/2;
  if(!ground.free(x,y,radius))
   return 'Chân vật phải nằm trọn trên sàn đi được.';
  if(blockers.some(blocker=>footprintsOverlap(zone,blocker)))return 'Vùng chân vật đang chồng lên vật khác hoặc lối ra vào.';
 }
 return '';
}

export function applyOutlinePropEdits(view){
 const edits=view.M.cfg.outline?.propEdits;
 if(!edits?.length)return;
 const reapplied=[];
 const moved=new Set(edits.filter(edit=>!edit.removed).map(edit=>edit.entity.id));
 const removed=new Map(edits.filter(edit=>edit.removed).map(edit=>[edit.entity.id,edit]));
 view.M.ents=view.M.ents.filter(entity=>{
  const entry=removed.get(entity.id);
  return !moved.has(entity.id)&&!(entry&&canArrangeProp(entity)&&
    entry.entity.name===entity.name&&view.sheets[entity.tile.sid]?.name===entry.sheet);
 });
 for(const edit of edits){
  if(edit.removed)continue;
  const sid=view.sheets.findIndex(sheet=>sheet?.name===edit.sheet);
  if(sid<0)throw Error('Thiếu gói ảnh của '+(edit.entity.name||'vật dụng đã di chuyển')+'.');
  const entity={...edit.entity,tile:{...edit.entity.tile,sid}};
  reapplied.push(entity);
 }
 for(const entity of reapplied){
  const group=propGroupId(entity);
  const ignore=new Set(reapplied.filter(part=>part===entity||group&&propGroupId(part)===group).map(part=>part.id));
  const problem=propPlacement(view,entity,ignore);
  if(problem)throw Error((entity.name||'Vật dụng')+' · '+problem);
  view.M.ents.push(entity);
 }
}

export function scaleProp(entity,factor,x,y){
 const e={...entity,x:x+(entity.x+1-x)*factor-1,y:y+(entity.y+1-y)*factor-1,sc:(entity.sc||3)*factor};
 const pair=point=>point.map(value=>value*factor);
 for(const key of ['zb','gateArt'])if(e[key])e[key]=pair(e[key]);
 if(e.zp)e.zp=e.zp.map(pair);
 if(e.zps)e.zps=e.zps.map(poly=>poly.map(pair));
 if(e.col)e.col=e.col.map(zone=>{
  const scaled={...zone};
  for(const key of ['x','y','w','h','r','th'])if(Number.isFinite(zone[key]))scaled[key]=zone[key]*factor;
  for(const key of ['a','b'])if(zone[key])scaled[key]=pair(zone[key]);
  if(zone.pts)scaled.pts=zone.pts.map(pair);
  return scaled;
 });
 for(const key of ['fx','fy','roofThickness','roofBase','roofRise']){
  if(Number.isFinite(e[key]))e[key]*=factor;
 }
 return e;
}
