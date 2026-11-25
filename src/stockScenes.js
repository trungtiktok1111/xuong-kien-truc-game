import {networkVariant} from './settlementLayout.js';

// Recipes use one Kenney miniature cell (256 × 128 px) and keep each PNG editable.
const miniature=id=>'kenney-isometric-miniature-'+id+'.zip';
export const stockScenes=[
  {id:'town',label:'Phố SBS Town',kind:'original',files:['sbs-isometric-town-pack.zip','sbs-isometric-town-examples.zip']},
  {id:'shaolin',label:'Sân Thiếu Lâm',kind:'original',files:['thieu-lam-isometric-2d-v1-0.zip']},
  {id:'warship',label:'Chiến thuyền Hắc Long · hai boong',kind:'original',files:['chien-thuyen-hac-long-isometric-v4.zip']},
  {id:'farm',label:'Trang trại · nhà kho, hiên gỗ và ruộng ngô',kind:'reference',files:[miniature('farm')]},
  {id:'dungeon',label:'Thành đá · sân trong và hành lang vòm',kind:'reference',files:[miniature('dungeon')]},
  {id:'library',label:'Thư viện · phòng đọc và dãy kệ sách',kind:'reference',files:[miniature('library'),miniature('dungeon')]},
  {id:'prototype',label:'Sân thử nghiệm · cổng, trụ và vật cản',kind:'reference',files:[miniature('prototype')]},
  {id:'bases',label:'Sân trưng bày · bệ đá, gỗ, cỏ và tuyết',kind:'reference',files:[miniature('bases'),miniature('dungeon')]},
  {id:'city',label:'Phố Kenney · dãy nhà nhiều tầng và vườn phố',kind:'reference',files:[
    'kenney-isometric-buildings.zip','kenney-isometric-city.zip','kenney-isometric-landscape.zip','kenney-isometric-vehicles.zip']}
];

const piece=(asset,x,y,{dir='E',z=0,roof=false,solid=false,source=0,wall=false,open=false}={})=>
  ({asset,x,y,dir,z,roof,solid,source,wall,open});

export const edgeDirection={west:'E',north:'S',east:'W',south:'N'};

export function farmBarn(x,y,w,h){
  const parts=[],put=(id,a,b,opts)=>parts.push(piece(id,x+a,y+b,opts));
  for(let j=0;j<h;j++){
    put('woodWall',0,j,{wall:true});
    put(j===Math.floor(h/2)?'woodWallDoorClosed':'woodWallWindow',w-1,j,{dir:'W',wall:true});
  }
  for(let i=0;i<w;i++){
    put('woodWall',i,0,{dir:'S',wall:true});
    put(i===0?'woodWallGateClosed':'woodWallCross',i,h-1,{dir:'N',wall:true});
  }
  // A one-cell shed can use a full ridge. A two-cell barn has a slope on each side.
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    if(w===1)put(j===h-1?'roofSingleWall':'roofSingle',i,j,{dir:'N',roof:true,z:157});
    else put('roof',i,j,{dir:i===0?'S':'N',roof:true,z:157});
  }
  if(w===2){
    put('woodWallRoofLeft',0,h-1,{dir:'N',z:157,roof:true});
    put('woodWallRoofRight',1,h-1,{dir:'N',z:157,roof:true});
  }
  return parts;
}

function plan(name,w,h,floor){
  const ground=Array.from({length:w*h},()=>floor),parts=[],blocks=[];
  return {name,w,h,ground,parts,blocks,
    floor(x,y,width,depth,asset){for(let b=y;b<y+depth;b++)for(let a=x;a<x+width;a++)ground[b*w+a]=asset;},
    add(asset,x,y,opts){parts.push(piece(asset,x,y,opts));},
    block(x,y,width,depth){blocks.push([x,y,width,depth]);}
  };
}

function divider(scene,x,y,len,id,{dir='S',door=-1,doorId,source=0,along='x'}={}){
  for(let i=0;i<len;i++){
    const open=i===door;
    scene.add(open?doorId:id,x+(along==='x'?i:0),y+(along==='y'?i:0),{dir,source,wall:true,open});
  }
}

