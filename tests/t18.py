from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1800)
    c=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#v3d button')].find(b=>b.textContent.includes(t)).click()",t)
    c('Đối tượng')
    box=pg.evaluate("(()=>{const r=document.querySelector('#v3d canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    cx=box[0]+box[2]/2;cy=box[1]+box[3]/2
    for t,dx,dy in [('Xuất phát',0,110),('Quái',-60,70),('Rương',70,120),('Đích',40,100)]:
        c(t);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(150)
    pg.click('#chkbtn');pg.wait_for_timeout(500)
    print(pg.evaluate("document.body.innerText.split('Máy tự kiểm')[1]")[:1100].split('Phiếu')[0])
    # chặn: xoá khối quanh xuất phát? kiểm bằng cách đặt Đích trên đỉnh cao đã là ca "không tới"
    print(errs)
