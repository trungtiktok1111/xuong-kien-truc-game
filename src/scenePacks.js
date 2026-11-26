import {referencePlan,farmBarn,cityBuilding,cityBuildings} from './stockScenes.js';
import {mapCollision} from './mapCollision.js';
import {decoZones,zonesHit} from './zones.js';
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
  let hasModels=false;
  const raw=unzipSync(bytes,{filter:e=>{
    if(/(^|\/)(__MACOSX|\._)/.test(e.name))return false;
    if(/\.(glb|gltf|fbx|obj|blend)$/i.test(e.name))hasModels=true;
    return e.originalSize<=24_000_000&&/\.(json|tmx|tsx|png|jpe?g|webp)$/i.test(e.name);
  }});
  const files=Object.fromEntries(Object.entries(raw).map(([path,data])=>[norm(path),data]));
  const paths=Object.keys(files);
  const metadata=readJSON(files,paths.find(p=>/(^|\/)manifest\.json$/.test(p)));
  const scene=readJSON(files,paths.find(p=>/(^|\/)(canh-mau|ban-do)\.json$/.test(p)));
  return {name,bytes,files,paths,metadata,scene,hasModels,
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

const miniatureAsset=(pack,name,dir)=>({
  pack,path:'isometric/'+name.toLowerCase()+'_'+dir.toLowerCase()+'.png',label:name+' '+dir,
  layer:2,tileWidth:256,native:true,anchor:[128,437,1],direction:dir
});

async function miniatureFloor(result,pack,name){
  const asset=name.includes('/')?{pack,path:norm(name)}:miniatureAsset(pack,name,'E');
  if(!pack.files[asset.path])throw Error('Thiếu ô nền '+name+' trong '+pack.name+'.');
  const image=await loadImage(asset);
  const art=crop(image,[0,0,image.width,image.height],null,true);
  if(!art)throw Error('Không đọc được ô nền '+name+'.');
  const c=canvas(128,128),g=c.getContext('2d');
  g.beginPath();g.moveTo(64,0);g.lineTo(128,32);g.lineTo(64,64);g.lineTo(0,32);g.closePath();g.clip();
  const [l,t]=art.bounds;
  g.drawImage(art.out,l*art.side,t*art.side,art.w,art.h,0,0,128,art.h*128/art.w);
  result.sheets.push({name:pack.name+' · Nền '+name,tw:128,margin:0,iso:1,url:c.toDataURL()});
  return result.sheets.length-1;
}

const walls={E:[-.5,-.5,0,1],S:[-.5,-.5,1,0],W:[.5,-.5,0,1],N:[-.5,.5,1,0]};
function wallSegments(dir,open){
  const [x,y,dx,dy]=walls[dir];
  return (open?[[0,.125],[.875,1]]:[[0,1]]).map(([a,b])=>({
    k:'seg',a:[x+dx*a,y+dy*a],b:[x+dx*b,y+dy*b],th:.07
  }));
}

async function miniaturePiece(result,packs,p,cache,folder=''){
  const key=p.source+'|'+p.asset+'|'+p.dir;
  if(!cache.has(key)){
    const classic=p.asset.includes('/');
    const asset=classic?{pack:packs[p.source],path:norm(p.asset),label:stem(p.asset),layer:2,
      tileWidth:132,native:true,direction:p.dir}:miniatureAsset(packs[p.source],p.asset,p.dir);
    asset.path=folder+asset.path;
    if(!asset.pack.files[asset.path])throw Error('Thiếu mảnh '+p.asset+' · '+p.dir+'.');
    if(classic){
      const image=await loadImage(asset),width=image.width,height=image.height;
      const centerY=/buildingtiles/i.test(p.asset)?height-(p.stack?33:68):height-4;
      const art=crop(image,[0,0,width,height],[width/2,centerY,1]);
      if(!art)throw Error('Ảnh trống '+p.asset);
      cache.set(key,addSprite(result,asset,art));
    }else cache.set(key,addSprite(result,asset,await sprite(asset)));
  }
  const a={...cache.get(key),layer:p.roof?3:2,block:p.solid};
  const e=entity(a,p.x+.5,p.y+.5,p.z,'scene-'+result.ents.length);
  if(p.wall){e.col=wallSegments(p.dir,p.open);e.walk=false;}
  return e;
}

function referenceCanWalk(scene,start,goal){
  const {w,h}=scene,collision=mapCollision({w,h,blk:scene.blocked});
  const zones=decoZones(scene.ents),free=(x,y)=>collision.free(x,y,.28)&&!zonesHit(zones,x,y,.28);
  const list=[start],seen=new Set([start.join(':')]);
  if(!free(start[0]+.5,start[1]+.5))return false;
  for(let i=0;i<list.length;i++){
    const [x,y]=list[i];
    if(x===goal[0]&&y===goal[1])return true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const a=x+dx,b=y+dy,key=a+':'+b;
      if(seen.has(key)||![.25,.5,.75,1].every(t=>free(x+.5+dx*t,y+.5+dy*t)))continue;
      seen.add(key);list.push([a,b]);
    }
  }
  return false;
}

