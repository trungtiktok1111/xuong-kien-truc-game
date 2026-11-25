// A gate is stored as one object. Its two wings are derived from the calibrated posts.
export function gateLayout(e){
  if(!e.gateAssembly)return null;
  const [a,b]=e.col||[];
  if(a?.k!=='circle'||b?.k!=='circle')return null;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(!Number.isFinite(d)||d<.001)return null;
  const ux=dx/d,uy=dy/d,x=e.x+1,y=e.y+1;
  const posts=[a,b].map(p=>[x+p.x,y+p.y]);
  const length=Math.max(.8,e.sc*.38),thickness=Math.min(.48,Math.max(.18,e.sc*.085));
  const wings=posts.map(([px,py],i)=>{
    const direction=i===0?-1:1;
    return [[px,py],[px+direction*length*ux,py+direction*length*uy]];
  });
  return {posts,wings,thickness,normal:[-uy,ux],center:[x+(a.x+b.x)/2,y+(a.y+b.y)/2],
    opening:d-a.r-b.r,height:Math.max(.4,e.sc*.43)};
}

export function gateWalls(e,angle,layout=gateLayout(e)){
  if(!layout||e.wallId||e.wallGateBrush)return [];
  return layout.wings.flatMap(([a,b],side)=>{
    const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
    const p=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    return Array.from({length:n},(_,i)=>{
      const [x,y]=p((i+.5)/n);
      return {a:p(i/n),b:p((i+1)/n),k:angle?y:x+y,near:true,i:side*10+i,height:layout.height,gate:e};
    });
  });
}

export function gateZones(e,layout=gateLayout(e)){
  if(e.wallId||e.wallGateBrush)return [];
  return layout?.wings.map((pts,i)=>({id:'gate-'+e.id+'-wing-'+i,k:'line',pts,
    th:layout.thickness,closed:false,deco:e.id}))||[];
}
