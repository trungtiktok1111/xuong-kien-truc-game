import {paintSlab} from './groundfx.js';
import {detailedSurface,surfaceKinds as K,surfaceTypes} from './surfaceTerrain.js';

export const SURFACE_SHEET='Mặt đất · Địa hình và đường';
const cache=new WeakMap();
const isRoute=kind=>kind>=K.main&&kind<=K.trail;

// Trace the cell borders, maintaining the same boundary for both neighboring regions.
export function surfaceContours(tiles,w,h){
 const stride=w+1,at=(x,y)=>x>=0&&x<w&&y>=0&&y<h?tiles[y*w+x]:-1;
 const groups=surfaceTypes.map(()=>new Map());
 function edge(group,start,end){
  if(!group.has(start))group.set(start,[]);
  group.get(start).push(end);
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const type=at(x,y),p=y*stride+x,group=groups[type];
  if(at(x,y-1)!==type)edge(group,p,p+1);
  if(at(x+1,y)!==type)edge(group,p+1,p+1+stride);
  if(at(x,y+1)!==type)edge(group,p+1+stride,p+stride);
  if(at(x-1,y)!==type)edge(group,p+stride,p);
 }
 return groups.map(group=>{
  const loops=[];
  const turn=(a,b)=>a===1?b===stride:a===stride?b===-1:a===-1?b===-stride:b===1;
  while(group.size){
   const start=group.keys().next().value,loop=[];
   let from=start,last=null;
   do{
    const edges=group.get(from);
    if(!edges)break;
    const right=edges.findIndex(to=>turn(from-last,to-from));
    const [to]=edges.splice(Math.max(0,right),1);
    if(!edges.length)group.delete(from);
    loop.push([from%stride,Math.floor(from/stride)]);
    last=from;from=to;
   }while(from!==start);
   if(from!==start||loop.length<4)continue;
   const simplified=loop.filter(([x,y],i)=>{
    const a=loop[(i+loop.length-1)%loop.length],b=loop[(i+1)%loop.length];
    return x-a[0]!==b[0]-x||y-a[1]!==b[1]-y;
   });
   loops.push(simplified);
  }
  return loops;
 });
}

function trace(ctx,loops,w,h){
 ctx.beginPath();
 for(const loop of loops){
  const n=loop.length;
  for(let i=0;i<n;i++){
   const a=loop[(i+n-1)%n],p=loop[i],b=loop[(i+1)%n];
   // Preserve grid-aligned outer limits. Interior corners are rounded by up to half a cell.
   const r=p[0]&&p[1]&&p[0]<w&&p[1]<h?.49:0;
   const near=(other)=>{
    const dx=other[0]-p[0],dy=other[1]-p[1],d=Math.hypot(dx,dy);
    const step=Math.min(r,d/2)/(d||1);
    return [p[0]+dx*step,p[1]+dy*step];
   };
   const entry=near(a),exit=near(b);
   if(i)ctx.lineTo(...entry);else ctx.moveTo(...entry);
   ctx.quadraticCurveTo(...p,...exit);
  }
  ctx.closePath();
 }
}

function terrainGeometry(w,h,spec){
 const existing=cache.get(spec);
 if(existing?.w===w&&existing?.h===h)return existing;
 const plan=detailedSurface(w,h,spec);
 const geo={w,h,loops:surfaceContours(plan.detail.tiles,plan.detail.w,plan.detail.h),detail:plan.detail.scale,patterns:new Map()};
 cache.set(spec,geo);
 return geo;
}