export async function buildReferenceScene(id,packs){
  const plan=referencePlan(id);
  if(!plan)throw Error('Chưa có cảnh ráp cho gói này.');
  const {w,h,name,parts,blocks,start,goal}=plan;
  const scene={w,h,name,ents:[],sheets:[],ground:[],gaps:[],blocked:new Array(w*h).fill(0)};
  const floors=new Map();
  for(const floor of plan.ground){
    const {asset,source=0}=typeof floor==='string'?{asset:floor}:floor,key=source+'|'+asset;
    if(!floors.has(key))floors.set(key,await miniatureFloor(scene,packs[source],asset));
    scene.ground.push(floors.get(key));
  }
  const cache=new Map();
  for(const p of parts){
    const e=await miniaturePiece(scene,packs,p,cache);
    scene.ents.push(e);
  }
  for(const [x,y,width,depth] of blocks)
    for(let b=y;b<y+depth;b++)for(let a=x;a<x+width;a++)scene.blocked[b*w+a]=1;
  if(!referenceCanWalk(scene,start,goal))throw Error(name+' chưa có lối đi tới đích.');
  scene.ents.push({id:'start',t:'start',name:'Xuất phát',x:start[0],y:start[1]},
    {id:'goal',t:'goal',name:'Đích',x:goal[0],y:goal[1]});
  return scene;
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
function catalog(pack,{outline=false}={}){
  const flatImage=/isometric-(?:city|landscape)/i.test(pack.name)&&Object.keys(pack.files).find(p=>
    /(^|\/)(?:citytiles_066|landscapetiles_010)\.png$/i.test(p));
  if(flatImage)return [{pack,path:flatImage,label:stem(flatImage),layer:0,flatTop:true}];

  if(pack.metadata?.assets&&pack.metadata.projection)return Object.keys(pack.metadata.assets).flatMap(id=>{
    const a=nativeAsset(pack,id);
    if(!a||/(?:[_-])[nsw]$/i.test(id)||(!outline&&a.layer===1)||a.layer===3||structure.test(slug(id)))return [];
    return [a];
  });
  const isoPath=path=>outline?/(^|\/)isometric\//.test(path):path.startsWith('isometric/');
  const hasIso=pack.paths.some(isoPath);
  return pack.paths.filter(path=>isImage(path)&&!ignored.test(path)&&(!hasIso||isoPath(path))).flatMap(path=>{
    const name=stem(path);
    if(hasIso&&/[_-][nsw]$/i.test(name))return [];
    const info=classifyArchiveImage(pack.name,path,pack.tsx,[]);
    if(info.kind==='reference'||info.kind==='model')return [];
    if(/tile toolkit/i.test(pack.name)&&!/^bricks/.test(name.toLowerCase()))return [];
    if(info.kind==='layer'||/roof|mai[_-]/.test(slug(name)))return [];
    const grid=info.recipes[0];
    const material=info.kind==='material'||/tile toolkit/i.test(pack.name)||(outline&&grid?.groundTexture);
    if(/textures - wall|crate textures/i.test(pack.name))return [];
    const ground=/^(?:dirt|dirtfarmland|stone|stoneuneven|floor)_e$/i.test(name)||material||info.kind==='terrain'||(groundName.test(path)||groundName.test(name))&&!structure.test(slug(name));
    if(ground&&/water|river|thac|overworld - forest/i.test(name))return [];
    const role=ground?0:2;
    return [{pack,path,label:name,layer:role,recipe:grid,material,tileWidth:grid?.width,block:role===2}];
  });
}
function pickAssets(pack,layer,rng,limit=6){
  const src=catalog(pack),pool=src.filter(a=>a.layer===layer);
  const ranked=pool.map(a=>({a,score:rng()+(/flat|grass|stone|ground|duong|wood|crate|barrel|wall|house|building|tree|^dirt_e$|^stone_e$/i.test(a.label)?.8:0)+(/^square/.test(a.label)?1:0)-(/high|float/.test(a.label)?2:0)}))
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
// Undo the 2:1 projection before resizing the surface in map coordinates.
function outlineFloorTexture(diamond,scale,matchJoints,brickGrid){
  const sourceSize=diamond.width,surface=canvas(sourceSize,sourceSize),g=surface.getContext('2d');
  g.setTransform(1,-1,2,2,-sourceSize/2,sourceSize/2);
  g.drawImage(diamond,0,0);
  const size=128,tile=canvas(size,size),ctx=tile.getContext('2d');
  const width=sourceSize/scale,inset=scale===1?5:0,center=(sourceSize-width)/2;
  const brick=sourceSize/brickGrid;
  const start=brickGrid?Math.round(center/brick)*brick:center;
  ctx.drawImage(surface,start+inset,start+inset,width-2*inset,width-2*inset,0,0,size,size);
  if(matchJoints){
    const texture=ctx.getImageData(0,0,size,size),pixels=texture.data,blend=4;
    const join=(a,b,offset)=>{
      for(let channel=0;channel<4;channel++){
        const i=a*4+channel,j=b*4+channel;
        const correction=(pixels[j]-pixels[i])*(1-offset/blend)/2;
        pixels[i]+=correction;pixels[j]-=correction;
      }
    };
    for(let depth=0;depth<blend;depth++)for(let n=0;n<size;n++)
      join(n*size+depth,n*size+size-1-depth,depth);
    for(let depth=0;depth<blend;depth++)for(let n=0;n<size;n++)
      join(depth*size+n,(size-1-depth)*size+n,depth);
    ctx.putImageData(texture,0,0);
  }
  return tile;
}

async function groundTile(result,a,style){
  const art=await sprite(a);
  const scale=style?.floorScale||1,matchJoints=!!style?.matchJoints;
  const flat=scale!==1||matchJoints;
  const size=flat?256:128,sh=canvas(size,size),g=sh.getContext('2d');
  if(flat)g.scale(2,2);
  if(a.material){
    g.save();g.transform(64,32,-64,32,64,0);
    g.drawImage(art.out,art.bounds[0]*art.side,art.side-art.h,art.w,art.h,0,0,1,1);g.restore();
  }else{
    if(a.flatTop){
      g.beginPath();g.moveTo(64,0);g.lineTo(128,32);g.lineTo(64,64);g.lineTo(0,32);g.closePath();g.clip();
      if(a.underlay){g.fillStyle=a.underlay;g.fillRect(0,0,128,64);}
    }
    const [l,t,r,b]=art.bounds;
    g.drawImage(art.out,l*art.side,t*art.side,(r-l)*art.side,(b-t)*art.side,0,0,128,Math.min(128,128*art.h/art.w));
  }
  const texture=flat?outlineFloorTexture(sh,scale,matchJoints,a.brickGrid):sh;
  const label=a.label+(scale!==1?' · '+scale+'×':'')+(matchJoints?' · Tự khớp mạch':'');
  result.sheets.push({name:a.pack.name+' · '+label,tw:128,margin:0,iso:flat?0:1,url:texture.toDataURL()});
  return result.sheets.length-1;
}
export function outlineMiniatureFolder(pack,profile){
  const [id,floor,props]=profile;
  const names=[floor,...props,...(id==='dungeon'?['stoneWall']:[])];
  const floorPath='isometric/'+floor.toLowerCase()+'_e.png';
  for(const path of pack.paths){
    if(path!==floorPath&&!path.endsWith('/'+floorPath))continue;
    const folder=path.slice(0,-floorPath.length);
    if(names.every(name=>pack.files[folder+'isometric/'+name.toLowerCase()+'_e.png']))return folder;
  }
  return null;
}

// Rectify the long sandstone face so it can follow curved outlines and gates.
async function outlineWallMaterial(result,pack,path,wood=false){
  const source=await loadImage({pack,path});
  const tile=canvas(128,128),g=tile.getContext('2d');
  const [left,top,width,height]=wood?[25,302,98,130]:[35,306,120,144];
  const scaleX=tile.width/width,scaleY=tile.height/height;
  g.setTransform(scaleX,scaleY/2,0,scaleY,-left*scaleX,-(top+left/2)*scaleY);
  g.drawImage(source,0,0);
  const label=stem(path);
  const name=pack.name+' · Mặt tường '+label;
  result.sheets.push({name,tw:128,margin:0,url:tile.toDataURL('image/png')});
  result.walls.push({sid:result.sheets.length-1,id:path,label,source:pack.name});
}

// Profiles may supply exact roles for any ZIP. Otherwise use recognized floor
// tiles and small props from the existing archive catalogue.
export async function outlinePackMaterials(pack,profile,style){
  const result={sheets:[],floors:[],overlays:[],props:[],houses:[],walls:[],source:pack.name};
  const file=pack.paths.find(path=>/(^|\/)outline-materials\.json$/.test(path));
  const settings=file?readJSON(pack.files,file):null;
  const folder=file?file.slice(0,file.lastIndexOf('/')+1):'';
  const named=(row,layer)=>{
    if(typeof row==='string')row={path:row};
    const path=typeof row?.path==='string'?norm(folder+row.path):'';
    if(!isImage(path)||!pack.files[path])throw Error('Thiếu ảnh '+(row?.path||'')+' trong '+pack.name+'.');
    const anchor=row.anchor;
    if(anchor!==undefined&&(!Array.isArray(anchor)||anchor.length!==2||!anchor.every(Number.isFinite)))
      throw Error('Điểm neo mảnh '+row.path+' cần hai tọa độ pixel.');
    if(row.tileWidth!==undefined&&(!Number.isFinite(row.tileWidth)||row.tileWidth<1))
      throw Error('tileWidth không hợp lệ cho '+row.path+'.');
    return {pack,path,label:row.name||stem(path),anchor,tileWidth:row.tileWidth,layer,
      material:row.shape==='square',flatTop:true};
  };
  if(file&&(!settings||settings.version!==1||
    ![settings.floors??[],settings.props??[],settings.overlays??[],settings.walls??[]].every(Array.isArray)))
    throw Error('outline-materials.json trong '+pack.name+' cần version 1 và các danh sách mảnh.');
  const ignoredAssets=[];
  const attempt=async(a,read)=>{
    try{await read(a);}catch{ignoredAssets.push(a.path);}
  };
  async function squareWall(a){
    const image=await loadImage(a);
    if(image.width!==image.height)throw Error('Mặt tường cần ảnh vuông.');
    const surface=canvas(128,128);
    surface.getContext('2d').drawImage(image,0,0,128,128);
    result.sheets.push({name:pack.name+' · Mặt tường '+a.path,tw:128,margin:0,url:surface.toDataURL('image/png')});
    result.walls.push({sid:result.sheets.length-1,id:a.path,label:a.label,source:pack.name});
  }
  let floors,props,overlays=[];
  if(settings){
    floors=(settings.floors||[]).map(row=>named(row,0));
    props=(settings.props||[]).map(row=>named(row,2));
    overlays=(settings.overlays||[]).map(row=>named(row,1));
    for(const row of settings.walls||[])await attempt(named(row,2),squareWall);
  }else if(profile){
    const [,floor,extras]=profile,root=outlineMiniatureFolder(pack,profile);
    if(root===null)throw Error('Thiếu mảnh isometric của '+pack.name+'.');
    const path=id=>root+'isometric/'+id.toLowerCase()+'_e.png';
    const tile=named(path(floor),0);
    if(profile[0]==='dungeon')tile.brickGrid=4;
    if(floor==='floorCarpet')tile.underlay='#5a473d';
    floors=[tile];
    props=extras.map(id=>named({path:path(id),anchor:[128,437],tileWidth:256},2));
    if(profile[0]==='dungeon'){
      for(const id of ['stoneTile','stoneUneven','dirt','dirtTiles','planks'])
        if(pack.files[path(id)])floors.push(named(path(id),0));
      for(const id of ['stoneWall','stoneWallAged'])if(pack.files[path(id)])
        await attempt({path:path(id)},a=>outlineWallMaterial(result,pack,a.path));
    }
    if(profile[0]==='farm'){
      if(pack.files[path('planksOld')])floors.push(named(path('planksOld'),0));
      if(pack.files[path('dirt')])floors.push(named(path('dirt'),0));
      if(pack.files[path('dirtFarmland')])overlays.push(named(path('dirtFarmland'),1));
      if(pack.files[path('woodWall')])await attempt({path:path('woodWall')},a=>outlineWallMaterial(result,pack,a.path,true));
    }
    if(profile[0]==='library')for(const id of [floor,'floorCarpetEnd','floorCarpetSmall']){
      if(pack.files[path(id)])overlays.push(named(path(id),1));
    }
    const objects=/^(?:barrel|woodencrate|woodenpile|chest|chair|table|stonecolumn|corn|hay|sack|bookcase|bookstand|candlestand|displaycase|librarychair|longtable)/i;
    for(const a of catalog(pack,{outline:true})){
      if(a.path.startsWith(root+'isometric/')&&/^(?:base|square)_(?:grass|dirt|stone|wood|snow)_(?:flat|detail)_e$/i.test(a.label)&&!floors.some(f=>f.path===a.path))floors.push(named(a.path,0));
      if(a.path.startsWith(root+'isometric/')&&objects.test(a.label)&&!props.some(p=>p.path===a.path))
        props.push(named({path:a.path,anchor:[128,437],tileWidth:256},2));
    }
  }else{
    const assets=catalog(pack,{outline:true}).filter(a=>!pack.hasModels||a.native||/(^|\/)(isometric|sprites)\//i.test(a.path));
    const sbsWall=/sbs.*textures[- ]+wall/i.test(pack.name);
    const wallPaths=pack.hasModels?[]:pack.paths.filter(path=>isImage(path)&&!ignored.test(path)&&
      (sbsWall&&/^wall[-_]/i.test(stem(path))||/^(?:wall[-_ ]?texture|texture[-_ ]?wall|tuong[-_ ]?vat[-_ ]?lieu)/i.test(slug(stem(path)))));
    for(const path of wallPaths)await attempt({pack,path,label:stem(path)},squareWall);
    if(pack.hasModels&&!assets.length){
      result.skipReason='gói mô hình 3D, chưa có mảnh phù hợp cho Đường Bao 2D';
      return result;
    }
    overlays=assets.filter(a=>a.layer===1||/^(?:overlay|rug|carpet|floorcarpet|mat)[a-z0-9 _-]*$/i.test(a.label));
    floors=assets.filter(a=>!overlays.includes(a)&&a.layer===0&&!/high|float|stairs|water|river|sea|lake|corner|cliff|transition/i.test(a.label))
      .map(a=>({...a,flatTop:true}));
    props=assets.filter(a=>a.layer===2&&!overlays.includes(a)&&(a.native||
      /^(?:barrel|crate|chest|chair|bookstand|lamp|statue|ruong|thung|chum|den|table|bench|hay|sack|plant|tree|bush)/i.test(stem(a.path))));
  }
  for(const a of floors)await attempt(a,async()=>{
    const sid=await groundTile(result,a,style);
    result.floors.push({sid,id:a.path,label:a.label,source:pack.name});
  });
  for(const a of overlays)await attempt(a,async()=>{
    const sid=await groundTile(result,{...a,layer:0,flatTop:true});
    result.overlays.push({sid,id:a.path,label:a.label,source:pack.name});
  });
  for(const a of props)await attempt(a,async()=>{
    const art=await sprite(a);
    const tileWidth=Math.max(a.tileWidth||1,art.w/.95,art.h/1.65);
    const radius=Math.max(.22,Math.min(.46,art.w/tileWidth*.55));
    const piece=addSprite(result,{...a,tileWidth,collision:{shape:'circle',radius}},art);
    result.props.push({sid:piece.sid,id:a.path,label:a.label,source:pack.name,radius,create:(x,y,id)=>({...entity(piece,x,y,0,id),outlineAutoProp:true})});
  });
  // Only assemble structural parts when a complete calibrated kit is present.
  const farmFloor=pack.paths.find(path=>/(^|\/)isometric\/planks_e\.png$/.test(path));
  if(farmFloor){
    const folder=farmFloor.slice(0,-'isometric/planks_e.png'.length);
    const cache=new Map();
    for(const [w,h] of [[2,3],[1,3],[2,4]]){
      const parts=farmBarn(0,0,w,h).map(p=>p.asset==='woodWallDoorClosed'?
        {...p,asset:'woodWallDoorway',open:true}:p);
      if(!parts.every(p=>pack.files[folder+miniatureAsset(pack,p.asset,p.dir).path]))continue;
      const ents=[],assembly={sheets:result.sheets,ents};
      for(const part of parts)ents.push(await miniaturePiece(assembly,[pack],part,cache,folder));
      result.houses.push({w,h,ents,id:`barn-${w}x${h}`,label:`Nhà gỗ ${w} × ${h} ô`,source:pack.name});
    }
  }
  result.wallMaterial=result.sheets[result.walls[0]?.sid]?.name;
  if(ignoredAssets.length)result.assetWarning=`${ignoredAssets.length} ảnh không đọc được hoặc sai dạng`;
  return result;
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

const sceneryProps=/^(?:barrel|crate|chest|cart|wagon|bench|rock|boulder|lamp|statue|ambulance|car|truck|hay|sack|ladder|barrels|woodencrate|displaycase|bookstand|candlestand|table|longtable|chair|ruong|thung|chum|lu_huong|kien-hang|den|ban|ghe|bon_cay)|(?:crate|barrel|chest)/i;

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

export async function generateScene({ground,objects,seed,w,h,town,farm,city,network,trees,style='river',profile='market'}){
  const rng=random(seed),r={name:settlementProfiles[profile]+' · '+seed,w,h,sheets:[],ents:[],ground:[],gaps:[]};
  const sizes=random(seed+'|nhà');
  const lots=town?buildLots(town,profile,sizes):[];
  const compact=town?buildingParts(town).map(kit=>buildLot(kit,2,2,'Nhà nhỏ',0)):[];
  const kits=new Map();
  async function includeKit(pack,key,name,build){
    if(!pack)return;
    const local={sheets:[],ents:[]},cache=new Map(),additions=[];
    for(let i=0;i<8;i++){
      const {w,h,recipe}=build(i),parts=[];
      for(const p of recipe){
        const e=await miniaturePiece(local,[pack],p,cache);
        e.id=parts.length;
        e.tiledLayer??=2;
        parts.push(e);
      }
      additions.push({name,w,h,parts,source:key});
    }
    kits.set(key,{sheets:local.sheets,name:pack.name});
    if(lots.length)lots.splice(0,lots.length,...lots.flatMap((lot,i)=>additions[i]?[additions[i],lot]:[lot]));
    else lots.push(...additions);
    compact.push(additions[0]);
  }
  await includeKit(farm,'farm','Nhà gỗ Farm',i=>{
    const w=i%3===0?1:2,h=2+Math.floor(sizes()*3);
    return {w,h,recipe:farmBarn(0,0,w,h)};
  });
  await includeKit(city,'city','Nhà phố Kenney',i=>{
    const index=(i+Math.floor(sizes()*cityBuildings.length))%cityBuildings.length;
    return {w:1,h:1,recipe:cityBuilding(0,0,...cityBuildings[index])};
  });
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
  const sources=new Set([network.name,trees.name]);
  const terrain=[];
  for(const pack of Array.isArray(ground)?ground:[ground]){
    if(pack===network){terrain.push(lawn);continue;}
    const start=r.sheets.length;
    for(const a of pickAssets(pack,0,rng,4)){
      try{
        terrain.push(await groundTile(r,a));
        sources.add(pack.name);break;
      }catch{continue;}
    }
    if(r.sheets.length===start)r.gaps.push('Chưa có ô nền phù hợp trong '+pack.name+'.');
  }
  if(!terrain.length)terrain.push(lawn);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const name=settlementTile(plan,x,y,style,{raised:true});
    const bank=plan.water.has((x-1)+':'+y)||plan.water.has((x+1)+':'+y)||plan.water.has(x+':'+(y-1))||plan.water.has(x+':'+(y+1));
    const zone=Math.min(terrain.length-1,Math.floor(x*terrain.length/w));
    r.ground[y*w+x]=name?await tile(name):bank?lawn:terrain[zone];
  }
  const townBase=r.sheets.length;
  if(town)r.sheets.push(...town.sheets);
  for(const kit of kits.values()){
    kit.base=r.sheets.length;r.sheets.push(...kit.sheets);
  }
  for(const [i,{x,y,lot}] of plan.buildings.entries()){
    const kit=kits.get(lot.source),base=kit?.base??townBase;
    r.ents.push(...lot.parts.map(e=>({...e,id:'building-'+i+'-'+e.id,name:lot.name+' '+(i+1)+' · '+e.name,
      x:x+e.x,y:y+e.y,settlementRole:'building',walk:true,tile:{...e.tile,sid:e.tile.sid+base}})));
    sources.add(kit?.name??'SBS Town');
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
  const props=[];
  for(const pack of Array.isArray(objects)?objects:[objects]){
    const variants=await prepareYard(r,pack,rng);
    if(variants.length)props.push(variants);
    else r.gaps.push('Chưa có đạo cụ sân tương thích trong '+pack.name+'.');
  }
  if(!props.length)r.gaps.push('Gói vật thể đã chọn chưa có đạo cụ phù hợp cho sân.');
  for(const [i,cells] of plan.yards.entries())for(const [j,[x,y]] of cells.entries()){
    if(!props.length)continue;
    r.ground[y*w+x]=await tile('dirt');
    const group=props[(i*4+j)%props.length],art=group[(i+j)%group.length];
    const e={...entity(art,x+.5,y+.5,0,'yard-'+i+'-'+j),settlementRole:'yard'};
    if(canSeeRoad(e,views)&&!overlapsHouseArt(e,houses)){r.ents.push(e);sources.add(art.pack.name);}
  }
  r.blocked=plan.blocked;
  r.ents.push({id:'start',t:'start',name:'Xuất phát',x:plan.start[0],y:plan.start[1]},
    {id:'goal',t:'goal',name:'Đích',x:plan.goal[0],y:plan.goal[1]});
  if(plan.buildings.length<2)r.gaps.push('Bản nháp cần ít nhất hai nhà. Tăng kích thước hoặc đổi mã.');
  const inspection={route:plan.route,accesses:plan.accesses,bridge:plan.bridge,
    lots:lotsWithParts,
    water:[...plan.water].map(k=>k.split(':').map(Number)).filter(([,y])=>y>=0&&y<h)};
  r.summary={buildings:plan.buildings.length,groves:planted,bridges:plan.bridge?1:0,style,profile,seed,sources:[...sources],plan:inspection};
  r.summary.draft=settlementIssues({w,h,ents:r.ents,blk:r.blocked,cfg:{settlement:r.summary}}).length>0;
  return r;
}
