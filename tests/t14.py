from playwright.sync_api import sync_playwright
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
    for t,dx,dy in [('Xuất phát',0,110),('Quái',-60,70),('NPC',-80,110),('Rương',70,120),('Đích',0,-10)]:
        c(t);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(150)
    # export game
    d=pg.evaluate("JSON.stringify(window.__e3?Object.keys(window.__e3):null)");print(d)
    pg.evaluate("document.querySelector('#playbtn').click()");pg.wait_for_timeout(1200)
    for k in ['w','a','d','s']:
        pg.keyboard.down(k);pg.wait_for_timeout(500);pg.keyboard.up(k);pg.keyboard.press('f');pg.wait_for_timeout(200)
    for _ in range(8):
        pg.keyboard.press('f');pg.wait_for_timeout(250)
    pg.screenshot(path='q3.png');print(errs)
