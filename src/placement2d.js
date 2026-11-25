import {zBounds, zHit} from './zones.js';

const ART_SCALE = .95 / .75;
const nonSolid = /mái|roof|canopy|phủ nền|shadow|bóng|decal|overlay|effect|vfx|nhân vật|quái/i;
const complex = /cửa|door|gate|arch|cổng|bậc|stairs|stair|ramp|cầu|bridge|support|dầm|beam/i;
const round = /cây|tree|cột|column|pillar|đèn|lamp|barrel|thùng tròn|bình|urn/i;
const thin = /tường|wall|fence|hàng rào|rail/i;

export function paintedGroups(layer, width, height) {
  const visited = new Uint8Array(width * height), result = [];
  if (!layer) return result;
  for (let i = 0; i < visited.length; i++) {
    if (!layer[i] || visited[i]) continue;
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    const cells = [i];
    visited[i] = 1;
    for (let j = 0; j < cells.length; j++) {
      const n = cells[j], x = n % width, y = Math.floor(n / width);
      x0 = Math.min(x0,x); y0 = Math.min(y0,y);
      x1 = Math.max(x1,x+1); y1 = Math.max(y1,y+1);
      for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx=x+dx, ny=y+dy, next=ny*width+nx;
        if (nx<0 || nx>=width || ny<0 || ny>=height || !layer[next] || visited[next]) continue;
        visited[next]=1;cells.push(next);
      }
    }
    result.push({cells,x0,y0,x1,y1,xc:(x0+x1)/2,yb:y1});
  }
  return result;
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

function projectedContact(map, group, x, y, profile) {
  if (map.cfg?.view!=='iso') return [x+profile.u,y+profile.v];
  const u=x-group.x0+profile.u-(group.x1-group.x0)/2;
  const v=y-group.y0+profile.v-(group.y1-group.y0);
  if (map.cfg.proj==='angle') return [group.xc+u,group.yb+v];
  return [group.xc+(u/2+v)*ART_SCALE,group.yb+(v-u/2)*ART_SCALE];
}

export function automaticPaintZones(map, lookup, groups) {
  if (map.cfg?.autoObjectCollision===false) return [];
  const layer=map.layers?.[2];
  const result=[];
  for (const group of groups || paintedGroups(layer,map.w,map.h)) for (const i of group.cells) {
    const profile=lookup(layer[i]);
    if (!profile) continue;
    const [x,y]=projectedContact(map,group,i%map.w,Math.floor(i/map.w),profile);
    result.push({id:'painted:'+i,k:profile.kind,x:x-profile.w/2,y:y-profile.h/2,
      w:profile.w,h:profile.h,rot:0,estimated:true});
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
