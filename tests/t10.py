from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.click('#playbtn');pg.wait_for_timeout(400)
    print(pg.evaluate("[...document.querySelectorAll('div')].filter(d=>d.textContent==='✕ Thoát').length"))
    pg.evaluate("[...document.querySelectorAll('div')].find(d=>d.textContent==='✕ Thoát').click()");pg.wait_for_timeout(300)
    print(pg.evaluate("[...document.querySelectorAll('div')].filter(d=>d.textContent==='✕ Thoát').length"),errs)
