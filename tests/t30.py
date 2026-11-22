from playwright.sync_api import sync_playwright
import time
Z1='/mnt/user-data/uploads/Vo-Hiep-8-Nhan-Vat-Chay-8-Huong-Sua-Tay-Cam.zip'
Z2='/mnt/user-data/uploads/1fd8cf14-Vo-Dang-Nu-Combo-3-Don-Sprites.zip'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1400,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.add_init_script("window.prompt=()=>null;window.confirm=()=>false;window.alert=()=>{}")
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    tab=lambda t:pg.evaluate("t=>[...document.querySelectorAll('#pn2 .ptab')].find(b=>b.textContent.includes(t)).click()",t)
    clk=lambda sel,t:pg.evaluate("([s,t])=>[...document.querySelectorAll(s+' button')].find(b=>b.textContent.includes(t)).click()",[sel,t])
    tab('Hoạt ảnh')
    t0=time.time()
    with pg.expect_file_chooser() as fc: clk('#pn2','NẠP GÓI')
    fc.value.set_files([Z1,Z2]);pg.wait_for_timeout(6000)
    ov=lambda:pg.evaluate("[...document.querySelectorAll('div')].filter(d=>d.style.zIndex=='150')[0].innerText")
    print(ov()[:1500]);print('t',time.time()-t0)
    # chỉ chọn Vo-Dang-Nu
    clk('body','Bỏ chọn')
    pg.evaluate("()=>{const o=[...document.querySelectorAll('div')].filter(d=>d.style.zIndex=='150')[0];[...o.querySelectorAll('input[type=checkbox]')].filter(i=>i.nextSibling&&i.nextSibling.querySelector('b').textContent==='Vo-Dang-Nu').forEach(i=>i.click());}")
    clk('body','Nạp các nhân vật');pg.wait_for_timeout(5000)
    print(pg.evaluate("JSON.stringify(window.__e2.gameData().cfg.anims.map(a=>[a.name,a.sc,a.map,Object.fromEntries(Object.entries(a.st).map(([k,v])=>[k,[v.src.length,v.dirs,v.n,v.fw,v.fh,v.fps,v.ax,v.ay,v.dur&&v.dur.length]]))]))"))
    print('hero',pg.evaluate("window.__e2.gameData().cfg.heroAnim"),'sheets',pg.evaluate("window.__e2.sheets().length"),errs)
    pg.screenshot(path='c1.png')
    # chơi
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.textContent.includes('Chơi')).click()");pg.wait_for_timeout(1000)
    clip={'x':400,'y':150,'width':600,'height':600}
    pg.screenshot(path='c2.png',clip=clip)
    pg.keyboard.down('ArrowRight');pg.wait_for_timeout(400);pg.screenshot(path='c3.png',clip=clip);pg.keyboard.up('ArrowRight')
    pg.keyboard.down('ArrowUp');pg.wait_for_timeout(400);pg.screenshot(path='c4.png',clip=clip);pg.keyboard.up('ArrowUp')
    for i in range(3):
        pg.keyboard.press('j');pg.wait_for_timeout(250);pg.screenshot(path=f'c5{i}.png',clip=clip);pg.wait_for_timeout(350)
    print(errs)
