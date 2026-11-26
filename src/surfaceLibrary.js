// Coordinates are authored on a 100 × 100 planning grid and scaled to the map.
const oval=(kind,x,y,rx,ry)=>({kind,oval:[x,y,rx,ry]});
const box=(kind,x,y,w,h)=>({kind,box:[x,y,w,h]});
const naturalPaths=new Set(['river','stream','trail']);
function path(kind,width,...points){
 if(!naturalPaths.has(kind)||points.length<6)return {kind,width,xy:points};
 const xy=points.slice(0,2);
 for(let i=2;i<points.length-2;i+=2){
  const x=points[i],y=points[i+1];
  const [ax,ay,bx,by]=[points[i-2],points[i-1],points[i+2],points[i+3]];
  const before=Math.min(.32,9/Math.hypot(x-ax,y-ay)),after=Math.min(.32,9/Math.hypot(x-bx,y-by));
  const l=x+(ax-x)*before,m=y+(ay-y)*before,r=x+(bx-x)*after,n=y+(by-y)*after;
  for(let step=0;step<=6;step++){
   const t=step/6,u=1-t;
   xy.push(u*u*l+2*u*t*x+t*t*r,u*u*m+2*u*t*y+t*t*n);
  }
 }
 xy.push(...points.slice(-2));
 return {kind,width,xy};
}
const main=(...xy)=>path('main',5,...xy);
const branch=(...xy)=>path('branch',3,...xy);
const forest=(...args)=>oval('forest',...args);
const mountain=(...args)=>oval('mountain',...args);
const river=(...xy)=>path('river',8,...xy);
const stream=(...xy)=>path('stream',3,...xy);
const plaza=(...args)=>box('plaza',...args);
const farm=(...args)=>box('farm',...args);

function group(group,profile,rows){
 return rows.map(([id,name,w,h,start,goal,shapes,lots=[]])=>({id,name,group,profile,w,h,start,goal,shapes,lots}));
}

