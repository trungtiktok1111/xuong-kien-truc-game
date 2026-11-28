import {WALL_THICKNESS,outlineSupports,outlineWallRuns,wallRuns,wallSpan} from './wall2d.js';
import {DEFAULT_OUTLINE_WALL_HEIGHT} from './outlineGrid.js';
const cached=new WeakMap();
export function outlineWallImage(outline,sheets){
 const names=outline?.wallMaterials||(outline?.wallMaterial?[outline.wallMaterial]:[]);
 const images=names.map(name=>sheets.find(sheet=>sheet?.name===name)?.img).filter(Boolean);
 images.modules=(outline?.wallModules||[]).map(module=>({...module,sheetData:sheets.find(sheet=>sheet?.name===module.sheet)})).filter(module=>module.sheetData?.img);
 return images;
}
// A single named wall material's image, for a wall run whose wallOverrides entry
// names it — independent of the scene-wide wallMaterial(s)/wallModules above.
export function wallMaterialImage(name,sheets){return sheets.find(sheet=>sheet?.name===name)?.img;}
export function outline2D(data,angle=false,ents=[]){
 if(!data?.loops?.length)return null;
 const variants=cached.get(data)||[];const index=Number(angle);
 if(variants[index])return cutGateOpenings(variants[index],ents,angle);
 const loops=data.loops,edges=loops.flatMap((loop,li)=>loop.map((a,i)=>({a,b:loop[(i+1)%loop.length],loop,li,i})));
 function inside(x,y){
  let yes=false;
  for(const {a,b} of edges)
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  return yes;
 }
 const thickness=data.thickness??WALL_THICKNESS;
 let perimeter=0;
 const walls=edges.flatMap(({a,b,loop,i,li})=>{
  const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,near=inside(angle?mx:mx-.24,my-.24);
  /* cắt cạnh dài thành đoạn ngắn: khóa sắp xếp độ sâu theo từng đoạn, không theo điểm giữa cả cạnh (cạnh dài làm tường đè lên người đứng ở đầu cạnh) */
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(!len)return [];
  let nx=(a[1]-b[1])/len,ny=(b[0]-a[0])/len;
  if(!inside(mx+nx*.0001,my+ny*.0001)){nx=-nx;ny=-ny;}
  const inward=[nx,ny];
  const n=Math.max(1,Math.ceil(len/.5)),out=[];
  for(let j=0;j<n;j++){
   const p=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n],q=[a[0]+(b[0]-a[0])*(j+1)/n,a[1]+(b[1]-a[1])*(j+1)/n];
   const x=(p[0]+q[0])/2,y=(p[1]+q[1])/2;
   const turn=(at,prev,next)=>{
    const ax=at[0]-prev[0],ay=at[1]-prev[1],bx=next[0]-at[0],by=next[1]-at[1];
    return Math.abs(ax*by-ay*bx)>.035*Math.hypot(ax,ay)*Math.hypot(bx,by);
   };
   const before=loop[(i+loop.length-1)%loop.length],after=loop[(i+2)%loop.length];
   out.push({a:p,b:q,k:angle?y:x+y,near,i,loopIndex:li,thickness,inward,phase:perimeter+j*len/n,
    joinStart:j===0&&turn(a,before,b),joinEnd:j===n-1&&turn(b,a,after)});
  }
  perimeter+=len;
  return out;
 });
 const points=loops.flat(),u=points.map(p=>angle?p[0]:p[0]-p[1]),v=points.map(p=>angle?p[1]:(p[0]+p[1])/2);
 const bounds=[Math.min(...u),Math.min(...v),Math.max(...u),Math.max(...v)];
 const supports=outlineSupports(data);
 // Tag each fine render segment with the run it sits on, matched against the UNFILTERED
 // run list (outlineWallRuns) so a segment that never had an owning run at all (too
 // short, or part of a loop with no straight corner — e.g. a dense curve) is left alone,
 // distinct from a segment whose run exists but is in removedWalls. `removed` lets the
 // wall face be skipped while the floor skirt (drawFloorSlab, which reads the same walls
 // array) still draws there unchanged; `material` lets that one run's face use a
 // different texture than the scene default.
 const ownersByEdge=new Map();
 for(const run of outlineWallRuns(data))for(const edge of run.edgeIndexes||[])
  ownersByEdge.set(run.loopIndex+':'+edge,run);
 for(const seg of walls){
  const owner=ownersByEdge.get(seg.loopIndex+':'+seg.i);
  if(!owner)continue;
  if(data.removedWalls?.includes(owner.id))seg.removed=true;
  else{
   const material=data.wallOverrides?.[owner.id];
   if(material!==undefined)seg.material=material;
  }
 }
 const result={loops,walls,perimeter,floorThickness:data.floorThickness??.35,supports,bounds,front:data.front??DEFAULT_OUTLINE_WALL_HEIGHT,rear:data.rear??DEFAULT_OUTLINE_WALL_HEIGHT};
 variants[index]=result;cached.set(data,variants);return cutGateOpenings(result,ents,angle);
}
function cutGateOpenings(geo,ents,angle){
 const portals=ents.filter(e=>e.wallId?.startsWith('outline:'));
 if(!portals.length)return geo;
 const parents=new Map(geo.supports.filter(w=>portals.some(e=>e.wallId===w.id)).map(w=>[w,wallRuns(w,portals)]));
 const walls=geo.walls.flatMap(face=>{
  for(const [wall,runs] of parents){
   const {a,length,u}=wallSpan(wall);
   const coords=p=>{const x=p[0]-a[0],y=p[1]-a[1];return [x*u[0]+y*u[1],x*u[1]-y*u[0]];};
   const [l,p]=coords(face.a),[r,q]=coords(face.b);
   if(Math.abs(p)>1e-5||Math.abs(q)>1e-5||l<-.00001||r>length+.00001||r<=l)continue;
   return runs.flatMap(([c,d])=>{
    const left=Math.max(l,coords(c)[0]),right=Math.min(r,coords(d)[0]);
    if(right-left<1e-5)return [];
    const point=t=>[a[0]+u[0]*t,a[1]+u[1]*t],m=point((left+right)/2);
    return [{...face,a:point(left),b:point(right),phase:face.phase+left-l,k:angle?m[1]:m[0]+m[1]}];
   });
  }
  return [face];
 });
 return {...geo,walls};
}
export function stoneBackdrop(cx,w,h){
 const g=cx.createRadialGradient(w*.51,h*.47,10,w*.51,h*.47,Math.max(w,h)*.62);
 g.addColorStop(0,'#2b4648');g.addColorStop(1,'#101b23');cx.fillStyle=g;cx.fillRect(0,0,w,h);
}
function traceOutline(cx,geometry,project){
 for(const loop of geometry.loops){
  cx.moveTo(...project(...loop[0]));
  for(let i=1;i<loop.length;i++)cx.lineTo(...project(...loop[i]));
  cx.closePath();
 }
}
export function clipOutline(cx,geometry,project){
 cx.beginPath();traceOutline(cx,geometry,project);cx.clip('evenodd');
}
export function drawFloorSlab(cx,geometry,project,unit){
 const depth=Math.max(0,Math.min(4,geometry.floorThickness))*unit;
 if(!depth)return;
 for(const {a,b,inward} of geometry.walls){
  const p=project(...a),q=project(...b);
  const inner=project(a[0]+inward[0],a[1]+inward[1]);
  if(inner[1]>=p[1])continue;
  face(cx,[p,q,[q[0],q[1]+depth],[p[0],p[1]+depth]],inward[0]<inward[1]?'#8f7759':'#685641');
 }
}
export function drawFloorCollision(cx,geometry,project,width,height,showWalkable=false){
 cx.save();
 if(showWalkable){
  cx.fillStyle='rgba(40,220,90,.14)';
  cx.beginPath();traceOutline(cx,geometry,project);cx.fill('evenodd');
 }
 cx.fillStyle='rgba(255,40,40,.42)';cx.beginPath();cx.rect(0,0,width,height);
 traceOutline(cx,geometry,project);cx.fill('evenodd');
 cx.beginPath();traceOutline(cx,geometry,project);
 cx.strokeStyle='#ff8a8a';cx.lineWidth=1;cx.stroke();cx.restore();
}
const colors=[['#3d4848','#475452','#55615a'],['#525c57','#666e62','#72776a']];
function face(cx,points,fill,stroke){
 cx.beginPath();cx.moveTo(...points[0]);for(let i=1;i<points.length;i++)cx.lineTo(...points[i]);
 cx.closePath();cx.fillStyle=fill;cx.fill();
 if(stroke){cx.strokeStyle=stroke;cx.stroke();}
}
// Positive elevation is screen-up. The footprint stays in map units.
export function wallSurface(wall,project,unit,geometry){
 const {a,b}=wall,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
 if(!len)return null;
 const high=unit*(wall.height??(wall.near?geometry.front:geometry.rear));
 const r=(wall.thickness??WALL_THICKNESS)/2,nx=-dy*r/len,ny=dx*r/len;
 const [ix,iy]=wall.inward||[0,0];
 const f=(p,k)=>project(p[0]+k*nx+ix*r,p[1]+k*ny+iy*r);
 const first=[f(a,1),f(b,1)],second=[f(a,-1),f(b,-1)];
 const near=first[0][1]+first[1][1]>=second[0][1]+second[1][1];
 return {front:near?first:second,back:near?second:first,high};
}

