import {outlineCollision3D} from './outline3d.js';
import {constructionContext,gateIssue,wallIssue,isRoof,roofPlacementProblems} from './constructionRules2d.js';
import {mapCollision} from './mapCollision.js';
import {guideBox,appGuides} from './editorHelp.js';
import {zRaster,decoZones} from './zones.js';
// Kiểm tra game theo luật của skill html5-game-studio (kiem-thu.md mục 7, cong-kiem.md, SKILL.md luật 7/9/10)
// Trạng thái: pass | missing | broken | not_assessed  (không có "đạt giả")
import {el,lsGet,lsSet,toast} from './util.js';
import {checkLogic} from './logic.js';

const SOLID={cube:1,slab:1,wedge:1,stairs:1,curve:1,pillar:1,panel:1,window:1,rail:1};
const R=(id,st,txt,why)=>({id,st,txt,why:why||''});

// ---------- 2D ----------
function bfs2(d,sx,sy){const W=d.w,H=d.h,seen=new Uint8Array(W*H);if(sx<0||sy<0||sx>=W||sy>=H)return seen;const q=[[sx,sy]];seen[sy*W+sx]=1;
  while(q.length){const [x,y]=q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=W||ny>=H)continue;const i=ny*W+nx;if(seen[i]||d.blk[i])continue;seen[i]=1;q.push([nx,ny]);}}return seen;}
