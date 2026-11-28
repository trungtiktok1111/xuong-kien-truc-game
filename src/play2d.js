import {miniatureHouseHeadroom} from './miniatureHouse.js';
import {drawSurfaceTerrain,surfaceTerrainTile} from './surfaceContours.js';
import {campaignStart,mapLinkLanding} from './mapLinks2d.js';
import {bridgeHeight,bridgeRails,drawSettlementBridge,pickBridge} from './settlementBridge.js';
import {tiledDepth} from './tiledScene.js';
import {actorFootprint,actorHeights,bodyHeight,fitsUnderRoof,lowestCeiling,roofPlane,roofBlockedFootprint} from './headroom2d.js';
import {constructionContext,isRoof,roofBearing,roofOnGround,headroomIssue} from './constructionRules2d.js';
import {builtWallFaces,isMapLink,portalAnchor} from './wall2d.js';
import {gateWalls} from './gate2d.js';
import {automaticPaintZones,estimateContact,makePaintProfile,paintedPieces,roofTextureDirection,sceneEntityLayer} from './placement2d.js';
import {tileFoot,tileSpan} from './spriteFoot.js';
import {mapCollision} from './mapCollision.js';
import {outline2D,clipOutline,stoneBackdrop,drawFloorSlab,stoneWall,outlineWallImage,drawFloorCollision} from './outline2d.js';
import {createLogic} from './logic.js';
import {el} from './util.js';
import {zonesHit,zRaster,zPath,decoZones} from './zones.js';
import {placedPropFrame,drawPlacedProp,ANG_R,sprOf,tileAng,depthAng} from './proj.js';
import {makeAnims} from './anim.js';
import {slab,shore,tile192,mirF} from './isoslab.js';
import {bakeLayer0,noiseOverlay,paintSlab,drawFog} from './groundfx.js';
const HERO=88,FOES=[108,109,120,121,122,111,110],TD=2;
function playPaintZones(map,sheets){
  if(map.cfg?.autoObjectCollision===false)return map.placementZones||[];
  const saved=map.placementZones||[];
  const existing=new Set(saved.map(zone=>zone.id));
  const profiles=new Map();
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const generated=automaticPaintZones(map,(value)=>{
    if(profiles.has(value))return profiles.get(value);
    const raw=value-1,idx=(raw>>3)&4095,sheet=sheets[raw>>15],flip=raw&7;
    let profile=null;
    if(sheet?.img&&!roofTextureDirection(sheet.name,true)){
      const size=sheet.tw,step=size+(sheet.margin||0);
      let contact=null;
      try{
        canvas.width=canvas.height=size;
        context.drawImage(sheet.img,idx%sheet.cols*step,Math.floor(idx/sheet.cols)*step,size,size,0,0,size,size);
        contact=estimateContact(context.getImageData(0,0,size,size).data,size,flip);
      }catch{/* Use the default ground contact when pixel data is unavailable. */}
      profile=makePaintProfile('solid',contact||{u:.5,v:.87,width:.38});
    }
    profiles.set(value,profile);
    return profile;
  });
  return [...saved,...generated.filter(zone=>!existing.has(zone.id))];
}

