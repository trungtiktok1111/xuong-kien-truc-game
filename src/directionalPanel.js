import {el} from './util.js';
import {directions,readDirectionalZip,buildDirectionalSet} from './directionalZip.js';
const labels={idle:'Đứng',walk:'Đi',run:'Chạy',atk:'Tấn công',hit:'Trúng đòn'};

export function directionalPanel(editor){
 const button=(label,onclick)=>el('button',{class:'b',type:'button',onclick},label);
 const section=el('section',{class:'outline-stage','aria-label':'Animation/Animated'});
 const status=el('p',{class:'hint',role:'status'}),available=el('div',{class:'row'}),library=el('div',{class:'row'});
 const action=el('select',{'aria-label':'Hoạt ảnh'});
 const direction=el('select',{'aria-label':'Hướng hoạt ảnh'},directions.map((label,i)=>el('option',{value:i},label)));
 const canvas=el('canvas',{width:96,height:96,draggable:'true','aria-label':'Kéo hoạt ảnh vào bản đồ'});
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 let selected,epoch=0,raf=0;
 const preview=el('div',{hidden:''},el('div',{class:'row'},action,direction),canvas,
  el('p',{class:'hint'},'Kéo ảnh động vào bản đồ để đặt.'),
  button('Dùng cho nhân vật chính',()=>editor.setAnimatedHero(selected.id)));
 function paint(time){
  if(!section.isConnected||!selected)return;
  const clip=selected.st[action.value],sheet=editor.sheets().find(s=>s.name===clip?.src[0]);
  ctx.clearRect(0,0,96,96);
  if(sheet?.img){
   const frame=Math.floor(Math.max(0,time-epoch)*clip.fps/1000)%clip.n;
   ctx.drawImage(sheet.img,frame*clip.fw,Number(direction.value)*clip.fh,clip.fw,clip.fh,0,0,96,96);
  }
  raf=requestAnimationFrame(paint);
 }
 function show(set){
  selected=set;preview.hidden=false;
  action.replaceChildren(...Object.entries(set.st).filter(([,clip])=>clip.dirs===8)
   .map(([id])=>el('option',{value:id},labels[id]||id)));
  if(set.st.walk)action.value='walk';
  epoch=performance.now();cancelAnimationFrame(raf);paint(epoch);
 }
 function refresh(){
  library.replaceChildren(...(editor.map().cfg.anims||[]).filter(set=>Object.values(set.st||{}).some(clip=>clip.dirs===8))
   .map(set=>button(set.name,()=>show(set))));
 }
 action.onchange=()=>{epoch=performance.now();};
 canvas.ondragstart=event=>editor.startMaterialDrag(event,{animation:selected,pose:{state:action.value,direction:Number(direction.value)}});
 canvas.ondragend=()=>editor.endMaterialDrag();
 const input=el('input',{type:'file',accept:'.zip',multiple:'','aria-label':'Nhập ZIP hoạt ảnh 8 hướng'});
 input.onchange=async()=>{
  const files=[...input.files];input.value='';available.replaceChildren();
  status.textContent='Đang đọc ZIP…';
  try{
   const groups=[];
   for(const file of files)groups.push(...readDirectionalZip(new Uint8Array(await file.arrayBuffer())));
   status.textContent=groups.length?groups.length+' bộ trong ZIP. Bấm tên bộ để nạp.':'Chưa nhận diện được sprite sheet 8 hướng.';
   for(const group of groups){
    const pick=button(group.name,async()=>{
     const map=editor.map();pick.disabled=true;
     try{
      const {set,sheets}=await buildDirectionalSet(group);
      if(!section.isConnected)return;
      await editor.installDirectionalSet(set,sheets,map);
      refresh();show(set);status.textContent='Đã nạp '+group.name+'.';pick.remove();
     }catch(error){status.textContent=error.message;pick.disabled=false;}
    });
    available.append(pick);
   }
  }catch(error){status.textContent=error.message;}
 };
 section.append(el('strong',{},'Animation/Animated'),el('label',{},'Nhập ZIP hoạt ảnh 8 hướng ',input),status,available,library,preview);
 refresh();return section;
}