export function check2D(d0){
  const zz=[...((d0.cfg&&d0.cfg.zones)||[]),...decoZones(d0.ents)],zr=zz.length?zRaster(zz,d0.w,d0.h):null;const d=zr?Object.assign({},d0,{blk:Array.from(d0.blk,(v,i)=>v||zr[i]?1:0)}):d0;
  const geometry=mapCollision(d0);
  const out=[],E=d.ents||[],cf=d.cfg||{},W=d.w,H=d.h;
  const st=E.find(e=>e.t==='start'),goals=E.filter(e=>e.t==='goal'),en=E.filter(e=>e.t==='enemy');
  const cell=e=>Math.floor(e.y)*W+Math.floor(e.x);
  const startFree=st&&geometry.free(st.x+.5,st.y+.5,.28)&&!d.blk[cell(st)];
  if(!E.length){out.push(R('F1','not_assessed','Chưa đặt đối tượng nào: game chạy chế độ cũ (quái rải ngẫu nhiên)','không có dữ liệu để kiểm xuất phát/đích; vào tab 🎯 Đối tượng để đặt'));}
  else{
    out.push(st?R('F1','pass','Có điểm xuất phát'):R('F1','missing','Chưa có 🚩 Xuất phát','game sẽ đặt người chơi ở vị trí mặc định'));
    if(st){out.push(!startFree?R('F2','broken','Điểm xuất phát nằm trong ô bị chặn','người chơi bị kẹt (luật "không bao giờ kẹt")'):R('F2','pass','Điểm xuất phát nằm trên ô đi được'));}
    const win=cf.win||'auto';
    const need=win==='goal'?'goal':win==='kill'?'kill':win==='both'?'both':(goals.length?(en.length?'both':'goal'):'kill');
    const byRule=checkLogic(cf,E).canWinByRule;const canWin=byRule||(need==='goal'&&goals.length)||(need==='kill'&&en.length)||(need==='both'&&goals.length&&en.length)||(need==='both'&&goals.length);
    out.push(canWin||(win==='auto'&&(goals.length||en.length))?R('F3','pass','Có cách thắng ('+({goal:'chạm đích',kill:'diệt hết quái',both:'diệt quái rồi chạm đích'})[need]+')'):R('F3','broken','Không có cách thắng','điều kiện thắng "'+win+'" nhưng thiếu '+(win==='goal'?'🏁 Đích':win==='kill'?'👾 Quái':'🏁 Đích hoặc 👾 Quái')));
    if(startFree){
      const seen=bfs2(d,Math.floor(st.x),Math.floor(st.y));
      const bad=(arr)=>arr.filter(e=>!seen[cell(e)]);
      if(goals.length){const b=bad(goals);out.push(b.length?R('F4','broken','Đích không đi tới được từ điểm xuất phát','bị tường/nước chặn kín ('+b.length+'/'+goals.length+' đích)'):R('F4','pass','Đích đi tới được từ điểm xuất phát (BFS 4 hướng)'));}
      if(en.length){const b=bad(en);out.push(b.length?R('F5','broken',b.length+'/'+en.length+' quái nằm vùng không tới được','không diệt hết được nếu điều kiện thắng là diệt quái'):R('F5','pass','Mọi quái đều tới được'));}
      const oth=bad(E.filter(e=>e.t==='npc'||e.t==='chest'));out.push(oth.length?R('F6','broken',oth.length+' NPC/rương nằm vùng không tới được'):R('F6','pass','NPC và rương đều tới được'));
    }else out.push(R('F4','not_assessed','Chưa kiểm đường tới đích','cần điểm xuất phát hợp lệ'));
    const onBlk=E.filter(e=>e.t!=='start'&&e.t!=='deco'&&d.blk[cell(e)]);out.push(onBlk.length?R('F7','broken',onBlk.length+' đối tượng nằm trong ô bị chặn'):R('F7','pass','Không đối tượng nào nằm trong ô bị chặn'));
    out.push(E.some(e=>{const dx=e.placedProp?1:0,x=e.x+dx,y=e.y+dx;return x<0||y<0||(e.wallId?.startsWith('outline:')?(x>W||y>H):(x>=W||y>=H));})?R('F8','broken','Có đối tượng nằm ngoài bản đồ'):R('F8','pass','Mọi đối tượng nằm trong bản đồ'));
  }
  const gates=E.filter(e=>e.gateAssembly);
  const walls=E.filter(e=>e.wallLine);
  const roofs=E.filter(isRoof);
  const context=(walls.length||gates.length||roofs.length)?constructionContext(d0):null;
  if(roofs.length){
    const bad=roofPlacementProblems(d0,context);
    out.push(bad.length?R('ROOF','broken',bad.length+'/'+roofs.length+' mái thiếu điểm tựa',
      bad.slice(0,5).map(e=>(e.name||'Mái')+' · X '+(e.x+1).toFixed(2)+' · Y '+(e.y+1).toFixed(2)).join(' | ')):
      R('ROOF','pass','Các mái có hai điểm tựa đúng cao độ'));
  }
  if(walls.length){
    const invalid=walls.filter(e=>wallIssue(e,{...context,objects:context.objects.filter(z=>!context.gates.some(g=>g.wallId===e.id&&g.id===z.deco)),gates:context.gates.filter(g=>g.wallId!==e.id)}));
    out.push(invalid.length?R('WALL','broken',invalid.length+' đoạn tường cần chỉnh','Kiểm tra sàn đỡ và các vùng chặn dọc chân tường.'):
      R('WALL','pass','Các tuyến tường có sàn đỡ'));
  }
  if(gates.length){
    const lost=gates.map(e=>[e,gateIssue(e,context)]).filter(([,issue])=>issue);
    out.push(lost.length?R('GATE','broken',lost.length+'/'+gates.length+' cổng cần chỉnh',
      lost.slice(0,5).map(([e,why])=>(e.name||'Cổng')+' ('+(e.x+1).toFixed(1)+', '+(e.y+1).toFixed(1)+') · '+why).join(' | ')):
      R('GATE','pass','Tất cả cổng có tường và lối tiếp cận'));
  }
  logicRows(out,cf,E);
  paramRows(out,cf,['hp','spd','dmg','rng']);
  common(out,'2d');return out;}

