from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    clk=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#v2d button')].find(b=>b.textContent.includes(t)).click()",t)
    # zoom: make cells large
    clk('Đối tượng');pg.wait_for_timeout(200)
    box=pg.evaluate("(()=>{const r=document.querySelector('#cv2').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()");print(box)
    cx=box[0]+box[2]/2;cy=box[1]+box[3]/2
    # zoom in with wheel
    pg.mouse.move(cx,cy)
    for _ in range(6): pg.mouse.wheel(0,-300);pg.wait_for_timeout(50)
    pg.wait_for_timeout(300)
    def place(t,dx,dy):
        clk(t);pg.wait_for_timeout(100);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(150)
    place('Xuất phát',-120,-90);place('Quái',60,-40);place('NPC',-120,-30);place('Rương',-90,-90);place('Đích',-60,-90)
    pg.screenshot(path='o1.png')
    pg.evaluate("document.querySelector('#playbtn').click()");pg.wait_for_timeout(500)
    pg.keyboard.down('ArrowDown');pg.wait_for_timeout(250);pg.keyboard.up('ArrowDown');pg.keyboard.press(' ');pg.wait_for_timeout(200);pg.screenshot(path='o3.png');pg.keyboard.down('ArrowUp');pg.wait_for_timeout(300);pg.keyboard.up('ArrowUp');pg.keyboard.down('ArrowRight');pg.wait_for_timeout(1200);pg.keyboard.up('ArrowRight');pg.wait_for_timeout(300)
    pg.screenshot(path='o2.png');print(errs)
