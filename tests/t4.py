from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(800)
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('3D')).click()");pg.wait_for_timeout(1500)
    for t in ['Mẫu','Tệp','Góc nhìn','Xây']:
        pg.evaluate("t=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t)).click()",t);pg.wait_for_timeout(300)
    pg.mouse.click(195,250);pg.wait_for_timeout(500)
    pg.screenshot(path='f2.png')
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('2D')).click()");pg.wait_for_timeout(800)
    pg.screenshot(path='f3.png')
    print(errs)
