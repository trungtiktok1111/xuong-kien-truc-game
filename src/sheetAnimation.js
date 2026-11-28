import {unzipSync,strFromU8} from 'fflate';

function stateName(name){
 const key=name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 return ({stand:'idle',sprint:'run',attack:'atk',punch:'atk',slash:'atk',hurt:'hit',standing_idle:'idle',run_armed:'run',walk_2:'walk',standing_overhead_slash:'atk',punch_1:'atk',attack_13:'atk',hurt_1:'hit',idle_3:'idle',walk_3:'walk'})[key]||key;
}

export function readManifestAnimation(bytes){
 const raw=unzipSync(bytes,{filter:entry=>entry.name==='manifest.json'&&entry.originalSize<=1024*1024});
 if(!raw['manifest.json'])return [];
 const rows=JSON.parse(strFromU8(raw['manifest.json'])).files;
 if(!Array.isArray(rows))return [];
 const groups=new Map();
 for(const row of rows){
  const {character,path,frameCount:n,frameWidth:fw,frameHeight:fh,sheetColumns:cols}=row;
  if(typeof character!=='string'||typeof path!=='string'||typeof row.motionKey!=='string'||
    ![n,fw,fh,cols].every(Number.isInteger)||n<2||n>128||fw<1||fh<1||fw>1024||fh>1024||
    cols<1||cols>n||row.frameOrder!=='row-major'||row.directionId)continue;
  const state=stateName(row.motionKey);
  if(!groups.has(character))groups.set(character,new Map());
  const clips=groups.get(character);
  if(!clips.has(state)||fw<clips.get(state).fw)clips.set(state,{path,n,fw,fh,cols});
 }
 const wanted=new Set([...groups.values()].flatMap(clips=>[...clips.values()].map(clip=>clip.path)));
 const sheets=unzipSync(bytes,{filter:entry=>wanted.has(entry.name)&&entry.originalSize<=24*1024*1024});
 return [...groups].map(([name,clips])=>({name,clips:Object.fromEntries(
  [...clips].filter(([,clip])=>sheets[clip.path]).map(([state,clip])=>[state,{grid:clip,data:sheets[clip.path]}]))}));
}

export function readAnimationImages(files,name){
 const clips={};
 for(const {name:file,data} of files){
  const base=file.replace(/\.png$/i,'');
  const key=stateName(base);
  clips[Object.hasOwn(clips,key)?base:key]={grid:{},data};
 }
 return {name,clips};
}

export async function packSheet({data,grid}){
 const bitmap=await createImageBitmap(new Blob([data],{type:'image/png'}));
 try{
  let {n,fw,fh,cols}=grid;
  let frames;
  if(n){
   if(fw*cols>bitmap.width||fh*Math.ceil(n/cols)>bitmap.height)throw Error('Kích thước bảng ảnh khác thông tin trong gói.');
   frames=Array.from({length:n},(_,i)=>[i%cols*fw,Math.floor(i/cols)*fh,fw,fh]);
  }else{
   if(bitmap.width<2||bitmap.height<2||bitmap.width*bitmap.height>16777216)throw Error('Bảng PNG vượt kích thước có thể phân tích.');
   // These sheets use square cells with fractional boundaries after export resizing.
   const rows=Math.max(1,Math.round(bitmap.height/(bitmap.width>bitmap.height&&bitmap.height<=256?bitmap.height:bitmap.width/10)));
   cols=rows===1?Math.round(bitmap.width/bitmap.height):Math.round(bitmap.width*rows/bitmap.height);
   if(cols<1||cols*rows>128)throw Error('Chưa xác định được lưới của bảng PNG.');
   const scan=document.createElement('canvas');scan.width=bitmap.width;scan.height=bitmap.height;
   const context=scan.getContext('2d',{willReadFrequently:true});
   context.drawImage(bitmap,0,0);
   fw=Math.ceil(bitmap.width/cols);fh=Math.ceil(bitmap.height/rows);
   frames=[];
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const l=Math.round(x*bitmap.width/cols),r=Math.round((x+1)*bitmap.width/cols);
    const t=Math.round(y*bitmap.height/rows),b=Math.round((y+1)*bitmap.height/rows);
    const pixels=context.getImageData(l,t,r-l,b-t).data;
    if(pixels.some((alpha,i)=>i%4===3&&alpha>16))frames.push([l,t,r-l,b-t]);
   }
   n=frames.length;
   if(n<2)throw Error('Chưa tìm thấy nhiều khung trong bảng PNG.');
  }
  const canvas=document.createElement('canvas');
  const outputScale=Math.min(1,Math.floor(8192/n)/fw);
  const w=Math.max(1,Math.floor(fw*outputScale)),h=Math.max(1,Math.round(fh*outputScale));
  canvas.width=w*n;canvas.height=h;
  const ctx=canvas.getContext('2d');
  for(const [i,[x,y,fWidth,fHeight]] of frames.entries()){
   ctx.drawImage(bitmap,x,y,fWidth,fHeight,i*w,0,fWidth*outputScale,fHeight*outputScale);
  }
  return {canvas,fw:w,fh:h,n};
 }finally{bitmap.close();}
}

const motion=/(?:^|[ _.-])((?:crouched[_ -]walking|jump[_ -]forward|idle|stand|walk|run|sprint|attack|atk|punch|slash|combo|hurt|hit|jump|dash|dodge|block|death|cast|spell)(?:[ _.-]*[0-9]+)?)$/i;

