import {zBounds, zHit} from './zones.js';
import {ANG_R} from './proj.js';

const ART_SCALE = .95 / .75;
const nonSolid = /mái|roof|canopy|phủ nền|shadow|bóng|decal|overlay|effect|vfx|nhân vật|quái/i;
const complex = /cửa|door|gate|arch|cổng|bậc|stairs|stair|ramp|cầu|bridge|support|dầm|beam/i;
const round = /cây|tree|cột|column|pillar|đèn|lamp|barrel|thùng tròn|bình|urn/i;
const thin = /tường|wall|fence|hàng rào|rail/i;

// A painted tile has a fixed anchor. Adjacent tiles may overlap visually without sharing an anchor.
export function paintedPieces(layer, width, height) {
  const result=[];
  if(!layer)return result;
  for(let i=0;i<width*height;i++){
    if(!layer[i])continue;
    const x=i%width,y=Math.floor(i/width);
    result.push({cells:[i],x0:x,y0:y,x1:x+1,y1:y+1,xc:x+.5,yb:y+1});
  }
  return result;
}

export function sceneEntityLayer(entity) {
  if(entity.t!=='deco')return 5;
  if(entity.wallLine)return 2;
  if(entity.tiledLayer!==undefined)return entity.sceneLayer;
  if(entity.sceneLayer===3||entity.wallId||entity.gateAssembly||entity.door)return 3;
  return entity.flat?1:2;
}

export function roofTextureDirection(name, rectangular) {
  if(!rectangular)return null;
  const match=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .match(/(?:^|[^a-z])(?:roof|mai[-_ ]?(?:nha|che|ngoi)?)(?:[-_ ]?([nesw]))?(?=$|[^a-z])/i);
  return match?(match[1]?.toUpperCase()||'E'):null;
}

export function paintFamily(name, type, behavior) {
  if (behavior !== 'Chặn đường' || nonSolid.test(name+' '+type) || complex.test(name)) return null;
  return round.test(name+' '+type) ? 'round' : thin.test(name+' '+type) ? 'wall' : 'solid';
}

// Read a band above the bottommost credible opaque pixels. Coordinates are in the packed frame.
export function estimateContact(rgba, size, flip) {
  const rows = Array.from({length:size},()=>[]);
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
    if (rgba[(y*size+x)*4+3]<112) continue;
    let a=flip&1?size-1-x:x,b=flip&2?size-1-y:y;
    if(flip&4)[a,b]=[b,a];
    rows[b].push(a);
  }
  const minimum = Math.max(2,Math.ceil(size*.025));
  let bottom=size-1;
  while(bottom>=0 && rows[bottom].length<minimum)bottom--;
  if (bottom<0) return null;
  const band = rows.slice(Math.max(0,bottom-Math.ceil(size*.065)),bottom+1).flat().sort((a,b)=>a-b);
  if (band.length<minimum*2) return null;
  const lo=band[Math.floor(band.length*.08)],hi=band[Math.floor(band.length*.92)];
  return {u:(lo+hi+1)/(2*size),v:(bottom+.5)/size,width:(hi-lo+1)/size};
}

export function makePaintProfile(family, contact) {
  if (!family || !contact) return null;
  const size=Math.min(1, Math.max(.14,contact.width*ART_SCALE));
  return {...contact,kind:family==='round'?'ell':'rect',w:size,h:family==='round'?size:family==='wall'?.15:size*.72};
}

// Ground contact centers measured on the two posts of the 64 px Đá Xoáy arch.
export function daXoayArchProfiles(flip) {
  return [[22.5,60.5],[46.5,48.5]].map(([x,y])=>{
    let u=x/64,v=y/64;
    if(flip&1)u=1-u;
    if(flip&2)v=1-v;
    if(flip&4)[u,v]=[v,u];
    return {u,v,kind:'ell',w:.18,h:.18,estimated:false};
  });
}

function projectedContact(map, group, x, y, profile) {
  if (map.cfg?.view!=='iso') return [x+profile.u,y+profile.v];
  const u=x-group.x0+profile.u-(group.x1-group.x0)/2;
  const v=y-group.y0+profile.v-(group.y1-group.y0);
  if (map.cfg.proj==='angle') return [group.xc+u,group.yb+v];
  return [group.xc+(u/2+v)*ART_SCALE,group.yb+(v-u/2)*ART_SCALE];
}

