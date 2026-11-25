// X and Y locate the footprint on the map. Z is measured from the walkable floor in map cells.
import {decoZones,zBounds} from './zones.js';

export const HEADROOM_MARGIN=.03;
const height=(n,fallback)=>Number.isFinite(n)&&n>0?n:fallback;
export function actorHeights(cfg={}){
  const standing=height(cfg.playerHeight,1.2);
  return {standing,crouching:Math.min(standing,height(cfg.crouchHeight,.68))};
}

export function roofPlane(e,bearing){
  const size=(e.sc||.95)/.95,x=e.x+1,y=e.y+1;
  return {id:e.id,bounds:[x-size/2,y-size/2,x+size/2,y+size/2],
    base:bearing.base,rise:bearing.rise,direction:e.roofDirection||'E'};
}

export function clearanceBelow(roof,[left,top,right,bottom]){
  const [x0,y0,x1,y1]=roof.bounds;
  const l=Math.max(left,x0),r=Math.min(right,x1),t=Math.max(top,y0),b=Math.min(bottom,y1);
  if(l>r||t>b)return Infinity;
  const range=roof.direction==='W'?[(x1-r)/(x1-x0),(x1-l)/(x1-x0)]:
    roof.direction==='N'?[(y1-b)/(y1-y0),(y1-t)/(y1-y0)]:
    roof.direction==='S'?[(t-y0)/(y1-y0),(b-y0)/(y1-y0)]:[(l-x0)/(x1-x0),(r-x0)/(x1-x0)];
  return Math.min(...range.map(u=>roof.base+u*roof.rise));
}

export const actorFootprint=(x,y,r)=>[x-r,y-r,x+r,y+r];

export function lowestCeiling(roofs,footprint,exclude){
  let limit=Infinity;
  for(const roof of roofs)if(exclude===undefined||roof.id!==exclude)
    limit=Math.min(limit,clearanceBelow(roof,footprint));
  return limit;
}

export function fitsUnderRoof(roofs,footprint,topZ,exclude){
  return topZ+HEADROOM_MARGIN<=lowestCeiling(roofs,footprint,exclude);
}

export function bodyHeight(e,cfg={},open=false){
  if(e.t==='start')return actorHeights(cfg).standing;
  if(e.t==='chest')return height(e.bodyHeight,.55)+(open?height(e.lidRise,.25):0);
  if(['npc','enemy'].includes(e.t))return height(e.bodyHeight,1.2);
  if(e.t!=='deco'||e.flat||e.wallLine||(!e.placedProp&&!e.tile))return 0;
  const bottom=e.spriteBounds?.[3]??1,top=e.spriteBounds?.[1]??0;
  return height(e.bodyHeight,Math.max(.1,(bottom-top)*(e.sc||1.2)/.75));
}

export function bodyFootprint(e){
  if(e.t==='deco'){
    const zones=decoZones([e]);
    if(zones.length){
      const b=zones.map(zBounds);
      return [Math.min(...b.map(v=>v[0])),Math.min(...b.map(v=>v[1])),Math.max(...b.map(v=>v[2])),Math.max(...b.map(v=>v[3]))];
    }
    return actorFootprint(e.x+1,e.y+1,.2);
  }
  return actorFootprint(e.x+.5,e.y+.5,e.t==='chest'?.25:.28);
}


// Clip a wall centreline to a roof footprint before sampling its linear ceiling.
export function wallCeiling(roofs,e){
  const x=e.x+1,y=e.y+1,{dx,dy}=e.wallLine;
  let ceiling=Infinity;
  for(const roof of roofs){
    const [x0,y0,x1,y1]=roof.bounds;
    let start=0,end=1;
    for(const [pos,delta,min,max] of [[x,dx,x0,x1],[y,dy,y0,y1]]){
      if(!delta){
        if(pos<min||pos>max){start=1;end=0;break;}
      }else{
        const a=(min-pos)/delta,b=(max-pos)/delta;
        start=Math.max(start,Math.min(a,b));end=Math.min(end,Math.max(a,b));
      }
    }
    if(start>end)continue;
    for(const t of [start,end]){
      const px=x+dx*t,py=y+dy*t;
      ceiling=Math.min(ceiling,clearanceBelow(roof,[px,py,px,py]));
    }
  }
  return ceiling;
}

// Region where the player's centre is blocked, using the same footprint and
// headroom allowance as movement. A sloped roof can block just its low end.
export function roofBlockedFootprint(roof,topZ,radius=0){
  const limit=topZ+HEADROOM_MARGIN;
  const {base,rise,direction}=roof,[x0,y0,x1,y1]=roof.bounds;
  if(limit<=Math.min(base,base+rise))return null;
  const bounds=roof.bounds.slice();
  if(rise&&limit<=Math.max(base,base+rise)){
    const u=Math.max(0,Math.min(1,(limit-base)/rise));
    const [low,high,fraction]=direction==='W'?[0,2,1-u]:direction==='N'?[1,3,1-u]:
      direction==='S'?[1,3,u]:[0,2,u];
    const cut=bounds[low]+(bounds[high]-bounds[low])*fraction;
    const reversed=direction==='W'||direction==='N';
    bounds[(rise>0)!==reversed?high:low]=cut;
  }
  return bounds.map((v,i)=>v+(i<2?-radius:radius));
}
