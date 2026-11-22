import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1200)
    pg.evaluate("[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes('Mẫu')).click()");pg.wait_for_timeout(300)
    names=pg.evaluate("[...document.querySelectorAll('#pn3 button')].map(b=>b.textContent).filter(t=>!t.includes('Xóa hết'))")
    names=[n for n in names if True]
    print(len(names))
    import json
    only=sys.argv[1:] 
    for i,n in enumerate(names):
        pg.evaluate("n=>{[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes('Mẫu')).click();[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent===n).click();}",n)
        pg.wait_for_timeout(500)
        pg.evaluate("c=>Object.assign(window.__e3.cam,c)",{'az':0.7,'el':0.55,'dist':46,'tx':16,'ty':3,'tz':14})
        pg.wait_for_timeout(500)
        pg.screenshot(path='/home/claude/town/tpl_%02d.png'%i,clip={'x':0,'y':45,'width':1120,'height':855})
        print(i,n)
    print(errs[:5]);b.close()