export const surfaceLevels=[
 ...group('Đồng bằng và rừng','plain',[
  ['doi-co','Đồi Cỏ Ba Lối',72,64,[8,52],[92,54],[oval('meadow',52,46,34,34),forest(16,17,24,19),forest(74,87,17,17),main(0,52,33,52,63,44,86,54,100,54),branch(33,52,38,20,61,10),path('trail',2,63,44,65,66,83,77)]],
  ['rung-cua','Rừng Cửa Bắc',76,72,[50,8],[50,92],[forest(50,46,58,53),oval('meadow',40,49,30,21),main(50,0,50,27,38,48,50,73,50,100),path('trail',2,38,48,11,55,15,76,50,73)]],
  ['dong-gio','Đồng Gió và Rặng Trúc',80,60,[8,74],[90,27],[oval('meadow',40,57,43,39),forest(77,63,20,37),farm(6,8,50,18),main(0,74,31,74,61,36,88,27,100,27),branch(31,74,24,25)]],
  ['bai-trong','Bãi Trống Giữa Rừng',72,72,[11,52],[86,52],[forest(49,49,58,57),oval('meadow',48,51,31,27),main(0,52,100,52),path('trail',2,22,52,34,34,62,34,77,52,62,69,35,69,22,52)]],
  ['dong-ven-ruong','Đồng Cỏ Ven Ruộng',76,64,[15,86],[88,17],[farm(3,7,63,31),farm(49,64,49,31),forest(87,45,17,18),main(15,100,15,62,36,49,75,49,88,17,100,17),branch(36,49,36,27),branch(75,49,63,82)]],
 ]),
 ...group('Núi và tông môn','temple',[
  ['ai-da','Ải Đá Hai Vách',84,70,[7,51],[92,51],[forest(50,49,45,48),mountain(37,22,28,22),mountain(58,80,36,22),main(0,51,25,51,55,43,79,51,100,51),plaza(74,48,20,16)],[[80,55]]],
  ['son-mon','Sơn Môn Ba Sân',80,84,[50,91],[50,14],[mountain(15,14,22,29),mountain(86,17,18,34),forest(56,47,43,44),plaza(31,15,38,16),plaza(35,42,30,14),plaza(27,69,46,15),main(50,100,50,0)],[[38,19],[55,72],[37,73]]],
  ['dai-tren-ho','Đài Đá Bên Hồ',80,70,[8,70],[65,20],[mountain(10,20,22,30),forest(56,14,25,17),oval('lake',73,59,22,30),plaza(52,14,26,19),main(0,70,35,70,50,55,50,20,65,20),path('trail',2,50,55,48,83,76,88)],[[56,24],[68,24]]],
  ['doi-bac','Đồi Bắc Đường Chữ Chi',84,76,[13,86],[86,14],[mountain(24,21,26,22),mountain(72,67,33,29),forest(33,71,29,28),main(13,100,13,76,48,58,28,42,76,33,86,14,100,14),plaza(76,8,18,17)],[[81,19]]],
  ['thung-lung','Thung Lũng Nối Hai Cổng',86,72,[8,31],[92,68],[mountain(50,1,45,27),mountain(49,95,41,24),forest(73,44,27,26),stream(26,0,34,35,28,58,43,100),main(0,31,24,31,44,53,68,53,85,68,100,68),plaza(49,56,17,14)],[[52,59]]],
 ]),
 ...group('Thôn trang','village',[
  ['thon-lua','Thôn Lúa Hai Bờ',82,66,[8,46],[92,46],[farm(3,5,39,31),farm(61,68,36,28),stream(50,0,54,39,48,72,53,100),main(0,46,100,46),branch(30,46,30,87),branch(72,46,72,14),oval('pond',24,74,9,11)],[[15,49],[33,63],[68,30],[76,51]]],
  ['xom-ao','Xóm Ao Sen',74,66,[9,59],[93,59],[oval('pond',48,47,19,24),farm(59,75,35,21),forest(13,15,17,16),main(0,59,27,59,35,77,60,77,72,59,100,59),branch(27,59,25,25,62,24,72,59)],[[31,25],[69,28],[80,62]]],
  ['ruong-bac','Xóm Ruộng Bậc',86,68,[7,78],[90,21],[forest(24,14,25,17),farm(7,34,46,19),farm(16,58,39,15),farm(29,77,34,19),main(0,78,22,78,59,52,59,21,100,21),branch(59,52,90,53)],[[65,24],[77,25],[75,55]]],
  ['bo-muong','Làng Bờ Mương',76,72,[13,83],[86,20],[path('canal',4,0,56,56,56,56,100),farm(3,62,47,30),farm(62,8,34,35),main(13,100,13,42,45,42,71,20,100,20),branch(45,42,45,79,83,79)],[[21,34],[37,45],[56,45],[75,23]]],
  ['cho-thon','Chợ Thôn Ngã Ba',78,64,[8,48],[91,48],[farm(5,7,37,30),forest(77,76,24,21),plaza(40,32,24,29),main(0,48,100,48),branch(50,48,50,100),path('lane',2,61,36,80,25,88,48)],[[42,36],[56,36],[52,55],[57,68]]],
  ['thanh-thon-dong-lua','Thành Thôn Đồng Lúa',96,78,[8,50],[92,50],[farm(2,4,32,30),farm(4,67,34,29),farm(65,5,32,28),farm(65,68,31,28),forest(50,12,13,15),forest(53,88,15,13),stream(48,0,52,28,49,53,53,78,50,100),main(0,50,100,50),branch(34,50,34,23),branch(65,50,65,77),path('bridge',7,48,50,54,50)],[[24,39],[28,61],[71,38],[75,63]]],
 ]),
 ...group('Thành thị','city',[
  ['pho-ban-co','Phố Bàn Cờ',90,76,[7,50],[92,50],[plaza(13,12,74,76),main(0,50,100,50),main(50,0,50,100),...[25,75].map(y=>branch(18,y,82,y)),...[25,75].map(x=>branch(x,20,x,80))],[[29,27],[59,29],[35,61],[62,64],[77,55]]],
  ['tran-hai-cau','Trấn Hai Cầu',88,76,[7,30],[92,70],[river(52,0,49,36,55,64,53,100),plaza(13,18,26,48),plaza(64,36,22,48),main(0,30,80,30,80,69,100,69),branch(22,30,22,69,80,69)],[[28,34],[30,58],[66,34],[83,58]]],
  ['cho-duong-vong','Chợ Đường Vòng',86,74,[8,50],[92,50],[plaza(30,26,40,49),main(0,50,20,50,30,22,73,22,81,50,100,50),main(20,50,30,76,73,76,81,50),branch(51,22,51,76)],[[40,35],[56,35],[38,60],[60,59]]],
  ['pho-kenh','Phố Kênh Vuông',92,80,[9,39],[90,61],[plaza(13,13,71,73),path('canal',5,0,21,67,21,67,79,100,79),main(0,39,44,39,44,61,100,61),branch(23,12,23,81),branch(81,20,81,91)],[[27,28],[27,46],[46,46],[71,49],[83,66]]],
  ['quan-thanh','Quảng Trường Bốn Ngả',80,80,[8,50],[92,50],[forest(10,10,17,19),forest(92,91,18,18),plaza(30,27,40,46),main(0,50,100,50),main(50,0,50,100),branch(15,73,85,73),branch(15,28,85,28)],[[34,33],[59,34],[35,61],[59,61]]],
  ['pho-co-san-sat','Phố Cổ San Sát Bờ Kênh',112,88,[7,48],[93,48],[plaza(10,11,80,78),main(0,48,100,48),main(50,0,50,100),...[25,75].map(y=>branch(12,y,88,y)),...[20,40,60,80].map(x=>branch(x,12,x,88)),path('canal',4,0,90,100,90),path('bridge',8,46,90,54,90)],[... [18,31,44,57,70,83].flatMap(x=>[[x,18],[x,34],[x,58],[x,76]])]],
  ['kinh-thanh-hao-nuoc','Kinh Thành Hào Nước',108,92,[50,95],[50,5],[forest(8,8,18,20),forest(92,8,18,20),forest(8,92,18,20),forest(92,92,18,20),plaza(25,23,50,54),path('canal',5,4,16,96,16,96,84,4,84,4,16),main(0,50,25,50,75,50,100,50),main(50,0,50,23,50,77,50,100),path('bridge',8,4,50,25,50),path('bridge',8,75,50,96,50),path('bridge',8,50,4,50,23),path('bridge',8,50,77,50,96)],[[31,31],[41,31],[59,31],[69,31],[31,69],[41,69],[59,69],[69,69]]],
  ['ben-cho-song','Bến Chợ Hai Bờ',104,82,[8,47],[92,47],[plaza(8,15,28,66),plaza(64,15,28,66),river(48,0,50,24,47,48,51,76,49,100),main(0,47,43,47,57,47,100,47),branch(20,15,20,85),branch(80,15,80,85),path('bridge',9,43,47,57,47),path('lane',3,46,36,42,31,38,27),path('lane',3,57,62,61,68,65,73)],[[18,22],[28,28],[18,66],[28,74],[70,22],[82,30],[70,65],[82,75]]],
 ]),
 ...group('Sông, hồ và đầm','plain',[
  ['ho-dao','Hồ Đảo Giữa',84,72,[9,50],[92,50],[oval('lake',50,50,32,34),oval('meadow',51,49,10,13),main(0,50,100,50),path('trail',2,16,50,17,79,44,91,77,84,85,50)]],
  ['nga-song','Ngã Ba Sông',84,74,[10,36],[90,65],[river(61,0,60,37,53,66,58,100),river(0,79,24,75,53,66),main(0,36,33,36,76,36,76,65,100,65),branch(33,36,33,92),forest(17,15,20,17)]],
  ['dam-lau','Đầm Lau Nhiều Ao',80,72,[9,56],[91,38],[oval('wetland',53,47,40,45),oval('pond',33,32,10,15),oval('pond',57,36,9,19),oval('pond',68,72,15,12),main(0,56,40,56,54,65,79,38,100,38),path('trail',2,40,56,29,77,18,88)]],
  ['suoi-go','Suối Uốn Qua Gò',74,82,[26,8],[81,91],[forest(24,27,25,26),mountain(21,24,10,13),stream(60,0,62,24,43,37,57,68,42,100),main(26,0,26,48,80,48,81,100),path('trail',2,26,48,29,76,56,76,81,85)]],
  ['kenh-doc','Kênh Dọc Đồng Mía',82,68,[10,71],[90,23],[farm(4,7,37,52),farm(63,35,35,59),path('canal',5,49,0,49,100),path('canal',3,49,58,77,58,77,100),main(0,71,61,71,61,23,100,23),branch(29,71,29,28)]],
 ]),
 ...group('Ven biển','coast',[
  ['bai-cat-dai','Bãi Cát Dài',85,68,[10,55],[70,82],[box('sand',69,0,31,100),box('sea',81,0,19,100),forest(22,21,23,24),main(0,55,68,55,70,82),path('lane',2,74,8,74,92)],[[49,48],[59,59]]],
  ['cua-song','Cửa Sông Bến Chài',90,72,[9,26],[70,80],[box('sand',71,0,29,100),box('sea',85,0,15,100),river(40,0,41,29,47,50,86,63),main(0,26,70,26,70,80),branch(19,26,19,77,70,77)],[[56,29],[74,31],[73,73]]],
  ['vinh-cat','Vịnh Cát Lưỡi Liềm',86,76,[11,35],[20,88],[oval('sand',94,53,48,39),oval('sea',99,53,45,31),forest(22,33,22,25),main(0,35,38,35,43,55,38,77,20,88),path('trail',2,43,55,55,35,74,16)],[[32,39],[26,78]]],
  ['mui-da','Mũi Đá và Đường Ven Bờ',88,74,[8,37],[76,76],[box('sea',83,0,17,100),oval('sand',76,60,17,25),mountain(70,23,21,24),forest(42,19,16,17),main(0,37,35,37,51,54,75,54,76,76)],[[57,57],[66,57]]],
  ['dam-pha','Đầm Phá Sau Cồn Cát',86,80,[9,50],[78,65],[box('sand',75,0,25,100),box('sea',90,0,10,100),oval('wetland',54,45,32,46),oval('lake',58,45,24,32),main(0,50,28,50,28,81,78,81,78,65),path('lane',3,18,31,18,11,80,11,80,66)],[[22,56],[81,66]]],
  ['lang-chai-cua-song','Làng Chài Cửa Sông',100,80,[8,50],[83,88],[box('sand',70,0,30,100),box('sea',84,0,16,100),river(45,0,48,26,56,51,82,70,88,100),main(0,50,42,50,56,50,76,67,83,88),branch(15,50,15,22),branch(32,50,32,78),path('bridge',8,42,50,56,50),path('lane',3,56,50,70,35,85,34)],[[17,32],[28,32],[16,69],[30,68],[62,28],[72,27],[62,45],[72,48]]],
 ])
];

