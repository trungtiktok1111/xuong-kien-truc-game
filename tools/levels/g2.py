from playwright.sync_api import sync_playwright
import json
U='/mnt/user-data/uploads/'
def pack(pg,f,names):
    with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.includes('NẠP GÓI HOẠT ẢNH')).click()")
    fc.value.set_files(f);pg.wait_for_timeout(6000)
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Bỏ chọn')).click()")
    for n in names: pg.evaluate("n=>{const r=[...document.querySelectorAll('b')].find(b=>b.textContent===n);r.parentElement.parentElement.querySelector('input').click()}",n)
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Nạp các nhân vật')).click()");pg.wait_for_timeout(5000)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1300,'height':850},accept_downloads=True);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("document.querySelector('#pn2 [data-t=anim]').click()");pg.wait_for_timeout(500)
    pack(pg,U+'Vo-Hiep-8-Nhan-Vat-Chay-8-Huong-Sua-Tay-Cam.zip',['Vo-Dang-Nu','Cai-Bang-Nam','Thieu-Lam-Nam','Ngu-Doc-Nam'])
    with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn2 button')].find(b=>b.textContent.includes('NẠP GÓI HOẠT ẢNH')).click()")
    fc.value.set_files(U+'1fd8cf14-Vo-Dang-Nu-Combo-3-Don-Sprites.zip');pg.wait_for_timeout(4000)
    print(pg.evaluate("[...document.querySelectorAll('b')].map(b=>b.textContent)"))
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Nạp các nhân vật')).click()");pg.wait_for_timeout(3000)
    print(pg.evaluate("document.body.innerText.slice(0,200)"))
    pg.screenshot(path='g2.png');print(errs)
    open('/tmp/base_anim.json','w').write(pg.evaluate('JSON.stringify(window.__proj())'));b.close()
j=json.load(open('/tmp/base_anim.json'));print(len(j['sheets']),[s['name'] for s in j['sheets']][4:],[ (a['name'],list(a['st'])) for a in j['cfg'].get('anims',[])],j['cfg'].get('heroAnim'))
