import {guideBox,appGuides} from './editorHelp.js';
import {zipSync,strToU8} from 'fflate';
import {el,toast,saveFile,lsGet,lsSet,gameHTML,SELF,pickFile} from './util.js';
import {gateFilled,gateOff} from './check.js';
const slug=s=>(s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'')||'game');
const png=c=>new Promise(r=>c.toBlob(b=>b.arrayBuffer().then(a=>r(new Uint8Array(a))),'image/png'));
export function openRelease(o){
  const S=Object.assign({name:'Võ Lâm Kiếm Hiệp',studio:'Studio của tôi',short:'Trò chơi võ hiệp phiêu lưu.',long:'',ver:'1.0.0',pkg:'',color:'#1b2a3a',credit:'',kind:o.kind,site:''},lsGet('thk_rel',{}));
  let iconImg=null;
  const ov=el('div',{style:'position:fixed;inset:0;z-index:60;background:#0d141bf5;overflow:auto;padding:12px;color:#e8eef4;font:14px system-ui'});
  const inp=(k,l,ph,area)=>{const i=el(area?'textarea':'input',{value:S[k]||'',placeholder:ph||'',rows:area?3:undefined,style:'width:100%;padding:9px;border-radius:8px;border:1px solid #34485a;background:#16202b;color:#fff;font-size:16px;box-sizing:border-box;margin:2px 0 8px'});i.value=S[k]||'';i.oninput=()=>{S[k]=i.value;lsSet('thk_rel',S);};return el('div',{},el('div',{class:'lbl'},l),i);};
  const kindSel=el('select',{style:'padding:9px;border-radius:8px;background:#16202b;color:#fff;border:1px solid #34485a;font-size:16px;margin-bottom:8px',onchange:e=>{S.kind=e.target.value;lsSet('thk_rel',S);}},el('option',{value:'2d'},'Game 2D (bản đồ đang sửa)'),el('option',{value:'3d'},'Game 3D (công trình đang dựng)'));kindSel.value=S.kind;
  const btnCss='display:block;width:100%;text-align:left;padding:12px;margin:6px 0;border-radius:10px;border:1px solid #34485a;background:#1e2d3b;color:#fff;font-size:15px';
  // ---- đồ hoạ ----
  function art(w,h,sprite){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,S.color);gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='#ffffff10';for(let i=0;i<8;i++){g.beginPath();g.arc(w*(.1+i*.13),h*(.9-(i%3)*.12),h*.18,0,7);g.fill();}
    if(iconImg){const s=Math.min(w,h)*.9;g.drawImage(iconImg,(w-s)/2,(h-s)/2,s,s);return c;}
    const m=Math.min(w,h);const sh=o.sheets&&o.sheets()[2];
    if(sprite&&S.kind==='2d'&&sh&&sh.img){g.imageSmoothingEnabled=false;const s=m*.5;g.drawImage(sh.img,(88%sh.cols)*(sh.tw+sh.margin),Math.floor(88/sh.cols)*(sh.tw+sh.margin),sh.tw,sh.tw,w/2-s/2,h*.5-s*.72,s,s);}
    g.fillStyle='#f3d27a';g.textAlign='center';g.font='bold '+(m*.13)+'px serif';const words=S.name.split(' ');let line='',lines=[];for(const wd of words){if(g.measureText(line+' '+wd).width>w*.88&&line){lines.push(line);line=wd;}else line=(line?line+' ':'')+wd;}lines.push(line);
    lines.slice(0,3).forEach((t,i)=>g.fillText(t,w/2,h*.74+i*m*.14));return c;}
  const readme=(t)=>t;
  async function files(which){
    const F={},nm=S.name||'Game',sl=slug(nm),pkg=S.pkg||('com.'+slug(S.studio)+'.'+sl),data=o.getData(S.kind);
    const i1024=await png(art(1024,1024,true)),i512=await png(art(512,512,true)),i192=await png(art(192,192,true)),feat=await png(art(1024,500,true)),cover=await png(art(630,500,true));
    const html=gameHTML(data,nm);
    const credits='GHI CÔNG / CREDITS — '+nm+'\n\n'+(S.credit?'\n'+S.credit+'\n':'')+'\nPhần mềm tạo bằng "Xưởng Kiến Trúc Võ Lâm". Dùng three.js (MIT) cho game 3D.\n\nLƯU Ý: nếu bạn nạp thêm ảnh/gói tài nguyên khác, hãy ghi công đúng yêu cầu giấy phép của từng gói tại đây.\n';
    if(which==='web'||which==='all'){const d=which==='all'?'web/':'';F[d+'index.html']=strToU8(html);F[d+'cover_630x500.png']=cover;F[d+'icon_512.png']=i512;
      F[d+'HUONG_DAN.txt']=strToU8('ĐĂNG LÊN ITCH.IO / WEB\n1. Nén thư mục này (chỉ index.html) thành .zip, hoặc dùng luôn file zip này.\n2. itch.io > Upload new project > Kind of project: HTML > tải .zip > tick "This file will be played in the browser".\n3. Viewport: 390x800 (mobile) hoặc 960x600 (PC), bật Fullscreen button.\n4. Ảnh bìa: cover_630x500.png. Đặt giá hoặc "trả tuỳ ý".\n');}
    if(which==='pwa'||which==='all'){const d=which==='all'?'pwa/':'';
      const head='<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="'+S.color+'"><link rel="apple-touch-icon" href="icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes">';
      const tail='<script>if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js")</script>';
      F[d+'index.html']=strToU8(gameHTML(data,nm,{head,tail}));
      F[d+'manifest.webmanifest']=strToU8(JSON.stringify({name:nm,short_name:nm.slice(0,12),start_url:'./',display:'fullscreen',orientation:'any',background_color:S.color,theme_color:S.color,icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},null,1));
      F[d+'sw.js']=strToU8("const C='v"+S.ver+"';const L=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(L))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));");
      F[d+'icon-192.png']=i192;F[d+'icon-512.png']=i512;
      F[d+'HUONG_DAN.txt']=strToU8('CÀI NHƯ APP (PWA) — không cần cửa hàng\n1. Đưa cả thư mục này lên hosting HTTPS (GitHub Pages, Netlify, Cloudflare Pages — đều có gói miễn phí).\n2. Mở link trên điện thoại/máy tính: Chrome/Edge > "Cài đặt ứng dụng"; Safari iOS > Chia sẻ > "Thêm vào MH chính".\n3. Chạy offline sau lần mở đầu. Không mở bằng file:// vì trình duyệt chặn service worker.\n');}
    if(which==='pc'||which==='all'){const d=which==='all'?'pc-electron/':'';
      F[d+'game/index.html']=strToU8(html);F[d+'build/icon.png']=i512;
      F[d+'main.js']=strToU8("const {app,BrowserWindow}=require('electron');const path=require('path');\nfunction mk(){const w=new BrowserWindow({width:1100,height:720,autoHideMenuBar:true,backgroundColor:'"+S.color+"',webPreferences:{contextIsolation:true}});w.loadFile(path.join(__dirname,'game','index.html'));w.webContents.on('before-input-event',(e,i)=>{if(i.type==='keyDown'&&i.key==='F11')w.setFullScreen(!w.isFullScreen());});}\napp.whenReady().then(mk);app.on('window-all-closed',()=>app.quit());\n");
      F[d+'package.json']=strToU8(JSON.stringify({name:sl,version:S.ver,description:S.short,author:S.studio,main:'main.js',scripts:{start:'electron .',dist:'electron-builder'},devDependencies:{electron:'^31.0.0','electron-builder':'^25.0.0'},build:{appId:pkg,productName:nm,files:['main.js','game/**'],directories:{buildResources:'build'},win:{target:'nsis'},mac:{target:'dmg'},linux:{target:'AppImage'}}},null,1));
      F[d+'HUONG_DAN.txt']=strToU8('GAME PC (Windows/Mac/Linux) bằng Electron\nCần cài Node.js (nodejs.org).\n1. Giải nén, mở terminal trong thư mục này.\n2. npm install\n3. npm start        (chạy thử)\n4. npm run dist     (ra file cài đặt trong thư mục dist/; Windows build trên Windows, Mac build trên Mac)\n5. Bán: itch.io (kéo file cài đặt lên) hoặc Steam (cần tài khoản Steamworks, dùng Steamworks SDK để lên cửa hàng).\nKý số (code signing) là bước riêng, cần chứng chỉ của bạn.\n');}
    if(which==='mob'||which==='all'){const d=which==='all'?'mobile-capacitor/':'';
      F[d+'www/index.html']=strToU8(html);F[d+'assets/icon-only.png']=i1024;F[d+'assets/icon-foreground.png']=i1024;F[d+'assets/icon-background.png']=await png((()=>{const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.fillStyle=S.color;g.fillRect(0,0,1024,1024);return c;})());
      F[d+'capacitor.config.json']=strToU8(JSON.stringify({appId:pkg,appName:nm,webDir:'www'},null,1));
      F[d+'package.json']=strToU8(JSON.stringify({name:sl,version:S.ver,private:true,dependencies:{'@capacitor/core':'^6.0.0','@capacitor/android':'^6.0.0','@capacitor/ios':'^6.0.0'},devDependencies:{'@capacitor/cli':'^6.0.0','@capacitor/assets':'^3.0.0'}},null,1));
      F[d+'HUONG_DAN.txt']=strToU8('GAME MOBILE (Android/iOS) bằng Capacitor\nCần Node.js. Android cần Android Studio. iOS cần máy Mac + Xcode.\n1. npm install\n2. npx cap add android   (và/hoặc: npx cap add ios)\n3. npx capacitor-assets generate   (tạo icon cho từng nền tảng từ thư mục assets/)\n4. npx cap sync\n5. npx cap open android -> Android Studio: Build > Generate Signed Bundle (.aab) -> tải lên Google Play Console.\n   npx cap open ios -> Xcode: Product > Archive -> App Store Connect.\nGhi chú: Google Play thu phí tài khoản một lần; Apple thu phí hằng năm. Cả hai yêu cầu chính sách riêng tư (có sẵn trong gói store/) và ảnh chụp màn hình.\n');}
    if(which==='store'||which==='all'){const d=which==='all'?'store/':'';
      F[d+'icon_512.png']=i512;F[d+'feature_graphic_1024x500.png']=feat;F[d+'credits.txt']=strToU8(credits);
      F[d+'mo_ta_cua_hang.md']=strToU8('# '+nm+'\n\n**Tác giả:** '+S.studio+'  \n**Phiên bản:** '+S.ver+'\n\n## Mô tả ngắn (tối đa 80 ký tự)\n'+S.short.slice(0,80)+'\n\n## Mô tả đầy đủ\n'+(S.long||S.short+'\n\nĐiều khiển đơn giản trên điện thoại và máy tính. Chơi ngoại tuyến, không cần mạng.')+'\n\n## Từ khoá gợi ý\nvõ hiệp, phiêu lưu, pixel, kiếm sĩ, ngoại tuyến\n\n## English short\nA wuxia adventure game. Offline, no ads.\n\n## Ảnh chụp màn hình\nChụp 3–5 ảnh khi chơi thật trên điện thoại (cửa hàng yêu cầu ảnh thật của game).\n');
      F[d+'chinh_sach_rieng_tu.md']=strToU8('# Chính sách quyền riêng tư — '+nm+'\n\nCập nhật: '+new Date().toLocaleDateString('vi-VN')+'\n\n'+nm+' do '+S.studio+' phát hành chạy ngoại tuyến trên thiết bị của bạn.\n\n- Chúng tôi **không thu thập, lưu trữ hoặc chia sẻ** thông tin cá nhân.\n- Game **không dùng** quảng cáo, thống kê hay dịch vụ bên thứ ba.\n- Game không yêu cầu quyền truy cập camera, micro, vị trí hay danh bạ.\n- Dữ liệu chơi (nếu có) chỉ nằm trên thiết bị của bạn.\n\nLiên hệ: '+(S.site||'[điền email/website của bạn]')+'\n\n(Đây là mẫu chung, không phải tư vấn pháp lý. Nếu bạn thêm quảng cáo, mua trong app hay thu thập dữ liệu thì phải sửa lại.)\n');
      F[d+'danh_sach_viec_truoc_khi_ban.md']=strToU8('# Việc cần làm trước khi bán\n- [ ] Kiểm tra giấy phép từng gói tài nguyên đã dùng (tài nguyên do bạn tự tạo: giữ bản gốc làm bằng chứng)\n- [ ] Chơi thử trên điện thoại thật và máy tính thật\n- [ ] Chụp ảnh màn hình thật\n- [ ] Điền email liên hệ vào chính sách riêng tư\n- [ ] Tạo tài khoản: itch.io / Google Play / Apple Developer / Steamworks (tuỳ kênh)\n- [ ] Đặt giá, chọn xếp hạng độ tuổi\n');}
    return F;}
  async function dl(which,fname){try{toast('Đang tạo gói…');const F=await files(which);const z=zipSync(F,{level:6});await saveFile(fname,new Blob([z],{type:'application/zip'}));}catch(e){toast('Lỗi tạo gói: '+(e&&e.message));}}
  const b=(t,sub,w,f)=>el('button',{style:btnCss,onclick:()=>dl(w,f)},t,el('div',{style:'font-size:12px;opacity:.7;margin-top:3px'},sub));
  const prev=el('div',{});function pv(){prev.textContent='';const c=art(512,250,true);c.style.cssText='width:100%;max-width:420px;border-radius:10px;display:block;margin:6px 0';prev.append(c);}
  const iconBtn=el('button',{style:btnCss,onclick:()=>pickFile('image/*',(u)=>{const i=new Image();i.onload=()=>{iconImg=i;pv();toast('Đã dùng ảnh của bạn làm icon');};i.src=u;},false)},'🖼 Dùng ảnh của bạn làm icon','Bỏ trống: app tự vẽ icon từ tên game');
  const refresh=el('button',{style:btnCss+';text-align:center',onclick:pv},'↻ Xem trước ảnh bìa');
  const gf=gateFilled();ov.append(el('div',{style:'font:700 18px system-ui;margin-bottom:8px'},'🚀 Phát hành game'),guideBox('release',appGuides.release),(gf<7&&!gateOff())?el('div',{style:'padding:10px;border-radius:10px;background:#4a2a14;margin-bottom:8px;font-size:13px;line-height:1.5'},'⚠️ Phiếu cổng 1 mới điền '+gf+'/7 ô (bấm ✅ Kiểm tra để điền). Theo quy trình skill: chưa qua cổng 1 và cổng 2 (thị trường, pháp lý, xếp hạng tuổi, bảng giấy phép, thuế) thì chưa nên nộp cửa hàng hay bật quảng cáo. Gói tạo ra ở đây chỉ để thử.'):'',
    el('div',{class:'lbl'},'Loại game'),kindSel,inp('name','Tên game'),inp('studio','Tên tác giả / studio'),inp('short','Mô tả ngắn (≤80 ký tự)'),inp('long','Mô tả đầy đủ (tuỳ chọn)','',1),inp('ver','Phiên bản'),inp('pkg','Mã gói (vd com.studio.game) — để trống: tự tạo'),inp('color','Màu chủ đạo (vd #1b2a3a)'),inp('site','Email/website liên hệ (cho chính sách riêng tư)'),inp('credit','Ghi công thêm (gói tài nguyên khác bạn đã nạp)','',1),
    iconBtn,refresh,prev,
    el('div',{style:'font:700 15px system-ui;margin:12px 0 4px'},'Tạo gói (mỗi nút ra 1 file .zip)'),
    b('📦 TẤT CẢ trong 1 zip','Web + PWA + PC + Mobile + tài liệu cửa hàng','all',slug(S.name)+'_phat_hanh.zip'),
    b('🌐 Web / itch.io','index.html + ảnh bìa — đăng được ngay, miễn phí','web',slug(S.name)+'_web.zip'),
    b('📲 PWA (cài như app, không cần cửa hàng)','Chạy cả điện thoại lẫn máy tính, có offline','pwa',slug(S.name)+'_pwa.zip'),
    b('🖥 Game PC (Electron → .exe/.dmg)','Dự án sẵn + hướng dẫn build, đăng itch.io/Steam','pc',slug(S.name)+'_pc.zip'),
    b('📱 Game mobile (Capacitor → Android/iOS)','Dự án sẵn + icon + hướng dẫn ra .aab/.ipa','mob',slug(S.name)+'_mobile.zip'),
    b('🛒 Bộ tài liệu cửa hàng','Mô tả, chính sách riêng tư, ghi công, icon 512, ảnh feature, checklist','store',slug(S.name)+'_cua_hang.zip'),
    el('div',{style:'font-size:12px;opacity:.75;margin:10px 0'},'Lưu ý: app tạo gói sẵn sàng build. Việc build ra .exe/.aab/.ipa, ký số và nộp cửa hàng cần công cụ và tài khoản của bạn (hướng dẫn nằm trong từng gói). Hãy kiểm tra giấy phép tài nguyên trước khi bán.'),
    el('button',{style:btnCss+';text-align:center',onclick:()=>ov.remove()},'Đóng'));
  document.body.append(ov);pv();}
