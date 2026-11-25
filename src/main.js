import {toggleShortcutHelp} from './editorHelp.js';
import {el,toast} from './util.js';
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
async function openPlan(tab){
  const editor=cur==='3d'?e3:e2;
  if(!editor||document.querySelector('.outline-overlay'))return;
  await editor.ready;
  if(editor===(cur==='3d'?e3:e2)&&editor.map()&&!document.querySelector('.outline-overlay'))openOutlineEditor(editor,tab);
}
$('#outlinebtn').onclick=()=>openPlan('shapes');
$('#levelbtn').onclick=()=>openPlan('levels');
$('#zipscenebtn').onclick=async()=>{go('2d');await e2.ready;e2.showStockScenes();};
$('#studiobtn').onclick=()=>{go('2d');if(e2.map())openStudio(e2);};
function shortcutHelp(){toggleShortcutHelp($(cur==='2d'?'#pn2':'#pn3'));}
$('#helpbtn').onclick=shortcutHelp;
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
