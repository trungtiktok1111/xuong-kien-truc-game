import {mapCollision} from './mapCollision.js';
import {decoZones,zBounds,zonesHit} from './zones.js';

export function canArrangeProp(entity){
 return entity.t==='deco'&&entity.tile&&entity.id!=null&&!entity.wallId&&!entity.wallLine&&
  !entity.gateAssembly&&!entity.roofDirection&&!entity.housePart&&!entity.outlineAutoHouse&&!entity.surfaceWaterProp;
}

export function propFootprint(entity){
 const zones=decoZones([entity]);
 if(zones.length)return zones;
 return [{k:'ell',x:entity.x+.85,y:entity.y+.85,w:.3,h:.3}];
}

export function propPlacement(view,entity,ignore){
 const {M:map,placementZones}=view;
 const outline=map.cfg.outline;
 const ground=mapCollision({...map,placementZones,cfg:{...map.cfg,outline:{...outline,floorCollision:true}}});
 const blockers=decoZones(map.ents.filter(other=>other.id!==ignore));
 for(const other of map.ents){
  if((other.t==='deco'&&other.tile&&!other.wallLine&&!other.gateAssembly&&!other.housePart&&
       !other.outlineAutoHouse&&!other.roofDirection)||['start','goal','door','chest','npc','enemy'].includes(other.t)){
   if(other.id!==ignore&&!blockers.some(zone=>zone.deco===other.id)){
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
  if(zonesHit(blockers,x,y,radius))return 'Vùng chân vật đang chồng lên vật khác hoặc lối ra vào.';
 }
 return '';
}

export function applyOutlinePropEdits(view){
 const edits=view.M.cfg.outline?.propEdits;
 if(!edits?.length)return;
 const moved=new Set(edits.map(edit=>edit.entity.id));
 view.M.ents=view.M.ents.filter(entity=>!moved.has(entity.id));
 for(const edit of edits){
  const sid=view.sheets.findIndex(sheet=>sheet?.name===edit.sheet);
  if(sid<0)throw Error('Thiếu gói ảnh của '+(edit.entity.name||'vật dụng đã di chuyển')+'.');
  const entity={...edit.entity,tile:{...edit.entity.tile,sid}};
  const problem=propPlacement(view,entity,entity.id);
  if(problem)throw Error((entity.name||'Vật dụng')+' · '+problem);
  view.M.ents.push(entity);
 }
}
