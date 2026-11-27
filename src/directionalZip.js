import {unzipSync} from 'fflate';

export const directions=['Nam','Tây Nam','Tây','Tây Bắc','Bắc','Đông Bắc','Đông','Đông Nam'];
const aliases={rotations:'idle',stand:'idle',attack:'atk',hurt:'hit'};
export function readDirectionalZip(bytes){
 const groups=new Map();
 const files=unzipSync(bytes,{filter:e=>/(?:rotations_8dir|[a-z0-9]+_8dir_sheet)\.png$/i.test(e.name)&&!/(?:^|\/)2x\//i.test(e.name)});
 for(const [path,data] of Object.entries(files)){
  const folders=path.split('/'),file=folders.pop(),name=folders.at(-1);
  if(!name||data.length<24)continue;
  const png=new DataView(data.buffer,data.byteOffset,data.byteLength);
  if(png.getUint32(0)!==0x89504e47)continue;
  const action=file.split('_')[0].toLowerCase(),horizontal=action==='rotations';
  const width=png.getUint32(16),height=png.getUint32(20),size=horizontal?height:height/8,n=horizontal?1:width/size;
  if(!Number.isInteger(size)||size<1||size>1024||!Number.isInteger(n)||n<1||n>256||(horizontal&&width!==8*size))continue;
  const key=folders.join('/');
  if(!groups.has(key))groups.set(key,{name,clips:{}});
  groups.get(key).clips[aliases[action]||action]={data,size,n,horizontal};
 }
 return [...groups.values()];
}

export async function buildDirectionalSet(group){
 const sheets=[],st={};
 for(const [state,{data,size,n,horizontal}] of Object.entries(group.clips)){
  const bitmap=await createImageBitmap(new Blob([data],{type:'image/png'}));
  try{
   const canvas=document.createElement('canvas');canvas.width=size*n;canvas.height=size*8;
   const ctx=canvas.getContext('2d');
   if(horizontal)for(let i=0;i<8;i++)ctx.drawImage(bitmap,i*size,0,size,size,0,i*size,size,size);
   else ctx.drawImage(bitmap,0,0);
   const name=group.name+' · '+state+' · '+crypto.randomUUID().slice(0,8);
   st[state]={src:[name],dirs:8,n,fw:size,fh:size,fps:10,ax:size/2,ay:size};
   sheets.push({name,url:canvas.toDataURL(),tw:size,margin:0});
  }finally{bitmap.close();}
 }
 return {set:{id:crypto.randomUUID(),name:group.name,sc:.55,st},sheets};
}
