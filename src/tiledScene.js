import {unzipSync} from 'fflate';
import {readTileset,clearSheetColor,tileFrames} from './archiveCatalog.js';

const text=new TextDecoder();
const leaf=path=>path.split('/').at(-1);
const folder=path=>path.slice(0,path.lastIndexOf('/')+1);
const key=path=>{
  const parts=[];
  for(const part of path.replaceAll('\\','/').toLowerCase().split('/')){
    if(part==='..')parts.pop();
    else if(part&&part!=='.')parts.push(part);
  }
  return parts.join('/');
};
const integer=(el,field,fallback=0)=>Number(el.getAttribute(field)??fallback);
const xml=(bytes,tag,name)=>{
  const node=new DOMParser().parseFromString(text.decode(bytes),'application/xml').documentElement;
  if(node.localName!==tag)throw Error('Tệp '+name+' không hợp lệ.');
  return node;
};
const surface=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});

export function readTiledScene(files,mapPath,aliases={}){
  const m=xml(files.get(mapPath),'map',mapPath),w=integer(m,'width'),h=integer(m,'height'),tileWidth=integer(m,'tilewidth');
  if(m.getAttribute('orientation')!=='isometric'||integer(m,'infinite')||tileWidth!==2*integer(m,'tileheight')||
    ![w,h,tileWidth].every(n=>Number.isInteger(n)&&n>0&&n<=600))
    throw Error('Cần bản đồ Tiled isometric hữu hạn có ô tỉ lệ 2:1.');
  const tilesets=[...m.children].filter(el=>el.localName==='tileset').map(el=>{
    const source=el.getAttribute('source'),path=source&&key(folder(mapPath)+source),first=integer(el,'firstgid');
    if(path&&!files.has(path))throw Error('Thiếu tệp '+source+'.');
    if(!path)throw Error('Hãy xuất bộ ô Tiled thành tệp TSX riêng.');
    const spec=readTileset(path,text.decode(files.get(path)));
    if(!spec||!first)throw Error('Bộ ô '+source+' không hợp lệ.');
    return {...spec,first,image:aliases[spec.path]||spec.path};
  }).sort((a,b)=>b.first-a.first);
  const pieces=[];
  let order=0;
  function layers(node,dx=0,dy=0){
    for(const l of node.children){
      if(l.getAttribute('visible')==='0')continue;
      const x=dx+integer(l,'offsetx'),y=dy+integer(l,'offsety');
      if(l.localName==='group'){layers(l,x,y);continue;}
      if(['objectgroup','imagelayer'].includes(l.localName))
        throw Error('Màn này có lớp đối tượng hoặc lớp ảnh. Hãy xuất các lớp cần dựng thành lớp ô.');
      if(l.localName!=='layer')continue;
      const name=l.getAttribute('name')||'Lớp '+(order+1),data=l.querySelector('data');
      if(data?.getAttribute('encoding')!=='csv'||integer(l,'width')!==w||integer(l,'height')!==h)
        throw Error('Lớp '+name+' cần dữ liệu CSV và cùng kích thước với bản đồ.');
      const ids=data.textContent.trim().split(',').map(Number);
      if(ids.length!==w*h||ids.some(id=>!Number.isSafeInteger(id)||id<0||id>0xffffffff))
        throw Error('Dữ liệu ô sai trong lớp '+name+'.');
      const layer=/roof|mái/i.test(name)?3:/ground|floor|nền|sàn/i.test(name)?0:2;
      ids.forEach((id,i)=>{
        const gid=id&0x0fffffff;
        if(!gid)return;
        if(id&0x30000000)throw Error('Lớp '+name+' dùng phép xoay ô chưa hỗ trợ.');
        const spec=tilesets.find(t=>t.first<=gid);
        if(!spec||spec.count&&gid-spec.first>=spec.count)throw Error('Không tìm thấy ô '+gid+' trong '+name+'.');
        pieces.push({spec,idx:gid-spec.first,flags:id>>>30,x:i%w+integer(l,'x'),y:Math.floor(i/w)+integer(l,'y'),dx:x,dy:y,layer,order,name});
      });
      order++;
    }
  }
  layers(m);
  if(!pieces.length)throw Error('Bản đồ không có mảnh ghép hiển thị.');
  if(pieces.length>12000)throw Error('Bản đồ vượt 12.000 mảnh. Hãy chia thành các màn nhỏ hơn.');
  return {w,h,tileWidth,pieces};
}

