from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1917,'height':860});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1800)
    print(pg.evaluate("""['#v3d','#v3d canvas','#pn3','#pn3 .pbody'].map(s=>{const e=document.querySelector(s);if(!e)return s+' none';const r=e.getBoundingClientRect();return s+' '+[r.x,r.y,r.width,r.height].map(Math.round)+' disp='+getComputedStyle(e).display})"""))
    pg.screenshot(path='w1.png');print(errs)
