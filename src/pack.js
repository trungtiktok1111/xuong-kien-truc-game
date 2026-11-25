/* Đọc gói tài nguyên từ file .zip: pack.json (xuong-pack-1) hoặc manifest.json của gói Thiếu Lâm.
   Kết quả: bộ nền (nen) + bộ vật thể (vat) cùng định dạng như gói dựng sẵn, có vai trò (r) cho từng mảnh. */
import {unzipSync,zipSync} from 'fflate';

/* ---------- vai trò app hiểu ---------- */
export const ROLES={
  'nen':'Nền đi được','nen-duong':'Nền lối đi chính','nen-cao':'Khối nền nâng cao','vien-nen':'Mép / góc nền','bac':'Bậc nối hai mặt cao thấp',
  'tuong':'Tường chắn','cong':'Cổng (trụ, xà, mái)','cua':'Cửa (đóng/mở)','nguong':'Ngưỡng cửa','den':'Đèn','cay':'Cây','chau':'Chậu / bồn',
  'cot':'Cột','ban':'Bàn / đồ lớn','ke':'Kệ / tủ','vat':'Vật khác','ruong':'Rương / vật ở nhánh cụt','tham':'Thảm phủ nền','mai':'Mái phủ trên cao'};
export const PLACES=['wall','center','corner','free','edge'];
/* họ bố cục và vai trò bắt buộc (một vai trò có thể thoả bằng một trong các lựa chọn, ngăn bởi |) */
export const FAMILIES={
  'phong-hanh-lang':{name:'Phòng + hành lang',need:['nen','tuong','cua|cong']},
  'san-don':{name:'Sân đơn',need:['nen','tuong']},
  'san-doi':{name:'Sân đôi (hai khu)',need:['nen','tuong']},
  'san-bac':{name:'Sân bậc (hai tầng sân + cổng)',need:['nen','nen-cao','bac','tuong','cong']},
};
/* một họ bố cục dựng được khi đủ vai trò VÀ gói khai báo luật ghép riêng của nó (rules[họ]) — app không đoán hằng số ghép */
export function familyReport(roles,rules){const have=new Set(roles);return Object.entries(FAMILIES).map(([id,f])=>{const miss=f.need.filter(n=>!n.split('|').some(r=>have.has(r)));if(!(rules&&rules[id]))miss.push('luật ghép rules["'+id+'"] trong pack.json');return {id,name:f.name,ok:!miss.length,miss};});}

/* ---------- đọc manifest tác giả (gói Thiếu Lâm: Du-Lieu/manifest.json) → xuong-pack-1 ---------- */
const LEG=[ // [tiền tố, role, part, place]
  ['duong_da','nen-duong'],['nen_san_cao','nen-cao'],['nen_da','nen'],['nen_dat','nen'],['nen_co','nen'],
  ['mep_nen','vien-nen','canh'],['goc_nen_trong','vien-nen','goc-trong'],['goc_nen_ngoai','vien-nen','goc-ngoai'],
  ['bac_them','bac'],['tuong_da','tuong'],['tru_cong','cong','tru'],['xa_go','cong','xa'],['mai_hien_dau_trai','cong','mai-trai'],['mai_hien_giua','cong','mai-giua'],['mai_hien_dau_phai','cong','mai-phai'],
  ['cua_dong','cua','','','dong'],['cua_mo','cua','','','mo'],['nguong_da','nguong'],['den_da','den','','edge'],
  ['lu_huong','vat','','free'],['bon_cay','chau','','edge'],['tung_chau','cay','','free']];
const NAMEVI={nen_da:'Nền đá',nen_dat:'Nền đất',nen_co:'Nền cỏ',duong_da:'Đường đá',mep_nen:'Mép nền',goc_nen_trong:'Góc nền trong',goc_nen_ngoai:'Góc nền ngoài',nen_san_cao:'Nền sân cao',
  bac_them:'Bậc thềm',tuong_da:'Tường đá',tru_cong:'Trụ cổng',cua_dong:'Cửa đóng',cua_mo:'Cửa mở',xa_go:'Xà gỗ',mai_hien_giua:'Mái hiên giữa',mai_hien_dau_trai:'Mái hiên đầu trái',mai_hien_dau_phai:'Mái hiên đầu phải',
  nguong_da:'Ngưỡng đá',den_da:'Đèn đá',lu_huong:'Lư hương',bon_cay:'Bồn cây',tung_chau:'Tùng chậu'};
