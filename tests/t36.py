from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    ctx=b.new_context(viewport={'width':1400,'height':900});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    E=lambda js:pg.evaluate(js)
    go3=lambda:pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()")
    go3();pg.wait_for_timeout(1500)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()",t)
    clk=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.trim().includes(t)).click()",t)
    tab('Mô hình')
    with pg.expect_file_chooser() as fc: clk('Nhập gói mô hình')
    fc.value.set_files(['/tmp/k3d/kenney_fantasy-town-kit_2.0.zip']);pg.wait_for_timeout(4000)
    # choose 'tree' category model
    pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>/^tree \\d/.test(b.textContent.trim())).click()");pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#pn3 .pbody button[title]').click()");pg.wait_for_timeout(200)
    c=pg.query_selector('#cv3').bounding_box()
    pg.mouse.click(c['x']+c['width']/2-150,c['y']+c['height']*0.8);pg.wait_for_timeout(1000)
    print('placed',len(E("window.__e3.gameData().props")))
    pg.wait_for_timeout(2500)  # lưu
    pg.reload();pg.wait_for_timeout(1000);go3();pg.wait_for_timeout(2500)
    print('after reload props',len(E("window.__e3.gameData().props")),'pmodels',len(E("Object.keys(window.__e3.gameData().pmodels)")))
    # play
    pg.evaluate("document.getElementById('playbtn')&&document.getElementById('playbtn').click()") if False else None
    btn=pg.evaluate("[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Chơi')).map(b=>b.id||b.className)");print(btn)
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim().endsWith('Chơi')).click()");pg.wait_for_timeout(4000)
    pg.screenshot(path='m36.png');print(errs)