function farm(){
  const s=plan('Kenney Farm · Nhà kho và ruộng ngô',17,15,'dirt');
  s.start=[1,10];s.goal=[15,11];
  s.floor(2,3,2,5,'planks');s.floor(8,7,6,2,'planks');s.floor(10,5,4,2,'planks');
  s.floor(2,10,5,3,'dirtFarmland');s.floor(10,2,5,3,'dirtFarmland');
  s.parts.push(...farmBarn(2,3,1,5),...farmBarn(10,5,2,4),...farmBarn(8,6,1,2));
  s.block(2,3,1,5);s.block(10,5,2,4);s.block(8,6,1,2);
  for(const [x,y,dx,dy] of [[2,10,5,3],[10,2,5,3]]){
    for(let j=0;j<dy;j++)for(let i=0;i<dx;i++){
      s.add((i+j)%3?'cornDouble':'cornYoungDouble',x+i,y+j,{dir:i%2?'E':'N',solid:true});
    }
    divider(s,x,y,dx,'fenceLow');
    divider(s,x,y+dy-1,dx,'fenceLow',{dir:'N'});
    divider(s,x,y,dy,'fenceLow',{dir:'E',along:'y'});
    divider(s,x+dx-1,y,dy,'fenceLow',{dir:'W',along:'y'});
  }
  s.add('hayBales',12,8,{solid:true});s.add('sacksCrate',3,5,{solid:true});
  s.add('hayBalesStacked',12,6,{solid:true});s.add('ladderStand',11,9,{dir:'W',solid:true});
  s.add('hay',4,3,{solid:true});s.add('ladderStraight',7,7,{dir:'N',solid:true});
  return s;
}

function dungeon(){
  const s=plan('Kenney Dungeon · Thành đá và sân trong',16,13,'stone');
  s.start=[1,10];s.goal=[14,2];
  for(const [x,y,w,h] of [[2,2,6,4],[10,2,4,3],[3,8,4,3]])
    s.floor(x,y,w,h,'stoneUneven');
  divider(s,2,2,12,'stoneWall',{door:7,doorId:'stoneWallArchway'});
  divider(s,2,2,6,'stoneWall',{dir:'E',along:'y',door:3,doorId:'stoneWallDoorOpen'});
  divider(s,5,6,8,'stoneWallAged',{door:3,doorId:'stoneWallArchway'});
  divider(s,12,6,5,'stoneWall',{dir:'W',along:'y',door:2,doorId:'stoneWallGateOpen'});
  for(const [id,x,y] of [['woodenSupports',4,3],['barrelsStacked',4,4],['woodenCrates',5,3],
    ['tableRoundItemsChairs',11,4],['tableShortChairs',5,8],['stoneColumn',8,9],['stoneColumn',9,4],
    ['tableRoundChairs',10,9],['barrels',12,9],['chestClosed',4,2],['woodenPile',13,6]]){
    s.add(id,x,y,{solid:true});
  }
  return s;
}

function library(){
  const s=plan('Kenney Library · Tàng thư và phòng đọc',17,13,{asset:'stone',source:1});
  s.start=[2,10];s.goal=[15,4];
  divider(s,2,2,13,'stoneWall',{source:1,door:7,doorId:'stoneWallArchway'});
  divider(s,2,2,7,'stoneWall',{source:1,dir:'E',along:'y',door:4,doorId:'stoneWallArchway'});
  divider(s,4,6,9,'stoneWall',{source:1,door:3,doorId:'stoneWallArchway'});
  divider(s,12,4,7,'stoneWall',{source:1,dir:'W',along:'y',door:3,doorId:'stoneWallArchway'});
  for(const x of [3,5,10,12,14])s.add(x%2?'bookcaseBooksLadder':'bookcaseWideBooks',x,2,{dir:'S',solid:true});
  for(const x of [4,9,11])s.add('bookcaseBooks',x,6,{dir:'S',solid:true});
  for(let x=4;x<=10;x++)s.add(x===4||x===10?'floorCarpetEnd':'floorCarpet',x,9,{dir:x===10?'S':'E'});
  for(const [id,x,y] of [['displayCaseBooks',5,7],['displayCaseSword',11,7],['displayCaseOpen',14,5],
    ['longTableDecoratedChairsBooks',7,4],['longTableChairs',11,4],['bookStand',8,8],['candleStandDouble',10,10],
    ['longTableDecoratedChairs',5,11],['libraryChair',7,11],['bookStandEmpty',14,9]])
    s.add(id,x,y,{solid:true});
  return s;
}