export function stoneWall(cx,wall,project,unit,w,h,geometry,texture=null,sheets=null){
 if(wall.removed)return;
 if(wall.material&&sheets){
  const override=wallMaterialImage(wall.material,sheets);
  if(override)texture=[override];
 }
 if(Array.isArray(texture)&&!texture.modules?.length)texture=texture[Math.min(texture.length-1,Math.floor((wall.phase||0)*texture.length/(geometry?.perimeter||1)))];
 const shape=wallSurface(wall,project,unit,geometry);
 if(!shape||shape.high<=0)return;
 const {front,back,high}=shape,[[x,y],[a,b]]=front;
 if(Math.max(x,a,back[0][0],back[1][0])<0||Math.min(x,a,back[0][0],back[1][0])>w||
    Math.max(y,b)<0||Math.min(y,b,back[0][1],back[1][1])-high>h)return;
 cx.lineWidth=.55;
 const modules=texture?.modules||[];
 const moduleWall=modules.length>0&&wall.phase!==undefined;
 const textured=!moduleWall&&texture&&wall.phase!==undefined;
 if(moduleWall){
  // The selected objects are the perimeter wall itself; omit the ordinary wall
  // faces and corner caps so assets do not become decoration on a backing wall.
  const length=Math.hypot(wall.b[0]-wall.a[0],wall.b[1]-wall.a[1]);
  const phase=wall.phase||0,end=phase+length;
  // Calibrate each construction block to the wall height and anchor-derived width.
  // Use one shared pitch to keep the sequence regular, and modestly widen narrow
  // pieces to close seams. Sprites stay upright: rotating the image tilts its axis.
  const targetHigh=high/unit,widths=modules.map(module=>{
   const body=Math.max(.05,module.bodyHeight||1),scale=targetHigh/body;
   return Math.max(.08,body*(module.aspect||.55)*scale,(wall.thickness??WALL_THICKNESS)*1.1);
  });
  const sortedWidths=[...widths].sort((a,b)=>a-b),blockWidth=sortedWidths[Math.floor(sortedWidths.length/2)];
  const pitch=Math.max(.08,blockWidth*.72);
  {
   const first=Math.ceil((phase-pitch*.5)/pitch);
   for(let n=first;;n++){
    const center=(n+.5)*pitch;
    if(center>=end)break;
    if(center<phase||center>=end)continue;
    const t=(center-phase)/Math.max(.001,length);
    if(t<0||t>1)continue;
    const moduleIndex=((Math.floor(center/pitch)%modules.length)+modules.length)%modules.length;
    const module=modules[moduleIndex];
    const x=wall.a[0]+(wall.b[0]-wall.a[0])*t,y=wall.a[1]+(wall.b[1]-wall.a[1])*t;
    const [nx,ny]=wall.inward||[0,0];
    const setback=Math.max(wall.thickness??WALL_THICKNESS,widths[moduleIndex]*.8)/2;
    const [px,py]=project(x+nx*setback,y+ny*setback),sheet=module.sheetData,tw=sheet.tw,step=tw+(sheet.margin||0),idx=0;
    const cols=sheet.cols||1,sx=(idx%cols)*step,sy=Math.floor(idx/cols)*step,bounds=module.bounds||[0,0,1,1];
    const sw=(bounds[2]-bounds[0])*tw,sh=(bounds[3]-bounds[1])*tw;
    const dw=Math.max(widths[moduleIndex],pitch)*unit*1.12,dh=targetHigh*unit;
    cx.save();cx.translate(px,py);
    cx.drawImage(sheet.img,sx+bounds[0]*tw,sy+bounds[1]*tw,sw,sh,-dw/2,-dh,dw,dh);
    cx.restore();
   }
  }
  return;
 }
 if(textured){
  const span=Math.hypot(wall.a[0]-wall.b[0],wall.a[1]-wall.b[1]);
  const phase=wall.phase%1;
  cx.save();
  cx.transform((a-x)/span,(b-y)/span,0,high,x,y-high);
  cx.beginPath();cx.rect(0,0,span,1);cx.clip();
  cx.imageSmoothingEnabled=true;
  for(let u=-phase;u<span;u++)cx.drawImage(texture,u,0,1,1);
  if(wall.near){cx.fillStyle='rgba(37,25,12,.19)';cx.fillRect(0,0,span,1);}
  cx.restore();
 }else for(let i=0;i<3;i++){
  const palette=colors[Number(wall.near)];
  const n=high*i/3,m=high*(i+1)/3;
  face(cx,[[x,y-n],[a,b-n],[a,b-m],[x,y-m]],palette[(i+(wall.i%17===0?1:0))%3],i?'#424d49':'#2e3b3a');
 }
 face(cx,[...front,...back.slice().reverse()].map(([px,py])=>[px,py-high]),textured?'#c8af88':wall.near?'#8d8d76':'#818679');
 // Close only real corners. This overlaps the two adjoining wall ends and hides
 // triangular cracks without drawing seams at the short render subdivisions.
 if(wall.joinStart||wall.joinEnd){
  const p=wall.joinStart?front[0]:front[1],[x0,y0]=p;
  const r=(wall.thickness??WALL_THICKNESS)*unit*.56;
  const color=moduleWall?'#806246':textured?'#c8af88':wall.near?'#8d8d76':'#818679';
  cx.save();cx.fillStyle=color;cx.beginPath();cx.ellipse(x0,y0-high/2,Math.max(1,r),high/2+r*.35,0,0,Math.PI*2);cx.fill();cx.restore();
 }
}
