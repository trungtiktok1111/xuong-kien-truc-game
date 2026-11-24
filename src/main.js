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
    Promise.all(sheets.map(s=>new Promise(r=>{const i=new Image();i.onload=()=>{s.img=i;s.cols=Math.floor((i.width+s.margin)/(s.tw+s.margin));s.rows=Math.floor((i.height+s.margin)/(s.tw+s.margin));r();};i.onerror=r;i.src=s.url;}))).then(()=>playGame({M:G,sheets}));}
}else{
const e2=init2D($('#v2d'),A);window.__e2=e2;let e3=null,cur='2d';
function go(v){cur=v;$('#v2d').style.display=v==='2d'?'flex':'none';$('#v3d').style.display=v==='3d'?'flex':'none';
  document.querySelectorAll('.tabbtn[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='3d'){if(!e3)e3=init3D($('#v3d'));window.__e3=e3;e3.show();}else{e3&&e3.hide();e2.show();}}
document.querySelectorAll('.tabbtn[data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v));
$('#playbtn').onclick=()=>{
  if(cur==='2d'){const d=e2.gameData();(async()=>{if(d.cfg&&d.cfg.proj==='angle')await ensureAngle(e2.sheets());playGame({M:d,sheets:e2.sheets(),onExit:()=>{}});})();}
  else{e3.hide();play3D(Object.assign({onExit:()=>e3.show()},e3.gameData()));}};
const gd=k=>k==='3d'?(e3||(e3=init3D($('#v3d')))).gameData():e2.gameData();
$('#chkbtn').onclick=()=>openCheck({kind:cur,getData:gd});
$('#relbtn').onclick=()=>openRelease({kind:cur,sheets:()=>e2.sheets(),getData:k=>k==='3d'?(e3||(e3=init3D($('#v3d')))).gameData():e2.gameData()});
go('2d');
}
