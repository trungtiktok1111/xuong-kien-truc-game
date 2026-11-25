// The span is above the water. Each end has a one-cell ramp on its own bank.
export function crossing(cells){
  if(!cells.length)return null;
  const y=cells[0][1],xs=cells.map(([x])=>x).sort((a,b)=>a-b);
  if(cells.some(([,v])=>v!==y)||xs.some((x,i)=>x!==xs[0]+i))
    throw Error('Cầu cần một nhịp thẳng nối hai bờ.');
  return {left:xs[0],right:xs.at(-1)+1,y,rise:.42};
}

export function bridgeHeight(bridge,x,y){
  if(!bridge||y<bridge.y||y>bridge.y+1)return 0;
  return bridge.rise*Math.max(0,Math.min(1,x-bridge.left+1,bridge.right+1-x));
}

export function bridgeRails(bridge){
  if(!bridge)return [];
  const {left,right,y}=bridge;
  return [y+.035,y+.965].map(edge=>({k:'line',pts:[[left,edge],[right,edge]],th:.05}));
}

function bridgeFaces(b){
  return [[b.left-1,b.left],[b.left,b.right],[b.right,b.right+1]].map(([a,z])=>[
    [a,b.y,bridgeHeight(b,a,b.y)],[z,b.y,bridgeHeight(b,z,b.y)],
    [z,b.y+1,bridgeHeight(b,z,b.y+1)],[a,b.y+1,bridgeHeight(b,a,b.y+1)]
  ]);
}

// Invert the projected deck before picking the flat ground below it.
export function pickBridge(b,project,unit,x,y){
  if(!b)return null;
  const p=([u,v,z])=>{const [px,py]=project(u,v);return [px,py-z*unit];};
  for(const [a,d,,c] of bridgeFaces(b)){
    const [ax,ay]=p(a),[bx,by]=p(d),[cx,cy]=p(c);
    const ux=bx-ax,uy=by-ay,vx=cx-ax,vy=cy-ay,det=ux*vy-uy*vx;
    if(Math.abs(det)<.001)continue;
    const s=((x-ax)*vy-(y-ay)*vx)/det,t=(ux*(y-ay)-uy*(x-ax))/det;
    if(s>=0&&s<=1&&t>=0&&t<=1)return {x:a[0]+s*(d[0]-a[0]),y:b.y+t};
  }
  return null;
}

export function drawSettlementBridge(ctx,b,project,unit,front=false){
  if(!b)return;
  const {left,right,y,rise}=b;
  const pos=([x,y,z])=>{const [u,v]=project(x,y);return [u,v-z*unit];};
  const poly=(pts,color)=>{
    ctx.beginPath();
    for(const pt of pts)ctx.lineTo(...pos(pt));
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  };
  const line=(a,d,color,width)=>{
    ctx.beginPath();ctx.moveTo(...pos(a));ctx.lineTo(...pos(d));
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,unit*width);ctx.stroke();
  };
  const rails=edge=>{
    for(let x=left;x<=right;x++)line([x,edge,rise],[x,edge,rise+.30],'#654529',.073);
    line([left,edge,rise+.27],[right,edge,rise+.27],'#ab7b45',.083);
  };
  ctx.save();
  if(front){
    rails(y+.965);ctx.restore();return;
  }
  for(const x of [left+.03,right-.22]){
    poly([[x,y+.12,0],[x+.19,y+.12,0],[x+.19,y+.12,rise],[x,y+.12,rise]],'#857660');
    poly([[x+.19,y+.12,0],[x+.19,y+.88,0],[x+.19,y+.88,rise],[x+.19,y+.12,rise]],'#5f5a50');
  }
  for(const [i,face] of bridgeFaces(b).entries()){
    const [,,c,d]=face;
    poly([d,c,[c[0],c[1],c[2]-.11],[d[0],d[1],d[2]-.11]],'#654529');
    poly(face,i===1?'#bd9059':'#a87f51');
  }
  for(let x=left+.125;x<right;x+=.125)line([x,y,rise],[x,y+1,rise],'#89623e',.014);
  rails(y+.035);
  ctx.restore();
}
