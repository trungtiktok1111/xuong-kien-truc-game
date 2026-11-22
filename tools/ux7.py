from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent==='160×160').click()");pg.wait_for_timeout(800)
    pg.screenshot(path='/home/claude/town/ux7a.png')
    pg.evaluate("window.__e3.cam.dist=30;window.__e3.cam.tx=0");pg.wait_for_timeout(300)
    pg.keyboard.press('Home');pg.wait_for_timeout(500)
    pg.screenshot(path='/home/claude/town/ux7b.png');print(errs);b.close()
