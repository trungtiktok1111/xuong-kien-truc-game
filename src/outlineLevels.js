import {combineOutline,corridorLoop,ellipseLoop,rectangleLoop} from './outlineShapes.js';

const box=(x,y,w,h)=>rectangleLoop([x,y],[x+w,y+h]);
const oval=(x,y,rx,ry=rx)=>ellipseLoop(x,y,rx,ry);
const path=(width,...points)=>points.slice(1).map((point,i)=>corridorLoop(points[i],point,width/2));
const loopsOf=(parts,holes)=>holes.reduce((region,hole)=>combineOutline(region,[hole],'cut'),
 parts.reduce((region,part)=>combineOutline(region,Array.isArray(part[0][0])?part:[part],'add'),[]));

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

const rooms=(points,r=8)=>points.map(([x,y])=>oval(x,y,r));
function curve(width,a,b,c,d){
 const left=[],right=[];
 for(let i=0;i<=28;i++){
  const t=i/28,u=1-t;
  const coord=j=>u*u*u*a[j]+3*u*u*t*b[j]+3*u*t*t*c[j]+t*t*t*d[j];
  const tangent=j=>u*u*(b[j]-a[j])+2*u*t*(c[j]-b[j])+t*t*(d[j]-c[j]);
  const dx=tangent(0),dy=tangent(1),half=width/(2*Math.hypot(dx,dy));
  const x=coord(0),y=coord(1);
  left.push([x-dy*half,y+dx*half]);right.push([x+dy*half,y-dx*half]);
 }
 return [...left,...right.reverse()];
}
const ring=(x,y,rx,ry,ix,iy)=>combineOutline([oval(x,y,rx,ry)],[oval(x,y,ix,iy)],'cut');
const complex='Bố cục phức tạp';

