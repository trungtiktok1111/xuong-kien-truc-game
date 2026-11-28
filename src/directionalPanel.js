import {baseAnchorPicker} from './baseAnchors.js';
import {readManifestAnimation,readAnimationImages} from './sheetAnimation.js';
import {el} from './util.js';
import {directions,readDirectionalZip,buildDirectionalSet} from './directionalZip.js';
const labels={idle:'Đứng',walk:'Đi',run:'Chạy',atk:'Tấn công',hit:'Trúng đòn',dash:'Lướt',dodge:'Né',jump:'Nhảy',jump_forward:'Nhảy tới',walk_4:'Đi 4',combo_4:'Liên chiêu 4'};

export function directionalPanel(editor){
 const button=(label,onclick)=>el('button',{class:'b',type:'button',onclick},label);
 const section=el('section',{class:'outline-stage','aria-label':'Animation/Animated'});
 const status=el('p',{class:'hint',role:'status'}),available=el('div',{class:'row'}),library=el('div',{class:'row'});
 const target=el('select',{'aria-label':'Nhân vật nhận hoạt ảnh'});
 const merge=button('Gộp bộ đang xem',()=>{
  const set=editor.mergeDirectionalSets(selected.id,target.value);
  if(set){refresh();show(set);status.textContent='Đã gộp hoạt ảnh vào '+set.name+'.';}
 });
 merge.disabled=true;
 const action=el('select',{'aria-label':'Hoạt ảnh'});
 const direction=el('select',{'aria-label':'Hướng hoạt ảnh'},directions.map((label,i)=>el('option',{value:i},label)));
 const canvas=el('canvas',{width:96,height:96,draggable:'true','aria-label':'Kéo hoạt ảnh vào bản đồ'});
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 let selected,epoch=0,raf=0,anchor=4;
 const size=el('input',{class:'num',type:'number',min:10,max:400,step:1,required:''});
 const preview=el('div',{hidden:''},el('div',{class:'row'},action,direction),canvas,
  baseAnchorPicker(index=>{anchor=index;}),
  el('form',{class:'row',onsubmit:event=>{
   event.preventDefault();editor.setAnimationScale(selected.id,size.valueAsNumber/100);
   selected=editor.map().cfg.anims.find(set=>set.id===selected.id);
  }},el('label',{},'Kích thước (%) ',size),el('button',{class:'b',type:'submit'},'Đổi kích thước')),
  button('Dùng cho nhân vật chính',()=>editor.setAnimatedHero(selected.id)));
 function paint(time){
  if(!section.isConnected||!selected)return;
  const clip=selected.st[action.value],index=Number(direction.value);
  const split=clip?.src.length>1;
  const sheet=editor.sheets().find(s=>s.name===clip?.src[split?index:0]);
  ctx.clearRect(0,0,96,96);
  if(sheet?.img){
   const frame=Math.floor(Math.max(0,time-epoch)*clip.fps/1000)%clip.n;
   const scale=96/Math.max(clip.fw,clip.fh),w=clip.fw*scale,h=clip.fh*scale;
   ctx.drawImage(sheet.img,frame*clip.fw,(split?0:index)*clip.fh,clip.fw,clip.fh,(96-w)/2,96-h,w,h);
  }
  raf=requestAnimationFrame(paint);
 }
 function show(set){
  selected=set;preview.hidden=false;
  size.value=Math.round(100*(set.visualScale??1));
  action.replaceChildren(...Object.entries(set.st).filter(([,clip])=>clip.n>0)
   .map(([id])=>el('option',{value:id},labels[id]||(/^atk\d+$/.test(id)?'Tấn công '+id.slice(3):id))));
  if(set.st.walk)action.value='walk';
  updateDirections();updateMerge();
  epoch=performance.now();cancelAnimationFrame(raf);paint(epoch);
 }
 function refresh(){
  const picked=target.value;
  const sets=(editor.map().cfg.anims||[]).filter(set=>Object.values(set.st||{}).some(clip=>clip.n>0));
  library.replaceChildren(...sets.map(set=>button(set.name,()=>show(set))));
  target.replaceChildren(el('option',{value:''},'Tự nhóm theo tên nhân vật'),
   ...sets.map(set=>el('option',{value:set.id},set.name)));
  if(sets.some(set=>set.id===picked))target.value=picked;
  updateMerge();
 }
 function updateMerge(){merge.disabled=!selected||!target.value||target.value===selected.id;}
 target.onchange=updateMerge;
 function updateDirections(){
  direction.hidden=selected.st[action.value]?.dirs!==8;
  if(direction.hidden)direction.value='0';
 }
 action.onchange=()=>{updateDirections();epoch=performance.now();};
 canvas.ondragstart=event=>editor.startMaterialDrag(event,{animation:selected,anchor,pose:{state:action.value,direction:Number(direction.value)}});
 canvas.ondragend=()=>editor.endMaterialDrag();
 const input=el('input',{type:'file',accept:'.zip',multiple:'','aria-label':'Nhập ZIP hoạt ảnh'});
 const images=el('input',{type:'file',accept:'.png',multiple:'','aria-label':'Nhập bảng PNG'});
 const name=el('input',{type:'text',placeholder:'Tên nhân vật','aria-label':'Tên bộ hoạt ảnh'});
 async function load(files,fromImages){
  if(!files.length)return;
  available.replaceChildren();
  const names=files.map(file=>file.name).join(', ');
  status.textContent='Đang đọc hoạt ảnh…';
  try{
   const groups=[];
   if(fromImages){
    groups.push(readAnimationImages(await Promise.all(files.map(async file=>({
     name:file.name,data:new Uint8Array(await file.arrayBuffer())
    }))),name.value.trim()||files[0].name.replace(/\.png$/i,'')));
   }else for(const file of files){
    const data=new Uint8Array(await file.arrayBuffer());
    const manifest=readManifestAnimation(data).filter(group=>Object.keys(group.clips).length);
    groups.push(...manifest,...readDirectionalZip(data));
   }
   status.textContent=names+' · '+(groups.length?groups.length+' bộ. Bấm tên bộ để nạp.':'Chưa ghép được hoạt ảnh từ các tệp đã chọn.');
   for(const group of groups){
    const pick=button(group.name,async()=>{
     const map=editor.map(),targetId=target.value;pick.disabled=true;
     try{
      const {set,sheets}=await buildDirectionalSet(group);
      if(!section.isConnected)return;
      const result=await editor.installDirectionalSet(set,sheets,map,targetId);
      refresh();show(result);status.textContent='Đã nạp '+Object.keys(set.st).length+' động tác vào '+result.name+'.';pick.remove();
     }catch(error){status.textContent=error.message;pick.disabled=false;}
    });
    available.append(pick);
   }
  }catch(error){status.textContent=error.message;}
 }
 input.onchange=()=>load([...input.files],false);
 images.onchange=()=>load([...images.files],true);
 section.append(el('strong',{},'Animation/Animated'),el('label',{},'Nhập ZIP hoạt ảnh ',input),
  el('label',{},'Nhân vật nhận hoạt ảnh ',target),merge,name,el('label',{},'Nhập bảng PNG của cùng một nhân vật ',images),status,available,library,preview);
 refresh();return section;
}
