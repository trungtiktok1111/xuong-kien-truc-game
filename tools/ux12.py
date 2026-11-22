from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    C=lambda sel:pg.evaluate("s=>{const b=document.querySelector(s);if(b)b.click();return !!b}",sel)
    B=lambda t:pg.evaluate("t=>{const b=[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes(t));if(b)b.click();return !!b}",t)
    C('#pn3 [data-t=build]');B('Chọn');pg.keyboard.press('Home');pg.wait_for_timeout(500)
    cnt=lambda:pg.evaluate("document.querySelector('#cnt3').textContent")
    pg.mouse.click(560,200);pg.wait_for_timeout(100);pg.mouse.click(560,200);pg.wait_for_timeout(400)
    pg.keyboard.press('Control+c');pg.wait_for_timeout(300)
    for pt in [(300,600),(400,650)]:
        pg.mouse.move(*pt);pg.wait_for_timeout(300);pg.mouse.click(*pt);pg.wait_for_timeout(500);print(pt,cnt())
    pg.screenshot(path='ux12.png');print(errs);b.close()