// ---------- 3D ----------
function mk3(d){const V=new Map();for(const [k,s,m,r] of d.voxels||[])V.set(k,{s,m,r});
  const grid=d.grid||[48,24,48],planAllows=outlineCollision3D(d.cfg?.outline,grid);
  const vox=(x,y,z)=>V.get(x+','+y+','+z);
  function topAt(v,fx,fz){const s=v.s;if(s==='arch')return -1;if(s==='slab')return .5;if(s==='wedge'||s==='stairs'||s==='curve'){const th=v.r*Math.PI/2,lx=fx-.5,lz=fz-.5,c=Math.cos(th),sn=Math.sin(th);const lz2=lx*sn+lz*c;const t=Math.min(1,Math.max(0,.5-lz2));return s==='wedge'?t:s==='curve'?t*t:Math.min(1,Math.floor(t*4)/4+.25);}return SOLID[s]?1:-1;}
  function ground(x,z,y,step){const cx=Math.floor(x),cz=Math.floor(z);for(let cy=Math.min(grid[1]-1,Math.floor(y+step));cy>=0;cy--){const v=vox(cx,cy,cz);if(!v)continue;const h=topAt(v,x-cx,z-cz);if(h>=0)return cy+h;}return 0;}
  function okAt(x,z,y,step){const Rr=.25;if(!planAllows(x,z,y,Rr))return false;for(const [a,b] of [[-Rr,-Rr],[Rr,-Rr],[-Rr,Rr],[Rr,Rr],[0,0]]){const px=x+a,pz=z+b,g=ground(px,pz,y,step);if(g>y+step+.01)return false;const y0=Math.max(g,y),cx=Math.floor(px),cz=Math.floor(pz);
    for(let cy=Math.floor(y0+.05);cy<=Math.floor(y0+1.7)&&cy<((d.grid&&d.grid[1])||24);cy++){const v=vox(cx,cy,cz);if(!v)continue;const h=topAt(v,px-cx,pz-cz);if(h>=0&&cy+h>y0+.05)return false;}}return true;}
  return {ground,okAt,V,grid};}
// BFS trên lưới 0.5; step=.55 là đi bộ, step=1.2 là có nhảy (nhảy cao = 7.5²/(2·22) ≈ 1.28)
function reach3(P,sx,sz,sy,step){const seen=new Map(),key=(i,j,h)=>i+','+j+','+h;const gx=Math.round(sx*2),gz=Math.round(sz*2);const q=[[gx,gz,sy]];seen.set(key(gx,gz,Math.round(sy*2)),1);let n=0;
  while(q.length&&n++<200000){const [i,j,y]=q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+a,nj=j+b;if(ni<0||nj<0||ni>=P.grid[0]*2||nj>=P.grid[2]*2)continue;const x=ni/2,z=nj/2;if(!P.okAt(x,z,y,step))continue;const g=P.ground(x,z,y,step);if(g>y+step+.01)continue;const k=key(ni,nj,Math.round(g*2));if(seen.has(k))continue;seen.set(k,1);q.push([ni,nj,g]);}}
  return seen;}
