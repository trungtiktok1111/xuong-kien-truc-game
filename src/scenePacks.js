import {unzipSync} from 'fflate';
import {buildTiledScene} from './tiledScene.js';
import {classifyArchiveImage,clearSheetColor,readTileset,sheetColor,tileFrames} from './archiveCatalog.js';
import {artBounds,canSeeRoad,canopyTouchesLot,overlapsHouseArt,protectedViews,settlementIssues} from './settlementChecks.js';
import {planSettlement,settlementTile,settlementProfiles} from './settlementLayout.js';

const decoder=new TextDecoder();
const norm=s=>s.replaceAll('\\','/').toLowerCase();
const slug=s=>norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d');
const stem=s=>s.split('/').at(-1).replace(/\.[^.]+$/,'');
const canvas=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
const isImage=path=>/\.(png|jpe?g|webp)$/i.test(path);
const family=path=>slug(path).replace(/[_ -]\d+(?=[_. -]|$)/g,'').replace(/[_-][ensw]$/i,'');
const readJSON=(files,path)=>path?JSON.parse(decoder.decode(files[path])):null;

export function openScenePack(name,bytes){
  const raw=unzipSync(bytes,{filter:e=>e.originalSize<=24_000_000&&/\.(json|tmx|tsx|png|jpe?g|webp)$/i.test(e.name)&&!/(^|\/)(__MACOSX|\._)/.test(e.name)});
  const files=Object.fromEntries(Object.entries(raw).map(([path,data])=>[norm(path),data]));
  const paths=Object.keys(files);
  const metadata=readJSON(files,paths.find(p=>/(^|\/)manifest\.json$/.test(p)));
  const scene=readJSON(files,paths.find(p=>/(^|\/)(canh-mau|ban-do)\.json$/.test(p)));
  return {name,bytes,files,paths,metadata,scene,
    tsx:paths.filter(p=>p.endsWith('.tsx')).map(p=>readTileset(p,decoder.decode(files[p]))).filter(Boolean)};
}

function nativeAsset(pack,id,direction='E'){
  const a=pack.metadata?.assets?.[id],projection=pack.metadata?.projection;
  const tileWidth=(projection?.tileSize||projection?.tileSizePx)?.[0];
  if(!a||!Number.isFinite(tileWidth)||tileWidth<=0)return null;
  const n=a.directions?.[direction]||a;
  if(!n.png)return null;
  const role=slug(a.kind||a.role||'');
  const layer=/^ground|^nen-di|^stair|^bac-len/.test(role)?0:/upper|buom$/.test(role)?3:/flooroverlay/.test(role)?1:2;
  return {pack,path:norm(n.png),label:id,layer,anchor:n.anchorPx||a.anchor||projection.anchorPx,
    native:true,tileWidth,
    collision:a.collision||(a.footprint&&a.solid!==false?{shape:'rect',bounds:a.footprint}:null),direction};
}

function rotateCollision(c,d){
  const rotate=([x,y])=>({S:[-y,x],W:[-x,-y],N:[y,-x]}[d]||[x,y]);
  if(c.shape==='circle')return [{k:'circle',x:0,y:0,r:c.radius}];
  if(c.shape==='compound')return c.parts.flatMap(p=>rotateCollision(p,d));
  if(c.shape!=='rect')return [];
  const [l,t,r,b]=c.bounds;
  const p=rotate([l,t]),q=rotate([r,b]);
  return [{k:'rect',x:Math.min(p[0],q[0]),y:Math.min(p[1],q[1]),w:Math.abs(p[0]-q[0]),h:Math.abs(p[1]-q[1])}];
}