const DVI={E:'Đông',S:'Nam',W:'Tây',N:'Bắc'};
function splitKey(k){const m=k.match(/^(.+)_([ESWN])$/);const b=m?m[1]:k,d=m?m[2]:'ALL';return {base:b.replace(/_\d$/,''),var:(b.match(/_(\d)$/)||[])[1]||'',dir:d};}
export function fromLegacy(raw){
  const pr=raw.projection||{},out={format:'xuong-pack-1',legacy:true,projection:{type:'iso',tile:pr.tileSize||[256,128],canvas:pr.sourceCanvas||[256,512],anchor:pr.anchor||[128,384],rotation:pr.rotation||{E:0,S:90,W:180,N:270}},assets:{}};
  for(const [k,v] of Object.entries(raw.assets||{})){
    const s=splitKey(k),L=LEG.find(a=>s.base.startsWith(a[0]));
    const a={png:v.png,dir:v.direction&&v.direction!=='ALL'?v.direction:s.dir,group:s.base,var:s.var,anchor:v.anchor,alpha:v.alphaBounds};
    if(L){a.role=L[1];if(L[2])a.part=L[2];if(L[3])a.place=L[3];if(L[4])a.state=L[4];}
    else a.role=({ground:'nen',stair:'bac',wall:'tuong',door:'cua',upper:'cong',floorOverlay:'nguong',prop:'vat'})[v.kind];
    if(v.footprint)a.footprint=v.footprint;if(v.solid!=null)a.solid=!!v.solid;if(v.blocksEdge)a.blocksEdge=true;
    if(v.risePx!=null)a.rise=v.risePx;if(v.mountPx!=null)a.mount=v.mountPx;
    if(v.highSideByDirection)a.high=v.highSideByDirection;if(v.decorativeSkirtPx!=null)a.skirt=v.decorativeSkirtPx;
    a.kind=v.kind;out.assets[k]=a;}
  const st=Object.values(out.assets).find(a=>a.role==='bac'&&a.rise!=null);
  if(st)for(const a of Object.values(out.assets))if(a.role==='nen-cao'&&a.rise==null){a.rise=st.rise;a.riseFrom='bac';}
  return out;}

