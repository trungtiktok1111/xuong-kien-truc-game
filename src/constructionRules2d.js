import {roofTextureDirection} from './placement2d.js';
import {outline2D} from './outline2d.js';
import {wallThickness,wallSpan,mountGate,builtWallZones,outlineSupports,gateLanding,wallRuns} from './wall2d.js';
import {mapCollision} from './mapCollision.js';
import {gateLayout} from './gate2d.js';
import {decoZones,zonesHit} from './zones.js';

const clearance=.32;
function gateApproach(g){
  const [x,y]=g.center,[nx,ny]=g.normal,d=Math.max(.8,g.thickness/2+clearance+.2);
  return [[x-nx*d,y-ny*d],[x+nx*d,y+ny*d]];
}
const along=(a,b,visit)=>{
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.10));
  for(let i=0;i<=n;i++)if(!visit(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))return false;
  return true;
};

export function constructionContext(map,placementZones=map.placementZones){
  const outline=map.cfg?.outline;
  const collision=mapCollision({...map,placementZones,cfg:{...map.cfg,
    outline:outline?.loops?.length?{...outline,floorCollision:true}:outline}});
  const ground=map.layers?.[0];
  const floor=(x,y,r)=>{
    if(x-r<0||y-r<0||x+r>=map.w||y+r>=map.h)return false;
    if(collision.floor)return collision.floor.fits(x,y,r);
    return !!ground&&[[0,0],[-r,0],[r,0],[0,-r],[0,r]].every(([dx,dy])=>
      ground[Math.floor(y+dy)*map.w+Math.floor(x+dx)]);
  };
  let bearings;
  const bearingSurfaces=()=>bearings??=roofSupports(map,floor);
  return {floor,bearingSurfaces,free:collision.free,manual:map.cfg?.zones||[],
    objects:decoZones(map.ents),walls:[...(map.ents||[]).filter(e=>e.wallLine),...outlineSupports(outline)],gates:(map.ents||[]).filter(e=>e.gateAssembly),markers:(map.ents||[]).filter(e=>['start','goal','door','npc','chest'].includes(e.t))};
}

export function isRoof(e){
  return e.t==='deco'&&!e.flat&&!e.wallLine&&!!(e.roofDirection||(e.roofSurface??roofTextureDirection(e.name,true)));
}

export function isBearingColumn(name){
  const text=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('đ','d').replaceAll('_',' ');
  return /\b(?:cot|pillar|column|post)(?:\b|[0-9])/.test(text)&&!/\b(?:co|flag|lamp|den|light)\b/.test(text);
}

function roofSupports(map,floor){
  const ents=map.ents||[],outline=map.cfg?.outline;
  const bound=outline2D(outline,map.cfg?.proj==='angle',ents);
  const surfaces=(bound?.walls||[]).map(w=>({a:w.a,b:w.b,key:'outline:'+w.i,height:w.near?bound.front:bound.rear}));
  for(const e of ents){
    if(e.wallLine){
      for(const [a,b] of wallRuns(e,ents)){
        if(along(a,b,(x,y)=>floor(x,y,wallThickness(e)/2)))
          surfaces.push({a,b,key:e,height:e.wallLine.height??1.25});
      }
    }else if(e.placedProp&&(e.bearingColumn??isBearingColumn(e.name))&&!isRoof(e)&&!e.wallId&&!e.gateAssembly){
      const x=e.x+1,y=e.y+1;
      const height=((e.spriteBounds?.[3]??1)-(e.spriteBounds?.[1]??0))*(e.sc||0)/.75;
      if(floor(x,y,.06))surfaces.push({a:[x,y],b:[x,y],key:e,height});
    }
  }
  return surfaces.filter(s=>Number.isFinite(s.height)&&s.height>=.75);
}

export function roofBearing(e,context){
  const cx=e.x+1,cy=e.y+1,side=(e.sc||.95)/.95;
  if(![cx,cy,side].every(Number.isFinite)||side<=0)return null;
  const direction=e.roofDirection||'E',axis=direction==='E'||direction==='W'?0:1;
  const sign=direction==='W'||direction==='N'?-1:1;
  const low=[],high=[];
  const accept=(x,y,height,key)=>{
    const offset=[x-cx,y-cy],u=sign*offset[axis]/side,v=offset[1-axis]/side;
    if(Math.abs(u)>.51||Math.abs(v)>.51||Math.abs(u)<.18)return;
    (u<0?low:high).push({x,y,u,v,height,key});
  };
  for(const {a,b,height,key} of context.bearingSurfaces()){
    if(Math.min(a[0],b[0])>cx+side*.51||Math.max(a[0],b[0])<cx-side*.51||
       Math.min(a[1],b[1])>cy+side*.51||Math.max(a[1],b[1])<cy-side*.51)continue;
    // Only a segment's top can carry a roof. Sampling includes both ends and the closest point.
    accept(...projectToRoofCenter(a,b,cx,cy),height,key);
    along(a,b,(x,y)=>{accept(x,y,height,key);return true;});
  }
  let best=null;
  for(const a of low)for(const b of high){
    if(a.key===b.key||Math.abs((a.v+b.v)/2)>.24)continue;
    const rise=(b.height-a.height)/(b.u-a.u);
    if(rise<-.025||rise>1.2*side)continue;
    const base=a.height-rise*(a.u+.5);
    if(base<.65)continue;
    const score=Math.abs(a.v)+Math.abs(b.v)+Math.abs(rise/side-.45)*.2-(b.u-a.u)*.1;
    if(!best||score<best.score)best={base,rise,score,contacts:[a,b].map(({x,y,height})=>({x,y,height}))};
  }
  return best;
}

