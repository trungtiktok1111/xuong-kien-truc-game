from playwright.sync_api import sync_playwright
import sys
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if 'GL Driver' not in m.text else None)
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    E=lambda js:pg.evaluate(js)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()",t)
    clk=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.trim().includes(t)).click()",t)
    tab('Mô hình')
    with pg.expect_file_chooser() as fc: clk('Nhập gói mô hình')
    fc.value.set_files(['/tmp/k3d/all/kenney_survival-kit.zip']);pg.wait_for_timeout(5000)
    pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>/^structure \\d/.test(b.textContent.trim())).click()");pg.wait_for_timeout(300)
    pg.evaluate("document.querySelectorAll('#pn3 .pbody button[title]')[3].click()");pg.wait_for_timeout(200)
    c=pg.query_selector('#cv3').bounding_box()
    pg.mouse.click(c['x']+c['width']/2-100,c['y']+c['height']*0.8);pg.wait_for_timeout(1500)
    print(E("(async()=>{return JSON.stringify(Object.keys(window.__e3.gameData().ptex).map(k=>[k,Object.keys(window.__e3.gameData().ptex[k])]))})()"))
    pg.screenshot(path='m37.png');print(errs[:6])
