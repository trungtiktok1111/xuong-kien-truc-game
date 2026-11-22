from playwright.sync_api import sync_playwright
U='/mnt/user-data/uploads/'
fs=[U+'Tram-Dich-Xich-Sa-2D-Hoan-Thien.zip']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1300,'height':850});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("document.querySelector('#pn2 [data-t=sheet]').click()");pg.wait_for_timeout(500)
    with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.includes('tự phân loại')).click()")
    fc.value.set_files(fs);pg.wait_for_timeout(9000)
    pg.evaluate("(()=>{const s=document.querySelectorAll('#pn2 select')[0];s.selectedIndex=6;s.dispatchEvent(new Event('change'))})()");pg.wait_for_timeout(1200)
    print(pg.evaluate("document.querySelector('#pn2').innerText.slice(0,300)"))
    pg.screenshot(path='ux22.png');print(errs);b.close()
