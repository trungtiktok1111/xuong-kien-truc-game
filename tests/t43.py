from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    cnt=lambda:pg.evaluate("document.querySelector('#cnt3').textContent")
    c=pg.query_selector('#cv3').bounding_box();print(cnt())
    pg.mouse.click(c['x']+200,c['y']+700);pg.wait_for_timeout(300);print('sau click',cnt())
    # zoom at cursor on lower-left
    pg.mouse.move(c['x']+150,c['y']+650)
    for i in range(12): pg.mouse.wheel(0,-120);pg.wait_for_timeout(50)
    pg.wait_for_timeout(300);pg.screenshot(path='m43a.png')
    # pan right-drag
    pg.mouse.move(c['x']+500,c['y']+400);pg.mouse.down(button='right');pg.mouse.move(c['x']+700,c['y']+450,steps=6);pg.mouse.up(button='right')
    pg.keyboard.press('d');pg.keyboard.press('w');pg.wait_for_timeout(300);pg.screenshot(path='m43b.png')
    pg.keyboard.press('b');pg.mouse.click(c['x']+300,c['y']+600);pg.wait_for_timeout(300);print('build',cnt());pg.keyboard.press('Escape');pg.mouse.click(c['x']+300,c['y']+600);print('esc',cnt(),errs)
