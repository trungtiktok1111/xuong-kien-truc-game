import {detailedSurface} from './surfaceTerrain.js';
import {indexPaintZones} from './placement2d.js';
export function rasterOutline(loops,w,h){
 const mask=new Uint8Array(w*h);
 const edges=loops.flatMap(loop=>loop.map((p,i)=>[p,loop[(i+1)%loop.length]]));
 for(let y=0;y<h;y++){
  const scan=y+.5,crossings=[];
  for(const [a,b] of edges)
   if((a[1]>scan)!==(b[1]>scan))crossings.push((b[0]-a[0])*(scan-a[1])/(b[1]-a[1])+a[0]);
  crossings.sort((a,b)=>a-b);
  for(let i=0;i+1<crossings.length;i+=2){
   const start=Math.max(0,Math.ceil(crossings[i]-.5)),end=Math.min(w,Math.ceil(crossings[i+1]-.5));
   mask.fill(1,y*w+start,y*w+end);
  }
 }
 return mask;
}

const outlineCache=new WeakMap();
const bucket=4;
const distance2=(x,y,ax,ay,bx,by)=>{
 const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
 const t=len?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/len)):0;
 return (x-ax-t*dx)**2+(y-ay-t*dy)**2;
};
function edgeDistance2(ax,ay,bx,by,cx,cy,dx,dy){
 const cross=(ux,uy,vx,vy)=>ux*vy-uy*vx;
 const ux=bx-ax,uy=by-ay,vx=dx-cx,vy=dy-cy,den=cross(ux,uy,vx,vy);
 if(den){
  const t=cross(cx-ax,cy-ay,vx,vy)/den,s=cross(cx-ax,cy-ay,ux,uy)/den;
  if(t>=0&&t<=1&&s>=0&&s<=1)return 0;
 }
 return Math.min(distance2(ax,ay,cx,cy,dx,dy),distance2(bx,by,cx,cy,dx,dy),
  distance2(cx,cy,ax,ay,bx,by),distance2(dx,dy,ax,ay,bx,by));
}
function outlineGeometry(data,w,h){
 const prior=outlineCache.get(data);
 if(prior?.w===w&&prior.h===h)return prior;
 const mask=rasterOutline(data.loops,w,h),bins=Array.from({length:Math.floor(h/bucket)+1},()=>[]);
 for(const loop of data.loops)for(let i=0;i<loop.length;i++){
  const [ax,ay]=loop[i],[bx,by]=loop[(i+1)%loop.length];
  const edge={ax,ay,bx,by,x0:Math.min(ax,bx),x1:Math.max(ax,bx),y0:Math.min(ay,by),y1:Math.max(ay,by)};
  for(let j=Math.max(0,Math.floor(edge.y0/bucket));j<=Math.min(bins.length-1,Math.floor(edge.y1/bucket));j++)bins[j].push(edge);
 }
 function fits(x,y,r){
  let inside=false;
  const row=Math.floor(y/bucket),r2=r*r;
  for(let j=Math.max(0,Math.floor((y-r)/bucket));j<=Math.min(bins.length-1,Math.floor((y+r)/bucket));j++){
   for(const e of bins[j]){
    if(j===row&&(e.ay>y)!==(e.by>y)&&x<(e.bx-e.ax)*(y-e.ay)/(e.by-e.ay)+e.ax)inside=!inside;
    if(x+r>=e.x0&&x-r<=e.x1&&y+r>=e.y0&&y-r<=e.y1&&distance2(x,y,e.ax,e.ay,e.bx,e.by)<=r2)
     return false;
   }
  }
  return inside;
 }
 function sweep(ax,ay,bx,by,r){
  if(!fits(ax,ay,r)||!fits(bx,by,r))return false;
  const x0=Math.min(ax,bx)-r,x1=Math.max(ax,bx)+r,y0=Math.min(ay,by)-r,y1=Math.max(ay,by)+r,r2=r*r;
  for(let j=Math.max(0,Math.floor(y0/bucket));j<=Math.min(bins.length-1,Math.floor(y1/bucket));j++){
   for(const e of bins[j]){
    if(e.x0>x1||e.x1<x0||e.y0>y1||e.y1<y0)continue;
    if(edgeDistance2(ax,ay,bx,by,e.ax,e.ay,e.bx,e.by)<=r2)return false;
   }
  }
  return true;
 }
 const geo={w,h,mask,fits,sweep,loops:data.loops};
 outlineCache.set(data,geo);
 return geo;
}

export function mapCollision(map){
 const {w,h,blk}=map,outline=map.cfg?.outline;
 let floor=null;
 if(outline?.loops?.length&&outline.floorCollision!==false){
  const geometry=outlineGeometry(outline,w,h);
  const generated=outline.floorCollision===true||
   (geometry.mask.some(v=>!v)&&geometry.mask.every((v,i)=>v||blk[i]));
  if(generated)floor=geometry;
 }
 const terrain=outline?.surface?detailedSurface(w,h,outline.surface):null;
 const paintBlocked=map.placementZones?.length?indexPaintZones(map.placementZones):null;
 const tileBlocked=i=>!!blk[i]&&(!floor||!!floor.mask[i]);
 function free(x,y,r,skipFloor=false){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x-r<0||y-r<0||x+r>=w||y+r>=h||!skipFloor&&floor&&!floor.fits(x,y,r))return false;
  for(let j=Math.floor(y-r);j<=Math.floor(y+r);j++)for(let i=Math.floor(x-r);i<=Math.floor(x+r);i++){
   const index=j*w+i;
   if(!tileBlocked(index)||terrain?.blocked[index])continue;
   const dx=Math.max(i-x,0,x-i-1),dy=Math.max(j-y,0,y-j-1);
   if(dx*dx+dy*dy<=r*r)return false;
  }
  if(terrain){
   const {scale,w:stride,blocked}=terrain.detail,u=x*scale,v=y*scale,radius=r*scale;
   for(let j=Math.floor(v-radius);j<=Math.floor(v+radius);j++)for(let i=Math.floor(u-radius);i<=Math.floor(u+radius);i++){
    if(!blocked[j*stride+i])continue;
    const dx=Math.max(i-u,0,u-i-1),dy=Math.max(j-v,0,v-j-1);
    if(dx*dx+dy*dy<=radius*radius)return false;
   }
  }
  return !paintBlocked?.(x,y,r);
 }
 return {floor,tileBlocked,free};
}