export function play2D(o){
  const M=o.M,W=M.w,H=M.h,sheets=o.sheets;const CF=Object.assign({hp:5,spd:4.2,dmg:1,rng:1.35,hero:{sid:TD,idx:HERO},win:'auto'},M.cfg||{});const EN=(M.ents||[]).map(e=>e.door?Object.assign({},e,{door:Object.assign({},e.door)}):e),legacy=!EN.length;const VW=CF.view||'rpg',SIDE=VW==='side',ISO=VW==='iso',ANG=ISO&&CF.proj==='angle',decos=EN.filter(e=>e.t==='deco');
  const bridge=CF.settlement?.plan?.bridge;
  const build=decos.some(isRoof)?constructionContext(M):null;
  const structuralCeilings=build?.headroom()||[],houseCeilings=miniatureHouseHeadroom(decos);
  const ceilings=[...structuralCeilings,...houseCeilings],playerSize=actorHeights(CF);
  const DCL=decos.flatMap(e=>{
    if(!isRoof(e))return headroomIssue(e,structuralCeilings,CF)?[]:[e];
    const support=roofBearing(e,build);
    return support?[{...e,roofBase:support.base,roofRise:support.rise,ceiling:roofPlane(e,support)}]:[roofOnGround(e)];
  });
  const coverDepth=e=>e.tiledLayer===undefined?e.y+(ANG?0:e.x):tiledDepth(e,W,H,ANG);
  const housePlanes=new Map(houseCeilings.map(plane=>[plane.id,plane]));
  const covers=DCL.filter(d=>!d.groundedRoof&&d.placedProp&&sceneEntityLayer(d)===3&&(isRoof(d)||d.tiledLayer!==undefined)).sort((a,b)=>coverDepth(a)-coverDepth(b));
  const coverSet=new Set(covers);
  const fitsAt=(x,y,r,top)=>fitsUnderRoof(ceilings,actorFootprint(x,y,r),top+bridgeHeight(bridge,x,y));
  const postureHeight=e=>e===P?(P.crouching?playerSize.crouching:playerSize.standing):(e.height||1.2);
  const ov=el('div',{style:'position:fixed;inset:0;z-index:100;background:#10161d;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden'});
  const cv=document.createElement('canvas');cv.style.cssText='width:100%;height:100%;display:block';ov.append(cv);const cx=cv.getContext('2d');
  const msg=el('div',{style:'position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#000a;color:#fff;font:700 26px system-ui;text-align:center'});
  const atk=el('div',{style:'position:absolute;right:22px;bottom:calc(env(safe-area-inset-bottom) + 26px);width:84px;height:84px;border-radius:50%;background:#c0392bcc;border:3px solid #fff8;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;text-align:center;padding:5px;box-sizing:border-box'},'Chiêu');
  ov.append(msg,atk);
  let miniExpanded=false;
  const miniMap=el('canvas',{width:640,height:448,title:'Bấm lên bản đồ nhỏ để nhân vật tự đi tới vị trí đó'});miniMap.style.cssText='display:block;width:100%;height:196px;border-radius:5px;background:#182630;cursor:crosshair;touch-action:none';
  const miniWrap=el('div',{style:'position:absolute;right:10px;top:calc(env(safe-area-inset-top) + 154px);width:min(280px,42vw);background:#101820e8;border:1px solid #9ab0c4aa;border-radius:8px;padding:5px;z-index:4;box-shadow:0 2px 10px #0008'});
  const miniToggle=el('button',{type:'button',style:'border:0;border-radius:5px;background:#34506a;color:#fff;padding:3px 6px;font:600 11px system-ui',onclick:e=>{e.stopPropagation();miniExpanded=!miniExpanded;miniWrap.style.width=miniExpanded?'min(560px,90vw)':'min(280px,42vw)';miniMap.style.height=miniExpanded?'392px':'196px';e.currentTarget.textContent=miniExpanded?'Thu nhỏ':'Phóng ×2';}},'Phóng ×2');
  miniWrap.append(el('div',{style:'display:flex;align-items:center;justify-content:space-between;color:#fff;font:600 12px system-ui;padding:0 2px 4px'},el('span',{},'Toàn cảnh'),miniToggle),miniMap);ov.append(miniWrap);
  if(SIDE){const jb=el('div',{style:'position:absolute;right:122px;bottom:calc(env(safe-area-inset-bottom) + 26px);width:84px;height:84px;border-radius:50%;background:#2e86c1cc;border:3px solid #fff8;color:#fff;font-size:34px;display:flex;align-items:center;justify-content:center'},'⤒');jb.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();keys.k=1;});const jr=()=>{keys.k=0;};jb.addEventListener('pointerup',jr);jb.addEventListener('pointercancel',jr);ov.append(jb);}
  const setZ=v=>{zm=Math.max(.4,Math.min(3.5,v));};
  const zb=(l,d,top)=>el('div',{style:'position:absolute;right:10px;top:calc(env(safe-area-inset-top) + '+top+'px);width:40px;height:40px;border-radius:50%;background:#263342cc;color:#fff;font:700 24px/40px system-ui;text-align:center;cursor:pointer',onclick:e=>{e.stopPropagation();setZ(zm*d);}},l);
  ov.append(zb('＋',1.25,58),zb('－',.8,104));
  let dbgMode=0,showGrid=0,showReach=0,camMode=0,PATH=null,GOAL=null,stuckT=0,repN=0,REACH=null,VIEW=null,chkBox=null;
  const TB=el('div',{style:'position:absolute;left:10px;top:calc(env(safe-area-inset-top) + 44px);display:flex;flex-direction:column;gap:6px;z-index:3'});
  const tbtn=(t,f)=>{const b=el('div',{style:'padding:7px 11px;border-radius:14px;background:#263342cc;color:#fff;font:600 12.5px system-ui;cursor:pointer;white-space:nowrap;user-select:none',onclick:e=>{e.stopPropagation();f(b);}},t);TB.append(b);return b;};
  const lab=(b,t,on)=>{b.textContent=t+(on==null?'':on?': bật':': tắt');b.style.background=on?'#2e7d4fcc':'#263342cc';};
  tbtn('Camera: theo nhân vật',b=>{camMode=camMode?0:1;b.textContent=camMode?'Camera: toàn cảnh':'Camera: theo nhân vật';});
  let moveMode='run';let moveModeButton;
  const toggleMoveMode=()=>{moveMode=moveMode==='run'?'walk':'run';if(moveModeButton)moveModeButton.textContent=(moveMode==='run'?'Chạy':'Đi')+' · Shift đổi';};
  moveModeButton=tbtn('Chạy · Shift đổi',toggleMoveMode);
  tbtn('Lưới: tắt',b=>{showGrid^=1;lab(b,'Lưới',showGrid);});
  tbtn('Vùng đi: tắt',b=>{showReach^=1;if(showReach)REACH=calcReach();lab(b,'Vùng đi',showReach);});
  tbtn('Va chạm: tắt',b=>{dbgMode=dbgMode?0:1;lab(b,'Va chạm',dbgMode);});
  tbtn('✔ Tự kiểm',()=>runCheck());
  tbtn('↺ Đặt lại',()=>resetAll());
  if(o.published)for(const b of [...TB.children].slice(1))b.hidden=true;
  let crouchButton;
  if(!SIDE)crouchButton=tbtn('Cúi · C',toggleCrouch);
  ov.append(TB,el('div',{style:'position:absolute;left:10px;bottom:calc(env(safe-area-inset-bottom) + 8px);color:#fffc;font:12px system-ui;text-shadow:0 1px 2px #000;pointer-events:none;max-width:60%'},'Nhấp chuột hoặc minimap để tự đi · Shift đổi đi/chạy · W/A/S/D hoặc phím mũi tên · Space/J đánh · 1–9 dùng chiêu · C cúi/đứng · +/− thu phóng'));
  cv.addEventListener('wheel',e=>{e.preventDefault();setZ(zm*Math.exp(-e.deltaY*.0015));},{passive:false});
  let pd=0;cv.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pd=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);stick=null;}},{passive:true});
  cv.addEventListener('touchmove',e=>{if(e.touches.length===2&&pd){const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);setZ(zm*d/pd);pd=d;}},{passive:true});
  cv.addEventListener('touchend',()=>{pd=0;});
  if(o.onExit)ov.append(el('div',{style:'position:absolute;right:10px;top:calc(env(safe-area-inset-top) + 10px);padding:8px 14px;border-radius:16px;background:#263342cc;color:#fff;font:600 14px system-ui',onclick:()=>stop()},o.onSnapshot?'Lưu & về menu':'✕ Thoát'));
  if(o.notice){
    const note=el('aside',{class:'play-import-notice',role:'status'},el('span',{},o.notice));
    note.append(el('button',{type:'button',class:'b','aria-label':'Đóng thông báo gói ZIP',onclick:()=>note.remove()},'×'));
    ov.append(note);
  }
  const AN=makeAnims(CF,sheets);
  const skillStates=AN.combatStates(CF.heroAnim),skillLabel=state=>state==='atk_combo'?'Liên chiêu':state==='atk'?'Đánh':/^atk\d+$/.test(state)?'Chiêu '+state.slice(3):state;
  const martialStoreKey='game-editor-martial-sets:'+String(M.id||M.name||'current');
  let martialSets=[];try{const parsed=JSON.parse(localStorage.getItem(martialStoreKey)||'[]');if(Array.isArray(parsed))martialSets=parsed.filter(s=>s&&s.name&&Array.isArray(s.states)&&s.states.every(x=>skillStates.includes(x)));}catch{}
  let activeMartialSetId=null,combatSequence=null;
  const activeMartialSet=()=>martialSets.find(s=>s.id===activeMartialSetId)||null;
  function persistMartialSets(){try{localStorage.setItem(martialStoreKey,JSON.stringify(martialSets));}catch{note('Không lưu được bộ võ công vào trình duyệt.');}}
  function interruptCombatSequence(){combatSequence=null;if(P?.pose&&skillStates.includes(P.pose.state))P.pose=null;}
  function openMartialEditor(){
    const shade=el('div',{style:'position:absolute;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px;z-index:10'});
    const card=el('section',{style:'width:min(560px,94vw);max-height:86vh;overflow:auto;background:#162430;color:#fff;border:1px solid #7892a7;border-radius:12px;padding:16px;box-shadow:0 10px 40px #000a;font:14px/1.4 system-ui'});
    const name=el('input',{type:'text',maxlength:48,placeholder:'Tên bộ võ công',style:'box-sizing:border-box;width:100%;padding:9px;border:1px solid #667d8e;border-radius:6px;background:#0e1820;color:#fff;margin:8px 0 12px'});
    const checks=el('div',{style:'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin:8px 0 12px'});
    const boxes=new Map();for(const state of skillStates){const cb=el('input',{type:'checkbox',value:state});boxes.set(state,cb);checks.append(el('label',{style:'display:flex;align-items:center;gap:7px;padding:7px;background:#233746;border-radius:6px'},cb,skillLabel(state)));}
    const saved=el('div',{style:'display:flex;flex-direction:column;gap:6px;margin:8px 0'});
    const redrawSaved=()=>{saved.replaceChildren();if(!martialSets.length){saved.append(el('div',{style:'color:#aebdca'},'Chưa có bộ võ công đã lưu.'));return;}for(const set of martialSets){const row=el('div',{style:'display:flex;align-items:center;gap:6px;padding:7px;background:#203440;border-radius:6px'});row.append(el('span',{style:'flex:1'},set.name+' · '+set.states.length+' chiêu'));row.append(el('button',{class:'b',onclick:()=>{interruptCombatSequence();activeMartialSetId=set.id;atk.textContent='Bộ: '+set.name;shade.remove();note('Đã chọn bộ võ công '+set.name);}},activeMartialSetId===set.id?'Đang dùng':'Dùng bộ'));row.append(el('button',{class:'b',onclick:()=>{martialSets=martialSets.filter(x=>x.id!==set.id);if(activeMartialSetId===set.id){activeMartialSetId=null;combatSequence=null;atk.textContent='Chiêu';}persistMartialSets();redrawSaved();}},'Xóa'));saved.append(row);}};
    const close=()=>shade.remove();
    const save=()=>{const chosen=skillStates.filter(s=>boxes.get(s)?.checked),label=name.value.trim();if(!label){name.focus();note('Hãy đặt tên cho bộ võ công.');return;}if(!chosen.length){note('Chọn ít nhất một chiêu thức.');return;}interruptCombatSequence();const set={id:'martial-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:label,states:chosen};martialSets.push(set);activeMartialSetId=set.id;persistMartialSets();atk.textContent='Bộ: '+label;name.value='';for(const cb of boxes.values())cb.checked=false;redrawSaved();note('Đã lưu bộ '+label+' · '+chosen.length+' chiêu. Bấm Space/J hoặc nút Chiêu để thi triển liên tục.');};
    card.append(el('div',{style:'font-size:18px;font-weight:700'},'Tạo bộ võ công'),el('div',{style:'color:#c1d0dc'},'Chọn các chiêu. Khi dùng bộ, nhân vật đánh lần lượt đến hết; di chuyển hoặc trúng đòn sẽ ngắt chuỗi.'),name,el('div',{style:'font-weight:700'},'Chiêu thức của nhân vật'),checks,el('button',{class:'b',onclick:save},'Lưu và dùng bộ'),el('div',{style:'font-weight:700;margin-top:14px'},'Bộ đã lưu'),saved,el('button',{class:'b',onclick:close,style:'margin-top:10px'},'Đóng'));
    shade.addEventListener('pointerdown',e=>{if(e.target===shade)close();});shade.append(card);ov.append(shade);redrawSaved();
  }
  tbtn('Bộ võ công',openMartialEditor);
  const skillSelect=el('select',{title:'Chọn chiêu của nhân vật chính',style:'position:absolute;right:112px;bottom:calc(env(safe-area-inset-bottom) + 48px);max-width:min(240px,48vw);padding:8px;border:1px solid #ffffff88;border-radius:7px;background:#17232ddd;color:#fff;font:600 13px system-ui;z-index:4',onchange:e=>{interruptCombatSequence();activeMartialSetId=null;P.actionIndex=+e.currentTarget.value;atk.textContent=(P.actionIndex+1)+'. '+skillLabel(skillStates[P.actionIndex]);}});
  skillStates.forEach((state,index)=>skillSelect.append(el('option',{value:index},(index+1)+'. '+skillLabel(state))));
  if(skillStates.length)ov.append(skillSelect);else{atk.textContent='Không có chiêu';atk.style.opacity='.55';}
  const placementZones=playPaintZones(M,sheets);
  const collision=mapCollision({...M,placementZones});
  const miniBase=document.createElement('canvas');miniBase.width=640;miniBase.height=448;let miniReady=false;
  function miniProjection(x,y){const pad=10;if(ISO&&!ANG){const unit=Math.min((miniBase.width-2*pad)/(W+H),(miniBase.height-2*pad)*2/(W+H));return [miniBase.width/2+(x-y)*unit,pad+(x+y)*unit*.5];}const u=Math.min((miniBase.width-2*pad)/W,(miniBase.height-2*pad)/H);return [pad+x*u,pad+y*u];}
  function miniPoint(px,py){if(ISO&&!ANG){const pad=10,unit=Math.min((miniBase.width-2*pad)/(W+H),(miniBase.height-2*pad)*2/(W+H)),a=(px-miniBase.width/2)/unit,b=(py-pad)/(unit*.5);return {x:(a+b)/2,y:(b-a)/2};}const u=Math.min((miniBase.width-20)/W,(miniBase.height-20)/H);return {x:(px-10)/u,y:(py-10)/u};}
  function drawMiniMap(){const mc=miniMap.getContext('2d'),mw=miniBase.width,mh=miniBase.height;mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,mw,mh);
    if(!miniReady){const bg=miniBase.getContext('2d');bg.fillStyle='#19313a';bg.fillRect(0,0,mw,mh);
      const floor=M.layers?.[0]||[];for(let i=0;i<floor.length;i++){if(!floor[i])continue;const x=i%W,y=(i/W)|0,c=miniProjection(x,y),d=miniProjection(x+1,y),e=miniProjection(x+1,y+1),f=miniProjection(x,y+1);bg.beginPath();bg.moveTo(...c);bg.lineTo(...d);bg.lineTo(...e);bg.lineTo(...f);bg.closePath();bg.fillStyle=ISO?'#b7a782':'#c9b991';bg.fill();}
      if(CF.outline?.loops?.length){bg.save();bg.globalCompositeOperation='destination-in';bg.beginPath();for(const loop of CF.outline.loops){loop.forEach((p,i)=>{const q=miniProjection(p[0],p[1]);i?bg.lineTo(...q):bg.moveTo(...q);});bg.closePath();}bg.fill('evenodd');bg.restore();bg.strokeStyle='#c9a66c';bg.lineWidth=2;for(const loop of CF.outline.loops){bg.beginPath();loop.forEach((p,i)=>{const q=miniProjection(p[0],p[1]);i?bg.lineTo(...q):bg.moveTo(...q);});bg.closePath();bg.stroke();}}
      for(const e of EN){if(!['start','goal','enemy','npc','door'].includes(e.t))continue;const q=miniProjection(e.x+.5,e.y+.5);bg.fillStyle=e.t==='start'?'#5cff9b':e.t==='goal'?'#ffdf62':e.t==='enemy'?'#ff625e':e.t==='door'?'#88bfff':'#d9dce3';bg.beginPath();bg.arc(q[0],q[1],e.t==='start'||e.t==='goal'?4:2.5,0,Math.PI*2);bg.fill();}
      miniReady=true;}
    mc.drawImage(miniBase,0,0);if(!VIEW)return;
    const world=(px,py)=>{if(VIEW.ang)return {x:(px-VIEW.ox0)/VIEW.cw,y:(py-VIEW.oy0)/VIEW.ch};if(VIEW.iso){const a=(px-VIEW.ox0)/VIEW.hw,b=(py-VIEW.oy0)/VIEW.hh;return {x:(a+b)/2,y:(b-a)/2};}return {x:(px-VIEW.ox)/VIEW.s,y:(py-VIEW.oy)/VIEW.s};};
    mc.save();mc.strokeStyle='#fff';mc.lineWidth=2;mc.setLineDash([5,3]);mc.beginPath();[[0,0],[cv.clientWidth,0],[cv.clientWidth,cv.clientHeight],[0,cv.clientHeight]].forEach((p,i)=>{const q=world(...p),r=miniProjection(q.x,q.y);i?mc.lineTo(...r):mc.moveTo(...r);});mc.closePath();mc.stroke();mc.setLineDash([]);
    const player=miniProjection(P.x,P.y);mc.fillStyle='#30c8ff';mc.strokeStyle='#082838';mc.lineWidth=2;mc.beginPath();mc.arc(player[0],player[1],5,0,Math.PI*2);mc.fill();mc.stroke();for(const e of E){const q=miniProjection(e.x,e.y);mc.fillStyle='#ff4545';mc.fillRect(q[0]-2,q[1]-2,4,4);}mc.restore();
  }
  miniMap.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();const r=miniMap.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*miniBase.width,sy=(e.clientY-r.top)/r.height*miniBase.height,p=miniPoint(sx,sy);if(p.x>=0&&p.y>=0&&p.x<W&&p.y<H)goTo(p.x,p.y);});
  const portalFloor=CF.outline?.loops?.length?mapCollision({...M,cfg:{...CF,outline:{...CF.outline,floorCollision:true}}}).floor:null;
  const ZP=[...((M.cfg&&M.cfg.zones)||[]),...decoZones(DCL.filter(e=>!e.door).map(e=>
    /Vách núi đá/i.test(sheets[e.tile?.sid]?.name||'')?{...e,groundContact:'rock'}:e)),...bridgeRails(bridge)],DRS=DCL.filter(e=>e.door);let ZS=ZP,ZR=zRaster(ZS,W,H);
  /* cửa hai trạng thái: tìm đường coi cửa là đi qua được (ZP); va chạm thật (ZS) theo trạng thái hiện tại */
  const setDoor=(e,st)=>{const v=e.door.v&&e.door.v[st];if(!v||e.door.st===st)return;e.door.st=st;if(v.tile)e.tile=v.tile;e.col=v.col&&v.col.length?v.col:undefined;rebuildZ();};
  function rebuildZ(){ZS=DRS.length?[...ZP,...decoZones(DRS)]:ZP;ZR=zRaster(ZS,W,H);}
  rebuildZ();
  function doorCtr(e){return {x:e.x+.5,y:e.y+.5};}
  function nearDoor(r){let b=null,bd=r;for(const e of DRS){const c=doorCtr(e),d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;b=e;}}return b;}
  function doorsTick(){for(const e of DRS){const c=doorCtr(e),d=Math.hypot(c.x-P.x,c.y-P.y);if(e.door.st==='dong'&&d<(e.door.rOpen||1.3))setDoor(e,'mo');else if(e.door.st==='mo'&&e.door.auto&&d>(e.door.rClose||2.6))setDoor(e,'dong');}}
  function toggleDoor(){const e=nearDoor(1.7);if(!e)return false;setDoor(e,e.door.st==='mo'?'dong':'mo');return true;}
  const blocked=(x,y)=>!collision.free(x+.5,y+.5,0)||!!ZR[y*W+x]||!fitsAt(x+.5,y+.5,.28,playerSize.standing);
  let CQ=16;for(const sh of sheets)if(sh&&sh.img&&sh.tw>CQ)CQ=Math.min(48,sh.tw);
  while(W*H*CQ*CQ>2.2e7&&CQ>16)CQ-=8;
  const FOG=(M.cfg&&M.cfg.fog)|0;
  const SMG=!(M.cfg&&M.cfg.smooth===false)&&!ANG;
  const bakedOk=v=>{const t=(v-1)>>3,sh=sheets[t>>12];return !!(sh&&sh.img&&(!sh.iso||(sh.iso===2?!(sh.wat&&sh.wat.includes(t&4095)):!(((v-1)&7)&4))));};
  function mk(top){const c=document.createElement('canvas');c.width=W*CQ;c.height=H*CQ;const g=c.getContext('2d');g.imageSmoothingEnabled=CQ>16;g.imageSmoothingQuality='high';const h2=CQ/2;
    const SM=top===2&&!(M.cfg&&M.cfg.smooth===false)&&!ANG;
    const ls=top===2?[0,1]:(top?[3]:[0,1,2]);for(const l of ls){const a=l===0&&CF.outline?.surface?M.layers[l].map(v=>surfaceTerrainTile(M,sheets[(v-1)>>15])?0:v):M.layers[l];
      if(l===0&&SM){const pt=(g2,v,dx,dy,s)=>{const n=v-1,f=n&7,t=n>>3,sid=t>>12,idx=t&4095,sh=sheets[sid];if(!sh||!sh.img)return;if(sh.iso){paintSlab(g2,sh.img,(idx%sh.cols)*(sh.tw+sh.margin),Math.floor(idx/sh.cols)*(sh.tw+sh.margin),sh.tw,sh.iso===2?(sh.cy||0):0,dx,dy,s,f&3);return;}const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin),hh=s/2;
          if(!f)g2.drawImage(sh.img,sx,sy,sh.tw,sh.tw,dx,dy,s,s);else{g2.save();g2.translate(dx+hh,dy+hh);if(f&4){g2.rotate(Math.PI/2);g2.scale(1,-1);}if(f&1)g2.scale(-1,1);if(f&2)g2.scale(1,-1);g2.drawImage(sh.img,sx,sy,sh.tw,sh.tw,-hh,-hh,s,s);g2.restore();}};
        bakeLayer0(g,{W,H,Q:CQ,a,paint:pt,smooth:true,ok:bakedOk});continue;}
      for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const n=v-1,f=n&7,t=n>>3,sid=t>>12,idx=t&4095,sh=sheets[sid];if(!sh||!sh.img)continue;if(top===2&&sh.iso)continue;
      const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin),dx=(i%W)*CQ,dy=Math.floor(i/W)*CQ;
      if(!f)g.drawImage(sh.img,sx,sy,sh.tw,sh.tw,dx,dy,CQ,CQ);else{g.save();g.translate(dx+h2,dy+h2);if(f&4){g.rotate(Math.PI/2);g.scale(1,-1);}if(f&1)g.scale(-1,1);if(f&2)g.scale(1,-1);g.drawImage(sh.img,sx,sy,sh.tw,sh.tw,-h2,-h2,CQ,CQ);g.restore();}}}if(SM)noiseOverlay(g,W,H,CQ);return c;}
  const hasBakedGround=ISO&&(SMG||M.layers.slice(0,2).some(layer=>layer.some(v=>{
    const sheet=v&&sheets[((v-1)>>3)>>12];
    return sheet?.img&&!sheet.iso;
  })));
  const base=ISO?null:mk(false),top=ISO?null:mk(true),gnd=hasBakedGround?mk(2):null;
  const SL=[];if(ISO){for(const l of [0,1])for(let i=0;i<W*H;i++){const v=M.layers[l][i];if(!v)continue;const t=(v-1)>>3,sid=t>>12,sh=sheets[sid];if(sh&&sh.img&&sh.iso&&!(l===0&&surfaceTerrainTile(M,sh))&&!(SMG&&l===0&&bakedOk(v)))SL.push({x:i%W,y:(i/W)|0,sid,idx:t&4095,l,f:(v-1)&7});}SL.sort(ANG?((a,b)=>(a.y-b.y)||(a.x-b.x)||a.l-b.l):((a,b)=>(a.x+a.y)-(b.x+b.y)||a.l-b.l));}
  const images=new Map();
  const mkG=l=>ISO?paintedPieces(M.layers[l],W,H).map(group=>{
    const {x0,y0,cells}=group,value=M.layers[l][cells[0]];
    const cached=images.get(value);
    if(cached)return {...group,c:cached,a:1};
    const c=el('canvas',{width:CQ,height:CQ}),g=c.getContext('2d');
    g.imageSmoothingEnabled=CQ>16;
    for(const i of cells){
      const n=M.layers[l][i]-1,f=n&7,t=n>>3,sh=sheets[t>>12],idx=t&4095;
      if(!sh?.img)continue;
      const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin);
      const dx=(i%W-x0)*CQ,dy=(Math.floor(i/W)-y0)*CQ;
      g.save();g.translate(dx+CQ/2,dy+CQ/2);
      if(f&4){g.rotate(Math.PI/2);g.scale(1,-1);}
      g.scale(f&1?-1:1,f&2?-1:1);
      g.drawImage(sh.img,sx,sy,sh.tw,sh.tw,-CQ/2,-CQ/2,CQ,CQ);g.restore();
    }
    images.set(value,c);return {...group,c,a:1};
  }):[];
  const GR=mkG(2),OVG=mkG(3);
  function ico(k,x,y,s){cx.save();cx.translate(x,y);
    if(k==='heart'){cx.fillStyle='#e8484f';cx.beginPath();cx.moveTo(0,s*.3);cx.bezierCurveTo(-s*.5,-s*.05,-s*.25,-s*.4,0,-s*.12);cx.bezierCurveTo(s*.25,-s*.4,s*.5,-s*.05,0,s*.3);cx.fill();}
    else if(k==='chest'||k==='chest2'){const o=k==='chest2';cx.fillStyle='#8a5a2b';cx.fillRect(-s*.3,-s*.05,s*.6,s*.3);cx.fillStyle='#b8823f';if(o){cx.fillRect(-s*.3,-s*.32,s*.6,s*.12);cx.fillStyle='#ffe58a';cx.fillRect(-s*.24,-s*.1,s*.48,s*.08);}else{cx.fillRect(-s*.3,-s*.22,s*.6,s*.18);cx.fillStyle='#e8c34a';cx.fillRect(-s*.05,-s*.1,s*.1,s*.14);}}
    else if(k==='flag'){cx.fillStyle='#ddd';cx.fillRect(-s*.03,-s*.4,s*.06,s*.7);cx.fillStyle='#c77dff';cx.beginPath();cx.moveTo(s*.03,-s*.4);cx.lineTo(s*.35,-s*.25);cx.lineTo(s*.03,-s*.1);cx.fill();}
    else{cx.fillStyle='#6b4a2a';cx.fillRect(-s*.22,-s*.35,s*.44,s*.65);cx.fillStyle='#e8c34a';cx.fillRect(s*.1,-s*.05,s*.05,s*.05);}
    cx.restore();}
  function tile(sid,idx,x,y,s,flip){const sh=sheets[sid];if(!sh||!sh.img)return;const sx=(idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(idx/sh.cols)*(sh.tw+sh.margin);
    if(flip){cx.save();cx.translate(x+s,y);cx.scale(-1,1);cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,0,0,s,s);cx.restore();}else cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,x,y,s,s);}
  // ---- trạng thái ----
  let dead=0,DR=[],ENTRY=o.spawn||null,zm=1,L,HID=new Map(),P,E,NP,CH,GL,items,score=0,said=null,winMode='kill',over,t=0,raf,keys={},stick=null,atkCD=0,fx=0,fy=1,last=0;
  const arrOf=k=>k==='E'?E:k==='NP'?NP:CH;
  const host={say:(t,s)=>{said={n:{x:P.x,y:P.y,name:'',text:t},t:s||3};},heal:n=>{P.hp=Math.min(CF.hp,P.hp+n);},hurt:n=>{interruptCombatSequence();P.hitT=.4;P.hp-=n;if(P.hp<=0)end(false);},win:()=>end(true),lose:()=>end(false),
    setHidden:(id,h)=>{if(h){for(const k of ['E','NP','CH']){const a=arrOf(k),i=a.findIndex(o=>o.id===id);if(i>=0){HID.set(id,{k,obj:a.splice(i,1)[0]});return;}}if(GL&&GL.id===id){HID.set(id,{k:'GL',obj:GL});GL=null;}}
      else{const m=HID.get(id);if(!m)return;HID.delete(id);if(m.k==='GL')GL=m.obj;else arrOf(m.k).push(m.obj);}}};
  const hidEn=()=>[...HID.values()].some(m=>m.k==='E');
  function add(k,obj,e){obj.id=e.id;if(e.hid)HID.set(e.id,{k,obj});else if(k==='GL')GL=obj;else arrOf(k).push(obj);}
  function start(){
    combatSequence=null;
    let best=null,bd=1e9;const st=EN.find(e=>e.t==='start');
    if(st)best=[st.x,st.y];else for(let i=0;i<W*H;i++){if(M.blk[i])continue;const x=i%W,y=Math.floor(i/W),d=(x-W/2)**2+(y-H/2)**2;if(d<bd){bd=d;best=[x,y];}}
    if(!best){best=[0,0];}
    const sp=ENTRY;P={x:sp?sp.x:best[0]+.5,y:sp?sp.y:best[1]+.5,hp:CF.hp,inv:0,face:1,atkT:0,hitT:0,actionIndex:0,crouching:false};score=0;
    if(!SIDE&&!fitsAt(P.x,P.y,.28,playerSize.standing))P.crouching=true;
    if(!free(P.x,P.y,.28,false,false,postureHeight(P))){
      const safe=snapFree(P.x,P.y,.28,1.5,false);
      if(safe){P.x=safe.x;P.y=safe.y;}
    }
    refreshCrouch();
    PATH=null;GOAL=null;said=null;
    if(sp&&sp.hp!=null&&!sp.used){P.hp=Math.max(1,Math.min(CF.hp,sp.hp));score=sp.score||0;sp.used=1;}
    DR=EN.filter(isMapLink).flatMap(e=>{
      if(o.canUseDoor&&!o.canUseDoor(e))return [];
      const anchor=portalAnchor(e,(x,y,r)=>portalFloor?.fits(x,y,r)??collision.free(x,y,r));
      if(!anchor)return [];
      const [x,y]=anchor;return [{x,y,to:e.to,tx:e.tx,ty:e.ty,advanceGoal:e.advanceGoal,gate:e.gateAssembly,gx:e.x+1,gy:e.y+1,armed:Math.hypot(x-P.x,y-P.y)>.9}];
    });
    items=[];over=0;msg.style.display='none';E=[];NP=[];CH=[];GL=null;HID=new Map();ov.querySelectorAll('.dlgbox').forEach(x=>x.remove());if(L&&L.hud)L.hud.remove();L=createLogic(CF,EN,host,ov);
    if(legacy){
      const seen=new Uint8Array(W*H),q=[best[1]*W+best[0]],reach=[];seen[q[0]]=1;
      for(let h=0;h<q.length;h++){const c=q[h],x=c%W,y=Math.floor(c/W);reach.push(c);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(blocked(nx,ny)||seen[ny*W+nx])continue;seen[ny*W+nx]=1;q.push(ny*W+nx);}}
      const far=reach.filter(c=>Math.hypot(c%W-best[0],Math.floor(c/W)-best[1])>=7);const pool=far.length>5?far:reach;
      const n=pool.length?Math.max(4,Math.min(24,Math.round(reach.length/110))):0;
      for(let i=0;i<n;i++){const c=pool[Math.floor(Math.random()*pool.length)];E.push({x:c%W+.5,y:Math.floor(c/W)+.5,hp:2,mhp:2,dmg:1,spd:1.7,ch:6,ai:'wander',tl:{sid:TD,idx:FOES[Math.floor(Math.random()*FOES.length)]},dx:0,dy:0,wt:0,fl:0});}
    }else{
      for(const e of EN){
        if(headroomIssue(e,ceilings,CF))continue;
        const cx0=e.x+.5,cy0=e.y+.5;
        if(e.t==='enemy')add('E',{x:cx0,y:cy0,hp:e.hp||2,mhp:e.hp||2,dmg:e.dmg==null?1:e.dmg,spd:e.spd||1.7,ch:e.chase||6,ai:e.ai||'wander',tl:e.tile||{sid:TD,idx:108},dx:0,dy:0,wt:0,fl:0,name:e.name,anim:e.anim,visualScale:e.visualScale,height:bodyHeight(e,CF)},e);
        else if(e.t==='npc')add('NP',{x:cx0,y:cy0,tl:e.tile||{sid:TD,idx:96},name:e.name,text:e.text,dlg:e.dlg,anim:e.anim,visualScale:e.visualScale,height:bodyHeight(e,CF)},e);
        else if(e.t==='chest')add('CH',{x:cx0,y:cy0,tl:e.tile,gives:e.gives,amt:e.amt||1,open:0,openHeight:bodyHeight(e,CF,true)},e);
        else if(e.t==='goal')add('GL',{x:cx0,y:cy0,tl:e.tile},e);}
    }
    const hasGoal=EN.some(e=>e.t==='goal'),hasEn=EN.some(e=>e.t==='enemy');
    winMode=CF.win==='auto'?(hasGoal?(hasEn&&!legacy?'both':'goal'):'kill'):CF.win;
    if(['goal','both'].includes(winMode)&&!hasGoal)winMode='kill';
    const saved=o.restore;
    if(saved&&o.spawn){
      if(saved.logic)L.restore(saved.logic);
      for(const c of CH)c.open=Number((saved.chests||[]).includes(c.id)&&fitsAt(c.x,c.y,.25,c.openHeight));
      E=E.filter(e=>!(saved.defeated||[]).includes(e.id));
      for(const e of E){const hp=saved.enemyHp?.[e.id];if(Number.isFinite(hp))e.hp=hp;}
      for(const id of [...HID.keys()])if(!(saved.hidden||[]).includes(id))host.setHidden(id,false);
      for(const id of saved.hidden||[])host.setHidden(id,true);
      for(const d of DRS){const state=saved.doors?.[d.id];if(state)setDoor(d,state);}
    }else L.fire('start');}
  function snapshot(){
    const hidden=k=>[...HID.values()].filter(e=>e.k===k).map(e=>e.obj);
    const enemies=[...E,...hidden('E')];
    return {x:P.x,y:P.y,hp:P.hp,score,logic:L.snapshot(),
      chests:[...CH,...hidden('CH')].filter(c=>c.open).map(c=>c.id),
      defeated:EN.filter(e=>e.t==='enemy'&&!enemies.some(n=>n.id===e.id)).map(e=>e.id),
      enemyHp:Object.fromEntries(enemies.map(e=>[e.id,e.hp])),
      hidden:[...HID.keys()],doors:Object.fromEntries(DRS.map(d=>[d.id,d.door.st]))};
  }
  function free(x,y,r,plan=false,skipFloor=false,top=postureHeight(P)){
    const zones=plan?ZP:ZS;
    return collision.free(x,y,r,skipFloor)&&!zonesHit(zones,x,y,r)&&fitsAt(x,y,r,top);
  }
  function traverse(ax,ay,bx,by,r,plan,top=postureHeight(P)){
    const floor=collision.floor;
    if(floor&&!floor.sweep(ax,ay,bx,by,r))return false;
    const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/.07));
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      if(!free(ax+(bx-ax)*t,ay+(by-ay)*t,r,plan,!!floor,top))return false;
    }
    return true;
  }
  function move(e,dx,dy,r){
    const top=postureHeight(e);
    if(!Number.isFinite(dx)||!Number.isFinite(dy)||!free(e.x,e.y,r,false,false,top))return;
    const allows=(x,y)=>traverse(e.x,e.y,x,y,r,false,top);
    if(allows(e.x+dx,e.y+dy)){e.x+=dx;e.y+=dy;return;}
    if(e===P&&!P.crouching&&!fitsAt(e.x+dx,e.y+dy,r,top)&&fitsAt(e.x+dx,e.y+dy,r,playerSize.crouching)&&!said)
      note('Mái thấp · Nhấn C để cúi');
    if(dx&&allows(e.x+dx,e.y))e.x+=dx;
    if(dy&&allows(e.x,e.y+dy))e.y+=dy;
  }

  /* ---- tìm đường 8 hướng trên lưới mịn + bỏ góc rẽ thừa; kích thước nhân vật tính bằng bán kính r ---- */
  const PQ=5,NW=W*PQ,NH=H*PQ,NC={};
  const nodesOf=r=>{const key=r+':'+postureHeight(P);return NC[key]??=(new Uint8Array(NW*NH));};
  const nfree=(a,i,j,r)=>{if(i<0||j<0||i>=NW||j>=NH)return false;const k=j*NW+i;let v=a[k];if(!v){v=free((i+.5)/PQ,(j+.5)/PQ,r,1)?1:2;a[k]=v;}return v===1;};
  const nOf=(x,y)=>[Math.max(0,Math.min(NW-1,Math.floor(x*PQ))),Math.max(0,Math.min(NH-1,Math.floor(y*PQ)))];
  const clearSeg=(ax,ay,bx,by,r)=>traverse(ax,ay,bx,by,r,true);
  function snapFree(x,y,r,maxd,plan=true){if(x>=0&&y>=0&&x<W&&y<H&&free(x,y,r,plan))return {x,y};let best=null,bd=1e9;for(let dy=-maxd;dy<=maxd;dy+=.25)for(let dx=-maxd;dx<=maxd;dx+=.25){const d=Math.hypot(dx,dy);if(d>maxd||d>=bd)continue;const qx=x+dx,qy=y+dy;if(qx<0||qy<0||qx>=W||qy>=H)continue;if(free(qx,qy,r,plan)){bd=d;best={x:qx,y:qy};}}return best;}
  function findPath(sx,sy,gx,gy,r){
    if(clearSeg(sx,sy,gx,gy,r))return [{x:gx,y:gy}];
    if(!free(sx,sy,r,true)||!free(gx,gy,r,true))return null;
    const a=nodesOf(r.toFixed(2)*1);let [si,sj]=nOf(sx,sy),[gi,gj]=nOf(gx,gy);
    const near=(i,j)=>{if(nfree(a,i,j,r))return [i,j];for(let d=1;d<=8;d++)for(let dj=-d;dj<=d;dj++)for(let di=-d;di<=d;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==d)continue;if(nfree(a,i+di,j+dj,r))return [i+di,j+dj];}return null;};
    const S0=near(si,sj),G0=near(gi,gj);
    if(S0&&!clearSeg(sx,sy,(S0[0]+.5)/PQ,(S0[1]+.5)/PQ,r))return null;
    if(G0&&!clearSeg(gx,gy,(G0[0]+.5)/PQ,(G0[1]+.5)/PQ,r))return null;if(!S0||!G0)return null;[si,sj]=S0;[gi,gj]=G0;
    const N=NW*NH,g=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),done=new Uint8Array(N),hp=[],ps=(k,f)=>{hp.push([f,k]);let i=hp.length-1;while(i>0){const q=(i-1)>>1;if(hp[q][0]<=hp[i][0])break;[hp[q],hp[i]]=[hp[i],hp[q]];i=q;}},pp=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){let m=i;const L2=2*i+1,R=L2+1;if(L2<hp.length&&hp[L2][0]<hp[m][0])m=L2;if(R<hp.length&&hp[R][0]<hp[m][0])m=R;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m;}}return t;};
    const hf=(i,j)=>{const dx=Math.abs(i-gi),dy=Math.abs(j-gj);return (dx+dy)+(1.4142-2)*Math.min(dx,dy);};
    const s0=sj*NW+si,g0=gj*NW+gi;g[s0]=0;ps(s0,hf(si,sj));let found=false;
    while(hp.length){const [,k]=pp();if(done[k])continue;done[k]=1;if(k===g0){found=true;break;}const i=k%NW,j=(k/NW)|0;
      for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=i+di,nj=j+dj;if(!nfree(a,ni,nj,r))continue;if(di&&dj&&!(nfree(a,i+di,j,r)&&nfree(a,i,j+dj,r)))continue;if((collision.floor||ceilings.length)&&!clearSeg((i+.5)/PQ,(j+.5)/PQ,(ni+.5)/PQ,(nj+.5)/PQ,r))continue;const nk=nj*NW+ni,c=g[k]+(di&&dj?1.4142:1);if(c<g[nk]){g[nk]=c;par[nk]=k;ps(nk,c+hf(ni,nj));}}}
    if(!found)return null;
    const raw=[];for(let k=g0;k>=0;k=par[k])raw.push({x:((k%NW)+.5)/PQ,y:(((k/NW)|0)+.5)/PQ});raw.reverse();
    const pts=[{x:sx,y:sy},...raw,{x:gx,y:gy}],out=[];let i=0;
    while(i<pts.length-1){let j=i+1;while(j+1<pts.length&&clearSeg(pts[i].x,pts[i].y,pts[j+1].x,pts[j+1].y,r))j++;out.push(pts[j]);i=j;}
    return out;}
  const pathLen=(p,sx,sy)=>{let L=0,x=sx,y=sy;for(const q of p){L+=Math.hypot(q.x-x,q.y-y);x=q.x;y=q.y;}return L;};
  const note=t=>{said={n:{x:P.x,y:P.y,name:'',text:t},t:1.6};};
  function refreshCrouch(){
    if(crouchButton)crouchButton.textContent=P.crouching?'Đứng lên · C':'Cúi · C';
  }
  function toggleCrouch(){
    if(!P||SIDE||over||L?.dlgOpen)return;
    if(P.crouching&&!fitsAt(P.x,P.y,.28,playerSize.standing)){
      note('Chưa đủ chỗ để đứng lên');return;
    }
    P.crouching=!P.crouching;refreshCrouch();if(showReach)REACH=calcReach();
    if(GOAL)repath();
  }
  function goTo(x,y){if(over||L.dlgOpen)return false;if(x<0||y<0||x>=W||y>=H){note('Ngoài bản đồ');return false;}if(!fitsAt(x,y,.28,postureHeight(P))){note(P.crouching?'Khoảng trống quá thấp':'Mái thấp · Nhấn C để cúi');return false;}
    const g=snapFree(x,y,.28,1);if(!g){note('Điểm này bị chặn');return false;}
    const p=findPath(P.x,P.y,g.x,g.y,.28);if(!p){PATH=null;GOAL=null;note(!P.crouching&&ceilings.length?'Chưa có đường đứng đi được · thử nhấn C để cúi':'Chưa có đường tới đó');return false;}interruptCombatSequence();PATH=p;GOAL=g;stuckT=0;repN=0;return true;}
  function repath(){if(!GOAL)return;if(++repN>4){PATH=null;GOAL=null;note('Không đi tiếp được');return;}const p=findPath(P.x,P.y,GOAL.x,GOAL.y,.28);if(p)PATH=p;else{PATH=null;GOAL=null;note('Chưa có đường');}}
  function followPath(dt){const q=PATH[0],dx=q.x-P.x,dy=q.y-P.y,d=Math.hypot(dx,dy),st=CF.spd*(moveMode==='walk'?.55:1)*(P.crouching?.62:1)*dt;
    if(d<=Math.max(.03,st)&&traverse(P.x,P.y,q.x,q.y,.28,false)){P.x=q.x;P.y=q.y;PATH.shift();if(!PATH.length){PATH=null;GOAL=null;}return;}
    const px0=P.x,py0=P.y;const step=Math.min(d,st);move(P,dx/d*step,dy/d*step,.28);solidPush(P);fx=dx/d;fy=dy/d;const sxv=ISO?(dx-dy):dx;if(Math.abs(sxv)>.05)P.face=sxv>0?1:-1;
    stuckT=Math.hypot(P.x-px0,P.y-py0)<st*.35?stuckT+dt:0;if(stuckT>.45){stuckT=0;repath();}}
  function toPlane(cx0,cy0){const r=cv.getBoundingClientRect(),sx=cx0-r.left,sy=cy0-r.top;if(!VIEW)return null;const deck=pickBridge(bridge,VIEW.bridgeProject,VIEW.bridgeUnit,sx,sy);if(deck)return deck;if(VIEW.ang)return {x:(sx-VIEW.ox0)/VIEW.cw,y:(sy-VIEW.oy0)/VIEW.ch};if(VIEW.iso){const a=(sx-VIEW.ox0)/VIEW.hw,b=(sy-VIEW.oy0)/VIEW.hh;return {x:(a+b)/2,y:(b-a)/2};}return {x:(sx-VIEW.ox)/VIEW.s,y:(sy-VIEW.oy)/VIEW.s};}
  function calcReach(){const a=nodesOf(.28),out=new Float32Array(W*H);let [si,sj]=nOf(P.x,P.y);if(!nfree(a,si,sj,.28)){const g=snapFree(P.x,P.y,.28,1.5);if(!g)return out;[si,sj]=nOf(g.x,g.y);}
    const seen=new Uint8Array(NW*NH),q=[sj*NW+si];seen[q[0]]=1;for(let h=0;h<q.length;h++){const k=q[h],i=k%NW,j=(k/NW)|0;out[((j/PQ)|0)*W+((i/PQ)|0)]+=1/(PQ*PQ);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=i+di,nj=j+dj;if(!nfree(a,ni,nj,.28))continue;if(di&&dj&&!(nfree(a,i+di,j,.28)&&nfree(a,i,j+dj,.28)))continue;const nk=nj*NW+ni;if(seen[nk]||(collision.floor||ceilings.length)&&!clearSeg((i+.5)/PQ,(j+.5)/PQ,(ni+.5)/PQ,(nj+.5)/PQ,.28))continue;seen[nk]=1;q.push(nk);}}
    return out;}
  function resetAll(){PATH=null;GOAL=null;REACH=null;camMode=0;zm=1;if(chkBox){chkBox.remove();chkBox=null;}TB.firstChild.textContent='Camera: theo nhân vật';start();if(showReach)REACH=calcReach();}
  /* ---- tự kiểm: chạy bằng mã trên đúng cảnh đang chơi (kết quả logic, chưa phải quan sát trực quan) ---- */
  function runCheck(){const res=[],add=(st,n,d)=>res.push([st,n,d||'']);
    add(free(P.x,P.y,.28)?'ok':'bad','Vị trí hiện tại đứng được');
    const tg=[...(GL?[['Đích',GL]]:[]),...CH.map((c,i)=>['Rương '+(i+1),c]),...NP.map((n,i)=>['NPC '+(n.name||i+1),n]),...DR.map((d,i)=>['Cửa chuyển màn '+(i+1),d])];
    let far=null;for(const [n,o2] of tg){const g=snapFree(o2.x,o2.y,.28,.9),p=g&&findPath(P.x,P.y,g.x,g.y,.28);add(p?'ok':'bad',n+' tới được (nhân vật r=0.28)',p?'~'+pathLen(p,P.x,P.y).toFixed(1)+' ô, '+p.length+' đoạn thẳng':'không có đường');if(n==='Đích')far=g;}
    if(far){const p=findPath(P.x,P.y,far.x,far.y,.45);add(p?'ok':'warn','Đích tới được với vật to (r=0.45)',p?'':'có khe hẹp hơn 0.9 ô trên tuyến');}
    const A=DCL.filter(d=>d.zps&&d.zps.length>=2);let pOk=0,oOk=0;for(const e of A){const zs=decoZones([e]),c=e.zps.map(q=>[e.x+1+(q[0][0]+q[2][0])/2,e.y+1+(q[0][1]+q[2][1])/2]),mid=[(c[0][0]+c[1][0])/2,(c[0][1]+c[1][1])/2];if(c.every(q=>zonesHit(zs,q[0],q[1],.28)))pOk++;if(!zonesHit(zs,mid[0],mid[1],.28))oOk++;}
    if(A.length){add(pOk===A.length?'ok':'bad','Trụ cổng/cửa vòm chặn được ('+pOk+'/'+A.length+')');add(oOk===A.length?'ok':'bad','Lối giữa cổng/cửa vòm đi qua được ('+oOk+'/'+A.length+')');}
    const un=DCL.filter(d=>d.cal===0).length,dz=DCL.filter(d=>(d.zb&&(d.zb[2]||d.zb[3]))||d.zps||d.col).length;add(un?'warn':'ok','Mảnh chưa hiệu chỉnh vùng chặn',un+' / '+dz+' mảnh có vùng chặn (dùng ước lượng theo họ)');
    add('info','Chưa kiểm','che khuất sát cánh cửa/góc tường, cao độ thật, quan sát trên trình duyệt đích');
    if(chkBox)chkBox.remove();const ic={ok:'✔',bad:'✘',warn:'⚠',info:'ℹ'},col={ok:'#7fe0a0',bad:'#ff8a8a',warn:'#ffd27a',info:'#9fc4ff'};
    chkBox=el('div',{style:'position:absolute;left:50%;top:60px;transform:translateX(-50%);width:min(560px,92vw);max-height:70vh;overflow:auto;background:#101820f2;color:#fff;border:1px solid #4a6a8a;border-radius:12px;padding:12px 14px;font:13px/1.45 system-ui;z-index:5'},
      el('div',{style:'font-weight:700;margin-bottom:6px'},'Tự kiểm (kiểm bằng mã)'),...res.map(([st,n,d])=>el('div',{style:'color:'+col[st]},ic[st]+' '+n+(d?' — '+d:''))),
      el('div',{style:'margin-top:8px;padding:6px 12px;border-radius:10px;background:#263342;display:inline-block;cursor:pointer',onclick:()=>{chkBox.remove();chkBox=null;}},'Đóng'));
    ov.append(chkBox);return res;}
  window.__pl={goTo,toggleDoor,setDoor,DRS,get ZS(){return ZS;},findPath,runCheck,free,get P(){return P;},get PATH(){return PATH;},get W(){return W;},get H(){return H;},GL:()=>GL,toPlane};
  function end(win){over=1;combatSequence=null;if(o.onResult)o.onResult(win);msg.textContent='';msg.append(el('div',{},win?'🏆 Chiến thắng!':'💀 Thất bại'),el('div',{style:'padding:12px 22px;border-radius:20px;background:#e0b050;color:#2a1a08;font-size:18px',onclick:o.onRetry||start},'Chơi lại'));msg.style.display='flex';}
  function playSkill(state){const as=AN.get(CF.heroAnim),clip=as?.st?.[state];if(!clip)return false;const dur=AN.clipSec(as,state);P.pose={state,direction:AN.dirIdx(as,AN.dirsOf(clip),fx,fy,P.face),startedAt:t,loop:false};P.atkT=dur;P.atkN=(P.atkN||0)+1;const idx=skillStates.indexOf(state);if(idx>=0){P.actionIndex=(idx+1)%skillStates.length;if(skillSelect)skillSelect.value=String(idx);}atkCD=Math.max(.12,Math.min(.35,dur*.6));for(const e of E){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<CF.rng&&(d<.3||(dx*fx+dy*fy)/d>-.2)){e.hp-=CF.dmg;e.fl=.3;const k=d||1;move(e,dx/k*.6,dy/k*.6,.3);if(e.hp<=0&&Math.random()<.3)items.push({x:e.x,y:e.y});}}const deadEnemies=E.filter(e=>e.hp<=0);E=E.filter(e=>e.hp>0);for(const e of deadEnemies)L.fire('kill',e.id);if(deadEnemies.length&&!E.length&&!hidEn())L.fire('allkill');checkWin();return true;}
  function attack(index=null){if(over||atkCD>0||L.dlgOpen)return;for(const n of NP){if(Math.hypot(n.x-P.x,n.y-P.y)<1.3){interruptCombatSequence();atkCD=.3;if(!L.talk(n))said={n,t:4};L.fire('talk',n.id);return;}}
    if(!skillStates.length){atkCD=.25;note('Nhân vật chính chưa có hoạt ảnh chiêu thức.');return;}
    if(index==null&&activeMartialSetId){const set=activeMartialSet();if(set?.states?.length){if(combatSequence)return;combatSequence={states:[...set.states],index:0};atk.textContent='Bộ: '+set.name;playSkill(combatSequence.states[combatSequence.index++]);return;}}
    if(index!=null){interruptCombatSequence();activeMartialSetId=null;}const next=index==null?Math.max(0,P.actionIndex||0):Math.max(0,Math.min(skillStates.length-1,index));const state=skillStates[next];atk.textContent=(next+1)+'. '+skillLabel(state);playSkill(state);}
  function checkWin(){if(over)return;if(winMode==='kill'&&!E.length&&!hidEn()&&(legacy||EN.some(e=>e.t==='enemy')))end(true);}
  function solidPush(o){for(const n of [...NP,...CH]){const dx=o.x-n.x,dy=o.y-n.y,d=Math.hypot(dx,dy),r=.6;if(d<r&&d>0){const nx=n.x+dx/d*r,ny=n.y+dy/d*r;if(traverse(o.x,o.y,nx,o.y,.28,false,postureHeight(o)))o.x=nx;if(traverse(o.x,o.y,o.x,ny,.28,false,postureHeight(o)))o.y=ny;}}}
  function upd(dt){
    t+=dt;atkCD-=dt;P.inv-=dt;P.atkT-=dt;P.hitT-=dt;P.pkT=(P.pkT||0)-dt;if(P.pose&&t-(P.pose.startedAt||0)>=AN.clipSec(AN.get(CF.heroAnim),P.pose.state))P.pose=null;if(over||L.dlgOpen){combatSequence=null;return;}
    doorsTick();
    let ix=0,iy=0;if(keys.ArrowLeft||keys.a)ix--;if(keys.ArrowRight||keys.d)ix++;if(keys.ArrowUp||keys.w)iy--;if(keys.ArrowDown||keys.s)iy++;
    if(stick){ix=stick.x;iy=stick.y;}
    if(ix||iy){if(combatSequence)interruptCombatSequence();if(PATH){PATH=null;GOAL=null;}}
    else if(combatSequence&&!P.pose){if(combatSequence.index<combatSequence.states.length)playSkill(combatSequence.states[combatSequence.index++]);else{combatSequence=null;const set=activeMartialSet();atk.textContent=set?'Bộ: '+set.name:'Chiêu';}}
    if(!over&&!free(P.x,P.y,.28)){const g=snapFree(P.x,P.y,.28,1.5,false);if(g){P.x=g.x;P.y=g.y;}}
    if(SIDE){P.vy=Math.min(18,(P.vy||0)+30*dt);if((keys.ArrowUp||keys.w||keys.k||(stick&&stick.y<-.55))&&P.on){P.vy=-11.5;P.on=0;}
      const mx=(Math.abs(ix)>.15?Math.sign(ix)*Math.min(1,Math.abs(ix)):0)*CF.spd*(moveMode==='walk'?.55:1)*dt;if(mx&&traverse(P.x,P.y,P.x+mx,P.y,.28,false))P.x+=mx;if(Math.abs(ix)>.2){P.face=ix>0?1:-1;fx=ix>0?1:-1;fy=0;}
      const ny=P.y+P.vy*dt;if(traverse(P.x,P.y,P.x,ny,.28,false)){P.y=ny;P.on=0;}else{if(P.vy>0)P.on=1;P.vy=0;}}
    else if(PATH&&PATH.length&&!(ix||iy)){followPath(dt);}
      else{const m=Math.hypot(ix,iy);if(m>.15){ix/=Math.max(m,1);iy/=Math.max(m,1);const sxv=ix;if(ISO&&!ANG){const a2=(ix+iy)/1.4142,b2=(iy-ix)/1.4142;ix=a2;iy=b2;}const speed=CF.spd*(moveMode==='walk'?.55:1)*(P.crouching?.62:1);move(P,ix*speed*dt,iy*speed*dt,.28);solidPush(P);const n=Math.hypot(ix,iy);fx=ix/n;fy=iy/n;if(Math.abs(sxv)>.2)P.face=sxv>0?1:-1;}}
    for(const e of E){e.fl-=dt;e.attackReady=(e.attackReady||0)-dt;if(e.pose&&t-(e.pose.startedAt||0)>=AN.clipSec(AN.get(e.anim),e.pose.state))e.pose=null;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);
      if(e.ai==='chase'||(e.ai!=='still'&&d<e.ch)){move(e,dx/d*e.spd*dt,dy/d*e.spd*dt,.28);}else if(e.ai!=='still'){e.wt-=dt;if(e.wt<=0){e.wt=1+Math.random()*1.5;const a=Math.random()*6.28;e.dx=Math.cos(a)*(Math.random()<.4?0:1);e.dy=Math.sin(a)*(e.dx?1:0);}move(e,e.dx*.8*dt,e.dy*.8*dt,.28);}
      solidPush(e);if(d<.6&&P.inv<=0&&e.attackReady<=0){const states=AN.combatStates(e.anim);if(states.length){const as=AN.get(e.anim),state=states[(e.actionIndex||0)%states.length],clip=as.st[state];e.actionIndex=(e.actionIndex||0)+1;e.pose={state,direction:AN.dirIdx(as,AN.dirsOf(clip),dx,dy,dx<0?-1:1),startedAt:t};e.attackReady=Math.max(.55,AN.clipSec(as,state)*.9);interruptCombatSequence();P.hp-=e.dmg;P.inv=1;P.hitT=.4;const k=d||1;move(P,-dx/k*.7,-dy/k*.7,.28);if(P.hp<=0){end(false);return;}}}}
    for(const c of CH)if(!c.open&&Math.hypot(c.x-P.x,c.y-P.y)<.7){
      if(!fitsAt(c.x,c.y,.25,c.openHeight)){if(!said)note('Không đủ chỗ để mở nắp rương');continue;}
      c.open=1;P.pkT=1;L.fire('chest',c.id);if(c.gives==='hp')P.hp=Math.min(CF.hp,P.hp+c.amt);else score+=c.amt;said={n:{x:c.x,y:c.y,name:'Rương',text:c.gives==='hp'?'+'+c.amt+' máu':'+'+c.amt+' điểm'},t:1.5};}
    for(const d of DR){const dd=Math.hypot(d.x-P.x,d.y-P.y);if(dd>=.9)d.armed=true;else if(d.armed&&dd<.6&&o.onDoor){d.armed=false;o.onDoor({to:d.to,tx:d.tx,ty:d.ty,hp:P.hp,score,state:o.onSnapshot?snapshot():null});return;}}
    if(o.onTick&&(t-(P.lastSave||-9))>1.5){P.lastSave=t;o.onTick({x:P.x,y:P.y,hp:P.hp,score});}
    if(o.onSnapshot&&t-(P.lastSnapshot||-5)>1){P.lastSnapshot=t;o.onSnapshot(snapshot());}
    if(said){said.t-=dt;if(said.t<=0)said=null;}
    if(GL&&Math.hypot(GL.x-P.x,GL.y-P.y)>=.6)GL.hit=0;
    if(GL&&!(o.onDoor&&DR.some(d=>d.advanceGoal!=null&&d.advanceGoal===GL.id))&&Math.hypot(GL.x-P.x,GL.y-P.y)<.6){if(!GL.hit){GL.hit=1;L.fire('goal');if(over||!GL)return;}if(winMode==='goal'||(winMode==='both'&&!E.length&&!hidEn()))end(true);else if(winMode==='both'){said={n:{x:GL.x,y:GL.y,name:'Đích',text:'Còn quái chưa diệt!'},t:1.2};}}
    for(let i=items.length-1;i>=0;i--)if(Math.hypot(items[i].x-P.x,items[i].y-P.y)<.6){items.splice(i,1);P.hp=Math.min(CF.hp,P.hp+1);}
  }
  function draw(){
    const w=cv.clientWidth,h=cv.clientHeight,dp=Math.min(devicePixelRatio||1,2);if(cv.width!==Math.round(w*dp)||cv.height!==Math.round(h*dp)){cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);}
    cx.setTransform(dp,0,0,dp,0,0);cx.imageSmoothingEnabled=CQ>16;cx.fillStyle='#10161d';cx.fillRect(0,0,w,h);
    const k=Math.max(2,Math.round(Math.min(w,h)/160)),CEN=camMode?{x:W/2,y:H/2}:P;let s=16*k*zm;if(camMode)s=ANG?Math.min(w*.94/(W*1.5),h*.9/(H*1.5*ANG_R+2.5)):ISO?Math.min(w*.94/((W+H)*.75),h*.8/((W+H)*.375+2.5)):Math.min(w*.94/W,h*.94/H);let ox=w/2-CEN.x*s,oy=h/2-CEN.y*s;
    if(W*s<=w)ox=(w-W*s)/2;else ox=Math.min(0,Math.max(w-W*s,ox));if(H*s<=h)oy=(h-H*s)/2;else oy=Math.min(0,Math.max(h-H*s,oy));
    let pX=()=>0,pY=()=>0;
    const geo=ISO&&outline2D(CF.outline,ANG,EN);
    const wallImage=outlineWallImage(CF.outline,sheets);
    if(ANG){const cw=s*1.5,ch=cw*ANG_R,ox0=w/2-CEN.x*cw,oy0=h/2-CEN.y*ch,hw=cw/2;pX=(x,y)=>ox0+x*cw;pY=(x,y)=>oy0+y*ch;VIEW={iso:1,ang:1,ox0,oy0,cw,ch};if(geo){stoneBackdrop(cx,w,h);drawFloorSlab(cx,geo,(x,y)=>[pX(x,y),pY(x,y)],s*.75);cx.save();clipOutline(cx,geo,(x,y)=>[pX(x,y),pY(x,y)]);}else{cx.fillStyle='#1b2a1f';cx.fillRect(0,0,w,h);}
      if(CF.outline?.surface)drawSurfaceTerrain(cx,W,H,CF.outline.surface,(x,y)=>[pX(x,y),pY(x,y)],{sheets,materials:CF.outline.surfaceMaterials});
      if(gnd){cx.save();cx.transform(cw/CQ,0,0,ch/CQ,ox0,oy0);cx.drawImage(gnd,0,0);cx.restore();}
      for(const q of SL){const X=pX(q.x,q.y),Y=pY(q.x,q.y);if(X>w||X<-cw||Y>h||Y<-2*cw)continue;const sh=sheets[q.sid];if(sh&&sh.A)tileAng(cx,sh.A,q.idx,X,Y,cw);}
      if(geo)cx.restore();}
    else if(ISO){const hw=s*.75,hh=s*.375,ox0=w/2-(CEN.x-CEN.y)*hw,oy0=h/2-(CEN.x+CEN.y)*hh;pX=(x,y)=>ox0+(x-y)*hw;pY=(x,y)=>oy0+(x+y)*hh;VIEW={iso:1,ox0,oy0,hw,hh};if(geo){stoneBackdrop(cx,w,h);drawFloorSlab(cx,geo,(x,y)=>[pX(x,y),pY(x,y)],s*.75);cx.save();clipOutline(cx,geo,(x,y)=>[pX(x,y),pY(x,y)]);}else{cx.fillStyle='#1b2a1f';cx.fillRect(0,0,w,h);}
      if(CF.outline?.surface)drawSurfaceTerrain(cx,W,H,CF.outline.surface,(x,y)=>[pX(x,y),pY(x,y)],{sheets,materials:CF.outline.surfaceMaterials});
      if(gnd){cx.save();cx.transform(hw/CQ,hh/CQ,-hw/CQ,hh/CQ,ox0,oy0);cx.drawImage(gnd,0,0);cx.restore();}
      for(const q of SL){const X=pX(q.x,q.y)-hw,Y=pY(q.x,q.y);if(X>w||X<-2*hw||Y>h||Y<-2*hw)continue;const sh=sheets[q.sid],sx=(q.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(q.idx/sh.cols)*(sh.tw+sh.margin);if(sh.iso===2)tile192(cx,sh.img,sx,sy,sh.tw,sh.cy||0,X+hw,Y,hw,sh.wat&&sh.wat.includes(q.idx)?mirF(q.x,q.y):0);else slab(cx,sh.img,sx,sy,sh.tw,X+hw,Y,hw,q.f);}
      {const wc=SL.filter(q=>q.f&4);if(wc.length)shore(cx,wc,(x,y)=>[pX(x,y),pY(x,y)],hw);}
      if(geo)cx.restore();}
    else{VIEW={ox,oy,s};if(SIDE){const gr=cx.createLinearGradient(0,oy,0,oy+H*s);gr.addColorStop(0,'#5fa8dd');gr.addColorStop(1,'#d6edf8');cx.fillStyle=gr;cx.fillRect(ox,oy,W*s,H*s);}cx.drawImage(base,ox,oy,W*s,H*s);}
    const floorX=ox,floorY=oy;
    const bridgeProject=ISO?(x,y)=>[pX(x,y),pY(x,y)]:(x,y)=>[floorX+x*s,floorY+y*s];
    const bridgeUnit=ISO?s*.75:0;
    VIEW.bridgeProject=bridgeProject;VIEW.bridgeUnit=bridgeUnit;
    drawSettlementBridge(cx,bridge,bridgeProject,bridgeUnit);
    cx.font=(s*.6)+'px serif';cx.textAlign='center';for(const it of items)ico('heart',ISO?pX(it.x,it.y):ox+it.x*s,(ISO?pY(it.x,it.y):oy+it.y*s),s*.8);
    /* thứ tự vẽ theo KHUNG CHÂN: nhà dài chỉ có một điểm neo (góc trước) nên người đứng ở mép trước bên trái bị vẽ trước nhà → nhà đè lên thân người.
       Quy tắc isometric: đứng ngoài khung ở phía gần camera (x>=x1 hoặc y>=y1) thì vẽ SAU nhà; ở phía xa (x<=x0 hoặc y<=y0) thì vẽ TRƯỚC. */
    const RC=ISO?DCL.filter(d=>!d.flat&&d.zb).map(d=>{const z=d.zb,x0=d.x+1+z[0],y0=d.y+1+z[1];return {x0,y0,x1:x0+z[2],y1:y0+z[3],K:d.x+d.y+2};}):[];
    const kk=(x,y)=>{let k=ANG?y:x+y;if(ANG||!RC.length)return k;for(const r of RC){if(x<r.x0-2||x>r.x1+2||y<r.y0-2||y>r.y1+2)continue;const fr=x>=r.x1||y>=r.y1,bh=x<=r.x0||y<=r.y0;if(fr&&!bh)k=Math.max(k,r.K+.001);else if(bh&&!fr)k=Math.min(k,r.K-.001);}return k;};
    const builtWalls=[...builtWallFaces(DCL,ANG||!ISO),...DCL.flatMap(e=>gateWalls(e,ANG||!ISO))].map(wall=>({wall,k:wall.k,y:(wall.a[1]+wall.b[1])/2}));
    const ents=[...builtWalls,...(geo?geo.walls.map(wall=>({wall,k:wall.k})):[]),{y:P.y,x:P.x,p:1,k:kk(P.x,P.y)},...E.map(e=>({y:e.y,x:e.x,e,k:kk(e.x,e.y)})),...NP.map(n=>({y:n.y,x:n.x,n,k:kk(n.x,n.y)})),...CH.map(c=>({y:c.y,x:c.x,c,k:kk(c.x,c.y)})),...(GL?[{y:GL.y,x:GL.x,g:GL,k:kk(GL.x,GL.y)}]:[]),...(ISO?GR.map(g=>({y:g.yb,x:g.xc,grp:g})):[]),...DCL.filter(d=>!d.wallLine&&!coverSet.has(d)).map(d=>({y:d.flat?-1e4+d.y:d.y,x:d.flat?-1e4+d.x:d.x+1,dc:d,k:d.tiledLayer!==undefined?tiledDepth(d,W,H,ANG):d.placedProp?(ANG?d.y+1:d.x+d.y+2):ANG?(d.flat?-1e4+d.y:depthAng(d)):undefined}))].sort(ISO?((a,b)=>(a.k!=null?a.k:a.x+a.y)-(b.k!=null?b.k:b.x+b.y)):((a,b)=>a.y-b.y));
    const ox1=ox,oy1=oy,TC=[];
    const grounded=!!geo;
    function actorShadow(q){
      cx.save();
      if(grounded&&!collision.floor?.fits(q.x,q.y,.56))clipOutline(cx,geo,(x,y)=>[pX(x,y),pY(x,y)]);
      cx.fillStyle='#0005';cx.beginPath();
      cx.ellipse(ox+q.x*s,oy+(q.y+(grounded?0:.32))*s,s*.3,s*.12,0,0,6.3);
      cx.fill();cx.restore();
    }
    const actorTop=(q,sid,idx)=>oy+(q.y-(grounded?tileFoot(sheets[sid],idx):.7))*s;
    const fitActor=(q,sid,idx,top)=>{
      const visual=q.visualScale??1;
      if(!CF.outline?.surface&&visual===1)return;
      const sh=sheets[sid],extent=tileSpan(sh,idx),foot=oy+q.y*s;
      const scale=visual*(CF.outline?.surface?top*.75/Math.max(.05,extent):1);
      const x=ox+q.x*s;cx.translate(x,foot);cx.scale(scale,scale);cx.translate(-x,-foot);
    };
    for(const n of ents){if(n.wall){stoneWall(cx,n.wall,ISO?(x,y)=>[pX(x,y),pY(x,y)]:(x,y)=>[ox1+x*s,oy1+y*s],ISO?s*.75:s,w,h,geo,wallImage,sheets);continue;}if(n.dc){const d=n.dc,sh=d.tile&&sheets[d.tile.sid];
      if(d.placedProp){
        const project=ISO?(x,y)=>[pX(x,y),pY(x,y)]:(x,y)=>[ox1+x*s,oy1+y*s];
        drawPlacedProp(cx,d,sh,placedPropFrame(d,project,s,ANG?'angle':ISO?'iso':'top'));
        continue;
      }
      const sp=ISO?sprOf(d,sh,ANG):(sh?{img:sh.img,tw:sh.tw,cols:sh.cols,margin:sh.margin,sc:d.sc,oy:d.oy||0}:null),ws=((sp?sp.sc:d.sc)||3)*s;const X=ANG?pX(d.x+.5,d.y+1):ISO?pX(d.x+1,d.y+1):ox1+(d.x+.5)*s,Y=ANG?pY(d.x+.5,d.y+1):ISO?pY(d.x+1,d.y+1):oy1+(d.y+1)*s;if(sp&&sp.img){const sx=(d.tile.idx%sp.cols)*(sp.tw+sp.margin),sy=Math.floor(d.tile.idx/sp.cols)*(sp.tw+sp.margin);cx.drawImage(sp.img,sx,sy,sp.tw,sp.tw,X-ws/2+(d.ox||0)*ws,Y-ws+(sp.oy||0)*ws,ws,ws);}if(d.cv)TC.push({d,X,Y,ws});continue;}if(n.grp){const g=n.grp,k2=s*.95/CQ,wp=ANG?g.c.width*s*1.5/CQ:g.c.width*k2,hp=ANG?g.c.height*s*1.5*ANG_R/CQ:g.c.height*k2;cx.drawImage(g.c,pX(g.xc,g.yb)-wp/2,pY(g.xc,g.yb)-hp,wp,hp);continue;}if(ISO){const q=n.p?P:(n.e||n.n||n.c||n.g);ox=pX(q.x,q.y)-q.x*s;oy=pY(q.x,q.y)-q.y*s-bridgeHeight(bridge,q.x,q.y)*bridgeUnit;}if(n.c){const c=n.c;if(c.tl)tile(c.tl.sid,c.tl.idx,ox+(c.x-.5)*s,oy+(c.y-.5)*s,s,0);else{cx.font=(s*.7)+'px serif';cx.textAlign='center';ico(c.open?'chest2':'chest',ox+c.x*s,oy+c.y*s,s*1.2);}continue;}if(n.g){const g=n.g;if(g.tl)tile(g.tl.sid,g.tl.idx,ox+(g.x-.5)*s,oy+(g.y-.5)*s,s,0);else{cx.font=(s*.8)+'px serif';cx.textAlign='center';ico('flag',ox+g.x*s,oy+g.y*s,s*1.2);}continue;}if(n.n){const q=n.n;actorShadow(q);if(!(q.anim&&AN.drawChar(cx,q,q.anim,ox+q.x*s,oy+q.y*s,s,t,{iso:ISO,ang:ANG,grounded,scale:q.visualScale,height:CF.outline?.surface?q.height:0}))){cx.save();fitActor(q,q.tl.sid,q.tl.idx,q.height||1.2);fbk(q,ox+(q.x-.5)*s,actorTop(q,q.tl.sid,q.tl.idx),s,0);cx.restore();}continue;}const q=n.p?P:n.e;actorShadow(q);
      if(n.p){if(P.inv>0&&Math.floor(t*14)%2)continue;
        cx.save();
        if(P.crouching){const y=oy+P.y*s;cx.translate(0,y);cx.scale(1,playerSize.crouching/playerSize.standing);cx.translate(0,-y);}
        if(CF.outlineHero&&!CF.heroAnim&&sheets[CF.hero.sid]?.img){
          const actor={...CF.outlineHero,tile:CF.hero,x:P.x-1,y:P.y-1};
          if(CF.outline?.surface)actor.sc=playerSize.standing*.75/Math.max(.05,tileSpan(sheets[actor.tile.sid],actor.tile.idx));
          drawPlacedProp(cx,actor,sheets[actor.tile.sid],placedPropFrame(actor,()=>[ox+P.x*s,oy+P.y*s],ISO?s:s/.75,ISO?'iso':'top'));
        }else if(!(CF.heroAnim&&AN.drawChar(cx,P,CF.heroAnim,ox+P.x*s,oy+P.y*s,s,t,{iso:ISO,ang:ANG,grounded,height:CF.outline?.surface?playerSize.standing:0,pose:P.pose,pk:q.pkT>0,hit:P.hitT>0,moveMode}))){const hs=sheets[CF.hero.sid];if(hs&&/đã gỡ/.test(hs.name)){cx.fillStyle='#e0b050';cx.beginPath();cx.arc(ox+P.x*s,oy+(P.y-.3)*s,s*.3,0,6.3);cx.fill();}else{fitActor(P,CF.hero.sid,CF.hero.idx,playerSize.standing);tile(CF.hero.sid,CF.hero.idx,ox+(P.x-.5)*s,actorTop(P,CF.hero.sid,CF.hero.idx),s,P.face<0);}}cx.restore();}
      else{const e=n.e;cx.globalAlpha=e.fl>0?.5:1;if(!(e.anim&&AN.drawChar(cx,e,e.anim,ox+e.x*s,oy+e.y*s,s,t,{iso:ISO,ang:ANG,grounded,scale:e.visualScale,height:CF.outline?.surface?e.height:0,pose:e.pose,hit:e.fl>0}))){cx.save();fitActor(e,e.tl.sid,e.tl.idx,e.height||1.2);fbk(e,ox+(e.x-.5)*s,actorTop(e,e.tl.sid,e.tl.idx),s,e.x<P.x);cx.restore();}cx.globalAlpha=1;cx.fillStyle='#000a';cx.fillRect(ox+(e.x-.35)*s,oy+(e.y-.8)*s,s*.7,3);cx.fillStyle='#e74c3c';cx.fillRect(ox+(e.x-.35)*s,oy+(e.y-.8)*s,s*.7*Math.max(0,e.hp)/e.mhp,3);}}
    for(const q of TC){const d=q.d,zb=d.zb||[-(d.fx||1),-(d.fy||1),d.fx||1,d.fy||1],x0=d.x+1+zb[0]-.7,y0=d.y+1+zb[1]-.7,ins=P.x>x0&&P.x<x0+zb[2]+1.4&&P.y>y0&&P.y<y0+zb[3]+1.4;d._a=(d._a==null?1:d._a)+((ins?.3:1)-(d._a==null?1:d._a))*.2;const sh=sheets[d.cv.sid];if(!sh||!sh.img)continue;const sx=(d.cv.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(d.cv.idx/sh.cols)*(sh.tw+sh.margin);cx.globalAlpha=d._a;cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,q.X-q.ws/2+(d.ox||0)*q.ws,q.Y-q.ws+(d.oy||0)*q.ws,q.ws,q.ws);cx.globalAlpha=1;}
    if(ISO)for(const g of OVG){const ins=P.x>g.x0-.4&&P.x<g.x1+.4&&P.y>g.y0-.4&&P.y<g.y1+.4;g.a+=((ins?.35:1)-g.a)*.18;const k2=s*.95/CQ,wp=g.c.width*k2,hp=g.c.height*k2;cx.globalAlpha=g.a;cx.drawImage(g.c,pX(g.xc,g.yb)-wp/2,pY(g.xc,g.yb)-hp,wp,hp);cx.globalAlpha=1;}
    for(const d of covers){
      const project=ISO?(x,y)=>[pX(x,y),pY(x,y)]:(x,y)=>[ox1+x*s,oy1+y*s];
      const footprint=actorFootprint(P.x,P.y,.28);
      const ceiling=d.ceiling||housePlanes.get(d.id);
      const inside=!!ceiling&&Number.isFinite(lowestCeiling([ceiling],footprint))&&fitsUnderRoof([ceiling],footprint,postureHeight(P));
      cx.globalAlpha=inside?.4:1;
      drawPlacedProp(cx,d,sheets[d.tile?.sid],placedPropFrame(d,project,s,ANG?'angle':ISO?'iso':'top'));
    }
    drawSettlementBridge(cx,bridge,bridgeProject,bridgeUnit,true);
    cx.globalAlpha=1;
    if(ISO&&FOG)drawFog(cx,w,h,FOG,t,(P.x-P.y)*s*.75,(P.x+P.y)*s*.375);
    ox=ox1;oy=oy1;for(const d of DR){if(d.gate)continue;if(ISO){ox=pX(d.x,d.y)-d.x*s;oy=pY(d.x,d.y)-d.y*s;}cx.font=(s*.8)+'px serif';cx.textAlign='center';ico('door',ox+d.x*s,oy+d.y*s,s*1.2);}
    if(!ISO)cx.drawImage(top,ox,oy,W*s,H*s);
    if(window.__dbg){window.__P=P;window.__Z=ZS;}
    if(dbgMode||window.__dbg){cx.save();const Tq=ISO?((x,y)=>[pX(x,y),pY(x,y)]):((x,y)=>[ox1+x*s,oy1+y*s]);
      if(collision.floor)drawFloorCollision(cx,collision.floor,Tq,w,h,dbgMode===2||window.__dbg);
      else if(dbgMode===2||window.__dbg){cx.fillStyle='rgba(40,220,90,.2)';cx.beginPath();for(const [a,b] of [[0,0],[W,0],[W,H],[0,H]]){const q=Tq(a,b);cx.lineTo(q[0],q[1]);}cx.closePath();cx.fill();}
      cx.save();if(collision.floor)clipOutline(cx,collision.floor,Tq);
      cx.fillStyle='rgba(255,40,40,.5)';for(let i=0;i<W*H;i++)if(collision.tileBlocked(i)){const x=i%W,y=(i/W)|0;cx.beginPath();for(const [a,b] of [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]){const q=Tq(a,b);cx.lineTo(q[0],q[1]);}cx.closePath();cx.fill();}
      cx.restore();cx.fillStyle='rgba(255,40,40,.30)';cx.strokeStyle='#ff8a8a';cx.lineWidth=1.5;for(const q of ZS){if(q.k==='line'){cx.save();cx.strokeStyle='rgba(255,40,40,.5)';cx.lineWidth=(q.th||.6)*s;cx.lineJoin='round';zPath(cx,q,Tq);cx.stroke();cx.restore();}else{zPath(cx,q,Tq);cx.fill();cx.stroke();}}
      for(const q of placementZones){
        cx.fillStyle=q.estimated===false?'rgba(255,40,40,.5)':'rgba(255,170,45,.45)';
        cx.strokeStyle=q.estimated===false?'#ff8a8a':'#ffbd69';
        zPath(cx,q,Tq);cx.fill();cx.stroke();
      }
      cx.save();if(collision.floor)clipOutline(cx,collision.floor,Tq);
      cx.fillStyle='rgba(255,64,64,.45)';cx.strokeStyle='#ff9792';
      for(const roof of ceilings){
        const blocked=roofBlockedFootprint(roof,postureHeight(P),.28);
        if(!blocked)continue;
        const [l,t,r,b]=blocked;
        cx.beginPath();for(const q of [[l,t],[r,t],[r,b],[l,b]])cx.lineTo(...Tq(...q));
        cx.closePath();cx.fill();cx.stroke();
      }
      cx.restore();
      cx.restore();}
    if(showGrid||showReach){const TQ=ISO?((x,y)=>[pX(x,y),pY(x,y)]):((x,y)=>[ox1+x*s,oy1+y*s]);cx.save();
      if(showReach&&REACH){cx.save();if(collision.floor)clipOutline(cx,collision.floor,TQ);for(let i=0;i<W*H;i++){const f=REACH[i],fl=M.layers[0][i];if(!f&&!fl)continue;const x=i%W,y=(i/W)|0;cx.fillStyle=f?'rgba(60,220,110,'+(.16+.26*f)+')':'rgba(255,150,40,.3)';cx.beginPath();for(const [a,b] of [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]){const q=TQ(a,b);cx.lineTo(q[0],q[1]);}cx.closePath();cx.fill();}cx.restore();}
      if(showGrid){cx.strokeStyle='rgba(255,255,255,.28)';cx.lineWidth=1;cx.beginPath();for(let x=0;x<=W;x++){const a=TQ(x,0),b=TQ(x,H);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}for(let y=0;y<=H;y++){const a=TQ(0,y),b=TQ(W,y);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}cx.stroke();}
      cx.restore();}
    if(PATH&&PATH.length){const TQ=ISO?((x,y)=>[pX(x,y),pY(x,y)]):((x,y)=>[ox1+x*s,oy1+y*s]);cx.save();cx.strokeStyle='rgba(255,230,120,.9)';cx.lineWidth=2;cx.setLineDash([6,5]);cx.beginPath();let a=TQ(P.x,P.y);cx.moveTo(a[0],a[1]);for(const q of PATH){a=TQ(q.x,q.y);cx.lineTo(a[0],a[1]);}cx.stroke();cx.setLineDash([]);const g=TQ(GOAL.x,GOAL.y);cx.fillStyle='rgba(255,230,120,.9)';cx.beginPath();cx.ellipse(g[0],g[1],s*.32,s*.16,0,0,6.3);cx.fill();cx.restore();}
    if(ISO){ox=pX(P.x,P.y)-P.x*s;oy=pY(P.x,P.y)-P.y*s;}
    if(ISO&&said){const q=said.n;ox=pX(q.x,q.y)-q.x*s;oy=pY(q.x,q.y)-q.y*s;}
    if(said){const q=said.n,tx=(q.name?q.name+': ':'')+q.text;cx.font='bold '+Math.max(13,s*.38)+'px system-ui';const wd=Math.min(w-20,cx.measureText(tx).width+24);const bx=Math.max(10,Math.min(w-wd-10,ox+q.x*s-wd/2)),by=oy+(q.y-1.35)*s;cx.fillStyle='#fffffff0';cx.fillRect(bx,by-22,wd,34);cx.fillStyle='#222';cx.textAlign='left';cx.fillText(tx,bx+12,by);}
    cx.font='bold '+(s*.5)+'px system-ui';cx.textAlign='left';cx.fillStyle='#fff';{const hy=calcTop()+14;if(CF.hp>10){ico('heart',20,hy,22);cx.fillText('×'+Math.max(0,P.hp),38,hy+6);}else for(let i=0;i<Math.max(0,P.hp);i++)ico('heart',20+i*24,hy,22);}cx.textAlign='center';cx.fillText('👾 '+E.length+(score?'  ⭐'+score:''),w/2,calcTop()+22);
    if(stick){cx.strokeStyle='#fff6';cx.lineWidth=3;cx.beginPath();cx.arc(stick.ox,stick.oy,44,0,6.3);cx.stroke();cx.fillStyle='#fff5';cx.beginPath();cx.arc(stick.ox+stick.x*34,stick.oy+stick.y*34,22,0,6.3);cx.fill();}
    drawMiniMap();
  }
  const calcTop=()=>10;
  function fbk(q,x,y,s,flip){if(q.anim){cx.fillStyle='#e0b050';cx.beginPath();cx.arc(x+s/2,y+s*.3,s*.28,0,6.3);cx.fill();cx.fillStyle='#222';cx.font='bold '+(s*.35)+'px system-ui';cx.textAlign='center';cx.fillText((q.name||'?')[0],x+s/2,y+s*.42);}else tile(q.tl.sid,q.tl.idx,x,y,s,flip);}
  function loop(ts){if(dead)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;upd(dt);if(dead)return;draw();raf=requestAnimationFrame(loop);}
  // ---- điều khiển ----
  const kd=e=>{if(e.key==='Escape'&&(o.onSnapshot||o.escapeExit)){e.preventDefault();stop();return;}if(e.key==='Shift'&&!e.repeat){toggleMoveMode();e.preventDefault();return;}const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=1;if(k==='+'||k==='='){setZ(zm*1.25);}if(k==='-'||k==='_'){setZ(zm*.8);}if(k==='e'){toggleDoor();}if(k==='c'&&!e.repeat){toggleCrouch();e.preventDefault();}if(/^[1-9]$/.test(k)){attack(+k-1);e.preventDefault();}else if(k===' '||k==='j'){attack();e.preventDefault();}else if(k.startsWith('Arrow'))e.preventDefault();},ku=e=>{keys[e.key.length===1?e.key.toLowerCase():e.key]=0;};
  addEventListener('keydown',kd);addEventListener('keyup',ku);
  atk.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();attack();});
  let clk=null;cv.addEventListener('pointerdown',e=>{clk={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId};},true);
  cv.addEventListener('pointerup',e=>{if(!clk||e.pointerId!==clk.id)return;const c=clk;clk=null;if(SIDE||Math.hypot(e.clientX-c.x,e.clientY-c.y)>10||performance.now()-c.t>400)return;const q=toPlane(e.clientX,e.clientY);if(q){
    const gate=o.onDoor&&DR.find(d=>d.gate&&Math.hypot(d.gx-q.x,d.gy-q.y)<.85);
    if(gate)goTo(gate.x,gate.y);else goTo(q.x,q.y);
  }},true);
  cv.addEventListener('pointerdown',e=>{if(stick||e.clientX>innerWidth*.62)return;cv.setPointerCapture(e.pointerId);stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0};});
  cv.addEventListener('pointermove',e=>{if(!stick||e.pointerId!==stick.id)return;let dx=e.clientX-stick.ox,dy=e.clientY-stick.oy;const d=Math.hypot(dx,dy),mx=44;if(d>mx){dx*=mx/d;dy*=mx/d;}stick.x=dx/mx;stick.y=dy/mx;});
  const up=e=>{if(stick&&e.pointerId===stick.id)stick=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  const saveOnClose=()=>{if(o.onSnapshot&&P?.hp>0)o.onSnapshot(snapshot());};
  if(o.onSnapshot)addEventListener('pagehide',saveOnClose);
  function stop(silent){removeEventListener('pagehide',saveOnClose);dead=1;cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);ov.remove();if(!silent&&o.onSnapshot&&P.hp>0)o.onSnapshot(snapshot());if(!silent&&o.onExit)o.onExit();}
  try{
    document.body.append(ov);
    document.activeElement?.blur?.();
    start();
    if(o.escapeExit)draw();
    if(o.onSnapshot&&P.hp>0)o.onSnapshot(snapshot());
    raf=requestAnimationFrame(loop);
    return {stop};
  }catch(error){stop(true);throw error;}
}

