from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else 0)
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    pg.evaluate("[...document.querySelectorAll('#pn3 [data-t]')].map(e=>e.dataset.t)")
    print(pg.evaluate("[...document.querySelectorAll('#pn3 [data-t]')].map(e=>e.dataset.t+':'+e.textContent)"))
    pg.evaluate("document.querySelector('#pn3 [data-t=models]')?.click()||[...document.querySelectorAll('#pn3 *')].find(e=>e.textContent.includes('Mô hình')&&e.children.length==0)?.click()");pg.wait_for_timeout(300)
    with pg.expect_file_chooser() as fc:
        pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Nhập gói')).click()")
    fc.value.set_files('/tmp/pack/p.zip');pg.wait_for_timeout(3000)
    pg.evaluate("[...document.querySelectorAll('#pn3 *')].find(e=>e.textContent==='Nha_hien'&&e.children.length==0).click()");pg.wait_for_timeout(300)
    pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Đặt')).click()");pg.keyboard.press('Home');pg.wait_for_timeout(300)
    pg.mouse.move(195,260);pg.wait_for_timeout(300);pg.mouse.click(195,260);pg.wait_for_timeout(1500)
    print(pg.evaluate("document.querySelector('#pn3').innerText.slice(-200)"))
    pg.screenshot(path='ux17.png');print(errs[:5]);b.close()
