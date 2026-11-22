from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.add_init_script("window.claude={use:()=>({save:async f=>{window.__saved=(window.__saved||[]).concat([f.filename])}})}")
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1800)
    c=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes(t)).click()",t)
    c('Đối tượng')
    box=pg.evaluate("(()=>{const r=document.querySelector('#v3d canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    cx=box[0]+box[2]/2;cy=box[1]+box[3]/2
    for t,dx,dy in [('Xuất phát',0,110),('Quái',-60,70),('Rương',70,120),('Đích',0,-10)]:
        c(t);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(150)
    g=pg.evaluate("JSON.stringify(window.__e3.gameData().ents.map(e=>[e.t,e.x,e.y,e.z]))");print(g)
    # export HTML
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Phát hành')).click()");pg.wait_for_timeout(500)
    print(pg.evaluate("[...document.querySelectorAll('button')].map(b=>b.textContent).filter(t=>/HTML|zip|Xuất/.test(t)).slice(0,6)"))
    print(errs)
