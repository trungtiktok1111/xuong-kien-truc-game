from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    txt=lambda:pg.evaluate("document.body.innerText.split('Máy tự kiểm')[1]||'?'")[:900]
    # 2D: map trống, không đối tượng
    pg.click('#chkbtn');pg.wait_for_timeout(300);print('--2D rỗng--',txt().split('Phiếu')[0]);pg.screenshot(path='c1.png')
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Đóng')).click()")
    # 2D: start + goal bị tường bao + quái; qua gameData hack: sửa trực tiếp
    r=pg.evaluate("""(()=>{const g=window.__e2.gameData();const W=g.w,H=g.h;return [W,H]})()""");print(r)
    # dùng check trực tiếp qua import không có; dựng dữ liệu rồi mở check bằng getData tạm
    pg.evaluate("""(()=>{const orig=window.__e2.gameData;window.__e2.gameData=()=>{const g=orig();g.blk=g.blk.map(()=>0);const W=g.w;g.ents=[{t:'start',x:2,y:2},{t:'goal',x:10,y:10},{t:'enemy',x:5,y:5,hp:2}];
      for(let i=0;i<g.w*g.h;i++){const x=i%W,y=Math.floor(i/W);if(Math.abs(x-10)<=2&&Math.abs(y-10)<=2&&(Math.abs(x-10)==2||Math.abs(y-10)==2))g.blk[i]=1;}g.cfg={hp:5,spd:4.2,dmg:0,rng:1.3,win:'goal'};return g;};})()""")
    pg.click('#chkbtn');pg.wait_for_timeout(300);print('--2D đích bị vây--',txt().split('Phiếu')[0])
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Đóng')).click()")
    # 3D
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1800)
    pg.evaluate("""(()=>{const e=window.__e3;const t=e._t;t.clearAll();for(let x=0;x<24;x++)for(let z=0;z<24;z++)t.setV(x+','+0+','+z,{s:'cube',m:0,r:0});})()""")
    print('setV ok?')
    print(errs)