async function loadImage(asset){
  const bm=await createImageBitmap(new Blob([asset.pack.files[asset.path]]));
  try{
    if(bm.width*bm.height>16_000_000)throw Error('Ảnh quá lớn: '+asset.path);
    const c=canvas(bm.width,bm.height),ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bm,0,0);
    const recipe=asset.recipe;
    if(recipe)clearSheetColor(ctx,c.width,c.height,sheetColor(recipe,ctx,c.width,c.height));
    return c;
  }finally{bm.close();}
}
function crop(source,frame,anchor,ground=false){
  const [sx,sy,w,h]=frame,ctx=source.getContext('2d',{willReadFrequently:true});
  const data=ctx.getImageData(sx,sy,w,h).data;
  let l=w,t=h,r=0,b=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>16){
    l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);
  }
  if(l>=r||t>=b)return null;
  if(anchor?.length===3){l=0;t=0;r=w;b=h;}
  const side=Math.max(r-l,b-t),out=canvas(side,side);
  const ox=(side-r+l)/2,oy=side-b+t;
  out.getContext('2d').drawImage(source,sx+l,sy+t,r-l,b-t,ox,oy,r-l,b-t);
  const a=anchor||[(l+r)/2,ground?(t+b)/2:b];
  return {out,side,ax:ox+a[0]-l,ay:oy+a[1]-t,bounds:[ox/side,oy/side,(ox+r-l)/side,1],w:r-l,h:b-t};
}
async function sprite(asset){
  const c=await loadImage(asset);
  const frames=asset.recipe?tileFrames(asset.recipe,c.width,c.height):[[0,0,c.width,c.height]];
  const anchor=/^cua_(?:dong|mo)/.test(asset.label)&&asset.anchor?[...asset.anchor,1]:asset.anchor;
  const first=asset.frameIndex??0;
  for(let n=0;n<frames.length;n++){
    const image=crop(c,frames[(first+n)%frames.length],anchor,asset.layer===0);
    if(image)return image;
  }
  throw Error('Không có ô ảnh dùng được: '+asset.path);
}

function addSprite(result,asset,art){
  const sid=result.sheets.length;
  result.sheets.push({name:asset.pack.name+' · '+asset.label,tw:art.side,margin:0,url:art.out.toDataURL('image/png')});
  return {...asset,...art,sid};
}
function entity(a,x,y,z,id,order){
  const isGround=a.layer===0,elevation=z||0;
  const col=a.collision?rotateCollision(a.collision,a.direction):a.block?[{k:'circle',x:0,y:0,r:.27}]:[];
  return {id,t:'deco',name:a.label,x:x-1,y:y-1,placedProp:true,sceneLayer:a.layer,
    ...(isGround||a.layer===3?{tiledLayer:order??0}:{}),
    roofSurface:false,walk:!col.length,col,tile:{sid:a.sid,idx:0},spriteBounds:a.bounds,
    sc:1.5*a.side/a.tileWidth,ox:.5-a.ax/a.side,oy:1-(a.ay+elevation)/a.side};
}

