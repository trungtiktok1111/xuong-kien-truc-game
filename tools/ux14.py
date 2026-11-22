from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    C=lambda sel:pg.evaluate("s=>{const b=document.querySelector(s);if(b)b.click();return !!b}",sel)
    B=lambda t:pg.evaluate("t=>{const b=[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent===t);if(b)b.click();return !!b}",t)
    cnt=lambda:pg.evaluate("document.querySelector('#cnt3')?.textContent")
    C('#pn3 [data-t=tpl]');B('Thay thế toàn bộ');B('Lâu đài nhỏ');pg.wait_for_timeout(500)
    C('#pn3 [data-t=build]');B('✋ Chọn');pg.keyboard.press('Home');pg.wait_for_timeout(400)
    print(cnt())
    pg.evaluate("document.querySelector('#pn3 input[type=range]').focus()")
    print('focus',pg.evaluate('document.activeElement.tagName+document.activeElement.type'))
    for pt in [(600,330)]:
        pg.mouse.click(*pt);pg.wait_for_timeout(300)
        print(pt,pg.evaluate("document.querySelector('#pn3').innerText.split('\\n').find(l=>l.includes('Đang chọn')||l.includes('Bấm vào'))"))
        pg.keyboard.press('Delete');pg.wait_for_timeout(300);print(cnt())
    # after slider focus
    pg.screenshot(path='ux14.png');print(errs);b.close()
