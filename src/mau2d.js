/* ===== MẪU 2D v2: kho mẫu lớn, nhẹ (meta + ảnh lưu riêng từng khoá), đánh số cố định, phân tích góc camera, dọn mảnh, gộp nhóm ===== */
const K_META='thk_mau2d_m',K_OLD='thk_mau2d',KI=n=>'thk_mau2d_i_'+n,KC=n=>'thk_mau2d_c_'+n;
const ASC=n=>String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/[-_.]+/g,' ').replace(/ ?\(?\d+\)?$/,'').trim();
const ROLES=['Nhà','Cây','Vật','Hạ tầng','Phủ nền'];
const VIEWS=[['iso','🔷 Chéo 2.5D'],['ngang','◀▶ Ngang'],['top','⬇ Đỉnh đầu'],['?','❓ Chưa rõ']];
const VN={iso:'Chéo 2.5D',ngang:'Ngang','top':'Đỉnh đầu','?':'Chưa rõ'};
/* nhóm theo từ đầu của tên; từ lạ → nhóm riêng (bạn gộp/đổi tên được) */
const GMAP={};[['Nhà','nha choi quan tiem khach dien mieu dinh lau leu chuong kho am chua tram lang'],['Tháp & gác','thap gac vong'],['Cổng & tường','cong tuong cua hanh lan'],['Đèn','den'],['Tàu thuyền','thuyen tau xuong'],['Cầu & bến & bậc','cau bac loi ben dau van'],['Cây cối','cay bui thong trung tre truc lieu dao mai hoa co sen lua ngo rang duong'],['Đá & địa hình','da mom vach thac suoi khuc hang nui nuoc ho'],['Nền & phủ nền','nen dat mat la hoa tiet tham'],['Đồ vật','ban ghe chum thung gio kien bao khay toi tu coc binh giuong bep xe']].forEach(([g,w])=>w.split(' ').forEach(t=>GMAP[t]=g));
const grpOf=m=>{const a=ASC(m.name),t=a.split(' ')[0]||'khac';if(t==='den'&&(m.bw||m.w)>260)return'Nhà';return GMAP[t]||(t.charAt(0).toUpperCase()+t.slice(1));};
const OVR={'ho bang':'Phủ nền','san da tuyet':'Phủ nền','thap tuong':'Nhà','thap tuong thanh':'Nhà','hoang cung':'Nhà','vong lau goc':'Nhà','tuong thanh':'Hạ tầng','cong thoat nuoc':'Hạ tầng','quan tra':'Nhà','sap cho':'Nhà','bac ben thuyen':'Hạ tầng','chieu nghi':'Hạ tầng','mat di':'Hạ tầng','ve thang':'Hạ tầng'};
function roleOf(m){const a=ASC(m.name);if(OVR[a])return OVR[a];
  const R=[['Phủ nền',/(^| )(la sen|cum sen|o sen|mat nuoc|nen lat|dat nen|dat co|hoa tiet|bac them|ruong|luong rau|bai co|rong rieu|bong nuoc|co kho|tuyet)/],
    ['Vật',/(gio trai|trai cay|ban tra|ghe |chum|thung|khay|toi thuoc|tu ngan|coc |den long|den da|den ngoc|cot den|co rong|co hac|rem |gia binh|de ren|lu huong|thuyen|mai cheo|dau ben|cuon day|kien hang|(^| )(bao|xe|bia|dong ho|bep|cui|than cui|binh|ban|giuong|gio)( |$))/],
    ['Hạ tầng',/(stairs|bridge|road|path|ramp|slope|(^| )(cau|bac|loi van|ben go|dau ben|van len|ke bo|lan can|tuong|hanh lang|duong|ben thuyen|san ben|moi nuoc)( |$))/],
    ['Cây',/(tree|bush|plant|flower|palm|pine|cactus|(^| )(cay|thong|co thu|da co thu|trung|bui|cum|duong xi|oc dao|truc|tre|lieu|dao|mai|hoa|sen|lua|ngo|rang)( |$))/],
    ['Nhà',/(house|building|tower|hut|barn|shop|castle|temple|tent|(^| )(nha|dien|dinh|mieu|quan|thap|cong|phu de|tram|leu|chuong|kho|choi|hai dang|tiem|khach|te dan|chinh|gac|son mon|guong nuoc|tinh the|hang|thien|am|chua|tu vien|dai|lau|hien|sap|xuong)( |$))/]];
  if(/(^| )den( |$)/.test(a)&&(m.bw||m.w)<=200)return'Vật';
  for(const [r,re] of R)if(re.test(a))return r;
  return (m.bw||m.w)>=260||m.h>=300?'Nhà':((m.bw||m.w)<=120&&m.h>=150?'Cây':'Vật');}
