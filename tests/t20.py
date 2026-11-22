from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('.ptab')].find(b=>b.textContent.includes(t)).click()",t)
    btn=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.includes(t)).click()",t)
    tab('Đối tượng')
    box=pg.evaluate("(()=>{const r=document.querySelector('#v2d canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()");print(box)
    cx=box[0]+box[2]/2;cy=box[1]+box[3]/2
    for t,dx,dy in [('Xuất phát',0,0),('Quái',40,0),('NPC',-40,0),('Đích',0,50)]:
        btn(t);pg.mouse.click(cx+dx,cy+dy);pg.wait_for_timeout(150)
    # NPC: tạo hội thoại nhánh
    pg.mouse.click(cx-40,cy);pg.wait_for_timeout(150)
    btn('Tạo hội thoại nhánh');pg.wait_for_timeout(200)
    print('dlg editor:',pg.evaluate("document.querySelector('#pn2').innerText").replace('\n',' | ')[:400])
    btn('Thêm đoạn thoại');btn('Lựa chọn');pg.wait_for_timeout(200)
    tab('Logic');btn('hiện đích');pg.wait_for_timeout(200)
    pg.screenshot(path='e1.png')
    print('rules:',pg.evaluate("document.querySelector('#pn2').innerText").replace('\n',' | ')[:500])
    pg.click('#chkbtn');pg.wait_for_timeout(400)
    print(pg.evaluate("document.body.innerText.split('Máy tự kiểm')[1]").split('Phiếu')[0][:1500])
    pg.screenshot(path='e2.png');print(errs)