/* Cảnh mẫu của tác giả (canh-mau.json) chứa cách ghép cổng, tường, trụ: trích thành rules['san-bac'] */
export function rulesFromSample(c){
  if(!c||!c.gate||!Array.isArray(c.objects))return null;const O=c.objects,[gx,gy]=c.gate.placement,z0=c.gate.zPx||0,base=o=>o.id.replace(/_[ESWN]$/,''),dir=o=>(o.id.match(/_([ESWN])$/)||[])[1]||'ALL';
  const by=id=>O.filter(o=>base(o)===id),r2=v=>Math.round(v*1000)/1000;
  const wb=by('tuong_da').filter(o=>dir(o)==='E'),wl=by('tuong_da').filter(o=>dir(o)==='S'),wr=by('tuong_da').filter(o=>dir(o)==='N'),pil=by('tru_cong'),th=by('nguong_da')[0],door=O.find(o=>o.stateGroup);
  if(!wb.length||!wl.length||!wr.length||pil.length<2)return null;
  const beam=by('xa_go')[0],roofs=O.filter(o=>/^mai_hien/.test(o.id));
  const W=c.width,rule={'san-bac':{
    wallBack:{piece:'tuong_da',dir:'E',dy:r2(wb[0].y-gy)},
    wallSide:{piece:'tuong_da',left:{dir:'S',x:r2(wl[0].x)},right:{dir:'N',dx:r2(wr[0].x-(W-1))},y0:r2(wl[0].y),step:r2(wl[1]?wl[1].y-wl[0].y:1)},
    gate:{pillar:'tru_cong',pillarX:pil.map(o=>r2(o.x-gx)).sort((a,b)=>a-b),dy:0,threshold:th?'nguong_da':null,door:door?door.alternate?door.alternate.replace(/_[ESWN]$/,''):'cua_mo':'cua_mo',doorDir:'E',
      beam:beam?'xa_go':null,beamZ:beam?beam.z-z0:0,roof:['mai_hien_dau_trai','mai_hien_giua','mai_hien_dau_phai'],roofZ:roofs[0]?roofs[0].z-z0:0,span:3,hinges:c.gate.hinges},
    rise:z0,props:{}}};
  /* các đồ trang trí tương đối với cổng / mép sân */
  const lam=by('den_da'),inc=by('lu_huong')[0],pine=by('tung_chau'),plant=by('bon_cay');
  const up=lam.filter(o=>o.z===z0),lo=lam.filter(o=>o.z===0);
  const R=rule['san-bac'];
  if(up.length)R.upperLamp={piece:'den_da',dx:r2(Math.abs(up[0].x-gx)),dyFront:r2(up[0].y-(c.walkDemo&&c.walkDemo.stairs?c.walkDemo.stairs.from[1]-.5:0))};
  if(lo.length)R.lowerLamp={piece:'den_da',dx:r2(Math.abs(lo[0].x-gx)),dyRow:r2(lo[0].y-Math.floor(lo[0].y)),every:3};
  if(inc)R.incense={piece:'lu_huong',dir:dir(inc),y:r2(inc.y)};
  const pu=pine.filter(o=>o.z===z0);if(pu.length)R.pineUpper={piece:'tung_chau',dir:'S',xL:r2(pu[0].x),xR:r2(pu[pu.length-1].x-(W-1)),y:r2(pu[0].y)};
  if(pine.some(o=>o.z===0))R.pineBed={piece:'tung_chau'};
  if(plant.length)R.planter={piece:'bon_cay',dirs:[...new Set(plant.map(dir))]};
  return rule;}

/* ---------- kiểm manifest: trả về {ok,errors,warns,man} ---------- */
export function checkManifest(man,files){
  const E=[],W=[],A=man.assets||{};
  if(man.format!=='xuong-pack-1'){E.push('format phải là "xuong-pack-1"');return {ok:false,errors:E,warns:W,man};}
  const pr=man.projection||{};
  if(!Array.isArray(pr.tile)||pr.tile.length!==2)E.push('projection.tile phải là [rộng, cao] của ô sàn (px)');
  if(!Array.isArray(pr.canvas)||pr.canvas.length!==2)E.push('projection.canvas phải là [rộng, cao] của khung ảnh (px)');
  if(!Array.isArray(pr.anchor)||pr.anchor.length!==2)E.push('projection.anchor phải là [x,y] tâm mặt sàn trong ảnh (px)');
  const names=Object.keys(A);if(!names.length)E.push('assets rỗng');
  for(const [k,a] of Object.entries(A)){
    if(!a.png){E.push(k+': thiếu png');continue;}
    if(files&&!files[a.png]){E.push(k+': không thấy tệp '+a.png+' trong zip');}
    if(a.at&&!(Array.isArray(a.at)&&a.at.length===2))E.push(k+': at phải là [x,y] vị trí đặt ảnh trong khung canvas');
    if(!a.role||!ROLES[a.role])E.push(k+': vai trò "'+(a.role||'')+'" không hợp lệ');
    if(a.role==='bac'&&a.rise==null)E.push(k+': bậc phải có rise (px)');
    if(a.role==='nen-cao'&&a.rise==null)W.push(k+': nền cao nên có rise (px)');
    if(a.role==='cua'&&!a.state)W.push(k+': cửa nên khai báo state (dong|mo)');
    if(['tuong','cong','cot','ban','ke','den','cay','chau','vat','ruong'].includes(a.role)&&a.solid!==false&&!a.footprint&&!a.col&&!(a.role==='cong'&&a.part&&a.part!=='tru'))W.push(k+': chưa có footprint — coi là "chưa hiệu chỉnh" (vùng chặn tạm)');
  }
  return {ok:!E.length,errors:E,warns:W,man};}