function nativeScenes(pack){
  const s=pack.scene;
  if(!pack.metadata?.assets||!pack.metadata?.projection)return [];
  if(Array.isArray(s?.ground)&&Array.isArray(s.objects)){
    return [{name:s.title,w:s.width,h:s.height,ground:s.ground,objects:s.objects,
      spawn:s.walkDemo?.low?.[0],door:s.gate}];
  }
  if(Array.isArray(s?.decks)&&s.decks.length)return s.decks.map(d=>({name:d.name,ground:d.floor,objects:d.items,spawn:s.spawn,links:s.links}));
  return [];
}
export async function reconstructPack(packs,{sample=false}={}){
  const originals=packs.filter(p=>nativeScenes(p).length);
  if(originals.length){
    const scenes=[];
    for(const p of originals)for(const s of nativeScenes(p)){
      const r={name:s.name,sheets:[],ents:[],bounds:null,source:p.name,gaps:[]};
      const ground=s.ground.map(a=>({...a,floor:true}));
      const items=[...ground,...s.objects];
      if(s.door?.placement)items.push({id:s.door.closed,x:s.door.placement[0],y:s.door.placement[1],z:s.door.zPx,gate:s.door});
      const cached=new Map();
      async function art(id,d){
        const key=id+'|'+d;
        if(!cached.has(key)){
          const a=nativeAsset(p,id,d);
          if(!a)throw Error('Thiếu mảnh '+id+' trong '+p.name+'.');
          cached.set(key,addSprite(r,a,await sprite(a)));
        }
        return cached.get(key);
      }
      for(const [i,pos] of items.entries()){
        const a=await art(pos.id,pos.d||'E');
        const e=entity(a,pos.x+.5,pos.y+.5,pos.z,'original-'+i,i);
        if(pos.gate?.open){
          const open=await art(pos.gate.open,pos.d||'E');
          e.door={st:'dong',auto:true,v:{dong:{tile:e.tile,col:[{k:'seg',a:pos.gate.hinges[0],b:pos.gate.hinges[1],th:.12}]},mo:{tile:{sid:open.sid,idx:0},col:[]}}};
          e.col=e.door.v.dong.col;e.walk=false;
        }
        r.ents.push(e);
      }
      r.w=s.w||Math.ceil(Math.max(...items.map(e=>e.x)))+2;
      r.h=s.h||Math.ceil(Math.max(...items.map(e=>e.y)))+2;
      if(s.spawn)r.ents.push({id:'start',t:'start',name:'Xuất phát',x:Math.floor(s.spawn[0]),y:Math.floor(s.spawn[1])});
      if(s.links)r.links=s.links;
      if(!s.w)r.blocked=Array.from({length:r.w*r.h},(_,i)=>1);
      if(r.blocked)for(const {x,y} of ground)r.blocked[y*r.w+x]=0;
      scenes.push(r);
    }
    return scenes;
  }
  if(!packs.some(p=>p.paths.some(path=>path.endsWith('.tmx'))))
    throw Error('Gói này không có dữ liệu bố cục gốc. Bạn có thể dùng gói để tạo bản đồ mới.');
  return [await buildTiledScene(packs.map(p=>p.bytes),{sample})];
}

