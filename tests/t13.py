from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1800)
    c=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes(t)).click()",t)
    c('Đối tượng');pg.wait_for_timeout(300)
    box=pg.evaluate("(()=>{const r=document.querySelector('#v3d canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()");print(box)
    cx=box[0]+box[2]/2;cy=box[1]+box[3]/2
    def place(t,dx,dy):
        c(t);pg.wait_for_timeout(100);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(200)
    place('Xuất phát',0,110);place('Quái',-60,70);place('Quái',60,80);place('NPC',-80,110);place('Rương',70,120);place('Đích',0,-10)
    pg.screenshot(path='q1.png')
    pg.evaluate("document.querySelector('#playbtn').click()");pg.wait_for_timeout(1500)
    pg.keyboard.down('w');pg.wait_for_timeout(1200);pg.keyboard.up('w');pg.keyboard.press('f');pg.wait_for_timeout(300)
    pg.screenshot(path='q2.png');print(errs)
