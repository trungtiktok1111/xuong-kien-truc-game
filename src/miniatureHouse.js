import {REFERENCE_HEIGHT} from './outlineAnchors.js';

// Vertical world units use the same isometric scale as placed roofs (128 source pixels per unit).
export const FARM_EAVES=157/128;
export const FARM_DOOR_CLEARANCE=140/128;
export const FARM_HOUSE_SCALE=REFERENCE_HEIGHT.door/FARM_DOOR_CLEARANCE;

function housePart(e){
 if(e.housePart)return e.housePart;
 // Earlier surface maps saved the sprite and segments without the structural metadata.
 if(!e.surfaceGenerated&&!e.outlineAutoHouse)return null;
 if(/^woodwalldoorway W$/i.test(e.name))return {door:true,side:1,scale:1};
 if(/^roof(?:single(?:wall)?)? [NS]$/i.test(e.name))return {roof:true,scale:1};
 return null;
}

export function miniatureHouseHeadroom(entities){
 return entities.flatMap(e=>{
  const part=housePart(e);
  if(!part)return [];
  const {scale,side=1}=part,x=e.x+1,y=e.y+1,half=scale/2;
  if(part.door){
   const edge=x+side*half;
   return [{id:e.id,bounds:[edge-.07*scale,y-half,edge+.07*scale,y+half],base:FARM_DOOR_CLEARANCE*scale,rise:0,direction:'E'}];
  }
  if(part.roof)return [{id:e.id,bounds:[x-half,y-half,x+half,y+half],base:FARM_EAVES*scale,rise:0,direction:'E'}];
  return [];
 });
}