// có trạng thái đứng được gần đối tượng (cùng cột ±1 ô, chênh cao < dy)
function near3(seen,e,dy){const ci=Math.round((e.x+.5)*2),cj=Math.round((e.z+.5)*2);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let h=Math.round((e.y-dy)*2);h<=Math.round((e.y+dy)*2);h++)if(seen.has((ci+a)+','+(cj+b)+','+h))return true;return false;}
export function check3D(d){
  const out=[],E=d.ents||[],cf=d.cfg||{};
  const st=E.find(e=>e.t==='start'),goals=E.filter(e=>e.t==='goal'),en=E.filter(e=>e.t==='enemy');
  out.push(R('V1','pass' ,(d.voxels||[]).length?('Công trình có '+d.voxels.length+' khối'):'','') );
  if(cf.outline?.loops?.length)out[0]=R('V1','pass','Có mặt bằng Đường Bao 3D');
  else if(!(d.voxels||[]).length)out[0]=R('V1','missing','Chưa dựng khối nào');
  if(!E.length){out.push(R('F1','not_assessed','Chưa đặt đối tượng nào: game 3D chỉ để dạo quanh','không có dữ liệu để kiểm xuất phát/đích; vào tab 🎯 Đối tượng để đặt'));}
  else{
    out.push(st?R('F1','pass','Có điểm xuất phát'):R('F1','missing','Chưa có 🚩 Xuất phát','người chơi sẽ ở vị trí mặc định'));
    const win=cf.win||'auto';
    const need=win==='goal'?'goal':win==='kill'?'kill':win==='both'?'both':(goals.length?(en.length?'both':'goal'):'kill');
    const ok=checkLogic(cf,E).canWinByRule||(need==='goal'&&goals.length)||(need==='kill'&&en.length)||(need==='both'&&goals.length);
    out.push(ok?R('F3','pass','Có cách thắng ('+({goal:'chạm đích',kill:'diệt hết quái',both:'diệt quái rồi chạm đích'})[need]+')'):R('F3','broken','Không có cách thắng','điều kiện thắng "'+win+'" nhưng thiếu '+(win==='kill'?'👾 Quái':'🏁 Đích')));
    if(st){
      const P=mk3(d);const sx=st.x+.5,sz=st.z+.5,sy=Math.max(st.y,P.ground(sx,sz,st.y+.6,.55));
      const free=P.okAt(sx,sz,sy,.55);
      out.push(free?R('F2','pass','Điểm xuất phát có chỗ đứng, không vướng khối'):R('F2','broken','Điểm xuất phát bị kẹt trong khối','đổi vị trí 🚩'));
      if(free){
        const w=reach3(P,sx,sz,sy,.55),j=reach3(P,sx,sz,sy,1.2);
        const test=(e)=>near3(w,e,1.5)?'walk':near3(j,e,1.5)?'jump':'no';
        const rep=(id,name,arr)=>{if(!arr.length)return;const r=arr.map(test);const no=r.filter(x=>x==='no').length,jp=r.filter(x=>x==='jump').length;
          out.push(no?R(id,'broken',no+'/'+arr.length+' '+name+' không tới được từ điểm xuất phát','bị tường/vực chặn, cao quá tầm nhảy (~1.2 khối) — đã tính đi bộ và nhảy'):jp?R(id,'pass',name+' tới được nhưng phải nhảy ('+jp+'/'+arr.length+')','đi bộ không tới; nhảy 1 bước ≤1.2 khối'):R(id,'pass',name+' đều tới được bằng đi bộ'));};
        rep('F4','Đích',goals);rep('F5','Quái',en);rep('F6','NPC/rương',E.filter(e=>e.t==='npc'||e.t==='chest'));
      }else out.push(R('F4','not_assessed','Chưa kiểm đường tới đích','cần điểm xuất phát hợp lệ'));
    }else out.push(R('F4','not_assessed','Chưa kiểm đường tới đích','chưa có điểm xuất phát'));
    const bad=E.filter(e=>e.x<0||e.z<0||e.x>=((d.grid&&d.grid[0])||48)||e.z>=((d.grid&&d.grid[2])||48)||e.y<0||e.y>=((d.grid&&d.grid[1])||24));out.push(bad.length?R('F8','broken','Có đối tượng nằm ngoài khung dựng'):R('F8','pass','Mọi đối tượng nằm trong vùng dựng'));
  }
  logicRows(out,cf,E);
  paramRows(out,cf,['hp','spd','jump','dmg','rng']);
  common(out,'3d');return out;}

function logicRows(out,cf,E){
  const r=checkLogic(cf,E);if(!r.hasRules){out.push(R('L1','not_assessed','Chưa có luật hay hội thoại nhánh','không có dữ liệu để kiểm; tab ⚙ Logic để thêm'));return;}
  out.push(r.badAct.length?R('L1','broken','Có hành động chưa có handler: '+r.badAct.join('; '),'lỗi tích hợp: dữ liệu có mà game không chạy'):R('L1','pass','Mọi hành động trong luật/hội thoại đều có handler'));
  out.push(r.bad.length?R('L2','broken',r.bad.length+' tham chiếu hỏng',r.bad.slice(0,4).join(' · ')):R('L2','pass','Mọi tham chiếu (đối tượng, đoạn thoại) còn tồn tại'));
  out.push(r.hid.length?R('L3','broken',r.hid.length+' đối tượng ẩn lúc đầu nhưng không luật nào hiện nó','sẽ không bao giờ xuất hiện: '+r.hid.map(e=>e.name||e.t).join(', ')):R('L3','pass','Mọi đối tượng ẩn đều có luật làm hiện'));
  out.push(r.unread.length?R('L4','broken','Biến chỉ đọc, không bao giờ được gán: '+r.unread.join(', '),'điều kiện này mãi đúng/sai theo giá trị 0'):R('L4','pass','Mọi biến dùng trong điều kiện đều được khai báo hoặc gán'));
  out.push(r.dl.length?R('L5','missing','Đoạn thoại không tới được',r.dl.join(' · ')):R('L5','pass','Mọi đoạn hội thoại đều tới được từ đoạn mở đầu'));
}
function paramRows(out,cf,keys){const bad=keys.filter(k=>cf[k]!=null&&!(Number.isFinite(+cf[k])&&+cf[k]>0));
  out.push(bad.length?R('S1','broken','Thông số không hợp lệ: '+bad.join(', '),'phải là số > 0 (NaN/0 làm game hỏng)'):R('S1','pass','Thông số máu/tốc độ/sát thương hợp lệ'));}
