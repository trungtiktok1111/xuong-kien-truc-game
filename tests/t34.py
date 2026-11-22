from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    E=lambda js:pg.evaluate(js)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn2 .ptab')].find(b=>b.textContent.includes(t)).click()",t)
    clk=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.trim()===t).click()",t)
    n=lambda:E("document.querySelector('#pn2 .pbody').innerText.match(/Tìm thấy \\d+ ô/)[0]")
    tab('Tài nguyên');pg.wait_for_timeout(600);print('all',n())
    for k in ['Nền','Vật thể','Mái / cửa']:
        clk(k);pg.wait_for_timeout(250);print(k,n());clk('Tất cả') if False else None
        pg.evaluate("k=>[...document.querySelectorAll('#pn2 button')].filter(b=>b.textContent.trim()===k)[0].click()",k)
    clk('Nền');
    for k in ['Cây','Nhà','Nhân vật','Trang trí']:
        pg.evaluate("k=>[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.trim()===k).click()",k);pg.wait_for_timeout(250);print(k,n())
        pg.evaluate("k=>[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.trim()===k).click()",k)
    print(errs)