const ignored=/preview|sample|spritesheet|tilesheet|kenneynl|(?:^|\/)(?:angle|characters?|masks?|examples?)\/|bang-mau|canh-rap|changelog|logo|isoguide|(?:^|\/)textures\/(?:tree|bush)/i;
const groundName=/^(?:base|square)[_-](?:grass|dirt|stone|wood|snow)|(?:^|\/)(?:nen[_-]|ground|floor|grass|path|road|dirt|terrain|landscape|beach|snow|water|river|duong|boong)/i;
const structure=/roof|mai[_-]|wall|doorway|tuong|vach|fence|lan-can|chimney|buom/;
function catalog(pack){
  if(pack.metadata?.assets&&pack.metadata.projection)return Object.keys(pack.metadata.assets).flatMap(id=>{
    const a=nativeAsset(pack,id);
    if(!a||/(?:[_-])[nsw]$/i.test(id)||a.layer===1||a.layer===3||structure.test(slug(id)))return [];
    return [a];
  });
  const hasIso=pack.paths.some(p=>p.startsWith('isometric/'));
  return pack.paths.filter(path=>isImage(path)&&!ignored.test(path)&&(!hasIso||path.startsWith('isometric/'))).flatMap(path=>{
    const name=stem(path);
    if(hasIso&&/[_-][nsw]$/i.test(name))return [];
    const info=classifyArchiveImage(pack.name,path,pack.tsx,[]);
    if(info.kind==='reference'||info.kind==='model')return [];
    if(/tile toolkit/i.test(pack.name)&&!/^bricks/.test(name.toLowerCase()))return [];
    if(info.kind==='layer'||/roof|mai[_-]/.test(slug(name)))return [];
    const grid=info.recipes[0];
    const material=info.kind==='material'||/tile toolkit/i.test(pack.name);
    if(/textures - wall|crate textures/i.test(pack.name))return [];
    const ground=material||info.kind==='terrain'||(groundName.test(path)||groundName.test(name))&&!structure.test(slug(name));
    if(ground&&/water|river|thac|overworld - forest/i.test(name))return [];
    const role=ground?0:2;
    return [{pack,path,label:name,layer:role,recipe:grid,material,tileWidth:grid?.width,block:role===2}];
  });
}
function pickAssets(pack,layer,rng,limit=6){
  const src=catalog(pack),pool=src.filter(a=>a.layer===layer);
  const ranked=pool.map(a=>({a,score:rng()+(/flat|grass|stone|ground|duong|wood|crate|barrel|wall|house|building|tree/i.test(a.label)?.8:0)+(/^square/.test(a.label)?1:0)-(/high|float/.test(a.label)?2:0)}))
    .sort((a,b)=>b.score-a.score);
  const result=[],seen=new Set();
  for(const {a} of ranked){
    const group=family(a.label);
    if(seen.has(group))continue;
    result.push(a);seen.add(group);
    if(result.length>=limit)break;
  }
  return result;
}
function random(seed){
  let state=2166136261;
  for(const c of seed)state=Math.imul(state^c.charCodeAt(0),16777619);
  return ()=>((state=Math.imul(1664525,state)+1013904223|0)>>>0)/4294967296;
}
async function groundTile(result,a){
  const art=await sprite(a);
  const sh=canvas(128,128),g=sh.getContext('2d');
  if(a.material){
    g.save();g.transform(64,32,-64,32,64,0);
    g.drawImage(art.out,0,art.side-art.h,art.w,art.h,0,0,1,1);g.restore();
  }else{
    const [l,t,r,b]=art.bounds;
    g.drawImage(art.out,l*art.side,t*art.side,(r-l)*art.side,(b-t)*art.side,0,0,128,Math.min(128,128*art.h/art.w));
  }
  result.sheets.push({name:a.pack.name+' · '+a.label,tw:128,margin:0,iso:1,url:sh.toDataURL()});
  return result.sheets.length-1;
}
// Read one tile for each compatible facade or roof role. Atlas offsets are retained.
function buildingParts(town){
  const index=new Map(town.ents.map(e=>[e.tiledLayer+':'+e.tile.idx,e]));
  const parts=(layer,ids)=>ids.map(id=>{
    const sprite=index.get(layer+':'+id);
    if(!sprite)throw Error('Thiếu mảnh tường hoặc mái tương thích của SBS Town.');
    return sprite;
  });
  return [
    {wallX:parts(1,[5,7]),wallY:parts(2,[7,8]),roof:parts(3,[4,5])},
    {wallX:parts(1,[0,2]),wallY:parts(2,[0,1]),roof:parts(3,[0,1])},
    {wallX:parts(1,[8,6]),wallY:parts(2,[6,5]),roof:parts(3,[7,7])}
  ];
}

function buildLot(kit,w,h,name,phase){
  const parts=[];
  const add=(art,x,y)=>parts.push({...art,id:parts.length,x,y});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)add(kit.roof[(x+y+phase)%2],x-2,y-2);
  for(let y=0;y<h;y++)add(kit.wallX[Number(y>0&&y<h-1)],w-1,y-1);
  for(let x=0;x<w;x++)add(kit.wallY[Number(x>0&&x<w-1)],x-1,h-1);
  return {name,w,h,parts};
}

function buildLots(town,profile,rng){
  const kits=buildingParts(town);
  const size=(min,max)=>min+Math.floor(rng()*(max-min+1));
  const limits={
    market:[['Nhà chợ',4,6,3,4],['Dãy quầy',4,6,2,2],['Nhà phố',2,4,2,4]],
    outpost:[['Nhà trạm',3,5,3,5],['Nhà kho',3,5,2,3],['Nhà ven đường',2,4,2,3]],
    trail:[['Nhà nghỉ',3,4,2,3],['Kho lâm trại',2,3,2,3],['Chòi rừng',2,2,2,2]]
  };
  const options=limits[profile];
  if(!options)throw Error('Kiểu màn không hợp lệ.');
  const phase=size(0,kits.length-1);
  return Array.from({length:12},(_,i)=>{
    const [name,minW,maxW,minH,maxH]=options[i<2?i:i%2?2:1];
    const kit=kits[i<3?(i+phase)%kits.length:size(0,kits.length-1)];
    return buildLot(kit,size(minW,maxW),size(minH,maxH),name,size(0,1));
  });
}

