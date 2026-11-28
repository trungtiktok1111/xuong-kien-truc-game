import {unzipSync} from 'fflate';
import {packSheet} from './sheetAnimation.js';

export const directions=['Nam','Tây Nam','Tây','Tây Bắc','Bắc','Đông Bắc','Đông','Đông Nam'];
const aliases={rotations:'idle',stand:'idle',attack:'atk',hurt:'hit'};
const order=['south','south-west','west','north-west','north','north-east','east','south-east'];
const sheetName=/^(rotations_8dir|[a-z0-9]+[_-]8dir[_-]sheet)\.png$/i;
const stripName=/^([a-z0-9]+)[ _-](south[ _-]?west|south[ _-]?east|north[ _-]?west|north[ _-]?east|south|north|east|west)\.png$/i;
const frameName=/^(.+?)[ _-]([0-7])[ _-]([a-z]+)[ _-]?(\d+)\.png$/i;
const numberedDirections=[3,4,5,6,7,0,1,2]; // Source order starts at north-east.

export function readDirectionalZip(bytes){
 const groups=new Map();
 function groupAt(path,name){
  if(!groups.has(path))groups.set(path,{name,clips:{},strips:{},sequences:new Map()});
  return groups.get(path);
 }
 function read(archive,prefix=''){
  const files=unzipSync(archive,{filter:e=>{
   const name=e.name.split(/[\\/]/).at(-1);
   return e.originalSize<=24*1024*1024&&(sheetName.test(name)||stripName.test(name)||frameName.test(name)||!prefix&&/\.zip$/i.test(name));
  }});
  for(const [path,data] of Object.entries(files)){
   if(/\.zip$/i.test(path)){try{read(data,path+'/');}catch{}continue;}
   const folders=path.split(/[\\/]/),file=folders.pop(),strip=stripName.exec(file),frame=frameName.exec(file);
   const name=folders.at(-1)||'Hoạt ảnh';
   if(data.length<24)continue;
   const png=new DataView(data.buffer,data.byteOffset,data.byteLength);
   if(png.getUint32(0)!==0x89504e47)continue;
   const key=prefix+folders.join('/'),width=png.getUint32(16),height=png.getUint32(20);
   if(frame){
    if(!width||width>1024||!height||height>1024)continue;
    const [,character,direction,action,index]=frame;
    const group=groupAt(`${key}/${character}`,character),state=aliases[action.toLowerCase()]||action.toLowerCase();
    if(!group.sequences.has(state))group.sequences.set(state,Array.from({length:8},()=>new Map()));
    group.sequences.get(state)[Number(direction)].set(Number(index),{data,width,height});
    continue;
   }
   const action=strip?.[1].toLowerCase()||file.split(/[_-]/)[0].toLowerCase(),horizontal=action==='rotations';
   const size=strip||horizontal?height:height/8;
   const n=horizontal?1:width/size;
   if(!Number.isInteger(size)||size<1||size>1024||!Number.isInteger(n)||n<1||n>256||size*n>16384||(horizontal&&width!==8*size))continue;
   const group=groupAt(key,name),state=aliases[action]||action;
   if(!strip){group.clips[state]={data,size,n,horizontal};continue;}
   const direction=order.indexOf(strip[2].toLowerCase().replace(/[ _-]/g,'').replace(/^(north|south)(east|west)$/,'$1-$2'));
   (group.strips[state]??=new Map()).set(direction,{data,size,n});
  }
 }
 read(bytes);
 const result=new Map();
 for(const [path,{name,clips,strips,sequences}] of groups){
  for(const [state,rows] of Object.entries(strips)){
   if(clips[state]||rows.size!==8)continue;
   const frames=order.map((_,i)=>rows.get(i)),{size,n}=frames[0];
   if(frames.every(row=>row.size===size&&row.n===n))clips[state]={rows:frames.map(row=>row.data),size,n};
  }
  for(const [state,source] of sequences){
   const indices=[...source[0].keys()].sort((a,b)=>a-b),n=indices.length;
   if(clips[state]||n<1||n>256||!source.every(row=>row.size===n&&indices.every(index=>row.has(index))))continue;
   const frames=numberedDirections.map(direction=>indices.map(index=>source[direction].get(index)));
   const {width,height}=frames[0][0];
   if(width*n<=16384&&frames.every(row=>row.every(frame=>frame.width===width&&frame.height===height))){
    clips[state]={frames,width,height,n};
   }
  }
  if(!Object.keys(clips).length)continue;
  const key=path.replace(/(^|\/)[12]x(?=\/)/ig,'$1');
  if(!result.has(key)||/(^|\/)1x\//i.test(path))result.set(key,{name,clips});
 }
 return [...result.values()];
}

async function packFrames({frames,width,height,n}){
 const canvas=document.createElement('canvas');canvas.width=width*n;canvas.height=height*8;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 let left=width,top=height,right=0,bottom=0;
 for(const [direction,row] of frames.entries()){
  for(const [index,{data}] of row.entries()){
   const bitmap=await createImageBitmap(new Blob([data],{type:'image/png'}));
   const ox=index*width,oy=direction*height;
   try{ctx.drawImage(bitmap,ox,oy);}finally{bitmap.close();}
   const pixels=ctx.getImageData(ox,oy,width,height).data;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(!pixels[(y*width+x)*4+3])continue;
    left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
   }
  }
 }
 if(!right)throw Error('Các khung ảnh đều trong suốt.');
 const margin=Math.min(left,width-right),w=width-2*margin,h=bottom-top;
 const sheet=document.createElement('canvas');sheet.width=w*n;sheet.height=h*8;
 const out=sheet.getContext('2d');
 for(let d=0;d<8;d++)for(let i=0;i<n;i++){
  out.drawImage(canvas,i*width+margin,d*height+top,w,h,i*w,d*h,w,h);
 }
 return {canvas:sheet,fw:w,fh:h};
}

export async function buildDirectionalSet(group){
 const sheets=[],st={};
 for(const [state,clip] of Object.entries(group.clips)){
  const {data,rows,size,n,horizontal,frames}=clip;
  const name=group.name+' · '+state+' · '+crypto.randomUUID().slice(0,8);
  if(clip.grid){
   const {canvas,fw,fh,n}=await packSheet(clip);
   st[state]={src:[name],dirs:1,n,fw,fh,fps:10,ax:fw/2,ay:fh,fixedGround:true};
   sheets.push({name,url:canvas.toDataURL(),tw:fw,margin:0});
   continue;
  }
  if(frames){
   const {canvas,fw,fh}=await packFrames(clip);
   st[state]={src:[name],dirs:8,n,fw,fh,fps:10,ax:fw/2,ay:fh};
   sheets.push({name,url:canvas.toDataURL(),tw:fw,margin:0});
   continue;
  }
  const canvas=document.createElement('canvas');canvas.width=size*n;canvas.height=size*8;
  const ctx=canvas.getContext('2d');
  for(const [i,png] of (rows||[data]).entries()){
   const bitmap=await createImageBitmap(new Blob([png],{type:'image/png'}));
   try{
    if(horizontal)for(let j=0;j<8;j++)ctx.drawImage(bitmap,j*size,0,size,size,0,j*size,size,size);
    else ctx.drawImage(bitmap,0,i*size);
   }finally{bitmap.close();}
  }
   st[state]={src:[name],dirs:8,n,fw:size,fh:size,fps:10,ax:size/2,ay:size};
   sheets.push({name,url:canvas.toDataURL(),tw:size,margin:0});
 }
 return {set:{id:crypto.randomUUID(),name:group.name,sc:.55,visualScale:1,st},sheets};
}
