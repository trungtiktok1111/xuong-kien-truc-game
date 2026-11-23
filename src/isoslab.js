/* Ô nền isometric: vẽ có lật gương (f&1 lật theo trục x, f&2 theo trục y của lưới) và cắt viền (f&4)
   => các ô nước lật gương xen kẽ sẽ khớp mép, ra một mặt nước liền thay vì từng ô riêng. */
export function slab(cx,img,sx,sy,tw,px,py,S,f){
  f&=7;
  if(!f){cx.drawImage(img,sx,sy,tw,tw,px-S,py,2*S+.6,2*S+.6);return;}
  const k=(f&4)?.84:1,su=(f&1)?-1:1,sv=(f&2)?-1:1;
  const ax=tw/2,ay=tw/4,bx=-tw/2,by=tw/4,ox=tw/2,oy=0,det=ax*by-ay*bx;
  const A=[S,S/2],B=[-S,S/2];
  const cu=su/k,cv=sv/k;
  const a=cu*A[0]*by/det+cv*B[0]*(-ay)/det,b=cu*A[1]*by/det+cv*B[1]*(-ay)/det;
  const c=cu*A[0]*(-bx)/det+cv*B[0]*ax/det,d=cu*A[1]*(-bx)/det+cv*B[1]*ax/det;
  const p0x=px+A[0]*(.5-su*.5/k)+B[0]*(.5-sv*.5/k),p0y=py+A[1]*(.5-su*.5/k)+B[1]*(.5-sv*.5/k);
  cx.save();cx.beginPath();const E=.5;cx.moveTo(px,py-E);cx.lineTo(px+S+E,py+S/2);cx.lineTo(px,py+S+E);cx.lineTo(px-S-E,py+S/2);cx.closePath();cx.clip();
  cx.transform(a,b,c,d,p0x-a*ox-c*oy,p0y-b*ox-d*oy);cx.drawImage(img,sx,sy,tw,tw,0,0,tw,tw);cx.restore();}
/* bờ ao/sông: viền đất ướt + bọt sáng dọc mép nước giáp đất. cells: [{x,y}] các ô nước; pos(x,y)->[px,py] đỉnh ô */
export function shore(cx,cells,pos,S){
  const set=new Set(cells.map(q=>q.x+','+q.y));
  const seg=[];
  for(const q of cells){const [px,py]=pos(q.x,q.y);
    const T=[px,py],R=[px+S,py+S/2],Bm=[px,py+S],L=[px-S,py+S/2];
    if(!set.has(q.x+','+(q.y-1)))seg.push([T,R]);
    if(!set.has((q.x+1)+','+q.y))seg.push([R,Bm]);
    if(!set.has(q.x+','+(q.y+1)))seg.push([L,Bm]);
    if(!set.has((q.x-1)+','+q.y))seg.push([T,L]);}
  if(!seg.length)return;
  cx.save();cx.lineCap='round';
  const pass=(w,col)=>{cx.lineWidth=w;cx.strokeStyle=col;cx.beginPath();for(const [a,b] of seg){cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}cx.stroke();};
  pass(S*.26,'rgba(58,46,24,.32)');pass(S*.14,'rgba(70,56,30,.45)');pass(S*.05,'rgba(205,235,228,.55)');
  cx.restore();}

/* ô 192x96 (atlas ô vuông tw, đỉnh ô ở y=cy0): vẽ nguyên ô, không lật */
export const mirF=(x,y)=>(x&1)|((y&1)<<1);
/* f: bit1 = lật theo trục u, bit2 = lật theo trục v (lật gương xen kẽ => mép các ô nước khớp nhau, ra mặt nước liền) */
export function tile192(cx,img,sx,sy,tw,cy0,px,py,S,f){const k=2*S/tw;
  if(!f){cx.drawImage(img,sx,sy,tw,tw,px-S,py-cy0*k,2*S+.6,tw*k+.6);return;}
  const su=f&1,sv=f&2;const P=(u,v)=>[(u-v)*S,(u+v)*S/2];
  const F=(u,v)=>P(su?1-u:u,sv?1-v:v);
  const T=[tw/2,cy0],e1=[tw/2,tw/4],e2=[-tw/2,tw/4],D0=F(0,0),D1=F(1,0),D2=F(0,1);
  const d1=[D1[0]-D0[0],D1[1]-D0[1]],d2=[D2[0]-D0[0],D2[1]-D0[1]],det=e1[0]*e2[1]-e1[1]*e2[0];
  const a=(d1[0]*e2[1]-d2[0]*e1[1])/det,c=(-d1[0]*e2[0]+d2[0]*e1[0])/det,b=(d1[1]*e2[1]-d2[1]*e1[1])/det,d=(-d1[1]*e2[0]+d2[1]*e1[0])/det;
  cx.save();{const k2=(2*S+1.2)/(2*S);cx.translate(px,py+S/2);cx.scale(k2,k2);cx.translate(-px,-(py+S/2));}cx.transform(a,b,c,d,px+D0[0]-(a*T[0]+c*T[1]),py+D0[1]-(b*T[0]+d*T[1]));
  cx.drawImage(img,sx,sy,tw,tw,0,0,tw,tw);cx.restore();}

/* Xoá viền tối quanh mép ô nền iso: thay dải mép ~tw/38 px bằng ảnh phản chiếu từ bên trong → ô nền liền mạch, không còn "kẻ ô" */
export function derim(img,tw,cy0){try{const W=img.width,H=img.height,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);
  const src=g.getImageData(0,0,W,H),out=g.getImageData(0,0,W,H),S=src.data,O=out.data,B=tw/38,k=tw*0.2236,hw=tw/2,hh=tw/4,cols=Math.floor(W/tw),rows=Math.floor(H/tw);
  for(let r=0;r<rows;r++)for(let q=0;q<cols;q++){const ox=q*tw,oy=r*tw;let outside=0,inside=0;
    for(let y=0;y<tw;y+=2)for(let x=0;x<tw;x+=2){const dx=x+.5-hw,dy=y-cy0+.5-hh,s=1-(Math.abs(dx)/hw+Math.abs(dy)/hh);if(S[((oy+y)*W+ox+x)*4+3]>128){if(s<-.04)outside++;else inside++;}}
    if(!inside||outside>6)continue;
    for(let y=Math.max(0,cy0-1);y<Math.min(tw,cy0+tw/2+1);y++)for(let x=0;x<tw;x++){const dx=x+.5-hw,dy=y-cy0+.5-hh,s=1-(Math.abs(dx)/hw+Math.abs(dy)/hh);if(s<=0)continue;const d=s*k;if(d>=B)continue;
      const nx0=-Math.sign(dx)*2/tw,ny0=-Math.sign(dy)*4/tw,nl=Math.hypot(nx0,ny0),m=2*(B-d),sx=Math.round(x+nx0/nl*m),sy=Math.round(y+ny0/nl*m);
      if(sx<0||sx>=tw||sy<0||sy>=tw)continue;const i=((oy+y)*W+ox+x)*4,j=((oy+sy)*W+ox+sx)*4;if(S[i+3]===0||S[j+3]<200)continue;O[i]=S[j];O[i+1]=S[j+1];O[i+2]=S[j+2];}}
  g.putImageData(out,0,0);return c;}catch(e){return img;}}
