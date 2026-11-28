import {canArrangeProp,propFootprint} from './outlinePropPlacement.js';
import {zBounds} from './zones.js';

export function drawAssemblyGuides(ctx,{width,height,project,pointer,parts,entities,wallEdges}){
  function guide(x,y,dx,dy){
   const reach=2*Math.hypot(width,height),length=Math.hypot(dx,dy)||1;
   dx=dx*reach/length;dy=dy*reach/length;
   ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);ctx.stroke();
  }
  ctx.save();ctx.strokeStyle='#ffda43cc';ctx.setLineDash([5,5]);
  for(const [dx,dy] of [[1,0],[0,1],[2,1],[2,-1]])guide(...pointer,dx,dy);
  if(parts?.length){
   const bounds=parts.flatMap(propFootprint).map(zBounds);
   const [x0,y0,x1,y1]=[Math.min(...bounds.map(b=>b[0])),Math.min(...bounds.map(b=>b[1])),
    Math.max(...bounds.map(b=>b[2])),Math.max(...bounds.map(b=>b[3]))];
   const movingIds=new Set(parts.map(part=>part.id));
   const targets=entities.filter(other=>canArrangeProp(other)&&!movingIds.has(other.id))
    .flatMap(propFootprint).map(zBounds);
   // Keep the matching tolerance in map units so the result is independent of zoom.
   const tolerance=.025;
   function drawSide(axis,value,start,direction){
    const along=1-axis;
    let color='#f02b35',nearest=Infinity;
    function consider(low,high,matchedColor){
     const distance=direction>0?low-start:start-high;
     const extent=direction>0?high-start:start-low;
     if(extent<=1e-6||distance < -tolerance||distance>=nearest)return;
     nearest=distance;color=matchedColor;
    }
    for(const bounds of targets){
     if([bounds[axis],bounds[axis+2]].some(edge=>Math.abs(edge-value)<=tolerance))
      consider(bounds[along],bounds[along+2],'#00b83e');
    }
    for(const [a,b] of wallEdges){
     if(Math.abs(a[axis]-b[axis])<1e-6&&Math.abs(a[axis]-value)<=tolerance)
      consider(Math.min(a[along],b[along]),Math.max(a[along],b[along]),'#087ee8');
    }
    const [x,y]=axis===0?project(value,start):project(start,value);
    const end=axis===0?project(value,start+direction):project(start+direction,value);
    const reach=2*Math.hypot(width,height)/(Math.hypot(end[0]-x,end[1]-y)||1);
    const dx=(end[0]-x)*reach,dy=(end[1]-y)*reach;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);
    ctx.lineWidth=2;ctx.strokeStyle=color;ctx.stroke();
   }
   for(const x of [x0,x1]){
    drawSide(0,x,y0,-1);
    drawSide(0,x,y1,1);
   }
   for(const y of [y0,y1]){
    drawSide(1,y,x0,-1);
    drawSide(1,y,x1,1);
   }
  }
  ctx.restore();
}
