from playwright.sync_api import sync_playwright
import base64
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(800)
    pg.evaluate("window.claude={use:async()=>({save:async o=>{window.__o=o;}})}")
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Tệp')).click()");pg.wait_for_timeout(300)
    pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Xuất dữ liệu')).click()");pg.wait_for_timeout(500)
    print(pg.evaluate("window.__o&&window.__o.filename"),errs)