function atlasSprite(atlas,source,frame,flags,idx){
  const [sx,sy,w,h]=frame,side=atlas.tw,sprite=surface(w,h),paint=sprite.getContext('2d');
  paint.translate(flags&2?w:0,flags&1?h:0);
  paint.scale(flags&2?-1:1,flags&1?-1:1);
  paint.drawImage(source,sx,sy,w,h,0,0,w,h);
  const data=paint.getImageData(0,0,w,h).data;
  let l=w,t=h,r=0,b=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>16){
    l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);
  }
  const left=Math.floor((side-w)/2),top=side-h;
  atlas.canvas.getContext('2d').drawImage(sprite,(idx%8)*side+left,Math.floor(idx/8)*side+top);
  const bounds=l<r?[(left+l)/side,(top+t)/side,(left+r)/side,(top+b)/side]:[0,0,1,1];
  return {bounds,centerCorrection:(side-w)/2-left};
}

export async function buildTiledScene(archives,{sample=false}={}){
  const files=new Map();
  for(const bytes of archives){
    const entries=unzipSync(bytes,{filter:e=>/\.(tmx|tsx|png|jpe?g|webp)$/i.test(e.name)&&!/(^|\/)(__MACOSX|\._)/.test(e.name)});
    for(const [path,data] of Object.entries(entries))files.set(key(path),data);
  }
  const maps=[...files.keys()].filter(path=>path.endsWith('.tmx'));
  if(maps.length!==1)throw Error('Gói dựng cảnh cần đúng một tệp bản đồ .tmx.');
  const aliases=sample?{
    'building tiles/town-buildings_01-64x96.png':'building tiles/isometric buildings 1 - 64x96.png',
    'roof tiles/town-roofing_01-143x92.png':'roof tiles/isometric town roofing - 143x92.png'
  }:{};
  const plan=readTiledScene(files,maps[0],aliases),sheets=[],ents=[],images=new Map();
  const bySpec=new Map();
  for(const piece of plan.pieces){
    if(!bySpec.has(piece.spec))bySpec.set(piece.spec,[]);
    bySpec.get(piece.spec).push(piece);
  }
  for(const [spec,pieces] of bySpec){
    if(!files.has(spec.image))throw Error('Thiếu ảnh '+spec.path+'.');
    if(!images.has(spec.image+'|'+spec.color)){
      const image=await createImageBitmap(new Blob([files.get(spec.image)]));
      if(image.width*image.height>16000000){image.close();throw Error('Ảnh bộ ô vượt 16 triệu điểm ảnh.');}
      const canvas=surface(image.width,image.height);
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(image,0,0);image.close();
      clearSheetColor(ctx,canvas.width,canvas.height,spec.color);
      images.set(spec.image+'|'+spec.color,canvas);
    }
    const source=images.get(spec.image+'|'+spec.color),frames=tileFrames(spec,source.width,source.height);
    const variants=[...new Map(pieces.map(p=>[p.idx+':'+p.flags,p])).values()];
    const side=Math.max(spec.width,spec.height);
    if(side>512||variants.length>512)throw Error('Bộ ô '+spec.name+' quá lớn.');
    const sprites=new Map();
    for(let start=0;start<variants.length;start+=64){
      const batch=variants.slice(start,start+64),atlas={tw:side,canvas:surface(8*side,Math.ceil(batch.length/8)*side)};
      const sid=sheets.length;
      batch.forEach(({idx,flags},i)=>{
        if(!frames[idx])throw Error('Ô '+(idx+1)+' vượt khung ảnh '+spec.name+'.');
        sprites.set(idx+':'+flags,{sid,idx:i,...atlasSprite(atlas,source,frames[idx],flags,i)});
      });
      sheets.push({name:spec.name+(start?' · '+(start/64+1):''),tw:side,margin:0,url:atlas.canvas.toDataURL('image/png')});
    }
    for(const p of pieces){
      const {bounds,centerCorrection,sid,idx}=sprites.get(p.idx+':'+p.flags);
      ents.push({id:'tiled-'+p.order+'-'+p.x+'-'+p.y,t:'deco',x:p.x,y:p.y,placedProp:true,walk:true,
        name:p.name+' · '+(p.idx+1),tiledLayer:p.order,sceneLayer:p.layer,roofSurface:false,
        sc:1.5*side/plan.tileWidth,ox:((spec.width-plan.tileWidth)/2+spec.x+p.dx+centerCorrection)/side,
        oy:(spec.y+p.dy)/side,tile:{sid,idx},spriteBounds:bounds});
    }
  }
  return {...plan,sheets,ents,name:sample?'SBS Town · Cảnh gốc':leaf(maps[0]).slice(0,-4)};
}

export function tiledDepth(e,w,h,angle){
  const depth=e.y+(angle?0:e.x)+2;
  return e.sceneLayer===0?-2*(w+h)+depth/(w+h):e.tiledLayer*(w+h+1)+depth;
}