/* ---------- ảnh ---------- */
async function bmp(u8){return createImageBitmap(new Blob([u8],{type:'image/png'}));}
function cnv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function bbox(bm){const c=cnv(bm.width,bm.height),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(bm,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}return x1<0?[0,0,0,0]:[x0,y0,x1+1,y1+1];}

/* quay chân (footprint ở hệ cục bộ E) theo hướng */
function rot(fp,d){const [x0,y0,x1,y1]=fp,f={E:(x,y)=>[x,y],S:(x,y)=>[-y,x],W:(x,y)=>[-x,-y],N:(x,y)=>[y,-x],ALL:(x,y)=>[x,y]}[d]||((x,y)=>[x,y]);const p=[f(x0,y0),f(x1,y1)];return [Math.min(p[0][0],p[1][0]),Math.min(p[0][1],p[1][1]),Math.max(p[0][0],p[1][0]),Math.max(p[0][1],p[1][1])];}
const FLAT=new Set(['nen','nen-duong','nen-cao','vien-nen','bac','nguong','tham','mai']);
function zbFor(a,d){
  if(FLAT.has(a.role)||a.role==='cua'||(a.role==='cong'&&a.part&&a.part!=='tru'))return [0,0,0,0];
  if(a.solid===false)return [0,0,0,0];
  const fp=a.footprint;if(!fp)return null;
  const [x0,y0,x1,y1]=rot(fp,d);return [r3(x0-.5),r3(y0-.5),r3(x1-x0),r3(y1-y0)];}
const r3=v=>Math.round(v*1000)/1000,r4=v=>Math.round(v*10000)/10000;
/* vùng chặn tuỳ chỉnh (col): toạ độ theo hệ cục bộ E, gốc ở tâm ô; xoay theo hướng rồi đổi sang gốc góc trước (−.5) như zb */
function colFor(a,d){if(!a.col||!a.col.length)return null;const f={E:(x,y)=>[x,y],S:(x,y)=>[-y,x],W:(x,y)=>[-x,-y],N:(x,y)=>[y,-x],ALL:(x,y)=>[x,y]}[d]||((x,y)=>[x,y]);
  const P=q=>{const r=f(q[0],q[1]);return [r3(r[0]-.5),r3(r[1]-.5)];};
  return a.col.map(c=>c.k==='circle'?{k:'circle',...(()=>{const r=P([c.x,c.y]);return {x:r[0],y:r[1]};})(),r:c.r}:c.k==='rect'?(()=>{const A=P([c.x,c.y]),B=P([c.x+c.w,c.y+c.h]);return {k:'rect',x:Math.min(A[0],B[0]),y:Math.min(A[1],B[1]),w:r3(Math.abs(B[0]-A[0])),h:r3(Math.abs(B[1]-A[1]))};})():c.k==='poly'?{k:'poly',pts:c.pts.map(P)}:{k:'seg',a:P(c.a),b:P(c.b),th:c.th||.25});}
/* nhóm vai trò thể hiện trên sprite cũ (Hạ tầng/Nhà/Vật…) để editor cũ vẫn phân loại được */
const OLDROLE={'nen':'Phủ nền','nen-duong':'Phủ nền','nen-cao':'Phủ nền','vien-nen':'Phủ nền','tham':'Phủ nền','nguong':'Phủ nền','bac':'Hạ tầng','tuong':'Nhà','cua':'Nhà','cong':'Nhà','mai':'Mái/cửa','cay':'Cây'};
const oldRole=a=>a.role==='cong'&&a.part&&a.part!=='tru'?'Mái/cửa':(OLDROLE[a.role]||'Vật');
const VN=(a,k,s)=>{const b=NAMEVI[a.group||s.base]||a.name||s.base;return b+(s.var?' '+s.var:'')+(s.dir!=='ALL'?' · '+DVI[s.dir]:'');};

