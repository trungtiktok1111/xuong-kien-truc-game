from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1300,'height':850});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(1000)
    bb=pg.locator('#cv2').bounding_box()
    def sig():
        pg.mouse.move(5,5);pg.wait_for_timeout(250);return pg.evaluate("document.querySelector('#cv2').toDataURL().length")
    pg.evaluate("[...document.querySelectorAll('#pn2 button')].find(b=>/Chọn vùng/.test(b.textContent)).click()")
    x,y=bb['x'],bb['y']
    s0=sig()
    pg.mouse.move(x+300,y+250);pg.mouse.down();pg.mouse.move(x+400,y+330,steps=5);pg.mouse.up()
    for k in ['ArrowRight','ArrowRight','ArrowDown']:pg.keyboard.press(k)
    s1=sig();pg.keyboard.press('Control+d');s2=sig();pg.keyboard.press('h');s3=sig()
    pg.keyboard.press('Control+z');pg.keyboard.press('Control+z');pg.keyboard.press('Control+z');s4=sig()
    pg.mouse.move(x+330,y+280);pg.keyboard.press('Enter');pg.keyboard.press('f');pg.wait_for_timeout(300);s5=sig()
    print(s0,s1,s2,s3,s4,s5,errs)
    pg.screenshot(path='ux24.png');b.close()