definitions.push(
 ["twin-serpents","Song Long Quấn Hồ",complex,108,80,"Hai tuyến uốn qua sáu phòng, vòng quanh hai hồ và gặp nhau ở đài phía đông.",[10,40],[94,39],
  [...rooms([[12,40],[30,20],
  [73,20],[30,60],[73,60],
  [94,40]],10),oval(51,20,17,13),oval(51,60,17,13),curve(7,[12,40],[23,39],
  [16,20],[30,20]),curve(7,[73,20],[91,19],
  [82,37],[94,40]),curve(7,[12,40],[23,41],
  [16,60],[30,60]),curve(7,[73,60],[91,60],
  [82,43],[94,40]),...path(6,[30,20],[73,20]),...path(6,[30,60],[73,60]),...path(6,[73,22],[70,40],
  [73,58])],[oval(51,20,8,5.8),oval(51,60,8,5.8)],[[51,28],[68,59]]],
 ["seven-islands","Thất Đảo Liên Kiều",complex,116,92,"Bảy đảo và hai vòng cầu. Hai bến nối lại ở đảo đông, còn đảo giữa mở đường tắt.",[11,45],[102,45],
  [...rooms([[12,46],[32,20],
  [68,17],[103,46],[70,74],
  [33,73]],10),oval(56,45,13,12),...path(5,[12,46],[32,20],
  [68,17],[103,46],[70,74],
  [33,73],[12,46]),...path(5,[32,20],[56,45],
  [70,74]),...path(5,[33,73],[56,45],
  [68,17])],[oval(56,45,5)],[[31,19],[69,73]]],
 ["three-crescents","Tam Nguyệt Trùng Cung",complex,104,104,"Ba vòng trăng xếp lệch, nối nhau qua các đường cong và sân giữa.",[12,18],[88,81],
  [oval(26,25,21,17),oval(72,36,23,19),oval(57,78,34,20),curve(8,[31,18],[44,9],
  [49,18],[59,27]),curve(7,[77,46],[94,53],
  [89,65],[80,77]),curve(7,[19,35],[7,49],
  [20,68],[36,74]),...path(6,[51,49],[49,61],
  [53,68])],[oval(28,23,10,8),oval(74,34,11,8),oval(55,78,18,9)],[[17,34],[83,28],
  [53,90]]],
 ["lotus-citadel","Liên Thành Bát Môn",complex,112,100,"Bốn sân trong, tám đài rìa và chính điện ở nút giao hai trục.",[10,50],[101,49],
  [box(18,17,76,66),oval(56,50,17),...rooms([[16,21],[35,14],
  [76,14],[96,21],[16,79],
  [35,86],[76,86],[96,79]],9),...path(8,[10,50],[30,50],
  [56,50],[81,50],[101,50]),...path(7,[35,14],[56,21],
  [76,14]),...path(7,[35,86],[56,79],
  [76,86])],[oval(36,33,9,8),oval(76,33,9,8),oval(36,67,9,8),oval(76,67,9,8),oval(56,50,4)],[[17,21],[55,43],
  [94,79]]],
 ["crossroads-below","Mê Cung Bốn Hầm",complex,108,92,"Bốn khu hầm nối thành vòng, có nhánh cụt giữ rương và hai đường chéo xuyên khu giữa.",[8,45],[99,45],
  [...rooms([[10,45],[26,22],
  [59,22],[84,19],[98,45],
  [80,69],[48,68],[22,69],
  [55,44]],8),...path(6,[10,45],[26,22],
  [59,22],[84,19],[98,45],
  [80,69],[48,68],[22,69],
  [10,45]),...path(5,[26,22],[55,44],
  [80,69]),...path(5,[59,22],[55,44],
  [48,68]),...path(5,[22,69],[24,84]),...path(5,[84,19],[88,7])],[oval(55,44,3)],[[24,83],[88,8],
  [22,69]]],
 ["coiled-observatory","Thiên Đài Xoắn Kép",complex,112,104,"Đi quanh hai vành khuyết, vào lõi qua cầu cong rồi theo nhánh trong ra đài cuối.",[9,49],[61,52],
  [ring(54,51,44,43,35,34),ring(55,52,26,25,16,15),...path(7,[8,50],[16,50]),curve(7,[39,12],[26,20],
  [22,31],[37,35]),curve(7,[90,66],[90,79],
  [63,84],[65,72]),oval(61,52,8),curve(6,[74,42],[71,33],
  [54,42],[61,52])],[box(54,3,10,15),box(48,76,10,11)],[[20,68],[69,86]]],
 ["ribbon-gates","Trường Lang Ngũ Ải",complex,124,94,"Năm trạm lớn nhỏ xen kẽ, có hai nhánh quay lại và ba hành lang uốn chữ S.",[8,16],[112,71],
  [box(5,10,13,13),...rooms([[26,23],[51,20],
  [68,48],[88,76],[112,70]],9),curve(7,[14,16],[22,14],
  [20,23],[26,23]),curve(7,[26,23],[37,36],
  [39,11],[51,20]),curve(7,[51,20],[71,20],
  [53,40],[68,48]),curve(7,[68,48],[86,49],
  [73,69],[88,76]),curve(7,[88,76],[97,82],
  [99,64],[112,70]),...path(5,[26,23],[29,50],
  [47,60],[68,48]),...path(5,[68,48],[91,47],
  [112,70]),...rooms([[29,50],[47,60],
  [91,47]],7)],[oval(68,48,3.5),oval(88,76,3.1)],[[28,50],[47,60],
  [88,81]]],
 ["five-rings","Ngũ Hoàn Thủy Cung",complex,132,96,"Năm vành có hồ riêng, lối đi đan qua ba tầng tuyến trên mặt bằng.",[10,47],[121,48],
  [oval(25,49,18,16),oval(56,24,17,15),oval(56,72,17,15),oval(88,49,18,16),oval(113,49,14,17),...path(7,[25,49],[56,24],
  [88,49],[56,72],[25,49]),...path(7,[88,49],[113,49]),curve(5,[56,24],[49,38],
  [68,59],[56,72])],[oval(25,49,8,7),oval(56,24,7,6),oval(56,72,7,6),oval(88,49,8,7),oval(113,49,6,9)],[[32,56],[55,32],
  [95,57]]],
 ["shell-vault","Ốc Điện Tam Tầng Tuyến",complex,114,106,"Ba tuyến vòng lồng nhau trên một mặt bằng. Các cầu nối lệch hướng buộc người chơi đổi vòng.",[14,53],[61,51],
  [ring(54,53,45,43,39,37),ring(54,53,32,31,26,25),ring(54,53,19,18,11,10),oval(60,51,9,8),...path(7,[54,15],[54,26]),...path(7,[54,80],[54,68]),...path(7,[70,52],[61,51]),...path(7,[14,53],[20,53])],[],[[54,17],[54,81]]],
 ["dragon-delta","Long Giang Tam Nhánh",complex,140,100,"Ba cửa vào dẫn qua một hợp lưu, tách ra hai bờ bao vịnh rồi gặp lại tại cửa biển.",[10,48],[129,54],
  [...rooms([[12,21],[12,48],
  [12,77],[48,49],[91,27],
  [91,76],[126,54]],10),curve(7,[12,21],[33,12],
  [26,43],[48,49]),curve(7,[12,48],[26,43],
  [35,57],[48,49]),curve(7,[12,77],[35,90],
  [24,58],[48,49]),curve(8,[48,49],[73,60],
  [64,17],[91,27]),curve(8,[48,49],[65,46],
  [67,86],[91,76]),curve(8,[91,27],[118,24],
  [106,54],[126,54]),curve(8,[91,76],[118,84],
  [108,57],[126,54]),oval(89,51,16,22)],[oval(91,52,8,13)],[[11,20],[90,25],
  [92,76]]]
);

export const outlineLevels=definitions.map(([id,name,group,w,h,description,start,goal,parts,holes,chests])=>({
 id,name,group,w,h,description,start,goal,chests,theme:group===complex,loops:loopsOf(parts,holes)
}));

export const DA_XOAY_LEVEL='da-xoay-goc';
export function levelLibrary(sample){
 if(!sample?.cfg?.outline?.loops?.length)return outlineLevels;
 const position=type=>{
  const e=sample.ents.find(item=>item.t===type);
  return [e.x,e.y];
 };
 const original={
  id:DA_XOAY_LEVEL,name:'Hầm ngục Đá Xoáy',group:complex,w:sample.w,h:sample.h,
  description:'Mẫu gốc trong Xưởng. Qua hành lang cong, vòng sân tròn, mở rương ở mật thất rồi quay về cổng.',
  start:position('start'),goal:position('goal'),chests:[position('chest')],
  loops:sample.cfg.outline.loops,sample
 };
 return [original,...outlineLevels.filter(l=>l.theme),...outlineLevels.filter(l=>!l.theme)];
}
