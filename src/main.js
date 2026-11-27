import {toggleShortcutHelp} from './editorHelp.js';
import {el,toast,idbGet} from './util.js';
import {openOutlineEditor} from './outlineEditor.js';
import {openStudio,runStudio,saveProjectFile} from './studio.js';
import {$,SELF,guessTile} from './util.js';window.__guess=guessTile;import('./anim.js').then(x=>{window.__fg=x.findGrid;});
import {init2D} from './ed2d.js';
import {init3D} from './ed3d.js';
import {play2D,playGame} from './play2d.js';
import {ensureAngle} from './proj.js';
import {play3D} from './play3d.js';
import {openRelease} from './release.js';
import {openCheck} from './check.js';
import A from '../assets/assets.json';
(function(){try{const sc=document.currentScript;const b=document.body.cloneNode(true);b.querySelectorAll('script').forEach(n=>n.remove());SELF.skel=b.innerHTML;SELF.css=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');SELF.js=sc?sc.textContent:'';}catch(e){}})();
const G=window.__GAME;
if(G){
  $('#app').style.display='none';document.body.style.background='#10161d';
  if(G.kind==='3d')play3D(G);
  else{const sheets=A.sheets.map(s=>Object.assign({},s)).concat((G.custom||[]).map(s=>Object.assign({},s)));
    Promise.all(sheets.map(s=>new Promise(r=>{const i=new Image();i.onload=()=>{s.img=i;s.cols=Math.floor((i.width+s.margin)/(s.tw+s.margin));s.rows=Math.floor((i.height+s.margin)/(s.tw+s.margin));r();};i.onerror=r;i.src=s.url;}))).then(async()=>{if((G.maps||[G]).some(m=>m.cfg?.proj==='angle'))await ensureAngle(sheets);return G.studio?runStudio(G,sheets):playGame({M:G,sheets});});}
}else{
const e2=init2D($('#v2d'),A);window.__e2=e2;let e3=null,cur='2d';
function go(v){cur=v;$('#v2d').style.display=v==='2d'&&$('#xuong-startup')?.hidden!==false?'flex':'none';$('#v3d').style.display=v==='3d'?'flex':'none';
  document.querySelectorAll('.tabbtn[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='3d'){
    try{if(!e3)e3=init3D($('#v3d'));window.__e3=e3;e3.show();}
    catch(e){console.error(e);go('2d');toast('Không mở được chế độ 3D. Hãy kiểm tra WebGL trên trình duyệt.');}
  }else{e3&&e3.hide();e2.show();}}
document.querySelectorAll('.tabbtn[data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v));
$('#playbtn').onclick=()=>{
  if(cur==='2d'){const d=e2.gameData();(async()=>{if((d.maps||[d]).some(m=>m.cfg?.proj==='angle'))await ensureAngle(e2.sheets());playGame({M:d,sheets:e2.sheets(),startMap:d.currentMap,onExit:()=>{}});})();}
  else{(async()=>{
    await e3.ready;
    if(cur!=='3d')return;
    try{e3.hide();play3D({onExit:()=>e3.show(),...e3.gameData()});}
    catch(e){e3.show();toast('Không mở được chế độ chơi 3D.');console.error(e);}
  })();}};
const gd=k=>k==='3d'?(e3||(e3=init3D($('#v3d')))).gameData():e2.gameData();
$('#chkbtn').onclick=()=>openCheck({kind:cur,getData:gd});
$('#relbtn').onclick=()=>openRelease({kind:cur,sheets:()=>e2.sheets(),exportMapPNG:e2.exportPNG,getData:k=>k==='3d'?(e3||(e3=init3D($('#v3d')))).gameData():e2.gameData()});
async function openPlan(tab,page='plan'){
  const editor=cur==='3d'?e3:e2;
  if(!editor||document.querySelector('.outline-overlay'))return;
  await editor.ready;
  if(editor===(cur==='3d'?e3:e2)&&editor.map()&&!document.querySelector('.outline-overlay'))openOutlineEditor(editor,tab,page);
}
$('#assemble2dbtn').onclick=()=>{
  if(document.querySelector('.outline-overlay'))return;
  if(cur!=='2d')go('2d');
  return openPlan('shapes','preview');
};
$('#outlinebtn').onclick=()=>openPlan('shapes');
$('#levelbtn').onclick=()=>openPlan('levels');
$('#zipscenebtn').onclick=async()=>{go('2d');await e2.ready;e2.showStockScenes();};
$('#studiobtn').onclick=()=>{go('2d');if(e2.map())openStudio(e2);};
function shortcutHelp(){toggleShortcutHelp($(cur==='2d'?'#pn2':'#pn3'));}
$('#helpbtn').onclick=shortcutHelp;
const searchButton=el('button',{type:'button',class:'tabbtn',title:'Tìm nhanh · Ctrl+K',onclick:openQuickSearch},'⌕ Tìm nhanh');
$('#bar h1').after(searchButton);
const searchItems=[
 ['Ráp Cảnh 2D','dựng cảnh bản đồ nền vật phẩm','#assemble2dbtn'],
 ['Dựng cảnh 3D','mô hình không gian','#bar [data-v="3d"]'],
 ['Đường Bao','mặt bằng cảnh ráp vật liệu mảnh ghép quản lý ZIP','#outlinebtn'],
 ['Màn mẫu','bố cục mẫu địa hình hầm ngục','#levelbtn'],
 ['Cảnh ZIP','nhập cảnh thư viện gói tài nguyên','#zipscenebtn'],
 ['Dự án game','lưu bản thiết kế tệp dự án','#studiobtn'],
 ['Chơi thử','chạy game di chuyển','#playbtn'],
 ['Kiểm tra bản đồ','va chạm lối đi','#chkbtn'],
 ['Phím tắt','hướng dẫn điều khiển','#helpbtn'],
 ['Xuất bản đồ và game','tải xuống ảnh PNG xuất file','#relbtn'],
 ['Dung lượng app','bộ nhớ lưu trữ giới hạn quota dữ liệu ZIP RAM nặng lag',openStorageStatus]
];
const normalizeFind=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d');
function toolDialog(title){
  const dialog=el('dialog',{style:'width:min(540px,92vw);max-height:80vh;box-sizing:border-box;background:#192834;color:#fff;border:1px solid #567180;border-radius:10px;padding:16px'});
  dialog.append(el('div',{class:'row'},el('strong',{style:'flex:1'},title),
    el('button',{type:'button',class:'tabbtn',onclick:()=>dialog.close()},'Đóng')));
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.append(dialog);
  return dialog;
}
let quickSearch=null;
function openQuickSearch(){
  if(quickSearch?.open){quickSearch.querySelector('input').focus();return;}
  const dialog=toolDialog('Tìm nhanh trong app');
  quickSearch=dialog;
  const input=el('input',{type:'search',placeholder:'Ví dụ: Đường Bao, ZIP, dung lượng…',
    'aria-label':'Tìm mục trong ứng dụng',style:'width:100%;box-sizing:border-box;margin:10px 0;padding:8px'});
  const results=el('div',{style:'display:grid;gap:5px'});
  function render(){
    const words=normalizeFind(input.value).trim().split(/\s+/).filter(Boolean);
    const matches=searchItems.filter(([label,tags])=>words.every(word=>normalizeFind(label+' '+tags).includes(word)));
    results.replaceChildren(...matches.map(([label,,action])=>el('button',{
      type:'button',class:'tabbtn',style:'text-align:left;white-space:normal',onclick:()=>{
        dialog.close();
        if(typeof action==='function')action();
        else $(action)?.click();
      }},label)));
    if(!matches.length)results.append(el('p',{class:'hint'},'Không tìm thấy mục phù hợp.'));
  }
  input.oninput=render;
  dialog.addEventListener('keydown',event=>{
    if(event.target===input&&event.key==='Enter'){
      event.preventDefault();results.querySelector('button')?.click();
    }else if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      const buttons=[...results.querySelectorAll('button')];
      if(!buttons.length)return;
      event.preventDefault();
      const index=buttons.indexOf(document.activeElement);
      const next=event.key==='ArrowDown'?Math.min(buttons.length-1,index+1):index-1;
      (next<0?input:buttons[next])?.focus();
    }
  });
  render();dialog.append(input,results);dialog.showModal();input.focus();
}
async function openStorageStatus(){
  const dialog=toolDialog('Dung lượng app');
  const content=el('div',{'aria-live':'polite'},el('p',{},'Đang đọc dung lượng…'));
  dialog.append(content);dialog.showModal();
  const bytes=value=>Number.isFinite(value)?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2})
    .format(value/(value>=1073741824?1073741824:1048576))+(value>=1073741824?' GiB':' MiB'):'Không có số liệu';
  const [estimate,zipIndex]=await Promise.all([
    Promise.resolve().then(()=>navigator.storage?.estimate?.()).catch(()=>null),
    idbGet('outline-zip-library-index-v1')
  ]);
  if(!dialog.isConnected)return;
  const zipSizes=Array.isArray(zipIndex)?zipIndex.map(id=>Number(String(id).split('|').at(-2))).filter(n=>Number.isFinite(n)&&n>=0):[];
  const use=estimate?.usage,limit=estimate?.quota;
  const rows=[
    ['Dữ liệu trang đang lưu',bytes(use)],
    ['Hạn mức trình duyệt ước tính',bytes(limit)],
    ['Dung lượng còn lại',bytes(Number.isFinite(use)&&Number.isFinite(limit)?Math.max(0,limit-use):NaN)],
    ['ZIP trong kho Đường Bao (gồm gói giữ cho thiết kế)',Array.isArray(zipIndex)?zipSizes.length+' gói · '+bytes(zipSizes.reduce((sum,size)=>sum+size,0)):'Chưa có danh mục ZIP']
  ];
  const table=el('dl',{style:'display:grid;grid-template-columns:1fr auto;gap:8px;margin:14px 0'},
    ...rows.flatMap(([label,value])=>[el('dt',{},label),el('dd',{style:'margin:0;text-align:right'},value)]));
  const details=[];
  if(Number.isFinite(use)&&limit>0){
    const percent=100*use/limit;
    details.push(el('p',{},'Đã dùng '+new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(percent)+'% hạn mức.'));
  }
  content.replaceChildren(...details,table,el('p',{class:'hint'},'Số liệu do trình duyệt ước tính cho trang này. Hạn mức có thể thay đổi. Dung lượng lưu khác với RAM và không đo độ mượt khi kéo hoặc vẽ.'));
}
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||!(event.ctrlKey||event.metaKey)||event.altKey||event.key.toLowerCase()!=='k')return;
  if(document.querySelector('dialog[open]')&&!quickSearch?.open)return;
  if(event.target?.closest?.('input,textarea,[contenteditable="true"]')&&!quickSearch?.open)return;
  event.preventDefault();openQuickSearch();
});
document.addEventListener('keydown',e=>{
  if(document.activeElement!==$('#cv2')||cur!=='2d'||e.defaultPrevented)return;
  if(e.key==='F1'){e.preventDefault();shortcutHelp();}
  if(e.key==='F5'){e.preventDefault();$('#playbtn').click();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&e2.map()){
    e.preventDefault();saveProjectFile(e2);
  }
});
go('2d');
e2.ready.then(()=>{window.dispatchEvent(new Event('xuong:ready'));if(cur==='2d')go('2d');},error=>{console.error(error);window.dispatchEvent(new Event('xuong:startup-error'));});
}