function common(out,kind){
  // Những thứ máy không xét được: ghi thẳng not_assessed (luật: không có bằng chứng thì không báo đạt)
  out.push(R('H1','not_assessed','Âm thanh / cảm giác "đã tay"','không máy nào chứng minh được; cần người chơi thật'));
  out.push(R('H2','not_assessed','Chơi thử với người thật','chưa có người chơi thật thử'));
  out.push(R('H3','not_assessed','Hình ảnh khớp ý đồ (bóng hình, đọc cảnh)','cần mắt người xem ảnh chụp, đối chiếu GDD'));
  out.push(R('H4','not_assessed','Chạy trên iPhone/Android thật','chưa thử trên thiết bị thật'));
}

// ---------- Phiếu cổng 1 (cong-kiem.md): 7 ô, chưa biết thì ghi "chưa biết" + người quyết + hạn ----------
export const GATE1=[
  ['goal','1. Mục tiêu','Thử skill / học / bán / quảng cáo / phi lợi nhuận; thời gian; ngân sách'],
  ['money','2. Mô hình tiền','Miễn phí / quảng cáo / bán / mua trong game (cấm ép trả tiền mới chơi tiếp)'],
  ['age','3. Độ tuổi nhắm tới + nhãn dự kiến','Ví dụ 13–18; nhãn dự kiến'],
  ['data','4. Dữ liệu','Tài khoản, tên, trò chuyện, bảng xếp hạng, mã quảng cáo: có hay không'],
  ['lic','5. Giấy phép tài nguyên','Từng gói: nguồn, giấy phép, điều kiện (CC0, CC-BY ...)'],
  ['chan','6. Kênh phát hành','itch.io / Google Play / App Store / Steam / "không phát hành"'],
  ['scope','7. Quy mô','Bắt buộc / nên có / để sau; số buổi dự kiến']];
export const gateFilled=()=>{const g=lsGet('thk_gate1',{});return GATE1.filter(r=>g[r[0]]&&g[r[0]].trim()).length;};
export const gateOff=()=>{const g=lsGet('thk_gate1',{});return /không phát hành/i.test(g.chan||'');};

