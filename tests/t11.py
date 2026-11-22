from playwright.sync_api import sync_playwright
import zipfile,io
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/ed/index.html');pg.wait_for_timeout(900)
    pg.evaluate("window.__dl=[];window.claude={use:async()=>({save:async o=>{window.__dl.push([o.filename,o.data]);}})}")
    pg.click('#relbtn');pg.wait_for_timeout(500);pg.screenshot(path='r1.png')
    for t in ['TẤT CẢ','Web / itch','Game PC']:
        pg.evaluate("t=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t)).click()",t);pg.wait_for_timeout(2500)
    import base64
    n=pg.evaluate("window.__dl.map(d=>[d[0],d[1].size])");print(n)
    arr=pg.evaluate("(async()=>{const b=await window.__dl[0][1].arrayBuffer();return Array.from(new Uint8Array(b))})()")
    z=zipfile.ZipFile(io.BytesIO(bytes(arr)));print(z.testzip());print([ (i.filename,i.file_size) for i in z.infolist()])
    open('/tmp/pwa_index.html','wb').write(z.read('pwa/index.html'))
    print(errs)
    q=b.new_page(viewport={'width':390,'height':800});e=[];q.on('pageerror',lambda x:e.append(str(x)));q.goto('file:///tmp/pwa_index.html');q.wait_for_timeout(2000);q.screenshot(path='r2.png');print(e)
