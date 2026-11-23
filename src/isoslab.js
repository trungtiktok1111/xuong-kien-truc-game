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
