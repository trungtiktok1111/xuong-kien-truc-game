from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('C:'+m.text) if m.type=='error' else None)
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    E=lambda js:pg.evaluate(js)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()",t)
    clk=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.trim().includes(t)).click()",t)
    tab('Mô hình');pg.wait_for_timeout(300)
    with pg.expect_file_chooser() as fc: clk('Nhập gói mô hình')
    fc.value.set_files(['/tmp/k3d/kenney_fantasy-town-kit_2.0.zip','/tmp/k3d/kenney_castle-kit.zip'])
    pg.wait_for_timeout(5000)
    print('toast',E("document.querySelector('#toast')&&document.querySelector('#toast').textContent"),[x for x in errs if 'GL Driver' not in x][:8])
    print(E("document.querySelector('#pn3 .pbody').innerText.slice(0,260)"))
    print('thumbs',E("document.querySelectorAll('#pn3 .pbody img').length"))
    pg.screenshot(path='m35a.png')
    # choose first model
    pg.evaluate("document.querySelector('#pn3 .pbody button[title] ').click()");pg.wait_for_timeout(300)
    c=pg.query_selector('#cv3').bounding_box()
    for dx in (0,60,-60):
        pg.mouse.click(c['x']+c['width']/2+dx,c['y']+c['height']*0.75);pg.wait_for_timeout(900)
    d=E("window.__e3.gameData()")
    print('props',len(d['props']),'models',list(d['pmodels'].keys())[:3],'tex packs',list(d['ptex'].keys()))
    pg.wait_for_timeout(500);pg.screenshot(path='m35b.png')
    # edit selected: rotate, scale
    clk('⟳ 90°');clk('＋10%');pg.wait_for_timeout(300)
    print(E("JSON.stringify(window.__e3.gameData().props.map(p=>[p.x,p.y,p.z,+p.ry.toFixed(2),+p.s.toFixed(2)]))"))
    print([x for x in errs if 'GL Driver' not in x][:8])