function projectToRoofCenter(a,b,x,y){
  const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/len)):0;
  return [a[0]+dx*t,a[1]+dy*t];
}

export const roofIssue='Mái cần tường hoặc cột có nền đỡ ở hai phía, đúng cao độ.';

export function roofPlacementProblems(map,context=constructionContext(map)){
  return (map.ents||[]).filter(isRoof).filter(e=>!roofBearing(e,context));
}

export function gateIssue(e,context){
  if(!e.gateAssembly)return '';
  const g=gateLayout(e);
  if(!g)return 'Cổng cần hai chân trụ đã hiệu chỉnh.';
  if(e.wallId&&!mountGate(e,context.walls,{distance:.015}))return 'Cổng đã lệch khỏi tuyến tường. Hãy lắp lại trên tường.';
  if(e.wallId&&context.gates.some(other=>other.id!==e.id&&other.wallId===e.wallId&&
    Math.hypot(e.x-other.x,e.y-other.y)<g.posts.reduce((sum,p)=>sum+Math.hypot(p[0]-g.center[0],p[1]-g.center[1]),0)/2+
      Math.hypot(other.col[0].x-other.col[1].x,other.col[0].y-other.col[1].y)/2+.12))
    return 'Hai lỗ mở trên tường quá gần nhau.';
  if(g.opening<2*clearance)return 'Lối qua cổng quá hẹp. Hãy tăng kích thước.';
  const {floor,free,manual,objects,markers}=context;
  const others=objects.filter(z=>z.deco!==e.id&&z.deco!==e.wallId);
  const occupied=(x,y,r)=>zonesHit(manual,x,y,r)||zonesHit(others,x,y,r);
  const parent=context.walls.find(w=>w.id===e.wallId);
  if(parent?.outlineWall){
    const p=gateLanding(e,floor);
    if(!p||!free(...p,clearance)||occupied(...p,clearance)||
      zonesHit(builtWallZones([parent,e]),...p,clearance))
      return 'Chừa một điểm đứng thông thoáng phía trong cổng bao.';
    return '';
  }
  if(!g.posts.every(([x,y],i)=>floor(x,y,e.col[i].r))||
    (!e.wallId&&!g.wings.every(([a,b])=>along(a,b,(x,y)=>floor(x,y,g.thickness/2)))))
    return 'Hai đoạn tường phải nằm trên sàn. Hãy đổi vị trí hoặc hướng.';
  const clear=(x,y,r)=>free(x,y,r)&&!occupied(x,y,r);
  if(!g.posts.every(([x,y],i)=>clear(x,y,e.col[i].r))||
    (!e.wallId&&!g.wings.every(([a,b])=>along(a,b,(x,y)=>clear(x,y,g.thickness/2)))))
    return 'Chân trụ hoặc tường đang đè lên vùng chặn có sẵn.';
  const edges=parent?builtWallZones([parent,e]):[];
  if(!along(...gateApproach(g),
    (px,py)=>floor(px,py,clearance)&&free(px,py,clearance)&&!occupied(px,py,clearance)&&!zonesHit(edges,px,py,clearance)))
    return 'Cổng cần lối đi thông thoáng ở cả hai phía.';
  const zones=decoZones([e]);
  if(markers.some(m=>zonesHit(zones,m.x+.5,m.y+.5,clearance)))
    return 'Dời cổng khỏi điểm xuất phát, đích hoặc đối tượng tương tác.';
  return '';
}

export function propIssue(e,context){
  if(e.gateAssembly)return gateIssue(e,context);
  if(isRoof(e))return roofBearing(e,context)?'':roofIssue;
  if(!e.buildChecks)return '';
  if(!context.floor(e.x+1,e.y+1,.06))return 'Đặt chân vật thể trên sàn.';
  if(e.walk)return '';
  const zones=decoZones([e]);
  if(context.markers.some(m=>zonesHit(zones,m.x+.5,m.y+.5,clearance)))
    return 'Vật thể đang che điểm xuất phát, đích hoặc đối tượng tương tác.';
  for(const gate of context.gates){
    const layout=gateLayout(gate);
    if(layout&&!along(...gateApproach(layout),(x,y)=>!zonesHit(zones,x,y,clearance)))
      return 'Vật thể đang chắn lối qua cổng.';
  }
  return '';
}

export function wallHasFoundation(wall,context){
  const {a,length,point}=wallSpan(wall),r=wallThickness(wall)/2;
  return length>=.24&&along(a,point(length),(x,y)=>context.floor(x,y,r));
}

export function wallIssue(wall,context){
  const {a,length,point}=wallSpan(wall),th=wallThickness(wall),r=th/2;
  if(length<.24)return 'Chọn hai điểm khác nhau để dựng tường.';
  const b=point(length);
  if(!wallHasFoundation(wall,context))return 'Toàn bộ chân tường cần có sàn đỡ.';
  const zones=[...context.manual,...context.objects.filter(z=>!context.walls.some(w=>w.id===z.deco))];
  if(!along(a,b,(x,y)=>context.free(x,y,r)&&!zonesHit(zones,x,y,r)))return 'Tuyến tường đè lên vùng chặn hoặc vật thể.';
  if(context.markers.some(m=>zonesHit([{k:'line',pts:[a,b],th}],m.x+.5,m.y+.5,clearance)))
    return 'Tuyến tường đè lên điểm xuất phát, đích hoặc đối tượng tương tác.';
  for(const gate of context.gates){
    const layout=gateLayout(gate);
    if(layout&&!along(...gateApproach(layout),(x,y)=>!zonesHit([{k:'line',pts:[a,b],th}],x,y,clearance)))
      return 'Tuyến tường chắn lối qua cổng đã có.';
  }
  return '';
}