const COVRE=/(^| )(mai che|lop phu|cover|overlay|mai phu|phu mai|phan mai|manh|piece|part|crop|cat)( |$)|mai che$/;
const VH={iso:/(^| )(iso|isometric|cheo|2 5d|25d)( |$)/,ngang:/(^| )(ngang|side|front|chinh dien|mat ben|ben hong|truc dien)( |$)/,top:/(^| )(top|topdown|nhin tren|dinh dau|tren xuong|mat bang|plan)( |$)/};

export function initMau(C){
  const {el,btn,toast,yes,askText,pickFiles,pickFile,zipBrowser,saveFile,idbGet,idbSet,idbDel}=C;
  let D=null,tok=0,busy=false,CL=null,prog='';
  const save=async()=>{try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}const ok=await idbSet(K_META,D);if(!ok)toast('⚠ Không lưu được kho mẫu (hết chỗ trình duyệt?)');return ok;};
  const imgOf=url=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Không đọc được ảnh'));i.src=url;});
  const yieldUI=()=>new Promise(r=>setTimeout(r,0));
  async function load(){if(D)return D;let m=await idbGet(K_META);
    if(!m||!m.items){m={next:1,items:[]};let old=null;try{old=await idbGet(K_OLD);}catch(e){}
      if(old&&old.items&&old.items.length){toast('Đang chuyển kho '+old.items.length+' mẫu sang kiểu nhẹ…');let k=0;for(const it of old.items){const u=it.url;delete it.url;it.cls=null;await idbSet(KI(it.no),u);m.items.push(it);if(++k%50===0){await yieldUI();}}
        m.next=Math.max(old.next||1,...m.items.map(x=>x.no+1));await idbSet(K_META,m);await idbSet(K_OLD,null);toast('Đã chuyển xong kho mẫu');}}
    D=m;return D;}
  function foot(d,W,H,s){let x0=W,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;y1=y;}
    if(x1<0)return null;const bot=y1+1,px=(x0+x1+1)/2,bw=x1-x0+1;let n=1;
    for(const k of [4,3,2]){const y=Math.round(bot-48*k*s),r=Math.max(1,Math.round(5*s));let a=W,b=-1;for(let yy=Math.max(0,y-r);yy<Math.min(H,y+r);yy++)for(let x=0;x<W;x++)if(d[(yy*W+x)*4+3]>24){if(x<a)a=x;if(x>b)b=x;}if(b>=0&&(b-a+1)/s>=.78*192*k){n=k;break;}}
    return{px:px/s,bot:bot/s,bw:bw/s,n};}
  /* phân tích 1 ảnh: chân, góc camera, mặt nạ 48×48 để ghép mảnh */
  async function analyze(m){const url=await idbGet(KI(m.no));if(!url)return null;const img=await imgOf(url);m.w=img.width;m.h=img.height;
    const s=Math.min(1,200/Math.max(img.width,img.height)),W=Math.max(1,Math.round(img.width*s)),H=Math.max(1,Math.round(img.height*s)),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,W,H);const d=g.getImageData(0,0,W,H).data;
    const f=foot(d,W,H,s)||{px:m.w/2,bot:m.h,bw:m.w,n:1};
    let cnt=0,x0=W,x1=-1,y0=H,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){cnt++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
    const bbw=Math.max(1,x1-x0+1),bbh=Math.max(1,y1-y0+1),fill=cnt/(bbw*bbh);
    const band=(ya,yb)=>{let a=W,b=-1;for(let y=Math.max(0,ya);y<Math.min(H,yb);y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){if(x<a)a=x;if(x>b)b=x;}return b<0?0:(b-a+1)/bbw;};
    const hb=Math.max(2,Math.round(bbh*.06)),wBot=band(y1+1-hb,y1+1),wMid=band(y1+1-Math.round(bbh*.2)-hb,y1+1-Math.round(bbh*.2));
    let view='?';const a=ASC(m.name);
    if(VH.iso.test(a))view='iso';else if(VH.ngang.test(a))view='ngang';else if(VH.top.test(a))view='top';
    else if(wBot<.5&&wMid>wBot*1.4)view='iso';else if(wBot>=.75&&fill<.92)view='ngang';else if(fill>.93&&wBot>.9)view='?';
    const mask=new Uint8Array(48*48);for(let j=0;j<48;j++)for(let i=0;i<48;i++){const sx=Math.min(W-1,Math.floor((i+.5)*W/48)),sy=Math.min(H-1,Math.floor((j+.5)*H/48));mask[j*48+i]=d[(sy*W+sx)*4+3]>24?1:0;}
    let h=0;for(let i=0;i<url.length;i+=997)h=(h*31+url.charCodeAt(i))|0;
    return{f,view,mask,area:mask.reduce((p,q)=>p+q,0),key:url.length+':'+h};}
  function apply(m,r){m.px=r.f.px;m.bot=r.f.bot;m.bw=r.f.bw;if(m.vm!==1)m.view=r.view;m.cls=m.cls==='manual'?'manual':'auto';
    if(m.cls!=='manual'){m.role=roleOf(m);const n=Math.max(r.f.n,Math.round(m.bw/192));m.fx=m.fy=(m.role==='Nhà'||m.role==='Hạ tầng')?Math.min(6,Math.max(1,n)):1;}
    if(!m.gm)m.grp=grpOf(m);}
  /* thêm ảnh: lưu nguyên bản gốc */
  async function add(items){await load();let n=0,first=D.next;busy=true;for(const it of items){try{const m={no:D.next++,name:(it.name||'Mẫu').replace(/\.[^.]+$/,'').slice(0,40),w:0,h:0,role:'Nhà',fx:1,fy:1,px:0,bot:0,cls:null,view:'?'};
      await idbSet(KI(m.no),it.url);const r=await analyze(m);if(!r)throw new Error('ảnh rỗng');apply(m,r);m._k=r.key;D.items.push(m);n++;if(n%25===0){await yieldUI();}}catch(e){toast('Bỏ qua '+(it.name||'ảnh')+': '+e.message);}}
    busy=false;if(n){await save();toast('Đã thêm '+n+' mẫu (số '+first+(n>1?'–'+(D.next-1):'')+'). Ảnh giữ nguyên bản gốc.');}C.redraw();}
  /* phân tích toàn kho + tìm mảnh/trùng để dọn */
  async function scanAll(){await load();if(busy)return;busy=true;CL=null;const items=D.items,masks=new Map(),keys=new Map();let k=0;
    for(const m of items){try{const r=await analyze(m);if(r){apply(m,r);m._k=r.key;masks.set(m.no,{mask:r.mask,area:r.area});}}catch(e){}
      if(++k%20===0){prog='Đang phân tích '+k+'/'+items.length+'…';C.progress(prog);await yieldUI();}}
    await save();prog='Đang tìm mảnh lớp phủ và ảnh trùng…';C.progress(prog);await yieldUI();
    const cl={pair:[],orphan:[],dup:[],tiny:[]};const byDim=new Map();for(const m of items){const kd=m.w+'x'+m.h;(byDim.get(kd)||byDim.set(kd,[]).get(kd)).push(m);}
    const gone=new Set();
    for(const m of items){const kk=m._k+'|'+m.w+'x'+m.h;if(keys.has(kk)){cl.dup.push(m.no);gone.add(m.no);}else keys.set(kk,m.no);}
    for(const m of items){if(gone.has(m.no))continue;if(m.w<20||m.h<20){cl.tiny.push(m.no);gone.add(m.no);}}
    const isCov=m=>COVRE.test(ASC(m.name));
    for(const m of items){if(gone.has(m.no))continue;const A=masks.get(m.no);if(!A||A.area<8)continue;let best=null;
      const grp=(byDim.get(m.w+'x'+m.h)||[]).filter(b=>b!==m&&!gone.has(b.no)).slice(0,80);
      for(const b of grp){const B=masks.get(b.no);if(!B||B.area<=A.area*1.15)continue;let inter=0;for(let i=0;i<2304;i++)if(A.mask[i]&&B.mask[i])inter++;if(inter/A.area>=.96&&(!best||B.area<best.area))best={b,area:B.area};}
      const byName=isCov(m);
      if(best&&(byName||A.area<=.8*best.area))cl.pair.push([m.no,best.b.no]);else if(byName)cl.orphan.push(m.no);}
    CL=cl;busy=false;prog='';C.progress('');C.redraw();}
  async function del(nos){const S=new Set(nos);D.items=D.items.filter(m=>!S.has(m.no));await save();for(const n of nos){await idbDel(KI(n));await idbDel(KC(n));}}
  async function attach(pairs){let n=0;for(const [p,b] of pairs){const base=D.items.find(m=>m.no===b);if(!base||!D.items.find(m=>m.no===p))continue;const u=await idbGet(KI(p));if(!u)continue;await idbSet(KC(b),u);base.cover=true;n++;}await del(pairs.map(x=>x[0]));return n;}
  /* đặt lên bản đồ: tạo tileset (và lớp phủ nếu có) rồi trả về vật thể */
  async function make(m){const sh=C.sheets(),pad=String(m.no).padStart(3,'0');const T=Math.ceil(Math.max(2*Math.max(m.px,m.w-m.px),m.bot)/32)*32;
    const mk=async(name,url)=>{let sid=sh.findIndex((q,i)=>i>=4&&q.name===name);if(sid<0){const img=await imgOf(url),c=document.createElement('canvas');c.width=T;c.height=T;c.getContext('2d').drawImage(img,Math.round(T/2-m.px),T-m.bot);const s={name,url:c.toDataURL('image/png'),tw:T,margin:0};await C.loadSheet(s);sh.push(s);sid=sh.length-1;}return sid;};
    const sid=await mk('Mau-'+pad,await idbGet(KI(m.no)));const TG=C.TG(),TY={'Nhà':'Nhà','Cây':'Cây','Vật':'Đồ vật','Hạ tầng':'Khác','Phủ nền':'Trang trí'};
    TG.tiles['Mau-'+pad+'#0']={type:TY[m.role]||'Khác',layer:2,fn:'Chặn đường'};let cv=null;
    if(m.cover){const cu=await idbGet(KC(m.no));if(cu){const cs=await mk('Mau-'+pad+'-c',cu);TG.tiles['Mau-'+pad+'-c#0']={type:'Nhà',layer:3,fn:'Chỉ trang trí'};cv={sid:cs,idx:0};}}
    C.tgSave();return{role:m.role,name:'#'+m.no+' '+m.name,cv,tile:{sid,idx:0},f:1,fx:m.fx,fy:m.fy,sc:T/128,ox:0,oy:0,zb:[-m.fx,-m.fy,m.fx,m.fy],_mau:m.no};}
  async function backup(){await load();toast('Đang chuẩn bị file sao lưu '+D.items.length+' mẫu…');const parts=['{"next":'+D.next+',"items":['];let k=0;
    for(const m of D.items){const o=Object.assign({},m);delete o._k;o.url=await idbGet(KI(m.no));o.cov=m.cover?await idbGet(KC(m.no)):null;parts.push((k++?',':'')+JSON.stringify(o));if(k%40===0)await yieldUI();}
    parts.push(']}');saveFile('mau_2d.json',new Blob(parts,{type:'application/json'}));}
  async function restore(t){try{const o=JSON.parse(t);if(!o||!Array.isArray(o.items))throw 0;await load();const have=new Set(D.items.map(m=>m.no));let n=0;for(const m of o.items){if(have.has(m.no))continue;const u=m.url,cv=m.cov;delete m.url;delete m.cov;if(u)await idbSet(KI(m.no),u);if(cv)await idbSet(KC(m.no),cv);D.items.push(m);n++;}
      D.next=Math.max(D.next,o.next||0,...D.items.map(m=>m.no+1));D.items.sort((a,b)=>a.no-b.no);await save();toast('Đã nạp lại '+n+' mẫu');C.redraw();}catch(e){toast('File sao lưu không hợp lệ');}}
  const PAGE=48;
  async function tab(){const my=++tok;await load();if(my!==tok||!C.isTab())return;const body=C.body();
    const W=window;W.__mv=W.__mv||'Tất cả';W.__mg=W.__mg||'';W.__mp=W.__mp||0;
    body.append(el('div',{class:'lbl'},'🏠 MẪU 2D — kho mẫu của bạn'),el('div',{class:'hint'},'Ảnh nạp vào giữ nguyên 100%. Số thứ tự cố định, số đã xoá không dùng lại. Xoá tài nguyên/tileset không làm mất mẫu. Phân loại: Góc camera → Nhóm → Mẫu.'));
    body.append(el('div',{class:'row'},btn('➕ Thêm mẫu từ ảnh…',()=>pickFiles('image/*',it=>add(it),false),'on'),btn('📦 Từ gói .zip…',()=>zipBrowser((u,n)=>add([{url:u,name:n}]),l=>add(l))),btn('🔍 Phân tích & dọn kho',()=>scanAll())));
    body.append(el('div',{class:'row'},btn('🗑 Xoá mẫu theo số…',async()=>{const t=await askText('Nhập số mẫu cần xoá (vd: 3 hoặc 3,5,8):','');if(!t)return;const set=new Set(t.split(/[^0-9]+/).filter(Boolean).map(Number)),hit=D.items.filter(m=>set.has(m.no));if(!hit.length){toast('Không có mẫu số '+[...set].join(', '));return;}
      if(!await yes('Xoá vĩnh viễn '+hit.length+' mẫu: '+hit.slice(0,12).map(m=>'#'+m.no+' '+m.name).join(', ')+(hit.length>12?'…':'')+'?\nKhông hoàn tác được.'))return;await del(hit.map(m=>m.no));toast('Đã xoá '+hit.length+' mẫu');C.redraw();}),btn('💾 Sao lưu (.json)',()=>backup()),btn('⬆ Nạp lại sao lưu',()=>pickFile('.json,application/json',t=>restore(t)))));
    if(prog)body.append(el('div',{class:'hint',style:'color:#ffd24a'},prog));
    if(CL){const box=el('div',{style:'border:1px solid #d9a066;border-radius:10px;padding:8px;margin:6px 0;background:#26201a'});box.append(el('div',{class:'lbl',style:'color:#e8c08a'},'🧹 KẾT QUẢ PHÂN TÍCH — chọn loại muốn dọn (xoá có hỏi lại)'));
      const nm=no=>{const m=D.items.find(x=>x.no===no);return m?'#'+no+' '+m.name:'#'+no;};
      const sec=(t,list,label,fn)=>{const live=list.filter(x=>Array.isArray(x)?D.items.some(m=>m.no===x[0]):D.items.some(m=>m.no===x));if(!live.length)return;const s=el('div',{style:'margin:6px 0'},el('div',{},t+': '+live.length),el('div',{class:'hint'},live.slice(0,6).map(x=>nm(Array.isArray(x)?x[0]:x)).join(' · ')+(live.length>6?' …':'')),btn(label,async()=>{if(!await yes(label+' ('+live.length+' mẫu)?\nKhông hoàn tác được.'))return;await fn(live);CL.pair=CL.pair.filter(x=>D.items.some(m=>m.no===x[0]));['orphan','dup','tiny'].forEach(k=>CL[k]=CL[k].filter(x=>D.items.some(m=>m.no===x)));C.redraw();}));box.append(s);};
      sec('Mảnh lớp phủ đã có mẫu gốc đầy đủ',CL.pair,'🧩 Ghép vào mẫu gốc (thành 1 mẫu hoàn chỉnh) và bỏ mảnh',async l=>{const n=await attach(l);toast('Đã ghép '+n+' lớp phủ vào mẫu gốc');});
      sec('Mảnh/lớp phủ không tìm thấy mẫu gốc',CL.orphan,'🗑 Xoá các mảnh lẻ',async l=>{await del(l);toast('Đã xoá '+l.length);});
      sec('Ảnh trùng hệt nhau',CL.dup,'🗑 Xoá ảnh trùng (giữ số nhỏ nhất)',async l=>{await del(l);toast('Đã xoá '+l.length);});
      sec('Ảnh quá nhỏ (vụn)',CL.tiny,'🗑 Xoá ảnh vụn',async l=>{await del(l);toast('Đã xoá '+l.length);});
      if(!CL.pair.length&&!CL.orphan.length&&!CL.dup.length&&!CL.tiny.length)box.append(el('div',{class:'hint'},'Kho sạch: không còn mảnh/ảnh trùng cần dọn.'));
      box.append(btn('Đóng',()=>{CL=null;C.redraw();}));body.append(box);}
    if(!D.items.length){body.append(el('div',{class:'hint'},'Chưa có mẫu nào. Bấm "Thêm mẫu từ ảnh…" và chọn nhiều ảnh một lúc.'));return;}
    const vc=v=>v==='Tất cả'?D.items.length:D.items.filter(m=>(m.view||'?')===v).length;
    body.append(el('div',{class:'lbl',style:'margin-top:6px'},'① GÓC CAMERA'),el('div',{class:'row'},[['Tất cả','Tất cả'],...VIEWS].map(([k,n])=>btn(n+' ('+vc(k)+')',()=>{W.__mv=k;W.__mg='';W.__mp=0;C.redraw();},W.__mv===k?'on':''))));
    const inV=D.items.filter(m=>W.__mv==='Tất cả'||(m.view||'?')===W.__mv),gc=new Map();inV.forEach(m=>{const g=m.grp||'Khác';gc.set(g,(gc.get(g)||0)+1);});
    const gl=[...gc.entries()].sort((a,b)=>b[1]-a[1]);
    body.append(el('div',{class:'lbl'},'② NHÓM'),el('div',{class:'row'},btn('Tất cả nhóm ('+inV.length+')',()=>{W.__mg='';W.__mp=0;C.redraw();},W.__mg===''?'on':''),...gl.slice(0,60).map(([g,n])=>btn(g+' ('+n+')',()=>{W.__mg=g;W.__mp=0;C.redraw();},W.__mg===g?'on':''))));
    if(gl.length>60)body.append(el('div',{class:'hint'},'Còn '+(gl.length-60)+' nhóm nhỏ khác — dùng ô tìm để lọc.'));
    const q0=(W.__mq||'').toLowerCase();const shown=inV.filter(m=>(!W.__mg||m.grp===W.__mg)&&(!q0||m.name.toLowerCase().includes(q0)||String(m.no)===q0));
    body.append(el('div',{class:'row'},el('input',{class:'num',placeholder:'🔎 Tìm theo tên hoặc số…',value:W.__mq||'',style:'flex:1;min-width:120px',onchange:e=>{W.__mq=e.target.value;W.__mp=0;C.redraw();}})));
    body.append(el('div',{class:'row'},btn('✏ Đổi tên / gộp nhóm này',async()=>{if(!W.__mg){toast('Chọn một nhóm ở bước ② trước');return;}const t=await askText('Đổi tên nhóm "'+W.__mg+'" thành (trùng tên nhóm khác = gộp):',W.__mg);if(!t||t===W.__mg)return;const g0=W.__mg;D.items.forEach(m=>{if(m.grp===g0){m.grp=t.slice(0,30);m.gm=1;}});W.__mg=t.slice(0,30);await save();C.redraw();}),
      (()=>{const s=el('select',{class:'num',onchange:async e=>{const v=e.target.value;if(!v)return;if(!await yes('Chuyển '+shown.length+' mẫu đang hiện sang góc "'+VN[v]+'"?')){e.target.value='';return;}shown.forEach(m=>{m.view=v;m.vm=1;});await save();C.redraw();}},el('option',{value:''},'↪ Chuyển cả '+shown.length+' mẫu sang góc…'),...VIEWS.map(([k,n])=>el('option',{value:k},n)));return s;})(),
      btn('🗑 Xoá '+shown.length+' mẫu đang hiện',async()=>{if(!shown.length)return;if(!await yes('Xoá vĩnh viễn '+shown.length+' mẫu đang hiện (số '+shown[0].no+(shown.length>1?' … '+shown[shown.length-1].no:'')+')?\nKhông hoàn tác được.'))return;await del(shown.map(m=>m.no));W.__mp=0;toast('Đã xoá '+shown.length+' mẫu');C.redraw();})));
    const pages=Math.max(1,Math.ceil(shown.length/PAGE));if(W.__mp>=pages)W.__mp=pages-1;const pg=shown.slice(W.__mp*PAGE,W.__mp*PAGE+PAGE);
    const nav=()=>el('div',{class:'row'},btn('◀',()=>{if(W.__mp>0){W.__mp--;C.redraw();}}),el('span',{class:'lbl'},'Trang '+(W.__mp+1)+'/'+pages+' · '+shown.length+' mẫu'),btn('▶',()=>{if(W.__mp<pages-1){W.__mp++;C.redraw();}}));
    body.append(nav());
    const allG=[...new Set(D.items.map(m=>m.grp||'Khác'))].sort(),grid=el('div',{class:'libgrid'});
    pg.forEach(m=>{const im=el('img',{style:'max-width:100%;max-height:110px;object-fit:contain;background:#2a3340;border-radius:6px;min-height:40px'});idbGet(KI(m.no)).then(u=>{if(u)im.src=u;});
      const sel=(opts,cur,fn)=>el('select',{class:'num',style:'max-width:100%',onchange:e=>fn(e.target.value)},opts.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];const op=el('option',{value:v},t);if(v===cur)op.selected=true;return op;}));
      const manual=async()=>{m.cls='manual';await save();};
      grid.append(el('div',{class:'libitem'},el('div',{style:'font-weight:800;color:#ffd24a'},'#'+m.no+(m.cover?' 🧩':'')),im,el('div',{},m.name+' ('+m.w+'×'+m.h+')'),
        el('div',{class:'row'},sel(VIEWS,m.view||'?',async v=>{m.view=v;m.vm=1;await save();C.redraw();}),sel(allG,m.grp||'Khác',async v=>{m.grp=v;m.gm=1;await save();C.redraw();})),
        el('div',{class:'row'},sel(ROLES,m.role,async v=>{m.role=v;await manual();C.redraw();}),el('span',{class:'lbl'},'chân'),sel([1,2,3,4,5,6,8].map(String),String(m.fx),async v=>{m.fx=+v;await manual();}),'×',sel([1,2,3,4,5,6,8].map(String),String(m.fy),async v=>{m.fy=+v;await manual();})),
        el('div',{class:'row'},btn('Đặt',async()=>{try{C.select(await make(m));toast('Đã chọn mẫu #'+m.no+' — chạm bản đồ để đặt');}catch(e){toast('Lỗi: '+e.message);}},(C.curSel()&&C.curSel()._mau===m.no)?'on':''),btn('✏',async()=>{const n=await askText('Tên mẫu #'+m.no+':',m.name);if(n){m.name=n.slice(0,40);if(!m.gm)m.grp=grpOf(m);await save();C.redraw();}}))));});
    body.append(grid);if(pages>1)body.append(nav());}
  return{tab,add};
}