const sceneryProps=/^(?:barrel|crate|chest|cart|wagon|bench|rock|boulder|lamp|statue|ruong|thung|chum|lu_huong|kien-hang|den|ban|ghe|bon_cay)|(?:crate|barrel|chest)/i;

async function networkTile(result,pack,name){
  const path='png/'+name.toLowerCase()+'.png',asset={pack,path};
  if(!pack.files[path])throw Error('Thiếu mảnh đường hoặc bờ nước: '+name+'.');
  const src=await loadImage(asset);
  const out=canvas(128,128),g=out.getContext('2d');
  g.beginPath();g.moveTo(64,0);g.lineTo(128,32);g.lineTo(64,64);g.lineTo(0,32);g.closePath();g.clip();
  g.fillStyle=/water|river|bridge/.test(name)?'#91cbd9':'#91b950';g.fillRect(0,0,128,64);
  g.drawImage(src,0,0,src.width,src.height,0,0,128,src.height*128/src.width);
  const sid=result.sheets.length;
  result.sheets.push({name:'Tuyến cảnh · '+name,tw:128,margin:0,iso:1,url:out.toDataURL()});
  return sid;
}

async function prepareYard(result,pack,rng){
  const props=catalog(pack).filter(a=>a.layer===2&&sceneryProps.test(a.label)&&!structure.test(slug(a.label)));
  const ranked=props.map(a=>({a,n:rng()})).sort((a,b)=>a.n-b.n);
  const selected=[],seen=new Set();
  for(const {a} of ranked){
    if(seen.has(family(a.label)))continue;
    seen.add(family(a.label));
    try{
      const img=await sprite(a);
      selected.push(addSprite(result,{...a,tileWidth:a.native?a.tileWidth:Math.max(img.w/.65,img.h/.82),block:true},img));
    }catch{continue;}
    if(selected.length===4)break;
  }
  return selected;
}

