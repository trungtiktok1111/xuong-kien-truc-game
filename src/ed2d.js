import {characterRoles} from './characterRoles.js';
import {characterNameKey,mergeAnimationClips} from './animationClips.js';
import {baseAnchorPoints} from './baseAnchors.js';
import {cropContactFrame} from './cropContact.js';
import {drawAssemblyGuides} from './assemblyGuides.js';
import {stonePavingSheets} from './stonePaving.js';
import {applyOutlinePropEdits,arrangementLayer,canArrangeProp,propFootprint,propPlacement,propGroup,transformPropGroup,scaleProp} from './outlinePropPlacement.js';
import {drawSurfaceTerrain,surfaceTerrainTile} from './surfaceContours.js';
import {outlineHeight} from './outlineAnchors.js';
import {surfaceLevelById} from './surfaceLibrary.js';
import {planSurface,surfaceReachable,surfaceKinds,surfaceHash,surfaceProfiles} from './surfaceTerrain.js';
import {surfaceSheet,surfaceRock,SURFACE_VARIANTS} from './surfaceArt.js';
import builtinOutlineArchive from '../assets/kenney-outline.zip';
import {dressOutline,kenneyOutlinePacks} from './outlineDressing.js';
import {campaignStart,linkWalkability,planMapPair,safeMapEntry} from './mapLinks2d.js';
import {stockScenes,packPurpose} from './stockScenes.js';
import {drawSettlementBridge} from './settlementBridge.js';
import {settlementIssues} from './settlementChecks.js';
import {settlementCriteria} from './settlementCriteria.js';
import {alignmentGuides,measureJoin,roofHeightAt,seamHeightDifference,JOIN_EPSILON} from './pieceAlignment.js';
import {actorHeights,bodyHeight,bodyFootprint,roofPlane} from './headroom2d.js';
import {DEFAULT_OUTLINE_WALL_HEIGHT,usedGridBounds,rebaseOutlineSource} from './outlineGrid.js';
import {builtWallFaces,mountGate,outlineSupports,isMapLink,projectSegment,wallThickness,WALL_THICKNESS,WALL_MIN_THICKNESS,WALL_MAX_THICKNESS} from './wall2d.js';
import {gateWalls,gateZones} from './gate2d.js';
import {constructionContext,gateIssue,propIssue,wallIssue,isRoof,isBearingColumn,roofBearing,roofOnGround,roofIssue,wallHasFoundation,headroomIssue} from './constructionRules2d.js';
import {automaticPaintZones, daXoayArchProfiles, estimateContact, makePaintProfile, paintedPieces, paintFamily, roofTextureDirection, sceneEntityLayer, propContact, resizeProp, turnProp} from './placement2d.js';
import {openArchivePicker} from './archivePicker.js';
import {tiledDepth} from './tiledScene.js';
import {buildReferenceScene,generateScene,openScenePack,outlineMiniatureFolder,outlinePackMaterials,outlineImageChoices,outlineManualImage,reconstructPack} from './scenePacks.js';
import {settlementProfiles} from './settlementLayout.js';
import {DA_XOAY_LEVEL} from './outlineLevels.js';
import {mapCollision,rasterOutline} from './mapCollision.js';
import {outline2D,clipOutline,stoneBackdrop,drawFloorSlab,stoneWall,outlineWallImage,wallSurface,drawFloorCollision} from './outline2d.js';
import {drawOutlineDraft} from './outlineDraftView.js';
import {validOutline,OUTLINE_STONE,MAX_MAP_SIDE} from './outlineEditor.js';
import {newMeta,openProjectFile,saveProjectFile} from './studio.js';
const LEGACY_STONE_ATLAS="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAAQCAYAAAD506FJAAACwklEQVR4nO2aXWrcMBDH/xpJ9+oN+tRL9BA9Qe+1sIQQNiRpSrv9ThtSSumrvvpQRshae7H9UBk0A2at8fhv/TRrI42tXr96mdDY3h4fEEKA1jr/xhhHfWV7jv9c7M3dES+eP2uNjy/ffzXhv7i83QT/h89PTfivru83wf/j6U8T/t3+AAMAb959BQCklJBSyvvW2kG73rfWTh6bo8E3IPu89zDGIMaIGGM+l4gQQoAxJscqpUBEOZaIFmuwffr2swk/34Ct+d9/fGzCzzdga/6Hx99N+Hf7Q3N+Uw4Ei9Y+Fi7bSimEEE7ilmiwpZROYspOEhGUUogxZp9zLieAiFZp1Cb8wt8bvyk7QERwzuVgFlNKQWsNpRSUUtnHcSXYEo3aWidA+IW/N34qB8A5B601tNYnUw2ebpR+7/1gWrFUo0wA8O8p5b3PMSklOOfgvYfWGsYYGGMGmnydNRr1H0D4hb83/sGjouxkOVXg9UM9ANyBOnauxlYSIPzC3yt/ngFwYAgBIYRcPOAL8dNjqgixRmNLCRB+4e+R3wDIxYQajNsA8nqDT/be5/3y/CUaUwng6mWMMQ+eMeZE81wC5miwCb/w98o/KAJysYKFeL8saDjn8jHe6mnJXI0tJUD4hb9H/tHXgFxI4I577zOAtTZDMjCfs1RjKwkQfuHvlT/XAPjVBa8V6mrjWBGi/LpojcZUAnidVA5MOa0pY9m/RqNMgPALf4/8o0XAupPsnyqC1P65GltJgPALf6/8+TUgTxeIaFS09AEY+MtOLdHYSgKEX/h75TdlB6a+TlriXxJbxzCUUmoweNbagQ/AwD+WgDkabMIv/L3yD94C1FtZ7OBtrAhxzn9OYysJEH7h75U/fwcQQhhUK4loMDB8vKyClvFrNNhu7o6Tyfkf1pr/4vK2IX17/qvr+4b07fl3+0Mz9r+/DsK8K29SBgAAAABJRU5ErkJggg==";
import {guideFor} from './editorHelp.js';
import {openRefMap} from './refmap.js';
import {bakeLayer0,noiseOverlay,paintSlab,drawFog} from './groundfx.js';
import {logicTab,entExtra} from './logic.js';
import {animTab,animPick,uniqNames,makeAnims} from './anim.js';
import {unzipSync} from 'fflate';
import {initMau} from './mau2d.js';
import {$,el,toast,saveFile,lsGet,lsSet,pickFile,pickFiles,idbSet,idbGet,idbDel,guessTile,ask,askText,yes,zipBrowser,slotsUI,isRar} from './util.js';
const CELL=16,LAYN=['Nền','Phủ nền','Vật thể','Mái / cửa'];
const enc=(sid,idx,f=0)=>((sid*4096+idx)*8+f)+1;
const dec=v=>{const n=v-1;const f=n&7,t=n>>3;return {sid:t>>12,idx:t&4095,f};};
import {placedPropFrame,placedPropBounds,drawPlacedProp,roofThickness,placementAnchors,placementAnchorNames,placementAnchorOffset,ANG_R,ensureAngle,sprOf,tileAng,depthAng} from './proj.js';
import {genRule,RULES,RULE_TEXT,SHAPES,SB_KIEU,loadProfiles} from './genrule.js';
import {build,GEN_KINDS,GEN_KIND_PACK,GEN_KIND_VAT,GEN_VIEWS} from './gen2d.js';
import {slab,shore,tile192,mirF,derim} from './isoslab.js';
import {nenIndex,nenPack,nenTag,vatIndex,vatPack,registerPack,customPackRecords} from './nen.js';
import {readZip,buildPack,ROLES,FAMILIES,exportPackZip} from './pack.js';
import {decoZones,ZK,isBox,isPts,mkBox,mkPts,zHit,zPts,zBounds,zCenter,zMove,zScale,zRotate,zClone,zHandles,zDragHandle,zPath,toLocal} from './zones.js';
export function init2D(root,A){
  const sheets=A.sheets.map(s=>Object.assign({},s));let curSheet=0,shZ='fit';let HID=new Set([0,1,2,3,...lsGet('thk_hide2d',[])]);const visSh=()=>sheets.map((s,i)=>i).filter(i=>!HID.has(i));
  const loadSheet=s=>new Promise(r=>{const i=new Image();i.onload=()=>{s.img=i;s.cols=Math.floor((i.width+s.margin)/(s.tw+s.margin));s.rows=Math.floor((i.height+s.margin)/(s.tw+s.margin));r();};i.onerror=r;i.src=s.url;});
  let simple=(()=>{try{return localStorage.getItem('thk_simple')!=='0';}catch(e){return true;}})();
  let fillArm=false,eraseActors=false,eraseSelected=null,showPieceNames=lsGet('thk_piece_names',false);
  const eraseScope=()=>eraseActors?5:act;
  let colMode=0,selId=null,objType=null,M=null,vis=[1,1,1,1,0],act=2,tool='draw',stamp={w:1,h:1,multi:false,tiles:[0]},sel=null,undo=[],redo=[],view={x:10,y:10,z:3},grid=true,hov=null,dirty=true,lib=lsGet('thk_stamps',[]);
  const mc=document.createElement('canvas'),mx=mc.getContext('2d');let clip=null,inclEnt=true,inclBlk=true;
  const cv=$('#cv2'),cx=cv.getContext('2d');
  const aimTitle=el('strong'),aimHint=el('div');
  const aimHud=el('div',{class:'map-aim',hidden:''},aimTitle,aimHint);
  cv.after(aimHud);
  {const H2={draw:'<b>Đặt mảnh</b>: chạm/kéo = đặt mảnh đã chọn · Kéo 2 ngón = phóng/thu và di chuyển · Chuột giữa hoặc Space+kéo = di chuyển bản đồ',erase:'<b>Xóa</b>: kéo = xóa ô ở lớp đang vẽ',fill:'<b>Đổ</b>: bấm = đổ đầy vùng cùng loại',rect:'<b>Hình CN</b>: kéo = tô cả hình chữ nhật',pick:'<b>Hút</b>: bấm ô trên bản đồ để lấy làm cọ',select:'<b>Chọn vùng</b>: kéo khung → Sao chép / Cắt / Lấy làm stamp',paste:'<b>Dán</b>: bấm để dán vùng đã sao chép',zone:'<b>Vùng chặn</b>: kéo vẽ vùng nhân vật không đi qua được',pan:'<b>Kéo</b>: kéo để di chuyển bản đồ'};
  const hb=document.createElement('div');hb.className='legacy-map-help';hb.style.cssText='position:absolute;left:10px;top:10px;z-index:5;pointer-events:none;background:rgba(15,22,30,.78);color:#cfe;font:12px/1.5 system-ui;padding:6px 10px;border-radius:8px;max-width:430px';
  const host=document.getElementById('v2d');host.style.position='relative';host.append(hb);let lt='';
  setInterval(()=>{const mob=!window.matchMedia('(min-width: 980px) and (pointer: fine)').matches;const lay=['Nền','Phủ nền','Vật thể','Mái/cửa','Vùng chặn','Đối tượng'][tool==='erase'?eraseScope():act]||'';const t=mob?'':(H2[tool]||'')+' · ';const x=t+'Lớp đang sửa: '+lay;
    if(mob){const c=document.getElementById('cv2');const w=c?c.getBoundingClientRect().width:0;hb.style.maxWidth=Math.max(120,w-20)+'px';hb.style.whiteSpace='nowrap';hb.style.overflow='hidden';hb.style.textOverflow='ellipsis';hb.style.font='11px/1.3 system-ui';hb.style.padding='3px 8px';}
    else{hb.style.maxWidth='430px';hb.style.whiteSpace='';hb.style.overflow='';hb.style.textOverflow='';hb.style.font='12px/1.5 system-ui';hb.style.padding='6px 10px';}
    if(x!==lt){lt=x;hb.innerHTML=x;}},300);}

  // ===== dữ liệu =====
  const defCfg=()=>({hp:5,spd:4.2,dmg:1,rng:1.35,hero:{sid:2,idx:88},win:'auto'});
  const newMap=(w,h)=>({w,h,layers:[0,1,2,3].map(()=>new Array(w*h).fill(0)),blk:new Array(w*h).fill(0),ents:[],cfg:defCfg()});
  const clone=m=>({name:m.name,w:m.w,h:m.h,layers:m.layers.map(l=>l.slice()),blk:m.blk.slice(),ents:JSON.parse(JSON.stringify(m.ents||[])),cfg:Object.assign(defCfg(),JSON.parse(JSON.stringify(m.cfg||{})))});
  function pushUndo(){undo.push(clone(M));if(undo.length>40)undo.shift();redo=[];}
  function doUndo(){if(!undo.length)return;redo.push(clone(M));const before=M;M=undo.pop();if(M.w!==before.w||M.h!==before.h)fit();after();ui.obj();if(tool==='erase')draw();}
  function doRedo(){if(!redo.length)return;undo.push(clone(M));const before=M;M=redo.pop();if(M.w!==before.w||M.h!==before.h)fit();after();ui.obj();if(tool==='erase')draw();}
  let saveT,buildRevision=0;function after(){buildRevision++;dirty=true;saveStatus.textContent='Đang chờ tự lưu…';clearTimeout(saveT);saveT=setTimeout(save,700);}
  let warned=0;
  const saveStatus=el('p',{class:'hint',role:'status'},'Chưa có lần tự lưu trong phiên này');
  async function save(){const custom=sheets.slice(4).map(s=>({name:s.name,url:s.url,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null,phaseBrush:s.phaseBrush}));syncCur();const base={w:M.w,h:M.h,layers:M.layers,blk:M.blk,ents:M.ents,cfg:M.cfg,name:M.name,maps:MAPS,cur:curMap};
    const okI=custom.length?await idbSet('thk_sheets2d',custom):await idbSet('thk_sheets2d',[]);
    const payload={...base,custom:okI?[]:custom};
    let okL=lsSet('thk_proj2d',payload);
    if(!okL){
      okL=await idbSet('thk_proj2d_large',payload);
      if(okL)lsSet('thk_proj2d',{large:true});
    }
    saveStatus.textContent=okL?'Đã tự lưu trên trình duyệt này.':'Chưa tự lưu được. Hãy bấm Lưu dự án.';
    if(!okL&&!warned){warned=1;toast('Chưa tự lưu được. Chọn Tệp → Lưu dự án để giữ bản sao.');}}
  // ===== vẽ ô =====
  function drawTile(c,v,dx,dy,s,source=sheets){if(!v)return;const d=dec(v),sh=source[d.sid];if(!sh||!sh.img)return;const col=d.idx%sh.cols,row=Math.floor(d.idx/sh.cols);
    const sx=col*(sh.tw+sh.margin),sy=row*(sh.tw+sh.margin);
    if(!d.f){c.drawImage(sh.img,sx,sy,sh.tw,sh.tw,dx,dy,s,s);return;}
    c.save();c.translate(dx+s/2,dy+s/2);if(d.f&4){c.rotate(Math.PI/2);c.scale(1,-1);}if(d.f&1)c.scale(-1,1);if(d.f&2)c.scale(1,-1);c.drawImage(sh.img,sx,sy,sh.tw,sh.tw,-s/2,-s/2,s,s);c.restore();}
  function rebuild(){mc.width=M.w*CELL;mc.height=M.h*CELL;mx.imageSmoothingEnabled=false;mx.clearRect(0,0,mc.width,mc.height);
    for(let l=0;l<4;l++){if(!vis[l])continue;const a=M.layers[l];for(let i=0;i<a.length;i++)if(a[i])drawTile(mx,a[i],(i%M.w)*CELL,Math.floor(i/M.w)*CELL,CELL);}}

  // ===== đối tượng =====
  const OT={start:['🚩','Xuất phát','#3ddc84'],enemy:['👾','Quái','#ff5a5a'],npc:['🧑','NPC','#4fa8ff'],chest:['🎁','Rương','#ffd24a'],goal:['🏁','Đích','#c77dff'],door:['🚪','Cửa chuyển màn','#ffa94d'],deco:['🏠','Vật cảnh','#d9a066']};
  const AIL=[['wander','Đi lang thang + đuổi'],['chase','Luôn đuổi theo'],['still','Đứng yên']];
  const selEnt=()=>M&&M.ents.find(e=>e.id===selId);
  const entAt=(x,y)=>{for(let i=M.ents.length-1;i>=0;i--){const e=M.ents[i];if(e.x===x&&e.y===y)return e;}return null;};
  function newEnt(t,x,y){const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    const b={id,t,x,y,name:OT[t][1]};
    if(t==='start'){b.tile=null;}
    if(t==='enemy'){Object.assign(b,{tile:{sid:2,idx:108},hp:2,dmg:1,spd:1.7,chase:6,ai:'wander'});}
    if(t==='npc'){Object.assign(b,{tile:{sid:2,idx:96},name:'Dân làng',text:'Chào kiếm sĩ! Cẩn thận quái vật quanh đây.'});}
    if(t==='chest'){Object.assign(b,{tile:null,gives:'hp',amt:2});}
    if(t==='goal'){b.tile=null;}
    if(t==='door'){Object.assign(b,{name:'Cửa',tile:null,to:Math.min(MAPS.length-1,curMap+1)===curMap?0:curMap+1,tx:null,ty:null});}
    return b;}
  function drawEnts(z){isoHB=[];if(vis[2])for(const wall of builtWallFaces(renderWallEnts(),true))drawGateWall(wall);for(const e of M.ents){
      if(e.wallLine)continue;
      if(e.placedProp){if(vis[sceneEntityLayer(e)]){for(const wall of gateWalls(e,true))drawGateWall(wall);drawIndependentProp(e);}continue;}
      const X=view.x+e.x*CELL*z,Y=view.y+e.y*CELL*z,S=CELL*z,col=OT[e.t][2];
      const [px,py]=g2s(e.x+.5,e.y+.5),size=S*(e.visualScale??1);
      const animated=e.anim&&isoAN()?.drawChar(cx,{x:0,y:0},e.anim,px,py,S,performance.now()/1000,
        {grounded:true,scale:e.visualScale});
      if(!animated&&e.tile&&e.t!=='deco'){drawTile(cx,enc(e.tile.sid,e.tile.idx),px-size/2,py-size/2,size);}
      else if(!animated){cx.fillStyle='#0008';cx.fillRect(X+1,Y+1,S-2,S-2);if(S>=14){cx.font='bold '+Math.max(8,S*.32)+'px system-ui';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle='#fff';cx.fillText((e.name||OT[e.t][1]).slice(0,4),X+S/2,Y+S/2+1);}}
      cx.strokeStyle=col;cx.lineWidth=e.id===selId?3:1.5;cx.strokeRect(X+1,Y+1,S-2,S-2);
      isoHB.push({e,r:[X,Y,X+S,Y+S],f:[e.x,e.y,e.x+1,e.y+1]});
      if(z>=2.2){cx.font='bold '+Math.max(9,S*.3)+'px system-ui';cx.textAlign='center';cx.textBaseline='alphabetic';cx.fillStyle=col;cx.fillText(OT[e.t][0],X+S*.2,Y+S*.3);}}
    cx.textBaseline='alphabetic';}
  function objDown(c){const ex=(lastPt?entAtScreen(lastPt.x,lastPt.y,e=>e.legacyIndex==null)||wallAtScreen(lastPt):null)||entAt(c.x,c.y);
    if(!ex&&!inb(c.x,c.y))return;
    if(!ex&&!objType){selId=null;ui.obj();return;}
    pushUndo();
    if(ex?.wallLine){undo.pop();selId=ex.id;draw();return;}
    if(ex){selId=ex.id;const at=s2g(lastPt.x,lastPt.y);drag=ex.placedProp?{ent:true,precise:true,dx:at.x-ex.x,dy:at.y-ex.y,from:[ex.x,ex.y],original:structuredClone(ex)}:{ent:true,dx:c.x-ex.x,dy:c.y-ex.y,from:[ex.x,ex.y],original:structuredClone(ex)};}
    else if(objType==='start'&&M.ents.some(e=>e.t==='start')){const s=M.ents.find(e=>e.t==='start');s.x=c.x;s.y=c.y;selId=s.id;drag={ent:true};}
    else if(objType==='deco'){if(!vatSel){toast('Chọn một vật thể trong danh sách bên dưới trước');return;}const it=vatSel,n={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:'deco',x:c.x,y:c.y,f:it.f,fx:it.fx,fy:it.fy,sc:it.sc,ox:it.ox,oy:it.oy,flat:it.role==='Phủ nền',name:it.name,tile:it.tile,zb:it.zb};if(it.zps)n.zps=JSON.parse(JSON.stringify(it.zps));if(it.col)n.col=JSON.parse(JSON.stringify(it.col));if(it.cal!=null)n.cal=it.cal;if(it.walk||it.role==='Phủ nền')n.walk=true;if(it.estimated)n.estimated=true;if(it.cv)n.cv=it.cv;M.ents.push(n);selId=n.id;drag={ent:true};}
    else{const n=newEnt(objType,c.x,c.y);M.ents.push(n);selId=n.id;drag={ent:true};}
    if(!ex&&!acceptStructure()){drag=null;selId=null;ui.obj();return;}
    after();ui.obj();}
  // ===== chế độ iso (nhìn giống lúc chơi) =====
  let lastPt=null,isoC=null,isoK='',isoHB=[];
  function fogLv(){return (M&&M.cfg&&M.cfg.fog)|0;}
  function smoothOn(){return !(M&&M.cfg&&M.cfg.smooth===false);}
  function ISOQ(){return !!(M&&M.cfg&&M.cfg.view==='iso');}
  const ANGQ=()=>ISOQ()&&M.cfg.proj==='angle';let angN=-1;
  function g2s(gx,gy){const S=CELL*view.z;if(ANGQ())return [view.x+gx*2*S,view.y+gy*2*S*ANG_R];return ISOQ()?[view.x+(gx-gy)*S,view.y+(gx+gy)*S*.5]:[view.x+gx*S,view.y+gy*S];}
  function s2g(px,py){const S=CELL*view.z;if(ANGQ())return {x:(px-view.x)/(2*S),y:(py-view.y)/(2*S*ANG_R)};if(ISOQ()){const u=(px-view.x)/S,v=(py-view.y)/(S*.5);return {x:(u+v)/2,y:(v-u)/2};}return {x:(px-view.x)/S,y:(py-view.y)/S};}
  function pathQ(x,y,w,h){const a=g2s(x,y),b=g2s(x+w,y),c=g2s(x+w,y+h),d=g2s(x,y+h);cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.lineTo(c[0],c[1]);cx.lineTo(d[0],d[1]);cx.closePath();}
  function tileG(v,gx,gy){if(!v)return;const S=CELL*view.z,p=g2s(gx,gy);
    if(!ISOQ()){drawTile(cx,v,p[0],p[1],S);return;}
    const d=dec(v),sh=sheets[d.sid];if(!sh||!sh.img)return;
    if(ANGQ()){if(sh.iso&&sh.A)tileAng(cx,sh.A,d.idx,p[0],p[1],2*S);else if(!sh.iso){cx.save();cx.transform(2*S,0,0,2*S*ANG_R,p[0],p[1]);drawTile(cx,v,0,0,1);cx.restore();}return;}
    if(sh.iso){const sx=(d.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(d.idx/sh.cols)*(sh.tw+sh.margin);if(sh.iso===2)tile192(cx,sh.img,sx,sy,sh.tw,sh.cy||0,p[0],p[1],S,sh.wat&&sh.wat.includes(d.idx)?mirF(gx,gy):0);else slab(cx,sh.img,sx,sy,sh.tw,p[0],p[1],S,d.f||0);return;}
    cx.save();cx.transform(S,S/2,-S,S/2,p[0],p[1]);drawTile(cx,v,0,0,1);cx.restore();}
  function isoBuild(){const W=M.w,H=M.h,nl=sheets.filter(s=>s&&s.img).length;let h=0;
    for(let l=0;l<4;l++){const a=M.layers[l];for(let i=0;i<a.length;i++)h=(h*31+a[i]+i)|0;}
    const want=CELL*view.z*(window.devicePixelRatio||1)*(smoothOn()?1.6:1.1);let CQ=[32,48,64,96,128].find(t=>t>=want)||128;while(W*H*CQ*CQ>3e7&&CQ>8)CQ-=8;
    const key=W+'x'+H+'|'+JSON.stringify(M.cfg.outline?.surface)+'|'+(M.cfg.outline?.surfaceMaterials||[]).join('|')+'|'+vis.slice(0,4).join('')+'|'+nl+'|'+h+'|'+CQ+'|'+(smoothOn()?1:0)+'|'+(ANGQ()?'A'+sheets.filter(q=>q&&q.A).length:'I');if(isoC&&isoK===key)return isoC;
    const gnd=document.createElement('canvas');gnd.width=W*CQ;gnd.height=H*CQ;const g=gnd.getContext('2d');g.imageSmoothingEnabled=true;
    const SL=[];
    const SM=smoothOn()&&!ANGQ();
    for(const l of [0,1]){if(!vis[l])continue;const a=l===0&&M.cfg.outline?.surface?M.layers[l].map(v=>surfaceTerrainTile(M,sheets[dec(v).sid])?0:v):M.layers[l];
      if(l===0&&SM){const okB=v=>{const d=dec(v),sh=sheets[d.sid];return !!(sh&&sh.img&&(!sh.iso||(sh.iso===2?!(sh.wat&&sh.wat.includes(d.idx)):!(d.f&4))));};
        for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const sh=sheets[dec(v).sid];if(sh&&sh.img&&sh.iso&&!okB(v))SL.push({x:i%W,y:(i/W)|0,v,l});}
        const paintB=(g2,v,dx,dy,s)=>{const d=dec(v),sh=sheets[d.sid];if(sh.iso){const sx=(d.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(d.idx/sh.cols)*(sh.tw+sh.margin);paintSlab(g2,sh.img,sx,sy,sh.tw,sh.iso===2?(sh.cy||0):0,dx,dy,s,d.f&3);}else drawTile(g2,v,dx,dy,s);};
        bakeLayer0(g,{W,H,Q:CQ,a,paint:paintB,smooth:true,ok:okB});continue;}
      for(let i=0;i<a.length;i++){const v=a[i];if(!v)continue;const d=dec(v),sh=sheets[d.sid];if(!sh||!sh.img)continue;
      if(sh.iso){SL.push({x:i%W,y:(i/W)|0,v,l});continue;}drawTile(g,v,(i%W)*CQ,((i/W)|0)*CQ,CQ);}}
    if(SM)noiseOverlay(g,W,H,CQ);
    SL.sort(ANGQ()?((a,b)=>(a.y-b.y)||(a.x-b.x)||a.l-b.l):((a,b)=>(a.x+a.y)-(b.x+b.y)||a.l-b.l));
    const images=new Map(),legacyRoofs=[];
    function pieces(layer){
      if(!vis[layer])return [];
      return paintedPieces(M.layers[layer],W,H).flatMap(g=>{
        const index=g.cells[0],value=M.layers[layer][index];
        const roof=layer===3&&legacyRoof(value,index,W);
        if(roof){legacyRoofs.push(roof);return [];}
        let c=images.get(value);
        if(!c){
          c=el('canvas',{width:CQ,height:CQ});
          const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;
          drawTile(ctx,value,0,0,CQ);images.set(value,c);
        }
        return [{...g,c}];
      });
    }
    const order=g=>ANGQ()?g.yb:g.xc+g.yb;
    const GR=pieces(2).sort((a,b)=>order(a)-order(b)),OV=pieces(3).sort((a,b)=>order(a)-order(b));
    isoK=key;return isoC={gnd,CQ,SL,GR,OV,legacyRoofs};}
  function drawIso(){const AG=ANGQ();if(AG&&angN!==sheets.length){angN=sheets.length;ensureAngle(sheets).then(m=>{isoK='';dirty=true;if(m&&m.length)toast('Chưa có bộ Angle cho: '+m.join(', ')+' — phần đó sẽ không hiện ở chiếu Angle');});}
    const B=isoBuild(),S=CELL*view.z,w=cv.clientWidth,h=cv.clientHeight,O=g2s(0,0),sc=S/.75;
    const geo=outline2D(M.cfg.outline,AG,renderWallEnts());
    const wallImage=outlineWallImage(M.cfg.outline,sheets);
    if(geo){stoneBackdrop(cx,w,h);if(vis[0])drawFloorSlab(cx,geo,g2s,S);}
    if(geo){cx.save();clipOutline(cx,geo,g2s);}
    if(vis[0]&&M.cfg.outline?.surface)drawSurfaceTerrain(cx,M.w,M.h,M.cfg.outline.surface,g2s,{sheets,materials:M.cfg.outline.surfaceMaterials});
    cx.save();cx.imageSmoothingEnabled=true;if(AG)cx.transform(2*S/B.CQ,0,0,2*S*ANG_R/B.CQ,O[0],O[1]);else cx.transform(S/B.CQ,S/(2*B.CQ),-S/B.CQ,S/(2*B.CQ),O[0],O[1]);cx.drawImage(B.gnd,0,0);cx.restore();cx.imageSmoothingEnabled=false;
    for(const q of B.SL){const p=g2s(q.x,q.y);if(p[0]>w+S||p[0]<-2*S||p[1]>h||p[1]<-2*S)continue;tileG(q.v,q.x,q.y);}
    if(!AG){const wc=B.SL.filter(q=>(dec(q.v).f&4));if(wc.length)shore(cx,wc,(x,y)=>g2s(x,y),S);}
    if(geo)cx.restore();
    const bridge=M.cfg.settlement?.plan?.bridge;
    if(vis[2])drawSettlementBridge(cx,bridge,g2s,S);
    const items=geo&&vis[2]?geo.walls.map(wall=>({k:wall.k,wall})):[];
    if(vis[2])for(const wall of builtWallFaces(renderWallEnts(),AG))items.push({k:wall.k,wall});
    for(const g of B.GR)items.push({k:AG?g.yb:g.yb+g.xc,g});
    for(const e of M.ents){if(e.wallLine||(e.t==='deco'&&!vis[sceneEntityLayer(e)]))continue;for(const wall of gateWalls(e,AG))items.push({k:wall.k,wall});items.push({k:e.tiledLayer===undefined?(e.placedProp?(AG?e.y+1:e.x+e.y+2):AG?(e.t==='deco'?(e.flat?-1e4+e.y:depthAng(e)):e.y+.5):(e.t==='deco'?(e.flat?-1e4+e.x+e.y:e.x+e.y+1):e.x+e.y+1)):tiledDepth(e,M.w,M.h,AG),e});}
    items.sort((a,b)=>a.k-b.k);isoHB=[];const COV=[],roofs=[];const cur=tool==='obj'||tool==='zone';
    for(const it of items){
      if(it.wall){stoneWall(cx,it.wall,g2s,S,w,h,geo,wallImage);continue;}
      if(it.g){const g=it.g,k2=sc*.95/B.CQ,wp=AG?g.c.width*2*S/B.CQ:g.c.width*k2,hp=AG?g.c.height*2*S*ANG_R/B.CQ:g.c.height*k2,p=g2s(g.xc,g.yb);cx.imageSmoothingEnabled=true;cx.drawImage(g.c,p[0]-wp/2,p[1]-hp,wp,hp);cx.imageSmoothingEnabled=false;continue;}
      const e=it.e,sel=e.id===selId;
      if(e.placedProp){if(isRoof(e)||e.tiledLayer!==undefined&&e.sceneLayer===3)roofs.push(e);else drawIndependentProp(e);continue;}
      if(e.t==='deco'&&e.flat&&!vis[1])continue;
      if(e.t==='deco'){const sh0=e.tile&&sheets[e.tile.sid],sp=sprOf(e,sh0,AG),ws=((sp?sp.sc:e.sc)||3)*sc,p=AG?g2s(e.x+.5,e.y+1):g2s(e.x+1,e.y+1);
        const rx=p[0]-ws/2+(e.ox||0)*ws,ry=p[1]-ws+((sp?sp.oy:e.oy)||0)*ws;
        if(sp&&sp.img){const sx=(e.tile.idx%sp.cols)*(sp.tw+sp.margin),sy=Math.floor(e.tile.idx/sp.cols)*(sp.tw+sp.margin);cx.imageSmoothingEnabled=true;cx.drawImage(sp.img,sx,sy,sp.tw,sp.tw,rx,ry,ws,ws);cx.imageSmoothingEnabled=false;}
        if(e.cv&&vis[3])COV.push({cv:e.cv,rx,ry,ws});
        const zb=e.zb||[-(e.fx||1),-(e.fy||1),e.fx||1,e.fy||1],fx=-zb[0],fy=-zb[1];
        if(sel||(cur&&view.z>=.8)){cx.lineWidth=sel?2.5:1;cx.strokeStyle=sel?'#ffd24a':'rgba(217,160,102,.7)';if(e.zp&&e.zp.length>2){const dz=decoZones([e])[0];zPath(cx,dz,g2s);}else pathQ(e.x+1+zb[0],e.y+1+zb[1],zb[2],zb[3]);cx.stroke();if(sel){cx.setLineDash([5,3]);cx.strokeRect(rx+ws*.2,ry+ws*.15,ws*.6,ws*.85);cx.setLineDash([]);}}
        isoHB.push({e,r:[rx+ws*.25,ry+ws*.3,rx+ws*.75,ry+ws],f:[e.x+1+zb[0],e.y+1+zb[1],e.x+1+zb[0]+zb[2],e.y+1+zb[1]+zb[3]]});continue;}
      const p=g2s(e.x+.5,e.y+.5),col=OT[e.t][2],sz=S*1.5*(e.visualScale??1);
      cx.lineWidth=sel?3:1.5;cx.strokeStyle=col;pathQ(e.x,e.y,1,1);cx.stroke();
      if(e.tile){tileG0(enc(e.tile.sid,e.tile.idx),p[0]-sz/2,p[1]-sz*.85,sz);}
      else{let ok=false;if(e.anim){try{const A=isoAN();if(A){ok=A.drawChar(cx,{x:0,y:0},e.anim,p[0],p[1],sc,performance.now()/1000,{iso:true,grounded:true,scale:e.visualScale});}}catch(_){}}
        if(!ok){cx.fillStyle=col+'55';pathQ(e.x,e.y,1,1);cx.fill();}
        if(view.z>=.9){cx.font='bold '+Math.max(9,S*.5)+'px system-ui';cx.textAlign='center';cx.textBaseline='alphabetic';const t=e.name||OT[e.t][1],w=cx.measureText(t).width+6;cx.fillStyle='#000b';cx.fillRect(p[0]-w/2,p[1]-sz*.95-2,w,Math.max(11,S*.5)+4);cx.fillStyle=col;cx.fillText(t,p[0],p[1]-sz*.95+Math.max(9,S*.5)-1);}}
      isoHB.push({e,r:[p[0]-sz/2,p[1]-sz*.85,p[0]+sz/2,p[1]+S*.1],f:[e.x,e.y,e.x+1,e.y+1]});}
    for(const g of B.OV){const k2=sc*.95/B.CQ,wp=AG?g.c.width*2*S/B.CQ:g.c.width*k2,hp=AG?g.c.height*2*S*ANG_R/B.CQ:g.c.height*k2,p=g2s(g.xc,g.yb);cx.imageSmoothingEnabled=true;cx.drawImage(g.c,p[0]-wp/2,p[1]-hp,wp,hp);cx.imageSmoothingEnabled=false;}
    for(const c of COV){const sh=sheets[c.cv.sid];if(!sh||!sh.img)continue;const sx=(c.cv.idx%sh.cols)*(sh.tw+sh.margin),sy=Math.floor(c.cv.idx/sh.cols)*(sh.tw+sh.margin);cx.imageSmoothingEnabled=true;cx.drawImage(sh.img,sx,sy,sh.tw,sh.tw,c.rx,c.ry,c.ws,c.ws);cx.imageSmoothingEnabled=false;}
    const depth=e=>e.tiledLayer===undefined?e.y+(AG?0:e.x):tiledDepth(e,M.w,M.h,AG);
    for(const e of [...B.legacyRoofs,...roofs].sort((a,b)=>depth(a)-depth(b)))drawIndependentProp(e);
    if(vis[2])drawSettlementBridge(cx,bridge,g2s,S,true);
    drawFog(cx,w,h,fogLv(),0,-view.x,-view.y);}
  let anC=null,anK='';function isoAN(){const k=((M.cfg.anims||[]).length)+'|'+sheets.filter(q=>q&&q.img).length;if(anC&&anK===k)return anC;anK=k;return anC=makeAnims(M.cfg,sheets);}
  function tileG0(v,x,y,s){drawTile(cx,v,x,y,s);}
  function drawGateWall(wall){
    stoneWall(cx,wall,g2s,CELL*view.z,cv.clientWidth,cv.clientHeight,null);
  }
  function propDisplayFrame(e,support){
    const unit=CELL*view.z/(ISOQ()?.75:1);
    return placedPropFrame(support?{...e,roofBase:support.base,roofRise:support.rise}:e,
      g2s,unit,ANGQ()?'angle':ISOQ()?'iso':'top');
  }
  const anchorMode=e=>e.wallGateBrush||e.gateAssembly?'gate':isRoof(e)?'roof':'auto';
  const anchorChoices=(e,frame)=>placementAnchors(frame,e.spriteBounds||undefined,anchorMode(e));
  const anchorOrigin=e=>e.anchorId??4;
  function drawIndependentProp(e,preview=false,issue='',previewSupport){
    const sheet=sheets[e.tile.sid],unit=CELL*view.z/(ISOQ()?.75:1);
    const support=isRoof(e)?(previewSupport===undefined?roofBearing(e,ruleCtx()):previewSupport):null;
    if(isRoof(e)&&!support)issue=roofIssue;
    const displayed=isRoof(e)&&!support?roofOnGround(e):e;
    const frame=propDisplayFrame(displayed,support);
    const active=(selId!==null&&e.id===selId)||preview;
    cx.save();
    if(preview&&isRoof(e)&&!support)cx.globalAlpha=.42;
    if(preview){if(!issue)cx.globalAlpha=.68;for(const wall of gateWalls(e,ANGQ()||!ISOQ()))drawGateWall(wall);}
    drawPlacedProp(cx,displayed,sheet,frame);
    cx.restore();
    if(active){
      const [px,py]=g2s(e.x+1,e.y+1);
      cx.strokeStyle=issue?'#ff7979':'#ffdb74';cx.lineWidth=1.6;
      for(const zone of decoZones([withAssetSource(displayed,M.cfg)])){
        zPath(cx,zone,g2s);
        if(zone.k==='line'){cx.lineWidth=Math.max(2,zone.th*CELL*view.z);cx.globalAlpha=.65;}
        cx.stroke();cx.lineWidth=1.6;cx.globalAlpha=1;
      }
      if(!preview){cx.beginPath();cx.arc(px,py,2.5,0,Math.PI*2);cx.stroke();}
    }
    const bounds=placedPropBounds(frame,e.spriteBounds||[0,0,1,1]);
    if(isRoof(e)&&!support){
      cx.save();cx.strokeStyle='#ff8783';cx.setLineDash([5,4]);
      cx.strokeRect(bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]);cx.restore();
    }
    if(preview&&support)for(const foot of support.contacts){
      const [x,y]=g2s(foot.x,foot.y),top=ISOQ()?y-foot.height*unit*.75:y;
      cx.save();cx.strokeStyle='#75efc1';cx.fillStyle='#75efc1';cx.setLineDash([3,3]);cx.beginPath();
      cx.moveTo(x,y);cx.lineTo(x,top);cx.stroke();cx.fillRect(x-2,top-2,4,4);cx.restore();
    }
    if(active)drawMapName(entityName(e)+(support?' · Z '+coord.format(support.base)+(support.rise?'–'+coord.format(support.base+support.rise):''):''),bounds,issue?'#ffaaaa':'#ffe9ac');
    if(!preview){
      isoHB.push({e,r:bounds,f:[e.x+.9,e.y+.9,e.x+1.1,e.y+1.1]});
    }
  }
  function drawMapName(name,[left,top,right],color='#edf3f8'){
    cx.save();cx.font='600 12px system-ui';cx.textBaseline='middle';cx.textAlign='center';
    const width=Math.min(220,cx.measureText(name).width)+12,x=Math.max(width/2,Math.min(cv.clientWidth-width/2,(left+right)/2)),y=Math.max(10,top-12);
    cx.fillStyle='#111b24ec';cx.fillRect(x-width/2,y-9,width,18);
    cx.fillStyle=color;cx.fillText(name,x,y,width-10);cx.restore();
  }
  function entityName(e){
    const name=e.name?.trim();
    if(name&&(!/^Mảnh \d+$/.test(name)||!e.tile))return name;
    const sh=e.tile&&sheets[e.tile.sid];
    return sh?constructionTile(e.tile.sid,e.tile.idx,0).label:name||OT[e.t]?.[1]||'Đối tượng';
  }
  function entAtScreen(px,py,accept=()=>true){

    const g=s2g(px,py);
    for(let i=isoHB.length-1;i>=0;i--){
      const {e,r}=isoHB[i];if(accept(e)&&px>=r[0]&&px<=r[2]&&py>=r[1]&&py<=r[3])return e;
    }
    for(let i=isoHB.length-1;i>=0;i--){
      const {e,f}=isoHB[i];if(accept(e)&&g.x>=f[0]&&g.x<f[2]&&g.y>=f[1]&&g.y<f[3])return e;
    }
    for(let i=M.ents.length-1;i>=0;i--){
      const e=M.ents[i];
      if(e.placedProp&&vis[sceneEntityLayer(e)]&&accept(e)&&!e.wallLine&&(Math.hypot(g.x-e.x-1,g.y-e.y-1)<.16||gateZones(e).some(z=>zHit(z,g.x,g.y,.08))))return e;
    }
    return null;
  }
  // ===== render =====
  function render(){if(!M)return;const w=cv.clientWidth,h=cv.clientHeight,dp=Math.min(devicePixelRatio||1,2);
    if(!w||!h)return;
    if(cv.width!==Math.round(w*dp)||cv.height!==Math.round(h*dp)){cv.width=Math.round(w*dp);cv.height=Math.round(h*dp);dirty=true;}
    if(!dirty)return;dirty=false;updateDesktop();
    cx.setTransform(dp,0,0,dp,0,0);cx.fillStyle='#10161d';cx.fillRect(0,0,w,h);cx.imageSmoothingEnabled=false;
    const z=view.z,IS=ISOQ(), object=activeProp(), target=object&&hov&&lastPt?aimProp(object,lastPt):null;
    renderGate=target?.piece.wallId&&!target.issue?target.piece:null;
    if(IS){drawIso();cx.strokeStyle='#ffffff55';cx.lineWidth=1;pathQ(0,0,M.w,M.h);cx.stroke();}else{rebuild();cx.drawImage(mc,view.x,view.y,M.w*CELL*z,M.h*CELL*z);cx.strokeStyle='#ffffff55';cx.lineWidth=1;cx.strokeRect(view.x-.5,view.y-.5,M.w*CELL*z+1,M.h*CELL*z+1);}
    if(tool==='zone'||vis[4]||colMode){
      const walk=colMode===2,collision=mapCollision(M);
      if(collision.floor)drawFloorCollision(cx,collision.floor,g2s,w,h,walk);
      cx.save();if(collision.floor)clipOutline(cx,collision.floor,g2s);
      for(let i=0;i<M.blk.length;i++){
        const blocked=collision.tileBlocked(i);
        if(!blocked&&(!walk||collision.floor))continue;
        cx.fillStyle=blocked?'rgba(255,40,40,.45)':'rgba(40,220,90,.14)';
        pathQ(i%M.w,Math.floor(i/M.w),1,1);cx.fill();
      }
      cx.restore();cx.fillStyle='rgba(255,40,40,.5)';cx.strokeStyle='rgba(255,120,120,.9)';cx.lineWidth=1;
      for(const q of ruleCtx().objects){zPath(cx,q,g2s);cx.lineWidth=q.k==='line'?Math.max(1,q.th*CELL*view.z):1;cx.fill();cx.stroke();}
      cx.lineWidth=1;
      for(const q of ruleContext.paintZones){
        cx.fillStyle=q.estimated?'rgba(255,170,45,.45)':'rgba(255,40,40,.5)';
        cx.strokeStyle=q.estimated?'#ffbd69':'#ff8a8a';
        zPath(cx,q,g2s);cx.fill();cx.stroke();
      }
    }
    drawZ();
    if(grid&&z>=(IS?1.1:2.5)){cx.strokeStyle='rgba(255,255,255,.13)';cx.beginPath();if(IS){for(let x=0;x<=M.w;x++){const a=g2s(x,0),b=g2s(x,M.h);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}for(let y=0;y<=M.h;y++){const a=g2s(0,y),b=g2s(M.w,y);cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);}}else{for(let x=0;x<=M.w;x++){const X=Math.round(view.x+x*CELL*z)+.5;cx.moveTo(X,view.y);cx.lineTo(X,view.y+M.h*CELL*z);}for(let y=0;y<=M.h;y++){const Y=Math.round(view.y+y*CELL*z)+.5;cx.moveTo(view.x,Y);cx.lineTo(view.x+M.w*CELL*z,Y);}}cx.stroke();}
    if(!IS)drawEnts(z);
    if(target){drawIndependentProp(target.piece,true,target.issue,target.support);showPlacementIssue(target.issue);}
    else if(tool!=='wall')showPlacementIssue('');
    drawPlacementGuides(target);
    if(showPieceNames&&tool!=='erase')for(const hit of isoHB){
      const [l,t,r,b]=hit.r;
      if(hit.e.id&&hit.e.id===selId||r<0||l>w||b<0||t>h)continue;
      drawMapName(entityName(hit.e),hit.r);
    }
    if(tool==='inventory')drawInventoryFocus(w,h);
    if(tool==='erase')drawEraseAim();
    else if(!target&&hov&&lastPt&&tool!=='wall'&&tool!=='inventory')drawHoveredName();
    renderGate=null;
    if(!object&&hov&&(tool==='draw'||tool==='rect'||tool==='fill')&&act<4){cx.globalAlpha=.65;for(let j=0;j<stamp.h;j++)for(let i=0;i<stamp.w;i++){const v=stamp.multi?(stamp.layers.find(l=>l&&l[j*stamp.w+i])||[])[j*stamp.w+i]||0:stamp.tiles[j*stamp.w+i];const vv=paintValue(tool==='draw'?v:stamp.tiles[0]||v,hov.x+i,hov.y+j);if(IS&&act>=2)drawPaintedPreview(vv,hov.x+i,hov.y+j);else if(IS)tileG(vv,hov.x+i,hov.y+j);else drawTile(cx,vv,view.x+(hov.x+i)*CELL*z,view.y+(hov.y+j)*CELL*z,CELL*z);if(tool!=='draw')break;}cx.globalAlpha=1;}
    if(tool==='paste'&&clip&&hov){const o=pOrg();cx.globalAlpha=.7;for(let j=0;j<clip.h;j++)for(let i=0;i<clip.w;i++){for(let l=0;l<4;l++){const v=clip.layers[l][j*clip.w+i];if(v)tileG(v,o.x+i,o.y+j);}if(clip.blk&&clip.blk[j*clip.w+i]){cx.fillStyle='rgba(255,40,40,.4)';pathQ(o.x+i,o.y+j,1,1);cx.fill();}}
      const projected=clip.ents.map(e=>({...e,x:o.x+e.dx,y:o.y+e.dy}));
      for(const wall of builtWallFaces(projected,ANGQ()||!IS))drawGateWall(wall);
      for(const e of clip.ents){if(e.wallLine)continue;if(e.placedProp){drawIndependentProp({...e,x:o.x+e.dx,y:o.y+e.dy},true);continue;}if(e.tile)tileG(enc(e.tile.sid,e.tile.idx),o.x+e.dx,o.y+e.dy);cx.strokeStyle=OT[e.t]?OT[e.t][2]:'#fff';cx.lineWidth=2;pathQ(o.x+e.dx,o.y+e.dy,1,1);cx.stroke();}
      cx.globalAlpha=1;cx.strokeStyle='#3ddc84';cx.lineWidth=2;cx.setLineDash([5,3]);pathQ(o.x,o.y,clip.w,clip.h);cx.stroke();cx.setLineDash([]);}
    if(hov&&!object&&tool!=='paste'&&tool!=='obj'&&tool!=='wall'){cx.strokeStyle='#ffd24a';cx.lineWidth=2;const ww=(tool==='draw'?stamp.w:1),hh=(tool==='draw'?stamp.h:1);pathQ(hov.x,hov.y,ww,hh);cx.stroke();}
    if(sel||drag&&drag.rect){const r=sel||drag.rect;const x0=Math.min(r.x0,r.x1),y0=Math.min(r.y0,r.y1),x1=Math.max(r.x0,r.x1),y1=Math.max(r.y0,r.y1);cx.setLineDash([6,4]);cx.strokeStyle='#4fd1ff';cx.lineWidth=2;pathQ(x0,y0,x1-x0+1,y1-y0+1);cx.stroke();cx.setLineDash([]);}
    drawMaterialAnchor();
  }
  let animationMap,animationRevision,sceneAnimated=false,lastAnimation=0;
  (function loop(time=0){
    if(animationMap!==M||M&&animationRevision!==buildRevision){
      animationMap=M;animationRevision=buildRevision;
      const sets=new Map((M?.cfg.anims||[]).map(set=>[set.id,set]));
      sceneAnimated=!!M?.ents.some(e=>{
        const set=sets.get(e.anim);
        return set?.st.idle?.n>1;
      });
    }
    if(sceneAnimated&&time-lastAnimation>=100){dirty=true;lastAnimation=time;}
    render();requestAnimationFrame(loop);
  })();
  // ===== thao tác =====
  const inb=(x,y)=>x>=0&&y>=0&&x<M.w&&y<M.h;
  function put(x,y,v,l=act){if(!inb(x,y))return;(l===4?M.blk:M.layers[l])[y*M.w+x]=v;}
  function get(x,y,l=act){return inb(x,y)?(l===4?M.blk:M.layers[l])[y*M.w+x]:0;}
  function stonePhase(value,layer,palette=sheets){
    if(!value||layer!==0)return null;
    const tile=dec(value),asset=palette[tile.sid];
    if(tile.idx>=16||!asset||(asset.phaseBrush!=='da-xoay-stone-2x2'&&asset.url!==LEGACY_STONE_ATLAS))return null;
    return tile.sid;
  }
  function phaseTile(sid,x,y){
    const a=Math.floor(x/2),b=Math.floor(y/2),tone=(a*7+b*13+a*b)&3;
    return enc(sid,tone*4+(x&1)+2*(y&1));
  }
  function activePhase(){
    return !stamp.multi&&stamp.w===1&&stamp.h===1?stonePhase(stamp.tiles?.[0],act):null;
  }
  function paintValue(value,x,y){
    const sid=activePhase();return sid===null?value:phaseTile(sid,x,y);
  }
  function fixStoneSeams(){
    const sid=activePhase();if(sid===null)return;
    const layer=M.layers[0],changes=[];
    for(let i=0;i<layer.length;i++){
      if(stonePhase(layer[i],0)!==sid)continue;
      const value=phaseTile(sid,i%M.w,Math.floor(i/M.w));if(layer[i]!==value)changes.push([i,value]);
    }
    if(!changes.length){toast('Các ô đá đã khớp mạch.');cv.focus();return;}
    pushUndo();for(const [i,v] of changes)layer[i]=v;
    after();draw();cv.focus();toast('Đã căn lại mạch đá ở '+changes.length+' ô · Ctrl+Z để hoàn tác.');
  }
  function paste(x,y){if(act===4){put(x,y,1);return;}if(!stamp.multi&&stamp.tiles&&stamp.tiles.length===1)noteRecent(stamp.tiles[0]);
    for(let j=0;j<stamp.h;j++)for(let i=0;i<stamp.w;i++){if(stamp.multi){for(let l=0;l<4;l++){const v=stamp.layers[l]&&stamp.layers[l][j*stamp.w+i];if(v)put(x+i,y+j,v,l);}}else{const v=stamp.tiles[j*stamp.w+i];if(v)put(x+i,y+j,paintValue(v,x+i,y+j));}}}
  function drawPaintedPreview(value,x,y){
    if(!value)return;
    const p=g2s(x+.5,y+1),s=CELL*view.z,scale=ANGQ()?2*s:s*.95/.75;
    cx.save();
    if(ANGQ()){cx.translate(p[0],p[1]);cx.scale(1,ANG_R);drawTile(cx,value,-scale/2,-scale,scale);}
    else drawTile(cx,value,p[0]-scale/2,p[1]-scale,scale);
    cx.restore();
  }
  function eraseTarget(p,c,scope=eraseScope()){
    if(scope!==4){
      const e=entAtScreen(p.x,p.y,q=>sceneEntityLayer(q)===scope)||
        (scope===2?wallAtScreen(p):null)||
        (!ISOQ()&&scope===5?M.ents.find(q=>sceneEntityLayer(q)===5&&q.x===c.x&&q.y===c.y):null);
      if(e?.legacyIndex!=null){
        return {x:e.legacyIndex%M.w,y:Math.floor(e.legacyIndex/M.w),
          r:isoHB.find(hit=>hit.e===e)?.r,label:entityName(e)};
      }
      if(e)return {e,label:entityName(e)};
    }
    const tile=scope===2||scope===3?legacyPropAt(p,scope):null;
    const x=tile?tile.i%M.w:c.x,y=tile?Math.floor(tile.i/M.w):c.y;
    const v=scope<5&&inb(x,y)?get(x,y,scope):0;
    if(!v)return null;
    const d=scope<4?dec(v):null;
    return {x,y,r:tile?.bounds,label:d&&sheets[d.sid]?constructionTile(d.sid,d.idx,0).label:'Ô vùng chặn'};
  }
  function eraseEntity(e){
    if(e.t==='start'){toast('Điểm xuất phát cần được giữ lại. Dùng Vật đã đặt hoặc Màn & cửa để chuyển vị trí.');return false;}
    if(e.wallLine&&M.ents.some(q=>q.wallId===e.id)){
      toast('Đoạn tường có cổng. Hãy xóa cổng trong Mái / cửa trước.');return false;
    }
    const removed=new Set(propGroup(M.ents,e).map(part=>part.id));
    pushUndo();M.ents=M.ents.filter(q=>!removed.has(q.id));
    if(!acceptStructure())return false;
    if(selId===e.id)selId=null;
    eraseSelected=null;after();draw();return true;
  }
  function drawEraseAim(){
    const chosen=M.ents.find(e=>e.id===eraseSelected&&sceneEntityLayer(e)===eraseScope());
    const hit=hov&&lastPt?eraseTarget(lastPt,hov):chosen?{e:chosen,label:entityName(chosen)}:null;
    if(!hit)return;
    const label=hit.e?.t==='start'?'Điểm xuất phát · được bảo vệ':hit.label;
    aimTitle.textContent=label;aimHint.textContent='Xóa · '+(eraseScope()===5?'Đối tượng':layerNames[eraseScope()]);
    aimHud.hidden=false;aimHud.dataset.state='invalid';
    cx.save();cx.strokeStyle='#ff8783';cx.lineWidth=2;
    const bounds=hit.r||(hit.e&&isoHB.find(q=>q.e===hit.e)?.r);
    if(bounds){const [l,t,r,b]=bounds;cx.strokeRect(l,t,r-l,b-t);drawMapName(label,bounds,'#ffc3be');}
    else if(hit.e?.wallLine){
      const a=[hit.e.x+1,hit.e.y+1];
      cx.beginPath();cx.moveTo(...g2s(...a));cx.lineTo(...g2s(a[0]+hit.e.wallLine.dx,a[1]+hit.e.wallLine.dy));cx.stroke();
    }else{
      pathQ(hit.x??hit.e.x,hit.y??hit.e.y,1,1);cx.stroke();
    }
    cx.restore();
  }
  function drawHoveredName(){
    const e=entAtScreen(lastPt.x,lastPt.y);
    const hit=e&&isoHB.find(q=>q.e===e);
    if(hit&&e.id!==selId)drawMapName(entityName(e),hit.r);
    if(!hit){const item=legacyPropAt(lastPt,3)||legacyPropAt(lastPt,2);
      if(item){const {sid,idx}=dec(item.value);drawMapName(constructionTile(sid,idx,0).label,item.bounds);}}
  }
  function fill(x,y){
    if(!inb(x,y))return;
    const t=get(x,y),nv=act===4?1:stamp.multi?0:stamp.tiles[0];
    if(act!==4&&!nv&&!stamp.multi)return;
    const source=stonePhase(t,act),sid=activePhase();
    if(t===nv&&!stamp.multi&&sid===null)return;
    const st=[[x,y]],seen=new Set();let n=0;
    while(st.length&&n<6000){
      const [a,b]=st.pop(),k=a+','+b;
      if(!inb(a,b)||seen.has(k))continue;
      const current=get(a,b);
      if(source===null?current!==t:stonePhase(current,act)!==source)continue;
      seen.add(k);put(a,b,sid===null?nv:phaseTile(sid,a,b));n++;
      st.push([a+1,b],[a-1,b],[a,b+1],[a,b-1]);
    }
  }
  function rectFill(r){const x0=Math.min(r.x0,r.x1),y0=Math.min(r.y0,r.y1),x1=Math.max(r.x0,r.x1),y1=Math.max(r.y0,r.y1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(act===4){put(x,y,1);continue;}if(stamp.multi)continue;const v=stamp.tiles[((y-y0)%stamp.h)*stamp.w+((x-x0)%stamp.w)];put(x,y,paintValue(v,x,y));}}
  function pick(x,y,p){const prop=p&&entAtScreen(p.x,p.y,e=>e.legacyIndex==null);
    if(prop?.placedProp){
      const v=enc(prop.tile.sid,prop.tile.idx,prop.spriteFlip||0);
      propTurns.delete(v);
      propSizes.set(v,Math.round(prop.sc/(prop.sizeBase||prop.sc)*100));
      stamp={w:1,h:1,multi:false,tiles:[v]};act=2;return true;
    }
    let l=act,v=get(x,y,l);if(l<4&&!v){for(let k=3;k>=0;k--){if(get(x,y,k)){l=k;v=get(x,y,k);break;}}if(v){act=l;ui.layers&&ui.layers();toast('Hút từ lớp '+LAYN[l]);}}
    if(v&&l<4){stamp={w:1,h:1,multi:false,tiles:[v]};ui.stamp();return true;}return false;}
  function copySel(cut){if(!sel)return;const x0=Math.min(sel.x0,sel.x1),y0=Math.min(sel.y0,sel.y1),x1=Math.max(sel.x0,sel.x1),y1=Math.max(sel.y0,sel.y1);const w=x1-x0+1,h=y1-y0+1;
    const layers=[0,1,2,3].map(l=>{const a=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)a.push(get(x0+i,y0+j,l));return a;});
    stamp={w,h,multi:true,layers,tiles:layers[0]};if(cut){pushUndo();for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(let l=0;l<4;l++)put(x0+i,y0+j,0,l);after();}
    tool='draw';ui.tools();ui.stamp();toast('Đã lấy '+w+'×'+h+' ô làm stamp — chạm bản đồ để dán');}
  function selRect(){if(!sel||!M)return null;const x0=Math.max(0,Math.min(sel.x0,sel.x1)),y0=Math.max(0,Math.min(sel.y0,sel.y1)),x1=Math.min(M.w-1,Math.max(sel.x0,sel.x1)),y1=Math.min(M.h-1,Math.max(sel.y0,sel.y1));return {x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1};}
  const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  function inSelection(e,x0,y0,x1,y1){
    const shift=e.placedProp?1:0,x=e.x+shift,y=e.y+shift;
    return x>=x0&&y>=y0&&x<x1+1&&y<y1+1;
  }
  function regionEnts(r){
    const selected=M.ents.filter(e=>e.t!=='start'&&inSelection(e,r.x0,r.y0,r.x1,r.y1));
    const walls=new Set(selected.filter(e=>e.wallLine).map(e=>e.id));
    return M.ents.filter(e=>e.wallId?(e.wallId.startsWith('outline:')?false:walls.has(e.wallId)):selected.includes(e));
  }
  function copyArea(cut){const r=selRect();if(!r){toast('Chưa chọn vùng — kéo trên bản đồ');return;}
    const grab=l=>{const a=[];for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)a.push(get(r.x0+i,r.y0+j,l));return a;};
    const layers=[0,1,2,3].map(grab),blk=grab(4);
    const picked=inclEnt?regionEnts(r):[];
    const ents=picked.map(e=>{const c=JSON.parse(JSON.stringify(e));c.dx=e.x-r.x0;c.dy=e.y-r.y0;return c;});
    clip={w:r.w,h:r.h,layers:layers.map(a=>a.slice()),blk:inclBlk?blk:null,ents};
    stamp={w:r.w,h:r.h,multi:true,layers,tiles:layers[0]};
    if(cut){pushUndo();for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++){for(let l=0;l<4;l++)put(r.x0+i,r.y0+j,0,l);if(inclBlk)put(r.x0+i,r.y0+j,0,4);}
      if(inclEnt)M.ents=M.ents.filter(e=>!picked.includes(e));if(!acceptStructure())return;selId=null;after();}
    toast((cut?'Đã cắt ':'Đã sao chép ')+r.w+'×'+r.h+' ô'+(ents.length?' + '+ents.length+' đối tượng':'')+' — bấm 📥 Dán');ui.tools();ui.stamp();dirty=true;if(simple){tool='paste';draw();toast('Đã '+(cut?'cắt':'sao chép')+' — bấm lên bản đồ để dán');}}
  function startPaste(){if(!clip){toast('Chưa sao chép gì — chọn vùng rồi bấm Sao chép');return;}tool='paste';draw();toast('Chạm/kéo trên bản đồ để dán');}
  const pOrg=()=>hov&&clip?{x:hov.x-Math.floor(clip.w/2),y:hov.y-Math.floor(clip.h/2)}:null;
  function pasteClip(x0,y0){if(!clip)return 0;let n=0;
    const eligible=clip.ents.filter(e=>{
      const shift=e.placedProp?1:0,x=x0+e.dx+shift,y=y0+e.dy+shift;
      return inb(x,y)&&(!e.wallLine||inb(x+e.wallLine.dx,y+e.wallLine.dy));
    });
    const ids=new Map(eligible.map(e=>[e.id,newId()]));
    for(let j=0;j<clip.h;j++)for(let i=0;i<clip.w;i++){for(let l=0;l<4;l++){const v=clip.layers[l][j*clip.w+i];if(v)put(x0+i,y0+j,v,l);}if(clip.blk&&clip.blk[j*clip.w+i])put(x0+i,y0+j,1,4);}
    for(const e of eligible){const nx=x0+e.dx,ny=y0+e.dy;const c=JSON.parse(JSON.stringify(e));delete c.dx;delete c.dy;c.id=ids.get(e.id);if(c.wallId){c.wallId=ids.get(c.wallId);if(!c.wallId)continue;}c.x=nx;c.y=ny;M.ents.push(c);n++;}
    return n;}
  function clearSel(all){if(!sel)return;pushUndo();const x0=Math.min(sel.x0,sel.x1),y0=Math.min(sel.y0,sel.y1),x1=Math.max(sel.x0,sel.x1),y1=Math.max(sel.y0,sel.y1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(all)for(let l=0;l<5;l++)put(x,y,0,l);else put(x,y,0);}
    const mounted=new Set(M.ents.filter(e=>e.wallId).map(e=>e.wallId));
    const removed=new Set(M.ents.filter(e=>e.t!=='start'&&(all||sceneEntityLayer(e)===act&&!(e.wallLine&&mounted.has(e.id)))&&
      inSelection(e,x0,y0,x1,y1)).flatMap(e=>propGroup(M.ents,e).map(part=>part.id)));
    M.ents=M.ents.filter(e=>!removed.has(e.id));
    const wallIds=new Set(M.ents.filter(e=>e.wallLine).map(e=>e.id));
    if(all)M.ents=M.ents.filter(e=>!e.wallId||e.wallId.startsWith('outline:')||wallIds.has(e.wallId));
    if(!acceptStructure())return;
    if(!selEnt())selId=null;
    after();}
  // ===== thao tác nhanh trên vùng đang chọn (như bên 3D) =====
  function grabR(r){const g=l=>{const a=[];for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)a.push(get(r.x0+i,r.y0+j,l));return a;};return {L:[0,1,2,3,4].map(g),E:regionEnts(r)};}
  function clearR(r){for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)for(let l=0;l<5;l++)put(r.x0+i,r.y0+j,0,l);}
  function putR(g,r,nx,ny,onlySet){for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)for(let l=0;l<5;l++){const v=g.L[l][j*r.w+i];if(!onlySet||v)put(nx+i,ny+j,v,l);}}
  function selMove(dx,dy){const r=selRect();if(!r)return;const nx=r.x0+dx,ny=r.y0+dy;if(nx<0||ny<0||nx+r.w>M.w||ny+r.h>M.h){toast('Chạm mép bản đồ');return;}
    pushUndo();const g=grabR(r);clearR(r);putR(g,r,nx,ny);for(const e of g.E){e.x+=dx;e.y+=dy;}if(!acceptStructure())return;sel={x0:nx,y0:ny,x1:nx+r.w-1,y1:ny+r.h-1};after();ui.sel&&ui.sel();}
  function selDup(){const r=selRect();if(!r)return;let nx=r.x0+r.w,ny=r.y0;if(nx+r.w>M.w){nx=r.x0;ny=r.y0+r.h;}if(ny+r.h>M.h){toast('Không còn chỗ để nhân bản');return;}
    pushUndo();const g=grabR(r);putR(g,r,nx,ny,true);const ids=new Map(g.E.map(e=>[e.id,newId()]));for(const e of g.E){const c=JSON.parse(JSON.stringify(e));c.id=ids.get(e.id);if(c.wallId)c.wallId=ids.get(c.wallId);c.x=nx+(e.x-r.x0);c.y=ny+(e.y-r.y0);M.ents.push(c);}
    if(!acceptStructure())return;
    sel={x0:nx,y0:ny,x1:nx+r.w-1,y1:ny+r.h-1};after();ui.sel&&ui.sel();toast('Đã nhân bản — bản sao đang được chọn');}
  function selFlip(){const r=selRect();if(!r)return;pushUndo();const g=grabR(r);
    for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)for(let l=0;l<5;l++){let v=g.L[l][j*r.w+(r.w-1-i)];if(v&&l<4){const d=dec(v);v=enc(d.sid,d.idx,d.f^1);}put(r.x0+i,r.y0+j,v,l);}
    for(const e of g.E){
      e.x=r.x0+r.x1-e.x-(e.placedProp?1:0);
      if(e.wallLine)e.wallLine.dx=-e.wallLine.dx;
      if(e.wallId){e.col=e.col.map(c=>({...c,x:-c.x}));}
    }if(acceptStructure()){after();toast('Đã lật ngang vùng chọn');}}
  function selCluster(c0){if(!c0||!inb(c0.x,c0.y))return;const has=(x,y)=>inb(x,y)&&(M.layers[1][y*M.w+x]||M.layers[2][y*M.w+x]||M.layers[3][y*M.w+x]||M.blk[y*M.w+x]||M.ents.some(e=>e.x===x&&e.y===y));
    if(!has(c0.x,c0.y)){toast('Ô này trống — trỏ vào công trình rồi nhấn Enter');return;}
    const seen=new Set([c0.x+','+c0.y]),st=[[c0.x,c0.y]];let x0=c0.x,x1=c0.x,y0=c0.y,y1=c0.y;
    while(st.length&&seen.size<5000){const [a,b]=st.pop();for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=a+dx,y=b+dy,k=x+','+y;if(seen.has(k)||!has(x,y))continue;seen.add(k);st.push([x,y]);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
    sel={x0,y0,x1,y1};tool='select';ui.tools&&ui.tools();ui.sel&&ui.sel();dirty=true;toast('Đã chọn cả cụm '+(x1-x0+1)+'×'+(y1-y0+1)+' ô');}
  function selFocus(){const r=selRect();if(!r)return;const W=cv.clientWidth,H=cv.clientHeight;if(ISOQ()){const n=r.w+r.h+4;view.z=Math.max(.01,Math.min(16,Math.min(W/(n*CELL),H/(n*CELL*.5))));const q=g2s(r.x0+r.w/2,r.y0+r.h/2),S0=g2s(0,0);view.x+=W/2-q[0];view.y+=H/2-q[1];dirty=true;return;}
    view.z=Math.max(.01,Math.min(16,Math.min(W/(r.w*CELL+4*CELL),H/(r.h*CELL+4*CELL))));view.x=W/2-(r.x0+r.w/2)*CELL*view.z;view.y=H/2-(r.y0+r.h/2)*CELL*view.z;dirty=true;}
  // ===== con trỏ =====
  const P=new Map();let drag=null,gest=null,spacePan=false;
  const desktop=()=>window.matchMedia('(min-width: 980px) and (pointer: fine)').matches;
  cv.tabIndex=0;cv.setAttribute('aria-label','Bản đồ 2D. Nhấn F1 để xem phím tắt.');
  const cellAt=(px,py)=>{const g=s2g(px,py);return {x:Math.floor(g.x),y:Math.floor(g.y)};};
  const pos=e=>{const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  cv.addEventListener('pointerdown',e=>{e.preventDefault();if(!M)return;cv.focus({preventScroll:true});
    if(desktop()&&e.button===2)return;
    cv.setPointerCapture(e.pointerId);const p=pos(e);P.set(e.pointerId,p);
    if(P.size===2){drag=null;const [a,b]=[...P.values()];gest={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return;}
    if(spacePan||e.button===1||e.button===2||tool==='pan'||e.buttons===4){drag={pan:true,x:p.x,y:p.y,vx:view.x,vy:view.y};return;}
    const c=cellAt(p.x,p.y);hov=c;lastPt={...p,snap:e.shiftKey,free:e.altKey};
    if(tool==='inventory'){
      const item=inventoryMoving?null:inventoryHit(p);
      drag=item?{inventory:true,p,item}:{inventory:true,p,pan:!inventoryMoving,vx:view.x,vy:view.y};
      return;
    }
    if(tool==='wall'){drag={wallPointer:true,p:lastPt,start:wallAim(lastPt)};dirty=true;return;}
    if(act!==4&&['draw','rect','fill'].includes(tool)&&!hasBrush()){
      chooseTab('tools');toast('Chọn vật liệu hoặc vật thể trong khung Dựng cảnh trước khi đặt.');return;
    }
    if(fillArm&&sel&&tool==='draw'){const r=selRect();if(r&&c.x>=r.x0&&c.x<=r.x1&&c.y>=r.y0&&c.y<=r.y1){pushUndo();rectFill(r);if(!acceptStructure())return;after();toast('Đã đổ vào vùng chọn '+r.w+'×'+r.h+' — bấm ↶ nếu muốn hủy');dirty=true;return;}fillArm=false;}
    if([2,3].includes(act)&&['rect','fill'].includes(tool)&&stampHasGate()){
      useTool('draw');toast('Đặt từng cổng để Xưởng kiểm tra chân tường và lối đi.');return;
    }
    const prop=activeProp();
    if(prop){
      const target=aimProp(prop,lastPt);
      if(!target)return;
      const {piece,issue}=target;
      if(issue){showPlacementIssue(issue);toast(issue);dirty=true;return;}
      pushUndo();M.ents.push({...structuredClone(piece),id:newId()});if(!acceptStructure())return;noteRecent(stamp.tiles[0]);after();return;
    }
    if(tool==='erase'){
      const scope=eraseScope(),target=eraseTarget(p,c,scope);
      if(target?.e){eraseEntity(target.e);return;}
      const brushed=scope===0||scope===1||scope===4;
      if(target){pushUndo();put(target.x,target.y,0,scope);if(!acceptStructure())return;after();}
      if(brushed)drag={last:c,eraseScope:scope,eraseUndo:!!target};
      return;
    }
    if(tool==='zone'){zDown(p,e);dirty=true;return;}
    if(tool==='obj'){objDown(c);dirty=true;return;}
    if(tool==='draw'||tool==='fill'||tool==='pick'){pushUndo();
      if(tool==='draw'){paste(c.x,c.y);if(!acceptStructure())return;drag={sx:c.x,sy:c.y,last:c};}else if(tool==='fill'){fill(c.x,c.y);drag=null;if(!acceptStructure())return;}else{const ok=pick(c.x,c.y,p);undo.pop();drag=null;if(ok&&pickAndDraw)useTool('draw');else if(ok)draw();else toast('Ô này chưa có hình để lấy.');}after();}
    else if(tool==='paste'){if(!clip){toast('Chưa có gì để dán — dùng Chọn vùng → Sao chép');return;}drag={paste:true};}
    else if(tool==='rect'||tool==='select'){drag={rect:{x0:c.x,y0:c.y,x1:c.x,y1:c.y}};if(tool==='select'){sel=null;ui.sel();}}
    dirty=true;});
  cv.addEventListener('pointermove',e=>{const p=pos(e);if(P.has(e.pointerId))P.set(e.pointerId,p);
    if(P.size===2&&gest){const [a,b]=[...P.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),ccx=(a.x+b.x)/2,ccy=(a.y+b.y)/2;const nz=Math.max(.01,Math.min(16,view.z*d/gest.d));const k=nz/view.z;
      view.x=ccx-(gest.cx-view.x)*k;view.y=ccy-(gest.cy-view.y)*k;view.z=nz;gest={d,cx:ccx,cy:ccy};dirty=true;return;}
    if(!drag?.pan){lastPt={...p,snap:e.shiftKey,free:e.altKey};dirty=true;}
    const c=cellAt(p.x,p.y);if(!hov||hov.x!==c.x||hov.y!==c.y){hov=c;dirty=true;}
    if(tool==='zone'&&!(drag&&drag.pan)){zMoveE(p,e);return;}
    if(!drag)return;
    if(drag.inventory){
      const dx=p.x-drag.p.x,dy=p.y-drag.p.y;
      if(Math.hypot(dx,dy)>=5)drag.moved=true;
      if(drag.moved&&drag.pan){view.x=drag.vx+dx;view.y=drag.vy+dy;dirty=true;}
      if(drag.moved&&drag.item)dirty=true;
      return;
    }
    if(drag.wallPointer)return;
    if(drag.pan){view.x=drag.vx+p.x-drag.x;view.y=drag.vy+p.y-drag.y;dirty=true;return;}
    if(drag.rect){drag.rect.x1=c.x;drag.rect.y1=c.y;dirty=true;return;}
    if(drag.ent){const q=selEnt(),nx=c.x-(drag.dx||0),ny=c.y-(drag.dy||0);if(q&&drag.precise){const g=s2g(p.x,p.y),x=g.x-drag.dx,y=g.y-drag.dy;if(inb(x+1,y+1)){
      if(q.wallId){const mounted=mountGate({...q,x,y},ruleCtx().walls);if(mounted)Object.assign(q,mounted);}
      else {q.x=x;q.y=y;}
      dirty=true;
    }}
      else if(q&&inb(nx,ny)&&(q.x!==nx||q.y!==ny)){q.x=nx;q.y=ny;dirty=true;}return;}
    if(e.shiftKey&&tool==='draw'&&drag.sx!=null&&(drag.last.x!==c.x||drag.last.y!==c.y)){drag.last=c;const dx=c.x-drag.sx,dy=c.y-drag.sy,hz=Math.abs(dx)>=Math.abs(dy),sw=Math.max(1,stamp.w),sh=Math.max(1,stamp.h);const n=hz?Math.floor(Math.abs(dx)/sw):Math.floor(Math.abs(dy)/sh);for(let q=0;q<=n;q++)paste(drag.sx+(hz?Math.sign(dx||1)*q*sw:0),drag.sy+(hz?0:Math.sign(dy||1)*q*sh));if(!acceptStructure()){drag=null;after();return;}after();return;}
    if(!drag.last||(drag.last.x===c.x&&drag.last.y===c.y))return;
    drag.last=c;
    if(tool==='draw'&&(stamp.w===1&&stamp.h===1||((c.x-drag.sx)%stamp.w===0&&(c.y-drag.sy)%stamp.h===0))){
      paste(c.x,c.y);if(!acceptStructure())drag=null;after();
    }
    if(tool==='erase'&&drag.eraseScope!==undefined&&get(c.x,c.y,drag.eraseScope)){
      if(!drag.eraseUndo){pushUndo();drag.eraseUndo=true;}
      put(c.x,c.y,0,drag.eraseScope);if(!acceptStructure())drag=null;after();
    }
  });
  const end=e=>{P.delete(e.pointerId);if(P.size<2)gest=null;if(zd){zUp();dirty=true;return;}if(!drag)return;
    if(drag.inventory){
      const gesture=drag,p=pos(e);drag=null;dirty=true;
      if(e.type!=='pointerup')return;
      if(!gesture.moved){inventoryClick(p);return;}
      if(!gesture.item)return;
      const item=gesture.item;
      selectInventory(item);
      const [x,y]=inventoryDragPoint(gesture,p);
      moveInventory(item,x,y,e.altKey&&inventoryCanCopy(item));
      return;
    }
    if(drag.wallPointer){
      const start=drag.start,p=pos(e),moved=Math.hypot(p.x-drag.p.x,p.y-drag.p.y)>5;
      drag=null;
      if(e.type==='pointerup'){
        lastPt={...p,snap:e.shiftKey,free:e.altKey};hov=cellAt(p.x,p.y);
        if(moved&&!wallChain&&start.ok)wallChain={a:start.point,first:start.point};
        if(!moved||wallChain)wallClick(lastPt);
      }
      dirty=true;return;
    }
    if(drag.paste){const o=pOrg();if(o&&e.type!=='pointercancel'){pushUndo();const n=pasteClip(o.x,o.y);if(acceptStructure()){after();toast('Đã dán'+(n?' + '+n+' đối tượng':''));}}drag=null;dirty=true;return;}
    if(drag.ent){
      const q=selEnt(),moved=drag.from&&q&&(q.x!==drag.from[0]||q.y!==drag.from[1]),issue=moved&&constructionIssue(q,true);
      if(drag.from&&q&&(issue||e.type==='pointercancel')){Object.assign(q,drag.original);undo.pop();if(issue)toast(issue);}
      else if(moved&&!acceptStructure()){drag=null;ui.obj();return;}
      after();ui.obj();
    }
    if(drag.rect){if(tool==='rect'){pushUndo();rectFill(drag.rect);if(acceptStructure())after();}else{sel=drag.rect;ui.sel();}}drag=null;dirty=true;};
  cv.addEventListener('dblclick',()=>{
    if(tool==='inventory'&&inventoryItem&&inventoryCanCopy(inventoryItem))openInventoryCopy(inventoryItem);
  });
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&!drag?.wallPointer){hov=null;dirty=true;}});
  cv.addEventListener('contextmenu',e=>{
    e.preventDefault();if(!M||!desktop())return;
    document.querySelector('.desktop-context')?.remove();
    const p=pos(e),c=cellAt(p.x,p.y),valid=inb(c.x,c.y);
    const menu=el('div',{class:'desktop-context',role:'group','aria-label':'Thao tác tại vị trí chuột'});
    const add=(label,fn,enabled=true)=>{
      const b=el('button',{type:'button',onclick:()=>{menu.remove();cv.focus();fn();}},label);
      b.disabled=!enabled;menu.append(b);
    };
    const existing=entAtScreen(p.x,p.y,e=>e.legacyIndex==null),legacy=existing?.t==='deco'||ANGQ()?null:legacyPropAt(p);
    add(legacy?.group.cells.length>1?'Chỉnh kích thước vật thể · tách cụm cũ':'Chỉnh kích thước vật thể',()=>{
      useTool('obj');objType=null;
      selId=existing?.t==='deco'?existing.id:convertLegacyProp(legacy);
      draw();dirty=true;
    },existing?.t==='deco'||!!legacy);
    const wall=wallAtScreen(p);
    add('Chỉnh độ dày tường',()=>{useTool('obj');selId=wall.id;draw();},!!wall);
    add('Hút ô tại đây · I',()=>{if(pick(c.x,c.y,p))useTool('draw');else toast('Ô này chưa có hình để lấy.');},valid);
    add('Chọn cụm tại đây · Enter',()=>selCluster(c),valid);
    add('Sao chép vùng · Ctrl+C',()=>copyArea(false),!!selRect());
    add('Dán tại đây · Ctrl+V',()=>{
      hov=c;const p=pOrg();if(!p)return;
      pushUndo();pasteClip(p.x,p.y);if(acceptStructure()){after();dirty=true;draw();}
    },!!clip&&valid);
    add('Xóa trên lớp đang sửa · Delete',()=>clearSel(false),!!selRect());
    add('Vừa khung · F',fit);
    document.body.append(menu);menu.style.left=Math.max(0,Math.min(e.clientX,innerWidth-menu.offsetWidth-8))+'px';
    menu.style.top=Math.max(0,Math.min(e.clientY,innerHeight-menu.offsetHeight-8))+'px';
    menu.querySelector('button:not(:disabled)')?.focus();
  });
  document.addEventListener('pointerdown',e=>{const m=document.querySelector('.desktop-context');if(m&&!m.contains(e.target))m.remove();},true);
  document.addEventListener('keydown',e=>{
    const m=document.querySelector('.desktop-context');
    if(m&&e.key==='Escape'){m.remove();cv.focus();e.preventDefault();}
  });
  window.addEventListener('keyup',e=>{
    if(e.key==='Alt'&&lastPt?.free){lastPt.free=false;dirty=true;}
    if(e.code==='Space')spacePan=false;
    if(e.key==='Shift'&&lastPt?.snap){lastPt.snap=false;dirty=true;}
  });
  window.addEventListener('blur',()=>{spacePan=false;});
  cv.addEventListener('blur',()=>{spacePan=false;});
  cv.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);
    if(!e.ctrlKey&&!e.metaKey&&(e.shiftKey||e.altKey)&&activeTransform()){
      lastPt={...p,snap:e.shiftKey,free:e.altKey};hov=cellAt(p.x,p.y);
      transformProp(e.altKey?'turn':e.deltaY<0?10:-10);return;
    }
    const nz=Math.max(.01,Math.min(16,view.z*(e.deltaY<0?1.15:1/1.15)));const k=nz/view.z;view.x=p.x-(p.x-view.x)*k;view.y=p.y-(p.y-view.y)*k;view.z=nz;dirty=true;updateDesktop();},{passive:false});
  // ===== VÙNG CHẶN (hình học) =====
  let zsel=null,zk='rect',zmode='edit',zsnap=.5,zpend=null,zd=null,zu=false,zw=null;
  const ZL=()=>M&&(M.cfg.zones||(M.cfg.zones=[]));
  const zget=id=>M&&M.cfg.zones&&M.cfg.zones.find(q=>q.id===id);
  const W2=p=>s2g(p.x,p.y);
  const sn=v=>zsnap?Math.round(v/zsnap)*zsnap:v;
  const snp=w=>({x:sn(w.x),y:sn(w.y)});
  const zpu=()=>{if(!zu){pushUndo();zu=true;}};
  function zFinish(){if(!zpend)return;zpend.pts=zpend.pts.filter((q,i,A)=>!i||Math.hypot(q[0]-A[i-1][0],q[1]-A[i-1][1])>.05);const n=zpend.k==='poly'?3:2;if(zpend.pts.length<n){toast('Cần ít nhất '+n+' điểm');return;}pushUndo();const q=mkPts(zpend.k,zpend.pts);ZL().push(q);zsel=q.id;zpend=null;zmode='edit';after();ui.tools();toast('Đã tạo vùng chặn');}
  function zDown(p,e){zu=false;const w=W2(p),q=snp(w),S=CELL*view.z,tol=11/S;
    if(zpend){const now=performance.now(),last=zpend.pts[zpend.pts.length-1];
      if(zpend.pts.length>=1&&now-zpend.t<380&&Math.hypot(q.x-last[0],q.y-last[1])<tol*1.5){zFinish();return;}
      if(zpend.k==='poly'&&zpend.pts.length>=3&&Math.hypot(q.x-zpend.pts[0][0],q.y-zpend.pts[0][1])<tol*1.4){zFinish();return;}
      zpend.pts.push([q.x,q.y]);zpend.t=now;dirty=true;return;}
    if(zmode==='draw'){
      if(isBox({k:zk})){zd={m:'new',p0:q,moved:false};return;}
      zpend={k:zk,pts:[[q.x,q.y]],t:performance.now()};dirty=true;ui.tools();return;}
    const sz=zsel&&zget(zsel);
    if(sz){const hs=zHandles(sz,1.2);let best=null,bd=tol;for(const h of hs){const d=Math.hypot(h.x-w.x,h.y-w.y);if(d<bd){bd=d;best=h;}}
      if(best){
        if(best.t==='v'&&(e.shiftKey||e.altKey||e.button===2)){const mn=sz.k==='poly'?3:2;if(sz.pts.length>mn){pushUndo();sz.pts.splice(best.i,1);after();ui.tools();}return;}
        if(best.t==='m'){zpu();sz.pts.splice(best.i+1,0,[best.x,best.y]);zd={m:'vtx',i:best.i+1,z0:null};dirty=true;return;}
        zd={m:best.t==='h'?'hdl':best.t==='rot'?'rot':'vtx',i:best.i,z0:JSON.parse(JSON.stringify(sz))};return;}}
    for(let i=ZL().length-1;i>=0;i--){const t=ZL()[i];if(zHit(t,w.x,w.y,t.k==='line'?tol*.6:0)){zsel=t.id;zd={m:'move',z0:JSON.parse(JSON.stringify(t)),st:w};ui.tools();dirty=true;return;}}
    zsel=null;ui.tools();dirty=true;}
  function zMoveE(p,e){zw=W2(p);const w=zw,q=snp(w);dirty=true;if(!zd)return;const sz=zsel&&zget(zsel);
    if(zd.m==='new'){const a=zd.p0;if(!zd.moved&&Math.hypot(q.x-a.x,q.y-a.y)<.2)return;zd.moved=true;zpu();let z=zd.z;if(!z){z=zd.z=mkBox(zk,a.x,a.y,1,1);ZL().push(z);zsel=z.id;}
      z.x=Math.min(a.x,q.x);z.y=Math.min(a.y,q.y);z.w=Math.max(.25,Math.abs(q.x-a.x));z.h=Math.max(.25,Math.abs(q.y-a.y));if(e.shiftKey){const m=Math.max(z.w,z.h);z.w=z.h=m;if(q.x<a.x)z.x=a.x-m;if(q.y<a.y)z.y=a.y-m;}return;}
    if(!sz)return;
    if(zd.m==='move'){zpu();const dx=sn(w.x-zd.st.x),dy=sn(w.y-zd.st.y);const z0=JSON.parse(JSON.stringify(zd.z0));zMove(z0,dx,dy);Object.assign(sz,z0);return;}
    if(zd.m==='hdl'){zpu();const z0=zd.z0;zDragHandle(sz,z0,zd.i,q.x,q.y,e.shiftKey);return;}
    if(zd.m==='rot'){zpu();const [cx,cy]=zCenter(sz);let a=Math.atan2(w.y-cy,w.x-cx)*180/Math.PI+90;if(e.shiftKey||zsnap)a=Math.round(a/15)*15;sz.rot=((a%360)+360)%360;return;}
    if(zd.m==='vtx'){zpu();sz.pts[zd.i]=[q.x,q.y];return;}}
  function zUp(){if(zd&&zd.m==='new'&&!zd.moved){pushUndo();const a=zd.p0,z=mkBox(zk,a.x-1,a.y-1,2,2);ZL().push(z);zsel=z.id;zmode='edit';ui.tools();}
    else if(zd&&zd.m==='new'&&zd.z){zmode='edit';ui.tools();}
    zd=null;after();}
  function drawZ(){const zs=M.cfg.zones||[];if(!zs.length&&!zpend)return;const S=CELL*view.z,T=g2s,act=tool==='zone',fa=act?1:.55;cx.save();
    for(const q of zs){const on=act&&q.id===zsel;
      if(q.k==='line'){cx.lineJoin='round';cx.lineCap='round';cx.strokeStyle=on?`rgba(255,190,60,${.5*fa})`:`rgba(255,40,40,${.42*fa})`;if(ISOQ()){cx.save();cx.transform(S,S/2,-S,S/2,view.x,view.y);cx.lineWidth=q.th||.6;zPath(cx,q,(x,y)=>[x,y]);cx.stroke();cx.restore();}else{cx.lineWidth=(q.th||.6)*S;zPath(cx,q,T);cx.stroke();}zPath(cx,q,T);cx.lineWidth=1.5;cx.strokeStyle=on?'#ffd24a':`rgba(255,106,106,${fa})`;cx.stroke();}
      else{zPath(cx,q,T);cx.fillStyle=on?`rgba(255,190,60,${.35*fa})`:`rgba(255,40,40,${.38*fa})`;cx.fill();cx.lineWidth=on?2:1.5;cx.strokeStyle=on?'#ffd24a':`rgba(255,106,106,${fa})`;cx.stroke();}}
    if(zpend){const P=zpend.pts.map(a=>T(a[0],a[1]));cx.lineWidth=2;cx.strokeStyle='#ffd24a';cx.beginPath();P.forEach((a,i)=>i?cx.lineTo(a[0],a[1]):cx.moveTo(a[0],a[1]));if(zw){const h=T(sn(zw.x),sn(zw.y));cx.lineTo(h[0],h[1]);}cx.stroke();cx.fillStyle='#ffd24a';for(const a of P){cx.beginPath();cx.arc(a[0],a[1],4,0,6.3);cx.fill();}}
    const sz=act&&zsel&&zget(zsel);
    if(sz){const hs=zHandles(sz,1.2);cx.lineWidth=1.5;if(isBox(sz)){const t=hs.find(h=>h.t==='rot'),c=T(...zCenter(sz)),top=T(...(()=>{const l=zHandles(sz,0).find(h=>h.t==='rot');return [l.x,l.y];})()),tr=T(t.x,t.y);cx.strokeStyle='#ffd24a';cx.beginPath();cx.moveTo(top[0],top[1]);cx.lineTo(tr[0],tr[1]);cx.stroke();}
      for(const h of hs){const a=T(h.x,h.y);cx.fillStyle=h.t==='rot'?'#4ad6ff':h.t==='m'?'#fff8':'#fff';cx.strokeStyle='#222';cx.beginPath();if(h.t==='h'||h.t==='v'){cx.rect(a[0]-5,a[1]-5,10,10);}else cx.arc(a[0],a[1],h.t==='m'?3.5:6,0,6.3);cx.fill();cx.stroke();}}
    cx.restore();}
  function zoneUI(){const box=el('div',{style:'border:1px solid #c0503a;border-radius:10px;padding:8px;margin:6px 0'});
    const automatic=M.cfg.autoObjectCollision!==false;
    box.append(el('div',{class:'row'},el('b',{},'🚧 Vùng chặn hình học (không cần ảnh)')),
      el('p',{class:'hint collision-legend',role:'status'},'Đang hiện vùng chặn. Đỏ: vùng chặn của bản đồ và vật thể. Cam: vùng chặn tự động ước lượng theo chân ảnh.'),
      btn('Va chạm tự động: '+(automatic?'bật':'tắt'),()=>{
        pushUndo();M.cfg.autoObjectCollision=!automatic;after();draw();
      },automatic?'on':''),
      el('p',{class:'hint'},'Cổng vòm Đá Xoáy có vùng chặn ở hai chân trụ. Với mẫu khác, Xưởng ưu tiên va chạm khai báo sẵn.'));
    box.append(el('div',{class:'row'},Object.keys(ZK).map(k=>btn(ZK[k][0]+' '+ZK[k][1],()=>{zk=k;zmode='draw';zpend=null;draw();},(zmode==='draw'&&zk===k)?'on':'')),btn('✋ Chọn / sửa',()=>{zmode='edit';zpend=null;draw();dirty=true;},zmode==='edit'?'on':'')));
    const sl=el('select',{class:'num',style:'min-width:130px',onchange:e=>{zsnap=+e.target.value;}},[[1,'Bám lưới: 1 ô'],[.5,'Bám: ½ ô'],[.25,'Bám: ¼ ô'],[0,'Tự do']].map(([v,n])=>el('option',{value:v},n)));sl.value=String(zsnap);
    box.append(el('div',{class:'row'},sl,el('span',{class:'lbl'},ZL().length+' vùng vẽ tay')));
    if(zpend)box.append(el('div',{class:'row'},el('span',{class:'lbl'},'Đang vẽ '+zpend.pts.length+' điểm: '),btn('✔ Xong',zFinish,'on'),btn('↶ Bỏ điểm cuối',()=>{zpend.pts.pop();if(!zpend.pts.length)zpend=null;draw();dirty=true;}),btn('✕ Hủy',()=>{zpend=null;draw();dirty=true;})));
    const sz=zsel&&zget(zsel);
    if(sz){const row=el('div',{class:'row'});
      row.append(el('span',{class:'lbl'},ZK[sz.k][0]+' '+ZK[sz.k][1]+': '),
        btn('＋ Phóng to',()=>{pushUndo();zScale(sz,1.15);after();draw();}),btn('－ Thu nhỏ',()=>{pushUndo();zScale(sz,1/1.15);after();draw();}),
        btn('⟲ 15°',()=>{pushUndo();zRotate(sz,-15);after();draw();}),btn('⟳ 15°',()=>{pushUndo();zRotate(sz,15);after();draw();}),
        btn('⧉ Nhân bản',()=>{pushUndo();const c=zClone(sz);zMove(c,1,1);ZL().push(c);zsel=c.id;after();draw();}),
        btn('🗑 Xóa',()=>{pushUndo();M.cfg.zones=ZL().filter(q=>q!==sz);zsel=null;after();draw();}));box.append(row);
      const num=(lab,get,set,min,step)=>{const i=el('input',{type:'number',class:'num',step:step||.25,style:'width:70px'});i.value=Math.round(get()*100)/100;i.addEventListener('change',()=>{const v=parseFloat(i.value);if(isNaN(v))return;pushUndo();set(Math.max(min,v));after();dirty=true;});return el('label',{class:'lbl'},lab+' ',i,' ');};
      const r2=el('div',{class:'row'});
      if(isBox(sz)){r2.append(num('Rộng',()=>sz.w,v=>{const c=[sz.x+sz.w/2,sz.y+sz.h/2];sz.w=v;sz.x=c[0]-v/2;},.25),num('Cao',()=>sz.h,v=>{const c=[sz.x+sz.w/2,sz.y+sz.h/2];sz.h=v;sz.y=c[1]-v/2;},.25),num('Xoay°',()=>sz.rot||0,v=>{sz.rot=v%360;},0,5),num('X',()=>sz.x,v=>{sz.x=v;},-999),num('Y',()=>sz.y,v=>{sz.y=v;},-999));}
      else{if(sz.k==='line')r2.append(num('Dày',()=>sz.th||.6,v=>{sz.th=v;},.1,.1),el('label',{class:'lbl'},(()=>{const c=el('input',{type:'checkbox',onchange:e=>{pushUndo();sz.closed=e.target.checked;after();dirty=true;}});c.checked=!!sz.closed;return c;})(),' Khép kín'));r2.append(el('span',{class:'lbl'},sz.pts.length+' đỉnh'));}
      box.append(r2);}
    box.append(el('div',{class:'hint'},'VẼ: chọn hình rồi kéo trên bản đồ (hình CN/elip/tam giác; giữ Shift = vuông/tròn đều). Đa giác & Đường gấp khúc: bấm từng điểm, bấm đúp hoặc ✔ Xong để kết thúc (đa giác: bấm lại điểm đầu cũng được). SỬA: chạm vùng để chọn, kéo thân = di chuyển, kéo ô vuông = kéo dãn, chấm xanh = xoay, chấm nhỏ giữa cạnh = thêm đỉnh, Shift+bấm đỉnh = xóa đỉnh. Phím: Delete xóa · Enter xong · Esc hủy · ←↑↓→ dịch.'));
    return box;}
  function zoomBy(f){const w=cv.clientWidth/2,h=cv.clientHeight/2;const nz=Math.max(.01,Math.min(16,view.z*f)),k=nz/view.z;view.x=w-(w-view.x)*k;view.y=h-(h-view.y)*k;view.z=nz;dirty=true;}
  function fit(){if(!M)return;const w=cv.clientWidth,h=cv.clientHeight;if(ANGQ()){
      const shape=outline2D(M.cfg.outline,true);
      if(shape){
        const [a,b,c,d]=shape.bounds, height=Math.max(shape.front,shape.rear);
        const unit=Math.min(w*.90/(2*(c-a)),h*.86/(2*ANG_R*(d-b)+height));
        view.z=unit/CELL;view.x=w/2-(a+c)*unit;
        view.y=h/2-(b+d)*ANG_R*unit+height*unit/2;
        dirty=true;return;
      }
      view.z=Math.max(.01,Math.min(8,Math.min(w/(M.w*2*CELL),h/((M.h*2*ANG_R+3)*CELL))));const S=CELL*view.z;view.x=(w-M.w*2*S)/2;view.y=(h-M.h*2*ANG_R*S)/2;dirty=true;return;}
    if(ISOQ()){
      const geo=outline2D(M.cfg.outline);
      if(geo){
        const [a,b,c,d]=geo.bounds;
        const height=Math.max(geo.front,geo.rear),S=Math.min(w*.90/(c-a),h*.86/(d-b+height+.2));
        view.z=S/CELL;view.x=w/2-(a+c)*S/2;view.y=h/2-(b+d-height)*S/2;dirty=true;return;
      }
      const n=M.w+M.h;view.z=Math.max(.01,Math.min(8,Math.min(w/(n*CELL),h/(n*CELL*.5+CELL*4))));const S=CELL*view.z;view.x=w/2-(M.w-M.h)*S/2;view.y=(h-n*S/2)/2;dirty=true;return;}
    view.z=Math.max(.01,Math.min(8,Math.min(w/(M.w*CELL),h/(M.h*CELL))));view.x=(w-M.w*CELL*view.z)/2;view.y=(h-M.h*CELL*view.z)/2;dirty=true;}
  if(window.__kb2d)document.removeEventListener('keydown',window.__kb2d);
  window.__kb2d=e=>{const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;if(!M||!cv.offsetParent)return;
    if(desktop()&&document.activeElement!==cv)return;
    const k=(e.key||'').toLowerCase(),m=e.ctrlKey||e.metaKey;
    if(desktop()&&!m&&!e.altKey){
      if(k==='p'){if(!e.repeat)void toggleProjection();e.preventDefault();return;}
      if(k==='j'){if(!e.repeat)sidebarButton.click();e.preventDefault();return;}
      if(k==='['||k===']'){zoomBy(k===']'?1.25:1/1.25);updateDesktop();e.preventDefault();return;}
    }
    if(tool==='inventory'&&inventoryShortcut(k,e)){e.preventDefault();return;}
    if(desktop()&&!m&&!e.altKey){
      if(activeTransform()){
        if(k==='shift'&&lastPt){lastPt.snap=true;dirty=true;}
        const action=k==='t'?'turn':k==='+'||k==='='?10:k==='-'||k==='−'?-10:null;
        if(action!==null){if(action!=='turn'||!e.repeat)transformProp(action);e.preventDefault();return;}
      }
      if(e.code==='Space'){spacePan=true;e.preventDefault();return;}
      const shortcuts={b:'draw',v:'select',e:'erase',i:'pick',q:'inventory',r:'rect',u:'fill'};
      if(k==='k'){if(!e.repeat)toggleCollisionPreview();e.preventDefault();return;}
      if(shortcuts[k]){useTool(shortcuts[k]);e.preventDefault();return;}
      if(/^[1-5]$/.test(k)){useLayer(Number(k)-1);e.preventDefault();return;}
      if(k==='w'){useTool('wall');e.preventDefault();return;}
      if(k==='g'){switchGrid();e.preventDefault();return;}
      if(k==='f'&&!sel){fit();e.preventDefault();return;}
    }
    if(tool==='wall'&&!m&&(k==='escape'||k==='enter')){wallChain=null;dirty=true;draw();e.preventDefault();return;}
    if(tool==='erase'&&!m&&(k==='delete'||k==='backspace')){
      const item=M.ents.find(q=>q.id===eraseSelected&&sceneEntityLayer(q)===eraseScope());
      if(item){eraseEntity(item);e.preventDefault();return;}
    }
    if(tool==='zone'&&!m){const sz=zsel&&zget(zsel);
      if(k==='enter'&&zpend){zFinish();e.preventDefault();return;}
      if(k==='escape'){if(zpend){zpend=null;draw();dirty=true;}else if(zsel){zsel=null;draw();dirty=true;}return;}
      if(k==='backspace'&&zpend){zpend.pts.pop();if(!zpend.pts.length)zpend=null;draw();dirty=true;e.preventDefault();return;}
      if((k==='delete'||k==='backspace')&&sz){pushUndo();M.cfg.zones=ZL().filter(q=>q!==sz);zsel=null;after();draw();e.preventDefault();return;}
      if(sz&&k.startsWith('arrow')){pushUndo();const n=(e.shiftKey?5:1)*(zsnap||.25);zMove(sz,k==='arrowleft'?-n:k==='arrowright'?n:0,k==='arrowup'?-n:k==='arrowdown'?n:0);after();dirty=true;e.preventDefault();return;}}
    if(m&&k==='z'){(e.shiftKey?doRedo:doUndo)();toast(e.shiftKey?'Làm lại':'Hoàn tác');e.preventDefault();}
    else if(m&&k==='y'){doRedo();e.preventDefault();}
    else if(sel&&m&&k==='d'){selDup();e.preventDefault();}
    else if(sel&&!m&&k.startsWith('arrow')){const n=e.shiftKey?5:1;selMove(k==='arrowleft'?-n:k==='arrowright'?n:0,k==='arrowup'?-n:k==='arrowdown'?n:0);e.preventDefault();}
    else if(sel&&!m&&k==='h'){selFlip();e.preventDefault();}
    else if(sel&&!m&&k==='f'){selFocus();e.preventDefault();}
    else if(!m&&k==='enter'){selCluster(hov||(sel&&{x:sel.x0,y:sel.y0}));e.preventDefault();}
    else if(m&&k==='c'&&sel){copyArea(false);e.preventDefault();}
    else if(m&&k==='x'&&sel){copyArea(true);e.preventDefault();}
    else if(m&&k==='v'&&clip){tool='paste';draw();e.preventDefault();}
    else if(m&&k==='a'){sel={x0:0,y0:0,x1:M.w-1,y1:M.h-1};tool='select';draw();dirty=true;e.preventDefault();}
    else if((k==='delete'||k==='backspace')&&sel&&tool==='select'){clearSel(false);e.preventDefault();}
    else if(k==='escape'){if(tool==='paste'){tool='select';draw();}else if(sel){sel=null;dirty=true;draw();}}};
  document.addEventListener('keydown',window.__kb2d);
  // ===== giao diện =====
  const ANS={};const pn=$('#pn2'),ui={};const body=el('div',{class:'pbody'});const tabs=el('div',{class:'ptabs'});pn.append(tabs,body);
  const TABS=[['tools','Dựng cảnh'],['inventory','Vật phẩm'],['sheet','Bảng ghép ô'],['res','Quản lý gói ảnh'],['mau','🏠 Mẫu 2D'],['maps','🗺 Màn & cửa'],['lib','📚 Thư viện'],['gameSettings','Thiết lập game'],['logic','⚙ Logic'],['anim','🎞 Hoạt ảnh'],['layers','🗂 Lớp'],['file','💾 Tệp']];let tab='tools';
  const SIMPLE_TABS=['tools','inventory','file'];
  const primaryTabs=[['inventory','Vật đã đặt'],['tools','Dựng cảnh']];
  const extraTabs=[
    ['Bản đồ',[['maps','Màn & cửa'],['layers','Lớp'],['zone','Sửa vùng chặn thủ công']]],
    ['Tài nguyên',[['res','Quản lý gói ảnh'],['sheet','Bảng ghép ô'],['mau','Mẫu 2D'],['lib','Thư viện']]],
    ['Game',[['gameSettings','Thiết lập game'],['logic','Logic'],['anim','Hoạt ảnh']]],
    ['Dữ liệu',[['file','Tệp']]]
  ];
  function chooseTab(k){if(k==='zone'){useTool('zone');return;}if(k==='inventory'){useTool('inventory');return;}if(tool==='inventory')useTool('draw');if(k==='tools'&&tool!=='erase'&&!brushTools.includes(tool)){useTool('draw');return;}if(k==='obj'){useTool('obj');return;}tab=k;renderTabs();draw();}
  function renderTabs(){
    if(desktop()){
      const more=el('select',{class:'desktop-tab-more','aria-label':'Mục khác',onchange:e=>{if(e.target.value)chooseTab(e.target.value);}},
       el('option',{value:''},'Thêm…'),
       extraTabs.map(([name,items])=>el('optgroup',{label:name},items.map(([key,label])=>el('option',{value:key},label)))));
      more.value=extraTabs.some(([,items])=>items.some(([key])=>key===tab))?tab:'';
      tabs.replaceChildren(el('div',{class:'desktop-tabs','aria-label':'Khung công việc 2D'},
       primaryTabs.map(([key,label])=>el('button',{class:'ptab'+(key===tab?' on':''),'data-t':key,type:'button',onclick:()=>chooseTab(key)},label)),more));
      return;
    }
    tabs.textContent='';TABS.filter(([k])=>!simple||SIMPLE_TABS.includes(k)).forEach(([k,n])=>tabs.append(el('button',{class:'ptab','data-t':k,onclick:()=>chooseTab(k)},n)));
    tabs.append(el('button',{class:'ptab',style:'margin-left:auto;background:#2b3b2e',onclick:()=>{simple=!simple;try{localStorage.setItem('thk_simple',simple?'1':'0');}catch(e){}if(simple&&!SIMPLE_TABS.includes(tab)&&tab!=='obj'&&tab!=='maps')tab='tools';renderTabs();draw();}},simple?'⚙ Hiện đủ công cụ':'✨ Chế độ đơn giản'));}
  renderTabs();
  const placeOnCanvas=(el_,hostEl)=>{const a=cv.getBoundingClientRect(),h=hostEl.getBoundingClientRect();el_.style.left=(a.left-h.left+a.width/2)+'px';el_.style.maxWidth=Math.max(200,a.width-24)+'px';};
  // thanh nút nổi trên bản đồ: chọn vùng / sao chép / dán
  {const host=document.getElementById('v2d');const ft=document.createElement('div');
   ft.style.cssText='position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;display:none;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;background:rgba(15,22,30,.92);border:1px solid #3d6a4c;border-radius:12px;padding:6px 10px;color:#dff;font:13px system-ui;max-width:92%';
   ft.className='legacy-map-toolbar';host.append(ft);let lk='';
   const fb=(t,f,c)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='border:0;border-radius:9px;padding:8px 12px;font-size:14px;font-weight:600;color:#fff;background:'+(c||'#2f4156');b.onclick=e=>{e.stopPropagation();f();};return b;};
   setInterval(()=>{placeOnCanvas(ft,host);
     const r=sel&&selRect();let k='';
     if(tool==='select')k=r?'sel:'+r.w+'x'+r.h:'pick';else if(tool==='draw'&&fillArm&&r)k='fill:'+r.w+'x'+r.h;else if(tool==='paste')k='paste:'+(clip?clip.w+'x'+clip.h:'none');
     k+=(simple?'S':'F')+act;
     if(k===lk)return;lk=k;ft.textContent='';
     if(!k.startsWith('sel')&&!k.startsWith('pick')&&!k.startsWith('paste')&&!k.startsWith('fill')){ft.style.display='none';return;}
     ft.style.display='flex';
     const lab=t=>{const d=document.createElement('span');d.textContent=t;d.style.fontWeight='600';ft.append(d);};
     if(k.startsWith('fill')){lab('👆 Bấm vào vùng đã chọn ('+r.w+'×'+r.h+' ô) để đổ ô vừa chọn');ft.append(fb('✖ Thôi',()=>{fillArm=false;lk='';},'#7a3434'));}
     else if(k.startsWith('pick'))lab('⬚ Kéo trên bản đồ để chọn một vùng');
     else if(k.startsWith('sel')){lab('Đã chọn '+r.w+'×'+r.h+' ô');
       ft.append(fb('📋 Sao chép',()=>copyArea(false),'#2f6b46'),fb('✂ Cắt',()=>copyArea(true)),fb('🗑 Xóa lớp '+(['Nền','Phủ nền','Vật thể','Mái/cửa','Vùng chặn','Đối tượng'][tool==='erase'?eraseScope():act]||''),()=>clearSel(false),'#7a3434'),fb('✖ Bỏ chọn',()=>{sel=null;dirty=true;lk='';draw();}));}
     else if(k.startsWith('paste')){lab(clip?'Bấm lên bản đồ để dán ('+clip.w+'×'+clip.h+' ô)':'Chưa có gì để dán — hãy Chọn vùng rồi Sao chép');
       ft.append(fb('✔ Xong',()=>{tool='select';draw();dirty=true;},'#2f6b46'));}
   },150);}
  // thanh nút tắt ở đáy bản đồ: công cụ + lớp + hoàn tác
  {const host=document.getElementById('v2d');const dk=document.createElement('div');
   dk.style.cssText='position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:6;display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:center;background:rgba(15,22,30,.92);border:1px solid #34485a;border-radius:14px;padding:6px 8px;max-width:96%';
   dk.className='legacy-map-toolbar';host.append(dk);let dkey='';
   const mk=(t,f,on,col)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='border:0;border-radius:9px;padding:8px 11px;font-size:13.5px;font-weight:600;color:#fff;background:'+(on?'#3a78d6':(col||'#2a3a4c'))+';cursor:pointer';b.onclick=e=>{e.stopPropagation();f();};return b;};
   const sep=()=>{const d=document.createElement('span');d.style.cssText='width:1px;height:22px;background:#3a4a5c;margin:0 3px';return d;};
   const dockMobile=()=>{ // điện thoại/máy bảng: thanh dock một hàng cuộn ngang, nằm ngay dưới bản đồ (không đè lên bản đồ và bảng bên dưới)
     if(desktop()){dk.style.cssText=dk.dataset.css0;cv.style.marginBottom='';dk.dataset.mob='';return false;}
     const a=cv.getBoundingClientRect(),h=host.getBoundingClientRect();
     if(dk.dataset.mob!=='1'){dk.dataset.mob='1';dk.style.cssText='position:absolute;z-index:6;display:flex;flex-wrap:nowrap;gap:4px;align-items:center;justify-content:flex-start;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;background:rgba(15,22,30,.96);border:1px solid #34485a;border-radius:10px;padding:4px;box-sizing:border-box;height:46px;scrollbar-width:none';cv.style.marginBottom='50px';}
     dk.style.left=(a.left-h.left)+'px';dk.style.width=a.width+'px';dk.style.top=(a.bottom-h.top+2)+'px';dk.style.bottom='auto';dk.style.transform='none';dk.style.maxWidth='none';
     [...dk.children].forEach(b=>{if(b.tagName==='BUTTON'){b.style.flex='none';b.style.whiteSpace='nowrap';b.style.padding='7px 9px';b.style.fontSize='13px';}});
     return true;};
   dk.dataset.css0=dk.style.cssText;
   setInterval(()=>{if(!dockMobile())placeOnCanvas(dk,host);const k=tool+'|'+act+'|'+(tab==='tools'?1:0)+'|'+(smoothOn()?1:0)+(ISOQ()?1:0)+fogLv()+'|'+colMode+'|'+ANGQ();if(k===dkey)return;dkey=k;dk.textContent='';
     [['draw','Đặt mảnh','Bấm hoặc kéo để đặt mảnh đang chọn'],['erase','🧽 Xóa','Chọn nhóm cần xóa ở bảng Dựng cảnh'],['select','⬚ Chọn vùng','Kéo khung để chọn một vùng, rồi Sao chép / Xóa / Đổ nền'],['paste','📥 Dán','Dán vùng đã sao chép: bấm lên bản đồ'],['pan','✋ Kéo','Kéo để di chuyển bản đồ']].forEach(([t,n,tp])=>{const bb=mk(n,()=>{useTool(t);},tool===t);bb.title=tp;dk.append(bb);});
     dk.append(sep());
     ['Nền','Phủ nền','Vật thể','Mái/cửa'].forEach((n,i)=>dk.append(mk(n,()=>{if(tool==='select'||tool==='paste'||tool==='pan')tool='draw';tab='tools';useLayer(i);},act===i,'#35453a')));
     dk.append(sep(),mk('↶',doUndo),mk('↷',doRedo),mk('⤢',fit));
     dk.append(sep(),mk('Va chạm: '+collisionLabels[colMode],toggleCollisionPreview,!!colMode),
       mk('Phép chiếu: '+(ANGQ()?'Angle':'Isometric'),toggleProjection,ANGQ()));
     if(ISOQ()){const sb=mk('🌿 Nền mượt',()=>{pushUndo();M.cfg.smooth=smoothOn()?false:true;after();toast(smoothOn()?'Nền mượt: BẬT (hòa trộn mép, xoay lật ô, đốm sáng tối)':'Nền mượt: TẮT');dkey='';dirty=true;},smoothOn());sb.title='Bật: nền hòa trộn ở mép giữa hai loại ô, hết cảm giác ô vuông';dk.append(sb);const fb=mk(['🌫 Sương: tắt','🌫 Sương: nhẹ','🌫 Sương: vừa','🌫 Sương: dày'][fogLv()],()=>{pushUndo();M.cfg.fog=(fogLv()+1)%4;after();dkey='';dirty=true;},fogLv()>0);fb.title='Sương mờ phủ lên trên cùng (tiền cảnh). Bản chơi thì sương trôi chậm.';dk.append(fb);}
   },150);}
  const collisionLabels=['Tắt','Vùng chặn','Chặn và đi'];
  const desktopTools=[['draw','Đặt mảnh','B'],['select','Chọn vùng','V'],['erase','Xóa','E'],['collisionPreview','Va chạm','K']];
  const toolNames={draw:'Đặt mảnh',pick:'Lấy mẫu',rect:'Đặt theo khung',fill:'Thay vùng liền',obj:'Đối tượng',paste:'Dán',pan:'Kéo khung nhìn',inventory:'Vật phẩm'};
  const layerNames=[...LAYN,'Vùng chặn'];
  const rail=el('nav',{class:'desktop-rail','aria-label':'Công cụ bản đồ'});
  const statusBar=el('div',{class:'desktop-status'});
  const toolButtons=desktopTools.map(([id,label,key])=>{
    const b=el('button',{type:'button',title:label+' ('+key+')','aria-keyshortcuts':key,onclick:()=>id==='collisionPreview'?toggleCollisionPreview():useTool(id)},el('kbd',{},key),label);
    rail.append(b);return [id,b];
  });
  const projectionButton=el('button',{type:'button',title:'Đổi phép chiếu (P)','aria-keyshortcuts':'P',onclick:toggleProjection},el('kbd',{},'P'),'Phép chiếu');
  const projectionState=el('span',{},'Isometric');
  projectionButton.append(projectionState);
  rail.append(projectionButton);
  rail.append(el('button',{type:'button',title:'Vừa khung (F)',onclick:()=>{fit();cv.focus();}},el('kbd',{},'F'),'Vừa khung'));
  const inventoryButton=el('button',{type:'button',title:'Chọn vật đã đặt (Q)','aria-keyshortcuts':'Q','aria-pressed':'false',onclick:()=>useTool('inventory')},
    el('kbd',{},'Q'),'Chọn vật');
  rail.append(inventoryButton);
  const zoomButton=(label,key,factor)=>el('button',{type:'button',title:label+' ('+key+')','aria-label':label,'aria-keyshortcuts':key,onclick:()=>{
    zoomBy(factor);updateDesktop();cv.focus({preventScroll:true});
  }},el('kbd',{},key),factor>1?'+':'−');
  const sidebarButton=el('button',{type:'button','aria-controls':'pn2','aria-expanded':'true','aria-keyshortcuts':'J',title:'Thu hoặc mở bảng phải (J)',onclick:()=>{
    const wide=root.classList.toggle('assembly-wide');
    sidebarButton.replaceChildren(el('kbd',{},'J'),wide?'Mở bảng phải':'Thu bảng phải');
    sidebarButton.setAttribute('aria-expanded',String(!wide));
    dirty=true;cv.focus({preventScroll:true});
  }},el('kbd',{},'J'),'Thu bảng phải');
  rail.append(zoomButton('Thu nhỏ','[',1/1.25),zoomButton('Phóng to',']',1.25),sidebarButton);
  const layerPicker=el('select',{'aria-label':'Lớp đang sửa',onchange:e=>{
    const value=e.target.value;
    if(value==='house'||value==='animated'){
      inventoryLayer=value;inventoryId=inventoryGroup='';inventoryPage=0;useTool('inventory');
    }else{inventoryLayer='all';useLayer(Number(value));}
  }},layerNames.map((label,index)=>el('option',{value:index},(index+1)+' · '+label)),
    el('option',{value:'house'},'Nhà'),el('option',{value:'animated'},'Animation/Animated'));
  const statusText=el('span',{}),statusHint=el('span',{class:'desktop-status-hint'},'Space + kéo · Cuộn để zoom · Chuột phải');
  statusBar.append(layerPicker,statusText,statusHint);
  cv.before(rail);cv.after(statusBar);
  let viewDetails=false;
  function switchGrid(){grid=!grid;dirty=true;draw();}
  function useLayer(i){
    eraseActors=false;eraseSelected=null;
    if(i!==act&&brushTools.includes(tool)&&!stamp.multi)stamp={w:1,h:1,multi:false,tiles:[0]};
    act=i;if(tool==='paste'||tool==='zone'||tool==='obj'||tool==='inventory'){tool='draw';tab='tools';renderTabs();}
    fillArm=false;dirty=true;draw();cv.focus({preventScroll:true});
  }
  let pickAndDraw=false;
  function useTool(id){
    if(id!=='erase'){eraseActors=false;eraseSelected=null;}
    pickAndDraw=false;tool=id;fillArm=false;wallChain=null;if(id==='wall'){act=2;tab='tools';}if(id!=='zone'){zpend=null;zsel=null;}
    if(id==='inventory'){tab='inventory';sel=null;selId=null;inventoryMoving=false;if(root.classList.contains('assembly-wide'))sidebarButton.click();}
    else if(id==='obj')tab='obj';
    else if(desktop()||id==='zone'||id==='erase'||tab==='obj'||tab==='inventory')tab='tools';
    renderTabs();draw();dirty=true;cv.focus({preventScroll:true});
  }
  function toggleCollisionPreview(){
    colMode=(colMode+1)%collisionLabels.length;dirty=true;updateDesktop();cv.focus({preventScroll:true});
  }
  let changingProjection=false;
  async function toggleProjection(){
    if(!M||changingProjection)return;
    const map=M,to=ANGQ()?'iso':'angle';
    changingProjection=true;projectionButton.disabled=true;
    try{
      if(to==='angle')await ensureAngle(sheets);
      if(M!==map)return;
      pushUndo();M.cfg.view='iso';M.cfg.proj=to;isoK='';angN=-1;after();fit();draw();
      cv.focus({preventScroll:true});
    }catch(error){toast(error.message||'Không đổi được phép chiếu.');}
    finally{changingProjection=false;projectionButton.disabled=false;}
  }
  function updateDesktop(){
    if(!desktop())return;
    for(const [id,b] of toolButtons)b.setAttribute('aria-pressed',String(id==='collisionPreview'?!!colMode:id===tool));
    const collisionButton=toolButtons.find(([id])=>id==='collisionPreview')[1];
    const collisionLabel='Va chạm: '+collisionLabels[colMode];
    if(collisionButton.getAttribute('aria-label')!==collisionLabel){
      collisionButton.replaceChildren(el('kbd',{},'K'),'Va chạm',el('span',{},collisionLabels[colMode]));
      collisionButton.setAttribute('aria-label',collisionLabel);
    }
    const projection=ANGQ()?'Angle':'Isometric';
    if(projectionState.textContent!==projection)projectionState.textContent=projection;
    inventoryButton.setAttribute('aria-pressed',String(tool==='inventory'));
    layerPicker.value=tool==='inventory'&&['house','animated'].includes(inventoryLayer)?inventoryLayer:String(act);
    const r=selRect(),current=desktopTools.find(t=>t[0]===tool);
    statusText.textContent=(tool==='erase'?'Xóa · '+(eraseActors?'Đối tượng':layerNames[act]):current?.[1]||toolNames[tool]||'Công cụ')+(r?' · '+r.w+' × '+r.h+' ô':'')+' · '+Math.round(view.z*100)+'%';
  }
  const desktopQuery=window.matchMedia('(min-width: 980px) and (pointer: fine)');
  const onLayoutChange=()=>{renderTabs();draw();fit();};
  if(desktopQuery.addEventListener)desktopQuery.addEventListener('change',onLayoutChange);
  else desktopQuery.addListener(onLayoutChange);
  ui.stamp=()=>{const c=$('.stampc',pn);if(!c)return;const z=Math.max(1,Math.min(5,Math.floor(120/Math.max(stamp.w,stamp.h)/CELL*3)));c.width=stamp.w*CELL*z/1;c.height=stamp.h*CELL*z/1;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);
    for(let j=0;j<stamp.h;j++)for(let i=0;i<stamp.w;i++){if(stamp.multi){for(let l=0;l<4;l++){const v=stamp.layers[l]&&stamp.layers[l][j*stamp.w+i];if(v)drawTile(g,v,i*CELL*z,j*CELL*z,CELL*z);}}else drawTile(g,stamp.tiles[j*stamp.w+i],i*CELL*z,j*CELL*z,CELL*z);}};
  ui.obj=()=>{if(tab==='obj'||tab==='maps'||tab==='inventory')draw();};ui.tools=()=>{if(tab==='tools')draw();};ui.layers=()=>{if(tab==='layers'||tab==='tools')draw();};ui.sel=()=>{if(tab==='tools')draw();};
  function btn(label,fn,cls=''){return el('button',{class:'b '+cls,onclick:fn},label);}
  const brushTools=['draw','rect','fill'];
  const buildSources=new Map(),buildPages=new Map(),buildPageSize=48;
  let allBuildImages=true;
  let buildQuery='',buildOptionsOpen=false,sheetOptionsOpen=false;
  const daXoayParts=['Cổng vòm','Cột đá','Rương'];
  function brushAsset(value){
    if(!value)return null;
    const d=dec(value),asset=sheets[d.sid];
    return asset?.img&&d.idx>=0&&d.idx<asset.cols*asset.rows&&!/^\(đã gỡ/.test(asset.name)?asset:null;
  }
  function brushSheet(){
    const values=stamp.multi?(stamp.layers||[]).flat():stamp.tiles||[];
    for(const value of values){const asset=brushAsset(value);if(asset)return asset;}
    return null;
  }
  function hasBrush(){return !!brushSheet();}
  function normSearch(text){
    return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('đ','d').trim();
  }
  function constructionTile(sid,idx,coverage){
    const asset=sheets[sid],tag=TG.tiles[asset.name+'#'+idx]||{},group=TG.sheets[asset.name]||{};
    const rock=stonePhase(enc(sid,idx),0)!==null;
    const sample=/^Đá Xoáy · cổng, cột, rương/.test(asset.name)?daXoayParts[idx]:null;
    const actor=/^Đá Xoáy · nhân vật/.test(asset.name)||/^(Nhân vật|Quái)$/.test(tag.type??group.type??'');
    const inferredRoof=roofTextureDirection((tag.source||asset.name).split(/[\\/]/).pop(),true);
    const layer=tag.layer??group.layer??(inferredRoof?3:rock||asset.iso||coverage===2?0:actor?-1:2);
    const source=(tag.source||asset.name).split(/[\\/]/).pop().replace(/\.(png|webp|jpe?g|gif)$/i,'');
    const inferred=/^(?:roof|mái)[_ -]?([NESW])(?=$|[_ -])/i.exec(source);
    const dir={N:'bắc',E:'đông',S:'nam',W:'tây'};
    const variant=inferred&&source.slice(inferred[0].length).replace(/^[_ -]+/,'');
    const named=inferred?'Mái hướng '+dir[inferred[1].toUpperCase()]+(variant?' · '+variant:''):source.replace(/[_-]+/g,' ');
    return {layer,label:sample||(rock?'Đá lát tự khớp mạch':tag.name||(tag.source||asset.cols*asset.rows===1?named:named+' · Ô '+(idx+1))),
      source:tag.source||sample||asset.name,type:tag.type??group.type??(sample==='Cột đá'?'Đồ vật':undefined),
      behavior:tag.fn??group.fn??(sample?'Chặn đường':undefined)};
  }
  function visibleBuildSheets(layer){
    return visSh().filter(sid=>{
      const sh=sheets[sid];if(!brushAsset(enc(sid,0)))return false;
      if(stonePhase(enc(sid,0),0)!==null)return layer===0||layer==='all';
      return !/^Đá Xoáy · nhân vật/.test(sh.name);
    });
  }
  function materialCards(layer,sid){
    const sh=sheets[sid],cards=[];
    const autoStone=stonePhase(enc(sid,0),0)!==null;
    if(autoStone){
      if(layer===0||layer==='all')
        cards.push({value:enc(sid,0),label:'Đá lát tự khớp mạch',layer:0});
      return cards;
    }
    let pixels;
    try{pixels=emptyMap(sh);}catch{return cards;}
    for(let i=0,n=Math.min(4096,pixels.length);i<n;i++){
      if(pixels[i]===1)continue;
      const info=constructionTile(sid,i,pixels[i]);
      if(info.layer<0||info.layer>=4||(layer!=='all'&&info.layer!==layer))continue;
      cards.push({value:enc(sid,i),label:info.label,layer:info.layer});
    }
    return cards;
  }
  let snapPieces=false;
  const propThicknesses=new Map(),propSizes=new Map(),propTurns=new Map(),propAnchorIds=new Map();
  let propCache=null,ruleContext=null;
  function gateKind(value){
    const {sid,idx}=dec(value),sheet=sheets[sid];
    if(!sheet?.img)return '';
    if(idx===0&&sheet.tw===64&&/^Đá Xoáy · cổng, cột, rương/.test(sheet.name))return 'stone';
    return /(?:^|[\s_./-])(?:cổng vòm|cổng|gate|archway|arch)\d*(?:$|[\s_./-])/i.test(constructionTile(sid,idx,0).source)?'unknown':'';
  }
  function stampHasGate(){return (stamp.tiles||[]).some(value=>value&&gateKind(value));}
  let wallChain=null,renderGate=null,buildThickness=WALL_THICKNESS,buildHeight=1.25;
  const renderWallEnts=()=>renderGate?[...M.ents,renderGate]:M.ents;
  function ruleCtx(fresh=false){
    if(fresh||ruleContext?.map!==M||ruleContext.revision!==buildRevision){
      const paintZones=currentPaintZones();
      ruleContext={map:M,revision:buildRevision,paintZones,
        context:constructionContext({...M,ents:structuralPieces(M)},paintZones),
        wallFaces:builtWallFaces(M.ents,ANGQ()||!ISOQ())};
    }
    return ruleContext.context;
  }
  function withAssetSource(e,cfg,source=sheets){
    const tile=e.tile,sheet=source[tile?.sid];
    if(e.t!=='deco'||!sheet||e.wallLine||e.wallId||e.housePart||e.gateAssembly||e.sceneLayer===0||e.sceneLayer===1)return e;
    const assetSource=e.assetSource||(sheet===sheets[tile.sid]?constructionTile(tile.sid,tile.idx,0).source:sheet.name);
    const art=sheet.img&&!sheet.iso?tileContact(sheet,tile.idx,e.spriteFlip||0,source):null;
    const cropContacts=art&&cropContactFrame(sheet.name,tile.idx,assetSource,tileContact(sheet,tile.idx,0,source).alphaBounds);
    const projection=cfg?.view==='iso'?(cfg.proj==='angle'?'angle':'iso'):'top';
    return {...e,assetSource,assetSheet:sheet.name,contactProjection:projection,cropContacts:cropContacts||e.cropContacts,artContact:art?.contact,trunkContact:art?.trunk,artBase:art?.base,solidBase:art?.solidBase,
      spriteBounds:e.spriteBounds||art?.bounds};
  }
  function structuralPieces(map){
    const pieces=map.ents.map(e=>withAssetSource(e,map.cfg)),layer=map.layers[3];
    for(let i=0;i<layer.length;i++){
      if(!layer[i])continue;
      const roof=legacyRoof(layer[i],i,map.w);
      if(roof)pieces.push(roof);
    }
    return pieces;
  }
  function structuralProblems(map){
    const pieces=structuralPieces(map),ctx=constructionContext({...map,ents:pieces});
    const roofs=ctx.headroom(),issues=[];
    for(const e of pieces){
      const issue=isRoof(e)?roofs.some(r=>r.id===e.id)?'':roofIssue:
        e.wallLine&&!wallHasFoundation(e,ctx)?'Chân tường cần nền đỡ.':
        e.placedProp&&(e.bearingColumn??isBearingColumn(e.name))&&!ctx.floor(e.x+1,e.y+1,.06)?
          'Chân cột cần nền đỡ.':headroomIssue(e,roofs,map.cfg);
      if(issue)issues.push({e,issue});
    }
    return issues;
  }
  function structureError(before,next){
    const problems=structuralProblems(next);
    if(!problems.length)return '';
    const fingerprint=({e,issue})=>JSON.stringify([e.id,e.x,e.y,e.sc,e.roofDirection,e.wallLine,e.tile,issue]);
    const carried=new Set(structuralProblems(before).map(fingerprint));
    const item=problems.find(problem=>!carried.has(fingerprint(problem)));
    return item?(item.e.name||'Kết cấu')+' · '+item.issue:'';
  }
  function acceptStructure(){
    const before=undo.at(-1);
    if(!before)return true;
    const error=structureError(before,M);
    if(!error)return true;
    M=undo.pop();ruleContext=null;isoK='';dirty=true;toast(error);return false;
  }
  function constructionIssue(piece,fresh=false){
    if(piece.gateUncalibrated)return 'Ảnh cổng này cần dữ liệu hai chân trụ. Có thể lắp ngay bằng cổng Đá Xoáy.';
    if(!piece.gateAssembly&&!piece.buildChecks&&!isRoof(piece))return '';
    const ctx=ruleCtx(fresh),issue=propIssue(piece,ctx);
    if(issue)return issue;
    if(!isRoof(piece))return headroomIssue(piece,ctx.headroom(),M.cfg);
    const bearing=roofBearing(piece,ctx);
    const plane=roofPlane(piece,bearing);
    const conflict=M.ents.find(e=>headroomIssue(e,[plane],M.cfg));
    return conflict?(conflict.name||'Vật thể')+' · '+headroomIssue(conflict,[plane],M.cfg):'';
  }
  function aimProp(prop,p){
    if(prop.wallGateBrush){
      const hit=visibleWallAt(p);
      const at=hit?{x:hit.point[0]-1,y:hit.point[1]-1}:propPosition(p);
      if(!at)return null;
      const piece={...prop,...at,id:'preview-gate'};
      const mounted=mountGate(piece,ruleCtx().walls);
      return mounted?{piece:mounted,issue:constructionIssue(mounted)}:
        {piece,issue:'Rê cổng lên đoạn tường thẳng, đủ dài và cách góc tường.'};
    }
    const ctx=ruleCtx(),probe={...prop,x:0,y:0,id:'preview-piece'};
    const roof=isRoof(prop),mode=anchorMode(prop),id=anchorOrigin(prop);
    const fromPointer=support=>{
      const frame=propDisplayFrame(probe,support);
      const [dx,dy]=placementAnchorOffset(frame,prop.spriteBounds||undefined,mode,id);
      return propPosition({...p,x:p.x-dx,y:p.y-dy});
    };
    const at=fromPointer(null);
    let piece=at?{...probe,...at}:null,support=null;
    if(roof){
      const candidates=[null];
      if(ISOQ())for(const h of nearbyBearingHeights(ctx,p))candidates.push({base:h,rise:0});
      let best=Infinity;
      for(const guess of candidates){
        let pos=fromPointer(guess);
        for(let i=0;pos&&i<3;i++){
          const placed={...probe,...pos},bearing=roofBearing(placed,ctx);
          if(!bearing)break;
          const active=anchorChoices(placed,propDisplayFrame(placed,bearing)).find(a=>a.id===id);
          const d=Math.hypot(active.point[0]-p.x,active.point[1]-p.y);
          if(d<best){best=d;piece=placed;support=bearing;}
          if(d<.25||(p.snap&&d<3))break;
          pos=fromPointer(bearing);
        }
        if(best<.25)break;
      }
      const snapTolerance=p.snap?Math.max(7,CELL*view.z*.45):8;
      if(best>snapTolerance){piece=at?{...probe,...at}:null;support=null;}
    }
    if(!piece)return null;
    let alignment=pieceAlignment(piece,support);
    if(snapPieces&&!p.free&&alignment?.guides.some(g=>Math.abs(g.delta)>1e-6)){
      const next={...piece};
      for(const guide of alignment.guides)next[guide.axis?'y':'x']+=guide.delta;
      const bearing=roof?roofBearing(next,ctx):null;
      if(inb(next.x+1,next.y+1)&&(!roof||bearing)&&!constructionIssue(next)){
        piece=next;support=bearing;alignment=pieceAlignment(piece,support);
      }
    }
    const issue=stackedPropIssue(piece)||(roof&&!support?roofIssue:constructionIssue(piece));
    return {piece,support,issue,alignment};
  }
  function stackedPropIssue(piece){
    return piece.placedProp&&!piece.wallLine&&M.ents.some(e=>e.id!==piece.id&&e.placedProp&&!e.wallLine&&
      sceneEntityLayer(e)===sceneEntityLayer(piece)&&Math.hypot(e.x-piece.x,e.y-piece.y)<.035&&e.roofDirection===piece.roofDirection)
      ?'Vị trí này đã có mảnh cùng lớp. Dời điểm đặt hoặc xóa mảnh cũ.':'';
  }
  function pieceAlignment(piece,support){
    const roof=isRoof(piece),tolerance=Math.min(.5,9/Math.max(1,CELL*view.z));
    const surface=(e,bearing)=>{
      const plane=roofPlane(e,bearing);
      return {...plane,base:plane.base+(e.roofDirection?roofThickness(e):0)};
    };
    const plane=roof?surface(piece,support||{base:piece.roofDirection?piece.sc:0,rise:piece.roofDirection ? .64*piece.sc : 0}):null;
    const bounds=plane?.bounds||bodyFootprint(piece);
    let best=null;
    const pieces=[...M.ents,...(roof&&ISOQ()?isoBuild().legacyRoofs:[])];
    for(const ref of pieces){
      if(!ref.placedProp||ref.wallLine||ref.gateAssembly||isRoof(ref)!==roof||!vis[sceneEntityLayer(ref)])continue;
      const bearing=roof?roofBearing(ref,ruleCtx()):null;
      if(roof&&!bearing)continue;
      const refPlane=bearing?surface(ref,bearing):null,other=refPlane?.bounds||bodyFootprint(ref);
      const join=measureJoin(bounds,other);
      if(join.distance>tolerance*3)continue;
      const score=join.kind==='overlap'?-Math.min(...join.overlap):join.distance;
      if(best&&best.score<=score)continue;
      const guides=alignmentGuides(bounds,other,tolerance);
      const height=plane&&support&&refPlane&&join.kind!=='gap'?seamHeightDifference(plane,refPlane):0;
      best={plane,refPlane,bounds,other,join,guides,height,score};
    }
    return best;
  }
  function alignmentLabel(a){
    if(!a)return '';
    const z=a.height>JOIN_EPSILON?' · Lệch Z '+coord.format(a.height)+' ô':'';
    const {kind,overlap,distance}=a.join;
    if(kind==='overlap')return 'Chồng mép '+overlap.map(v=>coord.format(v)).join(' × ')+' ô'+z;
    if(kind==='edge')return 'Chạm mép'+z;
    if(kind==='corner')return 'Chạm góc'+z;
    return (a.guides.some(g=>Math.abs(g.delta)<=JOIN_EPSILON)?'Thẳng hàng · ':'')+'Hở '+coord.format(distance)+' ô';
  }
  function drawPieceAlignment(a){
    if(!a)return;
    const scale=ISOQ()?CELL*view.z:0;
    const project=(x,y,plane)=>{
      const p=g2s(x,y);
      return [p[0],p[1]-(plane?scale*roofHeightAt(plane,x,y):0)];
    };
    const path=([l,t,r,b],plane)=>{
      cx.beginPath();
      cx.moveTo(...project(l,t,plane));
      for(const [x,y] of [[r,t],[r,b],[l,b]])cx.lineTo(...project(x,y,plane));
      cx.closePath();
    };
    const {kind}=a.join,overlap=kind==='overlap';
    const color=overlap||a.height>JOIN_EPSILON?'#ff917f':kind==='gap'?'#80cdff':'#72efbf';
    cx.save();cx.strokeStyle=color;cx.lineWidth=1.6;
    path(a.other,a.refPlane);cx.stroke();
    const intersection=a.bounds.map((v,i)=>i<2?Math.max(v,a.other[i]):Math.min(v,a.other[i]));
    if(overlap){
      path(intersection,a.plane);cx.fillStyle='#ff766658';cx.fill();cx.stroke();
    }else if(kind==='edge'||kind==='corner'){
      const [l,t,r,b]=intersection;
      const start=project(l,t,a.refPlane),end=project(r,b,a.refPlane);
      cx.lineWidth=3;cx.beginPath();cx.moveTo(...start);cx.lineTo(...end);cx.stroke();
      if(kind==='corner'){cx.fillStyle=color;cx.beginPath();cx.arc(...start,4,0,Math.PI*2);cx.fill();}
    }
    cx.setLineDash([5,4]);cx.strokeStyle='#8edbff';
    for(const guide of a.guides){
      const i=guide.axis,j=1-i;
      const lo=Math.min(a.bounds[j],a.other[j])-.45,hi=Math.max(a.bounds[j+2],a.other[j+2])+.45;
      const pts=i?[[lo,guide.value],[hi,guide.value]]:[[guide.value,lo],[guide.value,hi]];
      cx.beginPath();cx.moveTo(...project(...pts[0],a.refPlane));cx.lineTo(...project(...pts[1],a.refPlane));cx.stroke();
    }
    cx.restore();
  }
  function nearbyBearingHeights(ctx,p){
    const scale=CELL*view.z,reach=Math.max(scale*5,36);
    const near=ctx.bearingSurfaces().flatMap(({a,b,height})=>{
      const xy=q=>{const [x,y]=g2s(...q);return [x,y-height*scale];};
      const d=projectSegment([p.x,p.y],xy(a),xy(b)).distance;
      return d<=reach?[{d,height}]:[];
    });
    near.sort((a,b)=>a.d-b.d);
    const heights=[...new Set(near.map(t=>t.height))].slice(0,4);
    const middle=heights.flatMap((a,i)=>heights.slice(i+1).map(b=>(a+b)/2));
    return [...heights,...middle].slice(0,8);
  }
  function chooseGateBrush(){
    const sid=sheets.findIndex(sh=>sh.img&&/^Đá Xoáy · cổng, cột, rương/.test(sh.name));
    if(sid<0){toast('Bộ cổng Đá Xoáy chưa tải xong.');return;}
    useTool('draw');selectBuildMaterial(enc(sid,0),2);
  }
  function visibleWallAt(p){
    if(!vis[2])return null;
    ruleCtx();
    const geo=ISOQ()?outline2D(M.cfg.outline,ANGQ(),M.ents):null;
    let hit=null;
    const test=(face,which)=>{
      const shape=wallSurface(face,g2s,CELL*view.z,geo);
      if(!shape||shape.high<=0)return;
      const [[x,y],[u,v]]=shape.front;
      const t=Math.abs(u-x)>.01?Math.max(0,Math.min(1,(p.x-x)/(u-x))):Math.max(0,Math.min(1,(p.y-y)/(v-y||1)));
      const base=y+(v-y)*t,top=base-shape.high;
      const back=shape.back[0][0]+(shape.back[1][0]-shape.back[0][0])*t;
      const front=x+(u-x)*t,backTop=shape.back[0][1]+(shape.back[1][1]-shape.back[0][1])*t-shape.high;
      if(p.x<Math.min(front,back)-3||p.x>Math.max(front,back)+3||p.y<Math.min(top,backTop)-3||p.y>base+3)return;
      if(hit&&hit.face.k>face.k)return;
      hit={face,which,point:face.a.map((v,i)=>v+(face.b[i]-v)*t)};
    };
    for(const face of geo?.walls||[])test(face,'Tường bao');
    for(const face of ruleContext.wallFaces)test(face,'Tuyến tường');
    return hit;
  }
  function wallAim(p){
    const raw=s2g(p.x,p.y),point=[Math.round(raw.x*4)/4,Math.round(raw.y*4)/4];
    const ctx=ruleCtx(),r=buildThickness/2;
    const floor=b=>ctx.floor(...b,r);
    const nearStart=wallChain&&[wallChain.first,wallChain.a].find(b=>{
      const q=g2s(...b);return Math.hypot(q[0]-p.x,q[1]-p.y)<=9&&Math.hypot(raw.x-b[0],raw.y-b[1])<=.6;
    });
    if(!p.free&&nearStart)return {point:nearStart,label:nearStart===wallChain.a?'Đầu đoạn hiện tại':'Điểm đầu tuyến',join:true,ok:floor(nearStart)};
    const hit=p.free?null:visibleWallAt(p);
    if(!p.free){
      const snapped=hit?.face.wall&&hit.point;
      if(snapped)return {point:snapped,label:'Tuyến tường',join:true,ok:floor(snapped)};
      let best=null,limit=Math.min(.6,8/Math.max(CELL*view.z,1));
      for(const face of ruleContext.wallFaces){
        const q=projectSegment([raw.x,raw.y],face.a,face.b);
        if(q.distance>limit)continue;
        limit=q.distance;best=q.point;
      }
      if(best)return {point:best,label:'Tuyến tường',join:true,ok:floor(best)};
      if(hit?.which==='Tường bao'){
        const [a,b]=[hit.face.a,hit.face.b],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
        const q=hit.point,d=r+.035;
        const inside=[1,-1].map(k=>[q[0]-k*dy/len*d,q[1]+k*dx/len*d]).find(floor);
        if(inside)return {point:inside,label:'Chân tường bao · phía sàn',join:true,ok:true};
      }
    }
    const onFloor=ctx.floor(...point,0);
    return {point,label:onFloor?p.free?'Nền · bỏ bám tường':'Nền':inb(...point)?'Ngoài mép sàn':'Ngoài bản đồ',
      join:false,ok:floor(point)};
  }
  function wallPiece(a,b){
    return {t:'deco',name:'Tuyến tường đá',placedProp:true,x:a[0]-1,y:a[1]-1,
      wallLine:{dx:b[0]-a[0],dy:b[1]-a[1],height:buildHeight,thickness:buildThickness}};
  }
  function wallClick(p){
    const aim=wallAim(p),b=aim.point,ctx=ruleCtx();
    if(!wallChain){
      if(!aim.ok){toast('Chọn điểm bắt đầu có đủ sàn đỡ.');return;}
      wallChain={a:b,first:b};draw();dirty=true;return;
    }
    const w=wallPiece(wallChain.a,b),issue=wallIssue(w,ctx);
    if(issue){toast(issue);return;}
    pushUndo();M.ents.push({...w,id:newId()});
    wallChain=b===wallChain.first?null:{...wallChain,a:b};
    after();draw();
    toast(aim.join?'Đã nối vào '+aim.label.toLowerCase():'Đã đặt đoạn tường');
  }
  const coord=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const xy=([x,y])=>'X '+coord.format(x)+' · Y '+coord.format(y);
  function drawPlacementGuides(target){
    if(tool==='inventory'){aimHud.hidden=true;return;}
    if(!hov||!lastPt||drag?.pan||gest){aimHud.hidden=true;return;}
    const p=lastPt,raw=s2g(p.x,p.y),wallTool=tool==='wall';
    const mounting=target?.piece.wallGateBrush;
    const hit=wallTool||mounting?null:visibleWallAt(p);
    const pointAt=target?[target.piece.x+1,target.piece.y+1]:
      ['draw','rect','fill','erase','paste','pick'].includes(tool)?[hov.x+.5,hov.y+.5]:[raw.x,raw.y];
    const aim=wallTool?wallAim(p):{point:pointAt,join:!!target?.piece.wallId||!!(target&&isRoof(target.piece)&&!target.issue),ok:!target?.issue,
      label:target?.piece.wallId?(target.piece.wallId.startsWith('outline:')?'Tường bao':'Tuyến tường'):!inb(...pointAt)?'Ngoài bản đồ':
       ruleCtx().floor(...pointAt,0)?'Nền':'Ngoài mép sàn'};
    const [x,y]=aim.point,[px,py]=g2s(x,y);
    const start=wallChain?.a||(drag?.wallPointer&&drag.start.ok&&Math.hypot(p.x-drag.p.x,p.y-drag.p.y)>5?drag.start.point:null);
    const issue=wallTool?start?wallIssue(wallPiece(start,aim.point),ruleCtx()):!aim.ok?'Chọn điểm có đủ sàn đỡ.':'':target?.issue||'';
    const line=issue||(!aim.ok?'Không thể đặt tại đây.':wallTool&&start?
      (aim.join?'Có thể nối · ':'Có thể dựng · ')+coord.format(Math.hypot(x-start[0],y-start[1]))+' ô · từ '+xy(start):
      wallTool?'Bấm để bắt đầu · Giữ Alt để bỏ bám tường':mounting&&aim.join?'Cổng đã bám tuyến · Bấm để lắp':
      target&&isRoof(target.piece)?'Có hai điểm tựa · Bấm để đặt':
      hit?'Con trỏ trên '+hit.which.toLowerCase()+' · Điểm dóng ở mặt bằng':'');
    const v=stamp.tiles?.[0],tile=brushAsset(v)&&dec(v);
    const name=target?entityName(target.piece):brushTools.includes(tool)&&tile?constructionTile(tile.sid,tile.idx,0).label:'';
    const anchorTitle=target&&!mounting?placementAnchorNames[anchorOrigin(target.piece)]:aim.label;
    let location=xy(aim.point);
    if(target?.piece.roofDirection&&ISOQ()){
      const e=target.piece,id=anchorOrigin(e),u=(id%3)/2,v=Math.floor(id/3)/2;
      const span=e.sc/.95,point=[e.x+1+(u-.5)*span,e.y+1+(v-.5)*span];
      location=xy(point);
      if(target.support){
        const t={E:u,W:1-u,N:1-v,S:v}[e.roofDirection];
        location+=' · Z '+coord.format(target.support.base+target.support.rise*t+roofThickness(e));
      }
    }
    const title=(name?name+' · ':'')+anchorTitle+' · '+location;
    if(aimTitle.textContent!==title)aimTitle.textContent=title;
    const relation=alignmentLabel(target?.alignment),hint=[relation,line].filter(Boolean).join(' · ');
    if(aimHint.textContent!==hint)aimHint.textContent=hint;
    aimHud.dataset.state=issue?'invalid':aim.join?'joined':'ready';
    aimHud.hidden=false;
    if(!wallTool&&!target&&!['draw','rect','fill','paste'].includes(tool))return;
    const color=issue?'#ff8a88':aim.join?'#6aefc9':'#ffd66d';
    if(target&&!mounting){
      const frame=propDisplayFrame(target.piece,target.support);
      drawPieceAlignment(target.alignment);
      cx.save();
      for(const a of anchorChoices(target.piece,frame)){
        const selected=a.id===anchorOrigin(target.piece);
        cx.beginPath();cx.arc(...a.point,selected?4.5:2.7,0,Math.PI*2);
        cx.fillStyle=selected?color:'#dce8f4';cx.fill();
        cx.lineWidth=1.5;cx.strokeStyle='#1b2533';cx.stroke();
      }
      cx.restore();
      return;
    }
    cx.save();cx.strokeStyle=color;cx.lineWidth=1;
    cx.setLineDash([4,5]);cx.globalAlpha=.55;
    cx.beginPath();
    cx.moveTo(...g2s(0,y));cx.lineTo(...g2s(M.w,y));
    cx.moveTo(...g2s(x,0));cx.lineTo(...g2s(x,M.h));cx.stroke();
    cx.globalAlpha=1;
    if(wallTool&&start){
      const [sx,sy]=g2s(...start);
      cx.lineWidth=2;cx.beginPath();cx.moveTo(sx,sy);cx.lineTo(px,py);cx.stroke();
      cx.setLineDash([]);cx.fillStyle=color;cx.fillRect(sx-2,sy-2,4,4);
    }
    cx.setLineDash([]);cx.lineWidth=1.5;
    const r=Math.max(2,Math.min(5,CELL*view.z*.13));
    cx.beginPath();cx.moveTo(px-r,py);cx.lineTo(px+r,py);cx.moveTo(px,py-r);cx.lineTo(px,py+r);cx.stroke();
    cx.restore();
    if(wallTool)showPlacementIssue(issue);
  }
  function wallAtScreen(p){return visibleWallAt(p)?.face.wall;}
  function thicknessInput(value,change){
    const input=el('input',{type:'number',class:'num',min:WALL_MIN_THICKNESS,max:WALL_MAX_THICKNESS,
      step:'.01',value,style:'width:76px',onchange:e=>{
        const v=e.target.valueAsNumber;
        if(!Number.isFinite(v)){input.value=value;return;}
        input.value=Math.max(WALL_MIN_THICKNESS,Math.min(WALL_MAX_THICKNESS,v));
        change(Number(input.value));
      }});
    return el('label',{},'Độ dày tường ',input,' ô');
  }
  function physicalHeightField(label,obj,key,value,max=12){
    const input=el('input',{type:'number',min:.1,max,step:.01,class:'num',value,
      'aria-label':label,style:'width:76px',onchange:()=>{
        const n=input.valueAsNumber;
        if(!Number.isFinite(n)||n<.1||n>max){input.value=value;return;}
        pushUndo();obj[key]=n;
        if(acceptStructure())after();
        draw();
      }});
    return el('label',{},label+' ',input,' ô');
  }
  function roofThicknessField(value,change){
    const label='Độ dày tấm mái';
    const input=el('input',{type:'number',min:.02,max:.8,step:.01,class:'num',value,
      'aria-label':label,style:'width:76px',onchange:()=>{
        if(!Number.isFinite(input.valueAsNumber)){input.value=value;return;}
        const thickness=roofThickness({roofThickness:input.valueAsNumber});
        input.value=thickness;
        change(thickness);
      }});
    return el('label',{},label+' ',input,' ô');
  }
  function heightInput(value,change){
    const input=el('input',{type:'number',class:'num',min:.25,max:8,step:.05,value,
      'aria-label':'Chiều cao tường',style:'width:76px',onchange:()=>{
        const n=input.valueAsNumber;
        if(!Number.isFinite(n)){input.value=value;return;}
        input.value=Math.max(.25,Math.min(8,n));change(Number(input.value));
      }});
    return el('label',{},'Chiều cao tường ',input,' ô');
  }
  function changeWallHeight(wall,height){
    if(height===wall.wallLine.height)return;
    pushUndo();wall.wallLine.height=height;if(acceptStructure())after();draw();
  }
  function changeWallThickness(wall,thickness){
    if(thickness===wallThickness(wall))return;
    const next={...wall,wallLine:{...wall.wallLine,thickness}},ctx=ruleCtx(true);
    const mounted=new Set(ctx.gates.filter(g=>g.wallId===wall.id).map(g=>g.id));
    const issue=wallIssue(next,{...ctx,objects:ctx.objects.filter(z=>!mounted.has(z.deco)),
      gates:ctx.gates.filter(g=>!mounted.has(g.id))});
    const gates=ctx.gates.filter(g=>mounted.has(g.id));
    const gateError=gates.map(g=>gateIssue(g,{...ctx,walls:ctx.walls.map(w=>w.id===wall.id?next:w)})).find(Boolean);
    if(issue||gateError){toast(issue||gateError);draw();return;}
    pushUndo();Object.assign(wall,next);if(acceptStructure())after();draw();
  }
  function removeStructure(e){return eraseEntity(e);}
  function showPlacementIssue(issue){
    const line=body.querySelector('[data-placement-rule]');
    if(!line)return;
    const message=issue||line.dataset.placementRule;
    if(line.textContent!==message)line.textContent=message;
    line.classList.toggle('brush-missing',!!issue);
  }
  function legacyRoof(value,index,width){
    const {sid,idx,f}=dec(value),sheet=sheets[sid];
    if(!sheet?.img)return null;
    const tag=constructionTile(sid,idx,0);
    if(!roofTextureDirection(tag.source,true))return null;
    const {bounds,rectangular,contact}=tileContact(sheet,idx,f);
    const roofDirection=roofTextureDirection(tag.source,rectangular);
    const x=index%width,y=Math.floor(index/width);
    return {t:'deco',id:'legacy-roof-'+x+','+y,name:tag.label,sceneLayer:3,legacyIndex:index,tile:{sid,idx},spriteBounds:bounds,
      roofSurface:true,roofDirection,placedProp:true,sc:.95,walk:true,x:x-.5,y:y-.5,
      ...propContact([],contact||{u:.5,v:1},.95,'iso')};
  }
  function propTemplate(value,layer=2){
    const {sid,idx,f}=dec(value),sheet=sheets[sid],tag=constructionTile(sid,idx,0);
    const lookup=makePaintLookup()(value);
    const {contact,bounds,rectangular}=tileContact(sheet,idx,f);
    const parts=Array.isArray(lookup)?lookup:lookup?[lookup]:[];
    const sc=/^Đá Xoáy · cổng, cột, rương/.test(sheet.name)?([3.4,1.45,1.45][idx]||1.45):
      Math.max(.75,Math.min(4,(TG.tiles[sheet.name+'#'+idx]?.sc||sheet.tw/64)*1.25));
    const propProjection=ANGQ()?'angle':ISOQ()?'iso':'top',kind=gateKind(value);
    const roofSurface=layer===3&&!!roofTextureDirection(tag.source,true);
    const roofDirection=roofSurface?roofTextureDirection(tag.source,rectangular):null;
    return {t:'deco',name:tag.label,assetSource:tag.source,tile:{sid,idx},sceneLayer:layer,roofSurface,roofDirection,bearingColumn:layer===2&&isBearingColumn(tag.label+' '+tag.source),spriteFlip:f,placedProp:true,spriteBounds:bounds,
      sc,sizeBase:sc,walk:!parts.length,estimated:parts.some(p=>p.estimated!==false),
      propProjection,buildChecks:true,gateAssembly:kind==='stone'&&parts.length===2,wallGateBrush:kind==='stone'&&parts.length===2,gateUncalibrated:!!kind&&parts.length!==2,
      ...propContact(parts,contact||{u:.5,v:1},sc,propProjection)};
  }
  function activeProp(){
    const value=stamp.tiles?.[0],asset=brushAsset(value);
    if(!M||![2,3].includes(act)||tool!=='draw'||stamp.multi||stamp.w*stamp.h!==1||!asset||asset.iso)return null;
    const size=propSizes.get(value)||100,turns=propTurns.get(value)||0,proj=M.cfg.view+'/'+M.cfg.proj;
    if(propCache?.value!==value||propCache.layer!==act||propCache.size!==size||propCache.proj!==proj||propCache.turns!==turns||propCache.asset!==asset){
      const prop=propTemplate(value,act);
      resizeProp(prop,size/100);
      for(let i=0;i<turns;i++)turnProp(prop);
      propCache={value,size,proj,prop:withAssetSource(prop,M.cfg),asset,turns,layer:act};
    }
    const prop=propCache.prop,choice=propAnchorIds.get(value)??4;
    const available=anchorChoices(prop,propDisplayFrame({...prop,x:0,y:0})).some(a=>a.id===choice);
    return {...prop,anchorId:available?choice:4,...(prop.roofDirection?{roofThickness:propThicknesses.get(value)??roofThickness(prop)}:{})};
  }
  function legacyPropAt(p,layer=2){
    if(!ISOQ()||!vis[layer])return null;
    const build=isoC||isoBuild(),pieces=layer===3?build.OV:build.GR,s=CELL*view.z;
    const size=ANGQ()?2*s:s*.95/.75,height=ANGQ()?2*s*ANG_R:size;
    for(let j=pieces.length-1;j>=0;j--){
      const g=pieces[j],base=g2s(g.xc,g.yb);
      const x0=base[0]-(g.x1-g.x0)*size/2,y0=base[1]-(g.y1-g.y0)*height;
      const x=g.x0+Math.floor((p.x-x0)/size),y=g.y0+Math.floor((p.y-y0)/height),i=y*M.w+x;
      if(x<g.x0||x>=g.x1||y<g.y0||y>=g.y1||!g.cells.includes(i))continue;
      const value=M.layers[layer][i],{sid,idx,f}=dec(value),sheet=sheets[sid];
      if(!sheet?.img)continue;
      const left=x0+(x-g.x0)*size,top=y0+(y-g.y0)*height;
      const [l,t,r,b]=tileContact(sheet,idx,f).bounds||[0,0,1,1];
      const bounds=[left+l*size,top+t*height,left+r*size,top+b*height];
      if(p.x<bounds[0]||p.y<bounds[1]||p.x>bounds[2]||p.y>bounds[3])continue;
      return {i,group:g,x0,y0,size,layer,value,bounds};
    }
    return null;
  }
  function convertLegacyProp({i,group,x0,y0,size}){
    let selected=null;
    pushUndo();
    for(const index of group.cells){
      const x=index%M.w,y=Math.floor(index/M.w),prop=propTemplate(M.layers[2][index]);
      resizeProp(prop,.95/prop.sc);
      delete prop.gateAssembly;delete prop.wallGateBrush;delete prop.gateUncalibrated;delete prop.buildChecks;
      const g=s2g(x0+(x-group.x0+.5-prop.ox)*size,y0+(y-group.y0+1-prop.oy)*size);
      M.layers[2][index]=0;
      const id=newId();
      M.ents.push({...prop,x:g.x-1,y:g.y-1,id});
      if(index===i)selected=id;
    }
    after();
    return selected;
  }
  function propPosition(p){
    const g=s2g(p.x,p.y),snap=p.snap?4:1000;
    if(!inb(g.x,g.y))return null;
    const snapAt=(v,limit)=>Math.min(limit-1/snap,Math.round(v*snap)/snap)-1;
    return {x:snapAt(g.x,M.w),y:snapAt(g.y,M.h)};
  }
  const sizePercent=e=>Math.round((e.sc||3)/(e.sizeBase||e.sc||3)*100);
  const limitSize=v=>Math.max(25,Math.min(400,v));
  function activeTransform(){return activeProp()||(tool==='obj'&&selEnt()?.placedProp?selEnt():null);}
  function editPlacedProp(e,action){
    let next=structuredClone(e);
    if(typeof action==='function')action(next);
    else if(action==='turn'){next.propProjection??=ANGQ()?'angle':ISOQ()?'iso':'top';turnProp(next);}
    else{
      const base=e.sizeBase||e.sc||3;
      next.sizeBase=base;resizeProp(next,(base*action/100)/(e.sc||3));
    }
    if(next.wallId||next.wallGateBrush){
      const mounted=mountGate(next,ruleCtx(true).walls,{distance:next.wallId ? .025 : 1.05});
      if(!mounted){toast('Cổng cần một đoạn tường đủ dài.');draw();return;}
      next=mounted;
    }
    const issue=constructionIssue(next,true);
    if(issue){toast(issue);draw();return;}
    pushUndo();Object.assign(e,next);if(acceptStructure())after();draw();
  }
  function transformProp(action){
    const prop=activeProp();
    if(prop){
      const value=stamp.tiles[0];
      if(action==='turn'){
        const turns=((propTurns.get(value)||0)+1)%(prop.roofDirection?4:2);
        if(turns)propTurns.set(value,turns);else propTurns.delete(value);
      }
      else propSizes.set(value,limitSize((propSizes.get(value)||100)+action));
      const size=body.querySelector('[aria-label="Kích thước vật thể (%)"]');
      if(size)size.value=propSizes.get(value)||100;
      const toggle=body.querySelector('[data-prop-turn]');
      if(toggle)toggle.setAttribute('aria-pressed',String(propTurns.has(value)));
      refreshAnchorPicker();
      dirty=true;
      return;
    }
    const selected=selEnt();
    if(tool==='obj'&&selected?.placedProp)
      editPlacedProp(selected,action==='turn'?action:limitSize(sizePercent(selected)+action));
  }
  function propSizeField(percent,change){
    const set=v=>{const n=limitSize(v);input.value=n;change(n);};
    const input=el('input',{type:'number',class:'num',min:25,max:400,step:1,value:percent,
      style:'width:70px','aria-label':'Kích thước vật thể (%)',onchange:()=>set(input.valueAsNumber||percent)});
    return el('div',{class:'row'},el('label',{},'Kích thước ',input,' %'),
      btn('−',()=>set((input.valueAsNumber||percent)-10)),btn('+',()=>set((input.valueAsNumber||percent)+10)),
      btn('100%',()=>set(100)));
  }
  function selectBuildMaterial(value,layer){
    if(!brushAsset(value))return;
    stamp={w:1,h:1,multi:false,tiles:[value]};
    act=layer;pickAndDraw=false;
    if(!brushTools.includes(tool)||gateKind(value))tool='draw';wallChain=null;
    draw();dirty=true;cv.focus({preventScroll:true});
  }
  function materialButton({value,label},layer){
    const stone=stonePhase(value,layer),current=stamp.tiles?.[0],atlas=brushAsset(value);
    const selected=!stamp.multi&&act===layer&&(stone===null?current===value:activePhase()===stone);
    const swatch=el('canvas',{width:56,height:56,'aria-hidden':'true'});
    const g=swatch.getContext('2d');g.imageSmoothingEnabled=false;
    if(stone===null)drawTile(g,value,0,0,56);
    else for(let y=0;y<2;y++)for(let x=0;x<2;x++)drawTile(g,enc(stone,x+2*y),x*28,y*28,28);
    return el('button',{type:'button',class:'build-material','data-tile':value,'aria-label':label,
      title:label+' · '+atlas.name,'aria-pressed':String(selected),onclick:()=>selectBuildMaterial(value,layer)},
      swatch,el('span',{},label));
  }
  let eraseQuery='';
  function erasePanel(){
    const scope=eraseScope(),labels=[...layerNames,'Đối tượng'];
    const list=el('div',{class:'erase-items'});
    const button=el('button',{type:'button',class:'b erase-confirm',onclick:()=>{
      const target=M.ents.find(e=>e.id===eraseSelected&&sceneEntityLayer(e)===scope);
      if(target)eraseEntity(target);
    }},'Xóa mục đã chọn');
    function refresh(){
      const term=normSearch(eraseQuery),matching=M.ents.filter(e=>sceneEntityLayer(e)===scope&&
        normSearch(entityName(e)).includes(term));
      list.replaceChildren(...matching.slice(0,100).map(e=>{
        const offset=e.placedProp?1:.5,x=e.x+offset,y=e.y+offset;
        return el('button',{type:'button','aria-pressed':String(e.id===eraseSelected),onclick:()=>{
          eraseSelected=e.id;hov=null;
          const [px,py]=g2s(x,y);view.x+=cv.clientWidth/2-px;view.y+=cv.clientHeight/2-py;
          dirty=true;refresh();
        }},el('strong',{},entityName(e)),el('small',{},e.t==='start'?'Được bảo vệ':xy([x,y])));
      }));
      if(!matching.length)list.append(el('p',{class:'hint'},term?'Không tìm thấy mục theo tên.':'Không có mục riêng trong nhóm này.'));
      if(matching.length>100)list.append(el('p',{class:'hint'},'Đang hiện 100 / '+matching.length+' mục. Tìm theo tên để thu hẹp.'));
      button.disabled=!matching.some(e=>e.id===eraseSelected&&e.t!=='start');
    }
    const panel=el('section',{class:'build-palette','aria-label':'Xóa theo nhóm'},
      el('div',{class:'build-heading'},el('h2',{},'Xóa theo nhóm')),
      el('div',{class:'build-categories erase-categories',role:'group','aria-label':'Nhóm cần xóa'},
        labels.map((name,i)=>el('button',{type:'button','aria-pressed':String(i===scope),onclick:()=>{
          eraseQuery='';eraseSelected=null;
          if(i===5){eraseActors=true;draw();dirty=true;}else useLayer(i);
        }},name))),
      el('p',{class:'hint'},scope===0||scope===1||scope===4?'Bấm hoặc kéo trên bản đồ để xóa ô thuộc nhóm đang chọn.':
        'Rê để thấy tên và khung đỏ. Bấm trên bản đồ để xóa một mục hoặc chọn theo tên bên dưới.'));
    if(scope!==0&&scope!==4){
      panel.append(el('input',{type:'search',class:'num',placeholder:'Tìm mục theo tên','aria-label':'Tìm mục để xóa',
        value:eraseQuery,oninput:e=>{eraseQuery=e.target.value;refresh();}}),list,button);
      refresh();
    }
    return panel;
  }
  function anchorPicker(prop,value){
    const available=new Set(anchorChoices(prop,propDisplayFrame({...prop,x:0,y:0})).map(p=>p.id));
    const title=el('span',{class:'hint'},'Điểm neo · '+placementAnchorNames[anchorOrigin(prop)]);
    const buttons=placementAnchorNames.map((name,id)=>el('button',{
      type:'button',class:'b placement-anchor-button',title:name,'aria-label':name,'aria-pressed':String(id===anchorOrigin(prop)),
      ...(available.has(id)?{}:{disabled:''}),onclick:()=>{
        propAnchorIds.set(value,id);
        title.textContent='Điểm neo · '+name;
        buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===id)));
        dirty=true;
      }},id===4?'●':'○'));
    return el('div',{class:'row','data-anchor-picker':'',style:'align-items:center'},el('div',{
      role:'group','aria-label':'Điểm neo khi đặt',style:'display:grid;grid-template-columns:repeat(3,30px);gap:3px'
    },buttons),title);
  }
  function refreshAnchorPicker(){
    const current=body.querySelector('[data-anchor-picker]'),prop=activeProp();
    if(current&&prop)current.replaceWith(anchorPicker(prop,stamp.tiles[0]));
  }
  function buildPalette(){
    const scope=allBuildImages?'all':act,layer=act,panel=el('section',{class:'build-palette','aria-label':'Chọn mảnh để đặt'});
    const categoryBar=el('div',{class:'build-categories',role:'group','aria-label':'Lớp dựng cảnh'},
      LAYN.map((label,i)=>el('button',{type:'button','aria-pressed':String(!allBuildImages&&i===layer),onclick:()=>{
        if(!allBuildImages&&i===layer)return;allBuildImages=false;buildQuery='';useLayer(i);
      }},label)));
    const current=stamp.tiles?.[0],asset=brushAsset(current);
    const chosen=hasBrush()?(stamp.multi||stamp.w*stamp.h>1?'Cụm '+stamp.w+' × '+stamp.h+' ô':
      asset?constructionTile(dec(current).sid,dec(current).idx,0).label:'Đã chọn mảnh'):'Chọn một mảnh bên dưới';
    const prop=activeProp();
    const advice=tool==='wall'?'Bấm từng góc hoặc kéo một đoạn. Giữ Alt để đặt trên nền phía sau tường. Enter hoặc Esc để kết thúc.':prop?'Shift bám ¼ ô · Shift + cuộn đổi cỡ · Alt + cuộn đổi hướng.':hasBrush()?tool==='rect'?'Kéo một khung trên bản đồ.':
      tool==='fill'?'Bấm vào vùng liền muốn thay.':'Bấm để đặt một mảnh hoặc kéo để đặt một dãy.':
      'Chọn mảnh, rồi bấm vị trí trên bản đồ.';
    panel.append(el('div',{class:'build-heading'},el('h2',{},'Dựng cảnh'),btn(showPieceNames?'Ẩn tên trên bản đồ':'Hiện tên trên bản đồ',()=>{
      showPieceNames=!showPieceNames;lsSet('thk_piece_names',showPieceNames);dirty=true;draw();
    }),btn('Quản lý gói ảnh',()=>chooseTab('res')),btn('Nhập ZIP/RAR',chooseArchiveFiles)),
      el('div',{class:'row'},btn('Dựng tuyến tường · W',()=>useTool('wall'),tool==='wall'?'on':''),
        btn('Lắp cổng vào tường',chooseGateBrush),
        tool==='wall'&&wallChain?btn('Kết thúc tuyến',()=>{wallChain=null;dirty=true;draw();}):null),
      categoryBar,el('div',{class:'row'},btn('Tất cả ảnh',()=>{allBuildImages=!allBuildImages;buildQuery='';draw();},allBuildImages?'on':'')),el('div',{class:'build-selection',role:'status'},el('strong',{},tool==='wall'?'Dựng tường':chosen),el('span',{},advice)));
    if(tool==='wall')panel.append(el('div',{class:'row'},thicknessInput(buildThickness,v=>{buildThickness=v;dirty=true;}),heightInput(buildHeight,v=>{buildHeight=v;dirty=true;})),el('p',{class:'hint','data-placement-rule':'',role:'status'}));
    if(prop){
      const note=isRoof(prop)?'Đặt mái sao cho hai phía tựa lên đỉnh tường hoặc cột. Dấu xanh hiện điểm tựa hợp lệ.':prop.gateAssembly?'Rê cổng lên đoạn tường bao hoặc tuyến tường thẳng. Xưởng mở khoảng giữa hai trụ.':
        prop.gateUncalibrated?constructionIssue(prop):'';
      if(prop.roofDirection)panel.append(roofThicknessField(roofThickness(prop),value=>{
        propThicknesses.set(current,value);
        dirty=true;
      }));
      panel.append(propSizeField(propSizes.get(current)||100,n=>{propSizes.set(current,n);refreshAnchorPicker();dirty=true;}),
        el('div',{class:'row'},el('button',{class:'b',type:'button','data-prop-turn':'','aria-pressed':String(propTurns.has(current)),
          onclick:()=>{transformProp('turn');cv.focus({preventScroll:true});}},'Đổi hướng · R')),
        anchorMode(prop)==='gate'?null:anchorPicker(prop,current),
        anchorMode(prop)==='gate'?null:el('label',{class:'row'},el('input',{
          type:'checkbox',...(snapPieces?{checked:''}:{}),onchange:e=>{snapPieces=e.target.checked;dirty=true;}
        }),'Bám mép / góc'),
        el('div',{class:'hint','data-placement-rule':note,role:'status'},note));
    }
    const ids=visibleBuildSheets(scope),groups=new Map();
    for(const id of ids){const cards=materialCards(scope,id);if(cards.length)groups.set(id,cards);}
    let source=buildSources.get(scope)??'all',page=buildPages.get(scope)||0;
    if(source!=='all'&&!groups.has(source))source='all';
    const results=el('div',{class:'build-results'});
    const packs=customPackRecords().filter(({id,vat})=>(allBuildImages||layer!==0)&&vat.items?.some(item=>
      allBuildImages||(item.role==='Mái/cửa'?3:item.role==='Phủ nền'?1:2)===layer)&&!groups.has(sheets.findIndex(s=>s.name==='Vat-'+id)));
    const browser=el('select',{class:'sheet-set','aria-label':'Bộ tài nguyên dựng cảnh',onchange:async e=>{
      const value=e.target.value;
      if(value.startsWith('pack:')){
        browser.disabled=true;
        try{
          await ensureVat(value.slice(5));
          const id=sheets.findIndex(sheet=>sheet.name==='Vat-'+value.slice(5));
          if(id>=0)buildSources.set(scope,id);
          buildPages.set(scope,0);draw();
        }catch(error){browser.disabled=false;browser.value=String(source);toast('Chưa mở được bộ tài nguyên: '+error.message);}
        return;
      }
      source=value==='all'?'all':Number(value);buildSources.set(scope,source);buildPages.set(scope,0);page=0;renderCards();
    }},el('option',{value:'all'},'Mọi bộ tài nguyên'),
      [...groups.keys()].map(id=>el('option',{value:id},sheets[id].name)),
      packs.length?el('optgroup',{label:'Gói Xưởng đã nhập'},packs.map(({id,vat})=>el('option',{value:'pack:'+id},vat.name))):null);
    browser.value=String(source);browser.disabled=!groups.size&&!packs.length;
    const query=el('input',{type:'search',class:'build-search',placeholder:'Tìm mảnh…','aria-label':'Tìm mảnh dựng cảnh',
      value:buildQuery,oninput:e=>{buildQuery=e.target.value;buildPages.set(scope,0);page=0;renderCards();}});
    query.disabled=!groups.size;
    const pavingButton=layer===0&&!allBuildImages?btn('Mẫu đá tự khớp mạch',async()=>{
      pavingButton.disabled=true;
      try{
        const sid=await installStonePaving();
        buildSources.set(0,sid);buildPages.set(0,0);buildQuery='';draw();
      }catch(error){pavingButton.disabled=false;toast(error.message);}
    }):null;
    panel.append(el('div',{class:'build-filters'},browser,query),
      ...(pavingButton?[pavingButton]:[]),results,
      el('details',{...(buildOptionsOpen?{open:''}:{}),ontoggle:e=>{buildOptionsOpen=e.currentTarget.open;}},el('summary',{},'Cách đặt và tùy chọn'),
        el('div',{class:'row'},
          btn('Từng mảnh · B',()=>useTool('draw'),tool==='draw'?'on':''),
          btn('Theo khung · R',()=>useTool('rect'),tool==='rect'?'on':''),
          btn('Thay vùng liền · U',()=>useTool('fill'),tool==='fill'?'on':''),
          btn('Lấy mẫu · I',()=>{useTool('pick');pickAndDraw=true;}),
          ...(hasBrush()?[btn('Lật ngang',()=>{flipStamp();draw();})]:[]),
          ...(activePhase()!==null?[btn('Căn lại mạch đá',fixStoneSeams)]:[]),
          btn('Bảng ghép ô',()=>chooseTab('sheet')),btn('Nhập ảnh rời',addSheet))));
    renderCards();
    return panel;

    function renderCards(){
      const term=normSearch(buildQuery);
      const scoped=source==='all'?[...groups.values()]:[groups.get(source)||[]];
      const cards=scoped.flat().filter(card=>{
        const d=dec(card.value),details=constructionTile(d.sid,d.idx,0);
        return normSearch(card.label+' '+details.source+' '+sheets[d.sid].name).includes(term);
      });
      results.replaceChildren();
      if(!cards.length){
        results.append(el('p',{class:'hint'},groups.size?'Không tìm thấy mảnh phù hợp.':'Lớp này chưa có mảnh. Bạn có thể nhập ảnh hoặc chọn lớp khác.'));
        return;
      }
      page=Math.min(page,Math.ceil(cards.length/buildPageSize)-1);
      const start=page*buildPageSize;
      results.append(el('div',{class:'build-materials'},cards.slice(start,start+buildPageSize).map(card=>materialButton(card,card.layer))));
      if(cards.length>buildPageSize)results.append(el('div',{class:'row build-pages'},
        el('button',{type:'button',class:'b',...(page?{}:{disabled:''}),onclick:()=>{buildPages.set(scope,--page);renderCards();}},'Trước'),
        el('span',{class:'lbl'},(start+1)+'–'+Math.min(start+buildPageSize,cards.length)+' / '+cards.length+' mảnh'),
        el('button',{type:'button',class:'b',...(start+buildPageSize<cards.length?{}:{disabled:''}),onclick:()=>{buildPages.set(scope,++page);renderCards();}},'Sau')));
    }
  }
  function drawGuides(){
    if(tab==='tools'&&tool==='erase')return [];
    if(tab==='tools'&&brushTools.includes(tool)&&act<4)return [];
    if(tab==='sheet')return [el('p',{class:'sheet-next'},'Chọn một mảnh hoặc kéo chọn một cụm trên bảng ảnh, rồi bấm vị trí đặt trên bản đồ.')];
    const guide=guideFor('2d',tab==='tools'?tool:tab);
    return guide?[guide]:[];
  }
  let inventoryGroup='',inventoryId='',inventoryMoving=false,inventoryItem=null,inventoryQuery='',inventoryPage=0;

  const inventoryLayers=[['all','Tất cả'],['floor','Nền'],['overlay','Phủ nền'],['prop','Vật dụng'],
    ['house','Nhà'],['roof','Mái / cửa'],['wall','Tường'],['animated','Animation/Animated'],['actors','Đối tượng']];
  let inventoryLayer='all',inventorySnap=false,inventoryLightDrag=true;
  function inventoryLayerOf(e){
    if(e.anim)return 'animated';
    return e.wallLine?'wall':e.t==='deco'?arrangementLayer({...e,sceneLayer:e.sceneLayer??sceneEntityLayer(e)}):'actors';
  }
  const inInventoryLayer=e=>inventoryLayer==='all'||inventoryLayerOf(e)===inventoryLayer;
  function inventoryKey(e){
    if(e.wallLine)return 'wall';
    return [e.t,sceneEntityLayer(e),e.roofDirection?'board':'',e.tile?.sid??'',e.tile?.idx??''].join(':');
  }
  function inventoryGroups(){
    const groups=new Map();
    const add=(e,cell)=>{
      if(!inInventoryLayer(e))return;
      const key=inventoryKey(e);
      if(!groups.has(key))groups.set(key,{key,label:entityName(e),items:[]});
      groups.get(key).items.push({id:e.id,e,cell});
    };
    for(const e of M.ents)add(e);
    for(const layer of [2,3])M.layers[layer].forEach((value,index)=>{
      if(!value)return;
      const roof=layer===3&&legacyRoof(value,index,M.w);
      const {sid,idx}=dec(value);
      add(roof||{id:'paint:'+layer+':'+index,t:'deco',sceneLayer:layer,tile:{sid,idx},
        x:index%M.w,y:Math.floor(index/M.w)}, {layer,index,value});
    });
    return [...groups.values()].sort((a,b)=>a.label.localeCompare(b.label,'vi'));
  }
  function inventoryPoint(e){
    const offset=e.placedProp?1:0;
    return [e.x+offset,e.y+offset];
  }
  function inventoryOutline(item){
    const {e,cell}=item;
    if(e.wallLine){
      const [x,y]=inventoryPoint(e),{dx,dy,height}=e.wallLine;
      const shape=wallSurface({a:[x,y],b:[x+dx,y+dy],height:height??1.25,near:true,thickness:wallThickness(e)},g2s,CELL*view.z,null);
      if(shape){
        const points=[...shape.front,...shape.back];
        return convexOutline([...points,...points.map(([x,y])=>[x,y-shape.high])]);
      }
    }
    if(e.placedProp&&e.tile){
      const frame=propDisplayFrame(e,isRoof(e)?roofBearing(e,ruleCtx()):null);
      if(frame.roof){
        const [a,b,c]=frame.roof,d=[b[0]+c[0]-a[0],b[1]+c[1]-a[1]];
        return convexOutline([a,b,c,d,...frame.roofSides.flatMap(([p,q])=>[p,q].map(([x,y])=>[x,y+frame.roofDepth]))]);
      }
      return boxOutline(placedPropBounds(frame,e.spriteBounds||[0,0,1,1]));
    }
    if(cell&&ISOQ()){
      const build=isoC||isoBuild(),parts=cell.layer===3?build.OV:build.GR;
      const part=parts.find(g=>g.cells.includes(cell.index));
      if(part){
        const [x,y]=g2s(part.xc,part.yb),s=CELL*view.z;
        const w=ANGQ()?2*s:s*.95/.75,h=ANGQ()?w*ANG_R:w;
        const left=x+(e.x-(part.x0+part.x1)/2)*w,top=y+(e.y-part.y1)*h;
        const {sid,idx,f}=dec(cell.value),sheet=sheets[sid];
        const [l,t,r,b]=sheet?.img?tileContact(sheet,idx,f).bounds||[0,0,1,1]:[0,0,1,1];
        return boxOutline([left+l*w,top+t*h,left+r*w,top+b*h]);
      }
    }
    const hit=isoHB.find(q=>q.e.id===e.id);
    if(hit)return boxOutline(hit.r);
    const [x,y]=inventoryPoint(e);
    return [[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([gx,gy])=>g2s(gx,gy));
  }
  function convexOutline(points){
    const sorted=points.slice().sort(([x,y],[u,v])=>x-u||y-v);
    const half=input=>{
      const edge=[];
      for(const p of input){
        while(edge.length>=2){
          const [a,b]=edge.slice(-2);
          if((b[0]-a[0])*(p[1]-b[1])-(b[1]-a[1])*(p[0]-b[0])>0)break;
          edge.pop();
        }
        edge.push(p);
      }
      return edge.slice(0,-1);
    };
    return [...half(sorted),...half(sorted.reverse())];
  }
  const boxOutline=([l,t,r,b])=>[[l,t],[r,t],[r,b],[l,b]];
  function outlineContains(points,{x,y}){
    return points.every(([a,b],i)=>{
      const [u,v]=points[(i+1)%points.length];
      return (u-a)*(y-b)-(v-b)*(x-a)>=-.0001;
    });
  }
  function centerInventory(item){
    const points=inventoryOutline(item),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    view.x+=(cv.clientWidth-Math.min(...xs)-Math.max(...xs))/2;
    view.y+=(cv.clientHeight-Math.min(...ys)-Math.max(...ys))/2;
  }
  function drawInventoryFocus(width,height){
    const gesture=drag?.inventory&&drag.moved&&drag.item&&lastPt?drag:null;
    const item=gesture?.item||inventoryItem;
    const parts=item?propGroup(M.ents,item.e):[];
    const offset=gesture?inventoryDragPoint(gesture,lastPt).map((v,i)=>v-inventoryPoint(item.e)[i]):[0,0];
    const candidates=item?parts.map(part=>({...part,x:part.x+offset[0],y:part.y+offset[1]})):null;
    const arrange=canArrangeProp(item?.e||{});
    if(gesture&&!inventoryLightDrag&&arrange){
      for(const piece of candidates)if(piece.tile&&piece.placedProp)drawIndependentProp(piece,true);
    }
    if(ISOQ()&&lastPt&&hov&&!drag?.pan){
      const geo=arrange?outline2D(M.cfg.outline,ANGQ(),M.ents):null;
      const walls=arrange?[...(geo?.walls||[]),...builtWallFaces(M.ents,ANGQ())]:[];
      const wallEdges=walls.flatMap(wall=>{
        const shape=wallSurface(wall,(x,y)=>[x,y],1,geo);
        return shape?.high>0?[shape.front,shape.back]:[];
      });
      drawAssemblyGuides(cx,{width,height,project:g2s,pointer:[lastPt.x,lastPt.y],
        parts:arrange?candidates:null,entities:M.ents,wallEdges});
    }
    if(!item)return;
    const feet=(candidates||parts).flatMap(inventoryFootprint);
    const bounds=inventoryFootBounds(feet);
    cx.save();
    cx.lineWidth=2;cx.strokeStyle='#ffd879';cx.fillStyle='#ffd87948';
    for(const zone of feet){zPath(cx,zone,g2s);cx.fill();cx.stroke();}
    drawBaseAnchorPoints(baseAnchorPoints(bounds),4,'#ffd879');
    cx.restore();
  }
  function actorFoot(x,y,scale=1){
    const radius=.18*scale;
    return {k:'ell',x:x-radius,y:y-radius,w:2*radius,h:2*radius};
  }
  function inventoryFootprint(e){
    if(e.t==='deco')return propFootprint(withAssetSource(e,M.cfg));
    const scale=e.visualScale??1,set=M.cfg.anims?.find(set=>set.id===e.anim);
    return [actorFoot(e.x+.5,e.y+.5,scale*(set?.visualScale??1))];
  }
  function drawBaseAnchorPoints(points,active,color){
    points.forEach(([x,y],i)=>{
      const [px,py]=g2s(x,y);
      cx.beginPath();cx.arc(px,py,i===active?4:3,0,2*Math.PI);
      cx.fillStyle=i===active?color:'#243340';cx.fill();
      cx.lineWidth=1.25;cx.strokeStyle=i===active?'#243340':color;cx.stroke();
    });
  }
  function inventoryFootBounds(zones){
    const bounds=zones.map(zBounds);
    return [Math.min(...bounds.map(b=>b[0])),Math.min(...bounds.map(b=>b[1])),
      Math.max(...bounds.map(b=>b[2])),Math.max(...bounds.map(b=>b[3]))];
  }

  function inventoryClick(p){
    if(inventoryMoving&&inventoryItem){
      const raw=s2g(p.x,p.y);
      const wallHit=inventoryItem.e.wallId?visibleWallAt(p):null;
      const point=wallHit?.point||(inventorySnap&&inventoryItem.e.placedProp?[Math.floor(raw.x)+.5,Math.floor(raw.y)+.5]:[raw.x,raw.y]);
      moveInventory(inventoryItem,...point,inventoryMoving==='copy');
      return;
    }
    const item=inventoryHit(p);
    if(item)selectInventory(item);
  }
  function selectInventory(item){
    inventoryGroup=inventoryKey(item.e);inventoryId=item.id;inventoryQuery='';draw();dirty=true;
  }
  function inventoryDragPoint(gesture,p){
    const start=s2g(gesture.p.x,gesture.p.y),end=s2g(p.x,p.y);
    const [x,y]=inventoryPoint(gesture.item.e);
    const at=[x+end.x-start.x,y+end.y-start.y];
    return inventorySnap&&gesture.item.e.placedProp?at.map(v=>Math.floor(v)+.5):at;
  }
  function inventoryHit(p){
    const items=inventoryGroups().flatMap(group=>group.items);
    const ids=new Map(items.map(item=>[item.id,item]));
    let chosen;
    for(let i=isoHB.length-1;i>=0;i--){
      const {e,r}=isoHB[i],item=ids.get(e.id);
      if(!item||p.x<r[0]||p.y<r[1]||p.x>r[2]||p.y>r[3])continue;
      if(outlineContains(inventoryOutline(item),p)){chosen=item;break;}
    }
    return chosen||ids.get(wallAtScreen(p)?.id)||
      [3,2].map(layer=>legacyPropAt(p,layer)).filter(Boolean)
        .map(tile=>items.find(item=>item.cell?.layer===tile.layer&&item.cell.index===tile.i)).find(Boolean);
  }
  function commitInventory(next){
    const issue=structureError(M,next);
    if(issue){toast(issue);return false;}
    pushUndo();M=next;isoK='';after();return true;
  }
  function readInventoryPiece(map,item){
    if(!item.cell)return map.ents.find(e=>e.id===item.id);
    const {legacyIndex,...piece}=item.e;
    map.layers[item.cell.layer][item.cell.index]=0;
    map.ents.push(piece);
    return piece;
  }
  function resizeInventory(item,scale){
    if(!Number.isFinite(scale)||scale<.1||scale>4)return;
    const next=clone(M),source=readInventoryPiece(next,item);
    if(!source)return;
    const group=propGroup(next.ents,source),factor=scale/(source.visualScale??1);
    const [l,t,r,b]=inventoryFootBounds(group.flatMap(inventoryFootprint));
    const x=(l+r)/2,y=(t+b)/2;
    for(const piece of group){
      if(piece.t==='deco'){
        Object.assign(piece,scaleProp(piece,factor,x,y),{placedProp:true});
      }
      piece.visualScale=scale;
    }
    if(commitInventory(next)){inventoryId=source.id;dirty=true;draw();}
  }
  function moveInventory(item,x,y,copy=false){
    if(!Number.isFinite(x)||!Number.isFinite(y)||!inb(x,y)){toast('Chọn tọa độ trong bản đồ.');return;}
    const {e,cell}=item;
    const precise=e.placedProp||e.anim||canArrangeProp(e)&&!cell;
    const anchor=e.placedProp?1:0;
    const position=value=>precise?value-anchor:Math.floor(value);
    const nx=position(x),ny=position(y);
    if(e.x===nx&&e.y===ny){inventoryMoving=false;draw();dirty=true;return;}
    const next=clone(M);
    let id=item.id;
    const group=propGroup(M.ents,e);
    if(group.length>1){
      const parts=transformPropGroup(group,e,{x:nx,y:ny});
      if(!replaceInventoryGroup(next,parts,copy))return;
      if(copy)id=parts.find((_,i)=>group[i].id===e.id).id;
    }else if(cell&&!e.placedProp){
      const tiles=next.layers[cell.layer],index=ny*M.w+nx;
      if(tiles[index]){toast('Ô đích đã có một mảnh cùng lớp.');return;}
      if(!copy)tiles[cell.index]=0;tiles[index]=cell.value;id='paint:'+cell.layer+':'+index;
    }else{
      const piece=copy?{...structuredClone(e),id:newId()}:readInventoryPiece(next,item);
      if(copy){delete piece.legacyIndex;next.ents.push(piece);id=piece.id;}
      if(e.wallLine&&M.ents.some(q=>q.wallId===e.id)){
        toast('Tuyến tường đang gắn cổng. Hãy tháo cổng trước khi di chuyển.');return;
      }
      Object.assign(piece,{x:nx,y:ny});
      if(piece.wallId||piece.wallGateBrush){
        const mounted=mountGate(piece,ruleCtx().walls,{only:null});
        if(!mounted){toast('Chọn đoạn tường đủ dài để lắp cổng.');return;}
        Object.assign(piece,mounted);
      }
      const issue=piece.wallLine?wallIssue(piece,ruleCtx()):stackedPropIssue(piece)||constructionIssue(piece,true);
      if(issue){toast(issue);return;}
    }
    if(!commitInventory(next))return;
    inventoryId=id;inventoryMoving=false;draw();
  }
  function replaceInventoryGroup(next,parts,copy){
    if(parts.some(part=>!inb(...inventoryPoint(part)))){
      toast('Các phần của vật phải nằm trong bản đồ.');return false;
    }
    if(copy){
      const arrangementGroup=newId();
      for(const part of parts){part.id=newId();part.arrangementGroup=arrangementGroup;}
      next.ents.push(...parts);
    }else{
      const replacements=new Map(parts.map(part=>[part.id,part]));
      next.ents=next.ents.map(part=>replacements.get(part.id)||part);
    }
    return true;
  }
  function removeInventory(item){
    const group=propGroup(M.ents,item.e);
    if(group.length>1){
      const ids=new Set(group.map(part=>part.id)),next=clone(M);
      next.ents=next.ents.filter(part=>!ids.has(part.id));
      if(!commitInventory(next))return;
    }else if(item.cell){
      const next=clone(M);
      next.layers[item.cell.layer][item.cell.index]=0;
      if(!commitInventory(next))return;
    }else if(!eraseEntity(item.e))return;
    inventoryId='';inventoryMoving=false;draw();dirty=true;
  }
  function bulkBoardThickness(items,value){
    const thickness=roofThickness({roofThickness:value});
    const next=clone(M);
    for(const item of items)readInventoryPiece(next,item).roofThickness=thickness;
    if(commitInventory(next)){
      toast('Đã chỉnh độ dày '+items.length+' tấm ván.');
      draw();
    }
  }
  function inventoryCanCopy({e}){return canArrangeProp(e)||e.t==='deco'&&!e.wallLine&&!e.wallId&&!e.gateAssembly&&!e.housePart;}
  function startInventoryAction(mode){
    inventoryMoving=inventoryMoving===mode?false:mode;
    draw();dirty=true;cv.focus({preventScroll:true});
  }
  function openInventoryCopy(item){
    const source=item.e,originals=propGroup(M.ents,source).map(e=>withAssetSource(e,M.cfg)),map=M;
    const dialog=el('dialog',{class:'scene-copy-dialog',style:'background:#192834;color:#fff;border:1px solid #567180;border-radius:10px;padding:18px'});
    const count=el('input',{type:'number',min:1,max:1000,value:1,required:''});
    const gap=el('input',{type:'number',min:0,max:600,step:.01,value:1,required:''});
    const directions=[['↑','Bắc',0,-1,2,1],['←','Tây',-1,0,1,2],['→','Đông',1,0,3,2],['↓','Nam',0,1,2,3]];
    const chosen=new Set();
    const message=el('p',{class:'hint',role:'status'});
    const grid=el('div',{style:'display:grid;grid-template:repeat(3,36px)/repeat(3,42px);gap:4px;margin:10px 0'},
      el('span',{style:'grid-area:2 / 2;display:grid;place-items:center'},'Gốc'));
    for(const direction of directions){
      const [arrow,label,,,column,row]=direction;
      const button=el('button',{type:'button',class:'b','aria-label':label,'aria-pressed':'false',onclick:()=>{
        if(chosen.has(direction))chosen.delete(direction);else chosen.add(direction);
        button.classList.toggle('on',chosen.has(direction));
        button.setAttribute('aria-pressed',String(chosen.has(direction)));
        message.textContent='';
      }},arrow);
      button.style.gridArea=row+' / '+column;grid.append(button);
    }
    const form=el('form',{},el('strong',{},'Nhân bản · '+entityName(source)),
      el('p',{},el('label',{},'Số bản sao mỗi hướng ',count)),
      el('p',{},el('label',{},'Khoảng hở giữa các chân vật (ô) ',gap)),grid,message,
      el('div',{class:'row'},el('button',{class:'b',type:'submit'},'Thực hiện'),
        el('button',{class:'b',type:'button',onclick:()=>dialog.close()},'Hủy')));
    form.onsubmit=event=>{
      event.preventDefault();
      if(!chosen.size){message.textContent='Chọn ít nhất một hướng.';return;}
      if(M!==map){message.textContent='Bản đồ đã thay đổi. Hãy mở lại hộp nhân bản.';return;}
      const next=clone(M);
      const staging={M:next,placementZones:currentPaintZones()};
      const [l,t,r,b]=inventoryFootBounds(originals.flatMap(propFootprint));
      const stopped=[];
      let total=0;
      for(const direction of directions){
        if(!chosen.has(direction))continue;
        const [,label,dx,dy]=direction,step=(dx?r-l:b-t)+gap.valueAsNumber+.0001;
        let previous=originals;
        const samples=Math.max(1,Math.ceil(step/.25));
        const at=distance=>transformPropGroup(originals,source,{x:source.x+dx*distance,y:source.y+dy*distance});
        const blocked=(parts,ignore)=>parts.some(part=>!inb(...inventoryPoint(part))||propPlacement(staging,part,ignore));
        for(let i=1;i<=count.valueAsNumber;i++){
          const ignore=new Set(previous.map(part=>part.id));
          let clear=true;
          for(let j=1;j<samples&&clear;j++)clear=!blocked(at(step*(i-1+j/samples)),ignore);
          const parts=at(step*i);
          if(!clear||blocked(parts,new Set())){
            stopped.push(label);break;
          }
          replaceInventoryGroup(next,parts,true);
          previous=parts;total++;
        }
      }
      if(!total){message.textContent='Không có chỗ đặt bản sao theo hướng đã chọn.';return;}
      if(!commitInventory(next)){message.textContent='Không thể đặt bản sao tại vị trí đã chọn.';return;}
      inventoryMoving=false;draw();dialog.close();
      toast('Đã đặt '+total+' bản sao.'+(stopped.length?' Dừng ở hướng '+stopped.join(', ')+'.':''));
    };
    dialog.append(form);
    dialog.addEventListener('close',()=>{dialog.remove();cv.focus({preventScroll:true});},{once:true});
    document.body.append(dialog);dialog.showModal();count.select();
  }
  function inventoryShortcut(key,event){
    if(event.altKey)return false;
    if((event.ctrlKey||event.metaKey)&&key!=='d')return false;
    if(key==='+'||key==='='||key==='-'||key==='−'){
      zoomBy(key==='+'||key==='='?1.25:1/1.25);updateDesktop();return true;
    }
    if(key==='0'){fit();return true;}
    if(key==='g'){if(!event.repeat){inventorySnap=!inventorySnap;draw();}return true;}
    if(key==='escape'&&(inventoryMoving||inventoryId)){
      if(!inventoryMoving)inventoryGroup=inventoryId='';
      inventoryMoving=false;draw();dirty=true;return true;
    }
    const item=inventoryItem;
    if(!item)return false;
    if(key==='delete'){if(!event.repeat&&item.e.t!=='start')removeInventory(item);return true;}
    if(key==='d'){if(!event.repeat&&inventoryCanCopy(item))openInventoryCopy(item);return true;}
    if(key==='m'){if(!event.repeat)startInventoryAction('move');return true;}
    if(key==='enter'){if(!event.repeat)body.querySelector('.inventory-controls input')?.focus();return true;}
    const group=propGroup(M.ents,item.e);
    if(key==='r'&&group.length>1){
      if(!event.repeat){
        const next=clone(M),parts=transformPropGroup(group,item.e,item.e,true);
        if(replaceInventoryGroup(next,parts,false)&&commitInventory(next))draw();
      }
      return true;
    }
    if((key==='r'||key==='t')&&item.e.placedProp&&inventoryCanCopy(item)){
      if(!event.repeat){
        const next=clone(M),piece=readInventoryPiece(next,item);
        piece.propProjection??=ANGQ()?'angle':ISOQ()?'iso':'top';
        turnProp(piece);
        if(commitInventory(next)){inventoryGroup=inventoryKey(piece);draw();}
      }
      return true;
    }
    const delta={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[key];
    if(!delta)return false;
    if(event.shiftKey){view.x-=delta[0]*45;view.y-=delta[1]*45;dirty=true;return true;}
    const [x,y]=inventoryPoint(item.e);
    const precise=item.e.placedProp||canArrangeProp(item.e)&&!item.cell;
    const axis=delta[0]?0:1,sign=delta[axis];
    let step=precise ? .01 : 1;
    if(precise){
      const ids=new Set(group.map(part=>part.id));
      const moving=group.flatMap(propFootprint).map(zBounds);
      const across=1-axis;
      for(const other of M.ents){
        if(ids.has(other.id)||!canArrangeProp(other))continue;
        for(const b of propFootprint(other).map(zBounds))for(const a of moving){
          if(a[across]>b[across+2]+.05||b[across]>a[across+2]+.05)continue;
          for(const from of [a[axis],a[axis+2]])for(const to of [b[axis],b[axis+2]]){
            const distance=(to-from)*sign;
            if(distance>1e-8&&distance<step)step=distance;
          }
        }
      }
    }
    moveInventory(item,x+delta[0]*step,y+delta[1]*step);
    return true;
  }
  function inventoryCard(item,label,selected,action){
    const {e,cell}=item,thumb=el('canvas',{width:56,height:56,'aria-hidden':'true'});
    const g=thumb.getContext('2d');
    if(e.tile&&sheets[e.tile.sid]?.img)drawTile(g,cell?.value??enc(e.tile.sid,e.tile.idx,e.spriteFlip||0),0,0,56);
    else if(e.wallLine){g.fillStyle='#a99272';g.fillRect(7,17,42,24);}
    else{g.font='28px system-ui';g.textAlign='center';g.fillText(OT[e.t]?.[0]||'◆',28,38);}
    return el('button',{type:'button',class:'build-material',title:label,'aria-label':label,
      'aria-pressed':String(selected),onclick:action},thumb,el('span',{},label));
  }
  function drawInventory(){
    const groups=M?inventoryGroups():[],group=groups.find(g=>g.key===inventoryGroup);
    inventoryItem=group?.items.find(item=>item.id===inventoryId)||null;
    const title=el('h3',{},'Vật phẩm trong màn');
    const layer=el('select',{class:'num','aria-label':'Lớp vật đã đặt',
      onchange:()=>{inventoryLayer=layer.value;inventoryPage=0;inventoryId=inventoryGroup='';inventoryMoving=false;draw();dirty=true;cv.focus({preventScroll:true});}},
      ...inventoryLayers.map(([value,label])=>el('option',{value},label)));
    layer.value=inventoryLayer;
    const snap=el('input',{type:'checkbox',onchange:()=>{inventorySnap=snap.checked;cv.focus({preventScroll:true});}});
    snap.checked=inventorySnap;
    const lightDrag=el('input',{type:'checkbox',onchange:()=>{inventoryLightDrag=lightDrag.checked;cv.focus({preventScroll:true});}});
    lightDrag.checked=inventoryLightDrag;
    body.append(title,el('div',{class:'row inventory-controls'},el('label',{},'Lớp ',layer),
      btn('Hoàn tác',doUndo),btn('Làm lại',doRedo),el('label',{},snap,' Bám tâm ô'),el('label',{},lightDrag,' Kéo nhẹ'),
      btn('Phối vật liệu',()=>api.openMaterials?.())),
      el('div',{class:'row inventory-controls'},btn('Nhập nhiều ảnh',addSheet),
        btn('Nhập nhiều ZIP/RAR',chooseArchiveFiles)));
    if(!groups.length){body.append(el('p',{class:'hint'},'Màn này chưa có vật phẩm.'));return;}
    const gallery=el('div',{class:'build-materials'});
    const paging=el('div',{class:'row build-pages'});
    const query=el('input',{class:'num inventory-select',type:'search',placeholder:'Tìm vật đã đặt…','aria-label':'Tìm vật đã đặt',
      value:inventoryQuery,oninput:()=>{inventoryQuery=query.value;inventoryPage=0;showItems();}});
    function showItems(){
      const term=normSearch(inventoryQuery);
      const visible=groups.filter(g=>normSearch(g.label).includes(term)).flatMap(g=>g.items);
      const perPage=48;
      inventoryPage=Math.min(inventoryPage,Math.max(0,Math.ceil(visible.length/perPage)-1));
      const start=inventoryPage*perPage;
      gallery.replaceChildren(...visible.slice(start,start+perPage).map(item=>{
        const label=entityName(item.e)+' · '+xy(inventoryPoint(item.e));
        return inventoryCard(item,label,item.id===inventoryId,()=>{
          inventoryGroup=inventoryKey(item.e);inventoryId=item.id;inventoryMoving=false;draw();dirty=true;
          centerInventory(item);cv.focus({preventScroll:true});
        });
      }));
      paging.replaceChildren();
      if(!visible.length){gallery.textContent='Không tìm thấy vật phẩm.';return;}
      if(start>0)paging.append(btn('Trước',()=>{inventoryPage--;showItems();}));
      paging.append(el('span',{class:'hint'},(start+1)+'–'+Math.min(start+perPage,visible.length)+' / '+visible.length+' vật'));
      if(start+perPage<visible.length)paging.append(btn('Sau',()=>{inventoryPage++;showItems();}));
    }
    body.append(query,gallery,paging);
    showItems();
    if(!group)return;
    const items=group.items;
    if(items[0].e.roofDirection){
      const common=roofThickness(items[0].e),uniform=items.every(item=>roofThickness(item.e)===common);
      const input=el('input',{class:'num',type:'number',min:.02,max:.8,step:.01,
        value:uniform?common:'',placeholder:uniform?'':'Khác nhau',required:''});
      body.append(el('form',{class:'row inventory-controls',onsubmit:event=>{
        event.preventDefault();
        if(Number.isFinite(input.valueAsNumber))bulkBoardThickness(items,input.valueAsNumber);
      }},el('label',{},'Độ dày (ô) ',input),el('button',{type:'submit',class:'b'},'Áp dụng cho '+items.length+' tấm')));
    }
    if(inventoryItem){
      const e=inventoryItem.e;
      const [l,t,r,b]=inventoryFootBounds(propGroup(M.ents,e).flatMap(inventoryFootprint));
      body.append(el('p',{class:'hint'},entityName(e)+' · Chân '+coord.format(r-l)+' × '+coord.format(b-t)+
        ' ô · Tâm đáy '+xy([(l+r)/2,(t+b)/2])));
    }
    if(!inventoryItem)return;
    if(inventoryItem.e.t==='deco'&&!inventoryItem.e.wallId&&!inventoryItem.e.wallLine&&!inventoryItem.e.gateAssembly||
       ['npc','enemy'].includes(inventoryItem.e.t)){
      const selected=inventoryItem;
      const scale=el('input',{class:'num',type:'number',min:10,max:400,step:1,required:'',
        value:Math.round((selected.e.visualScale??1)*100)});
      body.append(el('form',{class:'row inventory-controls',onsubmit:event=>{
        event.preventDefault(); resizeInventory(selected,scale.valueAsNumber/100);
      }},el('label',{},'Kích thước vật (%) ',scale),el('button',{type:'submit',class:'b'},'Đổi kích thước')));
    }
    const item=inventoryItem,[x,y]=inventoryPoint(item.e);
    const coordinate=(axis,value)=>el('input',{class:'num',type:'number',step:'any',required:'',value:+value.toFixed(3),'aria-label':'Tọa độ '+axis});
    const xInput=coordinate('X',x),yInput=coordinate('Y',y);
    body.append(el('form',{class:'row inventory-controls',onsubmit:event=>{
      event.preventDefault();moveInventory(item,xInput.valueAsNumber,yInput.valueAsNumber);
    }},el('label',{},'X ',xInput),el('label',{},'Y ',yInput),el('button',{type:'submit',class:'b'},'Đặt tọa độ')),
    el('div',{class:'row inventory-controls'},
      btn('Di chuyển · M',()=>startInventoryAction('move'),inventoryMoving==='move'?'on':''),
      inventoryCanCopy(item)?btn('Nhân bản · D',()=>openInventoryCopy(item)):null,
      (item.e.placedProp||propGroup(M.ents,item.e).length>1)&&inventoryCanCopy(item)?btn('Đổi hướng · R',()=>{inventoryShortcut('r',{});cv.focus({preventScroll:true});}):null,
      btn('Đưa vào giữa khung',()=>{centerInventory(item);dirty=true;cv.focus({preventScroll:true});}),
      item.e.t==='start'?null:btn('Xóa · Delete',()=>{removeInventory(item);cv.focus({preventScroll:true});})),
    el('p',{class:'hint',role:'status'},inventoryMoving==='copy'?'Bấm bản đồ để đặt bản sao. Esc hủy.':
      inventoryMoving?'Bấm bản đồ để đặt điểm neo mới. Esc hủy.':'Kéo vật để dời · Mũi tên dịch vật tự do 0,01 ô hoặc dịch vật theo lưới 1 ô · Shift + mũi tên dịch khung.'));

  }
  function draw(){updateDesktop();[...tabs.querySelectorAll('button[data-t]')].forEach(b=>b.classList.toggle('on',b.dataset.t===tab));body.innerHTML='';
    body.append(...drawGuides());
    if(tab==='inventory'){drawInventory();return;}
    if(tab==='tools'){
      if(tool==='select'||tool==='paste'){
        const selection=selRect();
        body.append(el('div',{class:'row'},
          selection?btn('Sao chép · Ctrl+C',()=>copyArea(false)):null,
          selection?btn('Cắt · Ctrl+X',()=>copyArea(true)):null,
          clip?btn('Dán · Ctrl+V',()=>useTool('paste')):null,
          selection?btn('Bỏ chọn',()=>{sel=null;dirty=true;draw();}):null));
      }
      const building=(brushTools.includes(tool)||tool==='wall')&&act<4;
      if(building)body.append(buildPalette());
      if(tool==='erase')body.append(erasePanel());
      const TL=simple?[['draw','Đặt mảnh'],['erase','🧽 Xóa'],['select','⬚ Chọn vùng'],['paste','📥 Dán'],['pan','✋ Kéo']]:[['draw','Đặt mảnh'],['erase','🧽 Xóa'],['fill','Thay vùng'],['rect','Đặt theo khung'],['pick','💧 Hút'],['select','⬚ Chọn vùng'],['paste','📥 Dán'],['zone','🚧 Vùng chặn'],['pan','✋ Kéo']];
      body.append(el('div',{class:'row legacy-panel-tools'},TL.map(([k,n])=>btn(n,()=>{useTool(k);},tool===k?'on':''))));
      if(tool==='zone')body.append(zoneUI());
      if(desktop())body.append(el('details',{ontoggle:e=>{viewDetails=e.currentTarget.open;} ,...(viewDetails?{open:''}:{})},el('summary',{},'Hiển thị'),
        el('div',{class:'row'},btn(smoothOn()?'Nền mượt: bật':'Nền mượt: tắt',()=>{pushUndo();M.cfg.smooth=!smoothOn();after();draw();}),
          btn(grid?'Lưới: bật':'Lưới: tắt',switchGrid),
          btn('Sương: '+fogLv(),()=>{pushUndo();M.cfg.fog=(fogLv()+1)%4;after();draw();}))));
      if(simple&&!desktop())body.append(el('div',{class:'row'},btn('↶ Hoàn tác',doUndo),btn('↷ Làm lại',doRedo),btn('＋',()=>zoomBy(1.4)),btn('－',()=>zoomBy(1/1.4)),btn('⤢ Vừa khung',fit)));else if(!desktop())body.append(el('div',{class:'row'},btn('↶ Hoàn tác',doUndo),btn('↷ Làm lại',doRedo),btn('＋',()=>zoomBy(1.4)),btn('－',()=>zoomBy(1/1.4)),btn('⤢ Vừa khung',fit),btn(grid?'▦ Lưới: bật':'▦ Lưới: tắt',()=>{grid=!grid;dirty=true;draw();})));
      if(!desktop()&&!building&&tool!=='erase')body.append(el('div',{class:'row'},el('span',{class:'lbl'},'Lớp đang sửa: '),LAYN.concat(['Vùng chặn']).map((n,i)=>btn(n,()=>{act=i;draw();},act===i?'on':''))));
      if((!simple||desktop())&&(tool==='select'||tool==='paste')){
        const box=el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'});
        if(tool==='select'||sel){const r=sel&&selRect();
          box.append(el('div',{class:'lbl'},r?('⬚ Vùng đang chọn: '+r.w+'×'+r.h+' ô'):'⬚ Kéo trên bản đồ để chọn một vùng (hoặc bấm Chọn tất cả)'));
          box.append(el('div',{class:'row'},btn('📋 Sao chép',()=>copyArea(false)),btn('✂ Cắt',()=>copyArea(true)),btn('📥 Dán',startPaste),btn('⬚ Chọn tất cả',()=>{sel={x0:0,y0:0,x1:M.w-1,y1:M.h-1};dirty=true;draw();})));
          box.append(el('div',{class:'row'},btn('🗑 Xóa lớp này',()=>clearSel(false)),btn('🗑 Xóa mọi lớp',()=>clearSel(true)),btn('✖ Bỏ chọn',()=>{sel=null;dirty=true;draw();})));
          const c1=el('input',{type:'checkbox',onchange:e=>{inclEnt=e.target.checked;}}),c2=el('input',{type:'checkbox',onchange:e=>{inclBlk=e.target.checked;}});c1.checked=inclEnt;c2.checked=inclBlk;
          box.append(el('div',{class:'row'},el('label',{style:'font-size:13px'},c1,' Kèm quái/NPC/rương'),el('label',{style:'font-size:13px'},c2,' Kèm vùng chặn')));}
        if(clip)box.append(el('div',{class:'row'},el('span',{class:'lbl'},'📌 Đang giữ: '+clip.w+'×'+clip.h+' ô'+(clip.ents.length?' + '+clip.ents.length+' đối tượng':'')+' · '),tool==='paste'?btn('✔ Xong dán',()=>{tool='select';draw();},'on'):btn('📥 Dán',startPaste),btn('Đặt cụm đã sao chép',()=>{tool='draw';draw();})));
        if(tool==='paste')box.append(el('div',{class:'hint'},clip?'Chạm/kéo để đặt (tâm vùng dán theo ngón tay), nhả ra là dán. Dán được nhiều lần. Esc hoặc "Xong dán" để thoát.':'Chưa có gì để dán — dùng "Chọn vùng" rồi "Sao chép" trước.'));
        if(tool==='select')box.append(el('div',{class:'hint'},'Phím tắt: ←↑↓→ di chuyển (Shift = 5 ô) · Ctrl+D nhân bản · H lật ngang · F phóng tới vùng · Enter chọn cả cụm công trình (trỏ chuột vào nó) · Ctrl+C/X/V · Ctrl+A · Delete · Esc · Ctrl+Z hoàn tác. Khi Đặt mảnh, giữ Shift + kéo để đặt thành hàng.'));
        body.append(box);}
      if(!desktop()&&building)body.append(el('p',{class:'hint'},'Chạm để đặt · Hai ngón để di chuyển hoặc thu phóng.'));
    }

    else if(tab==='sheet'){
      const pc=desktop(),ids=visSh().filter(i=>sheets[i]?.img);
      if(!ids.includes(curSheet))curSheet=ids[0]??0;
      const material=el('select',{class:'sheet-set','aria-label':'Bộ hình',onchange:e=>{curSheet=Number(e.target.value);shZ='fit';draw();}},
       ids.length?ids.map(i=>el('option',{value:i},sheets[i].name)):el('option',{value:''},'Chưa có bộ hình'));
      material.disabled=!ids.length;
      if(ids.length)material.value=String(curSheet);
      body.append(el('label',{class:'sheet-control'},'Bộ hình',material));
      const options=el('details',{class:'sheet-options'},el('summary',{},'Tùy chọn bộ hình'));
      options.open=sheetOptionsOpen;
      options.ontoggle=()=>{sheetOptionsOpen=options.open;};
      const nsel=el('select',{class:'sheet-set','aria-label':'Bộ nền có sẵn',disabled:''},el('option',{value:''},'Đang tìm bộ nền có sẵn…'));
      const nd=el('p',{class:'hint'},'');
      let started=false;
      function loadCatalog(){
        if(started)return;started=true;
        nenIndex().then(list=>{
          nsel.replaceChildren(el('option',{value:''},list.length?'Chọn bộ nền có sẵn…':'Chưa có bộ nền trong danh mục'),
           ...list.map(entry=>el('option',{value:entry.id},entry.name)));
          nsel.disabled=!list.length;
        }).catch(()=>{nd.textContent='Chưa tải được danh mục nền.';});
      }
      nsel.onchange=async()=>{
        if(!nsel.value)return;
        nd.textContent='Đang nạp…';
        try{const r=await ensureNen(nsel.value);curSheet=r.sid;HID.delete(r.sid);shZ='fit';draw();}
        catch(e){nd.textContent='Lỗi nạp bộ nền: '+(e?.message||e);}
      };
      options.addEventListener('toggle',()=>{if(options.open)loadCatalog();});
      if(options.open)loadCatalog();
      const fileActions=el('div',{class:'row'},
       btn('Thêm ảnh',addSheet),btn('Nhập gói ZIP/RAR…',chooseArchiveFiles),btn('Quản lý / xóa bộ hình',manageSheets));
      if(!ids.length){
        body.append(el('p',{class:'hint'},'Thêm ảnh để chọn ô hình.'),btn('Thêm ảnh',addSheet));
        options.append(fileActions,nsel,nd);body.append(options);return;
      }
      const s=sheets[curSheet],fitZ=Math.max(.02,Math.min(pc?1.5:3,((pn.clientWidth||360)-34)/s.img.width)),z=shZ==='fit'?fitZ:shZ;
      const zoom=el('div',{class:'row'},
       btn('Vừa khung',()=>{shZ='fit';draw();},shZ==='fit'?'on':''),
       btn('−',()=>{shZ=Math.max(.02,z/1.4);draw();}),
       btn('+',()=>{shZ=Math.min(8,z*1.4);draw();}),btn('1:1',()=>{shZ=1;draw();}),
       el('span',{class:'lbl'},s.img.width+' × '+s.img.height+' px'));
      options.append(fileActions,nsel,nd,zoom);
      const wrap=el('div',{class:'sheetwrap',style:'max-height:min(60vh,520px)'});const c=el('canvas');c.width=Math.max(1,Math.round(s.img.width*z));c.height=Math.max(1,Math.round(s.img.height*z));if(z<1)c.style.imageRendering='auto';wrap.append(c);body.append(wrap);
      const g=c.getContext('2d');g.imageSmoothingEnabled=z<1;g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);g.drawImage(s.img,0,0,c.width,c.height);
      let ss=null;const step=(s.tw+s.margin)*z;
      const redraw=()=>{g.imageSmoothingEnabled=z<1;g.clearRect(0,0,c.width,c.height);g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);g.drawImage(s.img,0,0,c.width,c.height);
        const cur=stampSheetRect(curSheet);if(cur){g.strokeStyle='#ffd24a';g.lineWidth=2;g.strokeRect(cur.c0*step,cur.r0*step,(cur.c1-cur.c0+1)*step-z*s.margin,(cur.r1-cur.r0+1)*step-z*s.margin);}
        if(ss){g.strokeStyle='#4fd1ff';g.strokeRect(Math.min(ss.c0,ss.c1)*step,Math.min(ss.r0,ss.r1)*step,(Math.abs(ss.c1-ss.c0)+1)*step-z*s.margin,(Math.abs(ss.r1-ss.r0)+1)*step-z*s.margin);}};
      const cr=e=>{const r=c.getBoundingClientRect();const x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;return {c:Math.max(0,Math.min(s.cols-1,Math.floor(x/step))),r:Math.max(0,Math.min(s.rows-1,Math.floor(y/step)))};};
      c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);const p=cr(e);ss={c0:p.c,r0:p.r,c1:p.c,r1:p.r};redraw();});
      c.addEventListener('pointermove',e=>{if(!ss)return;const p=cr(e);ss.c1=p.c;ss.r1=p.r;redraw();});
      c.addEventListener('pointerup',e=>{if(!ss)return;const c0=Math.min(ss.c0,ss.c1),c1=Math.max(ss.c0,ss.c1),r0=Math.min(ss.r0,ss.r1),r1=Math.max(ss.r0,ss.r1);ss=null;
        const w=c1-c0+1,h=r1-r0+1,tiles=[];for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++)tiles.push(enc(curSheet,j*s.cols+i));
        stamp={w,h,multi:false,tiles,sheet:{sid:curSheet,c0,r0,c1,r1}};if(tool!=='rect'&&tool!=='fill')tool='draw';redraw();draw();dirty=true;cv.focus({preventScroll:true});toast('Đã chọn '+w+'×'+h+' ô. Bấm lên bản đồ để đặt.');});
      redraw();
      body.append(options);}
    else if(tab==='res'){resTab();}
    else if(tab==='maps'){mapsTab();}
    else if(tab==='mau'){mauTab();}
    else if(tab==='lib'){
      body.append(el('div',{class:'row'},btn('💾 Lưu stamp hiện tại vào thư viện',async()=>{const n=await ask('Tên công trình/stamp:','Công trình '+(lib.length+1));if(!n)return;lib.push({name:n,w:stamp.w,h:stamp.h,multi:!!stamp.multi,layers:stamp.multi?stamp.layers:null,tiles:stamp.tiles});lsSet('thk_stamps',lib);draw();toast('Đã lưu "'+n+'"');})));
      if(!lib.length)body.append(el('div',{class:'hint'},'Thư viện trống. Dùng "Chọn vùng" → "Lấy làm stamp" để copy một công trình trên bản đồ, rồi lưu vào đây để dùng lại hoặc ghép vào bản đồ khác.'));
      const grid=el('div',{class:'libgrid'});lib.forEach((s,i)=>{const c=el('canvas');const z=Math.max(1,Math.min(4,Math.floor(96/Math.max(s.w,s.h)/CELL*3)));c.width=s.w*CELL*z;c.height=s.h*CELL*z;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#2a3340';g.fillRect(0,0,c.width,c.height);
        for(let j=0;j<s.h;j++)for(let k=0;k<s.w;k++){if(s.multi){for(let l=0;l<4;l++){const v=s.layers[l]&&s.layers[l][j*s.w+k];if(v)drawTile(g,v,k*CELL*z,j*CELL*z,CELL*z);}}else drawTile(g,s.tiles[j*s.w+k],k*CELL*z,j*CELL*z,CELL*z);}
        grid.append(el('div',{class:'libitem'},c,el('div',{},s.name+' ('+s.w+'×'+s.h+')'),el('div',{class:'row'},btn('Dùng',()=>{stamp={w:s.w,h:s.h,multi:s.multi,layers:s.layers,tiles:s.multi?s.layers[0]:s.tiles};tool='draw';tab='tools';draw();toast('Đã chọn stamp "'+s.name+'"');}),btn('🗑',async()=>{if(await yes('Xóa "'+s.name+'"?')){lib.splice(i,1);lsSet('thk_stamps',lib);draw();}}))));});body.append(grid);}
    else if(tab==='obj'||tab==='gameSettings'){
      const e=selEnt();
      const th=(sid,idx,fn,on)=>{const c=el('canvas',{style:'width:34px;height:34px;image-rendering:pixelated;background:#2a3340;border-radius:4px;border:2px solid '+(on?'#ffd24a':'transparent')+';flex:none',onclick:fn});c.width=c.height=CELL*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;drawTile(g,enc(sid,idx),0,0,CELL*2);return c;};
      const picker=(get,set)=>{const cur=get();const vs=visSh();const wrapAll=el('div',{});if(!vs.length){wrapAll.append(el('div',{class:'hint'},'Chưa có tileset nào hiển thị — nạp tileset nhân vật của bạn ở tab 🧩 Tileset.'));return wrapAll;}
        const ps=window.__psid!=null&&vs.includes(window.__psid)?window.__psid:(cur&&vs.includes(cur.sid)?cur.sid:vs[0]);
        const sh=sheets[ps],n=ps===2?[84,132]:[0,Math.min(300,(sh.cols||0)*(sh.rows||Math.floor((sh.img?sh.img.height:0)/(sh.tw+(sh.margin||0)))||0))];
        const sel=el('select',{class:'num',style:'max-width:100%',onchange:e=>{window.__psid=+e.target.value;draw();}},...vs.map(k=>{const o=el('option',{value:k},(k+1)+'. '+sheets[k].name);if(k===ps)o.selected=true;return o;}));
        const wrap=el('div',{style:'display:flex;flex-wrap:wrap;gap:3px;margin:4px 0;max-height:118px;overflow:auto'});for(let i=n[0];i<n[1];i++)wrap.append(th(ps,i,()=>{set({sid:ps,idx:i});after();draw();},cur&&cur.sid===ps&&cur.idx===i));wrapAll.append(sel,wrap);return wrapAll;};
      const fld=(l,o,k,type,extra)=>{const i=el('input',{type:type||'text',value:o[k],class:'num',style:'width:'+(type==='number'?'72px':'100%')+';box-sizing:border-box',min:extra&&extra.min,max:extra&&extra.max,step:extra&&extra.step});i.oninput=()=>{o[k]=type==='number'?+i.value:i.value;after();};return el('div',{class:'row'},el('span',{class:'lbl'},l),i);};
      if(tab==='obj'&&e?.wallLine){
        body.append(el('strong',{},e.name),el('div',{class:'row'},thicknessInput(wallThickness(e),v=>changeWallThickness(e,v)),heightInput(e.wallLine.height??1.25,v=>changeWallHeight(e,v))),
          btn('Xóa đoạn tường',()=>removeStructure(e)));
      }else if(tab==='obj'&&e){
        body.append(el('div',{style:'border:1px solid '+OT[e.t][2]+';border-radius:10px;padding:8px;margin:6px 0'},
          el('div',{class:'lbl',style:'margin-bottom:4px'},OT[e.t][0]+' '+OT[e.t][1]+' · '+(e.placedProp?'Điểm chân ('+(e.x+1).toFixed(2)+', '+(e.y+1).toFixed(2)+')':'Ô ('+e.x+', '+e.y+')')),
          e.t!=='start'&&e.t!=='goal'?fld('Tên',e,'name'):'',
          bodyHeight(e,M.cfg)>0&&e.t!=='start'&&!isRoof(e)?physicalHeightField('Chiều cao vật',e,'bodyHeight',bodyHeight(e,M.cfg)):null,
          e.roofDirection?roofThicknessField(roofThickness(e),value=>editPlacedProp(e,next=>{next.roofThickness=value;})):null,
          e.t==='chest'?physicalHeightField('Phần nắp nâng thêm',e,'lidRise',bodyHeight(e,M.cfg,true)-bodyHeight(e,M.cfg)):null,
          ...(e.t==='enemy'?[fld('Máu',e,'hp','number',{min:1,max:99}),fld('Sát thương',e,'dmg','number',{min:0,max:9}),fld('Tốc độ (ô/s)',e,'spd','number',{min:0,max:8,step:.1}),fld('Tầm phát hiện',e,'chase','number',{min:1,max:20}),
            el('div',{class:'row'},el('span',{class:'lbl'},'Hành vi'),(()=>{const s=el('select',{class:'num'},AIL.map(([v,n])=>el('option',{value:v},n)));s.value=e.ai;s.onchange=()=>{e.ai=s.value;after();};return s;})())]:[]),
          ...(e.t==='deco'&&e.door?[el('div',{class:'row'},el('span',{class:'lbl'},'Trạng thái cửa'),(()=>{const sl=el('select',{class:'num'},el('option',{value:'dong'},'Đóng (chặn lối)'),el('option',{value:'mo'},'Mở (đi qua được)'));sl.value=e.door.st;sl.onchange=()=>{const v=e.door.v[sl.value];e.door.st=sl.value;e.tile=v.tile;if(v.col&&v.col.length)e.col=v.col;else delete e.col;after();draw();};return sl;})()),el('div',{class:'row'},el('label',{style:'font-size:13px'},(()=>{const c=el('input',{type:'checkbox'});c.checked=!!e.door.auto;c.onchange=()=>{e.door.auto=c.checked?1:0;after();};return c;})(),' Tự đóng lại khi nhân vật đi xa')),el('div',{class:'hint'},'Khi chơi: cửa tự mở khi lại gần, phím E đóng/mở. Vùng chặn riêng từng trạng thái.')]:[]),
          ...(e.t==='deco'?[propSizeField(sizePercent(e),n=>{if(n!==sizePercent(e))editPlacedProp(e,n);}),
            e.placedProp?el('div',{class:'row'},btn('Đổi hướng · R',()=>{editPlacedProp(e,'turn');cv.focus({preventScroll:true});}),
              !e.wallId&&e.col?.length===2&&e.tile&&gateKind(enc(e.tile.sid,e.tile.idx))==='stone'?
                btn('Lắp cổng cũ lên tường',()=>editPlacedProp(e,next=>{next.gateAssembly=true;next.wallGateBrush=true;next.walk=false;})):null):null,
            e.gateAssembly?el('p',{class:'hint'},e.wallId?'Cổng gắn vào tường. Xóa cổng sẽ khép lại lỗ mở.':'Cổng kiểu cũ có hai đoạn tường ngắn. Có thể lắp lại vào tuyến tường.'):
            el('label',{class:'row'},(()=>{const c=el('input',{type:'checkbox'});
              c.checked=!!e.walk;c.onchange=()=>{pushUndo();e.walk=c.checked;after();draw();};return c;
            })(),'Cho đi qua'),
            e.estimated?el('p',{class:'hint'},'Va chạm ước lượng từ chân ảnh.'):null]:[]),
          ...(e.gateAssembly&&e.wallId?[gateDestination(e)]:[]),
          ...(e.t==='npc'?[el('div',{class:'lbl'},'Lời thoại'),(()=>{const t=el('textarea',{rows:3,style:'width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:15px'});t.value=e.text;t.oninput=()=>{e.text=t.value;after();};return t;})()]:[]),
          ...(e.t==='chest'?[el('div',{class:'row'},el('span',{class:'lbl'},'Bên trong'),(()=>{const s=el('select',{class:'num'},el('option',{value:'hp'},'Hồi máu'),el('option',{value:'coin'},'Điểm/tiền'));s.value=e.gives;s.onchange=()=>{e.gives=s.value;after();};return s;})()),fld('Số lượng',e,'amt','number',{min:1,max:99})]:[]),
          ...(e.tile!==undefined&&(e.t==='enemy'||e.t==='npc')?[el('div',{class:'lbl'},'Hình nhân vật:'),picker(()=>e.tile,t=>{e.tile=t;}),btn('🎨 Dùng ô tileset đang chọn làm hình',()=>{const d=stamp.tiles&&stamp.tiles[0];if(!d){toast('Chọn 1 ô trong tab Tileset trước');return;}const q=dec(d);e.tile={sid:q.sid,idx:q.idx};after();draw();})]:[]),
          ...(e.t==='enemy'||e.t==='npc'?[animPick(e,'anim',M.cfg,after)]:[]),
          ...entExtra(e,after,draw),
          el('div',{class:'row'},e.wallId?null:btn('⧉ Nhân bản',()=>{pushUndo();const c=JSON.parse(JSON.stringify(e));c.id=Date.now().toString(36);c.x=Math.min(M.w-1,e.x+1);if(e.t==='start')return toast('Chỉ có 1 điểm xuất phát');M.ents.push(c);if(!acceptStructure())return;selId=c.id;after();draw();}),btn('🗑 Xoá',()=>eraseEntity(e)))));
      }
      if(tab==='gameSettings'){
      const C=M.cfg;
      body.append(el('div',{style:'border:1px solid #34485a;border-radius:10px;padding:8px;margin:6px 0'},el('div',{class:'lbl'},'⚙ Thiết lập game'),
        physicalHeightField('Cao khi đứng',C,'playerHeight',actorHeights(C).standing),
        physicalHeightField('Cao khi cúi',C,'crouchHeight',actorHeights(C).crouching,actorHeights(C).standing),
        fld('Máu người chơi',C,'hp','number',{min:1,max:99}),fld('Tốc độ đi (ô/s)',C,'spd','number',{min:1,max:10,step:.1}),fld('Sát thương đòn đánh',C,'dmg','number',{min:1,max:99}),fld('Tầm đánh (ô)',C,'rng','number',{min:.5,max:4,step:.05}),
        el('div',{class:'row'},el('span',{class:'lbl'},'Điều kiện thắng'),(()=>{const s=el('select',{class:'num'},el('option',{value:'auto'},'Tự động'),el('option',{value:'kill'},'Diệt hết quái'),el('option',{value:'goal'},'Chạm đích'),el('option',{value:'both'},'Diệt hết quái + chạm đích'));s.value=C.win;s.onchange=()=>{C.win=s.value;after();};return s;})()),
        el('div',{class:'lbl'},'Hình nhân vật chính:'),picker(()=>C.hero,t=>{C.hero=t;}),animPick(C,'heroAnim',M.cfg,after,'Hoạt ảnh nhân vật chính')));
      }
    }
    else if(tab==='logic'){logicTab(body,M.cfg,M.ents,after,draw);}
    else if(tab==='anim'){animTab(body,M.cfg,sheets,after,draw,ANS);}
    else if(tab==='layers'){
      body.append(el('div',{class:'hint'},'Bật/tắt hiển thị từng lớp. Lớp "Vùng chặn" là chỗ nhân vật không đi qua được (xuất kèm trong tệp dữ liệu để dùng trong game).'));
      LAYN.concat(['Vùng chặn']).forEach((n,i)=>body.append(el('div',{class:'row'},btn(vis[i]?'👁 Hiện':'🚫 Ẩn',()=>{vis[i]=vis[i]?0:1;dirty=true;draw();},vis[i]?'':'off'),btn(n,()=>{act=i;draw();},act===i?'on':''))));}
    else if(tab==='file'){
      const advanced=el('details',{},el('summary',{},'Nâng cao'),
       el('p',{class:'hint'},'Các thao tác dưới đây chỉ áp dụng cho bản đồ đang mở.'),
       el('div',{class:'row'},
        btn('Nhập bản đồ 2D…',()=>pickFile('.json,application/json',importMapFile)),
        btn('Dựng bản đồ gốc từ ZIP…',chooseTiledArchives),
        btn('Xuất bản đồ 2D (.json)',exportJSON),
        btn('Sao chép JSON',copyJSON),
        btn('Dán JSON…',async()=>{const value=await askText('Dán JSON của một bản đồ 2D:');if(value)await importMapFile(value);})),
       el('p',{class:'hint'},'Ô lưu nhanh được giữ trong trình duyệt này.'),
       slotsUI('2d',()=>clone(M),o=>{pushUndo();M=clone(o);selId=null;after();fit();},'Bản đồ của tôi'));
      body.append(el('div',{class:'row'},
       btn('Mở dự án…',()=>openProjectFile({restoreProject})),
       btn('Lưu dự án',()=>saveProjectFile({readProject}),'on')),
       saveStatus,advanced);
    }
  }
  function stampSheetRect(sid){return stamp.sheet&&stamp.sheet.sid===sid?stamp.sheet:null;}
  function flipStamp(){const w=stamp.w,h=stamp.h;const f=a=>{const o=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++){const v=a[j*w+(w-1-i)];if(!v){o.push(0);continue;}const d=dec(v);o.push(enc(d.sid,d.idx,d.f^1));}return o;};
    if(stamp.multi){stamp.layers=stamp.layers.map(a=>a&&f(a));stamp.tiles=stamp.layers[0];}else{stamp.tiles=f(stamp.tiles);}delete stamp.sheet;ui.stamp();}
  function resizedMap(source,w,h){
    const m=newMap(w,h);
    const wide=Math.min(w,source.w),high=Math.min(h,source.h);
    for(let y=0;y<high;y++)for(let x=0;x<wide;x++){
      const from=y*source.w+x,to=y*w+x;
      for(let l=0;l<4;l++)m.layers[l][to]=source.layers[l][from];
      m.blk[to]=source.blk[from];
    }
    m.ents=source.ents.filter(e=>(e.x+(e.placedProp?1:0))<w&&(e.y+(e.placedProp?1:0))<h);
    m.cfg={...source.cfg};m.name=source.name;
    return m;
  }
  function resize(w,h){M=resizedMap(M,w,h);}
  function validateDimensions(w,h){
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<4||h<4||w>MAX_MAP_SIDE||h>MAX_MAP_SIDE)
      throw Error('Chiều rộng và chiều cao phải là số nguyên từ 4 đến 600 ô.');
  }
  function validateResize(w,h){
    validateDimensions(w,h);
    if(w>=M.w&&h>=M.h)return;
    const outside=(x,y)=>x>=w||y>=h;
    const context=ruleCtx();
    const zones=[...(M.cfg.zones||[]),...context.objects,...ruleContext.paintZones];
    const incoming=MAPS.flatMap((m,i)=>(i===curMap?M:m).ents);
    if(M.ents.some(e=>outside(e.x,e.y))||zones.some(z=>outside(...zBounds(z).slice(2).map(v=>v-1e-8)))||
       incoming.some(e=>isMapLink(e)&&+e.to===curMap&&outside(e.tx,e.ty)))
      throw Error('Khung mới cắt qua đối tượng, vùng chặn hoặc điểm đến của cửa. Hãy chọn lưới lớn hơn.');
    const old=M.cfg.outline?.loops;
    const mask=old?rasterOutline(old,M.w,M.h):null;
    for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++){
      if(!outside(x,y))continue;
      const i=y*M.w+x;
      if(M.layers.some(layer=>layer[i])||M.blk[i]&&(!mask||mask[i]))
        throw Error('Khung mới cắt qua các ô đang dùng. Hãy chọn lưới lớn hơn để giữ nội dung cũ.');
    }
  }
  function resizeOutlineGrid(w,h){
    validateResize(w,h);
    if(w===M.w&&h===M.h)return;
    if(M.cfg.outline?.loops&&!validOutline(M.cfg.outline.loops,w,h))
      throw Error('Khung mới cắt qua đường bao.');
    pushUndo();resize(w,h);after();fit();draw();
    toast('Đã đổi lưới thành '+w+' × '+h+' ô');
  }
  function fromVillage(){const v=A.village;return clone({w:v.w,h:v.h,layers:v.layers,blk:v.blk});}
  async function addSheetUrl(url,nm){const g=null;const tw=+(await ask(g?'App tự đoán: ô '+g.tw+' px, khe '+g.m+' px ('+g.cols+'×'+g.rows+' ô). Sai thì sửa số.\n\nKích thước mỗi ô (px)?':'Không đoán được. Kích thước mỗi ô (px)?',g?String(g.tw):'16'));if(!tw)return;const m=+(await ask('Khoảng cách giữa các ô (px)?',g?String(g.m):'0'))||0;const s={name:nm.slice(0,24),url,tw,margin:m};loadSheet(s).then(()=>{sheets.push(s);uniqNames(sheets);curSheet=sheets.length-1;after();draw();toast('Đã thêm tileset');});}
  function sheetUse(){const u=new Array(sheets.length).fill(0);for(const a of M.layers)for(const v of a)if(v){const d=dec(v);if(u[d.sid]!=null)u[d.sid]++;}
    for(const e of M.ents)if(e.tile&&u[e.tile.sid]!=null)u[e.tile.sid]++;const h=M.cfg&&M.cfg.hero;if(h&&u[h.sid]!=null)u[h.sid]++;const original=M.cfg?.beforeOutlineHero?.hero;if(original&&u[original.sid]!=null)u[original.sid]++;return u;}
  function deleteSheets(D){TG.hashes=[];const map=[];let k=0;for(let i=0;i<sheets.length;i++)map.push(D.has(i)?-1:k++);const seen=new WeakSet();
    const fix=v=>{if(!v)return 0;const d=dec(v),n=map[d.sid];if(n==null)return v;return n<0?0:enc(n,d.idx,d.f);};
    const fixA=a=>{if(!a||seen.has(a))return;seen.add(a);for(let i=0;i<a.length;i++)a[i]=fix(a[i]);};
    const fixT=(e,t)=>{if(!e.tile)return;const n=map[e.tile.sid];if(n==null)return;if(n<0)e.tile=e.t==='enemy'?{sid:2,idx:108}:e.t==='npc'?{sid:2,idx:96}:null;else e.tile={sid:n,idx:e.tile.idx};};
    M.layers.forEach(fixA);M.ents.forEach(fixT);const h=M.cfg&&M.cfg.hero;if(h){const n=map[h.sid];if(n<0)M.cfg.hero={sid:2,idx:88};else if(n!=null)h.sid=n;}const original=M.cfg?.beforeOutlineHero?.hero;if(original){const n=map[original.sid];if(n<0)M.cfg.beforeOutlineHero.hero={sid:2,idx:88};else if(n!=null)original.sid=n;}
    const fixS=o=>{if(!o)return;if(o.multi&&o.layers){o.layers.forEach(fixA);o.tiles=o.layers[0];}else fixA(o.tiles);if(o.sheet){const n=map[o.sheet.sid];if(n<0)delete o.sheet;else if(n!=null)o.sheet.sid=n;}};
    fixS(stamp);if(clip){clip.layers.forEach(fixA);clip.ents.forEach(fixT);}lib.forEach(fixS);lsSet('thk_stamps',lib);
    undo=[];redo=[];[...D].sort((a,b)=>b-a).forEach(i=>sheets.splice(i,1));curSheet=0;if(!stamp.tiles||!stamp.tiles.length)stamp={w:1,h:1,multi:false,tiles:[enc(0,5)]};
    after();}
  async function wipeAll(){if(!await yes('XOÁ TẤT CẢ tài nguyên?\n\nGồm mọi tileset (kể cả 4 tileset gốc), nhãn, và xoá sạch hình đã đặt trên bản đồ.\nĐối tượng và bộ hoạt ảnh dùng các hình này sẽ mất hình.\nKhông hoàn tác được.'))return;pushUndo();for(const a of M.layers)a.fill(0);const D=new Set();for(let i=4;i<sheets.length;i++)D.add(i);if(D.size)deleteSheets(D);for(let i=0;i<4;i++)HID.add(i);lsSet('thk_hide2d',[...HID]);TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[],hashes:[]});tgSave();curSheet=0;after&&after();draw();toast('Đã xoá tất cả tài nguyên. Bạn có thể tải lại.');}
  function manageSheets(){const custom=sheets.map((s,i)=>i).filter(i=>!HID.has(i));if(!custom.length&&!HID.size){toast('Không có tileset nào');return;}
    const ov=el('div',{style:'position:fixed;inset:0;z-index:200;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px'});
    const box=el('div',{style:'background:#1b2733;border:1px solid #4a6178;border-radius:14px;padding:14px;max-width:640px;width:100%;max-height:92vh;display:flex;flex-direction:column;color:#fff;font:14px system-ui'});
    const flt=el('input',{placeholder:'Lọc theo tên…',style:'width:100%;box-sizing:border-box;padding:9px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:15px;margin:8px 0'});
    const list=el('div',{style:'overflow:auto;flex:1;min-height:120px;border:1px solid #2b3a4b;border-radius:8px'});const info=el('div',{style:'margin:8px 0;font-weight:700'});
    const chk=new Set();let uses=sheetUse();
    const redraw=()=>{list.innerHTML='';const q=flt.value.trim().toLowerCase();let shown=0;
      for(const i of custom){const s=sheets[i];if(!s)continue;if(q&&!s.name.toLowerCase().includes(q))continue;shown++;
        const cb=el('input',{type:'checkbox',onchange:e=>{e.target.checked?chk.add(i):chk.delete(i);upd();}});cb.checked=chk.has(i);
        const th=el('canvas',{width:40,height:40,style:'width:40px;height:40px;image-rendering:pixelated;background:#2a3340;border-radius:4px'});if(s.img){const g=th.getContext('2d');g.imageSmoothingEnabled=false;const k=Math.min(40/s.img.width,40/s.img.height);g.drawImage(s.img,0,0,s.img.width*k,s.img.height*k);}
        const row=el('label',{style:'display:flex;align-items:center;gap:10px;padding:6px 8px;border-bottom:1px solid #243242'},cb,th,el('div',{style:'flex:1;min-width:0'},el('div',{style:'overflow:hidden;text-overflow:ellipsis;white-space:nowrap'},s.name),el('div',{style:'font-size:12px;color:#9fb0c2'},(i<4?'GỐC của app · ':'')+(s.img?s.img.width+'×'+s.img.height+' px · ':'')+(uses[i]?'đang dùng '+uses[i]+' ô/đối tượng':'chưa dùng'))));list.append(row);}
      if(!shown)list.append(el('div',{style:'padding:14px;color:#9fb0c2'},'Không có tileset nào khớp.'));upd();};
    const upd=()=>{info.textContent='Đã chọn '+chk.size+' / '+custom.filter(i=>sheets[i]).length+' tileset';};
    const B=(l,f,c)=>el('button',{class:'b',style:c||'',onclick:f},l);
    const visible=()=>custom.filter(i=>sheets[i]&&(!flt.value.trim()||sheets[i].name.toLowerCase().includes(flt.value.trim().toLowerCase())));
    flt.addEventListener('input',redraw);
    const done=()=>{ov.remove();draw();};
    const del=async()=>{if(!chk.size){toast('Chưa chọn tileset nào');return;}const D=new Set(chk);const D0=new Set([...D].filter(i=>i<4));const D1=new Set([...D].filter(i=>i>=4));let used=0,names=[];for(const i of D){used+=uses[i]||0;names.push(sheets[i].name);}
      const an=JSON.stringify((M.cfg&&M.cfg.anims)||[]);const anUse=names.filter(n=>an.includes(JSON.stringify(n))).length;
      const ok=await yes('Xóa '+D.size+' tileset?'+(D0.size?'\n(Tileset gốc: được gỡ khỏi danh sách và gỡ hết ô đã đặt bằng chúng trên bản đồ.)':'')+''+(used?'\n⚠ '+used+' ô/đối tượng đang dùng sẽ bị gỡ khỏi bản đồ (có thể hỏng hình).':'')+(anUse?'\n⚠ '+anUse+' tileset đang được bộ hoạt ảnh dùng — hoạt ảnh đó sẽ mất hình.':'')+'\nKhông hoàn tác được.');if(!ok)return;
      if(D0.size){for(const a of M.layers)for(let k=0;k<a.length;k++){const v=a[k];if(v&&D0.has(dec(v).sid))a[k]=0;}D0.forEach(i=>HID.add(i));lsSet('thk_hide2d',[...HID]);}
      if(D1.size)deleteSheets(D1);after&&after();toast('Đã xóa '+D.size+' tileset');ov.remove();draw();};
    box.append(el('div',{style:'font-size:16px;font-weight:800'},'🗑 Quản lý / xóa tileset (kể cả 4 tileset gốc)'),flt,
      el('div',{class:'row',style:'margin-bottom:6px'},B('☑ Chọn tất cả (đang lọc)',()=>{visible().forEach(i=>chk.add(i));redraw();}),B('☑ Chọn tất cả chưa dùng',()=>{custom.forEach(i=>{if(sheets[i]&&!uses[i])chk.add(i);});redraw();}),B('☐ Bỏ chọn hết',()=>{chk.clear();redraw();}),B('☑ Chọn TOÀN BỘ',()=>{custom.forEach(i=>{if(sheets[i])chk.add(i);});redraw();}),HID.size?B('↩ Hiện lại tileset gốc',()=>{toast('Tileset gốc của app đã được gỡ');}):null),
      list,info,el('div',{class:'row'},B('🗑 Xóa các mục đã chọn',del,'background:#b3402f;color:#fff'),B('Đóng',done)));
    ov.append(box);document.body.append(ov);redraw();}
  // ===== Thư viện tài nguyên (nhãn) =====
  let TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[]},lsGet('thk_tags2d',null)||{});
  let tgT;
  const tgSave=()=>lsSet('thk_tags2d',TG);
  const KW=[[/\b(char|hero|nhan vat|player|npc|human|cai-bang|vo-dang)/,'Nhân vật'],[/\b(enemy|monster|quai|boss|slime|skeleton)/,'Quái'],[/\b(tree|forest|bush|plant|flower|cay|hoa)\b/,'Cây'],[/\b(house|build|home|roof|nha|mai)\b/,'Nhà'],[/\b(water|lake|river|sea|nuoc|song)\b/,'Nước'],[/\b(road|path|street|grass|dirt|floor|ground|duong|nen)\b/,'Đường'],[/\b(wall|fence|gate|rao|tuong|cong)\b/,'Tường/hàng rào'],[/\b(item|prop|chest|tool|weapon|food|do vat)\b/,'Đồ vật'],[/\b(dungeon|deco|ham nguc|trang tri)\b/,'Trang trí']];
  const GT=new Map();
  function guessType(sid){const sh=sheets[sid];if(GT.has(sh.name))return GT.get(sh.name);let ty=null;const BI={1:'Nhà',2:'Trang trí',3:'Nhân vật'};if(sid<4)ty=BI[sid]||null;if(!ty){const nm=sh.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');for(const [re,y] of KW)if(re.test(nm)){ty=y;break;}}GT.set(sh.name,ty);return ty;}
  function eff(sid,idx){const sh=sheets[sid],base={};const m=sh.img?emptyMap(sh):null;if(m&&m[idx]===2){base.layer=0;base.fn='Đi được';}else{base.layer=2;base.fn='Chặn đường';}const ty=guessType(sid);if(ty)base.type=ty;return Object.assign(base,TG.sheets[sh.name],TG.tiles[sh.name+'#'+idx]);}
  const EMP=new WeakMap();
  function emptyMap(sh){let m=EMP.get(sh.img);if(m)return m;const n=sh.cols*sh.rows;m=new Uint8Array(n);if(n>20000){EMP.set(sh.img,m);return m;}
    const c=document.createElement('canvas');c.width=sh.img.width;c.height=sh.img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sh.img,0,0);const D=g.getImageData(0,0,c.width,c.height).data,W=c.width,st=sh.tw+sh.margin;
    for(let r=0;r<sh.rows;r++)for(let cc=0;cc<sh.cols;cc++){let any=0,op=0;for(let y=0;y<sh.tw;y++)for(let x=0;x<sh.tw;x++){const a=D[((r*st+y)*W+cc*st+x)*4+3];if(a>10)any=1;if(a>200)op++;}m[r*sh.cols+cc]=!any?1:(op>=sh.tw*sh.tw*.96?2:0);}
    EMP.set(sh.img,m);return m;}
  function noteRecent(v){if(!v)return;const d=dec(v);if(!sheets[d.sid])return;const key=sheets[d.sid].name+'#'+d.idx;if(TG.recent[0]===key)return;TG.recent=[key].concat(TG.recent.filter(k=>k!==key)).slice(0,60);clearTimeout(tgT);tgT=setTimeout(tgSave,1500);}
  function keepScroll(f){const a=pn.scrollTop,b=body.scrollTop;f();pn.scrollTop=a;body.scrollTop=b;}
  function resTab(){
    const imports=el('details',{},el('summary',{},'Nhập tài nguyên'),
      el('div',{class:'row'},btn('Ảnh rời…',addSheet),btn('Ảnh ô lưới…',addGridSheet),
       btn('Nhập gói ZIP/RAR…',chooseArchiveFiles,'on'),btn('Dựng bản đồ gốc từ ZIP…',chooseTiledArchives)),
      el('p',{class:'hint'},'Gói Xưởng được nạp tự động. Với gói ảnh thông thường, app mở danh sách để bạn xem và chọn ảnh cần dùng.'),
      packReport(),archiveReport());
    if(packResults.length||archiveResults.length)imports.open=true;
    body.append(builtinArchivePanel(),imports,installedPackList(),el('details',{},el('summary',{},'Quản lý tài nguyên'),
      el('div',{class:'row'},btn('Xóa từng bộ hình…',manageSheets),btn('Xóa tất cả tài nguyên…',wipeAll))));
  }
  /* NẠP NGUYÊN HÌNH: không hỏi cỡ ô. Mỗi vật (mảng ảnh liền nhau) thành 1 ô 128×128, thu nhỏ vừa khung nếu to hơn, không bao giờ cắt */
  const normP=t=>(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  function guessObj(path){const p='/'+normP(path).replace(/[_\s]+/g,'-')+'/',w=re=>re.test(p);let type=null,layer=2,fn='Chặn đường';
    if(w(/[\/-](bong|shadow)[\/.-]/)){return {type:'Trang trí',layer:1,fn:'Chỉ trang trí'};}
    if(w(/[\/-](nhan-vat|char|hero|npc|nhan-vat)[\/.-]/))type='Nhân vật';
    else if(w(/[\/-](quai|monster|enemy|boss)[\/.-]/))type='Quái';
    else if(w(/[\/-](cay|tree|bui|co|hoa|tre|truc|lieu|trung|rung|la-)/))type='Cây';
    else if(w(/[\/-](nha|tram|chua|dinh|lau|tuu|mon|dien|mai|thap|kho|ren|leu|quan|tent|house|building|kien-truc|nha-cua)/))type='Nhà';
    else if(w(/[\/-](nuoc|song|suoi|thac|ao|water)/))type='Nước';
    else if(w(/[\/-](rao|tuong|cot|lan-can|fence|wall)/))type='Tường/hàng rào';
    else if(w(/[\/-](ban|ghe|thung|hop|ruong|binh|vat|den|bia|do-vat|chest|prop|cho)/))type='Đồ vật';
    else if(w(/[\/-](da|nui|thach|doi|deco|trang-tri|canh-quan|sen)/))type='Trang trí';
    if(w(/[\/-](che|lop-che|mai-che|overlay)[\/.-]/)){layer=3;fn='Chỉ trang trí';}
    if(type==='Trang trí'&&layer===2)fn='Đi được';
    return type?{type,layer,fn}:null;}
  /* nhận diện ô nền ISOMETRIC thật: phiến hình thoi (đỉnh nhọn trên + đáy nhọn dưới) có độ dày */
  function isoSlab(dd,w,h){if(w<48||h<24)return null;const wd=new Int32Array(h);let tot=0,mx=0;
    for(let y=0;y<h;y++){let a=-1,b=-1;for(let x=0;x<w;x++)if(dd[(y*w+x)*4+3]>40){if(a<0)a=x;b=x;tot++;}wd[y]=a<0?0:b-a+1;if(wd[y]>mx)mx=wd[y];}
    const rt=w/h,fill=tot/(w*h);if(mx<w*.9||rt<1.25||rt>3||fill<.4||fill>.9)return null;
    const t=wd[Math.floor(h*.06)],bt=wd[h-1-Math.floor(h*.06)];if(t>mx*.45||bt>mx*.45)return null;
    let sm=0,n=0;for(let y=0;y<h;y++)if(wd[y]>=mx*.97){sm+=y;n++;}if(!n)return null;const Ht=2*sm/n;if(Ht<w*.3||Ht>w*.85)return null;return {Ht};}
  /* ===== TỰ PHÂN LOẠI file nạp vào: theo tên/thư mục + đặc điểm hình ===== */
  function autoClass(path,f){const p='/'+normP(path||'').replace(/[_\s]+/g,'-')+'/',w=re=>re.test(p),B=(s)=>new RegExp('[\\/-]('+s+')([\\/.-]|$)');let type=null,layer=2,fn='Chặn đường',role=null;
    if(w(B('bong|shadow'))){return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};}
    if(w(B('door|gate|archway|cong-vom|cua-nha')))return {type:'Tường/hàng rào',layer:3,fn:'Chặn đường',role:'Mái/cửa'};
    if(w(B('lop-che|mai-che|overlay|roof|mai-nha|canopy|tan-che|lop-phu')))return {type:'Nhà',layer:3,fn:'Chỉ trang trí',role:'Mái/cửa'};
    if(w(B('decal|hoa-tiet|nen-lat|vet|suong|fog|hieu-ung|effect|puddle|stain|crack|o-sen|la-sen|cum-sen|luong-rau|ruong|dat-co|dat-nen|mat-nuoc|co-kho|rong-lat-san')))return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};
    if(w(B('nhan-vat|char|hero|npc|player')))return {type:'Nhân vật',layer:2,fn:'Chặn đường',role:'Nhân vật'};
    if(w(B('quai|monster|enemy|boss|slime|skeleton')))return {type:'Quái',layer:2,fn:'Chặn đường',role:'Quái'};
    if(w(B('cau|bridge|bac|bac-da|bac-thang|stairs|stair|ben-go|ben|dock|road|path|loi-van|lan-ranh|ramp|slope')))return {type:'Đường',layer:2,fn:'Đi được',role:'Hạ tầng'};
    if(w(B('quan-tai|coffin|bia|mo-bia|grave|tomb')))type='Đồ vật';
    else if(w(B('cay|tree|thong|bui|cum|trung|truc|lieu|dao-|palm|pine|bush|plant|flower|hoa|cactus|co-thu|oc-dao|rang')))type='Cây';
    else if(w(B('nha|tram|chua|dinh|lau|tuu|mieu|dien|thap|kho|ren|leu|quan|phu-de|hoang-cung|tent|house|building|hut|barn|shop|castle|temple|tower|kien-truc|nha-cua|cong-thanh|cong-')))type='Nhà';
    else if(w(B('nuoc|song|suoi|thac|ao|water|lake|river')))type='Nước';
    else if(w(B('rao|tuong|cot|lan-can|fence|wall|column|pillar|door|gate')))type='Tường/hàng rào';
    else if(w(B('ban|ghe|thung|hop|binh|chum|vat|den|bia|chest|barrel|crate|table|chair|prop|do-vat|coffin|quan-tai|grave|mo-bia|statue|tuong-da|lu|ruong-go|gia|de|khay|tu')))type='Đồ vật';
    else if(w(B('da|nui|thach|doi|deco|trang-tri|canh-quan|rock|stone')))type='Trang trí';
    if(!type&&f){const r=f.h/f.w;if(r<.28&&f.mean<.9){return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};}if(f.mean<.55)return {type:'Trang trí',layer:1,fn:'Chỉ trang trí',role:'Phủ nền'};type='Đồ vật';}
    if(type==='Trang trí')fn='Đi được';
    if(type==='Nước')fn='Chặn đường';
    const out={type:type||'Đồ vật',layer,fn,role:role||(type==='Cây'?'Cây':type==='Nhà'?'Nhà':'Vật')};
    if(f){const n=Math.max(1,Math.min(4,Math.round(f.w/220)));if(f.w>=100){out.fx=n;out.fy=n;}else{out.fx=1;out.fy=1;}}
    return out;}
  function featOf(g,b){const bw=b[2]-b[0],bh=b[3]-b[1];try{const d=g.getImageData(b[0],b[1],bw,bh).data,np=bw*bh;let op=0,sa=0;for(let q=0;q<np;q++){const a=d[q*4+3];if(a>24){op++;sa+=a;}}return {w:bw,h:bh,fill:op/np,mean:op?sa/op/255:0};}catch(x){return {w:bw,h:bh,fill:1,mean:1};}}
  async function addWhole(items, detail=false, archiveName=''){if(!items.length)return;const T=128,CAP=256,COLS=16;const HS=new Set(TG.hashes||[]);let dupI=0,dupO=0,dupW=0,dupX=0;const GR=[],ISOL=[];const fnv=(d,n)=>{let h=2166136261>>>0;for(let i=0;i<n;i++){h^=d[i];h=Math.imul(h,16777619)>>>0;}return h.toString(36);};const fnvS=t=>{let h=2166136261>>>0;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(36)+t.length.toString(36);};
    let pend=[];let sheetsMade=0,objs=0,cur=null,cnt=0,base=(archiveName||(items.length===1?items[0].name.replace(/\.\w+$/,''):'Hinh')).slice(0,16);
    const flush=async()=>{if(!cur||!cnt)return;const c=el('canvas',{width:Math.min(cnt,cur.CO)*cur.T,height:Math.ceil(cnt/cur.CO)*cur.T});c.getContext('2d').drawImage(cur.c,0,0);const s={name:(base+'-'+(++sheetsMade)).slice(0,24),url:c.toDataURL('image/png'),tw:cur.T,margin:0};await loadSheet(s);sheets.push(s);uniqNames(sheets);for(const q of pend)TG.tiles[s.name+'#'+q.idx]={type:q.type,layer:q.layer,fn:q.fn,role:q.role,fx:q.fx,fy:q.fy,sc:q.sc,ox:q.ox,oy:q.oy,source:q.source};pend=[];cur=null;cnt=0;};
    const put=(src,sx,sy,sw,sh,tg)=>{const need=Math.max(128,Math.min(768,Math.ceil((Math.max(sw,sh)+4)/64)*64)),CO=need>256?6:16,CP=need>256?24:256;
      if(!cur||cnt>=cur.CP||cur.T!==need){return flush().then(()=>{const c=document.createElement('canvas');c.width=CO*need;c.height=Math.ceil(CP/CO)*need;cur={c,g:c.getContext('2d'),T:need,CO,CP};cur.g.imageSmoothingQuality='high';return put(src,sx,sy,sw,sh,tg);});}
      const T=cur.T,COLS=cur.CO;if(tg)pend.push({idx:cnt,type:tg.type,layer:tg.layer,fn:tg.fn,role:tg.role,fx:tg.fx==null?0:tg.fx,fy:tg.fy==null?0:tg.fy,sc:T/128,source:tg.source,ox:tg.offsetX?(tg.offsetX/T):0,oy:tg.offsetY?(tg.offsetY/T):0});
      const k=Math.min(1,(T-4)/sw,(T-4)/sh),w=Math.max(1,Math.round(sw*k)),h=Math.max(1,Math.round(sh*k)),ox=(cnt%COLS)*T+Math.floor((T-w)/2),oy=Math.floor(cnt/COLS)*T+T-2-h;cur.g.drawImage(src,sx,sy,sw,sh,ox,oy,w,h);cnt++;objs++;};
    let i=0;for(const it of items){i++;if(i%10===1)toast('Đang xử lý ảnh '+i+'/'+items.length+'…');
      const hashInput=it.frame ? [it.url,it.frame.kind,it.frame.x,it.frame.y].join('|') : it.url;
      const ih='i'+fnvS(hashInput);
      if(HS.has(ih)){dupI++;continue;}
      if(it.frame){
        const {width:w,height:h}=it.decoded;
        const {kind,x,y}=it.frame;
        if(kind==='groundTexture'){
          GR.push(it.decoded);
        }else if(kind==='terrain'){
          ISOL.push({bm:it.decoded,b:[0,0,w,h],iso:{Ht:w/2}});
        }else{
          const tag=autoClass(it.path,{w,h,mean:1});
          if(kind==='layer'){
            const overlay=/(?:[-_]cover\.|roof|mái|canopy)/i.test(it.path);
            Object.assign(tag,{type:'Nhà',layer:overlay?3:2,fn:overlay?'Chỉ trang trí':'Chặn đường',role:overlay?'Mái/cửa':'Nhà'});
          }
          await put(it.decoded,0,0,w,h,{...tag,source:it.path||it.name,offsetX:x,offsetY:y});
        }
        HS.add(ih);continue;
      }
      let bm=it.decoded;
      if(!bm)try{const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=it.url;});bm=im;}catch(e){if(detail)throw e;continue;}
      HS.add(ih);
      const W=bm.naturalWidth||bm.width,H=bm.naturalHeight||bm.height;let boxes=[[0,0,W,H]];const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(bm,0,0);
      if(W>=16&&H>=16){try{const dd=g.getImageData(0,0,W,H).data,np=W*H;let op=0,wt=0;for(let q=0;q<np;q++){if(dd[q*4+3]>=250){op++;if(dd[q*4]>=240&&dd[q*4+1]>=240&&dd[q*4+2]>=240)wt++;}}
        if(op>=np*0.97){if(wt>np*0.9){dupW++;continue;}if(W>256||H>256){dupX++;continue;}const gh='o'+fnv(dd,dd.length)+'-'+W+'x'+H;if(HS.has(gh)){dupO++;continue;}HS.add(gh);GR.push(bm);continue;}}catch(e){}}
      if(W>T||H>T){try{const B=4,gw=Math.ceil(W/B),gh=Math.ceil(H/B);const d=g.getImageData(0,0,W,H).data;
        const occ=new Uint8Array(gw*gh);let tr=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=d[(y*W+x)*4+3];if(a<250)tr++;const o4=(y*W+x)*4;if(a>16&&!(a>=250&&d[o4]>=245&&d[o4+1]>=245&&d[o4+2]>=245))occ[Math.floor(y/B)*gw+Math.floor(x/B)]=1;}
        if(tr>W*H*0.02){const G=2,dil=new Uint8Array(gw*gh);for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(occ[y*gw+x])for(let yy=Math.max(0,y-G);yy<=Math.min(gh-1,y+G);yy++)for(let xx=Math.max(0,x-G);xx<=Math.min(gw-1,x+G);xx++)dil[yy*gw+xx]=1;
          const lab=new Int32Array(gw*gh),bb=[];let L=0;for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){if(!dil[y*gw+x]||lab[y*gw+x])continue;L++;const st=[[x,y]];lab[y*gw+x]=L;let x0=1e9,y0=1e9,x1=-1,y1=-1;
            while(st.length){const [cx,cy]=st.pop();if(occ[cy*gw+cx]){x0=Math.min(x0,cx);x1=Math.max(x1,cx);y0=Math.min(y0,cy);y1=Math.max(y1,cy);}
              for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=gw||ny>=gh)continue;const q=ny*gw+nx;if(dil[q]&&!lab[q]){lab[q]=L;st.push([nx,ny]);}}}
            if(x1>=0)bb.push([x0*B,y0*B,Math.min(W,(x1+1)*B),Math.min(H,(y1+1)*B)]);}
          let ch=true;while(ch){ch=false;for(let a=0;a<bb.length&&!ch;a++)for(let b=a+1;b<bb.length;b++){const p=bb[a],q=bb[b];if(p[0]<q[2]&&q[0]<p[2]&&p[1]<q[3]&&q[1]<p[3]){bb[a]=[Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[2],q[2]),Math.max(p[3],q[3])];bb.splice(b,1);ch=true;break;}}}
          const ok=bb.filter(b=>(b[2]-b[0])>=8&&(b[3]-b[1])>=8);if(ok.length&&ok.length<=80)boxes=ok.sort((p,q)=>(p[1]-q[1])||(p[0]-q[0]));}}catch(e){}}
      for(const b of boxes){const bw=b[2]-b[0],bh=b[3]-b[1];let oh='',isoHit=false;try{const dd=g.getImageData(b[0],b[1],bw,bh).data;{let wt=0,tt=0;const np=bw*bh;for(let q=0;q<np;q++){const a=dd[q*4+3];if(a<250)tt++;else if(dd[q*4]>=240&&dd[q*4+1]>=240&&dd[q*4+2]>=240)wt++;}if(wt>np*0.35&&tt<np*0.1){dupW++;continue;}}oh='o'+fnv(dd,dd.length)+'-'+bw+'x'+bh;if(!HS.has(oh)){const iso=isoSlab(dd,bw,bh);if(iso){HS.add(oh);ISOL.push({bm,b,iso});isoHit=true;}}}catch(e){}if(isoHit)continue;if(oh&&HS.has(oh)){dupO++;continue;}if(oh)HS.add(oh);await put(bm,b[0],b[1],bw,bh,{...autoClass(it.path||it.name,featOf(g,b)),source:it.path||it.name});}}
    await flush();
    if(GR.length){const GT2=32,GC=Math.min(16,GR.length),cv=document.createElement('canvas');cv.width=GC*GT2;cv.height=Math.ceil(GR.length/GC)*GT2;const cg=cv.getContext('2d');cg.imageSmoothingQuality='high';GR.forEach((im,k)=>cg.drawImage(im,(k%GC)*GT2,Math.floor(k/GC)*GT2,GT2,GT2));
      const gs={name:('Nen-'+Date.now().toString(36).slice(-4)),url:cv.toDataURL('image/png'),tw:GT2,margin:0};await loadSheet(gs);sheets.push(gs);uniqNames(sheets);GR.forEach((_,k)=>{TG.tiles[gs.name+'#'+k]={type:'Đường',layer:0,fn:'Đi được'};});sheetsMade++;}
    if(ISOL.length){const T2=128,GC=Math.min(16,ISOL.length),cv=document.createElement('canvas');cv.width=GC*T2;cv.height=Math.ceil(ISOL.length/GC)*T2;const cg=cv.getContext('2d');cg.imageSmoothingQuality='high';
      ISOL.forEach((q,k)=>{const bw=q.b[2]-q.b[0],bh=q.b[3]-q.b[1];const kx=T2/bw;let ky=(T2/2)/q.iso.Ht;if(bh*ky>T2)ky=T2/bh;cg.drawImage(q.bm,q.b[0],q.b[1],bw,bh,(k%GC)*T2,Math.floor(k/GC)*T2,T2,bh*ky);});
      const is={name:('Iso-'+Date.now().toString(36).slice(-4)),url:cv.toDataURL('image/png'),tw:T2,margin:0,iso:1};await loadSheet(is);sheets.push(is);uniqNames(sheets);ISOL.forEach((_,k)=>{TG.tiles[is.name+'#'+k]={type:'Đường',layer:0,fn:'Đi được'};});sheetsMade++;}
    TG.hashes=[...HS].slice(-60000);tgSave();after();if(sheetsMade)curSheet=sheets.length-1;draw();if(detail)return {pieces:objs+GR.length+ISOL.length};toast('Đã nạp '+objs+' vật mới'+(GR.length?' + '+GR.length+' ô NỀN':'')+(ISOL.length?' + '+ISOL.length+' ô ISO (phiến hình thoi)':'')+' ('+sheetsMade+' tileset). Bỏ '+dupI+' ảnh trùng + '+dupO+' vật trùng'+(dupW?', loại '+dupW+' ảnh NỀN TRẮNG (lỗi, không dùng được)':'')+(dupX?', loại '+dupX+' ảnh CHỤP MÀN HÌNH/ẢNH NỀN LỚN (không phải sprite)':'')+'.');return sheetsMade;}
  async function addMany(items){if(!items.length)return;if(items.length>40&&!(await yes('Thêm '+items.length+' ảnh làm tileset? Nhiều ảnh có thể làm đầy bộ nhớ tự lưu của trình duyệt.')))return;
    const g=await guessTile(items[0].url);const tw=+(await ask((g?'Ảnh đầu tiên: app đoán ô '+g.tw+' px, khe '+g.m+' px. ':'')+'Kích thước mỗi ô (px) — áp dụng cho cả '+items.length+' ảnh?',g?String(g.tw):'16'));if(!tw)return;const m=+(await ask('Khoảng cách giữa các ô (px)?',g?String(g.m):'0'))||0;let first=-1,n=0;
    for(const it of items){const s={name:it.name.replace(/\.\w+$/,'').slice(0,24),url:it.url,tw,margin:m};await loadSheet(s);sheets.push(s);uniqNames(sheets);if(first<0)first=sheets.length-1;n++;}
    curSheet=first;after();draw();toast('Đã thêm '+n+' tileset');}
  function addSheet(){pickFiles('image/*',items=>addWhole(items),false);}
  function addGridSheet(){pickFiles('image/*',items=>items.length===1?addSheetUrl(items[0].url,items[0].name):addMany(items),false);}
  /* Nạp nhiều gói zip một lần, tự phân loại: Tiles/ → 1 tileset ghép lưới; Atlas/ → tileset; còn lại (Sprites, lớp phủ…) bỏ qua để nhẹ máy */
  async function bulkPacks(){const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept='.zip,.rar,application/zip,application/x-zip-compressed';
    inp.onchange=async()=>{const fs=[...inp.files];if(!fs.length)return;let nt=0,na=0,skip=0;const seen=new Set();
      for(const f of fs){toast('Đang đọc '+f.name+'…');let u8;try{u8=new Uint8Array(await f.arrayBuffer());}catch(e){continue;}
        const key=f.name.replace(/^[0-9a-f]{8}-/,'')+'|'+f.size;if(seen.has(key)){skip++;continue;}seen.add(key);
        const pk=f.name.replace(/^[0-9a-f]{8}-/,'').replace(/\.zip$/i,'').slice(0,18);let files;
        try{files=unzipSync(u8,{filter:e=>/\.(png|json)$/i.test(e.name)&&!/(^|\/)(__MACOSX|\._)/.test(e.name)&&/(^|\/)(Tiles|Atlas)\//i.test(e.name)});}catch(e){continue;}
        const tiles=Object.keys(files).filter(n=>/(^|\/)Tiles\/[^\/]+\.png$/i.test(n)).sort(),atl=Object.keys(files).filter(n=>/(^|\/)Atlas\/[^\/]+\.png$/i.test(n)).sort();
        const toUrl=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b);});
        if(tiles.length){const T=64,cols=Math.min(16,tiles.length),rows=Math.ceil(tiles.length/cols),c=document.createElement('canvas');c.width=cols*T;c.height=rows*T;const g=c.getContext('2d');g.imageSmoothingQuality='high';
          for(let i=0;i<tiles.length;i++){try{const bm=await createImageBitmap(new Blob([files[tiles[i]]],{type:'image/png'}));g.drawImage(bm,(i%cols)*T,Math.floor(i/cols)*T,T,T);}catch(e){}}
          const s={name:(pk+'-Tiles').slice(0,24),url:c.toDataURL('image/png'),tw:T,margin:0};await loadSheet(s);sheets.push(s);nt++;}
        for(const n of atl){const jn=n.replace(/\.png$/i,'.json');let fr=null;try{fr=Object.values(JSON.parse(new TextDecoder().decode(files[jn])).frames||{});}catch(e){}
          const nm=(pk+'-'+n.split('/').pop().replace(/\.png$/i,'')).slice(0,24);let bmA;try{bmA=await createImageBitmap(new Blob([files[n]],{type:'image/png'}));}catch(e){continue;}
          if(!fr||!fr.length){skip++;continue;}
          /* mỗi vật trong atlas → 1 ô 128×128 (thu nhỏ vừa khung, đặt chân ở đáy) để không bị cắt vỡ */
          const T=128,cols=Math.min(8,fr.length),rows=Math.ceil(fr.length/cols),c=document.createElement('canvas');c.width=cols*T;c.height=rows*T;const g=c.getContext('2d');g.imageSmoothingQuality='high';
          fr.forEach((q,i)=>{const f=q.frame;if(!f)return;const k=Math.min((T-4)/f.w,(T-4)/f.h);const w=f.w*k,h=f.h*k;g.drawImage(bmA,f.x,f.y,f.w,f.h,(i%cols)*T+(T-w)/2,Math.floor(i/cols)*T+T-2-h,w,h);});
          const sh={name:nm,url:c.toDataURL('image/png'),tw:T,margin:0};await loadSheet(sh);sheets.push(sh);na++;}}
      uniqNames(sheets);if(nt+na)curSheet=sheets.length-1;after();draw();
      toast('Đã nạp '+nt+' tileset ô nền + '+na+' atlas'+(skip?' (bỏ '+skip+' gói trùng)':'')+'. Sprites/lớp phủ bỏ qua để nhẹ.');};
    inp.click();}
  /* ---- Gói xuong-pack (.zip): app tự đọc pack.json, sinh bộ nền + bộ vật, báo vai trò/họ bố cục ---- */
  let packResults=[],importingPacks=false,packRegistryReady=Promise.resolve();
  const savedPackIds=new Set();
  let VIDX=[];async function refreshProfiles(){VIDX=await vatIndex();loadProfiles(VIDX);}
  function packReport(){
    if(!packResults.length)return null;
    const count=status=>packResults.filter(p=>p.status===status).length;
    const labels={busy:'Đang xử lý',queued:'Đang chờ',ok:'Đã nạp',existing:'Đã có',image_done:'Đã nhập ảnh',images:'Chờ chọn ảnh',empty:'Không có ảnh',error:'Không đọc được'};
    const summary=['ok','existing','image_done','images','empty','error','busy','queued'].filter(k=>count(k)).map(k=>labels[k]+' '+count(k)).join(' · ');
    const box=el('section',{class:'pack-results','aria-label':'Kết quả nạp gói'},
      el('strong',{},'Kết quả nạp '+packResults.length+' tệp'),el('p',{class:'hint',role:'status'},summary));
    for(const p of packResults){
      const row=el('details',{class:'pack-result','data-result':p.status},
        el('summary',{},labels[p.status]+' · '+p.file.name));
      if(p.status==='ok'){
        row.append(el('p',{class:'hint'},p.name+' · '+p.nItems+' mảnh · '+p.nGround+' ô nền'),
          el('p',{class:'hint'},savedPackIds.has(p.id)?'Đã lưu trong trình duyệt này.':'Chỉ có trong phiên này. Trình duyệt chưa lưu được gói.'),
          el('p',{class:'hint'},'Vai trò: '+p.roles.map(r=>ROLES[r]||r).join(', ')));
      }
      for(const e of p.errors||[])row.append(el('p',{class:'hint'},e));
      for(const f of p.families||[])row.append(el('p',{class:'hint'},f.name+' · '+(f.ok?'Dựng được':'Thiếu '+f.miss.join(', '))));
      for(const warning of (p.warns||[]).slice(0,12))row.append(el('p',{class:'hint'},warning));
      if(p.status==='images')row.append(el('p',{class:'hint'},'Mở danh sách ảnh trong tệp bạn vừa chọn, rồi tích các ảnh cần đưa vào dự án.'),
        btn('Mở danh sách ảnh',()=>openImagesFor([p.file])));
      if(p.status==='error')row.append(el('p',{class:'hint'},p.readFailed?
        'Thử mở bản gốc bằng 7-Zip hoặc WinRAR. Nếu tệp mở được, hãy giải nén rồi nén lại thành ZIP. Nếu công cụ cũng báo lỗi, hãy tải lại tệp gốc.':
        'Kiểm tra khai báo và các ảnh trong gói, hoặc nhập từ bản gốc đã được sửa.'));

      row.open=p.status==='images'||p.status==='error';
      box.append(row);
    }
    return box;
  }
  function installedPackList(){
    const packs=customPackRecords();
    return el('details',{class:'installed-packs'},
      el('summary',{},'Gói đã nạp ('+packs.length+')'),
      packs.length?el('ul',{},packs.map(({id,vat,nen})=>el('li',{},
        el('strong',{},vat.name),el('p',{class:'hint'},
          (vat.sourceFile?vat.sourceFile+' · ':'')+vat.items.length+' mảnh · '+(nen?.sourceCount??new Set(Object.values(nen?.idx||{})).size)+' ô nền · '+
          (savedPackIds.has(id)?'Đã lưu trong trình duyệt':'Chỉ có trong phiên này'))))):
        el('p',{class:'hint'},'Chưa có gói Xưởng nào trong trình duyệt này.'));
  }
  let stockArchiveIndex=null, stockArchiveRequest=null, stockArchiveGroup='', stockArchiveFile='', stockArchiveOpen=false;
  async function openStockArchive(pack){
    const rows=[pack];
    if(pack.name==='SBS - Isometric Town Pack.rar'){
      const recipes=stockArchiveIndex.find(item=>item.name==='SBS - Isometric Town Examples.rar');
      if(recipes)rows.push(recipes);
    }
    await openImagesFor(await Promise.all(rows.map(fetchStockArchive)));
  }
  async function fetchStockArchive(pack){
    if(!pack)throw Error('Gói cần dùng chưa có trong kho.');
    const parts=await Promise.all((pack.parts||[pack.file]).map(async file=>{
      const response=await fetch('packs/'+file);
      if(!response.ok)throw new Error('Không tải được '+pack.name);
      return response.blob();
    }));
    return new File(parts,pack.name.replace(/\.rar$/i,'.zip'),{type:'application/zip'});
  }
  async function stockPackList(){
    if(stockArchiveIndex)return stockArchiveIndex;
    if(!stockArchiveRequest){
      stockArchiveRequest=fetch('packs/index.json').then(response=>{
        if(response.status===404)return [];
        if(!response.ok)throw Error('Không tải được danh sách gói.');
        return response.json();
      }).then(index=>stockArchiveIndex=index).finally(()=>{stockArchiveRequest=null;});
    }
    return stockArchiveRequest;
  }
  const stockByFile=file=>stockArchiveIndex.find(item=>item.file===file);
  const availableScene=pack=>stockScenes.find(scene=>scene.files[0]===pack.file||
    scene.id==='town'&&scene.files.includes(pack.file));
  function builtinArchivePanel(){
    const box=el('details',{class:'installed-packs'});
    if(stockArchiveOpen)box.open=true;
    box.append(el('summary',{},'Kho gói có sẵn'+(stockArchiveIndex?' ('+stockArchiveIndex.length+')':'')));
    box.addEventListener('toggle',()=>{
      stockArchiveOpen=box.open;
      if(!box.open||stockArchiveIndex||stockArchiveRequest)return;
      void stockPackList().then(()=>{
        if(tab==='res')keepScroll(draw);
      }).catch(error=>{
        box.append(el('p',{class:'hint',role:'status'},error.message+' Đóng rồi mở lại để thử.'));
      });
    });
    if(!stockArchiveIndex)return box;
    const families=[...new Set(stockArchiveIndex.map(pack=>pack.family))];
    if(!families.includes(stockArchiveGroup))stockArchiveGroup=families[0];
    const rows=stockArchiveIndex.filter(pack=>pack.family===stockArchiveGroup);
    const current=rows.find(pack=>pack.file===stockArchiveFile)||rows[0];
    const family=el('select',{class:'num inventory-select','aria-label':'Nhóm gói có sẵn',onchange:()=>{
      stockArchiveGroup=family.value;
      keepScroll(draw);
    }},families.map(name=>el('option',{value:name},name)));
    family.value=stockArchiveGroup;
    const choose=el('select',{class:'num inventory-select','aria-label':'Gói tài nguyên có sẵn',onchange:()=>{
      stockArchiveFile=choose.value;
      keepScroll(draw);
    }},rows.map(pack=>el('option',{value:pack.file},pack.name+' · '+pack.images+' ảnh'+(pack.reference?' nguồn':'') )));
    choose.value=current.file;
    const browse=btn('Xem và nhập ảnh',async()=>{
      browse.disabled=true;
      browse.textContent='Đang tải gói…';
      try{await openStockArchive(current);}catch(error){toast(error.message);}
      finally{browse.disabled=false;browse.textContent='Xem và nhập ảnh';}
    },'on');
    const scene=availableScene(current);
    const label=scene?.kind==='original'?'Dựng bản đồ gốc':'Ráp cảnh theo ảnh mẫu';
    box.append(family,choose,el('div',{class:'row'},btn('Thư viện cảnh ZIP',showStockScenes,'on'),
      scene?btn(label,()=>addStockScene(scene)):null,
      btn('Tạo bản đồ mới…',()=>openSceneGenerator(current),'on'),btn('Tiêu chí dựng cảnh',showSettlementRules),current.images?browse:null,
      current.parts?btn('Tải gói ZIP',async()=>{
        try{const zip=await fetchStockArchive(current);saveFile(zip.name,zip);}
        catch(error){toast(error.message);}
      }):el('a',{href:'packs/'+current.file,download:'',class:'b'},'Tải gói ZIP')));
    box.append(el('p',{class:'hint'},packPurpose(current.file)+' · '+(scene?
      scene.kind==='original'?'Có dữ liệu cảnh gốc':'Có cảnh ráp sẵn theo ảnh':
      current.file==='sbs-isometric-object-pack.zip'?'TMX chỉ có ô trống':'Có tài nguyên để ghép cảnh')));
    if(current.reference)box.append(el('p',{class:'hint'},current.name.startsWith('tree_')?
      'Mô hình cây có ở 3D → Mô hình. Ảnh trong gói này là vật liệu nguồn.':'Gói này chứa tư liệu, vật liệu nguồn hoặc dữ liệu ghép ảnh.'));
    return box;
  }
  const townPack=p=>p.file?.startsWith('sbs-isometric-town-');
  async function readStockScenePack(p){
    const file=await fetchStockArchive(p);
    return openScenePack(p.name,new Uint8Array(await file.arrayBuffer()));
  }
  const readTown=()=>Promise.all(stockArchiveIndex.filter(townPack).map(readStockScenePack));
  let assemblingScene=false;
  async function assembleScene(build){
    if(assemblingScene)return;
    assemblingScene=true;
    toast('Đang dựng bản đồ…');
    try{
      const scenes=await build(),updated=sheets.slice(),maps=[],notes=[];
      for(const {w,h,name,sheets:source,ents,blocked,ground,links,gaps,summary,origin} of scenes){
        const ids=[];
        for(const sheet of source)ids.push(await loadBuiltinSheet(sheet,updated));
        const remap=tile=>{if(tile)tile.sid=ids[tile.sid];};
        for(const e of ents){
          if(e.door){
            for(const v of Object.values(e.door.v))v.tile={...v.tile};
            for(const v of Object.values(e.door.v))remap(v.tile);
          }
          remap(e.tile);
        }
        const map=newMap(w,h);
        Object.assign(map,{name,ents,cfg:{...map.cfg,view:'iso',proj:'iso',smooth:false,win:origin?.kind==='original'&&!ents.some(e=>e.t==='goal')?'explore':'goal',...(summary?{settlement:summary}:{}),...(origin?{stockScene:origin}:{})}});
        if(blocked)map.blk=blocked;
        if(ground)map.layers[0]=ground.map(sid=>sid==null?enc(0,0):enc(ids[sid],0));
        if(links)map.links=links;
        maps.push(map);
        if(summary?.draft){const issue=settlementIssues(map)[0];notes.push('Bản nháp · '+issue.name+' · X '+issue.x+' · Y '+issue.y+'. Mở Kiểm để xem.');}
        if(summary)notes.push(summary.buildings+' nhà, '+summary.groves+' cụm cây, '+summary.bridges+' cầu.'+(summary.sources?' Dùng '+summary.sources.length+' nguồn.':''));
        notes.push(...(gaps||[]));
      }
      const first=MAPS.length;
      for(const [i,map] of maps.entries()){
        if(map.links&&maps.length===2){
          const other=i===0?1:0;
          const entry=map.links[i],exit=maps[other].links[other];
          map.ents.push({id:'link-'+i,t:'door',name:'Đổi tầng',x:Math.floor(entry[0]),y:Math.floor(entry[1]),
            to:first+other,tx:Math.floor(exit[0]),ty:Math.floor(exit[1])});
        }
        delete map.links;
      }
      syncCur();sheets.push(...updated.slice(sheets.length));MAPS.push(...maps);
      useTool('draw');switchMap(MAPS.length-maps.length);
      if(!scenes[0].ground&&M.ents.length){
        const xs=M.ents.map(e=>e.x),ys=M.ents.map(e=>e.y);
        sel={x0:Math.min(...xs)-2,y0:Math.min(...ys)-2,x1:Math.max(...xs)+2,y1:Math.max(...ys)+2};
        selFocus();sel=null;
      }
      toast('Đã dựng '+maps.length+' màn mới · '+scenes.map(scene=>scene.name).join(', ')+(notes.length?' · '+notes.join(' '):''));
    }catch(error){toast('Chưa dựng được bản đồ: '+error.message);}
    finally{assemblingScene=false;}
  }
  function addStockScene(item){
    return assembleScene(async()=>{
      await stockPackList();
      const packs=await Promise.all(item.files.map(file=>readStockScenePack(stockByFile(file))));
      const scenes=item.kind==='original'?await reconstructPack(packs,{sample:item.id==='town'}):
        [await buildReferenceScene(item.id,packs)];
      return scenes.map(scene=>({...scene,origin:{id:item.id,kind:item.kind,files:item.files}}));
    });
  }
  function showStockScenes(){
    const dialog=el('dialog',{class:'asset-import','aria-label':'Thư viện cảnh ZIP'});
    const cards=el('div',{class:'zip-scene-cards'});
    for(const item of stockScenes){
      const card=el('article',{class:'zip-scene-card'},el('h3',{},item.label),
        el('p',{class:'hint'},item.kind==='original'?'Dữ liệu bố cục gốc':'Ráp từ mảnh gốc theo ảnh mẫu'));
      if(item.kind==='reference')card.append(el('img',{loading:'lazy',alt:item.label,src:'scenery/scene-'+item.id+'.webp'}));
      card.append(btn('Thêm vào dự án',()=>{dialog.close();void addStockScene(item);},'on'));
      cards.append(card);
    }
    dialog.append(el('header',{},el('h2',{},'Thư viện cảnh ZIP'),btn('Đóng',()=>dialog.close())),cards);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    document.body.append(dialog);dialog.showModal();
  }
  function chooseTiledArchives(){
    const input=el('input',{type:'file',accept:'.zip',multiple:''});
    input.onchange=()=>{
      const files=[...input.files];
      if(files.length)void assembleScene(async()=>reconstructPack(await Promise.all(files.map(async file=>
        openScenePack(file.name,new Uint8Array(await file.arrayBuffer()))))));
    };
    input.click();
  }
  function showSettlementRules(){
    let number=0;
    const dialog=el('dialog',{class:'asset-import','aria-label':'Tiêu chí dựng cảnh'});
    dialog.append(el('header',{},el('h2',{},'Tiêu chí dựng cảnh 2D'),
      el('button',{class:'b',onclick:()=>dialog.close()},'Đóng')));
    for(const [title,rules] of settlementCriteria){
      dialog.append(el('details',{open:''},el('summary',{},title),...rules.map(([status,rule])=>
        el('p',{class:'hint'},(++number)+'. '+rule+' · '+status))));
    }
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    document.body.append(dialog);dialog.showModal();
  }
  function openSceneGenerator(current){
    const dialog=el('dialog',{class:'asset-import','aria-label':'Tạo bản đồ mới'});
    const choose=(label,selected)=>{
      const field=el('select',{class:'num inventory-select','aria-label':label},
        stockArchiveIndex.map(p=>el('option',{value:p.file},p.name)));
      field.value=selected;return field;
    };
    const terrain=/bases|landscape|overworld|pathways|textures-floor/.test(current.file);
    const ground=choose('Gói nền chính',terrain||/miniature-(farm|dungeon)/.test(current.file)?current.file:'kenney-isometric-roads.zip');
    const props=choose('Gói đạo cụ chính',terrain||townPack(current)?'sbs-isometric-crates-pack-128x128.zip':current.file);
    const localGround=el('input',{type:'file',accept:'.zip',multiple:'','aria-label':'ZIP nền từ máy'});
    const localProps=el('input',{type:'file',accept:'.zip',multiple:'','aria-label':'ZIP vật thể từ máy'});
    const farmFile='kenney-isometric-miniature-farm.zip',cityFile='kenney-isometric-buildings.zip';
    const structure=el('select',{class:'num inventory-select','aria-label':'Kiến trúc'},
      [['town','SBS Town · nhà phố'],['farm','Kenney Farm · nhà gỗ'],['mix','Nhà phố SBS và nhà gỗ'],['city','Kenney Buildings · phố khối']].map(([value,name])=>el('option',{value},name)));
    structure.value=current.file===farmFile?'farm':/isometric-(buildings|city|vehicles)/.test(current.file)?'city':'mix';
    const packs=stockArchiveIndex.map(pack=>({pack,
      floor:el('input',{type:'checkbox','aria-label':'Nền · '+pack.name}),
      prop:el('input',{type:'checkbox','aria-label':'Đạo cụ · '+pack.name})}));
    const packRows=el('div',{class:'zip-pack-choices'},...packs.map(({pack,floor,prop})=>
      el('div',{},el('span',{},pack.name,el('small',{},packPurpose(pack.file))),el('label',{},floor,' Nền'),el('label',{},prop,' Đạo cụ'))));
    const filter=el('input',{type:'search',placeholder:'Tìm gói hoặc vai trò','aria-label':'Tìm gói để phối',
      oninput:()=>{const query=filter.value.toLowerCase().trim();for(const row of packRows.children)row.hidden=!row.textContent.toLowerCase().includes(query);}});
    const useVariety=el('input',{type:'checkbox','aria-label':'Phối thêm gói phù hợp tự động'});
    const autoPacks=(role,seed)=>{
      if(!useVariety.checked)return [];
      const allowed=role==='floor'?/miniature-(?:bases|farm|dungeon)|floor-pack|overworld/:
        /crates-pack|miniature-(?:farm|dungeon|library)|object-pack/;
      const eligible=stockArchiveIndex.filter(pack=>allowed.test(pack.file));
      if(!eligible.length)return [];
      const n=Array.from(seed).reduce((hash,c)=>Math.imul(hash^c.codePointAt(0),16777619)>>>0,2166136261);
      return [eligible[n%eligible.length],eligible[(n+1)%eligible.length]];
    };
    const newSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();
    const seed=el('input',{type:'text',maxlength:40,value:newSeed(),class:'num inventory-select',required:''});
    const profile=el('select',{class:'num inventory-select','aria-label':'Kiểu màn'},
      Object.entries(settlementProfiles).map(([value,name])=>el('option',{value},name)));
    const length=(value,label)=>el('input',{type:'number',class:'num',min:18,max:64,step:1,value,required:'','aria-label':label});
    const width=length(34,'Chiều rộng'),height=length(28,'Chiều cao');
    const landscape=el('select',{class:'num inventory-select','aria-label':'Địa hình'},
      [['river','Khu dân cư ven sông'],['creek','Làng bên suối'],['land','Khu dân cư nội địa']].map(([value,name])=>el('option',{value},name)));
    const form=el('form',{onsubmit:ev=>{
      ev.preventDefault();
      const pick=field=>stockArchiveIndex.find(p=>p.file===field.value);
      const g=pick(ground),p=pick(props),seedValue=seed.value.trim()||newSeed(),w=width.valueAsNumber,h=height.valueAsNumber;
      const gFiles=[...localGround.files],pFiles=[...localProps.files],style=landscape.value,levelProfile=profile.value,kit=structure.value;
      const groundPacks=[...(gFiles.length?[]:[g]),...packs.filter(p=>p.floor.checked).map(p=>p.pack),...autoPacks('floor',seedValue)];
      const propPacks=[...(pFiles.length?[]:[p]),...packs.filter(p=>p.prop.checked).map(p=>p.pack),...autoPacks('prop',seedValue)];
      dialog.close();
      void assembleScene(async()=>{
        const nativeRoads=stockByFile('kenney-isometric-roads.zip');
        const cache=new Map();
        const read=pack=>{
          if(!pack)return Promise.reject(Error('Gói cần dùng chưa có trong kho.'));
          if(!cache.has(pack.file))cache.set(pack.file,readStockScenePack(pack));
          return cache.get(pack.file);
        };
        const readMany=async(stock,files)=>[
          ...await Promise.all([...new Set(stock)].map(read)),
          ...await Promise.all(files.map(async f=>openScenePack(f.name,new Uint8Array(await f.arrayBuffer()))))
        ];
        const trees=fetch('scenery/Settlement-Trees.zip').then(async response=>{
          if(!response.ok)throw Error('Không nạp được bộ cây.');
          return openScenePack('Tree Pack',new Uint8Array(await response.arrayBuffer()));
        });
        const [network,original,farm,city,groves,floor,objects]=await Promise.all([read(nativeRoads),
          ['town','mix'].includes(kit)?readTown().then(packs=>reconstructPack(packs,{sample:true})):null,
          ['farm','mix'].includes(kit)?read(stockByFile(farmFile)):null,kit==='city'?read(stockByFile(cityFile)):null,
          trees,readMany(groundPacks,gFiles),readMany(propPacks,pFiles)]);
        return [await generateScene({ground:floor,objects,seed:seedValue,w,h,town:original?.[0],farm,city,network,trees:groves,style,profile:levelProfile})];

      });
    }},
      el('label',{},'Kiểu màn',profile),el('label',{},'Địa hình',landscape),el('label',{},'Gói nền chính',ground),el('label',{},'Gói đạo cụ chính',props),
      el('label',{},'Kiến trúc',structure),
      el('label',{},useVariety,' Tự chọn thêm gói nền và đạo cụ phù hợp'),
      el('details',{},el('summary',{},'Chọn thêm từ '+packs.length+' gói'),filter,packRows),
      el('details',{},el('summary',{},'Dùng gói ZIP trên máy'),el('div',{class:'row'},el('label',{},'Nền ',localGround),el('label',{},'Vật thể ',localProps))),
      el('div',{class:'row'},el('label',{},'Mã bố cục',seed),el('button',{type:'button',class:'b',onclick:()=>{seed.value=newSeed();}},'Đổi mã')),
      el('p',{class:'hint'},'Nhập lại cùng mã và các lựa chọn để dựng lại bố cục.'),
      el('div',{class:'row'},el('label',{},'Rộng ',width),el('label',{},'Cao ',height),'ô'),
      el('button',{type:'submit',class:'b on'},'Dựng màn mới'));
    dialog.append(el('header',{},el('h2',{},'Tạo bản đồ mới'),btn('Đóng',()=>dialog.close())),form);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    document.body.append(dialog);dialog.showModal();
  }
  function chooseArchiveFiles(){
    if(importingPacks){toast('Đang nạp gói. Hãy đợi lượt hiện tại hoàn tất.');return;}
    const input=el('input',{type:'file',accept:'.zip,.rar',multiple:'',hidden:''});
    input.oncancel=()=>input.remove();
    input.onchange=()=>{
      const selected=[...input.files];
      input.remove();
      if(selected.length)void importPackFiles(selected);
    };
    document.body.append(input);
    input.click();
  }
  async function importPackFiles(files){
    if(importingPacks||!files.length)return;
    importingPacks=true;
    packResults=files.map(file=>({file,status:'queued'}));draw();
    try{
      await packRegistryReady;
      const ids=new Set(customPackRecords().map(p=>p.id));
      for(const p of packResults){
        p.status='busy';draw();
        try{
          const header=new Uint8Array(await p.file.slice(0,8).arrayBuffer());
          if(isRar(header)){p.status='images';continue;}
          let r;
          try{r=await readZip(new Uint8Array(await p.file.arrayBuffer()),p.file.name);}
          catch{p.status='error';p.readFailed=true;p.errors=['Không mở được tệp nén.'];continue;}
          if(r.error){
            p.status=r.hasImages?'images':r.noManifest?'empty':'error';
            if(!r.noManifest)p.errors=[r.error];
            continue;
          }
          if(!r.check.ok){p.status='error';p.errors=r.check.errors;continue;}
          if(ids.has(r.man.id)){
            p.status='existing';p.errors=['Đã có gói '+r.man.name+' ('+r.man.id+'). Đã giữ lại gói đang dùng.'];continue;
          }
          const built=await buildPack(r.man,r.files,toast);
          built.vat.sourceFile=p.file.name;
          if(built.nen)built.nen.sourceCount=built.nGround;
          registerPack(built);ids.add(r.man.id);
          window.__lastPack={id:r.man.id,man:r.man};
          Object.assign(p,{status:'ok',id:r.man.id,name:r.man.name,nItems:built.nItems,nGround:built.nGround,
            roles:built.roles,families:built.families,warns:r.check.warns});
        }catch(e){p.status='error';p.errors=['Lỗi đọc gói: '+(e.message||e)];}
      }
      const added=packResults.filter(p=>p.status==='ok');
      if(added.length){
        const packs=customPackRecords();
        if(await idbSet('xuong_packs',packs))for(const {id} of packs)savedPackIds.add(id);
        void refreshProfiles().catch(()=>{});
        const lastGround=added.slice().reverse().find(p=>p.nGround);
        if(lastGround)void ensureNen(lastGround.id).then(r=>{curSheet=r.sid;after();draw();}).catch(()=>{});
      }
      if(added.length)toast('Đã nạp '+added.length+' gói Xưởng. Xem chi tiết trong Tài nguyên.');
    }finally{importingPacks=false;draw();}
    const imageFiles=packResults.filter(p=>p.status==='images').map(p=>p.file);
    if(imageFiles.length)void openImagesFor(imageFiles);
  }
  window.__exportRoundTrip=async(u8,nm)=>{const rz=await readZip(u8,nm);const z=exportPackZip(rz.man,rz.files);return z;};
  window.__vatIndexEntry=async id=>(await vatIndex()).find(o=>o.id===id);
  window.__vatPack=vatPack;window.__nenPack=nenPack;
  window.__addPackU8=async(u8,nm)=>{const rz=await readZip(u8,nm);if(rz.error||!rz.check.ok)return {err:rz.error||rz.check.errors};const b=await buildPack(rz.man,rz.files);registerPack(b);return {id:rz.man.id,roles:b.roles,families:b.families,nItems:b.nItems,warns:rz.check.warns};};
  let archiveResults=[];
  function archiveReport(){
    if(!archiveResults.length)return null;
    return el('section',{class:'pack-results','aria-label':'Kết quả nhập ảnh theo gói'},
      el('strong',{},'Kết quả nhập ảnh theo gói'),
      archiveResults.map(result=>{
        const detail=el('details',{class:'pack-result',open:''},el('summary',{},result.name));
        if(result.error)detail.append(el('p',{},result.error));
        else detail.append(el('p',{},result.total+' ảnh trong gói · '+(result.available??result.total)+' dùng được · '+result.selected+' đã chọn · '+
          result.imported+' đã nhập ('+result.pieces+' mảnh) · '+result.skipped+' bỏ qua · '+result.failed+' lỗi'));
        for(const error of result.errors||[])detail.append(el('p',{},error));
        return detail;
      }),
      el('p',{class:'hint'},'Tìm tài nguyên đã nhập trong khung Dựng cảnh hoặc Tài nguyên. Dùng Tệp → Lưu dự án để tải bản sao.'));
  }
  function openImagesFor(files){
    return openArchivePicker(files,(items,name)=>addWhole(items,true,name),results=>{
      const names=new Set(files.map(file=>file.name));
      archiveResults=archiveResults.filter(r=>!names.has(r.name)&&!files.some(file=>r.name.startsWith(file.name+' / '))).concat(results);
      for(const p of packResults){
        if(p.status!=='images'||!names.has(p.file.name))continue;
        const related=results.filter(r=>r.name===p.file.name||r.name.startsWith(p.file.name+' / '));
        if(related.some(r=>r.imported)){
          p.status='image_done';p.errors=[];
        }else if(related.length&&related.every(r=>r.error)){
          p.status='error';p.readFailed=true;p.errors=related.map(r=>r.error);
        }else if(related.length&&related.every(r=>!r.error&&!r.available)){
          p.status='empty';p.errors=['Gói này chỉ có tài liệu, mô hình hoặc ảnh tham khảo.'];
        }
      }
      const imported=results.reduce((total,r)=>total+(r.pieces||0),0);
      if(imported){
        const layer=[act,2,0,1,3].find(l=>l<4&&materialCards(l,curSheet).length);
        if(layer!=null){
          act=layer;tool='draw';tab='tools';wallChain=null;
          stamp={w:1,h:1,multi:false,tiles:[0]};
          buildSources.set(act,curSheet);buildPages.set(act,0);buildQuery='';renderTabs();
        }
        toast('Đã nhập '+imported+' mảnh. Xem bộ vừa nhập trong Dựng cảnh.');
      }
      draw();
    });
  }
  function addGridZip(){zipBrowser(addSheetUrl,addMany);}
  function exportPNG(k){const c=document.createElement('canvas');c.width=M.w*CELL*k;c.height=M.h*CELL*k;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const sv=vis.slice();rebuild();g.drawImage(mc,0,0,c.width,c.height);c.toBlob(b=>saveFile('ban_do_2d.png',b));}
  function proj(){return {tags:TG,format:'thk-map-1',cell:CELL,w:M.w,h:M.h,layerNames:LAYN,layers:M.layers,collision:M.blk,ents:M.ents,cfg:M.cfg,sheets:sheets.map(s=>({name:s.name,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null,phaseBrush:s.phaseBrush,cols:s.cols,rows:s.rows,url:s.url})),note:'Giá trị ô v>0: n=v-1; flip=n&7 (1=ngang,2=dọc,4=chéo); t=n>>3; sheet=t>>12; tile=t&4095; tile (col,row)=(tile%cols, floor(tile/cols)); nguồn ảnh: sx=col*(tw+margin), sy=row*(tw+margin)'};}
  window.__TG=()=>TG;window.__guess=p=>guessObj(p);window.__proj=()=>proj();window.__view=()=>view;window.__redraw=()=>draw();window.__loadProj=t=>importJSON(t);
  async function importMapFile(text){
    let data;
    try{data=JSON.parse(text);}catch{toast('JSON bản đồ không hợp lệ');return;}
    if(data?.format==='xuong-project-1'){toast('Dùng Tệp → Mở dự án cho tệp .xuong.json.');return;}
    if(data?.format!=='thk-map-1'){toast('Tệp bản đồ 2D không đúng định dạng');return;}
    if(await yes('Nhập bản đồ này và thay nội dung màn hiện tại?'))await importJSON(text);
  }
  function exportJSON(){saveFile('ban_do_2d.json',new Blob([JSON.stringify(proj())],{type:'application/json'}));}
  async function copyJSON(){
    try{
      await navigator.clipboard.writeText(JSON.stringify(proj()));toast('Đã sao chép JSON');
    }catch{toast('Không sao chép được. Hãy chọn Xuất bản đồ 2D (.json).');}
  }
  async function importJSON(t){try{const o=JSON.parse(t);if(o.format!=='thk-map-1')throw 0;if(o.tags){TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[]},o.tags);tgSave();}const smap=[0,1,2,3],ren={};for(let i=4;i<o.sheets.length;i++){const s=o.sheets[i];if(!s||!s.url){smap[i]=i<sheets.length?i:0;continue;}const ex=sheets.findIndex((q,k)=>k>=4&&q.name===s.name&&q.url===s.url);if(ex>=0){smap[i]=ex;continue;}let nm=s.name;if(sheets.some((q,k)=>k>=4&&q.name===nm)){let c=2;while(sheets.some((q,k)=>k>=4&&q.name===nm+'~'+c))c++;nm=nm+'~'+c;ren[s.name]=nm;}const ns={name:nm,url:s.url,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null,phaseBrush:s.phaseBrush};await loadSheet(ns);sheets.push(ns);smap[i]=sheets.length-1;}
      const rm=v=>{if(!v)return 0;const d=dec(v),n=smap[d.sid];return n==null||n===d.sid?v:enc(n,d.idx,d.f);};
      const lay=o.layers.map(a=>a.map(rm));const en=(o.ents||[]).map(e=>{if(e.tile&&smap[e.tile.sid]!=null)e.tile={sid:smap[e.tile.sid],idx:e.tile.idx};return e;});const cf=o.cfg||{};if(cf.hero&&smap[cf.hero.sid]!=null)cf.hero={sid:smap[cf.hero.sid],idx:cf.hero.idx};if(cf.catalog){const q=cf.catalog;if(q.ground&&smap[q.ground.sid]!=null)q.ground.sid=smap[q.ground.sid];for(const it of q.items||[])if(it.tile&&smap[it.tile.sid]!=null)it.tile={sid:smap[it.tile.sid],idx:it.tile.idx};}
      if(Object.keys(ren).length&&cf.anims)for(const a of cf.anims)for(const st of Object.values(a.st||{}))if(st.src)st.src=st.src.map(n=>ren[n]||n);
      pushUndo();M=clone({w:o.w,h:o.h,layers:lay,blk:o.collision,ents:en,cfg:cf});selId=null;after();fit();toast('Đã nhập bản đồ');}catch(e){toast('Tệp không đúng định dạng');}}
  // khởi động
  const ready=(async()=>{await Promise.all(sheets.map(loadSheet));let sv=lsGet('thk_proj2d',null);if(!sv||sv.large)sv=await idbGet('thk_proj2d_large');const idbC=await idbGet('thk_sheets2d');
    if(sv&&sv.layers){for(const s of ((idbC&&idbC.length)?idbC:(sv.custom||[]))){const ns=Object.assign({},s);await loadSheet(ns);sheets.push(ns);}MAPS=Array.isArray(sv.maps)&&sv.maps.length?sv.maps:[];curMap=Math.min(sv.cur||0,Math.max(0,MAPS.length-1));M=clone(MAPS.length?MAPS[curMap]:sv);if(!MAPS.length){M.name=M.name||'Màn 1';MAPS=[clone(M)];}}else{M=fromVillage();M.name='Màn 1';MAPS=[clone(M)];
      const sample=document.getElementById('da-xoay-sample');
      if(sample){await importJSON(sample.textContent);M.name='Hầm ngục Đá Xoáy';M.cfg.outlineTemplate=DA_XOAY_LEVEL;fixBuiltinGate(M);syncCur();grid=false;}
    }
    for(const m of [...MAPS,M])if(m.cfg?.outlineTemplate===DA_XOAY_LEVEL)fixBuiltinGate(m);
    stamp={w:1,h:1,multi:false,tiles:[0]};if(desktop())act=0;draw();
    // Optional network packs must not delay the first usable map.
    void (async()=>{
      packRegistryReady=(async()=>{
        const packs=await idbGet('xuong_packs');
        if(!Array.isArray(packs))return;
        for(const {vat,nen} of packs){
          if(!vat?.id||!Array.isArray(vat.items))continue;
          registerPack({nen,vat,nGround:nen?.sourceCount??Object.keys(nen?.idx||{}).length});
          savedPackIds.add(vat.id);
        }
      })();
      await packRegistryReady;draw();
      try{await refreshProfiles();draw();}catch(e){}
      if(window.__gn==null)window.__gn='kenney-dia-lao';
      try{const r=await ensureNen(window.__gn);curSheet=r.sid;}catch(e){}
      try{const L=await nenIndex();let k=0;for(const o of L){try{await ensureNen(o.id);k++;}catch(e){}}
        tgSave();after();draw();if(L.length)toast('Đã nạp '+k+'/'+L.length+' bộ nền');
      }catch(e){}
    })();
  })();
  async function ensureNen(id){const pk=await nenPack(id),name='Nen-'+id;let sid=sheets.findIndex((s,i)=>i>=4&&s.name===name);
    const wat=Object.entries(pk.idx).filter(([n])=>/^(nuoc|vuc|bo-00|mep-vuc-00|phien-nuoc|phien-ho)/.test(n)).map(e=>e[1]);
    if(sid>=0)sheets[sid].wat=wat;
    if(sid<0){const s={name,url:pk.atlas,tw:pk.tw,margin:0,iso:pk.iso===0?0:2,cy:pk.cy||0,wat};await loadSheet(s);sheets.push(s);sid=sheets.length-1;for(const [n,i] of Object.entries(pk.idx))TG.tiles[name+'#'+i]=nenTag(n);tgSave();}
    return {pk,sid};}
  let vatSel=null;const VROLE={'Nhà':'Nhà','Cây':'Cây','Vật':'Đồ vật','Hạ tầng':'Khác','Phủ nền':'Trang trí','Mái/cửa':'Nhà'};
  function mineItems(){
    const out=[],lookup=makePaintLookup();
    const indices=new Map(sheets.map((sheet,index)=>[sheet.name,index]).slice(4));
    for(const [key,tag] of Object.entries(TG.tiles)){
      if(tag?.fx==null||tag.layer<1)continue;
      const split=key.lastIndexOf('#'),name=key.slice(0,split),idx=+key.slice(split+1),sid=indices.get(name);
      if(sid==null||sid<4||/^(Nen|Vat|Mau)-/.test(name))continue;
      const sheet=sheets[sid],sc=tag.sc||sheet.tw/128,ox=tag.ox||0,oy=tag.oy||0;
      const profile=lookup(enc(sid,idx));
      const item={role:tag.role||'Vật',name:name+' · '+(idx+1),tile:{sid,idx},f:1,fx:tag.fx,fy:tag.fy,sc,ox,oy,
        zb:[-tag.fx,-tag.fy,tag.fx,tag.fy],walk:!profile};
      if(profile){
        const u=(profile.u-.5+ox)*sc/.75,v=(profile.v-1+oy)*sc/.75;
        const x=u/2+v,y=v-u/2;
        const ratio=sc/.95,w=Math.min(2,profile.w*ratio),h=Math.min(2,profile.h*ratio);
        item.col=profile.kind==='ell'?[{k:'circle',x,y,r:w/2}]:[{k:'rect',x:x-w/2,y:y-h/2,w,h}];
        item.estimated=true;
      }
      out.push(item);
    }
    return out;
  }
  async function ensureVat(id){if(id==='mine')return mineItems();const pk=await vatPack(id),name='Vat-'+id;let sid=sheets.findIndex((s,i)=>i>=4&&s.name===name);
    if(sid<0){const s={name,url:pk.atlas,tw:pk.T,margin:0};await loadSheet(s);sheets.push(s);sid=sheets.length-1;pk.items.forEach(it=>{TG.tiles[name+'#'+it.i]={type:VROLE[it.role]||'Khác',layer:it.role==='Mái/cửa'?3:2,fn:it.role==='Mái/cửa'?'Chỉ trang trí':'Chặn đường'};});tgSave();}
    return pk.items.map(it=>({role:it.role,name:it.name,cv:it.cv?{sid,idx:it.cv}:null,tile:{sid,idx:it.i},f:1,fx:it.fx,fy:it.fy,sc:it.sc,ox:0,oy:it.oy||0,zb:it.zb||[-it.fx,-it.fy,it.fx,it.fy],zps:it.zps||null,col:it.col||null,cal:it.cal==null?null:it.cal}));}

  const M2=initMau({el,btn,toast,yes,askText,pickFiles,pickFile,zipBrowser,saveFile,idbGet,idbSet,idbDel,
    body:()=>body,isTab:()=>tab==='mau',redraw:()=>draw(),sheets:()=>sheets,loadSheet,TG:()=>TG,tgSave,
    select:it=>{vatSel=it;objType='deco';tool='obj';draw();},curSel:()=>vatSel,
    progress:t=>{let d=document.getElementById('mau-prog');if(!t){d&&d.remove();return;}if(!d){d=document.createElement('div');d.id='mau-prog';d.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:99;background:#1b2430;color:#ffd24a;border:1px solid #d9a066;border-radius:10px;padding:8px 14px;font:13px system-ui';document.body.append(d);}d.textContent=t;}});
  const mauTab=()=>{body.append(btn('Thư viện cảnh ZIP',showStockScenes,'on'));return M2.tab();};
  function ruleBox(){const GR=window.__gr||(window.__gr={k:'dungeon',z:'m',s:'auto',l:false,y:'single'}),out=el('div',{style:'margin-top:6px'});
      const selR=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.k=e.target.value;}},Object.entries(RULES).map(([k,v])=>{const o=el('option',{value:k},v.name);if(k===GR.k)o.selected=true;return o;}));
      const selRZ=el('select',{class:'num',onchange:e=>{GR.z=e.target.value;}},[['s','Nhỏ'],['m','Vừa'],['l','Lớn']].map(([k,n])=>{const o=el('option',{value:k},n);if(k===GR.z)o.selected=true;return o;}));
      const selSh=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.s=e.target.value;}},Object.entries(SHAPES).map(([k,n])=>{const o=el('option',{value:k},n);if(k===GR.s)o.selected=true;return o;}));
      const selSB=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.sb=e.target.value;}},Object.entries(SB_KIEU).map(([k,n])=>{const o=el('option',{value:k},n);if(k===(GR.sb||'auto'))o.selected=true;return o;}));
      const mixOpts=[['','— không trộn —'],...VIDX.filter(e=>e.profiles||e.id.startsWith('kenney')).map(e=>[e.id,e.name.slice(0,48)])];
      const selMix=el('select',{class:'num',style:'max-width:230px',onchange:e=>{GR.mix=e.target.value?[e.target.value]:[];}},mixOpts.map(([k,n])=>{const o=el('option',{value:k},n);if(k===((GR.mix||[])[0]||''))o.selected=true;return o;}));
      const cbL=el('input',{type:'checkbox',onchange:e=>{GR.l=e.target.checked;}});cbL.checked=!!GR.l;
      const selY=el('select',{class:'num',onchange:e=>{GR.y=e.target.value;}},[['single','Một nhà kho'],['twin','Nhà kho + nhà phụ']].map(([k,n])=>{const o=el('option',{value:k},n);if(k===GR.y)o.selected=true;return o;}));
      const showRep=R=>{out.textContent='';out.append(el('div',{class:'lbl',style:'color:'+(R.ok?'#9fe0b0':'#ff9b8a')},(R.ok?'✅ ĐẠT':'⚠ CHƯA ĐẠT')+' toàn bộ phép kiểm · hình '+(R.shape||'sân')+' · seed '+R.seed+' · thử '+R.tries+' lần'));for(const r of R.report)out.append(el('div',{class:'hint',style:'color:'+(r[1]?'#9fe0b0':'#ff9b8a')},(r[1]?'✔ ':'✘ ')+r[0]));};
      return el('div',{style:'border:1px solid #d9a066;border-radius:10px;padding:8px;margin-top:10px;background:#26201a'},
        el('div',{class:'lbl',style:'color:#e8c08a'},'🏗 DỰNG THEO NGUYÊN TẮC (theo vai trò + luật khai báo trong gói) — bố cục trước, tường suy ra, đồ đặt có luật, tự kiểm'),
        el('div',{class:'hint',style:'white-space:pre-line'},RULE_TEXT.join('\n')),
        el('div',{class:'row'},el('span',{class:'lbl'},'Kiểu'),selR,el('span',{class:'lbl'},'Cỡ'),selRZ),
        el('div',{class:'row'},el('span',{class:'lbl'},'Hình dạng (phòng)'),selSh),
        el('div',{class:'row'},el('span',{class:'lbl'},'Kiểu sân bậc'),selSB),
        el('div',{class:'row'},el('span',{class:'lbl'},'Trộn thêm đồ từ gói (sân bậc)'),selMix),
        el('div',{class:'row'},el('label',{style:'font-size:13px'},cbL,' Có phòng chữ L'),el('span',{class:'lbl'},'Sân'),selY),
        el('div',{class:'row'},btn('🏗 Dựng theo nguyên tắc',async()=>{if(!await yes('Dựng cảnh mới thay cho màn đang mở? (Ctrl+Z hoàn tác bản đồ)'))return;const R=await doGen(GR);if(R)showRep(R);},'background:#b9772b;color:#fff')),out);}
  /* dựng theo hồ sơ của gói (dùng cho nút Dựng và các nút cảnh mẫu) */
  async function doGen(GR){toast('Đang dựng…');await new Promise(r=>setTimeout(r,30));
    let R;try{R=await genRule({ensureNen,ensureVat,vatPack,sheets:()=>sheets,enc},GR.k,{size:GR.z,shape:GR.s,lshape:GR.l,yard:GR.y,sb:GR.sb,mix:GR.mix||[],seed:GR.seed});}catch(e){console.error(e);toast('Lỗi: '+(e&&e.message||e));return null;}
    if(R.error){toast(R.error);return null;}window.__lastRep=R;
    pushUndo();M={name:(RULES[GR.k].name.replace(/^\S+\s/,'').replace(/ \(.*/,'').replace(/ — .*/,'')),w:R.w,h:R.h,layers:R.layers,blk:R.blk,ents:R.ents,cfg:Object.assign({hp:6,spd:4.2,dmg:1,rng:1.5,hero:{sid:2,idx:0}},M.cfg,{view:'iso',win:'auto',zones:[]})};selId=null;after();fit();draw();toast(R.ok?'Đã dựng — đạt mọi phép kiểm':'Đã dựng — còn phép kiểm chưa đạt');return R;}
  async function genRun(){const k=window.__gk||'village',z={s:[32,24],m:[48,36],l:[64,48]}[window.__gz||'m'];
    if(!await yes('Tạo bối cảnh mới thay cho màn "'+(M.name||'')+'"?\n(Ctrl+Z hoàn tác được bản đồ; tileset mới tạo sẽ còn lại.)'))return;
    toast('Đang tạo bối cảnh…');await new Promise(r=>setTimeout(r,30));
    let vat=[];try{for(const id of (window.__gvat?[window.__gvat]:(GEN_KIND_VAT[k]||[])))vat=vat.concat(await ensureVat(id));}catch(x){console.error(x);}
    let nen=null;if(window.__gn){try{nen=await ensureNen(window.__gn);}catch(e){toast('Lỗi nạp bộ nền: '+(e&&e.message||e));return;}}
    let R;try{R=build({sheets,eff,emptyMap,visSh,enc,nen,vat,newSid:sheets.length,catalog:(M.cfg&&M.cfg.catalog)||null},{kind:k,w:z[0],h:z[1],goal:!!window.__gg,view:window.__gv||'rpg'});}catch(e){console.error(e);toast('Lỗi khi tạo: '+(e&&e.message||e));return;}
    if(R.error){toast(R.error);return;}
    pushUndo();
    if(R.newSheet){const s={name:'Gen-'+Date.now().toString(36).slice(-4),url:R.newSheet.canvas.toDataURL('image/png'),tw:64,margin:0};await loadSheet(s);sheets.push(s);uniqNames(sheets);}
    M={name:M.name,w:R.w,h:R.h,layers:R.layers,blk:R.blk,ents:R.ents,cfg:Object.assign({},M.cfg,{view:R.view||'rpg'},R.iso?{zones:R.zones||[]}:{})};selId=null;after();fit();draw();
    const i=R.info;toast('Đã tạo: '+i.placed.house+' nhà, '+i.placed.tree+' cây, '+i.placed.prop+' đồ'+((!i.house&&!i.tree)?' — chưa thấy tài nguyên gắn nhãn Cây/Nhà (xem tab 🔎 Tài nguyên)':''));}
  /* ===== NHIỀU MÀN ===== */
  let MAPS=[],curMap=0;
  let projectMeta=lsGet('xuong_project_meta',null)||newMeta('Hầm ngục Đá Xoáy');
  lsSet('xuong_project_meta',projectMeta);
  const syncCur=()=>{M.name=M.name||('Màn '+(curMap+1));MAPS[curMap]=clone(M);};
  function gateDestination(gate){
    const choose=el('select',{class:'num','aria-label':'Màn đích của cổng',onchange:()=>{
      pushUndo();
      gate.to=choose.value===''?null:Number(choose.value);
      gate.tx=gate.ty=null;after();draw();
    }},el('option',{value:''},'Không chuyển màn'),
      MAPS.flatMap((m,i)=>i===curMap?[]:[el('option',{value:i},(i+1)+'. '+mapName(i))]));
    choose.value=gate.to??'';
    const field=(key,label)=>el('input',{type:'number',min:0,step:1,class:'num',style:'width:68px',
      placeholder:label,'aria-label':label,value:gate[key]??'',onchange:e=>{
        const n=e.target.valueAsNumber;
        if(e.target.value!==''&&(!Number.isInteger(n)||n<0)){toast('Nhập số ô nguyên từ 0 trở lên.');draw();return;}
        pushUndo();gate[key]=e.target.value===''?null:n;after();
      }});
    return el('div',{},el('label',{class:'row'},'Màn đích của cổng',choose),
      Number.isInteger(gate.to)?el('div',{class:'row'},field('tx','Ô X đích'),field('ty','Ô Y đích'),
        el('span',{class:'hint'},'Để trống tọa độ để đến điểm xuất phát.')):null,
      MAPS.length<2?el('p',{class:'hint'},'Thêm màn thứ hai trong Màn & cửa để nối cổng.'):null);
  }
  function switchMap(i){if(i===curMap||!MAPS[i])return;syncCur();curMap=i;M=clone(MAPS[i]);undo=[];redo=[];selId=null;inventoryGroup='';inventoryId='';inventoryMoving=false;after();fit();draw();}
  function mkMap(w,h,name,cfg){const m=newMap(w,h);m.name=name;m.cfg=cfg;const sx=Math.floor(w/2),sy=Math.floor(h/2);m.ents.push({id:'s'+Date.now().toString(36),t:'start',x:sx,y:sy,name:'Xuất phát',tile:null});return m;}
  const mapName=i=>(i===curMap?M.name:(MAPS[i]&&MAPS[i].name))||('Màn '+(i+1));
  function placeMapEntry(map,point){
    const entry=map.ents.find(e=>e.t==='start');
    if(entry)Object.assign(entry,{x:point.x,y:point.y});
    else map.ents.push({id:crypto.randomUUID(),t:'start',name:'Xuất phát',tile:null,x:point.x,y:point.y});
  }
  function addPair(source,target,from,to,prepared=sheets){
    const lookup=makePaintLookup();
    const [out,back,{sourceEntry,targetEntry}]=planMapPair(sceneForPlay(source,source.cfg,lookup),
      sceneForPlay(target,target.cfg,prepared===sheets?lookup:makePaintLookup(prepared)),from,to,crypto.randomUUID());
    placeMapEntry(source,sourceEntry);placeMapEntry(target,targetEntry);
    source.ents.push(out);target.ents.push(back);
    return out;
  }
  function connectMap(to){
    if(!MAPS[to]||to===curMap)throw Error('Hãy chọn màn khác để nối.');
    if(M.ents.some(e=>e.pairId&&e.to===to&&MAPS[to].ents.some(peer=>peer.pairId===e.pairId&&peer.to===curMap)))
      throw Error('Hai màn đã có lối nối hai chiều.');
    syncCur();
    const target=clone(MAPS[to]);
    const out=addPair(M,target,curMap,to);
    MAPS[to]=target;syncCur();after();draw();
    const message='Đã nối hai chiều · '+out.name+' · ô '+out.x+', '+out.y+'.';
    toast(message);return message;
  }
  async function outlinePlayData(index){
    const data=gameData();
    const map=(data.maps||[data])[index];
    if(!map)throw Error('Màn đã chọn không còn trong dự án.');
    if(map.cfg?.proj==='angle')await ensureAngle(sheets);
    return {M:map,sheets};
  }
  function outlineConnectionTargets(){
    return MAPS.map((_,i)=>({id:i,name:mapName(i),current:i===curMap}));
  }
  function mapConnectionBox(){
    const options=MAPS.map((m,i)=>[i,m]).filter(([i])=>i!==curMap);
    const select=el('select',{class:'num','aria-label':'Chọn màn để kết nối'},options.map(([i])=>el('option',{value:i},mapName(i))));
    return options.length?el('div',{class:'row'},el('span',{class:'hint'},'Nối từ '+mapName(curMap)),select,btn('Nối hai chiều',()=>{
      try{connectMap(+select.value);}catch(error){toast(error.message);}
    })):el('p',{class:'hint'},'Thêm một màn Cảnh ZIP hoặc Đường bao để nối.');
  }
  function mapsTab(){
    if(!MAPS.length)syncCur();
    body.append(el('div',{class:'lbl'},'🗺 CÁC MÀN CỦA GAME'),el('div',{class:'hint'},'Mỗi màn là một bản đồ riêng. Đặt 🚪 cửa trên màn này để đi sang màn khác. Nhân vật và hoạt ảnh lấy theo Màn 1.'));
    const lst=el('div',{class:'row'});MAPS.forEach((m,i)=>lst.append(btn((i+1)+'. '+mapName(i),()=>switchMap(i),i===curMap?'on':'')));body.append(lst,mapConnectionBox());
    body.append(el('div',{class:'row'},
      btn('Thêm màn trống',()=>{syncCur();const c=MAPS[0].cfg;MAPS.push(mkMap(M.w,M.h,'Màn '+(MAPS.length+1),{hp:c.hp,spd:c.spd,dmg:c.dmg,rng:c.rng,win:'auto'}));switchMap(MAPS.length-1);toast('Đã thêm màn '+MAPS.length);}),
      btn('⧉ Nhân bản màn này',()=>{syncCur();const m=clone(M);m.name=M.name+' (bản sao)';MAPS.push(m);switchMap(MAPS.length-1);}),
      btn('✏ Đổi tên',async()=>{const n=await askText('Tên màn này?',M.name);if(n){M.name=n.slice(0,30);syncCur();draw();}}),
      btn('🗑 Xoá màn này',async()=>{if(MAPS.length<2){toast('Phải còn ít nhất 1 màn');return;}if(!await yes('Xoá "'+M.name+'"? Cửa trỏ tới màn này sẽ bị bỏ.\nKhông hoàn tác được.'))return;const d=curMap;MAPS.splice(d,1);const start=projectMeta.startMap??0;setProjectMeta({...projectMeta,startMap:start===d?0:start>d?start-1:start});for(const m of MAPS)m.ents=(m.ents||[]).filter(e=>!(e.t==='door'&&e.to===d)).map(e=>{
      if(!isMapLink(e))return e;
      if(e.to===d)return {...e,to:null,tx:null,ty:null};
      return e.to>d?{...e,to:e.to-1}:e;
    });curMap=Math.min(d,MAPS.length-1);M=clone(MAPS[curMap]);undo=[];redo=[];selId=null;after();fit();draw();})));
    const width=el('input',{type:'number',value:M.w,min:4,max:600,class:'num','aria-label':'Chiều rộng'}),
      height=el('input',{type:'number',value:M.h,min:4,max:600,class:'num','aria-label':'Chiều cao'});
    body.append(el('details',{},el('summary',{},'Kích thước màn'),
      el('div',{class:'row'},width,'×',height,btn('Đổi kích thước',()=>{
        try{resizeOutlineGrid(+width.value,+height.value);}catch(e){toast(e.message);}
      }))));
    body.append(el('div',{class:'lbl',style:'margin-top:8px'},'ĐẶT LÊN BẢN ĐỒ (chạm ô để đặt, chạm lại để chọn/kéo)'),
      el('div',{class:'row'},['start','door','goal'].map(k=>btn(OT[k][0]+' '+OT[k][1],()=>{objType=k;tool='obj';draw();},(tool==='obj'&&objType===k)?'on':''))));
    {const vbox=el('div',{style:'border:1px solid #d9a066;border-radius:10px;padding:8px;margin-top:8px;background:#26201a'}),vl=el('div',{style:'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px'}),rc=el('div',{style:'display:flex;gap:4px;margin-top:6px'}),sv=el('select',{class:'num',style:'max-width:100%',onchange:async e=>{vl.textContent='Đang nạp…';try{const it=await ensureVat(e.target.value);vl.textContent='';window.__gvs=e.target.value;vl._it=it;vl._r();}catch(x){vl.textContent='Lỗi nạp: '+x.message;}}},el('option',{value:''},'— chọn bộ vật thể —'));
      vatIndex().then(L=>{sv.append(el('option',{value:'mine'},'📁 Của tôi (ảnh đã nạp, tự phân loại)'));for(const o of L){const op=el('option',{value:o.id},o.name+' ('+o.n+')');if(o.id===window.__gvs)op.selected=true;sv.append(op);}if(window.__gvs)sv.onchange({target:{value:window.__gvs}});});
      window.__vr=window.__vr||'obj';vl._r=()=>{vl.textContent='';const pn=window.__vr==='pn';(vl._it||[]).filter(q=>pn?q.role==='Phủ nền':(q.role!=='Mái/cửa'&&q.role!=='Phủ nền')).forEach(q=>vl.append(btn(q.name+(q.role==='Hạ tầng'?' ⛓':''),()=>{vatSel=q;objType='deco';tool='obj';draw();},(vatSel&&vatSel.name===q.name&&vatSel.tile.sid===q.tile.sid)?'on':'')));if(!vl.childNodes.length)vl.textContent=pn?'Bộ này chưa có phủ nền — tải ảnh họa tiết/hiệu ứng nền lên, app tự xếp vào đây.':'Bộ này không có vật thể.';};
      [['obj','🏛 Vật thể'],['pn','🍂 Phủ nền']].forEach(([k,n])=>rc.append(btn(n,()=>{window.__vr=k;[...rc.children].forEach((c,i)=>c.classList.toggle('on',(i===0)===(k==='obj')));vl._r();},window.__vr===k?'on':'')));
      vbox.append(el('div',{class:'lbl',style:'color:#e8c08a'},'🏛 VẬT THỂ / 🍂 PHỦ NỀN — chọn rồi chạm bản đồ để đặt (phủ nền nằm sát đất, không chặn)'),sv,rc,vl);body.append(vbox);}
    {const rb=el('div',{style:'border:1px solid #6aa8ff;border-radius:10px;padding:8px;margin-top:8px;background:#1b2430'});
      rb.append(el('div',{class:'lbl',style:'color:#9cc4ff'},'🖼 DỰNG TỪ ẢNH MẪU — app tự nhận dạng ảnh, chọn đúng tài nguyên và báo thiếu'),
        btn('Mở ảnh mẫu…',()=>openRefMap({el,btn,toast,yes,get sheets(){return sheets;},nenIndex,nenPack,vatIndex,ensureNen,ensureVat,enc,apply(R){pushUndo();M={name:M.name,w:R.w,h:R.h,layers:R.layers,blk:R.blk,ents:R.ents,cfg:Object.assign({},M.cfg,{view:'iso',zones:[]})};selId=null;after();fit();draw();}}),'on'));body.append(rb);}

    body.append(ruleBox());
    for(const gate of M.ents.filter(e=>e.gateAssembly&&e.wallId))
      body.append(el('div',{},el('strong',{},gate.name||'Cổng'),gateDestination(gate)));
    const doors=M.ents.filter(e=>e.t==='door');
    body.append(el('div',{class:'lbl',style:'margin-top:8px'},'🚪 CỬA TRÊN MÀN NÀY ('+doors.length+')'));
    if(!doors.length)body.append(el('div',{class:'hint'},'Chưa có cửa. Bấm "🚪 Cửa chuyển màn" rồi chạm bản đồ.'));
    for(const e of doors){
      const sel=el('select',{class:'num'},MAPS.map((m,i)=>el('option',{value:i},(i+1)+'. '+mapName(i))));sel.value=e.to;sel.onchange=()=>{e.to=+sel.value;after();};
      const num=(k)=>{const i=el('input',{type:'number',class:'num',style:'width:60px',placeholder:'tự động',value:e[k]==null?'':e[k]});i.oninput=()=>{e[k]=i.value===''?null:+i.value;after();};return i;};
      body.append(el('div',{style:'border:1px solid #ffa94d;border-radius:10px;padding:8px;margin:6px 0'+(e.id===selId?';background:#2a2418':'')},
        el('div',{class:'lbl'},'🚪 ô ('+e.x+','+e.y+')'),
        el('div',{class:'row'},el('span',{class:'lbl'},'Đi tới'),sel),
        el('div',{class:'row'},el('span',{class:'lbl'},'Đến ô x,y'),num('tx'),num('ty'),el('span',{class:'hint'},'để trống = điểm 🚩 xuất phát của màn đó')),
        el('div',{class:'row'},btn('📍 Chọn',()=>{selId=e.id;draw();}),btn('↩ Tạo cửa quay lại bên kia',()=>{const t=e.to;if(t===curMap)return;syncCur();const d=MAPS[t],id='d'+Date.now().toString(36);const bx=e.tx!=null?e.tx:null;d.ents.push({id,t:'door',x:Math.max(0,Math.min(d.w-1,(e.tx!=null?e.tx:Math.floor(d.w/2))+1)),y:(e.ty!=null?e.ty:Math.floor(d.h/2)),name:'Cửa',tile:null,to:curMap,tx:e.x,ty:e.y+1>=M.h?e.y:e.y+1});toast('Đã tạo cửa quay lại ở '+mapName(t)+' (có thể kéo đi chỗ khác)');}),
          btn('🗑',()=>{pushUndo();M.ents=M.ents.filter(q=>q.id!==e.id);selId=null;after();draw();}))));}
  }
  const contactCache=new WeakMap();
  function tileContact(sheet,idx,f,source=sheets){
    let cache=contactCache.get(sheet.img);
    if(!cache){cache=new Map();contactCache.set(sheet.img,cache);}
    const key=idx*8+f;
    if(cache.has(key))return cache.get(key);
    const tw=sheet.tw;
    let contact=null,bounds=null,rectangular=false,trunk=null,base=null,solidBase=false,alphaBounds=null;
    try{
      const ctx=el('canvas',{width:tw,height:tw}).getContext('2d',{willReadFrequently:true});
      drawTile(ctx,enc(source.indexOf(sheet),idx,f),0,0,tw,source);
      const rgba=ctx.getImageData(0,0,tw,tw).data;
      contact=estimateContact(rgba,tw,0);
      let left=tw,top=tw,right=0,bottom=0,opaque=0;
      let alphaLeft=tw,alphaTop=tw,alphaRight=0,alphaBottom=0;
      const footRows=new Int32Array(tw).fill(-1);
      for(let y=0;y<tw;y++)for(let x=0;x<tw;x++){
        const a=rgba[(y*tw+x)*4+3];
        if(a>16){alphaLeft=Math.min(alphaLeft,x);alphaTop=Math.min(alphaTop,y);alphaRight=Math.max(alphaRight,x+1);alphaBottom=Math.max(alphaBottom,y+1);}
        if(a>=112){footRows[x]=y;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);opaque++;}
      }
      if(alphaRight>alphaLeft)alphaBounds=[alphaLeft/tw,alphaTop/tw,alphaRight/tw,alphaBottom/tw];
      if(right>left){bounds=[left/tw,top/tw,right/tw,bottom/tw];rectangular=opaque/((right-left)*(bottom-top))>.96;}
      if(bounds&&right-left>=4){
        const inset=Math.max(1,Math.round((right-left)*.025));
        const low=(start,end)=>Math.max(...footRows.subarray(start,end));
        const leftY=low(left,left+inset+1),rightY=low(right-inset-1,right);
        let frontLeft=left,frontRight=right-1;
        while(footRows[frontLeft]<bottom-2)frontLeft++;
        while(footRows[frontRight]<bottom-2)frontRight--;
        const a=[(left+.5)/tw,(leftY+.5)/tw],b=[(right-.5)/tw,(rightY+.5)/tw];
        const f=[(frontLeft+frontRight+1)/(2*tw),(bottom-.5)/tw];
        const rear=[a[0]+b[0]-f[0],a[1]+b[1]-f[1]];
        if(f[1]>Math.max(a[1],b[1])+1/tw){
          base=[a,f,b,rear];
          const followsEdge=(edge,end)=>{
            const span=Math.abs(end[0]-edge[0])*tw;
            if(span<(right-left)*.18)return false;
            return [.25,.5,.75].every(t=>{
              const x=Math.floor((edge[0]+(end[0]-edge[0])*t)*tw);
              const y=(edge[1]+(end[1]-edge[1])*t)*tw-.5;
              return Math.abs(footRows[x]-y)<=Math.max(2,(right-left)*.025);
            });
          };
          solidBase=followsEdge(a,f)&&followsEdge(b,f);
        }
      }
      if(bounds&&bottom-top>(right-left)*1.15){
        // The lit trunk stays warm near the base. Exclude dark or translucent shadow pixels.
        const bands=[];
        let foliage=0;
        for(let y=top;y<bottom;y++){
          let lo=right,hi=left,count=0;
          for(let x=left;x<right;x++){
            const i=(y*tw+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2],a=rgba[i+3];
            if(a<165)continue;
            if(y<top+(bottom-top)*.52&&g>58&&g>r*.82&&g>b*1.3)foliage++;
            if(y<top+(bottom-top)*.54||r<66||r<g*1.14||g<b*1.1||r<b*1.55)continue;
            lo=Math.min(lo,x);hi=Math.max(hi,x);count++;
          }
          if(count&&hi-lo+1<=(right-left)*.14)bands.push({y,lo,hi});
        }
        if(foliage>opaque*.06&&bands.length>=(bottom-top)*.18){
          const foot=bands.at(-1);
          trunk={u:(foot.lo+foot.hi+1)/(2*tw),v:(foot.y+.5)/tw,width:(foot.hi-foot.lo+1)/tw};
        }
      }

    }catch{}
    const info={contact,bounds,rectangular,trunk,base,solidBase,alphaBounds};cache.set(key,info);return info;
  }
  function makePaintLookup(source=sheets){
    const profiles=new Map();
    return (value,layer=2)=>{
      if(!value)return null;
      const key=value+':'+layer;
      if(profiles.has(key))return profiles.get(key);
      const {sid,idx,f}=dec(value),sheet=source[sid];
      let profile=null;
      if(sheet?.img){
        const info=sheet===sheets[sid]?constructionTile(sid,idx,0):{source:sheet.name};
        if(layer===2||!roofTextureDirection(info.source,true)){
          const family=paintFamily(info.source,info.type,'Chặn đường')||'solid';
          if(idx===0&&sheet.tw===64&&/^Đá Xoáy · cổng, cột, rương/.test(sheet.name))
            profile=daXoayArchProfiles(f);
          else{
            const contact=!sheet.iso&&sheet===sheets[sid]?tileContact(sheet,idx,f).contact:null;
            profile=makePaintProfile(family,contact||{u:.5,v:.87,width:.38});
          }
        }
      }
      profiles.set(key,profile);
      return profile;
    };
  }
  function currentPaintZones(){
    const groups=ISOQ()&&vis[2]?isoBuild().GR:undefined;
    return automaticPaintZones(M,makePaintLookup(),groups);
  }
  function sceneForPlay(map,cfg,lookup){
    const layers=map.layers.map(layer=>layer.slice()),ents=structuredClone(map.ents.map(e=>withAssetSource(e,cfg)));
    for(let i=0;i<layers[3].length;i++){
      if(!layers[3][i])continue;
      const roof=legacyRoof(layers[3][i],i,map.w);
      if(!roof)continue;
      layers[3][i]=0;
      ents.push(roof);
    }
    return {name:map.name,w:map.w,h:map.h,layers,ents,blk:map.blk.slice(),cfg,placementZones:automaticPaintZones(map,lookup)};
  }
  const gameData=()=>{
    syncCur();
    const first=MAPS[0].cfg||{},lookup=makePaintLookup();
    const maps=MAPS.map((map,i)=>{
      const cfg=i>0&&!map.cfg.outlineHero?{...map.cfg,anims:[...new Map([...(first.anims||[]),...(map.cfg.anims||[])].map(set=>[set.id,set])).values()],heroAnim:map.cfg.heroAnim||first.heroAnim,hero:first.hero,outlineHero:first.outlineHero,playerHeight:first.playerHeight,crouchHeight:first.crouchHeight}:map.cfg;
      return sceneForPlay(map,cfg,lookup);
    });
    let gid=lsGet('thk_gid',null);
    if(!gid){gid='g'+Date.now().toString(36);lsSet('thk_gid',gid);}
    return {...gameData1(),...maps[curMap],maps:maps.length>1?maps:undefined,currentMap:curMap,startMap:campaignStart(maps,projectMeta.startMap),gid};
  };
  const gameData1=()=>({kind:'2d',w:M.w,h:M.h,layers:M.layers.map(l=>l.slice()),blk:M.blk.slice(),ents:JSON.parse(JSON.stringify(M.ents)),cfg:M.cfg,custom:sheets.slice(4).map(s=>({name:s.name,url:s.url,tw:s.tw,margin:s.margin,iso:s.iso||0,cy:s.cy||0,wat:s.wat||null,phaseBrush:s.phaseBrush}))});
  function setProjectMeta(meta){projectMeta=meta;lsSet('xuong_project_meta',meta);after();}
  function readProject(){syncCur();return {format:'xuong-project-1',meta:projectMeta,cur:curMap,maps:MAPS.map(clone),sheets:gameData1().custom,tags:TG};}
  async function restoreProject(p){
    if(p?.format!=='xuong-project-1'||typeof p.meta?.title!=='string'||typeof p.meta?.id!=='string'||
       !Array.isArray(p.maps)||!p.maps.length||!Array.isArray(p.sheets))throw Error('Tệp dự án Xưởng không hợp lệ');
    for(const m of p.maps){
      const n=m.w*m.h;
      if(!Number.isInteger(m.w)||!Number.isInteger(m.h)||m.w<1||m.h<1||m.w>600||m.h>600||
         !Array.isArray(m.layers)||m.layers.length!==4||!m.layers.every(a=>Array.isArray(a)&&a.length===n)||
         !Array.isArray(m.blk)||m.blk.length!==n||!Array.isArray(m.ents))throw Error('Dữ liệu màn trong tệp không hợp lệ');
    }
    const incoming=await Promise.all(p.sheets.map(async source=>{
      if(typeof source?.url!=='string'||!source.url.startsWith('data:image/')||!Number.isInteger(source.tw)||source.tw<1)
        throw Error('Tài nguyên trong tệp dự án không hợp lệ');
      const sh={...source};await loadSheet(sh);if(!sh.img)throw Error('Ảnh hỏng: '+sh.name);return sh;
    }));
    const maps=p.maps.map(m=>{const n=clone(m);return n.cfg.outlineTemplate===DA_XOAY_LEVEL?fixBuiltinGate(n):n;});
    sheets.splice(4,sheets.length-4,...incoming);
    TG=Object.assign({sheets:{},tiles:{},fav:[],recent:[]},p.tags);tgSave();
    MAPS=maps;curMap=Number.isInteger(p.cur)&&maps[p.cur]?p.cur:0;
    M=clone(MAPS[curMap]);curSheet=4;stamp={w:1,h:1,multi:false,tiles:[incoming.length?enc(4,0):0]};
    undo=[];redo=[];sel=null;clip=null;selId=null;isoK='';
    setProjectMeta(p.meta);await save();fit();draw();
  }
  function fixBuiltinGate(map){
    const legacy=map.ents.find(e=>e.id==='da-xoay-0'&&e.t==='deco'&&!e.wallId&&e.x===7&&e.y===15&&e.tile?.idx===0);
    if(!legacy)return map;
    const probe={...legacy,x:1.4,y:15,placedProp:true,gateAssembly:true,wallGateBrush:true,walk:false,
      propProjection:'iso',sizeBase:legacy.sc,spriteBounds:[.25,.16,.78,.97],
      ...propContact(daXoayArchProfiles(0),null,legacy.sc,'iso')};
    const mounted=mountGate(probe,outlineSupports(map.cfg.outline),{distance:.35});
    if(mounted){Object.assign(legacy,mounted);delete legacy.zb;}
    return map;
  }
  function builtinOutlineSample(){
    const node=document.getElementById('da-xoay-sample');
    return node?fixBuiltinGate(JSON.parse(node.textContent)):null;
  }
  async function startSample(meta){
    const sample=builtinOutlineSample();
    const map={name:meta.title,w:sample.w,h:sample.h,layers:sample.layers,blk:sample.collision,ents:sample.ents,cfg:{...sample.cfg,outlineTemplate:DA_XOAY_LEVEL}};
    await restoreProject({format:'xuong-project-1',meta,cur:0,maps:[map],sheets:sample.sheets.slice(4),tags:sample.tags});
  }
  async function loadBuiltinSheet(source,target){
    const match=sh=>sh.img&&sh.url===source.url&&sh.tw===source.tw&&sh.margin===source.margin;
    let sid=target.findIndex(match);
    if(sid>=0)return sid;
    const sh={...source};await loadSheet(sh);
    if(!sh.img)throw Error('Không nạp được bộ hình '+source.name+'.');
    sid=target.findIndex(match);
    return sid>=0?sid:target.push(sh)-1;
  }
  function fixedIncomingOutlineCells(){
    return MAPS.flatMap((map,i)=>i===curMap?[]:map.ents
      .filter(e=>isMapLink(e)&&Number(e.to)===curMap&&Number.isFinite(e.tx)&&Number.isFinite(e.ty))
      .map(e=>[e.tx,e.ty]));
  }
  function outlineGridBounds(level){
    const incoming=fixedIncomingOutlineCells();
    const sample=level?.sample;
    const source=sample?{...sample,blk:sample.collision}:level?null:M;
    const cells=level?[level.start,level.goal,...(level.chests||[])].filter(Boolean):M.ents
      .filter(e=>isMapLink(e)&&Number(e.to)===curMap&&Number.isFinite(e.tx)&&Number.isFinite(e.ty)).map(e=>[e.tx,e.ty]);
    return {bounds:usedGridBounds(source,[...incoming,...cells]),keepOrigin:incoming.length>0};
  }
  async function buildBuiltinOutline(level,outline,w,h,target,stamps,origin){
    const sample=level.sample,ids=[0,1,2,3];
    for(const sh of sample.sheets.slice(4))ids.push(await loadBuiltinSheet(sh,target));
    const remap=tile=>({...tile,sid:ids[tile.sid]});
    const preset=clone({name:level.name,w:sample.w,h:sample.h,layers:sample.layers,
      blk:sample.collision,cfg:sample.cfg,ents:sample.ents});
    preset.cfg.outlineTemplate=level.id;
    if(preset.cfg.hero)preset.cfg.hero=remap(preset.cfg.hero);
    for(const e of preset.ents)if(e.tile)e.tile=remap(e.tile);
    preset.layers=preset.layers.map(layer=>layer.map(v=>{
      if(!v)return 0;
      const {sid,idx,f}=dec(v);return enc(ids[sid],idx,f);
    }));
    const same=!origin.some(Boolean)&&w===sample.w&&h===sample.h&&JSON.stringify(outline.loops)===JSON.stringify(sample.cfg.outline.loops);
    if(same&&!stamps.length){preset.cfg.outline={...outline,floorCollision:true};return preset;}
    return buildOutlineMap(outline,w,h,{...level,sample:null,goal:null},target,stamps,false,preset,origin);
  }
  function validateMapOutline(outline,w,h){
    if(!validOutline(outline.loops,w,h)||outline.thickness!=null&&(!Number.isFinite(outline.thickness)||outline.thickness<WALL_MIN_THICKNESS||outline.thickness>WALL_MAX_THICKNESS)||![outline.front,outline.rear].every(n=>Number.isFinite(n)&&n>=0&&n<=4))
      throw Error('Thông số đường bao không hợp lệ.');
  }
  async function installStonePaving(){
    const original={name:'Đá Xoáy · phiến đá',url:LEGACY_STONE_ATLAS,tw:16,margin:0};
    await loadSheet(original);
    if(!original.img)throw Error('Không tải được mẫu đá gốc.');
    const atlas=stonePavingSheets(original.img),indices=[];
    for(const sheet of atlas){
      const sid=await loadBuiltinSheet(sheet,sheets);
      sheets[sid].phaseBrush=sheet.phaseBrush;
      indices.push(sid);
    }
    after();
    return indices[0];
  }
  async function stoneTile(target){
    let sid=target.findIndex(sh=>sh.url===OUTLINE_STONE.url&&sh.img);
    if(sid<0){
      const sh={...OUTLINE_STONE};await loadSheet(sh);
      if(!sh.img)throw Error('Không nạp được vật liệu nền.');
      sid=target.findIndex(q=>q.url===OUTLINE_STONE.url&&q.img);
      if(sid<0)sid=target.push(sh)-1;
    }
    return enc(sid,0);
  }
  function paintOutline(m,outline,mask,fill,updateCollision,oldMask,stamps=[],source=null,palette=sheets){
    const {w,h}=m;
    const groundCover=(x,y,i)=>mask[i]||x>0&&mask[i-1]||x+1<w&&mask[i+1]||y>0&&mask[i-w]||y+1<h&&mask[i+w];
    const phase=(v,x,y)=>{const sid=stonePhase(v,0,palette);return sid===null?v:phaseTile(sid,x,y);};
    if(source){
      for(let y=0;y<Math.min(h,source.h);y++)for(let x=0;x<Math.min(w,source.w);x++){
        const dest=y*w+x,i=y*source.w+x;
        if(groundCover(x,y,dest))m.layers[0][dest]=source.layers[0][i];
        if(mask[dest])for(let l=1;l<4;l++)m.layers[l][dest]=source.layers[l][i];
      }
    }
    for(const stamp of stamps)for(const {x,y,tiles} of stamp){
      if(x<0||y<0||x>=w||y>=h)continue;
      const i=y*w+x;
      if(tiles[0]&&groundCover(x,y,i))m.layers[0][i]=phase(tiles[0],x,y);
      if(mask[i])for(let l=1;l<4;l++)if(tiles[l])m.layers[l][i]=tiles[l];
    }
    m.cfg.outline={...outline,floorCollision:updateCollision};m.cfg.view='iso';m.cfg.proj=m.cfg.proj==='angle'?'angle':'iso';
    const ground=m.layers[0];
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      const i=y*m.w+x;
      if(!ground[i]&&groundCover(x,y,i))ground[i]=phase(fill,x,y);
      if(updateCollision){
        const wasOutside=oldMask&&!oldMask[i];
        m.blk[i]=!mask[i]||(m.blk[i]&&!wasOutside)?1:0;
      }
    }
  }
  let outdoorGround,outdoorStone;
  async function installSurface(m,target,previous=null){
    const {w,h}=m,outline=m.cfg.outline,spec=outline.surface;
    const plan=planSurface(w,h,spec),K=surfaceKinds;
    const sid=await loadBuiltinSheet(outdoorGround??=surfaceSheet(),target);
    const former=previous?planSurface(w,h,previous).blocked:null;
    for(let i=0;i<plan.tiles.length;i++){
      const x=i%w,y=Math.floor(i/w),kind=plan.tiles[i];
      const v=Math.floor(surfaceHash(x,y,spec.seed)*SURFACE_VARIANTS);
      const axis=plan.tiles[i-1]===K.bridge||plan.tiles[i+1]===K.bridge?4:0;
      m.layers[0][i]=enc(sid,kind*SURFACE_VARIANTS+v,kind===K.bridge?axis:0);
      m.blk[i]=Number(plan.blocked[i]||!!(former&&m.blk[i]&&!former[i]));
    }
    const generated=[];
    if(spec.finish!==false&&plan.trees.length){
      const rock=await loadBuiltinSheet(outdoorStone??=surfaceRock(),target);
      const props=await Promise.all([vatPack('thieu-lam').catch(()=>null),vatPack('kenney-nong-trai').catch(()=>null)]);
      const leaf=new Map();
      for(const [kind,pack,key] of [['tree',props[0],'tung_chau'],['crop',props[1],'corn']]){
        const a=pack?.items.find(item=>item.k===key);
        if(a)leaf.set(kind,{a,sid:await loadBuiltinSheet({name:'Vat-'+pack.id,url:pack.atlas,tw:pack.T,margin:0},target)});
      }
      for(const {x,y,kind,shade} of plan.trees){
        if(m.ents.some(e=>!e.surfaceGenerated&&e.t==='deco'&&Math.hypot(e.x+1-(x+.5),e.y+1-(y+.5))<1.2))continue;
        const art=leaf.get(kind),tree=kind==='tree';
        if(!art&&kind!=='rock')continue;
        generated.push({t:'deco',id:`surface-${kind}-${x}-${y}`,name:kind==='rock'?'Vách đá':tree?'Tùng':'Ruộng ngô',
          x:x-.5,y:y-.5,placedProp:true,tile:{sid:art?.sid??rock,idx:art?.a.i??0},
          sc:(kind==='rock'?3.1:tree?2.85*.75/(198/336):.65*.75/(110/296))*(.93+shade*.14),
          bodyHeight:kind==='rock'?1.9:outlineHeight(tree?'Tùng':'corn','props'),oy:art?.a.oy||0,
          walk:false,col:tree?[{k:'circle',x:0,y:0,r:.20}]:[],surfaceGenerated:true});
      }
    }
    if(spec.finish!==false&&plan.houseLots.length){
      const farm=kenneyOutlinePacks.find(p=>p[0]==='farm');
      const kit=await loadBuiltinOutlinePack(farm,{floorScale:1,matchJoints:false});
      const house=kit.houses?.[0];
      if(house){
        const occupied=new Set();
        const ids=new Map();
        for(const id of new Set(house.ents.map(e=>e.tile.sid)))ids.set(id,await loadBuiltinSheet(kit.sheets[id],target));
        const patch=plan.tiles;
        const validLot=(x,y)=>Array.from({length:house.w*house.h},(_,i)=>[x+i%house.w,y+Math.floor(i/house.w)])
          .every(([a,b])=>{
            if(a<1||b<1||a>=w-1||b>=h-1||occupied.has(b*w+a))return false;
            const k=patch[b*w+a];
            return [K.plain,K.meadow,K.farm,K.plaza,K.sand,K.lot].includes(k);
          });
        for(const anchor of plan.houseLots){
          const candidates=[[anchor.x,anchor.y],[anchor.x-1,anchor.y],[anchor.x,anchor.y-2],[anchor.x-2,anchor.y-2],[anchor.x+2,anchor.y+1]];
          const fit=candidates.find(([x,y])=>validLot(x,y)&&!m.ents.some(e=>!e.surfaceGenerated&&e.t==='deco'&&
            e.x+1>x-.5&&e.x+1<x+house.w+.5&&e.y+1>y-.5&&e.y+1<y+house.h+.5));
          if(!fit)continue;
          const [x,y]=fit;
          for(let yy=y;yy<y+house.h;yy++)for(let xx=x;xx<x+house.w;xx++)occupied.add(yy*w+xx);
          house.ents.forEach((e,i)=>generated.push({...e,x:e.x+x,y:e.y+y,
            tile:{...e.tile,sid:ids.get(e.tile.sid)},id:`surface-house-${x}-${y}-${i}`,surfaceGenerated:true}));
        }
      }
    }
    m.ents=m.ents.filter(e=>!e.surfaceGenerated).concat(generated);
    return plan;
  }
  function placeSurfaceMarkers(m,plan,walk){
    const preferred={x:plan.start[0],y:plan.start[1]};
    const entry=safeMapEntry(m,walk,preferred);
    if(!entry)throw Error('Mặt đất cần ít nhất hai ô liền nhau đi được. Hãy thêm một dải đất hoặc đường.');
    placeMapEntry(m,entry);
    const [gx,gy]=plan.goal;
    const obstacle=Uint8Array.from(m.blk);
    // The generated lots and tree trunks are excluded from the route search, leaving their nearby paths open.
    for(const {x,y} of plan.trees)obstacle[y*m.w+x]=1;
    for(const {x,y} of plan.houseLots)for(let dy=0;dy<3;dy++)for(let dx=0;dx<2;dx++)obstacle[(y+dy)*m.w+x+dx]=1;
    obstacle[entry.y*m.w+entry.x]=0;
    const route=(m.ents.some(e=>!e.surfaceGenerated&&!e.walk&&e.t==='deco')?
      walk.component(entry):surfaceReachable(m.w,m.h,obstacle,[entry.x,entry.y]))
      .filter(p=>p.x!==entry.x||p.y!==entry.y);
    const goal=route.reduce((best,p)=>!best||Math.abs(p.x-gx)+Math.abs(p.y-gy)<Math.abs(best.x-gx)+Math.abs(best.y-gy)?p:best,null);
    if(!goal)throw Error('Chưa có đường đi từ điểm xuất phát. Hãy thêm đường hoặc cầu.');
    const existing=m.ents.find(e=>e.t==='goal');
    if(existing)Object.assign(existing,goal);
    else m.ents.push({id:'surface-goal',t:'goal',...goal,name:'Đích',tile:null});
  }
  function surfaceDressing(m,details){
    if(!m.cfg.outline?.surface)return details;
    const {w,h,blk}=m;
    const count=blk.reduce((sum,b)=>sum+Number(!b),0);
    const text=`${(count).toLocaleString('vi-VN')} / ${(w*h).toLocaleString('vi-VN')} ô đi được theo địa hình`;
    return {summary:[text,details?.summary].filter(Boolean).join(' · '),warnings:details?.warnings};
  }
  async function buildOutlineEdit(outline,updateCollision,w,h,stamps,origin,materials,prepared){
    validateDimensions(w,h);validateMapOutline(outline,w,h);
    const [ox,oy]=origin;
    if(origin.some(Boolean)){
      const {bounds,keepOrigin}=outlineGridBounds();
      if(keepOrigin||bounds&&(bounds[0]<ox-1e-8||bounds[1]<oy-1e-8||bounds[2]>ox+w+1e-8||bounds[3]>oy+h+1e-8))
        throw Error('Lưới mới cắt qua nội dung đã đặt. Hãy bấm Vừa lưới lại.');
    }else validateResize(w,h);
    const m=origin.some(Boolean)?rebaseOutlineSource(M,w,h,origin,curMap):
      w===M.w&&h===M.h?clone(M):resizedMap(M,w,h);
    if(outline.surface&&(!m.cfg.outline?.surface||outline.surface.finish===false)){
      m.ents=m.ents.filter(e=>!(e.outlineAutoProp||e.outlineAutoHouse||e.outlineCast)&&(!e.wallId?.startsWith('outline:')||isMapLink(e)));
    }
    const edgeGates=m.ents.filter(e=>e.wallId?.startsWith('outline:'));
    if(edgeGates.length&&edgeGates.some(e=>!mountGate(e,outlineSupports(outline),{distance:.015})))
      throw Error('Đường bao mới làm lệch cổng. Hãy lắp lại cổng hoặc xóa cổng trước khi sửa đoạn chứa cổng.');
    const mask=rasterOutline(outline.loops,w,h),old=m.cfg.outline?.loops;
    const oldMask=old?rasterOutline(old,w,h):null;
    if(!mask.some(Boolean))throw Error('Đường bao chưa phủ ô sàn nào.');
    if(updateCollision){
      const invalid=m.ents.find(e=>['start','goal','door'].includes(e.t)&&!mask[Math.floor(e.y)*w+Math.floor(e.x)]);
      if(invalid)throw Error('Đường bao làm mất lối tới '+invalid.name+'. Hãy đặt đối tượng vào trong sàn.');
    }
    if(!outline.surface&&m.cfg.outline?.surface){
      m.ents=m.ents.filter(e=>!e.surfaceGenerated);
      const terrain=planSurface(m.w,m.h,m.cfg.outline.surface);
      for(let i=0;i<m.blk.length;i++){
        if(terrain.blocked[i])m.blk[i]=0;
        if(prepared[(m.layers[0][i]-1)>>15]?.name==='Mặt đất · Địa hình và đường')m.layers[0][i]=0;
      }
    }
    const fill=outlineFill(m,stamps)||await stoneTile(prepared);
    paintOutline(m,outline,mask,fill,updateCollision,oldMask,stamps,null,prepared);
    const arrivals=fixedIncomingOutlineCells().map(([x,y])=>[x+.5-ox,y+.5-oy]);
    if(outline.surface){
      const plan=await installSurface(m,prepared,M.cfg.outline?.surface);
      const walk=linkWalkability(m,automaticPaintZones(m,makePaintLookup(prepared)));
      if(arrivals.some(([x,y])=>!walk.free(x,y,.28)))throw Error('Địa hình mới chặn điểm đến của một cổng nối. Hãy chọn Tạo màn mới hoặc điều chỉnh khu vực đó.');
      if(m.ents.some(e=>isMapLink(e)&&!walk.free(e.x+.5,e.y+.5,.28)&&!e.wallId))
        throw Error('Địa hình mới chặn một cổng nối. Hãy tạo màn mới hoặc giữ nền ở vị trí cổng.');
      placeSurfaceMarkers(m,plan,walk);
    }
    const dressing=surfaceDressing(m,await prepareOutlineDressing(m,prepared,materials,arrivals));
    const placementZones=automaticPaintZones(m,makePaintLookup(prepared));
    applySceneEdits(m,prepared,placementZones);
    return {M:m,sheets:prepared,dressing,placementZones};
  }
  async function applyOutline(outline,updateCollision,w=M.w,h=M.h,stamps=[],origin=[0,0],materials=null,keepView=false){
    const current=M,index=curMap,revision=buildRevision,prepared=sheets.slice();
    const {M:m,dressing}=await buildOutlineEdit(outline,updateCollision,w,h,stamps,origin,materials,prepared);
    if(M!==current||curMap!==index||revision!==buildRevision)throw Error('Màn đang chỉnh đã đổi. Hãy mở lại Đường bao.');
    const error=structureError(current,m);if(error)throw Error(error);
    sheets.push(...prepared.slice(sheets.length));
    pushUndo();M=m;sel=null;hov=null;
    after();if(!keepView)fit();draw();toast((keepView?'Đã phối vật liệu.':'Đã áp dụng đường bao.')+(dressing?' '+[dressing.summary,dressing.warnings].filter(Boolean).join(' '):''));
  }
  function applySceneMaterials(materials){
    const outline=M.cfg.outline;
    if(!outline?.loops?.length)throw Error('Màn này cần có đường bao để phối vật liệu.');
    const next={...outline,front:outline.front??DEFAULT_OUTLINE_WALL_HEIGHT,
      rear:outline.rear??DEFAULT_OUTLINE_WALL_HEIGHT};
    if(outline.surface)next.surface={...outline.surface,finish:true};
    return applyOutline(next,outline.floorCollision!==false,M.w,M.h,[],[0,0],materials,true)
      .then(()=>cv.focus({preventScroll:true}));
  }
  function outlineFill(source,stamps){
    return source?.layers[0].find(Boolean)||stamps.flatMap(stamp=>stamp).find(cell=>cell.tiles[0])?.tiles[0];
  }
  async function buildOutlineMap(outline,w,h,level,target,stamps,useSource=true,sourcePreset=null,origin=[0,0]){
    validateDimensions(w,h);validateMapOutline(outline,w,h);
    if(level?.sample)return buildBuiltinOutline(level,outline,w,h,target,stamps,origin);
    const mask=rasterOutline(outline.loops,w,h);
    const index=p=>p&&p[0]>=0&&p[0]<w&&p[1]>=0&&p[1]<h?p[1]*w+p[0]:-1;
    const shift=p=>p&&[p[0]-origin[0],p[1]-origin[1]];
    const proposed=index(shift(level?.start)),goal=index(shift(level?.goal));
    const requestedStart=mask[proposed]?proposed:mask.indexOf(1);
    if(requestedStart<0)throw Error('Hình chưa có ô nào đi được.');
    const c=defCfg();c.view='iso';c.proj=level?'iso':M.cfg.proj||'iso';c.win='goal';
    if(level)c.outlineTemplate=level.id;
    else if(M.layers[0].some(Boolean)){c.smooth=M.cfg.smooth;c.hero={...M.cfg.hero};c.anims=M.cfg.anims;c.heroAnim=M.cfg.heroAnim;c.outlineHero=M.cfg.outlineHero;c.beforeOutlineHero=M.cfg.beforeOutlineHero;c.playerHeight=M.cfg.playerHeight;c.crouchHeight=M.cfg.crouchHeight;}
    const name=outline.surface?(surfaceLevelById.get(outline.surface.layout)?.name||surfaceProfiles[outline.surface.profile].name):level?.name||'Màn '+(MAPS.length+1)+' · Đường bao';
    const fresh=mkMap(w,h,name,c);
    const place=i=>({x:i%w,y:Math.floor(i/w)});
    if(sourcePreset&&origin.some(Boolean))sourcePreset=rebaseOutlineSource(sourcePreset,w,h,origin);
    if(sourcePreset){
      c.hero=sourcePreset.cfg.hero;c.smooth=sourcePreset.cfg.smooth;
      fresh.ents.push(...sourcePreset.ents.filter(e=>e.t==='deco'&&(e.wallId?.startsWith('outline:')?
        mountGate(e,outlineSupports(outline),{distance:.015}):mask[index([Math.floor(e.x),Math.floor(e.y)])])));
    }
    const source=sourcePreset||(level||outline.surface||!useSource?null:origin.some(Boolean)?rebaseOutlineSource(M,w,h,origin):M);
    let fill=outlineFill(source,stamps);
    if(level?.theme&&!sourcePreset){
      const style=builtinOutlineSample();
      if(style){
        c.smooth=false;
        const hero=style.cfg.hero;
        c.hero={...hero,sid:await loadBuiltinSheet(style.sheets[hero.sid],target)};
        if(!fill)fill=enc(await loadBuiltinSheet(style.sheets[4],target),0);
      }
    }
    if(!fill&&level?.color){
      const tile=document.createElement('canvas');tile.width=tile.height=16;
      const context=tile.getContext('2d');context.fillStyle=level.color;context.fillRect(0,0,16,16);
      context.fillStyle='#ffffff23';context.fillRect(1,1,14,1);
      context.fillStyle='#00000028';context.fillRect(0,15,16,1);context.fillRect(15,0,1,16);
      fill=enc(await loadBuiltinSheet({name:'Đường bao · '+level.name,tw:16,margin:0,url:tile.toDataURL()},target),0);
    }
    paintOutline(fresh,outline,mask,fill||await stoneTile(target),true,null,stamps,source,target);
    if(outline.surface){
      const plan=await installSurface(fresh,target);
      placeSurfaceMarkers(fresh,plan,linkWalkability(fresh,automaticPaintZones(fresh,makePaintLookup(target))));
      return fresh;
    }
    const walk=linkWalkability(sceneForPlay(fresh,c,makePaintLookup(target)));
    const start=safeMapEntry(fresh,walk,place(requestedStart));
    if(!start)throw Error('Cần ít nhất hai ô sàn liền nhau, đủ rộng để nhân vật đi qua. Hãy mở rộng sàn hoặc hành lang.');
    placeMapEntry(fresh,start);
    const route=walk.component(start),reachable=new Set(route.map(({x,y})=>y*w+x));
    const first=start.y*w+start.x;
    const end=goal!==first&&reachable.has(goal)?goal:route.at(-1).y*w+route.at(-1).x;
    fresh.ents.push({id:'goal-'+Date.now().toString(36),t:'goal',...place(end),name:'Đích',tile:null});
    for(const p of level?.chests||[]){
      const i=index(shift(p));
      if(reachable.has(i)&&i!==first&&i!==end)fresh.ents.push({id:'chest-'+i,t:'chest',...place(i),name:'Rương',tile:null});
    }
    return fresh;
  }
  const outlinePackCache=new Map();
  let builtinOutlinePacks;
  const outlineSourceError=(source,error)=>({
    source,floors:[],props:[],skipReason:error.message==='invalid zip data'?'không đọc được tệp ZIP':error.message||'không đọc được gói'
  });
  function loadBuiltinOutlinePack(profile,style){
    const [id]=profile,key=id+'|'+style.floorScale+'|'+style.matchJoints+'|'+style.manualScale;
    if(!outlinePackCache.has(key)){
      const source='Kenney Miniature '+id[0].toUpperCase()+id.slice(1);
      const job=Promise.resolve().then(()=>{
        builtinOutlinePacks??=unzipSync(builtinOutlineArchive);
        return readOutlineCatalog(openScenePack(source,builtinOutlinePacks[id+'.zip']),profile,style);
      }).catch(error=>{
        outlinePackCache.delete(key);
        return outlineSourceError(source,error);
      });
      outlinePackCache.set(key,job);
    }
    return outlinePackCache.get(key);
  }
  const outlineUploads=new WeakMap();
  async function readOutlineCatalog(raw,profile,style){
    const result=await outlinePackMaterials(raw,profile,style).catch(error=>outlineSourceError(raw.name,error));
    return {...result,raw,manual:new Map()};
  }
  async function parseOutlineFile(file,style){
    try{
      const pack=openScenePack(file.name,new Uint8Array(await file.arrayBuffer()),{allowBadMetadata:true});
      const profile=kenneyOutlinePacks.find(item=>outlineMiniatureFolder(pack,item)!==null);
      const materials=await readOutlineCatalog(pack,profile,style);
      return {id:profile?.[0],materials};
    }catch(error){return {materials:outlineSourceError(file.name,error)};}
  }
  function readOutlineFile(file,style){
    let variants=outlineUploads.get(file);
    if(!variants){variants=new Map();outlineUploads.set(file,variants);}
    const key=style.floorScale+'|'+style.matchJoints+'|'+style.manualScale;
    if(!variants.has(key))variants.set(key,parseOutlineFile(file,style));
    return variants.get(key);
  }
  const outlineStockFiles=new Map();
  const outlineRoles={floor:'floors',overlay:'overlays',wall:'walls',props:'props',house:'houses',character:'characters'};
  async function outlineLayerPack(source,files,style){
    if(source==='builtin:character'){
      const sample=builtinOutlineSample(),{sid,idx}=sample.cfg.hero;
      const sh={...sample.sheets[sid]};await loadSheet(sh);
      const step=sh.tw+(sh.margin||0);
      const canvas=Object.assign(document.createElement('canvas'),{width:sh.tw,height:sh.tw});
      canvas.getContext('2d').drawImage(sh.img,(idx%sh.cols)*step,Math.floor(idx/sh.cols)*step,sh.tw,sh.tw,0,0,sh.tw,sh.tw);
      const image=new Uint8Array(await (await new Promise(resolve=>canvas.toBlob(resolve))).arrayBuffer());
      const raw={name:'Nhân vật của Xưởng',paths:['nhan-vat.png'],tsx:[],files:{'nhan-vat.png':image}};
      return readOutlineCatalog(raw,null,style);
    }
    if(source.startsWith('builtin:')){
      const profile=kenneyOutlinePacks.find(p=>p[0]===source.slice(8));
      if(profile)return loadBuiltinOutlinePack(profile,style);
    }
    if(source.startsWith('stock:')){
      const archive=(await stockPackList()).find(pack=>pack.file===source.slice(6));
      if(archive){
        if(!outlineStockFiles.has(source))outlineStockFiles.set(source,fetchStockArchive(archive).catch(error=>{
          outlineStockFiles.delete(source);
          throw error;
        }));
        return (await readOutlineFile(await outlineStockFiles.get(source),style)).materials;
      }
    }
    const file=files.get(source);
    if(file)return (await readOutlineFile(file,style)).materials;
    throw Error('Hãy chọn lại hoặc thêm lại tệp ZIP của lớp này.');
  }
  let materialDrag=null,materialAnchor=null,characterPlacement=null;
  let materialDragImage;
  function setMaterialAnchor(at,batch=materialDrag){
    materialAnchor=at&&{...at,batch,mapIndex:curMap};
    dirty=true;
  }
  function materialDropPoint(event){
    const p=pos(event),at=s2g(p.x,p.y);
    return at;
  }
  function drawMaterialAnchor(){
    if(!materialAnchor||materialAnchor.mapIndex!==curMap)return;
    const {x,y}=materialAnchor;
    const [px,py]=g2s(x,y),valid=inb(x,y)&&ruleCtx().floor(x,y,0);
    if(px<0||px>cv.clientWidth||py<0||py>cv.clientHeight)return;
    cx.save();
    const color=valid?'#ffdc72':'#ff948f';
    cx.lineWidth=2;cx.strokeStyle=color;
    const batch=materialAnchor.batch;
    const index=batch?.anchor??4;
    const bounds=batch?.bounds||[-.18,-.18,.18,.18];
    const points=baseAnchorPoints(bounds),[ox,oy]=points[index];
    drawBaseAnchorPoints(points.map(([u,v])=>[x+u-ox,y+v-oy]),index,color);
    drawMapName('Điểm neo · X '+coord.format(x)+' · Y '+coord.format(y),[px-8,Math.max(25,py-11),px+8],color);
    cx.restore();
  }
  cv.addEventListener('pointerdown',event=>{
    if(materialAnchor)setMaterialAnchor(null);
    if(event.button!==0||!characterPlacement)return;
    const {batch,map}=characterPlacement;
    characterPlacement=null;
    if(map!==M)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(batch.role==='hero')setAnimatedHero(batch.animation.id);
    else void placeMaterialBatch(batch,materialDropPoint(event)).catch(error=>toast(error.message));
  },true);
  cv.addEventListener('pointermove',event=>{
    if(characterPlacement?.map===M)setMaterialAnchor(materialDropPoint(event),characterPlacement.batch);
  });
  cv.addEventListener('pointerleave',()=>{if(characterPlacement)setMaterialAnchor(null);});
  cv.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!characterPlacement)return;
    event.stopImmediatePropagation();characterPlacement=null;setMaterialAnchor(null);
  },true);
  function armCharacterPlacement(batch){
    batch.bounds=zBounds(actorFoot(0,0,batch.animation.visualScale??1));
    characterPlacement={batch,map:M};
    cv.focus({preventScroll:true});
  }
  cv.addEventListener('dragover',event=>{
    if(!materialDrag)return;
    event.preventDefault();event.dataTransfer.dropEffect='copy';
    setMaterialAnchor(materialDropPoint(event));
  });
  cv.addEventListener('dragleave',()=>{if(materialDrag)setMaterialAnchor(null);});
  cv.addEventListener('drop',event=>{
    const batch=materialDrag;
    if(!batch)return;
    event.preventDefault();materialDrag=null;setMaterialAnchor(null);
    if(batch.animation&&batch.role==='hero'){setAnimatedHero(batch.animation.id);return;}
    const at=materialDropPoint(event);
    void placeMaterialBatch(batch,at).catch(error=>toast(error.message));
  });
  function startMaterialDrag(event,batch){
    characterPlacement=null;materialDrag=batch;setMaterialAnchor(null);
    if(batch.animation){
      const scale=batch.animation.visualScale??1;
      batch.bounds=zBounds(actorFoot(0,0,scale));
    }else{
      batch.parts=materialParts(batch);
      batch.parts.then(parts=>{
        batch.bounds=inventoryFootBounds(parts.flatMap(({e})=>propFootprint(e)));
        dirty=true;
      },()=>{});
    }
    if(!materialDragImage){
      materialDragImage=Object.assign(document.createElement('canvas'),{width:1,height:1});
      materialDragImage.style.cssText='position:fixed;left:0;top:0;pointer-events:none';
      materialDragImage.setAttribute('aria-hidden','true');
      document.body.append(materialDragImage);
    }
    event.dataTransfer.setDragImage(materialDragImage,0,0);
    event.dataTransfer.setData('application/x-xuong-material','1');
    event.dataTransfer.effectAllowed='copy';
  }
  async function materialParts(batch){
    const parts=[];
    let right=null;
    for(const {source,id} of batch.assets){
      const style={...batch.style,manualScale:batch.scales[source]};
      const pack=await outlineLayerPack(source,batch.files,style);
      let item=pack[outlineRoles[batch.role]]?.find(asset=>asset.id===id),sourceSheets=pack.sheets;
      if(!item&&pack.raw&&batch.role==='props'){
        const manual=await outlineManualImage(pack.raw,id,'props',{...style,packScale:pack.scale});
        item=manual.item;sourceSheets=manual.sheets;
      }
      if(!item)throw Error('Mẫu này chưa có dữ liệu đặt theo lớp đã chọn.');
      const group='placed-'+crypto.randomUUID();
      const chunk=batch.role==='house'?item.ents.map(e=>({...e,x:e.x-item.w/2,y:e.y-item.h/2,housePlacement:true})):
        [item.create(0,0,group)];
      const bounds=inventoryFootBounds(chunk.flatMap(propFootprint));
      const dx=right===null?0:right+.25-bounds[0];
      right=bounds[2]+dx;
      for(const [i,e] of chunk.entries()){
        delete e.outlineAutoProp;delete e.outlineAutoHouse;
        e.id=group+'-'+i;e.arrangementGroup=group;e.x+=dx;
        parts.push({e,sheet:sourceSheets[e.tile.sid]});
      }
    }
    return parts;
  }
  let placementQueue=Promise.resolve();
  function placeMaterialBatch(batch,at){
    const mapIndex=curMap;
    const job=placementQueue.then(async()=>{
      if(curMap!==mapIndex)throw Error('Màn đang chỉnh đã đổi. Hãy kéo lại.');
      if(!inb(at.x,at.y))throw Error('Hãy thả vào trong bản đồ.');
      const map=M,revision=buildRevision,prepared=sheets.slice(),sheetCount=sheets.length,next=clone(map),parts=[];
      const floor=ruleCtx().floor;
      const entries=batch.animation?null:await batch.parts;
      const bounds=batch.bounds||(entries?inventoryFootBounds(entries.flatMap(({e})=>propFootprint(e))):[-.18,-.18,.18,.18]);
      const [ox,oy]=baseAnchorPoints(bounds)[batch.anchor??4],x=at.x-ox,y=at.y-oy;
      if(batch.animation){
        if(!map.cfg.anims?.some(set=>set.id===batch.animation.id))throw Error('Bộ hoạt ảnh chưa có trong màn.');
        if(!floor(x,y,.22))throw Error('Hãy đặt hoạt ảnh trên sàn.');
        const role=characterRoles[batch.role]||characterRoles.villager;
        parts.push({...newEnt(role.type,x-.5,y-.5),...role.stats,name:batch.animation.name,anim:batch.animation.id,
          characterRole:batch.role,tile:null,text:role.text});
      }else for(const {e,sheet} of entries){
        const sid=await loadBuiltinSheet(sheet,prepared);
        if(!floor(e.x+x+1,e.y+y+1,0))throw Error('Một phần cụm nằm ngoài sàn.');
        parts.push({...e,x:e.x+x,y:e.y+y,tile:{...e.tile,sid}});
      }
      if(map!==M||revision!==buildRevision||sheetCount!==sheets.length)throw Error('Màn đang chỉnh đã đổi. Hãy kéo lại.');
      next.ents.push(...parts);
      const previousLength=sheets.length;
      sheets.push(...prepared.slice(previousLength));
      if(!commitInventory(next)){sheets.length=previousLength;return;}
      if(!materialDrag)setMaterialAnchor(at,batch);
      draw();cv.focus({preventScroll:true});
    });
    placementQueue=job.catch(()=>{});
    return job;
  }
  async function installDirectionalSet(set,assets,map){
    const prepared=sheets.slice(),count=sheets.length,assetNames=new Map();
    for(const asset of assets){
      const sid=await loadBuiltinSheet(asset,prepared);
      assetNames.set(asset.name,prepared[sid].name);
    }
    if(M!==map||sheets.length!==count)throw Error('Màn đang chỉnh đã đổi. Hãy nạp lại.');
    const sets=M.cfg.anims||[];
    const matching=sets.filter(item=>characterNameKey(item.name)===characterNameKey(set.name));
    const target=matching.find(item=>item.id===M.cfg.heroAnim)||matching[0];
    for(const clip of Object.values(set.st))clip.src=clip.src.map(name=>assetNames.get(name)??name);
    const merged=target?{...target,st:mergeAnimationClips(target.st,set.st).clips}:set;
    pushUndo();
    sheets.push(...prepared.slice(count));
    for(const duplicate of matching){
      if(duplicate===target)continue;
      const {clips}=mergeAnimationClips(merged.st,duplicate.st);
      merged.st=clips;
      if(M.cfg.beforeOutlineHero?.heroAnim===duplicate.id)M.cfg.beforeOutlineHero.heroAnim=target.id;
      for(const entity of M.ents){
        if(entity.anim!==duplicate.id)continue;
        entity.anim=target.id;
      }
    }
    M.cfg.anims=target?sets.filter(item=>item===target||!matching.includes(item))
      .map(item=>item===target?merged:item):[...sets,merged];
    anK='';after();draw();
    return merged;
  }
  function setAnimationScale(id,scale){
    if(!Number.isFinite(scale)||scale<.1||scale>4)return;
    const set=M.cfg.anims?.find(set=>set.id===id);
    if(!set)return;
    pushUndo();set.visualScale=scale;anK='';after();dirty=true;
  }
  function setAnimatedHero(id){
    if(!M.cfg.anims?.some(set=>set.id===id))return;
    pushUndo();M.cfg.heroAnim=id;after();draw();toast('Đã chọn hoạt ảnh cho nhân vật chính.');
  }
  async function outlineLayerChoices(role,source,files,style){
    const pack=await outlineLayerPack(source,files,style);
    const choices=pack[outlineRoles[role]]||[],suggested=new Set(choices.map(a=>a.id));
    const primary=await Promise.all(choices.map(async item=>({id:item.id,label:item.label,recommended:true,
      thumb:role==='house'?await outlineHouseThumb(pack,item):pack.sheets[item.sid]?.url,
      image:pack.raw?.files?.[item.id]?()=>new Blob([pack.raw.files[item.id]]):undefined})));
    const others=pack.raw&&role!=='house'?outlineImageChoices(pack.raw).filter(a=>!suggested.has(a.id)).map(a=>({...a,
      image:()=>new Blob([pack.raw.files[a.id]],{type:a.id.endsWith('.png')?'image/png':a.id.endsWith('.webp')?'image/webp':'image/jpeg'})})): [];
    return {items:[...primary,...others],message:pack.skipReason||pack.assetWarning||'',scale:pack.scale};
  }
  const outlineHouseThumbs=new WeakMap();
  function outlineHouseThumb(pack,house){
    if(!outlineHouseThumbs.has(house))outlineHouseThumbs.set(house,(async()=>{
      const {w,h,ents}=house,sheets=[];
      for(const sid of new Set(ents.map(e=>e.tile.sid))){
        sheets[sid]={...pack.sheets[sid]};
        await loadSheet(sheets[sid]);
      }
      const canvas=Object.assign(document.createElement('canvas'),{width:160,height:112});
      const outline={loops:[[[0,0],[w,0],[w,h],[0,h]]],front:0,rear:0};
      drawOutlineDraft(canvas,{M:{w,h,ents,cfg:{outline},layers:Array.from({length:4},()=>new Uint8Array(w*h))},sheets});
      return canvas.toDataURL();
    })());
    return outlineHouseThumbs.get(house);
  }
  async function prepareOutlineLayerDressing(map,target,options,arrivals){
    const requested=Object.entries(options.layers).flatMap(([role,choice])=>{
      const groups=new Map(),assets=choice.assets??(choice.asset?[choice.asset]:[]);
      for(const asset of assets){
        const source=typeof asset==='string'?(choice.source||choice.sources?.[0]):asset.source;
        const id=typeof asset==='string'?asset:asset.id;
        if(!source||!id)continue;
        if(!groups.has(source))groups.set(source,[]);
        groups.get(source).push(id);
      }
      return [...groups].map(([source,ids])=>[role,source,ids]);
    });
    const stages={},materials=[],warnings=[],preserve=new Set(),wallNames=[],wallModules=[],characters=[],fulfilled=new Set();
    const picks=await Promise.all(requested.map(async ([role,source,ids])=>{
      const items=[],errors=[];
      try{
        const scaleOverrides=options.scaleOverrides||{},scaleKey=JSON.stringify([role,source]);
        const style={...options,manualScale:Object.hasOwn(scaleOverrides,scaleKey)?scaleOverrides[scaleKey]:scaleOverrides[source]};
        const pack=await outlineLayerPack(source,options.files,style),key=outlineRoles[role];
        for(const id of new Set(ids)){
          try{
            const item=pack[key]?.find(a=>a.id===id);
            if(item){
              // A chosen wall ZIP image is a construction block, not a flattened wall texture.
              if(role==='wall'&&pack.raw?.files?.[id])items.push(await outlineManualImage(pack.raw,id,'wall',{...style,packScale:pack.scale}));
              else items.push({item,sheets:pack.sheets});
              continue;
            }
            if(!pack.raw)throw Error(pack.skipReason||'Thiếu ảnh trong '+source+'.');
            const cacheKey=role+'|'+id;
            if(!pack.manual.has(cacheKey))pack.manual.set(cacheKey,outlineManualImage(pack.raw,id,role,{...style,packScale:pack.scale}));
            items.push(await pack.manual.get(cacheKey));
          }catch(error){errors.push(error.message);}
        }
      }catch(error){errors.push(error.message);}
      return {role,items,errors};
    }));
    for(const {role,items,errors} of picks){
      warnings.push(...new Set(errors));
      if(!items.length)continue;
      fulfilled.add(role);
      stages[role]=1;
      const material={floors:[],overlays:[],props:[],houses:[],walls:[]};
      for(const {item,sheets:sourceSheets} of items){
        const ids=new Map(),needed=role==='house'?item.ents.map(e=>e.tile.sid):[item.sid];
        for(const sid of new Set(needed))ids.set(sid,await loadBuiltinSheet(sourceSheets[sid],target));
        const remap=tile=>({...tile,sid:ids.get(tile.sid)});
        if(role==='character'){
          const actor=item.create(0,0,'outline-actor');
          characters.push({...actor,tile:remap(actor.tile)});
        }else if(role==='house')material.houses.push({...item,ents:item.ents.map(e=>({...e,tile:remap(e.tile)}))});
        else if(role==='props')material.props.push({...item,create:(...args)=>{
          const e=item.create(...args);e.tile=remap(e.tile);return e;
        }});
        else material[outlineRoles[role]].push(remap(item));
        if(role==='wall'){
          wallNames.push(target[ids.get(item.sid)].name);
          if(item.module)wallModules.push({...item.module,sheet:target[ids.get(item.sid)].name,label:item.label});
        }
      }
      materials.push(material);
    }
    for(const [role,choice] of Object.entries(options.layers)){
      const selected=choice.assets??(choice.asset?[choice.asset]:[]);
      if(selected.length&&!fulfilled.has(role))preserve.add(role);
    }
    if(wallNames.length){
      map.cfg.outline.wallMaterial=wallNames[0];
      map.cfg.outline.wallMaterials=wallNames;
      map.cfg.outline.wallModules=wallModules;
    }
    const floors=materials.flatMap(part=>part.floors);
    if(map.cfg.outline.surface)map.cfg.outline.surfaceMaterials=[...new Set(floors.map(item=>target[item.sid].name))];
    map.cfg.proj='iso';map.cfg.smooth=false;
    const info=dressOutline(map,materials,sid=>enc(sid,0),automaticPaintZones(map,makePaintLookup(target)),arrivals,stages,preserve,true);
    if(stages.overlay&&!info.overlays)warnings.push('Phủ nền chưa có chỗ phù hợp.');
    if(stages.props&&info.propKinds<materials.reduce((count,part)=>count+part.props.length,0))warnings.push('Một số mẫu vật dụng chưa có vị trí an toàn.');
    if(stages.house&&info.houses<materials.reduce((count,part)=>count+part.houses.length,0))warnings.push('Một số mẫu nhà chưa có chỗ đặt và lối vào an toàn.');
    if(!preserve.has('character')&&options.layers.character){
      map.ents=map.ents.filter(e=>!e.outlineCast);
      if(characters.length){
        const [hero,...support]=characters,cfg=map.cfg;
        if(!cfg.outlineHero)cfg.beforeOutlineHero={hero:cfg.hero,heroAnim:cfg.heroAnim,playerHeight:cfg.playerHeight,crouchHeight:cfg.crouchHeight};
        cfg.hero=hero.tile;cfg.heroAnim=null;
        cfg.outlineHero={sc:hero.sc,ox:hero.ox,oy:hero.oy};
        cfg.playerHeight=hero.bodyHeight;cfg.crouchHeight=hero.bodyHeight*.57;
        const start=map.ents.find(e=>e.t==='start');
        if(start&&support.length){
          const walk=linkWalkability(map,automaticPaintZones(map,makePaintLookup(target)));
          const seats=walk.component(start).filter(p=>Math.hypot(p.x-start.x,p.y-start.y)>=2&&
            !map.ents.some(e=>['goal','chest','npc','enemy','door'].includes(e.t)&&Math.hypot(p.x-e.x,p.y-e.y)<1.2));
          support.slice(0,seats.length).forEach((actor,i)=>{
            const p=seats[i];map.ents.push({...actor,x:p.x-.5,y:p.y-.5,id:'outline-cast-'+i,outlineCast:true});
          });
          if(support.length>seats.length)warnings.push('Một số nhân vật phụ chưa có chỗ đặt.');
        }
      }else if(map.cfg.beforeOutlineHero){
        Object.assign(map.cfg,map.cfg.beforeOutlineHero);
        delete map.cfg.outlineHero;delete map.cfg.beforeOutlineHero;
      }
    }
    map.cfg.outlineMaterials={...info,layers:options.layers,floorScale:options.floorScale,matchJoints:options.matchJoints,scaleOverrides:options.scaleOverrides};
    return {summary:`${info.props} vật dụng · ${info.overlays} ô phủ · ${info.houses} nhà${characters.length?' · '+characters.length+' nhân vật':''}.`,warnings:warnings.join(' ')};
  }
  async function prepareOutlineDressing(map,target,options,arrivals=[]){
    if(!options||map.cfg.outline?.surface?.finish===false)return null;
    if(options.layers)return prepareOutlineLayerDressing(map,target,options,arrivals);
    const stages=options.stages||null;
    const profiles=options.preset==='mix'?kenneyOutlinePacks:kenneyOutlinePacks.filter(profile=>profile[0]===options.preset);
    const style={floorScale:[2,4].includes(options.floorScale)?options.floorScale:1,matchJoints:!!options.matchJoints};
    const uploads=await Promise.all(options.files.map(file=>readOutlineFile(file,style)));
    const used=new Set();
    const tasks=profiles.map(profile=>{
      const local=uploads.find(item=>item.id===profile[0]&&item.materials.floors.length);
      if(!local)return loadBuiltinOutlinePack(profile,style);
      used.add(local);
      return local.materials;
    });
    for(const local of uploads)if(!used.has(local))tasks.push(local.materials);
    const materials=[],skipped=[];
    for(const pack of await Promise.all(tasks)){
      if(!pack.floors.length&&!pack.props.length&&!pack.overlays?.length&&!pack.houses?.length&&!pack.wallMaterial){skipped.push(pack.source+' — '+(pack.skipReason||'chưa nhận diện được sàn hoặc đạo cụ 2D'));continue;}
      const ids=[];
      for(const sheet of pack.sheets)ids.push(await loadBuiltinSheet(sheet,target));
      const props=pack.props.map(art=>({...art,create:(...args)=>{
        const e=art.create(...args);e.tile.sid=ids[e.tile.sid];return e;
      }}));
      const remap=f=>({...f,sid:ids[f.sid]});
      const houses=(pack.houses||[]).map(h=>({...h,ents:h.ents.map(e=>({...e,tile:remap(e.tile)}))}));
      const wallIndex=pack.sheets.findIndex(sheet=>sheet.name===pack.wallMaterial);
      const wallMaterial=target[ids[wallIndex]]?.name;
      materials.push({...pack,floors:pack.floors.map(remap),overlays:(pack.overlays||[]).map(remap),houses,props,wallMaterial});
    }
    if(!stages&&!materials.some(pack=>pack.floors.length)){
      throw Error('Chưa có sàn phù hợp. Hãy chọn Kenney Dungeon 2.3 hoặc dùng ZIP có sàn 2D.'+
        (skipped.length?' '+skipped.join('. ')+'.':''));
    }
    const floors=materials.flatMap(part=>part.floors);
    if(map.cfg.outline.surface)map.cfg.outline.surfaceMaterials=[...new Set(floors.map(item=>target[item.sid].name))];
    map.cfg.proj='iso';map.cfg.smooth=false;
    const info=dressOutline(map,materials,sid=>enc(sid,0),automaticPaintZones(map,makePaintLookup(target)),arrivals,stages);
    const walls=materials.filter(pack=>pack.wallMaterial);
    if(!stages||stages.wall){
      const wall=walls.length?walls[((stages?.wall||1)-1)%walls.length]:null;
      if(wall)map.cfg.outline.wallMaterial=wall.wallMaterial;
      else if(!stages)delete map.cfg.outline.wallMaterial;
    }
    if(stages){
      if(stages.floor&&!materials.some(p=>p.floors.length))skipped.push('nền · chưa nhận diện được ảnh sàn');
      if(stages.overlay&&!info.overlays)skipped.push('phủ nền · thiếu mảnh hoặc không có vùng phù hợp');
      if(stages.wall&&!walls.length)skipped.push('tường bao · giữ mặt tường hiện có');
      if(stages.props&&!info.props)skipped.push('vật dụng · thiếu mảnh hoặc không có vị trí an toàn');
      if(stages.house&&!info.houses)skipped.push('nhà · thiếu bộ tường, cửa, mái tương thích hoặc không đủ chỗ an toàn');
    }
    map.cfg.outlineMaterials={...info,preset:options.preset,...style,...(stages?{stages}:{})};
    return {
      summary:'Đã phối '+info.sources.length+' gói · '+info.props+' vật dụng'+(stages?' · '+info.overlays+' ô phủ · '+info.houses+' nhà':'')+'.',
      warnings:skipped.length?'Đã bỏ qua '+skipped.join('. ')+'.':''
    };
  }
  function applySceneEdits(map,source,placementZones){
    map.ents=map.ents.map(e=>withAssetSource(e,map.cfg,source));
    applyOutlinePropEdits({M:map,sheets:source,placementZones});
  }
  async function replaceWithOutlineMap(outline,w,h,level,stamps=[],origin=[0,0],materials=null){
    const before=M,index=curMap,revision=buildRevision,prepared=sheets.slice();
    const incoming=MAPS.flatMap((map,i)=>i===index?[]:map.ents.filter(e=>isMapLink(e)&&e.to===index&&e.tx!=null&&e.ty!=null));
    const replacement=await buildOutlineMap(outline,w,h,level,prepared,stamps,true,null,origin);
    const dressing=await prepareOutlineDressing(replacement,prepared,materials,incoming.map(e=>[e.tx+.5,e.ty+.5]));
    if(M!==before||curMap!==index||revision!==buildRevision)throw Error('Màn đang chỉnh đã đổi. Hãy mở lại Màn mẫu.');
    const collision=linkWalkability(replacement,automaticPaintZones(replacement,makePaintLookup(prepared)));
    if(incoming.some(e=>!collision.free(e.tx+.5,e.ty+.5,.28)))
      throw Error('Có cửa từ màn khác dẫn vào ô bị chặn trong mẫu. Hãy đưa đích cửa về chế độ tự động hoặc tạo bản sao.');
    applySceneEdits(replacement,prepared,automaticPaintZones(replacement,makePaintLookup(prepared)));
    replacement.name=before.name;
    sheets.push(...prepared.slice(sheets.length));
    pushUndo();M=replacement;selId=null;sel=null;hov=null;
    syncCur();after();fit();draw();cv.focus({preventScroll:true});
    toast('Đã áp dụng '+level.name+'. Có thể hoàn tác trong trình sửa.'+(dressing?' '+[dressing.summary,dressing.warnings].filter(Boolean).join(' '):''));
  }
  async function newOutlineMap(outline,w=M.w,h=M.h,level,stamps=[],origin=[0,0],useSource=true,connect=false,materials=null,linkFrom=curMap){
    const current=M,index=curMap,revision=buildRevision,prepared=sheets.slice();
    const fresh=await buildOutlineMap(outline,w,h,level,prepared,stamps,useSource,null,origin);
    const dressing=surfaceDressing(fresh,await prepareOutlineDressing(fresh,prepared,materials));
    if(M!==current||curMap!==index||revision!==buildRevision)throw Error('Màn đang chỉnh đã đổi. Hãy mở lại Đường bao.');
    if(MAPS.some(m=>m.name===fresh.name)||M.name===fresh.name){
      const name=fresh.name;
      let i=2;while(MAPS.some(m=>m.name===name+' · '+i)||M.name===name+' · '+i)i++;
      fresh.name=name+' · '+i;
    }
    applySceneEdits(fresh,prepared,automaticPaintZones(fresh,makePaintLookup(prepared)));
    const next=MAPS.length;
    const other=connect?(linkFrom===index?current:MAPS[linkFrom]):null;
    if(connect&&!other)throw Error('Màn đã chọn để nối không còn trong dự án.');
    const source=other?clone(other):null;
    if(source)addPair(source,fresh,linkFrom,next,prepared);
    syncCur();
    if(source)MAPS[linkFrom]=source;
    sheets.push(...prepared.slice(sheets.length));curMap=MAPS.push(clone(fresh))-1;M=fresh;undo=[];redo=[];selId=null;sel=null;
    after();fit();draw();await save();
    toast('Đã tạo '+fresh.name+(source?' và nối hai chiều với '+source.name:'.')+(dressing?' '+[dressing.summary,dressing.warnings].filter(Boolean).join(' '):''));
  }
  function clearOutline(){pushUndo();M.ents=M.ents.filter(e=>!e.wallId?.startsWith('outline:'));delete M.cfg.outline;if(!acceptStructure())return false;after();fit();draw();}
  const outlineUsedSources=()=>[M,...MAPS].flatMap(map=>Object.values(map.cfg.outlineMaterials?.layers||{})
    .flatMap(layer=>(layer.assets||(layer.asset?[layer.asset]:[])).map(asset=>typeof asset==='string'?layer.source:asset.source||layer.source)));
  const api={ready,showAssembly(){useTool('inventory');},applySceneMaterials,materialMapIndex:()=>curMap,startMaterialDrag,endMaterialDrag(){if(materialDrag){materialDrag=null;setMaterialAnchor(null);}},installDirectionalSet,armCharacterPlacement,setAnimatedHero,setAnimationScale,connectMap,mapConnectionBox,outlineConnectionTargets,outlinePlayData,showStockScenes,exportPNG,outlineGridBounds,applyOutline,replaceWithOutlineMap,newOutlineMap,resizeOutlineGrid,outlineLayerChoices,outlineUsedSources,outlinePackSources:stockPackList,clearOutline,readProject,restoreProject,startSample,builtinOutlineSample,setProjectMeta,fit,show(){dirty=true;setTimeout(fit,30);},gameData,sheets:()=>sheets,map:()=>M,hasClip:()=>!!clip};
  return api;
}