const ICON={pass:'✅',missing:'❌',broken:'🔴',not_assessed:'⚪'};
const LBL={pass:'đạt',missing:'thiếu',broken:'hỏng',not_assessed:'chưa kiểm'};
export function openCheck(o){
  const ov=el('div',{style:'position:fixed;inset:0;z-index:60;background:#0d141bf5;overflow:auto;padding:12px;color:#e8eef4;font:14px system-ui'});
  const close=el('button',{style:'float:right;padding:8px 14px;border-radius:14px;border:0;background:#263342;color:#fff;font-size:14px',onclick:()=>ov.remove()},'✕ Đóng');
  const body=el('div');ov.append(close,el('h2',{style:'margin:4px 0 8px;font-size:18px'},'✅ Kiểm tra game & phiếu cổng'),body);
  let kind=o.kind;
  function render(){body.textContent='';
    const sel=el('select',{style:'padding:9px;border-radius:8px;background:#16202b;color:#fff;border:1px solid #34485a;font-size:16px;margin-bottom:8px',onchange:e=>{kind=e.target.value;render();}},el('option',{value:'2d'},'Game 2D (bản đồ đang sửa)'),el('option',{value:'3d'},'Game 3D (công trình đang dựng)'));sel.value=kind;
    const d=o.getData(kind),rows=kind==='3d'?check3D(d):check2D(d);
    const c={pass:0,missing:0,broken:0,not_assessed:0};rows.forEach(r=>c[r.st]++);
    const auto=rows.filter(r=>!r.id.startsWith('H'));const apass=auto.filter(r=>r.st==='pass').length;
    const head=el('div',{style:'padding:10px;border-radius:10px;background:#16202b;margin:6px 0'},
      el('div',{style:'font-weight:700;font-size:16px'},'Máy tự kiểm: '+apass+'/'+auto.length+' đạt'+(auto.some(r=>r.st==='broken'||r.st==='missing')?' — còn lỗi':'')),
      el('div',{style:'opacity:.8;margin-top:4px'},'✅ '+c.pass+' · ❌ '+c.missing+' · 🔴 '+c.broken+' · ⚪ '+c.not_assessed+' chưa kiểm. Mục ⚪ là kết quả đúng, không phải thất bại: máy không xét được.'));
    body.append(guideBox('check',appGuides.check),sel,head);
    for(const r of rows)body.append(el('div',{style:'padding:8px 10px;margin:4px 0;border-radius:8px;background:'+(r.st==='broken'||r.st==='missing'?'#3a1d22':'#16202b')},
      el('div',{},ICON[r.st]+' ['+r.id+'] '+r.txt+'  — '+LBL[r.st]),r.why?el('div',{style:'opacity:.7;font-size:13px;margin-top:2px'},r.why):''));
    body.append(el('div',{style:'opacity:.7;font-size:12px;margin:8px 0'},'Kiểm bằng logic trên dữ liệu (BFS đường đi, vùng chặn, thông số), chưa phải chơi thật. Luật: không có bằng chứng thì không báo đạt.'));
    // phiếu cổng 1
    const g=lsGet('thk_gate1',{});
    body.append(el('h3',{style:'margin:16px 0 4px;font-size:16px'},'📋 Phiếu cổng 1 — '+gateFilled()+'/7 ô'),el('div',{style:'opacity:.75;font-size:13px;margin-bottom:6px'},'Điền đủ 7 ô trước khi làm game nghiêm túc. Ô chưa biết thì ghi "chưa biết — ai quyết — hạn". Chọn không phát hành thì chỉ cần cổng này.'));
    for(const [k,l,ph] of GATE1){const i=el('textarea',{rows:2,placeholder:ph,style:'width:100%;padding:9px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px;box-sizing:border-box;margin:2px 0 8px'});i.value=g[k]||'';
      i.oninput=()=>{const x=lsGet('thk_gate1',{});x[k]=i.value;lsSet('thk_gate1',x);};body.append(el('div',{class:'lbl',style:'font-weight:600'},l),i);}
    body.append(el('button',{style:'padding:10px 16px;border-radius:12px;border:0;background:#e0b050;color:#2a1a08;font-size:15px;font-weight:700',onclick:()=>render()},'Cập nhật kết quả'),
      el('button',{style:'padding:10px 16px;border-radius:12px;border:0;background:#2e8b57;color:#fff;font-size:15px;font-weight:700;margin-left:8px',onclick:()=>{const t=card(rows,kind);navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast('Đã chép thẻ bàn giao'),()=>toast('Không chép được'));}},'📋 Chép thẻ bàn giao'));
  }
  function card(rows,kind){const a=rows.filter(r=>!r.id.startsWith('H'));const np=rows.filter(r=>r.st!=='pass');
    return 'Kiểm nhỏ ('+kind.toUpperCase()+'): pass '+rows.filter(r=>r.st==='pass').length+' · fail '+rows.filter(r=>r.st==='broken'||r.st==='missing').length+' · chưa kiểm '+rows.filter(r=>r.st==='not_assessed').length+'\nBảng kiểm: '+a.filter(r=>r.st==='pass').length+'/'+a.length+'\n'+np.map(r=>'- '+r.id+' '+r.txt+': '+LBL[r.st]+(r.why?' ('+r.why+')':'')).join('\n')+'\nPhiếu cổng 1: '+gateFilled()+'/7\nChưa có người chơi thật thử.';}
  render();document.body.append(ov);
}
