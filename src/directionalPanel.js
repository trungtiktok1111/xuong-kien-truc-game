import {characterRoles} from './characterRoles.js';
import {baseAnchorPicker} from './baseAnchors.js';
import {readManifestAnimation,groupAnimationImages} from './sheetAnimation.js';
import {el} from './util.js';
import {directions,readDirectionalZip,buildDirectionalSet} from './directionalZip.js';
const labels={idle:'Đứng',walk:'Đi',run:'Chạy',atk:'Tấn công',hit:'Trúng đòn',dash:'Lướt',dodge:'Né',jump:'Nhảy',jump_forward:'Nhảy tới',walk_4:'Đi 4',combo_4:'Liên chiêu 4'};

export function directionalPanel(editor){
 const button=(label,onclick)=>el('button',{class:'b',type:'button',onclick},label);
 const section=el('section',{class:'outline-stage','aria-label':'Animation/Animated'});
 const status=el('p',{class:'hint',role:'status'}),library=el('div',{class:'row'});
 const role=el('select',{'aria-label':'Vai trò nhân vật'},Object.entries(characterRoles)
  .map(([id,option])=>el('option',{value:id},option.label)));
 const applyRole=button('Dùng làm nhân vật chính',()=>{
  if(role.value==='hero')editor.setAnimatedHero(selected.id);
  else{
   editor.armCharacterPlacement(placement());
   status.textContent='Bấm lên sàn để đặt '+characterRoles[role.value].label.toLowerCase()+'. Esc để hủy.';
  }
 });
 const action=el('select',{'aria-label':'Hoạt ảnh'});
 const direction=el('select',{'aria-label':'Hướng hoạt ảnh'},directions.map((label,i)=>el('option',{value:i},label)));
 const canvas=el('canvas',{width:96,height:96,draggable:'true','aria-label':'Kéo hoạt ảnh vào bản đồ'});
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 let selected,epoch=0,raf=0,anchor=4;
 const size=el('input',{class:'num',type:'number',min:10,max:400,step:1,required:''});
 const preview=el('div',{hidden:''},el('label',{},'Vai trò nhân vật ',role),applyRole,el('div',{class:'row'},action,direction),canvas,
  baseAnchorPicker(index=>{anchor=index;}),
  el('form',{class:'row',onsubmit:event=>{
   event.preventDefault();editor.setAnimationScale(selected.id,size.valueAsNumber/100);
   selected=editor.map().cfg.anims.find(set=>set.id===selected.id);
  }},el('label',{},'Kích thước (%) ',size),el('button',{class:'b',type:'submit'},'Đổi kích thước')));
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
  updateDirections();
  epoch=performance.now();cancelAnimationFrame(raf);paint(epoch);
 }
 function refresh(){
  const sets=(editor.map().cfg.anims||[]).filter(set=>Object.values(set.st||{}).some(clip=>clip.n>0));
  library.replaceChildren(...sets.map(set=>button(set.name,()=>show(set))));
 }
 role.onchange=()=>{applyRole.textContent=role.value==='hero'?'Dùng làm nhân vật chính':'Đặt vào màn';};
 function updateDirections(){
  direction.hidden=selected.st[action.value]?.dirs!==8;
  if(direction.hidden)direction.value='0';
 }
 action.onchange=()=>{updateDirections();epoch=performance.now();};
 function placement(){
  return {animation:selected,anchor,role:role.value,pose:{state:action.value,direction:Number(direction.value)}};
 }
 canvas.ondragstart=event=>editor.startMaterialDrag(event,placement());
 canvas.ondragend=()=>editor.endMaterialDrag();
 const input=el('input',{type:'file',accept:'.zip',multiple:'','aria-label':'Nhập ZIP hoạt ảnh'});
 const images=el('input',{type:'file',accept:'.png',multiple:'','aria-label':'Nhập PNG hoạt ảnh'});
 const folder=el('input',{type:'file',webkitdirectory:'','aria-label':'Nhập thư mục PNG'});
 const name=el('input',{type:'text',placeholder:'Tên nhân vật nếu ảnh chưa có tên','aria-label':'Tên bộ hoạt ảnh'});
 let importing=false;
 async function load(files,fromImages){
  if(!files.length||importing)return;
  importing=true;input.disabled=images.disabled=folder.disabled=true;
  status.textContent='Đang đọc hoạt ảnh…';
  const map=editor.map(),imported=new Map(),errors=[];
  try{
   const groups=[];
   if(fromImages){
    groups.push(...groupAnimationImages(await Promise.all(files.map(async file=>({
     name:file.name,path:file.webkitRelativePath,data:new Uint8Array(await file.arrayBuffer())
    }))),name.value.trim()));
   }else for(const file of files){
    try{
     const data=new Uint8Array(await file.arrayBuffer());
     const manifest=readManifestAnimation(data).filter(group=>Object.keys(group.clips).length);
     const found=[...manifest,...readDirectionalZip(data)];
     for(const group of found)if(group.name==='Hoạt ảnh')group.name=file.name.replace(/\.zip$/i,'');
     if(!found.length)errors.push(file.name+': chưa nhận ra hoạt ảnh.');
     groups.push(...found);
    }catch(error){errors.push(file.name+': '+error.message);}
   }
   for(const group of groups){
    if(!section.isConnected||editor.map()!==map)break;
    try{
     const {set,sheets}=await buildDirectionalSet(group);
     if(!section.isConnected)return;
     const result=await editor.installDirectionalSet(set,sheets,map);
     imported.set(result.id,result);
    }catch(error){errors.push(group.name+': '+error.message);}
   }
   refresh();
   if(imported.size===1)show(imported.values().next().value);
   if(fromImages&&imported.size)name.value='';
   status.textContent=[imported.size?'Đã nạp '+imported.size+' nhân vật. Chọn nhân vật để đặt vai trò.':'',...errors].filter(Boolean).join(' ');
  }catch(error){status.textContent=error.message;}
  finally{importing=false;input.disabled=images.disabled=folder.disabled=false;input.value=images.value=folder.value='';}
 }
 input.onchange=()=>load([...input.files],false);
 images.onchange=()=>load([...images.files],true);
 folder.onchange=()=>load([...folder.files].filter(file=>/\.png$/i.test(file.name)),true);
 section.append(el('strong',{},'Animation/Animated'),el('label',{},'Nhập ZIP hoạt ảnh ',input),
  name,el('label',{},'Nhập PNG hoạt ảnh ',images),el('label',{},'Nhập thư mục PNG ',folder),status,library,preview);
 refresh();return section;
}
