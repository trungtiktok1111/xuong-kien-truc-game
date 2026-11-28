import * as THREE from 'three';
import {mapCollision,rasterOutline} from './mapCollision.js';
import {outlineSupports,projectSegment,WALL_THICKNESS} from './wall2d.js';
import {outline2D} from './outline2d.js';
import {indexPaintZones} from './placement2d.js';

export function fitGate3D(outline,p,width,tolerance=1.25){
 const half=width/2;
 let best=null,distance=tolerance;
 for(const wall of outlineSupports(outline)){
  const a=[wall.x+1,wall.y+1],b=[a[0]+wall.wallLine.dx,a[1]+wall.wallLine.dy];
  const hit=projectSegment(p,a,b);
  if(hit.distance>distance||[a,b].some(q=>Math.hypot(hit.point[0]-q[0],hit.point[1]-q[1])<half+.25))continue;
  const d=Math.hypot(b[0]-a[0],b[1]-a[1]),axis=[(b[0]-a[0])/d,(b[1]-a[1])/d];
  const [x,z]=hit.point;
  const inset=Math.max(.95,(outline.thickness??WALL_THICKNESS)/2+.28);
  const inside=[1,-1].map(k=>[x-k*axis[1]*inset,z+k*axis[0]*inset]).find(q=>inOutline(outline.loops,...q));
  if(!inside)continue;
  best={x,z,axis,inside,width,wallId:wall.id};distance=hit.distance;
 }
 return best;
}

export function inOutline(loops,x,y){
 let inside=false;
 for(const loop of loops)for(let i=0,j=loop.length-1;i<loop.length;j=i++){
  const a=loop[i],b=loop[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}

export function wallSegments3D(outline){
 const entries=(outline.gates||[]).map(g=>({id:g.id,wallId:g.wallId,x:g.x-1,y:g.z-1,
  col:[{x:0,y:0},{x:g.width,y:0}]}));
 // Use the same directional height classification as the plan, including curved edges.
 const geo=outline2D(outline,false,entries);
 return geo?.walls.map(w=>({...w,height:w.near?geo.front:geo.rear}))||[];
}

export function outlineCollision3D(outline,grid){
 if(!outline?.loops?.length||outline.floorCollision===false)return ()=>true;
 const [w,,h]=grid;
 const ground=mapCollision({w,h,blk:new Uint8Array(w*h),cfg:{outline:{...outline,floorCollision:true}}}).floor;
 const zones=wallSegments3D(outline).filter(w=>w.height>0&&!w.removed).map(w=>({k:'line',pts:[w.a,w.b],th:w.thickness,height:w.height}));
 const heights=[...new Set(zones.map(z=>z.height))].map(h=>[h,indexPaintZones(zones.filter(z=>z.height===h))]);
 return (x,z,y,r=.25)=>!!ground?.fits(x,z,r)&&!heights.some(([height,hit])=>y<height-.02&&hit(x,z,r));
}

export function outlineMarkers(outline,w,h,preferred){
 const mask=rasterOutline(outline.loops,w,h),at=p=>p&&p[0]>=0&&p[0]<w&&p[1]>=0&&p[1]<h&&mask[p[1]*w+p[0]];
 const clear=outlineCollision3D(outline,[w,24,h]);
 const valid=(x,z)=>at([x,z])&&clear(x+.5,z+.5,0);
 let start=preferred?.start&&valid(...preferred.start)?preferred.start:null;
 if(!start)for(let z=0;z<h&&!start;z++)for(let x=0;x<w;x++)if(valid(x,z)){start=[x,z];break;}
 if(!start)throw Error('Mặt bằng cần có sàn đủ rộng cho nhân vật.');
 const cells=[start],seen=new Uint8Array(w*h);
 const idx=([x,z])=>z*w+x;
 seen[idx(start)]=1;
 for(let i=0;i<cells.length;i++){
  const [x,z]=cells[i];
  for(const p of [[x+1,z],[x-1,z],[x,z+1],[x,z-1]]){
   if(!valid(...p)||seen[idx(p)]||!clear((x+p[0])/2+.5,(z+p[1])/2+.5,0))continue;
   seen[idx(p)]=1;cells.push(p);
  }
 }
 const end=preferred?.goal&&valid(...preferred.goal)&&seen[idx(preferred.goal)]&&idx(preferred.goal)!==idx(start)?preferred.goal:cells.at(-1);
 return {start,goal:idx(end)!==idx(start)?end:null,includes:p=>valid(...p)&&!!seen[idx(p)]};
}

export function outlineMesh3D(outline){
 const group=new THREE.Group();
 group.name='Đường Bao 3D';
 if(!outline?.loops?.length)return group;
 // Classify by containment, allowing islands and holes regardless of input winding.
 const rings=outline.loops.map(loop=>({loop,children:[],parents:outline.loops.filter(other=>other!==loop&&inOutline([other],...loop[0]))}));
 for(const node of rings){
  if(!node.parents.length)continue;
  const parent=rings.filter(r=>node.parents.includes(r.loop)).sort((a,b)=>b.parents.length-a.parents.length)[0];
  parent.children.push(node);
 }
 const path=(Type,loop)=>new Type(loop.map(([x,z])=>new THREE.Vector2(x,-z)));
 const shapes=rings.filter(n=>n.parents.length%2===0).map(n=>{
  const s=path(THREE.Shape,n.loop);s.holes=n.children.map(h=>path(THREE.Path,h.loop));return s;
 });
 const slab=new THREE.ExtrudeGeometry(shapes,{depth:.24,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,-.24,0);
 const floorMat=new THREE.MeshLambertMaterial({color:outline.color||'#a29b7d'});
 const wallMat=new THREE.MeshLambertMaterial({color:outline.wallColor||'#6f7470'});
 const wallUnit=new THREE.BoxGeometry(1,1,1);
 const foundation=new THREE.Mesh(slab,floorMat);foundation.name='Sàn đường bao';group.add(foundation);
 for(const w of wallSegments3D(outline)){
  if(!(w.height>0)||w.removed)continue;
  const [x,z]=w.a,[u,v]=w.b;
  const m=new THREE.Mesh(wallUnit,wallMat);m.name='Tường bao';
  m.position.set((x+u)/2,w.height/2,(z+v)/2);
  m.scale.set(Math.hypot(u-x,v-z)+.01,w.height,outline.thickness??.24);
  m.rotation.y=-Math.atan2(v-z,u-x);
  group.add(m);
 }
 for(const g of outline.gates||[]){
  const [ux,uz]=g.axis,h=Math.max(2.65,outline.front??1,outline.rear??1);
  for(const [off,y,sx,sy] of [[-g.width/2,h/2,.24,h],[g.width/2,h/2,.24,h],[0,h+.15,g.width+.24,.3]]){
   const m=new THREE.Mesh(wallUnit,wallMat);m.name='Khung cổng';
   m.position.set(g.x+ux*off,y,g.z+uz*off);
   m.scale.set(sx,sy,Math.max(.35,outline.thickness??WALL_THICKNESS));m.rotation.y=-Math.atan2(uz,ux);group.add(m);
  }
 }
 return group;
}

export function disposeOutlineMesh(group){
 const geometry=new Set(),materials=new Set();
 group.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)materials.add(o.material);});
 geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
