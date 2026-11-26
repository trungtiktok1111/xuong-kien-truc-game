import {drawSurfaceTerrain,surfaceTerrainTile} from './surfaceContours.js';
import {clipOutline,outline2D,outlineWallImage,stoneBackdrop,stoneWall} from './outline2d.js';
import {slab,tile192,mirF} from './isoslab.js';
import {drawPlacedProp,placedPropFrame} from './proj.js';
import {builtWallFaces} from './wall2d.js';
import {gateWalls} from './gate2d.js';
import {tiledDepth} from './tiledScene.js';
import {paintedPieces} from './placement2d.js';

function tileFrame(value,sheets){
 const raw=value-1,index=(raw>>3)&4095,sheet=sheets[raw>>15];
 if(!sheet?.img)return null;
 const step=sheet.tw+(sheet.margin||0);
 return {sheet,index,x:index%sheet.cols*step,y:Math.floor(index/sheet.cols)*step,flags:raw&7};
}

export function drawOutlineDraft(canvas,{M:map,sheets}){
 const cx=canvas.getContext('2d'),{width,height}=canvas;
 const {w,h,ents}=map,geo=outline2D(map.cfg.outline,false,ents);
 if(!geo)return;
 const [x0,y0,x1,y1]=geo.bounds;
 const s=Math.min((width-28)/Math.max(1,x1-x0),(height-28)/Math.max(1,y1-y0+Math.max(geo.front,geo.rear,3)));
 const project=(x,y)=>[width/2+(x-y-(x0+x1)/2)*s,height/2+((x+y)/2-(y0+y1)/2+1.2)*s];
 stoneBackdrop(cx,width,height);
 cx.save();clipOutline(cx,geo,project);
 const {surface,surfaceMaterials}=map.cfg.outline;
 if(surface)drawSurfaceTerrain(cx,w,h,surface,project,{sheets,materials:surfaceMaterials});
 if(surface?.finish===false){cx.restore();return;}
 for(const layer of [0,1])for(let i=0;i<w*h;i++){
  const value=map.layers[layer][i];
  if(!value)continue;
  const frame=tileFrame(value,sheets);
  if(!frame||layer===0&&surfaceTerrainTile(map,frame.sheet))continue;
  const {sheet,index,x,y,flags}=frame,tw=sheet.tw,gx=i%w,gy=Math.floor(i/w),[px,py]=project(gx,gy);
  if(sheet.iso===2)tile192(cx,sheet.img,x,y,tw,sheet.cy||0,px,py,s,sheet.wat?.includes(index)?mirF(gx,gy):0);
  else if(sheet.iso)slab(cx,sheet.img,x,y,tw,px,py,s,flags);
  else{
   cx.save();cx.transform(s,s/2,-s,s/2,px,py);
   cx.translate(.5,.5);
   if(flags&4){cx.rotate(Math.PI/2);cx.scale(1,-1);}
   cx.scale(flags&1?-1:1,flags&2?-1:1);
   cx.drawImage(sheet.img,x,y,tw,tw,-.5,-.5,1.025,1.025);cx.restore();
  }
 }
 cx.restore();
 const items=[...geo.walls,...builtWallFaces(ents,false),...ents.flatMap(e=>gateWalls(e,false))]
  .map(wall=>({depth:wall.k,wall}));
 const roofs=[];
 const spawn=ents.find(e=>e.t==='start');
 if(spawn&&map.cfg.outlineHero){
  const hero={...map.cfg.outlineHero,tile:map.cfg.hero,x:spawn.x-.5,y:spawn.y-.5,placedProp:true};
  items.push({depth:spawn.x+spawn.y+1,e:hero});
 }
 for(const e of ents){
  if(e.t!=='deco'||!e.tile)continue;
  const row={depth:e.tiledLayer===undefined?e.x+e.y+2:tiledDepth(e,w,h,false),e};
  (e.sceneLayer===3?roofs:items).push(row);
 }
 for(const l of [2,3])for(const group of paintedPieces(map.layers[l],w,h)){
  const row={depth:group.xc+group.yb,group,layer:l};
  (l===3?roofs:items).push(row);
 }
 const texture=outlineWallImage(map.cfg.outline,sheets);
 for(const {wall,e,group,layer} of [...items.sort((a,b)=>a.depth-b.depth),...roofs.sort((a,b)=>a.depth-b.depth)]){
  if(wall){stoneWall(cx,wall,project,s,width,height,geo,texture);continue;}
  if(e?.placedProp){drawPlacedProp(cx,e,sheets[e.tile.sid],placedPropFrame(e,project,s/.75,'iso'));continue;}
  if(e){
   const frame=tileFrame((e.tile.sid*4096+e.tile.idx)*8+1,sheets);
   if(!frame)continue;
   const {sheet,x,y}=frame,side=(e.sc||3)*s/.75,[px,py]=project(e.x+1,e.y+1);
   cx.drawImage(sheet.img,x,y,sheet.tw,sheet.tw,px-side/2+(e.ox||0)*side,py-side+(e.oy||0)*side,side,side);
   continue;
  }
  const side=s*.95/.75,[px,py]=project(group.xc,group.yb);
  for(const i of group.cells){
   const frame=tileFrame(map.layers[layer][i],sheets);
   if(frame)cx.drawImage(frame.sheet.img,frame.x,frame.y,frame.sheet.tw,frame.sheet.tw,
     px+(i%w-group.xc)*side,py+(Math.floor(i/w)-group.yb)*side,side,side);
  }
 }
}
