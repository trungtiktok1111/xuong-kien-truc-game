import {combineOutline,corridorLoop,ellipseLoop,rectangleLoop} from './outlineShapes.js';

const box=(x,y,w,h)=>rectangleLoop([x,y],[x+w,y+h]);
const oval=(x,y,rx,ry=rx)=>ellipseLoop(x,y,rx,ry);
const path=(width,...points)=>points.slice(1).map((point,i)=>corridorLoop(points[i],point,width/2));
const loopsOf=(parts,holes)=>holes.reduce((region,hole)=>combineOutline(region,[hole],'cut'),
 parts.reduce((region,part)=>combineOutline(region,[part],'add'),[]));

const definitions=[
 ['three-vaults','Hầm ngục Ba Kho','Hầm ngục',56,38,'Qua ba kho nối bằng hành lang gấp khúc, tìm lối thoát ở phía đông.',
  [8,10],[47,27],[oval(10,11,7),box(22,6,14,15),oval(45,27,8),...path(4,[10,11],[27,11]),...path(5,[32,15],[32,27],[45,27])],[],[[28,16]]],
 ['snake-crypt','Mộ đá Uốn Lượn','Hầm ngục',68,52,'Đi qua hai lối cong và vòng quanh giếng đá để tới hầm cuối.',
  [8,13],[53,42],[box(4,8,12,11),oval(30,17,12,10),oval(53,38,10,11),
   ...path(5,[9,13],[19,13],[23,16],[30,17]),...path(5,[38,18],[49,17],[57,22],[56,30],[53,36])],[oval(53,38,3.8)],[[28,13]]],
 ['sunken-vault','Hầm Giếng Chìm','Hầm ngục',60,48,'Hai phòng kho bên hông và một giếng chìm giữa tuyến ra cửa bắc.',
  [30,42],[30,6],[oval(30,24,20,16),box(25,4,10,40),oval(8,24,6),oval(52,24,6),
    ...path(5,[8,24],[18,24]),...path(5,[42,24],[52,24])],[oval(30,24,8,6)],[[8,24],[51,24]]],
 ['forked-crypt','Hầm Hai Ngả','Hầm ngục',72,48,'Chọn lối bắc hoặc nam, mỗi nhánh vòng qua một kho riêng rồi gặp lại.',
  [9,23],[62,23],[oval(10,24,8),oval(60,24,9),box(27,5,16,13),box(27,31,16,13),
   ...path(6,[10,24],[19,12],[35,12],[50,12],[60,24]),
   ...path(6,[10,24],[19,37],[35,37],[50,37],[60,24])],[],[[35,10],[35,39]]],
 ['twin-courts','Song Viện','Sân và thành',68,46,'Men theo hành lang quanh hai sân trong rồi băng qua chính điện.',
  [8,23],[59,22],[box(4,8,60,30),oval(15,23,11),oval(53,23,11)],[oval(21,23,7,9),oval(46,23,7,9)],[[33,13]]],
 ['star-bastion','Tinh Thành','Sân và thành',64,64,'Đi từ cổng nam qua thành sáu mũi, vòng hồ trung tâm tới tháp bắc.',
  [32,56],[32,6],[Array.from({length:12},(_,i)=>{
   const a=-Math.PI/2+i*Math.PI/6,r=i%2?18:28;return [32+Math.cos(a)*r,32+Math.sin(a)*r];
  })],[oval(32,32,8)],[[11,22],[52,21]]],
 ['four-watchtowers','Thành Bốn Tháp','Sân và thành',72,56,'Bốn tháp góc nối bằng tường thành, với hai lối vòng quanh sân trung tâm.',
  [12,46],[60,8],[box(10,10,52,36),...[ [12,12],[60,12],[60,44],[12,44] ].map(([x,y])=>oval(x,y,9))],
  [box(22,18,28,20)],[[12,11],[60,44]]],
 ['lotus-court','Liên Hoa Viện','Sân và thành',68,60,'Đi từ cổng dưới, vòng hồ sen giữa đại điện rồi tới đài phía trên.',
  [34,52],[34,6],[oval(34,30,15),...[ [20,22],[48,22],[20,38],[48,38] ].map(([x,y])=>oval(x,y,11)),
   ...path(6,[34,7],[34,52]),oval(34,51,6),oval(34,8,6)],[oval(34,31,7.5)],[[18,23],[50,37]]],
 ['island-bridges','Quần Đảo Ba Cầu','Cầu và lối đi',76,56,'Ba cầu hẹp nối bốn đảo, từ bến tây đến đài cuối ở đông nam.',
  [9,36],[67,41],[oval(12,36,10),oval(27,15,10),oval(49,17,10),oval(64,42,10),
   ...path(4,[12,36],[27,15]),...path(5,[27,15],[49,17]),...path(4,[49,17],[64,42])],[],[[27,15],[51,18]]],
 ['crescent-pass','Đèo Bán Nguyệt','Cầu và lối đi',64,54,'Theo vòng cung dài quanh vực xuống trạm cuối ở phía đông nam.',
  [49,13],[49,40],[oval(29,27,25,22),oval(50,13,8),oval(50,40,8)],[oval(40,27,22,12)],[[10,27]]],
 ['zigzag-gates','Ải Ba Khúc','Cầu và lối đi',84,54,'Vượt ba khúc gấp qua trạm giữa, rồi tìm cổng ở đầu kia.',
  [8,42],[75,11],[box(3,35,13,14),box(69,4,12,14),oval(41,25,8,7),
   ...path(5,[9,42],[26,42],[33,25],[48,25],[56,11],[75,11])],[],[[41,23]]],
 ['ring-crossing','Đại Vành Bốn Cổng','Cầu và lối đi',86,70,'Chọn một trong hai nhánh vòng qua hồ lớn, băng từ cổng tây sang cổng đông.',
  [8,34],[77,34],[oval(43,35,32,25),...path(7,[8,35],[20,35]),...path(7,[66,35],[78,35]),
   oval(8,35,5),oval(78,35,5),oval(43,12,8),oval(43,57,8)],[oval(43,35,22,15)],[[43,10],[43,57]]]
];

export const outlineLevels=definitions.map(([id,name,group,w,h,description,start,goal,parts,holes,chests])=>({
 id,name,group,w,h,description,start,goal,chests,loops:loopsOf(parts,holes)
}));
