import {unzipSync} from 'fflate';

export const directions=['Nam','Tây Nam','Tây','Tây Bắc','Bắc','Đông Bắc','Đông','Đông Nam'];
const aliases={rotations:'idle',stand:'idle',attack:'atk',hurt:'hit'};
const order=['south','south-west','west','north-west','north','north-east','east','south-east'];
const sheetName=/^(rotations_8dir|[a-z0-9]+[_-]8dir[_-]sheet)\.png$/i;
const stripName=/^([a-z0-9]+)[ _-](south[ _-]?west|south[ _-]?east|north[ _-]?west|north[ _-]?east|south|north|east|west)\.png$/i;

export function readDirectionalZip(bytes){
 const groups=new Map();
 function read(archive,prefix=''){
  const files=unzipSync(archive,{filter:e=>{
   const name=e.name.split(/[\\/]/).at(-1);
   return e.originalSize<=24*1024*1024&&(sheetName.test(name)||stripName.test(name)||!prefix&&/\.zip$/i.test(name));
  }});
  for(const [path,data] of Object.entries(files)){
   if(/\.zip$/i.test(path)){try{read(data,path+'/');}catch{}continue;}
   const folders=path.split(/[\\/]/),file=folders.pop(),strip=stripName.exec(file);
   const name=folders.at(-1)||'Hoạt ảnh';
   if(data.length<24)continue;
   const png=new DataView(data.buffer,data.byteOffset,data.byteLength);
   if(png.getUint32(0)!==0x89504e47)continue;
   const action=strip?.[1].toLowerCase()||file.split(/[_-]/)[0].toLowerCase(),horizontal=action==='rotations';
   const width=png.getUint32(16),height=png.getUint32(20),size=strip||horizontal?height:height/8;
   const n=horizontal?1:width/size;
   if(!Number.isInteger(size)||size<1||size>1024||!Number.isInteger(n)||n<1||n>256||size*n>16384||(horizontal&&width!==8*size))continue;
   const key=prefix+folders.join('/');
   if(!groups.has(key))groups.set(key,{name,clips:{},strips:{}});
   const group=groups.get(key),state=aliases[action]||action;
   if(!strip){group.clips[state]={data,size,n,horizontal};continue;}
   const direction=order.indexOf(strip[2].toLowerCase().replace(/[ _-]/g,'').replace(/^(north|south)(east|west)$/,'$1-$2'));
   (group.strips[state]??=new Map()).set(direction,{data,size,n});
  }
 }
 read(bytes);
 const result=new Map();
 for(const [path,{name,clips,strips}] of groups){
  for(const [state,rows] of Object.entries(strips)){
   if(clips[state]||rows.size!==8)continue;
   const frames=order.map((_,i)=>rows.get(i)),{size,n}=frames[0];
   if(frames.every(row=>row.size===size&&row.n===n))clips[state]={rows:frames.map(row=>row.data),size,n};
  }
  if(!Object.keys(clips).length)continue;
  const key=path.replace(/(^|\/)[12]x(?=\/)/ig,'$1');
  if(!result.has(key)||/(^|\/)1x\//i.test(path))result.set(key,{name,clips});
 }
 return [...result.values()];
}

export async function buildDirectionalSet(group){
 const sheets=[],st={};
 for(const [state,{data,rows,size,n,horizontal}] of Object.entries(group.clips)){
  const canvas=document.createElement('canvas');canvas.width=size*n;canvas.height=size*8;
  const ctx=canvas.getContext('2d');
  for(const [i,png] of (rows||[data]).entries()){
   const bitmap=await createImageBitmap(new Blob([png],{type:'image/png'}));
   try{
    if(horizontal)for(let j=0;j<8;j++)ctx.drawImage(bitmap,j*size,0,size,size,0,j*size,size,size);
    else ctx.drawImage(bitmap,0,i*size);
   }finally{bitmap.close();}
  }
   const name=group.name+' · '+state+' · '+crypto.randomUUID().slice(0,8);
   st[state]={src:[name],dirs:8,n,fw:size,fh:size,fps:10,ax:size/2,ay:size};
   sheets.push({name,url:canvas.toDataURL(),tw:size,margin:0});
 }
 return {set:{id:crypto.randomUUID(),name:group.name,sc:.55,st},sheets};
}
