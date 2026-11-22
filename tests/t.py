import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':390,'height':800},has_touch=True)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type in('error','warning') and errs.append(m.text))
        await pg.goto('file:///home/claude/ed/index.html');await pg.wait_for_timeout(1200)
        await pg.screenshot(path='e1.png')
        # tab tileset
        await pg.click('.ptab[data-t=sheet]');await pg.wait_for_timeout(300);await pg.screenshot(path='e2.png')
        # vẽ một ô trên bản đồ
        await pg.click('.ptab[data-t=tools]')
        box=await pg.locator('#cv2').bounding_box()
        await pg.mouse.click(box['x']+100,box['y']+100);await pg.wait_for_timeout(200)
        # chọn vùng và lấy stamp
        await pg.click('text=⬚ Chọn vùng')
        await pg.mouse.move(box['x']+60,box['y']+60);await pg.mouse.down();await pg.mouse.move(box['x']+160,box['y']+140,steps=4);await pg.mouse.up()
        await pg.wait_for_timeout(200);await pg.screenshot(path='e3.png')
        await pg.click('text=📋 Lấy làm stamp');await pg.wait_for_timeout(200)
        await pg.mouse.click(box['x']+250,box['y']+200);await pg.wait_for_timeout(300);await pg.screenshot(path='e4.png')
        # 3D
        await pg.click('.tabbtn[data-v=3d]');await pg.wait_for_timeout(1500);await pg.screenshot(path='e5.png')
        b3=await pg.locator('#cv3').bounding_box()
        await pg.click('.ptab[data-t=tpl]');await pg.click('text=Tháp 3 tầng');await pg.wait_for_timeout(800);await pg.screenshot(path='e6.png')
        await pg.click('.ptab[data-t=build]');await pg.mouse.click(b3['x']+60,b3['y']+60);await pg.wait_for_timeout(300)
        await pg.click('.ptab[data-t=file]');await pg.wait_for_timeout(200)
        print(errs[:8]);await b.close()
asyncio.run(main())
