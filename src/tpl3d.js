// Mẫu công trình 3D dựng sẵn. h = {setV,delV,fillBox,hollow,roofRing}
// Chất liệu: 0 Gỗ 1 Sơn đỏ 2 Đá 3 Gạch xanh 4 Ngói xám 5 Ngói đỏ 6 Gỗ tối 7 Tường trắng 8 Giấy 9 Cỏ 10 Đất 11 Cát 12 Nước 13 Kính 14 Vàng 15 Đen
export function makeTpl(h){
  const {setV,delV,fillBox:B,hollow,roofRing}=h;
  const cube=(x,y,z,m,r=0)=>setV(x,y,z,'cube',m,r,true);
  const sh=(x,y,z,s,m,r=0)=>setV(x,y,z,s,m,r,true);
  const col=(x,z,y0,y1,m=1)=>B(x,y0,z,x,y1,z,'pillar',m);
  const base=(x0,z0,x1,z1,m=2)=>B(x0,0,z0,x1,0,z1,'cube',m);
  const slab=(x0,y,z0,x1,z1,m)=>B(x0,y,z0,x1,y,z1,'slab',m);
  const hip=(x0,z0,x1,z1,y,m)=>{for(;x0<x1&&z0<z1;x0++,z0++,x1--,z1--,y++)roofRing(x0,z0,x1,z1,y,m);if(x0<=x1&&z0<=z1)B(x0,y,z0,x1,y,z1,'cube',m);};
  // mái hai dốc, sống mái chạy dọc trục x
  const gableX=(x0,z0,x1,z1,y,m)=>{for(let k=0;z0+k<=z1-k;k++){const a=z0+k,b=z1-k;for(let x=x0;x<=x1;x++){if(a===b)cube(x,y+k,a,m);else{sh(x,y+k,b,'wedge',m,0);sh(x,y+k,a,'wedge',m,2);for(let z=a+1;z<b;z++)cube(x,y+k,z,m);}}}};
  // mái hai dốc, sống mái chạy dọc trục z
  const gableZ=(x0,z0,x1,z1,y,m)=>{for(let k=0;x0+k<=x1-k;k++){const a=x0+k,b=x1-k;for(let z=z0;z<=z1;z++){if(a===b)cube(a,y+k,z,m);else{sh(b,y+k,z,'wedge',m,1);sh(a,y+k,z,'wedge',m,3);for(let x=a+1;x<b;x++)cube(x,y+k,z,m);}}}};
  const hole=(x0,y0,z0,x1,y1,z1)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)delV(x,y,z,true);};
  const crenel=(x0,z0,x1,z1,y,m)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)if((x===x0||x===x1||z===z0||z===z1)&&(x+z)%2===0)cube(x,y,z,m);};
  const tower=(x0,z0,x1,z1,hgt,m=3,roof=4)=>{B(x0,1,z0,x1,hgt,z1,'cube',m);crenel(x0,z0,x1,z1,hgt+1,m);if(roof>=0)hip(x0-1,z0-1,x1+1,z1+1,hgt+1,roof);};
  const tree=(x,z,h0=4,r=2,m=9)=>{col(x,z,1,h0,6);for(let y=h0;y<=h0+r;y++){const q=Math.max(0,r-(y-h0)+(y===h0?0:-0));for(let dx=-q;dx<=q;dx++)for(let dz=-q;dz<=q;dz++)if(Math.abs(dx)+Math.abs(dz)<=q+1)cube(x+dx,y,z+dz,m);}};
  const lantern=(x,z,y=1)=>{col(x,z,y,y+2,6);cube(x,y+3,z,14);};
  const rail=(x0,z0,x1,z1,y,m=6)=>{for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)if(x===x0||x===x1||z===z0||z===z1)sh(x,y,z,'rail',m,0);};
  const stairsS=(x,z,n,y0=1)=>{for(let i=0;i<n;i++)B(x,y0+i,z-i,x,y0+i,z-i,'cube',2);};
  const win=(x,y,z,r=0)=>sh(x,y,z,'window',6,r);
  const T={};

  T['Nhà gỗ hai tầng']=()=>{base(6,6,18,14,2);hollow(7,1,7,17,4,13,0);B(7,5,7,17,5,13,'slab',6);hollow(7,6,7,17,8,13,7);
    for(const x of [7,12,17])for(const y of [1,2,3,4,6,7,8])col(x,7,y,y,1);hole(11,1,13,13,3,13);sh(12,1,13,'arch',1,0);
    for(let x=9;x<=15;x+=3){win(x,7,13);win(x,3,7);}gableX(6,6,18,14,9,5);B(6,5,5,18,5,5,'slab',6);};
  T['Tửu quán góc phố']=()=>{base(5,5,19,15,2);hollow(6,1,6,18,4,14,0);B(6,5,6,18,5,14,'slab',6);hollow(6,6,6,18,8,14,1);
    for(let x=6;x<=18;x+=4)col(x,14,1,4,1);for(let x=8;x<=16;x+=4){win(x,7,14);win(x,2,14);}hole(11,1,14,13,3,14);gableX(5,5,19,15,9,5);
    B(10,9,4,14,9,4,'slab',1);col(20,15,1,6,6);B(20,6,15,22,6,15,'slab',1);cube(22,5,15,1);};
  T['Cổng thành']=()=>{base(4,4,24,10,2);B(4,1,4,9,7,10,'cube',3);B(19,1,4,24,7,10,'cube',3);B(10,1,4,18,6,10,'cube',3);
    hole(11,1,4,17,4,10);for(let x=11;x<=17;x++){sh(x,5,4,'slab',2);sh(x,5,10,'slab',2);}sh(14,4,4,'arch',2,0);crenel(4,4,24,10,7,3);
    hip(3,3,10,11,8,4);hip(18,3,25,11,8,4);B(11,7,4,17,7,10,'slab',6);};
  T['Tường thành & tháp canh']=()=>{base(4,6,30,10,2);B(4,1,7,30,5,9,'cube',3);crenel(4,7,30,9,6,3);tower(3,5,7,11,9,2);tower(27,5,31,11,9,2);
    for(let x=12;x<=24;x+=4)B(x,6,8,x,6,8,'cube',3);stairsS(16,6,4);};
  T['Lâu đài nhỏ']=()=>{base(4,4,26,26,9);B(4,1,4,26,5,26,'cube',2);B(5,5,5,25,5,25,'cube',9);hole(5,1,5,25,4,25);hole(5,5,5,25,5,25);B(5,0,5,25,0,25,'cube',9);
    B(5,1,5,25,1,25,'cube',9);B(4,5,4,26,5,26,'cube',2);hole(6,5,6,24,5,24);crenel(4,4,26,26,6,2);
    for(const [x,z] of [[3,3],[24,3],[3,24],[24,24]])tower(x,z,x+3,z+3,10,3,5);
    B(11,1,11,19,8,19,'cube',3);hole(12,1,12,18,7,18);hip(10,10,20,20,9,5);hole(14,1,11,16,3,11);sh(15,3,11,'arch',3,0);
    B(14,1,3,16,4,4,'cube',2);hole(14,1,4,16,3,4);};
  T['Chùa 5 tầng']=()=>{B(4,0,4,24,0,24,'cube',2);B(6,1,6,22,1,22,'slab',2);let a=9,b=19,y=2;for(let f=0;f<5;f++){hollow(a,y,a,b,y+2,b,f%2?7:1);
      for(const [x,z] of [[a,a],[b,a],[a,b],[b,b]])B(x,y,z,x,y+2,z,'pillar',6);for(let x=a+2;x<b;x+=2)win(x,y+1,b);hole(Math.floor((a+b)/2),y,b,Math.floor((a+b)/2),y+1,b);
      roofRing(a-1,a-1,b+1,b+1,y+3,f%2?4:5);y+=4;a++;b--;}hip(a,a,b,b,y-1,4);col(Math.floor((a+b)/2),Math.floor((a+b)/2),y+1,y+4,14);};
  T['Miếu thờ nhỏ']=()=>{base(8,8,16,16,2);B(9,1,9,15,1,15,'slab',2);hollow(10,2,10,14,4,14,1);hole(12,2,14,12,3,14);sh(12,2,14,'arch',1,0);
    for(const [x,z] of [[10,10],[14,10],[10,14],[14,14]])B(x,2,z,x,4,z,'pillar',6);hip(9,9,15,15,5,5);col(12,12,2,3,14);
    lantern(8,17);lantern(16,17);stairsS(12,18,2);};
  T['Cổng làng (bài phường)']=()=>{base(6,6,22,9,2);for(const x of [8,14,20]){B(x,1,7,x,6,7,'pillar',1);B(x,1,8,x,6,8,'pillar',1);}
    B(8,5,7,20,5,8,'cube',1);B(9,6,7,19,6,8,'slab',6);B(7,7,6,21,7,9,'slab',6);hip(6,6,22,9,8,4);B(11,7,7,17,7,8,'cube',14);
    for(let x=8;x<=20;x+=6){cube(x,0,5,2);cube(x,0,10,2);}};
  T['Cầu đá vòm']=()=>{B(6,0,10,28,0,14,'cube',12);for(let x=8;x<=26;x++){const t=(x-17)/9;const hh=Math.round(3-3*t*t);B(x,1,11,x,1+Math.max(0,hh),13,'cube',2);}
    for(let x=8;x<=26;x++){const t=(x-17)/9;const hh=Math.round(3-3*t*t);sh(x,2+Math.max(0,hh),11,'rail',6,0);sh(x,2+Math.max(0,hh),13,'rail',6,0);}
    B(4,0,9,8,2,15,'cube',9);B(26,0,9,30,2,15,'cube',9);hole(13,1,11,21,2,13);B(13,3,11,21,3,13,'cube',2);for(let x=13;x<=21;x++)B(x,1,11,x,1,13,'cube',2);};
  T['Cầu gỗ treo']=()=>{B(4,0,8,30,0,16,'cube',12);B(2,0,8,6,2,16,'cube',10);B(28,0,8,32,2,16,'cube',10);for(let x=6;x<=28;x++){const t=(x-17)/11;const hh=Math.round(1-t*t*1.2);B(x,3+hh,11,x,3+hh,13,'slab',0);sh(x,4+hh,11,'rail',6,0);sh(x,4+hh,13,'rail',6,0);}
    for(const x of [6,28])for(const z of [10,14])B(x,1,z,x,6,z,'pillar',6);};
  T['Nhà sàn trên cọc']=()=>{B(4,0,4,24,0,22,'cube',12);for(let x=7;x<=17;x+=5)for(let z=7;z<=15;z+=4)B(x,1,z,x,3,z,'pillar',6);B(6,4,6,18,4,16,'slab',0);
    hollow(7,5,7,17,7,15,0);hole(11,5,15,13,6,15);for(let x=9;x<=15;x+=3)win(x,6,15);gableX(6,6,18,16,8,5);B(8,3,17,12,3,22,'slab',0);for(let z=17;z<=22;z++)cube(10,1,z,0);};
  T['Giếng nước cổ']=()=>{B(10,0,10,16,0,16,'cube',2);B(11,1,11,15,2,15,'cube',2);hole(12,1,12,14,2,14);B(12,1,12,14,1,14,'cube',12);B(12,0,12,14,0,14,'cube',12);
    col(11,11,3,6,6);col(15,11,3,6,6);col(11,15,3,6,6);col(15,15,3,6,6);hip(10,10,16,16,7,5);lantern(8,8);};
  T['Đài phun nước']=()=>{B(6,0,6,22,0,22,'cube',2);for(let x=8;x<=20;x++)for(let z=8;z<=20;z++){const d=Math.hypot(x-14,z-14);if(d<=6.2&&d>5)B(x,1,z,x,1,z,'cube',2);else if(d<=5)cube(x,1,z,12);}
    B(14,1,14,14,3,14,'pillar',2);B(13,3,13,15,3,15,'slab',2);cube(14,4,14,12);for(const [x,z] of [[7,7],[21,7],[7,21],[21,21]])lantern(x,z);};
  T['Lôi đài võ thuật']=()=>{B(4,0,4,26,0,26,'cube',2);B(7,1,7,23,2,23,'cube',0);B(8,3,8,22,3,22,'slab',6);for(const [x,z] of [[7,7],[23,7],[7,23],[23,23]])B(x,3,z,x,7,z,'pillar',1);
    for(let y=4;y<=5;y++){B(8,y,7,22,y,7,'slab',5);B(8,y,23,22,y,23,'slab',5);B(7,y,8,7,y,22,'slab',5);B(23,y,8,23,y,22,'slab',5);}
    for(let x=10;x<=20;x+=5)col(x,3,0,0,6);stairsS(15,6,2);};
  T['Sân tập võ']=()=>{B(3,0,3,27,0,23,'cube',11);B(3,0,3,27,0,3,'cube',2);B(3,0,23,27,0,23,'cube',2);B(3,0,3,3,0,23,'cube',2);B(27,0,3,27,0,23,'cube',2);
    for(let x=8;x<=22;x+=3){col(x,10,1,3,0);cube(x,4,10,1);}B(10,1,18,10,3,18,'pillar',6);B(20,1,18,20,3,18,'pillar',6);B(10,3,18,20,3,18,'slab',6);
    for(const x of [3,27])for(let z=3;z<=23;z+=5)col(x,z,1,4,1);B(23,1,4,26,1,6,'cube',0);hip(22,3,27,7,2,5);};
  T['Đình làng (nhà dài)']=()=>{B(4,0,4,24,0,16,'cube',2);B(5,1,5,23,1,15,'slab',3);for(let x=6;x<=22;x+=4)for(const z of [6,14])B(x,1,z,x,5,z,'pillar',1);
    for(let x=6;x<=22;x++){cube(x,6,6,6);cube(x,6,14,6);}B(6,6,7,6,6,13,'cube',6);B(22,6,7,22,6,13,'cube',6);hip(4,4,24,16,7,5);col(14,10,2,3,14);};
  T['Tứ hợp viện']=()=>{B(3,0,3,27,0,27,'cube',2);B(4,1,4,26,1,26,'cube',11);
    const wing=(x0,z0,x1,z1,rx)=>{hollow(x0,2,z0,x1,5,z1,7);B(x0-1,6,z0-1,x1+1,6,z1+1,'slab',6);if(rx)gableX(x0-1,z0-1,x1+1,z1+1,7,4);else gableZ(x0-1,z0-1,x1+1,z1+1,7,4);};
    wing(5,5,25,9,1);wing(5,21,25,25,1);wing(5,10,9,20,0);wing(21,10,25,20,0);hole(14,2,25,16,4,25);sh(15,2,25,'arch',1,0);
    tree(15,15);for(const [x,z] of [[12,12],[18,12],[12,18],[18,18]])cube(x,2,z,2);};
  T['Đại sảnh võ lâm']=()=>{B(2,0,2,30,0,22,'cube',2);for(let i=0;i<3;i++)B(11+i,1+i,22-i,19-i,1+i,22-i,'slab',2);hollow(6,1,6,26,5,16,1);B(6,6,6,26,6,16,'slab',6);hollow(8,7,8,24,10,14,7);
    for(let x=6;x<=26;x+=4)B(x,1,17,x,6,17,'pillar',6);hole(14,1,16,18,4,16);sh(16,1,16,'arch',1,0);hip(5,5,27,17,7,4);hip(7,7,25,15,11,4);col(16,11,12,15,14);
    for(let x=9;x<=23;x+=3)win(x,9,14);for(const x of [8,24])lantern(x,19);};
  T['Hang động đá']=()=>{for(let x=3;x<=27;x++)for(let z=3;z<=25;z++){const d=Math.hypot((x-15)/12,(z-14)/11);const hh=Math.round((1-d)*9);if(hh>0)B(x,0,z,x,hh,z,'cube',d<.35?2:(hh>5?2:10));}
    hole(13,1,18,17,4,26);hole(12,1,16,18,5,19);sh(15,0,26,'slab',2);B(14,6,8,16,8,10,'cube',9);tree(10,20,3,2);tree(21,8,3,2);};
  T['Núi non & suối']=()=>{for(let x=2;x<=30;x++)for(let z=2;z<=26;z++){const d=Math.hypot((x-12)/9,(z-12)/9);const d2=Math.hypot((x-24)/6,(z-18)/6);const hh=Math.max(Math.round((1-d)*12),Math.round((1-d2)*7));
      if(hh>0)B(x,0,z,x,hh,z,'cube',hh>9?7:(hh>5?2:9));else cube(x,0,z,9);}
    for(let z=12;z<=26;z++)for(let x=14;x<=17;x++)if(x>=14+Math.floor((z-12)/6)&&x<=17+Math.floor((z-12)/6)){delV(x,1,z,true);delV(x,2,z,true);cube(x,0,z,12);}
    tree(26,6,3,2);tree(6,23,3,2);};
  T['Bến tàu & thuyền']=()=>{B(2,0,2,34,0,26,'cube',12);B(2,0,2,10,2,26,'cube',11);B(10,1,10,30,1,12,'slab',0);for(let x=10;x<=30;x+=4){B(x,0,10,x,1,10,'pillar',6);B(x,0,12,x,1,12,'pillar',6);}
    B(14,1,14,26,1,22,'cube',0);B(13,1,16,13,1,20,'cube',0);B(27,1,16,27,1,20,'cube',0);B(14,2,14,26,2,14,'slab',6);B(14,2,22,26,2,22,'slab',6);
    col(20,18,2,9,6);for(let y=4;y<=8;y++)B(19,y,18,21,y,18,'cube',7);B(16,4,16,16,5,20,'wedge',0);lantern(30,11);lantern(10,11);};
  T['Thuyền buồm']=()=>{B(2,0,2,30,0,22,'cube',12);for(let x=8;x<=24;x++){const w=Math.max(0,Math.round(3-Math.abs(x-16)*.35));B(x,1,11-w,x,1,11+w,'cube',0);B(x,2,11-w,x,2,11-w,'cube',6);B(x,2,11+w,x,2,11+w,'cube',6);}
    B(15,2,11,17,2,11,'cube',6);col(16,11,2,10,6);for(let y=4;y<=9;y++)B(15,y,11,17,y,11,'cube',7);B(16,10,11,16,10,11,'cube',1);B(25,2,11,26,3,11,'wedge',0);};
  T['Chợ phiên (các sạp)']=()=>{B(2,0,2,32,0,22,'cube',2);for(let i=0;i<4;i++){const x=4+i*7;B(x,1,4,x+4,1,6,'cube',0);for(const [a,b] of [[x,4],[x+4,4],[x,6],[x+4,6]])B(a,2,b,a,4,b,'pillar',6);
      B(x,5,3,x+4,5,7,'slab',i%2?1:5);B(x+1,6,4,x+3,6,6,'slab',i%2?1:5);B(x+1,2,5,x+3,2,5,'cube',8);}
    for(let i=0;i<3;i++){const x=6+i*9;B(x,1,15,x+4,1,17,'cube',6);B(x,2,15,x,3,15,'pillar',6);B(x+4,2,15,x+4,3,15,'pillar',6);B(x-1,4,14,x+5,4,18,'slab',i%2?5:1);}
    B(14,1,10,18,1,12,'cube',2);cube(16,2,11,12);for(let x=3;x<=31;x+=7)lantern(x,20);};
  T['Hầm ngục']=()=>{B(3,0,3,27,0,23,'cube',15);hollow(3,1,3,27,3,23,3);for(let x=3;x<=27;x+=2){cube(x,4,3,2);cube(x,4,23,2);}for(let z=3;z<=23;z+=2){cube(3,4,z,2);cube(27,4,z,2);}
    for(let x=9;x<=21;x+=6)for(let z=3;z<=23;z+=1)if(z===12)cube(x,1,z,2);B(3,1,12,27,3,12,'cube',3);hole(14,1,12,16,2,12);
    for(const x of [7,12,18,23]){for(let y=1;y<=3;y++){col(x,6,y,y,15);col(x,7,y,y,15);}}B(24,1,18,26,2,21,'cube',2);cube(25,3,19,14);for(const [x,z] of [[5,5],[25,5],[5,21]])col(x,z,1,3,6);};
  T['Trại lính (lều)']=()=>{B(2,0,2,30,0,24,'cube',10);for(const [cx,cz] of [[8,8],[18,8],[26,12],[8,17],[18,18]]){gableZ(cx-3,cz-3,cx+3,cz+3,1,((cx+cz)%2?1:5));hole(cx-1,1,cz+3,cx+1,2,cz+3);}
    B(12,1,13,14,1,15,'cube',6);cube(13,2,13,5);for(let z=3;z<=22;z+=6){col(2,z,1,5,6);cube(2,6,z,1);}};
  T['Cây cổ thụ']=()=>{B(4,0,4,24,0,24,'cube',9);B(13,1,13,15,3,15,'cube',6);B(14,4,14,14,9,14,'cube',6);B(12,2,14,12,3,14,'cube',6);B(16,2,14,16,3,14,'cube',6);
    for(let y=9;y<=15;y++){const r=y<12?6-(y-9):(y<14?4:2);for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++)if(x*x+z*z<=r*r+1)cube(14+x,y,14+z,9);}
    for(const [x,z] of [[7,7],[21,21],[8,20]])tree(x,z,3,2);};
  T['Tháp canh gỗ']=()=>{B(8,0,8,16,0,16,'cube',10);for(const [x,z] of [[9,9],[15,9],[9,15],[15,15]])B(x,1,z,x,9,z,'pillar',6);
    for(let y=2;y<=8;y+=3){B(9,y,9,15,y,9,'slab',6);B(9,y,15,15,y,15,'slab',6);B(9,y,9,9,y,15,'slab',6);B(15,y,9,15,y,15,'slab',6);}
    B(8,10,8,16,10,16,'slab',0);rail(8,8,16,16,11);for(const [x,z] of [[9,9],[15,9],[9,15],[15,15]])B(x,11,z,x,13,z,'pillar',6);hip(8,8,16,16,14,5);stairsS(12,7,4);};
  T['Vườn cảnh & hồ sen']=()=>{B(2,0,2,30,0,26,'cube',9);for(let x=6;x<=24;x++)for(let z=6;z<=20;z++){const d=Math.hypot((x-15)/9.5,(z-13)/7.5);if(d<=1){cube(x,0,z,d>.85?11:12);}}
    B(14,1,13,16,1,14,'cube',2);cube(15,2,13,2);B(6,1,22,10,1,24,'slab',0);for(const [x,z] of [[7,22],[9,22]])col(x,z,1,4,1);B(6,5,21,10,5,25,'slab',5);hip(5,20,11,26,5,5);
    tree(24,22,4,2);tree(5,6,3,2);tree(25,6,3,2);for(let x=8;x<=22;x+=2)cube(x,1,5,10);for(const [x,z] of [[4,12],[27,12]])lantern(x,z);};
  T['Kim tự tháp bậc thang']=()=>{for(let i=0;i<7;i++)B(3+i*2,i,3+i*2,27-i*2,i,27-i*2,'cube',i%2?2:11);stairsS(15,2,1);for(let i=0;i<7;i++)B(14,i,3+i,16,i,3+i,'cube',14);
    B(13,7,13,17,7,17,'cube',2);hole(14,8,14,16,9,16);B(13,8,13,17,10,17,'cube',7);hole(14,8,14,16,9,16);hip(12,12,18,18,11,14);};
  T['Pháo đài biên ải']=()=>{B(2,0,2,34,0,26,'cube',10);B(5,1,5,31,6,5,'cube',3);B(5,1,21,31,6,21,'cube',3);B(5,1,5,5,6,21,'cube',3);B(31,1,5,31,6,21,'cube',3);
    hole(15,1,21,21,5,21);crenel(5,5,31,21,7,3);tower(3,3,7,7,9,2,5);tower(29,3,33,7,9,2,5);tower(3,19,7,23,9,2,5);tower(29,19,33,23,9,2,5);
    B(15,1,10,21,5,16,'cube',2);hole(16,1,11,20,4,15);hip(14,9,22,17,6,5);for(const x of [14,22])lantern(x,24);};
  return T;
}