const sketchColors=[
 '#728377','#96a68c','#4c6c57','#778189','#a79b7b','#bab2a3','#b5a581','#728979',
 '#d4c4a4','#c3b395','#b7aa87','#ad9e82','#436b80','#4e8698','#528b99','#71a5ab',
 '#5d929d','#5d8992','#ab8866','#a29283'
];
function terrainPattern(ctx,geo,kind,sheet,index,scale){
 if(!sheet?.img)return null;
 const id=kind+'|'+sheet.name+'|'+index;
 if(!geo.patterns.has(id)){
  const tile=document.createElement('canvas'),tw=sheet.tw;
  tile.width=tile.height=tw;
  const tc=tile.getContext('2d'),step=tw+(sheet.margin||0);
  const sx=index%sheet.cols*step,sy=Math.floor(index/sheet.cols)*step;
  if(sheet.iso)paintSlab(tc,sheet.img,sx,sy,tw,sheet.cy||0,0,0,tw,0);
  else tc.drawImage(sheet.img,sx,sy,tw,tw,0,0,tw,tw);
  geo.patterns.set(id,tile);
 }
 const tile=geo.patterns.get(id),pattern=ctx.createPattern(tile,'repeat');
 pattern?.setTransform(new DOMMatrix().scale(scale/tile.width));
 return pattern;
}

function paintTerrain(ctx,w,h,spec,project,{sheets=[],materials=[],sketch=spec.finish===false}={}){
 const geo=terrainGeometry(w,h,spec),scale=geo.detail;
 const [x,y]=project(0,0),[a,b]=project(1,0),[c,d]=project(0,1);
 const built=sheets.find(sh=>sh?.name===SURFACE_SHEET);
 const custom=materials.map(name=>sheets.find(sh=>sh?.name===name));
 ctx.save();ctx.transform(a-x,b-y,c-x,d-y,x,y);
 ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
 const palette=sketch?sketchColors:surfaceTypes.map(type=>type[2]);
 ctx.fillStyle=palette[K.plain];ctx.fillRect(0,0,w,h);
 // Overlap neighboring colors by a fraction of the detail grid to close antialiasing seams.
 const order=[K.plain,...surfaceTypes.map((_,i)=>i).filter(i=>i!==K.plain)];
 for(const kind of order){
  const loops=geo.loops[kind];
  if(!loops.length)continue;
  const selected=(kind===K.plain||kind===K.meadow||kind===K.plaza)&&custom.length?custom[kind===K.plain?0:kind===K.meadow?1%custom.length:2%custom.length]:null;
  ctx.fillStyle=(!sketch&&terrainPattern(ctx,geo,kind,selected||built,selected?0:kind*4,scale))||palette[kind];
  ctx.strokeStyle=ctx.fillStyle;
  ctx.save();ctx.scale(1/scale,1/scale);
  trace(ctx,loops,w*scale,h*scale);
  ctx.lineWidth=.72;ctx.lineJoin='round';ctx.stroke();ctx.fill('evenodd');
  if(sketch&&kind!==K.plain){
   ctx.strokeStyle=isRoute(kind)?'#f6e0afaa':'#d5e0d76e';
   ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.restore();
 }
 ctx.restore();
}

export function drawSurfaceTerrain(ctx,w,h,spec,project,options={}){
 if(options.sketch)return paintTerrain(ctx,w,h,spec,project,options);
 const geo=terrainGeometry(w,h,spec),key=(options.materials||[]).join('|');
 if(!geo.bitmap||geo.skin!==key){
  const q=Math.max(3,Math.min(40,Math.floor(Math.sqrt(8e6/(w*h))))),tile=document.createElement('canvas');
  tile.width=w*q;tile.height=h*q;
  paintTerrain(tile.getContext('2d'),w,h,spec,(x,y)=>[x*q,y*q],options);
  geo.bitmap=tile;geo.skin=key;
 }
 const [x,y]=project(0,0),[a,b]=project(1,0),[c,d]=project(0,1);
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.transform(a-x,b-y,c-x,d-y,x,y);
 ctx.drawImage(geo.bitmap,0,0,w,h);ctx.restore();
}

export function surfaceTerrainTile(map,sheet){
 if(!map.cfg.outline?.surface)return false;
 return sheet?.name===SURFACE_SHEET||map.cfg.outline.surfaceMaterials?.includes(sheet?.name);
}
