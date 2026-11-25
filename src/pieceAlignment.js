export const JOIN_EPSILON=.005;

export function measureJoin(a,b,epsilon=JOIN_EPSILON){
  const overlap=[0,1].map(i=>Math.min(a[i+2],b[i+2])-Math.max(a[i],b[i]));
  const [x,y]=overlap;
  const kind=x>epsilon&&y>epsilon?'overlap':Math.abs(x)<=epsilon&&Math.abs(y)<=epsilon?'corner':
    (Math.abs(x)<=epsilon&&y>epsilon)||(Math.abs(y)<=epsilon&&x>epsilon)?'edge':'gap';
  const distance=Math.hypot(Math.max(0,-x),Math.max(0,-y));
  return {kind,overlap,distance};
}

// Find the closest corresponding edge or centre on each world axis.
export function alignmentGuides(a,b,tolerance){
  return [0,1].map(i=>{
    const src=[a[i],a[i+2],(a[i]+a[i+2])/2],ref=[b[i],b[i+2],(b[i]+b[i+2])/2];
    let best=null;
    for(let j=0;j<src.length;j++)for(let k=0;k<ref.length;k++){
      if((j===2)!==(k===2))continue;
      const delta=ref[k]-src[j];
      if(Math.abs(delta)<=tolerance&&(!best||Math.abs(delta)<Math.abs(best.delta)))
        best={axis:i,value:ref[k],delta,center:k===2};
    }
    return best;
  }).filter(Boolean);
}

export function roofHeightAt(roof,x,y){
  const [x0,y0,x1,y1]=roof.bounds;
  const u=roof.direction==='W'?(x1-x)/(x1-x0):roof.direction==='N'?(y1-y)/(y1-y0):
    roof.direction==='S'?(y-y0)/(y1-y0):(x-x0)/(x1-x0);
  return roof.base+roof.rise*u;
}

export function seamHeightDifference(a,b){
  const bounds=a.bounds.map((v,i)=>i<2?Math.max(v,b.bounds[i]):Math.min(v,b.bounds[i]));
  const [l,t,r,d]=bounds;
  return Math.max(...[[l,t],[r,t],[r,d],[l,d]].map(([x,y])=>
    Math.abs(roofHeightAt(a,x,y)-roofHeightAt(b,x,y))));
}
