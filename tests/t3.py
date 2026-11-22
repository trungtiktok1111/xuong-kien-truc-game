import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':390,'height':800},has_touch=True)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text))
        await pg.goto('file:///home/claude/ed/index.html');await pg.wait_for_timeout(1000)
        await pg.evaluate("document.querySelector('.tabbtn[data-v=\"3d\"]').click()");await pg.wait_for_timeout(2500);await pg.screenshot(path='f1.png')
        print(errs[:6]);await b.close()
asyncio.run(main())
