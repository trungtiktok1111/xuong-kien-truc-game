from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page();pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(800)
    print(pg.evaluate("""async()=>{const o=[];for(const s of window.__e2.sheets().slice(0,4)){o.push([s.name,s.tw,s.margin,JSON.stringify(await window.__guess(s.url))]);}return o}"""))