export function groupAnimationImages(files,character){
 const groups=new Map(),unknown=[];
 for(const file of files){
  const path=(file.path||file.name).split(/[\\/]/),base=path.pop().replace(/\.png$/i,'');
  const match=motion.exec(base);
  const prefix=match?base.slice(0,match.index).trim():'';
  const name=prefix||path.at(-1)||character;
  if(!name){unknown.push(file.name);continue;}
  if(!groups.has(name))groups.set(name,[]);
  groups.get(name).push({...file,name:match?match[1]+'.png':file.name});
 }
 if(unknown.length)throw Error('Các PNG này cần tên nhân vật: '+unknown.slice(0,3).join(', ')+
  '. Nhập tên và chọn lại các ảnh thuộc cùng nhân vật, hoặc nhập ZIP có tên nhân vật.');
 return [...groups].map(([name,images])=>readAnimationImages(images,name));
}

export function readAnimationImageZip(bytes,character){
 const sheets=unzipSync(bytes,{filter:entry=>{
  const parts=entry.name.split(/[\\/]/),basename=parts.pop().replace(/\.png$/i,'');
  return entry.originalSize<=24*1024*1024&&/\.png$/i.test(entry.name)&&
   !parts.some(part=>part.startsWith('.')||part==='__MACOSX')&&motion.test(basename);
 }});
 const files=Object.entries(sheets).map(([path,data])=>({name:path.split(/[\\/]/).at(-1),path,data}));
 return groupAnimationImages(files,character);
}

const sideImage=/^(.+)_([LR])(?:_(\d+))?\.png$/i;
const sideVariant=/^(?:(\d+)x(\d+)_Frames(?:HQ)?|x(\d+)_Spritesheets)$/i;

function pngSize(bytes){
 if(bytes.length<24)return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(view.getUint32(0)!==0x89504e47)return null;
 return [view.getUint32(16),view.getUint32(20)];
}

function sideAction(name){
 const id=name.toLowerCase();
 const aliases={attack1:'atk',attack6_injump:'atk6',idle1:'idle',hit1:'hit',
  run_forward:'run',walk_forward:'walk',run_backpedal:'run_back',walk_backpedal:'walk_back',attack_combo:'combo'};
 return aliases[id]||id.replace(/^attack(?=\d)/,'atk');
}

export function readSideAnimationZip(bytes,archiveName,chosenName){
 const root=archiveName.replace(/\.zip$/i,''),variant=sideVariant.exec(root);
 const files=unzipSync(bytes,{filter:entry=>{
  const path=entry.name.split(/[\\/]/),name=path.pop();
  return entry.originalSize<=24*1024*1024&&(variant&&sideImage.test(name)||/^smith_(?:die|idle_new|jump|punch|run|walk)\.png$/i.test(name));
 }});
 const groups=new Map();
 for(const [path,data] of Object.entries(files)){
  const dimensions=pngSize(data);
  if(!dimensions)continue;
  const name=path.split(/[\\/]/).at(-1);
  if(/^smith_/i.test(name)){
   const [width,height]=dimensions;
   if(height!==258||width%height)continue;
   const [action]=name.slice(6).toLowerCase().split('.');
   const state=({die:'death',idle_new:'idle',punch:'atk'})[action]||action;
   const smith=chosenName||'Smith';
   if(!groups.has(smith))groups.set(smith,{name:smith,clips:{}});
   groups.get(smith).clips[state]={grid:{n:width/height,fw:height,fh:height,cols:width/height},data};
   continue;
  }
  const [,action,direction,index]=sideImage.exec(name);
  const h=Number(variant[2]||variant[3]),w=Number(variant[1]||Math.round(h*300/160));
  const character=chosenName||'Nhân vật L/R',key=sideAction(action);
  if(!groups.has(character))groups.set(character,{name:character,clips:{},sideVariant:true});
  const clips=groups.get(character).clips;
  const clip=(clips[key]??={sideRows:[[],[]],fw:w,fh:h});
  const row=clip.sideRows[direction.toUpperCase()==='R'?0:1];
  if(index){
   if(dimensions[0]===w&&dimensions[1]===h)row.push({data,index:Number(index)});
  }else{
   const cols=dimensions[0]/w,rows=dimensions[1]/h;
   if(Number.isInteger(cols)&&Number.isInteger(rows)&&cols>0&&rows>0&&cols*rows<=128)
    row.push({data,cols,n:cols*rows});
  }
 }
 for(const group of groups.values()){
  for(const [state,clip] of Object.entries(group.clips)){
   if(!clip.sideRows)continue;
   for(const row of clip.sideRows)row.sort((a,b)=>a.index-b.index);
   const counts=clip.sideRows.map(row=>row[0]?.n||row.length);
   if(!counts[0]||counts[0]!==counts[1])delete group.clips[state];
   else clip.n=counts[0];
  }
 }
 return [...groups.values()].filter(group=>Object.keys(group.clips).length);
}

export async function packSideAnimation({sideRows,fw,fh,n}){
 const scale=Math.min(1,480/fw,Math.floor(8192/n)/fw);
 const width=Math.floor(fw*scale),height=Math.round(fh*scale);
 const canvas=document.createElement('canvas');canvas.width=width*n;canvas.height=height*2;
 const ctx=canvas.getContext('2d');
 for(const [direction,row] of sideRows.entries()){
  for(const [index,entry] of row.entries()){
   const bitmap=await createImageBitmap(new Blob([entry.data],{type:'image/png'}));
   try{
    if(entry.cols){
     for(let i=0;i<n;i++)ctx.drawImage(bitmap,(i%entry.cols)*fw,Math.floor(i/entry.cols)*fh,fw,fh,i*width,direction*height,width,height);
    }else ctx.drawImage(bitmap,index*width,direction*height,width,height);
   }finally{bitmap.close();}
  }
 }
 return {canvas,fw:width,fh:height,n};
}