const pieceGroup=(group,rows)=>rows.map(([id,name,...shapes])=>({id,name,group,shapes}));
export const surfacePieces=[
 ...pieceGroup('Đất và công trình',[
  ['meadow','Bãi cỏ tròn',oval('meadow',50,50,48,42)],
  ['plain','Đồng bằng',box('plain',0,0,100,100)],
  ['grove','Rừng hai cụm',forest(32,42,32,37),forest(67,59,31,38)],
  ['clearing','Rừng có bãi trống',forest(50,50,50,49),oval('meadow',50,51,24,23),path('trail',13,50,50,50,100)],
  ['cliff','Vách núi',mountain(46,51,46,36)],
  ['mountains','Hai đỉnh núi',forest(50,55,50,43),mountain(25,39,23,31),mountain(70,60,29,35)],
  ['farm','Ruộng chia luống',farm(3,5,43,90),farm(53,5,44,90)],
  ['plaza','Quảng trường',plaza(5,8,90,84)],
  ['lot','Lô xây dựng',box('lot',10,12,80,76)],
  ['wetland','Bãi đất ngập nước',oval('wetland',50,50,48,42)],
 ]),
 ...pieceGroup('Nước và bờ',[
  ['coast','Biển và bãi cát',box('sand',45,0,55,100),box('sea',62,0,38,100)],
  ['bay','Vịnh cong',oval('sand',99,50,81,50),oval('sea',100,50,70,39)],
  ['river','Sông thẳng',path('river',36,50,0,50,100)],
  ['river-bend','Khúc sông cong',path('river',27,50,0,51,33,73,49,100,50)],
  ['river-fork','Ngã ba sông',path('river',23,50,0,50,100),path('river',20,50,52,100,50)],
  ['canal','Kênh chữ L',path('canal',18,50,0,50,50,100,50)],
  ['canal-straight','Kênh thẳng',path('canal',18,50,0,50,100)],
  ['stream','Suối uốn',path('stream',11,50,0,65,26,32,57,50,82,50,100)],
  ['lake','Hồ dài',oval('lake',50,50,49,36)],
  ['island','Hồ có đảo',oval('lake',50,50,49,44),oval('plain',50,50,17,16)],
  ['pond','Ao tròn',oval('pond',50,50,37,39)],
  ['estuary','Cửa sông ra biển',box('sand',67,0,33,100),box('sea',82,0,18,100),path('river',25,0,50,57,58,86,62)],
 ]),
 ...pieceGroup('Đường và cầu',[
  ['main','Đường lớn',path('main',28,0,50,100,50)],
  ['branch','Đường nhánh',path('branch',20,0,50,100,50)],
  ['lane','Đường nhỏ',path('lane',13,0,50,100,50)],
  ['trail','Đường mòn uốn',path('trail',10,0,50,32,34,61,70,100,50)],
  ['bend','Góc đường',path('branch',20,0,50,38,50,50,62,50,100)],
  ['junction','Ngã ba',path('main',22,0,50,100,50),path('branch',16,50,50,50,100)],
  ['cross','Ngã tư',path('main',22,0,50,100,50),path('main',22,50,0,50,100)],
  ['bridge','Cầu nối hai bờ',path('bridge',22,0,50,100,50)],
 ])
];

const byId=list=>new Map(list.map(item=>[item.id,item]));
export const surfaceLevelById=byId(surfaceLevels);
export const surfacePieceById=byId(surfacePieces);

export function inSurfaceShape(shape,x,y){
 if(shape.box){
  const [a,b,w,h]=shape.box;
  return x>=a&&y>=b&&x<a+w&&y<b+h;
 }
 if(shape.oval){
  const [a,b,rx,ry]=shape.oval;
  return ((x-a)/rx)**2+((y-b)/ry)**2<=1;
 }
 const {xy,width}=shape,r=width/2;
 for(let i=0;i<xy.length-2;i+=2){
  const ax=xy[i],ay=xy[i+1],bx=xy[i+2],by=xy[i+3];
  if(x<Math.min(ax,bx)-r||x>Math.max(ax,bx)+r||y<Math.min(ay,by)-r||y>Math.max(ay,by)+r)continue;
  const dx=bx-ax,dy=by-ay;
  if(dx===0&&dy===0)continue;
  const along=Math.min(1,Math.max(0,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  if((x-ax-along*dx)**2+(y-ay-along*dy)**2<=r*r)return true;
 }
 return false;
}
