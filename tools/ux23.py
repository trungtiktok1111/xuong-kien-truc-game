from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1300,'height':850});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    cv=pg.locator('#v2d canvas').first;bb=cv.bounding_box()
    def px():
        pg.mouse.move(5,5);pg.wait_for_timeout(300)
        return pg.evaluate("(()=>{const c=document.querySelector('#v2d canvas');return c.toDataURL().length})()")
    a=px();pg.mouse.click(bb['x']+300,bb['y']+300);pg.wait_for_timeout(300);b2=px()
    pg.keyboard.press('Control+z');pg.wait_for_timeout(300);c=px()
    print(a,b2,c,errs);b.close()
