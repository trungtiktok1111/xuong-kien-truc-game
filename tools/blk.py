from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.type+':'+m.text) if m.type in('error','warning') else 0)
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(800)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1200)
    pg.evaluate("[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes('Mẫu')).click();[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent==='Lâu đài nhỏ').click()");pg.wait_for_timeout(1500)
    pg.reload();pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(2500)
    pg.screenshot(path='blk1.png')
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='2d').click()");pg.wait_for_timeout(800)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(2000)
    pg.screenshot(path='blk2.png');print(errs[:6]);b.close()