export function automaticPaintZones(map, lookup, groups) {
  if (map.cfg?.autoObjectCollision===false) return [];
  const result=[];
  for(const layerId of [2,3]){
   const layer=map.layers?.[layerId];
   for (const group of (layerId===2&&groups)||paintedPieces(layer,map.w,map.h)) for (const i of group.cells) {
    const profile=lookup(layer[i],layerId);
    if (!profile) continue;
    const parts=Array.isArray(profile)?profile:[profile];
    for(const [n,part] of parts.entries()){
      const [x,y]=projectedContact(map,group,i%map.w,Math.floor(i/map.w),part);
      result.push({id:(layerId===2?'painted:':'painted-upper:')+i+(n?':'+n:''),k:part.kind,x:x-part.w/2,y:y-part.h/2,
        w:part.w,h:part.h,rot:0,estimated:part.estimated!==false});
    }
  }
  }
  return result;
}

// A map can contain many painted objects. Each query scans only nearby buckets.
export function indexPaintZones(zones) {
  const step=2, buckets=new Map();
  const key=(x,y)=>x+','+y;
  for (const zone of zones) {
    const [l,t,r,b]=zBounds(zone);
    for(let y=Math.floor(t/step);y<=Math.floor(b/step);y++)
      for(let x=Math.floor(l/step);x<=Math.floor(r/step);x++){
        const k=key(x,y);
        if(!buckets.has(k))buckets.set(k,[]);
        buckets.get(k).push(zone);
      }
  }
  return (x,y,radius)=>{
    for(let j=Math.floor((y-radius)/step);j<=Math.floor((y+radius)/step);j++)
      for(let i=Math.floor((x-radius)/step);i<=Math.floor((x+radius)/step);i++)
        for(const zone of buckets.get(key(i,j)) || [])if(zHit(zone,x,y,radius))return true;
    return false;
  };
}

// The average contact of a multi-post prop is the cursor anchor, leaving the gap open.
export function propContact(parts, fallback, scale, projection){
  const anchor=parts.length?{
    u:parts.reduce((sum,p)=>sum+p.u,0)/parts.length,
    v:parts.reduce((sum,p)=>sum+p.v,0)/parts.length
  }:fallback;
  const offset=scale/.75;
  const col=parts.map(part=>{
    const u=(part.u-anchor.u)*offset,v=(part.v-anchor.v)*offset;
    const x=projection==='angle'?u/2:projection==='iso'?v+u/2:u*.75;
    const y=projection==='angle'?v/(2*ANG_R):projection==='iso'?v-u/2:v*.75;
    const w=part.w*scale/.95,h=part.h*scale/.95;
    return part.kind==='ell'?{k:'circle',x,y,r:w/2}:{k:'rect',x:x-w/2,y:y-h/2,w,h};
  });
  return {ox:.5-anchor.u,oy:1-anchor.v,col};
}

export function resizeProp(e,factor){
  const pair=p=>p.map(v=>v*factor);
  const shapes=col=>col?.map(c=>{
    const next={...c};
    for(const key of ['x','y','w','h','r','th'])if(Number.isFinite(c[key]))next[key]=c[key]*factor;
    if(c.pts)next.pts=c.pts.map(pair);
    if(c.a)next.a=pair(c.a);
    if(c.b)next.b=pair(c.b);
    return next;
  });
  e.sc=(e.sc||3)*factor;
  if(e.gateArt)e.gateArt=pair(e.gateArt);
  if(e.zb)e.zb=pair(e.zb);
  if(e.zp)e.zp=e.zp.map(pair);
  if(e.zps)e.zps=e.zps.map(p=>p.map(pair));
  if(e.col)e.col=shapes(e.col);
  if(e.door?.v)for(const state of Object.values(e.door.v))if(state.col)state.col=shapes(state.col);
}

// The alternate facing of an upright 2D sprite is its mirrored frame.
export function turnProp(e){
  if(e.roofDirection){const turns={E:'N',N:'W',W:'S',S:'E'};e.roofDirection=turns[e.roofDirection]||'E';return;}
  const iso=e.propProjection==='iso';
  const flip=([x,y])=>iso?[y,x]:[-x,y];
  e.spriteFlip=(e.spriteFlip||0)^1;
  e.ox=-(e.ox||0);
  if(e.spriteBounds){const [l,t,r,b]=e.spriteBounds;e.spriteBounds=[1-r,t,1-l,b];}
  if(e.gateArt)e.gateArt=flip(e.gateArt);
  if(e.col)e.col=e.col.map(c=>{
    if(c.k==='circle'){const [x,y]=flip([c.x,c.y]);return {...c,x,y};}
    if(c.k==='rect')return iso?{...c,x:c.y,y:c.x,w:c.h,h:c.w}:{...c,x:-c.x-c.w};
    if(c.k==='poly')return {...c,pts:c.pts.map(flip)};
    if(c.k==='seg')return {...c,a:flip(c.a),b:flip(c.b)};
    return c;
  });
}
