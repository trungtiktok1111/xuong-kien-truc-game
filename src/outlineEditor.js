import {WALL_THICKNESS,WALL_MIN_THICKNESS,WALL_MAX_THICKNESS} from './wall2d.js';
import {DEFAULT_OUTLINE_WALL_HEIGHT,fitDraftGrid} from './outlineGrid.js';
import {captureOutlineTiles,placeOutlineTiles} from './outlineMaterials.js';
import {levelLibrary} from './outlineLevels.js';
import {play2D} from './play2d.js';
import {play3D} from './play3d.js';
import {fitGate3D,inOutline} from './outline3d.js';
import {combineOutline,ellipseLoop,fitShape,outlineShapes,rectangleLoop,cropOutline,moveOutline,corridorLoop,relatedLoops} from './outlineShapes.js';
import {guideBox,appGuides} from './editorHelp.js';
import {el,toast,yes} from './util.js';

export const MAX_MAP_SIDE=600;
export const OUTLINE_STONE={name:'Đường bao · nền đá',tw:16,margin:0,
 url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANUlEQVR4nGPsrEz5z0ABYGFgYGB48Pw9WZpv3X7AwESJ7QwMDKMGjBowagAUsDAwQHIVuQAAEyYKaVD5omkAAAAASUVORK5CYII='};
export {rasterOutline} from './mapCollision.js';
export function validOutline(loops,w,h){
 return Array.isArray(loops)&&loops.length<=128&&loops.reduce((n,loop)=>n+(loop?.length||0),0)<=12000&&loops.every(loop=>Array.isArray(loop)&&loop.length>=3&&loop.length<=1500&&loop.every(p=>
  Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=w&&p[1]>=0&&p[1]<=h));
}
let outlineClipboard=null;
export function openOutlineEditor(editor,initialTab='shapes'){
 const is3D=editor.kind==='3d';
 const map=editor.map(),minSide=is3D?16:4,maxSide=is3D?320:MAX_MAP_SIDE;
 const outlineLevels=levelLibrary(editor.builtinOutlineSample());
 let W=map.w,H=map.h,origin=[0,0];
 const copy=loops=>JSON.parse(JSON.stringify(loops));
 const original=copy(map.cfg.outline?.loops||[]);
 let loops=copy(original),stamps=[],pending=[],mode='select',picked=-1,drag=null;
 const undo=[],redo=[];
 let placement=null,previewAt=null,selection=null,levelDraft=null,activeTab=initialTab;
 let cursor=null;
 let gates=structuredClone(map.cfg.outline?.gates||[]),gatePreview=null;
 const gateWidth=el('input',{type:'number',min:1.5,max:16,step:.25,value:3,'aria-label':'Bề rộng cổng 3D'});
 const gateDest=el('select',{'aria-label':'Màn đích của cổng 3D'},el('option',{value:''},'Không chuyển màn'),...(editor.sceneChoices?.()||[]).map(m=>el('option',{value:m.id},m.name)));
 const originLevel=outlineLevels.find(level=>level.id===map.cfg.outlineTemplate)||
  outlineLevels.find(level=>level.sample&&level.w===map.w&&level.h===map.h&&JSON.stringify(level.loops)===JSON.stringify(original));
 const levelTiles=new Map();
 let applyButton,clearButton,restoreLevelButton,createLabel,tryLabel,commitBusy=false;
 const ov=el('section',{class:'outline-overlay',style:'position:fixed;inset:0;z-index:180;background:#101820f5;overflow:auto;display:grid;place-items:center;padding:16px;touch-action:pan-y'});
 const box=el('div',{class:'outline-workspace'});
 const aim=el('div',{class:'map-aim',hidden:true});
 const canvas=el('canvas',{width:'760',height:'465',style:'display:block;width:100%;height:auto;background:#141d24;border:1px solid #50606a;touch-action:none'});
 const c=canvas.getContext('2d'),status=el('p',{class:'hint'}),toolbar=el('div',{class:'row outline-tools'}),footer=el('div',{class:'row',style:'margin-top:10px'});
 let s,ox,oy,pan=null;
 const fitScale=()=>Math.min(720/W,425/H);
 function fitGrid(){s=fitScale();ox=(760-W*s)/2;oy=(465-H*s)/2;}
 fitGrid();
 const xp=x=>ox+x*s,yp=y=>oy+y*s,round=v=>Math.round(v*100)/100;
 const B=(t,f)=>el('button',{class:'b',type:'button',onclick:f},t);
 const clamp=(x,y)=>[round(Math.max(0,Math.min(W,x))),round(Math.max(0,Math.min(H,y)))];
 const operation=el('select',{'aria-label':'Cách đặt hình'},
  el('option',{value:'add'},'Thêm sàn'),el('option',{value:'cut'},'Khoét lỗ'),el('option',{value:'replace'},'Thay bản nháp'));
 const snap=el('input',{type:'checkbox'});
 const scale=el('select',{'aria-label':'Kích thước mẫu'},el('option',{value:'0.9'},'Lớn'),
  el('option',{value:'0.65'},'Vừa'),el('option',{value:'0.4'},'Nhỏ'),
  ...[8,16,32,64,128,256,512].filter(n=>n<=maxSide).map(n=>el('option',{value:''+n},n+' ô')));
 scale.value='0.9';
 const angle=el('input',{type:'number',value:0,step:1,'aria-label':'Góc xoay mẫu',class:'outline-num'});
 const gridWidth=el('input',{type:'number',min:minSide,max:maxSide,value:W,'aria-label':'Rộng bản đồ',class:'outline-num'});
 const gridHeight=el('input',{type:'number',min:minSide,max:maxSide,value:H,'aria-label':'Cao bản đồ',class:'outline-num'});
 const sizeLabel=el('span',{class:'hint','aria-live':'polite'});
 const viewLabel=el('span',{class:'hint'});
 const gridNote=el('p',{class:'hint outline-grid-note','aria-live':'polite'});
 const templateTiles=new Map();
 const angleValue=()=>Number.isFinite(+angle.value)?+angle.value%360:0;
 function refreshPreview(){if(placement&&!previewAt)previewAt=[W/2,H/2];draw();}
 function rotateBy(degrees){angle.value=(angleValue()+degrees+360)%360;refreshPreview();}
 angle.oninput=scale.onchange=refreshPreview;
 function resizeDraft(w,h){
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<minSide||h<minSide||w>maxSide||h>maxSide){
   gridNote.textContent='Nhập số nguyên từ '+minSide+' đến '+maxSide+' cho mỗi chiều.';return false;
  }
  if(w===W&&h===H){gridNote.textContent='';return true;}
  if(!validOutline(loops,w,h)){
   gridNote.textContent='Khung mới cắt qua đường bao. Hãy dời hình vào trong hoặc chọn số ô lớn hơn.';return false;
  }
  record();W=w;H=h;resetGridView();picked=-1;select('select');return true;
 }
 function resetGridView(){gridWidth.value=W;gridHeight.value=H;gridNote.textContent='';fitGrid();previewAt=null;}
 function fitBuiltGrid(){
  if(!loops.length){fitGrid();draw();gridNote.textContent='Dựng đường bao trước để tự thu lưới.';return;}
  const {bounds,keepOrigin}=editor.outlineGridBounds(levelDraft);
  const fitted=fitDraftGrid(loops,stamps,origin,W,H,bounds,keepOrigin);
  fitted.w=Math.max(minSide,fitted.w);fitted.h=Math.max(minSide,fitted.h);
  if(fitted.w!==W||fitted.h!==H||fitted.origin.some((v,i)=>v!==origin[i])){
   record();const dx=origin[0]-fitted.origin[0],dz=origin[1]-fitted.origin[1];
   gates=gates.map(g=>({...g,x:g.x+dx,z:g.z+dz}));({loops,stamps,origin,w:W,h:H}=fitted);
   resetGridView();picked=-1;select('select');
  }else{fitGrid();previewAt=null;draw();}
  gridNote.textContent='Lưới vừa phần đã dựng · '+W+' × '+H+' ô'+(keepOrigin?' · Giữ gốc tọa độ của cảnh.':'');
 }
 const readGrid=()=>resizeDraft(+gridWidth.value,+gridHeight.value);
 function zoom(factor,x=380,y=232.5){
  const next=Math.max(fitScale(),Math.min(Math.max(64,fitScale()),s*factor));
  if(next===fitScale()){fitGrid();return;}
  ox=x-(x-ox)*next/s;oy=y-(y-oy)*next/s;s=next;boundView();
 }
 function boundView(){
  ox=Math.max(24-W*s,Math.min(736,ox));oy=Math.max(24-H*s,Math.min(441,oy));
 }
 const screen=e=>{const r=canvas.getBoundingClientRect();return [760*(e.clientX-r.left)/r.width,465*(e.clientY-r.top)/r.height];};
 const width=el('input',{type:'number',min:'1',max:'32',step:'.5',value:'3','aria-label':'Bề rộng hành lang',style:'width:65px'});
 const corridorWidth=el('label',{},'Rộng ',width,' ô');
 const modeButtons=new Map();
 let undoButton,redoButton,copyButton,pasteButton,centerButton,scanMapButton;
 const point=e=>{const [a,b]=screen(e),x=(a-ox)/s,y=(b-oy)/s;return snap.checked||e.shiftKey?clamp(Math.round(x),Math.round(y)):clamp(x,y);};
 const points=loop=>{c.moveTo(xp(loop[0][0]),yp(loop[0][1]));for(const p of loop.slice(1))c.lineTo(xp(p[0]),yp(p[1]));};
 function draw(){
  c.clearRect(0,0,760,465);c.fillStyle='#17212b';c.fillRect(0,0,760,465);
  c.strokeStyle='#364956';c.lineWidth=1;c.beginPath();
  const stride=Math.max(1,Math.ceil(10/s));
  for(let x=Math.max(0,Math.floor(-ox/s/stride)*stride);x<=Math.min(W,(760-ox)/s);x+=stride){
   c.moveTo(xp(x),yp(0));c.lineTo(xp(x),yp(H));
  }
  for(let y=Math.max(0,Math.floor(-oy/s/stride)*stride);y<=Math.min(H,(465-oy)/s);y+=stride){
   c.moveTo(xp(0),yp(y));c.lineTo(xp(W),yp(y));
  }
  c.stroke();c.strokeRect(ox,oy,W*s,H*s);
  sizeLabel.textContent=W+' × '+H+' ô';
  viewLabel.textContent=Math.round(s/fitScale()*100)+'%';
  for(const [id,tile] of levelTiles)tile.setAttribute('aria-pressed',String(id===levelDraft?.id));
  if(applyButton){
   applyButton.disabled=commitBusy;
   applyButton.textContent=levelDraft?'Dùng mẫu cho màn hiện tại':'Áp dụng vào bản đồ';
  }
  if(clearButton)clearButton.hidden=!!levelDraft;
  if(restoreLevelButton)restoreLevelButton.hidden=!(levelDraft||originLevel);
  levelActions.hidden=!levelDraft;
  if(createLabel){createLabel.hidden=tryLabel.hidden=!!levelDraft&&activeTab==='levels';}
  if(levelDraft)levelHint.textContent=levelDraft.description;
  else levelHint.textContent='Bấm một màn để xem bố cục, chơi thử hoặc tạo bản sao.';
  for(const [id,tile] of templateTiles)tile.setAttribute('aria-pressed',String(id===placement?.template?.id));
  c.beginPath();
  for(const loop of loops){points(loop);c.closePath();}
  c.fillStyle=levelDraft?.color||map.cfg.outline?.color||'#607c75';c.fill('evenodd');
  for(let i=0;i<loops.length;i++){
   c.beginPath();points(loops[i]);c.closePath();c.strokeStyle=i===picked?'#f5c86e':'#b7d3c5';c.lineWidth=i===picked?2:1;c.stroke();
   if(i===picked)for(const [x,y] of loops[i]){c.fillStyle='#ffda91';c.fillRect(xp(x)-1.5,yp(y)-1.5,3,3);}
  }
  if(is3D&&(gates.length||mode==='gate'||mode==='ungate')){
   for(const g of [...gates,...(gatePreview?[gatePreview]:[])]){
    c.strokeStyle=g===gatePreview?'#f9cb6a':'#76dfbd';c.lineWidth=g===gatePreview?2:4;c.beginPath();
    c.moveTo(xp(g.x-g.axis[0]*g.width/2),yp(g.z-g.axis[1]*g.width/2));
    c.lineTo(xp(g.x+g.axis[0]*g.width/2),yp(g.z+g.axis[1]*g.width/2));c.stroke();
    if(g===gatePreview){c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();
     c.moveTo(xp(g.x),yp(0));c.lineTo(xp(g.x),yp(H));c.moveTo(xp(0),yp(g.z));c.lineTo(xp(W),yp(g.z));c.stroke();c.setLineDash([]);}
   }
  }
  for(const [label,x,y] of (levelDraft?levelDraft.areas:map.cfg.outline?.areas)||[]){
    c.font='bold 12px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#162028';
    c.strokeText(label,xp(x-origin[0]),yp(y-origin[1]));c.fillStyle='#f2e2b8';c.fillText(label,xp(x-origin[0]),yp(y-origin[1]));
   }
  if(levelDraft){
   for(const [p,label,color] of [[levelDraft.start,'A','#a9ecbf'],[levelDraft.goal,'B','#f5c36d']]){
    const x=xp(p[0]+.5-origin[0]),y=yp(p[1]+.5-origin[1]);
    c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.fillStyle=color;c.fill();
    c.fillStyle='#18252b';c.font='bold 11px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(label,x,y);
   }
  }
  function ghost(shape,tint='#8abbaa55'){
   c.beginPath();for(const loop of shape){if(loop.length){points(loop);c.closePath();}}
   c.fillStyle=tint;c.fill('evenodd');c.strokeStyle='#e9b865';c.stroke();
  }
  if(selection){
   c.save();c.setLineDash([5,3]);ghost([rectangleLoop(...selection)],'#6cb2de25');c.restore();
  }
  const preview=placement&&atPosition(previewAt||[W/2,H/2]);
  if(previewAt&&preview?.length)ghost(preview);
  if(pending.length){
   if(mode==='polygon'){
    c.beginPath();points(pending);c.strokeStyle='#e9b865';c.stroke();
    for(const [x,y] of pending){c.fillStyle='#e9b865';c.fillRect(xp(x)-2,yp(y)-2,4,4);}
   }else if(pending.length===2){
    const preview=dragLoop(pending[0],pending[1]);
    if(preview.length)ghost([preview],operation.value==='cut'&&mode!=='corridor'?'#ed8f8166':'#8abbaa66');
   }
  }
  aim.hidden=!cursor;
  if(cursor){
   const at=gatePreview?[gatePreview.x,gatePreview.z]:cursor;
   const edge=nearest(at),surface=edge?'Mép tường':inOutline(loops,...at)?'Sàn':'Ngoài sàn';
   let link='';
   if(mode==='corridor'&&pending.length===2){
    const connected=pending.every(q=>inOutline(loops,...q));
    link=connected?' · Hai đầu bám sàn':' · Còn đầu ngoài sàn';
   }
   aim.textContent=(gatePreview?'Bám tường':surface)+' · X '+at[0].toFixed(2)+' · '+(is3D?'Z ':'Y ')+at[1].toFixed(2)+link;
   const [x,y]=at;
   c.save();c.strokeStyle='#e8d69e99';c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();
   c.moveTo(xp(x),yp(0));c.lineTo(xp(x),yp(H));c.moveTo(xp(0),yp(y));c.lineTo(xp(W),yp(y));c.stroke();c.restore();
  }
  const op=operation.selectedOptions[0].textContent;
  status.textContent=placement?(placement.name+' · '+angleValue()+'° · '+
   (preview.length?'Bấm để đặt. Q/E xoay 15°. Esc để thoát.':'Hình vượt lưới. Hãy chọn cỡ khác, đổi góc hoặc mở rộng lưới.')) :
   mode==='scan'?(is3D?'Quét phần mặt bằng để sao chép.':'Quét để lấy đường bao và các lớp ô hình, rồi bấm Sao chép hoặc Ctrl+C.'):
   mode==='gate'?'Bấm cạnh thẳng đủ dài để lắp cổng. Chọn màn đích nếu muốn nối cảnh.':
   mode==='corridor'?'Kéo từ bên trong phòng này tới bên trong phòng kia để nối.':
   mode==='polygon'?op+' · Bấm từng đỉnh, nhấn Enter hoặc bấm Khép đường.':
   mode==='ellipse'||mode==='rect'?op+' · Kéo từ một góc sang góc đối diện, rồi nhả chuột.':
   mode==='move'?'Kéo mép để di chuyển cả hình và các lỗ bên trong.':
   levelDraft?levelDraft.name+' · A xuất phát · B đích. Dùng mẫu cho màn hiện tại hoặc tạo bản sao.':
   'Kéo mẫu từ bên phải vào mặt bằng, hoặc bấm mẫu rồi bấm vị trí đặt.';
  corridorWidth.hidden=mode!=='corridor';
  if(copyButton)copyButton.disabled=!selection;
  if(scanMapButton)scanMapButton.hidden=!selection;
  if(pasteButton)pasteButton.disabled=!outlineClipboard;
  if(centerButton){centerButton.hidden=!placement;centerButton.disabled=!!placement&&!preview.length;}
  for(const [name,button] of modeButtons)button.setAttribute('aria-pressed',String(name===mode));
  if(undoButton)undoButton.disabled=!undo.length;
  if(redoButton)redoButton.disabled=!redo.length;
 }
 function dragLoop(a,b){
  if(mode==='corridor')return corridorLoop(a,b,Math.max(1,Math.min(32,Number(width.value)||3))/2);
  const rx=Math.abs(b[0]-a[0])/2,ry=Math.abs(b[1]-a[1])/2;
  if(rx<.25||ry<.25)return [];
  if(mode==='rect')return [a,[b[0],a[1]],b,[a[0],b[1]]];
  return ellipseLoop((a[0]+b[0])/2,(a[1]+b[1])/2,rx,ry);
 }
 function select(next){pending=[];placement=null;previewAt=null;selection=null;mode=next;gatePreview=null;draw();}
 function draft(previous=loops){return {loops:copy(previous),w:W,h:H,level:levelDraft,stamps,origin,gates,front:front.value,rear:rear.value,thickness:thickness.value,collision:collision.checked};}
 function record(previous=loops){undo.push(draft(previous));if(undo.length>40)undo.shift();redo.length=0;}
 function travel(from,to){
  if(!from.length)return;
  to.push(draft());const next=from.pop();
  const resized=next.w!==W||next.h!==H||next.origin!==origin;
  loops=next.loops;stamps=next.stamps;W=next.w;H=next.h;origin=next.origin;gates=next.gates;levelDraft=next.level;front.value=next.front;rear.value=next.rear;thickness.value=next.thickness;collision.checked=next.collision;
  if(resized)resetGridView();
  picked=-1;select('select');
 }
 function add(shape,choice=operation.value,keep=false,stamp=[]){
  try{
   const next=(choice==='replace'?shape:combineOutline(loops,shape,choice))
    .map(loop=>loop.map(([x,y])=>clamp(x,y)));
   if(!validOutline(next,W,H))throw Error('Hình quá phức tạp hoặc vượt khung.');
   if(!stamp.length&&JSON.stringify(loops)===JSON.stringify(next)){toast('Hình nằm ngoài vùng cần sửa hoặc sàn đã phủ khu này.');select('select');return;}
   record();loops=next;if(choice==='replace')stamps=[];if(stamp.length)stamps=[...stamps,stamp];picked=-1;if(keep)draw();else select('select');
  }catch(e){toast(e.message||'Không ghép được hình.');}
 }
 function armTemplate(shape){
  select('select');placement={name:shape.name,template:shape};refreshPreview();
 }
 function atPosition(p,withTiles=false){
  const m=placement;
  if(!m)return [];
  const origin=m.template?[0,0]:m.origin;
  const d=angleValue()*Math.PI/180,c=Math.cos(d),s=Math.sin(d);
  const size=Number(scale.value);
  let shape=m.template?fitShape(m.template,size>=1?size:Math.min(W,48)*size,size>=1?size:Math.min(H,48)*size):m.loops;
  if(m.template){
   const pts=shape.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
   const x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;
   const extent=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
   const unit=size>=1?size/extent:1;
   shape=shape.map(loop=>loop.map(([a,b])=>[(a-x)*unit,(b-y)*unit]));
  }
  shape=shape.map(loop=>loop.map(([x,y])=>[
   origin[0]+c*(x-origin[0])-s*(y-origin[1]),origin[1]+s*(x-origin[0])+c*(y-origin[1])]));
  const pts=shape.flat(),xs=pts.map(v=>v[0]),ys=pts.map(v=>v[1]);
  const ratio=Math.min(W/(Math.max(...xs)-Math.min(...xs)),H/(Math.max(...ys)-Math.min(...ys)));
  if(ratio<1){
   if(!m.template||size>=1)return [];
   shape=shape.map(loop=>loop.map(([x,y])=>[x*ratio,y*ratio]));
  }
  if(m.template)return moveOutline(shape,p[0]-origin[0],p[1]-origin[1],W,H);
  const canSnapX=Math.ceil(-Math.min(...xs))<=Math.floor(W-Math.max(...xs));
  const canSnapY=Math.ceil(-Math.min(...ys))<=Math.floor(H-Math.max(...ys));
  const offset=(p,min,max,size,snap)=>snap?Math.max(Math.ceil(-min),Math.min(Math.floor(size-max),Math.round(p))):Math.max(-min,Math.min(size-max,p));
  const dx=offset(p[0]-origin[0],Math.min(...xs),Math.max(...xs),W,canSnapX);
  const dy=offset(p[1]-origin[1],Math.min(...ys),Math.max(...ys),H,canSnapY);
  const placed=shape.map(loop=>loop.map(([x,y])=>[x+dx,y+dy]));
  if(!withTiles)return placed;
  if(is3D)return [];
  const target=editor.sheets();
  const ids=new Map();
  const remap=value=>{
   if(!value)return 0;
   const sid=(value-1)>>15;
   if(!ids.has(sid)){
    const src=m.sheets[sid];
    const i=target.findIndex(sh=>sh===src||(src&&sh.url===src.url&&sh.tw===src.tw&&sh.margin===src.margin));
    if(i<0)throw Error('Màn đích thiếu bộ ô hình '+(src?.name||'đã sao chép')+'. Hãy nạp lại bộ hình trước khi dán.');
    ids.set(sid,i);
   }
   return ids.get(sid)*32768+(value-1)%32768+1;
  };
  return placeOutlineTiles(m.cells,placed,{x:origin[0],y:origin[1],dx,dy,c,s},W,H,remap);
 }
 function commitPlacement(p){
  const shape=atPosition(p);if(!shape.length){toast('Hình vượt lưới ở góc này. Hãy đổi góc, đổi cỡ hoặc mở rộng lưới.');return;}
  try{
   const stamp=placement.template?[]:atPosition(p,true);
   add(shape,placement.template?operation.value:'add',!placement.template,stamp);
  }catch(e){toast(e.message);}
 }
 function scanContents(){
  if(!selection)return null;
  const [a,b]=selection,part=cropOutline(loops,a,b);
  if(!part.length){toast('Vùng quét chưa có sàn để sao chép.');return;}
  return {name:'Vùng đã sao chép',loops:part,origin:[(a[0]+b[0])/2,(a[1]+b[1])/2],
   cells:is3D?new Map():captureOutlineTiles(part,levelDraft?null:map,stamps,W,H,origin),sheets:is3D?[]:editor.sheets().slice()};
 }
 function copyScan(){
  const captured=scanContents();if(!captured)return;
  outlineClipboard=captured;
  draw();toast('Đã sao chép đường bao và các lớp ô hình. Bấm Dán hoặc Ctrl+V rồi chọn vị trí.');
 }
 function armClipboard(){
  if(!outlineClipboard)return;
  select('select');placement=outlineClipboard;draw();
 }
 function transformPicked(factor,angle){
  const group=relatedLoops(loops,picked);if(!group.length){toast('Bấm mép để chọn hình trước.');return;}
  const pts=loops[picked],xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;
  const c=Math.cos(angle)*factor,s=Math.sin(angle)*factor;
  const next=copy(loops);
  for(const i of group)next[i]=loops[i].map(([a,b])=>[round(x+c*(a-x)-s*(b-y)),round(y+s*(a-x)+c*(b-y))]);
  if(!validOutline(next,W,H)){toast('Hình vượt khung. Hãy dời hình vào trong trước.');return;}
  record();loops=next;draw();
 }
 function rotateAll(deg){
  if(!loops.length){toast('Chưa có đường bao.');return;}
  const a=deg*Math.PI/180,pts=loops.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2,c=Math.cos(a),sn=Math.sin(a);
  let next=loops.map(l=>l.map(([u,v])=>[x+c*(u-x)-sn*(v-y),y+sn*(u-x)+c*(v-y)]));
  const q=next.flat(),mx=Math.min(...q.map(p=>p[0])),Mx=Math.max(...q.map(p=>p[0])),my=Math.min(...q.map(p=>p[1])),My=Math.max(...q.map(p=>p[1]));
  let dx=0,dy=0;if(mx<1)dx=1-mx;else if(Mx>W-1)dx=W-1-Mx;if(my<1)dy=1-my;else if(My>H-1)dy=H-1-My;
  next=next.map(l=>l.map(([u,v])=>[round(u+dx),round(v+dy)]));
  if(!validOutline(next,W,H)){toast('Xoay xong vượt khung. Hãy tăng cỡ lưới hoặc thu nhỏ bản đồ trước.');return;}
  record();loops=next;draw();toast('Đã xoay cả bản đồ '+deg+'°');
 }
 function finish(){if(pending.length<3){toast('Cần ít nhất ba đỉnh.');return;}add([pending.slice()]);}
 function nearest(p){
  let best=null,dist=10/s;
  for(let i=0;i<loops.length;i++)for(let j=0;j<loops[i].length;j++){
   const a=loops[i][j],b=loops[i][(j+1)%loops[i].length],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
   const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
   const d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
   if(d<dist){dist=d;best=[i,t>.5?(j+1)%loops[i].length:j];}
  }
  return best;
 }
 canvas.onpointerdown=e=>{
  cursor=point(e);
  if(is3D&&e.button===0&&(mode==='gate'||mode==='ungate')){gateClick(point(e));return;}
  if(e.button===1){
   e.preventDefault();pan=screen(e);canvas.setPointerCapture?.(e.pointerId);return;
  }
  if(e.button!=null&&e.button!==0)return;
  box.focus({preventScroll:true});
  const p=point(e);
  if(placement){commitPlacement(p);return;}
  if(mode==='polygon'){pending.push(p);draw();return;}
  if(mode==='scan'){drag={start:p,scan:true};selection=[p,p];}
  else if(['ellipse','rect','corridor'].includes(mode)){drag={start:p};pending=[p,p];}
  else{
   const q=nearest(p);picked=q?q[0]:-1;
   drag=q?{index:q,start:p,old:copy(loops),move:mode==='move'}:null;
  }
  if(drag)canvas.setPointerCapture?.(e.pointerId);
  draw();
 };
 canvas.onpointermove=e=>{
  cursor=point(e);
  if(is3D&&mode==='gate'&&e.buttons===0){
   const p=point(e);gatePreview=hitGate(p);
   const at=gatePreview?[gatePreview.x,gatePreview.z]:p;
   const gStatus=toolbar.querySelector('#gate-plan-status');
   if(gStatus)gStatus.textContent=(gatePreview?'Bám tường · ':'Cần cạnh thẳng · ')+'X '+at[0].toFixed(2)+' · Z '+at[1].toFixed(2);
   draw();return;
  }
  if(pan){
   const next=screen(e);ox+=next[0]-pan[0];oy+=next[1]-pan[1];pan=next;boundView();draw();return;
  }
  const p=point(e);
  if(placement){previewAt=p;draw();return;}
  if(!drag){draw();return;}
  if(drag.scan){selection=[drag.start,p];draw();return;}
  if(drag.index){
   const [i,j]=drag.index;
   if(drag.move){
    const group=relatedLoops(drag.old,i),moved=moveOutline(group.map(k=>drag.old[k]),
      p[0]-drag.start[0],p[1]-drag.start[1],W,H);
    for(let j=0;j<group.length;j++)loops[group[j]]=moved[j].map(pt=>clamp(...pt));
   }else loops[i][j]=p;
  }else pending=[drag.start,p];
  draw();
 };
 canvas.onpointerup=e=>{
  if(pan){pan=null;return;}
  const p=point(e),d=drag;drag=null;
  if(!d)return;
  if(d.scan){selection=[d.start,p];draw();return;}
  if(d.index){
   if(JSON.stringify(d.old)!==JSON.stringify(loops))record(d.old);
   draw();return;
  }
  pending=[];const loop=dragLoop(d.start,p);
  if(loop.length)add(mode==='corridor'?cropOutline([loop],[0,0],[W,H]):[loop],mode==='corridor'?'add':operation.value);else draw();
 };
 canvas.onpointerleave=()=>{cursor=null;gatePreview=null;if(placement)previewAt=null;draw();};
 canvas.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.25:.8,...screen(e));if(placement)previewAt=point(e);draw();};
 canvas.onpointercancel=()=>{pan=null;if(drag?.old)loops=drag.old;drag=null;pending=[];draw();};
 box.onkeydown=e=>{
   if(e.target?.matches('input,select,textarea'))return;
   if(e.key==='Enter'&&mode==='polygon'&&e.target.tagName!=='BUTTON'){e.preventDefault();finish();}
   else if(placement&&!e.ctrlKey&&!e.metaKey&&['q','e'].includes(e.key.toLowerCase())){
    e.preventDefault();rotateBy(e.key.toLowerCase()==='q'?-15:15);
   }
   else if(e.key==='Escape'&&placement){e.preventDefault();select('select');}
   else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&selection){e.preventDefault();copyScan();}
   else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'&&outlineClipboard){e.preventDefault();armClipboard();}
   else if(e.key==='Escape'&&(pending.length||drag)){e.preventDefault();canvas.onpointercancel();}
   else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){
    e.preventDefault();e.shiftKey?travel(redo,undo):travel(undo,redo);
   }
 };
 box.tabIndex=-1;
 operation.onchange=draw;
 const front=el('input',{type:'number',min:'0',max:'4',step:'.05',value:map.cfg.outline?.front??DEFAULT_OUTLINE_WALL_HEIGHT,style:'width:68px'});
 const rear=el('input',{type:'number',min:'0',max:'4',step:'.05',value:map.cfg.outline?.rear??DEFAULT_OUTLINE_WALL_HEIGHT,style:'width:68px'});
 const thickness=el('input',{type:'number',min:WALL_MIN_THICKNESS,max:WALL_MAX_THICKNESS,step:'.01',
  value:map.cfg.outline?.thickness??WALL_THICKNESS,style:'width:68px'});
 const collision=el('input',{type:'checkbox'});collision.checked=map.cfg.outline?.floorCollision!==false;
 for(const [key,label] of [['select','Chỉnh điểm'],['move','Di chuyển đường'],['polygon','Đa giác'],['rect','Chữ nhật'],['ellipse','Hình elip'],['scan','Quét chọn'],['corridor','Nối hành lang']]){
  const button=B(label,()=>select(key));modeButtons.set(key,button);toolbar.append(button);
 }
 toolbar.append(B('Khép đường',finish),
  B('Xóa đường đã chọn',()=>{if(picked>=0){record();loops.splice(picked,1);picked=-1;draw();}}));
 copyButton=B('Sao chép',copyScan);pasteButton=B('Dán',armClipboard);
 scanMapButton=B('Tạo màn từ vùng quét',createScannedMap);
 centerButton=B('Đặt giữa',()=>commitPlacement([W/2,H/2]));
 toolbar.append(copyButton,pasteButton,scanMapButton,corridorWidth,centerButton);
 if(is3D)toolbar.append(B('Lắp cổng 3D',()=>select('gate')),B('Gỡ cổng 3D',()=>select('ungate')),
   el('label',{},'Rộng cổng ',gateWidth),gateDest,el('small',{class:'hint',id:'gate-plan-status'}));
 function hitGate(p){
  const width=Number(gateWidth.value);
  if(width<1.5||width>16||!Number.isFinite(width))return null;
  const g=fitGate3D({loops,thickness:Number(thickness.value)},p,width,Math.min(1.5,10/s));
  if(!g||gates.some(a=>Math.hypot(a.x-g.x,a.z-g.z)<(a.width+width)/2+.25))return null;
  return g;
 }
 function gateClick(p){
  if(mode==='ungate'){
   const g=gates.find(g=>Math.hypot(g.x-p[0],g.z-p[1])<Math.max(.8,g.width/2));
   if(g){record();gates=gates.filter(a=>a!==g);draw();}
   return;
  }
  const g=hitGate(p);
  if(!g){
   const gate=gates.find(a=>Math.hypot(a.x-p[0],a.z-p[1])<Math.min(1.25,8/s));
   if(gate){record();gates=gates.map(a=>a===gate?{...a,to:gateDest.value||null}:a);draw();toast('Đã cập nhật màn đích của cổng.');}
   else toast('Chọn cạnh thẳng, đủ dài và cách cổng hiện có.');
   return;
  }
  record();gates=[...gates,{...g,id:crypto.randomUUID(),to:gateDest.value||null}];gatePreview=null;draw();
 }

 const userAngle=el('input',{type:'number',value:15,step:1,'aria-label':'Góc xoay tùy chọn',class:'outline-num'});
 const editShape=el('details',{open:true},el('summary',{},'Chỉnh hình đã chọn'),
  el('p',{class:'hint'},'Bấm mép để chọn hình. Di chuyển, xoay và đổi cỡ giữ cả lỗ bên trong.'),
  el('div',{class:'row'},B('Thu nhỏ',()=>transformPicked(.8,0)),B('Phóng lớn',()=>transformPicked(1.25,0)),
   B('Xoay trái 90°',()=>transformPicked(1,-Math.PI/2)),B('Xoay phải 90°',()=>transformPicked(1,Math.PI/2))),
  el('div',{class:'row'},el('label',{},'Góc tùy chọn ',userAngle,'°'),
   B('Xoay hình đã chọn',()=>transformPicked(1,(Number(userAngle.value)||0)*Math.PI/180)),
   B('Xoay cả bản đồ',()=>rotateAll(Number(userAngle.value)||0))));
 undoButton=B('Hoàn tác',()=>travel(undo,redo));redoButton=B('Làm lại',()=>travel(redo,undo));
 const setup=el('div',{class:'row outline-setup'},el('label',{},'Cách đặt ',operation),el('label',{},snap,' Bám 1 ô'),
  undoButton,redoButton,B('Khôi phục lúc mở',()=>{
   record();loops=copy(original);stamps=[];gates=structuredClone(map.cfg.outline?.gates||[]);W=map.w;H=map.h;origin=[0,0];levelDraft=null;
   front.value=map.cfg.outline?.front??DEFAULT_OUTLINE_WALL_HEIGHT;rear.value=map.cfg.outline?.rear??DEFAULT_OUTLINE_WALL_HEIGHT;thickness.value=map.cfg.outline?.thickness??WALL_THICKNESS;collision.checked=map.cfg.outline?.floorCollision!==false;
   resetGridView();picked=-1;select('select');
  }));
 const presets=el('select',{'aria-label':'Cỡ lưới nhanh'},el('option',{value:''},'Cỡ nhanh'),
  ...[[32,24],[48,36],[64,48],[128,96],[256,192],[512,384],[600,600]].map(([w,h])=>
   el('option',{value:w+'x'+h},w+' × '+h)));
 presets.onchange=()=>{
  if(!presets.value)return;
  [gridWidth.value,gridHeight.value]=presets.value.split('x');readGrid();presets.value='';
 };
 const gridSetup=el('form',{class:'row outline-grid-size',novalidate:''},
  el('strong',{},'Lưới'),el('label',{},'Rộng ',gridWidth),el('label',{},'Cao ',gridHeight),
  el('button',{class:'b',type:'submit'},'Đổi số ô'),presets);
 gridSetup.onsubmit=e=>{e.preventDefault();readGrid();};
 const viewTools=el('div',{class:'row outline-view-tools'},sizeLabel,
  B('−',()=>{zoom(.8);previewAt=null;draw();}),viewLabel,B('+',()=>{zoom(1.25);previewAt=null;draw();}),
  B('Vừa lưới',fitBuiltGrid),el('span',{class:'hint'},'Cuộn để zoom · Giữ và kéo chuột giữa'));
 const groups=['Tất cả','Phòng','Sân và thành','Lối đi'];
 const category=el('select',{'aria-label':'Nhóm mẫu'},...groups.map(v=>el('option',{value:v},v)));
 const patterns=el('div',{class:'outline-patterns'});
 category.onchange=()=>{
  for(const shape of outlineShapes)templateTiles.get(shape.id).hidden=category.value!=='Tất cả'&&shape.group!==category.value;
  patterns.scrollTop=0;
 };
 for(const shape of outlineShapes){
  const icon=el('canvas',{width:76,height:47,'aria-hidden':'true'}),ctx=icon.getContext('2d');
  ctx.beginPath();
  for(const loop of fitShape({...shape,square:true},76,47,.97)){
   ctx.moveTo(...loop[0]);for(const pt of loop.slice(1))ctx.lineTo(...pt);ctx.closePath();
  }
  ctx.fillStyle='#71978b';ctx.fill('evenodd');ctx.strokeStyle='#b3d9c6';ctx.stroke();
  const tile=el('button',{type:'button',class:'outline-template',draggable:'true','data-template':shape.id,
     onclick:()=>armTemplate(shape)},icon,el('span',{},shape.name));
  tile.ondragstart=e=>{
   armTemplate(shape);
   e.dataTransfer?.setData('application/x-outline-template',shape.id);
   if(e.dataTransfer)e.dataTransfer.effectAllowed='copy';
  };
  tile.ondragend=()=>{previewAt=null;draw();};
  templateTiles.set(shape.id,tile);patterns.append(tile);
 }
 canvas.ondragover=e=>{
  if(!placement?.template)return;
  e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';
  previewAt=point(e);draw();
 };
 canvas.ondragleave=()=>{previewAt=null;draw();};
 canvas.ondrop=e=>{
  const id=e.dataTransfer?.getData('application/x-outline-template');
  if(!placement?.template||id!==placement.template.id)return;
  e.preventDefault();commitPlacement(point(e));
 };
 const shapePanel=el('div',{class:'outline-shape-panel'},
  el('div',{class:'row'},category,el('label',{},'Cỡ ',scale)),
  el('div',{class:'row outline-rotation'},el('label',{},'Góc ',angle,'°'),
   B('−90°',()=>rotateBy(-90)),B('+90°',()=>rotateBy(90))),
  patterns);
 function loadLevel(level){
  if(!level||commitBusy)return;
  record();levelDraft=level;loops=copy(level.loops);stamps=[];gates=[];W=level.w;H=level.h;origin=[0,0];
  front.value=level.sample?.cfg.outline.front??level.height??DEFAULT_OUTLINE_WALL_HEIGHT;rear.value=level.sample?.cfg.outline.rear??level.height??DEFAULT_OUTLINE_WALL_HEIGHT;thickness.value=level.sample?.cfg.outline.thickness??WALL_THICKNESS;collision.checked=true;
  resetGridView();picked=-1;select('select');
 }
 const levelHint=el('p',{class:'hint'},'Bấm một màn để xem bố cục, chơi thử hoặc tạo bản sao.');
 const levelCards=el('div',{class:'outline-levels'});
 const levelGroup=el('select',{'aria-label':'Nhóm màn mẫu'},
  ...['Tất cả',...new Set(outlineLevels.map(level=>level.group))].map(v=>el('option',{value:v},v)));
 levelGroup.onchange=()=>{
  for(const level of outlineLevels)levelTiles.get(level.id).hidden=levelGroup.value!=='Tất cả'&&level.group!==levelGroup.value;
  levelCards.scrollTop=0;
 };
 for(const level of outlineLevels){
  const icon=el('canvas',{width:92,height:58,'aria-hidden':'true'}),ctx=icon.getContext('2d');
  const z=Math.min(86/level.w,52/level.h),x=(92-level.w*z)/2,y=(58-level.h*z)/2;
  const project=([a,b])=>[x+a*z,y+b*z];
  ctx.beginPath();
  for(const loop of level.loops){ctx.moveTo(...project(loop[0]));for(const pt of loop.slice(1))ctx.lineTo(...project(pt));ctx.closePath();}
  const colors={'Hầm ngục':'#7f9aa7','Sân và thành':'#8baa8f','Cầu và lối đi':'#b69978','Bố cục phức tạp':'#85b2a7'};
  ctx.fillStyle=level.color||colors[level.group];ctx.fill('evenodd');ctx.strokeStyle='#d4dedc';ctx.stroke();
  for(const [p,color] of [[level.start,'#b0f2bc'],[level.goal,'#ffcc7b']]){
   ctx.beginPath();ctx.arc(...project(p),2.3,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();
  }
  const card=el('button',{type:'button',class:'outline-template','data-level':level.id,onclick:()=>loadLevel(level)},
   icon,el('strong',{},level.name),el('small',{},level.w+' × '+level.h+' ô'+(level.sample?' · Mẫu gốc':'')));
  levelTiles.set(level.id,card);levelCards.append(card);
 }
 restoreLevelButton=B('Nạp lại mẫu gốc',()=>loadLevel(levelDraft||originLevel));
 const levelActions=el('div',{class:'row outline-level-actions'},
  B('Chơi thử mẫu',playDraft),B('Tạo bản sao',()=>createDraft()),
  is3D?null:B('Tạo và nối với màn hiện tại',()=>createDraft(true)));
 const levelPanel=el('div',{class:'outline-level-panel'},el('div',{class:'row'},levelGroup,restoreLevelButton),levelHint,levelActions,levelCards);
 const shapesTab=B('Mảnh ghép',()=>{setTab('shapes');draw();}),levelsTab=B('Màn mẫu · '+outlineLevels.length,()=>{setTab('levels');draw();});
 function setTab(tab){
  activeTab=tab;const levels=tab==='levels';levelPanel.hidden=!levels;shapePanel.hidden=levels;
  levelsTab.setAttribute('aria-pressed',String(levels));shapesTab.setAttribute('aria-pressed',String(!levels));
 }
 const library=el('aside',{class:'outline-library'},el('div',{class:'row'},shapesTab,levelsTab),shapePanel,levelPanel);
 setTab(initialTab);
 footer.append(el('label',{},'Tường trước ',front),el('label',{},'Tường sau ',rear),el('label',{},'Độ dày tường bao ',thickness,' ô'),el('label',{},collision,' Cập nhật vùng chặn'));
 const buttons=el('div',{class:'row outline-actions'});
 const outlineData=()=>({loops:copy(loops),front:+front.value,rear:+rear.value,thickness:+thickness.value,
  areas:((levelDraft?levelDraft.areas:map.cfg.outline?.areas)||[]).map(([n,x,y])=>[n,x-origin[0],y-origin[1]]),
  color:levelDraft?.color||map.cfg.outline?.color,
  ...(is3D?{gates:copy(gates),floorCollision:collision.checked}:{})});
 async function runAction(action,close){
  if(commitBusy||!readGrid())return;
  commitBusy=true;
  const actions=[...buttons.children,...levelActions.children,scanMapButton];actions.forEach(b=>{b.disabled=true;});
  try{const result=await action();if(close&&result!==false)ov.remove();}
  catch(e){toast(e.message);}
  finally{commitBusy=false;actions.forEach(b=>{b.disabled=false;});draw();}
 }
 applyButton=B('Áp dụng vào bản đồ',()=>runAction(async()=>{
  if(levelDraft){
   const name=map.name||'màn hiện tại';
   if(!await yes('Dùng mẫu “'+levelDraft.name+'” cho “'+name+'”?\nBố cục, ô hình, vật thể và luật của màn này sẽ được thay bằng mẫu. Bạn có thể hoàn tác sau khi áp dụng.'))return false;
   await editor.replaceWithOutlineMap(outlineData(),W,H,levelDraft,stamps,origin);
   return;
  }
  if(!loops.length&&original.length)throw Error('Hãy tạo đường bao hoặc dùng Bỏ lớp đường bao.');
  if(!loops.length&&W===map.w&&H===map.h)throw Error('Hãy tạo đường bao hoặc đổi số ô.');
  if(loops.length)await editor.applyOutline(outlineData(),collision.checked,W,H,stamps,origin);
  else editor.resizeOutlineGrid(W,H);
 },true));
 function createScannedMap(){
  const scan=scanContents();if(!scan)return;
  const pts=scan.loops.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const dx=2-Math.floor(Math.min(...xs)),dy=2-Math.floor(Math.min(...ys));
  const w=Math.max(minSide,Math.min(maxSide,Math.ceil(Math.max(...xs))+dx+2));
  const h=Math.max(minSide,Math.min(maxSide,Math.ceil(Math.max(...ys))+dy+2));
  const placed=moveOutline(scan.loops,dx,dy,w,h);
  const actualX=placed[0][0][0]-scan.loops[0][0][0],actualY=placed[0][0][1]-scan.loops[0][0][1];
  const stamp=placeOutlineTiles(scan.cells,placed,{x:0,y:0,dx:actualX,dy:actualY,c:1,s:0},w,h,v=>v);
  return runAction(()=>editor.newOutlineMap({...outlineData(),gates:[],loops:placed},w,h,null,[stamp],[0,0],false),true);
 }
 const dressing=el('input',{type:'checkbox','aria-label':'Tự phối vật liệu'});
 const kenney=el('input',{type:'checkbox',checked:'','aria-label':'Dùng bốn gói Kenney'});
 const zipFiles=el('input',{type:'file',multiple:'',accept:'.zip','aria-label':'Gói vật liệu ZIP'});
 zipFiles.addEventListener('change',()=>{if(zipFiles.files.length)dressing.checked=true;});
 const materials=()=>!is3D&&dressing.checked?{kenney:kenney.checked,files:[...zipFiles.files]}:null;
 const materialsPanel=is3D?null:el('details',{},el('summary',{},'Tự phối vật liệu Đường Bao'),
  el('div',{class:'row'},el('label',{},dressing,' Tự phối vật liệu khi tạo màn'),
   el('label',{},kenney,' Dungeon, Farm, Library và Bases')),
  el('label',{},'Thêm gói ZIP ',zipFiles),
  el('p',{class:'hint'},'Tự lát sàn theo phòng và đặt đạo cụ tránh lối đi. Dùng Chơi thử bản nháp hoặc Tạo màn mới để xem kết quả.'));
 function createDraft(connect=false){
  return runAction(async()=>{
   if(!loops.length)throw Error('Hãy tạo đường bao hoặc chọn một màn mẫu.');
   await editor.newOutlineMap(outlineData(),W,H,levelDraft,stamps,origin,true,connect,materials());
  },true);
 }
 function playDraft(){
  return runAction(async()=>{
   const data=await editor.previewOutlineMap(outlineData(),W,H,levelDraft,stamps,origin,materials());
   const back=()=>{ov.hidden=false;ov.style.display='grid';box.focus();};
   ov.hidden=true;ov.style.display='none';
   try{(is3D?play3D:play2D)({...data,escapeExit:true,onExit:back});}
   catch(e){back();throw e;}
  },false);
 }
 createLabel=B('Tạo màn mới từ hình này',()=>createDraft());
 tryLabel=B('Chơi thử bản nháp',playDraft);
 clearButton=B('Bỏ lớp đường bao',async()=>{if(!map.cfg.outline||!await yes('Bỏ tường bao, mép cong và những cổng gắn vào tường bao của màn hiện tại?'))return;if(editor.clearOutline()!==false)ov.remove();});
 buttons.append(applyButton,createLabel,tryLabel,clearButton,B('Đóng',()=>ov.remove()));
 if(!is3D)buttons.insertBefore(B('Tạo và nối hai chiều',()=>createDraft(true)),tryLabel);
 box.append(el('h2',{},(is3D?'Đường Bao 3D · mặt bằng XZ':'Đường bao bản đồ')),guideBox('outline',appGuides.outline),setup,toolbar,
  el('div',{class:'outline-layout'},el('div',{},gridSetup,gridNote,viewTools,el('div',{class:'outline-canvas-wrap',style:'position:relative'},canvas,aim),status),library),
  editShape,materialsPanel,el('details',{},el('summary',{},'Chiều cao tường và vùng chặn'),footer),buttons);
 ov.append(box);document.body.append(ov);draw();
}