/* ---------- dựng bộ nền + bộ vật từ zip ---------- */
export async function readZip(u8,fname){
  let hasImages=false;
  const files=unzipSync(u8,{filter:e=>{
    if(/(^|\/)(__MACOSX|\._)/.test(e.name)||e.name.endsWith('/'))return false;
    if(/\.(png|webp|jpe?g|gif)$/i.test(e.name))hasImages=true;
    return /\.(png|json|md)$/i.test(e.name);
  }});
  /* chuẩn hoá đường dẫn: bỏ thư mục bọc ngoài nếu có */
  const names=Object.keys(files);let pre='';const pj=names.find(n=>/(^|\/)pack\.json$/i.test(n)),lg=names.find(n=>/(^|\/)manifest\.json$/i.test(n));
  const mp=pj||lg;if(!mp)return {hasImages,error:'Không thấy pack.json (xuong-pack-1) hoặc Du-Lieu/manifest.json trong zip. Gói cần có tệp khai báo để app biết từng mảnh là gì.'};
  const root=mp.replace(/(pack\.json|manifest\.json)$/i,'');
  /* ảnh có thể ở cạnh pack.json hoặc ở thư mục cha của Du-Lieu/ */
  const base=pj?root:root.replace(/[^/]*\/$/,'');
  let raw;try{raw=JSON.parse(new TextDecoder().decode(files[mp]));}catch(e){return {error:'Không đọc được '+mp+': '+e.message};}
  let man=raw.format==='xuong-pack-1'?raw:(raw.formatVersion===1&&raw.assets?fromLegacy(raw):null);
  if(!man)return {hasImages,error:'Tệp khai báo không đúng định dạng: cần "format":"xuong-pack-1" hoặc manifest Thiếu Lâm (formatVersion 1).'};
  const fm={};for(const a of Object.values(man.assets||{})){const p=a.png;if(!p)continue;fm[p]=files[base+p]||files[p]||null;}
  if(man.legacy){const cm=names.find(n=>/(^|\/)canh-mau\.json$/i.test(n));if(cm){try{const r=rulesFromSample(JSON.parse(new TextDecoder().decode(files[cm])));if(r){man.rules=Object.assign(man.rules||{},r);man.rulesFrom='canh-mau.json';}}catch(e){}}}
  man.id=man.id||raw.id||String(fname||'goi').replace(/\.zip$/i,'').replace(/^[0-9a-f]{8}-/i,'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'goi';
  man.name=man.name||raw.name||man.id;
  return {man,files:fm,rawName:mp,check:checkManifest(man,fm)};}

export async function buildPack(man,files,progress){
  const pr=man.projection,[TW,TH]=pr.tile,[CW,CH]=pr.canvas,[AX,AY]=pr.anchor,ent=Object.entries(man.assets),bms={},ab={};
  let n=0;for(const [k,a] of ent){let bm=await bmp(files[a.png]);if(a.at){const c=cnv(CW,CH);c.getContext('2d').drawImage(bm,a.at[0],a.at[1]);bm=c;}bms[k]=bm;ab[k]=a.alpha&&a.alpha.length===4?a.alpha:bbox(bm);if(progress&&++n%10===0)progress('Đọc ảnh '+n+'/'+ent.length);await new Promise(r=>setTimeout(r));}
  /* --- bộ nền: ô TW×TW, đỉnh ô ở y=cy --- */
  const CY=Math.round(TH/2),nc=8;
  const gl=ent.filter(([k,a])=>['nen','nen-duong','nen-cao','vien-nen','nguong'].includes(a.role));
  const nenIdx={},nr=Math.ceil(gl.length/nc),ncv=cnv(nc*TW,nr*TW),ng=ncv.getContext('2d');
  gl.forEach(([k,a],i)=>{const top=ab[k][1];ng.drawImage(bms[k],0,top-CY,CW,TW,(i%nc)*TW,Math.floor(i/nc)*TW,CW,TW);nenIdx[k.toLowerCase()]=i;});
  /* các khoá tiện dùng chung (nen, san) để editor/bộ dựng cũ tìm được */
  const first=r=>{const e=gl.find(([k,a])=>a.role===r);return e?nenIdx[e[0].toLowerCase()]:null;};
  if(first('nen')!=null)nenIdx['nen']=first('nen');if(first('nen-duong')!=null)nenIdx['san']=first('nen-duong');
  const nenPk=gl.length?{id:man.id,name:man.name+' · nền sân',desc:'nền đi được, mép, góc',tw:TW,cy:CY,cols:nc,idx:nenIdx,bz:{},atlas:ncv.toDataURL('image/png'),
    rolesOf:Object.fromEntries(gl.map(([k,a])=>[k.toLowerCase(),{r:a.role,part:a.part||'',dir:a.dir||'ALL',rise:a.rise||0,g:a.group||splitKey(k).base,v:a.var||''}]))}:null;
  /* --- bộ vật: ô vuông T, điểm neo giữa đáy ô --- */
  const vl=ent;
  let minTop=CH;for(const [k] of vl)minTop=Math.min(minTop,ab[k][1]);
  const T=Math.ceil(Math.max(CW,CH-minTop)/8)*8,cols=12,rows=Math.ceil(vl.length/cols),vcv=cnv(cols*T,rows*T),vg=vcv.getContext('2d'),items=[];
  const sc=r4(T*(192/TW)/128),oy=r4((CH-AY-TH/2)/T);
  vl.forEach(([k,a],i)=>{const s=splitKey(k),d=a.dir||s.dir;vg.drawImage(bms[k],0,CH-T,CW,T,(i%cols)*T+Math.floor((T-CW)/2),Math.floor(i/cols)*T,CW,T);
    const b=ab[k],zb=zbFor(a,d),col=colFor(a,d);
    const it={name:VN(a,k,s),role:oldRole(a),cv:null,i,fx:1,fy:1,sc,zb:zb||[-.8,-.8,.6,.6],k:a.group||s.base,d,oy,w:b[2]-b[0],h:CH-b[1],
      r:a.role,cal:(zb||col)?1:0};
    if(col)it.col=col;
    if(a.part)it.part=a.part;if(a.state)it.st=a.state;if(a.place)it.place=a.place;if(a.rise!=null)it.rise=a.rise;if(a.mount!=null)it.mount=a.mount;if(a.blocksEdge)it.blocksEdge=1;if(a.solid===false)it.solid=0;
    if(a.var)it.v=a.var;if(a.high)it.high=a.high;items.push(it);});
  const vatPk={id:man.id,name:man.name,desc:'gói '+(man.legacy?'(manifest tác giả)':'xuong-pack-1'),T,cols,items,atlas:vcv.toDataURL('image/png'),
    proj:{tile:pr.tile,canvas:pr.canvas,anchor:pr.anchor,unit:pr.zUnit||'px'},rise:Object.fromEntries(vl.filter(([k,a])=>a.rise!=null).map(([k,a])=>[k,a.rise]))};
  const roles=[...new Set(ent.map(([k,a])=>a.role))];
  const profiles={};
  const sb=man.rules&&man.rules['san-bac'];
  if(sb&&familyReport(roles,man.rules).find(f=>f.id==='san-bac').ok)profiles['san-bac']={name:'🏯 Sân bậc (hai tầng sân + cổng) — '+man.name,family:'san-bac',type:'sanbac',nens:[man.id],vats:[man.id],rules:sb};
  vatPk.rules=man.rules||null;
  const th=cnv(96,48);if(gl.length)th.getContext('2d').drawImage(ncv,0,CY,TW,TH,0,0,96,48);
  return {nen:nenPk,vat:vatPk,profiles,roles,thumb:gl.length?th.toDataURL('image/png'):'',nItems:items.length,nGround:gl.length,
    families:familyReport(roles,man.rules)};}

/* Xuất gói về dạng chuẩn: pack.json + sprites/ (để dùng lại, chia sẻ) */
export function exportPackZip(man,files){const out={},m=JSON.parse(JSON.stringify(man));delete m.legacy;
  for(const [k,a] of Object.entries(m.assets)){const src=files[a.png];if(!src)continue;const np='sprites/'+k+'.png';out[np]=src;a.png=np;}
  out['pack.json']=new TextEncoder().encode(JSON.stringify(m,null,1));return zipSync(out,{level:0});}
