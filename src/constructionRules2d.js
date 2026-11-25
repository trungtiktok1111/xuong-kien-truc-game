import {WALL_THICKNESS,wallSpan,mountGate} from './wall2d.js';
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
  return {floor,free:collision.free,manual:map.cfg?.zones||[],
    objects:decoZones(map.ents),walls:(map.ents||[]).filter(e=>e.wallLine),gates:(map.ents||[]).filter(e=>e.gateAssembly),markers:(map.ents||[]).filter(e=>['start','goal','door','npc','chest'].includes(e.t))};
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
  if(!g.posts.every(([x,y],i)=>floor(x,y,e.col[i].r))||
    (!e.wallId&&!g.wings.every(([a,b])=>along(a,b,(x,y)=>floor(x,y,g.thickness/2)))))
    return 'Hai đoạn tường phải nằm trên sàn. Hãy đổi vị trí hoặc hướng.';
  const clear=(x,y,r)=>free(x,y,r)&&!occupied(x,y,r);
  if(!g.posts.every(([x,y],i)=>clear(x,y,e.col[i].r))||
    (!e.wallId&&!g.wings.every(([a,b])=>along(a,b,(x,y)=>clear(x,y,g.thickness/2)))))
    return 'Chân trụ hoặc tường đang đè lên vùng chặn có sẵn.';
  if(!along(...gateApproach(g),
    (px,py)=>floor(px,py,clearance)&&free(px,py,clearance)&&!occupied(px,py,clearance)))
    return 'Cổng cần lối đi thông thoáng ở cả hai phía.';
  const zones=decoZones([e]);
  if(markers.some(m=>zonesHit(zones,m.x+.5,m.y+.5,clearance)))
    return 'Dời cổng khỏi điểm xuất phát, đích hoặc đối tượng tương tác.';
  return '';
}

export function propIssue(e,context){
  if(e.gateAssembly)return gateIssue(e,context);
  if(e.walk||!e.buildChecks)return '';
  if(!context.floor(e.x+1,e.y+1,.06))return 'Đặt chân vật thể trên sàn.';
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

export function wallIssue(wall,context){
  const {a,length,point}=wallSpan(wall),r=WALL_THICKNESS/2;
  if(length<.24)return 'Chọn hai điểm khác nhau để dựng tường.';
  const b=point(length);
  if(!along(a,b,(x,y)=>context.floor(x,y,r)))return 'Toàn bộ chân tường cần có sàn đỡ.';
  const zones=[...context.manual,...context.objects.filter(z=>!context.walls.some(w=>w.id===z.deco))];
  if(!along(a,b,(x,y)=>context.free(x,y,r)&&!zonesHit(zones,x,y,r)))return 'Tuyến tường đè lên vùng chặn hoặc vật thể.';
  if(context.markers.some(m=>zonesHit([{k:'line',pts:[a,b],th:WALL_THICKNESS}],m.x+.5,m.y+.5,clearance)))
    return 'Tuyến tường đè lên điểm xuất phát, đích hoặc đối tượng tương tác.';
  for(const gate of context.gates){
    const layout=gateLayout(gate);
    if(layout&&!along(...gateApproach(layout),(x,y)=>!zonesHit([{k:'line',pts:[a,b],th:WALL_THICKNESS}],x,y,clearance)))
      return 'Tuyến tường chắn lối qua cổng đã có.';
  }
  return '';
}
