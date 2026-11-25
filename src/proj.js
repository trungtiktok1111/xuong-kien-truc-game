/* Phép chiếu thứ hai "Angle" (xiên mặt trước): ô sàn hiện gần chữ nhật 256 × 181 (tỉ lệ sin45°) thay vì hình thoi.
   Bộ ảnh Angle nằm file riêng `<vat|nen>/<id>.angle.json`, cùng chỉ số mảnh với bản Isometric nên cảnh đổi chiếu được ngay. */
export const ANG_R=181/256;
const AC={};
export async function angleOf(sheetName){
  const m=/^(Vat|Nen)-(.+)$/.exec(sheetName||'');if(!m)return null;const kind=m[1]==='Vat'?'vat':'nen',id=m[2],k=kind+'/'+id;
  if(k in AC)return AC[k];
  try{const r=await fetch(k+'.angle.json?v=1');if(!r.ok){AC[k]=null;return null;}const j=await r.json();
    const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=j.atlas;});
    delete j.atlas;j.img=img;AC[k]=j;return j;}catch(e){AC[k]=null;return null;}}
/* nạp bộ Angle cho mọi sheet (không đưa vào dữ liệu lưu: thuộc tính không liệt kê) */
export async function ensureAngle(sheets){let miss=[];
  for(let i=0;i<sheets.length;i++){const s=sheets[i];if(!s||s.A!==undefined)continue;const a=await angleOf(s.name);Object.defineProperty(s,'A',{value:a,writable:true,enumerable:false,configurable:true});if(!a&&/^(Vat|Nen)-/.test(s.name))miss.push(s.name);}
  return miss;}
/* vật thể: thông số vẽ trong Angle (ảnh, cỡ ô, tỉ lệ, độ lệch đứng) quy đổi từ thông số isometric của thực thể */
export function sprOf(e,sh,ang){
  if(!sh)return null;
  if(!ang)return {img:sh.img,tw:sh.tw,cols:sh.cols,margin:sh.margin||0,sc:e.sc,oy:e.oy||0};
  const A=sh.A;if(!A)return sh.img&&!sh.iso?{img:sh.img,tw:sh.tw,cols:sh.cols,margin:sh.margin||0,sc:e.sc,oy:e.oy||0}:null;
  return {img:A.img,tw:A.tw,cols:A.cols,margin:0,sc:A.sc*(e.sizeBase?e.sc/e.sizeBase:1),oy:((e.oy||0)*sh.tw+A.dA-A.dI)/A.tw};}
/* ô sàn Angle: (X,Y) = góc trái-trên của mặt trên ô; cw = bề rộng ô trên màn hình */
export function tileAng(cx,A,idx,X,Y,cw){if(!A||!A.img)return;const k=cw/A.tw,sx=(idx%A.cols)*A.tw,sy=Math.floor(idx/A.cols)*A.th;
  cx.drawImage(A.img,sx,sy,A.tw,A.th,X,Y-A.cy*k,A.tw*k,A.th*k);}
/* độ sâu vẽ của vật thể trong Angle: mép trước của khung chân (xa camera = nhỏ) */
export const depthAng=d=>{const z=d.zb;return d.y+1+(z&&(z[2]||z[3])?z[1]+z[3]:0);};

// A placed prop uses the same frame, scale and ground anchor in the preview and the game.
export function placedPropFrame(e,project,unit,projection){
  const [x,y]=project(e.x+1,e.y+1),size=e.sc*unit;
  const frame={anchor:[x,y],worldSize:e.sc,x:x-size/2+(e.ox||0)*size,y:y-size+(e.oy||0)*size-(projection==='top'?0:(e.roofBase||0)*unit*.75),size};
  if(e.roofDirection&&projection!=='top'){
    const side=e.sc/.95;
    const rise=e.roofRise==null?.48*size:e.roofRise*unit*.75;
    const eaves=e.roofBase==null?.75*size:e.roofBase*unit*.75;
    const corners=[[-.5,-.5],[.5,-.5],[-.5,.5]].map(([u,v])=>{
      const [px,py]=project(e.x+1+side*u,e.y+1+side*v);
      const height={E:.5+u,W:.5-u,N:.5-v,S:.5+v}[e.roofDirection]??0;
      return [px,py-eaves-rise*height];
    });
    frame.roof=corners;
    return frame;
  }
  if(!e.gateAssembly||!e.propProjection||(e.propProjection===projection&&!e.gateArt))return frame;
  const [a,b]=e.col||[];
  if(!a||!b)return frame;
  const [dx,dy]=e.gateArt||[b.x-a.x,b.y-a.y];
  const [ux,uy]=e.propProjection==='iso'?[.75*(dx-dy),.375*(dx+dy)]:
    e.propProjection==='angle'?[1.5*dx,1.5*ANG_R*dy]:[dx,dy];
  const [ax,ay]=project(e.x+1+a.x,e.y+1+a.y),[bx,by]=project(e.x+1+b.x,e.y+1+b.y);
  const scale=(bx-ax)/(ux*unit);
  if(!Number.isFinite(scale)||Math.abs(ux)<.001||Math.abs(scale)<.22){
    frame.edge={feet:[[ax,ay],[bx,by]].sort((a,b)=>a[1]-b[1]),height:size*.62,halfWidth:size*.035};
    return frame;
  }
  const shear=((by-ay)/unit-uy)/ux;
  // Match both feet across views while keeping vertical sprite edges upright.
  frame.matrix=[scale,shear,0,1,x*(1-scale),-x*shear];
  return frame;
}

