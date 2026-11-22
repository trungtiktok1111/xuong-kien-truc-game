from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1800)
    c=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes(t)).click()",t)
    c('Đối tượng')
    box=pg.evaluate("(()=>{const r=document.querySelector('#v3d canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    cx=box[0]+box[2]/2;cy=box[1]+box[3]/2
    for t,dx,dy in [('Xuất phát',0,110),('Quái',-60,70),('Rương',70,120),('Đích',0,-10)]:
        c(t);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(150)
    G=pg.evaluate("JSON.stringify(window.__e3.gameData())")
    pg2=b.new_page(viewport={'width':390,'height':800});pg2.on('pageerror',lambda e:errs.append('P2 '+str(e)))
    pg2.add_init_script("window.__GAME="+G)
    pg2.goto('file:///home/claude/ed/index.html');pg2.wait_for_timeout(2500)
    pg2.screenshot(path='q4.png')
    # attack until enemies gone
    for _ in range(3):
        pg2.keyboard.press('f');pg2.wait_for_timeout(300)
    print(pg2.evaluate("document.body.innerText.slice(0,200)"));print(errs)
