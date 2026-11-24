import clipping from 'polygon-clipping';

export function ellipseLoop(cx,cy,rx,ry){
 return Array.from({length:64},(_,i)=>{
  const angle=i*Math.PI/32;
  return [cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry];
 });
}
const poly=(...points)=>[points];
const rect=(x0,y0,x1,y1)=>rectangleLoop([x0,y0],[x1,y1]);
const disk=(x,y,r)=>ellipseLoop(x,y,r,r);
const join=(...loops)=>loops.reduce((region,loop)=>combineOutline(region,[loop],'add'),[]);
const radial=(count,radius,angle=-Math.PI/2)=>Array.from({length:count},(_,i)=>{
 const t=angle+i*2*Math.PI/count,r=radius(i,t);
 return [.5+r*Math.cos(t),.5+r*Math.sin(t)];
});
function windingBand(start,end,radius,halfWidth){
 const edge=offset=>Array.from({length:72},(_,i)=>{
  const t=i/71,a=start+t*(end-start),r=radius(t)+offset;
  return [.5+r*Math.cos(a),.5+r*Math.sin(a)];
 });
 return [...edge(halfWidth),...edge(-halfWidth).reverse()];
}
export const outlineShapes=[
 {id:'hall',name:'Đại sảnh',loops:poly([.08,.24],[.92,.24],[.92,.76],[.08,.76])},
 {id:'round',name:'Phòng tròn',square:true,loops:[ellipseLoop(.5,.5,.43,.43)]},
 {id:'ring',name:'Sân vành khuyên',square:true,loops:[ellipseLoop(.5,.5,.44,.44),ellipseLoop(.5,.5,.20,.20)]},
 {id:'l',name:'Phòng chữ L',loops:poly([.08,.12],[.42,.12],[.42,.58],[.92,.58],[.92,.88],[.08,.88])},
 {id:'u',name:'Sân chữ U',loops:poly([.08,.12],[.32,.12],[.32,.64],[.68,.64],[.68,.12],[.92,.12],[.92,.88],[.08,.88])},
 {id:'octagon',name:'Phòng bát giác',square:true,loops:poly([.32,.08],[.68,.08],[.92,.32],[.92,.68],[.68,.92],[.32,.92],[.08,.68],[.08,.32])},
 {id:'diagonal',name:'Hành lang chéo',loops:poly([.08,.19],[.19,.08],[.92,.81],[.81,.92])},
 {id:'courtyard',name:'Sân trong vuông',loops:[[[.08,.08],[.92,.08],[.92,.92],[.08,.92]],[[.32,.32],[.68,.32],[.68,.68],[.32,.68]]]},
 {id:'capsule',name:'Hành lang bo tròn',loops:[Array.from({length:64},(_,i)=>{
  const angle=i*Math.PI/32;
  return [(.5+Math.sign(Math.cos(angle))*.24)+Math.cos(angle)*.19,.5+Math.sin(angle)*.21];
 })]},
 {id:'cross',name:'Ngã tư',loops:poly([.36,.06],[.64,.06],[.64,.36],[.94,.36],[.94,.64],[.64,.64],[.64,.94],[.36,.94],[.36,.64],[.06,.64],[.06,.36],[.36,.36])}
];
const extraShapes=[
 {id:'keyhole',name:'Điện lỗ khóa',group:'Phòng',loops:join(disk(.5,.37,.29),rect(.35,.38,.65,.93))},
 {id:'trilobe',name:'Điện ba cánh',group:'Phòng',loops:join(disk(.5,.31,.24),disk(.32,.63,.24),disk(.68,.63,.24))},
 {id:'clover',name:'Phòng cỏ bốn lá',group:'Phòng',loops:[radial(96,(_,a)=>.34+.085*Math.cos(4*a))]},
 {id:'petal',name:'Điện hoa sáu cánh',group:'Phòng',loops:[radial(120,(_,a)=>.33+.085*Math.cos(6*a))]},
 {id:'fan',name:'Khán đài cánh quạt',group:'Phòng',loops:[windingBand(-Math.PI*5/6,-Math.PI/6,()=>.25,.19)]},
 {id:'crescent',name:'Sân trăng khuyết',group:'Sân và thành',loops:combineOutline([disk(.46,.52,.39)],[disk(.65,.39,.32)],'cut')},
 {id:'double-ring',name:'Sân đôi liên hoàn',group:'Sân và thành',loops:[
  ...join(disk(.27,.5,.215),disk(.73,.5,.215),rect(.27,.43,.73,.57)),
  disk(.27,.5,.105),disk(.73,.5,.105)]},
 {id:'star-fort',name:'Thành sao sáu mũi',group:'Sân và thành',loops:[
  radial(12,i=>i%2?.29:.45),radial(6,()=>.17)]},
 {id:'bastion',name:'Thành bốn tháp',group:'Sân và thành',loops:[
  ...join(rect(.18,.18,.82,.82),...[[.19,.19],[.81,.19],[.81,.81],[.19,.81]].map(([x,y])=>disk(x,y,.135))),
  rect(.34,.34,.66,.66)]},
 {id:'lily-court',name:'Sân hoa có hồ',group:'Sân và thành',loops:[
  radial(120,(_,a)=>.36+.07*Math.cos(8*a)),disk(.5,.5,.17)]},
 {id:'twin-court',name:'Điện hai giếng trời',group:'Sân và thành',loops:[
  rect(.065,.19,.935,.81),rect(.17,.33,.42,.67),rect(.58,.33,.83,.67)]},
 {id:'serpentine',name:'Hành lang chữ S',group:'Lối đi',loops:[(()=>{
  const side=offset=>Array.from({length:65},(_,i)=>{
   const t=i/64;return [.05+.9*t,.5+.25*Math.sin(2*Math.PI*t)+offset];
  });
  return [...side(.09),...side(-.09).reverse()];
 })()]},
 {id:'spiral',name:'Đường xoắn ốc',group:'Lối đi',loops:[windingBand(-Math.PI/2,Math.PI*1.72,t=>.09+.29*t,.049)]},
 {id:'branch',name:'Ngã ba chữ Y',group:'Lối đi',loops:join(
  ...[[.18,.18],[.82,.18],[.5,.91]].map(p=>corridorLoop([.5,.49],p,.078)))},
 {id:'zigzag',name:'Lối gấp khúc',group:'Lối đi',loops:join(
  corridorLoop([.09,.75],[.32,.75],.072),corridorLoop([.32,.75],[.65,.25],.072),
  corridorLoop([.65,.25],[.91,.25],.072))},
 {id:'bridge',name:'Cầu hai đầu tháp',group:'Lối đi',loops:join(
  rect(.18,.44,.82,.56),radial(8,()=>.16).map(([x,y])=>[x-.28,y]),
  radial(8,()=>.16).map(([x,y])=>[x+.28,y]))},
 {id:'butterfly',name:'Điện cánh bướm',group:'Phòng',loops:join(
  ellipseLoop(.30,.36,.24,.22),ellipseLoop(.70,.36,.24,.22),
  ellipseLoop(.34,.67,.18,.20),ellipseLoop(.66,.67,.18,.20),rect(.42,.25,.58,.77))},
 {id:'fan-fort',name:'Thành móng ngựa',group:'Sân và thành',loops:[
  windingBand(Math.PI*.18,Math.PI*1.82,()=>.33,.105)]}
];
for(const shape of outlineShapes){
 shape.group=['diagonal','capsule','cross'].includes(shape.id)?'Lối đi':
  ['ring','u','courtyard'].includes(shape.id)?'Sân và thành':'Phòng';
}
outlineShapes.push(...extraShapes.map(shape=>({...shape,square:true})));

