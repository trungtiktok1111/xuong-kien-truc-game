import sys,time
from playwright.sync_api import sync_playwright
U='/mnt/user-data/uploads/'
fs=[U+'0bfc2c3d-Lang-Nui-Vo-Hiep-Asset-Pack-v1.zip',U+'Lang-Nui-Vo-Hiep-v2-Mo-Dun-Kien-Truc_1.zip',U+'Lang-Nui-Vo-Hiep-v2-Cong-Trinh-Lap-San_1.zip',U+'36b73578-Lang-Nui-Vo-Hiep-v2-Vat-Lieu.zip']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1300,'height':850});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    pg.evaluate("document.querySelector('#pn3 [data-t=mdl]').click()")
    with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Nhập gói')).click()")
    fc.value.set_files(fs);pg.wait_for_timeout(15000)
    print(pg.evaluate("document.querySelector('#pn3').innerText.split('\\n').filter(l=>/mô hình \\//.test(l)||/gói/.test(l)).slice(0,5)"))
    pg.screenshot(path='ux21.png');print(errs);b.close()
