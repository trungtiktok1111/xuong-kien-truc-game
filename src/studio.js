import {isMapLink} from './wall2d.js';
import {campaignStart,mapLinkLanding,mapLinkReports} from './mapLinks2d.js';
import {ensureAngle} from './proj.js';
import {guideBox,appGuides} from './editorHelp.js';
import {el,ask,yes,pickFile,saveFile,gameHTML,toast,lsGet,lsSet} from './util.js';
import {check2D} from './check.js';
import {play2D} from './play2d.js';

const action=(label,onclick)=>el('button',{class:'b',type:'button',onclick},label);
const panel=()=>el('section',{style:'position:fixed;inset:0;z-index:190;overflow:auto;background:#101820f5;display:grid;place-items:center;padding:20px;touch-action:pan-y'});
const card=()=>el('div',{style:'width:min(560px,100%);padding:26px;background:#1e2b36;border:1px solid #50606a;border-radius:16px;box-shadow:0 12px 40px #0007'});
export function newMeta(title){return {title,id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)};}
function projectChecks(data){
 const maps=data.maps||[data],problems=mapLinkReports(maps);
 for(const [i,map] of maps.entries()){
  const name=map.name||'Màn '+(i+1),exits=map.ents.some(isMapLink);
  for(const r of check2D(map)){
   if(exits&&r.id==='F3'&&!map.ents.some(e=>e.t==='goal'))continue;
   if(r.st==='missing'||r.st==='broken')problems.push(name+' · '+r.txt);
  }
 }
 return problems;
}
function studioData(editor,meta){
 return Object.assign(editor.gameData(),{studio:{title:meta.title,id:meta.id}});
}
export function saveProjectFile(editor){
 const project=editor.readProject();
 return saveFile(project.meta.title+'.xuong.json',new Blob([JSON.stringify(project)],{type:'application/json'}));
}

export function openProjectFile(editor,onOpened){
 pickFile('.json,application/json',async text=>{
  try{
   const saved=JSON.parse(text);
   if(saved?.format==='thk-map-1')throw Error('Đây là tệp một bản đồ. Dùng Tệp → Nâng cao → Nhập bản đồ 2D.');
   if(saved?.format!=='xuong-project-1')throw Error('Tệp dự án Xưởng không hợp lệ.');
   if(!await yes('Mở dự án đã chọn? Lưu dự án hiện tại trước nếu muốn mở lại sau.'))return;
   await editor.restoreProject(saved);onOpened?.();toast('Đã mở dự án');
  }catch(e){toast(e.message||'Không mở được dự án');}
 });
}

