import {WALL_THICKNESS} from './wall2d.js';
import {DEFAULT_OUTLINE_WALL_HEIGHT} from './outlineGrid.js';
const cached=new WeakMap();
export function outline2D(data,angle=false){
 if(!data?.loops?.length)return null;
 const variants=cached.get(data)||[];const index=Number(angle);
 if(variants[index])return variants[index];
 const loops=data.loops,edges=loops.flatMap(loop=>loop.map((a,i)=>[a,loop[(i+1)%loop.length]]));
 function inside(x,y){
  let yes=false;
  for(const [a,b] of edges)
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  return yes;
 }
 const thickness=data.thickness??WALL_THICKNESS;
 const walls=edges.flatMap(([a,b],i)=>{
  const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,near=inside(angle?mx:mx-.24,my-.24);
  /* cắt cạnh dài thành đoạn ngắn: khóa sắp xếp độ sâu theo từng đoạn, không theo điểm giữa cả cạnh (cạnh dài làm tường đè lên người đứng ở đầu cạnh) */
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5)),out=[];
  for(let j=0;j<n;j++){
   const p=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n],q=[a[0]+(b[0]-a[0])*(j+1)/n,a[1]+(b[1]-a[1])*(j+1)/n];
   const x=(p[0]+q[0])/2,y=(p[1]+q[1])/2;
   out.push({a:p,b:q,k:angle?y:x+y,near,i,thickness});
  }
  return out;
 });
 const points=loops.flat(),u=points.map(p=>angle?p[0]:p[0]-p[1]),v=points.map(p=>angle?p[1]:(p[0]+p[1])/2);
 const bounds=[Math.min(...u),Math.min(...v),Math.max(...u),Math.max(...v)];
 const result={loops,walls,bounds,front:data.front??DEFAULT_OUTLINE_WALL_HEIGHT,rear:data.rear??DEFAULT_OUTLINE_WALL_HEIGHT};
 variants[index]=result;cached.set(data,variants);return result;
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
 const f=(p,k)=>project(p[0]+k*nx,p[1]+k*ny);
 const first=[f(a,1),f(b,1)],second=[f(a,-1),f(b,-1)];
 const near=first[0][1]+first[1][1]>=second[0][1]+second[1][1];
 return {front:near?first:second,back:near?second:first,high};
}

export function stoneWall(cx,wall,project,unit,w,h,geometry){
 const shape=wallSurface(wall,project,unit,geometry);
 if(!shape||shape.high<=0)return;
 const {front,back,high}=shape,[[x,y],[a,b]]=front;
 if(Math.max(x,a,back[0][0],back[1][0])<0||Math.min(x,a,back[0][0],back[1][0])>w||
    Math.max(y,b)<0||Math.min(y,b,back[0][1],back[1][1])-high>h)return;
 cx.lineWidth=.55;
 const palette=colors[Number(wall.near)];
 for(let i=0;i<3;i++){
  const n=high*i/3,m=high*(i+1)/3;
  face(cx,[[x,y-n],[a,b-n],[a,b-m],[x,y-m]],palette[(i+(wall.i%17===0?1:0))%3],i?'#424d49':'#2e3b3a');
 }
 face(cx,[...front,...back.slice().reverse()].map(([px,py])=>[px,py-high]),wall.near?'#8d8d76':'#818679');
}
