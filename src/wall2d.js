export const WALL_THICKNESS=.24;
export const WALL_MIN_THICKNESS=.08;
export const WALL_MAX_THICKNESS=1.5;
export const wallThickness=wall=>wall.wallLine?.thickness??WALL_THICKNESS;

export function projectSegment([x,y],a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  if(!length)return {point:a,distance:Math.hypot(x-a[0],y-a[1])};
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length));
  const point=[a[0]+dx*t,a[1]+dy*t];
  return {point,distance:Math.hypot(x-point[0],y-point[1])};
}
export function wallSpan(wall){
  const a=[wall.x+1,wall.y+1],{dx,dy}=wall.wallLine;
  const length=Math.hypot(dx,dy),u=[dx/length,dy/length];
  const point=d=>[a[0]+u[0]*d,a[1]+u[1]*d];
  return {a,length,u,point};
}

function gateHalf(e){const [a,b]=e.col;return Math.hypot(a.x-b.x,a.y-b.y)/2;}

export function mountGate(e,walls,{distance=1.05,only=e.wallId}={}){
  const [a,b]=e.col||[];
  if(!a||!b)return null;
  const half=gateHalf(e);
  const art=e.gateArt||[b.x-a.x,b.y-a.y];
  let best=null,bestDistance=distance;
  for(const wall of walls){
    if(only&&wall.id!==only)continue;
    const {a,length,u,point}=wallSpan(wall);
    const x=e.x+1-a[0],y=e.y+1-a[1],d=x*u[0]+y*u[1];
    if(!Number.isFinite(d)||d<half+.25||d>length-half-.25)continue;
    const delta=Math.abs(x*u[1]-y*u[0]);
    if(delta>bestDistance)continue;
    bestDistance=delta;
    const center=point(d),sign=art[0]*u[0]+art[1]*u[1]<0?-1:1;
    best={...e,gateArt:art,wallId:wall.id,x:center[0]-1,y:center[1]-1,
      col:[{...e.col[0],x:-u[0]*half*sign,y:-u[1]*half*sign},
        {...e.col[1],x:u[0]*half*sign,y:u[1]*half*sign}]};
  }
  return best;
}

export function wallRuns(wall,ents,ignoreGate){
  const {a,length,u,point}=wallSpan(wall);
  const holes=ents.filter(e=>e.wallId===wall.id&&e.id!==ignoreGate&&e.col?.length>=2).flatMap(e=>{
    const gap=gateHalf(e),x=e.x+1-a[0],y=e.y+1-a[1],d=x*u[0]+y*u[1];
    if(Math.abs(x*u[1]-y*u[0])>.01||d-gap<0||d+gap>length)return [];
    return [[d-gap,d+gap]];
  }).sort((a,b)=>a[0]-b[0]);
  let from=0;
  const runs=[];
  for(const [start,end] of [...holes,[length,length]]){
    if(start>from+.001)runs.push([point(from),point(start)]);
    from=Math.max(from,end);
  }
  return runs;
}

export function builtWallFaces(ents,angle){
  return ents.filter(e=>e.wallLine).flatMap(wall=>wallRuns(wall,ents).flatMap(([a,b])=>{
    const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2),p=t=>a.map((v,i)=>v+(b[i]-v)*t);
    return Array.from({length:n},(_,i)=>{
      const [x,y]=p((i+.5)/n);
      return {a:p(i/n),b:p((i+1)/n),k:angle?y:x+y,near:true,i,height:wall.wallLine.height||1.25,thickness:wallThickness(wall),wall};
    });
  }));
}

export function builtWallZones(ents,ignoreGate){
  return ents.filter(e=>e.wallLine).flatMap(wall=>wallRuns(wall,ents,ignoreGate).map((pts,i)=>({
    id:wall.id+'-'+i,k:'line',pts,th:wallThickness(wall),deco:wall.id
  })));
}
