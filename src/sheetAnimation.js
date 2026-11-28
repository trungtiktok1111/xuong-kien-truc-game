import {unzipSync,strFromU8} from 'fflate';

function stateName(name){
 const key=name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 return ({standing_idle:'idle',run_armed:'run',walk_2:'walk',standing_overhead_slash:'atk',punch_1:'atk',attack_13:'atk',hurt_1:'hit',idle_3:'idle',walk_3:'walk'})[key]||key;
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
