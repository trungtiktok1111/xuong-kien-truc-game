from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(800)
    c=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes(t)).click()",t)
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('3D')).click()");pg.wait_for_timeout(1500)
    c('Tệp');pg.wait_for_timeout(200);c('💾 Lưu');pg.wait_for_timeout(200)
    pg.evaluate("window.__e3._t.clearAll()")
    c('Mở');pg.wait_for_timeout(500);c('Xây');pg.wait_for_timeout(300);print(pg.evaluate("document.querySelector('#cnt3').textContent"),errs)