export async function generateScene({ground,objects,seed,w,h,town,network,trees,style='river',profile='market'}){
  const rng=random(seed),r={name:settlementProfiles[profile]+' · '+seed,w,h,sheets:[],ents:[],ground:[],gaps:[]};
  const sizes=random(seed+'|nhà');
  const lots=buildLots(town,profile,sizes);
  const compact=buildingParts(town).map(kit=>buildLot(kit,2,2,'Nhà nhỏ',0));
  const placementRules={
    lots(route,bridge){
      const views=protectedViews(route,bridge);
      return (lot,x,y)=>lot.parts.every(e=>canSeeRoad({...e,x:x+e.x,y:y+e.y},views));
    }
  };
  let plan=planSettlement(w,h,[...lots,...compact],style,rng,profile,placementRules);
  for(let attempt=1;attempt<=6&&plan.buildings.length<2;attempt++){
    const alternative=planSettlement(w,h,[...lots,...compact],style,random(seed+'|'+attempt),profile,placementRules);
    if(alternative.buildings.length>plan.buildings.length)plan=alternative;
  }
  const tiles=new Map();
  async function tile(name){
    if(!tiles.has(name))tiles.set(name,await networkTile(r,network,name));
    return tiles.get(name);
  }
  const lawn=await tile('grass');
  let groundSid=lawn;
  if(ground!==network){
    for(const a of pickAssets(ground,0,rng,4)){
      try{groundSid=await groundTile(r,a);break;}catch{continue;}
    }
    if(groundSid===lawn)r.gaps.push('Gói nền đã chọn chưa có ô nền phù hợp. Cảnh dùng cỏ mặc định.');
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const name=settlementTile(plan,x,y,style,{raised:true});
    const bank=plan.water.has((x-1)+':'+y)||plan.water.has((x+1)+':'+y)||plan.water.has(x+':'+(y-1))||plan.water.has(x+':'+(y+1));
    r.ground[y*w+x]=name?await tile(name):bank?lawn:groundSid;
  }
  const base=r.sheets.length;
  r.sheets.push(...town.sheets);
  for(const [i,{x,y,lot}] of plan.buildings.entries()){
    r.ents.push(...lot.parts.map(e=>({...e,id:'building-'+i+'-'+e.id,name:lot.name+' '+(i+1)+' · '+e.name,
      x:x+e.x,y:y+e.y,settlementRole:'building',tile:{...e.tile,sid:e.tile.sid+base}})));
  }
  const views=protectedViews(plan.route,plan.bridge),houses=r.ents.map(artBounds);
  const lotsWithParts=plan.buildings.map(({x,y,lot},i)=>({id:'building-'+i+'-',x,y,w:lot.w,h:lot.h,parts:lot.parts.map(e=>[e.x,e.y,e.tiledLayer])}));
  const grove=[];
  for(const path of Object.keys(trees.files)){
    if(!isImage(path))continue;
    const label=stem(path),a={pack:trees,path,label:/bush/.test(label)?'Bụi cây':'Cây · '+label,layer:2,block:true};
    const art=await sprite(a),height=/bush/.test(label)?.64:1.8+rng()*.55;
    grove.push(addSprite(r,{...a,tileWidth:art.h/height},art));
  }
  if(!grove.length)throw Error('Không nạp được bộ cây cho cảnh.');
  let planted=0;
  for(const [i,cells] of plan.groves.entries()){
    const placed=[];
    for(const [j,[x,y]] of cells.entries()){
      const first=Math.floor(rng()*grove.length);
      for(let k=0;k<grove.length;k++){
        const a=grove[(first+k)%grove.length];
        const e={...entity(a,x+.5,y+.5,0,'grove-'+i+'-'+j),settlementRole:'tree'};
        if(!canSeeRoad(e,views)||overlapsHouseArt(e,houses)||canopyTouchesLot(e,lotsWithParts))continue;
        placed.push(e);break;
      }
    }
    if(placed.length>=4){r.ents.push(...placed);planted++;}
  }
  const props=await prepareYard(r,objects,rng);
  if(!props.length)r.gaps.push('Gói vật thể đã chọn chưa có đạo cụ phù hợp cho sân.');
  for(const [i,cells] of plan.yards.entries())for(const [j,[x,y]] of cells.entries()){
    if(!props.length)continue;
    r.ground[y*w+x]=await tile('dirt');
    const e={...entity(props[(i+j)%props.length],x+.5,y+.5,0,'yard-'+i+'-'+j),settlementRole:'yard'};
    if(canSeeRoad(e,views)&&!overlapsHouseArt(e,houses))r.ents.push(e);
  }
  r.blocked=plan.blocked;
  r.ents.push({id:'start',t:'start',name:'Xuất phát',x:plan.start[0],y:plan.start[1]},
    {id:'goal',t:'goal',name:'Đích',x:plan.goal[0],y:plan.goal[1]});
  if(plan.buildings.length<2)r.gaps.push('Bản nháp cần ít nhất hai nhà. Tăng kích thước hoặc đổi mã.');
  const inspection={route:plan.route,accesses:plan.accesses,bridge:plan.bridge,
    lots:lotsWithParts,
    water:[...plan.water].map(k=>k.split(':').map(Number)).filter(([,y])=>y>=0&&y<h)};
  r.summary={buildings:plan.buildings.length,groves:planted,bridges:plan.bridge?1:0,style,profile,seed,plan:inspection};
  r.summary.draft=settlementIssues({w,h,ents:r.ents,blk:r.blocked,cfg:{settlement:r.summary}}).length>0;
  return r;
}
