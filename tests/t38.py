from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()","Mô hình")
    with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Nhập gói mô hình')).click()")
    fc.value.set_files(['/tmp/k3d/all/kenney_survival-kit.zip']);pg.wait_for_timeout(5000)
    c=pg.query_selector('#cv3').bounding_box()
    names=['tent','tree','campfire','chest','barrel','fish']
    for i,n in enumerate(names):
        pg.evaluate("n=>{const b=[...document.querySelectorAll('#pn3 .pbody button[title]')].find(x=>x.title===n||x.textContent.trim()===n);if(b)b.click();else console.log('no',n)}",n)
        pg.wait_for_timeout(200)
        pg.mouse.click(c['x']+300+i*90,c['y']+c['height']*0.75);pg.wait_for_timeout(900)
    pg.screenshot(path='m38.png',clip={'x':0,'y':350,'width':1020,'height':550});print(errs)
