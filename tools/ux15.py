from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    C=lambda sel:pg.evaluate("s=>{const b=document.querySelector(s);if(b)b.click();return !!b}",sel)
    B=lambda t:pg.evaluate("t=>{const b=[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes(t));if(b)b.click();return !!b}",t)
    cnt=lambda:pg.evaluate("document.querySelector('#cnt3')?.textContent")
    C('#pn3 [data-t=tpl]');B('Xóa hết');pg.wait_for_timeout(300);pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Đồng ý').click()");pg.wait_for_timeout(300);C('#pn3 [data-t=build]');pg.keyboard.press('Home');pg.wait_for_timeout(300)
    B('🧱 Đặt');pg.wait_for_timeout(200);B('Cổng vòm');pg.wait_for_timeout(200);pg.keyboard.press('Equal');pg.keyboard.press('Equal');pg.keyboard.press('Equal');pg.keyboard.press('Equal')
    pg.keyboard.down('Control');pg.mouse.move(450,520);pg.mouse.down();pg.mouse.move(650,540,steps=8);pg.mouse.up();pg.keyboard.up('Control');pg.wait_for_timeout(500)
    pg.screenshot(path='ux15.png');print(cnt(),errs);b.close()
