from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    E=lambda js:pg.evaluate(js)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn2 .ptab')].find(b=>b.textContent.includes(t)).click()",t)
    clk=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.trim().includes(t)).click()",t)
    cnt=lambda:E("document.querySelectorAll('#pn2 canvas[title]').length")
    tab('Tài nguyên');pg.wait_for_timeout(500);print('all tiles shown',cnt(),E("document.querySelector('#pn2 .pbody').innerText.match(/Tìm thấy \\d+ ô/)[0]"))
    clk('Gợi ý nhãn');pg.wait_for_timeout(500)
    clk('Nhà');pg.wait_for_timeout(300);print('Nhà',E("document.querySelector('#pn2 .pbody').innerText.match(/Tìm thấy \\d+ ô/)[0]"))
    clk('Nhà');clk('Chặn đường');pg.wait_for_timeout(300);print('Chặn',E("document.querySelector('#pn2 .pbody').innerText.match(/Tìm thấy \\d+ ô/)[0]"))
    clk('Chặn đường');clk('Mới dùng');pg.wait_for_timeout(300);print('recent',cnt())
    clk('Tất cả');
    # multi tag
    clk('Chưa dùng');pg.wait_for_timeout(300);clk('Chọn nhiều');pg.wait_for_timeout(200)
    for i in range(3): pg.evaluate("i=>document.querySelectorAll('#pn2 canvas[title]')[i].click()",i)
    pg.wait_for_timeout(200)
    pg.evaluate("[...document.querySelectorAll('#pn2 button')].filter(b=>b.textContent.trim()==='Cây')[1].click()")
    pg.wait_for_timeout(200);E("window.__x=1")
    print(E("JSON.stringify(Object.values(JSON.parse(localStorage.getItem('thk_tags2d')).tiles).filter(t=>t.type==='Cây').length)"))
    clk('Dùng làm stamp');pg.wait_for_timeout(300);print('tab now',E("document.querySelector('#pn2 .ptab.on')&&document.querySelector('#pn2 .ptab.on').textContent"))
    tab('Tài nguyên');pg.wait_for_timeout(300);pg.screenshot(path='m33.png');print(errs)
