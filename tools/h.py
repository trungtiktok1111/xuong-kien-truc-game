import json,sys
from playwright.sync_api import sync_playwright
PK=['kenney_fantasy-town-kit_2.0','kenney_castle-kit','kenney_nature-kit','kenney_pirate-kit']
def run(projfile,shot,cam=None,keep=None):
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=b.new_page(viewport={'width':1500,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
        pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1200)
        pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()","Mô hình")
        with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Nhập gói mô hình')).click()")
        fc.value.set_files(['/tmp/k3d/all/%s.zip'%z for z in PK]);pg.wait_for_timeout(16000)
        print(pg.evaluate("document.querySelector('#pn3').innerText.match(/\\d+ mô hình \\/ \\d+ gói/)[0]"))
        pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()","Tệp");pg.wait_for_timeout(300)
        with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Công trình .json')).click()")
        fc.value.set_files([projfile]);pg.wait_for_timeout(9000)
        if cam:pg.evaluate("c=>window.__e3.cam&&Object.assign(window.__e3.cam,c)",cam)
        pg.wait_for_timeout(800);pg.screenshot(path=shot);print(errs[:3])
        b.close()
if __name__=='__main__':run(sys.argv[1],sys.argv[2])