export function openStudio(editor){
 const root=panel(),body=card();root.append(body);document.body.append(root);
 const refresh=()=>{
  const project=editor.readProject(),meta=project.meta;
  const start=el('select',{class:'num','aria-label':'Màn bắt đầu game',
   onchange:()=>editor.setProjectMeta({...meta,startMap:+start.value})},project.maps.map((m,i)=>
   el('option',{value:i},m.name||'Màn '+(i+1))));
  start.value=String(campaignStart(project.maps,meta.startMap));
  body.replaceChildren(el('h2',{},meta.title),guideBox('project',appGuides.project),el('p',{class:'hint'},project.maps.length+' màn · Dự án game 2D'),
   el('label',{class:'row'},'Màn bắt đầu game',start),editor.mapConnectionBox(),
   el('div',{class:'row'},
    action('Tạo từ mẫu Đá Xoáy',async()=>{
     const title=await ask('Tên dự án mới','Hầm ngục Đá Xoáy');
     if(!title?.trim())return;
     if(!await yes('Chuyển sang dự án mới? Lưu dự án hiện tại trước nếu bạn muốn mở lại sau.'))return;
     await editor.startSample(newMeta(title.trim()));refresh();
    }),
    action('Đổi tên',async()=>{const title=await ask('Tên game',meta.title);if(title?.trim()){editor.setProjectMeta({...meta,title:title.trim()});refresh();}})),
   el('div',{class:'row'},
    action('Lưu dự án',()=>saveProjectFile(editor)),
    action('Mở dự án',()=>openProjectFile(editor,refresh))),
   el('div',{class:'row'},
    action('Kiểm toàn dự án',()=>showCheck(studioData(editor,meta))),
    action('Chơi thử',async()=>{
     const data=studioData(editor,editor.readProject().meta),sheets=editor.sheets();
     if((data.maps||[data]).some(m=>m.cfg?.proj==='angle'))await ensureAngle(sheets);
     root.remove();runStudio(data,sheets,{preview:true});
    }),
    action('Xuất game HTML',()=>{
     const data=studioData(editor,meta);
     saveFile(meta.title+'.html',new Blob([gameHTML(data,meta.title)],{type:'text/html'}));
     toast('Mở tệp HTML vừa tải bằng trình duyệt để chơi.');
    })),
   el('div',{class:'row'},action('Về trình sửa',()=>root.remove())));
 };
 function showCheck(data){
  const issues=projectChecks(data);
  body.querySelector('.project-report')?.remove();
  body.append(el('section',{class:'project-report'},el('h3',{},'Kiểm dữ liệu '+(data.maps?.length||1)+' màn'),
   issues.length?el('ul',{},issues.map(t=>el('li',{},t))):el('p',{},'Đã kiểm điểm xuất phát, đích, vùng chặn và cửa chuyển màn.'),
   el('p',{class:'hint'},'Cần Chơi thử để xác nhận thứ tự nhiệm vụ và trạng thái khi tải lại.')));
 }
 refresh();
}
export function runStudio(data,sheets,{preview=false}={}){
 const key=(preview?'xuong_preview_':'xuong_play_')+data.studio.id;
 const maps=data.maps||[data],first=campaignStart(maps,data.startMap);
 const landingCache=new Map();
 const landing=door=>{
  const key=[door.to,door.tx,door.ty].join(':');
  if(!landingCache.has(key))landingCache.set(key,mapLinkLanding(maps,door));
  return landingCache.get(key);
 };
 const root=panel(),body=card();root.append(body);document.body.append(root);
 let current,states={},index=0,entry=null,finished=false;
 const valid=s=>s&&Number.isInteger(s.index)&&maps[s.index]&&s.states&&Number.isFinite(s.entry?.x)&&Number.isFinite(s.entry?.y);
 function save(state){
  if(finished)return;
  states[index]=state;
  lsSet(key,{index,entry:{x:state.x,y:state.y,hp:state.hp,score:state.score},states});
 }
 function launch(i,spawn=null){
  root.style.display='none';index=i;entry=spawn;
  const m=maps[i];
  current=play2D({M:m,sheets,spawn:entry,restore:states[i],canUseDoor:landing,onSnapshot:save,published:!preview,
   onExit:()=>{current=null;menu();},
   onRetry:()=>{
    current.stop(true);states={};finished=false;lsSet(key,null);launch(first);
   },
   onResult:win=>{if(win){finished=true;lsSet(key,null);}},
   onDoor:d=>{
    const point=landing(d);if(!point)return;
    save(d.state);
    current.stop(true);
    launch(d.to,{...point,hp:d.hp,score:d.score});
   }});
 }
 function menu(){
  root.style.display='grid';
  const saved=lsGet(key,null);
  body.replaceChildren(el('h1',{style:'font:700 32px Georgia;margin:0 0 16px;color:#e8c25a'},data.studio.title),
   el('p',{class:'hint'},maps[first].cfg?.brief||'Bấm bản đồ hoặc dùng WASD để di chuyển.'),
   el('div',{class:'row',style:'margin-top:18px'},
    action('Chơi mới',async()=>{
     if(valid(saved)&&!await yes('Bắt đầu lượt mới và thay tiến độ đã lưu?'))return;
     states={};finished=false;lsSet(key,null);launch(first);
    }),
    ...(valid(saved)?[action('Tiếp tục',()=>{states=saved.states;finished=false;launch(saved.index,saved.entry);})]:[]),
    action('Điều khiển',()=>body.append(el('p',{class:'hint'},'Bấm đất hoặc WASD để đi · J / Space để nói chuyện hoặc đánh · E để tương tác với cửa gần nhân vật.'))),
    ...(preview?[action('Về Xưởng',()=>root.remove())]:[])));
 }
 menu();
}