export function fitShape(shape,w,h,factor=1){
 const a=(shape.square?Math.min(w,h):w)*factor,b=(shape.square?Math.min(w,h):h)*factor;
 return shape.loops.map(loop=>loop.map(([x,y])=>[(w-a)/2+x*a,(h-b)/2+y*b]));
}
function asPolygon(loop){
 return [[...loop,loop[0]]];
}
function asRegion(loops){
 let region=[];
 for(const loop of loops)region=clipping.xor(region,asPolygon(loop));
 return region;
}
export function combineOutline(existing,addition,operation){
 const a=asRegion(existing),b=asRegion(addition);
 const result=operation==='cut'?clipping.difference(a,b):clipping.union(a,b);
 return result.flatMap(poly=>poly.map(ring=>ring.slice(0,-1)));
}

export function rectangleLoop(a,b){
 return [[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];
}
export function cropOutline(loops,a,b){
 if(Math.abs(a[0]-b[0])<.01||Math.abs(a[1]-b[1])<.01)return [];
 const region=asRegion(loops);
 if(!region.length)return [];
 return clipping.intersection(region,asPolygon(rectangleLoop(a,b)))
  .flatMap(poly=>poly.map(ring=>ring.slice(0,-1)));
}
export function moveOutline(loops,dx,dy,w,h){
 const points=loops.flat();
 if(!points.length)return [];
 const x=points.map(p=>p[0]),y=points.map(p=>p[1]);
 dx=Math.max(-Math.min(...x),Math.min(w-Math.max(...x),dx));
 dy=Math.max(-Math.min(...y),Math.min(h-Math.max(...y),dy));
 return loops.map(loop=>loop.map(p=>[p[0]+dx,p[1]+dy]));
}
export function corridorLoop(a,b,r){
 const d=Math.atan2(b[1]-a[1],b[0]-a[0]);
 if(Math.hypot(b[0]-a[0],b[1]-a[1])<.2)return [];
 return [b,a].flatMap(([x,y],side)=>Array.from({length:13},(_,i)=>{
  const angle=d-Math.PI/2+side*Math.PI+i*Math.PI/12;
  return [x+Math.cos(angle)*r,y+Math.sin(angle)*r];
 }));
}
export function relatedLoops(loops,index){
 const parent=loops[index];
 if(!parent)return [];
 function inside([x,y]){
  let yes=false;
  for(let i=0;i<parent.length;i++){
   const a=parent[i],b=parent[(i+1)%parent.length];
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  }
  return yes;
 }
 return loops.map((loop,i)=>i===index||loop.every(inside)?i:-1).filter(i=>i>=0);
}
