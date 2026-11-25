import {rasterOutline} from './mapCollision.js';

// Both map dimensions are limited to 600 cells.
const STRIDE=1024;
const key=(x,y)=>y*STRIDE+x;

function* outlineCells(loops,w,h){
 const mask=rasterOutline(loops,w,h);
 let x0=w,x1=0,y0=h,y1=0;
 for(const loop of loops)for(const [x,y] of loop){
  x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
 }
 for(let y=Math.max(0,Math.floor(y0)-1);y<Math.min(h,Math.ceil(y1)+1);y++){
  for(let x=Math.max(0,Math.floor(x0)-1);x<Math.min(w,Math.ceil(x1)+1);x++){
   const i=y*w+x,on=!!mask[i];
   const edge=x>0&&mask[i-1]||x+1<w&&mask[i+1]||y>0&&mask[i-w]||y+1<h&&mask[i+w];
   if(on||edge)yield {x,y,on};
  }
 }
}

export function captureOutlineTiles(loops,source,stamps,w,h,[ox,oy]=[0,0]){
 const placed=new Map();
 for(const stamp of stamps)for(const {x,y,tiles} of stamp){
  const k=key(x,y),prior=placed.get(k);
  placed.set(k,prior?tiles.map((v,l)=>v||prior[l]):tiles);
 }
 const cells=new Map();
 for(const {x,y,on} of outlineCells(loops,w,h)){
  const k=key(x,y),pasted=placed.get(k);
  const i=source&&x+ox<source.w&&y+oy<source.h?(y+oy)*source.w+x+ox:-1;
  const tiles=Array.from({length:on?4:1},(_,l)=>pasted?.[l]||(i>=0?source.layers[l][i]:0));
  if(tiles.some(Boolean))cells.set(k,tiles);
 }
 return cells;
}

export function placeOutlineTiles(cells,loops,transform,w,h,remap){
 if(!cells.size)return [];
 const {x:ox,y:oy,dx,dy,c,s}=transform;
 const out=[];
 for(const {x,y,on} of outlineCells(loops,w,h)){
  const a=x+.5-ox-dx,b=y+.5-oy-dy;
  const u=Math.floor(ox+c*a+s*b),v=Math.floor(oy-s*a+c*b);
  if(u<0||v<0||u>=STRIDE)continue;
  const cell=cells.get(key(u,v));
  if(!cell)continue;
  const tiles=(on?cell:cell.slice(0,1)).map(remap);
  if(tiles.some(Boolean))out.push({x,y,tiles});
 }
 return out;
}
