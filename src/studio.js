import {guideBox,appGuides} from './editorHelp.js';
import {el,ask,yes,pickFile,saveFile,gameHTML,toast,lsGet,lsSet} from './util.js';
import {check2D} from './check.js';
import {play2D} from './play2d.js';

const action=(label,onclick)=>el('button',{class:'b',type:'button',onclick},label);
const panel=()=>el('section',{style:'position:fixed;inset:0;z-index:190;overflow:auto;background:#101820f5;display:grid;place-items:center;padding:20px;touch-action:pan-y'});
const card=()=>el('div',{style:'width:min(560px,100%);padding:26px;background:#1e2b36;border:1px solid #50606a;border-radius:16px;box-shadow:0 12px 40px #0007'});
export function newMeta(title){return {title,id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)};}
function projectChecks(data){
 const maps=data.maps||[data];
 const problems=[];
 for(const [i,m] of maps.entries()){
  const name=m.name||'Màn '+(i+1);
  const rows=check2D(m);
  const exits=m.ents.filter(e=>e.t==='door');
  for(const r of rows){
   if(exits.length&&r.id==='F3'&&!m.ents.some(e=>e.t==='goal'))continue;
   if(r.st==='missing'||r.st==='broken')problems.push(name+' · '+r.txt);
  }
  const start=m.ents.find(e=>e.t==='start');
  const reachable=new Set();
  if(start&&!m.blk[start.y*m.w+start.x]){
   const q=[[start.x,start.y]];
   reachable.add(start.y*m.w+start.x);
   for(let k=0;k<q.length;k++){
    const [x,y]=q[k];
    for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
     const cell=b*m.w+a;
     if(a<0||b<0||a>=m.w||b>=m.h||reachable.has(cell)||m.blk[cell])continue;
     reachable.add(cell);q.push([a,b]);
    }
   }
  }
  for(const e of exits){
   if(!reachable.has(e.y*m.w+e.x))problems.push(name+' · không có đường tới cửa '+e.name);
   const dest=maps[e.to];
   if(!dest){problems.push(name+' · cửa '+e.name+' trỏ tới màn chưa có');continue;}
   const fallback=dest.ents.find(q=>q.t==='start');
   const x=e.tx??fallback?.x,y=e.ty??fallback?.y;
   if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=dest.w||y>=dest.h||dest.blk[y*dest.w+x])
    problems.push(name+' · điểm đến của cửa '+e.name+' bị chặn hoặc thiếu');
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
  body.replaceChildren(el('h2',{},meta.title),guideBox('project',appGuides.project),el('p',{class:'hint'},project.maps.length+' màn · Dự án game 2D'),
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
    action('Chơi thử',()=>{root.remove();runStudio(studioData(editor,meta),editor.sheets(),{preview:true});}),
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
 const maps=data.maps||[data];
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
  current=play2D({M:m,sheets,spawn:entry,restore:states[i],onSnapshot:save,published:!preview,
   onExit:()=>{current=null;menu();},
   onRetry:()=>{
    current.stop(true);states={};finished=false;lsSet(key,null);launch(0);
   },
   onResult:win=>{if(win){finished=true;lsSet(key,null);}},
   onDoor:d=>{
    const to=maps[d.to];if(!to)return;
    const start=to.ents.find(e=>e.t==='start');
    save(d.state);
    current.stop(true);
    launch(d.to,{x:(d.tx??start?.x??0)+.5,y:(d.ty??start?.y??0)+.5,hp:d.hp,score:d.score});
   }});
 }
 function menu(){
  root.style.display='grid';
  const saved=lsGet(key,null);
  body.replaceChildren(el('h1',{style:'font:700 32px Georgia;margin:0 0 16px;color:#e8c25a'},data.studio.title),
   el('p',{class:'hint'},maps[0].cfg?.brief||'Bấm bản đồ hoặc dùng WASD để di chuyển.'),
   el('div',{class:'row',style:'margin-top:18px'},
    action('Chơi mới',async()=>{
     if(valid(saved)&&!await yes('Bắt đầu lượt mới và thay tiến độ đã lưu?'))return;
     states={};finished=false;lsSet(key,null);launch(0);
    }),
    ...(valid(saved)?[action('Tiếp tục',()=>{states=saved.states;finished=false;launch(saved.index,saved.entry);})]:[]),
    action('Điều khiển',()=>body.append(el('p',{class:'hint'},'Bấm đất hoặc WASD để đi · J / Space để nói chuyện hoặc đánh · E để tương tác với cửa gần nhân vật.'))),
    ...(preview?[action('Về Xưởng',()=>root.remove())]:[])));
 }
 menu();
}