export function placedPropBounds(frame,bounds){
  if(frame.roof){
    const [a,b,c]=frame.roof,points=[a,b,c,[b[0]+c[0]-a[0],b[1]+c[1]-a[1]]];
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }
  if(frame.edge){
    const {feet,height,halfWidth}=frame.edge,[a,b]=feet;
    return [Math.min(a[0],b[0])-halfWidth,a[1]-height,Math.max(a[0],b[0])+halfWidth,b[1]];
  }
  const {x,y,size,matrix}=frame,[l,t,r,b]=bounds;
  const corners=[[l,t],[l,b],[r,t],[r,b]].map(([u,v])=>{
    const px=x+u*size,py=y+v*size;
    return matrix?[matrix[0]*px+matrix[4],matrix[1]*px+py+matrix[5]]:[px,py];
  });
  const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
  return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
}

export function drawPlacedProp(ctx,e,sheet,frame){
  if(frame.edge){
    const {feet,height,halfWidth}=frame.edge,[a,b]=feet;
    ctx.save();
    ctx.strokeStyle='#6d6c63';ctx.lineWidth=halfWidth*1.8;
    ctx.beginPath();ctx.moveTo(a[0],a[1]-height);ctx.lineTo(b[0],b[1]-height);ctx.stroke();
    for(const [x,y] of feet){
      ctx.fillStyle='#484e4d';ctx.fillRect(x-halfWidth,y-height,halfWidth*2,height);
      ctx.fillStyle='#77766a';ctx.fillRect(x-halfWidth,y-height,halfWidth*.65,height);
    }
    ctx.restore();
    return;
  }
  if(!sheet?.img)return;
  const {x,y,size}=frame,tw=sheet.tw,step=tw+(sheet.margin||0);
  const sx=e.tile.idx%sheet.cols*step,sy=Math.floor(e.tile.idx/sheet.cols)*step;
  ctx.save();
  if(frame.roof){
    const [a,b,c]=frame.roof,[l,t,r,d]=e.spriteBounds||[0,0,1,1];
    ctx.transform(b[0]-a[0],b[1]-a[1],c[0]-a[0],c[1]-a[1],a[0],a[1]);
    ctx.drawImage(sheet.img,sx+l*tw,sy+t*tw,(r-l)*tw,(d-t)*tw,0,0,1,1);
    ctx.restore();
    return;
  }
  if(frame.matrix)ctx.transform(...frame.matrix);
  ctx.translate(x+size/2,y+size/2);
  if(e.spriteFlip&4){ctx.rotate(Math.PI/2);ctx.scale(1,-1);}
  if(e.spriteFlip&1)ctx.scale(-1,1);
  if(e.spriteFlip&2)ctx.scale(1,-1);
  ctx.drawImage(sheet.img,sx,sy,tw,tw,-size/2,-size/2,size,size);
  ctx.restore();
}

// Nine named points follow the actual rendered quadrilateral, including a sloped roof.
export const placementAnchorNames=[
  'Góc trên trái','Giữa mép trên','Góc trên phải',
  'Giữa mép trái','Tâm','Giữa mép phải',
  'Góc dưới trái','Giữa mép dưới','Góc dưới phải'
];

export function placementAnchors(frame,bounds=[0,0,1,1],mode='auto'){
  if(frame.edge||mode==='gate'){
    const p=frame.anchor;
    return [{id:4,point:p}];
  }
  const {x,y,size,matrix}=frame,[l,t,r,b]=bounds;
  const spritePoint=(u,v)=>{
    const px=x+(l+(r-l)*u)*size,py=y+(t+(b-t)*v)*size;
    return matrix?[matrix[0]*px+matrix[4],matrix[1]*px+py+matrix[5]]:[px,py];
  };
  const point=frame.roof?((u,v)=>{
    const [a,h,k]=frame.roof;
    return a.map((n,i)=>n+(h[i]-n)*u+(k[i]-n)*v);
  }):spritePoint;
  let ids=[4];
  if(frame.roof||mode==='roof')ids=[0,1,2,3,4,5,6,7,8];
  else if(size>0){
    const width=r-l,height=b-t,scale=frame.worldSize??1;
    const columns=width*scale>=.85?[0,1,2]:[1],rows=height*scale>=.85?[0,1,2]:[1];
    ids=rows.flatMap(row=>columns.map(col=>3*row+col));
  }
  return ids.map(id=>({id,point:point((id%3)/2,Math.floor(id/3)/2)}));
}

export function placementAnchorOffset(frame,bounds,mode,id){
  const points=placementAnchors(frame,bounds,mode);
  const anchor=points.find(p=>p.id===id)||points.find(p=>p.id===4);
  return anchor.point.map((n,i)=>n-frame.anchor[i]);
}
