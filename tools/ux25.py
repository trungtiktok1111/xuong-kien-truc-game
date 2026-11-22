from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1300,'height':850});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.evaluate("localStorage.setItem('thk_hide2d','[0,1,2,3]')");pg.reload();pg.wait_for_timeout(1200)
    pg.evaluate("document.querySelector('#pn2 [data-t=obj]').click()");pg.wait_for_timeout(500)
    print(pg.evaluate("document.querySelector('#pn2').innerText.slice(-300)"),errs)
    pg.screenshot(path='ux25.png');b.close()
