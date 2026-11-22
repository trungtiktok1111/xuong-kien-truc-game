from playwright.sync_api import sync_playwright
import base64,glob
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page();pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(800)
    for f in ['g16','g32','g16m1','g24','g16s','img0','img1','img2']:
        d='data:image/png;base64,'+base64.b64encode(open('/tmp/mt/%s.png'%f,'rb').read()).decode()
        print(f,pg.evaluate("d=>window.__guess(d)",d))