function prototype(){
  const s=plan('Kenney Prototype · Sân thử nghiệm',15,12,'floor');
  s.start=[1,7];s.goal=[13,8];
  divider(s,2,2,10,'wall',{door:5,doorId:'doorOpen'});
  divider(s,3,3,6,'windowMiddle',{dir:'E',along:'y',door:3,doorId:'doorOpen'});
  divider(s,8,6,6,'wallBattlement',{door:3,doorId:'doorOpen'});
  for(const [id,x,y] of [['column',6,4],['doorway',7,4],['columnBlocks',8,4],['crate',5,8],
    ['blockHalf',6,8],['poleGroup',9,8],['windowMiddle',10,3],['slab',11,3],['stairs',11,7],
    ['columnCorner',10,9],['switchFloorOn',8,10]])
    s.add(id,x,y,{solid:id!=='switchFloorOn'});
  return s;
}

function bases(){
  const s=plan('Kenney Bases · Sân trưng bày bệ',14,11,{asset:'stone',source:1});
  s.start=[1,5];s.goal=[12,5];
  for(const [i,kind] of ['stone','wood','grass','snow'].entries()){
    const x=2+i*3;
    s.floor(x,2,2,2,kind==='snow'?'square_snow_detail':'square_'+kind+'_flat');
    s.add('base_'+kind+'_high',x,3,{solid:true});
    s.add('base_'+kind+'_detail',x+1,8,{solid:true});
    s.add('stoneColumn',x,7,{source:1,solid:true});
  }
  return s;
}

const numbered=(group,id)=>'png/'+group+'_'+String(id).padStart(3,'0')+'.png';
export const cityBuildings=[
  [4,16,3],[9,23,1],[22,39,4],[36,45,2],[18,0,1],[34,24,3],[30,45,2],[29,44,1],[3,15,2]
];
export function cityBuilding(x,y,base,middle,stories){
  const parts=[piece(numbered('buildingTiles',base),x,y,{solid:true})];
  for(let i=1;i<stories;i++)parts.push({
    ...piece(numbered('buildingTiles',middle),x,y,{z:30+(i-1)*33}),stack:true
  });
  return parts;
}
function city(){
  const cityTile=id=>({asset:numbered('cityTiles',id),source:1});
  const s=plan('Kenney City · Phố, vườn và dãy nhà',14,12,cityTile(66));
  s.start=[1,4];s.goal=[12,8];
  const roads=new Set();
  for(let x=1;x<=12;x++)roads.add(x+':4');
  for(let x=2;x<=12;x++)roads.add(x+':8');
  for(let y=4;y<=8;y++)for(const x of [2,7,11])roads.add(x+':'+y);
  const tiles={E:15,W:14,N:110,S:21,EW:10,NS:5,EN:28,ES:35,NW:20,SW:27,ENW:22,NSW:29,ENS:30,ESW:37,ENSW:89};
  for(const key of roads){
    const [x,y]=key.split(':').map(Number);
    const edges=[...networkVariant(roads,x,y)].map(edge=>({N:'E',E:'S',S:'W',W:'N'})[edge]).sort().join('');
    const id=tiles[edges];
    s.floor(x,y,1,1,cityTile(id));
  }
  s.floor(3,5,3,3,{asset:numbered('landscapeTiles',10),source:2});
  const locations=[[3,3],[5,3],[7,3],[9,3],[3,9],[5,9],[7,9],[10,9],[12,6]];
  for(const [i,[x,y]] of locations.entries()){
    s.parts.push(...cityBuilding(x,y,...cityBuildings[i]));
    s.block(x,y,1,1);
  }
  for(const [x,y] of [[3,5],[5,5],[3,7],[5,7],[8,6],[11,2],[12,10]])
    s.add('details/cityDetails_010.png',x,y,{source:1,solid:true});
  s.add('png/ambulance/ambulance_e.png',9,6,{source:3,solid:true});
  for(const [x,y] of [[4,6],[10,6]])s.floor(x,y,1,1,cityTile(51));
  return s;
}

const recipes={farm,dungeon,library,prototype,bases,city};
export const referencePlan=id=>recipes[id]?.();

export function packPurpose(file){
  if(/grid-pack|projection/.test(file))return 'Tham khảo';
  if(/tile-toolkit|crate-textures|textures-wall/.test(file))return 'Vật liệu nguồn';
  if(/tree-pack/.test(file))return 'Cây và mô hình 3D';
  if(/platformer/.test(file))return 'Tài nguyên góc ngang';
  if(/overworld|bases|landscape|pathways|textures-floor|roads/.test(file))return 'Nền và hạ tầng';
  if(/doorways|wall-pack|town|buildings|farm|dungeon|library|prototype/.test(file))return 'Kiến trúc và nội thất';
  return 'Đạo cụ, công trình hoặc bộ ô';
}
