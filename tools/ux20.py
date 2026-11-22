from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':420,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1500)
    C=lambda sel:pg.evaluate("s=>{const b=document.querySelector(s);if(b)b.click();return !!b}",sel)
    BT=lambda t:pg.evaluate("t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t));if(b)b.click();return !!b}",t)
    C('#pn2 [data-t=sheet]');pg.wait_for_timeout(300)
    with pg.expect_file_chooser() as fc: BT('Thêm tileset từ ảnh')
    fc.value.set_files('/tmp/tz/big.png');pg.wait_for_timeout(1500)
    for i in range(4):
        BT('OK');pg.wait_for_timeout(400)
    pg.screenshot(path='ux20.png');print(errs);b.close()
