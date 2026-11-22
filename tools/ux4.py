from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1200)
    pg.evaluate("[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes('Mẫu')).click();[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Xóa hết')).click()");pg.wait_for_timeout(400)
    pg.evaluate("[...document.querySelectorAll('button')].filter(b=>b.textContent==='Đồng ý').forEach(b=>b.click())")
    pg.evaluate("c=>Object.assign(window.__e3.cam,c)",{'az':0.0001,'el':1.3,'dist':30,'tx':24,'ty':0,'tz':24});pg.wait_for_timeout(500)
    cnt=lambda:pg.evaluate("document.querySelector('#cnt3').textContent")
    pg.keyboard.press('Digit2');pg.keyboard.down('KeyC');pg.mouse.move(400,300);pg.mouse.down();pg.mouse.move(600,500,steps=20);pg.mouse.up();pg.keyboard.up('KeyC');print('cheo',cnt())
    pg.keyboard.press('Digit3');pg.keyboard.down('Control');pg.mouse.move(700,300);pg.mouse.down();pg.mouse.move(900,450,steps=15);pg.mouse.up();pg.keyboard.up('Control');print('vung',cnt())
    pg.keyboard.press('KeyX');pg.keyboard.down('Control');pg.mouse.move(750,330);pg.mouse.down();pg.mouse.move(850,420,steps=15);pg.mouse.up();pg.keyboard.up('Control');print('xoa vung',cnt())
    pg.screenshot(path='/home/claude/town/ux4.png');print(errs);b.close()