/* Nhiều màn: nối các bản đồ bằng cửa, lưu tiến độ trong trình duyệt */
export function playGame(o){const D=o.M;if(!D.maps||D.maps.length<2)return play2D(o);
  const key='thk_save_'+(D.gid||'g'),maps=D.maps,first=campaignStart(maps,o.startMap??D.startMap);
  let cur=null,stopped=false;
  const landingCache=new Map();
  const landing=d=>{
    const key=[d.to,d.tx,d.ty].join(':');
    if(!landingCache.has(key))landingCache.set(key,mapLinkLanding(maps,d));
    return landingCache.get(key);
  };
  const run=(i,sp)=>{
    cur=play2D({M:{...maps[i]},sheets:o.sheets,spawn:sp,canUseDoor:landing,onExit:()=>{stopped=true;o.onExit&&o.onExit();},
      onTick:q=>{if(o.preview)return;try{localStorage.setItem(key,JSON.stringify({i,x:q.x,y:q.y,hp:q.hp,score:q.score}));}catch(e){}},
      onDoor:d=>{
        const dp=landing(d);
        if(!dp)return;
        if(!o.preview)try{localStorage.setItem(key,JSON.stringify({i:d.to,x:dp.x,y:dp.y,hp:d.hp,score:d.score}));}catch(e){}
        const c=cur;setTimeout(()=>{c.stop(true);if(!stopped)run(d.to,{...dp,hp:d.hp,score:d.score});},0);
      }});
  };
  let sv=null;if(!o.preview)try{sv=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
  if(sv&&maps[sv.i]){
    const ov=el('div',{style:'position:fixed;inset:0;z-index:300;background:#10161d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font:700 22px system-ui'});
    const b=(t,f,c)=>el('div',{style:'padding:12px 26px;border-radius:20px;color:#2a1a08;font-size:18px;background:'+c,onclick:()=>{ov.remove();f();}},t);
    ov.append(el('div',{},'Có tiến độ đã lưu'),el('div',{style:'font-size:15px;font-weight:400;opacity:.8'},(maps[sv.i].name||'Màn '+(sv.i+1))+' · ❤️'+sv.hp+(sv.score?' · ⭐'+sv.score:'')),
      b('▶ Tiếp tục',()=>run(sv.i,{x:sv.x,y:sv.y,hp:sv.hp,score:sv.score}),'#e0b050'),
      b('↺ Chơi mới',()=>{try{localStorage.removeItem(key);}catch(e){}run(first,null);},'#cfd8e3'));
    document.body.append(ov);
  }else run(first,null);
  return {stop(){stopped=true;cur&&cur.stop();}};}
