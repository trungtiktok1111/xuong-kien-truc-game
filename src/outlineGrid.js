import {mapCollision} from './mapCollision.js';
import {decoZones,zBounds,zMove} from './zones.js';

export const DEFAULT_OUTLINE_WALL_HEIGHT=1;

export function usedGridBounds(map,protectedCells=[]){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 const include=(a,b,c,d)=>{
  x0=Math.min(x0,a);y0=Math.min(y0,b);x1=Math.max(x1,c);y1=Math.max(y1,d);
 };
 if(map){
  const {w,h,layers,blk}=map;
  const collision=mapCollision(map);
  for(let i=0;i<w*h;i++){
   if(!layers.some(layer=>layer[i])&&!(blk[i]&&collision.tileBlocked(i)))continue;
   const x=i%w,y=Math.floor(i/w);
   include(x,y,x+1,y+1);
  }
  for(const e of map.ents){
   const a=e.placedProp?1:0,x=Math.floor(e.x+a),y=Math.floor(e.y+a);
   include(x,y,x+1,y+1);
  }
  for(const z of [...(map.cfg.zones||[]),...decoZones(map.ents)])include(...zBounds(z));
 }
 for(const [x,y] of protectedCells)include(x,y,x+1,y+1);
 return Number.isFinite(x0)?[x0,y0,x1,y1]:null;
}

export function fitDraftGrid(loops,stamps,origin,w,h,bounds,keepOrigin,margin=1){
 if(!loops.length)return null;
 const [ox,oy]=origin;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 const include=(a,b,c,d)=>{
  x0=Math.min(x0,a);y0=Math.min(y0,b);x1=Math.max(x1,c);y1=Math.max(y1,d);
 };
 for(const loop of loops)for(const [x,y] of loop)include(x,y,x,y);
 for(const stamp of stamps)for(const {x,y} of stamp)include(x,y,x+1,y+1);
 if(bounds)include(bounds[0]-ox,bounds[1]-oy,bounds[2]-ox,bounds[3]-oy);
 const left=keepOrigin?0:Math.max(0,Math.floor(x0)-margin);
 const top=keepOrigin?0:Math.max(0,Math.floor(y0)-margin);
 const right=Math.max(left+4,Math.max(Math.ceil(x1),Math.min(w,Math.ceil(x1)+margin)));
 const bottom=Math.max(top+4,Math.max(Math.ceil(y1),Math.min(h,Math.ceil(y1)+margin)));
 return {origin:[ox+left,oy+top],w:right-left,h:bottom-top,
  loops:loops.map(loop=>loop.map(([x,y])=>[x-left,y-top])),
  stamps:stamps.map(stamp=>stamp.map(cell=>({...cell,x:cell.x-left,y:cell.y-top})))};
}

export function rebaseOutlineSource(source,w,h,[ox,oy],mapIndex){
 const m={...source,w,h,layers:source.layers.map(()=>Array(w*h).fill(0)),blk:Array(w*h).fill(0),
   ents:structuredClone(source.ents),cfg:structuredClone(source.cfg)};
 const left=Math.max(0,ox),top=Math.max(0,oy);
 for(let y=top;y<Math.min(source.h,oy+h);y++)for(let x=left;x<Math.min(source.w,ox+w);x++){
  const i=y*source.w+x,j=(y-oy)*w+x-ox;
  for(let l=0;l<m.layers.length;l++)m.layers[l][j]=source.layers[l][i];
  m.blk[j]=source.blk[i];
 }
 for(const e of m.ents){
  e.x-=ox;e.y-=oy;
  if(e.t==='door'&&mapIndex!=null&&Number(e.to)===mapIndex){
   if(e.tx!=null)e.tx-=ox;
   if(e.ty!=null)e.ty-=oy;
  }
 }
 if(m.cfg.outline?.loops)m.cfg.outline.loops=m.cfg.outline.loops.map(loop=>loop.map(([x,y])=>[x-ox,y-oy]));
 for(const z of m.cfg.zones||[])zMove(z,-ox,-oy);
 return m;
}
