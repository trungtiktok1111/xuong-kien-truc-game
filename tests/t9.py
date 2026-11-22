from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("window.__dl=[];window.claude={use:async()=>({save:async o=>{window.__dl.push(o);}})}")
    pg.click('#playbtn');pg.wait_for_timeout(600)
    print('before',pg.evaluate("[...document.querySelectorAll('div')].filter(d=>d.textContent==='✕ Thoát').length"))
    pg.keyboard.down('ArrowRight');pg.wait_for_timeout(900);pg.keyboard.up('ArrowRight')
    pg.keyboard.press(' ');pg.wait_for_timeout(100);pg.screenshot(path='g1.png')
    print('err',errs)
    # export 2D
    pg.keyboard.press('Escape')
    pg.evaluate("[...document.querySelectorAll('div')].find(d=>d.textContent==='✕ Thoát').click()");pg.wait_for_timeout(300)
    print(errs);print('after exit',pg.evaluate("[...document.querySelectorAll('div')].filter(d=>d.textContent==='✕ Thoát').length"))
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Tệp')).click()")
    pg.evaluate("[...document.querySelectorAll('#v2d button')].find(b=>b.textContent.includes('Xuất GAME 2D')).click()");pg.wait_for_timeout(1500)
    print(pg.evaluate("window.__dl.map(o=>[o.filename,o.data.size])"))
    html=pg.evaluate("window.__dl[0].data.text()");open('/tmp/game2d.html','w').write(html)
    # 3D play
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('3D')&&b.className.includes('tabbtn')).click()");pg.wait_for_timeout(1500)
    print('ov',pg.evaluate("[...document.querySelectorAll('div')].filter(d=>d.textContent==='✕ Thoát').length"), pg.evaluate("document.querySelector('#v3d').style.display"))
    pg.click('#playbtn');pg.wait_for_timeout(1500)
    pg.keyboard.down('w');pg.wait_for_timeout(1500);pg.keyboard.up('w');pg.keyboard.press(' ');pg.wait_for_timeout(300)
    pg.screenshot(path='g2.png')
    pg.evaluate("[...document.querySelectorAll('div')].find(d=>d.textContent==='✕ Thoát').click()");pg.wait_for_timeout(300)
    pg.evaluate("[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes('Tệp')).click()")
    pg.evaluate("[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes('Xuất GAME 3D')).click()");pg.wait_for_timeout(1500)
    html=pg.evaluate("window.__dl[window.__dl.length-1].data.text()");open('/tmp/game3d.html','w').write(html)
    print('err',errs)
    for n in ['2d','3d']:
        q=b.new_page(viewport={'width':390,'height':800});e=[];q.on('pageerror',lambda x:e.append(str(x)))
        q.goto('file:///tmp/game%s.html'%n);q.wait_for_timeout(2500);q.screenshot(path='x%s.png'%n);print(n,len(open('/tmp/game%s.html'%n).read()),e)
