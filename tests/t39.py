from playwright.sync_api import sync_playwright
import shutil,os
ud='/tmp/ud39';shutil.rmtree(ud,ignore_errors=True)
A=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
def go(ctx):
    pg=ctx.new_page();pg.set_viewport_size({'width':1400,'height':900});pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    pg.evaluate("[...document.querySelectorAll('.tabbtn')].find(b=>b.dataset.v==='3d').click()");pg.wait_for_timeout(1500)
    pg.evaluate("t=>[...document.querySelectorAll('#pn3 .ptab')].find(b=>b.textContent.includes(t)).click()","Mô hình");return pg
with sync_playwright() as p:
    ctx=p.chromium.launch_persistent_context(ud,executable_path='/usr/bin/google-chrome',args=A)
    pg=go(ctx)
    with pg.expect_file_chooser() as fc: pg.evaluate("[...document.querySelectorAll('#pn3 button')].find(b=>b.textContent.includes('Nhập gói mô hình')).click()")
    fc.value.set_files(['/tmp/k3d/all/kenney_survival-kit.zip']);pg.wait_for_timeout(5000)
    c=pg.query_selector('#cv3').bounding_box()
    pg.evaluate("n=>[...document.querySelectorAll('#pn3 .pbody button[title]')].find(x=>x.title===n||x.textContent.trim()===n).click()","tree");pg.wait_for_timeout(200)
    pg.mouse.click(c['x']+400,c['y']+c['height']*0.75);pg.wait_for_timeout(1000)
    pg.wait_for_timeout(1500);ctx.close()
    ctx=p.chromium.launch_persistent_context(ud,executable_path='/usr/bin/google-chrome',args=A)
    pg=go(ctx);pg.wait_for_timeout(3000)
    pg.screenshot(path='m39.png',clip={'x':200,'y':450,'width':500,'height':400})
