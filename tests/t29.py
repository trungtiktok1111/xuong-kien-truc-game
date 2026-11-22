from playwright.sync_api import sync_playwright
import base64,glob,os
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page();pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1200)
    for f in sorted(glob.glob('/tmp/g/*.png')):
        d='data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
        print(os.path.basename(f),pg.evaluate("async d=>{const i=new Image();i.src=d;await i.decode();return JSON.stringify(window.__fg(i))}",d))
